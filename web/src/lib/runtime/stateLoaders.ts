import type { getSupabaseAdmin } from '@/lib/supabase'
import {
  parseRuntimeActionCandidates,
  type RuntimeActionCandidate,
  type RuntimeSuggestionHistory,
  type RuntimeSuggestionHistoryRequest,
} from '@/lib/runtime/suggestionLifecycle'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

type ExecutionResultEventRow = {
  created_at: string | null
  payload: unknown
}

type AgentEventRow = {
  event_type: string | null
  created_at: string | null
  payload: unknown
}

type AgentSessionRow = { id: string | null }

export type SessionChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type RuntimeInboxAnalysisData = {
  total_messages_estimate: number
  sample_size: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  top_senders: Array<{ sender: string; count: number }>
  sample_subject_lines: string[]
}

export type RuntimeEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'analyze_inbox'
  inbox_analysis: RuntimeInboxAnalysisData
}

export type RuntimeSenderReviewData = {
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

export type RuntimeReviewEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'review_sender_cluster'
  sender_review: RuntimeSenderReviewData
}

export type RuntimeQueryReviewData = {
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

export type RuntimeQueryReviewEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'review_query_cluster'
  query_review: RuntimeQueryReviewData
}

export type RuntimeReviewResultItem = {
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

export type RuntimeArchiveData = {
  sender: string | null
  batch_title: string | null
  requested_count: number
  archived_count: number
  message_ids: string[]
}

export type RuntimeArchiveEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'archive_messages'
  archive_result: RuntimeArchiveData
}

export type PlaygroundRuntimeStateInputs = {
  runtimeEvidence: RuntimeEvidence | null
  latestRuntimeReviewEvidence: RuntimeReviewEvidence | null
  latestRuntimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  latestRuntimeArchiveEvidence: RuntimeArchiveEvidence | null
  reviewResults: RuntimeReviewResultItem[]
  runtimeSuggestionHistory: RuntimeSuggestionHistory
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
  proposed_actions: RuntimeActionCandidate[]
}

export type PlaygroundRuntimeStateInputLoadTimingMs = {
  analyze_inbox_evidence_ms: number
  sender_cluster_review_ms: number
  query_cluster_review_ms: number
  archive_evidence_ms: number
  review_results_ms: number
  suggestion_history_ms: number
  runtime_inputs_total_ms: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseRecordPayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseRuntimeInboxAnalysisData(value: unknown): RuntimeInboxAnalysisData | null {
  if (!isRecord(value)) return null

  const totalMessagesEstimate = toNumber(value.total_messages_estimate)
  const sampleSize = toNumber(value.sample_size)
  if (totalMessagesEstimate == null || sampleSize == null) return null

  const oldest =
    typeof value.sampled_oldest_message_date === 'string' || value.sampled_oldest_message_date == null
      ? value.sampled_oldest_message_date
      : null
  const newest =
    typeof value.sampled_newest_message_date === 'string' || value.sampled_newest_message_date == null
      ? value.sampled_newest_message_date
      : null

  const topSendersRaw = Array.isArray(value.top_senders) ? value.top_senders : []
  const topSenders = topSendersRaw
    .map((entry) => {
      if (!isRecord(entry)) return null
      const sender = typeof entry.sender === 'string' ? entry.sender : ''
      const count = toNumber(entry.count)
      if (!sender || count == null) return null
      return { sender, count }
    })
    .filter((entry): entry is { sender: string; count: number } => entry != null)

  const sampleSubjectsRaw = Array.isArray(value.sample_subject_lines) ? value.sample_subject_lines : []
  const sampleSubjectLines = sampleSubjectsRaw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )

  return {
    total_messages_estimate: totalMessagesEstimate,
    sample_size: sampleSize,
    sampled_oldest_message_date: oldest ?? null,
    sampled_newest_message_date: newest ?? null,
    top_senders: topSenders,
    sample_subject_lines: sampleSubjectLines,
  }
}

