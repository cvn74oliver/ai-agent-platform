import type { SupabaseClient } from '@supabase/supabase-js'
import {
  GMAIL_MAILBOX_INDEX_HEARTBEAT_INTERVAL_MS,
  GMAIL_MAILBOX_INDEX_STALL_THRESHOLD_MS,
  GMAIL_OPERATOR_BACKFILL_DEFAULT_WINDOW_MONTHS,
  clampGmailMailboxIndexMaxMessages,
  normalizeGmailOperatorBackfillWindowMonths,
  normalizeGmailMailboxIndexTrigger,
  type GmailMailboxIndexTrigger,
  type GmailOperatorBackfillWindowMonths,
} from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  recomputeGmailSenderStatsFromFullMailbox,
  recomputeGmailSenderStatsForSenders,
} from '@/lib/integrations/gmail/gmailArtifactFullMailboxProjector'
import type {
  GmailArtifactIncrementalChangedMessage,
  GmailArtifactIncrementalMessageRow,
  GmailArtifactIncrementalRefreshHint,
} from '@/lib/integrations/gmail/gmailArtifactIncrementalUpdater'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_MESSAGE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_HISTORY_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/history'

const INBOX_READ_SCOPE_SUFFIXES = new Set(['/gmail.readonly', '/gmail.metadata', '/gmail.modify'])
const INDEX_QUERY_PAGE_SIZE = 1_000
const LIST_PAGE_SIZE = 500
const METADATA_CONCURRENCY_DEFAULT = 20
const METADATA_CONCURRENCY_DEGRADED = 10
const FULL_SCAN_METADATA_CONCURRENCY_DEFAULT = 10
const FULL_SCAN_METADATA_CONCURRENCY_DEGRADED = 5
const METADATA_BATCH_SLOW_MS = 1_500
const FULL_SCAN_METADATA_BATCH_DELAY_MS = 125
const FULL_SCAN_METADATA_PRESSURE_DELAY_MS = 250
const UPSERT_BATCH_SIZE = 500
const RETRY_MAX_ATTEMPTS = 4
const RETRY_BASE_DELAY_MS = 250
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const METADATA_RATE_LIMIT_MAX_ATTEMPTS = 5
const METADATA_RATE_LIMIT_BASE_DELAY_MS = 1_000
const HISTORY_RECOVERY_FULL_SCAN_COOLDOWN_MS = 30 * 60 * 1000
const HISTORY_RECOVERY_PARTIAL_SCAN_COOLDOWN_MS = 10 * 60 * 1000
const SMART_SYNC_BOUNDED_SCAN_MAX_MESSAGES = 2_500
const MAILBOX_INDEX_RECENT_HEALTH_WINDOW_DAYS = 14
const MAILBOX_INDEX_FRESH_HEAD_RECOVERY_WINDOW_DAYS = 45
const MAILBOX_INDEX_RECOVERY_BRIDGE_OVERLAP_DAYS = 2
const MAILBOX_INDEX_RECENT_HEALTH_QUERY_LIMIT = 20_000
const MAILBOX_INDEX_MAX_NEWEST_MESSAGE_AGE_MS = 18 * 60 * 60 * 1000
const INDEXED_ROWS_CACHE_TTL_MS = 1000 * 60 * 3
const INDEX_QUERY_CONCURRENCY = 8
const UTC_DAY_MS = 24 * 60 * 60 * 1000

type GmailConnectionRow = {
  access_token: unknown
  refresh_token: unknown
  expires_at: unknown
  scopes: unknown
}

type GoogleRefreshTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type GmailListMessagesResponse = {
  messages?: Array<{ id?: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

type GmailMessageMetadataResponse = {
  threadId?: string
  historyId?: string
  internalDate?: string
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

type GmailHistoryListResponse = {
  historyId?: string
  nextPageToken?: string
  history?: Array<{
    id?: string
    messages?: Array<{ id?: string }>
    messagesAdded?: Array<{ message?: { id?: string } }>
    messagesDeleted?: Array<{ message?: { id?: string } }>
    labelsAdded?: Array<{ message?: { id?: string } }>
    labelsRemoved?: Array<{ message?: { id?: string } }>
  }>
  error?: {
    message?: string
    errors?: Array<{ reason?: string; message?: string }>
  }
}

export type GmailMailboxIndexRow = {
  tenant_id: string
  message_id: string
  thread_id: string | null
  sender: string | null
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

type GmailMailboxIndexFailureDetail = {
  stage: 'metadata_fetch' | 'history_list'
  classification:
    | 'auth'
    | 'insufficient_scope'
    | 'not_found'
    | 'retryable_api'
    | 'non_retryable_api'
    | 'history_out_of_date'
    | 'invalid_history_request'
  status: number | null
  provider_reason: string | null
  provider_message: string | null
  list_pages_fetched: number | null
  processed_messages: number | null
  page_token: string | null
  metadata_batch_size: number | null
  failed_message_ids_sample: string[]
  retry_attempts: number | null
  start_history_id?: string | null
}

type GmailMailboxIndexYieldDetail = {
  inserted_rows: number
  updated_rows: number
  already_indexed_rows: number
  existing_rows_seen: number
  oldest_message_seen_at: string | null
  newest_message_seen_at: string | null
  next_page_token_present: boolean | null
  recovery_bridge_status?: 'pending' | 'completed' | 'failed' | null
  recovery_bridge_boundary_at?: string | null
  recovery_bridge_cutoff_at?: string | null
}

export type GmailMailboxIndexState = {
  tenant_id: string
  last_history_id: string | null
  last_full_scan_at: string | null
  last_incremental_sync_at: string | null
  indexed_message_count: number
  mailbox_estimated_total: number | null
  index_completion_pct: number | null
  last_index_duration_ms: number | null
  last_sync_status: string | null
  last_sync_error: string | null
  active_run_id: string | null
  active_run_mode: 'full' | 'incremental' | null
  active_requested_mode: 'full' | 'incremental' | null
  active_effective_mode: 'full' | 'incremental' | null
  active_run_trigger: GmailMailboxIndexTrigger | null
  active_requested_max_messages: number | null
  active_started_at: string | null
  active_heartbeat_at: string | null
  active_rows_before: number | null
  active_processed_messages: number | null
  active_list_pages_fetched: number | null
  active_next_page_token: string | null
  active_last_page_index: number | null
  active_last_processed_at: string | null
  active_yield_detail: GmailMailboxIndexYieldDetail | null
  last_run_id: string | null
  last_run_trigger: GmailMailboxIndexTrigger | null
  last_completed_at: string | null
  last_completed_mode: 'full' | 'incremental' | null
  last_requested_mode: 'full' | 'incremental' | null
  last_effective_mode: 'full' | 'incremental' | null
  last_rows_before: number | null
  last_rows_after: number | null
  last_growth_delta: number | null
  last_processed_messages: number | null
  last_upserted_messages: number | null
  last_deleted_messages: number | null
  last_failure_reason: string | null
  last_failure_reason_detail: GmailMailboxIndexFailureDetail | null
  last_terminal_reason: string | null
  last_gmail_result_size_estimate: number | null
  last_list_pages_fetched: number | null
  last_resume_page_token: string | null
  last_resume_page_index: number | null
  last_resume_processed_at: string | null
  backfill_resume_page_token: string | null
  backfill_resume_page_index: number | null
  backfill_resume_processed_messages: number | null
  backfill_resume_processed_at: string | null
  active_backfill_window_months: GmailOperatorBackfillWindowMonths | null
  active_backfill_cutoff_at: string | null
  backfill_completed_window_months: GmailOperatorBackfillWindowMonths | null
  backfill_completed_cutoff_at: string | null
  backfill_completed_at: string | null
  active_started_from_checkpoint: boolean | null
  last_started_from_checkpoint: boolean | null
  last_yield_detail: GmailMailboxIndexYieldDetail | null
  updated_at: string
}

export type GmailMailboxIndexCoverage = {
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
}

export type GmailMailboxRecentHealth = {
  recent_window_days: number
  recent_cutoff_at: string
  indexed_newest_message_at: string | null
  newest_message_age_ms: number | null
  newest_message_behind_expected: boolean
  missing_recent_days: string[]
  gap_pairs: Array<{ from: string; to: string; missing_days: number }>
  recent_day_counts: Array<{ date: string; count: number }>
  false_healthy_state: boolean
  reason:
    | 'recent_gap_detected'
    | 'newest_message_behind_expected'
    | 'recent_gap_and_newest_lag'
    | 'continuity_bridge_pending'
    | null
}

type IndexedRowsCacheEntry = {
  expires_at_ms: number
  rows: GmailMailboxIndexRow[]
}

type GmailMailboxIndexRunContext = {
  runId: string
  trigger: GmailMailboxIndexTrigger
  rowsBefore: number
  requestedMode: 'full' | 'incremental'
  backfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
}

type GmailMailboxIndexComparableRow = Pick<
  GmailMailboxIndexRow,
  | 'message_id'
  | 'thread_id'
  | 'sender'
  | 'subject'
  | 'internal_date_ms'
  | 'date'
  | 'label_ids'
  | 'category_labels'
  | 'is_in_inbox'
  | 'is_unread'
  | 'is_starred'
  | 'is_important'
>

type GmailMailboxIndexTerminalReason =
  | 'missing_tenant'
  | 'requested_limit_reached'
  | 'historical_window_reached'
  | 'gmail_pagination_exhausted'
  | 'empty_page'
  | 'auth_failed'
  | 'gmail_list_failed'
  | 'gmail_metadata_failed'
  | 'database_failed'
  | 'recent_window_reached'
  | 'recovery_bridge_completed'
  | 'recovery_bridge_yielded'
  | 'sender_stats_failed'
  | 'already_running'
  | 'incremental_sync_complete'
  | 'incremental_sync_degraded'
  | 'incremental_history_listing_failed'
  | 'incremental_history_out_of_date'
  | 'missing_history_state'

const indexedRowsCache = new Map<string, IndexedRowsCacheEntry>()
const indexedRowsInflight = new Map<string, Promise<GmailMailboxIndexRow[]>>()

type GmailMailboxIndexFailureReason =
  | 'missing_tenant'
  | 'missing_connection'
  | 'missing_token'
  | 'insufficient_scope'
  | 'refresh_failed'
  | 'gmail_api_failed'
  | 'history_out_of_date'
  | 'missing_history_state'
  | 'database_failed'
  | 'already_running'

type GmailMetadataFailureClassification =
  | 'auth'
  | 'insufficient_scope'
  | 'not_found'
  | 'retryable_api'
  | 'non_retryable_api'

type GmailHistoryFailureClassification =
  | 'auth'
  | 'insufficient_scope'
  | 'history_out_of_date'
  | 'invalid_history_request'
  | 'retryable_api'
  | 'non_retryable_api'

type GmailApiErrorDetails = {
  providerReason: string | null
  providerMessage: string | null
}

type GmailMailboxIndexResumeCheckpoint = {
  source:
    | 'stale_active'
    | 'last_failed'
    | 'backfill_saved'
    | 'backfill_legacy_adopted'
  nextPageToken: string | null
  pageIndex: number
  processedMessages: number
  processedAt: string | null
}

type GmailMailboxIndexResumeCheckpointSummary = {
  usable: boolean
  next_page_token_present: boolean
  page_index: number | null
  processed_messages: number | null
  processed_at: string | null
}

export type GmailAcceptedMailboxIndexRun = {
  run_id: string
  requested_mode: 'full' | 'incremental'
  effective_mode: 'full' | 'incremental'
  trigger: 'smart_sync' | 'operator_backfill'
  rows_before: number
  resume_checkpoint: GmailMailboxIndexResumeCheckpointSummary | null
  started_from_checkpoint: boolean
  backfill_window_months?: GmailOperatorBackfillWindowMonths | null
  backfill_cutoff_at?: string | null
}

type GmailHistoryMessageChange = {
  added: boolean
  labelsChanged: boolean
}

type GmailMessageMetadataSuccess = {
  ok: true
  metadata: GmailMessageMetadataResponse
  metrics: { duration_ms: number; had_retryable_signal: boolean; attempts: number }
}

type GmailMessageMetadataFailure = {
  ok: false
  reason: GmailMailboxIndexFailureReason
  error: string
  status: number
  providerReason: string | null
  providerMessage: string | null
  retryable: boolean
  attempts: number
  classification: GmailMetadataFailureClassification
}

type GmailMessageMetadataResult = GmailMessageMetadataSuccess | GmailMessageMetadataFailure

type GmailHistoryListFailure = {
  ok: false
  reason: GmailMailboxIndexFailureReason
  error: string
  status: number
  providerReason: string | null
  providerMessage: string | null
  retryable: boolean
  attempts: number | null
  classification: GmailHistoryFailureClassification
  failureDetail: GmailMailboxIndexFailureDetail
}

export type GmailMailboxIndexSyncResult =
  | {
      ok: true
      mode: 'full' | 'incremental'
      requested_mode: 'full' | 'incremental'
      effective_mode: 'full' | 'incremental'
      run_id: string
      trigger: GmailMailboxIndexTrigger
      terminal_reason: GmailMailboxIndexTerminalReason
      gmail_result_size_estimate: number | null
      list_pages_fetched: number | null
      processed_messages: number
      upserted_messages: number
      deleted_messages: number
      indexed_message_count: number
      rows_before: number
      rows_after: number
      growth_delta: number
      last_history_id: string | null
      used_fallback_full_scan: boolean
      artifact_refresh_hint?: GmailArtifactIncrementalRefreshHint | null
    }
  | {
      ok: true
      deferred: true
      reason: 'manual_full_run_active' | 'recovery_bridge_yielded'
      mode: 'full' | 'incremental'
      requested_mode: 'full' | 'incremental'
      effective_mode: 'full' | 'incremental'
      run_id: string
      active_run_id: string | null
      trigger: GmailMailboxIndexTrigger
      terminal_reason: GmailMailboxIndexTerminalReason
      gmail_result_size_estimate: number | null
      list_pages_fetched: number | null
      processed_messages: number
      upserted_messages: number
      deleted_messages: number
      indexed_message_count: number
      rows_before: number
      rows_after: number
      growth_delta: number
      last_history_id: string | null
      used_fallback_full_scan: false
      artifact_refresh_hint?: null
    }
  | {
      ok: false
      mode: 'full' | 'incremental'
      requested_mode: 'full' | 'incremental'
      effective_mode: 'full' | 'incremental'
      run_id: string
      trigger: GmailMailboxIndexTrigger
      reason: GmailMailboxIndexFailureReason
      error: string
      terminal_reason: GmailMailboxIndexTerminalReason
      gmail_result_size_estimate: number | null
      list_pages_fetched: number | null
      rows_before: number
      rows_after: number
      growth_delta: number
      last_history_id?: string | null
      used_fallback_full_scan?: boolean
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim().toLowerCase())
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

function isExpiredTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false
  return parsed <= Date.now()
}

function hasInsufficientScopeError(status: number, payload: unknown): boolean {
  if (status !== 403 || !isRecord(payload)) return false
  const error = isRecord(payload.error) ? payload.error : null
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : ''
  if (message.includes('insufficient') && message.includes('scope')) return true
  const nested = Array.isArray(error?.errors) ? error.errors : []
  for (const entry of nested) {
    if (!isRecord(entry)) continue
    const reason = typeof entry.reason === 'string' ? entry.reason.toLowerCase() : ''
    const nestedMessage = typeof entry.message === 'string' ? entry.message.toLowerCase() : ''
    if (reason.includes('insufficient')) return true
    if (nestedMessage.includes('insufficient') && nestedMessage.includes('scope')) return true
  }
  return false
}

function extractGmailApiErrorDetails(payload: unknown): GmailApiErrorDetails {
  if (!isRecord(payload)) {
    return {
      providerReason: null,
      providerMessage: null,
    }
  }
  const error = isRecord(payload.error) ? payload.error : null
  const providerMessage =
    typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : null
  const nested = Array.isArray(error?.errors) ? error.errors : []
  for (const entry of nested) {
    if (!isRecord(entry)) continue
    const providerReason =
      typeof entry.reason === 'string' && entry.reason.trim() ? entry.reason.trim() : null
    const nestedMessage =
      typeof entry.message === 'string' && entry.message.trim() ? entry.message.trim() : null
    if (providerReason || nestedMessage) {
      return {
        providerReason,
        providerMessage: nestedMessage ?? providerMessage,
      }
    }
  }
  return {
    providerReason: null,
    providerMessage,
  }
}

function isAuthLikeGmailApiError(params: {
  status: number
  providerReason: string | null
  providerMessage: string | null
}): boolean {
  const providerReason = params.providerReason?.toLowerCase() ?? ''
  const providerMessage = params.providerMessage?.toLowerCase() ?? ''
  return (
    params.status === 401 ||
    providerReason === 'autherror' ||
    providerReason === 'invalid_credentials' ||
    providerReason === 'invalidcredentials' ||
    providerMessage.includes('invalid credentials') ||
    providerMessage.includes('login required')
  )
}

function isRetryableGmailProviderReason(providerReason: string | null): boolean {
  const normalized = providerReason?.toLowerCase() ?? ''
  return (
    normalized === 'ratelimitexceeded' ||
    normalized === 'userratelimitexceeded' ||
    normalized === 'backenderror'
  )
}

function classifyMetadataFailure(params: {
  status: number
  payload: unknown
  providerReason: string | null
  providerMessage: string | null
  hadRetryableSignal: boolean
}): GmailMetadataFailureClassification {
  if (params.status === 404) return 'not_found'
  if (hasInsufficientScopeError(params.status, params.payload)) return 'insufficient_scope'
  if (
    isAuthLikeGmailApiError({
      status: params.status,
      providerReason: params.providerReason,
      providerMessage: params.providerMessage,
    })
  ) {
    return 'auth'
  }
  if (
    isRetryableStatus(params.status) ||
    isRetryableGmailProviderReason(params.providerReason) ||
    params.hadRetryableSignal
  ) {
    return 'retryable_api'
  }
  return 'non_retryable_api'
}

function isInvalidHistoryRequestError(params: {
  status: number
  providerReason: string | null
  providerMessage: string | null
}): boolean {
  if (params.status !== 400) return false
  const providerReason = params.providerReason?.toLowerCase() ?? ''
  const providerMessage = params.providerMessage?.toLowerCase() ?? ''
  return (
    providerReason === 'invalid' ||
    providerMessage.includes('invalid argument') ||
    providerMessage.includes("invalid value at 'history_types'") ||
    providerMessage.includes('history_types')
  )
}

function classifyHistoryFailure(params: {
  status: number
  payload: unknown
  providerReason: string | null
  providerMessage: string | null
  hadRetryableSignal: boolean
}): GmailHistoryFailureClassification {
  if (hasHistoryOutOfDateError(params.status, params.payload)) return 'history_out_of_date'
  if (hasInsufficientScopeError(params.status, params.payload)) return 'insufficient_scope'
  if (
    isAuthLikeGmailApiError({
      status: params.status,
      providerReason: params.providerReason,
      providerMessage: params.providerMessage,
    })
  ) {
    return 'auth'
  }
  if (
    isInvalidHistoryRequestError({
      status: params.status,
      providerReason: params.providerReason,
      providerMessage: params.providerMessage,
    })
  ) {
    return 'invalid_history_request'
  }
  if (
    isRetryableStatus(params.status) ||
    isRetryableGmailProviderReason(params.providerReason) ||
    params.hadRetryableSignal
  ) {
    return 'retryable_api'
  }
  return 'non_retryable_api'
}

function hasHistoryOutOfDateError(status: number, payload: unknown): boolean {
  if (status === 404) return true
  if (status !== 400 || !isRecord(payload)) return false
  const error = isRecord(payload.error) ? payload.error : null
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : ''
  const nested = Array.isArray(error?.errors) ? error.errors : []
  const nestedReasons = nested
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map((entry) => ({
      reason: typeof entry.reason === 'string' ? entry.reason.toLowerCase() : '',
      message: typeof entry.message === 'string' ? entry.message.toLowerCase() : '',
    }))

  const text = [message, ...nestedReasons.map((entry) => `${entry.reason} ${entry.message}`)].join(' ')
  return (
    text.includes('start historyid') ||
    text.includes('historyid is too old') ||
    text.includes('invalid start historyid') ||
    (text.includes('history') && text.includes('too old'))
  )
}

function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string
): string | null {
  if (!Array.isArray(headers)) return null
  const found = headers.find(
    (entry) => typeof entry?.name === 'string' && entry.name.toLowerCase() === name.toLowerCase()
  )
  if (!found || typeof found.value !== 'string') return null
  const value = found.value.trim()
  return value || null
}

function dateIsoFromMetadata(message: GmailMessageMetadataResponse): string | null {
  const internalDateMs =
    typeof message.internalDate === 'string' ? Number(message.internalDate) : Number.NaN
  if (Number.isFinite(internalDateMs) && internalDateMs > 0) {
    return new Date(internalDateMs).toISOString()
  }
  const dateHeader = headerValue(message.payload?.headers, 'Date')
  if (!dateHeader) return null
  const parsed = Date.parse(dateHeader)
  if (!Number.isFinite(parsed)) return null
  return new Date(parsed).toISOString()
}

function isUsableMailboxInternalDateMs(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function normalizeLabelIds(labelIds: unknown): string[] {
  if (!Array.isArray(labelIds)) return []
  const dedupe = new Set<string>()
  const out: string[] = []
  for (const value of labelIds) {
    if (typeof value !== 'string') continue
    const label = value.trim()
    if (!label || dedupe.has(label)) continue
    dedupe.add(label)
    out.push(label)
  }
  return out
}

function categoryLabelsFromLabelIds(labelIds: string[]): string[] {
  return labelIds.filter((label) => label.startsWith('CATEGORY_'))
}

function parseHistoryId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function maxHistoryId(current: string | null, next: string | null): string | null {
  if (!next) return current
  if (!current) return next
  try {
    const currentBig = BigInt(current)
    const nextBig = BigInt(next)
    return nextBig > currentBig ? next : current
  } catch {
    return next > current ? next : current
  }
}

function normalizeSender(fromHeader: string | null): string | null {
  if (!fromHeader) return null
  const trimmed = fromHeader.trim()
  if (!trimmed) return null
  const angleMatch = trimmed.match(/<([^>]+)>/)
  if (angleMatch?.[1]) return angleMatch[1].trim().toLowerCase()
  return trimmed.toLowerCase()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100
}

function clearIndexedRowsCacheForTenant(tenantId: string): void {
  if (!tenantId.trim()) return
  indexedRowsCache.delete(tenantId.trim())
  for (const key of indexedRowsInflight.keys()) {
    if (key.startsWith(`${tenantId.trim()}::`)) {
      indexedRowsInflight.delete(key)
    }
  }
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status)
}

function isNetworkRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  )
}

function retryDelayMs(attempt: number): number {
  const base = RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)
  const jitter = Math.floor(Math.random() * 125)
  return base + jitter
}

function metadataRateLimitDelayMs(attempt: number): number {
  const base = METADATA_RATE_LIMIT_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)
  const jitter = Math.floor(Math.random() * 250)
  return base + jitter
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

class FetchWithRetryError extends Error {
  attempts: number
  hadRetryableSignal: boolean

  constructor(message: string, params: { attempts: number; hadRetryableSignal: boolean; cause?: unknown }) {
    super(message)
    this.name = 'FetchWithRetryError'
    this.attempts = params.attempts
    this.hadRetryableSignal = params.hadRetryableSignal
    if (params.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = params.cause
    }
  }
}

async function fetchWithRetry(
  input: string,
  init: RequestInit
): Promise<{
  response: Response
  attempts: number
  hadRetryableSignal: boolean
}> {
  let attempt = 0
  let hadRetryableSignal = false
  let lastError: unknown = null

  while (attempt < RETRY_MAX_ATTEMPTS) {
    attempt += 1
    try {
      const response = await fetch(input, init)
      if (!isRetryableStatus(response.status) || attempt >= RETRY_MAX_ATTEMPTS) {
        return {
          response,
          attempts: attempt,
          hadRetryableSignal,
        }
      }
      hadRetryableSignal = true
      await sleep(retryDelayMs(attempt))
      continue
    } catch (error) {
      lastError = error
      if (!isNetworkRetryableError(error) || attempt >= RETRY_MAX_ATTEMPTS) {
        throw new FetchWithRetryError(
          error instanceof Error ? error.message : 'Gmail request failed.',
          {
            attempts: attempt,
            hadRetryableSignal,
            cause: error,
          }
        )
      }
      hadRetryableSignal = true
      await sleep(retryDelayMs(attempt))
    }
  }

  throw new FetchWithRetryError('Gmail request failed after retries.', {
    attempts: RETRY_MAX_ATTEMPTS,
    hadRetryableSignal,
    cause: lastError,
  })
}

async function refreshGmailAccessToken(params: {
  refreshToken: string
  logPrefix: string
}): Promise<
  | { ok: true; accessToken: string }
  | { ok: false; error: string; providerCode: string | null; providerDescription: string | null }
> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.',
      providerCode: null,
      providerDescription: null,
    }
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
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
    console.error(`${params.logPrefix} refresh token failed`, tokenData)
    const providerCode = typeof tokenData?.error === 'string' && tokenData.error.trim() ? tokenData.error.trim() : null
    const providerDescription =
      typeof tokenData?.error_description === 'string' && tokenData.error_description.trim()
        ? tokenData.error_description.trim()
        : null
    const reconnectRequired = providerCode === 'invalid_grant'
    return {
      ok: false,
      error: reconnectRequired
        ? 'Gmail refresh token is expired or revoked. Reconnect Gmail to continue indexing.'
        : 'Failed to refresh Gmail access token.',
      providerCode,
      providerDescription,
    }
  }

  return { ok: true, accessToken: tokenData.access_token }
}

async function resolveGmailAccessTokenForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  logPrefix: string
}): Promise<
  | { ok: true; accessToken: string; refreshToken: string }
  | {
      ok: false
      reason: GmailMailboxIndexFailureReason
      error: string
      failureDetail: string | null
    }
> {
  const { data: rowData, error } = await params.supabase
    .from('integration_connections')
    .select('access_token,refresh_token,expires_at,scopes')
    .eq('tenant_id', params.tenantId)
    .eq('provider', 'gmail')
    .maybeSingle()

  if (error) {
    console.error(`${params.logPrefix} integration_connections lookup failed`, error)
    return {
      ok: false,
      reason: 'database_failed',
      error: 'Failed to load Gmail integration connection.',
      failureDetail: 'integration_connection_lookup_failed',
    }
  }

  const row = rowData as GmailConnectionRow | null
  if (!row) {
    return {
      ok: false,
      reason: 'missing_connection',
      error: 'Gmail is not connected for this tenant.',
      failureDetail: 'missing_connection',
    }
  }

  if (!hasInboxReadScope(row.scopes)) {
    return {
      ok: false,
      reason: 'insufficient_scope',
      error:
        'Connected Gmail token is missing inbox-read scope. Reconnect Gmail with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.',
      failureDetail: 'insufficient_scope',
    }
  }

  const refreshToken = typeof row.refresh_token === 'string' ? row.refresh_token.trim() : ''
  let accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  if (!refreshToken || !accessToken) {
    return {
      ok: false,
      reason: 'missing_token',
      error: 'Gmail token is incomplete. Reconnect Gmail.',
      failureDetail: 'missing_token',
    }
  }

  if (isExpiredTimestamp(row.expires_at)) {
    const refreshed = await refreshGmailAccessToken({
      refreshToken,
      logPrefix: params.logPrefix,
    })
    if (!refreshed.ok) {
      return {
        ok: false,
        reason: 'refresh_failed',
        error: refreshed.error,
        failureDetail: refreshed.providerCode || refreshed.providerDescription || 'refresh_failed',
      }
    }
    accessToken = refreshed.accessToken
  }

  return { ok: true, accessToken, refreshToken }
}

async function listMailboxMessagesPage(params: {
  accessToken: string
  pageToken?: string | null
  maxResults: number
}): Promise<
  | {
      ok: true
      messageIds: string[]
      nextPageToken: string | null
      resultSizeEstimate: number | null
    }
  | { ok: false; reason: GmailMailboxIndexFailureReason; error: string }
