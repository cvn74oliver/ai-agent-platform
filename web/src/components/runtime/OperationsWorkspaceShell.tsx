'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  DEFAULT_OPERATIONS_ANALYSIS_SCOPE,
  OPERATIONS_ANALYSIS_SCOPE_OPTIONS,
  analysisScopeControlLabel,
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
    if (reviewStage === 'decision') {
      return [
        'Why is this sender in the current cleanup group?',
        'Show engagement/protection signals for this sender.',
        'What Management bucket will this decision land in?',
      ]
    }
    return [
      'What does this cleanup group represent before I start decisions?',
      'How many senders are already managed versus still eligible?',
      'When should I leave Overview and enter Decision Mode?',
    ]
  }
  if (pathname.includes('/operations/clusters')) {
    return [
      'Which cluster is safest to start with?',
      'Why does this cluster exist?',
      'How does this group narrow the sender universe?',
    ]
  }
  if (pathname.includes('/operations/management')) {
    return [
      'Which destination states need attention right now?',
      'What has been committed versus actually executed?',
      'Which sender states should I revisit next?',
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
    if (params.reviewStage === 'decision') {
      return withScope(
        'Current context: Decision Mode. Focus on one-sender-at-a-time classification, destination assignment, protection signals, and the correct Management bucket.'
      )
    }
    return withScope(
      'Current context: Sender Overview. Focus on cleanup-group orientation, sender scope, progress, and when to enter Decision Mode.'
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
  if (params.pathname.includes('/operations/management')) {
    return withScope(
      'Current context: Decision Management. Focus on committed sender destinations, execution truth, warnings, and which destination states need follow-up next.'
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
    'Current context: Gmail workspace entry route. Focus on opening Mailbox Intelligence, understanding sender-first cleanup status, and identifying the next cleanup group to review.'
  )
}

function sectionTitle(section: RailItem['section']): string {
  if (section === 'workflow') return 'Workflow'
  if (section === 'queue') return 'Legacy & Audit'
  return 'Tools'
}

function railItemClass(active: boolean): string {
  return active
    ? 'automata-workspace-nav-item automata-workspace-nav-item-active group relative block rounded-xl px-3.5 py-3.5'
    : 'automata-workspace-nav-item group relative block rounded-xl px-3.5 py-3.5'
}

const railInsetPanelClass = 'app-surface-rail-inset rounded-xl px-2.5 py-2 space-y-1.5'
const railInputClass = 'app-surface-rail-inset w-full rounded-lg px-2 py-1.5 text-xs text-white'
const railPromptChipClass =
  'app-surface-card-tile rounded-lg px-2 py-1 text-[11px] text-slate-100 hover:border-cyan-700 hover:bg-[linear-gradient(180deg,rgba(24,41,58,0.98),rgba(15,25,38,0.98))] hover:text-cyan-200'

const MAILBOX_INDEX_COUNT_FORMATTER = new Intl.NumberFormat('en-US')

function formatMailboxIndexCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? MAILBOX_INDEX_COUNT_FORMATTER.format(Math.round(value))
    : '—'
}

function parseMailboxIndexDateMs(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function formatMailboxIndexDateTime(value: string | null | undefined): string {
  const parsed = parseMailboxIndexDateMs(value)
  if (parsed == null) return '—'
  return new Date(parsed).toLocaleString()
}

function formatMailboxIndexDate(value: string | null | undefined): string {
  const parsed = parseMailboxIndexDateMs(value)
  if (parsed == null) return '—'
  return new Date(parsed).toLocaleDateString()
}

function mailboxIndexTriggerLabel(value: string | null | undefined): string {
  if (value === 'manual_full_reindex') return 'manual_full_reindex'
  if (value === 'smart_sync') return 'smart_sync'
  if (value === 'operator_backfill') return 'operator_backfill'
  if (value === 'runtime_bootstrap') return 'runtime_bootstrap'
  if (value === 'runtime_backfill') return 'runtime_backfill'
  if (value === 'runtime_recovery') return 'runtime_recovery'
  if (value === 'analysis_refresh') return 'analysis_refresh'
  return '—'
}

function mailboxIndexCoverageLabel(start: string | null | undefined, end: string | null | undefined): string {
  const startMs = parseMailboxIndexDateMs(start)
  const endMs = parseMailboxIndexDateMs(end)
  if (startMs == null || endMs == null || startMs > endMs) return 'coverage unavailable'
  return `${new Date(startMs).toLocaleDateString()} -> ${new Date(endMs).toLocaleDateString()}`
}

function mailboxIndexYieldRangeLabel(start: string | null | undefined, end: string | null | undefined): string {
  const startMs = parseMailboxIndexDateMs(start)
  const endMs = parseMailboxIndexDateMs(end)
  if (startMs == null || endMs == null || startMs > endMs) return '—'
  return `${new Date(startMs).toLocaleDateString()} -> ${new Date(endMs).toLocaleDateString()}`
}

function mailboxIndexNextPageTokenLabel(value: boolean | null | undefined): string {
  if (value === true) return 'present'
  if (value === false) return 'absent'
  return '—'
}

function mailboxIndexYieldLines(
  yieldDetail:
    | {
        inserted_rows: number
        updated_rows: number
        already_indexed_rows: number
        oldest_message_seen_at: string | null
        newest_message_seen_at: string | null
        next_page_token_present: boolean | null
      }
    | null
    | undefined
): string[] {
  if (!yieldDetail) return []
  return [
    `Inserted / updated / already indexed: ${formatMailboxIndexCount(yieldDetail.inserted_rows)} / ${formatMailboxIndexCount(yieldDetail.updated_rows)} / ${formatMailboxIndexCount(yieldDetail.already_indexed_rows)}`,
    `Seen range: ${mailboxIndexYieldRangeLabel(
      yieldDetail.oldest_message_seen_at,
      yieldDetail.newest_message_seen_at
    )}`,
    `Next page token: ${mailboxIndexNextPageTokenLabel(yieldDetail.next_page_token_present)}`,
  ]
}

function mailboxIndexResumeCheckpointLines(
  checkpoint:
    | {
        usable: boolean
        next_page_token_present: boolean
        page_index: number | null
        processed_messages: number | null
        processed_at: string | null
      }
    | null
    | undefined
): string[] {
  if (!checkpoint?.usable) return []
  return [
    `Resume checkpoint page: ${formatMailboxIndexCount(checkpoint.page_index)}`,
    `Resume checkpoint messages: ${formatMailboxIndexCount(checkpoint.processed_messages)}`,
    `Resume checkpoint next token: ${mailboxIndexNextPageTokenLabel(checkpoint.next_page_token_present)}`,
  ]
}

function mailboxIndexBackfillWindowLabel(value: number | null | undefined): string {
  if (value === 24) return 'recent 24-month window'
  if (value === 36) return 'extended 36-month window'
  return 'historical window'
}

function mailboxIndexBackfillTargetLines(params: {
  windowMonths: number | null | undefined
  cutoffAt: string | null | undefined
}): string[] {
  if (params.windowMonths == null && !params.cutoffAt) return []
  const cutoffLabel = formatMailboxIndexDate(params.cutoffAt)
  return [
    `Backfill target: ${mailboxIndexBackfillWindowLabel(params.windowMonths)}`,
    `Historical cutoff: ${cutoffLabel === '—' ? 'unavailable' : cutoffLabel}`,
  ]
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
  const isMailboxIntelligencePage = props.pathname.includes('/operations/intelligence')
  const [scopeUpdating, setScopeUpdating] = useState(false)
  const [regeneratingClusters, setRegeneratingClusters] = useState(false)
  const [lastRegeneratedAt, setLastRegeneratedAt] = useState<number | null>(null)
  const [regenerationStatusNote, setRegenerationStatusNote] = useState<string | null>(null)
  const [mailboxIndexNotice, setMailboxIndexNotice] = useState<{
    tone: 'info' | 'error'
    text: string
  } | null>(null)
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
  const mailboxIndexHealth = runtime.mailboxIndexHealth
  const activeMailboxIndexRun = mailboxIndexHealth?.active_run ?? null
  const activeSmartMailboxSync =
    activeMailboxIndexRun?.trigger === 'smart_sync' ? activeMailboxIndexRun : null
  const pendingSmartMailboxSyncRun =
    !activeSmartMailboxSync && runtime.pendingSmartMailboxSyncRun?.trigger === 'smart_sync'
      ? runtime.pendingSmartMailboxSyncRun
      : null
  const activeOperatorBackfill =
    activeMailboxIndexRun?.trigger === 'operator_backfill' ? activeMailboxIndexRun : null
  const pendingOperatorBackfillRun =
    !activeOperatorBackfill &&
    runtime.pendingOperatorMailboxBackfillRun?.trigger === 'operator_backfill'
      ? runtime.pendingOperatorMailboxBackfillRun
      : null
  const activeManualMailboxReindex =
    activeMailboxIndexRun?.trigger === 'manual_full_reindex' ? activeMailboxIndexRun : null
  const lastSmartMailboxSync =
    mailboxIndexHealth?.last_result?.trigger === 'smart_sync' ? mailboxIndexHealth.last_result : null
  const lastOperatorBackfill =
    mailboxIndexHealth?.last_result?.trigger === 'operator_backfill'
      ? mailboxIndexHealth.last_result
      : null
  const lastManualMailboxReindex =
    mailboxIndexHealth?.last_result?.trigger === 'manual_full_reindex'
      ? mailboxIndexHealth.last_result
      : null
  const blockingMailboxIndexRun =
    mailboxIndexHealth?.execution_state === 'running' &&
    activeMailboxIndexRun &&
    activeMailboxIndexRun.trigger !== 'manual_full_reindex' &&
    activeMailboxIndexRun.trigger !== 'smart_sync' &&
    activeMailboxIndexRun.trigger !== 'operator_backfill'
      ? activeMailboxIndexRun
      : null
  const historicalBackfill = mailboxIndexHealth?.historical_backfill ?? null
  const recent24MonthBackfillComplete =
    historicalBackfill?.completed_window_months != null &&
    historicalBackfill.completed_window_months >= 24
  const extended36MonthBackfillComplete =
    historicalBackfill?.completed_window_months != null &&
    historicalBackfill.completed_window_months >= 36
  const mailboxIndexReconnectBlocked = mailboxIndexHealth?.has_gmail_connection === false
  const mailboxIndexActionDisabled =
    runtime.manualMailboxReindexStarting ||
    runtime.smartMailboxSyncStarting ||
    runtime.operatorMailboxBackfillStarting ||
    mailboxIndexHealth?.execution_state === 'running' ||
    mailboxIndexReconnectBlocked
  const showDefaultContinueBackfillButton = !recent24MonthBackfillComplete
  const showExtendedContinueBackfillButton =
    recent24MonthBackfillComplete && !extended36MonthBackfillComplete
  const query = useMemo(
    () => serializeOperationsQuery(props.sessionId, props.analysisScope),
    [props.analysisScope, props.sessionId]
  )
  const reviewWorkflowScope = props.pathname.includes('/operations/review')
    ? searchParams.get('workflow_scope')
    : null
  const reviewSupportsDetachedScope =
    props.pathname.includes('/operations/review') &&
    typeof props.clusterId === 'string' &&
    props.clusterId.trim().length > 0
  const normalizedReviewWorkflowScope =
    reviewSupportsDetachedScope && reviewWorkflowScope
      ? normalizeOperationsAnalysisScope(reviewWorkflowScope)
      : null
  const detachedReviewWorkflowScope =
    normalizedReviewWorkflowScope && normalizedReviewWorkflowScope !== props.analysisScope
      ? normalizedReviewWorkflowScope
      : null
  const visibleAnalysisScope = detachedReviewWorkflowScope || props.analysisScope
  const analysisWindowControlLabel = reviewSupportsDetachedScope
    ? 'Workflow scope'
    : 'Analysis window'
  const analysisWindowHelperText = reviewSupportsDetachedScope
    ? 'This control changes the baseline sender workflow on this review page. Time Context can then apply narrower workflow windows like 1D and Custom inside that baseline scope.'
    : 'This control changes the discovery window used for cleanup analysis.'
  const reviewHref = useCallback(
    (mode: string) => {
      const next = new URLSearchParams()
      if (props.sessionId) next.set('playground_session_id', props.sessionId)
      if (props.analysisScope !== DEFAULT_OPERATIONS_ANALYSIS_SCOPE) {
        next.set('analysis_scope', props.analysisScope)
      }
      if (reviewWorkflowScope) {
        next.set('workflow_scope', reviewWorkflowScope)
      }
      if (props.clusterId) next.set('cluster_id', props.clusterId)
      if (mode !== 'overview') next.set('mode', mode)
      return `/agents/${props.agentId}/operations/review?${next.toString()}`
    },
    [props.agentId, props.analysisScope, props.clusterId, props.sessionId, reviewWorkflowScope]
  )
  const items: RailItem[] = useMemo(
    () => [
      {
        key: 'intelligence',
        section: 'workflow',
        label: 'Mailbox Intelligence',
        caption: 'Mission, status, and high-level cleanup summary',
        href: `/agents/${props.agentId}/operations/intelligence${query}`,
      },
      {
        key: 'clusters',
        section: 'workflow',
        label: 'Cleanup Groups',
        caption: 'Full sender-group selection surface',
        href: `/agents/${props.agentId}/operations/clusters${query}`,
      },
      {
        key: 'sender_overview',
        section: 'workflow',
        label: 'Sender Overview',
        caption: 'Orientation, scope, and progress before focused review',
        href: reviewHref('overview'),
        stage: 'overview',
      },
      {
        key: 'decision_mode',
        section: 'workflow',
        label: 'Decision Mode',
        caption: 'One sender at a time, four actions, no Gmail mutation',
        href: reviewHref('decision'),
        stage: 'decision',
      },
      {
        key: 'management',
        section: 'workflow',
        label: 'Management',
        caption: 'Destination states, execution truth, and follow-up',
        href: `/agents/${props.agentId}/operations/management${query}`,
      },
      {
        key: 'approvals',
        section: 'queue',
        label: 'Pending Approvals',
        caption: 'Legacy queue surface kept route-safe for older runtime flows',
        href: `/agents/${props.agentId}/operations/approvals${query}`,
      },
      {
        key: 'executed',
        section: 'queue',
        label: 'Executed Actions',
        caption: 'Legacy execution audit view',
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
        caption: 'Legacy audit timeline and runtime history',
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
  const shellGridClassName = isMailboxIntelligencePage
    ? 'grid grid-cols-1 gap-4 xl:grid-cols-[272px_minmax(0,1fr)] 2xl:grid-cols-[272px_minmax(0,1fr)_300px]'
    : 'grid grid-cols-1 gap-4 xl:grid-cols-[284px_minmax(0,1fr)_340px]'
  const leftRailClassName =
    'app-surface-card app-surface-rail rounded-2xl p-3.5 h-fit shadow-[0_24px_56px_rgba(2,6,23,0.3)]'
  const centerFrameClassName =
    'min-w-0 rounded-[30px] border border-slate-500/40 bg-[linear-gradient(180deg,rgba(16,22,33,0.64),rgba(10,15,23,0.78))] p-3 shadow-[0_24px_60px_rgba(2,6,23,0.28)] xl:p-4'
  const assistantRailClassName = isMailboxIntelligencePage
    ? 'app-surface-card app-surface-rail min-w-0 rounded-2xl p-3 flex flex-col gap-2 shadow-[0_24px_56px_rgba(2,6,23,0.3)] xl:col-span-2 xl:h-auto 2xl:col-span-1 2xl:h-[calc(100vh-12rem)]'
    : 'app-surface-card app-surface-rail min-w-0 rounded-2xl p-3 flex flex-col gap-2 shadow-[0_24px_56px_rgba(2,6,23,0.3)] h-[calc(100vh-12rem)]'
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

      const refreshResult = await runtime.refreshRuntimeSnapshot({
        force: true,
        silent: true,
        forceMailboxProfileRefresh: true,
        refreshReason: params.refreshReason,
      })
      if (!refreshResult.ok) {
        setRegeneratingClusters(false)
        setPendingRegenerateBaseline(null)
        setRegenerationStatusNote(
          refreshResult.reason === 'already_running'
            ? 'Cleanup analysis refresh is already running. Keeping the current snapshot visible until it completes.'
            : refreshResult.reason === 'cooldown_active'
              ? 'Cleanup analysis refresh was started moments ago. Please wait briefly before trying again.'
              : refreshResult.error
        )
        return
      }

      const maxAttempts = 30
      const pollDelayMs = 4000
      const poll = async (attempt: number): Promise<void> => {
        if (regeneratePollTokenRef.current !== token) return

        const pollResult = await runtime.refreshRuntimeSnapshot({
          force: true,
          silent: true,
          refreshReason: 'background_regenerate_poll',
        })
        if (!pollResult.ok) {
          setRegeneratingClusters(false)
          setRegenerationStatusNote(
            pollResult.error || 'Background cleanup analysis refresh could not be confirmed yet.'
          )
          return
        }

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
    if (reviewSupportsDetachedScope) {
      if (normalizedNext === visibleAnalysisScope) return
      setScopeUpdating(true)
      setRegenerationStatusNote(
        normalizedNext === props.analysisScope
          ? `Workflow scope reset to ${analysisScopeLabel(normalizedNext)}. Reusing cached scoped review data.`
          : `Workflow scope set to ${analysisScopeLabel(normalizedNext)}. Reusing cached scoped review data.`
      )
      const nextSearch = new URLSearchParams(searchParams.toString())
      if (normalizedNext === props.analysisScope) {
        nextSearch.delete('workflow_scope')
      } else {
        nextSearch.set('workflow_scope', normalizedNext)
      }
      const nextQuery = nextSearch.toString()
      router.replace(nextQuery ? `${props.pathname}?${nextQuery}` : props.pathname)
      setTimeout(() => {
        setScopeUpdating(false)
      }, 150)
      return
    }
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
    if (reviewSupportsDetachedScope) {
      previousScopeRef.current = props.analysisScope
      return
    }
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
    reviewSupportsDetachedScope,
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

  const mailboxIndexStatus = useMemo(() => {
    if (!mailboxIndexHealth) {
      return {
        tone: 'gray' as const,
        title: 'Mailbox index status unavailable',
        lines: ['Mailbox index health has not loaded yet.'],
      }
    }

    const baseLines = [
      `Indexed rows: ${formatMailboxIndexCount(mailboxIndexHealth.indexed_message_count)}`,
      `Coverage: ${mailboxIndexCoverageLabel(
        mailboxIndexHealth.indexed_oldest_message_at,
        mailboxIndexHealth.indexed_newest_message_at
      )}`,
    ]

    if (activeSmartMailboxSync) {
      const resumedFromCheckpoint =
        activeSmartMailboxSync.requested_mode === 'full' &&
        activeSmartMailboxSync.effective_mode === 'full'
      return {
        tone: 'cyan' as const,
        title: resumedFromCheckpoint
          ? 'Smart Sync resumed from checkpoint'
          : 'Smart Sync running incrementally',
        lines: [
          ...baseLines,
          `Run id: ${activeSmartMailboxSync.run_id || '—'}`,
          `Requested/effective mode: ${activeSmartMailboxSync.requested_mode || '—'} / ${
            activeSmartMailboxSync.effective_mode || activeSmartMailboxSync.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(activeSmartMailboxSync.trigger)}`,
          `Started: ${formatMailboxIndexDateTime(activeSmartMailboxSync.started_at)}`,
          `Latest heartbeat: ${formatMailboxIndexDateTime(activeSmartMailboxSync.heartbeat_at)}`,
          ...(typeof activeSmartMailboxSync.rows_before === 'number'
            ? [`Rows before: ${formatMailboxIndexCount(activeSmartMailboxSync.rows_before)}`]
            : []),
          `Current indexed rows: ${formatMailboxIndexCount(mailboxIndexHealth.indexed_message_count)}`,
          ...(typeof activeSmartMailboxSync.list_pages_fetched === 'number'
            ? [`Pages fetched so far: ${formatMailboxIndexCount(activeSmartMailboxSync.list_pages_fetched)}`]
            : []),
          `Messages processed so far: ${formatMailboxIndexCount(activeSmartMailboxSync.processed_messages)}`,
          ...mailboxIndexResumeCheckpointLines(activeSmartMailboxSync.resume_checkpoint),
          ...mailboxIndexYieldLines(activeSmartMailboxSync.yield_detail),
        ],
      }
    }

    if (pendingSmartMailboxSyncRun) {
      const resumedFromCheckpoint =
        pendingSmartMailboxSyncRun.requested_mode === 'full' &&
        pendingSmartMailboxSyncRun.effective_mode === 'full'
      return {
        tone: 'cyan' as const,
        title: resumedFromCheckpoint
          ? 'Smart Sync resumed from checkpoint'
          : runtime.smartMailboxSyncStarting
            ? 'Starting Smart Sync...'
            : 'Smart Sync accepted',
        lines: [
          ...baseLines,
          `Run id: ${pendingSmartMailboxSyncRun.run_id || '—'}`,
          `Requested/effective mode: ${pendingSmartMailboxSyncRun.requested_mode || '—'} / ${
            pendingSmartMailboxSyncRun.effective_mode || pendingSmartMailboxSyncRun.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(pendingSmartMailboxSyncRun.trigger)}`,
          `Accepted: ${formatMailboxIndexDateTime(pendingSmartMailboxSyncRun.started_at)}`,
          'Waiting for mailbox-index state to confirm the live Smart Sync run.',
        ],
      }
    }

    if (runtime.smartMailboxSyncStarting) {
      return {
        tone: 'cyan' as const,
        title: 'Starting Smart Sync...',
        lines: [
          ...baseLines,
          'Waiting for mailbox index status to confirm the active Smart Sync run.',
        ],
      }
    }

    if (activeOperatorBackfill) {
      const resumedFromCheckpoint = activeOperatorBackfill.started_from_checkpoint === true
      return {
        tone: 'cyan' as const,
        title: resumedFromCheckpoint
          ? 'Resumed historical backfill from saved checkpoint'
          : 'Fresh historical backfill started',
        lines: [
          ...baseLines,
          `Run id: ${activeOperatorBackfill.run_id || '—'}`,
          `Requested/effective mode: ${activeOperatorBackfill.requested_mode || '—'} / ${
            activeOperatorBackfill.effective_mode || activeOperatorBackfill.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(activeOperatorBackfill.trigger)}`,
          `Started: ${formatMailboxIndexDateTime(activeOperatorBackfill.started_at)}`,
          `Latest heartbeat: ${formatMailboxIndexDateTime(activeOperatorBackfill.heartbeat_at)}`,
          ...(typeof activeOperatorBackfill.rows_before === 'number'
            ? [`Rows before: ${formatMailboxIndexCount(activeOperatorBackfill.rows_before)}`]
            : []),
          `Current indexed rows: ${formatMailboxIndexCount(mailboxIndexHealth.indexed_message_count)}`,
          ...mailboxIndexBackfillTargetLines({
            windowMonths: activeOperatorBackfill.backfill_window_months,
            cutoffAt: activeOperatorBackfill.backfill_cutoff_at,
          }),
          ...(typeof activeOperatorBackfill.list_pages_fetched === 'number'
            ? [`Pages fetched so far: ${formatMailboxIndexCount(activeOperatorBackfill.list_pages_fetched)}`]
            : []),
          `Messages processed so far: ${formatMailboxIndexCount(activeOperatorBackfill.processed_messages)}`,
          ...mailboxIndexResumeCheckpointLines(activeOperatorBackfill.resume_checkpoint),
          ...mailboxIndexYieldLines(activeOperatorBackfill.yield_detail),
        ],
      }
    }

    if (pendingOperatorBackfillRun) {
      const resumedFromCheckpoint = pendingOperatorBackfillRun.started_from_checkpoint === true
      return {
        tone: 'cyan' as const,
        title: resumedFromCheckpoint
          ? 'Resumed historical backfill from saved checkpoint'
          : runtime.operatorMailboxBackfillStarting
            ? 'Fresh historical backfill started'
            : 'Fresh historical backfill started',
        lines: [
          ...baseLines,
          `Run id: ${pendingOperatorBackfillRun.run_id || '—'}`,
          `Requested/effective mode: ${pendingOperatorBackfillRun.requested_mode || '—'} / ${
            pendingOperatorBackfillRun.effective_mode || pendingOperatorBackfillRun.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(pendingOperatorBackfillRun.trigger)}`,
          `Accepted: ${formatMailboxIndexDateTime(pendingOperatorBackfillRun.started_at)}`,
          ...mailboxIndexBackfillTargetLines({
            windowMonths: pendingOperatorBackfillRun.backfill_window_months,
            cutoffAt: pendingOperatorBackfillRun.backfill_cutoff_at,
          }),
          ...mailboxIndexResumeCheckpointLines(pendingOperatorBackfillRun.resume_checkpoint),
          'Waiting for mailbox-index state to confirm the live historical backfill run.',
        ],
      }
    }

    if (runtime.operatorMailboxBackfillStarting) {
      return {
        tone: 'cyan' as const,
        title: 'Starting historical backfill...',
        lines: [
          ...baseLines,
          'Waiting for mailbox index status to confirm the active historical backfill run.',
        ],
      }
    }

    const completedWindowMonths = historicalBackfill?.completed_window_months ?? null
    const completedBackfillStateVisible =
      completedWindowMonths != null &&
      !activeManualMailboxReindex &&
      !runtime.manualMailboxReindexStarting &&
      (!lastOperatorBackfill ||
        lastOperatorBackfill.terminal_reason === 'historical_window_reached' ||
        lastOperatorBackfill.terminal_reason === 'gmail_pagination_exhausted' ||
        lastOperatorBackfill.terminal_reason === 'empty_page')
    if (completedBackfillStateVisible) {
      return {
        tone: 'emerald' as const,
        title:
          completedWindowMonths === 36
            ? 'Historical backfill complete for extended 36-month window'
            : 'Historical backfill complete for recent 24-month window',
        lines: [
          ...baseLines,
          ...(historicalBackfill?.completed_at
            ? [`Completed: ${formatMailboxIndexDateTime(historicalBackfill.completed_at)}`]
            : []),
          ...mailboxIndexBackfillTargetLines({
            windowMonths: historicalBackfill?.completed_window_months,
            cutoffAt: historicalBackfill?.completed_cutoff_at,
          }),
          'Smart Sync will maintain new activity going forward',
          ...(completedWindowMonths === 24
            ? ['Optional extended backfill to 36 months is available']
            : []),
        ],
      }
    }

    if (activeManualMailboxReindex) {
      return {
        tone: 'cyan' as const,
        title: 'Manual full reindex running',
        lines: [
          ...baseLines,
          `Run id: ${activeManualMailboxReindex.run_id || '—'}`,
          `Requested/effective mode: ${activeManualMailboxReindex.requested_mode || '—'} / ${
            activeManualMailboxReindex.effective_mode || activeManualMailboxReindex.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(activeManualMailboxReindex.trigger)}`,
          `Started: ${formatMailboxIndexDateTime(activeManualMailboxReindex.started_at)}`,
          `Latest heartbeat: ${formatMailboxIndexDateTime(activeManualMailboxReindex.heartbeat_at)}`,
          `Rows before: ${formatMailboxIndexCount(activeManualMailboxReindex.rows_before)}`,
          `Current indexed rows: ${formatMailboxIndexCount(mailboxIndexHealth.indexed_message_count)}`,
          `Pages fetched so far: ${formatMailboxIndexCount(activeManualMailboxReindex.list_pages_fetched)}`,
          `Messages processed so far: ${formatMailboxIndexCount(activeManualMailboxReindex.processed_messages)}`,
          ...mailboxIndexResumeCheckpointLines(activeManualMailboxReindex.resume_checkpoint),
          ...mailboxIndexYieldLines(activeManualMailboxReindex.yield_detail),
        ],
      }
    }

    if (runtime.manualMailboxReindexStarting) {
      return {
        tone: 'cyan' as const,
        title: 'Starting manual full reindex...',
        lines: [
          ...baseLines,
          'Waiting for mailbox index status to confirm the active full-scan run.',
        ],
      }
    }

    if (lastOperatorBackfill) {
      const growthDelta = lastOperatorBackfill.growth_delta
      const failed =
        mailboxIndexHealth.execution_state === 'failed' ||
        Boolean(lastOperatorBackfill.failure_reason) ||
        (typeof lastOperatorBackfill.status === 'string' &&
          (lastOperatorBackfill.status.includes('failed') ||
            lastOperatorBackfill.status.includes('out_of_date') ||
            lastOperatorBackfill.status.includes('listing_failed')))
      const pausedAtLimit = lastOperatorBackfill.terminal_reason === 'requested_limit_reached'
      const stoppedByPagination =
        lastOperatorBackfill.terminal_reason === 'gmail_pagination_exhausted' ||
        lastOperatorBackfill.terminal_reason === 'empty_page'
      const completedWithNoGrowth =
        !failed && !pausedAtLimit && !stoppedByPagination && (typeof growthDelta === 'number' ? growthDelta <= 0 : false)
      const resumedFromCheckpoint = lastOperatorBackfill.started_from_checkpoint === true
      const startModeLine = resumedFromCheckpoint
        ? 'Start mode: Resumed historical backfill from saved checkpoint.'
        : 'Start mode: Fresh historical backfill started.'

      return {
        tone: failed
          ? ('rose' as const)
          : pausedAtLimit || stoppedByPagination
            ? ('amber' as const)
            : completedWithNoGrowth
              ? ('gray' as const)
              : ('emerald' as const),
        title: failed
          ? 'Historical backfill failed'
          : pausedAtLimit
            ? 'Historical backfill paused at limit'
            : stoppedByPagination
              ? 'Historical backfill finished available history'
              : completedWithNoGrowth
                ? 'Historical backfill completed with no growth'
                : resumedFromCheckpoint
                  ? 'Historical backfill continued successfully'
                  : 'Historical backfill completed with growth',
        lines: [
          ...baseLines,
          `Run id: ${lastOperatorBackfill.run_id || '—'}`,
          `Rows: ${formatMailboxIndexCount(lastOperatorBackfill.rows_before)} -> ${formatMailboxIndexCount(
            lastOperatorBackfill.rows_after
          )} (${typeof growthDelta === 'number' ? `${growthDelta >= 0 ? '+' : ''}${formatMailboxIndexCount(growthDelta)}` : '—'})`,
          `Requested/effective mode: ${lastOperatorBackfill.requested_mode || '—'} / ${
            lastOperatorBackfill.effective_mode || lastOperatorBackfill.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(lastOperatorBackfill.trigger)}`,
          startModeLine,
          `Completed: ${formatMailboxIndexDateTime(lastOperatorBackfill.completed_at)}`,
          `Stop reason: ${lastOperatorBackfill.terminal_reason || '—'}`,
          ...mailboxIndexBackfillTargetLines({
            windowMonths: lastOperatorBackfill.backfill_window_months,
            cutoffAt: lastOperatorBackfill.backfill_cutoff_at,
          }),
          ...(typeof lastOperatorBackfill.processed_messages === 'number'
            ? [`Messages processed: ${formatMailboxIndexCount(lastOperatorBackfill.processed_messages)}`]
            : []),
          ...(typeof lastOperatorBackfill.list_pages_fetched === 'number'
            ? [`List pages fetched: ${formatMailboxIndexCount(lastOperatorBackfill.list_pages_fetched)}`]
            : []),
          ...mailboxIndexResumeCheckpointLines(lastOperatorBackfill.resume_checkpoint),
          ...mailboxIndexYieldLines(lastOperatorBackfill.yield_detail),
          ...(typeof lastOperatorBackfill.gmail_result_size_estimate === 'number'
            ? [`Gmail estimate: ${formatMailboxIndexCount(lastOperatorBackfill.gmail_result_size_estimate)}`]
            : []),
          ...(pausedAtLimit
            ? [
                'Resume checkpoint saved.',
                'Safe to continue with Continue Backfill.',
              ]
            : []),
          ...(lastOperatorBackfill.failure_reason
            ? [`Failure: ${lastOperatorBackfill.failure_reason}`]
            : []),
          ...(mailboxIndexHealth.last_sync_error
            ? [`Error: ${mailboxIndexHealth.last_sync_error}`]
            : []),
        ],
      }
    }

    if (lastSmartMailboxSync) {
      const growthDelta = lastSmartMailboxSync.growth_delta
      const failed =
        mailboxIndexHealth.execution_state === 'failed' ||
        Boolean(lastSmartMailboxSync.failure_reason) ||
        (typeof lastSmartMailboxSync.status === 'string' &&
          (lastSmartMailboxSync.status.includes('failed') ||
            lastSmartMailboxSync.status.includes('out_of_date') ||
            lastSmartMailboxSync.status.includes('listing_failed')))
      const stoppedByPagination =
        lastSmartMailboxSync.terminal_reason === 'gmail_pagination_exhausted' ||
        lastSmartMailboxSync.terminal_reason === 'empty_page'
      const completedWithNoGrowth =
        !failed && !stoppedByPagination && (typeof growthDelta === 'number' ? growthDelta <= 0 : false)
      const resumedFromCheckpoint =
        lastSmartMailboxSync.requested_mode === 'full' && lastSmartMailboxSync.effective_mode === 'full'

      return {
        tone: failed
          ? ('rose' as const)
          : stoppedByPagination
            ? ('amber' as const)
            : completedWithNoGrowth
              ? ('gray' as const)
              : ('emerald' as const),
        title: failed
          ? 'Smart Sync failed'
          : stoppedByPagination
            ? 'Smart Sync stopped because Gmail returned no more pages'
            : completedWithNoGrowth
              ? 'Smart Sync completed with no growth'
              : resumedFromCheckpoint
                ? 'Smart Sync completed after checkpoint resume'
                : 'Smart Sync completed incrementally',
        lines: [
          ...baseLines,
          `Run id: ${lastSmartMailboxSync.run_id || '—'}`,
          `Rows: ${formatMailboxIndexCount(lastSmartMailboxSync.rows_before)} -> ${formatMailboxIndexCount(
            lastSmartMailboxSync.rows_after
          )} (${typeof growthDelta === 'number' ? `${growthDelta >= 0 ? '+' : ''}${formatMailboxIndexCount(growthDelta)}` : '—'})`,
          `Requested/effective mode: ${lastSmartMailboxSync.requested_mode || '—'} / ${
            lastSmartMailboxSync.effective_mode || lastSmartMailboxSync.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(lastSmartMailboxSync.trigger)}`,
          `Completed: ${formatMailboxIndexDateTime(lastSmartMailboxSync.completed_at)}`,
          `Stop reason: ${lastSmartMailboxSync.terminal_reason || '—'}`,
          ...(typeof lastSmartMailboxSync.processed_messages === 'number'
            ? [`Messages processed: ${formatMailboxIndexCount(lastSmartMailboxSync.processed_messages)}`]
            : []),
          ...(typeof lastSmartMailboxSync.list_pages_fetched === 'number'
            ? [`List pages fetched: ${formatMailboxIndexCount(lastSmartMailboxSync.list_pages_fetched)}`]
            : []),
          ...mailboxIndexResumeCheckpointLines(lastSmartMailboxSync.resume_checkpoint),
          ...mailboxIndexYieldLines(lastSmartMailboxSync.yield_detail),
          ...(typeof lastSmartMailboxSync.gmail_result_size_estimate === 'number'
            ? [`Gmail estimate: ${formatMailboxIndexCount(lastSmartMailboxSync.gmail_result_size_estimate)}`]
            : []),
          ...(lastSmartMailboxSync.failure_reason ? [`Failure: ${lastSmartMailboxSync.failure_reason}`] : []),
          ...(mailboxIndexHealth.last_sync_error ? [`Error: ${mailboxIndexHealth.last_sync_error}`] : []),
        ],
      }
    }

    if (lastManualMailboxReindex) {
      const growthDelta = lastManualMailboxReindex.growth_delta
      const failed =
        mailboxIndexHealth.execution_state === 'failed' ||
        Boolean(lastManualMailboxReindex.failure_reason) ||
        (typeof lastManualMailboxReindex.status === 'string' &&
          (lastManualMailboxReindex.status.includes('failed') ||
            lastManualMailboxReindex.status.includes('out_of_date') ||
            lastManualMailboxReindex.status.includes('listing_failed')))
      const stoppedByPagination =
        lastManualMailboxReindex.terminal_reason === 'gmail_pagination_exhausted' ||
        lastManualMailboxReindex.terminal_reason === 'empty_page'
      const completedWithNoGrowth =
        !failed && !stoppedByPagination && (typeof growthDelta === 'number' ? growthDelta <= 0 : false)

      return {
        tone: failed ? ('rose' as const) : stoppedByPagination ? ('amber' as const) : completedWithNoGrowth ? ('gray' as const) : ('emerald' as const),
        title: failed
          ? 'Reindex failed'
          : stoppedByPagination
            ? 'Stopped because Gmail returned no more pages'
            : completedWithNoGrowth
              ? 'Completed with no growth'
              : 'Completed with growth',
        lines: [
          ...baseLines,
          `Run id: ${lastManualMailboxReindex.run_id || '—'}`,
          `Rows: ${formatMailboxIndexCount(lastManualMailboxReindex.rows_before)} -> ${formatMailboxIndexCount(
            lastManualMailboxReindex.rows_after
          )} (${typeof growthDelta === 'number' ? `${growthDelta >= 0 ? '+' : ''}${formatMailboxIndexCount(growthDelta)}` : '—'})`,
          `Requested/effective mode: ${lastManualMailboxReindex.requested_mode || '—'} / ${
            lastManualMailboxReindex.effective_mode || lastManualMailboxReindex.mode || '—'
          }`,
          `Trigger: ${mailboxIndexTriggerLabel(lastManualMailboxReindex.trigger)}`,
          `Completed: ${formatMailboxIndexDateTime(lastManualMailboxReindex.completed_at)}`,
          `Stop reason: ${lastManualMailboxReindex.terminal_reason || '—'}`,
          ...(typeof lastManualMailboxReindex.gmail_result_size_estimate === 'number'
            ? [`Gmail estimate: ${formatMailboxIndexCount(lastManualMailboxReindex.gmail_result_size_estimate)}`]
            : []),
          ...(typeof lastManualMailboxReindex.list_pages_fetched === 'number'
            ? [`List pages fetched: ${formatMailboxIndexCount(lastManualMailboxReindex.list_pages_fetched)}`]
            : []),
          ...mailboxIndexResumeCheckpointLines(lastManualMailboxReindex.resume_checkpoint),
          ...mailboxIndexYieldLines(lastManualMailboxReindex.yield_detail),
          ...(lastManualMailboxReindex.failure_reason
            ? [`Failure: ${lastManualMailboxReindex.failure_reason}`]
            : []),
          ...(mailboxIndexHealth.last_sync_error
            ? [`Error: ${mailboxIndexHealth.last_sync_error}`]
            : []),
        ],
      }
    }

    return {
      tone: mailboxIndexReconnectBlocked ? ('rose' as const) : ('gray' as const),
      title: mailboxIndexReconnectBlocked
        ? 'Reconnect Gmail to run Smart Sync or Continue Backfill'
        : 'No mailbox index operator run started yet',
      lines: [
        ...baseLines,
        mailboxIndexReconnectBlocked
          ? 'Mailbox indexing is blocked until Gmail is reconnected.'
          : 'Use Smart Sync for daily updates, Continue Backfill for unfinished history, or Run full mailbox reindex for an explicit restart.',
      ],
    }
  }, [
    activeOperatorBackfill,
    activeManualMailboxReindex,
    pendingSmartMailboxSyncRun,
    pendingOperatorBackfillRun,
    activeSmartMailboxSync,
    lastOperatorBackfill,
    lastManualMailboxReindex,
    lastSmartMailboxSync,
    historicalBackfill,
    mailboxIndexHealth,
    mailboxIndexReconnectBlocked,
    runtime.manualMailboxReindexStarting,
    runtime.operatorMailboxBackfillStarting,
    runtime.smartMailboxSyncStarting,
  ])

  const triggerManualMailboxReindex = async () => {
    setMailboxIndexNotice(null)
    const result = await runtime.triggerManualFullMailboxReindex()
    if (result.ok) {
      setMailboxIndexNotice(
        result.attached
          ? {
              tone: 'info',
              text: 'A mailbox index run is already in progress. Showing its live mailbox-index state below.',
            }
          : {
              tone: 'info',
              text: 'Manual full mailbox reindex finished. The latest mailbox-index result is shown below.',
            }
      )
    } else {
      setMailboxIndexNotice({ tone: 'error', text: result.error })
    }
  }

  const triggerSmartSync = async () => {
    setMailboxIndexNotice(null)
    const result = await runtime.triggerSmartMailboxSync()
    if (result.ok) {
      setMailboxIndexNotice(
        result.attached
          ? {
              tone: 'info',
              text: 'A mailbox index run is already in progress. Showing its live mailbox-index state below.',
            }
          : {
              tone: 'info',
              text: 'Smart Sync accepted. Live mailbox-index state is shown below.',
            }
      )
    } else {
      setMailboxIndexNotice({ tone: 'error', text: result.error })
    }
  }

  const triggerMailboxBackfill = async () => {
    setMailboxIndexNotice(null)
    const result = await runtime.triggerMailboxBackfill()
    if (result.ok) {
      setMailboxIndexNotice(
        result.completed
          ? {
              tone: 'info',
              text:
                result.backfillWindowMonths === 36
                  ? 'Historical backfill complete for extended 36-month window. Smart Sync will maintain new activity going forward.'
                  : 'Historical backfill complete for recent 24-month window. Smart Sync will maintain new activity going forward.',
            }
          : result.attached
          ? {
              tone: 'info',
              text: 'A mailbox index run is already in progress. Showing its live mailbox-index state below.',
            }
          : {
              tone: 'info',
              text: 'Continue Backfill accepted. Live mailbox-index state is shown below.',
            }
      )
    } else {
      setMailboxIndexNotice({ tone: 'error', text: result.error })
    }
  }

  const triggerMailboxBackfillExtended = async () => {
    setMailboxIndexNotice(null)
    const result = await runtime.triggerMailboxBackfillExtended()
    if (result.ok) {
      setMailboxIndexNotice(
        result.completed
          ? {
              tone: 'info',
              text:
                'Historical backfill complete for extended 36-month window. Smart Sync will maintain new activity going forward.',
            }
          : result.attached
            ? {
                tone: 'info',
                text: 'A mailbox index run is already in progress. Showing its live mailbox-index state below.',
              }
            : {
                tone: 'info',
                text: 'Continue Backfill (36m) accepted. Live mailbox-index state is shown below.',
              }
      )
    } else {
      setMailboxIndexNotice({ tone: 'error', text: result.error })
    }
  }

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
    <div className={shellGridClassName}>
      <aside className={leftRailClassName}>
        <div className="space-y-2.5 pb-3.5 border-b border-slate-500/30">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300">Operations Workspace</p>
          <p className="text-[11px] leading-snug text-slate-200">
            Session-scoped operator workflow for sender-first cleanup, destination management, and secondary audit access.
          </p>
          <div className="app-surface-rail-card space-y-1.5 rounded-xl p-2.5">
            <p className="text-[9px] uppercase tracking-wide text-slate-300">
              {analysisWindowControlLabel}
            </p>
            <p className="text-[10px] leading-5 text-slate-300">{analysisWindowHelperText}</p>
            <select
              value={visibleAnalysisScope}
              onChange={(event) =>
                void updateAnalysisScope(
                  normalizeOperationsAnalysisScope(event.target.value)
                )
              }
              disabled={scopeUpdating}
              className={railInputClass}
            >
              {OPERATIONS_ANALYSIS_SCOPE_OPTIONS.map((scope) => (
                <option key={scope} value={scope}>
                  {analysisScopeControlLabel(scope)}
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
            <p className="text-[10px] text-amber-200/90">
              Refreshing cleanup analysis does not increase indexed mailbox coverage.
            </p>
            <button
              type="button"
              onClick={() => void triggerSmartSync()}
              disabled={mailboxIndexActionDisabled}
              className={`w-full rounded px-2 py-1.5 text-xs font-medium ${
                mailboxIndexActionDisabled
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-sky-700 hover:bg-sky-600 text-white'
              }`}
            >
              {runtime.smartMailboxSyncStarting ? 'Starting Smart Sync…' : 'Smart Sync'}
            </button>
            {showDefaultContinueBackfillButton ? (
              <button
                type="button"
                onClick={() => void triggerMailboxBackfill()}
                disabled={mailboxIndexActionDisabled}
                className={`w-full rounded px-2 py-1.5 text-xs font-medium ${
                  mailboxIndexActionDisabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-700 hover:bg-amber-600 text-white'
                }`}
              >
                {runtime.operatorMailboxBackfillStarting
                  ? 'Starting Continue Backfill…'
                  : 'Continue Backfill'}
              </button>
            ) : null}
            {showExtendedContinueBackfillButton ? (
              <button
                type="button"
                onClick={() => void triggerMailboxBackfillExtended()}
                disabled={mailboxIndexActionDisabled}
                className={`w-full rounded px-2 py-1.5 text-xs font-medium ${
                  mailboxIndexActionDisabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-900 hover:bg-amber-800 text-white'
                }`}
              >
                {runtime.operatorMailboxBackfillStarting
                  ? 'Starting Continue Backfill (36m)…'
                  : 'Continue Backfill (36m)'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void triggerManualMailboxReindex()}
              disabled={mailboxIndexActionDisabled}
              className={`w-full rounded px-2 py-1.5 text-xs font-medium ${
                mailboxIndexActionDisabled
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              {runtime.manualMailboxReindexStarting ? 'Starting full mailbox reindex…' : 'Run full mailbox reindex'}
            </button>
            <p className="text-[10px] text-slate-300">
              {reviewSupportsDetachedScope ? 'Workflow scope view' : 'View'}:{' '}
              {analysisScopeLabel(visibleAnalysisScope)} · Last refresh:{' '}
              {runtime.loadedAt ? new Date(runtime.loadedAt).toLocaleTimeString() : '—'}
            </p>
            {detachedReviewWorkflowScope ? (
              <p className="text-[10px] text-slate-300">
                Runtime baseline: {analysisScopeLabel(props.analysisScope)} · Workflow scope
                switching stays inside the current review page while chart compare windows stay
                separate in Time Context.
              </p>
            ) : null}
            <p className="text-[10px] text-slate-300">
              Effective discovery window:{' '}
              {effectiveDiscoveryWindow === 'all_indexed'
                ? 'all indexed'
                : typeof effectiveDiscoveryWindow === 'number'
                  ? `${effectiveDiscoveryWindow}d`
                  : '—'}
            </p>
            <p className="text-[10px] text-slate-300">
              Last regenerated: {lastRegeneratedAt ? new Date(lastRegeneratedAt).toLocaleTimeString() : '—'}
            </p>
            {runtime.lastRefreshReason ? (
              <p className="text-[10px] text-slate-300">Reason: {runtime.lastRefreshReason}</p>
            ) : null}
            {regenerationStatusNote ? (
              <p className="text-[10px] text-cyan-300">{regenerationStatusNote}</p>
            ) : null}
            {runtime.refreshing ? (
              <p className="text-[10px] text-cyan-300">
                Refreshing cleanup analysis in the background. Current cleanup groups stay visible until the new results are ready.
              </p>
            ) : null}
            <div className={railInsetPanelClass}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Mailbox index</p>
              <p
                className={`text-[11px] font-medium ${
                  mailboxIndexStatus.tone === 'cyan'
                    ? 'text-cyan-300'
                    : mailboxIndexStatus.tone === 'emerald'
                      ? 'text-emerald-300'
                      : mailboxIndexStatus.tone === 'amber'
                        ? 'text-amber-300'
                        : mailboxIndexStatus.tone === 'rose'
                          ? 'text-rose-300'
                          : 'text-slate-200'
                }`}
              >
                {mailboxIndexStatus.title}
              </p>
              {mailboxIndexStatus.lines.map((line, index) => (
                <p key={`${index}-${line}`} className="text-[10px] leading-snug text-slate-300">
                  {line}
                </p>
              ))}
              {blockingMailboxIndexRun ? (
                <p className="text-[10px] leading-snug text-amber-300">
                  Another mailbox index run is already active: {blockingMailboxIndexRun.requested_mode || '—'} /{' '}
                  {mailboxIndexTriggerLabel(blockingMailboxIndexRun.trigger)}. Mailbox index actions will unlock when it finishes.
                </p>
              ) : null}
              {mailboxIndexReconnectBlocked ? (
                <p className="text-[10px] leading-snug text-rose-300">
                  Reconnect Gmail before running Smart Sync, Continue Backfill, or a manual full mailbox reindex.
                </p>
              ) : null}
              {mailboxIndexNotice ? (
                <p
                  className={`text-[10px] leading-snug ${
                    mailboxIndexNotice.tone === 'error' ? 'text-rose-300' : 'text-cyan-300'
                  }`}
                >
                  {mailboxIndexNotice.text}
                </p>
              ) : null}
            </div>
          </div>
          <div className="app-surface-rail-card rounded-xl px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">Control center</p>
            <p className="text-[11px] leading-relaxed text-slate-200">
              Management is now the primary control center for committed sender states, execution truth, and undo. Pending Approvals and History remain available below as legacy audit routes only.
            </p>
          </div>
        </div>

        <div className="pt-3.5 space-y-4">
          {(['workflow', 'queue', 'tooling'] as const).map((section) => (
            <div key={section} className="space-y-2">
              <p className="px-1 text-[10px] uppercase tracking-wide text-slate-300">
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
                            active ? 'text-cyan-100' : 'text-slate-100 group-hover:text-cyan-200'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-[11px] leading-relaxed break-words text-slate-300">
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

      <section className={centerFrameClassName}>{props.children}</section>

      <aside className={assistantRailClassName}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-cyan-300">AI Assistant</p>
            <p className="text-[11px] text-slate-200">Contextual help (secondary)</p>
          </div>
          {runtime.refreshing ? (
            <span className="text-[10px] text-cyan-300">Syncing…</span>
          ) : runtime.error ? (
            <span className="text-[10px] text-rose-300">Sync issue</span>
          ) : null}
        </div>
        <div className="app-surface-rail-card flex-1 overflow-y-auto rounded-xl p-2.5 space-y-2">
          {assistantMessages.length === 0 ? (
            <p className="text-xs italic text-slate-300">
              Use the suggested prompts for this page, or ask any context-specific question.
            </p>
          ) : (
            assistantMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-lg px-2.5 py-2 text-xs whitespace-pre-wrap shadow-[0_8px_18px_rgba(2,6,23,0.12)] ${
                    message.role === 'user'
                      ? 'border border-cyan-600/35 bg-cyan-800/80 text-white'
                      : 'border border-slate-400/30 bg-[linear-gradient(180deg,rgba(26,35,49,0.98),rgba(16,22,33,0.98))] text-slate-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="app-surface-rail-card rounded-xl p-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-300">Suggested prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setAssistantInput(prompt)}
                className={railPromptChipClass}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <div className="app-surface-rail-card flex gap-2 rounded-xl p-2.5">
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
            className="app-surface-rail-inset flex-1 rounded-lg px-2.5 py-2 text-xs text-white"
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
  const reviewStage = pathname.includes('/operations/review')
    ? searchParams.get('mode') || 'overview'
    : searchParams.get('mode') || searchParams.get('stage')
  const preferredClusterId =
    pathname.includes('/operations/review') && typeof clusterId === 'string' && clusterId.trim()
      ? clusterId.trim()
      : null

  return (
    <OperationsRuntimeProvider
      agentId={agentId}
      sessionId={sessionId}
      analysisScope={analysisScope}
      preferredClusterId={preferredClusterId}
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
