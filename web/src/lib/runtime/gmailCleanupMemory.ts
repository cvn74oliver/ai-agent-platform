import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GmailDecisionManagementSummaryData,
  GmailCleanupMemoryWritePayload,
  GmailDestinationExecutionState,
  GmailDestinationState,
  GmailMonitoringSummaryData,
  GmailSenderPolicy,
  GmailSenderDestinationHistoryItem,
  GmailSenderDestinationProfile,
  GmailSenderDestinationTrustSignals,
} from '@/lib/runtime/gmailCleanupWorkspace'

const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const GMAIL_MEMORY_SOURCE_TYPES = new Set([
  'gmail_sender_policy_memory',
  'gmail_rule_intent_memory',
])
const GMAIL_DESTINATION_PROFILE_SOURCE_TYPE = 'gmail_sender_destination_profile'

type GmailMemoryEventRow = {
  id?: string | null
  event_type: string | null
  created_at: string | null
  payload: unknown
}

type GmailMemoryDocRow = {
  source_type: string | null
  source_url: string | null
  title: string | null
  content: string | null
  embedding: unknown
  created_at: string | null
  meta?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normalizeSenderPolicy(
  value: unknown
): Exclude<GmailSenderPolicy, 'undecided'> | null {
  return value === 'keep' ||
    value === 'archive' ||
    value === 'quarantine' ||
    value === 'unsubscribe' ||
    value === 'custom_rule'
    ? value
    : null
}

function normalizeDestinationState(value: unknown): GmailDestinationState | null {
  return value === 'KEEP' ||
    value === 'ARCHIVE' ||
    value === 'QUARANTINE' ||
    value === 'UNSUBSCRIBE' ||
    value === 'CUSTOM_RULE'
    ? value
    : null
}

function normalizeDestinationExecutionState(
  value: unknown
): GmailDestinationExecutionState | null {
  return value === 'not_applicable' ||
    value === 'pending' ||
    value === 'succeeded' ||
    value === 'failed' ||
    value === 'deferred'
    ? value
    : null
}

function destinationLabel(value: GmailDestinationState): string {
  if (value === 'KEEP') return 'Keep'
  if (value === 'ARCHIVE') return 'Archive'
  if (value === 'QUARANTINE') return 'Quarantine'
  if (value === 'UNSUBSCRIBE') return 'Unsubscribe'
  return 'Custom Rule'
}

function defaultExecutionStateForDestination(
  state: GmailDestinationState
): {
  executionState: GmailDestinationExecutionState
  executionWarning: string | null
} {
  if (state === 'ARCHIVE') {
    return {
      executionState: 'pending',
      executionWarning: 'Archive execution has not been independently confirmed yet.',
    }
  }
  if (state === 'KEEP') {
    return {
      executionState: 'not_applicable',
      executionWarning: null,
    }
  }
  return {
    executionState: 'deferred',
    executionWarning: 'Phase 1 stores this destination state, but its downstream executor is deferred.',
  }
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function normalizeTrustSignals(value: unknown): GmailSenderDestinationTrustSignals | null {
  if (!isRecord(value)) return null
  return {
    sender_signal:
      value.sender_signal === 'likely_machine_generated' ||
      value.sender_signal === 'likely_human' ||
      value.sender_signal === 'uncertain'
        ? value.sender_signal
        : null,
    category_summary: normalizeText(value.category_summary) || null,
    dominant_pattern: normalizeText(value.dominant_pattern) || null,
    protected_hint: normalizeText(value.protected_hint) || null,
    requires_verification: value.requires_verification === true,
    verification_reasons: normalizeStringArray(value.verification_reasons),
    cleanup_group_message_count:
      typeof value.cleanup_group_message_count === 'number' &&
      Number.isFinite(value.cleanup_group_message_count)
        ? value.cleanup_group_message_count
        : null,
    total_sender_messages:
      typeof value.total_sender_messages === 'number' && Number.isFinite(value.total_sender_messages)
        ? value.total_sender_messages
        : null,
    unread_count:
      typeof value.unread_count === 'number' && Number.isFinite(value.unread_count)
        ? value.unread_count
        : null,
    last_activity: normalizeText(value.last_activity) || null,
  }
}

function mergeTrustSignals(
  existing: GmailSenderDestinationTrustSignals | null,
  incoming: GmailSenderDestinationTrustSignals | null
): GmailSenderDestinationTrustSignals | null {
  if (!existing) return incoming
  if (!incoming) return existing
  return {
    sender_signal: incoming.sender_signal || existing.sender_signal,
    category_summary: incoming.category_summary || existing.category_summary,
    dominant_pattern: incoming.dominant_pattern || existing.dominant_pattern,
    protected_hint: incoming.protected_hint || existing.protected_hint,
    requires_verification: incoming.requires_verification || existing.requires_verification,
    verification_reasons:
      incoming.verification_reasons.length > 0
        ? incoming.verification_reasons
        : existing.verification_reasons,
    cleanup_group_message_count:
      incoming.cleanup_group_message_count ?? existing.cleanup_group_message_count,
    total_sender_messages: incoming.total_sender_messages ?? existing.total_sender_messages,
    unread_count: incoming.unread_count ?? existing.unread_count,
    last_activity: incoming.last_activity || existing.last_activity,
  }
}

function normalizeDestinationHistory(
  value: unknown
): GmailSenderDestinationHistoryItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null
      const destinationState = normalizeDestinationState(entry.destination_state)
      const destinationTimestamp = normalizeText(entry.destination_timestamp)
      const destinationSource = normalizeText(entry.destination_source)
      if (!destinationState || !destinationTimestamp || !destinationSource) return null
      return {
        destination_state: destinationState,
        destination_timestamp: destinationTimestamp,
        destination_source: destinationSource,
        destination_reason: normalizeText(entry.destination_reason) || null,
      }
    })
    .filter((entry): entry is GmailSenderDestinationHistoryItem => entry != null)
}

