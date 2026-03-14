'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  DEFAULT_OPERATIONS_ANALYSIS_SCOPE,
  OPERATIONS_ANALYSIS_SCOPE_OPTIONS,
  analysisScopeLabel,
  normalizeOperationsAnalysisScope,
  serializeOperationsQuery,
  type OperationsAnalysisScope,
  type ChatMessage,
} from '@/lib/runtime/operationsWorkspace'
import { OperationsRuntimeProvider, useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'

type Props = {
  agentId: string
  children: ReactNode
}

type RailItem = {
  key: string
  label: string
  caption: string
  href: string
  section: 'workflow' | 'queue' | 'tooling'
  stage?: string
}

function assistantSuggestedPrompts(pathname: string, reviewStage: string | null): string[] {
  if (pathname.includes('/operations/intelligence')) {
    return [
      'Which senders dominate the whole mailbox versus the cleanup candidate universe?',
      'What does the protected/safe context say about cleanup risk?',
      'Which cleanup group should I open next from this dashboard?',
    ]
  }
  if (pathname.includes('/operations/review')) {
    if (reviewStage === 'exceptions') {
      return [
        'Why is this sender in Exceptions?',
        'Which protection signals make this sender risky to archive?',
        'What override is safest here?',
      ]
    }
    if (reviewStage === 'confirmation') {
      return [
        'What changes now versus later?',
        'How many exact messages will archive now?',
        'Which senders are still undecided?',
      ]
    }
    if (reviewStage === 'rules') {
      return [
        'Which decisions became future automation intents?',
        'What is learned now but not executed yet?',
        'Which rules should stay manual for now?',
      ]
    }
    if (reviewStage === 'monitoring') {
      return [
        'What did the agent learn from my sender decisions?',
        'Which recommendations are memory-backed?',
        'Show similar learned sender patterns.',
      ]
    }
    return [
      'Why is this sender in the current cleanup group?',
      'Show engagement/protection signals for this sender.',
      'How does this sender decision change Confirmation?',
    ]
  }
  if (pathname.includes('/operations/clusters')) {
    return [
      'Which cluster is safest to start with?',
      'Why does this cluster exist?',
      'How does this group narrow the sender universe?',
    ]
  }
  if (pathname.includes('/operations/approvals')) {
    return [
      'What happens if I approve this request?',
      'Is this action reversible?',
      'What happens if I reject this request?',
    ]
  }
  if (pathname.includes('/operations/history')) {
    return [
      'What patterns are repeated in executed actions?',
      'Which senders were archived most often?',
      'Any risky trends in recent operations?',
    ]
  }
  return [
    'What should I look at in Mailbox Intelligence first?',
    'Which cleanup group should I start with?',
    'What should stay protected?',
  ]
}

function buildAssistantContext(params: {
  pathname: string
  resultId: string | null
  clusterId: string | null
  reviewStage: string | null
}): string {
  const resultSuffix = params.resultId ? ` Result: ${params.resultId}.` : ''
  const clusterSuffix = params.clusterId ? ` Cluster: ${params.clusterId}.` : ''
  const scopeSuffix = `${resultSuffix}${clusterSuffix}`.trim()
  const withScope = (text: string) => (scopeSuffix ? `${text} ${scopeSuffix}` : text)

  if (params.pathname.includes('/operations/review')) {
    if (params.reviewStage === 'exceptions') {
      return withScope(
        'Current context: Exceptions / Verification. Focus on mixed senders, protected hints, and safe overrides before confirmation.'
      )
    }
    if (params.reviewStage === 'confirmation') {
      return withScope(
        'Current context: Confirmation. Focus on exact current-message impact, what changes now, and what remains future learned behavior.'
      )
    }
    if (params.reviewStage === 'rules') {
      return withScope(
        'Current context: Rules / Automation. Focus on future sender policies, rule intents, and what is learned but not executed in Gmail yet.'
      )
    }
    if (params.reviewStage === 'monitoring') {
      return withScope(
        'Current context: Monitoring. Focus on learned memory, RAG-backed recommendations, and how user decisions are shaping future Gmail automation.'
      )
    }
    return withScope(
      'Current context: Sender Decisions. Focus on sender-level review, message evidence, protection signals, and the safest next sender policy.'
    )
  }
  if (params.pathname.includes('/operations/intelligence')) {
    return withScope(
      'Current context: Mailbox Intelligence. Focus on whole-mailbox sender analysis, cleanup candidate context, protected/safe context, and which cleanup group should be reviewed next.'
    )
  }
  if (params.pathname.includes('/operations/clusters')) {
    return withScope(
      'Current context: Cleanup Groups. Focus on sender-cluster prioritization, scope narrowing, and safest review order.'
    )
  }
  if (params.pathname.includes('/operations/approvals')) {
    return withScope(
      'Current context: Pending Approvals. Focus on approval consequences and reversibility.'
    )
  }
  if (params.pathname.includes('/operations/history')) {
    return withScope('Current context: History. Focus on outcomes, trends, and repeated patterns.')
  }
  return withScope(
    'Current context: Intro & Health. Focus on mailbox health, index readiness, and the next guided step into Mailbox Intelligence.'
  )
}

function sectionTitle(section: RailItem['section']): string {
  if (section === 'workflow') return 'Workflow'
  if (section === 'queue') return 'Queue & Audit'
  return 'Tools'
}

function railItemClass(active: boolean): string {
  return active
    ? 'group relative block rounded-xl border border-cyan-700/70 bg-cyan-950/35 px-3.5 py-3.5'
    : 'group relative block rounded-xl border border-gray-800 bg-gray-950/25 px-3.5 py-3.5 hover:border-gray-700 hover:bg-gray-900/35'
}

function OperationsWorkspaceShellInner(props: {
  agentId: string
  children: ReactNode
  pathname: string
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
  resultId: string | null
  clusterId: string | null
  historyTab: string | null
  reviewStage: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const [scopeUpdating, setScopeUpdating] = useState(false)
  const [regeneratingClusters, setRegeneratingClusters] = useState(false)
  const [lastRegeneratedAt, setLastRegeneratedAt] = useState<number | null>(null)
  const [regenerationStatusNote, setRegenerationStatusNote] = useState<string | null>(null)
  const [pendingRegenerateBaseline, setPendingRegenerateBaseline] = useState<{
    clusterIdKey: string
    clusterCount: number
    clusterCountsById: Record<string, number>
    indexedSpanStart: string | null
    indexedSpanEnd: string | null
    scope: OperationsAnalysisScope
  } | null>(null)
  const previousScopeRef = useRef<OperationsAnalysisScope>(props.analysisScope)
  const latestSnapshotVersionRef = useRef<string | null>(null)
  const regeneratePollTokenRef = useRef(0)
  const runtimeClusters = useMemo(
    () => runtime.data?.runtime_cleanup_plan?.clusters || [],
    [runtime.data?.runtime_cleanup_plan?.clusters]
  )
  const effectiveDiscoveryWindow =
    runtime.data?.runtime_mailbox_profile?.cluster_diagnostics?.source_counts?.discovery_window_days ??
    runtime.data?.runtime_mailbox_profile?.analysis_window_days ??
    null
  const clusterIdKey = useMemo(
    () => runtimeClusters.map((cluster) => cluster.cluster_id).join('|'),
    [runtimeClusters]
  )
  const clusterCountsById = useMemo(() => {
    const next: Record<string, number> = {}
    for (const cluster of runtimeClusters) {
      next[cluster.cluster_id] = cluster.estimated_count
    }
    return next
  }, [runtimeClusters])
  const clusterCount = runtimeClusters.length
  const indexedSpanStart =
    runtime.data?.runtime_mailbox_profile?.cluster_diagnostics?.source_counts?.indexed_date_span_start ||
    runtime.data?.runtime_mailbox_profile?.cluster_diagnostics?.source_counts?.indexed_oldest_message_at ||
    null
  const indexedSpanEnd =
    runtime.data?.runtime_mailbox_profile?.cluster_diagnostics?.source_counts?.indexed_date_span_end ||
    runtime.data?.runtime_mailbox_profile?.cluster_diagnostics?.source_counts?.indexed_newest_message_at ||
    null
  const runtimeSnapshotVersion =
    runtime.data?.runtime_cleanup_plan?.generated_at ||
    runtime.data?.runtime_mailbox_profile?.freshness?.last_generated_at ||
    runtime.data?.runtime_mailbox_profile?.generated_at ||
    null
  const query = useMemo(
    () => serializeOperationsQuery(props.sessionId, props.analysisScope),
    [props.analysisScope, props.sessionId]
  )
  const reviewHref = useCallback(
    (stage: string) => {
      const next = new URLSearchParams()
      if (props.sessionId) next.set('playground_session_id', props.sessionId)
      if (props.analysisScope !== DEFAULT_OPERATIONS_ANALYSIS_SCOPE) {
        next.set('analysis_scope', props.analysisScope)
      }
      if (props.clusterId) next.set('cluster_id', props.clusterId)
      next.set('stage', stage)
      return `/agents/${props.agentId}/operations/review?${next.toString()}`
    },
    [props.agentId, props.analysisScope, props.clusterId, props.sessionId]
  )
  const items: RailItem[] = useMemo(
    () => [
      {
        key: 'intelligence',
        section: 'workflow',
        label: 'Mailbox Intelligence',
        caption: 'Main Gmail cleanup dashboard',
        href: `/agents/${props.agentId}/operations/intelligence${query}`,
      },
      {
        key: 'clusters',
        section: 'workflow',
        label: 'Cleanup Groups',
        caption: 'Choose one sender cluster to review',
        href: `/agents/${props.agentId}/operations/clusters${query}`,
      },
      {
        key: 'senders',
        section: 'workflow',
        label: 'Sender Decisions',
        caption: 'Main sender-first review workspace',
        href: reviewHref('senders'),
        stage: 'senders',
      },
      {
        key: 'exceptions',
        section: 'workflow',
        label: 'Exceptions / Verification',
        caption: 'Confirm mixed or protected senders',
        href: reviewHref('exceptions'),
        stage: 'exceptions',
      },
      {
        key: 'confirmation',
        section: 'workflow',
        label: 'Confirmation',
        caption: 'See exact message impact',
        href: reviewHref('confirmation'),
        stage: 'confirmation',
      },
      {
        key: 'rules',
        section: 'workflow',
        label: 'Rules / Automation',
        caption: 'Define future behavior',
        href: reviewHref('rules'),
        stage: 'rules',
      },
      {
        key: 'monitoring',
        section: 'workflow',
        label: 'Monitoring',
        caption: 'Agent memory and recommendations',
        href: reviewHref('monitoring'),
        stage: 'monitoring',
      },
      {
        key: 'overview',
        section: 'workflow',
        label: 'Intro & Health',
        caption: 'Lightweight status and entry handoff',
        href: `/agents/${props.agentId}/operations${query}`,
      },
      {
        key: 'approvals',
        section: 'queue',
        label: 'Pending Approvals',
        caption: 'Approve or reject queued requests',
        href: `/agents/${props.agentId}/operations/approvals${query}`,
      },
      {
        key: 'executed',
        section: 'queue',
        label: 'Executed Actions',
        caption: 'Recently completed operations',
        href: `/agents/${props.agentId}/operations/history?${new URLSearchParams({
          tab: 'executed',
          ...(props.sessionId ? { playground_session_id: props.sessionId } : {}),
          ...(props.analysisScope !== DEFAULT_OPERATIONS_ANALYSIS_SCOPE
            ? { analysis_scope: props.analysisScope }
            : {}),
        }).toString()}`,
      },
      {
        key: 'history',
        section: 'queue',
        label: 'History',
        caption: 'Audit trail and execution timeline',
        href: `/agents/${props.agentId}/operations/history${query}`,
      },
      {
        key: 'playground',
        section: 'tooling',
        label: 'AI Playground Chat',
        caption: 'General chat/testing surface',
        href: `/agents/${props.agentId}/playground${query}`,
      },
    ],
    [props.agentId, props.analysisScope, props.sessionId, query, reviewHref]
  )

  const groupedItems = useMemo(() => {
    return {
      workflow: items.filter((item) => item.section === 'workflow'),
      queue: items.filter((item) => item.section === 'queue'),
      tooling: items.filter((item) => item.section === 'tooling'),
    }
  }, [items])

  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([])
  const [assistantSessionId, setAssistantSessionId] = useState<string | null>(null)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantSending, setAssistantSending] = useState(false)

  useEffect(() => {
    return () => {
      regeneratePollTokenRef.current = 0
    }
  }, [])
  const isReviewPage = props.pathname.includes('/operations/review')
  const assistantRequestMode = isReviewPage ? 'playground_review_detail' : 'playground'
  const assistantScopeKey = `${assistantRequestMode}:${props.resultId || ''}:${props.clusterId || ''}`

  useEffect(() => {
    setAssistantMessages([])
    setAssistantSessionId(null)
  }, [assistantScopeKey])

  useEffect(() => {
    latestSnapshotVersionRef.current = runtimeSnapshotVersion
  }, [runtimeSnapshotVersion])

  const beginBackgroundRegeneration = useCallback(
    async (params: { refreshReason: string; notePrefix: string }) => {
      if (regeneratingClusters) return

      const baselineVersion = latestSnapshotVersionRef.current
      const startedAtMs = Date.now()
      const startedAtIso = new Date(startedAtMs).toISOString()
      const token = startedAtMs
      regeneratePollTokenRef.current = token

      console.info(
        `[operations][regenerate-background] ${JSON.stringify({
          event: 'started',
          snapshot_version_before: baselineVersion,
          snapshot_version_after: baselineVersion,
          previous_snapshot_served_while_refreshing: true,
          recompute_started_at: startedAtIso,
          recompute_completed_at: null,
          total_regenerate_background_ms: null,
          selected_analysis_scope: props.analysisScope,
        })}`
      )

      setRegeneratingClusters(true)
      setPendingRegenerateBaseline({
        clusterIdKey,
        clusterCount,
        clusterCountsById,
        indexedSpanStart,
        indexedSpanEnd,
        scope: props.analysisScope,
      })
      setRegenerationStatusNote(
        `${params.notePrefix} Refreshing cleanup analysis in the background while the current workspace stays visible.`
      )

      await runtime.refreshRuntimeSnapshot({
        force: true,
        silent: true,
        forceMailboxProfileRefresh: true,
        refreshReason: params.refreshReason,
      })

      const maxAttempts = 30
      const pollDelayMs = 4000
      const poll = async (attempt: number): Promise<void> => {
        if (regeneratePollTokenRef.current !== token) return

        await runtime.refreshRuntimeSnapshot({
          force: true,
          silent: true,
          refreshReason: 'background_regenerate_poll',
        })

        const latestVersion = latestSnapshotVersionRef.current
        if (latestVersion && latestVersion !== baselineVersion) {
          setRegeneratingClusters(false)
          setLastRegeneratedAt(Date.now())
          const elapsedMs = Math.max(0, Date.now() - startedAtMs)
          const completedAtIso = new Date().toISOString()
          console.info(
            `[operations][regenerate-background] ${JSON.stringify({
              event: 'completed',
              snapshot_version_before: baselineVersion,
              snapshot_version_after: latestVersion,
              previous_snapshot_served_while_refreshing: true,
              recompute_started_at: startedAtIso,
              recompute_completed_at: completedAtIso,
              total_regenerate_background_ms: elapsedMs,
              selected_analysis_scope: props.analysisScope,
            })}`
          )
          setRegenerationStatusNote(
            `${params.notePrefix} Updated cleanup analysis is ready (${elapsedMs} ms background refresh).`
          )
          return
        }

        if (attempt >= maxAttempts) {
          setRegeneratingClusters(false)
          setLastRegeneratedAt(Date.now())
          console.info(
            `[operations][regenerate-background] ${JSON.stringify({
              event: 'in_progress_timeout',
              snapshot_version_before: baselineVersion,
              snapshot_version_after: latestSnapshotVersionRef.current,
              previous_snapshot_served_while_refreshing: true,
              recompute_started_at: startedAtIso,
              recompute_completed_at: null,
              total_regenerate_background_ms: Math.max(0, Date.now() - startedAtMs),
              selected_analysis_scope: props.analysisScope,
            })}`
          )
          setRegenerationStatusNote(
            `${params.notePrefix} Background recompute is still running. Keeping current snapshot until the next refresh lands.`
          )
          return
        }

        setTimeout(() => {
          void poll(attempt + 1)
        }, pollDelayMs)
      }

      setTimeout(() => {
        void poll(1)
      }, 2500)
    },
    [
      clusterCount,
      clusterCountsById,
      clusterIdKey,
      indexedSpanEnd,
      indexedSpanStart,
      props.analysisScope,
      regeneratingClusters,
      runtime,
    ]
  )

  const updateAnalysisScope = async (nextScope: OperationsAnalysisScope) => {
    const normalizedNext = normalizeOperationsAnalysisScope(nextScope)
    if (normalizedNext === props.analysisScope) return
    setScopeUpdating(true)
    setRegenerationStatusNote(`Analysis window set to ${analysisScopeLabel(normalizedNext)}. Applying scoped refresh…`)
    const nextSearch = new URLSearchParams(searchParams.toString())
    if (normalizedNext === DEFAULT_OPERATIONS_ANALYSIS_SCOPE) {
      nextSearch.delete('analysis_scope')
    } else {
      nextSearch.set('analysis_scope', normalizedNext)
    }
    const nextQuery = nextSearch.toString()
    router.replace(nextQuery ? `${props.pathname}?${nextQuery}` : props.pathname)
    setTimeout(() => {
      setScopeUpdating(false)
    }, 900)
  }

  useEffect(() => {
    if (previousScopeRef.current === props.analysisScope) return
    const previousScope = previousScopeRef.current
    previousScopeRef.current = props.analysisScope
    setRegenerationStatusNote(
      `Analysis window changed from ${analysisScopeLabel(previousScope)} to ${analysisScopeLabel(props.analysisScope)}. Refreshing cleanup analysis in the background.`
    )
    void beginBackgroundRegeneration({
      refreshReason: `analysis_scope:${props.analysisScope}`,
      notePrefix: `Cleanup analysis refreshed for ${analysisScopeLabel(props.analysisScope)}.`,
    })
  }, [
    beginBackgroundRegeneration,
    props.analysisScope,
  ])

  const regenerateClusters = async () => {
    if (regeneratingClusters) return
    void beginBackgroundRegeneration({
      refreshReason: 'manual_regenerate_clusters',
      notePrefix: `Cleanup analysis refreshed for ${analysisScopeLabel(props.analysisScope)}.`,
    })
  }

  useEffect(() => {
    if (!pendingRegenerateBaseline || runtime.refreshing) return
    const changed =
      pendingRegenerateBaseline.clusterCount !== clusterCount ||
      pendingRegenerateBaseline.clusterIdKey !== clusterIdKey
    const previousIds = new Set(Object.keys(pendingRegenerateBaseline.clusterCountsById))
    const currentIds = new Set(Object.keys(clusterCountsById))
    const added = Array.from(currentIds).filter((id) => !previousIds.has(id)).length
    const removed = Array.from(previousIds).filter((id) => !currentIds.has(id)).length
    let shifted = 0
    for (const id of Array.from(currentIds)) {
      if (!previousIds.has(id)) continue
      if (pendingRegenerateBaseline.clusterCountsById[id] !== clusterCountsById[id]) shifted += 1
    }
    const previousSpanLabel =
      pendingRegenerateBaseline.indexedSpanStart && pendingRegenerateBaseline.indexedSpanEnd
        ? `${new Date(pendingRegenerateBaseline.indexedSpanStart).toLocaleDateString()} → ${new Date(
            pendingRegenerateBaseline.indexedSpanEnd
          ).toLocaleDateString()}`
        : '—'
    const currentSpanLabel =
      indexedSpanStart && indexedSpanEnd
        ? `${new Date(indexedSpanStart).toLocaleDateString()} → ${new Date(indexedSpanEnd).toLocaleDateString()}`
        : '—'
    const spanChanged =
      pendingRegenerateBaseline.indexedSpanStart !== indexedSpanStart ||
      pendingRegenerateBaseline.indexedSpanEnd !== indexedSpanEnd
    setRegenerationStatusNote(
      changed || shifted > 0 || spanChanged
        ? `Cleanup analysis refreshed for ${analysisScopeLabel(props.analysisScope)}: cleanup groups ${pendingRegenerateBaseline.clusterCount} → ${clusterCount}, added ${added}, removed ${removed}, count-shifted ${shifted}, indexed span ${previousSpanLabel} → ${currentSpanLabel}.`
        : `Cleanup analysis refreshed for ${analysisScopeLabel(props.analysisScope)}: cleanup groups unchanged (${clusterCount}); indexed span ${currentSpanLabel}.`
    )
    setPendingRegenerateBaseline(null)
  }, [
    clusterCount,
    clusterCountsById,
    clusterIdKey,
    indexedSpanEnd,
    indexedSpanStart,
    pendingRegenerateBaseline,
    props.analysisScope,
    runtime.refreshing,
  ])

  const suggestedPrompts = useMemo(
    () => assistantSuggestedPrompts(props.pathname, props.reviewStage),
    [props.pathname, props.reviewStage]
  )

  const sendAssistantMessage = async () => {
    const text = assistantInput.trim()
    if (!text || assistantSending) return
    setAssistantInput('')
    const contextPrefix = buildAssistantContext({
      pathname: props.pathname,
      resultId: props.resultId,
      clusterId: props.clusterId,
      reviewStage: props.reviewStage,
    })
    const nextMessages: ChatMessage[] = [
      ...assistantMessages,
      { role: 'user', content: `${contextPrefix}\n\n${text}` },
    ]
    setAssistantMessages(nextMessages)
    setAssistantSending(true)
    try {
      const res = await fetch('/api/agents/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: props.agentId,
          messages: nextMessages,
          session_id: assistantSessionId,
          session_origin: isReviewPage
            ? 'operations_workspace_review_assistant'
            : 'operations_workspace_assistant',
          request_mode: assistantRequestMode,
        }),
      })
      const payload = (await res.json()) as {
        ok?: boolean
        error?: string
        data?: { reply?: string; session_id?: string }
      }
      const reply =
        payload.ok && typeof payload.data?.reply === 'string'
          ? payload.data.reply
          : payload.error || 'Assistant could not respond.'
      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (payload.data?.session_id && payload.data.session_id.trim()) {
        setAssistantSessionId(payload.data.session_id.trim())
      }
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Assistant is temporarily unavailable.' },
      ])
    } finally {
      setAssistantSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[284px_minmax(0,1fr)_340px]">
      <aside className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950/65 to-gray-950/35 p-3.5 h-fit">
        <div className="space-y-2.5 pb-3.5 border-b border-gray-800">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300">Operations Workspace</p>
          <p className="text-[11px] text-gray-400 leading-snug">
            Session-scoped operator workflow for inbox review, approvals, and execution audit.
          </p>
          <div className="space-y-1.5 rounded border border-gray-800 bg-gray-950/50 p-2">
            <p className="text-[9px] uppercase tracking-wide text-gray-500">Analysis window</p>
            <select
              value={props.analysisScope}
              onChange={(event) =>
                void updateAnalysisScope(
                  normalizeOperationsAnalysisScope(event.target.value)
                )
              }
              disabled={scopeUpdating}
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-100"
            >
              {OPERATIONS_ANALYSIS_SCOPE_OPTIONS.map((scope) => (
                <option key={scope} value={scope}>
                  {analysisScopeLabel(scope)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void regenerateClusters()}
              disabled={scopeUpdating || regeneratingClusters}
              className={`w-full rounded px-2 py-1.5 text-xs font-medium ${
                scopeUpdating || regeneratingClusters
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
              }`}
            >
              {regeneratingClusters ? 'Refreshing cleanup analysis…' : 'Refresh cleanup analysis'}
            </button>
            <p className="text-[10px] text-gray-500">
              Scope: {analysisScopeLabel(props.analysisScope)} · Last refresh:{' '}
              {runtime.loadedAt ? new Date(runtime.loadedAt).toLocaleTimeString() : '—'}
            </p>
            <p className="text-[10px] text-gray-500">
              Effective discovery window:{' '}
              {effectiveDiscoveryWindow === 'all_indexed'
                ? 'all indexed'
                : typeof effectiveDiscoveryWindow === 'number'
                  ? `${effectiveDiscoveryWindow}d`
                  : '—'}
            </p>
            <p className="text-[10px] text-gray-500">
              Last regenerated: {lastRegeneratedAt ? new Date(lastRegeneratedAt).toLocaleTimeString() : '—'}
            </p>
            {runtime.lastRefreshReason ? (
              <p className="text-[10px] text-gray-500">Reason: {runtime.lastRefreshReason}</p>
            ) : null}
            {regenerationStatusNote ? (
              <p className="text-[10px] text-cyan-300">{regenerationStatusNote}</p>
            ) : null}
            {runtime.refreshing ? (
              <p className="text-[10px] text-cyan-300">
                Refreshing cleanup analysis in the background. Current cleanup groups stay visible until the new results are ready.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-amber-900/55 bg-amber-950/20 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wide text-amber-300">Pending</p>
              <p className="text-xs font-semibold text-amber-100">
                {runtime.data?.runtime_approval_queue_summary?.pending || 0}
              </p>
            </div>
            <div className="rounded border border-blue-900/55 bg-blue-950/20 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wide text-blue-300">Approved</p>
              <p className="text-xs font-semibold text-blue-100">
                {runtime.data?.runtime_approval_queue_summary?.approved || 0}
              </p>
            </div>
            <div className="rounded border border-emerald-900/55 bg-emerald-950/20 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wide text-emerald-300">Executed</p>
              <p className="text-xs font-semibold text-emerald-100">
                {runtime.data?.runtime_approval_queue_summary?.executed || 0}
              </p>
            </div>
            <div className="rounded border border-rose-900/55 bg-rose-950/20 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wide text-rose-300">Rejected</p>
              <p className="text-xs font-semibold text-rose-100">
                {runtime.data?.runtime_approval_queue_summary?.rejected || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3.5 space-y-4">
          {(['workflow', 'queue', 'tooling'] as const).map((section) => (
            <div key={section} className="space-y-2">
              <p className="px-1 text-[10px] uppercase tracking-wide text-gray-500">
                {sectionTitle(section)}
              </p>
              <div className="space-y-1.5">
                {groupedItems[section].map((item) => {
                  const hrefPath = item.href.split('?')[0]
                  const active =
                    item.key === 'executed'
                      ? props.pathname === `/agents/${props.agentId}/operations/history` &&
                        props.historyTab === 'executed'
                      : item.key === 'history'
                        ? props.pathname === `/agents/${props.agentId}/operations/history` &&
                          props.historyTab !== 'executed'
                        : item.stage
                          ? props.pathname === `/agents/${props.agentId}/operations/review` &&
                            props.reviewStage === item.stage
                          : props.pathname === hrefPath
                  return (
                    <Link key={item.key} href={item.href} className={railItemClass(active)}>
                      <div className="space-y-1">
                        <p
                          className={`text-[12px] font-semibold leading-snug ${
                            active ? 'text-cyan-100' : 'text-gray-200 group-hover:text-cyan-200'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-[11px] text-gray-500 leading-relaxed break-words">
                          {item.caption}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="min-w-0">{props.children}</section>

      <aside className="rounded-xl border border-gray-800 bg-gray-950/35 p-3 flex flex-col gap-2 h-[calc(100vh-12rem)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-cyan-300">AI Assistant</p>
            <p className="text-[11px] text-gray-400">Contextual help (secondary)</p>
          </div>
          {runtime.refreshing ? (
            <span className="text-[10px] text-cyan-300">Syncing…</span>
          ) : runtime.error ? (
            <span className="text-[10px] text-rose-300">Sync issue</span>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto rounded border border-gray-800 bg-gray-950/55 p-2 space-y-2">
          {assistantMessages.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              Use the suggested prompts for this page, or ask any context-specific question.
            </p>
          ) : (
            assistantMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded px-2 py-1.5 text-xs whitespace-pre-wrap ${
                    message.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="rounded border border-gray-800 bg-gray-950/45 p-2 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Suggested prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setAssistantInput(prompt)}
                className="rounded border border-gray-700 bg-gray-900/65 px-2 py-1 text-[11px] text-gray-200 hover:border-cyan-700 hover:text-cyan-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={assistantInput}
            onChange={(event) => setAssistantInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendAssistantMessage()
              }
            }}
            placeholder="Ask AI about this page…"
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-white"
          />
          <button
            type="button"
            onClick={() => void sendAssistantMessage()}
            disabled={assistantSending || !assistantInput.trim()}
            className={`rounded px-2.5 py-2 text-xs font-medium ${
              assistantSending || !assistantInput.trim()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-700 hover:bg-cyan-600 text-white'
            }`}
          >
            {assistantSending ? '…' : 'Ask'}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default function OperationsWorkspaceShell({ agentId, children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('playground_session_id')
  const analysisScope = normalizeOperationsAnalysisScope(searchParams.get('analysis_scope'))
  const resultId = searchParams.get('result_id')
  const clusterId = searchParams.get('cluster_id')
  const historyTab = searchParams.get('tab')
  const reviewStage = searchParams.get('stage')

  return (
    <OperationsRuntimeProvider
      agentId={agentId}
      sessionId={sessionId}
      analysisScope={analysisScope}
    >
      <OperationsWorkspaceShellInner
        agentId={agentId}
        pathname={pathname}
        sessionId={sessionId}
        analysisScope={analysisScope}
        resultId={resultId}
        clusterId={clusterId}
        historyTab={historyTab}
        reviewStage={reviewStage}
      >
        {children}
      </OperationsWorkspaceShellInner>
    </OperationsRuntimeProvider>
  )
}
