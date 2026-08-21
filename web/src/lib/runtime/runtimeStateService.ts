import type { getSupabaseAdmin } from '@/lib/supabase'
import {
  discoverGmailCleanupClustersForTenant,
  type GmailCleanupCluster,
  type GmailCleanupDiscoveryData,
  type GmailMailboxProfile,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS,
  loadGmailArtifactPublicationStatesForTenant,
  loadSelectedClusterRailFamily,
  loadPublishedGmailMailboxIntelligenceArtifact,
  type GmailArtifactPublicationRow,
  type GmailArtifactAnalysisScope,
  type GmailClusterSummaryArtifactRow,
  type SelectedClusterRailSnapshotScopeFallback,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import { isGmailArtifactFlagEnabled } from '@/lib/integrations/gmail/gmailArtifactFlags'
import {
  buildMailboxIntelligenceFromPublishedArtifactRead,
  loadGmailMailboxIntelligenceForTenant,
  loadGmailSenderWorkspaceForTenant,
} from '@/lib/integrations/gmail/gmailCleanupWorkspace'
import { loadGmailMailboxIndexState } from '@/lib/integrations/gmail/gmailMailboxIndexer'
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
import type {
  GmailMailboxIntelligenceData,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { resolveCleanupClusterIdentity } from '@/lib/runtime/gmailCleanupClusterIdentity'
import {
  analysisScopeDays,
  normalizeOperationsAnalysisScope,
  type OperationsSelectedClusterRailFamily,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

const CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE = 'runtime_cleanup_discovery_snapshot'
const CLEANUP_DISCOVERY_SNAPSHOT_VERSION = 'gmail.cleanup_profile_cache.v4'
const CLEANUP_PROFILE_CACHE_TTL_MS = 1000 * 60 * 30
const STALE_DISCOVERY_REFRESH_COOLDOWN_MS = 1000 * 60 * 5
const CLEANUP_DISCOVERY_SNAPSHOT_LOOKBACK_LIMIT = 40
const RUNTIME_ARTIFACT_READ_CACHE_TTL_MS = 1000 * 60
const cleanupDiscoveryAttemptAt = new Map<string, number>()
const RUNTIME_BACKGROUND_REFRESH_LOG_PREFIX = '[playground][cleanup-refresh-background]'
const RUNTIME_CLEANUP_SAFETY_DEFAULTS = [
  'Exclude recent mail by default with age filters.',
  'Exclude starred and important mail.',
  'Prefer non-primary categories to reduce risk on human correspondence.',
  'Exclude messages sent by the mailbox owner where possible.',
  'Planning is read-only and requires explicit approval before any action.',
] as const

type CachedRuntimeMailboxArtifactEntry = {
  expiresAtMs: number
  data: Awaited<ReturnType<typeof loadPublishedGmailMailboxIntelligenceArtifact>>
}

type RuntimeMailboxIndexCoverage = {
  indexed_total_rows: number
  indexed_inbox_rows: number | null
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
}

type CachedRuntimeMailboxIntelligenceEntry = {
  expiresAtMs: number
  data: GmailMailboxIntelligenceData | null
}

type CachedCleanupDiscoverySnapshotEntry = {
  expiresAtMs: number
  data: CleanupDiscoverySnapshot
}

const runtimeStateGlobal = globalThis as typeof globalThis & {
  __runtimeMailboxArtifactCache?: Map<string, CachedRuntimeMailboxArtifactEntry>
  __runtimeMailboxIntelligenceCache?: Map<string, CachedRuntimeMailboxIntelligenceEntry>
  __runtimeCleanupDiscoverySnapshotCache?: Map<string, CachedCleanupDiscoverySnapshotEntry>
}

const runtimeMailboxArtifactCache =
  runtimeStateGlobal.__runtimeMailboxArtifactCache ||
  new Map<string, CachedRuntimeMailboxArtifactEntry>()

if (!runtimeStateGlobal.__runtimeMailboxArtifactCache) {
  runtimeStateGlobal.__runtimeMailboxArtifactCache = runtimeMailboxArtifactCache
}

const runtimeMailboxIntelligenceCache =
  runtimeStateGlobal.__runtimeMailboxIntelligenceCache ||
  new Map<string, CachedRuntimeMailboxIntelligenceEntry>()

if (!runtimeStateGlobal.__runtimeMailboxIntelligenceCache) {
  runtimeStateGlobal.__runtimeMailboxIntelligenceCache = runtimeMailboxIntelligenceCache
}

const runtimeCleanupDiscoverySnapshotCache =
  runtimeStateGlobal.__runtimeCleanupDiscoverySnapshotCache ||
  new Map<string, CachedCleanupDiscoverySnapshotEntry>()

if (!runtimeStateGlobal.__runtimeCleanupDiscoverySnapshotCache) {
  runtimeStateGlobal.__runtimeCleanupDiscoverySnapshotCache = runtimeCleanupDiscoverySnapshotCache
}

type RuntimeCleanupArtifactClusterInput = {
  cluster_id: string
  canonical_cluster_id: string
  legacy_cluster_ids: string[]
  source_cluster_ids: string[]
  cluster_type: string
  title: string
  query: string
  why_selected: string
  risk_note: string
  safety_note: string
  surface_tier: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_tier'] | null
  surface_kind: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_kind'] | null
  surface_visibility: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_visibility'] | null
  top_level_rank: number | null
}

export type PlaygroundRuntimeStateServiceResult = {
  runtimeInputs: PlaygroundRuntimeStateInputs
  runtimeState: AssembledGmailRuntimeState
  runtimeApprovalQueueSummary: RuntimeApprovalQueueSummary
  runtimeApprovalQueueItems: RuntimeApprovalQueueItem[]
  manualCleanupRegenerationDiagnostics: {
    analysisScope: OperationsAnalysisScope
    cleanupProfileStatus: 'fresh' | 'cached' | 'stale' | 'none'
    cleanupProfileRefreshReason: string | null
    snapshotScope: OperationsAnalysisScope | null
    snapshotVersionBefore: string | null
    snapshotVersionAfter: string | null
    previousSnapshotServedWhileRefreshing: boolean
    runtimeCleanupPlanGeneratedAt: string | null
    runtimeMailboxProfileGeneratedAt: string | null
    runtimeMailboxProfileFreshnessLastGeneratedAt: string | null
    derivedCacheVersion: string | null
    runtimeCleanupPlanClusterCount: number
    cleanupPlanMs: number
    runtimeStateTotalMs: number
    discoveryTotalMs: number | null
    wrapperSnapshotPreloadSkipped: boolean
    wrapperIndexMetadataPreloadSkipped: boolean
    discoveryRowCacheHit: boolean | null
    indexedRowsLoadMs: number | null
    indexSyncDisabledByRequest: boolean | null
    snapshotSaveMode: string | null
    finalRuntimeAssembleMs: number | null
    continuityState: 'standard' | 'build_pending_showing_stable_snapshot'
    buildPending: boolean
    stableSnapshotServed: boolean
    swapReady: boolean
    publicationFreshnessState: string | null
    publicationBuildStatus: string | null
    publishedVersion: string | null
    buildingVersion: string | null
  } | null
}

export type PlaygroundRuntimeRefreshPhaseName =
  | 'artifact_publication_read'
  | 'cached_intelligence_read'
  | 'cleanup_discovery_data_build'
  | 'runtime_assembly'

export type PlaygroundRuntimeRefreshPhaseResult = {
  phase: PlaygroundRuntimeRefreshPhaseName
  status: 'success' | 'failure'
  errorMessage: string | null
  stackTrace: string | null
  loggedAt: string
}

export type PlaygroundRuntimeRefreshFailureDiagnostics = {
  analysisScope: OperationsAnalysisScope | null
  requestMode: 'rehydrate_only' | 'full_chat' | 'unknown'
  forceMailboxProfileRefresh: boolean
  freshnessState: string | null
  buildStatus: string | null
  publishedVersion: string | null
  buildingVersion: string | null
  failingPhase: PlaygroundRuntimeRefreshPhaseName
  phases: PlaygroundRuntimeRefreshPhaseResult[]
}

type PlaygroundRuntimeRefreshDiagnosticContext = {
  analysisScope: OperationsAnalysisScope | null
  requestMode: 'rehydrate_only' | 'full_chat' | 'unknown'
  forceMailboxProfileRefresh: boolean
  freshnessState: string | null
  buildStatus: string | null
  publishedVersion: string | null
  buildingVersion: string | null
  phases: PlaygroundRuntimeRefreshPhaseResult[]
}

function createRuntimeRefreshDiagnosticContext(params: {
  analysisScope: OperationsAnalysisScope | null
  requestMode?: 'rehydrate_only' | 'full_chat'
  forceMailboxProfileRefresh?: boolean
}): PlaygroundRuntimeRefreshDiagnosticContext {
  return {
    analysisScope: params.analysisScope,
    requestMode: params.requestMode ?? 'unknown',
    forceMailboxProfileRefresh: params.forceMailboxProfileRefresh === true,
    freshnessState: null,
    buildStatus: null,
    publishedVersion: null,
    buildingVersion: null,
    phases: [],
  }
}

function updateRuntimeRefreshDiagnosticContextFromPublication(
  context: PlaygroundRuntimeRefreshDiagnosticContext,
  publication: GmailArtifactPublicationRow | null
): void {
  context.freshnessState = publication?.freshness_state ?? null
  context.buildStatus = publication?.build_status ?? null
  context.publishedVersion = publication?.published_version ?? null
  context.buildingVersion = publication?.building_version ?? null
}

function recordRuntimeRefreshPhaseResult(params: {
  context: PlaygroundRuntimeRefreshDiagnosticContext
  phase: PlaygroundRuntimeRefreshPhaseName
  status: 'success' | 'failure'
  error?: unknown
}): void {
  const error =
    params.error instanceof Error
      ? params.error
      : params.error == null
        ? null
        : new Error(String(params.error))
  const entry: PlaygroundRuntimeRefreshPhaseResult = {
    phase: params.phase,
    status: params.status,
    errorMessage: error?.message ?? null,
    stackTrace: error?.stack ?? null,
    loggedAt: new Date().toISOString(),
  }
  params.context.phases.push(entry)

  const payload = {
    phase: params.phase,
    status: params.status,
    analysis_scope: params.context.analysisScope,
    request_mode: params.context.requestMode,
    force_mailbox_profile_refresh: params.context.forceMailboxProfileRefresh,
    freshness_state: params.context.freshnessState,
    build_status: params.context.buildStatus,
    published_version: params.context.publishedVersion,
    building_version: params.context.buildingVersion,
    error_message: entry.errorMessage,
    stack_trace: entry.stackTrace,
  }

  if (params.status === 'failure') {
    console.error('[playground][manual-regeneration-phase] failure', payload)
    return
  }

  console.info(`[playground][manual-regeneration-phase] ${JSON.stringify(payload)}`)
}

function createRuntimeRefreshPhaseError(params: {
  context: PlaygroundRuntimeRefreshDiagnosticContext
  phase: PlaygroundRuntimeRefreshPhaseName
  error: unknown
}): Error & {
  playgroundRuntimeRefreshDiagnostics: PlaygroundRuntimeRefreshFailureDiagnostics
} {
  recordRuntimeRefreshPhaseResult({
    context: params.context,
    phase: params.phase,
    status: 'failure',
    error: params.error,
  })

  const baseError =
    params.error instanceof Error ? params.error : new Error(String(params.error))
  const wrappedError = baseError as Error & {
    playgroundRuntimeRefreshDiagnostics: PlaygroundRuntimeRefreshFailureDiagnostics
  }
  wrappedError.playgroundRuntimeRefreshDiagnostics = {
    analysisScope: params.context.analysisScope,
    requestMode: params.context.requestMode,
    forceMailboxProfileRefresh: params.context.forceMailboxProfileRefresh,
    freshnessState: params.context.freshnessState,
    buildStatus: params.context.buildStatus,
    publishedVersion: params.context.publishedVersion,
    buildingVersion: params.context.buildingVersion,
    failingPhase: params.phase,
    phases: [...params.context.phases],
  }
  return wrappedError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseDateMs(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function runtimeUniqueClusterIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => runtimeArtifactText(value))
        .filter(Boolean)
    )
  )
}

function runtimeCanonicalClusterIdFromIdentity(
  identity: ReturnType<typeof resolveCleanupClusterIdentity>,
  fallbackClusterId: string
): string {
  return (
    identity.canonicalDescriptor?.canonicalClusterId ||
    identity.canonicalClusterId ||
    runtimeArtifactText(fallbackClusterId)
  )
}

function runtimeArtifactClusterLookupIds(cluster: RuntimeCleanupArtifactClusterInput): string[] {
  return runtimeUniqueClusterIds([
    cluster.cluster_id,
    cluster.canonical_cluster_id,
    ...cluster.legacy_cluster_ids,
    ...cluster.source_cluster_ids,
  ])
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

function runtimeMailboxArtifactCacheKey(params: {
  tenantId: string
  analysisScope: OperationsAnalysisScope
}): string {
  return [params.tenantId, params.analysisScope].join('::')
}

function runtimeMailboxIntelligenceCacheKey(params: {
  tenantId: string
  analysisScope: OperationsAnalysisScope
  clusters: RuntimeCleanupArtifactClusterInput[]
}): string {
  return [
    params.tenantId,
    params.analysisScope,
    ...params.clusters.map((cluster) => cluster.cluster_id),
  ].join('::')
}

async function readCachedRuntimeMailboxArtifact(params: {
  supabase: SupabaseAdminClient
  tenantId: string
  analysisScope: OperationsAnalysisScope
  forceRefresh?: boolean
  awaitRefreshHandoff?: boolean
  bypassCache?: boolean
}): Promise<Awaited<ReturnType<typeof loadPublishedGmailMailboxIntelligenceArtifact>>> {
  const cacheKey = runtimeMailboxArtifactCacheKey({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const now = Date.now()
  const cached = runtimeMailboxArtifactCache.get(cacheKey) || null
  if (!params.forceRefresh && !params.bypassCache && cached && cached.expiresAtMs > now) {
    return cached.data
  }

  const snapshotRead = await loadPublishedGmailMailboxIntelligenceArtifact({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    includeSnapshot: true,
    includeClusterSummaries: false,
    includeBuckets: false,
    reconcileBuildLiveness: false,
    bypassPublicationCache: params.forceRefresh === true || params.bypassCache === true,
    awaitRefreshHandoff: params.awaitRefreshHandoff === true,
  })
  const summariesRead = snapshotRead.artifact_version
    ? await loadPublishedGmailMailboxIntelligenceArtifact({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: params.analysisScope,
        includeSnapshot: false,
        includeClusterSummaries: true,
        includeBuckets: false,
        reconcileBuildLiveness: false,
      })
    : snapshotRead
  const data = {
    ...snapshotRead,
    publication: summariesRead.publication ?? snapshotRead.publication,
    artifact_version: summariesRead.artifact_version ?? snapshotRead.artifact_version,
    cluster_summaries: summariesRead.cluster_summaries,
    build_liveness: null,
  }

  runtimeMailboxArtifactCache.set(cacheKey, {
    expiresAtMs: now + RUNTIME_ARTIFACT_READ_CACHE_TTL_MS,
    data,
  })

  return data
}

async function readCachedRuntimeMailboxIntelligence(params: {
  supabase: SupabaseAdminClient
  tenantId: string
  analysisScope: OperationsAnalysisScope
  clusters: RuntimeCleanupArtifactClusterInput[]
  artifactRead?: Awaited<ReturnType<typeof loadPublishedGmailMailboxIntelligenceArtifact>>
}): Promise<GmailMailboxIntelligenceData | null> {
  const cacheKey = runtimeMailboxIntelligenceCacheKey({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    clusters: params.clusters,
  })
  const now = Date.now()
  const cached = runtimeMailboxIntelligenceCache.get(cacheKey) || null
  if (cached && cached.expiresAtMs > now) {
    return cached.data
  }

  let finalData: GmailMailboxIntelligenceData | null = null
  if (params.artifactRead) {
    finalData = buildMailboxIntelligenceFromPublishedArtifactRead({
      analysisScope: params.analysisScope,
      clusters: params.clusters,
      artifactRead: params.artifactRead,
    })
  } else {
    const data = await loadGmailMailboxIntelligenceForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      clusters: params.clusters,
    })
    finalData = data.ok ? data.data : null
  }

  runtimeMailboxIntelligenceCache.set(cacheKey, {
    expiresAtMs: now + RUNTIME_ARTIFACT_READ_CACHE_TTL_MS,
    data: finalData,
  })

  return finalData
}

function readRecordNumber(value: Record<string, unknown> | null, key: string): number | null {
  if (!value) return null
  const entry = value[key]
  return typeof entry === 'number' && Number.isFinite(entry) ? entry : null
}

function readRecordBoolean(value: Record<string, unknown> | null, key: string): boolean | null {
  if (!value) return null
  const entry = value[key]
  return typeof entry === 'boolean' ? entry : null
}

function readRecordString(value: Record<string, unknown> | null, key: string): string | null {
  if (!value) return null
  const entry = value[key]
  return typeof entry === 'string' && entry.trim() ? entry : null
}

function indexedSnapshotAdvancedSinceCleanupSnapshot(params: {
  snapshot: CleanupDiscoverySnapshot | null
  indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null
  indexCoverage: RuntimeMailboxIndexCoverage | null
}): boolean {
  if (!params.snapshot) return false

  const sourceCounts =
    params.snapshot.cleanupDiscoveryData.mailbox_profile?.cluster_diagnostics?.source_counts || null

  const currentIndexedTotal =
    params.indexCoverage && Number.isFinite(params.indexCoverage.indexed_total_rows)
      ? params.indexCoverage.indexed_total_rows
      : params.indexState && Number.isFinite(params.indexState.indexed_message_count)
        ? params.indexState.indexed_message_count
        : 0
  const currentIndexedInbox =
    params.indexCoverage && Number.isFinite(params.indexCoverage.indexed_inbox_rows)
      ? params.indexCoverage.indexed_inbox_rows
      : 0
  const currentDateSpanStart =
    params.indexCoverage?.indexed_date_span_start ?? null
  const currentDateSpanEnd =
    params.indexCoverage?.indexed_date_span_end ?? null

  if (sourceCounts) {
    if (
      Number.isFinite(sourceCounts.indexed_total_rows) &&
      sourceCounts.indexed_total_rows !== currentIndexedTotal
    ) {
      return true
    }
    if (
      Number.isFinite(sourceCounts.indexed_inbox_rows) &&
      sourceCounts.indexed_inbox_rows !== currentIndexedInbox
    ) {
      return true
    }
    if ((sourceCounts.indexed_date_span_start || null) !== currentDateSpanStart) return true
    if ((sourceCounts.indexed_date_span_end || null) !== currentDateSpanEnd) return true
    return false
  }

  const snapshotGeneratedMs =
    parseDateMs(params.snapshot.generatedAt) ??
    parseDateMs(params.snapshot.cleanupDiscoveryData.generated_at)
  const indexActivityMs = deriveIndexStateActivityMs(params.indexState)
  return Boolean(
    currentIndexedTotal > 0 &&
      indexActivityMs != null &&
      snapshotGeneratedMs != null &&
      indexActivityMs > snapshotGeneratedMs + 1000
  )
}

type CleanupDiscoverySnapshot = {
  cleanupDiscoveryData: GmailCleanupDiscoveryData
  generatedAt: string
  expiresAt: string
  analysisScope: OperationsAnalysisScope
}

type SelectedClusterRailBootstrapPersistedSnapshotRejectionReason =
  | 'expired'
  | 'index_advanced'
  | 'empty_with_index_potential'

type SelectedClusterRailBootstrapSnapshotResolution = {
  scope: GmailArtifactAnalysisScope
  source:
    | 'current_runtime_scope'
    | 'persisted_snapshot'
    | 'stale_persisted_snapshot'
    | 'readonly_scoped_discovery'
    | 'artifact_surface'
    | 'unavailable_scope'
  visible_cluster_count: number
  persisted_snapshot_rejected_reason: SelectedClusterRailBootstrapPersistedSnapshotRejectionReason | null
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
      mailbox_intelligence_snapshot:
        discovery.mailbox_intelligence_snapshot === null
          ? null
          : isRecord(discovery.mailbox_intelligence_snapshot)
            ? (discovery.mailbox_intelligence_snapshot as GmailCleanupDiscoveryData['mailbox_intelligence_snapshot'])
            : undefined,
      sender_overview_snapshot:
        discovery.sender_overview_snapshot === null
          ? null
          : isRecord(discovery.sender_overview_snapshot)
            ? (discovery.sender_overview_snapshot as GmailCleanupDiscoveryData['sender_overview_snapshot'])
            : undefined,
    },
    generatedAt,
    expiresAt,
    analysisScope,
  }
}

