import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildCanonicalSenderCategoryProfile,
  buildCanonicalSenderCategorySummary,
  buildConservativeOperatorProfile,
  buildPatternMixFromCounts,
  classifySenderPatternFromSubjectText,
  GMAIL_PATTERN_LABEL_THIN_HISTORY,
  insufficientDataCanonicalSenderProfile,
  insufficientDataOperatorProfile,
  normalizePatternMix,
  resolveCanonicalSenderCategoryFromLabels,
  resolveSenderSemanticsFromCompatibility,
} from '@/lib/integrations/gmail/gmailSenderProfile'
import {
  buildCompatibilityDominantPatternDistribution,
  buildCompatibilityOperatorProfileFamilyDistribution,
  buildCompatibilityOperatorProfileModeDistribution,
  buildSemanticAnalyticsDistributions,
  dominantPatternCompatibilityLabel,
} from '@/lib/integrations/gmail/gmailSemanticRollups'
import {
  assertSharedGroupSemanticRollupArtifactCongruence,
  buildPersistedSemanticRollupArtifactFields,
} from '@/lib/integrations/gmail/gmailSemanticRollupContract'
import {
  materializeGmailReviewUnits,
  validateGmailReviewUnitContract,
} from '@/lib/integrations/gmail/gmailReviewUnitContract'
import {
  activityTimelineBucketKeyForTimestamp,
  activityTimelineGranularityForScope,
  assignSenderCleanupGroupDecision,
  buildCanonicalSenderWorkspaceActivityTimeline,
  buildCleanupGroupIntelligence,
  buildGmailPressureTrendData,
  buildQueryClusterBrowserSenderBreakdown,
  isCleanupCandidateGroupId,
  classifySenderPatternFromSubject,
  planCleanupGroupArtifactSurfaces,
  isLikelyHumanPriorityRow,
  isLikelyMachineGeneratedRow,
  normalizeSender,
  rowCategoryHas,
  rowSenderDomain,
  scopeDays,
  senderSignalFromText,
  type GmailAnalysisScope,
  type GmailCleanupClusterSpec,
  type CleanupGroupArtifactSurfaceDecision,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailPreviewIndexRowsForArtifactVersion,
  loadGmailSenderScopeRollupsForArtifactVersion,
  type GmailArtifactAnalysisScope,
  type GmailArtifactPublicationRestoreState,
  type GmailClusterSummaryArtifactRow,
  type GmailMailboxIntelligenceBucketRow,
  type GmailMailboxIntelligenceSnapshotRow,
  type GmailPreviewIndexRow,
  type GmailSenderScopeRollupRow,
  type GmailSenderWorkspaceSeedHeaderRow,
  type GmailSenderWorkspaceSeedRow,
  upsertGmailClusterSummaries,
  upsertGmailMailboxIntelligenceBuckets,
  upsertGmailMailboxIntelligenceSnapshots,
  upsertGmailPreviewIndexRows,
  upsertGmailSenderScopeRollupRows,
  upsertGmailSenderWorkspaceSeedHeaders,
  upsertGmailSenderWorkspaceSeedRows,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import type { GmailMailboxIndexRow } from '@/lib/integrations/gmail/gmailMailboxIndexer'
import {
  GMAIL_PRESSURE_TREND_ARTIFACT_WINDOWS,
  gmailPressureTrendArtifactBucketFamilyForWindow,
} from '@/lib/integrations/gmail/gmailPressureTrendArtifacts'
import type {
  GmailAssignedCleanupGroupId,
  GmailCleanupAssignmentReason,
  GmailCleanupExclusionReason,
  GmailCanonicalSenderCategoryLabel,
  GmailMailboxIntelligenceData,
  GmailPressureTimelineBucket,
  GmailSenderWorkspaceData,
  GmailSharedGroupSemanticRollup,
} from '@/lib/runtime/gmailCleanupWorkspace'

const STREAM_BATCH_SIZE = 1000
const WRITE_BATCH_SIZE = 500
const FINALIZE_SENDER_STATS_BATCH_SIZE = 50
const SUPABASE_RETRY_ATTEMPTS = 4
const SUPABASE_RETRY_DELAY_MS = 750
const STRUCTURAL_PREVIEW_SEED_LIMIT = 5

function reviewUnitBasisForParent(params: {
  sourceClusterId: string
  projectedClusterId: string
}): GmailSharedGroupSemanticRollup['review_unit_plan']['basis'] {
  if (
    params.projectedClusterId === 'semantic.marketing_subscriptions' ||
    params.projectedClusterId.startsWith('semantic-parent:subscription-senders:')
  ) {
    return 'subtype-first'
  }
  if (
    params.projectedClusterId === 'structural.protected_trust' ||
    params.sourceClusterId === 'protected-trusted-senders'
  ) {
    return 'protection-reason-first'
  }
  if (
    params.projectedClusterId === 'structural.unresolved' ||
    params.sourceClusterId === 'needs-review-senders'
  ) {
    return 'exclusion-reason-first'
  }
  return 'family-first'
}

function latestReviewUnitArtifactCutoffAt(
  drafts: Array<{
    clusterSeedSenders: Array<{ seedRow: GmailSenderWorkspaceSeedRow }>
  }>
): string {
  const timestamps = drafts
    .flatMap((draft) => draft.clusterSeedSenders.map((entry) => entry.seedRow.last_activity_at))
    .filter(
      (value): value is string =>
        typeof value === 'string' && Number.isFinite(Date.parse(value)) && Date.parse(value) > 0
    )
    .sort((left, right) => Date.parse(right) - Date.parse(left))
  if (!timestamps[0]) {
    throw new Error('Review-unit candidate generation requires a deterministic artifact cutoff timestamp.')
  }
  return timestamps[0]
}

export type GmailMailboxStreamRow = {
  tenant_id: string
  message_id: string
  thread_id: string | null
  sender: string | null
  sender_key: string
  subject: string | null
  internal_date_ms: number | null
  date: string | null
  label_ids: string[]
  category_labels: string[]
  is_in_inbox: boolean
  is_unread: boolean
  is_starred: boolean
  is_important: boolean
  indexed_at: string
  updated_at: string
}

type GmailSenderStatsWriteRow = {
  tenant_id: string
  sender: string
  message_count: number
  recent_count_30d: number
  machine_probability: number
  human_probability: number
  first_seen: string | null
  last_seen: string | null
  category_distribution: Record<string, unknown>
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailCanonicalSenderCategoryLabel | null
  dominant_category_confidence: string | null
  category_profile_mode: string
  pattern_mix: Record<string, unknown>
  dominant_pattern: string | null
  operator_profile_family: string
  operator_profile_mode: string
  operator_profile_confidence: string | null
  operator_profile_summary: string
  operator_profile_reasons: string[]
  operator_profile_source: string
  updated_at: string
}

type WholeMailboxAggregateBucket = {
  count: number
  composition_counts: Record<string, number>
  machine_like_count: number
  human_like_count: number
  protected_count: number
}

type SenderWorkspaceAnalyticsSeedSender = {
  sender: string
  sender_key: string
  cleanup_group_message_count: number
  last_activity: string | null
  first_seen?: string | null
  category_summary: string
  semantic_family: GmailSenderWorkspaceData['senders'][number]['semantic_family']
  semantic_pattern: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']
  operator_profile_family: GmailSenderWorkspaceData['senders'][number]['operator_profile_family']
  dominant_pattern: string
  operator_profile_mode: GmailSenderWorkspaceData['senders'][number]['operator_profile_mode']
  category_summary_source: GmailSenderWorkspaceData['senders'][number]['category_summary_source']
}

export type GmailWholeMailboxAggregateCheckpoint = {
  timeline_granularity: 'day' | 'week' | 'month'
  category_counts: Record<string, number>
  human_automation_counts: Record<string, number>
  timeline_buckets: Record<string, WholeMailboxAggregateBucket>
  protected_message_count: number
  likely_human_message_count: number
}

export type GmailClusterSpecSnapshot = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  why_selected: string | null
  risk_note: string | null
  safety_note: string | null
}

export type GmailArtifactBuildCursor = {
  sender_key: string
  internal_date_ms: number | null
  message_id: string
}

export type GmailArtifactCheckpointPayload = {
  cursor: GmailArtifactBuildCursor | null
  whole_mailbox_aggregate: GmailWholeMailboxAggregateCheckpoint
  cluster_specs: Record<string, GmailClusterSpecSnapshot>
  reference_now_ms?: number | null
  publication_restore_state?: GmailArtifactPublicationRestoreState | null
}

export type GmailSenderProjectionProgress = {
  processed_sender_count: number
  processed_message_count: number
  matched_cluster_count: number
  last_cursor: GmailArtifactBuildCursor | null
  checkpoint: GmailArtifactCheckpointPayload
}

export const GMAIL_ARTIFACT_FINALIZE_WRITE_STAGES = [
  'writing_preview_index_rows',
  'writing_seed_rows',
  'writing_seed_headers',
  'writing_cluster_summaries',
  'writing_mailbox_intelligence_snapshots',
  'writing_mailbox_intelligence_buckets',
] as const

export type GmailArtifactFinalizeWriteStage =
  (typeof GMAIL_ARTIFACT_FINALIZE_WRITE_STAGES)[number]

export type GmailArtifactFinalizeStage =
  | 'loading_finalize_inputs'
  | 'building_finalize_rows'
  | GmailArtifactFinalizeWriteStage
  | 'finalize_completed'

export type GmailArtifactFinalizeInputRowCounts = {
  sender_scope_rollups: number
  preview_index_rows: number
}

export type GmailArtifactFinalizeDerivedRowCounts = {
  sender_workspace_seed_headers: number
  sender_workspace_seed_rows: number
  cluster_summaries: number
  mailbox_intelligence_snapshots: number
  mailbox_intelligence_buckets: number
  preview_index_rows: number
}

export type GmailArtifactFinalizeCheckpoint = {
  current_stage: GmailArtifactFinalizeStage | null
  completed_write_stages: GmailArtifactFinalizeWriteStage[]
  input_row_counts: GmailArtifactFinalizeInputRowCounts | null
  derived_row_counts: GmailArtifactFinalizeDerivedRowCounts | null
  started_at: string | null
  updated_at: string | null
  completed_at: string | null
}

export type GmailArtifactFinalizeProgress = {
  stage: GmailArtifactFinalizeStage
  checkpoint: GmailArtifactFinalizeCheckpoint
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value)
  return normalized ? normalized : null
}

function normalizeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function normalizePublicationBuildStatus(
  value: unknown
): GmailArtifactPublicationRestoreState['build_status'] {
  return value === 'idle' || value === 'building' || value === 'published' || value === 'failed'
    ? value
    : 'idle'
}

function normalizePublicationFreshnessState(
  value: unknown
): GmailArtifactPublicationRestoreState['freshness_state'] {
  return value === 'fresh' ||
    value === 'stale' ||
    value === 'refresh_pending' ||
    value === 'refresh_in_progress' ||
    value === 'refresh_failed' ||
    value === 'refresh_skipped' ||
    value === 'full_rebuild_required'
    ? value
    : 'stale'
}

function normalizePublicationRefreshStrategy(
  value: unknown
): GmailArtifactPublicationRestoreState['refresh_strategy'] {
  return value === 'incremental' || value === 'full_rebuild' ? value : null
}

function parsePublicationRestoreState(value: unknown): GmailArtifactPublicationRestoreState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const restoreState = value as Partial<GmailArtifactPublicationRestoreState>
  return {
    published_version: normalizeNullableText(restoreState.published_version),
    published_at: normalizeNullableText(restoreState.published_at),
    building_version: normalizeNullableText(restoreState.building_version),
    build_status: normalizePublicationBuildStatus(restoreState.build_status),
    last_error: normalizeNullableText(restoreState.last_error),
    last_error_at: normalizeNullableText(restoreState.last_error_at),
    last_index_state_updated_at: normalizeNullableText(restoreState.last_index_state_updated_at),
    last_indexed_message_count:
      typeof restoreState.last_indexed_message_count === 'number' &&
      Number.isFinite(restoreState.last_indexed_message_count)
        ? Math.max(0, Math.round(restoreState.last_indexed_message_count))
        : null,
    freshness_state: normalizePublicationFreshnessState(restoreState.freshness_state),
    freshness_reason: normalizeNullableText(restoreState.freshness_reason),
    refresh_strategy: normalizePublicationRefreshStrategy(restoreState.refresh_strategy),
    refresh_requested_at: normalizeNullableText(restoreState.refresh_requested_at),
    refresh_started_at: normalizeNullableText(restoreState.refresh_started_at),
    refresh_completed_at: normalizeNullableText(restoreState.refresh_completed_at),
    refresh_job_id: normalizeNullableText(restoreState.refresh_job_id),
    refresh_sync_run_id: normalizeNullableText(restoreState.refresh_sync_run_id),
  }
}

function buildSeedRowSemanticPersistence(params: {
  semantic: Pick<
    GmailSenderWorkspaceData['senders'][number],
    'semantic_family' | 'semantic_pattern'
  >
}): {
  semantic_family_key: string
  semantic_subtype_key: string | null
  semantic_pattern_key: string
  semantic_family_payload: GmailSenderWorkspaceData['senders'][number]['semantic_family']
  semantic_pattern_payload: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']
} {
  return {
    semantic_family_key: params.semantic.semantic_family.family,
    semantic_subtype_key: normalizeNullableText(params.semantic.semantic_family.subtype_key),
    semantic_pattern_key: params.semantic.semantic_pattern.pattern_class,
    semantic_family_payload: params.semantic.semantic_family,
    semantic_pattern_payload: params.semantic.semantic_pattern,
  }
}

function resolveSeedRowLastActivityAt(params: {
  rollupRow: Pick<GmailSenderScopeRollupRow, 'last_seen'>
  statsRow: Pick<GmailSenderStatsArtifactRow, 'last_seen'> | null
}): string | null {
  return (
    normalizeNullableText(params.rollupRow.last_seen) ||
    normalizeNullableText(params.statsRow?.last_seen)
  )
}

function nowIso(): string {
  return new Date().toISOString()
}

export function resolveArtifactReferenceNowMs(params: {
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  fallbackNowMs?: number
}): number {
  const coverageEndValue = normalizeText(params.coverage.indexed_date_span_end)
  const coverageEndMs = coverageEndValue ? Date.parse(coverageEndValue) : Number.NaN
  if (Number.isFinite(coverageEndMs)) {
    return Math.max(0, Math.round(coverageEndMs))
  }
  return Math.max(0, Math.round(params.fallbackNowMs ?? Date.now()))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetriableSupabaseError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return /fetch failed|network|ECONNRESET|ETIMEDOUT|socket|temporar|bad gateway|cloudflare|502/i.test(
    message
  )
}

