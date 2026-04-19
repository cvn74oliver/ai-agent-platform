import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { getSupabaseAdmin } from '../src/lib/supabase.ts'
import {
  analysisScopeRowInclusionLowerBoundMs,
  assignSenderCleanupGroupDecision,
} from '../src/lib/integrations/gmail/inboxAnalysis.ts'
import {
  loadGmailArtifactPublicationState,
  loadGmailSenderScopeRollupsForArtifactVersion,
} from '../src/lib/integrations/gmail/gmailArtifactStore.ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const envFilePath = path.join(webRoot, '.env.local')
const ANALYSIS_SCOPE = '30d'

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

function utcDay(ms) {
  const date = new Date(ms)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`
}

function sortRecordDescending(record) {
  return Object.fromEntries(Object.entries(record).sort((left, right) => right[1] - left[1]))
}

loadEnvFile(envFilePath)

const tenantId =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const supabase = await getSupabaseAdmin()
const nowMs = Date.now()
const recentCutoffMs = analysisScopeRowInclusionLowerBoundMs(ANALYSIS_SCOPE, nowMs)

if (recentCutoffMs == null) {
  throw new Error(`Expected ${ANALYSIS_SCOPE} to resolve to a bounded cutoff.`)
}

const publication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId,
  analysisScope: ANALYSIS_SCOPE,
})

const artifactVersion = publication?.published_version || null
const rollups = artifactVersion
  ? await loadGmailSenderScopeRollupsForArtifactVersion({
      supabase,
      tenantId,
      analysisScope: ANALYSIS_SCOPE,
      artifactVersion,
    })
  : []

const recentRows = []
let from = 0
const pageSize = 1000
while (true) {
  const { data, error } = await supabase
    .from('gmail_messages')
    .select(
      'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
    )
    .eq('tenant_id', tenantId)
    .eq('is_in_inbox', true)
    .gte('internal_date_ms', recentCutoffMs)
    .order('internal_date_ms', { ascending: false })
    .range(from, from + pageSize - 1)

  if (error) {
    throw new Error(`Failed to load recent gmail_messages: ${error.message}`)
  }

  const batch = data || []
  recentRows.push(...batch)
  if (batch.length < pageSize) break
  from += pageSize
}

const rowsBySender = new Map()
for (const row of recentRows) {
  const sender = (row.sender || '').toLowerCase().trim() || 'unknown sender'
  const bucket = rowsBySender.get(sender) || []
  bucket.push(row)
  rowsBySender.set(sender, bucket)
}

const liveDaySummary = new Map()
const liveSubscriptionDayCounts = new Map()
const excludedMarketingLikeSenders = []

for (const row of recentRows) {
  const day = utcDay(row.internal_date_ms)
  const entry = liveDaySummary.get(day) || {
    total: 0,
    promotions: 0,
    social: 0,
    primary: 0,
  }
  entry.total += 1
  const categoryLabels = row.category_labels || []
  if (categoryLabels.includes('CATEGORY_PROMOTIONS')) entry.promotions += 1
  if (categoryLabels.includes('CATEGORY_SOCIAL')) entry.social += 1
  if (categoryLabels.includes('CATEGORY_PRIMARY')) entry.primary += 1
  liveDaySummary.set(day, entry)
}

for (const [sender, senderRows] of rowsBySender.entries()) {
  const decision = assignSenderCleanupGroupDecision({
    sender,
    rows: senderRows,
    nowMs,
  })

  if (decision.groupSpec.cluster_id === 'subscription-senders') {
    for (const row of senderRows) {
      const day = utcDay(row.internal_date_ms)
      liveSubscriptionDayCounts.set(day, (liveSubscriptionDayCounts.get(day) || 0) + 1)
    }
    continue
  }

  const promotionalRows = senderRows.filter((row) =>
    (row.category_labels || []).includes('CATEGORY_PROMOTIONS')
  ).length
  const socialRows = senderRows.filter((row) =>
    (row.category_labels || []).includes('CATEGORY_SOCIAL')
  ).length
  const primaryRows = senderRows.filter((row) =>
    (row.category_labels || []).includes('CATEGORY_PRIMARY')
  ).length
  const sampleText = senderRows
    .map((row) => `${row.sender || ''} ${row.subject || ''}`.toLowerCase())
    .join(' ')
  const hasMarketingCue =
    promotionalRows > 0 ||
    /newsletter|unsubscribe|manage preferences|promo|offer|sale|digest|roundup|weekly update|daily update/.test(
      sampleText
    )

  if (!hasMarketingCue) continue

  excludedMarketingLikeSenders.push({
    sender,
    assigned_group_id: decision.groupSpec.cluster_id,
    exclusion_reason: decision.exclusionReason,
    assignment_reason: decision.assignmentReason,
    message_count: senderRows.length,
    promotional_rows: promotionalRows,
    social_rows: socialRows,
    primary_rows: primaryRows,
    sample_subjects: senderRows.slice(0, 3).map((row) => row.subject || null),
  })
}

excludedMarketingLikeSenders.sort(
  (left, right) =>
    right.message_count - left.message_count || left.sender.localeCompare(right.sender)
)

const rollupGroupCounts = sortRecordDescending(
  rollups.reduce((accumulator, row) => {
    accumulator[row.assigned_cleanup_group_id] =
      (accumulator[row.assigned_cleanup_group_id] || 0) + 1
    return accumulator
  }, {})
)

const liveExcludedGroupCounts = sortRecordDescending(
  excludedMarketingLikeSenders.reduce((accumulator, row) => {
    accumulator[row.assigned_group_id] = (accumulator[row.assigned_group_id] || 0) + 1
    return accumulator
  }, {})
)

const liveExcludedReasonCounts = sortRecordDescending(
  excludedMarketingLikeSenders.reduce((accumulator, row) => {
    const key = row.exclusion_reason || 'none'
    accumulator[key] = (accumulator[key] || 0) + 1
    return accumulator
  }, {})
)

const days = Array.from(liveDaySummary.keys()).sort()
const missingPromotionalDays = days.filter((day) => {
  const entry = liveDaySummary.get(day)
  return (entry?.promotions || 0) > 0 && (liveSubscriptionDayCounts.get(day) || 0) === 0
})

console.log(
  JSON.stringify(
    {
      ok: true,
      generated_at: new Date().toISOString(),
      tenant_id: tenantId,
      analysis_scope: ANALYSIS_SCOPE,
      artifact_version: artifactVersion,
      artifact_rollup_group_counts: rollupGroupCounts,
      live_recent_inbox: {
        total_rows: recentRows.length,
        total_senders: rowsBySender.size,
        active_day_count: days.length,
        missing_promotional_days: missingPromotionalDays,
        day_samples: days.slice(-15).map((day) => ({
          day,
          ...liveDaySummary.get(day),
          subscription_cluster_messages: liveSubscriptionDayCounts.get(day) || 0,
        })),
      },
      live_excluded_marketing_like_senders: {
        count: excludedMarketingLikeSenders.length,
        assigned_group_counts: liveExcludedGroupCounts,
        exclusion_reason_counts: liveExcludedReasonCounts,
        samples: excludedMarketingLikeSenders.slice(0, 20),
      },
    },
    null,
    2
  )
)
