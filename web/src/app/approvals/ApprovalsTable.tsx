'use client'

import { useMemo, useState } from 'react'
import type {
  RuntimeApprovalStatus,
  RuntimeMode,
  RuntimePendingApproval,
  RuntimeProposedAction,
} from '@/lib/runtime/types'
import { buildApprovalDecisionSummary } from '@/lib/runtime/approvalSummary'
import ApprovalDecisionCard from '@/components/runtime/ApprovalDecisionCard'

type Props = {
  pendingApprovals: RuntimePendingApproval[]
  confidenceByAgentAction: Record<string, Record<string, number>>
  agentModeByAgentId: Record<string, RuntimeMode>
}

function shortText(value: string, max = 100) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

function shortApprovalId(value: string) {
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

function shortSessionId(value: string) {
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
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
    lines.push(
      `${a.tool}.${a.action}: ${n} / ${CONFIDENCE_THRESHOLD} ${
        n >= CONFIDENCE_THRESHOLD ? '✅ eligible' : '⏳ training'
      }`
    )
  }
  return lines.join('\n')
}

function normalizeStatus(status: RuntimePendingApproval['status']): RuntimeApprovalStatus {
  if (status === 'approved' || status === 'auto-approved' || status === 'executed') {
    return status
  }
  return 'pending'
}

function areExecutableActions(proposedActions: RuntimeProposedAction[] | undefined): boolean {
  if (!Array.isArray(proposedActions)) return false
  return proposedActions.every((action) => {
    if (action.tool === 'sandbox') return true
    if (action.tool === 'gmail' && action.action === 'draft_email') return true
    if (action.tool === 'gmail' && action.action === 'analyze_inbox') return true
    if (action.tool === 'gmail' && action.action === 'review_sender_cluster') return true
    if (action.tool === 'gmail' && action.action === 'review_query_cluster') return true
    if (action.tool === 'gmail' && action.action === 'archive_messages') return true
    return false
  })
}

function describeAction(action: RuntimeProposedAction | undefined): string {
  if (!action) return 'No proposed action details.'
  const args =
    typeof action.args === 'object' && action.args !== null
      ? (action.args as Record<string, unknown>)
      : null
  const sender = typeof args?.sender === 'string' && args.sender.trim() ? args.sender.trim() : null
  const clusterTitle =
    typeof args?.title === 'string' && args.title.trim() ? args.title.trim() : null
  const batchTitle =
    typeof args?.batch_title === 'string' && args.batch_title.trim() ? args.batch_title.trim() : null
  const query =
    typeof args?.query === 'string' && args.query.trim() ? args.query.trim() : null

  if (action.tool === 'gmail' && action.action === 'review_sender_cluster') {
    return `Review sender sample${sender ? `: ${sender}` : ''}${batchTitle ? ` · ${batchTitle}` : ''}`
  }
  if (action.tool === 'gmail' && action.action === 'review_query_cluster') {
    return `Preview query cluster${clusterTitle ? `: ${clusterTitle}` : ''}${query ? ` · ${shortText(query, 80)}` : ''}`
  }
  if (action.tool === 'gmail' && action.action === 'analyze_inbox') {
    return 'Analyze inbox sample metadata'
  }

  return `${action.tool}.${action.action}`
}

function executeLabelForAction(action: RuntimeProposedAction | undefined): string {
  if (!action) return 'Execute approved action'
  if (action.tool === 'gmail' && action.action === 'archive_messages') return 'Execute archive action'
  if (action.tool === 'gmail' && action.action === 'review_query_cluster') {
    return 'Execute query review'
  }
  if (action.tool === 'gmail' && action.action === 'review_sender_cluster') {
    return 'Execute sender review'
  }
  if (action.tool === 'gmail' && action.action === 'analyze_inbox') {
    return 'Execute inbox analysis'
  }
  return 'Execute approved action'
}

