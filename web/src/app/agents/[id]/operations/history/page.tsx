'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'

type HistoryTab = 'executed' | 'timeline'

type ExecutedItem = {
  id: string
  title: string
  reason: string
  action: string
  tool: string
  target: string
  clusterSource: string
  outcome: string
}

function parseTab(value: string | null): HistoryTab {
  if (value === 'executed') return 'executed'
  return 'timeline'
}

function tabClass(active: boolean): string {
  return active
    ? 'rounded-md border border-cyan-700/60 bg-cyan-950/25 px-3 py-1.5 text-xs font-medium text-cyan-100'
    : 'rounded-md border border-gray-800 bg-gray-900/35 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-cyan-200'
}

function actionOutcome(action: string): string {
  if (action === 'archive_messages') return 'INBOX label removed for selected emails.'
  if (action === 'review_query_cluster' || action === 'review_sender_cluster') {
    return 'Review evidence generated; inbox unchanged.'
  }
  if (action === 'analyze_inbox') return 'Analysis evidence generated; inbox unchanged.'
  return 'Executed under runtime supervision.'
}

export default function OperationsHistoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const runtime = useOperationsRuntime()
  const tab = parseTab(searchParams.get('tab'))
  const effectiveSessionId = runtime.sessionId || requestedSessionId
  const baseQuery = serializeOperationsQuery(effectiveSessionId, runtime.analysisScope)

  const reviewResults = useMemo(
    () =>
      [...(runtime.data?.runtime_review_results || [])].sort(
        (a, b) => Date.parse(b.executed_at || '') - Date.parse(a.executed_at || '')
      ),
    [runtime.data?.runtime_review_results]
  )

  const executedItems = useMemo<ExecutedItem[]>(() => {
    const output: ExecutedItem[] = []
    for (const set of runtime.data?.runtime_suggestion_sets || []) {
      for (const candidate of set.candidates || []) {
        if (candidate.status !== 'executed') continue
        const args =
          typeof candidate.proposed_action.args === 'object' && candidate.proposed_action.args
            ? (candidate.proposed_action.args as Record<string, unknown>)
            : {}
        const target =
          (typeof args.sender === 'string' && args.sender.trim()) ||
          (typeof args.batch_title === 'string' && args.batch_title.trim()) ||
          (typeof args.title === 'string' && args.title.trim()) ||
          (typeof args.query === 'string' && args.query.trim()) ||
          'Target not specified'
        const clusterSource =
          reviewResults.find((result) => result.title === target || result.source_label === target)
            ?.title || 'No explicit reviewed-result link'
        output.push({
          id: candidate.id,
          title: candidate.label,
          reason: candidate.reason,
          action: candidate.proposed_action.action,
          tool: candidate.proposed_action.tool,
          target,
          clusterSource,
          outcome: actionOutcome(candidate.proposed_action.action),
        })
      }
    }
    return output
  }, [reviewResults, runtime.data?.runtime_suggestion_sets])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-xl border border-gray-800 bg-gray-950/35 p-4 text-sm text-gray-300">
        Loading history…
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

  return (
    <section className="space-y-3">
      <header className="rounded-xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-cyan-300">History</p>
        <h1 className="text-xl font-semibold text-cyan-100">
          {tab === 'executed' ? 'Executed Actions' : 'Review Timeline'}
        </h1>
        <p className="text-sm text-gray-300">
          Audit what happened, what it targeted, and which reviewed context it came from.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/agents/${agentId}/operations/history?tab=executed${baseQuery ? `&${baseQuery.slice(1)}` : ''}`}
            className={tabClass(tab === 'executed')}
          >
            Executed actions
          </Link>
          <Link
            href={`/agents/${agentId}/operations/history${baseQuery}`}
            className={tabClass(tab === 'timeline')}
          >
            Review timeline
          </Link>
        </div>
      </header>

      {tab === 'executed' ? (
        <section className="rounded-xl border border-gray-800 bg-gray-950/35 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Executed actions audit</p>
          {executedItems.length > 0 ? (
            <div className="space-y-1.5">
              {executedItems.map((item) => (
                <article key={item.id} className="rounded border border-emerald-900/45 bg-emerald-950/15 p-2">
                  <p className="text-sm font-semibold text-emerald-100">{item.title}</p>
                  <div className="mt-1 grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
                    <p>
                      <span className="text-gray-500">Action:</span> {item.tool}.{item.action}
                    </p>
                    <p>
                      <span className="text-gray-500">Target:</span> {item.target}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Origin:</span> {item.clusterSource}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Outcome:</span> {item.outcome}
                    </p>
                    <p className="sm:col-span-2 text-gray-500">{item.reason}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No executed actions in this scope yet.</p>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-gray-800 bg-gray-950/35 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Reviewed result timeline</p>
          {reviewResults.length > 0 ? (
            <div className="space-y-1.5">
              {reviewResults.map((result) => (
                <article key={result.id} className="rounded border border-gray-800 bg-gray-950/45 p-2">
                  <p className="text-sm text-gray-100">{result.title}</p>
                  <p className="text-[11px] text-gray-400">{result.objective}</p>
                  <div className="mt-1 grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
                    <p>
                      <span className="text-gray-500">Type:</span> {result.kind}
                    </p>
                    <p>
                      <span className="text-gray-500">Scope:</span>{' '}
                      {result.estimated_count != null
                        ? `~${result.estimated_count} estimated · ${result.fetched_count} sampled`
                        : `${result.fetched_count} sampled`}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">Executed:</span>{' '}
                      {new Date(result.executed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-1">
                    <Link
                      href={`/agents/${agentId}/operations/review?result_id=${encodeURIComponent(result.id)}${baseQuery ? `&${baseQuery.slice(1)}` : ''}`}
                      className="text-[11px] text-cyan-300 hover:text-cyan-200"
                    >
                      Open review detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No reviewed results in this scope yet.</p>
          )}
        </section>
      )}
    </section>
  )
}
