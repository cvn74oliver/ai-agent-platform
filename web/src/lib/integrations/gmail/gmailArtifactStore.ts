import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GmailAssignedCleanupGroupId,
  GmailCleanupAssignmentReason,
  GmailCleanupExclusionReason,
  GmailSenderWorkspaceSemanticFocus,
  GmailSenderWorkspaceSort,
  GmailSenderWorkspaceSortDirection,
} from '@/lib/runtime/gmailCleanupWorkspace'
import type {
  OperationsSelectedClusterRailFamily,
  OperationsSelectedClusterRailFamilyScopeEntry,
} from '@/lib/runtime/operationsWorkspace'
import {
  resolveCleanupClusterIdentity,
  type CleanupClusterIdentitySource,
} from '@/lib/runtime/gmailCleanupClusterIdentity'

export const GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS = [
  '7d',
  '30d',
  '60d',
  '90d',
  '180d',
  '365d',
  'all_indexed',
] as const

export type GmailArtifactAnalysisScope = (typeof GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS)[number]
export type GmailArtifactBuildStatus = 'idle' | 'building' | 'published' | 'failed'
export type GmailArtifactJobType = 'shadow_publish' | 'full_rebuild' | 'incremental_refresh'
export type GmailArtifactJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export const GMAIL_ARTIFACT_FRESHNESS_STATE_OPTIONS = [
  'fresh',
  'stale',
  'refresh_pending',
  'refresh_in_progress',
  'refresh_failed',
  'refresh_skipped',
  'full_rebuild_required',
] as const
export type GmailArtifactFreshnessState =
  (typeof GMAIL_ARTIFACT_FRESHNESS_STATE_OPTIONS)[number]
export type GmailArtifactRefreshStrategy = 'incremental' | 'full_rebuild'

export type GmailArtifactPublicationRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  published_version: string | null
  published_at: string | null
  building_version: string | null
  build_status: GmailArtifactBuildStatus
  last_error: string | null
  last_error_at: string | null
  last_index_state_updated_at: string | null
  last_indexed_message_count: number | null
  freshness_state: GmailArtifactFreshnessState
  freshness_reason: string | null
  refresh_strategy: GmailArtifactRefreshStrategy | null
  refresh_requested_at: string | null
  refresh_started_at: string | null
  refresh_completed_at: string | null
  refresh_job_id: string | null
  refresh_sync_run_id: string | null
  created_at: string
  updated_at: string
}

export type GmailArtifactPublicationRestoreState = Pick<
  GmailArtifactPublicationRow,
  | 'published_version'
  | 'published_at'
  | 'building_version'
  | 'build_status'
  | 'last_error'
  | 'last_error_at'
  | 'last_index_state_updated_at'
  | 'last_indexed_message_count'
  | 'freshness_state'
  | 'freshness_reason'
  | 'refresh_strategy'
  | 'refresh_requested_at'
  | 'refresh_started_at'
  | 'refresh_completed_at'
  | 'refresh_job_id'
  | 'refresh_sync_run_id'
>

export type GmailArtifactPublicationCompareAndSetExpectation = {
  published_version?: string | null
  building_version?: string | null
  build_status?: GmailArtifactBuildStatus | null
  refresh_job_id?: string | null
  last_index_state_updated_at?: string | null
  last_indexed_message_count?: number | null
}

export type GmailArtifactJobRow = {
  job_id: string
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  job_type: GmailArtifactJobType
  status: GmailArtifactJobStatus
  phase: string | null
  sender_checkpoint: string | null
  message_checkpoint: string | null
  cluster_checkpoint: string | null
  processed_sender_count: number
  processed_message_count: number
  processed_cluster_count: number
  heartbeat_at: string | null
  started_at: string | null
  completed_at: string | null
  last_error: string | null
  last_error_at: string | null
  created_at: string
  updated_at: string
}

export const GMAIL_ARTIFACT_BUILD_RECLAIM_REASONS = [
  'refresh_reclaimed_missing_job',
  'refresh_reclaimed_mismatched_job',
  'refresh_reclaimed_stale_build',
  'refresh_reclaimed_terminal_job',
] as const

export type GmailArtifactBuildReclaimReason =
  (typeof GMAIL_ARTIFACT_BUILD_RECLAIM_REASONS)[number]

export type GmailArtifactBuildLivenessStatus =
  | 'no_build'
  | 'build_live'
  | 'build_starting_without_job'
  | 'build_starting_without_job_row'
  | 'reclaimed_stale_build'

export type GmailArtifactBuildLivenessResult = {
  publication: GmailArtifactPublicationRow | null
  job: GmailArtifactJobRow | null
  build_is_live: boolean
  reclaim_applied: boolean
  reclaim_reason: GmailArtifactBuildReclaimReason | null
  status: GmailArtifactBuildLivenessStatus
}

export type GmailSenderWorkspaceSeedHeaderRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  cluster_id: string
  artifact_version: string
  cluster_type: string
  title: string
  query: string
  why_selected: string | null
  risk_note: string | null
  safety_note: string | null
  message_count: number
  sender_count: number
  share_pct: number
  pagination: Record<string, unknown>
  analytics: Record<string, unknown>
  source?: string
  created_at?: string
  updated_at?: string
}

export type GmailSenderWorkspaceSeedRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  cluster_id: string
  sender_key: string
  artifact_version: string
  default_rank: number
  sender: string
  sender_domain: string | null
  cleanup_group_message_count: number
  unread_count: number
  protected_hint: string | null
  requires_verification: boolean
  verification_reasons: string[]
  preview_message_ids: string[]
  preview_ready: boolean
  semantic_family_key: string | null
  semantic_subtype_key: string | null
  semantic_pattern_key: string | null
  last_activity_at: string | null
  seed_payload: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type GmailClusterSummaryArtifactRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  cluster_id: string
  artifact_version: string
  cluster_type: string
  title: string
  query: string
  why_selected: string | null
  risk_note: string | null
  safety_note: string | null
  message_count: number
  sender_count: number
  share_pct: number
  dominant_sender: string | null
  dominant_pattern: string | null
  protected_message_count: number
  uncertain_sender_count: number
  summary_payload: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type GmailMailboxIntelligenceSnapshotRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  snapshot_payload: Record<string, unknown>
  source?: string
  created_at?: string
  updated_at?: string
}

export type GmailMailboxIntelligenceBucketRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  bucket_kind: string
  bucket_key: string
  bucket_start_at: string
  bucket_end_at: string | null
  bucket_value: number
  bucket_payload: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type SelectedClusterRailSnapshotScopeFallback = {
  cluster_present: boolean
  cluster_title: string | null
  visible_cluster_count: number
  message_count: number | null
  dominant_sender: string | null
  semantic_resolution_distribution: NonNullable<
    OperationsSelectedClusterRailFamilyScopeEntry['signal']
  >['semantic_resolution_distribution']
  timeline: OperationsSelectedClusterRailFamilyScopeEntry['timeline']
}

export type SelectedClusterRailFamilyScopeResolutionSource =
  | 'artifact_ready'
  | 'artifact_outside_timeframe'
  | 'snapshot_ready'
  | 'snapshot_outside_timeframe'
  | 'unavailable_scope'

export type SelectedClusterRailFamilyScopeResolution = {
  scope: GmailArtifactAnalysisScope
  source: SelectedClusterRailFamilyScopeResolutionSource
  artifact_version: string | null
  visible_cluster_count: number
  snapshot_available: boolean
  selected_cluster_present_in_snapshot: boolean
  published_header_present: boolean
  published_cluster_present: boolean
}

export type SelectedClusterRailFamilyLoadResult = {
  family: OperationsSelectedClusterRailFamily
  scope_resolution: SelectedClusterRailFamilyScopeResolution[]
  cache_status: 'hit' | 'miss'
}

type SelectedClusterRailFamilyBuildResult = {
  family: OperationsSelectedClusterRailFamily
  scope_resolution: SelectedClusterRailFamilyScopeResolution[]
}

type SelectedClusterRailSummarySurfaceRow = Pick<
  GmailClusterSummaryArtifactRow,
  'tenant_id' | 'analysis_scope' | 'cluster_id' | 'artifact_version' | 'title' | 'dominant_sender'
>

type SelectedClusterRailHeaderSurfaceRow = Pick<
  GmailSenderWorkspaceSeedHeaderRow,
  'tenant_id' | 'analysis_scope' | 'cluster_id' | 'artifact_version' | 'title' | 'message_count' | 'analytics'
>

export type GmailPreviewIndexRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  cluster_id: string
  sender_key: string
  artifact_version: string
  preview_rank: number
  message_id: string
  thread_id: string | null
  sender: string | null
  subject: string | null
  snippet: string | null
  internal_date_ms: number | null
  date: string | null
  label_ids: string[]
  category_labels: string[]
  is_in_inbox: boolean
  is_unread: boolean
  is_important: boolean
  is_starred: boolean
  protected_hint: string | null
  preview_payload: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type GmailSenderScopeRollupRow = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  sender_key: string
  sender: string
  assigned_cleanup_group_id: GmailAssignedCleanupGroupId
  assignment_reason: GmailCleanupAssignmentReason
  is_cleanup_candidate: boolean
  total_message_count: number
  cleanup_candidate_message_count: number
  protected_message_count: number
  likely_human_message_count: number
  unread_count: number
  first_seen: string | null
  last_seen: string | null
  category_summary: string
  sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  cleanup_exclusion_reason: GmailCleanupExclusionReason | null
  created_at?: string
  updated_at?: string
}

export type GmailShadowArtifactBundle = {
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  last_index_state_updated_at?: string | null
  last_indexed_message_count?: number | null
  sender_workspace_seed_headers: GmailSenderWorkspaceSeedHeaderRow[]
  sender_workspace_seed_rows: GmailSenderWorkspaceSeedRow[]
  cluster_summaries: GmailClusterSummaryArtifactRow[]
  mailbox_intelligence_snapshots: GmailMailboxIntelligenceSnapshotRow[]
  mailbox_intelligence_buckets: GmailMailboxIntelligenceBucketRow[]
  preview_index_rows: GmailPreviewIndexRow[]
}

export type GmailShadowArtifactWriteResult = {
  job_id: string
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  published: boolean
  row_counts: {
    sender_workspace_seed_headers: number
    sender_workspace_seed_rows: number
    cluster_summaries: number
    mailbox_intelligence_snapshots: number
    mailbox_intelligence_buckets: number
    preview_index_rows: number
  }
}

export type GmailPublishedSenderWorkspaceArtifactRead = {
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
  seed_rows: GmailSenderWorkspaceSeedRow[]
  preview_index_rows: GmailPreviewIndexRow[]
  preview_fetch_strategy?: 'message_id' | 'sender_key'
}

export type GmailPublishedSenderWorkspaceExecutionArtifactRead = {
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
  seed_rows: GmailSenderWorkspaceSeedRow[]
  preview_index_rows: GmailPreviewIndexRow[]
}

export type GmailPublishedSenderWorkspaceFocusedArtifactRead = {
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
  seed_rows: GmailSenderWorkspaceSeedRow[]
  preview_index_rows: GmailPreviewIndexRow[]
  preview_fetch_strategy?: 'message_id' | 'sender_key'
  focused_total_senders: number
  focused_capability_available: boolean
}

export type GmailPublishedMailboxIntelligenceArtifactRead = {
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  snapshot: GmailMailboxIntelligenceSnapshotRow | null
  cluster_summaries: GmailClusterSummaryArtifactRow[]
  buckets: GmailMailboxIntelligenceBucketRow[]
}

const GMAIL_ARTIFACT_WRITE_BATCH_SIZE = 500
const GMAIL_ARTIFACT_STORE_RETRY_ATTEMPTS = 4
const GMAIL_ARTIFACT_STORE_RETRY_DELAY_MS = 750
const GMAIL_ARTIFACT_READ_BATCH_SIZE = 500
const GMAIL_ARTIFACT_PREVIEW_COUNT_PAGE_SIZE = 1000
const GMAIL_ARTIFACT_PREVIEW_SENDER_KEY_READ_BATCH_SIZE = 200
const GMAIL_ARTIFACT_PREVIEW_REPLACE_DELETE_SENDER_BATCH_SIZE = 100
const GMAIL_ARTIFACT_PREVIEW_REPLACE_DELETE_ROW_LIMIT = 1000
const GMAIL_ARTIFACT_SENDER_KEY_READ_BATCH_SIZE = 1000
const GMAIL_ARTIFACT_CLUSTER_READ_CONCURRENCY = 3
const GMAIL_ARTIFACT_BUILD_STALL_THRESHOLD_MS = Math.max(
  60 * 1000,
  Number.parseInt(process.env.GMAIL_ARTIFACT_BUILD_STALL_THRESHOLD_MS ?? '', 10) || 30 * 60 * 1000
)
const GMAIL_ARTIFACT_BUILD_JOB_GRACE_MS = Math.max(
  5 * 1000,
  Math.min(
    GMAIL_ARTIFACT_BUILD_STALL_THRESHOLD_MS,
    Number.parseInt(process.env.GMAIL_ARTIFACT_BUILD_JOB_GRACE_MS ?? '', 10) || 60 * 1000
  )
)
const GMAIL_ARTIFACT_PUBLICATION_CACHE_TTL_MS = 1000 * 5
const GMAIL_ARTIFACT_VERSIONED_READ_CACHE_TTL_MS = 1000 * 60 * 5
const GMAIL_ARTIFACT_PUBLICATION_SELECT =
  'tenant_id,analysis_scope,published_version,published_at,building_version,build_status,last_error,last_error_at,last_index_state_updated_at,last_indexed_message_count,freshness_state,freshness_reason,refresh_strategy,refresh_requested_at,refresh_started_at,refresh_completed_at,refresh_job_id,refresh_sync_run_id,created_at,updated_at'
const SELECTED_CLUSTER_RAIL_SUMMARY_SELECT =
  'tenant_id,analysis_scope,cluster_id,artifact_version,title,dominant_sender'
const SELECTED_CLUSTER_RAIL_HEADER_SELECT =
  'tenant_id,analysis_scope,cluster_id,artifact_version,title,message_count,analytics'

type CachedPublicationStateEntry = {
  expires_at_ms: number
  data: GmailArtifactPublicationRow | null
}

type CachedSenderWorkspaceHeaderEntry = {
  expires_at_ms: number
  data: GmailSenderWorkspaceSeedHeaderRow[]
}

type CachedSenderWorkspaceSenderKeysEntry = {
  expires_at_ms: number
  data: string[]
}

type CachedSelectedClusterRailFamilyEntry = {
  expires_at_ms: number
  data: Omit<SelectedClusterRailFamilyLoadResult, 'cache_status'>
}

const gmailArtifactStoreGlobal = globalThis as typeof globalThis & {
  __gmailArtifactPublicationStateCache?: Map<string, CachedPublicationStateEntry>
  __gmailArtifactPublicationStateInflight?: Map<string, Promise<GmailArtifactPublicationRow | null>>
  __gmailArtifactSenderWorkspaceHeaderCache?: Map<string, CachedSenderWorkspaceHeaderEntry>
  __gmailArtifactSenderWorkspaceHeaderInflight?: Map<string, Promise<GmailSenderWorkspaceSeedHeaderRow[]>>
  __gmailArtifactSenderWorkspaceSenderKeysCache?: Map<
    string,
    CachedSenderWorkspaceSenderKeysEntry
  >
  __gmailArtifactSenderWorkspaceSenderKeysInflight?: Map<string, Promise<string[]>>
  __gmailArtifactSelectedClusterRailFamilyCache?: Map<string, CachedSelectedClusterRailFamilyEntry>
  __gmailArtifactSelectedClusterRailFamilyInflight?: Map<
    string,
    Promise<Omit<SelectedClusterRailFamilyLoadResult, 'cache_status'>>
  >
}

const publicationStateCache =
  gmailArtifactStoreGlobal.__gmailArtifactPublicationStateCache ||
  new Map<string, CachedPublicationStateEntry>()
if (!gmailArtifactStoreGlobal.__gmailArtifactPublicationStateCache) {
  gmailArtifactStoreGlobal.__gmailArtifactPublicationStateCache = publicationStateCache
}

const publicationStateInflight =
  gmailArtifactStoreGlobal.__gmailArtifactPublicationStateInflight ||
  new Map<string, Promise<GmailArtifactPublicationRow | null>>()
if (!gmailArtifactStoreGlobal.__gmailArtifactPublicationStateInflight) {
  gmailArtifactStoreGlobal.__gmailArtifactPublicationStateInflight = publicationStateInflight
}

const senderWorkspaceHeaderCache =
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderCache ||
  new Map<string, CachedSenderWorkspaceHeaderEntry>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderCache) {
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderCache = senderWorkspaceHeaderCache
}

const senderWorkspaceHeaderInflight =
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderInflight ||
  new Map<string, Promise<GmailSenderWorkspaceSeedHeaderRow[]>>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderInflight) {
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceHeaderInflight =
    senderWorkspaceHeaderInflight
}

const senderWorkspaceSenderKeysCache =
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysCache ||
  new Map<string, CachedSenderWorkspaceSenderKeysEntry>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysCache) {
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysCache =
    senderWorkspaceSenderKeysCache
}

