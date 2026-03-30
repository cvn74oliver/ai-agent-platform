import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { getSupabaseAdmin } from '../src/lib/supabase.ts'
import {
  loadGmailArtifactPublicationState,
  loadGmailPreviewIndexRowsForArtifactVersion,
} from '../src/lib/integrations/gmail/gmailArtifactStore.ts'
import {
  canonicalSenderProfileFromPersistedStats,
  normalizePatternMix,
  operatorProfileFromPersistedStats,
  resolveSenderSemanticsFromCompatibility,
} from '../src/lib/integrations/gmail/gmailSenderProfile.ts'
import { buildSemanticAnalyticsDistributions } from '../src/lib/integrations/gmail/gmailSemanticRollups.ts'
import { buildSharedGroupSemanticRollupFromSemanticAnalytics } from '../src/lib/integrations/gmail/gmailSemanticRollupContract.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const envFilePath = path.join(webRoot, '.env.local')

export const TARGET_CLUSTER_ID = 'subscription-senders'
export const MARKETING_SUBTYPE_KEYS = [
  'offer_campaign',
  'product_marketing_update',
  'editorial_newsletter',
]

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex <= 0) return null
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const contents = fs.readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    if (!(parsed.key in process.env)) {
      process.env[parsed.key] = parsed.value
    }
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function roundSharePct(count, total) {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((count / total) * 100)
}

function stableSubtypeCountRecord(counts) {
  return {
    offer_campaign: counts.offer_campaign || 0,
    product_marketing_update: counts.product_marketing_update || 0,
    editorial_newsletter: counts.editorial_newsletter || 0,
    unresolved_remainder: counts.unresolved_remainder || 0,
  }
}

function stablePatternClassCountRecord(counts) {
  return {
    promotional_cycle: counts.promotional_cycle || 0,
    service_update_cycle: counts.service_update_cycle || 0,
    transactional_cycle: counts.transactional_cycle || 0,
    security_cycle: counts.security_cycle || 0,
    human_correspondence_cycle: counts.human_correspondence_cycle || 0,
    social_activity_cycle: counts.social_activity_cycle || 0,
  }
}

async function loadSubscriptionSeedRows(params) {
  const rows = []
  let lastRank = 0

  while (true) {
    const { data, error } = await params.supabase
      .from('gmail_sender_workspace_seed_rows')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .eq('cluster_id', TARGET_CLUSTER_ID)
      .gt('default_rank', lastRank)
      .order('default_rank', { ascending: true })
      .limit(1000)

    if (error) {
      throw new Error(`Failed to load gmail_sender_workspace_seed_rows: ${error.message}`)
    }

    const batch = data || []
    rows.push(...batch)
    if (batch.length < 1000) break
    lastRank = normalizeCount(batch[batch.length - 1]?.default_rank)
    if (lastRank <= 0) break
  }

  return rows
}

async function loadSubscriptionClusterSummary(params) {
  const { data, error } = await params.supabase
    .from('gmail_cluster_summaries')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .eq('cluster_id', TARGET_CLUSTER_ID)
    .single()

  if (error) {
    throw new Error(`Failed to load gmail_cluster_summaries: ${error.message}`)
  }

  return data
}

async function loadSenderStatsBySender(params) {
  const statsBySender = new Map()
  const senders = Array.from(
    new Set(params.senders.map((sender) => normalizeText(sender)).filter(Boolean))
  )

  for (let index = 0; index < senders.length; index += 100) {
    const batch = senders.slice(index, index + 100)
    const { data, error } = await params.supabase
      .from('gmail_sender_stats')
      .select(
        [
          'sender',
          'message_count',
          'machine_probability',
          'human_probability',
          'category_distribution',
          'categorized_message_count',
          'uncategorized_message_count',
          'multi_category_message_count',
          'dominant_category',
          'dominant_category_confidence',
          'category_profile_mode',
          'pattern_mix',
          'dominant_pattern',
          'operator_profile_family',
          'operator_profile_mode',
          'operator_profile_confidence',
          'operator_profile_summary',
          'operator_profile_reasons',
          'operator_profile_source',
        ].join(',')
      )
      .eq('tenant_id', params.tenantId)
      .in('sender', batch)

    if (error) {
      throw new Error(`Failed to load gmail_sender_stats: ${error.message}`)
    }

    for (const row of data || []) {
      statsBySender.set(normalizeText(row.sender), row)
    }
  }

  return statsBySender
}

function buildPreviewRowsBySenderKey(previewRows) {
  const previewRowsBySenderKey = new Map()
  for (const row of previewRows) {
    const senderKey = normalizeText(row.sender_key)
    if (!senderKey) continue
    const bucket = previewRowsBySenderKey.get(senderKey) || []
    bucket.push(row)
    previewRowsBySenderKey.set(senderKey, bucket)
  }
  return previewRowsBySenderKey
}

