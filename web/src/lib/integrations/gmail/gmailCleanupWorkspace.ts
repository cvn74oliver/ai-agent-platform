import type { SupabaseClient } from '@supabase/supabase-js'
import { GMAIL_MAILBOX_INDEX_MAX_MESSAGES } from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  buildCanonicalSenderCategorySummary,
  GMAIL_PATTERN_LABEL_THIN_HISTORY,
  insufficientDataCanonicalSenderProfile,
  insufficientDataOperatorProfile,
  normalizePatternMix,
  resolveSenderSemanticsFromCompatibility,
} from '@/lib/integrations/gmail/gmailSenderProfile'
import {
  buildCompatibilityDominantPatternDistribution,
  buildCompatibilityOperatorProfileFamilyDistribution,
  buildCompatibilityOperatorProfileModeDistribution,
  buildSemanticAnalyticsDistributions,
  dominantPatternCompatibilityLabel,
} from '@/lib/integrations/gmail/gmailSemanticRollups'
import {
  buildMirroredSemanticArtifactFieldsFromRollup,
  buildPersistedSemanticRollupArtifactFields,
  ensureSharedGroupSemanticRollupCompatibility,
} from '@/lib/integrations/gmail/gmailSemanticRollupContract'
import {
  analysisScopeRowInclusionLowerBoundMs,
  buildCanonicalSenderWorkspaceActivityTimelineForRange,
  buildSenderWorkspaceActivityTimelineFromRows,
  activityTimelineGranularityForScope,
  assignSenderCleanupGroupDecision,
  buildQueryClusterBrowserSenderBreakdown,
  classifySenderPatternFromSubject,
  pressureTrendGroupingLabel,
  resolveCanonicalSenderActivityWindow,
  safePressureTrendTimeZone,
  type PressureTrendResolvedWindow,
  type GmailCleanupDiscoveryData,
  loadGmailSenderIndexSignalsForTenant,
  normalizeMailboxProfileScope,
  normalizeSender,
  rowCategoryHas,
  rowSender,
  rowSenderDomain,
  scopeDays,
  senderSignalFromText,
  type GmailAnalysisScope,
  type GmailSenderIndexSignal,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadIndexedGmailMessagesForTenant,
  type GmailMailboxIndexRow,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import {
  loadGmailArtifactPublicationStatesForTenant,
  loadPublishedGmailMailboxIntelligenceArtifact,
  loadPublishedGmailSenderWorkspaceArtifactPage,
  loadPublishedGmailSenderWorkspaceExecutionArtifact,
  loadPublishedGmailSenderWorkspaceArtifactFocusedPage,
  loadPublishedGmailSenderWorkspaceArtifactReviewUnitPage,
  type GmailPublishedMailboxIntelligenceArtifactRead,
  type GmailArtifactPublicationRow,
  type GmailClusterSummaryArtifactRow,
  type GmailMailboxIntelligenceBucketRow,
  type GmailPreviewIndexRow,
  type GmailSenderWorkspaceSeedHeaderRow,
  type GmailSenderWorkspaceSeedRow,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import {
  buildCleanupGroupFutureCanonicalPublishIdentity,
  resolveCleanupClusterIdentity,
  type CleanupClusterIdentitySource,
} from '@/lib/runtime/gmailCleanupClusterIdentity'
import {
  gmailPressureTrendArtifactBucketFamilyCandidates,
  gmailPressureTrendExpectedGroupingForWindow,
} from '@/lib/integrations/gmail/gmailPressureTrendArtifacts'
import {
  DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
  GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
  MAX_GMAIL_OPERATIONS_FIRST_PAINT_ARTIFACT_ROWS,
  MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
} from '@/lib/integrations/gmail/gmailWorkspaceContracts'
import type {
  GmailCleanupPreviewMessage,
  GmailConfirmationPreviewData,
  GmailMailboxIntelligenceData,
  GmailPressureTimelineBucket,
  GmailPressureTimelineComposition,
  GmailPressureTimelineEvidenceSignal,
  GmailPressureTrendData,
  GmailPressureTrendWindow,
  GmailScopeLadderCounts,
  GmailSenderOverviewWindowData,
  GmailSenderDistributionData,
  GmailSenderPolicy,
  GmailSenderWorkspaceFilter,
  GmailSenderWorkspaceSemanticFocus,
  GmailSenderWorkspaceSort,
  GmailSenderWorkspaceSortDirection,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'

type ClusterInput = {
  cluster_id: string
  canonical_cluster_id?: string | null
  legacy_cluster_ids?: string[] | null
  source_cluster_ids?: string[] | null
  cluster_type: string
  title: string
  query: string
  sender_count?: number | null
  message_count?: number | null
  estimated_count?: number | null
  why_selected?: string | null
  risk_note?: string | null
  safety_note?: string | null
  surface_tier?: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_tier'] | null
  surface_kind?: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_kind'] | null
  surface_visibility?: GmailMailboxIntelligenceData['cleanup_groups'][number]['surface_visibility'] | null
  top_level_rank?: number | null
}

type LoadedMailboxContext = {
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  scopedRows: GmailMailboxIndexRow[]
  scopedInboxRows: GmailMailboxIndexRow[]
  snapshot_key: string
}

type MailboxCoverageSnapshot = {
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  snapshot_key: string
}

type ClusterResolution = {
  candidateRows: GmailMailboxIndexRow[]
  matchedRowsByCluster: Map<string, GmailMailboxIndexRow[]>
}

type DerivedWorkspaceState = LoadedMailboxContext & ClusterResolution

type DerivedWorkspaceCacheEntry = {
  expires_at_ms: number
  data: DerivedWorkspaceState
}

type LoadedMailboxContextCacheEntry = {
  expires_at_ms: number
  data: LoadedMailboxContext
}

type SenderWorkspaceBaseState = {
  selectedClusterRows: GmailMailboxIndexRow[]
  allSenders: GmailSenderWorkspaceData['senders']
  cleanupCandidateMessageCount: number
}

type SenderWorkspaceBaseCacheEntry = {
  expires_at_ms: number
  data: SenderWorkspaceBaseState
}

type ConfirmationResolution = {
  preview: GmailConfirmationPreviewData
  archiveMessageIds: string[]
  archiveMessageIdsBySender: Record<string, string[]>
  publication: GmailArtifactPublicationRow
}

type GmailArtifactSuccess<T> = {
  ok: true
  data: T
  publication: GmailArtifactPublicationRow
}

type GmailSenderWorkspaceArtifactStatsRow = {
  sender: string
  message_count: number
  machine_probability: number | null
  human_probability: number | null
  first_seen?: string | null
  last_seen: string | null
  category_distribution: GmailSenderWorkspaceData['senders'][number]['category_distribution']
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailSenderWorkspaceData['senders'][number]['dominant_category']
  dominant_category_confidence: GmailSenderWorkspaceData['senders'][number]['dominant_category_confidence']
  category_profile_mode: GmailSenderWorkspaceData['senders'][number]['category_profile_mode']
  pattern_mix: GmailSenderWorkspaceData['senders'][number]['pattern_mix']
  dominant_pattern: string
  operator_profile_family: GmailSenderWorkspaceData['senders'][number]['operator_profile_family']
  operator_profile_mode: GmailSenderWorkspaceData['senders'][number]['operator_profile_mode']
  operator_profile_confidence: GmailSenderWorkspaceData['senders'][number]['operator_profile_confidence']
  operator_profile_summary: string
  operator_profile_reasons: string[]
  operator_profile_source: GmailSenderWorkspaceData['senders'][number]['operator_profile_source']
}

type PersistedCleanupDiscoverySnapshot = {
  cleanupDiscoveryData: GmailCleanupDiscoveryData
  generatedAt: string | null
  expiresAt: string | null
  analysisScope: GmailAnalysisScope
}

type SenderWorkspaceSnapshotCacheEntry = {
  expires_at_ms: number
  data: PersistedCleanupDiscoverySnapshot | null
}

type ParentSenderUniverse = {
  senderKeys: string[]
  totalSenders: number
  senders: GmailSenderWorkspaceData['senders'] | null
}

type ParentSenderUniverseCacheEntry = {
  expires_at_ms: number
  data: ParentSenderUniverse | null
}

const GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS = 1000 * 60 * 10
const GMAIL_SENDER_WORKSPACE_FAST_PATH_PAGE_SIZE = 5000
const GMAIL_SENDER_WORKSPACE_FAST_PATH_BREADTH_SLACK = 10_000
const GMAIL_SENDER_WORKSPACE_FAST_PATH_BREADTH_MULTIPLIER = 3
const GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX =
  '[integrations/gmail/sender-workspace-fast-path]'
const GMAIL_SENDER_WORKSPACE_ARTIFACT_LOG_PREFIX =
  '[integrations/gmail/sender-workspace-artifact]'
const GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX =
  '[integrations/gmail/sender-workspace-snapshot]'
const GMAIL_SENDER_UNIVERSE_GUARD_LOG_PREFIX =
  '[integrations/gmail/sender-universe-guard]'
const GMAIL_MAILBOX_INTELLIGENCE_ARTIFACT_LOG_PREFIX =
  '[integrations/gmail/mailbox-intelligence-artifact]'
const GMAIL_PRESSURE_TREND_ARTIFACT_LOG_PREFIX =
  '[integrations/gmail/pressure-trend-artifact]'
const GMAIL_CONFIRMATION_PREVIEW_ARTIFACT_LOG_PREFIX =
  '[integrations/gmail/confirmation-preview-artifact]'
const GMAIL_ARCHIVE_SCOPE_ARTIFACT_LOG_PREFIX =
  '[integrations/gmail/archive-scope-artifact]'
const GMAIL_SENDER_WORKSPACE_ARTIFACT_STATS_BATCH_SIZE = 50
const GMAIL_SENDER_WORKSPACE_ARTIFACT_ALLOWLIST = new Set([
  '085c8ef7-2fd7-4842-8499-cd605e894a77::all_indexed',
])
const GMAIL_SENDER_WORKSPACE_SNAPSHOT_EVENT_TYPE = 'runtime_cleanup_discovery_snapshot'
const GMAIL_SENDER_WORKSPACE_SNAPSHOT_VERSION = 'gmail.cleanup_profile_cache.v4'
const GMAIL_SENDER_WORKSPACE_SNAPSHOT_CACHE_TTL_MS = 1000 * 60
const GMAIL_SENDER_WORKSPACE_SNAPSHOT_RECENT_SCAN_LIMIT = 48
const GMAIL_SCOPED_MAILBOX_CONTEXT_QUERY_PAGE_SIZE = 1000
const GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_FAMILY_SET = new Set<
  GmailSenderWorkspaceData['senders'][number]['operator_profile_family']
>([
  'marketing_promotional',
  'commerce_transactional',
  'account_notification',
  'security_alert',
  'social_community',
  'human_personal',
  'mixed_behavior',
  'insufficient_data',
])
const GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_MODE_SET = new Set<
  GmailSenderWorkspaceData['senders'][number]['operator_profile_mode']
>(['clear', 'mixed', 'insufficient_data'])
const GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_SOURCE_SET = new Set<
  GmailSenderWorkspaceData['senders'][number]['operator_profile_source']
>(['sender_global_operator_profile_v1', 'insufficient_data'])
const GMAIL_SENDER_WORKSPACE_CATEGORY_SUMMARY_SOURCE_SET = new Set<
  GmailSenderWorkspaceData['senders'][number]['category_summary_source']
>([
  'sender_global_category_distribution',
  'uncategorized',
  'insufficient_data',
  'signal_category_mix',
  'selected_cluster_row_categories',
  'pattern_fallback',
])
const GMAIL_SENDER_WORKSPACE_DOMINANT_CATEGORY_CONFIDENCE_SET = new Set<
  NonNullable<GmailSenderWorkspaceData['senders'][number]['operator_profile_confidence']>
>(['high', 'medium', 'low'])

const gmailCleanupWorkspaceGlobal = globalThis as typeof globalThis & {
  __gmailLoadedMailboxContextCache?: Map<string, LoadedMailboxContextCacheEntry>
  __gmailLoadedMailboxContextInflight?: Map<string, Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>>>
  __gmailDerivedWorkspaceCache?: Map<string, DerivedWorkspaceCacheEntry>
  __gmailDerivedWorkspaceInflight?: Map<string, Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>>>
  __gmailSenderWorkspaceBaseCache?: Map<string, SenderWorkspaceBaseCacheEntry>
  __gmailSenderWorkspaceBaseInflight?: Map<string, Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>>>
  __gmailSenderWorkspaceSnapshotCache?: Map<string, SenderWorkspaceSnapshotCacheEntry>
  __gmailSenderWorkspaceSnapshotInflight?: Map<string, Promise<PersistedCleanupDiscoverySnapshot | null>>
  __gmailParentSenderUniverseCache?: Map<string, ParentSenderUniverseCacheEntry>
  __gmailParentSenderUniverseInflight?: Map<string, Promise<ParentSenderUniverse | null>>
}

const loadedMailboxContextCache =
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache ||
  new Map<string, LoadedMailboxContextCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache) {
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache = loadedMailboxContextCache
}

const loadedMailboxContextInflight =
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight ||
  new Map<string, Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight) {
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight = loadedMailboxContextInflight
}

const derivedWorkspaceCache =
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache || new Map<string, DerivedWorkspaceCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache) {
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache = derivedWorkspaceCache
}

const derivedWorkspaceInflight =
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight ||
  new Map<string, Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight) {
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight = derivedWorkspaceInflight
}

const senderWorkspaceBaseCache =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache ||
  new Map<string, SenderWorkspaceBaseCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache = senderWorkspaceBaseCache
}

const senderWorkspaceBaseInflight =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight ||
  new Map<string, Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight = senderWorkspaceBaseInflight
}

const senderWorkspaceSnapshotCache =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotCache ||
  new Map<string, SenderWorkspaceSnapshotCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotCache) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotCache = senderWorkspaceSnapshotCache
}

const senderWorkspaceSnapshotInflight =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotInflight ||
  new Map<string, Promise<PersistedCleanupDiscoverySnapshot | null>>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotInflight) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceSnapshotInflight = senderWorkspaceSnapshotInflight
}

const parentSenderUniverseCache =
  gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseCache ||
  new Map<string, ParentSenderUniverseCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseCache) {
  gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseCache = parentSenderUniverseCache
}

const parentSenderUniverseInflight =
  gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseInflight ||
  new Map<string, Promise<ParentSenderUniverse | null>>()
if (!gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseInflight) {
  gmailCleanupWorkspaceGlobal.__gmailParentSenderUniverseInflight = parentSenderUniverseInflight
}

type GmailWorkspaceFailureMetadata = {
  reason?: string | null
  retryAfterMs?: number | null
  freshnessState?: string | null
  buildStatus?: string | null
  publishedVersion?: string | null
  buildingVersion?: string | null
}

function fail(status: number, error: string, metadata?: GmailWorkspaceFailureMetadata) {
  return {
    ok: false as const,
    status,
    error,
    reason: metadata?.reason ?? null,
    retryAfterMs: metadata?.retryAfterMs ?? null,
    freshnessState: metadata?.freshnessState ?? null,
    buildStatus: metadata?.buildStatus ?? null,
    publishedVersion: metadata?.publishedVersion ?? null,
    buildingVersion: metadata?.buildingVersion ?? null,
  }
}

export type PublishedGmailArtifactAvailability = {
  state: 'transitional' | 'terminal_unavailable' | 'usable'
  reason: string
  servingPublishedFallback: boolean
  refreshRequiresAttention: boolean
}

export function resolvePublishedGmailArtifactAvailability(
  publication: GmailArtifactPublicationRow | null
): PublishedGmailArtifactAvailability {
  const publishedVersion = publication?.published_version?.trim() || ''
  const terminalRefreshState =
    publication?.build_status === 'failed' ||
    publication?.freshness_state === 'stale' ||
    publication?.freshness_state === 'refresh_failed' ||
    publication?.freshness_state === 'full_rebuild_required'
  const refreshInProgress =
    publication?.build_status === 'building' ||
    publication?.freshness_state === 'refresh_pending' ||
    publication?.freshness_state === 'refresh_in_progress'

  // A failed or in-progress candidate does not invalidate an independently
  // published version. Callers still validate that version's required rows.
  if (publishedVersion) {
    if (terminalRefreshState) {
      return {
        state: 'usable',
        reason: 'published_fallback_refresh_failed',
        servingPublishedFallback: true,
        refreshRequiresAttention: true,
      }
    }
    if (refreshInProgress) {
      return {
        state: 'usable',
        reason: 'published_fallback_refreshing',
        servingPublishedFallback: true,
        refreshRequiresAttention: false,
      }
    }
    return {
      state: 'usable',
      reason: publication?.freshness_state || 'published_artifact',
      servingPublishedFallback: false,
      refreshRequiresAttention: false,
    }
  }

  if (terminalRefreshState) {
    return {
      state: 'terminal_unavailable',
      reason: 'artifact_unavailable',
      servingPublishedFallback: false,
      refreshRequiresAttention: true,
    }
  }
  if (refreshInProgress) {
    return {
      state: 'transitional',
      reason: 'artifact_building',
      servingPublishedFallback: false,
      refreshRequiresAttention: false,
    }
  }
  return {
    state: 'transitional',
    reason: 'missing_published_artifact',
    servingPublishedFallback: false,
    refreshRequiresAttention: false,
  }
}

function publishedArtifactAvailabilityFailure(
  publication: GmailArtifactPublicationRow | null
): ReturnType<typeof fail> | null {
  const metadata = {
    freshnessState: publication?.freshness_state ?? null,
    buildStatus: publication?.build_status ?? null,
    publishedVersion: publication?.published_version ?? null,
    buildingVersion: publication?.building_version ?? null,
  }
  const availability = resolvePublishedGmailArtifactAvailability(publication)
  if (availability.state === 'usable') return null
  if (availability.state === 'terminal_unavailable') {
    return fail(503, 'Published Gmail runtime artifacts are unavailable.', {
      ...metadata,
      reason: availability.reason,
      retryAfterMs: null,
    })
  }
  if (availability.reason === 'artifact_building') {
    return fail(409, 'Published Gmail runtime artifacts are not ready.', {
      ...metadata,
      reason: availability.reason,
      retryAfterMs: 15_000,
    })
  }
  return fail(409, 'Published Gmail runtime artifacts are still being prepared.', {
    ...metadata,
    reason: availability.reason,
    retryAfterMs: 15_000,
  })
}

function firstPaintArtifactBudgetFailure(rowCount: number): ReturnType<typeof fail> | null {
  if (rowCount < MAX_GMAIL_OPERATIONS_FIRST_PAINT_ARTIFACT_ROWS) return null
  return fail(409, 'Published Gmail runtime artifacts exceed the accepted first-paint row budget.', {
    reason: 'artifact_row_budget_exceeded',
  })
}

async function loadPublishedArtifactAvailabilityFailure(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
}): Promise<ReturnType<typeof fail> | null> {
  try {
    const publications = await loadGmailArtifactPublicationStatesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    const publication =
      publications.find(
        (entry) => entry.analysis_scope === normalizeMailboxProfileScope(params.analysisScope)
      ) ?? null
    return publishedArtifactAvailabilityFailure(publication)
  } catch {
    return fail(503, 'Published Gmail runtime artifact status is unavailable.', {
      reason: 'artifact_status_unavailable',
      retryAfterMs: 15_000,
    })
  }
}

async function loadTimeContextProjectionUnavailable(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
}): Promise<ReturnType<typeof fail>> {
  try {
    const publications = await loadGmailArtifactPublicationStatesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    })
    const publication =
      publications.find(
        (entry) => entry.analysis_scope === normalizeMailboxProfileScope(params.analysisScope)
      ) ?? null
    return fail(409, 'This Time Context query requires a bounded published projection.', {
      reason: 'time_context_projection_unavailable',
      retryAfterMs: null,
      freshnessState: publication?.freshness_state ?? null,
      buildStatus: publication?.build_status ?? null,
      publishedVersion: publication?.published_version ?? null,
      buildingVersion: publication?.building_version ?? null,
    })
  } catch {
    return fail(503, 'Published Gmail runtime artifact status is unavailable.', {
      reason: 'artifact_status_unavailable',
      retryAfterMs: 15_000,
    })
  }
}

function normalizeClusters(clusters: ClusterInput[]): ClusterInput[] {
  return clusters
    .map((cluster) => {
      const clusterId = typeof cluster.cluster_id === 'string' ? cluster.cluster_id.trim() : ''
      const canonicalClusterId =
        typeof cluster.canonical_cluster_id === 'string' && cluster.canonical_cluster_id.trim()
          ? cluster.canonical_cluster_id.trim()
          : null
      const publishIdentity = buildCleanupGroupFutureCanonicalPublishIdentity(
        canonicalClusterId || clusterId
      )

      return {
        cluster_id: clusterId,
        canonical_cluster_id: canonicalClusterId || publishIdentity?.canonicalClusterId || null,
        legacy_cluster_ids: uniqueClusterInputIds([
          ...(Array.isArray(cluster.legacy_cluster_ids)
            ? cluster.legacy_cluster_ids
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                .map((entry) => entry.trim())
            : []),
          ...(publishIdentity?.legacyClusterIds || []),
        ]),
        source_cluster_ids: uniqueClusterInputIds([
          ...(Array.isArray(cluster.source_cluster_ids)
            ? cluster.source_cluster_ids
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                .map((entry) => entry.trim())
            : []),
          ...(publishIdentity?.sourceClusterIds || []),
        ]),
        cluster_type: typeof cluster.cluster_type === 'string' ? cluster.cluster_type.trim() : '',
        title: typeof cluster.title === 'string' ? cluster.title.trim() : '',
        query: typeof cluster.query === 'string' ? cluster.query.trim() : '',
        estimated_count:
          typeof cluster.estimated_count === 'number' && Number.isFinite(cluster.estimated_count)
            ? Math.max(0, Math.round(cluster.estimated_count))
            : null,
        sender_count:
          typeof cluster.sender_count === 'number' && Number.isFinite(cluster.sender_count)
            ? Math.max(0, Math.round(cluster.sender_count))
            : null,
        message_count:
          typeof cluster.message_count === 'number' && Number.isFinite(cluster.message_count)
            ? Math.max(0, Math.round(cluster.message_count))
            : null,
        why_selected:
          typeof cluster.why_selected === 'string' && cluster.why_selected.trim()
            ? cluster.why_selected.trim()
            : null,
        risk_note:
          typeof cluster.risk_note === 'string' && cluster.risk_note.trim()
            ? cluster.risk_note.trim()
            : null,
        safety_note:
          typeof cluster.safety_note === 'string' && cluster.safety_note.trim()
            ? cluster.safety_note.trim()
            : null,
        surface_tier:
          typeof cluster.surface_tier === 'string' ? cluster.surface_tier : null,
        surface_kind:
          typeof cluster.surface_kind === 'string' ? cluster.surface_kind : null,
        surface_visibility:
          typeof cluster.surface_visibility === 'string' ? cluster.surface_visibility : null,
        top_level_rank:
          typeof cluster.top_level_rank === 'number' && Number.isFinite(cluster.top_level_rank)
            ? cluster.top_level_rank
            : null,
      }
    })
    .filter((cluster) => cluster.cluster_id && cluster.cluster_type && cluster.title && cluster.query)
    .sort((left, right) => left.cluster_id.localeCompare(right.cluster_id))
    .slice(0, 25)
}

function uniqueClusterInputIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  )
}

function canonicalRuntimeClusterIdFromIdentity(
  identity: ReturnType<typeof resolveCleanupClusterIdentity>,
  fallbackClusterId: string
): string {
  return (
    identity.canonicalDescriptor?.canonicalClusterId ||
    identity.canonicalClusterId ||
    fallbackClusterId
  )
}

function clusterLookupIds(cluster: ClusterInput): string[] {
  return uniqueClusterInputIds([
    cluster.cluster_id,
    cluster.canonical_cluster_id,
    ...(cluster.legacy_cluster_ids || []),
    ...(cluster.source_cluster_ids || []),
  ])
}

function artifactClusterLookupId(cluster: ClusterInput): string {
  const aliasIds = uniqueClusterInputIds([
    ...(cluster.legacy_cluster_ids || []),
    ...(cluster.source_cluster_ids || []),
  ])
  return aliasIds[0] || cluster.cluster_id || cluster.canonical_cluster_id || ''
}

function findClusterByLookupIds(clusters: ClusterInput[], lookupIds: string[]): ClusterInput | null {
  const lookupIdSet = new Set(uniqueClusterInputIds(lookupIds))
  if (lookupIdSet.size === 0) return null

  for (const cluster of clusters) {
    if (clusterLookupIds(cluster).some((clusterId) => lookupIdSet.has(clusterId))) {
      return cluster
    }
  }

  return null
}

function mergeCanonicalClusterInput(base: ClusterInput, incoming: ClusterInput): ClusterInput {
  return {
    ...base,
    ...incoming,
    cluster_id: incoming.cluster_id || base.cluster_id,
    canonical_cluster_id:
      incoming.canonical_cluster_id || base.canonical_cluster_id || incoming.cluster_id || base.cluster_id,
    legacy_cluster_ids: uniqueClusterInputIds([
      ...(base.legacy_cluster_ids || []),
      ...(incoming.legacy_cluster_ids || []),
    ]),
    source_cluster_ids: uniqueClusterInputIds([
      ...(base.source_cluster_ids || []),
      ...(incoming.source_cluster_ids || []),
    ]),
    sender_count:
      typeof incoming.sender_count === 'number' ? incoming.sender_count : base.sender_count ?? null,
    message_count:
      typeof incoming.message_count === 'number' ? incoming.message_count : base.message_count ?? null,
    estimated_count:
      typeof incoming.estimated_count === 'number'
        ? incoming.estimated_count
        : base.estimated_count ?? null,
    why_selected: incoming.why_selected || base.why_selected || null,
    risk_note: incoming.risk_note || base.risk_note || null,
    safety_note: incoming.safety_note || base.safety_note || null,
    surface_tier: incoming.surface_tier || base.surface_tier || null,
    surface_kind: incoming.surface_kind || base.surface_kind || null,
    surface_visibility: incoming.surface_visibility || base.surface_visibility || null,
    top_level_rank:
      typeof incoming.top_level_rank === 'number' ? incoming.top_level_rank : base.top_level_rank ?? null,
  }
}

function cleanupClusterIdentitySources(clusters: ClusterInput[]): CleanupClusterIdentitySource[] {
  return clusters.map((cluster) => ({
    clusterId: cluster.cluster_id,
    canonicalClusterId: cluster.canonical_cluster_id || cluster.cluster_id,
    legacyClusterIds: cluster.legacy_cluster_ids || [],
    sourceClusterIds: cluster.source_cluster_ids || [],
  }))
}

function canonicalizeSelectedCluster(params: {
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
}): ClusterInput {
  const sources = cleanupClusterIdentitySources([
    ...params.clusters,
    params.selectedCluster,
  ])
  const identity = resolveCleanupClusterIdentity(params.selectedCluster.cluster_id, sources)
  const canonicalClusterId = canonicalRuntimeClusterIdFromIdentity(
    identity,
    params.selectedCluster.canonical_cluster_id || params.selectedCluster.cluster_id
  )
  const matchedCluster =
    findClusterByLookupIds(
      params.clusters,
      uniqueClusterInputIds([
        identity.canonicalClusterId,
        identity.matchedClusterId,
        ...identity.legacyClusterIds,
        ...identity.sourceClusterIds,
        params.selectedCluster.cluster_id,
        params.selectedCluster.canonical_cluster_id,
      ])
    ) || params.selectedCluster
  const descriptorAliasIds =
    identity.canonicalDescriptor?.aliases.map((alias) => alias.clusterId) || []

  return {
    ...matchedCluster,
    cluster_id: canonicalClusterId,
    canonical_cluster_id: canonicalClusterId,
    legacy_cluster_ids: uniqueClusterInputIds([
      ...(matchedCluster.legacy_cluster_ids || []),
      ...identity.legacyClusterIds,
      ...descriptorAliasIds,
    ]).filter((clusterId) => clusterId !== canonicalClusterId),
    source_cluster_ids: uniqueClusterInputIds([
      ...(matchedCluster.source_cluster_ids || []),
      matchedCluster.cluster_id !== canonicalClusterId ? matchedCluster.cluster_id : '',
      matchedCluster.canonical_cluster_id !== canonicalClusterId
        ? matchedCluster.canonical_cluster_id
        : '',
      ...identity.sourceClusterIds,
    ]).filter((clusterId) => clusterId !== canonicalClusterId),
  }
}

function canonicalizeClusterCollection(clusters: ClusterInput[]): ClusterInput[] {
  const normalizedClusters = normalizeClusters(clusters)
  const merged = new Map<string, ClusterInput>()

  for (const cluster of normalizedClusters) {
    const canonicalCluster = canonicalizeSelectedCluster({
      clusters: normalizedClusters,
      selectedCluster: cluster,
    })
    const existing = merged.get(canonicalCluster.cluster_id)
    merged.set(
      canonicalCluster.cluster_id,
      existing ? mergeCanonicalClusterInput(existing, canonicalCluster) : canonicalCluster
    )
  }

  return Array.from(merged.values())
    .sort((left, right) => left.cluster_id.localeCompare(right.cluster_id))
    .slice(0, 25)
}

function clusterMatchesIdentity(cluster: ClusterInput, clusterId: string | null | undefined): boolean {
  const requestedClusterId = typeof clusterId === 'string' ? clusterId.trim() : ''
  if (!requestedClusterId) return false
  return clusterLookupIds(cluster).includes(requestedClusterId)
}

function ensureSelectedClusterIncluded(
  clusters: ClusterInput[],
  selectedCluster: ClusterInput
): ClusterInput[] {
  return clusters.some((cluster) => cluster.cluster_id === selectedCluster.cluster_id)
    ? clusters
    : [selectedCluster, ...clusters].slice(0, 25)
}

function derivedWorkspaceCacheKey(params: {
  mailboxSnapshotKey: string
  clusters: ClusterInput[]
  timeZone?: string | null
}): string {
  const clusterSignature = params.clusters
    .map((cluster) => [cluster.cluster_id, cluster.cluster_type, cluster.title, cluster.query].join('::'))
    .sort()
  return [params.mailboxSnapshotKey, safePressureTrendTimeZone(params.timeZone), ...clusterSignature].join('|||')
}

function mailboxSnapshotKey(params: {
  tenantId: string
  analysisScope: GmailAnalysisScope
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
}): string {
  return [
    params.tenantId.trim(),
    params.analysisScope,
    String(params.coverage.indexed_total_rows),
    String(params.coverage.indexed_inbox_rows),
    params.coverage.indexed_date_span_start || 'no-start',
    params.coverage.indexed_date_span_end || 'no-end',
  ].join('|||')
}

function senderWorkspaceBaseCacheKey(params: {
  mailboxSnapshotKey: string
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  cacheVersion?: string | null
  timeZone?: string | null
}): string {
  return [
    derivedWorkspaceCacheKey(params),
    params.cacheVersion?.trim() || 'default',
    [params.selectedCluster.cluster_id, params.selectedCluster.cluster_type, params.selectedCluster.title].join('::'),
  ].join('|||')
}

function expectedClusterMessageCount(cluster: ClusterInput | null | undefined): number | null {
  if (typeof cluster?.message_count === 'number' && Number.isFinite(cluster.message_count)) {
    return Math.max(0, Math.round(cluster.message_count))
  }
  return typeof cluster?.estimated_count === 'number' && Number.isFinite(cluster.estimated_count)
    ? Math.max(0, Math.round(cluster.estimated_count))
    : null
}

function expectedCleanupCandidateMessageCount(clusters: ClusterInput[]): number | null {
  const counts = clusters
    .map((cluster) => expectedClusterMessageCount(cluster))
    .filter((value): value is number => value != null)
  if (counts.length !== clusters.length || counts.length === 0) return null
  return counts.reduce((sum, count) => sum + count, 0)
}

function senderTokenFromClusterTitle(title: string): string | null {
  const token = title.replace(/^Sender cluster:\s*/i, '').trim().toLowerCase()
  if (!token) return null
  return token.replace(/[%_]/g, '')
}

type SenderWorkspaceFastPathQuery = {
  eq(column: string, value: unknown): SenderWorkspaceFastPathQuery
  not(column: string, operator: string, value: string): SenderWorkspaceFastPathQuery
  gte(column: string, value: number): SenderWorkspaceFastPathQuery
  lte(column: string, value: number): SenderWorkspaceFastPathQuery
  ilike(column: string, pattern: string): SenderWorkspaceFastPathQuery
  or(filters: string): SenderWorkspaceFastPathQuery
}

type SenderWorkspaceFastPathRowsQuery = SenderWorkspaceFastPathQuery & {
  order(
    column: string,
    options: { ascending: boolean }
  ): SenderWorkspaceFastPathRowsQuery
  range(from: number, to: number): Promise<{
    data: unknown
    error: unknown
  }>
}

function applyScopeWindowToQuery(
  query: SenderWorkspaceFastPathQuery,
  analysisScope: GmailAnalysisScope,
  nowMs: number,
  timeZone?: string | null
): SenderWorkspaceFastPathQuery {
  const selectedScopeDays = scopeDays(analysisScope)
  if (selectedScopeDays == null) return query
  const scopeCutoffMs = analysisScopeRowInclusionLowerBoundMs(analysisScope, nowMs, timeZone)
  if (scopeCutoffMs == null) return query
  return query.gte('internal_date_ms', scopeCutoffMs)
}

function applySenderWorkspaceFastPathCandidateFilter(params: {
  query: SenderWorkspaceFastPathQuery
  clusterIds: string[]
  clusterType: string
  title: string
  nowMs: number
}): { query: SenderWorkspaceFastPathQuery; fastPathApplied: string } | null {
  const safeBase = (query: SenderWorkspaceFastPathQuery): SenderWorkspaceFastPathQuery =>
    query
      .eq('is_starred', false)
      .eq('is_important', false)
      .not('category_labels', 'cs', '{"CATEGORY_PRIMARY"}')

  if (params.clusterIds.includes('dormant-backlog-senders')) {
    return {
      query: safeBase(params.query).or(
        [
          `internal_date_ms.lte.${params.nowMs - 45 * 24 * 60 * 60 * 1000}`,
          `and(is_unread.eq.true,internal_date_ms.lte.${params.nowMs - 21 * 24 * 60 * 60 * 1000})`,
        ].join(',')
      ),
      fastPathApplied: 'dormant_backlog',
    }
  }

  if (params.clusterType === 'old_read_mail') {
    const olderThan120d = params.nowMs - 120 * 24 * 60 * 60 * 1000
    return {
      query: safeBase(params.query).eq('is_unread', false).lte('internal_date_ms', olderThan120d),
      fastPathApplied: 'old_read_mail',
    }
  }

  if (params.clusterType === 'age_cluster') {
    const olderThan365d = params.nowMs - 365 * 24 * 60 * 60 * 1000
    return {
      query: safeBase(params.query).lte('internal_date_ms', olderThan365d),
      fastPathApplied: 'age_cluster',
    }
  }

  if (params.clusterType === 'sender_cluster') {
    const senderToken = senderTokenFromClusterTitle(params.title)
    if (!senderToken) return null
    return {
      query: safeBase(params.query).ilike('sender', `%${senderToken}%`),
      fastPathApplied: 'sender_cluster',
    }
  }

  if (params.clusterType === 'newsletters') {
    return {
      query: safeBase(params.query)
        .not('category_labels', 'cs', '{"CATEGORY_SOCIAL"}')
        .not('subject', 'ilike', '%receipt%')
        .not('subject', 'ilike', '%invoice%')
        .not('subject', 'ilike', '%order%')
        .not('subject', 'ilike', '%shipped%')
        .not('subject', 'ilike', '%delivery%')
        .not('subject', 'ilike', '%tracking%')
        .or(
          [
            'category_labels.cs.{"CATEGORY_PROMOTIONS"}',
            'subject.ilike.%newsletter%',
            'subject.ilike.%digest%',
            'subject.ilike.%roundup%',
            'subject.ilike.%subscription%',
            'subject.ilike.%unsubscribe%',
            'subject.ilike.%update%',
            'subject.ilike.%preferences%',
            'sender.ilike.%substack%',
            'sender.ilike.%patreon%',
          ].join(',')
        ),
      fastPathApplied: 'newsletters',
    }
  }

  if (params.clusterType === 'noreply_automation') {
    return {
      query: safeBase(params.query).or(
        [
          'sender.ilike.%no-reply%',
          'sender.ilike.%noreply%',
          'sender.ilike.%donotreply%',
          'sender.ilike.%do-not-reply%',
          'sender.ilike.%mailer-daemon%',
          'subject.ilike.%notification%',
          'subject.ilike.%automated%',
          'subject.ilike.%alert%',
          'subject.ilike.%security%',
          'subject.ilike.%verification%',
          'subject.ilike.%otp%',
          'subject.ilike.%code%',
          'subject.ilike.%digest%',
        ].join(',')
      ),
      fastPathApplied: 'noreply_automation',
    }
  }

  if (params.clusterType === 'shopping_updates') {
    return {
      query: safeBase(params.query).or(
        [
          'subject.ilike.%order%',
          'subject.ilike.%shipped%',
          'subject.ilike.%delivery%',
          'subject.ilike.%tracking%',
          'subject.ilike.%receipt%',
          'subject.ilike.%invoice%',
          'subject.ilike.%refund%',
          'subject.ilike.%return%',
          'subject.ilike.%booking%',
          'subject.ilike.%itinerary%',
          'subject.ilike.%reservation%',
          'subject.ilike.%flight%',
          'subject.ilike.%hotel%',
          'subject.ilike.%trip%',
          'subject.ilike.%travel%',
          'sender.ilike.%amazon%',
          'sender.ilike.%walmart%',
          'sender.ilike.%target%',
          'sender.ilike.%shopify%',
          'sender.ilike.%etsy%',
          'sender.ilike.%sephora%',
          'sender.ilike.%booking%',
          'sender.ilike.%expedia%',
          'sender.ilike.%airbnb%',
          'sender.ilike.%delta%',
          'sender.ilike.%united%',
          'sender.ilike.%marriott%',
          'sender.ilike.%hilton%',
        ].join(',')
      ),
      fastPathApplied: 'shopping_updates',
    }
  }

  if (params.clusterType === 'social_notifications') {
    return {
      query: safeBase(params.query).or(
        [
          'category_labels.cs.{"CATEGORY_SOCIAL"}',
          'subject.ilike.%mentioned%',
          'subject.ilike.%follower%',
          'subject.ilike.%comment%',
          'subject.ilike.%liked%',
          'subject.ilike.%reacted%',
          'subject.ilike.%invite%',
          'subject.ilike.%connection request%',
          'subject.ilike.%new message%',
          'sender.ilike.%linkedin%',
          'sender.ilike.%facebook%',
          'sender.ilike.%instagram%',
          'sender.ilike.%twitter%',
          'sender.ilike.%x.com%',
          'sender.ilike.%reddit%',
          'sender.ilike.%discord%',
          'sender.ilike.%slack%',
          'sender.ilike.%tiktok%',
        ].join(',')
      ),
      fastPathApplied: 'social_notifications',
    }
  }

  if (params.clusterType === 'unread_clutter') {
    return {
      query: safeBase(params.query)
        .eq('is_unread', true)
        .lte('internal_date_ms', params.nowMs - 21 * 24 * 60 * 60 * 1000),
      fastPathApplied: 'unread_clutter',
    }
  }

  return null
}

