import {
  normalizeOperationsAnalysisScope,
  type OperationsAnalysisScope,
  type OperationsInboxAnalysisRequestContext,
} from '@/lib/runtime/operationsWorkspace'

export const GMAIL_CLEANUP_STAGES = [
  'senders',
  'exceptions',
  'confirmation',
  'rules',
  'monitoring',
] as const

export type GmailCleanupStage = (typeof GMAIL_CLEANUP_STAGES)[number]

export const GMAIL_CLEANUP_ACTIVE_STAGES = ['senders', 'confirmation'] as const
export const GMAIL_CLEANUP_PLACEHOLDER_STAGES = ['exceptions', 'rules', 'monitoring'] as const

export const GMAIL_SENDER_POLICIES = [
  'undecided',
  'keep',
  'archive',
  'quarantine',
  'unsubscribe',
  'custom_rule',
] as const

export type GmailSenderPolicy = (typeof GMAIL_SENDER_POLICIES)[number]

export const GMAIL_SENDER_WORKSPACE_FILTERS = [
  'all',
  'needs_verification',
  'protected',
  'likely_machine_generated',
  'likely_human',
] as const

export type GmailSenderWorkspaceFilter = (typeof GMAIL_SENDER_WORKSPACE_FILTERS)[number]

export const GMAIL_SENDER_WORKSPACE_SORTS = [
  'message_count',
  'sender',
  'unread_count',
  'last_activity',
] as const

export type GmailSenderWorkspaceSort = (typeof GMAIL_SENDER_WORKSPACE_SORTS)[number]

export const GMAIL_SENDER_WORKSPACE_SORT_DIRECTIONS = ['asc', 'desc'] as const

export type GmailSenderWorkspaceSortDirection =
  (typeof GMAIL_SENDER_WORKSPACE_SORT_DIRECTIONS)[number]

export type GmailCleanupClusterRef = {
  clusterId: string
  clusterType: string
  title: string
  query: string
  whySelected?: string | null
  riskNote?: string | null
  safetyNote?: string | null
  estimatedCount?: number | null
}

export type GmailScopeLadderCounts = {
  whole_mailbox: number
  cleanup_candidate_universe: number
  cleanup_group: number
  sender_set: number
  loaded_preview_rows: number
}

export type GmailCleanupPreviewMessage = {
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

export type GmailPressureTimelineBucket = {
  label: string
  count: number
  composition?: GmailPressureTimelineComposition[]
  evidence_signals?: GmailPressureTimelineEvidenceSignal[]
}

export const GMAIL_PRESSURE_TREND_WINDOWS = [
  'all_indexed',
  'last_year',
  'last_quarter',
  'last_month',
  'last_week',
  'last_day',
  'custom',
] as const

export type GmailPressureTrendWindow = (typeof GMAIL_PRESSURE_TREND_WINDOWS)[number]

export const GMAIL_PRESSURE_TREND_GROUPINGS = [
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
] as const

export type GmailPressureTrendGrouping = (typeof GMAIL_PRESSURE_TREND_GROUPINGS)[number]

export type GmailPressureTrendBucket = GmailPressureTimelineBucket & {
  bucket_start_at: string
  bucket_end_at: string
}

export type GmailPressureTrendData = {
  window: {
    key: GmailPressureTrendWindow
    label: string
    requested_start: string | null
    requested_end: string | null
    effective_start: string | null
    effective_end: string | null
    limited_by_indexed_coverage: boolean
  }
  grouping: {
    key: GmailPressureTrendGrouping
    label: string
  }
  indexed_coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  time_zone: string
  series: GmailPressureTrendBucket[]
  source: 'gmail_index_cache'
}

export type GmailMailboxIntelligenceData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  whole_mailbox: {
    message_count: number
    sender_count: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
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
    activity_timeline: GmailPressureTimelineBucket[]
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
  }
  cleanup_candidate_universe: {
    message_count: number
    sender_count: number
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
    activity_timeline: GmailPressureTimelineBucket[]
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
  }
  protected_safe_context: {
    protected_message_count: number
    protected_sender_count: number
    likely_human_message_count: number
    likely_human_sender_count: number
    caution_candidate_message_count: number
    low_risk_candidate_message_count: number
    summary: string
  }
  cleanup_groups: Array<{
    cluster_id: string
    cluster_type: string
    title: string
    query: string
    why_selected: string
    risk_note: string
    safety_note: string
    message_count: number
    sender_count: number
    share_pct: number
    dominant_sender: string | null
    dominant_pattern: string | null
    protected_message_count: number
    uncertain_sender_count: number
  }>
  sender_ranking: Array<{
    sender: string
    sender_key: string
    total_message_count: number
    cleanup_candidate_message_count: number
    protected_message_count: number
    unread_count: number
    first_seen: string | null
    last_seen: string | null
    category_summary: string
    sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  }>
  source: 'gmail_index_cache'
}