function parseRuntimeSenderReviewData(value: unknown): RuntimeSenderReviewData | null {
  if (!isRecord(value)) return null

  const sender = typeof value.sender === 'string' ? value.sender.trim() : ''
  const fetchedCount = toNumber(value.fetched_count)
  if (!sender || fetchedCount == null || fetchedCount < 0) return null

  const oldest =
    typeof value.sampled_oldest_message_date === 'string' || value.sampled_oldest_message_date == null
      ? value.sampled_oldest_message_date
      : null
  const newest =
    typeof value.sampled_newest_message_date === 'string' || value.sampled_newest_message_date == null
      ? value.sampled_newest_message_date
      : null

  const subjectLinesRaw = Array.isArray(value.sample_subject_lines) ? value.sample_subject_lines : []
  const sampleSubjectLines = subjectLinesRaw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )

  const snippetsRaw = Array.isArray(value.snippet_previews) ? value.snippet_previews : []
  const snippetPreviews = snippetsRaw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )

  const messagesRaw = Array.isArray(value.messages) ? value.messages : []
  const messages = messagesRaw
    .map((entry) => {
      if (!isRecord(entry)) return null

      const messageId = typeof entry.message_id === 'string' ? entry.message_id.trim() : ''
      if (!messageId) return null

      const subject =
        typeof entry.subject === 'string' || entry.subject == null ? entry.subject ?? null : null
      const from = typeof entry.from === 'string' || entry.from == null ? entry.from ?? null : null
      const date = typeof entry.date === 'string' || entry.date == null ? entry.date ?? null : null
      const snippet =
        typeof entry.snippet === 'string' || entry.snippet == null ? entry.snippet ?? null : null
      const threadId =
        typeof entry.thread_id === 'string' && entry.thread_id.trim()
          ? entry.thread_id.trim()
          : undefined
      const historyId =
        typeof entry.history_id === 'string' && entry.history_id.trim()
          ? entry.history_id.trim()
          : undefined
      const internalDateMs = toNumber(entry.internal_date_ms)
      const categoryLabels = Array.isArray(entry.category_labels)
        ? entry.category_labels
            .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
            .map((label) => label.trim())
        : undefined
      const labelIds = Array.isArray(entry.label_ids)
        ? entry.label_ids
            .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
            .map((label) => label.trim())
        : undefined
      const isInInbox =
        typeof entry.is_in_inbox === 'boolean'
          ? entry.is_in_inbox
          : labelIds
            ? labelIds.includes('INBOX')
            : undefined
      const isUnread =
        typeof entry.is_unread === 'boolean'
          ? entry.is_unread
          : labelIds
            ? labelIds.includes('UNREAD')
            : undefined
      const isImportant =
        typeof entry.is_important === 'boolean'
          ? entry.is_important
          : labelIds
            ? labelIds.includes('IMPORTANT')
            : undefined
      const isStarred =
        typeof entry.is_starred === 'boolean'
          ? entry.is_starred
          : labelIds
            ? labelIds.includes('STARRED')
            : undefined

      return {
        message_id: messageId,
        ...(threadId ? { thread_id: threadId } : {}),
        ...(historyId ? { history_id: historyId } : {}),
        ...(internalDateMs != null ? { internal_date_ms: internalDateMs } : {}),
        subject,
        from,
        date,
        snippet,
        ...(labelIds && labelIds.length > 0 ? { label_ids: Array.from(new Set(labelIds)) } : {}),
        ...(categoryLabels && categoryLabels.length > 0
          ? { category_labels: Array.from(new Set(categoryLabels)) }
          : {}),
        ...(isInInbox != null ? { is_in_inbox: isInInbox } : {}),
        ...(isUnread != null ? { is_unread: isUnread } : {}),
        ...(isImportant != null ? { is_important: isImportant } : {}),
        ...(isStarred != null ? { is_starred: isStarred } : {}),
      }
    })
    .filter(
      (
        entry
      ): entry is {
        message_id: string
        subject: string | null
        from: string | null
        date: string | null
        snippet: string | null
        thread_id?: string
        history_id?: string
        internal_date_ms?: number
        label_ids?: string[]
        category_labels?: string[]
        is_in_inbox?: boolean
        is_unread?: boolean
        is_important?: boolean
        is_starred?: boolean
      } => entry != null
    )

  return {
    sender,
    fetched_count: fetchedCount,
    sampled_oldest_message_date: oldest ?? null,
    sampled_newest_message_date: newest ?? null,
    sample_subject_lines: sampleSubjectLines,
    snippet_previews: snippetPreviews,
    messages,
  }
}

