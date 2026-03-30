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
import {
  buildGmailCleanupWorkflowClusterPayload,
  type GmailCleanupWorkflowClusterPayload,
  type GmailCleanupMemoryWritePayload,
  type GmailDestinationExecutionState,
  type GmailDestinationState,
  type GmailSenderPolicy,
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
  cluster: GmailCleanupWorkflowClusterPayload
  allClusters: GmailCleanupWorkflowClusterPayload[]
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

type PushArchiveRequest = {
  kind: 'push_archive'
  agentId: string
  sessionId: string | null
  senderKey: string
  sender: string
  analysisScope: string | null
}

type DestinationRequest = DestinationCommitRequest | RestoreArchiveRequest | PushArchiveRequest

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
  executionSource: string | null
  executionWarning: string | null
  executionMessageIds: string[]
  cluster: GmailCleanupMemoryWritePayload['cluster']
}

function timingMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt)
}

function parseCommitRequest(value: Record<string, unknown>): DestinationCommitRequest | null {
  const agentId = normalizeText(value.agentId)
  if (!agentId) return null

  const sessionId = normalizeText(value.sessionId) || null

  const cluster = normalizeCluster(value.cluster)
  if (!cluster) return null

  const allClusters = Array.isArray(value.allClusters)
    ? value.allClusters
        .map((entry) => normalizeCluster(entry))
        .filter((entry): entry is GmailCleanupWorkflowClusterPayload => entry != null)
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

function parsePushArchiveRequest(value: Record<string, unknown>): PushArchiveRequest | null {
  const agentId = normalizeText(value.agentId)
  const senderKey = normalizeText(value.senderKey)
  const sender = normalizeText(value.sender)
  if (!agentId || !senderKey || !sender) return null

  return {
    kind: 'push_archive',
    agentId,
    sessionId: normalizeText(value.sessionId) || null,
    senderKey,
    sender,
    analysisScope: normalizeText(value.analysisScope) || null,
  }
}

function parseRequestBody(value: unknown): DestinationRequest | null {
  if (!isRecord(value)) return null
  if (normalizeText(value.action) === 'push_archive') {
    return parsePushArchiveRequest(value)
  }
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

function normalizeCluster(
  value: unknown
): GmailCleanupMemoryWritePayload['cluster'] {
  if (
    !isRecord(value) ||
    typeof value.clusterId !== 'string' ||
    typeof value.clusterType !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.query !== 'string'
  ) {
    return null
  }

  return buildGmailCleanupWorkflowClusterPayload({
    cluster: {
      clusterId: normalizeText(value.clusterId),
      canonicalClusterId: normalizeText(value.canonicalClusterId) || null,
      legacyClusterIds: normalizeStringArray(value.legacyClusterIds),
      sourceClusterIds: normalizeStringArray(value.sourceClusterIds),
      clusterType: normalizeText(value.clusterType),
      title: normalizeText(value.title),
      query: normalizeText(value.query),
    },
    reviewUnitKey: normalizeText(value.reviewUnitKey) || null,
  })
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
  const executionState = normalizeExecutionState(meta.execution_state) || 'deferred'
  if (!senderKey || !sender || !destinationState) return null

  return {
    senderKey,
    sender,
    destinationState,
    executionState,
    executionSource: normalizeText(meta.execution_source) || null,
    executionWarning: normalizeText(meta.execution_warning) || null,
    executionMessageIds: normalizeStringArray(meta.execution_message_ids),
    cluster: normalizeCluster(meta.cluster),
  }
}

function countMatchingIds(ids: string[], set: Set<string>): number {
  let count = 0
  for (const id of ids) {
    if (set.has(id)) count += 1
  }
  return count
}

async function handleCommitRequest(
  supabase: AdminSupabase,
  body: DestinationCommitRequest
): Promise<NextResponse> {
  const startedAt = Date.now()
  const persistResult = await persistGmailCleanupMemory({
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

  if (!persistResult.ok) {
    return NextResponse.json({ ok: false, error: persistResult.error }, { status: 500 })
  }

  console.info(
    `[runtime/gmail-destinations/timing] ${JSON.stringify({
      action: 'commit_destinations_only',
      agent_id: body.agentId,
      committed_sender_count: body.senders.length,
      duration_ms: timingMs(startedAt),
    })}`
  )

  return NextResponse.json({
    ok: true,
    data: {
      committed_sender_count: body.senders.length,
      archive_execution: {
        status: 'not_applicable',
        sender_count: 0,
        message_count: 0,
        warning: 'Destination state was saved only. Push archive work from Management to execute Gmail changes.',
      },
    },
  })
}

async function handlePushArchiveRequest(
  supabase: AdminSupabase,
  body: PushArchiveRequest
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
        error: 'An active archive destination profile is required before Gmail archive can run.',
      },
      { status: 404 }
    )
  }

  if (profile.executionState === 'pending' && profile.executionSource === 'push_requested') {
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        archive_execution: {
          status: 'pending',
          message_count: profile.executionMessageIds.length,
          warning: profile.executionWarning,
        },
      },
    })
  }

  if (profile.executionState === 'succeeded' && profile.executionSource === 'verified_applied') {
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        archive_execution: {
          status: 'succeeded',
          message_count: profile.executionMessageIds.length,
          warning: profile.executionWarning,
        },
      },
    })
  }

  if (!profile.cluster) {
    const warning =
      'This archive destination does not have enough stored cluster context to resolve a safe Gmail push scope.'
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
          executionSource: 'sync_mismatch_or_failed',
          executionWarning: warning,
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
        archive_execution: {
          status: 'failed',
          message_count: 0,
          warning,
        },
      },
    })
  }

  const { tenantId, durationMs: tenantLookupMs } = await tenantIdPromise

  if (!tenantId) {
    const warning =
      'Archive push could not run because the Gmail tenant connection was unavailable.'
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'sync_mismatch_or_failed',
          executionWarning: warning,
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
        archive_execution: {
          status: 'failed',
          message_count: 0,
          warning,
        },
      },
    })
  }

  const resolutionStartedAt = Date.now()
  const resolution = await resolveGmailSenderPolicyArchiveScopeForTenant({
    supabase,
    tenantId,
    analysisScope: normalizeMailboxProfileScope(body.analysisScope),
    clusters: [
      {
        cluster_id: profile.cluster.clusterId,
        cluster_type: profile.cluster.clusterType,
        title: profile.cluster.title,
        query: profile.cluster.query,
      },
    ],
    selectedCluster: {
      cluster_id: profile.cluster.clusterId,
      cluster_type: profile.cluster.clusterType,
      title: profile.cluster.title,
      query: profile.cluster.query,
    },
    senderPolicies: {
      [profile.senderKey]: 'archive',
    },
    messageOverrides: {},
  })
  const scopeResolutionMs = timingMs(resolutionStartedAt)

  if (!resolution.ok) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'sync_mismatch_or_failed',
          executionWarning: resolution.error,
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
        archive_execution: {
          status: 'failed',
          message_count: 0,
          warning: resolution.error,
        },
      },
    })
  }

  const targetedMessageIds = resolution.data.messageIdsBySender[profile.senderKey] || []

  await updateDestinationExecutionState({
    supabase,
    agentId: body.agentId,
    sessionId: body.sessionId,
    cluster: profile.cluster,
    senders: [
      {
        senderKey: profile.senderKey,
        sender: profile.sender,
        executionState: 'pending',
        executionSource: 'push_requested',
        executionWarning: null,
        executionMessageCount: targetedMessageIds.length,
        executionMessageIds: targetedMessageIds,
      },
    ],
  })

  if (targetedMessageIds.length === 0) {
    const warning = 'No inbox-visible messages remained for this sender, so Gmail already matches the stored archive destination.'
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'succeeded',
          executionSource: 'verified_applied',
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
        archive_execution: {
          status: 'succeeded',
          message_count: 0,
          warning,
        },
      },
    })
  }

  const accessContextStartedAt = Date.now()
  const accessContext = await loadGmailAccessContextForTenant({
    supabase,
    tenantId,
    requireModifyScope: true,
    logPrefix: '[runtime/gmail-destinations/archive-auth]',
  })
  const accessContextMs = timingMs(accessContextStartedAt)

  if (!accessContext.ok) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'sync_mismatch_or_failed',
          executionWarning: accessContext.error,
          executionMessageCount: 0,
          executionMessageIds: targetedMessageIds,
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        archive_execution: {
          status: 'failed',
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
    messageIds: targetedMessageIds,
    removeLabelIds: ['INBOX'],
    logPrefix: '[runtime/gmail-destinations/archive]',
    accessContext: accessContext.data,
  })
  const mutationMs = timingMs(mutationStartedAt)

  if (!mutation.ok) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'failed',
          executionSource: 'sync_mismatch_or_failed',
          executionWarning: mutation.error,
          executionMessageCount: 0,
          executionMessageIds: targetedMessageIds,
        },
      ],
    })
    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        archive_execution: {
          status: 'failed',
          message_count: 0,
          warning: mutation.error,
        },
      },
    })
  }

  let verificationWarning: string | null =
    mutation.data.partial_failure && mutation.data.failed_message_ids.length > 0
      ? `${mutation.data.failed_message_ids.length.toLocaleString()} messages were rejected during the Gmail archive request.`
      : null
  let verifiedMessageIds = new Set<string>()

  if (mutation.data.accepted_message_ids.length > 0) {
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

    if (verification.ok) {
      verifiedMessageIds = new Set(verification.data.verified_message_ids)
      if (verification.data.warning) verificationWarning = verification.data.warning
    } else {
      verificationWarning = verification.error
    }
  }

  const verifiedCount = countMatchingIds(targetedMessageIds, verifiedMessageIds)
  const allVerified = verifiedCount === targetedMessageIds.length

  if (allVerified) {
    await updateDestinationExecutionState({
      supabase,
      agentId: body.agentId,
      sessionId: body.sessionId,
      cluster: profile.cluster,
      senders: [
        {
          senderKey: profile.senderKey,
          sender: profile.sender,
          executionState: 'succeeded',
          executionSource: 'verified_applied',
          executionWarning: null,
          executionMessageCount: verifiedCount,
          executionMessageIds: targetedMessageIds,
        },
      ],
    })

    console.info(
      `[runtime/gmail-destinations/timing] ${JSON.stringify({
        action: 'push_archive_destination',
        agent_id: body.agentId,
        sender_key: body.senderKey,
        profile_lookup_ms: profileLookupMs,
        tenant_lookup_ms: tenantLookupMs,
        scope_resolution_ms: scopeResolutionMs,
        access_context_ms: accessContextMs,
        mutation_ms: mutationMs,
        total_ms: timingMs(routeStartedAt),
        archive_execution_status: 'succeeded',
        archive_message_count: verifiedCount,
      })}`
    )

    return NextResponse.json({
      ok: true,
      data: {
        sender_key: profile.senderKey,
        sender: profile.sender,
        archive_execution: {
          status: 'succeeded',
          message_count: verifiedCount,
          warning: null,
        },
      },
    })
  }

  const nextState: GmailDestinationExecutionState =
    mutation.data.failed_message_ids.length === targetedMessageIds.length &&
    mutation.data.accepted_count === 0
      ? 'failed'
      : 'deferred'
  const warning =
    (verifiedCount > 0
      ? `Confirmed archive for ${verifiedCount.toLocaleString()} of ${targetedMessageIds.length.toLocaleString()} targeted messages. `
      : '') +
    (verificationWarning || 'Inbox removal could not be fully verified for this sender yet.')

  await updateDestinationExecutionState({
    supabase,
    agentId: body.agentId,
    sessionId: body.sessionId,
    cluster: profile.cluster,
    senders: [
      {
        senderKey: profile.senderKey,
        sender: profile.sender,
        executionState: nextState,
        executionSource: 'sync_mismatch_or_failed',
        executionWarning: warning.trim(),
        executionMessageCount: verifiedCount,
        executionMessageIds: targetedMessageIds,
      },
    ],
  })

  console.info(
    `[runtime/gmail-destinations/timing] ${JSON.stringify({
      action: 'push_archive_destination',
      agent_id: body.agentId,
      sender_key: body.senderKey,
      profile_lookup_ms: profileLookupMs,
      tenant_lookup_ms: tenantLookupMs,
      scope_resolution_ms: scopeResolutionMs,
      access_context_ms: accessContextMs,
      mutation_ms: mutationMs,
      total_ms: timingMs(routeStartedAt),
      archive_execution_status: nextState,
      archive_message_count: verifiedCount,
    })}`
  )

  return NextResponse.json({
    ok: true,
    data: {
      sender_key: profile.senderKey,
      sender: profile.sender,
      archive_execution: {
        status: nextState,
        message_count: verifiedCount,
        warning: warning.trim(),
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
          executionSource: 'sync_mismatch_or_failed',
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
          executionSource: 'sync_mismatch_or_failed',
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
          executionSource: 'sync_mismatch_or_failed',
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
          executionSource: 'sync_mismatch_or_failed',
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
          executionSource: 'reversed',
          executionWarning: null,
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
          cleared_destination_state: false,
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
          'sync_mismatch_or_failed',
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

    if (body.kind === 'push_archive') {
      return handlePushArchiveRequest(supabase, body)
    }

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
