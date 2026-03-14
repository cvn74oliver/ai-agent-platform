'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ConfirmationStage,
  ExceptionsStage,
  GmailScopeLadder,
  MonitoringStage,
  RulesAutomationStage,
  SenderDecisionStage,
  StageNavigation,
} from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  fetchGmailConfirmationPreview,
  fetchGmailMonitoringSummary,
  fetchGmailSenderWorkspace,
  GMAIL_CLEANUP_STAGES,
  persistGmailCleanupMemoryEvent,
  readGmailCleanupWorkflowDraft,
  writeGmailCleanupWorkflowDraft,
  type GmailCleanupRuleIntent,
  type GmailCleanupStage,
  type GmailCleanupWorkflowDraft,
  type GmailMonitoringSummaryData,
  type GmailSenderPolicy,
  type GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  fetchOperationsMessagePreview,
  serializeOperationsQuery,
  type OperationsMessagePreviewData,
} from '@/lib/runtime/operationsWorkspace'

type SenderWorkspaceLoadState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'ready'; data: GmailSenderWorkspaceData; error: null }
  | { status: 'error'; data: null; error: string }

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
  const selectedCluster =
    runtimeClusters.find((cluster) => cluster.cluster_id === clusterId) || runtimeClusters[0] || null
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

  const [workspaceState, setWorkspaceState] = useState<SenderWorkspaceLoadState>({
    status: 'idle',
    data: null,
    error: null,
  })
  const [draft, setDraft] = useState<GmailCleanupWorkflowDraft>(() => emptyDraft(stage))
  const [openSenderKey, setOpenSenderKey] = useState<string | null>(null)
  const [messagePreview, setMessagePreview] = useState<MessagePreviewState>({
    status: 'idle',
    open: false,
    message: null,
    targetMessageId: null,
    error: null,
  })
  const [monitoring, setMonitoring] = useState<GmailMonitoringSummaryData | null>(null)
  const [creatingApproval, setCreatingApproval] = useState(false)
  const [actionNote, setActionNote] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedCluster) return
    const stored =
      readGmailCleanupWorkflowDraft({
        agentId,
        sessionId: runtime.sessionId || requestedSessionId,
        clusterId: selectedCluster.cluster_id,
      }) || emptyDraft(stage)
    setDraft({
      ...stored,
      currentStage: stage,
    })
  }, [agentId, requestedSessionId, runtime.sessionId, selectedCluster, stage])

  useEffect(() => {
    if (!selectedCluster) return
    writeGmailCleanupWorkflowDraft(
      {
        agentId,
        sessionId: runtime.sessionId || requestedSessionId,
        clusterId: selectedCluster.cluster_id,
      },
      draft
    )
  }, [agentId, draft, requestedSessionId, runtime.sessionId, selectedCluster])

  useEffect(() => {
    let cancelled = false
    if (!selectedCluster) return

    setWorkspaceState({ status: 'loading', data: null, error: null })
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
      page: senderPage,
      pageSize: 10,
      requestContext: {
        source: 'operations_review_page',
        component: `stage_${stage}`,
        reason: 'sender_first_workspace',
        phase: 'initial_paint',
      },
    }).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setWorkspaceState({ status: 'error', data: null, error: result.error })
        return
      }
      setWorkspaceState({ status: 'ready', data: result.data, error: null })
    })

    return () => {
      cancelled = true
    }
  }, [allClusters, runtime.analysisScope, selectedCluster, senderPage, stage])

  useEffect(() => {
    let cancelled = false
    if (stage !== 'monitoring' || !selectedCluster || workspaceState.status !== 'ready') return

    void fetchGmailMonitoringSummary({
      agentId,
      selectedCluster: {
        clusterId: selectedCluster.cluster_id,
        clusterType: selectedCluster.cluster_type,
        title: selectedCluster.title,
        query: selectedCluster.query,
      },
      candidateSenders: workspaceState.data.senders.map((sender) => ({
        senderKey: sender.sender_key,
        sender: sender.sender,
      })),
    }).then((result) => {
      if (cancelled || !result.ok) return
      setMonitoring(result.data)
    })

    return () => {
      cancelled = true
    }
  }, [agentId, selectedCluster, stage, workspaceState])

  useEffect(() => {
    let cancelled = false
    if (
      (stage !== 'confirmation' && stage !== 'rules') ||
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
    router.replace(`?${next.toString()}`)
  }

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

  const handlePolicyChange = async (senderKey: string, sender: string, nextPolicy: GmailSenderPolicy) => {
    const currentPolicy = draft.senderPolicies[senderKey] || 'undecided'
    const normalizedPolicy = currentPolicy === nextPolicy ? 'undecided' : nextPolicy
    const currentIntent = draft.ruleIntents.find((intent) => intent.sender_key === senderKey) || null
    const nextIntent = ruleIntentFromPolicy(senderKey, sender, normalizedPolicy)

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

    const sessionId = runtime.sessionId || requestedSessionId
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
                  reviewed_count: workspaceState.status === 'ready' ? workspaceState.data.scope_ladder.loaded_preview_rows : null,
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
        No cleanup group is selected yet. Start in{' '}
        <Link href={`/agents/${agentId}/operations/clusters${query}`} className="text-cyan-300 underline">
          Cleanup Groups
        </Link>
        .
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {workspaceState.status === 'ready' ? (
        <GmailScopeLadder
          title="Sender-first workspace"
          subtitle="The count keeps narrowing so the operator understands exactly why not every message is visible at once."
          counts={
            stage === 'confirmation' && draft.confirmationPreview
              ? draft.confirmationPreview.scope_ladder
              : workspaceState.data.scope_ladder
          }
        />
      ) : null}

      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Workflow stages</p>
            <p className="mt-1 text-sm text-gray-300">
              Intro &amp; Health {'->'} Mailbox Intelligence {'->'} Cleanup Groups {'->'} Sender Decisions {'->'} Exceptions / Verification {'->'} Confirmation {'->'} Rules / Automation {'->'} Monitoring
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

      {workspaceState.status === 'error' ? (
        <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
          {workspaceState.error}
        </section>
      ) : workspaceState.status !== 'ready' ? (
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
          Loading sender-first review workspace…
        </section>
      ) : stage === 'senders' ? (
        <SenderDecisionStage
          data={workspaceState.data}
          policyBySender={draft.senderPolicies}
          openSenderKey={openSenderKey}
          onToggleSender={(senderKey) => setOpenSenderKey((current) => (current === senderKey ? null : senderKey))}
          onPolicyChange={handlePolicyChange}
          onOpenMessage={handleOpenMessage}
          onPageChange={(page) => updateSearch({ sender_page: String(page), cluster_id: selectedCluster.cluster_id })}
        />
      ) : stage === 'exceptions' ? (
        <ExceptionsStage
          senders={workspaceState.data.senders}
          policyBySender={draft.senderPolicies}
          onPolicyChange={handlePolicyChange}
          onOpenMessage={handleOpenMessage}
        />
      ) : stage === 'confirmation' ? (
        <ConfirmationStage
          preview={draft.confirmationPreview}
          createArchiveApproval={createArchiveApproval}
          creatingApproval={creatingApproval}
          actionNote={actionNote}
        />
      ) : stage === 'rules' ? (
        <RulesAutomationStage ruleIntents={draft.ruleIntents} />
      ) : (
        <MonitoringStage data={monitoring} />
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