export type GmailSenderWorkspaceSender = {
  sender: string
  sender_key: string
  sender_domain: string | null
  cleanup_group_message_count: number
  total_sender_messages: number | null
  unread_count: number
  last_activity: string | null
  first_seen: string | null
  category_summary: string
  dominant_pattern: string
  sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  machine_probability: number | null
  human_probability: number | null
  protected_hint: string | null
  requires_verification: boolean
  verification_reasons: string[]
  preview_messages: GmailCleanupPreviewMessage[]
  learned_policy: GmailSenderPolicy | null
}

export type GmailSenderWorkspaceData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  selected_cluster: {
    cluster_id: string
    cluster_type: string
    title: string
    query: string
    why_selected: string
    risk_note: string
    safety_note: string
    message_count: number
    sender_count: number
    share_pct: number
  }
  senders: GmailSenderWorkspaceSender[]
  pagination: {
    page: number
    page_size: number
    total_senders: number
    total_pages: number
    cluster_total_senders: number
  }
  analytics: {
    sender_category_distribution: Array<{
      label: string
      sender_count: number
    }>
    sender_activity_timeline: Array<{
      label: string
      sender_count: number
    }>
    sender_activity_timeline_granularity: 'week' | 'month'
    cluster_contribution: Array<{
      sender: string
      sender_key: string
      message_count: number
      share_pct: number
    }>
  }
  view: {
    search: string
    filter: GmailSenderWorkspaceFilter
    sort: GmailSenderWorkspaceSort
    direction: GmailSenderWorkspaceSortDirection
  }
  exceptions_count: number
  source: 'gmail_index_cache'
}

export type GmailConfirmationPreviewGroup = {
  policy: GmailSenderPolicy
  label: string
  sender_count: number
  message_count: number
  senders: Array<{
    sender: string
    sender_key: string
    message_count: number
  }>
}

export type GmailConfirmationPreviewData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  selected_cluster: {
    cluster_id: string
    title: string
    message_count: number
    sender_count: number
  }
  exact_archive_impact: {
    sender_count: number
    message_count: number
    message_id_sample: string[]
  }
  future_behavior_summary: Array<{
    policy: Exclude<GmailSenderPolicy, 'archive' | 'undecided'>
    sender_count: number
    message_count: number
    behavior: string
  }>
  protected_exclusions_count: number
  undecided_sender_count: number
  groups: GmailConfirmationPreviewGroup[]
  source: 'gmail_index_cache'
}

export type GmailCleanupRuleIntent = {
  sender_key: string
  sender: string
  intent_type: 'keep' | 'quarantine' | 'unsubscribe' | 'custom_rule'
  label: string
  description: string
}

export type GmailMonitoringRecommendation = {
  id: string
  title: string
  summary: string
  recommended_policy: Exclude<GmailSenderPolicy, 'undecided'>
  confidence: 'high' | 'moderate'
  sender_key: string | null
  sender: string | null
  domain: string | null
  evidence: string[]
}

export type GmailMonitoringSummaryData = {
  learned_policies: Array<{
    sender_key: string
    sender: string
    domain: string | null
    policy: Exclude<GmailSenderPolicy, 'undecided'>
    updated_at: string
    source: 'agent_events'
    event_count: number
  }>
  rule_intents: Array<{
    sender_key: string
    sender: string
    intent_type: GmailCleanupRuleIntent['intent_type']
    label: string
    description: string
    updated_at: string
  }>
  recommendations: GmailMonitoringRecommendation[]
  semantic_matches: Array<{
    sender_key: string | null
    sender: string | null
    policy: Exclude<GmailSenderPolicy, 'undecided'> | null
    similarity: number
    excerpt: string
    source_url: string | null
  }>
  recent_events: Array<{
    id: string
    event_type: string
    created_at: string
    summary: string
  }>
}

export const GMAIL_DESTINATION_STATES = [
  'KEEP',
  'ARCHIVE',
  'QUARANTINE',
  'UNSUBSCRIBE',
  'CUSTOM_RULE',
] as const

export type GmailDestinationState = (typeof GMAIL_DESTINATION_STATES)[number]

export const GMAIL_DESTINATION_EXECUTION_STATES = [
  'not_applicable',
  'pending',
  'succeeded',
  'failed',
  'deferred',
] as const