function baselineSemanticForSeedRow(row) {
  const payload = row.seed_payload || {}
  const semanticFamily = payload.semantic_family || {}
  const semanticPattern = payload.semantic_pattern || {}

  return {
    sender: row.sender,
    sender_key: row.sender_key,
    published_subtype_key: normalizeText(row.semantic_subtype_key) || null,
    semantic_family: {
      family: normalizeText(semanticFamily.family) || normalizeText(row.semantic_family_key) || null,
      subtype_key: normalizeText(semanticFamily.subtype_key) || normalizeText(row.semantic_subtype_key) || null,
    },
    semantic_pattern: {
      pattern_class:
        normalizeText(semanticPattern.pattern_class) || normalizeText(row.semantic_pattern_key) || null,
    },
  }
}

function projectedSemanticForSeedRow(params) {
  const statsRow = params.statsBySender.get(normalizeText(params.row.sender)) || null
  const previewRows = params.previewRowsBySenderKey.get(normalizeText(params.row.sender_key)) || []
  const categoryProfile = canonicalSenderProfileFromPersistedStats({
    categoryDistribution: statsRow?.category_distribution,
    categorizedMessageCount: statsRow?.categorized_message_count,
    uncategorizedMessageCount: statsRow?.uncategorized_message_count,
    multiCategoryMessageCount: statsRow?.multi_category_message_count,
    dominantCategory: statsRow?.dominant_category,
    dominantCategoryConfidence: statsRow?.dominant_category_confidence,
    categoryProfileMode: statsRow?.category_profile_mode,
  })
  const patternMix = normalizePatternMix(statsRow?.pattern_mix)
  const operatorProfile = operatorProfileFromPersistedStats({
    family: statsRow?.operator_profile_family,
    mode: statsRow?.operator_profile_mode,
    confidence: statsRow?.operator_profile_confidence,
    summary: statsRow?.operator_profile_summary,
    reasons: statsRow?.operator_profile_reasons,
    source: statsRow?.operator_profile_source,
  })
  const dominantPattern =
    normalizeText(statsRow?.dominant_pattern) ||
    normalizeText(patternMix[0]?.pattern) ||
    normalizeText(params.row.seed_payload?.dominant_pattern) ||
    'Thin history'
  const totalMessageCount =
    normalizeCount(statsRow?.message_count) ||
    normalizeCount(params.row.seed_payload?.total_sender_messages)

  const semantic = resolveSenderSemanticsFromCompatibility({
    sender: params.row.sender,
    subjectHints: previewRows.map((previewRow) => previewRow.subject || ''),
    totalMessageCount,
    categoryProfile,
    patternMix,
    dominantPattern,
    operatorProfile,
    machineProbability:
      typeof statsRow?.machine_probability === 'number' && Number.isFinite(statsRow.machine_probability)
        ? statsRow.machine_probability
        : null,
    humanProbability:
      typeof statsRow?.human_probability === 'number' && Number.isFinite(statsRow.human_probability)
        ? statsRow.human_probability
        : null,
    sourceKind: 'sender_stats',
  })

  return {
    sender: params.row.sender,
    sender_key: params.row.sender_key,
    published_subtype_key: normalizeText(params.row.semantic_subtype_key) || null,
    semantic_family: semantic.semantic_family,
    semantic_pattern: semantic.semantic_pattern,
  }
}

function buildSnapshot(params) {
  const marketingSenders = params.senders.filter(
    (sender) => normalizeText(sender.semantic_family?.family) === 'marketing_promotional'
  )
  const subtypeCounts = {
    offer_campaign: 0,
    product_marketing_update: 0,
    editorial_newsletter: 0,
    unresolved_remainder: 0,
  }
  const patternClassCounts = {
    promotional_cycle: 0,
    service_update_cycle: 0,
    transactional_cycle: 0,
    security_cycle: 0,
    human_correspondence_cycle: 0,
    social_activity_cycle: 0,
  }

  for (const sender of marketingSenders) {
    const subtypeKey = normalizeText(sender.semantic_family?.subtype_key) || null
    if (subtypeKey && subtypeKey in subtypeCounts) {
      subtypeCounts[subtypeKey] += 1
    } else {
      subtypeCounts.unresolved_remainder += 1
    }

    const patternClass = normalizeText(sender.semantic_pattern?.pattern_class)
    if (patternClass && patternClass in patternClassCounts) {
      patternClassCounts[patternClass] += 1
    }
  }

  const resolvedMarketingSubtypeSenderCount =
    subtypeCounts.offer_campaign +
    subtypeCounts.product_marketing_update +
    subtypeCounts.editorial_newsletter

  return {
    artifact_version: params.artifactVersion,
    cluster_id: TARGET_CLUSTER_ID,
    sender_count: params.senderCount,
    cleanup_group_message_count: params.cleanupGroupMessageCount,
    marketing_promotional_sender_count: marketingSenders.length,
    resolved_marketing_subtype_sender_count: resolvedMarketingSubtypeSenderCount,
    resolved_marketing_subtype_share_pct: roundSharePct(
      resolvedMarketingSubtypeSenderCount,
      marketingSenders.length
    ),
    largest_unresolved_promotional_remainder_sender_count: subtypeCounts.unresolved_remainder,
    subtype_sender_counts: stableSubtypeCountRecord(subtypeCounts),
    headline_family_subtype_persistence_state:
      normalizeText(params.headline?.family_subtype_persistence_state) || null,
    headline_pattern_subtype_persistence_state:
      normalizeText(params.headline?.pattern_subtype_persistence_state) || null,
    marketing_pattern_class_sender_counts: stablePatternClassCountRecord(patternClassCounts),
  }
}