function isRowWithinAnalysisScope(
  row: GmailMailboxIndexRow,
  analysisScope: GmailAnalysisScope,
  nowMs: number,
  timeZone?: string | null
): boolean {
  if (!Number.isFinite(row.internal_date_ms || Number.NaN)) return false
  const threshold = analysisScopeRowInclusionLowerBoundMs(analysisScope, nowMs, timeZone)
  if (threshold == null) return true
  return (row.internal_date_ms || 0) >= threshold
}

async function loadScopedMailboxContextRows(params: {
  supabase: SupabaseClient
  tenantId: string
  limit: number
  internalDateMsGte: number
}): Promise<GmailMailboxIndexRow[]> {
  const tenantId = params.tenantId.trim()
  const limit = Math.max(1, Math.floor(params.limit))
  const pageSize = Math.min(GMAIL_SCOPED_MAILBOX_CONTEXT_QUERY_PAGE_SIZE, limit)
  const rows: GmailMailboxIndexRow[] = []

  for (let rangeStart = 0; rangeStart < limit; rangeStart += pageSize) {
    const rangeEnd = Math.min(rangeStart + pageSize - 1, limit - 1)
    const { data, error } = await params.supabase
      .from('gmail_messages')
      .select(
        'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
      )
      .eq('tenant_id', tenantId)
      .gte('internal_date_ms', params.internalDateMsGte)
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(rangeStart, rangeEnd)

    if (error) {
      console.warn(
        '[integrations/gmail/cleanup-workspace] scoped mailbox context row load failed:',
        error.message
      )
      break
    }

    const pageRows = Array.isArray(data) ? (data as GmailMailboxIndexRow[]) : []
    rows.push(...pageRows)
    if (pageRows.length < pageSize) break
  }

  return rows.slice(0, limit)
}

async function loadMailboxCoverageSnapshot(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
}): Promise<MailboxCoverageSnapshot> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const coverage = await loadGmailMailboxIndexCoverageForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  return {
    coverage,
    snapshot_key: mailboxSnapshotKey({
      tenantId: params.tenantId,
      analysisScope,
      coverage,
    }),
  }
}

async function loadMailboxContext(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  coverageSnapshot?: MailboxCoverageSnapshot
  timeZone?: string | null
}): Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const coverageSnapshot =
    params.coverageSnapshot ||
    (await loadMailboxCoverageSnapshot({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    }))
  const resolvedTimeZone = safePressureTrendTimeZone(params.timeZone)
  const cacheKey = `${coverageSnapshot.snapshot_key}|||${resolvedTimeZone}`
  const cached = loadedMailboxContextCache.get(cacheKey)
  if (cached && cached.expires_at_ms > Date.now()) {
    return { ok: true, data: cached.data }
  }

  const inflight = loadedMailboxContextInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>> => {
    const nowMs = Date.now()
    const selectedScopeDays = scopeDays(analysisScope)
    const scopeBoundInternalDateMs =
      selectedScopeDays != null
        ? analysisScopeRowInclusionLowerBoundMs(analysisScope, nowMs, resolvedTimeZone)
        : null
    const indexedRows =
      scopeBoundInternalDateMs != null
        ? await loadScopedMailboxContextRows({
            supabase: params.supabase,
            tenantId: params.tenantId,
            limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            internalDateMsGte: scopeBoundInternalDateMs,
          })
        : await loadIndexedGmailMessagesForTenant({
            supabase: params.supabase,
            tenantId: params.tenantId,
            limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
          })
    const scopedRows =
      selectedScopeDays != null
        ? indexedRows.filter((row) =>
            isRowWithinAnalysisScope(row, analysisScope, nowMs, resolvedTimeZone)
          )
        : indexedRows
    const scopedInboxRows = scopedRows.filter((row) => row.is_in_inbox)
    const data: LoadedMailboxContext = {
      coverage: coverageSnapshot.coverage,
      scopedRows,
      scopedInboxRows,
      snapshot_key: cacheKey,
    }
    loadedMailboxContextCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data,
    })
    return { ok: true, data }
  })()

  loadedMailboxContextInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    loadedMailboxContextInflight.delete(cacheKey)
  }
}

function resolveClusterRows(params: {
  scopedInboxRows: GmailMailboxIndexRow[]
  clusters: ClusterInput[]
}): ClusterResolution {
  const nowMs = Date.now()
  const sources = cleanupClusterIdentitySources(params.clusters)
  const matchedRowsByCluster = new Map<string, GmailMailboxIndexRow[]>()
  const matchedCandidateIds = new Map<string, GmailMailboxIndexRow>()
  const clusterIdSet = new Set(
    params.clusters.map((cluster) =>
      canonicalRuntimeClusterIdFromIdentity(
        resolveCleanupClusterIdentity(cluster.cluster_id, sources),
        cluster.canonical_cluster_id || cluster.cluster_id
      )
    )
  )
  for (const cluster of params.clusters) {
    const canonicalClusterId = canonicalRuntimeClusterIdFromIdentity(
      resolveCleanupClusterIdentity(cluster.cluster_id, sources),
      cluster.canonical_cluster_id || cluster.cluster_id
    )
    matchedRowsByCluster.set(canonicalClusterId, matchedRowsByCluster.get(canonicalClusterId) || [])
  }

  const senderBuckets = new Map<string, { sender: string; rows: GmailMailboxIndexRow[] }>()
  for (const row of params.scopedInboxRows) {
    const sender = row.sender || ''
    const senderKey = normalizeSender(sender)
    if (!senderKey) continue
    const current = senderBuckets.get(senderKey) || { sender, rows: [] }
    current.rows.push(row)
    senderBuckets.set(senderKey, current)
  }

  for (const entry of senderBuckets.values()) {
    const cleanupDecision = assignSenderCleanupGroupDecision({
      sender: entry.sender,
      rows: entry.rows,
      nowMs,
    })
    const clusterSpec = cleanupDecision.groupSpec
    if (!clusterSpec) continue
    const resolvedClusterIdentity = resolveCleanupClusterIdentity(clusterSpec.cluster_id, sources)
    const resolvedClusterId = canonicalRuntimeClusterIdFromIdentity(
      resolvedClusterIdentity,
      clusterSpec.cluster_id
    )
    if (!clusterIdSet.has(resolvedClusterId)) continue
    const clusterRows = matchedRowsByCluster.get(resolvedClusterId)
    if (!clusterRows) continue
    const orderedRows = entry.rows
      .slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    clusterRows.push(...orderedRows)
    for (const row of orderedRows) matchedCandidateIds.set(row.message_id, row)
  }

  return {
    candidateRows: Array.from(matchedCandidateIds.values()).sort(
      (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
    ),
    matchedRowsByCluster,
  }
}

function groupRowsBySender(rows: GmailMailboxIndexRow[]): Map<
  string,
  { sender: string; rows: GmailMailboxIndexRow[] }
> {
  const senderBuckets = new Map<string, { sender: string; rows: GmailMailboxIndexRow[] }>()
  for (const row of rows) {
    const sender = row.sender || ''
    const senderKey = normalizeSender(sender)
    if (!senderKey) continue
    const current = senderBuckets.get(senderKey) || { sender, rows: [] }
    current.rows.push(row)
    senderBuckets.set(senderKey, current)
  }
  return senderBuckets
}

async function loadDerivedWorkspaceState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
  timeZone?: string | null
}): Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const clusters = canonicalizeClusterCollection(params.clusters)
  const coverageSnapshot = await loadMailboxCoverageSnapshot({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  const cacheKey = derivedWorkspaceCacheKey({
    mailboxSnapshotKey: coverageSnapshot.snapshot_key,
    clusters,
    timeZone: params.timeZone,
  })
  const nowMs = Date.now()
  const cached = derivedWorkspaceCache.get(cacheKey)
  if (cached && cached.expires_at_ms > nowMs) {
    return { ok: true, data: cached.data }
  }

  const inflight = derivedWorkspaceInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>> => {
    const mailbox = await loadMailboxContext({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      coverageSnapshot,
      timeZone: params.timeZone,
    })
    if (!mailbox.ok) return mailbox

    const clusterResolution = resolveClusterRows({
      scopedInboxRows: mailbox.data.scopedInboxRows,
      clusters,
    })
    const data: DerivedWorkspaceState = {
      ...mailbox.data,
      ...clusterResolution,
    }
    derivedWorkspaceCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data,
    })
    return { ok: true, data }
  })()

  derivedWorkspaceInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    derivedWorkspaceInflight.delete(cacheKey)
  }
}

async function loadSenderWorkspaceFastPathCandidateRows(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  expectedClusterMessageCount: number
  timeZone?: string | null
}): Promise<
  | {
      rows: GmailMailboxIndexRow[]
      fastPathApplied: string
      candidateRowCount: number
      rawCandidateRowCount: number
      loadedCandidateRowCount: number
    }
  | null
> {
  const nowMs = Date.now()
  const backendSafePageSize = Math.min(GMAIL_SENDER_WORKSPACE_FAST_PATH_PAGE_SIZE, 1000)
  const baseSelect =
    'tenant_id,message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important,indexed_at,updated_at'
  const buildFilteredCountQuery = () =>
    applySenderWorkspaceFastPathCandidateFilter({
      query: applyScopeWindowToQuery(
        params.supabase
          .from('gmail_messages')
          .select('message_id', { count: 'exact', head: true })
          .eq('tenant_id', params.tenantId)
          .eq('is_in_inbox', true) as unknown as SenderWorkspaceFastPathQuery,
        params.analysisScope,
        nowMs,
        params.timeZone
      ),
      clusterIds: clusterLookupIds(params.selectedCluster),
      clusterType: params.selectedCluster.cluster_type,
      title: params.selectedCluster.title,
      nowMs,
    })
  const buildFilteredRowsQuery = () =>
    applySenderWorkspaceFastPathCandidateFilter({
      query: applyScopeWindowToQuery(
        params.supabase
          .from('gmail_messages')
          .select(baseSelect)
          .eq('tenant_id', params.tenantId)
          .eq('is_in_inbox', true) as unknown as SenderWorkspaceFastPathRowsQuery,
        params.analysisScope,
        nowMs,
        params.timeZone
      ),
      clusterIds: clusterLookupIds(params.selectedCluster),
      clusterType: params.selectedCluster.cluster_type,
      title: params.selectedCluster.title,
      nowMs,
    })

  const filteredCount = buildFilteredCountQuery()
  const filteredRows = buildFilteredRowsQuery()
  if (!filteredCount || !filteredRows) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        status: 'rejected_unsupported_cluster_filter',
      })}`
    )
    return null
  }

  const countResult = await (filteredCount.query as unknown as Promise<{
    count: number | null
    error: unknown
  }>)
  if (countResult.error) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        fast_path_applied: filteredRows.fastPathApplied,
        status: 'rejected_count_query_error',
      })}`
    )
    return null
  }

  const candidateRowCount =
    typeof countResult.count === 'number' && Number.isFinite(countResult.count)
      ? Math.max(0, countResult.count)
      : 0
  const breadthLimit = Math.max(
    params.expectedClusterMessageCount * GMAIL_SENDER_WORKSPACE_FAST_PATH_BREADTH_MULTIPLIER,
    params.expectedClusterMessageCount + GMAIL_SENDER_WORKSPACE_FAST_PATH_BREADTH_SLACK
  )
  if (candidateRowCount === 0) {
    return {
      rows: [],
      fastPathApplied: filteredRows.fastPathApplied,
      candidateRowCount: 0,
      rawCandidateRowCount: 0,
      loadedCandidateRowCount: 0,
    }
  }
  if (candidateRowCount > breadthLimit || candidateRowCount > GMAIL_MAILBOX_INDEX_MAX_MESSAGES) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        fast_path_applied: filteredRows.fastPathApplied,
        candidate_row_count: candidateRowCount,
        expected_cluster_row_count: params.expectedClusterMessageCount,
        status: 'rejected_candidate_breadth',
      })}`
    )
    return null
  }

  const rows: GmailMailboxIndexRow[] = []
  for (let offset = 0; offset < candidateRowCount; offset += backendSafePageSize) {
    const rangeEnd = Math.min(offset + backendSafePageSize - 1, candidateRowCount - 1)
    const nextRowsQuery = buildFilteredRowsQuery()
    if (!nextRowsQuery) return null
    const pageResult = await (nextRowsQuery.query as SenderWorkspaceFastPathRowsQuery)
      .order('internal_date_ms', { ascending: false })
      .order('message_id', { ascending: false })
      .range(offset, rangeEnd)
    if (pageResult.error) {
      console.info(
        `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
          cluster_id: params.selectedCluster.cluster_id,
          analysis_scope: params.analysisScope,
          fast_path_applied: filteredRows.fastPathApplied,
          status: 'rejected_rows_query_error',
        })}`
      )
      return null
    }
    const pageRows = Array.isArray(pageResult.data)
      ? (pageResult.data as GmailMailboxIndexRow[])
      : []
    rows.push(...pageRows)
    if (pageRows.length < rangeEnd - offset + 1) break
  }

  let exactRows = rows
  if (params.selectedCluster.cluster_type === 'newsletters') {
    const candidateSenderBuckets = groupRowsBySender(rows)
    const candidateSenderKeys = new Set(
      Array.from(candidateSenderBuckets.keys()).filter(Boolean)
    )
    const mailbox = await loadMailboxContext({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      timeZone: params.timeZone,
    })
    if (!mailbox.ok) {
      console.info(
        `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
          cluster_id: params.selectedCluster.cluster_id,
          analysis_scope: params.analysisScope,
          fast_path_applied: filteredRows.fastPathApplied,
          status: 'rejected_scoped_mailbox_context_error',
        })}`
      )
      return null
    }
    const exactSenderBuckets = groupRowsBySender(
      mailbox.data.scopedInboxRows.filter((row) =>
        candidateSenderKeys.has(normalizeSender(row.sender || ''))
      )
    )
    exactRows = Array.from(exactSenderBuckets.values())
      .filter((entry) => {
        const cleanupDecision = assignSenderCleanupGroupDecision({
          sender: entry.sender,
          rows: entry.rows,
          nowMs,
        })
        return (
          cleanupDecision.isCleanupCandidate === true &&
          clusterMatchesIdentity(params.selectedCluster, cleanupDecision.groupSpec?.cluster_id)
        )
      })
      .flatMap((entry) => entry.rows)
      .sort((left, right) =>
        (right.internal_date_ms || 0) - (left.internal_date_ms || 0) ||
        right.message_id.localeCompare(left.message_id)
      )
  }

  return {
    rows: exactRows,
    fastPathApplied: filteredRows.fastPathApplied,
    candidateRowCount: exactRows.length,
    rawCandidateRowCount: candidateRowCount,
    loadedCandidateRowCount: rows.length,
  }
}

async function buildSenderWorkspaceBaseStateFromSelectedClusterRows(params: {
  supabase: SupabaseClient
  tenantId: string
  selectedClusterRows: GmailMailboxIndexRow[]
  cleanupCandidateMessageCount: number
}): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> {
  const selectedClusterRows = params.selectedClusterRows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
  const rowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of selectedClusterRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = rowsBySenderKey.get(senderKey) || []
    current.push(row)
    rowsBySenderKey.set(senderKey, current)
  }

  const senderBreakdown = buildQueryClusterBrowserSenderBreakdown({
    rows: selectedClusterRows,
    cleanupGroupRows: selectedClusterRows,
    previewLimit: 5,
    includePreviewMessages: false,
  })

  const senderSignals = await loadGmailSenderIndexSignalsForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    senders: senderBreakdown.map((entry) => entry.sender),
    queryMode: 'sender_page',
  })
  const signalBySender = new Map(
    (senderSignals.ok ? senderSignals.data.senders : []).map((entry) => [
      normalizeSender(entry.sender),
      entry,
    ])
  )
  const previewRowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const entry of senderBreakdown) {
    const senderRows = rowsBySenderKey.get(entry.sender_key) || []
    const previewRows = senderRows
      .slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
      .slice(0, 5)
    previewRowsBySenderKey.set(entry.sender_key, previewRows)
  }

  const allSenders = senderBreakdown.map((entry) => {
    const signal = signalBySender.get(entry.sender_key)
    const categoryProfile = senderWorkspaceCanonicalCategoryProfile(signal)
    const operatorProfile = senderWorkspaceOperatorProfile(signal)
    const persistedPatternMix = normalizePatternMix(signal?.pattern_mix)
    const dominantPattern =
      persistedPatternMix.length > 0
        ? signal?.dominant_pattern ||
          persistedPatternMix[0]?.pattern ||
          entry.dominant_pattern ||
          GMAIL_PATTERN_LABEL_THIN_HISTORY
        : entry.dominant_pattern || GMAIL_PATTERN_LABEL_THIN_HISTORY
    const semantic =
      signal != null
        ? {
            semantic_family: signal.semantic_family,
            semantic_pattern: signal.semantic_pattern,
          }
        : resolveSenderSemanticsFromCompatibility({
            sender: entry.sender,
            subjectHints: entry.preview_messages.map((message) => message.subject || ''),
            totalMessageCount: entry.cleanup_group_message_count,
            categoryProfile,
            patternMix: persistedPatternMix,
            dominantPattern,
            operatorProfile,
            machineProbability: null,
            humanProbability: null,
            sourceKind: 'sender_stats',
          })
    const verificationReasons: string[] = []
    if (entry.batch_protected_count > 0) verificationReasons.push('Protected message evidence')
    if (entry.preview_messages.some((message) => (message.category_labels || []).length > 1)) {
      verificationReasons.push('Mixed category evidence')
    }
    if ((signal?.human_probability || 0) >= 0.45) verificationReasons.push('Human-like history')
    if ((signal?.machine_probability || 0) >= 0.45 && (signal?.human_probability || 0) >= 0.3) {
      verificationReasons.push('Mixed sender behavior')
    }
    if (entry.batch_important_count > 0 || entry.batch_starred_count > 0) {
      verificationReasons.push('Important or starred activity')
    }

    const senderRows = rowsBySenderKey.get(entry.sender_key) || []
    const senderRow = senderRows[0]

    return {
      sender: entry.sender,
      sender_key: entry.sender_key,
      sender_domain:
        (senderRow ? rowSenderDomain(senderRow) : null) || senderDomainFromString(entry.sender),
      cleanup_group_message_count: entry.cleanup_group_message_count,
      total_sender_messages: signal?.message_count_indexed ?? null,
      unread_count: entry.batch_unread_count,
      last_activity: signal?.last_seen || entry.batch_last_seen,
      first_seen: signal?.first_seen || entry.batch_first_seen,
      category_distribution: categoryProfile.category_distribution,
      categorized_message_count: categoryProfile.categorized_message_count,
      uncategorized_message_count: categoryProfile.uncategorized_message_count,
      multi_category_message_count: categoryProfile.multi_category_message_count,
      dominant_category: categoryProfile.dominant_category,
      dominant_category_confidence: categoryProfile.dominant_category_confidence,
      category_profile_mode: categoryProfile.category_profile_mode,
      category_summary: categoryProfile.category_summary,
      category_summary_source: categoryProfile.category_summary_source,
      semantic_family: semantic.semantic_family,
      semantic_pattern: semantic.semantic_pattern,
      dominant_pattern: dominantPattern,
      pattern_mix: persistedPatternMix,
      operator_profile_family: operatorProfile.operator_profile_family,
      operator_profile_mode: operatorProfile.operator_profile_mode,
      operator_profile_confidence: operatorProfile.operator_profile_confidence,
      operator_profile_summary: operatorProfile.operator_profile_summary,
      operator_profile_reasons: operatorProfile.operator_profile_reasons,
      operator_profile_source: operatorProfile.operator_profile_source,
      sender_signal:
        signal?.machine_probability != null || signal?.human_probability != null
          ? (signal.human_probability || 0) >= 0.65
            ? 'likely_human'
            : (signal.machine_probability || 0) >= 0.65
              ? 'likely_machine_generated'
              : 'uncertain'
          : senderSignalFromText({
              sender: entry.sender,
              sampleText: `${entry.sender} ${entry.preview_messages
                .map((message) => message.subject || '')
                .join(' ')}`,
            }),
      machine_probability: signal?.machine_probability ?? null,
      human_probability: signal?.human_probability ?? null,
      protected_hint: entry.batch_protected_count > 0 ? 'Protected message evidence present' : null,
      requires_verification: verificationReasons.length > 0,
      verification_reasons: verificationReasons,
      preview_messages: buildPreviewMessages(previewRowsBySenderKey.get(entry.sender_key) || senderRows, 5),
      learned_policy: null,
    }
  })

  return {
    ok: true,
    data: {
      selectedClusterRows,
      allSenders,
      cleanupCandidateMessageCount: params.cleanupCandidateMessageCount,
    },
  }
}

async function tryBuildSenderWorkspaceBaseStateFastPath(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  clusters: ClusterInput[]
  timeZone?: string | null
}): Promise<
  | { ok: true; data: SenderWorkspaceBaseState; fastPathApplied: string }
  | ReturnType<typeof fail>
  | null
> {
  const startedAt = Date.now()
  if (params.analysisScope !== 'all_indexed' && params.selectedCluster.cluster_type === 'newsletters') {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        status: 'rejected_recent_newsletter_scope',
      })}`
    )
    return null
  }
  const expectedSelectedClusterCount = expectedClusterMessageCount(params.selectedCluster)
  const expectedCleanupCandidateCount = expectedCleanupCandidateMessageCount(params.clusters)
  if (
    expectedSelectedClusterCount == null ||
    expectedCleanupCandidateCount == null ||
    expectedSelectedClusterCount <= 0 ||
    expectedCleanupCandidateCount < expectedSelectedClusterCount
  ) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        expected_cluster_row_count: expectedSelectedClusterCount,
        expected_cleanup_candidate_count: expectedCleanupCandidateCount,
        status: 'rejected_missing_snapshot_counts',
      })}`
    )
    return null
  }

  const candidateRowsResult = await loadSenderWorkspaceFastPathCandidateRows({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    selectedCluster: params.selectedCluster,
    expectedClusterMessageCount: expectedSelectedClusterCount,
    timeZone: params.timeZone,
  })
  if (!candidateRowsResult) return null

  const scopedCandidateUnderfillAccepted =
    params.analysisScope !== 'all_indexed' &&
    params.selectedCluster.cluster_type !== 'newsletters' &&
    candidateRowsResult.candidateRowCount > 0 &&
    candidateRowsResult.candidateRowCount < expectedSelectedClusterCount

  if (
    candidateRowsResult.candidateRowCount !== expectedSelectedClusterCount &&
    !scopedCandidateUnderfillAccepted
  ) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        fast_path_applied: candidateRowsResult.fastPathApplied,
        candidate_row_count: candidateRowsResult.candidateRowCount,
        raw_candidate_row_count: candidateRowsResult.rawCandidateRowCount,
        expected_cluster_row_count: expectedSelectedClusterCount,
        scoped_underfill_allowed: scopedCandidateUnderfillAccepted,
        status: 'rejected_candidate_count_mismatch',
      })}`
    )
    return null
  }

  if (candidateRowsResult.loadedCandidateRowCount !== candidateRowsResult.rawCandidateRowCount) {
    console.info(
      `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
        cluster_id: params.selectedCluster.cluster_id,
        analysis_scope: params.analysisScope,
        fast_path_applied: candidateRowsResult.fastPathApplied,
        candidate_row_count: candidateRowsResult.candidateRowCount,
        raw_candidate_row_count: candidateRowsResult.rawCandidateRowCount,
        loaded_candidate_row_count: candidateRowsResult.loadedCandidateRowCount,
        status: 'rejected_candidate_rows_incomplete',
      })}`
    )
    return null
  }

  const selectedClusterRows = candidateRowsResult.rows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))

  const baseState = await buildSenderWorkspaceBaseStateFromSelectedClusterRows({
    supabase: params.supabase,
    tenantId: params.tenantId,
    selectedClusterRows,
    cleanupCandidateMessageCount: expectedCleanupCandidateCount,
  })
  if (!baseState.ok) return baseState

  console.info(
    `${GMAIL_SENDER_WORKSPACE_FAST_PATH_LOG_PREFIX} ${JSON.stringify({
      cluster_id: params.selectedCluster.cluster_id,
      analysis_scope: params.analysisScope,
      fast_path_applied: candidateRowsResult.fastPathApplied,
      candidate_row_count: candidateRowsResult.candidateRowCount,
      raw_candidate_row_count: candidateRowsResult.rawCandidateRowCount,
      selected_cluster_row_count: selectedClusterRows.length,
      cleanup_candidate_message_count: expectedCleanupCandidateCount,
      status: scopedCandidateUnderfillAccepted ? 'applied_scoped_underfill' : 'applied',
      duration_ms: Math.max(0, Date.now() - startedAt),
    })}`
  )

  return {
    ok: true,
    data: baseState.data,
    fastPathApplied: candidateRowsResult.fastPathApplied,
  }
}

function protectionLabel(row: GmailMailboxIndexRow): string | null {
  if (row.is_starred) return 'Starred messages present'
  if (row.is_important) return 'Important messages present'
  if (rowCategoryHas(row, 'CATEGORY_PRIMARY')) return 'Primary-category evidence present'
  return null
}

function senderDomainFromString(sender: string): string | null {
  const normalized = normalizeSender(sender)
  const at = normalized.indexOf('@')
  if (at <= 0 || at >= normalized.length - 1) return null
  return normalized.slice(at + 1)
}

function buildPreviewMessages(
  rows: GmailMailboxIndexRow[],
  previewLimit = 5,
  snippetByMessageId?: ReadonlyMap<string, string | null>
): GmailCleanupPreviewMessage[] {
  return rows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    .slice(0, Math.min(Math.max(previewLimit, 1), 8))
    .map((row) => ({
      message_id: row.message_id,
      thread_id: row.thread_id || undefined,
      internal_date_ms: row.internal_date_ms || undefined,
      subject: row.subject,
      from: row.sender,
      date: row.date,
      snippet: snippetByMessageId?.get(row.message_id) ?? null,
      label_ids: row.label_ids,
      category_labels: row.category_labels,
      is_in_inbox: row.is_in_inbox,
      is_unread: row.is_unread,
      is_important: row.is_important,
      is_starred: row.is_starred,
    }))
}

function buildScopeLadderCounts(params: {
  wholeMailbox: number
  cleanupCandidate: number
  cleanupGroup: number
  senderSet: number
  loadedPreviewRows: number
}): GmailScopeLadderCounts {
  return {
    whole_mailbox: params.wholeMailbox,
    cleanup_candidate_universe: params.cleanupCandidate,
    cleanup_group: params.cleanupGroup,
    sender_set: params.senderSet,
    loaded_preview_rows: params.loadedPreviewRows,
  }
}

function topCategorySummary(rows: GmailMailboxIndexRow[]): string {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const label = rowCategoryHas(row, 'CATEGORY_PROMOTIONS')
      ? 'Promotions'
      : rowCategoryHas(row, 'CATEGORY_SOCIAL')
        ? 'Social'
        : rowCategoryHas(row, 'CATEGORY_UPDATES')
          ? 'Updates'
          : rowCategoryHas(row, 'CATEGORY_FORUMS')
            ? 'Forums'
            : rowCategoryHas(row, 'CATEGORY_PRIMARY')
              ? 'Primary'
              : classifySenderPatternFromSubject(row.subject)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join(' · ')
}

function senderWorkspaceCanonicalCategoryProfile(
  signal: GmailSenderIndexSignal | undefined
): ReturnType<typeof insufficientDataCanonicalSenderProfile> {
  if (!signal) return insufficientDataCanonicalSenderProfile()
  return buildCanonicalSenderCategorySummary({
    category_distribution: signal.category_distribution,
    categorized_message_count: signal.categorized_message_count,
    uncategorized_message_count: signal.uncategorized_message_count,
    multi_category_message_count: signal.multi_category_message_count,
    dominant_category: signal.dominant_category,
    dominant_category_confidence: signal.dominant_category_confidence,
    category_profile_mode: signal.category_profile_mode,
  })
}

function senderWorkspaceOperatorProfile(
  signal: GmailSenderIndexSignal | undefined
) {
  if (!signal) return insufficientDataOperatorProfile()
  return {
    operator_profile_family: signal.operator_profile_family,
    operator_profile_mode: signal.operator_profile_mode,
    operator_profile_confidence: signal.operator_profile_confidence,
    operator_profile_summary: signal.operator_profile_summary,
    operator_profile_reasons: Array.isArray(signal.operator_profile_reasons)
      ? signal.operator_profile_reasons
      : [],
    operator_profile_source: signal.operator_profile_source,
  }
}

function primarySenderCategory(summary: string): string {
  const head = summary.split('·')[0]?.trim() || ''
  const cleaned = head.replace(/\(\d+\)\s*$/, '').trim()
  return cleaned || 'Other'
}

function buildSenderActivityTimeline(params: {
  senders: GmailSenderWorkspaceData['senders']
  rows?: GmailMailboxIndexRow[]
  allowedSenderKeys?: Set<string> | null
  analysisScope: GmailAnalysisScope
  timeZone?: string | null
  coverageStartIso?: string | null
  coverageEndIso?: string | null
}): {
  items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
  granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
} {
  if (!Array.isArray(params.rows) || params.rows.length === 0) {
    return {
      items: [],
      granularity: activityTimelineGranularityForScope(params.analysisScope),
    }
  }
  return buildSenderWorkspaceActivityTimelineFromRows({
    rows: params.rows,
    allowedSenderKeys: params.allowedSenderKeys,
    analysisScope: params.analysisScope,
    timeZone: params.timeZone,
    coverageStartIso: params.coverageStartIso,
    coverageEndIso: params.coverageEndIso,
  })
}

function hasCanonicalPersistedSenderActivityTimeline(params: {
  analysisScope: GmailAnalysisScope
  items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline'] | null | undefined
  expectedSenderTotal: number
}): boolean {
  if (!shouldRecomputeLaneATimeContextTimeline(params.analysisScope)) return false
  if (!Array.isArray(params.items) || params.items.length === 0) return false

  const expectedGrouping =
    params.analysisScope === '90d'
      ? 'week'
      : params.analysisScope === '7d' || params.analysisScope === '30d'
        ? 'day'
        : 'month'
  const expectedBucketCount =
    params.analysisScope === '365d'
      ? 12
      : params.analysisScope === '90d'
        ? 13
        : params.analysisScope === '30d'
          ? 30
          : params.analysisScope === '7d'
            ? 7
            : null
  if (expectedBucketCount != null && params.items.length !== expectedBucketCount) return false

  let previousEndExclusiveMs: number | null = null
  let maxBucketSenderCount = 0

  for (const item of params.items) {
    if (item.contract_version !== 'ace046_phase3_timeline_v1') return false
    if (item.metric_family !== 'sender_activity') return false
    if (!item.time_zone || !item.grouping) return false
    if (item.grouping !== expectedGrouping) return false
    const bucketStartMs =
      typeof item.bucket_start_iso === 'string' ? Date.parse(item.bucket_start_iso) : Number.NaN
    const bucketEndExclusiveMs =
      typeof item.bucket_end_exclusive_iso === 'string'
        ? Date.parse(item.bucket_end_exclusive_iso)
        : Number.NaN
    if (!Number.isFinite(bucketStartMs) || !Number.isFinite(bucketEndExclusiveMs)) {
      return false
    }
    if (bucketStartMs >= bucketEndExclusiveMs) return false
    if (previousEndExclusiveMs != null && bucketStartMs !== previousEndExclusiveMs) {
      return false
    }
    previousEndExclusiveMs = bucketEndExclusiveMs
    maxBucketSenderCount = Math.max(
      maxBucketSenderCount,
      Math.max(0, Math.round(item.sender_count || 0))
    )
  }

  if (params.analysisScope === 'all_indexed') {
    const expectedSenderTotal = Math.max(0, Math.round(params.expectedSenderTotal || 0))
    return expectedSenderTotal <= 0 || maxBucketSenderCount <= expectedSenderTotal
  }

  return true
}

function canonicalTimeContextTimelineSenders(params: {
  analysisScope: GmailAnalysisScope
  canonicalUniverse: { senders: GmailSenderWorkspaceData['senders'] | null } | null
  scopedSenders: GmailSenderWorkspaceData['senders']
  scopedSenderKeys?: Set<string> | null
  fallbackSenders: GmailSenderWorkspaceData['senders']
}): GmailSenderWorkspaceData['senders'] {
  if (params.analysisScope === 'all_indexed') {
    if (
      params.canonicalUniverse?.senders &&
      params.canonicalUniverse.senders.length > 0 &&
      params.canonicalUniverse.senders.length >= params.scopedSenders.length
    ) {
      return params.canonicalUniverse.senders.slice()
    }
    if (params.scopedSenders.length > 0) {
      return params.scopedSenders.slice()
    }
    return params.fallbackSenders.slice()
  }

  const scopedSenderKeys =
    params.scopedSenderKeys && params.scopedSenderKeys.size > 0
      ? params.scopedSenderKeys
      : senderKeySetFromWorkspaceSenders(params.scopedSenders)

  if (scopedSenderKeys && params.canonicalUniverse?.senders && params.canonicalUniverse.senders.length > 0) {
    const scopedCanonicalSenders = filterSendersToParentUniverse(
      params.canonicalUniverse.senders.slice(),
      scopedSenderKeys
    )
    if (scopedCanonicalSenders.length > 0) {
      return scopedCanonicalSenders
    }
  }

  if (params.scopedSenders.length > 0) {
    return params.scopedSenders.slice()
  }

  return params.fallbackSenders.slice()
}

function buildWindowScopedWorkspaceSenders(params: {
  senders: GmailSenderWorkspaceData['senders']
  rows: GmailMailboxIndexRow[]
}): GmailSenderWorkspaceData['senders'] {
  const rowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of params.rows) {
    const senderDisplay = rowSender(row) || row.sender || 'Unknown sender'
    const senderKey = normalizeSender(senderDisplay) || senderDisplay.trim().toLowerCase()
    if (!senderKey) continue
    const current = rowsBySenderKey.get(senderKey) || []
    current.push(row)
    rowsBySenderKey.set(senderKey, current)
  }

  return params.senders
    .filter((sender) => rowsBySenderKey.has(sender.sender_key))
    .map((sender) => {
      const senderRows = (rowsBySenderKey.get(sender.sender_key) || [])
        .slice()
        .sort((left, right) => (right.internal_date_ms || 0) - (left.internal_date_ms || 0))
      const latestRow = senderRows[0]
      return {
        ...sender,
        cleanup_group_message_count: senderRows.length,
        unread_count: senderRows.filter((row) => row.is_unread).length,
        last_activity:
          typeof latestRow?.internal_date_ms === 'number' && Number.isFinite(latestRow.internal_date_ms)
            ? new Date(latestRow.internal_date_ms).toISOString()
            : sender.last_activity,
        preview_messages: buildPreviewMessages(senderRows, 5),
      }
    })
}

function buildSenderCategoryDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['sender_category_distribution'] {
  const counts = new Map<string, number>()
  for (const sender of senders) {
    const label = primarySenderCategory(sender.category_summary)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([label, senderCount]) => ({ label, sender_count: senderCount }))
}

function buildClusterContributionMetrics(params: {
  senders: GmailSenderWorkspaceData['senders']
  clusterMessageCount: number
}): GmailSenderWorkspaceData['analytics']['cluster_contribution'] {
  return params.senders
    .slice()
    .sort(
      (left, right) =>
        right.cleanup_group_message_count - left.cleanup_group_message_count ||
        left.sender.localeCompare(right.sender)
    )
    .slice(0, 6)
    .map((sender) => ({
      sender: sender.sender,
      sender_key: sender.sender_key,
      message_count: sender.cleanup_group_message_count,
      share_pct:
        params.clusterMessageCount > 0
          ? Math.round((sender.cleanup_group_message_count / params.clusterMessageCount) * 100)
          : 0,
    }))
}

function buildSenderAttributeDistribution(params: {
  senders: GmailSenderWorkspaceData['senders']
  valueForSender: (sender: GmailSenderWorkspaceData['senders'][number]) => string | null | undefined
}): Array<{ label: string; sender_count: number; share_pct: number }> {
  const counts = new Map<string, number>()
  for (const sender of params.senders) {
    const rawValue = params.valueForSender(sender)
    const label = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (!label) continue
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  const totalSenders = params.senders.length
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, senderCount]) => ({
      label,
      sender_count: senderCount,
      share_pct: totalSenders > 0 ? Math.round((senderCount / totalSenders) * 100) : 0,
    }))
}

function buildOperatorProfileFamilyDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['operator_profile_family_distribution'] {
  return buildCompatibilityOperatorProfileFamilyDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_family_distribution
  )
}

function buildDominantPatternDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['dominant_pattern_distribution'] {
  return buildCompatibilityDominantPatternDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_pattern_distribution
  )
}

function buildOperatorProfileModeDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'] {
  return buildCompatibilityOperatorProfileModeDistribution(
    buildSemanticAnalyticsDistributions(senders).semantic_resolution_distribution
  )
}

function buildCategorySummarySourceDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['category_summary_source_distribution'] {
  return buildSenderAttributeDistribution({
    senders,
    valueForSender: (sender) => sender.category_summary_source,
  }).map(({ label, sender_count, share_pct }) => ({
    source: label as GmailSenderWorkspaceData['senders'][number]['category_summary_source'],
    sender_count,
    share_pct,
  }))
}

function shouldUseSenderWorkspaceArtifactRead(params: {
  tenantId: string
  analysisScope: GmailAnalysisScope
}): boolean {
  return GMAIL_SENDER_WORKSPACE_ARTIFACT_ALLOWLIST.has(
    `${params.tenantId.trim()}::${normalizeMailboxProfileScope(params.analysisScope)}`
  )
}

function shouldRecomputeLaneATimeContextTimeline(scope: GmailAnalysisScope): boolean {
  return (
    scope === 'all_indexed' ||
    scope === '365d' ||
    scope === '90d' ||
    scope === '30d' ||
    scope === '7d'
  )
}

function artifactRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function artifactText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function artifactNullableText(value: unknown): string | null {
  const normalized = artifactText(value)
  return normalized || null
}

function artifactInteger(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback
}

function artifactBoolean(value: unknown): boolean {
  return value === true
}

function artifactStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => artifactText(entry)).filter(Boolean)
    : []
}

function dedupeArtifactStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => artifactText(value)).filter(Boolean))
  )
}

function parentSenderUniverseCacheKey(params: {
  tenantId: string
  selectedCluster: ClusterInput
  cacheVersion?: string | null
}): string {
  return [
    params.tenantId.trim(),
    artifactClusterLookupId(params.selectedCluster),
    artifactText(params.cacheVersion) || 'no-cache-version',
  ].join('::')
}

function shouldReturnZeroRecentScopeForCluster(
  selectedCluster: ClusterInput,
  analysisScope: GmailAnalysisScope
): boolean {
  return (
    analysisScope !== 'all_indexed' &&
    selectedCluster.cluster_type === 'historical_out_of_inbox'
  )
}

function shouldEnforceRecentScopeParentUniverse(
  selectedCluster: ClusterInput,
  analysisScope: GmailAnalysisScope
): boolean {
  return (
    analysisScope !== 'all_indexed' &&
    (selectedCluster.cluster_id.startsWith('secondary.') ||
      selectedCluster.cluster_id.startsWith('context.'))
  )
}

function shouldBypassRecentScopeSnapshotShortcut(
  selectedCluster: ClusterInput,
  analysisScope: GmailAnalysisScope
): boolean {
  return (
    analysisScope !== 'all_indexed'
  )
}