export type GmailDestinationExecutionState =
  (typeof GMAIL_DESTINATION_EXECUTION_STATES)[number]

export type GmailSenderDestinationTrustSignals = {
  sender_signal: GmailSenderWorkspaceSender['sender_signal'] | null
  category_summary: string | null
  dominant_pattern: string | null
  protected_hint: string | null
  requires_verification: boolean
  verification_reasons: string[]
  cleanup_group_message_count: number | null
  total_sender_messages: number | null
  unread_count: number | null
  last_activity: string | null
}

export type GmailSenderDestinationHistoryItem = {
  destination_state: GmailDestinationState
  destination_timestamp: string
  destination_source: string
  destination_reason: string | null
}

export type GmailSenderDestinationProfile = {
  sender_key: string
  sender: string
  domain: string | null
  trust_signals: GmailSenderDestinationTrustSignals | null
  destination_state: GmailDestinationState
  destination_timestamp: string
  destination_source: string
  destination_reason: string | null
  destination_history: GmailSenderDestinationHistoryItem[]
  execution_state: GmailDestinationExecutionState
  execution_timestamp: string | null
  execution_source: string | null
  execution_warning: string | null
  execution_message_count: number | null
  execution_message_ids: string[] | null
  last_action_timestamp: string
}

export type GmailDecisionManagementSummaryData = {
  destination_summaries: Array<{
    state: GmailDestinationState
    label: string
    sender_count: number
    latest_destination_timestamp: string | null
    supporting_message_count: number
    summary: string
  }>
  sender_profiles: GmailSenderDestinationProfile[]
  recent_decision_activity: Array<{
    id: string
    sender_key: string
    sender: string
    destination_state: GmailDestinationState
    destination_timestamp: string
    destination_source: string
    destination_reason: string | null
    execution_state: GmailDestinationExecutionState | null
    execution_warning: string | null
  }>
  recommendation_summary: {
    status: 'deferred_phase_2'
    summary: string
  }
}

export type GmailCleanupWorkflowDraft = {
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
  ruleIntents: GmailCleanupRuleIntent[]
  currentStage: GmailCleanupStage
  confirmationPreview: GmailConfirmationPreviewData | null
  snapshotVersion?: string | null
  updatedAt: number
}

export type GmailCleanupMemoryWritePayload = {
  agentId: string
  sessionId: string | null
  cluster: {
    clusterId: string
    clusterType: string
    title: string
    query: string
  } | null
  action:
    | {
        type: 'sender_policy_set' | 'sender_policy_removed'
        senderKey: string
        sender: string
        policy: GmailSenderPolicy
      }
    | {
        type: 'rule_intent_set' | 'rule_intent_removed'
        senderKey: string
        sender: string
        intentType: GmailCleanupRuleIntent['intent_type']
        label: string
        description: string
      }
    | {
        type: 'destination_commit'
        senders: Array<{
          senderKey: string
          sender: string
          destinationState: GmailDestinationState
          source: string
          reason: string
          messageCount?: number | null
          trustSignals?: Partial<GmailSenderDestinationTrustSignals> | null
        }>
      }
    | {
        type: 'destination_execution_update'
        senders: Array<{
          senderKey: string
          sender: string
          executionState: GmailDestinationExecutionState
          executionSource: string
          executionWarning?: string | null
          executionMessageCount?: number | null
          executionMessageIds?: string[] | null
          executionTimestamp?: string | null
        }>
      }
    | {
        type: 'destination_state_clear'
        senderKey: string
        sender: string
        reason: string
      }
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

function contextParams(value: OperationsInboxAnalysisRequestContext | undefined) {
  const context = normalizeInboxAnalysisRequestContext(value)
  return {
    request_source: context.source,
    request_component: context.component,
    request_reason: context.reason,
    request_phase: context.phase,
  }
}

type CachedInboxAnalysisEntry<T> = {
  expiresAtMs: number
  data: T
}

const GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_TTL_MS = 1000 * 60 * 10
const GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX = 'gmail.inbox.analysis.v1'

const gmailCleanupRuntimeGlobal = globalThis as typeof globalThis & {
  __gmailInboxAnalysisClientCache?: Map<string, CachedInboxAnalysisEntry<unknown>>
  __gmailInboxAnalysisClientInflight?: Map<string, Promise<unknown>>
}

const gmailInboxAnalysisClientCache =
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache ||
  new Map<string, CachedInboxAnalysisEntry<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache) {
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache = gmailInboxAnalysisClientCache
}

