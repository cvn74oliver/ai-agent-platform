'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'

type QueueStatus = 'pending_approval' | 'approved' | 'executed' | 'rejected'
type QueueActionKind = 'review' | 'archive' | 'analyze' | 'other'

type ApprovalQueueItem = {
  key: string
  approvalId: string
  status: QueueStatus
  title: string
  reason: string
  actionLabel: string
  actionKind: QueueActionKind
  source: string
  objectScope: string
  approvalEffect: string
  effect: string
  rejectionEffect: string
  exactSelectedCount: number | null
  reviewedCount: number | null
  candidateCount: number | null
  excludedCount: number | null
  affectedSendersCount: number | null
  messageScopeLabel: string
  evidenceBasis: string | null
  safeSignals: string[]
  safetyExclusions: string[]
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim())
}

function actionKindFromAction(action: string): QueueActionKind {
  if (action === 'review_query_cluster' || action === 'review_sender_cluster') return 'review'
  if (action === 'archive_messages') return 'archive'
  if (action === 'analyze_inbox') return 'analyze'
  return 'other'
}

function actionEffectText(action: string): string {
  if (action === 'review_query_cluster' || action === 'review_sender_cluster') {
    return 'On execute: run read-only preview and attach review evidence. No inbox mutation.'
  }
  if (action === 'archive_messages') {
    return 'On execute: remove INBOX label from selected emails only. No delete/unsubscribe.'
  }
  if (action === 'analyze_inbox') {
    return 'On execute: run bounded metadata analysis only. No inbox mutation.'
  }
  return 'On execute: apply this approved action using runtime supervision.'
}

function actionLabel(action: string): string {
  if (action === 'review_query_cluster') return 'Review this query cluster'
  if (action === 'review_sender_cluster') return 'Review this sender cluster'
  if (action === 'archive_messages') return 'Archive selected emails'
  if (action === 'analyze_inbox') return 'Analyze inbox metadata'
  return action
}

function statusChipClass(status: QueueStatus): string {
  if (status === 'approved') return 'border-blue-900/70 bg-blue-950/35 text-blue-200'
  if (status === 'executed') return 'border-emerald-900/70 bg-emerald-950/35 text-emerald-200'
  if (status === 'rejected') return 'border-rose-900/70 bg-rose-950/35 text-rose-200'
  return 'border-amber-900/70 bg-amber-950/35 text-amber-200'
}

