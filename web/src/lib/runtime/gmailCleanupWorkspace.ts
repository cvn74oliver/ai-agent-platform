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

export const GMAIL_SENDER_POLICIES = [
  'undecided',
  'keep',
  'archive',
  'quarantine',
  'unsubscribe',
  'custom_rule',
] as const

export type GmailSenderPolicy = (typeof GMAIL_SENDER_POLICIES)[number]

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

export type GmailCleanupWorkflowDraft = {
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
  ruleIntents: GmailCleanupRuleIntent[]
  currentStage: GmailCleanupStage
  confirmationPreview: GmailConfirmationPreviewData | null
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

export function gmailCleanupWorkflowDraftStorageKey(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
}): string {
  return [
    'gmail.cleanup.workflow.v1',
    params.agentId,
    params.sessionId || 'none',
    params.clusterId,
  ].join(':')
}

export function readGmailCleanupWorkflowDraft(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
}): GmailCleanupWorkflowDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(gmailCleanupWorkflowDraftStorageKey(params))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GmailCleanupWorkflowDraft>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      senderPolicies:
        parsed.senderPolicies && typeof parsed.senderPolicies === 'object'
          ? (parsed.senderPolicies as Record<string, GmailSenderPolicy>)
          : {},
      messageOverrides:
        parsed.messageOverrides && typeof parsed.messageOverrides === 'object'
          ? (parsed.messageOverrides as Record<string, 'include' | 'exclude'>)
          : {},
      ruleIntents: Array.isArray(parsed.ruleIntents)
        ? (parsed.ruleIntents as GmailCleanupRuleIntent[])
        : [],
      currentStage:
        typeof parsed.currentStage === 'string' &&
        GMAIL_CLEANUP_STAGES.includes(parsed.currentStage as GmailCleanupStage)
          ? (parsed.currentStage as GmailCleanupStage)
          : 'senders',
      confirmationPreview:
        parsed.confirmationPreview && typeof parsed.confirmationPreview === 'object'
          ? (parsed.confirmationPreview as GmailConfirmationPreviewData)
          : null,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function writeGmailCleanupWorkflowDraft(
  params: {
    agentId: string
    sessionId: string | null
    clusterId: string
  },
  draft: GmailCleanupWorkflowDraft
) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    gmailCleanupWorkflowDraftStorageKey(params),
    JSON.stringify(draft)
  )
}

export async function fetchGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailMailboxIntelligenceData } | { ok: false; error: string }> {
  const res = await fetch('/api/integrations/gmail/inbox-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mailbox_intelligence',
      analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
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
    }),
  })

  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailMailboxIntelligenceData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to load Mailbox Intelligence.' }
  }
  return { ok: true, data: payload.data }
}

export async function fetchGmailSenderWorkspace(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  page?: number
  pageSize?: number
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailSenderWorkspaceData } | { ok: false; error: string }> {
  const res = await fetch('/api/integrations/gmail/inbox-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sender_workspace',
      analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
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
      page: params.page ?? 1,
      page_size: params.pageSize ?? 12,
      ...contextParams(params.requestContext),
    }),
  })

  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailSenderWorkspaceData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to load sender workspace.' }
  }
  return { ok: true, data: payload.data }
}

export async function fetchGmailConfirmationPreview(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailConfirmationPreviewData } | { ok: false; error: string }> {
  const res = await fetch('/api/integrations/gmail/inbox-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'confirmation_preview',
      analysis_scope: normalizeOperationsAnalysisScope(params.analysisScope),
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
      message_overrides: params.messageOverrides || {},
      ...contextParams(params.requestContext),
    }),
  })

  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailConfirmationPreviewData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to compute confirmation preview.' }
  }
  return { ok: true, data: payload.data }
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
