import type { SupabaseClient } from '@supabase/supabase-js'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
  loadIndexedGmailMessagesForTenant,
  syncGmailMailboxIndexForTenant,
  type GmailMailboxIndexSyncResult,
  type GmailMailboxIndexRow,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'

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

const inboxAnalysisGlobal = globalThis as typeof globalThis & {
  __gmailQueryClusterMatchCache?: Map<string, QueryClusterMatchCacheEntry>
  __gmailQueryClusterInflight?: Map<string, Promise<QueryClusterMatchCacheEntry>>
  __gmailCleanupGroupIntelligenceCache?: Map<string, CleanupGroupIntelligenceCacheEntry>
  __gmailCleanupGroupIntelligenceInflight?: Map<string, Promise<GmailCleanupGroupIntelligenceResult>>
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
  }>
  activity_timeline_granularity: 'week' | 'month'
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
  category_mix: Array<{ category: string; count: number }>
  pattern_mix: Array<{ pattern: string; count: number }>
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

export type GmailCleanupClusterType =
  | 'newsletters'
  | 'noreply_automation'
  | 'shopping_updates'
  | 'social_notifications'
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
  cluster_type: GmailCleanupClusterType
  title: string
  query: string
  why_selected: string
  estimated_count: number
  sample_preview: GmailCleanupClusterPreviewMessage[]
  risk_note: string
  safety_note: string
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
}

export type GmailCleanupDiscoveryDiagnostics = {
  index_state_load_ms: number
  index_sync_ms: number
  indexed_rows_load_ms: number
  coverage_load_ms: number
  discovery_build_ms: number
  total_ms: number
  index_sync_skipped_recent: boolean
  index_sync_reused_existing_coverage: boolean
  index_sync_recent_activity_ms: number | null
  index_sync_result_ok: boolean | null
  index_sync_result_mode: 'full' | 'incremental' | null
  index_sync_used_fallback_full_scan: boolean | null
  indexed_row_count: number
}

export type GmailCleanupDiscoveryResult =
  | { ok: true; data: GmailCleanupDiscoveryData; diagnostics?: GmailCleanupDiscoveryDiagnostics }
  | GmailReadFailure

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

