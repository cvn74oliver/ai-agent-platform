import { createHash } from 'node:crypto'

export type DecisionWorkspaceExecutionRunStatus =
  | 'claimed'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'partial'
  | 'indeterminate'
  | 'reverted'

export type DecisionWorkspaceExecutionActionStatus =
  | 'claimed'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'partial'
  | 'indeterminate'
  | 'skipped'
  | 'reverted'

export type DecisionWorkspaceExecutionReconciliationStatus =
  | 'not_required'
  | 'pending'
  | 'manual_required'
  | 'resolved'

export type DecisionWorkspaceExecutionActionInput = Readonly<{
  tool: string
  action: string
  args?: unknown
  providerType: string
  sourceId?: string | null
  connectionId?: string | null
  agentRoleId?: string | null
  capability: string
  effect: 'decision_only' | 'provider_read' | 'provider_write'
  reversibility: 'reversible' | 'compensating_action' | 'irreversible' | 'not_applicable'
}>

export type PreparedDecisionWorkspaceExecutionAction = Readonly<{
  idempotency_key: string
  provider_type: string
  source_id: string | null
  connection_id: string | null
  agent_role_id: string | null
  tool: string
  action: string
  capability: string
  effect: DecisionWorkspaceExecutionActionInput['effect']
  reversibility: DecisionWorkspaceExecutionActionInput['reversibility']
  approved_action: Readonly<{
    tool: string
    action: string
    args?: unknown
  }>
}>

export type PreparedDecisionWorkspaceExecutionClaim = Readonly<{
  executionKey: string
  actionFingerprint: string
  workflowContext: Readonly<Record<string, unknown>>
  actions: readonly PreparedDecisionWorkspaceExecutionAction[]
}>

export type DecisionWorkspaceExecutionActionOutcome = Readonly<{
  status: Extract<
    DecisionWorkspaceExecutionActionStatus,
    'succeeded' | 'failed' | 'partial' | 'indeterminate'
  >
  receipt: Readonly<Record<string, unknown>> | null
  errorCode: string | null
  reconciliationStatus: DecisionWorkspaceExecutionReconciliationStatus
}>

const IDENTIFIER = /^[a-z0-9][a-z0-9._:-]*$/
const FORBIDDEN_RECEIPT_KEY =
  /^(authorization|cookie|password|secret|access[_-]?token|refresh[_-]?token|client[_-]?secret|raw|body|message[_-]?body|mime)$/i
const MAX_RECEIPT_BYTES = 262_144
const MAX_RECEIPT_DEPTH = 8

function nonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) throw new Error(`${label} must be a stable identifier.`)
}

function canonicalizeJson(value: unknown, depth = 0): unknown {
  if (depth > MAX_RECEIPT_DEPTH) throw new Error('JSON value exceeds the supported depth.')
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('JSON numbers must be finite.')
    return value
  }
  if (Array.isArray(value)) return value.map((entry) => canonicalizeJson(entry, depth + 1))
  if (typeof value !== 'object') throw new Error('Value is not JSON serializable.')

  const record = value as Record<string, unknown>
  const canonical: Record<string, unknown> = {}
  for (const key of Object.keys(record).sort()) {
    const entry = record[key]
    if (entry === undefined) continue
    canonical[key] = canonicalizeJson(entry, depth + 1)
  }
  return canonical
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalizeJson(value))
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function sanitizeDecisionWorkspaceProviderReceipt(
  receipt: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  const inspect = (value: unknown, depth: number): unknown => {
    if (depth > MAX_RECEIPT_DEPTH) throw new Error('Provider receipt exceeds the supported depth.')
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Provider receipt numbers must be finite.')
      return value
    }
    if (Array.isArray(value)) return value.map((entry) => inspect(entry, depth + 1))
    if (typeof value !== 'object') throw new Error('Provider receipt is not JSON serializable.')

    const clean: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (FORBIDDEN_RECEIPT_KEY.test(key)) {
        throw new Error(`Provider receipt contains prohibited key: ${key}.`)
      }
      const entry = (value as Record<string, unknown>)[key]
      if (entry === undefined) continue
      clean[key] = inspect(entry, depth + 1)
    }
    return clean
  }

  const clean = inspect(receipt, 0) as Record<string, unknown>
  if (Buffer.byteLength(JSON.stringify(clean), 'utf8') > MAX_RECEIPT_BYTES) {
    throw new Error('Provider receipt exceeds the supported size.')
  }
  return clean
}