function buildSenderDistributionEntriesFromWorkspaceSenders(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderDistributionData['senders'] {
  return senders.map((sender) => ({
    sender: sender.sender,
    sender_key: sender.sender_key,
    cleanup_group_message_count: sender.cleanup_group_message_count,
    unread_count: sender.unread_count,
    last_activity: sender.last_activity,
    sender_signal: sender.sender_signal,
    requires_verification: sender.requires_verification,
  }))
}

function buildSenderDistributionDataFromWorkspaceSenders(params: {
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  senders: GmailSenderWorkspaceData['senders']
  source?: GmailSenderDistributionData['source']
}): GmailSenderDistributionData {
  const distributionSenders = buildSenderDistributionEntriesFromWorkspaceSenders(params.senders)
  const selectedClusterMessageCount = distributionSenders.reduce(
    (sum, sender) => sum + sender.cleanup_group_message_count,
    0
  )

  return {
    analysis_scope: normalizeMailboxProfileScope(params.analysisScope),
    selected_cluster: {
      cluster_id: params.selectedCluster.cluster_id,
      canonical_cluster_id:
        params.selectedCluster.canonical_cluster_id || params.selectedCluster.cluster_id,
      legacy_cluster_ids: params.selectedCluster.legacy_cluster_ids || [],
      cluster_type: params.selectedCluster.cluster_type,
      title: params.selectedCluster.title,
      query: params.selectedCluster.query,
      message_count: selectedClusterMessageCount,
      sender_count: distributionSenders.length,
    },
    senders: distributionSenders,
    source: params.source || 'gmail_index_cache',
  }
}

function artifactSeedSenderSignal(row: GmailSenderWorkspaceSeedRow): GmailSenderDistributionData['senders'][number]['sender_signal'] {
  const seedPayload = artifactRecord(row.seed_payload) || {}
  const seeded = artifactNullableText(seedPayload.sender_signal)
  return seeded === 'likely_machine_generated' || seeded === 'likely_human' ? seeded : 'uncertain'
}

function materializeArtifactSenderDistributionSender(
  row: GmailSenderWorkspaceSeedRow
): GmailSenderDistributionData['senders'][number] {
  return {
    sender: row.sender,
    sender_key: row.sender_key,
    cleanup_group_message_count: Math.max(0, Math.round(row.cleanup_group_message_count || 0)),
    unread_count: Math.max(0, Math.round(row.unread_count || 0)),
    last_activity: row.last_activity_at || null,
    sender_signal: artifactSeedSenderSignal(row),
    requires_verification: row.requires_verification === true,
  }
}

async function loadSenderDistributionFromArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
  reviewUnitId: string | null
}): Promise<GmailArtifactSuccess<GmailSenderDistributionData> | ReturnType<typeof fail>> {
  const availabilityFailure = await loadPublishedArtifactAvailabilityFailure(params)
  if (availabilityFailure) return availabilityFailure
  const artifactSelectedClusterId = artifactClusterLookupId(params.selectedCluster)
  const headerRead = await loadPublishedGmailSenderWorkspaceArtifactPage({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: normalizeMailboxProfileScope(params.analysisScope),
    selectedClusterId: artifactSelectedClusterId,
    page: 1,
    pageSize: 1,
  })

  const publicationFailure = publishedArtifactAvailabilityFailure(headerRead.publication)
  if (publicationFailure) return publicationFailure
  if (!headerRead.publication) {
    return fail(409, 'Published Gmail runtime artifacts are still being prepared.', {
      reason: 'missing_published_artifact',
      retryAfterMs: 15_000,
    })
  }
  if (!headerRead.selected_header) {
    return fail(404, 'The selected cleanup group is unavailable in the published artifact.', {
      reason: 'missing_selected_cluster_seed',
      freshnessState: headerRead.publication?.freshness_state ?? null,
      buildStatus: headerRead.publication?.build_status ?? null,
      publishedVersion: headerRead.publication?.published_version ?? null,
    })
  }

  const artifactVersion = headerRead.artifact_version
  const resolvedClusterId = artifactText(headerRead.selected_header.cluster_id) || artifactSelectedClusterId
  if (params.reviewUnitId) {
    const exactSeedRows: GmailSenderWorkspaceSeedRow[] = []
    let exactRead = await loadPublishedGmailSenderWorkspaceArtifactReviewUnitPage({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: normalizeMailboxProfileScope(params.analysisScope),
      selectedClusterId: artifactSelectedClusterId,
      page: 1,
      pageSize: MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
      reviewUnitId: params.reviewUnitId,
      sort: 'message_count',
      direction: 'desc',
    })
    if (exactRead.focused_capability_available) {
      if (exactRead.focused_request_valid !== true) {
        return fail(409, 'The selected review unit is stale or invalid for this artifact.', {
          reason: 'invalid_review_unit_id',
        })
      }
      exactSeedRows.push(...exactRead.seed_rows)
      const exactSenderCount = exactRead.focused_total_senders
      for (
        let page = 2;
        exactSeedRows.length < exactSenderCount;
        page += 1
      ) {
        exactRead = await loadPublishedGmailSenderWorkspaceArtifactReviewUnitPage({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: normalizeMailboxProfileScope(params.analysisScope),
          selectedClusterId: artifactSelectedClusterId,
          page,
          pageSize: MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
          reviewUnitId: params.reviewUnitId,
          sort: 'message_count',
          direction: 'desc',
        })
        if (exactRead.focused_request_valid !== true || exactRead.seed_rows.length === 0) {
          return fail(409, 'The selected review unit could not be read completely.', {
            reason: 'review_unit_membership_incomplete',
          })
        }
        exactSeedRows.push(...exactRead.seed_rows)
      }
      if (exactSeedRows.length !== exactSenderCount) {
        return fail(409, 'The selected review-unit sender total does not match its manifest.', {
          reason: 'review_unit_membership_mismatch',
        })
      }
      const distributionSenders = exactSeedRows.map((row) =>
        materializeArtifactSenderDistributionSender(row)
      )
      const selectedClusterMessageCount = distributionSenders.reduce(
        (sum, sender) => sum + sender.cleanup_group_message_count,
        0
      )
      return {
        ok: true,
        publication: headerRead.publication,
        data: {
          analysis_scope: normalizeMailboxProfileScope(params.analysisScope),
          selected_cluster: {
            cluster_id: params.selectedCluster.cluster_id,
            canonical_cluster_id:
              params.selectedCluster.canonical_cluster_id || params.selectedCluster.cluster_id,
            legacy_cluster_ids: params.selectedCluster.legacy_cluster_ids || [],
            cluster_type: params.selectedCluster.cluster_type,
            title: params.selectedCluster.title,
            query: params.selectedCluster.query,
            message_count: selectedClusterMessageCount,
            sender_count: distributionSenders.length,
          },
          senders: distributionSenders,
          source: 'gmail_index_cache',
        },
      }
    }
  }
  const selectedClusterSenderCount = Math.max(
    0,
    artifactInteger(headerRead.selected_header.sender_count)
  )
  const distributionBaseQueryRows =
    headerRead.headers.length + headerRead.seed_rows.length + headerRead.preview_index_rows.length
  if (
    distributionBaseQueryRows + selectedClusterSenderCount >=
    MAX_GMAIL_OPERATIONS_FIRST_PAINT_ARTIFACT_ROWS
  ) {
    return fail(409, 'The sender distribution exceeds the accepted first-paint artifact budget.', {
      reason: 'artifact_row_budget_exceeded',
    })
  }
  const seedRows: GmailSenderWorkspaceSeedRow[] = []
  const readBatchSize = MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE

  for (let rangeStart = 0; rangeStart < selectedClusterSenderCount; rangeStart += readBatchSize) {
    const rangeEnd = Math.min(rangeStart + readBatchSize - 1, selectedClusterSenderCount - 1)
    const { data, error } = await params.supabase
      .from('gmail_sender_workspace_seed_rows')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', normalizeMailboxProfileScope(params.analysisScope))
      .eq('artifact_version', artifactVersion)
      .eq('cluster_id', resolvedClusterId)
      .order('default_rank', { ascending: true })
      .range(rangeStart, rangeEnd)

    if (error) {
      return fail(500, `Failed to load sender distribution artifact seed rows: ${error.message}`)
    }

    const batch = Array.isArray(data) ? (data as GmailSenderWorkspaceSeedRow[]) : []
    seedRows.push(...batch)
    const artifactBudgetFailure = firstPaintArtifactBudgetFailure(
      distributionBaseQueryRows + seedRows.length
    )
    if (artifactBudgetFailure) return artifactBudgetFailure
    if (batch.length < rangeEnd - rangeStart + 1) break
  }

  const filteredRows = seedRows.filter((row) =>
    senderDistributionSeedRowMatchesSemanticFocus(row, params.semanticFocus)
  )
  const distributionSenders = filteredRows.map((row) =>
    materializeArtifactSenderDistributionSender(row)
  )
  const selectedClusterMessageCount = distributionSenders.reduce(
    (sum, sender) => sum + sender.cleanup_group_message_count,
    0
  )

  console.info(
    `${GMAIL_SENDER_WORKSPACE_ARTIFACT_LOG_PREFIX} distribution ${JSON.stringify({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      selected_cluster_id: params.selectedCluster.cluster_id,
      aggregate_artifact_query_rows: distributionBaseQueryRows + seedRows.length,
      seed_row_count: seedRows.length,
    })}`
  )

  return {
    ok: true,
    publication: headerRead.publication,
    data: {
      analysis_scope: normalizeMailboxProfileScope(params.analysisScope),
      selected_cluster: {
        cluster_id: params.selectedCluster.cluster_id,
        canonical_cluster_id:
          params.selectedCluster.canonical_cluster_id || params.selectedCluster.cluster_id,
        legacy_cluster_ids: params.selectedCluster.legacy_cluster_ids || [],
        cluster_type: params.selectedCluster.cluster_type,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
        message_count: selectedClusterMessageCount,
        sender_count: distributionSenders.length,
      },
      senders: distributionSenders,
      source: 'gmail_index_cache',
    },
  }
}

async function loadSenderDistributionFromLiveBaseState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  clusters: ClusterInput[]
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
  cacheVersion?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindow?: Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null
  senderOverviewStart?: string | null
  senderOverviewEnd?: string | null
  timeZone?: string | null
}): Promise<{ ok: true; data: GmailSenderDistributionData } | ReturnType<typeof fail>> {
  const senderWorkspaceBase = await loadSenderWorkspaceBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    cacheVersion: params.cacheVersion ?? null,
    clusters: ensureSelectedClusterIncluded(params.clusters, params.selectedCluster),
    selectedCluster: params.selectedCluster,
    timeZone: params.timeZone ?? null,
  })
  if (!senderWorkspaceBase.ok) return senderWorkspaceBase

  const needsParentUniverseGuard = shouldEnforceRecentScopeParentUniverse(
    params.selectedCluster,
    params.analysisScope
  )
  const parentSenderUniverse = needsParentUniverseGuard
    ? await loadAllIndexedParentSenderUniverse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        selectedCluster: params.selectedCluster,
        cacheVersion: params.cacheVersion ?? null,
      })
    : null
  const parentSenderUniverseKeys =
    parentSenderUniverse && parentSenderUniverse.senderKeys.length > 0
      ? new Set(parentSenderUniverse.senderKeys)
      : null
  const allSenders = parentSenderUniverseKeys
    ? filterSendersToParentUniverse(
        senderWorkspaceBase.data.allSenders.slice(),
        parentSenderUniverseKeys
      )
    : senderWorkspaceBase.data.allSenders.slice()

  let scopedSenders = allSenders
  const needsTimelineScopedFiltering =
    normalizeTimeContextBucketLabel(params.timeContextBucketLabel) != null ||
    normalizeSenderOverviewWindow(params.senderOverviewWindow) != null

  if (needsTimelineScopedFiltering) {
    const canonicalTimeContextBase = await loadCanonicalTimeContextBaseState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      cacheVersion: params.cacheVersion ?? null,
      clusters: ensureSelectedClusterIncluded(params.clusters, params.selectedCluster),
      selectedCluster: params.selectedCluster,
      timeZone: params.timeZone ?? null,
      scopedBase: senderWorkspaceBase.data,
    })
    if (!canonicalTimeContextBase.ok) return canonicalTimeContextBase
    const canonicalTimeContextSenders = parentSenderUniverseKeys
      ? filterSendersToParentUniverse(
          canonicalTimeContextBase.data.allSenders.slice(),
          parentSenderUniverseKeys
        )
      : canonicalTimeContextBase.data.allSenders.slice()
    const canonicalTimeContextSenderKeys =
      senderKeySetFromWorkspaceSenders(canonicalTimeContextSenders)
    const canonicalTimeContextUniverse =
      parentSenderUniverse ??
      (await loadAllIndexedParentSenderUniverse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        selectedCluster: params.selectedCluster,
        cacheVersion: params.cacheVersion ?? null,
      }))
    const canonicalTimelineSenders = canonicalTimeContextTimelineSenders({
      analysisScope: params.analysisScope,
      canonicalUniverse: canonicalTimeContextUniverse,
      scopedSenders: canonicalTimeContextSenders,
      scopedSenderKeys: canonicalTimeContextSenderKeys,
      fallbackSenders: canonicalTimeContextSenders,
    })
    const scopeTimelineResolution = resolveCanonicalSenderTimelineResolution({
      analysisScope: params.analysisScope,
      senderWorkspaceBase: canonicalTimeContextBase.data,
      canonicalSenders: canonicalTimelineSenders,
      scopedSenderKeys: canonicalTimeContextSenderKeys,
      timeZone: params.timeZone ?? null,
    })
    if (!scopeTimelineResolution.ok) {
      return scopeTimelineResolution
    }

    const senderOverviewWindow = normalizeSenderOverviewWindow(params.senderOverviewWindow)
    const timeContextBucketLabel = normalizeTimeContextBucketLabel(params.timeContextBucketLabel)
    const senderOverviewWindowResolution = senderOverviewWindow
      ? resolveCanonicalSenderTimelineResolution({
          analysisScope: params.analysisScope,
          senderWorkspaceBase: canonicalTimeContextBase.data,
          canonicalSenders: canonicalTimeContextTimelineSenders({
            analysisScope: params.analysisScope,
            canonicalUniverse: canonicalTimeContextUniverse,
            scopedSenders: canonicalTimeContextSenders,
            scopedSenderKeys: canonicalTimeContextSenderKeys,
            fallbackSenders: canonicalTimeContextSenders,
          }),
          scopedSenderKeys: canonicalTimeContextSenderKeys,
          pressureWindow: senderOverviewWindow,
          pressureStart: params.senderOverviewStart ?? null,
          pressureEnd: params.senderOverviewEnd ?? null,
          timeZone: params.timeZone ?? null,
        })
      : null
    if (senderOverviewWindowResolution && !senderOverviewWindowResolution.ok) {
      return senderOverviewWindowResolution
    }

    const windowFilteredSenders =
      senderOverviewWindowResolution?.ok
        ? buildWindowScopedWorkspaceSenders({
            senders: senderOverviewWindowResolution.data.activeSenders,
            rows: senderOverviewWindowResolution.data.activeRows,
          })
        : timeContextBucketLabel != null
          ? canonicalTimeContextSenders
          : allSenders
    const scopedBucketSenderKeys = timeContextBucketLabel
      ? resolveSenderKeysFromTimelineResolution({
          resolution: scopeTimelineResolution.data,
          bucketLabel: timeContextBucketLabel,
          bucketStartAt: normalizeTimeContextBucketIso(params.timeContextBucketStartAt),
          bucketEndExclusiveAt: normalizeTimeContextBucketIso(params.timeContextBucketEndExclusiveAt),
        })
      : null

    if (timeContextBucketLabel && scopedBucketSenderKeys && !scopedBucketSenderKeys.bucketExists) {
      return fail(409, 'The selected Time Context bucket is unavailable for the current workflow scope.')
    }
    if (
      timeContextBucketLabel &&
      scopedBucketSenderKeys &&
      scopedBucketSenderKeys.bucketExists &&
      scopedBucketSenderKeys.senderKeys.size === 0
    ) {
      return fail(409, 'The selected Time Context bucket is empty for the current workflow scope.')
    }

    scopedSenders =
      scopedBucketSenderKeys && timeContextBucketLabel
        ? buildWindowScopedWorkspaceSenders({
            senders: windowFilteredSenders,
            rows: scopedBucketSenderKeys.scopedRows,
          })
        : windowFilteredSenders
  }

  const filteredSenders = scopedSenders.filter((sender) =>
    senderMatchesWorkspaceFilters({
      sender,
      search: '',
      filter: 'all',
      semanticFocus: params.semanticFocus,
    })
  )

  return {
    ok: true,
    data: buildSenderDistributionDataFromWorkspaceSenders({
      analysisScope: params.analysisScope,
      selectedCluster: params.selectedCluster,
      senders: filteredSenders,
      source: 'gmail_index_cache',
    }),
  }
}

async function loadAllIndexedParentSenderUniverse(params: {
  supabase: SupabaseClient
  tenantId: string
  selectedCluster: ClusterInput
  cacheVersion?: string | null
}): Promise<ParentSenderUniverse | null> {
  const cacheKey = parentSenderUniverseCacheKey(params)
  const cached = parentSenderUniverseCache.get(cacheKey) || null
  if (cached && cached.expires_at_ms > Date.now()) return cached.data

  const inflight = parentSenderUniverseInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async () => {
    const applyCache = (data: ParentSenderUniverse | null, ttlMs = GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS) => {
      parentSenderUniverseCache.set(cacheKey, {
        expires_at_ms: Date.now() + ttlMs,
        data,
      })
      return data
    }

    try {
      const baseState = await loadSenderWorkspaceBaseState({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: 'all_indexed',
        cacheVersion: params.cacheVersion ?? null,
        clusters: [params.selectedCluster],
        selectedCluster: params.selectedCluster,
      })
      if (!baseState.ok) return applyCache(null, 5_000)

      const senderKeys = dedupeArtifactStrings(
        baseState.data.allSenders.map((sender) => sender.sender_key)
      )
      return applyCache({
        senderKeys,
        totalSenders: senderKeys.length,
        senders: baseState.data.allSenders,
      })
    } catch (error) {
      console.warn(
        `${GMAIL_SENDER_UNIVERSE_GUARD_LOG_PREFIX} parent sender universe lookup failed:`,
        error
      )
      return applyCache(null, 5_000)
    }
  })()

  parentSenderUniverseInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    parentSenderUniverseInflight.delete(cacheKey)
  }
}

function filterSendersToParentUniverse<T extends { sender_key: string }>(
  senders: T[],
  allowedSenderKeys: Set<string>
): T[] {
  return senders.filter((sender) => allowedSenderKeys.has(sender.sender_key))
}

function senderWorkspaceSnapshotCacheKey(params: {
  agentId: string
  analysisScope: GmailAnalysisScope
}): string {
  return [
    params.agentId.trim(),
    normalizeMailboxProfileScope(params.analysisScope),
  ].join('::')
}

function parsePersistedCleanupDiscoverySnapshot(value: unknown): PersistedCleanupDiscoverySnapshot | null {
  const payload = artifactRecord(value)
  if (!payload) return null
  if (artifactText(payload.version) !== GMAIL_SENDER_WORKSPACE_SNAPSHOT_VERSION) return null
  const cleanupDiscovery = artifactRecord(payload.cleanup_discovery) as GmailCleanupDiscoveryData | null
  if (!cleanupDiscovery || !Array.isArray(cleanupDiscovery.clusters)) return null
  return {
    cleanupDiscoveryData: cleanupDiscovery,
    generatedAt: artifactNullableText(payload.generated_at),
    expiresAt: artifactNullableText(payload.expires_at),
    analysisScope: normalizeMailboxProfileScope(payload.analysis_scope),
  }
}

async function loadLatestPersistedCleanupDiscoverySnapshot(params: {
  supabase: SupabaseClient
  agentId: string
  analysisScope: GmailAnalysisScope
}): Promise<PersistedCleanupDiscoverySnapshot | null> {
  const cacheKey = senderWorkspaceSnapshotCacheKey(params)
  const cached = senderWorkspaceSnapshotCache.get(cacheKey) || null
  if (cached && cached.expires_at_ms > Date.now()) {
    return cached.data
  }
  const inflight = senderWorkspaceSnapshotInflight.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const loadPromise = (async () => {
    const normalizedScope = normalizeMailboxProfileScope(params.analysisScope)
    const applyCache = (data: PersistedCleanupDiscoverySnapshot | null, ttlMs: number) => {
      senderWorkspaceSnapshotCache.set(cacheKey, {
        expires_at_ms: Date.now() + ttlMs,
        data,
      })
      return data
    }

    const recentRead = await params.supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', params.agentId)
      .eq('event_type', GMAIL_SENDER_WORKSPACE_SNAPSHOT_EVENT_TYPE)
      .order('created_at', { ascending: false })
      .limit(GMAIL_SENDER_WORKSPACE_SNAPSHOT_RECENT_SCAN_LIMIT)

    if (recentRead.error) {
      console.warn(
        `${GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX} snapshot lookup failed:`,
        recentRead.error
      )
      return applyCache(null, 5_000)
    }

    const recentSnapshots = ((recentRead.data || []) as Array<{ payload: unknown }>)
      .map((row) => parsePersistedCleanupDiscoverySnapshot(row.payload))
      .filter((snapshot): snapshot is PersistedCleanupDiscoverySnapshot => snapshot != null)
    const recentMatch =
      recentSnapshots.find((snapshot) => snapshot.analysisScope === normalizedScope) || null

    if (recentMatch) {
      return applyCache(recentMatch, GMAIL_SENDER_WORKSPACE_SNAPSHOT_CACHE_TTL_MS)
    }

    if (recentSnapshots.length < GMAIL_SENDER_WORKSPACE_SNAPSHOT_RECENT_SCAN_LIMIT) {
      return applyCache(null, GMAIL_SENDER_WORKSPACE_SNAPSHOT_CACHE_TTL_MS)
    }

    const exactRead = await params.supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', params.agentId)
      .eq('event_type', GMAIL_SENDER_WORKSPACE_SNAPSHOT_EVENT_TYPE)
      .eq('payload->>version', GMAIL_SENDER_WORKSPACE_SNAPSHOT_VERSION)
      .eq('payload->>analysis_scope', normalizedScope)
      .order('created_at', { ascending: false })
      .limit(1)

    if (exactRead.error) {
      console.warn(
        `${GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX} exact snapshot lookup failed:`,
        exactRead.error
      )
      return applyCache(null, 5_000)
    }

    const exactMatch =
      ((exactRead.data || []) as Array<{ payload: unknown }>)
        .map((row) => parsePersistedCleanupDiscoverySnapshot(row.payload))
        .find((snapshot): snapshot is PersistedCleanupDiscoverySnapshot => snapshot != null) || null

    return applyCache(exactMatch, GMAIL_SENDER_WORKSPACE_SNAPSHOT_CACHE_TTL_MS)
  })()

  senderWorkspaceSnapshotInflight.set(cacheKey, loadPromise)

  try {
    return await loadPromise
  } finally {
    senderWorkspaceSnapshotInflight.delete(cacheKey)
  }
}

function isDefaultSenderOverviewSnapshotRequest(params: {
  page: number
  pageSize: number
  searchInput: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
  previewEvidenceSenderKey?: string | null
}): boolean {
  return (
    params.page === 1 &&
    params.pageSize === DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE &&
    params.searchInput === '' &&
    params.filter === 'all' &&
    params.sort === 'message_count' &&
    params.direction === 'desc' &&
    params.semanticFocus == null &&
    !artifactText(params.previewEvidenceSenderKey)
  )
}

function snapshotWorkspaceHasCompleteSenderPopulation(
  workspace: GmailSenderWorkspaceData | null | undefined
): boolean {
  if (!workspace) return false
  const totalSenders = Math.max(
    artifactInteger(workspace.pagination?.total_senders, workspace.senders.length),
    workspace.senders.length
  )
  return workspace.senders.length >= totalSenders
}

function canServeSenderWorkspaceFromPersistedSnapshot(params: {
  searchInput: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
  previewEvidenceSenderKey?: string | null
}): boolean {
  return (
    params.searchInput === '' &&
    params.filter === 'all' &&
    params.sort === 'message_count' &&
    params.direction === 'desc' &&
    !artifactText(params.previewEvidenceSenderKey)
  )
}

function resolvePersistedSenderOverviewWorkspace(params: {
  snapshot: PersistedCleanupDiscoverySnapshot
  selectedCluster: ClusterInput
  requestedSelectedClusterId?: string | null
}): { workspace: GmailSenderWorkspaceData; snapshotClusterId: string } | null {
  const snapshotWorkspaceByCluster = params.snapshot.cleanupDiscoveryData.sender_overview_snapshot || null
  if (!snapshotWorkspaceByCluster) return null

  const requestedClusterId =
    artifactText(params.requestedSelectedClusterId) || params.selectedCluster.cluster_id
  const snapshotIdentity = resolveCleanupClusterIdentity(
    requestedClusterId,
    params.snapshot.cleanupDiscoveryData.clusters.map((cluster) => ({
      clusterId: cluster.cluster_id,
      canonicalClusterId: cluster.canonical_cluster_id || cluster.cluster_id,
      legacyClusterIds: cluster.legacy_cluster_ids || [],
      sourceClusterIds: cluster.source_cluster_ids || [],
    }))
  )
  const normalizedCanonicalClusterId = canonicalRuntimeClusterIdFromIdentity(
    snapshotIdentity,
    params.selectedCluster.canonical_cluster_id || params.selectedCluster.cluster_id
  )

  const candidateClusterIds = dedupeArtifactStrings([
    requestedClusterId,
    normalizedCanonicalClusterId,
    ...clusterLookupIds(params.selectedCluster),
    snapshotIdentity.canonicalClusterId,
    ...(snapshotIdentity.legacyClusterIds || []),
    ...(snapshotIdentity.sourceClusterIds || []),
  ])

  for (const clusterId of candidateClusterIds) {
    const workspace = snapshotWorkspaceByCluster[clusterId]
    if (workspace) {
      return {
        workspace,
        snapshotClusterId: clusterId,
      }
    }
  }

  return null
}

function buildSenderWorkspaceFromPersistedSnapshot(params: {
  snapshot: PersistedCleanupDiscoverySnapshot
  snapshotClusterId: string
  snapshotWorkspace: GmailSenderWorkspaceData
  selectedCluster: ClusterInput
  requestedSelectedClusterId?: string | null
  analysisScope: GmailAnalysisScope
  pageSize: number
  includeClusterSenderKeys: boolean
}): GmailSenderWorkspaceData {
  const snapshotSelectedCluster = params.snapshotWorkspace.selected_cluster
  const canonicalClusterId =
    artifactText(params.selectedCluster.canonical_cluster_id) ||
    params.selectedCluster.cluster_id ||
    artifactText(snapshotSelectedCluster.canonical_cluster_id) ||
    artifactText(snapshotSelectedCluster.cluster_id) ||
    params.snapshotClusterId
  const legacyClusterIds = dedupeArtifactStrings([
    ...(params.selectedCluster.legacy_cluster_ids || []),
    ...artifactStringArray(snapshotSelectedCluster.legacy_cluster_ids),
    artifactText(snapshotSelectedCluster.cluster_id),
  ])
  const snapshotPagination = params.snapshotWorkspace.pagination || {
    page: 1,
    page_size: params.pageSize,
    total_senders: params.snapshotWorkspace.senders.length,
    total_pages: 1,
    cluster_total_senders: params.snapshotWorkspace.senders.length,
  }
  const snapshotClusterGlobal = params.snapshotWorkspace.cluster_global || {
    sender_keys: [],
    sender_keys_complete: false,
  }
  const snapshotAnalytics = params.snapshotWorkspace.analytics
  const totalSenders = Math.max(
    artifactInteger(snapshotPagination.total_senders, params.snapshotWorkspace.senders.length),
    params.snapshotWorkspace.senders.length
  )
  const totalPages = Math.max(
    1,
    Math.ceil(totalSenders / Math.max(params.pageSize, 1))
  )

  return {
    ...params.snapshotWorkspace,
    analysis_scope: normalizeMailboxProfileScope(params.analysisScope),
    selected_cluster: {
      cluster_id: canonicalClusterId,
      canonical_cluster_id: canonicalClusterId,
      legacy_cluster_ids: legacyClusterIds,
      cluster_type: artifactText(snapshotSelectedCluster.cluster_type) || params.selectedCluster.cluster_type,
      title: artifactText(snapshotSelectedCluster.title) || params.selectedCluster.title,
      query: artifactText(snapshotSelectedCluster.query) || params.selectedCluster.query,
      why_selected:
        artifactText(snapshotSelectedCluster.why_selected) ||
        params.selectedCluster.why_selected ||
        'Chosen from Cleanup Groups.',
      risk_note:
        artifactText(snapshotSelectedCluster.risk_note) ||
        params.selectedCluster.risk_note ||
        'Confirm mixed senders before archive.',
      safety_note:
        artifactText(snapshotSelectedCluster.safety_note) ||
        params.selectedCluster.safety_note ||
        'Messages remain in All Mail; only INBOX changes after approval.',
      message_count: artifactInteger(snapshotSelectedCluster.message_count),
      sender_count: artifactInteger(snapshotSelectedCluster.sender_count, totalSenders),
      share_pct: artifactInteger(snapshotSelectedCluster.share_pct),
      surface_tier:
        snapshotSelectedCluster.surface_tier || params.selectedCluster.surface_tier || null,
      surface_kind:
        snapshotSelectedCluster.surface_kind || params.selectedCluster.surface_kind || null,
      surface_visibility:
        snapshotSelectedCluster.surface_visibility || params.selectedCluster.surface_visibility || null,
      top_level_rank:
        typeof snapshotSelectedCluster.top_level_rank === 'number' &&
        Number.isFinite(snapshotSelectedCluster.top_level_rank)
          ? snapshotSelectedCluster.top_level_rank
          : params.selectedCluster.top_level_rank ?? null,
    },
    senders: params.snapshotWorkspace.senders.slice(0, params.pageSize),
    pagination: {
      page: 1,
      page_size: params.pageSize,
      total_senders: totalSenders,
      total_pages: totalPages,
      cluster_total_senders: artifactInteger(
        snapshotPagination.cluster_total_senders,
        totalSenders
      ),
    },
    cluster_global: params.includeClusterSenderKeys
      ? {
          sender_keys: Array.isArray(snapshotClusterGlobal.sender_keys)
            ? snapshotClusterGlobal.sender_keys
            : [],
          sender_keys_complete: snapshotClusterGlobal.sender_keys_complete === true,
        }
      : {
          sender_keys: [],
          sender_keys_complete: false,
        },
    analytics: {
      ...snapshotAnalytics,
      cleanup_group_canonical_cluster_id: canonicalClusterId,
      cleanup_group_legacy_cluster_ids: dedupeArtifactStrings([
        ...artifactStringArray(snapshotAnalytics?.cleanup_group_legacy_cluster_ids),
        ...legacyClusterIds,
      ]),
    },
    view: {
      search: '',
      filter: 'all',
      sort: 'message_count',
      direction: 'desc',
    },
  }
}

function buildSenderWorkspaceRequestFromPersistedSnapshot(params: {
  snapshotClusterId: string
  snapshotWorkspace: GmailSenderWorkspaceData
  selectedCluster: ClusterInput
  analysisScope: GmailAnalysisScope
  page: number
  pageSize: number
  searchInput: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
  includeClusterSenderKeys: boolean
  allowedSenderKeys?: Set<string> | null
  allIndexedSenderTotal?: number | null
  coverageStartIso?: string | null
  coverageEndIso?: string | null
  timeZone?: string | null
  logContext?: Record<string, unknown>
}): GmailSenderWorkspaceData {
  const snapshotSelectedCluster = params.snapshotWorkspace.selected_cluster
  const canonicalClusterId =
    artifactText(params.selectedCluster.canonical_cluster_id) ||
    params.selectedCluster.cluster_id ||
    artifactText(snapshotSelectedCluster.canonical_cluster_id) ||
    artifactText(snapshotSelectedCluster.cluster_id) ||
    params.snapshotClusterId
  const legacyClusterIds = dedupeArtifactStrings([
    ...(params.selectedCluster.legacy_cluster_ids || []),
    ...artifactStringArray(snapshotSelectedCluster.legacy_cluster_ids),
    artifactText(snapshotSelectedCluster.cluster_id),
  ])
  const allSnapshotSenders = params.snapshotWorkspace.senders.slice()
  const allSenders = params.allowedSenderKeys
    ? filterSendersToParentUniverse(allSnapshotSenders, params.allowedSenderKeys)
    : allSnapshotSenders
  if (
    params.allowedSenderKeys &&
    allSenders.length !== allSnapshotSenders.length
  ) {
    console.info(
      `${GMAIL_SENDER_UNIVERSE_GUARD_LOG_PREFIX} ${JSON.stringify({
        ...params.logContext,
        before_sender_count: allSnapshotSenders.length,
        after_sender_count: allSenders.length,
        all_indexed_sender_total: params.allIndexedSenderTotal,
        status: 'applied_snapshot_workspace_parent_universe_intersection',
      })}`
    )
  }

  const filteredSenders = allSenders.filter((sender) =>
    senderMatchesWorkspaceFilters({
      sender,
      search: '',
      filter: params.filter,
      semanticFocus: params.semanticFocus,
    })
  )

  filteredSenders.sort((left, right) => {
    let delta = 0
    if (params.sort === 'sender') {
      delta = left.sender.localeCompare(right.sender)
    } else if (params.sort === 'unread_count') {
      delta = left.unread_count - right.unread_count
    } else if (params.sort === 'last_activity') {
      delta =
        (Date.parse(left.last_activity || '') || 0) - (Date.parse(right.last_activity || '') || 0)
    } else {
      delta = left.cleanup_group_message_count - right.cleanup_group_message_count
    }
    if (delta === 0) delta = left.sender.localeCompare(right.sender)
    return params.direction === 'asc' ? delta : delta * -1
  })

  const totalSenders = filteredSenders.length
  const totalPages = Math.max(1, Math.ceil(totalSenders / Math.max(params.pageSize, 1)))
  const normalizedPage = Math.min(Math.max(1, params.page), totalPages)
  const rangeStart = (normalizedPage - 1) * params.pageSize
  const senders = filteredSenders.slice(rangeStart, rangeStart + params.pageSize)
  const cleanupGroupMessageCount = allSenders.reduce(
    (sum, sender) => sum + sender.cleanup_group_message_count,
    0
  )
  const scopeLadder = params.snapshotWorkspace.scope_ladder
  const recomputedSenderActivityTimeline = buildSenderActivityTimeline({
    senders: allSenders,
    analysisScope: params.analysisScope,
    timeZone: params.timeZone,
    coverageStartIso: params.coverageStartIso,
    coverageEndIso: params.coverageEndIso,
  })
  const recomputedSenderActivityTimelineIsCanonical = hasCanonicalPersistedSenderActivityTimeline({
    analysisScope: params.analysisScope,
    items: recomputedSenderActivityTimeline.items,
    expectedSenderTotal: allSenders.length,
  })
  const persistedSenderActivityTimeline = hasCanonicalPersistedSenderActivityTimeline({
    analysisScope: params.analysisScope,
    items: params.snapshotWorkspace.analytics?.sender_activity_timeline,
    expectedSenderTotal: allSenders.length,
  })
    ? {
        items: params.snapshotWorkspace.analytics.sender_activity_timeline,
        granularity:
          params.snapshotWorkspace.analytics.sender_activity_timeline_granularity ||
          recomputedSenderActivityTimeline.granularity,
      }
    : null
  const senderActivityTimeline = recomputedSenderActivityTimelineIsCanonical
    ? recomputedSenderActivityTimeline
    : persistedSenderActivityTimeline || recomputedSenderActivityTimeline
  const semanticAnalytics = buildSemanticAnalyticsDistributions(allSenders)
  const semanticArtifactFields = buildPersistedSemanticRollupArtifactFields({
    clusterId: canonicalClusterId,
    senderCount: allSenders.length,
    messageCount: cleanupGroupMessageCount,
    semanticAnalytics,
  })

  return {
    ...params.snapshotWorkspace,
    analysis_scope: normalizeMailboxProfileScope(params.analysisScope),
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: artifactInteger(scopeLadder?.whole_mailbox),
      cleanupCandidate: artifactInteger(scopeLadder?.cleanup_candidate_universe),
      cleanupGroup: cleanupGroupMessageCount,
      senderSet: filteredSenders.length,
      loadedPreviewRows: senders.reduce((sum, sender) => sum + sender.preview_messages.length, 0),
    }),
    selected_cluster: {
      cluster_id: canonicalClusterId,
      canonical_cluster_id: canonicalClusterId,
      legacy_cluster_ids: legacyClusterIds,
      cluster_type: artifactText(snapshotSelectedCluster.cluster_type) || params.selectedCluster.cluster_type,
      title: artifactText(snapshotSelectedCluster.title) || params.selectedCluster.title,
      query: artifactText(snapshotSelectedCluster.query) || params.selectedCluster.query,
      why_selected:
        artifactText(snapshotSelectedCluster.why_selected) ||
        params.selectedCluster.why_selected ||
        'Chosen from Cleanup Groups.',
      risk_note:
        artifactText(snapshotSelectedCluster.risk_note) ||
        params.selectedCluster.risk_note ||
        'Confirm mixed senders before archive.',
      safety_note:
        artifactText(snapshotSelectedCluster.safety_note) ||
        params.selectedCluster.safety_note ||
        'Messages remain in All Mail; only INBOX changes after approval.',
      message_count: cleanupGroupMessageCount,
      sender_count: allSenders.length,
      share_pct: artifactInteger(snapshotSelectedCluster.share_pct),
      surface_tier:
        snapshotSelectedCluster.surface_tier || params.selectedCluster.surface_tier || null,
      surface_kind:
        snapshotSelectedCluster.surface_kind || params.selectedCluster.surface_kind || null,
      surface_visibility:
        snapshotSelectedCluster.surface_visibility || params.selectedCluster.surface_visibility || null,
      top_level_rank:
        typeof snapshotSelectedCluster.top_level_rank === 'number' &&
        Number.isFinite(snapshotSelectedCluster.top_level_rank)
          ? snapshotSelectedCluster.top_level_rank
          : params.selectedCluster.top_level_rank ?? null,
    },
    senders,
    pagination: {
      page: normalizedPage,
      page_size: params.pageSize,
      total_senders: totalSenders,
      total_pages: totalPages,
      cluster_total_senders: allSenders.length,
    },
    cluster_global: params.includeClusterSenderKeys
      ? {
          sender_keys:
            params.snapshotWorkspace.cluster_global?.sender_keys_complete === true
              ? params.snapshotWorkspace.cluster_global.sender_keys
              : allSenders.map((sender) => sender.sender_key),
          sender_keys_complete: true,
        }
      : {
          sender_keys: [],
          sender_keys_complete: false,
        },
    analytics: {
      sender_category_distribution: buildSenderCategoryDistribution(allSenders),
      semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
      semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
      semantic_rollup: semanticArtifactFields.semantic_rollup,
      semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
      semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
      semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
      semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
      semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
      semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      operator_profile_family_distribution: buildCompatibilityOperatorProfileFamilyDistribution(
        semanticArtifactFields.semantic_family_distribution
      ),
      dominant_pattern_distribution: buildCompatibilityDominantPatternDistribution(
        semanticArtifactFields.semantic_pattern_distribution
      ),
      operator_profile_mode_distribution: buildCompatibilityOperatorProfileModeDistribution(
        semanticArtifactFields.semantic_resolution_distribution
      ),
      category_summary_source_distribution: buildCategorySummarySourceDistribution(allSenders),
      sender_activity_timeline: senderActivityTimeline.items,
      sender_activity_timeline_granularity: senderActivityTimeline.granularity,
      cluster_contribution: buildClusterContributionMetrics({
        senders: allSenders,
        clusterMessageCount: cleanupGroupMessageCount,
      }),
    },
    view: {
      search: params.searchInput,
      filter: params.filter,
      sort: params.sort,
      direction: params.direction,
    },
    exceptions_count: allSenders.filter((sender) => sender.requires_verification).length,
    source: 'gmail_index_cache',
  }
}

