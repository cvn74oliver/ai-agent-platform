'use client'

import { startTransition, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ConfirmationStage,
  DeferredStagePlaceholder,
  GmailScopeLadder,
  SenderDecisionStage,
  StageNavigation,
} from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  fetchGmailConfirmationPreview,
  fetchGmailSenderWorkspace,
  GMAIL_CLEANUP_STAGES,
  gmailCleanupWorkflowDraftStorageKey,
  persistGmailCleanupMemoryEvent,
  readCachedGmailSenderWorkspace,
  readGmailCleanupWorkflowDraft,
  writeGmailCleanupWorkflowDraft,
  type GmailCleanupRuleIntent,
  type GmailCleanupStage,
  type GmailCleanupWorkflowDraft,
  type GmailSenderPolicy,
  type GmailSenderWorkspaceFilter,
  type GmailSenderWorkspaceSort,
  type GmailSenderWorkspaceSortDirection,
  type GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  fetchOperationsMessageSnippets,
  fetchOperationsMessagePreview,
  serializeOperationsQuery,
  type OperationsMessagePreviewData,
} from '@/lib/runtime/operationsWorkspace'

type SenderWorkspaceLoadState =
  | {
      status: 'idle' | 'loading' | 'ready' | 'error'
      data: GmailSenderWorkspaceData | null
      error: string | null
      refreshing: boolean
    }

type MessagePreviewState =
  | { status: 'idle'; open: false; message: null; targetMessageId: null; error: null }
  | { status: 'loading'; open: true; message: null; targetMessageId: string; error: null }
  | { status: 'ready'; open: true; message: OperationsMessagePreviewData; targetMessageId: string; error: null }
  | { status: 'error'; open: true; message: null; targetMessageId: string; error: string }

function normalizeStage(value: string | null): GmailCleanupStage {
  return GMAIL_CLEANUP_STAGES.includes(value as GmailCleanupStage)
    ? (value as GmailCleanupStage)
    : 'senders'
}

function normalizeSenderFilter(value: string | null): GmailSenderWorkspaceFilter {
  return value === 'needs_verification' ||
    value === 'protected' ||
    value === 'likely_machine_generated' ||
    value === 'likely_human'
    ? value
    : 'all'
}

function normalizeSenderSort(value: string | null): GmailSenderWorkspaceSort {
  return value === 'sender' || value === 'unread_count' || value === 'last_activity'
    ? value
    : 'message_count'
}

function normalizeSenderDirection(value: string | null): GmailSenderWorkspaceSortDirection {
  return value === 'asc' ? 'asc' : 'desc'
}

function emptyDraft(stage: GmailCleanupStage): GmailCleanupWorkflowDraft {
  return {
    senderPolicies: {},
    messageOverrides: {},
    ruleIntents: [],
    currentStage: stage,
    confirmationPreview: null,
    updatedAt: Date.now(),
  }
}

function ruleIntentFromPolicy(
  senderKey: string,
  sender: string,
  policy: GmailSenderPolicy
): GmailCleanupRuleIntent | null {
  if (policy === 'keep') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'keep',
      label: `Always keep ${sender}`,
      description: `Learn a future rule that keeps ${sender} visible in the inbox.`,
    }
  }
  if (policy === 'quarantine') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'quarantine',
      label: `Quarantine ${sender}`,
      description: `Store ${sender} as a future quarantine policy. No live Gmail mutation happens in this pass.`,
    }
  }
  if (policy === 'unsubscribe') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'unsubscribe',
      label: `Unsubscribe intent for ${sender}`,
      description: `Record ${sender} as a future unsubscribe automation intent.`,
    }
  }
  if (policy === 'custom_rule') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'custom_rule',
      label: `Custom rule for ${sender}`,
      description: `Store a custom future automation rule for ${sender}.`,
    }
  }
  return null
}

