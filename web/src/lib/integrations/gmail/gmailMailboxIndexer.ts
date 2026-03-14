import type { SupabaseClient } from '@supabase/supabase-js'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_MESSAGE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_HISTORY_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/history'

const INBOX_READ_SCOPE_SUFFIXES = new Set(['/gmail.readonly', '/gmail.metadata', '/gmail.modify'])
const DEFAULT_MAX_MESSAGES = 50_000
const INDEX_QUERY_PAGE_SIZE = 1_000
const LIST_PAGE_SIZE = 500
const METADATA_CONCURRENCY_DEFAULT = 20
const METADATA_CONCURRENCY_DEGRADED = 10
const METADATA_BATCH_SLOW_MS = 1_500
const UPSERT_BATCH_SIZE = 500
const RETRY_MAX_ATTEMPTS = 4
const RETRY_BASE_DELAY_MS = 250
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const HISTORY_RECOVERY_FULL_SCAN_COOLDOWN_MS = 30 * 60 * 1000
const HISTORY_RECOVERY_PARTIAL_SCAN_COOLDOWN_MS = 10 * 60 * 1000
const INDEXED_ROWS_CACHE_TTL_MS = 1000 * 60 * 3

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
  updated_at: string
}

export type GmailMailboxIndexCoverage = {
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
}

type GmailSenderStatsRow = {
  tenant_id: string
  sender: string
  message_count: number
  recent_count_30d: number
  machine_probability: number
  human_probability: number
  last_seen: string | null
  updated_at: string
}

type IndexedRowsCacheEntry = {
  expires_at_ms: number
  rows: GmailMailboxIndexRow[]
}

const indexedRowsCache = new Map<string, IndexedRowsCacheEntry>()

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

export type GmailMailboxIndexSyncResult =
  | {
      ok: true
      mode: 'full' | 'incremental'
      processed_messages: number
      upserted_messages: number
      deleted_messages: number
      indexed_message_count: number
      last_history_id: string | null
      used_fallback_full_scan: boolean
    }
  | {
      ok: false
      mode: 'full' | 'incremental'
      reason: GmailMailboxIndexFailureReason
      error: string
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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
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
        throw error
      }
      hadRetryableSignal = true
      await sleep(retryDelayMs(attempt))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gmail request failed after retries.')
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

async function refreshGmailAccessToken(params: {
  refreshToken: string
  logPrefix: string
}): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return { ok: false, error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.' }
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
    return { ok: false, error: 'Failed to refresh Gmail access token.' }
  }

  return { ok: true, accessToken: tokenData.access_token }
}

async function resolveGmailAccessTokenForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  logPrefix: string
}): Promise<
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; reason: GmailMailboxIndexFailureReason; error: string }
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
    }
  }

  const row = rowData as GmailConnectionRow | null
  if (!row) {
    return {
      ok: false,
      reason: 'missing_connection',
      error: 'Gmail is not connected for this tenant.',
    }
  }

  if (!hasInboxReadScope(row.scopes)) {
    return {
      ok: false,
      reason: 'insufficient_scope',
      error:
        'Connected Gmail token is missing inbox-read scope. Reconnect Gmail with gmail.readonly, gmail.metadata, gmail.modify, or mail.google.com scope.',
    }
  }

  const refreshToken = typeof row.refresh_token === 'string' ? row.refresh_token.trim() : ''
  let accessToken = typeof row.access_token === 'string' ? row.access_token.trim() : ''
  if (!refreshToken || !accessToken) {
    return {
      ok: false,
      reason: 'missing_token',
      error: 'Gmail token is incomplete. Reconnect Gmail.',
    }
  }

  if (isExpiredTimestamp(row.expires_at)) {
    const refreshed = await refreshGmailAccessToken({
      refreshToken,
      logPrefix: params.logPrefix,
    })
    if (!refreshed.ok) {
      return { ok: false, reason: 'refresh_failed', error: refreshed.error }
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
}): Promise<
  | {
      ok: true
      metadata: GmailMessageMetadataResponse
      metrics: { duration_ms: number; had_retryable_signal: boolean }
    }
  | { ok: false; reason: GmailMailboxIndexFailureReason; error: string; status: number }