function artifactOperatorProfileFamily(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['operator_profile_family'] | null {
  const normalized = artifactNullableText(value)
  return normalized && GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_FAMILY_SET.has(normalized as never)
    ? (normalized as GmailSenderWorkspaceData['senders'][number]['operator_profile_family'])
    : null
}

function artifactOperatorProfileMode(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['operator_profile_mode'] | null {
  const normalized = artifactNullableText(value)
  return normalized && GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_MODE_SET.has(normalized as never)
    ? (normalized as GmailSenderWorkspaceData['senders'][number]['operator_profile_mode'])
    : null
}

function artifactOperatorProfileSource(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['operator_profile_source'] | null {
  const normalized = artifactNullableText(value)
  return normalized && GMAIL_SENDER_WORKSPACE_OPERATOR_PROFILE_SOURCE_SET.has(normalized as never)
    ? (normalized as GmailSenderWorkspaceData['senders'][number]['operator_profile_source'])
    : null
}

function artifactCategorySummarySource(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['category_summary_source'] | null {
  const normalized = artifactNullableText(value)
  return normalized && GMAIL_SENDER_WORKSPACE_CATEGORY_SUMMARY_SOURCE_SET.has(normalized as never)
    ? (normalized as GmailSenderWorkspaceData['senders'][number]['category_summary_source'])
    : null
}

function artifactSemanticFamily(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family']['family'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'marketing_promotional' ||
    normalized === 'commerce_transactional' ||
    normalized === 'account_notification' ||
    normalized === 'security_alert' ||
    normalized === 'social_community' ||
    normalized === 'human_personal'
    ? normalized
    : null
}

function artifactSemanticPatternClass(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_pattern']['pattern_class'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'promotional_cycle' ||
    normalized === 'transactional_cycle' ||
    normalized === 'service_update_cycle' ||
    normalized === 'security_cycle' ||
    normalized === 'social_activity_cycle' ||
    normalized === 'human_correspondence_cycle'
    ? normalized
    : null
}

function artifactSemanticResolution(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family']['resolution'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'clear' || normalized === 'mixed' || normalized === 'thin_history'
    ? normalized
    : null
}

function artifactSemanticConfidence(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family']['confidence'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'high' || normalized === 'medium' || normalized === 'low'
    ? normalized
    : null
}

function artifactSemanticFamilyProvenance(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family']['provenance'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'operator_profile_compat' ||
    normalized === 'ranked_evidence_compat' ||
    normalized === 'artifact_seed_compat'
    ? normalized
    : null
}

function artifactSemanticPatternProvenance(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_pattern']['provenance'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'pattern_label_compat' ||
    normalized === 'ranked_evidence_compat' ||
    normalized === 'subject_heuristic' ||
    normalized === 'artifact_seed_compat'
    ? normalized
    : null
}

function artifactSemanticDecompositionStatus(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family']['decomposition_status'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'not_applicable' ||
    normalized === 'candidate' ||
    normalized === 'resolved' ||
    normalized === 'deferred'
    ? normalized
    : null
}

function artifactDominantCategoryConfidence(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['operator_profile_confidence'] {
  const normalized = artifactNullableText(value)
  return normalized &&
    GMAIL_SENDER_WORKSPACE_DOMINANT_CATEGORY_CONFIDENCE_SET.has(normalized as never)
    ? (normalized as NonNullable<GmailSenderWorkspaceData['senders'][number]['operator_profile_confidence']>)
    : null
}

function artifactSemanticGroupPolicyMode(
  value: unknown
): NonNullable<GmailSenderWorkspaceData['analytics']['semantic_rollup']>['group_policy_mode'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'structural_only' ||
    normalized === 'structural_backlog' ||
    normalized === 'semantic_first'
    ? normalized
    : null
}

function artifactSemanticSubtypePersistenceState(
  value: unknown
): NonNullable<
  GmailSenderWorkspaceData['analytics']['semantic_rollup']
>['family_distribution'][number]['subtype_persistence_state'] | null {
  const normalized = artifactNullableText(value)
  return normalized === 'suppressed' ||
    normalized === 'provisional' ||
    normalized === 'survives'
    ? normalized
    : null
}

function parsePersistedArtifactSemanticFamily(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_family'] | null {
  const record = artifactRecord(value)
  if (!record) return null
  const family = artifactSemanticFamily(record.family)
  const resolution = artifactSemanticResolution(record.resolution)
  const confidence = artifactSemanticConfidence(record.confidence)
  const provenance = artifactSemanticFamilyProvenance(record.provenance)
  const decompositionStatus = artifactSemanticDecompositionStatus(record.decomposition_status)
  if (!family || !resolution || !confidence || !provenance || !decompositionStatus) return null
  return {
    family,
    resolution,
    confidence,
    provenance,
    umbrella: artifactBoolean(record.umbrella),
    decomposition_status: decompositionStatus,
    subtype_key: artifactNullableText(record.subtype_key),
    subtype_label: artifactNullableText(record.subtype_label),
    decomposition_path: artifactNullableText(record.decomposition_path),
  }
}

function parsePersistedArtifactSemanticPattern(
  value: unknown
): GmailSenderWorkspaceData['senders'][number]['semantic_pattern'] | null {
  const record = artifactRecord(value)
  if (!record) return null
  const patternClass = artifactSemanticPatternClass(record.pattern_class)
  const resolution = artifactSemanticResolution(record.resolution)
  const confidence = artifactSemanticConfidence(record.confidence)
  const provenance = artifactSemanticPatternProvenance(record.provenance)
  const decompositionStatus = artifactSemanticDecompositionStatus(record.decomposition_status)
  if (!patternClass || !resolution || !confidence || !provenance || !decompositionStatus) {
    return null
  }
  return {
    pattern_class: patternClass,
    resolution,
    confidence,
    provenance,
    umbrella: artifactBoolean(record.umbrella),
    decomposition_status: decompositionStatus,
    subtype_key: artifactNullableText(record.subtype_key),
    subtype_label: artifactNullableText(record.subtype_label),
    decomposition_path: artifactNullableText(record.decomposition_path),
  }
}

function artifactSemanticRollupSchemaVersion(value: unknown): number | null {
  const version = artifactInteger(value)
  return version > 0 ? version : null
}

function chunkArtifactStrings(values: string[], size: number): string[][] {
  if (values.length === 0) return []
  const chunks: string[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

async function loadSenderWorkspaceArtifactPreviewRowsByMessageIds(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  artifactVersion: string
  selectedClusterId: string
  messageIds: string[]
}): Promise<GmailPreviewIndexRow[]> {
  const rows: GmailPreviewIndexRow[] = []
  const messageIds = chunkArtifactStrings(
    Array.from(new Set(params.messageIds.map((messageId) => artifactText(messageId)).filter(Boolean))),
    GMAIL_SENDER_WORKSPACE_ARTIFACT_STATS_BATCH_SIZE
  )
  for (const batch of messageIds) {
    const { data, error } = await params.supabase
      .from('gmail_preview_index')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', normalizeMailboxProfileScope(params.analysisScope))
      .eq('artifact_version', params.artifactVersion)
      .eq('cluster_id', artifactText(params.selectedClusterId))
      .in('message_id', batch)
      .order('sender_key', { ascending: true })
      .order('preview_rank', { ascending: true })

    if (error) {
      throw new Error(`Failed to load gmail_preview_index by message_id: ${error.message}`)
    }
    rows.push(...((data || []) as GmailPreviewIndexRow[]))
  }
  return rows
}

function parseArtifactSemanticSubtypeEntries(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number]['top_subtypes'] {
  return Array.isArray(value)
    ? value
        .map((subtype) => {
          const subtypeRecord = artifactRecord(subtype)
          if (!subtypeRecord) return null
          const key = artifactText(subtypeRecord.key)
          const label = artifactText(subtypeRecord.label)
          const decompositionStatus = artifactSemanticDecompositionStatus(
            subtypeRecord.decomposition_status
          )
          if (!key || !label || !decompositionStatus) return null
          return {
            key,
            label,
            decomposition_path: artifactNullableText(subtypeRecord.decomposition_path),
            sender_count: artifactInteger(subtypeRecord.sender_count),
            share_pct: artifactInteger(subtypeRecord.share_pct),
            umbrella: artifactBoolean(subtypeRecord.umbrella),
            decomposition_status: decompositionStatus,
          }
        })
        .filter(
          (
            subtype
          ): subtype is GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number]['top_subtypes'][number] =>
            subtype != null
        )
    : []
}

function parseArtifactSemanticFamilyDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_family_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const family = artifactSemanticFamily(record.family)
          if (!family) return null
          return {
            family,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
            umbrella: artifactBoolean(record.umbrella),
            resolved_subtype_sender_count: artifactInteger(record.resolved_subtype_sender_count),
            provisional_subtype_sender_count: artifactInteger(
              record.provisional_subtype_sender_count
            ),
            top_subtypes: parseArtifactSemanticSubtypeEntries(record.top_subtypes),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSemanticPatternDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const patternClass = artifactSemanticPatternClass(record.pattern_class)
          if (!patternClass) return null
          return {
            pattern_class: patternClass,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
            resolved_subtype_sender_count: artifactInteger(record.resolved_subtype_sender_count),
            provisional_subtype_sender_count: artifactInteger(
              record.provisional_subtype_sender_count
            ),
            top_subtypes: parseArtifactSemanticSubtypeEntries(record.top_subtypes),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSemanticResolutionDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const scope =
            artifactText(record.scope) === 'pattern'
              ? 'pattern'
              : artifactText(record.scope) === 'family'
                ? 'family'
                : null
          const resolution = artifactSemanticResolution(record.resolution)
          if (!scope || !resolution) return null
          return {
            scope,
            resolution,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSemanticConfidenceDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const scope =
            artifactText(record.scope) === 'pattern'
              ? 'pattern'
              : artifactText(record.scope) === 'family'
                ? 'family'
                : null
          const confidence = artifactSemanticConfidence(record.confidence)
          if (!scope || !confidence) return null
          return {
            scope,
            confidence,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSemanticProvenanceDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_provenance_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const scope =
            artifactText(record.scope) === 'pattern'
              ? 'pattern'
              : artifactText(record.scope) === 'family'
                ? 'family'
                : null
          const provenance =
            scope === 'family'
              ? artifactSemanticFamilyProvenance(record.provenance)
              : artifactSemanticPatternProvenance(record.provenance)
          if (!scope || !provenance) return null
          return {
            scope,
            provenance,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_provenance_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSemanticUmbrellaDistribution(
  value: unknown
): GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const scope =
            artifactText(record.scope) === 'pattern'
              ? 'pattern'
              : artifactText(record.scope) === 'family'
                ? 'family'
                : null
          const bucket =
            artifactText(record.bucket) === 'umbrella'
              ? 'umbrella'
              : artifactText(record.bucket) === 'non_umbrella'
                ? 'non_umbrella'
                : null
          if (!scope || !bucket) return null
          return {
            scope,
            bucket,
            sender_count: artifactInteger(record.sender_count),
            share_pct: artifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution'][number] =>
            entry != null
        )
    : []
}

function artifactCleanupGroupSurfaceTier(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_surface_tier'] {
  return value === 'featured_parent' || value === 'collapsed_parent' || value === 'secondary'
    ? value
    : null
}

function artifactCleanupGroupSurfaceKind(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_surface_kind'] {
  return value === 'semantic_parent' ||
    value === 'backlog_parent' ||
    value === 'structural_parent' ||
    value === 'historical_parent' ||
    value === 'secondary_candidate'
    ? value
    : null
}

function artifactCleanupGroupSurfaceVisibility(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_surface_visibility'] {
  return value === 'visible' ? value : null
}

function artifactCleanupGroupPromotionStatus(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_promotion_status'] {
  return value === 'promoted' ||
    value === 'demoted_small' ||
    value === 'demoted_mixed' ||
    value === 'demoted_low_operator_value' ||
    value === 'demoted_cap_exceeded' ||
    value === 'structural_lane' ||
    value === 'secondary_visible' ||
    value === 'unresolved'
    ? value
    : null
}

function artifactCleanupGroupOperatorValueStatus(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_operator_value_status'] {
  return value === 'strong' || value === 'low' || value === 'not_applicable' ? value : null
}

function artifactCleanupGroupReviewUnitBasis(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_review_unit_basis'] {
  return value === 'subtype-first' ||
    value === 'family-first' ||
    value === 'protection-reason-first' ||
    value === 'exclusion-reason-first' ||
    value === 'selected_axis_dominant_lane' ||
    value === 'structural_lane' ||
    value === 'direct-open' ||
    value === 'secondary_group' ||
    value === 'not_promoted'
    ? value
    : null
}

function artifactCleanupGroupSemanticAxis(
  value: unknown
): GmailSenderWorkspaceData['analytics']['cleanup_group_selected_semantic_axis'] {
  return value === 'family' || value === 'pattern' ? value : null
}

type ParsedArtifactCleanupGroupReviewUnit = NonNullable<
  GmailSenderWorkspaceData['analytics']['semantic_rollup']
>['review_unit_plan']['units'][number]

function parseArtifactCleanupGroupReviewUnits(
  value: unknown
): NonNullable<GmailSenderWorkspaceData['analytics']['semantic_rollup']>['review_unit_plan']['units'] {
  if (!Array.isArray(value)) return []
  return value
    .map<ParsedArtifactCleanupGroupReviewUnit | null>((entry) => {
      const record = artifactRecord(entry)
      if (!record) return null
      const unitId = artifactText(record.unit_id)
      const label = artifactText(record.label)
      const sourceKind =
        record.source_kind === 'family_subtype' ||
        record.source_kind === 'pattern_subtype' ||
        record.source_kind === 'family_remainder' ||
        record.source_kind === 'pattern_remainder' ||
        record.source_kind === 'spillover' ||
        record.source_kind === 'family_lane' ||
        record.source_kind === 'assignment_reason' ||
        record.source_kind === 'exclusion_reason' ||
        record.source_kind === 'recency_band' ||
        record.source_kind === 'volume_band' ||
        record.source_kind === 'materialized_partition'
          ? record.source_kind
          : null
      const sourceKey = artifactText(record.source_key)
      const unitRole =
        record.unit_role === 'subtype' ||
        record.unit_role === 'dominant_remainder' ||
        record.unit_role === 'spillover' ||
        record.unit_role === 'family_lane' ||
        record.unit_role === 'reason' ||
        record.unit_role === 'bounded_partition'
          ? record.unit_role
          : null
      if (!unitId || !label || !sourceKind || !sourceKey || !unitRole) return null
      return {
        unit_id: unitId,
        label,
        source_kind: sourceKind,
        source_key: sourceKey,
        sender_count: artifactInteger(record.sender_count),
        share_pct: artifactInteger(record.share_pct),
        unit_role: unitRole,
        decomposition_path: Array.isArray(record.decomposition_path)
          ? record.decomposition_path
              .map((entry) => artifactText(entry))
              .filter((entry): entry is string => entry != null)
          : undefined,
        publication_status:
          record.publication_status === 'materialized' ||
          record.publication_status === 'legacy_derived'
            ? record.publication_status
            : undefined,
      }
    })
    .filter(
      (entry): entry is ParsedArtifactCleanupGroupReviewUnit => entry != null
    )
}

function parseArtifactSharedSemanticRollup(
  value: unknown,
  clusterId?: string | null
): GmailSenderWorkspaceData['analytics']['semantic_rollup'] {
  const record = artifactRecord(value)
  if (!record) return null
  const groupPolicyMode = artifactSemanticGroupPolicyMode(record.group_policy_mode)
  const senderBasis = artifactRecord(record.sender_basis)
  const headline = artifactRecord(record.headline)
  const trust = artifactRecord(record.trust)
  const trustSummary = artifactRecord(trust?.summary)
  const completeness = artifactRecord(record.completeness)
  if (
    !groupPolicyMode ||
    !senderBasis ||
    !headline ||
    !trust ||
    !trustSummary ||
    !completeness
  ) {
    return null
  }
  const canonical = artifactBoolean(completeness.canonical)
  const runtimeRepairExpected = artifactBoolean(completeness.runtime_repair_expected)
  if (!canonical || runtimeRepairExpected) return null

  const familyDistribution = Array.isArray(record.family_distribution)
    ? record.family_distribution
        .map((entry) => {
          const lane = artifactRecord(entry)
          if (!lane) return null
          const family = artifactSemanticFamily(lane.family)
          const subtypePersistenceState = artifactSemanticSubtypePersistenceState(
            lane.subtype_persistence_state
          )
          if (!family || !subtypePersistenceState) return null
          return {
            family,
            sender_count: artifactInteger(lane.sender_count),
            share_pct: artifactInteger(lane.share_pct),
            umbrella: artifactBoolean(lane.umbrella),
            resolved_subtype_sender_count: artifactInteger(lane.resolved_subtype_sender_count),
            resolved_subtype_coverage_pct: artifactInteger(lane.resolved_subtype_coverage_pct),
            provisional_subtype_sender_count: artifactInteger(
              lane.provisional_subtype_sender_count
            ),
            provisional_subtype_coverage_pct: artifactInteger(
              lane.provisional_subtype_coverage_pct
            ),
            subtype_persistence_state: subtypePersistenceState,
            decomposition_review_required: artifactBoolean(lane.decomposition_review_required),
            top_subtypes: parseArtifactSemanticSubtypeEntries(lane.top_subtypes),
          }
        })
        .filter(
          (
            entry
          ): entry is NonNullable<GmailSenderWorkspaceData['analytics']['semantic_rollup']>['family_distribution'][number] =>
            entry != null
        )
    : []

  const patternDistribution = Array.isArray(record.pattern_distribution)
    ? record.pattern_distribution
        .map((entry) => {
          const lane = artifactRecord(entry)
          if (!lane) return null
          const patternClass = artifactSemanticPatternClass(lane.pattern_class)
          const subtypePersistenceState = artifactSemanticSubtypePersistenceState(
            lane.subtype_persistence_state
          )
          if (!patternClass || !subtypePersistenceState) return null
          return {
            pattern_class: patternClass,
            sender_count: artifactInteger(lane.sender_count),
            share_pct: artifactInteger(lane.share_pct),
            resolved_subtype_sender_count: artifactInteger(lane.resolved_subtype_sender_count),
            resolved_subtype_coverage_pct: artifactInteger(lane.resolved_subtype_coverage_pct),
            provisional_subtype_sender_count: artifactInteger(
              lane.provisional_subtype_sender_count
            ),
            provisional_subtype_coverage_pct: artifactInteger(
              lane.provisional_subtype_coverage_pct
            ),
            subtype_persistence_state: subtypePersistenceState,
            decomposition_review_required: artifactBoolean(lane.decomposition_review_required),
            top_subtypes: parseArtifactSemanticSubtypeEntries(lane.top_subtypes),
          }
        })
        .filter(
          (
            entry
          ): entry is NonNullable<GmailSenderWorkspaceData['analytics']['semantic_rollup']>['pattern_distribution'][number] =>
            entry != null
        )
    : []

  const surface = artifactRecord(record.surface)
  const promotion = artifactRecord(record.promotion)
  const promotionMetrics = artifactRecord(promotion?.metrics)
  const reviewUnitPlan = artifactRecord(record.review_unit_plan)

  return ensureSharedGroupSemanticRollupCompatibility({
    clusterId,
    rollup: {
      group_policy_mode: groupPolicyMode,
      sender_basis: {
        sender_count: artifactInteger(senderBasis.sender_count),
        message_count: artifactInteger(senderBasis.message_count),
        uncertain_sender_count: artifactInteger(senderBasis.uncertain_sender_count),
        uncertain_sender_share_pct: artifactInteger(senderBasis.uncertain_sender_share_pct),
      },
      headline: {
        dominant_semantic_family: artifactSemanticFamily(headline.dominant_semantic_family),
        dominant_semantic_pattern: artifactSemanticPatternClass(headline.dominant_semantic_pattern),
        family_subtype_persistence_state: artifactSemanticSubtypePersistenceState(
          headline.family_subtype_persistence_state
        ),
        pattern_subtype_persistence_state: artifactSemanticSubtypePersistenceState(
          headline.pattern_subtype_persistence_state
        ),
      },
      family_distribution: familyDistribution,
      pattern_distribution: patternDistribution,
      trust: {
        resolution_distribution: parseArtifactSemanticResolutionDistribution(
          trust.resolution_distribution
        ),
        confidence_distribution: parseArtifactSemanticConfidenceDistribution(
          trust.confidence_distribution
        ),
        provenance_distribution: parseArtifactSemanticProvenanceDistribution(
          trust.provenance_distribution
        ),
        umbrella_distribution: parseArtifactSemanticUmbrellaDistribution(trust.umbrella_distribution),
        summary: {
          family_clear_share_pct: artifactInteger(trustSummary.family_clear_share_pct),
          pattern_clear_share_pct: artifactInteger(trustSummary.pattern_clear_share_pct),
          family_low_confidence_share_pct: artifactInteger(
            trustSummary.family_low_confidence_share_pct
          ),
          pattern_low_confidence_share_pct: artifactInteger(
            trustSummary.pattern_low_confidence_share_pct
          ),
          family_umbrella_share_pct: artifactInteger(trustSummary.family_umbrella_share_pct),
          pattern_umbrella_share_pct: artifactInteger(trustSummary.pattern_umbrella_share_pct),
        },
      },
      surface: surface
        ? {
            tier: artifactCleanupGroupSurfaceTier(surface.tier) || undefined,
            kind: artifactCleanupGroupSurfaceKind(surface.kind) || undefined,
            visibility: artifactCleanupGroupSurfaceVisibility(surface.visibility) || undefined,
            top_level_rank:
              typeof surface.top_level_rank === 'number' ? surface.top_level_rank : undefined,
            canonical_cluster_id: artifactNullableText(surface.canonical_cluster_id) || undefined,
            legacy_cluster_ids: artifactStringArray(surface.legacy_cluster_ids),
            source_cluster_ids: artifactStringArray(surface.source_cluster_ids),
          }
        : null,
      promotion: promotion
        ? {
            status: artifactCleanupGroupPromotionStatus(promotion.status) || undefined,
            selected_axis:
              artifactCleanupGroupSemanticAxis(promotion.selected_axis) || undefined,
            reason_codes: artifactStringArray(promotion.reason_codes),
            operator_value_status:
              artifactCleanupGroupOperatorValueStatus(promotion.operator_value_status) ||
              undefined,
            metrics: promotionMetrics
              ? {
                  sender_count: artifactInteger(promotionMetrics.sender_count),
                  dominant_share_pct: artifactInteger(promotionMetrics.dominant_share_pct),
                  clear_share_pct: artifactInteger(promotionMetrics.clear_share_pct),
                  actionable_review_unit_count: artifactInteger(
                    promotionMetrics.actionable_review_unit_count
                  ),
                  largest_review_unit_sender_count: artifactInteger(
                    promotionMetrics.largest_review_unit_sender_count
                  ),
                }
              : undefined,
          }
        : null,
      review_unit_plan: reviewUnitPlan
        ? {
            required: artifactBoolean(reviewUnitPlan.required),
            basis: artifactCleanupGroupReviewUnitBasis(reviewUnitPlan.basis) || undefined,
            trigger_reason: artifactNullableText(reviewUnitPlan.trigger_reason),
            units: parseArtifactCleanupGroupReviewUnits(reviewUnitPlan.units),
          }
        : null,
      completeness: {
        canonical: true,
        runtime_repair_expected: false,
      },
    },
  })
}

function parseArtifactAnalytics(
  header: GmailSenderWorkspaceSeedHeaderRow | null
): GmailSenderWorkspaceData['analytics'] {
  const analytics = artifactRecord(header?.analytics) || {}
  const parsedSemanticRollup = parseArtifactSharedSemanticRollup(
    analytics.semantic_rollup,
    header?.cluster_id || null
  )
  const mirroredSemanticFields = parsedSemanticRollup
    ? buildMirroredSemanticArtifactFieldsFromRollup(parsedSemanticRollup, {
        clusterId: header?.cluster_id || null,
      })
    : null

  return {
    sender_category_distribution: Array.isArray(analytics.sender_category_distribution)
      ? analytics.sender_category_distribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const label = artifactText(record.label)
            if (!label) return null
            return {
              label,
              sender_count: artifactInteger(record.sender_count),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['sender_category_distribution'][number] =>
              entry != null
          )
      : [],
    cleanup_group_surface_tier:
      mirroredSemanticFields?.cleanup_group_surface_tier ||
      (artifactNullableText(analytics.cleanup_group_surface_tier) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_surface_tier']
        | null),
    cleanup_group_surface_kind:
      mirroredSemanticFields?.cleanup_group_surface_kind ||
      (artifactNullableText(analytics.cleanup_group_surface_kind) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_surface_kind']
        | null),
    cleanup_group_surface_visibility:
      mirroredSemanticFields?.cleanup_group_surface_visibility ||
      (artifactNullableText(analytics.cleanup_group_surface_visibility) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_surface_visibility']
        | null),
    cleanup_group_top_level_rank:
      mirroredSemanticFields?.cleanup_group_top_level_rank ??
      (typeof analytics.cleanup_group_top_level_rank === 'number'
        ? analytics.cleanup_group_top_level_rank
        : null),
    cleanup_group_canonical_cluster_id:
      mirroredSemanticFields?.cleanup_group_canonical_cluster_id ||
      artifactNullableText(analytics.cleanup_group_canonical_cluster_id),
    cleanup_group_legacy_cluster_ids:
      mirroredSemanticFields?.cleanup_group_legacy_cluster_ids ||
      artifactStringArray(analytics.cleanup_group_legacy_cluster_ids),
    cleanup_group_source_cluster_ids:
      mirroredSemanticFields?.cleanup_group_source_cluster_ids ||
      artifactStringArray(analytics.cleanup_group_source_cluster_ids),
    cleanup_group_promotion_status:
      mirroredSemanticFields?.cleanup_group_promotion_status ||
      (artifactNullableText(analytics.cleanup_group_promotion_status) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_promotion_status']
        | null),
    cleanup_group_selected_semantic_axis:
      mirroredSemanticFields?.cleanup_group_selected_semantic_axis ||
      (artifactNullableText(analytics.cleanup_group_selected_semantic_axis) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_selected_semantic_axis']
        | null),
    cleanup_group_operator_value_status:
      mirroredSemanticFields?.cleanup_group_operator_value_status ||
      (artifactNullableText(analytics.cleanup_group_operator_value_status) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_operator_value_status']
        | null),
    cleanup_group_review_units_required:
      typeof mirroredSemanticFields?.cleanup_group_review_units_required === 'boolean'
        ? mirroredSemanticFields.cleanup_group_review_units_required
        : analytics.cleanup_group_review_units_required === true,
    cleanup_group_review_unit_basis:
      mirroredSemanticFields?.cleanup_group_review_unit_basis ||
      (artifactNullableText(analytics.cleanup_group_review_unit_basis) as
        | GmailSenderWorkspaceData['analytics']['cleanup_group_review_unit_basis']
        | null),
    cleanup_group_review_unit_count:
      mirroredSemanticFields?.cleanup_group_review_unit_count ??
      (typeof analytics.cleanup_group_review_unit_count === 'number'
        ? analytics.cleanup_group_review_unit_count
        : null),
    cleanup_group_demotion_reasons:
      mirroredSemanticFields?.cleanup_group_demotion_reasons ||
      artifactStringArray(analytics.cleanup_group_demotion_reasons),
    semantic_rollup_schema_version: parsedSemanticRollup
      ? artifactSemanticRollupSchemaVersion(analytics.semantic_rollup_schema_version)
      : null,
    semantic_rollup_hash: parsedSemanticRollup ? artifactNullableText(analytics.semantic_rollup_hash) : null,
    semantic_rollup: parsedSemanticRollup,
    semantic_family_distribution:
      mirroredSemanticFields?.semantic_family_distribution ||
      parseArtifactSemanticFamilyDistribution(analytics.semantic_family_distribution),
    semantic_pattern_distribution:
      mirroredSemanticFields?.semantic_pattern_distribution ||
      parseArtifactSemanticPatternDistribution(analytics.semantic_pattern_distribution),
    semantic_resolution_distribution:
      mirroredSemanticFields?.semantic_resolution_distribution ||
      parseArtifactSemanticResolutionDistribution(analytics.semantic_resolution_distribution),
    semantic_confidence_distribution:
      mirroredSemanticFields?.semantic_confidence_distribution ||
      parseArtifactSemanticConfidenceDistribution(analytics.semantic_confidence_distribution),
    semantic_provenance_distribution:
      mirroredSemanticFields?.semantic_provenance_distribution ||
      parseArtifactSemanticProvenanceDistribution(analytics.semantic_provenance_distribution),
    semantic_umbrella_distribution:
      mirroredSemanticFields?.semantic_umbrella_distribution ||
      parseArtifactSemanticUmbrellaDistribution(analytics.semantic_umbrella_distribution),
    operator_profile_family_distribution: Array.isArray(analytics.operator_profile_family_distribution)
      ? analytics.operator_profile_family_distribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const family = artifactOperatorProfileFamily(record.family)
            if (!family) return null
            return {
              family,
              sender_count: artifactInteger(record.sender_count),
              share_pct: artifactInteger(record.share_pct),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['operator_profile_family_distribution'][number] =>
              entry != null
          )
      : [],
    dominant_pattern_distribution: Array.isArray(analytics.dominant_pattern_distribution)
      ? analytics.dominant_pattern_distribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const pattern = artifactText(record.pattern)
            if (!pattern) return null
            return {
              pattern,
              sender_count: artifactInteger(record.sender_count),
              share_pct: artifactInteger(record.share_pct),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['dominant_pattern_distribution'][number] =>
              entry != null
          )
      : [],
    operator_profile_mode_distribution: Array.isArray(analytics.operator_profile_mode_distribution)
      ? analytics.operator_profile_mode_distribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const mode = artifactOperatorProfileMode(record.mode)
            if (!mode) return null
            return {
              mode,
              sender_count: artifactInteger(record.sender_count),
              share_pct: artifactInteger(record.share_pct),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'][number] =>
              entry != null
          )
      : [],
    category_summary_source_distribution: Array.isArray(analytics.category_summary_source_distribution)
      ? analytics.category_summary_source_distribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const source = artifactCategorySummarySource(record.source)
            if (!source) return null
            return {
              source,
              sender_count: artifactInteger(record.sender_count),
              share_pct: artifactInteger(record.share_pct),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['category_summary_source_distribution'][number] =>
              entry != null
          )
      : [],
    sender_activity_timeline: Array.isArray(analytics.sender_activity_timeline)
      ? analytics.sender_activity_timeline.flatMap((entry) => {
          const record = artifactRecord(entry)
          if (!record) return []
          const label = artifactText(record.label)
          if (!label) return []
          if (artifactText(record.contract_version) !== 'ace046_phase3_timeline_v1') return []
          const timeZone = artifactText(record.time_zone) || 'UTC'
          const grouping =
            record.grouping === 'hour' ||
            record.grouping === 'day' ||
            record.grouping === 'week' ||
            record.grouping === 'month'
              ? record.grouping
              : 'month'
          const timelineEntry: GmailSenderWorkspaceData['analytics']['sender_activity_timeline'][number] = {
            label,
            count: artifactInteger(record.count, artifactInteger(record.sender_count)),
            sender_count: artifactInteger(record.sender_count),
            message_count:
              record.message_count == null ? null : artifactInteger(record.message_count),
            bucket_start_iso: artifactText(record.bucket_start_iso) || null,
            bucket_end_exclusive_iso: artifactText(record.bucket_end_exclusive_iso) || null,
            contract_version: 'ace046_phase3_timeline_v1',
            metric_family: 'sender_activity',
            scope_key: normalizeMailboxProfileScope(artifactText(record.scope_key) || 'all_indexed'),
            grouping,
            time_zone: timeZone,
            source_dataset: 'gmail_index_rows',
            filter_contract: {
              source_dataset: 'gmail_index_rows',
              time_zone: timeZone,
              coverage_start_at: artifactText(record.bucket_start_iso) || null,
              coverage_end_at: artifactText(record.bucket_end_exclusive_iso) || null,
              allowed_sender_key_count: null,
            },
          }
          return [timelineEntry]
        })
      : [],
    sender_activity_timeline_granularity:
      analytics.sender_activity_timeline_granularity === 'hour'
        ? 'hour'
        : analytics.sender_activity_timeline_granularity === 'day'
        ? 'day'
        : analytics.sender_activity_timeline_granularity === 'week'
          ? 'week'
          : 'month',
    cluster_contribution: Array.isArray(analytics.cluster_contribution)
      ? analytics.cluster_contribution
          .map((entry) => {
            const record = artifactRecord(entry)
            if (!record) return null
            const sender = artifactText(record.sender)
            const senderKey = artifactText(record.sender_key)
            if (!sender || !senderKey) return null
            return {
              sender,
              sender_key: senderKey,
              message_count: artifactInteger(record.message_count),
              share_pct: artifactInteger(record.share_pct),
            }
          })
          .filter(
            (
              entry
            ): entry is GmailSenderWorkspaceData['analytics']['cluster_contribution'][number] =>
              entry != null
          )
      : [],
  }
}

type ResolvedSemanticArtifactState = {
  source:
    | 'persisted_rollup'
    | 'local_legacy_semantics'
    | 'sibling_persisted_rollup'
    | 'sibling_legacy_semantics'
    | 'compatibility_recomputed'
    | 'unresolved'
  semantic_rollup_schema_version: number | null
  semantic_rollup_hash: string | null
  semantic_rollup: GmailSenderWorkspaceData['analytics']['semantic_rollup']
  dominant_semantic_family: GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_family']
  dominant_semantic_pattern: GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_pattern']
  uncertain_sender_count: number
  semantic_family_distribution: GmailSenderWorkspaceData['analytics']['semantic_family_distribution']
  semantic_pattern_distribution: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution']
  semantic_resolution_distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution']
  semantic_confidence_distribution: GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution']
  semantic_provenance_distribution: GmailSenderWorkspaceData['analytics']['semantic_provenance_distribution']
  semantic_umbrella_distribution: GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution']
}

function semanticAnalyticsComplete(
  analytics: Pick<
    GmailSenderWorkspaceData['analytics'],
    | 'semantic_family_distribution'
    | 'semantic_pattern_distribution'
    | 'semantic_resolution_distribution'
    | 'semantic_confidence_distribution'
    | 'semantic_provenance_distribution'
    | 'semantic_umbrella_distribution'
  >
): boolean {
  return (
    analytics.semantic_family_distribution.length > 0 &&
    analytics.semantic_pattern_distribution.length > 0 &&
    analytics.semantic_resolution_distribution.length > 0 &&
    analytics.semantic_confidence_distribution.length > 0 &&
    analytics.semantic_provenance_distribution.length > 0 &&
    analytics.semantic_umbrella_distribution.length > 0
  )
}

function resolvedSemanticArtifactStateFromRollup(params: {
  source: ResolvedSemanticArtifactState['source']
  schemaVersion: number | null
  hash: string | null
  rollup: NonNullable<GmailSenderWorkspaceData['analytics']['semantic_rollup']>
  clusterId?: string | null
}): ResolvedSemanticArtifactState {
  const compatibleRollup = ensureSharedGroupSemanticRollupCompatibility({
    rollup: params.rollup,
    clusterId: params.clusterId,
  })
  const mirrors = buildMirroredSemanticArtifactFieldsFromRollup(compatibleRollup, {
    clusterId: params.clusterId,
  })
  return {
    source: params.source,
    semantic_rollup_schema_version: params.schemaVersion,
    semantic_rollup_hash: params.hash,
    semantic_rollup: compatibleRollup,
    dominant_semantic_family: mirrors.dominant_semantic_family,
    dominant_semantic_pattern: mirrors.dominant_semantic_pattern,
    uncertain_sender_count: mirrors.uncertain_sender_count,
    semantic_family_distribution: mirrors.semantic_family_distribution,
    semantic_pattern_distribution: mirrors.semantic_pattern_distribution,
    semantic_resolution_distribution: mirrors.semantic_resolution_distribution,
    semantic_confidence_distribution: mirrors.semantic_confidence_distribution,
    semantic_provenance_distribution: mirrors.semantic_provenance_distribution,
    semantic_umbrella_distribution: mirrors.semantic_umbrella_distribution,
  }
}

function resolveSemanticArtifactState(params: {
  clusterId: string
  senderCount: number
  messageCount: number
  localAnalytics: GmailSenderWorkspaceData['analytics']
  siblingAnalytics?: GmailSenderWorkspaceData['analytics'] | null
  recomputedSemanticAnalytics?: Pick<
    GmailSenderWorkspaceData['analytics'],
    | 'semantic_family_distribution'
    | 'semantic_pattern_distribution'
    | 'semantic_resolution_distribution'
    | 'semantic_confidence_distribution'
    | 'semantic_provenance_distribution'
    | 'semantic_umbrella_distribution'
  > | null
}): ResolvedSemanticArtifactState {
  if (params.localAnalytics.semantic_rollup) {
    return resolvedSemanticArtifactStateFromRollup({
      source: 'persisted_rollup',
      schemaVersion: params.localAnalytics.semantic_rollup_schema_version,
      hash: params.localAnalytics.semantic_rollup_hash,
      rollup: params.localAnalytics.semantic_rollup,
      clusterId: params.clusterId,
    })
  }

  if (semanticAnalyticsComplete(params.localAnalytics)) {
    const synthesized = buildPersistedSemanticRollupArtifactFields({
      clusterId: params.clusterId,
      senderCount: params.senderCount,
      messageCount: params.messageCount,
      semanticAnalytics: params.localAnalytics,
    })
    return {
      source: 'local_legacy_semantics',
      semantic_rollup_schema_version: synthesized.semantic_rollup_schema_version,
      semantic_rollup_hash: synthesized.semantic_rollup_hash,
      semantic_rollup: synthesized.semantic_rollup,
      dominant_semantic_family: synthesized.dominant_semantic_family,
      dominant_semantic_pattern: synthesized.dominant_semantic_pattern,
      uncertain_sender_count: synthesized.uncertain_sender_count,
      semantic_family_distribution: synthesized.semantic_family_distribution,
      semantic_pattern_distribution: synthesized.semantic_pattern_distribution,
      semantic_resolution_distribution: synthesized.semantic_resolution_distribution,
      semantic_confidence_distribution: synthesized.semantic_confidence_distribution,
      semantic_provenance_distribution: synthesized.semantic_provenance_distribution,
      semantic_umbrella_distribution: synthesized.semantic_umbrella_distribution,
    }
  }

  if (params.siblingAnalytics?.semantic_rollup) {
    return resolvedSemanticArtifactStateFromRollup({
      source: 'sibling_persisted_rollup',
      schemaVersion: params.siblingAnalytics.semantic_rollup_schema_version,
      hash: params.siblingAnalytics.semantic_rollup_hash,
      rollup: params.siblingAnalytics.semantic_rollup,
      clusterId: params.clusterId,
    })
  }

  if (params.siblingAnalytics && semanticAnalyticsComplete(params.siblingAnalytics)) {
    const synthesized = buildPersistedSemanticRollupArtifactFields({
      clusterId: params.clusterId,
      senderCount: params.senderCount,
      messageCount: params.messageCount,
      semanticAnalytics: params.siblingAnalytics,
    })
    return {
      source: 'sibling_legacy_semantics',
      semantic_rollup_schema_version: synthesized.semantic_rollup_schema_version,
      semantic_rollup_hash: synthesized.semantic_rollup_hash,
      semantic_rollup: synthesized.semantic_rollup,
      dominant_semantic_family: synthesized.dominant_semantic_family,
      dominant_semantic_pattern: synthesized.dominant_semantic_pattern,
      uncertain_sender_count: synthesized.uncertain_sender_count,
      semantic_family_distribution: synthesized.semantic_family_distribution,
      semantic_pattern_distribution: synthesized.semantic_pattern_distribution,
      semantic_resolution_distribution: synthesized.semantic_resolution_distribution,
      semantic_confidence_distribution: synthesized.semantic_confidence_distribution,
      semantic_provenance_distribution: synthesized.semantic_provenance_distribution,
      semantic_umbrella_distribution: synthesized.semantic_umbrella_distribution,
    }
  }

  if (params.recomputedSemanticAnalytics && semanticAnalyticsComplete(params.recomputedSemanticAnalytics)) {
    const synthesized = buildPersistedSemanticRollupArtifactFields({
      clusterId: params.clusterId,
      senderCount: params.senderCount,
      messageCount: params.messageCount,
      semanticAnalytics: params.recomputedSemanticAnalytics,
    })
    return {
      source: 'compatibility_recomputed',
      semantic_rollup_schema_version: synthesized.semantic_rollup_schema_version,
      semantic_rollup_hash: synthesized.semantic_rollup_hash,
      semantic_rollup: synthesized.semantic_rollup,
      dominant_semantic_family: synthesized.dominant_semantic_family,
      dominant_semantic_pattern: synthesized.dominant_semantic_pattern,
      uncertain_sender_count: synthesized.uncertain_sender_count,
      semantic_family_distribution: synthesized.semantic_family_distribution,
      semantic_pattern_distribution: synthesized.semantic_pattern_distribution,
      semantic_resolution_distribution: synthesized.semantic_resolution_distribution,
      semantic_confidence_distribution: synthesized.semantic_confidence_distribution,
      semantic_provenance_distribution: synthesized.semantic_provenance_distribution,
      semantic_umbrella_distribution: synthesized.semantic_umbrella_distribution,
    }
  }

  return {
    source: 'unresolved',
    semantic_rollup_schema_version: params.localAnalytics.semantic_rollup_schema_version,
    semantic_rollup_hash: params.localAnalytics.semantic_rollup_hash,
    semantic_rollup: params.localAnalytics.semantic_rollup,
    dominant_semantic_family: null,
    dominant_semantic_pattern: null,
    uncertain_sender_count: 0,
    semantic_family_distribution: params.localAnalytics.semantic_family_distribution,
    semantic_pattern_distribution: params.localAnalytics.semantic_pattern_distribution,
    semantic_resolution_distribution: params.localAnalytics.semantic_resolution_distribution,
    semantic_confidence_distribution: params.localAnalytics.semantic_confidence_distribution,
    semantic_provenance_distribution: params.localAnalytics.semantic_provenance_distribution,
    semantic_umbrella_distribution: params.localAnalytics.semantic_umbrella_distribution,
  }
}

function resolveArtifactCategoryProfile(params: {
  statsRow: GmailSenderWorkspaceArtifactStatsRow | null
  seedPayload: Record<string, unknown>
}) {
  if (params.statsRow) {
    return buildCanonicalSenderCategorySummary({
      category_distribution: params.statsRow.category_distribution,
      categorized_message_count: params.statsRow.categorized_message_count,
      uncategorized_message_count: params.statsRow.uncategorized_message_count,
      multi_category_message_count: params.statsRow.multi_category_message_count,
      dominant_category: params.statsRow.dominant_category,
      dominant_category_confidence: params.statsRow.dominant_category_confidence,
      category_profile_mode: params.statsRow.category_profile_mode,
    })
  }

  const fallback = insufficientDataCanonicalSenderProfile()
  const seededSummary = artifactNullableText(params.seedPayload.category_summary)
  return seededSummary
    ? {
        ...fallback,
        category_summary: seededSummary,
        category_summary_source: 'selected_cluster_row_categories' as const,
      }
    : fallback
}

function resolveArtifactOperatorProfile(params: {
  statsRow: GmailSenderWorkspaceArtifactStatsRow | null
  seedPayload: Record<string, unknown>
}) {
  if (params.statsRow) {
    return {
      operator_profile_family: params.statsRow.operator_profile_family,
      operator_profile_mode: params.statsRow.operator_profile_mode,
      operator_profile_confidence: params.statsRow.operator_profile_confidence,
      operator_profile_summary: params.statsRow.operator_profile_summary,
      operator_profile_reasons: Array.isArray(params.statsRow.operator_profile_reasons)
        ? params.statsRow.operator_profile_reasons
        : [],
      operator_profile_source: params.statsRow.operator_profile_source,
    }
  }

  const fallback = insufficientDataOperatorProfile()
  return {
    operator_profile_family:
      artifactOperatorProfileFamily(params.seedPayload.operator_profile_family) ||
      fallback.operator_profile_family,
    operator_profile_mode:
      artifactOperatorProfileMode(params.seedPayload.operator_profile_mode) ||
      fallback.operator_profile_mode,
    operator_profile_confidence:
      artifactDominantCategoryConfidence(params.seedPayload.operator_profile_confidence) ??
      fallback.operator_profile_confidence,
    operator_profile_summary:
      artifactNullableText(params.seedPayload.operator_profile_summary) || fallback.operator_profile_summary,
    operator_profile_reasons:
      artifactStringArray(params.seedPayload.operator_profile_reasons).length > 0
        ? artifactStringArray(params.seedPayload.operator_profile_reasons)
        : fallback.operator_profile_reasons,
    operator_profile_source:
      artifactOperatorProfileSource(params.seedPayload.operator_profile_source) ||
      fallback.operator_profile_source,
  }
}

function resolveArtifactSemantics(params: {
  sender: string
  statsRow: GmailSenderWorkspaceArtifactStatsRow | null
  seedPayload: Record<string, unknown>
  categoryProfile: ReturnType<typeof insufficientDataCanonicalSenderProfile>
  operatorProfile: ReturnType<typeof insufficientDataOperatorProfile>
  previewMessages: GmailCleanupPreviewMessage[]
}) {
  const persistedSemanticFamily = parsePersistedArtifactSemanticFamily(
    params.seedPayload.semantic_family
  )
  const persistedSemanticPattern = parsePersistedArtifactSemanticPattern(
    params.seedPayload.semantic_pattern
  )
  if (persistedSemanticFamily && persistedSemanticPattern) {
    return {
      semantic_family: persistedSemanticFamily,
      semantic_pattern: persistedSemanticPattern,
    }
  }

  const patternMix =
    params.statsRow?.pattern_mix?.length && Array.isArray(params.statsRow.pattern_mix)
      ? normalizePatternMix(params.statsRow.pattern_mix)
      : normalizePatternMix(params.seedPayload.pattern_mix)
  const dominantPattern =
    params.statsRow?.dominant_pattern ||
    artifactNullableText(params.seedPayload.dominant_pattern) ||
    GMAIL_PATTERN_LABEL_THIN_HISTORY
  const totalMessageCount =
    params.statsRow?.message_count ??
    (typeof params.seedPayload.total_sender_messages === 'number' &&
    Number.isFinite(params.seedPayload.total_sender_messages)
      ? Math.max(0, Math.round(params.seedPayload.total_sender_messages))
      : params.previewMessages.length)
  const machineProbability =
    params.statsRow?.machine_probability ??
    (typeof params.seedPayload.machine_probability === 'number' &&
    Number.isFinite(params.seedPayload.machine_probability)
      ? params.seedPayload.machine_probability
      : null)
  const humanProbability =
    params.statsRow?.human_probability ??
    (typeof params.seedPayload.human_probability === 'number' &&
    Number.isFinite(params.seedPayload.human_probability)
      ? params.seedPayload.human_probability
      : null)

  return resolveSenderSemanticsFromCompatibility({
    sender: params.sender,
    subjectHints: params.previewMessages.map((message) => message.subject || ''),
    totalMessageCount,
    categoryProfile: params.categoryProfile,
    patternMix,
    dominantPattern,
    operatorProfile: params.operatorProfile,
    machineProbability,
    humanProbability,
    sourceKind: params.statsRow ? 'sender_stats' : 'artifact_seed',
  })
}

function resolveArtifactSenderSignal(params: {
  statsRow: GmailSenderWorkspaceArtifactStatsRow | null
  seedPayload: Record<string, unknown>
}): GmailSenderWorkspaceData['senders'][number]['sender_signal'] {
  if (params.statsRow) {
    if ((params.statsRow.human_probability || 0) >= 0.65) return 'likely_human'
    if ((params.statsRow.machine_probability || 0) >= 0.65) return 'likely_machine_generated'
  }
  const seeded = artifactNullableText(params.seedPayload.sender_signal)
  return seeded === 'likely_machine_generated' || seeded === 'likely_human' ? seeded : 'uncertain'
}

function buildArtifactPreviewMessages(rows: GmailPreviewIndexRow[]): GmailCleanupPreviewMessage[] {
  return rows.map((row) => ({
    message_id: row.message_id,
    thread_id: row.thread_id || undefined,
    internal_date_ms:
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : undefined,
    subject: row.subject,
    from: row.sender,
    date: row.date,
    snippet: row.snippet,
    label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
    category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
    is_in_inbox: row.is_in_inbox,
    is_unread: row.is_unread,
    is_important: row.is_important,
    is_starred: row.is_starred,
  }))
}

function materializeArtifactSenderWorkspaceSender(params: {
  row: GmailSenderWorkspaceSeedRow
  statsBySenderKey: Map<string, GmailSenderWorkspaceArtifactStatsRow>
  previewMessages?: GmailCleanupPreviewMessage[]
  preferSeedTimelineTimestamps?: boolean
}): GmailSenderWorkspaceData['senders'][number] {
  const seedPayload = artifactRecord(params.row.seed_payload) || {}
  const statsRow =
    params.statsBySenderKey.get(normalizeSender(params.row.sender) || params.row.sender_key) || null
  const previewMessages = params.previewMessages || []
  const categoryProfile = resolveArtifactCategoryProfile({
    statsRow,
    seedPayload,
  })
  const operatorProfile = resolveArtifactOperatorProfile({
    statsRow,
    seedPayload,
  })
  const semantic = resolveArtifactSemantics({
    sender: params.row.sender,
    statsRow,
    seedPayload,
    categoryProfile,
    operatorProfile,
    previewMessages,
  })
  const dominantPattern =
    statsRow?.dominant_pattern ||
    artifactNullableText(seedPayload.dominant_pattern) ||
    GMAIL_PATTERN_LABEL_THIN_HISTORY
  const patternMix =
    statsRow?.pattern_mix?.length && Array.isArray(statsRow.pattern_mix)
      ? normalizePatternMix(statsRow.pattern_mix)
      : normalizePatternMix(seedPayload.pattern_mix)

  return {
    sender: params.row.sender,
    sender_key: params.row.sender_key,
    sender_domain: params.row.sender_domain,
    cleanup_group_message_count: params.row.cleanup_group_message_count,
    total_sender_messages:
      statsRow?.message_count ??
      (typeof seedPayload.total_sender_messages === 'number' &&
      Number.isFinite(seedPayload.total_sender_messages)
        ? Math.max(0, Math.round(seedPayload.total_sender_messages))
        : null),
    unread_count: params.row.unread_count,
    last_activity: params.preferSeedTimelineTimestamps
      ? params.row.last_activity_at ||
        artifactNullableText(seedPayload.last_activity) ||
        statsRow?.last_seen ||
        null
      : statsRow?.last_seen || artifactNullableText(seedPayload.last_activity),
    first_seen: params.preferSeedTimelineTimestamps
      ? artifactNullableText(seedPayload.first_seen) || statsRow?.first_seen || null
      : statsRow?.first_seen || artifactNullableText(seedPayload.first_seen),
    category_distribution: categoryProfile.category_distribution,
    categorized_message_count: categoryProfile.categorized_message_count,
    uncategorized_message_count: categoryProfile.uncategorized_message_count,
    multi_category_message_count: categoryProfile.multi_category_message_count,
    dominant_category: categoryProfile.dominant_category,
    dominant_category_confidence: categoryProfile.dominant_category_confidence,
    category_profile_mode: categoryProfile.category_profile_mode,
    category_summary: categoryProfile.category_summary,
    category_summary_source: categoryProfile.category_summary_source,
    semantic_family: semantic.semantic_family,
    semantic_pattern: semantic.semantic_pattern,
    dominant_pattern: dominantPattern,
    pattern_mix: patternMix,
    operator_profile_family: operatorProfile.operator_profile_family,
    operator_profile_mode: operatorProfile.operator_profile_mode,
    operator_profile_confidence: operatorProfile.operator_profile_confidence,
    operator_profile_summary: operatorProfile.operator_profile_summary,
    operator_profile_reasons: operatorProfile.operator_profile_reasons,
    operator_profile_source: operatorProfile.operator_profile_source,
    sender_signal: resolveArtifactSenderSignal({ statsRow, seedPayload }),
    machine_probability:
      statsRow?.machine_probability ??
      (typeof seedPayload.machine_probability === 'number' &&
      Number.isFinite(seedPayload.machine_probability)
        ? seedPayload.machine_probability
        : null),
    human_probability:
      statsRow?.human_probability ??
      (typeof seedPayload.human_probability === 'number' &&
      Number.isFinite(seedPayload.human_probability)
        ? seedPayload.human_probability
        : null),
    protected_hint: params.row.protected_hint,
    requires_verification: params.row.requires_verification,
    verification_reasons: Array.isArray(params.row.verification_reasons)
      ? params.row.verification_reasons
      : [],
    preview_messages: previewMessages,
    learned_policy: null,
  }
}

async function loadSenderWorkspaceFromArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  requestedSelectedClusterId?: string | null
  page: number
  pageSize: number
  searchInput: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  reviewUnitId?: string | null
  includeClusterSenderKeys?: boolean
  previewEvidenceSenderKey?: string | null
  timeZone?: string | null
}): Promise<GmailArtifactSuccess<GmailSenderWorkspaceData> | ReturnType<typeof fail>> {
  const workspaceLoadStartedAt = Date.now()
  const outwardSelectedClusterId = params.selectedCluster.cluster_id
  const artifactSelectedClusterId = artifactClusterLookupId(params.selectedCluster)
  try {
    const availabilityFailure = await loadPublishedArtifactAvailabilityFailure(params)
    if (availabilityFailure) return availabilityFailure
    const semanticFocus = normalizeSenderWorkspaceSemanticFocus(params.semanticFocus)
    const reviewUnitId = artifactText(params.reviewUnitId)
    const defaultBoundedArtifactPageRead =
      params.page >= 1 &&
      params.searchInput === '' &&
      params.filter === 'all' &&
      params.sort === 'message_count' &&
      params.direction === 'desc' &&
      !semanticFocus &&
      !reviewUnitId
    const focusedSemanticArtifactPageRequested =
      params.page >= 1 &&
      params.searchInput === '' &&
      params.filter === 'all' &&
      semanticFocus != null
    const focusedReviewUnitArtifactPageRequested =
      params.page >= 1 &&
      params.searchInput === '' &&
      params.filter === 'all' &&
      reviewUnitId != null

    if (
      !defaultBoundedArtifactPageRead &&
      !focusedSemanticArtifactPageRequested &&
      !focusedReviewUnitArtifactPageRequested
    ) {
      return fail(409, 'This sender workspace query requires a bounded published-artifact index.', {
        reason: 'artifact_query_shape_unavailable',
        retryAfterMs: null,
      })
    }

    const artifactReadStartedAt = Date.now()
    let focusedSemanticArtifactPageRead = false
    let focusedReviewUnitArtifactPageRead = false
    const artifactRead = focusedReviewUnitArtifactPageRequested
      ? await (async () => {
          const reviewUnitRead = await loadPublishedGmailSenderWorkspaceArtifactReviewUnitPage({
            supabase: params.supabase,
            tenantId: params.tenantId,
            analysisScope: normalizeMailboxProfileScope(params.analysisScope),
            selectedClusterId: artifactSelectedClusterId,
            page: params.page,
            pageSize: params.pageSize,
            reviewUnitId,
            sort: params.sort,
            direction: params.direction,
            includeFocusedSenderKeys: params.includeClusterSenderKeys === true,
          })
          if (reviewUnitRead.focused_capability_available) {
            focusedReviewUnitArtifactPageRead = true
            focusedSemanticArtifactPageRead = true
            return reviewUnitRead
          }
          if (semanticFocus) {
            const legacyRead = await loadPublishedGmailSenderWorkspaceArtifactFocusedPage({
              supabase: params.supabase,
              tenantId: params.tenantId,
              analysisScope: normalizeMailboxProfileScope(params.analysisScope),
              selectedClusterId: artifactSelectedClusterId,
              page: params.page,
              pageSize: params.pageSize,
              semanticFocus,
              sort: params.sort,
              direction: params.direction,
            })
            focusedSemanticArtifactPageRead = legacyRead.focused_capability_available
            return legacyRead
          }
          return reviewUnitRead
        })()
      : defaultBoundedArtifactPageRead
        ? await loadPublishedGmailSenderWorkspaceArtifactPage({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: normalizeMailboxProfileScope(params.analysisScope),
          selectedClusterId: artifactSelectedClusterId,
          page: params.page,
          pageSize: params.pageSize,
        })
        : focusedSemanticArtifactPageRequested
        ? await (async () => {
            const focusedRead = await loadPublishedGmailSenderWorkspaceArtifactFocusedPage({
              supabase: params.supabase,
              tenantId: params.tenantId,
              analysisScope: normalizeMailboxProfileScope(params.analysisScope),
              selectedClusterId: artifactSelectedClusterId,
              page: params.page,
              pageSize: params.pageSize,
              semanticFocus,
              sort: params.sort,
              direction: params.direction,
            })
            if (focusedRead.focused_capability_available) {
              focusedSemanticArtifactPageRead = true
              return focusedRead
            }
            return focusedRead
          })()
          : await loadPublishedGmailSenderWorkspaceArtifactPage({
            supabase: params.supabase,
            tenantId: params.tenantId,
            analysisScope: normalizeMailboxProfileScope(params.analysisScope),
            selectedClusterId: artifactSelectedClusterId,
            page: params.page,
            pageSize: params.pageSize,
          })
    const artifactReadMs = Math.max(0, Date.now() - artifactReadStartedAt)

    if (
      focusedReviewUnitArtifactPageRead &&
      'focused_request_valid' in artifactRead &&
      artifactRead.focused_request_valid === false
    ) {
      return fail(409, 'The selected cleanup child is stale or unavailable.', {
        reason: 'invalid_review_unit_id',
        retryAfterMs: null,
      })
    }

    const publicationFailure = publishedArtifactAvailabilityFailure(artifactRead.publication)
    if (publicationFailure) return publicationFailure
    if (!artifactRead.publication) {
      return fail(503, 'Published Gmail runtime artifacts are unavailable.', {
        reason: 'missing_published_artifact',
        retryAfterMs: 15_000,
      })
    }
    if (!artifactRead.selected_header) {
      return fail(404, 'The selected cleanup group is unavailable in the published artifact.', {
        reason: 'missing_selected_cluster_seed',
        freshnessState: artifactRead.publication?.freshness_state ?? null,
        buildStatus: artifactRead.publication?.build_status ?? null,
        publishedVersion: artifactRead.publication?.published_version ?? null,
      })
    }
    const initialArtifactRowCount =
      artifactRead.headers.length +
      artifactRead.seed_rows.length +
      artifactRead.preview_index_rows.length
    const initialArtifactBudgetFailure = firstPaintArtifactBudgetFailure(initialArtifactRowCount)
    if (initialArtifactBudgetFailure) return initialArtifactBudgetFailure

    const clusterTotalSenders = artifactInteger(artifactRead.selected_header.sender_count)

    const clusterSenderKeysStartedAt = Date.now()
    const clusterSenderKeys =
      params.includeClusterSenderKeys === true &&
      focusedReviewUnitArtifactPageRead &&
      'focused_sender_keys' in artifactRead &&
      Array.isArray(artifactRead.focused_sender_keys)
        ? artifactRead.focused_sender_keys
        : params.includeClusterSenderKeys === true &&
            artifactRead.seed_rows.length >= clusterTotalSenders
          ? artifactRead.seed_rows.map((row) => row.sender_key)
          : null
    const statsLoadStartedAt = Date.now()
    const statsBySenderKey = new Map<string, GmailSenderWorkspaceArtifactStatsRow>()
    const clusterSenderKeysMs =
      defaultBoundedArtifactPageRead && params.includeClusterSenderKeys
        ? Math.max(0, Date.now() - clusterSenderKeysStartedAt)
        : 0
    const statsLoadMs = Math.max(0, Date.now() - statsLoadStartedAt)

    const previewGroupingStartedAt = Date.now()
    const previewRowsBySenderKey = new Map<string, GmailPreviewIndexRow[]>()
    for (const previewRow of artifactRead.preview_index_rows) {
      const current = previewRowsBySenderKey.get(previewRow.sender_key) || []
      current.push(previewRow)
      previewRowsBySenderKey.set(previewRow.sender_key, current)
    }
    let previewFallbackApplied = false
    let previewFallbackRowCount = 0
    const previewEvidenceSenderKey = artifactText(params.previewEvidenceSenderKey)
    if (previewEvidenceSenderKey && artifactRead.artifact_version) {
      const previewFallbackSeedRow =
        artifactRead.seed_rows.find((row) => row.sender_key === previewEvidenceSenderKey) || null
      const existingPreviewRows = previewRowsBySenderKey.get(previewEvidenceSenderKey) || []
      const previewFallbackMessageIds = previewFallbackSeedRow
        ? artifactStringArray(previewFallbackSeedRow.preview_message_ids)
        : []

      if (previewFallbackSeedRow && existingPreviewRows.length === 0 && previewFallbackMessageIds.length > 0) {
        const fallbackPreviewRows = await loadSenderWorkspaceArtifactPreviewRowsByMessageIds({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: params.analysisScope,
          artifactVersion: artifactRead.artifact_version,
          selectedClusterId: artifactSelectedClusterId,
          messageIds: previewFallbackMessageIds,
        })
        if (fallbackPreviewRows.length > 0) {
          previewFallbackApplied = true
          previewFallbackRowCount = fallbackPreviewRows.length
          for (const previewRow of fallbackPreviewRows) {
            const senderKeysForFallbackRow = Array.from(
              new Set([previewEvidenceSenderKey, previewRow.sender_key].filter(Boolean))
            )
            for (const senderKey of senderKeysForFallbackRow) {
              const current = previewRowsBySenderKey.get(senderKey) || []
              if (!current.some((existingRow) => existingRow.message_id === previewRow.message_id)) {
                current.push(previewRow)
              }
              previewRowsBySenderKey.set(senderKey, current)
            }
          }
        }
      }
    }
    const resolvedArtifactBudgetFailure = firstPaintArtifactBudgetFailure(
      initialArtifactRowCount + previewFallbackRowCount
    )
    if (resolvedArtifactBudgetFailure) return resolvedArtifactBudgetFailure
    const previewGroupingMs = Math.max(0, Date.now() - previewGroupingStartedAt)

    const senderMaterializationStartedAt = Date.now()
    const allSenders = artifactRead.seed_rows.map((row) =>
      materializeArtifactSenderWorkspaceSender({
        row,
        statsBySenderKey,
        previewMessages: buildArtifactPreviewMessages(previewRowsBySenderKey.get(row.sender_key) || []),
      })
    )
    // The accepted runtime path is page-bounded. It never enumerates sender scope rollups for the
    // whole artifact version; persisted header timeline truth is either usable as published or
    // reported unavailable below.
    const timelineArtifactSenders = allSenders
    const senderMaterializationMs = Math.max(0, Date.now() - senderMaterializationStartedAt)
    const timelineSelectedHeader = artifactRead.selected_header
    const parsedHeaderAnalytics = parseArtifactAnalytics(artifactRead.selected_header)
    const parsedTimelineHeaderAnalytics =
      timelineSelectedHeader === artifactRead.selected_header
        ? parsedHeaderAnalytics
        : parseArtifactAnalytics(timelineSelectedHeader)
    if (!parsedHeaderAnalytics.semantic_rollup) {
      return fail(503, 'Published semantic truth is unavailable for this cleanup group.', {
        reason: 'semantic_truth_unavailable',
        retryAfterMs: null,
        freshnessState: artifactRead.publication.freshness_state,
        buildStatus: artifactRead.publication.build_status,
        publishedVersion: artifactRead.publication.published_version,
        buildingVersion: artifactRead.publication.building_version,
      })
    }
    const resolvedSemanticState = resolveSemanticArtifactState({
      clusterId: params.selectedCluster.cluster_id,
      senderCount: clusterTotalSenders,
      messageCount: artifactInteger(artifactRead.selected_header.message_count),
      localAnalytics: parsedHeaderAnalytics,
      siblingAnalytics: null,
      recomputedSemanticAnalytics: null,
    })

    const filteredSenders = defaultBoundedArtifactPageRead || focusedSemanticArtifactPageRead
      ? allSenders
      : allSenders.filter((sender) =>
          senderMatchesWorkspaceFilters({
            sender,
            search: params.searchInput.toLowerCase(),
            filter: params.filter,
            semanticFocus,
          })
        )

    if (!defaultBoundedArtifactPageRead && !focusedSemanticArtifactPageRead) {
      filteredSenders.sort((left, right) => {
        let delta = 0
        if (params.sort === 'sender') {
          delta = left.sender.localeCompare(right.sender)
        } else if (params.sort === 'unread_count') {
          delta = left.unread_count - right.unread_count
        } else if (params.sort === 'last_activity') {
          delta =
            (Date.parse(left.last_activity || '') || 0) - (Date.parse(right.last_activity || '') || 0)
        } else {
          delta = left.cleanup_group_message_count - right.cleanup_group_message_count
        }
        if (delta === 0) delta = left.sender.localeCompare(right.sender)
        return params.direction === 'asc' ? delta : delta * -1
      })
    }

    const focusedTotalSenders =
      focusedSemanticArtifactPageRead &&
      'focused_total_senders' in artifactRead &&
      typeof artifactRead.focused_total_senders === 'number'
        ? artifactRead.focused_total_senders
        : null
    const totalSenders = defaultBoundedArtifactPageRead
      ? clusterTotalSenders
      : focusedSemanticArtifactPageRead
        ? focusedTotalSenders ?? filteredSenders.length
        : filteredSenders.length
    const totalPages = Math.max(1, Math.ceil(totalSenders / params.pageSize))
    const normalizedPage = Math.min(params.page, totalPages)
    const rangeStart = (normalizedPage - 1) * params.pageSize
    const senders = defaultBoundedArtifactPageRead || focusedSemanticArtifactPageRead
      ? allSenders
      : filteredSenders.slice(rangeStart, rangeStart + params.pageSize)
    const cleanupCandidateMessageCount = artifactRead.headers.reduce(
      (sum, header) => sum + artifactInteger(header.message_count),
      0
    )
    const persistedArtifactTimeContextTimeline = hasCanonicalPersistedSenderActivityTimeline({
      analysisScope: params.analysisScope,
      items: parsedTimelineHeaderAnalytics.sender_activity_timeline,
      expectedSenderTotal:
        params.analysisScope === 'all_indexed' ? clusterTotalSenders : timelineArtifactSenders.length,
    })
      ? {
          items: parsedTimelineHeaderAnalytics.sender_activity_timeline,
          granularity:
            parsedTimelineHeaderAnalytics.sender_activity_timeline_granularity || 'month',
        }
      : null
    // Runtime reads never reconstruct missing timeline truth from gmail_messages.
    // A canonical persisted timeline is served as-is; otherwise the field remains unavailable.
    const resolvedLaneATimeContextTimeline = persistedArtifactTimeContextTimeline

    console.info(
      `${GMAIL_SENDER_WORKSPACE_ARTIFACT_LOG_PREFIX} ${JSON.stringify({
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        selected_cluster_id: outwardSelectedClusterId,
        artifact_selected_cluster_id: artifactSelectedClusterId,
        artifact_version: artifactRead.artifact_version,
        mode: 'published_artifact',
        artifact_freshness_state: artifactRead.publication?.freshness_state ?? null,
        artifact_refresh_strategy: artifactRead.publication?.refresh_strategy ?? null,
        read_shape: defaultBoundedArtifactPageRead
          ? 'bounded_default_page'
          : focusedReviewUnitArtifactPageRead
            ? 'focused_review_unit_page'
          : focusedSemanticArtifactPageRead
            ? 'focused_semantic_page'
            : 'full_cluster_materialization',
        header_count: artifactRead.headers.length,
        seed_row_count: artifactRead.seed_rows.length,
        preview_row_count: artifactRead.preview_index_rows.length,
        stats_count: statsBySenderKey.size,
        cluster_sender_key_count: clusterSenderKeys?.length ?? null,
        cluster_sender_keys_source:
          clusterSenderKeys == null
            ? null
            : 'artifact_sender_key_read',
        semantic_resolution_source: resolvedSemanticState.source,
        include_cluster_sender_keys: params.includeClusterSenderKeys === true,
        semantic_focus: semanticFocus
          ? {
              family: semanticFocus.family,
              kind: semanticFocus.kind,
              subtype_key: semanticFocus.subtypeKey,
            }
          : null,
        review_unit_id: reviewUnitId,
        preview_evidence_sender_key: previewEvidenceSenderKey || null,
        preview_fallback_applied: previewFallbackApplied,
        preview_fallback_row_count: previewFallbackRowCount,
        aggregate_artifact_query_rows: initialArtifactRowCount + previewFallbackRowCount,
        preview_fetch_strategy: artifactRead.preview_fetch_strategy || 'message_id',
        requested_page: params.page,
        requested_page_size: params.pageSize,
        returned_sender_count: senders.length,
        artifact_read_ms: artifactReadMs,
        cluster_sender_keys_ms: clusterSenderKeysMs,
        stats_load_ms: statsLoadMs,
        preview_grouping_ms: previewGroupingMs,
        sender_materialization_ms: senderMaterializationMs,
        total_workspace_load_ms: Math.max(0, Date.now() - workspaceLoadStartedAt),
      })}`
    )

    return {
      ok: true,
      publication: artifactRead.publication,
      data: {
        analysis_scope: params.analysisScope,
        scope_ladder: buildScopeLadderCounts({
          wholeMailbox: artifactInteger(artifactRead.publication.last_indexed_message_count),
          cleanupCandidate: cleanupCandidateMessageCount,
          cleanupGroup: artifactInteger(artifactRead.selected_header.message_count),
          senderSet: totalSenders,
          loadedPreviewRows: senders.reduce((sum, sender) => sum + sender.preview_messages.length, 0),
        }),
        selected_cluster: {
          cluster_id: outwardSelectedClusterId,
          canonical_cluster_id: outwardSelectedClusterId,
          legacy_cluster_ids: dedupeArtifactStrings([
            ...(params.selectedCluster.legacy_cluster_ids || []),
            ...artifactStringArray(parsedHeaderAnalytics.cleanup_group_legacy_cluster_ids),
            artifactRead.selected_header.cluster_id,
          ]),
          cluster_type: artifactRead.selected_header.cluster_type,
          title: artifactRead.selected_header.title,
          query: artifactRead.selected_header.query,
          why_selected:
            artifactRead.selected_header.why_selected || params.selectedCluster.why_selected || 'Chosen from Cleanup Groups.',
          risk_note:
            artifactRead.selected_header.risk_note ||
            params.selectedCluster.risk_note ||
            'Confirm mixed senders before archive.',
          safety_note:
            artifactRead.selected_header.safety_note ||
            params.selectedCluster.safety_note ||
            'Messages remain in All Mail; only INBOX changes after approval.',
          message_count: artifactInteger(artifactRead.selected_header.message_count),
          sender_count: clusterTotalSenders,
          share_pct: artifactInteger(artifactRead.selected_header.share_pct),
          surface_tier: parsedHeaderAnalytics.cleanup_group_surface_tier || null,
          surface_kind: parsedHeaderAnalytics.cleanup_group_surface_kind || null,
          surface_visibility: parsedHeaderAnalytics.cleanup_group_surface_visibility || null,
          top_level_rank: parsedHeaderAnalytics.cleanup_group_top_level_rank ?? null,
        },
        senders,
        pagination: {
          page: normalizedPage,
          page_size: params.pageSize,
          total_senders: totalSenders,
          total_pages: totalPages,
          cluster_total_senders: clusterTotalSenders,
        },
        cluster_global: {
          sender_keys:
            params.includeClusterSenderKeys === true
              ? Array.isArray(clusterSenderKeys)
                ? clusterSenderKeys
                : defaultBoundedArtifactPageRead
                  ? []
                  : focusedSemanticArtifactPageRead
                    ? []
                    : allSenders.map((sender) => sender.sender_key)
              : [],
          sender_keys_complete:
            params.includeClusterSenderKeys === true &&
            (Array.isArray(clusterSenderKeys) ||
              (!defaultBoundedArtifactPageRead && !focusedSemanticArtifactPageRead)),
        },
        analytics: {
          ...parsedHeaderAnalytics,
          cleanup_group_canonical_cluster_id: outwardSelectedClusterId,
          cleanup_group_legacy_cluster_ids: dedupeArtifactStrings([
            ...artifactStringArray(parsedHeaderAnalytics.cleanup_group_legacy_cluster_ids),
            ...(params.selectedCluster.legacy_cluster_ids || []),
            artifactRead.selected_header.cluster_id,
          ]),
          sender_activity_timeline:
            resolvedLaneATimeContextTimeline?.items ||
            parsedTimelineHeaderAnalytics.sender_activity_timeline,
          sender_activity_timeline_granularity:
            resolvedLaneATimeContextTimeline?.granularity ||
            parsedTimelineHeaderAnalytics.sender_activity_timeline_granularity,
          semantic_rollup_schema_version: resolvedSemanticState.semantic_rollup_schema_version,
          semantic_rollup_hash: resolvedSemanticState.semantic_rollup_hash,
          semantic_rollup: resolvedSemanticState.semantic_rollup,
          semantic_family_distribution: resolvedSemanticState.semantic_family_distribution,
          semantic_pattern_distribution: resolvedSemanticState.semantic_pattern_distribution,
          semantic_resolution_distribution: resolvedSemanticState.semantic_resolution_distribution,
          semantic_confidence_distribution: resolvedSemanticState.semantic_confidence_distribution,
          semantic_provenance_distribution: resolvedSemanticState.semantic_provenance_distribution,
          semantic_umbrella_distribution: resolvedSemanticState.semantic_umbrella_distribution,
          operator_profile_family_distribution: buildCompatibilityOperatorProfileFamilyDistribution(
            resolvedSemanticState.semantic_family_distribution
          ),
          dominant_pattern_distribution: buildCompatibilityDominantPatternDistribution(
            resolvedSemanticState.semantic_pattern_distribution
          ),
          operator_profile_mode_distribution: buildCompatibilityOperatorProfileModeDistribution(
            resolvedSemanticState.semantic_resolution_distribution
          ),
        },
        view: {
          search: params.searchInput,
          filter: params.filter,
          sort: params.sort,
          direction: params.direction,
        },
        exceptions_count: allSenders.filter((sender) => sender.requires_verification).length,
        source: 'gmail_index_cache',
      },
    }
  } catch (error) {
    console.warn(`${GMAIL_SENDER_WORKSPACE_ARTIFACT_LOG_PREFIX} read failed closed:`, error)
    return fail(503, 'Published sender workspace artifacts could not be loaded.', {
      reason: 'artifact_read_error',
      retryAfterMs: 15_000,
    })
  }
}

async function loadSenderWorkspaceBaseState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  timeZone?: string | null
}): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const normalizedClusters = normalizeClusters(params.clusters)
  const normalizedSelectedCluster = normalizeClusters([params.selectedCluster])[0]
  const clusters = canonicalizeClusterCollection(
    normalizedSelectedCluster ? [...normalizedClusters, normalizedSelectedCluster] : normalizedClusters
  )
  const selectedCluster = normalizedSelectedCluster
    ? canonicalizeSelectedCluster({
        clusters: normalizedClusters,
        selectedCluster: normalizedSelectedCluster,
      })
    : null
  if (!selectedCluster) return fail(400, 'selected_cluster is required for sender workspace base state.')
  const coverageSnapshot = await loadMailboxCoverageSnapshot({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })

  const cacheKey = senderWorkspaceBaseCacheKey({
    mailboxSnapshotKey: coverageSnapshot.snapshot_key,
    clusters,
    selectedCluster,
    cacheVersion: params.cacheVersion,
    timeZone: params.timeZone,
  })
  const cached = senderWorkspaceBaseCache.get(cacheKey)
  if (cached && cached.expires_at_ms > Date.now()) {
    return { ok: true, data: cached.data }
  }

  const inflight = senderWorkspaceBaseInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> => {
    const fastPath = await tryBuildSenderWorkspaceBaseStateFastPath({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      selectedCluster,
      clusters,
      timeZone: params.timeZone,
    })
    if (fastPath?.ok) {
      senderWorkspaceBaseCache.set(cacheKey, {
        expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
        data: fastPath.data,
      })
      return { ok: true, data: fastPath.data }
    }
    if (fastPath && !fastPath.ok) return fastPath

    const workspace = await loadDerivedWorkspaceState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
      timeZone: params.timeZone,
    })
    if (!workspace.ok) return workspace

    const scopeMatchedSelectedClusterRows =
      workspace.data.matchedRowsByCluster
        .get(selectedCluster.cluster_id)
        ?.slice()
        .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)) || []
    let selectedClusterRows = scopeMatchedSelectedClusterRows

    if (analysisScope !== 'all_indexed' && selectedCluster.cluster_type === 'newsletters') {
      const parentSenderUniverse = await loadAllIndexedParentSenderUniverse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        selectedCluster,
        cacheVersion: params.cacheVersion ?? null,
      })
      const parentSenderUniverseKeys =
        parentSenderUniverse && parentSenderUniverse.senderKeys.length > 0
          ? new Set(parentSenderUniverse.senderKeys)
          : null

      if (parentSenderUniverseKeys) {
        const mailbox = await loadMailboxContext({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope,
          coverageSnapshot,
          timeZone: params.timeZone,
        })

        const reconstructedSelectedClusterRows = (mailbox.ok ? mailbox.data.scopedRows : [])
          .filter((row) => {
            const senderDisplay = rowSender(row) || row.sender || 'Unknown sender'
            const senderKey = normalizeSender(senderDisplay) || senderDisplay.trim().toLowerCase()
            return senderKey ? parentSenderUniverseKeys.has(senderKey) : false
          })
          .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))

        const selectedSenderCount = groupRowsBySender(selectedClusterRows).size
        const reconstructedSenderCount = groupRowsBySender(reconstructedSelectedClusterRows).size
        const selectedRowsAlreadyMatchParentUniverse =
          selectedClusterRows.length === reconstructedSelectedClusterRows.length &&
          selectedSenderCount === reconstructedSenderCount &&
          selectedClusterRows.every((row, index) => row.message_id === reconstructedSelectedClusterRows[index]?.message_id)

        if (!selectedRowsAlreadyMatchParentUniverse) {
          console.info(
            `${GMAIL_SENDER_UNIVERSE_GUARD_LOG_PREFIX} ${JSON.stringify({
              analysis_scope: analysisScope,
              selected_cluster_id: selectedCluster.cluster_id,
              source: 'derived_workspace_parent_universe_reconstruction',
              before_row_count: selectedClusterRows.length,
              after_row_count: reconstructedSelectedClusterRows.length,
              before_sender_count: selectedSenderCount,
              after_sender_count: reconstructedSenderCount,
              all_indexed_sender_total: parentSenderUniverse?.totalSenders ?? null,
              mailbox_scope_rows: mailbox.ok ? mailbox.data.scopedRows.length : null,
              status: 'applied_recent_newsletter_parent_universe_reconstruction',
            })}`
          )
          selectedClusterRows = reconstructedSelectedClusterRows
        }
      }
    }

    const built = await buildSenderWorkspaceBaseStateFromSelectedClusterRows({
      supabase: params.supabase,
      tenantId: params.tenantId,
      selectedClusterRows,
      cleanupCandidateMessageCount: workspace.data.candidateRows.length,
    })
    if (!built.ok) return built

    senderWorkspaceBaseCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data: built.data,
    })
    return built
  })()

  senderWorkspaceBaseInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    senderWorkspaceBaseInflight.delete(cacheKey)
  }
}