function parseCleanupDiscoverySnapshotRecord(value: unknown): CleanupDiscoverySnapshot | null {
  const payload = (() => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return value
  })()

  return parseCleanupDiscoverySnapshotPayload(payload)
}

function cleanupDiscoverySnapshotCacheKey(params: {
  agentId: string
  analysisScope: OperationsAnalysisScope
}): string {
  return [params.agentId, params.analysisScope].join('::')
}

function cleanupDiscoverySnapshotCacheExpiryMs(snapshot: CleanupDiscoverySnapshot): number {
  const generatedAtMs = parseDateMs(snapshot.generatedAt) || 0
  const expiresAtMs = parseDateMs(snapshot.expiresAt) || 0
  const anchorMs = Math.max(generatedAtMs, expiresAtMs, Date.now())
  return anchorMs + CLEANUP_PROFILE_CACHE_TTL_MS
}

function readCachedCleanupDiscoverySnapshot(params: {
  agentId: string
  analysisScope: OperationsAnalysisScope
}): CleanupDiscoverySnapshot | null {
  const cacheKey = cleanupDiscoverySnapshotCacheKey(params)
  const cached = runtimeCleanupDiscoverySnapshotCache.get(cacheKey) || null
  if (!cached) return null
  if (cached.expiresAtMs <= Date.now()) {
    runtimeCleanupDiscoverySnapshotCache.delete(cacheKey)
    return null
  }
  return cached.data
}

function writeCachedCleanupDiscoverySnapshot(params: {
  agentId: string
  snapshot: CleanupDiscoverySnapshot
}): void {
  runtimeCleanupDiscoverySnapshotCache.set(
    cleanupDiscoverySnapshotCacheKey({
      agentId: params.agentId,
      analysisScope: params.snapshot.analysisScope,
    }),
    {
      expiresAtMs: cleanupDiscoverySnapshotCacheExpiryMs(params.snapshot),
      data: params.snapshot,
    }
  )
}