function parseRuntimeQueryReviewData(value: unknown): RuntimeQueryReviewData | null {
  if (!isRecord(value)) return null

  const clusterId = typeof value.cluster_id === 'string' ? value.cluster_id.trim() : ''
  const clusterType = typeof value.cluster_type === 'string' ? value.cluster_type.trim() : ''
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const query = typeof value.query === 'string' ? value.query.trim() : ''
  const fetchedCount = toNumber(value.fetched_count)
  if (!clusterId || !clusterType || !title || !query || fetchedCount == null || fetchedCount < 0) {
    return null
  }

  const estimatedCountValue = toNumber(value.estimated_count)
  const estimatedCount = estimatedCountValue != null && estimatedCountValue >= 0 ? estimatedCountValue : null
  const oldest =
    typeof value.sampled_oldest_message_date === 'string' || value.sampled_oldest_message_date == null
      ? value.sampled_oldest_message_date
      : null
  const newest =
    typeof value.sampled_newest_message_date === 'string' || value.sampled_newest_message_date == null
      ? value.sampled_newest_message_date
      : null

  const subjectLinesRaw = Array.isArray(value.sample_subject_lines) ? value.sample_subject_lines : []
  const sampleSubjectLines = subjectLinesRaw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )

  const snippetsRaw = Array.isArray(value.snippet_previews) ? value.snippet_previews : []
  const snippetPreviews = snippetsRaw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0
  )

  const reviewedMessagesRaw = Array.isArray(value.reviewed_messages_preview)
    ? value.reviewed_messages_preview
    : []
  const reviewedMessagesPreview = reviewedMessagesRaw
    .map((entry) => {
      if (!isRecord(entry)) return null

      const messageId = typeof entry.message_id === 'string' ? entry.message_id.trim() : ''
      if (!messageId) return null

      const subject =
        typeof entry.subject === 'string' || entry.subject == null ? entry.subject ?? null : null
      const from = typeof entry.from === 'string' || entry.from == null ? entry.from ?? null : null
      const date = typeof entry.date === 'string' || entry.date == null ? entry.date ?? null : null
      const snippet =
        typeof entry.snippet === 'string' || entry.snippet == null ? entry.snippet ?? null : null
      const threadId =
        typeof entry.thread_id === 'string' && entry.thread_id.trim()
          ? entry.thread_id.trim()
          : undefined
      const historyId =
        typeof entry.history_id === 'string' && entry.history_id.trim()
          ? entry.history_id.trim()
          : undefined
      const internalDateMs = toNumber(entry.internal_date_ms)
      const categoryLabels = Array.isArray(entry.category_labels)
        ? entry.category_labels
            .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
            .map((label) => label.trim())
        : undefined
      const labelIds = Array.isArray(entry.label_ids)
        ? entry.label_ids
            .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
            .map((label) => label.trim())
        : undefined
      const isInInbox =
        typeof entry.is_in_inbox === 'boolean'
          ? entry.is_in_inbox
          : labelIds
            ? labelIds.includes('INBOX')
            : undefined
      const isUnread =
        typeof entry.is_unread === 'boolean'
          ? entry.is_unread
          : labelIds
            ? labelIds.includes('UNREAD')
            : undefined
      const isImportant =
        typeof entry.is_important === 'boolean'
          ? entry.is_important
          : labelIds
            ? labelIds.includes('IMPORTANT')
            : undefined
      const isStarred =
        typeof entry.is_starred === 'boolean'
          ? entry.is_starred
          : labelIds
            ? labelIds.includes('STARRED')
            : undefined

      return {
        message_id: messageId,
        ...(threadId ? { thread_id: threadId } : {}),
        ...(historyId ? { history_id: historyId } : {}),
        ...(internalDateMs != null ? { internal_date_ms: internalDateMs } : {}),
        subject,
        from,
        date,
        snippet,
        ...(labelIds && labelIds.length > 0 ? { label_ids: Array.from(new Set(labelIds)) } : {}),
        ...(categoryLabels && categoryLabels.length > 0
          ? { category_labels: Array.from(new Set(categoryLabels)) }
          : {}),
        ...(isInInbox != null ? { is_in_inbox: isInInbox } : {}),
        ...(isUnread != null ? { is_unread: isUnread } : {}),
        ...(isImportant != null ? { is_important: isImportant } : {}),
        ...(isStarred != null ? { is_starred: isStarred } : {}),
      }
    })
    .filter(
      (
        entry
      ): entry is {
        message_id: string
        subject: string | null
        from: string | null
        date: string | null
        snippet: string | null
        thread_id?: string
        history_id?: string
        internal_date_ms?: number
        label_ids?: string[]
        category_labels?: string[]
        is_in_inbox?: boolean
        is_unread?: boolean
        is_important?: boolean
        is_starred?: boolean
      } => entry != null
    )

  const riskNote =
    typeof value.risk_note === 'string' && value.risk_note.trim()
      ? value.risk_note.trim()
      : 'Review this cluster before any mutation action.'
  const safetyNote =
    typeof value.safety_note === 'string' && value.safety_note.trim()
      ? value.safety_note.trim()
      : 'Read-only bounded sample; confirm exact query and message preview before approval.'

  return {
    cluster_id: clusterId,
    cluster_type: clusterType,
    title,
    query,
    estimated_count: estimatedCount,
    fetched_count: fetchedCount,
    sampled_oldest_message_date: oldest ?? null,
    sampled_newest_message_date: newest ?? null,
    sample_subject_lines: sampleSubjectLines,
    snippet_previews: snippetPreviews,
    reviewed_messages_preview: reviewedMessagesPreview,
    risk_note: riskNote,
    safety_note: safetyNote,
  }
}