function normalizeDestinationProfile(value: unknown): GmailSenderDestinationProfile | null {
  if (!isRecord(value)) return null
  const destinationState = normalizeDestinationState(value.destination_state)
  const executionState =
    normalizeDestinationExecutionState(value.execution_state) ||
    defaultExecutionStateForDestination(destinationState || 'KEEP').executionState
  const senderKey = normalizeText(value.sender_key)
  const sender = normalizeText(value.sender)
  const destinationTimestamp = normalizeText(value.destination_timestamp)
  const destinationSource = normalizeText(value.destination_source)
  if (!destinationState || !senderKey || !sender || !destinationTimestamp || !destinationSource) {
    return null
  }
  const history = normalizeDestinationHistory(value.destination_history)
  return {
    sender_key: senderKey,
    sender,
    domain: normalizeText(value.domain) || senderDomain(sender),
    trust_signals: normalizeTrustSignals(value.trust_signals),
    destination_state: destinationState,
    destination_timestamp: destinationTimestamp,
    destination_source: destinationSource,
    destination_reason: normalizeText(value.destination_reason) || null,
    destination_history: history,
    execution_state: executionState,
    execution_timestamp: normalizeText(value.execution_timestamp) || null,
    execution_source: normalizeText(value.execution_source) || null,
    execution_warning: normalizeText(value.execution_warning) || null,
    execution_message_count:
      typeof value.execution_message_count === 'number' && Number.isFinite(value.execution_message_count)
        ? value.execution_message_count
        : null,
    execution_message_ids: normalizeStringArray(value.execution_message_ids),
    last_action_timestamp:
      normalizeText(value.last_action_timestamp) || destinationTimestamp,
  }
}

function senderDomain(sender: string): string | null {
  const email = normalizeText(sender).toLowerCase()
  const at = email.indexOf('@')
  if (at <= 0 || at >= email.length - 1) return null
  return email.slice(at + 1)
}

async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY || !text.trim()) return null
  try {
    const resp = await fetch(EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    })
    const json = await resp.json().catch(() => null)
    const embedding = json?.data?.[0]?.embedding
    return Array.isArray(embedding) ? embedding.map((value: unknown) => Number(value)) : null
  } catch (error) {
    console.warn('[gmail-cleanup-memory] embedding failed:', error)
    return null
  }
}

function parseEmbedding(value: unknown): number[] | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const numbers = value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
    return numbers.length > 0 ? numbers : null
  }
  if (typeof value === 'string' && value.trim()) {
    const cleaned = value.replace(/^\[|\]$/g, '')
    const numbers = cleaned
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
    return numbers.length > 0 ? numbers : null
  }
  return null
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index]
    normA += a[index] * a[index]
    normB += b[index] * b[index]
  }
  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

type NonDestinationMemoryPayload = Omit<GmailCleanupMemoryWritePayload, 'action'> & {
  action: Exclude<GmailCleanupMemoryWritePayload['action'], { type: 'destination_commit' }>
}