export default function OperationsReviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)
  const runtimeClusters = useMemo(
    () => runtime.data?.runtime_cleanup_plan?.clusters || [],
    [runtime.data?.runtime_cleanup_plan?.clusters]
  )
  const clusterId = searchParams.get('cluster_id')
  const stage = normalizeStage(searchParams.get('stage'))
  const senderPage = Math.max(1, Number.parseInt(searchParams.get('sender_page') || '1', 10) || 1)
  const senderSearch = searchParams.get('sender_search') || ''
  const senderFilter = normalizeSenderFilter(searchParams.get('sender_filter'))
  const senderSort = normalizeSenderSort(searchParams.get('sender_sort'))
  const senderDirection = normalizeSenderDirection(searchParams.get('sender_direction'))
  const selectedClusterFromUrl =
    clusterId ? runtimeClusters.find((cluster) => cluster.cluster_id === clusterId) || null : null
  const clusterSelectionNeedsResolution =
    runtimeClusters.length > 0 && !selectedClusterFromUrl && (!clusterId || clusterId.trim().length > 0)
  const selectedCluster = clusterSelectionNeedsResolution
    ? null
    : selectedClusterFromUrl || runtimeClusters[0] || null
  const cacheVersion = runtime.data?.runtime_cleanup_plan?.generated_at || null
  const allClusters = useMemo(
    () =>
      runtimeClusters.map((cluster) => ({
        clusterId: cluster.cluster_id,
        clusterType: cluster.cluster_type,
        title: cluster.title,
        query: cluster.query,
        whySelected: cluster.why_selected,
        riskNote: cluster.risk_note,
        safetyNote: cluster.safety_note,
      })),
    [runtimeClusters]
  )

  const cachedWorkspace = useMemo(
    () =>
      selectedCluster
        ? readCachedGmailSenderWorkspace({
            selectedCluster: {
              clusterId: selectedCluster.cluster_id,
              clusterType: selectedCluster.cluster_type,
              title: selectedCluster.title,
              query: selectedCluster.query,
              whySelected: selectedCluster.why_selected,
              riskNote: selectedCluster.risk_note,
              safetyNote: selectedCluster.safety_note,
            },
            allClusters,
            analysisScope: runtime.analysisScope,
            cacheVersion,
            page: senderPage,
            pageSize: 10,
            search: senderSearch,
            filter: senderFilter,
            sort: senderSort,
            direction: senderDirection,
          })
        : null,
    [
      allClusters,
      cacheVersion,
      runtime.analysisScope,
      selectedCluster,
      senderDirection,
      senderFilter,
      senderPage,
      senderSearch,
      senderSort,
    ]
  )

  const [workspaceState, setWorkspaceState] = useState<SenderWorkspaceLoadState>(() =>
    cachedWorkspace
      ? {
          status: 'ready',
          data: cachedWorkspace,
          error: null,
          refreshing: false,
        }
      : {
          status: 'idle',
          data: null,
          error: null,
          refreshing: false,
        }
  )
  const [draft, setDraft] = useState<GmailCleanupWorkflowDraft>(() => emptyDraft(stage))
  const [openSenderKey, setOpenSenderKey] = useState<string | null>(null)
  const [messagePreview, setMessagePreview] = useState<MessagePreviewState>({
    status: 'idle',
    open: false,
    message: null,
    targetMessageId: null,
    error: null,
  })
  const [snippetOverrides, setSnippetOverrides] = useState<Record<string, string>>({})
  const [snippetLoadingSenderKey, setSnippetLoadingSenderKey] = useState<string | null>(null)
  const [snippetLoadedSenders, setSnippetLoadedSenders] = useState<Record<string, true>>({})
  const [creatingApproval, setCreatingApproval] = useState(false)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [hydratedDraftStorageKey, setHydratedDraftStorageKey] = useState<string | null>(null)

  const sessionId = runtime.sessionId || requestedSessionId
  const currentDraftStorageKey =
    selectedCluster && agentId
      ? gmailCleanupWorkflowDraftStorageKey({
          agentId,
          sessionId,
          clusterId: selectedCluster.cluster_id,
        })
      : null

  useEffect(() => {
    if (runtimeClusters.length === 0 || (clusterId && selectedClusterFromUrl)) return

    let recommendedClusterId = runtimeClusters[0]?.cluster_id || null
    let latestDraftUpdatedAt = -1
    for (const cluster of runtimeClusters) {
      const stored = readGmailCleanupWorkflowDraft({
        agentId,
        sessionId,
        clusterId: cluster.cluster_id,
        snapshotVersion: cacheVersion,
      })
      if (!stored) continue
      if (
        stored.updatedAt > latestDraftUpdatedAt &&
        (Object.keys(stored.senderPolicies).length > 0 ||
          stored.currentStage === 'confirmation' ||
          stored.confirmationPreview != null)
      ) {
        latestDraftUpdatedAt = stored.updatedAt
        recommendedClusterId = cluster.cluster_id
      }
    }

    if (!recommendedClusterId) return
    const next = new URLSearchParams(searchParams.toString())
    next.set('cluster_id', recommendedClusterId)
    next.set('stage', stage)
    if (!next.get('sender_page')) next.set('sender_page', '1')
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false })
    })
  }, [
    agentId,
    cacheVersion,
    clusterId,
    router,
    runtimeClusters,
    searchParams,
    selectedClusterFromUrl,
    sessionId,
    stage,
  ])

  useEffect(() => {
    if (!selectedCluster) return
    setHydratedDraftStorageKey(null)
    const stored =
      readGmailCleanupWorkflowDraft({
        agentId,
        sessionId,
        clusterId: selectedCluster.cluster_id,
        snapshotVersion: cacheVersion,
      }) || emptyDraft(stage)
    setDraft({
      ...stored,
      currentStage: stage,
      snapshotVersion: cacheVersion,
    })
    setHydratedDraftStorageKey(
      gmailCleanupWorkflowDraftStorageKey({
        agentId,
        sessionId,
        clusterId: selectedCluster.cluster_id,
      })
    )
  }, [agentId, cacheVersion, selectedCluster, sessionId, stage])

  useEffect(() => {
    if (!selectedCluster) return
    if (!currentDraftStorageKey || hydratedDraftStorageKey !== currentDraftStorageKey) return
    writeGmailCleanupWorkflowDraft(
      {
        agentId,
        sessionId,
        clusterId: selectedCluster.cluster_id,
        snapshotVersion: cacheVersion,
      },
      draft
    )
  }, [
    agentId,
    cacheVersion,
    currentDraftStorageKey,
    draft,
    hydratedDraftStorageKey,
    selectedCluster,
    sessionId,
  ])

  useEffect(() => {
    if (!selectedCluster) return
    if (cachedWorkspace) {
      setWorkspaceState({
        status: 'ready',
        data: cachedWorkspace,
        error: null,
        refreshing: false,
      })
      return
    }

    let cancelled = false
    const controller = new AbortController()
    setWorkspaceState((current) => {
      const sameCluster =
        current.data?.selected_cluster.cluster_id === selectedCluster.cluster_id
      if (sameCluster && current.data) {
        return {
          status: 'ready',
          data: current.data,
          error: null,
          refreshing: true,
        }
      }
      return {
        status: 'loading',
        data: null,
        error: null,
        refreshing: false,
      }
    })
    void fetchGmailSenderWorkspace({
      selectedCluster: {
        clusterId: selectedCluster.cluster_id,
        clusterType: selectedCluster.cluster_type,
        title: selectedCluster.title,
        query: selectedCluster.query,
        whySelected: selectedCluster.why_selected,
        riskNote: selectedCluster.risk_note,
        safetyNote: selectedCluster.safety_note,
      },
      allClusters,
      analysisScope: runtime.analysisScope,
      cacheVersion,
      page: senderPage,
      pageSize: 10,
      search: senderSearch,
      filter: senderFilter,
      sort: senderSort,
      direction: senderDirection,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_workspace',
        reason: 'sender_first_workspace',
        phase:
          senderPage > 1 || Boolean(senderSearch) || senderFilter !== 'all' || senderSort !== 'message_count' || senderDirection !== 'desc'
            ? 'interactive'
            : 'initial_paint',
      },
      signal: controller.signal,
    }).then((result) => {
      if (cancelled) return
      if (!result.ok && result.aborted) return
      if (!result.ok) {
        setWorkspaceState((current) => ({
          status: current.data ? 'error' : 'error',
          data: current.data,
          error: result.error,
          refreshing: false,
        }))
        return
      }
      setWorkspaceState({ status: 'ready', data: result.data, error: null, refreshing: false })
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    allClusters,
    cacheVersion,
    cachedWorkspace,
    runtime.analysisScope,
    selectedCluster,
    senderDirection,
    senderFilter,
    senderPage,
    senderSearch,
    senderSort,
  ])

  useEffect(() => {
    if (workspaceState.status !== 'ready' || !workspaceState.data || !openSenderKey) return
    if (snippetLoadedSenders[openSenderKey]) return

    const sender = workspaceState.data.senders.find((entry) => entry.sender_key === openSenderKey)
    if (!sender) return

    const messageIds = sender.preview_messages
      .filter((message) => {
        const snippet = message.snippet?.trim().toLowerCase() || ''
        const subject = message.subject?.trim().toLowerCase() || ''
        return !snippet || snippet === subject
      })
      .map((message) => message.message_id)

    if (messageIds.length === 0) {
      setSnippetLoadedSenders((current) => ({ ...current, [openSenderKey]: true }))
      return
    }

    let cancelled = false
    setSnippetLoadingSenderKey(openSenderKey)
    void fetchOperationsMessageSnippets({
      messageIds,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_evidence_snippets',
        reason: 'visible_sender_preview_enrichment',
        phase: 'interactive',
      },
    }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setSnippetOverrides((current) => {
          const next = { ...current }
          for (const message of result.data.messages) {
            if (message.snippet) next[message.message_id] = message.snippet
          }
          return next
        })
      }
      setSnippetLoadedSenders((current) => ({ ...current, [openSenderKey]: true }))
      setSnippetLoadingSenderKey((current) => (current === openSenderKey ? null : current))
    })

    return () => {
      cancelled = true
    }
  }, [openSenderKey, snippetLoadedSenders, workspaceState])

  useEffect(() => {
    let cancelled = false
    if (
      stage !== 'confirmation' ||
      !selectedCluster ||
      workspaceState.status !== 'ready'
    ) {
      return
    }

    void fetchGmailConfirmationPreview({
      selectedCluster: {
        clusterId: selectedCluster.cluster_id,
        clusterType: selectedCluster.cluster_type,
        title: selectedCluster.title,
        query: selectedCluster.query,
      },
      allClusters,
      analysisScope: runtime.analysisScope,
      cacheVersion,
      senderPolicies: draft.senderPolicies,
      messageOverrides: draft.messageOverrides,
      requestContext: {
        source: 'operations_review_page',
        component: 'confirmation_preview',
        reason: 'exact_impact',
        phase: 'interactive',
      },
    }).then((result) => {
      if (cancelled || !result.ok) return
      setDraft((current) => ({
        ...current,
        confirmationPreview: result.data,
        updatedAt: Date.now(),
      }))
    })

    return () => {
      cancelled = true
    }
  }, [
    allClusters,
    cacheVersion,
    draft.messageOverrides,
    draft.senderPolicies,
    runtime.analysisScope,
    selectedCluster,
    stage,
    workspaceState.status,
  ])

  const updateSearch = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === '') next.delete(key)
      else next.set(key, value)
    }
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false })
    })
  }

  const displayWorkspaceData =
    workspaceState.data
      ? {
          ...workspaceState.data,
          senders: workspaceState.data.senders.map((sender) => ({
            ...sender,
            preview_messages: sender.preview_messages.map((message) => ({
              ...message,
              snippet: snippetOverrides[message.message_id] || message.snippet,
            })),
          })),
        }
      : null
  const deferredStage =
    stage === 'exceptions' || stage === 'rules' || stage === 'monitoring' ? stage : null

  const buildStageHref = (nextStage: GmailCleanupStage) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('stage', nextStage)
    if (selectedCluster?.cluster_id) next.set('cluster_id', selectedCluster.cluster_id)
    return `?${next.toString()}`
  }

  const handleOpenMessage = async (messageId: string) => {
    setMessagePreview({
      status: 'loading',
      open: true,
      message: null,
      targetMessageId: messageId,
      error: null,
    })
    const preview = await fetchOperationsMessagePreview({
      messageId,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_evidence_drawer',
        reason: 'message_drilldown',
        phase: 'interactive',
      },
    })
    if (!preview.ok) {
      setMessagePreview({
        status: 'error',
        open: true,
        message: null,
        targetMessageId: messageId,
        error: preview.error,
      })
      return
    }
    setMessagePreview({
      status: 'ready',
      open: true,
      message: preview.data,
      targetMessageId: messageId,
      error: null,
    })
  }

  const applySenderPolicy = async (
    senderKey: string,
    sender: string,
    nextPolicy: GmailSenderPolicy,
    options?: { allowToggle?: boolean }
  ) => {
    const currentPolicy = draft.senderPolicies[senderKey] || 'undecided'
    const normalizedPolicy =
      options?.allowToggle === false
        ? nextPolicy
        : currentPolicy === nextPolicy
          ? 'undecided'
          : nextPolicy
    const currentIntent = draft.ruleIntents.find((intent) => intent.sender_key === senderKey) || null
    const nextIntent = ruleIntentFromPolicy(senderKey, sender, normalizedPolicy)
    if (
      currentPolicy === normalizedPolicy &&
      (currentIntent?.intent_type || null) === (nextIntent?.intent_type || null)
    ) {
      return
    }

    setDraft((current) => {
      const senderPolicies = { ...current.senderPolicies }
      if (normalizedPolicy === 'undecided') delete senderPolicies[senderKey]
      else senderPolicies[senderKey] = normalizedPolicy

      const ruleIntents = current.ruleIntents.filter((intent) => intent.sender_key !== senderKey)
      if (nextIntent) ruleIntents.push(nextIntent)

      return {
        ...current,
        senderPolicies,
        ruleIntents,
        confirmationPreview: null,
        updatedAt: Date.now(),
      }
    })

    setActionNote(null)

    const clusterPayload = selectedCluster
      ? {
          clusterId: selectedCluster.cluster_id,
          clusterType: selectedCluster.cluster_type,
          title: selectedCluster.title,
          query: selectedCluster.query,
        }
      : null

    const senderPolicyResult = await persistGmailCleanupMemoryEvent({
      agentId,
      sessionId,
      cluster: clusterPayload,
      action:
        normalizedPolicy === 'undecided'
          ? {
              type: 'sender_policy_removed',
              senderKey,
              sender,
              policy: currentPolicy,
            }
          : {
              type: 'sender_policy_set',
              senderKey,
              sender,
              policy: normalizedPolicy,
            },
    })
    if (!senderPolicyResult.ok) setActionNote(senderPolicyResult.error)

    if (currentIntent && (!nextIntent || currentIntent.intent_type !== nextIntent.intent_type)) {
      await persistGmailCleanupMemoryEvent({
        agentId,
        sessionId,
        cluster: clusterPayload,
        action: {
          type: 'rule_intent_removed',
          senderKey,
          sender,
          intentType: currentIntent.intent_type,
          label: currentIntent.label,
          description: currentIntent.description,
        },
      })
    }

    if (nextIntent && (!currentIntent || currentIntent.intent_type !== nextIntent.intent_type)) {
      await persistGmailCleanupMemoryEvent({
        agentId,
        sessionId,
        cluster: clusterPayload,
        action: {
          type: 'rule_intent_set',
          senderKey,
          sender,
          intentType: nextIntent.intent_type,
          label: nextIntent.label,
          description: nextIntent.description,
        },
      })
    }
  }

  const handlePolicyChange = async (
    senderKey: string,
    sender: string,
    nextPolicy: GmailSenderPolicy
  ) => applySenderPolicy(senderKey, sender, nextPolicy, { allowToggle: true })

  const handleClearDecision = async (senderKey: string, sender: string) =>
    applySenderPolicy(senderKey, sender, 'undecided', { allowToggle: false })

  const openSenderInReview = (sender: string) => {
    if (!selectedCluster) return
    updateSearch({
      stage: 'senders',
      cluster_id: selectedCluster.cluster_id,
      sender_search: sender,
      sender_filter: null,
      sender_page: '1',
    })
  }

  const createArchiveApproval = async () => {
    if (!selectedCluster || !draft.confirmationPreview) return
    setCreatingApproval(true)
    setActionNote(null)
    try {
      const res = await fetch('/api/runtime/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: runtime.sessionId || requestedSessionId || undefined,
          user_request: `Archive the confirmed sender-first selection for ${selectedCluster.title}.`,
          proposed_actions: [
            {
              tool: 'gmail',
              action: 'archive_messages',
              args: {
                cluster_id: selectedCluster.cluster_id,
                cluster_type: selectedCluster.cluster_type,
                title: selectedCluster.title,
                query: selectedCluster.query,
                analysis_scope: runtime.analysisScope,
                cache_version: cacheVersion || undefined,
                source_label: selectedCluster.title,
                clusters: allClusters.map((cluster) => ({
                  cluster_id: cluster.clusterId,
                  cluster_type: cluster.clusterType,
                  title: cluster.title,
                  query: cluster.query,
                })),
                sender_policies: draft.senderPolicies,
                message_overrides: draft.messageOverrides,
                selection_customization: {
                  analysis_scope: runtime.analysisScope,
                  selected_count: draft.confirmationPreview.exact_archive_impact.message_count,
                  candidate_count: draft.confirmationPreview.selected_cluster.message_count,
                  matching_messages_in_scope: draft.confirmationPreview.selected_cluster.message_count,
                  reviewed_count: displayWorkspaceData?.scope_ladder.loaded_preview_rows ?? null,
                  sender_count: draft.confirmationPreview.selected_cluster.sender_count,
                },
                safe_signals: [
                  'Sender-first confirmation preview',
                  'Protected messages excluded from archive',
                  'Archive is the only live Gmail mutation in this pass',
                ],
                safety_exclusions: [
                  'No delete',
                  'No unsubscribe executor',
                  'No quarantine executor',
                  'No custom-rule executor',
                ],
                selection_basis:
                  'Exact impact computed from sender decisions; messages remain evidence-only until confirmation.',
              },
            },
          ],
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: { approval_id?: string } }
        | null
      if (!res.ok || !payload?.ok) {
        setActionNote(payload?.error || 'Failed to create archive approval.')
        return
      }
      setActionNote(
        payload.data?.approval_id
          ? `Archive approval created: ${payload.data.approval_id}`
          : 'Archive approval created.'
      )
    } finally {
      setCreatingApproval(false)
    }
  }

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading sender workspace…
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

  if (!selectedCluster) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading the recommended cleanup group for Sender Decisions. If cleanup groups are still unavailable, start in{' '}
        <Link href={`/agents/${agentId}/operations/clusters${query}`} className="text-cyan-300 underline">
          Cleanup Groups
        </Link>
        .
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {displayWorkspaceData ? (
        <GmailScopeLadder
          title="Sender-first workspace"
          subtitle="The count keeps narrowing so the operator understands exactly why not every message is visible at once."
          counts={
            stage === 'confirmation' && draft.confirmationPreview
              ? draft.confirmationPreview.scope_ladder
              : displayWorkspaceData.scope_ladder
          }
        />
      ) : null}

      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Workflow stages</p>
            <p className="mt-1 text-sm text-gray-300">
              Mailbox Intelligence {'->'} Cleanup Groups {'->'} Sender Decisions {'->'} Confirmation
            </p>
          </div>
          <StageNavigation currentStage={stage} buildStageHref={buildStageHref} />
        </div>
        <div className="flex flex-wrap gap-2">
          {runtimeClusters.map((cluster) => (
            <Link
              key={cluster.cluster_id}
              href={`?${new URLSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                cluster_id: cluster.cluster_id,
                stage,
              }).toString()}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                cluster.cluster_id === selectedCluster.cluster_id
                  ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                  : 'border-gray-800 bg-gray-950/35 text-gray-300 hover:border-gray-700 hover:text-white'
              }`}
            >
              {cluster.title}
            </Link>
          ))}
        </div>
      </section>

      {workspaceState.status === 'error' && !displayWorkspaceData ? (
        <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
          {workspaceState.error}
        </section>
      ) : !displayWorkspaceData ? (
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
          Loading sender-first review workspace…
        </section>
      ) : stage === 'senders' && displayWorkspaceData ? (
        <SenderDecisionStage
          data={displayWorkspaceData}
          isRefreshing={workspaceState.refreshing}
          blockingError={workspaceState.status === 'error' ? workspaceState.error : null}
          draftSavedAt={draft.updatedAt}
          policyBySender={draft.senderPolicies}
          openSenderKey={openSenderKey}
          onToggleSender={(senderKey) => setOpenSenderKey((current) => (current === senderKey ? null : senderKey))}
          onPolicyChange={handlePolicyChange}
          onOpenMessage={handleOpenMessage}
          onPageChange={(page) => updateSearch({ sender_page: String(page), cluster_id: selectedCluster.cluster_id })}
          onSearchChange={(value) =>
            updateSearch({
              sender_search: value || null,
              sender_page: '1',
              cluster_id: selectedCluster.cluster_id,
            })
          }
          onFilterChange={(value) =>
            updateSearch({
              sender_filter: value === 'all' ? null : value,
              sender_page: '1',
              cluster_id: selectedCluster.cluster_id,
            })
          }
          onSortChange={(value) =>
            updateSearch({
              sender_sort: value === 'message_count' ? null : value,
              sender_page: '1',
              cluster_id: selectedCluster.cluster_id,
            })
          }
          onDirectionChange={(value) =>
            updateSearch({
              sender_direction: value === 'desc' ? null : value,
              sender_page: '1',
              cluster_id: selectedCluster.cluster_id,
            })
          }
          snippetLoadingSenderKey={snippetLoadingSenderKey}
        />
      ) : stage === 'confirmation' ? (
        <ConfirmationStage
          preview={draft.confirmationPreview}
          createArchiveApproval={createArchiveApproval}
          creatingApproval={creatingApproval}
          actionNote={actionNote}
          policyBySender={draft.senderPolicies}
          onPolicyChange={(senderKey, sender, policy) =>
            void applySenderPolicy(senderKey, sender, policy, { allowToggle: false })
          }
          onRemoveDecision={(senderKey, sender) => void handleClearDecision(senderKey, sender)}
          onOpenSenderReview={(sender) => openSenderInReview(sender)}
        />
      ) : deferredStage ? (
        <DeferredStagePlaceholder
          stage={deferredStage}
          selectedClusterTitle={(displayWorkspaceData || workspaceState.data).selected_cluster.title}
          senderCount={(displayWorkspaceData || workspaceState.data).selected_cluster.sender_count}
          exceptionsCount={(displayWorkspaceData || workspaceState.data).exceptions_count}
          openSendersHref={buildStageHref('senders')}
          openConfirmationHref={buildStageHref('confirmation')}
        />
      ) : (
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
          Loading sender-first review workspace…
        </section>
      )}

      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Not seeing the right slice yet? Go back to{' '}
        <Link href={`/agents/${agentId}/operations/clusters${query}`} className="text-cyan-300 underline">
          Cleanup Groups
        </Link>{' '}
        or reopen the current sender set directly at{' '}
        <Link href={`?${new URLSearchParams({
          ...Object.fromEntries(searchParams.entries()),
          cluster_id: selectedCluster.cluster_id,
          stage: 'senders',
        }).toString()}`} className="text-cyan-300 underline">
          Sender Decisions
        </Link>
        .
      </section>

      {messagePreview.open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Message evidence</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {messagePreview.status === 'ready'
                    ? messagePreview.message.subject || '(no subject)'
                    : 'Loading preview…'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setMessagePreview({
                    status: 'idle',
                    open: false,
                    message: null,
                    targetMessageId: null,
                    error: null,
                  })
                }
                className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-200"
              >
                Close
              </button>
            </div>
            {messagePreview.status === 'error' ? (
              <p className="mt-4 text-sm text-rose-200">{messagePreview.error}</p>
            ) : messagePreview.status === 'ready' ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  {messagePreview.message.from || 'Unknown sender'} · {messagePreview.message.to || 'Unknown recipient'} ·{' '}
                  {messagePreview.message.date || 'Unknown date'}
                </p>
                <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950/70 p-4 text-sm leading-6 text-gray-200 whitespace-pre-wrap">
                  {messagePreview.message.body_text || messagePreview.message.snippet || 'No body preview available.'}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-300">Loading message preview…</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