> {
  const url = new URL(GMAIL_MESSAGES_ENDPOINT)
  url.searchParams.set('maxResults', String(params.maxResults))
  if (params.pageToken) url.searchParams.set('pageToken', params.pageToken)

  let response: Response
  try {
    response = (
      await fetchWithRetry(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${params.accessToken}` },
        cache: 'no-store',
      })
    ).response
  } catch {
    return { ok: false, reason: 'gmail_api_failed', error: 'Failed to list Gmail mailbox messages.' }
  }

  const payload = (await response
    .json()
    .catch(() => null)) as GmailListMessagesResponse | null
  if (hasInsufficientScopeError(response.status, payload)) {
    return {
      ok: false,
      reason: 'insufficient_scope',
      error: 'Connected Gmail token is missing inbox-read scope.',
    }
  }

  if (!response.ok || !payload) {
    return { ok: false, reason: 'gmail_api_failed', error: 'Failed to list Gmail mailbox messages.' }
  }

  const messageIds = Array.isArray(payload.messages)
    ? payload.messages
        .map((entry) => (typeof entry?.id === 'string' ? entry.id.trim() : ''))
        .filter(Boolean)
    : []

  return {
    ok: true,
    messageIds,
    nextPageToken:
      typeof payload.nextPageToken === 'string' && payload.nextPageToken.trim()
        ? payload.nextPageToken.trim()
        : null,
    resultSizeEstimate:
      typeof payload.resultSizeEstimate === 'number' && Number.isFinite(payload.resultSizeEstimate)
        ? payload.resultSizeEstimate
        : null,
  }
}

async function fetchMessageMetadata(params: {
  accessToken: string
  messageId: string
}): Promise<GmailMessageMetadataResult> {
  const url = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(params.messageId)}`)
  url.searchParams.set('format', 'metadata')
  url.searchParams.append('metadataHeaders', 'From')
  url.searchParams.append('metadataHeaders', 'Subject')
  url.searchParams.append('metadataHeaders', 'Date')

  const startedAt = Date.now()
  let hadRetryableSignal = false
  let attempts = 0

  for (let rateLimitAttempt = 1; rateLimitAttempt <= METADATA_RATE_LIMIT_MAX_ATTEMPTS; rateLimitAttempt += 1) {
    let response: Response
    try {
      const fetched = await fetchWithRetry(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${params.accessToken}` },
        cache: 'no-store',
      })
      response = fetched.response
      hadRetryableSignal = hadRetryableSignal || fetched.hadRetryableSignal
      attempts += fetched.attempts
    } catch (error) {
      const providerMessage = error instanceof Error ? error.message : 'Failed to fetch Gmail message metadata.'
      const retryAttempts =
        error instanceof FetchWithRetryError && Number.isFinite(error.attempts) ? error.attempts : 1
      return {
        ok: false,
        status: 502,
        reason: 'gmail_api_failed',
        error: 'Failed to fetch Gmail message metadata.',
        providerReason: null,
        providerMessage,
        retryable: true,
        attempts: attempts + retryAttempts,
        classification: 'retryable_api',
      }
    }

    const payload = (await response
      .json()
      .catch(() => null)) as GmailMessageMetadataResponse | null
    const { providerReason, providerMessage } = extractGmailApiErrorDetails(payload)
    const classification = classifyMetadataFailure({
      status: response.status,
      payload,
      providerReason,
      providerMessage,
      hadRetryableSignal,
    })
    const shouldRetryRateLimit =
      !response.ok &&
      classification === 'retryable_api' &&
      isMetadataRateLimitFailure({
        status: response.status,
        providerReason,
        providerMessage,
      }) &&
      rateLimitAttempt < METADATA_RATE_LIMIT_MAX_ATTEMPTS

    if (shouldRetryRateLimit) {
      hadRetryableSignal = true
      await sleep(metadataRateLimitDelayMs(rateLimitAttempt))
      continue
    }

    const durationMs = Date.now() - startedAt

    if (response.status === 404) {
      return {
        ok: false,
        status: 404,
        reason: 'gmail_api_failed',
        error: 'Message not found.',
        providerReason,
        providerMessage,
        retryable: false,
        attempts,
        classification,
      }
    }
    if (hasInsufficientScopeError(response.status, payload)) {
      return {
        ok: false,
        status: response.status,
        reason: 'insufficient_scope',
        error: 'Connected Gmail token is missing inbox-read scope.',
        providerReason,
        providerMessage,
        retryable: false,
        attempts,
        classification,
      }
    }
    if (!response.ok || !payload) {
      return {
        ok: false,
        status: response.status,
        reason: 'gmail_api_failed',
        error:
          classification === 'auth'
            ? 'Gmail access token is invalid or expired. Reconnect Gmail to continue indexing.'
            : 'Failed to fetch Gmail message metadata.',
        providerReason,
        providerMessage,
        retryable: classification === 'retryable_api',
        attempts,
        classification,
      }
    }

    return {
      ok: true,
      metadata: payload,
      metrics: {
        duration_ms: durationMs,
        had_retryable_signal: hadRetryableSignal,
        attempts,
      },
    }
  }

  return {
    ok: false,
    status: 502,
    reason: 'gmail_api_failed',
    error: 'Failed to fetch Gmail message metadata.',
    providerReason: null,
    providerMessage: 'Failed to fetch Gmail message metadata after rate-limit retries.',
    retryable: true,
    attempts,
    classification: 'retryable_api',
  }
}

function isMetadataAuthOrScopeFailure(metadata: GmailMessageMetadataFailure): boolean {
  return metadata.classification === 'auth' || metadata.classification === 'insufficient_scope'
}

function isMetadataRateLimitFailure(params: {
  status: number
  providerReason: string | null
  providerMessage: string | null
}): boolean {
  const providerReason = params.providerReason?.toLowerCase() ?? ''
  const providerMessage = params.providerMessage?.toLowerCase() ?? ''
  return (
    params.status === 429 ||
    providerReason === 'ratelimitexceeded' ||
    providerReason === 'userratelimitexceeded' ||
    providerMessage.includes('queries per minute per user') ||
    providerMessage.includes('rate limit')
  )
}

async function recoverFullScanMetadataFailures(params: {
  accessToken: string
  run: GmailMailboxIndexRunContext
  listPagesFetched: number
  processedMessages: number
  pageToken: string | null
  metadataBatchSize: number
  failedItems: Array<{ messageId: string; metadata: GmailMessageMetadataFailure }>
}): Promise<
  | {
      ok: true
      recoveredItems: Array<{ messageId: string; metadata: GmailMessageMetadataResult }>
    }
  | {
      ok: false
      failure: GmailMessageMetadataFailure
      detail: GmailMailboxIndexFailureDetail
    }
> {
  const failedMessageIdsSample = metadataFailureSample(params.failedItems.map((item) => item.messageId))
  const firstFailure = params.failedItems[0]?.metadata ?? null
  if (firstFailure) {
    logManualFullMetadataEvent({
      event: 'metadata_recovery_start',
      run: params.run,
      listPagesFetched: params.listPagesFetched,
      processedMessages: params.processedMessages,
      pageToken: params.pageToken,
      metadataBatchSize: params.metadataBatchSize,
      failedMessageIdsSample,
      status: firstFailure.status,
      providerReason: firstFailure.providerReason,
      providerMessage: firstFailure.providerMessage,
      retryAttempt: 0,
    })
  }

  const recoveredItems: Array<{ messageId: string; metadata: GmailMessageMetadataResult }> = []
  for (const failedItem of params.failedItems) {
    for (let retryAttempt = 1; retryAttempt <= 3; retryAttempt += 1) {
      const recovered = await fetchMessageMetadata({
        accessToken: params.accessToken,
        messageId: failedItem.messageId,
      })

      if (recovered.ok || recovered.classification === 'not_found') {
        logManualFullMetadataEvent({
          event: 'metadata_recovery_recovered',
          run: params.run,
          listPagesFetched: params.listPagesFetched,
          processedMessages: params.processedMessages,
          pageToken: params.pageToken,
          metadataBatchSize: params.metadataBatchSize,
          failedMessageIdsSample,
          status: recovered.ok ? 200 : recovered.status,
          providerReason: recovered.ok ? null : recovered.providerReason,
          providerMessage: recovered.ok ? null : recovered.providerMessage,
          retryAttempt,
        })
        recoveredItems.push({
          messageId: failedItem.messageId,
          metadata: recovered,
        })
        break
      }

      logManualFullMetadataEvent({
        event: 'metadata_recovery_attempt',
        run: params.run,
        listPagesFetched: params.listPagesFetched,
        processedMessages: params.processedMessages,
        pageToken: params.pageToken,
        metadataBatchSize: params.metadataBatchSize,
        failedMessageIdsSample,
        status: recovered.status,
        providerReason: recovered.providerReason,
        providerMessage: recovered.providerMessage,
        retryAttempt,
      })

      const shouldStop =
        isMetadataAuthOrScopeFailure(recovered) ||
        recovered.classification !== 'retryable_api' ||
        retryAttempt >= 3

      if (shouldStop) {
        const detail = buildMetadataFailureDetail({
          classification: recovered.classification,
          status: recovered.status,
          providerReason: recovered.providerReason,
          providerMessage: recovered.providerMessage,
          listPagesFetched: params.listPagesFetched,
          processedMessages: params.processedMessages,
          pageToken: params.pageToken,
          metadataBatchSize: params.metadataBatchSize,
          failedMessageIdsSample,
          retryAttempts: retryAttempt,
        })
        logManualFullMetadataEvent({
          event: 'metadata_recovery_failed',
          run: params.run,
          listPagesFetched: params.listPagesFetched,
          processedMessages: params.processedMessages,
          pageToken: params.pageToken,
          metadataBatchSize: params.metadataBatchSize,
          failedMessageIdsSample,
          status: recovered.status,
          providerReason: recovered.providerReason,
          providerMessage: recovered.providerMessage,
          retryAttempt,
        })
        return {
          ok: false,
          failure: recovered,
          detail,
        }
      }

      await sleep(
        isMetadataRateLimitFailure({
          status: recovered.status,
          providerReason: recovered.providerReason,
          providerMessage: recovered.providerMessage,
        })
          ? metadataRateLimitDelayMs(retryAttempt)
          : retryDelayMs(retryAttempt)
      )
    }
  }

  return {
    ok: true,
    recoveredItems,
  }
}

function mapMetadataToIndexRow(params: {
  tenantId: string
  messageId: string
  metadata: GmailMessageMetadataResponse
  indexedAtIso: string
}): GmailMailboxIndexRow {
  const labelIds = normalizeLabelIds(params.metadata.labelIds)
  const sender = normalizeSender(headerValue(params.metadata.payload?.headers, 'From'))
  const subject = headerValue(params.metadata.payload?.headers, 'Subject')
  const dateIso = dateIsoFromMetadata(params.metadata)
  const internalDateMs =
    typeof params.metadata.internalDate === 'string'
      ? Number(params.metadata.internalDate)
      : Number.NaN

  return {
    tenant_id: params.tenantId,
    message_id: params.messageId,
    thread_id:
      typeof params.metadata.threadId === 'string' && params.metadata.threadId.trim()
        ? params.metadata.threadId.trim()
        : null,
    sender,
    subject,
    internal_date_ms: isUsableMailboxInternalDateMs(internalDateMs) ? Math.round(internalDateMs) : null,
    date: dateIso,
    label_ids: labelIds,
    category_labels: categoryLabelsFromLabelIds(labelIds),
    is_in_inbox: labelIds.includes('INBOX'),
    is_unread: labelIds.includes('UNREAD'),
    is_starred: labelIds.includes('STARRED'),
    is_important: labelIds.includes('IMPORTANT'),
    indexed_at: params.indexedAtIso,
    updated_at: params.indexedAtIso,
  }
}

function emptyMailboxIndexYieldDetail(): GmailMailboxIndexYieldDetail {
  return {
    inserted_rows: 0,
    updated_rows: 0,
    already_indexed_rows: 0,
    existing_rows_seen: 0,
    oldest_message_seen_at: null,
    newest_message_seen_at: null,
    next_page_token_present: null,
    recovery_bridge_status: null,
    recovery_bridge_boundary_at: null,
    recovery_bridge_cutoff_at: null,
  }
}

function normalizeComparableStringArray(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  ).sort()
}

function equalComparableStringArrays(
  left: string[] | null | undefined,
  right: string[] | null | undefined
): boolean {
  const normalizedLeft = normalizeComparableStringArray(left)
  const normalizedRight = normalizeComparableStringArray(right)
  if (normalizedLeft.length !== normalizedRight.length) return false
  for (let index = 0; index < normalizedLeft.length; index += 1) {
    if (normalizedLeft[index] !== normalizedRight[index]) return false
  }
  return true
}

function toArtifactIncrementalMessageRow(
  row: GmailMailboxIndexComparableRow | GmailMailboxIndexRow | null | undefined
): GmailArtifactIncrementalMessageRow | null {
  if (!row) return null
  return {
    message_id: row.message_id,
    thread_id: row.thread_id,
    sender: row.sender,
    subject: row.subject,
    internal_date_ms:
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? Math.round(row.internal_date_ms)
        : null,
    date: row.date,
    label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
    category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
    is_in_inbox: row.is_in_inbox === true,
    is_unread: row.is_unread === true,
    is_starred: row.is_starred === true,
    is_important: row.is_important === true,
  }
}

function normalizeIncrementalSenderKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = normalizeSender(value)
  return normalized ? normalized : null
}

function buildArtifactRefreshHint(params: {
  runId: string
  existingRowsByMessageId: Map<string, GmailMailboxIndexComparableRow>
  metadataRows: GmailMailboxIndexRow[]
  deletedMessageIds: string[]
}): GmailArtifactIncrementalRefreshHint | null {
  const metadataRowsByMessageId = new Map(
    params.metadataRows.map((row) => [row.message_id, row] as const)
  )
  const messageIds = Array.from(
    new Set([
      ...metadataRowsByMessageId.keys(),
      ...params.deletedMessageIds,
    ])
  )
  if (messageIds.length === 0) return null

  const changedMessages: GmailArtifactIncrementalChangedMessage[] = []
  const senderKeys = new Set<string>()
  for (const messageId of messageIds) {
    const before = params.existingRowsByMessageId.get(messageId) || null
    const after = metadataRowsByMessageId.get(messageId) || null
    if (!before && !after) continue
    if (before && after && !materiallyChangedMailboxIndexRow(before, after)) continue

    const beforeSenderKey = normalizeIncrementalSenderKey(before?.sender)
    const afterSenderKey = normalizeIncrementalSenderKey(after?.sender)
    if (beforeSenderKey) senderKeys.add(beforeSenderKey)
    if (afterSenderKey) senderKeys.add(afterSenderKey)

    changedMessages.push({
      message_id: messageId,
      before: toArtifactIncrementalMessageRow(before),
      after: toArtifactIncrementalMessageRow(after),
    })
  }

  const affectedSenderKeys = Array.from(senderKeys)
  if (affectedSenderKeys.length === 0 || changedMessages.length === 0) {
    return null
  }

  return {
    strategy: 'incremental',
    sync_run_id: params.runId,
    affected_sender_keys: affectedSenderKeys,
    changed_messages: changedMessages,
  }
}

function comparableMailboxIndexSeenAtIso(row: GmailMailboxIndexComparableRow): string | null {
  if (typeof row.date === 'string' && row.date.trim()) {
    const parsed = Date.parse(row.date)
    if (Number.isFinite(parsed) && parsed > 0) return new Date(parsed).toISOString()
  }
  if (isUsableMailboxInternalDateMs(row.internal_date_ms)) {
    return new Date(row.internal_date_ms).toISOString()
  }
  return null
}

function earlierIso(left: string | null, right: string | null): string | null {
  if (!left) return right
  if (!right) return left
  return Date.parse(left) <= Date.parse(right) ? left : right
}

function laterIso(left: string | null, right: string | null): string | null {
  if (!left) return right
  if (!right) return left
  return Date.parse(left) >= Date.parse(right) ? left : right
}

function materiallyChangedMailboxIndexRow(
  existing: GmailMailboxIndexComparableRow,
  incoming: GmailMailboxIndexComparableRow
): boolean {
  return !(
    existing.thread_id === incoming.thread_id &&
    existing.sender === incoming.sender &&
    existing.subject === incoming.subject &&
    existing.internal_date_ms === incoming.internal_date_ms &&
    existing.date === incoming.date &&
    equalComparableStringArrays(existing.label_ids, incoming.label_ids) &&
    equalComparableStringArrays(existing.category_labels, incoming.category_labels) &&
    existing.is_in_inbox === incoming.is_in_inbox &&
    existing.is_unread === incoming.is_unread &&
    existing.is_starred === incoming.is_starred &&
    existing.is_important === incoming.is_important
  )
}

function classifyYieldForRows(params: {
  rows: GmailMailboxIndexComparableRow[]
  existingRowsByMessageId: Map<string, GmailMailboxIndexComparableRow>
  nextPageTokenPresent: boolean
}): GmailMailboxIndexYieldDetail {
  const detail = emptyMailboxIndexYieldDetail()
  for (const row of params.rows) {
    const existing = params.existingRowsByMessageId.get(row.message_id)
    if (!existing) {
      detail.inserted_rows += 1
    } else if (materiallyChangedMailboxIndexRow(existing, row)) {
      detail.updated_rows += 1
      detail.existing_rows_seen += 1
    } else {
      detail.already_indexed_rows += 1
      detail.existing_rows_seen += 1
    }
    const seenAtIso = comparableMailboxIndexSeenAtIso(row)
    detail.oldest_message_seen_at = earlierIso(detail.oldest_message_seen_at, seenAtIso)
    detail.newest_message_seen_at = laterIso(detail.newest_message_seen_at, seenAtIso)
  }
  detail.next_page_token_present = params.nextPageTokenPresent
  return detail
}

function mergeYieldDetail(
  current: GmailMailboxIndexYieldDetail,
  delta: GmailMailboxIndexYieldDetail
): GmailMailboxIndexYieldDetail {
  return {
    inserted_rows: current.inserted_rows + delta.inserted_rows,
    updated_rows: current.updated_rows + delta.updated_rows,
    already_indexed_rows: current.already_indexed_rows + delta.already_indexed_rows,
    existing_rows_seen: current.existing_rows_seen + delta.existing_rows_seen,
    oldest_message_seen_at: earlierIso(current.oldest_message_seen_at, delta.oldest_message_seen_at),
    newest_message_seen_at: laterIso(current.newest_message_seen_at, delta.newest_message_seen_at),
    next_page_token_present: delta.next_page_token_present,
    recovery_bridge_status:
      delta.recovery_bridge_status ?? current.recovery_bridge_status ?? null,
    recovery_bridge_boundary_at:
      delta.recovery_bridge_boundary_at ?? current.recovery_bridge_boundary_at ?? null,
    recovery_bridge_cutoff_at:
      delta.recovery_bridge_cutoff_at ?? current.recovery_bridge_cutoff_at ?? null,
  }
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function upsertIndexRows(params: {
  supabase: SupabaseClient
  rows: GmailMailboxIndexRow[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.rows.length === 0) return { ok: true }
  const batches = chunkArray(params.rows, UPSERT_BATCH_SIZE)
  for (const batch of batches) {
    const { error } = await params.supabase
      .from('gmail_messages')
      .upsert(batch, { onConflict: 'tenant_id,message_id' })
    if (error) {
      return { ok: false, error: `Failed to upsert gmail_messages rows: ${error.message}` }
    }
  }
  return { ok: true }
}

async function loadExistingMailboxIndexRowsByMessageId(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
}): Promise<
  | { ok: true; rowsByMessageId: Map<string, GmailMailboxIndexComparableRow> }
  | { ok: false; error: string }
> {
  const rowsByMessageId = new Map<string, GmailMailboxIndexComparableRow>()
  const normalizedIds = Array.from(
    new Set(
      params.messageIds
        .map((messageId) => messageId.trim())
        .filter(Boolean)
    )
  )
  if (normalizedIds.length === 0) {
    return { ok: true, rowsByMessageId }
  }

  for (const batch of chunkArray(normalizedIds, INDEX_QUERY_PAGE_SIZE)) {
    const { data, error } = await params.supabase
      .from('gmail_messages')
      .select(
        'message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important'
      )
      .eq('tenant_id', params.tenantId)
      .in('message_id', batch)

    if (error) {
      return {
        ok: false,
        error: `Failed to load existing gmail_messages rows: ${error.message}`,
      }
    }

    for (const row of (data || []) as GmailMailboxIndexComparableRow[]) {
      if (typeof row.message_id !== 'string' || !row.message_id.trim()) continue
      rowsByMessageId.set(row.message_id, row)
    }
  }

  return { ok: true, rowsByMessageId }
}

async function deleteIndexRows(params: {
  supabase: SupabaseClient
  tenantId: string
  messageIds: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.messageIds.length === 0) return { ok: true }
  const batches = chunkArray(params.messageIds, UPSERT_BATCH_SIZE)
  for (const batch of batches) {
    const { error } = await params.supabase
      .from('gmail_messages')
      .delete()
      .eq('tenant_id', params.tenantId)
      .in('message_id', batch)
    if (error) {
      return { ok: false, error: `Failed to delete gmail_messages rows: ${error.message}` }
    }
  }
  return { ok: true }
}

async function countIndexedMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<number> {
  const { count, error } = await params.supabase
    .from('gmail_messages')
    .select('message_id', { count: 'exact', head: true })
    .eq('tenant_id', params.tenantId)
  if (error) return 0
  return typeof count === 'number' ? count : 0
}

export async function loadGmailMailboxIndexCoverageForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<GmailMailboxIndexCoverage> {
  const [indexedTotalQuery, indexedInboxQuery, oldestRowQuery, newestRowQuery] = await Promise.all([
    params.supabase
      .from('gmail_messages')
      .select('message_id', { count: 'exact', head: true })
      .eq('tenant_id', params.tenantId),
    params.supabase
      .from('gmail_messages')
      .select('message_id', { count: 'exact', head: true })
      .eq('tenant_id', params.tenantId)
      .eq('is_in_inbox', true),
    params.supabase
      .from('gmail_messages')
      .select('internal_date_ms')
      .eq('tenant_id', params.tenantId)
      .not('internal_date_ms', 'is', null)
      .gt('internal_date_ms', 0)
      .order('internal_date_ms', { ascending: true })
      .limit(1)
      .maybeSingle(),
    params.supabase
      .from('gmail_messages')
      .select('internal_date_ms')
      .eq('tenant_id', params.tenantId)
      .not('internal_date_ms', 'is', null)
      .gt('internal_date_ms', 0)
      .order('internal_date_ms', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const indexedTotalRows =
    indexedTotalQuery.error || typeof indexedTotalQuery.count !== 'number'
      ? 0
      : indexedTotalQuery.count
  const indexedInboxRows =
    indexedInboxQuery.error || typeof indexedInboxQuery.count !== 'number'
      ? 0
      : indexedInboxQuery.count
  const oldestDateMs =
    oldestRowQuery.error ||
    !isUsableMailboxInternalDateMs(oldestRowQuery.data?.internal_date_ms)
      ? null
      : oldestRowQuery.data.internal_date_ms
  const newestDateMs =
    newestRowQuery.error ||
    !isUsableMailboxInternalDateMs(newestRowQuery.data?.internal_date_ms)
      ? null
      : newestRowQuery.data.internal_date_ms

  return {
    indexed_total_rows: indexedTotalRows,
    indexed_inbox_rows: indexedInboxRows,
    indexed_date_span_start: oldestDateMs != null ? new Date(oldestDateMs).toISOString() : null,
    indexed_date_span_end: newestDateMs != null ? new Date(newestDateMs).toISOString() : null,
  }
}

export function resolveGmailRecoveryBridgeLookupBefore(params: {
  lastTerminalReason?: string | null
  lastYieldDetail?: GmailMailboxIndexYieldDetail | null
}): string | null {
  if (params.lastTerminalReason !== 'recent_window_reached') return null
  if (params.lastYieldDetail?.next_page_token_present !== true) return null
  return usableIso(params.lastYieldDetail.oldest_message_seen_at)
}

async function loadGmailFreshHeadRecoveryIndexedBoundaryForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  state: GmailMailboxIndexState | null
}): Promise<string | null> {
  const lookupBefore = resolveGmailRecoveryBridgeLookupBefore({
    lastTerminalReason: params.state?.last_terminal_reason ?? null,
    lastYieldDetail: params.state?.last_yield_detail ?? null,
  })
  if (!lookupBefore) {
    const coverage = await loadGmailMailboxIndexCoverageForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    return coverage.indexed_date_span_end
  }

  const lookupBeforeMs = Date.parse(lookupBefore)
  const { data, error } = await params.supabase
    .from('gmail_messages')
    .select('internal_date_ms')
    .eq('tenant_id', params.tenantId)
    .not('internal_date_ms', 'is', null)
    .gt('internal_date_ms', 0)
    .lt('internal_date_ms', lookupBeforeMs)
    .order('internal_date_ms', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to resolve the prior indexed continuity boundary: ${error.message}`)
  }
  if (!isUsableMailboxInternalDateMs(data?.internal_date_ms)) {
    throw new Error(
      'Fresh-head recovery stopped with more Gmail pages available, but no prior indexed continuity boundary could be resolved.'
    )
  }
  return new Date(data.internal_date_ms).toISOString()
}

function computeIndexCompletionPct(params: {
  indexedMessageCount: number
  mailboxEstimatedTotal: number | null
}): number | null {
  if (
    params.mailboxEstimatedTotal == null ||
    !Number.isFinite(params.mailboxEstimatedTotal) ||
    params.mailboxEstimatedTotal <= 0
  ) {
    return null
  }
  const ratio = (params.indexedMessageCount / params.mailboxEstimatedTotal) * 100
  return roundPercent(clamp(ratio, 0, 100))
}

function startOfUtcDayMs(valueMs: number): number {
  const date = new Date(valueMs)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function utcDayKeyFromMs(valueMs: number): string {
  return new Date(startOfUtcDayMs(valueMs)).toISOString().slice(0, 10)
}

function utcDayDiff(fromDay: string, toDay: string): number {
  const fromMs = Date.parse(`${fromDay}T00:00:00.000Z`)
  const toMs = Date.parse(`${toDay}T00:00:00.000Z`)
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 0
  return Math.max(0, Math.round((toMs - fromMs) / UTC_DAY_MS))
}

function enumerateUtcDayKeys(startMs: number, endMs: number): string[] {
  const keys: string[] = []
  let cursorMs = startOfUtcDayMs(startMs)
  const finalMs = startOfUtcDayMs(endMs)
  while (cursorMs <= finalMs) {
    keys.push(utcDayKeyFromMs(cursorMs))
    cursorMs += UTC_DAY_MS
  }
  return keys
}

type GmailFreshHeadRecoveryBridge = {
  boundary_at: string | null
  cutoff_at: string
  source: 'persisted_bridge' | 'indexed_continuity' | 'fixed_recent_window'
}

function usableIso(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

export function resolveGmailFreshHeadRecoveryBridge(params: {
  nowMs: number
  recentRecoveryWindowDays: number
  indexedBoundaryAt?: string | null
  persistedBoundaryAt?: string | null
  overlapDays?: number
}): GmailFreshHeadRecoveryBridge {
  const recentWindowDays = Math.max(1, Math.round(params.recentRecoveryWindowDays))
  const overlapDays = Math.max(
    0,
    Math.round(params.overlapDays ?? MAILBOX_INDEX_RECOVERY_BRIDGE_OVERLAP_DAYS)
  )
  const fixedCutoffMs = startOfUtcDayMs(
    params.nowMs - (recentWindowDays - 1) * UTC_DAY_MS
  )
  const persistedBoundaryAt = usableIso(params.persistedBoundaryAt)
  const indexedBoundaryAt = usableIso(params.indexedBoundaryAt)
  const boundaryAt = persistedBoundaryAt ?? indexedBoundaryAt
  if (!boundaryAt) {
    return {
      boundary_at: null,
      cutoff_at: new Date(fixedCutoffMs).toISOString(),
      source: 'fixed_recent_window',
    }
  }

  const boundaryCutoffMs = startOfUtcDayMs(Date.parse(boundaryAt) - overlapDays * UTC_DAY_MS)
  return {
    boundary_at: boundaryAt,
    cutoff_at: new Date(Math.min(fixedCutoffMs, boundaryCutoffMs)).toISOString(),
    source: persistedBoundaryAt ? 'persisted_bridge' : 'indexed_continuity',
  }
}

export function resolveGmailRecoveryBridgeOutcome(params: {
  bridgeActive: boolean
  boundaryReached: boolean
  stoppedOnEmptyPage: boolean
  nextPageTokenPresent: boolean
  processedMessages: number
  maxMessages: number
}): 'completed' | 'yielded' | 'inactive' {
  if (!params.bridgeActive) return 'inactive'
  if (params.boundaryReached || params.stoppedOnEmptyPage || !params.nextPageTokenPresent) {
    return 'completed'
  }
  if (params.processedMessages >= params.maxMessages && params.nextPageTokenPresent) {
    return 'yielded'
  }
  return 'inactive'
}

function recoveryBridgeYieldDetail(
  detail: GmailMailboxIndexYieldDetail | null | undefined,
  status: 'pending' | 'completed' | 'failed'
): GmailMailboxIndexYieldDetail | null {
  if (!detail?.recovery_bridge_boundary_at && !detail?.recovery_bridge_cutoff_at) {
    return detail ?? null
  }
  return {
    ...detail,
    recovery_bridge_status: status,
  }
}

function pendingRecoveryBridgeBoundary(
  state: GmailMailboxIndexState | null | undefined
): string | null {
  const candidates = [state?.active_yield_detail, state?.last_yield_detail]
  for (const detail of candidates) {
    if (
      detail?.recovery_bridge_status !== 'pending' &&
      detail?.recovery_bridge_status !== 'failed'
    ) {
      continue
    }
    const boundaryAt = usableIso(detail.recovery_bridge_boundary_at)
    if (boundaryAt) return boundaryAt
  }
  return null
}

export async function loadGmailMailboxRecentHealthForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  nowMs?: number
  recentWindowDays?: number
}): Promise<GmailMailboxRecentHealth> {
  const nowMs = params.nowMs ?? Date.now()
  const recentWindowDays = Math.max(
    1,
    Math.round(params.recentWindowDays ?? MAILBOX_INDEX_RECENT_HEALTH_WINDOW_DAYS)
  )
  const recentCutoffMs = startOfUtcDayMs(nowMs - (recentWindowDays - 1) * UTC_DAY_MS)
  const [{ data: recentRows }, { data: newestRow }, { data: indexStateRow }] = await Promise.all([
    params.supabase
      .from('gmail_messages')
      .select('internal_date_ms')
      .eq('tenant_id', params.tenantId)
      .not('internal_date_ms', 'is', null)
      .gte('internal_date_ms', recentCutoffMs)
      .order('internal_date_ms', { ascending: false })
      .limit(MAILBOX_INDEX_RECENT_HEALTH_QUERY_LIMIT),
    params.supabase
      .from('gmail_messages')
      .select('internal_date_ms')
      .eq('tenant_id', params.tenantId)
      .not('internal_date_ms', 'is', null)
      .order('internal_date_ms', { ascending: false })
      .limit(1)
      .maybeSingle(),
    params.supabase
      .from('gmail_mailbox_index_state')
      .select('active_yield_detail,last_yield_detail')
      .eq('tenant_id', params.tenantId)
      .maybeSingle(),
  ])

  const recentDayCounts = new Map<string, number>()
  for (const row of Array.isArray(recentRows) ? recentRows : []) {
    if (typeof row?.internal_date_ms !== 'number' || !Number.isFinite(row.internal_date_ms)) continue
    const dayKey = utcDayKeyFromMs(row.internal_date_ms)
    recentDayCounts.set(dayKey, (recentDayCounts.get(dayKey) ?? 0) + 1)
  }

  const dayKeys = enumerateUtcDayKeys(recentCutoffMs, nowMs)
  const dayCountRows = dayKeys.map((date) => ({
    date,
    count: recentDayCounts.get(date) ?? 0,
  }))
  const activeDays = dayCountRows.filter((row) => row.count > 0).map((row) => row.date)
  const gapPairs: Array<{ from: string; to: string; missing_days: number }> = []
  const missingRecentDays: string[] = []
  for (let index = 1; index < activeDays.length; index += 1) {
    const previousDay = activeDays[index - 1]
    const currentDay = activeDays[index]
    const diffDays = utcDayDiff(previousDay, currentDay)
    if (diffDays <= 1) continue
    gapPairs.push({
      from: previousDay,
      to: currentDay,
      missing_days: diffDays - 1,
    })
    let missingCursorMs = Date.parse(`${previousDay}T00:00:00.000Z`) + UTC_DAY_MS
    const currentDayMs = Date.parse(`${currentDay}T00:00:00.000Z`)
    while (missingCursorMs < currentDayMs) {
      missingRecentDays.push(utcDayKeyFromMs(missingCursorMs))
      missingCursorMs += UTC_DAY_MS
    }
  }

  const newestMessageMs =
    typeof newestRow?.internal_date_ms === 'number' && Number.isFinite(newestRow.internal_date_ms)
      ? newestRow.internal_date_ms
      : null
  const newestMessageIso = newestMessageMs != null ? new Date(newestMessageMs).toISOString() : null
  const newestMessageAgeMs =
    newestMessageMs != null ? Math.max(0, Math.round(nowMs - newestMessageMs)) : null
  const newestMessageBehindExpected =
    newestMessageAgeMs != null && newestMessageAgeMs > MAILBOX_INDEX_MAX_NEWEST_MESSAGE_AGE_MS
  const continuityBridgePending = Boolean(
    pendingRecoveryBridgeBoundary(indexStateRow as GmailMailboxIndexState | null)
  )
  const falseHealthyState =
    continuityBridgePending || missingRecentDays.length > 0 || newestMessageBehindExpected
  const reason = continuityBridgePending
    ? 'continuity_bridge_pending'
    : missingRecentDays.length > 0 && newestMessageBehindExpected
      ? 'recent_gap_and_newest_lag'
      : missingRecentDays.length > 0
        ? 'recent_gap_detected'
        : newestMessageBehindExpected
          ? 'newest_message_behind_expected'
          : null

  return {
    recent_window_days: recentWindowDays,
    recent_cutoff_at: new Date(recentCutoffMs).toISOString(),
    indexed_newest_message_at: newestMessageIso,
    newest_message_age_ms: newestMessageAgeMs,
    newest_message_behind_expected: newestMessageBehindExpected,
    missing_recent_days: missingRecentDays,
    gap_pairs: gapPairs,
    recent_day_counts: dayCountRows,
    false_healthy_state: falseHealthyState,
    reason,
  }
}

async function recomputeSenderStatsForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return recomputeGmailSenderStatsFromFullMailbox(params)
}

async function recomputeSenderStatsForSenders(params: {
  supabase: SupabaseClient
  tenantId: string
  senderKeys: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return recomputeGmailSenderStatsForSenders(params)
}

export async function recomputeGmailSenderStatsForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return recomputeSenderStatsForTenant(params)
}

function mailboxIndexInProgressStatus(mode: 'full' | 'incremental'): string {
  return mode === 'full' ? 'full_scan_in_progress' : 'incremental_sync_in_progress'
}

function mailboxIndexCompleteStatus(params: {
  mode: 'full' | 'incremental'
  growthDelta: number
}): string {
  if (params.growthDelta > 0) {
    return params.mode === 'full' ? 'full_scan_complete' : 'incremental_sync_complete'
  }
  return params.mode === 'full' ? 'full_scan_complete_no_growth' : 'incremental_sync_complete_no_growth'
}

function mailboxIndexAuthFailureStatus(mode: 'full' | 'incremental'): string {
  return mode === 'full' ? 'full_scan_auth_failed' : 'incremental_sync_auth_failed'
}

function mailboxIndexFailureStatus(mode: 'full' | 'incremental'): string {
  return mode === 'full' ? 'full_scan_failed' : 'incremental_sync_failed'
}

function isMailboxIndexAuthFailureReason(reason: GmailMailboxIndexFailureReason): boolean {
  return (
    reason === 'missing_connection' ||
    reason === 'missing_token' ||
    reason === 'insufficient_scope' ||
    reason === 'refresh_failed'
  )
}

function mailboxIndexGrowthDelta(rowsBefore: number, rowsAfter: number): number {
  return Math.max(-rowsBefore, rowsAfter - rowsBefore)
}

function metadataFailureSample(messageIds: string[], limit = 5): string[] {
  return messageIds
    .map((messageId) => messageId.trim())
    .filter(Boolean)
    .slice(0, limit)
}

function buildMetadataFailureDetail(params: {
  classification: GmailMetadataFailureClassification
  status: number | null
  providerReason: string | null
  providerMessage: string | null
  listPagesFetched: number | null
  processedMessages: number | null
  pageToken: string | null
  metadataBatchSize: number | null
  failedMessageIdsSample: string[]
  retryAttempts: number | null
}): GmailMailboxIndexFailureDetail {
  return {
    stage: 'metadata_fetch',
    classification: params.classification,
    status: params.status,
    provider_reason: params.providerReason,
    provider_message: params.providerMessage,
    list_pages_fetched: params.listPagesFetched,
    processed_messages: params.processedMessages,
    page_token: params.pageToken,
    metadata_batch_size: params.metadataBatchSize,
    failed_message_ids_sample: params.failedMessageIdsSample,
    retry_attempts: params.retryAttempts,
  }
}

function buildHistoryFailureDetail(params: {
  classification: GmailHistoryFailureClassification
  status: number | null
  providerReason: string | null
  providerMessage: string | null
  startHistoryId: string | null
  pageToken: string | null
  retryAttempts: number | null
}): GmailMailboxIndexFailureDetail {
  return {
    stage: 'history_list',
    classification: params.classification,
    status: params.status,
    provider_reason: params.providerReason,
    provider_message: params.providerMessage,
    list_pages_fetched: null,
    processed_messages: null,
    page_token: params.pageToken,
    metadata_batch_size: null,
    failed_message_ids_sample: [],
    retry_attempts: params.retryAttempts,
    start_history_id: params.startHistoryId,
  }
}

function logManualFullMetadataEvent(params: {
  event: 'metadata_recovery_start' | 'metadata_recovery_attempt' | 'metadata_recovery_recovered' | 'metadata_recovery_failed'
  run: GmailMailboxIndexRunContext
  listPagesFetched: number
  processedMessages: number
  pageToken: string | null
  metadataBatchSize: number
  failedMessageIdsSample: string[]
  status: number | null
  providerReason: string | null
  providerMessage: string | null
  retryAttempt: number | null
}): void {
  if (!isResumeCapableFullTrigger(params.run.trigger)) return
  console.info(
    `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
      event: params.event,
      run_id: params.run.runId,
      trigger: params.run.trigger,
      requested_mode: params.run.requestedMode,
      effective_mode: 'full',
      list_pages_fetched: params.listPagesFetched,
      processed_messages: params.processedMessages,
      page_token: params.pageToken,
      metadata_batch_size: params.metadataBatchSize,
      failed_message_ids_sample: params.failedMessageIdsSample,
      status: params.status,
      provider_reason: params.providerReason,
      provider_message: params.providerMessage,
      retry_attempt: params.retryAttempt,
    })}`
  )
}

function logFullScanYieldPage(params: {
  run: GmailMailboxIndexRunContext
  pageIndex: number
  pageMessageCount: number
  nextPageTokenPresent: boolean
  pageYieldDetail: GmailMailboxIndexYieldDetail
  cumulativeYieldDetail: GmailMailboxIndexYieldDetail
}): void {
  const payload = {
    event: 'page_yield',
    mode: 'full',
    requested_mode: params.run.requestedMode,
    effective_mode: 'full',
    run_id: params.run.runId,
    trigger: params.run.trigger,
    page_index: params.pageIndex,
    page_message_count: params.pageMessageCount,
    next_page_token_present: params.nextPageTokenPresent,
    page_oldest_message_seen_at: params.pageYieldDetail.oldest_message_seen_at,
    page_newest_message_seen_at: params.pageYieldDetail.newest_message_seen_at,
    page_inserted_rows: params.pageYieldDetail.inserted_rows,
    page_updated_rows: params.pageYieldDetail.updated_rows,
    page_already_indexed_rows: params.pageYieldDetail.already_indexed_rows,
    cumulative_inserted_rows: params.cumulativeYieldDetail.inserted_rows,
    cumulative_updated_rows: params.cumulativeYieldDetail.updated_rows,
    cumulative_already_indexed_rows: params.cumulativeYieldDetail.already_indexed_rows,
    cumulative_existing_rows_seen: params.cumulativeYieldDetail.existing_rows_seen,
    growth_delta: params.cumulativeYieldDetail.inserted_rows,
  }
  console.info(`[integrations/gmail/mailbox-index] ${JSON.stringify(payload)}`)
  if (isResumeCapableFullTrigger(params.run.trigger)) {
    console.info(`${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify(payload)}`)
  }
}

function isMailboxIndexRunInProgressStatus(status: string | null | undefined): boolean {
  if (typeof status !== 'string' || !status.trim()) return false
  return status === 'full_scan_in_progress' || status === 'incremental_sync_in_progress'
}

export function isMailboxIndexRunActive(
  state: GmailMailboxIndexState | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!state || !isMailboxIndexRunInProgressStatus(state.last_sync_status)) return false
  const heartbeatMs =
    typeof state.active_heartbeat_at === 'string' && state.active_heartbeat_at.trim()
      ? Date.parse(state.active_heartbeat_at)
      : Number.NaN
  const startedMs =
    typeof state.active_started_at === 'string' && state.active_started_at.trim()
      ? Date.parse(state.active_started_at)
      : Number.NaN
  const latestMs = Number.isFinite(heartbeatMs) ? heartbeatMs : startedMs
  if (!Number.isFinite(latestMs)) return false
  return nowMs - latestMs <= GMAIL_MAILBOX_INDEX_STALL_THRESHOLD_MS
}

export function isManualFullRunActive(
  state: GmailMailboxIndexState | null | undefined,
  nowMs = Date.now()
): boolean {
  return Boolean(
    state &&
      state.active_run_trigger === 'manual_full_reindex' &&
      state.active_effective_mode === 'full' &&
      isMailboxIndexRunActive(state, nowMs)
  )
}

function isResumeCapableFullTrigger(trigger: GmailMailboxIndexTrigger): boolean {
  return (
    trigger === 'smart_sync' ||
    trigger === 'manual_full_reindex' ||
    trigger === 'operator_backfill'
  )
}

function usesSharedResumeCheckpointTrigger(trigger: GmailMailboxIndexTrigger): boolean {
  return trigger === 'smart_sync' || trigger === 'manual_full_reindex'
}

function operatorFullLogPrefix(trigger: GmailMailboxIndexTrigger): string {
  return trigger === 'smart_sync'
    ? '[integrations/gmail/mailbox-index/smart-sync]'
    : trigger === 'operator_backfill'
      ? '[integrations/gmail/mailbox-index/operator-backfill]'
      : '[integrations/gmail/mailbox-index/manual-full]'
}

function hasCheckpointProgress(params: {
  pageToken: string | null | undefined
  pageIndex: number | null | undefined
  processedMessages: number | null | undefined
}): boolean {
  return Boolean(
    (typeof params.pageToken === 'string' && params.pageToken.trim()) ||
      (typeof params.pageIndex === 'number' && params.pageIndex > 0) ||
      (typeof params.processedMessages === 'number' && params.processedMessages > 0)
  )
}

function hasResumableCheckpointToken(params: {
  pageToken: string | null | undefined
  pageIndex: number | null | undefined
  processedMessages: number | null | undefined
}): boolean {
  const nextPageTokenPresent = typeof params.pageToken === 'string' && params.pageToken.trim().length > 0
  if (!nextPageTokenPresent) return false
  return Boolean(
    (typeof params.pageIndex === 'number' && params.pageIndex > 0) ||
      (typeof params.processedMessages === 'number' && params.processedMessages > 0)
  )
}

function buildManualFullResumeCheckpoint(
  state: GmailMailboxIndexState | null | undefined,
  nowMs = Date.now(),
  acceptedRunId?: string | null
): GmailMailboxIndexResumeCheckpoint | null {
  if (!state) return null
  const staleManualRun =
    state.active_run_trigger != null &&
    usesSharedResumeCheckpointTrigger(state.active_run_trigger) &&
    state.active_effective_mode === 'full' &&
    (!isMailboxIndexRunActive(state, nowMs) ||
      (Boolean(acceptedRunId) && state.active_run_id === acceptedRunId)) &&
    hasCheckpointProgress({
      pageToken: state.active_next_page_token,
      pageIndex: state.active_last_page_index,
      processedMessages: state.active_processed_messages,
    })
  if (staleManualRun) {
    return {
      source: 'stale_active',
      nextPageToken: state.active_next_page_token ?? null,
      pageIndex: state.active_last_page_index ?? 0,
      processedMessages: state.active_processed_messages ?? 0,
      processedAt: state.active_last_processed_at ?? null,
    }
  }
  const failedManualRun =
    hasCheckpointProgress({
      pageToken: state.last_resume_page_token,
      pageIndex: state.last_resume_page_index,
      processedMessages: state.last_processed_messages,
    })
  if (failedManualRun) {
    return {
      source: 'last_failed',
      nextPageToken: state.last_resume_page_token ?? null,
      pageIndex: state.last_resume_page_index ?? 0,
      processedMessages: state.last_processed_messages ?? 0,
      processedAt: state.last_resume_processed_at ?? null,
    }
  }
  return null
}

function buildOperatorBackfillResumeCheckpoint(
  state: GmailMailboxIndexState | null | undefined,
  nowMs = Date.now()
): GmailMailboxIndexResumeCheckpoint | null {
  if (!state) return null
  const dedicatedCheckpointHasProgress = hasCheckpointProgress({
    pageToken: state.backfill_resume_page_token,
    pageIndex: state.backfill_resume_page_index,
    processedMessages: state.backfill_resume_processed_messages,
  })
  if (
    hasResumableCheckpointToken({
      pageToken: state.backfill_resume_page_token,
      pageIndex: state.backfill_resume_page_index,
      processedMessages: state.backfill_resume_processed_messages,
    })
  ) {
    return {
      source: 'backfill_saved',
      nextPageToken: state.backfill_resume_page_token ?? null,
      pageIndex: state.backfill_resume_page_index ?? 0,
      processedMessages: state.backfill_resume_processed_messages ?? 0,
      processedAt: state.backfill_resume_processed_at ?? null,
    }
  }
  if (dedicatedCheckpointHasProgress) return null

  const legacyCheckpoint = buildManualFullResumeCheckpoint(state, nowMs)
  if (!legacyCheckpoint) return null
  return hasResumableCheckpointToken({
    pageToken: legacyCheckpoint.nextPageToken,
    pageIndex: legacyCheckpoint.pageIndex,
    processedMessages: legacyCheckpoint.processedMessages,
  })
    ? {
        ...legacyCheckpoint,
        source: 'backfill_legacy_adopted',
      }
    : null
}

function buildResumeCheckpointSummary(params: {
  pageToken: string | null | undefined
  pageIndex: number | null | undefined
  processedMessages: number | null | undefined
  processedAt: string | null | undefined
}): GmailMailboxIndexResumeCheckpointSummary | null {
  const nextPageTokenPresent = Boolean(
    typeof params.pageToken === 'string' && params.pageToken.trim()
  )
  const pageIndex =
    typeof params.pageIndex === 'number' && Number.isFinite(params.pageIndex)
      ? params.pageIndex
      : null
  const processedMessages =
    typeof params.processedMessages === 'number' && Number.isFinite(params.processedMessages)
      ? params.processedMessages
      : null
  const processedAt =
    typeof params.processedAt === 'string' && params.processedAt.trim()
      ? params.processedAt
      : null
  const usable = hasResumableCheckpointToken({
    pageToken: params.pageToken,
    pageIndex,
    processedMessages,
  })
  if (!usable) return null
  return {
    usable,
    next_page_token_present: nextPageTokenPresent,
    page_index: pageIndex,
    processed_messages: processedMessages,
    processed_at: processedAt,
  }
}

function summarizeResumeCheckpoint(params: {
  pageToken: string | null | undefined
  pageIndex: number | null | undefined
  processedMessages: number | null | undefined
  processedAt: string | null | undefined
}): GmailMailboxIndexResumeCheckpointSummary {
  const usable = hasCheckpointProgress({
    pageToken: params.pageToken,
    pageIndex: params.pageIndex,
    processedMessages: params.processedMessages,
  })
  return {
    usable,
    next_page_token_present: Boolean(typeof params.pageToken === 'string' && params.pageToken.trim()),
    page_index: typeof params.pageIndex === 'number' ? params.pageIndex : null,
    processed_messages: typeof params.processedMessages === 'number' ? params.processedMessages : null,
    processed_at:
      typeof params.processedAt === 'string' && params.processedAt.trim() ? params.processedAt : null,
  }
}

function normalizeBackfillWindowMonths(
  value: number | null | undefined
): GmailOperatorBackfillWindowMonths | null {
  if (value === 24 || value === 36) return value
  return null
}

function parseBackfillCutoffAt(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

export function isHistoricalBackfillWindowComplete(params: {
  state: GmailMailboxIndexState | null | undefined
  requestedWindowMonths: GmailOperatorBackfillWindowMonths
}): boolean {
  const completedWindowMonths = normalizeBackfillWindowMonths(
    params.state?.backfill_completed_window_months ?? null
  )
  return completedWindowMonths != null && completedWindowMonths >= params.requestedWindowMonths
}

function computeHistoricalBackfillCutoffAt(params: {
  campaignStartedAtIso: string
  windowMonths: GmailOperatorBackfillWindowMonths
}): string {
  const startedAtMs = Date.parse(params.campaignStartedAtIso)
  const baseDate = Number.isFinite(startedAtMs) ? new Date(startedAtMs) : new Date()
  const cutoffDate = new Date(baseDate.getTime())
  cutoffDate.setUTCMonth(cutoffDate.getUTCMonth() - params.windowMonths)
  return cutoffDate.toISOString()
}

function resolveOperatorBackfillCampaignTarget(params: {
  state: GmailMailboxIndexState | null | undefined
  requestedWindowMonths: GmailOperatorBackfillWindowMonths
  nowIso?: string
}): {
  windowMonths: GmailOperatorBackfillWindowMonths
  cutoffAt: string
  reusedPersistedCutoff: boolean
} {
  const persistedWindowMonths = normalizeBackfillWindowMonths(
    params.state?.active_backfill_window_months ?? null
  )
  const persistedCutoffAt = parseBackfillCutoffAt(params.state?.active_backfill_cutoff_at ?? null)
  if (
    persistedWindowMonths === params.requestedWindowMonths &&
    typeof persistedCutoffAt === 'string' &&
    persistedCutoffAt
  ) {
    return {
      windowMonths: params.requestedWindowMonths,
      cutoffAt: persistedCutoffAt,
      reusedPersistedCutoff: true,
    }
  }
  const nowIso = params.nowIso ?? new Date().toISOString()
  return {
    windowMonths: params.requestedWindowMonths,
    cutoffAt: computeHistoricalBackfillCutoffAt({
      campaignStartedAtIso: nowIso,
      windowMonths: params.requestedWindowMonths,
    }),
    reusedPersistedCutoff: false,
  }
}

function findOldestInternalDateIso(rows: Array<Pick<GmailMailboxIndexRow, 'internal_date_ms'>>): string | null {
  let oldestMs: number | null = null
  for (const row of rows) {
    if (!isUsableMailboxInternalDateMs(row.internal_date_ms)) continue
    oldestMs = oldestMs == null ? row.internal_date_ms : Math.min(oldestMs, row.internal_date_ms)
  }
  return oldestMs == null ? null : new Date(oldestMs).toISOString()
}

function isSameRegisteredMailboxIndexRun(params: {
  state: GmailMailboxIndexState | null | undefined
  runId: string
  trigger: GmailMailboxIndexTrigger
}): boolean {
  return Boolean(
    params.state &&
      params.state.active_run_id === params.runId &&
      params.state.active_run_trigger === params.trigger &&
      isMailboxIndexRunInProgressStatus(params.state.last_sync_status)
  )
}

function logManualFullCheckpointEvent(params: {
  event:
    | 'resume_checkpoint_selected'
    | 'resume_checkpoint_missing'
    | 'checkpoint_persisted'
    | 'checkpoint_copied_to_last_resume'
    | 'checkpoint_cleared'
  run: GmailMailboxIndexRunContext
  checkpoint?: GmailMailboxIndexResumeCheckpoint | null
  activeCheckpoint: GmailMailboxIndexResumeCheckpointSummary
  lastResumeCheckpoint: GmailMailboxIndexResumeCheckpointSummary
  reason?: string | null
}): void {
  if (!isResumeCapableFullTrigger(params.run.trigger)) return
  console.info(
    `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
      event: params.event,
      run_id: params.run.runId,
      trigger: params.run.trigger,
      requested_mode: params.run.requestedMode,
      effective_mode: 'full',
      checkpoint_source: params.checkpoint?.source ?? null,
      selected_checkpoint: params.checkpoint
        ? {
            next_page_token_present: Boolean(params.checkpoint.nextPageToken),
            page_index: params.checkpoint.pageIndex,
            processed_messages: params.checkpoint.processedMessages,
            processed_at: params.checkpoint.processedAt,
          }
        : null,
      active_checkpoint: params.activeCheckpoint,
      last_resume_checkpoint: params.lastResumeCheckpoint,
      reason: params.reason ?? null,
    })}`
  )
}

function mailboxIndexDeferredResult(params: {
  run: GmailMailboxIndexRunContext
  currentState: GmailMailboxIndexState | null | undefined
}): GmailMailboxIndexSyncResult {
  const indexedCount =
    params.currentState?.indexed_message_count != null &&
    Number.isFinite(params.currentState.indexed_message_count)
      ? Math.max(0, Math.round(params.currentState.indexed_message_count))
      : params.run.rowsBefore
  return {
    ok: true,
    deferred: true,
    reason: 'manual_full_run_active',
    mode: params.run.requestedMode,
    requested_mode: params.run.requestedMode,
    effective_mode: params.currentState?.active_effective_mode ?? 'full',
    run_id: params.currentState?.active_run_id ?? params.run.runId,
    active_run_id: params.currentState?.active_run_id ?? null,
    trigger: params.run.trigger,
    terminal_reason: 'already_running',
    gmail_result_size_estimate: params.currentState?.last_gmail_result_size_estimate ?? null,
    list_pages_fetched: params.currentState?.active_list_pages_fetched ?? null,
    processed_messages: params.currentState?.active_processed_messages ?? 0,
    upserted_messages: 0,
    deleted_messages: 0,
    indexed_message_count: indexedCount,
    rows_before: params.run.rowsBefore,
    rows_after: indexedCount,
    growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, indexedCount),
    last_history_id: params.currentState?.last_history_id ?? null,
    used_fallback_full_scan: false,
  }
}

function mailboxIndexRecoveryBridgeYieldedResult(params: {
  run: GmailMailboxIndexRunContext
  processedMessages: number
  upsertedMessages: number
  indexedMessageCount: number
  gmailResultSizeEstimate: number | null
  listPagesFetched: number
  lastHistoryId: string | null
}): GmailMailboxIndexSyncResult {
  return {
    ok: true,
    deferred: true,
    reason: 'recovery_bridge_yielded',
    mode: params.run.requestedMode,
    requested_mode: params.run.requestedMode,
    effective_mode: 'full',
    run_id: params.run.runId,
    active_run_id: null,
    trigger: params.run.trigger,
    terminal_reason: 'recovery_bridge_yielded',
    gmail_result_size_estimate: params.gmailResultSizeEstimate,
    list_pages_fetched: params.listPagesFetched,
    processed_messages: params.processedMessages,
    upserted_messages: params.upsertedMessages,
    deleted_messages: 0,
    indexed_message_count: params.indexedMessageCount,
    rows_before: params.run.rowsBefore,
    rows_after: params.indexedMessageCount,
    growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, params.indexedMessageCount),
    last_history_id: params.lastHistoryId,
    used_fallback_full_scan: params.run.requestedMode !== 'full',
    artifact_refresh_hint: null,
  }
}

