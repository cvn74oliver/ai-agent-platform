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
  clearGmailCleanupWorkflowDraft,
  fetchGmailDecisionManagementSummary,
  fetchGmailConfirmationPreview,
  fetchGmailSenderWorkspace,
  GMAIL_CLEANUP_STAGES,
  gmailCleanupWorkflowDraftHasActiveContent,
  gmailCleanupWorkflowDraftStorageKey,
  persistGmailCleanupMemoryEvent,
  readCachedGmailSenderWorkspace,
  readGmailCleanupWorkflowDraft,
  writeGmailCleanupWorkflowDraft,
  type GmailDestinationExecutionState,
  type GmailDestinationState,
  type GmailCleanupRuleIntent,
  type GmailCleanupStage,
  type GmailCleanupWorkflowDraft,
  type GmailSenderPolicy,
  type GmailSenderDestinationTrustSignals,
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

type SenderCommittedDisplayState = {
  destinationState: GmailDestinationState
  executionState: GmailDestinationExecutionState
  lastActionTimestamp: string
}

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
      label: `Keep preference for ${sender}`,
      description: `Remember that ${sender} should stay visible. No Gmail change executes now in Phase 1.`,
    }
  }
  if (policy === 'quarantine') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'quarantine',
      label: `Quarantine later for ${sender}`,
      description: `Store ${sender} as a later quarantine preference. No Gmail change executes now in Phase 1.`,
    }
  }
  if (policy === 'unsubscribe') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'unsubscribe',
      label: `Unsubscribe later for ${sender}`,
      description: `Store unsubscribe intent for ${sender}. No unsubscribe request is sent in Phase 1.`,
    }
  }
  if (policy === 'custom_rule') {
    return {
      sender_key: senderKey,
      sender,
      intent_type: 'custom_rule',
      label: `Custom rule later for ${sender}`,
      description: `Store a custom automation idea for ${sender}. The rule editor arrives in a later phase.`,
    }
  }
  return null
}

function destinationStateFromPolicy(policy: GmailSenderPolicy): GmailDestinationState | null {
  if (policy === 'keep') return 'KEEP'
  if (policy === 'archive') return 'ARCHIVE'
  if (policy === 'quarantine') return 'QUARANTINE'
  if (policy === 'unsubscribe') return 'UNSUBSCRIBE'
  if (policy === 'custom_rule') return 'CUSTOM_RULE'
  return null
}

function destinationReasonForPolicy(policy: GmailSenderPolicy, clusterTitle: string): string {
  if (policy === 'archive') {
    return `Approved from Confirmation for ${clusterTitle}. Archive-managed sender state recorded for current inbox cleanup.`
  }
  if (policy === 'keep') {
    return `Approved from Confirmation for ${clusterTitle}. Keep destination protects this sender from cleanup.`
  }
  if (policy === 'quarantine') {
    return `Approved from Confirmation for ${clusterTitle}. Quarantine destination stored for later caution-state management.`
  }
  if (policy === 'unsubscribe') {
    return `Approved from Confirmation for ${clusterTitle}. Unsubscribe intent stored for later execution work.`
  }
  return `Approved from Confirmation for ${clusterTitle}. Custom Rule intent stored for later rule authoring.`
}