const gmailInboxAnalysisClientInflight =
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight || new Map<string, Promise<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight) {
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight = gmailInboxAnalysisClientInflight
}

function clusterCacheSignature(cluster: GmailCleanupClusterRef): string {
  return [
    cluster.clusterId,
    cluster.clusterType,
    cluster.title,
    cluster.query,
    cluster.whySelected || '',
    cluster.riskNote || '',
    cluster.safetyNote || '',
    cluster.estimatedCount ?? '',
  ].join('::')
}

function sortedClusterCacheSignatures(clusters: GmailCleanupClusterRef[]): string[] {
  return clusters.map((cluster) => clusterCacheSignature(cluster)).sort()
}

function senderPoliciesSignature(value: Record<string, GmailSenderPolicy>): string {
  return Object.entries(value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, policy]) => `${key}:${policy}`)
    .join('|')
}

function messageOverridesSignature(value: Record<string, 'include' | 'exclude'>): string {
  return Object.entries(value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, override]) => `${key}:${override}`)
    .join('|')
}

function clientInboxAnalysisStorageKey(cacheKey: string): string {
  return `${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:${cacheKey}`
}

function readPersistedClientInboxAnalysisCache<T>(cacheKey: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(clientInboxAnalysisStorageKey(cacheKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedInboxAnalysisEntry<T> | null
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAtMs !== 'number') return null
    if (parsed.expiresAtMs <= Date.now()) {
      window.sessionStorage.removeItem(clientInboxAnalysisStorageKey(cacheKey))
      return null
    }
    gmailInboxAnalysisClientCache.set(cacheKey, parsed as CachedInboxAnalysisEntry<unknown>)
    return parsed.data
  } catch {
    return null
  }
}

function readClientInboxAnalysisCache<T>(cacheKey: string): T | null {
  const cached = gmailInboxAnalysisClientCache.get(cacheKey)
  if (!cached) return null
  if (cached.expiresAtMs <= Date.now()) {
    gmailInboxAnalysisClientCache.delete(cacheKey)
    return null
  }
  return cached.data as T
}

function writeClientInboxAnalysisCache<T>(cacheKey: string, data: T): T {
  const entry = {
    expiresAtMs: Date.now() + GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_TTL_MS,
    data,
  }
  gmailInboxAnalysisClientCache.set(cacheKey, entry)
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(clientInboxAnalysisStorageKey(cacheKey), JSON.stringify(entry))
    } catch {
      // Ignore storage quota failures; the in-memory cache remains the primary fast path.
    }
  }
  return data
}

async function requestCachedInboxAnalysis<T>(params: {
  cacheKey: string
  body: Record<string, unknown>
  errorMessage: string
  signal?: AbortSignal
}): Promise<{ ok: true; data: T } | { ok: false; error: string; aborted?: true }> {
  const action =
    typeof params.body.action === 'string' && params.body.action.trim()
      ? params.body.action.trim()
      : ''
  if (!action) {
    return { ok: false, error: 'Inbox analysis action is required before requesting Gmail analysis.' }
  }

  const cached =
    readClientInboxAnalysisCache<T>(params.cacheKey) ||
    readPersistedClientInboxAnalysisCache<T>(params.cacheKey)
  if (cached) return { ok: true, data: cached }

  const inflight = gmailInboxAnalysisClientInflight.get(params.cacheKey)
  if (inflight) {
    return (await inflight) as { ok: true; data: T } | { ok: false; error: string; aborted?: true }
  }

  const request = (async (): Promise<{ ok: true; data: T } | { ok: false; error: string; aborted?: true }> => {
    try {
      const res = await fetch('/api/integrations/gmail/inbox-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: params.signal,
        body: JSON.stringify(params.body),
      })

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: T }
        | null

      if (!res.ok || !payload?.ok || !payload.data) {
        return { ok: false, error: payload?.error || params.errorMessage }
      }

      return { ok: true, data: writeClientInboxAnalysisCache(params.cacheKey, payload.data) }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, error: 'Request cancelled.', aborted: true }
      }
      return { ok: false, error: params.errorMessage }
    }
  })()

  gmailInboxAnalysisClientInflight.set(params.cacheKey, request as Promise<unknown>)
  try {
    return await request
  } finally {
    gmailInboxAnalysisClientInflight.delete(params.cacheKey)
  }
}

export function gmailCleanupWorkflowDraftStorageKey(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
}): string {
  return [
    'gmail.cleanup.workflow.v2',
    params.agentId,
    params.sessionId || 'none',
    params.clusterId,
  ].join(':')
}

