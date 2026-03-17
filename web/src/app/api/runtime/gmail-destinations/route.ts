import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { persistGmailCleanupMemory } from '@/lib/runtime/gmailCleanupMemory'
import {
  loadGmailAccessContextForTenant,
  mutateGmailInboxLabelStateForTenant,
  normalizeMailboxProfileScope,
  verifyGmailMessagesInboxStateForTenant,
} from '@/lib/integrations/gmail/inboxAnalysis'
import { resolveGmailSenderPolicyArchiveScopeForTenant } from '@/lib/integrations/gmail/gmailCleanupWorkspace'
import type {
  GmailCleanupMemoryWritePayload,
  GmailDestinationExecutionState,
  GmailDestinationState,
  GmailSenderPolicy,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { isUuid } from '@/lib/runtime/types'

type AdminSupabase = Awaited<ReturnType<typeof getSupabaseAdmin>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((entry) => normalizeText(entry))
        .filter(Boolean)
    : []
}

function destinationProfileSourceUrl(senderKey: string): string {
  return `gmail://sender-destination/${encodeURIComponent(senderKey)}`
}

type DestinationCommitRequest = {
  kind: 'commit'
  agentId: string
  sessionId: string | null
  cluster: {
    clusterId: string
    clusterType: string
    title: string
    query: string
  }
  allClusters: Array<{
    clusterId: string
    clusterType: string
    title: string
    query: string
  }>
  analysisScope: string | null
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
  senders: Extract<GmailCleanupMemoryWritePayload['action'], { type: 'destination_commit' }>['senders']
}

type RestoreArchiveRequest = {
  kind: 'restore_archive'
  agentId: string
  sessionId: string | null
  senderKey: string
  sender: string
}

type DestinationRequest = DestinationCommitRequest | RestoreArchiveRequest

type CommitSender = DestinationCommitRequest['senders'][number]

type ExecutionUpdateSender = {
  senderKey: string
  sender: string
  executionState: GmailDestinationExecutionState
  executionSource: string
  executionWarning?: string | null
  executionMessageCount?: number | null
  executionMessageIds?: string[] | null
}

type StoredDestinationProfile = {
  senderKey: string
  sender: string
  destinationState: GmailDestinationState
  executionState: GmailDestinationExecutionState
  executionWarning: string | null
  executionMessageIds: string[]
}

type ArchiveExecutionSummary = {
  status: GmailDestinationExecutionState
  senderCount: number
  messageCount: number
  warning: string | null
}

function timingMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt)
}

function parseCommitRequest(value: Record<string, unknown>): DestinationCommitRequest | null {
  const agentId = normalizeText(value.agentId)
  if (!agentId) return null

  const sessionId = normalizeText(value.sessionId) || null

  if (
    !isRecord(value.cluster) ||
    typeof value.cluster.clusterId !== 'string' ||
    typeof value.cluster.clusterType !== 'string' ||
    typeof value.cluster.title !== 'string' ||
    typeof value.cluster.query !== 'string'
  ) {
    return null
  }

  const cluster = {
    clusterId: value.cluster.clusterId.trim(),
    clusterType: value.cluster.clusterType.trim(),
    title: value.cluster.title.trim(),
    query: value.cluster.query.trim(),
  }
  if (!cluster.clusterId || !cluster.clusterType || !cluster.title || !cluster.query) return null

  const allClusters = Array.isArray(value.allClusters)
    ? value.allClusters
        .filter(
          (
            entry
          ): entry is {
            clusterId: string
            clusterType: string
            title: string
            query: string
          } =>
            isRecord(entry) &&
            typeof entry.clusterId === 'string' &&
            typeof entry.clusterType === 'string' &&
            typeof entry.title === 'string' &&
            typeof entry.query === 'string'
        )
        .map((entry) => ({
          clusterId: entry.clusterId.trim(),
          clusterType: entry.clusterType.trim(),
          title: entry.title.trim(),
          query: entry.query.trim(),
        }))
        .filter((entry) => entry.clusterId && entry.clusterType && entry.title && entry.query)
    : []

  if (!Array.isArray(value.senders) || value.senders.length === 0) return null
  const senders = value.senders
    .filter(
      (
        entry
      ): entry is DestinationCommitRequest['senders'][number] =>
        isRecord(entry) &&
        typeof entry.senderKey === 'string' &&
        typeof entry.sender === 'string' &&
        typeof entry.destinationState === 'string' &&
        typeof entry.source === 'string' &&
        typeof entry.reason === 'string'
    )
    .map((entry) => ({
      senderKey: entry.senderKey.trim(),
      sender: entry.sender.trim(),
      destinationState: entry.destinationState,
      source: entry.source.trim(),
      reason: entry.reason.trim(),
      messageCount:
        typeof entry.messageCount === 'number' && Number.isFinite(entry.messageCount)
          ? entry.messageCount
          : null,
      trustSignals: isRecord(entry.trustSignals) ? entry.trustSignals : null,
    }))
    .filter(
      (entry) =>
        entry.senderKey &&
        entry.sender &&
        entry.source &&
        entry.reason &&
        (entry.destinationState === 'KEEP' ||
          entry.destinationState === 'ARCHIVE' ||
          entry.destinationState === 'QUARANTINE' ||
          entry.destinationState === 'UNSUBSCRIBE' ||
          entry.destinationState === 'CUSTOM_RULE')
    )

  if (senders.length === 0) return null

  const senderPolicies =
    isRecord(value.senderPolicies) && Object.keys(value.senderPolicies).length > 0
      ? (value.senderPolicies as Record<string, GmailSenderPolicy>)
      : {}
  const messageOverrides =
    isRecord(value.messageOverrides) && Object.keys(value.messageOverrides).length > 0
      ? (value.messageOverrides as Record<string, 'include' | 'exclude'>)
      : {}

  return {
    kind: 'commit',
    agentId,
    sessionId,
    cluster,
    allClusters,
    analysisScope: normalizeText(value.analysisScope) || null,
    senderPolicies,
    messageOverrides,
    senders,
  }
}