function buildMemoryDocument(params: NonDestinationMemoryPayload): {
  sourceType: string
  sourceUrl: string
  title: string
  content: string
  meta: Record<string, unknown>
  eventType: string
  eventPayload: Record<string, unknown>
  mirrorToRag: boolean
} {
  const action = params.action
  if (action.type === 'sender_policy_set' || action.type === 'sender_policy_removed') {
    const domain = senderDomain(action.sender)
    const eventType =
      action.type === 'sender_policy_set' ? 'sender_policy_set' : 'sender_policy_removed'
    return {
      sourceType: 'gmail_sender_policy_memory',
      sourceUrl: `gmail://sender-policy/${encodeURIComponent(action.senderKey)}`,
      title: `${action.sender} -> ${action.policy}`,
      content: [
        `Sender decision for ${action.sender}.`,
        `Policy: ${action.policy}.`,
        params.cluster ? `Cluster: ${params.cluster.title}.` : null,
        domain ? `Domain: ${domain}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      meta: {
        workspace: 'gmail_cleanup',
        sender_key: action.senderKey,
        sender: action.sender,
        domain,
        policy: action.policy,
        cluster: params.cluster,
        session_id: params.sessionId,
      },
      eventType,
      eventPayload: {
        workspace: 'gmail_cleanup',
        session_id: params.sessionId,
        sender_key: action.senderKey,
        sender: action.sender,
        domain,
        policy: action.policy,
        cluster: params.cluster,
      },
      mirrorToRag: action.type === 'sender_policy_set',
    }
  }

  const ruleAction = action as Extract<
    NonDestinationMemoryPayload['action'],
    { type: 'rule_intent_set' | 'rule_intent_removed' }
  >
  const domain = senderDomain(ruleAction.sender)
  const isCreate = ruleAction.type === 'rule_intent_set'
  return {
    sourceType: 'gmail_rule_intent_memory',
    sourceUrl: `gmail://rule-intent/${encodeURIComponent(ruleAction.intentType)}/${encodeURIComponent(ruleAction.senderKey)}`,
    title: `${ruleAction.sender} -> ${ruleAction.label}`,
    content: [
      `Rule intent for ${ruleAction.sender}.`,
      `Intent: ${ruleAction.intentType}.`,
      `Label: ${ruleAction.label}.`,
      ruleAction.description,
      params.cluster ? `Cluster: ${params.cluster.title}.` : null,
      domain ? `Domain: ${domain}.` : null,
    ]
      .filter(Boolean)
      .join(' '),
    meta: {
      workspace: 'gmail_cleanup',
      sender_key: ruleAction.senderKey,
      sender: ruleAction.sender,
      domain,
      intent_type: ruleAction.intentType,
      label: ruleAction.label,
      description: ruleAction.description,
      cluster: params.cluster,
      session_id: params.sessionId,
    },
    eventType: isCreate ? 'rule_created' : 'rule_rejected',
    eventPayload: {
      workspace: 'gmail_cleanup',
      session_id: params.sessionId,
      sender_key: ruleAction.senderKey,
      sender: ruleAction.sender,
      domain,
      intent_type: ruleAction.intentType,
      label: ruleAction.label,
      description: ruleAction.description,
      cluster: params.cluster,
    },
    mirrorToRag: isCreate,
  }
}

function destinationProfileSourceUrl(senderKey: string): string {
  return `gmail://sender-destination/${encodeURIComponent(senderKey)}`
}

function destinationSummary(state: GmailDestinationState, sender: string, reason: string | null): string {
  const label = destinationLabel(state)
  const reasonText = reason ? ` ${reason}` : ''
  return `${sender} is currently managed in ${label}.${reasonText}`
}

async function persistGmailDestinationCommit(params: {
  supabase: SupabaseClient
  agentId: string
  payload: Extract<GmailCleanupMemoryWritePayload['action'], { type: 'destination_commit' }>
  sessionId: string | null
  cluster: GmailCleanupMemoryWritePayload['cluster']
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const senderKeys = params.payload.senders.map((entry) => entry.senderKey).filter(Boolean)
  const sourceUrls = senderKeys.map((senderKey) => destinationProfileSourceUrl(senderKey))

  const existingProfilesBySender = new Map<string, GmailSenderDestinationProfile>()
  if (sourceUrls.length > 0) {
    const { data: existingRows, error: existingError } = await params.supabase
      .from('rag_documents')
      .select('meta')
      .eq('agent_id', params.agentId)
      .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
      .in('source_url', sourceUrls)

    if (existingError) {
      console.error('[gmail-cleanup-memory] destination profile lookup failed:', existingError)
      return { ok: false, error: 'Failed to load current sender destination state.' }
    }

    for (const row of (existingRows || []) as Array<{ meta?: unknown }>) {
      const profile = normalizeDestinationProfile(parsePayload(row.meta))
      if (profile) existingProfilesBySender.set(profile.sender_key, profile)
    }
  }

  const createdAt = new Date().toISOString()
  const eventRows: Array<Record<string, unknown>> = []
  const docRows: Array<Record<string, unknown>> = []

  for (const sender of params.payload.senders) {
    const domain = senderDomain(sender.sender)
    const existingProfile = existingProfilesBySender.get(sender.senderKey) || null
    const incomingSignals = normalizeTrustSignals(sender.trustSignals || null)
    const mergedSignals = mergeTrustSignals(existingProfile?.trust_signals || null, incomingSignals)
    const defaultExecution = defaultExecutionStateForDestination(sender.destinationState)

    const nextHistoryEntry: GmailSenderDestinationHistoryItem = {
      destination_state: sender.destinationState,
      destination_timestamp: createdAt,
      destination_source: sender.source,
      destination_reason: sender.reason || null,
    }

    const existingHistory = existingProfile?.destination_history || []
    const shouldAppendHistory =
      existingHistory[0]?.destination_state !== nextHistoryEntry.destination_state ||
      existingHistory[0]?.destination_source !== nextHistoryEntry.destination_source ||
      existingHistory[0]?.destination_reason !== nextHistoryEntry.destination_reason

    const nextHistory = shouldAppendHistory
      ? [nextHistoryEntry, ...existingHistory].slice(0, 25)
      : existingHistory

    const nextProfile: GmailSenderDestinationProfile = {
      sender_key: sender.senderKey,
      sender: sender.sender,
      domain,
      trust_signals: mergedSignals,
      destination_state: sender.destinationState,
      destination_timestamp:
        shouldAppendHistory || !existingProfile?.destination_timestamp
          ? createdAt
          : existingProfile.destination_timestamp,
      destination_source: sender.source,
      destination_reason: sender.reason || null,
      destination_history: nextHistory,
      execution_state: defaultExecution.executionState,
      execution_timestamp:
        defaultExecution.executionState === 'not_applicable' || defaultExecution.executionState === 'deferred'
          ? createdAt
          : null,
      execution_source:
        defaultExecution.executionState === 'not_applicable'
          ? 'destination_commit'
          : defaultExecution.executionState === 'deferred'
            ? 'phase_1_destination_commit'
            : null,
      execution_warning: defaultExecution.executionWarning,
      execution_message_count:
        defaultExecution.executionState === 'not_applicable'
          ? 0
          : sender.destinationState === 'ARCHIVE' &&
              typeof sender.messageCount === 'number' &&
              Number.isFinite(sender.messageCount)
            ? sender.messageCount
            : null,
      execution_message_ids: null,
      last_action_timestamp: createdAt,
    }

    docRows.push({
      agent_id: params.agentId,
      job_id: null,
      source_type: GMAIL_DESTINATION_PROFILE_SOURCE_TYPE,
      source_url: destinationProfileSourceUrl(sender.senderKey),
      title: `${sender.sender} -> ${destinationLabel(sender.destinationState)}`,
      raw_text: destinationSummary(sender.destinationState, sender.sender, sender.reason || null),
      content: destinationSummary(sender.destinationState, sender.sender, sender.reason || null),
      embedding: null,
      meta: {
        workspace: 'gmail_cleanup',
        sender_key: nextProfile.sender_key,
        sender: nextProfile.sender,
        domain: nextProfile.domain,
        trust_signals: nextProfile.trust_signals,
        destination_state: nextProfile.destination_state,
        destination_timestamp: nextProfile.destination_timestamp,
        destination_source: nextProfile.destination_source,
        destination_reason: nextProfile.destination_reason,
        destination_history: nextProfile.destination_history,
        execution_state: nextProfile.execution_state,
        execution_timestamp: nextProfile.execution_timestamp,
        execution_source: nextProfile.execution_source,
        execution_warning: nextProfile.execution_warning,
        execution_message_count: nextProfile.execution_message_count,
        execution_message_ids: nextProfile.execution_message_ids,
        last_action_timestamp: nextProfile.last_action_timestamp,
        cluster: params.cluster,
        session_id: params.sessionId,
        supporting_message_count:
          typeof sender.messageCount === 'number' && Number.isFinite(sender.messageCount)
            ? sender.messageCount
            : null,
      },
      http_status: 200,
      error_code: null,
    })

    const isDuplicate =
      existingProfile?.destination_state === sender.destinationState &&
      existingProfile.destination_source === sender.source &&
      existingProfile.destination_reason === (sender.reason || null)

    if (!isDuplicate) {
      eventRows.push({
        agent_id: params.agentId,
        event_type: 'destination_state_set',
        created_at: createdAt,
        payload: {
          workspace: 'gmail_cleanup',
          sender_key: sender.senderKey,
          sender: sender.sender,
          domain,
          destination_state: sender.destinationState,
          destination_timestamp: createdAt,
          destination_source: sender.source,
          destination_reason: sender.reason || null,
          execution_state: nextProfile.execution_state,
          execution_timestamp: nextProfile.execution_timestamp,
          execution_source: nextProfile.execution_source,
          execution_warning: nextProfile.execution_warning,
          execution_message_count: nextProfile.execution_message_count,
          supporting_message_count:
            typeof sender.messageCount === 'number' && Number.isFinite(sender.messageCount)
              ? sender.messageCount
              : null,
          trust_signals: mergedSignals,
          cluster: params.cluster,
          session_id: params.sessionId,
          recorded_at: createdAt,
        },
      })
    }
  }

  if (eventRows.length > 0) {
    const { error: eventError } = await params.supabase.from('agent_events').insert(eventRows)
    if (eventError) {
      console.error('[gmail-cleanup-memory] destination event insert failed:', eventError)
      return { ok: false, error: 'Failed to store sender destination history.' }
    }
  }

  if (sourceUrls.length > 0) {
    const { error: deleteError } = await params.supabase
      .from('rag_documents')
      .delete()
      .eq('agent_id', params.agentId)
      .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
      .in('source_url', sourceUrls)

    if (deleteError) {
      console.error('[gmail-cleanup-memory] destination profile cleanup failed:', deleteError)
      return { ok: false, error: 'Failed to refresh sender destination profiles.' }
    }
  }

  if (docRows.length > 0) {
    const { error: docError } = await params.supabase.from('rag_documents').insert(docRows)
    if (docError) {
      console.error('[gmail-cleanup-memory] destination profile insert failed:', docError)
      return { ok: false, error: 'Failed to store sender destination profiles.' }
    }
  }

  return { ok: true }
}

async function persistGmailDestinationExecutionUpdate(params: {
  supabase: SupabaseClient
  agentId: string
  payload: Extract<GmailCleanupMemoryWritePayload['action'], { type: 'destination_execution_update' }>
  sessionId: string | null
  cluster: GmailCleanupMemoryWritePayload['cluster']
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const senderKeys = params.payload.senders.map((entry) => entry.senderKey).filter(Boolean)
  const sourceUrls = senderKeys.map((senderKey) => destinationProfileSourceUrl(senderKey))
  if (sourceUrls.length === 0) return { ok: true }

  const { data: existingRows, error: existingError } = await params.supabase
    .from('rag_documents')
    .select('meta')
    .eq('agent_id', params.agentId)
    .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
    .in('source_url', sourceUrls)

  if (existingError) {
    console.error('[gmail-cleanup-memory] destination execution profile lookup failed:', existingError)
    return { ok: false, error: 'Failed to load sender destination execution state.' }
  }

  const existingProfilesBySender = new Map<string, GmailSenderDestinationProfile>()
  for (const row of (existingRows || []) as Array<{ meta?: unknown }>) {
    const profile = normalizeDestinationProfile(parsePayload(row.meta))
    if (profile) existingProfilesBySender.set(profile.sender_key, profile)
  }

  const updatedAt = new Date().toISOString()
  const docRows: Array<Record<string, unknown>> = []
  const eventRows: Array<Record<string, unknown>> = []

  for (const sender of params.payload.senders) {
    const existingProfile = existingProfilesBySender.get(sender.senderKey)
    if (!existingProfile) continue
    const executionTimestamp =
      (typeof sender.executionTimestamp === 'string' && sender.executionTimestamp.trim()) || updatedAt
    const nextProfile: GmailSenderDestinationProfile = {
      ...existingProfile,
      execution_state: sender.executionState,
      execution_timestamp: executionTimestamp,
      execution_source: sender.executionSource,
      execution_warning:
        typeof sender.executionWarning === 'string' && sender.executionWarning.trim()
          ? sender.executionWarning.trim()
          : null,
      execution_message_count:
        typeof sender.executionMessageCount === 'number' && Number.isFinite(sender.executionMessageCount)
          ? sender.executionMessageCount
          : existingProfile.execution_message_count,
      execution_message_ids:
        Array.isArray(sender.executionMessageIds)
          ? normalizeStringArray(sender.executionMessageIds)
          : existingProfile.execution_message_ids,
      last_action_timestamp: updatedAt,
    }

    docRows.push({
      agent_id: params.agentId,
      job_id: null,
      source_type: GMAIL_DESTINATION_PROFILE_SOURCE_TYPE,
      source_url: destinationProfileSourceUrl(sender.senderKey),
      title: `${sender.sender} -> ${destinationLabel(existingProfile.destination_state)}`,
      raw_text: destinationSummary(existingProfile.destination_state, sender.sender, existingProfile.destination_reason),
      content: destinationSummary(existingProfile.destination_state, sender.sender, existingProfile.destination_reason),
      embedding: null,
      meta: {
        workspace: 'gmail_cleanup',
        sender_key: nextProfile.sender_key,
        sender: nextProfile.sender,
        domain: nextProfile.domain,
        trust_signals: nextProfile.trust_signals,
        destination_state: nextProfile.destination_state,
        destination_timestamp: nextProfile.destination_timestamp,
        destination_source: nextProfile.destination_source,
        destination_reason: nextProfile.destination_reason,
        destination_history: nextProfile.destination_history,
        execution_state: nextProfile.execution_state,
        execution_timestamp: nextProfile.execution_timestamp,
        execution_source: nextProfile.execution_source,
        execution_warning: nextProfile.execution_warning,
        execution_message_count: nextProfile.execution_message_count,
        execution_message_ids: nextProfile.execution_message_ids,
        last_action_timestamp: nextProfile.last_action_timestamp,
        cluster: params.cluster,
        session_id: params.sessionId,
      },
      http_status: 200,
      error_code: null,
    })

    const changed =
      existingProfile.execution_state !== nextProfile.execution_state ||
      existingProfile.execution_warning !== nextProfile.execution_warning ||
      existingProfile.execution_message_count !== nextProfile.execution_message_count ||
      JSON.stringify(existingProfile.execution_message_ids || []) !==
        JSON.stringify(nextProfile.execution_message_ids || [])

    if (changed) {
      eventRows.push({
        agent_id: params.agentId,
        event_type: 'destination_execution_updated',
        created_at: updatedAt,
        payload: {
          workspace: 'gmail_cleanup',
          sender_key: nextProfile.sender_key,
          sender: nextProfile.sender,
          domain: nextProfile.domain,
          destination_state: nextProfile.destination_state,
          execution_state: nextProfile.execution_state,
          execution_timestamp: nextProfile.execution_timestamp,
          execution_source: nextProfile.execution_source,
          execution_warning: nextProfile.execution_warning,
          execution_message_count: nextProfile.execution_message_count,
          execution_message_ids: nextProfile.execution_message_ids,
          cluster: params.cluster,
          session_id: params.sessionId,
          recorded_at: updatedAt,
        },
      })
    }
  }

  if (eventRows.length > 0) {
    const { error: eventError } = await params.supabase.from('agent_events').insert(eventRows)
    if (eventError) {
      console.error('[gmail-cleanup-memory] destination execution event insert failed:', eventError)
      return { ok: false, error: 'Failed to store destination execution history.' }
    }
  }

  if (docRows.length > 0) {
    const { error: deleteError } = await params.supabase
      .from('rag_documents')
      .delete()
      .eq('agent_id', params.agentId)
      .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
      .in(
        'source_url',
        docRows.map((row) => String(row.source_url))
      )

    if (deleteError) {
      console.error('[gmail-cleanup-memory] destination execution profile cleanup failed:', deleteError)
      return { ok: false, error: 'Failed to refresh destination execution state.' }
    }

    const { error: insertError } = await params.supabase.from('rag_documents').insert(docRows)
    if (insertError) {
      console.error('[gmail-cleanup-memory] destination execution profile insert failed:', insertError)
      return { ok: false, error: 'Failed to store destination execution state.' }
    }
  }

  return { ok: true }
}

async function persistGmailDestinationStateClear(params: {
  supabase: SupabaseClient
  agentId: string
  payload: Extract<GmailCleanupMemoryWritePayload['action'], { type: 'destination_state_clear' }>
  sessionId: string | null
  cluster: GmailCleanupMemoryWritePayload['cluster']
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const sourceUrl = destinationProfileSourceUrl(params.payload.senderKey)
  const { data: existingRows, error: existingError } = await params.supabase
    .from('rag_documents')
    .select('meta')
    .eq('agent_id', params.agentId)
    .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
    .eq('source_url', sourceUrl)
    .limit(1)

  if (existingError) {
    console.error('[gmail-cleanup-memory] destination clear lookup failed:', existingError)
    return { ok: false, error: 'Failed to load current destination state.' }
  }

  const existingProfile = normalizeDestinationProfile(parsePayload(existingRows?.[0]?.meta))
  const updatedAt = new Date().toISOString()
  const { error: deleteError } = await params.supabase
    .from('rag_documents')
    .delete()
    .eq('agent_id', params.agentId)
    .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
    .eq('source_url', sourceUrl)

  if (deleteError) {
    console.error('[gmail-cleanup-memory] destination clear delete failed:', deleteError)
    return { ok: false, error: 'Failed to remove destination state.' }
  }

  const { error: eventError } = await params.supabase.from('agent_events').insert([
    {
      agent_id: params.agentId,
      event_type: 'destination_state_cleared',
      created_at: updatedAt,
      payload: {
        workspace: 'gmail_cleanup',
        sender_key: params.payload.senderKey,
        sender: params.payload.sender,
        previous_destination_state: existingProfile?.destination_state || null,
        previous_execution_state: existingProfile?.execution_state || null,
        clear_reason: params.payload.reason,
        cluster: params.cluster,
        session_id: params.sessionId,
        recorded_at: updatedAt,
      },
    },
  ])

  if (eventError) {
    console.error('[gmail-cleanup-memory] destination clear event insert failed:', eventError)
    return { ok: false, error: 'Failed to record destination clear history.' }
  }

  return { ok: true }
}

export async function persistGmailCleanupMemory(params: {
  supabase: SupabaseClient
  agentId: string
  payload: GmailCleanupMemoryWritePayload
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.payload.action.type === 'destination_commit') {
    return persistGmailDestinationCommit({
      supabase: params.supabase,
      agentId: params.agentId,
      payload: params.payload.action,
      sessionId: params.payload.sessionId,
      cluster: params.payload.cluster,
    })
  }

  if (params.payload.action.type === 'destination_execution_update') {
    return persistGmailDestinationExecutionUpdate({
      supabase: params.supabase,
      agentId: params.agentId,
      payload: params.payload.action,
      sessionId: params.payload.sessionId,
      cluster: params.payload.cluster,
    })
  }

  if (params.payload.action.type === 'destination_state_clear') {
    return persistGmailDestinationStateClear({
      supabase: params.supabase,
      agentId: params.agentId,
      payload: params.payload.action,
      sessionId: params.payload.sessionId,
      cluster: params.payload.cluster,
    })
  }

  const document = buildMemoryDocument(params.payload as NonDestinationMemoryPayload)
  const createdAt = new Date().toISOString()

  const { error: eventError } = await params.supabase.from('agent_events').insert([
    {
      agent_id: params.agentId,
      event_type: document.eventType,
      created_at: createdAt,
      payload: {
        ...document.eventPayload,
        recorded_at: createdAt,
      },
    },
  ])

  if (eventError) {
    console.error('[gmail-cleanup-memory] event insert failed:', eventError)
    return { ok: false, error: 'Failed to store Gmail cleanup event memory.' }
  }

  const embedding = await embedText(document.content)
  await params.supabase
    .from('rag_documents')
    .delete()
    .eq('agent_id', params.agentId)
    .eq('source_url', document.sourceUrl)
    .eq('source_type', document.sourceType)

  if (document.mirrorToRag) {
    const { error: ragError } = await params.supabase.from('rag_documents').insert([
      {
        agent_id: params.agentId,
        job_id: null,
        source_type: document.sourceType,
        source_url: document.sourceUrl,
        title: document.title,
        raw_text: document.content,
        content: document.content,
        embedding,
        meta: document.meta,
        http_status: 200,
        error_code: null,
      },
    ])

    if (ragError) {
      console.warn('[gmail-cleanup-memory] rag mirror failed (non-fatal):', ragError)
    }
  }

  return { ok: true }
}

function recommendationId(prefix: string, key: string): string {
  return `${prefix}:${key}`
}

export async function loadGmailMonitoringSummary(params: {
  supabase: SupabaseClient
  agentId: string
  clusterId?: string | null
  clusterTitle?: string | null
  candidateSenders?: Array<{ senderKey: string; sender: string }>
}): Promise<{ ok: true; data: GmailMonitoringSummaryData } | { ok: false; error: string }> {
  const { data: eventRows, error: eventError } = await params.supabase
    .from('agent_events')
    .select('id,event_type,created_at,payload')
    .eq('agent_id', params.agentId)
    .in('event_type', [
      'sender_policy_set',
      'sender_policy_removed',
      'rule_created',
      'rule_rejected',
      'automation_recommendation_generated',
    ])
    .order('created_at', { ascending: false })
    .limit(400)

  if (eventError) {
    console.error('[gmail-cleanup-memory] summary event load failed:', eventError)
    return { ok: false, error: 'Failed to load Gmail cleanup event memory.' }
  }

  const rows = (eventRows || []) as GmailMemoryEventRow[]
  const latestPolicyBySender = new Map<
    string,
    GmailMonitoringSummaryData['learned_policies'][number]
  >()
  const latestRuleBySender = new Map<
    string,
    GmailMonitoringSummaryData['rule_intents'][number]
  >()
  const policyEventCounts = new Map<string, number>()
  const recentEvents: GmailMonitoringSummaryData['recent_events'] = []

  for (const row of rows) {
    const payload = parsePayload(row.payload)
    if (!payload) continue
    const senderKey = normalizeText(payload.sender_key)
    const sender = normalizeText(payload.sender)
    const domain = normalizeText(payload.domain) || senderDomain(sender)
    const createdAt = row.created_at || new Date().toISOString()

    if (recentEvents.length < 20) {
      recentEvents.push({
        id: row.id || `${row.event_type || 'event'}:${createdAt}`,
        event_type: row.event_type || 'unknown',
        created_at: createdAt,
        summary:
          row.event_type === 'sender_policy_set'
            ? `${sender || 'Sender'} learned as ${normalizeText(payload.policy) || 'policy'}`
            : row.event_type === 'rule_created'
              ? `${sender || 'Sender'} created rule intent ${normalizeText(payload.intent_type)}`
              : row.event_type === 'rule_rejected'
                ? `${sender || 'Sender'} removed rule intent ${normalizeText(payload.intent_type)}`
                : row.event_type === 'sender_policy_removed'
                  ? `${sender || 'Sender'} policy removed`
                  : 'Recommendation generated',
      })
    }

    if (row.event_type === 'sender_policy_set') {
      const policy = normalizeSenderPolicy(payload.policy)
      if (!senderKey || !sender || !policy) continue
      if (!latestPolicyBySender.has(senderKey)) {
        latestPolicyBySender.set(senderKey, {
          sender_key: senderKey,
          sender,
          domain,
          policy,
          updated_at: createdAt,
          source: 'agent_events',
          event_count: 0,
        })
      }
      policyEventCounts.set(senderKey, (policyEventCounts.get(senderKey) || 0) + 1)
      continue
    }

    if (row.event_type === 'sender_policy_removed') {
      if (senderKey) latestPolicyBySender.delete(senderKey)
      continue
    }

    if (row.event_type === 'rule_created') {
      const intentType = normalizeText(payload.intent_type)
      if (!senderKey || !sender || !intentType) continue
      if (!latestRuleBySender.has(senderKey)) {
        latestRuleBySender.set(senderKey, {
          sender_key: senderKey,
          sender,
          intent_type:
            intentType === 'keep' ||
            intentType === 'quarantine' ||
            intentType === 'unsubscribe' ||
            intentType === 'custom_rule'
              ? intentType
              : 'custom_rule',
          label: normalizeText(payload.label) || 'Rule intent',
          description: normalizeText(payload.description) || 'Future Gmail automation intent.',
          updated_at: createdAt,
        })
      }
      continue
    }

    if (row.event_type === 'rule_rejected' && senderKey) {
      latestRuleBySender.delete(senderKey)
    }
  }

  const learnedPolicies = Array.from(latestPolicyBySender.values())
    .map((entry) => ({
      ...entry,
      event_count: policyEventCounts.get(entry.sender_key) || 1,
    }))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  const ruleIntents = Array.from(latestRuleBySender.values()).sort(
    (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
  )

  const { data: ragRows, error: ragError } = await params.supabase
    .from('rag_documents')
    .select('source_type,source_url,title,content,embedding,created_at,meta')
    .eq('agent_id', params.agentId)
    .in('source_type', Array.from(GMAIL_MEMORY_SOURCE_TYPES))
    .order('created_at', { ascending: false })
    .limit(250)

  if (ragError) {
    console.warn('[gmail-cleanup-memory] rag load failed (non-fatal):', ragError)
  }

  const candidateSenders = params.candidateSenders || []
  const recommendations: GmailMonitoringSummaryData['recommendations'] = []
  const semanticMatches: GmailMonitoringSummaryData['semantic_matches'] = []
  const domainPolicyMap = new Map<string, Array<Exclude<GmailSenderPolicy, 'undecided'>>>()

  for (const policy of learnedPolicies) {
    if (!policy.domain) continue
    const current = domainPolicyMap.get(policy.domain) || []
    current.push(policy.policy)
    domainPolicyMap.set(policy.domain, current)
  }

  for (const sender of candidateSenders) {
    const domain = senderDomain(sender.sender)
    if (!domain) continue
    const domainPolicies = domainPolicyMap.get(domain) || []
    if (domainPolicies.length < 2) continue
    const policyCounts = new Map<string, number>()
    for (const policy of domainPolicies) {
      policyCounts.set(policy, (policyCounts.get(policy) || 0) + 1)
    }
    const topPolicy = Array.from(policyCounts.entries()).sort((a, b) => b[1] - a[1])[0]
    if (!topPolicy) continue
    recommendations.push({
      id: recommendationId('domain', `${domain}:${sender.senderKey}`),
      title: `Domain memory suggests ${topPolicy[0]}`,
      summary: `${domainPolicies.length} prior decisions from ${domain} lean toward ${topPolicy[0]}.`,
      recommended_policy: topPolicy[0] as Exclude<GmailSenderPolicy, 'undecided'>,
      confidence: topPolicy[1] >= 3 ? 'high' : 'moderate',
      sender_key: sender.senderKey,
      sender: sender.sender,
      domain,
      evidence: [
        `${topPolicy[1]} learned decisions from ${domain}`,
        'Monitoring uses sender/domain memory before suggesting automation',
      ],
    })
  }

  const queryText =
    candidateSenders.length > 0
      ? candidateSenders
          .slice(0, 8)
          .map((sender) => `${sender.sender} cleanup policy`)
          .join(' | ')
      : `${params.clusterTitle || 'gmail cleanup'} sender policy memory`

  const queryEmbedding = await embedText(queryText)
  if (queryEmbedding && Array.isArray(ragRows)) {
    const scored = (ragRows as GmailMemoryDocRow[])
      .map((row) => {
        const embedding = parseEmbedding(row.embedding)
        if (!embedding || !row.content) return null
        const similarity = cosineSimilarity(queryEmbedding, embedding)
        const meta = parsePayload(row.meta)
        const policy = normalizeSenderPolicy(meta?.policy)
        return {
          sender_key: normalizeText(meta?.sender_key) || null,
          sender: normalizeText(meta?.sender) || null,
          policy,
          similarity,
          excerpt: row.content.slice(0, 220),
          source_url: row.source_url,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6)

    semanticMatches.push(...scored)

    for (const match of scored.slice(0, 3)) {
      if (!match.policy) continue
      recommendations.push({
        id: recommendationId('semantic', match.source_url || match.sender_key || String(match.similarity)),
        title: `Similar learned sender pattern found`,
        summary: match.sender
          ? `${match.sender} previously learned as ${match.policy}.`
          : `Semantic Gmail memory suggests ${match.policy}.`,
        recommended_policy: match.policy,
        confidence: match.similarity >= 0.84 ? 'high' : 'moderate',
        sender_key: match.sender_key,
        sender: match.sender,
        domain: match.sender ? senderDomain(match.sender) : null,
        evidence: [
          `Semantic similarity ${match.similarity.toFixed(2)}`,
          'Retrieved from Gmail cleanup memory in rag_documents',
        ],
      })
    }
  }

  const dedupedRecommendations = Array.from(
    new Map(recommendations.map((entry) => [entry.id, entry])).values()
  )
    .sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence === 'high' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    .slice(0, 8)

  if (dedupedRecommendations.length > 0) {
    const latestRecommendationKey = dedupedRecommendations.map((entry) => entry.id).join('|')
    const latestEvent = rows.find((row) => row.event_type === 'automation_recommendation_generated')
    const latestPayload = latestEvent ? parsePayload(latestEvent.payload) : null
    const latestKey = normalizeText(latestPayload?.recommendation_key)
    if (latestKey !== latestRecommendationKey.toLowerCase()) {
      await params.supabase.from('agent_events').insert([
        {
          agent_id: params.agentId,
          event_type: 'automation_recommendation_generated',
          created_at: new Date().toISOString(),
          payload: {
            workspace: 'gmail_cleanup',
            recommendation_key: latestRecommendationKey,
            cluster_id: params.clusterId || null,
            cluster_title: params.clusterTitle || null,
            recommendations: dedupedRecommendations.slice(0, 3),
          },
        },
      ])
    }
  }

  return {
    ok: true,
    data: {
      learned_policies: learnedPolicies,
      rule_intents: ruleIntents,
      recommendations: dedupedRecommendations,
      semantic_matches: semanticMatches,
      recent_events: recentEvents,
    },
  }
}

export async function loadGmailDecisionManagementSummary(params: {
  supabase: SupabaseClient
  agentId: string
}): Promise<{ ok: true; data: GmailDecisionManagementSummaryData } | { ok: false; error: string }> {
  const { data: profileRows, error: profileError } = await params.supabase
    .from('rag_documents')
    .select('meta')
    .eq('agent_id', params.agentId)
    .eq('source_type', GMAIL_DESTINATION_PROFILE_SOURCE_TYPE)
    .order('created_at', { ascending: false })
    .limit(500)

  if (profileError) {
    console.error('[gmail-cleanup-memory] decision management profile load failed:', profileError)
    return { ok: false, error: 'Failed to load sender destination profiles.' }
  }

  const senderProfiles = ((profileRows || []) as Array<{ meta?: unknown }>)
    .map((row) => normalizeDestinationProfile(parsePayload(row.meta)))
    .filter((entry): entry is GmailSenderDestinationProfile => entry != null)
    .sort((a, b) => Date.parse(b.last_action_timestamp) - Date.parse(a.last_action_timestamp))

  const { data: eventRows, error: eventError } = await params.supabase
    .from('agent_events')
    .select('id,event_type,created_at,payload')
    .eq('agent_id', params.agentId)
    .in('event_type', [
      'destination_state_set',
      'destination_execution_updated',
      'destination_state_cleared',
    ])
    .order('created_at', { ascending: false })
    .limit(200)

  if (eventError) {
    console.error('[gmail-cleanup-memory] decision management event load failed:', eventError)
    return { ok: false, error: 'Failed to load destination activity history.' }
  }

  const recentDecisionActivity: GmailDecisionManagementSummaryData['recent_decision_activity'] = []
  for (const row of (eventRows || []) as GmailMemoryEventRow[]) {
    const payload = parsePayload(row.payload)
    if (!payload) continue
    const destinationState = normalizeDestinationState(payload.destination_state)
    const senderKey = normalizeText(payload.sender_key)
    const sender = normalizeText(payload.sender)
    const destinationTimestamp =
      normalizeText(payload.destination_timestamp) || row.created_at || new Date().toISOString()
    const destinationSource = normalizeText(payload.destination_source)
    const executionTimestamp =
      normalizeText(payload.execution_timestamp) || row.created_at || destinationTimestamp
    const executionState = normalizeDestinationExecutionState(payload.execution_state)
    const executionWarning = normalizeText(payload.execution_warning) || null
    if (!senderKey || !sender) continue
    if (row.event_type === 'destination_state_cleared') {
      recentDecisionActivity.push({
        id: row.id || `${senderKey}:${row.created_at || destinationTimestamp}`,
        sender_key: senderKey,
        sender,
        destination_state:
          normalizeDestinationState(payload.previous_destination_state) || 'KEEP',
        destination_timestamp: row.created_at || destinationTimestamp,
        destination_source: 'destination_state_cleared',
        destination_reason:
          normalizeText(payload.clear_reason) || 'Destination state removed from management.',
        execution_state: normalizeDestinationExecutionState(payload.previous_execution_state),
        execution_warning: 'Destination state was removed and is no longer active.',
      })
      continue
    }
    if (row.event_type === 'destination_execution_updated') {
      if (!destinationState || !executionState) continue
      recentDecisionActivity.push({
        id: row.id || `${senderKey}:${executionTimestamp}`,
        sender_key: senderKey,
        sender,
        destination_state: destinationState,
        destination_timestamp: executionTimestamp,
        destination_source: normalizeText(payload.execution_source) || 'execution_update',
        destination_reason:
          executionWarning ||
          `Execution state updated to ${executionState.replace(/_/g, ' ')}.`,
        execution_state: executionState,
        execution_warning: executionWarning,
      })
      continue
    }
    if (!destinationState || !destinationSource) continue
    recentDecisionActivity.push({
      id: row.id || `${senderKey}:${destinationTimestamp}`,
      sender_key: senderKey,
      sender,
      destination_state: destinationState,
      destination_timestamp: destinationTimestamp,
      destination_source: destinationSource,
      destination_reason: normalizeText(payload.destination_reason) || null,
      execution_state: executionState,
      execution_warning: executionWarning,
    })
  }

  const destinationSummaries = (
    ['KEEP', 'ARCHIVE', 'QUARANTINE', 'UNSUBSCRIBE', 'CUSTOM_RULE'] as const
  ).map((state) => {
    const members = senderProfiles.filter((profile) => profile.destination_state === state)
    const latestTimestamp =
      members
        .map((profile) => profile.destination_timestamp)
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null
    const supportingMessageCount = members.reduce((total, profile) => {
      return total + (profile.trust_signals?.cleanup_group_message_count || 0)
    }, 0)
    return {
      state,
      label: destinationLabel(state),
      sender_count: members.length,
      latest_destination_timestamp: latestTimestamp,
      supporting_message_count: supportingMessageCount,
      summary:
        state === 'ARCHIVE'
          ? `${members.length} senders are now in the Archive destination state.`
          : state === 'KEEP'
            ? `${members.length} senders are protected in the Keep destination state.`
            : state === 'QUARANTINE'
              ? `${members.length} senders are being held in the Quarantine destination state.`
              : state === 'UNSUBSCRIBE'
                ? `${members.length} senders are stored as unsubscribe intent.`
                : `${members.length} senders are stored as Custom Rule intent.`,
    }
  })

  return {
    ok: true,
    data: {
      destination_summaries: destinationSummaries,
      sender_profiles: senderProfiles,
      recent_decision_activity: recentDecisionActivity.slice(0, 25),
      recommendation_summary: {
        status: 'deferred_phase_2',
        summary:
          'AI rule recommendations stay deferred in this pass. The management layer now stores sender destinations so future recommendation surfaces can reason over real sender state.',
      },
    },
  }
}