function mailboxIndexSuccessResult(params: {
  effectiveMode: 'full' | 'incremental'
  run: GmailMailboxIndexRunContext
  terminalReason: GmailMailboxIndexTerminalReason
  gmailResultSizeEstimate: number | null
  listPagesFetched: number | null
  processedMessages: number
  upsertedMessages: number
  deletedMessages: number
  indexedMessageCount: number
  lastHistoryId: string | null
  usedFallbackFullScan: boolean
  artifactRefreshHint?: GmailArtifactIncrementalRefreshHint | null
}): GmailMailboxIndexSyncResult {
  return {
    ok: true,
    mode: params.run.requestedMode,
    requested_mode: params.run.requestedMode,
    effective_mode: params.effectiveMode,
    run_id: params.run.runId,
    trigger: params.run.trigger,
    terminal_reason: params.terminalReason,
    gmail_result_size_estimate: params.gmailResultSizeEstimate,
    list_pages_fetched: params.listPagesFetched,
    processed_messages: params.processedMessages,
    upserted_messages: params.upsertedMessages,
    deleted_messages: params.deletedMessages,
    indexed_message_count: params.indexedMessageCount,
    rows_before: params.run.rowsBefore,
    rows_after: params.indexedMessageCount,
    growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, params.indexedMessageCount),
    last_history_id: params.lastHistoryId,
    used_fallback_full_scan:
      params.usedFallbackFullScan || params.run.requestedMode !== params.effectiveMode,
    artifact_refresh_hint: params.artifactRefreshHint ?? null,
  }
}

function mailboxIndexFailureResult(params: {
  effectiveMode: 'full' | 'incremental'
  run: GmailMailboxIndexRunContext
  reason: GmailMailboxIndexFailureReason
  error: string
  terminalReason: GmailMailboxIndexTerminalReason
  gmailResultSizeEstimate?: number | null
  listPagesFetched?: number | null
  processedMessages?: number | null
  lastHistoryId?: string | null
  usedFallbackFullScan?: boolean
  rowsAfter?: number
}): GmailMailboxIndexSyncResult {
  const rowsAfter = params.rowsAfter ?? params.run.rowsBefore
  if (isResumeCapableFullTrigger(params.run.trigger) && params.effectiveMode === 'full') {
    console.info(
      `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
        event: 'failed',
        run_id: params.run.runId,
        trigger: params.run.trigger,
        requested_mode: params.run.requestedMode,
        effective_mode: params.effectiveMode,
        rows_before: params.run.rowsBefore,
        rows_after: rowsAfter,
        growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, rowsAfter),
        list_pages_fetched: params.listPagesFetched ?? null,
        processed_messages: params.processedMessages ?? null,
        indexed_message_count: rowsAfter,
        terminal_reason: params.terminalReason,
        failure_reason: params.reason,
      })}`
    )
  }
  return {
    ok: false,
    mode: params.run.requestedMode,
    requested_mode: params.run.requestedMode,
    effective_mode: params.effectiveMode,
    run_id: params.run.runId,
    trigger: params.run.trigger,
    reason: params.reason,
    error: params.error,
    terminal_reason: params.terminalReason,
    gmail_result_size_estimate: params.gmailResultSizeEstimate ?? null,
    list_pages_fetched: params.listPagesFetched ?? null,
    rows_before: params.run.rowsBefore,
    rows_after: rowsAfter,
    growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, rowsAfter),
    ...(params.lastHistoryId !== undefined ? { last_history_id: params.lastHistoryId } : {}),
    ...(params.usedFallbackFullScan !== undefined
      ? { used_fallback_full_scan: params.usedFallbackFullScan }
      : { used_fallback_full_scan: params.run.requestedMode !== params.effectiveMode }),
  }
}

async function upsertMailboxIndexState(params: {
  supabase: SupabaseClient
  tenantId: string
  lastHistoryId: string | null
  indexedMessageCount: number
  mailboxEstimatedTotal?: number | null
  indexCompletionPct?: number | null
  lastIndexDurationMs?: number | null
  lastSyncStatus: string
  lastSyncError: string | null
  lastFullScanAt?: string | null
  lastIncrementalSyncAt?: string | null
  activeRunId?: string | null
  activeRunMode?: 'full' | 'incremental' | null
  activeRequestedMode?: 'full' | 'incremental' | null
  activeEffectiveMode?: 'full' | 'incremental' | null
  activeRunTrigger?: GmailMailboxIndexTrigger | null
  activeRequestedMaxMessages?: number | null
  activeStartedAt?: string | null
  activeHeartbeatAt?: string | null
  activeStartedFromCheckpoint?: boolean | null
  activeRowsBefore?: number | null
  activeProcessedMessages?: number | null
  activeListPagesFetched?: number | null
  activeNextPageToken?: string | null
  activeLastPageIndex?: number | null
  activeLastProcessedAt?: string | null
  activeYieldDetail?: GmailMailboxIndexYieldDetail | null
  lastRunId?: string | null
  lastRunTrigger?: GmailMailboxIndexTrigger | null
  lastCompletedAt?: string | null
  lastCompletedMode?: 'full' | 'incremental' | null
  lastRequestedMode?: 'full' | 'incremental' | null
  lastEffectiveMode?: 'full' | 'incremental' | null
  lastRowsBefore?: number | null
  lastRowsAfter?: number | null
  lastGrowthDelta?: number | null
  lastProcessedMessages?: number | null
  lastUpsertedMessages?: number | null
  lastDeletedMessages?: number | null
  lastFailureReason?: string | null
  lastFailureReasonDetail?: GmailMailboxIndexFailureDetail | null
  lastTerminalReason?: GmailMailboxIndexTerminalReason | null
  lastGmailResultSizeEstimate?: number | null
  lastListPagesFetched?: number | null
  lastResumePageToken?: string | null
  lastResumePageIndex?: number | null
  lastResumeProcessedAt?: string | null
  backfillResumePageToken?: string | null
  backfillResumePageIndex?: number | null
  backfillResumeProcessedMessages?: number | null
  backfillResumeProcessedAt?: string | null
  activeBackfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
  activeBackfillCutoffAt?: string | null
  backfillCompletedWindowMonths?: GmailOperatorBackfillWindowMonths | null
  backfillCompletedCutoffAt?: string | null
  backfillCompletedAt?: string | null
  lastStartedFromCheckpoint?: boolean | null
  lastYieldDetail?: GmailMailboxIndexYieldDetail | null
}): Promise<void> {
  const { error } = await params.supabase.from('gmail_mailbox_index_state').upsert(
    [
      {
        tenant_id: params.tenantId,
        last_history_id: params.lastHistoryId,
        indexed_message_count: params.indexedMessageCount,
        ...(params.mailboxEstimatedTotal !== undefined
          ? { mailbox_estimated_total: params.mailboxEstimatedTotal }
          : {}),
        ...(params.indexCompletionPct !== undefined
          ? { index_completion_pct: params.indexCompletionPct }
          : {}),
        ...(params.lastIndexDurationMs !== undefined
          ? { last_index_duration_ms: params.lastIndexDurationMs }
          : {}),
        last_sync_status: params.lastSyncStatus,
        last_sync_error: params.lastSyncError,
        ...(params.activeRunId !== undefined ? { active_run_id: params.activeRunId } : {}),
        ...(params.activeRunMode !== undefined ? { active_run_mode: params.activeRunMode } : {}),
        ...(params.activeRequestedMode !== undefined
          ? { active_requested_mode: params.activeRequestedMode }
          : {}),
        ...(params.activeEffectiveMode !== undefined
          ? { active_effective_mode: params.activeEffectiveMode }
          : {}),
        ...(params.activeRunTrigger !== undefined
          ? { active_run_trigger: params.activeRunTrigger }
          : {}),
        ...(params.activeRequestedMaxMessages !== undefined
          ? { active_requested_max_messages: params.activeRequestedMaxMessages }
          : {}),
        ...(params.activeStartedAt !== undefined ? { active_started_at: params.activeStartedAt } : {}),
        ...(params.activeHeartbeatAt !== undefined
          ? { active_heartbeat_at: params.activeHeartbeatAt }
          : {}),
        ...(params.activeStartedFromCheckpoint !== undefined
          ? { active_started_from_checkpoint: params.activeStartedFromCheckpoint }
          : {}),
        ...(params.activeRowsBefore !== undefined ? { active_rows_before: params.activeRowsBefore } : {}),
        ...(params.activeProcessedMessages !== undefined
          ? { active_processed_messages: params.activeProcessedMessages }
          : {}),
        ...(params.activeListPagesFetched !== undefined
          ? { active_list_pages_fetched: params.activeListPagesFetched }
          : {}),
        ...(params.activeNextPageToken !== undefined
          ? { active_next_page_token: params.activeNextPageToken }
          : {}),
        ...(params.activeLastPageIndex !== undefined
          ? { active_last_page_index: params.activeLastPageIndex }
          : {}),
        ...(params.activeLastProcessedAt !== undefined
          ? { active_last_processed_at: params.activeLastProcessedAt }
          : {}),
        ...(params.activeYieldDetail !== undefined ? { active_yield_detail: params.activeYieldDetail } : {}),
        ...(params.lastRunId !== undefined ? { last_run_id: params.lastRunId } : {}),
        ...(params.lastRunTrigger !== undefined ? { last_run_trigger: params.lastRunTrigger } : {}),
        ...(params.lastCompletedAt !== undefined ? { last_completed_at: params.lastCompletedAt } : {}),
        ...(params.lastCompletedMode !== undefined
          ? { last_completed_mode: params.lastCompletedMode }
          : {}),
        ...(params.lastRequestedMode !== undefined
          ? { last_requested_mode: params.lastRequestedMode }
          : {}),
        ...(params.lastEffectiveMode !== undefined
          ? { last_effective_mode: params.lastEffectiveMode }
          : {}),
        ...(params.lastRowsBefore !== undefined ? { last_rows_before: params.lastRowsBefore } : {}),
        ...(params.lastRowsAfter !== undefined ? { last_rows_after: params.lastRowsAfter } : {}),
        ...(params.lastGrowthDelta !== undefined ? { last_growth_delta: params.lastGrowthDelta } : {}),
        ...(params.lastProcessedMessages !== undefined
          ? { last_processed_messages: params.lastProcessedMessages }
          : {}),
        ...(params.lastUpsertedMessages !== undefined
          ? { last_upserted_messages: params.lastUpsertedMessages }
          : {}),
        ...(params.lastDeletedMessages !== undefined
          ? { last_deleted_messages: params.lastDeletedMessages }
          : {}),
        ...(params.lastFailureReason !== undefined
          ? { last_failure_reason: params.lastFailureReason }
          : {}),
        ...(params.lastFailureReasonDetail !== undefined
          ? { last_failure_reason_detail: params.lastFailureReasonDetail }
          : {}),
        ...(params.lastTerminalReason !== undefined
          ? { last_terminal_reason: params.lastTerminalReason }
          : {}),
        ...(params.lastGmailResultSizeEstimate !== undefined
          ? { last_gmail_result_size_estimate: params.lastGmailResultSizeEstimate }
          : {}),
        ...(params.lastListPagesFetched !== undefined
          ? { last_list_pages_fetched: params.lastListPagesFetched }
          : {}),
        ...(params.lastResumePageToken !== undefined
          ? { last_resume_page_token: params.lastResumePageToken }
          : {}),
        ...(params.lastResumePageIndex !== undefined
          ? { last_resume_page_index: params.lastResumePageIndex }
          : {}),
        ...(params.lastResumeProcessedAt !== undefined
          ? { last_resume_processed_at: params.lastResumeProcessedAt }
          : {}),
        ...(params.backfillResumePageToken !== undefined
          ? { backfill_resume_page_token: params.backfillResumePageToken }
          : {}),
        ...(params.backfillResumePageIndex !== undefined
          ? { backfill_resume_page_index: params.backfillResumePageIndex }
          : {}),
        ...(params.backfillResumeProcessedMessages !== undefined
          ? { backfill_resume_processed_messages: params.backfillResumeProcessedMessages }
          : {}),
        ...(params.backfillResumeProcessedAt !== undefined
          ? { backfill_resume_processed_at: params.backfillResumeProcessedAt }
          : {}),
        ...(params.activeBackfillWindowMonths !== undefined
          ? { active_backfill_window_months: params.activeBackfillWindowMonths }
          : {}),
        ...(params.activeBackfillCutoffAt !== undefined
          ? { active_backfill_cutoff_at: params.activeBackfillCutoffAt }
          : {}),
        ...(params.backfillCompletedWindowMonths !== undefined
          ? { backfill_completed_window_months: params.backfillCompletedWindowMonths }
          : {}),
        ...(params.backfillCompletedCutoffAt !== undefined
          ? { backfill_completed_cutoff_at: params.backfillCompletedCutoffAt }
          : {}),
        ...(params.backfillCompletedAt !== undefined
          ? { backfill_completed_at: params.backfillCompletedAt }
          : {}),
        ...(params.lastStartedFromCheckpoint !== undefined
          ? { last_started_from_checkpoint: params.lastStartedFromCheckpoint }
          : {}),
        ...(params.lastYieldDetail !== undefined ? { last_yield_detail: params.lastYieldDetail } : {}),
        ...(params.lastFullScanAt !== undefined
          ? { last_full_scan_at: params.lastFullScanAt }
          : {}),
        ...(params.lastIncrementalSyncAt !== undefined
          ? { last_incremental_sync_at: params.lastIncrementalSyncAt }
          : {}),
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'tenant_id' }
  )
  if (error) {
    console.error('[integrations/gmail/mailbox-index] state upsert failed:', {
      tenantId: params.tenantId,
      lastSyncStatus: params.lastSyncStatus,
      activeRunId: params.activeRunId ?? null,
      activeRunTrigger: params.activeRunTrigger ?? null,
      error,
    })
    throw new Error(`Failed to persist Gmail mailbox index state: ${error.message}`)
  }
}

async function markMailboxIndexRunStarted(params: {
  supabase: SupabaseClient
  tenantId: string
  effectiveMode: 'full' | 'incremental'
  trigger: GmailMailboxIndexTrigger
  runId: string
  requestedMaxMessages: number
  run: GmailMailboxIndexRunContext
  lastHistoryId: string | null
  mailboxEstimatedTotal: number | null
  indexCompletionPct: number | null
  activeProcessedMessages?: number | null
  activeListPagesFetched?: number | null
  activeNextPageToken?: string | null
  activeLastPageIndex?: number | null
  activeLastProcessedAt?: string | null
  backfillResumeProcessedMessages?: number | null
  activeBackfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
  activeBackfillCutoffAt?: string | null
  startedFromCheckpoint?: boolean | null
  yieldDetail?: GmailMailboxIndexYieldDetail | null
}): Promise<void> {
  const nowIso = new Date().toISOString()
  const activeProcessedMessages = params.activeProcessedMessages ?? 0
  const backfillResumeProcessedMessages =
    typeof params.backfillResumeProcessedMessages === 'number'
      ? params.backfillResumeProcessedMessages
      : activeProcessedMessages
  const activeListPagesFetched =
    params.activeListPagesFetched ?? (params.effectiveMode === 'full' ? 0 : null)
  const startedFromCheckpoint =
    params.startedFromCheckpoint ??
    (isResumeCapableFullTrigger(params.trigger) &&
      params.effectiveMode === 'full' &&
      hasResumableCheckpointToken({
        pageToken: params.activeNextPageToken,
        pageIndex: params.activeLastPageIndex,
        processedMessages: activeProcessedMessages,
      }))
  const shouldPersistSharedResumeCheckpoint =
    usesSharedResumeCheckpointTrigger(params.trigger) &&
    params.effectiveMode === 'full' &&
    hasCheckpointProgress({
      pageToken: params.activeNextPageToken,
      pageIndex: params.activeLastPageIndex,
      processedMessages: activeProcessedMessages,
    })
  const shouldPersistDedicatedBackfillCheckpoint =
    params.trigger === 'operator_backfill' &&
    params.effectiveMode === 'full' &&
    hasCheckpointProgress({
      pageToken: params.activeNextPageToken,
      pageIndex: params.activeLastPageIndex,
      processedMessages: activeProcessedMessages,
    })
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: params.lastHistoryId,
    indexedMessageCount: params.run.rowsBefore,
    mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    indexCompletionPct: params.indexCompletionPct,
    lastSyncStatus: mailboxIndexInProgressStatus(params.effectiveMode),
    lastSyncError: null,
    activeRunId: params.runId,
    activeRunMode: params.effectiveMode,
    activeRequestedMode: params.run.requestedMode,
    activeEffectiveMode: params.effectiveMode,
    activeRunTrigger: params.trigger,
    activeRequestedMaxMessages: params.requestedMaxMessages,
    activeStartedAt: nowIso,
    activeHeartbeatAt: nowIso,
    activeStartedFromCheckpoint: startedFromCheckpoint,
    activeRowsBefore: params.run.rowsBefore,
    activeProcessedMessages,
    activeListPagesFetched,
    activeNextPageToken: params.activeNextPageToken ?? null,
    activeLastPageIndex: params.activeLastPageIndex ?? (params.effectiveMode === 'full' ? 0 : null),
    activeLastProcessedAt: params.activeLastProcessedAt ?? null,
    activeYieldDetail: params.yieldDetail ?? null,
    ...(shouldPersistSharedResumeCheckpoint
      ? {
          lastResumePageToken: params.activeNextPageToken ?? null,
          lastResumePageIndex: params.activeLastPageIndex ?? 0,
          lastResumeProcessedAt: params.activeLastProcessedAt ?? null,
        }
      : {}),
    ...(params.trigger === 'operator_backfill' && params.effectiveMode === 'full'
      ? {
          backfillResumePageToken: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeNextPageToken ?? null
            : null,
          backfillResumePageIndex: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastPageIndex ?? 0
            : null,
          backfillResumeProcessedMessages: shouldPersistDedicatedBackfillCheckpoint
            ? backfillResumeProcessedMessages
            : null,
          backfillResumeProcessedAt: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastProcessedAt ?? null
            : null,
          activeBackfillWindowMonths: params.activeBackfillWindowMonths ?? null,
          activeBackfillCutoffAt: params.activeBackfillCutoffAt ?? null,
        }
      : {}),
  })
  if (isResumeCapableFullTrigger(params.trigger) && params.effectiveMode === 'full') {
    console.info(
      `${operatorFullLogPrefix(params.trigger)} ${JSON.stringify({
        event: startedFromCheckpoint ? 'resumed_from_checkpoint' : 'started',
        run_id: params.runId,
        trigger: params.trigger,
        requested_mode: params.run.requestedMode,
        effective_mode: params.effectiveMode,
        message:
          params.trigger === 'operator_backfill'
            ? startedFromCheckpoint
              ? 'Resumed historical backfill from saved checkpoint'
              : 'Fresh historical backfill started'
            : null,
        backfill_window_months:
          params.trigger === 'operator_backfill' ? params.activeBackfillWindowMonths ?? null : null,
        backfill_cutoff_at:
          params.trigger === 'operator_backfill' ? params.activeBackfillCutoffAt ?? null : null,
        rows_before: params.run.rowsBefore,
        rows_after: params.run.rowsBefore,
        growth_delta: 0,
        list_pages_fetched: activeListPagesFetched,
        processed_messages: activeProcessedMessages,
        resume_next_page_token_present:
          startedFromCheckpoint
            ? params.activeNextPageToken != null
            : null,
        resume_page_index:
          startedFromCheckpoint
            ? params.activeLastPageIndex ?? null
            : null,
        indexed_message_count: params.run.rowsBefore,
        resume_checkpoint_processed_messages:
          params.trigger === 'operator_backfill' && startedFromCheckpoint
            ? backfillResumeProcessedMessages
            : null,
      })}`
    )
  }
}

