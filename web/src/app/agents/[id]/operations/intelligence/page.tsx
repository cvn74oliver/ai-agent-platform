'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { MailboxIntelligenceDashboard, GmailScopeLadder } from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  fetchGmailMailboxIntelligence,
  type GmailCleanupClusterRef,
  type GmailMailboxIntelligenceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'

type LoadState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'ready'; data: GmailMailboxIntelligenceData; error: null }
  | { status: 'error'; data: null; error: string }

export default function OperationsIntelligencePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)
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
        estimatedCount: cluster.estimated_count,
      })),
    [runtime.data?.runtime_cleanup_plan?.clusters]
  )
  const [state, setState] = useState<LoadState>({ status: 'idle', data: null, error: null })

  useEffect(() => {
    let cancelled = false
    if (clusters.length === 0) return
    void fetchGmailMailboxIntelligence({
      clusters,
      analysisScope: runtime.analysisScope,
      requestContext: {
        source: 'operations_intelligence_page',
        component: 'mailbox_intelligence_dashboard',
        reason: 'primary_dashboard_load',
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
  }, [clusters, runtime.analysisScope])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading Mailbox Intelligence…
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
        No cleanup groups are available yet. Regenerate cleanup analysis from Intro &amp; Health to populate Mailbox Intelligence.
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {state.error}
      </section>
    )
  }

  if (state.status !== 'ready') {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading whole-mailbox sender intelligence…
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <GmailScopeLadder
        title="Mailbox Intelligence"
        subtitle="The hierarchy is explicit at every step: whole mailbox -> cleanup candidate universe -> cleanup group -> sender set -> loaded preview rows."
        counts={state.data.scope_ladder}
      />

      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Mailbox Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">The real Gmail cleanup dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
          This page combines whole-mailbox context, cleanup-candidate context, and protected/safe context in one place. The goal is to help you understand why a mailbox with tens of thousands of messages becomes a much smaller sender universe before you choose a Cleanup Group.
        </p>
      </section>

      <MailboxIntelligenceDashboard
        data={state.data}
        buildClusterHref={(clusterId) =>
          `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(clusterId)}`
        }
      />
    </div>
  )
}