function parseRestoreArchiveRequest(value: Record<string, unknown>): RestoreArchiveRequest | null {
  const agentId = normalizeText(value.agentId)
  const senderKey = normalizeText(value.senderKey)
  const sender = normalizeText(value.sender)
  if (!agentId || !senderKey || !sender) return null

  return {
    kind: 'restore_archive',
    agentId,
    sessionId: normalizeText(value.sessionId) || null,
    senderKey,
    sender,
  }
}

function parseRequestBody(value: unknown): DestinationRequest | null {
  if (!isRecord(value)) return null
  if (normalizeText(value.action) === 'restore_archive') {
    return parseRestoreArchiveRequest(value)
  }
  return parseCommitRequest(value)
}

async function resolveTenantIdForAgent(params: {
  supabase: AdminSupabase
  agentId: string
}): Promise<string | null> {
  const { data: agentRow, error: agentError } = await params.supabase
    .from('agents')
    .select('user_id')
    .eq('id', params.agentId)
    .maybeSingle()

  if (agentError) {
    console.error('[runtime/gmail-destinations] agent lookup error:', agentError)
    return null
  }

  const userId = typeof agentRow?.user_id === 'string' ? agentRow.user_id : ''
  if (!userId) return null

  const { data: profileRow, error: profileError } = await params.supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('[runtime/gmail-destinations] profile lookup error:', profileError)
    return null
  }

  return typeof profileRow?.tenant_id === 'string' ? profileRow.tenant_id : null
}

async function updateDestinationExecutionState(params: {
  supabase: AdminSupabase
  agentId: string
  sessionId: string | null
  cluster: GmailCleanupMemoryWritePayload['cluster']
  senders: ExecutionUpdateSender[]
}): Promise<void> {
  if (params.senders.length === 0) return

  const result = await persistGmailCleanupMemory({
    supabase: params.supabase,
    agentId: params.agentId,
    payload: {
      agentId: params.agentId,
      sessionId: params.sessionId,
      cluster: params.cluster,
      action: {
        type: 'destination_execution_update',
        senders: params.senders.map((sender) => ({
          senderKey: sender.senderKey,
          sender: sender.sender,
          executionState: sender.executionState,
          executionSource: sender.executionSource,
          executionWarning: sender.executionWarning ?? null,
          executionMessageCount: sender.executionMessageCount ?? null,
          executionMessageIds: sender.executionMessageIds ?? null,
        })),
      },
    },
  })

  if (!result.ok) {
    console.warn('[runtime/gmail-destinations] execution-state update failed:', result.error)
  }
}