async function markMailboxIndexRunHeartbeat(params: {
  supabase: SupabaseClient
  tenantId: string
  effectiveMode: 'full' | 'incremental'
  run: GmailMailboxIndexRunContext
  lastHistoryId: string | null
  mailboxEstimatedTotal: number | null
  indexCompletionPct: number | null
  indexedMessageCount: number
  processedMessages: number
  upsertedMessages: number
  deletedMessages: number
  listPagesFetched?: number | null
  activeNextPageToken?: string | null
  activeLastPageIndex?: number | null
  activeLastProcessedAt?: string | null
  backfillResumeProcessedMessages?: number | null
  activeBackfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
  activeBackfillCutoffAt?: string | null
  yieldDetail?: GmailMailboxIndexYieldDetail | null
  emitManualFullLog?: boolean
}): Promise<void> {
  const backfillResumeProcessedMessages =
    typeof params.backfillResumeProcessedMessages === 'number'
      ? params.backfillResumeProcessedMessages
      : params.processedMessages
  const shouldPersistSharedResumeCheckpoint =
    usesSharedResumeCheckpointTrigger(params.run.trigger) &&
    params.effectiveMode === 'full' &&
    hasCheckpointProgress({
      pageToken: params.activeNextPageToken,
      pageIndex: params.activeLastPageIndex,
      processedMessages: params.processedMessages,
    })
  const shouldPersistDedicatedBackfillCheckpoint =
    params.run.trigger === 'operator_backfill' &&
    params.effectiveMode === 'full' &&
    hasCheckpointProgress({
      pageToken: params.activeNextPageToken,
      pageIndex: params.activeLastPageIndex,
      processedMessages: params.processedMessages,
    })
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: params.lastHistoryId,
    indexedMessageCount: params.indexedMessageCount,
    mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    indexCompletionPct: params.indexCompletionPct,
    lastSyncStatus: mailboxIndexInProgressStatus(params.effectiveMode),
    lastSyncError: null,
    activeRunId: params.run.runId,
    activeRunMode: params.effectiveMode,
    activeRequestedMode: params.run.requestedMode,
    activeEffectiveMode: params.effectiveMode,
    activeRunTrigger: params.run.trigger,
    activeHeartbeatAt: new Date().toISOString(),
    activeRowsBefore: params.run.rowsBefore,
    activeProcessedMessages: params.processedMessages,
    activeListPagesFetched: params.listPagesFetched ?? null,
    activeNextPageToken: params.activeNextPageToken ?? null,
    activeLastPageIndex: params.activeLastPageIndex ?? null,
    activeLastProcessedAt: params.activeLastProcessedAt ?? null,
    ...(shouldPersistSharedResumeCheckpoint
      ? {
          lastResumePageToken: params.activeNextPageToken ?? null,
          lastResumePageIndex: params.activeLastPageIndex ?? null,
          lastResumeProcessedAt: params.activeLastProcessedAt ?? null,
        }
      : {}),
    ...(params.run.trigger === 'operator_backfill' && params.effectiveMode === 'full'
      ? {
          backfillResumePageToken: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeNextPageToken ?? null
            : null,
          backfillResumePageIndex: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastPageIndex ?? null
            : null,
          backfillResumeProcessedMessages: shouldPersistDedicatedBackfillCheckpoint
            ? backfillResumeProcessedMessages
            : null,
          backfillResumeProcessedAt: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastProcessedAt ?? null
            : null,
          activeBackfillWindowMonths: params.activeBackfillWindowMonths ?? null,
          activeBackfillCutoffAt: params.activeBackfillCutoffAt ?? null,
        }
      : {}),
    activeYieldDetail: params.yieldDetail ?? null,
  })
  if (shouldPersistSharedResumeCheckpoint || shouldPersistDedicatedBackfillCheckpoint) {
    logManualFullCheckpointEvent({
      event: 'checkpoint_persisted',
      run: params.run,
      activeCheckpoint: summarizeResumeCheckpoint({
        pageToken: params.activeNextPageToken,
        pageIndex: params.activeLastPageIndex,
        processedMessages:
          params.run.trigger === 'operator_backfill'
            ? backfillResumeProcessedMessages
            : params.processedMessages,
        processedAt: params.activeLastProcessedAt,
      }),
      lastResumeCheckpoint: summarizeResumeCheckpoint({
        pageToken:
          params.run.trigger === 'operator_backfill'
            ? params.activeNextPageToken
            : params.activeNextPageToken,
        pageIndex: params.activeLastPageIndex,
        processedMessages:
          params.run.trigger === 'operator_backfill'
            ? backfillResumeProcessedMessages
            : params.processedMessages,
        processedAt: params.activeLastProcessedAt,
      }),
    })
  }
  if (
    params.emitManualFullLog !== false &&
    isResumeCapableFullTrigger(params.run.trigger) &&
    params.effectiveMode === 'full'
  ) {
    console.info(
      `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
        event: 'heartbeat',
        run_id: params.run.runId,
        trigger: params.run.trigger,
        requested_mode: params.run.requestedMode,
        effective_mode: params.effectiveMode,
        rows_before: params.run.rowsBefore,
        rows_after: params.indexedMessageCount,
        growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, params.indexedMessageCount),
        list_pages_fetched: params.listPagesFetched ?? null,
        processed_messages: params.processedMessages,
        indexed_message_count: params.indexedMessageCount,
      })}`
    )
  }
}

async function markMailboxIndexRunFailed(params: {
  supabase: SupabaseClient
  tenantId: string
  effectiveMode: 'full' | 'incremental'
  run: GmailMailboxIndexRunContext
  lastHistoryId: string | null
  mailboxEstimatedTotal: number | null
  indexedMessageCount: number
  lastIndexDurationMs: number
  lastSyncStatus: string
  lastSyncError: string
  lastFailureReason: string
  terminalReason: GmailMailboxIndexTerminalReason
  gmailResultSizeEstimate: number | null
  listPagesFetched: number | null
  lastFullScanAt?: string | null
  lastIncrementalSyncAt?: string | null
  processedMessages: number
  upsertedMessages: number
  deletedMessages: number
  lastFailureReasonDetail?: GmailMailboxIndexFailureDetail | null
  yieldDetail?: GmailMailboxIndexYieldDetail | null
  activeNextPageToken?: string | null
  activeLastPageIndex?: number | null
  activeLastProcessedAt?: string | null
  backfillResumeProcessedMessages?: number | null
  activeBackfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
  activeBackfillCutoffAt?: string | null
  startedFromCheckpoint?: boolean | null
}): Promise<void> {
  const growthDelta = mailboxIndexGrowthDelta(params.run.rowsBefore, params.indexedMessageCount)
  const backfillResumeProcessedMessages =
    typeof params.backfillResumeProcessedMessages === 'number'
      ? params.backfillResumeProcessedMessages
      : params.processedMessages
  const shouldPersistSharedResumeCheckpoint =
    usesSharedResumeCheckpointTrigger(params.run.trigger) && params.effectiveMode === 'full'
  const shouldPersistDedicatedBackfillCheckpoint =
    params.run.trigger === 'operator_backfill' &&
    params.effectiveMode === 'full' &&
    hasCheckpointProgress({
      pageToken: params.activeNextPageToken,
      pageIndex: params.activeLastPageIndex,
      processedMessages: params.processedMessages,
    })
  const finalYieldDetail = recoveryBridgeYieldDetail(params.yieldDetail, 'failed')
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: params.lastHistoryId,
    indexedMessageCount: params.indexedMessageCount,
    mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    indexCompletionPct: computeIndexCompletionPct({
      indexedMessageCount: params.indexedMessageCount,
      mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    }),
    lastIndexDurationMs: params.lastIndexDurationMs,
    lastSyncStatus: params.lastSyncStatus,
    lastSyncError: params.lastSyncError,
    activeRunId: null,
    activeRunMode: null,
    activeRequestedMode: null,
    activeEffectiveMode: null,
    activeRunTrigger: null,
    activeRequestedMaxMessages: null,
    activeStartedAt: null,
    activeHeartbeatAt: null,
    activeStartedFromCheckpoint: null,
    activeRowsBefore: null,
    activeProcessedMessages: null,
    activeListPagesFetched: null,
    activeNextPageToken: null,
    activeLastPageIndex: null,
    activeLastProcessedAt: null,
    activeYieldDetail: null,
    lastRunId: params.run.runId,
    lastRunTrigger: params.run.trigger,
    lastCompletedAt: null,
    lastCompletedMode: null,
    lastRequestedMode: params.run.requestedMode,
    lastEffectiveMode: params.effectiveMode,
    lastRowsBefore: params.run.rowsBefore,
    lastRowsAfter: params.indexedMessageCount,
    lastGrowthDelta: growthDelta,
    lastProcessedMessages: params.processedMessages,
    lastUpsertedMessages: params.upsertedMessages,
    lastDeletedMessages: params.deletedMessages,
    lastFailureReason: params.lastFailureReason,
    lastFailureReasonDetail: params.lastFailureReasonDetail ?? null,
    lastTerminalReason: params.terminalReason,
    lastGmailResultSizeEstimate: params.gmailResultSizeEstimate,
    lastListPagesFetched: params.listPagesFetched,
    ...(shouldPersistSharedResumeCheckpoint
      ? {
          lastResumePageToken: params.activeNextPageToken ?? null,
          lastResumePageIndex: params.activeLastPageIndex ?? null,
          lastResumeProcessedAt: params.activeLastProcessedAt ?? null,
        }
      : {}),
    ...(params.run.trigger === 'operator_backfill' && params.effectiveMode === 'full'
      ? {
          backfillResumePageToken: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeNextPageToken ?? null
            : null,
          backfillResumePageIndex: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastPageIndex ?? null
            : null,
          backfillResumeProcessedMessages: shouldPersistDedicatedBackfillCheckpoint
            ? backfillResumeProcessedMessages
            : null,
          backfillResumeProcessedAt: shouldPersistDedicatedBackfillCheckpoint
            ? params.activeLastProcessedAt ?? null
            : null,
          activeBackfillWindowMonths: params.activeBackfillWindowMonths ?? null,
          activeBackfillCutoffAt: params.activeBackfillCutoffAt ?? null,
        }
      : {}),
    lastStartedFromCheckpoint: params.startedFromCheckpoint ?? null,
    lastYieldDetail: finalYieldDetail,
    ...(params.lastFullScanAt !== undefined ? { lastFullScanAt: params.lastFullScanAt } : {}),
    ...(params.lastIncrementalSyncAt !== undefined
      ? { lastIncrementalSyncAt: params.lastIncrementalSyncAt }
      : {}),
  })
  if (shouldPersistSharedResumeCheckpoint || shouldPersistDedicatedBackfillCheckpoint) {
    logManualFullCheckpointEvent({
      event: 'checkpoint_copied_to_last_resume',
      run: params.run,
      activeCheckpoint: summarizeResumeCheckpoint({
        pageToken: params.activeNextPageToken,
        pageIndex: params.activeLastPageIndex,
        processedMessages:
          params.run.trigger === 'operator_backfill'
            ? backfillResumeProcessedMessages
            : params.processedMessages,
        processedAt: params.activeLastProcessedAt,
      }),
      lastResumeCheckpoint: summarizeResumeCheckpoint({
        pageToken: params.activeNextPageToken,
        pageIndex: params.activeLastPageIndex,
        processedMessages:
          params.run.trigger === 'operator_backfill'
            ? backfillResumeProcessedMessages
            : params.processedMessages,
        processedAt: params.activeLastProcessedAt,
      }),
      reason: params.lastFailureReason,
    })
  }
}

async function markMailboxIndexRunCompleted(params: {
  supabase: SupabaseClient
  tenantId: string
  effectiveMode: 'full' | 'incremental'
  run: GmailMailboxIndexRunContext
  lastHistoryId: string | null
  mailboxEstimatedTotal: number | null
  indexedMessageCount: number
  lastIndexDurationMs: number
  terminalReason: GmailMailboxIndexTerminalReason
  gmailResultSizeEstimate: number | null
  listPagesFetched: number | null
  processedMessages: number
  upsertedMessages: number
  deletedMessages: number
  yieldDetail?: GmailMailboxIndexYieldDetail | null
  clearResumeCheckpoint?: boolean
  clearActiveBackfillCampaign?: boolean
  activeBackfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
  activeBackfillCutoffAt?: string | null
  backfillCompletedWindowMonths?: GmailOperatorBackfillWindowMonths | null
  backfillCompletedCutoffAt?: string | null
  backfillCompletedAt?: string | null
  startedFromCheckpoint?: boolean | null
  continuityComplete?: boolean
}): Promise<void> {
  const nowIso = new Date().toISOString()
  const continuityComplete = params.continuityComplete !== false
  const growthDelta = mailboxIndexGrowthDelta(params.run.rowsBefore, params.indexedMessageCount)
  const shouldClearSharedResumeCheckpoint =
    params.clearResumeCheckpoint ??
    (usesSharedResumeCheckpointTrigger(params.run.trigger) && params.effectiveMode === 'full')
  const shouldClearDedicatedBackfillCheckpoint =
    false
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: params.lastHistoryId,
    indexedMessageCount: params.indexedMessageCount,
    mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    indexCompletionPct: computeIndexCompletionPct({
      indexedMessageCount: params.indexedMessageCount,
      mailboxEstimatedTotal: params.mailboxEstimatedTotal,
    }),
    lastIndexDurationMs: params.lastIndexDurationMs,
    lastSyncStatus: continuityComplete
      ? mailboxIndexCompleteStatus({
          mode: params.effectiveMode,
          growthDelta,
        })
      : 'full_scan_partial',
    lastSyncError: null,
    activeRunId: null,
    activeRunMode: null,
    activeRequestedMode: null,
    activeEffectiveMode: null,
    activeRunTrigger: null,
    activeRequestedMaxMessages: null,
    activeStartedAt: null,
    activeHeartbeatAt: null,
    activeStartedFromCheckpoint: null,
    activeRowsBefore: null,
    activeProcessedMessages: null,
    activeListPagesFetched: null,
    activeNextPageToken: null,
    activeLastPageIndex: null,
    activeLastProcessedAt: null,
    activeYieldDetail: null,
    lastRunId: params.run.runId,
    lastRunTrigger: params.run.trigger,
    ...(continuityComplete
      ? {
          lastCompletedAt: nowIso,
          lastCompletedMode: params.effectiveMode,
        }
      : {}),
    lastRequestedMode: params.run.requestedMode,
    lastEffectiveMode: params.effectiveMode,
    lastRowsBefore: params.run.rowsBefore,
    lastRowsAfter: params.indexedMessageCount,
    lastGrowthDelta: growthDelta,
    lastProcessedMessages: params.processedMessages,
    lastUpsertedMessages: params.upsertedMessages,
    lastDeletedMessages: params.deletedMessages,
    lastFailureReason: null,
    lastFailureReasonDetail: null,
    lastTerminalReason: params.terminalReason,
    lastGmailResultSizeEstimate: params.gmailResultSizeEstimate,
    lastListPagesFetched: params.listPagesFetched,
    ...(shouldClearSharedResumeCheckpoint
      ? {
          lastResumePageToken: null,
          lastResumePageIndex: null,
          lastResumeProcessedAt: null,
        }
      : {}),
    ...(shouldClearDedicatedBackfillCheckpoint
      ? {
          backfillResumePageToken: null,
          backfillResumePageIndex: null,
          backfillResumeProcessedMessages: null,
          backfillResumeProcessedAt: null,
        }
      : {}),
    ...(params.clearActiveBackfillCampaign && params.run.trigger === 'operator_backfill'
      ? {
          activeBackfillWindowMonths: null,
          activeBackfillCutoffAt: null,
        }
      : params.run.trigger === 'operator_backfill'
        ? {
            ...(params.activeBackfillWindowMonths !== undefined
              ? { activeBackfillWindowMonths: params.activeBackfillWindowMonths }
              : {}),
            ...(params.activeBackfillCutoffAt !== undefined
              ? { activeBackfillCutoffAt: params.activeBackfillCutoffAt }
              : {}),
          }
        : {}),
    ...(params.backfillCompletedWindowMonths !== undefined
      ? { backfillCompletedWindowMonths: params.backfillCompletedWindowMonths }
      : {}),
    ...(params.backfillCompletedCutoffAt !== undefined
      ? { backfillCompletedCutoffAt: params.backfillCompletedCutoffAt }
      : {}),
    ...(params.backfillCompletedAt !== undefined
      ? { backfillCompletedAt: params.backfillCompletedAt }
      : {}),
    lastStartedFromCheckpoint: params.startedFromCheckpoint ?? null,
    lastYieldDetail: params.yieldDetail ?? null,
    ...(params.effectiveMode === 'full' && continuityComplete
      ? {
          lastFullScanAt: nowIso,
          lastIncrementalSyncAt: nowIso,
        }
      : {
          lastIncrementalSyncAt: nowIso,
        }),
  })
  if (shouldClearSharedResumeCheckpoint || shouldClearDedicatedBackfillCheckpoint) {
    logManualFullCheckpointEvent({
      event: 'checkpoint_cleared',
      run: params.run,
      activeCheckpoint: summarizeResumeCheckpoint({
        pageToken: null,
        pageIndex: null,
        processedMessages: null,
        processedAt: null,
      }),
      lastResumeCheckpoint: summarizeResumeCheckpoint({
        pageToken: null,
        pageIndex: null,
        processedMessages: null,
        processedAt: null,
      }),
      reason: 'full_run_completed',
    })
  }
}

export async function loadGmailMailboxIndexState(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<GmailMailboxIndexState | null> {
  const { data, error } = await params.supabase
    .from('gmail_mailbox_index_state')
    .select(
      'tenant_id,last_history_id,last_full_scan_at,last_incremental_sync_at,indexed_message_count,mailbox_estimated_total,index_completion_pct,last_index_duration_ms,last_sync_status,last_sync_error,active_run_id,active_run_mode,active_requested_mode,active_effective_mode,active_run_trigger,active_requested_max_messages,active_started_at,active_heartbeat_at,active_started_from_checkpoint,active_rows_before,active_processed_messages,active_list_pages_fetched,active_next_page_token,active_last_page_index,active_last_processed_at,active_yield_detail,last_run_id,last_run_trigger,last_completed_at,last_completed_mode,last_requested_mode,last_effective_mode,last_rows_before,last_rows_after,last_growth_delta,last_processed_messages,last_upserted_messages,last_deleted_messages,last_failure_reason,last_failure_reason_detail,last_terminal_reason,last_gmail_result_size_estimate,last_list_pages_fetched,last_resume_page_token,last_resume_page_index,last_resume_processed_at,backfill_resume_page_token,backfill_resume_page_index,backfill_resume_processed_messages,backfill_resume_processed_at,active_backfill_window_months,active_backfill_cutoff_at,backfill_completed_window_months,backfill_completed_cutoff_at,backfill_completed_at,last_started_from_checkpoint,last_yield_detail,updated_at'
    )
    .eq('tenant_id', params.tenantId)
    .maybeSingle()
  if (error) {
    console.error('[integrations/gmail/mailbox-index] state load failed:', {
      tenantId: params.tenantId,
      error,
    })
    throw new Error(`Failed to load Gmail mailbox index state: ${error.message}`)
  }
  if (!data) return null
  return data as GmailMailboxIndexState
}

export async function primeAcceptedSmartSyncRunForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  runId: string
  maxMessages: number
  forceFreshHeadRecovery?: boolean
  currentState?: GmailMailboxIndexState | null
}): Promise<GmailAcceptedMailboxIndexRun> {
  const tenantId = params.tenantId.trim()
  const currentState =
    params.currentState ??
    (await loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId,
    }))
  const rowsBefore = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId,
  })
  const requestedMode = 'incremental' as const
  const effectiveMode = params.forceFreshHeadRecovery ? ('full' as const) : ('incremental' as const)
  const resumeCheckpoint = params.forceFreshHeadRecovery
    ? buildManualFullResumeCheckpoint(currentState)
    : null
  const resumedYieldDetail = resumeCheckpoint
    ? resumeCheckpoint.source === 'stale_active'
      ? currentState?.active_yield_detail ?? null
      : currentState?.last_yield_detail ?? null
    : null
  const mailboxEstimatedTotal =
    currentState?.mailbox_estimated_total != null &&
    Number.isFinite(currentState.mailbox_estimated_total)
      ? Math.max(0, Math.round(currentState.mailbox_estimated_total))
      : null
  const run: GmailMailboxIndexRunContext = {
    runId: params.runId,
    trigger: 'smart_sync',
    rowsBefore,
    requestedMode,
  }

  await markMailboxIndexRunStarted({
    supabase: params.supabase,
    tenantId,
    effectiveMode,
    trigger: 'smart_sync',
    runId: params.runId,
    requestedMaxMessages: params.maxMessages,
    run,
    lastHistoryId: currentState?.last_history_id ?? null,
    mailboxEstimatedTotal,
    indexCompletionPct:
      currentState?.index_completion_pct != null &&
      Number.isFinite(currentState.index_completion_pct)
        ? currentState.index_completion_pct
        : null,
    activeProcessedMessages: resumeCheckpoint?.processedMessages ?? null,
    activeListPagesFetched: resumeCheckpoint?.pageIndex ?? null,
    activeNextPageToken: resumeCheckpoint?.nextPageToken ?? null,
    activeLastPageIndex: resumeCheckpoint?.pageIndex ?? null,
    activeLastProcessedAt: resumeCheckpoint?.processedAt ?? null,
    startedFromCheckpoint: Boolean(resumeCheckpoint),
    yieldDetail: resumedYieldDetail,
  })

  console.info(
    `[integrations/gmail/mailbox-index/smart-sync] ${JSON.stringify({
      event: 'accepted_run_primed',
      run_id: params.runId,
      trigger: 'smart_sync',
      requested_mode: requestedMode,
      effective_mode: effectiveMode,
      rows_before: rowsBefore,
      force_fresh_head_recovery: params.forceFreshHeadRecovery === true,
      resume_checkpoint_present: Boolean(resumeCheckpoint),
    })}`
  )

  return {
    run_id: params.runId,
    requested_mode: requestedMode,
    effective_mode: effectiveMode,
    trigger: 'smart_sync',
    rows_before: rowsBefore,
    resume_checkpoint: resumeCheckpoint
      ? buildResumeCheckpointSummary({
          pageToken: resumeCheckpoint.nextPageToken,
          pageIndex: resumeCheckpoint.pageIndex,
          processedMessages: resumeCheckpoint.processedMessages,
          processedAt: resumeCheckpoint.processedAt,
        })
      : null,
    started_from_checkpoint: Boolean(resumeCheckpoint),
  }
}

export async function primeAcceptedOperatorBackfillRunForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  runId: string
  maxMessages: number
  backfillWindowMonths?: GmailOperatorBackfillWindowMonths
  currentState?: GmailMailboxIndexState | null
}): Promise<GmailAcceptedMailboxIndexRun> {
  const tenantId = params.tenantId.trim()
  const currentState =
    params.currentState ??
    (await loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId,
    }))
  const rowsBefore = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId,
  })
  const resumeCheckpoint = buildOperatorBackfillResumeCheckpoint(currentState)
  const backfillWindowMonths = normalizeGmailOperatorBackfillWindowMonths(
    params.backfillWindowMonths
  )
  const campaignTarget = resolveOperatorBackfillCampaignTarget({
    state: currentState,
    requestedWindowMonths: backfillWindowMonths,
  })
  const requestedMode = 'full' as const
  const effectiveMode = 'full' as const
  const mailboxEstimatedTotal =
    currentState?.mailbox_estimated_total != null &&
    Number.isFinite(currentState.mailbox_estimated_total)
      ? Math.max(0, Math.round(currentState.mailbox_estimated_total))
      : null
  const run: GmailMailboxIndexRunContext = {
    runId: params.runId,
    trigger: 'operator_backfill',
    rowsBefore,
    requestedMode,
    backfillWindowMonths,
  }

  await markMailboxIndexRunStarted({
    supabase: params.supabase,
    tenantId,
    effectiveMode,
    trigger: 'operator_backfill',
    runId: params.runId,
    requestedMaxMessages: params.maxMessages,
    run,
    lastHistoryId: currentState?.last_history_id ?? null,
    mailboxEstimatedTotal,
    indexCompletionPct:
      currentState?.index_completion_pct != null &&
      Number.isFinite(currentState.index_completion_pct)
        ? currentState.index_completion_pct
        : null,
    activeProcessedMessages: 0,
    activeListPagesFetched: resumeCheckpoint?.pageIndex ?? 0,
    activeNextPageToken: resumeCheckpoint?.nextPageToken ?? null,
    activeLastPageIndex: resumeCheckpoint?.pageIndex ?? 0,
    activeLastProcessedAt: resumeCheckpoint?.processedAt ?? null,
    backfillResumeProcessedMessages: resumeCheckpoint?.processedMessages ?? 0,
    activeBackfillWindowMonths: campaignTarget.windowMonths,
    activeBackfillCutoffAt: campaignTarget.cutoffAt,
    startedFromCheckpoint: Boolean(resumeCheckpoint),
    yieldDetail:
      currentState?.active_yield_detail ??
      currentState?.last_yield_detail ??
      emptyMailboxIndexYieldDetail(),
  })

  console.info(
    `[integrations/gmail/mailbox-index/operator-backfill] ${JSON.stringify({
      event: 'accepted_run_primed',
      run_id: params.runId,
      trigger: 'operator_backfill',
      requested_mode: requestedMode,
      effective_mode: effectiveMode,
      message: resumeCheckpoint
        ? 'Resumed historical backfill from saved checkpoint'
        : 'Fresh historical backfill started',
      backfill_window_months: campaignTarget.windowMonths,
      backfill_cutoff_at: campaignTarget.cutoffAt,
      reused_persisted_cutoff: campaignTarget.reusedPersistedCutoff,
      rows_before: rowsBefore,
      resume_checkpoint_present: Boolean(resumeCheckpoint),
    })}`
  )

  return {
    run_id: params.runId,
    requested_mode: requestedMode,
    effective_mode: effectiveMode,
    trigger: 'operator_backfill',
    rows_before: rowsBefore,
    resume_checkpoint: buildResumeCheckpointSummary({
      pageToken: resumeCheckpoint?.nextPageToken ?? null,
      pageIndex: resumeCheckpoint?.pageIndex ?? null,
      processedMessages: resumeCheckpoint?.processedMessages ?? null,
      processedAt: resumeCheckpoint?.processedAt ?? null,
    }),
    started_from_checkpoint: Boolean(resumeCheckpoint),
    backfill_window_months: campaignTarget.windowMonths,
    backfill_cutoff_at: campaignTarget.cutoffAt,
  }
}

async function runFullMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  maxMessages: number
  logPrefix: string
  run: GmailMailboxIndexRunContext
  disableResumeCheckpoint?: boolean
  recentRecoveryWindowDays?: number | null
}): Promise<GmailMailboxIndexSyncResult> {
  const runStartedAt = Date.now()
  const phaseMs = {
    load_state_ms: 0,
    resolve_token_ms: 0,
    list_pages_ms: 0,
    metadata_fetch_ms: 0,
    upsert_ms: 0,
    count_indexed_ms: 0,
    sender_stats_recompute_ms: 0,
    upsert_state_ms: 0,
  }
  const loadStateStartedAt = Date.now()
  const priorState = await loadGmailMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.load_state_ms = Math.max(0, Date.now() - loadStateStartedAt)
  let mailboxEstimatedTotal =
    priorState?.mailbox_estimated_total != null && Number.isFinite(priorState.mailbox_estimated_total)
      ? Math.max(0, Math.round(priorState.mailbox_estimated_total))
      : null
  const activeFullRunOwnedByAnotherContext = Boolean(
    priorState &&
      priorState.active_effective_mode === 'full' &&
      isMailboxIndexRunActive(priorState) &&
      priorState.active_run_id &&
      priorState.active_run_id !== params.run.runId
  )
  if (activeFullRunOwnedByAnotherContext) {
    if (isManualFullRunActive(priorState) && params.run.trigger !== 'manual_full_reindex') {
      return mailboxIndexDeferredResult({
        run: params.run,
        currentState: priorState,
      })
    }
    return mailboxIndexFailureResult({
      effectiveMode: priorState?.active_effective_mode ?? 'full',
      run: params.run,
      reason: 'already_running',
      error: 'A mailbox index full scan is already in progress for this tenant.',
      terminalReason: 'already_running',
      gmailResultSizeEstimate: priorState?.last_gmail_result_size_estimate ?? null,
      listPagesFetched: priorState?.active_list_pages_fetched ?? priorState?.last_list_pages_fetched ?? null,
      processedMessages: priorState?.active_processed_messages ?? null,
      lastHistoryId: priorState?.last_history_id ?? null,
      usedFallbackFullScan: false,
      rowsAfter:
        priorState?.indexed_message_count != null && Number.isFinite(priorState.indexed_message_count)
          ? Math.max(0, Math.round(priorState.indexed_message_count))
          : params.run.rowsBefore,
    })
  }
  const recentRecoveryWindowDays =
    typeof params.recentRecoveryWindowDays === 'number' && params.recentRecoveryWindowDays > 0
      ? Math.max(1, Math.round(params.recentRecoveryWindowDays))
      : null
  const persistedRecoveryBoundaryAt = pendingRecoveryBridgeBoundary(priorState)
  const indexedRecoveryBoundaryAt =
    recentRecoveryWindowDays != null && !persistedRecoveryBoundaryAt
      ? await loadGmailFreshHeadRecoveryIndexedBoundaryForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          state: priorState,
        })
      : null
  const recoveryBridge =
    recentRecoveryWindowDays != null
      ? resolveGmailFreshHeadRecoveryBridge({
          nowMs: Date.now(),
          recentRecoveryWindowDays,
          indexedBoundaryAt: indexedRecoveryBoundaryAt,
          persistedBoundaryAt: persistedRecoveryBoundaryAt,
        })
      : null
  const recentRecoveryCutoffAtMs =
    recoveryBridge != null ? Date.parse(recoveryBridge.cutoff_at) : Number.NaN
  const recentRecoveryCutoffAt =
    Number.isFinite(recentRecoveryCutoffAtMs) ? new Date(recentRecoveryCutoffAtMs).toISOString() : null
  const resumeCheckpoint = params.disableResumeCheckpoint
    ? null
    : params.run.trigger === 'operator_backfill'
      ? buildOperatorBackfillResumeCheckpoint(priorState)
      : isResumeCapableFullTrigger(params.run.trigger)
        ? buildManualFullResumeCheckpoint(priorState, Date.now(), params.run.runId)
        : null
  const operatorBackfillWindowMonths =
    params.run.trigger === 'operator_backfill'
      ? normalizeGmailOperatorBackfillWindowMonths(
          params.run.backfillWindowMonths ?? GMAIL_OPERATOR_BACKFILL_DEFAULT_WINDOW_MONTHS
        )
      : null
  const operatorBackfillCampaignTarget =
    params.run.trigger === 'operator_backfill' && operatorBackfillWindowMonths != null
      ? resolveOperatorBackfillCampaignTarget({
          state: priorState,
          requestedWindowMonths: operatorBackfillWindowMonths,
        })
      : null
  if (isResumeCapableFullTrigger(params.run.trigger)) {
    logManualFullCheckpointEvent({
      event: resumeCheckpoint ? 'resume_checkpoint_selected' : 'resume_checkpoint_missing',
      run: params.run,
      checkpoint: resumeCheckpoint,
      activeCheckpoint: summarizeResumeCheckpoint({
        pageToken: priorState?.active_next_page_token,
        pageIndex: priorState?.active_last_page_index,
        processedMessages: priorState?.active_processed_messages,
        processedAt: priorState?.active_last_processed_at,
      }),
      lastResumeCheckpoint: summarizeResumeCheckpoint({
        pageToken: priorState?.last_resume_page_token,
        pageIndex: priorState?.last_resume_page_index,
        processedMessages: priorState?.last_processed_messages,
        processedAt: priorState?.last_resume_processed_at,
      }),
      reason: resumeCheckpoint ? null : 'no_usable_checkpoint_in_state',
    })
  }
  if (recentRecoveryWindowDays != null) {
    console.info(
      `${params.logPrefix} ${JSON.stringify({
        event: 'fresh_head_recovery_bridge_selected',
        run_id: params.run.runId,
        trigger: params.run.trigger,
        requested_mode: params.run.requestedMode,
        effective_mode: 'full',
        recent_recovery_window_days: recentRecoveryWindowDays,
        recent_recovery_cutoff_at: recentRecoveryCutoffAt,
        recovery_bridge_boundary_at: recoveryBridge?.boundary_at ?? null,
        recovery_bridge_source: recoveryBridge?.source ?? null,
        resume_checkpoint_present: Boolean(resumeCheckpoint),
      })}`
    )
  }
  const startedFromCheckpoint = Boolean(resumeCheckpoint)
  let yieldDetail =
    resumeCheckpoint?.source === 'stale_active'
      ? priorState?.active_yield_detail ?? emptyMailboxIndexYieldDetail()
      : resumeCheckpoint?.source === 'last_failed'
        ? priorState?.last_yield_detail ?? emptyMailboxIndexYieldDetail()
        : emptyMailboxIndexYieldDetail()
  if (recoveryBridge) {
    yieldDetail = {
      ...yieldDetail,
      recovery_bridge_status: 'pending',
      recovery_bridge_boundary_at: recoveryBridge.boundary_at,
      recovery_bridge_cutoff_at: recoveryBridge.cutoff_at,
    }
  }
  await markMailboxIndexRunStarted({
    supabase: params.supabase,
    tenantId: params.tenantId,
    effectiveMode: 'full',
    trigger: params.run.trigger,
    runId: params.run.runId,
    requestedMaxMessages: params.maxMessages,
    run: params.run,
    lastHistoryId: priorState?.last_history_id ?? null,
    mailboxEstimatedTotal,
    indexCompletionPct:
      priorState?.index_completion_pct != null && Number.isFinite(priorState.index_completion_pct)
        ? priorState.index_completion_pct
        : null,
    activeProcessedMessages:
      params.run.trigger === 'operator_backfill' ? 0 : resumeCheckpoint?.processedMessages ?? 0,
    activeListPagesFetched: resumeCheckpoint?.pageIndex ?? 0,
    activeNextPageToken: resumeCheckpoint?.nextPageToken ?? null,
    activeLastPageIndex: resumeCheckpoint?.pageIndex ?? 0,
    activeLastProcessedAt: resumeCheckpoint?.processedAt ?? null,
    backfillResumeProcessedMessages:
      params.run.trigger === 'operator_backfill' ? resumeCheckpoint?.processedMessages ?? 0 : null,
    activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
    activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
    startedFromCheckpoint,
    yieldDetail,
  })
  const maxMessages = clampGmailMailboxIndexMaxMessages(params.maxMessages)
  const historicalProcessedBaseline =
    params.run.trigger === 'operator_backfill' ? resumeCheckpoint?.processedMessages ?? 0 : 0
  const operatorBackfillCutoffAtMs =
    operatorBackfillCampaignTarget != null
      ? Date.parse(operatorBackfillCampaignTarget.cutoffAt)
      : Number.NaN
  let processed =
    params.run.trigger === 'operator_backfill' ||
    (params.run.trigger === 'smart_sync' && recoveryBridge)
      ? 0
      : resumeCheckpoint?.processedMessages ?? 0
  const resolveTokenStartedAt = Date.now()
  const token = await resolveGmailAccessTokenForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    logPrefix: params.logPrefix,
  })
  phaseMs.resolve_token_ms = Math.max(0, Date.now() - resolveTokenStartedAt)
  if (!token.ok) {
    const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'full',
      run: params.run,
      lastHistoryId: priorState?.last_history_id ?? null,
      mailboxEstimatedTotal,
      indexedMessageCount: params.run.rowsBefore,
      lastIndexDurationMs: durationMs,
      lastSyncStatus: mailboxIndexAuthFailureStatus('full'),
      lastSyncError: token.error,
      lastFailureReason: token.failureDetail || token.reason,
      terminalReason: 'auth_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: resumeCheckpoint?.pageIndex ?? 0,
      processedMessages: processed,
      backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
      activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
      activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
      upsertedMessages: 0,
      deletedMessages: 0,
      activeNextPageToken: resumeCheckpoint?.nextPageToken ?? null,
      activeLastPageIndex: resumeCheckpoint?.pageIndex ?? 0,
      activeLastProcessedAt: resumeCheckpoint?.processedAt ?? null,
      startedFromCheckpoint,
      yieldDetail,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'full',
      run: params.run,
      reason: token.reason,
      error: token.error,
      terminalReason: 'auth_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: resumeCheckpoint?.pageIndex ?? 0,
      processedMessages: processed,
      usedFallbackFullScan: false,
    })
  }

  let upserted = 0
  let pageToken: string | null = resumeCheckpoint?.nextPageToken ?? null
  let highestHistoryId: string | null = priorState?.last_history_id ?? null
  let metadataConcurrency = FULL_SCAN_METADATA_CONCURRENCY_DEFAULT
  let lastHeartbeatAtMs = Date.now()
  let lastGmailResultSizeEstimate: number | null = null
  let listPagesFetched = resumeCheckpoint?.pageIndex ?? 0
  let committedPageIndex = resumeCheckpoint?.pageIndex ?? 0
  let lastCommittedProcessedAt = resumeCheckpoint?.processedAt ?? null
  let stoppedOnEmptyPage = false
  let historicalWindowReached = false
  let recentRecoveryWindowReached = false
  let boundaryPageIndex: number | null = null
  let boundaryOldestInternalDate: string | null = null
  let shouldFetchNextPage =
    processed < maxMessages && (resumeCheckpoint ? resumeCheckpoint.nextPageToken !== null : true)

  while (shouldFetchNextPage) {
    const currentPageToken = pageToken
    const fetchedPageIndex = listPagesFetched + 1
    const listPageStartedAt = Date.now()
    const page = await listMailboxMessagesPage({
      accessToken: token.accessToken,
      pageToken: currentPageToken,
      maxResults: LIST_PAGE_SIZE,
    })
    phaseMs.list_pages_ms += Math.max(0, Date.now() - listPageStartedAt)
    if (!page.ok) {
      const indexedCount = await countIndexedMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
      await markMailboxIndexRunFailed({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'full',
        run: params.run,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        mailboxEstimatedTotal,
        indexedMessageCount: indexedCount,
        lastIndexDurationMs: durationMs,
        lastSyncStatus: isMailboxIndexAuthFailureReason(page.reason)
          ? mailboxIndexAuthFailureStatus('full')
          : mailboxIndexFailureStatus('full'),
        lastSyncError: page.error,
        lastFailureReason: page.reason,
        terminalReason: isMailboxIndexAuthFailureReason(page.reason) ? 'auth_failed' : 'gmail_list_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched: fetchedPageIndex,
        processedMessages: processed,
        backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
        activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
        activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
        upsertedMessages: upserted,
        deletedMessages: 0,
        activeNextPageToken: currentPageToken,
        activeLastPageIndex: committedPageIndex,
        activeLastProcessedAt: lastCommittedProcessedAt,
        startedFromCheckpoint,
        yieldDetail,
      })
      return mailboxIndexFailureResult({
        effectiveMode: 'full',
        run: params.run,
        reason: page.reason,
        error: page.error,
        terminalReason: isMailboxIndexAuthFailureReason(page.reason) ? 'auth_failed' : 'gmail_list_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched: fetchedPageIndex,
        processedMessages: processed,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        usedFallbackFullScan: false,
        rowsAfter: indexedCount,
      })
    }
    listPagesFetched = fetchedPageIndex

    if (typeof page.resultSizeEstimate === 'number') {
      lastGmailResultSizeEstimate = Math.max(0, Math.round(page.resultSizeEstimate))
      mailboxEstimatedTotal =
        mailboxEstimatedTotal == null
          ? lastGmailResultSizeEstimate
          : Math.max(mailboxEstimatedTotal, lastGmailResultSizeEstimate)
    }

    const remaining = maxMessages - processed
    const messageIds = page.messageIds.slice(0, Math.max(0, remaining))
    if (messageIds.length === 0) {
      yieldDetail = {
        ...yieldDetail,
        next_page_token_present: Boolean(page.nextPageToken),
      }
      stoppedOnEmptyPage = true
      pageToken = null
      shouldFetchNextPage = false
      break
    }

    const indexedAtIso = new Date().toISOString()
    const metadataRows: GmailMailboxIndexRow[] = []
    let metadataCursor = 0
    while (metadataCursor < messageIds.length) {
      const chunk = messageIds.slice(metadataCursor, metadataCursor + metadataConcurrency)
      metadataCursor += chunk.length
      const chunkStartedAt = Date.now()
      const responses = await Promise.all(
        chunk.map(async (messageId) => {
          const metadata = await fetchMessageMetadata({
            accessToken: token.accessToken,
            messageId,
          })
          return { messageId, metadata }
        })
      )

      const chunkDurationMs = Date.now() - chunkStartedAt
      phaseMs.metadata_fetch_ms += Math.max(0, chunkDurationMs)
      const hasRetryablePressure = responses.some(
        (item) =>
          (item.metadata.ok && item.metadata.metrics.had_retryable_signal) ||
          (!item.metadata.ok && isRetryableStatus(item.metadata.status))
      )
      if (
        metadataConcurrency > FULL_SCAN_METADATA_CONCURRENCY_DEGRADED &&
        (chunkDurationMs >= METADATA_BATCH_SLOW_MS || hasRetryablePressure)
      ) {
        metadataConcurrency = FULL_SCAN_METADATA_CONCURRENCY_DEGRADED
      }
      const failedItems = responses.filter(
        (item): item is { messageId: string; metadata: GmailMessageMetadataFailure } => !item.metadata.ok
      )
      const authFailure = failedItems.find((item) => isMetadataAuthOrScopeFailure(item.metadata))
      const failedMessageIdsSample = metadataFailureSample(failedItems.map((item) => item.messageId))
      let failureDetail: GmailMailboxIndexFailureDetail | null = null
      let terminalMetadataFailure: GmailMessageMetadataFailure | null = authFailure?.metadata ?? null

      if (authFailure) {
        failureDetail = buildMetadataFailureDetail({
          classification: authFailure.metadata.classification,
          status: authFailure.metadata.status,
          providerReason: authFailure.metadata.providerReason,
          providerMessage: authFailure.metadata.providerMessage,
          listPagesFetched,
          processedMessages: processed,
          pageToken: currentPageToken,
          metadataBatchSize: chunk.length,
          failedMessageIdsSample,
          retryAttempts: authFailure.metadata.attempts,
        })
        logManualFullMetadataEvent({
          event: 'metadata_recovery_failed',
          run: params.run,
          listPagesFetched,
          processedMessages: processed,
          pageToken: currentPageToken,
          metadataBatchSize: chunk.length,
          failedMessageIdsSample,
          status: authFailure.metadata.status,
          providerReason: authFailure.metadata.providerReason,
          providerMessage: authFailure.metadata.providerMessage,
          retryAttempt: authFailure.metadata.attempts,
        })
      } else {
        const nonNotFoundFailures = failedItems.filter((item) => item.metadata.classification !== 'not_found')
        if (nonNotFoundFailures.length > 0) {
          const recovery = await recoverFullScanMetadataFailures({
            accessToken: token.accessToken,
            run: params.run,
            listPagesFetched,
            processedMessages: processed,
            pageToken: currentPageToken,
            metadataBatchSize: chunk.length,
            failedItems: nonNotFoundFailures,
          })
          if (!recovery.ok) {
            failureDetail = recovery.detail
            terminalMetadataFailure = recovery.failure
          } else {
            const recoveredById = new Map(
              recovery.recoveredItems.map((item) => [item.messageId, item.metadata] as const)
            )
            for (const response of responses) {
              if (!response.metadata.ok && recoveredById.has(response.messageId)) {
                response.metadata = recoveredById.get(response.messageId) as GmailMessageMetadataResult
              }
            }
          }
        }
      }

      if (failureDetail) {
        const failedMetadata =
          terminalMetadataFailure ??
          failedItems.find((item) => item.metadata.classification !== 'not_found')?.metadata
        if (!failedMetadata || failedMetadata.ok) {
          throw new Error('Expected full-scan metadata failure detail to have a matching failure.')
        }
        const indexedCount = await countIndexedMessagesForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
        })
        const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
        const authLikeFailure = isMetadataAuthOrScopeFailure(failedMetadata)
        await markMailboxIndexRunFailed({
          supabase: params.supabase,
          tenantId: params.tenantId,
          effectiveMode: 'full',
          run: params.run,
          lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
          mailboxEstimatedTotal,
          indexedMessageCount: indexedCount,
          lastIndexDurationMs: durationMs,
          lastSyncStatus: authLikeFailure
            ? mailboxIndexAuthFailureStatus('full')
            : mailboxIndexFailureStatus('full'),
          lastSyncError: failedMetadata.error,
          lastFailureReason: failedMetadata.reason,
          lastFailureReasonDetail: failureDetail,
          terminalReason: authLikeFailure ? 'auth_failed' : 'gmail_metadata_failed',
          gmailResultSizeEstimate: lastGmailResultSizeEstimate,
          listPagesFetched,
          processedMessages: processed,
          backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
          activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
          activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
          upsertedMessages: upserted,
          deletedMessages: 0,
          activeNextPageToken: currentPageToken,
          activeLastPageIndex: committedPageIndex,
          activeLastProcessedAt: lastCommittedProcessedAt,
          startedFromCheckpoint,
          yieldDetail,
        })
        return mailboxIndexFailureResult({
          effectiveMode: 'full',
          run: params.run,
          reason: failedMetadata.reason,
          error: failedMetadata.error,
          terminalReason: authLikeFailure ? 'auth_failed' : 'gmail_metadata_failed',
          gmailResultSizeEstimate: lastGmailResultSizeEstimate,
          listPagesFetched,
          processedMessages: processed,
          lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
          usedFallbackFullScan: false,
          rowsAfter: indexedCount,
        })
      }

      for (const item of responses) {
        if (!item.metadata.ok) {
          if (item.metadata.classification === 'not_found') continue
          throw new Error('Expected full-scan metadata recovery to resolve non-404 failures before row mapping.')
        }
        const row = mapMetadataToIndexRow({
          tenantId: params.tenantId,
          messageId: item.messageId,
          metadata: item.metadata.metadata,
          indexedAtIso,
        })
        highestHistoryId = maxHistoryId(highestHistoryId, parseHistoryId(item.metadata.metadata.historyId))
        metadataRows.push(row)
      }

      if (metadataCursor < messageIds.length) {
        await sleep(
          hasRetryablePressure || chunkDurationMs >= METADATA_BATCH_SLOW_MS
            ? FULL_SCAN_METADATA_PRESSURE_DELAY_MS
            : FULL_SCAN_METADATA_BATCH_DELAY_MS
        )
      }
    }

    const existingRowsResult = await loadExistingMailboxIndexRowsByMessageId({
      supabase: params.supabase,
      tenantId: params.tenantId,
      messageIds: metadataRows.map((row) => row.message_id),
    })
    if (!existingRowsResult.ok) {
      const indexedCount = await countIndexedMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
      await markMailboxIndexRunFailed({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'full',
        run: params.run,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        mailboxEstimatedTotal,
        indexedMessageCount: indexedCount,
        lastIndexDurationMs: durationMs,
        lastSyncStatus: mailboxIndexFailureStatus('full'),
        lastSyncError: existingRowsResult.error,
        lastFailureReason: 'database_failed',
        terminalReason: 'database_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched,
        processedMessages: processed,
        backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
        activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
        activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
        upsertedMessages: upserted,
        deletedMessages: 0,
        activeNextPageToken: currentPageToken,
        activeLastPageIndex: committedPageIndex,
        activeLastProcessedAt: lastCommittedProcessedAt,
        startedFromCheckpoint,
        yieldDetail,
      })
      return mailboxIndexFailureResult({
        effectiveMode: 'full',
        run: params.run,
        reason: 'database_failed',
        error: existingRowsResult.error,
        terminalReason: 'database_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched,
        processedMessages: processed,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        usedFallbackFullScan: false,
        rowsAfter: indexedCount,
      })
    }

    const pageYieldDetail = classifyYieldForRows({
      rows: metadataRows,
      existingRowsByMessageId: existingRowsResult.rowsByMessageId,
      nextPageTokenPresent: Boolean(page.nextPageToken),
    })
    yieldDetail = mergeYieldDetail(yieldDetail, pageYieldDetail)
    logFullScanYieldPage({
      run: params.run,
      pageIndex: listPagesFetched,
      pageMessageCount: metadataRows.length,
      nextPageTokenPresent: Boolean(page.nextPageToken),
      pageYieldDetail,
      cumulativeYieldDetail: yieldDetail,
    })

    const upsertStartedAt = Date.now()
    const upsertResult = await upsertIndexRows({
      supabase: params.supabase,
      rows: metadataRows,
    })
    phaseMs.upsert_ms += Math.max(0, Date.now() - upsertStartedAt)
    if (!upsertResult.ok) {
      const indexedCount = await countIndexedMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
      await markMailboxIndexRunFailed({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'full',
        run: params.run,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        mailboxEstimatedTotal,
        indexedMessageCount: indexedCount,
        lastIndexDurationMs: durationMs,
        lastSyncStatus: mailboxIndexFailureStatus('full'),
        lastSyncError: upsertResult.error,
        lastFailureReason: 'database_failed',
        terminalReason: 'database_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched,
        processedMessages: processed,
        backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
        upsertedMessages: upserted,
        deletedMessages: 0,
        activeNextPageToken: currentPageToken,
        activeLastPageIndex: committedPageIndex,
        activeLastProcessedAt: lastCommittedProcessedAt,
        yieldDetail,
      })
      return mailboxIndexFailureResult({
        effectiveMode: 'full',
        run: params.run,
        reason: 'database_failed',
        error: upsertResult.error,
        terminalReason: 'database_failed',
        gmailResultSizeEstimate: lastGmailResultSizeEstimate,
        listPagesFetched,
        processedMessages: processed,
        lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
        usedFallbackFullScan: false,
        rowsAfter: indexedCount,
      })
    }

    processed += messageIds.length
    upserted += metadataRows.length
    committedPageIndex += 1
    const nextPageToken = page.nextPageToken ?? null
    pageToken = nextPageToken
    lastCommittedProcessedAt = new Date().toISOString()
    const committedIndexedCount = params.run.rowsBefore + yieldDetail.inserted_rows
    const shouldEmitHeartbeatLog = Date.now() - lastHeartbeatAtMs >= GMAIL_MAILBOX_INDEX_HEARTBEAT_INTERVAL_MS
    await markMailboxIndexRunHeartbeat({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'full',
      run: params.run,
      lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
      mailboxEstimatedTotal,
      indexCompletionPct: computeIndexCompletionPct({
        indexedMessageCount: committedIndexedCount,
        mailboxEstimatedTotal,
      }),
      indexedMessageCount: committedIndexedCount,
      processedMessages: processed,
      backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
      activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
      activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
      upsertedMessages: upserted,
      deletedMessages: 0,
      listPagesFetched,
      activeNextPageToken: pageToken,
      activeLastPageIndex: committedPageIndex,
      activeLastProcessedAt: lastCommittedProcessedAt,
      yieldDetail,
      emitManualFullLog: shouldEmitHeartbeatLog,
    })
    const oldestPageInternalDate = findOldestInternalDateIso(metadataRows)
    if (
      params.run.trigger === 'operator_backfill' &&
      operatorBackfillCampaignTarget != null &&
      Number.isFinite(operatorBackfillCutoffAtMs) &&
      oldestPageInternalDate
    ) {
      const oldestPageInternalDateMs = Date.parse(oldestPageInternalDate)
      if (Number.isFinite(oldestPageInternalDateMs) && oldestPageInternalDateMs <= operatorBackfillCutoffAtMs) {
        historicalWindowReached = true
        boundaryPageIndex = committedPageIndex
        boundaryOldestInternalDate = oldestPageInternalDate
        console.info(
          `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
            event: 'historical_boundary_reached',
            run_id: params.run.runId,
            trigger: params.run.trigger,
            backfill_window_months: operatorBackfillCampaignTarget.windowMonths,
            cutoff_at: operatorBackfillCampaignTarget.cutoffAt,
            boundary_page_index: boundaryPageIndex,
            boundary_oldest_internal_date: boundaryOldestInternalDate,
          })}`
        )
      }
    }
    if (Number.isFinite(recentRecoveryCutoffAtMs) && oldestPageInternalDate) {
      const oldestPageInternalDateMs = Date.parse(oldestPageInternalDate)
      if (
        Number.isFinite(oldestPageInternalDateMs) &&
        oldestPageInternalDateMs <= recentRecoveryCutoffAtMs
      ) {
        recentRecoveryWindowReached = true
        boundaryPageIndex = committedPageIndex
        boundaryOldestInternalDate = oldestPageInternalDate
        console.info(
          `${params.logPrefix} ${JSON.stringify({
            event: 'recent_recovery_boundary_reached',
            run_id: params.run.runId,
            trigger: params.run.trigger,
            recent_recovery_window_days: recentRecoveryWindowDays,
            recent_recovery_cutoff_at: recentRecoveryCutoffAt,
            boundary_page_index: boundaryPageIndex,
            boundary_oldest_internal_date: boundaryOldestInternalDate,
          })}`
        )
      }
    }
    if (shouldEmitHeartbeatLog) {
      lastHeartbeatAtMs = Date.now()
    }
    shouldFetchNextPage =
      !historicalWindowReached &&
      !recentRecoveryWindowReached &&
      pageToken !== null &&
      processed < maxMessages
  }

  const countIndexedStartedAt = Date.now()
  const indexedCount = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.count_indexed_ms = Math.max(0, Date.now() - countIndexedStartedAt)
  const recoveryBridgeOutcome = resolveGmailRecoveryBridgeOutcome({
    bridgeActive: Boolean(recoveryBridge),
    boundaryReached: recentRecoveryWindowReached,
    stoppedOnEmptyPage,
    nextPageTokenPresent: pageToken !== null,
    processedMessages: processed,
    maxMessages,
  })
  const recoveryBridgeYielded = recoveryBridgeOutcome === 'yielded'
  const senderStatsStartedAt = Date.now()
  const senderStatsResult = recoveryBridgeYielded
    ? ({ ok: true } as const)
    : await recomputeSenderStatsForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
  phaseMs.sender_stats_recompute_ms = recoveryBridgeYielded
    ? 0
    : Math.max(0, Date.now() - senderStatsStartedAt)
  if (!senderStatsResult.ok) {
    const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'full',
      run: params.run,
      lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
      mailboxEstimatedTotal,
      indexedMessageCount: indexedCount,
      lastIndexDurationMs: durationMs,
      lastSyncStatus: mailboxIndexFailureStatus('full'),
      lastSyncError: senderStatsResult.error,
      lastFailureReason: 'database_failed',
      terminalReason: 'sender_stats_failed',
      gmailResultSizeEstimate: lastGmailResultSizeEstimate,
      listPagesFetched,
      processedMessages: processed,
      backfillResumeProcessedMessages: historicalProcessedBaseline + processed,
      activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
      activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
      upsertedMessages: upserted,
      deletedMessages: 0,
      activeNextPageToken: pageToken,
      activeLastPageIndex: committedPageIndex,
      activeLastProcessedAt: lastCommittedProcessedAt,
      startedFromCheckpoint,
      yieldDetail,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'full',
      run: params.run,
      reason: 'database_failed',
      error: senderStatsResult.error,
      terminalReason: 'sender_stats_failed',
      gmailResultSizeEstimate: lastGmailResultSizeEstimate,
      listPagesFetched,
      processedMessages: processed,
      lastHistoryId: recoveryBridge ? priorState?.last_history_id ?? null : highestHistoryId,
      usedFallbackFullScan: false,
      rowsAfter: indexedCount,
    })
  }

  const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
  const recoveryBridgeCompleted = recoveryBridgeOutcome === 'completed'
  const terminalReason: GmailMailboxIndexTerminalReason = historicalWindowReached
    ? 'historical_window_reached'
    : recoveryBridgeCompleted
      ? 'recovery_bridge_completed'
      : recoveryBridgeYielded
        ? 'recovery_bridge_yielded'
        : recentRecoveryWindowReached
          ? 'recent_window_reached'
      : stoppedOnEmptyPage
        ? 'empty_page'
        : processed >= maxMessages && pageToken !== null
          ? 'requested_limit_reached'
          : 'gmail_pagination_exhausted'
  yieldDetail = recoveryBridge
    ? recoveryBridgeYieldDetail(
        yieldDetail,
        recoveryBridgeCompleted ? 'completed' : recoveryBridgeYielded ? 'pending' : 'failed'
      ) ?? yieldDetail
    : yieldDetail
  const backfillCampaignCompleted =
    params.run.trigger === 'operator_backfill' &&
    (terminalReason === 'historical_window_reached' ||
      terminalReason === 'gmail_pagination_exhausted' ||
      terminalReason === 'empty_page')
  const upsertStateStartedAt = Date.now()
  await markMailboxIndexRunCompleted({
    supabase: params.supabase,
    tenantId: params.tenantId,
    effectiveMode: 'full',
    run: params.run,
    lastHistoryId: recoveryBridgeYielded
      ? priorState?.last_history_id ?? null
      : highestHistoryId,
    mailboxEstimatedTotal,
    indexedMessageCount: indexedCount,
    lastIndexDurationMs: durationMs,
    terminalReason,
    gmailResultSizeEstimate: lastGmailResultSizeEstimate,
    listPagesFetched,
    processedMessages: processed,
    upsertedMessages: upserted,
    deletedMessages: 0,
    yieldDetail,
    startedFromCheckpoint,
    continuityComplete: !recoveryBridgeYielded,
    clearResumeCheckpoint:
      params.run.trigger === 'operator_backfill'
        ? false
        : !recoveryBridgeYielded && terminalReason !== 'requested_limit_reached',
    clearActiveBackfillCampaign: backfillCampaignCompleted,
    activeBackfillWindowMonths: operatorBackfillCampaignTarget?.windowMonths ?? null,
    activeBackfillCutoffAt: operatorBackfillCampaignTarget?.cutoffAt ?? null,
    backfillCompletedWindowMonths: backfillCampaignCompleted
      ? operatorBackfillCampaignTarget?.windowMonths ?? null
      : undefined,
    backfillCompletedCutoffAt: backfillCampaignCompleted
      ? operatorBackfillCampaignTarget?.cutoffAt ?? null
      : undefined,
    backfillCompletedAt: backfillCampaignCompleted ? new Date().toISOString() : undefined,
  })
  phaseMs.upsert_state_ms = Math.max(0, Date.now() - upsertStateStartedAt)
  clearIndexedRowsCacheForTenant(params.tenantId)

  console.info(
    `${params.logPrefix} ${JSON.stringify({
      event: recoveryBridgeYielded ? 'recovery_bridge_yielded' : 'completed',
      mode: 'full',
      requested_mode: params.run.requestedMode,
      effective_mode: 'full',
      run_id: params.run.runId,
      trigger: params.run.trigger,
      terminal_reason: terminalReason,
      backfill_window_months: operatorBackfillCampaignTarget?.windowMonths ?? null,
      backfill_cutoff_at: operatorBackfillCampaignTarget?.cutoffAt ?? null,
      boundary_page_index: boundaryPageIndex,
      boundary_oldest_internal_date: boundaryOldestInternalDate,
      gmail_result_size_estimate: lastGmailResultSizeEstimate,
      list_pages_fetched: listPagesFetched,
      rows_before: params.run.rowsBefore,
      rows_after: indexedCount,
      growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, indexedCount),
      processed_messages: processed,
      upserted_messages: upserted,
      indexed_message_count: indexedCount,
      yield_detail: yieldDetail,
      timings_ms: phaseMs,
      duration_ms: durationMs,
    })}`
  )
  if (isResumeCapableFullTrigger(params.run.trigger)) {
    console.info(
      `${operatorFullLogPrefix(params.run.trigger)} ${JSON.stringify({
        event: recoveryBridgeYielded ? 'recovery_bridge_yielded' : 'completed',
        run_id: params.run.runId,
        trigger: params.run.trigger,
        requested_mode: params.run.requestedMode,
        effective_mode: 'full',
        backfill_window_months: operatorBackfillCampaignTarget?.windowMonths ?? null,
        backfill_cutoff_at: operatorBackfillCampaignTarget?.cutoffAt ?? null,
        rows_before: params.run.rowsBefore,
        rows_after: indexedCount,
        growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, indexedCount),
        list_pages_fetched: listPagesFetched,
        processed_messages: processed,
        indexed_message_count: indexedCount,
        yield_detail: yieldDetail,
        terminal_reason: terminalReason,
        boundary_page_index: boundaryPageIndex,
        boundary_oldest_internal_date: boundaryOldestInternalDate,
      })}`
    )
  }

  if (recoveryBridgeYielded) {
    return mailboxIndexRecoveryBridgeYieldedResult({
      run: params.run,
      processedMessages: processed,
      upsertedMessages: upserted,
      indexedMessageCount: indexedCount,
      gmailResultSizeEstimate: lastGmailResultSizeEstimate,
      listPagesFetched,
      lastHistoryId: priorState?.last_history_id ?? null,
    })
  }

  return mailboxIndexSuccessResult({
    effectiveMode: 'full',
    run: params.run,
    terminalReason,
    gmailResultSizeEstimate: lastGmailResultSizeEstimate,
    listPagesFetched,
    processedMessages: processed,
    upsertedMessages: upserted,
    deletedMessages: 0,
    indexedMessageCount: indexedCount,
    lastHistoryId: highestHistoryId,
    usedFallbackFullScan: false,
  })
}