function deriveQueueItems(params: {
  data: ReturnType<typeof useOperationsRuntime>['data']
  localOverrides: Record<string, QueueStatus>
}): ApprovalQueueItem[] {
  const items: ApprovalQueueItem[] = []
  const seen = new Set<string>()
  const addItem = (item: ApprovalQueueItem) => {
    if (seen.has(item.key)) return
    seen.add(item.key)
    const override = params.localOverrides[item.approvalId]
    items.push({
      ...item,
      status: override || item.status,
    })
  }

  for (const queueItem of params.data?.runtime_approval_queue_items || []) {
    const approvalId =
      typeof queueItem.approval_id === 'string' ? queueItem.approval_id.trim() : ''
    if (!approvalId) continue

    const normalizedStatus: QueueStatus =
      queueItem.status === 'approved' ||
      queueItem.status === 'executed' ||
      queueItem.status === 'rejected' ||
      queueItem.status === 'pending_approval'
        ? queueItem.status
        : 'pending_approval'

    const firstAction = Array.isArray(queueItem.proposed_actions)
      ? queueItem.proposed_actions[0]
      : null
    const action =
      firstAction && typeof firstAction.action === 'string' ? firstAction.action : 'other'
    const tool = firstAction && typeof firstAction.tool === 'string' ? firstAction.tool : 'runtime'
    const args =
      firstAction && typeof firstAction.args === 'object' && firstAction.args
        ? (firstAction.args as Record<string, unknown>)
        : {}

    const objectScope =
      (typeof args.source_label === 'string' && args.source_label.trim()) ||
      (typeof args.batch_title === 'string' && args.batch_title.trim()) ||
      (typeof args.sender === 'string' && args.sender.trim()) ||
      (typeof args.title === 'string' && args.title.trim()) ||
      (typeof args.query === 'string' && args.query.trim()) ||
      (typeof queueItem.user_request === 'string' && queueItem.user_request.trim()) ||
      'Scope not specified'

    const selectionCustomization =
      typeof args.selection_customization === 'object' && args.selection_customization
        ? (args.selection_customization as Record<string, unknown>)
        : null
    const selectionScope =
      selectionCustomization != null && typeof selectionCustomization.analysis_scope === 'string'
        ? selectionCustomization.analysis_scope.trim()
        : ''
    const matchingMessagesInScope =
      selectionCustomization != null ? toFiniteNumber(selectionCustomization.matching_messages_in_scope) : null
    const exactSelectedCountFromIds = Array.isArray(args.message_ids)
      ? args.message_ids.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).length
      : null
    const exactSelectedCountFromCustomization =
      selectionCustomization != null
        ? toFiniteNumber(selectionCustomization.selected_count)
        : null
    const exactSelectedCount = exactSelectedCountFromCustomization ?? exactSelectedCountFromIds
    const reviewedCount =
      selectionCustomization != null ? toFiniteNumber(selectionCustomization.reviewed_count) : null
    const candidateCount =
      selectionCustomization != null ? toFiniteNumber(selectionCustomization.candidate_count) : null
    const excludedCount =
      selectionCustomization != null ? toFiniteNumber(selectionCustomization.excluded_count) : null
    const affectedSendersCount =
      selectionCustomization != null
        ? (() => {
            const excluded = parseStringList(selectionCustomization.excluded_senders)
            if (excluded.length > 0) return excluded.length
            if (typeof args.sender === 'string' && args.sender.trim()) return 1
            return null
          })()
        : null
    const safeSignals = parseStringList(args.safe_signals)
    const safetyExclusions = parseStringList(args.safety_exclusions)
    const evidenceBasis =
      typeof args.selection_basis === 'string' && args.selection_basis.trim()
        ? args.selection_basis.trim()
        : null
    const messageScopeLabel =
      action === 'archive_messages'
        ? exactSelectedCount != null
          ? `Exact message-id scope (${exactSelectedCount} selected ids${
              selectionScope ? ` · window ${selectionScope}` : ''
            }${matchingMessagesInScope != null ? ` · matching in scope ${matchingMessagesInScope}` : ''})`
          : 'Cluster-derived scope (exact ids unavailable)'
        : 'Read-only review/analysis scope'

    addItem({
      key: `queue:${approvalId}`,
      approvalId,
      status: normalizedStatus,
      title:
        (typeof args.title === 'string' && args.title.trim()) ||
        actionLabel(action) ||
        'Approval request',
      reason:
        (typeof queueItem.user_request === 'string' && queueItem.user_request.trim()) ||
        (typeof args.selection_basis === 'string' && args.selection_basis.trim()) ||
        'Runtime approval request',
      actionLabel: actionLabel(action),
      actionKind: actionKindFromAction(action),
      source: `${tool}.${action}`,
      objectScope,
      approvalEffect:
        action === 'archive_messages'
          ? 'If approved: request becomes executable archive action.'
          : 'If approved: request becomes executable in operations workflow.',
      effect: actionEffectText(action),
      rejectionEffect:
        'Rejecting marks this request non-actionable. You can create a new request later from Review Detail.',
      exactSelectedCount,
      reviewedCount,
      candidateCount,
      excludedCount,
      affectedSendersCount,
      messageScopeLabel,
      evidenceBasis,
      safeSignals,
      safetyExclusions,
    })
  }

  for (const set of params.data?.runtime_suggestion_sets || []) {
    for (const candidate of set.candidates || []) {
      if (!candidate.approval_id || !candidate.approval_id.trim()) continue
      if (
        candidate.status !== 'pending_approval' &&
        candidate.status !== 'approved' &&
        candidate.status !== 'executed'
      ) {
        continue
      }
      const action = candidate.proposed_action.action
      const args =
        typeof candidate.proposed_action.args === 'object' && candidate.proposed_action.args
          ? (candidate.proposed_action.args as Record<string, unknown>)
          : {}
      const objectScope =
        (typeof args.source_label === 'string' && args.source_label.trim()) ||
        (typeof args.batch_title === 'string' && args.batch_title.trim()) ||
        (typeof args.sender === 'string' && args.sender.trim()) ||
        (typeof args.title === 'string' && args.title.trim()) ||
        (typeof args.query === 'string' && args.query.trim()) ||
        'Scope not specified'
      const selectionCustomization =
        typeof args.selection_customization === 'object' && args.selection_customization
          ? (args.selection_customization as Record<string, unknown>)
          : null
      const selectionScope =
        selectionCustomization != null && typeof selectionCustomization.analysis_scope === 'string'
          ? selectionCustomization.analysis_scope.trim()
          : ''
      const matchingMessagesInScope =
        selectionCustomization != null
          ? toFiniteNumber(selectionCustomization.matching_messages_in_scope)
          : null
      const exactSelectedCountFromIds = Array.isArray(args.message_ids)
        ? args.message_ids.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).length
        : null
      const exactSelectedCountFromCustomization =
        selectionCustomization != null
          ? toFiniteNumber(selectionCustomization.selected_count)
          : null
      const exactSelectedCount = exactSelectedCountFromCustomization ?? exactSelectedCountFromIds
      const reviewedCount =
        selectionCustomization != null ? toFiniteNumber(selectionCustomization.reviewed_count) : null
      const candidateCount =
        selectionCustomization != null ? toFiniteNumber(selectionCustomization.candidate_count) : null
      const excludedCount =
        selectionCustomization != null ? toFiniteNumber(selectionCustomization.excluded_count) : null
      const affectedSendersCount =
        selectionCustomization != null
          ? (() => {
              const excluded = parseStringList(selectionCustomization.excluded_senders)
              if (excluded.length > 0) return excluded.length
              if (typeof args.sender === 'string' && args.sender.trim()) return 1
              return null
            })()
          : null
      const safeSignals = parseStringList(args.safe_signals)
      const safetyExclusions = parseStringList(args.safety_exclusions)
      const evidenceBasis =
        typeof args.selection_basis === 'string' && args.selection_basis.trim()
          ? args.selection_basis.trim()
          : null
      const messageScopeLabel =
        action === 'archive_messages'
          ? exactSelectedCount != null
            ? `Exact message-id scope (${exactSelectedCount} selected ids${
                selectionScope ? ` · window ${selectionScope}` : ''
              }${matchingMessagesInScope != null ? ` · matching in scope ${matchingMessagesInScope}` : ''})`
            : 'Cluster-derived scope (exact ids unavailable)'
          : 'Read-only review/analysis scope'
      addItem({
        key: `approval:${candidate.approval_id}`,
        approvalId: candidate.approval_id,
        status: candidate.status,
        title: candidate.label,
        reason: candidate.reason,
        actionLabel: actionLabel(action),
        actionKind: actionKindFromAction(action),
        source: `${candidate.proposed_action.tool}.${action}`,
        objectScope,
        approvalEffect:
          action === 'archive_messages'
            ? 'If approved: request becomes executable archive action.'
            : 'If approved: request becomes executable in operations workflow.',
        effect: actionEffectText(action),
        rejectionEffect:
          'Rejecting marks this request non-actionable. You can create a new request later from Review Detail.',
        exactSelectedCount,
        reviewedCount,
        candidateCount,
        excludedCount,
        affectedSendersCount,
        messageScopeLabel,
        evidenceBasis,
        safeSignals,
        safetyExclusions,
      })
    }
  }

  for (const cluster of params.data?.runtime_cleanup_plan?.clusters || []) {
    if (!cluster.approval_id || !cluster.approval_id.trim()) continue
    if (
      cluster.status !== 'pending_approval' &&
      cluster.status !== 'approved' &&
      cluster.status !== 'executed'
    ) {
      continue
    }
    addItem({
      key: `cluster:${cluster.cluster_id}:${cluster.approval_id}`,
      approvalId: cluster.approval_id,
      status: cluster.status,
      title: cluster.title,
      reason: cluster.why_selected,
      actionLabel: 'Review this query cluster',
      actionKind: 'review',
      source: 'gmail.review_query_cluster',
      objectScope: cluster.title,
      approvalEffect: 'If approved: request becomes executable review action.',
      effect: actionEffectText('review_query_cluster'),
      rejectionEffect:
        'Rejecting marks this query-review request non-actionable. You can request another review from the cluster page.',
      exactSelectedCount: null,
      reviewedCount: null,
      candidateCount: cluster.estimated_count,
      excludedCount: null,
      affectedSendersCount: null,
      messageScopeLabel: 'Read-only review scope',
      evidenceBasis: cluster.why_selected,
      safeSignals: [],
      safetyExclusions: ['No inbox mutation while pending/approved'],
    })
  }

  return items.sort((a, b) => a.title.localeCompare(b.title))
}

