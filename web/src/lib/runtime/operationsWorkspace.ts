import type {
  GmailCanonicalSenderCategoryLabel,
  GmailCleanupGroupSurfaceKind,
  GmailCleanupGroupSurfaceTier,
  GmailCleanupGroupSurfaceVisibility,
  GmailCategorySummarySource,
  GmailDominantCategoryConfidence,
  GmailMailboxIntelligenceData,
  GmailResolvedSemanticFamily,
  GmailResolvedSemanticPattern,
  GmailSenderCategoryDistributionEntry,
  GmailSenderCategoryProfileMode,
  GmailOperatorProfileFamily,
  GmailOperatorProfileMode,
  GmailOperatorProfileSource,
  GmailSenderPatternMixEntry,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY,
  isOptionalEvidenceDetailAvailability,
  shouldCacheOptionalEvidenceDetail,
  type OptionalEvidenceDetailAvailability,
} from '@/lib/runtime/optionalEvidenceDetail'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type OperationsInboxAnalysisRequestContext = {
  source?: string
  component?: string
  reason?: string
  phase?: 'initial_paint' | 'interactive' | 'deferred' | 'fallback'
  agentId?: string
}

type OperationsInboxAnalysisAction =
  | 'review_query_cluster'
  | 'browse_query_cluster'
  | 'sender_index_signals'
  | 'load_message_snippets'
  | 'load_message_preview'
  | 'cleanup_group_intelligence'

const OPERATIONS_BROWSER_CACHE_TTL_MS = 12_000
const OPERATIONS_SIGNALS_CACHE_TTL_MS = 12_000
const OPERATIONS_REVIEW_CACHE_TTL_MS = 12_000
const OPERATIONS_MESSAGE_SNIPPETS_CACHE_TTL_MS = 60_000
const OPERATIONS_INTELLIGENCE_CACHE_TTL_MS = 30_000

type BrowserCacheEntry = {
  expiresAt: number
  data: OperationsQueryClusterBrowserData
}

type ReviewCacheEntry = {
  expiresAt: number
  data: OperationsQueryClusterReviewData
}

type SenderSignalsCacheEntry = {
  expiresAt: number
  data: OperationsSenderIndexSignalsData
}

type MessageSnippetsCacheEntry = {
  expiresAt: number
  data: OperationsMessageSnippetsData
}

type MessagePreviewCacheEntry = {
  expiresAt: number
  data: OperationsMessagePreviewData
}

type CleanupGroupIntelligenceCacheEntry = {
  expiresAt: number
  data: OperationsCleanupGroupIntelligenceData
}

function normalizeInboxAnalysisRequestContext(
  value: OperationsInboxAnalysisRequestContext | undefined
): {
  source: string | null
  component: string | null
  reason: string | null
  phase: OperationsInboxAnalysisRequestContext['phase'] | null
} {
  return {
    source: typeof value?.source === 'string' && value.source.trim() ? value.source.trim() : null,
    component:
      typeof value?.component === 'string' && value.component.trim() ? value.component.trim() : null,
    reason: typeof value?.reason === 'string' && value.reason.trim() ? value.reason.trim() : null,
    phase: value?.phase || null,
  }
}

function normalizeOperationsInboxAnalysisAction(
  value: unknown
): OperationsInboxAnalysisAction | null {
  switch (value) {
    case 'review_query_cluster':
    case 'browse_query_cluster':
    case 'sender_index_signals':
    case 'load_message_snippets':
    case 'load_message_preview':
    case 'cleanup_group_intelligence':
      return value
    default:
      return null
  }
}

async function postOperationsInboxAnalysis(params: {
  action: OperationsInboxAnalysisAction | null | undefined
  body: Record<string, unknown>
  signal?: AbortSignal
}): Promise<Response | null> {
  const action = normalizeOperationsInboxAnalysisAction(params.action)
  if (!action) {
    console.warn(
      `[operations][inbox-analysis-client-guard] ${JSON.stringify({
        blocked: true,
        reason: 'missing_action',
      })}`
    )
    return null
  }

  return fetch('/api/integrations/gmail/inbox-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      ...params.body,
      action,
    }),
  })
}

const opsGlobal = globalThis as typeof globalThis & {
  __operationsReviewInflight?: Map<
    string,
    Promise<{ ok: true; data: OperationsQueryClusterReviewData } | { ok: false; error: string }>
  >
  __operationsReviewCache?: Map<string, ReviewCacheEntry>
  __operationsBrowserInflight?: Map<
    string,
    Promise<{ ok: true; data: OperationsQueryClusterBrowserData } | { ok: false; error: string }>
  >
  __operationsBrowserCache?: Map<string, BrowserCacheEntry>
  __operationsSenderSignalsInflight?: Map<
    string,
    Promise<{ ok: true; data: OperationsSenderIndexSignalsData } | { ok: false; error: string }>
  >
  __operationsSenderSignalsCache?: Map<string, SenderSignalsCacheEntry>
  __operationsMessageSnippetsInflight?: Map<
    string,
    Promise<{ ok: true; data: OperationsMessageSnippetsData } | { ok: false; error: string }>
  >
  __operationsMessageSnippetsCache?: Map<string, MessageSnippetsCacheEntry>
  __operationsMessagePreviewInflight?: Map<
    string,
    Promise<{ ok: true; data: OperationsMessagePreviewData } | { ok: false; error: string }>
  >
  __operationsMessagePreviewCache?: Map<string, MessagePreviewCacheEntry>
  __operationsCleanupGroupIntelligenceInflight?: Map<
    string,
    Promise<
      | { ok: true; data: OperationsCleanupGroupIntelligenceData }
      | { ok: false; error: string }
    >
  >
  __operationsCleanupGroupIntelligenceCache?: Map<string, CleanupGroupIntelligenceCacheEntry>
}