async function loadRecentCleanupDiscoverySnapshotRows(params: {
  supabase: SupabaseAdminClient
  agentId: string
  limit: number
}): Promise<{
  data: Array<{ payload: unknown }>
  error: { message?: string } | null
}> {
  const result = await params.supabase
    .from('agent_events')
    .select('payload,created_at')
    .eq('agent_id', params.agentId)
    .eq('event_type', CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE)
    .order('created_at', { ascending: false })
    .limit(params.limit)

  return {
    data: (result.data || []) as Array<{ payload: unknown }>,
    error: result.error,
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

function applyCleanupIndexCountsFromDiscoveryData(params: {
  discoveryData: GmailCleanupDiscoveryData | null
}): {
  indexedCount: number
  inboxCount: number
} {
  const sourceCounts = params.discoveryData?.mailbox_profile?.cluster_diagnostics?.source_counts
  const indexedCount =
    sourceCounts && Number.isFinite(sourceCounts.indexed_total_rows)
      ? sourceCounts.indexed_total_rows
      : 0
  const inboxCount =
    sourceCounts && Number.isFinite(sourceCounts.indexed_inbox_rows)
      ? sourceCounts.indexed_inbox_rows
      : 0

  return {
    indexedCount,
    inboxCount,
  }
}

async function loadLatestCleanupDiscoverySnapshot(params: {
  supabase: SupabaseAdminClient
  agentId: string
  analysisScope: OperationsAnalysisScope
  queryTelemetry?: {
    queryCount: number
    returnedRowCount: number
  }
}): Promise<CleanupDiscoverySnapshot | null> {
  const cached = readCachedCleanupDiscoverySnapshot({
    agentId: params.agentId,
    analysisScope: params.analysisScope,
  })
  if (cached) return cached

  const exactQuery = await params.supabase
    .from('agent_events')
    .select('payload,created_at')
    .eq('agent_id', params.agentId)
    .eq('event_type', CLEANUP_DISCOVERY_SNAPSHOT_EVENT_TYPE)
    .eq('payload->>version', CLEANUP_DISCOVERY_SNAPSHOT_VERSION)
    .eq('payload->>analysis_scope', params.analysisScope)
    .order('created_at', { ascending: false })
    .limit(1)

  if (params.queryTelemetry) {
    params.queryTelemetry.queryCount += 1
    params.queryTelemetry.returnedRowCount += Array.isArray(exactQuery.data)
      ? exactQuery.data.length
      : 0
  }

  if (!exactQuery.error) {
    for (const row of (exactQuery.data || []) as Array<{ payload: unknown }>) {
      const parsed = parseCleanupDiscoverySnapshotRecord(row.payload)
      if (!parsed) continue
      if (parsed.analysisScope !== params.analysisScope) continue
      writeCachedCleanupDiscoverySnapshot({
        agentId: params.agentId,
        snapshot: parsed,
      })
      return parsed
    }
  } else {
    console.warn('[playground] cleanup snapshot exact lookup failed (non-fatal):', exactQuery.error)
  }

  const { data, error } = await loadRecentCleanupDiscoverySnapshotRows({
    supabase: params.supabase,
    agentId: params.agentId,
    limit: CLEANUP_DISCOVERY_SNAPSHOT_LOOKBACK_LIMIT,
  })

  if (params.queryTelemetry) {
    params.queryTelemetry.queryCount += 1
    params.queryTelemetry.returnedRowCount += data.length
  }

  if (error) {
    console.warn('[playground] cleanup snapshot lookup failed (non-fatal):', error)
    return null
  }

  for (const row of data) {
    const parsed = parseCleanupDiscoverySnapshotRecord(row.payload)
    if (!parsed) continue
    if (parsed.analysisScope !== params.analysisScope) continue
    writeCachedCleanupDiscoverySnapshot({
      agentId: params.agentId,
      snapshot: parsed,
    })
    return parsed
  }

  return null
}

async function loadLatestCleanupDiscoverySnapshotsForScopes(params: {
  supabase: SupabaseAdminClient
  agentId: string
  analysisScopes: GmailArtifactAnalysisScope[]
}): Promise<{
  snapshots: Map<GmailArtifactAnalysisScope, CleanupDiscoverySnapshot>
  queryCount: number
  returnedRowCount: number
  cacheHitScopeCount: number
  cacheMissScopeCount: number
}> {
  const requestedScopes = new Set<GmailArtifactAnalysisScope>(
    params.analysisScopes.map((scope) => scope)
  )
  const snapshots = new Map<GmailArtifactAnalysisScope, CleanupDiscoverySnapshot>()
  if (requestedScopes.size === 0) {
    return {
      snapshots,
      queryCount: 0,
      returnedRowCount: 0,
      cacheHitScopeCount: 0,
      cacheMissScopeCount: 0,
    }
  }

  for (const scope of requestedScopes) {
    const cached = readCachedCleanupDiscoverySnapshot({
      agentId: params.agentId,
      analysisScope: scope,
    })
    if (cached) snapshots.set(scope, cached)
  }

  let cacheHitScopeCount = snapshots.size
  if (snapshots.size >= requestedScopes.size) {
    return {
      snapshots,
      queryCount: 0,
      returnedRowCount: 0,
      cacheHitScopeCount,
      cacheMissScopeCount: 0,
    }
  }

  const missingScopes = [...requestedScopes].filter((scope) => !snapshots.has(scope))
  const queryTelemetry = {
    queryCount: 0,
    returnedRowCount: 0,
  }
  let cacheMissScopeCount = 0
  for (const scope of missingScopes) {
    const queryCountBeforeScope = queryTelemetry.queryCount
    const scopedSnapshot = await loadLatestCleanupDiscoverySnapshot({
      supabase: params.supabase,
      agentId: params.agentId,
      analysisScope: scope,
      queryTelemetry,
    })
    if (queryTelemetry.queryCount > queryCountBeforeScope) {
      cacheMissScopeCount += 1
    } else {
      cacheHitScopeCount += 1
    }
    if (scopedSnapshot) snapshots.set(scope, scopedSnapshot)
  }

  return {
    snapshots,
    queryCount: queryTelemetry.queryCount,
    returnedRowCount: queryTelemetry.returnedRowCount,
    cacheHitScopeCount,
    cacheMissScopeCount,
  }
}

function cleanupDiscoverySnapshotVisibleClusterCount(
  snapshot: CleanupDiscoverySnapshot | null | undefined
): number {
  return Array.isArray(snapshot?.cleanupDiscoveryData.clusters)
    ? snapshot.cleanupDiscoveryData.clusters.length
    : 0
}

function cleanupDiscoverySnapshotExpired(params: {
  snapshot: CleanupDiscoverySnapshot | null | undefined
  nowMs: number
}): boolean {
  const expiresAtMs = parseDateMs(params.snapshot?.expiresAt ?? null)
  return expiresAtMs != null && expiresAtMs <= params.nowMs
}

function indexedCoverageIndicatesNonZeroClusterPotential(params: {
  analysisScope: GmailArtifactAnalysisScope
  indexCoverage: RuntimeMailboxIndexCoverage | null
  nowMs: number
}): boolean {
  const scopeWindowDays = analysisScopeDays(params.analysisScope)
  if (scopeWindowDays == null) return false
  if (!params.indexCoverage) return false
  if (
    !Number.isFinite(params.indexCoverage.indexed_total_rows) ||
    params.indexCoverage.indexed_total_rows <= 0
  ) {
    return false
  }
  if (
    typeof params.indexCoverage.indexed_inbox_rows !== 'number' ||
    !Number.isFinite(params.indexCoverage.indexed_inbox_rows) ||
    params.indexCoverage.indexed_inbox_rows <= 0
  ) {
    return false
  }

  const endMs = parseDateMs(params.indexCoverage.indexed_date_span_end)
  if (endMs == null) return false

  const freshnessSlackMs = 3 * 24 * 60 * 60 * 1000
  return endMs >= params.nowMs - freshnessSlackMs
}

function selectedClusterRailBootstrapPersistedSnapshotRejectionReason(params: {
  analysisScope: GmailArtifactAnalysisScope
  snapshot: CleanupDiscoverySnapshot | null
  indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null
  indexCoverage: RuntimeMailboxIndexCoverage | null
  nowMs: number
}): SelectedClusterRailBootstrapPersistedSnapshotRejectionReason | null {
  const snapshot = params.snapshot
  if (!snapshot) return null

  if (
    cleanupDiscoverySnapshotVisibleClusterCount(snapshot) === 0 &&
    indexedCoverageIndicatesNonZeroClusterPotential({
      analysisScope: params.analysisScope,
      indexCoverage: params.indexCoverage,
      nowMs: params.nowMs,
    })
  ) {
    return 'empty_with_index_potential'
  }

  if (
    cleanupDiscoverySnapshotExpired({
      snapshot,
      nowMs: params.nowMs,
    })
  ) {
    return 'expired'
  }

  if (
    indexedSnapshotAdvancedSinceCleanupSnapshot({
      snapshot,
      indexState: params.indexState,
      indexCoverage: params.indexCoverage,
    })
  ) {
    return 'index_advanced'
  }

  return null
}

async function resolveSelectedClusterRailBootstrapSnapshots(params: {
  supabase: SupabaseAdminClient
  agentId: string
  tenantId: string
  preferredClusterId?: string | null
  analysisScopes: GmailArtifactAnalysisScope[]
  currentScope: GmailArtifactAnalysisScope | null
  currentScopeCleanupDiscoveryData: GmailCleanupDiscoveryData | null
  indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null
  indexCoverage: RuntimeMailboxIndexCoverage | null
  nowMs: number
  allowReadonlyScopedDiscovery?: boolean
}): Promise<{
  snapshotsByScope: Partial<Record<GmailArtifactAnalysisScope, CleanupDiscoverySnapshot | null>>
  resolutions: SelectedClusterRailBootstrapSnapshotResolution[]
  snapshotBootstrapQueryCount: number
  snapshotBootstrapReturnedRowCount: number
  snapshotBootstrapCacheHitScopeCount: number
  snapshotBootstrapCacheMissScopeCount: number
}> {
  const publicationStates = await loadGmailArtifactPublicationStatesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  const publishedScopes = new Set<GmailArtifactAnalysisScope>(
    publicationStates
      .filter(
        (row): row is GmailArtifactPublicationRow =>
          typeof row.published_version === 'string' && row.published_version.trim().length > 0
      )
      .map((row) => row.analysis_scope)
  )

  const persistedSnapshotLoad = await loadLatestCleanupDiscoverySnapshotsForScopes({
    supabase: params.supabase,
    agentId: params.agentId,
    analysisScopes: params.analysisScopes,
  })
  const persistedSnapshots = persistedSnapshotLoad.snapshots

  const snapshotsByScope: Partial<Record<GmailArtifactAnalysisScope, CleanupDiscoverySnapshot | null>> =
    {}
  const resolutions: SelectedClusterRailBootstrapSnapshotResolution[] = []

  if (params.currentScope && params.currentScopeCleanupDiscoveryData) {
    const currentScopeSnapshot: CleanupDiscoverySnapshot = {
      cleanupDiscoveryData: params.currentScopeCleanupDiscoveryData,
      generatedAt: new Date(params.nowMs).toISOString(),
      expiresAt: new Date(params.nowMs + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString(),
      analysisScope: params.currentScope,
    }
    snapshotsByScope[params.currentScope] = currentScopeSnapshot
    resolutions.push({
      scope: params.currentScope,
      source: 'current_runtime_scope',
      visible_cluster_count: cleanupDiscoverySnapshotVisibleClusterCount(currentScopeSnapshot),
      persisted_snapshot_rejected_reason: null,
    })
  }

  for (const scope of params.analysisScopes) {
    if (scope === params.currentScope && params.currentScopeCleanupDiscoveryData) continue

    const persistedSnapshot = persistedSnapshots.get(scope) || null
    const persistedSnapshotRejectedReason =
      selectedClusterRailBootstrapPersistedSnapshotRejectionReason({
        analysisScope: scope,
        snapshot: persistedSnapshot,
        indexState: params.indexState,
        indexCoverage: params.indexCoverage,
        nowMs: params.nowMs,
      })
    const persistedSnapshotSupportsPreferredCluster = scopedCleanupSnapshotSupportsPreferredCluster({
      snapshot: persistedSnapshot,
      preferredClusterId: params.preferredClusterId,
    })

    if (persistedSnapshot && !persistedSnapshotRejectedReason) {
      snapshotsByScope[scope] = persistedSnapshot
      resolutions.push({
        scope,
        source: 'persisted_snapshot',
        visible_cluster_count: cleanupDiscoverySnapshotVisibleClusterCount(persistedSnapshot),
        persisted_snapshot_rejected_reason: null,
      })
      continue
    }

    if (
      persistedSnapshot &&
      persistedSnapshotSupportsPreferredCluster &&
      (persistedSnapshotRejectedReason === 'expired' ||
        persistedSnapshotRejectedReason === 'index_advanced')
    ) {
      snapshotsByScope[scope] = persistedSnapshot
      resolutions.push({
        scope,
        source: 'stale_persisted_snapshot',
        visible_cluster_count: cleanupDiscoverySnapshotVisibleClusterCount(persistedSnapshot),
        persisted_snapshot_rejected_reason: persistedSnapshotRejectedReason,
      })
      continue
    }

    const shouldRunReadonlyScopedDiscovery =
      params.allowReadonlyScopedDiscovery === true &&
      !publishedScopes.has(scope) &&
      (persistedSnapshotRejectedReason === 'empty_with_index_potential' ||
        !persistedSnapshot ||
        !persistedSnapshotSupportsPreferredCluster)

    if (shouldRunReadonlyScopedDiscovery) {
      const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: scope,
        logPrefix: `[playground/selected-cluster-rail-bootstrap/${scope}]`,
        disableInlineIndexSync: true,
        preferExistingIndexedCoverage: true,
        skipIndexSyncIfRecentMs: CLEANUP_PROFILE_CACHE_TTL_MS,
        allowFullRescanOnIndexSyncFailure: false,
      })

      if (cleanupDiscovery.ok) {
        const generatedAt = new Date().toISOString()
        const expiresAt = new Date(Date.now() + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString()
        const readonlySnapshot: CleanupDiscoverySnapshot = {
          cleanupDiscoveryData: cleanupDiscovery.data,
          generatedAt,
          expiresAt,
          analysisScope: scope,
        }

        writeCachedCleanupDiscoverySnapshot({
          agentId: params.agentId,
          snapshot: readonlySnapshot,
        })
        snapshotsByScope[scope] = readonlySnapshot
        resolutions.push({
          scope,
          source: 'readonly_scoped_discovery',
          visible_cluster_count: cleanupDiscoverySnapshotVisibleClusterCount(readonlySnapshot),
          persisted_snapshot_rejected_reason: persistedSnapshotRejectedReason,
        })
        continue
      }
    }

    resolutions.push({
      scope,
      source: publishedScopes.has(scope) ? 'artifact_surface' : 'unavailable_scope',
      visible_cluster_count: cleanupDiscoverySnapshotVisibleClusterCount(persistedSnapshot),
      persisted_snapshot_rejected_reason: persistedSnapshotRejectedReason,
    })
  }

  return {
    snapshotsByScope,
    resolutions,
    snapshotBootstrapQueryCount: persistedSnapshotLoad.queryCount,
    snapshotBootstrapReturnedRowCount: persistedSnapshotLoad.returnedRowCount,
    snapshotBootstrapCacheHitScopeCount: persistedSnapshotLoad.cacheHitScopeCount,
    snapshotBootstrapCacheMissScopeCount: persistedSnapshotLoad.cacheMissScopeCount,
  }
}

function normalizeRailTimelineFromSenderOverviewSnapshot(
  workspace: GmailSenderWorkspaceData | null | undefined
): SelectedClusterRailSnapshotScopeFallback['timeline'] {
  const timelineItems = Array.isArray(workspace?.analytics?.sender_activity_timeline)
    ? workspace.analytics.sender_activity_timeline
        .map((entry) => {
          const label = runtimeArtifactText(entry?.label)
          if (!label) return null
          return {
            label,
            count: runtimeArtifactInteger(entry?.sender_count),
            contract_version: runtimeArtifactText(entry?.contract_version) || null,
            metric_family: runtimeArtifactText(entry?.metric_family) || null,
            scope_key: runtimeArtifactText(entry?.scope_key) || null,
            grouping: runtimeArtifactText(entry?.grouping) || null,
            time_zone: runtimeArtifactText(entry?.time_zone) || null,
            bucket_start_iso: runtimeArtifactText(entry?.bucket_start_iso) || null,
            bucket_end_exclusive_iso: runtimeArtifactText(entry?.bucket_end_exclusive_iso) || null,
          }
        })
        .filter(
          (
            entry
          ): entry is {
            label: string
            count: number
            contract_version: string | null
            metric_family: string | null
            scope_key: string | null
            grouping: string | null
            time_zone: string | null
            bucket_start_iso: string | null
            bucket_end_exclusive_iso: string | null
          } => entry != null
        )
    : []

  if (timelineItems.length === 0) return null

  return {
    granularity:
      workspace?.analytics?.sender_activity_timeline_granularity === 'hour'
        ? 'hour'
        : workspace?.analytics?.sender_activity_timeline_granularity === 'day'
        ? 'day'
        : workspace?.analytics?.sender_activity_timeline_granularity === 'week'
          ? 'week'
          : 'month',
    items: timelineItems,
  }
}

function normalizeRailSemanticResolutionDistributionFromSenderOverviewSnapshot(
  workspace: GmailSenderWorkspaceData | null | undefined
): SelectedClusterRailSnapshotScopeFallback['semantic_resolution_distribution'] {
  return Array.isArray(workspace?.analytics?.semantic_resolution_distribution)
    ? workspace.analytics.semantic_resolution_distribution
        .map((entry) => {
          const scope =
            entry?.scope === 'pattern'
              ? 'pattern'
              : entry?.scope === 'family'
                ? 'family'
                : null
          const resolution =
            entry?.resolution === 'clear' ||
            entry?.resolution === 'mixed' ||
            entry?.resolution === 'thin_history'
              ? entry.resolution
              : null
          if (!scope || !resolution) return null
          return {
            scope,
            resolution,
            sender_count: runtimeArtifactInteger(entry?.sender_count),
            share_pct:
              typeof entry?.share_pct === 'number' && Number.isFinite(entry.share_pct)
                ? entry.share_pct
                : 0,
          }
        })
        .filter(
          (
            entry
          ): entry is SelectedClusterRailSnapshotScopeFallback['semantic_resolution_distribution'][number] =>
            entry != null
        )
    : []
}

function buildSelectedClusterRailSnapshotFallback(params: {
  snapshot: CleanupDiscoverySnapshot | null
  preferredClusterId: string
}): SelectedClusterRailSnapshotScopeFallback | null {
  if (!params.snapshot) return null

  const preferredClusterId = params.preferredClusterId.trim()
  if (!preferredClusterId) return null

  const discoveryData = params.snapshot.cleanupDiscoveryData
  const preferredClusterIdentity = resolveCleanupClusterIdentity(
    preferredClusterId,
    discoveryData.clusters.map((cluster) => ({
      clusterId: runtimeArtifactText(cluster.cluster_id),
      canonicalClusterId:
        runtimeArtifactText((cluster as { canonical_cluster_id?: unknown }).canonical_cluster_id) ||
        runtimeArtifactText(cluster.cluster_id),
      legacyClusterIds: Array.isArray((cluster as { legacy_cluster_ids?: unknown }).legacy_cluster_ids)
        ? (cluster as { legacy_cluster_ids: unknown[] }).legacy_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
      sourceClusterIds: Array.isArray((cluster as { source_cluster_ids?: unknown }).source_cluster_ids)
        ? (cluster as { source_cluster_ids: unknown[] }).source_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
    }))
  )
  const resolvedClusterId = runtimeCanonicalClusterIdFromIdentity(
    preferredClusterIdentity,
    preferredClusterId
  )
  const candidateClusterIds = runtimeUniqueClusterIds([
    resolvedClusterId,
    preferredClusterId,
    ...preferredClusterIdentity.legacyClusterIds,
    ...preferredClusterIdentity.sourceClusterIds,
  ])
  const selectedCluster =
    discoveryData.clusters.find((cluster) =>
      candidateClusterIds.includes(runtimeArtifactText(cluster.cluster_id))
    ) || null
  const senderOverviewSnapshot = discoveryData.sender_overview_snapshot || null
  const selectedWorkspace =
    candidateClusterIds
      .map((clusterId) => senderOverviewSnapshot?.[clusterId] || null)
      .find((workspace) => workspace != null) || null
  const dominantSender =
    selectedWorkspace?.analytics?.cluster_contribution.find(
      (entry) => runtimeArtifactText(entry?.sender).length > 0
    )?.sender || null
  const messageCount =
    selectedWorkspace?.selected_cluster?.message_count ??
    selectedCluster?.message_count ??
    selectedCluster?.estimated_count ??
    null

  return {
    cluster_present: Boolean(selectedCluster || selectedWorkspace),
    cluster_title:
      runtimeArtifactNullableText(selectedWorkspace?.selected_cluster?.title) ||
      runtimeArtifactNullableText(selectedCluster?.title) ||
      null,
    visible_cluster_count: discoveryData.clusters.length,
    message_count:
      typeof messageCount === 'number' && Number.isFinite(messageCount)
        ? Math.max(0, Math.round(messageCount))
        : null,
    dominant_sender: runtimeArtifactNullableText(dominantSender),
    semantic_resolution_distribution:
      normalizeRailSemanticResolutionDistributionFromSenderOverviewSnapshot(selectedWorkspace),
    timeline: normalizeRailTimelineFromSenderOverviewSnapshot(selectedWorkspace),
  }
}

function buildBaselineSelectedClusterRailFamilyFromCleanupDiscoveryData(params: {
  cleanupDiscoveryData: GmailCleanupDiscoveryData | null
  preferredClusterId: string
  analysisScope: OperationsAnalysisScope
}): OperationsSelectedClusterRailFamily | null {
  const cleanupDiscoveryData = params.cleanupDiscoveryData
  const preferredClusterId = params.preferredClusterId.trim()
  if (!cleanupDiscoveryData || !preferredClusterId) return null

  const preferredClusterIdentity = resolveCleanupClusterIdentity(
    preferredClusterId,
    cleanupDiscoveryData.clusters.map((cluster) => ({
      clusterId: runtimeArtifactText(cluster.cluster_id),
      canonicalClusterId:
        runtimeArtifactText((cluster as { canonical_cluster_id?: unknown }).canonical_cluster_id) ||
        runtimeArtifactText(cluster.cluster_id),
      legacyClusterIds: Array.isArray((cluster as { legacy_cluster_ids?: unknown }).legacy_cluster_ids)
        ? (cluster as { legacy_cluster_ids: unknown[] }).legacy_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
      sourceClusterIds: Array.isArray((cluster as { source_cluster_ids?: unknown }).source_cluster_ids)
        ? (cluster as { source_cluster_ids: unknown[] }).source_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
    }))
  )
  const resolvedClusterId = runtimeCanonicalClusterIdFromIdentity(
    preferredClusterIdentity,
    preferredClusterId
  )
  const candidateClusterIds = runtimeUniqueClusterIds([
    resolvedClusterId,
    preferredClusterId,
    ...preferredClusterIdentity.legacyClusterIds,
    ...preferredClusterIdentity.sourceClusterIds,
  ])
  const selectedCluster =
    cleanupDiscoveryData.clusters.find((cluster) =>
      candidateClusterIds.includes(runtimeArtifactText(cluster.cluster_id))
    ) || null
  const selectedCleanupGroup =
    cleanupDiscoveryData.mailbox_intelligence_snapshot?.cleanup_groups.find((group) => {
      const groupClusterIds = runtimeUniqueClusterIds([
        group.cluster_id,
        group.canonical_cluster_id,
        ...group.legacy_cluster_ids,
        ...group.source_cluster_ids,
      ])
      return groupClusterIds.some((clusterId) => candidateClusterIds.includes(clusterId))
    }) || null

  if (!selectedCluster && !selectedCleanupGroup) return null

  const nowIso = new Date().toISOString()
  const snapshotFallback = buildSelectedClusterRailSnapshotFallback({
    snapshot: {
      cleanupDiscoveryData,
      generatedAt: cleanupDiscoveryData.generated_at || nowIso,
      expiresAt: new Date(Date.now() + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString(),
      analysisScope: params.analysisScope,
    },
    preferredClusterId,
  })
  const clusterTitle =
    snapshotFallback?.cluster_title ||
    runtimeArtifactNullableText(selectedCleanupGroup?.title) ||
    runtimeArtifactNullableText(selectedCluster?.title) ||
    null
  const messageCount =
    snapshotFallback?.message_count ??
    (selectedCleanupGroup
      ? runtimeArtifactInteger(selectedCleanupGroup.message_count)
      : runtimeArtifactInteger(selectedCluster?.message_count ?? selectedCluster?.estimated_count))
  const dominantSender =
    snapshotFallback?.dominant_sender ||
    runtimeArtifactNullableText(selectedCleanupGroup?.dominant_sender) ||
    null
  const semanticResolutionDistribution =
    snapshotFallback?.semantic_resolution_distribution &&
    snapshotFallback.semantic_resolution_distribution.length > 0
      ? snapshotFallback.semantic_resolution_distribution
      : selectedCleanupGroup?.semantic_resolution_distribution || []

  return {
    cluster_id: resolvedClusterId,
    cluster_title: clusterTitle,
    scopes: [
      {
        scope: params.analysisScope,
        cluster_id: resolvedClusterId,
        cluster_title: clusterTitle,
        artifact_version: null,
        state: 'ready',
        visible_cluster_count: snapshotFallback?.visible_cluster_count || cleanupDiscoveryData.clusters.length,
        timeline: snapshotFallback?.timeline || null,
        signal: {
          message_count: messageCount,
          dominant_sender: dominantSender,
          semantic_resolution_distribution: semanticResolutionDistribution,
        },
      },
    ],
  }
}

function cleanupSnapshotTimelineLabelsMatchGranularity(params: {
  labels: string[]
  granularity: 'hour' | 'day' | 'week' | 'month'
}): boolean {
  if (params.labels.length === 0) return false
  const pattern =
    params.granularity === 'hour'
      ? /^\d{4}-\d{2}-\d{2}T\d{2}$/
      : params.granularity === 'month'
        ? /^\d{4}-\d{2}$/
        : /^\d{4}-\d{2}-\d{2}$/
  return params.labels.every((label) => pattern.test(runtimeArtifactText(label)))
}

function scopedCleanupSnapshotSupportsPreferredCluster(params: {
  snapshot: CleanupDiscoverySnapshot | null
  preferredClusterId?: string | null
}): boolean {
  const preferredClusterId = runtimeArtifactText(params.preferredClusterId)
  if (!preferredClusterId) return true
  const snapshot = params.snapshot
  if (!snapshot) return false

  const preferredClusterIdentity = resolveCleanupClusterIdentity(
    preferredClusterId,
    snapshot.cleanupDiscoveryData.clusters.map((cluster) => ({
      clusterId: runtimeArtifactText(cluster.cluster_id),
      canonicalClusterId:
        runtimeArtifactText((cluster as { canonical_cluster_id?: unknown }).canonical_cluster_id) ||
        runtimeArtifactText(cluster.cluster_id),
      legacyClusterIds: Array.isArray((cluster as { legacy_cluster_ids?: unknown }).legacy_cluster_ids)
        ? (cluster as { legacy_cluster_ids: unknown[] }).legacy_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
      sourceClusterIds: Array.isArray((cluster as { source_cluster_ids?: unknown }).source_cluster_ids)
        ? (cluster as { source_cluster_ids: unknown[] }).source_cluster_ids
            .map((entry) => runtimeArtifactText(entry))
            .filter(Boolean)
        : [],
    }))
  )
  const candidateClusterIds = runtimeUniqueClusterIds([
    runtimeCanonicalClusterIdFromIdentity(preferredClusterIdentity, preferredClusterId),
    preferredClusterId,
    ...preferredClusterIdentity.legacyClusterIds,
    ...preferredClusterIdentity.sourceClusterIds,
  ])
  const selectedCluster = snapshot.cleanupDiscoveryData.clusters.find((cluster) =>
    candidateClusterIds.includes(runtimeArtifactText(cluster.cluster_id))
  )
  if (!selectedCluster) return false

  const selectedWorkspace =
    candidateClusterIds
      .map((clusterId) => snapshot.cleanupDiscoveryData.sender_overview_snapshot?.[clusterId] || null)
      .find((workspace) => workspace != null) || null
  if (!selectedWorkspace) return false

  const timelineGranularity = selectedWorkspace.analytics?.sender_activity_timeline_granularity
  if (
    timelineGranularity !== 'hour' &&
    timelineGranularity !== 'day' &&
    timelineGranularity !== 'week' &&
    timelineGranularity !== 'month'
  ) {
    return false
  }

  const timelineLabels = Array.isArray(selectedWorkspace.analytics?.sender_activity_timeline)
    ? selectedWorkspace.analytics.sender_activity_timeline
        .map((entry) => runtimeArtifactText(entry?.label))
        .filter(Boolean)
    : []

  return cleanupSnapshotTimelineLabelsMatchGranularity({
    labels: timelineLabels,
    granularity: timelineGranularity,
  })
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
    return
  }

  writeCachedCleanupDiscoverySnapshot({
    agentId: params.agentId,
    snapshot: {
      cleanupDiscoveryData: params.cleanupDiscoveryData,
      generatedAt: params.generatedAt,
      expiresAt: params.expiresAt,
      analysisScope: params.analysisScope,
    },
  })
}

function saveCleanupDiscoverySnapshotInBackground(params: {
  supabase: SupabaseAdminClient
  agentId: string
  analysisScope: OperationsAnalysisScope
  generatedAt: string
  expiresAt: string
  cleanupDiscoveryData: GmailCleanupDiscoveryData
}): void {
  const startedAt = Date.now()
  void saveCleanupDiscoverySnapshot(params)
    .then(() => {
      console.info(
        `[playground][cleanup-snapshot-save] ${JSON.stringify({
          mode: 'background_manual_regeneration',
          agent_id: params.agentId,
          selected_analysis_scope: params.analysisScope,
          duration_ms: Math.max(0, Date.now() - startedAt),
          outcome: 'completed',
        })}`
      )
    })
    .catch((error) => {
      console.warn('[playground] background cleanup snapshot save failed (non-fatal):', error)
    })
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

function runtimeArtifactText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function runtimeArtifactNullableText(value: unknown): string | null {
  const normalized = runtimeArtifactText(value)
  return normalized ? normalized : null
}

function runtimeArtifactInteger(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return fallback
}

function runtimeMailboxProfileAnalysisWindow(
  analysisScope: OperationsAnalysisScope
): GmailMailboxProfile['analysis_window_days'] {
  if (analysisScope === 'all_indexed') return 'all_indexed'

  const parsed = Number.parseInt(analysisScope.replace('d', ''), 10)
  if (parsed === 7 || parsed === 30 || parsed === 60 || parsed === 90 || parsed === 180 || parsed === 365) {
    return parsed
  }

  return 30
}

function runtimeMailboxProfileQuerySuffix(analysisScope: OperationsAnalysisScope): string {
  const window = runtimeMailboxProfileAnalysisWindow(analysisScope)
  return window === 'all_indexed' ? '' : ` newer_than:${window}d`
}

function runtimeMailboxProfileCategory(
  value: unknown
): GmailMailboxProfile['recurring_categories'][number]['category'] | null {
  const normalized = runtimeArtifactText(value).toLowerCase()
  if (normalized.includes('primary')) return 'primary'
  if (normalized.includes('promotion')) return 'promotions'
  if (normalized.includes('social')) return 'social'
  if (normalized.includes('update')) return 'updates'
  if (normalized.includes('forum')) return 'forums'
  return null
}

function runtimeMailboxProfileCategoryCount(
  entries: GmailMailboxIntelligenceData['whole_mailbox']['category_breakdown'],
  category: GmailMailboxProfile['recurring_categories'][number]['category']
): number {
  const match = entries.find((entry) => runtimeMailboxProfileCategory(entry.label) === category)
  return match ? runtimeArtifactInteger(match.count) : 0
}

function buildRuntimeCleanupArtifactClusterInputs(
  summaries: GmailClusterSummaryArtifactRow[]
): RuntimeCleanupArtifactClusterInput[] {
  const rawInputs = summaries
    .map((summary) => {
      const clusterId = runtimeArtifactText(summary.cluster_id)
      if (!clusterId) return null
      const summaryPayload = isRecord(summary.summary_payload) ? summary.summary_payload : null

      return {
        cluster_id: clusterId,
        canonical_cluster_id:
          runtimeArtifactText(summaryPayload?.cleanup_group_canonical_cluster_id) || clusterId,
        legacy_cluster_ids: Array.isArray(summaryPayload?.cleanup_group_legacy_cluster_ids)
          ? summaryPayload.cleanup_group_legacy_cluster_ids
              .map((entry) => runtimeArtifactText(entry))
              .filter(Boolean)
          : [],
        source_cluster_ids: Array.isArray(summaryPayload?.cleanup_group_source_cluster_ids)
          ? summaryPayload.cleanup_group_source_cluster_ids
              .map((entry) => runtimeArtifactText(entry))
              .filter(Boolean)
          : [clusterId],
        cluster_type: runtimeArtifactText(summary.cluster_type),
        title: runtimeArtifactText(summary.title),
        query: runtimeArtifactText(summary.query),
        why_selected:
          runtimeArtifactNullableText(summary.why_selected) || 'Chosen from published cleanup artifacts.',
        risk_note:
          runtimeArtifactNullableText(summary.risk_note) || 'Confirm mixed senders before archive.',
        safety_note:
          runtimeArtifactNullableText(summary.safety_note) ||
          'Artifact-backed runtime plan: review the sender set first, then confirm exact impact before archive.',
        surface_tier:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_tier) as RuntimeCleanupArtifactClusterInput['surface_tier']) ||
          null,
        surface_kind:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_kind) as RuntimeCleanupArtifactClusterInput['surface_kind']) ||
          null,
        surface_visibility:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_visibility) as RuntimeCleanupArtifactClusterInput['surface_visibility']) ||
          null,
        top_level_rank:
          typeof summaryPayload?.cleanup_group_top_level_rank === 'number'
            ? summaryPayload.cleanup_group_top_level_rank
            : null,
      } satisfies RuntimeCleanupArtifactClusterInput
    })
    .filter((entry): entry is RuntimeCleanupArtifactClusterInput => entry != null)
  const sources = rawInputs.map((cluster) => ({
    clusterId: cluster.cluster_id,
    canonicalClusterId: cluster.canonical_cluster_id || cluster.cluster_id,
    legacyClusterIds: cluster.legacy_cluster_ids,
    sourceClusterIds: cluster.source_cluster_ids,
  }))
  const seen = new Set<string>()

  return rawInputs.filter((cluster) => {
    const originalClusterId = cluster.cluster_id
    const originalCanonicalClusterId = cluster.canonical_cluster_id
    const identity = resolveCleanupClusterIdentity(cluster.cluster_id, sources)
    const canonicalClusterId = runtimeCanonicalClusterIdFromIdentity(identity, cluster.cluster_id)
    if (!canonicalClusterId || seen.has(canonicalClusterId)) return false
    cluster.cluster_id = canonicalClusterId
    cluster.canonical_cluster_id = canonicalClusterId
    cluster.legacy_cluster_ids = runtimeUniqueClusterIds([
      ...cluster.legacy_cluster_ids,
      ...identity.legacyClusterIds,
      ...(identity.canonicalDescriptor?.aliases.map((alias) => alias.clusterId) || []),
    ]).filter((clusterId) => clusterId !== canonicalClusterId)
    cluster.source_cluster_ids = runtimeUniqueClusterIds([
      ...cluster.source_cluster_ids,
      originalClusterId !== canonicalClusterId ? originalClusterId : '',
      originalCanonicalClusterId !== canonicalClusterId ? originalCanonicalClusterId : '',
      ...identity.sourceClusterIds,
    ]).filter((clusterId) => clusterId !== canonicalClusterId)
    seen.add(canonicalClusterId)
    return true
  })
}

