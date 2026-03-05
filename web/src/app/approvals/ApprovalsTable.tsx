'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { RuntimePendingApproval, RuntimeProposedAction } from '@/lib/runtime/types'

type Props = {
  pendingApprovals: RuntimePendingApproval[]
  confidenceByAgentAction: Record<string, Record<string, number>>
}

function shortText(value: string, max = 100) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

const CONFIDENCE_THRESHOLD = 10

function formatConfidence(
  agentId: string,
  proposedActions: RuntimeProposedAction[] | undefined,
  confidenceByAgentAction: Record<string, Record<string, number>>
) {
  const actions = Array.isArray(proposedActions) ? proposedActions : []
  if (actions.length === 0) return '—'

  const map = confidenceByAgentAction[agentId] || {}
  const lines: string[] = []
  for (const a of actions) {
    const key = `${a.tool}::${a.action}`
    const n = map[key] ?? 0
    lines.push(`${a.tool}.${a.action}: ${n} / ${CONFIDENCE_THRESHOLD}`)
  }
  return lines.join('\n')
}

export default function ApprovalsTable({ pendingApprovals, confidenceByAgentAction }: Props) {
  const [rows, setRows] = useState<RuntimePendingApproval[]>(pendingApprovals)
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({})

  const hasRows = rows.length > 0

  const rowMap = useMemo(() => {
    const map = new Map<string, RuntimePendingApproval>()
    for (const row of rows) map.set(row.approval_id, row)
    return map
  }, [rows])

  async function submitDecision(
    approvalId: string,
    decision: 'approved' | 'rejected'
  ) {
    const row = rowMap.get(approvalId)
    if (!row) return

    setSubmittingIds((prev) => ({ ...prev, [approvalId]: true }))
    try {
      const res = await fetch('/api/runtime/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: row.agent_id,
          approval_id: row.approval_id,
          decision,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const message =
          json && typeof json.error === 'string'
            ? json.error
            : 'Failed to submit decision.'
        alert(message)
        setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
        return
      }

      setRows((prev) => prev.filter((item) => item.approval_id !== approvalId))
      setSubmittingIds((prev) => {
        const next = { ...prev }
        delete next[approvalId]
        return next
      })
    } catch {
      alert('Failed to submit decision.')
      setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
    }
  }

  if (!hasRows) return <p>No pending approvals.</p>

  const decisionButtonBaseStyle: CSSProperties = {
    padding: '6px 10px',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  }

  return (
    <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th align="left">approval_id</th>
          <th align="left">created_at</th>
          <th align="left">user_request</th>
          <th align="left">decision</th>
          <th align="left">confidence</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item) => {
          const disabled = submittingIds[item.approval_id] === true
          return (
            <tr key={item.approval_id}>
              <td>{item.approval_id}</td>
              <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
              <td title={item.user_request}>{shortText(item.user_request)}</td>
              <td>
                <button
                  type="button"
                  disabled={disabled}
                  style={{
                    ...decisionButtonBaseStyle,
                    borderColor: '#1d4ed8',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                  }}
                  onClick={() => submitDecision(item.approval_id, 'approved')}
                >
                  Approve
                </button>{' '}
                <button
                  type="button"
                  disabled={disabled}
                  style={{
                    ...decisionButtonBaseStyle,
                    borderColor: '#b91c1c',
                    background: '#dc2626',
                    color: '#ffffff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                  }}
                  onClick={() => submitDecision(item.approval_id, 'rejected')}
                >
                  Reject
                </button>
              </td>
              <td style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                {formatConfidence(item.agent_id, item.proposed_actions, confidenceByAgentAction)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
