import type { SupabaseClient } from '@supabase/supabase-js'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_MESSAGE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const GMAIL_BATCH_MODIFY_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify'

const SAMPLE_MAX_RESULTS = 25
const SAMPLE_SUBJECT_LIMIT = 10
const TOP_SENDERS_LIMIT = 5
const QUERY_REVIEW_MAX_RESULTS = 25

const INBOX_READ_SCOPE_SUFFIXES = new Set(['/gmail.readonly', '/gmail.metadata', '/gmail.modify'])
const INBOX_MODIFY_SCOPE_SUFFIXES = new Set(['/gmail.modify'])

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
  snippet?: string
  payload?: {
    headers?: Array<{ name?: string; value?: string }>
  }
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
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
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
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
  }>
  risk_note: string
  safety_note: string
}

export type GmailQueryClusterReviewResult =
  | { ok: true; data: GmailQueryClusterReviewData }
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
  subject: string | null
  from: string | null
  date: string | null
  snippet: string | null
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
}

export type GmailCleanupDiscoveryData = {
  generated_at: string
  planning_mode: 'read_only'
  safety_defaults: string[]
  clusters: GmailCleanupCluster[]
}

export type GmailCleanupDiscoveryResult =
  | { ok: true; data: GmailCleanupDiscoveryData }
  | GmailReadFailure

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

function normalizeSender(fromHeader: string): string {
  const trimmed = fromHeader.trim()
  const angleMatch = trimmed.match(/<([^>]+)>/)
  if (angleMatch && angleMatch[1]) return angleMatch[1].trim().toLowerCase()
  return trimmed.toLowerCase()
}

function compactSnippet(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

type GmailCleanupClusterSpec = {
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

function buildGmailCleanupClusterSpecs(params: {
  topSenders?: string[]
}): GmailCleanupClusterSpec[] {
  const safetyBase = 'in:inbox older_than:30d -is:starred -is:important -category:primary -from:me'
  const specs: GmailCleanupClusterSpec[] = [
    {
      cluster_id: 'newsletters',
      cluster_type: 'newsletters',
      title: 'Newsletter / unsubscribe-like traffic',
      query:
        `${safetyBase} (` +
        'subject:(newsletter OR digest OR promo OR promotion) OR "unsubscribe" OR "manage preferences"' +
        ')',
      why_selected: 'Targets recurring subscription-style inbox traffic with low reply likelihood.',
      risk_note: 'Low to medium risk; still review for subscriptions you want to keep.',
    },
    {
      cluster_id: 'noreply-automation',
      cluster_type: 'noreply_automation',
      title: 'No-reply automated mail',
      query:
        `${safetyBase} (` +
        'from:noreply OR from:no-reply OR from:donotreply OR from:do-not-reply OR subject:notification' +
        ')',
      why_selected: 'Identifies machine-generated alerts and automation-heavy traffic.',
      risk_note: 'Low risk, but system/security alerts may still need retention.',
    },
    {
      cluster_id: 'shopping-updates',
      cluster_type: 'shopping_updates',
      title: 'Shopping / order updates',
      query:
        `${safetyBase} (` +
        'subject:(order OR shipped OR delivery OR tracking OR receipt OR invoice) OR category:purchases' +
        ')',
      why_selected: 'Finds transactional commerce updates often safe for staged review.',
      risk_note: 'Medium risk; keep recent warranty/returns and tax-related receipts.',
    },
    {
      cluster_id: 'social-notifications',
      cluster_type: 'social_notifications',
      title: 'Social / notification traffic',
      query:
        `${safetyBase} (` +
        'category:social OR subject:(notification OR mentioned OR follower OR comment OR liked)' +
        ')',
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
      query: `in:inbox from:${token} older_than:30d -is:starred -is:important -category:primary`,
      why_selected: 'Sender-based cluster to review concentrated non-primary traffic from one source.',
      risk_note: 'Medium risk; sender clusters can include mixed-priority updates.',
    })
  }

  return specs
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
  const maxResults = Math.min(Math.max(params.maxResults ?? SAMPLE_MAX_RESULTS, 1), 50)

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
              subject: string | null
              from: string
              dateIso: string | null
              date: string | null
              snippet: string | null
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
            subject,
            from: from || sender,
            dateIso,
            date: dateIso,
            snippet,
          }
        }
      )
      .filter(
        (
          entry
        ): entry is {
          message_id: string
          subject: string | null
          from: string
          dateIso: string | null
          date: string | null
          snippet: string | null
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
          subject: message.subject,
          from: message.from,
          date: message.date,
          snippet: message.snippet,
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
    messagesListUrl.searchParams.set('q', query)
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
          query,
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
              subject: string | null
              from: string | null
              dateIso: string | null
              date: string | null
              snippet: string | null
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
            subject,
            from,
            dateIso,
            date: dateIso,
            snippet,
          }
        }
      )
      .filter(
        (
          entry
        ): entry is {
          message_id: string
          subject: string | null
          from: string | null
          dateIso: string | null
          date: string | null
          snippet: string | null
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
        query,
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
          subject: message.subject,
          from: message.from,
          date: message.date,
          snippet: message.snippet,
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

  const boundedMessageIds = messageIds.slice(0, 100)

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

    const modifyResponse = await fetch(GMAIL_BATCH_MODIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: boundedMessageIds,
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

    return {
      ok: true,
      data: {
        sender:
          typeof params.sender === 'string' && params.sender.trim() ? params.sender.trim() : null,
        batch_title:
          typeof params.batchTitle === 'string' && params.batchTitle.trim()
            ? params.batchTitle.trim()
            : null,
        requested_count: boundedMessageIds.length,
        archived_count: boundedMessageIds.length,
        message_ids: boundedMessageIds,
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
  logPrefix?: string
}): Promise<GmailCleanupDiscoveryResult> {
  const logPrefix = params.logPrefix ?? '[integrations/gmail/cleanup-discovery]'

  if (!params.tenantId) {
    return fail(400, 'User profile is missing tenant_id.')
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

    const clusterSpecs = buildGmailCleanupClusterSpecs({
      topSenders: params.topSenders,
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
            samplePreview.push({
              message_id: item.messageId,
              subject: headerValue(item.data.payload?.headers, 'Subject'),
              from: headerValue(item.data.payload?.headers, 'From'),
              date: dateIsoFromMessage(item.data),
              snippet:
                typeof item.data.snippet === 'string' && item.data.snippet.trim()
                  ? compactSnippet(item.data.snippet)
                  : null,
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
            why_selected: spec.why_selected,
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

    return {
      ok: true,
      data: {
        generated_at: new Date().toISOString(),
        planning_mode: 'read_only',
        safety_defaults: CLEANUP_SAFETY_DEFAULTS,
        clusters: clusters.slice(0, 10),
      },
    }
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error)
    return fail(500, 'Unexpected error while discovering cleanup clusters.')
  }
}