async function clearDestinationState(params: {
  supabase: AdminSupabase
  agentId: string
  sessionId: string | null
  senderKey: string
  sender: string
  reason: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return persistGmailCleanupMemory({
    supabase: params.supabase,
    agentId: params.agentId,
    payload: {
      agentId: params.agentId,
      sessionId: params.sessionId,
      cluster: null,
      action: {
        type: 'destination_state_clear',
        senderKey: params.senderKey,
        sender: params.sender,
        reason: params.reason,
      },
    },
  })
}

function normalizeDestinationState(value: unknown): GmailDestinationState | null {
  return value === 'KEEP' ||
    value === 'ARCHIVE' ||
    value === 'QUARANTINE' ||
    value === 'UNSUBSCRIBE' ||
    value === 'CUSTOM_RULE'
    ? value
    : null
}

function normalizeExecutionState(value: unknown): GmailDestinationExecutionState | null {
  return value === 'not_applicable' ||
    value === 'pending' ||
    value === 'succeeded' ||
    value === 'failed' ||
    value === 'deferred'
    ? value
    : null
}

async function loadStoredDestinationProfile(params: {
  supabase: AdminSupabase
  agentId: string
  senderKey: string
}): Promise<StoredDestinationProfile | null> {
  const { data, error } = await params.supabase
    .from('rag_documents')
    .select('meta')
    .eq('agent_id', params.agentId)
    .eq('source_type', 'gmail_sender_destination_profile')
    .eq('source_url', destinationProfileSourceUrl(params.senderKey))
    .limit(1)

  if (error) {
    console.error('[runtime/gmail-destinations] destination profile lookup failed:', error)
    return null
  }

  const meta = parsePayload(data?.[0]?.meta)
  if (!meta) return null

  const senderKey = normalizeText(meta.sender_key)
  const sender = normalizeText(meta.sender)
  const destinationState = normalizeDestinationState(meta.destination_state)
  const executionState = normalizeExecutionState(meta.execution_state) || 'pending'
  if (!senderKey || !sender || !destinationState) return null

  return {
    senderKey,
    sender,
    destinationState,
    executionState,
    executionWarning: normalizeText(meta.execution_warning) || null,
    executionMessageIds: normalizeStringArray(meta.execution_message_ids),
  }
}

function countMatchingIds(ids: string[], set: Set<string>): number {
  let count = 0
  for (const id of ids) {
    if (set.has(id)) count += 1
  }
  return count
}

function buildArchiveExecutionUpdates(params: {
  senders: CommitSender[]
  messageIdsBySender: Record<string, string[]>
  acceptedMessageIds: Set<string>
  failedMessageIds: Set<string>
  verifiedMessageIds: Set<string>
  verificationWarning: string | null
}): ExecutionUpdateSender[] {
  return params.senders
    .filter((sender) => sender.destinationState === 'ARCHIVE')
    .map((sender) => {
      const targetedMessageIds = params.messageIdsBySender[sender.senderKey] || []
      if (targetedMessageIds.length === 0) {
        return {
          senderKey: sender.senderKey,
          sender: sender.sender,
          executionState: 'not_applicable',
          executionSource: 'archive_scope_empty',
          executionWarning: 'No inbox-visible messages still required archive at approval time.',
          executionMessageCount: 0,
          executionMessageIds: [],
        }
      }

      const acceptedCount = countMatchingIds(targetedMessageIds, params.acceptedMessageIds)
      const failedCount = countMatchingIds(targetedMessageIds, params.failedMessageIds)
      const verifiedCount = countMatchingIds(targetedMessageIds, params.verifiedMessageIds)

      if (verifiedCount === targetedMessageIds.length) {
        return {
          senderKey: sender.senderKey,
          sender: sender.sender,
          executionState: 'succeeded',
          executionSource: 'archive_verified',
          executionWarning: null,
          executionMessageCount: verifiedCount,
          executionMessageIds: targetedMessageIds,
        }
      }

      if (acceptedCount === 0 && failedCount === targetedMessageIds.length) {
        return {
          senderKey: sender.senderKey,
          sender: sender.sender,
          executionState: 'failed',
          executionSource: 'archive_request_failed',
          executionWarning:
            'Gmail could not apply the archive request for this sender. The destination state was saved, but Inbox removal did not complete.',
          executionMessageCount: 0,
          executionMessageIds: targetedMessageIds,
        }
      }

      const deferredIntro =
        verifiedCount > 0
          ? `Confirmed archive for ${verifiedCount.toLocaleString()} of ${targetedMessageIds.length.toLocaleString()} targeted messages.`
          : acceptedCount > 0
            ? `Archive was requested for ${acceptedCount.toLocaleString()} messages, but inbox removal is not fully confirmed yet.`
            : 'Archive execution still needs follow-up for this sender.'
      const failedSuffix =
        failedCount > 0
          ? ` ${failedCount.toLocaleString()} messages were rejected during the Gmail archive request.`
          : ''
      const verificationSuffix = params.verificationWarning
        ? ` ${params.verificationWarning}`
        : ' Confirmed success will appear only after Inbox removal is verified.'

      return {
        senderKey: sender.senderKey,
        sender: sender.sender,
        executionState: 'deferred',
        executionSource: 'archive_verification_pending',
        executionWarning: `${deferredIntro}${failedSuffix}${verificationSuffix}`.trim(),
        executionMessageCount: verifiedCount,
        executionMessageIds: targetedMessageIds,
      }
    })
}

function summarizeArchiveExecution(updates: ExecutionUpdateSender[]): ArchiveExecutionSummary {
  if (updates.length === 0) {
    return {
      status: 'not_applicable',
      senderCount: 0,
      messageCount: 0,
      warning: null,
    }
  }

  const statusCounts = updates.reduce<Record<GmailDestinationExecutionState, number>>(
    (counts, update) => {
      counts[update.executionState] = (counts[update.executionState] || 0) + 1
      return counts
    },
    {
      not_applicable: 0,
      pending: 0,
      succeeded: 0,
      failed: 0,
      deferred: 0,
    }
  )

  const confirmedMessageCount = updates.reduce(
    (total, update) => total + (update.executionMessageCount || 0),
    0
  )
  const targetedMessageCount = updates.reduce(
    (total, update) => total + (update.executionMessageIds?.length || 0),
    0
  )

  if (statusCounts.not_applicable === updates.length) {
    return {
      status: 'not_applicable',
      senderCount: 0,
      messageCount: 0,
      warning: 'No inbox-visible messages still required archive at approval time.',
    }
  }

  if (statusCounts.succeeded + statusCounts.not_applicable === updates.length) {
    return {
      status: 'succeeded',
      senderCount: statusCounts.succeeded,
      messageCount: confirmedMessageCount,
      warning:
        statusCounts.not_applicable > 0
          ? `${statusCounts.not_applicable.toLocaleString()} archive senders already had no inbox-visible messages left to change.`
          : null,
    }
  }

  if (statusCounts.failed === updates.length) {
    return {
      status: 'failed',
      senderCount: updates.length,
      messageCount: 0,
      warning: updates[0]?.executionWarning || 'Archive execution failed for every selected sender.',
    }
  }

  return {
    status: 'deferred',
    senderCount: updates.length,
    messageCount: confirmedMessageCount,
    warning:
      `Archive execution is only partially confirmed. ${confirmedMessageCount.toLocaleString()} of ${targetedMessageCount.toLocaleString()} targeted messages have verified Inbox removal so far.` +
      (updates.find((update) => update.executionWarning)?.executionWarning
        ? ` ${updates.find((update) => update.executionWarning)?.executionWarning}`
        : ''),
  }
}

async function handleCommitRequest(
  supabase: AdminSupabase,
  body: DestinationCommitRequest
): Promise<NextResponse> {
  const routeStartedAt = Date.now()
  const persistPromise = (async () => {
    const startedAt = Date.now()
    const result = await persistGmailCleanupMemory({
      supabase,
      agentId: body.agentId,
      payload: {
        agentId: body.agentId,
        sessionId: body.sessionId,
        cluster: body.cluster,
        action: {
          type: 'destination_commit',
          senders: body.senders,
        },
      },
    })
    return { result, durationMs: timingMs(startedAt) }
  })()
  const tenantIdPromise = (async () => {
    const startedAt = Date.now()
    const tenantId = await resolveTenantIdForAgent({
      supabase,
      agentId: body.agentId,
    })
    return { tenantId, durationMs: timingMs(startedAt) }
  })()

  const { result: persistResult, durationMs: persistMs } = await persistPromise

  if (!persistResult.ok) {
    return NextResponse.json({ ok: false, error: persistResult.error }, { status: 500 })
  }

  const archiveSenders = body.senders.filter((sender) => sender.destinationState === 'ARCHIVE')
  const archivePolicies = Object.fromEntries(
    Object.entries(body.senderPolicies).filter(([, policy]) => policy === 'archive')
  )

  if (archiveSenders.length === 0 || Object.keys(archivePolicies).length === 0) {
    return NextResponse.json({
      ok: true,
      data: {
        committed_sender_count: body.senders.length,
        archive_execution: {
          status: 'not_applicable',
          sender_count: 0,
          message_count: 0,
          warning: null,
        },
      },
    })
  }

  const { tenantId, durationMs: tenantLookupMs } = await tenantIdPromise

  if (!tenantId) {
    const failedUpdates = archiveSenders.map<ExecutionUpdateSender>((sender) => ({
      senderKey: sender.senderKey,
      sender: sender.sender,
      executionState: 'failed',
      executionSource: 'archive_execution_unavailable',
      executionWarning:
        'Destination state was committed, but archive execution could not run because the Gmail tenant connection was unavailable.',
      executionMessageCount: 0,
      executionMessageIds: [],
    }))
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: body.cluster,
      senders: failedUpdates,
    })
    return NextResponse.json({
      ok: true,
      data: {
        committed_sender_count: body.senders.length,
        archive_execution: {
          status: 'failed',
          sender_count: archiveSenders.length,
          message_count: 0,
          warning:
            'Destination state was committed, but archive execution could not run because the Gmail tenant connection was unavailable.',
        },
      },
    })
  }

  const accessContextPromise = (async () => {
    const startedAt = Date.now()
    const result = await loadGmailAccessContextForTenant({
      supabase,
      tenantId,
      requireModifyScope: true,
      logPrefix: '[runtime/gmail-destinations/archive-auth]',
    })
    return { result, durationMs: timingMs(startedAt) }
  })()
  const resolvedPromise = (async () => {
    const startedAt = Date.now()
    const result = await resolveGmailSenderPolicyArchiveScopeForTenant({
      supabase,
      tenantId,
      analysisScope: normalizeMailboxProfileScope(body.analysisScope),
      clusters:
        body.allClusters.length > 0
          ? body.allClusters.map((cluster) => ({
              cluster_id: cluster.clusterId,
              cluster_type: cluster.clusterType,
              title: cluster.title,
              query: cluster.query,
            }))
          : [
              {
                cluster_id: body.cluster.clusterId,
                cluster_type: body.cluster.clusterType,
                title: body.cluster.title,
                query: body.cluster.query,
              },
            ],
      selectedCluster: {
        cluster_id: body.cluster.clusterId,
        cluster_type: body.cluster.clusterType,
        title: body.cluster.title,
        query: body.cluster.query,
      },
      senderPolicies: archivePolicies,
      messageOverrides: body.messageOverrides,
    })
    return { result, durationMs: timingMs(startedAt) }
  })()

  const [
    { result: accessContext, durationMs: accessContextMs },
    { result: resolved, durationMs: scopeResolutionMs },
  ] = await Promise.all([accessContextPromise, resolvedPromise])

  if (!resolved.ok) {
    const failedUpdates = archiveSenders.map<ExecutionUpdateSender>((sender) => ({
      senderKey: sender.senderKey,
      sender: sender.sender,
      executionState: 'failed',
      executionSource: 'archive_scope_resolution_failed',
      executionWarning: resolved.error,
      executionMessageCount: 0,
      executionMessageIds: [],
    }))
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: body.cluster,
      senders: failedUpdates,
    })
    return NextResponse.json({
      ok: true,
      data: {
        committed_sender_count: body.senders.length,
        archive_execution: {
          status: 'failed',
          sender_count: archiveSenders.length,
          message_count: 0,
          warning: resolved.error,
        },
      },
    })
  }

  if (!accessContext.ok) {
    const failedUpdates = archiveSenders.map<ExecutionUpdateSender>((sender) => ({
      senderKey: sender.senderKey,
      sender: sender.sender,
      executionState: 'failed',
      executionSource: 'archive_execution_unavailable',
      executionWarning: accessContext.error,
      executionMessageCount: 0,
      executionMessageIds: resolved.data.messageIdsBySender[sender.senderKey] || [],
    }))
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: body.cluster,
      senders: failedUpdates,
    })
    return NextResponse.json({
      ok: true,
      data: {
        committed_sender_count: body.senders.length,
        archive_execution: {
          status: 'failed',
          sender_count: archiveSenders.length,
          message_count: 0,
          warning: accessContext.error,
        },
      },
    })
  }

  const mutationStartedAt = Date.now()
  const mutation = await mutateGmailInboxLabelStateForTenant({
    supabase,
    tenantId,
    messageIds: resolved.data.messageIds,
    removeLabelIds: ['INBOX'],
    logPrefix: '[runtime/gmail-destinations/archive]',
    accessContext: accessContext.data,
  })
  const mutationMs = timingMs(mutationStartedAt)

  if (!mutation.ok) {
    const failedUpdates = archiveSenders.map<ExecutionUpdateSender>((sender) => ({
      senderKey: sender.senderKey,
      sender: sender.sender,
      executionState: 'failed',
      executionSource: 'archive_request_failed',
      executionWarning: mutation.error,
      executionMessageCount: 0,
      executionMessageIds: resolved.data.messageIdsBySender[sender.senderKey] || [],
    }))
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: body.cluster,
      senders: failedUpdates,
    })
    return NextResponse.json({
      ok: true,
      data: {
        committed_sender_count: body.senders.length,
        archive_execution: {
          status: 'failed',
          sender_count: archiveSenders.length,
          message_count: 0,
          warning: mutation.error,
        },
      },
    })
  }

  let verifiedMessageIds = new Set<string>()
  let verificationWarning: string | null =
    mutation.data.partial_failure && mutation.data.failed_message_ids.length > 0
      ? `${mutation.data.failed_message_ids.length.toLocaleString()} messages were rejected during the Gmail archive request.`
      : null

  if (mutation.data.accepted_message_ids.length > 0) {
    const verificationStartedAt = Date.now()
    const verification = await verifyGmailMessagesInboxStateForTenant({
      supabase,
      tenantId,
      messageIds: mutation.data.accepted_message_ids,
      expectInInbox: false,
      logPrefix: '[runtime/gmail-destinations/archive-verify]',
      accessContext: accessContext.data,
      concurrency:
        mutation.data.accepted_message_ids.length > 4_000
          ? 150
          : mutation.data.accepted_message_ids.length > 1_000
            ? 120
            : 80,
      maxAttempts: mutation.data.accepted_message_ids.length > 2_500 ? 1 : 2,
      retryDelayMs: 75,
    })
    const verificationMs = timingMs(verificationStartedAt)

    if (verification.ok) {
      verifiedMessageIds = new Set(verification.data.verified_message_ids)
      if (verification.data.warning) {
        verificationWarning = verification.data.warning
      }
    } else {
      verificationWarning = verification.error
    }

    console.info(
      `[runtime/gmail-destinations/timing] ${JSON.stringify({
        action: 'archive_verify',
        agent_id: body.agentId,
        sender_count: archiveSenders.length,
        accepted_message_count: mutation.data.accepted_message_ids.length,
        duration_ms: verificationMs,
        verified_message_count: verifiedMessageIds.size,
        warning: verificationWarning,
      })}`
    )
  }

  const updates = buildArchiveExecutionUpdates({
    senders: archiveSenders,
    messageIdsBySender: resolved.data.messageIdsBySender,
    acceptedMessageIds: new Set(mutation.data.accepted_message_ids),
    failedMessageIds: new Set(mutation.data.failed_message_ids),
    verifiedMessageIds,
    verificationWarning,
  })

  const executionStateUpdateStartedAt = Date.now()
  await updateDestinationExecutionState({
    supabase,
    agentId: body.agentId,
    sessionId: body.sessionId,
    cluster: body.cluster,
    senders: updates,
  })
  const executionUpdateMs = timingMs(executionStateUpdateStartedAt)

  const summary = summarizeArchiveExecution(updates)

  console.info(
    `[runtime/gmail-destinations/timing] ${JSON.stringify({
      action: 'commit_archive_destinations',
      agent_id: body.agentId,
      committed_sender_count: body.senders.length,
      archive_sender_count: archiveSenders.length,
      persist_ms: persistMs,
      tenant_lookup_ms: tenantLookupMs,
      access_context_ms: accessContextMs,
      scope_resolution_ms: scopeResolutionMs,
      mutation_ms: mutationMs,
      execution_update_ms: executionUpdateMs,
      total_ms: timingMs(routeStartedAt),
      archive_execution_status: summary.status,
      archive_message_count: summary.messageCount,
    })}`
  )

  return NextResponse.json({
    ok: true,
    data: {
      committed_sender_count: body.senders.length,
      archive_execution: {
        status: summary.status,
        sender_count: summary.senderCount,
        message_count: summary.messageCount,
        warning: summary.warning,
      },
    },
  })
}