export default function ApprovalsTable({
  pendingApprovals,
  confidenceByAgentAction,
  agentModeByAgentId,
}: Props) {
  const [rows, setRows] = useState<RuntimePendingApproval[]>(pendingApprovals)
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({})

  const hasRows = rows.length > 0

  const rowMap = useMemo(() => {
    const map = new Map<string, RuntimePendingApproval>()
    for (const row of rows) map.set(row.approval_id, row)
    return map
  }, [rows])

  async function submitDecision(approvalId: string, decision: 'approved' | 'rejected') {
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
          json && typeof json.error === 'string' ? json.error : 'Failed to submit decision.'
        alert(message)
        setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
        return
      }

      setRows((prev) =>
        prev.map((item) =>
          item.approval_id === approvalId
            ? {
                ...item,
                decision,
                auto_approved: false,
                status: decision === 'approved' ? 'approved' : 'pending',
              }
            : item
        )
      )

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

  async function submitAutoApprove(approvalId: string) {
    const row = rowMap.get(approvalId)
    if (!row) return

    setSubmittingIds((prev) => ({ ...prev, [approvalId]: true }))
    try {
      const res = await fetch('/api/runtime/auto-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: row.agent_id,
          approval_id: row.approval_id,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const message =
          json && typeof json.error === 'string' ? json.error : 'Failed to auto-approve.'
        alert(message)
        setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
        return
      }

      setRows((prev) =>
        prev.map((item) =>
          item.approval_id === approvalId
            ? {
                ...item,
                decision: 'approved',
                auto_approved: true,
                status: 'auto-approved',
              }
            : item
        )
      )

      setSubmittingIds((prev) => {
        const next = { ...prev }
        delete next[approvalId]
        return next
      })
    } catch {
      alert('Failed to auto-approve.')
      setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
    }
  }

  async function submitExecute(approvalId: string) {
    const row = rowMap.get(approvalId)
    if (!row) return

    setSubmittingIds((prev) => ({ ...prev, [approvalId]: true }))
    try {
      const res = await fetch('/api/runtime/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: row.agent_id,
          approval_id: row.approval_id,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        const message =
          json && typeof json.error === 'string' ? json.error : 'Failed to execute actions.'
        alert(message)
        setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
        return
      }

      setRows((prev) =>
        prev.map((item) =>
          item.approval_id === approvalId
            ? {
                ...item,
                executed: true,
                status: 'executed',
              }
            : item
        )
      )
      setSubmittingIds((prev) => {
        const next = { ...prev }
        delete next[approvalId]
        return next
      })
    } catch {
      alert('Failed to execute actions.')
      setSubmittingIds((prev) => ({ ...prev, [approvalId]: false }))
    }
  }

  if (!hasRows) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-4 text-sm text-gray-400">
        No pending approvals.
      </div>
    )
  }

  function statusChip(status: RuntimeApprovalStatus) {
    if (status === 'executed') {
      return 'rounded-full border border-emerald-900/70 bg-emerald-950/40 px-2 py-0.5 text-[11px] text-emerald-200'
    }
    if (status === 'approved' || status === 'auto-approved') {
      return 'rounded-full border border-blue-900/70 bg-blue-950/40 px-2 py-0.5 text-[11px] text-blue-200'
    }
    return 'rounded-full border border-amber-900/70 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-200'
  }

  const pendingRows = rows.filter(
    (item) => normalizeStatus(item.status) === 'pending' && item.decision !== 'rejected'
  )
  const approvedRows = rows.filter((item) => {
    const status = normalizeStatus(item.status)
    return (status === 'approved' || status === 'auto-approved') && item.decision !== 'rejected'
  })
  const executedRows = rows.filter((item) => normalizeStatus(item.status) === 'executed')
  const rejectedRows = rows.filter((item) => item.decision === 'rejected')
  const liveQueueCounts = {
    total: rows.length,
    pending: pendingRows.length,
    approved: approvedRows.length,
    executed: executedRows.length,
    rejected: rejectedRows.length,
  }

  function renderApprovalCard(
    item: RuntimePendingApproval,
    opts: { compact?: boolean; muted?: boolean } = {}
  ) {
    const disabled = submittingIds[item.approval_id] === true
    const mode = agentModeByAgentId[item.agent_id] || 'training'
    const status = normalizeStatus(item.status)
    const isRejected = item.decision === 'rejected'
    const approvedStatus = status === 'approved' || status === 'auto-approved'
    const executableActions =
      mode === 'guarded' &&
      approvedStatus &&
      !item.executed &&
      areExecutableActions(item.proposed_actions)
    const confidenceText = formatConfidence(item.agent_id, item.proposed_actions, confidenceByAgentAction)
    const summarizedRequest = shortText(item.user_request, opts.compact ? 120 : 220)
    const primaryAction = Array.isArray(item.proposed_actions) ? item.proposed_actions[0] : undefined
    const actionSummary = describeAction(primaryAction)
    const primaryArgs =
      primaryAction && typeof primaryAction.args === 'object' && primaryAction.args !== null
        ? (primaryAction.args as Record<string, unknown>)
        : null
    const sampleSubjectsFromArgs = Array.isArray(primaryArgs?.sample_subject_lines)
      ? primaryArgs.sample_subject_lines
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => value.length > 0)
      : []
    const sampleSnippetsFromArgs = Array.isArray(primaryArgs?.snippet_previews)
      ? primaryArgs.snippet_previews
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => value.length > 0)
      : []
    const sampleMessagesFromArgs = Array.isArray(primaryArgs?.sample_messages)
      ? primaryArgs.sample_messages
          .map((value) => {
            const record =
              typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
            if (!record) return null
            return {
              subject: typeof record.subject === 'string' ? record.subject : null,
              from: typeof record.from === 'string' ? record.from : null,
              date: typeof record.date === 'string' ? record.date : null,
              snippet: typeof record.snippet === 'string' ? record.snippet : null,
            }
          })
          .filter(
            (value): value is { subject: string | null; from: string | null; date: string | null; snippet: string | null } =>
              Boolean(value)
          )
      : []
    const sampleSizeFromArgs =
      typeof primaryArgs?.sample_size === 'number'
        ? primaryArgs.sample_size
        : typeof primaryArgs?.fetched_count === 'number'
          ? primaryArgs.fetched_count
          : null
    const summary = buildApprovalDecisionSummary({
      action: primaryAction,
      userRequest: item.user_request,
      sampleMessages: sampleMessagesFromArgs,
      sampleSubjects: sampleSubjectsFromArgs,
      sampleSnippets: sampleSnippetsFromArgs,
      sampleSize: sampleSizeFromArgs,
    })
    const executeLabel = executeLabelForAction(primaryAction)

    const cardClass = opts.muted
      ? 'rounded-lg border border-gray-800/70 bg-gray-950/35 p-2 space-y-1'
      : opts.compact
      ? 'rounded-lg border border-gray-800 bg-gray-950/45 p-2 space-y-1'
      : 'rounded-lg border border-amber-900/60 bg-gray-950/70 p-3 space-y-2'

    return (
      <div key={item.approval_id} className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={`font-mono ${opts.compact ? 'text-[11px]' : 'text-xs'} text-gray-300`}
            title={item.approval_id}
          >
            {shortApprovalId(item.approval_id)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-300">
              {mode}
            </span>
            {isRejected ? (
              <span className="rounded-full border border-rose-900/70 bg-rose-950/40 px-2 py-0.5 text-[11px] text-rose-200">
                rejected
              </span>
            ) : (
              <span className={statusChip(status)}>{status}</span>
            )}
          </div>
        </div>

        {opts.compact ? (
          <p className="text-xs text-gray-300" title={item.user_request}>
            {summarizedRequest}
            <span className="text-gray-500"> · {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</span>
          </p>
        ) : (
          <p className="text-[11px] text-gray-500">
            {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
          </p>
        )}
        {!opts.compact ? (
          <p className="text-sm text-gray-200" title={item.user_request}>
            {summarizedRequest}
          </p>
        ) : null}

        <p className="text-[11px] text-cyan-200">
          Action: {actionSummary}
          {item.session_id ? ` · Session ${shortSessionId(item.session_id)}` : ''}
        </p>

        {summary ? (
          opts.compact ? (
            <ApprovalDecisionCard
              summary={summary}
              compact
              className="rounded border border-cyan-900/35 bg-cyan-950/10 p-2"
            />
          ) : (
            <ApprovalDecisionCard
              summary={summary}
              className="rounded border border-cyan-900/40 bg-gradient-to-b from-cyan-950/15 to-gray-950/35 p-2.5"
            />
          )
        ) : null}

        {!opts.compact ? (
          <details className="rounded border border-gray-800 bg-gray-900/40 p-2">
            <summary className="cursor-pointer list-none text-[11px] font-semibold text-gray-300">
              Confidence + action training state
            </summary>
            <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-gray-400 font-mono">
              {confidenceText}
            </pre>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {isRejected ? (
            <span className="text-[11px] text-gray-500">
              Rejected. This approval request is no longer actionable here.
            </span>
          ) : status === 'pending' ? (
            <>
              {item.auto_approve_eligible ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => submitAutoApprove(item.approval_id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                    disabled
                      ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  Auto-Approve
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => submitDecision(item.approval_id, 'approved')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                  disabled
                    ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  const confirmed = window.confirm(
                    'Reject this approval request?\n\nThis will mark it rejected and remove it from actionable queue items. You can still re-propose from Playground later.'
                  )
                  if (!confirmed) return
                  void submitDecision(item.approval_id, 'rejected')
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                  disabled
                    ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                Reject
              </button>
            </>
          ) : executableActions ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => submitExecute(item.approval_id)}
              className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                disabled
                  ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                  : 'bg-amber-700 hover:bg-amber-600 text-white'
              }`}
            >
              {executeLabel}
            </button>
          ) : (
            <span className="text-[11px] text-gray-500">No further action required.</span>
          )}
        </div>
        {!isRejected && status === 'pending' && !opts.compact ? (
          <div className="rounded border border-gray-800 bg-gray-900/35 p-2 text-[11px] text-gray-400 space-y-0.5">
            <p>
              Approve: marks this request approved. Execution can only happen in a later supervised step.
            </p>
            <p>
              Reject: marks this request rejected and removes it from actionable queue items. No inbox action runs.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-5">
        <div className="rounded border border-gray-800 bg-gray-950/60 p-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Total</p>
          <p className="text-base font-semibold">{liveQueueCounts.total}</p>
        </div>
        <div className="rounded border border-amber-900/60 bg-gray-950/60 p-2">
          <p className="text-[11px] uppercase tracking-wide text-amber-300">Pending</p>
          <p className="text-base font-semibold">{liveQueueCounts.pending}</p>
        </div>
        <div className="rounded border border-blue-900/60 bg-gray-950/60 p-2">
          <p className="text-[11px] uppercase tracking-wide text-blue-300">Approved</p>
          <p className="text-base font-semibold">{liveQueueCounts.approved}</p>
        </div>
        <div className="rounded border border-emerald-900/60 bg-gray-950/60 p-2">
          <p className="text-[11px] uppercase tracking-wide text-emerald-300">Executed</p>
          <p className="text-base font-semibold">{liveQueueCounts.executed}</p>
        </div>
        <div className="rounded border border-rose-900/60 bg-gray-950/60 p-2">
          <p className="text-[11px] uppercase tracking-wide text-rose-300">Rejected</p>
          <p className="text-base font-semibold">{liveQueueCounts.rejected}</p>
        </div>
      </div>

      {pendingRows.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            Actionable now ({pendingRows.length})
          </p>
          {pendingRows.map((item) => renderApprovalCard(item))}
        </section>
      ) : null}

      {approvedRows.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            Approved ({approvedRows.length})
          </p>
          {approvedRows.map((item) => renderApprovalCard(item, { compact: true }))}
        </section>
      ) : null}

      {rejectedRows.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">
            Rejected ({rejectedRows.length})
          </p>
          {rejectedRows.map((item) => renderApprovalCard(item, { compact: true, muted: true }))}
        </section>
      ) : null}

      {executedRows.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Executed history ({executedRows.length})
          </p>
          {executedRows.map((item) => renderApprovalCard(item, { compact: true, muted: true }))}
        </section>
      ) : null}
    </div>
  )
}