const operationsBrowserInflight =
  opsGlobal.__operationsBrowserInflight ||
  new Map<string, Promise<{ ok: true; data: OperationsQueryClusterBrowserData } | { ok: false; error: string }>>()
if (!opsGlobal.__operationsBrowserInflight) {
  opsGlobal.__operationsBrowserInflight = operationsBrowserInflight
}

const operationsReviewInflight =
  opsGlobal.__operationsReviewInflight ||
  new Map<
    string,
    Promise<{ ok: true; data: OperationsQueryClusterReviewData } | { ok: false; error: string }>
  >()
if (!opsGlobal.__operationsReviewInflight) {
  opsGlobal.__operationsReviewInflight = operationsReviewInflight
}

const operationsReviewCache =
  opsGlobal.__operationsReviewCache || new Map<string, ReviewCacheEntry>()
if (!opsGlobal.__operationsReviewCache) {
  opsGlobal.__operationsReviewCache = operationsReviewCache
}

const operationsBrowserCache =
  opsGlobal.__operationsBrowserCache || new Map<string, BrowserCacheEntry>()
if (!opsGlobal.__operationsBrowserCache) {
  opsGlobal.__operationsBrowserCache = operationsBrowserCache
}

const operationsSenderSignalsInflight =
  opsGlobal.__operationsSenderSignalsInflight ||
  new Map<
    string,
    Promise<{ ok: true; data: OperationsSenderIndexSignalsData } | { ok: false; error: string }>
  >()
if (!opsGlobal.__operationsSenderSignalsInflight) {
  opsGlobal.__operationsSenderSignalsInflight = operationsSenderSignalsInflight
}

const operationsSenderSignalsCache =
  opsGlobal.__operationsSenderSignalsCache || new Map<string, SenderSignalsCacheEntry>()
if (!opsGlobal.__operationsSenderSignalsCache) {
  opsGlobal.__operationsSenderSignalsCache = operationsSenderSignalsCache
}

const operationsMessageSnippetsInflight =
  opsGlobal.__operationsMessageSnippetsInflight ||
  new Map<
    string,
    Promise<{ ok: true; data: OperationsMessageSnippetsData } | { ok: false; error: string }>
  >()
if (!opsGlobal.__operationsMessageSnippetsInflight) {
  opsGlobal.__operationsMessageSnippetsInflight = operationsMessageSnippetsInflight
}

const operationsMessageSnippetsCache =
  opsGlobal.__operationsMessageSnippetsCache || new Map<string, MessageSnippetsCacheEntry>()
if (!opsGlobal.__operationsMessageSnippetsCache) {
  opsGlobal.__operationsMessageSnippetsCache = operationsMessageSnippetsCache
}

const operationsMessagePreviewInflight =
  opsGlobal.__operationsMessagePreviewInflight ||
  new Map<
    string,
    Promise<{ ok: true; data: OperationsMessagePreviewData } | { ok: false; error: string }>
  >()
if (!opsGlobal.__operationsMessagePreviewInflight) {
  opsGlobal.__operationsMessagePreviewInflight = operationsMessagePreviewInflight
}

const operationsMessagePreviewCache =
  opsGlobal.__operationsMessagePreviewCache || new Map<string, MessagePreviewCacheEntry>()
if (!opsGlobal.__operationsMessagePreviewCache) {
  opsGlobal.__operationsMessagePreviewCache = operationsMessagePreviewCache
}

const operationsCleanupGroupIntelligenceInflight =
  opsGlobal.__operationsCleanupGroupIntelligenceInflight ||
  new Map<
    string,
    Promise<
      | { ok: true; data: OperationsCleanupGroupIntelligenceData }
      | { ok: false; error: string }
    >
  >()
if (!opsGlobal.__operationsCleanupGroupIntelligenceInflight) {
  opsGlobal.__operationsCleanupGroupIntelligenceInflight = operationsCleanupGroupIntelligenceInflight
}

const operationsCleanupGroupIntelligenceCache =
  opsGlobal.__operationsCleanupGroupIntelligenceCache ||
  new Map<string, CleanupGroupIntelligenceCacheEntry>()
if (!opsGlobal.__operationsCleanupGroupIntelligenceCache) {
  opsGlobal.__operationsCleanupGroupIntelligenceCache = operationsCleanupGroupIntelligenceCache
}

export const OPERATIONS_ANALYSIS_SCOPE_OPTIONS = [
  '7d',
  '30d',
  '60d',
  '90d',
  '180d',
  '365d',
  'all_indexed',
] as const

export type OperationsAnalysisScope = (typeof OPERATIONS_ANALYSIS_SCOPE_OPTIONS)[number]
export const DEFAULT_OPERATIONS_ANALYSIS_SCOPE: OperationsAnalysisScope = 'all_indexed'