async function loadCanonicalTimeContextBaseState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  timeZone?: string | null
  scopedBase?: SenderWorkspaceBaseState | null
}): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> {
  if (params.analysisScope === 'all_indexed' && params.scopedBase) {
    return { ok: true, data: params.scopedBase }
  }

  return loadSenderWorkspaceBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: 'all_indexed',
    cacheVersion: params.cacheVersion ?? null,
    clusters: ensureSelectedClusterIncluded(params.clusters, params.selectedCluster),
    selectedCluster: params.selectedCluster,
    timeZone: params.timeZone ?? null,
  })
}

function latestPolicyForSender(
  senderPolicies: Record<string, GmailSenderPolicy>,
  senderKey: string
): GmailSenderPolicy {
  const value = senderPolicies[senderKey]
  return value || 'undecided'
}

function normalizeSenderWorkspaceFilter(value: unknown): GmailSenderWorkspaceFilter {
  return value === 'needs_verification' ||
    value === 'protected' ||
    value === 'likely_machine_generated' ||
    value === 'likely_human'
    ? value
    : 'all'
}

function normalizeSenderWorkspaceSort(value: unknown): GmailSenderWorkspaceSort {
  return value === 'sender' || value === 'unread_count' || value === 'last_activity'
    ? value
    : 'message_count'
}