function buildDestinationTrustSignals(
  sender: GmailSenderWorkspaceData['senders'][number] | undefined
): GmailSenderDestinationTrustSignals | null {
  if (!sender) return null
  return {
    sender_signal: sender.sender_signal,
    category_summary: sender.category_summary || null,
    dominant_pattern: sender.dominant_pattern || null,
    protected_hint: sender.protected_hint || null,
    requires_verification: sender.requires_verification,
    verification_reasons: sender.verification_reasons,
    cleanup_group_message_count: sender.cleanup_group_message_count,
    total_sender_messages: sender.total_sender_messages,
    unread_count: sender.unread_count,
    last_activity: sender.last_activity,
  }
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
  const sessionId = runtime.sessionId || requestedSessionId
  const selectedClusterFromUrl =
    clusterId ? runtimeClusters.find((cluster) => cluster.cluster_id === clusterId) || null : null
  const cacheVersion = runtime.data?.runtime_cleanup_plan?.generated_at || null
  const recommendedCluster = useMemo(() => {
    if (runtimeClusters.length === 0) return null
    if (selectedClusterFromUrl) return selectedClusterFromUrl

    let recommended = runtimeClusters[0] || null
    let latestDraftUpdatedAt = -1
    for (const cluster of runtimeClusters) {
      const stored = readGmailCleanupWorkflowDraft({
        agentId,
        sessionId,
        clusterId: cluster.cluster_id,
        snapshotVersion: cacheVersion,
      })
      if (!gmailCleanupWorkflowDraftHasActiveContent(stored)) continue
      if (stored.updatedAt > latestDraftUpdatedAt) {
        latestDraftUpdatedAt = stored.updatedAt
        recommended = cluster
      }
    }
    return recommended
  }, [agentId, cacheVersion, runtimeClusters, selectedClusterFromUrl, sessionId])
  const selectedCluster = selectedClusterFromUrl || recommendedCluster || null
  const clusterUrlSynced = Boolean(selectedCluster && clusterId === selectedCluster.cluster_id)
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
  const [committedRefreshNonce, setCommittedRefreshNonce] = useState(0)
  const [committedBySender, setCommittedBySender] = useState<
    Record<string, SenderCommittedDisplayState>
  >({})
  const currentDraftStorageKey =
    selectedCluster && agentId
      ? gmailCleanupWorkflowDraftStorageKey({
          agentId,
          sessionId,
          clusterId: selectedCluster.cluster_id,
        })
      : null
  const hasPendingSessionDecisions = Object.keys(draft.senderPolicies).length > 0

  useEffect(() => {
    if (!selectedCluster) return
    if (clusterId === selectedCluster.cluster_id) return
    const next = new URLSearchParams(searchParams.toString())
    next.set('cluster_id', selectedCluster.cluster_id)
    next.set('stage', stage)
    if (!next.get('sender_page')) next.set('sender_page', '1')
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false })
    })
  }, [
    clusterId,
    router,
    searchParams,
    selectedCluster,
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
    if (!agentId) return

    let cancelled = false
    void fetchGmailDecisionManagementSummary({ agentId }).then((result) => {
      if (cancelled) return
      if (!result.ok) return
      const next = result.data.sender_profiles.reduce<Record<string, SenderCommittedDisplayState>>(
        (profiles, profile) => {
          profiles[profile.sender_key] = {
            destinationState: profile.destination_state,
            executionState: profile.execution_state,
            lastActionTimestamp: profile.last_action_timestamp,
          }
          return profiles
        },
        {}
      )
      setCommittedBySender(next)
    })

    return () => {
      cancelled = true
    }
  }, [agentId, committedRefreshNonce])

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
    if (!clusterUrlSynced) return

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
    clusterUrlSynced,
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

    if (!hasPendingSessionDecisions) {
      if (draft.confirmationPreview != null) {
        setDraft((current) => ({
          ...current,
          confirmationPreview: null,
          updatedAt: Date.now(),
        }))
      }
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
    draft.confirmationPreview,
    draft.messageOverrides,
    draft.senderPolicies,
    hasPendingSessionDecisions,
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
      const senderLookup = new Map(
        (displayWorkspaceData?.senders || []).map((sender) => [sender.sender_key, sender] as const)
      )
      const committedSenders = draft.confirmationPreview.groups
        .filter((group) => group.policy !== 'undecided')
        .flatMap((group) => {
          const destinationState = destinationStateFromPolicy(group.policy)
          if (!destinationState) return []
          return group.senders.map((sender) => ({
            senderKey: sender.sender_key,
            sender: sender.sender,
            destinationState,
            source: 'confirmation_approved',
            reason: destinationReasonForPolicy(group.policy, selectedCluster.title),
            messageCount: sender.message_count,
            trustSignals: buildDestinationTrustSignals(senderLookup.get(sender.sender_key)),
          }))
        })

      if (committedSenders.length === 0) {
        setActionNote('No approved sender decisions were ready to move into destination states.')
        return
      }

      const res = await fetch('/api/runtime/gmail-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId: runtime.sessionId || requestedSessionId || null,
          cluster: {
            clusterId: selectedCluster.cluster_id,
            clusterType: selectedCluster.cluster_type,
            title: selectedCluster.title,
            query: selectedCluster.query,
          },
          allClusters: allClusters.map((cluster) => ({
            clusterId: cluster.clusterId,
            clusterType: cluster.clusterType,
            title: cluster.title,
            query: cluster.query,
          })),
          analysisScope: runtime.analysisScope,
          senderPolicies: draft.senderPolicies,
          messageOverrides: draft.messageOverrides,
          senders: committedSenders,
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
          data?: {
            committed_sender_count: number
            archive_execution?: {
              status: 'not_applicable' | 'pending' | 'succeeded' | 'failed' | 'deferred'
              sender_count: number
              message_count: number
              warning?: string | null
            }
          }
        }
        | null
      if (!res.ok || !payload?.ok || !payload.data) {
        setActionNote(payload?.error || 'Failed to commit destination states.')
        return
      }

      const stateCounts = committedSenders.reduce<Record<GmailDestinationState, number>>(
        (counts, sender) => {
          counts[sender.destinationState] = (counts[sender.destinationState] || 0) + 1
          return counts
        },
        {
          KEEP: 0,
          ARCHIVE: 0,
          QUARANTINE: 0,
          UNSUBSCRIBE: 0,
          CUSTOM_RULE: 0,
        }
      )
      const archiveExecution = payload.data.archive_execution
      const archiveSuffix =
        archiveExecution?.status === 'succeeded'
          ? ` Archive execution was confirmed for ~${archiveExecution.message_count.toLocaleString()} messages across ${archiveExecution.sender_count.toLocaleString()} senders.`
          : archiveExecution?.status === 'failed'
            ? ` Archive execution needs attention: ${archiveExecution.warning || 'The Gmail archive request did not complete successfully.'}`
            : archiveExecution?.status === 'deferred'
              ? ` Archive execution is deferred: ${archiveExecution.warning || 'Inbox-label removal has not been independently confirmed yet.'}`
              : archiveExecution?.status === 'not_applicable'
                ? ` Archive execution was not needed: ${archiveExecution.warning || 'No current inbox-visible messages still required archive.'}`
                : ''
      setActionNote(
        `Approved ${payload.data.committed_sender_count.toLocaleString()} senders into destination states: ${stateCounts.ARCHIVE} Archive, ${stateCounts.KEEP} Keep, ${stateCounts.QUARANTINE} Quarantine, ${stateCounts.UNSUBSCRIBE} Unsubscribe, ${stateCounts.CUSTOM_RULE} Custom Rule.${archiveSuffix}`
      )
      setCommittedBySender((current) => {
        const next = { ...current }
        const committedAt = new Date().toISOString()
        for (const sender of committedSenders) {
          next[sender.senderKey] = {
            destinationState: sender.destinationState,
            executionState:
              sender.destinationState === 'KEEP'
                ? 'not_applicable'
                : sender.destinationState === 'ARCHIVE'
                  ? archiveExecution?.status || 'deferred'
                  : 'deferred',
            lastActionTimestamp: committedAt,
          }
        }
        return next
      })
      clearGmailCleanupWorkflowDraft({
        agentId,
        sessionId,
        clusterId: selectedCluster.cluster_id,
      })
      setDraft({
        ...emptyDraft('senders'),
        snapshotVersion: cacheVersion,
      })
      setCommittedRefreshNonce((current) => current + 1)
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
          subtitle="The scope keeps narrowing so the operator sees the real decision set first and the visible evidence slice second."
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
          {selectedCluster && !clusterUrlSynced
            ? 'Resolving the selected cleanup group for Sender Decisions…'
            : 'Loading sender-first review workspace…'}
        </section>
      ) : stage === 'senders' && displayWorkspaceData ? (
        <SenderDecisionStage
          key={displayWorkspaceData.selected_cluster.cluster_id}
          data={displayWorkspaceData}
          isRefreshing={workspaceState.refreshing}
          blockingError={workspaceState.status === 'error' ? workspaceState.error : null}
          draftSavedAt={draft.updatedAt}
          policyBySender={draft.senderPolicies}
          committedBySender={committedBySender}
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
          hasPendingSessionDecisions={Object.keys(draft.senderPolicies).length > 0}
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