function collectHistoryMessageIds(
  historyItem: NonNullable<GmailHistoryListResponse['history']>[number],
  changed: Set<string>,
  deleted: Set<string>,
  changeMap?: Map<string, GmailHistoryMessageChange>
) {
  const recordChange = (
    messageId: string,
    mutate?: (change: GmailHistoryMessageChange) => void
  ) => {
    if (!changeMap) return
    const current = changeMap.get(messageId) ?? {
      added: false,
      labelsChanged: false,
    }
    if (mutate) mutate(current)
    changeMap.set(messageId, current)
  }

  const collect = (
    list: unknown,
    out: Set<string>,
    mutate?: (change: GmailHistoryMessageChange) => void
  ) => {
    if (!Array.isArray(list)) return
    for (const entry of list) {
      if (!isRecord(entry)) continue
      const message = isRecord(entry.message) ? entry.message : entry
      const id = typeof message.id === 'string' ? message.id.trim() : ''
      if (!id) continue
      out.add(id)
      if (out === changed) {
        recordChange(id, mutate)
      }
    }
  }

  collect(historyItem.messages, changed)
  collect(historyItem.messagesAdded, changed, (change) => {
    change.added = true
  })
  collect(historyItem.labelsAdded, changed, (change) => {
    change.labelsChanged = true
  })
  collect(historyItem.labelsRemoved, changed, (change) => {
    change.labelsChanged = true
  })
  collect(historyItem.messagesDeleted, deleted)
}

async function listHistoryPage(params: {
  accessToken: string
  startHistoryId: string
  pageToken?: string | null
}): Promise<
  | { ok: true; payload: GmailHistoryListResponse }
  | GmailHistoryListFailure