const senderWorkspaceSenderKeysInflight =
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysInflight ||
  new Map<string, Promise<string[]>>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysInflight) {
  gmailArtifactStoreGlobal.__gmailArtifactSenderWorkspaceSenderKeysInflight =
    senderWorkspaceSenderKeysInflight
}

// Guardrail: this cache is intentionally limited to selected-cluster rail bootstrap
// during automatic rehydrate. It is not a shared runtime truth source.
const selectedClusterRailFamilyCache =
  gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyCache ||
  new Map<string, CachedSelectedClusterRailFamilyEntry>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyCache) {
  gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyCache =
    selectedClusterRailFamilyCache
}

const selectedClusterRailFamilyInflight =
  gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyInflight ||
  new Map<string, Promise<Omit<SelectedClusterRailFamilyLoadResult, 'cache_status'>>>()
if (!gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyInflight) {
  gmailArtifactStoreGlobal.__gmailArtifactSelectedClusterRailFamilyInflight =
    selectedClusterRailFamilyInflight
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value)
  return normalized ? normalized : null
}

function normalizeInteger(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return fallback
}

function normalizeBoolean(value: unknown): boolean {
  return value === true
}

function normalizeAnalysisScope(value: unknown): GmailArtifactAnalysisScope {
  return GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.includes(value as GmailArtifactAnalysisScope)
    ? (value as GmailArtifactAnalysisScope)
    : 'all_indexed'
}

function normalizeFreshnessState(value: unknown): GmailArtifactFreshnessState {
  return GMAIL_ARTIFACT_FRESHNESS_STATE_OPTIONS.includes(value as GmailArtifactFreshnessState)
    ? (value as GmailArtifactFreshnessState)
    : 'stale'
}

function normalizeBuildStatus(value: unknown): GmailArtifactBuildStatus {
  return value === 'idle' || value === 'building' || value === 'published' || value === 'failed'
    ? value
    : 'idle'
}

function normalizeRefreshStrategy(value: unknown): GmailArtifactRefreshStrategy | null {
  return value === 'incremental' || value === 'full_rebuild' ? value : null
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function cleanupClusterIdentitySourceFromHeader(
  header: Pick<GmailSenderWorkspaceSeedHeaderRow, 'cluster_id' | 'analytics'>
): CleanupClusterIdentitySource {
  const analytics =
    header.analytics && typeof header.analytics === 'object'
      ? (header.analytics as Record<string, unknown>)
      : {}
  return {
    clusterId: normalizeText(header.cluster_id),
    canonicalClusterId:
      normalizeNullableText(analytics.cleanup_group_canonical_cluster_id) ||
      normalizeText(header.cluster_id),
    legacyClusterIds: normalizeStringArray(analytics.cleanup_group_legacy_cluster_ids),
  }
}

function resolveCleanupClusterHeaderSelection(params: {
  requestedClusterId: string
  headers: GmailSenderWorkspaceSeedHeaderRow[]
}): {
  requested_cluster_id: string
  resolved_cluster_id: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
} {
  const requestedClusterId = normalizeText(params.requestedClusterId)
  const identity = resolveCleanupClusterIdentity(
    requestedClusterId,
    params.headers.map((header) => cleanupClusterIdentitySourceFromHeader(header))
  )
  const resolvedClusterId = identity.canonicalClusterId || requestedClusterId || null
  return {
    requested_cluster_id: requestedClusterId,
    resolved_cluster_id: resolvedClusterId,
    headers: params.headers,
    selected_header:
      params.headers.find((header) => header.cluster_id === resolvedClusterId) || null,
  }
}

function omitUndefinedValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as Partial<T>
}

function chunkArray<T>(rows: T[], size: number): T[][] {
  if (rows.length === 0) return []
  const chunks: T[][] = []
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size))
  }
  return chunks
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))
}

function normalizeRailTimelineFromHeader(
  header: SelectedClusterRailHeaderSurfaceRow | null | undefined
): OperationsSelectedClusterRailFamilyScopeEntry['timeline'] {
  const analytics = normalizeJsonObject(header?.analytics)
  const timelineItems = Array.isArray(analytics.sender_activity_timeline)
    ? analytics.sender_activity_timeline
        .map((entry) => {
          if (typeof entry !== 'object' || entry == null) return null
          const item = entry as Record<string, unknown>
          const label = normalizeText(item.label)
          if (!label) return null
          return {
            label,
            count: normalizeInteger(item.sender_count),
          }
        })
        .filter((entry): entry is { label: string; count: number } => entry != null)
    : []

  if (timelineItems.length === 0) return null

  return {
    granularity:
      analytics.sender_activity_timeline_granularity === 'day'
        ? 'day'
        : analytics.sender_activity_timeline_granularity === 'week'
          ? 'week'
          : 'month',
    items: timelineItems,
  }
}

function normalizeSemanticResolutionDistributionFromHeader(
  header: SelectedClusterRailHeaderSurfaceRow | null | undefined
): NonNullable<OperationsSelectedClusterRailFamilyScopeEntry['signal']>['semantic_resolution_distribution'] {
  const analytics = normalizeJsonObject(header?.analytics)
  return Array.isArray(analytics.semantic_resolution_distribution)
    ? analytics.semantic_resolution_distribution
        .map((entry) => {
          if (typeof entry !== 'object' || entry == null) return null
          const item = entry as Record<string, unknown>
          const scope = item.scope === 'pattern' ? 'pattern' : item.scope === 'family' ? 'family' : null
          const resolution =
            item.resolution === 'clear' || item.resolution === 'mixed' || item.resolution === 'thin_history'
              ? item.resolution
              : null
          if (!scope || !resolution) return null
          return {
            scope,
            resolution,
            sender_count: normalizeInteger(item.sender_count),
            share_pct:
              typeof item.share_pct === 'number' && Number.isFinite(item.share_pct)
                ? item.share_pct
                : 0,
          }
        })
        .filter(
          (
            entry
          ): entry is {
            scope: 'family' | 'pattern'
            resolution: 'clear' | 'mixed' | 'thin_history'
            sender_count: number
            share_pct: number
          } => entry != null
        )
    : []
}

export function buildSelectedClusterRailFamily(params: {
  requestedClusterId: string
  lookupClusterId?: string | null
  clusterTitle?: string | null
  publications: GmailArtifactPublicationRow[]
  clusterSummaries: SelectedClusterRailSummarySurfaceRow[]
  seedHeaders: SelectedClusterRailHeaderSurfaceRow[]
  snapshotFallbackByScope?: Partial<
    Record<GmailArtifactAnalysisScope, SelectedClusterRailSnapshotScopeFallback | null>
  >
}): SelectedClusterRailFamilyBuildResult {
  const requestedClusterId = normalizeText(params.requestedClusterId)
  const lookupClusterId = normalizeText(params.lookupClusterId) || requestedClusterId
  const fallbackClusterTitle = normalizeNullableText(params.clusterTitle)
  const publicationByScope = new Map<GmailArtifactAnalysisScope, GmailArtifactPublicationRow>()
  for (const publication of params.publications) {
    publicationByScope.set(normalizeAnalysisScope(publication.analysis_scope), publication)
  }

  const publishedVersionByScope = new Map<GmailArtifactAnalysisScope, string>()
  for (const scope of GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS) {
    const publishedVersion = normalizeNullableText(publicationByScope.get(scope)?.published_version)
    if (publishedVersion) publishedVersionByScope.set(scope, publishedVersion)
  }

  const clusterSummariesByScope = new Map<GmailArtifactAnalysisScope, SelectedClusterRailSummarySurfaceRow[]>()
  const selectedSummaryByScope = new Map<GmailArtifactAnalysisScope, SelectedClusterRailSummarySurfaceRow>()
  for (const summary of params.clusterSummaries) {
    const scope = normalizeAnalysisScope(summary.analysis_scope)
    const summaries = clusterSummariesByScope.get(scope) || []
    summaries.push(summary)
    clusterSummariesByScope.set(scope, summaries)
    if (normalizeText(summary.cluster_id) === lookupClusterId) {
      selectedSummaryByScope.set(scope, summary)
    }
  }

  const selectedHeaderByScope = new Map<GmailArtifactAnalysisScope, SelectedClusterRailHeaderSurfaceRow>()
  for (const header of params.seedHeaders) {
    if (normalizeText(header.cluster_id) !== lookupClusterId) continue
    selectedHeaderByScope.set(normalizeAnalysisScope(header.analysis_scope), header)
  }

  const scopeResolution: SelectedClusterRailFamilyScopeResolution[] = []
  const scopes: OperationsSelectedClusterRailFamilyScopeEntry[] =
    GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.map((scope) => {
      const artifactVersion = publishedVersionByScope.get(scope) || null
      const scopeSummaries = clusterSummariesByScope.get(scope) || []
      const selectedSummary = selectedSummaryByScope.get(scope) || null
      const selectedHeader = selectedHeaderByScope.get(scope) || null
      const snapshotFallback = params.snapshotFallbackByScope?.[scope] || null
      const clusterTitle =
        normalizeNullableText(selectedHeader?.title) ||
        normalizeNullableText(selectedSummary?.title) ||
        normalizeNullableText(snapshotFallback?.cluster_title) ||
        fallbackClusterTitle

      if (snapshotFallback?.cluster_present) {
        scopeResolution.push({
          scope,
          source: 'snapshot_ready',
          artifact_version: artifactVersion,
          visible_cluster_count: normalizeInteger(snapshotFallback.visible_cluster_count),
          snapshot_available: true,
          selected_cluster_present_in_snapshot: true,
          published_header_present: selectedHeader != null,
          published_cluster_present: selectedSummary != null,
        })

        return {
          scope,
          cluster_id: requestedClusterId,
          cluster_title: clusterTitle,
          artifact_version: artifactVersion,
          state: 'ready',
          visible_cluster_count: normalizeInteger(snapshotFallback.visible_cluster_count),
          timeline: snapshotFallback.timeline,
          signal: {
            message_count: normalizeInteger(snapshotFallback.message_count),
            dominant_sender: normalizeNullableText(snapshotFallback.dominant_sender),
            semantic_resolution_distribution: Array.isArray(
              snapshotFallback.semantic_resolution_distribution
            )
              ? snapshotFallback.semantic_resolution_distribution
              : [],
          },
        }
      }

      if (snapshotFallback) {
        scopeResolution.push({
          scope,
          source: 'snapshot_outside_timeframe',
          artifact_version: artifactVersion,
          visible_cluster_count: normalizeInteger(snapshotFallback.visible_cluster_count),
          snapshot_available: true,
          selected_cluster_present_in_snapshot: false,
          published_header_present: selectedHeader != null,
          published_cluster_present: selectedSummary != null,
        })

        return {
          scope,
          cluster_id: requestedClusterId,
          cluster_title: clusterTitle,
          artifact_version: artifactVersion,
          state: 'outside_timeframe',
          visible_cluster_count: normalizeInteger(snapshotFallback.visible_cluster_count),
          timeline: null,
          signal: null,
        }
      }

      if (selectedHeader && artifactVersion) {
        scopeResolution.push({
          scope,
          source: 'artifact_ready',
          artifact_version: artifactVersion,
          visible_cluster_count: scopeSummaries.length,
          snapshot_available: snapshotFallback != null,
          selected_cluster_present_in_snapshot: false,
          published_header_present: true,
          published_cluster_present: selectedSummary != null,
        })

        return {
          scope,
          cluster_id: requestedClusterId,
          cluster_title: clusterTitle,
          artifact_version: artifactVersion,
          state: 'ready',
          visible_cluster_count: scopeSummaries.length,
          timeline: normalizeRailTimelineFromHeader(selectedHeader),
          signal: {
            message_count: normalizeInteger(selectedHeader.message_count),
            dominant_sender: normalizeNullableText(selectedSummary?.dominant_sender),
            semantic_resolution_distribution:
              normalizeSemanticResolutionDistributionFromHeader(selectedHeader),
          },
        }
      }

      if (artifactVersion && scopeSummaries.length > 0 && !selectedSummary) {
        scopeResolution.push({
          scope,
          source: 'artifact_outside_timeframe',
          artifact_version: artifactVersion,
          visible_cluster_count: scopeSummaries.length,
          snapshot_available: snapshotFallback != null,
          selected_cluster_present_in_snapshot: false,
          published_header_present: false,
          published_cluster_present: false,
        })

        return {
          scope,
          cluster_id: requestedClusterId,
          cluster_title: clusterTitle,
          artifact_version: artifactVersion,
          state: 'outside_timeframe',
          visible_cluster_count: scopeSummaries.length,
          timeline: null,
          signal: null,
        }
      }

      scopeResolution.push({
        scope,
        source: 'unavailable_scope',
        artifact_version: artifactVersion,
        visible_cluster_count: scopeSummaries.length,
        snapshot_available: false,
        selected_cluster_present_in_snapshot: false,
        published_header_present: false,
        published_cluster_present: selectedSummary != null,
      })

      return {
        scope,
        cluster_id: requestedClusterId,
        cluster_title: clusterTitle,
        artifact_version: artifactVersion,
        state: 'unavailable_scope',
        visible_cluster_count: scopeSummaries.length,
        timeline: null,
        signal: null,
      }
    })

  return {
    family: {
      cluster_id: requestedClusterId,
      cluster_title:
        fallbackClusterTitle || scopes.find((entry) => entry.cluster_title)?.cluster_title || null,
      scopes,
    },
    scope_resolution: scopeResolution,
  }
}

function selectedClusterRailFamilyPublicationSignature(
  publications: GmailArtifactPublicationRow[]
): string {
  const publicationByScope = new Map<GmailArtifactAnalysisScope, GmailArtifactPublicationRow>()
  for (const publication of publications) {
    publicationByScope.set(normalizeAnalysisScope(publication.analysis_scope), publication)
  }
  return GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.map((scope) => {
    const publication = publicationByScope.get(scope) || null
    return [scope, normalizeNullableText(publication?.published_version) || ''].join(':')
  }).join('|')
}

function selectedClusterRailFamilySnapshotSignature(
  snapshotFallbackByScope: Partial<
    Record<GmailArtifactAnalysisScope, SelectedClusterRailSnapshotScopeFallback | null>
  > | null | undefined
): string {
  return JSON.stringify(
    GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.map((scope) => {
      const snapshot = snapshotFallbackByScope?.[scope] || null
      if (!snapshot) return [scope, null]
      return [
        scope,
        {
          cluster_present: snapshot.cluster_present === true,
          cluster_title: normalizeNullableText(snapshot.cluster_title),
          visible_cluster_count: normalizeInteger(snapshot.visible_cluster_count),
          message_count:
            typeof snapshot.message_count === 'number' && Number.isFinite(snapshot.message_count)
              ? Math.max(0, Math.round(snapshot.message_count))
              : null,
          dominant_sender: normalizeNullableText(snapshot.dominant_sender),
          semantic_resolution_distribution: Array.isArray(
            snapshot.semantic_resolution_distribution
          )
            ? snapshot.semantic_resolution_distribution
            : [],
          timeline: snapshot.timeline
            ? {
                granularity:
                  snapshot.timeline.granularity === 'day'
                    ? 'day'
                    : snapshot.timeline.granularity === 'week'
                      ? 'week'
                      : 'month',
                items: Array.isArray(snapshot.timeline.items) ? snapshot.timeline.items : [],
              }
            : null,
        },
      ]
    })
  )
}

function selectedClusterRailFamilyCacheKey(params: {
  tenantId: string
  preferredClusterId: string
  clusterTitle?: string | null
  publications: GmailArtifactPublicationRow[]
  snapshotFallbackByScope?: Partial<
    Record<GmailArtifactAnalysisScope, SelectedClusterRailSnapshotScopeFallback | null>
  >
}): string {
  return versionedArtifactCacheKey([
    params.tenantId,
    params.preferredClusterId,
    normalizeNullableText(params.clusterTitle) || '',
    selectedClusterRailFamilyPublicationSignature(params.publications),
    selectedClusterRailFamilySnapshotSignature(params.snapshotFallbackByScope),
  ])
}

function artifactHeaderSupportsFocusedSemanticPage(
  header: GmailSenderWorkspaceSeedHeaderRow | null | undefined
): boolean {
  const analytics = normalizeJsonObject(header?.analytics)
  const capabilities = normalizeJsonObject(analytics.artifact_capabilities)
  return capabilities.focused_semantic_page === true
}

function focusedSemanticSortColumn(
  sort: GmailSenderWorkspaceSort
): 'cleanup_group_message_count' | 'sender_key' | 'unread_count' | 'last_activity_at' {
  if (sort === 'sender') return 'sender_key'
  if (sort === 'unread_count') return 'unread_count'
  if (sort === 'last_activity') return 'last_activity_at'
  return 'cleanup_group_message_count'
}

function serializePostgrestTextList(values: string[]): string {
  return values.map((value) => `"${normalizeText(value).replace(/"/g, '\\"')}"`).join(',')
}