export function prepareDecisionWorkspaceExecutionClaim(params: {
  tenantId: string
  agentId: string
  requestEventId: string
  workflowContext?: Readonly<Record<string, unknown>>
  actions: readonly DecisionWorkspaceExecutionActionInput[]
}): PreparedDecisionWorkspaceExecutionClaim {
  if (!nonEmpty(params.tenantId) || !nonEmpty(params.agentId) || !nonEmpty(params.requestEventId)) {
    throw new Error('Execution identity is incomplete.')
  }
  if (params.actions.length < 1 || params.actions.length > 50) {
    throw new Error('Execution action count must be between 1 and 50.')
  }

  const executionKey = `decision-execution:v1:${digest(
    `${params.tenantId}\u0000${params.agentId}\u0000${params.requestEventId}`
  )}`
  const preparedActions = params.actions.map((input, index) => {
    assertIdentifier(input.tool, 'Execution tool')
    assertIdentifier(input.action, 'Execution action')
    assertIdentifier(input.providerType, 'Provider type')
    assertIdentifier(input.capability, 'Execution capability')
    const approvedAction = {
      tool: input.tool,
      action: input.action,
      ...(input.args === undefined ? {} : { args: canonicalizeJson(input.args) }),
    }
    const idempotencyKey = `decision-action:v1:${digest(
      `${executionKey}\u0000${index}\u0000${stableJson(approvedAction)}`
    )}`

    return {
      idempotency_key: idempotencyKey,
      provider_type: input.providerType,
      source_id: input.sourceId?.trim() || null,
      connection_id: input.connectionId?.trim() || null,
      agent_role_id: input.agentRoleId?.trim() || null,
      tool: input.tool,
      action: input.action,
      capability: input.capability,
      effect: input.effect,
      reversibility: input.reversibility,
      approved_action: approvedAction,
    }
  })

  return {
    executionKey,
    actionFingerprint: `decision-actions:v1:${digest(stableJson(preparedActions))}`,
    workflowContext: canonicalizeJson(params.workflowContext || {}) as Record<string, unknown>,
    actions: preparedActions,
  }
}

export function canTransitionDecisionWorkspaceExecutionAction(
  from: DecisionWorkspaceExecutionActionStatus,
  to: DecisionWorkspaceExecutionActionStatus
): boolean {
  if (from === 'claimed') {
    return to === 'executing' || to === 'failed' || to === 'indeterminate' || to === 'skipped'
  }
  if (from === 'executing') {
    return to === 'succeeded' || to === 'failed' || to === 'partial' || to === 'indeterminate'
  }
  return (from === 'succeeded' || from === 'partial') && to === 'reverted'
}

export function aggregateDecisionWorkspaceExecutionStatus(
  statuses: readonly DecisionWorkspaceExecutionActionStatus[]
): DecisionWorkspaceExecutionRunStatus {
  if (statuses.length === 0) throw new Error('Execution requires at least one action status.')
  if (statuses.some((status) => status === 'claimed' || status === 'executing')) return 'executing'
  if (statuses.some((status) => status === 'indeterminate')) return 'indeterminate'
  if (statuses.every((status) => status === 'succeeded')) return 'succeeded'
  if (statuses.every((status) => status === 'reverted')) return 'reverted'
  if (statuses.some((status) => status === 'succeeded' || status === 'partial')) return 'partial'
  return 'failed'
}

export function staleDecisionWorkspaceExecutionStatus(params: {
  status: DecisionWorkspaceExecutionRunStatus
  leaseExpiresAt: string
  now?: Date
}): DecisionWorkspaceExecutionRunStatus {
  if (params.status !== 'claimed' && params.status !== 'executing') return params.status
  const leaseExpiresAt = Date.parse(params.leaseExpiresAt)
  if (!Number.isFinite(leaseExpiresAt)) return 'indeterminate'
  return leaseExpiresAt <= (params.now || new Date()).getTime() ? 'indeterminate' : params.status
}