> {
  const url = new URL(`${GMAIL_MESSAGE_ENDPOINT}/${encodeURIComponent(params.messageId)}`)
  url.searchParams.set('format', 'metadata')
  url.searchParams.append('metadataHeaders', 'From')
  url.searchParams.append('metadataHeaders', 'Subject')
  url.searchParams.append('metadataHeaders', 'Date')

  const startedAt = Date.now()
  let response: Response
  let hadRetryableSignal = false
  try {
    const fetched = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${params.accessToken}` },
      cache: 'no-store',
    })
    response = fetched.response
    hadRetryableSignal = fetched.hadRetryableSignal
  } catch {
    return {
      ok: false,
      status: 502,
      reason: 'gmail_api_failed',
      error: 'Failed to fetch Gmail message metadata.',
    }
  }
  const durationMs = Date.now() - startedAt

  const payload = (await response
    .json()
    .catch(() => null)) as GmailMessageMetadataResponse | null

  if (response.status === 404) {
    return {
      ok: false,
      status: 404,
      reason: 'gmail_api_failed',
      error: 'Message not found.',
    }
  }
  if (hasInsufficientScopeError(response.status, payload)) {
    return {
      ok: false,
      status: response.status,
      reason: 'insufficient_scope',
      error: 'Connected Gmail token is missing inbox-read scope.',
    }
  }
  if (!response.ok || !payload) {
    return {
      ok: false,
      status: response.status,
      reason: 'gmail_api_failed',
      error: 'Failed to fetch Gmail message metadata.',
    }
  }

  return {
    ok: true,
    metadata: payload,
    metrics: {
      duration_ms: durationMs,
      had_retryable_signal: hadRetryableSignal,
    },
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
    internal_date_ms: Number.isFinite(internalDateMs) ? Math.round(internalDateMs) : null,
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
      .order('internal_date_ms', { ascending: true })
      .limit(1)
      .maybeSingle(),
    params.supabase
      .from('gmail_messages')
      .select('internal_date_ms')
      .eq('tenant_id', params.tenantId)
      .not('internal_date_ms', 'is', null)
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
    typeof oldestRowQuery.data?.internal_date_ms !== 'number' ||
    !Number.isFinite(oldestRowQuery.data.internal_date_ms)
      ? null
      : oldestRowQuery.data.internal_date_ms
  const newestDateMs =
    newestRowQuery.error ||
    typeof newestRowQuery.data?.internal_date_ms !== 'number' ||
    !Number.isFinite(newestRowQuery.data.internal_date_ms)
      ? null
      : newestRowQuery.data.internal_date_ms

  return {
    indexed_total_rows: indexedTotalRows,
    indexed_inbox_rows: indexedInboxRows,
    indexed_date_span_start: oldestDateMs != null ? new Date(oldestDateMs).toISOString() : null,
    indexed_date_span_end: newestDateMs != null ? new Date(newestDateMs).toISOString() : null,
  }
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

async function recomputeSenderStatsForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = (await loadIndexedGmailMessagesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    limit: DEFAULT_MAX_MESSAGES,
  })) as Array<{ sender: string | null; internal_date_ms: number | null; subject: string | null }>

  const nowMs = Date.now()
  const threshold30d = nowMs - 30 * 24 * 60 * 60 * 1000
  const bySender = new Map<
    string,
    {
      message_count: number
      recent_count_30d: number
      last_seen_ms: number | null
      machine_hits: number
      human_hits: number
    }
  >()

  for (const row of rows) {
    const sender = normalizeSender(row.sender)
    if (!sender) continue
    const bucket = bySender.get(sender) || {
      message_count: 0,
      recent_count_30d: 0,
      last_seen_ms: null as number | null,
      machine_hits: 0,
      human_hits: 0,
    }
    bucket.message_count += 1
    if (row.internal_date_ms != null && Number.isFinite(row.internal_date_ms)) {
      if (row.internal_date_ms >= threshold30d) {
        bucket.recent_count_30d += 1
      }
      if (bucket.last_seen_ms == null || row.internal_date_ms > bucket.last_seen_ms) {
        bucket.last_seen_ms = row.internal_date_ms
      }
    }
    const signals = senderMessageSignals({
      sender,
      subject: typeof row.subject === 'string' ? row.subject : null,
    })
    bucket.machine_hits += signals.machineHit
    bucket.human_hits += signals.humanHit
    bySender.set(sender, bucket)
  }

  const senderRows: GmailSenderStatsRow[] = Array.from(bySender.entries()).map(([sender, bucket]) => {
    const machineProbability = bucket.message_count > 0 ? bucket.machine_hits / bucket.message_count : 0
    const humanProbability = bucket.message_count > 0 ? bucket.human_hits / bucket.message_count : 0
    return {
      tenant_id: params.tenantId,
      sender,
      message_count: bucket.message_count,
      recent_count_30d: bucket.recent_count_30d,
      machine_probability: roundPercent(clamp(machineProbability, 0, 1)),
      human_probability: roundPercent(clamp(humanProbability, 0, 1)),
      last_seen: bucket.last_seen_ms != null ? new Date(bucket.last_seen_ms).toISOString() : null,
      updated_at: new Date().toISOString(),
    }
  })

  const { error: deleteError } = await params.supabase
    .from('gmail_sender_stats')
    .delete()
    .eq('tenant_id', params.tenantId)
  if (deleteError) {
    return { ok: false, error: `Failed to reset gmail_sender_stats: ${deleteError.message}` }
  }

  if (senderRows.length === 0) return { ok: true }
  for (const batch of chunkArray(senderRows, UPSERT_BATCH_SIZE)) {
    const { error: upsertError } = await params.supabase
      .from('gmail_sender_stats')
      .upsert(batch, { onConflict: 'tenant_id,sender' })
    if (upsertError) {
      return { ok: false, error: `Failed to upsert gmail_sender_stats rows: ${upsertError.message}` }
    }
  }

  return { ok: true }
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
}): Promise<void> {
  await params.supabase.from('gmail_mailbox_index_state').upsert(
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
}

export async function loadGmailMailboxIndexState(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<GmailMailboxIndexState | null> {
  const { data, error } = await params.supabase
    .from('gmail_mailbox_index_state')
    .select(
      'tenant_id,last_history_id,last_full_scan_at,last_incremental_sync_at,indexed_message_count,mailbox_estimated_total,index_completion_pct,last_index_duration_ms,last_sync_status,last_sync_error,updated_at'
    )
    .eq('tenant_id', params.tenantId)
    .maybeSingle()
  if (error || !data) return null
  return data as GmailMailboxIndexState
}

async function runFullMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  maxMessages: number
  logPrefix: string
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
  const resolveTokenStartedAt = Date.now()
  const token = await resolveGmailAccessTokenForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    logPrefix: params.logPrefix,
  })
  phaseMs.resolve_token_ms = Math.max(0, Date.now() - resolveTokenStartedAt)
  if (!token.ok) {
    return {
      ok: false,
      mode: 'full',
      reason: token.reason,
      error: token.error,
      used_fallback_full_scan: false,
    }
  }

  const maxMessages = Math.min(Math.max(params.maxMessages, 1), DEFAULT_MAX_MESSAGES)
  let processed = 0
  let upserted = 0
  let pageToken: string | null = null
  let highestHistoryId: string | null = null
  let mailboxEstimatedTotal =
    priorState?.mailbox_estimated_total != null && Number.isFinite(priorState.mailbox_estimated_total)
      ? Math.max(0, Math.round(priorState.mailbox_estimated_total))
      : null
  let metadataConcurrency = METADATA_CONCURRENCY_DEFAULT

  do {
    const listPageStartedAt = Date.now()
    const page = await listMailboxMessagesPage({
      accessToken: token.accessToken,
      pageToken,
      maxResults: LIST_PAGE_SIZE,
    })
    phaseMs.list_pages_ms += Math.max(0, Date.now() - listPageStartedAt)
    if (!page.ok) {
      return {
        ok: false,
        mode: 'full',
        reason: page.reason,
        error: page.error,
        last_history_id: highestHistoryId,
        used_fallback_full_scan: false,
      }
    }

    if (mailboxEstimatedTotal == null && typeof page.resultSizeEstimate === 'number') {
      mailboxEstimatedTotal = Math.max(0, Math.round(page.resultSizeEstimate))
    }

    const remaining = maxMessages - processed
    const messageIds = page.messageIds.slice(0, Math.max(0, remaining))
    if (messageIds.length === 0) {
      pageToken = null
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
        metadataConcurrency > METADATA_CONCURRENCY_DEGRADED &&
        (chunkDurationMs >= METADATA_BATCH_SLOW_MS || hasRetryablePressure)
      ) {
        metadataConcurrency = METADATA_CONCURRENCY_DEGRADED
      }

      for (const item of responses) {
        if (!item.metadata.ok) {
          if (item.metadata.status === 404) continue
          return {
            ok: false,
            mode: 'full',
            reason: item.metadata.reason,
            error: item.metadata.error,
            last_history_id: highestHistoryId,
            used_fallback_full_scan: false,
          }
        }
        const row = mapMetadataToIndexRow({
          tenantId: params.tenantId,
          messageId: item.messageId,
          metadata: item.metadata.metadata,
          indexedAtIso,
        })
        highestHistoryId = maxHistoryId(
          highestHistoryId,
          parseHistoryId(item.metadata.metadata.historyId)
        )
        metadataRows.push(row)
      }
    }

    const upsertStartedAt = Date.now()
    const upsertResult = await upsertIndexRows({
      supabase: params.supabase,
      rows: metadataRows,
    })
    phaseMs.upsert_ms += Math.max(0, Date.now() - upsertStartedAt)
    if (!upsertResult.ok) {
      return {
        ok: false,
        mode: 'full',
        reason: 'database_failed',
        error: upsertResult.error,
        last_history_id: highestHistoryId,
        used_fallback_full_scan: false,
      }
    }

    processed += messageIds.length
    upserted += metadataRows.length
    pageToken = processed >= maxMessages ? null : page.nextPageToken
  } while (pageToken)

  const countIndexedStartedAt = Date.now()
  const indexedCount = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.count_indexed_ms = Math.max(0, Date.now() - countIndexedStartedAt)
  const senderStatsStartedAt = Date.now()
  const senderStatsResult = await recomputeSenderStatsForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.sender_stats_recompute_ms = Math.max(0, Date.now() - senderStatsStartedAt)
  if (!senderStatsResult.ok) {
    return {
      ok: false,
      mode: 'full',
      reason: 'database_failed',
      error: senderStatsResult.error,
      last_history_id: highestHistoryId,
      used_fallback_full_scan: false,
    }
  }

  const completionPct = computeIndexCompletionPct({
    indexedMessageCount: indexedCount,
    mailboxEstimatedTotal,
  })
  const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
  const nowIso = new Date().toISOString()
  const upsertStateStartedAt = Date.now()
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: highestHistoryId,
    indexedMessageCount: indexedCount,
    mailboxEstimatedTotal,
    indexCompletionPct: completionPct,
    lastIndexDurationMs: durationMs,
    lastSyncStatus: 'full_scan_complete',
    lastSyncError: null,
    lastFullScanAt: nowIso,
    lastIncrementalSyncAt: nowIso,
  })
  phaseMs.upsert_state_ms = Math.max(0, Date.now() - upsertStateStartedAt)
  clearIndexedRowsCacheForTenant(params.tenantId)

  console.info(
    `${params.logPrefix} ${JSON.stringify({
      mode: 'full',
      processed_messages: processed,
      upserted_messages: upserted,
      indexed_message_count: indexedCount,
      timings_ms: phaseMs,
      duration_ms: durationMs,
    })}`
  )

  return {
    ok: true,
    mode: 'full',
    processed_messages: processed,
    upserted_messages: upserted,
    deleted_messages: 0,
    indexed_message_count: indexedCount,
    last_history_id: highestHistoryId,
    used_fallback_full_scan: false,
  }
}

function collectHistoryMessageIds(
  historyItem: NonNullable<GmailHistoryListResponse['history']>[number],
  changed: Set<string>,
  deleted: Set<string>
) {
  const collect = (list: unknown, out: Set<string>) => {
    if (!Array.isArray(list)) return
    for (const entry of list) {
      if (!isRecord(entry)) continue
      const message = isRecord(entry.message) ? entry.message : entry
      const id = typeof message.id === 'string' ? message.id.trim() : ''
      if (!id) continue
      out.add(id)
    }
  }

  collect(historyItem.messages, changed)
  collect(historyItem.messagesAdded, changed)
  collect(historyItem.labelsAdded, changed)
  collect(historyItem.labelsRemoved, changed)
  collect(historyItem.messagesDeleted, deleted)
}

async function listHistoryPage(params: {
  accessToken: string
  startHistoryId: string
  pageToken?: string | null
}): Promise<
  | { ok: true; payload: GmailHistoryListResponse }
  | { ok: false; reason: GmailMailboxIndexFailureReason; error: string; status: number }
> {
  const url = new URL(GMAIL_HISTORY_ENDPOINT)
  url.searchParams.set('startHistoryId', params.startHistoryId)
  url.searchParams.set('maxResults', String(LIST_PAGE_SIZE))
  url.searchParams.append('historyTypes', 'messageAdded')
  url.searchParams.append('historyTypes', 'messageDeleted')
  url.searchParams.append('historyTypes', 'labelsAdded')
  url.searchParams.append('historyTypes', 'labelsRemoved')
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
    return {
      ok: false,
      status: 502,
      reason: 'gmail_api_failed',
      error: 'Failed to list Gmail history changes.',
    }
  }
  const payload = (await response
    .json()
    .catch(() => null)) as GmailHistoryListResponse | null

  if (hasHistoryOutOfDateError(response.status, payload)) {
    return {
      ok: false,
      status: response.status,
      reason: 'history_out_of_date',
      error: 'Gmail historyId is too old and requires full re-index.',
    }
  }
  if (hasInsufficientScopeError(response.status, payload)) {
    return {
      ok: false,
      status: response.status,
      reason: 'insufficient_scope',
      error: 'Connected Gmail token is missing inbox-read scope.',
    }
  }
  if (!response.ok || !payload) {
    return {
      ok: false,
      status: response.status,
      reason: 'gmail_api_failed',
      error: 'Failed to list Gmail history changes.',
    }
  }
  return { ok: true, payload }
}

async function runIncrementalMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  allowFullRescanOnHistoryGap: boolean
  maxMessages: number
  logPrefix: string
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
  const startHistoryId =
    state?.last_history_id && state.last_history_id.trim() ? state.last_history_id.trim() : ''

  if (!startHistoryId) {
    if (!params.allowFullRescanOnHistoryGap) {
      return {
        ok: false,
        mode: 'incremental',
        reason: 'missing_history_state',
        error: 'No history checkpoint found for incremental sync.',
        used_fallback_full_scan: false,
      }
    }
    const full = await runFullMailboxIndexForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      maxMessages: params.maxMessages,
      logPrefix: params.logPrefix,
    })
    return full.ok
      ? { ...full, mode: 'incremental', used_fallback_full_scan: true }
      : { ...full, mode: 'incremental', used_fallback_full_scan: true }
  }

  const resolveTokenStartedAt = Date.now()
  const token = await resolveGmailAccessTokenForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    logPrefix: params.logPrefix,
  })
  phaseMs.resolve_token_ms = Math.max(0, Date.now() - resolveTokenStartedAt)
  if (!token.ok) {
    return {
      ok: false,
      mode: 'incremental',
      reason: token.reason,
      error: token.error,
      last_history_id: startHistoryId,
      used_fallback_full_scan: false,
    }
  }

  const changedIds = new Set<string>()
  const deletedIds = new Set<string>()
  let pageToken: string | null = null
  let latestHistoryId: string | null = startHistoryId
  let metadataConcurrency = METADATA_CONCURRENCY_DEFAULT
  const mailboxEstimatedTotal =
    state?.mailbox_estimated_total != null && Number.isFinite(state.mailbox_estimated_total)
      ? Math.max(0, Math.round(state.mailbox_estimated_total))
      : null

  do {
    const historyPageStartedAt = Date.now()
    const page = await listHistoryPage({
      accessToken: token.accessToken,
      startHistoryId,
      pageToken,
    })
    phaseMs.history_list_ms += Math.max(0, Date.now() - historyPageStartedAt)
    if (!page.ok) {
      const failedToListHistory = page.reason === 'gmail_api_failed' && page.error.toLowerCase().includes('history')
      const canRunHistoryRecoveryScan = (() => {
        if (!params.allowFullRescanOnHistoryGap) return false
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
        const lastIncrementalMs =
          typeof state?.last_incremental_sync_at === 'string' && state.last_incremental_sync_at.trim()
            ? Date.parse(state.last_incremental_sync_at)
            : Number.NaN
        if (!Number.isFinite(lastIncrementalMs)) return true
        return Date.now() - lastIncrementalMs > HISTORY_RECOVERY_PARTIAL_SCAN_COOLDOWN_MS
      })()

      if (canRunHistoryRecoveryScan) {
        const recoveryStartedAt = Date.now()
        const full = await runFullMailboxIndexForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          maxMessages: params.maxMessages,
          logPrefix: params.logPrefix,
        })
        phaseMs.recovery_scan_ms = Math.max(0, Date.now() - recoveryStartedAt)
        return full.ok
          ? { ...full, mode: 'incremental', used_fallback_full_scan: true }
          : { ...full, mode: 'incremental', used_fallback_full_scan: true }
      }
      if (canRunBoundedRecoveryScan) {
        const recoveryStartedAt = Date.now()
        const partialRecovery = await runFullMailboxIndexForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          maxMessages: Math.min(params.maxMessages, 10_000),
          logPrefix: `${params.logPrefix}:history-recovery`,
        })
        phaseMs.recovery_scan_ms = Math.max(0, Date.now() - recoveryStartedAt)
        if (partialRecovery.ok) {
          return {
            ...partialRecovery,
            mode: 'incremental',
            used_fallback_full_scan: true,
          }
        }
      }
      const failedHistoryMessage = failedToListHistory
        ? 'Failed to list Gmail history changes. Cached indexed rows remain usable; automatic bounded recovery is scheduled.'
        : page.error
      await upsertMailboxIndexState({
        supabase: params.supabase,
        tenantId: params.tenantId,
        lastHistoryId: startHistoryId,
        indexedMessageCount: state?.indexed_message_count || 0,
        mailboxEstimatedTotal,
        indexCompletionPct: state?.index_completion_pct ?? null,
        lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
        lastSyncStatus:
          page.reason === 'history_out_of_date'
            ? 'incremental_history_out_of_date'
            : failedToListHistory
              ? 'incremental_history_listing_failed'
            : 'incremental_sync_failed',
        lastSyncError: failedHistoryMessage,
        lastIncrementalSyncAt: new Date().toISOString(),
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
      return {
        ok: false,
        mode: 'incremental',
        reason: page.reason,
        error: page.error,
        last_history_id: startHistoryId,
        used_fallback_full_scan: false,
      }
    }

    const payload = page.payload
    latestHistoryId = maxHistoryId(latestHistoryId, parseHistoryId(payload.historyId))
    for (const historyItem of payload.history || []) {
      collectHistoryMessageIds(historyItem, changedIds, deletedIds)
      latestHistoryId = maxHistoryId(latestHistoryId, parseHistoryId(historyItem.id))
    }

    pageToken =
      typeof payload.nextPageToken === 'string' && payload.nextPageToken.trim()
        ? payload.nextPageToken.trim()
        : null
  } while (pageToken)

  for (const deletedId of deletedIds) {
    changedIds.delete(deletedId)
  }

  const changedList = Array.from(changedIds)
  const nowIso = new Date().toISOString()
  const metadataRows: GmailMailboxIndexRow[] = []
  let upserted = 0
  let metadataFailureCount = 0
  const metadataFailureSamples: string[] = []

  let metadataCursor = 0
  while (metadataCursor < changedList.length) {
    const chunk = changedList.slice(metadataCursor, metadataCursor + metadataConcurrency)
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
    await upsertMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      lastHistoryId: latestHistoryId || startHistoryId,
      indexedMessageCount: state?.indexed_message_count || 0,
      mailboxEstimatedTotal,
      indexCompletionPct: state?.index_completion_pct ?? null,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      lastSyncStatus: 'incremental_sync_failed',
      lastSyncError: upsertResult.error,
      lastIncrementalSyncAt: nowIso,
    })
    return {
      ok: false,
      mode: 'incremental',
      reason: 'database_failed',
      error: upsertResult.error,
      last_history_id: latestHistoryId || startHistoryId,
      used_fallback_full_scan: false,
    }
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
    await upsertMailboxIndexState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      lastHistoryId: latestHistoryId || startHistoryId,
      indexedMessageCount: state?.indexed_message_count || 0,
      mailboxEstimatedTotal,
      indexCompletionPct: state?.index_completion_pct ?? null,
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      lastSyncStatus: 'incremental_sync_failed',
      lastSyncError: deleteResult.error,
      lastIncrementalSyncAt: nowIso,
    })
    return {
      ok: false,
      mode: 'incremental',
      reason: 'database_failed',
      error: deleteResult.error,
      last_history_id: latestHistoryId || startHistoryId,
      used_fallback_full_scan: false,
    }
  }

  const countIndexedStartedAt = Date.now()
  const indexedCount = await countIndexedMessagesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.count_indexed_ms = Math.max(0, Date.now() - countIndexedStartedAt)
  const senderStatsStartedAt = Date.now()
  const senderStatsResult = await recomputeSenderStatsForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  phaseMs.sender_stats_recompute_ms = Math.max(0, Date.now() - senderStatsStartedAt)
  if (!senderStatsResult.ok) {
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
      lastIndexDurationMs: Math.max(0, Math.round(Date.now() - runStartedAt)),
      lastSyncStatus: 'incremental_sync_failed',
      lastSyncError: senderStatsResult.error,
      lastIncrementalSyncAt: nowIso,
    })
    return {
      ok: false,
      mode: 'incremental',
      reason: 'database_failed',
      error: senderStatsResult.error,
      last_history_id: latestHistoryId || startHistoryId,
      used_fallback_full_scan: false,
    }
  }

  const completionPct = computeIndexCompletionPct({
    indexedMessageCount: indexedCount,
    mailboxEstimatedTotal,
  })
  const durationMs = Math.max(0, Math.round(Date.now() - runStartedAt))
  const degradedSync = metadataFailureCount > 0
  const degradedMessage = degradedSync
    ? `Skipped metadata for ${metadataFailureCount} changed messages during incremental sync.${
        metadataFailureSamples.length > 0 ? ` Samples: ${metadataFailureSamples.join(' | ')}` : ''
      }`
    : null
  const upsertStateStartedAt = Date.now()
  await upsertMailboxIndexState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    lastHistoryId: latestHistoryId || startHistoryId,
    indexedMessageCount: indexedCount,
    mailboxEstimatedTotal,
    indexCompletionPct: completionPct,
    lastIndexDurationMs: durationMs,
    lastSyncStatus: degradedSync ? 'incremental_sync_degraded' : 'incremental_sync_complete',
    lastSyncError: degradedMessage,
    lastIncrementalSyncAt: nowIso,
  })
  phaseMs.upsert_state_ms = Math.max(0, Date.now() - upsertStateStartedAt)
  clearIndexedRowsCacheForTenant(params.tenantId)

  console.info(
    `${params.logPrefix} ${JSON.stringify({
      mode: 'incremental',
      ok: true,
      processed_messages: changedList.length,
      upserted_messages: upserted,
      deleted_messages: deletedIds.size,
      indexed_message_count: indexedCount,
      metadata_failure_count: metadataFailureCount,
      timings_ms: phaseMs,
      duration_ms: durationMs,
    })}`
  )

  return {
    ok: true,
    mode: 'incremental',
    processed_messages: changedList.length,
    upserted_messages: upserted,
    deleted_messages: deletedIds.size,
    indexed_message_count: indexedCount,
    last_history_id: latestHistoryId || startHistoryId,
    used_fallback_full_scan: false,
  }
}

export async function syncGmailMailboxIndexForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  mode?: 'full' | 'incremental'
  maxMessages?: number
  allowFullRescanOnHistoryGap?: boolean
  logPrefix?: string
}): Promise<GmailMailboxIndexSyncResult> {
  const mode = params.mode === 'full' ? 'full' : 'incremental'
  const maxMessages = Math.min(
    Math.max(params.maxMessages ?? DEFAULT_MAX_MESSAGES, 1),
    DEFAULT_MAX_MESSAGES
  )
  const logPrefix = params.logPrefix ?? '[integrations/gmail/mailbox-indexer]'

  if (!params.tenantId || !params.tenantId.trim()) {
    return {
      ok: false,
      mode,
      reason: 'missing_tenant',
      error: 'tenant_id is required.',
      used_fallback_full_scan: false,
    }
  }

  if (mode === 'full') {
    return runFullMailboxIndexForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      maxMessages,
      logPrefix,
    })
  }

  return runIncrementalMailboxIndexForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    allowFullRescanOnHistoryGap: params.allowFullRescanOnHistoryGap ?? false,
    maxMessages,
    logPrefix,
  })
}

export async function loadIndexedGmailMessagesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  limit?: number
}): Promise<GmailMailboxIndexRow[]> {
  const tenantId = params.tenantId.trim()
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_MAX_MESSAGES, 1), DEFAULT_MAX_MESSAGES)
  const pageSize = Math.min(INDEX_QUERY_PAGE_SIZE, limit)
  const nowMs = Date.now()
  const cached = indexedRowsCache.get(tenantId)
  if (cached && cached.expires_at_ms > nowMs && cached.rows.length >= limit) {
    return cached.rows.slice(0, limit)
  }

  const rows: GmailMailboxIndexRow[] = []
  let offset = 0

  while (rows.length < limit) {
    const rangeEnd = Math.min(offset + pageSize - 1, limit - 1)
    const { data, error } = await params.supabase
      .from('gmail_messages')
      .select(
        'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
      )
      .eq('tenant_id', tenantId)
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(offset, rangeEnd)

    if (error || !Array.isArray(data)) {
      return rows.length > 0 ? rows : []
    }

    rows.push(...(data as GmailMailboxIndexRow[]))
    if (data.length < pageSize) break
    offset += data.length
  }
  const sliced = rows.slice(0, limit)
  if (tenantId) {
    indexedRowsCache.set(tenantId, {
      expires_at_ms: nowMs + INDEXED_ROWS_CACHE_TTL_MS,
      rows: sliced,
    })
  }
  return sliced
}