function normalizeSenderWorkspaceSortDirection(value: unknown): GmailSenderWorkspaceSortDirection {
  return value === 'asc' ? 'asc' : 'desc'
}

function normalizeTimeContextBucketLabel(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeTimeContextBucketIso(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeSenderWorkspaceSemanticFocus(
  value: GmailSenderWorkspaceSemanticFocus | null | undefined
): GmailSenderWorkspaceSemanticFocus | null {
  if (!value) return null
  const family = artifactSemanticFamily(value.family)
  if (!family) return null
  const kind =
    value.kind === 'family' || value.kind === 'subtype' || value.kind === 'remainder'
      ? value.kind
      : null
  if (!kind) return null
  return {
    family,
    kind,
    subtypeKey:
      typeof value.subtypeKey === 'string' && value.subtypeKey.trim()
        ? value.subtypeKey.trim()
        : null,
    surfacedSubtypeKeys: Array.isArray(value.surfacedSubtypeKeys)
      ? value.surfacedSubtypeKeys
          .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          .map((entry) => entry.trim())
      : [],
  }
}

function senderDistributionSeedRowMatchesSemanticFocus(
  row: GmailSenderWorkspaceSeedRow,
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
): boolean {
  if (!semanticFocus) return true
  if (artifactNullableText(row.semantic_family_key) !== semanticFocus.family) return false

  if (semanticFocus.kind === 'family') return true

  const rowSubtypeKey = artifactNullableText(row.semantic_subtype_key)
  if (semanticFocus.kind === 'subtype') {
    return rowSubtypeKey === (semanticFocus.subtypeKey || null)
  }

  if (!rowSubtypeKey) return true
  return !semanticFocus.surfacedSubtypeKeys.includes(rowSubtypeKey)
}

function senderMatchesWorkspaceSemanticFocus(
  sender: GmailSenderWorkspaceData['senders'][number],
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
): boolean {
  if (!semanticFocus) return true
  if (sender.semantic_family.family !== semanticFocus.family) return false

  if (semanticFocus.kind === 'family') return true

  if (semanticFocus.kind === 'subtype') {
    if (!semanticFocus.subtypeKey) return false
    return sender.semantic_family.subtype_key === semanticFocus.subtypeKey
  }

  const senderSubtypeKey = sender.semantic_family.subtype_key
  if (!senderSubtypeKey) return true
  return !semanticFocus.surfacedSubtypeKeys.includes(senderSubtypeKey)
}

function senderMatchesWorkspaceFilters(params: {
  sender: GmailSenderWorkspaceData['senders'][number]
  search: string
  filter: GmailSenderWorkspaceFilter
  semanticFocus: GmailSenderWorkspaceSemanticFocus | null
}): boolean {
  const { sender, search, filter, semanticFocus } = params
  if (!senderMatchesWorkspaceSemanticFocus(sender, semanticFocus)) return false

  if (search) {
    const haystack = [
      sender.sender,
      sender.sender_domain || '',
      sender.category_summary,
      sender.dominant_pattern,
      sender.verification_reasons.join(' '),
      sender.sender_signal,
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }
  if (filter === 'needs_verification') return sender.requires_verification
  if (filter === 'protected') return Boolean(sender.protected_hint)
  if (filter === 'likely_machine_generated') return sender.sender_signal === 'likely_machine_generated'
  if (filter === 'likely_human') return sender.sender_signal === 'likely_human'
  return true
}

function buildMailboxSenderRanking(params: {
  scopedRows: GmailMailboxIndexRow[]
  candidateRows: GmailMailboxIndexRow[]
}): GmailMailboxIntelligenceData['sender_ranking'] {
  const nowMs = Date.now()
  const senderMap = new Map<
    string,
    {
      sender: string
      total: number
      candidate: number
      protected: number
      unread: number
      firstSeen: number | null
      lastSeen: number | null
      rows: GmailMailboxIndexRow[]
    }
  >()

  for (const row of params.scopedRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current =
      senderMap.get(senderKey) ||
      {
        sender,
        total: 0,
        candidate: 0,
        protected: 0,
        unread: 0,
        firstSeen: null,
        lastSeen: null,
        rows: [],
      }
    current.total += 1
    if (row.is_unread) current.unread += 1
    if (protectionLabel(row)) current.protected += 1
    current.rows.push(row)
    if (typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)) {
      current.firstSeen =
        current.firstSeen == null ? row.internal_date_ms : Math.min(current.firstSeen, row.internal_date_ms)
      current.lastSeen =
        current.lastSeen == null ? row.internal_date_ms : Math.max(current.lastSeen, row.internal_date_ms)
    }
    senderMap.set(senderKey, current)
  }

  for (const row of params.candidateRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = senderMap.get(senderKey)
    if (current) current.candidate += 1
  }

  return Array.from(senderMap.entries())
    .map(([senderKey, entry]) => {
      const decision = assignSenderCleanupGroupDecision({
        sender: entry.sender,
        rows: entry.rows,
        nowMs,
      })
      const cleanupCandidateMessageCount = decision.isCleanupCandidate
        ? Math.max(
            entry.candidate,
            entry.rows.filter((row) => row.is_in_inbox).length
          )
        : 0
      return {
        sender: entry.sender,
        sender_key: senderKey,
        assigned_cleanup_group_id: decision.groupSpec
          .cluster_id as GmailMailboxIntelligenceData['sender_ranking'][number]['assigned_cleanup_group_id'],
        assignment_reason: decision.assignmentReason,
        is_cleanup_candidate: decision.isCleanupCandidate,
        total_message_count: entry.total,
        cleanup_candidate_message_count: cleanupCandidateMessageCount,
        protected_message_count: entry.protected,
        unread_count: entry.unread,
        first_seen: entry.firstSeen != null ? new Date(entry.firstSeen).toISOString() : null,
        last_seen: entry.lastSeen != null ? new Date(entry.lastSeen).toISOString() : null,
        category_summary: topCategorySummary(entry.rows) || 'General updates',
        sender_signal: senderSignalFromText({
          sender: entry.sender,
          sampleText: `${entry.sender} ${entry.rows.find((row) => row.subject)?.subject || ''}`,
        }),
        cleanup_exclusion_reason: decision.exclusionReason,
      }
    })
    .sort(
      (a, b) =>
        b.cleanup_candidate_message_count - a.cleanup_candidate_message_count ||
        b.total_message_count - a.total_message_count ||
        a.sender.localeCompare(b.sender)
    )
}

function artifactIsoStringFromMs(value: number | null): string | null {
  return value != null && Number.isFinite(value) ? new Date(value).toISOString() : null
}

function artifactDateMs(value: unknown): number | null {
  const normalized = artifactNullableText(value)
  if (!normalized) return null
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseArtifactPressureTimelineComposition(
  value: unknown
): GmailPressureTimelineComposition[] {
  if (!Array.isArray(value)) return []
  const items: GmailPressureTimelineComposition[] = []
  for (const entry of value) {
    const record = artifactRecord(entry)
    if (!record) continue
    const label = artifactText(record.label)
    if (!label) continue
    items.push({
      label,
      count: artifactInteger(record.count),
      share_pct: artifactInteger(record.share_pct),
    })
  }
  return items
}

function parseArtifactPressureTimelineEvidenceSignals(
  value: unknown
): GmailPressureTimelineEvidenceSignal[] {
  if (!Array.isArray(value)) return []
  const items: GmailPressureTimelineEvidenceSignal[] = []
  for (const entry of value) {
    const record = artifactRecord(entry)
    if (!record) continue
    const label = artifactText(record.label)
    if (!label) continue
    items.push({
      label,
      count: artifactInteger(record.count),
      share_pct: artifactInteger(record.share_pct),
      exactness: record.exactness === 'actual' ? 'actual' : 'inferred',
    })
  }
  return items
}

function parseArtifactPressureTimeline(
  value: unknown
): GmailPressureTimelineBucket[] {
  if (!Array.isArray(value)) return []
  const items: GmailPressureTimelineBucket[] = []
  for (const entry of value) {
    const record = artifactRecord(entry)
    if (!record) continue
    const label = artifactText(record.label)
    if (!label) continue
    items.push({
      label,
      count: artifactInteger(record.count),
      composition: parseArtifactPressureTimelineComposition(record.composition),
      evidence_signals: parseArtifactPressureTimelineEvidenceSignals(record.evidence_signals),
    })
  }
  return items
}

function parseArtifactTopSenders(
  value: unknown
): GmailMailboxIntelligenceData['whole_mailbox']['top_senders'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const sender = artifactText(record.sender)
          const senderKey = artifactText(record.sender_key)
          if (!sender || !senderKey) return null
          return {
            sender,
            sender_key: senderKey,
            message_count: artifactInteger(record.message_count),
            share_pct: artifactInteger(record.share_pct),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailMailboxIntelligenceData['whole_mailbox']['top_senders'][number] =>
            entry != null
        )
    : []
}

function parseArtifactSenderVolumeDistribution(
  value: unknown
): GmailMailboxIntelligenceData['whole_mailbox']['sender_volume_distribution'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const label = artifactText(record.label)
          if (!label) return null
          return {
            label,
            sender_count: artifactInteger(record.sender_count),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailMailboxIntelligenceData['whole_mailbox']['sender_volume_distribution'][number] =>
            entry != null
        )
    : []
}

function parseArtifactCategoryBreakdown(
  value: unknown
): GmailMailboxIntelligenceData['whole_mailbox']['category_breakdown'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const label = artifactText(record.label)
          if (!label) return null
          return {
            label,
            count: artifactInteger(record.count),
          }
        })
        .filter(
          (
            entry
          ): entry is GmailMailboxIntelligenceData['whole_mailbox']['category_breakdown'][number] =>
            entry != null
        )
    : []
}

function parseArtifactHumanVsAutomation(
  value: unknown
): GmailMailboxIntelligenceData['whole_mailbox']['human_vs_automation'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const label = artifactText(record.label)
          if (!label) return null
          return {
            label,
            count: artifactInteger(record.count),
            exactness: 'inferred' as const,
          }
        })
        .filter(
          (
            entry
          ): entry is GmailMailboxIntelligenceData['whole_mailbox']['human_vs_automation'][number] =>
            entry != null
        )
    : []
}

function parseArtifactMailboxSenderRanking(
  value: unknown
): GmailMailboxIntelligenceData['sender_ranking'] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          const record = artifactRecord(entry)
          if (!record) return null
          const sender = artifactText(record.sender)
          const senderKey = artifactText(record.sender_key)
          if (!sender || !senderKey) return null
          const assignedCleanupGroupId = artifactNullableText(record.assigned_cleanup_group_id)
          const assignmentReason = artifactNullableText(record.assignment_reason)
          const senderSignal = artifactNullableText(record.sender_signal)
          const cleanupExclusionReason = artifactNullableText(record.cleanup_exclusion_reason)
          return {
            sender,
            sender_key: senderKey,
            assigned_cleanup_group_id:
              assignedCleanupGroupId && assignedCleanupGroupId.trim()
                ? (assignedCleanupGroupId as GmailMailboxIntelligenceData['sender_ranking'][number]['assigned_cleanup_group_id'])
                : 'needs-review-senders',
            assignment_reason:
              assignmentReason && assignmentReason.trim()
                ? (assignmentReason as GmailMailboxIntelligenceData['sender_ranking'][number]['assignment_reason'])
                : 'needs_review_unclassified',
            is_cleanup_candidate: artifactBoolean(record.is_cleanup_candidate),
            total_message_count: artifactInteger(record.total_message_count),
            cleanup_candidate_message_count: artifactInteger(record.cleanup_candidate_message_count),
            protected_message_count: artifactInteger(record.protected_message_count),
            unread_count: artifactInteger(record.unread_count),
            first_seen: artifactNullableText(record.first_seen),
            last_seen: artifactNullableText(record.last_seen),
            category_summary: artifactNullableText(record.category_summary) || 'General updates',
            sender_signal:
              senderSignal === 'likely_machine_generated' || senderSignal === 'likely_human'
                ? senderSignal
                : 'uncertain',
            cleanup_exclusion_reason:
              cleanupExclusionReason && cleanupExclusionReason.trim()
                ? (cleanupExclusionReason as GmailMailboxIntelligenceData['sender_ranking'][number]['cleanup_exclusion_reason'])
                : null,
          }
        })
        .filter(
          (
            entry
          ): entry is GmailMailboxIntelligenceData['sender_ranking'][number] => entry != null
        )
    : []
}

function buildMailboxIntelligenceCleanupGroupsFromArtifactSummaries(
  summaries: GmailClusterSummaryArtifactRow[]
): GmailMailboxIntelligenceData['cleanup_groups'] {
  const rawClusters = summaries.map((summary) => {
    const summaryPayload = artifactRecord(summary.summary_payload) || {}
    const semanticAnalytics = parseArtifactAnalytics({
      cluster_id: summary.cluster_id,
      analytics: summaryPayload,
    } as GmailSenderWorkspaceSeedHeaderRow)

    return {
      cluster_id: summary.cluster_id,
      canonical_cluster_id: semanticAnalytics.cleanup_group_canonical_cluster_id || summary.cluster_id,
      legacy_cluster_ids: semanticAnalytics.cleanup_group_legacy_cluster_ids || [],
      source_cluster_ids:
        (semanticAnalytics.cleanup_group_source_cluster_ids || []).length > 0
          ? semanticAnalytics.cleanup_group_source_cluster_ids || []
          : [summary.cluster_id],
      cluster_type: summary.cluster_type,
      title: summary.title,
      query: summary.query,
      sender_count: artifactInteger(summary.sender_count),
      message_count: artifactInteger(summary.message_count),
      estimated_count: artifactInteger(summary.message_count),
      why_selected: summary.why_selected,
      risk_note: summary.risk_note,
      safety_note: summary.safety_note,
      surface_tier: semanticAnalytics.cleanup_group_surface_tier || 'secondary',
      surface_kind: semanticAnalytics.cleanup_group_surface_kind || 'secondary_candidate',
      surface_visibility: semanticAnalytics.cleanup_group_surface_visibility || 'visible',
      top_level_rank: semanticAnalytics.cleanup_group_top_level_rank ?? null,
    } satisfies ClusterInput
  })
  const sources = cleanupClusterIdentitySources(rawClusters)

  return summaries.map((summary) => {
    const summaryPayload = artifactRecord(summary.summary_payload) || {}
    const semanticAnalytics = parseArtifactAnalytics({
      cluster_id: summary.cluster_id,
      analytics: summaryPayload,
    } as GmailSenderWorkspaceSeedHeaderRow)
    const resolvedSemanticState = resolveSemanticArtifactState({
      clusterId: summary.cluster_id,
      senderCount: artifactInteger(summary.sender_count),
      messageCount: artifactInteger(summary.message_count),
      localAnalytics: semanticAnalytics,
    })
    const identity = resolveCleanupClusterIdentity(summary.cluster_id, sources)
    const canonicalClusterId = canonicalRuntimeClusterIdFromIdentity(identity, summary.cluster_id)
    const descriptorAliasIds =
      identity.canonicalDescriptor?.aliases.map((alias) => alias.clusterId) || []
    const legacyClusterIds = uniqueClusterInputIds([
      ...(semanticAnalytics.cleanup_group_legacy_cluster_ids || []),
      ...identity.legacyClusterIds,
      ...descriptorAliasIds,
    ]).filter((clusterId) => clusterId !== canonicalClusterId)
    const sourceClusterIds = uniqueClusterInputIds([
      ...(semanticAnalytics.cleanup_group_source_cluster_ids || []),
      summary.cluster_id,
      semanticAnalytics.cleanup_group_canonical_cluster_id,
    ]).filter((clusterId) => clusterId !== canonicalClusterId)

    return {
      cluster_id: canonicalClusterId,
      canonical_cluster_id: canonicalClusterId,
      legacy_cluster_ids: legacyClusterIds,
      source_cluster_ids: sourceClusterIds,
      cluster_type: summary.cluster_type,
      title: summary.title,
      query: summary.query,
      why_selected: summary.why_selected || 'Grouped by shared sender behavior.',
      risk_note: summary.risk_note || 'Review mixed senders carefully before approving bulk archive.',
      safety_note:
        summary.safety_note || 'Sender-first review protects safe traffic while you inspect this group.',
      message_count: artifactInteger(summary.message_count),
      sender_count: artifactInteger(summary.sender_count),
      share_pct: artifactInteger(summary.share_pct),
      dominant_sender: artifactNullableText(summary.dominant_sender),
      dominant_semantic_family: resolvedSemanticState.dominant_semantic_family,
      dominant_semantic_pattern: resolvedSemanticState.dominant_semantic_pattern,
      dominant_pattern:
        dominantPatternCompatibilityLabel(resolvedSemanticState.semantic_pattern_distribution[0] || null) ||
        artifactNullableText(summary.dominant_pattern),
      protected_message_count: artifactInteger(summary.protected_message_count),
      uncertain_sender_count:
        resolvedSemanticState.semantic_rollup != null
          ? resolvedSemanticState.uncertain_sender_count
          : artifactInteger(summary.uncertain_sender_count),
      surface_tier: semanticAnalytics.cleanup_group_surface_tier || 'secondary',
      surface_kind: semanticAnalytics.cleanup_group_surface_kind || 'secondary_candidate',
      surface_visibility: semanticAnalytics.cleanup_group_surface_visibility || 'visible',
      top_level_rank:
        semanticAnalytics.cleanup_group_top_level_rank ?? null,
      promotion_status: semanticAnalytics.cleanup_group_promotion_status || 'unresolved',
      selected_semantic_axis: semanticAnalytics.cleanup_group_selected_semantic_axis || null,
      operator_value_status:
        semanticAnalytics.cleanup_group_operator_value_status || 'not_applicable',
      review_units_required: semanticAnalytics.cleanup_group_review_units_required === true,
      review_unit_basis: semanticAnalytics.cleanup_group_review_unit_basis || 'not_promoted',
      review_unit_count: Math.max(0, semanticAnalytics.cleanup_group_review_unit_count || 0),
      semantic_rollup_schema_version: resolvedSemanticState.semantic_rollup_schema_version,
      semantic_rollup_hash: resolvedSemanticState.semantic_rollup_hash,
      semantic_rollup: resolvedSemanticState.semantic_rollup,
      semantic_family_distribution: resolvedSemanticState.semantic_family_distribution,
      semantic_pattern_distribution: resolvedSemanticState.semantic_pattern_distribution,
      semantic_resolution_distribution: resolvedSemanticState.semantic_resolution_distribution,
      semantic_confidence_distribution: resolvedSemanticState.semantic_confidence_distribution,
      semantic_provenance_distribution: resolvedSemanticState.semantic_provenance_distribution,
      semantic_umbrella_distribution: resolvedSemanticState.semantic_umbrella_distribution,
    }
  })
}

function buildSafeMailboxIntelligenceCleanupGroups(params: {
  clusters: ClusterInput[]
  summaries: GmailClusterSummaryArtifactRow[]
}): GmailMailboxIntelligenceData['cleanup_groups'] {
  if (params.summaries.length > 0) {
    return buildMailboxIntelligenceCleanupGroupsFromArtifactSummaries(params.summaries)
  }

  return canonicalizeClusterCollection(params.clusters).map((cluster) => ({
    cluster_id: cluster.cluster_id,
    canonical_cluster_id: cluster.canonical_cluster_id || cluster.cluster_id,
    legacy_cluster_ids: cluster.legacy_cluster_ids || [],
    source_cluster_ids: cluster.source_cluster_ids || [cluster.cluster_id],
    cluster_type: cluster.cluster_type,
    title: cluster.title,
    query: cluster.query,
    why_selected: cluster.why_selected || 'Grouped by shared sender behavior.',
    risk_note: cluster.risk_note || 'Review mixed senders carefully before approving bulk archive.',
    safety_note:
      cluster.safety_note || 'Sender-first review protects safe traffic while you inspect this group.',
    message_count: expectedClusterMessageCount(cluster) || 0,
    sender_count: 0,
    share_pct: 0,
    dominant_sender: null,
    dominant_semantic_family: null,
    dominant_semantic_pattern: null,
    dominant_pattern: null,
    protected_message_count: 0,
    uncertain_sender_count: 0,
    surface_tier: cluster.surface_tier || 'secondary',
    surface_kind: cluster.surface_kind || 'secondary_candidate',
    surface_visibility: cluster.surface_visibility || 'visible',
    top_level_rank: cluster.top_level_rank ?? null,
    promotion_status: 'unresolved',
    selected_semantic_axis: null,
    operator_value_status: 'not_applicable',
    review_units_required: false,
    review_unit_basis: 'not_promoted',
    review_unit_count: 0,
    semantic_rollup_schema_version: null,
    semantic_rollup_hash: null,
    semantic_rollup: null,
    semantic_family_distribution: [],
    semantic_pattern_distribution: [],
    semantic_resolution_distribution: [],
    semantic_confidence_distribution: [],
    semantic_provenance_distribution: [],
    semantic_umbrella_distribution: [],
  }))
}

function pressureTrendArtifactWindowLabel(window: GmailPressureTrendWindow): string {
  if (window === 'all_indexed') return 'All indexed history'
  if (window === 'last_year') return 'Last year'
  if (window === 'last_quarter') return 'Last quarter'
  if (window === 'last_month') return 'Last month'
  if (window === 'last_week') return 'Last week'
  if (window === 'last_day') return 'Last day'
  return 'Custom range'
}

function pressureTrendArtifactGroupingLabel(grouping: GmailPressureTrendData['grouping']['key']): string {
  if (grouping === 'hour') return 'Hourly bars'
  if (grouping === 'day') return 'Daily bars'
  if (grouping === 'week') return 'Weekly bars'
  if (grouping === 'month') return 'Monthly bars'
  if (grouping === 'quarter') return 'Quarterly bars'
  return 'Yearly bars'
}

function pressureTrendArtifactGroupingFromBuckets(
  params: {
    buckets: GmailMailboxIntelligenceBucketRow[]
    pressureWindow: GmailPressureTrendWindow
    pressureStart?: string | null
    pressureEnd?: string | null
  }
): GmailPressureTrendData['grouping']['key'] {
  const firstBucket = params.buckets[0] || null
  const firstPayload = artifactRecord(firstBucket?.bucket_payload) || {}
  const rawGrouping =
    artifactNullableText(firstPayload.grouping_key) ||
    artifactText(firstBucket?.bucket_key).split(':')[0] ||
    gmailPressureTrendExpectedGroupingForWindow({
      window: params.pressureWindow,
      pressureStart: params.pressureStart,
      pressureEnd: params.pressureEnd,
    })
  if (
    rawGrouping === 'hour' ||
    rawGrouping === 'day' ||
    rawGrouping === 'week' ||
    rawGrouping === 'month' ||
    rawGrouping === 'quarter' ||
    rawGrouping === 'year'
  ) {
    return rawGrouping
  }
  return 'quarter'
}

function selectPressureTrendArtifactBuckets(params: {
  buckets: GmailMailboxIntelligenceBucketRow[]
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
}): {
  bucketKind: string | null
  buckets: GmailMailboxIntelligenceBucketRow[]
} {
  const bucketKinds = gmailPressureTrendArtifactBucketFamilyCandidates({
    window: params.pressureWindow,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
  })
  for (const bucketKind of bucketKinds) {
    const selectedBuckets = params.buckets.filter(
      (bucket) => artifactText(bucket.bucket_kind) === bucketKind
    )
    if (selectedBuckets.length > 0) {
      return {
        bucketKind,
        buckets: selectedBuckets,
      }
    }
  }
  return {
    bucketKind: null,
    buckets: [],
  }
}

function parseArtifactPressureTrendSeries(
  buckets: GmailMailboxIntelligenceBucketRow[]
): GmailPressureTrendData['series'] {
  const items: GmailPressureTrendData['series'] = []
  for (const bucket of buckets) {
    const payload = artifactRecord(bucket.bucket_payload) || {}
    const bucketStartAt = artifactNullableText(payload.bucket_start_at) || bucket.bucket_start_at
    const bucketEndAt =
      artifactNullableText(payload.bucket_end_at) || bucket.bucket_end_at || bucket.bucket_start_at
    if (!bucketStartAt || !bucketEndAt) continue
    items.push({
      label: artifactNullableText(payload.label) || artifactText(bucket.bucket_key) || bucketStartAt,
      count: artifactInteger(payload.count, artifactInteger(bucket.bucket_value)),
      composition: parseArtifactPressureTimelineComposition(payload.composition),
      evidence_signals: parseArtifactPressureTimelineEvidenceSignals(payload.evidence_signals),
      bucket_start_at: bucketStartAt,
      bucket_end_at: bucketEndAt,
    })
  }
  return items
}

function buildPressureTrendFromArtifactBuckets(params: {
  publication: GmailArtifactPublicationRow | null
  wholeMailbox: Record<string, unknown>
  buckets: GmailMailboxIntelligenceBucketRow[]
  pressureWindow?: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): GmailPressureTrendData {
  const window = normalizePressureTrendWindow(params.pressureWindow)
  const timeZone =
    typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC'
  const requestedStart = window === 'custom' ? artifactNullableText(params.pressureStart) : null
  const requestedEnd = window === 'custom' ? artifactNullableText(params.pressureEnd) : null
  const selected = selectPressureTrendArtifactBuckets({
    buckets: params.buckets,
    pressureWindow: window,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
  })
  const grouping = pressureTrendArtifactGroupingFromBuckets({
    buckets: selected.buckets,
    pressureWindow: window,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
  })
  const series = parseArtifactPressureTrendSeries(selected.buckets)
  const firstPayload = artifactRecord(selected.buckets[0]?.bucket_payload) || {}
  const coverageStartMs = artifactDateMs(series[0]?.bucket_start_at)
  const coverageEndMs = artifactDateMs(series[series.length - 1]?.bucket_end_at)
  const fallbackIndexedDateSpanStart = artifactNullableText(params.wholeMailbox.indexed_date_span_start)
  const fallbackIndexedDateSpanEnd = artifactNullableText(params.wholeMailbox.indexed_date_span_end)

  let requestedStartMs: number | null = null
  let requestedEndMs: number | null = coverageEndMs

  if (window === 'custom') {
    requestedStartMs = artifactDateMs(requestedStart)
    requestedEndMs = artifactDateMs(requestedEnd)
  } else if (coverageEndMs != null) {
    const dayMs = 24 * 60 * 60 * 1000
    if (window === 'last_year') requestedStartMs = coverageEndMs - 365 * dayMs
    else if (window === 'last_quarter') requestedStartMs = coverageEndMs - 92 * dayMs
    else if (window === 'last_month') requestedStartMs = coverageEndMs - 31 * dayMs
    else if (window === 'last_week') requestedStartMs = coverageEndMs - 7 * dayMs
    else if (window === 'last_day') requestedStartMs = coverageEndMs - dayMs
    else requestedStartMs = coverageStartMs
  }

  const effectiveStartMs =
    coverageStartMs != null && requestedStartMs != null
      ? Math.max(coverageStartMs, requestedStartMs)
      : requestedStartMs ?? coverageStartMs
  const effectiveEndMs =
    coverageEndMs != null && requestedEndMs != null
      ? Math.min(coverageEndMs, requestedEndMs)
      : requestedEndMs ?? coverageEndMs

  const filteredSeries =
    window === 'custom' && effectiveStartMs != null && effectiveEndMs != null
      ? series.filter((entry) => {
          const bucketStartMs = artifactDateMs(entry.bucket_start_at)
          const bucketEndMs = artifactDateMs(entry.bucket_end_at)
          if (bucketStartMs == null || bucketEndMs == null) return false
          return bucketEndMs >= effectiveStartMs && bucketStartMs <= effectiveEndMs
        })
      : series

  return {
    window: {
      key: window,
      label: pressureTrendArtifactWindowLabel(window),
      requested_start: requestedStart,
      requested_end: requestedEnd,
      effective_start:
        window === 'custom'
          ? artifactIsoStringFromMs(effectiveStartMs) || fallbackIndexedDateSpanStart || null
          : artifactNullableText(firstPayload.effective_start) ||
            series[0]?.bucket_start_at ||
            fallbackIndexedDateSpanStart ||
            null,
      effective_end:
        window === 'custom'
          ? artifactIsoStringFromMs(effectiveEndMs) || fallbackIndexedDateSpanEnd || null
          : artifactNullableText(firstPayload.effective_end) ||
            series[series.length - 1]?.bucket_end_at ||
            fallbackIndexedDateSpanEnd ||
            null,
      limited_by_indexed_coverage:
        window === 'custom'
          ? (requestedStartMs != null &&
              effectiveStartMs != null &&
              effectiveStartMs > requestedStartMs) ||
            (requestedEndMs != null &&
              effectiveEndMs != null &&
              effectiveEndMs < requestedEndMs)
          : artifactBoolean(firstPayload.limited_by_indexed_coverage),
    },
    grouping: {
      key: grouping,
      label: pressureTrendArtifactGroupingLabel(grouping),
    },
    indexed_coverage: {
      indexed_total_rows: artifactInteger(params.publication?.last_indexed_message_count),
      indexed_inbox_rows: artifactInteger(params.wholeMailbox.indexed_inbox_rows),
      indexed_date_span_start: fallbackIndexedDateSpanStart,
      indexed_date_span_end: fallbackIndexedDateSpanEnd,
    },
    time_zone: timeZone,
    series: filteredSeries,
    source: 'gmail_index_cache',
  }
}

function buildSafePartialPressureTrendFromArtifact(params: {
  publication: GmailArtifactPublicationRow | null
  wholeMailbox: Record<string, unknown>
  buckets: GmailMailboxIntelligenceBucketRow[]
  pressureWindow?: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  reason: string
}): GmailPressureTrendData {
  console.info(
    `${GMAIL_PRESSURE_TREND_ARTIFACT_LOG_PREFIX} ${JSON.stringify({
      tenant_id: params.publication?.tenant_id || null,
      analysis_scope: params.publication?.analysis_scope || 'all_indexed',
      artifact_version: params.publication?.published_version || null,
      mode: 'safe_partial',
      reason: params.reason,
      bucket_count: params.buckets.length,
    })}`
  )

  return {
    window: {
      key: normalizePressureTrendWindow(params.pressureWindow),
      label: pressureTrendArtifactWindowLabel(normalizePressureTrendWindow(params.pressureWindow)),
      requested_start:
        normalizePressureTrendWindow(params.pressureWindow) === 'custom'
          ? artifactNullableText(params.pressureStart)
          : null,
      requested_end:
        normalizePressureTrendWindow(params.pressureWindow) === 'custom'
          ? artifactNullableText(params.pressureEnd)
          : null,
      effective_start: artifactNullableText(params.wholeMailbox.indexed_date_span_start),
      effective_end: artifactNullableText(params.wholeMailbox.indexed_date_span_end),
      limited_by_indexed_coverage: false,
    },
    grouping: {
      key: pressureTrendArtifactGroupingFromBuckets({
        buckets: params.buckets,
        pressureWindow: normalizePressureTrendWindow(params.pressureWindow),
        pressureStart: params.pressureStart,
        pressureEnd: params.pressureEnd,
      }),
      label: pressureTrendArtifactGroupingLabel(
        pressureTrendArtifactGroupingFromBuckets({
          buckets: params.buckets,
          pressureWindow: normalizePressureTrendWindow(params.pressureWindow),
          pressureStart: params.pressureStart,
          pressureEnd: params.pressureEnd,
        })
      ),
    },
    indexed_coverage: {
      indexed_total_rows: artifactInteger(params.publication?.last_indexed_message_count),
      indexed_inbox_rows: artifactInteger(params.wholeMailbox.indexed_inbox_rows),
      indexed_date_span_start: artifactNullableText(params.wholeMailbox.indexed_date_span_start),
      indexed_date_span_end: artifactNullableText(params.wholeMailbox.indexed_date_span_end),
    },
    time_zone:
      typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC',
    series: [],
    source: 'gmail_index_cache',
  }
}

function buildSafePartialMailboxIntelligenceData(params: {
  analysisScope: GmailAnalysisScope
  clusters: ClusterInput[]
  publication: GmailArtifactPublicationRow | null
  summaries: GmailClusterSummaryArtifactRow[]
  snapshotPayload: Record<string, unknown>
  initialPressureWindow?: GmailPressureTrendWindow | null
  initialPressureStart?: string | null
  initialPressureEnd?: string | null
  initialTimeZone?: string | null
  buckets: GmailMailboxIntelligenceBucketRow[]
  reason: string
}): GmailMailboxIntelligenceData {
  const cleanupGroups = buildSafeMailboxIntelligenceCleanupGroups({
    clusters: params.clusters,
    summaries: params.summaries,
  })
  const wholeMailbox = artifactRecord(params.snapshotPayload.whole_mailbox) || {}
  const cleanupCandidate = artifactRecord(params.snapshotPayload.cleanup_candidate_universe) || {}
  const protectedSafeContext = artifactRecord(params.snapshotPayload.protected_safe_context) || {}
  const cleanupCandidateMessageCount =
    artifactInteger(cleanupCandidate.message_count) ||
    cleanupGroups.reduce((sum, group) => sum + group.message_count, 0)

  console.info(
    `${GMAIL_MAILBOX_INTELLIGENCE_ARTIFACT_LOG_PREFIX} ${JSON.stringify({
      tenant_id: params.publication?.tenant_id || null,
      analysis_scope: params.analysisScope,
      artifact_version: params.publication?.published_version || null,
      mode: 'safe_partial',
      reason: params.reason,
      cluster_summary_count: params.summaries.length,
    })}`
  )

  return {
    analysis_scope: params.analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox:
        artifactInteger(wholeMailbox.message_count) ||
        artifactInteger(params.publication?.last_indexed_message_count),
      cleanupCandidate: cleanupCandidateMessageCount,
      cleanupGroup: 0,
      senderSet: artifactInteger(wholeMailbox.sender_count),
      loadedPreviewRows: 0,
    }),
    whole_mailbox: {
      message_count:
        artifactInteger(wholeMailbox.message_count) ||
        artifactInteger(params.publication?.last_indexed_message_count),
      sender_count: artifactInteger(wholeMailbox.sender_count),
      indexed_inbox_rows: artifactInteger(wholeMailbox.indexed_inbox_rows),
      indexed_date_span_start: artifactNullableText(wholeMailbox.indexed_date_span_start),
      indexed_date_span_end: artifactNullableText(wholeMailbox.indexed_date_span_end),
      top_senders: parseArtifactTopSenders(wholeMailbox.top_senders),
      sender_volume_distribution: parseArtifactSenderVolumeDistribution(
        wholeMailbox.sender_volume_distribution
      ),
      activity_timeline: parseArtifactPressureTimeline(wholeMailbox.activity_timeline),
      activity_timeline_granularity:
        wholeMailbox.activity_timeline_granularity === 'week' ? 'week' : 'month',
      category_breakdown: parseArtifactCategoryBreakdown(wholeMailbox.category_breakdown),
      human_vs_automation: parseArtifactHumanVsAutomation(wholeMailbox.human_vs_automation),
    },
    cleanup_candidate_universe: {
      message_count: cleanupCandidateMessageCount,
      sender_count: artifactInteger(cleanupCandidate.sender_count),
      cleanup_date_span_start: artifactNullableText(cleanupCandidate.cleanup_date_span_start),
      cleanup_date_span_end: artifactNullableText(cleanupCandidate.cleanup_date_span_end),
      top_senders: parseArtifactTopSenders(cleanupCandidate.top_senders),
      sender_volume_distribution: parseArtifactSenderVolumeDistribution(
        cleanupCandidate.sender_volume_distribution
      ),
      activity_timeline: parseArtifactPressureTimeline(cleanupCandidate.activity_timeline),
      activity_timeline_granularity:
        cleanupCandidate.activity_timeline_granularity === 'week' ? 'week' : 'month',
      category_breakdown: parseArtifactCategoryBreakdown(cleanupCandidate.category_breakdown),
      human_vs_automation: parseArtifactHumanVsAutomation(cleanupCandidate.human_vs_automation),
    },
    protected_safe_context: {
      protected_message_count: artifactInteger(protectedSafeContext.protected_message_count),
      protected_sender_count: artifactInteger(protectedSafeContext.protected_sender_count),
      likely_human_message_count: artifactInteger(protectedSafeContext.likely_human_message_count),
      likely_human_sender_count: artifactInteger(protectedSafeContext.likely_human_sender_count),
      caution_candidate_message_count: artifactInteger(
        protectedSafeContext.caution_candidate_message_count
      ),
      low_risk_candidate_message_count: artifactInteger(
        protectedSafeContext.low_risk_candidate_message_count
      ),
      summary:
        artifactNullableText(protectedSafeContext.summary) ||
        'Artifact snapshot is incomplete; showing the last safe published summary.',
    },
    cleanup_groups: cleanupGroups,
    sender_ranking: parseArtifactMailboxSenderRanking(params.snapshotPayload.sender_ranking),
    initial_pressure_trend:
      params.initialPressureWindow && params.initialTimeZone
        ? buildPressureTrendFromArtifactBuckets({
            publication: params.publication,
            wholeMailbox,
            buckets: params.buckets,
            pressureWindow: params.initialPressureWindow,
            pressureStart: params.initialPressureStart,
            pressureEnd: params.initialPressureEnd,
            timeZone: params.initialTimeZone,
          })
        : null,
    source: 'gmail_index_cache',
  }
}

