import type { SupabaseClient } from '@supabase/supabase-js'
import { GMAIL_MAILBOX_INDEX_MAX_MESSAGES } from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  buildPatternMixFromCounts,
  buildCanonicalSenderCategoryProfile,
  buildCanonicalSenderCategorySummary,
  canonicalCategoryMixFromDistribution,
  canonicalSenderProfileFromPersistedStats,
  classifySenderPatternFromSubjectText,
  GMAIL_PATTERN_LABEL_THIN_HISTORY,
  insufficientDataCanonicalSenderProfile,
  insufficientDataOperatorProfile,
  normalizePatternMix,
  operatorProfileFromPersistedStats,
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
import { buildPersistedSemanticRollupArtifactFields } from '@/lib/integrations/gmail/gmailSemanticRollupContract'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
  loadIndexedGmailMessagesForTenant,
  syncGmailMailboxIndexForTenant,
  type GmailMailboxIndexSyncResult,
  type GmailMailboxIndexRow,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import {
  loadPublishedGmailMailboxIntelligenceArtifact,
  type GmailArtifactPublicationRow,
  type GmailClusterSummaryArtifactRow,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import type {
  GmailAssignedCleanupGroupId,
  GmailCanonicalSenderCategoryLabel,
  GmailCategorySummarySource,
  GmailCleanupAssignmentReason,
  GmailCleanupExclusionReason,
  GmailCleanupGroupOperatorValueStatus,
  GmailCleanupGroupPromotionStatus,
  GmailCleanupGroupReviewUnit,
  GmailCleanupGroupReviewUnitBasis,
  GmailCleanupGroupSemanticAxis,
  GmailCleanupGroupSurfaceKind,
  GmailCleanupGroupSurfaceTier,
  GmailCleanupGroupSurfaceVisibility,
  GmailDominantCategoryConfidence,
  GmailMailboxIntelligenceData,
  GmailOperatorProfileFamily,
  GmailOperatorProfileMode,
  GmailOperatorProfileSource,
  GmailPressureTrendBucket,
  GmailPressureTrendData,
  GmailPressureTrendGrouping,
  GmailPressureTrendWindow,
  GmailResolvedSemanticFamily,
  GmailResolvedSemanticPattern,
  GmailSenderCategoryDistributionEntry,
  GmailSenderCategoryProfileMode,
  GmailSenderOperatorProfile,
  GmailSenderPatternMixEntry,
  GmailSharedGroupSemanticRollup,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_MESSAGE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_BATCH_MODIFY_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify'

const SAMPLE_MAX_RESULTS = 60
const SAMPLE_SUBJECT_LIMIT = 10
const TOP_SENDERS_LIMIT = 5
const QUERY_REVIEW_MAX_RESULTS = 120
const INDEX_QUERY_PAGE_SIZE = 1_000
const MAILBOX_PROFILE_DEFAULT_WINDOW_DAYS = 30
const MAILBOX_PROFILE_SENDER_ID_SCAN_LIMIT = 240
const MAILBOX_PROFILE_SENDER_METADATA_LIMIT = 120
const QUERY_CLUSTER_REVIEW_UNITS_MAX = 10
const QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES = 2_000
const QUERY_CLUSTER_FAST_PATH_FETCH_LIMIT = 5_000
const QUERY_CLUSTER_MATCH_CACHE_TTL_MS = 1000 * 60 * 5
const CLEANUP_GROUP_INTELLIGENCE_CACHE_TTL_MS = 1000 * 60 * 2
const DISCOVERY_INDEXED_ROWS_CACHE_TTL_MS = 1000 * 60 * 5
const DISCOVERY_INDEX_QUERY_PAGE_SIZE = 1_000
const GMAIL_BATCH_MODIFY_CHUNK_SIZE = 100
const GMAIL_BATCH_MODIFY_CONCURRENCY = 4
const GMAIL_VERIFY_DEFAULT_CONCURRENCY = 120
const GMAIL_VERIFY_MAX_CONCURRENCY = 200
const SENDER_OVERVIEW_DEFAULT_PAGE = 1
const SENDER_OVERVIEW_DEFAULT_PAGE_SIZE = 1_000

const INBOX_READ_SCOPE_SUFFIXES = new Set(['/gmail.readonly', '/gmail.metadata', '/gmail.modify'])
const INBOX_MODIFY_SCOPE_SUFFIXES = new Set(['/gmail.modify'])

type QueryReviewUnitDefinition = {
  unit: GmailQueryClusterReviewUnit
  rows: GmailMailboxIndexRow[]
}

type QueryClusterMatchCacheEntry = {
  expires_at_ms: number
  matched_rows: GmailMailboxIndexRow[]
  review_unit_definitions: QueryReviewUnitDefinition[]
  review_units: GmailQueryClusterReviewUnit[]
  cluster_total_matching_count: number
  fast_path_applied:
    | 'unread_clutter'
    | 'old_read_mail'
    | 'age_cluster'
    | 'sender_cluster'
    | 'newsletters'
    | 'noreply_automation'
    | 'shopping_updates'
    | 'social_notifications'
    | null
}

type CleanupGroupIntelligenceCacheEntry = {
  expires_at_ms: number
  data: GmailCleanupGroupIntelligenceData
}

type DiscoveryIndexedRowsCacheEntry = {
  signature: string
  cached_at_ms: number
  expires_at_ms: number
  rows: GmailMailboxIndexRow[]
}

const inboxAnalysisGlobal = globalThis as typeof globalThis & {
  __gmailQueryClusterMatchCache?: Map<string, QueryClusterMatchCacheEntry>
  __gmailQueryClusterInflight?: Map<string, Promise<QueryClusterMatchCacheEntry>>
  __gmailCleanupGroupIntelligenceCache?: Map<string, CleanupGroupIntelligenceCacheEntry>
  __gmailCleanupGroupIntelligenceInflight?: Map<string, Promise<GmailCleanupGroupIntelligenceResult>>
  __gmailDiscoveryIndexedRowsCache?: Map<string, DiscoveryIndexedRowsCacheEntry>
}

const queryClusterMatchCache =
  inboxAnalysisGlobal.__gmailQueryClusterMatchCache ||
  new Map<string, QueryClusterMatchCacheEntry>()
if (!inboxAnalysisGlobal.__gmailQueryClusterMatchCache) {
  inboxAnalysisGlobal.__gmailQueryClusterMatchCache = queryClusterMatchCache
}

const queryClusterMatchInflight =
  inboxAnalysisGlobal.__gmailQueryClusterInflight ||
  new Map<string, Promise<QueryClusterMatchCacheEntry>>()
if (!inboxAnalysisGlobal.__gmailQueryClusterInflight) {
  inboxAnalysisGlobal.__gmailQueryClusterInflight = queryClusterMatchInflight
}

const cleanupGroupIntelligenceCache =
  inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceCache ||
  new Map<string, CleanupGroupIntelligenceCacheEntry>()
if (!inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceCache) {
  inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceCache = cleanupGroupIntelligenceCache
}

const cleanupGroupIntelligenceInflight =
  inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceInflight ||
  new Map<string, Promise<GmailCleanupGroupIntelligenceResult>>()
if (!inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceInflight) {
  inboxAnalysisGlobal.__gmailCleanupGroupIntelligenceInflight = cleanupGroupIntelligenceInflight
}

const discoveryIndexedRowsCache =
  inboxAnalysisGlobal.__gmailDiscoveryIndexedRowsCache ||
  new Map<string, DiscoveryIndexedRowsCacheEntry>()
if (!inboxAnalysisGlobal.__gmailDiscoveryIndexedRowsCache) {
  inboxAnalysisGlobal.__gmailDiscoveryIndexedRowsCache = discoveryIndexedRowsCache
}

function buildDiscoveryIndexedRowsSignature(params: {
  tenantId: string
  limit: number
  currentIndexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  internalDateMsGte?: number | null
}): string {
  return [
    params.tenantId.trim(),
    String(params.limit),
    params.currentIndexState?.updated_at || 'no-updated-at',
    params.currentIndexState?.last_history_id || 'no-history-id',
    String(params.currentIndexState?.indexed_message_count ?? 0),
    String(params.coverage.indexed_total_rows),
    String(params.coverage.indexed_inbox_rows),
    params.coverage.indexed_date_span_start || 'no-date-span-start',
    params.coverage.indexed_date_span_end || 'no-date-span-end',
    String(params.internalDateMsGte ?? 'all-time'),
  ].join('|||')
}

async function loadScopedIndexedGmailMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  limit: number
  internalDateMsGte: number
}): Promise<GmailMailboxIndexRow[]> {
  const tenantId = params.tenantId.trim()
  const limit = Math.max(1, params.limit)
  const pageSize = Math.min(DISCOVERY_INDEX_QUERY_PAGE_SIZE, limit)
  const rows: GmailMailboxIndexRow[] = []

  for (let rangeStart = 0; rangeStart < limit; rangeStart += pageSize) {
    const rangeEnd = Math.min(rangeStart + pageSize - 1, limit - 1)
    const { data, error } = await params.supabase
      .from('gmail_messages')
      .select(
        'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
      )
      .eq('tenant_id', tenantId)
      .gte('internal_date_ms', params.internalDateMsGte)
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(rangeStart, rangeEnd)

    if (error) {
      console.warn(
        '[integrations/gmail/cleanup-discovery] scoped indexed row load failed:',
        error.message
      )
      break
    }

    const pageRows = Array.isArray(data) ? (data as GmailMailboxIndexRow[]) : []
    rows.push(...pageRows)
    if (pageRows.length < pageSize) break
  }

  return rows.slice(0, limit)
}

async function loadDiscoveryIndexedRowsWithManualReuse(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  currentIndexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  logPrefix: string
}): Promise<{
  rows: GmailMailboxIndexRow[]
  cacheHit: boolean
  cacheKeyChanged: boolean
  cacheEvicted: boolean
  cacheEntryAgeMs: number | null
  loadMs: number
}> {
  const tenantId = params.tenantId.trim()
  const limit = GMAIL_MAILBOX_INDEX_MAX_MESSAGES
  const nowMs = Date.now()
  const scopeBoundInternalDateMs =
    params.analysisScope === '7d' ? nowMs - 7 * 24 * 60 * 60 * 1000 : null
  const cacheKey =
    scopeBoundInternalDateMs != null ? `${tenantId}::${params.analysisScope}` : tenantId
  const signature = buildDiscoveryIndexedRowsSignature({
    tenantId,
    limit,
    currentIndexState: params.currentIndexState,
    coverage: params.coverage,
    internalDateMsGte: scopeBoundInternalDateMs,
  })
  const cached = discoveryIndexedRowsCache.get(cacheKey) || null
  let cacheHit = false
  let cacheKeyChanged = false
  let cacheEvicted = false
  let cacheEntryAgeMs: number | null = null

  if (cached) {
    cacheEntryAgeMs = Math.max(0, nowMs - cached.cached_at_ms)
    const signatureChanged = cached.signature !== signature
    const expired = cached.expires_at_ms <= nowMs
    cacheKeyChanged = signatureChanged
    if (signatureChanged || expired) {
      discoveryIndexedRowsCache.delete(cacheKey)
      cacheEvicted = true
    } else {
      cacheHit = true
      console.info(
        `${params.logPrefix}/indexed-rows-cache ${JSON.stringify({
          tenant_id: tenantId,
          selected_analysis_scope: params.analysisScope,
          cache_hit: true,
          cache_key_changed: false,
          cache_evicted: false,
          entry_age_ms: cacheEntryAgeMs,
          ttl_ms: DISCOVERY_INDEXED_ROWS_CACHE_TTL_MS,
          indexed_row_limit: limit,
          signature_changed_fields_present: false,
          indexed_rows_load_ms: 0,
        })}`
      )
      return {
        rows: cached.rows,
        cacheHit,
        cacheKeyChanged,
        cacheEvicted,
        cacheEntryAgeMs,
        loadMs: 0,
      }
    }
  }

  const loadStartedAt = Date.now()
  const rows =
    scopeBoundInternalDateMs != null
      ? await loadScopedIndexedGmailMessagesForTenant({
          supabase: params.supabase,
          tenantId,
          limit,
          internalDateMsGte: scopeBoundInternalDateMs,
        })
      : await loadIndexedGmailMessagesForTenant({
          supabase: params.supabase,
          tenantId,
          limit,
        })
  const loadMs = Math.max(0, Date.now() - loadStartedAt)
  discoveryIndexedRowsCache.set(cacheKey, {
    signature,
    cached_at_ms: Date.now(),
    expires_at_ms: Date.now() + DISCOVERY_INDEXED_ROWS_CACHE_TTL_MS,
    rows,
  })
  console.info(
    `${params.logPrefix}/indexed-rows-cache ${JSON.stringify({
      tenant_id: tenantId,
      selected_analysis_scope: params.analysisScope,
      cache_hit: false,
      cache_key_changed: cacheKeyChanged,
      cache_evicted: cacheEvicted,
      entry_age_ms: cacheEntryAgeMs,
      ttl_ms: DISCOVERY_INDEXED_ROWS_CACHE_TTL_MS,
      indexed_row_limit: limit,
      signature_changed_fields_present: cacheKeyChanged,
      indexed_rows_load_ms: loadMs,
    })}`
  )
  return {
    rows,
    cacheHit,
    cacheKeyChanged,
    cacheEvicted,
    cacheEntryAgeMs,
    loadMs,
  }
}

export const GMAIL_ANALYSIS_SCOPE_OPTIONS = [
  '7d',
  '30d',
  '60d',
  '90d',
  '180d',
  '365d',
  'all_indexed',
] as const

export type GmailAnalysisScope = (typeof GMAIL_ANALYSIS_SCOPE_OPTIONS)[number]

type GoogleRefreshTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

export type GmailTenantAccessContext = {
  accessToken: string
  refreshToken: string
}

type GmailMessagesListResponse = {
  resultSizeEstimate?: number
  messages?: Array<{ id?: string }>
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

type GmailBatchModifyResponse = {
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

type GmailMessageMetadataResponse = {
  internalDate?: string
  threadId?: string
  historyId?: string
  snippet?: string
  labelIds?: string[]
  payload?: {
    headers?: Array<{ name?: string; value?: string }>
  }
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

type GmailMessageBodyPart = {
  mimeType?: string
  filename?: string
  headers?: Array<{ name?: string; value?: string }>
  body?: {
    data?: string
    size?: number
  }
  parts?: GmailMessageBodyPart[]
}

type GmailMessageFullResponse = {
  internalDate?: string
  threadId?: string
  historyId?: string
  snippet?: string
  labelIds?: string[]
  payload?: GmailMessageBodyPart
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

type GmailSampleMessage = {
  from: string | null
  subject: string | null
  dateIso: string | null
}

type IntegrationConnectionRow = {
  access_token: unknown
  refresh_token: unknown
  expires_at: unknown
  scopes: unknown
}

export type GmailInboxAnalysisData = {
  total_messages_estimate: number
  sample_size: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  top_senders: Array<{ sender: string; count: number }>
  sample_subject_lines: string[]
}

export type GmailInboxAnalysisResult =
  | { ok: true; data: GmailInboxAnalysisData }
  | GmailReadFailure

export type GmailSenderClusterReviewData = {
  sender: string
  fetched_count: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  sample_subject_lines: string[]
  snippet_previews: string[]
  messages: Array<{
    message_id: string
    thread_id?: string
    history_id?: string
    internal_date_ms?: number
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
    label_ids?: string[]
    category_labels?: string[]
    is_in_inbox?: boolean
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
}

export type GmailSenderClusterReviewResult =
  | { ok: true; data: GmailSenderClusterReviewData }
  | GmailReadFailure

export type GmailQueryClusterReviewData = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  estimated_count: number | null
  fetched_count: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  sample_subject_lines: string[]
  snippet_previews: string[]
  reviewed_messages_preview: Array<{
    message_id: string
    thread_id?: string
    history_id?: string
    internal_date_ms?: number
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
    label_ids?: string[]
    category_labels?: string[]
    is_in_inbox?: boolean
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
  risk_note: string
  safety_note: string
}

export type GmailQueryClusterReviewResult =
  | { ok: true; data: GmailQueryClusterReviewData }
  | GmailReadFailure

export type GmailQueryClusterBrowserData = {
  cluster_id: string
  cluster_type: string
  title: string
  cluster_total_matching_count: number
  cache_hit: boolean
  fast_path_applied:
    | 'unread_clutter'
    | 'old_read_mail'
    | 'age_cluster'
    | 'sender_cluster'
    | 'newsletters'
    | 'noreply_automation'
    | 'shopping_updates'
    | 'social_notifications'
    | null
  analysis_scope: GmailAnalysisScope
  effective_discovery_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
  inbox_rows_considered: number
  discovery_rows_used: number
  rows_scanned: number
  review_units: GmailQueryClusterReviewUnit[]
  selected_review_unit_id: string
  selected_review_unit: GmailQueryClusterReviewUnit
  total_matching_count: number
  page: number
  page_size: number
  range_start: number
  range_end: number
  has_next_page: boolean
  has_previous_page: boolean
  sort: 'newest' | 'oldest'
  interaction_filter: 'all' | 'unread' | 'starred_or_important' | 'no_recent_interaction_90d'
  analytics_summary: {
    exactness: 'current_batch_exact'
    total_messages: number
    top_senders: Array<{ label: string; count: number }>
    pattern_distribution: Array<{ label: string; count: number }>
    recency_distribution: Array<{ label: string; count: number }>
    attention_distribution: Array<{
      label: string
      count: number
      exactness: 'actual' | 'inferred'
    }>
    sender_mix: Array<{
      label: string
      count: number
      exactness: 'actual' | 'inferred'
    }>
    protection_distribution: Array<{ label: string; count: number }>
  }
  sender_breakdown: Array<{
    sender: string
    sender_key: string
    batch_message_count: number
    cleanup_group_message_count: number
    batch_unread_count: number
    batch_starred_count: number
    batch_important_count: number
    batch_in_inbox_count: number
    batch_protected_count: number
    batch_first_seen: string | null
    batch_last_seen: string | null
    dominant_pattern: string
    pattern_summary: string
    preview_messages: GmailQueryClusterReviewData['reviewed_messages_preview']
  }>
  messages: GmailQueryClusterReviewData['reviewed_messages_preview']
}

export type GmailQueryClusterBrowserResult =
  | { ok: true; data: GmailQueryClusterBrowserData }
  | GmailReadFailure

export type GmailPressureTimelineComposition = {
  label: string
  count: number
  share_pct: number
}

export type GmailPressureTimelineEvidenceSignal = {
  label: string
  count: number
  share_pct: number
  exactness: 'actual' | 'inferred'
}

export type GmailActivityTimelineGranularity = 'day' | 'week' | 'month'

export type GmailCleanupGroupIntelligenceData = {
  analysis_scope: GmailAnalysisScope
  effective_discovery_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  cluster_count: number
  cleanup_group_total_messages: number
  cleanup_group_sender_count: number
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
  cleanup_date_span_start: string | null
  cleanup_date_span_end: string | null
  top_senders: Array<{
    sender: string
    sender_key: string
    message_count: number
    share_pct: number
  }>
  sender_volume_distribution: Array<{
    label: string
    sender_count: number
  }>
  activity_timeline: Array<{
    label: string
    count: number
    composition: GmailPressureTimelineComposition[]
    evidence_signals: GmailPressureTimelineEvidenceSignal[]
  }>
  activity_timeline_granularity: GmailActivityTimelineGranularity
  category_breakdown: Array<{
    label: string
    count: number
  }>
  human_vs_automation: Array<{
    label: string
    count: number
    exactness: 'inferred'
  }>
  sender_ranking: Array<{
    sender: string
    sender_key: string
    message_count: number
    share_pct: number
    unread_count: number
    important_count: number
    starred_count: number
    first_seen: string | null
    last_seen: string | null
    category_summary: string
    sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  }>
  source: 'gmail_index_cache'
}

export type GmailCleanupGroupIntelligenceResult =
  | { ok: true; data: GmailCleanupGroupIntelligenceData }
  | GmailReadFailure

export type GmailQueryClusterReviewUnit = {
  unit_id: string
  label: string
  grouping: 'sender' | 'domain' | 'pattern' | 'recency' | 'mixed'
  reason: string
  total_messages: number
  distinct_senders: number
  cluster_share_pct: number
  date_span_start: string | null
  date_span_end: string | null
  confidence: 'high' | 'moderate' | 'directional'
  risk: 'low' | 'medium' | 'high'
  protections_active: string[]
  likely_safe_action: string
}

export type GmailSenderIndexSignal = {
  sender: string
  message_count_indexed: number
  recent_count_30d: number
  recent_count_60d: number
  recent_count_90d: number
  recent_count_180d: number
  unread_count: number
  important_count: number
  starred_count: number
  in_inbox_count: number
  machine_probability: number | null
  human_probability: number | null
  first_seen: string | null
  last_seen: string | null
  category_distribution: GmailSenderCategoryDistributionEntry[]
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailCanonicalSenderCategoryLabel | null
  dominant_category_confidence: GmailDominantCategoryConfidence | null
  category_profile_mode: GmailSenderCategoryProfileMode
  category_summary: string
  category_summary_source: GmailCategorySummarySource
  category_mix: Array<{ category: string; count: number }>
  semantic_family: GmailResolvedSemanticFamily
  semantic_pattern: GmailResolvedSemanticPattern
  /** @deprecated Use `semantic_pattern.pattern_class` and decomposition metadata. */
  dominant_pattern: string
  pattern_mix: GmailSenderPatternMixEntry[]
  /** @deprecated Use `semantic_family.family`. */
  operator_profile_family: GmailOperatorProfileFamily
  /** @deprecated Use `semantic_family.resolution`. */
  operator_profile_mode: GmailOperatorProfileMode
  /** @deprecated Use `semantic_family.confidence`. */
  operator_profile_confidence: GmailDominantCategoryConfidence | null
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_summary: string
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_reasons: string[]
  /** @deprecated Use `semantic_family.provenance`. */
  operator_profile_source: GmailOperatorProfileSource
  exactness: 'indexed_exact'
}

export type GmailSenderIndexSignalsData = {
  senders: GmailSenderIndexSignal[]
  indexed_message_count: number
  mailbox_estimated_total: number | null
  index_completion_pct: number | null
  source: 'gmail_index_cache'
}

export type GmailSenderIndexSignalsResult =
  | { ok: true; data: GmailSenderIndexSignalsData }
  | GmailReadFailure

export type GmailMessageSnippetsData = {
  messages: Array<{
    message_id: string
    snippet: string | null
  }>
  source: 'gmail_metadata_live'
}

export type GmailMessageSnippetsResult =
  | { ok: true; data: GmailMessageSnippetsData }
  | GmailReadFailure

export type GmailMessagePreviewData = {
  message_id: string
  thread_id?: string
  history_id?: string
  internal_date_ms?: number
  subject: string | null
  from: string | null
  to: string | null
  date: string | null
  snippet: string | null
  label_ids?: string[]
  category_labels?: string[]
  is_in_inbox?: boolean
  is_unread?: boolean
  is_important?: boolean
  is_starred?: boolean
  body_text: string | null
  body_source: 'text_plain' | 'text_html_sanitized' | 'snippet_only'
  source: 'gmail_message_full_live'
}

export type GmailMessagePreviewResult =
  | { ok: true; data: GmailMessagePreviewData }
  | GmailReadFailure

export type GmailArchiveMessagesData = {
  sender: string | null
  batch_title: string | null
  requested_count: number
  archived_count: number
  message_ids: string[]
}

export type GmailArchiveMessagesResult =
  | { ok: true; data: GmailArchiveMessagesData }
  | GmailReadFailure

export type GmailInboxLabelMutationResult =
  | {
      ok: true
      data: {
        requested_count: number
        accepted_count: number
        accepted_message_ids: string[]
        failed_message_ids: string[]
        partial_failure: boolean
      }
    }
  | GmailReadFailure

export type GmailInboxStateVerificationResult =
  | {
      ok: true
      data: {
        expected_in_inbox: boolean
        verified_message_ids: string[]
        unresolved_message_ids: string[]
        warning: string | null
      }
    }
  | GmailReadFailure

export type GmailCleanupClusterType =
  | 'newsletters'
  | 'noreply_automation'
  | 'shopping_updates'
  | 'social_notifications'
  | 'protected_trusted'
  | 'historical_out_of_inbox'
  | 'needs_review'
  | 'old_read_mail'
  | 'unread_clutter'
  | 'sender_cluster'
  | 'age_cluster'

export type GmailCleanupClusterPreviewMessage = {
  message_id: string
  thread_id?: string
  history_id?: string
  internal_date_ms?: number
  subject: string | null
  from: string | null
  date: string | null
  snippet: string | null
  label_ids?: string[]
  category_labels?: string[]
  is_in_inbox?: boolean
  is_unread?: boolean
  is_important?: boolean
  is_starred?: boolean
}

export type GmailCleanupCluster = {
  cluster_id: string
  canonical_cluster_id?: string
  legacy_cluster_ids?: string[]
  source_cluster_ids?: string[]
  cluster_type: GmailCleanupClusterType
  title: string
  query: string
  why_selected: string
  sender_count?: number
  message_count?: number
  estimated_count: number
  sample_preview: GmailCleanupClusterPreviewMessage[]
  risk_note: string
  safety_note: string
  surface_tier?: GmailCleanupGroupSurfaceTier | null
  surface_kind?: GmailCleanupGroupSurfaceKind | null
  surface_visibility?: GmailCleanupGroupSurfaceVisibility | null
  top_level_rank?: number | null
  indexed_signal_window?: {
    count_last_30d: number
    count_last_90d: number
    count_last_180d: number
    count_total_indexed: number
    unread_count: number
    important_count: number
    starred_count: number
    in_inbox_count: number
    category_mix: Array<{ category: string; count: number }>
    first_seen_at: string | null
    last_seen_at: string | null
    exactness: 'indexed_exact'
  }
}

export type GmailCleanupDiscoveryData = {
  generated_at: string
  planning_mode: 'read_only'
  safety_defaults: string[]
  clusters: GmailCleanupCluster[]
  mailbox_profile?: GmailMailboxProfile
  mailbox_intelligence_snapshot?: GmailMailboxIntelligenceData | null
  sender_overview_snapshot?: Record<string, GmailSenderWorkspaceData> | null
}

export type GmailCleanupDiscoveryDiagnostics = {
  index_state_load_ms: number
  index_sync_ms: number
  indexed_rows_load_ms: number
  coverage_load_ms: number
  discovery_build_ms: number
  total_ms: number
  index_sync_disabled_by_request: boolean
  index_sync_skipped_recent: boolean
  index_sync_reused_existing_coverage: boolean
  index_sync_recent_activity_ms: number | null
  index_sync_result_ok: boolean | null
  index_sync_result_mode: 'full' | 'incremental' | null
  index_sync_used_fallback_full_scan: boolean | null
  indexed_rows_cache_hit: boolean
  indexed_rows_cache_key_changed: boolean
  indexed_rows_cache_evicted: boolean
  indexed_rows_cache_entry_age_ms: number | null
  indexed_row_count: number
}

export type GmailCleanupDiscoveryResult =
  | { ok: true; data: GmailCleanupDiscoveryData; diagnostics?: GmailCleanupDiscoveryDiagnostics }
  | GmailReadFailure

type IndexedCleanupDiscoveryBuild = {
  discovery: GmailCleanupDiscoveryData
  selectedClusterRowsByCluster: Map<string, GmailMailboxIndexRow[]>
}

export type GmailMailboxProfileNativeSignalCounts = {
  inbox_recent_estimate: number
  category_primary_estimate: number
  category_promotions_estimate: number
  category_social_estimate: number
  category_updates_estimate: number
  category_forums_estimate: number
  unread_recent_estimate: number
  important_recent_estimate: number
  starred_recent_estimate: number
  likely_machine_generated_recent_estimate: number
  likely_human_priority_recent_estimate: number
  stale_unread_30d_estimate: number
  stale_unread_60d_estimate: number
  stale_unread_90d_estimate: number
}

export type GmailMailboxProfileRecurringCategory = {
  category: 'primary' | 'promotions' | 'social' | 'updates' | 'forums'
  estimated_count: number
  source: 'gmail_native'
}

export type GmailMailboxProfileSenderFrequency = {
  sender: string
  count: number
  signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  source: 'computed_recent_window_sample'
}

export type GmailMailboxProfileSubjectPattern = {
  pattern: string
  count: number
  source: 'computed_recent_window_sample'
}

export type GmailMailboxProfileCandidateGroup = {
  title: string
  query: string
  estimated_count: number
  reason: string
  source: 'gmail_native' | 'gmail_native_plus_heuristic'
}

export type GmailMailboxProfile = {
  generated_at: string
  analysis_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  profile_model: 'gmail_native_signals_plus_bounded_sample.v1'
  metadata_scan_basis: {
    message_id_scan_count: number
    metadata_message_count: number
  }
  recommendation_confidence: 'preliminary' | 'moderate'
  freshness?: {
    status: 'fresh' | 'cached' | 'stale'
    last_generated_at: string
    expires_at: string | null
    cache_ttl_seconds: number
  }
  native_signal_counts: GmailMailboxProfileNativeSignalCounts
  recurring_categories: GmailMailboxProfileRecurringCategory[]
  sender_frequency: GmailMailboxProfileSenderFrequency[]
  subject_patterns: GmailMailboxProfileSubjectPattern[]
  protection_candidates: GmailMailboxProfileCandidateGroup[]
  cleanup_candidates: GmailMailboxProfileCandidateGroup[]
  rule_opportunities: GmailMailboxProfileCandidateGroup[]
  cluster_diagnostics?: {
    source_counts: {
      indexed_total_rows: number
      indexed_inbox_rows: number
      inbox_rows: number
      recent_window_rows: number
      safety_eligible_rows: number
      discovery_rows_used: number
      discovery_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
      effective_discovery_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
      indexed_date_span_start: string | null
      indexed_date_span_end: string | null
      indexed_oldest_message_at: string | null
      indexed_newest_message_at: string | null
    }
    rejection_buckets: {
      not_in_inbox: number
      starred_or_important: number
      category_primary: number
      younger_than_7d: number
      no_cluster_pattern_match: number
    }
    strict_cluster_match_counts: Array<{ cluster_id: string; count: number }>
    fallback_cluster_match_counts: Array<{ cluster_id: string; count: number }>
    used_exploratory_fallback: boolean
    final_cluster_count: number
  }
  notes: string[]
}

type GmailReadFailure = { ok: false; status: number; error: string }

function fail(status: number, error: string): GmailReadFailure {
  return { ok: false, status, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isExpiredTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false
  return parsed <= Date.now()
}

function scopeTokens(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/[\s,]+/)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value
      .filter((token): token is string => typeof token === 'string')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

function hasInboxReadScope(scopes: unknown): boolean {
  const tokens = scopeTokens(scopes)
  if (tokens.length === 0) return false

  return tokens.some((token) => {
    if (token === 'mail.google.com' || token === 'https://mail.google.com/') return true
    if (token === 'gmail.readonly' || token === 'gmail.metadata' || token === 'gmail.modify') {
      return true
    }

    for (const suffix of INBOX_READ_SCOPE_SUFFIXES) {
      if (token.endsWith(suffix)) return true
    }

    return false
  })
}

function hasInboxModifyScope(scopes: unknown): boolean {
  const tokens = scopeTokens(scopes)
  if (tokens.length === 0) return false

  return tokens.some((token) => {
    if (token === 'mail.google.com' || token === 'https://mail.google.com/') return true
    if (token === 'gmail.modify') return true

    for (const suffix of INBOX_MODIFY_SCOPE_SUFFIXES) {
      if (token.endsWith(suffix)) return true
    }

    return false
  })
}

function hasInsufficientScopeError(status: number, payload: unknown): boolean {
  if (status !== 403) return false
  if (!isRecord(payload)) return false

  const error = isRecord(payload.error) ? payload.error : null
  const topMessage = typeof error?.message === 'string' ? error.message.toLowerCase() : ''
  if (topMessage.includes('insufficient') && topMessage.includes('scope')) return true

  const nestedErrors = Array.isArray(error?.errors) ? error.errors : []
  for (const nested of nestedErrors) {
    if (!isRecord(nested)) continue
    const reason = typeof nested.reason === 'string' ? nested.reason.toLowerCase() : ''
    const message = typeof nested.message === 'string' ? nested.message.toLowerCase() : ''
    if (reason.includes('insufficient')) return true
    if (message.includes('insufficient') && message.includes('scope')) return true
  }

  return false
}

function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string | null {
  if (!Array.isArray(headers)) return null
  const match = headers.find((header) => {
    if (!isRecord(header)) return false
    return typeof header.name === 'string' && header.name.toLowerCase() === name.toLowerCase()
  })
  if (!isRecord(match)) return null
  const value = typeof match.value === 'string' ? match.value.trim() : ''
  return value || null
}

function dateIsoFromMessage(message: GmailMessageMetadataResponse): string | null {
  const internalDateValue = typeof message.internalDate === 'string' ? Number(message.internalDate) : NaN
  if (Number.isFinite(internalDateValue) && internalDateValue > 0) {
    return new Date(internalDateValue).toISOString()
  }

  const dateHeader = headerValue(message.payload?.headers, 'Date')
  if (!dateHeader) return null
  const parsed = Date.parse(dateHeader)
  if (!Number.isFinite(parsed)) return null
  return new Date(parsed).toISOString()
}

function normalizeLabelIds(labelIds: unknown): string[] {
  if (!Array.isArray(labelIds)) return []
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const value of labelIds) {
    if (typeof value !== 'string') continue
    const label = value.trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    normalized.push(label)
  }
  return normalized
}

function internalDateMsFromMessage(message: GmailMessageMetadataResponse): number | null {
  const internalDateValue = typeof message.internalDate === 'string' ? Number(message.internalDate) : NaN
  if (!Number.isFinite(internalDateValue) || internalDateValue <= 0) return null
  return Math.round(internalDateValue)
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function categoryLabelsFromLabelIds(labelIds: string[]): string[] {
  return labelIds.filter((label) => label.startsWith('CATEGORY_'))
}

export function normalizeSender(fromHeader: string): string {
  const trimmed = fromHeader.trim()
  const angleMatch = trimmed.match(/<([^>]+)>/)
  if (angleMatch && angleMatch[1]) return angleMatch[1].trim().toLowerCase()
  return trimmed.toLowerCase()
}

function compactSnippet(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function decodeBase64UrlUtf8(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return Buffer.from(padded, 'base64').toString('utf8')
  } catch {
    return null
  }
}

function stripHtmlToText(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|section|article|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function extractReadableBodyFromGmailPayload(
  payload: GmailMessageBodyPart | undefined
): { bodyText: string | null; bodySource: 'text_plain' | 'text_html_sanitized' | 'snippet_only' } {
  const plainBodies: string[] = []
  const htmlBodies: string[] = []

  const visit = (part: GmailMessageBodyPart | undefined) => {
    if (!part) return
    const mimeType = typeof part.mimeType === 'string' ? part.mimeType.toLowerCase() : ''
    const bodyData = typeof part.body?.data === 'string' ? decodeBase64UrlUtf8(part.body.data) : null
    if (bodyData && bodyData.trim()) {
      if (mimeType.startsWith('text/plain')) {
        plainBodies.push(bodyData.trim())
      } else if (mimeType.startsWith('text/html')) {
        const sanitized = stripHtmlToText(bodyData)
        if (sanitized) htmlBodies.push(sanitized)
      }
    }
    for (const child of part.parts || []) visit(child)
  }

  visit(payload)

  const plainText = plainBodies.join('\n\n').trim()
  if (plainText) {
    return {
      bodyText: plainText.replace(/\n{3,}/g, '\n\n').trim(),
      bodySource: 'text_plain',
    }
  }

  const htmlText = htmlBodies.join('\n\n').trim()
  if (htmlText) {
    return {
      bodyText: htmlText,
      bodySource: 'text_html_sanitized',
    }
  }

  return {
    bodyText: null,
    bodySource: 'snippet_only',
  }
}

export type GmailCleanupClusterSpec = {
  cluster_id: string
  cluster_type: GmailCleanupClusterType
  title: string
  query: string
  why_selected: string
  risk_note: string
}

const CLEANUP_SAMPLE_PREVIEW_LIMIT = 3
const CLEANUP_QUERY_MAX_RESULTS = 6

const CLEANUP_SAFETY_DEFAULTS = [
  'Exclude recent mail by default with age filters.',
  'Exclude starred and important mail.',
  'Prefer non-primary categories to reduce risk on human correspondence.',
  'Exclude messages sent by the mailbox owner where possible.',
  'Planning is read-only and requires explicit approval before any action.',
]

function senderTokenForQuery(sender: string): string | null {
  const trimmed = sender.trim()
  if (!trimmed) return null
  const simple = trimmed.replace(/[^a-zA-Z0-9@._+-]/g, '')
  return simple || null
}

function senderDomainFromSenderString(sender: string): string | null {
  const normalized = normalizeSender(sender)
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0 || atIndex >= normalized.length - 1) return null
  return normalized.slice(atIndex + 1)
}

function hasEstimateOverlapAmbiguity(values: number[]): boolean {
  const normalized = values.filter((value) => Number.isFinite(value) && value > 0)
  if (normalized.length < 3) return false

  const frequency = new Map<number, number>()
  for (const value of normalized) {
    frequency.set(value, (frequency.get(value) || 0) + 1)
  }

  let maxFrequency = 0
  for (const count of frequency.values()) {
    if (count > maxFrequency) maxFrequency = count
  }

  return maxFrequency >= 3
}

const BEHAVIORAL_CLEANUP_GROUP_SPECS: GmailCleanupClusterSpec[] = [
  {
    cluster_id: 'subscription-senders',
    cluster_type: 'newsletters',
    title: 'Subscription senders',
    query:
      'in:inbox -is:starred -is:important -category:primary -from:me (category:promotions OR subject:(newsletter OR digest OR roundup OR unsubscribe OR "manage preferences"))',
    why_selected: 'Groups recurring newsletter and subscription senders into one sender-first cleanup wave.',
    risk_note: 'Low to medium risk; keep valuable subscriptions before archive.',
  },
  {
    cluster_id: 'retail-commerce-senders',
    cluster_type: 'shopping_updates',
    title: 'Retail / commerce senders',
    query:
      'in:inbox -is:starred -is:important -category:primary -from:me (subject:(order OR shipped OR delivery OR tracking OR receipt OR invoice OR booking OR itinerary OR reservation) OR category:promotions)',
    why_selected: 'Collects commerce, retail, and travel-oriented senders with recurring inbox volume.',
    risk_note: 'Medium risk; preserve active order and travel threads before archive.',
  },
  {
    cluster_id: 'social-platform-senders',
    cluster_type: 'social_notifications',
    title: 'Social platform senders',
    query:
      'in:inbox -is:starred -is:important -category:primary -from:me (category:social OR subject:(mentioned OR follower OR comment OR liked OR reacted OR invite))',
    why_selected: 'Separates social-network and community-notification senders into a bounded sender review set.',
    risk_note: 'Low to medium risk; some communities may still matter.',
  },
  {
    cluster_id: 'system-notification-senders',
    cluster_type: 'noreply_automation',
    title: 'System notification senders',
    query:
      'in:inbox -is:starred -is:important -category:primary -from:me (from:noreply OR from:no-reply OR from:donotreply OR subject:(notification OR alert OR automated OR digest))',
    why_selected: 'Captures automation-heavy system senders that usually behave like repeat notification streams.',
    risk_note: 'Medium risk; security or account alerts still need review.',
  },
  {
    cluster_id: 'dormant-backlog-senders',
    cluster_type: 'unread_clutter',
    title: 'Dormant low-attention senders',
    query:
      'in:inbox -is:starred -is:important -category:primary -from:me (older_than:45d OR (is:unread older_than:21d))',
    why_selected: 'Flags stale sender relationships where low-attention backlog is accumulating.',
    risk_note: 'Medium risk; revisit senders with deferred intent before archive.',
  },
]

const STRUCTURAL_CLEANUP_GROUP_SPECS: GmailCleanupClusterSpec[] = [
  {
    cluster_id: 'protected-trusted-senders',
    cluster_type: 'protected_trusted',
    title: 'Protected / trusted senders',
    query: 'system:protected_trusted',
    why_selected:
      'Captures senders with explicit protected signals or strong human-priority evidence so they remain visible without falling out of cleanup grouping.',
    risk_note: 'High caution; these senders are protected first and should only be overridden deliberately.',
  },
  {
    cluster_id: 'historical-out-of-inbox-senders',
    cluster_type: 'historical_out_of_inbox',
    title: 'Historical / out-of-inbox senders',
    query: 'system:historical_out_of_inbox',
    why_selected:
      'Keeps senders with no current inbox rows inside the cleanup group model so full sender coverage remains exhaustive.',
    risk_note: 'Low immediate inbox risk; these senders are historical context rather than active inbox clutter.',
  },
  {
    cluster_id: 'needs-review-senders',
    cluster_type: 'needs_review',
    title: 'Needs review senders',
    query: 'system:needs_review',
    why_selected:
      'Holds senders that do not meet a strong protected or behavioral rule so they stay explicitly reviewable instead of disappearing.',
    risk_note: 'Medium to high review cost; signals are thin or mixed and should not be auto-forced into a behavioral lane.',
  },
]

const ALL_CLEANUP_GROUP_SPECS: GmailCleanupClusterSpec[] = [
  ...BEHAVIORAL_CLEANUP_GROUP_SPECS,
  ...STRUCTURAL_CLEANUP_GROUP_SPECS,
]

const CLEANUP_CANDIDATE_GROUP_IDS = new Set<GmailAssignedCleanupGroupId>([
  'subscription-senders',
  'retail-commerce-senders',
  'social-platform-senders',
  'system-notification-senders',
  'dormant-backlog-senders',
])

export type GmailCleanupGroupAssignmentDecision = {
  groupSpec: GmailCleanupClusterSpec
  assignmentReason: GmailCleanupAssignmentReason
  exclusionReason: GmailCleanupExclusionReason | null
  isCleanupCandidate: boolean
  evidenceSource: 'safe_rows' | 'broader_scoped_rows' | 'structural'
}

export function clusterSpecById(clusterId: string): GmailCleanupClusterSpec | null {
  return BEHAVIORAL_CLEANUP_GROUP_SPECS.find((spec) => spec.cluster_id === clusterId) || null
}

export function cleanupGroupSpecById(clusterId: string): GmailCleanupClusterSpec | null {
  return ALL_CLEANUP_GROUP_SPECS.find((spec) => spec.cluster_id === clusterId) || null
}

export function isCleanupCandidateGroupId(
  clusterId: string | null | undefined
): clusterId is GmailAssignedCleanupGroupId {
  return CLEANUP_CANDIDATE_GROUP_IDS.has(clusterId as GmailAssignedCleanupGroupId)
}

function domainMatchesAny(domain: string | null, patterns: RegExp[]): boolean {
  if (!domain) return false
  return patterns.some((pattern) => pattern.test(domain))
}

function textMatchesCount(text: string, patterns: RegExp[]): number {
  let count = 0
  for (const pattern of patterns) {
    if (pattern.test(text)) count += 1
  }
  return count
}

type GmailCleanupBehavioralScoreSummary = {
  scored: Array<[GmailAssignedCleanupGroupId, number]>
  clusterId: GmailAssignedCleanupGroupId | null
  score: number
  secondScore: number
  safeRatio: number
  safeRowCount: number
  protectedRatio: number
  protectedCount: number
  machineLikeCount: number
  humanLikeCount: number
  senderSignal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
}

function summarizeBehavioralCleanupScores(params: {
  sender: string
  rows: GmailMailboxIndexRow[]
  nowMs: number
  useRows?: GmailMailboxIndexRow[]
}): GmailCleanupBehavioralScoreSummary {
  const inboxRows = params.rows.filter((row) => row.is_in_inbox)
  const safeRows = inboxRows.filter(
    (row) =>
      !row.is_starred &&
      !row.is_important &&
      !rowCategoryHas(row, 'CATEGORY_PRIMARY')
  )
  const scoringRows = params.useRows ?? safeRows
  const senderLower = params.sender.trim().toLowerCase()
  const domain = senderDomainFromSenderString(params.sender)
  const sampleText = scoringRows
    .slice(0, 8)
    .map((row) => `${row.sender || ''} ${row.subject || ''}`.trim())
    .join(' ')
    .toLowerCase()
  const categoryCounts = {
    promotions: scoringRows.filter((row) => rowCategoryHas(row, 'CATEGORY_PROMOTIONS')).length,
    social: scoringRows.filter((row) => rowCategoryHas(row, 'CATEGORY_SOCIAL')).length,
    updates: scoringRows.filter((row) => rowCategoryHas(row, 'CATEGORY_UPDATES')).length,
  }
  const protectedCount = inboxRows.filter(
    (row) => row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
  ).length
  const machineLikeCount = inboxRows.filter(isLikelyMachineGeneratedRow).length
  const humanLikeCount = inboxRows.filter(isLikelyHumanPriorityRow).length
  const newestMessageMs = scoringRows.reduce<number | null>((latest, row) => {
    const value =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (value == null) return latest
    if (latest == null || value > latest) return value
    return latest
  }, null)
  const ageDays =
    newestMessageMs != null ? (params.nowMs - newestMessageMs) / (24 * 60 * 60 * 1000) : null
  const unreadCount = scoringRows.filter((row) => row.is_unread).length
  const senderSignal = senderSignalFromText({
    sender: params.sender,
    sampleText: sampleText || params.sender,
  })

  const subscriptionScore =
    categoryCounts.promotions +
    textMatchesCount(sampleText, [
      /\b(newsletter|digest|roundup|subscription|unsubscribe|substack|patreon|mailing list)\b/,
      /\b(manage preferences|weekly update|daily update|promo|offer|sale|coupon)\b/,
    ])
  const commerceScore =
    textMatchesCount(sampleText, [
      /\b(order|shipped|delivery|tracking|receipt|invoice|refund|return)\b/,
      /\b(booking|itinerary|reservation|flight|hotel|trip|travel)\b/,
    ]) +
    (domainMatchesAny(domain, [
      /amazon|walmart|target|shopify|etsy|sephora|booking|expedia|airbnb|delta|united|marriott|hilton/,
    ])
      ? 2
      : 0)
  const socialScore =
    categoryCounts.social +
    textMatchesCount(sampleText, [
      /\b(mentioned|follower|comment|liked|reacted|invite|connection request|new message)\b/,
    ]) +
    (domainMatchesAny(domain, [/linkedin|facebook|instagram|twitter|x\.com|reddit|discord|slack|tiktok/])
      ? 2
      : 0)
  const systemScore =
    textMatchesCount(sampleText, [
      /\b(notification|alert|automated|digest|security|verification|otp|code)\b/,
    ]) +
    (senderLooksMachineGenerated(senderLower) ? 2 : 0)
  const dormantScore =
    (ageDays != null && ageDays >= 45 ? 2 : 0) +
    (unreadCount >= Math.max(3, Math.round(scoringRows.length * 0.5)) ? 1 : 0)

  const scoredEntries = [
    ['social-platform-senders', socialScore] as const,
    ['system-notification-senders', systemScore] as const,
    ['retail-commerce-senders', commerceScore] as const,
    ['subscription-senders', subscriptionScore] as const,
    ['dormant-backlog-senders', dormantScore] as const,
  ]
  const scored: Array<[GmailAssignedCleanupGroupId, number]> = scoredEntries
    .map(
      ([clusterId, score]) => [clusterId, score] as [GmailAssignedCleanupGroupId, number]
    )
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))

  return {
    scored,
    clusterId: scored[0]?.[0] || null,
    score: scored[0]?.[1] || 0,
    secondScore: scored[1]?.[1] || 0,
    safeRatio: inboxRows.length > 0 ? safeRows.length / inboxRows.length : 0,
    safeRowCount: safeRows.length,
    protectedRatio: inboxRows.length > 0 ? protectedCount / inboxRows.length : 0,
    protectedCount,
    machineLikeCount,
    humanLikeCount,
    senderSignal,
  }
}

function legacyClassifySenderCleanupClusterDecision(params: {
  sender: string
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): {
  clusterSpec: GmailCleanupClusterSpec | null
  exclusionReason: GmailCleanupExclusionReason | null
} {
  const inboxRows = params.rows.filter((row) => row.is_in_inbox)
  if (inboxRows.length === 0) {
    return {
      clusterSpec: null,
      exclusionReason: 'no_inbox_rows',
    }
  }

  const safeRows = inboxRows.filter(
    (row) =>
      !row.is_starred &&
      !row.is_important &&
      !rowCategoryHas(row, 'CATEGORY_PRIMARY')
  )
  if (safeRows.length === 0) {
    return {
      clusterSpec: null,
      exclusionReason: 'no_safe_rows',
    }
  }

  const scoreSummary = summarizeBehavioralCleanupScores({
    sender: params.sender,
    rows: params.rows,
    nowMs: params.nowMs,
    useRows: safeRows,
  })

  if (scoreSummary.safeRowCount < 2) {
    return {
      clusterSpec: null,
      exclusionReason: 'too_few_safe_rows',
    }
  }
  if (scoreSummary.safeRatio < 0.4) {
    return {
      clusterSpec: null,
      exclusionReason: 'safe_ratio_too_low',
    }
  }
  if (scoreSummary.senderSignal === 'likely_human' && scoreSummary.protectedRatio >= 0.35) {
    return {
      clusterSpec: null,
      exclusionReason: 'protected_human_sender',
    }
  }
  if (
    scoreSummary.humanLikeCount > scoreSummary.machineLikeCount &&
    scoreSummary.protectedRatio >= 0.25
  ) {
    return {
      clusterSpec: null,
      exclusionReason: 'protected_human_dominant',
    }
  }

  if (typeof scoreSummary.clusterId !== 'string' || typeof scoreSummary.score !== 'number') {
    return {
      clusterSpec: null,
      exclusionReason: 'no_cluster_match',
    }
  }
  if (
    scoreSummary.score < 2 &&
    !(scoreSummary.clusterId === 'dormant-backlog-senders' && scoreSummary.safeRowCount >= 4)
  ) {
    return {
      clusterSpec: null,
      exclusionReason: 'score_below_threshold',
    }
  }

  return {
    clusterSpec: clusterSpecById(scoreSummary.clusterId),
    exclusionReason: clusterSpecById(scoreSummary.clusterId) ? null : 'no_cluster_match',
  }
}

function needsReviewAssignmentReason(
  exclusionReason: GmailCleanupExclusionReason | null
): GmailCleanupAssignmentReason {
  if (exclusionReason === 'no_safe_rows') return 'needs_review_no_safe_rows'
  if (exclusionReason === 'too_few_safe_rows') return 'needs_review_too_few_safe_rows'
  if (exclusionReason === 'safe_ratio_too_low') return 'needs_review_safe_ratio_too_low'
  if (exclusionReason === 'score_below_threshold') return 'needs_review_score_below_threshold'
  if (exclusionReason === 'no_cluster_match') return 'needs_review_no_cluster_match'
  return 'needs_review_unclassified'
}

export function assignSenderCleanupGroupDecision(params: {
  sender: string
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): GmailCleanupGroupAssignmentDecision {
  const scopedRows = params.rows.slice()
  const inboxRows = scopedRows.filter((row) => row.is_in_inbox)
  const safeRows = inboxRows.filter(
    (row) =>
      !row.is_starred &&
      !row.is_important &&
      !rowCategoryHas(row, 'CATEGORY_PRIMARY')
  )
  const legacyDecision = legacyClassifySenderCleanupClusterDecision(params)
  const legacyExclusionReason = legacyDecision.clusterSpec ? null : legacyDecision.exclusionReason
  const protectedSignalCount = scopedRows.filter(
    (row) => row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
  ).length
  const primaryCount = scopedRows.filter((row) => rowCategoryHas(row, 'CATEGORY_PRIMARY')).length
  const humanLikeCount = scopedRows.filter(isLikelyHumanPriorityRow).length
  const machineLikeCount = scopedRows.filter(isLikelyMachineGeneratedRow).length
  const protectedRatio = scopedRows.length > 0 ? protectedSignalCount / scopedRows.length : 0
  const senderSignal = senderSignalFromText({
    sender: params.sender,
    sampleText:
      scopedRows
        .slice(0, 8)
        .map((row) => `${row.sender || ''} ${row.subject || ''}`.trim())
        .join(' ')
        .toLowerCase() || params.sender,
  })
  const hasExplicitStarOrImportant = scopedRows.some((row) => row.is_starred || row.is_important)
  const primaryHumanDominant =
    primaryCount > 0 &&
    protectedRatio >= 0.5 &&
    (senderSignal === 'likely_human' || humanLikeCount >= machineLikeCount)

  if (
    hasExplicitStarOrImportant ||
    primaryHumanDominant ||
    legacyExclusionReason === 'protected_human_sender' ||
    legacyExclusionReason === 'protected_human_dominant'
  ) {
    return {
      groupSpec: cleanupGroupSpecById('protected-trusted-senders')!,
      assignmentReason:
        legacyExclusionReason === 'protected_human_sender'
          ? 'protected_legacy_protected_human_sender'
          : legacyExclusionReason === 'protected_human_dominant'
            ? 'protected_legacy_protected_human_dominant'
            : 'protected_signal_override',
      exclusionReason: legacyExclusionReason,
      isCleanupCandidate: false,
      evidenceSource: 'structural',
    }
  }

  if (inboxRows.length === 0) {
    return {
      groupSpec: cleanupGroupSpecById('historical-out-of-inbox-senders')!,
      assignmentReason: 'historical_no_inbox_rows',
      exclusionReason: legacyExclusionReason || 'no_inbox_rows',
      isCleanupCandidate: false,
      evidenceSource: 'structural',
    }
  }

  if (legacyDecision.clusterSpec && isCleanupCandidateGroupId(legacyDecision.clusterSpec.cluster_id)) {
    return {
      groupSpec: legacyDecision.clusterSpec,
      assignmentReason: 'behavioral_safe_rows',
      exclusionReason: null,
      isCleanupCandidate: true,
      evidenceSource: 'safe_rows',
    }
  }

  const safeEvidenceTooThin = safeRows.length < 2 || safeRows.length / inboxRows.length < 0.4
  if (safeEvidenceTooThin) {
    const broaderSummary = summarizeBehavioralCleanupScores({
      sender: params.sender,
      rows: scopedRows,
      nowMs: params.nowMs,
      useRows: inboxRows,
    })
    const broaderGroupId = broaderSummary.clusterId
    const broaderScore = broaderSummary.score
    const broaderMargin = broaderSummary.score - broaderSummary.secondScore
    if (
      broaderGroupId &&
      broaderScore >= 3 &&
      broaderMargin >= 2 &&
      isCleanupCandidateGroupId(broaderGroupId)
    ) {
      const broaderSpec = cleanupGroupSpecById(broaderGroupId)
      if (broaderSpec) {
        return {
          groupSpec: broaderSpec,
          assignmentReason: 'behavioral_broader_rows',
          exclusionReason: legacyExclusionReason,
          isCleanupCandidate: true,
          evidenceSource: 'broader_scoped_rows',
        }
      }
    }
  }

  return {
    groupSpec: cleanupGroupSpecById('needs-review-senders')!,
    assignmentReason: needsReviewAssignmentReason(legacyExclusionReason),
    exclusionReason: legacyExclusionReason,
    isCleanupCandidate: false,
    evidenceSource: 'structural',
  }
}

export function classifySenderCleanupCluster(params: {
  sender: string
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): GmailCleanupClusterSpec | null {
  return legacyClassifySenderCleanupClusterDecision(params).clusterSpec
}

export function classifySenderCleanupClusterDecision(params: {
  sender: string
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): {
  clusterSpec: GmailCleanupClusterSpec | null
  exclusionReason: GmailCleanupExclusionReason | null
} {
  return legacyClassifySenderCleanupClusterDecision(params)
}

function buildGmailCleanupClusterSpecs(params: {
  topSenders?: string[]
}): GmailCleanupClusterSpec[] {
  void params
  return [...BEHAVIORAL_CLEANUP_GROUP_SPECS]
}

export function cleanupGroupSpecs(): GmailCleanupClusterSpec[] {
  return [...ALL_CLEANUP_GROUP_SPECS]
}

export function behavioralCleanupGroupSpecs(): GmailCleanupClusterSpec[] {
  return [...BEHAVIORAL_CLEANUP_GROUP_SPECS]
}

export const SLICE2_MAX_SURFACED_SEMANTIC_PARENTS = 1 as const
const CLEANUP_GROUP_PROMOTION_MIN_SENDERS = 100
const CLEANUP_GROUP_PROMOTION_MIN_DOMINANT_SHARE_PCT = 80
const CLEANUP_GROUP_PROMOTION_MIN_CLEAR_SHARE_PCT = 60
const CLEANUP_GROUP_PROMOTION_MIN_ACTIONABLE_REVIEW_UNITS = 3
const CLEANUP_GROUP_PROMOTION_MIN_LARGEST_REVIEW_UNIT_SENDERS = 100
const CLEANUP_GROUP_REVIEW_UNIT_MIN_SENDERS = 25

type CleanupGroupArtifactSurfacePlan = Pick<
  GmailSharedGroupSemanticRollup,
  'surface' | 'promotion' | 'review_unit_plan'
>

export type CleanupGroupArtifactSurfaceCandidate = {
  clusterId: string
  clusterType: string
  title: string
  query: string
  whySelected: string | null
  riskNote: string | null
  safetyNote: string | null
  senderCount: number
  messageCount: number
  semanticRollup: GmailSharedGroupSemanticRollup
}

export type CleanupGroupArtifactSurfaceDecision = CleanupGroupArtifactSurfacePlan & {
  projectedClusterId: string
  projectedClusterType: string
  projectedTitle: string
  projectedQuery: string
  projectedWhySelected: string
  projectedRiskNote: string
  projectedSafetyNote: string
}

type CleanupGroupAxisReviewPlan = {
  axis: GmailCleanupGroupSemanticAxis
  dominantKey: string | null
  dominantLabel: string | null
  dominantSharePct: number
  clearSharePct: number
  reviewUnitPlan: GmailSharedGroupSemanticRollup['review_unit_plan']
  actionableReviewUnitCount: number
  largestReviewUnitSenderCount: number
}

const CLEANUP_GROUP_STRUCTURAL_IDS = new Set([
  'protected-trusted-senders',
  'needs-review-senders',
  'dormant-backlog-senders',
  'historical-out-of-inbox-senders',
])

const CLEANUP_GROUP_STRUCTURAL_SURFACE_META: Record<
  string,
  {
    tier: GmailCleanupGroupSurfaceTier
    kind: GmailCleanupGroupSurfaceKind
    topLevelRank: number | null
  }
> = {
  'dormant-backlog-senders': {
    tier: 'featured_parent',
    kind: 'backlog_parent',
    topLevelRank: 1,
  },
  'protected-trusted-senders': {
    tier: 'featured_parent',
    kind: 'structural_parent',
    topLevelRank: 2,
  },
  'needs-review-senders': {
    tier: 'featured_parent',
    kind: 'structural_parent',
    topLevelRank: 3,
  },
  'historical-out-of-inbox-senders': {
    tier: 'collapsed_parent',
    kind: 'historical_parent',
    topLevelRank: 4,
  },
}

const CLEANUP_GROUP_SEMANTIC_FAMILY_TITLE_BY_KEY: Record<string, string> = {
  marketing_promotional: 'Marketing / promotional',
  commerce_transactional: 'Commerce / transactional',
  account_notification: 'Account notifications',
  security_alert: 'Security alerts',
  social_community: 'Social / community',
  human_personal: 'Human / personal',
}

function cleanupGroupSemanticFamilyLabel(family: string | null): string {
  if (!family) return 'Semantic'
  return CLEANUP_GROUP_SEMANTIC_FAMILY_TITLE_BY_KEY[family] || family.replace(/_/g, ' ')
}

function cleanupGroupDefaultSurface(clusterId: string): CleanupGroupArtifactSurfacePlan['surface'] {
  const structural = CLEANUP_GROUP_STRUCTURAL_SURFACE_META[clusterId]
  if (structural) {
    return {
      tier: structural.tier,
      kind: structural.kind,
      visibility: 'visible',
      top_level_rank: structural.topLevelRank,
      canonical_cluster_id: clusterId,
      legacy_cluster_ids: [],
      source_cluster_ids: [clusterId],
    }
  }

  return {
    tier: 'secondary',
    kind: 'secondary_candidate',
    visibility: 'visible',
    top_level_rank: null,
    canonical_cluster_id: clusterId,
    legacy_cluster_ids: [],
    source_cluster_ids: [clusterId],
  }
}

function buildNonPromotedReviewUnitPlan(
  basis: GmailCleanupGroupReviewUnitBasis
): GmailSharedGroupSemanticRollup['review_unit_plan'] {
  return {
    required: false,
    basis,
    trigger_reason: null,
    units: [],
  }
}

function buildCleanupGroupReviewUnitsForAxis(params: {
  axis: GmailCleanupGroupSemanticAxis
  rollup: GmailSharedGroupSemanticRollup
}): CleanupGroupAxisReviewPlan {
  if (params.axis === 'pattern') {
    const dominantLane = params.rollup.pattern_distribution[0] || null
    const visibleSubtypeUnits: GmailCleanupGroupReviewUnit[] = dominantLane
      ? dominantLane.top_subtypes
          .filter((entry) => entry.sender_count >= CLEANUP_GROUP_REVIEW_UNIT_MIN_SENDERS)
          .slice(0, 3)
          .map((entry) => ({
            unit_id: `${params.axis}:${entry.key}`,
            label: entry.label,
            source_kind: 'pattern_subtype',
            source_key: entry.key,
            sender_count: entry.sender_count,
            share_pct: entry.share_pct,
            unit_role: 'subtype',
          }))
      : []
    const dominantSubtypeSenders = visibleSubtypeUnits.reduce(
      (sum, unit) => sum + unit.sender_count,
      0
    )
    const dominantRemainderCount = Math.max(
      0,
      (dominantLane?.sender_count || 0) - dominantSubtypeSenders
    )
    const spilloverCount = Math.max(
      0,
      params.rollup.sender_basis.sender_count - (dominantLane?.sender_count || 0)
    )
    const dominantLabel = dominantLane?.pattern_class.replace(/_/g, ' ') || null
    const units = [
      ...visibleSubtypeUnits,
      ...(dominantRemainderCount > 0 && dominantLane
        ? [
            {
              unit_id: `${params.axis}:${dominantLane.pattern_class}:remainder`,
              label: `${dominantLabel} remainder`,
              source_kind: 'pattern_remainder' as const,
              source_key: dominantLane.pattern_class,
              sender_count: dominantRemainderCount,
              share_pct: Math.round(
                (dominantRemainderCount / Math.max(params.rollup.sender_basis.sender_count, 1)) * 100
              ),
              unit_role: 'dominant_remainder' as const,
            },
          ]
        : []),
      ...(spilloverCount > 0
        ? [
            {
              unit_id: `${params.axis}:spillover`,
              label: 'Non-dominant spillover / exceptions',
              source_kind: 'spillover' as const,
              source_key: 'spillover',
              sender_count: spilloverCount,
              share_pct: Math.round(
                (spilloverCount / Math.max(params.rollup.sender_basis.sender_count, 1)) * 100
              ),
              unit_role: 'spillover' as const,
            },
          ]
        : []),
    ].slice(0, 5)

    return {
      axis: 'pattern',
      dominantKey: dominantLane?.pattern_class || null,
      dominantLabel,
      dominantSharePct: dominantLane?.share_pct || 0,
      clearSharePct: params.rollup.trust.summary.pattern_clear_share_pct,
      reviewUnitPlan: {
        required: units.length > 0,
        basis: units.length > 0 ? 'selected_axis_dominant_lane' : 'not_promoted',
        trigger_reason: units.length > 0 ? 'dominant_pattern_requires_decomposition' : null,
        units,
      },
      actionableReviewUnitCount: units.filter(
        (unit) => unit.sender_count >= CLEANUP_GROUP_REVIEW_UNIT_MIN_SENDERS
      ).length,
      largestReviewUnitSenderCount: units.reduce(
        (max, unit) => Math.max(max, unit.sender_count),
        0
      ),
    }
  }

  const dominantLane = params.rollup.family_distribution[0] || null
  const familyLabel = cleanupGroupSemanticFamilyLabel(dominantLane?.family || null)
  const visibleSubtypeUnits: GmailCleanupGroupReviewUnit[] = dominantLane
    ? dominantLane.top_subtypes
        .filter((entry) => entry.sender_count >= CLEANUP_GROUP_REVIEW_UNIT_MIN_SENDERS)
        .slice(0, 3)
        .map((entry) => ({
          unit_id: `${params.axis}:${entry.key}`,
          label: entry.label,
          source_kind: 'family_subtype',
          source_key: entry.key,
          sender_count: entry.sender_count,
          share_pct: entry.share_pct,
          unit_role: 'subtype',
        }))
    : []
  const dominantSubtypeSenders = visibleSubtypeUnits.reduce((sum, unit) => sum + unit.sender_count, 0)
  const dominantRemainderCount = Math.max(
    0,
    (dominantLane?.sender_count || 0) - dominantSubtypeSenders
  )
  const spilloverCount = Math.max(
    0,
    params.rollup.sender_basis.sender_count - (dominantLane?.sender_count || 0)
  )
  const units = [
    ...visibleSubtypeUnits,
    ...(dominantRemainderCount > 0 && dominantLane
      ? [
          {
            unit_id: `${params.axis}:${dominantLane.family}:remainder`,
            label: `Broad ${familyLabel.toLowerCase()} remainder`,
            source_kind: 'family_remainder' as const,
            source_key: dominantLane.family,
            sender_count: dominantRemainderCount,
            share_pct: Math.round(
              (dominantRemainderCount / Math.max(params.rollup.sender_basis.sender_count, 1)) * 100
            ),
            unit_role: 'dominant_remainder' as const,
          },
        ]
      : []),
    ...(spilloverCount > 0
      ? [
          {
            unit_id: `${params.axis}:spillover`,
            label: 'Non-promotional spillover / exceptions',
            source_kind: 'spillover' as const,
            source_key: 'spillover',
            sender_count: spilloverCount,
            share_pct: Math.round(
              (spilloverCount / Math.max(params.rollup.sender_basis.sender_count, 1)) * 100
            ),
            unit_role: 'spillover' as const,
          },
        ]
      : []),
  ].slice(0, 5)

  return {
    axis: 'family',
    dominantKey: dominantLane?.family || null,
    dominantLabel: familyLabel,
    dominantSharePct: dominantLane?.share_pct || 0,
    clearSharePct: params.rollup.trust.summary.family_clear_share_pct,
    reviewUnitPlan: {
      required: units.length > 0,
      basis: units.length > 0 ? 'selected_axis_dominant_lane' : 'not_promoted',
      trigger_reason: units.length > 0 ? 'dominant_family_requires_decomposition' : null,
      units,
    },
    actionableReviewUnitCount: units.filter(
      (unit) => unit.sender_count >= CLEANUP_GROUP_REVIEW_UNIT_MIN_SENDERS
    ).length,
    largestReviewUnitSenderCount: units.reduce(
      (max, unit) => Math.max(max, unit.sender_count),
      0
    ),
  }
}

function chooseCleanupGroupSemanticAxis(
  rollup: GmailSharedGroupSemanticRollup
): CleanupGroupAxisReviewPlan {
  const familyPlan = buildCleanupGroupReviewUnitsForAxis({
    axis: 'family',
    rollup,
  })
  const patternPlan = buildCleanupGroupReviewUnitsForAxis({
    axis: 'pattern',
    rollup,
  })
  if (
    patternPlan.dominantSharePct >= familyPlan.dominantSharePct + 10 &&
    patternPlan.actionableReviewUnitCount > familyPlan.actionableReviewUnitCount
  ) {
    return patternPlan
  }
  return familyPlan
}

function cleanupGroupPromotionStatus(params: {
  clusterId: string
  senderCount: number
  axisPlan: CleanupGroupAxisReviewPlan
  selected: boolean
  promotable: boolean
}): GmailCleanupGroupPromotionStatus {
  if (CLEANUP_GROUP_STRUCTURAL_IDS.has(params.clusterId)) return 'structural_lane'
  if (!params.promotable && params.senderCount < CLEANUP_GROUP_PROMOTION_MIN_SENDERS) {
    return 'demoted_small'
  }
  if (
    !params.promotable &&
    (params.axisPlan.dominantSharePct < CLEANUP_GROUP_PROMOTION_MIN_DOMINANT_SHARE_PCT ||
      params.axisPlan.clearSharePct < CLEANUP_GROUP_PROMOTION_MIN_CLEAR_SHARE_PCT)
  ) {
    return 'demoted_mixed'
  }
  if (!params.promotable) return 'demoted_low_operator_value'
  if (!params.selected) return 'demoted_cap_exceeded'
  return 'promoted'
}

function cleanupGroupOperatorValueStatus(params: {
  clusterId: string
  promotable: boolean
}): GmailCleanupGroupOperatorValueStatus {
  if (CLEANUP_GROUP_STRUCTURAL_IDS.has(params.clusterId)) return 'not_applicable'
  return params.promotable ? 'strong' : 'low'
}

function buildPromotedCleanupGroupId(params: {
  clusterId: string
  axis: GmailCleanupGroupSemanticAxis
  dominantKey: string | null
}): string {
  const dominantKey = (params.dominantKey || 'mixed').trim() || 'mixed'
  return `semantic-parent:${params.clusterId}:${params.axis}:${dominantKey}`
}

function buildPromotedCleanupGroupTitle(params: {
  clusterId: string
  dominantLabel: string | null
}): string {
  if (params.clusterId === 'subscription-senders' && params.dominantLabel) {
    return `${params.dominantLabel} subscriptions`
  }
  if (!params.dominantLabel) return 'Semantic parent'
  return `${params.dominantLabel} senders`
}

function buildPromotionReasonCodes(params: {
  status: GmailCleanupGroupPromotionStatus
  promotable: boolean
  selected: boolean
  axisPlan: CleanupGroupAxisReviewPlan
}): string[] {
  const reasonCodes: string[] = []
  if (params.promotable) {
    reasonCodes.push('promotion_gates_passed')
  } else {
    if (params.axisPlan.dominantSharePct < CLEANUP_GROUP_PROMOTION_MIN_DOMINANT_SHARE_PCT) {
      reasonCodes.push('dominant_share_below_threshold')
    }
    if (params.axisPlan.clearSharePct < CLEANUP_GROUP_PROMOTION_MIN_CLEAR_SHARE_PCT) {
      reasonCodes.push('clear_share_below_threshold')
    }
    if (
      params.axisPlan.actionableReviewUnitCount < CLEANUP_GROUP_PROMOTION_MIN_ACTIONABLE_REVIEW_UNITS
    ) {
      reasonCodes.push('insufficient_actionable_review_units')
    }
    if (
      params.axisPlan.largestReviewUnitSenderCount <
      CLEANUP_GROUP_PROMOTION_MIN_LARGEST_REVIEW_UNIT_SENDERS
    ) {
      reasonCodes.push('largest_review_unit_below_threshold')
    }
  }
  if (params.status === 'demoted_cap_exceeded' && !params.selected) {
    reasonCodes.push('rollout_guard_semantic_parent_cap')
  }
  if (params.status === 'structural_lane') {
    reasonCodes.push('structural_lane_hard_block')
  }
  return reasonCodes
}

function cleanupGroupPromotable(params: {
  clusterId: string
  senderCount: number
  axisPlan: CleanupGroupAxisReviewPlan
  rollup: GmailSharedGroupSemanticRollup
}): boolean {
  if (CLEANUP_GROUP_STRUCTURAL_IDS.has(params.clusterId)) return false
  if (params.rollup.group_policy_mode !== 'semantic_first') return false
  return (
    params.senderCount >= CLEANUP_GROUP_PROMOTION_MIN_SENDERS &&
    params.axisPlan.dominantSharePct >= CLEANUP_GROUP_PROMOTION_MIN_DOMINANT_SHARE_PCT &&
    params.axisPlan.clearSharePct >= CLEANUP_GROUP_PROMOTION_MIN_CLEAR_SHARE_PCT &&
    params.axisPlan.actionableReviewUnitCount >= CLEANUP_GROUP_PROMOTION_MIN_ACTIONABLE_REVIEW_UNITS &&
    params.axisPlan.largestReviewUnitSenderCount >=
      CLEANUP_GROUP_PROMOTION_MIN_LARGEST_REVIEW_UNIT_SENDERS
  )
}

function cleanupGroupPromotionScore(params: {
  senderCount: number
  axisPlan: CleanupGroupAxisReviewPlan
}): number {
  return (
    params.axisPlan.dominantSharePct * 10_000 +
    params.axisPlan.actionableReviewUnitCount * 1_000 +
    params.axisPlan.largestReviewUnitSenderCount * 10 +
    params.senderCount
  )
}

export function planCleanupGroupArtifactSurfaces(
  candidates: CleanupGroupArtifactSurfaceCandidate[]
): Map<string, CleanupGroupArtifactSurfaceDecision> {
  const plans = new Map<
    string,
    {
      candidate: CleanupGroupArtifactSurfaceCandidate
      axisPlan: CleanupGroupAxisReviewPlan
      promotable: boolean
      promotionScore: number
    }
  >()

  for (const candidate of candidates) {
    const axisPlan = chooseCleanupGroupSemanticAxis(candidate.semanticRollup)
    const promotable = cleanupGroupPromotable({
      clusterId: candidate.clusterId,
      senderCount: candidate.senderCount,
      axisPlan,
      rollup: candidate.semanticRollup,
    })
    plans.set(candidate.clusterId, {
      candidate,
      axisPlan,
      promotable,
      promotionScore: promotable
        ? cleanupGroupPromotionScore({
            senderCount: candidate.senderCount,
            axisPlan,
          })
        : 0,
    })
  }

  const promotedClusterIdSet = new Set(
    Array.from(plans.values())
      .filter((entry) => entry.promotable)
      .sort((left, right) => right.promotionScore - left.promotionScore)
      .slice(0, SLICE2_MAX_SURFACED_SEMANTIC_PARENTS)
      .map((entry) => entry.candidate.clusterId)
  )

  return new Map(
    Array.from(plans.values()).map((entry) => {
      const selected = promotedClusterIdSet.has(entry.candidate.clusterId)
      const status = cleanupGroupPromotionStatus({
        clusterId: entry.candidate.clusterId,
        senderCount: entry.candidate.senderCount,
        axisPlan: entry.axisPlan,
        promotable: entry.promotable,
        selected,
      })
      const promoted = status === 'promoted'
      const projectedClusterId = promoted
        ? buildPromotedCleanupGroupId({
            clusterId: entry.candidate.clusterId,
            axis: entry.axisPlan.axis,
            dominantKey: entry.axisPlan.dominantKey,
          })
        : entry.candidate.clusterId
      const projectedTitle = promoted
        ? buildPromotedCleanupGroupTitle({
            clusterId: entry.candidate.clusterId,
            dominantLabel: entry.axisPlan.dominantLabel,
          })
        : entry.candidate.title
      const defaultSurface = cleanupGroupDefaultSurface(entry.candidate.clusterId)
      const surface: GmailSharedGroupSemanticRollup['surface'] = promoted
        ? {
            tier: 'featured_parent',
            kind: 'semantic_parent',
            visibility: 'visible',
            top_level_rank: 0,
            canonical_cluster_id: projectedClusterId,
            legacy_cluster_ids: [entry.candidate.clusterId],
            source_cluster_ids: [entry.candidate.clusterId],
          }
        : defaultSurface
      const reviewUnitPlan = promoted
        ? entry.axisPlan.reviewUnitPlan
        : buildNonPromotedReviewUnitPlan(
            CLEANUP_GROUP_STRUCTURAL_IDS.has(entry.candidate.clusterId)
              ? 'structural_lane'
              : entry.candidate.semanticRollup.group_policy_mode === 'semantic_first'
                ? 'secondary_group'
                : 'not_promoted'
          )
      const promotion: GmailSharedGroupSemanticRollup['promotion'] = {
        status,
        selected_axis: promoted ? entry.axisPlan.axis : null,
        reason_codes: buildPromotionReasonCodes({
          status,
          promotable: entry.promotable,
          selected,
          axisPlan: entry.axisPlan,
        }),
        operator_value_status: cleanupGroupOperatorValueStatus({
          clusterId: entry.candidate.clusterId,
          promotable: entry.promotable,
        }),
        metrics: {
          sender_count: entry.candidate.senderCount,
          dominant_share_pct: entry.axisPlan.dominantSharePct,
          clear_share_pct: entry.axisPlan.clearSharePct,
          actionable_review_unit_count: promoted ? entry.axisPlan.actionableReviewUnitCount : 0,
          largest_review_unit_sender_count: promoted
            ? entry.axisPlan.largestReviewUnitSenderCount
            : 0,
        },
      }

      const projectedWhySelected = promoted
        ? `Promoted from ${entry.candidate.title} because ${entry.axisPlan.dominantLabel || 'one semantic lane'} dominates ${entry.axisPlan.dominantSharePct}% of senders and decomposes into ${entry.axisPlan.actionableReviewUnitCount} actionable review units.`
        : entry.candidate.whySelected ||
          'Grouped by shared sender behavior.'

      return [
        entry.candidate.clusterId,
        {
          projectedClusterId,
          projectedClusterType: entry.candidate.clusterType,
          projectedTitle,
          projectedQuery: entry.candidate.query,
          projectedWhySelected,
          projectedRiskNote:
            entry.candidate.riskNote || 'Review mixed senders carefully before approving bulk archive.',
          projectedSafetyNote:
            entry.candidate.safetyNote ||
            'Sender-first review protects safe traffic while you inspect this group.',
          surface,
          promotion,
          review_unit_plan: reviewUnitPlan,
        } satisfies CleanupGroupArtifactSurfaceDecision,
      ] as const
    })
  )
}

export function normalizeMailboxProfileScope(value: unknown): GmailAnalysisScope {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (
      normalized === '7d' ||
      normalized === '30d' ||
      normalized === '60d' ||
      normalized === '90d' ||
      normalized === '180d' ||
      normalized === '365d' ||
      normalized === 'all_indexed'
    ) {
      return normalized
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value)
    if (rounded <= 7) return '7d'
    if (rounded <= 30) return '30d'
    if (rounded <= 60) return '60d'
    if (rounded <= 90) return '90d'
    if (rounded <= 180) return '180d'
    return '365d'
  }

  return `${MAILBOX_PROFILE_DEFAULT_WINDOW_DAYS}d` as GmailAnalysisScope
}

export function scopeDays(scope: GmailAnalysisScope): number | null {
  if (scope === 'all_indexed') return null
  const parsed = Number.parseInt(scope.replace('d', ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function activityTimelineGranularityForScope(
  scope: GmailAnalysisScope
): GmailActivityTimelineGranularity {
  const days = scopeDays(scope)
  if (days != null && days <= 7) return 'day'
  if (days != null && days <= 90) return 'week'
  return 'month'
}

function utcDayBucketKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`
}

function utcWeekBucketKey(date: Date): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  start.setUTCDate(start.getUTCDate() - diff)
  return utcDayBucketKey(start)
}

export function activityTimelineBucketKeyForTimestamp(
  timestampMs: number,
  granularity: GmailActivityTimelineGranularity
): string {
  const date = new Date(timestampMs)
  if (granularity === 'day') return utcDayBucketKey(date)
  if (granularity === 'week') return utcWeekBucketKey(date)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function latestIndexActivityMs(value: {
  last_full_scan_at: string | null
  last_incremental_sync_at: string | null
  updated_at: string
} | null): number | null {
  if (!value) return null
  const candidates = [
    value.last_full_scan_at,
    value.last_incremental_sync_at,
    value.updated_at,
  ]
    .map((entry) => (typeof entry === 'string' && entry.trim() ? Date.parse(entry) : Number.NaN))
    .filter((entry) => Number.isFinite(entry))

  return candidates.length > 0 ? Math.max(...candidates) : null
}

function indexedCoverageSatisfiesScope(params: {
  coverage: {
    indexed_total_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  } | null
  analysisScope: GmailAnalysisScope
  nowMs: number
}): boolean {
  const scopeWindowDays = scopeDays(params.analysisScope)
  if (!params.coverage || params.coverage.indexed_total_rows <= 0) return false
  if (scopeWindowDays == null) return false

  const startMs =
    typeof params.coverage.indexed_date_span_start === 'string' &&
    params.coverage.indexed_date_span_start.trim()
      ? Date.parse(params.coverage.indexed_date_span_start)
      : Number.NaN
  const endMs =
    typeof params.coverage.indexed_date_span_end === 'string' &&
    params.coverage.indexed_date_span_end.trim()
      ? Date.parse(params.coverage.indexed_date_span_end)
      : Number.NaN

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false

  const requiredStartMs = params.nowMs - scopeWindowDays * 24 * 60 * 60 * 1000
  const freshnessSlackMs = 3 * 24 * 60 * 60 * 1000
  return startMs <= requiredStartMs && endMs >= params.nowMs - freshnessSlackMs
}

function resolveAnalysisWindowDays(
  scope: GmailAnalysisScope
): GmailMailboxProfile['analysis_window_days'] {
  if (scope === 'all_indexed') return 'all_indexed'
  const days = scopeDays(scope)
  if (
    days === 7 ||
    days === 30 ||
    days === 60 ||
    days === 90 ||
    days === 180 ||
    days === 365
  ) {
    return days
  }
  return MAILBOX_PROFILE_DEFAULT_WINDOW_DAYS
}

function normalizeSubjectPattern(value: string | null): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/^\s*(re|fw|fwd)\s*:\s*/g, '')
    .replace(/\b[0-9]{2,}\b/g, '#')
    .replace(/\b[a-f0-9]{8,}\b/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

export function classifySenderPatternFromSubject(subject: string | null): string {
  return classifySenderPatternFromSubjectText(subject)
}

export function senderSignalFromText(params: {
  sender: string
  sampleText: string
}): 'likely_machine_generated' | 'likely_human' | 'uncertain' {
  const sender = params.sender.toLowerCase()
  const text = params.sampleText.toLowerCase()
  if (
    /\b(no-?reply|do-?not-?reply|noreply|mailer-daemon|bounce)\b/.test(sender) ||
    /\b(unsubscribe|manage preferences|notification|digest|promo|newsletter)\b/.test(text)
  ) {
    return 'likely_machine_generated'
  }

  if (/\b(re:|meeting|call|invoice|payment|please|follow up|question|thanks)\b/.test(text)) {
    return 'likely_human'
  }

  return 'uncertain'
}

export function rowCategoryHas(row: GmailMailboxIndexRow, label: string): boolean {
  return (row.category_labels || []).includes(label)
}

function rowSubject(row: GmailMailboxIndexRow): string {
  return (row.subject || '').toLowerCase()
}

export function rowSender(row: GmailMailboxIndexRow): string {
  return (row.sender || '').toLowerCase()
}

function isRowOlderThanDays(row: GmailMailboxIndexRow, days: number, nowMs: number): boolean {
  if (row.internal_date_ms == null || !Number.isFinite(row.internal_date_ms)) return false
  const threshold = nowMs - days * 24 * 60 * 60 * 1000
  return row.internal_date_ms < threshold
}

function isRowWithinDays(row: GmailMailboxIndexRow, days: number, nowMs: number): boolean {
  if (row.internal_date_ms == null || !Number.isFinite(row.internal_date_ms)) return false
  const threshold = nowMs - days * 24 * 60 * 60 * 1000
  return row.internal_date_ms >= threshold
}

export function isLikelyMachineGeneratedRow(row: GmailMailboxIndexRow): boolean {
  const sender = rowSender(row)
  const subject = rowSubject(row)
  return (
    /\b(no-?reply|do-?not-?reply|noreply|mailer-daemon|bounce)\b/.test(sender) ||
    /\b(unsubscribe|manage preferences|notification|digest|promo|newsletter|sale|offer)\b/.test(
      subject
    )
  )
}

export function isLikelyHumanPriorityRow(row: GmailMailboxIndexRow): boolean {
  if (row.is_important || row.is_starred) return true
  const sender = rowSender(row)
  const subject = rowSubject(row)
  if (isLikelyMachineGeneratedRow(row)) return false
  return /\b(re:|meeting|call|please|follow up|question|thanks)\b/.test(subject) || sender.includes('@')
}

function asPreviewMessage(row: GmailMailboxIndexRow): GmailCleanupClusterPreviewMessage {
  return {
    message_id: row.message_id,
    ...(row.thread_id ? { thread_id: row.thread_id } : {}),
    ...(row.internal_date_ms != null ? { internal_date_ms: row.internal_date_ms } : {}),
    subject: row.subject,
    from: row.sender,
    date: row.date,
    snippet: null,
    label_ids: row.label_ids || [],
    category_labels: row.category_labels || [],
    is_in_inbox: row.is_in_inbox,
    is_unread: row.is_unread,
    is_important: row.is_important,
    is_starred: row.is_starred,
  }
}

function buildQueryClusterBrowserAnalyticsSummary(params: {
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): GmailQueryClusterBrowserData['analytics_summary'] {
  const totalMessages = params.rows.length
  const senderCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()
  const recencyCounts = new Map<string, number>([
    ['0-30d', 0],
    ['31-90d', 0],
    ['91-180d', 0],
    ['181d+', 0],
  ])
  const protectionCounts = new Map<string, number>([
    ['Reviewable', 0],
    ['Protected', 0],
  ])
  let unreadCount = 0
  let starredCount = 0
  let importantCount = 0
  let noRecentInteractionCount = 0
  let machineLikeCount = 0
  let humanLikeCount = 0
  let mixedCount = 0

  for (const row of params.rows) {
    const senderLabel = rowSender(row) || 'Unknown sender'
    senderCounts.set(senderLabel, (senderCounts.get(senderLabel) || 0) + 1)

    const pattern = classifySenderPatternFromSubject(row.subject)
    patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)

    const internalDateMs =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (internalDateMs != null) {
      const ageDays = (params.nowMs - internalDateMs) / (24 * 60 * 60 * 1000)
      if (ageDays <= 30) recencyCounts.set('0-30d', (recencyCounts.get('0-30d') || 0) + 1)
      else if (ageDays <= 90) recencyCounts.set('31-90d', (recencyCounts.get('31-90d') || 0) + 1)
      else if (ageDays <= 180) recencyCounts.set('91-180d', (recencyCounts.get('91-180d') || 0) + 1)
      else recencyCounts.set('181d+', (recencyCounts.get('181d+') || 0) + 1)
    }

    if (row.is_unread) unreadCount += 1
    if (row.is_starred) starredCount += 1
    if (row.is_important) importantCount += 1
    if (isRowLikelyNoRecentInteraction(row, params.nowMs)) noRecentInteractionCount += 1

    const protectedRow =
      row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
    protectionCounts.set(
      protectedRow ? 'Protected' : 'Reviewable',
      (protectionCounts.get(protectedRow ? 'Protected' : 'Reviewable') || 0) + 1
    )

    const machineLike = isLikelyMachineGeneratedRow(row)
    const humanLike = !machineLike && isLikelyHumanPriorityRow(row)
    if (machineLike) machineLikeCount += 1
    else if (humanLike) humanLikeCount += 1
    else mixedCount += 1
  }

  const toSeries = (counts: Map<string, number>, limit: number) =>
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label, count]) => ({ label, count }))

  return {
    exactness: 'current_batch_exact',
    total_messages: totalMessages,
    top_senders: toSeries(senderCounts, 6),
    pattern_distribution: toSeries(patternCounts, 6),
    recency_distribution: toSeries(recencyCounts, 4),
    attention_distribution: [
      { label: 'Unread', count: unreadCount, exactness: 'actual' },
      { label: 'Starred', count: starredCount, exactness: 'actual' },
      { label: 'Important', count: importantCount, exactness: 'actual' },
      {
        label: 'No recent interaction',
        count: noRecentInteractionCount,
        exactness: 'inferred',
      },
    ],
    sender_mix: [
      { label: 'Machine-like', count: machineLikeCount, exactness: 'inferred' },
      { label: 'Human-like', count: humanLikeCount, exactness: 'inferred' },
      { label: 'Mixed / unclear', count: mixedCount, exactness: 'inferred' },
    ],
    protection_distribution: toSeries(protectionCounts, 2),
  }
}

export function buildQueryClusterBrowserSenderBreakdown(params: {
  rows: GmailMailboxIndexRow[]
  cleanupGroupRows?: GmailMailboxIndexRow[]
  previewLimit?: number
  includePreviewMessages?: boolean
}): GmailQueryClusterBrowserData['sender_breakdown'] {
  const previewLimit = Math.min(Math.max(params.previewLimit ?? 8, 1), 10)
  const includePreviewMessages = params.includePreviewMessages !== false
  const senderMap = new Map<
    string,
    {
      sender: string
      rows: GmailMailboxIndexRow[]
      batchUnreadCount: number
      batchStarredCount: number
      batchImportantCount: number
      batchInInboxCount: number
      batchProtectedCount: number
      patternCounts: Map<string, number>
      firstSeenMs: number | null
      lastSeenMs: number | null
    }
  >()

  for (const row of params.rows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current =
      senderMap.get(senderKey) ||
      {
        sender,
        rows: [],
        batchUnreadCount: 0,
        batchStarredCount: 0,
        batchImportantCount: 0,
        batchInInboxCount: 0,
        batchProtectedCount: 0,
        patternCounts: new Map<string, number>(),
        firstSeenMs: null,
        lastSeenMs: null,
      }

    current.rows.push(row)
    if (row.is_unread) current.batchUnreadCount += 1
    if (row.is_starred) current.batchStarredCount += 1
    if (row.is_important) current.batchImportantCount += 1
    if (row.is_in_inbox) current.batchInInboxCount += 1
    if (row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')) {
      current.batchProtectedCount += 1
    }

    const pattern = classifySenderPatternFromSubject(row.subject)
    current.patternCounts.set(pattern, (current.patternCounts.get(pattern) || 0) + 1)

    const timestamp =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (timestamp != null) {
      current.firstSeenMs =
        current.firstSeenMs == null ? timestamp : Math.min(current.firstSeenMs, timestamp)
      current.lastSeenMs =
        current.lastSeenMs == null ? timestamp : Math.max(current.lastSeenMs, timestamp)
    }

    senderMap.set(senderKey, current)
  }

  const cleanupGroupCounts = new Map<string, number>()
  for (const row of params.cleanupGroupRows || params.rows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    cleanupGroupCounts.set(senderKey, (cleanupGroupCounts.get(senderKey) || 0) + 1)
  }

  return Array.from(senderMap.entries())
    .map(([senderKey, entry]) => {
      const patternProfile = buildPatternMixFromCounts({
        patternCounts: entry.patternCounts,
        totalMessageCount: entry.rows.length,
      })
      const dominantPattern = patternProfile.dominant_pattern
      const patternSummary = patternProfile.pattern_mix
        .slice(0, 2)
        .map((pattern) => `${pattern.pattern} (${pattern.count})`)
        .join(' · ')
      const previewMessages = includePreviewMessages
        ? [...entry.rows]
            .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
            .slice(0, previewLimit)
            .map((row) => asPreviewMessage(row))
        : []

      return {
        sender: entry.sender,
        sender_key: senderKey,
        batch_message_count: entry.rows.length,
        cleanup_group_message_count: cleanupGroupCounts.get(senderKey) || entry.rows.length,
        batch_unread_count: entry.batchUnreadCount,
        batch_starred_count: entry.batchStarredCount,
        batch_important_count: entry.batchImportantCount,
        batch_in_inbox_count: entry.batchInInboxCount,
        batch_protected_count: entry.batchProtectedCount,
        batch_first_seen:
          entry.firstSeenMs != null ? new Date(entry.firstSeenMs).toISOString() : null,
        batch_last_seen:
          entry.lastSeenMs != null ? new Date(entry.lastSeenMs).toISOString() : null,
        dominant_pattern: dominantPattern,
        pattern_summary: patternSummary || dominantPattern,
        preview_messages: previewMessages,
      }
    })
    .sort((a, b) => b.batch_message_count - a.batch_message_count || a.sender.localeCompare(b.sender))
}

function intelligenceCategoryLabel(row: GmailMailboxIndexRow): string {
  if (rowCategoryHas(row, 'CATEGORY_PROMOTIONS')) return 'Promotions'
  if (rowCategoryHas(row, 'CATEGORY_SOCIAL')) return 'Social'
  if (rowCategoryHas(row, 'CATEGORY_UPDATES')) return 'Updates'
  if (rowCategoryHas(row, 'CATEGORY_FORUMS')) return 'Forums'
  if (rowCategoryHas(row, 'CATEGORY_PRIMARY')) return 'Primary'
  return classifySenderPatternFromSubject(row.subject)
}

function normalizePressureMixCategory(label: string): string {
  if (label === 'Promotions' || label === 'Newsletter / promotional') {
    return 'Newsletter promotions'
  }
  if (label === 'Invoices / receipts' || label === 'Commerce / shipping updates') {
    return 'Commerce / shipping updates'
  }
  if (label === 'Alerts / security') return 'Alerts / security'
  if (label === 'Human correspondence') return 'Human correspondence'
  return 'General updates'
}

function buildPressureEvidenceSignals(params: {
  total: number
  machineLikeCount: number
  humanLikeCount: number
  protectedCount: number
}): GmailPressureTimelineEvidenceSignal[] {
  const share = (count: number) =>
    params.total > 0 ? Math.round((count / params.total) * 100) : 0

  return [
    {
      label: 'Machine-likely correspondence',
      count: params.machineLikeCount,
      share_pct: share(params.machineLikeCount),
      exactness: 'inferred' as const,
    },
    {
      label: 'Human-likely correspondence',
      count: params.humanLikeCount,
      share_pct: share(params.humanLikeCount),
      exactness: 'inferred' as const,
    },
    {
      label: 'Protected evidence',
      count: params.protectedCount,
      share_pct: share(params.protectedCount),
      exactness: 'actual' as const,
    },
  ].filter((item) => item.count > 0)
}

const PRESSURE_TREND_MS_PER_HOUR = 60 * 60 * 1000
const PRESSURE_TREND_MS_PER_DAY = 24 * PRESSURE_TREND_MS_PER_HOUR
const PRESSURE_TREND_MAX_BUCKETS = 512

type PressureTrendCoverage = {
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
}

type PressureTrendZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

type PressureTrendResolvedWindow = {
  grouping: GmailPressureTrendGrouping
  label: string
  requestedStart: string | null
  requestedEnd: string | null
  effectiveStartMs: number | null
  effectiveEndExclusiveMs: number | null
  limitedByIndexedCoverage: boolean
  timeZone: string
}

const pressureTrendDateTimeFormatters = new Map<string, Intl.DateTimeFormat>()
const pressureTrendWeekdayFormatters = new Map<string, Intl.DateTimeFormat>()
const pressureTrendHourLabelFormatters = new Map<string, Intl.DateTimeFormat>()
const pressureTrendDayLabelFormatters = new Map<string, Intl.DateTimeFormat>()
const pressureTrendMonthLabelFormatters = new Map<string, Intl.DateTimeFormat>()

const PRESSURE_TREND_WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

function safePressureTrendTimeZone(value: string | null | undefined): string {
  const normalized = typeof value === 'string' && value.trim() ? value.trim() : 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date())
    return normalized
  } catch {
    return 'UTC'
  }
}

function pressureTrendDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = pressureTrendDateTimeFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  pressureTrendDateTimeFormatters.set(timeZone, formatter)
  return formatter
}

function pressureTrendWeekdayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = pressureTrendWeekdayFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  })
  pressureTrendWeekdayFormatters.set(timeZone, formatter)
  return formatter
}

function pressureTrendHourLabelFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = pressureTrendHourLabelFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  pressureTrendHourLabelFormatters.set(timeZone, formatter)
  return formatter
}

function pressureTrendDayLabelFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = pressureTrendDayLabelFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  })
  pressureTrendDayLabelFormatters.set(timeZone, formatter)
  return formatter
}

function pressureTrendMonthLabelFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = pressureTrendMonthLabelFormatters.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    year: 'numeric',
  })
  pressureTrendMonthLabelFormatters.set(timeZone, formatter)
  return formatter
}

function pressureTrendPartsAt(utcMs: number, timeZone: string): PressureTrendZonedParts {
  const parts = pressureTrendDateTimeFormatter(timeZone).formatToParts(new Date(utcMs))
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value || '0'
    return Number.parseInt(value, 10) || 0
  }

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

function pressureTrendTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const normalizedUtcMs = Math.floor(utcMs / 1000) * 1000
  const parts = pressureTrendPartsAt(normalizedUtcMs, timeZone)
  const asUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )
  return asUtcMs - normalizedUtcMs
}

function pressureTrendLocalDateTimeToUtcMs(
  parts: PressureTrendZonedParts,
  timeZone: string
): number {
  const guessUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  )
  const firstOffset = pressureTrendTimeZoneOffsetMs(guessUtcMs, timeZone)
  let resolvedUtcMs = guessUtcMs - firstOffset
  const secondOffset = pressureTrendTimeZoneOffsetMs(resolvedUtcMs, timeZone)
  if (secondOffset !== firstOffset) {
    resolvedUtcMs = guessUtcMs - secondOffset
  }
  return resolvedUtcMs
}

function pressureTrendShiftLocalParts(
  parts: PressureTrendZonedParts,
  grouping: GmailPressureTrendGrouping,
  amount: number
): PressureTrendZonedParts {
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  )
  if (grouping === 'hour') shifted.setUTCHours(shifted.getUTCHours() + amount)
  else if (grouping === 'day') shifted.setUTCDate(shifted.getUTCDate() + amount)
  else if (grouping === 'week') shifted.setUTCDate(shifted.getUTCDate() + amount * 7)
  else if (grouping === 'month') shifted.setUTCMonth(shifted.getUTCMonth() + amount)
  else if (grouping === 'quarter') shifted.setUTCMonth(shifted.getUTCMonth() + amount * 3)
  else shifted.setUTCFullYear(shifted.getUTCFullYear() + amount)

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: grouping === 'hour' ? shifted.getUTCHours() : 0,
    minute: 0,
    second: 0,
  }
}

function pressureTrendWeekdayIndex(utcMs: number, timeZone: string): number {
  const label = pressureTrendWeekdayFormatter(timeZone).format(new Date(utcMs))
  return PRESSURE_TREND_WEEKDAY_INDEX[label] ?? 0
}

function pressureTrendBucketStartUtcMs(
  utcMs: number,
  grouping: GmailPressureTrendGrouping,
  timeZone: string
): number {
  const parts = pressureTrendPartsAt(utcMs, timeZone)
  if (grouping === 'hour') {
    return pressureTrendLocalDateTimeToUtcMs(
      { ...parts, minute: 0, second: 0 },
      timeZone
    )
  }
  if (grouping === 'day') {
    return pressureTrendLocalDateTimeToUtcMs(
      { ...parts, hour: 0, minute: 0, second: 0 },
      timeZone
    )
  }
  if (grouping === 'week') {
    const dayStart = pressureTrendLocalDateTimeToUtcMs(
      { ...parts, hour: 0, minute: 0, second: 0 },
      timeZone
    )
    const weekdayIndex = pressureTrendWeekdayIndex(dayStart, timeZone)
    const shifted = pressureTrendShiftLocalParts(
      { ...parts, hour: 0, minute: 0, second: 0 },
      'day',
      -weekdayIndex
    )
    return pressureTrendLocalDateTimeToUtcMs(shifted, timeZone)
  }
  if (grouping === 'month') {
    return pressureTrendLocalDateTimeToUtcMs(
      { year: parts.year, month: parts.month, day: 1, hour: 0, minute: 0, second: 0 },
      timeZone
    )
  }
  if (grouping === 'quarter') {
    const month = Math.floor((parts.month - 1) / 3) * 3 + 1
    return pressureTrendLocalDateTimeToUtcMs(
      { year: parts.year, month, day: 1, hour: 0, minute: 0, second: 0 },
      timeZone
    )
  }
  return pressureTrendLocalDateTimeToUtcMs(
    { year: parts.year, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
    timeZone
  )
}

function pressureTrendNextBucketStartUtcMs(
  bucketStartUtcMs: number,
  grouping: GmailPressureTrendGrouping,
  timeZone: string
): number {
  const parts = pressureTrendPartsAt(bucketStartUtcMs, timeZone)
  const shifted = pressureTrendShiftLocalParts(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: grouping === 'hour' ? parts.hour : 0,
      minute: 0,
      second: 0,
    },
    grouping,
    1
  )
  return pressureTrendLocalDateTimeToUtcMs(shifted, timeZone)
}

function pressureTrendBucketLabel(
  bucketStartUtcMs: number,
  grouping: GmailPressureTrendGrouping,
  timeZone: string
): string {
  if (grouping === 'hour') {
    return pressureTrendHourLabelFormatter(timeZone).format(new Date(bucketStartUtcMs))
  }
  if (grouping === 'day' || grouping === 'week') {
    return pressureTrendDayLabelFormatter(timeZone).format(new Date(bucketStartUtcMs))
  }
  if (grouping === 'month') {
    return pressureTrendMonthLabelFormatter(timeZone).format(new Date(bucketStartUtcMs))
  }
  if (grouping === 'quarter') {
    const parts = pressureTrendPartsAt(bucketStartUtcMs, timeZone)
    return `Q${Math.floor((parts.month - 1) / 3) + 1} ${parts.year}`
  }
  return String(pressureTrendPartsAt(bucketStartUtcMs, timeZone).year)
}

function pressureTrendLastDayWindowFromAnchor(params: {
  anchorUtcMs: number
  timeZone: string
  effectiveEndExclusiveMs?: number
}): {
  effectiveStartMs: number
  effectiveEndExclusiveMs: number
} {
  const anchorHourStartMs = pressureTrendBucketStartUtcMs(params.anchorUtcMs, 'hour', params.timeZone)
  const anchorHourParts = pressureTrendPartsAt(anchorHourStartMs, params.timeZone)
  const effectiveEndExclusiveMs =
    params.effectiveEndExclusiveMs ??
    pressureTrendNextBucketStartUtcMs(anchorHourStartMs, 'hour', params.timeZone)
  const effectiveStartMs = pressureTrendLocalDateTimeToUtcMs(
    pressureTrendShiftLocalParts(
      {
        year: anchorHourParts.year,
        month: anchorHourParts.month,
        day: anchorHourParts.day,
        hour: anchorHourParts.hour,
        minute: 0,
        second: 0,
      },
      'hour',
      -23
    ),
    params.timeZone
  )

  return {
    effectiveStartMs,
    effectiveEndExclusiveMs,
  }
}

function pressureTrendLastDayWindow(nowMs: number, timeZone: string): {
  effectiveStartMs: number
  effectiveEndExclusiveMs: number
} {
  const nowParts = pressureTrendPartsAt(nowMs, timeZone)
  const currentHourStartMs = pressureTrendLocalDateTimeToUtcMs(
    {
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day,
      hour: nowParts.hour,
      minute: 0,
      second: 0,
    },
    timeZone
  )
  return pressureTrendLastDayWindowFromAnchor({
    anchorUtcMs: currentHourStartMs,
    timeZone,
  })
}

function pressureTrendRollingDayWindowFromAnchor(params: {
  anchorUtcMs: number
  timeZone: string
  dayCount: number
  effectiveEndExclusiveMs?: number
}): {
  effectiveStartMs: number
  effectiveEndExclusiveMs: number
} {
  const anchorDayStartMs = pressureTrendBucketStartUtcMs(params.anchorUtcMs, 'day', params.timeZone)
  const anchorDayParts = pressureTrendPartsAt(anchorDayStartMs, params.timeZone)
  const effectiveEndExclusiveMs =
    params.effectiveEndExclusiveMs ??
    pressureTrendNextBucketStartUtcMs(anchorDayStartMs, 'day', params.timeZone)
  const effectiveStartMs = pressureTrendLocalDateTimeToUtcMs(
    pressureTrendShiftLocalParts(
      {
        year: anchorDayParts.year,
        month: anchorDayParts.month,
        day: anchorDayParts.day,
        hour: 0,
        minute: 0,
        second: 0,
      },
      'day',
      -(Math.max(1, params.dayCount) - 1)
    ),
    params.timeZone
  )

  return {
    effectiveStartMs,
    effectiveEndExclusiveMs,
  }
}

function pressureTrendWindowLabel(window: GmailPressureTrendWindow): string {
  if (window === 'all_indexed') return 'All indexed history'
  if (window === 'last_year') return 'Last year'
  if (window === 'last_quarter') return 'Last quarter'
  if (window === 'last_month') return 'Last month'
  if (window === 'last_week') return 'Last week'
  if (window === 'last_day') return 'Last day'
  return 'Custom range'
}

function pressureTrendGroupingLabel(grouping: GmailPressureTrendGrouping): string {
  if (grouping === 'hour') return 'Hourly bars'
  if (grouping === 'day') return 'Daily bars'
  if (grouping === 'week') return 'Weekly bars'
  if (grouping === 'month') return 'Monthly bars'
  if (grouping === 'quarter') return 'Quarterly bars'
  return 'Yearly bars'
}

function pressureTrendAllIndexedGroupingForSpanMs(spanMs: number): GmailPressureTrendGrouping {
  const spanDays = spanMs / PRESSURE_TREND_MS_PER_DAY
  if (spanDays <= 548) return 'month'
  if (spanDays <= 1825) return 'quarter'
  return 'year'
}

function pressureTrendCustomGroupingForSpanMs(spanMs: number): GmailPressureTrendGrouping {
  if (spanMs <= 48 * PRESSURE_TREND_MS_PER_HOUR) return 'hour'
  if (spanMs <= 45 * PRESSURE_TREND_MS_PER_DAY) return 'day'
  if (spanMs <= 120 * PRESSURE_TREND_MS_PER_DAY) return 'week'
  if (spanMs <= 548 * PRESSURE_TREND_MS_PER_DAY) return 'month'
  if (spanMs <= 1825 * PRESSURE_TREND_MS_PER_DAY) return 'quarter'
  return 'year'
}

function pressureTrendParseDateInput(value: string | null | undefined): {
  year: number
  month: number
  day: number
} | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)
  const day = Number.parseInt(match[3], 10)
  const validated = new Date(Date.UTC(year, month - 1, day))
  if (
    validated.getUTCFullYear() !== year ||
    validated.getUTCMonth() + 1 !== month ||
    validated.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

function pressureTrendResolvedWindow(params: {
  coverage: PressureTrendCoverage
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  nowMs?: number
  rowStartMs?: number | null
  rowEndMs?: number | null
}): { ok: true; data: PressureTrendResolvedWindow } | { ok: false; error: string } {
  const timeZone = safePressureTrendTimeZone(params.timeZone)
  const nowMs = typeof params.nowMs === 'number' && Number.isFinite(params.nowMs) ? params.nowMs : Date.now()
  const coverageStartMs = (() => {
    const parsed = Date.parse(params.coverage.indexed_date_span_start || '')
    if (Number.isFinite(parsed)) return parsed
    return params.rowStartMs ?? null
  })()
  const coverageEndInclusiveMs = (() => {
    const parsed = Date.parse(params.coverage.indexed_date_span_end || '')
    if (Number.isFinite(parsed)) return parsed
    return params.rowEndMs ?? null
  })()
  const coverageEndExclusiveMs =
    coverageEndInclusiveMs != null ? coverageEndInclusiveMs + 1 : null
  const liveEndExclusiveMs = nowMs + 1
  const effectiveAnchorEndExclusiveMs =
    coverageEndExclusiveMs != null && coverageEndExclusiveMs < liveEndExclusiveMs
      ? coverageEndExclusiveMs
      : liveEndExclusiveMs
  let effectiveStartMs: number | null = null
  let effectiveEndExclusiveMs: number | null = null
  let requestedStart: string | null = null
  let requestedEnd: string | null = null
  let limitedByIndexedCoverage = false

  if (params.pressureWindow === 'all_indexed') {
    effectiveStartMs = coverageStartMs
    effectiveEndExclusiveMs = coverageEndExclusiveMs
  } else if (params.pressureWindow === 'last_year') {
    effectiveStartMs = effectiveAnchorEndExclusiveMs - 365 * PRESSURE_TREND_MS_PER_DAY
    effectiveEndExclusiveMs = effectiveAnchorEndExclusiveMs
    limitedByIndexedCoverage = effectiveAnchorEndExclusiveMs !== liveEndExclusiveMs
  } else if (params.pressureWindow === 'last_quarter') {
    effectiveStartMs = effectiveAnchorEndExclusiveMs - 90 * PRESSURE_TREND_MS_PER_DAY
    effectiveEndExclusiveMs = effectiveAnchorEndExclusiveMs
    limitedByIndexedCoverage = effectiveAnchorEndExclusiveMs !== liveEndExclusiveMs
  } else if (params.pressureWindow === 'last_month') {
    const rollingMonthWindow = pressureTrendRollingDayWindowFromAnchor({
      anchorUtcMs: Math.max(effectiveAnchorEndExclusiveMs - 1, 0),
      timeZone,
      dayCount: 30,
      effectiveEndExclusiveMs: effectiveAnchorEndExclusiveMs,
    })
    effectiveStartMs = rollingMonthWindow.effectiveStartMs
    effectiveEndExclusiveMs = rollingMonthWindow.effectiveEndExclusiveMs
    limitedByIndexedCoverage = effectiveAnchorEndExclusiveMs !== liveEndExclusiveMs
  } else if (params.pressureWindow === 'last_week') {
    const rollingWeekWindow = pressureTrendRollingDayWindowFromAnchor({
      anchorUtcMs: Math.max(effectiveAnchorEndExclusiveMs - 1, 0),
      timeZone,
      dayCount: 7,
      effectiveEndExclusiveMs: effectiveAnchorEndExclusiveMs,
    })
    effectiveStartMs = rollingWeekWindow.effectiveStartMs
    effectiveEndExclusiveMs = rollingWeekWindow.effectiveEndExclusiveMs
    limitedByIndexedCoverage = effectiveAnchorEndExclusiveMs !== liveEndExclusiveMs
  } else if (params.pressureWindow === 'last_day') {
    const lastDayWindow = pressureTrendLastDayWindow(nowMs, timeZone)
    effectiveStartMs = lastDayWindow.effectiveStartMs
    effectiveEndExclusiveMs = lastDayWindow.effectiveEndExclusiveMs
    if (
      coverageEndExclusiveMs != null &&
      effectiveEndExclusiveMs > coverageEndExclusiveMs
    ) {
      const clampedLastDayWindow = pressureTrendLastDayWindowFromAnchor({
        anchorUtcMs: Math.max(coverageEndExclusiveMs - 1, 0),
        timeZone,
        effectiveEndExclusiveMs: coverageEndExclusiveMs,
      })
      effectiveStartMs = clampedLastDayWindow.effectiveStartMs
      effectiveEndExclusiveMs = clampedLastDayWindow.effectiveEndExclusiveMs
      limitedByIndexedCoverage = true
    }
  } else {
    const startParts = pressureTrendParseDateInput(params.pressureStart)
    const endParts = pressureTrendParseDateInput(params.pressureEnd)
    if (!startParts || !endParts) {
      return { ok: false, error: 'Custom Pressure Trend range requires valid start and end dates.' }
    }
    requestedStart = params.pressureStart?.trim() || null
    requestedEnd = params.pressureEnd?.trim() || null
    effectiveStartMs = pressureTrendLocalDateTimeToUtcMs(
      {
        year: startParts.year,
        month: startParts.month,
        day: startParts.day,
        hour: 0,
        minute: 0,
        second: 0,
      },
      timeZone
    )
    effectiveEndExclusiveMs = pressureTrendLocalDateTimeToUtcMs(
      pressureTrendShiftLocalParts(
        {
          year: endParts.year,
          month: endParts.month,
          day: endParts.day,
          hour: 0,
          minute: 0,
          second: 0,
        },
        'day',
        1
      ),
      timeZone
    )
    if (effectiveEndExclusiveMs <= effectiveStartMs) {
      return { ok: false, error: 'Custom Pressure Trend end date must be on or after the start date.' }
    }
  }

  if (coverageStartMs != null && effectiveStartMs != null && effectiveStartMs < coverageStartMs) {
    effectiveStartMs = coverageStartMs
    limitedByIndexedCoverage = true
  }
  if (
    coverageEndExclusiveMs != null &&
    effectiveEndExclusiveMs != null &&
    effectiveEndExclusiveMs > coverageEndExclusiveMs
  ) {
    effectiveEndExclusiveMs = coverageEndExclusiveMs
    limitedByIndexedCoverage = true
  }
  if (
    params.pressureWindow === 'last_day' &&
    coverageEndExclusiveMs != null &&
    effectiveStartMs != null &&
    effectiveEndExclusiveMs != null &&
    effectiveEndExclusiveMs <= effectiveStartMs
  ) {
    const recoveredLastDayWindow = pressureTrendLastDayWindowFromAnchor({
      anchorUtcMs: Math.max(coverageEndExclusiveMs - 1, 0),
      timeZone,
      effectiveEndExclusiveMs: coverageEndExclusiveMs,
    })
    effectiveStartMs = recoveredLastDayWindow.effectiveStartMs
    effectiveEndExclusiveMs = recoveredLastDayWindow.effectiveEndExclusiveMs
    if (coverageStartMs != null && effectiveStartMs < coverageStartMs) {
      effectiveStartMs = coverageStartMs
    }
    if (effectiveEndExclusiveMs > coverageEndExclusiveMs) {
      effectiveEndExclusiveMs = coverageEndExclusiveMs
    }
    limitedByIndexedCoverage = true
  }

  const grouping =
    params.pressureWindow === 'all_indexed'
      ? pressureTrendAllIndexedGroupingForSpanMs(
          Math.max((effectiveEndExclusiveMs || 0) - (effectiveStartMs || 0), PRESSURE_TREND_MS_PER_DAY)
        )
      : params.pressureWindow === 'last_year'
        ? 'month'
        : params.pressureWindow === 'last_quarter'
          ? 'week'
          : params.pressureWindow === 'last_month' || params.pressureWindow === 'last_week'
            ? 'day'
            : params.pressureWindow === 'last_day'
              ? 'hour'
              : pressureTrendCustomGroupingForSpanMs(
                  Math.max(
                    (effectiveEndExclusiveMs || 0) - (effectiveStartMs || 0),
                    PRESSURE_TREND_MS_PER_DAY
                  )
                )

  return {
    ok: true,
    data: {
      grouping,
      label: pressureTrendWindowLabel(params.pressureWindow),
      requestedStart,
      requestedEnd,
      effectiveStartMs,
      effectiveEndExclusiveMs,
      limitedByIndexedCoverage,
      timeZone,
    },
  }
}

export function buildGmailPressureTrendData(params: {
  rows: GmailMailboxIndexRow[]
  coverage: PressureTrendCoverage
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  nowMs?: number
}): { ok: true; data: GmailPressureTrendData } | { ok: false; error: string } {
  const datedRows = params.rows.filter(
    (row): row is GmailMailboxIndexRow & { internal_date_ms: number } =>
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
  )
  let rowStartMs: number | null = null
  let rowEndMs: number | null = null
  for (const row of datedRows) {
    if (rowStartMs == null || row.internal_date_ms < rowStartMs) {
      rowStartMs = row.internal_date_ms
    }
    if (rowEndMs == null || row.internal_date_ms > rowEndMs) {
      rowEndMs = row.internal_date_ms
    }
  }
  const resolvedWindow = pressureTrendResolvedWindow({
    coverage: params.coverage,
    pressureWindow: params.pressureWindow,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
    timeZone: params.timeZone,
    nowMs: params.nowMs,
    rowStartMs,
    rowEndMs,
  })
  if (!resolvedWindow.ok) return resolvedWindow

  const { grouping, label, requestedStart, requestedEnd, effectiveStartMs, effectiveEndExclusiveMs, limitedByIndexedCoverage, timeZone } =
    resolvedWindow.data

  if (
    effectiveStartMs == null ||
    effectiveEndExclusiveMs == null ||
    effectiveEndExclusiveMs <= effectiveStartMs
  ) {
    return {
      ok: true,
      data: {
        window: {
          key: params.pressureWindow,
          label,
          requested_start: requestedStart,
          requested_end: requestedEnd,
          effective_start: null,
          effective_end: null,
          limited_by_indexed_coverage: limitedByIndexedCoverage,
        },
        grouping: {
          key: grouping,
          label: pressureTrendGroupingLabel(grouping),
        },
        indexed_coverage: params.coverage,
        time_zone: timeZone,
        series: [],
        source: 'gmail_index_cache',
      },
    }
  }

  const bucketMap = new Map<
    string,
    {
      bucketStartMs: number
      bucketEndExclusiveMs: number
      count: number
      compositionCounts: Map<string, number>
      machineLikeCount: number
      humanLikeCount: number
      protectedCount: number
    }
  >()

  let cursorMs = pressureTrendBucketStartUtcMs(effectiveStartMs, grouping, timeZone)
  let bucketCount = 0
  while (cursorMs < effectiveEndExclusiveMs && bucketCount < PRESSURE_TREND_MAX_BUCKETS) {
    const nextCursorMs = pressureTrendNextBucketStartUtcMs(cursorMs, grouping, timeZone)
    if (nextCursorMs <= cursorMs) break
    bucketMap.set(String(cursorMs), {
      bucketStartMs: cursorMs,
      bucketEndExclusiveMs: nextCursorMs,
      count: 0,
      compositionCounts: new Map<string, number>(),
      machineLikeCount: 0,
      humanLikeCount: 0,
      protectedCount: 0,
    })
    cursorMs = nextCursorMs
    bucketCount += 1
  }

  for (const row of datedRows) {
    if (row.internal_date_ms < effectiveStartMs || row.internal_date_ms >= effectiveEndExclusiveMs) continue
    const bucketStartMs = pressureTrendBucketStartUtcMs(row.internal_date_ms, grouping, timeZone)
    const bucket = bucketMap.get(String(bucketStartMs))
    if (!bucket) continue
    const categoryLabel = intelligenceCategoryLabel(row)
    const pressureMixCategory = normalizePressureMixCategory(categoryLabel)
    const machineLike = isLikelyMachineGeneratedRow(row)
    const humanLike = !machineLike && isLikelyHumanPriorityRow(row)
    const protectedRow =
      row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')
    bucket.count += 1
    bucket.compositionCounts.set(
      pressureMixCategory,
      (bucket.compositionCounts.get(pressureMixCategory) || 0) + 1
    )
    if (machineLike) bucket.machineLikeCount += 1
    if (humanLike) bucket.humanLikeCount += 1
    if (protectedRow) bucket.protectedCount += 1
  }

  const series: GmailPressureTrendBucket[] = Array.from(bucketMap.values())
    .sort((left, right) => left.bucketStartMs - right.bucketStartMs)
    .map((bucket) => {
      const clippedStartMs = Math.max(bucket.bucketStartMs, effectiveStartMs)
      const clippedEndInclusiveMs = Math.max(
        clippedStartMs,
        Math.min(bucket.bucketEndExclusiveMs, effectiveEndExclusiveMs) - 1
      )
      return {
        label: pressureTrendBucketLabel(bucket.bucketStartMs, grouping, timeZone),
        count: bucket.count,
        bucket_start_at: new Date(clippedStartMs).toISOString(),
        bucket_end_at: new Date(clippedEndInclusiveMs).toISOString(),
        composition: Array.from(bucket.compositionCounts.entries())
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([compositionLabel, count]) => ({
            label: compositionLabel,
            count,
            share_pct: bucket.count > 0 ? Math.round((count / bucket.count) * 100) : 0,
          })),
        evidence_signals: buildPressureEvidenceSignals({
          total: bucket.count,
          machineLikeCount: bucket.machineLikeCount,
          humanLikeCount: bucket.humanLikeCount,
          protectedCount: bucket.protectedCount,
        }),
      }
    })

  return {
    ok: true,
    data: {
      window: {
        key: params.pressureWindow,
        label,
        requested_start: requestedStart,
        requested_end: requestedEnd,
        effective_start: new Date(effectiveStartMs).toISOString(),
        effective_end: new Date(Math.max(effectiveStartMs, effectiveEndExclusiveMs - 1)).toISOString(),
        limited_by_indexed_coverage: limitedByIndexedCoverage,
      },
      grouping: {
        key: grouping,
        label: pressureTrendGroupingLabel(grouping),
      },
      indexed_coverage: params.coverage,
      time_zone: timeZone,
      series,
      source: 'gmail_index_cache',
    },
  }
}

export function buildCleanupGroupIntelligence(params: {
  rows: GmailMailboxIndexRow[]
  rowsSortedDesc?: boolean
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  analysisScope: GmailAnalysisScope
  clusterCount: number
}): GmailCleanupGroupIntelligenceData {
  const rows = params.rowsSortedDesc
    ? params.rows
    : [...params.rows].sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
  const totalMessages = rows.length
  const senderMap = new Map<
    string,
    {
      sender: string
      messageCount: number
      unreadCount: number
      importantCount: number
      starredCount: number
      firstSeenMs: number | null
      lastSeenMs: number | null
      categoryCounts: Map<string, number>
      sampleText: string
    }
  >()
  const categoryCounts = new Map<string, number>()
  const humanAutomationCounts = new Map<string, number>([
    ['Automation-heavy', 0],
    ['Human-like', 0],
    ['Mixed / unclear', 0],
  ])
  const timelineBuckets = new Map<
    string,
    {
      count: number
      compositionCounts: Map<string, number>
      machineLikeCount: number
      humanLikeCount: number
      protectedCount: number
    }
  >()

  const timelineGranularity = activityTimelineGranularityForScope(params.analysisScope)

  let cleanupFirstSeenMs: number | null = null
  let cleanupLastSeenMs: number | null = null

  for (const row of rows) {
    const sender = rowSender(row) || 'unknown-sender'
    const displaySender = row.sender || 'Unknown sender'
    const current =
      senderMap.get(sender) ||
      {
        sender: displaySender,
        messageCount: 0,
        unreadCount: 0,
        importantCount: 0,
        starredCount: 0,
        firstSeenMs: null,
        lastSeenMs: null,
        categoryCounts: new Map<string, number>(),
        sampleText: '',
      }

    current.messageCount += 1
    if (row.is_unread) current.unreadCount += 1
    if (row.is_important) current.importantCount += 1
    if (row.is_starred) current.starredCount += 1
    if (!current.sampleText && row.subject) {
      current.sampleText = `${displaySender} ${row.subject}`
    }

    const categoryLabel = intelligenceCategoryLabel(row)
    categoryCounts.set(categoryLabel, (categoryCounts.get(categoryLabel) || 0) + 1)
    current.categoryCounts.set(categoryLabel, (current.categoryCounts.get(categoryLabel) || 0) + 1)
    const pressureMixCategory = normalizePressureMixCategory(categoryLabel)
    const machineLike = isLikelyMachineGeneratedRow(row)
    const humanLike = !machineLike && isLikelyHumanPriorityRow(row)
    const protectedRow =
      row.is_starred || row.is_important || rowCategoryHas(row, 'CATEGORY_PRIMARY')

    const timestamp =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (timestamp != null) {
      if (current.firstSeenMs == null || timestamp < current.firstSeenMs) current.firstSeenMs = timestamp
      if (current.lastSeenMs == null || timestamp > current.lastSeenMs) current.lastSeenMs = timestamp
      if (cleanupFirstSeenMs == null || timestamp < cleanupFirstSeenMs) cleanupFirstSeenMs = timestamp
      if (cleanupLastSeenMs == null || timestamp > cleanupLastSeenMs) cleanupLastSeenMs = timestamp

      const bucket = activityTimelineBucketKeyForTimestamp(timestamp, timelineGranularity)
      const currentBucket =
        timelineBuckets.get(bucket) || {
          count: 0,
          compositionCounts: new Map<string, number>(),
          machineLikeCount: 0,
          humanLikeCount: 0,
          protectedCount: 0,
        }
      currentBucket.count += 1
      currentBucket.compositionCounts.set(
        pressureMixCategory,
        (currentBucket.compositionCounts.get(pressureMixCategory) || 0) + 1
      )
      if (machineLike) currentBucket.machineLikeCount += 1
      if (humanLike) currentBucket.humanLikeCount += 1
      if (protectedRow) currentBucket.protectedCount += 1
      timelineBuckets.set(bucket, currentBucket)
    }

    if (machineLike) {
      humanAutomationCounts.set(
        'Automation-heavy',
        (humanAutomationCounts.get('Automation-heavy') || 0) + 1
      )
    } else if (humanLike) {
      humanAutomationCounts.set('Human-like', (humanAutomationCounts.get('Human-like') || 0) + 1)
    } else {
      humanAutomationCounts.set(
        'Mixed / unclear',
        (humanAutomationCounts.get('Mixed / unclear') || 0) + 1
      )
    }

    senderMap.set(sender, current)
  }

  const senderRanking = Array.from(senderMap.values())
    .sort((a, b) => b.messageCount - a.messageCount || a.sender.localeCompare(b.sender))
    .map((entry) => {
      const senderKey = normalizeSender(entry.sender) || entry.sender.toLowerCase()
      const categorySummary = Array.from(entry.categoryCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 2)
        .map(([label, count]) => `${label} (${count})`)
        .join(' · ')
      const senderSignal = senderSignalFromText({
        sender: entry.sender,
        sampleText: entry.sampleText || entry.sender,
      })
      return {
        sender: entry.sender,
        sender_key: senderKey,
        message_count: entry.messageCount,
        share_pct: totalMessages > 0 ? Math.round((entry.messageCount / totalMessages) * 100) : 0,
        unread_count: entry.unreadCount,
        important_count: entry.importantCount,
        starred_count: entry.starredCount,
        first_seen: entry.firstSeenMs != null ? new Date(entry.firstSeenMs).toISOString() : null,
        last_seen: entry.lastSeenMs != null ? new Date(entry.lastSeenMs).toISOString() : null,
        category_summary: categorySummary || 'General updates',
        sender_signal: senderSignal,
      }
    })

  const senderVolumeDistribution = [
    { label: '1 message', sender_count: 0 },
    { label: '2-5 messages', sender_count: 0 },
    { label: '6-10 messages', sender_count: 0 },
    { label: '11-25 messages', sender_count: 0 },
    { label: '26-50 messages', sender_count: 0 },
    { label: '51+ messages', sender_count: 0 },
  ]
  for (const sender of senderRanking) {
    const count = sender.message_count
    if (count <= 1) senderVolumeDistribution[0].sender_count += 1
    else if (count <= 5) senderVolumeDistribution[1].sender_count += 1
    else if (count <= 10) senderVolumeDistribution[2].sender_count += 1
    else if (count <= 25) senderVolumeDistribution[3].sender_count += 1
    else if (count <= 50) senderVolumeDistribution[4].sender_count += 1
    else senderVolumeDistribution[5].sender_count += 1
  }

  const activityTimeline = Array.from(timelineBuckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, bucket]) => ({
      label,
      count: bucket.count,
      composition: Array.from(bucket.compositionCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([compositionLabel, count]) => ({
          label: compositionLabel,
          count,
          share_pct: bucket.count > 0 ? Math.round((count / bucket.count) * 100) : 0,
        })),
      evidence_signals: buildPressureEvidenceSignals({
        total: bucket.count,
        machineLikeCount: bucket.machineLikeCount,
        humanLikeCount: bucket.humanLikeCount,
        protectedCount: bucket.protectedCount,
      }),
    }))

  return {
    analysis_scope: params.analysisScope,
    effective_discovery_window_days:
      params.analysisScope === 'all_indexed'
        ? 'all_indexed'
        : (scopeDays(params.analysisScope) as 7 | 30 | 60 | 90 | 180 | 365),
    cluster_count: params.clusterCount,
    cleanup_group_total_messages: totalMessages,
    cleanup_group_sender_count: senderRanking.length,
    indexed_total_rows: params.coverage.indexed_total_rows,
    indexed_inbox_rows: params.coverage.indexed_inbox_rows,
    indexed_date_span_start: params.coverage.indexed_date_span_start,
    indexed_date_span_end: params.coverage.indexed_date_span_end,
    cleanup_date_span_start:
      cleanupFirstSeenMs != null ? new Date(cleanupFirstSeenMs).toISOString() : null,
    cleanup_date_span_end:
      cleanupLastSeenMs != null ? new Date(cleanupLastSeenMs).toISOString() : null,
    top_senders: senderRanking.slice(0, 8).map((entry) => ({
      sender: entry.sender,
      sender_key: entry.sender_key,
      message_count: entry.message_count,
      share_pct: entry.share_pct,
    })),
    sender_volume_distribution: senderVolumeDistribution,
    activity_timeline: activityTimeline,
    activity_timeline_granularity: timelineGranularity,
    category_breakdown: Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([label, count]) => ({ label, count })),
    human_vs_automation: Array.from(humanAutomationCounts.entries()).map(([label, count]) => ({
      label,
      count,
      exactness: 'inferred' as const,
    })),
    sender_ranking: senderRanking,
    source: 'gmail_index_cache',
  }
}

function mailboxIntelligenceProtectionLabel(row: GmailMailboxIndexRow): string | null {
  if (row.is_starred) return 'Starred messages present'
  if (row.is_important) return 'Important messages present'
  if (rowCategoryHas(row, 'CATEGORY_PRIMARY')) return 'Primary-category evidence present'
  return null
}

function mailboxIntelligenceTopCategorySummary(rows: GmailMailboxIndexRow[]): string {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const label = rowCategoryHas(row, 'CATEGORY_PROMOTIONS')
      ? 'Promotions'
      : rowCategoryHas(row, 'CATEGORY_SOCIAL')
        ? 'Social'
        : rowCategoryHas(row, 'CATEGORY_UPDATES')
          ? 'Updates'
          : rowCategoryHas(row, 'CATEGORY_FORUMS')
            ? 'Forums'
            : rowCategoryHas(row, 'CATEGORY_PRIMARY')
              ? 'Primary'
              : classifySenderPatternFromSubject(row.subject)
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join(' · ')
}

function senderWorkspaceCanonicalCategoryProfile(
  signal: GmailSenderIndexSignal | undefined
): ReturnType<typeof insufficientDataCanonicalSenderProfile> {
  if (!signal) return insufficientDataCanonicalSenderProfile()
  return buildCanonicalSenderCategorySummary({
    category_distribution: signal.category_distribution,
    categorized_message_count: signal.categorized_message_count,
    uncategorized_message_count: signal.uncategorized_message_count,
    multi_category_message_count: signal.multi_category_message_count,
    dominant_category: signal.dominant_category,
    dominant_category_confidence: signal.dominant_category_confidence,
    category_profile_mode: signal.category_profile_mode,
  })
}

function senderWorkspaceOperatorProfile(
  signal: GmailSenderIndexSignal | undefined
): GmailSenderOperatorProfile {
  if (!signal) return insufficientDataOperatorProfile()
  return {
    operator_profile_family: signal.operator_profile_family,
    operator_profile_mode: signal.operator_profile_mode,
    operator_profile_confidence: signal.operator_profile_confidence,
    operator_profile_summary: signal.operator_profile_summary,
    operator_profile_reasons: Array.isArray(signal.operator_profile_reasons)
      ? signal.operator_profile_reasons
      : [],
    operator_profile_source: signal.operator_profile_source,
  }
}

function buildMailboxIntelligenceSenderRanking(params: {
  scopedRows: GmailMailboxIndexRow[]
  candidateRows: GmailMailboxIndexRow[]
  cleanupDecisionBySenderKey?: ReadonlyMap<
    string,
    ReturnType<typeof assignSenderCleanupGroupDecision>
  >
}): GmailMailboxIntelligenceData['sender_ranking'] {
  const nowMs = Date.now()
  const senderMap = new Map<
    string,
    {
      sender: string
      total: number
      candidate: number
      protected: number
      unread: number
      firstSeen: number | null
      lastSeen: number | null
      rows: GmailMailboxIndexRow[]
    }
  >()

  for (const row of params.scopedRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current =
      senderMap.get(senderKey) || {
        sender,
        total: 0,
        candidate: 0,
        protected: 0,
        unread: 0,
        firstSeen: null,
        lastSeen: null,
        rows: [],
      }

    current.total += 1
    if (row.is_unread) current.unread += 1
    if (mailboxIntelligenceProtectionLabel(row)) current.protected += 1
    current.rows.push(row)
    if (typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)) {
      current.firstSeen =
        current.firstSeen == null ? row.internal_date_ms : Math.min(current.firstSeen, row.internal_date_ms)
      current.lastSeen =
        current.lastSeen == null ? row.internal_date_ms : Math.max(current.lastSeen, row.internal_date_ms)
    }
    senderMap.set(senderKey, current)
  }

  for (const row of params.candidateRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = senderMap.get(senderKey)
    if (current) current.candidate += 1
  }

  return Array.from(senderMap.entries())
    .map(([senderKey, entry]) => {
      const assignment = assignSenderCleanupGroupDecision({
        sender: entry.sender,
        rows: entry.rows,
        nowMs,
      })
      return {
        sender: entry.sender,
        sender_key: senderKey,
        assigned_cleanup_group_id: assignment.groupSpec
          .cluster_id as GmailMailboxIntelligenceData['sender_ranking'][number]['assigned_cleanup_group_id'],
        assignment_reason: assignment.assignmentReason,
        is_cleanup_candidate: assignment.isCleanupCandidate,
        total_message_count: entry.total,
        cleanup_candidate_message_count: entry.candidate,
        protected_message_count: entry.protected,
        unread_count: entry.unread,
        first_seen: entry.firstSeen != null ? new Date(entry.firstSeen).toISOString() : null,
        last_seen: entry.lastSeen != null ? new Date(entry.lastSeen).toISOString() : null,
        category_summary: mailboxIntelligenceTopCategorySummary(entry.rows) || 'General updates',
        sender_signal: senderSignalFromText({
          sender: entry.sender,
          sampleText: `${entry.sender} ${entry.rows.find((row) => row.subject)?.subject || ''}`,
        }),
        cleanup_exclusion_reason: assignment.exclusionReason,
      }
    })
    .sort(
      (a, b) =>
        b.cleanup_candidate_message_count - a.cleanup_candidate_message_count ||
        b.total_message_count - a.total_message_count ||
        a.sender.localeCompare(b.sender)
    )
}

function buildMailboxIntelligenceScopeLadder(params: {
  wholeMailbox: number
  cleanupCandidate: number
  cleanupGroup: number
  senderSet: number
  loadedPreviewRows: number
}): GmailMailboxIntelligenceData['scope_ladder'] {
  return {
    whole_mailbox: params.wholeMailbox,
    cleanup_candidate_universe: params.cleanupCandidate,
    cleanup_group: params.cleanupGroup,
    sender_set: params.senderSet,
    loaded_preview_rows: params.loadedPreviewRows,
  }
}

function safePressureTrendSeedTimeZone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return resolved && resolved.trim() ? resolved.trim() : 'UTC'
  } catch {
    return 'UTC'
  }
}

function pressureTrendSeedDateInputFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function pressureTrendSeedDateInputValueFromDate(date: Date, timeZone: string): string {
  const parts = pressureTrendSeedDateInputFormatter(timeZone).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '0000'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function defaultPressureTrendSeedSelection(params: {
  analysisScope: GmailAnalysisScope
  timeZone: string
}): {
  window: GmailPressureTrendWindow
  start: string | null
  end: string | null
} {
  const now = new Date()
  if (params.analysisScope === '365d') {
    return { window: 'last_year', start: null, end: null }
  }
  if (params.analysisScope === '90d') {
    return { window: 'last_quarter', start: null, end: null }
  }
  if (params.analysisScope === '30d') {
    return { window: 'last_month', start: null, end: null }
  }
  if (params.analysisScope === '7d') {
    return { window: 'last_week', start: null, end: null }
  }
  if (params.analysisScope === '60d' || params.analysisScope === '180d') {
    const days = params.analysisScope === '60d' ? 60 : 180
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return {
      window: 'custom',
      start: pressureTrendSeedDateInputValueFromDate(start, params.timeZone),
      end: pressureTrendSeedDateInputValueFromDate(now, params.timeZone),
    }
  }
  return { window: 'all_indexed', start: null, end: null }
}

function buildSemanticClusterSendersFromRows(
  rows: GmailMailboxIndexRow[]
): Array<{
  sender: string
  sender_key: string
  semantic_family: GmailSenderWorkspaceData['senders'][number]['semantic_family']
  semantic_pattern: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']
}> {
  const rowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of rows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = rowsBySenderKey.get(senderKey) || []
    current.push(row)
    rowsBySenderKey.set(senderKey, current)
  }

  return Array.from(rowsBySenderKey.entries()).map(([senderKey, senderRows]) => {
    const sender = rowSender(senderRows[0]) || 'Unknown sender'
    const categoryCounts = new Map<GmailCanonicalSenderCategoryLabel, number>()
    const patternCounts = new Map<string, number>()
    let multiCategoryMessageCount = 0

    for (const row of senderRows) {
      const category = resolveCanonicalSenderCategoryFromLabels(row.category_labels)
      categoryCounts.set(category.label, (categoryCounts.get(category.label) || 0) + 1)
      if (category.recognized_labels.length > 1) multiCategoryMessageCount += 1
      const pattern = classifySenderPatternFromSubjectText(row.subject)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    }

    const categoryProfile = buildCanonicalSenderCategorySummary(
      buildCanonicalSenderCategoryProfile({
        totalMessageCount: senderRows.length,
        categoryCounts,
        multiCategoryMessageCount,
      })
    )
    const patternProfile = buildPatternMixFromCounts({
      patternCounts,
      totalMessageCount: senderRows.length,
    })
    const semantic = resolveSenderSemanticsFromCompatibility({
      sender,
      subjectHints: senderRows.map((row) => row.subject || ''),
      totalMessageCount: senderRows.length,
      categoryProfile,
      patternMix: patternProfile.pattern_mix,
      dominantPattern: patternProfile.dominant_pattern,
      operatorProfile: insufficientDataOperatorProfile(),
      machineProbability: null,
      humanProbability: null,
      sourceKind: 'sender_stats',
    })

    return {
      sender,
      sender_key: senderKey,
      semantic_family: semantic.semantic_family,
      semantic_pattern: semantic.semantic_pattern,
    }
  })
}

function buildMailboxIntelligenceSnapshot(params: {
  analysisScope: GmailAnalysisScope
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  scopedRows: GmailMailboxIndexRow[]
  scopedRowsSortedDesc?: boolean
  candidateRowsByCluster: ReadonlyMap<string, GmailMailboxIndexRow[]>
  cleanupDecisionBySenderKey?: ReadonlyMap<
    string,
    ReturnType<typeof assignSenderCleanupGroupDecision>
  >
  clusters: GmailCleanupCluster[]
}): GmailMailboxIntelligenceData {
  const candidateRowIds = new Set<string>()
  for (const cluster of params.clusters) {
    const rows = params.candidateRowsByCluster.get(cluster.cluster_id) || []
    for (const row of rows) candidateRowIds.add(row.message_id)
  }

  const candidateRowsBase = params.scopedRows.filter((row) => candidateRowIds.has(row.message_id))
  const candidateRows = params.scopedRowsSortedDesc
    ? candidateRowsBase
    : candidateRowsBase
        .slice()
        .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))

  const wholeMailbox = buildCleanupGroupIntelligence({
    rows: params.scopedRows,
    rowsSortedDesc: params.scopedRowsSortedDesc,
    coverage: params.coverage,
    analysisScope: params.analysisScope,
    clusterCount: params.clusters.length,
  })
  const cleanupCandidateUniverse = buildCleanupGroupIntelligence({
    rows: candidateRows,
    rowsSortedDesc: true,
    coverage: params.coverage,
    analysisScope: params.analysisScope,
    clusterCount: params.clusters.length,
  })

  let protectedMessageCount = 0
  let likelyHumanMessageCount = 0
  let cautionCandidateMessageCount = 0
  let lowRiskCandidateMessageCount = 0
  const protectedSenderSet = new Set<string>()
  const humanSenderSet = new Set<string>()

  for (const row of params.scopedRows) {
    const senderKey = normalizeSender(rowSender(row) || '')
    const protectedLabel = mailboxIntelligenceProtectionLabel(row)
    if (protectedLabel) {
      protectedMessageCount += 1
      if (senderKey) protectedSenderSet.add(senderKey)
    }
    if (isLikelyHumanPriorityRow(row)) {
      likelyHumanMessageCount += 1
      if (senderKey) humanSenderSet.add(senderKey)
    }
  }

  for (const row of candidateRows) {
    if (mailboxIntelligenceProtectionLabel(row)) cautionCandidateMessageCount += 1
    else lowRiskCandidateMessageCount += 1
  }

  const cleanupGroups = params.clusters
    .map((cluster) => {
      const rows = params.candidateRowsByCluster.get(cluster.cluster_id) || []
      const senderCounts = new Map<string, number>()

      for (const row of rows) {
        const sender = rowSender(row) || 'Unknown sender'
        senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
      }

      const semanticSenders = buildSemanticClusterSendersFromRows(rows)
      const semanticAnalytics = buildSemanticAnalyticsDistributions(semanticSenders)
      const dominantSender =
        Array.from(senderCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
      const semanticArtifactFields = buildPersistedSemanticRollupArtifactFields({
        clusterId: cluster.cluster_id,
        senderCount: new Set(rows.map((row) => normalizeSender(rowSender(row) || ''))).size,
        messageCount: rows.length,
        semanticAnalytics,
      })

      return {
        cluster_id: cluster.cluster_id,
        cluster_type: cluster.cluster_type,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.why_selected || 'Grouped by shared sender behavior.',
        risk_note: cluster.risk_note || 'Review for mixed-content senders before archive.',
        safety_note: cluster.safety_note || 'Sender-first review keeps protected traffic visible.',
        message_count: rows.length,
        sender_count: semanticArtifactFields.semantic_rollup.sender_basis.sender_count,
        share_pct: candidateRows.length > 0 ? Math.round((rows.length / candidateRows.length) * 100) : 0,
        dominant_sender: dominantSender,
        dominant_semantic_family: semanticArtifactFields.dominant_semantic_family,
        dominant_semantic_pattern: semanticArtifactFields.dominant_semantic_pattern,
        dominant_pattern: dominantPatternCompatibilityLabel(
          semanticArtifactFields.semantic_pattern_distribution[0] || null
        ),
        protected_message_count: rows.filter((row) => mailboxIntelligenceProtectionLabel(row)).length,
        uncertain_sender_count: semanticArtifactFields.uncertain_sender_count,
        semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
        semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
        semantic_rollup: semanticArtifactFields.semantic_rollup,
        semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
        semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
        semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
        semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
        semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
        semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      }
    })
    .sort((a, b) => b.message_count - a.message_count || a.title.localeCompare(b.title))

  const pressureTrendSeedTimeZone = safePressureTrendSeedTimeZone()
  const pressureTrendSeedSelection = defaultPressureTrendSeedSelection({
    analysisScope: params.analysisScope,
    timeZone: pressureTrendSeedTimeZone,
  })
  const initialPressureTrend = (() => {
    const trend = buildGmailPressureTrendData({
      rows: candidateRows,
      coverage: params.coverage,
      pressureWindow: pressureTrendSeedSelection.window,
      pressureStart: pressureTrendSeedSelection.start,
      pressureEnd: pressureTrendSeedSelection.end,
      timeZone: pressureTrendSeedTimeZone,
    })
    return trend.ok ? trend.data : null
  })()

  return {
    analysis_scope: params.analysisScope,
    scope_ladder: buildMailboxIntelligenceScopeLadder({
      wholeMailbox: params.coverage.indexed_total_rows,
      cleanupCandidate: candidateRows.length,
      cleanupGroup: 0,
      senderSet: wholeMailbox.sender_ranking.length,
      loadedPreviewRows: Math.min(25, wholeMailbox.sender_ranking.length),
    }),
    whole_mailbox: {
      message_count: params.coverage.indexed_total_rows,
      sender_count: wholeMailbox.sender_ranking.length,
      indexed_inbox_rows: params.coverage.indexed_inbox_rows,
      indexed_date_span_start: params.coverage.indexed_date_span_start,
      indexed_date_span_end: params.coverage.indexed_date_span_end,
      top_senders: wholeMailbox.top_senders,
      sender_volume_distribution: wholeMailbox.sender_volume_distribution,
      activity_timeline: wholeMailbox.activity_timeline,
      activity_timeline_granularity: wholeMailbox.activity_timeline_granularity,
      category_breakdown: wholeMailbox.category_breakdown,
      human_vs_automation: wholeMailbox.human_vs_automation,
    },
    cleanup_candidate_universe: {
      message_count: cleanupCandidateUniverse.cleanup_group_total_messages,
      sender_count: cleanupCandidateUniverse.cleanup_group_sender_count,
      cleanup_date_span_start: cleanupCandidateUniverse.cleanup_date_span_start,
      cleanup_date_span_end: cleanupCandidateUniverse.cleanup_date_span_end,
      top_senders: cleanupCandidateUniverse.top_senders,
      sender_volume_distribution: cleanupCandidateUniverse.sender_volume_distribution,
      activity_timeline: cleanupCandidateUniverse.activity_timeline,
      activity_timeline_granularity: cleanupCandidateUniverse.activity_timeline_granularity,
      category_breakdown: cleanupCandidateUniverse.category_breakdown,
      human_vs_automation: cleanupCandidateUniverse.human_vs_automation,
    },
    protected_safe_context: {
      protected_message_count: protectedMessageCount,
      protected_sender_count: protectedSenderSet.size,
      likely_human_message_count: likelyHumanMessageCount,
      likely_human_sender_count: humanSenderSet.size,
      caution_candidate_message_count: cautionCandidateMessageCount,
      low_risk_candidate_message_count: lowRiskCandidateMessageCount,
      summary:
        cautionCandidateMessageCount > 0
          ? `${cautionCandidateMessageCount.toLocaleString()} candidate messages still show protection signals and should funnel through Exceptions before archive.`
          : 'Current cleanup candidates are mostly low-risk machine-like traffic.',
    },
    cleanup_groups: cleanupGroups,
    sender_ranking: buildMailboxIntelligenceSenderRanking({
      scopedRows: params.scopedRows,
      candidateRows,
      cleanupDecisionBySenderKey: params.cleanupDecisionBySenderKey,
    }),
    initial_pressure_trend: initialPressureTrend,
    source: 'gmail_index_cache',
  }
}

function buildSenderWorkspaceScopeLadder(params: {
  wholeMailbox: number
  cleanupCandidate: number
  cleanupGroup: number
  senderSet: number
  loadedPreviewRows: number
}): GmailSenderWorkspaceData['scope_ladder'] {
  return {
    whole_mailbox: params.wholeMailbox,
    cleanup_candidate_universe: params.cleanupCandidate,
    cleanup_group: params.cleanupGroup,
    sender_set: params.senderSet,
    loaded_preview_rows: params.loadedPreviewRows,
  }
}

function senderWorkspaceSenderDomainFromString(sender: string): string | null {
  const normalized = normalizeSender(sender)
  const at = normalized.indexOf('@')
  if (at <= 0 || at >= normalized.length - 1) return null
  return normalized.slice(at + 1)
}

function buildSenderWorkspacePreviewMessages(
  rows: GmailMailboxIndexRow[],
  previewLimit = 5
): GmailSenderWorkspaceData['senders'][number]['preview_messages'] {
  return rows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    .slice(0, Math.min(Math.max(previewLimit, 1), 8))
    .map((row) => ({
      message_id: row.message_id,
      thread_id: row.thread_id || undefined,
      internal_date_ms: row.internal_date_ms || undefined,
      subject: row.subject,
      from: row.sender,
      date: row.date,
      snippet: null,
      label_ids: row.label_ids,
      category_labels: row.category_labels,
      is_in_inbox: row.is_in_inbox,
      is_unread: row.is_unread,
      is_important: row.is_important,
      is_starred: row.is_starred,
    }))
}

function primarySenderWorkspaceCategory(summary: string): string {
  const head = summary.split('·')[0]?.trim() || ''
  const cleaned = head.replace(/\(\d+\)\s*$/, '').trim()
  return cleaned || 'Other'
}

function buildSenderWorkspaceActivityTimeline(params: {
  senders: GmailSenderWorkspaceData['senders']
  analysisScope: GmailAnalysisScope
}): {
  items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
  granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
} {
  const granularity = activityTimelineGranularityForScope(params.analysisScope)
  const counts = new Map<string, number>()

  for (const sender of params.senders) {
    const lastSeenMs =
      typeof sender.last_activity === 'string' && sender.last_activity.trim()
        ? Date.parse(sender.last_activity)
        : Number.NaN
    if (!Number.isFinite(lastSeenMs)) continue
    const label = activityTimelineBucketKeyForTimestamp(lastSeenMs, granularity)
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  return {
    items: Array.from(counts.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(-8)
      .map(([label, senderCount]) => ({ label, sender_count: senderCount })),
    granularity,
  }
}

function buildSenderWorkspaceCategoryDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['sender_category_distribution'] {
  const counts = new Map<string, number>()
  for (const sender of senders) {
    const label = primarySenderWorkspaceCategory(sender.category_summary)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([label, senderCount]) => ({ label, sender_count: senderCount }))
}

function buildSenderWorkspaceClusterContribution(params: {
  senders: GmailSenderWorkspaceData['senders']
  clusterMessageCount: number
}): GmailSenderWorkspaceData['analytics']['cluster_contribution'] {
  return params.senders
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
        params.clusterMessageCount > 0
          ? Math.round((sender.cleanup_group_message_count / params.clusterMessageCount) * 100)
          : 0,
    }))
}

function buildSenderWorkspaceAttributeDistribution(params: {
  senders: GmailSenderWorkspaceData['senders']
  valueForSender: (sender: GmailSenderWorkspaceData['senders'][number]) => string | null | undefined
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

function buildSenderWorkspaceOperatorProfileFamilyDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['operator_profile_family_distribution'] {
  return buildCompatibilityOperatorProfileFamilyDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_family_distribution
  )
}

function buildSenderWorkspaceDominantPatternDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['dominant_pattern_distribution'] {
  return buildCompatibilityDominantPatternDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_pattern_distribution
  )
}

function buildSenderWorkspaceOperatorProfileModeDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'] {
  return buildCompatibilityOperatorProfileModeDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_resolution_distribution
  )
}

function buildSenderWorkspaceCategorySummarySourceDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['category_summary_source_distribution'] {
  return buildSenderWorkspaceAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.category_summary_source,
  }).map(({ label, sender_count, share_pct }) => ({
    source: label as GmailSenderWorkspaceData['senders'][number]['category_summary_source'],
    sender_count,
    share_pct,
  }))
}

async function buildSenderOverviewSnapshotForCluster(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  cleanupCandidateMessageCount: number
  cluster: GmailCleanupCluster
  selectedClusterRows: GmailMailboxIndexRow[]
}): Promise<GmailSenderWorkspaceData> {
  const selectedClusterRows = params.selectedClusterRows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
  const rowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of selectedClusterRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = rowsBySenderKey.get(senderKey) || []
    current.push(row)
    rowsBySenderKey.set(senderKey, current)
  }

  const senderBreakdown = buildQueryClusterBrowserSenderBreakdown({
    rows: selectedClusterRows,
    cleanupGroupRows: selectedClusterRows,
    previewLimit: 5,
    includePreviewMessages: false,
  })

  const senderSignals = await loadGmailSenderIndexSignalsForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    senders: senderBreakdown.map((entry) => entry.sender),
    queryMode: 'sender_page',
  })
  const signalBySender = new Map(
    (senderSignals.ok ? senderSignals.data.senders : []).map((entry) => [
      normalizeSender(entry.sender),
      entry,
    ])
  )
  const previewRowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const entry of senderBreakdown) {
    const senderRows = rowsBySenderKey.get(entry.sender_key) || []
    const previewRows = senderRows
      .slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
      .slice(0, 5)
    previewRowsBySenderKey.set(entry.sender_key, previewRows)
  }

  const allSenders = senderBreakdown.map((entry) => {
    const signal = signalBySender.get(entry.sender_key)
    const categoryProfile = senderWorkspaceCanonicalCategoryProfile(signal)
    const operatorProfile = senderWorkspaceOperatorProfile(signal)
    const persistedPatternMix = normalizePatternMix(signal?.pattern_mix)
    const dominantPattern =
      persistedPatternMix.length > 0
        ? signal?.dominant_pattern ||
          persistedPatternMix[0]?.pattern ||
          entry.dominant_pattern ||
          GMAIL_PATTERN_LABEL_THIN_HISTORY
        : entry.dominant_pattern || GMAIL_PATTERN_LABEL_THIN_HISTORY
    const semantic =
      signal != null
        ? {
            semantic_family: signal.semantic_family,
            semantic_pattern: signal.semantic_pattern,
          }
        : resolveSenderSemanticsFromCompatibility({
            sender: entry.sender,
            subjectHints: entry.preview_messages.map((message) => message.subject || ''),
            totalMessageCount: entry.cleanup_group_message_count,
            categoryProfile,
            patternMix: persistedPatternMix,
            dominantPattern,
            operatorProfile,
            machineProbability: null,
            humanProbability: null,
            sourceKind: 'sender_stats',
          })
    const verificationReasons: string[] = []
    if (entry.batch_protected_count > 0) verificationReasons.push('Protected message evidence')
    if (entry.preview_messages.some((message) => (message.category_labels || []).length > 1)) {
      verificationReasons.push('Mixed category evidence')
    }
    if ((signal?.human_probability || 0) >= 0.45) verificationReasons.push('Human-like history')
    if ((signal?.machine_probability || 0) >= 0.45 && (signal?.human_probability || 0) >= 0.3) {
      verificationReasons.push('Mixed sender behavior')
    }
    if (entry.batch_important_count > 0 || entry.batch_starred_count > 0) {
      verificationReasons.push('Important or starred activity')
    }

    const senderRows = rowsBySenderKey.get(entry.sender_key) || []
    const senderRow = senderRows[0]

    return {
      sender: entry.sender,
      sender_key: entry.sender_key,
      sender_domain:
        (senderRow ? rowSenderDomain(senderRow) : null) ||
        senderWorkspaceSenderDomainFromString(entry.sender),
      cleanup_group_message_count: entry.cleanup_group_message_count,
      total_sender_messages: signal?.message_count_indexed ?? null,
      unread_count: entry.batch_unread_count,
      last_activity: signal?.last_seen || entry.batch_last_seen,
      first_seen: signal?.first_seen || entry.batch_first_seen,
      category_distribution: categoryProfile.category_distribution,
      categorized_message_count: categoryProfile.categorized_message_count,
      uncategorized_message_count: categoryProfile.uncategorized_message_count,
      multi_category_message_count: categoryProfile.multi_category_message_count,
      dominant_category: categoryProfile.dominant_category,
      dominant_category_confidence: categoryProfile.dominant_category_confidence,
      category_profile_mode: categoryProfile.category_profile_mode,
      category_summary: categoryProfile.category_summary,
      category_summary_source: categoryProfile.category_summary_source,
      semantic_family: semantic.semantic_family,
      semantic_pattern: semantic.semantic_pattern,
      dominant_pattern: dominantPattern,
      pattern_mix: persistedPatternMix,
      operator_profile_family: operatorProfile.operator_profile_family,
      operator_profile_mode: operatorProfile.operator_profile_mode,
      operator_profile_confidence: operatorProfile.operator_profile_confidence,
      operator_profile_summary: operatorProfile.operator_profile_summary,
      operator_profile_reasons: operatorProfile.operator_profile_reasons,
      operator_profile_source: operatorProfile.operator_profile_source,
      sender_signal:
        signal?.machine_probability != null || signal?.human_probability != null
          ? (signal.human_probability || 0) >= 0.65
            ? 'likely_human'
            : (signal.machine_probability || 0) >= 0.65
              ? 'likely_machine_generated'
              : 'uncertain'
          : senderSignalFromText({
              sender: entry.sender,
              sampleText: `${entry.sender} ${entry.preview_messages
                .map((message) => message.subject || '')
                .join(' ')}`,
            }),
      machine_probability: signal?.machine_probability ?? null,
      human_probability: signal?.human_probability ?? null,
      protected_hint:
        entry.batch_protected_count > 0 ? 'Protected message evidence present' : null,
      requires_verification: verificationReasons.length > 0,
      verification_reasons: verificationReasons,
      preview_messages: buildSenderWorkspacePreviewMessages(
        previewRowsBySenderKey.get(entry.sender_key) || senderRows,
        5
      ),
      learned_policy: null,
    }
  })

  const filteredSenders = allSenders.slice()
  filteredSenders.sort((left, right) => {
    let delta = left.cleanup_group_message_count - right.cleanup_group_message_count
    if (delta === 0) delta = left.sender.localeCompare(right.sender)
    return delta * -1
  })

  const totalSenders = filteredSenders.length
  const totalPages = Math.max(1, Math.ceil(totalSenders / SENDER_OVERVIEW_DEFAULT_PAGE_SIZE))
  const senders = filteredSenders.slice(0, SENDER_OVERVIEW_DEFAULT_PAGE_SIZE)
  const senderActivityTimeline = buildSenderWorkspaceActivityTimeline({
    senders: allSenders,
    analysisScope: params.analysisScope,
  })
  const semanticAnalytics = buildSemanticAnalyticsDistributions(allSenders)
  const semanticArtifactFields = buildPersistedSemanticRollupArtifactFields({
    clusterId: params.cluster.cluster_id,
    senderCount: allSenders.length,
    messageCount: selectedClusterRows.length,
    semanticAnalytics,
  })

  return {
    analysis_scope: params.analysisScope,
    scope_ladder: buildSenderWorkspaceScopeLadder({
      wholeMailbox: params.coverage.indexed_total_rows,
      cleanupCandidate: params.cleanupCandidateMessageCount,
      cleanupGroup: selectedClusterRows.length,
      senderSet: filteredSenders.length,
      loadedPreviewRows: senders.reduce((sum, sender) => sum + sender.preview_messages.length, 0),
    }),
    selected_cluster: {
      cluster_id: params.cluster.cluster_id,
      cluster_type: params.cluster.cluster_type,
      title: params.cluster.title,
      query: params.cluster.query,
      why_selected: params.cluster.why_selected || 'Chosen from Cleanup Groups.',
      risk_note: params.cluster.risk_note || 'Confirm mixed senders before archive.',
      safety_note:
        params.cluster.safety_note ||
        'Messages remain in All Mail; only INBOX changes after approval.',
      message_count: selectedClusterRows.length,
      sender_count: allSenders.length,
      share_pct:
        params.cleanupCandidateMessageCount > 0
          ? Math.round((selectedClusterRows.length / params.cleanupCandidateMessageCount) * 100)
          : 0,
    },
    senders,
    pagination: {
      page: SENDER_OVERVIEW_DEFAULT_PAGE,
      page_size: SENDER_OVERVIEW_DEFAULT_PAGE_SIZE,
      total_senders: totalSenders,
      total_pages: totalPages,
      cluster_total_senders: allSenders.length,
    },
    cluster_global: {
      sender_keys: allSenders.map((sender) => sender.sender_key),
      sender_keys_complete: true,
    },
    analytics: {
      sender_category_distribution: buildSenderWorkspaceCategoryDistribution(allSenders),
      semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
      semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
      semantic_rollup: semanticArtifactFields.semantic_rollup,
      semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
      semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
      semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
      semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
      semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
      semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      operator_profile_family_distribution: buildCompatibilityOperatorProfileFamilyDistribution(
        semanticArtifactFields.semantic_family_distribution
      ),
      dominant_pattern_distribution: buildCompatibilityDominantPatternDistribution(
        semanticArtifactFields.semantic_pattern_distribution
      ),
      operator_profile_mode_distribution: buildCompatibilityOperatorProfileModeDistribution(
        semanticArtifactFields.semantic_resolution_distribution
      ),
      category_summary_source_distribution: buildSenderWorkspaceCategorySummarySourceDistribution(allSenders),
      sender_activity_timeline: senderActivityTimeline.items,
      sender_activity_timeline_granularity: senderActivityTimeline.granularity,
      cluster_contribution: buildSenderWorkspaceClusterContribution({
        senders: allSenders,
        clusterMessageCount: selectedClusterRows.length,
      }),
    },
    view: {
      search: '',
      filter: 'all',
      sort: 'message_count',
      direction: 'desc',
    },
    exceptions_count: allSenders.filter((sender) => sender.requires_verification).length,
    source: 'gmail_index_cache',
  }
}

async function buildSenderOverviewSnapshot(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  clusters: GmailCleanupCluster[]
  selectedClusterRowsByCluster: ReadonlyMap<string, GmailMailboxIndexRow[]>
}): Promise<Record<string, GmailSenderWorkspaceData>> {
  const candidateRowMap = new Map<string, GmailMailboxIndexRow>()
  for (const cluster of params.clusters) {
    const rows = params.selectedClusterRowsByCluster.get(cluster.cluster_id) || []
    for (const row of rows) candidateRowMap.set(row.message_id, row)
  }
  const cleanupCandidateMessageCount = candidateRowMap.size

  const workspaces = await Promise.all(
    params.clusters.map(async (cluster) => [
      cluster.cluster_id,
      await buildSenderOverviewSnapshotForCluster({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: params.analysisScope,
        coverage: params.coverage,
        cleanupCandidateMessageCount,
        cluster,
        selectedClusterRows: params.selectedClusterRowsByCluster.get(cluster.cluster_id) || [],
      }),
    ])
  )

  return Object.fromEntries(workspaces)
}

function summarizeCategoryMix(rows: GmailMailboxIndexRow[]): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const category of row.category_labels || []) {
      if (!category) continue
      counts.set(category, (counts.get(category) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }))
}

function cleanupGroupIntelligenceCacheKey(params: {
  tenantId: string
  analysisScope: GmailAnalysisScope
  clusters: Array<{
    cluster_id: string
    cluster_type: string
    title: string
    query: string
  }>
}): string {
  return [
    params.tenantId.trim(),
    params.analysisScope,
    ...params.clusters
      .map((cluster) =>
        [cluster.cluster_id, cluster.cluster_type, cluster.title, cluster.query].join('::')
      )
      .sort(),
  ].join('|||')
}

function computeIndexedWindowSignals(params: {
  rows: GmailMailboxIndexRow[]
  nowMs: number
}): NonNullable<GmailCleanupCluster['indexed_signal_window']> {
  const last30Threshold = params.nowMs - 30 * 24 * 60 * 60 * 1000
  const last90Threshold = params.nowMs - 90 * 24 * 60 * 60 * 1000
  const last180Threshold = params.nowMs - 180 * 24 * 60 * 60 * 1000

  let countLast30d = 0
  let countLast90d = 0
  let countLast180d = 0
  let unreadCount = 0
  let importantCount = 0
  let starredCount = 0
  let inInboxCount = 0
  let firstSeenMs: number | null = null
  let lastSeenMs: number | null = null

  for (const row of params.rows) {
    if (row.is_unread) unreadCount += 1
    if (row.is_important) importantCount += 1
    if (row.is_starred) starredCount += 1
    if (row.is_in_inbox) inInboxCount += 1
    const dateMs =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (dateMs == null) continue
    if (dateMs >= last30Threshold) countLast30d += 1
    if (dateMs >= last90Threshold) countLast90d += 1
    if (dateMs >= last180Threshold) countLast180d += 1
    if (firstSeenMs == null || dateMs < firstSeenMs) firstSeenMs = dateMs
    if (lastSeenMs == null || dateMs > lastSeenMs) lastSeenMs = dateMs
  }

  return {
    count_last_30d: countLast30d,
    count_last_90d: countLast90d,
    count_last_180d: countLast180d,
    count_total_indexed: params.rows.length,
    unread_count: unreadCount,
    important_count: importantCount,
    starred_count: starredCount,
    in_inbox_count: inInboxCount,
    category_mix: summarizeCategoryMix(params.rows),
    first_seen_at: firstSeenMs != null ? new Date(firstSeenMs).toISOString() : null,
    last_seen_at: lastSeenMs != null ? new Date(lastSeenMs).toISOString() : null,
    exactness: 'indexed_exact',
  }
}

function fallbackLowValueClusterSpecs(params: {
  inboxRows: GmailMailboxIndexRow[]
  nowMs: number
  topSenders?: string[]
}): Array<{
  cluster_id: string
  cluster_type: GmailCleanupClusterType
  title: string
  query: string
  why_selected: string
  risk_note: string
  rows: GmailMailboxIndexRow[]
}> {
  const clusters: Array<{
    cluster_id: string
    cluster_type: GmailCleanupClusterType
    title: string
    query: string
    why_selected: string
    risk_note: string
    rows: GmailMailboxIndexRow[]
  }> = []

  const pushIfEnough = (cluster: {
    cluster_id: string
    cluster_type: GmailCleanupClusterType
    title: string
    query: string
    why_selected: string
    risk_note: string
    rows: GmailMailboxIndexRow[]
  }) => {
    if (cluster.rows.length < 3) return
    clusters.push(cluster)
  }

  const senderBuckets = new Map<string, { sender: string; rows: GmailMailboxIndexRow[] }>()
  for (const row of params.inboxRows) {
    const sender = row.sender || ''
    const senderKey = normalizeSender(sender)
    if (!senderKey) continue
    const current = senderBuckets.get(senderKey) || { sender, rows: [] }
    current.rows.push(row)
    senderBuckets.set(senderKey, current)
  }

  const senderCandidates = Array.from(senderBuckets.values())
    .filter((entry) => {
      const safeRows = entry.rows.filter(
        (row) =>
          !row.is_starred &&
          !row.is_important &&
          !rowCategoryHas(row, 'CATEGORY_PRIMARY')
      )
      return safeRows.length >= 3
    })
    .sort((a, b) => b.rows.length - a.rows.length || a.sender.localeCompare(b.sender))

  for (const entry of senderCandidates.slice(0, 3)) {
    const token = senderTokenForQuery(entry.sender)
    if (!token) continue
    pushIfEnough({
      cluster_id: `sender-fallback-${clusters.length + 1}`,
      cluster_type: 'sender_cluster',
      title: `Sender cluster: ${token}`,
      query: `in:inbox from:${token} -is:starred -is:important -category:primary`,
      why_selected:
        'Fallback from indexed rows: when category groups are sparse, review one concentrated sender stream at a time.',
      risk_note: 'Medium risk; sender-level review required before any archive action.',
      rows: entry.rows,
    })
  }

  for (const sender of params.topSenders || []) {
    if (clusters.length >= 3) break
    const senderKey = normalizeSender(sender || '')
    if (!senderKey || clusters.some((cluster) => cluster.query.includes(senderKey))) continue
    const entry = senderBuckets.get(senderKey)
    if (!entry || entry.rows.length < 3) continue
    const token = senderTokenForQuery(entry.sender)
    if (!token) continue
    pushIfEnough({
      cluster_id: `sender-priority-${token}`,
      cluster_type: 'sender_cluster',
      title: `Sender cluster: ${token}`,
      query: `in:inbox from:${token} -is:starred -is:important -category:primary`,
      why_selected:
        'Includes a high-frequency sender so the workflow stays actionable even when category clusters are thin.',
      risk_note: 'Medium risk; verify mixed-priority sender traffic before archive.',
      rows: entry.rows,
    })
  }

  return clusters
}

export function matchClusterSpecFromIndex(params: {
  row: GmailMailboxIndexRow
  spec: GmailCleanupClusterSpec
  nowMs: number
}): boolean {
  const { row, spec, nowMs } = params
  const subject = rowSubject(row)
  const sender = rowSender(row)
  const inInbox = row.is_in_inbox
  const olderThan21d = isRowOlderThanDays(row, 21, nowMs)
  const olderThan120d = isRowOlderThanDays(row, 120, nowMs)
  const olderThan365d = isRowOlderThanDays(row, 365, nowMs)
  const isPrimary = rowCategoryHas(row, 'CATEGORY_PRIMARY')
  const isPromotions = rowCategoryHas(row, 'CATEGORY_PROMOTIONS')
  const isSocial = rowCategoryHas(row, 'CATEGORY_SOCIAL')
  const safeBase = inInbox && !row.is_starred && !row.is_important && !isPrimary

  if (spec.cluster_type === 'newsletters') {
    return (
      safeBase &&
      (isPromotions ||
        /\b(newsletter|digest|roundup|update|unsubscribe|manage preferences)\b/.test(subject)) &&
      !isSocial &&
      !/\b(receipt|invoice|order|shipped|delivery|tracking)\b/.test(subject)
    )
  }

  if (spec.cluster_type === 'noreply_automation') {
    return (
      safeBase &&
      (/no-?reply|donotreply|do-?not-?reply|mailer-daemon/.test(sender) ||
        /\b(notification|automated|alert)\b/.test(subject)) &&
      !/\b(newsletter|digest|promo|promotion|order|shipped|delivery|tracking)\b/.test(subject) &&
      !isPromotions &&
      !isSocial
    )
  }

  if (spec.cluster_type === 'shopping_updates') {
    return (
      safeBase &&
      /\b(order|shipped|delivery|tracking|receipt|invoice|return|refund)\b/.test(subject) &&
      !isSocial &&
      !isPromotions
    )
  }

  if (spec.cluster_type === 'social_notifications') {
    return (
      safeBase &&
      (isSocial || /\b(mentioned|follower|comment|liked|reacted|invite)\b/.test(subject)) &&
      !isPromotions
    )
  }

  if (spec.cluster_type === 'old_read_mail') {
    return inInbox && !row.is_unread && olderThan120d && !row.is_starred && !row.is_important && !isPrimary
  }

  if (spec.cluster_type === 'unread_clutter') {
    return inInbox && row.is_unread && olderThan21d && !row.is_starred && !row.is_important && !isPrimary
  }

  if (spec.cluster_type === 'age_cluster') {
    return inInbox && olderThan365d && !row.is_starred && !row.is_important && !isPrimary
  }

  if (spec.cluster_type === 'sender_cluster') {
    const senderToken = spec.title.replace(/^Sender cluster:\s*/i, '').trim().toLowerCase()
    return (
      safeBase &&
      !isPrimary &&
      Boolean(senderToken) &&
      sender.includes(senderToken)
    )
  }

  return false
}

function matchClusterFromIndexRow(params: {
  row: GmailMailboxIndexRow
  clusterId: string
  clusterType: string
  title: string
  query: string
  nowMs: number
}): boolean {
  const clusterId = params.clusterId.trim().toLowerCase()
  if (clusterId === 'guaranteed-inbox-review-cluster' || clusterId === 'exploratory-inbox-cluster') {
    return params.row.is_in_inbox
  }

  const spec: GmailCleanupClusterSpec = {
    cluster_id: params.clusterId,
    cluster_type: params.clusterType as GmailCleanupClusterType,
    title: params.title,
    query: params.query,
    why_selected: 'browser_match',
    risk_note: 'browser_match',
  }

  return matchClusterSpecFromIndex({
    row: params.row,
    spec,
    nowMs: params.nowMs,
  })
}

function isRowLikelyNoRecentInteraction(row: GmailMailboxIndexRow, nowMs: number): boolean {
  if (row.is_starred || row.is_important) return false
  const timestamp =
    typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
      ? row.internal_date_ms
      : row.date && Number.isFinite(Date.parse(row.date))
        ? Date.parse(row.date)
        : null
  if (timestamp == null) return true
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
  return nowMs - timestamp >= ninetyDaysMs
}

function buildDiscoveryFromIndexedRows(params: {
  indexedRows: GmailMailboxIndexRow[]
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  analysisScope: GmailAnalysisScope
  topSenders?: string[]
}): IndexedCleanupDiscoveryBuild {
  const nowMs = Date.now()
  const indexedRows = [...params.indexedRows].sort(
    (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
  )

  const selectedScopeDays = scopeDays(params.analysisScope)
  const scopedRows =
    selectedScopeDays != null
      ? indexedRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
      : indexedRows
  const inboxRows = indexedRows.filter((row) => row.is_in_inbox)
  const scopedInboxRows =
    selectedScopeDays != null ? scopedRows.filter((row) => row.is_in_inbox) : inboxRows
  const workingRows = scopedInboxRows
  const senderPatternRows = workingRows
  const recentWindowRows = workingRows

  const categoryCount = (categoryLabel: string): number =>
    recentWindowRows.filter((row) => rowCategoryHas(row, categoryLabel)).length
  const unreadRecentCount = recentWindowRows.filter((row) => row.is_unread).length
  const importantRecentCount = recentWindowRows.filter((row) => row.is_important).length
  const starredRecentCount = recentWindowRows.filter((row) => row.is_starred).length
  const machineGeneratedRecentCount = recentWindowRows.filter(isLikelyMachineGeneratedRow).length
  const humanPriorityRecentCount = recentWindowRows.filter(isLikelyHumanPriorityRow).length
  const staleUnread30d = inboxRows.filter(
    (row) => row.is_unread && isRowOlderThanDays(row, 30, nowMs)
  ).length
  const staleUnread60d = inboxRows.filter(
    (row) => row.is_unread && isRowOlderThanDays(row, 60, nowMs)
  ).length
  const staleUnread90d = inboxRows.filter(
    (row) => row.is_unread && isRowOlderThanDays(row, 90, nowMs)
  ).length

  const senderFrequencyMap = new Map<string, { sender: string; count: number }>()
  for (const row of senderPatternRows) {
    const sender = row.sender || 'unknown-sender'
    const current = senderFrequencyMap.get(sender)
    if (current) current.count += 1
    else senderFrequencyMap.set(sender, { sender, count: 1 })
  }
  const senderFrequency = Array.from(senderFrequencyMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((entry) => {
      const sampleText = `${entry.sender} ${
        recentWindowRows.find((row) => (row.sender || 'unknown-sender') === entry.sender)?.subject || ''
      }`
      return {
        sender: entry.sender,
        count: entry.count,
        signal: senderSignalFromText({ sender: entry.sender, sampleText }),
        source: 'computed_recent_window_sample' as const,
      }
    })

  const subjectPatternMap = new Map<string, number>()
  for (const row of senderPatternRows) {
    const normalized = normalizeSubjectPattern(row.subject)
    if (!normalized) continue
    subjectPatternMap.set(normalized, (subjectPatternMap.get(normalized) || 0) + 1)
  }
  const subjectPatterns = Array.from(subjectPatternMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([pattern, count]) => ({
      pattern,
      count,
      source: 'computed_recent_window_sample' as const,
    }))
  const analysisWindowLabel = params.analysisScope
  const analysisWindowDays = resolveAnalysisWindowDays(params.analysisScope)
  const profileWindowQuery =
    params.analysisScope === 'all_indexed'
      ? 'in:inbox'
      : `in:inbox newer_than:${scopeDays(params.analysisScope) || MAILBOX_PROFILE_DEFAULT_WINDOW_DAYS}d`

  const mailboxProfile: GmailMailboxProfile = {
    generated_at: new Date().toISOString(),
    analysis_window_days: analysisWindowDays,
    profile_model: 'gmail_native_signals_plus_bounded_sample.v1',
    metadata_scan_basis: {
      message_id_scan_count: indexedRows.length,
      metadata_message_count: indexedRows.length,
    },
    recommendation_confidence:
      recentWindowRows.length >= 1000 && inboxRows.length >= 5000 ? 'moderate' : 'preliminary',
    native_signal_counts: {
      inbox_recent_estimate: recentWindowRows.length,
      category_primary_estimate: categoryCount('CATEGORY_PRIMARY'),
      category_promotions_estimate: categoryCount('CATEGORY_PROMOTIONS'),
      category_social_estimate: categoryCount('CATEGORY_SOCIAL'),
      category_updates_estimate: categoryCount('CATEGORY_UPDATES'),
      category_forums_estimate: categoryCount('CATEGORY_FORUMS'),
      unread_recent_estimate: unreadRecentCount,
      important_recent_estimate: importantRecentCount,
      starred_recent_estimate: starredRecentCount,
      likely_machine_generated_recent_estimate: machineGeneratedRecentCount,
      likely_human_priority_recent_estimate: humanPriorityRecentCount,
      stale_unread_30d_estimate: staleUnread30d,
      stale_unread_60d_estimate: staleUnread60d,
      stale_unread_90d_estimate: staleUnread90d,
    },
    recurring_categories: [
      { category: 'primary', estimated_count: categoryCount('CATEGORY_PRIMARY'), source: 'gmail_native' },
      {
        category: 'promotions',
        estimated_count: categoryCount('CATEGORY_PROMOTIONS'),
        source: 'gmail_native',
      },
      { category: 'social', estimated_count: categoryCount('CATEGORY_SOCIAL'), source: 'gmail_native' },
      { category: 'updates', estimated_count: categoryCount('CATEGORY_UPDATES'), source: 'gmail_native' },
      { category: 'forums', estimated_count: categoryCount('CATEGORY_FORUMS'), source: 'gmail_native' },
    ],
    sender_frequency: senderFrequency,
    subject_patterns: subjectPatterns,
    protection_candidates: [
      {
        title: 'Likely high-priority inbox traffic',
        query: `${profileWindowQuery} (is:important OR is:starred OR category:primary)`,
        estimated_count: humanPriorityRecentCount,
        reason: 'Messages with importance/starred/primary signals should be protected first.',
        source: 'gmail_native',
      },
    ],
    cleanup_candidates: [
      {
        title: 'Newsletter / promotional inbox traffic',
        query: `${profileWindowQuery} category:promotions`,
        estimated_count: categoryCount('CATEGORY_PROMOTIONS'),
        reason: 'Promotional-category traffic is frequently low action value after bounded review.',
        source: 'gmail_native',
      },
      {
        title: 'Machine-generated notification traffic',
        query: `${profileWindowQuery} (from:noreply OR from:no-reply OR subject:(notification OR digest OR alert))`,
        estimated_count: machineGeneratedRecentCount,
        reason: 'Automation-heavy sender/subject patterns often form safe first cleanup waves.',
        source: 'gmail_native_plus_heuristic',
      },
    ],
    rule_opportunities: [
      {
        title: 'Route recurring low-value senders',
        query: `${profileWindowQuery} (category:promotions OR from:noreply)`,
        estimated_count: Math.max(machineGeneratedRecentCount, categoryCount('CATEGORY_PROMOTIONS')),
        reason: 'High-repeat low-value patterns can be converted into future Gmail filters.',
        source: 'gmail_native_plus_heuristic',
      },
    ],
    notes: [
      `Index-backed profile over up to ${indexedRows.length} locally indexed messages (cap 50,000).`,
      `Discovery source rows: ${workingRows.length} indexed inbox rows (scope: ${analysisWindowLabel}; ${inboxRows.length} total indexed inbox rows).`,
      'Counts are exact for currently indexed rows; coverage depends on mailbox index freshness.',
      'Opened/click tracking is unavailable from Gmail metadata here; engagement confidence uses available unread/starred/important patterns.',
    ],
  }

  const clusterSpecs = cleanupGroupSpecs()

  const clusters: GmailCleanupCluster[] = []
  const mailboxIntelligenceRowsByCluster = new Map<string, GmailMailboxIndexRow[]>()
  const cleanupDecisionBySenderKey = new Map<
    string,
    ReturnType<typeof assignSenderCleanupGroupDecision>
  >()
  const strictCountById = new Map(clusterSpecs.map((spec) => [spec.cluster_id, 0]))
  const fallbackClusterMatchCounts: Array<{ cluster_id: string; count: number }> = []
  const strictMatchedRowIds = new Set<string>()
  const matchedRowsByCluster = new Map(clusterSpecs.map((spec) => [spec.cluster_id, [] as GmailMailboxIndexRow[]]))
  const scopedSenderBuckets = new Map<string, { sender: string; rows: GmailMailboxIndexRow[] }>()
  for (const row of scopedRows) {
    const sender = row.sender || ''
    const senderKey = normalizeSender(sender)
    if (!senderKey) continue
    const current = scopedSenderBuckets.get(senderKey) || { sender, rows: [] }
    current.rows.push(row)
    scopedSenderBuckets.set(senderKey, current)
  }
  for (const entry of scopedSenderBuckets.values()) {
    const senderKey = normalizeSender(entry.sender)
    const cleanupDecision = assignSenderCleanupGroupDecision({
      sender: entry.sender,
      rows: entry.rows,
      nowMs,
    })
    if (senderKey) cleanupDecisionBySenderKey.set(senderKey, cleanupDecision)
    const clusterSpec = cleanupDecision.groupSpec
    if (!clusterSpec) continue
    const matchedRows = matchedRowsByCluster.get(clusterSpec.cluster_id)
    if (!matchedRows) continue
    const matchedEntryRows = cleanupDecision.isCleanupCandidate
      ? entry.rows.filter((row) => row.is_in_inbox)
      : entry.rows
    if (matchedEntryRows.length === 0) continue
    matchedRows.push(...matchedEntryRows)
    strictCountById.set(
      clusterSpec.cluster_id,
      (strictCountById.get(clusterSpec.cluster_id) || 0) + matchedEntryRows.length
    )
    for (const row of matchedEntryRows) strictMatchedRowIds.add(row.message_id)
  }

  const strictClusterMatchCounts: Array<{ cluster_id: string; count: number }> = clusterSpecs.map((spec) => ({
    cluster_id: spec.cluster_id,
    count: strictCountById.get(spec.cluster_id) || 0,
  }))

  for (const spec of clusterSpecs) {
    const matchedRows = (matchedRowsByCluster.get(spec.cluster_id) || []).slice()
    if (matchedRows.length === 0) continue
    matchedRows.sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    const samplePreview = matchedRows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage)
    const senderCount = new Set(
      matchedRows.map((row) => normalizeSender(row.sender || '')).filter(Boolean)
    ).size
    clusters.push({
      cluster_id: spec.cluster_id,
      cluster_type: spec.cluster_type,
      title: spec.title,
      query: spec.query,
      why_selected: `${spec.why_selected} Indexed senders: ${senderCount}. Indexed messages: ${matchedRows.length}.`,
      estimated_count: matchedRows.length,
      sample_preview: samplePreview,
      risk_note: spec.risk_note,
      safety_note:
        'Index-backed sender-first cluster: review the sender set first, then confirm exact message impact before archive.',
      indexed_signal_window: computeIndexedWindowSignals({
        rows: matchedRows,
        nowMs,
      }),
    })
    mailboxIntelligenceRowsByCluster.set(spec.cluster_id, matchedRows)
  }

  if (clusters.length === 0) {
    const fallbackClusters = fallbackLowValueClusterSpecs({
      inboxRows: workingRows,
      nowMs,
      topSenders: params.topSenders,
    })
    for (const fallback of fallbackClusters) {
      fallbackClusterMatchCounts.push({
        cluster_id: fallback.cluster_id,
        count: fallback.rows.length,
      })
      const samplePreview = fallback.rows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage)
      clusters.push({
        cluster_id: fallback.cluster_id,
        cluster_type: fallback.cluster_type,
        title: fallback.title,
        query: fallback.query,
        why_selected: `${fallback.why_selected} Indexed count: ${fallback.rows.length}.`,
        estimated_count: fallback.rows.length,
        sample_preview: samplePreview,
        risk_note: fallback.risk_note,
        safety_note:
          'Index-backed fallback discovery: bounded review required before any mutation; important/starred protections remain active.',
        indexed_signal_window: computeIndexedWindowSignals({
          rows: fallback.rows,
          nowMs,
        }),
      })
      mailboxIntelligenceRowsByCluster.set(fallback.cluster_id, fallback.rows)
    }
  }

  let usedExploratoryFallback = false
  if (clusters.length === 0 && workingRows.length > 0) {
    usedExploratoryFallback = true
    const senderBuckets = new Map<string, GmailMailboxIndexRow[]>()
    for (const row of workingRows) {
      const sender = (row.sender || '').trim().toLowerCase()
      if (!sender) continue
      const list = senderBuckets.get(sender) || []
      list.push(row)
      senderBuckets.set(sender, list)
    }
    const topSender = Array.from(senderBuckets.entries()).sort((a, b) => b[1].length - a[1].length)[0]
    if (topSender) {
      const senderToken = senderTokenForQuery(topSender[0]) || topSender[0]
      const exploratoryRows = topSender[1]
      fallbackClusterMatchCounts.push({
        cluster_id: 'exploratory-sender-cluster',
        count: exploratoryRows.length,
      })
      clusters.push({
        cluster_id: 'exploratory-sender-cluster',
        cluster_type: 'sender_cluster',
        title: `Sender cluster: ${senderToken}`,
        query: `in:inbox from:${senderToken}`,
        why_selected:
          'Exploratory fallback from indexed inbox rows: strict safety filters produced no low-value cluster, so review this highest-volume sender first.',
        estimated_count: exploratoryRows.length,
        sample_preview: exploratoryRows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage),
        risk_note:
          'High caution: exploratory sender cluster can include mixed-priority messages; review before any mutation.',
        safety_note:
          'Exploratory fallback remains read-only until explicit approval + execute. Keep/exclude controls should be applied before archive requests.',
        indexed_signal_window: computeIndexedWindowSignals({
          rows: exploratoryRows,
          nowMs,
        }),
      })
      mailboxIntelligenceRowsByCluster.set('exploratory-sender-cluster', exploratoryRows)
    } else {
      const exploratoryRows = workingRows.slice(0, 200)
      fallbackClusterMatchCounts.push({
        cluster_id: 'exploratory-inbox-cluster',
        count: workingRows.length,
      })
      clusters.push({
        cluster_id: 'exploratory-inbox-cluster',
        cluster_type: 'age_cluster',
        title: 'Exploratory inbox cluster',
        query: 'in:inbox',
        why_selected:
          'Exploratory fallback from indexed inbox rows: sender parsing was unavailable, so this cluster provides a bounded review starting point.',
        estimated_count: workingRows.length,
        sample_preview: exploratoryRows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage),
        risk_note:
          'High caution: broad exploratory cluster can include mixed-priority messages; review and exclude before requesting action.',
        safety_note:
          'Read-only review first. No inbox mutation occurs until explicit approval + execute.',
        indexed_signal_window: computeIndexedWindowSignals({
          rows: workingRows,
          nowMs,
        }),
      })
      mailboxIntelligenceRowsByCluster.set('exploratory-inbox-cluster', workingRows)
    }
  }

  if (clusters.length === 0 && workingRows.length > 0) {
    usedExploratoryFallback = true
    const broadRows = workingRows.slice(0, Math.min(200, workingRows.length))
    fallbackClusterMatchCounts.push({
      cluster_id: 'guaranteed-inbox-review-cluster',
      count: workingRows.length,
    })
    clusters.push({
      cluster_id: 'guaranteed-inbox-review-cluster',
      cluster_type: 'age_cluster',
      title: 'Inbox review candidates',
      query: 'in:inbox',
      why_selected:
        'Guaranteed fallback: strict and heuristic low-value filters were too restrictive, so this bounded inbox review queue keeps workflow actionable.',
      estimated_count: workingRows.length,
      sample_preview: broadRows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage),
      risk_note:
        'High caution: mixed-priority inbox traffic. Use keep/exclude controls before requesting archive actions.',
      safety_note:
        'Read-only review fallback. No inbox mutation occurs until explicit approval + execute.',
      indexed_signal_window: computeIndexedWindowSignals({
        rows: workingRows,
        nowMs,
      }),
    })
    mailboxIntelligenceRowsByCluster.set('guaranteed-inbox-review-cluster', workingRows)
  }

  clusters.sort((a, b) => {
    if (b.estimated_count !== a.estimated_count) return b.estimated_count - a.estimated_count
    return a.title.localeCompare(b.title)
  })

  const safetyEligibleRows = workingRows.filter(
    (row) =>
      !row.is_starred &&
      !row.is_important &&
      !rowCategoryHas(row, 'CATEGORY_PRIMARY')
  )
  const analyzedDatedRows = workingRows
    .map((row) =>
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    )
    .filter((value): value is number => value != null)
  const oldestIndexedMessageAt =
    analyzedDatedRows.length > 0 ? new Date(Math.min(...analyzedDatedRows)).toISOString() : null
  const newestIndexedMessageAt =
    analyzedDatedRows.length > 0 ? new Date(Math.max(...analyzedDatedRows)).toISOString() : null
  const resolvedDiscoveryWindow: NonNullable<GmailMailboxProfile['cluster_diagnostics']>['source_counts']['discovery_window_days'] =
    params.analysisScope === 'all_indexed'
      ? 'all_indexed'
      : (scopeDays(params.analysisScope) as 7 | 30 | 60 | 90 | 180 | 365)
  const clusterDiagnostics: NonNullable<GmailMailboxProfile['cluster_diagnostics']> = {
    source_counts: {
      indexed_total_rows: params.coverage.indexed_total_rows,
      indexed_inbox_rows: params.coverage.indexed_inbox_rows,
      inbox_rows: workingRows.length,
      recent_window_rows: recentWindowRows.length,
      safety_eligible_rows: safetyEligibleRows.length,
      discovery_rows_used: workingRows.length,
      discovery_window_days: resolvedDiscoveryWindow,
      effective_discovery_window_days: resolvedDiscoveryWindow,
      indexed_date_span_start: params.coverage.indexed_date_span_start ?? oldestIndexedMessageAt,
      indexed_date_span_end: params.coverage.indexed_date_span_end ?? newestIndexedMessageAt,
      indexed_oldest_message_at: oldestIndexedMessageAt,
      indexed_newest_message_at: newestIndexedMessageAt,
    },
    rejection_buckets: {
      not_in_inbox: Math.max(0, indexedRows.length - inboxRows.length),
      starred_or_important: workingRows.filter((row) => row.is_starred || row.is_important).length,
      category_primary: workingRows.filter((row) => rowCategoryHas(row, 'CATEGORY_PRIMARY')).length,
      younger_than_7d: workingRows.filter((row) => !isRowOlderThanDays(row, 7, nowMs)).length,
      no_cluster_pattern_match: Math.max(0, safetyEligibleRows.length - strictMatchedRowIds.size),
    },
    strict_cluster_match_counts: strictClusterMatchCounts,
    fallback_cluster_match_counts: fallbackClusterMatchCounts,
    used_exploratory_fallback: usedExploratoryFallback,
    final_cluster_count: clusters.length,
  }
  mailboxProfile.cluster_diagnostics = clusterDiagnostics

  if (clusters.length === 0) {
    mailboxProfile.notes = [
      ...(mailboxProfile.notes || []),
      `Cluster generation: no qualifying low-value inbox clusters from ${workingRows.length} indexed inbox rows after safety filters.`,
      `Cluster rejection summary: safety-eligible ${clusterDiagnostics.source_counts.safety_eligible_rows}, strict-match gaps ${clusterDiagnostics.rejection_buckets.no_cluster_pattern_match}.`,
      `Indexed coverage span: ${
        clusterDiagnostics.source_counts.indexed_date_span_start
          ? new Date(clusterDiagnostics.source_counts.indexed_date_span_start).toISOString().slice(0, 10)
          : 'unknown'
      } -> ${
        clusterDiagnostics.source_counts.indexed_date_span_end
          ? new Date(clusterDiagnostics.source_counts.indexed_date_span_end).toISOString().slice(0, 10)
          : 'unknown'
      } across ${clusterDiagnostics.source_counts.indexed_total_rows} total indexed rows.`,
    ]
  } else {
    mailboxProfile.notes = [
      ...(mailboxProfile.notes || []),
      `Cluster generation: ${clusters.length} actionable indexed clusters generated from ${workingRows.length} indexed inbox rows.`,
      `Cluster rejection summary: safety-eligible ${clusterDiagnostics.source_counts.safety_eligible_rows}, strict-match gaps ${clusterDiagnostics.rejection_buckets.no_cluster_pattern_match}.`,
      `Indexed coverage span: ${
        clusterDiagnostics.source_counts.indexed_date_span_start
          ? new Date(clusterDiagnostics.source_counts.indexed_date_span_start).toISOString().slice(0, 10)
          : 'unknown'
      } -> ${
        clusterDiagnostics.source_counts.indexed_date_span_end
          ? new Date(clusterDiagnostics.source_counts.indexed_date_span_end).toISOString().slice(0, 10)
          : 'unknown'
      } across ${clusterDiagnostics.source_counts.indexed_total_rows} total indexed rows.`,
    ]
  }

  const selectedClusters = clusters.slice(0, 10)
  const selectedClusterRowsByCluster = new Map(
    selectedClusters.map((cluster) => [
      cluster.cluster_id,
      (mailboxIntelligenceRowsByCluster.get(cluster.cluster_id) || []).slice(),
    ])
  )

  return {
    discovery: {
      generated_at: new Date().toISOString(),
      planning_mode: 'read_only',
      safety_defaults: CLEANUP_SAFETY_DEFAULTS,
      clusters: selectedClusters,
      mailbox_profile: mailboxProfile,
      mailbox_intelligence_snapshot: buildMailboxIntelligenceSnapshot({
        analysisScope: params.analysisScope,
        coverage: params.coverage,
        scopedRows,
        scopedRowsSortedDesc: true,
        candidateRowsByCluster: mailboxIntelligenceRowsByCluster,
        cleanupDecisionBySenderKey,
        clusters: selectedClusters,
      }),
    },
    selectedClusterRowsByCluster,
  }
}

function buildInboxAnalysisFromIndexedRows(params: {
  indexedRows: GmailMailboxIndexRow[]
}): GmailInboxAnalysisData {
  const rows = [...params.indexedRows].sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
  const inboxRows = rows.filter((row) => row.is_in_inbox)
  const sampleRows = inboxRows.slice(0, SAMPLE_MAX_RESULTS)

  const senderCounts = new Map<string, number>()
  for (const row of sampleRows) {
    const sender = normalizeSender(row.sender || '')
    if (!sender) continue
    senderCounts.set(sender, (senderCounts.get(sender) ?? 0) + 1)
  }

  const topSenders = [...senderCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    .slice(0, TOP_SENDERS_LIMIT)
    .map(([sender, count]) => ({ sender, count }))

  const subjectLines = sampleRows
    .map((row) => row.subject)
    .filter((subject): subject is string => typeof subject === 'string' && subject.length > 0)
    .slice(0, SAMPLE_SUBJECT_LIMIT)

  const sampledTimestamps = sampleRows
    .map((row) => {
      if (typeof row.date === 'string' && row.date.trim()) {
        const parsed = Date.parse(row.date)
        if (Number.isFinite(parsed)) return parsed
      }
      if (typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)) {
        return row.internal_date_ms
      }
      return null
    })
    .filter((timestamp): timestamp is number => timestamp != null)

  const oldestDate =
    sampledTimestamps.length > 0 ? new Date(Math.min(...sampledTimestamps)).toISOString() : null
  const newestDate =
    sampledTimestamps.length > 0 ? new Date(Math.max(...sampledTimestamps)).toISOString() : null

  return {
    total_messages_estimate: inboxRows.length,
    sample_size: sampleRows.length,
    sampled_oldest_message_date: oldestDate,
    sampled_newest_message_date: newestDate,
    top_senders: topSenders,
    sample_subject_lines: subjectLines,
  }
}

async function refreshGmailAccessToken(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
  logPrefix: string
}): Promise<{ accessToken: string } | null> {
  const tokenBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  })

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
    cache: 'no-store',
  })

  const tokenData = (await tokenResponse
    .json()
    .catch(() => null)) as GoogleRefreshTokenResponse | null

  if (!tokenResponse.ok || !tokenData?.access_token) {
    console.error(`${params.logPrefix} Refresh token failed:`, tokenData)
    return null
  }

  return { accessToken: tokenData.access_token }
}

export async function analyzeGmailInboxForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  logPrefix?: string
}): Promise<GmailInboxAnalysisResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/inbox-analysis]'

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  try {
    const indexSync = await syncGmailMailboxIndexForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      mode: 'incremental',
      maxMessages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
      allowFullRescanOnHistoryGap: false,
      logPrefix: `${logPrefix}/index-sync`,
    })
    if (!indexSync.ok && indexSync.reason !== 'missing_history_state') {
      console.warn(`${logPrefix} incremental index sync failed (non-fatal):`, indexSync.error)
    }

    const indexedRows = await loadIndexedGmailMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
    })
    if (indexedRows.length > 0) {
      return {
        ok: true,
        data: buildInboxAnalysisFromIndexedRows({
          indexedRows,
        }),
      }
    }

    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }

    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }

    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }

      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })

      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }

      accessToken = refreshed.accessToken
    }

    const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
    messagesListUrl.searchParams.set('labelIds', 'INBOX')
    messagesListUrl.searchParams.set('maxResults', String(SAMPLE_MAX_RESULTS))

    const listResponse = await fetch(messagesListUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    const listData = (await listResponse.json().catch(() => null)) as GmailMessagesListResponse | null
    if (hasInsufficientScopeError(listResponse.status, listData)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    if (!listResponse.ok || !listData) {
      console.error(`${logPrefix} List messages failed:`, listData)
      return fail(502, 'Failed to fetch Gmail inbox metadata.')
    }

    const messageIds = Array.isArray(listData.messages)
      ? listData.messages
          .map((row) => (typeof row?.id === 'string' ? row.id.trim() : ''))
          .filter(Boolean)
      : []

    if (messageIds.length === 0) {
      const estimate = typeof listData.resultSizeEstimate === 'number' ? listData.resultSizeEstimate : 0

      return {
        ok: true,
        data: {
          total_messages_estimate: estimate,
          sample_size: 0,
          sampled_oldest_message_date: null,
          sampled_newest_message_date: null,
          top_senders: [],
          sample_subject_lines: [],
        },
      }
    }

    const metadataResults = await Promise.all(
      messageIds.map(async (messageId) => {
        const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
        messageUrl.searchParams.set('format', 'metadata')
        messageUrl.searchParams.append('metadataHeaders', 'From')
        messageUrl.searchParams.append('metadataHeaders', 'Subject')
        messageUrl.searchParams.append('metadataHeaders', 'Date')

        const response = await fetch(messageUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const data = (await response.json().catch(() => null)) as GmailMessageMetadataResponse | null
        return { response, data }
      })
    )

    if (
      metadataResults.some((item) => hasInsufficientScopeError(item.response.status, item.data))
    ) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const sampledMessages: GmailSampleMessage[] = []
    for (const item of metadataResults) {
      if (!item.response.ok || !item.data) continue

      const from = headerValue(item.data.payload?.headers, 'From')
      const subject = headerValue(item.data.payload?.headers, 'Subject')
      const dateIso = dateIsoFromMessage(item.data)

      sampledMessages.push({
        from,
        subject,
        dateIso,
      })
    }

    const senderCounts = new Map<string, number>()
    for (const message of sampledMessages) {
      if (!message.from) continue
      const sender = normalizeSender(message.from)
      if (!sender) continue
      senderCounts.set(sender, (senderCounts.get(sender) ?? 0) + 1)
    }

    const topSenders = [...senderCounts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })
      .slice(0, TOP_SENDERS_LIMIT)
      .map(([sender, count]) => ({ sender, count }))

    const subjectLines = sampledMessages
      .map((message) => message.subject)
      .filter((subject): subject is string => typeof subject === 'string' && subject.length > 0)
      .slice(0, SAMPLE_SUBJECT_LIMIT)

    const sampledTimestamps = sampledMessages
      .map((message) => {
        if (!message.dateIso) return null
        const timestamp = Date.parse(message.dateIso)
        if (!Number.isFinite(timestamp)) return null
        return timestamp
      })
      .filter((timestamp): timestamp is number => timestamp != null)

    const oldestDate =
      sampledTimestamps.length > 0 ? new Date(Math.min(...sampledTimestamps)).toISOString() : null
    const newestDate =
      sampledTimestamps.length > 0 ? new Date(Math.max(...sampledTimestamps)).toISOString() : null

    const estimate =
      typeof listData.resultSizeEstimate === 'number' ? listData.resultSizeEstimate : sampledMessages.length

    return {
      ok: true,
      data: {
        total_messages_estimate: estimate,
        sample_size: sampledMessages.length,
        sampled_oldest_message_date: oldestDate,
        sampled_newest_message_date: newestDate,
        top_senders: topSenders,
        sample_subject_lines: subjectLines,
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while analyzing inbox.')
  }
}

export async function reviewGmailSenderClusterForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  sender: string
  maxResults?: number
  logPrefix?: string
}): Promise<GmailSenderClusterReviewResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/sender-cluster-review]'
  const sender = normalizeSender(params.sender || '')
  const maxResults = Math.min(Math.max(params.maxResults ?? SAMPLE_MAX_RESULTS, 1), SAMPLE_MAX_RESULTS)

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  if (!sender) {
    return fail(400, 'Sender is required for review_sender_cluster.')
  }

  try {
    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }

    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }

    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }

      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })

      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }

      accessToken = refreshed.accessToken
    }

    const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
    messagesListUrl.searchParams.set('labelIds', 'INBOX')
    messagesListUrl.searchParams.set('q', `from:${sender}`)
    messagesListUrl.searchParams.set('maxResults', String(maxResults))

    const listResponse = await fetch(messagesListUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    const listData = (await listResponse.json().catch(() => null)) as GmailMessagesListResponse | null
    if (hasInsufficientScopeError(listResponse.status, listData)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    if (!listResponse.ok || !listData) {
      console.error(`${logPrefix} List sender-cluster messages failed:`, listData)
      return fail(502, 'Failed to fetch Gmail sender-cluster metadata.')
    }

    const messageIds = Array.isArray(listData.messages)
      ? listData.messages
          .map((row) => (typeof row?.id === 'string' ? row.id.trim() : ''))
          .filter(Boolean)
      : []

    if (messageIds.length === 0) {
      return {
        ok: true,
        data: {
          sender,
          fetched_count: 0,
          sampled_oldest_message_date: null,
          sampled_newest_message_date: null,
          sample_subject_lines: [],
          snippet_previews: [],
          messages: [],
        },
      }
    }

    const metadataResults = await Promise.all(
      messageIds.map(async (messageId) => {
        const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
        messageUrl.searchParams.set('format', 'metadata')
        messageUrl.searchParams.append('metadataHeaders', 'From')
        messageUrl.searchParams.append('metadataHeaders', 'Subject')
        messageUrl.searchParams.append('metadataHeaders', 'Date')

        const response = await fetch(messageUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const data = (await response.json().catch(() => null)) as GmailMessageMetadataResponse | null
        return { messageId, response, data }
      })
    )

    if (
      metadataResults.some((item) => hasInsufficientScopeError(item.response.status, item.data))
    ) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const sampledMessages = metadataResults
      .map(
        (
          item
        ):
          | {
              message_id: string
              thread_id?: string
              history_id?: string
              internal_date_ms?: number
              subject: string | null
              from: string
              dateIso: string | null
              date: string | null
              snippet: string | null
              label_ids: string[]
            }
          | null => {
          if (!item.response.ok || !item.data) return null

          const from = headerValue(item.data.payload?.headers, 'From')
          const subject = headerValue(item.data.payload?.headers, 'Subject')
          const dateIso = dateIsoFromMessage(item.data)
          const snippet =
            typeof item.data.snippet === 'string' && item.data.snippet.trim()
              ? compactSnippet(item.data.snippet)
              : null

          return {
            message_id: item.messageId,
            thread_id: normalizeOptionalString(item.data.threadId) ?? undefined,
            history_id: normalizeOptionalString(item.data.historyId) ?? undefined,
            internal_date_ms: internalDateMsFromMessage(item.data) ?? undefined,
            subject,
            from: from || sender,
            dateIso,
            date: dateIso,
            snippet,
            label_ids: normalizeLabelIds(item.data.labelIds),
          }
        }
      )
      .filter(
        (
          entry
        ): entry is {
          message_id: string
          thread_id?: string
          history_id?: string
          internal_date_ms?: number
          subject: string | null
          from: string
          dateIso: string | null
          date: string | null
          snippet: string | null
          label_ids: string[]
        } => entry != null
      )

    const sampleSubjectLines = sampledMessages
      .map((message) => message.subject)
      .filter((subject): subject is string => typeof subject === 'string' && subject.length > 0)
      .slice(0, SAMPLE_SUBJECT_LIMIT)

    const snippetPreviews = sampledMessages
      .map((message) => message.snippet)
      .filter((snippet): snippet is string => typeof snippet === 'string' && snippet.length > 0)
      .slice(0, SAMPLE_SUBJECT_LIMIT)

    const sampledTimestamps = sampledMessages
      .map((message) => {
        if (!message.dateIso) return null
        const timestamp = Date.parse(message.dateIso)
        if (!Number.isFinite(timestamp)) return null
        return timestamp
      })
      .filter((timestamp): timestamp is number => timestamp != null)

    const oldestDate =
      sampledTimestamps.length > 0 ? new Date(Math.min(...sampledTimestamps)).toISOString() : null
    const newestDate =
      sampledTimestamps.length > 0 ? new Date(Math.max(...sampledTimestamps)).toISOString() : null

    return {
      ok: true,
      data: {
        sender,
        fetched_count: sampledMessages.length,
        sampled_oldest_message_date: oldestDate,
        sampled_newest_message_date: newestDate,
        sample_subject_lines: sampleSubjectLines,
        snippet_previews: snippetPreviews,
        messages: sampledMessages.map((message) => ({
          message_id: message.message_id,
          ...(message.thread_id ? { thread_id: message.thread_id } : {}),
          ...(message.history_id ? { history_id: message.history_id } : {}),
          ...(message.internal_date_ms != null ? { internal_date_ms: message.internal_date_ms } : {}),
          subject: message.subject,
          from: message.from,
          date: message.date,
          snippet: message.snippet,
          label_ids: message.label_ids,
          category_labels: categoryLabelsFromLabelIds(message.label_ids),
          is_in_inbox: message.label_ids.includes('INBOX'),
          is_unread: message.label_ids.includes('UNREAD'),
          is_important: message.label_ids.includes('IMPORTANT'),
          is_starred: message.label_ids.includes('STARRED'),
        })),
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while reviewing sender cluster.')
  }
}

export async function reviewGmailQueryClusterForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  clusterId: string
  clusterType: string
  title: string
  query: string
  analysisScope?: GmailAnalysisScope
  estimatedCount?: number | null
  riskNote?: string | null
  safetyNote?: string | null
  maxResults?: number
  logPrefix?: string
}): Promise<GmailQueryClusterReviewResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/query-cluster-review]'
  const clusterId = typeof params.clusterId === 'string' ? params.clusterId.trim() : ''
  const clusterType = typeof params.clusterType === 'string' ? params.clusterType.trim() : ''
  const title = typeof params.title === 'string' ? params.title.trim() : ''
  const query = typeof params.query === 'string' ? params.query.trim() : ''
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const analysisScopeDays = scopeDays(analysisScope)
  const scopedQuery =
    analysisScopeDays != null ? `${query} newer_than:${analysisScopeDays}d` : query
  const maxResults = Math.min(Math.max(params.maxResults ?? QUERY_REVIEW_MAX_RESULTS, 1), QUERY_REVIEW_MAX_RESULTS)
  const estimatedCount =
    typeof params.estimatedCount === 'number' && Number.isFinite(params.estimatedCount)
      ? Math.max(0, Math.floor(params.estimatedCount))
      : null
  const riskNote =
    typeof params.riskNote === 'string' && params.riskNote.trim()
      ? params.riskNote.trim()
      : 'Review this cluster before any mutation action.'
  const safetyNote =
    typeof params.safetyNote === 'string' && params.safetyNote.trim()
      ? params.safetyNote.trim()
      : 'Read-only bounded sample; confirm exact query and message preview before approval.'

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  if (!clusterId || !clusterType || !title || !query) {
    return fail(400, 'cluster_id, cluster_type, title, and query are required for review_query_cluster.')
  }

  try {
    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }

    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }

    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }

      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })

      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }

      accessToken = refreshed.accessToken
    }

    const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
    messagesListUrl.searchParams.set('q', scopedQuery)
    messagesListUrl.searchParams.set('maxResults', String(maxResults))

    const listResponse = await fetch(messagesListUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    const listData = (await listResponse.json().catch(() => null)) as GmailMessagesListResponse | null
    if (hasInsufficientScopeError(listResponse.status, listData)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    if (!listResponse.ok || !listData) {
      console.error(`${logPrefix} List query-cluster messages failed:`, listData)
      return fail(502, 'Failed to fetch Gmail query-cluster metadata.')
    }

    const messageIds = Array.isArray(listData.messages)
      ? listData.messages
          .map((row) => (typeof row?.id === 'string' ? row.id.trim() : ''))
          .filter(Boolean)
      : []

    if (messageIds.length === 0) {
      return {
        ok: true,
        data: {
          cluster_id: clusterId,
          cluster_type: clusterType,
          title,
          query: scopedQuery,
          estimated_count:
            typeof listData.resultSizeEstimate === 'number'
              ? listData.resultSizeEstimate
              : estimatedCount,
          fetched_count: 0,
          sampled_oldest_message_date: null,
          sampled_newest_message_date: null,
          sample_subject_lines: [],
          snippet_previews: [],
          reviewed_messages_preview: [],
          risk_note: riskNote,
          safety_note: safetyNote,
        },
      }
    }

    const metadataResults = await Promise.all(
      messageIds.map(async (messageId) => {
        const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
        messageUrl.searchParams.set('format', 'metadata')
        messageUrl.searchParams.append('metadataHeaders', 'From')
        messageUrl.searchParams.append('metadataHeaders', 'Subject')
        messageUrl.searchParams.append('metadataHeaders', 'Date')

        const response = await fetch(messageUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const data = (await response.json().catch(() => null)) as GmailMessageMetadataResponse | null
        return { messageId, response, data }
      })
    )

    if (metadataResults.some((item) => hasInsufficientScopeError(item.response.status, item.data))) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const reviewedMessages = metadataResults
      .map(
        (
          item
        ):
          | {
              message_id: string
              thread_id?: string
              history_id?: string
              internal_date_ms?: number
              subject: string | null
              from: string | null
              dateIso: string | null
              date: string | null
              snippet: string | null
              label_ids: string[]
            }
          | null => {
          if (!item.response.ok || !item.data) return null

          const from = headerValue(item.data.payload?.headers, 'From')
          const subject = headerValue(item.data.payload?.headers, 'Subject')
          const dateIso = dateIsoFromMessage(item.data)
          const snippet =
            typeof item.data.snippet === 'string' && item.data.snippet.trim()
              ? compactSnippet(item.data.snippet)
              : null

          return {
            message_id: item.messageId,
            thread_id: normalizeOptionalString(item.data.threadId) ?? undefined,
            history_id: normalizeOptionalString(item.data.historyId) ?? undefined,
            internal_date_ms: internalDateMsFromMessage(item.data) ?? undefined,
            subject,
            from,
            dateIso,
            date: dateIso,
            snippet,
            label_ids: normalizeLabelIds(item.data.labelIds),
          }
        }
      )
      .filter(
        (
          entry
        ): entry is {
          message_id: string
          thread_id?: string
          history_id?: string
          internal_date_ms?: number
          subject: string | null
          from: string | null
          dateIso: string | null
          date: string | null
          snippet: string | null
          label_ids: string[]
        } => entry != null
      )

    const sampleSubjectLines = reviewedMessages
      .map((message) => message.subject)
      .filter((subject): subject is string => typeof subject === 'string' && subject.length > 0)
      .slice(0, SAMPLE_SUBJECT_LIMIT)

    const snippetPreviews = reviewedMessages
      .map((message) => message.snippet)
      .filter((snippet): snippet is string => typeof snippet === 'string' && snippet.length > 0)
      .slice(0, SAMPLE_SUBJECT_LIMIT)

    const sampledTimestamps = reviewedMessages
      .map((message) => {
        if (!message.dateIso) return null
        const timestamp = Date.parse(message.dateIso)
        if (!Number.isFinite(timestamp)) return null
        return timestamp
      })
      .filter((timestamp): timestamp is number => timestamp != null)

    const oldestDate =
      sampledTimestamps.length > 0 ? new Date(Math.min(...sampledTimestamps)).toISOString() : null
    const newestDate =
      sampledTimestamps.length > 0 ? new Date(Math.max(...sampledTimestamps)).toISOString() : null

    return {
      ok: true,
      data: {
        cluster_id: clusterId,
        cluster_type: clusterType,
          title,
          query: scopedQuery,
        estimated_count:
          typeof listData.resultSizeEstimate === 'number'
            ? listData.resultSizeEstimate
            : estimatedCount,
        fetched_count: reviewedMessages.length,
        sampled_oldest_message_date: oldestDate,
        sampled_newest_message_date: newestDate,
        sample_subject_lines: sampleSubjectLines,
        snippet_previews: snippetPreviews,
        reviewed_messages_preview: reviewedMessages.map((message) => ({
          message_id: message.message_id,
          ...(message.thread_id ? { thread_id: message.thread_id } : {}),
          ...(message.history_id ? { history_id: message.history_id } : {}),
          ...(message.internal_date_ms != null ? { internal_date_ms: message.internal_date_ms } : {}),
          subject: message.subject,
          from: message.from,
          date: message.date,
          snippet: message.snippet,
          label_ids: message.label_ids,
          category_labels: categoryLabelsFromLabelIds(message.label_ids),
          is_in_inbox: message.label_ids.includes('INBOX'),
          is_unread: message.label_ids.includes('UNREAD'),
          is_important: message.label_ids.includes('IMPORTANT'),
          is_starred: message.label_ids.includes('STARRED'),
        })),
        risk_note: riskNote,
        safety_note: safetyNote,
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while reviewing query cluster.')
  }
}

function queryClusterMatchCacheKey(params: {
  tenantId: string
  clusterId: string
  clusterType: string
  query: string
  analysisScope: GmailAnalysisScope
}): string {
  return [
    params.tenantId,
    params.analysisScope,
    params.clusterId,
    params.clusterType,
    params.query.trim().toLowerCase(),
  ].join('::')
}

function distinctSendersCount(rows: GmailMailboxIndexRow[]): number {
  const senders = new Set<string>()
  for (const row of rows) {
    const sender = normalizeSender(row.sender || '')
    if (!sender) continue
    senders.add(sender)
  }
  return senders.size
}

function rowsDateSpan(rows: GmailMailboxIndexRow[]): { start: string | null; end: string | null } {
  let minMs: number | null = null
  let maxMs: number | null = null
  for (const row of rows) {
    const value =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (value == null) continue
    if (minMs == null || value < minMs) minMs = value
    if (maxMs == null || value > maxMs) maxMs = value
  }
  return {
    start: minMs != null ? new Date(minMs).toISOString() : null,
    end: maxMs != null ? new Date(maxMs).toISOString() : null,
  }
}

function boundReviewUnitRows(rows: GmailMailboxIndexRow[]): GmailMailboxIndexRow[] {
  if (rows.length <= QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES) return rows
  return [...rows]
    .sort((a, b) => {
      const left = typeof a.internal_date_ms === 'number' ? a.internal_date_ms : 0
      const right = typeof b.internal_date_ms === 'number' ? b.internal_date_ms : 0
      return right - left
    })
    .slice(0, QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES)
}

function clusterSharePct(params: { unitCount: number; clusterCount: number }): number {
  if (params.clusterCount <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((params.unitCount / params.clusterCount) * 100)))
}

function summarizeProtectionSignals(rows: GmailMailboxIndexRow[]): string[] {
  const unread = rows.filter((row) => row.is_unread).length
  const starredOrImportant = rows.filter((row) => row.is_starred || row.is_important).length
  const primary = rows.filter((row) => rowCategoryHas(row, 'CATEGORY_PRIMARY')).length
  return [
    `Unread ${unread}/${rows.length}`,
    `Starred/important ${starredOrImportant}/${rows.length}`,
    `Primary-category ${primary}/${rows.length}`,
  ]
}

export function rowSenderDomain(row: GmailMailboxIndexRow): string | null {
  const sender = normalizeSender(row.sender || '')
  if (!sender) return null
  const at = sender.indexOf('@')
  if (at <= 0 || at >= sender.length - 1) return null
  return sender.slice(at + 1)
}

function rowRecencyBucket(
  row: GmailMailboxIndexRow,
  nowMs: number
): 'last_30d' | '31_90d' | '91_180d' | 'older_180d' {
  const timestamp =
    typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
      ? row.internal_date_ms
      : null
  if (timestamp == null) return 'older_180d'
  const ageDays = (nowMs - timestamp) / (24 * 60 * 60 * 1000)
  if (ageDays <= 30) return 'last_30d'
  if (ageDays <= 90) return '31_90d'
  if (ageDays <= 180) return '91_180d'
  return 'older_180d'
}

function senderLooksMachineGenerated(sender: string): boolean {
  const normalized = sender.toLowerCase()
  return /\b(no-?reply|donotreply|do-?not-?reply|mailer-daemon|notification|alerts?)\b/.test(
    normalized
  )
}

type QueryClusterFastPathResult = {
  matchedRows: GmailMailboxIndexRow[]
  clusterTotalMatchingCount: number
  fastPathApplied: QueryClusterMatchCacheEntry['fast_path_applied']
}

function senderTokenFromClusterTitle(title: string): string | null {
  const senderToken = title.replace(/^Sender cluster:\s*/i, '').trim().toLowerCase()
  if (!senderToken) return null
  return senderToken.replace(/[%_]/g, '')
}

async function loadQueryClusterFastPathRows(params: {
  supabase: SupabaseClient
  tenantId: string
  clusterType: string
  title: string
  analysisScope: GmailAnalysisScope
  nowMs: number
}): Promise<QueryClusterFastPathResult | null> {
  const baseSelect =
    'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'

  let countQuery = params.supabase
    .from('gmail_messages')
    .select('message_id', { count: 'exact', head: true })
    .eq('tenant_id', params.tenantId)
    .eq('is_in_inbox', true)
  let rowsQuery = params.supabase
    .from('gmail_messages')
    .select(baseSelect)
    .eq('tenant_id', params.tenantId)
    .eq('is_in_inbox', true)
  const scopeWindowDays = scopeDays(params.analysisScope)
  if (scopeWindowDays != null) {
    const scopeCutoffMs = params.nowMs - scopeWindowDays * 24 * 60 * 60 * 1000
    countQuery = countQuery.gte('internal_date_ms', scopeCutoffMs)
    rowsQuery = rowsQuery.gte('internal_date_ms', scopeCutoffMs)
  }
  let fastPathApplied: QueryClusterFastPathResult['fastPathApplied'] = null

  if (params.clusterType === 'unread_clutter') {
    const olderThanMs = params.nowMs - 21 * 24 * 60 * 60 * 1000
    countQuery = countQuery
      .eq('is_unread', true)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    rowsQuery = rowsQuery
      .eq('is_unread', true)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    fastPathApplied = 'unread_clutter'
  } else if (params.clusterType === 'old_read_mail') {
    const olderThanMs = params.nowMs - 120 * 24 * 60 * 60 * 1000
    countQuery = countQuery
      .eq('is_unread', false)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    rowsQuery = rowsQuery
      .eq('is_unread', false)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    fastPathApplied = 'old_read_mail'
  } else if (params.clusterType === 'age_cluster') {
    const olderThanMs = params.nowMs - 365 * 24 * 60 * 60 * 1000
    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .lte('internal_date_ms', olderThanMs)
    fastPathApplied = 'age_cluster'
  } else if (params.clusterType === 'sender_cluster') {
    const senderToken = senderTokenFromClusterTitle(params.title)
    if (!senderToken) return null
    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .ilike('sender', `%${senderToken}%`)
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .ilike('sender', `%${senderToken}%`)
    fastPathApplied = 'sender_cluster'
  } else if (params.clusterType === 'newsletters') {
    let categoryOnlyCountQuery = params.supabase
      .from('gmail_messages')
      .select('message_id', { count: 'exact', head: true })
      .eq('is_in_inbox', true)
      .eq('tenant_id', params.tenantId)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .contains('category_labels', ['CATEGORY_PROMOTIONS'])
    let categoryOnlyRowsQuery = params.supabase
      .from('gmail_messages')
      .select(
        'message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important'
      )
      .eq('is_in_inbox', true)
      .eq('tenant_id', params.tenantId)
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .contains('category_labels', ['CATEGORY_PROMOTIONS'])
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(0, QUERY_CLUSTER_FAST_PATH_FETCH_LIMIT - 1)
    if (scopeWindowDays != null) {
      const scopeCutoffMs = params.nowMs - scopeWindowDays * 24 * 60 * 60 * 1000
      categoryOnlyCountQuery = categoryOnlyCountQuery.gte('internal_date_ms', scopeCutoffMs)
      categoryOnlyRowsQuery = categoryOnlyRowsQuery.gte('internal_date_ms', scopeCutoffMs)
    }
    const [categoryOnlyCountResult, categoryOnlyRowsResult] = await Promise.all([
      categoryOnlyCountQuery,
      categoryOnlyRowsQuery,
    ])
    const categoryOnlyRows = Array.isArray(categoryOnlyRowsResult.data)
      ? (categoryOnlyRowsResult.data as GmailMailboxIndexRow[])
      : []
    const categoryOnlyCount =
      typeof categoryOnlyCountResult.count === 'number' &&
      Number.isFinite(categoryOnlyCountResult.count)
        ? Math.max(0, categoryOnlyCountResult.count)
        : categoryOnlyRows.length
    if (
      !categoryOnlyRowsResult.error &&
      (categoryOnlyCount >= 40 || categoryOnlyRows.length >= 40)
    ) {
      return {
        matchedRows: categoryOnlyRows,
        clusterTotalMatchingCount: categoryOnlyCount,
        fastPathApplied: 'newsletters',
      }
    }

    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'category_labels.cs.{"CATEGORY_PROMOTIONS"}',
          'subject.ilike.%newsletter%',
          'subject.ilike.%digest%',
          'subject.ilike.%unsubscribe%',
        ].join(',')
      )
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'category_labels.cs.{"CATEGORY_PROMOTIONS"}',
          'subject.ilike.%newsletter%',
          'subject.ilike.%digest%',
          'subject.ilike.%unsubscribe%',
        ].join(',')
      )
    fastPathApplied = 'newsletters'
  } else if (params.clusterType === 'noreply_automation') {
    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'sender.ilike.%no-reply%',
          'sender.ilike.%noreply%',
          'sender.ilike.%donotreply%',
          'sender.ilike.%do-not-reply%',
          'subject.ilike.%notification%',
          'subject.ilike.%automated%',
          'subject.ilike.%alert%',
        ].join(',')
      )
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'sender.ilike.%no-reply%',
          'sender.ilike.%noreply%',
          'sender.ilike.%donotreply%',
          'sender.ilike.%do-not-reply%',
          'subject.ilike.%notification%',
          'subject.ilike.%automated%',
          'subject.ilike.%alert%',
        ].join(',')
      )
    fastPathApplied = 'noreply_automation'
  } else if (params.clusterType === 'shopping_updates') {
    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'subject.ilike.%order%',
          'subject.ilike.%shipped%',
          'subject.ilike.%delivery%',
          'subject.ilike.%tracking%',
          'subject.ilike.%receipt%',
          'subject.ilike.%invoice%',
          'subject.ilike.%refund%',
        ].join(',')
      )
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'subject.ilike.%order%',
          'subject.ilike.%shipped%',
          'subject.ilike.%delivery%',
          'subject.ilike.%tracking%',
          'subject.ilike.%receipt%',
          'subject.ilike.%invoice%',
          'subject.ilike.%refund%',
        ].join(',')
      )
    fastPathApplied = 'shopping_updates'
  } else if (params.clusterType === 'social_notifications') {
    countQuery = countQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'category_labels.cs.{"CATEGORY_SOCIAL"}',
          'subject.ilike.%mentioned%',
          'subject.ilike.%follower%',
          'subject.ilike.%comment%',
          'subject.ilike.%liked%',
          'subject.ilike.%reacted%',
          'subject.ilike.%invite%',
        ].join(',')
      )
    rowsQuery = rowsQuery
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')
      .or(
        [
          'category_labels.cs.{"CATEGORY_SOCIAL"}',
          'subject.ilike.%mentioned%',
          'subject.ilike.%follower%',
          'subject.ilike.%comment%',
          'subject.ilike.%liked%',
          'subject.ilike.%reacted%',
          'subject.ilike.%invite%',
        ].join(',')
      )
    fastPathApplied = 'social_notifications'
  } else {
    return null
  }

  const [countResult, rowsResult] = await Promise.all([
    countQuery,
    rowsQuery
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(0, QUERY_CLUSTER_FAST_PATH_FETCH_LIMIT - 1),
  ])

  if (rowsResult.error) return null
  const matchedRows = Array.isArray(rowsResult.data) ? (rowsResult.data as GmailMailboxIndexRow[]) : []
  const clusterTotalMatchingCount =
    typeof countResult.count === 'number' && Number.isFinite(countResult.count)
      ? Math.max(0, countResult.count)
      : matchedRows.length

  return {
    matchedRows,
    clusterTotalMatchingCount,
    fastPathApplied,
  }
}

function buildQueryClusterReviewUnitDefinitions(params: {
  clusterId: string
  clusterType: string
  matchedRows: GmailMailboxIndexRow[]
  clusterTotalCount?: number
}): QueryReviewUnitDefinition[] {
  const sampleTotal = params.matchedRows.length
  const clusterTotal = Math.max(sampleTotal, params.clusterTotalCount ?? sampleTotal)
  if (sampleTotal === 0) return []
  const nowMs = Date.now()

  const senderBuckets = new Map<string, GmailMailboxIndexRow[]>()
  const domainBuckets = new Map<string, GmailMailboxIndexRow[]>()
  const patternBuckets = new Map<string, GmailMailboxIndexRow[]>()
  const recencyBuckets = new Map<
    'last_30d' | '31_90d' | '91_180d' | 'older_180d',
    GmailMailboxIndexRow[]
  >()

  for (const row of params.matchedRows) {
    const sender = normalizeSender(row.sender || '') || 'unknown'
    const senderRows = senderBuckets.get(sender) || []
    senderRows.push(row)
    senderBuckets.set(sender, senderRows)

    const domain = rowSenderDomain(row) || 'unknown-domain'
    const domainRows = domainBuckets.get(domain) || []
    domainRows.push(row)
    domainBuckets.set(domain, domainRows)

    const pattern = classifySenderPatternFromSubject(row.subject)
    const patternRows = patternBuckets.get(pattern) || []
    patternRows.push(row)
    patternBuckets.set(pattern, patternRows)

    const recencyKey = rowRecencyBucket(row, nowMs)
    const recencyRows = recencyBuckets.get(recencyKey) || []
    recencyRows.push(row)
    recencyBuckets.set(recencyKey, recencyRows)
  }

  const units: QueryReviewUnitDefinition[] = []
  const pushUnit = (params: {
    id: string
    label: string
    grouping: GmailQueryClusterReviewUnit['grouping']
    reason: string
    rows: GmailMailboxIndexRow[]
    confidence: GmailQueryClusterReviewUnit['confidence']
    risk: GmailQueryClusterReviewUnit['risk']
    safeAction: string
  }) => {
    if (params.rows.length === 0) return
    const boundedRows = boundReviewUnitRows(params.rows)
    const span = rowsDateSpan(boundedRows)
    const boundedReason =
      boundedRows.length < params.rows.length
        ? `${params.reason} Bounded to ${QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES.toLocaleString()} most recent messages for review performance.`
        : params.reason
    units.push({
      unit: {
        unit_id: params.id,
        label: params.label,
        grouping: params.grouping,
        reason: boundedReason,
        total_messages: boundedRows.length,
        distinct_senders: distinctSendersCount(boundedRows),
        cluster_share_pct: clusterSharePct({
          unitCount: boundedRows.length,
          clusterCount: clusterTotal,
        }),
        date_span_start: span.start,
        date_span_end: span.end,
        confidence: params.confidence,
        risk: params.risk,
        protections_active: summarizeProtectionSignals(boundedRows),
        likely_safe_action: params.safeAction,
      },
      rows: boundedRows,
    })
  }

  const minSemanticBucketSize = Math.max(30, Math.round(sampleTotal * 0.005))

  if (params.clusterType === 'unread_clutter') {
    const recent30Rows = params.matchedRows.filter(
      (row) => rowRecencyBucket(row, nowMs) === 'last_30d'
    )
    const recent90Rows = params.matchedRows.filter((row) => {
      const bucket = rowRecencyBucket(row, nowMs)
      return bucket === 'last_30d' || bucket === '31_90d'
    })
    const olderBacklogRows = params.matchedRows.filter((row) => {
      const bucket = rowRecencyBucket(row, nowMs)
      return bucket === '91_180d' || bucket === 'older_180d'
    })
    const senderCounts = new Map<string, number>()
    for (const row of params.matchedRows) {
      const sender = normalizeSender(row.sender || '') || 'unknown'
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
    }
    const highVolumeSenders = new Set(
      Array.from(senderCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([sender]) => sender)
    )
    const highestVolumeRows = params.matchedRows.filter((row) => {
      const sender = normalizeSender(row.sender || '') || 'unknown'
      return highVolumeSenders.has(sender)
    })
    const oldestUnreadRows = [...params.matchedRows]
      .sort((a, b) => {
        const left = a.internal_date_ms || 0
        const right = b.internal_date_ms || 0
        return left - right
      })
      .slice(0, QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES)

    pushUnit({
      id: 'mode:recent_30d',
      label: 'Recent unread (last 30d)',
      grouping: 'recency',
      reason: 'Focused on recent unread clutter for cautious first-pass cleanup.',
      rows: recent30Rows,
      confidence: 'moderate',
      risk: 'medium',
      safeAction: 'Review sender exceptions, then archive selected subset.',
    })
    pushUnit({
      id: 'mode:recent_90d',
      label: 'Recent unread (last 90d)',
      grouping: 'recency',
      reason: 'Broader recent unread scope including 30d and 31-90d bands.',
      rows: recent90Rows,
      confidence: 'moderate',
      risk: 'medium',
      safeAction: 'Use sender/pattern filters before creating approval request.',
    })
    pushUnit({
      id: 'mode:older_backlog',
      label: 'Older unread backlog (>90d)',
      grouping: 'recency',
      reason: 'Older unread backlog usually yields higher-impact low-risk cleanup opportunities.',
      rows: olderBacklogRows,
      confidence: 'high',
      risk: 'low',
      safeAction: 'Archive selected backlog senders after keep checks.',
    })
    pushUnit({
      id: 'mode:highest_volume_senders',
      label: 'Highest-volume senders',
      grouping: 'sender',
      reason: 'Top sender concentration slice for rapid, high-impact triage.',
      rows: highestVolumeRows,
      confidence: 'high',
      risk: 'low',
      safeAction: 'Set sender policy inline, then submit archive request.',
    })
    pushUnit({
      id: 'mode:oldest_unread',
      label: 'Oldest unread first',
      grouping: 'recency',
      reason: `Oldest unread rows first. Bounded to ${QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES.toLocaleString()} rows for operator review.`,
      rows: oldestUnreadRows,
      confidence: 'moderate',
      risk: 'low',
      safeAction: 'Clear oldest clutter in bounded pages.',
    })

    const coveredIds = new Set<string>()
    for (const definition of units) {
      for (const row of definition.rows) coveredIds.add(row.message_id)
    }
    const mixedRows = params.matchedRows.filter((row) => !coveredIds.has(row.message_id))
    if (mixedRows.length > 0) {
      pushUnit({
        id: 'mode:mixed_unit',
        label: 'Mixed review unit',
        grouping: 'mixed',
        reason: 'Remaining rows not captured by focused unread modes.',
        rows: mixedRows,
        confidence: 'directional',
        risk: 'medium',
        safeAction: 'Spot-check and exclude uncertain senders before request.',
      })
    }

    if (units.length > 0) {
      const modeOrder = [
        'mode:recent_30d',
        'mode:recent_90d',
        'mode:older_backlog',
        'mode:highest_volume_senders',
        'mode:oldest_unread',
        'mode:mixed_unit',
      ]
      const ordered = units.sort(
        (a, b) => modeOrder.indexOf(a.unit.unit_id) - modeOrder.indexOf(b.unit.unit_id)
      )
      return ordered.slice(0, QUERY_CLUSTER_REVIEW_UNITS_MAX)
    }
  }

  const shouldPreferSemanticBuckets =
    params.clusterType === 'unread_clutter' ||
    params.clusterType === 'old_read_mail' ||
    sampleTotal >= 3_000

  if (shouldPreferSemanticBuckets) {
    const recentPromotionsRows = params.matchedRows.filter((row) => {
      const pattern = classifySenderPatternFromSubject(row.subject)
      const isPromotionPattern = pattern === 'Newsletter / promotional'
      return (
        rowRecencyBucket(row, nowMs) === 'last_30d' &&
        (rowCategoryHas(row, 'CATEGORY_PROMOTIONS') || isPromotionPattern)
      )
    })
    if (recentPromotionsRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:recent-unread-promotions',
        label: 'Recent unread promotions',
        grouping: 'recency',
        reason:
          'Unread promotional traffic from the last 30 days for cautious, bounded triage.',
        rows: recentPromotionsRows,
        confidence: 'moderate',
        risk: 'medium',
        safeAction: 'Start with sender exclusions, then request archive approval for low-value subset.',
      })
    }

    const olderPromotionsRows = params.matchedRows.filter((row) => {
      const pattern = classifySenderPatternFromSubject(row.subject)
      const isPromotionPattern = pattern === 'Newsletter / promotional'
      return (
        rowRecencyBucket(row, nowMs) !== 'last_30d' &&
        (rowCategoryHas(row, 'CATEGORY_PROMOTIONS') || isPromotionPattern)
      )
    })
    if (olderPromotionsRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:older-unread-promotions',
        label: 'Older unread promotions',
        grouping: 'recency',
        reason: 'Older promotional backlog typically offers higher-impact low-risk cleanup.',
        rows: olderPromotionsRows,
        confidence: 'high',
        risk: 'low',
        safeAction: 'Archive selected backlog after checking sender keep/protection signals.',
      })
    }

    const socialNoiseRows = params.matchedRows.filter((row) => {
      const pattern = classifySenderPatternFromSubject(row.subject)
      return rowCategoryHas(row, 'CATEGORY_SOCIAL') || pattern === 'Alerts / security'
    })
    if (socialNoiseRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:social-notification-noise',
        label: 'Social / notification noise',
        grouping: 'pattern',
        reason: 'Notification-heavy traffic grouped for focused review before archive requests.',
        rows: socialNoiseRows,
        confidence: 'moderate',
        risk: 'low',
        safeAction: 'Archive low-action notifications; keep exception senders.',
      })
    }

    const commerceRows = params.matchedRows.filter((row) => {
      const pattern = classifySenderPatternFromSubject(row.subject)
      return pattern === 'Commerce / shipping updates' || pattern === 'Invoices / receipts'
    })
    if (commerceRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:commerce-order-updates',
        label: 'Commerce / order updates',
        grouping: 'pattern',
        reason:
          'Transactional commerce updates grouped separately so operators can keep critical senders.',
        rows: commerceRows,
        confidence: 'moderate',
        risk: 'medium',
        safeAction: 'Archive only after sender-level keep/exclude review.',
      })
    }

    const senderCounts = new Map<string, number>()
    for (const row of params.matchedRows) {
      const sender = normalizeSender(row.sender || '') || 'unknown'
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
    }
    const recurringMachineSenders = new Set(
      Array.from(senderCounts.entries())
        .filter(([sender, count]) => {
          if (count < Math.max(20, Math.round(sampleTotal * 0.01))) return false
          return senderLooksMachineGenerated(sender)
        })
        .map(([sender]) => sender)
    )
    const recurringMachineRows = params.matchedRows.filter((row) => {
      const sender = normalizeSender(row.sender || '') || 'unknown'
      return recurringMachineSenders.has(sender)
    })
    if (recurringMachineRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:recurring-machine-senders',
        label: 'Recurring machine senders',
        grouping: 'sender',
        reason:
          'High-volume machine-style sender streams grouped for quick keep/deprioritize decisions.',
        rows: recurringMachineRows,
        confidence: 'high',
        risk: 'low',
        safeAction: 'Archive selected sender slices after keep/deprioritize policy review.',
      })
    }

    const oneOffSenderSet = new Set(
      Array.from(senderCounts.entries())
        .filter(([, count]) => count <= 2)
        .map(([sender]) => sender)
    )
    const oneOffRows = params.matchedRows.filter((row) => {
      const sender = normalizeSender(row.sender || '') || 'unknown'
      if (!oneOffSenderSet.has(sender)) return false
      if (row.is_starred || row.is_important) return false
      return rowRecencyBucket(row, nowMs) !== 'last_30d'
    })
    if (oneOffRows.length >= minSemanticBucketSize) {
      pushUnit({
        id: 'semantic:one-off-low-value-senders',
        label: 'One-off low-value senders',
        grouping: 'mixed',
        reason:
          'Low-frequency senders grouped to avoid spending review time on long-tail one-offs.',
        rows: oneOffRows,
        confidence: 'directional',
        risk: 'low',
        safeAction: 'Archive selected one-off senders after quick spot-check.',
      })
    }

    if (units.length >= 3) {
      const semanticTop = units
        .sort((a, b) => b.unit.total_messages - a.unit.total_messages)
        .slice(0, QUERY_CLUSTER_REVIEW_UNITS_MAX)
      const coveredIds = new Set<string>()
      for (const definition of semanticTop) {
        for (const row of definition.rows) coveredIds.add(row.message_id)
      }
      const mixedRows = params.matchedRows.filter((row) => !coveredIds.has(row.message_id))
      if (
        mixedRows.length >= Math.max(25, Math.round(sampleTotal * 0.01)) &&
        semanticTop.length < QUERY_CLUSTER_REVIEW_UNITS_MAX
      ) {
        const boundedRows = boundReviewUnitRows(mixedRows)
        const span = rowsDateSpan(boundedRows)
        semanticTop.push({
          unit: {
            unit_id: 'semantic:mixed-remaining',
            label: 'Mixed remaining backlog',
            grouping: 'mixed',
            reason:
              boundedRows.length < mixedRows.length
                ? `Remaining messages not captured by top buckets. Bounded to ${QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES.toLocaleString()} rows for review performance.`
                : 'Remaining messages not captured by top buckets.',
            total_messages: boundedRows.length,
            distinct_senders: distinctSendersCount(boundedRows),
            cluster_share_pct: clusterSharePct({
              unitCount: boundedRows.length,
              clusterCount: clusterTotal,
            }),
            date_span_start: span.start,
            date_span_end: span.end,
            confidence: 'directional',
            risk: 'medium',
            protections_active: summarizeProtectionSignals(boundedRows),
            likely_safe_action: 'Review remaining mixed items after high-signal buckets.',
          },
          rows: boundedRows,
        })
      }
      return semanticTop
        .sort((a, b) => b.unit.total_messages - a.unit.total_messages)
        .slice(0, QUERY_CLUSTER_REVIEW_UNITS_MAX)
    }
  }

  const topSenders = Array.from(senderBuckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
  for (const [sender, rows] of topSenders) {
    if (rows.length < Math.max(15, Math.round(sampleTotal * 0.01))) continue
    pushUnit({
      id: `sender:${sender}`,
      label: sender,
      grouping: 'sender',
      reason: 'High-volume sender slice for bounded cleanup review.',
      rows,
      confidence: rows.length >= 120 ? 'high' : 'moderate',
      risk: rows.some((row) => row.is_starred || row.is_important) ? 'medium' : 'low',
      safeAction: 'Archive selected low-value messages from this sender after approval.',
    })
  }

  const topDomains = Array.from(domainBuckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
  for (const [domain, rows] of topDomains) {
    if (domain === 'unknown-domain') continue
    if (rows.length < Math.max(30, Math.round(sampleTotal * 0.02))) continue
    pushUnit({
      id: `domain:${domain}`,
      label: domain,
      grouping: 'domain',
      reason: 'Domain-level batch to review recurring traffic sources together.',
      rows,
      confidence: rows.length >= 150 ? 'high' : 'moderate',
      risk: rows.some((row) => row.is_starred || row.is_important) ? 'medium' : 'low',
      safeAction: 'Review and archive low-action domain traffic; keep protected senders.',
    })
  }

  const topPatterns = Array.from(patternBuckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
  for (const [pattern, rows] of topPatterns) {
    if (rows.length < Math.max(25, Math.round(sampleTotal * 0.015))) continue
    pushUnit({
      id: `pattern:${pattern.toLowerCase().replace(/\s+/g, '_')}`,
      label: pattern,
      grouping: 'pattern',
      reason: 'Message-type slice grouped by dominant subject pattern.',
      rows,
      confidence: rows.length >= 100 ? 'moderate' : 'directional',
      risk: pattern.includes('Human') || pattern.includes('Alerts') ? 'medium' : 'low',
      safeAction: 'Archive only if the pattern remains low-action after sender/message checks.',
    })
  }

  const recencyOrder: Array<{
    key: 'last_30d' | '31_90d' | '91_180d' | 'older_180d'
    label: string
    reason: string
  }> = [
    { key: 'last_30d', label: 'Recent (last 30 days)', reason: 'Recent traffic slice for cautious review.' },
    { key: '31_90d', label: 'Mid-term (31-90 days)', reason: 'Mid-term traffic with moderate cleanup confidence.' },
    {
      key: '91_180d',
      label: 'Backlog (91-180 days)',
      reason: 'Older backlog with moderate-to-high cleanup confidence.',
    },
    {
      key: 'older_180d',
      label: 'Old backlog (180d+)',
      reason: 'Oldest backlog slice for highest-impact conservative cleanup.',
    },
  ]
  for (const entry of recencyOrder) {
    const rows = recencyBuckets.get(entry.key) || []
    if (rows.length < Math.max(20, Math.round(sampleTotal * 0.01))) continue
    pushUnit({
      id: `recency:${entry.key}`,
      label: entry.label,
      grouping: 'recency',
      reason: entry.reason,
      rows,
      confidence: entry.key === 'older_180d' ? 'high' : 'moderate',
      risk: entry.key === 'last_30d' ? 'medium' : 'low',
      safeAction:
        entry.key === 'last_30d'
          ? 'Review carefully; recent messages may still need action.'
          : 'Archive low-value backlog after sender/message exclusions.',
    })
  }

  const boundedTop = units
    .sort((a, b) => b.unit.total_messages - a.unit.total_messages)
    .slice(0, QUERY_CLUSTER_REVIEW_UNITS_MAX)

  const coveredIds = new Set<string>()
  for (const definition of boundedTop) {
    for (const row of definition.rows) {
      coveredIds.add(row.message_id)
    }
  }
  const mixedRows = params.matchedRows.filter((row) => !coveredIds.has(row.message_id))
  if (mixedRows.length >= Math.max(25, Math.round(sampleTotal * 0.01))) {
    pushUnit({
      id: 'mixed:remaining',
      label: 'Mixed remaining traffic',
      grouping: 'mixed',
      reason: 'Residual set not covered by dominant sender/domain/pattern slices.',
      rows: mixedRows,
      confidence: 'directional',
      risk: 'medium',
      safeAction: 'Review this mixed remainder after top-impact slices.',
    })
  }

  if (boundedTop.length === 0 && units.length === 0) {
    const boundedRows = boundReviewUnitRows(params.matchedRows)
    const span = rowsDateSpan(boundedRows)
    return [
      {
        unit: {
          unit_id: 'all:cluster',
          label: 'All cluster messages',
          grouping: 'mixed',
          reason:
            boundedRows.length < params.matchedRows.length
              ? `Single bounded review unit for this cluster. Bounded to ${QUERY_CLUSTER_REVIEW_UNIT_MAX_MESSAGES.toLocaleString()} most recent messages for review performance.`
              : 'Single bounded review unit for this cluster.',
          total_messages: boundedRows.length,
          distinct_senders: distinctSendersCount(boundedRows),
          cluster_share_pct: clusterSharePct({
            unitCount: boundedRows.length,
            clusterCount: clusterTotal,
          }),
          date_span_start: span.start,
          date_span_end: span.end,
          confidence: 'directional',
          risk: 'medium',
          protections_active: summarizeProtectionSignals(boundedRows),
          likely_safe_action: 'Review and archive selected low-value subset after approval.',
        },
        rows: boundedRows,
      },
    ]
  }

  return units
    .sort((a, b) => b.unit.total_messages - a.unit.total_messages)
    .slice(0, QUERY_CLUSTER_REVIEW_UNITS_MAX)
}

export async function browseIndexedGmailQueryClusterMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  clusterId: string
  clusterType: string
  title: string
  query: string
  analysisScope?: GmailAnalysisScope
  reviewUnitId?: string
  page?: number
  pageSize?: number
  sort?: 'newest' | 'oldest'
  interactionFilter?: 'all' | 'unread' | 'starred_or_important' | 'no_recent_interaction_90d'
  logPrefix?: string
}): Promise<GmailQueryClusterBrowserResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/query-cluster-browser]'
  const clusterId = typeof params.clusterId === 'string' ? params.clusterId.trim() : ''
  const clusterType = typeof params.clusterType === 'string' ? params.clusterType.trim() : ''
  const title = typeof params.title === 'string' ? params.title.trim() : ''
  const query = typeof params.query === 'string' ? params.query.trim() : ''
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const requestedReviewUnitId =
    typeof params.reviewUnitId === 'string' && params.reviewUnitId.trim()
      ? params.reviewUnitId.trim()
      : null
  const page = Math.max(1, Math.floor(params.page ?? 1))
  const pageSize = Math.min(Math.max(Math.floor(params.pageSize ?? 50), 10), 200)
  const sort: 'newest' | 'oldest' = params.sort === 'oldest' ? 'oldest' : 'newest'
  const interactionFilter: GmailQueryClusterBrowserData['interaction_filter'] =
    params.interactionFilter === 'unread' ||
    params.interactionFilter === 'starred_or_important' ||
    params.interactionFilter === 'no_recent_interaction_90d'
      ? params.interactionFilter
      : 'all'

  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  if (!clusterId || !clusterType || !title || !query) {
    return fail(400, 'cluster_id, cluster_type, title, and query are required for browse_query_cluster.')
  }

  try {
    const browseStartedAtMs = Date.now()
    const cacheKey = queryClusterMatchCacheKey({
      tenantId: params.tenantId,
      clusterId,
      clusterType,
      query,
      analysisScope,
    })
    const nowMs = Date.now()
    let cacheEntry =
      queryClusterMatchCache.get(cacheKey) &&
      (queryClusterMatchCache.get(cacheKey) as QueryClusterMatchCacheEntry).expires_at_ms > nowMs
        ? (queryClusterMatchCache.get(cacheKey) as QueryClusterMatchCacheEntry)
        : null
    const cacheHit = Boolean(cacheEntry)

    const [coverage, resolvedEntry] = await Promise.all([
      loadGmailMailboxIndexCoverageForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      }),
      (async (): Promise<QueryClusterMatchCacheEntry> => {
        if (cacheEntry) return cacheEntry
        const inflight = queryClusterMatchInflight.get(cacheKey)
        if (inflight) return inflight

        const resolveEntry = (async (): Promise<QueryClusterMatchCacheEntry> => {
          const fastPath = await loadQueryClusterFastPathRows({
            supabase: params.supabase,
            tenantId: params.tenantId,
            clusterType,
            title,
            analysisScope,
            nowMs,
          })
          let resolvedRows: GmailMailboxIndexRow[] = []
          if (fastPath) {
            resolvedRows = fastPath.matchedRows
          } else {
            const indexedRows = await loadIndexedGmailMessagesForTenant({
              supabase: params.supabase,
              tenantId: params.tenantId,
              limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            })
            const selectedScopeDays = scopeDays(analysisScope)
            const inboxRows = indexedRows.filter((row) => row.is_in_inbox)
            const scopedRows =
              selectedScopeDays != null
                ? inboxRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
                : inboxRows
            resolvedRows = scopedRows.filter((row) =>
              matchClusterFromIndexRow({
                row,
                clusterId,
                clusterType,
                title,
                query,
                nowMs,
              })
            )
          }
          const clusterTotalMatchingCount = fastPath
            ? fastPath.clusterTotalMatchingCount
            : resolvedRows.length
          const reviewUnitDefinitions = buildQueryClusterReviewUnitDefinitions({
            clusterId,
            clusterType,
            matchedRows: resolvedRows,
            clusterTotalCount: clusterTotalMatchingCount,
          })
          const entry: QueryClusterMatchCacheEntry = {
            expires_at_ms: nowMs + QUERY_CLUSTER_MATCH_CACHE_TTL_MS,
            matched_rows: resolvedRows,
            review_unit_definitions: reviewUnitDefinitions,
            review_units: reviewUnitDefinitions.map((definition) => definition.unit),
            cluster_total_matching_count: clusterTotalMatchingCount,
            fast_path_applied: fastPath?.fastPathApplied || null,
          }
          queryClusterMatchCache.set(cacheKey, entry)
          return entry
        })()

        queryClusterMatchInflight.set(cacheKey, resolveEntry)
        try {
          return await resolveEntry
        } finally {
          queryClusterMatchInflight.delete(cacheKey)
        }
      })(),
    ])
    cacheEntry = resolvedEntry
    const allMatchedRows = cacheEntry.matched_rows
    const clusterTotalMatchingCount = Math.max(
      cacheEntry.cluster_total_matching_count || 0,
      allMatchedRows.length
    )
    const reviewUnits = cacheEntry.review_units
    const selectedReviewUnitDefinition =
      cacheEntry.review_unit_definitions.find(
        (entry) => requestedReviewUnitId && entry.unit.unit_id === requestedReviewUnitId
      ) ||
      cacheEntry.review_unit_definitions[0] ||
      null
    const selectedReviewUnit =
      selectedReviewUnitDefinition?.unit ||
      ({
        unit_id: 'all:cluster',
        label: 'All cluster messages',
        grouping: 'mixed',
        reason:
          allMatchedRows.length < clusterTotalMatchingCount
            ? `Single bounded review unit. Loaded ${allMatchedRows.length.toLocaleString()} rows from ${clusterTotalMatchingCount.toLocaleString()} total matching rows for performance.`
            : 'Single bounded review unit for this cluster.',
        total_messages: allMatchedRows.length,
        distinct_senders: distinctSendersCount(allMatchedRows),
        cluster_share_pct: 100,
        date_span_start: rowsDateSpan(allMatchedRows).start,
        date_span_end: rowsDateSpan(allMatchedRows).end,
        confidence: 'directional',
        risk: 'medium',
        protections_active: summarizeProtectionSignals(allMatchedRows),
        likely_safe_action: 'Review and archive selected low-value subset after approval.',
      } satisfies GmailQueryClusterReviewUnit)
    const unitRows = selectedReviewUnitDefinition
      ? selectedReviewUnitDefinition.rows
      : allMatchedRows
    const filteredRows =
      interactionFilter === 'unread'
        ? unitRows.filter((row) => row.is_unread)
        : interactionFilter === 'starred_or_important'
          ? unitRows.filter((row) => row.is_starred || row.is_important)
          : interactionFilter === 'no_recent_interaction_90d'
            ? unitRows.filter((row) => isRowLikelyNoRecentInteraction(row, nowMs))
            : unitRows
    const sortedRows = [...filteredRows].sort((a, b) => {
      const left = a.internal_date_ms || 0
      const right = b.internal_date_ms || 0
      return sort === 'oldest' ? left - right : right - left
    })
    const totalMatchingCount = sortedRows.length
    const offset = (page - 1) * pageSize
    const pageRows = sortedRows.slice(offset, offset + pageSize)
    const rangeStart = totalMatchingCount === 0 ? 0 : offset + 1
    const rangeEnd = totalMatchingCount === 0 ? 0 : Math.min(offset + pageRows.length, totalMatchingCount)
    const effectiveDiscoveryWindowDays: GmailQueryClusterBrowserData['effective_discovery_window_days'] =
      analysisScope === 'all_indexed'
        ? 'all_indexed'
        : (scopeDays(analysisScope) as 7 | 30 | 60 | 90 | 180 | 365)
    const senderBreakdown = buildQueryClusterBrowserSenderBreakdown({
      rows: filteredRows,
      cleanupGroupRows: allMatchedRows,
      previewLimit: 8,
    })
    const analyticsSummary = {
      ...buildQueryClusterBrowserAnalyticsSummary({
        rows: filteredRows,
        nowMs,
      }),
      top_senders: senderBreakdown.slice(0, 6).map((entry) => ({
        label: entry.sender,
        count: entry.batch_message_count,
      })),
    }

    console.info(
      `${logPrefix} ${JSON.stringify({
        cluster_id: clusterId,
        cache_hit: cacheHit,
        fast_path_applied: cacheEntry.fast_path_applied,
        selected_review_unit_id: selectedReviewUnit.unit_id,
        selected_review_unit_label: selectedReviewUnit.label,
        selected_analysis_scope: analysisScope,
        effective_discovery_window_days: effectiveDiscoveryWindowDays,
        indexed_total_rows: coverage.indexed_total_rows,
        indexed_inbox_rows: coverage.indexed_inbox_rows,
        discovery_rows_used: allMatchedRows.length,
        rows_scanned: allMatchedRows.length,
        cluster_total_matching_count: clusterTotalMatchingCount,
        selected_unit_matching_count: totalMatchingCount,
        page,
        page_size: pageSize,
        interaction_filter: interactionFilter,
        duration_ms: Math.max(0, Date.now() - browseStartedAtMs),
      })}`
    )

    return {
      ok: true,
      data: {
        cluster_id: clusterId,
        cluster_type: clusterType,
        title,
        cache_hit: cacheHit,
        fast_path_applied: cacheEntry.fast_path_applied,
        analysis_scope: analysisScope,
        effective_discovery_window_days: effectiveDiscoveryWindowDays,
        indexed_total_rows: coverage.indexed_total_rows,
        indexed_inbox_rows: coverage.indexed_inbox_rows,
        indexed_date_span_start: coverage.indexed_date_span_start,
        indexed_date_span_end: coverage.indexed_date_span_end,
        inbox_rows_considered: clusterTotalMatchingCount,
        discovery_rows_used: allMatchedRows.length,
        rows_scanned: allMatchedRows.length,
        cluster_total_matching_count: clusterTotalMatchingCount,
        review_units: reviewUnits,
        selected_review_unit_id: selectedReviewUnit.unit_id,
        selected_review_unit: selectedReviewUnit,
        total_matching_count: totalMatchingCount,
        page,
        page_size: pageSize,
        range_start: rangeStart,
        range_end: rangeEnd,
        has_next_page: rangeEnd < totalMatchingCount,
        has_previous_page: page > 1,
        sort,
        interaction_filter: interactionFilter,
        analytics_summary: analyticsSummary,
        sender_breakdown: senderBreakdown,
        messages: pageRows.map((row) => asPreviewMessage(row)),
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while browsing query-cluster evidence.')
  }
}

function cleanupArtifactRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function cleanupArtifactText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanupArtifactNullableText(value: unknown): string | null {
  const normalized = cleanupArtifactText(value)
  return normalized || null
}

function cleanupArtifactInteger(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback
}

function parseCleanupArtifactTopSenders(
  value: unknown
): GmailCleanupGroupIntelligenceData['top_senders'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const sender = cleanupArtifactText(record.sender)
          const senderKey = cleanupArtifactText(record.sender_key)
          if (!sender || !senderKey) return null
          return {
            sender,
            sender_key: senderKey,
            message_count: cleanupArtifactInteger(record.message_count),
            share_pct: cleanupArtifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['top_senders'][number] => entry != null
        )
    : []
}

function parseCleanupArtifactSenderVolumeDistribution(
  value: unknown
): GmailCleanupGroupIntelligenceData['sender_volume_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            sender_count: cleanupArtifactInteger(record.sender_count),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['sender_volume_distribution'][number] =>
            entry != null
        )
    : []
}

function parseCleanupArtifactTimelineComposition(
  value: unknown
): GmailCleanupGroupIntelligenceData['activity_timeline'][number]['composition'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            count: cleanupArtifactInteger(record.count),
            share_pct: cleanupArtifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['activity_timeline'][number]['composition'][number] =>
            entry != null
        )
    : []
}

function parseCleanupArtifactTimelineSignals(
  value: unknown
): GmailCleanupGroupIntelligenceData['activity_timeline'][number]['evidence_signals'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            count: cleanupArtifactInteger(record.count),
            share_pct: cleanupArtifactInteger(record.share_pct),
            exactness: record.exactness === 'actual' ? 'actual' : 'inferred',
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['activity_timeline'][number]['evidence_signals'][number] =>
            entry != null
        )
    : []
}

function parseCleanupArtifactActivityTimeline(
  value: unknown
): GmailCleanupGroupIntelligenceData['activity_timeline'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            count: cleanupArtifactInteger(record.count),
            composition: parseCleanupArtifactTimelineComposition(record.composition),
            evidence_signals: parseCleanupArtifactTimelineSignals(record.evidence_signals),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['activity_timeline'][number] => entry != null
        )
    : []
}

function parseCleanupArtifactCategoryBreakdown(
  value: unknown
): GmailCleanupGroupIntelligenceData['category_breakdown'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            count: cleanupArtifactInteger(record.count),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['category_breakdown'][number] => entry != null
        )
    : []
}

function parseCleanupArtifactHumanVsAutomation(
  value: unknown
): GmailCleanupGroupIntelligenceData['human_vs_automation'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const label = cleanupArtifactText(record.label)
          if (!label) return null
          return {
            label,
            count: cleanupArtifactInteger(record.count),
            exactness: 'inferred' as const,
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['human_vs_automation'][number] =>
            entry != null
        )
    : []
}

function parseCleanupArtifactSenderRanking(params: {
  value: unknown
  cleanupGroupTotalMessages: number
}): GmailCleanupGroupIntelligenceData['sender_ranking'] {
  return Array.isArray(params.value)
    ? params.value
        .map((entry) => {
          const record = cleanupArtifactRecord(entry)
          if (!record) return null
          const sender = cleanupArtifactText(record.sender)
          const senderKey = cleanupArtifactText(record.sender_key)
          if (!sender || !senderKey) return null
          const messageCount = cleanupArtifactInteger(
            record.cleanup_candidate_message_count,
            cleanupArtifactInteger(record.message_count)
          )
          const senderSignal = cleanupArtifactNullableText(record.sender_signal)
          return {
            sender,
            sender_key: senderKey,
            message_count: messageCount,
            share_pct:
              params.cleanupGroupTotalMessages > 0
                ? Math.round((messageCount / params.cleanupGroupTotalMessages) * 100)
                : 0,
            unread_count: cleanupArtifactInteger(record.unread_count),
            important_count: 0,
            starred_count: 0,
            first_seen: cleanupArtifactNullableText(record.first_seen),
            last_seen: cleanupArtifactNullableText(record.last_seen),
            category_summary: cleanupArtifactNullableText(record.category_summary) || 'General updates',
            sender_signal:
              senderSignal === 'likely_machine_generated' || senderSignal === 'likely_human'
                ? senderSignal
                : 'uncertain',
          }
        })
        .filter(
          (
            entry
          ): entry is GmailCleanupGroupIntelligenceData['sender_ranking'][number] => entry != null
        )
    : []
}

function buildSafePartialCleanupGroupIntelligenceFromArtifact(params: {
  analysisScope: GmailAnalysisScope
  clusters: Array<{
    cluster_id: string
    cluster_type: string
    title: string
    query: string
  }>
  publication: GmailArtifactPublicationRow | null
  snapshotPayload: Record<string, unknown>
  summaries: GmailClusterSummaryArtifactRow[]
  reason: string
  logPrefix: string
}): GmailCleanupGroupIntelligenceData {
  const wholeMailbox = cleanupArtifactRecord(params.snapshotPayload.whole_mailbox) || {}
  const cleanupCandidate = cleanupArtifactRecord(params.snapshotPayload.cleanup_candidate_universe) || {}
  const cleanupGroupTotalMessages =
    cleanupArtifactInteger(cleanupCandidate.message_count) ||
    params.summaries.reduce((sum, summary) => sum + cleanupArtifactInteger(summary.message_count), 0)

  console.info(
    `${params.logPrefix} ${JSON.stringify({
      selected_analysis_scope: params.analysisScope,
      artifact_version: params.publication?.published_version || null,
      mode: 'safe_partial',
      reason: params.reason,
      cluster_count: params.summaries.length || params.clusters.length,
      cleanup_group_total_messages: cleanupGroupTotalMessages,
      indexed_total_rows:
        cleanupArtifactInteger(params.publication?.last_indexed_message_count) ||
        cleanupArtifactInteger(wholeMailbox.message_count),
      indexed_inbox_rows: cleanupArtifactInteger(wholeMailbox.indexed_inbox_rows),
      duration_ms: 0,
    })}`
  )

  return {
    analysis_scope: params.analysisScope,
    effective_discovery_window_days: cleanupGroupEffectiveDiscoveryWindow(params.analysisScope),
    cluster_count: params.summaries.length || params.clusters.length,
    cleanup_group_total_messages: cleanupGroupTotalMessages,
    cleanup_group_sender_count: cleanupArtifactInteger(cleanupCandidate.sender_count),
    indexed_total_rows:
      cleanupArtifactInteger(params.publication?.last_indexed_message_count) ||
      cleanupArtifactInteger(wholeMailbox.message_count),
    indexed_inbox_rows: cleanupArtifactInteger(wholeMailbox.indexed_inbox_rows),
    indexed_date_span_start: cleanupArtifactNullableText(wholeMailbox.indexed_date_span_start),
    indexed_date_span_end: cleanupArtifactNullableText(wholeMailbox.indexed_date_span_end),
    cleanup_date_span_start: cleanupArtifactNullableText(cleanupCandidate.cleanup_date_span_start),
    cleanup_date_span_end: cleanupArtifactNullableText(cleanupCandidate.cleanup_date_span_end),
    top_senders: parseCleanupArtifactTopSenders(cleanupCandidate.top_senders),
    sender_volume_distribution: parseCleanupArtifactSenderVolumeDistribution(
      cleanupCandidate.sender_volume_distribution
    ),
    activity_timeline: parseCleanupArtifactActivityTimeline(cleanupCandidate.activity_timeline),
    activity_timeline_granularity:
      cleanupCandidate.activity_timeline_granularity === 'day'
        ? 'day'
        : cleanupCandidate.activity_timeline_granularity === 'week'
          ? 'week'
          : 'month',
    category_breakdown: parseCleanupArtifactCategoryBreakdown(cleanupCandidate.category_breakdown),
    human_vs_automation: parseCleanupArtifactHumanVsAutomation(cleanupCandidate.human_vs_automation),
    sender_ranking: parseCleanupArtifactSenderRanking({
      value: params.snapshotPayload.sender_ranking,
      cleanupGroupTotalMessages,
    }),
    source: 'gmail_index_cache',
  }
}

function cleanupGroupEffectiveDiscoveryWindow(
  analysisScope: GmailAnalysisScope
): GmailCleanupGroupIntelligenceData['effective_discovery_window_days'] {
  if (analysisScope === '7d') return 7
  if (analysisScope === '30d') return 30
  if (analysisScope === '60d') return 60
  if (analysisScope === '90d') return 90
  if (analysisScope === '180d') return 180
  if (analysisScope === '365d') return 365
  return 'all_indexed'
}

export async function loadGmailCleanupGroupIntelligenceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  clusters: Array<{
    cluster_id: string
    cluster_type: string
    title: string
    query: string
  }>
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  logPrefix?: string
}): Promise<GmailCleanupGroupIntelligenceResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/cleanup-group-intelligence]'
  const startedAt = Date.now()
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)

  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')

  const clusters = params.clusters
    .map((cluster) => ({
      cluster_id: cluster.cluster_id.trim(),
      cluster_type: cluster.cluster_type.trim(),
      title: cluster.title.trim(),
      query: cluster.query.trim(),
    }))
    .filter((cluster) => cluster.cluster_id && cluster.cluster_type && cluster.title && cluster.query)
    .slice(0, 25)

  if (clusters.length === 0) {
    return fail(400, 'clusters[] is required for cleanup_group_intelligence.')
  }

  const cacheKey = cleanupGroupIntelligenceCacheKey({
    tenantId: params.tenantId,
    analysisScope,
    clusters,
  }) + `|||${params.cacheVersion || 'default'}`
  const nowMs = Date.now()
  const cached = cleanupGroupIntelligenceCache.get(cacheKey)
  if (cached && cached.expires_at_ms > nowMs) {
    console.info(
      `${logPrefix} ${JSON.stringify({
        selected_analysis_scope: analysisScope,
        effective_discovery_window_days: cached.data.effective_discovery_window_days,
        cluster_count: clusters.length,
        cleanup_group_total_messages: cached.data.cleanup_group_total_messages,
        cleanup_group_sender_count: cached.data.cleanup_group_sender_count,
        indexed_total_rows: cached.data.indexed_total_rows,
        indexed_inbox_rows: cached.data.indexed_inbox_rows,
        cache_hit: true,
        coverage_load_ms: 0,
        indexed_rows_load_ms: 0,
        matching_ms: 0,
        build_ms: 0,
        duration_ms: 0,
      })}`
    )
    return { ok: true, data: cached.data }
  }

  const inflight = cleanupGroupIntelligenceInflight.get(cacheKey)
  if (inflight) return inflight

  const requestPromise = (async (): Promise<GmailCleanupGroupIntelligenceResult> => {
    try {
      const artifactRead = await loadPublishedGmailMailboxIntelligenceArtifact({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope,
        includeBuckets: false,
      })
      const snapshotPayload = cleanupArtifactRecord(artifactRead.snapshot?.snapshot_payload) || {}
      const intelligence =
        artifactRead.publication?.published_version && artifactRead.snapshot
          ? (() => {
              const wholeMailbox = cleanupArtifactRecord(snapshotPayload.whole_mailbox) || {}
              const cleanupCandidate =
                cleanupArtifactRecord(snapshotPayload.cleanup_candidate_universe) || {}
              const cleanupGroupTotalMessages =
                cleanupArtifactInteger(cleanupCandidate.message_count) ||
                artifactRead.cluster_summaries.reduce(
                  (sum, summary) => sum + cleanupArtifactInteger(summary.message_count),
                  0
                )

              const data: GmailCleanupGroupIntelligenceData = {
                analysis_scope: analysisScope,
                effective_discovery_window_days: cleanupGroupEffectiveDiscoveryWindow(analysisScope),
                cluster_count: artifactRead.cluster_summaries.length || clusters.length,
                cleanup_group_total_messages: cleanupGroupTotalMessages,
                cleanup_group_sender_count: cleanupArtifactInteger(cleanupCandidate.sender_count),
                indexed_total_rows:
                  cleanupArtifactInteger(artifactRead.publication.last_indexed_message_count) ||
                  cleanupArtifactInteger(wholeMailbox.message_count),
                indexed_inbox_rows: cleanupArtifactInteger(wholeMailbox.indexed_inbox_rows),
                indexed_date_span_start: cleanupArtifactNullableText(wholeMailbox.indexed_date_span_start),
                indexed_date_span_end: cleanupArtifactNullableText(wholeMailbox.indexed_date_span_end),
                cleanup_date_span_start: cleanupArtifactNullableText(
                  cleanupCandidate.cleanup_date_span_start
                ),
                cleanup_date_span_end: cleanupArtifactNullableText(
                  cleanupCandidate.cleanup_date_span_end
                ),
                top_senders: parseCleanupArtifactTopSenders(cleanupCandidate.top_senders),
                sender_volume_distribution: parseCleanupArtifactSenderVolumeDistribution(
                  cleanupCandidate.sender_volume_distribution
                ),
                activity_timeline: parseCleanupArtifactActivityTimeline(
                  cleanupCandidate.activity_timeline
                ),
                activity_timeline_granularity:
                  cleanupCandidate.activity_timeline_granularity === 'day'
                    ? 'day'
                    : cleanupCandidate.activity_timeline_granularity === 'week'
                      ? 'week'
                      : 'month',
                category_breakdown: parseCleanupArtifactCategoryBreakdown(
                  cleanupCandidate.category_breakdown
                ),
                human_vs_automation: parseCleanupArtifactHumanVsAutomation(
                  cleanupCandidate.human_vs_automation
                ),
                sender_ranking: parseCleanupArtifactSenderRanking({
                  value: snapshotPayload.sender_ranking,
                  cleanupGroupTotalMessages,
                }),
                source: 'gmail_index_cache',
              }

              console.info(
                `${logPrefix} ${JSON.stringify({
                  selected_analysis_scope: analysisScope,
                  effective_discovery_window_days: data.effective_discovery_window_days,
                  artifact_version: artifactRead.artifact_version,
                  cluster_count: data.cluster_count,
                  cleanup_group_total_messages: data.cleanup_group_total_messages,
                  cleanup_group_sender_count: data.cleanup_group_sender_count,
                  indexed_total_rows: data.indexed_total_rows,
                  indexed_inbox_rows: data.indexed_inbox_rows,
                  cache_hit: false,
                  artifact_mode: 'published_artifact',
                  artifact_freshness_state: artifactRead.publication?.freshness_state ?? null,
                  artifact_refresh_strategy: artifactRead.publication?.refresh_strategy ?? null,
                  cluster_summary_count: artifactRead.cluster_summaries.length,
                  duration_ms: Math.max(0, Date.now() - startedAt),
                })}`
              )

              return data
            })()
          : buildSafePartialCleanupGroupIntelligenceFromArtifact({
              analysisScope,
              clusters,
              publication: artifactRead.publication,
              snapshotPayload,
              summaries: artifactRead.cluster_summaries,
              reason: artifactRead.publication?.published_version
                ? 'missing_mailbox_snapshot'
                : 'missing_published_artifact',
              logPrefix,
            })

      cleanupGroupIntelligenceCache.set(cacheKey, {
        expires_at_ms: Date.now() + CLEANUP_GROUP_INTELLIGENCE_CACHE_TTL_MS,
        data: intelligence,
      })

      return {
        ok: true,
        data: intelligence,
      }
    } catch (error) {
      console.error(`${logPrefix} safe-partial fallback:`, error)
      const safePartial = buildSafePartialCleanupGroupIntelligenceFromArtifact({
        analysisScope,
        clusters,
        publication: null,
        snapshotPayload: {},
        summaries: [],
        reason: 'artifact_read_error',
        logPrefix,
      })
      cleanupGroupIntelligenceCache.set(cacheKey, {
        expires_at_ms: Date.now() + CLEANUP_GROUP_INTELLIGENCE_CACHE_TTL_MS,
        data: safePartial,
      })
      return { ok: true, data: safePartial }
    } finally {
      cleanupGroupIntelligenceInflight.delete(cacheKey)
    }
  })()

  cleanupGroupIntelligenceInflight.set(cacheKey, requestPromise)
  return requestPromise
}

export async function loadGmailSenderIndexSignalsForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  senders: string[]
  logPrefix?: string
  queryMode?: 'sender_detail' | 'sender_page'
}): Promise<GmailSenderIndexSignalsResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/sender-index-signals]'
  const startedAt = Date.now()
  const queryMode = params.queryMode === 'sender_detail' ? 'sender_detail' : 'sender_page'
  const phaseMs = {
    sender_stats_query_ms: 0,
    message_rows_query_ms: 0,
    indexed_count_query_ms: 0,
    index_state_load_ms: 0,
    aggregate_ms: 0,
  }

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  const normalizedSenders = Array.from(
    new Set(
      (params.senders || [])
        .map((entry) => normalizeSender(entry || ''))
        .filter(Boolean)
    )
  ).slice(0, 25)

  if (normalizedSenders.length === 0) {
    return {
      ok: true,
      data: {
        senders: [],
        indexed_message_count: 0,
        mailbox_estimated_total: null,
        index_completion_pct: null,
        source: 'gmail_index_cache',
      },
    }
  }

  const nowMs = Date.now()
  const threshold30d = nowMs - 30 * 24 * 60 * 60 * 1000
  const threshold60d = nowMs - 60 * 24 * 60 * 60 * 1000
  const threshold90d = nowMs - 90 * 24 * 60 * 60 * 1000
  const threshold180d = nowMs - 180 * 24 * 60 * 60 * 1000
  const senderSignalMaxRows = queryMode === 'sender_detail' ? 2_000 : 0

  const senderStatsStartedAt = Date.now()
  const { data: senderStatsData, error: senderStatsError } = await params.supabase
    .from('gmail_sender_stats')
    .select(
      [
        'sender',
        'message_count',
        'recent_count_30d',
        'machine_probability',
        'human_probability',
        'last_seen',
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
    .in('sender', normalizedSenders)

  if (senderStatsError) {
    console.warn(`${logPrefix} sender stats query warning:`, senderStatsError.message)
  }
  phaseMs.sender_stats_query_ms = Math.max(0, Date.now() - senderStatsStartedAt)

  const messageRows: Array<{
    sender: string | null
    subject: string | null
    internal_date_ms: number | null
    is_unread: boolean
    is_important: boolean
    is_starred: boolean
    is_in_inbox: boolean
    category_labels: string[] | null
  }> = []
  if (senderSignalMaxRows > 0) {
    let senderRowsOffset = 0
    const messageRowsStartedAt = Date.now()
    while (messageRows.length < senderSignalMaxRows) {
      const rangeEnd = Math.min(
        senderRowsOffset + INDEX_QUERY_PAGE_SIZE - 1,
        senderSignalMaxRows - 1
      )
      const query = params.supabase
        .from('gmail_messages')
        .select(
          'sender,subject,internal_date_ms,is_unread,is_important,is_starred,is_in_inbox,category_labels'
        )
        .eq('tenant_id', params.tenantId)
        .in('sender', normalizedSenders)
        .gte('internal_date_ms', threshold180d)
        .order('internal_date_ms', { ascending: false })
        .order('message_id', { ascending: false })
        .range(senderRowsOffset, rangeEnd)

      const { data: pageRows, error: pageError } = await query

      if (pageError) {
        console.error(`${logPrefix} gmail_messages query failed:`, pageError)
        return fail(500, 'Failed to load indexed sender message signals.')
      }

      const rows = Array.isArray(pageRows)
        ? (pageRows as Array<{
            sender: string | null
            subject: string | null
            internal_date_ms: number | null
            is_unread: boolean
            is_important: boolean
            is_starred: boolean
            is_in_inbox: boolean
            category_labels: string[] | null
          }>)
        : []
      messageRows.push(...rows)
      if (rows.length < INDEX_QUERY_PAGE_SIZE) break
      senderRowsOffset += rows.length
    }

    if (messageRows.length >= senderSignalMaxRows) {
      console.warn(
        `${logPrefix} sender-signal rows capped at ${senderSignalMaxRows} for ${normalizedSenders.length} senders`
      )
    }
    phaseMs.message_rows_query_ms = Math.max(0, Date.now() - messageRowsStartedAt)
  }

  type SenderAggregate = {
    sender: string
    message_count_indexed: number
    recent_count_30d: number
    recent_count_60d: number
    recent_count_90d: number
    recent_count_180d: number
    unread_count: number
    important_count: number
    starred_count: number
    in_inbox_count: number
    category_counts: Map<string, number>
    pattern_counts: Map<string, number>
    machine_probability: number | null
    human_probability: number | null
    first_seen_ms: number | null
    last_seen: string | null
    last_seen_ms: number | null
    subject_hints: string[]
  }

  const senderStatsProfileBySender = new Map<
    string,
    {
      categoryProfile: ReturnType<typeof canonicalSenderProfileFromPersistedStats>
      patternMix: GmailSenderPatternMixEntry[]
      dominantPattern: string
      operatorProfile: GmailSenderOperatorProfile
      semanticFamily: GmailResolvedSemanticFamily
      semanticPattern: GmailResolvedSemanticPattern
    }
  >()

  const bySender = new Map<string, SenderAggregate>()
  for (const sender of normalizedSenders) {
    bySender.set(sender, {
      sender,
      message_count_indexed: 0,
      recent_count_30d: 0,
      recent_count_60d: 0,
      recent_count_90d: 0,
      recent_count_180d: 0,
      unread_count: 0,
      important_count: 0,
      starred_count: 0,
      in_inbox_count: 0,
      category_counts: new Map<string, number>(),
      pattern_counts: new Map<string, number>(),
      machine_probability: null,
      human_probability: null,
      first_seen_ms: null,
      last_seen: null,
      last_seen_ms: null,
      subject_hints: [],
    })
  }

  for (const row of messageRows) {
    const sender = normalizeSender(row.sender || '')
    const aggregate = bySender.get(sender)
    if (!aggregate) continue
    aggregate.message_count_indexed += 1
    if (row.is_unread) aggregate.unread_count += 1
    if (row.is_important) aggregate.important_count += 1
    if (row.is_starred) aggregate.starred_count += 1
    if (row.is_in_inbox) aggregate.in_inbox_count += 1
    const internalDateMs =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (typeof row.subject === 'string' && row.subject.trim() && aggregate.subject_hints.length < 12) {
      aggregate.subject_hints.push(row.subject.trim())
    }
    if (internalDateMs != null) {
      if (internalDateMs >= threshold30d) aggregate.recent_count_30d += 1
      if (internalDateMs >= threshold60d) aggregate.recent_count_60d += 1
      if (internalDateMs >= threshold90d) aggregate.recent_count_90d += 1
      if (internalDateMs >= threshold180d) aggregate.recent_count_180d += 1
      if (aggregate.first_seen_ms == null || internalDateMs < aggregate.first_seen_ms) {
        aggregate.first_seen_ms = internalDateMs
      }
      if (aggregate.last_seen_ms == null || internalDateMs > aggregate.last_seen_ms) {
        aggregate.last_seen_ms = internalDateMs
      }
    }
    for (const category of row.category_labels || []) {
      if (!category) continue
      aggregate.category_counts.set(category, (aggregate.category_counts.get(category) || 0) + 1)
    }
    const pattern = classifySenderPatternFromSubject(row.subject)
    aggregate.pattern_counts.set(pattern, (aggregate.pattern_counts.get(pattern) || 0) + 1)
  }

  for (const row of ((senderStatsData || []) as unknown as Array<{
    sender: string
    message_count: number
    recent_count_30d: number
    machine_probability: number
    human_probability: number
    last_seen: string | null
    category_distribution?: unknown
    categorized_message_count?: unknown
    uncategorized_message_count?: unknown
    multi_category_message_count?: unknown
    dominant_category?: unknown
    dominant_category_confidence?: unknown
    category_profile_mode?: unknown
    pattern_mix?: unknown
    dominant_pattern?: unknown
    operator_profile_family?: unknown
    operator_profile_mode?: unknown
    operator_profile_confidence?: unknown
    operator_profile_summary?: unknown
    operator_profile_reasons?: unknown
    operator_profile_source?: unknown
  }>)) {
    const sender = normalizeSender(row.sender || '')
    const aggregate = bySender.get(sender)
    if (!aggregate) continue
    if (Number.isFinite(row.message_count) && row.message_count > aggregate.message_count_indexed) {
      aggregate.message_count_indexed = Math.max(0, Math.round(row.message_count))
    }
    if (
      Number.isFinite(row.recent_count_30d) &&
      row.recent_count_30d > aggregate.recent_count_30d
    ) {
      aggregate.recent_count_30d = Math.max(0, Math.round(row.recent_count_30d))
    }
    aggregate.machine_probability =
      typeof row.machine_probability === 'number' && Number.isFinite(row.machine_probability)
        ? row.machine_probability
        : null
    aggregate.human_probability =
      typeof row.human_probability === 'number' && Number.isFinite(row.human_probability)
        ? row.human_probability
        : null
    aggregate.last_seen = typeof row.last_seen === 'string' ? row.last_seen : null
    const lastSeenMs =
      typeof row.last_seen === 'string' && row.last_seen.trim()
        ? Date.parse(row.last_seen)
        : Number.NaN
    if (Number.isFinite(lastSeenMs) && (aggregate.last_seen_ms == null || lastSeenMs > aggregate.last_seen_ms)) {
      aggregate.last_seen_ms = lastSeenMs
    }

    const categoryProfile = canonicalSenderProfileFromPersistedStats({
      categoryDistribution: row.category_distribution,
      categorizedMessageCount: row.categorized_message_count,
      uncategorizedMessageCount: row.uncategorized_message_count,
      multiCategoryMessageCount: row.multi_category_message_count,
      dominantCategory: row.dominant_category,
      dominantCategoryConfidence: row.dominant_category_confidence,
      categoryProfileMode: row.category_profile_mode,
    })
    const patternMix = normalizePatternMix(row.pattern_mix)
    const operatorProfile = operatorProfileFromPersistedStats({
      family: row.operator_profile_family,
      mode: row.operator_profile_mode,
      confidence: row.operator_profile_confidence,
      summary: row.operator_profile_summary,
      reasons: row.operator_profile_reasons,
      source: row.operator_profile_source,
    })
    const dominantPattern =
      patternMix.length > 0
        ? (typeof row.dominant_pattern === 'string' && row.dominant_pattern.trim()) ||
          patternMix[0]?.pattern ||
          GMAIL_PATTERN_LABEL_THIN_HISTORY
        : GMAIL_PATTERN_LABEL_THIN_HISTORY
    const semantic = resolveSenderSemanticsFromCompatibility({
      sender: row.sender,
      subjectHints: aggregate.subject_hints,
      totalMessageCount: row.message_count,
      categoryProfile,
      patternMix,
      dominantPattern,
      operatorProfile,
      machineProbability:
        typeof row.machine_probability === 'number' && Number.isFinite(row.machine_probability)
          ? row.machine_probability
          : null,
      humanProbability:
        typeof row.human_probability === 'number' && Number.isFinite(row.human_probability)
          ? row.human_probability
          : null,
      sourceKind: 'sender_stats',
    })
    senderStatsProfileBySender.set(sender, {
      categoryProfile,
      patternMix,
      dominantPattern,
      operatorProfile,
      semanticFamily: semantic.semantic_family,
      semanticPattern: semantic.semantic_pattern,
    })
  }

  let indexedMessageCount: number | null = null
  let indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null = null
  if (queryMode === 'sender_detail') {
    const indexedCountStartedAt = Date.now()
    const { count, error: indexedCountError } = await params.supabase
      .from('gmail_messages')
      .select('message_id', { count: 'exact', head: true })
      .eq('tenant_id', params.tenantId)
    if (indexedCountError) {
      console.warn(`${logPrefix} indexed count query warning:`, indexedCountError.message)
    }
    indexedMessageCount = typeof count === 'number' && Number.isFinite(count) ? count : 0
    phaseMs.indexed_count_query_ms = Math.max(0, Date.now() - indexedCountStartedAt)

    const indexStateStartedAt = Date.now()
    indexState = await loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    phaseMs.index_state_load_ms = Math.max(0, Date.now() - indexStateStartedAt)
  }

  const senders = Array.from(bySender.values())
    .sort((a, b) => b.message_count_indexed - a.message_count_indexed)
    .map((entry) => {
      const persistedProfile = senderStatsProfileBySender.get(entry.sender)
      const categoryProfile = persistedProfile?.categoryProfile || insufficientDataCanonicalSenderProfile()
      const patternMix = persistedProfile?.patternMix || []
      const operatorProfile = persistedProfile?.operatorProfile || insufficientDataOperatorProfile()
      const dominantPattern = persistedProfile?.dominantPattern || GMAIL_PATTERN_LABEL_THIN_HISTORY
      const semantic =
        persistedProfile != null
          ? {
              semantic_family: persistedProfile.semanticFamily,
              semantic_pattern: persistedProfile.semanticPattern,
            }
          : resolveSenderSemanticsFromCompatibility({
              sender: entry.sender,
              subjectHints: entry.subject_hints,
              totalMessageCount: entry.message_count_indexed,
              categoryProfile,
              patternMix,
              dominantPattern,
              operatorProfile,
              machineProbability: entry.machine_probability,
              humanProbability: entry.human_probability,
              sourceKind: 'sender_stats',
            })
      return {
        sender: entry.sender,
        message_count_indexed: entry.message_count_indexed,
        recent_count_30d: entry.recent_count_30d,
        recent_count_60d: entry.recent_count_60d,
        recent_count_90d: entry.recent_count_90d,
        recent_count_180d: entry.recent_count_180d,
        unread_count: entry.unread_count,
        important_count: entry.important_count,
        starred_count: entry.starred_count,
        in_inbox_count: entry.in_inbox_count,
        machine_probability: entry.machine_probability,
        human_probability: entry.human_probability,
        first_seen:
          entry.first_seen_ms != null ? new Date(entry.first_seen_ms).toISOString() : null,
        last_seen:
          entry.last_seen_ms != null
            ? new Date(entry.last_seen_ms).toISOString()
            : entry.last_seen,
        category_distribution: categoryProfile.category_distribution,
        categorized_message_count: categoryProfile.categorized_message_count,
        uncategorized_message_count: categoryProfile.uncategorized_message_count,
        multi_category_message_count: categoryProfile.multi_category_message_count,
        dominant_category: categoryProfile.dominant_category,
        dominant_category_confidence: categoryProfile.dominant_category_confidence,
        category_profile_mode: categoryProfile.category_profile_mode,
        category_summary: categoryProfile.category_summary,
        category_summary_source: categoryProfile.category_summary_source,
        category_mix: canonicalCategoryMixFromDistribution(categoryProfile.category_distribution),
        semantic_family: semantic.semantic_family,
        semantic_pattern: semantic.semantic_pattern,
        dominant_pattern: dominantPattern,
        pattern_mix: patternMix,
        operator_profile_family: operatorProfile.operator_profile_family,
        operator_profile_mode: operatorProfile.operator_profile_mode,
        operator_profile_confidence: operatorProfile.operator_profile_confidence,
        operator_profile_summary: operatorProfile.operator_profile_summary,
        operator_profile_reasons: operatorProfile.operator_profile_reasons,
        operator_profile_source: operatorProfile.operator_profile_source,
        exactness: 'indexed_exact' as const,
      }
    })
  phaseMs.aggregate_ms = Math.max(
    0,
    Date.now() - startedAt - phaseMs.sender_stats_query_ms - phaseMs.message_rows_query_ms - phaseMs.indexed_count_query_ms - phaseMs.index_state_load_ms
  )

  console.info(
    `${logPrefix} ${JSON.stringify({
      query_mode: queryMode,
      sender_count: normalizedSenders.length,
      rows_scanned: messageRows.length,
      timings_ms: phaseMs,
      duration_ms: Math.max(0, Date.now() - startedAt),
    })}`
  )

  return {
    ok: true,
    data: {
      senders,
      indexed_message_count: indexedMessageCount ?? 0,
      mailbox_estimated_total: indexState?.mailbox_estimated_total ?? null,
      index_completion_pct: indexState?.index_completion_pct ?? null,
      source: 'gmail_index_cache',
    },
  }
}

export async function loadGmailMessageSnippetsForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
  logPrefix?: string
}): Promise<GmailMessageSnippetsResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/message-snippets]'
  const startedAt = Date.now()
  const boundedMessageIds = Array.from(
    new Set(
      (params.messageIds || [])
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    )
  ).slice(0, 200)

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }
  if (boundedMessageIds.length === 0) {
    return {
      ok: true,
      data: {
        messages: [],
        source: 'gmail_metadata_live',
      },
    }
  }

  try {
    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }
    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }
    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }
      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })
      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }
      accessToken = refreshed.accessToken
    }

    const concurrency = 8
    const messages: GmailMessageSnippetsData['messages'] = []
    let failedCount = 0
    const failureBuckets = new Map<string, number>()
    const failedMessageIds: string[] = []
    let refreshedAfterUnauthorized = false

    const recordFailure = (reason: string, messageId: string) => {
      failureBuckets.set(reason, (failureBuckets.get(reason) || 0) + 1)
      if (failedMessageIds.length < 12) failedMessageIds.push(messageId)
    }

    const fetchSnippetForMessage = async (
      messageId: string
    ): Promise<{ messageId: string; snippet: string | null; ok: boolean; reason: string | null }> => {
      let attempts = 0
      while (attempts < 3) {
        attempts += 1
        const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
        messageUrl.searchParams.set('format', 'metadata')
        messageUrl.searchParams.append('metadataHeaders', 'From')
        messageUrl.searchParams.append('metadataHeaders', 'Subject')
        messageUrl.searchParams.append('metadataHeaders', 'Date')

        let response: Response
        try {
          response = await fetch(messageUrl.toString(), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
          })
        } catch {
          if (attempts < 3) {
            await new Promise((resolve) => setTimeout(resolve, 150 * attempts))
            continue
          }
          return { messageId, snippet: null, ok: false, reason: 'network_error' }
        }

        const data = (await response
          .json()
          .catch(() => null)) as GmailMessageMetadataResponse | null

        if (response.status === 401 && !refreshedAfterUnauthorized) {
          const refreshed = await refreshGmailAccessToken({
            refreshToken,
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            logPrefix,
          })
          if (refreshed) {
            accessToken = refreshed.accessToken
            refreshedAfterUnauthorized = true
            continue
          }
          return { messageId, snippet: null, ok: false, reason: 'unauthorized' }
        }

        if (response.status === 404) {
          return { messageId, snippet: null, ok: false, reason: 'not_found' }
        }
        if (response.status === 429 || response.status >= 500) {
          if (attempts < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempts))
            continue
          }
          return { messageId, snippet: null, ok: false, reason: 'gmail_retryable_failure' }
        }
        if (!response.ok || !data) {
          return { messageId, snippet: null, ok: false, reason: `gmail_status_${response.status}` }
        }

        return {
          messageId,
          snippet:
            typeof data.snippet === 'string' && data.snippet.trim()
              ? compactSnippet(data.snippet)
              : null,
          ok: true,
          reason:
            typeof data.snippet === 'string' && data.snippet.trim() ? null : 'snippet_unavailable',
        }
      }

      return { messageId, snippet: null, ok: false, reason: 'unknown_failure' }
    }

    for (let index = 0; index < boundedMessageIds.length; index += concurrency) {
      const chunk = boundedMessageIds.slice(index, index + concurrency)
      const results = await Promise.all(
        chunk.map((messageId) => fetchSnippetForMessage(messageId))
      )

      for (const result of results) {
        if (!result.ok) {
          failedCount += 1
          recordFailure(result.reason || 'unknown_failure', result.messageId)
          messages.push({ message_id: result.messageId, snippet: null })
          continue
        }
        messages.push({
          message_id: result.messageId,
          snippet: result.snippet,
        })
        if (!result.snippet) {
          recordFailure(result.reason || 'snippet_unavailable', result.messageId)
        }
      }
    }

    console.info(
      `${logPrefix} ${JSON.stringify({
        requested_count: boundedMessageIds.length,
        resolved_count: messages.filter((entry) => Boolean(entry.snippet)).length,
        failed_count: failedCount,
        failure_buckets: Object.fromEntries(failureBuckets),
        failed_message_ids_sample: failedMessageIds,
        fallback_used_count: messages.filter((entry) => !entry.snippet).length,
        duration_ms: Math.max(0, Date.now() - startedAt),
      })}`
    )

    return {
      ok: true,
      data: {
        messages,
        source: 'gmail_metadata_live',
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while loading Gmail message snippets.')
  }
}

export async function loadGmailMessagePreviewForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageId: string
  logPrefix?: string
}): Promise<GmailMessagePreviewResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/message-preview]'
  const startedAt = Date.now()
  const messageId = typeof params.messageId === 'string' ? params.messageId.trim() : ''

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }
  if (!messageId) {
    return fail(400, 'messageId is required.')
  }

  try {
    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }
    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }
    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }
      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })
      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }
      accessToken = refreshed.accessToken
    }

    let refreshedAfterUnauthorized = false
    let lastFailureReason: string | null = null
    let responseData: GmailMessageFullResponse | null = null

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
      messageUrl.searchParams.set('format', 'full')
      let response: Response
      try {
        response = await fetch(messageUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })
      } catch {
        lastFailureReason = 'network_error'
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 150 * attempt))
          continue
        }
        break
      }

      responseData = (await response.json().catch(() => null)) as GmailMessageFullResponse | null

      if (response.status === 401 && !refreshedAfterUnauthorized) {
        const refreshed = await refreshGmailAccessToken({
          refreshToken,
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          logPrefix,
        })
        if (refreshed) {
          accessToken = refreshed.accessToken
          refreshedAfterUnauthorized = true
          continue
        }
        return fail(412, 'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.')
      }
      if (response.status === 404) {
        return fail(404, 'Gmail message not found for preview.')
      }
      if (response.status === 429 || response.status >= 500) {
        lastFailureReason = response.status === 429 ? 'gmail_rate_limited' : `gmail_status_${response.status}`
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 200 * attempt))
          continue
        }
        break
      }
      if (!response.ok || !responseData) {
        lastFailureReason = `gmail_status_${response.status}`
        break
      }

      const labelIds = normalizeLabelIds(responseData.labelIds)
      const body = extractReadableBodyFromGmailPayload(responseData.payload)
      const preview: GmailMessagePreviewData = {
        message_id: messageId,
        thread_id: normalizeOptionalString(responseData.threadId) || undefined,
        history_id: normalizeOptionalString(responseData.historyId) || undefined,
        internal_date_ms: internalDateMsFromMessage(responseData) || undefined,
        subject: headerValue(responseData.payload?.headers, 'Subject'),
        from: headerValue(responseData.payload?.headers, 'From'),
        to: headerValue(responseData.payload?.headers, 'To'),
        date: dateIsoFromMessage(responseData),
        snippet:
          typeof responseData.snippet === 'string' && responseData.snippet.trim()
            ? compactSnippet(responseData.snippet)
            : null,
        label_ids: labelIds,
        category_labels: categoryLabelsFromLabelIds(labelIds),
        is_in_inbox: labelIds.includes('INBOX'),
        is_unread: labelIds.includes('UNREAD'),
        is_important: labelIds.includes('IMPORTANT'),
        is_starred: labelIds.includes('STARRED'),
        body_text: body.bodyText,
        body_source: body.bodySource,
        source: 'gmail_message_full_live',
      }

      console.info(
        `${logPrefix} ${JSON.stringify({
          message_id: messageId,
          body_source: preview.body_source,
          has_body_text: Boolean(preview.body_text),
          duration_ms: Math.max(0, Date.now() - startedAt),
        })}`
      )
      return { ok: true, data: preview }
    }

    console.warn(
      `${logPrefix} ${JSON.stringify({
        message_id: messageId,
        ok: false,
        reason: lastFailureReason || 'unknown_failure',
        duration_ms: Math.max(0, Date.now() - startedAt),
      })}`
    )
    return fail(500, 'Failed to load full Gmail message preview.')
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while loading Gmail message preview.')
  }
}

export async function archiveGmailMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
  sender?: string | null
  batchTitle?: string | null
  logPrefix?: string
}): Promise<GmailArchiveMessagesResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/archive-messages]'
  const mutation = await mutateGmailInboxLabelStateForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    messageIds: params.messageIds,
    removeLabelIds: ['INBOX'],
    logPrefix,
  })

  if (!mutation.ok) {
    return mutation
  }

  return {
    ok: true,
    data: {
      sender:
        typeof params.sender === 'string' && params.sender.trim() ? params.sender.trim() : null,
      batch_title:
        typeof params.batchTitle === 'string' && params.batchTitle.trim()
          ? params.batchTitle.trim()
          : null,
      requested_count: mutation.data.requested_count,
      archived_count: mutation.data.accepted_count,
      message_ids: mutation.data.accepted_message_ids.slice(0, 100),
    },
  }
}

export async function loadGmailAccessContextForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  requireModifyScope: boolean
  logPrefix: string
}): Promise<
  | {
      ok: true
      data: GmailTenantAccessContext
    }
  | GmailReadFailure
> {
  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  const { data: connectionRowRaw, error: connectionError } = await params.supabase
    .from('integration_connections')
    .select('access_token,refresh_token,expires_at,scopes')
    .eq('tenant_id', params.tenantId)
    .eq('provider', 'gmail')
    .maybeSingle()

  const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

  if (connectionError) {
    console.error(`${params.logPrefix} integration_connections lookup error:`, connectionError)
    return fail(500, 'Failed to load Gmail connection.')
  }

  if (!connectionRow) {
    return fail(
      412,
      params.requireModifyScope
        ? 'Gmail is not connected for this tenant. Reconnect Gmail with modify scope.'
        : 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.'
    )
  }

  if (params.requireModifyScope && !hasInboxModifyScope(connectionRow.scopes)) {
    return fail(
      412,
      'Connected Gmail token does not include modify scope. Reconnect with gmail.modify or mail.google.com scope.'
    )
  }

  if (!params.requireModifyScope && !hasInboxReadScope(connectionRow.scopes)) {
    return fail(
      412,
      'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
    )
  }

  const refreshToken =
    typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
  let accessToken =
    typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

  if (!accessToken || !refreshToken) {
    return fail(
      412,
      params.requireModifyScope
        ? 'Gmail token is incomplete for this tenant. Reconnect Gmail with modify scope.'
        : 'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
    )
  }

  if (isExpiredTimestamp(connectionRow.expires_at)) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
    }

    const refreshed = await refreshGmailAccessToken({
      refreshToken,
      clientId,
      clientSecret,
      logPrefix: params.logPrefix,
    })

    if (!refreshed) {
      return fail(
        412,
        params.requireModifyScope
          ? 'Failed to refresh Gmail access token. Reconnect Gmail with modify scope.'
          : 'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
      )
    }

    accessToken = refreshed.accessToken
  }

  return {
    ok: true,
    data: {
      accessToken,
      refreshToken,
    },
  }
}

function normalizeUniqueMessageIds(messageIds: string[]): string[] {
  const seenMessageIds = new Set<string>()
  const normalized: string[] = []
  for (const rawId of messageIds || []) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!id || seenMessageIds.has(id)) continue
    seenMessageIds.add(id)
    normalized.push(id)
  }
  return normalized
}

export async function mutateGmailInboxLabelStateForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
  addLabelIds?: string[]
  removeLabelIds?: string[]
  logPrefix: string
  accessContext?: GmailTenantAccessContext
}): Promise<GmailInboxLabelMutationResult> {
  const messageIds = normalizeUniqueMessageIds(params.messageIds)
  if (messageIds.length === 0) {
    return fail(400, 'message_ids are required for archive_messages.')
  }

  const accessContextResult = params.accessContext
    ? { ok: true as const, data: params.accessContext }
    : await loadGmailAccessContextForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        requireModifyScope: true,
        logPrefix: params.logPrefix,
      })
  if (!accessContextResult.ok) return accessContextResult

  const accessContext = accessContextResult.data
  const refreshToken = accessContext.refreshToken
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

  const chunks: string[][] = []
  for (let offset = 0; offset < messageIds.length; offset += GMAIL_BATCH_MODIFY_CHUNK_SIZE) {
    chunks.push(messageIds.slice(offset, offset + GMAIL_BATCH_MODIFY_CHUNK_SIZE))
  }

  const acceptedMessageIds: string[] = []
  const failedMessageIds: string[] = []

  for (
    let offset = 0;
    offset < chunks.length;
    offset += GMAIL_BATCH_MODIFY_CONCURRENCY
  ) {
    const concurrentChunks = chunks.slice(offset, offset + GMAIL_BATCH_MODIFY_CONCURRENCY)
    const chunkResults = await Promise.all(
      concurrentChunks.map(async (chunk) => {
        let retriedAfterUnauthorized = false
        let accessToken = accessContext.accessToken

        for (;;) {
          const modifyResponse = await fetch(GMAIL_BATCH_MODIFY_ENDPOINT, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ids: chunk,
              ...(params.addLabelIds && params.addLabelIds.length > 0
                ? { addLabelIds: params.addLabelIds }
                : {}),
              ...(params.removeLabelIds && params.removeLabelIds.length > 0
                ? { removeLabelIds: params.removeLabelIds }
                : {}),
            }),
            cache: 'no-store',
          })

          const modifyData = (await modifyResponse
            .json()
            .catch(() => null)) as GmailBatchModifyResponse | null

          if (modifyResponse.status === 401 && !retriedAfterUnauthorized) {
            const refreshed = await refreshGmailAccessToken({
              refreshToken,
              clientId,
              clientSecret,
              logPrefix: params.logPrefix,
            })
            if (!refreshed) {
              return fail(
                412,
                'Failed to refresh Gmail access token. Reconnect Gmail with modify scope.'
              )
            }
            accessContext.accessToken = refreshed.accessToken
            accessToken = refreshed.accessToken
            retriedAfterUnauthorized = true
            continue
          }

          if (hasInsufficientScopeError(modifyResponse.status, modifyData)) {
            return fail(
              412,
              'Connected Gmail token does not include modify scope. Reconnect with gmail.modify or mail.google.com scope.'
            )
          }

          if (!modifyResponse.ok) {
            console.error(`${params.logPrefix} Gmail batchModify failed:`, modifyData)
            return {
              ok: true as const,
              data: { acceptedMessageIds: [] as string[], failedMessageIds: chunk },
            }
          }

          return {
            ok: true as const,
            data: { acceptedMessageIds: chunk, failedMessageIds: [] as string[] },
          }
        }
      })
    )

    for (const result of chunkResults) {
      if (!result.ok) return result
      acceptedMessageIds.push(...result.data.acceptedMessageIds)
      failedMessageIds.push(...result.data.failedMessageIds)
    }
  }

  return {
    ok: true,
    data: {
      requested_count: messageIds.length,
      accepted_count: acceptedMessageIds.length,
      accepted_message_ids: acceptedMessageIds,
      failed_message_ids: failedMessageIds,
      partial_failure: failedMessageIds.length > 0,
    },
  }
}

export async function verifyGmailMessagesInboxStateForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
  expectInInbox: boolean
  logPrefix?: string
  accessContext?: GmailTenantAccessContext
  concurrency?: number
  maxAttempts?: number
  retryDelayMs?: number
}): Promise<GmailInboxStateVerificationResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/verify-inbox-state]'
  const messageIds = normalizeUniqueMessageIds(params.messageIds)
  if (messageIds.length === 0) {
    return {
      ok: true,
      data: {
        expected_in_inbox: params.expectInInbox,
        verified_message_ids: [],
        unresolved_message_ids: [],
        warning: null,
      },
    }
  }

  const accessContextResult = params.accessContext
    ? { ok: true as const, data: params.accessContext }
    : await loadGmailAccessContextForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        requireModifyScope: false,
        logPrefix,
      })
  if (!accessContextResult.ok) return accessContextResult

  const accessContext = accessContextResult.data
  const refreshToken = accessContext.refreshToken
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const concurrency = Math.max(
    10,
    Math.min(params.concurrency ?? GMAIL_VERIFY_DEFAULT_CONCURRENCY, GMAIL_VERIFY_MAX_CONCURRENCY)
  )
  const maxAttempts = Math.max(1, Math.min(params.maxAttempts ?? 3, 3))
  const retryDelayMs = Math.max(0, params.retryDelayMs ?? 150)
  let refreshedAfterUnauthorized = false
  const verified = new Set<string>()
  let unresolved = messageIds.slice()
  let verificationWarning: string | null = null

  for (let attempt = 1; attempt <= maxAttempts && unresolved.length > 0; attempt += 1) {
    const nextUnresolved: string[] = []
    let shouldRetryAllAfterRefresh = false

    for (let offset = 0; offset < unresolved.length; offset += concurrency) {
      const chunk = unresolved.slice(offset, offset + concurrency)
      const chunkResults = await Promise.all(
        chunk.map(async (messageId) => {
          const accessToken = accessContext.accessToken
          const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
          messageUrl.searchParams.set('format', 'minimal')
          const response = await fetch(messageUrl.toString(), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
          }).catch(() => null)

          if (!response) {
            return { messageId, state: 'network_error' as const }
          }

          const responseData = (await response
            .json()
            .catch(() => null)) as GmailMessageMetadataResponse | null

          if (response.status === 401) {
            return { messageId, state: 'unauthorized' as const }
          }
          if (response.status === 404) {
            return { messageId, state: 'missing' as const }
          }
          if (response.status === 429 || response.status >= 500) {
            return { messageId, state: 'transient_error' as const }
          }
          if (!response.ok || !responseData) {
            return { messageId, state: 'unexpected_error' as const }
          }

          const labelIds = normalizeLabelIds(responseData.labelIds)
          const matches = params.expectInInbox ? labelIds.includes('INBOX') : !labelIds.includes('INBOX')
          return {
            messageId,
            state: matches ? ('verified' as const) : ('not_yet_applied' as const),
          }
        })
      )

      for (const result of chunkResults) {
        if (result.state === 'verified') {
          verified.add(result.messageId)
          continue
        }
          if (result.state === 'unauthorized' && !refreshedAfterUnauthorized) {
            const refreshed = await refreshGmailAccessToken({
              refreshToken,
              clientId,
              clientSecret,
              logPrefix,
            })
            if (!refreshed) {
              return fail(
                412,
                'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read or modify scope.'
              )
            }
            accessContext.accessToken = refreshed.accessToken
            refreshedAfterUnauthorized = true
            shouldRetryAllAfterRefresh = true
            break
        }

        nextUnresolved.push(result.messageId)
        if (verificationWarning == null) {
          verificationWarning =
            result.state === 'missing'
              ? 'Some Gmail messages could not be found during verification.'
              : result.state === 'network_error' || result.state === 'transient_error'
                ? 'Gmail verification could not be completed for every message yet.'
                : result.state === 'unexpected_error'
                  ? 'Gmail returned an unexpected response during verification.'
                  : null
        }
      }

      if (shouldRetryAllAfterRefresh) break
    }

    if (shouldRetryAllAfterRefresh) {
      continue
    }

    unresolved = nextUnresolved
    if (unresolved.length > 0 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt))
    }
  }

  return {
    ok: true,
    data: {
      expected_in_inbox: params.expectInInbox,
      verified_message_ids: Array.from(verified),
      unresolved_message_ids: unresolved,
      warning:
        verificationWarning ||
        (unresolved.length > 0
          ? params.expectInInbox
            ? 'Inbox restore could not be confirmed for every targeted message yet.'
            : 'Inbox-label removal could not be confirmed for every targeted message yet.'
          : null),
    },
  }
}

export async function restoreGmailMessagesToInboxForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
  sender?: string | null
  batchTitle?: string | null
  logPrefix?: string
}): Promise<GmailArchiveMessagesResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/restore-messages]'
  const mutation = await mutateGmailInboxLabelStateForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    messageIds: params.messageIds,
    addLabelIds: ['INBOX'],
    logPrefix,
  })

  if (!mutation.ok) {
    return mutation
  }

  return {
    ok: true,
    data: {
      sender:
        typeof params.sender === 'string' && params.sender.trim() ? params.sender.trim() : null,
      batch_title:
        typeof params.batchTitle === 'string' && params.batchTitle.trim()
          ? params.batchTitle.trim()
          : null,
      requested_count: mutation.data.requested_count,
      archived_count: mutation.data.accepted_count,
      message_ids: mutation.data.accepted_message_ids.slice(0, 100),
    },
  }
}

export async function discoverGmailCleanupClustersForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  topSenders?: string[]
  analysisScope?: GmailAnalysisScope
  logPrefix?: string
  disableInlineIndexSync?: boolean
  skipIndexSyncIfRecentMs?: number
  preferExistingIndexedCoverage?: boolean
  allowFullRescanOnIndexSyncFailure?: boolean
}): Promise<GmailCleanupDiscoveryResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/cleanup-discovery]'
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const discoveryStartedAt = Date.now()
  const analysisScopeDays = scopeDays(analysisScope)
  const profileWindowQuery =
    analysisScopeDays != null ? `newer_than:${analysisScopeDays}d` : ''
  const inboxRecentWindowQuery = `in:inbox${profileWindowQuery ? ` ${profileWindowQuery}` : ''}`

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  try {
    const diagnostics: GmailCleanupDiscoveryDiagnostics = {
      index_state_load_ms: 0,
      index_sync_ms: 0,
      indexed_rows_load_ms: 0,
      coverage_load_ms: 0,
      discovery_build_ms: 0,
      total_ms: 0,
      index_sync_disabled_by_request: params.disableInlineIndexSync === true,
      index_sync_skipped_recent: false,
      index_sync_reused_existing_coverage: false,
      index_sync_recent_activity_ms: null,
      index_sync_result_ok: null,
      index_sync_result_mode: null,
      index_sync_used_fallback_full_scan: null,
      indexed_rows_cache_hit: false,
      indexed_rows_cache_key_changed: false,
      indexed_rows_cache_evicted: false,
      indexed_rows_cache_entry_age_ms: null,
      indexed_row_count: 0,
    }
    let indexSync: GmailMailboxIndexSyncResult | null = null
    const indexStateStartedAt = Date.now()
    const currentIndexState = await loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    diagnostics.index_state_load_ms = Math.max(0, Date.now() - indexStateStartedAt)
    const recentActivityMs = latestIndexActivityMs(currentIndexState)
    diagnostics.index_sync_recent_activity_ms =
      recentActivityMs != null ? Math.max(0, Date.now() - recentActivityMs) : null
    const coverageForSyncDecision =
      params.preferExistingIndexedCoverage && currentIndexState?.indexed_message_count
        ? await loadGmailMailboxIndexCoverageForTenant({
            supabase: params.supabase,
            tenantId: params.tenantId,
          })
        : null
    const shouldSkipRecentIndexSync = Boolean(
      params.skipIndexSyncIfRecentMs &&
        params.skipIndexSyncIfRecentMs > 0 &&
        currentIndexState?.indexed_message_count &&
        currentIndexState.indexed_message_count > 0 &&
        diagnostics.index_sync_recent_activity_ms != null &&
        diagnostics.index_sync_recent_activity_ms <= params.skipIndexSyncIfRecentMs &&
        currentIndexState.last_sync_status &&
        !currentIndexState.last_sync_status.endsWith('failed')
    )
    const shouldReuseExistingUsableIndex = Boolean(
      params.preferExistingIndexedCoverage &&
        currentIndexState?.indexed_message_count &&
        currentIndexState.indexed_message_count > 0 &&
        coverageForSyncDecision &&
        indexedCoverageSatisfiesScope({
          coverage: coverageForSyncDecision,
          analysisScope,
          nowMs: discoveryStartedAt,
        }) &&
        diagnostics.index_sync_recent_activity_ms != null &&
        diagnostics.index_sync_recent_activity_ms <= 24 * 60 * 60 * 1000
    )

    if (params.disableInlineIndexSync) {
      diagnostics.index_sync_skipped_recent = false
      diagnostics.index_sync_reused_existing_coverage = false
      diagnostics.index_sync_result_ok = true
      diagnostics.index_sync_result_mode = null
      diagnostics.index_sync_used_fallback_full_scan = false
    } else if (shouldSkipRecentIndexSync || shouldReuseExistingUsableIndex) {
      diagnostics.index_sync_skipped_recent = true
      diagnostics.index_sync_reused_existing_coverage = shouldReuseExistingUsableIndex
      diagnostics.index_sync_result_ok = true
      diagnostics.index_sync_result_mode = 'incremental'
      diagnostics.index_sync_used_fallback_full_scan = false
    } else {
      const indexSyncStartedAt = Date.now()
      indexSync = await syncGmailMailboxIndexForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        mode: 'incremental',
        maxMessages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
        allowFullRescanOnHistoryGap: params.allowFullRescanOnIndexSyncFailure ?? true,
        logPrefix: `${logPrefix}/index-sync`,
      })
      diagnostics.index_sync_ms = Math.max(0, Date.now() - indexSyncStartedAt)
      diagnostics.index_sync_result_ok = indexSync.ok
      diagnostics.index_sync_result_mode = indexSync.mode
      diagnostics.index_sync_used_fallback_full_scan = Boolean(indexSync.used_fallback_full_scan)
    }
    if (indexSync && !indexSync.ok && indexSync.reason !== 'missing_connection') {
      console.warn(`${logPrefix} index sync failed (non-fatal):`, indexSync.error)
    }

    let coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>> | null = null
    const loadCoverage = async (): Promise<Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>> => {
      if (coverage) return coverage
      const coverageStartedAt = Date.now()
      coverage = await loadGmailMailboxIndexCoverageForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      diagnostics.coverage_load_ms += Math.max(0, Date.now() - coverageStartedAt)
      return coverage
    }

    let indexedRows: GmailMailboxIndexRow[] = []
    if (params.disableInlineIndexSync) {
      const cachedCoverage = await loadCoverage()
      const discoveryRows = await loadDiscoveryIndexedRowsWithManualReuse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope,
        currentIndexState,
        coverage: cachedCoverage,
        logPrefix,
      })
      indexedRows = discoveryRows.rows
      diagnostics.indexed_rows_load_ms = discoveryRows.loadMs
      diagnostics.indexed_rows_cache_hit = discoveryRows.cacheHit
      diagnostics.indexed_rows_cache_key_changed = discoveryRows.cacheKeyChanged
      diagnostics.indexed_rows_cache_evicted = discoveryRows.cacheEvicted
      diagnostics.indexed_rows_cache_entry_age_ms = discoveryRows.cacheEntryAgeMs
    } else {
      const indexedRowsStartedAt = Date.now()
      indexedRows = await loadIndexedGmailMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
      })
      diagnostics.indexed_rows_load_ms = Math.max(0, Date.now() - indexedRowsStartedAt)
    }
    diagnostics.indexed_row_count = indexedRows.length
    if (indexedRows.length > 0) {
      const resolvedCoverage = await loadCoverage()
      const buildStartedAt = Date.now()
      const builtDiscovery = buildDiscoveryFromIndexedRows({
        indexedRows,
        coverage: resolvedCoverage,
        analysisScope,
        topSenders: params.topSenders,
      })
      const senderOverviewSnapshot = await buildSenderOverviewSnapshot({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope,
        coverage: resolvedCoverage,
        clusters: builtDiscovery.discovery.clusters,
        selectedClusterRowsByCluster: builtDiscovery.selectedClusterRowsByCluster,
      })
      const discovery: GmailCleanupDiscoveryData = {
        ...builtDiscovery.discovery,
        sender_overview_snapshot: senderOverviewSnapshot,
      }
      diagnostics.discovery_build_ms = Math.max(0, Date.now() - buildStartedAt)
      diagnostics.total_ms = Math.max(0, Date.now() - discoveryStartedAt)
      console.info(
        `${logPrefix} index-backed discovery ${JSON.stringify({
          selected_analysis_scope: analysisScope,
          effective_discovery_window_days:
            discovery.mailbox_profile?.cluster_diagnostics?.source_counts.discovery_window_days ??
            discovery.mailbox_profile?.analysis_window_days ??
            null,
          indexed_row_count: resolvedCoverage.indexed_total_rows,
          indexed_inbox_row_count: resolvedCoverage.indexed_inbox_rows,
          generated_cluster_count: discovery.clusters.length,
          cluster_generation_note: discovery.mailbox_profile?.notes?.find((note) =>
            note.toLowerCase().startsWith('cluster generation:')
          ),
          cluster_rejection_summary: discovery.mailbox_profile?.cluster_diagnostics
            ? {
                source_counts: discovery.mailbox_profile.cluster_diagnostics.source_counts,
                rejection_buckets: discovery.mailbox_profile.cluster_diagnostics.rejection_buckets,
                used_exploratory_fallback:
                  discovery.mailbox_profile.cluster_diagnostics.used_exploratory_fallback,
              }
            : null,
          discovery_timing_ms: diagnostics,
        })}`
      )
      return {
        ok: true,
        data: discovery,
        diagnostics,
      }
    }

    const { data: connectionRowRaw, error: connectionError } = await params.supabase
      .from('integration_connections')
      .select('access_token,refresh_token,expires_at,scopes')
      .eq('tenant_id', params.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()

    const connectionRow = connectionRowRaw as IntegrationConnectionRow | null

    if (connectionError) {
      console.error(`${logPrefix} integration_connections lookup error:`, connectionError)
      return fail(500, 'Failed to load Gmail connection.')
    }

    if (!connectionRow) {
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with inbox-read scope.')
    }

    if (!hasInboxReadScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with inbox-read scope.'
      )
    }

    if (isExpiredTimestamp(connectionRow.expires_at)) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return fail(500, 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.')
      }

      const refreshed = await refreshGmailAccessToken({
        refreshToken,
        clientId,
        clientSecret,
        logPrefix,
      })

      if (!refreshed) {
        return fail(
          412,
          'Failed to refresh Gmail access token. Reconnect Gmail with inbox-read scope.'
        )
      }

      accessToken = refreshed.accessToken
    }

    const estimateQueryCount = async (query: string): Promise<{ count: number; scopeError: boolean }> => {
      const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
      messagesListUrl.searchParams.set('q', query)
      messagesListUrl.searchParams.set('maxResults', '1')

      const listResponse = await fetch(messagesListUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      })

      const listData = (await listResponse
        .json()
        .catch(() => null)) as GmailMessagesListResponse | null
      if (hasInsufficientScopeError(listResponse.status, listData)) {
        return { count: 0, scopeError: true }
      }
      if (!listResponse.ok || !listData) {
        console.warn(`${logPrefix} query estimate failed: ${query}`, listData)
        return { count: 0, scopeError: false }
      }

      return {
        count: typeof listData.resultSizeEstimate === 'number' ? listData.resultSizeEstimate : 0,
        scopeError: false,
      }
    }

    const profileMetricQueries = {
      inbox_recent_estimate: inboxRecentWindowQuery,
      category_primary_estimate: `in:inbox category:primary ${profileWindowQuery}`,
      category_promotions_estimate: `in:inbox category:promotions ${profileWindowQuery} -category:social`,
      category_social_estimate: `in:inbox category:social ${profileWindowQuery} -category:promotions`,
      category_updates_estimate: `in:inbox category:updates ${profileWindowQuery} -category:promotions -category:social`,
      category_forums_estimate: `in:inbox category:forums ${profileWindowQuery}`,
      unread_recent_estimate: `in:inbox is:unread ${profileWindowQuery}`,
      important_recent_estimate: `in:inbox is:important ${profileWindowQuery}`,
      starred_recent_estimate: `in:inbox is:starred ${profileWindowQuery}`,
      likely_machine_generated_recent_estimate:
        `in:inbox ${profileWindowQuery} (` +
        'from:noreply OR from:no-reply OR from:donotreply OR from:do-not-reply OR from:mailer-daemon OR subject:(notification OR automated OR alert)' +
        ') -subject:(newsletter OR digest OR promo OR promotion) -category:promotions -category:social',
      likely_human_priority_recent_estimate:
        `in:inbox category:primary ${profileWindowQuery} (` +
        'is:important OR is:starred OR subject:(re: OR meeting OR invoice OR payment OR follow up)' +
        ') -from:noreply -from:no-reply',
      stale_unread_30d_estimate: 'in:inbox is:unread older_than:30d -is:starred -is:important',
      stale_unread_60d_estimate: 'in:inbox is:unread older_than:60d -is:starred -is:important',
      stale_unread_90d_estimate: 'in:inbox is:unread older_than:90d -is:starred -is:important',
    } as const

    const profileMetricEntries = Object.entries(profileMetricQueries) as Array<
      [keyof GmailMailboxProfileNativeSignalCounts, string]
    >

    const profileMetricResults = await Promise.all(
      profileMetricEntries.map(async ([key, query]) => {
        const estimate = await estimateQueryCount(query)
        return { key, query, ...estimate }
      })
    )

    if (profileMetricResults.some((result) => result.scopeError)) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const nativeSignalCounts: GmailMailboxProfileNativeSignalCounts = {
      inbox_recent_estimate: 0,
      category_primary_estimate: 0,
      category_promotions_estimate: 0,
      category_social_estimate: 0,
      category_updates_estimate: 0,
      category_forums_estimate: 0,
      unread_recent_estimate: 0,
      important_recent_estimate: 0,
      starred_recent_estimate: 0,
      likely_machine_generated_recent_estimate: 0,
      likely_human_priority_recent_estimate: 0,
      stale_unread_30d_estimate: 0,
      stale_unread_60d_estimate: 0,
      stale_unread_90d_estimate: 0,
    }
    const metricQueryByKey = new Map<keyof GmailMailboxProfileNativeSignalCounts, string>()

    for (const result of profileMetricResults) {
      nativeSignalCounts[result.key] = result.count
      metricQueryByKey.set(result.key, result.query)
    }
    const cleanupEstimateOverlapDetected = hasEstimateOverlapAmbiguity([
      nativeSignalCounts.category_promotions_estimate,
      nativeSignalCounts.category_social_estimate,
      nativeSignalCounts.category_updates_estimate,
      nativeSignalCounts.likely_machine_generated_recent_estimate,
      nativeSignalCounts.stale_unread_30d_estimate,
    ])

    const recentWindowMessageIds: string[] = []
    let nextPageToken: string | null = null

    while (recentWindowMessageIds.length < MAILBOX_PROFILE_SENDER_ID_SCAN_LIMIT) {
      const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
      messagesListUrl.searchParams.set('q', inboxRecentWindowQuery)
      messagesListUrl.searchParams.set(
        'maxResults',
        String(Math.min(100, MAILBOX_PROFILE_SENDER_ID_SCAN_LIMIT - recentWindowMessageIds.length))
      )
      if (nextPageToken) {
        messagesListUrl.searchParams.set('pageToken', nextPageToken)
      }

      const listResponse = await fetch(messagesListUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      })

      const listData = (await listResponse
        .json()
        .catch(() => null)) as (GmailMessagesListResponse & { nextPageToken?: string }) | null
      if (hasInsufficientScopeError(listResponse.status, listData)) {
        return fail(
          412,
          'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
        )
      }
      if (!listResponse.ok || !listData) {
        console.warn(`${logPrefix} recent-window sender scan query failed:`, listData)
        break
      }

      const fetchedIds = Array.isArray(listData.messages)
        ? listData.messages
            .map((row) => (typeof row?.id === 'string' ? row.id.trim() : ''))
            .filter(Boolean)
        : []
      if (fetchedIds.length === 0) break

      recentWindowMessageIds.push(...fetchedIds)
      nextPageToken =
        typeof listData.nextPageToken === 'string' && listData.nextPageToken.trim()
          ? listData.nextPageToken.trim()
          : null
      if (!nextPageToken) break
    }

    const profileMessageIds = recentWindowMessageIds.slice(0, MAILBOX_PROFILE_SENDER_METADATA_LIMIT)
    const profileMetadataResults = await Promise.all(
      profileMessageIds.map(async (messageId) => {
        const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
        messageUrl.searchParams.set('format', 'metadata')
        messageUrl.searchParams.append('metadataHeaders', 'From')
        messageUrl.searchParams.append('metadataHeaders', 'Subject')
        messageUrl.searchParams.append('metadataHeaders', 'Date')

        const response = await fetch(messageUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const data = (await response
          .json()
          .catch(() => null)) as GmailMessageMetadataResponse | null
        return { response, data }
      })
    )

    if (profileMetadataResults.some((item) => hasInsufficientScopeError(item.response.status, item.data))) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    const senderCounts = new Map<string, number>()
    const senderText = new Map<string, string[]>()
    const subjectPatternCounts = new Map<string, number>()
    let metadataMessageCount = 0

    for (const item of profileMetadataResults) {
      if (!item.response.ok || !item.data) continue
      metadataMessageCount += 1

      const from = normalizeSender(headerValue(item.data.payload?.headers, 'From') || '')
      if (from) {
        senderCounts.set(from, (senderCounts.get(from) ?? 0) + 1)
      }

      const subject = headerValue(item.data.payload?.headers, 'Subject')
      const snippet =
        typeof item.data.snippet === 'string' && item.data.snippet.trim()
          ? compactSnippet(item.data.snippet)
          : ''

      if (from) {
        const current = senderText.get(from) || []
        current.push(`${subject || ''} ${snippet}`.trim())
        senderText.set(from, current)
      }

      const subjectPattern = normalizeSubjectPattern(subject)
      if (subjectPattern) {
        subjectPatternCounts.set(subjectPattern, (subjectPatternCounts.get(subjectPattern) ?? 0) + 1)
      }
    }

    const senderFrequency = [...senderCounts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })
      .slice(0, 8)
      .map(([sender, count]) => {
        const text = (senderText.get(sender) || []).join(' ')
        return {
          sender,
          count,
          signal: senderSignalFromText({ sender, sampleText: text }),
          source: 'computed_recent_window_sample' as const,
        }
      })

    const subjectPatterns = [...subjectPatternCounts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })
      .slice(0, 6)
      .map(([pattern, count]) => ({
        pattern,
        count,
        source: 'computed_recent_window_sample' as const,
      }))

    const recurringCategories: GmailMailboxProfileRecurringCategory[] = ([
      {
        category: 'primary',
        estimated_count: nativeSignalCounts.category_primary_estimate,
        source: 'gmail_native',
      },
      {
        category: 'promotions',
        estimated_count: nativeSignalCounts.category_promotions_estimate,
        source: 'gmail_native',
      },
      {
        category: 'social',
        estimated_count: nativeSignalCounts.category_social_estimate,
        source: 'gmail_native',
      },
      {
        category: 'updates',
        estimated_count: nativeSignalCounts.category_updates_estimate,
        source: 'gmail_native',
      },
      {
        category: 'forums',
        estimated_count: nativeSignalCounts.category_forums_estimate,
        source: 'gmail_native',
      },
    ] satisfies GmailMailboxProfileRecurringCategory[])
      .filter((item) => item.estimated_count > 0)
      .sort((a, b) => b.estimated_count - a.estimated_count)

    const protectionCandidates: GmailMailboxProfileCandidateGroup[] = ([
      {
        title: 'Protect important/starred inbox mail',
        query: 'in:inbox (is:important OR is:starred)',
        estimated_count: Math.max(
          nativeSignalCounts.important_recent_estimate,
          nativeSignalCounts.starred_recent_estimate
        ),
        reason: 'High-priority Gmail-native signals should stay protected during cleanup waves.',
        source: 'gmail_native',
      },
      {
        title: 'Protect likely human-primary correspondence',
        query: `in:inbox category:primary ${profileWindowQuery} -from:noreply -from:no-reply`,
        estimated_count: nativeSignalCounts.likely_human_priority_recent_estimate,
        reason: 'Primary-category recent mail is more likely to contain human or business-critical threads.',
        source: 'gmail_native_plus_heuristic',
      },
    ] satisfies GmailMailboxProfileCandidateGroup[]).filter((item) => item.estimated_count > 0)

    const cleanupCandidates: GmailMailboxProfileCandidateGroup[] = ([
      {
        title: 'Promotions/newsletter traffic',
        query: metricQueryByKey.get('category_promotions_estimate') || '',
        estimated_count: nativeSignalCounts.category_promotions_estimate,
        reason: 'Promotions category is typically a safer first cleanup wave.',
        source: 'gmail_native',
      },
      {
        title: 'Social notifications',
        query: metricQueryByKey.get('category_social_estimate') || '',
        estimated_count: nativeSignalCounts.category_social_estimate,
        reason: 'Social feed traffic is often lower-priority for inbox retention.',
        source: 'gmail_native',
      },
      {
        title: 'No-reply / machine-generated traffic',
        query: metricQueryByKey.get('likely_machine_generated_recent_estimate') || '',
        estimated_count: nativeSignalCounts.likely_machine_generated_recent_estimate,
        reason: 'Machine-generated patterns indicate recurring cleanup opportunities.',
        source: 'gmail_native_plus_heuristic',
      },
      {
        title: 'Stale unread backlog (30+ days)',
        query: metricQueryByKey.get('stale_unread_30d_estimate') || '',
        estimated_count: nativeSignalCounts.stale_unread_30d_estimate,
        reason: 'Aged unread mail can indicate low-value backlog if reviewed in bounded batches.',
        source: 'gmail_native',
      },
    ] satisfies GmailMailboxProfileCandidateGroup[]).filter((item) => item.estimated_count > 0)

    const ruleOpportunities: GmailMailboxProfileCandidateGroup[] = []
    for (const sender of senderFrequency) {
      if (sender.count < 3 || sender.signal !== 'likely_machine_generated') continue
      ruleOpportunities.push({
        title: `Recurring machine sender rule: ${sender.sender}`,
        query: `in:inbox from:${sender.sender} ${profileWindowQuery}`,
        estimated_count: sender.count,
        reason:
          'Recurring machine-generated sender in recent window; candidate for review-first automation rule.',
        source: 'gmail_native_plus_heuristic',
      })
      if (ruleOpportunities.length >= 3) break
    }

    if (
      ruleOpportunities.length === 0 &&
      nativeSignalCounts.category_promotions_estimate > 0
    ) {
      ruleOpportunities.push({
        title: 'Promotions triage rule opportunity',
        query: `in:inbox category:promotions ${profileWindowQuery}`,
        estimated_count: nativeSignalCounts.category_promotions_estimate,
        reason: 'Promotions volume suggests value in a recurring review-first triage workflow.',
        source: 'gmail_native',
      })
    }

    const mailboxProfile: GmailMailboxProfile = {
      generated_at: new Date().toISOString(),
      analysis_window_days: resolveAnalysisWindowDays(analysisScope),
      profile_model: 'gmail_native_signals_plus_bounded_sample.v1',
      metadata_scan_basis: {
        message_id_scan_count: recentWindowMessageIds.length,
        metadata_message_count: metadataMessageCount,
      },
      recommendation_confidence:
        metadataMessageCount >= 100 &&
        nativeSignalCounts.inbox_recent_estimate >= 1000 &&
        !cleanupEstimateOverlapDetected
          ? 'moderate'
          : 'preliminary',
      native_signal_counts: nativeSignalCounts,
      recurring_categories: recurringCategories,
      sender_frequency: senderFrequency,
      subject_patterns: subjectPatterns,
      protection_candidates: protectionCandidates,
      cleanup_candidates: cleanupCandidates,
      rule_opportunities: ruleOpportunities,
      notes: [
        `Uses Gmail-native query estimates over scope ${analysisScope} plus bounded metadata sampling for sender/subject recurrence.`,
        `Sender/subject recurrence is computed from up to ${MAILBOX_PROFILE_SENDER_METADATA_LIMIT} recent inbox messages, not full mailbox contents.`,
        'Estimated counts are Gmail resultSizeEstimate heuristics and should be validated with bounded review before action.',
        ...(cleanupEstimateOverlapDetected
          ? [
              'Some cleanup-cluster estimates overlap due to Gmail resultSizeEstimate ambiguity across related queries; treat counts as directional until preview review confirms scope.',
            ]
          : []),
      ],
    }

    const profiledTopSenders = senderFrequency
      .map((entry) => entry.sender)
      .filter(Boolean)
      .slice(0, 4)

    const mergedTopSenders = [...(params.topSenders || []), ...profiledTopSenders]

    const clusterSpecs = buildGmailCleanupClusterSpecs({
      topSenders: mergedTopSenders,
    })
    const clusters: GmailCleanupCluster[] = []

    const clusterCandidates = await Promise.all(
      clusterSpecs.map(async (spec) => {
        const messagesListUrl = new URL(GMAIL_MESSAGES_ENDPOINT)
        messagesListUrl.searchParams.set('q', spec.query)
        messagesListUrl.searchParams.set('maxResults', String(CLEANUP_QUERY_MAX_RESULTS))

        const listResponse = await fetch(messagesListUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const listData = (await listResponse
          .json()
          .catch(() => null)) as GmailMessagesListResponse | null
        if (hasInsufficientScopeError(listResponse.status, listData)) {
          return { kind: 'scope_error' as const }
        }

        if (!listResponse.ok || !listData) {
          console.warn(`${logPrefix} cleanup list query failed for ${spec.cluster_id}:`, listData)
          return { kind: 'skip' as const }
        }

        const estimate =
          typeof listData.resultSizeEstimate === 'number' ? listData.resultSizeEstimate : 0
        if (estimate <= 0) return { kind: 'skip' as const }

        const messageIds = Array.isArray(listData.messages)
          ? listData.messages
              .map((row) => (typeof row?.id === 'string' ? row.id.trim() : ''))
              .filter(Boolean)
              .slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT)
          : []

        const samplePreview: GmailCleanupClusterPreviewMessage[] = []
        if (messageIds.length > 0) {
          const metadataResults = await Promise.all(
            messageIds.map(async (messageId) => {
              const messageUrl = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(messageId)}`)
              messageUrl.searchParams.set('format', 'metadata')
              messageUrl.searchParams.append('metadataHeaders', 'From')
              messageUrl.searchParams.append('metadataHeaders', 'Subject')
              messageUrl.searchParams.append('metadataHeaders', 'Date')

              const response = await fetch(messageUrl.toString(), {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                cache: 'no-store',
              })

              const data = (await response
                .json()
                .catch(() => null)) as GmailMessageMetadataResponse | null
              return { messageId, response, data }
            })
          )

          for (const item of metadataResults) {
            if (!item.response.ok || !item.data) continue
            const labelIds = normalizeLabelIds(item.data.labelIds)
            samplePreview.push({
              message_id: item.messageId,
              thread_id: normalizeOptionalString(item.data.threadId) ?? undefined,
              history_id: normalizeOptionalString(item.data.historyId) ?? undefined,
              internal_date_ms: internalDateMsFromMessage(item.data) ?? undefined,
              subject: headerValue(item.data.payload?.headers, 'Subject'),
              from: headerValue(item.data.payload?.headers, 'From'),
              date: dateIsoFromMessage(item.data),
              snippet:
                typeof item.data.snippet === 'string' && item.data.snippet.trim()
                  ? compactSnippet(item.data.snippet)
                  : null,
              ...(labelIds.length > 0 ? { label_ids: labelIds } : {}),
              ...(labelIds.length > 0
                ? {
                    category_labels: categoryLabelsFromLabelIds(labelIds),
                    is_in_inbox: labelIds.includes('INBOX'),
                    is_unread: labelIds.includes('UNREAD'),
                    is_important: labelIds.includes('IMPORTANT'),
                    is_starred: labelIds.includes('STARRED'),
                  }
                : {}),
            })
          }
        }

        return {
          kind: 'cluster' as const,
          cluster: {
            cluster_id: spec.cluster_id,
            cluster_type: spec.cluster_type,
            title: spec.title,
            query: spec.query,
            why_selected: (() => {
              const estimateHint =
                spec.cluster_type === 'newsletters'
                  ? nativeSignalCounts.category_promotions_estimate
                  : spec.cluster_type === 'social_notifications'
                    ? nativeSignalCounts.category_social_estimate
                    : spec.cluster_type === 'noreply_automation'
                      ? nativeSignalCounts.likely_machine_generated_recent_estimate
                      : spec.cluster_type === 'unread_clutter'
                        ? nativeSignalCounts.stale_unread_30d_estimate
                        : 0
              if (estimateHint > 0) {
                return `${spec.why_selected} Recent-window estimate: ~${estimateHint} matching messages in ${analysisScope} scope.${
                  cleanupEstimateOverlapDetected
                    ? ' Estimate overlap can occur across related Gmail queries; use this as directional planning input.'
                    : ''
                }`
              }
              return spec.why_selected
            })(),
            estimated_count: estimate,
            sample_preview: samplePreview,
            risk_note: spec.risk_note,
            safety_note:
              'Safety defaults applied: excludes recent/important/starred and non-primary human-like correspondence where possible. Manual review required.',
          },
        }
      })
    )

    if (clusterCandidates.some((candidate) => candidate.kind === 'scope_error')) {
      return fail(
        412,
        'Connected Gmail token does not include inbox-read scope. Reconnect with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.'
      )
    }

    for (const candidate of clusterCandidates) {
      if (candidate.kind === 'cluster') {
        clusters.push(candidate.cluster)
      }
    }

    clusters.sort((a, b) => {
      if (b.estimated_count !== a.estimated_count) return b.estimated_count - a.estimated_count
      return a.title.localeCompare(b.title)
    })

    console.info(
      `${logPrefix} gmail-api discovery ${JSON.stringify({
        selected_analysis_scope: analysisScope,
        effective_discovery_window_days: mailboxProfile.analysis_window_days,
        generated_cluster_count: clusters.length,
      })}`
    )

    return {
      ok: true,
      data: {
        generated_at: new Date().toISOString(),
        planning_mode: 'read_only',
        safety_defaults: CLEANUP_SAFETY_DEFAULTS,
        clusters: clusters.slice(0, 10),
        mailbox_profile: mailboxProfile,
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while discovering cleanup clusters.')
  }
}