function applyFocusedSemanticFilters<T extends {
  eq: (column: string, value: unknown) => T
  or: (filters: string) => T
}>(query: T, semanticFocus: GmailSenderWorkspaceSemanticFocus): T {
  let nextQuery = query.eq('semantic_family_key', semanticFocus.family)

  if (semanticFocus.kind === 'family') {
    return nextQuery
  }

  if (semanticFocus.kind === 'subtype') {
    return nextQuery.eq('semantic_subtype_key', normalizeNullableText(semanticFocus.subtypeKey))
  }

  const surfacedSubtypeKeys = uniqueStrings(semanticFocus.surfacedSubtypeKeys)
  if (surfacedSubtypeKeys.length === 0) {
    return nextQuery
  }

  nextQuery = nextQuery.or(
    `semantic_subtype_key.is.null,semantic_subtype_key.not.in.(${serializePostgrestTextList(
      surfacedSubtypeKeys
    )})`
  )
  return nextQuery
}

function nowIso(): string {
  return new Date().toISOString()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseDateMs(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isTerminalArtifactJobStatus(status: GmailArtifactJobStatus | null | undefined): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function resolveArtifactBuildActivityMs(params: {
  job: GmailArtifactJobRow | null | undefined
  publication: GmailArtifactPublicationRow | null | undefined
}): number | null {
  return (
    parseDateMs(params.job?.heartbeat_at) ??
    parseDateMs(params.job?.started_at) ??
    parseDateMs(params.publication?.refresh_started_at) ??
    parseDateMs(params.publication?.updated_at)
  )
}

function isArtifactBuildActivityFresh(params: {
  job: GmailArtifactJobRow | null | undefined
  publication: GmailArtifactPublicationRow | null | undefined
  nowMs?: number
}): boolean {
  const activityMs = resolveArtifactBuildActivityMs(params)
  if (activityMs == null) return false
  return (params.nowMs ?? Date.now()) - activityMs <= GMAIL_ARTIFACT_BUILD_STALL_THRESHOLD_MS
}

function isArtifactBuildWithinGracePeriod(params: {
  publication: GmailArtifactPublicationRow | null | undefined
  nowMs?: number
}): boolean {
  const startedAtMs =
    parseDateMs(params.publication?.refresh_started_at) ??
    parseDateMs(params.publication?.updated_at)
  if (startedAtMs == null) return false
  return (params.nowMs ?? Date.now()) - startedAtMs <= GMAIL_ARTIFACT_BUILD_JOB_GRACE_MS
}

function inferArtifactJobTypeForPublication(
  publication: GmailArtifactPublicationRow | null | undefined
): GmailArtifactJobType {
  if (publication?.refresh_strategy === 'incremental') return 'incremental_refresh'
  if (publication?.refresh_strategy === 'full_rebuild') return 'full_rebuild'
  const buildingVersion = normalizeText(publication?.building_version)
  if (buildingVersion.startsWith('incremental-')) return 'incremental_refresh'
  if (buildingVersion.startsWith('full-mailbox-')) return 'full_rebuild'
  return 'full_rebuild'
}

function buildArtifactReclaimMessage(params: {
  publication: GmailArtifactPublicationRow
  reason: GmailArtifactBuildReclaimReason
  job: GmailArtifactJobRow | null
}): string {
  return [
    params.reason,
    `building_version=${normalizeNullableText(params.publication.building_version) ?? 'null'}`,
    `refresh_job_id=${normalizeNullableText(params.publication.refresh_job_id) ?? 'null'}`,
    `job_status=${normalizeNullableText(params.job?.status) ?? 'null'}`,
    `refresh_started_at=${normalizeNullableText(params.publication.refresh_started_at) ?? 'null'}`,
    `job_heartbeat_at=${normalizeNullableText(params.job?.heartbeat_at) ?? 'null'}`,
  ].join(' | ')
}

function publicationHasNewerRefreshRequestThanStartedBuild(
  publication: GmailArtifactPublicationRow | null | undefined
): boolean {
  const requestedAtMs = parseDateMs(publication?.refresh_requested_at)
  const startedAtMs = parseDateMs(publication?.refresh_started_at)
  return requestedAtMs != null && startedAtMs != null && requestedAtMs > startedAtMs + 1000
}

function isRetriableArtifactStoreError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return /fetch failed|bad gateway|502|network|ECONNRESET|ETIMEDOUT|temporar|socket/i.test(
    message
  )
}

async function withArtifactStoreRetry<T>(params: {
  label: string
  run: () => Promise<T>
  attempts?: number
}): Promise<T> {
  const attempts = Math.max(1, params.attempts ?? GMAIL_ARTIFACT_STORE_RETRY_ATTEMPTS)
  let lastError: unknown = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await params.run()
    } catch (error) {
      lastError = error
      if (attempt >= attempts || !isRetriableArtifactStoreError(error)) {
        throw error
      }
      console.warn(
        `[integrations/gmail/artifact-store-retry] ${JSON.stringify({
          label: params.label,
          attempt,
          attempts,
          error: error instanceof Error ? error.message : String(error),
        })}`
      )
      await sleep(GMAIL_ARTIFACT_STORE_RETRY_DELAY_MS * attempt)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${params.label} failed.`)
}

function stringifyError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Unknown Gmail artifact write failure.'
}

function artifactPublicationCacheKey(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
}): string {
  return [normalizeText(params.tenantId), normalizeAnalysisScope(params.analysisScope)].join('::')
}

function versionedArtifactCacheKey(values: Array<string | number | null | undefined>): string {
  return values
    .map((value) =>
      typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : normalizeText(value)
    )
    .join('::')
}

function withTimestamp<T extends { created_at?: string; updated_at?: string }>(row: T, timestamp: string): T {
  return {
    ...row,
    created_at: row.created_at ?? timestamp,
    updated_at: timestamp,
  }
}

function cachePublicationState(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  publication: GmailArtifactPublicationRow | null
}): void {
  const cacheKey = artifactPublicationCacheKey({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  publicationStateCache.set(cacheKey, {
    expires_at_ms: Date.now() + GMAIL_ARTIFACT_PUBLICATION_CACHE_TTL_MS,
    data: params.publication,
  })
  publicationStateInflight.delete(cacheKey)
}

function evictPublicationStateCache(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
}): void {
  const cacheKey = artifactPublicationCacheKey(params)
  publicationStateCache.delete(cacheKey)
  publicationStateInflight.delete(cacheKey)
}

async function loadPublicationState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
}): Promise<GmailArtifactPublicationRow | null> {
  const cacheKey = artifactPublicationCacheKey(params)
  const now = Date.now()
  const cached = publicationStateCache.get(cacheKey) || null
  if (cached && cached.expires_at_ms > now) {
    return cached.data
  }

  const inflight = publicationStateInflight.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const loadPromise = withArtifactStoreRetry({
    label: 'gmail_artifact_publications.select',
    run: async () => {
      const { data, error } = await params.supabase
        .from('gmail_artifact_publications')
        .select(GMAIL_ARTIFACT_PUBLICATION_SELECT)
        .eq('tenant_id', params.tenantId)
        .eq('analysis_scope', params.analysisScope)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to load gmail_artifact_publications: ${error.message}`)
      }

      const publication = (data as GmailArtifactPublicationRow | null) ?? null
      cachePublicationState({
        tenantId: params.tenantId,
        analysisScope: params.analysisScope,
        publication,
      })
      return publication
    },
  })

  publicationStateInflight.set(cacheKey, loadPromise)
  try {
    return await loadPromise
  } finally {
    publicationStateInflight.delete(cacheKey)
  }
}

async function writePublicationState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  patch: Partial<GmailArtifactPublicationRow>
}): Promise<GmailArtifactPublicationRow> {
  const current = await loadPublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const timestamp = nowIso()
  const next: GmailArtifactPublicationRow = {
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    published_version: current?.published_version ?? null,
    published_at: current?.published_at ?? null,
    building_version: current?.building_version ?? null,
    build_status: current?.build_status ?? 'idle',
    last_error: current?.last_error ?? null,
    last_error_at: current?.last_error_at ?? null,
    last_index_state_updated_at: current?.last_index_state_updated_at ?? null,
    last_indexed_message_count: current?.last_indexed_message_count ?? null,
    freshness_state: current?.freshness_state ?? 'stale',
    freshness_reason: current?.freshness_reason ?? null,
    refresh_strategy: current?.refresh_strategy ?? null,
    refresh_requested_at: current?.refresh_requested_at ?? null,
    refresh_started_at: current?.refresh_started_at ?? null,
    refresh_completed_at: current?.refresh_completed_at ?? null,
    refresh_job_id: current?.refresh_job_id ?? null,
    refresh_sync_run_id: current?.refresh_sync_run_id ?? null,
    created_at: current?.created_at ?? timestamp,
    updated_at: timestamp,
    ...omitUndefinedValues(params.patch as Record<string, unknown>),
  }

  const result = await withArtifactStoreRetry({
    label: 'gmail_artifact_publications.upsert',
    run: async () => {
      const { data, error } = await params.supabase
        .from('gmail_artifact_publications')
        .upsert([next], { onConflict: 'tenant_id,analysis_scope' })
        .select(GMAIL_ARTIFACT_PUBLICATION_SELECT)
        .single()

      if (error) {
        throw new Error(`Failed to upsert gmail_artifact_publications: ${error.message}`)
      }

      return data as GmailArtifactPublicationRow
    },
  })
  cachePublicationState({
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    publication: result,
  })
  return result
}

function applyPublicationExpectationClause(
  query: any,
  column: keyof GmailArtifactPublicationCompareAndSetExpectation,
  value: unknown
): any {
  if (value === undefined) {
    return query
  }
  if (value === null) {
    return query.is(column, null)
  }
  return query.eq(column, value)
}

async function writePublicationStateCompareAndSet(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  patch: Partial<GmailArtifactPublicationRow>
  expected: GmailArtifactPublicationCompareAndSetExpectation
}): Promise<GmailArtifactPublicationRow | null> {
  const timestamp = nowIso()
  const nextPatch = {
    ...omitUndefinedValues(params.patch as Record<string, unknown>),
    updated_at: timestamp,
  }

  const result = await withArtifactStoreRetry({
    label: 'gmail_artifact_publications.compare_and_set',
    run: async () => {
      let update = params.supabase
        .from('gmail_artifact_publications')
        .update(nextPatch)
        .eq('tenant_id', params.tenantId)
        .eq('analysis_scope', params.analysisScope)

      update = applyPublicationExpectationClause(
        update,
        'published_version',
        params.expected.published_version
      )
      update = applyPublicationExpectationClause(
        update,
        'building_version',
        params.expected.building_version
      )
      update = applyPublicationExpectationClause(update, 'build_status', params.expected.build_status)
      update = applyPublicationExpectationClause(
        update,
        'refresh_job_id',
        params.expected.refresh_job_id
      )
      update = applyPublicationExpectationClause(
        update,
        'last_index_state_updated_at',
        params.expected.last_index_state_updated_at
      )
      update = applyPublicationExpectationClause(
        update,
        'last_indexed_message_count',
        params.expected.last_indexed_message_count
      )

      const { data, error } = await update
        .select(GMAIL_ARTIFACT_PUBLICATION_SELECT)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to compare-and-set gmail_artifact_publications: ${error.message}`)
      }

      return (data as GmailArtifactPublicationRow | null) ?? null
    },
  })

  if (result) {
    cachePublicationState({
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      publication: result,
    })
  } else {
    evictPublicationStateCache({
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
    })
  }

  return result
}

async function loadArtifactJob(params: {
  supabase: SupabaseClient
  jobId: string
}): Promise<GmailArtifactJobRow | null> {
  return withArtifactStoreRetry({
    label: 'gmail_artifact_jobs.select',
    run: async () => {
      const { data, error } = await params.supabase
        .from('gmail_artifact_jobs')
        .select(
          'job_id,tenant_id,analysis_scope,artifact_version,job_type,status,phase,sender_checkpoint,message_checkpoint,cluster_checkpoint,processed_sender_count,processed_message_count,processed_cluster_count,heartbeat_at,started_at,completed_at,last_error,last_error_at,created_at,updated_at'
        )
        .eq('job_id', params.jobId)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to load gmail_artifact_jobs: ${error.message}`)
      }

      return (data as GmailArtifactJobRow | null) ?? null
    },
  })
}

async function writeArtifactJob(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  patch: Partial<GmailArtifactJobRow>
}): Promise<GmailArtifactJobRow> {
  const current = await loadArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
  })
  const timestamp = nowIso()
  const next: GmailArtifactJobRow = {
    job_id: params.jobId,
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    artifact_version: params.artifactVersion,
    job_type: current?.job_type ?? 'shadow_publish',
    status: current?.status ?? 'pending',
    phase: current?.phase ?? null,
    sender_checkpoint: current?.sender_checkpoint ?? null,
    message_checkpoint: current?.message_checkpoint ?? null,
    cluster_checkpoint: current?.cluster_checkpoint ?? null,
    processed_sender_count: current?.processed_sender_count ?? 0,
    processed_message_count: current?.processed_message_count ?? 0,
    processed_cluster_count: current?.processed_cluster_count ?? 0,
    heartbeat_at: current?.heartbeat_at ?? null,
    started_at: current?.started_at ?? null,
    completed_at: current?.completed_at ?? null,
    last_error: current?.last_error ?? null,
    last_error_at: current?.last_error_at ?? null,
    created_at: current?.created_at ?? timestamp,
    updated_at: timestamp,
    ...omitUndefinedValues(params.patch as Record<string, unknown>),
  }

  return withArtifactStoreRetry({
    label: 'gmail_artifact_jobs.upsert',
    run: async () => {
      const { data, error } = await params.supabase
        .from('gmail_artifact_jobs')
        .upsert([next], { onConflict: 'job_id' })
        .select(
          'job_id,tenant_id,analysis_scope,artifact_version,job_type,status,phase,sender_checkpoint,message_checkpoint,cluster_checkpoint,processed_sender_count,processed_message_count,processed_cluster_count,heartbeat_at,started_at,completed_at,last_error,last_error_at,created_at,updated_at'
        )
        .single()

      if (error) {
        throw new Error(`Failed to upsert gmail_artifact_jobs: ${error.message}`)
      }

      return data as GmailArtifactJobRow
    },
  })
}

async function upsertReclaimedArtifactJob(params: {
  supabase: SupabaseClient
  publication: GmailArtifactPublicationRow
  job: GmailArtifactJobRow | null
  reclaimReason: GmailArtifactBuildReclaimReason
  reclaimedAt: string
  reclaimMessage: string
}): Promise<GmailArtifactJobRow | null> {
  const jobId = normalizeText(params.publication.refresh_job_id)
  if (!jobId) return null

  const next: GmailArtifactJobRow = {
    job_id: jobId,
    tenant_id: params.publication.tenant_id,
    analysis_scope: params.publication.analysis_scope,
    artifact_version:
      normalizeText(params.publication.building_version) ||
      normalizeText(params.job?.artifact_version) ||
      normalizeText(params.publication.published_version),
    job_type: params.job?.job_type ?? inferArtifactJobTypeForPublication(params.publication),
    status: 'failed',
    phase: params.reclaimReason,
    sender_checkpoint: params.job?.sender_checkpoint ?? null,
    message_checkpoint: params.job?.message_checkpoint ?? null,
    cluster_checkpoint: params.job?.cluster_checkpoint ?? null,
    processed_sender_count: params.job?.processed_sender_count ?? 0,
    processed_message_count: params.job?.processed_message_count ?? 0,
    processed_cluster_count: params.job?.processed_cluster_count ?? 0,
    heartbeat_at: params.reclaimedAt,
    started_at:
      params.job?.started_at ??
      normalizeNullableText(params.publication.refresh_started_at) ??
      params.reclaimedAt,
    completed_at: params.reclaimedAt,
    last_error: params.reclaimMessage,
    last_error_at: params.reclaimedAt,
    created_at: params.job?.created_at ?? params.reclaimedAt,
    updated_at: params.reclaimedAt,
  }

  return withArtifactStoreRetry({
    label: 'gmail_artifact_jobs.reclaim_stale_build',
    run: async () => {
      const { data, error } = await params.supabase
        .from('gmail_artifact_jobs')
        .upsert([next], { onConflict: 'job_id' })
        .select(
          'job_id,tenant_id,analysis_scope,artifact_version,job_type,status,phase,sender_checkpoint,message_checkpoint,cluster_checkpoint,processed_sender_count,processed_message_count,processed_cluster_count,heartbeat_at,started_at,completed_at,last_error,last_error_at,created_at,updated_at'
        )
        .single()

      if (error) {
        throw new Error(`Failed to reclaim gmail_artifact_jobs row: ${error.message}`)
      }

      return data as GmailArtifactJobRow
    },
  })
}