function parseRuntimeArchiveData(value: unknown): RuntimeArchiveData | null {
  if (!isRecord(value)) return null

  const requestedCount = toNumber(value.requested_count)
  const archivedCount = toNumber(value.archived_count)
  if (requestedCount == null || archivedCount == null) return null
  if (requestedCount < 0 || archivedCount < 0) return null

  const sender =
    typeof value.sender === 'string' && value.sender.trim()
      ? value.sender.trim()
      : value.sender == null
      ? null
      : null
  const batchTitle =
    typeof value.batch_title === 'string' && value.batch_title.trim()
      ? value.batch_title.trim()
      : value.batch_title == null
      ? null
      : null

  const messageIdsRaw = Array.isArray(value.message_ids) ? value.message_ids : []
  const seen = new Set<string>()
  const messageIds: string[] = []
  for (const entry of messageIdsRaw) {
    if (typeof entry !== 'string') continue
    const id = entry.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    messageIds.push(id)
  }

  return {
    sender,
    batch_title: batchTitle,
    requested_count: requestedCount,
    archived_count: archivedCount,
    message_ids: messageIds,
  }
}

export async function loadLatestPlaygroundSessionId(params: {
  supabase: SupabaseAdminClient
  agentId: string
  origin?: 'playground' | 'playground_review_detail'
}): Promise<string | null> {
  const origin = params.origin === 'playground_review_detail' ? 'playground_review_detail' : 'playground'
  const { data, error } = await params.supabase
    .from('agent_sessions')
    .select('id')
    .eq('agent_id', params.agentId)
    .eq('origin', origin)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[playground] latest session lookup failed (non-fatal):', error)
    return null
  }

  const row = data as AgentSessionRow | null
  return row?.id && row.id.trim() ? row.id.trim() : null
}

export async function loadPlaygroundSessionMessages(params: {
  supabase: SupabaseAdminClient
  agentId: string
  sessionId: string
}): Promise<SessionChatMessage[] | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('payload,created_at')
    .eq('agent_id', params.agentId)
    .eq('session_id', params.sessionId)
    .eq('event_type', 'playground.session_snapshot')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[playground] session snapshot lookup failed (non-fatal):', error)
    return null
  }

  const payload = parseRecordPayload((data as { payload?: unknown } | null)?.payload)
  if (!payload || !Array.isArray(payload.messages)) return null

  const messages = payload.messages
    .map((entry) => {
      if (!isRecord(entry)) return null
      const role = entry.role === 'user' || entry.role === 'assistant' ? entry.role : null
      const content = typeof entry.content === 'string' ? entry.content : null
      if (!role || content == null) return null
      return { role, content }
    })
    .filter((entry): entry is SessionChatMessage => entry != null)
    .slice(-40)

  return messages.length > 0 ? messages : null
}

