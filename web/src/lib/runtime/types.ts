export type RuntimeProposedAction = {
  tool: string
  action: string
  args?: unknown
}

export type RuntimeApprovalStatus = 'pending' | 'approved' | 'auto-approved' | 'executed'

export type RuntimeMode = 'training' | 'guarded'

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export type RuntimePlanRequest = {
  agent_id: string
  user_request: string
  proposed_actions?: RuntimeProposedAction[]
  session_id?: string
}

export type RuntimePlanJson = {
  version: 'mvp.v1'
  approval_required: true
  generated_at: string
  goal: string
  steps: Array<{
    id: number
    title: string
    description: string
    proposed_action?: RuntimeProposedAction
  }>
}

export type RuntimeApprovalRequestPayload = {
  approval_id: string
  agent_id: string
  actor_id?: string
  tenant_id?: string
  session_id?: string
  user_request: string
  plan_json: RuntimePlanJson
  proposed_actions: RuntimeProposedAction[]
  created_at: string
}

export type RuntimeApproveRequest = {
  agent_id: string
  approval_id: string
  decision: 'approved' | 'rejected'
  reviewer_note?: string
}

export type RuntimeApprovalDecisionPayload = {
  approval_id: string
  actor_id?: string
  tenant_id?: string
  request_event_id?: string
  decision: 'approved' | 'rejected'
  auto_approved?: boolean
  reviewer_note?: string
  decided_at: string
}

export type RuntimeAutoApproveRequest = {
  agent_id: string
  approval_id: string
}

export type RuntimePendingApproval = {
  approval_id: string
  agent_id: string
  session_id?: string
  created_at: string
  user_request: string
  proposed_actions?: RuntimeProposedAction[]
  decision?: 'approved' | 'rejected'
  auto_approved?: boolean
  executed?: boolean
  status?: RuntimeApprovalStatus
  auto_approve_eligible?: boolean
}

export type RuntimeConfidenceUpdatePayload = {
  approval_id: string
  actor_id?: string
  tenant_id?: string
  request_event_id?: string
  tool: string
  action: string
  decision: 'approved' | 'rejected'
  new_count: number
  threshold: number
  eligible_auto: boolean
  updated_at: string
}

export type RuntimeConfidenceActionSummary = {
  tool: string
  action: string
  approved_count: number
  threshold: number
  eligible_auto: boolean
}

export type RuntimeModeUpdatePayload = {
  mode: RuntimeMode
  actor_id?: string
  tenant_id?: string
  updated_at: string
}

export type RuntimeEligibilityData = {
  mode: RuntimeMode
  actions: RuntimeConfidenceActionSummary[]
}

export type RuntimeExecuteRequest = {
  agent_id: string
  approval_id: string
}

export type RuntimeSandboxExecutionActionResult = {
  tool: 'sandbox'
  action: string
  success: true
  echoed_message?: string
  echoed_args?: unknown
  wait_ms?: number
  note?: string
}

export type RuntimeGmailExecutionActionResult = {
  tool: 'gmail'
  action: 'draft_email'
  success: true
  draft_id: string
  message_id: string
}

export type RuntimeGmailInboxAnalysisData = {
  total_messages_estimate: number
  sample_size: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  top_senders: Array<{ sender: string; count: number }>
  sample_subject_lines: string[]
}

export type RuntimeGmailAnalyzeInboxExecutionActionResult = {
  tool: 'gmail'
  action: 'analyze_inbox'
  success: true
  inbox_analysis: RuntimeGmailInboxAnalysisData
}

export type RuntimeGmailSenderClusterReviewData = {
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

export type RuntimeGmailReviewSenderClusterExecutionActionResult = {
  tool: 'gmail'
  action: 'review_sender_cluster'
  success: true
  sender_review: RuntimeGmailSenderClusterReviewData
}

export type RuntimeGmailQueryClusterReviewData = {
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

export type RuntimeGmailReviewQueryClusterExecutionActionResult = {
  tool: 'gmail'
  action: 'review_query_cluster'
  success: true
  query_review: RuntimeGmailQueryClusterReviewData
}

export type RuntimeGmailArchiveMessagesData = {
  sender: string | null
  batch_title: string | null
  requested_count: number
  archived_count: number
  message_ids: string[]
  accepted_message_ids: string[]
  failed_message_ids: string[]
  partial_failure: boolean
}

export type RuntimeGmailArchiveMessagesExecutionActionResult = {
  tool: 'gmail'
  action: 'archive_messages'
  success: true
  archive_result: RuntimeGmailArchiveMessagesData
}

export type RuntimeExecutionActionResult =
  | RuntimeSandboxExecutionActionResult
  | RuntimeGmailExecutionActionResult
  | RuntimeGmailAnalyzeInboxExecutionActionResult
  | RuntimeGmailReviewSenderClusterExecutionActionResult
  | RuntimeGmailReviewQueryClusterExecutionActionResult
  | RuntimeGmailArchiveMessagesExecutionActionResult

export type RuntimeExecutionResultPayload = {
  approval_id: string
  actor_id?: string
  tenant_id?: string
  request_event_id?: string
  decision_event_id?: string
  results?: RuntimeExecutionActionResult[]
  tool?: 'gmail'
  action?: 'draft_email'
  draft_id?: string
  message_id?: string
  executed_at: string
  success: true
  status?: 'succeeded'
}

export type RuntimeExecutionOutcomeData = {
  execution_id: string
  status: 'succeeded' | 'failed' | 'partial' | 'indeterminate'
  executed: boolean
  results?: RuntimeExecutionActionResult[]
  draft_id?: string
}
