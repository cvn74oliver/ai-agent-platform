import { getSupabaseAdmin } from '@/lib/supabase'

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

type PendingApproval = {
  approval_id: string
  agent_id: string
  created_at: string
  user_request: string
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

function shortText(value: string, max = 100) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
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

  const pendingApprovals: PendingApproval[] = []
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

      {!requestError && !decisionError && pendingApprovals.length === 0 ? (
        <p>No pending approvals.</p>
      ) : null}

      {pendingApprovals.length > 0 ? (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">approval_id</th>
              <th align="left">created_at</th>
              <th align="left">user_request</th>
              <th align="left">decision</th>
            </tr>
          </thead>
          <tbody>
            {pendingApprovals.map((item) => (
              <tr key={item.approval_id} data-approval-row={item.approval_id}>
                <td>{item.approval_id}</td>
                <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                <td title={item.user_request}>{shortText(item.user_request)}</td>
                <td>
                  <button
                    type="button"
                    style={{
                      padding: '6px 10px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                    data-runtime-decision="approved"
                    data-agent-id={item.agent_id}
                    data-approval-id={item.approval_id}
                  >
                    Approve
                  </button>{' '}
                  <button
                    type="button"
                    style={{
                      padding: '6px 10px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                    data-runtime-decision="rejected"
                    data-agent-id={item.agent_id}
                    data-approval-id={item.approval_id}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (() => {
              async function submitDecision(button) {
                if (!(button instanceof HTMLButtonElement)) return;
                const decision = button.getAttribute('data-runtime-decision');
                const approvalId = button.getAttribute('data-approval-id');
                const agentId = button.getAttribute('data-agent-id');
                if (!decision || !approvalId || !agentId) return;

                const allButtons = Array.from(document.querySelectorAll('button[data-approval-id="' + approvalId + '"]'));
                allButtons.forEach((btn) => { btn.disabled = true; });

                try {
                  const res = await fetch('/api/runtime/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      agent_id: agentId,
                      approval_id: approvalId,
                      decision
                    }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok || !json?.ok) {
                    const message = (json && typeof json.error === 'string') ? json.error : 'Failed to submit decision.';
                    alert(message);
                    allButtons.forEach((btn) => { btn.disabled = false; });
                    return;
                  }

                  const row = document.querySelector('[data-approval-row="' + approvalId + '"]');
                  if (row) row.remove();
                } catch (err) {
                  alert('Failed to submit decision.');
                  allButtons.forEach((btn) => { btn.disabled = false; });
                }
              }

              document.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                const button = target.closest('button[data-runtime-decision]');
                if (!button) return;
                event.preventDefault();
                submitDecision(button);
              });
            })();
          `,
        }}
      />
    </main>
  )
}