async function reclaimStaleArtifactBuildLock(params: {
  supabase: SupabaseClient
  publication: GmailArtifactPublicationRow
  job: GmailArtifactJobRow | null
  reclaimReason: GmailArtifactBuildReclaimReason
  nowMs?: number
  logPrefix?: string
}): Promise<GmailArtifactBuildLivenessResult> {
  const expectedBuildingVersion = normalizeText(params.publication.building_version)
  if (!expectedBuildingVersion) {
    return {
      publication: params.publication,
      job: params.job,
      build_is_live: false,
      reclaim_applied: false,
      reclaim_reason: null,
      status: 'no_build',
    }
  }

  const reclaimedAt = new Date(params.nowMs ?? Date.now()).toISOString()
  const refreshJobId = normalizeNullableText(params.publication.refresh_job_id)
  const reclaimMessage = buildArtifactReclaimMessage({
    publication: params.publication,
    reason: params.reclaimReason,
    job: params.job,
  })

  const publication = await withArtifactStoreRetry({
    label: 'gmail_artifact_publications.reclaim_stale_build',
    run: async () => {
      let update = params.supabase
        .from('gmail_artifact_publications')
        .update({
          building_version: null,
          build_status: 'failed',
          last_error: reclaimMessage,
          last_error_at: reclaimedAt,
          freshness_state: 'refresh_failed',
          freshness_reason: params.reclaimReason,
          refresh_completed_at: reclaimedAt,
          updated_at: reclaimedAt,
        })
        .eq('tenant_id', params.publication.tenant_id)
        .eq('analysis_scope', params.publication.analysis_scope)
        .eq('building_version', expectedBuildingVersion)

      update = refreshJobId
        ? update.eq('refresh_job_id', refreshJobId)
        : update.is('refresh_job_id', null)

      const { data, error } = await update.select(GMAIL_ARTIFACT_PUBLICATION_SELECT).maybeSingle()

      if (error) {
        throw new Error(`Failed to reclaim gmail_artifact_publications row: ${error.message}`)
      }

      return (data as GmailArtifactPublicationRow | null) ?? null
    },
  })

  if (!publication) {
    const nextPublication = await loadPublicationState({
      supabase: params.supabase,
      tenantId: params.publication.tenant_id,
      analysisScope: params.publication.analysis_scope,
    })
    return {
      publication: nextPublication,
      job: params.job,
      build_is_live: Boolean(normalizeText(nextPublication?.building_version)),
      reclaim_applied: false,
      reclaim_reason: null,
      status: normalizeText(nextPublication?.building_version) ? 'build_live' : 'no_build',
    }
  }

  cachePublicationState({
    tenantId: publication.tenant_id,
    analysisScope: publication.analysis_scope,
    publication,
  })

  const job = await upsertReclaimedArtifactJob({
    supabase: params.supabase,
    publication: params.publication,
    job: params.job,
    reclaimReason: params.reclaimReason,
    reclaimedAt,
    reclaimMessage,
  })

  const logPrefix = normalizeText(params.logPrefix) || '[integrations/gmail/artifact-build-liveness]'
  console.info(
    `${logPrefix} ${JSON.stringify({
      tenant_id: params.publication.tenant_id,
      analysis_scope: params.publication.analysis_scope,
      refresh_job_id: refreshJobId,
      building_version_before: expectedBuildingVersion,
      building_version_after: publication.building_version,
      freshness_state_after: publication.freshness_state,
      freshness_reason_after: publication.freshness_reason,
      refresh_started_at_before: params.publication.refresh_started_at,
      refresh_completed_at_after: publication.refresh_completed_at,
      job_status_before: params.job?.status ?? null,
      job_status_after: job?.status ?? null,
      reclaim_reason: params.reclaimReason,
      event: 'reclaimed_stale_build',
    })}`
  )

  return {
    publication,
    job,
    build_is_live: false,
    reclaim_applied: true,
    reclaim_reason: params.reclaimReason,
    status: 'reclaimed_stale_build',
  }
}

async function replaceVersionRows<T extends Record<string, unknown>>(params: {
  supabase: SupabaseClient
  table:
    | 'gmail_sender_workspace_seed_headers'
    | 'gmail_sender_workspace_seed_rows'
    | 'gmail_sender_scope_rollups'
    | 'gmail_cluster_summaries'
    | 'gmail_mailbox_intelligence_snapshots'
    | 'gmail_mailbox_intelligence_buckets'
    | 'gmail_preview_index'
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  rows: T[]
  onConflict: string
}): Promise<void> {
  await withArtifactStoreRetry({
    label: `${params.table}.clear_version_rows`,
    run: async () => {
      const { error: deleteError } = await params.supabase
        .from(params.table)
        .delete()
        .eq('tenant_id', params.tenantId)
        .eq('analysis_scope', params.analysisScope)
        .eq('artifact_version', params.artifactVersion)

      if (deleteError) {
        throw new Error(`Failed to clear ${params.table}: ${deleteError.message}`)
      }
    },
  })

  for (const batch of chunkArray(params.rows, GMAIL_ARTIFACT_WRITE_BATCH_SIZE)) {
    if (batch.length === 0) continue
    await withArtifactStoreRetry({
      label: `${params.table}.replace_upsert`,
      run: async () => {
        const { error: upsertError } = await params.supabase
          .from(params.table)
          .upsert(batch, { onConflict: params.onConflict })
        if (upsertError) {
          throw new Error(`Failed to upsert ${params.table}: ${upsertError.message}`)
        }
      },
    })
  }
}

async function upsertVersionRows<T extends Record<string, unknown>>(params: {
  supabase: SupabaseClient
  table:
    | 'gmail_sender_workspace_seed_headers'
    | 'gmail_sender_workspace_seed_rows'
    | 'gmail_sender_scope_rollups'
    | 'gmail_cluster_summaries'
    | 'gmail_mailbox_intelligence_snapshots'
    | 'gmail_mailbox_intelligence_buckets'
    | 'gmail_preview_index'
  rows: T[]
  onConflict: string
}): Promise<void> {
  for (const batch of chunkArray(params.rows, GMAIL_ARTIFACT_WRITE_BATCH_SIZE)) {
    if (batch.length === 0) continue
    await withArtifactStoreRetry({
      label: `${params.table}.upsert`,
      run: async () => {
        const { error } = await params.supabase.from(params.table).upsert(batch, {
          onConflict: params.onConflict,
        })
        if (error) {
          throw new Error(`Failed to upsert ${params.table}: ${error.message}`)
        }
      },
    })
  }
}

export function createGmailArtifactVersion(prefix = 'shadow'): string {
  return `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '')}`
}

export async function writeGmailShadowArtifactBundle(params: {
  supabase: SupabaseClient
  bundle: GmailShadowArtifactBundle
  jobId?: string | null
  publish?: boolean
  jobType?: GmailArtifactJobType
}): Promise<GmailShadowArtifactWriteResult> {
  const publish = params.publish === true
  const tenantId = normalizeText(params.bundle.tenant_id)
  const analysisScope = normalizeAnalysisScope(params.bundle.analysis_scope)
  const artifactVersion = normalizeText(params.bundle.artifact_version)
  if (!tenantId || !artifactVersion) {
    throw new Error('tenant_id and artifact_version are required for Gmail artifact writes.')
  }

  const jobId =
    normalizeText(params.jobId) || `shadow:${tenantId}:${analysisScope}:${artifactVersion}`
  const writeStartedAt = nowIso()
  const rowCounts = {
    sender_workspace_seed_headers: params.bundle.sender_workspace_seed_headers.length,
    sender_workspace_seed_rows: params.bundle.sender_workspace_seed_rows.length,
    cluster_summaries: params.bundle.cluster_summaries.length,
    mailbox_intelligence_snapshots: params.bundle.mailbox_intelligence_snapshots.length,
    mailbox_intelligence_buckets: params.bundle.mailbox_intelligence_buckets.length,
    preview_index_rows: params.bundle.preview_index_rows.length,
  }

  await writePublicationState({
    supabase: params.supabase,
    tenantId,
    analysisScope,
    patch: {
      building_version: artifactVersion,
      build_status: 'building',
      last_error: null,
      last_error_at: null,
      last_index_state_updated_at: normalizeNullableText(params.bundle.last_index_state_updated_at),
      last_indexed_message_count:
        typeof params.bundle.last_indexed_message_count === 'number' &&
        Number.isFinite(params.bundle.last_indexed_message_count)
          ? Math.max(0, Math.round(params.bundle.last_indexed_message_count))
          : null,
    },
  })

  await writeArtifactJob({
    supabase: params.supabase,
    jobId,
    tenantId,
    analysisScope,
    artifactVersion,
    patch: {
      job_type: params.jobType ?? 'shadow_publish',
      status: 'running',
      phase: 'writing_artifacts',
      started_at: writeStartedAt,
      completed_at: null,
      heartbeat_at: writeStartedAt,
      last_error: null,
      last_error_at: null,
      processed_sender_count: 0,
      processed_message_count: 0,
      processed_cluster_count: 0,
    },
  })

  try {
    const timestamp = nowIso()
    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_sender_workspace_seed_headers',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.sender_workspace_seed_headers.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            cluster_id: normalizeText(row.cluster_id),
            cluster_type: normalizeText(row.cluster_type),
            title: normalizeText(row.title),
            query: normalizeText(row.query),
            why_selected: normalizeNullableText(row.why_selected),
            risk_note: normalizeNullableText(row.risk_note),
            safety_note: normalizeNullableText(row.safety_note),
            message_count: normalizeInteger(row.message_count),
            sender_count: normalizeInteger(row.sender_count),
            share_pct: Math.min(100, normalizeInteger(row.share_pct)),
            pagination: normalizeJsonObject(row.pagination),
            analytics: normalizeJsonObject(row.analytics),
            source: normalizeText(row.source) || 'shadow_artifact',
          },
          timestamp
        )
      ),
      onConflict: 'tenant_id,analysis_scope,cluster_id,artifact_version',
    })

    await writeArtifactJob({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      patch: {
        phase: 'writing_seed_rows',
        heartbeat_at: nowIso(),
        processed_cluster_count: rowCounts.sender_workspace_seed_headers,
      },
    })

    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_sender_workspace_seed_rows',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.sender_workspace_seed_rows.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            cluster_id: normalizeText(row.cluster_id),
            sender_key: normalizeText(row.sender_key),
            default_rank: normalizeInteger(row.default_rank),
            sender: normalizeText(row.sender),
            sender_domain: normalizeNullableText(row.sender_domain),
            cleanup_group_message_count: normalizeInteger(row.cleanup_group_message_count),
            unread_count: normalizeInteger(row.unread_count),
            protected_hint: normalizeNullableText(row.protected_hint),
            requires_verification: normalizeBoolean(row.requires_verification),
            verification_reasons: normalizeStringArray(row.verification_reasons),
            preview_message_ids: normalizeStringArray(row.preview_message_ids),
            preview_ready: normalizeBoolean(row.preview_ready),
            semantic_family_key: normalizeNullableText(row.semantic_family_key),
            semantic_subtype_key: normalizeNullableText(row.semantic_subtype_key),
            semantic_pattern_key: normalizeNullableText(row.semantic_pattern_key),
            last_activity_at: normalizeNullableText(row.last_activity_at),
            seed_payload: normalizeJsonObject(row.seed_payload),
          },
          timestamp
        )
      ),
      onConflict: 'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version',
    })

    await writeArtifactJob({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      patch: {
        phase: 'writing_summaries',
        heartbeat_at: nowIso(),
        processed_sender_count: rowCounts.sender_workspace_seed_rows,
      },
    })

    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_cluster_summaries',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.cluster_summaries.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            cluster_id: normalizeText(row.cluster_id),
            cluster_type: normalizeText(row.cluster_type),
            title: normalizeText(row.title),
            query: normalizeText(row.query),
            why_selected: normalizeNullableText(row.why_selected),
            risk_note: normalizeNullableText(row.risk_note),
            safety_note: normalizeNullableText(row.safety_note),
            message_count: normalizeInteger(row.message_count),
            sender_count: normalizeInteger(row.sender_count),
            share_pct: Math.min(100, normalizeInteger(row.share_pct)),
            dominant_sender: normalizeNullableText(row.dominant_sender),
            dominant_pattern: normalizeNullableText(row.dominant_pattern),
            protected_message_count: normalizeInteger(row.protected_message_count),
            uncertain_sender_count: normalizeInteger(row.uncertain_sender_count),
            summary_payload: normalizeJsonObject(row.summary_payload),
          },
          timestamp
        )
      ),
      onConflict: 'tenant_id,analysis_scope,cluster_id,artifact_version',
    })

    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_mailbox_intelligence_snapshots',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.mailbox_intelligence_snapshots.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            snapshot_payload: normalizeJsonObject(row.snapshot_payload),
            source: normalizeText(row.source) || 'shadow_artifact',
          },
          timestamp
        )
      ),
      onConflict: 'tenant_id,analysis_scope,artifact_version',
    })

    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_mailbox_intelligence_buckets',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.mailbox_intelligence_buckets.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            bucket_kind: normalizeText(row.bucket_kind),
            bucket_key: normalizeText(row.bucket_key),
            bucket_start_at: normalizeText(row.bucket_start_at),
            bucket_end_at: normalizeNullableText(row.bucket_end_at),
            bucket_value: normalizeInteger(row.bucket_value),
            bucket_payload: normalizeJsonObject(row.bucket_payload),
          },
          timestamp
        )
      ),
      onConflict:
        'tenant_id,analysis_scope,artifact_version,bucket_kind,bucket_key,bucket_start_at',
    })

    await writeArtifactJob({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      patch: {
        phase: 'writing_preview_index',
        heartbeat_at: nowIso(),
        processed_cluster_count:
          rowCounts.sender_workspace_seed_headers + rowCounts.cluster_summaries,
        processed_message_count: rowCounts.mailbox_intelligence_buckets,
      },
    })

    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_preview_index',
      tenantId,
      analysisScope,
      artifactVersion,
      rows: params.bundle.preview_index_rows.map((row) =>
        withTimestamp(
          {
            ...row,
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: artifactVersion,
            cluster_id: normalizeText(row.cluster_id),
            sender_key: normalizeText(row.sender_key),
            preview_rank: normalizeInteger(row.preview_rank),
            message_id: normalizeText(row.message_id),
            thread_id: normalizeNullableText(row.thread_id),
            sender: normalizeNullableText(row.sender),
            subject: normalizeNullableText(row.subject),
            snippet: normalizeNullableText(row.snippet),
            internal_date_ms:
              typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
                ? Math.round(row.internal_date_ms)
                : null,
            date: normalizeNullableText(row.date),
            label_ids: normalizeStringArray(row.label_ids),
            category_labels: normalizeStringArray(row.category_labels),
            is_in_inbox: normalizeBoolean(row.is_in_inbox),
            is_unread: normalizeBoolean(row.is_unread),
            is_important: normalizeBoolean(row.is_important),
            is_starred: normalizeBoolean(row.is_starred),
            protected_hint: normalizeNullableText(row.protected_hint),
            preview_payload: normalizeJsonObject(row.preview_payload),
          },
          timestamp
        )
      ),
      onConflict:
        'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version,preview_rank',
    })

    await writePublicationState({
      supabase: params.supabase,
      tenantId,
      analysisScope,
      patch: publish
        ? {
            published_version: artifactVersion,
            published_at: nowIso(),
            building_version: null,
            build_status: 'published',
            last_error: null,
            last_error_at: null,
            freshness_state: 'fresh',
            freshness_reason: 'published_artifact_current',
            refresh_strategy: null,
            refresh_completed_at: nowIso(),
          }
        : {
            building_version: null,
            build_status: 'idle',
            last_error: null,
            last_error_at: null,
          },
    })

    await writeArtifactJob({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      patch: {
        status: 'completed',
        phase: publish ? 'published' : 'shadow_complete',
        heartbeat_at: nowIso(),
        completed_at: nowIso(),
        processed_sender_count: rowCounts.sender_workspace_seed_rows,
        processed_message_count:
          rowCounts.preview_index_rows + rowCounts.mailbox_intelligence_buckets,
        processed_cluster_count:
          rowCounts.sender_workspace_seed_headers + rowCounts.cluster_summaries,
      },
    })

    return {
      job_id: jobId,
      tenant_id: tenantId,
      analysis_scope: analysisScope,
      artifact_version: artifactVersion,
      published: publish,
      row_counts: rowCounts,
    }
  } catch (error) {
    const message = stringifyError(error)
    await writePublicationState({
      supabase: params.supabase,
      tenantId,
      analysisScope,
      patch: {
        building_version: null,
        build_status: 'failed',
        last_error: message,
        last_error_at: nowIso(),
      },
    })
    await writeArtifactJob({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      patch: {
        status: 'failed',
        phase: 'write_failed',
        heartbeat_at: nowIso(),
        completed_at: nowIso(),
        last_error: message,
        last_error_at: nowIso(),
      },
    })
    throw error
  }
}

function normalizeSenderSignal(
  value: unknown
): GmailSenderScopeRollupRow['sender_signal'] {
  return value === 'likely_machine_generated' || value === 'likely_human' ? value : 'uncertain'
}

export async function loadGmailArtifactPublicationState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
}): Promise<GmailArtifactPublicationRow | null> {
  return loadPublicationState(params)
}