export function normalizeOperationsAnalysisScope(value: unknown): OperationsAnalysisScope {
  if (typeof value !== 'string') return DEFAULT_OPERATIONS_ANALYSIS_SCOPE
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
  return DEFAULT_OPERATIONS_ANALYSIS_SCOPE
}

export function analysisScopeLabel(scope: OperationsAnalysisScope): string {
  if (scope === 'all_indexed') return 'All indexed'
  return scope
}

export function analysisScopeControlLabel(scope: OperationsAnalysisScope): string {
  if (scope === '7d') return '1W'
  if (scope === '30d') return '1M'
  if (scope === '60d') return '2M'
  if (scope === '90d') return '1Q'
  if (scope === '180d') return '6M'
  if (scope === '365d') return '1Y'
  return 'All indexed'
}

export function analysisScopeDays(scope: OperationsAnalysisScope): number | null {
  if (scope === 'all_indexed') return null
  const parsed = Number.parseInt(scope.replace('d', ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function analysisScopeWindowLabel(
  scope: OperationsAnalysisScope | 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
): string {
  if (scope === 'all_indexed') return 'All indexed'
  if (typeof scope === 'number') return `${scope}d`
  return scope
}

export function getNextBroaderAnalysisScope(
  scope: OperationsAnalysisScope
): OperationsAnalysisScope | null {
  const normalized = normalizeOperationsAnalysisScope(scope)
  const currentIndex = OPERATIONS_ANALYSIS_SCOPE_OPTIONS.indexOf(normalized)
  if (currentIndex < 0 || currentIndex >= OPERATIONS_ANALYSIS_SCOPE_OPTIONS.length - 1) {
    return null
  }
  return OPERATIONS_ANALYSIS_SCOPE_OPTIONS[currentIndex + 1]
}

export function deriveOperationsIntelligenceCacheVersion(
  runtimeData: OperationsRuntimeData | null | undefined,
  loadedAt: number | null | undefined
): string | null {
  const cleanupPlanVersion =
    typeof runtimeData?.runtime_cleanup_plan?.generated_at === 'string' &&
    runtimeData.runtime_cleanup_plan.generated_at.trim()
      ? runtimeData.runtime_cleanup_plan.generated_at.trim()
      : null
  if (cleanupPlanVersion) return cleanupPlanVersion

  const mailboxFreshnessVersion =
    typeof runtimeData?.runtime_mailbox_profile?.freshness?.last_generated_at === 'string' &&
    runtimeData.runtime_mailbox_profile.freshness.last_generated_at.trim()
      ? runtimeData.runtime_mailbox_profile.freshness.last_generated_at.trim()
      : null
  if (mailboxFreshnessVersion) return mailboxFreshnessVersion

  const mailboxGeneratedVersion =
    typeof runtimeData?.runtime_mailbox_profile?.generated_at === 'string' &&
    runtimeData.runtime_mailbox_profile.generated_at.trim()
      ? runtimeData.runtime_mailbox_profile.generated_at.trim()
      : null
  if (mailboxGeneratedVersion) return mailboxGeneratedVersion

  return loadedAt != null ? String(loadedAt) : null
}

export type RuntimeCleanupPlanCluster = {
  cluster_id: string
  canonical_cluster_id: string
  legacy_cluster_ids: string[]
  cluster_type: string
  title: string
  query: string
  why_selected: string
  sender_count: number
  message_count: number
  estimated_count: number
  sample_preview: Array<{
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
  status: 'ready' | 'pending_approval' | 'approved' | 'executed'
  approval_id?: string
  proposed_action: {
    tool: 'gmail'
    action: 'review_query_cluster'
    args: Record<string, unknown>
  }
}

export type RuntimeReviewResult = {
  id: string
  kind: 'review_sender_cluster' | 'review_query_cluster'
  executed_at: string
  approval_id: string
  title: string
  objective: string
  source_label: string
  cluster_id: string | null
  cluster_type: string | null
  sender: string | null
  query: string | null
  estimated_count: number | null
  fetched_count: number
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
  risk_note: string | null
  safety_note: string | null
}

export type RuntimeSuggestionCandidate = {
  id: string
  label: string
  reason: string
  message_ids: string[]
  status: 'ready' | 'pending_approval' | 'approved' | 'executed'
  approval_id?: string
  proposed_action: {
    tool: string
    action: string
    args?: Record<string, unknown>
  }
}

export type RuntimeSuggestionSet = {
  id: string
  title: string
  summary: string
  candidates: RuntimeSuggestionCandidate[]
}

export type RuntimeApprovalQueueSummary = {
  pending: number
  approved: number
  executed: number
  rejected: number
  pending_approval_ids: string[]
  approved_approval_ids: string[]
  scope: 'session' | 'agent'
  scope_session_id?: string
}

export type RuntimeApprovalQueueItem = {
  approval_id: string
  created_at: string
  session_id?: string
  user_request?: string
  status: 'pending_approval' | 'approved' | 'executed' | 'rejected'
  proposed_actions: Array<{
    tool: string
    action: string
    args?: unknown
  }>
}

export type RuntimeMailboxProfile = {
  generated_at: string
  analysis_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  profile_model?: string
  metadata_scan_basis?: {
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
  native_signal_counts: {
    inbox_recent_estimate: number
    likely_machine_generated_recent_estimate: number
    likely_human_priority_recent_estimate: number
    stale_unread_30d_estimate: number
    stale_unread_60d_estimate: number
    stale_unread_90d_estimate: number
    category_primary_estimate: number
    category_promotions_estimate: number
    category_social_estimate: number
    category_updates_estimate: number
    category_forums_estimate: number
    unread_recent_estimate: number
    important_recent_estimate: number
    starred_recent_estimate: number
  }
  notes?: string[]
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
}

export type OperationsQueryClusterReviewData = {
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

export type OperationsQueryClusterBrowserData = {
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
  analysis_scope: OperationsAnalysisScope
  effective_discovery_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
  inbox_rows_considered: number
  discovery_rows_used: number
  rows_scanned: number
  review_units: Array<{
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
  }>
  selected_review_unit_id: string
  selected_review_unit: {
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
    preview_messages: OperationsQueryClusterReviewData['reviewed_messages_preview']
  }>
  messages: OperationsQueryClusterReviewData['reviewed_messages_preview']
}

export type OperationsSenderIndexSignalsData = {
  senders: Array<{
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
  }>
  indexed_message_count: number
  mailbox_estimated_total: number | null
  index_completion_pct: number | null
  source: 'gmail_index_cache'
}

export type OperationsMessageSnippetsData = {
  messages: Array<{
    message_id: string
    snippet: string | null
  }>
  source: 'gmail_metadata_live' | 'gmail_artifact_subject_date'
  availability: OptionalEvidenceDetailAvailability
}

function isOperationsMessageSnippetsData(value: unknown): value is OperationsMessageSnippetsData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (
    candidate.source !== 'gmail_metadata_live' &&
    candidate.source !== 'gmail_artifact_subject_date'
  ) {
    return false
  }
  if (!isOptionalEvidenceDetailAvailability(candidate.availability)) return false
  if (
    (candidate.availability.state === 'full_detail_available' &&
      candidate.source !== 'gmail_metadata_live') ||
    (candidate.availability.state === 'subject_only_available' &&
      candidate.source !== 'gmail_artifact_subject_date')
  ) {
    return false
  }
  if (!Array.isArray(candidate.messages)) return false
  return candidate.messages.every((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const message = entry as Record<string, unknown>
    return (
      typeof message.message_id === 'string' &&
      message.message_id.trim().length > 0 &&
      (message.snippet === null || typeof message.snippet === 'string')
    )
  })
}

export type OperationsMessagePreviewData = {
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

export type OperationsCleanupGroupIntelligenceData = {
  analysis_scope: OperationsAnalysisScope
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
  }>
  activity_timeline_granularity: 'day' | 'week' | 'month'
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

export type RuntimeCleanupStrategy = {
  generated_at: string
  analysis_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  freshness_status: 'fresh' | 'cached' | 'stale' | 'unknown'
  recommendation_confidence: 'preliminary' | 'moderate'
  protect_first: Array<{
    title: string
    reason: string
    estimated_count: number | null
  }>
  best_first_cleanup_waves: Array<{
    title: string
    reason: string
    estimated_count: number | null
  }>
  rule_opportunities: Array<{
    title: string
    reason: string
    estimated_count: number | null
  }>
  avoid_or_review_carefully: Array<{
    title: string
    reason: string
    estimated_count: number | null
  }>
}

export type OperationsSelectedClusterRailFamilyScopeState =
  | 'ready'
  | 'outside_timeframe'
  | 'unavailable_scope'

export type OperationsSelectedClusterRailFamilyScopeEntry = {
  scope: OperationsAnalysisScope
  cluster_id: string
  cluster_title: string | null
  artifact_version: string | null
  state: OperationsSelectedClusterRailFamilyScopeState
  visible_cluster_count: number
  timeline:
    | {
        granularity: 'hour' | 'day' | 'week' | 'month'
        items: Array<{
          label: string
          count: number
          bucket_start_iso?: string | null
          bucket_end_exclusive_iso?: string | null
        }>
      }
    | null
  signal:
    | {
        message_count: number
        dominant_sender: string | null
        semantic_resolution_distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution']
      }
    | null
}

export type OperationsSelectedClusterRailFamily = {
  cluster_id: string
  cluster_title: string | null
  scopes: OperationsSelectedClusterRailFamilyScopeEntry[]
}

export type OperationsRuntimeData = {
  session_id?: string
  runtime_evidence?: unknown | null
  runtime_cleanup_plan?: {
    generated_at: string
    clusters: RuntimeCleanupPlanCluster[]
  } | null
  runtime_review_results?: RuntimeReviewResult[]
  runtime_suggestion_sets?: RuntimeSuggestionSet[]
  runtime_approval_queue_summary?: RuntimeApprovalQueueSummary | null
  runtime_approval_queue_items?: RuntimeApprovalQueueItem[] | null
  runtime_mailbox_profile?: RuntimeMailboxProfile | null
  runtime_mailbox_intelligence?: GmailMailboxIntelligenceData | null
  runtime_sender_overview?: Record<string, GmailSenderWorkspaceData> | null
  runtime_selected_cluster_rail_family?: OperationsSelectedClusterRailFamily | null
  runtime_cleanup_strategy?: RuntimeCleanupStrategy | null
}

export type OperationsRuntimeResponse = {
  ok?: boolean
  error?: string
  reason?: string
  data?: OperationsRuntimeData
}

export function normalizeSenderIdentity(value: string | null | undefined): string {
  const raw = (value || '').trim().toLowerCase()
  if (!raw) return ''
  const emailMatch = raw.match(/<([^>]+)>/)
  const email = emailMatch?.[1]?.trim().toLowerCase() || raw
  if (!email) return raw
  const atIndex = email.indexOf('@')
  if (atIndex > 0 && atIndex < email.length - 1) return email
  return raw
}

export function classifyMessagePattern(subject: string | null | undefined): string {
  const normalized = (subject || '').toLowerCase()
  if (/\b(ship|shipping|delivery|dispatch|tracking)\b/.test(normalized)) return 'Shipping updates'
  if (/\b(invoice|receipt|payment|bill|refund)\b/.test(normalized)) return 'Invoices / receipts'
  if (/\b(newsletter|digest|subscription|unsubscribe|promo|sale|offer|deal)\b/.test(normalized)) {
    return 'Newsletter / promotional'
  }
  if (/\b(alert|verify|verification|otp|security|code)\b/.test(normalized)) return 'Alerts / security'
  if (/\b(order|purchase|confirmation)\b/.test(normalized)) return 'Order confirmations'
  return 'General updates'
}

export function deriveDominantSender(samples: RuntimeCleanupPlanCluster['sample_preview']): string {
  const counts = new Map<string, number>()
  for (const sample of samples) {
    const sender = (sample.from || '').trim() || 'Unknown sender'
    counts.set(sender, (counts.get(sender) || 0) + 1)
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  return top ? `${top[0]} (${top[1]})` : 'Unknown sender'
}

export function deriveDominantPattern(samples: RuntimeCleanupPlanCluster['sample_preview']): string {
  const counts = new Map<string, number>()
  for (const sample of samples) {
    const label = classifyMessagePattern(sample.subject)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  return top ? `${top[0]} (${top[1]})` : 'General updates'
}

export async function fetchOperationsRuntimeSnapshot(params: {
  agentId: string
  sessionId?: string | null
  analysisScope?: OperationsAnalysisScope
  forceMailboxProfileRefresh?: boolean
  preferredClusterId?: string | null
  transitionEdge?: 'smart_sync_handoff' | 'build_pending_poll' | null
}): Promise<OperationsRuntimeResponse> {
  const res = await fetch('/api/agents/playground', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: params.agentId,
      messages: [],
      session_id: params.sessionId || null,
      rehydrate_only: true,
      request_mode: 'playground',
      analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
      refresh_mailbox_profile: params.forceMailboxProfileRefresh === true,
      preferred_cluster_id:
        typeof params.preferredClusterId === 'string' && params.preferredClusterId.trim()
          ? params.preferredClusterId.trim()
          : null,
      transition_edge:
        params.transitionEdge === 'smart_sync_handoff' ||
        params.transitionEdge === 'build_pending_poll'
          ? params.transitionEdge
          : null,
    }),
  })
  return (await res.json()) as OperationsRuntimeResponse
}

export function serializeOperationsQuery(
  sessionId: string | null | undefined,
  analysisScope?: OperationsAnalysisScope | null
): string {
  const search = new URLSearchParams()
  if (sessionId && sessionId.trim()) {
    search.set('playground_session_id', sessionId.trim())
  }
  if (analysisScope && normalizeOperationsAnalysisScope(analysisScope) !== DEFAULT_OPERATIONS_ANALYSIS_SCOPE) {
    search.set('analysis_scope', normalizeOperationsAnalysisScope(analysisScope))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function fetchOperationsQueryClusterReviewData(params: {
  clusterId: string
  clusterType: string
  title: string
  query: string
  estimatedCount?: number | null
  maxResults?: number
  analysisScope?: OperationsAnalysisScope
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: OperationsQueryClusterReviewData } | { ok: false; error: string }> {
  const startedAt = Date.now()
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const maxResults =
    typeof params.maxResults === 'number' && Number.isFinite(params.maxResults)
      ? Math.min(Math.max(Math.round(params.maxResults), 10), 120)
      : undefined
  const requestKey = [
    params.clusterId,
    params.clusterType,
    params.title,
    params.query,
    normalizeOperationsAnalysisScope(params.analysisScope),
    maxResults || '',
  ].join('::')
  const nowMs = Date.now()
  const cached = operationsReviewCache.get(requestKey)
  if (cached && cached.expiresAt > nowMs) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'review_query_cluster',
        cluster_id: params.clusterId,
        review_unit_id: null,
        page: 1,
        page_size: maxResults || null,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: cached.data.fetched_count,
        rows_scanned: cached.data.fetched_count,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }
  const inflight = operationsReviewInflight.get(requestKey)
  if (inflight) {
    return inflight
  }

  const requestPromise = (async (): Promise<
    { ok: true; data: OperationsQueryClusterReviewData } | { ok: false; error: string }
  > => {
    const res = await postOperationsInboxAnalysis({
      action: 'review_query_cluster',
      body: {
        cluster_id: params.clusterId,
        cluster_type: params.clusterType,
        title: params.title,
        query: params.query,
        ...(typeof params.estimatedCount === 'number'
          ? { estimated_count: params.estimatedCount }
          : {}),
        ...(maxResults != null ? { max_results: maxResults } : {}),
        analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsQueryClusterReviewData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'review_query_cluster',
          cluster_id: params.clusterId,
          review_unit_id: null,
          page: 1,
          page_size: maxResults || null,
          interaction_filter: 'all',
          sender_filter_count: null,
          message_filter_count: null,
          rows_scanned: null,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load extended review evidence.',
      }
    }

    operationsReviewCache.set(requestKey, {
      expiresAt: Date.now() + OPERATIONS_REVIEW_CACHE_TTL_MS,
      data: payload.data,
    })
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'review_query_cluster',
        cluster_id: params.clusterId,
        review_unit_id: null,
        page: 1,
        page_size: maxResults || null,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: payload.data.fetched_count,
        rows_scanned: payload.data.fetched_count,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: false,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()

  operationsReviewInflight.set(requestKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsReviewInflight.delete(requestKey)
  }
}

export async function fetchOperationsQueryClusterMessagesBrowser(params: {
  clusterId: string
  clusterType: string
  title: string
  query: string
  analysisScope?: OperationsAnalysisScope
  reviewUnitId?: string
  page?: number
  pageSize?: number
  sort?: 'newest' | 'oldest'
  interactionFilter?: 'all' | 'unread' | 'starred_or_important' | 'no_recent_interaction_90d'
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<
  | { ok: true; data: OperationsQueryClusterBrowserData }
  | { ok: false; error: string }
> {
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const page =
    typeof params.page === 'number' && Number.isFinite(params.page)
      ? Math.max(1, Math.floor(params.page))
      : 1
  const pageSize =
    typeof params.pageSize === 'number' && Number.isFinite(params.pageSize)
      ? Math.min(Math.max(Math.floor(params.pageSize), 10), 200)
      : 50
  const sort = params.sort === 'oldest' ? 'oldest' : 'newest'
  const interactionFilter =
    params.interactionFilter === 'unread' ||
    params.interactionFilter === 'starred_or_important' ||
    params.interactionFilter === 'no_recent_interaction_90d'
      ? params.interactionFilter
      : 'all'

  const requestKey = [
    params.clusterId,
    params.clusterType,
    params.title,
    params.query,
    normalizeOperationsAnalysisScope(params.analysisScope),
    params.reviewUnitId?.trim() || '',
    page,
    pageSize,
    sort,
    interactionFilter,
  ].join('::')
  const nowMs = Date.now()
  const cached = operationsBrowserCache.get(requestKey)
  if (cached && cached.expiresAt > nowMs) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'browse_query_cluster',
        cluster_id: params.clusterId,
        review_unit_id: params.reviewUnitId?.trim() || null,
        page,
        page_size: pageSize,
        interaction_filter: interactionFilter,
        sender_filter_count: null,
        message_filter_count: cached.data.total_matching_count,
        rows_scanned: cached.data.rows_scanned,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: cached.data.fast_path_applied,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }
  const inflight = operationsBrowserInflight.get(requestKey)
  if (inflight) {
    return inflight
  }

  const requestPromise = (async (): Promise<
    | { ok: true; data: OperationsQueryClusterBrowserData }
    | { ok: false; error: string }
  > => {
    const startedAt = Date.now()
    const res = await postOperationsInboxAnalysis({
      action: 'browse_query_cluster',
      body: {
        cluster_id: params.clusterId,
        cluster_type: params.clusterType,
        title: params.title,
        query: params.query,
        analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
        ...(typeof params.reviewUnitId === 'string' && params.reviewUnitId.trim()
          ? { review_unit_id: params.reviewUnitId.trim() }
          : {}),
        page,
        page_size: pageSize,
        sort,
        interaction_filter: interactionFilter,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsQueryClusterBrowserData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      console.warn(
        `[operations][browser-fetch] ${JSON.stringify({
          source: 'network',
          request_key: requestKey,
          ok: false,
          status: res.status,
          duration_ms: Math.max(0, Date.now() - startedAt),
        })}`
      )
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'browse_query_cluster',
          cluster_id: params.clusterId,
          review_unit_id: params.reviewUnitId?.trim() || null,
          page,
          page_size: pageSize,
          interaction_filter: interactionFilter,
          sender_filter_count: null,
          message_filter_count: null,
          rows_scanned: null,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load paginated cluster evidence.',
      }
    }

    operationsBrowserCache.set(requestKey, {
      expiresAt: Date.now() + OPERATIONS_BROWSER_CACHE_TTL_MS,
      data: payload.data,
    })
    console.info(
      `[operations][browser-fetch] ${JSON.stringify({
        source: 'network',
        request_key: requestKey,
        ok: true,
        duration_ms: Math.max(0, Date.now() - startedAt),
      })}`
    )
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'browse_query_cluster',
        cluster_id: params.clusterId,
        review_unit_id: payload.data.selected_review_unit_id,
        page: payload.data.page,
        page_size: payload.data.page_size,
        interaction_filter: payload.data.interaction_filter,
        sender_filter_count: null,
        message_filter_count: payload.data.total_matching_count,
        rows_scanned: payload.data.rows_scanned,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: payload.data.cache_hit,
        fast_path_applied: payload.data.fast_path_applied,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()

  operationsBrowserInflight.set(requestKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsBrowserInflight.delete(requestKey)
  }
}

export async function fetchOperationsSenderIndexSignals(params: {
  senders: string[]
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: OperationsSenderIndexSignalsData } | { ok: false; error: string }> {
  const startedAt = Date.now()
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const normalizedSenders = Array.from(
    new Set(
      params.senders
        .map((entry) => normalizeSenderIdentity(entry))
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
  const requestKey = normalizedSenders.join('|')
  const nowMs = Date.now()
  const cached = operationsSenderSignalsCache.get(requestKey)
  if (cached && cached.expiresAt > nowMs) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'sender_index_signals',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: normalizedSenders.length,
        interaction_filter: 'all',
        sender_filter_count: normalizedSenders.length,
        message_filter_count: null,
        rows_scanned: null,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }
  const inflight = operationsSenderSignalsInflight.get(requestKey)
  if (inflight) {
    return inflight
  }

  const requestPromise = (async (): Promise<
    { ok: true; data: OperationsSenderIndexSignalsData } | { ok: false; error: string }
  > => {
    const res = await postOperationsInboxAnalysis({
      action: 'sender_index_signals',
      body: {
        senders: normalizedSenders,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsSenderIndexSignalsData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'sender_index_signals',
          cluster_id: null,
          review_unit_id: null,
          page: 1,
          page_size: normalizedSenders.length,
          interaction_filter: 'all',
          sender_filter_count: normalizedSenders.length,
          message_filter_count: null,
          rows_scanned: null,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load indexed sender intelligence.',
      }
    }
    operationsSenderSignalsCache.set(requestKey, {
      expiresAt: Date.now() + OPERATIONS_SIGNALS_CACHE_TTL_MS,
      data: payload.data,
    })
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'sender_index_signals',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: normalizedSenders.length,
        interaction_filter: 'all',
        sender_filter_count: normalizedSenders.length,
        message_filter_count: payload.data.senders.length,
        rows_scanned: payload.data.senders.length,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: false,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()
  operationsSenderSignalsInflight.set(requestKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsSenderSignalsInflight.delete(requestKey)
  }
}

export async function fetchOperationsMessageSnippets(params: {
  messageIds: string[]
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: OperationsMessageSnippetsData } | { ok: false; error: string }> {
  const startedAt = Date.now()
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const normalizedMessageIds = Array.from(
    new Set(
      params.messageIds
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    )
  ).slice(0, 200)

  if (normalizedMessageIds.length === 0) {
    return {
      ok: true,
      data: {
        messages: [],
        source: 'gmail_metadata_live',
        availability: FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY,
      },
    }
  }

  const requestKey = normalizedMessageIds.join('|')
  const nowMs = Date.now()
  const cached = operationsMessageSnippetsCache.get(requestKey)
  if (cached && cached.expiresAt > nowMs) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'load_message_snippets',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: normalizedMessageIds.length,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: normalizedMessageIds.length,
        rows_scanned: normalizedMessageIds.length,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }

  const inflight = operationsMessageSnippetsInflight.get(requestKey)
  if (inflight) {
    return inflight
  }

  const requestPromise = (async (): Promise<
    { ok: true; data: OperationsMessageSnippetsData } | { ok: false; error: string }
  > => {
    const res = await postOperationsInboxAnalysis({
      action: 'load_message_snippets',
      body: {
        message_ids: normalizedMessageIds,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsMessageSnippetsData }
      | null

    if (
      !res.ok ||
      !payload?.ok ||
      !payload.data ||
      !isOperationsMessageSnippetsData(payload.data)
    ) {
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'load_message_snippets',
          cluster_id: null,
          review_unit_id: null,
          page: 1,
          page_size: normalizedMessageIds.length,
          interaction_filter: 'all',
          sender_filter_count: null,
          message_filter_count: normalizedMessageIds.length,
          rows_scanned: normalizedMessageIds.length,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load Gmail snippets for visible review rows.',
      }
    }

    if (shouldCacheOptionalEvidenceDetail(payload.data.availability)) {
      operationsMessageSnippetsCache.set(requestKey, {
        expiresAt: Date.now() + OPERATIONS_MESSAGE_SNIPPETS_CACHE_TTL_MS,
        data: payload.data,
      })
    } else {
      operationsMessageSnippetsCache.delete(requestKey)
    }
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'load_message_snippets',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: normalizedMessageIds.length,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: normalizedMessageIds.length,
        rows_scanned: normalizedMessageIds.length,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: false,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()

  operationsMessageSnippetsInflight.set(requestKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsMessageSnippetsInflight.delete(requestKey)
  }
}

export function invalidateOperationsMessageSnippets(messageIds: string[]): void {
  const normalizedMessageIds = Array.from(
    new Set(
      messageIds
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    )
  ).slice(0, 200)

  if (normalizedMessageIds.length === 0) return
  operationsMessageSnippetsCache.delete(normalizedMessageIds.join('|'))
}

export async function fetchOperationsMessagePreview(params: {
  messageId: string
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: OperationsMessagePreviewData } | { ok: false; error: string }> {
  const startedAt = Date.now()
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const messageId = typeof params.messageId === 'string' ? params.messageId.trim() : ''

  if (!messageId) {
    return { ok: false, error: 'messageId is required.' }
  }

  const cached = operationsMessagePreviewCache.get(messageId)
  if (cached && cached.expiresAt > Date.now()) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'load_message_preview',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: 1,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: 1,
        rows_scanned: 1,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }

  const inflight = operationsMessagePreviewInflight.get(messageId)
  if (inflight) return inflight

  const requestPromise = (async (): Promise<
    { ok: true; data: OperationsMessagePreviewData } | { ok: false; error: string }
  > => {
    const res = await postOperationsInboxAnalysis({
      action: 'load_message_preview',
      body: {
        message_id: messageId,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsMessagePreviewData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'load_message_preview',
          cluster_id: null,
          review_unit_id: null,
          page: 1,
          page_size: 1,
          interaction_filter: 'all',
          sender_filter_count: null,
          message_filter_count: 1,
          rows_scanned: 1,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load full Gmail message preview.',
      }
    }

    operationsMessagePreviewCache.set(messageId, {
      expiresAt: Date.now() + OPERATIONS_MESSAGE_SNIPPETS_CACHE_TTL_MS,
      data: payload.data,
    })
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'load_message_preview',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: 1,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: 1,
        rows_scanned: 1,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: false,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()

  operationsMessagePreviewInflight.set(messageId, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsMessagePreviewInflight.delete(messageId)
  }
}

export async function fetchOperationsCleanupGroupIntelligence(params: {
  clusters: Array<{
    clusterId: string
    clusterType: string
    title: string
    query: string
  }>
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<
  | { ok: true; data: OperationsCleanupGroupIntelligenceData }
  | { ok: false; error: string }
> {
  const startedAt = Date.now()
  const requestContext = normalizeInboxAnalysisRequestContext(params.requestContext)
  const clusters = params.clusters
    .map((cluster) => ({
      cluster_id: cluster.clusterId.trim(),
      cluster_type: cluster.clusterType.trim(),
      title: cluster.title.trim(),
      query: cluster.query.trim(),
    }))
    .filter((cluster) => cluster.cluster_id && cluster.cluster_type && cluster.title && cluster.query)
    .slice(0, 25)

  if (clusters.length === 0) {
    return { ok: false, error: 'No cleanup groups are available for intelligence analysis.' }
  }

  const requestKey = [
    normalizeOperationsAnalysisScope(params.analysisScope),
    params.cacheVersion?.trim() || 'default',
    ...clusters.map((cluster) =>
      [cluster.cluster_id, cluster.cluster_type, cluster.title, cluster.query].join('::')
    ),
  ].join('|||')
  const nowMs = Date.now()
  const cached = operationsCleanupGroupIntelligenceCache.get(requestKey)
  if (cached && cached.expiresAt > nowMs) {
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'cleanup_group_intelligence',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: clusters.length,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: cached.data.cleanup_group_total_messages,
        rows_scanned: cached.data.cleanup_group_total_messages,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: 0,
        cache_hit: true,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: cached.data }
  }

  const inflight = operationsCleanupGroupIntelligenceInflight.get(requestKey)
  if (inflight) return inflight

  const requestPromise = (async (): Promise<
    | { ok: true; data: OperationsCleanupGroupIntelligenceData }
    | { ok: false; error: string }
  > => {
    const res = await postOperationsInboxAnalysis({
      action: 'cleanup_group_intelligence',
      body: {
        analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
        cache_version: params.cacheVersion?.trim() || undefined,
        clusters,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
      },
    })
    if (!res) {
      return {
        ok: false,
        error: 'Inbox analysis action is required before requesting Gmail analysis.',
      }
    }

    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: OperationsCleanupGroupIntelligenceData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      console.warn(
        `[operations][inbox-analysis-action] ${JSON.stringify({
          action: 'cleanup_group_intelligence',
          cluster_id: null,
          review_unit_id: null,
          page: 1,
          page_size: clusters.length,
          interaction_filter: 'all',
          sender_filter_count: null,
          message_filter_count: null,
          rows_scanned: null,
          request_source: requestContext.source,
          request_component: requestContext.component,
          request_reason: requestContext.reason,
          request_phase: requestContext.phase,
          duration_ms: Math.max(0, Date.now() - startedAt),
          cache_hit: false,
          fast_path_applied: null,
          ok: false,
        })}`
      )
      return {
        ok: false,
        error:
          payload?.error && payload.error.trim()
            ? payload.error
            : 'Failed to load mailbox intelligence from indexed cleanup data.',
      }
    }

    operationsCleanupGroupIntelligenceCache.set(requestKey, {
      expiresAt: Date.now() + OPERATIONS_INTELLIGENCE_CACHE_TTL_MS,
      data: payload.data,
    })
    console.info(
      `[operations][inbox-analysis-action] ${JSON.stringify({
        action: 'cleanup_group_intelligence',
        cluster_id: null,
        review_unit_id: null,
        page: 1,
        page_size: clusters.length,
        interaction_filter: 'all',
        sender_filter_count: null,
        message_filter_count: payload.data.cleanup_group_total_messages,
        rows_scanned: payload.data.cleanup_group_total_messages,
        request_source: requestContext.source,
        request_component: requestContext.component,
        request_reason: requestContext.reason,
        request_phase: requestContext.phase,
        duration_ms: Math.max(0, Date.now() - startedAt),
        cache_hit: false,
        fast_path_applied: null,
        ok: true,
      })}`
    )
    return { ok: true, data: payload.data }
  })()

  operationsCleanupGroupIntelligenceInflight.set(requestKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    operationsCleanupGroupIntelligenceInflight.delete(requestKey)
  }
}