export async function loadLatestAnalyzeInboxEvidence(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<RuntimeEvidence | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('created_at,payload')
    .eq('agent_id', params.agentId)
    .eq('event_type', 'execution_result')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.warn('[playground] execution_result lookup failed (non-fatal):', error)
    return null
  }

  for (const row of (data || []) as ExecutionResultEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const results = Array.isArray(payload.results) ? payload.results : []
    for (const result of results) {
      if (!isRecord(result)) continue
      if (result.tool !== 'gmail' || result.action !== 'analyze_inbox' || result.success !== true) {
        continue
      }

      const parsedAnalysis = parseRuntimeInboxAnalysisData(result.inbox_analysis)
      if (!parsedAnalysis) continue

      const executedAt =
        typeof payload.executed_at === 'string' && payload.executed_at.trim()
          ? payload.executed_at
          : typeof row.created_at === 'string' && row.created_at.trim()
          ? row.created_at
          : new Date().toISOString()

      const approvalId =
        typeof payload.approval_id === 'string' && payload.approval_id.trim()
          ? payload.approval_id
          : ''

      return {
        source_event_type: 'execution_result',
        executed_at: executedAt,
        approval_id: approvalId,
        tool: 'gmail',
        action: 'analyze_inbox',
        inbox_analysis: parsedAnalysis,
      }
    }
  }

  return null
}

export async function loadLatestSenderClusterReviewEvidence(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<RuntimeReviewEvidence | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('created_at,payload')
    .eq('agent_id', params.agentId)
    .eq('event_type', 'execution_result')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.warn('[playground] sender-cluster execution_result lookup failed (non-fatal):', error)
    return null
  }

  for (const row of (data || []) as ExecutionResultEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const results = Array.isArray(payload.results) ? payload.results : []
    for (const result of results) {
      if (!isRecord(result)) continue
      if (result.tool !== 'gmail' || result.action !== 'review_sender_cluster' || result.success !== true) {
        continue
      }

      const parsedReview = parseRuntimeSenderReviewData(result.sender_review)
      if (!parsedReview) continue

      const executedAt =
        typeof payload.executed_at === 'string' && payload.executed_at.trim()
          ? payload.executed_at
          : typeof row.created_at === 'string' && row.created_at.trim()
          ? row.created_at
          : new Date().toISOString()

      const approvalId =
        typeof payload.approval_id === 'string' && payload.approval_id.trim()
          ? payload.approval_id
          : ''

      return {
        source_event_type: 'execution_result',
        executed_at: executedAt,
        approval_id: approvalId,
        tool: 'gmail',
        action: 'review_sender_cluster',
        sender_review: parsedReview,
      }
    }
  }

  return null
}

export async function loadLatestQueryClusterReviewEvidence(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<RuntimeQueryReviewEvidence | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('created_at,payload')
    .eq('agent_id', params.agentId)
    .eq('event_type', 'execution_result')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.warn('[playground] query-cluster execution_result lookup failed (non-fatal):', error)
    return null
  }

  for (const row of (data || []) as ExecutionResultEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const results = Array.isArray(payload.results) ? payload.results : []
    for (const result of results) {
      if (!isRecord(result)) continue
      if (result.tool !== 'gmail' || result.action !== 'review_query_cluster' || result.success !== true) {
        continue
      }

      const parsedReview = parseRuntimeQueryReviewData(result.query_review)
      if (!parsedReview) continue

      const executedAt =
        typeof payload.executed_at === 'string' && payload.executed_at.trim()
          ? payload.executed_at
          : typeof row.created_at === 'string' && row.created_at.trim()
          ? row.created_at
          : new Date().toISOString()

      const approvalId =
        typeof payload.approval_id === 'string' && payload.approval_id.trim()
          ? payload.approval_id
          : ''

      return {
        source_event_type: 'execution_result',
        executed_at: executedAt,
        approval_id: approvalId,
        tool: 'gmail',
        action: 'review_query_cluster',
        query_review: parsedReview,
      }
    }
  }

  return null
}

export async function loadLatestArchiveExecutionEvidence(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<RuntimeArchiveEvidence | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('created_at,payload')
    .eq('agent_id', params.agentId)
    .eq('event_type', 'execution_result')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.warn('[playground] archive execution_result lookup failed (non-fatal):', error)
    return null
  }

  for (const row of (data || []) as ExecutionResultEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const results = Array.isArray(payload.results) ? payload.results : []
    for (const result of results) {
      if (!isRecord(result)) continue
      if (result.tool !== 'gmail' || result.action !== 'archive_messages' || result.success !== true) {
        continue
      }

      const parsedArchive = parseRuntimeArchiveData(result.archive_result)
      if (!parsedArchive) continue

      const executedAt =
        typeof payload.executed_at === 'string' && payload.executed_at.trim()
          ? payload.executed_at
          : typeof row.created_at === 'string' && row.created_at.trim()
          ? row.created_at
          : new Date().toISOString()

      const approvalId =
        typeof payload.approval_id === 'string' && payload.approval_id.trim()
          ? payload.approval_id
          : ''

      return {
        source_event_type: 'execution_result',
        executed_at: executedAt,
        approval_id: approvalId,
        tool: 'gmail',
        action: 'archive_messages',
        archive_result: parsedArchive,
      }
    }
  }

  return null
}