export async function updateGmailArtifactPublicationFreshness(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  freshnessState: GmailArtifactFreshnessState
  freshnessReason?: string | null
  refreshStrategy?: GmailArtifactRefreshStrategy | null
  refreshRequestedAt?: string | null
  refreshStartedAt?: string | null
  refreshCompletedAt?: string | null
  refreshJobId?: string | null
  refreshSyncRunId?: string | null
}): Promise<GmailArtifactPublicationRow> {
  return writePublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    patch: {
      freshness_state: normalizeFreshnessState(params.freshnessState),
      freshness_reason:
        params.freshnessReason === undefined ? undefined : normalizeNullableText(params.freshnessReason),
      refresh_strategy:
        params.refreshStrategy === undefined
          ? undefined
          : normalizeRefreshStrategy(params.refreshStrategy),
      refresh_requested_at:
        params.refreshRequestedAt === undefined
          ? undefined
          : normalizeNullableText(params.refreshRequestedAt),
      refresh_started_at:
        params.refreshStartedAt === undefined
          ? undefined
          : normalizeNullableText(params.refreshStartedAt),
      refresh_completed_at:
        params.refreshCompletedAt === undefined
          ? undefined
          : normalizeNullableText(params.refreshCompletedAt),
      refresh_job_id:
        params.refreshJobId === undefined ? undefined : normalizeNullableText(params.refreshJobId),
      refresh_sync_run_id:
        params.refreshSyncRunId === undefined
          ? undefined
          : normalizeNullableText(params.refreshSyncRunId),
    },
  })
}

export async function loadGmailArtifactPublicationStatesForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
}): Promise<GmailArtifactPublicationRow[]> {
  const { data, error } = await params.supabase
    .from('gmail_artifact_publications')
    .select(GMAIL_ARTIFACT_PUBLICATION_SELECT)
    .eq('tenant_id', params.tenantId)
    .order('analysis_scope', { ascending: true })

  if (error) {
    throw new Error(`Failed to load gmail_artifact_publications for tenant: ${error.message}`)
  }

  const rows = (data || []) as GmailArtifactPublicationRow[]
  for (const row of rows) {
    publicationStateCache.set(
      artifactPublicationCacheKey({
        tenantId: row.tenant_id,
        analysisScope: row.analysis_scope,
      }),
      {
        expires_at_ms: Date.now() + GMAIL_ARTIFACT_PUBLICATION_CACHE_TTL_MS,
        data: row,
      }
    )
  }
  return rows
}

export async function loadGmailArtifactJobState(params: {
  supabase: SupabaseClient
  jobId: string
}): Promise<GmailArtifactJobRow | null> {
  return loadArtifactJob(params)
}

export async function reconcileGmailArtifactBuildLiveness(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  publication?: GmailArtifactPublicationRow | null
  nowMs?: number
  logPrefix?: string
}): Promise<GmailArtifactBuildLivenessResult> {
  const publication =
    params.publication ??
    (await loadPublicationState({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
    }))

  if (!normalizeText(publication?.building_version)) {
    return {
      publication,
      job: null,
      build_is_live: false,
      reclaim_applied: false,
      reclaim_reason: null,
      status: 'no_build',
    }
  }

  const activePublication = publication as GmailArtifactPublicationRow
  const nowMs = params.nowMs ?? Date.now()
  const refreshJobId = normalizeNullableText(activePublication.refresh_job_id)
  const logPrefix = normalizeText(params.logPrefix) || '[integrations/gmail/artifact-build-liveness]'

  if (!refreshJobId) {
    if (isArtifactBuildWithinGracePeriod({ publication: activePublication, nowMs })) {
      console.info(
        `${logPrefix} ${JSON.stringify({
          tenant_id: activePublication.tenant_id,
          analysis_scope: activePublication.analysis_scope,
          building_version: activePublication.building_version,
          refresh_started_at: activePublication.refresh_started_at,
          status: 'build_starting_without_job',
          event: 'artifact_build_liveness_grace_period',
        })}`
      )
      return {
        publication: activePublication,
        job: null,
        build_is_live: true,
        reclaim_applied: false,
        reclaim_reason: null,
        status: 'build_starting_without_job',
      }
    }

    return reclaimStaleArtifactBuildLock({
      supabase: params.supabase,
      publication: activePublication,
      job: null,
      reclaimReason: 'refresh_reclaimed_missing_job',
      nowMs,
      logPrefix,
    })
  }

  const job = await loadArtifactJob({
    supabase: params.supabase,
    jobId: refreshJobId,
  })

  if (!job) {
    if (isArtifactBuildWithinGracePeriod({ publication: activePublication, nowMs })) {
      console.info(
        `${logPrefix} ${JSON.stringify({
          tenant_id: activePublication.tenant_id,
          analysis_scope: activePublication.analysis_scope,
          refresh_job_id: refreshJobId,
          building_version: activePublication.building_version,
          refresh_started_at: activePublication.refresh_started_at,
          status: 'build_starting_without_job_row',
          event: 'artifact_build_liveness_grace_period',
        })}`
      )
      return {
        publication: activePublication,
        job: null,
        build_is_live: true,
        reclaim_applied: false,
        reclaim_reason: null,
        status: 'build_starting_without_job_row',
      }
    }

    return reclaimStaleArtifactBuildLock({
      supabase: params.supabase,
      publication: activePublication,
      job: null,
      reclaimReason: 'refresh_reclaimed_missing_job',
      nowMs,
      logPrefix,
    })
  }

  const buildingVersion = normalizeText(activePublication.building_version)
  const jobMatchesPublication =
    job.tenant_id === activePublication.tenant_id &&
    job.analysis_scope === activePublication.analysis_scope &&
    normalizeText(job.artifact_version) === buildingVersion

  if (!jobMatchesPublication) {
    return reclaimStaleArtifactBuildLock({
      supabase: params.supabase,
      publication: activePublication,
      job,
      reclaimReason: 'refresh_reclaimed_mismatched_job',
      nowMs,
      logPrefix,
    })
  }

  if (isTerminalArtifactJobStatus(job.status)) {
    return reclaimStaleArtifactBuildLock({
      supabase: params.supabase,
      publication: activePublication,
      job,
      reclaimReason: 'refresh_reclaimed_terminal_job',
      nowMs,
      logPrefix,
    })
  }

  if (isArtifactBuildActivityFresh({ job, publication: activePublication, nowMs })) {
    return {
      publication: activePublication,
      job,
      build_is_live: true,
      reclaim_applied: false,
      reclaim_reason: null,
      status: 'build_live',
    }
  }

  return reclaimStaleArtifactBuildLock({
    supabase: params.supabase,
    publication: activePublication,
    job,
    reclaimReason: 'refresh_reclaimed_stale_build',
    nowMs,
    logPrefix,
  })
}

export async function beginGmailArtifactBuild(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  jobId: string
  jobType: GmailArtifactJobType
  phase: string
  lastIndexStateUpdatedAt?: string | null
  lastIndexedMessageCount?: number | null
  senderCheckpoint?: string | null
  messageCheckpoint?: string | null
  clusterCheckpoint?: string | null
}): Promise<{
  publication: GmailArtifactPublicationRow
  job: GmailArtifactJobRow
}> {
  const startedAt = nowIso()
  const publication = await writePublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    patch: {
      building_version: normalizeText(params.artifactVersion),
      build_status: 'building',
      last_error: null,
      last_error_at: null,
      last_index_state_updated_at: normalizeNullableText(params.lastIndexStateUpdatedAt),
      last_indexed_message_count:
        typeof params.lastIndexedMessageCount === 'number' &&
        Number.isFinite(params.lastIndexedMessageCount)
          ? Math.max(0, Math.round(params.lastIndexedMessageCount))
          : null,
      freshness_state:
        params.jobType === 'incremental_refresh'
          ? 'refresh_in_progress'
          : params.jobType === 'full_rebuild'
            ? 'refresh_in_progress'
            : undefined,
      refresh_strategy:
        params.jobType === 'incremental_refresh'
          ? 'incremental'
          : params.jobType === 'full_rebuild'
            ? 'full_rebuild'
            : undefined,
      refresh_started_at: startedAt,
      refresh_completed_at: null,
      refresh_job_id: normalizeText(params.jobId),
    },
  })

  const job = await writeArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    patch: {
      job_type: params.jobType,
      status: 'running',
      phase: normalizeText(params.phase) || 'starting',
      started_at: startedAt,
      completed_at: null,
      heartbeat_at: startedAt,
      last_error: null,
      last_error_at: null,
      sender_checkpoint: normalizeNullableText(params.senderCheckpoint),
      message_checkpoint: normalizeNullableText(params.messageCheckpoint),
      cluster_checkpoint: normalizeNullableText(params.clusterCheckpoint),
    },
  })

  return { publication, job }
}

export async function updateGmailArtifactBuildProgress(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  phase?: string | null
  senderCheckpoint?: string | null
  messageCheckpoint?: string | null
  clusterCheckpoint?: string | null
  processedSenderCount?: number | null
  processedMessageCount?: number | null
  processedClusterCount?: number | null
}): Promise<GmailArtifactJobRow> {
  const patch: Partial<GmailArtifactJobRow> = {
    heartbeat_at: nowIso(),
  }
  if (params.phase !== undefined) patch.phase = normalizeNullableText(params.phase)
  if (params.senderCheckpoint !== undefined) {
    patch.sender_checkpoint = normalizeNullableText(params.senderCheckpoint)
  }
  if (params.messageCheckpoint !== undefined) {
    patch.message_checkpoint = normalizeNullableText(params.messageCheckpoint)
  }
  if (params.clusterCheckpoint !== undefined) {
    patch.cluster_checkpoint = normalizeNullableText(params.clusterCheckpoint)
  }
  if (
    typeof params.processedSenderCount === 'number' &&
    Number.isFinite(params.processedSenderCount)
  ) {
    patch.processed_sender_count = Math.max(0, Math.round(params.processedSenderCount))
  }
  if (
    typeof params.processedMessageCount === 'number' &&
    Number.isFinite(params.processedMessageCount)
  ) {
    patch.processed_message_count = Math.max(0, Math.round(params.processedMessageCount))
  }
  if (
    typeof params.processedClusterCount === 'number' &&
    Number.isFinite(params.processedClusterCount)
  ) {
    patch.processed_cluster_count = Math.max(0, Math.round(params.processedClusterCount))
  }
  return writeArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    patch,
  })
}

export function snapshotGmailArtifactPublicationRestoreState(
  publication: GmailArtifactPublicationRow | null | undefined
): GmailArtifactPublicationRestoreState {
  return {
    published_version: normalizeNullableText(publication?.published_version),
    published_at: normalizeNullableText(publication?.published_at),
    building_version: normalizeNullableText(publication?.building_version),
    build_status: normalizeBuildStatus(publication?.build_status),
    last_error: normalizeNullableText(publication?.last_error),
    last_error_at: normalizeNullableText(publication?.last_error_at),
    last_index_state_updated_at: normalizeNullableText(publication?.last_index_state_updated_at),
    last_indexed_message_count:
      typeof publication?.last_indexed_message_count === 'number' &&
      Number.isFinite(publication.last_indexed_message_count)
        ? Math.max(0, Math.round(publication.last_indexed_message_count))
        : null,
    freshness_state: normalizeFreshnessState(publication?.freshness_state),
    freshness_reason: normalizeNullableText(publication?.freshness_reason),
    refresh_strategy: normalizeRefreshStrategy(publication?.refresh_strategy),
    refresh_requested_at: normalizeNullableText(publication?.refresh_requested_at),
    refresh_started_at: normalizeNullableText(publication?.refresh_started_at),
    refresh_completed_at: normalizeNullableText(publication?.refresh_completed_at),
    refresh_job_id: normalizeNullableText(publication?.refresh_job_id),
    refresh_sync_run_id: normalizeNullableText(publication?.refresh_sync_run_id),
  }
}

function normalizePublicationRestoreState(
  restoreState: GmailArtifactPublicationRestoreState
): GmailArtifactPublicationRestoreState {
  return {
    published_version: normalizeNullableText(restoreState.published_version),
    published_at: normalizeNullableText(restoreState.published_at),
    building_version: normalizeNullableText(restoreState.building_version),
    build_status: normalizeBuildStatus(restoreState.build_status),
    last_error: normalizeNullableText(restoreState.last_error),
    last_error_at: normalizeNullableText(restoreState.last_error_at),
    last_index_state_updated_at: normalizeNullableText(restoreState.last_index_state_updated_at),
    last_indexed_message_count:
      typeof restoreState.last_indexed_message_count === 'number' &&
      Number.isFinite(restoreState.last_indexed_message_count)
        ? Math.max(0, Math.round(restoreState.last_indexed_message_count))
        : null,
    freshness_state: normalizeFreshnessState(restoreState.freshness_state),
    freshness_reason: normalizeNullableText(restoreState.freshness_reason),
    refresh_strategy: normalizeRefreshStrategy(restoreState.refresh_strategy),
    refresh_requested_at: normalizeNullableText(restoreState.refresh_requested_at),
    refresh_started_at: normalizeNullableText(restoreState.refresh_started_at),
    refresh_completed_at: normalizeNullableText(restoreState.refresh_completed_at),
    refresh_job_id: normalizeNullableText(restoreState.refresh_job_id),
    refresh_sync_run_id: normalizeNullableText(restoreState.refresh_sync_run_id),
  }
}

export async function completeGmailArtifactBuildCandidate(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  publicationRestoreState: GmailArtifactPublicationRestoreState
  processedSenderCount?: number | null
  processedMessageCount?: number | null
  processedClusterCount?: number | null
}): Promise<GmailArtifactPublicationRow> {
  const completedAt = nowIso()
  const restoreState = normalizePublicationRestoreState(params.publicationRestoreState)
  const restoredPublication = await writePublicationStateCompareAndSet({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    patch: {
      ...restoreState,
      building_version: restoreState.building_version,
    },
    expected: {
      building_version: normalizeText(params.artifactVersion),
      refresh_job_id: normalizeText(params.jobId),
    },
  })

  if (!restoredPublication) {
    throw new Error(
      `Unable to restore publication state after candidate build for ${params.artifactVersion}; publication preconditions drifted.`
    )
  }

  await writeArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    patch: {
      status: 'completed',
      phase: 'candidate_ready',
      heartbeat_at: completedAt,
      completed_at: completedAt,
      processed_sender_count:
        typeof params.processedSenderCount === 'number' && Number.isFinite(params.processedSenderCount)
          ? Math.max(0, Math.round(params.processedSenderCount))
          : undefined,
      processed_message_count:
        typeof params.processedMessageCount === 'number' && Number.isFinite(params.processedMessageCount)
          ? Math.max(0, Math.round(params.processedMessageCount))
          : undefined,
      processed_cluster_count:
        typeof params.processedClusterCount === 'number' && Number.isFinite(params.processedClusterCount)
          ? Math.max(0, Math.round(params.processedClusterCount))
          : undefined,
    },
  })

  return restoredPublication
}

export async function promoteGmailArtifactPublication(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  lastIndexStateUpdatedAt?: string | null
  lastIndexedMessageCount?: number | null
  expectedCurrentPublication?: GmailArtifactPublicationCompareAndSetExpectation
}): Promise<GmailArtifactPublicationRow> {
  const completedAt = nowIso()
  const currentPublication = await loadPublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const newerRefreshRequested = publicationHasNewerRefreshRequestThanStartedBuild(currentPublication)
  const patch: Partial<GmailArtifactPublicationRow> = {
    published_version: normalizeText(params.artifactVersion),
    published_at: completedAt,
    building_version: null,
    build_status: 'published',
    last_error: null,
    last_error_at: null,
    last_index_state_updated_at: normalizeNullableText(params.lastIndexStateUpdatedAt),
    last_indexed_message_count:
      typeof params.lastIndexedMessageCount === 'number' &&
      Number.isFinite(params.lastIndexedMessageCount)
        ? Math.max(0, Math.round(params.lastIndexedMessageCount))
        : null,
    freshness_state: newerRefreshRequested ? undefined : 'fresh',
    freshness_reason: newerRefreshRequested ? undefined : 'published_artifact_current',
    refresh_completed_at: newerRefreshRequested ? undefined : completedAt,
    refresh_job_id: newerRefreshRequested ? undefined : normalizeText(params.jobId),
  }

  const publication = params.expectedCurrentPublication
    ? await writePublicationStateCompareAndSet({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: params.analysisScope,
        patch,
        expected: params.expectedCurrentPublication,
      })
    : await writePublicationState({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: params.analysisScope,
        patch,
      })

  if (!publication) {
    throw new Error(
      `Unable to publish artifact version ${params.artifactVersion}; compare-and-set publication prechecks failed.`
    )
  }

  return publication
}

export async function publishGmailArtifactBuild(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  lastIndexStateUpdatedAt?: string | null
  lastIndexedMessageCount?: number | null
  processedSenderCount?: number | null
  processedMessageCount?: number | null
  processedClusterCount?: number | null
  expectedCurrentPublication?: GmailArtifactPublicationCompareAndSetExpectation
  markJobPublished?: boolean
}): Promise<void> {
  const completedAt = nowIso()
  await promoteGmailArtifactPublication({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    lastIndexStateUpdatedAt: params.lastIndexStateUpdatedAt,
    lastIndexedMessageCount: params.lastIndexedMessageCount,
    expectedCurrentPublication: params.expectedCurrentPublication,
  })

  if (params.markJobPublished === false) {
    return
  }

  await writeArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    patch: {
      status: 'completed',
      phase: 'published',
      heartbeat_at: completedAt,
      completed_at: completedAt,
      processed_sender_count:
        typeof params.processedSenderCount === 'number' && Number.isFinite(params.processedSenderCount)
          ? Math.max(0, Math.round(params.processedSenderCount))
          : undefined,
      processed_message_count:
        typeof params.processedMessageCount === 'number' && Number.isFinite(params.processedMessageCount)
          ? Math.max(0, Math.round(params.processedMessageCount))
          : undefined,
      processed_cluster_count:
        typeof params.processedClusterCount === 'number' && Number.isFinite(params.processedClusterCount)
          ? Math.max(0, Math.round(params.processedClusterCount))
          : undefined,
    },
  })
}

