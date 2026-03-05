'use client'

import { useMemo, useState } from 'react'
import type { RuntimePendingApproval } from '@/lib/runtime/types'

type Props = {
  pendingApprovals: RuntimePendingApproval[]
}

function shortText(value: string, max = 100) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

export default function ApprovalsTable({ pendingApprovals }: Props) {
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

  return (
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
                  onClick={() => submitDecision(item.approval_id, 'approved')}
                >
                  Approve
                </button>{' '}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => submitDecision(item.approval_id, 'rejected')}
                >
                  Reject
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
