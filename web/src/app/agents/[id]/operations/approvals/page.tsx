'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'
import { useDecisionWorkspaceActions } from '@/components/runtime/DecisionWorkspaceActionContext'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import type {
  DecisionWorkspaceActionTone,
  DecisionWorkspaceApprovalStatus,
} from '@/lib/runtime/decisionWorkspaceActionModel'

type QueueStatus = DecisionWorkspaceApprovalStatus

function statusChipClass(status: QueueStatus): string {
  if (status === 'approved') return 'border-blue-900/70 bg-blue-950/35 text-blue-200'
  if (status === 'executed') return 'border-emerald-900/70 bg-emerald-950/35 text-emerald-200'
  if (status === 'rejected') return 'border-rose-900/70 bg-rose-950/35 text-rose-200'
  return 'border-amber-900/70 bg-amber-950/35 text-amber-200'
}

function controlClass(tone: DecisionWorkspaceActionTone, submitting: boolean): string {
  if (submitting) return 'bg-gray-700 text-gray-400 cursor-not-allowed'
  if (tone === 'positive') return 'bg-emerald-700 hover:bg-emerald-600 text-white'
  if (tone === 'caution') return 'bg-rose-700 hover:bg-rose-600 text-white'
  if (tone === 'primary') return 'bg-blue-700 hover:bg-blue-600 text-white'
  return 'bg-gray-700 hover:bg-gray-600 text-white'
}