async function buildRuntimeSenderOverviewArtifactSnapshot(params: {
  supabase: SupabaseAdminClient
  tenantId: string
  analysisScope: OperationsAnalysisScope
  clusters: RuntimeCleanupArtifactClusterInput[]
  preferredClusterId?: string | null
}): Promise<Record<string, GmailSenderWorkspaceData> | null> {
  if (params.analysisScope !== 'all_indexed' || params.clusters.length === 0) return null

  const preferredClusterId =
    typeof params.preferredClusterId === 'string' && params.preferredClusterId.trim()
      ? params.preferredClusterId.trim()
      : null
  if (!preferredClusterId) return null

  const selectedClusterIdentity = resolveCleanupClusterIdentity(
    preferredClusterId,
    params.clusters.map((cluster) => ({
      clusterId: cluster.cluster_id,
      canonicalClusterId: cluster.canonical_cluster_id || cluster.cluster_id,
      legacyClusterIds: cluster.legacy_cluster_ids,
      sourceClusterIds: cluster.source_cluster_ids,
    }))
  )
  const selectedCluster =
    params.clusters.find(
      (cluster) =>
        cluster.cluster_id ===
        runtimeCanonicalClusterIdFromIdentity(selectedClusterIdentity, preferredClusterId)
    ) || null
  if (!selectedCluster) return null

  const workspace = await loadGmailSenderWorkspaceForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    clusters: params.clusters,
    selectedCluster,
    page: 1,
    pageSize: 12,
  })
  if (!workspace.ok) return null

  return {
    [selectedCluster.cluster_id]: workspace.data,
  }
}

function buildRuntimeClusterSamplePreview(
  workspace: GmailSenderWorkspaceData | null | undefined
): GmailCleanupCluster['sample_preview'] {
  if (!workspace) return []

  const seen = new Set<string>()
  const previews: GmailCleanupCluster['sample_preview'] = []

  for (const sender of workspace.senders) {
    for (const preview of sender.preview_messages) {
      const messageId = runtimeArtifactText(preview.message_id)
      if (!messageId || seen.has(messageId)) continue
      seen.add(messageId)
      previews.push({
        message_id: messageId,
        ...(preview.thread_id ? { thread_id: preview.thread_id } : {}),
        ...(typeof preview.history_id === 'string' && preview.history_id.trim()
          ? { history_id: preview.history_id.trim() }
          : {}),
        ...(typeof preview.internal_date_ms === 'number' && Number.isFinite(preview.internal_date_ms)
          ? { internal_date_ms: preview.internal_date_ms }
          : {}),
        subject: preview.subject,
        from: preview.from,
        date: preview.date,
        snippet: preview.snippet,
        label_ids: Array.isArray(preview.label_ids) ? preview.label_ids : [],
        category_labels: Array.isArray(preview.category_labels) ? preview.category_labels : [],
        is_in_inbox: preview.is_in_inbox,
        is_unread: preview.is_unread,
        is_important: preview.is_important,
        is_starred: preview.is_starred,
      })
      if (previews.length >= 3) return previews
    }
  }

  return previews
}

function buildRuntimeClusterIndexedSignalWindow(
  value: unknown
): GmailCleanupCluster['indexed_signal_window'] | undefined {
  if (!isRecord(value)) return undefined

  const categoryMix = Array.isArray(value.category_mix)
    ? value.category_mix
        .map((entry) => {
          if (!isRecord(entry)) return null
          const category = runtimeArtifactText(entry.category)
          if (!category) return null
          return {
            category,
            count: runtimeArtifactInteger(entry.count),
          }
        })
        .filter((entry): entry is { category: string; count: number } => entry != null)
    : []

  return {
    count_last_30d: runtimeArtifactInteger(value.count_last_30d),
    count_last_90d: runtimeArtifactInteger(value.count_last_90d),
    count_last_180d: runtimeArtifactInteger(value.count_last_180d),
    count_total_indexed: runtimeArtifactInteger(value.count_total_indexed),
    unread_count: runtimeArtifactInteger(value.unread_count),
    important_count: runtimeArtifactInteger(value.important_count),
    starred_count: runtimeArtifactInteger(value.starred_count),
    in_inbox_count: runtimeArtifactInteger(value.in_inbox_count),
    category_mix: categoryMix,
    first_seen_at: runtimeArtifactNullableText(value.first_seen_at),
    last_seen_at: runtimeArtifactNullableText(value.last_seen_at),
    exactness: 'indexed_exact',
  }
}

function buildRuntimeCleanupClustersFromArtifacts(params: {
  summaries: GmailClusterSummaryArtifactRow[]
  senderOverviewSnapshot: Record<string, GmailSenderWorkspaceData> | null
}): GmailCleanupCluster[] {
  const runtimeClusterInputs = buildRuntimeCleanupArtifactClusterInputs(params.summaries)

  return params.summaries
    .map((summary) => {
      const summaryPayload = isRecord(summary.summary_payload) ? summary.summary_payload : null
      const indexedSignalWindow = buildRuntimeClusterIndexedSignalWindow(
        summaryPayload?.indexed_signal_window
      )
      const rawClusterId = runtimeArtifactText(summary.cluster_id)
      const resolvedCluster =
        runtimeClusterInputs.find((cluster) =>
          runtimeArtifactClusterLookupIds(cluster).includes(rawClusterId)
        ) || null
      const canonicalClusterId = resolvedCluster?.cluster_id || rawClusterId

      return {
        cluster_id: canonicalClusterId,
        canonical_cluster_id: canonicalClusterId,
        legacy_cluster_ids: resolvedCluster?.legacy_cluster_ids || [],
        cluster_type: runtimeArtifactText(summary.cluster_type) as GmailCleanupCluster['cluster_type'],
        title: runtimeArtifactText(summary.title),
        query: runtimeArtifactText(summary.query),
        why_selected:
          runtimeArtifactNullableText(summary.why_selected) || 'Chosen from published cleanup artifacts.',
        sender_count: runtimeArtifactInteger(summary.sender_count),
        message_count: runtimeArtifactInteger(summary.message_count),
        estimated_count: runtimeArtifactInteger(summary.message_count),
        sample_preview: buildRuntimeClusterSamplePreview(
          params.senderOverviewSnapshot?.[canonicalClusterId] ||
            params.senderOverviewSnapshot?.[rawClusterId]
        ),
        risk_note:
          runtimeArtifactNullableText(summary.risk_note) ||
          'Confirm mixed senders before archive.',
        safety_note:
          runtimeArtifactNullableText(summary.safety_note) ||
          'Artifact-backed runtime plan: review the sender set first, then confirm exact impact before archive.',
        surface_tier:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_tier) as GmailCleanupCluster['surface_tier']) ||
          null,
        surface_kind:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_kind) as GmailCleanupCluster['surface_kind']) ||
          null,
        surface_visibility:
          (runtimeArtifactNullableText(summaryPayload?.cleanup_group_surface_visibility) as GmailCleanupCluster['surface_visibility']) ||
          null,
        top_level_rank:
          typeof summaryPayload?.cleanup_group_top_level_rank === 'number'
            ? summaryPayload.cleanup_group_top_level_rank
            : null,
        ...(indexedSignalWindow ? { indexed_signal_window: indexedSignalWindow } : {}),
      }
    })
    .filter(
      (cluster) => cluster.cluster_id.length > 0 && cluster.query.length > 0 && cluster.estimated_count > 0
    )
}