function gmailCleanupWorkflowDraftClusterFallbackStorageKey(params: {
  agentId: string
  clusterId: string
}): string {
  return ['gmail.cleanup.workflow.v2', params.agentId, 'cluster_fallback', params.clusterId].join(':')
}

export function gmailCleanupWorkflowDraftHasActiveContent(
  draft: GmailCleanupWorkflowDraft | null | undefined
): draft is GmailCleanupWorkflowDraft {
  if (!draft) return false
  return (
    Object.keys(draft.senderPolicies || {}).length > 0 ||
    Object.keys(draft.messageOverrides || {}).length > 0 ||
    (draft.ruleIntents?.length || 0) > 0 ||
    draft.confirmationPreview != null
  )
}

function normalizeWorkflowDraft(value: Partial<GmailCleanupWorkflowDraft> | null): GmailCleanupWorkflowDraft | null {
  if (!value || typeof value !== 'object') return null
  return {
    senderPolicies:
      value.senderPolicies && typeof value.senderPolicies === 'object'
        ? (value.senderPolicies as Record<string, GmailSenderPolicy>)
        : {},
    messageOverrides:
      value.messageOverrides && typeof value.messageOverrides === 'object'
        ? (value.messageOverrides as Record<string, 'include' | 'exclude'>)
        : {},
    ruleIntents: Array.isArray(value.ruleIntents) ? (value.ruleIntents as GmailCleanupRuleIntent[]) : [],
    currentStage:
      typeof value.currentStage === 'string' &&
      GMAIL_CLEANUP_STAGES.includes(value.currentStage as GmailCleanupStage)
        ? (value.currentStage as GmailCleanupStage)
        : 'senders',
    confirmationPreview:
      value.confirmationPreview && typeof value.confirmationPreview === 'object'
        ? (value.confirmationPreview as GmailConfirmationPreviewData)
        : null,
    snapshotVersion:
      typeof value.snapshotVersion === 'string' && value.snapshotVersion.trim()
        ? value.snapshotVersion.trim()
        : null,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  }
}

function draftMatchesSnapshot(
  draft: GmailCleanupWorkflowDraft | null,
  snapshotVersion: string | null | undefined
): draft is GmailCleanupWorkflowDraft {
  if (!draft) return false
  if (!snapshotVersion || !snapshotVersion.trim()) return true
  if (!draft.snapshotVersion || !draft.snapshotVersion.trim()) return true
  return draft.snapshotVersion.trim() === snapshotVersion.trim()
}

function readStoredWorkflowDraft(key: string): GmailCleanupWorkflowDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return normalizeWorkflowDraft(JSON.parse(raw) as Partial<GmailCleanupWorkflowDraft>)
  } catch {
    return null
  }
}

export function readGmailCleanupWorkflowDraft(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
  snapshotVersion?: string | null
}): GmailCleanupWorkflowDraft | null {
  const sessionDraft = readStoredWorkflowDraft(gmailCleanupWorkflowDraftStorageKey(params))
  if (draftMatchesSnapshot(sessionDraft, params.snapshotVersion)) return sessionDraft

  const fallbackDraft = readStoredWorkflowDraft(
    gmailCleanupWorkflowDraftClusterFallbackStorageKey({
      agentId: params.agentId,
      clusterId: params.clusterId,
    })
  )
  if (draftMatchesSnapshot(fallbackDraft, params.snapshotVersion)) return fallbackDraft

  return null
}

export function writeGmailCleanupWorkflowDraft(
  params: {
    agentId: string
    sessionId: string | null
    clusterId: string
    snapshotVersion?: string | null
  },
  draft: GmailCleanupWorkflowDraft
) {
  if (typeof window === 'undefined') return
  const sessionKey = gmailCleanupWorkflowDraftStorageKey(params)
  const fallbackKey = gmailCleanupWorkflowDraftClusterFallbackStorageKey({
    agentId: params.agentId,
    clusterId: params.clusterId,
  })
  if (!gmailCleanupWorkflowDraftHasActiveContent(draft)) {
    window.localStorage.removeItem(sessionKey)
    window.localStorage.removeItem(fallbackKey)
    return
  }
  const payload = JSON.stringify({
    ...draft,
    snapshotVersion: params.snapshotVersion ?? draft.snapshotVersion ?? null,
  })
  window.localStorage.setItem(sessionKey, payload)
  window.localStorage.setItem(fallbackKey, payload)
}