export async function failGmailArtifactBuild(params: {
  supabase: SupabaseClient
  jobId: string
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  error: unknown
  phase?: string | null
}): Promise<void> {
  const message = stringifyError(params.error)
  const failedAt = nowIso()
  const currentPublication = await loadPublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const newerRefreshRequested = publicationHasNewerRefreshRequestThanStartedBuild(currentPublication)
  await writePublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    patch: {
      building_version: null,
      build_status: 'failed',
      last_error: message,
      last_error_at: failedAt,
      freshness_state: newerRefreshRequested ? undefined : 'refresh_failed',
      freshness_reason: newerRefreshRequested ? undefined : message,
      refresh_completed_at: newerRefreshRequested ? undefined : failedAt,
      refresh_job_id: newerRefreshRequested ? undefined : normalizeText(params.jobId),
    },
  })
  await writeArtifactJob({
    supabase: params.supabase,
    jobId: params.jobId,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: params.artifactVersion,
    patch: {
      status: 'failed',
      phase: normalizeText(params.phase) || 'build_failed',
      heartbeat_at: failedAt,
      completed_at: failedAt,
      last_error: message,
      last_error_at: failedAt,
    },
  })
}

export async function clearGmailArtifactBuildVersionRows(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<void> {
  const tables = [
    'gmail_sender_workspace_seed_headers',
    'gmail_sender_workspace_seed_rows',
    'gmail_sender_scope_rollups',
    'gmail_cluster_summaries',
    'gmail_mailbox_intelligence_snapshots',
    'gmail_mailbox_intelligence_buckets',
    'gmail_preview_index',
  ] as const

  for (const table of tables) {
    const { error } = await params.supabase
      .from(table)
      .delete()
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`)
    }
  }
}

export async function upsertGmailSenderWorkspaceSeedHeaders(params: {
  supabase: SupabaseClient
  rows: GmailSenderWorkspaceSeedHeaderRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_sender_workspace_seed_headers',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          cluster_id: normalizeText(row.cluster_id),
          cluster_type: normalizeText(row.cluster_type),
          title: normalizeText(row.title),
          query: normalizeText(row.query),
          why_selected: normalizeNullableText(row.why_selected),
          risk_note: normalizeNullableText(row.risk_note),
          safety_note: normalizeNullableText(row.safety_note),
          message_count: normalizeInteger(row.message_count),
          sender_count: normalizeInteger(row.sender_count),
          share_pct: Math.min(100, normalizeInteger(row.share_pct)),
          pagination: normalizeJsonObject(row.pagination),
          analytics: normalizeJsonObject(row.analytics),
          source: normalizeText(row.source) || 'full_mailbox_artifact',
        },
        timestamp
      )
    ),
    onConflict: 'tenant_id,analysis_scope,cluster_id,artifact_version',
  })
}

export async function upsertGmailSenderWorkspaceSeedRows(params: {
  supabase: SupabaseClient
  rows: GmailSenderWorkspaceSeedRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_sender_workspace_seed_rows',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          cluster_id: normalizeText(row.cluster_id),
          sender_key: normalizeText(row.sender_key),
          default_rank: normalizeInteger(row.default_rank),
          sender: normalizeText(row.sender),
          sender_domain: normalizeNullableText(row.sender_domain),
          cleanup_group_message_count: normalizeInteger(row.cleanup_group_message_count),
          unread_count: normalizeInteger(row.unread_count),
          protected_hint: normalizeNullableText(row.protected_hint),
          requires_verification: normalizeBoolean(row.requires_verification),
          verification_reasons: normalizeStringArray(row.verification_reasons),
          preview_message_ids: normalizeStringArray(row.preview_message_ids),
          preview_ready: normalizeBoolean(row.preview_ready),
          semantic_family_key: normalizeNullableText(row.semantic_family_key),
          semantic_subtype_key: normalizeNullableText(row.semantic_subtype_key),
          semantic_pattern_key: normalizeNullableText(row.semantic_pattern_key),
          last_activity_at: normalizeNullableText(row.last_activity_at),
          seed_payload: normalizeJsonObject(row.seed_payload),
        },
        timestamp
      )
    ),
    onConflict: 'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version',
  })
}

export async function upsertGmailSenderScopeRollupRows(params: {
  supabase: SupabaseClient
  rows: GmailSenderScopeRollupRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_sender_scope_rollups',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          sender_key: normalizeText(row.sender_key),
          sender: normalizeText(row.sender),
          assigned_cleanup_group_id: normalizeText(row.assigned_cleanup_group_id),
          assignment_reason: normalizeText(row.assignment_reason),
          is_cleanup_candidate: normalizeBoolean(row.is_cleanup_candidate),
          total_message_count: normalizeInteger(row.total_message_count),
          cleanup_candidate_message_count: normalizeInteger(row.cleanup_candidate_message_count),
          protected_message_count: normalizeInteger(row.protected_message_count),
          likely_human_message_count: normalizeInteger(row.likely_human_message_count),
          unread_count: normalizeInteger(row.unread_count),
          first_seen: normalizeNullableText(row.first_seen),
          last_seen: normalizeNullableText(row.last_seen),
          category_summary: normalizeText(row.category_summary) || 'General updates',
          sender_signal: normalizeSenderSignal(row.sender_signal),
          cleanup_exclusion_reason: normalizeNullableText(row.cleanup_exclusion_reason),
        },
        timestamp
      )
    ),
    onConflict: 'tenant_id,analysis_scope,artifact_version,sender_key',
  })
}

export async function upsertGmailClusterSummaries(params: {
  supabase: SupabaseClient
  rows: GmailClusterSummaryArtifactRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_cluster_summaries',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          cluster_id: normalizeText(row.cluster_id),
          cluster_type: normalizeText(row.cluster_type),
          title: normalizeText(row.title),
          query: normalizeText(row.query),
          why_selected: normalizeNullableText(row.why_selected),
          risk_note: normalizeNullableText(row.risk_note),
          safety_note: normalizeNullableText(row.safety_note),
          message_count: normalizeInteger(row.message_count),
          sender_count: normalizeInteger(row.sender_count),
          share_pct: Math.min(100, normalizeInteger(row.share_pct)),
          dominant_sender: normalizeNullableText(row.dominant_sender),
          dominant_pattern: normalizeNullableText(row.dominant_pattern),
          protected_message_count: normalizeInteger(row.protected_message_count),
          uncertain_sender_count: normalizeInteger(row.uncertain_sender_count),
          summary_payload: normalizeJsonObject(row.summary_payload),
        },
        timestamp
      )
    ),
    onConflict: 'tenant_id,analysis_scope,cluster_id,artifact_version',
  })
}

export async function upsertGmailMailboxIntelligenceSnapshots(params: {
  supabase: SupabaseClient
  rows: GmailMailboxIntelligenceSnapshotRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_mailbox_intelligence_snapshots',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          snapshot_payload: normalizeJsonObject(row.snapshot_payload),
          source: normalizeText(row.source) || 'full_mailbox_artifact',
        },
        timestamp
      )
    ),
    onConflict: 'tenant_id,analysis_scope,artifact_version',
  })
}

export async function upsertGmailMailboxIntelligenceBuckets(params: {
  supabase: SupabaseClient
  rows: GmailMailboxIntelligenceBucketRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_mailbox_intelligence_buckets',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          bucket_kind: normalizeText(row.bucket_kind),
          bucket_key: normalizeText(row.bucket_key),
          bucket_start_at: normalizeText(row.bucket_start_at),
          bucket_end_at: normalizeNullableText(row.bucket_end_at),
          bucket_value: normalizeInteger(row.bucket_value),
          bucket_payload: normalizeJsonObject(row.bucket_payload),
        },
        timestamp
      )
    ),
    onConflict:
      'tenant_id,analysis_scope,artifact_version,bucket_kind,bucket_key,bucket_start_at',
  })
}

export async function upsertGmailPreviewIndexRows(params: {
  supabase: SupabaseClient
  rows: GmailPreviewIndexRow[]
}): Promise<void> {
  const timestamp = nowIso()
  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_preview_index',
    rows: params.rows.map((row) =>
      withTimestamp(
        {
          ...row,
          tenant_id: normalizeText(row.tenant_id),
          analysis_scope: normalizeAnalysisScope(row.analysis_scope),
          artifact_version: normalizeText(row.artifact_version),
          cluster_id: normalizeText(row.cluster_id),
          sender_key: normalizeText(row.sender_key),
          preview_rank: normalizeInteger(row.preview_rank),
          message_id: normalizeText(row.message_id),
          thread_id: normalizeNullableText(row.thread_id),
          sender: normalizeNullableText(row.sender),
          subject: normalizeNullableText(row.subject),
          snippet: normalizeNullableText(row.snippet),
          internal_date_ms:
            typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
              ? Math.round(row.internal_date_ms)
              : null,
          date: normalizeNullableText(row.date),
          label_ids: normalizeStringArray(row.label_ids),
          category_labels: normalizeStringArray(row.category_labels),
          is_in_inbox: normalizeBoolean(row.is_in_inbox),
          is_unread: normalizeBoolean(row.is_unread),
          is_important: normalizeBoolean(row.is_important),
          is_starred: normalizeBoolean(row.is_starred),
          protected_hint: normalizeNullableText(row.protected_hint),
          preview_payload: normalizeJsonObject(row.preview_payload),
        },
        timestamp
      )
    ),
    onConflict:
      'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version,preview_rank',
  })
}

export async function replaceGmailPreviewIndexRowsForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  rows: GmailPreviewIndexRow[]
  clearClusterSenderKeys?: Array<{ clusterId: string; senderKey: string }>
}): Promise<void> {
  const timestamp = nowIso()
  const normalizedRows = params.rows.map((row) =>
    withTimestamp(
      {
        ...row,
        tenant_id: normalizeText(row.tenant_id),
        analysis_scope: normalizeAnalysisScope(row.analysis_scope),
        artifact_version: normalizeText(row.artifact_version),
        cluster_id: normalizeText(row.cluster_id),
        sender_key: normalizeText(row.sender_key),
        preview_rank: normalizeInteger(row.preview_rank),
        message_id: normalizeText(row.message_id),
        thread_id: normalizeNullableText(row.thread_id),
        sender: normalizeNullableText(row.sender),
        subject: normalizeNullableText(row.subject),
        snippet: normalizeNullableText(row.snippet),
        internal_date_ms:
          typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)
            ? Math.round(row.internal_date_ms)
            : null,
        date: normalizeNullableText(row.date),
        label_ids: normalizeStringArray(row.label_ids),
        category_labels: normalizeStringArray(row.category_labels),
        is_in_inbox: normalizeBoolean(row.is_in_inbox),
        is_unread: normalizeBoolean(row.is_unread),
        is_important: normalizeBoolean(row.is_important),
        is_starred: normalizeBoolean(row.is_starred),
        protected_hint: normalizeNullableText(row.protected_hint),
        preview_payload: normalizeJsonObject(row.preview_payload),
      },
      timestamp
    )
  )
  const clearPairs =
    params.clearClusterSenderKeys && params.clearClusterSenderKeys.length > 0
      ? params.clearClusterSenderKeys
      : normalizedRows.map((row) => ({
          clusterId: row.cluster_id,
          senderKey: row.sender_key,
        }))
  const senderKeysByClusterId = new Map<string, Set<string>>()
  for (const pair of clearPairs) {
    const clusterId = normalizeText(pair.clusterId)
    const senderKey = normalizeText(pair.senderKey)
    if (!clusterId || !senderKey) continue
    const senderKeys = senderKeysByClusterId.get(clusterId) || new Set<string>()
    senderKeys.add(senderKey)
    senderKeysByClusterId.set(clusterId, senderKeys)
  }

  if (senderKeysByClusterId.size === 0) {
    await replaceVersionRows({
      supabase: params.supabase,
      table: 'gmail_preview_index',
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      artifactVersion: params.artifactVersion,
      rows: normalizedRows,
      onConflict:
        'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version,preview_rank',
    })
    return
  }

  for (const [clusterId, senderKeys] of senderKeysByClusterId.entries()) {
    for (const batch of chunkArray(
      Array.from(senderKeys),
      GMAIL_ARTIFACT_PREVIEW_REPLACE_DELETE_SENDER_BATCH_SIZE
    )) {
      if (batch.length === 0) continue
      let deletedRowCount = 0
      do {
        deletedRowCount = await withArtifactStoreRetry({
          label: 'gmail_preview_index.clear_cluster_sender_batch',
          run: async () => {
            const { data, error: deleteError } = await params.supabase
              .from('gmail_preview_index')
              .delete()
              .eq('tenant_id', params.tenantId)
              .eq('analysis_scope', params.analysisScope)
              .eq('artifact_version', params.artifactVersion)
              .eq('cluster_id', clusterId)
              .in('sender_key', batch)
              .select('cluster_id,sender_key,preview_rank')
              .limit(GMAIL_ARTIFACT_PREVIEW_REPLACE_DELETE_ROW_LIMIT)

            if (deleteError) {
              throw new Error(`Failed to clear gmail_preview_index: ${deleteError.message}`)
            }

            return Array.isArray(data) ? data.length : 0
          },
        })
      } while (deletedRowCount === GMAIL_ARTIFACT_PREVIEW_REPLACE_DELETE_ROW_LIMIT)
    }
  }

  await upsertVersionRows({
    supabase: params.supabase,
    table: 'gmail_preview_index',
    rows: normalizedRows,
    onConflict: 'tenant_id,analysis_scope,cluster_id,sender_key,artifact_version,preview_rank',
  })
}

export async function loadGmailSenderScopeRollupsForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailSenderScopeRollupRow[]> {
  const pageSize = 1000
  const rows: GmailSenderScopeRollupRow[] = []
  let cursor: string | null = null
  while (true) {
    let query = params.supabase
      .from('gmail_sender_scope_rollups')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .order('sender_key', { ascending: true })
      .limit(pageSize)

    if (cursor) {
      query = query.gt('sender_key', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to load gmail_sender_scope_rollups: ${error.message}`)
    }
    const batch = (data || []) as GmailSenderScopeRollupRow[]
    rows.push(...batch)
    if (batch.length < pageSize) break
    cursor = normalizeText(batch[batch.length - 1]?.sender_key)
    if (!cursor) break
  }
  return rows
}

export async function loadGmailSenderWorkspaceSeedHeadersForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailSenderWorkspaceSeedHeaderRow[]> {
  const { data, error } = await params.supabase
    .from('gmail_sender_workspace_seed_headers')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .order('message_count', { ascending: false })
    .order('title', { ascending: true })

  if (error) {
    throw new Error(`Failed to load gmail_sender_workspace_seed_headers: ${error.message}`)
  }

  return (data || []) as GmailSenderWorkspaceSeedHeaderRow[]
}

