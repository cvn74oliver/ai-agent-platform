import { getSupabaseAdmin } from '@/lib/supabase'
import type { RuntimePendingApproval } from '@/lib/runtime/types'
import ApprovalsTable from './ApprovalsTable'

export const dynamic = 'force-dynamic'

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
}

type ApprovalDecisionPayload = {
  approval_id?: string
  decision?: 'approved' | 'rejected'
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
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

export default async function ApprovalsPage() {
  const supabase = await getSupabaseAdmin()

  const [{ data: requestRows, error: requestError }, { data: decisionRows, error: decisionError }] =
    await Promise.all([
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
    ])

  const requests = ((requestRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'approval_request'
  )
  const decisions = ((decisionRows || []) as AgentEventRow[]).filter(
    (row) => row.event_type === 'approval_decision'
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
      })
    } catch {
      continue
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Approvals</h1>

      {requestError || decisionError ? (
        <p>
          Failed to load approvals.
          {requestError ? ` request: ${requestError.message}` : ''}
          {decisionError ? ` decision: ${decisionError.message}` : ''}
        </p>
      ) : null}

      {!requestError && !decisionError ? (
        <ApprovalsTable pendingApprovals={pendingApprovals} />
      ) : null}
    </main>
  )
}