export function clearGmailCleanupWorkflowDraft(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
}) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(gmailCleanupWorkflowDraftStorageKey(params))
  window.localStorage.removeItem(
    gmailCleanupWorkflowDraftClusterFallbackStorageKey({
      agentId: params.agentId,
      clusterId: params.clusterId,
    })
  )
}

export function clearSenderFromGmailCleanupWorkflowDrafts(params: {
  agentId: string
  senderKey: string
  sessionId?: string | null
}) {
  if (typeof window === 'undefined') return
  const sessionPrefix = `gmail.cleanup.workflow.v2:${params.agentId}:${params.sessionId || 'none'}:`
  const fallbackPrefix = `gmail.cleanup.workflow.v2:${params.agentId}:cluster_fallback:`
  const updates = new Map<string, GmailCleanupWorkflowDraft | null>()

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key) continue
    const matchesSession = key.startsWith(sessionPrefix)
    const matchesFallback = key.startsWith(fallbackPrefix)
    if (!matchesSession && !matchesFallback) continue
    const draft = readStoredWorkflowDraft(key)
    if (!draft) continue
    const hadSenderPolicy = Boolean(draft.senderPolicies?.[params.senderKey])
    const hadIntent = draft.ruleIntents?.some((intent) => intent.sender_key === params.senderKey)
    if (!hadSenderPolicy && !hadIntent) continue

    const nextSenderPolicies = { ...draft.senderPolicies }
    delete nextSenderPolicies[params.senderKey]
    const nextDraft: GmailCleanupWorkflowDraft = {
      ...draft,
      senderPolicies: nextSenderPolicies,
      ruleIntents: draft.ruleIntents.filter((intent) => intent.sender_key !== params.senderKey),
      confirmationPreview: null,
      currentStage:
        Object.keys(nextSenderPolicies).length > 0 ||
        Object.keys(draft.messageOverrides || {}).length > 0 ||
        draft.ruleIntents.some((intent) => intent.sender_key !== params.senderKey)
          ? draft.currentStage
          : 'senders',
      updatedAt: Date.now(),
    }
    updates.set(key, gmailCleanupWorkflowDraftHasActiveContent(nextDraft) ? nextDraft : null)
  }

  for (const [key, draft] of updates.entries()) {
    if (!draft) {
      window.localStorage.removeItem(key)
      continue
    }
    window.localStorage.setItem(key, JSON.stringify(draft))
  }
}

function mailboxIntelligenceCacheKey(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
}): string {
  return [
    'mailbox_intelligence',
    params.analysisScope,
    params.cacheVersion,
    ...sortedClusterCacheSignatures(params.clusters),
  ].join('|||')
}

function mailboxIntelligenceCacheKeySegments(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
}): { suffix: string[] } {
  return {
    suffix: sortedClusterCacheSignatures(params.clusters),
  }
}

function mailboxIntelligenceCacheMatches(params: {
  cacheKey: string
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
}): boolean {
  const segments = params.cacheKey.split('|||')
  if (segments.length < 4) return false
  if (segments[0] !== 'mailbox_intelligence') return false
  if (segments[1] !== params.analysisScope) return false
  const expectedSuffix = mailboxIntelligenceCacheKeySegments({
    clusters: params.clusters,
    analysisScope: params.analysisScope,
  }).suffix
  const actualSuffix = segments.slice(3)
  if (actualSuffix.length !== expectedSuffix.length) return false
  return actualSuffix.every((segment, index) => segment === expectedSuffix[index])
}

function pressureTrendCacheKey(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion: string
  pressureWindow: GmailPressureTrendWindow
  pressureStart: string | null
  pressureEnd: string | null
  timeZone: string
}): string {
  return [
    'pressure_trend',
    params.cacheVersion,
    params.pressureWindow,
    params.pressureStart || 'none',
    params.pressureEnd || 'none',
    params.timeZone || 'UTC',
    ...sortedClusterCacheSignatures(params.clusters),
  ].join('|||')
}

function senderWorkspaceCacheKey(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
  page: number
  pageSize: number
  search: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
}): string {
  return [
    'sender_workspace',
    params.analysisScope,
    params.cacheVersion,
    clusterCacheSignature(params.selectedCluster),
    ...sortedClusterCacheSignatures(params.allClusters),
    String(params.page),
    String(params.pageSize),
    params.search,
    params.filter,
    params.sort,
    params.direction,
  ].join('|||')
}

function confirmationPreviewCacheKey(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}): string {
  return [
    'confirmation_preview',
    params.analysisScope,
    params.cacheVersion,
    clusterCacheSignature(params.selectedCluster),
    ...sortedClusterCacheSignatures(params.allClusters),
    senderPoliciesSignature(params.senderPolicies),
    messageOverridesSignature(params.messageOverrides),
  ].join('|||')
}