function buildRuntimeMailboxProfileFromArtifacts(params: {
  analysisScope: OperationsAnalysisScope
  publication: GmailArtifactPublicationRow | null
  mailboxIntelligence: GmailMailboxIntelligenceData | null
  freshness: 'cached' | 'stale'
  currentIndexedTotal: number
  currentIndexedInbox: number
  clusterCount: number
}): GmailMailboxProfile {
  const generatedAt =
    runtimeArtifactNullableText(params.publication?.published_at) || new Date().toISOString()
  const analysisWindowDays = runtimeMailboxProfileAnalysisWindow(params.analysisScope)
  const querySuffix = runtimeMailboxProfileQuerySuffix(params.analysisScope)
  const wholeMailbox = params.mailboxIntelligence?.whole_mailbox || null
  const cleanupCandidateUniverse = params.mailboxIntelligence?.cleanup_candidate_universe || null
  const protectedSafeContext = params.mailboxIntelligence?.protected_safe_context || null
  const cleanupGroups = params.mailboxIntelligence?.cleanup_groups || []
  const senderRanking = params.mailboxIntelligence?.sender_ranking || []

  const indexedTotal =
    runtimeArtifactInteger(wholeMailbox?.message_count) ||
    runtimeArtifactInteger(params.publication?.last_indexed_message_count) ||
    params.currentIndexedTotal
  const indexedInbox =
    runtimeArtifactInteger(wholeMailbox?.indexed_inbox_rows) || params.currentIndexedInbox
  const unreadEstimate = senderRanking.reduce(
    (sum, entry) => sum + runtimeArtifactInteger(entry.unread_count),
    0
  )
  const machineEstimate = senderRanking.reduce(
    (sum, entry) =>
      sum +
      (entry.sender_signal === 'likely_machine_generated'
        ? Math.max(
            runtimeArtifactInteger(entry.cleanup_candidate_message_count),
            runtimeArtifactInteger(entry.total_message_count)
          )
        : 0),
    0
  )
  const humanEstimate =
    runtimeArtifactInteger(protectedSafeContext?.likely_human_message_count) ||
    senderRanking.reduce(
      (sum, entry) =>
        sum +
        (entry.sender_signal === 'likely_human' ? runtimeArtifactInteger(entry.total_message_count) : 0),
      0
    )
  const cleanupCandidateCount = runtimeArtifactInteger(cleanupCandidateUniverse?.message_count)
  const senderSignalByKey = new Map(
    senderRanking.map((entry) => [runtimeArtifactText(entry.sender_key), entry.sender_signal])
  )

  const recurringCategories = (wholeMailbox?.category_breakdown || [])
    .map((entry) => {
      const category = runtimeMailboxProfileCategory(entry.label)
      if (!category) return null
      return {
        category,
        estimated_count: runtimeArtifactInteger(entry.count),
        source: 'gmail_native' as const,
      }
    })
    .filter(
      (entry): entry is GmailMailboxProfile['recurring_categories'][number] =>
        entry != null && entry.estimated_count > 0
    )

  const senderFrequency = (wholeMailbox?.top_senders || []).slice(0, 5).map((entry) => ({
    sender: runtimeArtifactText(entry.sender),
    count: runtimeArtifactInteger(entry.message_count),
    signal:
      senderSignalByKey.get(runtimeArtifactText(entry.sender_key)) ||
      ('uncertain' as const),
    source: 'computed_recent_window_sample' as const,
  }))

  const protectionCandidates: GmailMailboxProfile['protection_candidates'] = []
  if (runtimeArtifactInteger(protectedSafeContext?.protected_message_count) > 0) {
    protectionCandidates.push({
      title: 'Protected correspondence',
      query: `in:inbox category:primary${querySuffix}`,
      estimated_count: runtimeArtifactInteger(protectedSafeContext?.protected_message_count),
      reason:
        runtimeArtifactNullableText(protectedSafeContext?.summary) ||
        'Published artifacts still show protected correspondence that should stay out of early cleanup waves.',
      source: 'gmail_native_plus_heuristic',
    })
  }
  if (runtimeArtifactInteger(protectedSafeContext?.likely_human_message_count) > 0) {
    protectionCandidates.push({
      title: 'Likely human-priority correspondence',
      query: `in:inbox category:primary${querySuffix} -from:noreply -from:no-reply`,
      estimated_count: runtimeArtifactInteger(protectedSafeContext?.likely_human_message_count),
      reason:
        'Published artifacts show likely human-priority correspondence that should be review-first, not bulk cleaned.',
      source: 'gmail_native_plus_heuristic',
    })
  }

  const cleanupCandidates = cleanupGroups.slice(0, 4).map((group) => ({
    title: runtimeArtifactText(group.title),
    query: runtimeArtifactText(group.query),
    estimated_count: runtimeArtifactInteger(group.message_count),
    reason:
      runtimeArtifactNullableText(group.why_selected) ||
      `${runtimeArtifactInteger(group.message_count)} indexed messages grouped by shared sender behavior.`,
    source: 'gmail_native_plus_heuristic' as const,
  }))

  const ruleOpportunities = senderRanking
    .filter((entry) => runtimeArtifactInteger(entry.cleanup_candidate_message_count) > 0)
    .slice(0, 3)
    .map((entry) => ({
      title: runtimeArtifactText(entry.sender),
      query: `from:${runtimeArtifactText(entry.sender)}`,
      estimated_count: runtimeArtifactInteger(entry.cleanup_candidate_message_count),
      reason:
        runtimeArtifactNullableText(entry.cleanup_exclusion_reason)
          ?.replace(/_/g, ' ') ||
        'Published sender-level artifacts indicate repeat cleanup candidate traffic for this sender.',
      source: 'gmail_native_plus_heuristic' as const,
    }))

  return {
    generated_at: generatedAt,
    analysis_window_days: analysisWindowDays,
    profile_model: 'gmail_native_signals_plus_bounded_sample.v1',
    metadata_scan_basis: {
      message_id_scan_count: indexedTotal,
      metadata_message_count: indexedTotal,
    },
    recommendation_confidence:
      params.clusterCount > 0 || cleanupCandidateCount > 0 ? 'moderate' : 'preliminary',
    freshness: {
      status: params.freshness,
      last_generated_at: generatedAt,
      expires_at: params.freshness === 'cached' ? generatedAt : null,
      cache_ttl_seconds: Math.floor(CLEANUP_PROFILE_CACHE_TTL_MS / 1000),
    },
    native_signal_counts: {
      inbox_recent_estimate: indexedInbox,
      category_primary_estimate: runtimeMailboxProfileCategoryCount(
        wholeMailbox?.category_breakdown || [],
        'primary'
      ),
      category_promotions_estimate: runtimeMailboxProfileCategoryCount(
        wholeMailbox?.category_breakdown || [],
        'promotions'
      ),
      category_social_estimate: runtimeMailboxProfileCategoryCount(
        wholeMailbox?.category_breakdown || [],
        'social'
      ),
      category_updates_estimate: runtimeMailboxProfileCategoryCount(
        wholeMailbox?.category_breakdown || [],
        'updates'
      ),
      category_forums_estimate: runtimeMailboxProfileCategoryCount(
        wholeMailbox?.category_breakdown || [],
        'forums'
      ),
      unread_recent_estimate: unreadEstimate,
      important_recent_estimate: 0,
      starred_recent_estimate: 0,
      likely_machine_generated_recent_estimate: machineEstimate,
      likely_human_priority_recent_estimate: humanEstimate,
      stale_unread_30d_estimate: Math.min(unreadEstimate, cleanupCandidateCount || unreadEstimate),
      stale_unread_60d_estimate: Math.min(unreadEstimate, cleanupCandidateCount || unreadEstimate),
      stale_unread_90d_estimate: Math.min(unreadEstimate, cleanupCandidateCount || unreadEstimate),
    },
    recurring_categories: recurringCategories,
    sender_frequency: senderFrequency.filter((entry) => entry.sender.length > 0 && entry.count > 0),
    subject_patterns: [],
    protection_candidates: protectionCandidates,
    cleanup_candidates: cleanupCandidates.filter(
      (entry) => entry.title.length > 0 && entry.query.length > 0 && entry.estimated_count > 0
    ),
    rule_opportunities: ruleOpportunities.filter(
      (entry) => entry.title.length > 0 && entry.estimated_count > 0
    ),
    cluster_diagnostics: {
      source_counts: {
        indexed_total_rows: indexedTotal,
        indexed_inbox_rows: indexedInbox,
        inbox_rows: indexedInbox,
        recent_window_rows: cleanupCandidateCount,
        safety_eligible_rows: cleanupCandidateCount,
        discovery_rows_used: cleanupCandidateCount,
        discovery_window_days: analysisWindowDays,
        effective_discovery_window_days: analysisWindowDays,
        indexed_date_span_start: runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_start),
        indexed_date_span_end: runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_end),
        indexed_oldest_message_at: runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_start),
        indexed_newest_message_at: runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_end),
      },
      rejection_buckets: {
        not_in_inbox: Math.max(0, indexedTotal - indexedInbox),
        starred_or_important: 0,
        category_primary: runtimeMailboxProfileCategoryCount(
          wholeMailbox?.category_breakdown || [],
          'primary'
        ),
        younger_than_7d: 0,
        no_cluster_pattern_match: Math.max(
          0,
          cleanupCandidateCount -
            cleanupGroups.reduce(
              (sum, cluster) => sum + runtimeArtifactInteger(cluster.message_count),
              0
            )
        ),
      },
      strict_cluster_match_counts: cleanupGroups.map((cluster) => ({
        cluster_id: runtimeArtifactText(cluster.cluster_id),
        count: runtimeArtifactInteger(cluster.message_count),
      })),
      fallback_cluster_match_counts: [],
      used_exploratory_fallback: false,
      final_cluster_count: params.clusterCount,
    },
    notes: [
      params.publication?.published_version
        ? `Artifact-backed runtime mailbox profile served from published version ${params.publication.published_version}.`
        : 'Published runtime cleanup artifact is missing; serving safe partial mailbox profile.',
      `Cluster generation: ${params.clusterCount} cleanup clusters available from artifact summaries.`,
      `Indexed coverage span: ${runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_start) || 'unknown'} -> ${
        runtimeArtifactNullableText(wholeMailbox?.indexed_date_span_end) || 'unknown'
      } across ${indexedTotal.toLocaleString()} total indexed rows.`,
    ],
  }
}

function buildRuntimeCleanupDiscoveryDataFromArtifacts(params: {
  analysisScope: OperationsAnalysisScope
  publication: GmailArtifactPublicationRow | null
  summaries: GmailClusterSummaryArtifactRow[]
  mailboxIntelligence: GmailMailboxIntelligenceData | null
  senderOverviewSnapshot: Record<string, GmailSenderWorkspaceData> | null
  freshness: 'cached' | 'stale'
  currentIndexedTotal: number
  currentIndexedInbox: number
}): GmailCleanupDiscoveryData {
  const clusters = buildRuntimeCleanupClustersFromArtifacts({
    summaries: params.summaries,
    senderOverviewSnapshot: params.senderOverviewSnapshot,
  })
  const mailboxProfile = buildRuntimeMailboxProfileFromArtifacts({
    analysisScope: params.analysisScope,
    publication: params.publication,
    mailboxIntelligence: params.mailboxIntelligence,
    freshness: params.freshness,
    currentIndexedTotal: params.currentIndexedTotal,
    currentIndexedInbox: params.currentIndexedInbox,
    clusterCount: clusters.length,
  })

  return {
    generated_at:
      runtimeArtifactNullableText(params.publication?.published_at) || new Date().toISOString(),
    planning_mode: 'read_only',
    safety_defaults: [...RUNTIME_CLEANUP_SAFETY_DEFAULTS],
    clusters,
    mailbox_profile: mailboxProfile,
    ...(params.mailboxIntelligence
      ? { mailbox_intelligence_snapshot: params.mailboxIntelligence }
      : {}),
    ...(params.senderOverviewSnapshot && Object.keys(params.senderOverviewSnapshot).length > 0
      ? { sender_overview_snapshot: params.senderOverviewSnapshot }
      : {}),
  }
}

function runtimeCleanupArtifactAdvancedSincePublication(params: {
  publication: GmailArtifactPublicationRow | null
  indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null
  indexCoverage: RuntimeMailboxIndexCoverage | null
}): boolean {
  if (!params.publication?.published_version) return false

  const currentIndexedTotal =
    params.indexCoverage && Number.isFinite(params.indexCoverage.indexed_total_rows)
      ? params.indexCoverage.indexed_total_rows
      : params.indexState && Number.isFinite(params.indexState.indexed_message_count)
        ? params.indexState.indexed_message_count
        : 0

  if (
    Number.isFinite(params.publication.last_indexed_message_count) &&
    params.publication.last_indexed_message_count !== currentIndexedTotal
  ) {
    return true
  }

  const publicationIndexStateMs = parseDateMs(params.publication.last_index_state_updated_at)
  const latestIndexActivityMs = deriveIndexStateActivityMs(params.indexState)
  return Boolean(
    publicationIndexStateMs != null &&
      latestIndexActivityMs != null &&
      latestIndexActivityMs > publicationIndexStateMs + 1000
  )
}

type RuntimeArtifactPublicationReadiness = {
  state: 'transitional' | 'terminal_unavailable' | 'usable'
  reason: string
}

function runtimeArtifactPublicationReadiness(
  publication: GmailArtifactPublicationRow | null
): RuntimeArtifactPublicationReadiness {
  if (
    publication?.build_status === 'failed' ||
    publication?.freshness_state === 'stale' ||
    publication?.freshness_state === 'refresh_failed' ||
    publication?.freshness_state === 'full_rebuild_required'
  ) {
    return { state: 'terminal_unavailable', reason: 'artifact_unavailable' }
  }
  if (
    publication?.build_status === 'building' ||
    publication?.freshness_state === 'refresh_pending' ||
    publication?.freshness_state === 'refresh_in_progress'
  ) {
    return { state: 'transitional', reason: 'artifact_building' }
  }
  if (!publication?.published_version) {
    return { state: 'transitional', reason: 'missing_artifact' }
  }
  if (
    (publication.freshness_state === 'fresh' ||
      publication.freshness_state === 'refresh_skipped') &&
    (publication.build_status === 'published' || publication.build_status === 'idle')
  ) {
    return { state: 'usable', reason: publication.freshness_state }
  }
  return { state: 'terminal_unavailable', reason: 'artifact_unavailable' }
}