export async function loadRecentReviewResults(params: {
  supabase: SupabaseAdminClient
  agentId: string
  limit?: number
}): Promise<RuntimeReviewResultItem[]> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('created_at,payload')
    .eq('agent_id', params.agentId)
    .eq('event_type', 'execution_result')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('[playground] review-result history lookup failed (non-fatal):', error)
    return []
  }

  const targetLimit = Number.isFinite(params.limit || 0) && (params.limit || 0) > 0 ? Math.round(params.limit || 0) : 20
  const results: RuntimeReviewResultItem[] = []
  const seenKeys = new Set<string>()

  for (const row of (data || []) as ExecutionResultEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const executedAt =
      typeof payload.executed_at === 'string' && payload.executed_at.trim()
        ? payload.executed_at
        : typeof row.created_at === 'string' && row.created_at.trim()
          ? row.created_at
          : new Date().toISOString()
    const approvalId =
      typeof payload.approval_id === 'string' && payload.approval_id.trim()
        ? payload.approval_id.trim()
        : ''

    const rowResults = Array.isArray(payload.results) ? payload.results : []
    for (const result of rowResults) {
      if (!isRecord(result) || result.tool !== 'gmail' || result.success !== true) continue

      if (result.action === 'review_sender_cluster') {
        const parsed = parseRuntimeSenderReviewData(result.sender_review)
        if (!parsed) continue
        const key = `${approvalId}|review_sender_cluster|${executedAt}|${parsed.sender}`
        if (seenKeys.has(key)) continue
        seenKeys.add(key)
        results.push({
          id: key,
          kind: 'review_sender_cluster',
          executed_at: executedAt,
          approval_id: approvalId,
          title: parsed.sender ? `${parsed.sender} sender review` : 'Sender cluster review',
          objective: 'Review this sender cluster before any cleanup mutation is proposed.',
          source_label: parsed.sender || 'Sender cluster',
          cluster_id: null,
          cluster_type: 'sender_cluster',
          sender: parsed.sender || null,
          query: null,
          estimated_count: null,
          fetched_count: parsed.fetched_count,
          sample_subject_lines: parsed.sample_subject_lines,
          snippet_previews: parsed.snippet_previews,
          messages: parsed.messages,
          risk_note: null,
          safety_note: 'Read-only bounded sender preview. No inbox changes in this review step.',
        })
        if (results.length >= targetLimit) return results
        continue
      }

      if (result.action === 'review_query_cluster') {
        const parsed = parseRuntimeQueryReviewData(result.query_review)
        if (!parsed) continue
        const key = `${approvalId}|review_query_cluster|${executedAt}|${parsed.cluster_id}`
        if (seenKeys.has(key)) continue
        seenKeys.add(key)
        results.push({
          id: key,
          kind: 'review_query_cluster',
          executed_at: executedAt,
          approval_id: approvalId,
          title: parsed.title,
          objective: 'Review this query-backed cluster before any cleanup mutation is proposed.',
          source_label: parsed.title,
          cluster_id: parsed.cluster_id,
          cluster_type: parsed.cluster_type,
          sender: null,
          query: parsed.query,
          estimated_count: parsed.estimated_count,
          fetched_count: parsed.fetched_count,
          sample_subject_lines: parsed.sample_subject_lines,
          snippet_previews: parsed.snippet_previews,
          messages: parsed.reviewed_messages_preview,
          risk_note: parsed.risk_note,
          safety_note: parsed.safety_note,
        })
        if (results.length >= targetLimit) return results
      }
    }
  }

  return results
}

