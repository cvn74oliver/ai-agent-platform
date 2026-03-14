import type { getSupabaseAdmin } from '@/lib/supabase'
import {
  discoverGmailCleanupClustersForTenant,
  type GmailCleanupDiscoveryData,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import {
  assembleGmailRuntimeState,
  shouldRunGmailCleanupDiscovery,
  type AssembledGmailRuntimeState,
} from '@/lib/runtime/gmailRuntimeAssembler'
import {
  loadPlaygroundRuntimeStateInputsWithTiming,
  type RuntimeApprovalQueueItem,
  type PlaygroundRuntimeStateInputs,
  type RuntimeApprovalQueueSummary,
} from '@/lib/runtime/stateLoaders'
import {
  normalizeOperationsAnalysisScope,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

const CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE = 'runtime_cleanup_discovery_snapshot'
const CLEANUP_DISCOVERY_SNAPSHOT_VERSION = 'gmail.cleanup_profile_cache.v3'
const CLEANUP_PROFILE_CACHE_TTL_MS = 1000 * 60 * 30
const STALE_DISCOVERY_REFRESH_COOLDOWN_MS = 1000 * 60 * 5
const BACKGROUND_CLEANUP_INDEX_SYNC_SKIP_MS = 1000 * 60 * 10
const cleanupDiscoveryAttemptAt = new Map<string, number>()
const cleanupBackgroundRefreshInFlight = new Map<string, Promise<void>>()

export type PlaygroundRuntimeStateServiceResult = {
  runtimeInputs: PlaygroundRuntimeStateInputs
  runtimeState: AssembledGmailRuntimeState
  runtimeApprovalQueueSummary: RuntimeApprovalQueueSummary
  runtimeApprovalQueueItems: RuntimeApprovalQueueItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseDateMs(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function deriveIndexStateActivityMs(value: {
  last_full_scan_at: string | null
  last_incremental_sync_at: string | null
  updated_at: string
} | null): number | null {
  if (!value) return null
  const candidates = [
    parseDateMs(value.last_full_scan_at),
    parseDateMs(value.last_incremental_sync_at),
    parseDateMs(value.updated_at),
  ].filter((entry): entry is number => entry != null)
  if (candidates.length === 0) return null
  return Math.max(...candidates)
}

type CleanupDiscoverySnapshot = {
  cleanupDiscoveryData: GmailCleanupDiscoveryData
  generatedAt: string
  expiresAt: string
  analysisScope: OperationsAnalysisScope
}

function parseCleanupDiscoverySnapshotPayload(value: unknown): CleanupDiscoverySnapshot | null {
  if (!isRecord(value)) return null
  const version =
    typeof value.version === 'string' && value.version.trim() ? value.version.trim() : ''
  if (version !== CLEANUP_DISCOVERY_SNAPSHOT_VERSION) return null

  const generatedAt =
    typeof value.generated_at === 'string' && value.generated_at.trim() ? value.generated_at.trim() : ''
  const expiresAt =
    typeof value.expires_at === 'string' && value.expires_at.trim() ? value.expires_at.trim() : ''
  if (!generatedAt || !expiresAt) return null

  const parsedGeneratedAt = parseDateMs(generatedAt)
  const parsedExpiresAt = parseDateMs(expiresAt)
  if (parsedGeneratedAt == null || parsedExpiresAt == null) return null

  const legacyWindowDays = value.analysis_window_days === 60 ? '60d' : '30d'
  const analysisScope = normalizeOperationsAnalysisScope(
    typeof value.analysis_scope === 'string' && value.analysis_scope.trim()
      ? value.analysis_scope
      : legacyWindowDays
  )
  const discovery = value.cleanup_discovery
  if (!isRecord(discovery)) return null

  const generated = typeof discovery.generated_at === 'string' ? discovery.generated_at.trim() : ''
  const planningMode = discovery.planning_mode
  const safetyDefaults = Array.isArray(discovery.safety_defaults)
    ? discovery.safety_defaults.filter((entry): entry is string => typeof entry === 'string')
    : []
  const clusters = Array.isArray(discovery.clusters) ? discovery.clusters : []

  if (!generated || planningMode !== 'read_only') return null

  return {
    cleanupDiscoveryData: {
      generated_at: generated,
      planning_mode: 'read_only',
      safety_defaults: safetyDefaults,
      clusters: clusters as GmailCleanupDiscoveryData['clusters'],
      mailbox_profile: isRecord(discovery.mailbox_profile)
        ? (discovery.mailbox_profile as GmailCleanupDiscoveryData['mailbox_profile'])
        : undefined,
    },
    generatedAt,
    expiresAt,
    analysisScope,
  }
}

function withMailboxProfileFreshness(params: {
  discoveryData: GmailCleanupDiscoveryData
  freshness: 'fresh' | 'cached' | 'stale'
  generatedAt: string
  expiresAt: string | null
}): GmailCleanupDiscoveryData {
  if (!params.discoveryData.mailbox_profile) return params.discoveryData

  return {
    ...params.discoveryData,
    mailbox_profile: {
      ...params.discoveryData.mailbox_profile,
      freshness: {
        status: params.freshness,
        last_generated_at: params.generatedAt,
        expires_at: params.expiresAt,
        cache_ttl_seconds: Math.floor(CLEANUP_PROFILE_CACHE_TTL_MS / 1000),
      },
    },
  }
}

async function loadLatestCleanupDiscoverySnapshot(params: {
  supabase: SupabaseAdminClient
  agentId: string
  analysisScope: OperationsAnalysisScope
}): Promise<CleanupDiscoverySnapshot | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('payload,created_at')
    .eq('agent_id', params.agentId)
    .eq('event_type', CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.warn('[playground] cleanup snapshot lookup failed (non-fatal):', error)
    return null
  }

  for (const row of (data || []) as Array<{ payload: unknown }>) {
    const payload = (() => {
      if (typeof row.payload === 'string') {
        try {
          return JSON.parse(row.payload)
        } catch {
          return null
        }
      }
      return row.payload
    })()

    const parsed = parseCleanupDiscoverySnapshotPayload(payload)
    if (!parsed) continue
    if (parsed.analysisScope !== params.analysisScope) continue
    return parsed
  }

  return null
}

async function saveCleanupDiscoverySnapshot(params: {
  supabase: SupabaseAdminClient
  agentId: string
  analysisScope: OperationsAnalysisScope
  generatedAt: string
  expiresAt: string
  cleanupDiscoveryData: GmailCleanupDiscoveryData
}): Promise<void> {
  const legacyWindowDays =
    params.analysisScope === 'all_indexed'
      ? null
      : Number.parseInt(params.analysisScope.replace('d', ''), 10) || null
  const payload = {
    version: CLEANUP_DISCOVERY_SNAPSHOT_VERSION,
    generated_at: params.generatedAt,
    expires_at: params.expiresAt,
    analysis_scope: params.analysisScope,
    analysis_window_days: legacyWindowDays,
    cleanup_discovery: params.cleanupDiscoveryData,
  }

  const { error } = await params.supabase.from('agent_events').insert([
    {
      agent_id: params.agentId,
      event_type: CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE,
      created_at: new Date().toISOString(),
      payload,
    },
  ])

  if (error) {
    console.warn('[playground] cleanup snapshot save failed (non-fatal):', error)
  }
}

function queueBackgroundCleanupDiscoveryRefresh(params: {
  supabase: SupabaseAdminClient
  agentId: string
  tenantId: string
  analysisScope: OperationsAnalysisScope
  topSenders: string[]
  snapshotVersionBefore: string | null
  logPrefix: string
}): void {
  const cacheKey = `${params.agentId}:${params.analysisScope}`
  if (cleanupBackgroundRefreshInFlight.has(cacheKey)) {
    return
  }

  const recomputeStartedAt = Date.now()
  const recomputeStartedAtIso = new Date(recomputeStartedAt).toISOString()

  const task = (async () => {
    console.info(
      `[playground][cleanup-regenerate-background] ${JSON.stringify({
        event: 'started',
        agent_id: params.agentId,
        selected_analysis_scope: params.analysisScope,
        snapshot_version_before: params.snapshotVersionBefore,
        snapshot_version_after: params.snapshotVersionBefore,
        previous_snapshot_served_while_refreshing: true,
        recompute_started_at: recomputeStartedAtIso,
        recompute_completed_at: null,
        total_regenerate_background_ms: null,
      })}`
    )

    let snapshotVersionAfter = params.snapshotVersionBefore
    let ok = false
    let errorMessage: string | null = null
    let cleanupDiscoveryDiagnostics: unknown = null
    try {
      const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        topSenders: params.topSenders,
        analysisScope: params.analysisScope,
        logPrefix: params.logPrefix,
        skipIndexSyncIfRecentMs: BACKGROUND_CLEANUP_INDEX_SYNC_SKIP_MS,
        preferExistingIndexedCoverage: true,
        allowFullRescanOnIndexSyncFailure: false,
      })
      if (cleanupDiscovery.ok) {
        cleanupDiscoveryDiagnostics = cleanupDiscovery.diagnostics || null
        const generatedAt = new Date().toISOString()
        const expiresAt = new Date(new Date(generatedAt).getTime() + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString()
        snapshotVersionAfter = generatedAt
        await saveCleanupDiscoverySnapshot({
          supabase: params.supabase,
          agentId: params.agentId,
          analysisScope: params.analysisScope,
          generatedAt,
          expiresAt,
          cleanupDiscoveryData: cleanupDiscovery.data,
        })
        ok = true
      } else {
        errorMessage = cleanupDiscovery.error
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'background_recompute_failed'
    }

    const recomputeCompletedAt = Date.now()
    const recomputeCompletedAtIso = new Date(recomputeCompletedAt).toISOString()
    console.info(
      `[playground][cleanup-regenerate-background] ${JSON.stringify({
        event: 'completed',
        ok,
        error: errorMessage,
        agent_id: params.agentId,
        selected_analysis_scope: params.analysisScope,
        snapshot_version_before: params.snapshotVersionBefore,
        snapshot_version_after: snapshotVersionAfter,
        previous_snapshot_served_while_refreshing: true,
        recompute_started_at: recomputeStartedAtIso,
        recompute_completed_at: recomputeCompletedAtIso,
        total_regenerate_background_ms: Math.max(0, recomputeCompletedAt - recomputeStartedAt),
        cleanup_discovery_diagnostics: cleanupDiscoveryDiagnostics,
      })}`
    )
  })().finally(() => {
    cleanupBackgroundRefreshInFlight.delete(cacheKey)
  })

  cleanupBackgroundRefreshInFlight.set(cacheKey, task)
}

async function loadTenantIdForUser(params: {
  supabase: SupabaseAdminClient
  userId: string | null
}): Promise<string | null> {
  if (!params.userId) return null

  const { data, error } = await params.supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (error) {
    console.warn('[playground] tenant_id lookup failed (non-fatal):', error)
    return null
  }

  const tenantId =
    isRecord(data) && typeof data.tenant_id === 'string' ? data.tenant_id.trim() : ''
  return tenantId || null
}

function deriveRuntimeApprovalQueueItems(params: {
  runtimeSuggestionHistory: PlaygroundRuntimeStateInputs['runtimeSuggestionHistory']
  sessionScopeId?: string | null
}): RuntimeApprovalQueueItem[] {
  const items: RuntimeApprovalQueueItem[] = []

  for (const request of params.runtimeSuggestionHistory.requests) {
    if (params.sessionScopeId) {
      if (!request.session_id || request.session_id !== params.sessionScopeId) continue
    }

    const approvalId = request.approval_id
    let status: RuntimeApprovalQueueItem['status'] = 'pending_approval'
    if (params.runtimeSuggestionHistory.executed_approvals.has(approvalId)) {
      status = 'executed'
    } else {
      const decision = params.runtimeSuggestionHistory.latest_decision_by_approval.get(approvalId)
      if (decision === 'approved') status = 'approved'
      else if (decision === 'rejected') status = 'rejected'
    }

    items.push({
      approval_id: approvalId,
      created_at: request.created_at,
      ...(request.session_id ? { session_id: request.session_id } : {}),
      ...(request.user_request ? { user_request: request.user_request } : {}),
      status,
      proposed_actions: request.proposed_actions,
    })
  }

  return items
}

function deriveRuntimeApprovalQueueSummary(params: {
  queueItems: RuntimeApprovalQueueItem[]
  sessionScopeId?: string | null
}): RuntimeApprovalQueueSummary {
  const scope: RuntimeApprovalQueueSummary['scope'] = params.sessionScopeId ? 'session' : 'agent'
  let pending = 0
  let approved = 0
  let executed = 0
  let rejected = 0
  const pendingApprovalIds: string[] = []
  const approvedApprovalIds: string[] = []

  for (const item of params.queueItems) {
    if (item.status === 'pending_approval') {
      pending += 1
      pendingApprovalIds.push(item.approval_id)
      continue
    }
    if (item.status === 'approved') {
      approved += 1
      approvedApprovalIds.push(item.approval_id)
      continue
    }
    if (item.status === 'executed') {
      executed += 1
      continue
    }
    rejected += 1
  }

  return {
    pending,
    approved,
    executed,
    rejected,
    pending_approval_ids: pendingApprovalIds,
    approved_approval_ids: approvedApprovalIds,
    scope,
    ...(scope === 'session' && params.sessionScopeId
      ? { scope_session_id: params.sessionScopeId }
      : {}),
  }
}

export async function loadPlaygroundRuntimeState(params: {
  supabase: SupabaseAdminClient
  agentId: string
  agentUserId: string | null
  sessionScopeId?: string | null
  isInboxCleanupIntent: boolean
  forceMailboxProfileRefresh?: boolean
  analysisScope?: OperationsAnalysisScope
  requestMode?: 'rehydrate_only' | 'full_chat'
}): Promise<PlaygroundRuntimeStateServiceResult> {
  const runtimeStateStartedAt = Date.now()
  let cleanupProfileStatus: 'none' | 'fresh' | 'cached' | 'stale' = 'none'
  let cleanupSnapshotClusterCount = 0
  let cleanupIndexStateIndexedCount = 0
  let cleanupIndexStateInboxCount = 0
  let cleanupProfileRefreshReason:
    | 'none'
    | 'force'
    | 'force_background'
    | 'full_chat'
    | 'stale_snapshot'
    | 'index_advanced'
    | 'missing_snapshot'
    | 'zero_cluster_cached'
    | 'rehydrate_skip' = 'none'
  let selectedAnalysisScope: OperationsAnalysisScope | null = null
  let snapshotScope: OperationsAnalysisScope | null = null
  let reviewScope: OperationsAnalysisScope | null = null
  let effectiveDiscoveryWindowDays: string | number | null = null
  let cleanupPlanDetailMs: Record<string, unknown> | null = null
  let snapshotVersionBefore: string | null = null
  let snapshotVersionAfter: string | null = null
  let previousSnapshotServedWhileRefreshing = false
  const phaseMs = {
    inbox_cleanup_intent_gate_ms: 0,
    analyze_inbox_evidence_ms: 0,
    sender_cluster_review_ms: 0,
    query_cluster_review_ms: 0,
    archive_evidence_ms: 0,
    review_results_ms: 0,
    suggestion_history_ms: 0,
    cleanup_plan_ms: 0,
    batch_suggestions_ms: 0,
    other_runtime_state_ms: 0,
    runtime_state_total_ms: 0,
  }

  const runtimeInputsStartedAt = Date.now()
  const loadedRuntimeInputs = await loadPlaygroundRuntimeStateInputsWithTiming({
    supabase: params.supabase,
    agentId: params.agentId,
  })
  let runtimeInputs = loadedRuntimeInputs.runtimeInputs

  if (params.sessionScopeId) {
    const scopedApprovalIds = new Set<string>()
    for (const request of runtimeInputs.runtimeSuggestionHistory.requests) {
      if (request.session_id && request.session_id === params.sessionScopeId) {
        scopedApprovalIds.add(request.approval_id)
      }
    }

    const filterEvidenceForScope = <T extends { approval_id: string }>(value: T | null): T | null => {
      if (!value) return null
      const approvalId = typeof value.approval_id === 'string' ? value.approval_id.trim() : ''
      if (!approvalId) return null
      return scopedApprovalIds.has(approvalId) ? value : null
    }

    runtimeInputs = {
      ...runtimeInputs,
      runtimeEvidence: filterEvidenceForScope(runtimeInputs.runtimeEvidence),
      latestRuntimeReviewEvidence: filterEvidenceForScope(runtimeInputs.latestRuntimeReviewEvidence),
      latestRuntimeQueryReviewEvidence: filterEvidenceForScope(
        runtimeInputs.latestRuntimeQueryReviewEvidence
      ),
      latestRuntimeArchiveEvidence: filterEvidenceForScope(runtimeInputs.latestRuntimeArchiveEvidence),
      reviewResults: runtimeInputs.reviewResults.filter((result) => {
        const approvalId =
          typeof result.approval_id === 'string' ? result.approval_id.trim() : ''
        return approvalId.length > 0 && scopedApprovalIds.has(approvalId)
      }),
    }
  }

  const runtimeApprovalQueueItems = deriveRuntimeApprovalQueueItems({
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    sessionScopeId: params.sessionScopeId,
  })
  const runtimeApprovalQueueSummary = deriveRuntimeApprovalQueueSummary({
    queueItems: runtimeApprovalQueueItems,
    sessionScopeId: params.sessionScopeId,
  })
  phaseMs.analyze_inbox_evidence_ms = loadedRuntimeInputs.timingMs.analyze_inbox_evidence_ms
  phaseMs.sender_cluster_review_ms = loadedRuntimeInputs.timingMs.sender_cluster_review_ms
  phaseMs.query_cluster_review_ms = loadedRuntimeInputs.timingMs.query_cluster_review_ms
  phaseMs.archive_evidence_ms = loadedRuntimeInputs.timingMs.archive_evidence_ms
  phaseMs.review_results_ms = loadedRuntimeInputs.timingMs.review_results_ms
  phaseMs.suggestion_history_ms = loadedRuntimeInputs.timingMs.suggestion_history_ms
  const runtimeInputsTotalMs = Date.now() - runtimeInputsStartedAt

  const assembleInitialStartedAt = Date.now()
  let runtimeState = assembleGmailRuntimeState({
    runtimeEvidence: runtimeInputs.runtimeEvidence,
    latestRuntimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
    latestRuntimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
    latestRuntimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    cleanupDiscoveryData: null,
  })
  phaseMs.batch_suggestions_ms += Date.now() - assembleInitialStartedAt

  const intentGateStartedAt = Date.now()
  const shouldRunCleanupDiscovery = shouldRunGmailCleanupDiscovery({
    runtimeEvidence: runtimeInputs.runtimeEvidence,
    runtimeReviewEvidence: runtimeState.runtimeReviewEvidence,
    runtimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
    runtimeArchiveEvidence: runtimeState.runtimeArchiveEvidence,
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    isInboxCleanupIntent: params.isInboxCleanupIntent,
  })
  phaseMs.inbox_cleanup_intent_gate_ms = Date.now() - intentGateStartedAt

  if (shouldRunCleanupDiscovery) {
    const cleanupPlanStartedAt = Date.now()
    const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
    selectedAnalysisScope = analysisScope
    reviewScope = analysisScope
    const cacheKey = `${params.agentId}:${analysisScope}`
    const now = Date.now()
    const forceRefresh = params.forceMailboxProfileRefresh === true
    const snapshot = await loadLatestCleanupDiscoverySnapshot({
      supabase: params.supabase,
      agentId: params.agentId,
      analysisScope,
    })
    snapshotScope = snapshot?.analysisScope ?? null

    const snapshotGeneratedMs = snapshot ? parseDateMs(snapshot.generatedAt) : null
    const snapshotExpiresMs = snapshot ? parseDateMs(snapshot.expiresAt) : null
    const hasFreshSnapshot = Boolean(snapshot && snapshotExpiresMs != null && snapshotExpiresMs > now)
    const hasSnapshot = Boolean(snapshot)
    const snapshotClusterCount = snapshot?.cleanupDiscoveryData.clusters.length ?? 0
    snapshotVersionBefore = snapshot?.generatedAt ?? null
    cleanupSnapshotClusterCount = snapshotClusterCount
    const tenantId = await loadTenantIdForUser({
      supabase: params.supabase,
      userId: params.agentUserId,
    })
    const [indexState, indexCoverage] = tenantId
      ? await Promise.all([
          loadGmailMailboxIndexState({
            supabase: params.supabase,
            tenantId,
          }),
          loadGmailMailboxIndexCoverageForTenant({
            supabase: params.supabase,
            tenantId,
          }),
        ])
      : [null, null]
    cleanupIndexStateIndexedCount =
      indexCoverage && Number.isFinite(indexCoverage.indexed_total_rows)
        ? indexCoverage.indexed_total_rows
        : indexState && Number.isFinite(indexState.indexed_message_count)
          ? indexState.indexed_message_count
          : 0
    cleanupIndexStateInboxCount =
      indexCoverage && Number.isFinite(indexCoverage.indexed_inbox_rows)
        ? indexCoverage.indexed_inbox_rows
        : 0
    const indexActivityMs = deriveIndexStateActivityMs(indexState)
    const indexHasData = cleanupIndexStateIndexedCount > 0
    const indexAdvancedSinceSnapshot = Boolean(
      indexHasData &&
      indexActivityMs != null &&
      (snapshotGeneratedMs == null || indexActivityMs > snapshotGeneratedMs + 1000)
    )
    const zeroClusterCachedSnapshotNeedsRefresh = Boolean(
      hasSnapshot && hasFreshSnapshot && indexHasData && snapshotClusterCount === 0
    )
    const staleSnapshotNeedsRefresh = Boolean(hasSnapshot && !hasFreshSnapshot)
    const missingSnapshotNeedsRefresh = !hasSnapshot
    const allowDiscoveryRefresh =
      forceRefresh ||
      params.requestMode !== 'rehydrate_only' ||
      indexAdvancedSinceSnapshot ||
      zeroClusterCachedSnapshotNeedsRefresh ||
      staleSnapshotNeedsRefresh ||
      missingSnapshotNeedsRefresh

    const canServeSnapshotAndRefreshInBackground = Boolean(
      forceRefresh &&
        params.requestMode === 'rehydrate_only' &&
        tenantId &&
        snapshot &&
        hasFreshSnapshot
    )

    if (forceRefresh) cleanupProfileRefreshReason = 'force'
    else if (params.requestMode !== 'rehydrate_only') cleanupProfileRefreshReason = 'full_chat'
    else if (indexAdvancedSinceSnapshot) cleanupProfileRefreshReason = 'index_advanced'
    else if (zeroClusterCachedSnapshotNeedsRefresh) cleanupProfileRefreshReason = 'zero_cluster_cached'
    else if (staleSnapshotNeedsRefresh) cleanupProfileRefreshReason = 'stale_snapshot'
    else if (missingSnapshotNeedsRefresh) cleanupProfileRefreshReason = 'missing_snapshot'
    else cleanupProfileRefreshReason = 'rehydrate_skip'
    let cleanupDiscoveryData: GmailCleanupDiscoveryData | null = null

    if (canServeSnapshotAndRefreshInBackground && snapshot && tenantId) {
      cleanupProfileRefreshReason = 'force_background'
      cleanupDiscoveryData = withMailboxProfileFreshness({
        discoveryData: snapshot.cleanupDiscoveryData,
        freshness: 'cached',
        generatedAt: snapshot.generatedAt,
        expiresAt: snapshot.expiresAt,
      })
      cleanupProfileStatus = 'cached'
      previousSnapshotServedWhileRefreshing = true
      queueBackgroundCleanupDiscoveryRefresh({
        supabase: params.supabase,
        agentId: params.agentId,
        tenantId,
        analysisScope,
        topSenders:
          runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) || [],
        snapshotVersionBefore,
        logPrefix: '[playground/cleanup-discovery/background]',
      })
    } else if (
      !forceRefresh &&
      snapshot &&
      hasFreshSnapshot &&
      !indexAdvancedSinceSnapshot &&
      !zeroClusterCachedSnapshotNeedsRefresh
    ) {
      cleanupDiscoveryData = withMailboxProfileFreshness({
        discoveryData: snapshot.cleanupDiscoveryData,
        freshness: 'cached',
        generatedAt: snapshot.generatedAt,
        expiresAt: snapshot.expiresAt,
      })
      cleanupProfileStatus = 'cached'
    } else if (snapshot && !allowDiscoveryRefresh) {
      cleanupDiscoveryData = withMailboxProfileFreshness({
        discoveryData: snapshot.cleanupDiscoveryData,
        freshness: 'stale',
        generatedAt: snapshotGeneratedMs != null ? snapshot.generatedAt : snapshot.cleanupDiscoveryData.generated_at,
        expiresAt: snapshotExpiresMs != null ? snapshot.expiresAt : null,
      })
      cleanupProfileStatus = 'stale'
    } else if (allowDiscoveryRefresh) {
      if (tenantId) {
        const canAttemptRefresh =
          forceRefresh ||
          zeroClusterCachedSnapshotNeedsRefresh ||
          indexAdvancedSinceSnapshot ||
          !cleanupDiscoveryAttemptAt.has(cacheKey) ||
          now - (cleanupDiscoveryAttemptAt.get(cacheKey) || 0) > STALE_DISCOVERY_REFRESH_COOLDOWN_MS

        if (canAttemptRefresh) {
          cleanupDiscoveryAttemptAt.set(cacheKey, now)
          const topSenders =
            runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) || []
          const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
            supabase: params.supabase,
            tenantId,
            topSenders,
            analysisScope,
            logPrefix: '[playground/cleanup-discovery]',
          })

          if (cleanupDiscovery.ok) {
            cleanupPlanDetailMs =
              cleanupDiscovery.diagnostics
                ? {
                    ...cleanupDiscovery.diagnostics,
                  }
                : null
            const generatedAt = new Date().toISOString()
            const expiresAt = new Date(generatedAt).getTime() + CLEANUP_PROFILE_CACHE_TTL_MS
            const expiresAtIso = new Date(expiresAt).toISOString()
            snapshotVersionAfter = generatedAt
            cleanupDiscoveryData = withMailboxProfileFreshness({
              discoveryData: cleanupDiscovery.data,
              freshness: 'fresh',
              generatedAt,
              expiresAt: expiresAtIso,
            })
            cleanupProfileStatus = 'fresh'
            await saveCleanupDiscoverySnapshot({
              supabase: params.supabase,
              agentId: params.agentId,
              analysisScope,
              generatedAt,
              expiresAt: expiresAtIso,
              cleanupDiscoveryData: cleanupDiscovery.data,
            })
          } else {
            console.warn('[playground] cleanup discovery failed (non-fatal):', cleanupDiscovery.error)
          }
        }
      }
    }

    if (!cleanupDiscoveryData && snapshot) {
      cleanupDiscoveryData = withMailboxProfileFreshness({
        discoveryData: snapshot.cleanupDiscoveryData,
        freshness: 'stale',
        generatedAt: snapshotGeneratedMs != null ? snapshot.generatedAt : snapshot.cleanupDiscoveryData.generated_at,
        expiresAt: snapshotExpiresMs != null ? snapshot.expiresAt : null,
      })
      cleanupProfileStatus = 'stale'
    }

    if (cleanupDiscoveryData) {
      const assembleWithCleanupStartedAt = Date.now()
      runtimeState = assembleGmailRuntimeState({
        runtimeEvidence: runtimeInputs.runtimeEvidence,
        latestRuntimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
        latestRuntimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
        latestRuntimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
        runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
        cleanupDiscoveryData,
      })
      phaseMs.batch_suggestions_ms += Date.now() - assembleWithCleanupStartedAt
      effectiveDiscoveryWindowDays =
        runtimeState.runtimeMailboxProfile?.cluster_diagnostics?.source_counts.discovery_window_days ??
        runtimeState.runtimeMailboxProfile?.analysis_window_days ??
        null
    }
    phaseMs.cleanup_plan_ms = Date.now() - cleanupPlanStartedAt
  }

  phaseMs.runtime_state_total_ms = Date.now() - runtimeStateStartedAt
  const knownMs =
    phaseMs.inbox_cleanup_intent_gate_ms +
    phaseMs.analyze_inbox_evidence_ms +
    phaseMs.sender_cluster_review_ms +
    phaseMs.query_cluster_review_ms +
    phaseMs.archive_evidence_ms +
    phaseMs.suggestion_history_ms +
    phaseMs.cleanup_plan_ms +
    phaseMs.batch_suggestions_ms
  phaseMs.other_runtime_state_ms = Math.max(0, phaseMs.runtime_state_total_ms - knownMs)

  console.info(
    `[playground][runtime-state-timing] ${JSON.stringify({
      request_mode: params.requestMode ?? 'unknown',
      cleanup_profile_status: cleanupProfileStatus,
      cleanup_profile_refresh_reason: cleanupProfileRefreshReason,
      cleanup_cluster_count: runtimeState.runtimeCleanupPlan?.clusters.length ?? 0,
      cleanup_snapshot_cluster_count: cleanupSnapshotClusterCount,
      cleanup_index_state_indexed_count: cleanupIndexStateIndexedCount,
      cleanup_index_state_inbox_count: cleanupIndexStateInboxCount,
      selected_analysis_scope: selectedAnalysisScope,
      snapshot_scope: snapshotScope,
      review_scope: reviewScope,
      effective_discovery_window_days: effectiveDiscoveryWindowDays,
      snapshot_version_before: snapshotVersionBefore,
      snapshot_version_after: snapshotVersionAfter,
      previous_snapshot_served_while_refreshing: previousSnapshotServedWhileRefreshing,
      approval_queue_item_count: runtimeApprovalQueueItems.length,
      approval_queue_pending_count: runtimeApprovalQueueSummary.pending,
      runtime_inputs_total_ms: runtimeInputsTotalMs,
      phases_ms: phaseMs,
      cleanup_plan_detail_ms: cleanupPlanDetailMs,
    })}`
  )
  console.info(
    `[playground][cleanup-scope] ${JSON.stringify({
      request_mode: params.requestMode ?? 'unknown',
      selected_analysis_scope: selectedAnalysisScope,
      effective_discovery_window_days: effectiveDiscoveryWindowDays,
      snapshot_scope: snapshotScope,
      review_scope: reviewScope,
      cleanup_cluster_count: runtimeState.runtimeCleanupPlan?.clusters.length ?? 0,
    })}`
  )

  return {
    runtimeInputs,
    runtimeState,
    runtimeApprovalQueueSummary,
    runtimeApprovalQueueItems,
  }
}