export default function OperationsApprovalsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const runtime = useOperationsRuntime()
  const effectiveSessionId = runtime.sessionId || requestedSessionId
  const sessionQuery = serializeOperationsQuery(effectiveSessionId, runtime.analysisScope)
  const [submittingById, setSubmittingById] = useState<Record<string, boolean>>({})
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, QueueStatus>>({})
  const [actionNote, setActionNote] = useState<string | null>(null)

  const queueSummary = runtime.data?.runtime_approval_queue_summary
  const queueItems = useMemo(
    () => deriveQueueItems({ data: runtime.data, localOverrides: localStatusOverrides }),
    [localStatusOverrides, runtime.data]
  )

  const pendingItems = queueItems.filter((item) => item.status === 'pending_approval')
  const approvedItems = queueItems.filter((item) => item.status === 'approved')
  const executedItems = queueItems.filter((item) => item.status === 'executed')
  const rejectedItems = queueItems.filter((item) => item.status === 'rejected')

  const setSubmitting = (approvalId: string, value: boolean) => {
    setSubmittingById((prev) => {
      if (!value) {
        const next = { ...prev }
        delete next[approvalId]
        return next
      }
      return { ...prev, [approvalId]: true }
    })
  }

  const submitDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    if (!agentId || !approvalId) return
    if (submittingById[approvalId]) return
    setSubmitting(approvalId, true)
    setActionNote(null)
    try {
      const res = await fetch('/api/runtime/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          approval_id: approvalId,
          decision,
        }),
      })
      const payload = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !payload.ok) {
        setActionNote(payload.error || 'Approval decision failed.')
        return
      }
      setLocalStatusOverrides((prev) => ({
        ...prev,
        [approvalId]: decision === 'approved' ? 'approved' : 'rejected',
      }))
      setActionNote(decision === 'approved' ? 'Approval granted.' : 'Approval rejected.')
      await runtime.refreshRuntimeSnapshot({ force: true, silent: true })
    } catch {
      setActionNote('Approval decision failed.')
    } finally {
      setSubmitting(approvalId, false)
    }
  }

  const executeApproved = async (approvalId: string) => {
    if (!agentId || !approvalId) return
    if (submittingById[approvalId]) return
    setSubmitting(approvalId, true)
    setActionNote(null)
    try {
      const res = await fetch('/api/runtime/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          approval_id: approvalId,
        }),
      })
      const payload = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !payload.ok) {
        setActionNote(payload.error || 'Execute failed.')
        return
      }
      setLocalStatusOverrides((prev) => ({ ...prev, [approvalId]: 'executed' }))
      setActionNote('Approved action executed.')
      await runtime.refreshRuntimeSnapshot({ force: true, silent: true })
    } catch {
      setActionNote('Execute failed.')
    } finally {
      setSubmitting(approvalId, false)
    }
  }

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-xl border border-gray-800 bg-gray-950/35 p-4 text-sm text-gray-300">
        Loading approvals in this workspace scope…
      </section>
    )
  }

  if (runtime.error && !runtime.data) {
    return (
      <section className="rounded-xl border border-red-900/45 bg-red-950/20 p-4 text-sm text-red-200">
        {runtime.error}
      </section>
    )
  }

  const renderItem = (item: ApprovalQueueItem) => {
    const submitting = Boolean(submittingById[item.approvalId])
    const canApproveReject = item.status === 'pending_approval'
    const canExecute = item.status === 'approved'
    return (
      <article
        key={item.key}
        className="rounded-lg border border-gray-800 bg-gray-950/45 p-3 space-y-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-100">{item.title}</p>
            <p className="text-[11px] text-gray-400">{item.reason}</p>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusChipClass(item.status)}`}>
            {item.status === 'pending_approval'
              ? 'pending approval'
              : item.status === 'approved'
                ? 'approved'
                : item.status === 'executed'
                  ? 'executed'
                  : 'rejected'}
          </span>
        </div>

        <div className="grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
          <p>
            <span className="text-gray-500">Request:</span> {item.actionLabel}
          </p>
          <p>
            <span className="text-gray-500">Approval id:</span>{' '}
            <span className="font-mono text-gray-200">{item.approvalId}</span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-gray-500">Applies to:</span> {item.objectScope}
          </p>
          <p className="sm:col-span-2">
            <span className="text-gray-500">If approved:</span> {item.approvalEffect}
          </p>
          <p className="sm:col-span-2">
            <span className="text-gray-500">If approved/executed:</span> {item.effect}
          </p>
          <p className="sm:col-span-2">
            <span className="text-gray-500">Execution scope:</span> {item.messageScopeLabel}
          </p>
          {(item.reviewedCount != null ||
            item.candidateCount != null ||
            item.exactSelectedCount != null ||
            item.excludedCount != null ||
            item.affectedSendersCount != null) ? (
            <p className="sm:col-span-2">
              <span className="text-gray-500">Scope summary:</span>{' '}
              {[
                item.reviewedCount != null ? `reviewed ${item.reviewedCount}` : null,
                item.candidateCount != null ? `candidate ${item.candidateCount}` : null,
                item.exactSelectedCount != null ? `selected ${item.exactSelectedCount}` : null,
                item.excludedCount != null ? `excluded ${item.excludedCount}` : null,
                item.affectedSendersCount != null ? `affected senders ${item.affectedSendersCount}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {item.evidenceBasis ? (
            <p className="sm:col-span-2">
              <span className="text-gray-500">Evidence basis:</span> {item.evidenceBasis}
            </p>
          ) : null}
          {item.safeSignals.length > 0 ? (
            <p className="sm:col-span-2">
              <span className="text-gray-500">Safety signals:</span> {item.safeSignals.join(' · ')}
            </p>
          ) : null}
          {item.safetyExclusions.length > 0 ? (
            <p className="sm:col-span-2">
              <span className="text-gray-500">Protected exclusions:</span>{' '}
              {item.safetyExclusions.join(' · ')}
            </p>
          ) : null}
          <p className="sm:col-span-2">
            <span className="text-gray-500">If rejected:</span> {item.rejectionEffect}
          </p>
          <p className="sm:col-span-2 text-gray-500">Source: {item.source}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApproveReject ? (
            <>
              <button
                type="button"
                onClick={() => void submitDecision(item.approvalId, 'approved')}
                disabled={submitting}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  submitting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Approve request
              </button>
              <button
                type="button"
                onClick={() => void submitDecision(item.approvalId, 'rejected')}
                disabled={submitting}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  submitting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                Reject request
              </button>
            </>
          ) : null}
          {canExecute ? (
            <button
              type="button"
              onClick={() => void executeApproved(item.approvalId)}
              disabled={submitting}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                submitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              Execute approved action
            </button>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <section className="space-y-3">
      <header className="rounded-xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-cyan-300">Pending Approvals</p>
        <h1 className="text-xl font-semibold text-cyan-100">Approval Queue (actual approval step)</h1>
        <p className="text-sm text-gray-300">
          This is where real approve/reject decisions happen. Creating a request in Sender Decisions
          or Confirmation only sends it here; no inbox mutation happens until approve + execute.
        </p>
        <div className="rounded border border-gray-800 bg-gray-900/40 p-2 text-[11px] text-gray-300">
          <p>1) Sender Decisions / Confirmation: create request</p>
          <p>2) Pending Approvals (this page): approve or reject</p>
          <p>3) Execute approved action: apply inbox change</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded border border-amber-900/55 bg-amber-950/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-amber-300">Pending</p>
            <p className="text-lg font-semibold text-amber-100">{pendingItems.length}</p>
          </div>
          <div className="rounded border border-blue-900/55 bg-blue-950/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-blue-300">Approved</p>
            <p className="text-lg font-semibold text-blue-100">{approvedItems.length}</p>
          </div>
          <div className="rounded border border-emerald-900/55 bg-emerald-950/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-emerald-300">Executed</p>
            <p className="text-lg font-semibold text-emerald-100">{executedItems.length}</p>
          </div>
          <div className="rounded border border-rose-900/55 bg-rose-950/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-rose-300">Rejected</p>
            <p className="text-lg font-semibold text-rose-100">{rejectedItems.length}</p>
          </div>
        </div>
        {queueSummary &&
        (queueSummary.pending !== pendingItems.length ||
          queueSummary.approved !== approvedItems.length ||
          queueSummary.executed !== executedItems.length ||
          queueSummary.rejected !== rejectedItems.length) ? (
          <p className="text-[11px] text-amber-300">
            Queue scope is reconciling with latest runtime snapshot. Refresh if this note persists.
          </p>
        ) : null}
        {actionNote ? (
          <p className="text-[11px] text-cyan-200">{actionNote}</p>
        ) : null}
      </header>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-amber-300 font-semibold">
          Actionable now ({pendingItems.length})
        </p>
        {pendingItems.length > 0 ? (
          pendingItems.map(renderItem)
        ) : (
          <div className="rounded border border-gray-800 bg-gray-950/30 p-3 text-xs text-gray-500">
            No pending approvals in this scope.
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-300 font-semibold">
          Approved ({approvedItems.length})
        </p>
        {approvedItems.length > 0 ? (
          approvedItems.map(renderItem)
        ) : (
          <div className="rounded border border-gray-800 bg-gray-950/30 p-3 text-xs text-gray-500">
            No approved requests waiting for execution.
          </div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-rose-300 font-semibold">
            Rejected ({rejectedItems.length})
          </p>
          {rejectedItems.length > 0 ? (
            rejectedItems.map(renderItem)
          ) : (
            <div className="rounded border border-gray-800 bg-gray-950/30 p-3 text-xs text-gray-500">
              Rejected count is tracked in queue summary; detailed rejected cards appear when scoped
              runtime items are available.
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">
            Executed ({executedItems.length})
          </p>
          {executedItems.length > 0 ? (
            executedItems.map(renderItem)
          ) : (
            <div className="rounded border border-gray-800 bg-gray-950/30 p-3 text-xs text-gray-500">
              No executed items in scoped runtime payload.
            </div>
          )}
        </div>
      </section>

      <div className="rounded border border-gray-800 bg-gray-950/30 p-2.5 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <p>Need legacy global queue/admin view?</p>
        <Link
          href={`/approvals?${new URLSearchParams({
            return_to: `/agents/${agentId}/operations/approvals${sessionQuery}`,
            agent_id: agentId,
            scope: effectiveSessionId ? 'session' : 'agent',
            ...(effectiveSessionId ? { session_id: effectiveSessionId } : {}),
          }).toString()}`}
          className="text-cyan-300 hover:text-cyan-200"
        >
          Open legacy approvals console
        </Link>
      </div>
    </section>
  )
}