async function handleRestoreArchiveRequest(
  supabase: AdminSupabase,
  body: RestoreArchiveRequest
): Promise<NextResponse> {
  const routeStartedAt = Date.now()
  const profilePromise = (async () => {
    const startedAt = Date.now()
    const profile = await loadStoredDestinationProfile({
      supabase,
      agentId: body.agentId,
      senderKey: body.senderKey,
    })
    return { profile, durationMs: timingMs(startedAt) }
  })()
  const tenantIdPromise = (async () => {
    const startedAt = Date.now()
    const tenantId = await resolveTenantIdForAgent({
      supabase,
      agentId: body.agentId,
    })
    return { tenantId, durationMs: timingMs(startedAt) }
  })()
  const { profile, durationMs: profileLookupMs } = await profilePromise

  if (!profile || profile.destinationState !== 'ARCHIVE') {
    return NextResponse.json(
      {
        ok: false,
        error: 'An active archive destination profile is required before inbox restore can run.',
      },
      { status: 404 }
    )
  }

  const { tenantId, durationMs: tenantLookupMs } = await tenantIdPromise

  if (!tenantId) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: null,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'archive_restore_unavailable',
          executionWarning:
            'Inbox restore could not run because the Gmail tenant connection was unavailable.',
          executionMessageCount: 0,
          executionMessageIds: profile.executionMessageIds,
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        restore_execution: {
          status: 'failed',
          message_count: 0,
          warning:
            'Inbox restore could not run because the Gmail tenant connection was unavailable.',
          cleared_destination_state: false,
        },
      },
    })
  }

  if (profile.executionMessageIds.length === 0) {
    const warning =
      'This archive entry does not have a stored restore scope yet. Remove the destination state manually or re-archive with the upgraded execution layer.'
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: null,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'archive_restore_scope_missing',
          executionWarning: warning,
          executionMessageCount: 0,
          executionMessageIds: [],
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        restore_execution: {
          status: 'failed',
          message_count: 0,
          warning,
          cleared_destination_state: false,
        },
      },
    })
  }

  const accessContextStartedAt = Date.now()
  const accessContext = await loadGmailAccessContextForTenant({
    supabase,
    tenantId,
    requireModifyScope: true,
    logPrefix: '[runtime/gmail-destinations/archive-restore-auth]',
  })
  const accessContextMs = timingMs(accessContextStartedAt)

  if (!accessContext.ok) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: null,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'archive_restore_unavailable',
          executionWarning: accessContext.error,
          executionMessageCount: 0,
          executionMessageIds: profile.executionMessageIds,
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        restore_execution: {
          status: 'failed',
          message_count: 0,
          warning: accessContext.error,
          cleared_destination_state: false,
        },
      },
    })
  }

  const mutationStartedAt = Date.now()
  const mutation = await mutateGmailInboxLabelStateForTenant({
    supabase,
    tenantId,
    messageIds: profile.executionMessageIds,
    addLabelIds: ['INBOX'],
    logPrefix: '[runtime/gmail-destinations/archive-restore]',
    accessContext: accessContext.data,
  })
  const mutationMs = timingMs(mutationStartedAt)

  if (!mutation.ok) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: null,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'archive_restore_request_failed',
          executionWarning: mutation.error,
          executionMessageCount: 0,
          executionMessageIds: profile.executionMessageIds,
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        restore_execution: {
          status: 'failed',
          message_count: 0,
          warning: mutation.error,
          cleared_destination_state: false,
        },
      },
    })
  }

  const verificationStartedAt = Date.now()
  const verification = await verifyGmailMessagesInboxStateForTenant({
    supabase,
    tenantId,
    messageIds: mutation.data.accepted_message_ids,
    expectInInbox: true,
    logPrefix: '[runtime/gmail-destinations/archive-restore-verify]',
    accessContext: accessContext.data,
    concurrency: mutation.data.accepted_message_ids.length > 1_000 ? 100 : 60,
    maxAttempts: mutation.data.accepted_message_ids.length > 2_500 ? 1 : 2,
    retryDelayMs: 75,
  })
  const verificationMs = timingMs(verificationStartedAt)

  const verifiedMessageIds = verification.ok ? new Set(verification.data.verified_message_ids) : new Set<string>()
  const verifiedCount = countMatchingIds(profile.executionMessageIds, verifiedMessageIds)
  const allVerified = verifiedCount === profile.executionMessageIds.length

  if (allVerified) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: null,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'succeeded',
          executionSource: 'archive_restore_verified',
          executionWarning: null,
          executionMessageCount: verifiedCount,
          executionMessageIds: profile.executionMessageIds,
        },
      ],
    })

    const clearResult = await clearDestinationState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      senderKey: profile.senderKey,
      sender: profile.sender,
      reason:
        'Archive destination was restored to Inbox and removed from the active destination layer.',
    })

    if (!clearResult.ok) {
      const warning =
        'Inbox restore was confirmed, but the archive destination state could not be cleared from management yet.'
      await updateDestinationExecutionState({
        supabase,
        agentId: body.agentId,
        sessionId: body.sessionId,
        cluster: null,
        senders: [
          {
            senderKey: profile.senderKey,
            sender: profile.sender,
            executionState: 'deferred',
            executionSource: 'archive_restore_state_clear_failed',
            executionWarning: warning,
            executionMessageCount: verifiedCount,
            executionMessageIds: profile.executionMessageIds,
          },
        ],
      })
      return NextResponse.json({
        ok: true,
        data: {
          sender_key: profile.senderKey,
          sender: profile.sender,
          restore_execution: {
            status: 'deferred',
            message_count: verifiedCount,
            warning,
            cleared_destination_state: false,
          },
        },
      })
    }

    console.info(
      `[runtime/gmail-destinations/timing] ${JSON.stringify({
        action: 'restore_archive_destination',
        agent_id: body.agentId,
        sender_key: body.senderKey,
        profile_lookup_ms: profileLookupMs,
        tenant_lookup_ms: tenantLookupMs,
        access_context_ms: accessContextMs,
        mutation_ms: mutationMs,
        verification_ms: verificationMs,
        total_ms: timingMs(routeStartedAt),
        restore_status: 'succeeded',
      })}`
    )
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        restore_execution: {
          status: 'succeeded',
          message_count: verifiedCount,
          warning: null,
          cleared_destination_state: true,
        },
      },
    })
  }

  const warning =
    (verification.ok ? verification.data.warning : verification.error) ||
    'Inbox restore could not be confirmed for every targeted message yet.'
  const nextState: GmailDestinationExecutionState =
    mutation.data.failed_message_ids.length === profile.executionMessageIds.length &&
    mutation.data.accepted_count === 0
      ? 'failed'
      : 'deferred'

  await updateDestinationExecutionState({
    supabase,
    agentId: body.agentId,
    sessionId: body.sessionId,
    cluster: null,
    senders: [
      {
        senderKey: profile.senderKey,
        sender: profile.sender,
        executionState: nextState,
        executionSource:
          nextState === 'failed'
            ? 'archive_restore_request_failed'
            : 'archive_restore_verification_pending',
        executionWarning:
          verifiedCount > 0
            ? `Confirmed inbox restore for ${verifiedCount.toLocaleString()} of ${profile.executionMessageIds.length.toLocaleString()} targeted messages. ${warning}`
            : warning,
        executionMessageCount: verifiedCount,
        executionMessageIds: profile.executionMessageIds,
      },
    ],
  })

  console.info(
    `[runtime/gmail-destinations/timing] ${JSON.stringify({
      action: 'restore_archive_destination',
      agent_id: body.agentId,
      sender_key: body.senderKey,
      profile_lookup_ms: profileLookupMs,
      tenant_lookup_ms: tenantLookupMs,
      access_context_ms: accessContextMs,
      mutation_ms: mutationMs,
      verification_ms: verificationMs,
      total_ms: timingMs(routeStartedAt),
      restore_status: nextState,
    })}`
  )

  return NextResponse.json({
    ok: true,
    data: {
      sender_key: profile.senderKey,
      sender: profile.sender,
      restore_execution: {
        status: nextState,
        message_count: verifiedCount,
        warning,
        cleared_destination_state: false,
      },
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = parseRequestBody(await req.json().catch(() => null))
    if (!body || !isUuid(body.agentId)) {
      return NextResponse.json(
        { ok: false, error: 'Valid Gmail destination payload required.' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    if (body.kind === 'restore_archive') {
      return handleRestoreArchiveRequest(supabase, body)
    }

    return handleCommitRequest(supabase, body)
  } catch (error) {
    console.error('[runtime/gmail-destinations] POST failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to process Gmail destination state.' },
      { status: 500 }
    )
  }
}
