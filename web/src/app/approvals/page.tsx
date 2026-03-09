import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  RuntimeApprovalStatus,
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
  auto_approved?: boolean
}

type ExecutionResultPayload = {
  approval_id?: string
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

type SearchParams = Record<string, string | string[] | undefined>

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function firstSearchParamValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : null
  return null
}

function buildSafePlaygroundReturnPath(returnToRaw: string | null): string | null {
  if (!returnToRaw) return null
  if (!returnToRaw.startsWith('/') || returnToRaw.startsWith('//')) return null

  try {
    const url = new URL(returnToRaw, 'http://localhost')
    url.searchParams.set('runtime_refresh', '1')
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
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
    auto_approved: record.auto_approved === true,
  }
}

function parseExecutionPayload(value: unknown): ExecutionResultPayload {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  const record = toRecord(parsed)
  if (!record) return {}
  return {
    approval_id: typeof record.approval_id === 'string' ? record.approval_id : undefined,
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

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<SearchParams>).then === 'function'
      ? await (searchParams as Promise<SearchParams>)
      : (searchParams as SearchParams | undefined) || {}
  const returnToRaw = firstSearchParamValue(resolvedSearchParams.return_to)
  const playgroundReturnPath = buildSafePlaygroundReturnPath(returnToRaw)

  const supabase = await getSupabaseAdmin()

  const [
    { data: requestRows, error: requestError },
    { data: decisionRows, error: decisionError },
    { data: confidenceRows, error: confidenceError },
    { data: modeRows, error: modeError },
    { data: executionRows, error: executionError },
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
    supabase
      .from('agent_events')
      .select('id, agent_id, event_type, created_at, payload')
      .eq('event_type', 'execution_result')
      .order('created_at', { ascending: false })
      .limit(200),
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
  const executions = ((executionRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'execution_result'
  )

  const latestDecisionByApproval = new Map<
    string,
    { decision: 'approved' | 'rejected'; auto_approved: boolean }
  >()
  for (const row of decisions) {
    try {
      const payload = parseDecisionPayload(row.payload)
      if (!payload.approval_id || !payload.decision) continue
      if (!latestDecisionByApproval.has(payload.approval_id)) {
        latestDecisionByApproval.set(payload.approval_id, {
          decision: payload.decision,
          auto_approved: payload.auto_approved === true,
        })
      }
    } catch {
      continue
    }
  }

  const executedApprovalIds = new Set<string>()
  for (const row of executions) {
    try {
      const payload = parseExecutionPayload(row.payload)
      if (!payload.approval_id) continue
      executedApprovalIds.add(payload.approval_id)
    } catch {
      continue
    }
  }

  const approvalRows: RuntimePendingApproval[] = []
  const seenApprovalIds = new Set<string>()
  for (const row of requests) {
    try {
      const payload = parseRequestPayload(row.payload)
      const approvalId = payload.approval_id
      const agentId = payload.agent_id || row.agent_id || ''
      if (!approvalId || !agentId || seenApprovalIds.has(approvalId)) continue
      seenApprovalIds.add(approvalId)

      const decision = latestDecisionByApproval.get(approvalId)
      if (decision?.decision === 'rejected') continue

      const executed = executedApprovalIds.has(approvalId)
      let status: RuntimeApprovalStatus = 'pending'
      if (executed) {
        status = 'executed'
      } else if (decision?.decision === 'approved') {
        status = decision.auto_approved ? 'auto-approved' : 'approved'
      }

      approvalRows.push({
        approval_id: approvalId,
        agent_id: agentId,
        created_at: payload.created_at || row.created_at || '',
        user_request: payload.user_request || '',
        proposed_actions: payload.proposed_actions,
        decision: decision?.decision,
        auto_approved: decision?.auto_approved === true,
        executed,
        status,
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
  for (const approval of approvalRows) {
    agentIds.add(approval.agent_id)
  }
  for (const agentId of Object.keys(confidenceByAgentAction)) {
    agentIds.add(agentId)
  }
  for (const agentId of agentIds) {
    agentModeByAgentId[agentId] = latestModeByAgentId.get(agentId) || 'training'
  }

  const pendingApprovalsWithEligibility: RuntimePendingApproval[] = approvalRows.map((approval) => {
    const actions = Array.isArray(approval.proposed_actions) ? approval.proposed_actions : []
    const agentMap = confidenceByAgentAction[approval.agent_id] || {}
    const autoApproveEligible =
      actions.length > 0 &&
      actions.every((action) => {
        const key = `${action.tool}::${action.action}`
        const approvedCount = agentMap[key] ?? 0
        return approvedCount >= CONFIDENCE_THRESHOLD
      })

    return {
      ...approval,
      auto_approve_eligible: autoApproveEligible,
    }
  })

  const queueCounts = {
    pending: pendingApprovalsWithEligibility.filter((approval) => approval.status === 'pending').length,
    approved: pendingApprovalsWithEligibility.filter((approval) => approval.status === 'approved').length,
    autoApproved: pendingApprovalsWithEligibility.filter((approval) => approval.status === 'auto-approved')
      .length,
    executed: pendingApprovalsWithEligibility.filter((approval) => approval.status === 'executed').length,
  }
  const totalQueueItems = pendingApprovalsWithEligibility.length
  const hasLoadError = Boolean(
    requestError || decisionError || confidenceError || modeError || executionError
  )

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">Approvals Queue</p>
              <p className="text-xs text-gray-400">
                Review, approve, and execute runtime actions in guarded order.
              </p>
            </div>
            {playgroundReturnPath ? (
              <a
                href={playgroundReturnPath}
                className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white"
              >
                ← Back to Playground
              </a>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded border border-gray-800 bg-gray-950/60 p-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Total</p>
              <p className="text-base font-semibold">{totalQueueItems}</p>
            </div>
            <div className="rounded border border-amber-900/60 bg-gray-950/60 p-2">
              <p className="text-[11px] uppercase tracking-wide text-amber-300">Pending</p>
              <p className="text-base font-semibold">{queueCounts.pending}</p>
            </div>
            <div className="rounded border border-blue-900/60 bg-gray-950/60 p-2">
              <p className="text-[11px] uppercase tracking-wide text-blue-300">Approved</p>
              <p className="text-base font-semibold">{queueCounts.approved + queueCounts.autoApproved}</p>
            </div>
            <div className="rounded border border-emerald-900/60 bg-gray-950/60 p-2">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300">Executed</p>
              <p className="text-base font-semibold">{queueCounts.executed}</p>
            </div>
          </div>
        </div>

        {hasLoadError ? (
          <div className="rounded border border-rose-900/60 bg-rose-950/30 p-3 text-sm text-rose-100">
            Failed to load approvals.
            {requestError ? ` request: ${requestError.message}` : ''}
            {decisionError ? ` decision: ${decisionError.message}` : ''}
            {confidenceError ? ` confidence: ${confidenceError.message}` : ''}
            {modeError ? ` mode: ${modeError.message}` : ''}
            {executionError ? ` execution: ${executionError.message}` : ''}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-3">
            <ApprovalsTable
              pendingApprovals={pendingApprovalsWithEligibility}
              confidenceByAgentAction={confidenceByAgentAction}
              agentModeByAgentId={agentModeByAgentId}
            />
          </div>
        )}
      </div>
    </main>
  )
}