export async function loadGmailSenderWorkspaceSeedRowsForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailSenderWorkspaceSeedRow[]> {
  const pageSize = 1000
  const rows: GmailSenderWorkspaceSeedRow[] = []
  let cursor: { cluster_id: string; default_rank: number } | null = null
  while (true) {
    let query = params.supabase
      .from('gmail_sender_workspace_seed_rows')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .order('cluster_id', { ascending: true })
      .order('default_rank', { ascending: true })
      .limit(pageSize)

    if (cursor) {
      const clusterIdFilter = JSON.stringify(cursor.cluster_id)
      query = query.or(
        `cluster_id.gt.${clusterIdFilter},and(cluster_id.eq.${clusterIdFilter},default_rank.gt.${cursor.default_rank})`
      )
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to load gmail_sender_workspace_seed_rows: ${error.message}`)
    }

    const batch = (data || []) as GmailSenderWorkspaceSeedRow[]
    rows.push(...batch)
    if (batch.length < pageSize) break
    const lastRow = batch[batch.length - 1]
    cursor = {
      cluster_id: normalizeText(lastRow?.cluster_id),
      default_rank: normalizeInteger(lastRow?.default_rank),
    }
    if (!cursor.cluster_id) break
  }
  return rows
}

export async function loadGmailClusterSummariesForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailClusterSummaryArtifactRow[]> {
  const { data, error } = await params.supabase
    .from('gmail_cluster_summaries')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .order('message_count', { ascending: false })
    .order('title', { ascending: true })

  if (error) {
    throw new Error(`Failed to load gmail_cluster_summaries: ${error.message}`)
  }

  return (data || []) as GmailClusterSummaryArtifactRow[]
}

export async function loadGmailPreviewIndexRowsForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  clusterId?: string | null
  clusterIds?: string[] | null
}): Promise<GmailPreviewIndexRow[]> {
  const pageSize = 1000
  const loadClusterRows = async (clusterId: string): Promise<GmailPreviewIndexRow[]> => {
    const clusterRows: GmailPreviewIndexRow[] = []
    let cursor: { sender_key: string; preview_rank: number } | null = null

    while (true) {
      let query = params.supabase
        .from('gmail_preview_index')
        .select('*')
        .eq('tenant_id', params.tenantId)
        .eq('analysis_scope', params.analysisScope)
        .eq('artifact_version', params.artifactVersion)
        .eq('cluster_id', clusterId)
        .order('sender_key', { ascending: true })
        .order('preview_rank', { ascending: true })
        .limit(pageSize)

      if (cursor) {
        const senderKeyFilter = JSON.stringify(cursor.sender_key)
        query = query.or(
          `sender_key.gt.${senderKeyFilter},and(sender_key.eq.${senderKeyFilter},preview_rank.gt.${cursor.preview_rank})`
        )
      }

      const { data, error } = await query
      if (error) {
        throw new Error(`Failed to load gmail_preview_index for artifact version: ${error.message}`)
      }

      const batch = (data || []) as GmailPreviewIndexRow[]
      clusterRows.push(...batch)
      if (batch.length < pageSize) break

      const lastRow = batch[batch.length - 1]
      cursor = {
        sender_key: lastRow.sender_key,
        preview_rank: lastRow.preview_rank,
      }
    }

    return clusterRows
  }

  const requestedClusterId = normalizeText(params.clusterId)
  if (requestedClusterId) {
    return loadClusterRows(requestedClusterId)
  }

  let clusterIds = uniqueStrings(params.clusterIds || [])
  if (clusterIds.length === 0) {
    const { data, error } = await params.supabase
      .from('gmail_sender_workspace_seed_headers')
      .select('cluster_id')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .order('cluster_id', { ascending: true })

    if (error) {
      throw new Error(`Failed to load preview cluster ids: ${error.message}`)
    }

    clusterIds = uniqueStrings(
      ((data || []) as Array<{ cluster_id?: unknown }>).map((row) => normalizeText(row.cluster_id))
    )
  }
  const rows: GmailPreviewIndexRow[] = []
  for (
    let index = 0;
    index < clusterIds.length;
    index += GMAIL_ARTIFACT_CLUSTER_READ_CONCURRENCY
  ) {
    const clusterBatch = clusterIds.slice(
      index,
      index + GMAIL_ARTIFACT_CLUSTER_READ_CONCURRENCY
    )
    const batchRows = await Promise.all(clusterBatch.map((clusterId) => loadClusterRows(clusterId)))
    for (const clusterRows of batchRows) {
      for (const row of clusterRows) {
        rows.push(row)
      }
    }
  }

  return rows
}

export async function loadGmailMailboxIntelligenceSnapshotForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailMailboxIntelligenceSnapshotRow | null> {
  const { data, error } = await params.supabase
    .from('gmail_mailbox_intelligence_snapshots')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load gmail_mailbox_intelligence_snapshot: ${error.message}`)
  }

  return (data || null) as GmailMailboxIntelligenceSnapshotRow | null
}

export async function loadGmailMailboxIntelligenceBucketsForArtifactVersion(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<GmailMailboxIntelligenceBucketRow[]> {
  const { data, error } = await params.supabase
    .from('gmail_mailbox_intelligence_buckets')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .order('bucket_kind', { ascending: true })
    .order('bucket_start_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load gmail_mailbox_intelligence_buckets: ${error.message}`)
  }

  return (data || []) as GmailMailboxIntelligenceBucketRow[]
}

export async function countGmailArtifactVersionRows(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
}): Promise<Record<string, number>> {
  const tables = [
    ['gmail_sender_workspace_seed_headers', 'exact'],
    ['gmail_sender_workspace_seed_rows', 'exact'],
    ['gmail_sender_scope_rollups', 'exact'],
    ['gmail_cluster_summaries', 'exact'],
    ['gmail_mailbox_intelligence_snapshots', 'exact'],
    ['gmail_mailbox_intelligence_buckets', 'exact'],
  ] as const

  const counts = await Promise.all(
    tables.map(async ([table, countStrategy]) => {
      const { count, error } = await params.supabase
        .from(table)
        .select('tenant_id', { count: countStrategy, head: true })
        .eq('tenant_id', params.tenantId)
        .eq('analysis_scope', params.analysisScope)
        .eq('artifact_version', params.artifactVersion)
      if (error) {
        throw new Error(`Failed to count ${table}: ${error.message}`)
      }
      return [table, typeof count === 'number' ? count : 0] as const
    })
  )

  let previewIndexCount = 0
  const { data: previewClusterIdRows, error: previewClusterIdError } = await params.supabase
    .from('gmail_sender_workspace_seed_headers')
    .select('cluster_id')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', params.artifactVersion)
    .order('cluster_id', { ascending: true })

  if (previewClusterIdError) {
    throw new Error(`Failed to load preview cluster ids: ${previewClusterIdError.message}`)
  }

  const previewClusterIds = uniqueStrings(
    ((previewClusterIdRows || []) as Array<{ cluster_id?: unknown }>).map((row) =>
      normalizeText(row.cluster_id)
    )
  )
  for (const clusterId of previewClusterIds) {
    let cursor: { sender_key: string; preview_rank: number } | null = null
    while (true) {
      const batchSize = await withArtifactStoreRetry({
        label: 'gmail_preview_index.count_page',
        run: async () => {
          let query = params.supabase
            .from('gmail_preview_index')
            .select('sender_key,preview_rank')
            .eq('tenant_id', params.tenantId)
            .eq('analysis_scope', params.analysisScope)
            .eq('artifact_version', params.artifactVersion)
            .eq('cluster_id', clusterId)
            .order('sender_key', { ascending: true })
            .order('preview_rank', { ascending: true })
            .limit(GMAIL_ARTIFACT_PREVIEW_COUNT_PAGE_SIZE)

          if (cursor) {
            const senderKeyFilter = JSON.stringify(cursor.sender_key)
            query = query.or(
              `sender_key.gt.${senderKeyFilter},and(sender_key.eq.${senderKeyFilter},preview_rank.gt.${cursor.preview_rank})`
            )
          }

          const { data, error } = await query
          if (error) {
            throw new Error(`Failed to count gmail_preview_index: ${error.message}`)
          }
          const batch = (data || []) as Array<{
            sender_key?: unknown
            preview_rank?: unknown
          }>
          if (batch.length > 0) {
            const lastRow = batch[batch.length - 1]
            cursor = {
              sender_key: normalizeText(lastRow?.sender_key),
              preview_rank: normalizeInteger(lastRow?.preview_rank),
            }
          }
          return batch.length
        },
      })
      previewIndexCount += batchSize
      if (batchSize < GMAIL_ARTIFACT_PREVIEW_COUNT_PAGE_SIZE) {
        break
      }
    }
  }

  return Object.fromEntries([...counts, ['gmail_preview_index', previewIndexCount] as const])
}

export async function loadPublishedGmailSenderWorkspaceArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
}): Promise<GmailPublishedSenderWorkspaceArtifactRead> {
  const baseRead = await loadPublishedSenderWorkspaceArtifactBase(params)
  if (!baseRead.publication || !baseRead.artifact_version) {
    return {
      publication: baseRead.publication,
      artifact_version: null,
      headers: baseRead.headers,
      selected_header: baseRead.selected_header,
      seed_rows: baseRead.seed_rows,
      preview_index_rows: [],
    }
  }

  const previewFetchStrategy = 'sender_key' as const
  const previewRows = await loadPreviewIndexRowsBySenderKeys({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: baseRead.artifact_version,
    selectedClusterId: baseRead.resolved_cluster_id || params.selectedClusterId,
    senderKeys: baseRead.seed_rows.map((row) => row.sender_key),
  })

  return {
    ...baseRead,
    preview_index_rows: previewRows,
    preview_fetch_strategy: previewFetchStrategy,
  }
}