export async function loadRuntimeSuggestionHistory(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<RuntimeSuggestionHistory> {
  const empty: RuntimeSuggestionHistory = {
    requests: [],
    latest_decision_by_approval: new Map<string, 'approved' | 'rejected'>(),
    executed_approvals: new Set<string>(),
  }

  const { data, error } = await params.supabase
    .from('agent_events')
    .select('event_type,created_at,payload')
    .eq('agent_id', params.agentId)
    .in('event_type', ['approval_request', 'approval_decision', 'execution_result'])
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.warn('[playground] suggestion lifecycle lookup failed (non-fatal):', error)
    return empty
  }

  const requests: RuntimeSuggestionHistoryRequest[] = []
  const latestDecisionByApproval = new Map<string, 'approved' | 'rejected'>()
  const executedApprovals = new Set<string>()

  for (const row of (data || []) as AgentEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    if (row.event_type === 'approval_request') {
      const approvalId =
        typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
      if (!approvalId) continue

      const proposedActions = parseRuntimeActionCandidates(payload.proposed_actions)
      if (proposedActions.length === 0) continue

      requests.push({
        approval_id: approvalId,
        created_at:
          typeof row.created_at === 'string' && row.created_at.trim()
            ? row.created_at
            : new Date().toISOString(),
        session_id:
          typeof payload.session_id === 'string' && payload.session_id.trim()
            ? payload.session_id.trim()
            : undefined,
        user_request:
          typeof payload.user_request === 'string' && payload.user_request.trim()
            ? payload.user_request.trim()
            : undefined,
        proposed_actions: proposedActions,
      })
      continue
    }

    if (row.event_type === 'approval_decision') {
      const approvalId =
        typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
      const decision =
        payload.decision === 'approved' || payload.decision === 'rejected'
          ? payload.decision
          : null
      if (!approvalId || !decision) continue
      if (!latestDecisionByApproval.has(approvalId)) {
        latestDecisionByApproval.set(approvalId, decision)
      }
      continue
    }

    if (row.event_type === 'execution_result') {
      const approvalId =
        typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
      if (!approvalId) continue
      executedApprovals.add(approvalId)
    }
  }

  return {
    requests,
    latest_decision_by_approval: latestDecisionByApproval,
    executed_approvals: executedApprovals,
  }
}

export async function loadPlaygroundRuntimeStateInputsWithTiming(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<{
  runtimeInputs: PlaygroundRuntimeStateInputs
  timingMs: PlaygroundRuntimeStateInputLoadTimingMs
}> {
  const startedAt = Date.now()
  const timingMs: PlaygroundRuntimeStateInputLoadTimingMs = {
    analyze_inbox_evidence_ms: 0,
    sender_cluster_review_ms: 0,
    query_cluster_review_ms: 0,
    archive_evidence_ms: 0,
    review_results_ms: 0,
    suggestion_history_ms: 0,
    runtime_inputs_total_ms: 0,
  }

  const timed = async <T>(
    key: Exclude<keyof PlaygroundRuntimeStateInputLoadTimingMs, 'runtime_inputs_total_ms'>,
    loader: () => Promise<T>
  ): Promise<T> => {
    const loaderStartedAt = Date.now()
    try {
      return await loader()
    } finally {
      timingMs[key] = Date.now() - loaderStartedAt
    }
  }

  const [
    runtimeEvidence,
    latestRuntimeReviewEvidence,
    latestRuntimeQueryReviewEvidence,
    latestRuntimeArchiveEvidence,
    reviewResults,
    runtimeSuggestionHistory,
  ] = await Promise.all([
    timed('analyze_inbox_evidence_ms', () => loadLatestAnalyzeInboxEvidence(params)),
    timed('sender_cluster_review_ms', () => loadLatestSenderClusterReviewEvidence(params)),
    timed('query_cluster_review_ms', () => loadLatestQueryClusterReviewEvidence(params)),
    timed('archive_evidence_ms', () => loadLatestArchiveExecutionEvidence(params)),
    timed('review_results_ms', () => loadRecentReviewResults(params)),
    timed('suggestion_history_ms', () => loadRuntimeSuggestionHistory(params)),
  ])

  timingMs.runtime_inputs_total_ms = Date.now() - startedAt

  return {
    runtimeInputs: {
      runtimeEvidence,
      latestRuntimeReviewEvidence,
      latestRuntimeQueryReviewEvidence,
      latestRuntimeArchiveEvidence,
      reviewResults,
      runtimeSuggestionHistory,
    },
    timingMs,
  }
}

export async function loadPlaygroundRuntimeStateInputs(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<PlaygroundRuntimeStateInputs> {
  const loaded = await loadPlaygroundRuntimeStateInputsWithTiming(params)
  return loaded.runtimeInputs
}