async function withSupabaseRetry<T>(params: {
  label: string
  run: () => Promise<T>
  attempts?: number
}): Promise<T> {
  const attempts = Math.max(1, params.attempts ?? SUPABASE_RETRY_ATTEMPTS)
  let lastError: unknown = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await params.run()
    } catch (error) {
      lastError = error
      if (attempt >= attempts || !isRetriableSupabaseError(error)) {
        throw error
      }
      console.warn(
        `[integrations/gmail/full-mailbox-artifact-retry] ${JSON.stringify({
          label: params.label,
          attempt,
          attempts,
          error: error instanceof Error ? error.message : String(error),
        })}`
      )
      await sleep(SUPABASE_RETRY_DELAY_MS * attempt)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${params.label} failed.`)
}

function roundRatio(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100
}

function safeDateMs(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null
}

function toIsoOrNull(value: number | null | undefined): string | null {
  const safe = safeDateMs(value)
  return safe != null ? new Date(safe).toISOString() : null
}

function senderWorkspaceSenderDomainFromString(sender: string): string | null {
  const normalized = normalizeSender(sender)
  const at = normalized.indexOf('@')
  if (at <= 0 || at >= normalized.length - 1) return null
  return normalized.slice(at + 1)
}

function primarySenderWorkspaceCategory(summary: string): string {
  const head = summary.split('·')[0]?.trim() || ''
  const cleaned = head.replace(/\(\d+\)\s*$/, '').trim()
  return cleaned || 'Other'
}

function activityTimelineLabelForBucket(
  label: string,
  granularity: 'day' | 'week' | 'month'
): string {
  if (granularity === 'week') return label
  if (granularity === 'day') return label
  const parsed = Date.parse(`${label}-01T00:00:00Z`)
  if (!Number.isFinite(parsed)) return label
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function timelineBucketKeyFromSnapshotLabel(params: {
  label: string
  granularity: 'day' | 'week' | 'month'
}): string | null {
  const label = normalizeText(params.label)
  if (!label) return null
  if (params.granularity === 'week' || params.granularity === 'day') {
    return /^\d{4}-\d{2}-\d{2}$/.test(label) ? label : null
  }

  const monthMatch = label.match(/^([A-Za-z]{3})\s+(\d{4})$/)
  if (!monthMatch) return null
  const monthIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].findIndex((entry) => entry.toLowerCase() === monthMatch[1].toLowerCase())
  if (monthIndex < 0) return null
  return `${monthMatch[2]}-${String(monthIndex + 1).padStart(2, '0')}`
}

function intelligenceCategoryLabel(row: GmailMailboxStreamRow): string {
  if (rowCategoryHas(row, 'CATEGORY_PROMOTIONS')) return 'Promotions'
  if (rowCategoryHas(row, 'CATEGORY_SOCIAL')) return 'Social'
  if (rowCategoryHas(row, 'CATEGORY_UPDATES')) return 'Updates'
  if (rowCategoryHas(row, 'CATEGORY_FORUMS')) return 'Forums'
  if (rowCategoryHas(row, 'CATEGORY_PRIMARY')) return 'Primary'
  return classifySenderPatternFromSubject(row.subject)
}

function normalizePressureMixCategory(label: string): string {
  if (label === 'Promotions') return 'Promotions'
  if (label === 'Social') return 'Social'
  if (label === 'Updates') return 'Updates'
  if (label === 'Forums') return 'Forums'
  if (label === 'Primary') return 'Primary'
  if (label === 'Alerts / security') return 'Alerts / security'
  return 'General updates'
}

function buildPressureEvidenceSignals(params: {
  total: number
  machineLikeCount: number
  humanLikeCount: number
  protectedCount: number
}) {
  const items = [
    { label: 'Automation-heavy', count: params.machineLikeCount },
    { label: 'Human-like', count: params.humanLikeCount },
    { label: 'Protected signals', count: params.protectedCount },
  ]
  return items
    .filter((item) => item.count > 0)
    .map((item) => ({
      label: item.label,
      count: item.count,
      share_pct: params.total > 0 ? Math.round((item.count / params.total) * 100) : 0,
      exactness: 'inferred' as const,
    }))
}

function senderMessageSignals(params: {
  sender: string
  subject: string | null
}): { machineHit: number; humanHit: number } {
  const sender = params.sender.toLowerCase()
  const subject = (params.subject || '').toLowerCase()
  const machineHit =
    /\b(no-?reply|do-?not-?reply|noreply|mailer-daemon|bounce)\b/.test(sender) ||
    /\b(unsubscribe|manage preferences|notification|digest|promo|newsletter|sale|offer|alert)\b/.test(
      subject
    )
      ? 1
      : 0
  const humanHit =
    /\b(re:|meeting|call|please|follow up|question|thanks)\b/.test(subject) && machineHit === 0 ? 1 : 0
  return { machineHit, humanHit }
}

function nonHourlyTimelineGranularity(
  granularity: ReturnType<typeof activityTimelineGranularityForScope>
): GmailWholeMailboxAggregateCheckpoint['timeline_granularity'] {
  if (granularity === 'week' || granularity === 'month') return granularity
  return 'day'
}

function createWholeMailboxAggregate(analysisScope: GmailArtifactAnalysisScope): GmailWholeMailboxAggregateCheckpoint {
  return {
    timeline_granularity: nonHourlyTimelineGranularity(
      activityTimelineGranularityForScope(analysisScope as GmailAnalysisScope)
    ),
    category_counts: {},
    human_automation_counts: {
      'Automation-heavy': 0,
      'Human-like': 0,
      'Mixed / unclear': 0,
    },
    timeline_buckets: {},
    protected_message_count: 0,
    likely_human_message_count: 0,
  }
}

function cloneWholeMailboxAggregate(
  aggregate: GmailWholeMailboxAggregateCheckpoint
): GmailWholeMailboxAggregateCheckpoint {
  return JSON.parse(JSON.stringify(aggregate)) as GmailWholeMailboxAggregateCheckpoint
}

function updateWholeMailboxAggregate(
  aggregate: GmailWholeMailboxAggregateCheckpoint,
  rows: GmailMailboxStreamRow[]
): void {
  for (const row of rows) {
    const categoryLabel = intelligenceCategoryLabel(row)
    aggregate.category_counts[categoryLabel] = (aggregate.category_counts[categoryLabel] || 0) + 1
    const pressureMixCategory = normalizePressureMixCategory(categoryLabel)
    const machineLike = isLikelyMachineGeneratedRow(row)
    const humanLike = !machineLike && isLikelyHumanPriorityRow(row)
    const protectedRow =
      row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')

    if (protectedRow) aggregate.protected_message_count += 1
    if (humanLike) aggregate.likely_human_message_count += 1

    const automationLabel = machineLike
      ? 'Automation-heavy'
      : humanLike
        ? 'Human-like'
        : 'Mixed / unclear'
    aggregate.human_automation_counts[automationLabel] =
      (aggregate.human_automation_counts[automationLabel] || 0) + 1

    const timestamp = safeDateMs(row.internal_date_ms)
    if (timestamp == null) continue
    const bucketLabel = activityTimelineBucketKeyForTimestamp(timestamp, aggregate.timeline_granularity)
    const current = aggregate.timeline_buckets[bucketLabel] || {
      count: 0,
      composition_counts: {},
      machine_like_count: 0,
      human_like_count: 0,
      protected_count: 0,
    }
    current.count += 1
    current.composition_counts[pressureMixCategory] =
      (current.composition_counts[pressureMixCategory] || 0) + 1
    if (machineLike) current.machine_like_count += 1
    if (humanLike) current.human_like_count += 1
    if (protectedRow) current.protected_count += 1
    aggregate.timeline_buckets[bucketLabel] = current
  }
}

function parseCheckpointPayload(params: {
  value: string | null
  analysisScope: GmailArtifactAnalysisScope
}): GmailArtifactCheckpointPayload {
  if (!params.value) {
    return {
      cursor: null,
      whole_mailbox_aggregate: createWholeMailboxAggregate(params.analysisScope),
      cluster_specs: {},
      publication_restore_state: null,
    }
  }
  try {
    const parsed = JSON.parse(params.value) as Partial<GmailArtifactCheckpointPayload>
    const aggregate = parsed.whole_mailbox_aggregate || createWholeMailboxAggregate(params.analysisScope)
    return {
      cursor:
        parsed.cursor &&
        normalizeText(parsed.cursor.sender_key) &&
        normalizeText(parsed.cursor.message_id)
          ? {
              sender_key: normalizeText(parsed.cursor.sender_key),
              internal_date_ms:
                typeof parsed.cursor.internal_date_ms === 'number' &&
                Number.isFinite(parsed.cursor.internal_date_ms)
                  ? Math.round(parsed.cursor.internal_date_ms)
                  : null,
              message_id: normalizeText(parsed.cursor.message_id),
            }
          : null,
      whole_mailbox_aggregate: {
        timeline_granularity:
          aggregate.timeline_granularity === 'day'
            ? 'day'
            : aggregate.timeline_granularity === 'week'
              ? 'week'
              : 'month',
        category_counts:
          typeof aggregate.category_counts === 'object' && aggregate.category_counts != null
            ? (aggregate.category_counts as Record<string, number>)
            : {},
        human_automation_counts:
          typeof aggregate.human_automation_counts === 'object' &&
          aggregate.human_automation_counts != null
            ? (aggregate.human_automation_counts as Record<string, number>)
            : {
                'Automation-heavy': 0,
                'Human-like': 0,
                'Mixed / unclear': 0,
              },
        timeline_buckets:
          typeof aggregate.timeline_buckets === 'object' && aggregate.timeline_buckets != null
            ? (aggregate.timeline_buckets as Record<string, WholeMailboxAggregateBucket>)
            : {},
        protected_message_count: normalizeInteger(aggregate.protected_message_count),
        likely_human_message_count: normalizeInteger(aggregate.likely_human_message_count),
      },
      cluster_specs:
        typeof parsed.cluster_specs === 'object' && parsed.cluster_specs != null
          ? (parsed.cluster_specs as Record<string, GmailClusterSpecSnapshot>)
          : {},
      publication_restore_state: parsePublicationRestoreState(parsed.publication_restore_state),
    }
  } catch {
    return {
      cursor: null,
      whole_mailbox_aggregate: createWholeMailboxAggregate(params.analysisScope),
      cluster_specs: {},
      publication_restore_state: null,
    }
  }
}

function serializeCheckpointPayload(value: GmailArtifactCheckpointPayload): string {
  return JSON.stringify(value)
}

function isFinalizeWriteStage(value: unknown): value is GmailArtifactFinalizeWriteStage {
  return GMAIL_ARTIFACT_FINALIZE_WRITE_STAGES.includes(value as GmailArtifactFinalizeWriteStage)
}

function createEmptyFinalizeCheckpoint(): GmailArtifactFinalizeCheckpoint {
  return {
    current_stage: null,
    completed_write_stages: [],
    input_row_counts: null,
    derived_row_counts: null,
    started_at: null,
    updated_at: null,
    completed_at: null,
  }
}

function cloneFinalizeCheckpoint(
  checkpoint: GmailArtifactFinalizeCheckpoint
): GmailArtifactFinalizeCheckpoint {
  return JSON.parse(JSON.stringify(checkpoint)) as GmailArtifactFinalizeCheckpoint
}

function parseFinalizeCheckpoint(value: string | null): GmailArtifactFinalizeCheckpoint {
  if (!value) return createEmptyFinalizeCheckpoint()
  try {
    const parsed = JSON.parse(value) as Partial<GmailArtifactFinalizeCheckpoint>
    return {
      current_stage:
        parsed.current_stage === 'loading_finalize_inputs' ||
        parsed.current_stage === 'building_finalize_rows' ||
        parsed.current_stage === 'finalize_completed' ||
        isFinalizeWriteStage(parsed.current_stage)
          ? parsed.current_stage
          : null,
      completed_write_stages: Array.isArray(parsed.completed_write_stages)
        ? parsed.completed_write_stages.filter(isFinalizeWriteStage)
        : [],
      input_row_counts:
        parsed.input_row_counts &&
        typeof parsed.input_row_counts === 'object' &&
        parsed.input_row_counts != null
          ? {
              sender_scope_rollups: normalizeInteger(
                (
                  parsed.input_row_counts as Partial<GmailArtifactFinalizeInputRowCounts>
                ).sender_scope_rollups
              ),
              preview_index_rows: normalizeInteger(
                (parsed.input_row_counts as Partial<GmailArtifactFinalizeInputRowCounts>)
                  .preview_index_rows
              ),
            }
          : null,
      derived_row_counts:
        parsed.derived_row_counts &&
        typeof parsed.derived_row_counts === 'object' &&
        parsed.derived_row_counts != null
          ? {
              sender_workspace_seed_headers: normalizeInteger(
                (
                  parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>
                ).sender_workspace_seed_headers
              ),
              sender_workspace_seed_rows: normalizeInteger(
                (
                  parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>
                ).sender_workspace_seed_rows
              ),
              cluster_summaries: normalizeInteger(
                (parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>)
                  .cluster_summaries
              ),
              mailbox_intelligence_snapshots: normalizeInteger(
                (
                  parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>
                ).mailbox_intelligence_snapshots
              ),
              mailbox_intelligence_buckets: normalizeInteger(
                (
                  parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>
                ).mailbox_intelligence_buckets
              ),
              preview_index_rows: normalizeInteger(
                (parsed.derived_row_counts as Partial<GmailArtifactFinalizeDerivedRowCounts>)
                  .preview_index_rows
              ),
            }
          : null,
      started_at: normalizeNullableText(parsed.started_at),
      updated_at: normalizeNullableText(parsed.updated_at),
      completed_at: normalizeNullableText(parsed.completed_at),
    }
  } catch {
    return createEmptyFinalizeCheckpoint()
  }
}

function serializeFinalizeCheckpoint(value: GmailArtifactFinalizeCheckpoint): string {
  return JSON.stringify(value)
}

function isFinalizeWriteStageCompleted(
  checkpoint: GmailArtifactFinalizeCheckpoint,
  stage: GmailArtifactFinalizeWriteStage
): boolean {
  return checkpoint.completed_write_stages.includes(stage)
}

function isRowWithinAnalysisScope(
  row: GmailMailboxStreamRow,
  analysisScope: GmailArtifactAnalysisScope,
  nowMs: number
): boolean {
  const analysisScopeDays = scopeDays(analysisScope as GmailAnalysisScope)
  if (analysisScopeDays == null) return true
  const timestamp = safeDateMs(row.internal_date_ms)
  if (timestamp == null) return false
  return timestamp >= nowMs - analysisScopeDays * 24 * 60 * 60 * 1000
}

function toCleanupClusterSnapshot(clusterSpec: GmailCleanupClusterSpec): GmailClusterSpecSnapshot {
  return {
    cluster_id: clusterSpec.cluster_id,
    cluster_type: clusterSpec.cluster_type,
    title: clusterSpec.title,
    query: clusterSpec.query,
    why_selected: normalizeNullableText(clusterSpec.why_selected),
    risk_note: normalizeNullableText(clusterSpec.risk_note),
    safety_note: 'Sender-first review keeps protected traffic visible.',
  }
}

export function buildWholeMailboxAggregateFromRows(params: {
  analysisScope: GmailArtifactAnalysisScope
  rows: GmailMailboxStreamRow[]
  nowMs?: number
}): GmailWholeMailboxAggregateCheckpoint {
  const nowMs = params.nowMs ?? Date.now()
  const aggregate = createWholeMailboxAggregate(params.analysisScope)
  updateWholeMailboxAggregate(
    aggregate,
    params.rows.filter((row) => isRowWithinAnalysisScope(row, params.analysisScope, nowMs))
  )
  return aggregate
}

export async function buildWholeMailboxAggregateFromMailbox(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
}): Promise<GmailWholeMailboxAggregateCheckpoint> {
  const aggregate = createWholeMailboxAggregate(params.analysisScope)
  const nowMs = Date.now()
  let cursor: GmailArtifactBuildCursor | null = null
  while (true) {
    const pageRows = await loadMailboxStreamPage({
      supabase: params.supabase,
      tenantId: params.tenantId,
      cursor,
    })
    if (pageRows.length === 0) break
    updateWholeMailboxAggregate(
      aggregate,
      pageRows.filter((row) => isRowWithinAnalysisScope(row, params.analysisScope, nowMs))
    )
    cursor = cursorFromRow(pageRows[pageRows.length - 1])
  }
  return aggregate
}

export function addWholeMailboxAggregateDelta(params: {
  base: GmailWholeMailboxAggregateCheckpoint
  delta: GmailWholeMailboxAggregateCheckpoint
}): GmailWholeMailboxAggregateCheckpoint {
  const next = cloneWholeMailboxAggregate(params.base)
  for (const [label, count] of Object.entries(params.delta.category_counts || {})) {
    next.category_counts[label] = normalizeInteger(next.category_counts[label]) + normalizeInteger(count)
  }
  for (const [label, count] of Object.entries(params.delta.human_automation_counts || {})) {
    next.human_automation_counts[label] =
      normalizeInteger(next.human_automation_counts[label]) + normalizeInteger(count)
  }
  for (const [bucketKey, bucket] of Object.entries(params.delta.timeline_buckets || {})) {
    const targetBucket = next.timeline_buckets[bucketKey] || {
      count: 0,
      composition_counts: {},
      machine_like_count: 0,
      human_like_count: 0,
      protected_count: 0,
    }
    targetBucket.count += normalizeInteger(bucket.count)
    targetBucket.machine_like_count += normalizeInteger(bucket.machine_like_count)
    targetBucket.human_like_count += normalizeInteger(bucket.human_like_count)
    targetBucket.protected_count += normalizeInteger(bucket.protected_count)
    for (const [compositionLabel, compositionCount] of Object.entries(
      bucket.composition_counts || {}
    )) {
      targetBucket.composition_counts[compositionLabel] =
        normalizeInteger(targetBucket.composition_counts[compositionLabel]) +
        normalizeInteger(compositionCount)
    }
    next.timeline_buckets[bucketKey] = targetBucket
  }
  next.protected_message_count += normalizeInteger(params.delta.protected_message_count)
  next.likely_human_message_count += normalizeInteger(params.delta.likely_human_message_count)
  return next
}

export function subtractWholeMailboxAggregateDelta(params: {
  base: GmailWholeMailboxAggregateCheckpoint
  delta: GmailWholeMailboxAggregateCheckpoint
}): GmailWholeMailboxAggregateCheckpoint {
  const next = cloneWholeMailboxAggregate(params.base)
  for (const [label, count] of Object.entries(params.delta.category_counts || {})) {
    next.category_counts[label] = Math.max(
      0,
      normalizeInteger(next.category_counts[label]) - normalizeInteger(count)
    )
  }
  for (const [label, count] of Object.entries(params.delta.human_automation_counts || {})) {
    next.human_automation_counts[label] = Math.max(
      0,
      normalizeInteger(next.human_automation_counts[label]) - normalizeInteger(count)
    )
  }
  for (const [bucketKey, bucket] of Object.entries(params.delta.timeline_buckets || {})) {
    const targetBucket = next.timeline_buckets[bucketKey]
    if (!targetBucket) continue
    targetBucket.count = Math.max(0, targetBucket.count - normalizeInteger(bucket.count))
    targetBucket.machine_like_count = Math.max(
      0,
      targetBucket.machine_like_count - normalizeInteger(bucket.machine_like_count)
    )
    targetBucket.human_like_count = Math.max(
      0,
      targetBucket.human_like_count - normalizeInteger(bucket.human_like_count)
    )
    targetBucket.protected_count = Math.max(
      0,
      targetBucket.protected_count - normalizeInteger(bucket.protected_count)
    )
    for (const [compositionLabel, compositionCount] of Object.entries(
      bucket.composition_counts || {}
    )) {
      const nextCount = Math.max(
        0,
        normalizeInteger(targetBucket.composition_counts[compositionLabel]) -
          normalizeInteger(compositionCount)
      )
      if (nextCount === 0) {
        delete targetBucket.composition_counts[compositionLabel]
      } else {
        targetBucket.composition_counts[compositionLabel] = nextCount
      }
    }
    if (
      targetBucket.count === 0 &&
      targetBucket.machine_like_count === 0 &&
      targetBucket.human_like_count === 0 &&
      targetBucket.protected_count === 0 &&
      Object.keys(targetBucket.composition_counts).length === 0
    ) {
      delete next.timeline_buckets[bucketKey]
    } else {
      next.timeline_buckets[bucketKey] = targetBucket
    }
  }
  next.protected_message_count = Math.max(
    0,
    next.protected_message_count - normalizeInteger(params.delta.protected_message_count)
  )
  next.likely_human_message_count = Math.max(
    0,
    next.likely_human_message_count - normalizeInteger(params.delta.likely_human_message_count)
  )
  return next
}

export async function loadGmailMailboxRowsForSenders(params: {
  supabase: SupabaseClient
  tenantId: string
  senderKeys: string[]
}): Promise<GmailMailboxStreamRow[]> {
  const senderKeys = Array.from(
    new Set(params.senderKeys.map((entry) => normalizeText(entry)).filter(Boolean))
  )
  if (senderKeys.length === 0) return []

  const rows: GmailMailboxStreamRow[] = []
  const pageSize = 1000
  for (let index = 0; index < senderKeys.length; index += FINALIZE_SENDER_STATS_BATCH_SIZE) {
    const senderBatch = senderKeys.slice(index, index + FINALIZE_SENDER_STATS_BATCH_SIZE)
    for (let from = 0; ; from += pageSize) {
      const to = from + pageSize - 1
      const batchRows = await withSupabaseRetry({
        label: 'gmail_messages.select_by_sender',
        run: async () => {
          const { data, error } = await params.supabase
            .from('gmail_messages')
            .select(
              'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
            )
            .eq('tenant_id', params.tenantId)
            .in('sender', senderBatch)
            .order('sender', { ascending: true })
            .order('internal_date_ms', { ascending: false })
            .order('message_id', { ascending: true })
            .range(from, to)
          if (error) {
            throw new Error(`Failed to load gmail_messages rows by sender: ${error.message}`)
          }
          return Array.isArray(data)
            ? data.map((row) => ({
                tenant_id: normalizeText(row.tenant_id),
                message_id: normalizeText(row.message_id),
                thread_id: normalizeNullableText(row.thread_id),
                sender: normalizeNullableText(row.sender),
                sender_key: normalizeText(row.sender) || 'unknown',
                subject: normalizeNullableText(row.subject),
                internal_date_ms:
                  typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
                    ? Math.round(row.internal_date_ms)
                    : null,
                date: normalizeNullableText(row.date),
                label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
                category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
                is_in_inbox: row.is_in_inbox === true,
                is_unread: row.is_unread === true,
                is_starred: row.is_starred === true,
                is_important: row.is_important === true,
                indexed_at: normalizeText(row.indexed_at) || nowIso(),
                updated_at: normalizeText(row.updated_at) || normalizeText(row.indexed_at) || nowIso(),
              }))
            : []
        },
      })
      rows.push(...batchRows)
      if (batchRows.length < pageSize) break
    }
  }

  rows.sort(
    (left, right) =>
      left.sender_key.localeCompare(right.sender_key) ||
      (safeDateMs(right.internal_date_ms) || 0) - (safeDateMs(left.internal_date_ms) || 0) ||
      left.message_id.localeCompare(right.message_id)
  )
  return rows
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items]
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function deleteSenderStatsRows(params: {
  supabase: SupabaseClient
  tenantId: string
  senderKeys: string[]
}): Promise<void> {
  for (const batch of chunkArray(params.senderKeys, WRITE_BATCH_SIZE)) {
    if (batch.length === 0) continue
    await withSupabaseRetry({
      label: 'gmail_sender_stats.delete',
      run: async () => {
        const { error } = await params.supabase
          .from('gmail_sender_stats')
          .delete()
          .eq('tenant_id', params.tenantId)
          .in('sender', batch)
        if (error) {
          throw new Error(`Failed to delete gmail_sender_stats rows: ${error.message}`)
        }
      },
    })
  }
}

async function loadMailboxStreamPage(params: {
  supabase: SupabaseClient
  tenantId: string
  cursor: GmailArtifactBuildCursor | null
  batchSize?: number
}): Promise<GmailMailboxStreamRow[]> {
  return withSupabaseRetry({
    label: 'gmail_stream_indexed_mailbox_rows',
    run: async () => {
      const { data, error } = await params.supabase.rpc('gmail_stream_indexed_mailbox_rows', {
        p_tenant_id: params.tenantId,
        p_after_sender_key: params.cursor?.sender_key ?? null,
        p_after_internal_date_ms: params.cursor?.internal_date_ms ?? null,
        p_after_message_id: params.cursor?.message_id ?? null,
        p_batch_size: Math.max(1, Math.min(params.batchSize ?? STREAM_BATCH_SIZE, 5000)),
      })
      if (error) {
        throw new Error(`Failed to stream gmail_messages by sender: ${error.message}`)
      }
      return Array.isArray(data) ? (data as GmailMailboxStreamRow[]) : []
    },
  })
}

async function upsertSenderStatsRows(params: {
  supabase: SupabaseClient
  rows: GmailSenderStatsWriteRow[]
}): Promise<void> {
  for (let index = 0; index < params.rows.length; index += WRITE_BATCH_SIZE) {
    const batch = params.rows.slice(index, index + WRITE_BATCH_SIZE)
    if (batch.length === 0) continue
    await withSupabaseRetry({
      label: 'gmail_sender_stats.upsert',
      run: async () => {
        const { error } = await params.supabase
          .from('gmail_sender_stats')
          .upsert(batch, { onConflict: 'tenant_id,sender' })
        if (error) {
          throw new Error(`Failed to upsert gmail_sender_stats rows: ${error.message}`)
        }
      },
    })
  }
}

type SenderAggregateBucket = {
  sender: string
  message_count: number
  recent_count_30d: number
  first_seen_ms: number | null
  last_seen_ms: number | null
  machine_hits: number
  human_hits: number
  category_counts: Map<GmailCanonicalSenderCategoryLabel, number>
  multi_category_message_count: number
  pattern_counts: Map<string, number>
}

function buildSenderStatsRow(params: {
  tenantId: string
  sender: string
  rows: GmailMailboxStreamRow[]
  nowMs: number
}): GmailSenderStatsWriteRow {
  const bucket: SenderAggregateBucket = {
    sender: params.sender,
    message_count: 0,
    recent_count_30d: 0,
    first_seen_ms: null,
    last_seen_ms: null,
    machine_hits: 0,
    human_hits: 0,
    category_counts: new Map<GmailCanonicalSenderCategoryLabel, number>(),
    multi_category_message_count: 0,
    pattern_counts: new Map<string, number>(),
  }
  const threshold30d = params.nowMs - 30 * 24 * 60 * 60 * 1000

  for (const row of params.rows) {
    bucket.message_count += 1
    const timestamp = safeDateMs(row.internal_date_ms)
    if (timestamp != null) {
      if (timestamp >= threshold30d) bucket.recent_count_30d += 1
      if (bucket.first_seen_ms == null || timestamp < bucket.first_seen_ms) bucket.first_seen_ms = timestamp
      if (bucket.last_seen_ms == null || timestamp > bucket.last_seen_ms) bucket.last_seen_ms = timestamp
    }
    const signals = senderMessageSignals({
      sender: params.sender,
      subject: row.subject,
    })
    bucket.machine_hits += signals.machineHit
    bucket.human_hits += signals.humanHit
    const resolvedCategory = resolveCanonicalSenderCategoryFromLabels(row.category_labels || [])
    bucket.category_counts.set(
      resolvedCategory.label,
      (bucket.category_counts.get(resolvedCategory.label) || 0) + 1
    )
    if (resolvedCategory.recognized_labels.length > 1) {
      bucket.multi_category_message_count += 1
    }
    const pattern = classifySenderPatternFromSubjectText(row.subject)
    bucket.pattern_counts.set(pattern, (bucket.pattern_counts.get(pattern) || 0) + 1)
  }

  const machineProbability =
    bucket.message_count > 0 ? bucket.machine_hits / bucket.message_count : 0
  const humanProbability = bucket.message_count > 0 ? bucket.human_hits / bucket.message_count : 0
  const categoryProfile = buildCanonicalSenderCategoryProfile({
    totalMessageCount: bucket.message_count,
    categoryCounts: bucket.category_counts,
    multiCategoryMessageCount: bucket.multi_category_message_count,
  })
  const patternProfile = buildPatternMixFromCounts({
    patternCounts: bucket.pattern_counts,
    totalMessageCount: bucket.message_count,
  })
  const operatorProfile = buildConservativeOperatorProfile({
    totalMessageCount: bucket.message_count,
    categoryProfile,
    patternMix: patternProfile.pattern_mix,
    dominantPattern: patternProfile.dominant_pattern,
    machineProbability,
    humanProbability,
  })

  return {
    tenant_id: params.tenantId,
    sender: params.sender,
    message_count: bucket.message_count,
    recent_count_30d: bucket.recent_count_30d,
    machine_probability: roundRatio(machineProbability),
    human_probability: roundRatio(humanProbability),
    first_seen: toIsoOrNull(bucket.first_seen_ms),
    last_seen: toIsoOrNull(bucket.last_seen_ms),
    category_distribution: categoryProfile.category_distribution as unknown as Record<string, unknown>,
    categorized_message_count: categoryProfile.categorized_message_count,
    uncategorized_message_count: categoryProfile.uncategorized_message_count,
    multi_category_message_count: categoryProfile.multi_category_message_count,
    dominant_category: categoryProfile.dominant_category,
    dominant_category_confidence: categoryProfile.dominant_category_confidence,
    category_profile_mode: categoryProfile.category_profile_mode,
    pattern_mix: patternProfile.pattern_mix as unknown as Record<string, unknown>,
    dominant_pattern: patternProfile.dominant_pattern,
    operator_profile_family: operatorProfile.operator_profile_family,
    operator_profile_mode: operatorProfile.operator_profile_mode,
    operator_profile_confidence: operatorProfile.operator_profile_confidence,
    operator_profile_summary: operatorProfile.operator_profile_summary,
    operator_profile_reasons: operatorProfile.operator_profile_reasons,
    operator_profile_source: operatorProfile.operator_profile_source,
    updated_at: nowIso(),
  }
}

function buildSenderScopeRollup(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  sender: string
  senderKey: string
  scopedRows: GmailMailboxStreamRow[]
  scopedInboxRows: GmailMailboxStreamRow[]
  assignedCleanupGroupId: GmailAssignedCleanupGroupId
  assignmentReason: GmailCleanupAssignmentReason
  isCleanupCandidate: boolean
  exclusionReason: GmailCleanupExclusionReason | null
}): GmailSenderScopeRollupRow | null {
  if (params.scopedRows.length === 0) return null
  let protectedMessageCount = 0
  let likelyHumanMessageCount = 0
  let unreadCount = 0
  let firstSeenMs: number | null = null
  let lastSeenMs: number | null = null
  const categoryCounts = new Map<string, number>()
  let sampleText = params.sender

  for (const row of params.scopedRows) {
    if (!sampleText && row.subject) sampleText = `${params.sender} ${row.subject}`
    if (row.is_unread) unreadCount += 1
    if (row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')) {
      protectedMessageCount += 1
    }
    if (isLikelyHumanPriorityRow(row)) likelyHumanMessageCount += 1
    const categoryLabel = intelligenceCategoryLabel(row)
    categoryCounts.set(categoryLabel, (categoryCounts.get(categoryLabel) || 0) + 1)
    const timestamp = safeDateMs(row.internal_date_ms)
    if (timestamp != null) {
      if (firstSeenMs == null || timestamp < firstSeenMs) firstSeenMs = timestamp
      if (lastSeenMs == null || timestamp > lastSeenMs) lastSeenMs = timestamp
    }
  }

  const categorySummary = Array.from(categoryCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join(' · ')

  return {
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    artifact_version: params.artifactVersion,
    sender_key: params.senderKey,
    sender: params.sender,
    assigned_cleanup_group_id: params.assignedCleanupGroupId,
    assignment_reason: params.assignmentReason,
    is_cleanup_candidate: params.isCleanupCandidate,
    total_message_count: params.scopedRows.length,
    cleanup_candidate_message_count: params.isCleanupCandidate ? params.scopedInboxRows.length : 0,
    protected_message_count: protectedMessageCount,
    likely_human_message_count: likelyHumanMessageCount,
    unread_count: unreadCount,
    first_seen: toIsoOrNull(firstSeenMs),
    last_seen: toIsoOrNull(lastSeenMs),
    category_summary: categorySummary || 'General updates',
    sender_signal: senderSignalFromText({
      sender: params.sender,
      sampleText,
    }),
    cleanup_exclusion_reason: params.exclusionReason,
  }
}

function buildPreviewIndexRows(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  clusterId: string
  senderKey: string
  rows: GmailMailboxStreamRow[]
}): GmailPreviewIndexRow[] {
  return params.rows.map((row, index) => ({
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    cluster_id: params.clusterId,
    sender_key: params.senderKey,
    artifact_version: params.artifactVersion,
    preview_rank: index + 1,
    message_id: row.message_id,
    thread_id: row.thread_id,
    sender: row.sender,
    subject: row.subject,
    snippet: null,
    internal_date_ms: safeDateMs(row.internal_date_ms),
    date: row.date,
    label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
    category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
    is_in_inbox: row.is_in_inbox,
    is_unread: row.is_unread,
    is_important: row.is_important,
    is_starred: row.is_starred,
    protected_hint:
      row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
        ? 'Protected message evidence present'
        : null,
    preview_payload: {},
  }))
}

function selectStructuralPreviewSeedRows(params: {
  rows: GmailMailboxStreamRow[]
}): GmailMailboxStreamRow[] {
  const rowsWithMessageIds = params.rows.filter(
    (row) => typeof row.message_id === 'string' && row.message_id.trim().length > 0
  )
  if (rowsWithMessageIds.length === 0) return []

  const sortByRecencyDesc = (left: GmailMailboxStreamRow, right: GmailMailboxStreamRow): number => {
    const leftTimestamp = safeDateMs(left.internal_date_ms) ?? 0
    const rightTimestamp = safeDateMs(right.internal_date_ms) ?? 0
    if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp
    return right.message_id.localeCompare(left.message_id)
  }

  const subjectBackedRows = rowsWithMessageIds.filter(
    (row) => typeof row.subject === 'string' && row.subject.trim().length > 0
  )
  const candidateRows = (subjectBackedRows.length > 0 ? subjectBackedRows : rowsWithMessageIds).slice()
  candidateRows.sort(sortByRecencyDesc)
  return candidateRows.slice(0, STRUCTURAL_PREVIEW_SEED_LIMIT)
}

function shouldUseStructuralPreviewSeedFallback(params: {
  scopedInboxRows: GmailMailboxStreamRow[]
  isCleanupCandidate: boolean
  exclusionReason: GmailCleanupExclusionReason | null
}): boolean {
  return (
    params.scopedInboxRows.length === 0 &&
    !params.isCleanupCandidate &&
    params.exclusionReason === 'no_inbox_rows'
  )
}

function cleanupGroupMessageCountFromRollup(params: {
  rollupRow: GmailSenderScopeRollupRow
  previewRowCount: number
}): number {
  if (
    !params.rollupRow.is_cleanup_candidate &&
    params.rollupRow.cleanup_exclusion_reason === 'no_inbox_rows'
  ) {
    return params.rollupRow.total_message_count
  }
  if (params.previewRowCount > 0) return params.previewRowCount
  return params.rollupRow.total_message_count
}

function cursorFromRow(row: GmailMailboxStreamRow): GmailArtifactBuildCursor {
  return {
    sender_key: row.sender_key,
    internal_date_ms: safeDateMs(row.internal_date_ms),
    message_id: row.message_id,
  }
}

export async function recomputeGmailSenderStatsFromFullMailbox(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const nowMs = Date.now()
    let cursor: GmailArtifactBuildCursor | null = null
    let currentSenderKey: string | null = null
    let currentSenderRows: GmailMailboxStreamRow[] = []
    const pendingStatsRows: GmailSenderStatsWriteRow[] = []

    const flushCurrentSender = async (): Promise<void> => {
      if (!currentSenderKey || currentSenderRows.length === 0) return
      pendingStatsRows.push(
        buildSenderStatsRow({
          tenantId: params.tenantId,
          sender: currentSenderKey,
          rows: currentSenderRows,
          nowMs,
        })
      )
      currentSenderRows = []
      if (pendingStatsRows.length >= WRITE_BATCH_SIZE) {
        await upsertSenderStatsRows({
          supabase: params.supabase,
          rows: pendingStatsRows.splice(0, pendingStatsRows.length),
        })
      }
    }

    while (true) {
      const pageRows = await loadMailboxStreamPage({
        supabase: params.supabase,
        tenantId: params.tenantId,
        cursor,
      })
      if (pageRows.length === 0) break

      for (const row of pageRows) {
        const senderKey = normalizeText(row.sender_key)
        if (!currentSenderKey) currentSenderKey = senderKey
        if (senderKey !== currentSenderKey) {
          await flushCurrentSender()
          currentSenderKey = senderKey
        }
        currentSenderRows.push(row)
      }

      cursor = cursorFromRow(pageRows[pageRows.length - 1])
    }

    await flushCurrentSender()
    if (pendingStatsRows.length > 0) {
      await upsertSenderStatsRows({
        supabase: params.supabase,
        rows: pendingStatsRows,
      })
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to recompute gmail_sender_stats.',
    }
  }
}

export async function streamGmailSenderArtifactProjection(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  initialCheckpoint?: GmailArtifactCheckpointPayload
  referenceNowMs?: number
  publishedSeedRowsBySenderKey?: Map<string, GmailSenderWorkspaceSeedRow>
  onCheckpoint?: (progress: GmailSenderProjectionProgress) => Promise<void> | void
  checkpointEverySenders?: number
}): Promise<GmailSenderProjectionProgress> {
  const checkpointEverySenders = Math.max(1, params.checkpointEverySenders ?? 25)
  const checkpoint = params.initialCheckpoint ?? {
    cursor: null,
    whole_mailbox_aggregate: createWholeMailboxAggregate(params.analysisScope),
    cluster_specs: {},
    reference_now_ms: params.referenceNowMs ?? null,
    publication_restore_state: null,
  }
  const nowMs = Math.max(
    0,
    Math.round(checkpoint.reference_now_ms ?? params.referenceNowMs ?? Date.now())
  )
  checkpoint.reference_now_ms = nowMs
  let cursor = checkpoint.cursor
  let currentSenderKey: string | null = null
  let currentSenderRows: GmailMailboxStreamRow[] = []
  let processedSenderCount = 0
  let processedMessageCount = 0
  const pendingStatsRows: GmailSenderStatsWriteRow[] = []
  const pendingRollupRows: GmailSenderScopeRollupRow[] = []
  const pendingPreviewRows: GmailPreviewIndexRow[] = []

  const flushPendingWrites = async (): Promise<void> => {
    if (pendingStatsRows.length > 0) {
      await upsertSenderStatsRows({
        supabase: params.supabase,
        rows: pendingStatsRows.splice(0, pendingStatsRows.length),
      })
    }
    if (pendingRollupRows.length > 0) {
      await upsertGmailSenderScopeRollupRows({
        supabase: params.supabase,
        rows: pendingRollupRows.splice(0, pendingRollupRows.length),
      })
    }
    if (pendingPreviewRows.length > 0) {
      await upsertGmailPreviewIndexRows({
        supabase: params.supabase,
        rows: pendingPreviewRows.splice(0, pendingPreviewRows.length),
      })
    }
  }

  const flushCurrentSender = async (): Promise<void> => {
    if (!currentSenderKey || currentSenderRows.length === 0) return
    const statsRow = buildSenderStatsRow({
      tenantId: params.tenantId,
      sender: currentSenderKey,
      rows: currentSenderRows,
      nowMs,
    })
    pendingStatsRows.push(statsRow)

    const scopedRows = currentSenderRows.filter((row) =>
      isRowWithinAnalysisScope(row, params.analysisScope, nowMs)
    )
    updateWholeMailboxAggregate(checkpoint.whole_mailbox_aggregate, scopedRows)
    const scopedInboxRows = scopedRows.filter((row) => row.is_in_inbox)
    const cleanupDecision = assignSenderCleanupGroupDecision({
      sender: currentSenderKey,
      rows: scopedRows,
      nowMs,
    })
    const rollupRow = buildSenderScopeRollup({
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      artifactVersion: params.artifactVersion,
      sender: currentSenderKey,
      senderKey: currentSenderKey,
      scopedRows,
      scopedInboxRows,
      assignedCleanupGroupId: cleanupDecision.groupSpec.cluster_id as GmailAssignedCleanupGroupId,
      assignmentReason: cleanupDecision.assignmentReason,
      isCleanupCandidate: cleanupDecision.isCleanupCandidate,
      exclusionReason: cleanupDecision.exclusionReason,
    })
    if (rollupRow) pendingRollupRows.push(rollupRow)

    const clusterSpecSnapshot = toCleanupClusterSnapshot(cleanupDecision.groupSpec)
    checkpoint.cluster_specs[cleanupDecision.groupSpec.cluster_id] = clusterSpecSnapshot

    const previewSeedRows = shouldUseStructuralPreviewSeedFallback({
      scopedInboxRows,
      isCleanupCandidate: cleanupDecision.isCleanupCandidate,
      exclusionReason: cleanupDecision.exclusionReason,
    })
      ? selectStructuralPreviewSeedRows({ rows: scopedRows })
      : scopedInboxRows

    if (previewSeedRows.length > 0) {
      pendingPreviewRows.push(
        ...buildPreviewIndexRows({
          tenantId: params.tenantId,
          analysisScope: params.analysisScope,
          artifactVersion: params.artifactVersion,
          clusterId: cleanupDecision.groupSpec.cluster_id,
          senderKey: currentSenderKey,
          rows: previewSeedRows,
        })
      )
    }

    processedSenderCount += 1
    processedMessageCount += currentSenderRows.length
    checkpoint.cursor = cursorFromRow(currentSenderRows[currentSenderRows.length - 1])
    currentSenderRows = []

    if (
      processedSenderCount % checkpointEverySenders === 0 ||
      pendingPreviewRows.length >= WRITE_BATCH_SIZE
    ) {
      await flushPendingWrites()
      if (params.onCheckpoint) {
        await params.onCheckpoint({
          processed_sender_count: processedSenderCount,
          processed_message_count: processedMessageCount,
          matched_cluster_count: Object.keys(checkpoint.cluster_specs).length,
          last_cursor: checkpoint.cursor,
          checkpoint,
        })
      }
    }
  }

  while (true) {
    const pageRows = await loadMailboxStreamPage({
      supabase: params.supabase,
      tenantId: params.tenantId,
      cursor,
    })
    if (pageRows.length === 0) break

    for (const row of pageRows) {
      const senderKey = normalizeText(row.sender_key)
      if (!currentSenderKey) currentSenderKey = senderKey
      if (senderKey !== currentSenderKey) {
        await flushCurrentSender()
        currentSenderKey = senderKey
      }
      currentSenderRows.push(row)
    }

    cursor = cursorFromRow(pageRows[pageRows.length - 1])
  }

  await flushCurrentSender()
  await flushPendingWrites()

  const progress: GmailSenderProjectionProgress = {
    processed_sender_count: processedSenderCount,
    processed_message_count: processedMessageCount,
    matched_cluster_count: Object.keys(checkpoint.cluster_specs).length,
    last_cursor: checkpoint.cursor,
    checkpoint,
  }

  if (params.onCheckpoint) {
    await params.onCheckpoint(progress)
  }

  return progress
}

type GmailSenderStatsArtifactRow = {
  sender: string
  message_count: number
  machine_probability: number | null
  human_probability: number | null
  first_seen: string | null
  last_seen: string | null
  category_distribution: unknown
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailCanonicalSenderCategoryLabel | null
  dominant_category_confidence: string | null
  category_profile_mode: string
  pattern_mix: unknown
  dominant_pattern: string | null
  operator_profile_family: string
  operator_profile_mode: string
  operator_profile_confidence: string | null
  operator_profile_summary: string
  operator_profile_reasons: string[]
  operator_profile_source: string
}

function previewRowToMailboxRow(row: GmailPreviewIndexRow): GmailMailboxStreamRow {
  return {
    tenant_id: row.tenant_id,
    message_id: row.message_id,
    thread_id: row.thread_id,
    sender: row.sender,
    sender_key: row.sender_key,
    subject: row.subject,
    internal_date_ms: safeDateMs(row.internal_date_ms),
    date: row.date,
    label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
    category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
    is_in_inbox: row.is_in_inbox,
    is_unread: row.is_unread,
    is_starred: row.is_starred,
    is_important: row.is_important,
    indexed_at: row.created_at || nowIso(),
    updated_at: row.updated_at || row.created_at || nowIso(),
  }
}

export async function loadGmailSenderStatsMap(params: {
  supabase: SupabaseClient
  tenantId: string
  senders: string[]
}): Promise<Map<string, GmailSenderStatsArtifactRow>> {
  const keys = Array.from(new Set(params.senders.map((entry) => normalizeText(entry)).filter(Boolean)))
  const statsBySender = new Map<string, GmailSenderStatsArtifactRow>()
  for (let index = 0; index < keys.length; index += FINALIZE_SENDER_STATS_BATCH_SIZE) {
    const batch = keys.slice(index, index + FINALIZE_SENDER_STATS_BATCH_SIZE)
    const data = await withSupabaseRetry({
      label: 'gmail_sender_stats.select_for_finalize',
      run: async () => {
        const { data, error } = await params.supabase
          .from('gmail_sender_stats')
          .select(
            'sender,message_count,machine_probability,human_probability,first_seen,last_seen,category_distribution,categorized_message_count,uncategorized_message_count,multi_category_message_count,dominant_category,dominant_category_confidence,category_profile_mode,pattern_mix,dominant_pattern,operator_profile_family,operator_profile_mode,operator_profile_confidence,operator_profile_summary,operator_profile_reasons,operator_profile_source'
          )
          .eq('tenant_id', params.tenantId)
          .in('sender', batch)
        if (error) {
          throw new Error(`Failed to load gmail_sender_stats for finalize: ${error.message}`)
        }
        return (data || []) as GmailSenderStatsArtifactRow[]
      },
    })
    for (const row of data) {
      statsBySender.set(normalizeText(row.sender), row)
    }
  }
  return statsBySender
}

export async function recomputeGmailSenderStatsForSenders(params: {
  supabase: SupabaseClient
  tenantId: string
  senderKeys: string[]
  referenceNowMs?: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const senderKeys = Array.from(
      new Set(params.senderKeys.map((entry) => normalizeText(entry)).filter(Boolean))
    )
    if (senderKeys.length === 0) return { ok: true }

    const rows = await loadGmailMailboxRowsForSenders({
      supabase: params.supabase,
      tenantId: params.tenantId,
      senderKeys,
    })
    const rowsBySenderKey = new Map<string, GmailMailboxStreamRow[]>()
    for (const row of rows) {
      const senderKey = normalizeText(row.sender_key)
      if (!senderKey) continue
      const bucket = rowsBySenderKey.get(senderKey) || []
      bucket.push(row)
      rowsBySenderKey.set(senderKey, bucket)
    }

    const nowMs = Math.max(0, Math.round(params.referenceNowMs ?? Date.now()))
    const pendingRows: GmailSenderStatsWriteRow[] = []
    const senderKeysToDelete: string[] = []
    for (const senderKey of senderKeys) {
      const senderRows = rowsBySenderKey.get(senderKey) || []
      if (senderRows.length === 0) {
        senderKeysToDelete.push(senderKey)
        continue
      }
      pendingRows.push(
        buildSenderStatsRow({
          tenantId: params.tenantId,
          sender: senderKey,
          rows: senderRows,
          nowMs,
        })
      )
    }

    if (pendingRows.length > 0) {
      await upsertSenderStatsRows({
        supabase: params.supabase,
        rows: pendingRows,
      })
    }
    if (senderKeysToDelete.length > 0) {
      await deleteSenderStatsRows({
        supabase: params.supabase,
        tenantId: params.tenantId,
        senderKeys: senderKeysToDelete,
      })
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Failed to recompute gmail_sender_stats rows.',
    }
  }
}

function resolveCategoryProfile(
  statsRow: GmailSenderStatsArtifactRow | null
): ReturnType<typeof insufficientDataCanonicalSenderProfile> {
  if (!statsRow) return insufficientDataCanonicalSenderProfile()
  return buildCanonicalSenderCategorySummary({
    category_distribution: Array.isArray(statsRow.category_distribution)
      ? (statsRow.category_distribution as ReturnType<
          typeof insufficientDataCanonicalSenderProfile
        >['category_distribution'])
      : [],
    categorized_message_count: statsRow.categorized_message_count,
    uncategorized_message_count: statsRow.uncategorized_message_count,
    multi_category_message_count: statsRow.multi_category_message_count,
    dominant_category: statsRow.dominant_category,
    dominant_category_confidence:
      statsRow.dominant_category_confidence === 'high' ||
      statsRow.dominant_category_confidence === 'medium' ||
      statsRow.dominant_category_confidence === 'low'
        ? statsRow.dominant_category_confidence
        : null,
    category_profile_mode:
      statsRow.category_profile_mode === 'dominant' ||
      statsRow.category_profile_mode === 'mixed' ||
      statsRow.category_profile_mode === 'uncategorized' ||
      statsRow.category_profile_mode === 'insufficient_data'
        ? statsRow.category_profile_mode
        : 'insufficient_data',
  })
}

function resolveOperatorProfile(statsRow: GmailSenderStatsArtifactRow | null) {
  if (!statsRow) return insufficientDataOperatorProfile()
  const fallback = insufficientDataOperatorProfile()
  return {
    operator_profile_family:
      statsRow.operator_profile_family === 'marketing_promotional' ||
      statsRow.operator_profile_family === 'commerce_transactional' ||
      statsRow.operator_profile_family === 'account_notification' ||
      statsRow.operator_profile_family === 'security_alert' ||
      statsRow.operator_profile_family === 'social_community' ||
      statsRow.operator_profile_family === 'human_personal' ||
      statsRow.operator_profile_family === 'mixed_behavior' ||
      statsRow.operator_profile_family === 'insufficient_data'
        ? statsRow.operator_profile_family
        : fallback.operator_profile_family,
    operator_profile_mode:
      statsRow.operator_profile_mode === 'clear' ||
      statsRow.operator_profile_mode === 'mixed' ||
      statsRow.operator_profile_mode === 'insufficient_data'
        ? statsRow.operator_profile_mode
        : fallback.operator_profile_mode,
    operator_profile_confidence:
      statsRow.operator_profile_confidence === 'high' ||
      statsRow.operator_profile_confidence === 'medium' ||
      statsRow.operator_profile_confidence === 'low'
        ? statsRow.operator_profile_confidence
        : fallback.operator_profile_confidence,
    operator_profile_summary: statsRow.operator_profile_summary,
    operator_profile_reasons: Array.isArray(statsRow.operator_profile_reasons)
      ? statsRow.operator_profile_reasons
      : [],
    operator_profile_source:
      statsRow.operator_profile_source === 'sender_global_operator_profile_v1' ||
      statsRow.operator_profile_source === 'insufficient_data'
        ? statsRow.operator_profile_source
        : fallback.operator_profile_source,
  }
}

function resolveSenderSignal(statsRow: GmailSenderStatsArtifactRow | null): GmailSenderWorkspaceData['senders'][number]['sender_signal'] {
  if (statsRow) {
    if ((statsRow.human_probability || 0) >= 0.65) return 'likely_human'
    if ((statsRow.machine_probability || 0) >= 0.65) return 'likely_machine_generated'
  }
  return 'uncertain'
}

function buildSenderActivityTimeline(params: {
  senders: SenderWorkspaceAnalyticsSeedSender[]
  previewRows?: GmailPreviewIndexRow[]
  analysisScope: GmailArtifactAnalysisScope
  coverageStartIso?: string | null
  coverageEndIso?: string | null
}): {
  items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
  granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
} {
  const rowBackedTimelineRows: GmailMailboxIndexRow[] = Array.isArray(params.previewRows)
    ? params.previewRows.map(
        (row) =>
          ({
            tenant_id: row.tenant_id,
            message_id: row.message_id,
            thread_id: row.thread_id,
            sender: row.sender,
            subject: row.subject,
            internal_date_ms: row.internal_date_ms,
            date: row.date,
            label_ids: row.label_ids,
            category_labels: row.category_labels,
            is_in_inbox: row.is_in_inbox,
            is_unread: row.is_unread,
            is_starred: row.is_starred,
            is_important: row.is_important,
            indexed_at: row.created_at || row.updated_at || nowIso(),
            updated_at: row.updated_at || row.created_at || nowIso(),
          }) as GmailMailboxIndexRow
      )
    : []
  const canonical = buildCanonicalSenderWorkspaceActivityTimeline({
    rows: rowBackedTimelineRows,
    analysisScope: params.analysisScope as GmailAnalysisScope,
    coverageStartIso: params.coverageStartIso,
    coverageEndIso: params.coverageEndIso,
  })
  return {
    items: canonical.items,
    granularity: canonical.granularity,
  }
}

function buildSenderAttributeDistribution(params: {
  senders: SenderWorkspaceAnalyticsSeedSender[]
  valueForSender: (sender: SenderWorkspaceAnalyticsSeedSender) => string | null | undefined
}): Array<{ label: string; sender_count: number; share_pct: number }> {
  const counts = new Map<string, number>()
  for (const sender of params.senders) {
    const rawValue = params.valueForSender(sender)
    const label = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (!label) continue
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  const totalSenders = params.senders.length
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, senderCount]) => ({
      label,
      sender_count: senderCount,
      share_pct: totalSenders > 0 ? Math.round((senderCount / totalSenders) * 100) : 0,
    }))
}

function buildOperatorProfileFamilyDistribution(
  senders: SenderWorkspaceAnalyticsSeedSender[]
): GmailSenderWorkspaceData['analytics']['operator_profile_family_distribution'] {
  return buildSenderAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.operator_profile_family,
  }).map(({ label, sender_count, share_pct }) => ({
    family: label as GmailSenderWorkspaceData['senders'][number]['operator_profile_family'],
    sender_count,
    share_pct,
  }))
}

function buildDominantPatternDistribution(
  senders: SenderWorkspaceAnalyticsSeedSender[]
): GmailSenderWorkspaceData['analytics']['dominant_pattern_distribution'] {
  return buildSenderAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.dominant_pattern,
  }).map(({ label, sender_count, share_pct }) => ({
    pattern: label,
    sender_count,
    share_pct,
  }))
}

function buildOperatorProfileModeDistribution(
  senders: SenderWorkspaceAnalyticsSeedSender[]
): GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'] {
  return buildSenderAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.operator_profile_mode,
  }).map(({ label, sender_count, share_pct }) => ({
    mode: label as GmailSenderWorkspaceData['senders'][number]['operator_profile_mode'],
    sender_count,
    share_pct,
  }))
}

function buildCategorySummarySourceDistribution(
  senders: SenderWorkspaceAnalyticsSeedSender[]
): GmailSenderWorkspaceData['analytics']['category_summary_source_distribution'] {
  return buildSenderAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.category_summary_source,
  }).map(({ label, sender_count, share_pct }) => ({
    source: label as GmailSenderWorkspaceData['senders'][number]['category_summary_source'],
    sender_count,
    share_pct,
  }))
}

function buildSeedRowsAndHeaders(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  clusterSpecs: Record<string, GmailClusterSpecSnapshot>
  previewRows: GmailPreviewIndexRow[]
  statsBySenderKey: Map<string, GmailSenderStatsArtifactRow>
  rollupsBySenderKey: Map<string, GmailSenderScopeRollupRow>
}): {
  seedRows: GmailSenderWorkspaceSeedRow[]
  seedHeaders: GmailSenderWorkspaceSeedHeaderRow[]
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  projectedPreviewRows: GmailPreviewIndexRow[]
} {
  const previewRowsByClusterSenderKey = new Map<string, Map<string, GmailPreviewIndexRow[]>>()
  for (const row of params.previewRows) {
    const clusterBucket =
      previewRowsByClusterSenderKey.get(row.cluster_id) || new Map<string, GmailPreviewIndexRow[]>()
    const senderBucket = clusterBucket.get(row.sender_key) || []
    senderBucket.push(row)
    clusterBucket.set(row.sender_key, senderBucket)
    previewRowsByClusterSenderKey.set(row.cluster_id, clusterBucket)
  }

  const seedRows: GmailSenderWorkspaceSeedRow[] = []
  const seedHeaders: GmailSenderWorkspaceSeedHeaderRow[] = []
  const clusterSummaries: GmailClusterSummaryArtifactRow[] = []
  const projectedPreviewRows: GmailPreviewIndexRow[] = []
  const rollupsByClusterId = new Map<string, GmailSenderScopeRollupRow[]>()
  for (const rollupRow of params.rollupsBySenderKey.values()) {
    const bucket = rollupsByClusterId.get(rollupRow.assigned_cleanup_group_id) || []
    bucket.push(rollupRow)
    rollupsByClusterId.set(rollupRow.assigned_cleanup_group_id, bucket)
  }

  const clusterMessageCountById = new Map<string, number>()
  for (const [clusterId, clusterRollups] of rollupsByClusterId.entries()) {
    let messageCount = 0
    const clusterPreviewRows = previewRowsByClusterSenderKey.get(clusterId) || new Map()
    for (const rollupRow of clusterRollups) {
      messageCount += cleanupGroupMessageCountFromRollup({
        rollupRow,
        previewRowCount: (clusterPreviewRows.get(rollupRow.sender_key) || []).length,
      })
    }
    if (messageCount > 0 || clusterRollups.length > 0) {
      clusterMessageCountById.set(clusterId, messageCount)
    }
  }
  const totalAssignedGroupMessages = Array.from(clusterMessageCountById.values()).reduce(
    (sum, count) => sum + count,
    0
  )

  const clusterDrafts: Array<{
    sourceClusterId: string
    clusterSpec: GmailClusterSpecSnapshot
    clusterPreviewRowsBySenderKey: Map<string, GmailPreviewIndexRow[]>
    clusterRollups: GmailSenderScopeRollupRow[]
    clusterSeedSenders: Array<{
      seedRow: GmailSenderWorkspaceSeedRow
      senderView: SenderWorkspaceAnalyticsSeedSender
    }>
    clusterMessageCount: number
    senderCount: number
    dominantSender: string | null
    dominantPattern: string | null
    protectedMessageCount: number
    senderCategoryDistribution: Array<{ label: string; sender_count: number }>
    senderActivityTimeline: ReturnType<typeof buildSenderActivityTimeline>
    clusterContribution: Array<{
      sender: string
      sender_key: string
      message_count: number
      share_pct: number
    }>
    semanticAnalytics: ReturnType<typeof buildSemanticAnalyticsDistributions>
  }> = []

  for (const [clusterId, clusterRollups] of rollupsByClusterId.entries()) {
    const clusterSpec = params.clusterSpecs[clusterId]
    if (!clusterSpec || clusterRollups.length === 0) continue
    const clusterPreviewRowsBySenderKey =
      previewRowsByClusterSenderKey.get(clusterId) || new Map<string, GmailPreviewIndexRow[]>()

    const clusterSeedSenders = clusterRollups
      .slice()
      .sort((left, right) => {
        const leftCount = cleanupGroupMessageCountFromRollup({
          rollupRow: left,
          previewRowCount: (clusterPreviewRowsBySenderKey.get(left.sender_key) || []).length,
        })
        const rightCount = cleanupGroupMessageCountFromRollup({
          rollupRow: right,
          previewRowCount: (clusterPreviewRowsBySenderKey.get(right.sender_key) || []).length,
        })
        return rightCount - leftCount || left.sender.localeCompare(right.sender)
      })
      .map((rollupRow, senderIndex) => {
      const senderPreviewRows = clusterPreviewRowsBySenderKey.get(rollupRow.sender_key) || []
      const rows = senderPreviewRows.map(previewRowToMailboxRow)
      const statsRow = params.statsBySenderKey.get(rollupRow.sender_key) || null
      const categoryProfile = resolveCategoryProfile(statsRow)
      const operatorProfile = resolveOperatorProfile(statsRow)
      const persistedPatternMix = normalizePatternMix(statsRow?.pattern_mix)
      const dominantPattern =
        statsRow?.dominant_pattern ||
        persistedPatternMix[0]?.pattern ||
        GMAIL_PATTERN_LABEL_THIN_HISTORY
      const semantic = resolveSenderSemanticsFromCompatibility({
        sender: rollupRow.sender,
        subjectHints: rows.map((row) => row.subject || ''),
        totalMessageCount: rollupRow.total_message_count,
        categoryProfile,
        patternMix: persistedPatternMix,
        dominantPattern,
        operatorProfile,
        machineProbability: statsRow?.machine_probability ?? null,
        humanProbability: statsRow?.human_probability ?? null,
        sourceKind: 'sender_stats',
      })
      const persistedSemantic = buildSeedRowSemanticPersistence({ semantic })
      const cleanupGroupMessageCount = cleanupGroupMessageCountFromRollup({
        rollupRow,
        previewRowCount: rows.length,
      })
      const lastActivityAt = resolveSeedRowLastActivityAt({
        rollupRow,
        statsRow,
      })
      const previewMessageIds = senderPreviewRows
        .slice(0, STRUCTURAL_PREVIEW_SEED_LIMIT)
        .map((row) => row.message_id)
      const importantOrStarredPreviewCount = rows.filter(
        (row) => row.is_important || row.is_starred
      ).length
      const verificationReasons: string[] = []
      if (rollupRow.protected_message_count > 0) verificationReasons.push('Protected message evidence')
      if (!rollupRow.is_cleanup_candidate) verificationReasons.push('Non-candidate structural assignment')
      if (rows.some((message) => (message.category_labels || []).length > 1)) {
        verificationReasons.push('Mixed category evidence')
      }
      if ((statsRow?.human_probability || 0) >= 0.45) verificationReasons.push('Human-like history')
      if ((statsRow?.machine_probability || 0) >= 0.45 && (statsRow?.human_probability || 0) >= 0.3) {
        verificationReasons.push('Mixed sender behavior')
      }
      if (importantOrStarredPreviewCount > 0) {
        verificationReasons.push('Important or starred activity')
      }

      return {
        seedRow: {
          tenant_id: params.tenantId,
          analysis_scope: params.analysisScope,
          cluster_id: clusterId,
          sender_key: rollupRow.sender_key,
          artifact_version: params.artifactVersion,
          review_unit_id: null,
          default_rank: senderIndex + 1,
          sender: rollupRow.sender,
          sender_domain: rows[0]
            ? rowSenderDomain(rows[0]) || senderWorkspaceSenderDomainFromString(rollupRow.sender)
            : senderWorkspaceSenderDomainFromString(rollupRow.sender),
          cleanup_group_message_count: cleanupGroupMessageCount,
          unread_count: rollupRow.unread_count,
          protected_hint:
            rollupRow.protected_message_count > 0 ? 'Protected message evidence present' : null,
          requires_verification: verificationReasons.length > 0,
          verification_reasons: verificationReasons,
          preview_message_ids: previewMessageIds,
          preview_ready: previewMessageIds.length > 0,
          semantic_family_key: persistedSemantic.semantic_family_key,
          semantic_subtype_key: persistedSemantic.semantic_subtype_key,
          semantic_pattern_key: persistedSemantic.semantic_pattern_key,
          last_activity_at: lastActivityAt,
          seed_payload: {
            assigned_cleanup_group_id: rollupRow.assigned_cleanup_group_id,
            assignment_reason: rollupRow.assignment_reason,
            cleanup_exclusion_reason: rollupRow.cleanup_exclusion_reason,
            is_cleanup_candidate: rollupRow.is_cleanup_candidate,
            category_summary: categoryProfile.category_summary,
            dominant_pattern: dominantPattern,
            sender_signal: resolveSenderSignal(statsRow),
            total_sender_messages: rollupRow.total_message_count,
            first_seen: rollupRow.first_seen,
            last_activity: lastActivityAt,
            semantic_family: persistedSemantic.semantic_family_payload,
            semantic_pattern: persistedSemantic.semantic_pattern_payload,
            operator_profile_family: operatorProfile.operator_profile_family,
            operator_profile_mode: operatorProfile.operator_profile_mode,
            operator_profile_confidence: operatorProfile.operator_profile_confidence,
            operator_profile_summary: operatorProfile.operator_profile_summary,
            operator_profile_reasons: operatorProfile.operator_profile_reasons,
            operator_profile_source: operatorProfile.operator_profile_source,
          },
        } satisfies GmailSenderWorkspaceSeedRow,
        senderView: {
          sender: rollupRow.sender,
          sender_key: rollupRow.sender_key,
          cleanup_group_message_count: cleanupGroupMessageCount,
          last_activity: lastActivityAt,
          first_seen: rollupRow.first_seen,
          category_summary: categoryProfile.category_summary,
          semantic_family: semantic.semantic_family,
          semantic_pattern: semantic.semantic_pattern,
          operator_profile_family:
            operatorProfile.operator_profile_family as SenderWorkspaceAnalyticsSeedSender['operator_profile_family'],
          dominant_pattern: dominantPattern,
          operator_profile_mode:
            operatorProfile.operator_profile_mode as SenderWorkspaceAnalyticsSeedSender['operator_profile_mode'],
          category_summary_source: categoryProfile.category_summary_source,
        } satisfies SenderWorkspaceAnalyticsSeedSender,
      }
    })

    const analyticsSeedSenders = clusterSeedSenders.map((entry) => entry.senderView)
    const senderCategoryDistribution = (() => {
      const counts = new Map<string, number>()
      for (const sender of analyticsSeedSenders) {
        const label = primarySenderWorkspaceCategory(sender.category_summary)
        counts.set(label, (counts.get(label) || 0) + 1)
      }
      return Array.from(counts.entries())
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 6)
        .map(([label, sender_count]) => ({ label, sender_count }))
    })()
    const senderActivityTimeline = buildSenderActivityTimeline({
      senders: analyticsSeedSenders,
      previewRows: Array.from(clusterPreviewRowsBySenderKey.values()).flat(),
      analysisScope: params.analysisScope,
      coverageStartIso: null,
      coverageEndIso: null,
    })
    const semanticAnalytics = buildSemanticAnalyticsDistributions(analyticsSeedSenders)
    const clusterMessageCount = clusterMessageCountById.get(clusterId) || 0
    const clusterContribution = analyticsSeedSenders
      .slice()
      .sort(
        (left, right) =>
          right.cleanup_group_message_count - left.cleanup_group_message_count ||
          left.sender.localeCompare(right.sender)
      )
      .slice(0, 6)
      .map((sender) => ({
        sender: sender.sender,
        sender_key: sender.sender_key,
        message_count: sender.cleanup_group_message_count,
        share_pct:
          clusterMessageCount > 0
            ? Math.round((sender.cleanup_group_message_count / clusterMessageCount) * 100)
            : 0,
      }))

    const senderCounts = new Map<string, number>()
    for (const sender of analyticsSeedSenders) {
      senderCounts.set(sender.sender, sender.cleanup_group_message_count)
    }
    const dominantSender =
      Array.from(senderCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || null
    const dominantPattern = dominantPatternCompatibilityLabel(
      semanticAnalytics.semantic_pattern_distribution[0] || null
    )
    const senderCount = clusterSeedSenders.length
    clusterDrafts.push({
      sourceClusterId: clusterId,
      clusterSpec,
      clusterPreviewRowsBySenderKey,
      clusterRollups,
      clusterSeedSenders,
      clusterMessageCount,
      senderCount,
      dominantSender,
      dominantPattern,
      protectedMessageCount: clusterRollups.reduce(
        (sum, row) => sum + row.protected_message_count,
        0
      ),
      senderCategoryDistribution,
      senderActivityTimeline,
      clusterContribution,
      semanticAnalytics,
    })
  }

  const surfacePlans = planCleanupGroupArtifactSurfaces(
    clusterDrafts.map((draft) => ({
      clusterId: draft.sourceClusterId,
      clusterType: draft.clusterSpec.cluster_type,
      title: draft.clusterSpec.title,
      query: draft.clusterSpec.query,
      whySelected: draft.clusterSpec.why_selected,
      riskNote: draft.clusterSpec.risk_note,
      safetyNote: draft.clusterSpec.safety_note,
      senderCount: draft.senderCount,
      messageCount: draft.clusterMessageCount,
      semanticRollup: buildPersistedSemanticRollupArtifactFields({
        clusterId: draft.sourceClusterId,
        senderCount: draft.senderCount,
        messageCount: draft.clusterMessageCount,
        semanticAnalytics: draft.semanticAnalytics,
      }).semantic_rollup,
    }))
  )

  const globalSenderKeys = new Set<string>()
  let globalParentSenderCount = 0
  for (const draft of clusterDrafts) {
    globalParentSenderCount += draft.senderCount
    for (const entry of draft.clusterSeedSenders) {
      if (globalSenderKeys.has(entry.seedRow.sender_key)) {
        throw new Error(`Review-unit candidate assigns sender ${entry.seedRow.sender_key} to multiple parents.`)
      }
      globalSenderKeys.add(entry.seedRow.sender_key)
    }
  }
  if (globalSenderKeys.size !== globalParentSenderCount) {
    throw new Error('Review-unit candidate parent totals do not equal the global cleanup universe.')
  }
  const reviewUnitArtifactCutoffAt = latestReviewUnitArtifactCutoffAt(clusterDrafts)

  for (const draft of clusterDrafts) {
    const surfacePlan = surfacePlans.get(draft.sourceClusterId) || null
    if (!surfacePlan) {
      throw new Error(`Review-unit candidate is missing a surface plan for ${draft.sourceClusterId}.`)
    }
    const projectedClusterId = surfacePlan?.projectedClusterId || draft.sourceClusterId
    const actionable = surfacePlan.surface.kind !== 'historical_parent'
    const reviewUnitBasis = reviewUnitBasisForParent({
      sourceClusterId: draft.sourceClusterId,
      projectedClusterId,
    })
    const materializedReviewUnits = materializeGmailReviewUnits({
      parentId: projectedClusterId,
      parentLabel: surfacePlan.projectedTitle || draft.clusterSpec.title,
      basis: reviewUnitBasis,
      actionable,
      artifactCutoffAt: reviewUnitArtifactCutoffAt,
      senders: draft.clusterSeedSenders.map((entry) => ({
        senderKey: entry.seedRow.sender_key,
        semanticFamilyKey: entry.seedRow.semantic_family_key,
        semanticSubtypeKey: entry.seedRow.semantic_subtype_key,
        semanticPatternKey: entry.seedRow.semantic_pattern_key,
        lastActivityAt: entry.seedRow.last_activity_at,
        messageCount: entry.seedRow.cleanup_group_message_count,
        assignmentReason:
          typeof entry.seedRow.seed_payload.assignment_reason === 'string'
            ? entry.seedRow.seed_payload.assignment_reason
            : null,
        exclusionReason:
          typeof entry.seedRow.seed_payload.cleanup_exclusion_reason === 'string'
            ? entry.seedRow.seed_payload.cleanup_exclusion_reason
            : null,
      })),
    })
    const reviewUnitValidation = validateGmailReviewUnitContract({
      parentId: projectedClusterId,
      actionable,
      parentSenderKeys: draft.clusterSeedSenders.map((entry) => entry.seedRow.sender_key),
      units: materializedReviewUnits.units,
      reviewUnitIdBySenderKey: materializedReviewUnits.reviewUnitIdBySenderKey,
    })
    if (reviewUnitValidation.errors.length > 0) {
      throw new Error(`Review-unit candidate validation failed: ${reviewUnitValidation.errors.join(' ')}`)
    }
    const materializedSurfacePlan: CleanupGroupArtifactSurfaceDecision = {
      ...surfacePlan,
      promotion: {
        ...surfacePlan.promotion,
        metrics: {
          ...surfacePlan.promotion.metrics,
          actionable_review_unit_count: materializedReviewUnits.units.length,
          largest_review_unit_sender_count: reviewUnitValidation.largestUnitSenderCount,
        },
      },
      review_unit_plan: {
        required: actionable,
        basis: reviewUnitBasis,
        trigger_reason: actionable ? 'published_membership_requires_bounded_child_selection' : null,
        units: materializedReviewUnits.units,
      },
    }
    const projectedSeedRows = draft.clusterSeedSenders.map((entry) => ({
      ...entry.seedRow,
      cluster_id: projectedClusterId,
      review_unit_id:
        materializedReviewUnits.reviewUnitIdBySenderKey.get(entry.seedRow.sender_key) || null,
      seed_payload: {
        ...entry.seedRow.seed_payload,
        cleanup_group_canonical_cluster_id:
          surfacePlan?.surface.canonical_cluster_id || projectedClusterId,
        cleanup_group_legacy_cluster_ids: surfacePlan?.surface.legacy_cluster_ids || [],
        cleanup_group_source_cluster_ids: surfacePlan?.surface.source_cluster_ids || [
          draft.sourceClusterId,
        ],
      },
    }))
    for (const projectedSeedRow of projectedSeedRows) {
      seedRows.push(projectedSeedRow)
    }

    const previewRowsForDraft = Array.from(draft.clusterPreviewRowsBySenderKey.values())
    for (const previewRowsBySender of previewRowsForDraft) {
      for (const row of previewRowsBySender) {
        projectedPreviewRows.push({
          ...row,
          cluster_id: projectedClusterId,
          preview_payload: {
            ...row.preview_payload,
            cleanup_group_canonical_cluster_id:
              surfacePlan?.surface.canonical_cluster_id || projectedClusterId,
            cleanup_group_legacy_cluster_ids: surfacePlan?.surface.legacy_cluster_ids || [],
            cleanup_group_source_cluster_ids: surfacePlan?.surface.source_cluster_ids || [
              draft.sourceClusterId,
            ],
          },
        })
      }
    }

    const semanticArtifactFields = buildPersistedSemanticRollupArtifactFields({
      clusterId: draft.sourceClusterId,
      senderCount: draft.senderCount,
      messageCount: draft.clusterMessageCount,
      semanticAnalytics: draft.semanticAnalytics,
      artifactSurfaceDecision: materializedSurfacePlan,
    })
    const sharePct =
      totalAssignedGroupMessages > 0
        ? Math.round((draft.clusterMessageCount / totalAssignedGroupMessages) * 100)
        : 0
    const headerAnalytics = {
      sender_category_distribution: draft.senderCategoryDistribution,
      semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
      semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
      semantic_rollup: semanticArtifactFields.semantic_rollup,
      group_policy_mode: semanticArtifactFields.group_policy_mode,
      dominant_semantic_family: semanticArtifactFields.dominant_semantic_family,
      dominant_semantic_pattern: semanticArtifactFields.dominant_semantic_pattern,
      uncertain_sender_count: semanticArtifactFields.uncertain_sender_count,
      semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
      semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
      semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
      semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
      semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
      semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      cleanup_group_surface_tier: semanticArtifactFields.cleanup_group_surface_tier,
      cleanup_group_surface_kind: semanticArtifactFields.cleanup_group_surface_kind,
      cleanup_group_surface_visibility: semanticArtifactFields.cleanup_group_surface_visibility,
      cleanup_group_top_level_rank: semanticArtifactFields.cleanup_group_top_level_rank,
      cleanup_group_canonical_cluster_id: semanticArtifactFields.cleanup_group_canonical_cluster_id,
      cleanup_group_legacy_cluster_ids: semanticArtifactFields.cleanup_group_legacy_cluster_ids,
      cleanup_group_source_cluster_ids: semanticArtifactFields.cleanup_group_source_cluster_ids,
      cleanup_group_promotion_status: semanticArtifactFields.cleanup_group_promotion_status,
      cleanup_group_selected_semantic_axis:
        semanticArtifactFields.cleanup_group_selected_semantic_axis,
      cleanup_group_operator_value_status:
        semanticArtifactFields.cleanup_group_operator_value_status,
      cleanup_group_review_units_required:
        semanticArtifactFields.cleanup_group_review_units_required,
      cleanup_group_review_unit_basis: semanticArtifactFields.cleanup_group_review_unit_basis,
      cleanup_group_review_unit_count: semanticArtifactFields.cleanup_group_review_unit_count,
      cleanup_group_demotion_reasons: semanticArtifactFields.cleanup_group_demotion_reasons,
      operator_profile_family_distribution: buildCompatibilityOperatorProfileFamilyDistribution(
        semanticArtifactFields.semantic_family_distribution
      ),
      dominant_pattern_distribution: buildCompatibilityDominantPatternDistribution(
        semanticArtifactFields.semantic_pattern_distribution
      ),
      operator_profile_mode_distribution: buildCompatibilityOperatorProfileModeDistribution(
        semanticArtifactFields.semantic_resolution_distribution
      ),
      category_summary_source_distribution: buildCategorySummarySourceDistribution(
        draft.clusterSeedSenders.map((entry) => entry.senderView)
      ),
      sender_activity_timeline: draft.senderActivityTimeline.items,
      sender_activity_timeline_granularity: draft.senderActivityTimeline.granularity,
      cluster_contribution: draft.clusterContribution,
      artifact_capabilities: {
        focused_semantic_page: true,
        focused_review_unit_page: actionable,
      },
    }
    const summaryPayload = {
      cleanup_candidate_group: draft.clusterRollups.every((row) => row.is_cleanup_candidate),
      semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
      semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
      semantic_rollup: semanticArtifactFields.semantic_rollup,
      group_policy_mode: semanticArtifactFields.group_policy_mode,
      dominant_semantic_family: semanticArtifactFields.dominant_semantic_family,
      dominant_semantic_pattern: semanticArtifactFields.dominant_semantic_pattern,
      semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
      semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
      semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
      semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
      semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
      semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      uncertain_sender_count: semanticArtifactFields.uncertain_sender_count,
      cleanup_group_surface_tier: semanticArtifactFields.cleanup_group_surface_tier,
      cleanup_group_surface_kind: semanticArtifactFields.cleanup_group_surface_kind,
      cleanup_group_surface_visibility: semanticArtifactFields.cleanup_group_surface_visibility,
      cleanup_group_top_level_rank: semanticArtifactFields.cleanup_group_top_level_rank,
      cleanup_group_canonical_cluster_id: semanticArtifactFields.cleanup_group_canonical_cluster_id,
      cleanup_group_legacy_cluster_ids: semanticArtifactFields.cleanup_group_legacy_cluster_ids,
      cleanup_group_source_cluster_ids: semanticArtifactFields.cleanup_group_source_cluster_ids,
      cleanup_group_promotion_status: semanticArtifactFields.cleanup_group_promotion_status,
      cleanup_group_selected_semantic_axis:
        semanticArtifactFields.cleanup_group_selected_semantic_axis,
      cleanup_group_operator_value_status:
        semanticArtifactFields.cleanup_group_operator_value_status,
      cleanup_group_review_units_required:
        semanticArtifactFields.cleanup_group_review_units_required,
      cleanup_group_review_unit_basis: semanticArtifactFields.cleanup_group_review_unit_basis,
      cleanup_group_review_unit_count: semanticArtifactFields.cleanup_group_review_unit_count,
      cleanup_group_demotion_reasons: semanticArtifactFields.cleanup_group_demotion_reasons,
    }

    assertSharedGroupSemanticRollupArtifactCongruence({
      clusterId: projectedClusterId,
      headerAnalytics,
      summaryPayload,
    })

    seedHeaders.push({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      cluster_id: projectedClusterId,
      artifact_version: params.artifactVersion,
      cluster_type: surfacePlan?.projectedClusterType || draft.clusterSpec.cluster_type,
      title: surfacePlan?.projectedTitle || draft.clusterSpec.title,
      query: surfacePlan?.projectedQuery || draft.clusterSpec.query,
      why_selected: surfacePlan?.projectedWhySelected || draft.clusterSpec.why_selected,
      risk_note: surfacePlan?.projectedRiskNote || draft.clusterSpec.risk_note,
      safety_note:
        surfacePlan?.projectedSafetyNote ||
        draft.clusterSpec.safety_note ||
        'Sender-first review keeps protected traffic visible.',
      message_count: draft.clusterMessageCount,
      sender_count: draft.senderCount,
      share_pct: sharePct,
      pagination: {
        page: 1,
        page_size: 1000,
        total_senders: draft.senderCount,
        total_pages: 1,
        cluster_total_senders: draft.senderCount,
      },
      analytics: headerAnalytics,
      source: 'full_mailbox_artifact',
    })

    clusterSummaries.push({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      cluster_id: projectedClusterId,
      artifact_version: params.artifactVersion,
      cluster_type: surfacePlan?.projectedClusterType || draft.clusterSpec.cluster_type,
      title: surfacePlan?.projectedTitle || draft.clusterSpec.title,
      query: surfacePlan?.projectedQuery || draft.clusterSpec.query,
      why_selected: surfacePlan?.projectedWhySelected || draft.clusterSpec.why_selected,
      risk_note: surfacePlan?.projectedRiskNote || draft.clusterSpec.risk_note,
      safety_note:
        surfacePlan?.projectedSafetyNote ||
        draft.clusterSpec.safety_note ||
        'Sender-first review keeps protected traffic visible.',
      message_count: draft.clusterMessageCount,
      sender_count: draft.senderCount,
      share_pct: sharePct,
      dominant_sender: draft.dominantSender,
      dominant_pattern: draft.dominantPattern,
      protected_message_count: draft.protectedMessageCount,
      uncertain_sender_count: semanticArtifactFields.uncertain_sender_count,
      summary_payload: summaryPayload,
    })
  }

  clusterSummaries.sort(
    (left, right) => right.message_count - left.message_count || left.title.localeCompare(right.title)
  )
  seedHeaders.sort(
    (left, right) => right.message_count - left.message_count || left.title.localeCompare(right.title)
  )

  return {
    seedRows,
    seedHeaders,
    clusterSummaries,
    projectedPreviewRows,
  }
}

export function buildGmailClusterArtifactRows(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  clusterSpecs: Record<string, GmailClusterSpecSnapshot>
  previewRows: GmailPreviewIndexRow[]
  statsBySenderKey: Map<string, GmailSenderStatsArtifactRow>
  rollups: GmailSenderScopeRollupRow[]
}): {
  seedRows: GmailSenderWorkspaceSeedRow[]
  seedHeaders: GmailSenderWorkspaceSeedHeaderRow[]
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  projectedPreviewRows: GmailPreviewIndexRow[]
} {
  const rollupsBySenderKey = new Map(params.rollups.map((row) => [row.sender_key, row]))
  return buildSeedRowsAndHeaders({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    clusterSpecs: params.clusterSpecs,
    previewRows: params.previewRows,
    statsBySenderKey: params.statsBySenderKey,
    rollupsBySenderKey,
  })
}

export type GmailSenderArtifactProjection = {
  sender_key: string
  sender: string
  rollup_row: GmailSenderScopeRollupRow | null
  preview_rows: GmailPreviewIndexRow[]
  cluster_spec: GmailClusterSpecSnapshot | null
}

export function projectGmailSenderArtifactSlice(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  senderKey: string
  sender?: string | null
  rows: GmailMailboxStreamRow[]
  nowMs?: number
}): GmailSenderArtifactProjection {
  const nowMs = params.nowMs ?? Date.now()
  const senderKey = normalizeText(params.senderKey)
  const sender =
    normalizeText(params.sender) ||
    normalizeText(params.rows[0]?.sender) ||
    senderKey ||
    'Unknown sender'
  if (!senderKey || params.rows.length === 0) {
    return {
      sender_key: senderKey,
      sender,
      rollup_row: null,
      preview_rows: [],
      cluster_spec: null,
    }
  }

  const scopedRows = params.rows.filter((row) =>
    isRowWithinAnalysisScope(row, params.analysisScope, nowMs)
  )
  const scopedInboxRows = scopedRows.filter((row) => row.is_in_inbox)
  const cleanupDecision = assignSenderCleanupGroupDecision({
    sender,
    rows: scopedRows,
    nowMs,
  })
  const rollupRow = buildSenderScopeRollup({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    sender,
    senderKey,
    scopedRows,
    scopedInboxRows,
    assignedCleanupGroupId: cleanupDecision.groupSpec.cluster_id as GmailAssignedCleanupGroupId,
    assignmentReason: cleanupDecision.assignmentReason,
    isCleanupCandidate: cleanupDecision.isCleanupCandidate,
    exclusionReason: cleanupDecision.exclusionReason,
  })

  const previewSeedRows = shouldUseStructuralPreviewSeedFallback({
    scopedInboxRows,
    isCleanupCandidate: cleanupDecision.isCleanupCandidate,
    exclusionReason: cleanupDecision.exclusionReason,
  })
    ? selectStructuralPreviewSeedRows({ rows: scopedRows })
    : scopedInboxRows
  const previewRows =
    previewSeedRows.length > 0
      ? buildPreviewIndexRows({
          tenantId: params.tenantId,
          analysisScope: params.analysisScope,
          artifactVersion: params.artifactVersion,
          clusterId: cleanupDecision.groupSpec.cluster_id,
          senderKey,
          rows: previewSeedRows,
        })
      : []

  return {
    sender_key: senderKey,
    sender,
    rollup_row: rollupRow,
    preview_rows: previewRows,
    cluster_spec: toCleanupClusterSnapshot(cleanupDecision.groupSpec),
  }
}

function buildWholeMailboxTimeline(params: {
  aggregate: GmailWholeMailboxAggregateCheckpoint
}): GmailPressureTimelineBucket[] {
  return Object.entries(params.aggregate.timeline_buckets)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([label, bucket]) => ({
      label: activityTimelineLabelForBucket(label, params.aggregate.timeline_granularity),
      count: bucket.count,
      composition: Object.entries(bucket.composition_counts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .map(([compositionLabel, count]) => ({
          label: compositionLabel,
          count,
          share_pct: bucket.count > 0 ? Math.round((count / bucket.count) * 100) : 0,
        })),
      evidence_signals: buildPressureEvidenceSignals({
        total: bucket.count,
        machineLikeCount: bucket.machine_like_count,
        humanLikeCount: bucket.human_like_count,
        protectedCount: bucket.protected_count,
      }),
    }))
}

function buildWholeMailboxSnapshot(params: {
  analysisScope: GmailArtifactAnalysisScope
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  aggregate: GmailWholeMailboxAggregateCheckpoint
  rollups: GmailSenderScopeRollupRow[]
  candidateUniverse: ReturnType<typeof buildCleanupGroupIntelligence>
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  candidateRows: GmailMailboxStreamRow[]
}): GmailMailboxIntelligenceData {
  const scopedTotalMessages = params.rollups.reduce((sum, row) => sum + row.total_message_count, 0)
  const topSenders = params.rollups
    .slice()
    .sort(
      (left, right) =>
        right.total_message_count - left.total_message_count ||
        left.sender.localeCompare(right.sender)
    )
    .slice(0, 8)
    .map((row) => ({
      sender: row.sender,
      sender_key: row.sender_key,
      message_count: row.total_message_count,
      share_pct:
        scopedTotalMessages > 0 ? Math.round((row.total_message_count / scopedTotalMessages) * 100) : 0,
    }))
  const senderVolumeDistribution = [
    { label: '1 message', sender_count: 0 },
    { label: '2-5 messages', sender_count: 0 },
    { label: '6-10 messages', sender_count: 0 },
    { label: '11-25 messages', sender_count: 0 },
    { label: '26-50 messages', sender_count: 0 },
    { label: '51+ messages', sender_count: 0 },
  ]
  for (const row of params.rollups) {
    const count = row.total_message_count
    if (count <= 1) senderVolumeDistribution[0].sender_count += 1
    else if (count <= 5) senderVolumeDistribution[1].sender_count += 1
    else if (count <= 10) senderVolumeDistribution[2].sender_count += 1
    else if (count <= 25) senderVolumeDistribution[3].sender_count += 1
    else if (count <= 50) senderVolumeDistribution[4].sender_count += 1
    else senderVolumeDistribution[5].sender_count += 1
  }

  const cautionCandidateMessageCount = params.candidateRows.filter((row) =>
    row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
  ).length
  const lowRiskCandidateMessageCount = Math.max(0, params.candidateRows.length - cautionCandidateMessageCount)
  const senderRanking = params.rollups
    .slice()
    .sort(
      (left, right) =>
        right.cleanup_candidate_message_count - left.cleanup_candidate_message_count ||
        right.total_message_count - left.total_message_count ||
        left.sender.localeCompare(right.sender)
    )
    .map((row) => ({
      sender: row.sender,
      sender_key: row.sender_key,
      assigned_cleanup_group_id: row.assigned_cleanup_group_id,
      assignment_reason: row.assignment_reason,
      is_cleanup_candidate: row.is_cleanup_candidate,
      total_message_count: row.total_message_count,
      cleanup_candidate_message_count: row.cleanup_candidate_message_count,
      protected_message_count: row.protected_message_count,
      unread_count: row.unread_count,
      first_seen: row.first_seen,
      last_seen: row.last_seen,
      category_summary: row.category_summary,
      sender_signal: row.sender_signal,
      cleanup_exclusion_reason: row.cleanup_exclusion_reason,
    }))

  const pressureTrend = buildGmailPressureTrendData({
    rows: params.candidateRows,
    coverage: params.coverage,
    pressureWindow: 'all_indexed',
    timeZone: 'UTC',
  })

  return {
    analysis_scope: params.analysisScope,
    scope_ladder: {
      whole_mailbox: params.coverage.indexed_total_rows,
      cleanup_candidate_universe: params.candidateUniverse.cleanup_group_total_messages,
      cleanup_group: 0,
      sender_set: params.rollups.length,
      loaded_preview_rows: Math.min(25, params.rollups.length),
    },
    whole_mailbox: {
      message_count: params.coverage.indexed_total_rows,
      sender_count: params.rollups.length,
      indexed_inbox_rows: params.coverage.indexed_inbox_rows,
      indexed_date_span_start: params.coverage.indexed_date_span_start,
      indexed_date_span_end: params.coverage.indexed_date_span_end,
      top_senders: topSenders,
      sender_volume_distribution: senderVolumeDistribution,
      activity_timeline: buildWholeMailboxTimeline({ aggregate: params.aggregate }),
      activity_timeline_granularity: params.aggregate.timeline_granularity,
      category_breakdown: Object.entries(params.aggregate.category_counts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 8)
        .map(([label, count]) => ({ label, count })),
      human_vs_automation: Object.entries(params.aggregate.human_automation_counts).map(
        ([label, count]) => ({
          label,
          count,
          exactness: 'inferred' as const,
        })
      ),
    },
    cleanup_candidate_universe: {
      message_count: params.candidateUniverse.cleanup_group_total_messages,
      sender_count: params.candidateUniverse.cleanup_group_sender_count,
      cleanup_date_span_start: params.candidateUniverse.cleanup_date_span_start,
      cleanup_date_span_end: params.candidateUniverse.cleanup_date_span_end,
      top_senders: params.candidateUniverse.top_senders,
      sender_volume_distribution: params.candidateUniverse.sender_volume_distribution,
      activity_timeline: params.candidateUniverse.activity_timeline,
      activity_timeline_granularity: nonHourlyTimelineGranularity(
        params.candidateUniverse.activity_timeline_granularity
      ),
      category_breakdown: params.candidateUniverse.category_breakdown,
      human_vs_automation: params.candidateUniverse.human_vs_automation,
    },
    protected_safe_context: {
      protected_message_count: params.aggregate.protected_message_count,
      protected_sender_count: params.rollups.filter((row) => row.protected_message_count > 0).length,
      likely_human_message_count: params.aggregate.likely_human_message_count,
      likely_human_sender_count: params.rollups.filter((row) => row.likely_human_message_count > 0).length,
      caution_candidate_message_count: cautionCandidateMessageCount,
      low_risk_candidate_message_count: lowRiskCandidateMessageCount,
      summary:
        cautionCandidateMessageCount > 0
          ? `${cautionCandidateMessageCount.toLocaleString()} candidate messages still show protection signals and should funnel through Exceptions before archive.`
          : 'Current cleanup candidates are mostly low-risk machine-like traffic.',
    },
    cleanup_groups: params.clusterSummaries.map((summary) => {
      const summaryPayload = (summary.summary_payload || {}) as Record<string, unknown>
      const cleanupGroupEntry: GmailMailboxIntelligenceData['cleanup_groups'][number] = {
        cluster_id: summary.cluster_id,
        canonical_cluster_id:
          typeof summaryPayload.cleanup_group_canonical_cluster_id === 'string'
            ? summaryPayload.cleanup_group_canonical_cluster_id
            : summary.cluster_id,
        legacy_cluster_ids: Array.isArray(summaryPayload.cleanup_group_legacy_cluster_ids)
          ? summaryPayload.cleanup_group_legacy_cluster_ids
          : [],
        source_cluster_ids: Array.isArray(summaryPayload.cleanup_group_source_cluster_ids)
          ? summaryPayload.cleanup_group_source_cluster_ids
          : [summary.cluster_id],
        cluster_type: summary.cluster_type,
        title: summary.title,
        query: summary.query,
        why_selected: summary.why_selected || 'Grouped by shared sender behavior.',
        risk_note: summary.risk_note || 'Review for mixed-content senders before archive.',
        safety_note:
          summary.safety_note || 'Sender-first review keeps protected traffic visible.',
        message_count: summary.message_count,
        sender_count: summary.sender_count,
        share_pct: summary.share_pct,
        dominant_sender: summary.dominant_sender,
        dominant_semantic_family:
          (summaryPayload.dominant_semantic_family as GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_family']) ||
          null,
        dominant_semantic_pattern:
          (summaryPayload.dominant_semantic_pattern as GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_pattern']) ||
          null,
        dominant_pattern: summary.dominant_pattern,
        protected_message_count: summary.protected_message_count,
        uncertain_sender_count: summary.uncertain_sender_count,
        surface_tier:
          ((typeof summaryPayload.cleanup_group_surface_tier === 'string'
            ? summaryPayload.cleanup_group_surface_tier
            : 'secondary') as GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_tier']),
        surface_kind:
          ((typeof summaryPayload.cleanup_group_surface_kind === 'string'
            ? summaryPayload.cleanup_group_surface_kind
            : 'secondary_candidate') as GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_kind']),
        surface_visibility:
          ((typeof summaryPayload.cleanup_group_surface_visibility === 'string'
            ? summaryPayload.cleanup_group_surface_visibility
            : 'visible') as GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_visibility']),
        top_level_rank:
          typeof summaryPayload.cleanup_group_top_level_rank === 'number'
            ? summaryPayload.cleanup_group_top_level_rank
            : null,
        promotion_status:
          ((typeof summaryPayload.cleanup_group_promotion_status === 'string'
            ? summaryPayload.cleanup_group_promotion_status
            : 'unresolved') as GmailMailboxIntelligenceData['cleanup_groups'][number]['promotion_status']),
        selected_semantic_axis:
          summaryPayload.cleanup_group_selected_semantic_axis === 'family' ||
          summaryPayload.cleanup_group_selected_semantic_axis === 'pattern'
            ? summaryPayload.cleanup_group_selected_semantic_axis
            : null,
        operator_value_status:
          ((typeof summaryPayload.cleanup_group_operator_value_status === 'string'
            ? summaryPayload.cleanup_group_operator_value_status
            : 'not_applicable') as GmailMailboxIntelligenceData['cleanup_groups'][number]['operator_value_status']),
        review_units_required: summaryPayload.cleanup_group_review_units_required === true,
        review_unit_basis:
          ((typeof summaryPayload.cleanup_group_review_unit_basis === 'string'
            ? summaryPayload.cleanup_group_review_unit_basis
            : 'not_promoted') as GmailMailboxIntelligenceData['cleanup_groups'][number]['review_unit_basis']),
        review_unit_count:
          typeof summaryPayload.cleanup_group_review_unit_count === 'number'
            ? summaryPayload.cleanup_group_review_unit_count
            : 0,
        semantic_rollup_schema_version:
          typeof summaryPayload.semantic_rollup_schema_version === 'number'
            ? summaryPayload.semantic_rollup_schema_version
            : null,
        semantic_rollup_hash:
          typeof summaryPayload.semantic_rollup_hash === 'string'
            ? summaryPayload.semantic_rollup_hash
            : null,
        semantic_rollup:
          (summaryPayload.semantic_rollup as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_rollup']) ||
          null,
        semantic_family_distribution: Array.isArray(summaryPayload.semantic_family_distribution)
          ? (summaryPayload.semantic_family_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_family_distribution'])
          : [],
        semantic_pattern_distribution: Array.isArray(summaryPayload.semantic_pattern_distribution)
          ? (summaryPayload.semantic_pattern_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_pattern_distribution'])
          : [],
        semantic_resolution_distribution: Array.isArray(
          summaryPayload.semantic_resolution_distribution
        )
          ? (summaryPayload.semantic_resolution_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_resolution_distribution'])
          : [],
        semantic_confidence_distribution: Array.isArray(
          summaryPayload.semantic_confidence_distribution
        )
          ? (summaryPayload.semantic_confidence_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_confidence_distribution'])
          : [],
        semantic_provenance_distribution: Array.isArray(
          summaryPayload.semantic_provenance_distribution
        )
          ? (summaryPayload.semantic_provenance_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_provenance_distribution'])
          : [],
        semantic_umbrella_distribution: Array.isArray(
          summaryPayload.semantic_umbrella_distribution
        )
          ? (summaryPayload.semantic_umbrella_distribution as GmailMailboxIntelligenceData['cleanup_groups'][number]['semantic_umbrella_distribution'])
          : [],
      }
      return cleanupGroupEntry
    }),
    sender_ranking: senderRanking,
    initial_pressure_trend: pressureTrend.ok ? pressureTrend.data : null,
    source: 'gmail_index_cache',
  }
}

function buildPressureTrendBuckets(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  candidateRows: GmailMailboxStreamRow[]
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
}): GmailMailboxIntelligenceBucketRow[] {
  const rows: GmailMailboxIntelligenceBucketRow[] = []
  for (const pressureWindow of GMAIL_PRESSURE_TREND_ARTIFACT_WINDOWS) {
    const trend = buildGmailPressureTrendData({
      rows: params.candidateRows,
      coverage: params.coverage,
      pressureWindow,
      timeZone: 'UTC',
    })
    if (!trend.ok) continue
    const bucketFamily = gmailPressureTrendArtifactBucketFamilyForWindow(pressureWindow)
    rows.push(
      ...trend.data.series.map((bucket, index) => ({
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        artifact_version: params.artifactVersion,
        bucket_kind: bucketFamily,
        bucket_key: `${trend.data.grouping.key}:${String(index + 1).padStart(4, '0')}`,
        bucket_start_at: bucket.bucket_start_at,
        bucket_end_at: bucket.bucket_end_at,
        bucket_value: bucket.count,
        bucket_payload: {
          window_key: trend.data.window.key,
          window_label: trend.data.window.label,
          requested_start: trend.data.window.requested_start,
          requested_end: trend.data.window.requested_end,
          effective_start: trend.data.window.effective_start,
          effective_end: trend.data.window.effective_end,
          limited_by_indexed_coverage: trend.data.window.limited_by_indexed_coverage,
          grouping_key: trend.data.grouping.key,
          grouping_label: trend.data.grouping.label,
          time_zone: trend.data.time_zone,
          label: bucket.label,
          count: bucket.count,
          composition: bucket.composition || [],
          evidence_signals: bucket.evidence_signals || [],
          bucket_start_at: bucket.bucket_start_at,
          bucket_end_at: bucket.bucket_end_at,
        },
      }))
    )
  }
  return rows
}

export function buildGmailMailboxIntelligenceRows(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  aggregate: GmailWholeMailboxAggregateCheckpoint
  rollups: GmailSenderScopeRollupRow[]
  previewRows: GmailPreviewIndexRow[]
  clusterSummaries: GmailClusterSummaryArtifactRow[]
}): {
  snapshotRows: GmailMailboxIntelligenceSnapshotRow[]
  bucketRows: GmailMailboxIntelligenceBucketRow[]
  snapshotPayload: GmailMailboxIntelligenceData & {
    artifact_internal: {
      whole_mailbox_aggregate: GmailWholeMailboxAggregateCheckpoint
    }
  }
} {
  const cleanupGroupSourceClusterIds = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
  }
  const rowReferencesCleanupCandidateGroup = (params: {
    clusterId: string
    payload: Record<string, unknown> | null | undefined
  }): boolean =>
    isCleanupCandidateGroupId(params.clusterId) ||
    cleanupGroupSourceClusterIds(params.payload?.cleanup_group_source_cluster_ids).some((clusterId) =>
      isCleanupCandidateGroupId(clusterId)
    )

  const candidatePreviewRows = params.previewRows.filter((row) =>
    rowReferencesCleanupCandidateGroup({
      clusterId: row.cluster_id,
      payload: row.preview_payload,
    })
  )
  const candidatePreviewMailboxRows = candidatePreviewRows.map(previewRowToMailboxRow)
  const candidateClusterSummaries = params.clusterSummaries.filter((summary) =>
    rowReferencesCleanupCandidateGroup({
      clusterId: summary.cluster_id,
      payload: summary.summary_payload,
    })
  )
  const candidateUniverse = buildCleanupGroupIntelligence({
    rows: candidatePreviewMailboxRows,
    coverage: params.coverage,
    analysisScope: params.analysisScope as GmailAnalysisScope,
    clusterCount: candidateClusterSummaries.length,
  })
  const snapshotPayload = {
    ...buildWholeMailboxSnapshot({
      analysisScope: params.analysisScope,
      coverage: params.coverage,
      aggregate: params.aggregate,
      rollups: params.rollups,
      candidateUniverse,
      clusterSummaries: params.clusterSummaries,
      candidateRows: candidatePreviewMailboxRows,
    }),
    artifact_internal: {
      whole_mailbox_aggregate: cloneWholeMailboxAggregate(params.aggregate),
    },
  } as GmailMailboxIntelligenceData & {
    artifact_internal: {
      whole_mailbox_aggregate: GmailWholeMailboxAggregateCheckpoint
    }
  }

  return {
    snapshotRows: [
      {
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        artifact_version: params.artifactVersion,
        snapshot_payload: snapshotPayload as unknown as Record<string, unknown>,
        source: 'full_mailbox_artifact',
      },
    ],
    bucketRows: buildPressureTrendBuckets({
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      artifactVersion: params.artifactVersion,
      candidateRows: candidatePreviewMailboxRows,
      coverage: params.coverage,
    }),
    snapshotPayload,
  }
}

export function buildGmailArtifactDerivedRows(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  aggregate: GmailWholeMailboxAggregateCheckpoint
  rollups: GmailSenderScopeRollupRow[]
  previewRows: GmailPreviewIndexRow[]
  clusterSpecs: Record<string, GmailClusterSpecSnapshot>
  statsBySenderKey: Map<string, GmailSenderStatsArtifactRow>
}): {
  seedRows: GmailSenderWorkspaceSeedRow[]
  seedHeaders: GmailSenderWorkspaceSeedHeaderRow[]
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  previewRows: GmailPreviewIndexRow[]
  snapshotRows: GmailMailboxIntelligenceSnapshotRow[]
  bucketRows: GmailMailboxIntelligenceBucketRow[]
  snapshotPayload: GmailMailboxIntelligenceData & {
    artifact_internal: {
      whole_mailbox_aggregate: GmailWholeMailboxAggregateCheckpoint
    }
  }
} {
  const { seedRows, seedHeaders, clusterSummaries, projectedPreviewRows } =
    buildGmailClusterArtifactRows({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    clusterSpecs: params.clusterSpecs,
    previewRows: params.previewRows,
    statsBySenderKey: params.statsBySenderKey,
    rollups: params.rollups,
  })
  const mailboxIntelligenceRows = buildGmailMailboxIntelligenceRows({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    coverage: params.coverage,
    aggregate: params.aggregate,
    rollups: params.rollups,
    previewRows: projectedPreviewRows,
    clusterSummaries,
  })

  return {
    seedRows,
    seedHeaders,
    clusterSummaries,
    previewRows: projectedPreviewRows,
    snapshotRows: mailboxIntelligenceRows.snapshotRows,
    bucketRows: mailboxIntelligenceRows.bucketRows,
    snapshotPayload: mailboxIntelligenceRows.snapshotPayload,
  }
}

export function extractWholeMailboxAggregateFromSnapshotPayload(params: {
  analysisScope: GmailArtifactAnalysisScope
  snapshotPayload: Record<string, unknown> | null | undefined
}): GmailWholeMailboxAggregateCheckpoint | null {
  const internal =
    typeof params.snapshotPayload === 'object' && params.snapshotPayload != null
      ? (params.snapshotPayload as { artifact_internal?: { whole_mailbox_aggregate?: unknown } })
          .artifact_internal
      : null
  const aggregate = internal?.whole_mailbox_aggregate
  if (typeof aggregate === 'object' && aggregate != null) {
    try {
      return {
        timeline_granularity:
          aggregate &&
          typeof aggregate === 'object' &&
          (aggregate as { timeline_granularity?: unknown }).timeline_granularity === 'day'
            ? 'day'
            : aggregate &&
                typeof aggregate === 'object' &&
                (aggregate as { timeline_granularity?: unknown }).timeline_granularity === 'week'
              ? 'week'
              : 'month',
        category_counts:
          typeof (aggregate as { category_counts?: unknown }).category_counts === 'object' &&
          (aggregate as { category_counts?: unknown }).category_counts != null
            ? ((aggregate as { category_counts: Record<string, number> }).category_counts)
            : {},
        human_automation_counts:
          typeof (aggregate as { human_automation_counts?: unknown }).human_automation_counts ===
            'object' &&
          (aggregate as { human_automation_counts?: unknown }).human_automation_counts != null
            ? ((aggregate as { human_automation_counts: Record<string, number> })
                .human_automation_counts)
            : {
                'Automation-heavy': 0,
                'Human-like': 0,
                'Mixed / unclear': 0,
              },
        timeline_buckets:
          typeof (aggregate as { timeline_buckets?: unknown }).timeline_buckets === 'object' &&
          (aggregate as { timeline_buckets?: unknown }).timeline_buckets != null
            ? ((aggregate as { timeline_buckets: Record<string, WholeMailboxAggregateBucket> })
                .timeline_buckets)
            : {},
        protected_message_count: normalizeInteger(
          (aggregate as { protected_message_count?: unknown }).protected_message_count
        ),
        likely_human_message_count: normalizeInteger(
          (aggregate as { likely_human_message_count?: unknown }).likely_human_message_count
        ),
      }
    } catch {
      return null
    }
  }

  const snapshot =
    typeof params.snapshotPayload === 'object' && params.snapshotPayload != null
      ? (params.snapshotPayload as {
          whole_mailbox?: {
            category_breakdown?: unknown
            human_vs_automation?: unknown
            activity_timeline?: unknown
            activity_timeline_granularity?: unknown
          }
          protected_safe_context?: {
            protected_message_count?: unknown
            likely_human_message_count?: unknown
          }
        })
      : null
  if (!snapshot?.whole_mailbox) return null

  const timelineGranularity =
    snapshot.whole_mailbox.activity_timeline_granularity === 'day'
      ? 'day'
      : snapshot.whole_mailbox.activity_timeline_granularity === 'week'
        ? 'week'
        : snapshot.whole_mailbox.activity_timeline_granularity === 'month'
          ? 'month'
          : createWholeMailboxAggregate(params.analysisScope).timeline_granularity
  const reconstructed = createWholeMailboxAggregate(params.analysisScope)
  reconstructed.timeline_granularity = timelineGranularity
  let hasVisibleAggregateData = false

  if (Array.isArray(snapshot.whole_mailbox.category_breakdown)) {
    for (const entry of snapshot.whole_mailbox.category_breakdown) {
      if (typeof entry !== 'object' || entry == null) continue
      const label = normalizeText((entry as { label?: unknown }).label)
      if (!label) continue
      reconstructed.category_counts[label] = normalizeInteger(
        (entry as { count?: unknown }).count
      )
      hasVisibleAggregateData = true
    }
  }

  if (Array.isArray(snapshot.whole_mailbox.human_vs_automation)) {
    for (const entry of snapshot.whole_mailbox.human_vs_automation) {
      if (typeof entry !== 'object' || entry == null) continue
      const label = normalizeText((entry as { label?: unknown }).label)
      if (!label) continue
      reconstructed.human_automation_counts[label] = normalizeInteger(
        (entry as { count?: unknown }).count
      )
      hasVisibleAggregateData = true
    }
  }

  if (Array.isArray(snapshot.whole_mailbox.activity_timeline)) {
    for (const entry of snapshot.whole_mailbox.activity_timeline) {
      if (typeof entry !== 'object' || entry == null) continue
      const bucketKey = timelineBucketKeyFromSnapshotLabel({
        label: normalizeText((entry as { label?: unknown }).label),
        granularity: timelineGranularity,
      })
      if (!bucketKey) continue
      const compositionCounts: Record<string, number> = {}
      const compositionEntries = Array.isArray((entry as { composition?: unknown }).composition)
        ? ((entry as { composition: Array<{ label?: unknown; count?: unknown }> }).composition)
        : []
      for (const compositionEntry of compositionEntries) {
        const label = normalizeText(compositionEntry?.label)
        if (!label) continue
        compositionCounts[label] = normalizeInteger(compositionEntry?.count)
      }
      let machineLikeCount = 0
      let humanLikeCount = 0
      let protectedCount = 0
      const evidenceSignals = Array.isArray((entry as { evidence_signals?: unknown }).evidence_signals)
        ? ((entry as {
            evidence_signals: Array<{ label?: unknown; count?: unknown }>
          }).evidence_signals)
        : []
      for (const signal of evidenceSignals) {
        const label = normalizeText(signal?.label)
        const count = normalizeInteger(signal?.count)
        if (label === 'Automation-heavy') machineLikeCount = count
        if (label === 'Human-like') humanLikeCount = count
        if (label === 'Protected signals') protectedCount = count
      }
      reconstructed.timeline_buckets[bucketKey] = {
        count: normalizeInteger((entry as { count?: unknown }).count),
        composition_counts: compositionCounts,
        machine_like_count: machineLikeCount,
        human_like_count: humanLikeCount,
        protected_count: protectedCount,
      }
      hasVisibleAggregateData = true
    }
  }

  reconstructed.protected_message_count = normalizeInteger(
    snapshot.protected_safe_context?.protected_message_count
  )
  reconstructed.likely_human_message_count = normalizeInteger(
    snapshot.protected_safe_context?.likely_human_message_count
  )
  if (
    reconstructed.protected_message_count > 0 ||
    reconstructed.likely_human_message_count > 0
  ) {
    hasVisibleAggregateData = true
  }

  return hasVisibleAggregateData ? reconstructed : null
}

export async function finalizeGmailFullMailboxArtifacts(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  checkpoint: GmailArtifactCheckpointPayload
  initialFinalizeCheckpoint?: GmailArtifactFinalizeCheckpoint | null
  onProgress?: (progress: GmailArtifactFinalizeProgress) => Promise<void> | void
}): Promise<{
  finalize_checkpoint: GmailArtifactFinalizeCheckpoint
  row_counts: {
    sender_workspace_seed_headers: number
    sender_workspace_seed_rows: number
    sender_scope_rollups: number
    cluster_summaries: number
    mailbox_intelligence_snapshots: number
    mailbox_intelligence_buckets: number
    preview_index_rows: number
  }
}> {
  const finalizeCheckpoint = cloneFinalizeCheckpoint(
    params.initialFinalizeCheckpoint ?? createEmptyFinalizeCheckpoint()
  )
  finalizeCheckpoint.started_at = finalizeCheckpoint.started_at || nowIso()

  const emitFinalizeProgress = async (stage: GmailArtifactFinalizeStage): Promise<void> => {
    finalizeCheckpoint.current_stage = stage
    finalizeCheckpoint.updated_at = nowIso()
    if (stage === 'finalize_completed') {
      finalizeCheckpoint.completed_at = finalizeCheckpoint.updated_at
    }
    if (!params.onProgress) return
    await params.onProgress({
      stage,
      checkpoint: cloneFinalizeCheckpoint(finalizeCheckpoint),
    })
  }

  await emitFinalizeProgress('loading_finalize_inputs')
  const [rollups, previewRows] = await Promise.all([
    withSupabaseRetry({
      label: 'gmail_sender_scope_rollups.load_for_finalize',
      run: () =>
        loadGmailSenderScopeRollupsForArtifactVersion({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: params.analysisScope,
          artifactVersion: params.artifactVersion,
        }),
    }),
    withSupabaseRetry({
      label: 'gmail_preview_index.load_for_finalize',
      run: () =>
        loadGmailPreviewIndexRowsForArtifactVersion({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: params.analysisScope,
          artifactVersion: params.artifactVersion,
          clusterIds: Object.keys(params.checkpoint.cluster_specs),
        }),
    }),
  ])
  finalizeCheckpoint.input_row_counts = {
    sender_scope_rollups: rollups.length,
    preview_index_rows: previewRows.length,
  }

  await emitFinalizeProgress('building_finalize_rows')
  const statsBySenderKey = await loadGmailSenderStatsMap({
    supabase: params.supabase,
    tenantId: params.tenantId,
    senders: rollups.map((row) => row.sender_key),
  })
  const derivedRows = buildGmailArtifactDerivedRows({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    coverage: params.coverage,
    aggregate: params.checkpoint.whole_mailbox_aggregate,
    rollups,
    previewRows,
    clusterSpecs: params.checkpoint.cluster_specs,
    statsBySenderKey,
  })
  finalizeCheckpoint.derived_row_counts = {
    sender_workspace_seed_headers: derivedRows.seedHeaders.length,
    sender_workspace_seed_rows: derivedRows.seedRows.length,
    cluster_summaries: derivedRows.clusterSummaries.length,
    mailbox_intelligence_snapshots: derivedRows.snapshotRows.length,
    mailbox_intelligence_buckets: derivedRows.bucketRows.length,
    preview_index_rows: derivedRows.previewRows.length,
  }

  const writeStages: Array<{
    stage: GmailArtifactFinalizeWriteStage
    label: string
    run: () => Promise<void>
  }> = [
    {
      stage: 'writing_preview_index_rows',
      label: 'gmail_preview_index.upsert',
      run: () =>
        upsertGmailPreviewIndexRows({
          supabase: params.supabase,
          rows: derivedRows.previewRows,
        }),
    },
    {
      stage: 'writing_seed_rows',
      label: 'gmail_sender_workspace_seed_rows.upsert',
      run: () =>
        upsertGmailSenderWorkspaceSeedRows({
          supabase: params.supabase,
          rows: derivedRows.seedRows,
        }),
    },
    {
      stage: 'writing_seed_headers',
      label: 'gmail_sender_workspace_seed_headers.upsert',
      run: () =>
        upsertGmailSenderWorkspaceSeedHeaders({
          supabase: params.supabase,
          rows: derivedRows.seedHeaders,
        }),
    },
    {
      stage: 'writing_cluster_summaries',
      label: 'gmail_cluster_summaries.upsert',
      run: () =>
        upsertGmailClusterSummaries({
          supabase: params.supabase,
          rows: derivedRows.clusterSummaries,
        }),
    },
    {
      stage: 'writing_mailbox_intelligence_snapshots',
      label: 'gmail_mailbox_intelligence_snapshots.upsert',
      run: () =>
        upsertGmailMailboxIntelligenceSnapshots({
          supabase: params.supabase,
          rows: derivedRows.snapshotRows,
        }),
    },
    {
      stage: 'writing_mailbox_intelligence_buckets',
      label: 'gmail_mailbox_intelligence_buckets.upsert',
      run: () =>
        upsertGmailMailboxIntelligenceBuckets({
          supabase: params.supabase,
          rows: derivedRows.bucketRows,
        }),
    },
  ]

  for (const stage of writeStages) {
    await emitFinalizeProgress(stage.stage)
    if (!isFinalizeWriteStageCompleted(finalizeCheckpoint, stage.stage)) {
      await withSupabaseRetry({
        label: stage.label,
        run: stage.run,
      })
      finalizeCheckpoint.completed_write_stages.push(stage.stage)
      finalizeCheckpoint.completed_write_stages = Array.from(
        new Set(finalizeCheckpoint.completed_write_stages)
      )
      await emitFinalizeProgress(stage.stage)
    }
  }

  await emitFinalizeProgress('finalize_completed')

  return {
    finalize_checkpoint: cloneFinalizeCheckpoint(finalizeCheckpoint),
    row_counts: {
      sender_workspace_seed_headers: derivedRows.seedHeaders.length,
      sender_workspace_seed_rows: derivedRows.seedRows.length,
      sender_scope_rollups: rollups.length,
      cluster_summaries: derivedRows.clusterSummaries.length,
      mailbox_intelligence_snapshots: derivedRows.snapshotRows.length,
      mailbox_intelligence_buckets: derivedRows.bucketRows.length,
      preview_index_rows: derivedRows.previewRows.length,
    },
  }
}

export function restoreGmailArtifactCheckpoint(params: {
  value: string | null
  analysisScope: GmailArtifactAnalysisScope
}): GmailArtifactCheckpointPayload {
  return parseCheckpointPayload(params)
}

export function serializeGmailArtifactCheckpoint(value: GmailArtifactCheckpointPayload): string {
  return serializeCheckpointPayload(value)
}

export function restoreGmailArtifactFinalizeCheckpoint(
  value: string | null
): GmailArtifactFinalizeCheckpoint {
  return parseFinalizeCheckpoint(value)
}

export function serializeGmailArtifactFinalizeCheckpoint(
  value: GmailArtifactFinalizeCheckpoint
): string {
  return serializeFinalizeCheckpoint(value)
}

export function isGmailArtifactFinalizeCompleted(
  checkpoint: GmailArtifactFinalizeCheckpoint | null | undefined
): boolean {
  return checkpoint?.current_stage === 'finalize_completed'
}