export async function loadPublishedGmailSenderWorkspaceArtifactPage(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
  page: number
  pageSize: number
}): Promise<GmailPublishedSenderWorkspaceArtifactRead> {
  const headerRead = await loadPublishedSenderWorkspaceArtifactHeaders(params)
  if (!headerRead.publication || !headerRead.artifact_version || !headerRead.selected_header) {
    return {
      publication: headerRead.publication,
      artifact_version: headerRead.artifact_version,
      headers: headerRead.headers,
      selected_header: headerRead.selected_header,
      seed_rows: [],
      preview_index_rows: [],
    }
  }

  const totalSenders = Math.max(0, normalizeInteger(headerRead.selected_header.sender_count))
  const normalizedPageSize = Math.max(1, normalizeInteger(params.pageSize, 1))
  const totalPages = Math.max(1, Math.ceil(totalSenders / normalizedPageSize))
  const normalizedPage = Math.min(Math.max(1, normalizeInteger(params.page, 1)), totalPages)
  const rangeStart = (normalizedPage - 1) * normalizedPageSize
  const rangeEnd = rangeStart + normalizedPageSize - 1

  const seedRows: GmailSenderWorkspaceSeedRow[] = []
  const rangeReadPageSize = 1000
  for (let from = rangeStart; from <= rangeEnd; from += rangeReadPageSize) {
    const to = Math.min(from + rangeReadPageSize - 1, rangeEnd)
    const { data, error } = await params.supabase
      .from('gmail_sender_workspace_seed_rows')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', headerRead.artifact_version)
      .eq('cluster_id', normalizeText(headerRead.resolved_cluster_id || params.selectedClusterId))
      .order('default_rank', { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to load gmail_sender_workspace_seed_rows: ${error.message}`)
    }

    const batch = (data || []) as GmailSenderWorkspaceSeedRow[]
    seedRows.push(...batch)
    if (batch.length < to - from + 1) break
  }

  const previewFetchStrategy = 'sender_key' as const
  const previewRows = await loadPreviewIndexRowsBySenderKeys({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: headerRead.artifact_version,
    selectedClusterId: headerRead.resolved_cluster_id || params.selectedClusterId,
    senderKeys: seedRows.map((row) => row.sender_key),
  })

  return {
    ...headerRead,
    seed_rows: seedRows,
    preview_index_rows: previewRows,
    preview_fetch_strategy: previewFetchStrategy,
  }
}

export async function loadPublishedGmailSenderWorkspaceArtifactFocusedPage(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
  page: number
  pageSize: number
  semanticFocus: GmailSenderWorkspaceSemanticFocus
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
}): Promise<GmailPublishedSenderWorkspaceFocusedArtifactRead> {
  const headerRead = await loadPublishedSenderWorkspaceArtifactHeaders(params)
  if (!headerRead.publication || !headerRead.artifact_version || !headerRead.selected_header) {
    return {
      publication: headerRead.publication,
      artifact_version: headerRead.artifact_version,
      headers: headerRead.headers,
      selected_header: headerRead.selected_header,
      seed_rows: [],
      preview_index_rows: [],
      focused_total_senders: 0,
      focused_capability_available: false,
    }
  }

  const focusedCapabilityAvailable = artifactHeaderSupportsFocusedSemanticPage(
    headerRead.selected_header
  )
  if (!focusedCapabilityAvailable) {
    return {
      publication: headerRead.publication,
      artifact_version: headerRead.artifact_version,
      headers: headerRead.headers,
      selected_header: headerRead.selected_header,
      seed_rows: [],
      preview_index_rows: [],
      focused_total_senders: 0,
      focused_capability_available: false,
    }
  }

  let countQuery = params.supabase
    .from('gmail_sender_workspace_seed_rows')
    .select('sender_key', { count: 'exact', head: true })
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', headerRead.artifact_version)
    .eq('cluster_id', normalizeText(headerRead.resolved_cluster_id || params.selectedClusterId))
  countQuery = applyFocusedSemanticFilters(countQuery, params.semanticFocus)

  const { count, error: countError } = await countQuery
  if (countError) {
    throw new Error(
      `Failed to count gmail_sender_workspace_seed_rows for semantic focus: ${countError.message}`
    )
  }

  const focusedTotalSenders = typeof count === 'number' ? Math.max(0, count) : 0
  const normalizedPageSize = Math.max(1, normalizeInteger(params.pageSize))
  const totalPages = Math.max(1, Math.ceil(focusedTotalSenders / normalizedPageSize))
  const normalizedPage = Math.min(Math.max(1, normalizeInteger(params.page)), totalPages)
  const rangeStart = (normalizedPage - 1) * normalizedPageSize
  const rangeEnd = rangeStart + normalizedPageSize - 1
  const primarySortColumn = focusedSemanticSortColumn(params.sort)

  let seedRowsQuery = params.supabase
    .from('gmail_sender_workspace_seed_rows')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .eq('analysis_scope', params.analysisScope)
    .eq('artifact_version', headerRead.artifact_version)
    .eq('cluster_id', normalizeText(headerRead.resolved_cluster_id || params.selectedClusterId))
  seedRowsQuery = applyFocusedSemanticFilters(seedRowsQuery, params.semanticFocus)

  seedRowsQuery =
    params.sort === 'last_activity'
      ? seedRowsQuery.order(primarySortColumn, {
          ascending: params.direction === 'asc',
          nullsFirst: params.direction === 'asc',
        })
      : seedRowsQuery.order(primarySortColumn, {
          ascending: params.direction === 'asc',
        })
  if (primarySortColumn !== 'sender_key') {
    seedRowsQuery = seedRowsQuery.order('sender_key', { ascending: true })
  }
  seedRowsQuery = seedRowsQuery.order('default_rank', { ascending: true }).range(rangeStart, rangeEnd)

  const { data: seedRowData, error: seedRowError } = await seedRowsQuery
  if (seedRowError) {
    throw new Error(
      `Failed to load gmail_sender_workspace_seed_rows focused semantic page: ${seedRowError.message}`
    )
  }

  const seedRows = (seedRowData || []) as GmailSenderWorkspaceSeedRow[]
  const previewFetchStrategy = 'sender_key' as const
  const previewRows = await loadPreviewIndexRowsBySenderKeys({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    artifactVersion: headerRead.artifact_version,
    selectedClusterId: headerRead.resolved_cluster_id || params.selectedClusterId,
    senderKeys: seedRows.map((row) => row.sender_key),
  })

  return {
    ...headerRead,
    seed_rows: seedRows,
    preview_index_rows: previewRows,
    preview_fetch_strategy: previewFetchStrategy,
    focused_total_senders: focusedTotalSenders,
    focused_capability_available: true,
  }
}

export async function loadPublishedGmailSenderWorkspaceArtifactSenderKeys(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
}): Promise<{
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
  sender_keys: string[]
}> {
  const headerRead = await loadPublishedSenderWorkspaceArtifactHeaders(params)
  if (!headerRead.publication || !headerRead.artifact_version) {
    return {
      publication: headerRead.publication,
      artifact_version: headerRead.artifact_version,
      headers: headerRead.headers,
      selected_header: headerRead.selected_header,
      sender_keys: [],
    }
  }

  const selectedClusterSenderCount = Math.max(
    0,
    normalizeInteger(headerRead.selected_header?.sender_count)
  )

  const senderKeyCacheKey = versionedArtifactCacheKey([
    params.tenantId,
    params.analysisScope,
    headerRead.artifact_version,
    headerRead.resolved_cluster_id || params.selectedClusterId,
  ])
  const cachedSenderKeys = senderWorkspaceSenderKeysCache.get(senderKeyCacheKey) || null
  let senderKeys: string[]
  if (cachedSenderKeys && cachedSenderKeys.expires_at_ms > Date.now()) {
    senderKeys = cachedSenderKeys.data
  } else {
    const inflight = senderWorkspaceSenderKeysInflight.get(senderKeyCacheKey)
    const loadPromise =
      inflight ||
      (async () => {
        const senderKeyRows = await Promise.all(
          Array.from(
            {
              length: Math.max(
                1,
                Math.ceil(selectedClusterSenderCount / GMAIL_ARTIFACT_SENDER_KEY_READ_BATCH_SIZE)
              ),
            },
            async (_, batchIndex) => {
              const rangeStart = batchIndex * GMAIL_ARTIFACT_SENDER_KEY_READ_BATCH_SIZE
              const rangeEnd = Math.min(
                selectedClusterSenderCount - 1,
                rangeStart + GMAIL_ARTIFACT_SENDER_KEY_READ_BATCH_SIZE - 1
              )

              const { data, error } = await params.supabase
                .from('gmail_sender_workspace_seed_rows')
                .select('sender_key')
                .eq('tenant_id', params.tenantId)
                .eq('analysis_scope', params.analysisScope)
                .eq('artifact_version', headerRead.artifact_version)
                .eq('cluster_id', normalizeText(headerRead.resolved_cluster_id || params.selectedClusterId))
                .order('default_rank', { ascending: true })
                .range(rangeStart, Math.max(rangeStart, rangeEnd))

              if (error) {
                throw new Error(
                  `Failed to load gmail_sender_workspace_seed_rows sender_key list: ${error.message}`
                )
              }

              return Array.isArray(data) ? data : []
            }
          )
        )

        const loadedSenderKeys = senderKeyRows
          .flat()
          .map((row) =>
            typeof (row as { sender_key?: unknown }).sender_key === 'string'
              ? (row as { sender_key: string }).sender_key.trim()
              : ''
          )
          .filter(Boolean)

        senderWorkspaceSenderKeysCache.set(senderKeyCacheKey, {
          expires_at_ms: Date.now() + GMAIL_ARTIFACT_VERSIONED_READ_CACHE_TTL_MS,
          data: loadedSenderKeys,
        })
        return loadedSenderKeys
      })()

    if (!inflight) {
      senderWorkspaceSenderKeysInflight.set(senderKeyCacheKey, loadPromise)
    }
    try {
      senderKeys = await loadPromise
    } finally {
      senderWorkspaceSenderKeysInflight.delete(senderKeyCacheKey)
    }
  }

  return {
    publication: headerRead.publication,
    artifact_version: headerRead.artifact_version,
    headers: headerRead.headers,
    selected_header: headerRead.selected_header,
    sender_keys: senderKeys,
  }
}

export async function loadPublishedGmailSenderWorkspaceExecutionArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
  previewSenderKeys?: string[]
  previewMessageIds?: string[]
}): Promise<GmailPublishedSenderWorkspaceExecutionArtifactRead> {
  const baseRead = await loadPublishedSenderWorkspaceArtifactBase(params)
  if (!baseRead.publication || !baseRead.artifact_version) {
    return {
      publication: baseRead.publication,
      artifact_version: null,
      headers: baseRead.headers,
      selected_header: baseRead.selected_header,
      seed_rows: baseRead.seed_rows,
      preview_index_rows: [],
    }
  }

  const [previewRowsBySenderKeys, previewRowsByMessageIds] = await Promise.all([
    loadPreviewIndexRowsBySenderKeys({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      artifactVersion: baseRead.artifact_version,
      selectedClusterId: baseRead.resolved_cluster_id || params.selectedClusterId,
      senderKeys: params.previewSenderKeys || [],
    }),
    loadPreviewIndexRowsByMessageIds({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: params.analysisScope,
      artifactVersion: baseRead.artifact_version,
      selectedClusterId: baseRead.resolved_cluster_id || params.selectedClusterId,
      messageIds: params.previewMessageIds || [],
    }),
  ])

  const previewRowsByCompositeKey = new Map<string, GmailPreviewIndexRow>()
  for (const row of [...previewRowsBySenderKeys, ...previewRowsByMessageIds]) {
    previewRowsByCompositeKey.set(
      [row.cluster_id, row.sender_key, row.message_id, String(row.preview_rank)].join('::'),
      row
    )
  }

  return {
    ...baseRead,
    preview_index_rows: Array.from(previewRowsByCompositeKey.values()).sort(
      (left, right) =>
        left.sender_key.localeCompare(right.sender_key) ||
        left.preview_rank - right.preview_rank ||
        left.message_id.localeCompare(right.message_id)
    ),
  }
}

async function loadPublishedSenderWorkspaceArtifactBase(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
}): Promise<{
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  requested_cluster_id: string
  resolved_cluster_id: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
  seed_rows: GmailSenderWorkspaceSeedRow[]
}> {
  const headerRead = await loadPublishedSenderWorkspaceArtifactHeaders(params)
  if (!headerRead.publication || !headerRead.artifact_version) {
    return {
      publication: headerRead.publication,
      artifact_version: headerRead.artifact_version,
      requested_cluster_id: headerRead.requested_cluster_id,
      resolved_cluster_id: headerRead.resolved_cluster_id,
      headers: headerRead.headers,
      selected_header: headerRead.selected_header,
      seed_rows: [],
    }
  }

  const selectedClusterSenderCount = Math.max(
    0,
    normalizeInteger(headerRead.selected_header?.sender_count)
  )
  const seedRows: GmailSenderWorkspaceSeedRow[] = []
  const rangeReadPageSize = GMAIL_ARTIFACT_SENDER_KEY_READ_BATCH_SIZE
  for (
    let from = 0;
    from < Math.max(selectedClusterSenderCount, 1);
    from += rangeReadPageSize
  ) {
    const to = Math.min(from + rangeReadPageSize - 1, selectedClusterSenderCount - 1)
    const { data, error } = await params.supabase
      .from('gmail_sender_workspace_seed_rows')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', headerRead.artifact_version)
      .eq('cluster_id', normalizeText(headerRead.resolved_cluster_id || params.selectedClusterId))
      .order('default_rank', { ascending: true })
      .range(from, Math.max(from, to))

    if (error) {
      throw new Error(`Failed to load gmail_sender_workspace_seed_rows: ${error.message}`)
    }

    const batch = (data || []) as GmailSenderWorkspaceSeedRow[]
    seedRows.push(...batch)
    if (batch.length < Math.max(0, to - from + 1)) break
  }

  return {
    publication: headerRead.publication,
    artifact_version: headerRead.artifact_version,
    requested_cluster_id: headerRead.requested_cluster_id,
    resolved_cluster_id: headerRead.resolved_cluster_id,
    headers: headerRead.headers,
    selected_header: headerRead.selected_header,
    seed_rows: seedRows,
  }
}

async function loadPublishedSenderWorkspaceArtifactHeaders(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  selectedClusterId: string
}): Promise<{
  publication: GmailArtifactPublicationRow | null
  artifact_version: string | null
  requested_cluster_id: string
  resolved_cluster_id: string | null
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  selected_header: GmailSenderWorkspaceSeedHeaderRow | null
}> {
  const publication = await loadPublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const artifactVersion = normalizeNullableText(publication?.published_version)
  if (!publication || !artifactVersion) {
    return {
      publication,
      artifact_version: null,
      requested_cluster_id: normalizeText(params.selectedClusterId),
      resolved_cluster_id: null,
      headers: [],
      selected_header: null,
    }
  }

  const headerCacheKey = versionedArtifactCacheKey([
    params.tenantId,
    params.analysisScope,
    artifactVersion,
  ])
  const cachedHeaders = senderWorkspaceHeaderCache.get(headerCacheKey) || null
  let headers: GmailSenderWorkspaceSeedHeaderRow[]
  if (cachedHeaders && cachedHeaders.expires_at_ms > Date.now()) {
    headers = cachedHeaders.data
  } else {
    const inflight = senderWorkspaceHeaderInflight.get(headerCacheKey)
    const loadPromise =
      inflight ||
      (async () => {
        const { data, error } = await params.supabase
          .from('gmail_sender_workspace_seed_headers')
          .select('*')
          .eq('tenant_id', params.tenantId)
          .eq('analysis_scope', params.analysisScope)
          .eq('artifact_version', artifactVersion)
          .order('cluster_id', { ascending: true })

        if (error) {
          throw new Error(`Failed to load gmail_sender_workspace_seed_headers: ${error.message}`)
        }

        const loadedHeaders = (data || []) as GmailSenderWorkspaceSeedHeaderRow[]
        senderWorkspaceHeaderCache.set(headerCacheKey, {
          expires_at_ms: Date.now() + GMAIL_ARTIFACT_VERSIONED_READ_CACHE_TTL_MS,
          data: loadedHeaders,
        })
        return loadedHeaders
      })()

    if (!inflight) {
      senderWorkspaceHeaderInflight.set(headerCacheKey, loadPromise)
    }
    try {
      headers = await loadPromise
    } finally {
      senderWorkspaceHeaderInflight.delete(headerCacheKey)
    }
  }

  return {
    publication,
    artifact_version: artifactVersion,
    ...resolveCleanupClusterHeaderSelection({
      requestedClusterId: params.selectedClusterId,
      headers,
    }),
  }
}

export async function loadSelectedClusterRailFamily(params: {
  supabase: SupabaseClient
  tenantId: string
  preferredClusterId: string
  clusterTitle?: string | null
  snapshotFallbackByScope?: Partial<
    Record<GmailArtifactAnalysisScope, SelectedClusterRailSnapshotScopeFallback | null>
  >
}): Promise<SelectedClusterRailFamilyLoadResult> {
  const preferredClusterId = normalizeText(params.preferredClusterId)

  const publications = await loadGmailArtifactPublicationStatesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  const publishedPairs = publications
    .map((publication) => ({
      scope: normalizeAnalysisScope(publication.analysis_scope),
      artifactVersion: normalizeNullableText(publication.published_version),
    }))
    .filter(
      (entry): entry is { scope: GmailArtifactAnalysisScope; artifactVersion: string } =>
        Boolean(entry.artifactVersion)
    )

  const publishedScopes = publishedPairs.map((entry) => entry.scope)
  const publishedVersions = uniqueStrings(publishedPairs.map((entry) => entry.artifactVersion))
  const publishedPairKeySet = new Set(
    publishedPairs.map((entry) => `${entry.scope}::${entry.artifactVersion}`)
  )

  const cacheKey = selectedClusterRailFamilyCacheKey({
    tenantId: params.tenantId,
    preferredClusterId,
    clusterTitle: params.clusterTitle,
    publications,
    snapshotFallbackByScope: params.snapshotFallbackByScope,
  })
  const cached = selectedClusterRailFamilyCache.get(cacheKey) || null
  if (cached && cached.expires_at_ms > Date.now()) {
    return {
      ...cached.data,
      cache_status: 'hit',
    }
  }

  const existingInflight = selectedClusterRailFamilyInflight.get(cacheKey)
  if (existingInflight) {
    const data = await existingInflight
    return {
      ...data,
      cache_status: 'hit',
    }
  }

  const loadPromise = (async (): Promise<Omit<SelectedClusterRailFamilyLoadResult, 'cache_status'>> => {
    const [clusterSummariesResult, seedHeadersResult] = await Promise.all([
      publishedScopes.length > 0 && publishedVersions.length > 0
        ? params.supabase
            .from('gmail_cluster_summaries')
            .select(SELECTED_CLUSTER_RAIL_SUMMARY_SELECT)
            .eq('tenant_id', params.tenantId)
            .in('analysis_scope', publishedScopes)
            .in('artifact_version', publishedVersions)
        : Promise.resolve({ data: [], error: null }),
      publishedScopes.length > 0 && publishedVersions.length > 0
        ? params.supabase
            .from('gmail_sender_workspace_seed_headers')
            .select(SELECTED_CLUSTER_RAIL_HEADER_SELECT)
            .eq('tenant_id', params.tenantId)
            .in('analysis_scope', publishedScopes)
            .in('artifact_version', publishedVersions)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (clusterSummariesResult.error) {
      throw new Error(
        `Failed to load gmail_cluster_summaries: ${clusterSummariesResult.error.message}`
      )
    }
    if (seedHeadersResult.error) {
      throw new Error(
        `Failed to load gmail_sender_workspace_seed_headers: ${seedHeadersResult.error.message}`
      )
    }

    const clusterSummaries = (
      (clusterSummariesResult.data || []) as SelectedClusterRailSummarySurfaceRow[]
    ).filter((row) =>
      publishedPairKeySet.has(
        `${normalizeAnalysisScope(row.analysis_scope)}::${normalizeText(row.artifact_version)}`
      )
    )
    const seedHeaders = (
      (seedHeadersResult.data || []) as SelectedClusterRailHeaderSurfaceRow[]
    ).filter((row) =>
      publishedPairKeySet.has(
        `${normalizeAnalysisScope(row.analysis_scope)}::${normalizeText(row.artifact_version)}`
      )
    )
    const resolvedIdentity = resolveCleanupClusterIdentity(
      preferredClusterId,
      seedHeaders.map((header) => cleanupClusterIdentitySourceFromHeader(header))
    )
    const resolvedPreferredClusterId =
      resolvedIdentity.canonicalClusterId || preferredClusterId

    const built = buildSelectedClusterRailFamily({
      requestedClusterId: preferredClusterId,
      lookupClusterId: resolvedPreferredClusterId,
      clusterTitle: params.clusterTitle,
      publications,
      clusterSummaries,
      seedHeaders,
      snapshotFallbackByScope: params.snapshotFallbackByScope,
    })

    return {
      family: built.family,
      scope_resolution: built.scope_resolution,
    }
  })()

  selectedClusterRailFamilyInflight.set(cacheKey, loadPromise)
  try {
    const data = await loadPromise
    selectedClusterRailFamilyCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_ARTIFACT_VERSIONED_READ_CACHE_TTL_MS,
      data,
    })
    return {
      ...data,
      cache_status: 'miss',
    }
  } finally {
    selectedClusterRailFamilyInflight.delete(cacheKey)
  }
}

export async function loadPublishedSelectedClusterRailFamily(params: {
  supabase: SupabaseClient
  tenantId: string
  preferredClusterId: string
  clusterTitle?: string | null
}): Promise<OperationsSelectedClusterRailFamily> {
  const result = await loadSelectedClusterRailFamily(params)
  return result.family
}

async function loadPreviewIndexRowsByMessageIds(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  selectedClusterId: string
  messageIds: string[]
}): Promise<GmailPreviewIndexRow[]> {
  const messageIds = uniqueStrings(params.messageIds)
  if (messageIds.length === 0) return []

  const rows: GmailPreviewIndexRow[] = []
  for (const batch of chunkArray(messageIds, GMAIL_ARTIFACT_READ_BATCH_SIZE)) {
    const { data, error } = await params.supabase
      .from('gmail_preview_index')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .eq('cluster_id', normalizeText(params.selectedClusterId))
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

async function loadPreviewIndexRowsBySenderKeys(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  selectedClusterId: string
  senderKeys: string[]
}): Promise<GmailPreviewIndexRow[]> {
  const senderKeys = uniqueStrings(params.senderKeys)
  if (senderKeys.length === 0) return []

  const rows: GmailPreviewIndexRow[] = []
  for (const batch of chunkArray(senderKeys, GMAIL_ARTIFACT_PREVIEW_SENDER_KEY_READ_BATCH_SIZE)) {
    const { data, error } = await params.supabase
      .from('gmail_preview_index')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('analysis_scope', params.analysisScope)
      .eq('artifact_version', params.artifactVersion)
      .eq('cluster_id', normalizeText(params.selectedClusterId))
      .lte('preview_rank', 5)
      .in('sender_key', batch)
      .order('sender_key', { ascending: true })
      .order('preview_rank', { ascending: true })

    if (error) {
      throw new Error(`Failed to load gmail_preview_index by sender_key: ${error.message}`)
    }
    rows.push(...((data || []) as GmailPreviewIndexRow[]))
  }

  return rows
}

export async function loadPublishedGmailMailboxIntelligenceArtifact(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  bucketKinds?: string[] | null
  includeSnapshot?: boolean
  includeClusterSummaries?: boolean
  includeBuckets?: boolean
}): Promise<GmailPublishedMailboxIntelligenceArtifactRead> {
  const publication = await loadPublicationState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
  })
  const artifactVersion = normalizeNullableText(publication?.published_version)
  if (!publication || !artifactVersion) {
    return {
      publication,
      artifact_version: null,
      snapshot: null,
      cluster_summaries: [],
      buckets: [],
    }
  }

  const includeSnapshot = params.includeSnapshot !== false
  const includeClusterSummaries = params.includeClusterSummaries !== false
  const includeBuckets = params.includeBuckets !== false
  const bucketKinds = uniqueStrings(normalizeStringArray(params.bucketKinds))

  const [snapshotQuery, clusterSummariesQuery, bucketsResult] = await Promise.all([
    includeSnapshot
      ? params.supabase
          .from('gmail_mailbox_intelligence_snapshots')
          .select('*')
          .eq('tenant_id', params.tenantId)
          .eq('analysis_scope', params.analysisScope)
          .eq('artifact_version', artifactVersion)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    includeClusterSummaries
      ? params.supabase
          .from('gmail_cluster_summaries')
          .select('*')
          .eq('tenant_id', params.tenantId)
          .eq('analysis_scope', params.analysisScope)
          .eq('artifact_version', artifactVersion)
          .order('message_count', { ascending: false })
          .order('title', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    includeBuckets
      ? (() => {
          let bucketsQuery = params.supabase
            .from('gmail_mailbox_intelligence_buckets')
            .select('*')
            .eq('tenant_id', params.tenantId)
            .eq('analysis_scope', params.analysisScope)
            .eq('artifact_version', artifactVersion)
          if (bucketKinds.length > 0) {
            bucketsQuery = bucketsQuery.in('bucket_kind', bucketKinds)
          }
          return bucketsQuery
            .order('bucket_kind', { ascending: true })
            .order('bucket_start_at', { ascending: true })
        })()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (includeSnapshot && snapshotQuery.error) {
    throw new Error(
      `Failed to load gmail_mailbox_intelligence_snapshots: ${snapshotQuery.error.message}`
    )
  }
  if (includeClusterSummaries && clusterSummariesQuery.error) {
    throw new Error(`Failed to load gmail_cluster_summaries: ${clusterSummariesQuery.error.message}`)
  }
  if (includeBuckets && bucketsResult.error) {
    throw new Error(
      `Failed to load gmail_mailbox_intelligence_buckets: ${bucketsResult.error.message}`
    )
  }

  return {
    publication,
    artifact_version: artifactVersion,
    snapshot: includeSnapshot
      ? ((snapshotQuery.data as GmailMailboxIntelligenceSnapshotRow | null) ?? null)
      : null,
    cluster_summaries: includeClusterSummaries
      ? ((clusterSummariesQuery.data || []) as GmailClusterSummaryArtifactRow[])
      : [],
    buckets: includeBuckets ? ((bucketsResult.data || []) as GmailMailboxIntelligenceBucketRow[]) : [],
  }
}
