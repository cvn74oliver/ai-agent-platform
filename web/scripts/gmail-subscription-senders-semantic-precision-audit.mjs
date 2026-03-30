import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  MARKETING_SUBTYPE_KEYS,
  TARGET_CLUSTER_ID,
  loadSubscriptionSemanticAuditData,
} from './gmail-subscription-senders-semantic-audit.mjs'
import {
  canonicalSenderProfileFromPersistedStats,
  normalizePatternMix,
  operatorProfileFromPersistedStats,
  resolveSenderSemanticsFromCompatibility,
} from '../src/lib/integrations/gmail/gmailSenderProfile.ts'

const scriptPath = fileURLToPath(import.meta.url)

const EDITORIAL_PATTERNS = [
  /\bnewsletter\b/i,
  /\bdigest\b/i,
  /\broundup\b/i,
  /\bbriefing\b/i,
  /\bedition\b/i,
  /\bissue\b/i,
  /\brecap\b/i,
  /\bweekly\b/i,
  /\bdaily\b/i,
  /\bmonthly\b/i,
  /\btop stories\b/i,
  /\breads\b/i,
]

const OFFER_PATTERNS = [
  /\bsale\b/i,
  /\boffer\b/i,
  /\bcoupon\b/i,
  /\bdiscount\b/i,
  /\bdeal\b/i,
  /\bclearance\b/i,
  /\bsave\b/i,
  /\blast chance\b/i,
  /\b\d+%\s*off\b/i,
  /\bfree shipping\b/i,
  /\bpromo\b/i,
]

const PRODUCT_PATTERNS = [
  /\bintroducing\b/i,
  /\bannouncing\b/i,
  /\bannouncement\b/i,
  /\blaunch\b/i,
  /\brelease(?:d)?\b/i,
  /\bnew feature\b/i,
  /\bfeature\b/i,
  /\bproduct update\b/i,
  /\bnow available\b/i,
  /\bcoming soon\b/i,
  /\bwebinar\b/i,
  /\bdemo\b/i,
  /\broadmap\b/i,
  /\bversion\b/i,
]

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function countCueHits(subjects, patterns) {
  let hits = 0
  for (const subject of subjects) {
    const text = normalizeText(subject).toLowerCase()
    if (!text) continue
    if (patterns.some((pattern) => pattern.test(text))) hits += 1
  }
  return hits
}

function cueCountsForSubjects(subjects) {
  return {
    editorial_newsletter: countCueHits(subjects, EDITORIAL_PATTERNS),
    offer_campaign: countCueHits(subjects, OFFER_PATTERNS),
    product_marketing_update: countCueHits(subjects, PRODUCT_PATTERNS),
  }
}

function projectedSubtypeForRow(data, row) {
  const statsRow = data.statsBySender.get(normalizeText(row.sender)) || null
  const previewRows = data.previewRowsBySenderKey.get(normalizeText(row.sender_key)) || []
  const previewSubjects = previewRows.map((previewRow) => previewRow.subject || '')
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
    normalizeText(row.seed_payload?.dominant_pattern) ||
    'Thin history'
  const semantic = resolveSenderSemanticsFromCompatibility({
    sender: row.sender,
    subjectHints: previewSubjects,
    totalMessageCount:
      normalizeCount(statsRow?.message_count) ||
      normalizeCount(row.seed_payload?.total_sender_messages),
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
    projected_subtype_key: normalizeText(semantic.semantic_family.subtype_key) || null,
    dominant_pattern: dominantPattern,
    total_sender_messages:
      normalizeCount(statsRow?.message_count) ||
      normalizeCount(row.seed_payload?.total_sender_messages),
    cue_counts: cueCountsForSubjects(previewSubjects),
    preview_subjects: previewSubjects.slice(0, 5),
    pattern_mix: patternMix.slice(0, 5),
  }
}

function transitionCounts(rows, subtypeKey) {
  const counts = {
    same_subtype: 0,
    from_remainder: 0,
    from_other_subtype: 0,
  }

  for (const row of rows) {
    if (row.projected_subtype_key !== subtypeKey) continue
    if (row.published_subtype_key === subtypeKey) {
      counts.same_subtype += 1
    } else if (!row.published_subtype_key) {
      counts.from_remainder += 1
    } else {
      counts.from_other_subtype += 1
    }
  }

  return counts
}

function sampleRows(rows, subtypeKey) {
  return rows
    .filter((row) => row.projected_subtype_key === subtypeKey)
    .sort((left, right) => {
      const leftCue = left.cue_counts[subtypeKey] || 0
      const rightCue = right.cue_counts[subtypeKey] || 0
      return (
        rightCue - leftCue ||
        right.total_sender_messages - left.total_sender_messages ||
        left.sender.localeCompare(right.sender)
      )
    })
    .slice(0, 12)
    .map((row) => ({
      sender: row.sender,
      sender_key: row.sender_key,
      published_subtype_key: row.published_subtype_key,
      projected_subtype_key: row.projected_subtype_key,
      total_sender_messages: row.total_sender_messages,
      dominant_pattern: row.dominant_pattern,
      cue_counts: row.cue_counts,
      preview_subjects: row.preview_subjects,
      pattern_mix: row.pattern_mix,
    }))
}

function buildPrecisionAudit(data) {
  const projectedRows = data.seedRows
    .filter((row) => normalizeText(row.semantic_family_key) === 'marketing_promotional')
    .map((row) => ({
      sender: row.sender,
      sender_key: row.sender_key,
      published_subtype_key: normalizeText(row.semantic_subtype_key) || null,
      ...projectedSubtypeForRow(data, row),
    }))

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    tenant_id: data.tenantId,
    analysis_scope: data.analysisScope,
    grounding_artifact_version: data.artifactVersion,
    cluster_id: TARGET_CLUSTER_ID,
    subtype_precision: Object.fromEntries(
      MARKETING_SUBTYPE_KEYS.map((subtypeKey) => [
        subtypeKey,
        {
          projected_sender_count: projectedRows.filter(
            (row) => row.projected_subtype_key === subtypeKey
          ).length,
          transition_counts: transitionCounts(projectedRows, subtypeKey),
          samples: sampleRows(projectedRows, subtypeKey),
        },
      ])
    ),
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath

if (isMain) {
  const data = await loadSubscriptionSemanticAuditData()
  const audit = buildPrecisionAudit(data)
  console.log(JSON.stringify(audit, null, 2))
}