function buildGmailCleanupClusterSpecs(params: {
  topSenders?: string[]
}): GmailCleanupClusterSpec[] {
  const safetyBase = 'in:inbox -is:starred -is:important -category:primary -from:me'
  const specs: GmailCleanupClusterSpec[] = [
    {
      cluster_id: 'newsletters',
      cluster_type: 'newsletters',
      title: 'Newsletter / unsubscribe-like traffic',
      query:
        `${safetyBase} (` +
        'category:promotions OR (subject:(newsletter OR digest OR roundup OR update) OR "unsubscribe" OR "manage preferences")' +
        ') -category:social -subject:(receipt OR invoice OR order OR shipped OR delivery OR tracking)',
      why_selected: 'Targets recurring subscription-style inbox traffic with low reply likelihood.',
      risk_note: 'Low to medium risk; still review for subscriptions you want to keep.',
    },
    {
      cluster_id: 'noreply-automation',
      cluster_type: 'noreply_automation',
      title: 'No-reply automated mail',
      query:
        `${safetyBase} (` +
        'from:noreply OR from:no-reply OR from:donotreply OR from:do-not-reply OR from:mailer-daemon OR subject:(notification OR automated OR alert)' +
        ') -subject:(newsletter OR digest OR promo OR promotion OR order OR shipped OR delivery OR tracking) -category:promotions -category:social',
      why_selected: 'Identifies machine-generated alerts and automation-heavy traffic.',
      risk_note: 'Low risk, but system/security alerts may still need retention.',
    },
    {
      cluster_id: 'shopping-updates',
      cluster_type: 'shopping_updates',
      title: 'Shopping / order updates',
      query:
        `${safetyBase} (` +
        'subject:(order OR shipped OR delivery OR tracking OR receipt OR invoice OR return OR refund) OR (category:updates subject:(order OR shipped OR delivery OR tracking))' +
        ') -category:social -category:promotions',
      why_selected: 'Finds transactional commerce updates often safe for staged review.',
      risk_note: 'Medium risk; keep recent warranty/returns and tax-related receipts.',
    },
    {
      cluster_id: 'social-notifications',
      cluster_type: 'social_notifications',
      title: 'Social / notification traffic',
      query:
        `${safetyBase} (` +
        'category:social OR subject:(mentioned OR follower OR comment OR liked OR reacted OR invite)' +
        ') -category:promotions',
      why_selected: 'Captures social feed-style traffic and low-priority notifications.',
      risk_note: 'Low risk, but some community notifications may be important.',
    },
    {
      cluster_id: 'old-read',
      cluster_type: 'old_read_mail',
      title: 'Old read inbox mail',
      query: 'in:inbox is:read older_than:120d -is:starred -is:important -category:primary -from:me',
      why_selected: 'Large volume candidate for conservative backlog reduction.',
      risk_note: 'Medium risk; old read mail can still include records you need.',
    },
    {
      cluster_id: 'unread-clutter',
      cluster_type: 'unread_clutter',
      title: 'Unread clutter backlog',
      query: 'in:inbox is:unread older_than:21d -is:starred -is:important -category:primary -from:me',
      why_selected: 'Surfaces stale unread backlog likely to contain low-priority clutter.',
      risk_note: 'Medium risk; unread status implies possible missed intent.',
    },
    {
      cluster_id: 'age-very-old',
      cluster_type: 'age_cluster',
      title: 'Very old inbox mail',
      query: 'in:inbox older_than:365d -is:starred -is:important -category:primary -from:me',
      why_selected: 'Time-based cluster for cautious long-tail cleanup planning.',
      risk_note: 'Medium risk; old threads may still carry historical value.',
    },
  ]

  const seenSenders = new Set<string>()
  for (const senderRaw of params.topSenders || []) {
    const token = senderTokenForQuery(senderRaw)
    if (!token || seenSenders.has(token)) continue
    seenSenders.add(token)
    if (seenSenders.size > 3) break

    specs.push({
      cluster_id: `sender-${seenSenders.size}`,
      cluster_type: 'sender_cluster',
      title: `Sender cluster: ${token}`,
      query: `in:inbox from:${token} -is:starred -is:important -category:primary`,
      why_selected: 'Sender-based cluster to review concentrated non-primary traffic from one source.',
      risk_note: 'Medium risk; sender clusters can include mixed-priority updates.',
    })
  }

  return specs
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
  const normalized = (subject || '').toLowerCase()
  if (/\b(newsletter|digest|subscription|promo|offer|sale|unsubscribe)\b/.test(normalized)) {
    return 'Newsletter / promotional'
  }
  if (/\b(invoice|receipt|payment|bill|refund)\b/.test(normalized)) {
    return 'Invoices / receipts'
  }
  if (/\b(order|shipping|delivery|tracking|shipped)\b/.test(normalized)) {
    return 'Commerce / shipping updates'
  }
  if (/\b(alert|security|otp|verify|verification|code)\b/.test(normalized)) {
    return 'Alerts / security'
  }
  if (/\b(meeting|calendar|call|follow up|question|thanks)\b/.test(normalized)) {
    return 'Human correspondence'
  }
  return 'General updates'
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
}): GmailQueryClusterBrowserData['sender_breakdown'] {
  const previewLimit = Math.min(Math.max(params.previewLimit ?? 8, 1), 10)
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
      const sortedPatterns = Array.from(entry.patternCounts.entries()).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
      )
      const dominantPattern = sortedPatterns[0]?.[0] || 'General updates'
      const patternSummary = sortedPatterns
        .slice(0, 2)
        .map(([label, count]) => `${label} (${count})`)
        .join(' · ')
      const previewMessages = [...entry.rows]
        .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
        .slice(0, previewLimit)
        .map((row) => asPreviewMessage(row))

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

