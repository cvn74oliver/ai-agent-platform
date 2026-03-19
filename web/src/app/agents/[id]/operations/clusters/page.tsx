'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { GmailScopeLadder } from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  fetchGmailMailboxIntelligence,
  readCachedGmailMailboxIntelligence,
  type GmailCleanupClusterRef,
  type GmailMailboxIntelligenceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'

type LoadState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'ready'; data: GmailMailboxIntelligenceData; error: null }
  | { status: 'error'; data: null; error: string }

export default function OperationsClustersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const focusCluster = searchParams.get('focus_cluster')
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)
  const cacheVersion = runtime.data?.runtime_cleanup_plan?.generated_at || null
  const clusters = useMemo<GmailCleanupClusterRef[]>(
    () =>
      (runtime.data?.runtime_cleanup_plan?.clusters || []).map((cluster) => ({
        clusterId: cluster.cluster_id,
        clusterType: cluster.cluster_type,
        title: cluster.title,
        query: cluster.query,
        whySelected: cluster.why_selected,
        riskNote: cluster.risk_note,
        safetyNote: cluster.safety_note,
      })),
    [runtime.data?.runtime_cleanup_plan?.clusters]
  )
  const cachedIntelligence = useMemo(
    () =>
      clusters.length > 0
        ? readCachedGmailMailboxIntelligence({
            clusters,
            analysisScope: runtime.analysisScope,
            cacheVersion,
          })
        : null,
    [cacheVersion, clusters, runtime.analysisScope]
  )
  const [state, setState] = useState<LoadState>(() =>
    cachedIntelligence ? { status: 'ready', data: cachedIntelligence, error: null } : { status: 'idle', data: null, error: null }
  )

  useEffect(() => {
    let cancelled = false
    if (clusters.length === 0 || cachedIntelligence) return

    void fetchGmailMailboxIntelligence({
      clusters,
      analysisScope: runtime.analysisScope,
      cacheVersion,
      requestContext: {
        source: 'operations_clusters_page',
        component: 'cleanup_groups',
        reason: 'cleanup_group_selection',
        phase: 'initial_paint',
      },
    }).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setState({ status: 'error', data: null, error: result.error })
        return
      }
      setState({ status: 'ready', data: result.data, error: null })
    })
    return () => {
      cancelled = true
    }
  }, [cacheVersion, cachedIntelligence, clusters, runtime.analysisScope])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading Cleanup Groups…
      </section>
    )
  }

  if (runtime.error && !runtime.data) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {runtime.error}
      </section>
    )
  }

  if (clusters.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        No cleanup groups are available yet. Refresh cleanup analysis from Mailbox Intelligence first.
      </section>
    )
  }

  const resolvedState = cachedIntelligence
    ? { status: 'ready' as const, data: cachedIntelligence, error: null }
    : state

  if (resolvedState.status === 'error') {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {resolvedState.error}
      </section>
    )
  }

  if (resolvedState.status !== 'ready') {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading sender group summaries…
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <GmailScopeLadder
        title="Cleanup Groups"
        subtitle="Cleanup Groups narrows the high-level dashboard into one sender cluster at a time: whole mailbox -> cleanup candidates -> cleanup group -> sender set."
        counts={resolvedState.data.scope_ladder}
        hiddenKeys={['loaded_preview_rows']}
      />

      <section className="app-page-header app-page-header-hero rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Cleanup Groups</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Choose the sender group to review next</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
          Cleanup Groups is the full selection surface for sender clusters. Pick the group that best matches the kind of senders you want to decide on next, then continue into Sender Decisions for the deeper drill-down.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {resolvedState.data.cleanup_groups.map((group) => {
            const highlighted = focusCluster === group.cluster_id
            const clusterQuery = `${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(group.cluster_id)}&stage=senders`
            return (
              <article
                key={group.cluster_id}
                className={`rounded-2xl border p-4 ${
                  highlighted
                    ? 'border-cyan-700/60 bg-cyan-950/10'
                    : 'border-gray-800 bg-gray-950/55'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{group.title}</p>
                    <p className="mt-1 text-sm text-gray-300">{group.why_selected}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {highlighted ? (
                      <span className="rounded-full border border-cyan-700/60 bg-cyan-950/25 px-2.5 py-1 text-xs text-cyan-100">
                        Recommended next
                      </span>
                    ) : null}
                    <span className="rounded-full border border-gray-700 bg-gray-900/70 px-2.5 py-1 text-xs text-gray-200">
                      {group.share_pct}% of candidates
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Senders</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {group.sender_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Messages</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {group.message_count.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-300">
                  <p>
                    Review {group.sender_count.toLocaleString()} senders here when you want a sender-centric pass on this cleanup group.
                  </p>
                  <details className="rounded-2xl border border-gray-800 bg-gray-950/50 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-white">
                      Sender context and review cautions
                    </summary>
                    <div className="mt-3 space-y-2 text-sm text-gray-300">
                      <p>Safety context: {group.safety_note}</p>
                      <p>Review caution: {group.risk_note}</p>
                      <p className="text-xs text-gray-500">
                        Dominant sender: {group.dominant_sender || '—'} · dominant pattern:{' '}
                        {group.dominant_pattern || '—'} · uncertain senders:{' '}
                        {group.uncertain_sender_count.toLocaleString()} · protected messages:{' '}
                        {group.protected_message_count.toLocaleString()}
                      </p>
                    </div>
                  </details>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/agents/${agentId}/operations/review${clusterQuery}`}
                    className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
                  >
                    Review sender set
                  </Link>
                  <Link
                    href={`/agents/${agentId}/operations/intelligence${query}`}
                    className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
                  >
                    Back to intelligence
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