function buildSubtypePersistence(beforeSenders, afterSenders) {
  const beforeBySenderKey = new Map(beforeSenders.map((sender) => [normalizeText(sender.sender_key), sender]))
  let baselineResolvedSenderCount = 0
  let preservedResolvedSenderCount = 0
  let preservedSameSubtypeSenderCount = 0
  let upgradedFromRemainderSenderCount = 0

  for (const afterSender of afterSenders) {
    const senderKey = normalizeText(afterSender.sender_key)
    const beforeSender = beforeBySenderKey.get(senderKey) || null
    const beforeSubtype = normalizeText(beforeSender?.semantic_family?.subtype_key) || null
    const afterSubtype = normalizeText(afterSender.semantic_family?.subtype_key) || null

    if (beforeSubtype) {
      baselineResolvedSenderCount += 1
      if (afterSubtype) preservedResolvedSenderCount += 1
      if (afterSubtype && afterSubtype === beforeSubtype) {
        preservedSameSubtypeSenderCount += 1
      }
      continue
    }

    if (afterSubtype) {
      upgradedFromRemainderSenderCount += 1
    }
  }

  return {
    baseline_resolved_sender_count: baselineResolvedSenderCount,
    preserved_resolved_sender_count: preservedResolvedSenderCount,
    preserved_same_subtype_sender_count: preservedSameSubtypeSenderCount,
    upgraded_from_remainder_sender_count: upgradedFromRemainderSenderCount,
  }
}

export async function loadSubscriptionSemanticAuditData() {
  loadEnvFile(envFilePath)

  const tenantId =
    process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
  const analysisScope = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
  const supabase = await getSupabaseAdmin()
  const publication = await loadGmailArtifactPublicationState({
    supabase,
    tenantId,
    analysisScope,
  })

  if (!publication?.published_version) {
    throw new Error('Expected a published Gmail artifact version.')
  }

  const artifactVersion = publication.published_version
  const [seedRows, clusterSummary, previewRows] = await Promise.all([
    loadSubscriptionSeedRows({
      supabase,
      tenantId,
      analysisScope,
      artifactVersion,
    }),
    loadSubscriptionClusterSummary({
      supabase,
      tenantId,
      analysisScope,
      artifactVersion,
    }),
    loadGmailPreviewIndexRowsForArtifactVersion({
      supabase,
      tenantId,
      analysisScope,
      artifactVersion,
      clusterId: TARGET_CLUSTER_ID,
    }),
  ])

  const statsBySender = await loadSenderStatsBySender({
    supabase,
    tenantId,
    senders: seedRows.map((row) => row.sender),
  })

  return {
    tenantId,
    analysisScope,
    artifactVersion,
    publication,
    seedRows,
    clusterSummary,
    statsBySender,
    previewRowsBySenderKey: buildPreviewRowsBySenderKey(previewRows),
  }
}

export function buildSubscriptionSemanticAudit(data) {
  const beforeSenders = data.seedRows.map((row) => baselineSemanticForSeedRow(row))
  const afterSenders = data.seedRows.map((row) =>
    projectedSemanticForSeedRow({
      row,
      statsBySender: data.statsBySender,
      previewRowsBySenderKey: data.previewRowsBySenderKey,
    })
  )
  const projectedSemanticAnalytics = buildSemanticAnalyticsDistributions(afterSenders)
  const projectedSemanticRollup = buildSharedGroupSemanticRollupFromSemanticAnalytics({
    clusterId: TARGET_CLUSTER_ID,
    senderCount: data.seedRows.length,
    messageCount: normalizeCount(data.clusterSummary?.message_count),
    semanticAnalytics: projectedSemanticAnalytics,
  })
  const baselineHeadline =
    data.clusterSummary?.summary_payload?.semantic_rollup?.headline || null

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    tenant_id: data.tenantId,
    analysis_scope: data.analysisScope,
    grounding_artifact_version: data.artifactVersion,
    cluster_id: TARGET_CLUSTER_ID,
    before: buildSnapshot({
      artifactVersion: data.artifactVersion,
      senderCount: data.seedRows.length,
      cleanupGroupMessageCount: normalizeCount(data.clusterSummary?.message_count),
      senders: beforeSenders,
      headline: baselineHeadline,
    }),
    after: buildSnapshot({
      artifactVersion: data.artifactVersion,
      senderCount: data.seedRows.length,
      cleanupGroupMessageCount: normalizeCount(data.clusterSummary?.message_count),
      senders: afterSenders,
      headline: projectedSemanticRollup.headline,
    }),
    subtype_persistence: buildSubtypePersistence(beforeSenders, afterSenders),
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const data = await loadSubscriptionSemanticAuditData()
  const audit = buildSubscriptionSemanticAudit(data)
  console.log(JSON.stringify(audit, null, 2))
}