export function buildCleanupGroupIntelligence(params: {
  rows: GmailMailboxIndexRow[]
  coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  analysisScope: GmailAnalysisScope
  clusterCount: number
}): GmailCleanupGroupIntelligenceData {
  const rows = [...params.rows].sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
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
  const timelineCounts = new Map<string, number>()

  const scopeDaysValue = scopeDays(params.analysisScope)
  const timelineGranularity: 'week' | 'month' =
    scopeDaysValue != null && scopeDaysValue <= 90 ? 'week' : 'month'

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

    const timestamp =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (timestamp != null) {
      if (current.firstSeenMs == null || timestamp < current.firstSeenMs) current.firstSeenMs = timestamp
      if (current.lastSeenMs == null || timestamp > current.lastSeenMs) current.lastSeenMs = timestamp
      if (cleanupFirstSeenMs == null || timestamp < cleanupFirstSeenMs) cleanupFirstSeenMs = timestamp
      if (cleanupLastSeenMs == null || timestamp > cleanupLastSeenMs) cleanupLastSeenMs = timestamp

      const date = new Date(timestamp)
      const bucket =
        timelineGranularity === 'week'
          ? (() => {
              const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
              const day = start.getUTCDay()
              const diff = day === 0 ? 6 : day - 1
              start.setUTCDate(start.getUTCDate() - diff)
              return start.toISOString().slice(0, 10)
            })()
          : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      timelineCounts.set(bucket, (timelineCounts.get(bucket) || 0) + 1)
    }

    if (isLikelyMachineGeneratedRow(row)) {
      humanAutomationCounts.set(
        'Automation-heavy',
        (humanAutomationCounts.get('Automation-heavy') || 0) + 1
      )
    } else if (isLikelyHumanPriorityRow(row)) {
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

  const activityTimeline = Array.from(timelineCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({
      label:
        timelineGranularity === 'week'
          ? label
          : (() => {
              const [year, month] = label.split('-')
              const parsed = Date.parse(`${label}-01T00:00:00Z`)
              if (!Number.isFinite(parsed)) return `${year}-${month}`
              return new Date(parsed).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })
            })(),
      count,
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
  const safeRows = params.inboxRows.filter(
    (row) =>
      !row.is_starred &&
      !row.is_important &&
      !rowCategoryHas(row, 'CATEGORY_PRIMARY')
  )

  const byNewsletter = safeRows.filter(
    (row) =>
      rowCategoryHas(row, 'CATEGORY_PROMOTIONS') ||
      /\b(newsletter|digest|roundup|unsubscribe|manage preferences|promo|offer|sale)\b/.test(
        rowSubject(row)
      )
  )
  const byAutomation = safeRows.filter((row) => isLikelyMachineGeneratedRow(row))
  const bySocial = safeRows.filter(
    (row) =>
      rowCategoryHas(row, 'CATEGORY_SOCIAL') ||
      /\b(mentioned|follower|comment|liked|reacted|invite)\b/.test(rowSubject(row))
  )
  const byUnreadBacklog = params.inboxRows.filter(
    (row) => row.is_unread && !row.is_starred && !row.is_important && isRowOlderThanDays(row, 21, params.nowMs)
  )

  const senderCounts = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of safeRows) {
    const sender = (row.sender || '').trim().toLowerCase()
    if (!sender) continue
    const list = senderCounts.get(sender) || []
    list.push(row)
    senderCounts.set(sender, list)
  }
  const senderCandidates = Array.from(senderCounts.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 2)

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

  pushIfEnough({
    cluster_id: 'newsletters',
    cluster_type: 'newsletters',
    title: 'Newsletter / promotional traffic',
    query:
      'in:inbox -is:starred -is:important -category:primary (category:promotions OR subject:(newsletter OR digest OR unsubscribe OR promo OR offer OR sale))',
    why_selected:
      'Fallback from indexed rows: recurring newsletter/promotional traffic remains reviewable even when strict query-spec clusters are sparse.',
    risk_note: 'Low to medium risk; preserve wanted subscriptions.',
    rows: byNewsletter,
  })
  pushIfEnough({
    cluster_id: 'noreply-automation',
    cluster_type: 'noreply_automation',
    title: 'No-reply / automation traffic',
    query:
      'in:inbox -is:starred -is:important -category:primary (from:noreply OR from:no-reply OR subject:(notification OR digest OR alert))',
    why_selected:
      'Fallback from indexed rows: machine-generated traffic forms a repeat cleanup opportunity.',
    risk_note: 'Low risk; still validate any security or account alerts.',
    rows: byAutomation,
  })
  pushIfEnough({
    cluster_id: 'social-notifications',
    cluster_type: 'social_notifications',
    title: 'Social / notification backlog',
    query:
      'in:inbox -is:starred -is:important -category:primary (category:social OR subject:(mentioned OR follower OR comment OR liked OR reacted OR invite))',
    why_selected:
      'Fallback from indexed rows: social-style notifications often have lower action value.',
    risk_note: 'Low to medium risk; community updates can still matter.',
    rows: bySocial,
  })
  pushIfEnough({
    cluster_id: 'unread-clutter',
    cluster_type: 'unread_clutter',
    title: 'Unread clutter backlog',
    query: 'in:inbox is:unread older_than:21d -is:starred -is:important -category:primary',
    why_selected: 'Fallback from indexed rows: aged unread backlog likely contains low-priority clutter.',
    risk_note: 'Medium risk; unread could include deferred intent.',
    rows: byUnreadBacklog,
  })

  for (const [index, [sender, rows]] of senderCandidates.entries()) {
    const token = senderTokenForQuery(sender)
    if (!token) continue
    pushIfEnough({
      cluster_id: `sender-fallback-${index + 1}`,
      cluster_type: 'sender_cluster',
      title: `Sender cluster: ${token}`,
      query: `in:inbox from:${token} -is:starred -is:important -category:primary`,
      why_selected:
        'Fallback from indexed rows: concentrated low-value sender traffic can be reviewed as a bounded cluster.',
      risk_note: 'Medium risk; sender streams can include mixed message priority.',
      rows,
    })
  }

  const preferredSenderTokens = Array.from(
    new Set(
      (params.topSenders || [])
        .map((sender) => senderTokenForQuery(sender || ''))
        .filter((token): token is string => Boolean(token))
    )
  )
  for (const token of preferredSenderTokens.slice(0, 2)) {
    const existing = clusters.some((cluster) => cluster.title.toLowerCase().includes(token))
    if (existing) continue
    const matchingRows = safeRows.filter((row) => rowSender(row).includes(token))
    pushIfEnough({
      cluster_id: `sender-priority-${token}`,
      cluster_type: 'sender_cluster',
      title: `Sender cluster: ${token}`,
      query: `in:inbox from:${token} -is:starred -is:important -category:primary`,
      why_selected:
        'Includes high-frequency sender from inbox analysis top senders to keep review workflow actionable.',
      risk_note: 'Medium risk; sender-level review required before mutation.',
      rows: matchingRows,
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
}): GmailCleanupDiscoveryData {
  const nowMs = Date.now()
  const indexedRows = [...params.indexedRows].sort(
    (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
  )

  const inboxRows = indexedRows.filter((row) => row.is_in_inbox)
  const selectedScopeDays = scopeDays(params.analysisScope)
  const scopedInboxRows =
    selectedScopeDays != null
      ? inboxRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
      : inboxRows
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

  const profiledTopSenders = senderFrequency.map((entry) => entry.sender).filter(Boolean).slice(0, 4)
  const mergedTopSenders = [...(params.topSenders || []), ...profiledTopSenders]
  const clusterSpecs = buildGmailCleanupClusterSpecs({
    topSenders: mergedTopSenders,
  })

  const clusters: GmailCleanupCluster[] = []
  const strictClusterMatchCounts: Array<{ cluster_id: string; count: number }> = []
  const fallbackClusterMatchCounts: Array<{ cluster_id: string; count: number }> = []
  const strictMatchedRowIds = new Set<string>()
  for (const spec of clusterSpecs) {
    const matchedRows = workingRows.filter((row) =>
      matchClusterSpecFromIndex({
        row,
        spec,
        nowMs,
      })
    )
    strictClusterMatchCounts.push({
      cluster_id: spec.cluster_id,
      count: matchedRows.length,
    })
    for (const row of matchedRows) strictMatchedRowIds.add(row.message_id)
    if (matchedRows.length === 0) continue
    const samplePreview = matchedRows.slice(0, CLEANUP_SAMPLE_PREVIEW_LIMIT).map(asPreviewMessage)
    clusters.push({
      cluster_id: spec.cluster_id,
      cluster_type: spec.cluster_type,
      title: spec.title,
      query: spec.query,
      why_selected: `${spec.why_selected} Indexed count: ${matchedRows.length}.`,
      estimated_count: matchedRows.length,
      sample_preview: samplePreview,
      risk_note: spec.risk_note,
      safety_note:
        'Index-backed discovery: bounded review still required before any mutation; exclusions for important/starred and recent human-like correspondence remain.',
      indexed_signal_window: computeIndexedWindowSignals({
        rows: matchedRows,
        nowMs,
      }),
    })
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

  return {
    generated_at: new Date().toISOString(),
    planning_mode: 'read_only',
    safety_defaults: CLEANUP_SAFETY_DEFAULTS,
    clusters: clusters.slice(0, 10),
    mailbox_profile: mailboxProfile,
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
      maxMessages: 50_000,
      allowFullRescanOnHistoryGap: false,
      logPrefix: `${logPrefix}/index-sync`,
    })
    if (!indexSync.ok && indexSync.reason !== 'missing_history_state') {
      console.warn(`${logPrefix} incremental index sync failed (non-fatal):`, indexSync.error)
    }

    const indexedRows = await loadIndexedGmailMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      limit: 50_000,
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
              limit: 50_000,
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
      const coverageStartedAt = Date.now()
      const coverage = await loadGmailMailboxIndexCoverageForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      const coverageLoadMs = Math.max(0, Date.now() - coverageStartedAt)
      const indexedRowsStartedAt = Date.now()
      const indexedRows = await loadIndexedGmailMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        limit: 50_000,
      })
      const indexedRowsLoadMs = Math.max(0, Date.now() - indexedRowsStartedAt)

      const selectedScopeDays = scopeDays(analysisScope)
      const inboxRows = indexedRows.filter((row) => row.is_in_inbox)
      const scopedInboxRows =
        selectedScopeDays != null
          ? inboxRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
          : inboxRows

      const specs: GmailCleanupClusterSpec[] = clusters.map((cluster) => ({
        cluster_id: cluster.cluster_id,
        cluster_type: cluster.cluster_type as GmailCleanupClusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: 'cleanup_group_intelligence',
        risk_note: 'cleanup_group_intelligence',
      }))

      const matchStartedAt = Date.now()
      const matchedById = new Map<string, GmailMailboxIndexRow>()
      for (const row of scopedInboxRows) {
        for (const spec of specs) {
          if (matchClusterSpecFromIndex({ row, spec, nowMs })) {
            matchedById.set(row.message_id, row)
            break
          }
        }
      }
      const matchingMs = Math.max(0, Date.now() - matchStartedAt)

      const buildStartedAt = Date.now()
      const matchedRows = Array.from(matchedById.values())
      const intelligence = buildCleanupGroupIntelligence({
        rows: matchedRows,
        coverage,
        analysisScope,
        clusterCount: clusters.length,
      })
      const buildMs = Math.max(0, Date.now() - buildStartedAt)

      cleanupGroupIntelligenceCache.set(cacheKey, {
        expires_at_ms: Date.now() + CLEANUP_GROUP_INTELLIGENCE_CACHE_TTL_MS,
        data: intelligence,
      })

      console.info(
        `${logPrefix} ${JSON.stringify({
          selected_analysis_scope: analysisScope,
          effective_discovery_window_days: intelligence.effective_discovery_window_days,
          cluster_count: clusters.length,
          cleanup_group_total_messages: intelligence.cleanup_group_total_messages,
          cleanup_group_sender_count: intelligence.cleanup_group_sender_count,
          indexed_total_rows: intelligence.indexed_total_rows,
          indexed_inbox_rows: intelligence.indexed_inbox_rows,
          scoped_inbox_rows: scopedInboxRows.length,
          matched_rows: matchedRows.length,
          cache_hit: false,
          coverage_load_ms: coverageLoadMs,
          indexed_rows_load_ms: indexedRowsLoadMs,
          matching_ms: matchingMs,
          build_ms: buildMs,
          duration_ms: Math.max(0, Date.now() - startedAt),
        })}`
      )

      return {
        ok: true,
        data: intelligence,
      }
    } catch (error) {
      console.error(`${logPrefix} Unexpected error:`, error)
      return fail(500, 'Unexpected error while loading cleanup-group intelligence.')
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
  const senderSignalMaxRows = queryMode === 'sender_detail' ? 2_000 : 8_000

  const senderStatsStartedAt = Date.now()
  const { data: senderStatsData, error: senderStatsError } = await params.supabase
    .from('gmail_sender_stats')
    .select(
      'sender,message_count,recent_count_30d,machine_probability,human_probability,last_seen'
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
  }

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

  for (const row of (senderStatsData || []) as Array<{
    sender: string
    message_count: number
    recent_count_30d: number
    machine_probability: number
    human_probability: number
    last_seen: string | null
  }>) {
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
  }

  const indexedCountStartedAt = Date.now()
  const { count: indexedMessageCount, error: indexedCountError } = await params.supabase
    .from('gmail_messages')
    .select('message_id', { count: 'exact', head: true })
    .eq('tenant_id', params.tenantId)
  if (indexedCountError) {
    console.warn(`${logPrefix} indexed count query warning:`, indexedCountError.message)
  }
  phaseMs.indexed_count_query_ms = Math.max(0, Date.now() - indexedCountStartedAt)

  const indexStateStartedAt = Date.now()
  const indexState = await loadGmailMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.index_state_load_ms = Math.max(0, Date.now() - indexStateStartedAt)

  const senders = Array.from(bySender.values())
    .sort((a, b) => b.message_count_indexed - a.message_count_indexed)
    .map((entry) => ({
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
      category_mix: Array.from(entry.category_counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
      pattern_mix: Array.from(entry.pattern_counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count })),
      exactness: 'indexed_exact' as const,
    }))
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
      indexed_message_count:
        typeof indexedMessageCount === 'number' && Number.isFinite(indexedMessageCount)
          ? indexedMessageCount
          : 0,
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

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
  }

  const seenMessageIds = new Set<string>()
  const messageIds: string[] = []
  for (const rawId of params.messageIds || []) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!id || seenMessageIds.has(id)) continue
    seenMessageIds.add(id)
    messageIds.push(id)
  }

  if (messageIds.length === 0) {
    return fail(400, 'message_ids are required for archive_messages.')
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
      return fail(412, 'Gmail is not connected for this tenant. Reconnect Gmail with modify scope.')
    }

    if (!hasInboxModifyScope(connectionRow.scopes)) {
      return fail(
        412,
        'Connected Gmail token does not include modify scope. Reconnect with gmail.modify or mail.google.com scope.'
      )
    }

    const refreshToken =
      typeof connectionRow.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
    let accessToken =
      typeof connectionRow.access_token === 'string' ? connectionRow.access_token.trim() : ''

    if (!accessToken || !refreshToken) {
      return fail(
        412,
        'Gmail token is incomplete for this tenant. Reconnect Gmail with modify scope.'
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
        return fail(412, 'Failed to refresh Gmail access token. Reconnect Gmail with modify scope.')
      }

      accessToken = refreshed.accessToken
    }

    let archivedCount = 0
    for (let offset = 0; offset < messageIds.length; offset += 100) {
      const chunk = messageIds.slice(offset, offset + 100)
      const modifyResponse = await fetch(GMAIL_BATCH_MODIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: chunk,
          removeLabelIds: ['INBOX'],
        }),
        cache: 'no-store',
      })

      const modifyData = (await modifyResponse
        .json()
        .catch(() => null)) as GmailBatchModifyResponse | null
      if (hasInsufficientScopeError(modifyResponse.status, modifyData)) {
        return fail(
          412,
          'Connected Gmail token does not include modify scope. Reconnect with gmail.modify or mail.google.com scope.'
        )
      }

      if (!modifyResponse.ok) {
        console.error(`${logPrefix} Gmail batchModify failed:`, modifyData)
        return fail(502, 'Failed to archive Gmail messages from Inbox.')
      }

      archivedCount += chunk.length
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
        requested_count: messageIds.length,
        archived_count: archivedCount,
        message_ids: messageIds.slice(0, 100),
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while archiving Gmail messages.')
  }
}

export async function discoverGmailCleanupClustersForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  topSenders?: string[]
  analysisScope?: GmailAnalysisScope
  logPrefix?: string
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
      index_sync_skipped_recent: false,
      index_sync_reused_existing_coverage: false,
      index_sync_recent_activity_ms: null,
      index_sync_result_ok: null,
      index_sync_result_mode: null,
      index_sync_used_fallback_full_scan: null,
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

    if (shouldSkipRecentIndexSync || shouldReuseExistingUsableIndex) {
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
        maxMessages: 50_000,
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

    const indexedRowsStartedAt = Date.now()
    const indexedRows = await loadIndexedGmailMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      limit: 50_000,
    })
    diagnostics.indexed_rows_load_ms = Math.max(0, Date.now() - indexedRowsStartedAt)
    diagnostics.indexed_row_count = indexedRows.length
    if (indexedRows.length > 0) {
      const coverageStartedAt = Date.now()
      const coverage = await loadGmailMailboxIndexCoverageForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      diagnostics.coverage_load_ms = Math.max(0, Date.now() - coverageStartedAt)
      const buildStartedAt = Date.now()
      const discovery = buildDiscoveryFromIndexedRows({
        indexedRows,
        coverage,
        analysisScope,
        topSenders: params.topSenders,
      })
      diagnostics.discovery_build_ms = Math.max(0, Date.now() - buildStartedAt)
      diagnostics.total_ms = Math.max(0, Date.now() - discoveryStartedAt)
      console.info(
        `${logPrefix} index-backed discovery ${JSON.stringify({
          selected_analysis_scope: analysisScope,
          effective_discovery_window_days:
            discovery.mailbox_profile?.cluster_diagnostics?.source_counts.discovery_window_days ??
            discovery.mailbox_profile?.analysis_window_days ??
            null,
          indexed_row_count: coverage.indexed_total_rows,
          indexed_inbox_row_count: coverage.indexed_inbox_rows,
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
