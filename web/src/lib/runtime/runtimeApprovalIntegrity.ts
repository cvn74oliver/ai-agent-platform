export type RuntimeApprovalEventRow = {
  id?: unknown
  agent_id?: unknown
  payload?: unknown
}

export type BoundApprovalRequest = {
  eventId: string
  payload: Record<string, unknown>
}

export type BoundApprovalDecision = {
  eventId: string
  decision: 'approved' | 'rejected'
  payload: Record<string, unknown>
}

export type DecisionReplayClassification = 'new' | 'idempotent' | 'conflict'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseRuntimeEventPayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function validateBoundApprovalRequest(params: {
  row: RuntimeApprovalEventRow | null | undefined
  agentId: string
  approvalId: string
}): BoundApprovalRequest | null {
  const eventId = typeof params.row?.id === 'string' ? params.row.id.trim() : ''
  const rowAgentId =
    typeof params.row?.agent_id === 'string' ? params.row.agent_id.trim() : ''
  const payload = parseRuntimeEventPayload(params.row?.payload)
  const payloadAgentId =
    typeof payload?.agent_id === 'string' ? payload.agent_id.trim() : ''
  const payloadApprovalId =
    typeof payload?.approval_id === 'string' ? payload.approval_id.trim() : ''

  if (
    !eventId ||
    rowAgentId !== params.agentId ||
    !payload ||
    payloadAgentId !== params.agentId ||
    payloadApprovalId !== params.approvalId
  ) {
    return null
  }

  return { eventId, payload }
}

export function validateBoundApprovalDecision(params: {
  row: RuntimeApprovalEventRow | null | undefined
  agentId: string
  approvalId: string
}): BoundApprovalDecision | null {
  const eventId = typeof params.row?.id === 'string' ? params.row.id.trim() : ''
  const rowAgentId =
    typeof params.row?.agent_id === 'string' ? params.row.agent_id.trim() : ''
  const payload = parseRuntimeEventPayload(params.row?.payload)
  const payloadApprovalId =
    typeof payload?.approval_id === 'string' ? payload.approval_id.trim() : ''
  const decision =
    payload?.decision === 'approved' || payload?.decision === 'rejected'
      ? payload.decision
      : null

  if (
    !eventId ||
    rowAgentId !== params.agentId ||
    !payload ||
    payloadApprovalId !== params.approvalId ||
    !decision
  ) {
    return null
  }

  return { eventId, decision, payload }
}

export function classifyDecisionReplay(
  currentDecision: BoundApprovalDecision | null,
  requestedDecision: 'approved' | 'rejected'
): DecisionReplayClassification {
  if (!currentDecision) return 'new'
  return currentDecision.decision === requestedDecision ? 'idempotent' : 'conflict'
}

export function isExecutionBoundToRequest(params: {
  row: RuntimeApprovalEventRow
  agentId: string
  approvalId: string
  requestEventId: string
}): boolean {
  const rowAgentId =
    typeof params.row.agent_id === 'string' ? params.row.agent_id.trim() : ''
  const payload = parseRuntimeEventPayload(params.row.payload)
  const payloadApprovalId =
    typeof payload?.approval_id === 'string' ? payload.approval_id.trim() : ''
  const payloadRequestEventId =
    typeof payload?.request_event_id === 'string' ? payload.request_event_id.trim() : ''

  return (
    rowAgentId === params.agentId &&
    payloadApprovalId === params.approvalId &&
    (!payloadRequestEventId || payloadRequestEventId === params.requestEventId)
  )
}