export default function OperationsApprovalsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const runtime = useOperationsRuntime()
  const actionAdapter = useDecisionWorkspaceActions()
  const effectiveSessionId = runtime.sessionId || requestedSessionId
  const sessionQuery = serializeOperationsQuery(effectiveSessionId, runtime.analysisScope)
  const [submittingById, setSubmittingById] = useState<Record<string, boolean>>({})
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, QueueStatus>>({})
  const [actionNote, setActionNote] = useState<string | null>(null)

  const queueSummary = runtime.data?.runtime_approval_queue_summary
  const approvalQueue = useMemo(
    () => actionAdapter.approvals.getQueue({ data: runtime.data, localOverrides: localStatusOverrides }),
    [actionAdapter, localStatusOverrides, runtime.data]
  )
  const queueItems = approvalQueue.requests

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

  const renderItem = (item: (typeof queueItems)[number]) => {
    const submitting = Boolean(submittingById[item.approvalId])
    return (
      <article
        key={item.key}
        className="rounded-lg border border-gray-800 bg-gray-950/45 p-3 space-y-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-100">{item.title}</p>
            <p className="text-[11px] text-gray-400">{item.reason}</p>
            <p className="mt-1 text-[11px] font-medium text-cyan-200">{item.bundleLabel}</p>
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

        {!item.validation.valid ? (
          <div className="rounded border border-rose-900/60 bg-rose-950/25 p-2 text-[11px] text-rose-200">
            This request is visible for diagnosis but cannot be approved or executed because its
            action metadata did not validate.
          </div>
        ) : null}

        <div className="space-y-2">
          {item.actions.map((action) => (
            <section
              key={action.id}
              className="rounded border border-gray-800/90 bg-gray-900/35 p-2.5 space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-100">
                  {item.actions.length > 1 ? `Action ${action.order + 1} of ${item.actions.length}: ` : ''}
                  {action.label}
                </p>
                <span className="font-mono text-[10px] text-gray-500">
                  {action.toolId}.{action.actionId}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">{action.description}</p>
              <div className="grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
                <p>
                  <span className="text-gray-500">Source:</span>{' '}
                  {action.sourceId || 'Unavailable'}
                </p>
                <p>
                  <span className="text-gray-500">Responsible role:</span> {action.agentRoleId}
                </p>
                <p>
                  <span className="text-gray-500">Workflow stage:</span> {action.workflowStageId}
                </p>
                <p>
                  <span className="text-gray-500">Effect / risk:</span>{' '}
                  {action.declaredEffect.replaceAll('_', ' ')} · {action.risk}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-gray-500">Applies to:</span> {action.objectScope}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-gray-500">If approved:</span> {action.approvalEffect}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-gray-500">If approved/executed:</span>{' '}
                  {action.executionEffect}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-gray-500">Execution scope:</span> {action.scopeLabel}
                </p>
                {(action.metrics.reviewedCount != null ||
                  action.metrics.candidateCount != null ||
                  action.metrics.exactSelectedCount != null ||
                  action.metrics.excludedCount != null ||
                  action.metrics.affectedSubjectsCount != null) ? (
                  <p className="sm:col-span-2">
                    <span className="text-gray-500">Scope summary:</span>{' '}
                    {[
                      action.metrics.reviewedCount != null
                        ? `reviewed ${action.metrics.reviewedCount}`
                        : null,
                      action.metrics.candidateCount != null
                        ? `candidate ${action.metrics.candidateCount}`
                        : null,
                      action.metrics.exactSelectedCount != null
                        ? `selected ${action.metrics.exactSelectedCount}`
                        : null,
                      action.metrics.excludedCount != null
                        ? `excluded ${action.metrics.excludedCount}`
                        : null,
                      action.metrics.affectedSubjectsCount != null
                        ? `${action.affectedSubjectsLabel} ${action.metrics.affectedSubjectsCount}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                ) : null}
                {action.evidenceBasis ? (
                  <p className="sm:col-span-2">
                    <span className="text-gray-500">Evidence basis:</span> {action.evidenceBasis}
                  </p>
                ) : null}
                {action.safeSignals.length > 0 ? (
                  <p className="sm:col-span-2">
                    <span className="text-gray-500">Safety signals:</span>{' '}
                    {action.safeSignals.join(' · ')}
                  </p>
                ) : null}
                {action.safetyExclusions.length > 0 ? (
                  <p className="sm:col-span-2">
                    <span className="text-gray-500">Protected exclusions:</span>{' '}
                    {action.safetyExclusions.join(' · ')}
                  </p>
                ) : null}
                <p className="sm:col-span-2 text-gray-500">
                  Capability: {action.capability} · Reversibility:{' '}
                  {action.reversibility.replaceAll('_', ' ')}
                </p>
              </div>
            </section>
          ))}
        </div>

        <p className="text-[11px] text-gray-300">
          <span className="text-gray-500">If rejected:</span> {item.rejectionEffect}
        </p>

        <div className="flex flex-wrap gap-2">
          {item.controls.map((control) => (
            <button
              key={control.operation}
              type="button"
              onClick={() => {
                if (control.compatibilityValue === 'approved') {
                  void submitDecision(item.approvalId, 'approved')
                } else if (control.compatibilityValue === 'rejected') {
                  void submitDecision(item.approvalId, 'rejected')
                } else if (control.compatibilityValue === 'execute') {
                  void executeApproved(item.approvalId)
                }
              }}
              disabled={submitting || control.availability.state !== 'available'}
              className={`rounded px-3 py-1.5 text-xs font-medium ${controlClass(control.tone, submitting)}`}
            >
              {submitting ? control.pendingLabel : control.label}
            </button>
          ))}
        </div>
      </article>
    )
  }

  return (
    <section className="space-y-3">
      <header className="rounded-xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-cyan-300">
          {approvalQueue.presentation.eyebrow}
        </p>
        <h1 className="text-xl font-semibold text-cyan-100">{approvalQueue.presentation.title}</h1>
        <p className="text-sm text-gray-300">{approvalQueue.presentation.description}</p>
        <div className="rounded border border-gray-800 bg-gray-900/40 p-2 text-[11px] text-gray-300">
          {approvalQueue.presentation.steps.map((step) => (
            <p key={step}>{step}</p>
          ))}
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
        {!approvalQueue.validation.valid && queueItems.some((item) => !item.validation.valid) ? (
          <p className="text-[11px] text-rose-300">
            One or more requests are visible but safely disabled because their complete action bundle
            could not be validated.
          </p>
        ) : null}
        {actionNote ? <p className="text-[11px] text-cyan-200">{actionNote}</p> : null}
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
