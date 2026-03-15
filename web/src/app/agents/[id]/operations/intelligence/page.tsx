'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  MailboxIntelligenceDashboard,
  MailboxMissionPanel,
  GmailScopeLadder,
} from '@/components/runtime/GmailCleanupComponents'
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

type LocalWorkflowProgress = {
  decidedSenderCount: number
  startedClusterCount: number
  latestClusterId: string | null
  latestStage: string | null
}

function healthLabel(value: string | null | undefined): string {
  if (value === 'healthy') return 'Healthy'
  if (value === 'degraded_usable') return 'Degraded but usable'
  if (value === 'uninitialized') return 'Not indexed yet'
  if (value === 'unavailable') return 'Unavailable'
  return 'Unknown'
}

export default function OperationsIntelligencePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
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
        estimatedCount: cluster.estimated_count,
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
  const [workflowProgress, setWorkflowProgress] = useState<LocalWorkflowProgress>({
    decidedSenderCount: 0,
    startedClusterCount: 0,
    latestClusterId: null,
    latestStage: null,
  })

  useEffect(() => {
    let cancelled = false
    if (clusters.length === 0 || cachedIntelligence) return

    void fetchGmailMailboxIntelligence({
      clusters,
      analysisScope: runtime.analysisScope,
      cacheVersion,
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
  }, [cacheVersion, cachedIntelligence, clusters, runtime.analysisScope])

  useEffect(() => {
    if (typeof window === 'undefined' || !agentId) return

    const syncProgress = () => {
      const prefix = ['gmail.cleanup.workflow.v2', agentId, runtime.sessionId || requestedSessionId || 'none'].join(':')
      let decidedSenderCount = 0
      let startedClusterCount = 0
      let latestClusterId: string | null = null
      let latestStage: string | null = null
      let latestUpdatedAt = 0

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index)
        if (!key || !key.startsWith(`${prefix}:`)) continue

        try {
          const raw = window.localStorage.getItem(key)
          if (!raw) continue
          const parsed = JSON.parse(raw) as {
            senderPolicies?: Record<string, unknown>
            currentStage?: string
            updatedAt?: number
          }
          const senderPolicies =
            parsed.senderPolicies && typeof parsed.senderPolicies === 'object'
              ? Object.keys(parsed.senderPolicies).length
              : 0
          const updatedAt = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0
          const clusterId = key.split(':').at(-1) || null

          if (senderPolicies > 0 || updatedAt > 0) {
            startedClusterCount += 1
            decidedSenderCount += senderPolicies
          }
          if (updatedAt >= latestUpdatedAt) {
            latestUpdatedAt = updatedAt
            latestClusterId = clusterId
            latestStage = typeof parsed.currentStage === 'string' ? parsed.currentStage : null
          }
        } catch {
          continue
        }
      }

      setWorkflowProgress({
        decidedSenderCount,
        startedClusterCount,
        latestClusterId,
        latestStage,
      })
    }

    syncProgress()
    window.addEventListener('storage', syncProgress)
    window.addEventListener('focus', syncProgress)
    return () => {
      window.removeEventListener('storage', syncProgress)
      window.removeEventListener('focus', syncProgress)
    }
  }, [agentId, requestedSessionId, runtime.sessionId])

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
        No cleanup groups are available yet. Refresh cleanup analysis to populate Mailbox Intelligence.
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
        Loading whole-mailbox sender intelligence…
      </section>
    )
  }

  const pendingApprovals = runtime.data?.runtime_approval_queue_summary?.pending || 0
  const nextCluster =
    resolvedState.data.cleanup_groups
      .slice()
      .sort((left, right) => right.sender_count - left.sender_count || right.share_pct - left.share_pct)[0] ||
    null
  const resumeCluster =
    workflowProgress.latestClusterId &&
    resolvedState.data.cleanup_groups.find((cluster) => cluster.cluster_id === workflowProgress.latestClusterId)
      ? resolvedState.data.cleanup_groups.find((cluster) => cluster.cluster_id === workflowProgress.latestClusterId) || null
      : null
  const resumeStage =
    workflowProgress.latestStage === 'confirmation' ? 'confirmation' : 'senders'

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Mailbox Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sender-first Gmail cleanup command center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
          Understand the sender universe, see what work is pending, and move straight into the next cleanup group without switching between competing dashboards.
        </p>
      </section>

      <MailboxMissionPanel
        healthLabel={healthLabel(runtime.mailboxIndexHealth?.sync_health)}
        pendingApprovals={pendingApprovals}
        cleanupGroupCount={resolvedState.data.cleanup_groups.length}
        cleanupSenderCount={resolvedState.data.cleanup_candidate_universe.sender_count}
        decidedSenderCount={workflowProgress.decidedSenderCount}
        startedClusterCount={workflowProgress.startedClusterCount}
        nextCluster={
          nextCluster
            ? {
                clusterId: nextCluster.cluster_id,
                title: nextCluster.title,
                senderCount: nextCluster.sender_count,
                sharePct: nextCluster.share_pct,
              }
            : null
        }
        resumeTask={
          resumeCluster
            ? {
                title: resumeCluster.title,
                stageLabel: resumeStage === 'confirmation' ? 'Confirmation' : 'Sender Decisions',
                href: `/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(resumeCluster.cluster_id)}&stage=${resumeStage}`,
              }
            : null
        }
        buildClusterHref={(clusterId) =>
          `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(clusterId)}`
        }
      />

      <GmailScopeLadder
        title="Mailbox Intelligence"
        subtitle="The hierarchy is explicit at every step: whole mailbox -> cleanup candidate universe -> cleanup group -> sender set -> loaded preview rows."
        counts={resolvedState.data.scope_ladder}
      />

      <MailboxIntelligenceDashboard
        data={resolvedState.data}
        buildClusterHref={(clusterId) =>
          `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(clusterId)}`
        }
      />
    </div>
  )
}