> {
  const url = new URL(GMAIL_HISTORY_ENDPOINT)
  url.searchParams.set('startHistoryId', params.startHistoryId)
  url.searchParams.set('maxResults', String(LIST_PAGE_SIZE))
  url.searchParams.append('historyTypes', 'messageAdded')
  url.searchParams.append('historyTypes', 'messageDeleted')
  url.searchParams.append('historyTypes', 'labelAdded')
  url.searchParams.append('historyTypes', 'labelRemoved')
  if (params.pageToken) url.searchParams.set('pageToken', params.pageToken)

  let response: Response
  let attempts: number | null = null
  let hadRetryableSignal = false
  try {
    const fetchResult = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${params.accessToken}` },
      cache: 'no-store',
    })
    response = fetchResult.response
    attempts = fetchResult.attempts
    hadRetryableSignal = fetchResult.hadRetryableSignal
  } catch (error) {
    attempts = error instanceof FetchWithRetryError ? error.attempts : null
    hadRetryableSignal = error instanceof FetchWithRetryError ? error.hadRetryableSignal : false
    const failureDetail = buildHistoryFailureDetail({
      classification: 'retryable_api',
      status: 502,
      providerReason: null,
      providerMessage: null,
      startHistoryId: params.startHistoryId,
      pageToken: params.pageToken ?? null,
      retryAttempts: attempts,
    })
    return {
      ok: false,
      status: 502,
      reason: 'gmail_api_failed',
      error: 'Failed to list Gmail history changes.',
      providerReason: null,
      providerMessage: null,
      retryable: true,
      attempts,
      classification: 'retryable_api',
      failureDetail,
    }
  }
  const payload = (await response
    .json()
    .catch(() => null)) as GmailHistoryListResponse | null
  const { providerReason, providerMessage } = extractGmailApiErrorDetails(payload)
  const classification = classifyHistoryFailure({
    status: response.status,
    payload,
    providerReason,
    providerMessage,
    hadRetryableSignal,
  })

  if (!response.ok || !payload) {
    let reason: GmailMailboxIndexFailureReason = 'gmail_api_failed'
    let error = 'Failed to list Gmail history changes.'
    if (classification === 'history_out_of_date') {
      reason = 'history_out_of_date'
      error = 'Gmail historyId is too old and requires full re-index.'
    } else if (classification === 'insufficient_scope') {
      reason = 'insufficient_scope'
      error = 'Connected Gmail token is missing inbox-read scope.'
    } else if (classification === 'auth') {
      error = providerMessage
        ? `Reconnect Gmail to continue syncing mailbox history. ${providerMessage}`
        : 'Reconnect Gmail to continue syncing mailbox history.'
    } else if (classification === 'invalid_history_request') {
      error = providerMessage
        ? `Gmail rejected the mailbox history request. ${providerMessage}`
        : 'Gmail rejected the mailbox history request.'
    }
    const failureDetail = buildHistoryFailureDetail({
      classification,
      status: response.status,
      providerReason,
      providerMessage,
      startHistoryId: params.startHistoryId,
      pageToken: params.pageToken ?? null,
      retryAttempts: attempts,
    })
    return {
      ok: false,
      status: response.status,
      reason,
      error,
      providerReason,
      providerMessage,
      retryable: classification === 'retryable_api',
      attempts,
      classification,
      failureDetail,
    }
  }
  return { ok: true, payload }
}

function shouldFetchIncrementalMetadata(params: {
  messageId: string
  existingRowsByMessageId: Map<string, GmailMailboxIndexComparableRow>
  changeMap: Map<string, GmailHistoryMessageChange>
}): boolean {
  const existingRow = params.existingRowsByMessageId.get(params.messageId)
  if (!existingRow) return true
  const change = params.changeMap.get(params.messageId)
  return Boolean(change?.added || change?.labelsChanged)
}

async function runSmartSyncBoundedScanForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  maxMessages: number
  logPrefix: string
  run: GmailMailboxIndexRunContext
  reason:
    | 'missing_history_state'
    | 'incremental_history_out_of_date'
    | 'incremental_history_listing_failed'
}): Promise<GmailMailboxIndexSyncResult> {
  const boundedMaxMessages = Math.min(
    clampGmailMailboxIndexMaxMessages(params.maxMessages),
    SMART_SYNC_BOUNDED_SCAN_MAX_MESSAGES
  )
  console.info(
    `${params.logPrefix} ${JSON.stringify({
      event: 'smart_sync_bounded_scan_selected',
      run_id: params.run.runId,
      trigger: params.run.trigger,
      requested_mode: params.run.requestedMode,
      effective_mode: 'full',
      reason: params.reason,
      max_messages: boundedMaxMessages,
    })}`
  )
  return runFullMailboxIndexForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    maxMessages: boundedMaxMessages,
    logPrefix: `${params.logPrefix}:smart-sync-bounded`,
    run: params.run,
  })
}

async function runIncrementalMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  allowFullRescanOnHistoryGap: boolean
  boundedHistoryGapMaxMessages?: number | null
  maxMessages: number
  logPrefix: string
  run: GmailMailboxIndexRunContext
}): Promise<GmailMailboxIndexSyncResult> {
  const runStartedAt = Date.now()
  const phaseMs = {
    load_state_ms: 0,
    resolve_token_ms: 0,
    history_list_ms: 0,
    metadata_fetch_ms: 0,
    upsert_ms: 0,
    delete_ms: 0,
    count_indexed_ms: 0,
    sender_stats_recompute_ms: 0,
    upsert_state_ms: 0,
    recovery_scan_ms: 0,
  }
  const loadStateStartedAt = Date.now()
  const state = await loadGmailMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.load_state_ms = Math.max(0, Date.now() - loadStateStartedAt)
  const mailboxEstimatedTotal =
    state?.mailbox_estimated_total != null && Number.isFinite(state.mailbox_estimated_total)
      ? Math.max(0, Math.round(state.mailbox_estimated_total))
      : null
  await markMailboxIndexRunStarted({
    supabase: params.supabase,
    tenantId: params.tenantId,
    effectiveMode: 'incremental',
    trigger: params.run.trigger,
    runId: params.run.runId,
    requestedMaxMessages: params.maxMessages,
    run: params.run,
    lastHistoryId: state?.last_history_id ?? null,
    mailboxEstimatedTotal,
    indexCompletionPct:
      state?.index_completion_pct != null && Number.isFinite(state.index_completion_pct)
        ? state.index_completion_pct
        : null,
  })
  const startHistoryId =
    state?.last_history_id && state.last_history_id.trim() ? state.last_history_id.trim() : ''
  const boundedHistoryGapMaxMessages =
    typeof params.boundedHistoryGapMaxMessages === 'number' && params.boundedHistoryGapMaxMessages > 0
      ? Math.min(
          clampGmailMailboxIndexMaxMessages(params.boundedHistoryGapMaxMessages),
          SMART_SYNC_BOUNDED_SCAN_MAX_MESSAGES
        )
      : null

  if (!startHistoryId) {
    if (boundedHistoryGapMaxMessages != null) {
      return runSmartSyncBoundedScanForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        maxMessages: boundedHistoryGapMaxMessages,
        logPrefix: params.logPrefix,
        run: params.run,
        reason: 'missing_history_state',
      })
    }
    if (!params.allowFullRescanOnHistoryGap) {
      const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
      await markMailboxIndexRunFailed({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'incremental',
        run: params.run,
        lastHistoryId: null,
        mailboxEstimatedTotal,
        indexedMessageCount: params.run.rowsBefore,
        lastIndexDurationMs: durationMs,
        lastSyncStatus: mailboxIndexFailureStatus('incremental'),
        lastSyncError: 'No history checkpoint found for incremental sync.',
        lastFailureReason: 'missing_history_state',
        terminalReason: 'missing_history_state',
        gmailResultSizeEstimate: null,
        listPagesFetched: null,
        processedMessages: 0,
        upsertedMessages: 0,
        deletedMessages: 0,
      })
      return mailboxIndexFailureResult({
        effectiveMode: 'incremental',
        run: params.run,
        reason: 'missing_history_state',
        error: 'No history checkpoint found for incremental sync.',
        terminalReason: 'missing_history_state',
        gmailResultSizeEstimate: null,
        listPagesFetched: null,
        usedFallbackFullScan: false,
      })
    }
    const recoveryState = await loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    if (isManualFullRunActive(recoveryState)) {
      return mailboxIndexDeferredResult({
        run: params.run,
        currentState: recoveryState,
      })
    }
    const full = await runFullMailboxIndexForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      maxMessages: params.maxMessages,
      logPrefix: params.logPrefix,
      run: params.run,
    })
    return full
  }

  const resolveTokenStartedAt = Date.now()
  const token = await resolveGmailAccessTokenForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    logPrefix: params.logPrefix,
  })
  phaseMs.resolve_token_ms = Math.max(0, Date.now() - resolveTokenStartedAt)
  if (!token.ok) {
    const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'incremental',
      run: params.run,
      lastHistoryId: startHistoryId,
      mailboxEstimatedTotal,
      indexedMessageCount: params.run.rowsBefore,
      lastIndexDurationMs: durationMs,
      lastSyncStatus: mailboxIndexAuthFailureStatus('incremental'),
      lastSyncError: token.error,
      lastFailureReason: token.failureDetail || token.reason,
      terminalReason: 'auth_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      processedMessages: 0,
      upsertedMessages: 0,
      deletedMessages: 0,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'incremental',
      run: params.run,
      reason: token.reason,
      error: token.error,
      terminalReason: 'auth_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      lastHistoryId: startHistoryId,
      usedFallbackFullScan: false,
    })
  }

  const changedIds = new Set<string>()
  const changedMessageMap = new Map<string, GmailHistoryMessageChange>()
  const deletedIds = new Set<string>()
  let pageToken: string | null = null
  let latestHistoryId: string | null = startHistoryId
  let metadataConcurrency = METADATA_CONCURRENCY_DEFAULT
  let lastHeartbeatAtMs = Date.now()

  do {
    const historyPageStartedAt = Date.now()
    const page = await listHistoryPage({
      accessToken: token.accessToken,
      startHistoryId,
      pageToken,
    })
    phaseMs.history_list_ms += Math.max(0, Date.now() - historyPageStartedAt)
    if (!page.ok) {
      const authLikeHistoryFailure =
        page.classification === 'auth' || page.reason === 'insufficient_scope'
      const failedToListHistory = page.reason === 'gmail_api_failed' && page.error.toLowerCase().includes('history')
      const canRunHistoryRecoveryScan = (() => {
        if (!params.allowFullRescanOnHistoryGap) return false
        if (authLikeHistoryFailure) return false
        if (page.reason !== 'history_out_of_date' && !failedToListHistory) return false
        const lastFullScanMs =
          typeof state?.last_full_scan_at === 'string' && state.last_full_scan_at.trim()
            ? Date.parse(state.last_full_scan_at)
            : Number.NaN
        if (!Number.isFinite(lastFullScanMs)) return true
        return Date.now() - lastFullScanMs > HISTORY_RECOVERY_FULL_SCAN_COOLDOWN_MS
      })()
      const canRunBoundedRecoveryScan = (() => {
        if (!params.allowFullRescanOnHistoryGap || !failedToListHistory) return false
        if (authLikeHistoryFailure) return false
        const lastIncrementalMs =
          typeof state?.last_incremental_sync_at === 'string' && state.last_incremental_sync_at.trim()
            ? Date.parse(state.last_incremental_sync_at)
            : Number.NaN
        if (!Number.isFinite(lastIncrementalMs)) return true
        return Date.now() - lastIncrementalMs > HISTORY_RECOVERY_PARTIAL_SCAN_COOLDOWN_MS
      })()

      console.warn(
        `${params.logPrefix} ${JSON.stringify({
          event: 'history_list_failed',
          run_id: params.run.runId,
          trigger: params.run.trigger,
          requested_mode: params.run.requestedMode,
          effective_mode: 'incremental',
          reason: page.reason,
          classification: page.classification,
          status: page.status,
          provider_reason: page.providerReason,
          provider_message: page.providerMessage,
          retryable: page.retryable,
          attempts: page.attempts,
          start_history_id: startHistoryId,
          page_token: pageToken,
          bounded_recovery_candidate:
            boundedHistoryGapMaxMessages != null && !authLikeHistoryFailure,
        })}`
      )

      if (boundedHistoryGapMaxMessages != null && !authLikeHistoryFailure) {
        return runSmartSyncBoundedScanForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          maxMessages: boundedHistoryGapMaxMessages,
          logPrefix: params.logPrefix,
          run: params.run,
          reason:
            page.reason === 'history_out_of_date'
              ? 'incremental_history_out_of_date'
              : 'incremental_history_listing_failed',
        })
      }

      if (canRunHistoryRecoveryScan) {
        const recoveryState = await loadGmailMailboxIndexState({
          supabase: params.supabase,
          tenantId: params.tenantId,
        })
        if (isManualFullRunActive(recoveryState)) {
          return mailboxIndexDeferredResult({
            run: params.run,
            currentState: recoveryState,
          })
        }
        const recoveryStartedAt = Date.now()
        const full = await runFullMailboxIndexForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          maxMessages: params.maxMessages,
          logPrefix: params.logPrefix,
          run: params.run,
        })
        phaseMs.recovery_scan_ms = Math.max(0, Date.now() - recoveryStartedAt)
        return full
      }
      if (canRunBoundedRecoveryScan) {
        const recoveryState = await loadGmailMailboxIndexState({
          supabase: params.supabase,
          tenantId: params.tenantId,
        })
        if (isManualFullRunActive(recoveryState)) {
          return mailboxIndexDeferredResult({
            run: params.run,
            currentState: recoveryState,
          })
        }
        const recoveryStartedAt = Date.now()
        const partialRecovery = await runFullMailboxIndexForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          maxMessages: Math.min(clampGmailMailboxIndexMaxMessages(params.maxMessages), 10_000),
          logPrefix: `${params.logPrefix}:history-recovery`,
          run: params.run,
        })
        phaseMs.recovery_scan_ms = Math.max(0, Date.now() - recoveryStartedAt)
        if (partialRecovery.ok) {
          return partialRecovery
        }
      }
      const failedHistoryMessage = failedToListHistory
        ? 'Failed to list Gmail history changes. Cached indexed rows remain usable, but no explicit full mailbox reindex completed.'
        : authLikeHistoryFailure
          ? page.error
        : page.error
      const indexedCount = await countIndexedMessagesForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
      })
      const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
      await markMailboxIndexRunFailed({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'incremental',
        run: params.run,
        lastHistoryId: startHistoryId,
        mailboxEstimatedTotal,
        indexedMessageCount: indexedCount,
        lastIndexDurationMs: durationMs,
        lastSyncStatus:
          authLikeHistoryFailure || isMailboxIndexAuthFailureReason(page.reason)
            ? mailboxIndexAuthFailureStatus('incremental')
            : page.reason === 'history_out_of_date'
            ? 'incremental_history_out_of_date'
            : failedToListHistory
              ? 'incremental_history_listing_failed'
              : mailboxIndexFailureStatus('incremental'),
        lastSyncError: failedHistoryMessage,
        lastFailureReason: page.reason,
        lastFailureReasonDetail: page.failureDetail,
        terminalReason: isMailboxIndexAuthFailureReason(page.reason)
          || authLikeHistoryFailure
          ? 'auth_failed'
          : page.reason === 'history_out_of_date'
            ? 'incremental_history_out_of_date'
            : 'incremental_history_listing_failed',
        gmailResultSizeEstimate: null,
        listPagesFetched: null,
        processedMessages: 0,
        upsertedMessages: 0,
        deletedMessages: 0,
      })
      phaseMs.upsert_state_ms = Math.max(0, Date.now() - runStartedAt) - (
        phaseMs.load_state_ms +
        phaseMs.resolve_token_ms +
        phaseMs.history_list_ms +
        phaseMs.recovery_scan_ms
      )
      console.info(
        `${params.logPrefix} ${JSON.stringify({
          mode: 'incremental',
          ok: false,
          reason: page.reason,
          timings_ms: phaseMs,
          duration_ms: Math.max(0, Date.now() - runStartedAt),
        })}`
      )
      return mailboxIndexFailureResult({
        effectiveMode: 'incremental',
        run: params.run,
        reason: page.reason,
        error: failedHistoryMessage,
        terminalReason: isMailboxIndexAuthFailureReason(page.reason) || authLikeHistoryFailure
          ? 'auth_failed'
          : page.reason === 'history_out_of_date'
            ? 'incremental_history_out_of_date'
            : 'incremental_history_listing_failed',
        gmailResultSizeEstimate: null,
        listPagesFetched: null,
        lastHistoryId: startHistoryId,
        usedFallbackFullScan: false,
        rowsAfter: indexedCount,
      })
    }

    const payload = page.payload
    latestHistoryId = maxHistoryId(latestHistoryId, parseHistoryId(payload.historyId))
    for (const historyItem of payload.history || []) {
      collectHistoryMessageIds(historyItem, changedIds, deletedIds, changedMessageMap)
      latestHistoryId = maxHistoryId(latestHistoryId, parseHistoryId(historyItem.id))
    }

    pageToken =
      typeof payload.nextPageToken === 'string' && payload.nextPageToken.trim()
        ? payload.nextPageToken.trim()
        : null
    if (Date.now() - lastHeartbeatAtMs >= GMAIL_MAILBOX_INDEX_HEARTBEAT_INTERVAL_MS) {
      await markMailboxIndexRunHeartbeat({
        supabase: params.supabase,
        tenantId: params.tenantId,
        effectiveMode: 'incremental',
        run: params.run,
        lastHistoryId: latestHistoryId,
        mailboxEstimatedTotal,
        indexCompletionPct: computeIndexCompletionPct({
          indexedMessageCount: params.run.rowsBefore,
          mailboxEstimatedTotal,
        }),
        indexedMessageCount: params.run.rowsBefore,
        processedMessages: changedIds.size,
        upsertedMessages: 0,
        deletedMessages: deletedIds.size,
        listPagesFetched: null,
      })
      lastHeartbeatAtMs = Date.now()
    }
  } while (pageToken)

  for (const deletedId of deletedIds) {
    changedIds.delete(deletedId)
    changedMessageMap.delete(deletedId)
  }

  const changedList = Array.from(changedIds)
  const trackedMessageIds = Array.from(new Set([...changedList, ...Array.from(deletedIds)]))
  const existingRowsResult = await loadExistingMailboxIndexRowsByMessageId({
    supabase: params.supabase,
    tenantId: params.tenantId,
    messageIds: trackedMessageIds,
  })
  if (!existingRowsResult.ok) {
    const indexedCount = await countIndexedMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'incremental',
      run: params.run,
      lastHistoryId: latestHistoryId || startHistoryId,
      mailboxEstimatedTotal,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      indexedMessageCount: indexedCount,
      lastSyncStatus: mailboxIndexFailureStatus('incremental'),
      lastSyncError: existingRowsResult.error,
      lastFailureReason: 'database_failed',
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      processedMessages: changedList.length,
      upsertedMessages: 0,
      deletedMessages: deletedIds.size,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'incremental',
      run: params.run,
      reason: 'database_failed',
      error: existingRowsResult.error,
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      lastHistoryId: latestHistoryId || startHistoryId,
      usedFallbackFullScan: false,
      rowsAfter: indexedCount,
    })
  }
  const metadataFetchList = changedList.filter((messageId) =>
    shouldFetchIncrementalMetadata({
      messageId,
      existingRowsByMessageId: existingRowsResult.rowsByMessageId,
      changeMap: changedMessageMap,
    })
  )
  const nowIso = new Date().toISOString()
  const metadataRows: GmailMailboxIndexRow[] = []
  let upserted = 0
  let metadataFailureCount = 0
  const metadataFailureSamples: string[] = []
  const skippedMetadataFetches = Math.max(0, changedList.length - metadataFetchList.length)

  let metadataCursor = 0
  while (metadataCursor < metadataFetchList.length) {
    const chunk = metadataFetchList.slice(metadataCursor, metadataCursor + metadataConcurrency)
    metadataCursor += chunk.length
    const chunkStartedAt = Date.now()
    const responses = await Promise.all(
      chunk.map(async (messageId) => {
        const metadata = await fetchMessageMetadata({
          accessToken: token.accessToken,
          messageId,
        })
        return { messageId, metadata }
      })
    )
    const chunkDurationMs = Date.now() - chunkStartedAt
    phaseMs.metadata_fetch_ms += Math.max(0, chunkDurationMs)
    const hasRetryablePressure = responses.some(
      (item) =>
        (item.metadata.ok && item.metadata.metrics.had_retryable_signal) ||
        (!item.metadata.ok && isRetryableStatus(item.metadata.status))
    )
    if (
      metadataConcurrency > METADATA_CONCURRENCY_DEGRADED &&
      (chunkDurationMs >= METADATA_BATCH_SLOW_MS || hasRetryablePressure)
    ) {
      metadataConcurrency = METADATA_CONCURRENCY_DEGRADED
    }

    for (const item of responses) {
      if (!item.metadata.ok) {
        if (item.metadata.status === 404) {
          deletedIds.add(item.messageId)
          continue
        }
        metadataFailureCount += 1
        if (metadataFailureSamples.length < 3) {
          metadataFailureSamples.push(`${item.messageId}: ${item.metadata.error}`)
        }
        continue
      }
      metadataRows.push(
        mapMetadataToIndexRow({
          tenantId: params.tenantId,
          messageId: item.messageId,
          metadata: item.metadata.metadata,
          indexedAtIso: nowIso,
        })
      )
      latestHistoryId = maxHistoryId(latestHistoryId, parseHistoryId(item.metadata.metadata.historyId))
    }
  }

  const upsertStartedAt = Date.now()
  const upsertResult = await upsertIndexRows({
    supabase: params.supabase,
    rows: metadataRows,
  })
  phaseMs.upsert_ms = Math.max(0, Date.now() - upsertStartedAt)
  if (!upsertResult.ok) {
    const indexedCount = await countIndexedMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'incremental',
      run: params.run,
      lastHistoryId: latestHistoryId || startHistoryId,
      mailboxEstimatedTotal,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      indexedMessageCount: indexedCount,
      lastSyncStatus: mailboxIndexFailureStatus('incremental'),
      lastSyncError: upsertResult.error,
      lastFailureReason: 'database_failed',
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      processedMessages: changedList.length,
      upsertedMessages: upserted,
      deletedMessages: deletedIds.size,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'incremental',
      run: params.run,
      reason: 'database_failed',
      error: upsertResult.error,
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      lastHistoryId: latestHistoryId || startHistoryId,
      usedFallbackFullScan: false,
      rowsAfter: indexedCount,
    })
  }
  upserted += metadataRows.length

  const deleteStartedAt = Date.now()
  const deleteResult = await deleteIndexRows({
    supabase: params.supabase,
    tenantId: params.tenantId,
    messageIds: Array.from(deletedIds),
  })
  phaseMs.delete_ms = Math.max(0, Date.now() - deleteStartedAt)
  if (!deleteResult.ok) {
    const indexedCount = await countIndexedMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'incremental',
      run: params.run,
      lastHistoryId: latestHistoryId || startHistoryId,
      mailboxEstimatedTotal,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      indexedMessageCount: indexedCount,
      lastSyncStatus: mailboxIndexFailureStatus('incremental'),
      lastSyncError: deleteResult.error,
      lastFailureReason: 'database_failed',
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      processedMessages: changedList.length,
      upsertedMessages: upserted,
      deletedMessages: deletedIds.size,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'incremental',
      run: params.run,
      reason: 'database_failed',
      error: deleteResult.error,
      terminalReason: 'database_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      lastHistoryId: latestHistoryId || startHistoryId,
      usedFallbackFullScan: false,
      rowsAfter: indexedCount,
    })
  }

  const countIndexedStartedAt = Date.now()
  const indexedCount = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.count_indexed_ms = Math.max(0, Date.now() - countIndexedStartedAt)
  const artifactRefreshHint = buildArtifactRefreshHint({
    runId: params.run.runId,
    existingRowsByMessageId: existingRowsResult.rowsByMessageId,
    metadataRows,
    deletedMessageIds: Array.from(deletedIds),
  })
  const senderStatsStartedAt = Date.now()
  const senderStatsResult =
    artifactRefreshHint && artifactRefreshHint.affected_sender_keys.length > 0
      ? await recomputeSenderStatsForSenders({
          supabase: params.supabase,
          tenantId: params.tenantId,
          senderKeys: artifactRefreshHint.affected_sender_keys,
        })
      : await recomputeSenderStatsForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
        })
  phaseMs.sender_stats_recompute_ms = Math.max(0, Date.now() - senderStatsStartedAt)
  if (!senderStatsResult.ok) {
    await markMailboxIndexRunFailed({
      supabase: params.supabase,
      tenantId: params.tenantId,
      effectiveMode: 'incremental',
      run: params.run,
      lastHistoryId: latestHistoryId || startHistoryId,
      mailboxEstimatedTotal,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      indexedMessageCount: indexedCount,
      lastSyncStatus: mailboxIndexFailureStatus('incremental'),
      lastSyncError: senderStatsResult.error,
      lastFailureReason: 'database_failed',
      terminalReason: 'sender_stats_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      processedMessages: changedList.length,
      upsertedMessages: upserted,
      deletedMessages: deletedIds.size,
    })
    return mailboxIndexFailureResult({
      effectiveMode: 'incremental',
      run: params.run,
      reason: 'database_failed',
      error: senderStatsResult.error,
      terminalReason: 'sender_stats_failed',
      gmailResultSizeEstimate: null,
      listPagesFetched: null,
      lastHistoryId: latestHistoryId || startHistoryId,
      usedFallbackFullScan: false,
      rowsAfter: indexedCount,
    })
  }

  const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
  const degradedSync = metadataFailureCount > 0
  const degradedMessage = degradedSync
    ? `Skipped metadata for ${metadataFailureCount} changed messages during incremental sync.${
        metadataFailureSamples.length > 0 ? ` Samples: ${metadataFailureSamples.join(' | ')}` : ''
      }`
    : null
  const terminalReason: GmailMailboxIndexTerminalReason = degradedSync
    ? 'incremental_sync_degraded'
    : 'incremental_sync_complete'
  const upsertStateStartedAt = Date.now()
  await markMailboxIndexRunCompleted({
    supabase: params.supabase,
    tenantId: params.tenantId,
    effectiveMode: 'incremental',
    run: params.run,
    lastHistoryId: latestHistoryId || startHistoryId,
    mailboxEstimatedTotal,
    indexedMessageCount: indexedCount,
    lastIndexDurationMs: durationMs,
    terminalReason,
    gmailResultSizeEstimate: null,
    listPagesFetched: null,
    processedMessages: changedList.length,
    upsertedMessages: upserted,
    deletedMessages: deletedIds.size,
  })
  phaseMs.upsert_state_ms = Math.max(0, Date.now() - upsertStateStartedAt)
  if (degradedSync) {
    await upsertMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      lastHistoryId: latestHistoryId || startHistoryId,
      indexedMessageCount: indexedCount,
      mailboxEstimatedTotal,
      indexCompletionPct: computeIndexCompletionPct({
        indexedMessageCount: indexedCount,
        mailboxEstimatedTotal,
      }),
      lastIndexDurationMs: durationMs,
      lastSyncStatus: 'incremental_sync_degraded',
      lastSyncError: degradedMessage,
      lastRequestedMode: params.run.requestedMode,
      lastEffectiveMode: 'incremental',
      lastFailureReason: 'metadata_fetch_partial_failure',
      lastTerminalReason: 'incremental_sync_degraded',
    })
  }
  clearIndexedRowsCacheForTenant(params.tenantId)

  console.info(
    `${params.logPrefix} ${JSON.stringify({
      mode: 'incremental',
      ok: true,
      run_id: params.run.runId,
      trigger: params.run.trigger,
      rows_before: params.run.rowsBefore,
      rows_after: indexedCount,
      growth_delta: mailboxIndexGrowthDelta(params.run.rowsBefore, indexedCount),
      processed_messages: changedList.length,
      metadata_fetch_requested_messages: metadataFetchList.length,
      metadata_fetch_skipped_messages: skippedMetadataFetches,
      upserted_messages: upserted,
      deleted_messages: deletedIds.size,
      indexed_message_count: indexedCount,
      metadata_failure_count: metadataFailureCount,
      timings_ms: phaseMs,
      duration_ms: durationMs,
    })}`
  )

  return mailboxIndexSuccessResult({
    effectiveMode: 'incremental',
    run: params.run,
    terminalReason,
    gmailResultSizeEstimate: null,
    listPagesFetched: null,
    processedMessages: changedList.length,
    upsertedMessages: upserted,
    deletedMessages: deletedIds.size,
    indexedMessageCount: indexedCount,
    lastHistoryId: latestHistoryId || startHistoryId,
    usedFallbackFullScan: false,
    artifactRefreshHint: degradedSync ? null : artifactRefreshHint,
  })
}

export async function syncGmailMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  mode?: 'full' | 'incremental'
  maxMessages?: number
  backfillWindowMonths?: GmailOperatorBackfillWindowMonths
  allowFullRescanOnHistoryGap?: boolean
  forceFreshHeadRecovery?: boolean
  logPrefix?: string
  runId?: string
  trigger?: GmailMailboxIndexTrigger
}): Promise<GmailMailboxIndexSyncResult> {
  const mode = params.mode === 'full' ? 'full' : 'incremental'
  const maxMessages = clampGmailMailboxIndexMaxMessages(params.maxMessages)
  const logPrefix = params.logPrefix ?? '[integrations/gmail/mailbox-indexer]'
  const runId = typeof params.runId === 'string' && params.runId.trim() ? params.runId.trim() : crypto.randomUUID()
  const trigger = normalizeGmailMailboxIndexTrigger(params.trigger, mode)
  const tenantId = params.tenantId.trim()

  if (!tenantId) {
    return {
      ok: false,
      mode,
      requested_mode: mode,
      effective_mode: mode,
      run_id: runId,
      trigger,
      reason: 'missing_tenant',
      error: 'tenant_id is required.',
      terminal_reason: 'missing_tenant',
      gmail_result_size_estimate: null,
      list_pages_fetched: null,
      rows_before: 0,
      rows_after: 0,
      growth_delta: 0,
      used_fallback_full_scan: false,
    }
  }

  const currentState = await loadGmailMailboxIndexState({
    supabase: params.supabase,
    tenantId,
  })
  const recentHealth =
    trigger === 'smart_sync' || trigger === 'manual_full_reindex'
      ? await loadGmailMailboxRecentHealthForTenant({
          supabase: params.supabase,
          tenantId,
        })
      : null
  const forceFreshHeadRecovery =
    params.forceFreshHeadRecovery === true || recentHealth?.false_healthy_state === true
  const rowsBefore = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId,
  })
  const resumeCheckpoint =
    trigger === 'operator_backfill'
        ? buildOperatorBackfillResumeCheckpoint(currentState)
        : forceFreshHeadRecovery
          ? buildManualFullResumeCheckpoint(currentState)
          : null
  const requestedMode =
    trigger === 'smart_sync'
      ? 'incremental'
      : trigger === 'operator_backfill'
        ? 'full'
        : mode
  const effectiveMode =
    forceFreshHeadRecovery && (trigger === 'smart_sync' || trigger === 'manual_full_reindex')
      ? 'full'
      : requestedMode
  const run: GmailMailboxIndexRunContext = {
    runId,
    trigger,
    rowsBefore,
    requestedMode,
    backfillWindowMonths:
      trigger === 'operator_backfill'
        ? normalizeGmailOperatorBackfillWindowMonths(params.backfillWindowMonths)
        : null,
  }

  if (trigger === 'smart_sync') {
    console.info(
      `${logPrefix} ${JSON.stringify({
        event: 'smart_sync_strategy_selected',
        run_id: runId,
        trigger,
        rows_before: rowsBefore,
        strategy: forceFreshHeadRecovery ? 'fresh_head_recent_recovery' : 'incremental_history_sync',
        requested_mode: requestedMode,
        effective_mode: effectiveMode,
        recovery_reason: recentHealth?.reason ?? null,
        recent_missing_days: recentHealth?.missing_recent_days ?? [],
        checkpoint_present: Boolean(resumeCheckpoint),
      })}`
    )
  }

  if (trigger === 'operator_backfill') {
    console.info(
      `${logPrefix} ${JSON.stringify({
        event: 'operator_backfill_strategy_selected',
        run_id: runId,
        trigger,
        rows_before: rowsBefore,
        strategy: resumeCheckpoint ? 'resume_full_from_checkpoint' : 'fresh_full_backfill',
        message: resumeCheckpoint
          ? 'Resumed historical backfill from saved checkpoint'
          : 'Fresh historical backfill started',
        requested_mode: requestedMode,
        backfill_window_months: run.backfillWindowMonths ?? null,
        checkpoint_present: Boolean(resumeCheckpoint),
      })}`
    )
  }

  if (trigger !== 'manual_full_reindex' && isManualFullRunActive(currentState)) {
    return mailboxIndexDeferredResult({
      run,
      currentState,
    })
  }

  if (
    isMailboxIndexRunActive(currentState) &&
    !isSameRegisteredMailboxIndexRun({
      state: currentState,
      runId,
      trigger,
    })
  ) {
    return mailboxIndexFailureResult({
      effectiveMode: currentState?.active_effective_mode ?? requestedMode,
      run,
      reason: 'already_running',
      error: 'A mailbox index run is already in progress for this tenant.',
      terminalReason: 'already_running',
      gmailResultSizeEstimate: currentState?.last_gmail_result_size_estimate ?? null,
      listPagesFetched: currentState?.last_list_pages_fetched ?? null,
      lastHistoryId: currentState?.last_history_id ?? null,
      usedFallbackFullScan: false,
      rowsAfter: rowsBefore,
    })
  }

  if (effectiveMode === 'full') {
    return runFullMailboxIndexForTenant({
      supabase: params.supabase,
      tenantId,
      maxMessages,
      logPrefix,
      run,
      disableResumeCheckpoint: false,
      recentRecoveryWindowDays: forceFreshHeadRecovery
        ? MAILBOX_INDEX_FRESH_HEAD_RECOVERY_WINDOW_DAYS
        : null,
    })
  }

  return runIncrementalMailboxIndexForTenant({
    supabase: params.supabase,
    tenantId,
    allowFullRescanOnHistoryGap:
      trigger === 'smart_sync' ? false : params.allowFullRescanOnHistoryGap ?? false,
    boundedHistoryGapMaxMessages: trigger === 'smart_sync' ? maxMessages : null,
    maxMessages,
    logPrefix,
    run,
  })
}

export async function loadIndexedGmailMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  limit?: number
}): Promise<GmailMailboxIndexRow[]> {
  const tenantId = params.tenantId.trim()
  const limit = clampGmailMailboxIndexMaxMessages(params.limit)
  const pageSize = Math.min(INDEX_QUERY_PAGE_SIZE, limit)
  const nowMs = Date.now()
  const requestKey = `${tenantId}::${limit}`
  const cached = indexedRowsCache.get(tenantId)
  if (cached && cached.expires_at_ms > nowMs && cached.rows.length >= limit) {
    return cached.rows.slice(0, limit)
  }

  const inflight = indexedRowsInflight.get(requestKey)
  if (inflight) {
    return (await inflight).slice(0, limit)
  }

  const request = (async (): Promise<GmailMailboxIndexRow[]> => {
    const startedAt = Date.now()
    const pageCount = Math.ceil(limit / pageSize)
    const pages = new Map<number, GmailMailboxIndexRow[]>()
    let highestLoadedPage = -1

    for (let pageStart = 0; pageStart < pageCount; pageStart += INDEX_QUERY_CONCURRENCY) {
      const pageIndexes = Array.from(
        { length: Math.min(INDEX_QUERY_CONCURRENCY, pageCount - pageStart) },
        (_, offset) => pageStart + offset
      )

      const batch = await Promise.all(
        pageIndexes.map(async (pageIndex) => {
          const rangeStart = pageIndex * pageSize
          const rangeEnd = Math.min(rangeStart + pageSize - 1, limit - 1)
          const { data, error } = await params.supabase
            .from('gmail_messages')
            .select(
              'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
            )
            .eq('tenant_id', tenantId)
            .order('internal_date_ms', { ascending: false })
            .order('message_id', { ascending: false })
            .range(rangeStart, rangeEnd)

          return {
            pageIndex,
            rows: Array.isArray(data) ? (data as GmailMailboxIndexRow[]) : [],
            error,
          }
        })
      )

      const firstError = batch.find((entry) => entry.error)
      if (firstError?.error) {
        console.warn(
          `[integrations/gmail/mailbox-indexer] indexed row load failed on page ${firstError.pageIndex}:`,
          firstError.error.message
        )
        break
      }

      for (const page of batch) {
        pages.set(page.pageIndex, page.rows)
        highestLoadedPage = Math.max(highestLoadedPage, page.pageIndex)
      }

      if (batch.some((entry) => entry.rows.length < pageSize)) {
        break
      }
    }

    const rows: GmailMailboxIndexRow[] = []
    for (let pageIndex = 0; pageIndex <= highestLoadedPage; pageIndex += 1) {
      const pageRows = pages.get(pageIndex) || []
      rows.push(...pageRows)
      if (pageRows.length < pageSize || rows.length >= limit) break
    }

    const sliced = rows.slice(0, limit)
    if (tenantId) {
      indexedRowsCache.set(tenantId, {
        expires_at_ms: nowMs + INDEXED_ROWS_CACHE_TTL_MS,
        rows: sliced,
      })
    }

    console.info(
      `[integrations/gmail/mailbox-indexer/indexed-rows] ${JSON.stringify({
        tenant_id: tenantId,
        requested_limit: limit,
        returned_rows: sliced.length,
        page_size: pageSize,
        page_count_requested: pageCount,
        query_concurrency: INDEX_QUERY_CONCURRENCY,
        duration_ms: Math.max(0, Date.now() - startedAt),
      })}`
    )

    return sliced
  })()

  indexedRowsInflight.set(requestKey, request)
  try {
    return await request
  } finally {
    indexedRowsInflight.delete(requestKey)
  }
}