export function buildMailboxIntelligenceFromPublishedArtifactRead(params: {
  analysisScope: GmailAnalysisScope
  clusters: ClusterInput[]
  artifactRead: GmailPublishedMailboxIntelligenceArtifactRead
  initialPressureWindow?: GmailPressureTrendWindow | null
  initialPressureStart?: string | null
  initialPressureEnd?: string | null
  initialTimeZone?: string | null
}): GmailMailboxIntelligenceData {
  const normalizedInitialPressureWindow = params.initialPressureWindow
    ? normalizePressureTrendWindow(params.initialPressureWindow)
    : null
  const snapshotPayload = artifactRecord(params.artifactRead.snapshot?.snapshot_payload) || {}
  if (!params.artifactRead.publication?.published_version || !params.artifactRead.snapshot) {
    return buildSafePartialMailboxIntelligenceData({
      analysisScope: params.analysisScope,
      clusters: params.clusters,
      publication: params.artifactRead.publication,
      summaries: params.artifactRead.cluster_summaries,
      snapshotPayload,
      initialPressureWindow: params.initialPressureWindow,
      initialPressureStart: params.initialPressureStart,
      initialPressureEnd: params.initialPressureEnd,
      initialTimeZone: params.initialTimeZone,
      buckets: params.artifactRead.buckets,
      reason: params.artifactRead.publication?.published_version
        ? 'missing_mailbox_snapshot'
        : 'missing_published_artifact',
    })
  }

  const wholeMailbox = artifactRecord(snapshotPayload.whole_mailbox) || {}
  const cleanupCandidate = artifactRecord(snapshotPayload.cleanup_candidate_universe) || {}
  const protectedSafeContext = artifactRecord(snapshotPayload.protected_safe_context) || {}
  const scopeLadder = artifactRecord(snapshotPayload.scope_ladder) || {}
  const cleanupGroups = buildSafeMailboxIntelligenceCleanupGroups({
    clusters: params.clusters,
    summaries: params.artifactRead.cluster_summaries,
  })
  const cleanupCandidateMessageCount =
    artifactInteger(cleanupCandidate.message_count) ||
    cleanupGroups.reduce((sum, group) => sum + group.message_count, 0)
  const selectedPressureBuckets =
    normalizedInitialPressureWindow && params.initialTimeZone
      ? selectPressureTrendArtifactBuckets({
          buckets: params.artifactRead.buckets,
          pressureWindow: normalizedInitialPressureWindow,
          pressureStart: params.initialPressureStart,
          pressureEnd: params.initialPressureEnd,
        })
      : null
  const initialPressureTrend =
    normalizedInitialPressureWindow && params.initialTimeZone
      ? selectedPressureBuckets && selectedPressureBuckets.buckets.length > 0
        ? buildPressureTrendFromArtifactBuckets({
            publication: params.artifactRead.publication,
            wholeMailbox,
            buckets: selectedPressureBuckets.buckets,
            pressureWindow: normalizedInitialPressureWindow,
            pressureStart: params.initialPressureStart,
            pressureEnd: params.initialPressureEnd,
            timeZone: params.initialTimeZone,
          })
        : buildSafePartialPressureTrendFromArtifact({
            publication: params.artifactRead.publication,
            wholeMailbox,
            buckets: params.artifactRead.buckets,
            pressureWindow: normalizedInitialPressureWindow,
            pressureStart: params.initialPressureStart,
            pressureEnd: params.initialPressureEnd,
            timeZone: params.initialTimeZone,
            reason: 'missing_pressure_trend_bucket_family',
          })
      : null

  return {
    analysis_scope: params.analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox:
        artifactInteger(scopeLadder.whole_mailbox) ||
        artifactInteger(wholeMailbox.message_count) ||
        artifactInteger(params.artifactRead.publication.last_indexed_message_count),
      cleanupCandidate:
        artifactInteger(scopeLadder.cleanup_candidate_universe) || cleanupCandidateMessageCount,
      cleanupGroup: artifactInteger(scopeLadder.cleanup_group),
      senderSet:
        artifactInteger(scopeLadder.sender_set) ||
        artifactInteger(wholeMailbox.sender_count) ||
        parseArtifactMailboxSenderRanking(snapshotPayload.sender_ranking).length,
      loadedPreviewRows: artifactInteger(scopeLadder.loaded_preview_rows),
    }),
    whole_mailbox: {
      message_count:
        artifactInteger(wholeMailbox.message_count) ||
        artifactInteger(params.artifactRead.publication.last_indexed_message_count),
      sender_count: artifactInteger(wholeMailbox.sender_count),
      indexed_inbox_rows: artifactInteger(wholeMailbox.indexed_inbox_rows),
      indexed_date_span_start: artifactNullableText(wholeMailbox.indexed_date_span_start),
      indexed_date_span_end: artifactNullableText(wholeMailbox.indexed_date_span_end),
      top_senders: parseArtifactTopSenders(wholeMailbox.top_senders),
      sender_volume_distribution: parseArtifactSenderVolumeDistribution(
        wholeMailbox.sender_volume_distribution
      ),
      activity_timeline: parseArtifactPressureTimeline(wholeMailbox.activity_timeline),
      activity_timeline_granularity:
        wholeMailbox.activity_timeline_granularity === 'week' ? 'week' : 'month',
      category_breakdown: parseArtifactCategoryBreakdown(wholeMailbox.category_breakdown),
      human_vs_automation: parseArtifactHumanVsAutomation(wholeMailbox.human_vs_automation),
    },
    cleanup_candidate_universe: {
      message_count: cleanupCandidateMessageCount,
      sender_count: artifactInteger(cleanupCandidate.sender_count),
      cleanup_date_span_start: artifactNullableText(cleanupCandidate.cleanup_date_span_start),
      cleanup_date_span_end: artifactNullableText(cleanupCandidate.cleanup_date_span_end),
      top_senders: parseArtifactTopSenders(cleanupCandidate.top_senders),
      sender_volume_distribution: parseArtifactSenderVolumeDistribution(
        cleanupCandidate.sender_volume_distribution
      ),
      activity_timeline: parseArtifactPressureTimeline(cleanupCandidate.activity_timeline),
      activity_timeline_granularity:
        cleanupCandidate.activity_timeline_granularity === 'week' ? 'week' : 'month',
      category_breakdown: parseArtifactCategoryBreakdown(cleanupCandidate.category_breakdown),
      human_vs_automation: parseArtifactHumanVsAutomation(cleanupCandidate.human_vs_automation),
    },
    protected_safe_context: {
      protected_message_count: artifactInteger(protectedSafeContext.protected_message_count),
      protected_sender_count: artifactInteger(protectedSafeContext.protected_sender_count),
      likely_human_message_count: artifactInteger(protectedSafeContext.likely_human_message_count),
      likely_human_sender_count: artifactInteger(protectedSafeContext.likely_human_sender_count),
      caution_candidate_message_count: artifactInteger(
        protectedSafeContext.caution_candidate_message_count
      ),
      low_risk_candidate_message_count: artifactInteger(
        protectedSafeContext.low_risk_candidate_message_count
      ),
      summary:
        artifactNullableText(protectedSafeContext.summary) ||
        'Artifact snapshot is available but safety detail is incomplete.',
    },
    cleanup_groups: cleanupGroups,
    sender_ranking: parseArtifactMailboxSenderRanking(snapshotPayload.sender_ranking),
    initial_pressure_trend: initialPressureTrend,
    source: 'gmail_index_cache',
  }
}

async function loadMailboxIntelligenceFromArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  clusters: ClusterInput[]
  initialPressureWindow?: GmailPressureTrendWindow | null
  initialPressureStart?: string | null
  initialPressureEnd?: string | null
  initialTimeZone?: string | null
}): Promise<GmailArtifactSuccess<GmailMailboxIntelligenceData> | ReturnType<typeof fail>> {
  try {
    const normalizedInitialPressureWindow = params.initialPressureWindow
      ? normalizePressureTrendWindow(params.initialPressureWindow)
      : null
    const snapshotRead = await loadPublishedGmailMailboxIntelligenceArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: normalizeMailboxProfileScope(params.analysisScope),
      includeSnapshot: true,
      includeClusterSummaries: false,
      includeBuckets: false,
    })
    const publicationFailure = publishedArtifactAvailabilityFailure(snapshotRead.publication)
    if (publicationFailure) return publicationFailure
    if (!snapshotRead.publication) {
      return fail(409, 'Published Gmail runtime artifacts are still being prepared.', {
        reason: 'missing_published_artifact',
        retryAfterMs: 15_000,
      })
    }
    if (!snapshotRead.snapshot) {
      return fail(503, 'Published mailbox intelligence is incomplete.', {
        reason: 'missing_mailbox_snapshot',
        freshnessState: snapshotRead.publication?.freshness_state ?? null,
        buildStatus: snapshotRead.publication?.build_status ?? null,
        publishedVersion: snapshotRead.publication?.published_version ?? null,
      })
    }
    const summariesRead = await loadPublishedGmailMailboxIntelligenceArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: normalizeMailboxProfileScope(params.analysisScope),
      includeSnapshot: false,
      includeClusterSummaries: true,
      includeBuckets: false,
    })
    const summariesPublicationFailure = publishedArtifactAvailabilityFailure(
      summariesRead.publication
    )
    if (summariesPublicationFailure) return summariesPublicationFailure
    const bucketsRead =
      normalizedInitialPressureWindow != null && Boolean(params.initialTimeZone)
        ? await loadPublishedGmailMailboxIntelligenceArtifact({
            supabase: params.supabase,
            tenantId: params.tenantId,
            analysisScope: normalizeMailboxProfileScope(params.analysisScope),
            bucketKinds: gmailPressureTrendArtifactBucketFamilyCandidates({
              window: normalizedInitialPressureWindow,
              pressureStart: params.initialPressureStart,
              pressureEnd: params.initialPressureEnd,
            }),
            includeSnapshot: false,
            includeClusterSummaries: false,
            includeBuckets: true,
          })
        : snapshotRead
    const bucketsPublicationFailure = publishedArtifactAvailabilityFailure(bucketsRead.publication)
    if (bucketsPublicationFailure) return bucketsPublicationFailure
    const artifactRead: GmailPublishedMailboxIntelligenceArtifactRead = {
      ...snapshotRead,
      cluster_summaries: summariesRead.cluster_summaries,
      buckets: bucketsRead.buckets,
    }
    const baseArtifactRowCount =
      1 + artifactRead.cluster_summaries.length + artifactRead.buckets.length
    const baseArtifactBudgetFailure = firstPaintArtifactBudgetFailure(baseArtifactRowCount)
    if (baseArtifactBudgetFailure) return baseArtifactBudgetFailure
    const data = buildMailboxIntelligenceFromPublishedArtifactRead({
      analysisScope: params.analysisScope,
      clusters: params.clusters,
      artifactRead,
      initialPressureWindow: params.initialPressureWindow,
      initialPressureStart: params.initialPressureStart,
      initialPressureEnd: params.initialPressureEnd,
      initialTimeZone: params.initialTimeZone,
    })
    if (data.cleanup_groups.some((group) => !group.semantic_rollup)) {
      return fail(503, 'Published semantic truth is unavailable for one or more cleanup groups.', {
        reason: 'semantic_truth_unavailable',
        retryAfterMs: null,
        freshnessState: artifactRead.publication?.freshness_state ?? null,
        buildStatus: artifactRead.publication?.build_status ?? null,
        publishedVersion: artifactRead.publication?.published_version ?? null,
        buildingVersion: artifactRead.publication?.building_version ?? null,
      })
    }
    const selectedPressureBuckets =
      normalizedInitialPressureWindow && params.initialTimeZone
        ? selectPressureTrendArtifactBuckets({
            buckets: artifactRead.buckets,
            pressureWindow: normalizedInitialPressureWindow,
            pressureStart: params.initialPressureStart,
            pressureEnd: params.initialPressureEnd,
          })
        : null

    console.info(
      `${GMAIL_MAILBOX_INTELLIGENCE_ARTIFACT_LOG_PREFIX} ${JSON.stringify({
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        artifact_version: artifactRead.artifact_version,
        mode: 'published_artifact',
        artifact_freshness_state: artifactRead.publication?.freshness_state ?? null,
        artifact_refresh_strategy: artifactRead.publication?.refresh_strategy ?? null,
        cluster_summary_count: artifactRead.cluster_summaries.length,
        bucket_count: artifactRead.buckets.length,
        aggregate_artifact_query_rows: baseArtifactRowCount,
        semantic_cluster_rollup_count: data.cleanup_groups.length,
        selected_bucket_kind: selectedPressureBuckets?.bucketKind || null,
        has_snapshot: true,
      })}`
    )

    return {
      ok: true,
      publication: snapshotRead.publication,
      data,
    }
  } catch (error) {
    console.warn(`${GMAIL_MAILBOX_INTELLIGENCE_ARTIFACT_LOG_PREFIX} read failed closed:`, error)
    return fail(503, 'Published mailbox intelligence could not be loaded.', {
      reason: 'artifact_read_error',
      retryAfterMs: 15_000,
    })
  }
}

function normalizePressureTrendWindow(value: unknown): GmailPressureTrendWindow {
  if (
    value === 'all_indexed' ||
    value === 'last_year' ||
    value === 'last_quarter' ||
    value === 'last_month' ||
    value === 'last_week' ||
    value === 'last_day' ||
    value === 'custom'
  ) {
    return value
  }
  return 'all_indexed'
}

function normalizeSenderOverviewWindow(
  value: unknown
): Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null {
  if (value === 'last_day' || value === 'custom') return value
  return null
}

function senderKeySetFromWorkspaceSenders(
  senders: GmailSenderWorkspaceData['senders']
): Set<string> | null {
  const keys = senders
    .map((sender) =>
      typeof sender.sender_key === 'string' && sender.sender_key.trim()
        ? sender.sender_key.trim().toLowerCase()
        : null
    )
    .filter((senderKey): senderKey is string => Boolean(senderKey))

  return keys.length > 0 ? new Set(keys) : null
}

type SenderOverviewWorkflowWindowResolution = {
  coverage: GmailSenderOverviewWindowData['indexed_coverage']
  resolvedWindow: PressureTrendResolvedWindow
  grouping: GmailSenderOverviewWindowData['grouping']['key']
  canonicalTimeline: ReturnType<typeof buildCanonicalSenderWorkspaceActivityTimelineForRange>
  scopedRows: GmailMailboxIndexRow[]
  scopedSenders: GmailSenderWorkspaceData['senders']
  activeRows: GmailMailboxIndexRow[]
  activeSenders: GmailSenderWorkspaceData['senders']
  activeSenderKeys: Set<string>
  supportingMessageCount: number
  semanticAnalytics: ReturnType<typeof buildSemanticAnalyticsDistributions>
  dominantSender: string | null
  series: GmailSenderOverviewWindowData['series']
}

function resolveCanonicalSenderTimelineResolution(params: {
  analysisScope: GmailAnalysisScope
  senderWorkspaceBase: SenderWorkspaceBaseState
  canonicalSenders: GmailSenderWorkspaceData['senders']
  scopedSenderKeys?: Set<string> | null
  pressureWindow?: Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): 
  | { ok: true; data: SenderOverviewWorkflowWindowResolution }
  | ReturnType<typeof fail> {
  const scopedRows = params.scopedSenderKeys
    ? params.senderWorkspaceBase.selectedClusterRows.filter((row) => {
        const senderDisplay = rowSender(row) || row.sender || 'Unknown sender'
        const senderKey = normalizeSender(senderDisplay) || senderDisplay.trim().toLowerCase()
        return senderKey ? params.scopedSenderKeys?.has(senderKey) : false
      })
    : params.senderWorkspaceBase.selectedClusterRows.slice()
  const scopedSenders = params.scopedSenderKeys
    ? filterSendersToParentUniverse(
        params.senderWorkspaceBase.allSenders.slice(),
        params.scopedSenderKeys
      )
    : params.senderWorkspaceBase.allSenders.slice()

  const validRowTimestamps = scopedRows
    .map((row) =>
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    )
    .filter((value): value is number => value != null)

  const rowStartMs = validRowTimestamps.length > 0 ? Math.min(...validRowTimestamps) : null
  const rowEndMs = validRowTimestamps.length > 0 ? Math.max(...validRowTimestamps) : null
  const coverage = {
    indexed_total_rows: scopedRows.length,
    indexed_inbox_rows: scopedRows.filter((row) => row.is_in_inbox).length,
    indexed_date_span_start: rowStartMs != null ? new Date(rowStartMs).toISOString() : null,
    indexed_date_span_end: rowEndMs != null ? new Date(rowEndMs).toISOString() : null,
  }
  const resolvedWindow = resolveCanonicalSenderActivityWindow({
    analysisScope: params.analysisScope,
    coverage,
    pressureWindow: params.pressureWindow,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
    timeZone: params.timeZone,
    nowMs: Date.now(),
    rowStartMs,
    rowEndMs,
  })
  if (!resolvedWindow.ok) return fail(400, resolvedWindow.error)

  const {
    effectiveStartMs,
    effectiveEndExclusiveMs,
  } = resolvedWindow.data
  if (effectiveStartMs == null || effectiveEndExclusiveMs == null) {
    return fail(
      409,
      'Time Context chart window is unavailable because the current workflow scope does not have a bounded indexed date span for this cleanup group.'
    )
  }

  const grouping =
    resolvedWindow.data.grouping === 'quarter' || resolvedWindow.data.grouping === 'year'
        ? 'month'
        : resolvedWindow.data.grouping
  const normalizedWindow = {
    effectiveStartMs,
    effectiveEndExclusiveMs,
  }

  const canonicalTimeline = buildCanonicalSenderWorkspaceActivityTimelineForRange({
    rows: scopedRows,
    allowedSenderKeys: params.scopedSenderKeys,
    windowStartMs: normalizedWindow.effectiveStartMs,
    windowEndExclusiveMs: normalizedWindow.effectiveEndExclusiveMs,
    granularity: grouping,
    analysisScope: params.analysisScope,
    timeZone: params.timeZone,
    coverageStartIso: coverage.indexed_date_span_start,
    coverageEndIso: coverage.indexed_date_span_end,
  })
  const activeSenderKeys = new Set<string>()
  const senderMessageCounts = new Map<string, number>()
  for (const bucket of canonicalTimeline.bucketLookup.byBoundsSignature.values()) {
    for (const senderKey of bucket.senderKeys) {
      activeSenderKeys.add(senderKey)
    }
    for (const [senderKey, messageCount] of bucket.senderMessageCounts.entries()) {
      senderMessageCounts.set(senderKey, (senderMessageCounts.get(senderKey) || 0) + messageCount)
    }
  }
  const scopedSenderKeySet = new Set(scopedSenders.map((sender) => sender.sender_key).filter(Boolean))
  const activeRows: GmailMailboxIndexRow[] = []

  for (const row of scopedRows) {
    const timestamp =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (
      timestamp == null ||
      timestamp < normalizedWindow.effectiveStartMs ||
      timestamp >= normalizedWindow.effectiveEndExclusiveMs
    ) {
      continue
    }

    const senderDisplay = rowSender(row) || row.sender || 'Unknown sender'
    const senderKey = normalizeSender(senderDisplay) || senderDisplay.trim().toLowerCase()
    if (!senderKey) continue
    if (!scopedSenderKeySet.has(senderKey)) continue
    if (!activeSenderKeys.has(senderKey)) continue

    activeRows.push(row)
  }
  const supportingMessageCount = canonicalTimeline.items.reduce(
    (sum, item) => sum + Math.max(0, Math.round(item.message_count || 0)),
    0
  )

  const activeSenders = params.canonicalSenders.filter((sender) => activeSenderKeys.has(sender.sender_key))
  const semanticAnalytics = buildSemanticAnalyticsDistributions(activeSenders)
  const dominantSender =
    activeSenders
      .slice()
      .sort((left, right) => {
        const leftCount = senderMessageCounts.get(left.sender_key) || 0
        const rightCount = senderMessageCounts.get(right.sender_key) || 0
        return rightCount - leftCount || left.sender.localeCompare(right.sender)
      })[0]?.sender || null

  const series = canonicalTimeline.items.map((item) => ({
    label: item.label,
    count: item.sender_count,
    message_count: item.message_count ?? 0,
    bucket_start_at:
      typeof item.bucket_start_iso === 'string'
        ? item.bucket_start_iso
        : new Date(normalizedWindow.effectiveStartMs).toISOString(),
    bucket_end_at:
      typeof item.bucket_end_exclusive_iso === 'string'
        ? item.bucket_end_exclusive_iso
        : new Date(normalizedWindow.effectiveEndExclusiveMs).toISOString(),
  }))

  return {
    ok: true,
    data: {
      coverage,
      resolvedWindow: {
        ...resolvedWindow.data,
        effectiveStartMs: normalizedWindow.effectiveStartMs,
        effectiveEndExclusiveMs: normalizedWindow.effectiveEndExclusiveMs,
      },
      grouping,
      canonicalTimeline,
      scopedRows,
      scopedSenders,
      activeRows,
      activeSenders,
      activeSenderKeys,
      supportingMessageCount,
      semanticAnalytics,
      dominantSender,
      series,
    },
  }
}

function resolveSenderKeysFromTimelineResolution(params: {
  resolution: SenderOverviewWorkflowWindowResolution
  bucketLabel: string
  bucketStartAt?: string | null
  bucketEndExclusiveAt?: string | null
}): {
  bucketExists: boolean
  senderKeys: Set<string>
  senderMessageCounts: Map<string, number>
  scopedRows: GmailMailboxIndexRow[]
} {
  const requestedBucketStartMs =
    typeof params.bucketStartAt === 'string' && params.bucketStartAt.trim()
      ? Date.parse(params.bucketStartAt)
      : Number.NaN
  const requestedBucketEndExclusiveMs =
    typeof params.bucketEndExclusiveAt === 'string' && params.bucketEndExclusiveAt.trim()
      ? Date.parse(params.bucketEndExclusiveAt)
      : Number.NaN
  const matchedBucketByBounds =
    Number.isFinite(requestedBucketStartMs) && Number.isFinite(requestedBucketEndExclusiveMs)
      ? params.resolution.canonicalTimeline.bucketLookup.byBoundsSignature.get(
          `${requestedBucketStartMs}::${requestedBucketEndExclusiveMs}`
        ) || null
      : null
  const matchedBucketRecord =
    matchedBucketByBounds ||
    params.resolution.canonicalTimeline.bucketLookup.byLabel.get(params.bucketLabel) ||
    null

  if (!matchedBucketRecord) {
    return {
      bucketExists: false,
      senderKeys: new Set<string>(),
      senderMessageCounts: new Map<string, number>(),
      scopedRows: [],
    }
  }

  const scopedRows = params.resolution.scopedRows.filter((row) => {
    const timestamp =
      typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
        ? row.internal_date_ms
        : null
    if (
      timestamp == null ||
      timestamp < matchedBucketRecord.bucketStartMs ||
      timestamp >= matchedBucketRecord.bucketEndExclusiveMs
    ) {
      return false
    }
    const senderDisplay = rowSender(row) || row.sender || 'Unknown sender'
    const senderKey = normalizeSender(senderDisplay) || senderDisplay.trim().toLowerCase()
    if (!senderKey) return false
    return matchedBucketRecord.senderKeys.has(senderKey)
  })

  return {
    bucketExists: true,
    senderKeys: new Set(matchedBucketRecord.senderKeys),
    senderMessageCounts: new Map(matchedBucketRecord.senderMessageCounts),
    scopedRows,
  }
}

export async function loadGmailSenderOverviewWindowForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  pressureWindow?: Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): Promise<{ ok: true; data: GmailSenderOverviewWindowData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const normalizedSelectedCluster = normalizeClusters([params.selectedCluster])[0]
  const normalizedClusters = canonicalizeClusterCollection(
    normalizedSelectedCluster ? [...normalizeClusters(params.clusters), normalizedSelectedCluster] : normalizeClusters(params.clusters)
  )
  const selectedCluster = canonicalizeSelectedCluster({
    clusters: normalizedClusters,
    selectedCluster: normalizedSelectedCluster || params.selectedCluster,
  })
  if (!selectedCluster) {
    return fail(400, 'selected_cluster is required for sender_overview_window.')
  }

  const pressureWindow = normalizeSenderOverviewWindow(params.pressureWindow)
  if (!pressureWindow) {
    return fail(400, 'sender_overview_window requires last_day or custom.')
  }

  if (shouldReturnZeroRecentScopeForCluster(selectedCluster, analysisScope)) {
    return loadTimeContextProjectionUnavailable({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    })
  }

  if (params.tenantId) {
    return loadTimeContextProjectionUnavailable({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    })
  }

  const needsParentUniverseGuard = shouldEnforceRecentScopeParentUniverse(
    selectedCluster,
    analysisScope
  )
  const parentSenderUniverse = needsParentUniverseGuard
    ? await loadAllIndexedParentSenderUniverse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        selectedCluster,
        cacheVersion: params.cacheVersion ?? null,
      })
    : null
  const parentSenderUniverseKeys =
    parentSenderUniverse && parentSenderUniverse.senderKeys.length > 0
      ? new Set(parentSenderUniverse.senderKeys)
      : null
  const canonicalTimeContextUniverse =
    parentSenderUniverse ??
    (await loadAllIndexedParentSenderUniverse({
      supabase: params.supabase,
      tenantId: params.tenantId,
      selectedCluster,
      cacheVersion: params.cacheVersion ?? null,
    }))

  const canonicalTimeContextBase = await loadCanonicalTimeContextBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    cacheVersion: params.cacheVersion ?? null,
    clusters: normalizedClusters,
    selectedCluster,
    timeZone: params.timeZone ?? null,
  })
  if (!canonicalTimeContextBase.ok) return canonicalTimeContextBase
  const canonicalTimeContextAllSenders = parentSenderUniverseKeys
    ? filterSendersToParentUniverse(
        canonicalTimeContextBase.data.allSenders.slice(),
        parentSenderUniverseKeys
      )
    : canonicalTimeContextBase.data.allSenders.slice()
  const canonicalTimeContextSenderKeys =
    senderKeySetFromWorkspaceSenders(canonicalTimeContextAllSenders)
  const canonicalTimeContextSenders = canonicalTimeContextTimelineSenders({
    analysisScope,
    canonicalUniverse: canonicalTimeContextUniverse,
    scopedSenders: canonicalTimeContextAllSenders,
    scopedSenderKeys: canonicalTimeContextSenderKeys,
    fallbackSenders: canonicalTimeContextAllSenders,
  })

  const windowResolution = resolveCanonicalSenderTimelineResolution({
    analysisScope,
    senderWorkspaceBase: canonicalTimeContextBase.data,
    canonicalSenders: canonicalTimeContextSenders,
    scopedSenderKeys: canonicalTimeContextSenderKeys,
    pressureWindow,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
    timeZone: params.timeZone,
  })
  if (!windowResolution.ok) return windowResolution

  const {
    coverage,
    resolvedWindow,
    grouping,
    activeSenders,
    supportingMessageCount,
    semanticAnalytics,
    dominantSender,
    series,
  } = windowResolution.data
  const { label, requestedStart, requestedEnd, effectiveStartMs, effectiveEndExclusiveMs } =
    resolvedWindow
  const effectiveStartAt = effectiveStartMs != null ? new Date(effectiveStartMs).toISOString() : null
  const effectiveEndAt =
    effectiveStartMs != null && effectiveEndExclusiveMs != null
      ? new Date(Math.max(effectiveStartMs, effectiveEndExclusiveMs - 1)).toISOString()
      : null

  return {
    ok: true,
    data: {
      analysis_scope: analysisScope,
      selected_cluster: {
        cluster_id: selectedCluster.cluster_id,
        canonical_cluster_id:
          selectedCluster.canonical_cluster_id || selectedCluster.cluster_id,
        legacy_cluster_ids: selectedCluster.legacy_cluster_ids || [],
        cluster_type: selectedCluster.cluster_type,
        title: selectedCluster.title,
        query: selectedCluster.query,
        message_count: supportingMessageCount,
        sender_count: activeSenders.length,
      },
      window: {
        key: pressureWindow,
        label,
        requested_start: requestedStart,
        requested_end: requestedEnd,
        effective_start: effectiveStartAt,
        effective_end: effectiveEndAt,
        limited_by_indexed_coverage: resolvedWindow.limitedByIndexedCoverage,
      },
      grouping: {
        key: grouping,
        label: pressureTrendGroupingLabel(grouping),
      },
      indexed_coverage: coverage,
      time_zone: resolvedWindow.timeZone,
      series,
      summary: {
        active_sender_count: activeSenders.length,
        supporting_message_count: supportingMessageCount,
        dominant_sender: dominantSender,
        semantic_resolution_distribution: semanticAnalytics.semantic_resolution_distribution,
      },
      source: 'gmail_index_cache',
    },
  }
}

export async function loadGmailPressureTrendForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  cacheVersion?: string | null
  clusters: ClusterInput[]
  pressureWindow?: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): Promise<GmailArtifactSuccess<GmailPressureTrendData> | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  if (clusters.length === 0) return fail(400, 'clusters[] is required for mailbox_pressure_trend.')
  const pressureWindow = normalizePressureTrendWindow(params.pressureWindow)
  const requestedBucketKinds = gmailPressureTrendArtifactBucketFamilyCandidates({
    window: pressureWindow,
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
  })

  try {
    const snapshotRead = await loadPublishedGmailMailboxIntelligenceArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: 'all_indexed',
      includeSnapshot: true,
      includeClusterSummaries: false,
      includeBuckets: false,
    })
    const publicationFailure = publishedArtifactAvailabilityFailure(snapshotRead.publication)
    if (publicationFailure) return publicationFailure
    if (!snapshotRead.publication) {
      return fail(409, 'Published Gmail runtime artifacts are still being prepared.', {
        reason: 'missing_published_artifact',
        retryAfterMs: 15_000,
      })
    }
    const bucketRead = await loadPublishedGmailMailboxIntelligenceArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: 'all_indexed',
      bucketKinds: requestedBucketKinds,
      includeSnapshot: false,
      includeClusterSummaries: false,
      includeBuckets: true,
    })
    const bucketPublicationFailure = publishedArtifactAvailabilityFailure(bucketRead.publication)
    if (bucketPublicationFailure) return bucketPublicationFailure
    const artifactRead: GmailPublishedMailboxIntelligenceArtifactRead = {
      ...snapshotRead,
      buckets: bucketRead.buckets,
    }
    const artifactBudgetFailure = firstPaintArtifactBudgetFailure(
      (snapshotRead.snapshot ? 1 : 0) + artifactRead.buckets.length
    )
    if (artifactBudgetFailure) return artifactBudgetFailure
    const snapshotPayload = artifactRecord(artifactRead.snapshot?.snapshot_payload) || {}
    const wholeMailbox = artifactRecord(snapshotPayload.whole_mailbox) || {}

    const selectedPressureBuckets = selectPressureTrendArtifactBuckets({
      buckets: artifactRead.buckets,
      pressureWindow,
      pressureStart: params.pressureStart,
      pressureEnd: params.pressureEnd,
    })
    if (selectedPressureBuckets.buckets.length === 0) {
      return fail(503, 'The requested pressure-trend artifact is unavailable.', {
        reason: 'missing_pressure_trend_bucket_family',
        freshnessState: artifactRead.publication?.freshness_state ?? null,
        buildStatus: artifactRead.publication?.build_status ?? null,
        publishedVersion: artifactRead.publication?.published_version ?? null,
      })
    }
    const data = buildPressureTrendFromArtifactBuckets({
      publication: artifactRead.publication,
      wholeMailbox,
      buckets: selectedPressureBuckets.buckets,
      pressureWindow,
      pressureStart: params.pressureStart,
      pressureEnd: params.pressureEnd,
      timeZone: params.timeZone,
    })

    console.info(
      `${GMAIL_PRESSURE_TREND_ARTIFACT_LOG_PREFIX} ${JSON.stringify({
        tenant_id: params.tenantId,
        analysis_scope: 'all_indexed',
        artifact_version: artifactRead.artifact_version,
        mode: selectedPressureBuckets.buckets.length > 0 ? 'published_artifact' : 'safe_partial',
        requested_bucket_kinds: requestedBucketKinds,
        selected_bucket_kind: selectedPressureBuckets.bucketKind,
        bucket_count: artifactRead.buckets.length,
        aggregate_artifact_query_rows:
          (snapshotRead.snapshot ? 1 : 0) + artifactRead.buckets.length,
        window: data.window.key,
        grouping: data.grouping.key,
        series_count: data.series.length,
      })}`
    )

    return { ok: true, data, publication: snapshotRead.publication }
  } catch (error) {
    console.warn(`${GMAIL_PRESSURE_TREND_ARTIFACT_LOG_PREFIX} read failed closed:`, error)
    return fail(503, 'Published pressure-trend artifacts could not be loaded.', {
      reason: 'artifact_read_error',
      retryAfterMs: 15_000,
    })
  }
}

export async function loadGmailMailboxIntelligenceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  initialPressureWindow?: GmailPressureTrendWindow | null
  initialPressureStart?: string | null
  initialPressureEnd?: string | null
  initialTimeZone?: string | null
  clusters: ClusterInput[]
}): Promise<GmailArtifactSuccess<GmailMailboxIntelligenceData> | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = canonicalizeClusterCollection(params.clusters)
  if (clusters.length === 0) return fail(400, 'clusters[] is required for mailbox_intelligence.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  return loadMailboxIntelligenceFromArtifact({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters,
    initialPressureWindow: params.initialPressureWindow,
    initialPressureStart: params.initialPressureStart,
    initialPressureEnd: params.initialPressureEnd,
    initialTimeZone: params.initialTimeZone,
  })
}

export async function loadGmailSenderWorkspaceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  requestAgentId?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  reviewUnitId?: string | null
  includeClusterSenderKeys?: boolean
  previewEvidenceSenderKey?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindow?: Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null
  senderOverviewStart?: string | null
  senderOverviewEnd?: string | null
  timeZone?: string | null
}): Promise<
  | GmailArtifactSuccess<GmailSenderWorkspaceData>
  | { ok: true; data: GmailSenderWorkspaceData }
  | ReturnType<typeof fail>
> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const normalizedClusters = normalizeClusters(params.clusters)
  const requestedSelectedCluster = normalizeClusters([params.selectedCluster])[0]
  const clusters = canonicalizeClusterCollection(
    requestedSelectedCluster ? [...normalizedClusters, requestedSelectedCluster] : normalizedClusters
  )
  const selectedCluster = requestedSelectedCluster
    ? canonicalizeSelectedCluster({
        clusters: normalizedClusters,
        selectedCluster: requestedSelectedCluster,
      })
    : null
  if (!selectedCluster) return fail(400, 'selected_cluster is required for sender_workspace.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for sender_workspace.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const page = Math.max(1, Math.floor(params.page || 1))
  const searchInput = typeof params.search === 'string' ? params.search.trim() : ''
  const search = searchInput.toLowerCase()
  const filter = normalizeSenderWorkspaceFilter(params.filter)
  const sort = normalizeSenderWorkspaceSort(params.sort)
  const direction = normalizeSenderWorkspaceSortDirection(params.direction)
  const semanticFocus = normalizeSenderWorkspaceSemanticFocus(params.semanticFocus)
  const timeContextBucketLabel = normalizeTimeContextBucketLabel(params.timeContextBucketLabel)
  const timeContextBucketStartAt = normalizeTimeContextBucketIso(params.timeContextBucketStartAt)
  const timeContextBucketEndExclusiveAt = normalizeTimeContextBucketIso(
    params.timeContextBucketEndExclusiveAt
  )
  const senderOverviewWindow = normalizeSenderOverviewWindow(params.senderOverviewWindow)
  const requestTimeZone = params.timeZone ?? null
  const requestedPageSize = Math.floor(
    params.pageSize || DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE
  )
  const isDefaultDecisionQueueShape =
    params.includeClusterSenderKeys === true &&
    requestedPageSize > MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE &&
    page === 1 &&
    searchInput === '' &&
    filter === 'all' &&
    sort === 'message_count' &&
    direction === 'desc' &&
    semanticFocus == null
  const pageSize = Math.min(
    Math.max(requestedPageSize, 6),
    isDefaultDecisionQueueShape
      ? GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE
      : MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE
  )
  const isDefaultOverviewSnapshotShape = isDefaultSenderOverviewSnapshotRequest({
    page,
    pageSize,
    searchInput,
    filter,
    sort,
    direction,
    semanticFocus,
    previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
  })
  const canServeSnapshotWorkspaceRequest = canServeSenderWorkspaceFromPersistedSnapshot({
    searchInput,
    filter,
    sort,
    direction,
    previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
  })
  const requestAgentId = artifactText(params.requestAgentId)
  const needsParentUniverseGuard = shouldEnforceRecentScopeParentUniverse(
    selectedCluster,
    analysisScope
  )

  if (timeContextBucketLabel || senderOverviewWindow) {
    return loadTimeContextProjectionUnavailable({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    })
  }

  // Accepted Operations dispatch is artifact-only. The legacy reconstruction path below remains
  // available solely as unreachable compatibility code for non-runtime callers until its own slice.
  if (params.tenantId) {
    return loadSenderWorkspaceFromArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      selectedCluster,
      requestedSelectedClusterId: requestedSelectedCluster?.cluster_id || null,
      page,
      pageSize,
      searchInput,
      filter,
      sort,
      direction,
      semanticFocus,
      reviewUnitId: params.reviewUnitId ?? null,
      includeClusterSenderKeys: params.includeClusterSenderKeys === true,
      previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
      timeZone: requestTimeZone,
    })
  }

  const parentSenderUniverse = needsParentUniverseGuard
    ? await loadAllIndexedParentSenderUniverse({
        supabase: params.supabase,
        tenantId: params.tenantId,
        selectedCluster,
        cacheVersion: params.cacheVersion ?? null,
      })
    : null
  const parentSenderUniverseKeys = parentSenderUniverse
    ? new Set(parentSenderUniverse.senderKeys)
    : null
  const canonicalTimeContextUniverse =
    parentSenderUniverse ??
    (await loadAllIndexedParentSenderUniverse({
      supabase: params.supabase,
      tenantId: params.tenantId,
      selectedCluster,
      cacheVersion: params.cacheVersion ?? null,
    }))
  const coverageSnapshot = await loadMailboxCoverageSnapshot({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  let laneATimeContextSnapshotTimelinePromise:
    | Promise<{
        items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
        granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
      } | null>
    | null = null
  const loadLaneATimeContextSnapshotTimeline = () => {
    if (!shouldRecomputeLaneATimeContextTimeline(analysisScope)) {
      return Promise.resolve(null)
    }
    if (laneATimeContextSnapshotTimelinePromise) {
      return laneATimeContextSnapshotTimelinePromise
    }
    laneATimeContextSnapshotTimelinePromise = (async () => {
      const canonicalTimeContextBase = await loadCanonicalTimeContextBaseState({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope,
        cacheVersion: params.cacheVersion ?? null,
        clusters,
        selectedCluster,
        timeZone: requestTimeZone,
      })
      if (!canonicalTimeContextBase.ok) return null
      const canonicalSenders = canonicalTimeContextTimelineSenders({
        analysisScope,
        canonicalUniverse: canonicalTimeContextUniverse,
        scopedSenders: canonicalTimeContextBase.data.allSenders,
        scopedSenderKeys: senderKeySetFromWorkspaceSenders(canonicalTimeContextBase.data.allSenders),
        fallbackSenders: canonicalTimeContextBase.data.allSenders,
      })
      if (canonicalSenders.length === 0) return null

      return buildSenderActivityTimeline({
        senders: canonicalSenders,
        rows: canonicalTimeContextBase.data.selectedClusterRows,
        allowedSenderKeys: senderKeySetFromWorkspaceSenders(canonicalSenders),
        analysisScope,
        timeZone: requestTimeZone,
        coverageStartIso: coverageSnapshot.coverage.indexed_date_span_start,
        coverageEndIso: coverageSnapshot.coverage.indexed_date_span_end,
      })
    })()
    return laneATimeContextSnapshotTimelinePromise
  }

  if (
    timeContextBucketLabel == null &&
    senderOverviewWindow == null &&
    analysisScope !== 'all_indexed' &&
    canServeSnapshotWorkspaceRequest &&
    requestAgentId &&
    !needsParentUniverseGuard &&
    !shouldBypassRecentScopeSnapshotShortcut(selectedCluster, analysisScope)
  ) {
    const snapshotLoadStartedAt = Date.now()
    const persistedSnapshot = await loadLatestPersistedCleanupDiscoverySnapshot({
      supabase: params.supabase,
      agentId: requestAgentId,
      analysisScope,
    })
    const resolvedSnapshotWorkspace = persistedSnapshot
      ? resolvePersistedSenderOverviewWorkspace({
          snapshot: persistedSnapshot,
          selectedCluster,
          requestedSelectedClusterId: requestedSelectedCluster?.cluster_id || null,
        })
      : null
    if (persistedSnapshot && resolvedSnapshotWorkspace) {
      const snapshotWorkspace = resolvedSnapshotWorkspace.workspace
      const snapshotWorkspaceComplete =
        snapshotWorkspaceHasCompleteSenderPopulation(snapshotWorkspace)
      if (snapshotWorkspaceComplete) {
        const workspace = buildSenderWorkspaceRequestFromPersistedSnapshot({
          snapshotClusterId: resolvedSnapshotWorkspace.snapshotClusterId,
          snapshotWorkspace,
          selectedCluster,
          analysisScope,
          page,
          pageSize,
          searchInput,
          filter,
          sort,
          direction,
          semanticFocus,
          includeClusterSenderKeys: params.includeClusterSenderKeys === true,
          allowedSenderKeys: parentSenderUniverseKeys,
          allIndexedSenderTotal: parentSenderUniverse?.totalSenders ?? null,
          coverageStartIso: coverageSnapshot.coverage.indexed_date_span_start,
          coverageEndIso: coverageSnapshot.coverage.indexed_date_span_end,
          timeZone: requestTimeZone,
          logContext: {
            analysis_scope: analysisScope,
            selected_cluster_id: selectedCluster.cluster_id,
            source: 'recent_snapshot',
          },
        })
        const laneATimeContextSnapshotTimeline = await loadLaneATimeContextSnapshotTimeline()
        const resolvedWorkspace = laneATimeContextSnapshotTimeline
          ? {
              ...workspace,
              analytics: {
                ...workspace.analytics,
                sender_activity_timeline: laneATimeContextSnapshotTimeline.items,
                sender_activity_timeline_granularity:
                  laneATimeContextSnapshotTimeline.granularity,
              },
            }
          : workspace
        console.info(
          `${GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX} ${JSON.stringify({
            tenant_id: params.tenantId,
            agent_id: requestAgentId,
            analysis_scope: analysisScope,
            selected_cluster_id: selectedCluster.cluster_id,
            requested_selected_cluster_id: requestedSelectedCluster?.cluster_id || null,
            snapshot_cluster_id: resolvedSnapshotWorkspace.snapshotClusterId,
            snapshot_generated_at: persistedSnapshot.generatedAt,
            snapshot_expires_at: persistedSnapshot.expiresAt,
            include_cluster_sender_keys: params.includeClusterSenderKeys === true,
            sender_key_count: workspace.cluster_global.sender_keys.length,
            returned_sender_count: workspace.senders.length,
            total_sender_count: workspace.pagination.total_senders,
            semantic_focus_active: semanticFocus != null,
            duration_ms: Math.max(0, Date.now() - snapshotLoadStartedAt),
            status: 'applied_complete_snapshot',
          })}`
        )
        return { ok: true, data: resolvedWorkspace }
      }

      if (isDefaultOverviewSnapshotShape) {
        const workspace = buildSenderWorkspaceFromPersistedSnapshot({
          snapshot: persistedSnapshot,
          snapshotClusterId: resolvedSnapshotWorkspace.snapshotClusterId,
          snapshotWorkspace,
          selectedCluster,
          requestedSelectedClusterId: requestedSelectedCluster?.cluster_id || null,
          analysisScope,
          pageSize,
          includeClusterSenderKeys: params.includeClusterSenderKeys === true,
        })
        if (
          shouldRecomputeLaneATimeContextTimeline(analysisScope) &&
          workspace.cluster_global.sender_keys.length === 0
        ) {
          console.info(
            `${GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX} ${JSON.stringify({
              tenant_id: params.tenantId,
              agent_id: requestAgentId,
              analysis_scope: analysisScope,
              selected_cluster_id: selectedCluster.cluster_id,
              requested_selected_cluster_id: requestedSelectedCluster?.cluster_id || null,
              snapshot_cluster_id: resolvedSnapshotWorkspace.snapshotClusterId,
              snapshot_generated_at: persistedSnapshot.generatedAt,
              status: 'skipped_partial_snapshot_missing_sender_keys',
            })}`
          )
        } else {
          const laneATimeContextSnapshotTimeline = await loadLaneATimeContextSnapshotTimeline()
          const resolvedWorkspace = laneATimeContextSnapshotTimeline
            ? {
                ...workspace,
                analytics: {
                  ...workspace.analytics,
                  sender_activity_timeline: laneATimeContextSnapshotTimeline.items,
                  sender_activity_timeline_granularity:
                    laneATimeContextSnapshotTimeline.granularity,
                },
              }
            : workspace
          console.info(
            `${GMAIL_SENDER_WORKSPACE_SNAPSHOT_LOG_PREFIX} ${JSON.stringify({
              tenant_id: params.tenantId,
              agent_id: requestAgentId,
              analysis_scope: analysisScope,
              selected_cluster_id: selectedCluster.cluster_id,
              requested_selected_cluster_id: requestedSelectedCluster?.cluster_id || null,
              snapshot_cluster_id: resolvedSnapshotWorkspace.snapshotClusterId,
              snapshot_generated_at: persistedSnapshot.generatedAt,
              snapshot_expires_at: persistedSnapshot.expiresAt,
              include_cluster_sender_keys: params.includeClusterSenderKeys === true,
              sender_key_count: workspace.cluster_global.sender_keys.length,
              returned_sender_count: workspace.senders.length,
              total_sender_count: workspace.pagination.total_senders,
              semantic_focus_active: semanticFocus != null,
              duration_ms: Math.max(0, Date.now() - snapshotLoadStartedAt),
              status: 'applied_partial_snapshot',
            })}`
          )
          return { ok: true, data: resolvedWorkspace }
        }
      }
    }
  }

  if (
    timeContextBucketLabel == null &&
    senderOverviewWindow == null &&
    shouldUseSenderWorkspaceArtifactRead({ tenantId: params.tenantId, analysisScope })
  ) {
    return loadSenderWorkspaceFromArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      selectedCluster,
      requestedSelectedClusterId: requestedSelectedCluster?.cluster_id || null,
      page,
      pageSize,
      searchInput,
      filter,
      sort,
      direction,
      semanticFocus,
      includeClusterSenderKeys: params.includeClusterSenderKeys === true,
      previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
      timeZone: requestTimeZone,
    })
  }

  const senderWorkspaceBase = await loadSenderWorkspaceBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    cacheVersion: params.cacheVersion,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
    selectedCluster,
    timeZone: requestTimeZone,
  })
  if (!senderWorkspaceBase.ok) return senderWorkspaceBase

  const allSenders = parentSenderUniverseKeys
    ? filterSendersToParentUniverse(senderWorkspaceBase.data.allSenders.slice(), parentSenderUniverseKeys)
    : senderWorkspaceBase.data.allSenders.slice()
  if (
    parentSenderUniverseKeys &&
    allSenders.length !== senderWorkspaceBase.data.allSenders.length
  ) {
    console.info(
      `${GMAIL_SENDER_UNIVERSE_GUARD_LOG_PREFIX} ${JSON.stringify({
        analysis_scope: analysisScope,
        selected_cluster_id: selectedCluster.cluster_id,
        source: 'live_workspace_base',
        before_sender_count: senderWorkspaceBase.data.allSenders.length,
        after_sender_count: allSenders.length,
        all_indexed_sender_total: parentSenderUniverse?.totalSenders ?? null,
        status: 'applied_workspace_parent_universe_intersection',
      })}`
    )
  }
  const canonicalTimeContextBase = await loadCanonicalTimeContextBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    cacheVersion: params.cacheVersion ?? null,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
    selectedCluster,
    timeZone: requestTimeZone,
    scopedBase: senderWorkspaceBase.data,
  })
  if (!canonicalTimeContextBase.ok) return canonicalTimeContextBase
  const canonicalTimeContextAllSenders = parentSenderUniverseKeys
    ? filterSendersToParentUniverse(
        canonicalTimeContextBase.data.allSenders.slice(),
        parentSenderUniverseKeys
      )
    : canonicalTimeContextBase.data.allSenders.slice()
  const canonicalTimeContextSenderKeys =
    senderKeySetFromWorkspaceSenders(canonicalTimeContextAllSenders)
  const canonicalTimeContextSenders = canonicalTimeContextUniverse?.senders
    ? canonicalTimeContextSenderKeys
      ? filterSendersToParentUniverse(
          canonicalTimeContextUniverse.senders.slice(),
          canonicalTimeContextSenderKeys
        )
      : canonicalTimeContextUniverse.senders.slice()
    : canonicalTimeContextAllSenders
  const canonicalTimelineSenders = canonicalTimeContextTimelineSenders({
    analysisScope,
    canonicalUniverse: canonicalTimeContextUniverse,
    scopedSenders: canonicalTimeContextAllSenders,
    scopedSenderKeys: canonicalTimeContextSenderKeys,
    fallbackSenders: canonicalTimeContextAllSenders,
  })
  const scopeTimelineResolution = resolveCanonicalSenderTimelineResolution({
    analysisScope,
    senderWorkspaceBase: canonicalTimeContextBase.data,
    canonicalSenders: canonicalTimelineSenders,
    scopedSenderKeys: canonicalTimeContextSenderKeys,
    timeZone: params.timeZone,
  })
  if (!scopeTimelineResolution.ok) {
    return scopeTimelineResolution
  }
  const senderOverviewWindowResolution = senderOverviewWindow
    ? resolveCanonicalSenderTimelineResolution({
        analysisScope,
        senderWorkspaceBase: canonicalTimeContextBase.data,
        canonicalSenders: canonicalTimeContextSenders,
        scopedSenderKeys: canonicalTimeContextSenderKeys,
        pressureWindow: senderOverviewWindow,
        pressureStart: params.senderOverviewStart,
        pressureEnd: params.senderOverviewEnd,
        timeZone: params.timeZone,
      })
    : null
  if (senderOverviewWindowResolution && !senderOverviewWindowResolution.ok) {
    return senderOverviewWindowResolution
  }
  const windowFilteredSenders =
    senderOverviewWindowResolution?.ok
      ? buildWindowScopedWorkspaceSenders({
          senders: senderOverviewWindowResolution.data.activeSenders,
          rows: senderOverviewWindowResolution.data.activeRows,
        })
      : timeContextBucketLabel != null
        ? canonicalTimeContextSenders
        : allSenders
  const scopedBucketSenderKeys = timeContextBucketLabel
    ? resolveSenderKeysFromTimelineResolution({
        resolution: scopeTimelineResolution.data,
        bucketLabel: timeContextBucketLabel,
        bucketStartAt: timeContextBucketStartAt,
        bucketEndExclusiveAt: timeContextBucketEndExclusiveAt,
      })
    : null
  if (timeContextBucketLabel && scopedBucketSenderKeys && !scopedBucketSenderKeys.bucketExists) {
    return fail(409, 'The selected Time Context bucket is unavailable for the current workflow scope.')
  }
  if (
    timeContextBucketLabel &&
    scopedBucketSenderKeys &&
    scopedBucketSenderKeys.bucketExists &&
    scopedBucketSenderKeys.senderKeys.size === 0
  ) {
    return fail(409, 'The selected Time Context bucket is empty for the current workflow scope.')
  }
  const bucketFilteredSenders =
    scopedBucketSenderKeys && timeContextBucketLabel
      ? buildWindowScopedWorkspaceSenders({
          senders: windowFilteredSenders,
          rows: scopedBucketSenderKeys.scopedRows,
        })
      : windowFilteredSenders
  const cleanupCandidateMessageCount = senderWorkspaceBase.data.cleanupCandidateMessageCount

  const filteredSenders = bucketFilteredSenders.filter((sender) =>
    senderMatchesWorkspaceFilters({
      sender,
      search,
      filter,
      semanticFocus,
    })
  )

  filteredSenders.sort((left, right) => {
    let delta = 0
    if (sort === 'sender') {
      delta = left.sender.localeCompare(right.sender)
    } else if (sort === 'unread_count') {
      delta = left.unread_count - right.unread_count
    } else if (sort === 'last_activity') {
      delta =
        (Date.parse(left.last_activity || '') || 0) - (Date.parse(right.last_activity || '') || 0)
    } else {
      delta = left.cleanup_group_message_count - right.cleanup_group_message_count
    }
    if (delta === 0) delta = left.sender.localeCompare(right.sender)
    return direction === 'asc' ? delta : delta * -1
  })

  const totalSenders = filteredSenders.length
  const totalPages = Math.max(1, Math.ceil(totalSenders / pageSize))
  const normalizedPage = Math.min(page, totalPages)
  const rangeStart = (normalizedPage - 1) * pageSize
  const senders = filteredSenders.slice(rangeStart, rangeStart + pageSize)
  const selectedClusterMessageCount = filteredSenders.reduce(
    (sum, sender) => sum + sender.cleanup_group_message_count,
    0
  )
  const senderActivityTimeline: {
    items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
    granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
  } =
    senderOverviewWindowResolution?.ok && timeContextBucketLabel == null
      ? {
          items: senderOverviewWindowResolution.data.canonicalTimeline.items,
          granularity: senderOverviewWindowResolution.data.canonicalTimeline.granularity,
        }
      : {
          items: scopeTimelineResolution.data.canonicalTimeline.items,
          granularity: scopeTimelineResolution.data.canonicalTimeline.granularity,
        }
  const semanticAnalytics = buildSemanticAnalyticsDistributions(bucketFilteredSenders)
  const semanticArtifactFields = buildPersistedSemanticRollupArtifactFields({
    clusterId: selectedCluster.cluster_id,
    senderCount: bucketFilteredSenders.length,
    messageCount: selectedClusterMessageCount,
    semanticAnalytics,
  })

  const data: GmailSenderWorkspaceData = {
    analysis_scope: analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: coverageSnapshot.coverage.indexed_total_rows,
      cleanupCandidate: cleanupCandidateMessageCount,
      cleanupGroup: selectedClusterMessageCount,
      senderSet: filteredSenders.length,
      loadedPreviewRows: senders.reduce((sum, sender) => sum + sender.preview_messages.length, 0),
    }),
    selected_cluster: {
      cluster_id: selectedCluster.cluster_id,
      canonical_cluster_id: selectedCluster.canonical_cluster_id || selectedCluster.cluster_id,
      legacy_cluster_ids: selectedCluster.legacy_cluster_ids || [],
      cluster_type: selectedCluster.cluster_type,
      title: selectedCluster.title,
      query: selectedCluster.query,
      why_selected: selectedCluster.why_selected || 'Chosen from Cleanup Groups.',
      risk_note: selectedCluster.risk_note || 'Confirm mixed senders before archive.',
      safety_note: selectedCluster.safety_note || 'Messages remain in All Mail; only INBOX changes after approval.',
      message_count: selectedClusterMessageCount,
      sender_count: bucketFilteredSenders.length,
      share_pct:
        cleanupCandidateMessageCount > 0
          ? Math.round((selectedClusterMessageCount / cleanupCandidateMessageCount) * 100)
          : 0,
      surface_tier: selectedCluster.surface_tier || null,
      surface_kind: selectedCluster.surface_kind || null,
      surface_visibility: selectedCluster.surface_visibility || null,
      top_level_rank: selectedCluster.top_level_rank ?? null,
    },
    senders,
    pagination: {
      page: normalizedPage,
      page_size: pageSize,
      total_senders: totalSenders,
      total_pages: totalPages,
      cluster_total_senders: bucketFilteredSenders.length,
    },
    cluster_global: {
      sender_keys: bucketFilteredSenders.map((sender) => sender.sender_key),
      sender_keys_complete: true,
    },
    analytics: {
      sender_category_distribution: buildSenderCategoryDistribution(bucketFilteredSenders),
      semantic_rollup_schema_version: semanticArtifactFields.semantic_rollup_schema_version,
      semantic_rollup_hash: semanticArtifactFields.semantic_rollup_hash,
      semantic_rollup: semanticArtifactFields.semantic_rollup,
      semantic_family_distribution: semanticArtifactFields.semantic_family_distribution,
      semantic_pattern_distribution: semanticArtifactFields.semantic_pattern_distribution,
      semantic_resolution_distribution: semanticArtifactFields.semantic_resolution_distribution,
      semantic_confidence_distribution: semanticArtifactFields.semantic_confidence_distribution,
      semantic_provenance_distribution: semanticArtifactFields.semantic_provenance_distribution,
      semantic_umbrella_distribution: semanticArtifactFields.semantic_umbrella_distribution,
      operator_profile_family_distribution: buildCompatibilityOperatorProfileFamilyDistribution(
        semanticArtifactFields.semantic_family_distribution
      ),
      dominant_pattern_distribution: buildCompatibilityDominantPatternDistribution(
        semanticArtifactFields.semantic_pattern_distribution
      ),
      operator_profile_mode_distribution: buildCompatibilityOperatorProfileModeDistribution(
        semanticArtifactFields.semantic_resolution_distribution
      ),
      category_summary_source_distribution: buildCategorySummarySourceDistribution(bucketFilteredSenders),
      sender_activity_timeline: senderActivityTimeline.items,
      sender_activity_timeline_granularity: senderActivityTimeline.granularity,
      cluster_contribution: buildClusterContributionMetrics({
        senders: bucketFilteredSenders,
        clusterMessageCount: selectedClusterMessageCount,
      }),
    },
    view: {
      search: searchInput,
      filter,
      sort,
      direction,
    },
    exceptions_count: bucketFilteredSenders.filter((sender) => sender.requires_verification).length,
    source: 'gmail_index_cache',
  }

  return { ok: true, data }
}

function artifactPreviewSender(row: GmailPreviewIndexRow): string {
  const previewPayload = artifactRecord(row.preview_payload) || {}
  return artifactNullableText(row.sender) || artifactNullableText(previewPayload.from) || 'Unknown sender'
}

function artifactPreviewProtectionLabel(row: GmailPreviewIndexRow): string | null {
  return (
    artifactNullableText(row.protected_hint) ||
    (row.is_starred
      ? 'Starred messages present'
      : row.is_important
        ? 'Important messages present'
        : Array.isArray(row.category_labels) && row.category_labels.includes('CATEGORY_PRIMARY')
          ? 'Primary-category evidence present'
          : null)
  )
}

function sortArtifactPreviewRows(rows: GmailPreviewIndexRow[]): GmailPreviewIndexRow[] {
  return rows
    .slice()
    .sort(
      (left, right) =>
        (right.internal_date_ms || 0) - (left.internal_date_ms || 0) ||
        right.message_id.localeCompare(left.message_id)
    )
}

function isArchiveScopePreviewRow(row: GmailPreviewIndexRow): boolean {
  return row.is_in_inbox === true
}

function resolveArchivePolicyPreviewRows(params: {
  rows: GmailPreviewIndexRow[]
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}) {
  const archiveRows: GmailPreviewIndexRow[] = []
  let protectedExclusionsCount = 0

  for (const row of sortArtifactPreviewRows(params.rows)) {
    if (!isArchiveScopePreviewRow(row)) continue
    const senderKey = normalizeSender(artifactPreviewSender(row)) || row.sender_key
    const policy = latestPolicyForSender(params.senderPolicies, senderKey)
    const override = params.messageOverrides[row.message_id]
    const protectedReason = artifactPreviewProtectionLabel(row)

    if (override === 'exclude') {
      if (policy === 'archive') protectedExclusionsCount += 1
      continue
    }

    const shouldArchive = policy === 'archive' || override === 'include'
    if (!shouldArchive) continue

    if (protectedReason && override !== 'include') {
      protectedExclusionsCount += 1
      continue
    }

    archiveRows.push(row)
  }

  return { archiveRows, protectedExclusionsCount }
}

function buildConfirmationPreviewGroups(params: {
  seedRows: GmailSenderWorkspaceSeedRow[]
  senderPolicies: Record<string, GmailSenderPolicy>
  archiveMessageCountBySenderKey?: ReadonlyMap<string, number>
}) {
  const groups = new Map<
    GmailSenderPolicy,
    {
      policy: GmailSenderPolicy
      label: string
      senderCounts: Map<string, { sender: string; count: number }>
      messageCount: number
    }
  >()

  const pushToGroup = (policy: GmailSenderPolicy, senderKey: string, sender: string, count: number) => {
    const existing =
      groups.get(policy) ||
      {
        policy,
        label:
          policy === 'archive'
            ? 'Archive after approval'
            : policy === 'keep'
              ? 'Keep as a future preference'
              : policy === 'quarantine'
                ? 'Store quarantine decision'
                : policy === 'unsubscribe'
                  ? 'Store unsubscribe decision'
                  : policy === 'custom_rule'
                    ? 'Store custom rule decision'
                    : 'No decision yet',
        senderCounts: new Map<string, { sender: string; count: number }>(),
        messageCount: 0,
      }
    existing.messageCount += count
    const current = existing.senderCounts.get(senderKey) || { sender, count: 0 }
    current.count += count
    existing.senderCounts.set(senderKey, current)
    groups.set(policy, existing)
  }

  for (const row of params.seedRows) {
    const senderKey = row.sender_key
    const sender = artifactText(row.sender) || 'Unknown sender'
    const policy = latestPolicyForSender(params.senderPolicies, senderKey)
    const messageCount =
      policy === 'archive'
        ? params.archiveMessageCountBySenderKey?.get(senderKey) || 0
        : row.cleanup_group_message_count
    pushToGroup(policy, senderKey, sender, messageCount)
  }

  return Array.from(groups.values())
    .map((group) => ({
      policy: group.policy,
      label: group.label,
      sender_count: group.senderCounts.size,
      message_count: group.messageCount,
      senders: Array.from(group.senderCounts.entries())
        .map(([senderKey, value]) => ({
          sender_key: senderKey,
          sender: value.sender,
          message_count: value.count,
        }))
        .sort((a, b) => b.message_count - a.message_count || a.sender.localeCompare(b.sender))
        .slice(0, 8),
    }))
    .sort((a, b) => b.message_count - a.message_count || a.label.localeCompare(b.label))
}

function buildConfirmationPreviewFutureBehaviorSummary(
  groups: GmailConfirmationPreviewData['groups']
): GmailConfirmationPreviewData['future_behavior_summary'] {
  const futureBehaviorPolicies: Array<Exclude<GmailSenderPolicy, 'archive' | 'undecided'>> = [
    'keep',
    'quarantine',
    'unsubscribe',
    'custom_rule',
  ]

  return futureBehaviorPolicies.map((policy) => {
    const group = groups.find((entry) => entry.policy === policy)
    return {
      policy,
      sender_count: group?.sender_count || 0,
      message_count: group?.message_count || 0,
      behavior:
        policy === 'keep'
          ? 'Stored as a future keep preference in Phase 1. It does not execute a Gmail change now.'
          : policy === 'quarantine'
            ? 'Stored as a future quarantine decision in Phase 1. It does not execute a Gmail change now.'
            : policy === 'unsubscribe'
              ? 'Stored as a future unsubscribe decision in Phase 1. It does not execute a Gmail change now.'
              : 'Stored as a future custom-rule decision in Phase 1. It does not execute a Gmail change now.',
    }
  })
}

export async function loadGmailSenderDistributionForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  clusters: ClusterInput[]
  analysisScope?: GmailAnalysisScope
  selectedCluster: ClusterInput
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  reviewUnitId?: string | null
  cacheVersion?: string | null
  requestAgentId?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindow?: Extract<GmailPressureTrendWindow, 'last_day' | 'custom'> | null
  senderOverviewStart?: string | null
  senderOverviewEnd?: string | null
  timeZone?: string | null
}): Promise<
  | GmailArtifactSuccess<GmailSenderDistributionData>
  | { ok: true; data: GmailSenderDistributionData }
  | ReturnType<typeof fail>
> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')

  const normalizedClusters = normalizeClusters(params.clusters)
  const selectedCluster = canonicalizeSelectedCluster({
    clusters: ensureSelectedClusterIncluded(normalizedClusters, params.selectedCluster),
    selectedCluster: params.selectedCluster,
  })
  if (!selectedCluster) {
    return fail(400, 'selected_cluster is required for sender_distribution.')
  }

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const semanticFocus = normalizeSenderWorkspaceSemanticFocus(params.semanticFocus)
  const reviewUnitId = artifactText(params.reviewUnitId)
  const senderOverviewWindow = normalizeSenderOverviewWindow(params.senderOverviewWindow)

  if (normalizeTimeContextBucketLabel(params.timeContextBucketLabel) || senderOverviewWindow) {
    return loadTimeContextProjectionUnavailable({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    })
  }

  if (params.tenantId) {
    return loadSenderDistributionFromArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      selectedCluster,
      semanticFocus,
      reviewUnitId,
    })
  }

  if (
    analysisScope === 'all_indexed' &&
    !normalizeTimeContextBucketLabel(params.timeContextBucketLabel) &&
    !senderOverviewWindow &&
    shouldUseSenderWorkspaceArtifactRead({
      tenantId: params.tenantId,
      analysisScope,
    })
  ) {
    return loadSenderDistributionFromArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      selectedCluster,
      semanticFocus,
      reviewUnitId,
    })
  }

  return loadSenderDistributionFromLiveBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    selectedCluster,
    clusters: ensureSelectedClusterIncluded(normalizedClusters, selectedCluster),
    semanticFocus,
    cacheVersion: params.cacheVersion ?? null,
    timeContextBucketLabel: params.timeContextBucketLabel ?? null,
    timeContextBucketStartAt: params.timeContextBucketStartAt ?? null,
    timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt ?? null,
    senderOverviewWindow,
    senderOverviewStart: params.senderOverviewStart ?? null,
    senderOverviewEnd: params.senderOverviewEnd ?? null,
    timeZone: params.timeZone ?? null,
  })
}

function buildConfirmationPreviewFromArtifact(params: {
  analysisScope: GmailAnalysisScope
  publication: GmailArtifactPublicationRow
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selectedCluster: ClusterInput
  selectedHeader: GmailSenderWorkspaceSeedHeaderRow
  seedRows: GmailSenderWorkspaceSeedRow[]
  previewRows: GmailPreviewIndexRow[]
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}): ConfirmationResolution {
  const cleanupCandidateMessageCount = params.headers.reduce(
    (sum, header) => sum + artifactInteger(header.message_count),
    0
  )
  const archiveResolution = resolveArchivePolicyPreviewRows({
    rows: params.previewRows,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides,
  })
  const archiveRowsBySender = new Map<string, GmailPreviewIndexRow[]>()
  for (const row of archiveResolution.archiveRows) {
    const current = archiveRowsBySender.get(row.sender_key) || []
    current.push(row)
    archiveRowsBySender.set(row.sender_key, current)
  }
  const archiveMessageCountBySenderKey = new Map(
    Array.from(archiveRowsBySender.entries()).map(([senderKey, rows]) => [senderKey, rows.length])
  )
  const groups = buildConfirmationPreviewGroups({
    seedRows: params.seedRows,
    senderPolicies: params.senderPolicies,
    archiveMessageCountBySenderKey,
  })

  const archiveMessageIdsBySender = Array.from(archiveRowsBySender.entries()).reduce<
    Record<string, string[]>
  >((acc, [senderKey, rows]) => {
    acc[senderKey] = rows.map((row) => row.message_id)
    return acc
  }, {})

  return {
    publication: params.publication,
    preview: {
      analysis_scope: params.analysisScope,
      scope_ladder: buildScopeLadderCounts({
        wholeMailbox: artifactInteger(params.publication.last_indexed_message_count),
        cleanupCandidate: cleanupCandidateMessageCount,
        cleanupGroup: artifactInteger(params.selectedHeader.message_count),
        senderSet: artifactInteger(params.selectedHeader.sender_count, params.seedRows.length),
        loadedPreviewRows: params.previewRows.length,
      }),
      selected_cluster: {
        cluster_id: params.selectedCluster.cluster_id,
        title: params.selectedHeader.title || params.selectedCluster.title,
        message_count: artifactInteger(params.selectedHeader.message_count),
        sender_count: artifactInteger(params.selectedHeader.sender_count, params.seedRows.length),
      },
      exact_archive_impact: {
        sender_count: new Set(archiveResolution.archiveRows.map((row) => row.sender_key)).size,
        message_count: archiveResolution.archiveRows.length,
        message_id_sample: archiveResolution.archiveRows.slice(0, 25).map((row) => row.message_id),
      },
      future_behavior_summary: buildConfirmationPreviewFutureBehaviorSummary(groups),
      protected_exclusions_count: archiveResolution.protectedExclusionsCount,
      undecided_sender_count: groups.find((entry) => entry.policy === 'undecided')?.sender_count || 0,
      groups,
      source: 'gmail_index_cache',
    },
    archiveMessageIds: archiveResolution.archiveRows.map((row) => row.message_id),
    archiveMessageIdsBySender,
  }
}

async function loadConfirmationResolutionFromArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailAnalysisScope
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
  logPrefix: string
}): Promise<ConfirmationResolution | ReturnType<typeof fail>> {
  try {
    const availabilityFailure = await loadPublishedArtifactAvailabilityFailure(params)
    if (availabilityFailure) return availabilityFailure
    const artifactSelectedClusterId = artifactClusterLookupId(params.selectedCluster)
    const preflightRead = await loadPublishedGmailSenderWorkspaceArtifactPage({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: normalizeMailboxProfileScope(params.analysisScope),
      selectedClusterId: artifactSelectedClusterId,
      page: 1,
      pageSize: 1,
    })
    const publicationFailure = publishedArtifactAvailabilityFailure(preflightRead.publication)
    if (publicationFailure) return publicationFailure
    if (!preflightRead.selected_header) {
      return fail(404, 'The selected cleanup group is unavailable in the published artifact.', {
        reason: 'missing_selected_cluster_seed',
      })
    }
    if (artifactInteger(preflightRead.selected_header.sender_count) > MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE) {
      return fail(409, 'Confirmation preview exceeds the accepted artifact page budget.', {
        reason: 'artifact_row_budget_exceeded',
      })
    }
    const overrideMessageIds = Object.keys(params.messageOverrides)
      .map((messageId) => artifactText(messageId))
      .filter(Boolean)
    const artifactRead = await loadPublishedGmailSenderWorkspaceExecutionArtifact({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: normalizeMailboxProfileScope(params.analysisScope),
      selectedClusterId: artifactSelectedClusterId,
      previewSenderKeys: [],
      previewMessageIds: [],
    })

    const artifactPublicationFailure = publishedArtifactAvailabilityFailure(artifactRead.publication)
    if (artifactPublicationFailure) return artifactPublicationFailure
    if (!artifactRead.publication) {
      return fail(503, 'Published Gmail runtime artifacts are unavailable.', {
        reason: 'missing_published_artifact',
        retryAfterMs: 15_000,
      })
    }
    if (!artifactRead.selected_header) {
      return fail(404, 'The selected cleanup group is unavailable in the published artifact.', {
        reason: 'missing_selected_cluster_seed',
      })
    }

    if (artifactInteger(artifactRead.selected_header.sender_count) > 0 && artifactRead.seed_rows.length === 0) {
      return fail(503, 'Published confirmation seed rows are incomplete.', {
        reason: 'missing_sender_seed_rows',
      })
    }

    const archiveSenderKeys = artifactRead.seed_rows
      .filter((row) => latestPolicyForSender(params.senderPolicies, row.sender_key) === 'archive')
      .map((row) => row.sender_key)
    const senderPreviewRead =
      archiveSenderKeys.length > 0
        ? await loadPublishedGmailSenderWorkspaceExecutionArtifact({
            supabase: params.supabase,
            tenantId: params.tenantId,
            analysisScope: normalizeMailboxProfileScope(params.analysisScope),
            selectedClusterId: artifactSelectedClusterId,
            previewSenderKeys: archiveSenderKeys,
            previewMessageIds: [],
          })
        : artifactRead
    const messagePreviewRead =
      overrideMessageIds.length > 0
        ? await loadPublishedGmailSenderWorkspaceExecutionArtifact({
            supabase: params.supabase,
            tenantId: params.tenantId,
            analysisScope: normalizeMailboxProfileScope(params.analysisScope),
            selectedClusterId: artifactSelectedClusterId,
            previewSenderKeys: [],
            previewMessageIds: overrideMessageIds,
          })
        : artifactRead
    const executionPreviewRows = Array.from(
      new Map(
        [...senderPreviewRead.preview_index_rows, ...messagePreviewRead.preview_index_rows].map(
          (row) => [`${row.sender_key}::${row.message_id}::${row.preview_rank}`, row] as const
        )
      ).values()
    )

    const previewRowsBySenderKey = new Map<string, GmailPreviewIndexRow[]>()
    const loadedPreviewMessageIds = new Set<string>()
    for (const row of executionPreviewRows) {
      const current = previewRowsBySenderKey.get(row.sender_key) || []
      current.push(row)
      previewRowsBySenderKey.set(row.sender_key, current)
      loadedPreviewMessageIds.add(row.message_id)
    }

    for (const senderKey of archiveSenderKeys) {
      const seedRow = artifactRead.seed_rows.find((row) => row.sender_key === senderKey)
      const senderPreviewRows = previewRowsBySenderKey.get(senderKey) || []
      const archiveScopeActualCount = senderPreviewRows.filter(isArchiveScopePreviewRow).length
      const expectedArchiveScopeCount =
        senderPreviewRows.length > 0 && archiveScopeActualCount === 0
          ? 0
          : Math.max(0, seedRow?.cleanup_group_message_count || 0)
      if (seedRow && archiveScopeActualCount !== expectedArchiveScopeCount) {
        return fail(503, 'Published confirmation preview rows are incomplete.', {
          reason: 'incomplete_preview_index',
        })
      }
    }

    const seededPreviewMessageIds = new Set(
      artifactRead.seed_rows.flatMap((row) => artifactStringArray(row.preview_message_ids))
    )
    for (const messageId of overrideMessageIds) {
      if (seededPreviewMessageIds.has(messageId) && !loadedPreviewMessageIds.has(messageId)) {
        return fail(503, 'Published override preview rows are incomplete.', {
          reason: 'missing_override_preview_row',
        })
      }
    }

    const resolution = buildConfirmationPreviewFromArtifact({
      analysisScope: params.analysisScope,
      publication: artifactRead.publication,
      headers: artifactRead.headers,
      selectedCluster: params.selectedCluster,
      selectedHeader: artifactRead.selected_header,
      seedRows: artifactRead.seed_rows,
      previewRows: executionPreviewRows,
      senderPolicies: params.senderPolicies,
      messageOverrides: params.messageOverrides,
    })

    console.info(
      `${params.logPrefix} ${JSON.stringify({
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        selected_cluster_id: params.selectedCluster.cluster_id,
        artifact_selected_cluster_id: artifactSelectedClusterId,
        artifact_version: artifactRead.artifact_version,
        mode: 'published_artifact',
        artifact_freshness_state: artifactRead.publication?.freshness_state ?? null,
        artifact_refresh_strategy: artifactRead.publication?.refresh_strategy ?? null,
        seed_row_count: artifactRead.seed_rows.length,
        execution_preview_row_count: executionPreviewRows.length,
        archive_sender_count: archiveSenderKeys.length,
        archive_message_count: resolution.archiveMessageIds.length,
      })}`
    )

    return resolution
  } catch (error) {
    console.warn(`${params.logPrefix} read failed closed:`, error)
    return fail(503, 'Published confirmation artifacts could not be loaded.', {
      reason: 'artifact_read_error',
      retryAfterMs: 15_000,
    })
  }
}

export async function loadGmailConfirmationPreviewForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<GmailArtifactSuccess<GmailConfirmationPreviewData> | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const normalizedClusters = normalizeClusters(params.clusters)
  const requestedSelectedCluster = normalizeClusters([params.selectedCluster])[0]
  const clusters = canonicalizeClusterCollection(
    requestedSelectedCluster ? [...normalizedClusters, requestedSelectedCluster] : normalizedClusters
  )
  const selectedCluster = requestedSelectedCluster
    ? canonicalizeSelectedCluster({
        clusters: normalizedClusters,
        selectedCluster: requestedSelectedCluster,
      })
    : null
  if (!selectedCluster) return fail(400, 'selected_cluster is required for confirmation_preview.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for confirmation_preview.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const resolution = await loadConfirmationResolutionFromArtifact({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    selectedCluster,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides || {},
    logPrefix: GMAIL_CONFIRMATION_PREVIEW_ARTIFACT_LOG_PREFIX,
  })

  if ('ok' in resolution) return resolution

  return {
    ok: true,
    data: resolution.preview,
    publication: resolution.publication,
  }
}

export async function resolveGmailSenderPolicyArchiveScopeForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<
  | {
      ok: true
      data: {
        messageIds: string[]
        messageIdsBySender: Record<string, string[]>
        selectedCount: number
        matchingMessagesInScope: number
        senderCount: number
      }
    }
  | ReturnType<typeof fail>
> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const normalizedClusters = normalizeClusters(params.clusters)
  const requestedSelectedCluster = normalizeClusters([params.selectedCluster])[0]
  const clusters = canonicalizeClusterCollection(
    requestedSelectedCluster ? [...normalizedClusters, requestedSelectedCluster] : normalizedClusters
  )
  const selectedCluster = requestedSelectedCluster
    ? canonicalizeSelectedCluster({
        clusters: normalizedClusters,
        selectedCluster: requestedSelectedCluster,
      })
    : null
  if (!selectedCluster) return fail(400, 'selected_cluster is required for archive resolution.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for archive resolution.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const resolution = await loadConfirmationResolutionFromArtifact({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    selectedCluster,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides || {},
    logPrefix: GMAIL_ARCHIVE_SCOPE_ARTIFACT_LOG_PREFIX,
  })
  if ('ok' in resolution) return resolution
  const selectedClusterMessageCount = resolution.preview.selected_cluster.message_count

  return {
    ok: true,
    data: {
      messageIds: resolution.archiveMessageIds,
      messageIdsBySender: resolution.archiveMessageIdsBySender,
      selectedCount: resolution.preview.exact_archive_impact.message_count,
      matchingMessagesInScope: selectedClusterMessageCount,
      senderCount: resolution.preview.exact_archive_impact.sender_count,
    },
  }
}
