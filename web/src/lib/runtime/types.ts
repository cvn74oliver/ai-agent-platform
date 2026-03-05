export type RuntimeProposedAction = {
  tool: string
  action: string
  args?: unknown
}

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export type RuntimePlanRequest = {
  agent_id: string
  user_request: string
  proposed_actions?: RuntimeProposedAction[]
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
  decision: 'approved' | 'rejected'
  reviewer_note?: string
  decided_at: string
}

export type RuntimePendingApproval = {
  approval_id: string
  agent_id: string
  created_at: string
  user_request: string
}