export function readCachedGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
}): GmailMailboxIntelligenceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  return (
    readClientInboxAnalysisCache<GmailMailboxIntelligenceData>(
      mailboxIntelligenceCacheKey({
        clusters: params.clusters,
        analysisScope,
        cacheVersion,
      })
    ) ||
    readPersistedClientInboxAnalysisCache<GmailMailboxIntelligenceData>(
      mailboxIntelligenceCacheKey({
        clusters: params.clusters,
        analysisScope,
        cacheVersion,
      })
    )
  )
}

export function readLatestCachedGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
}): GmailMailboxIntelligenceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  let latestEntry: CachedInboxAnalysisEntry<GmailMailboxIntelligenceData> | null = null

  for (const [cacheKey, entry] of gmailInboxAnalysisClientCache.entries()) {
    if (entry.expiresAtMs <= Date.now()) continue
    if (
      !mailboxIntelligenceCacheMatches({
        cacheKey,
        clusters: params.clusters,
        analysisScope,
      })
    ) {
      continue
    }
    if (!latestEntry || entry.expiresAtMs > latestEntry.expiresAtMs) {
      latestEntry = entry as CachedInboxAnalysisEntry<GmailMailboxIntelligenceData>
    }
  }

  if (latestEntry?.data) return latestEntry.data
  if (typeof window === 'undefined') return null

  const storagePrefix = `${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:mailbox_intelligence|||${analysisScope}|||`
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index)
    if (!storageKey || !storageKey.startsWith(storagePrefix)) continue
    const rawCacheKey = storageKey.slice(`${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:`.length)
    if (
      !mailboxIntelligenceCacheMatches({
        cacheKey: rawCacheKey,
        clusters: params.clusters,
        analysisScope,
      })
    ) {
      continue
    }
    const persisted = readPersistedClientInboxAnalysisCache<GmailMailboxIntelligenceData>(rawCacheKey)
    if (!persisted) continue
    const persistedEntry = gmailInboxAnalysisClientCache.get(rawCacheKey)
    if (!persistedEntry || persistedEntry.expiresAtMs <= Date.now()) continue
    if (!latestEntry || persistedEntry.expiresAtMs > latestEntry.expiresAtMs) {
      latestEntry = persistedEntry as CachedInboxAnalysisEntry<GmailMailboxIntelligenceData>
    }
  }

  return latestEntry?.data || null
}

export function readCachedGmailSenderWorkspace(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
}): GmailSenderWorkspaceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 12
  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const filter = params.filter ?? 'all'
  const sort = params.sort ?? 'message_count'
  const direction = params.direction ?? 'desc'
  const cacheKey = senderWorkspaceCacheKey({
    selectedCluster: params.selectedCluster,
    allClusters: params.allClusters,
    analysisScope,
    cacheVersion,
    page,
    pageSize,
    search,
    filter,
    sort,
    direction,
  })
  return (
    readClientInboxAnalysisCache<GmailSenderWorkspaceData>(cacheKey) ||
    readPersistedClientInboxAnalysisCache<GmailSenderWorkspaceData>(cacheKey)
  )
}

export async function fetchGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailMailboxIntelligenceData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  return requestCachedInboxAnalysis<GmailMailboxIntelligenceData>({
    cacheKey: mailboxIntelligenceCacheKey({
      clusters: params.clusters,
      analysisScope,
      cacheVersion,
    }),
    body: {
      action: 'mailbox_intelligence',
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      clusters: params.clusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.whySelected ?? undefined,
        risk_note: cluster.riskNote ?? undefined,
        safety_note: cluster.safetyNote ?? undefined,
      })),
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load Mailbox Intelligence.',
  })
}

export async function fetchGmailPressureTrend(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion?: string | null
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
  signal?: AbortSignal
}): Promise<{ ok: true; data: GmailPressureTrendData } | { ok: false; error: string; aborted?: true }> {
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const pressureStart =
    typeof params.pressureStart === 'string' && params.pressureStart.trim()
      ? params.pressureStart.trim()
      : null
  const pressureEnd =
    typeof params.pressureEnd === 'string' && params.pressureEnd.trim()
      ? params.pressureEnd.trim()
      : null
  const timeZone =
    typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC'

  return requestCachedInboxAnalysis<GmailPressureTrendData>({
    cacheKey: pressureTrendCacheKey({
      clusters: params.clusters,
      cacheVersion,
      pressureWindow: params.pressureWindow,
      pressureStart,
      pressureEnd,
      timeZone,
    }),
    body: {
      action: 'mailbox_pressure_trend',
      cache_version: params.cacheVersion ?? null,
      pressure_window: params.pressureWindow,
      pressure_start: pressureStart,
      pressure_end: pressureEnd,
      time_zone: timeZone,
      clusters: params.clusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.whySelected ?? undefined,
        risk_note: cluster.riskNote ?? undefined,
        safety_note: cluster.safetyNote ?? undefined,
      })),
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load Pressure Trend.',
    signal: params.signal,
  })
}

