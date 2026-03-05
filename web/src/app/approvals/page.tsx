import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  RuntimeMode,
  RuntimePendingApproval,
  RuntimeProposedAction,
} from '@/lib/runtime/types'
import ApprovalsTable from './ApprovalsTable'

export const dynamic = 'force-dynamic'
const CONFIDENCE_THRESHOLD = 10

type AgentEventRow = {
  id: string
  agent_id: string | null
  event_type: string | null
  created_at: string | null
  payload: unknown
}

type ApprovalRequestPayload = {
  approval_id?: string
  agent_id?: string
  user_request?: string
  created_at?: string
  proposed_actions?: RuntimeProposedAction[]
}

type ApprovalDecisionPayload = {
  approval_id?: string
  decision?: 'approved' | 'rejected'
}

type ConfidenceUpdatePayload = {
  decision?: 'approved' | 'rejected'
  tool?: string
  action?: string
  new_count?: number
}

type RuntimeModeUpdatePayload = {
  mode?: RuntimeMode
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function parseProposedActions(value: unknown): RuntimeProposedAction[] | undefined {
  if (!Array.isArray(value)) return undefined

  const actions: RuntimeProposedAction[] = []
  for (const item of value) {
    const record = toRecord(item)
    if (!record) continue

    const tool = typeof record.tool === 'string' ? record.tool : undefined
    const action = typeof record.action === 'string' ? record.action : undefined
    if (!tool || !action) continue

    const parsedAction: RuntimeProposedAction = { tool, action }
    if ('args' in record) parsedAction.args = record.args
    actions.push(parsedAction)
  }

  return actions
}

function parseRequestPayload(value: unknown): ApprovalRequestPayload {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const record = toRecord(parsed)
  if (!record) return {}
  return {
    approval_id: typeof record.approval_id === 'string' ? record.approval_id : undefined,
    agent_id: typeof record.agent_id === 'string' ? record.agent_id : undefined,
    user_request: typeof record.user_request === 'string' ? record.user_request : undefined,
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    proposed_actions: parseProposedActions(record.proposed_actions),
  }
}

function parseDecisionPayload(value: unknown): ApprovalDecisionPayload {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const record = toRecord(parsed)
  if (!record) return {}
  return {
    approval_id: typeof record.approval_id === 'string' ? record.approval_id : undefined,
    decision:
      record.decision === 'approved' || record.decision === 'rejected'
        ? record.decision
        : undefined,
  }
}

function parseConfidencePayload(value: unknown): ConfidenceUpdatePayload {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const record = toRecord(parsed)
  if (!record) return {}

  let newCount: number | undefined
  if (typeof record.new_count === 'number') {
    newCount = record.new_count
  } else if (typeof record.new_count === 'string') {
    const parsedCount = Number(record.new_count)
    if (Number.isFinite(parsedCount)) newCount = parsedCount
  }

  return {
    decision:
      record.decision === 'approved' || record.decision === 'rejected'
        ? record.decision
        : undefined,
    tool: typeof record.tool === 'string' ? record.tool : undefined,
    action: typeof record.action === 'string' ? record.action : undefined,
    new_count: newCount,
  }
}

function parseModePayload(value: unknown): RuntimeModeUpdatePayload {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const record = toRecord(parsed)
  if (!record) return {}
  return {
    mode: record.mode === 'training' || record.mode === 'guarded' ? record.mode : undefined,
  }
}

export default async function ApprovalsPage() {
  const supabase = await getSupabaseAdmin()

  const [
    { data: requestRows, error: requestError },
    { data: decisionRows, error: decisionError },
    { data: confidenceRows, error: confidenceError },
    { data: modeRows, error: modeError },
  ] = await Promise.all([
      supabase
        .from('agent_events')
        .select('id, agent_id, event_type, created_at, payload')
        .eq('event_type', 'approval_request')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('agent_events')
        .select('id, agent_id, event_type, created_at, payload')
        .eq('event_type', 'approval_decision')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('agent_events')
        .select('id, agent_id, event_type, created_at, payload')
        .eq('event_type', 'confidence_update')
        .eq('payload->>decision', 'approved')
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase
        .from('agent_events')
        .select('id, agent_id, event_type, created_at, payload')
        .eq('event_type', 'runtime_mode_update')
        .order('created_at', { ascending: false })
        .limit(2000),
    ])

  const requests = ((requestRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'approval_request'
  )
  const decisions = ((decisionRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'approval_decision'
  )
  const confidenceUpdates = ((confidenceRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'confidence_update'
  )
  const modeUpdates = ((modeRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'runtime_mode_update'
  )

  const latestDecisionByApproval = new Map<string, 'approved' | 'rejected'>()
  for (const row of decisions) {
    try {
      const payload = parseDecisionPayload(row.payload)
      if (!payload.approval_id || !payload.decision) continue
      if (!latestDecisionByApproval.has(payload.approval_id)) {
        latestDecisionByApproval.set(payload.approval_id, payload.decision)
      }
    } catch {
      continue
    }
  }

  const pendingApprovals: RuntimePendingApproval[] = []
  for (const row of requests) {
    try {
      const payload = parseRequestPayload(row.payload)
      const approvalId = payload.approval_id
      const agentId = payload.agent_id || row.agent_id || ''
      if (!approvalId || !agentId) continue
      if (latestDecisionByApproval.has(approvalId)) continue

      pendingApprovals.push({
        approval_id: approvalId,
        agent_id: agentId,
        created_at: payload.created_at || row.created_at || '',
        user_request: payload.user_request || '',
        proposed_actions: payload.proposed_actions,
      })
    } catch {
      continue
    }
  }

  const confidenceByAgentAction: Record<string, Record<string, number>> = {}
  for (const row of confidenceUpdates) {
    try {
      if (!row.agent_id) continue
      const payload = parseConfidencePayload(row.payload)
      if (
        payload.decision !== 'approved' ||
        !payload.tool ||
        !payload.action ||
        typeof payload.new_count !== 'number'
      ) {
        continue
      }

      const actionKey = `${payload.tool}::${payload.action}`
      const agentMap = confidenceByAgentAction[row.agent_id] || {}
      const current = agentMap[actionKey] ?? Number.NEGATIVE_INFINITY
      if (payload.new_count > current) {
        agentMap[actionKey] = payload.new_count
        confidenceByAgentAction[row.agent_id] = agentMap
      }
    } catch {
      continue
    }
  }

  const latestModeByAgentId = new Map<string, RuntimeMode>()
  for (const row of modeUpdates) {
    try {
      if (!row.agent_id || latestModeByAgentId.has(row.agent_id)) continue
      const payload = parseModePayload(row.payload)
      if (!payload.mode) continue
      latestModeByAgentId.set(row.agent_id, payload.mode)
    } catch {
      continue
    }
  }

  const agentModeByAgentId: Record<string, RuntimeMode> = {}
  const agentIds = new Set<string>()
  for (const pending of pendingApprovals) {
    agentIds.add(pending.agent_id)
  }
  for (const agentId of Object.keys(confidenceByAgentAction)) {
    agentIds.add(agentId)
  }
  for (const agentId of agentIds) {
    agentModeByAgentId[agentId] = latestModeByAgentId.get(agentId) || 'training'
  }

  const pendingApprovalsWithEligibility: RuntimePendingApproval[] = pendingApprovals.map(
    (pending) => {
      const actions = Array.isArray(pending.proposed_actions) ? pending.proposed_actions : []
      const agentMap = confidenceByAgentAction[pending.agent_id] || {}
      const autoApproveEligible =
        actions.length > 0 &&
        actions.every((action) => {
          const key = `${action.tool}::${action.action}`
          const approvedCount = agentMap[key] ?? 0
          return approvedCount >= CONFIDENCE_THRESHOLD
        })

      return {
        ...pending,
        auto_approve_eligible: autoApproveEligible,
      }
    }
  )

  return (
    <main style={{ padding: 24 }}>
      <h1>Approvals</h1>

      {requestError || decisionError || confidenceError || modeError ? (
        <p>
          Failed to load approvals.
          {requestError ? ` request: ${requestError.message}` : ''}
          {decisionError ? ` decision: ${decisionError.message}` : ''}
          {confidenceError ? ` confidence: ${confidenceError.message}` : ''}
          {modeError ? ` mode: ${modeError.message}` : ''}
        </p>
      ) : null}

      {!requestError && !decisionError && !confidenceError && !modeError ? (
        <ApprovalsTable
          pendingApprovals={pendingApprovalsWithEligibility}
          confidenceByAgentAction={confidenceByAgentAction}
          agentModeByAgentId={agentModeByAgentId}
        />
      ) : null}
    </main>
  )
}