function enqueueCleanupDiscoveryRefreshInBackground(params: {
  supabase: SupabaseAdminClient
  agentId: string
  tenantId: string
  analysisScope: OperationsAnalysisScope
  topSenders: string[]
  refreshReason: string
  allowWhenFlagDisabled?: boolean
}): boolean {
  if (
    !params.allowWhenFlagDisabled &&
    !isGmailArtifactFlagEnabled('runtime_background_refresh')
  ) {
    return false
  }

  const topSenders = Array.from(
    new Set(params.topSenders.map((sender) => runtimeArtifactText(sender)).filter(Boolean))
  )

  setTimeout(() => {
    void (async () => {
      const startedAt = Date.now()
      console.info(
        `${RUNTIME_BACKGROUND_REFRESH_LOG_PREFIX} ${JSON.stringify({
          event: 'started',
          agent_id: params.agentId,
          tenant_id: params.tenantId,
          selected_analysis_scope: params.analysisScope,
          refresh_reason: params.refreshReason,
          top_sender_count: topSenders.length,
        })}`
      )

      try {
        const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
          supabase: params.supabase,
          tenantId: params.tenantId,
          topSenders,
          analysisScope: params.analysisScope,
          logPrefix: '[playground/cleanup-discovery/background]',
          disableInlineIndexSync: true,
          preferExistingIndexedCoverage: true,
          skipIndexSyncIfRecentMs: CLEANUP_PROFILE_CACHE_TTL_MS,
          allowFullRescanOnIndexSyncFailure: false,
        })

        if (!cleanupDiscovery.ok) {
          console.warn(
            `${RUNTIME_BACKGROUND_REFRESH_LOG_PREFIX} ${JSON.stringify({
              event: 'failed',
              agent_id: params.agentId,
              tenant_id: params.tenantId,
              selected_analysis_scope: params.analysisScope,
              refresh_reason: params.refreshReason,
              duration_ms: Math.max(0, Date.now() - startedAt),
              error: cleanupDiscovery.error,
            })}`
          )
          return
        }

        const generatedAt = new Date().toISOString()
        const expiresAtIso = new Date(Date.now() + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString()
        await saveCleanupDiscoverySnapshot({
          supabase: params.supabase,
          agentId: params.agentId,
          analysisScope: params.analysisScope,
          generatedAt,
          expiresAt: expiresAtIso,
          cleanupDiscoveryData: cleanupDiscovery.data,
        })

        console.info(
          `${RUNTIME_BACKGROUND_REFRESH_LOG_PREFIX} ${JSON.stringify({
            event: 'completed',
            agent_id: params.agentId,
            tenant_id: params.tenantId,
            selected_analysis_scope: params.analysisScope,
            refresh_reason: params.refreshReason,
            duration_ms: Math.max(0, Date.now() - startedAt),
            cluster_count: cleanupDiscovery.data.clusters.length,
          })}`
        )
      } catch (error) {
        console.warn('[playground] cleanup background refresh failed (non-fatal):', error)
      }
    })()
  }, 0)

  return true
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
  preferredClusterId?: string | null
  transitionEdge?: 'smart_sync_handoff' | 'build_pending_poll' | null
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
    | 'artifact_fresh'
    | 'index_advanced'
    | 'failed_artifact_recovery'
    | 'missing_artifact'
    | 'snapshot_expired'
    | 'snapshot_fresh'
    | 'snapshot_missing'
    | 'scoped_discovery'
    | 'zero_cluster_artifact'
    | 'build_pending_stable_snapshot'
    | 'rehydrate_skip' = 'none'
  let selectedAnalysisScope: OperationsAnalysisScope | null = null
  let snapshotScope: OperationsAnalysisScope | null = null
  let reviewScope: OperationsAnalysisScope | null = null
  let effectiveDiscoveryWindowDays: string | number | null = null
  let cleanupPlanDetailMs: Record<string, unknown> | null = null
  let snapshotVersionBefore: string | null = null
  let snapshotVersionAfter: string | null = null
  let previousSnapshotServedWhileRefreshing = false
  let continuityState: 'standard' | 'build_pending_showing_stable_snapshot' = 'standard'
  let buildPendingWhileServingStableSnapshot = false
  let cleanupDiscoveryData: GmailCleanupDiscoveryData | null = null
  let selectedClusterRailFamily: OperationsSelectedClusterRailFamily | null = null
  let selectedClusterRailFamilyLoadMs = 0
  let preferredClusterReviewBootstrapMs = 0
  let selectedClusterRailFamilyLoadMode = 'skipped'
  let selectedClusterRailFamilyCacheStatus = 'skipped'
  const runtimeRefreshDiagnosticContext = createRuntimeRefreshDiagnosticContext({
    analysisScope: params.analysisScope ?? null,
    requestMode: params.requestMode,
    forceMailboxProfileRefresh: params.forceMailboxProfileRefresh,
  })
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

  const intentGateStartedAt = Date.now()
  const shouldRunCleanupDiscovery = shouldRunGmailCleanupDiscovery({
    runtimeEvidence: runtimeInputs.runtimeEvidence,
    runtimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
    runtimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
    runtimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    isInboxCleanupIntent: params.isInboxCleanupIntent,
  })
  phaseMs.inbox_cleanup_intent_gate_ms = Date.now() - intentGateStartedAt

  if (shouldRunCleanupDiscovery) {
    const cleanupPlanStartedAt = Date.now()
    const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
    const preferredClusterId =
      typeof params.preferredClusterId === 'string' && params.preferredClusterId.trim()
        ? params.preferredClusterId.trim()
        : null
    selectedAnalysisScope = analysisScope
    runtimeRefreshDiagnosticContext.analysisScope = analysisScope
    reviewScope = analysisScope
    const cacheKey = `${params.agentId}:${analysisScope}`
    const now = Date.now()
    const forceRefresh = params.forceMailboxProfileRefresh === true
    const transitionEdge =
      params.transitionEdge === 'smart_sync_handoff' || params.transitionEdge === 'build_pending_poll'
        ? params.transitionEdge
        : null
    const criticalArtifactTransitionRead =
      analysisScope === 'all_indexed' &&
      params.requestMode === 'rehydrate_only' &&
      (transitionEdge === 'smart_sync_handoff' || transitionEdge === 'build_pending_poll')
    const mandatoryArtifactRefreshHandoff =
      analysisScope === 'all_indexed' &&
      params.requestMode === 'rehydrate_only' &&
      forceRefresh &&
      transitionEdge === 'smart_sync_handoff'
    const acceptedArtifactOnlyHydration = params.requestMode === 'rehydrate_only'
    const tenantId = await loadTenantIdForUser({
      supabase: params.supabase,
      userId: params.agentUserId,
    })
    let indexState: Awaited<ReturnType<typeof loadGmailMailboxIndexState>> | null = null
    let indexCoverage: RuntimeMailboxIndexCoverage | null = null
    let indexMetadataLoadMs = 0
    let artifactPublicationLoadMs = 0

    if (tenantId && analysisScope === 'all_indexed') {
      const startedAt = Date.now()
      indexState = await loadGmailMailboxIndexState({
        supabase: params.supabase,
        tenantId,
      })
      indexCoverage = {
        indexed_total_rows:
          typeof indexState?.indexed_message_count === 'number'
            ? Math.max(0, indexState.indexed_message_count)
            : 0,
        indexed_inbox_rows: null,
        indexed_date_span_start: null,
        indexed_date_span_end: null,
      }
      indexMetadataLoadMs = Math.max(0, Date.now() - startedAt)
    }

    cleanupIndexStateIndexedCount =
      indexCoverage && Number.isFinite(indexCoverage.indexed_total_rows)
        ? indexCoverage.indexed_total_rows
        : indexState && Number.isFinite(indexState.indexed_message_count)
          ? indexState.indexed_message_count
          : 0
    cleanupIndexStateInboxCount =
      indexCoverage &&
      typeof indexCoverage.indexed_inbox_rows === 'number' &&
      Number.isFinite(indexCoverage.indexed_inbox_rows)
        ? indexCoverage.indexed_inbox_rows
        : 0

    if (!tenantId) {
      cleanupProfileStatus = 'none'
      cleanupProfileRefreshReason = 'missing_artifact'
      cleanupPlanDetailMs = {
        wrapper_snapshot_preload_skipped: true,
        wrapper_index_metadata_preload_ms: 0,
        wrapper_index_metadata_preload_skipped: true,
        artifact_mode: 'safe_partial',
        background_refresh_enqueued: false,
        background_refresh_mode: 'missing_tenant',
        snapshot_save_mode: 'skipped',
      }
      phaseMs.cleanup_plan_ms = Date.now() - cleanupPlanStartedAt
    } else {
      if (analysisScope === 'all_indexed' || acceptedArtifactOnlyHydration) {
        const artifactReadStartedAt = Date.now()
        const artifactRead = await (async () => {
          try {
            const result = await readCachedRuntimeMailboxArtifact({
              supabase: params.supabase,
              tenantId,
              analysisScope,
              forceRefresh,
              awaitRefreshHandoff: forceRefresh || transitionEdge === 'smart_sync_handoff',
              bypassCache: forceRefresh || criticalArtifactTransitionRead,
            })
            updateRuntimeRefreshDiagnosticContextFromPublication(
              runtimeRefreshDiagnosticContext,
              result.publication
            )
            recordRuntimeRefreshPhaseResult({
              context: runtimeRefreshDiagnosticContext,
              phase: 'artifact_publication_read',
              status: 'success',
            })
            return result
          } catch (error) {
            throw createRuntimeRefreshPhaseError({
              context: runtimeRefreshDiagnosticContext,
              phase: 'artifact_publication_read',
              error,
            })
          }
        })()
        artifactPublicationLoadMs = Math.max(0, Date.now() - artifactReadStartedAt)

        const publication = artifactRead.publication
        const buildLiveness = artifactRead.build_liveness
        const summaries = artifactRead.cluster_summaries
        const clusterInputs = buildRuntimeCleanupArtifactClusterInputs(summaries)
        const artifactIsPublished = Boolean(publication?.published_version)
        const publicationReadiness = runtimeArtifactPublicationReadiness(publication)
        const artifactIndexAdvanced = runtimeCleanupArtifactAdvancedSincePublication({
          publication,
          indexState,
          indexCoverage,
        })
        const artifactIsUsable = publicationReadiness.state === 'usable'
        const failedArtifactNeedsRecovery = publicationReadiness.state === 'terminal_unavailable'
        const indexHasData = cleanupIndexStateIndexedCount > 0
        const zeroClusterArtifactNeedsRefresh = Boolean(
          artifactIsPublished && indexHasData && clusterInputs.length === 0
        )
        const missingArtifactNeedsRefresh = !artifactIsPublished
        const publicationBuildActive =
          buildLiveness?.build_is_live ??
          (publication?.build_status === 'building' &&
            typeof publication?.building_version === 'string' &&
            publication.building_version.length > 0 &&
            publication.building_version !== publication.published_version)

        buildPendingWhileServingStableSnapshot =
          params.requestMode === 'rehydrate_only' &&
          analysisScope === 'all_indexed' &&
          artifactIsPublished &&
          publicationReadiness.state === 'transitional' &&
          publicationBuildActive

        snapshotScope = artifactIsUsable || buildPendingWhileServingStableSnapshot ? analysisScope : null
        snapshotVersionBefore = artifactRead.artifact_version
        snapshotVersionAfter = artifactRead.artifact_version
        cleanupSnapshotClusterCount = clusterInputs.length

        let mailboxIntelligenceLoadMs = 0
        let senderOverviewSnapshotLoadMs = 0
        const shouldLoadMailboxIntelligence =
          (artifactIsUsable || buildPendingWhileServingStableSnapshot) && clusterInputs.length > 0
        const shouldPreloadSenderOverviewSnapshot =
          params.requestMode === 'rehydrate_only' &&
          artifactIsUsable &&
          clusterInputs.length > 0 &&
          Boolean(params.preferredClusterId) &&
          !buildPendingWhileServingStableSnapshot

        const [mailboxIntelligence, senderOverviewSnapshot] = await Promise.all([
          shouldLoadMailboxIntelligence
            ? (async () => {
                try {
                  const mailboxIntelligenceStartedAt = Date.now()
                  const mailboxIntelligence = await readCachedRuntimeMailboxIntelligence({
                    supabase: params.supabase,
                    tenantId,
                    analysisScope,
                    clusters: clusterInputs,
                    artifactRead,
                  })
                  mailboxIntelligenceLoadMs = Math.max(
                    0,
                    Date.now() - mailboxIntelligenceStartedAt
                  )
                  recordRuntimeRefreshPhaseResult({
                    context: runtimeRefreshDiagnosticContext,
                    phase: 'cached_intelligence_read',
                    status: 'success',
                  })
                  return mailboxIntelligence
                } catch (error) {
                  throw createRuntimeRefreshPhaseError({
                    context: runtimeRefreshDiagnosticContext,
                    phase: 'cached_intelligence_read',
                    error,
                  })
                }
              })()
            : Promise.resolve(null),
          shouldPreloadSenderOverviewSnapshot
            ? (async () => {
                const senderOverviewSnapshotStartedAt = Date.now()
                const snapshot = await buildRuntimeSenderOverviewArtifactSnapshot({
                  supabase: params.supabase,
                  tenantId,
                  analysisScope,
                  clusters: clusterInputs,
                  preferredClusterId: params.preferredClusterId,
                })
                senderOverviewSnapshotLoadMs = Math.max(
                  0,
                  Date.now() - senderOverviewSnapshotStartedAt
                )
                return snapshot
              })()
            : Promise.resolve(null),
        ])

        cleanupProfileRefreshReason = forceRefresh
          ? 'force'
          : artifactIndexAdvanced
            ? 'index_advanced'
            : failedArtifactNeedsRecovery
              ? 'failed_artifact_recovery'
            : zeroClusterArtifactNeedsRefresh
              ? 'zero_cluster_artifact'
              : missingArtifactNeedsRefresh
                ? 'missing_artifact'
                : 'artifact_fresh'
        if (buildPendingWhileServingStableSnapshot) {
          cleanupProfileRefreshReason = 'build_pending_stable_snapshot'
          continuityState = 'build_pending_showing_stable_snapshot'
        }

        const shouldAttemptBackgroundRefresh =
          params.requestMode !== 'rehydrate_only' &&
          !buildPendingWhileServingStableSnapshot &&
          (forceRefresh ||
            artifactIndexAdvanced ||
            failedArtifactNeedsRecovery ||
            zeroClusterArtifactNeedsRefresh ||
            missingArtifactNeedsRefresh)
        let backgroundRefreshEnqueued = false
        let backgroundRefreshMode = 'not_needed'

        if (shouldAttemptBackgroundRefresh) {
          const canAttemptRefresh =
            forceRefresh ||
            !cleanupDiscoveryAttemptAt.has(cacheKey) ||
            now - (cleanupDiscoveryAttemptAt.get(cacheKey) || 0) >
              STALE_DISCOVERY_REFRESH_COOLDOWN_MS

          if (canAttemptRefresh) {
            cleanupDiscoveryAttemptAt.set(cacheKey, now)
            backgroundRefreshEnqueued = enqueueCleanupDiscoveryRefreshInBackground({
              supabase: params.supabase,
              agentId: params.agentId,
              tenantId,
              analysisScope,
              topSenders:
                runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) ||
                [],
              refreshReason: cleanupProfileRefreshReason,
              allowWhenFlagDisabled: mandatoryArtifactRefreshHandoff,
            })
            backgroundRefreshMode = backgroundRefreshEnqueued ? 'enqueued' : 'flag_disabled'
          } else {
            backgroundRefreshMode = 'cooldown'
          }
        } else if (buildPendingWhileServingStableSnapshot) {
          backgroundRefreshMode = 'build_in_progress'
        }

        cleanupDiscoveryData = (() => {
          try {
            const result = buildRuntimeCleanupDiscoveryDataFromArtifacts({
              analysisScope,
              publication,
              summaries: artifactIsUsable || buildPendingWhileServingStableSnapshot ? summaries : [],
              mailboxIntelligence,
              senderOverviewSnapshot,
              freshness: artifactIsUsable ? 'cached' : 'stale',
              currentIndexedTotal: cleanupIndexStateIndexedCount,
              currentIndexedInbox: cleanupIndexStateInboxCount,
            })
            recordRuntimeRefreshPhaseResult({
              context: runtimeRefreshDiagnosticContext,
              phase: 'cleanup_discovery_data_build',
              status: 'success',
            })
            return result
          } catch (error) {
            throw createRuntimeRefreshPhaseError({
              context: runtimeRefreshDiagnosticContext,
              phase: 'cleanup_discovery_data_build',
              error,
            })
          }
        })()
        cleanupProfileStatus = artifactIsUsable
          ? 'cached'
          : buildPendingWhileServingStableSnapshot
            ? 'stale'
            : 'none'
        previousSnapshotServedWhileRefreshing =
          (backgroundRefreshEnqueued && artifactIsPublished) || buildPendingWhileServingStableSnapshot

        cleanupPlanDetailMs = {
          wrapper_snapshot_preload_ms: 0,
          wrapper_snapshot_preload_skipped: true,
          wrapper_index_metadata_preload_ms: indexMetadataLoadMs,
          wrapper_index_metadata_preload_skipped: false,
          wrapper_index_metadata_source: 'gmail_mailbox_index_state',
          request_time_gmail_messages_rows: 0,
          runtime_artifact_query_concurrency: 1,
          artifact_publication_load_ms: artifactPublicationLoadMs,
          mailbox_intelligence_load_ms: mailboxIntelligenceLoadMs,
          sender_overview_snapshot_load_ms: senderOverviewSnapshotLoadMs,
          artifact_mode: artifactIsPublished ? 'published_artifact' : 'safe_partial',
          artifact_version: artifactRead.artifact_version,
          artifact_freshness_state: publication?.freshness_state ?? null,
          artifact_build_status: publication?.build_status ?? null,
          artifact_publication_readiness: publicationReadiness.state,
          artifact_publication_readiness_reason: publicationReadiness.reason,
          artifact_build_liveness_status: buildLiveness?.status ?? null,
          artifact_build_reclaim_reason: buildLiveness?.reclaim_reason ?? null,
          artifact_build_reclaim_applied: buildLiveness?.reclaim_applied ?? false,
          artifact_published_version: publication?.published_version ?? null,
          artifact_building_version: publication?.building_version ?? null,
          artifact_cluster_summary_count: summaries.length,
          mailbox_intelligence_present: mailboxIntelligence != null,
          sender_overview_cluster_count: senderOverviewSnapshot
            ? Object.keys(senderOverviewSnapshot).length
            : 0,
          sender_overview_preload_scope: senderOverviewSnapshot
            ? failedArtifactNeedsRecovery
              ? 'preferred_cluster_failed_artifact_recovery'
              : 'selected_cluster_only'
            : 'skipped',
          sender_overview_preferred_cluster_id: params.preferredClusterId || null,
          background_refresh_enqueued: backgroundRefreshEnqueued,
          background_refresh_mode: backgroundRefreshMode,
          continuity_state: continuityState,
          continuity_build_pending: buildPendingWhileServingStableSnapshot,
          continuity_stable_snapshot_served: buildPendingWhileServingStableSnapshot,
          continuity_swap_ready: !buildPendingWhileServingStableSnapshot,
          snapshot_save_mode: backgroundRefreshEnqueued
            ? 'background_enqueued'
            : backgroundRefreshMode === 'cooldown'
              ? 'background_enqueue_cooldown'
              : backgroundRefreshMode === 'flag_disabled'
                ? 'background_enqueue_disabled'
                : 'skipped',
        }

        console.info(
          `[playground][cleanup-runtime-artifact] ${JSON.stringify({
            request_mode: params.requestMode ?? 'unknown',
            selected_analysis_scope: analysisScope,
            tenant_id: tenantId,
            artifact_mode: artifactIsPublished ? 'published_artifact' : 'safe_partial',
            artifact_version: artifactRead.artifact_version,
            artifact_freshness_state: publication?.freshness_state ?? null,
            artifact_refresh_strategy: publication?.refresh_strategy ?? null,
            cluster_summary_count: summaries.length,
            mailbox_intelligence_present: mailboxIntelligence != null,
            sender_overview_cluster_count: senderOverviewSnapshot
              ? Object.keys(senderOverviewSnapshot).length
              : 0,
            sender_overview_preload_scope: senderOverviewSnapshot
              ? failedArtifactNeedsRecovery
                ? 'preferred_cluster_failed_artifact_recovery'
                : 'selected_cluster_only'
              : 'skipped',
            sender_overview_preferred_cluster_id: params.preferredClusterId || null,
            cleanup_profile_status: cleanupProfileStatus,
            cleanup_profile_refresh_reason: cleanupProfileRefreshReason,
            background_refresh_enqueued: backgroundRefreshEnqueued,
            background_refresh_mode: backgroundRefreshMode,
          })}`
        )
      } else {
        const snapshotPreloadStartedAt = Date.now()
        const cleanupSnapshot = await loadLatestCleanupDiscoverySnapshot({
          supabase: params.supabase,
          agentId: params.agentId,
          analysisScope,
        })
        const snapshotPreloadMs = Math.max(0, Date.now() - snapshotPreloadStartedAt)
        const snapshotExpiresAtMs = parseDateMs(cleanupSnapshot?.expiresAt ?? null)
        const snapshotExpired = Boolean(snapshotExpiresAtMs != null && snapshotExpiresAtMs <= now)
        const snapshotIndexAdvanced = false
        const preferredClusterSnapshotReady = scopedCleanupSnapshotSupportsPreferredCluster({
          snapshot: cleanupSnapshot,
          preferredClusterId,
        })
        const requiresCurrentScopeRediscovery = Boolean(
          preferredClusterId &&
            !forceRefresh &&
            cleanupSnapshot &&
            (snapshotExpired || !preferredClusterSnapshotReady)
        )
        const hasFreshScopedSnapshot = Boolean(
          cleanupSnapshot &&
            !forceRefresh &&
            !snapshotExpired &&
            (!preferredClusterId || preferredClusterSnapshotReady)
        )
        const scopedSnapshotClusterCount = cleanupSnapshot?.cleanupDiscoveryData.clusters.length ?? 0
        cleanupSnapshotClusterCount = scopedSnapshotClusterCount
        snapshotScope = cleanupSnapshot?.analysisScope ?? null
        snapshotVersionBefore = cleanupSnapshot ? CLEANUP_DISCOVERY_SNAPSHOT_VERSION : null

        if (forceRefresh || requiresCurrentScopeRediscovery) {
          const topSenders = Array.from(
            new Set(
              (
                runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) ||
                []
              )
                .map((sender) => runtimeArtifactText(sender))
                .filter(Boolean)
            )
          )
          const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
            supabase: params.supabase,
            tenantId,
            topSenders,
            analysisScope,
            logPrefix: forceRefresh
              ? '[playground/cleanup-discovery/force-refresh]'
              : '[playground/cleanup-discovery/current-scope-refresh]',
            disableInlineIndexSync: true,
            preferExistingIndexedCoverage: true,
            skipIndexSyncIfRecentMs: CLEANUP_PROFILE_CACHE_TTL_MS,
            allowFullRescanOnIndexSyncFailure: false,
          })

          if (cleanupDiscovery.ok) {
            const generatedAt = new Date().toISOString()
            const expiresAtIso = new Date(Date.now() + CLEANUP_PROFILE_CACHE_TTL_MS).toISOString()
            await saveCleanupDiscoverySnapshot({
              supabase: params.supabase,
              agentId: params.agentId,
              analysisScope,
              generatedAt,
              expiresAt: expiresAtIso,
              cleanupDiscoveryData: cleanupDiscovery.data,
            })

            cleanupDiscoveryData = withMailboxProfileFreshness({
              discoveryData: cleanupDiscovery.data,
              freshness: 'fresh',
              generatedAt,
              expiresAt: expiresAtIso,
            })
            cleanupProfileStatus = 'fresh'
            cleanupProfileRefreshReason = forceRefresh ? 'force' : 'scoped_discovery'
            cleanupSnapshotClusterCount = cleanupDiscovery.data.clusters.length
            snapshotScope = analysisScope
            snapshotVersionAfter = CLEANUP_DISCOVERY_SNAPSHOT_VERSION
            cleanupPlanDetailMs = {
              wrapper_snapshot_preload_ms: snapshotPreloadMs,
              wrapper_snapshot_preload_skipped: false,
              wrapper_index_metadata_preload_ms: indexMetadataLoadMs,
              wrapper_index_metadata_preload_skipped: true,
              artifact_publication_load_ms: 0,
              artifact_mode: forceRefresh
                ? 'scoped_discovery_snapshot_force_refreshed'
                : 'scoped_discovery_snapshot_refreshed',
              scoped_snapshot_found: true,
              scoped_snapshot_expired: false,
              scoped_snapshot_index_advanced: false,
              scoped_snapshot_cluster_count: cleanupSnapshotClusterCount,
              mailbox_intelligence_present: cleanupDiscovery.data.mailbox_intelligence_snapshot != null,
              sender_overview_cluster_count: cleanupDiscovery.data.sender_overview_snapshot
                ? Object.keys(cleanupDiscovery.data.sender_overview_snapshot).length
                : 0,
              sender_overview_preload_scope: cleanupDiscovery.data.sender_overview_snapshot
                ? 'current_scope_refresh'
                : 'missing',
              sender_overview_preferred_cluster_id: params.preferredClusterId || null,
              background_refresh_enqueued: false,
              background_refresh_mode: 'not_needed',
              snapshot_save_mode: 'sync_refreshed_and_saved',
            }
          }
        }

      if (!cleanupDiscoveryData && hasFreshScopedSnapshot && cleanupSnapshot) {
          cleanupDiscoveryData = withMailboxProfileFreshness({
            discoveryData: cleanupSnapshot.cleanupDiscoveryData,
            freshness: 'cached',
            generatedAt: cleanupSnapshot.generatedAt,
            expiresAt: cleanupSnapshot.expiresAt,
          })
          cleanupProfileStatus = 'cached'
          cleanupProfileRefreshReason = 'snapshot_fresh'
          snapshotScope = analysisScope
          snapshotVersionAfter = CLEANUP_DISCOVERY_SNAPSHOT_VERSION
          cleanupPlanDetailMs = {
            wrapper_snapshot_preload_ms: snapshotPreloadMs,
            wrapper_snapshot_preload_skipped: false,
            wrapper_index_metadata_preload_ms: indexMetadataLoadMs,
            wrapper_index_metadata_preload_skipped: true,
            artifact_publication_load_ms: 0,
            artifact_mode: 'scoped_discovery_snapshot',
            scoped_snapshot_found: true,
            scoped_snapshot_expired: false,
            scoped_snapshot_index_advanced: false,
            scoped_snapshot_cluster_count: scopedSnapshotClusterCount,
            mailbox_intelligence_present: cleanupSnapshot.cleanupDiscoveryData.mailbox_intelligence_snapshot != null,
            sender_overview_cluster_count: cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot
              ? Object.keys(cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot).length
              : 0,
            sender_overview_preload_scope: cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot
              ? 'snapshot'
              : 'missing',
            sender_overview_preferred_cluster_id: params.preferredClusterId || null,
            background_refresh_enqueued: false,
            background_refresh_mode: 'not_needed',
            snapshot_save_mode: 'snapshot_reused',
          }
        } else if (!cleanupDiscoveryData) {
          cleanupProfileRefreshReason = forceRefresh
            ? 'force'
            : cleanupSnapshot == null
              ? 'snapshot_missing'
              : requiresCurrentScopeRediscovery
                ? 'scoped_discovery'
                : 'snapshot_expired'

          const canAttemptRefresh =
            forceRefresh ||
            !cleanupDiscoveryAttemptAt.has(cacheKey) ||
            now - (cleanupDiscoveryAttemptAt.get(cacheKey) || 0) >
              STALE_DISCOVERY_REFRESH_COOLDOWN_MS
          let backgroundRefreshEnqueued = false
          let backgroundRefreshMode = 'not_needed'

          if (canAttemptRefresh) {
            cleanupDiscoveryAttemptAt.set(cacheKey, now)
            backgroundRefreshEnqueued = enqueueCleanupDiscoveryRefreshInBackground({
              supabase: params.supabase,
              agentId: params.agentId,
              tenantId,
              analysisScope,
              topSenders:
                runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) ||
                [],
              refreshReason: cleanupProfileRefreshReason,
            })
            backgroundRefreshMode = backgroundRefreshEnqueued ? 'enqueued' : 'flag_disabled'
          } else {
            backgroundRefreshMode = 'cooldown'
          }

          if (cleanupSnapshot) {
            cleanupDiscoveryData = withMailboxProfileFreshness({
              discoveryData: cleanupSnapshot.cleanupDiscoveryData,
              freshness: 'stale',
              generatedAt: cleanupSnapshot.generatedAt,
              expiresAt: cleanupSnapshot.expiresAt,
            })
            cleanupProfileStatus = 'stale'
            snapshotScope = cleanupSnapshot.analysisScope
            snapshotVersionAfter = CLEANUP_DISCOVERY_SNAPSHOT_VERSION
            previousSnapshotServedWhileRefreshing = true

            cleanupPlanDetailMs = {
              wrapper_snapshot_preload_ms: snapshotPreloadMs,
              wrapper_snapshot_preload_skipped: false,
              wrapper_index_metadata_preload_ms: indexMetadataLoadMs,
              wrapper_index_metadata_preload_skipped: true,
              artifact_publication_load_ms: 0,
              artifact_mode: 'scoped_discovery_snapshot_stale',
              scoped_snapshot_found: true,
              scoped_snapshot_expired: snapshotExpired,
              scoped_snapshot_index_advanced: snapshotIndexAdvanced,
              scoped_snapshot_cluster_count: scopedSnapshotClusterCount,
              mailbox_intelligence_present: cleanupSnapshot.cleanupDiscoveryData.mailbox_intelligence_snapshot != null,
              sender_overview_cluster_count: cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot
                ? Object.keys(cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot).length
                : 0,
              sender_overview_preload_scope: cleanupSnapshot.cleanupDiscoveryData.sender_overview_snapshot
                ? 'snapshot'
                : 'missing',
              sender_overview_preferred_cluster_id: params.preferredClusterId || null,
              background_refresh_enqueued: backgroundRefreshEnqueued,
              background_refresh_mode: backgroundRefreshMode,
              snapshot_save_mode: backgroundRefreshEnqueued
                ? 'background_enqueued_snapshot_reused'
                : backgroundRefreshMode === 'cooldown'
                  ? 'background_enqueue_cooldown_snapshot_reused'
                  : 'background_enqueue_disabled_snapshot_reused',
            }
            previousSnapshotServedWhileRefreshing = backgroundRefreshEnqueued
          } else {
            const artifactReadStartedAt = Date.now()
            const artifactRead = await readCachedRuntimeMailboxArtifact({
              supabase: params.supabase,
              tenantId,
              analysisScope,
            })
            artifactPublicationLoadMs = Math.max(0, Date.now() - artifactReadStartedAt)

            const publication = artifactRead.publication
            const summaries = artifactRead.cluster_summaries
            const clusterInputs = buildRuntimeCleanupArtifactClusterInputs(summaries)
            const artifactIsPublished = Boolean(publication?.published_version)
            const publicationReadiness = runtimeArtifactPublicationReadiness(publication)
            const artifactIsUsable = publicationReadiness.state === 'usable'

            snapshotScope = artifactIsUsable ? analysisScope : null
            snapshotVersionAfter = artifactRead.artifact_version
            cleanupSnapshotClusterCount = artifactIsUsable ? clusterInputs.length : 0
            cleanupDiscoveryData = buildRuntimeCleanupDiscoveryDataFromArtifacts({
              analysisScope,
              publication,
              summaries: artifactIsUsable ? summaries : [],
              mailboxIntelligence: null,
              senderOverviewSnapshot: null,
              freshness: artifactIsUsable ? 'cached' : 'stale',
              currentIndexedTotal: cleanupIndexStateIndexedCount,
              currentIndexedInbox: cleanupIndexStateInboxCount,
            })
            cleanupProfileStatus = artifactIsUsable ? 'cached' : 'none'

            cleanupPlanDetailMs = {
              wrapper_snapshot_preload_ms: snapshotPreloadMs,
              wrapper_snapshot_preload_skipped: false,
              wrapper_index_metadata_preload_ms: indexMetadataLoadMs,
              wrapper_index_metadata_preload_skipped: true,
              artifact_publication_load_ms: artifactPublicationLoadMs,
              artifact_mode: artifactIsPublished
                ? 'published_artifact_scoped_fallback'
                : 'safe_partial',
              artifact_publication_readiness: publicationReadiness.state,
              artifact_publication_readiness_reason: publicationReadiness.reason,
              artifact_version: artifactRead.artifact_version,
              artifact_cluster_summary_count: summaries.length,
              mailbox_intelligence_present: false,
              sender_overview_cluster_count: 0,
              sender_overview_preload_scope: 'skipped',
              sender_overview_preferred_cluster_id: params.preferredClusterId || null,
              scoped_snapshot_found: false,
              scoped_snapshot_expired: false,
              scoped_snapshot_index_advanced: false,
              scoped_snapshot_cluster_count: 0,
              background_refresh_enqueued: backgroundRefreshEnqueued,
              background_refresh_mode: backgroundRefreshMode,
              snapshot_save_mode: backgroundRefreshEnqueued
                ? 'background_enqueued_artifact_fallback'
                : backgroundRefreshMode === 'cooldown'
                  ? 'background_enqueue_cooldown_artifact_fallback'
                  : 'background_enqueue_disabled_artifact_fallback',
            }
            previousSnapshotServedWhileRefreshing = backgroundRefreshEnqueued && artifactIsPublished
          }
        }

        console.info(
          `[playground][cleanup-runtime-artifact] ${JSON.stringify({
            request_mode: params.requestMode ?? 'unknown',
            selected_analysis_scope: analysisScope,
            tenant_id: tenantId,
            artifact_mode: readRecordString(cleanupPlanDetailMs, 'artifact_mode'),
            artifact_version: readRecordString(cleanupPlanDetailMs, 'artifact_version'),
            cluster_summary_count: readRecordNumber(cleanupPlanDetailMs, 'artifact_cluster_summary_count'),
            mailbox_intelligence_present: readRecordBoolean(
              cleanupPlanDetailMs,
              'mailbox_intelligence_present'
            ),
            sender_overview_cluster_count: readRecordNumber(
              cleanupPlanDetailMs,
              'sender_overview_cluster_count'
            ),
            sender_overview_preload_scope: readRecordString(
              cleanupPlanDetailMs,
              'sender_overview_preload_scope'
            ),
            sender_overview_preferred_cluster_id: params.preferredClusterId || null,
            scoped_snapshot_found: readRecordBoolean(cleanupPlanDetailMs, 'scoped_snapshot_found'),
            scoped_snapshot_expired: readRecordBoolean(
              cleanupPlanDetailMs,
              'scoped_snapshot_expired'
            ),
            scoped_snapshot_index_advanced: readRecordBoolean(
              cleanupPlanDetailMs,
              'scoped_snapshot_index_advanced'
            ),
            cleanup_profile_status: cleanupProfileStatus,
            cleanup_profile_refresh_reason: cleanupProfileRefreshReason,
            background_refresh_enqueued: readRecordBoolean(
              cleanupPlanDetailMs,
              'background_refresh_enqueued'
            ),
            background_refresh_mode: readRecordString(
              cleanupPlanDetailMs,
              'background_refresh_mode'
            ),
          })}`
        )
      }

      const deferSelectedClusterRailFamilyForBaselineSnapshot =
        params.requestMode === 'rehydrate_only' &&
        Boolean(preferredClusterId) &&
        transitionEdge == null &&
        !buildPendingWhileServingStableSnapshot

      if (tenantId && preferredClusterId && !buildPendingWhileServingStableSnapshot) {
        if (deferSelectedClusterRailFamilyForBaselineSnapshot) {
          const selectedClusterRailFamilyBaselineStartedAt = Date.now()
          selectedClusterRailFamily = buildBaselineSelectedClusterRailFamilyFromCleanupDiscoveryData({
            cleanupDiscoveryData,
            preferredClusterId,
            analysisScope,
          })
          selectedClusterRailFamilyLoadMs = Math.max(
            0,
            Date.now() - selectedClusterRailFamilyBaselineStartedAt
          )
          preferredClusterReviewBootstrapMs = 0
          selectedClusterRailFamilyLoadMode = selectedClusterRailFamily
            ? 'baseline_snapshot_seed'
            : 'deferred_for_baseline_snapshot'
          selectedClusterRailFamilyCacheStatus = selectedClusterRailFamily
            ? 'baseline_seed'
            : 'deferred'
          if (cleanupPlanDetailMs) {
            cleanupPlanDetailMs.selected_cluster_rail_family_deferred = true
            cleanupPlanDetailMs.selected_cluster_rail_family_defer_reason =
              'baseline_snapshot_unblock'
            cleanupPlanDetailMs.selected_cluster_rail_family_baseline_seeded =
              selectedClusterRailFamily != null
          }
          console.info(
            `[playground][selected-cluster-rail-family] ${JSON.stringify({
              request_mode: params.requestMode ?? 'unknown',
              selected_analysis_scope: analysisScope,
              preferred_cluster_id: preferredClusterId,
              cache_status: selectedClusterRailFamilyCacheStatus,
              selected_cluster_rail_family_load_ms: selectedClusterRailFamilyLoadMs,
              preferred_cluster_review_bootstrap_ms: preferredClusterReviewBootstrapMs,
              mode: selectedClusterRailFamilyLoadMode,
              defer_reason: 'baseline_snapshot_unblock',
              baseline_seeded: selectedClusterRailFamily != null,
              scope_count: selectedClusterRailFamily?.scopes.length || 0,
            })}`
          )
        } else {
          const preferredClusterReviewBootstrapStartedAt = Date.now()
          const preferredClusterIdentity = cleanupDiscoveryData
            ? resolveCleanupClusterIdentity(
                preferredClusterId,
                cleanupDiscoveryData.clusters.map((cluster) => ({
                  clusterId: cluster.cluster_id,
                  canonicalClusterId: cluster.canonical_cluster_id || cluster.cluster_id,
                  legacyClusterIds: cluster.legacy_cluster_ids || [],
                  sourceClusterIds:
                    'source_cluster_ids' in cluster && Array.isArray(cluster.source_cluster_ids)
                      ? cluster.source_cluster_ids
                      : [],
                }))
              )
            : null
          const preferredClusterCandidateIds = preferredClusterIdentity
            ? runtimeUniqueClusterIds([
                runtimeCanonicalClusterIdFromIdentity(preferredClusterIdentity, preferredClusterId),
                preferredClusterId,
                ...preferredClusterIdentity.legacyClusterIds,
                ...preferredClusterIdentity.sourceClusterIds,
              ])
            : [preferredClusterId]
          const selectedClusterTitle =
            cleanupDiscoveryData?.clusters.find(
              (cluster) => preferredClusterCandidateIds.includes(cluster.cluster_id)
            )?.title || null
          if (!indexCoverage) {
            indexCoverage = {
              indexed_total_rows:
                typeof indexState?.indexed_message_count === 'number'
                  ? Math.max(0, indexState.indexed_message_count)
                  : 0,
              indexed_inbox_rows: null,
              indexed_date_span_start: null,
              indexed_date_span_end: null,
            }
          }
          const normalizedCurrentScope =
            selectedAnalysisScope && GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.includes(selectedAnalysisScope)
              ? selectedAnalysisScope
              : null
          const selectedClusterRailFamilyStartedAt = Date.now()
          try {
            const scopedRailBootstrap = await resolveSelectedClusterRailBootstrapSnapshots({
              supabase: params.supabase,
              agentId: params.agentId,
              tenantId,
              preferredClusterId,
              analysisScopes: [...GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS],
              currentScope: normalizedCurrentScope,
              currentScopeCleanupDiscoveryData: cleanupDiscoveryData,
              indexState,
              indexCoverage,
              nowMs: Date.now(),
              allowReadonlyScopedDiscovery: params.requestMode !== 'rehydrate_only',
            })
            if (cleanupPlanDetailMs) {
              cleanupPlanDetailMs.runtime_artifact_query_concurrency = 1
              cleanupPlanDetailMs.selected_cluster_rail_snapshot_bootstrap_query_count =
                scopedRailBootstrap.snapshotBootstrapQueryCount
              cleanupPlanDetailMs.selected_cluster_rail_snapshot_bootstrap_returned_rows =
                scopedRailBootstrap.snapshotBootstrapReturnedRowCount
              cleanupPlanDetailMs.selected_cluster_rail_snapshot_bootstrap_cache_hit_scope_count =
                scopedRailBootstrap.snapshotBootstrapCacheHitScopeCount
              cleanupPlanDetailMs.selected_cluster_rail_snapshot_bootstrap_cache_miss_scope_count =
                scopedRailBootstrap.snapshotBootstrapCacheMissScopeCount
            }
            const snapshotFallbackByScope = Object.fromEntries(
              GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.map((scope) => [
                scope,
                buildSelectedClusterRailSnapshotFallback({
                  snapshot: scopedRailBootstrap.snapshotsByScope[scope] || null,
                  preferredClusterId,
                }),
              ])
            ) as Partial<
              Record<GmailArtifactAnalysisScope, SelectedClusterRailSnapshotScopeFallback | null>
            >
            try {
              const railFamilyResult = await loadSelectedClusterRailFamily({
                supabase: params.supabase,
                tenantId,
                preferredClusterId,
                clusterTitle: selectedClusterTitle,
                snapshotFallbackByScope,
              })
              selectedClusterRailFamily = railFamilyResult.family
              selectedClusterRailFamilyCacheStatus = railFamilyResult.cache_status
              selectedClusterRailFamilyLoadMs = Math.max(
                0,
                Date.now() - selectedClusterRailFamilyStartedAt
              )
              preferredClusterReviewBootstrapMs = Math.max(
                0,
                Date.now() - preferredClusterReviewBootstrapStartedAt
              )
              selectedClusterRailFamilyLoadMode = railFamilyResult.scope_resolution.some(
                (entry) => entry.source.startsWith('snapshot_')
              )
                ? 'batched_published_surfaces_with_scoped_snapshots'
                : 'batched_published_surfaces'
              if (cleanupPlanDetailMs) {
                cleanupPlanDetailMs.selected_cluster_rail_family_scope_resolution =
                  railFamilyResult.scope_resolution
                cleanupPlanDetailMs.selected_cluster_rail_family_snapshot_resolution =
                  scopedRailBootstrap.resolutions
              }
              console.info(
                `[playground][selected-cluster-rail-family] ${JSON.stringify({
                  request_mode: params.requestMode ?? 'unknown',
                  selected_analysis_scope: analysisScope,
                  preferred_cluster_id: preferredClusterId,
                  cache_status: selectedClusterRailFamilyCacheStatus,
                  selected_cluster_rail_family_load_ms: selectedClusterRailFamilyLoadMs,
                  preferred_cluster_review_bootstrap_ms: preferredClusterReviewBootstrapMs,
                  mode: selectedClusterRailFamilyLoadMode,
                  runtime_artifact_query_concurrency: 1,
                  snapshot_bootstrap_query_count:
                    scopedRailBootstrap.snapshotBootstrapQueryCount,
                  snapshot_bootstrap_returned_rows:
                    scopedRailBootstrap.snapshotBootstrapReturnedRowCount,
                  snapshot_bootstrap_cache_hit_scope_count:
                    scopedRailBootstrap.snapshotBootstrapCacheHitScopeCount,
                  snapshot_bootstrap_cache_miss_scope_count:
                    scopedRailBootstrap.snapshotBootstrapCacheMissScopeCount,
                  snapshot_resolution: scopedRailBootstrap.resolutions,
                  scope_resolution: railFamilyResult.scope_resolution,
                })}`
              )
            } catch (error) {
              selectedClusterRailFamily = null
              selectedClusterRailFamilyCacheStatus = 'failed'
              selectedClusterRailFamilyLoadMs = Math.max(
                0,
                Date.now() - selectedClusterRailFamilyStartedAt
              )
              preferredClusterReviewBootstrapMs = Math.max(
                0,
                Date.now() - preferredClusterReviewBootstrapStartedAt
              )
              selectedClusterRailFamilyLoadMode = 'failed'
              console.error('[playground][selected-cluster-rail-family] failed', {
                request_mode: params.requestMode ?? 'unknown',
                selected_analysis_scope: analysisScope,
                preferred_cluster_id: preferredClusterId,
                cache_status: selectedClusterRailFamilyCacheStatus,
                selected_cluster_rail_family_load_ms: selectedClusterRailFamilyLoadMs,
                preferred_cluster_review_bootstrap_ms: preferredClusterReviewBootstrapMs,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          } catch (error) {
            selectedClusterRailFamily = null
            selectedClusterRailFamilyCacheStatus = 'bootstrap_failed'
            selectedClusterRailFamilyLoadMs = Math.max(
              0,
              Date.now() - selectedClusterRailFamilyStartedAt
            )
            preferredClusterReviewBootstrapMs = Math.max(
              0,
              Date.now() - preferredClusterReviewBootstrapStartedAt
            )
            selectedClusterRailFamilyLoadMode = 'bootstrap_skipped_after_failure'
            if (cleanupPlanDetailMs) {
              cleanupPlanDetailMs.selected_cluster_rail_family_bootstrap_failed = true
              cleanupPlanDetailMs.selected_cluster_rail_family_bootstrap_failure_message =
                error instanceof Error ? error.message : String(error)
            }
            console.warn('[playground][selected-cluster-rail-family] bootstrap failed; continuing without rail family', {
              request_mode: params.requestMode ?? 'unknown',
              selected_analysis_scope: analysisScope,
              preferred_cluster_id: preferredClusterId,
              cache_status: selectedClusterRailFamilyCacheStatus,
              selected_cluster_rail_family_load_ms: selectedClusterRailFamilyLoadMs,
              preferred_cluster_review_bootstrap_ms: preferredClusterReviewBootstrapMs,
              freshness_state: readRecordString(cleanupPlanDetailMs, 'artifact_freshness_state'),
              build_status: readRecordString(cleanupPlanDetailMs, 'artifact_build_status'),
              published_version: readRecordString(cleanupPlanDetailMs, 'artifact_published_version'),
              building_version: readRecordString(cleanupPlanDetailMs, 'artifact_building_version'),
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
      }

      if (tenantId && preferredClusterId && buildPendingWhileServingStableSnapshot) {
        selectedClusterRailFamily = null
        selectedClusterRailFamilyLoadMs = 0
        preferredClusterReviewBootstrapMs = 0
        selectedClusterRailFamilyLoadMode = 'stable_snapshot_while_building'
        selectedClusterRailFamilyCacheStatus = 'build_pending'
        if (cleanupPlanDetailMs) {
          cleanupPlanDetailMs.selected_cluster_rail_family_mode =
            'stable_snapshot_while_building'
          cleanupPlanDetailMs.selected_cluster_rail_family_cache_status = 'build_pending'
          cleanupPlanDetailMs.selected_cluster_rail_family_build_pending = true
        }
      }

      if (cleanupPlanDetailMs) {
        cleanupPlanDetailMs.selected_cluster_rail_family_load_ms = selectedClusterRailFamilyLoadMs
        cleanupPlanDetailMs.preferred_cluster_review_bootstrap_ms =
          preferredClusterReviewBootstrapMs
        cleanupPlanDetailMs.selected_cluster_rail_family_mode = selectedClusterRailFamilyLoadMode
        cleanupPlanDetailMs.selected_cluster_rail_family_cache_status =
          selectedClusterRailFamilyCacheStatus
        cleanupPlanDetailMs.selected_cluster_rail_family_scope_count =
          selectedClusterRailFamily?.scopes.length || 0
      }

      phaseMs.cleanup_plan_ms = Date.now() - cleanupPlanStartedAt
    }
  }

  const assembleFinalStartedAt = Date.now()
  const runtimeState = (() => {
    try {
      const result = assembleGmailRuntimeState({
        runtimeEvidence: runtimeInputs.runtimeEvidence,
        latestRuntimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
        latestRuntimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
        latestRuntimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
        runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
        cleanupDiscoveryData,
        selectedClusterRailFamily,
      })
      recordRuntimeRefreshPhaseResult({
        context: runtimeRefreshDiagnosticContext,
        phase: 'runtime_assembly',
        status: 'success',
      })
      return result
    } catch (error) {
      throw createRuntimeRefreshPhaseError({
        context: runtimeRefreshDiagnosticContext,
        phase: 'runtime_assembly',
        error,
      })
    }
  })()
  const assembleFinalMs = Date.now() - assembleFinalStartedAt
  phaseMs.batch_suggestions_ms += assembleFinalMs
  if (cleanupPlanDetailMs) {
    cleanupPlanDetailMs.final_runtime_assemble_ms = assembleFinalMs
  }
  effectiveDiscoveryWindowDays =
    runtimeState.runtimeMailboxProfile?.cluster_diagnostics?.source_counts.discovery_window_days ??
    runtimeState.runtimeMailboxProfile?.analysis_window_days ??
    null

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

  const manualCleanupRegenerationAnalysisScope =
    selectedAnalysisScope ?? normalizeOperationsAnalysisScope(params.analysisScope)
  const manualCleanupContinuityState: 'standard' | 'build_pending_showing_stable_snapshot' =
    readRecordString(cleanupPlanDetailMs, 'continuity_state') ===
    'build_pending_showing_stable_snapshot'
      ? 'build_pending_showing_stable_snapshot'
      : 'standard'
  const manualCleanupRegenerationDiagnostics =
    params.requestMode === 'rehydrate_only'
      ? {
          analysisScope: manualCleanupRegenerationAnalysisScope,
          cleanupProfileStatus,
          cleanupProfileRefreshReason,
          snapshotScope,
          snapshotVersionBefore,
          snapshotVersionAfter,
          previousSnapshotServedWhileRefreshing,
          runtimeCleanupPlanGeneratedAt: runtimeState.runtimeCleanupPlan?.generated_at || null,
          runtimeMailboxProfileGeneratedAt: runtimeState.runtimeMailboxProfile?.generated_at || null,
          runtimeMailboxProfileFreshnessLastGeneratedAt:
            runtimeState.runtimeMailboxProfile?.freshness?.last_generated_at || null,
          derivedCacheVersion:
            runtimeState.runtimeCleanupPlan?.generated_at ||
            runtimeState.runtimeMailboxProfile?.freshness?.last_generated_at ||
            runtimeState.runtimeMailboxProfile?.generated_at ||
            null,
          runtimeCleanupPlanClusterCount: runtimeState.runtimeCleanupPlan?.clusters.length ?? 0,
          cleanupPlanMs: phaseMs.cleanup_plan_ms,
          runtimeStateTotalMs: phaseMs.runtime_state_total_ms,
          discoveryTotalMs: readRecordNumber(cleanupPlanDetailMs, 'total_ms'),
          wrapperSnapshotPreloadSkipped:
            readRecordBoolean(cleanupPlanDetailMs, 'wrapper_snapshot_preload_skipped') === true,
          wrapperIndexMetadataPreloadSkipped:
            readRecordBoolean(cleanupPlanDetailMs, 'wrapper_index_metadata_preload_skipped') ===
            true,
          discoveryRowCacheHit: readRecordBoolean(cleanupPlanDetailMs, 'indexed_rows_cache_hit'),
          indexedRowsLoadMs: readRecordNumber(cleanupPlanDetailMs, 'indexed_rows_load_ms'),
          indexSyncDisabledByRequest: readRecordBoolean(
            cleanupPlanDetailMs,
            'index_sync_disabled_by_request'
          ),
          snapshotSaveMode: readRecordString(cleanupPlanDetailMs, 'snapshot_save_mode'),
          finalRuntimeAssembleMs: readRecordNumber(cleanupPlanDetailMs, 'final_runtime_assemble_ms'),
          continuityState: manualCleanupContinuityState,
          buildPending:
            readRecordBoolean(cleanupPlanDetailMs, 'continuity_build_pending') === true,
          stableSnapshotServed:
            readRecordBoolean(cleanupPlanDetailMs, 'continuity_stable_snapshot_served') === true,
          swapReady: readRecordBoolean(cleanupPlanDetailMs, 'continuity_swap_ready') === true,
          publicationFreshnessState: readRecordString(
            cleanupPlanDetailMs,
            'artifact_freshness_state'
          ),
          publicationBuildStatus: readRecordString(cleanupPlanDetailMs, 'artifact_build_status'),
          publishedVersion: readRecordString(cleanupPlanDetailMs, 'artifact_published_version'),
          buildingVersion: readRecordString(cleanupPlanDetailMs, 'artifact_building_version'),
        }
      : null

  return {
    runtimeInputs,
    runtimeState,
    runtimeApprovalQueueSummary,
    runtimeApprovalQueueItems,
    manualCleanupRegenerationDiagnostics,
  }
}