export async function fetchGmailSenderWorkspace(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
  requestContext?: OperationsInboxAnalysisRequestContext
  signal?: AbortSignal
}): Promise<{ ok: true; data: GmailSenderWorkspaceData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 12
  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const filter = params.filter ?? 'all'
  const sort = params.sort ?? 'message_count'
  const direction = params.direction ?? 'desc'
  const cacheVersion = params.cacheVersion?.trim() || 'default'

  return requestCachedInboxAnalysis<GmailSenderWorkspaceData>({
    cacheKey: senderWorkspaceCacheKey({
      selectedCluster: params.selectedCluster,
      allClusters: params.allClusters,
      analysisScope,
      cacheVersion,
      page,
      pageSize,
      search,
      filter,
      sort,
      direction,
    }),
    body: {
      action: 'sender_workspace',
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      selected_cluster: {
        cluster_id: params.selectedCluster.clusterId,
        cluster_type: params.selectedCluster.clusterType,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
        why_selected: params.selectedCluster.whySelected ?? undefined,
        risk_note: params.selectedCluster.riskNote ?? undefined,
        safety_note: params.selectedCluster.safetyNote ?? undefined,
      },
      clusters: params.allClusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
      })),
      page,
      page_size: pageSize,
      search,
      filter,
      sort,
      direction,
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load sender workspace.',
    signal: params.signal,
  })
}

export async function fetchGmailConfirmationPreview(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailConfirmationPreviewData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const messageOverrides = params.messageOverrides || {}
  const cacheVersion = params.cacheVersion?.trim() || 'default'

  return requestCachedInboxAnalysis<GmailConfirmationPreviewData>({
    cacheKey: confirmationPreviewCacheKey({
      selectedCluster: params.selectedCluster,
      allClusters: params.allClusters,
      analysisScope,
      cacheVersion,
      senderPolicies: params.senderPolicies,
      messageOverrides,
    }),
    body: {
      action: 'confirmation_preview',
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      selected_cluster: {
        cluster_id: params.selectedCluster.clusterId,
        cluster_type: params.selectedCluster.clusterType,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
      },
      clusters: params.allClusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
      })),
      sender_policies: params.senderPolicies,
      message_overrides: messageOverrides,
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to compute confirmation preview.',
  })
}

export async function fetchGmailMonitoringSummary(params: {
  agentId: string
  selectedCluster?: GmailCleanupClusterRef | null
  candidateSenders?: Array<{ senderKey: string; sender: string }>
}): Promise<{ ok: true; data: GmailMonitoringSummaryData } | { ok: false; error: string }> {
  const query = new URLSearchParams({ agent_id: params.agentId })
  if (params.selectedCluster?.clusterId) query.set('cluster_id', params.selectedCluster.clusterId)
  if (params.selectedCluster?.title) query.set('cluster_title', params.selectedCluster.title)
  if (params.candidateSenders && params.candidateSenders.length > 0) {
    query.set('senders', JSON.stringify(params.candidateSenders))
  }

  const res = await fetch(`/api/runtime/gmail-memory?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailMonitoringSummaryData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to load Monitoring summary.' }
  }
  return { ok: true, data: payload.data }
}

export async function fetchGmailDecisionManagementSummary(params: {
  agentId: string
}): Promise<{ ok: true; data: GmailDecisionManagementSummaryData } | { ok: false; error: string }> {
  const query = new URLSearchParams({
    agent_id: params.agentId,
    view: 'decision_management',
  })

  const res = await fetch(`/api/runtime/gmail-memory?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailDecisionManagementSummaryData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to load Decision Management summary.' }
  }
  return { ok: true, data: payload.data }
}

export async function persistGmailCleanupMemoryEvent(
  payload: GmailCleanupMemoryWritePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/runtime/gmail-memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
  if (!res.ok || !body?.ok) {
    return { ok: false, error: body?.error || 'Failed to store Gmail cleanup memory.' }
  }
  return { ok: true }
}
