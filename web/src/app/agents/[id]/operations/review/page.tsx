'use client'

import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  GmailSharedSenderCard,
  SenderDistributionAnalysisRail,
  SharedAnalysisRailTabStrip,
  SenderTimeContextAnalysisRail,
} from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  buildGmailCleanupWorkflowClusterPayload,
  fetchGmailDecisionManagementSummary,
  fetchGmailSenderDistribution,
  fetchGmailSenderWorkspace,
  normalizeGmailCleanupWorkflowTarget,
  readCachedGmailSenderDistribution,
  readCachedGmailSenderWorkspace,
  type GmailCleanupClusterRef,
  type GmailDestinationExecutionState,
  type GmailDestinationState,
  type GmailSenderDistributionData,
  type GmailSenderDestinationTrustSignals,
  type GmailSenderWorkspaceSemanticFocus,
  type GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  getRetiredCleanupGroupRedirect,
  resolveCleanupClusterIdentity,
} from '@/lib/runtime/gmailCleanupClusterIdentity'
import {
  DEFAULT_OPERATIONS_ANALYSIS_SCOPE,
  type OperationsSelectedClusterRailFamilyScopeEntry,
  analysisScopeControlLabel,
  fetchOperationsMessagePreview,
  fetchOperationsMessageSnippets,
  getNextBroaderAnalysisScope,
  normalizeOperationsAnalysisScope,
  serializeOperationsQuery,
  type OperationsMessagePreviewData,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'
import {
  buildCleanupGroupPublishedReviewUnits,
  buildSemanticFocusFromPublishedReviewUnit,
  buildCleanupGroupInternalStructure,
  findCleanupGroupPublishedReviewUnit,
  getCleanupGroupCanonicalClusterId,
  getCleanupGroupLaneLabel,
  getCleanupGroupPrimaryLabel,
  type CleanupGroupPublishedReviewUnit,
} from '@/lib/runtime/cleanupGroupPresentation'
import {
  DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
  GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
  MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
} from '@/lib/integrations/gmail/gmailWorkspaceContracts'
import {
  buildGmailSemanticPresentationPolicy,
  gmailSemanticFamilyDisplayLabel,
  gmailSemanticPatternClassDisplayLabel,
  type GmailSemanticPresentationPolicy,
} from '@/lib/runtime/gmailSemanticPresentationPolicy'

type ReviewMode = 'overview' | 'decision'
type DecisionOverlayIntent = 'guided' | 'inspect'
type OverviewSubsetSource =
  | 'category'
  | 'composition'
  | 'contributor'
  | 'distribution'
  | 'review_unit'
type DrilldownSort = 'impact' | 'recent' | 'unread'
type SharedAnalysisRailTab = 'time_context' | 'sender_distribution'
type WorkspaceSender = GmailSenderWorkspaceData['senders'][number]
type WorkspaceSnapshotSource = 'cache' | 'network' | 'runtime'
type WorkspaceSenderCategoryDistribution = NonNullable<WorkspaceSender['category_distribution']>
type WorkspaceSenderPatternMix = NonNullable<WorkspaceSender['pattern_mix']>
type SemanticFamilyRowPresentation =
  GmailSemanticPresentationPolicy['semanticRow']['primaryFamilyRows'][number]
type SemanticFamilyChildPresentation = SemanticFamilyRowPresentation['children'][number]
type SemanticSubtypeFocus = {
  id: string
  label: string
  family: WorkspaceSender['semantic_family']['family']
  familyLabel: string
  publishedSenderCount: number
  publishedParentSharePct: number
  publishedGroupSharePct: number
  subtypeKey: string | null
  kind: 'family' | 'subtype' | 'remainder'
  tone: GmailSemanticPresentationPolicy['semanticRow']['primaryFamilyRows'][number]['children'][number]['tone']
  surfacedSubtypeKeys: string[]
}
type SemanticFocusChangeReason = 'direct_select' | 'clear' | 'restore' | 'system'
type SharedWorkflowSubsetKind = 'base_cluster' | 'derived_workflow_scope' | 'focused_sender'
type SharedWorkflowSubsetPopulationMode =
  | 'cluster_full'
  | 'workflow_scope_filtered'
  | 'route_subset_filtered'
  | 'focused_sender_only'
type SharedWorkflowSubsetPrimarySource =
  | 'page_scope'
  | 'workflow_scope'
  | 'route_subset'
  | 'focused_sender'
type SharedWorkflowSubsetContract = {
  kind: SharedWorkflowSubsetKind
  parentClusterId: string | null
  analysisScope: OperationsAnalysisScope
  activeWorkflowScope: OperationsAnalysisScope | null
  authoritativeScope: OperationsAnalysisScope
  populationMode: SharedWorkflowSubsetPopulationMode
  orderedSenderKeys: string[]
  focusedSenderKey: string | null
  label: string
  source: {
    primary: SharedWorkflowSubsetPrimarySource
    workflowScope: OperationsAnalysisScope | null
    routeSubset: { source: OverviewSubsetSource; value: string } | null
    semanticFocus: Pick<SemanticSubtypeFocus, 'id' | 'family' | 'subtypeKey' | 'kind' | 'label'> | null
  }
}
type DecisionInspectEntryContext = {
  senderKey: string
  sender: WorkspaceSender
}
type DecisionOverviewReturnContext = {
  subsetSource: OverviewSubsetSource | null
  subsetValue: string | null
  semanticFocus: SemanticSubtypeFocus | null
  senderPage: number | null
  scrollTop: number | null
}
type EvidenceAvailabilityState =
  | 'full_preview_available'
  | 'subject_only_evidence_available'
  | 'no_previewable_evidence'

const DEFAULT_OVERVIEW_WORKSPACE_PAGE = 1
const DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE = DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE
const DECISION_QUEUE_WORKSPACE_PAGE_SIZE = GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE
const OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT = 2
const DEFAULT_OVERVIEW_WORKSPACE_FILTER = 'all'
const DEFAULT_OVERVIEW_WORKSPACE_SORT = 'message_count'
const DEFAULT_OVERVIEW_WORKSPACE_DIRECTION = 'desc'
const DECISION_WORKFLOW_STORAGE_TTL_MS = 15 * 60 * 1000
const DECISION_WORKFLOW_STORAGE_VERSION = 1
const REVIEW_SCOPE_TRANSITION_SNAPSHOT_TTL_MS = 90 * 1000
type WorkspaceSnapshot = {
  data: GmailSenderWorkspaceData
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  source: WorkspaceSnapshotSource
  cacheVersion: string | null
  previewEvidenceSenderKey: string | null
}

type WorkspaceState =
  | { status: 'idle' | 'loading'; snapshot: WorkspaceSnapshot | null; error: null }
  | { status: 'ready'; snapshot: WorkspaceSnapshot; error: null }
  | { status: 'error'; snapshot: WorkspaceSnapshot | null; error: string }

type WorkspaceStateTransition =
  | WorkspaceState
  | ((current: WorkspaceState) => WorkspaceState)

type DefaultOverviewRuntimeGateState = {
  clusterId: string | null
  status: 'idle' | 'waiting' | 'ready_for_fallback'
}

const IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE: DefaultOverviewRuntimeGateState = {
  clusterId: null,
  status: 'idle',
}

const MARKETING_PARENT_CANONICAL_ID = 'semantic.marketing_subscriptions'

const reviewScopeTransitionSnapshots = new Map<
  string,
  { snapshot: WorkspaceSnapshot; capturedAt: number }
>()
const senderOverviewRailMemoryStore = new Map<string, SenderOverviewRailFastPackage>()

function cleanupGroupDisplayTitle(params: {
  clusterId?: string | null
  canonicalClusterId?: string | null
  title?: string | null
}): string | null {
  const clusterId = params.canonicalClusterId || params.clusterId
  if (!clusterId) {
    return typeof params.title === 'string' && params.title.trim() ? params.title.trim() : null
  }
  return getCleanupGroupPrimaryLabel(clusterId, params.title)
}

type WorkspaceFetchPlan = {
  requestKey: string
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  normalizedAnalysisScope: OperationsAnalysisScope
  cacheVersion: string | null
  mode: ReviewMode
  page: number
  pageSize: number
  requestPhase: 'interactive' | 'deferred'
  seedSnapshot: WorkspaceSnapshot | null
  previewEvidenceSenderKey: string | null
}

type SenderTimeContextRailMetricModel = {
  value: string
  detail: string
}

type SenderOverviewRailFastSourceLabel =
  | 'hydrated_page'
  | 'bootstrap_runtime_seed'
  | 'memory_store'
  | 'unavailable_scope'

type SenderOverviewRailFastState = 'ready' | 'outside_timeframe' | 'unavailable_scope'
type SenderOverviewRailScopeStatus = {
  label: string
  detail: string
  tone: 'aligned' | 'comparing' | 'outside' | 'not_loaded'
}

type SenderOverviewHydratedRailSource = Exclude<
  SenderOverviewRailFastSourceLabel,
  'memory_store' | 'unavailable_scope'
>

type SenderOverviewRailFastPackage = {
  key: string
  sourceLabel: SenderOverviewRailFastSourceLabel
  state: SenderOverviewRailFastState
  clusterId: string
  scope: OperationsAnalysisScope
  version: string | null
  clusterTitle: string | null
  visibleClusterCount: number | null
  chart: {
    granularity: 'day' | 'week' | 'month'
    items: Array<{ label: string; count: number }>
  } | null
  metrics: {
    overallActivity: SenderTimeContextRailMetricModel
    activityMix: SenderTimeContextRailMetricModel
    patternSignal: SenderTimeContextRailMetricModel
    nextAction: {
      title: string
      detail: string
    }
  } | null
}

type SenderWorkflowPaginationModel = {
  currentPage: number
  totalPages: number
  statusText: string
  hasMultiplePages: boolean
  canPrevious: boolean
  canNext: boolean
  transitionPending: boolean
}

type SemanticFocusWorkspaceState =
  | { status: 'idle' | 'loading'; data: GmailSenderWorkspaceData | null; error: null }
  | { status: 'ready'; data: GmailSenderWorkspaceData; error: null }
  | { status: 'error'; data: GmailSenderWorkspaceData | null; error: string }

type MarketingReviewUnitTruthState =
  | {
      status: 'idle' | 'loading'
      data: { senders: WorkspaceSender[]; senderTotalMatchesUnit: boolean } | null
      error: null
    }
  | {
      status: 'ready'
      data: { senders: WorkspaceSender[]; senderTotalMatchesUnit: boolean }
      error: null
    }
  | {
      status: 'error'
      data: { senders: WorkspaceSender[]; senderTotalMatchesUnit: boolean } | null
      error: string
    }

type MarketingReviewUnitEntryState =
  | 'choose_unit'
  | 'missing_unit'
  | 'invalid_unit'
  | 'oversized_unit'
  | 'unavailable_units'

type SenderDistributionWorkspaceState =
  | { status: 'idle' | 'loading'; data: GmailSenderDistributionData | null; error: null }
  | { status: 'ready'; data: GmailSenderDistributionData; error: null }
  | { status: 'error'; data: GmailSenderDistributionData | null; error: string }

type ManagedSenderState = {
  destinationState: GmailDestinationState
  executionState: GmailDestinationExecutionState
  executionSource: string | null
  lastActionTimestamp: string
}

type SenderSnippetOverrides = Record<string, Record<string, string | null>>

type SenderSnippetHydrationState = {
  loading: boolean
  error: string | null
}

type EvidenceMessageSelection = {
  senderKey: string
  sender: string
  message: WorkspaceSender['preview_messages'][number]
}

type EvidenceMessagePreviewState = {
  selection: EvidenceMessageSelection | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  data: OperationsMessagePreviewData | null
  error: string | null
}

const DEFAULT_CANONICAL_SENDER_PROFILE = {
  category_distribution: [] as WorkspaceSenderCategoryDistribution,
  pattern_mix: [] as WorkspaceSenderPatternMix,
  categorized_message_count: 0,
  uncategorized_message_count: 0,
  multi_category_message_count: 0,
  dominant_category: null as WorkspaceSender['dominant_category'],
  dominant_category_confidence: null as WorkspaceSender['dominant_category_confidence'],
  category_profile_mode: 'insufficient_data' as WorkspaceSender['category_profile_mode'],
  category_summary: 'Insufficient data',
  category_summary_source: 'insufficient_data' as WorkspaceSender['category_summary_source'],
} as const

const DEFAULT_OPERATOR_PROFILE = {
  operator_profile_family: 'insufficient_data' as WorkspaceSender['operator_profile_family'],
  operator_profile_mode: 'insufficient_data' as WorkspaceSender['operator_profile_mode'],
  operator_profile_confidence: null as WorkspaceSender['operator_profile_confidence'],
  operator_profile_summary: 'Insufficient data',
  operator_profile_reasons: [] as string[],
  operator_profile_source: 'insufficient_data' as WorkspaceSender['operator_profile_source'],
} as const

function normalizeWorkspaceSenderContract(sender: WorkspaceSender): WorkspaceSender {
  const categoryDistribution = Array.isArray(sender.category_distribution)
    ? sender.category_distribution.filter(
        (entry): entry is WorkspaceSenderCategoryDistribution[number] =>
          Boolean(
            entry &&
              typeof entry === 'object' &&
              typeof entry.label === 'string' &&
              entry.label.trim() &&
              typeof entry.count === 'number' &&
              Number.isFinite(entry.count)
          )
      )
    : DEFAULT_CANONICAL_SENDER_PROFILE.category_distribution
  const patternMix = Array.isArray(sender.pattern_mix)
    ? sender.pattern_mix.filter(
        (entry): entry is WorkspaceSenderPatternMix[number] =>
          Boolean(
            entry &&
              typeof entry === 'object' &&
              typeof entry.pattern === 'string' &&
              entry.pattern.trim() &&
              typeof entry.count === 'number' &&
              Number.isFinite(entry.count)
          )
      )
    : DEFAULT_CANONICAL_SENDER_PROFILE.pattern_mix
  const categorizedMessageCount =
    typeof sender.categorized_message_count === 'number' &&
    Number.isFinite(sender.categorized_message_count)
      ? Math.max(0, Math.round(sender.categorized_message_count))
      : DEFAULT_CANONICAL_SENDER_PROFILE.categorized_message_count
  const uncategorizedMessageCount =
    typeof sender.uncategorized_message_count === 'number' &&
    Number.isFinite(sender.uncategorized_message_count)
      ? Math.max(0, Math.round(sender.uncategorized_message_count))
      : DEFAULT_CANONICAL_SENDER_PROFILE.uncategorized_message_count
  const multiCategoryMessageCount =
    typeof sender.multi_category_message_count === 'number' &&
    Number.isFinite(sender.multi_category_message_count)
      ? Math.max(0, Math.round(sender.multi_category_message_count))
      : DEFAULT_CANONICAL_SENDER_PROFILE.multi_category_message_count
  const categoryProfileMode =
    sender.category_profile_mode === 'dominant' ||
    sender.category_profile_mode === 'mixed' ||
    sender.category_profile_mode === 'uncategorized' ||
    sender.category_profile_mode === 'insufficient_data'
      ? sender.category_profile_mode
      : DEFAULT_CANONICAL_SENDER_PROFILE.category_profile_mode
  const dominantCategory =
    sender.dominant_category === 'Promotions' ||
    sender.dominant_category === 'Social' ||
    sender.dominant_category === 'Updates' ||
    sender.dominant_category === 'Forums' ||
    sender.dominant_category === 'Primary' ||
    sender.dominant_category === 'Uncategorized'
      ? sender.dominant_category
      : DEFAULT_CANONICAL_SENDER_PROFILE.dominant_category
  const dominantCategoryConfidence =
    sender.dominant_category_confidence === 'high' ||
    sender.dominant_category_confidence === 'medium' ||
    sender.dominant_category_confidence === 'low'
      ? sender.dominant_category_confidence
      : DEFAULT_CANONICAL_SENDER_PROFILE.dominant_category_confidence
  const categorySummary =
    typeof sender.category_summary === 'string' && sender.category_summary.trim()
      ? sender.category_summary
      : DEFAULT_CANONICAL_SENDER_PROFILE.category_summary
  const categorySummarySource =
    sender.category_summary_source === 'sender_global_category_distribution' ||
    sender.category_summary_source === 'uncategorized' ||
    sender.category_summary_source === 'insufficient_data'
      ? sender.category_summary_source
      : DEFAULT_CANONICAL_SENDER_PROFILE.category_summary_source
  const operatorProfileFamily =
    sender.operator_profile_family === 'marketing_promotional' ||
    sender.operator_profile_family === 'commerce_transactional' ||
    sender.operator_profile_family === 'account_notification' ||
    sender.operator_profile_family === 'security_alert' ||
    sender.operator_profile_family === 'social_community' ||
    sender.operator_profile_family === 'human_personal' ||
    sender.operator_profile_family === 'mixed_behavior' ||
    sender.operator_profile_family === 'insufficient_data'
      ? sender.operator_profile_family
      : DEFAULT_OPERATOR_PROFILE.operator_profile_family
  const operatorProfileMode =
    sender.operator_profile_mode === 'clear' ||
    sender.operator_profile_mode === 'mixed' ||
    sender.operator_profile_mode === 'insufficient_data'
      ? sender.operator_profile_mode
      : DEFAULT_OPERATOR_PROFILE.operator_profile_mode
  const operatorProfileConfidence =
    sender.operator_profile_confidence === 'high' ||
    sender.operator_profile_confidence === 'medium' ||
    sender.operator_profile_confidence === 'low'
      ? sender.operator_profile_confidence
      : DEFAULT_OPERATOR_PROFILE.operator_profile_confidence
  const operatorProfileSummary =
    typeof sender.operator_profile_summary === 'string' && sender.operator_profile_summary.trim()
      ? sender.operator_profile_summary
      : DEFAULT_OPERATOR_PROFILE.operator_profile_summary
  const operatorProfileReasons = Array.isArray(sender.operator_profile_reasons)
    ? sender.operator_profile_reasons.filter(
        (reason): reason is string => typeof reason === 'string' && reason.trim().length > 0
      )
    : DEFAULT_OPERATOR_PROFILE.operator_profile_reasons
  const operatorProfileSource =
    sender.operator_profile_source === 'sender_global_operator_profile_v1' ||
    sender.operator_profile_source === 'insufficient_data'
      ? sender.operator_profile_source
      : DEFAULT_OPERATOR_PROFILE.operator_profile_source

  return {
    ...sender,
    preview_messages: Array.isArray(sender.preview_messages) ? sender.preview_messages : [],
    verification_reasons: Array.isArray(sender.verification_reasons)
      ? sender.verification_reasons
      : [],
    category_distribution: categoryDistribution,
    pattern_mix: patternMix,
    categorized_message_count: categorizedMessageCount,
    uncategorized_message_count: uncategorizedMessageCount,
    multi_category_message_count: multiCategoryMessageCount,
    dominant_category: dominantCategory,
    dominant_category_confidence: dominantCategoryConfidence,
    category_profile_mode: categoryProfileMode,
    category_summary: categorySummary,
    category_summary_source: categorySummarySource,
    operator_profile_family: operatorProfileFamily,
    operator_profile_mode: operatorProfileMode,
    operator_profile_confidence: operatorProfileConfidence,
    operator_profile_summary: operatorProfileSummary,
    operator_profile_reasons: operatorProfileReasons,
    operator_profile_source: operatorProfileSource,
    dominant_pattern:
      typeof sender.dominant_pattern === 'string' && sender.dominant_pattern.trim()
        ? sender.dominant_pattern
        : 'Thin history',
  }
}

function normalizeWorkspaceDataContract(
  data: GmailSenderWorkspaceData | null
): GmailSenderWorkspaceData | null {
  if (!data) return null
  return {
    ...data,
    cluster_global: {
      sender_keys:
        Array.isArray(data.cluster_global?.sender_keys)
          ? data.cluster_global.sender_keys.filter(
              (senderKey): senderKey is string =>
                typeof senderKey === 'string' && senderKey.trim().length > 0
            )
          : [],
      sender_keys_complete: data.cluster_global?.sender_keys_complete === true,
    },
    analytics: {
      ...data.analytics,
      sender_category_distribution: Array.isArray(data.analytics?.sender_category_distribution)
        ? data.analytics.sender_category_distribution
        : [],
      semantic_family_distribution: Array.isArray(data.analytics?.semantic_family_distribution)
        ? data.analytics.semantic_family_distribution
        : [],
      semantic_pattern_distribution: Array.isArray(data.analytics?.semantic_pattern_distribution)
        ? data.analytics.semantic_pattern_distribution
        : [],
      semantic_resolution_distribution: Array.isArray(data.analytics?.semantic_resolution_distribution)
        ? data.analytics.semantic_resolution_distribution
        : [],
      semantic_confidence_distribution: Array.isArray(data.analytics?.semantic_confidence_distribution)
        ? data.analytics.semantic_confidence_distribution
        : [],
      semantic_provenance_distribution: Array.isArray(data.analytics?.semantic_provenance_distribution)
        ? data.analytics.semantic_provenance_distribution
        : [],
      semantic_umbrella_distribution: Array.isArray(data.analytics?.semantic_umbrella_distribution)
        ? data.analytics.semantic_umbrella_distribution
        : [],
      operator_profile_family_distribution: Array.isArray(
        data.analytics?.operator_profile_family_distribution
      )
        ? data.analytics.operator_profile_family_distribution
        : [],
      dominant_pattern_distribution: Array.isArray(data.analytics?.dominant_pattern_distribution)
        ? data.analytics.dominant_pattern_distribution
        : [],
      operator_profile_mode_distribution: Array.isArray(
        data.analytics?.operator_profile_mode_distribution
      )
        ? data.analytics.operator_profile_mode_distribution
        : [],
      category_summary_source_distribution: Array.isArray(
        data.analytics?.category_summary_source_distribution
      )
        ? data.analytics.category_summary_source_distribution
        : [],
      sender_activity_timeline: Array.isArray(data.analytics?.sender_activity_timeline)
        ? data.analytics.sender_activity_timeline
        : [],
      cluster_contribution: Array.isArray(data.analytics?.cluster_contribution)
        ? data.analytics.cluster_contribution
        : [],
    },
    senders: Array.isArray(data.senders)
      ? data.senders.map((sender) => normalizeWorkspaceSenderContract(sender))
      : [],
  }
}

function normalizeReviewMode(value: string | null): ReviewMode {
  return value === 'decision' ? 'decision' : 'overview'
}

function normalizeDecisionOverlayIntent(value: string | null): DecisionOverlayIntent | null {
  if (value === 'guided' || value === 'inspect') return value
  return null
}

function normalizeOverviewSubsetSource(value: string | null): OverviewSubsetSource | null {
  if (
    value === 'category' ||
    value === 'composition' ||
    value === 'contributor' ||
    value === 'distribution' ||
    value === 'review_unit'
  ) {
    return value
  }
  return null
}

function isFocusedSenderSubsetSource(
  source: OverviewSubsetSource | null | undefined
): source is 'distribution' | 'contributor' {
  return source === 'distribution' || source === 'contributor'
}

function normalizeOverviewPage(value: string | null): number {
  if (!value) return DEFAULT_OVERVIEW_WORKSPACE_PAGE
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < DEFAULT_OVERVIEW_WORKSPACE_PAGE) {
    return DEFAULT_OVERVIEW_WORKSPACE_PAGE
  }
  return parsed
}

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isTransientInboxAnalysisGuardError(value: string | null | undefined): boolean {
  return (
    typeof value === 'string' &&
    (/already running/i.test(value) || /just requested/i.test(value) || /wait briefly/i.test(value))
  )
}

function isDefaultOverviewRequestContext(params: {
  mode: ReviewMode
  subsetSource: OverviewSubsetSource | null
  subsetValue: string | null
  senderPage: number
}): boolean {
  return (
    params.mode === 'overview' &&
    params.senderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE &&
    params.subsetSource == null &&
    params.subsetValue == null
  )
}

function appendAnalysisScopeParam(
  search: URLSearchParams,
  analysisScope: string | null | undefined
): void {
  search.delete('analysis_scope')
  const normalizedAnalysisScope = normalizeOperationsAnalysisScope(analysisScope)
  if (normalizedAnalysisScope !== DEFAULT_OPERATIONS_ANALYSIS_SCOPE) {
    search.set('analysis_scope', normalizedAnalysisScope)
  }
}

function appendWorkflowScopeParam(
  search: URLSearchParams,
  workflowScope: string | null | undefined,
  pageScope: string | null | undefined
): void {
  search.delete('workflow_scope')
  if (workflowScope == null) return
  const normalizedWorkflowScope = normalizeOperationsAnalysisScope(workflowScope)
  const normalizedPageScope = normalizeOperationsAnalysisScope(pageScope)
  if (normalizedWorkflowScope !== normalizedPageScope) {
    search.set('workflow_scope', normalizedWorkflowScope)
  }
}

function humanizeCleanupGroupId(value: string | null | undefined): string {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) return 'Selected cleanup group'
  return normalized
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function uniqueNonEmptyStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0)
    )
  )
}

function buildRequestedClusterRef(params: {
  requestedClusterId: string
  cluster: GmailCleanupClusterRef
}): GmailCleanupClusterRef {
  const canonicalClusterId = params.cluster.canonicalClusterId || params.cluster.clusterId
  const compatibilityClusterId =
    params.requestedClusterId !== canonicalClusterId ? params.requestedClusterId : null
  return {
    ...params.cluster,
    clusterId: canonicalClusterId,
    canonicalClusterId,
    legacyClusterIds: uniqueNonEmptyStrings([
      ...(params.cluster.legacyClusterIds || []),
      compatibilityClusterId &&
      (params.cluster.legacyClusterIds || []).includes(compatibilityClusterId)
        ? compatibilityClusterId
        : null,
    ]),
    sourceClusterIds: uniqueNonEmptyStrings([
      ...(params.cluster.sourceClusterIds || []),
      compatibilityClusterId &&
      !(params.cluster.legacyClusterIds || []).includes(compatibilityClusterId)
        ? compatibilityClusterId
        : null,
    ]),
  }
}

function buildReviewScopeTransitionSnapshotKey(params: {
  agentId: string | null
  sessionId: string | null
  clusterId: string | null
}): string | null {
  if (!params.agentId || !params.clusterId) return null
  return [params.agentId, params.sessionId || 'no-session', params.clusterId].join('::')
}

function buildReviewHref(params: {
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  workflowScope?: string | null
  clusterId?: string | null
  mode?: ReviewMode | null
  subsetSource?: OverviewSubsetSource | null
  subsetValue?: string | null
  senderPage?: number | null
  senderKey?: string | null
  overlayIntent?: DecisionOverlayIntent | null
}): string {
  const search = new URLSearchParams()
  if (params.sessionId) search.set('playground_session_id', params.sessionId)
  appendAnalysisScopeParam(search, params.analysisScope)
  appendWorkflowScopeParam(search, params.workflowScope, params.analysisScope)
  if (params.clusterId) search.set('cluster_id', params.clusterId)
  if (params.mode && params.mode !== 'overview') search.set('mode', params.mode)
  if (params.subsetSource && params.subsetValue) {
    search.set('subset_source', params.subsetSource)
    search.set('subset_value', params.subsetValue)
  }
  if (
    typeof params.senderPage === 'number' &&
    Number.isFinite(params.senderPage) &&
    params.senderPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE
  ) {
    search.set('sender_page', String(Math.max(DEFAULT_OVERVIEW_WORKSPACE_PAGE, Math.round(params.senderPage))))
  }
  if (params.mode === 'decision') {
    if (params.senderKey) search.set('sender_key', params.senderKey)
    if (params.overlayIntent) search.set('overlay_intent', params.overlayIntent)
  }
  const query = search.toString()
  return `/agents/${params.agentId}/operations/review${query ? `?${query}` : ''}`
}

function buildClustersHref(params: {
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  retiredClusterId?: string | null
}): string {
  const search = new URLSearchParams()
  if (params.sessionId) search.set('playground_session_id', params.sessionId)
  appendAnalysisScopeParam(search, params.analysisScope)
  if (params.retiredClusterId) search.set('retired_cluster', params.retiredClusterId)
  const query = search.toString()
  return `/agents/${params.agentId}/operations/clusters${query ? `?${query}` : ''}`
}

function buildRenderablePublishedReviewUnits<T extends { senderCount: number; targetState: string }>(
  reviewUnits: T[]
): T[] {
  return reviewUnits.filter((unit) => unit.senderCount > 0 && unit.targetState !== 'oversized')
}

function hasRequestedReviewUnitValue(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function senderMatchesLocalSemanticFocus(
  sender: WorkspaceSender,
  semanticFocus: GmailSenderWorkspaceSemanticFocus
): boolean {
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

function senderMatchesPublishedReviewUnit(params: {
  sender: WorkspaceSender
  unit: CleanupGroupPublishedReviewUnit
  dominantSemanticFamily: WorkspaceSender['semantic_family']['family'] | null
}): boolean {
  const semanticFocus = buildSemanticFocusFromPublishedReviewUnit(params.unit)
  if (semanticFocus) {
    return senderMatchesLocalSemanticFocus(params.sender, semanticFocus)
  }

  if (params.unit.sourceKind === 'spillover') {
    if (!params.dominantSemanticFamily) return false
    return params.sender.semantic_family.family !== params.dominantSemanticFamily
  }

  return false
}

function compareWorkspaceSendersByOrdering(
  left: WorkspaceSender,
  right: WorkspaceSender,
  ordering: {
    sort: 'message_count' | 'last_activity' | 'unread_count'
    direction: 'desc'
  }
): number {
  if (ordering.sort === 'last_activity') {
    return (
      dateSortValue(right.last_activity) - dateSortValue(left.last_activity) ||
      right.cleanup_group_message_count - left.cleanup_group_message_count ||
      right.unread_count - left.unread_count ||
      left.sender.localeCompare(right.sender)
    )
  }

  if (ordering.sort === 'unread_count') {
    return (
      right.unread_count - left.unread_count ||
      right.cleanup_group_message_count - left.cleanup_group_message_count ||
      dateSortValue(right.last_activity) - dateSortValue(left.last_activity) ||
      left.sender.localeCompare(right.sender)
    )
  }

  return (
    right.cleanup_group_message_count - left.cleanup_group_message_count ||
    right.unread_count - left.unread_count ||
    dateSortValue(right.last_activity) - dateSortValue(left.last_activity) ||
    left.sender.localeCompare(right.sender)
  )
}

function buildPublishedReviewUnitWorkspace(params: {
  parentWorkspace: GmailSenderWorkspaceData
  unit: CleanupGroupPublishedReviewUnit
  dominantSemanticFamily: WorkspaceSender['semantic_family']['family'] | null
  requestedPage: number
  requestedPageSize: number
}): GmailSenderWorkspaceData {
  const filteredSenders = params.parentWorkspace.senders.filter((sender) =>
    senderMatchesPublishedReviewUnit({
      sender,
      unit: params.unit,
      dominantSemanticFamily: params.dominantSemanticFamily,
    })
  )
  const pageSize = Math.max(
    1,
    filteredSenders.length,
    Math.min(Math.max(params.requestedPageSize, 1), MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE)
  )
  const totalPages = Math.max(1, Math.ceil(filteredSenders.length / pageSize))
  const page = Math.min(Math.max(DEFAULT_OVERVIEW_WORKSPACE_PAGE, params.requestedPage), totalPages)
  const pageStart = (page - 1) * pageSize
  const pagedSenders = filteredSenders.slice(pageStart, pageStart + pageSize)

  return {
    ...params.parentWorkspace,
    senders: pagedSenders,
    pagination: {
      ...params.parentWorkspace.pagination,
      page,
      page_size: pageSize,
      total_senders: filteredSenders.length,
      total_pages: totalPages,
    },
    exceptions_count: filteredSenders.filter((sender) => sender.requires_verification).length,
  }
}

function buildPublishedReviewUnitWorkspaceFromSenders(params: {
  parentWorkspace: GmailSenderWorkspaceData
  senders: WorkspaceSender[]
  requestedPage: number
  requestedPageSize: number
}): GmailSenderWorkspaceData {
  const dedupedSenders = Array.from(
    params.senders.reduce<Map<string, WorkspaceSender>>((accumulator, sender) => {
      if (!accumulator.has(sender.sender_key)) {
        accumulator.set(sender.sender_key, sender)
      }
      return accumulator
    }, new Map())
  ).map(([, sender]) => sender)
  const pageSize = Math.max(
    1,
    dedupedSenders.length,
    Math.min(Math.max(params.requestedPageSize, 1), MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE)
  )
  const totalPages = Math.max(1, Math.ceil(dedupedSenders.length / pageSize))
  const page = Math.min(Math.max(DEFAULT_OVERVIEW_WORKSPACE_PAGE, params.requestedPage), totalPages)
  const pageStart = (page - 1) * pageSize
  const pagedSenders = dedupedSenders.slice(pageStart, pageStart + pageSize)

  return {
    ...params.parentWorkspace,
    senders: pagedSenders,
    pagination: {
      ...params.parentWorkspace.pagination,
      page,
      page_size: pageSize,
      total_senders: dedupedSenders.length,
      total_pages: totalPages,
    },
    exceptions_count: dedupedSenders.filter((sender) => sender.requires_verification).length,
  }
}

type CollectWorkspaceSendersForSemanticFocusResult =
  | { ok: true; senders: WorkspaceSender[] }
  | { ok: false; error: string }
  | { aborted: true }

async function collectWorkspaceSendersForSemanticFocus(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string | null
  semanticFocus: GmailSenderWorkspaceSemanticFocus
  ordering: {
    sort: 'message_count' | 'last_activity' | 'unread_count'
    direction: 'desc'
  }
  agentId: string
  requestReason: string
}): Promise<CollectWorkspaceSendersForSemanticFocusResult> {
  const sendersByKey = new Map<string, WorkspaceSender>()
  let page = DEFAULT_OVERVIEW_WORKSPACE_PAGE
  let totalPages = DEFAULT_OVERVIEW_WORKSPACE_PAGE

  while (page <= totalPages) {
    const result = await fetchGmailSenderWorkspace({
      selectedCluster: params.selectedCluster,
      allClusters: params.allClusters,
      analysisScope: params.analysisScope,
      cacheVersion: params.cacheVersion,
      includeClusterSenderKeys: false,
      page,
      pageSize: MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
      sort: params.ordering.sort,
      direction: params.ordering.direction,
      semanticFocus: params.semanticFocus,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_overview',
        reason: params.requestReason,
        phase: 'interactive',
        agentId: params.agentId,
      },
    })

    if ('aborted' in result && result.aborted) {
      return { aborted: true }
    }
    if (!result.ok) {
      return { ok: false, error: result.error }
    }

    totalPages = Math.max(
      DEFAULT_OVERVIEW_WORKSPACE_PAGE,
      result.data.pagination.total_pages || DEFAULT_OVERVIEW_WORKSPACE_PAGE
    )

    for (const sender of result.data.senders) {
      if (!sendersByKey.has(sender.sender_key)) {
        sendersByKey.set(sender.sender_key, sender)
      }
    }

    page += 1
  }

  return {
    ok: true,
    senders: Array.from(sendersByKey.values()).sort((left, right) =>
      compareWorkspaceSendersByOrdering(left, right, params.ordering)
    ),
  }
}

function buildDecisionWorkflowStorageKey(params: {
  kind: 'inspect-entry' | 'overview-return'
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  clusterId: string | null | undefined
}): string | null {
  const clusterId = typeof params.clusterId === 'string' ? params.clusterId.trim() : ''
  const agentId = typeof params.agentId === 'string' ? params.agentId.trim() : ''
  if (!clusterId || !agentId) return null
  const analysisScope =
    typeof params.analysisScope === 'string' && params.analysisScope.trim().length > 0
      ? params.analysisScope.trim()
      : DEFAULT_OPERATIONS_ANALYSIS_SCOPE
  const sessionId =
    typeof params.sessionId === 'string' && params.sessionId.trim().length > 0
      ? params.sessionId.trim()
      : 'no-session'
  return [
    'gmail-review-decision-workflow',
    String(DECISION_WORKFLOW_STORAGE_VERSION),
    params.kind,
    agentId,
    sessionId,
    analysisScope,
    clusterId,
  ].join('::')
}

function writeDecisionWorkflowStorage<T>(key: string | null, payload: T | null): void {
  if (typeof window === 'undefined' || !key) return
  try {
    if (payload == null) {
      window.sessionStorage.removeItem(key)
      return
    }
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        version: DECISION_WORKFLOW_STORAGE_VERSION,
        saved_at: Date.now(),
        payload,
      })
    )
  } catch {
    // Ignore session-only persistence failures and continue with in-memory state.
  }
}

function readDecisionWorkflowStorage<T>(key: string | null): T | null {
  if (typeof window === 'undefined' || !key) return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      version?: number
      saved_at?: number
      payload?: T
    }
    if (parsed?.version !== DECISION_WORKFLOW_STORAGE_VERSION) {
      window.sessionStorage.removeItem(key)
      return null
    }
    if (
      typeof parsed.saved_at !== 'number' ||
      !Number.isFinite(parsed.saved_at) ||
      Date.now() - parsed.saved_at > DECISION_WORKFLOW_STORAGE_TTL_MS
    ) {
      window.sessionStorage.removeItem(key)
      return null
    }
    return parsed.payload ?? null
  } catch {
    return null
  }
}

function semanticSubtypeFocusesEqual(
  left: SemanticSubtypeFocus | null | undefined,
  right: SemanticSubtypeFocus | null | undefined
): boolean {
  if (left === right) return true
  if (!left || !right) return left == null && right == null
  return (
    left.id === right.id &&
    left.family === right.family &&
    left.subtypeKey === right.subtypeKey &&
    left.kind === right.kind &&
    left.publishedSenderCount === right.publishedSenderCount
  )
}

function resolveAuthoritativeOverviewReturnContext(params: {
  semanticFocus: SemanticSubtypeFocus | null | undefined
  activeSubset:
    | {
        source: OverviewSubsetSource
        value: string
      }
    | null
    | undefined
  subsetSource: OverviewSubsetSource | null
  subsetValue: string | null
}): Pick<DecisionOverviewReturnContext, 'subsetSource' | 'subsetValue'> {
  if (params.activeSubset?.source === 'review_unit') {
    return {
      subsetSource: params.activeSubset.source,
      subsetValue: params.activeSubset.value,
    }
  }
  if (params.semanticFocus) {
    return {
      subsetSource: null,
      subsetValue: null,
    }
  }
  return {
    subsetSource: params.activeSubset?.source || params.subsetSource,
    subsetValue: params.activeSubset?.value || params.subsetValue,
  }
}

function senderEvidenceAvailabilityState(
  messages: WorkspaceSender['preview_messages']
): EvidenceAvailabilityState {
  if (messages.length === 0) return 'no_previewable_evidence'
  const hasAnySnippet = messages.some(
    (message) => typeof message.snippet === 'string' && message.snippet.trim().length > 0
  )
  return hasAnySnippet ? 'full_preview_available' : 'subject_only_evidence_available'
}

function nextDecisionSenderKey(params: {
  orderedSenderKeys: string[]
  managedBySender: Record<string, ManagedSenderState>
  currentSenderKey: string | null
}): string | null {
  if (params.orderedSenderKeys.length === 0) return null
  const currentIndex = params.currentSenderKey
    ? params.orderedSenderKeys.indexOf(params.currentSenderKey)
    : -1
  for (let index = currentIndex + 1; index < params.orderedSenderKeys.length; index += 1) {
    const senderKey = params.orderedSenderKeys[index]
    if (!params.managedBySender[senderKey]) return senderKey
  }
  return null
}

function buildManagementHref(params: {
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  bucket?: string | null
}): string {
  const search = new URLSearchParams()
  if (params.sessionId) search.set('playground_session_id', params.sessionId)
  appendAnalysisScopeParam(search, params.analysisScope)
  if (params.bucket) search.set('bucket', params.bucket)
  const query = search.toString()
  return `/agents/${params.agentId}/operations/management${query ? `?${query}` : ''}`
}

function initialExecutionForDestination(
  destinationState: GmailDestinationState
): Pick<ManagedSenderState, 'executionState' | 'executionSource'> {
  if (destinationState === 'KEEP') {
    return { executionState: 'not_applicable', executionSource: 'protected_no_action' }
  }
  if (destinationState === 'ARCHIVE') {
    return { executionState: 'deferred', executionSource: 'ready_to_push' }
  }
  if (destinationState === 'CUSTOM_RULE') {
    return { executionState: 'deferred', executionSource: 'pending_refinement' }
  }
  if (destinationState === 'QUARANTINE') {
    return { executionState: 'deferred', executionSource: 'deferred_review' }
  }
  return { executionState: 'deferred', executionSource: 'deferred_phase_2' }
}

function buildDecisionReason(params: {
  destinationState: GmailDestinationState
  clusterTitle: string
}): string {
  if (params.destinationState === 'KEEP') {
    return `Selected in Sender Decision Mode for ${params.clusterTitle}. This sender is protected and does not need Gmail action.`
  }
  if (params.destinationState === 'ARCHIVE') {
    return `Selected in Sender Decision Mode for ${params.clusterTitle}. Archive execution is stored and waits for Management push.`
  }
  if (params.destinationState === 'CUSTOM_RULE') {
    return `Selected in Sender Decision Mode for ${params.clusterTitle}. Custom Rule is stored with pending refinement for a later Management pass.`
  }
  return `Selected in Sender Decision Mode for ${params.clusterTitle}. This sender is deferred for later review in Management.`
}

function buildDestinationTrustSignals(
  sender: WorkspaceSender
): GmailSenderDestinationTrustSignals {
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

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return 'No recent activity'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value
  return new Date(parsed).toLocaleDateString()
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0%'
  if (value < 1) return '<1%'
  return `${Math.round(value)}%`
}

function ratioPercent(value: number, total: number): number {
  if (!total) return 0
  return (value / total) * 100
}

function senderGlobalCategoryEntries(
  sender: WorkspaceSender
): WorkspaceSender['category_distribution'] {
  const distribution = Array.isArray(sender.category_distribution)
    ? sender.category_distribution
    : DEFAULT_CANONICAL_SENDER_PROFILE.category_distribution
  return distribution.filter(
    (entry) => typeof entry.label === 'string' && entry.label.trim() && entry.count > 0
  )
}

function senderPrimaryCanonicalCategory(sender: WorkspaceSender): string {
  if (sender.dominant_category) return sender.dominant_category
  const firstCategory = senderGlobalCategoryEntries(sender)[0]?.label
  if (firstCategory) return firstCategory
  if (sender.category_profile_mode === 'uncategorized') return 'Uncategorized'
  return 'Insufficient data'
}

function labelForSenderSignal(signal: WorkspaceSender['sender_signal']): string {
  if (signal === 'likely_machine_generated') return 'Likely automated'
  if (signal === 'likely_human') return 'Likely human'
  return 'Unclear'
}

function sortLabelForSubsetSource(source: OverviewSubsetSource): string {
  if (source === 'review_unit') return 'Review unit'
  if (source === 'category') return 'Category lane'
  if (source === 'composition') return 'Composition lane'
  return 'Focused sender'
}

function dateSortValue(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function compareDrilldownSenders(
  left: WorkspaceSender,
  right: WorkspaceSender,
  sort: DrilldownSort,
  managedBySender: Record<string, ManagedSenderState>
): number {
  const leftManaged = managedBySender[left.sender_key] ? 1 : 0
  const rightManaged = managedBySender[right.sender_key] ? 1 : 0
  if (leftManaged !== rightManaged) return leftManaged - rightManaged

  if (sort === 'recent') {
    return (
      dateSortValue(right.last_activity) - dateSortValue(left.last_activity) ||
      right.cleanup_group_message_count - left.cleanup_group_message_count ||
      left.sender.localeCompare(right.sender)
    )
  }

  if (sort === 'unread') {
    return (
      right.unread_count - left.unread_count ||
      right.cleanup_group_message_count - left.cleanup_group_message_count ||
      left.sender.localeCompare(right.sender)
    )
  }

  return (
    right.cleanup_group_message_count - left.cleanup_group_message_count ||
    right.unread_count - left.unread_count ||
    left.sender.localeCompare(right.sender)
  )
}

const reviewPageShellClass =
  'space-y-5 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(26,46,68,0.26),rgba(10,15,24,0.08)_48%,transparent_78%)] p-1'
const primarySurfaceClass =
  'app-surface-card rounded-2xl border border-slate-500/65 bg-[linear-gradient(180deg,rgba(22,29,40,0.98),rgba(11,16,25,0.98))] shadow-[0_22px_56px_rgba(2,6,23,0.34)]'
const nestedSurfaceClass =
  'border border-slate-400/70 bg-[linear-gradient(180deg,rgba(29,38,52,0.98),rgba(17,23,34,0.98))] shadow-[0_18px_44px_rgba(2,6,23,0.26),inset_0_1px_0_rgba(255,255,255,0.04)]'
const insetSurfaceClass =
  'border border-slate-400/40 bg-[linear-gradient(180deg,rgba(15,22,32,0.98),rgba(9,14,22,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(2,6,23,0.16)]'
const insetPillClass =
  'border border-slate-400/40 bg-[linear-gradient(180deg,rgba(25,32,44,0.96),rgba(18,24,35,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
const senderRowShellClass =
  'overflow-hidden rounded-2xl border border-slate-500/45 bg-[linear-gradient(180deg,rgba(18,26,36,0.98),rgba(10,15,23,0.99))] shadow-[0_14px_32px_rgba(2,6,23,0.24)]'
const senderRowExpandedClass =
  'space-y-3 border-t border-white/[0.08] bg-[linear-gradient(180deg,rgba(8,13,20,0.98),rgba(6,10,16,0.99))] px-4 py-4'
const senderProfilePanelClass =
  'rounded-2xl border border-cyan-700/35 bg-[linear-gradient(180deg,rgba(15,27,40,0.98),rgba(8,14,22,0.99))] p-4 shadow-[0_14px_32px_rgba(2,6,23,0.24)]'
const senderSupportingFooterClass =
  'rounded-2xl border border-slate-400/20 bg-[rgba(11,16,24,0.88)] p-3'
const quietSecondaryActionClass =
  'border border-slate-400/30 bg-[rgba(20,27,38,0.88)] text-slate-100 hover:border-cyan-600/60 hover:bg-[rgba(20,34,48,0.94)] hover:text-cyan-100'
const secondaryWorkflowSectionClass =
  `${primarySurfaceClass} border-slate-500/45 bg-[linear-gradient(180deg,rgba(18,24,35,0.95),rgba(10,15,24,0.97))] shadow-[0_14px_36px_rgba(2,6,23,0.22)]`
const primaryWorkflowSectionClass =
  'rounded-3xl border border-cyan-600/50 bg-[linear-gradient(180deg,rgba(16,30,45,0.98),rgba(10,18,29,0.99))] p-5 shadow-[0_26px_64px_rgba(2,6,23,0.34)]'
const UNLABELED_VISIBLE_EVIDENCE_CATEGORY = 'Unlabeled evidence'

function SummaryCard(props: {
  title: string
  value: string
  detail: string
  className?: string
}) {
  return (
    <div className={`${nestedSurfaceClass} rounded-2xl p-4 ${props.className || ''}`}>
      <p className="text-[10px] uppercase tracking-wide text-slate-300">{props.title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-200">{props.detail}</p>
    </div>
  )
}

type CompactRankedBarChartChildItem = {
  id: string
  label: string
  value: number
  valueLabel: string
  supportLabel?: string | null
  accentClass: string
  active?: boolean
  onClick?: () => void
}

type CompactRankedBarChartItem = {
  id: string
  label: string
  value: number
  valueLabel: string
  rankLabel?: string | null
  supportLabel?: string | null
  accentClass: string
  active?: boolean
  onClick?: () => void
  childItems?: CompactRankedBarChartChildItem[]
  childItemsLabel?: string
  childItemsExpanded?: boolean
  onToggleChildItems?: () => void
}

type CompactSegmentedStripSegment = {
  key: string
  label: string
  count: number
  accentClass: string
}

function semanticFamilyAccentClass(
  family: WorkspaceSender['semantic_family']['family']
): string {
  if (family === 'commerce_transactional') return 'bg-cyan-500'
  if (family === 'account_notification') return 'bg-sky-500'
  if (family === 'marketing_promotional') return 'bg-violet-500'
  if (family === 'security_alert') return 'bg-amber-400'
  if (family === 'social_community') return 'bg-indigo-400'
  return 'bg-emerald-500'
}

function semanticFamilyChildAccentClass(
  family: WorkspaceSender['semantic_family']['family'],
  tone: GmailSemanticPresentationPolicy['semanticRow']['primaryFamilyRows'][number]['children'][number]['tone']
): string {
  if (tone === 'unresolved') return 'bg-slate-500'
  if (family === 'commerce_transactional') return tone === 'provisional' ? 'bg-cyan-400/80' : 'bg-cyan-500'
  if (family === 'account_notification') return tone === 'provisional' ? 'bg-sky-400/80' : 'bg-sky-500'
  if (family === 'marketing_promotional') return tone === 'provisional' ? 'bg-violet-400/80' : 'bg-violet-500'
  if (family === 'security_alert') return tone === 'provisional' ? 'bg-amber-300/80' : 'bg-amber-400'
  if (family === 'social_community') return tone === 'provisional' ? 'bg-indigo-300/80' : 'bg-indigo-400'
  if (family === 'human_personal') return tone === 'provisional' ? 'bg-emerald-400/80' : 'bg-emerald-500'
  return 'bg-slate-500'
}

function semanticFocusTitle(focus: SemanticSubtypeFocus): string {
  if (focus.kind === 'family') {
    return `${focus.label} inside this group`
  }
  return `${focus.label} inside ${focus.familyLabel}`
}

function semanticFocusLaneDetail(focus: SemanticSubtypeFocus): string {
  if (focus.kind === 'family') {
    return `These senders match the ${focus.label.toLowerCase()} lane inside this parent group. Use this as a narrower descriptive slice without changing the parent cleanup group.`
  }
  if (focus.kind === 'remainder') {
    return `These senders most closely match the broad edge of ${focus.familyLabel}. This broad remainder is intentional, so use it after the clearest visible patterns.`
  }
  if (focus.tone === 'resolved') {
    return `These senders most closely match ${focus.label} inside ${focus.familyLabel}. Use this as a clean first pass.`
  }
  return `These senders most closely match the ${focus.label} signal inside ${focus.familyLabel}. Start here, then return to the broader family when you want the wider pass.`
}

function semanticFocusSelectionDetail(focus: SemanticSubtypeFocus): string {
  if (focus.kind === 'family') {
    return `Start here with ${focus.label}. These senders match this descriptive family lane inside the parent group.`
  }
  return `Start here with ${focus.label}. These are the strongest matches for this pattern in this group.`
}

function CompactRankedBarChart(props: {
  items: CompactRankedBarChartItem[]
  scaleTotal?: number | null
  emptyStateTitle: string
  emptyStateDetail: string
  footer?: string | null
  widthMode?: 'absolute_total' | 'relative_visible_max'
}) {
  if (props.items.length === 0) {
    return (
      <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4`}>
        <p className="text-sm font-semibold text-white">{props.emptyStateTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{props.emptyStateDetail}</p>
      </div>
    )
  }

  const visibleMax = Math.max(...props.items.map((item) => item.value), 1)
  const widthMode = props.widthMode === 'relative_visible_max' ? 'relative_visible_max' : 'absolute_total'
  const scaleTotal =
    typeof props.scaleTotal === 'number' &&
    Number.isFinite(props.scaleTotal) &&
    props.scaleTotal > 0
      ? props.scaleTotal
      : visibleMax

  return (
    <div className="space-y-2.5">
      {props.items.map((item) => {
        const widthPct =
          widthMode === 'relative_visible_max'
            ? Math.max(0, Math.min((item.value / visibleMax) * 100, 100))
            : Math.max(0, Math.min((item.value / scaleTotal) * 100, 100))
        const activeShellClass = item.active
          ? 'border-cyan-700/45 bg-cyan-950/10'
          : 'border-slate-500/25 bg-[rgba(12,17,25,0.72)]'
        const childItemsExpanded = Boolean(item.childItemsExpanded)
        const rowBody = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  {item.rankLabel ? (
                    <span className={`${insetPillClass} shrink-0 rounded-full px-2 py-0.5 text-[10px] text-slate-100`}>
                      {item.rankLabel}
                    </span>
                  ) : null}
                  <p className="truncate text-sm font-medium text-white">{item.label}</p>
                </div>
                {item.supportLabel ? (
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{item.supportLabel}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-start gap-2">
                <span className="text-sm font-semibold tabular-nums text-white">
                  {item.valueLabel}
                </span>
                {item.childItems?.length ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      item.onToggleChildItems?.()
                    }}
                    aria-expanded={childItemsExpanded}
                    className={`${insetPillClass} rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`}
                  >
                    {childItemsExpanded
                      ? `Hide ${item.childItemsLabel || 'details'}`
                      : `Show ${item.childItemsLabel || 'details'}`}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(7,12,20,0.94)]">
              <div
                className={`h-full rounded-full ${item.accentClass}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </>
        )

        return (
          <div key={item.id} className={`rounded-xl border px-3 py-2.5 ${activeShellClass}`}>
            {item.onClick && !item.childItems?.length ? (
              <button
                type="button"
                onClick={item.onClick}
                aria-pressed={item.active}
                className="block w-full text-left transition hover:text-white"
              >
                {rowBody}
              </button>
            ) : (
              rowBody
            )}
            {item.childItems?.length && childItemsExpanded ? (
              <div className="mt-2.5 space-y-1.5 border-t border-white/[0.06] pt-2.5">
                {item.childItems.map((child) => {
                  const childWidthPct = Math.max(0, Math.min(child.value, 100))
                  const childShellClass = child.active
                    ? 'border-cyan-700/45 bg-cyan-950/12'
                    : 'border-slate-500/20 bg-[rgba(10,15,22,0.72)]'
                  const childBody = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-[12px] font-medium text-slate-100">
                              {child.label}
                            </p>
                            {child.active ? (
                              <span className="shrink-0 rounded-full border border-cyan-500/35 bg-cyan-950/18 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-100">
                                Focused
                              </span>
                            ) : null}
                          </div>
                          {child.supportLabel ? (
                            <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                              {child.supportLabel}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
                          {child.valueLabel}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(4,9,16,0.96)]">
                        <div
                          className={`h-full rounded-full ${child.accentClass}`}
                          style={{ width: `${childWidthPct}%` }}
                        />
                      </div>
                    </>
                  )

                  return child.onClick ? (
                    <button
                      key={child.id}
                      type="button"
                      onClick={child.onClick}
                      aria-pressed={child.active}
                      className={`block w-full rounded-lg border px-2.5 py-2 text-left transition hover:border-cyan-700/45 hover:text-white ${childShellClass}`}
                    >
                      {childBody}
                    </button>
                  ) : (
                    <div
                      key={child.id}
                      className={`rounded-lg border px-2.5 py-2 ${childShellClass}`}
                    >
                      {childBody}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
      {props.footer ? (
        <p className="pt-1 text-[11px] leading-5 text-slate-300">{props.footer}</p>
      ) : null}
    </div>
  )
}

function CompactSegmentedStrip(props: {
  segments: CompactSegmentedStripSegment[]
  emptyStateTitle: string
  emptyStateDetail: string
}) {
  const total = props.segments.reduce((sum, segment) => sum + segment.count, 0)

  if (total === 0) {
    return (
      <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4`}>
        <p className="text-sm font-semibold text-white">{props.emptyStateTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{props.emptyStateDetail}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(7,12,20,0.94)]">
        <div className="flex h-full">
          {props.segments.map((segment) => (
            <div
              key={segment.key}
              className={segment.accentClass}
              style={{ width: `${Math.max(0, Math.min((segment.count / total) * 100, 100))}%` }}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {props.segments.map((segment) => (
          <div
            key={segment.key}
            className={`${insetSurfaceClass} flex items-center justify-between rounded-xl px-3 py-2`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${segment.accentClass}`} />
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                {segment.label}
              </span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-white">
              {segment.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SenderWorkflowPaginationControls(props: {
  pagination: SenderWorkflowPaginationModel
  onPrevious: () => void
  onNext: () => void
  className?: string
}) {
  if (!props.pagination.hasMultiplePages) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-500/30 bg-[rgba(9,14,21,0.74)] px-3 py-2 ${props.className || ''}`}
    >
      <button
        type="button"
        onClick={props.onPrevious}
        disabled={!props.pagination.canPrevious || props.pagination.transitionPending}
        className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Previous
      </button>
      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-cyan-100">
        {props.pagination.statusText}
      </p>
      <button
        type="button"
        onClick={props.onNext}
        disabled={!props.pagination.canNext || props.pagination.transitionPending}
        className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Next
      </button>
    </div>
  )
}

function SenderWorkflowRowLoadingState(props: {
  title: string
  detail: string
  rowCount?: number
}) {
  const rowCount = Math.max(1, props.rowCount || 4)

  return (
    <div className="space-y-3">
      <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4`}>
        <p className="text-sm font-semibold text-white">{props.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{props.detail}</p>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div key={index} className={senderRowShellClass}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 lg:flex-nowrap">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-44 animate-pulse rounded-full bg-slate-800/85" />
                <div className="h-3 w-full max-w-[18rem] animate-pulse rounded-full bg-slate-900/90" />
                <div className="h-3 w-full max-w-[24rem] animate-pulse rounded-full bg-slate-900/70" />
              </div>
              <div className="grid min-w-[11rem] gap-2 sm:grid-cols-2 lg:w-[20rem]">
                <div className="h-7 animate-pulse rounded-full bg-slate-900/85" />
                <div className="h-7 animate-pulse rounded-full bg-slate-900/85" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function normalizeEvidenceText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() || ''
}

function formatEvidenceCategoryLabel(label: string | null | undefined): string {
  const normalized = normalizeEvidenceText(label)
  if (!normalized) return 'Other'
  if (!/^CATEGORY_|^TAB_|_/.test(normalized)) return normalized
  return normalized
    .replace(/^CATEGORY_/, '')
    .replace(/^TAB_/, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function evidenceCategoryKeysForMessage(
  message: WorkspaceSender['preview_messages'][number]
): string[] {
  const unique = Array.from(
    new Set(
      (message.category_labels || [])
        .map((entry) => normalizeEvidenceText(entry))
        .filter(Boolean)
    )
  )

  return unique.length > 0 ? unique : [UNLABELED_VISIBLE_EVIDENCE_CATEGORY]
}

function semanticFamilyLabel(
  family: WorkspaceSender['semantic_family']['family']
): string {
  if (family === 'marketing_promotional') return 'Marketing / promotional'
  if (family === 'commerce_transactional') return 'Commerce / shipping'
  if (family === 'account_notification') return 'Account / service updates'
  if (family === 'security_alert') return 'Security alerts'
  if (family === 'social_community') return 'Social / community'
  return 'Personal correspondence'
}

function compactLabelSummary(labels: string[], extraCount: number, emptyLabel: string): string {
  const visibleLabels = labels.filter((label) => typeof label === 'string' && label.trim().length > 0)
  if (visibleLabels.length === 0) return emptyLabel
  return `${visibleLabels.join(' · ')}${extraCount > 0 ? ` · +${extraCount}` : ''}`
}

function senderPrimaryTakeaway(sender: WorkspaceSender): string {
  if (sender.semantic_family.resolution === 'thin_history') return 'Thin semantic history'
  if (sender.semantic_family.resolution === 'mixed') return 'Mixed semantic context'
  if (
    sender.semantic_family.subtype_label &&
    !sender.semantic_family.umbrella &&
    sender.semantic_family.decomposition_status === 'resolved'
  ) {
    return sender.semantic_family.subtype_label
  }
  return gmailSemanticFamilyDisplayLabel(sender.semantic_family.family)
}

function senderSemanticReadSummary(sender: WorkspaceSender): string {
  if (sender.semantic_family.resolution === 'thin_history') {
    return 'Not enough sender history for a stable semantic read yet'
  }

  const familyLabel = gmailSemanticFamilyDisplayLabel(sender.semantic_family.family)
  const patternLabel = gmailSemanticPatternClassDisplayLabel(sender.semantic_pattern.pattern_class)
  const subtypeLabel = sender.semantic_family.subtype_label

  if (sender.semantic_family.resolution === 'mixed') {
    return `${familyLabel} · mixed semantic read`
  }

  if (subtypeLabel && !sender.semantic_family.umbrella && sender.semantic_family.decomposition_status === 'resolved') {
    return `${familyLabel} · ${subtypeLabel}`
  }

  if (
    subtypeLabel &&
    sender.semantic_family.decomposition_status !== 'not_applicable'
  ) {
    return `${familyLabel} · early ${subtypeLabel.toLowerCase()} signal`
  }

  return `${familyLabel} · ${patternLabel}`
}

function senderRiskSummary(sender: WorkspaceSender): string | null {
  if (sender.protected_hint && sender.requires_verification) {
    return 'Protected context is present. Check carefully before archiving.'
  }

  if (sender.protected_hint) {
    return 'Protected context is present.'
  }

  if (sender.requires_verification) {
    return 'Check carefully before archiving.'
  }

  return null
}

function buildSemanticSubtypeFocusRequest(
  focus: SemanticSubtypeFocus
): GmailSenderWorkspaceSemanticFocus {
  return {
    family: focus.family,
    kind: focus.kind,
    subtypeKey: focus.subtypeKey,
    surfacedSubtypeKeys: focus.surfacedSubtypeKeys,
  }
}

function buildSemanticSubtypeFocusFromPublishedReviewUnit(params: {
  unit: CleanupGroupPublishedReviewUnit
  familyRow: SemanticFamilyRowPresentation
}): SemanticSubtypeFocus | null {
  const semanticFocus = buildSemanticFocusFromPublishedReviewUnit(params.unit)
  if (!semanticFocus) return null
  return {
    id: params.unit.id,
    label: params.unit.label,
    family: semanticFocus.family,
    familyLabel: params.familyRow.label,
    publishedSenderCount: params.unit.senderCount,
    publishedParentSharePct: params.unit.groupSharePct,
    publishedGroupSharePct: params.unit.groupSharePct,
    subtypeKey: semanticFocus.subtypeKey,
    kind: semanticFocus.kind,
    tone: semanticFocus.kind === 'subtype' ? 'resolved' : 'provisional',
    surfacedSubtypeKeys: semanticFocus.surfacedSubtypeKeys,
  }
}

function senderWorkspaceOrderingForDrilldownSort(
  sort: DrilldownSort
): {
  sort: 'message_count' | 'last_activity' | 'unread_count'
  direction: 'desc'
} {
  if (sort === 'recent') {
    return { sort: 'last_activity', direction: 'desc' }
  }
  if (sort === 'unread') {
    return { sort: 'unread_count', direction: 'desc' }
  }
  return { sort: 'message_count', direction: 'desc' }
}

function buildSenderEvidenceGroups(params: {
  messages: WorkspaceSender['preview_messages']
}): Array<[string, WorkspaceSender['preview_messages']]> {
  const groups = new Map<string, WorkspaceSender['preview_messages']>()

  for (const message of params.messages) {
    for (const categoryKey of evidenceCategoryKeysForMessage(message)) {
      const existing = groups.get(categoryKey) || []
      if (!existing.some((entry) => entry.message_id === message.message_id)) {
        groups.set(categoryKey, [...existing, message])
      }
    }
  }

  return Array.from(groups.entries())
}

function evidenceLaneLabelsForGroups(
  evidenceGroups: Array<[string, WorkspaceSender['preview_messages']]>
): string[] {
  return evidenceGroups.map(([label]) => formatEvidenceCategoryLabel(label))
}

function senderVisibleProofCoverageNote(params: {
  visibleMessageCount: number
  loadedMessageCount: number
}): string | null {
  if (params.loadedMessageCount === 0) return null

  if (params.visibleMessageCount < params.loadedMessageCount) {
    return `Showing ${params.visibleMessageCount.toLocaleString()} of ${params.loadedMessageCount.toLocaleString()} loaded proof messages. Show more loaded proof below to keep browsing.`
  }

  return 'All loaded proof for this sender is on screen right now.'
}

function buildWorkspaceSnapshot(params: {
  data: GmailSenderWorkspaceData
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  source: WorkspaceSnapshotSource
  cacheVersion: string | null
  previewEvidenceSenderKey?: string | null
}): WorkspaceSnapshot {
  return {
    data: params.data,
    clusterId: params.clusterId,
    analysisScope: params.analysisScope,
    mode: params.mode,
    source: params.source,
    cacheVersion: params.cacheVersion,
    previewEvidenceSenderKey: params.previewEvidenceSenderKey || null,
  }
}

function buildWorkspaceRequestKey(params: {
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  previewEvidenceSenderKey?: string | null
}): string {
  return [
    params.clusterId,
    params.analysisScope,
    params.mode,
    normalizeWorkspaceCacheVersion(params.cacheVersion),
    params.previewEvidenceSenderKey || 'no-preview-evidence-sender',
  ].join('::')
}

function normalizeWorkspaceCacheVersion(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function workspaceSnapshotRequestKey(snapshot: WorkspaceSnapshot): string {
  return buildWorkspaceRequestKey({
    clusterId: snapshot.clusterId,
    analysisScope: snapshot.analysisScope,
    mode: snapshot.mode,
    cacheVersion: snapshot.cacheVersion,
    previewEvidenceSenderKey: snapshot.previewEvidenceSenderKey,
  })
}

function workspaceSnapshotsMateriallyEqual(
  left: WorkspaceSnapshot | null | undefined,
  right: WorkspaceSnapshot | null | undefined
): boolean {
  if (left === right) return true
  if (!left || !right) return left == null && right == null
  return (
    workspaceSnapshotRequestKey(left) === workspaceSnapshotRequestKey(right) &&
    left.data === right.data
  )
}

function workspaceStatesEqual(left: WorkspaceState, right: WorkspaceState): boolean {
  return (
    left.status === right.status &&
    left.error === right.error &&
    workspaceSnapshotsMateriallyEqual(left.snapshot, right.snapshot)
  )
}

function buildSenderOverviewRailFastKey(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
  scope: OperationsAnalysisScope
  version: string | null
}): string {
  return [
    params.agentId,
    params.sessionId || 'no-session',
    params.clusterId,
    params.scope,
    params.version || 'no-version',
  ].join('::')
}

function readSenderOverviewRailFastPackage(key: string): SenderOverviewRailFastPackage | null {
  return senderOverviewRailMemoryStore.get(key) || null
}

function writeSenderOverviewRailFastPackage(
  pkg: SenderOverviewRailFastPackage
): SenderOverviewRailFastPackage {
  senderOverviewRailMemoryStore.set(pkg.key, pkg)
  return pkg
}

function buildMissingSenderOverviewRailFastPackage(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
  scope: OperationsAnalysisScope
  version: string | null
  clusterTitle: string | null
}): SenderOverviewRailFastPackage {
  return {
    key: buildSenderOverviewRailFastKey({
      agentId: params.agentId,
      sessionId: params.sessionId,
      clusterId: params.clusterId,
      scope: params.scope,
      version: params.version,
    }),
    sourceLabel: 'unavailable_scope',
    state: 'unavailable_scope',
    clusterId: params.clusterId,
    scope: params.scope,
    version: params.version,
    clusterTitle: params.clusterTitle,
    visibleClusterCount: null,
    chart: null,
    metrics: null,
  }
}

function buildDetachedRailOverallActivityMetric(params: {
  messageCount: number
  scope: OperationsAnalysisScope
}): SenderTimeContextRailMetricModel {
  const scopeLabel = analysisScopeControlLabel(params.scope)
  if (params.messageCount <= 0) {
    return {
      value: 'No supporting messages',
      detail: `${scopeLabel} has published rail truth for this cleanup group, but no supporting message volume is visible in the seed.`,
    }
  }

  return {
    value: `${params.messageCount.toLocaleString()} supporting messages`,
    detail: `${scopeLabel} shows the published message workload currently attached to this cleanup group.`,
  }
}

function buildDetachedRailActivityMixMetric(params: {
  dominantSender: string | null
  scope: OperationsAnalysisScope
}): SenderTimeContextRailMetricModel {
  const scopeLabel = analysisScopeControlLabel(params.scope)
  if (!params.dominantSender) {
    return {
      value: 'Activity spread across senders',
      detail: `${scopeLabel} does not show a single dominant sender from the published rail summary.`,
    }
  }

  return {
    value: `${params.dominantSender} leads`,
    detail: `${scopeLabel} shows ${params.dominantSender} as the strongest published sender signal for this cleanup group.`,
  }
}

function buildDetachedRailPatternSignalMetric(
  distribution: NonNullable<
    OperationsSelectedClusterRailFamilyScopeEntry['signal']
  >['semantic_resolution_distribution']
): SenderTimeContextRailMetricModel {
  const familyEntries = distribution.filter((entry) => entry.scope === 'family')
  const totalSenders = familyEntries.reduce((sum, entry) => sum + entry.sender_count, 0)
  const clearCount =
    familyEntries.find((entry) => entry.resolution === 'clear')?.sender_count || 0
  const mixedCount =
    familyEntries.find((entry) => entry.resolution === 'mixed')?.sender_count || 0
  const thinHistoryCount =
    familyEntries.find((entry) => entry.resolution === 'thin_history')?.sender_count || 0

  if (totalSenders === 0) {
    return {
      value: 'Pattern signal unavailable',
      detail: 'The published rail seed does not include enough semantic coverage to summarize pattern confidence here.',
    }
  }

  if (clearCount >= Math.max(1, Math.round(totalSenders * 0.6))) {
    return {
      value: `${clearCount.toLocaleString()} clear patterns`,
      detail: 'Most visible senders follow a stable pattern, so this timeframe should stay comparatively easy to read.',
    }
  }

  if (mixedCount >= Math.max(clearCount, 1)) {
    return {
      value: `${mixedCount.toLocaleString()} mixed patterns`,
      detail: 'Several visible senders blend multiple behaviors, so this timeframe benefits from a closer evidence read.',
    }
  }

  if (thinHistoryCount > 0) {
    return {
      value: `${thinHistoryCount.toLocaleString()} lighter-history senders`,
      detail: 'Some visible senders still have thinner history, so this timeframe may need a broader comparison window.',
    }
  }

  return {
    value: 'Patterns are settling',
    detail: 'This timeframe has usable semantic signal, but no single resolution dominates the whole cleanup group.',
  }
}

function buildDetachedRailNextAction(params: {
  scope: OperationsAnalysisScope
  baselineScope: OperationsAnalysisScope
}): {
  title: string
  detail: string
} {
  const scopeLabel = analysisScopeControlLabel(params.scope)
  const baselineScopeLabel = analysisScopeControlLabel(params.baselineScope)
  return {
    title:
      params.scope === params.baselineScope
        ? 'Review this timeframe in place'
        : `Compare with ${baselineScopeLabel}`,
    detail:
      params.scope === params.baselineScope
        ? 'This rail is already aligned to the active page timeframe.'
        : `${scopeLabel} is ready to compare against ${baselineScopeLabel} without reloading the rest of the page.`,
  }
}

function buildSenderOverviewRailFastPackageFromRuntimeSeed(params: {
  agentId: string
  sessionId: string | null
  version: string | null
  baselineScope: OperationsAnalysisScope
  entry: OperationsSelectedClusterRailFamilyScopeEntry
  fallbackClusterTitle: string | null
}): SenderOverviewRailFastPackage {
  const clusterTitle =
    cleanupGroupDisplayTitle({
      clusterId: params.entry.cluster_id,
      title: params.entry.cluster_title || params.fallbackClusterTitle,
    }) || null
  if (params.entry.state !== 'ready') {
    return {
      key: buildSenderOverviewRailFastKey({
        agentId: params.agentId,
        sessionId: params.sessionId,
        clusterId: params.entry.cluster_id,
        scope: params.entry.scope,
        version: params.version,
      }),
      sourceLabel: 'bootstrap_runtime_seed',
      state: params.entry.state,
      clusterId: params.entry.cluster_id,
      scope: params.entry.scope,
      version: params.version,
      clusterTitle,
      visibleClusterCount: params.entry.visible_cluster_count,
      chart: null,
      metrics: null,
    }
  }

  const signal = params.entry.signal
  const timeline = params.entry.timeline
  return {
    key: buildSenderOverviewRailFastKey({
      agentId: params.agentId,
      sessionId: params.sessionId,
      clusterId: params.entry.cluster_id,
      scope: params.entry.scope,
      version: params.version,
    }),
    sourceLabel: 'bootstrap_runtime_seed',
    state: 'ready',
    clusterId: params.entry.cluster_id,
    scope: params.entry.scope,
    version: params.version,
    clusterTitle,
    visibleClusterCount: params.entry.visible_cluster_count,
    chart: {
      granularity: timeline?.granularity || 'month',
      items: timeline?.items || [],
    },
    metrics: {
      overallActivity: buildDetachedRailOverallActivityMetric({
        messageCount: signal?.message_count || 0,
        scope: params.entry.scope,
      }),
      activityMix: buildDetachedRailActivityMixMetric({
        dominantSender: signal?.dominant_sender || null,
        scope: params.entry.scope,
      }),
      patternSignal: buildDetachedRailPatternSignalMetric(
        signal?.semantic_resolution_distribution || []
      ),
      nextAction: buildDetachedRailNextAction({
        scope: params.entry.scope,
        baselineScope: params.baselineScope,
      }),
    },
  }
}

function withSenderOverviewRailSourceLabel(
  pkg: SenderOverviewRailFastPackage,
  sourceLabel: SenderOverviewRailFastSourceLabel
): SenderOverviewRailFastPackage {
  return {
    ...pkg,
    sourceLabel,
  }
}

function buildSenderOverviewRailScopeStatus(params: {
  activeScope: OperationsAnalysisScope
  baselineScope: OperationsAnalysisScope
  workflowScope: OperationsAnalysisScope
  state: SenderOverviewRailFastState | 'ready'
}): SenderOverviewRailScopeStatus {
  const activeScopeLabel = analysisScopeControlLabel(params.activeScope)
  const baselineScopeLabel = analysisScopeControlLabel(params.baselineScope)
  const workflowScopeLabel = analysisScopeControlLabel(params.workflowScope)
  const railMatchesPageScope = params.activeScope === params.baselineScope
  const railMatchesWorkflowScope = params.activeScope === params.workflowScope
  const workflowMatchesPageScope = params.workflowScope === params.baselineScope

  if (params.state === 'outside_timeframe') {
    return {
      label: 'Outside timeframe',
      detail: railMatchesWorkflowScope
        ? `${activeScopeLabel} is the current workflow timeframe, and this cleanup group is not visible in that window right now.`
        : `${activeScopeLabel} does not include this cleanup group, so the sender workflow, coverage, and decision queue stay on ${workflowScopeLabel}.`,
      tone: 'outside',
    }
  }

  if (params.state === 'unavailable_scope') {
    return {
      label: 'Not yet loaded',
      detail: railMatchesWorkflowScope
        ? `${activeScopeLabel} is the current workflow timeframe, but this rail has not loaded its chart state for that window yet.`
        : `${activeScopeLabel} has not been loaded for this cleanup group yet, so the sender workflow, coverage, and decision queue stay on ${workflowScopeLabel}.`,
      tone: 'not_loaded',
    }
  }

  if (railMatchesWorkflowScope && workflowMatchesPageScope) {
    return {
      label: 'Aligned to page scope',
      detail: `${baselineScopeLabel} is driving both this rail and the rest of the Sender Overview page.`,
      tone: 'aligned',
    }
  }

  if (railMatchesWorkflowScope) {
    return {
      label: `Workflow filtered to ${activeScopeLabel}`,
      detail: `${activeScopeLabel} is now driving the sender workflow, coverage, and decision queue. Page shell and charts remain anchored to ${baselineScopeLabel}.`,
      tone: 'comparing',
    }
  }

  if (railMatchesPageScope && !workflowMatchesPageScope) {
    return {
      label: 'Rail back on page scope',
      detail: `${baselineScopeLabel} is shown in the rail again, while sender workflow, coverage, and decision queue remain filtered to ${workflowScopeLabel}.`,
      tone: 'comparing',
    }
  }

  return {
    label: `Comparing ${activeScopeLabel}`,
    detail: `${activeScopeLabel} is shown only in this rail. Sender workflow, coverage, and decision queue remain on ${workflowScopeLabel}, while charts stay anchored to ${baselineScopeLabel}.`,
    tone: 'comparing',
  }
}

function buildSenderDistributionRailScopeStatus(params: {
  activeScope: OperationsAnalysisScope
  baselineScope: OperationsAnalysisScope
  workflowScope: OperationsAnalysisScope
  comparisonState: SenderOverviewRailFastState | 'ready'
}): SenderOverviewRailScopeStatus {
  const activeScopeLabel = analysisScopeControlLabel(params.activeScope)
  const baselineScopeLabel = analysisScopeControlLabel(params.baselineScope)
  const workflowScopeLabel = analysisScopeControlLabel(params.workflowScope)
  const workflowMatchesPageScope = params.workflowScope === params.baselineScope
  const comparingAlternateScope = params.activeScope !== params.workflowScope

  if (!comparingAlternateScope && workflowMatchesPageScope) {
    return {
      label: 'Aligned to page scope',
      detail: `${baselineScopeLabel} is driving Sender Distribution, the workflow list, and Decision Mode together.`,
      tone: 'aligned',
    }
  }

  if (!comparingAlternateScope) {
    return {
      label: `Workflow filtered to ${workflowScopeLabel}`,
      detail: `${workflowScopeLabel} is driving Sender Distribution, the workflow list, and Decision Mode while the page shell stays anchored to ${baselineScopeLabel}.`,
      tone: 'comparing',
    }
  }

  if (params.comparisonState === 'outside_timeframe') {
    return {
      label: `Comparing ${activeScopeLabel}`,
      detail: `${activeScopeLabel} does not include this cleanup group, so Sender Distribution, the workflow list, and Decision Mode stay on ${workflowScopeLabel}.`,
      tone: 'outside',
    }
  }

  if (params.comparisonState === 'unavailable_scope') {
    return {
      label: `Comparing ${activeScopeLabel}`,
      detail: `${activeScopeLabel} has not been loaded for this cleanup group yet, so Sender Distribution, the workflow list, and Decision Mode stay on ${workflowScopeLabel}.`,
      tone: 'not_loaded',
    }
  }

  return {
    label: `Workflow filtered to ${workflowScopeLabel}`,
    detail: `${workflowScopeLabel} remains authoritative for Sender Distribution, the workflow list, and Decision Mode. ${activeScopeLabel} is comparison-only in the rail right now.`,
    tone: 'comparing',
  }
}

function senderOverviewRailTimelineLabelsMatchGranularity(params: {
  granularity: 'day' | 'week' | 'month'
  items: Array<{ label: string; count: number }>
}): boolean {
  if (params.items.length === 0) return false
  const pattern = params.granularity === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/
  return params.items.every((item) => pattern.test((item.label || '').trim()))
}

function workspaceSnapshotMatchesRequest(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  previewEvidenceSenderKey?: string | null
}): boolean {
  return Boolean(
    params.snapshot &&
      params.snapshot.clusterId === params.clusterId &&
      params.snapshot.analysisScope === params.analysisScope &&
      params.snapshot.mode === params.mode &&
      normalizeWorkspaceCacheVersion(params.snapshot.cacheVersion) ===
        normalizeWorkspaceCacheVersion(params.cacheVersion) &&
      (params.previewEvidenceSenderKey == null ||
        params.snapshot.previewEvidenceSenderKey === params.previewEvidenceSenderKey) &&
      params.snapshot.data.selected_cluster.cluster_id === params.clusterId
  )
}

function workspaceHasClusterGlobalSenderKeys(
  workspace: GmailSenderWorkspaceData | null | undefined
): boolean {
  return Boolean(workspace?.cluster_global?.sender_keys_complete)
}

function workspaceHasUsableClusterGlobalSenderKeys(
  workspace: GmailSenderWorkspaceData | null | undefined
): boolean {
  if (!workspaceHasClusterGlobalSenderKeys(workspace)) return false
  const senderKeys = workspace?.cluster_global?.sender_keys || []
  const clusterSenderTotal = workspaceClusterSenderTotal(workspace)
  return clusterSenderTotal === 0 || senderKeys.length > 0
}

function workspaceSnapshotMatchesOverviewHeaderTruth(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  cacheVersion: string | null
  page: number
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  return Boolean(
    workspaceSnapshotMatchesRequest({
      snapshot,
      clusterId: params.clusterId,
      analysisScope: params.analysisScope,
      mode: 'overview',
      cacheVersion: params.cacheVersion,
    }) &&
      workspaceDataMatchesOverviewView(snapshot.data, params.page) &&
      snapshot.data.selected_cluster.cluster_id === params.clusterId
  )
}

function workspaceSnapshotMatchesOverviewShellTruth(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  cacheVersion: string | null
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  return Boolean(
    workspaceSnapshotMatchesRequest({
      snapshot,
      clusterId: params.clusterId,
      analysisScope: params.analysisScope,
      mode: 'overview',
      cacheVersion: params.cacheVersion,
    }) &&
      workspaceDataMatchesOverviewStructureView(snapshot.data) &&
      snapshot.data.selected_cluster.cluster_id === params.clusterId
  )
}

function workspaceSnapshotMatchesClusterCoverageTruth(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  cacheVersion: string | null
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  if (
    snapshot.clusterId !== params.clusterId ||
    snapshot.analysisScope !== params.analysisScope ||
    normalizeWorkspaceCacheVersion(snapshot.cacheVersion) !==
      normalizeWorkspaceCacheVersion(params.cacheVersion) ||
    snapshot.data.selected_cluster.cluster_id !== params.clusterId ||
    !workspaceHasUsableClusterGlobalSenderKeys(snapshot.data)
  ) {
    return false
  }

  return snapshot.mode === 'decision'
    ? workspaceDataMatchesDecisionQueueStructureView(snapshot.data)
    : snapshot.mode === 'overview' && workspaceDataMatchesOverviewStructureView(snapshot.data)
}

function workspaceSnapshotMatchesClusterCoverageContext(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  if (
    snapshot.clusterId !== params.clusterId ||
    snapshot.analysisScope !== params.analysisScope ||
    snapshot.data.selected_cluster.cluster_id !== params.clusterId ||
    !workspaceHasUsableClusterGlobalSenderKeys(snapshot.data)
  ) {
    return false
  }

  return snapshot.mode === 'decision'
    ? workspaceDataMatchesDecisionQueueStructureView(snapshot.data)
    : snapshot.mode === 'overview' && workspaceDataMatchesOverviewStructureView(snapshot.data)
}

function workspaceDataMatchesOverviewStructureView(data: GmailSenderWorkspaceData): boolean {
  return (
    data.pagination.page_size === DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE &&
    data.view.search === '' &&
    data.view.filter === DEFAULT_OVERVIEW_WORKSPACE_FILTER &&
    data.view.sort === DEFAULT_OVERVIEW_WORKSPACE_SORT &&
    data.view.direction === DEFAULT_OVERVIEW_WORKSPACE_DIRECTION
  )
}

function workspaceDataMatchesOverviewView(data: GmailSenderWorkspaceData, page: number): boolean {
  return (
    data.pagination.page === page &&
    workspaceDataMatchesOverviewStructureView(data)
  )
}

function workspaceDataMatchesDecisionQueueStructureView(data: GmailSenderWorkspaceData): boolean {
  return (
    data.pagination.page_size === DECISION_QUEUE_WORKSPACE_PAGE_SIZE &&
    data.view.search === '' &&
    data.view.filter === DEFAULT_OVERVIEW_WORKSPACE_FILTER &&
    data.view.sort === DEFAULT_OVERVIEW_WORKSPACE_SORT &&
    data.view.direction === DEFAULT_OVERVIEW_WORKSPACE_DIRECTION
  )
}

function workspaceDataMatchesDecisionQueueView(data: GmailSenderWorkspaceData, page: number): boolean {
  return data.pagination.page === page && workspaceDataMatchesDecisionQueueStructureView(data)
}

function workspaceSnapshotSatisfiesCurrentMode(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  page: number
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  if (
    !workspaceSnapshotMatchesRequest({
      snapshot,
      clusterId: params.clusterId,
      analysisScope: params.analysisScope,
      mode: params.mode,
      cacheVersion: params.cacheVersion,
    })
  ) {
    return false
  }

  if (!workspaceHasClusterGlobalSenderKeys(snapshot.data)) return false
  return params.mode === 'decision'
    ? workspaceDataMatchesDecisionQueueView(snapshot.data, params.page)
    : workspaceDataMatchesOverviewView(snapshot.data, params.page)
}

function workspaceClusterGlobalSenderKeys(
  workspace: GmailSenderWorkspaceData | null | undefined
): string[] {
  if (!workspaceHasUsableClusterGlobalSenderKeys(workspace)) return []
  return workspace?.cluster_global.sender_keys || []
}

function workspaceSnapshotContainsSenderKey(
  snapshot: WorkspaceSnapshot | null | undefined,
  senderKey: string | null | undefined
): boolean {
  if (!snapshot || !senderKey) return false
  return snapshot.data.senders.some((sender) => sender.sender_key === senderKey)
}

function resolveFallbackDecisionTargetPage(params: {
  workspace: GmailSenderWorkspaceData | null | undefined
  requestedPage: number
  managedBySender: Record<string, ManagedSenderState>
  fallbackSenderCount?: number | null
  defaultPageSize: number
}): number {
  const workspace = params.workspace
  if (!workspace) return params.requestedPage

  const currentPage = Math.max(
    DEFAULT_OVERVIEW_WORKSPACE_PAGE,
    workspace.pagination.page || params.requestedPage
  )
  const pageSize = Math.max(
    1,
    workspace.pagination.page_size || params.defaultPageSize
  )
  const totalPages = Math.max(
    DEFAULT_OVERVIEW_WORKSPACE_PAGE,
    Math.ceil(workspaceClusterSenderTotal(workspace, params.fallbackSenderCount) / pageSize)
  )
  const hasEligibleOnPage = workspace.senders.some(
    (sender) => !params.managedBySender[sender.sender_key]
  )

  if (!hasEligibleOnPage && currentPage < totalPages) {
    return currentPage + 1
  }

  return currentPage
}

function workspaceClusterManagedDestinationCounts(
  workspace: GmailSenderWorkspaceData | null | undefined,
  managedBySender: Record<string, ManagedSenderState>
):
  | Record<'KEEP' | 'ARCHIVE' | 'CUSTOM_RULE' | 'QUARANTINE', number>
  | null {
  const senderKeys = workspaceClusterGlobalSenderKeys(workspace)
  if (!workspaceHasClusterGlobalSenderKeys(workspace)) return null

  const counts = {
    KEEP: 0,
    ARCHIVE: 0,
    CUSTOM_RULE: 0,
    QUARANTINE: 0,
  } as Record<'KEEP' | 'ARCHIVE' | 'CUSTOM_RULE' | 'QUARANTINE', number>

  for (const senderKey of senderKeys) {
    const managed = managedBySender[senderKey]
    if (!managed) continue
    if (managed.destinationState === 'KEEP') counts.KEEP += 1
    if (managed.destinationState === 'ARCHIVE') counts.ARCHIVE += 1
    if (managed.destinationState === 'CUSTOM_RULE') counts.CUSTOM_RULE += 1
    if (managed.destinationState === 'QUARANTINE') counts.QUARANTINE += 1
  }

  return counts
}

function workspaceClusterManagedSenderCount(
  workspace: GmailSenderWorkspaceData | null | undefined,
  managedBySender: Record<string, ManagedSenderState>
): number | null {
  const senderKeys = workspaceClusterGlobalSenderKeys(workspace)
  if (!workspaceHasClusterGlobalSenderKeys(workspace)) return null
  let count = 0
  for (const senderKey of senderKeys) {
    if (managedBySender[senderKey]) count += 1
  }
  return count
}

function workspaceClusterSenderTotal(
  workspace: GmailSenderWorkspaceData | null | undefined,
  fallbackCount?: number | null
): number {
  if (!workspace) return Math.max(fallbackCount || 0, 0)
  return Math.max(
    workspace.selected_cluster.sender_count ||
      workspace.pagination.cluster_total_senders ||
      fallbackCount ||
      workspace.senders.length,
    workspace.senders.length
  )
}

function workspaceClusterMessageTotal(
  workspace: GmailSenderWorkspaceData | null | undefined,
  fallbackCount?: number | null
): number {
  if (!workspace) return Math.max(fallbackCount || 0, 0)
  return Math.max(workspace.selected_cluster.message_count || fallbackCount || 0, 0)
}

function formatCountOrPlaceholder(value: number | null): string {
  return value == null ? '—' : value.toLocaleString()
}

function hasSnippetOverride(
  snippetOverrides: Record<string, string | null> | undefined,
  messageId: string
): boolean {
  return Boolean(snippetOverrides) && Object.prototype.hasOwnProperty.call(snippetOverrides, messageId)
}

function applySnippetOverrides(
  sender: WorkspaceSender,
  snippetOverrides: Record<string, string | null> | undefined
): WorkspaceSender {
  if (!snippetOverrides) return sender

  let changed = false
  const previewMessages = sender.preview_messages.map((message) => {
    if (!hasSnippetOverride(snippetOverrides, message.message_id)) return message
    changed = true
    return {
      ...message,
      snippet: snippetOverrides[message.message_id],
    }
  })

  return changed
    ? {
        ...sender,
        preview_messages: previewMessages,
      }
    : sender
}

function missingSnippetMessageIds(
  messages: WorkspaceSender['preview_messages'],
  snippetOverrides: Record<string, string | null> | undefined
): string[] {
  return messages
    .filter(
      (message) =>
        message.snippet == null &&
        !hasSnippetOverride(snippetOverrides, message.message_id)
    )
    .map((message) => message.message_id)
}

function normalizeMessageBodyText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\r\n/g, '\n').trim()
  return normalized || null
}

function messagePreviewSubject(
  selection: EvidenceMessageSelection | null,
  data: OperationsMessagePreviewData | null
): string {
  return (
    normalizeEvidenceText(data?.subject) ||
    normalizeEvidenceText(selection?.message.subject) ||
    'No subject'
  )
}

function messagePreviewFromLine(
  selection: EvidenceMessageSelection | null,
  data: OperationsMessagePreviewData | null
): string {
  return (
    normalizeEvidenceText(data?.from) ||
    normalizeEvidenceText(selection?.message.from) ||
    normalizeEvidenceText(selection?.sender) ||
    'Unknown sender'
  )
}

function MessagePreviewDrawer(props: {
  state: EvidenceMessagePreviewState
  onClose: () => void
}) {
  if (!props.state.selection) return null

  const previewData = props.state.data
  const subject = messagePreviewSubject(props.state.selection, previewData)
  const fromLine = messagePreviewFromLine(props.state.selection, previewData)
  const toLine = normalizeEvidenceText(previewData?.to)
  const dateLine =
    normalizeEvidenceText(previewData?.date) ||
    normalizeEvidenceText(props.state.selection.message.date) ||
    'No timestamp'
  const snippetLine =
    normalizeEvidenceText(previewData?.snippet) ||
    normalizeEvidenceText(props.state.selection.message.snippet) ||
    null
  const bodyText = normalizeMessageBodyText(previewData?.body_text)
  const previewEvidenceState = senderEvidenceAvailabilityState([props.state.selection.message])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/72 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close message preview"
        onClick={props.onClose}
        className="absolute inset-0"
      />
      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.08] bg-[var(--app-surface-2)] shadow-[-24px_0_60px_rgba(2,6,23,0.45)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Message preview</p>
            <p className="mt-2 text-lg font-semibold text-white">{subject}</p>
            <p className="mt-2 text-xs text-gray-400">
              {props.state.selection.sender} · supporting evidence
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs`}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <div className="grid gap-3 text-sm text-gray-300">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">From</p>
                  <p className="mt-1 text-sm text-white">{fromLine}</p>
                </div>
                {toLine ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">To</p>
                    <p className="mt-1 text-sm text-white">{toLine}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Date</p>
                  <p className="mt-1 text-sm text-white">{dateLine}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Snippet</p>
                  <p className="mt-1 text-sm leading-6 text-gray-200">
                    {snippetLine || 'No snippet available for this message.'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Message content</p>

              {props.state.status === 'loading' ? (
                <div className="mt-3 rounded-2xl border border-cyan-900/35 bg-cyan-950/12 p-4 text-sm text-cyan-100">
                  Loading full message preview…
                </div>
              ) : null}

              {props.state.status === 'error' ? (
                <div className="mt-3 rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
                  {props.state.error || 'Full message preview could not be loaded.'}
                </div>
              ) : null}

              {props.state.status !== 'loading' && bodyText ? (
                <div className="mt-3 rounded-2xl border border-white/[0.04] bg-[rgba(2,6,17,0.52)] p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">
                    {bodyText}
                  </p>
                </div>
              ) : null}

              {props.state.status === 'ready' && !bodyText ? (
                <div className="mt-3 rounded-2xl border border-amber-900/35 bg-amber-950/14 p-4 text-sm text-amber-100">
                  {snippetLine
                    ? 'Full message content is unavailable for this preview. Snippet text is the only available evidence right now.'
                    : previewEvidenceState === 'subject_only_evidence_available'
                      ? 'Only subject and timestamp evidence are available for this message right now.'
                      : 'No previewable evidence is available for this message right now.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function SenderDrilldownRow(props: {
  sender: WorkspaceSender
  groupSemanticRollup: GmailSenderWorkspaceData['analytics']['semantic_rollup']
  managedState: ManagedSenderState | null
  activeSemanticFocusLabel?: string | null
  expanded: boolean
  onToggle: () => void
  onOpenDecisionMode: (sender: WorkspaceSender) => void
  visibleEvidenceCount: number
  onLoadMore: (count: number) => void
  snippetHydrationState: SenderSnippetHydrationState | null
  onOpenMessagePreview: (
    sender: WorkspaceSender,
    message: WorkspaceSender['preview_messages'][number]
  ) => void
}) {
  const visibleMessages = props.sender.preview_messages.slice(0, props.visibleEvidenceCount)
  const evidenceGroups = buildSenderEvidenceGroups({
    messages: visibleMessages,
  })
  const visibleCategoryLabels = evidenceLaneLabelsForGroups(evidenceGroups)
  const visibleProofCoverageNote = senderVisibleProofCoverageNote({
    visibleMessageCount: visibleMessages.length,
    loadedMessageCount: props.sender.preview_messages.length,
  })
  const takeawayLabel = senderPrimaryTakeaway(props.sender)
  const riskSummary = senderRiskSummary(props.sender)
  const semanticReadSummary = senderSemanticReadSummary(props.sender)
  const collapsedVisibleLabels = (
    visibleCategoryLabels.length > 0 ? visibleCategoryLabels : ['No recent proof yet']
  ).slice(0, 2)
  const collapsedVisibleExtraCount = Math.max(
    (visibleCategoryLabels.length > 0 ? visibleCategoryLabels : ['No recent proof yet']).length -
      collapsedVisibleLabels.length,
    0
  )
  const collapsedVisibleSummary = compactLabelSummary(
    collapsedVisibleLabels,
    collapsedVisibleExtraCount,
    'No recent proof yet'
  )
  const cautionBadgeLabel = riskSummary ? 'Review carefully' : null

  return (
    <article className={senderRowShellClass}>
      <div className="lg:flex lg:items-stretch">
        <button
          type="button"
          onClick={() => props.onOpenDecisionMode(props.sender)}
          className="min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-white/[0.02]"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{props.sender.sender}</p>
                  {props.managedState ? (
                    <span className="rounded-full border border-cyan-700/35 bg-cyan-950/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
                      Managed
                    </span>
                  ) : null}
                  {props.activeSemanticFocusLabel ? (
                    <span className="rounded-full border border-violet-700/35 bg-violet-950/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-violet-100">
                      {props.activeSemanticFocusLabel}
                    </span>
                  ) : null}
                  {cautionBadgeLabel ? (
                    <span className="rounded-full border border-amber-700/35 bg-amber-950/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                      {cautionBadgeLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {props.sender.sender_domain || 'Unknown domain'} · Last activity{' '}
                  {formatDateLabel(props.sender.last_activity)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`${insetPillClass} rounded-full px-2.5 py-1 text-[11px] text-slate-100`}>
                  {props.sender.cleanup_group_message_count.toLocaleString()} msgs
                </span>
                {props.sender.unread_count > 0 ? (
                  <span className={`${insetPillClass} rounded-full px-2.5 py-1 text-[11px] text-slate-100`}>
                    {props.sender.unread_count.toLocaleString()} unread
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{takeawayLabel}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{semanticReadSummary}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Proof on screen
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-200">{collapsedVisibleSummary}</p>
              </div>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] px-4 py-2.5 lg:w-[11.5rem] lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0">
          <button
            type="button"
            onClick={() => props.onOpenDecisionMode(props.sender)}
            className="rounded-full border border-cyan-700/45 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-100 hover:border-cyan-600/60 hover:bg-cyan-950/30 lg:w-full"
          >
            Decision Mode
          </button>
          <button
            type="button"
            onClick={props.onToggle}
            className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs lg:w-full`}
          >
            {props.expanded ? 'Hide preview' : 'Quick preview'}
          </button>
        </div>
      </div>

      {props.expanded ? (
        <div className={senderRowExpandedClass}>
          <GmailSharedSenderCard
            sender={props.sender}
            mode="overview"
            groupSemanticRollup={props.groupSemanticRollup}
            managedState={props.managedState}
            visibleEvidenceCount={props.visibleEvidenceCount}
            onLoadMoreEvidence={(count) => props.onLoadMore(count)}
            snippetHydrationState={props.snippetHydrationState}
            onOpenMessagePreview={props.onOpenMessagePreview}
            headerSlot={
              <span
                className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100`}
              >
                Quick preview
              </span>
            }
            footerSlot={
              visibleProofCoverageNote ? (
                <div className={senderSupportingFooterClass}>
                  <p className="text-[11px] leading-5 text-slate-300">{visibleProofCoverageNote}</p>
                </div>
              ) : null
            }
            className={senderProfilePanelClass}
          />
        </div>
      ) : null}
    </article>
  )
}

export default function OperationsReviewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const sessionId = runtime.sessionId || requestedSessionId
  const analysisScope = runtime.analysisScope
  const normalizedAnalysisScope = normalizeOperationsAnalysisScope(analysisScope)
  const requestedWorkflowScope = searchParams.get('workflow_scope')
  const normalizedRequestedWorkflowScope =
    requestedWorkflowScope != null
      ? normalizeOperationsAnalysisScope(requestedWorkflowScope)
      : null
  const effectiveWorkflowScope = normalizedRequestedWorkflowScope || normalizedAnalysisScope
  const clusterId = searchParams.get('cluster_id')
  const mode = normalizeReviewMode(searchParams.get('mode'))
  const subsetSource = normalizeOverviewSubsetSource(searchParams.get('subset_source'))
  const subsetValue = searchParams.get('subset_value')
  const requestedSemanticFamily = searchParams.get('semantic_family')
  const requestedSemanticSubtype = searchParams.get('semantic_subtype')
  const requestedSenderPage = normalizeOverviewPage(searchParams.get('sender_page'))
  const requestedDecisionSenderKey = searchParams.get('sender_key')
  const requestedDecisionOverlayIntent = normalizeDecisionOverlayIntent(
    searchParams.get('overlay_intent')
  )
  const decisionOverlayIntent: DecisionOverlayIntent | null =
    mode === 'decision' ? requestedDecisionOverlayIntent || 'guided' : null
  const legacyStage = searchParams.get('stage')
  const lastRenderableRuntimeDataRef = useRef(runtime.data ?? null)
  useEffect(() => {
    if (!runtime.data) return
    lastRenderableRuntimeDataRef.current = runtime.data
  }, [runtime.data])
  const renderRuntimeData = runtime.data || lastRenderableRuntimeDataRef.current
  const cacheVersion = renderRuntimeData?.runtime_cleanup_plan?.generated_at || null
  const runtimeClusters = useMemo<GmailCleanupClusterRef[]>(
    () =>
      (renderRuntimeData?.runtime_cleanup_plan?.clusters || []).map((cluster) => ({
        clusterId: cluster.cluster_id,
        canonicalClusterId: cluster.canonical_cluster_id,
        legacyClusterIds: cluster.legacy_cluster_ids || [],
        sourceClusterIds: Array.isArray(
          (cluster as unknown as { source_cluster_ids?: unknown }).source_cluster_ids
        )
          ? (
              (cluster as unknown as { source_cluster_ids: unknown[] }).source_cluster_ids.filter(
                (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
              ) as string[]
            )
          : [],
        clusterType: cluster.cluster_type,
        title: cleanupGroupDisplayTitle({
          clusterId: cluster.cluster_id,
          canonicalClusterId: cluster.canonical_cluster_id,
          title: cluster.title,
        }) || cluster.title,
        query: cluster.query,
        whySelected: cluster.why_selected,
        riskNote: cluster.risk_note,
        safetyNote: cluster.safety_note,
        senderCount: cluster.sender_count,
        messageCount: cluster.message_count,
        estimatedCount: cluster.estimated_count,
        surfaceTier: cluster.surface_tier || null,
        surfaceKind: cluster.surface_kind || null,
        surfaceVisibility: cluster.surface_visibility || null,
        topLevelRank: cluster.top_level_rank ?? null,
      })),
    [renderRuntimeData?.runtime_cleanup_plan?.clusters]
  )
  const runtimeMailboxIntelligenceClusters = useMemo<GmailCleanupClusterRef[]>(
    () =>
      (renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups || []).map((cluster) => ({
        clusterId: cluster.cluster_id,
        canonicalClusterId: cluster.canonical_cluster_id,
        legacyClusterIds: cluster.legacy_cluster_ids || [],
        sourceClusterIds: cluster.source_cluster_ids || [],
        clusterType: cluster.cluster_type,
        title: cleanupGroupDisplayTitle({
          clusterId: cluster.cluster_id,
          canonicalClusterId: cluster.canonical_cluster_id,
          title: cluster.title,
        }) || cluster.title,
        query: cluster.query,
        whySelected: cluster.why_selected,
        riskNote: cluster.risk_note,
        safetyNote: cluster.safety_note,
        senderCount: cluster.sender_count,
        messageCount: cluster.message_count,
        estimatedCount: cluster.message_count,
        surfaceTier: cluster.surface_tier || null,
        surfaceKind: cluster.surface_kind || null,
        surfaceVisibility: cluster.surface_visibility || null,
        topLevelRank: cluster.top_level_rank ?? null,
      })),
    [renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups]
  )
  const runtimeIdentityClusters = useMemo(() => {
    const merged = new Map<string, GmailCleanupClusterRef>()
    for (const cluster of [...runtimeClusters, ...runtimeMailboxIntelligenceClusters]) {
      const key = [
        cluster.canonicalClusterId || cluster.clusterId,
        ...uniqueNonEmptyStrings(cluster.legacyClusterIds || []),
      ].join('::')
      if (!merged.has(key)) merged.set(key, cluster)
    }
    return Array.from(merged.values())
  }, [runtimeClusters, runtimeMailboxIntelligenceClusters])
  const rawRequestedClusterId =
    typeof clusterId === 'string' && clusterId.trim().length > 0 ? clusterId.trim() : null
  const retiredClusterRedirect = useMemo(
    () => getRetiredCleanupGroupRedirect(rawRequestedClusterId),
    [rawRequestedClusterId]
  )
  const requestedClusterIdentity = useMemo(
    () =>
      rawRequestedClusterId
        ? resolveCleanupClusterIdentity(
            rawRequestedClusterId,
            runtimeIdentityClusters.map((cluster) => ({
              clusterId: cluster.clusterId,
              canonicalClusterId: cluster.canonicalClusterId || cluster.clusterId,
              legacyClusterIds: cluster.legacyClusterIds || [],
              sourceClusterIds: cluster.sourceClusterIds || [],
            }))
          )
        : null,
    [rawRequestedClusterId, runtimeIdentityClusters]
  )
  const resolvedRequestedClusterId =
    requestedClusterIdentity?.canonicalClusterId || rawRequestedClusterId
  const requestedCluster = useMemo(
    () => {
      if (!rawRequestedClusterId) return null
      const runtimeCluster =
        runtimeClusters.find((cluster) => cluster.clusterId === resolvedRequestedClusterId) || null
      if (runtimeCluster) {
        return runtimeCluster.clusterId === rawRequestedClusterId
          ? runtimeCluster
          : buildRequestedClusterRef({
              requestedClusterId: rawRequestedClusterId,
              cluster: runtimeCluster,
            })
      }

      const mailboxIntelligenceCluster =
        runtimeMailboxIntelligenceClusters.find(
          (cluster) =>
            (cluster.canonicalClusterId || cluster.clusterId) === resolvedRequestedClusterId ||
            cluster.clusterId === resolvedRequestedClusterId
        ) || null
      if (!mailboxIntelligenceCluster) return null
      return mailboxIntelligenceCluster.clusterId === rawRequestedClusterId
        ? mailboxIntelligenceCluster
        : buildRequestedClusterRef({
            requestedClusterId: rawRequestedClusterId,
            cluster: mailboxIntelligenceCluster,
          })
    },
    [
      rawRequestedClusterId,
      resolvedRequestedClusterId,
      runtimeClusters,
      runtimeMailboxIntelligenceClusters,
    ]
  )
  const requestedClusterId = requestedCluster?.clusterId || rawRequestedClusterId
  const rememberedRequestedClustersRef = useRef<Map<string, Pick<GmailCleanupClusterRef, 'clusterId' | 'title'>>>(
    new Map()
  )
  useEffect(() => {
    if (!rawRequestedClusterId || !requestedCluster) return
    rememberedRequestedClustersRef.current.set(rawRequestedClusterId, {
      clusterId: requestedCluster.clusterId,
      title: requestedCluster.title,
    })
  }, [rawRequestedClusterId, requestedCluster])
  const missingScopedCluster = Boolean(
    rawRequestedClusterId &&
      !runtime.loading &&
      renderRuntimeData?.runtime_cleanup_plan &&
      !requestedCluster
  )
  const selectedCluster = useMemo(() => {
    if (requestedCluster) return requestedCluster
    if (rawRequestedClusterId) return null

    const runtimeSenderOverview = renderRuntimeData?.runtime_sender_overview || {}
    const firstPopulatedCluster =
      runtimeClusters.find((cluster) => {
        const runtimeWorkspace = runtimeSenderOverview[cluster.clusterId]
        return workspaceClusterSenderTotal(runtimeWorkspace, cluster.senderCount) > 0
      }) || null

    return firstPopulatedCluster || runtimeClusters[0] || null
  }, [rawRequestedClusterId, renderRuntimeData?.runtime_sender_overview, requestedCluster, runtimeClusters])
  const selectedMailboxIntelligenceGroup = useMemo(() => {
    if (!selectedCluster) return null
    const lookupIds = new Set([
      selectedCluster.clusterId,
      selectedCluster.canonicalClusterId || selectedCluster.clusterId,
      ...(selectedCluster.legacyClusterIds || []),
      ...(selectedCluster.sourceClusterIds || []),
    ])
    return (
      renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups.find((group) => {
        if (lookupIds.has(group.cluster_id) || lookupIds.has(group.canonical_cluster_id)) {
          return true
        }
        return (group.legacy_cluster_ids || []).some((legacyId) => lookupIds.has(legacyId))
      }) || null
    )
  }, [renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups, selectedCluster])
  const selectedCanonicalClusterId = useMemo(() => {
    const clusterIdentity =
      selectedCluster?.canonicalClusterId ||
      selectedCluster?.clusterId ||
      requestedClusterId ||
      rawRequestedClusterId
    return clusterIdentity ? getCleanupGroupCanonicalClusterId(clusterIdentity) : null
  }, [
    rawRequestedClusterId,
    requestedClusterId,
    selectedCluster?.canonicalClusterId,
    selectedCluster?.clusterId,
  ])
  const isMarketingCleanupGroup = selectedCanonicalClusterId === MARKETING_PARENT_CANONICAL_ID
  const selectedWorkflowTarget = useMemo(
    () =>
      selectedCluster
        ? normalizeGmailCleanupWorkflowTarget({
            clusterId: selectedCluster.clusterId,
            canonicalClusterId: selectedCluster.canonicalClusterId || selectedCluster.clusterId,
            legacyClusterIds: selectedCluster.legacyClusterIds,
            sourceClusterIds: selectedCluster.sourceClusterIds,
            clusterType: selectedCluster.clusterType,
            title: selectedCluster.title,
            query: selectedCluster.query,
            requestedClusterId: rawRequestedClusterId || selectedCluster.clusterId,
            subsetSource,
            subsetValue,
          })
        : null,
    [rawRequestedClusterId, selectedCluster, subsetSource, subsetValue]
  )
  const workflowScopedRailEntry = useMemo(() => {
    if (!selectedCluster || effectiveWorkflowScope === normalizedAnalysisScope) return null
    const selectedClusterRailFamily = renderRuntimeData?.runtime_selected_cluster_rail_family || null
    if (!selectedClusterRailFamily || selectedClusterRailFamily.cluster_id !== selectedCluster.clusterId) {
      return null
    }
    const matchingEntry =
      selectedClusterRailFamily.scopes.find(
        (entry) => entry.scope === effectiveWorkflowScope && entry.state === 'ready'
      ) || null
    return matchingEntry?.signal ? matchingEntry : null
  }, [
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    renderRuntimeData?.runtime_selected_cluster_rail_family,
    selectedCluster,
  ])
  const effectiveWorkflowSelectedCluster = useMemo(() => {
    if (!selectedCluster) return null
    if (!workflowScopedRailEntry?.signal) return selectedCluster

    const scopedMessageCount = Math.max(workflowScopedRailEntry.signal.message_count || 0, 0)
    const scopedSenderCount = workflowScopedRailEntry.signal.semantic_resolution_distribution
      .filter((entry) => entry.scope === 'family')
      .reduce((sum, entry) => sum + Math.max(entry.sender_count || 0, 0), 0)

    return {
      ...selectedCluster,
      senderCount: scopedSenderCount > 0 ? scopedSenderCount : selectedCluster.senderCount,
      messageCount: scopedMessageCount > 0 ? scopedMessageCount : selectedCluster.messageCount,
      estimatedCount: scopedMessageCount > 0 ? scopedMessageCount : selectedCluster.estimatedCount,
    }
  }, [selectedCluster, workflowScopedRailEntry])
  const railScopeResetKey = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('workflow_scope')
    return next.toString()
  }, [searchParams])
  const [activeRailScope, setActiveRailScope] =
    useState<OperationsAnalysisScope>(effectiveWorkflowScope)
  const activeRailScopeBaselineKey = useMemo(
    () =>
      [
        agentId,
        sessionId || 'no-session',
        selectedCluster?.clusterId || requestedClusterId || rawRequestedClusterId || 'no-cluster',
        normalizedAnalysisScope,
        mode,
        railScopeResetKey,
      ].join('::'),
    [
      agentId,
      mode,
      normalizedAnalysisScope,
      railScopeResetKey,
      rawRequestedClusterId,
      requestedClusterId,
      selectedCluster?.clusterId,
      sessionId,
    ]
  )
  useEffect(() => {
    setActiveRailScope(effectiveWorkflowScope)
  }, [activeRailScopeBaselineKey, effectiveWorkflowScope])
  const detachedWorkflowScope =
    effectiveWorkflowScope !== normalizedAnalysisScope ? effectiveWorkflowScope : null
  const workflowScopeForOverviewContext = useCallback(
    (params: {
      subsetSource: OverviewSubsetSource | null
      subsetValue: string | null
      semanticFocus: SemanticSubtypeFocus | null
    }) => {
      if (!detachedWorkflowScope) return null
      if (params.subsetSource && params.subsetValue) {
        return isFocusedSenderSubsetSource(params.subsetSource) ? detachedWorkflowScope : null
      }
      if (params.semanticFocus) return null
      return detachedWorkflowScope
    },
    [detachedWorkflowScope]
  )
  const reviewScopeTransitionSnapshotKey = useMemo(
    () =>
      buildReviewScopeTransitionSnapshotKey({
        agentId,
        sessionId,
        clusterId: requestedClusterId || selectedCluster?.clusterId || null,
      }),
    [agentId, requestedClusterId, selectedCluster?.clusterId, sessionId]
  )
  const reviewScopeTransitionSnapshot = useMemo(() => {
    if (!reviewScopeTransitionSnapshotKey) return null
    const entry = reviewScopeTransitionSnapshots.get(reviewScopeTransitionSnapshotKey)
    if (!entry) return null
    if (Date.now() - entry.capturedAt > REVIEW_SCOPE_TRANSITION_SNAPSHOT_TTL_MS) {
      reviewScopeTransitionSnapshots.delete(reviewScopeTransitionSnapshotKey)
      return null
    }
    return entry.snapshot
  }, [reviewScopeTransitionSnapshotKey])
  const missingScopedClusterName = useMemo(() => {
    if (!rawRequestedClusterId) return null
    const transitionTitle = reviewScopeTransitionSnapshot?.data.selected_cluster.title
    if (typeof transitionTitle === 'string' && transitionTitle.trim()) {
      return cleanupGroupDisplayTitle({
        clusterId:
          reviewScopeTransitionSnapshot?.data.selected_cluster.canonical_cluster_id ||
          reviewScopeTransitionSnapshot?.data.selected_cluster.cluster_id ||
          rawRequestedClusterId,
        title: transitionTitle,
      })
    }
    const remembered = rememberedRequestedClustersRef.current.get(rawRequestedClusterId)
    if (remembered?.title) {
      return cleanupGroupDisplayTitle({
        clusterId: remembered.clusterId || rawRequestedClusterId,
        title: remembered.title,
      })
    }
    return cleanupGroupDisplayTitle({ clusterId: rawRequestedClusterId }) || humanizeCleanupGroupId(rawRequestedClusterId)
  }, [
    rawRequestedClusterId,
    reviewScopeTransitionSnapshot?.data.selected_cluster.canonical_cluster_id,
    reviewScopeTransitionSnapshot?.data.selected_cluster.cluster_id,
    reviewScopeTransitionSnapshot?.data.selected_cluster.title,
  ])
  const decisionInspectEntryStorageKey = useMemo(
    () =>
      buildDecisionWorkflowStorageKey({
        kind: 'inspect-entry',
        agentId,
        sessionId,
        analysisScope,
        clusterId: selectedCluster?.clusterId || requestedClusterId,
      }),
    [agentId, analysisScope, requestedClusterId, selectedCluster?.clusterId, sessionId]
  )
  const overviewReturnContextStorageKey = useMemo(
    () =>
      buildDecisionWorkflowStorageKey({
        kind: 'overview-return',
        agentId,
        sessionId,
        analysisScope,
        clusterId: selectedCluster?.clusterId || requestedClusterId,
      }),
    [agentId, analysisScope, requestedClusterId, selectedCluster?.clusterId, sessionId]
  )
  const [decisionInspectEntryContext, setDecisionInspectEntryContext] =
    useState<DecisionInspectEntryContext | null>(null)
  const decisionInspectRequestedSenderKey =
    mode === 'decision' && decisionOverlayIntent === 'inspect' ? requestedDecisionSenderKey : null
  const decisionPreviewEvidenceSenderKey =
    mode === 'decision'
      ? requestedDecisionSenderKey ||
        (decisionOverlayIntent === 'inspect' ? decisionInspectEntryContext?.senderKey || null : null)
      : null
  const isDefaultOverviewContext = isDefaultOverviewRequestContext({
    mode,
    subsetSource,
    subsetValue,
    senderPage: requestedSenderPage,
  })
  const cachedWorkspace = useMemo(() => {
    if (!selectedCluster) return null
    return readCachedGmailSenderWorkspace({
      selectedCluster,
      allClusters: runtimeClusters,
      analysisScope,
      cacheVersion,
      includeClusterSenderKeys: true,
      page: mode === 'overview' ? requestedSenderPage : 1,
      pageSize:
        mode === 'decision'
          ? DECISION_QUEUE_WORKSPACE_PAGE_SIZE
          : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
    })
  }, [
    analysisScope,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    mode,
    requestedSenderPage,
    runtimeClusters,
    selectedCluster,
  ])
  const cachedWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !cachedWorkspace) return null
    return buildWorkspaceSnapshot({
      data: cachedWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: normalizedAnalysisScope,
      mode,
      source: 'cache',
      cacheVersion,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
    })
  }, [
    cacheVersion,
    cachedWorkspace,
    decisionPreviewEvidenceSenderKey,
    mode,
    normalizedAnalysisScope,
    selectedCluster,
  ])
  const cachedDecisionWorkspace = useMemo(() => {
    if (!selectedCluster || mode !== 'overview') return null
    return readCachedGmailSenderWorkspace({
      selectedCluster,
      allClusters: runtimeClusters,
      analysisScope,
      cacheVersion,
      includeClusterSenderKeys: true,
      page: 1,
      pageSize: DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
    })
  }, [analysisScope, cacheVersion, mode, runtimeClusters, selectedCluster])
  const cachedDecisionWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !cachedDecisionWorkspace) return null
    return buildWorkspaceSnapshot({
      data: cachedDecisionWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: normalizedAnalysisScope,
      mode: 'decision',
      source: 'cache',
      cacheVersion,
    })
  }, [cacheVersion, cachedDecisionWorkspace, normalizedAnalysisScope, selectedCluster])
  const workflowCachedWorkspace = useMemo(() => {
    if (!selectedCluster) return null
    return readCachedGmailSenderWorkspace({
      selectedCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
      includeClusterSenderKeys: true,
      page: mode === 'overview' ? requestedSenderPage : 1,
      pageSize:
        mode === 'decision'
          ? DECISION_QUEUE_WORKSPACE_PAGE_SIZE
          : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
    })
  }, [
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    runtimeClusters,
    selectedCluster,
  ])
  const workflowCachedWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !workflowCachedWorkspace) return null
    return buildWorkspaceSnapshot({
      data: workflowCachedWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      source: 'cache',
      cacheVersion,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
    })
  }, [
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    mode,
    selectedCluster,
    workflowCachedWorkspace,
  ])
  const workflowCachedDecisionWorkspace = useMemo(() => {
    if (!selectedCluster || mode !== 'overview') return null
    return readCachedGmailSenderWorkspace({
      selectedCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
      includeClusterSenderKeys: true,
      page: 1,
      pageSize: DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
    })
  }, [cacheVersion, effectiveWorkflowScope, mode, runtimeClusters, selectedCluster])
  const workflowCachedDecisionWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !workflowCachedDecisionWorkspace) return null
    return buildWorkspaceSnapshot({
      data: workflowCachedDecisionWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode: 'decision',
      source: 'cache',
      cacheVersion,
    })
  }, [
    cacheVersion,
    effectiveWorkflowScope,
    selectedCluster,
    workflowCachedDecisionWorkspace,
  ])
  const workflowCachedReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !workflowCachedWorkspaceSnapshot) return null
    return workspaceSnapshotSatisfiesCurrentMode({
      snapshot: workflowCachedWorkspaceSnapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
      page: mode === 'overview' ? requestedSenderPage : DEFAULT_OVERVIEW_WORKSPACE_PAGE,
    })
      ? workflowCachedWorkspaceSnapshot
      : null
  }, [
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    selectedCluster,
    workflowCachedWorkspaceSnapshot,
  ])
  const trustedRuntimeOverviewWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !isDefaultOverviewContext) return null
    const runtimeWorkspace = renderRuntimeData?.runtime_sender_overview?.[selectedCluster.clusterId]
    const freshnessStatus = renderRuntimeData?.runtime_mailbox_profile?.freshness?.status
    if (!runtimeWorkspace) return null
    if (freshnessStatus !== 'fresh' && freshnessStatus !== 'cached') return null
    if (runtimeWorkspace.analysis_scope !== normalizedAnalysisScope) return null
    if (runtimeWorkspace.source !== 'gmail_index_cache') return null
    if (!workspaceDataMatchesOverviewView(runtimeWorkspace, requestedSenderPage)) return null
    if (runtimeWorkspace.selected_cluster.cluster_id !== selectedCluster.clusterId) return null
    return buildWorkspaceSnapshot({
      data: runtimeWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: normalizedAnalysisScope,
      mode: 'overview',
      source: 'runtime',
      cacheVersion,
    })
  }, [
    cacheVersion,
    isDefaultOverviewContext,
    normalizedAnalysisScope,
    requestedSenderPage,
    renderRuntimeData?.runtime_mailbox_profile?.freshness?.status,
    renderRuntimeData?.runtime_sender_overview,
    selectedCluster,
  ])
  const trustedRuntimeOverviewStructureSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    const runtimeWorkspace = renderRuntimeData?.runtime_sender_overview?.[selectedCluster.clusterId]
    const freshnessStatus = renderRuntimeData?.runtime_mailbox_profile?.freshness?.status
    if (!runtimeWorkspace) return null
    if (freshnessStatus !== 'fresh' && freshnessStatus !== 'cached') return null
    if (runtimeWorkspace.analysis_scope !== normalizedAnalysisScope) return null
    if (runtimeWorkspace.source !== 'gmail_index_cache') return null
    if (!workspaceDataMatchesOverviewStructureView(runtimeWorkspace)) return null
    if (runtimeWorkspace.selected_cluster.cluster_id !== selectedCluster.clusterId) return null
    return buildWorkspaceSnapshot({
      data: runtimeWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: normalizedAnalysisScope,
      mode: 'overview',
      source: 'runtime',
      cacheVersion,
    })
  }, [
    cacheVersion,
    normalizedAnalysisScope,
    renderRuntimeData?.runtime_mailbox_profile?.freshness?.status,
    renderRuntimeData?.runtime_sender_overview,
    selectedCluster,
  ])
  const initialPassiveReadyWorkspaceSnapshot = useMemo(
    () =>
      mode === 'decision'
        ? workflowCachedReadyWorkspaceSnapshot || null
        : workflowCachedReadyWorkspaceSnapshot ||
            (effectiveWorkflowScope === normalizedAnalysisScope
              ? trustedRuntimeOverviewWorkspaceSnapshot
              : null) ||
            null,
    [
      effectiveWorkflowScope,
      mode,
      normalizedAnalysisScope,
      trustedRuntimeOverviewWorkspaceSnapshot,
      workflowCachedReadyWorkspaceSnapshot,
    ]
  )
  const initialPassiveSeedWorkspaceSnapshot = useMemo(
    () =>
      mode === 'overview'
        ? workflowCachedWorkspaceSnapshot ||
            (effectiveWorkflowScope === normalizedAnalysisScope
              ? trustedRuntimeOverviewWorkspaceSnapshot
              : null) ||
            null
        : null,
    [
      effectiveWorkflowScope,
      mode,
      normalizedAnalysisScope,
      trustedRuntimeOverviewWorkspaceSnapshot,
      workflowCachedWorkspaceSnapshot,
    ]
  )
  const initialOverviewWorkspaceSnapshot = useMemo(() => {
    if (initialPassiveReadyWorkspaceSnapshot?.mode === 'overview') {
      return initialPassiveReadyWorkspaceSnapshot
    }
    if (initialPassiveSeedWorkspaceSnapshot?.mode === 'overview') {
      return initialPassiveSeedWorkspaceSnapshot
    }
    return cachedWorkspaceSnapshot || trustedRuntimeOverviewWorkspaceSnapshot || null
  }, [
    cachedWorkspaceSnapshot,
    initialPassiveReadyWorkspaceSnapshot,
    initialPassiveSeedWorkspaceSnapshot,
    trustedRuntimeOverviewWorkspaceSnapshot,
  ])

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() =>
    initialPassiveReadyWorkspaceSnapshot
      ? {
          status: 'ready',
          snapshot: initialPassiveReadyWorkspaceSnapshot,
          error: null,
        }
      : initialPassiveSeedWorkspaceSnapshot
        ? {
            status: 'loading',
            snapshot: initialPassiveSeedWorkspaceSnapshot,
            error: null,
        }
      : { status: 'idle', snapshot: null, error: null }
  )
  const [persistedOverviewWorkspaceSnapshot, setPersistedOverviewWorkspaceSnapshot] =
    useState<WorkspaceSnapshot | null>(() => initialOverviewWorkspaceSnapshot)
  const [defaultOverviewRuntimeGate, setDefaultOverviewRuntimeGate] =
    useState<DefaultOverviewRuntimeGateState>(IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE)
  const [managedBySender, setManagedBySender] = useState<Record<string, ManagedSenderState>>({})
  const [managementError, setManagementError] = useState<string | null>(null)
  const [submittingSenderKey, setSubmittingSenderKey] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [drilldownSort, setDrilldownSort] = useState<DrilldownSort>('impact')
  const [activeSemanticSubtypeFocus, setActiveSemanticSubtypeFocus] =
    useState<SemanticSubtypeFocus | null>(null)
  const [expandedSenderKey, setExpandedSenderKey] = useState<string | null>(null)
  const [visibleEvidenceBySender, setVisibleEvidenceBySender] = useState<Record<string, number>>({})
  const [snippetOverridesBySender, setSnippetOverridesBySender] =
    useState<SenderSnippetOverrides>({})
  const [snippetHydrationStateBySender, setSnippetHydrationStateBySender] = useState<
    Record<string, SenderSnippetHydrationState>
  >({})
  const [messagePreviewState, setMessagePreviewState] = useState<EvidenceMessagePreviewState>({
    selection: null,
    status: 'idle',
    data: null,
    error: null,
  })
  const decisionOverlayOpen = mode === 'decision' && !missingScopedCluster
  const decisionOverlayScrollTopRef = useRef<number | null>(null)
  const decisionOverlayPreviouslyOpenRef = useRef<boolean>(decisionOverlayOpen)
  const activeSemanticSubtypeFocusRef = useRef<SemanticSubtypeFocus | null>(null)
  const senderWorkflowSectionRef = useRef<HTMLElement | null>(null)
  const senderWorkflowPendingScrollRef = useRef<boolean>(false)
  const semanticFocusRefocusPendingRef = useRef<boolean>(false)
  const previousOverviewPageRef = useRef<number>(requestedSenderPage)
  const setWorkspaceStateIfChanged = useCallback((next: WorkspaceStateTransition) => {
    setWorkspaceState((current) => {
      const candidate = typeof next === 'function' ? next(current) : next
      return workspaceStatesEqual(current, candidate) ? current : candidate
    })
  }, [])
  useEffect(() => {
    if (mode !== 'decision' || decisionOverlayIntent !== 'inspect') {
      setDecisionInspectEntryContext(null)
      if (!decisionOverlayOpen) {
        writeDecisionWorkflowStorage(decisionInspectEntryStorageKey, null)
      }
      return
    }

    const storedContext = readDecisionWorkflowStorage<DecisionInspectEntryContext>(
      decisionInspectEntryStorageKey
    )
    if (!storedContext) return
    if (
      requestedDecisionSenderKey &&
      storedContext.senderKey !== requestedDecisionSenderKey
    ) {
      return
    }

    setDecisionInspectEntryContext((current) => {
      if (current?.senderKey === storedContext.senderKey && current.sender === storedContext.sender) {
        return current
      }
      return {
        senderKey: storedContext.senderKey,
        sender: normalizeWorkspaceSenderContract(storedContext.sender),
      }
    })
  }, [
    decisionInspectEntryStorageKey,
    decisionOverlayIntent,
    decisionOverlayOpen,
    mode,
    requestedDecisionSenderKey,
  ])
  const currentMatchingWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    return workspaceSnapshotMatchesRequest({
      snapshot: workspaceState.snapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
    })
      ? workspaceState.snapshot
      : null
  }, [cacheVersion, effectiveWorkflowScope, mode, selectedCluster, workspaceState.snapshot])
  const currentReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    return workspaceSnapshotSatisfiesCurrentMode({
      snapshot: workspaceState.snapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
      page: mode === 'overview' ? requestedSenderPage : DEFAULT_OVERVIEW_WORKSPACE_PAGE,
    })
      ? workspaceState.snapshot
      : null
  }, [
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    selectedCluster,
    workspaceState.snapshot,
  ])
  useEffect(() => {
    const nextOverviewSnapshot =
      (workspaceState.snapshot?.mode === 'overview' &&
      workspaceState.snapshot.analysisScope === normalizedAnalysisScope
        ? workspaceState.snapshot
        : null) ||
      cachedWorkspaceSnapshot ||
      trustedRuntimeOverviewWorkspaceSnapshot ||
      null

    if (!nextOverviewSnapshot) return
    setPersistedOverviewWorkspaceSnapshot((current) =>
      workspaceSnapshotsMateriallyEqual(current, nextOverviewSnapshot) ? current : nextOverviewSnapshot
    )
  }, [
    cachedWorkspaceSnapshot,
    normalizedAnalysisScope,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const continuityOverviewWorkspaceSnapshot = useMemo(() => {
    if (!requestedClusterId) return null
    const candidateSnapshots = [
      workspaceState.snapshot?.mode === 'overview' &&
      workspaceState.snapshot.analysisScope === normalizedAnalysisScope
        ? workspaceState.snapshot
        : null,
      persistedOverviewWorkspaceSnapshot,
      reviewScopeTransitionSnapshot,
    ]

    return (
      candidateSnapshots.find(
        (snapshot) => snapshot?.mode === 'overview' && snapshot.clusterId === requestedClusterId
      ) || null
    )
  }, [
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedClusterId,
    reviewScopeTransitionSnapshot,
    workspaceState.snapshot,
  ])
  const scopedOverviewShellWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    const candidateSnapshots = [
      workspaceState.snapshot?.mode === 'overview' &&
      workspaceState.snapshot.analysisScope === normalizedAnalysisScope
        ? workspaceState.snapshot
        : null,
      persistedOverviewWorkspaceSnapshot,
      cachedWorkspaceSnapshot,
      trustedRuntimeOverviewStructureSnapshot,
      trustedRuntimeOverviewWorkspaceSnapshot,
    ]

    return (
      candidateSnapshots.find((snapshot) =>
        workspaceSnapshotMatchesOverviewShellTruth({
          snapshot,
          clusterId: selectedCluster.clusterId,
          analysisScope: normalizedAnalysisScope,
          cacheVersion,
        })
      ) || null
    )
  }, [
    cacheVersion,
    cachedWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    selectedCluster,
    trustedRuntimeOverviewStructureSnapshot,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const shouldHoldContinuityShell = Boolean(
    continuityOverviewWorkspaceSnapshot &&
      requestedClusterId &&
      (missingScopedCluster ||
    runtime.loading ||
        !selectedCluster ||
        !scopedOverviewShellWorkspaceSnapshot)
  )
  useEffect(() => {
    if (mode !== 'overview' || !selectedCluster) return
    if (effectiveWorkflowScope === normalizedAnalysisScope) return
    if (scopedOverviewShellWorkspaceSnapshot) return

    let cancelled = false
    const controller = new AbortController()

    void (async () => {
      let attempt = 0
      while (!cancelled) {
        const result = await fetchGmailSenderWorkspace({
          selectedCluster,
          allClusters: runtimeClusters,
          analysisScope: normalizedAnalysisScope,
          cacheVersion,
          includeClusterSenderKeys: true,
          page: requestedSenderPage,
          pageSize: DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE,
          requestContext: {
            source: 'operations_review_page',
            component: 'sender_overview',
            reason: 'sender_overview_page_scope_backfill',
            phase: 'deferred',
            agentId,
          },
        })
        if (cancelled || ('aborted' in result && result.aborted)) return
        if (!result.ok) {
          if (attempt < 5 && isTransientInboxAnalysisGuardError(result.error)) {
            attempt += 1
            await delayMs(1200)
            continue
          }
          return
        }

        const nextSnapshot = buildWorkspaceSnapshot({
          data: result.data,
          clusterId: selectedCluster.clusterId,
          analysisScope: normalizedAnalysisScope,
          mode: 'overview',
          source: 'network',
          cacheVersion,
        })
        setPersistedOverviewWorkspaceSnapshot((current) =>
          workspaceSnapshotsMateriallyEqual(current, nextSnapshot) ? current : nextSnapshot
        )
        return
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    agentId,
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    requestedSenderPage,
    runtimeClusters,
    scopedOverviewShellWorkspaceSnapshot,
    selectedCluster,
  ])
  const passiveReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    return mode === 'decision'
      ? currentReadyWorkspaceSnapshot || workflowCachedReadyWorkspaceSnapshot || null
      : currentReadyWorkspaceSnapshot ||
          workflowCachedReadyWorkspaceSnapshot ||
          (effectiveWorkflowScope === normalizedAnalysisScope
            ? trustedRuntimeOverviewWorkspaceSnapshot
            : null) ||
          null
  }, [
    currentReadyWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    selectedCluster,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedReadyWorkspaceSnapshot,
  ])
  const passiveWorkspaceSeedSnapshot = useMemo(() => {
    if (mode !== 'overview') return null
    return (
      currentMatchingWorkspaceSnapshot ||
      workflowCachedWorkspaceSnapshot ||
      (effectiveWorkflowScope === normalizedAnalysisScope
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null) ||
      null
    )
  }, [
    currentMatchingWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const workspaceRequestKey = useMemo(() => {
    if (!effectiveWorkflowSelectedCluster) return null
    return buildWorkspaceRequestKey({
      clusterId: effectiveWorkflowSelectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
    })
  }, [
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    effectiveWorkflowSelectedCluster,
    mode,
  ])
  const shouldDeferLiveFetchForDefaultOverview =
    mode === 'overview' &&
    effectiveWorkflowScope === normalizedAnalysisScope &&
    isDefaultOverviewContext &&
    defaultOverviewRuntimeGate.clusterId === selectedCluster?.clusterId &&
    defaultOverviewRuntimeGate.status === 'waiting'
  const shouldFetchOverviewCoverageBackfill = useMemo(() => {
    if (!selectedCluster || mode !== 'overview') return false
    const snapshotsToCheck = [
      currentMatchingWorkspaceSnapshot,
      workflowCachedWorkspaceSnapshot,
      workflowCachedDecisionWorkspaceSnapshot,
      effectiveWorkflowScope === normalizedAnalysisScope ? trustedRuntimeOverviewWorkspaceSnapshot : null,
    ]

    const hasCoverageTruth = snapshotsToCheck.some((snapshot) =>
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
      })
    )

    if (hasCoverageTruth) return false
    return Boolean(passiveReadyWorkspaceSnapshot || passiveWorkspaceSeedSnapshot)
  }, [
    cacheVersion,
    currentMatchingWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    selectedCluster,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedDecisionWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const decisionQueueCoverageSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    const snapshotsToCheck = [
      workspaceState.snapshot,
      workflowCachedWorkspaceSnapshot,
      workflowCachedDecisionWorkspaceSnapshot,
      effectiveWorkflowScope === normalizedAnalysisScope ? persistedOverviewWorkspaceSnapshot : null,
      effectiveWorkflowScope === normalizedAnalysisScope ? trustedRuntimeOverviewWorkspaceSnapshot : null,
    ]

    return (
      snapshotsToCheck.find((snapshot) =>
        workspaceSnapshotMatchesClusterCoverageContext({
          snapshot,
          clusterId: selectedCluster.clusterId,
          analysisScope: effectiveWorkflowScope,
        })
      ) || null
    )
  }, [
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    selectedCluster,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
    workflowCachedDecisionWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const decisionQueueSenderKeys = useMemo(
    () => workspaceClusterGlobalSenderKeys(decisionQueueCoverageSnapshot?.data || null),
    [decisionQueueCoverageSnapshot?.data]
  )
  const decisionRequestedQueueSenderKey = useMemo(() => {
    if (mode !== 'decision' || subsetSource || subsetValue) return null
    if (
      requestedDecisionSenderKey &&
      decisionQueueSenderKeys.includes(requestedDecisionSenderKey)
    ) {
      return requestedDecisionSenderKey
    }
    return decisionQueueSenderKeys.find((senderKey) => !managedBySender[senderKey]) || null
  }, [
    decisionQueueSenderKeys,
    managedBySender,
    mode,
    requestedDecisionSenderKey,
    subsetSource,
    subsetValue,
  ])
  const decisionFallbackPageWorkspace = useMemo(
    () =>
      normalizeWorkspaceDataContract(
        currentMatchingWorkspaceSnapshot?.data ||
          passiveReadyWorkspaceSnapshot?.data ||
          (effectiveWorkflowScope === normalizedAnalysisScope
            ? persistedOverviewWorkspaceSnapshot?.data ||
              trustedRuntimeOverviewWorkspaceSnapshot?.data
            : null) ||
          null
      ),
    [
      currentMatchingWorkspaceSnapshot?.data,
      effectiveWorkflowScope,
      normalizedAnalysisScope,
      passiveReadyWorkspaceSnapshot?.data,
      persistedOverviewWorkspaceSnapshot?.data,
      trustedRuntimeOverviewWorkspaceSnapshot?.data,
    ]
  )
  const decisionBootstrapTargetPage = useMemo(
    () =>
      resolveFallbackDecisionTargetPage({
        workspace: decisionFallbackPageWorkspace,
        requestedPage: requestedSenderPage,
        managedBySender,
        fallbackSenderCount: selectedCluster?.senderCount,
        defaultPageSize:
          mode === 'decision'
            ? DECISION_QUEUE_WORKSPACE_PAGE_SIZE
            : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE,
      }),
    [
      decisionFallbackPageWorkspace,
      managedBySender,
      mode,
      requestedSenderPage,
      selectedCluster?.senderCount,
    ]
  )
  const decisionTargetPage = useMemo(() => {
    if (!decisionRequestedQueueSenderKey) return decisionBootstrapTargetPage
    const senderIndex = decisionQueueSenderKeys.indexOf(decisionRequestedQueueSenderKey)
    return senderIndex >= 0
      ? Math.floor(senderIndex / DECISION_QUEUE_WORKSPACE_PAGE_SIZE) + 1
      : decisionBootstrapTargetPage
  }, [decisionBootstrapTargetPage, decisionQueueSenderKeys, decisionRequestedQueueSenderKey])
  const decisionReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || mode !== 'decision') return null
    const candidateSnapshots = [workspaceState.snapshot, workflowCachedWorkspaceSnapshot]
    return (
      candidateSnapshots.find((snapshot) =>
        workspaceSnapshotSatisfiesCurrentMode({
          snapshot,
          clusterId: selectedCluster.clusterId,
          analysisScope: effectiveWorkflowScope,
          mode: 'decision',
          cacheVersion,
          page: decisionTargetPage,
        })
      ) || null
    )
  }, [
    cacheVersion,
    decisionTargetPage,
    effectiveWorkflowScope,
    mode,
    selectedCluster,
    workspaceState.snapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const shouldFetchDecisionWorkspacePage = useMemo(() => {
    if (!selectedCluster || mode !== 'decision') return false
    const readyDecisionSnapshot = decisionReadyWorkspaceSnapshot || passiveReadyWorkspaceSnapshot
    if (!readyDecisionSnapshot) return true
    if (
      readyDecisionSnapshot.previewEvidenceSenderKey !== decisionPreviewEvidenceSenderKey
    ) {
      return true
    }
    if (readyDecisionSnapshot.data.pagination.page !== decisionTargetPage) return true
    if (!decisionRequestedQueueSenderKey) return false
    return (
      !workspaceSnapshotContainsSenderKey(
        readyDecisionSnapshot,
        decisionRequestedQueueSenderKey
      )
    )
  }, [
    decisionReadyWorkspaceSnapshot,
    decisionPreviewEvidenceSenderKey,
    decisionTargetPage,
    decisionRequestedQueueSenderKey,
    mode,
    passiveReadyWorkspaceSnapshot,
    selectedCluster,
  ])
  const marketingReviewUnitEntryUnits = useMemo(
    () =>
      selectedCluster && isMarketingCleanupGroup
        ? buildCleanupGroupPublishedReviewUnits(
            selectedCluster.clusterId,
            selectedMailboxIntelligenceGroup?.semantic_rollup || null
          )
        : [],
    [isMarketingCleanupGroup, selectedCluster, selectedMailboxIntelligenceGroup?.semantic_rollup]
  )
  const marketingReviewUnitEntryRequestedUnit = useMemo(
    () =>
      subsetSource === 'review_unit'
        ? findCleanupGroupPublishedReviewUnit(marketingReviewUnitEntryUnits, subsetValue?.trim())
        : null,
    [marketingReviewUnitEntryUnits, subsetSource, subsetValue]
  )
  const selectableMarketingReviewUnits = useMemo(
    () =>
      isMarketingCleanupGroup ? buildRenderablePublishedReviewUnits(marketingReviewUnitEntryUnits) : [],
    [isMarketingCleanupGroup, marketingReviewUnitEntryUnits]
  )
  const marketingReviewUnitEntryState = useMemo<MarketingReviewUnitEntryState | null>(() => {
    if (!isMarketingCleanupGroup) return null
    if (subsetSource === 'review_unit' && !hasRequestedReviewUnitValue(subsetValue)) {
      return 'missing_unit'
    }

    const marketingReviewUnitsResolved = Boolean(selectedCluster) && !runtime.loading
    if (!marketingReviewUnitsResolved) return null
    if (selectableMarketingReviewUnits.length === 0) return 'unavailable_units'
    if (subsetSource !== 'review_unit') return 'choose_unit'
    if (!marketingReviewUnitEntryRequestedUnit) return 'invalid_unit'
    if (marketingReviewUnitEntryRequestedUnit.targetState === 'oversized') return 'oversized_unit'
    return null
  }, [
    isMarketingCleanupGroup,
    marketingReviewUnitEntryRequestedUnit,
    runtime.loading,
    selectableMarketingReviewUnits.length,
    selectedCluster,
    subsetSource,
    subsetValue,
  ])
  const workspaceFetchPlan = useMemo<WorkspaceFetchPlan | null>(() => {
    if (marketingReviewUnitEntryState) return null
    if (!workspaceRequestKey || !effectiveWorkflowSelectedCluster || !selectedCluster) return null
    if (mode === 'overview') {
      if (!shouldFetchOverviewCoverageBackfill && passiveReadyWorkspaceSnapshot) return null
    } else if (!shouldFetchDecisionWorkspacePage) {
      return null
    }
    return {
      requestKey: workspaceRequestKey,
      selectedCluster: effectiveWorkflowSelectedCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      normalizedAnalysisScope: effectiveWorkflowScope,
      cacheVersion,
      mode,
      page: mode === 'decision' ? decisionTargetPage : requestedSenderPage,
      pageSize:
        mode === 'decision'
          ? DECISION_QUEUE_WORKSPACE_PAGE_SIZE
          : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE,
      requestPhase: mode === 'decision' ? 'interactive' : 'deferred',
      seedSnapshot:
        mode === 'decision'
          ? passiveReadyWorkspaceSnapshot || workflowCachedReadyWorkspaceSnapshot || null
          : passiveReadyWorkspaceSnapshot || passiveWorkspaceSeedSnapshot,
      previewEvidenceSenderKey: mode === 'decision' ? decisionPreviewEvidenceSenderKey : null,
    }
  }, [
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    decisionTargetPage,
    effectiveWorkflowScope,
    effectiveWorkflowSelectedCluster,
    marketingReviewUnitEntryState,
    shouldFetchOverviewCoverageBackfill,
    shouldFetchDecisionWorkspacePage,
    mode,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    requestedSenderPage,
    runtimeClusters,
    selectedCluster,
    workflowCachedReadyWorkspaceSnapshot,
    workspaceRequestKey,
  ])
  const workspaceFetchPlanToken = useMemo(() => {
    if (!workspaceFetchPlan?.requestKey) return null
    return [
      workspaceFetchPlan.requestKey,
      workspaceFetchPlan.requestPhase,
      workspaceFetchPlan.page,
      workspaceFetchPlan.seedSnapshot?.source || 'no-seed',
      workspaceFetchPlan.seedSnapshot?.data.selected_cluster.cluster_id || 'no-cluster',
      workspaceFetchPlan.seedSnapshot?.data.cluster_global.sender_keys_complete === true ? 'keys' : 'no-keys',
      workspaceFetchPlan.seedSnapshot?.data.pagination.page || 0,
      workspaceFetchPlan.seedSnapshot?.data.pagination.page_size || 0,
      workspaceFetchPlan.previewEvidenceSenderKey || 'no-preview-evidence-sender',
    ].join('::')
  }, [workspaceFetchPlan])
  const workspaceFetchPlanRef = useRef<WorkspaceFetchPlan | null>(workspaceFetchPlan)

  useEffect(() => {
    workspaceFetchPlanRef.current = workspaceFetchPlan
  }, [workspaceFetchPlan])

  useEffect(() => {
    if (!agentId) return
    let cancelled = false
    void fetchGmailDecisionManagementSummary({ agentId }).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setManagementError(result.error)
        return
      }
      setManagementError(null)
      setManagedBySender(
        result.data.sender_profiles.reduce<Record<string, ManagedSenderState>>((map, profile) => {
          map[profile.sender_key] = {
            destinationState: profile.destination_state,
            executionState: profile.execution_state,
            executionSource: profile.execution_source,
            lastActionTimestamp: profile.last_action_timestamp,
          }
          return map
        }, {})
      )
    })
    return () => {
      cancelled = true
    }
  }, [agentId])

  useEffect(() => {
    if (!retiredClusterRedirect) return
    startTransition(() => {
      router.replace(
        buildClustersHref({
          agentId,
          sessionId,
          analysisScope,
          retiredClusterId: retiredClusterRedirect.clusterId,
        }),
        { scroll: false }
      )
    })
  }, [agentId, analysisScope, retiredClusterRedirect, router, sessionId])

  useEffect(() => {
    if (!selectedCluster || rawRequestedClusterId === selectedCluster.clusterId) return
    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource,
            subsetValue,
            semanticFocus: activeSemanticSubtypeFocusRef.current,
          }),
          clusterId: selectedCluster.clusterId,
          mode,
          subsetSource,
          subsetValue,
          senderPage: requestedSenderPage,
          senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
          overlayIntent: decisionOverlayIntent,
        }),
        { scroll: false }
      )
    })
  }, [
    activeSemanticSubtypeFocus,
    agentId,
    analysisScope,
    decisionOverlayIntent,
    mode,
    requestedDecisionSenderKey,
    requestedSenderPage,
    rawRequestedClusterId,
    router,
    selectedCluster,
    sessionId,
    subsetSource,
    subsetValue,
    workflowScopeForOverviewContext,
  ])

  useEffect(() => {
    if (!legacyStage) return
    if (legacyStage === 'confirmation') {
      startTransition(() => {
        router.replace(
          buildManagementHref({
            agentId,
            sessionId,
            analysisScope,
          }),
          { scroll: false }
        )
      })
      return
    }
    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource,
            subsetValue,
            semanticFocus: activeSemanticSubtypeFocusRef.current,
          }),
          clusterId: selectedCluster?.clusterId || clusterId,
          mode,
          subsetSource,
          subsetValue,
          senderPage: requestedSenderPage,
          senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
          overlayIntent: decisionOverlayIntent,
        }),
        { scroll: false }
      )
    })
  }, [
    activeSemanticSubtypeFocus,
    agentId,
    analysisScope,
    clusterId,
    decisionOverlayIntent,
    legacyStage,
    mode,
    requestedSenderPage,
    requestedDecisionSenderKey,
    router,
    selectedCluster?.clusterId,
    sessionId,
    subsetSource,
    subsetValue,
    workflowScopeForOverviewContext,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (decisionOverlayOpen && !decisionOverlayPreviouslyOpenRef.current) {
      decisionOverlayScrollTopRef.current = window.scrollY
    } else if (!decisionOverlayOpen && decisionOverlayPreviouslyOpenRef.current) {
      const restoreTop = decisionOverlayScrollTopRef.current
      if (restoreTop != null) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: restoreTop, behavior: 'auto' })
        })
      }
    }

    decisionOverlayPreviouslyOpenRef.current = decisionOverlayOpen
  }, [decisionOverlayOpen])

  useEffect(() => {
    if (!decisionOverlayOpen || typeof document === 'undefined') return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [decisionOverlayOpen])

  useEffect(() => {
    if (!decisionOverlayOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || messagePreviewState.selection) return
      const semanticFocus = activeSemanticSubtypeFocusRef.current
      const returnRouteContext = resolveAuthoritativeOverviewReturnContext({
        semanticFocus,
        activeSubset:
          subsetSource && subsetValue
            ? {
                source: subsetSource,
                value: subsetValue,
              }
            : null,
        subsetSource,
        subsetValue,
      })
      writeDecisionWorkflowStorage<DecisionOverviewReturnContext>(
        overviewReturnContextStorageKey,
        {
          subsetSource: returnRouteContext.subsetSource,
          subsetValue: returnRouteContext.subsetValue,
          semanticFocus,
          senderPage: requestedSenderPage,
          scrollTop:
            decisionOverlayScrollTopRef.current ??
            (typeof window !== 'undefined' ? window.scrollY : null),
        }
      )
      startTransition(() => {
        router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: returnRouteContext.subsetSource,
            subsetValue: returnRouteContext.subsetValue,
            semanticFocus,
          }),
          clusterId: selectedCluster?.clusterId || clusterId,
          subsetSource: returnRouteContext.subsetSource,
          subsetValue: returnRouteContext.subsetValue,
          senderPage: requestedSenderPage,
          }),
          { scroll: false }
        )
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    activeSemanticSubtypeFocus,
    agentId,
    analysisScope,
    clusterId,
    decisionOverlayOpen,
    overviewReturnContextStorageKey,
    messagePreviewState.selection,
    requestedSenderPage,
    router,
    selectedCluster?.clusterId,
    sessionId,
    subsetSource,
    subsetValue,
    workflowScopeForOverviewContext,
  ])

  useEffect(() => {
    if (!selectedCluster || mode !== 'overview' || !isDefaultOverviewContext) {
      setDefaultOverviewRuntimeGate((current) =>
        current.clusterId === null && current.status === 'idle'
          ? current
          : IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE
      )
      return
    }

    if (cachedWorkspaceSnapshot || trustedRuntimeOverviewWorkspaceSnapshot) {
      setDefaultOverviewRuntimeGate((current) =>
        current.clusterId === null && current.status === 'idle'
          ? current
          : IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE
      )
      return
    }

    const nextClusterId = selectedCluster.clusterId
    const runtimeAttemptInFlight = runtime.loading && !runtime.data

    setDefaultOverviewRuntimeGate((current) => {
      if (current.clusterId !== nextClusterId) {
        return {
          clusterId: nextClusterId,
          status: runtimeAttemptInFlight ? 'waiting' : 'ready_for_fallback',
        }
      }

      if (current.status === 'waiting') {
        if (runtimeAttemptInFlight) return current
        return { clusterId: nextClusterId, status: 'ready_for_fallback' }
      }

      if (
        current.status === 'ready_for_fallback' &&
        runtimeAttemptInFlight
      ) {
        return { clusterId: nextClusterId, status: 'waiting' }
      }

      return current
    })
  }, [
    cachedWorkspaceSnapshot,
    isDefaultOverviewContext,
    mode,
    runtime.data,
    runtime.loading,
    selectedCluster,
    trustedRuntimeOverviewWorkspaceSnapshot,
  ])

  useEffect(() => {
    if (!selectedCluster) return
    if (passiveReadyWorkspaceSnapshot) {
      setWorkspaceStateIfChanged({
        status: 'ready',
        snapshot: passiveReadyWorkspaceSnapshot,
        error: null,
      })
      return
    }

    if (shouldDeferLiveFetchForDefaultOverview) {
      setWorkspaceStateIfChanged(
        passiveWorkspaceSeedSnapshot
          ? { status: 'loading', snapshot: passiveWorkspaceSeedSnapshot, error: null }
          : { status: 'loading', snapshot: null, error: null }
      )
      return
    }

    if (mode === 'decision' && currentMatchingWorkspaceSnapshot && !decisionReadyWorkspaceSnapshot) {
      setWorkspaceStateIfChanged({ status: 'loading', snapshot: null, error: null })
    }
  }, [
    currentMatchingWorkspaceSnapshot,
    decisionReadyWorkspaceSnapshot,
    mode,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    selectedCluster,
    setWorkspaceStateIfChanged,
    shouldDeferLiveFetchForDefaultOverview,
  ])

  useEffect(() => {
    const plan = workspaceFetchPlanRef.current
    if (!plan?.requestKey) return

    let cancelled = false
    const controller = new AbortController()

    setWorkspaceStateIfChanged(
      plan.seedSnapshot
        ? { status: 'loading', snapshot: plan.seedSnapshot, error: null }
        : { status: 'loading', snapshot: null, error: null }
    )

    void (async () => {
      let attempt = 0
      while (!cancelled) {
        const result = await fetchGmailSenderWorkspace({
          selectedCluster: plan.selectedCluster,
          allClusters: plan.allClusters,
          analysisScope: plan.analysisScope,
          cacheVersion: plan.cacheVersion,
          includeClusterSenderKeys: true,
          page: plan.page,
          pageSize: plan.pageSize,
          previewEvidenceSenderKey: plan.previewEvidenceSenderKey,
          requestContext: {
            source: 'operations_review_page',
            component: plan.mode === 'decision' ? 'decision_mode' : 'sender_overview',
            reason: plan.mode === 'decision' ? 'sender_decision_queue' : 'sender_overview',
            phase: plan.requestPhase,
            agentId,
          },
        })
        if (cancelled || ('aborted' in result && result.aborted)) {
          return
        }
        if (!result.ok) {
          if (attempt < 20 && isTransientInboxAnalysisGuardError(result.error)) {
            attempt += 1
            await delayMs(1200)
            continue
          }
          setWorkspaceStateIfChanged((current) => ({
            status: 'error',
            snapshot:
              current.snapshot &&
              workspaceSnapshotSatisfiesCurrentMode({
                snapshot: current.snapshot,
                clusterId: plan.selectedCluster.clusterId,
                analysisScope: plan.normalizedAnalysisScope,
                mode: plan.mode,
                cacheVersion: plan.cacheVersion,
                page: plan.page,
              })
                ? current.snapshot
                : null,
            error: result.error,
          }))
          return
        }

        const nextSnapshot = buildWorkspaceSnapshot({
          data: result.data,
          clusterId: plan.selectedCluster.clusterId,
          analysisScope: plan.normalizedAnalysisScope,
          mode: plan.mode,
          source: 'network',
          cacheVersion: plan.cacheVersion,
          previewEvidenceSenderKey: plan.previewEvidenceSenderKey,
        })
        if (
          !workspaceSnapshotSatisfiesCurrentMode({
            snapshot: nextSnapshot,
            clusterId: plan.selectedCluster.clusterId,
            analysisScope: plan.normalizedAnalysisScope,
            mode: plan.mode,
            cacheVersion: plan.cacheVersion,
            page: plan.page,
          })
        ) {
          setWorkspaceStateIfChanged({
            status: 'error',
            snapshot: plan.seedSnapshot,
            error:
              plan.mode === 'decision'
                ? 'Failed to prepare the full decision queue for this cleanup group.'
                : 'Failed to load sender workspace.',
          })
          return
        }

        setWorkspaceStateIfChanged({
          status: 'ready',
          snapshot: nextSnapshot,
          error: null,
        })
        return
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [agentId, setWorkspaceStateIfChanged, workspaceFetchPlanToken])

  useEffect(() => {
    setActionNote(null)
    setActionError(null)
  }, [
    decisionOverlayIntent,
    mode,
    requestedDecisionSenderKey,
    selectedCluster?.clusterId,
    subsetSource,
    subsetValue,
  ])

  useEffect(() => {
    setSnippetOverridesBySender({})
    setSnippetHydrationStateBySender({})
  }, [selectedCluster?.clusterId])

  useEffect(() => {
    setMessagePreviewState({
      selection: null,
      status: 'idle',
      data: null,
      error: null,
    })
  }, [mode, selectedCluster?.clusterId, subsetSource, subsetValue])

  useEffect(() => {
    if (!messagePreviewState.selection) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMessagePreviewState({
        selection: null,
        status: 'idle',
        data: null,
        error: null,
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [messagePreviewState.selection])

  useEffect(() => {
    const selection = messagePreviewState.selection
    if (!selection) return

    let cancelled = false
    setMessagePreviewState((current) =>
      current.selection?.message.message_id === selection.message.message_id &&
      current.status === 'loading'
        ? current
        : {
            selection,
            status: 'loading',
            data: null,
            error: null,
          }
    )

    void fetchOperationsMessagePreview({
      messageId: selection.message.message_id,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_overview',
        reason: 'sender_evidence_message_preview',
        phase: 'interactive',
      },
    }).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setMessagePreviewState((current) => {
          if (current.selection?.message.message_id !== selection.message.message_id) {
            return current
          }
          return {
            selection,
            status: 'error',
            data: null,
            error: result.error,
          }
        })
        return
      }
      setMessagePreviewState((current) => {
        if (current.selection?.message.message_id !== selection.message.message_id) {
          return current
        }
        return {
          selection,
          status: 'ready',
          data: result.data,
          error: null,
        }
      })
    })

    return () => {
      cancelled = true
    }
  }, [messagePreviewState.selection])

  const workspaceSnapshot = useMemo(() => {
    if (shouldHoldContinuityShell) return continuityOverviewWorkspaceSnapshot
    if (!selectedCluster) {
      return mode === 'decision'
        ? workflowCachedReadyWorkspaceSnapshot || null
        : workflowCachedWorkspaceSnapshot ||
            (effectiveWorkflowScope === normalizedAnalysisScope
            ? trustedRuntimeOverviewWorkspaceSnapshot
            : null) ||
            null
    }
    return mode === 'decision'
      ? decisionReadyWorkspaceSnapshot || null
      : currentMatchingWorkspaceSnapshot ||
          workflowCachedWorkspaceSnapshot ||
          (effectiveWorkflowScope === normalizedAnalysisScope
            ? trustedRuntimeOverviewWorkspaceSnapshot
            : null) ||
          null
  }, [
    continuityOverviewWorkspaceSnapshot,
    decisionReadyWorkspaceSnapshot,
    currentMatchingWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    selectedCluster,
    shouldHoldContinuityShell,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedReadyWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const workspace = useMemo(
    () => normalizeWorkspaceDataContract(workspaceSnapshot?.data || null),
    [workspaceSnapshot?.data]
  )
  const overviewWorkspaceSnapshot = useMemo(() => {
    if (shouldHoldContinuityShell) return continuityOverviewWorkspaceSnapshot
    if (!selectedCluster) return null
    const candidateSnapshots = [
      workspaceState.snapshot?.mode === 'overview' &&
      workspaceState.snapshot.analysisScope === normalizedAnalysisScope
        ? workspaceState.snapshot
        : null,
      persistedOverviewWorkspaceSnapshot,
      cachedWorkspaceSnapshot,
      trustedRuntimeOverviewWorkspaceSnapshot,
    ]

    return (
      candidateSnapshots.find((snapshot) =>
        workspaceSnapshotMatchesOverviewHeaderTruth({
          snapshot,
          clusterId: selectedCluster.clusterId,
          analysisScope: normalizedAnalysisScope,
          cacheVersion,
          page: requestedSenderPage,
        })
      ) || null
    )
  }, [
    cacheVersion,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedSenderPage,
    selectedCluster,
    shouldHoldContinuityShell,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const overviewShellWorkspaceSnapshot = useMemo(() => {
    if (shouldHoldContinuityShell) return continuityOverviewWorkspaceSnapshot
    return scopedOverviewShellWorkspaceSnapshot
  }, [
    continuityOverviewWorkspaceSnapshot,
    scopedOverviewShellWorkspaceSnapshot,
    shouldHoldContinuityShell,
  ])
  const overviewHeaderWorkspaceSnapshot = useMemo(() => {
    if (shouldHoldContinuityShell) return continuityOverviewWorkspaceSnapshot
    if (!selectedCluster) return null
    if (
      workspaceSnapshotMatchesOverviewHeaderTruth({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
        page: requestedSenderPage,
      })
    ) {
      return workspaceState.snapshot
    }
    if (
      workspaceSnapshotMatchesOverviewHeaderTruth({
        snapshot: cachedWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
        page: requestedSenderPage,
      })
    ) {
      return cachedWorkspaceSnapshot
    }
    if (
      workspaceSnapshotMatchesOverviewHeaderTruth({
        snapshot: trustedRuntimeOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
        page: requestedSenderPage,
      })
    ) {
      return trustedRuntimeOverviewWorkspaceSnapshot
    }
    return overviewWorkspaceSnapshot
  }, [
    cacheVersion,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    overviewWorkspaceSnapshot,
    requestedSenderPage,
    selectedCluster,
    shouldHoldContinuityShell,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const overviewCoverageWorkspaceSnapshot = useMemo(() => {
    if (shouldHoldContinuityShell) return continuityOverviewWorkspaceSnapshot
    if (!selectedCluster) return null
    if (
      workspaceSnapshotMatchesClusterCoverageContext({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
      })
    ) {
      return workspaceState.snapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return workspaceState.snapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: cachedWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return cachedWorkspaceSnapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: cachedDecisionWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return cachedDecisionWorkspaceSnapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: trustedRuntimeOverviewStructureSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return trustedRuntimeOverviewStructureSnapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: trustedRuntimeOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return trustedRuntimeOverviewWorkspaceSnapshot
    }
    if (
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: persistedOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
    ) {
      return persistedOverviewWorkspaceSnapshot
    }
    return null
  }, [
    cacheVersion,
    cachedDecisionWorkspaceSnapshot,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    selectedCluster,
    trustedRuntimeOverviewStructureSnapshot,
    shouldHoldContinuityShell,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const workflowCoverageWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    const candidateSnapshots = [
      workspaceSnapshotMatchesClusterCoverageContext({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
      })
        ? workspaceState.snapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
      })
        ? workspaceState.snapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workflowCachedWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
      })
        ? workflowCachedWorkspaceSnapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workflowCachedDecisionWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
      })
        ? workflowCachedDecisionWorkspaceSnapshot
        : null,
      effectiveWorkflowScope === normalizedAnalysisScope &&
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: trustedRuntimeOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null,
      effectiveWorkflowScope === normalizedAnalysisScope &&
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: persistedOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
      })
        ? persistedOverviewWorkspaceSnapshot
        : null,
    ]

    return candidateSnapshots.find((snapshot) => snapshot != null) || null
  }, [
    cacheVersion,
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    selectedCluster,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedDecisionWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const hydratedOverviewPageWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(overviewHeaderWorkspaceSnapshot?.data || null),
    [overviewHeaderWorkspaceSnapshot?.data]
  )
  const hydratedOverviewShellWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(overviewShellWorkspaceSnapshot?.data || null),
    [overviewShellWorkspaceSnapshot?.data]
  )
  const hydratedOverviewCoverageWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(overviewCoverageWorkspaceSnapshot?.data || null),
    [overviewCoverageWorkspaceSnapshot?.data]
  )
  const hydratedWorkflowCoverageWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(workflowCoverageWorkspaceSnapshot?.data || null),
    [workflowCoverageWorkspaceSnapshot?.data]
  )
  useEffect(() => {
    if (!reviewScopeTransitionSnapshotKey) return
    if (!selectedCluster || !overviewShellWorkspaceSnapshot) return
    if (
      overviewShellWorkspaceSnapshot.clusterId !== selectedCluster.clusterId ||
      overviewShellWorkspaceSnapshot.analysisScope !== normalizedAnalysisScope
    ) {
      return
    }
    reviewScopeTransitionSnapshots.delete(reviewScopeTransitionSnapshotKey)
  }, [
    normalizedAnalysisScope,
    overviewShellWorkspaceSnapshot,
    reviewScopeTransitionSnapshotKey,
    selectedCluster,
  ])
  const displayOverviewWorkspace = hydratedOverviewPageWorkspace
  const workflowOverviewWorkspace = workspace
  const overviewShellWorkspace = hydratedOverviewShellWorkspace
  const overviewCoverageWorkspace = hydratedOverviewCoverageWorkspace
  const workflowCoverageWorkspace = hydratedWorkflowCoverageWorkspace
  const renderedSemanticSubtypeFocus = activeSemanticSubtypeFocus
  const renderedSubsetSource = subsetSource
  const renderedSubsetValue = subsetValue
  const clusterCounts = useMemo(
    () => workspaceClusterManagedDestinationCounts(workflowCoverageWorkspace, managedBySender),
    [managedBySender, workflowCoverageWorkspace]
  )
  const clusterManagedCount = useMemo(
    () => workspaceClusterManagedSenderCount(workflowCoverageWorkspace, managedBySender),
    [managedBySender, workflowCoverageWorkspace]
  )
  const overviewCounterWorkspace = useMemo(() => {
    const candidates = [
      overviewCoverageWorkspace,
      workspaceHasUsableClusterGlobalSenderKeys(overviewShellWorkspace) ? overviewShellWorkspace : null,
      workspaceHasUsableClusterGlobalSenderKeys(displayOverviewWorkspace) ? displayOverviewWorkspace : null,
    ]
    return candidates.find((workspace) => workspace != null) || null
  }, [displayOverviewWorkspace, overviewCoverageWorkspace, overviewShellWorkspace])
  const overviewClusterCounts = useMemo(
    () => workspaceClusterManagedDestinationCounts(overviewCounterWorkspace, managedBySender),
    [managedBySender, overviewCounterWorkspace]
  )
  const overviewCoverageManagedCount = useMemo(
    () => workspaceClusterManagedSenderCount(overviewCounterWorkspace, managedBySender),
    [managedBySender, overviewCounterWorkspace]
  )
  const workflowClusterProgress = useMemo(
    () =>
      workflowCoverageWorkspace
        ? {
            total: workspaceClusterSenderTotal(
              workflowCoverageWorkspace,
              selectedCluster?.senderCount
            ),
            managed: clusterManagedCount,
            remaining:
              clusterManagedCount == null
                ? null
                : Math.max(
                    workspaceClusterSenderTotal(
                      workflowCoverageWorkspace,
                      selectedCluster?.senderCount
                    ) - clusterManagedCount,
                    0
                  ),
          }
        : {
            total: 0,
            managed: null,
            remaining: null,
          },
    [clusterManagedCount, selectedCluster?.senderCount, workflowCoverageWorkspace]
  )
  const overviewSenderTotal =
    displayOverviewWorkspace || overviewShellWorkspace
      ? Math.max(workspaceClusterSenderTotal(displayOverviewWorkspace || overviewShellWorkspace), 0)
      : null
  const overviewManagedCount = overviewCounterWorkspace ? overviewCoverageManagedCount : null
  const overviewRemainingCount =
    overviewSenderTotal != null && overviewManagedCount != null
      ? Math.max(overviewSenderTotal - overviewManagedCount, 0)
      : null
  const overviewCoveragePct =
    overviewSenderTotal != null && overviewManagedCount != null
      ? ratioPercent(overviewManagedCount, Math.max(overviewSenderTotal, 1))
      : null
  const overviewSupportingMessageCount =
    displayOverviewWorkspace || overviewShellWorkspace
      ? workspaceClusterMessageTotal(displayOverviewWorkspace || overviewShellWorkspace)
      : null
  const overviewNextStep =
    overviewRemainingCount == null
      ? null
      : overviewRemainingCount > 0
        ? `Next step: review the ${overviewRemainingCount.toLocaleString()} sender${
            overviewRemainingCount === 1 ? '' : 's'
          } that still need a decision in Decision Mode.`
        : 'Next step: every sender in this cleanup group is already covered, so you can continue to Management when ready.'
  const selectedClusterSemanticRollup =
    overviewShellWorkspace?.analytics.semantic_rollup ||
    selectedMailboxIntelligenceGroup?.semantic_rollup ||
    null
  const groupReviewUnits = useMemo(
    () =>
      selectedCluster
        ? buildCleanupGroupPublishedReviewUnits(
            selectedCluster.clusterId,
            selectedClusterSemanticRollup
          )
        : [],
    [selectedCluster, selectedClusterSemanticRollup]
  )
  const requestedReviewUnit = useMemo(
    () =>
      subsetSource === 'review_unit'
        ? findCleanupGroupPublishedReviewUnit(groupReviewUnits, subsetValue?.trim())
        : null,
    [groupReviewUnits, subsetSource, subsetValue]
  )
  const activeReviewUnit = useMemo(
    () =>
      requestedReviewUnit && requestedReviewUnit.targetState !== 'oversized'
        ? requestedReviewUnit
        : null,
    [requestedReviewUnit]
  )
  const reviewUnitSurfaceLabel = isMarketingCleanupGroup ? 'Review unit' : 'Focused view'
  const reviewUnitSurfaceLabelPlural = isMarketingCleanupGroup ? 'Review units' : 'Focused views'
  const reviewUnitActionLabel = isMarketingCleanupGroup ? 'Review This Unit' : 'Review Focused View'
  const reviewUnitPreparingLabel = isMarketingCleanupGroup
    ? 'Preparing This Unit'
    : 'Preparing Focused View'
  const reviewUnitNoun = isMarketingCleanupGroup ? 'review unit' : 'focused view'
  const isMarketingReviewUnitRouteActive =
    isMarketingCleanupGroup && subsetSource === 'review_unit' && activeReviewUnit != null
  const marketingReviewUnitBackLabel = isMarketingReviewUnitRouteActive
    ? 'Choose Another Unit'
    : 'Back to full sender list'
  const marketingReviewUnitBackHint = isMarketingReviewUnitRouteActive
    ? 'Choose another unit when you want a different Marketing review scope.'
    : 'Back to full sender list when you want the broader queue again.'
  const [semanticFocusWorkspaceState, setSemanticFocusWorkspaceState] =
    useState<SemanticFocusWorkspaceState>({
      status: 'idle',
      data: null,
      error: null,
    })
  const [marketingReviewUnitTruthState, setMarketingReviewUnitTruthState] =
    useState<MarketingReviewUnitTruthState>({
      status: 'idle',
      data: null,
      error: null,
    })
  const semanticFocusWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(semanticFocusWorkspaceState.data),
    [semanticFocusWorkspaceState.data]
  )
  const activeMarketingReviewUnitTruth = useMemo(() => {
    if (!isMarketingReviewUnitRouteActive || !activeReviewUnit) {
      return null
    }

    const senderTotal = Math.max(activeReviewUnit.senderCount, 0)
    const unitSenders = marketingReviewUnitTruthState.data?.senders || []
    const coverageReady =
      marketingReviewUnitTruthState.status === 'ready' &&
      marketingReviewUnitTruthState.data?.senderTotalMatchesUnit === true
    const managedCount = coverageReady
      ? unitSenders.filter((sender) => Boolean(managedBySender[sender.sender_key])).length
      : null
    const remainingCount = coverageReady
      ? Math.max(unitSenders.filter((sender) => !managedBySender[sender.sender_key]).length, 0)
      : null
    const coveragePct =
      coverageReady && managedCount != null
        ? ratioPercent(managedCount, Math.max(senderTotal, 1))
        : null
    const supportingMessageCount = coverageReady
      ? unitSenders.reduce((sum, sender) => sum + sender.cleanup_group_message_count, 0)
      : null
    const unitLabel = activeReviewUnit.label || 'This review unit'
    const goalSummary =
      coverageReady && managedCount != null && remainingCount != null
        ? `${managedCount.toLocaleString()} covered · ${remainingCount.toLocaleString()} remaining in unit`
        : 'Unit-scoped coverage is loading for this review unit.'
    const goalFollowUp =
      coverageReady && remainingCount != null
        ? remainingCount > 0
          ? `Next step: review the ${remainingCount.toLocaleString()} sender${
              remainingCount === 1 ? '' : 's'
            } that still need a decision in this review unit.`
          : 'Next step: every sender in this review unit is already covered, so you can continue to Management when ready.'
        : 'Unit-scoped next-step guidance will appear once this review unit is ready.'

    return {
      coveragePct,
      coverageReady,
      goalFollowUp,
      goalSummary,
      managedCount,
      remainingCount,
      senderTotal,
      supportingMessageCount,
      unitLabel,
    }
  }, [
    activeReviewUnit,
    isMarketingReviewUnitRouteActive,
    managedBySender,
    marketingReviewUnitTruthState.data,
    marketingReviewUnitTruthState.status,
  ])
  const topSummarySenderTotal = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.senderTotal
    : overviewSenderTotal
  const topSummaryManagedCount = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.managedCount
    : overviewManagedCount
  const topSummaryRemainingCount = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.remainingCount
    : overviewRemainingCount
  const topSummaryCoveragePct = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.coveragePct
    : overviewCoveragePct
  const topSummarySupportingMessageCount = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.supportingMessageCount
    : overviewSupportingMessageCount
  const topSummaryCoverageIsLoading = activeMarketingReviewUnitTruth
    ? !activeMarketingReviewUnitTruth.coverageReady
    : topSummaryManagedCount == null ||
      topSummaryRemainingCount == null ||
      topSummaryCoveragePct == null
  const topSummarySenderTotalIsLoading = topSummarySenderTotal == null
  const topSummarySupportingMessageIsLoading = activeMarketingReviewUnitTruth
    ? topSummarySupportingMessageCount == null
    : topSummarySupportingMessageCount == null
  const topSummaryGoalSummary = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.goalSummary
    : overviewManagedCount != null && overviewRemainingCount != null
      ? `${overviewManagedCount.toLocaleString()} covered · ${overviewRemainingCount.toLocaleString()} remaining`
      : 'Sender coverage is loading for this cleanup group.'
  const topSummaryGoalFollowUp = activeMarketingReviewUnitTruth
    ? activeMarketingReviewUnitTruth.goalFollowUp
    : overviewNextStep || 'Next-step guidance will appear once exact sender coverage is ready.'

  const overviewAnalytics = useMemo(() => {
    if (!overviewShellWorkspace) return null

    const senderTotal = workspaceClusterSenderTotal(overviewShellWorkspace)
    const semanticResolutionDistribution =
      overviewShellWorkspace.analytics.semantic_resolution_distribution
    const familyClearReadEntry =
      semanticResolutionDistribution.find(
        (entry) => entry.scope === 'family' && entry.resolution === 'clear'
      ) || null
    const familyMixedReadEntry =
      semanticResolutionDistribution.find(
        (entry) => entry.scope === 'family' && entry.resolution === 'mixed'
      ) || null
    const familyThinHistoryReadEntry =
      semanticResolutionDistribution.find(
        (entry) => entry.scope === 'family' && entry.resolution === 'thin_history'
      ) || null
    const topContributor = overviewShellWorkspace.analytics.cluster_contribution[0] || null
    const groupMessageTotal = Math.max(overviewShellWorkspace.selected_cluster.message_count || 0, 0)
    const topThreeContributionShare = Math.round(
      overviewShellWorkspace.analytics.cluster_contribution
        .slice(0, 3)
        .reduce((sum, sender) => sum + sender.share_pct, 0)
    )
    const busiestPeriod =
      overviewShellWorkspace.analytics.sender_activity_timeline
        .slice()
        .sort((left, right) => right.sender_count - left.sender_count || left.label.localeCompare(right.label))[0] ||
      null
    const familyClearReadCount = familyClearReadEntry?.sender_count || 0
    const familyMixedReadCount = familyMixedReadEntry?.sender_count || 0
    const familyThinHistoryReadCount = familyThinHistoryReadEntry?.sender_count || 0
    const contributorStory =
      topContributor && topThreeContributionShare >= 20
        ? `Top three contributors drive ${formatPercent(topThreeContributionShare)} of group message volume.`
        : topContributor
          ? `Message weight is spread across the cluster. The top three contributors still drive ${formatPercent(topThreeContributionShare)} of group volume.`
          : 'Use contributor weight as supporting leverage context, not the primary semantic read.'

    return {
      senderTotal,
      familyClearReadCount,
      familyMixedReadCount,
      familyThinHistoryReadCount,
      groupMessageTotal,
      busiestPeriod,
      contributorStory,
      topContributor,
      topThreeContributionShare,
      contributionItems: overviewShellWorkspace.analytics.cluster_contribution.slice(0, 10).map((sender) => ({
        id: sender.sender_key,
        label: sender.sender,
        value: sender.message_count,
        detail: `${formatPercent(sender.share_pct)} of all cleanup-group messages`,
      })),
    }
  }, [overviewShellWorkspace])

  const timeContextOverallActivityMetric = useMemo(() => {
    if (topSummarySupportingMessageCount == null) {
      return {
        value: 'Supporting activity loading',
        detail: 'Across this cleanup group, the full activity picture is still loading.',
      }
    }

    return {
      value: `${topSummarySupportingMessageCount.toLocaleString()} supporting messages`,
      detail:
        'Across this cleanup group, those messages are the workload sitting behind the sender decisions.',
    }
  }, [topSummarySupportingMessageCount])

  const timeContextActivityMixMetric = useMemo(() => {
    if (!overviewAnalytics?.topContributor) {
      return {
        value: 'Activity still spreading out',
        detail: 'Across this cleanup group, no single sender is clearly dominating the visible workload yet.',
      }
    }

    if (overviewAnalytics.topThreeContributionShare >= 20) {
      return {
        value: `Top 3 drive ${overviewAnalytics.topThreeContributionShare}%`,
        detail: `${overviewAnalytics.topContributor.sender} is the biggest contributor, so a small set of senders shapes much of the overall activity in this cleanup group.`,
      }
    }

    return {
      value: `${overviewAnalytics.topContributor.sender} leads`,
      detail: `Overall activity is more spread across this cleanup group, so no single sender explains the whole story on its own.`,
    }
  }, [overviewAnalytics])

  const timeContextPatternSignalMetric = useMemo(() => {
    if (!overviewAnalytics || overviewAnalytics.senderTotal === 0) {
      return {
        value: 'Pattern signal loading',
        detail: 'This cleanup group needs sender pattern coverage before the read stabilizes.',
      }
    }

    if (overviewAnalytics.familyClearReadCount >= Math.max(1, Math.round(overviewAnalytics.senderTotal * 0.6))) {
      return {
        value: `${overviewAnalytics.familyClearReadCount.toLocaleString()} clear patterns`,
        detail: 'Across this cleanup group, most senders follow a stable pattern, so review can stay fast and confident.',
      }
    }

    if (overviewAnalytics.familyMixedReadCount >= Math.max(overviewAnalytics.familyClearReadCount, 1)) {
      return {
        value: `${overviewAnalytics.familyMixedReadCount.toLocaleString()} mixed patterns`,
        detail: 'Several senders in this cleanup group blend different behaviors, so the visible proof matters more than the label alone.',
      }
    }

    if (overviewAnalytics.familyThinHistoryReadCount > 0) {
      return {
        value: `${overviewAnalytics.familyThinHistoryReadCount.toLocaleString()} lighter-history senders`,
        detail: 'Some senders in this cleanup group still need more history, so review should lean on the evidence row before deciding.',
      }
    }

    return {
      value: 'Patterns are settling',
      detail: 'The sender patterns in this cleanup group are readable, but no single read dominates the whole group yet.',
    }
  }, [overviewAnalytics])

  const timeContextNextAction = useMemo(() => {
    if (topSummaryRemainingCount == null) {
      return {
        title: 'Keep sender review moving',
        detail: 'Next-step guidance will appear once exact sender coverage is ready.',
      }
    }

    if (topSummaryRemainingCount > 0) {
      return {
        title: `Review ${topSummaryRemainingCount.toLocaleString()} remaining sender${
          topSummaryRemainingCount === 1 ? '' : 's'
        }`,
        detail: topSummaryGoalFollowUp,
      }
    }

    return {
      title: 'Continue to Management',
      detail: topSummaryGoalFollowUp,
    }
  }, [topSummaryGoalFollowUp, topSummaryRemainingCount])
  const hydratedOverviewRailSourceLabel = useMemo<SenderOverviewHydratedRailSource>(() => {
    const relevantSnapshots = [overviewHeaderWorkspaceSnapshot, overviewShellWorkspaceSnapshot]
    return relevantSnapshots.some((snapshot) => snapshot?.source === 'runtime')
      ? 'bootstrap_runtime_seed'
      : 'hydrated_page'
  }, [overviewHeaderWorkspaceSnapshot, overviewShellWorkspaceSnapshot])
  const currentHydratedRailPackage = useMemo(() => {
    const activeClusterId = requestedClusterId || selectedCluster?.clusterId
    if (!activeClusterId) return null
    if (missingScopedCluster) {
      return {
        key: buildSenderOverviewRailFastKey({
          agentId,
          sessionId,
          clusterId: activeClusterId,
          scope: normalizedAnalysisScope,
          version: cacheVersion,
        }),
        sourceLabel: hydratedOverviewRailSourceLabel,
        state: 'outside_timeframe' as const,
        clusterId: activeClusterId,
        scope: normalizedAnalysisScope,
        version: cacheVersion,
        clusterTitle: missingScopedClusterName,
        visibleClusterCount: runtimeClusters.length,
        chart: null,
        metrics: null,
      }
    }
    if (!overviewShellWorkspace) return null
    return {
      key: buildSenderOverviewRailFastKey({
        agentId,
        sessionId,
        clusterId: activeClusterId,
        scope: normalizedAnalysisScope,
        version: cacheVersion,
      }),
      sourceLabel: hydratedOverviewRailSourceLabel,
      state: 'ready' as const,
      clusterId: activeClusterId,
      scope: normalizedAnalysisScope,
      version: cacheVersion,
      clusterTitle:
        cleanupGroupDisplayTitle({
          clusterId:
            hydratedOverviewPageWorkspace?.selected_cluster.canonical_cluster_id ||
            hydratedOverviewPageWorkspace?.selected_cluster.cluster_id ||
            overviewShellWorkspace.selected_cluster.canonical_cluster_id ||
            overviewShellWorkspace.selected_cluster.cluster_id ||
            selectedCluster?.canonicalClusterId ||
            selectedCluster?.clusterId ||
            activeClusterId,
          title:
            hydratedOverviewPageWorkspace?.selected_cluster.title ||
            overviewShellWorkspace.selected_cluster.title ||
            selectedCluster?.title ||
            null,
        }) || null,
      visibleClusterCount: runtimeClusters.length,
      chart: {
        granularity: overviewShellWorkspace.analytics.sender_activity_timeline_granularity || 'month',
        items: overviewShellWorkspace.analytics.sender_activity_timeline.map((item) => ({
          label: item.label,
          count: item.sender_count,
        })),
      },
      metrics: {
        overallActivity: timeContextOverallActivityMetric,
        activityMix: timeContextActivityMixMetric,
        patternSignal: timeContextPatternSignalMetric,
        nextAction: timeContextNextAction,
      },
    }
  }, [
    agentId,
    cacheVersion,
    hydratedOverviewPageWorkspace?.selected_cluster.canonical_cluster_id,
    hydratedOverviewPageWorkspace?.selected_cluster.cluster_id,
    hydratedOverviewPageWorkspace?.selected_cluster.title,
    hydratedOverviewRailSourceLabel,
    missingScopedCluster,
    missingScopedClusterName,
    normalizedAnalysisScope,
    overviewShellWorkspace,
    requestedClusterId,
    runtimeClusters.length,
    selectedCluster?.canonicalClusterId,
    selectedCluster?.clusterId,
    selectedCluster?.title,
    sessionId,
    timeContextActivityMixMetric,
    timeContextNextAction,
    timeContextOverallActivityMetric,
    timeContextPatternSignalMetric,
  ])
  useEffect(() => {
    if (!currentHydratedRailPackage) return
    writeSenderOverviewRailFastPackage(currentHydratedRailPackage)
  }, [currentHydratedRailPackage])
  const bootstrapRailFamilyPackages = useMemo(() => {
    const activeClusterId = requestedClusterId || selectedCluster?.clusterId
    const runtimeSelectedClusterRailFamily =
      renderRuntimeData?.runtime_selected_cluster_rail_family || null
    if (!activeClusterId || !runtimeSelectedClusterRailFamily) return []
    if (runtimeSelectedClusterRailFamily.cluster_id !== activeClusterId) return []

    const fallbackClusterTitle =
      cleanupGroupDisplayTitle({
        clusterId:
          runtimeSelectedClusterRailFamily.cluster_id ||
          selectedCluster?.canonicalClusterId ||
          selectedCluster?.clusterId ||
          activeClusterId,
        title:
          runtimeSelectedClusterRailFamily.cluster_title ||
          selectedCluster?.title ||
          missingScopedClusterName ||
          null,
      }) || null

    return runtimeSelectedClusterRailFamily.scopes.map((entry) =>
      buildSenderOverviewRailFastPackageFromRuntimeSeed({
        agentId,
        sessionId,
        version: cacheVersion,
        baselineScope: normalizedAnalysisScope,
        entry,
        fallbackClusterTitle,
      })
    )
  }, [
    agentId,
    cacheVersion,
    missingScopedClusterName,
    normalizedAnalysisScope,
    renderRuntimeData?.runtime_selected_cluster_rail_family,
    requestedClusterId,
    selectedCluster?.canonicalClusterId,
    selectedCluster?.clusterId,
    selectedCluster?.title,
    sessionId,
  ])
  const baselineBootstrapRailPackage = useMemo(
    () =>
      bootstrapRailFamilyPackages.find((pkg) => pkg.scope === normalizedAnalysisScope) || null,
    [bootstrapRailFamilyPackages, normalizedAnalysisScope]
  )
  const resolvedBaselineRailFastPackage = useMemo(() => {
    const baselineBootstrapIsNormalized =
      baselineBootstrapRailPackage?.state === 'ready' &&
      baselineBootstrapRailPackage.chart &&
      baselineBootstrapRailPackage.metrics &&
      senderOverviewRailTimelineLabelsMatchGranularity({
        granularity: baselineBootstrapRailPackage.chart.granularity,
        items: baselineBootstrapRailPackage.chart.items,
      })
    const currentHydratedIsNormalized =
      currentHydratedRailPackage?.state === 'ready' &&
      currentHydratedRailPackage.chart &&
      currentHydratedRailPackage.metrics &&
      senderOverviewRailTimelineLabelsMatchGranularity({
        granularity: currentHydratedRailPackage.chart.granularity,
        items: currentHydratedRailPackage.chart.items,
      })

    if (baselineBootstrapIsNormalized && !currentHydratedIsNormalized) {
      return baselineBootstrapRailPackage
    }

    if (
      currentHydratedRailPackage?.state === 'ready' &&
      currentHydratedRailPackage.chart &&
      currentHydratedRailPackage.metrics &&
      currentHydratedRailPackage.chart.items.length > 0
    ) {
      return currentHydratedRailPackage
    }

    return baselineBootstrapRailPackage || currentHydratedRailPackage
  }, [baselineBootstrapRailPackage, currentHydratedRailPackage])
  useLayoutEffect(() => {
    if (bootstrapRailFamilyPackages.length === 0) return
    for (const pkg of bootstrapRailFamilyPackages) {
      writeSenderOverviewRailFastPackage(pkg)
    }
  }, [bootstrapRailFamilyPackages])
  const resolveRailFastPackageForScope = useCallback(
    (scope: OperationsAnalysisScope): SenderOverviewRailFastPackage | null => {
      const normalizedScope = normalizeOperationsAnalysisScope(scope)
      const activeClusterId = requestedClusterId || selectedCluster?.clusterId
      const clusterTitle =
        cleanupGroupDisplayTitle({
          clusterId: selectedCluster?.canonicalClusterId || activeClusterId,
          title:
            currentHydratedRailPackage?.clusterTitle ||
            selectedCluster?.title ||
            missingScopedClusterName ||
            null,
        }) || null
      if (!activeClusterId) return null
      if (normalizedScope === normalizedAnalysisScope) {
        return (
          currentHydratedRailPackage ||
          buildMissingSenderOverviewRailFastPackage({
            agentId,
            sessionId,
            clusterId: activeClusterId,
            scope: normalizedScope,
            version: cacheVersion,
            clusterTitle,
          })
        )
      }
      const bootstrapPackage =
        bootstrapRailFamilyPackages.find((pkg) => pkg.scope === normalizedScope) || null
      if (bootstrapPackage) {
        return bootstrapPackage
      }
      const storedPackage = readSenderOverviewRailFastPackage(
        buildSenderOverviewRailFastKey({
          agentId,
          sessionId,
          clusterId: activeClusterId,
          scope: normalizedScope,
          version: cacheVersion,
        })
      )
      if (storedPackage) {
        return withSenderOverviewRailSourceLabel(storedPackage, 'memory_store')
      }
      return buildMissingSenderOverviewRailFastPackage({
        agentId,
        sessionId,
        clusterId: activeClusterId,
        scope: normalizedScope,
        version: cacheVersion,
        clusterTitle,
      })
    },
    [
      agentId,
      cacheVersion,
      currentHydratedRailPackage,
      missingScopedClusterName,
      normalizedAnalysisScope,
      bootstrapRailFamilyPackages,
      requestedClusterId,
      selectedCluster?.canonicalClusterId,
      selectedCluster?.clusterId,
      selectedCluster?.title,
      sessionId,
    ]
  )
  const handleRailScopeSelect = useCallback(
    (nextScope: OperationsAnalysisScope) => {
      const normalizedNext = normalizeOperationsAnalysisScope(nextScope)
      setActiveRailScope((current) => {
        if (current === normalizedNext) return current
        return normalizedNext
      })

      const nextRailPackage = resolveRailFastPackageForScope(normalizedNext)
      if (!selectedCluster || nextRailPackage?.state !== 'ready') return
      if (
        normalizedNext === effectiveWorkflowScope &&
        subsetSource == null &&
        subsetValue == null &&
        !activeSemanticSubtypeFocusRef.current &&
        requestedSenderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE
      ) {
        return
      }

      setActiveSemanticSubtypeFocus(null)
      setSemanticFocusWorkspaceState({
        status: 'idle',
        data: null,
        error: null,
      })
      senderWorkflowPendingScrollRef.current = false

      startTransition(() => {
        router.replace(
          buildReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: normalizedNext,
            clusterId: selectedCluster.clusterId,
            mode,
            senderPage: null,
            overlayIntent: mode === 'decision' ? 'guided' : null,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      effectiveWorkflowScope,
      mode,
      requestedSenderPage,
      resolveRailFastPackageForScope,
      router,
      selectedCluster,
      sessionId,
      subsetSource,
      subsetValue,
    ]
  )
  const detachedRailFastPackage = useMemo(() => {
    if (activeRailScope === normalizedAnalysisScope) return null
    return resolveRailFastPackageForScope(activeRailScope)
  }, [activeRailScope, normalizedAnalysisScope, resolveRailFastPackageForScope])
  const activeRailFastPackage =
    activeRailScope === normalizedAnalysisScope
      ? resolvedBaselineRailFastPackage
      : detachedRailFastPackage
  const suggestedBroaderRailScope = useMemo(
    () => getNextBroaderAnalysisScope(activeRailScope),
    [activeRailScope]
  )
  const activeRailBodyOverride = useMemo(() => {
    if (!activeRailFastPackage || activeRailFastPackage.state === 'ready') return null
    const activeScopeLabel = analysisScopeControlLabel(activeRailScope)
    const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const broaderScopeLabel = suggestedBroaderRailScope
      ? analysisScopeControlLabel(suggestedBroaderRailScope)
      : null
    const activeClusterTitle =
      activeRailFastPackage.clusterTitle ||
      selectedCluster?.title ||
      missingScopedClusterName ||
      'Selected cleanup group'

    if (activeRailFastPackage.state === 'outside_timeframe') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
            <p className="mt-2 text-lg font-semibold text-white">
              This group is not active in this timeframe
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              {activeClusterTitle} still exists, but it does not appear in {activeScopeLabel}. That
              is expected when this cleanup group falls outside the selected window.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Sender workflow stays on {workflowScopeLabel} until you choose a ready timeframe.
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-cyan-200">What to do next</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Compare a broader window to bring this group back into view, or switch back to a
              timeframe that already drives the workflow below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestedBroaderRailScope ? (
                <button
                  type="button"
                  onClick={() => handleRailScopeSelect(suggestedBroaderRailScope)}
                  className={`${insetPillClass} rounded-full px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`}
                >
                  Try broader timeframe{broaderScopeLabel ? ` (${broaderScopeLabel})` : ''}
                </button>
              ) : null}
              {activeRailScope !== normalizedAnalysisScope ? (
                <button
                  type="button"
                  onClick={() => handleRailScopeSelect(effectiveWorkflowScope)}
                  className={`${insetPillClass} rounded-full px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`}
                >
                  Return to active workflow timeframe ({workflowScopeLabel})
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
          <p className="mt-2 text-lg font-semibold text-white">
            Timeframe not yet loaded
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            {activeScopeLabel} has not been loaded yet in this session for {activeClusterTitle}, so
            the rail cannot compare this cleanup group in that timeframe yet.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            Sender workflow stays on {workflowScopeLabel} until this timeframe is ready.
          </p>
        </div>
        <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
          <p className="text-[10px] uppercase tracking-wide text-cyan-200">What to do next</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Try another timeframe, or return to a previously viewed timeframe to get back to a rail
            that already has data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedBroaderRailScope ? (
              <button
                type="button"
                onClick={() => handleRailScopeSelect(suggestedBroaderRailScope)}
                className={`${insetPillClass} rounded-full px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`}
              >
                Try another timeframe{broaderScopeLabel ? ` (${broaderScopeLabel})` : ''}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleRailScopeSelect(effectiveWorkflowScope)}
              className={`${insetPillClass} rounded-full px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`}
            >
              Return to active workflow timeframe ({workflowScopeLabel})
            </button>
          </div>
        </div>
      </div>
    )
  }, [
    effectiveWorkflowScope,
    activeRailFastPackage,
    activeRailScope,
    handleRailScopeSelect,
    missingScopedClusterName,
    normalizedAnalysisScope,
    selectedCluster?.title,
    suggestedBroaderRailScope,
  ])
  const activeRailDisplay = useMemo(() => {
    const currentRailState = activeRailFastPackage?.state || 'ready'

    if (activeRailScope === normalizedAnalysisScope) {
      return {
        granularity:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.chart
            ? resolvedBaselineRailFastPackage.chart.granularity
            : overviewShellWorkspace?.analytics.sender_activity_timeline_granularity || 'month',
        items:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.chart
            ? resolvedBaselineRailFastPackage.chart.items
            : overviewShellWorkspace?.analytics.sender_activity_timeline.map((item) => ({
                label: item.label,
                count: item.sender_count,
              })) || [],
        overallActivity:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.metrics
            ? resolvedBaselineRailFastPackage.metrics.overallActivity
            : timeContextOverallActivityMetric,
        activityMix:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.metrics
            ? resolvedBaselineRailFastPackage.metrics.activityMix
            : timeContextActivityMixMetric,
        patternSignal:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.metrics
            ? resolvedBaselineRailFastPackage.metrics.patternSignal
            : timeContextPatternSignalMetric,
        nextAction:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.metrics
            ? resolvedBaselineRailFastPackage.metrics.nextAction
            : timeContextNextAction,
        bodyOverride:
          resolvedBaselineRailFastPackage?.state === 'ready' && resolvedBaselineRailFastPackage.chart
            ? null
            : activeRailBodyOverride,
        sourceLabel:
          resolvedBaselineRailFastPackage?.sourceLabel ||
          activeRailFastPackage?.sourceLabel ||
          hydratedOverviewRailSourceLabel,
        state:
          resolvedBaselineRailFastPackage?.state === 'ready' ? 'ready' : currentRailState,
        scopeStatus: buildSenderOverviewRailScopeStatus({
          activeScope: activeRailScope,
          baselineScope: normalizedAnalysisScope,
          workflowScope: effectiveWorkflowScope,
          state:
            resolvedBaselineRailFastPackage?.state === 'ready' ? 'ready' : currentRailState,
        }),
      }
    }

    if (activeRailFastPackage?.state === 'ready' && activeRailFastPackage.chart && activeRailFastPackage.metrics) {
      return {
        granularity: activeRailFastPackage.chart.granularity,
        items: activeRailFastPackage.chart.items,
        overallActivity: activeRailFastPackage.metrics.overallActivity,
        activityMix: activeRailFastPackage.metrics.activityMix,
        patternSignal: activeRailFastPackage.metrics.patternSignal,
        nextAction: activeRailFastPackage.metrics.nextAction,
        bodyOverride: null,
        sourceLabel: activeRailFastPackage.sourceLabel,
        state: activeRailFastPackage.state,
        scopeStatus: buildSenderOverviewRailScopeStatus({
          activeScope: activeRailScope,
          baselineScope: normalizedAnalysisScope,
          workflowScope: effectiveWorkflowScope,
          state: activeRailFastPackage.state,
        }),
      }
    }

    const unavailableState = activeRailFastPackage?.state || 'unavailable_scope'
    const activeScopeLabel = analysisScopeControlLabel(activeRailScope)
    const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const broaderScopeLabel = suggestedBroaderRailScope
      ? analysisScopeControlLabel(suggestedBroaderRailScope)
      : null
    const activeClusterTitle =
      activeRailFastPackage?.clusterTitle ||
      selectedCluster?.title ||
      missingScopedClusterName ||
      'This cleanup group'

    if (unavailableState === 'outside_timeframe') {
      return {
        granularity: 'month' as const,
        items: [],
        overallActivity: {
          value: 'Not active here',
          detail: `${activeClusterTitle} exists, but it is not visible in ${activeScopeLabel}.`,
        },
        activityMix: {
          value: 'Expected across windows',
          detail: 'Different timeframes surface different cleanup groups, especially in narrower windows.',
        },
        patternSignal: {
          value: 'Try a broader view',
          detail: broaderScopeLabel
            ? `${broaderScopeLabel} is the next best window to check whether this group returns.`
            : 'Compare another timeframe to see where this group becomes active.',
        },
        nextAction: {
          title: broaderScopeLabel ? `Try ${broaderScopeLabel}` : 'Try another timeframe',
          detail:
            activeRailScope !== effectiveWorkflowScope
              ? `You can also return to ${workflowScopeLabel} to get back to the workflow timeframe.`
              : 'Use the timeframe chips above to compare another window.',
        },
        bodyOverride: activeRailBodyOverride,
        sourceLabel: activeRailFastPackage?.sourceLabel || 'outside_timeframe',
        state: unavailableState,
        scopeStatus: buildSenderOverviewRailScopeStatus({
          activeScope: activeRailScope,
          baselineScope: normalizedAnalysisScope,
          workflowScope: effectiveWorkflowScope,
          state: unavailableState,
        }),
      }
    }

    return {
      granularity: 'month' as const,
      items: [],
      overallActivity: {
        value: 'Not loaded yet',
        detail: `${activeScopeLabel} has not been loaded in this session yet.`,
      },
      activityMix: {
        value: 'Try another timeframe',
        detail: 'Use the chips above or return to a timeframe you have already viewed.',
      },
      patternSignal: {
        value: 'No data shown yet',
        detail: 'This rail stays in place, but it cannot show activity details for this timeframe yet.',
      },
      nextAction: {
        title: `Return to ${workflowScopeLabel}`,
        detail: broaderScopeLabel
          ? `If you want to keep exploring, you can also try ${broaderScopeLabel}.`
          : 'Choose another timeframe chip to continue.',
      },
      bodyOverride: activeRailBodyOverride,
      sourceLabel: activeRailFastPackage?.sourceLabel || 'unavailable_scope',
      state: unavailableState,
      scopeStatus: buildSenderOverviewRailScopeStatus({
        activeScope: activeRailScope,
        baselineScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        state: unavailableState,
      }),
    }
  }, [
    activeRailBodyOverride,
    activeRailFastPackage,
    activeRailScope,
    effectiveWorkflowScope,
    hydratedOverviewRailSourceLabel,
    missingScopedClusterName,
    normalizedAnalysisScope,
    overviewShellWorkspace,
    resolvedBaselineRailFastPackage,
    selectedCluster?.title,
    suggestedBroaderRailScope,
    timeContextActivityMixMetric,
    timeContextNextAction,
    timeContextOverallActivityMetric,
    timeContextPatternSignalMetric,
  ])
  const workflowScopeSummary = useMemo(() => {
    const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const pageScopeLabel = analysisScopeControlLabel(normalizedAnalysisScope)

    if (effectiveWorkflowScope === normalizedAnalysisScope) {
      return {
        label: 'Workflow scope matches page',
        detail: `${pageScopeLabel} is driving the sender workflow, coverage, and Decision Mode queue.`,
        badgeClassName: 'border-emerald-700/45 bg-emerald-950/20 text-emerald-100',
      }
    }

    return {
      label: `Workflow filtered to ${workflowScopeLabel}`,
      detail: `${workflowScopeLabel} is driving the sender workflow, coverage, and Decision Mode queue while charts stay anchored to ${pageScopeLabel}.`,
      badgeClassName: 'border-cyan-700/55 bg-cyan-950/20 text-cyan-100',
    }
  }, [effectiveWorkflowScope, normalizedAnalysisScope])
  const workflowScopeCompareOnlyNote = useMemo(() => {
    if (activeRailScope === effectiveWorkflowScope) return null
    const activeScopeLabel = analysisScopeControlLabel(activeRailScope)
    if (activeRailFastPackage?.state === 'outside_timeframe') {
      return `${activeScopeLabel} stays comparison-only because this cleanup group is not active in that timeframe.`
    }
    if (activeRailFastPackage?.state === 'unavailable_scope') {
      return `${activeScopeLabel} stays comparison-only because that timeframe has not been loaded for this cleanup group yet.`
    }
    return null
  }, [activeRailFastPackage?.state, activeRailScope, effectiveWorkflowScope])
  // Phase 2 keeps tab state local-only while promoting Sender Distribution to the primary rail lens.
  const [activeSharedAnalysisRailTab, setActiveSharedAnalysisRailTab] =
    useState<SharedAnalysisRailTab>('sender_distribution')

  const semanticPresentationPolicy = useMemo(
    () => buildGmailSemanticPresentationPolicy(overviewShellWorkspace?.analytics.semantic_rollup || null),
    [overviewShellWorkspace?.analytics.semantic_rollup]
  )
  const semanticRowModel = semanticPresentationPolicy.semanticRow
  const groupInternalStructure = useMemo(
    () =>
      selectedCluster
        ? buildCleanupGroupInternalStructure(
            selectedCluster.clusterId,
            overviewShellWorkspace?.analytics.semantic_rollup || null
          )
        : null,
    [overviewShellWorkspace?.analytics.semantic_rollup, selectedCluster]
  )
  const isReviewUnitActive = subsetSource === 'review_unit'
  const [expandedSemanticMixFamilies, setExpandedSemanticMixFamilies] = useState<
    Record<string, boolean>
  >({})
  const defaultExpandedSemanticFamilies = useMemo(
    () =>
      semanticRowModel.primaryFamilyRows.reduce<Record<string, boolean>>((accumulator, row) => {
        if (row.defaultExpanded) {
          accumulator[row.id] = true
        }
        return accumulator
      }, {}),
    [semanticRowModel.primaryFamilyRows]
  )
  const seededSemanticExpansionKeyRef = useRef<string | null>(null)
  const requestedSemanticFocusKey = useMemo(() => {
    const family = requestedSemanticFamily?.trim()
    const subtype = requestedSemanticSubtype?.trim()
    if (!family || !subtype) return null
    return `${selectedCluster?.clusterId || 'no-cluster'}::${family}::${subtype}`
  }, [requestedSemanticFamily, requestedSemanticSubtype, selectedCluster?.clusterId])
  const appliedRequestedSemanticFocusRef = useRef<string | null>(null)
  const [semanticFocusOrientationActive, setSemanticFocusOrientationActive] = useState(false)
  const [semanticFocusOrientationKey, setSemanticFocusOrientationKey] = useState(0)
  const overviewBridgeCopy = useMemo(() => {
    const roleLabel = selectedCluster
      ? getCleanupGroupLaneLabel(selectedCluster.clusterId)
      : 'Primary action lane'
    if (selectedCluster?.clusterId === 'needs-review-senders') {
      return {
        whyThisGroupExists:
          `${roleLabel}. Low-evidence senders stay visible here when the system does not yet have enough safe history to place them confidently in a stronger lane.`,
        reviewApproach:
          'Use an evidence-first approach. Move carefully and do not assume this group reflects one coherent semantic bucket or a normal momentum pass.',
      }
    }
    if (semanticPresentationPolicy.mode === 'structural_only') {
      if (selectedCluster?.clusterId === 'protected-trusted-senders') {
        return {
          whyThisGroupExists:
            `${roleLabel}. This group keeps protected or human-priority traffic visible so it does not disappear from review.`,
          reviewApproach:
            'Review senders carefully. This is a cautious coverage pass, not a default cleanup starting point.',
        }
      }
      if (selectedCluster?.clusterId === 'historical-out-of-inbox-senders') {
        return {
          whyThisGroupExists:
            `${roleLabel}. This group keeps senders with no current inbox rows visible for coverage and context.`,
          reviewApproach:
            'Use this as a careful coverage pass for out-of-inbox senders, not as a default cleanup starting point.',
        }
      }
      return {
        whyThisGroupExists:
          `${roleLabel}. This group stays visible for caution and completeness while you review senders one by one.`,
        reviewApproach:
          'Review senders carefully. Treat this as a cautious coverage pass rather than a default cleanup starting point.',
      }
    }
    if (semanticPresentationPolicy.mode === 'structural_backlog') {
      return {
        whyThisGroupExists:
          `${roleLabel}. This group collects older or low-attention senders so you can work backlog deliberately, one sender at a time.`,
        reviewApproach:
          'Work the biggest visible senders first. Check recent proof before deciding, because a backlog lane can still contain useful traffic.',
      }
    }
    return {
      whyThisGroupExists:
        `${roleLabel}. This group brings together senders that mostly behave the same way, so you can use it as a normal sender-first cleanup pass.`,
      reviewApproach:
        'Use this as a normal cleanup pass. Start with the strongest visible senders, then use the sender card to confirm the pattern before deciding.',
    }
  }, [selectedCluster, semanticPresentationPolicy.mode])

  const updateSemanticSubtypeFocus = useCallback(
    (
      nextFocus: SemanticSubtypeFocus | null,
      changeReason: SemanticFocusChangeReason = 'system'
    ) => {
      const currentFocusId = activeSemanticSubtypeFocusRef.current?.id || null
      const nextFocusId = nextFocus?.id || null
      const shouldAnnounceSelection =
        changeReason === 'direct_select' && nextFocusId != null && nextFocusId !== currentFocusId

      semanticFocusRefocusPendingRef.current = shouldAnnounceSelection
      if (shouldAnnounceSelection) {
        setSemanticFocusOrientationKey((current) => current + 1)
      }
      setActiveSemanticSubtypeFocus(nextFocus)
      if (requestedSenderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE || !selectedCluster) return
      startTransition(() => {
        router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: null,
          clusterId: selectedCluster.clusterId,
          subsetSource,
          subsetValue,
          senderPage: null,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      requestedSenderPage,
      router,
      selectedCluster,
      sessionId,
      subsetSource,
      subsetValue,
    ]
  )
  const clearMarketingReviewUnitSelection = useCallback(() => {
    if (!isMarketingReviewUnitRouteActive) return
    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: null,
            subsetValue: null,
            semanticFocus: null,
          }),
          clusterId: selectedCluster?.clusterId || clusterId,
          mode,
          senderPage: null,
        }),
        { scroll: false }
      )
    })
  }, [
    agentId,
    analysisScope,
    clusterId,
    isMarketingReviewUnitRouteActive,
    mode,
    router,
    selectedCluster?.clusterId,
    sessionId,
    workflowScopeForOverviewContext,
  ])
  const handleSemanticFocusBackAction = useCallback(() => {
    if (isMarketingReviewUnitRouteActive) {
      clearMarketingReviewUnitSelection()
      return
    }
    updateSemanticSubtypeFocus(null, 'clear')
  }, [
    clearMarketingReviewUnitSelection,
    isMarketingReviewUnitRouteActive,
    updateSemanticSubtypeFocus,
  ])

  const applySemanticSubtypeFocus = useCallback(
    (familyRow: SemanticFamilyRowPresentation, child: SemanticFamilyChildPresentation) => {
      const nextFocus =
        renderedSemanticSubtypeFocus?.id === child.id
          ? null
          : {
              id: child.id,
              label: child.label,
              family: child.focusTarget.family,
              familyLabel: familyRow.label,
              publishedSenderCount: child.senderCount,
              publishedParentSharePct: child.parentSharePct,
              publishedGroupSharePct: child.groupSharePct,
              subtypeKey: child.focusTarget.subtypeKey,
              kind: child.focusTarget.kind,
              tone: child.tone,
              surfacedSubtypeKeys: familyRow.children
                .filter((row) => row.focusTarget.kind === 'subtype' && row.focusTarget.subtypeKey)
                .map((row) => row.focusTarget.subtypeKey as string),
            }
      updateSemanticSubtypeFocus(nextFocus, nextFocus ? 'direct_select' : 'clear')
    },
    [renderedSemanticSubtypeFocus?.id, updateSemanticSubtypeFocus]
  )

  const semanticMixChartItems = useMemo(() => {
    if (!overviewShellWorkspace) return []

    const familyRowsById = new Map<string, SemanticFamilyRowPresentation>(
      semanticRowModel.primaryFamilyRows.map((row) => [row.id, row])
    )

    return overviewShellWorkspace.analytics.semantic_family_distribution.slice(0, 6).map((entry) => {
      const familyRow = familyRowsById.get(entry.family)
      const childItems = familyRow?.children || []
      const childItemCount = childItems.length
      const activeFamilyFocus = renderedSemanticSubtypeFocus?.family === entry.family
      const childItemsExpanded = activeFamilyFocus || Boolean(expandedSemanticMixFamilies[entry.family])

      return {
        id: entry.family,
        label: semanticFamilyLabel(entry.family),
        value: entry.share_pct,
        valueLabel: formatPercent(entry.share_pct),
        supportLabel: `${entry.sender_count.toLocaleString()} sender${
          entry.sender_count === 1 ? '' : 's'
        } in this group`,
        accentClass: semanticFamilyAccentClass(entry.family),
        active: activeFamilyFocus,
        childItems: childItems.map((child) => ({
          id: child.id,
          label: child.label,
          value: child.parentSharePct,
          valueLabel: `${formatPercent(child.parentSharePct)} of family`,
          supportLabel: `${formatPercent(child.groupSharePct)} of group · ${child.senderCount.toLocaleString()} sender${
            child.senderCount === 1 ? '' : 's'
          }`,
          accentClass: semanticFamilyChildAccentClass(entry.family, child.tone),
          active: renderedSemanticSubtypeFocus?.id === child.id,
          onClick: familyRow ? () => applySemanticSubtypeFocus(familyRow, child) : undefined,
        })),
        childItemsLabel:
          childItemCount > 0
            ? `${childItemCount.toLocaleString()} subtype${childItemCount === 1 ? '' : 's'}`
            : undefined,
        childItemsExpanded,
        onToggleChildItems:
          childItemCount > 0
            ? () => {
                setExpandedSemanticMixFamilies((current) => {
                  const next = { ...current }
                  const shouldExpand = !childItemsExpanded && !activeFamilyFocus
                  if (shouldExpand) {
                    next[entry.family] = true
                  } else {
                    delete next[entry.family]
                  }
                  return next
                })
                if (activeFamilyFocus) {
                  updateSemanticSubtypeFocus(null, 'clear')
                }
              }
            : undefined,
      }
    })
  }, [
    applySemanticSubtypeFocus,
    expandedSemanticMixFamilies,
    overviewShellWorkspace,
    renderedSemanticSubtypeFocus,
    semanticRowModel.primaryFamilyRows,
    updateSemanticSubtypeFocus,
  ])
  const groupReviewUnitStarters = useMemo(() => {
    if (groupReviewUnits.length === 0) return []

    return groupReviewUnits
      .map((unit) => {
        const familyRow = semanticRowModel.primaryFamilyRows.find(
          (row) => row.id === unit.semanticFamily
        )
        if (!familyRow) return null
        const focus = buildSemanticSubtypeFocusFromPublishedReviewUnit({
          unit,
          familyRow,
        })
        if (!focus) return null
        return {
          id: unit.id,
          label: unit.label,
          guidance: unit.guidance,
          active: renderedSemanticSubtypeFocus?.id === focus.id,
          onClick: () =>
            updateSemanticSubtypeFocus(
              renderedSemanticSubtypeFocus?.id === focus.id ? null : focus,
              renderedSemanticSubtypeFocus?.id === focus.id ? 'clear' : 'direct_select'
            ),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }, [
    groupReviewUnits,
    renderedSemanticSubtypeFocus?.id,
    semanticRowModel.primaryFamilyRows,
    updateSemanticSubtypeFocus,
  ])

  const readStabilitySegments = useMemo<CompactSegmentedStripSegment[]>(() => {
    if (!overviewAnalytics) return []

    return [
      {
        key: 'clear_pattern',
        label: 'Clear pattern',
        count: overviewAnalytics.familyClearReadCount,
        accentClass: 'bg-emerald-500',
      },
      {
        key: 'mixed_pattern',
        label: 'Mixed pattern',
        count: overviewAnalytics.familyMixedReadCount,
        accentClass: 'bg-amber-400',
      },
      {
        key: 'limited_history',
        label: 'Limited history',
        count: overviewAnalytics.familyThinHistoryReadCount,
        accentClass: 'bg-slate-400',
      },
    ]
  }, [overviewAnalytics])

  useEffect(() => {
    activeSemanticSubtypeFocusRef.current = activeSemanticSubtypeFocus
  }, [activeSemanticSubtypeFocus])

  useEffect(() => {
    if (semanticFocusOrientationKey === 0) return
    setSemanticFocusOrientationActive(true)
    const timeoutId = window.setTimeout(() => {
      setSemanticFocusOrientationActive(false)
    }, 1400)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [semanticFocusOrientationKey])

  useEffect(() => {
    if (mode !== 'overview') {
      semanticFocusRefocusPendingRef.current = false
      return
    }
    if (!activeSemanticSubtypeFocus || !semanticFocusRefocusPendingRef.current) return

    semanticFocusRefocusPendingRef.current = false
    window.requestAnimationFrame(() => {
      const section = senderWorkflowSectionRef.current
      if (!section) return

      const threshold = window.innerHeight * 0.6
      const sectionTop = section.getBoundingClientRect().top
      if (sectionTop <= threshold) return

      section.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      })
    })
  }, [activeSemanticSubtypeFocus, mode])

  useEffect(() => {
    if (mode !== 'overview') return
    if (semanticRowModel.primaryFamilyRows.length === 0) return
    const expansionSeedKey = `${mode}:${selectedCluster?.clusterId || 'no-cluster'}`
    if (seededSemanticExpansionKeyRef.current === expansionSeedKey) return
    setExpandedSemanticMixFamilies(defaultExpandedSemanticFamilies)
    seededSemanticExpansionKeyRef.current = expansionSeedKey
  }, [defaultExpandedSemanticFamilies, mode, selectedCluster?.clusterId, semanticRowModel.primaryFamilyRows.length])

  useEffect(() => {
    if (mode !== 'overview') return
    setActiveSemanticSubtypeFocus(null)
  }, [mode, selectedCluster?.clusterId, subsetSource, subsetValue])

  useEffect(() => {
    if (mode !== 'overview') return
    setSemanticFocusWorkspaceState({
      status: 'idle',
      data: null,
      error: null,
    })
  }, [mode, selectedCluster?.clusterId, subsetSource, subsetValue])

  useEffect(() => {
    if (mode !== 'overview') return
    const storedContext = readDecisionWorkflowStorage<DecisionOverviewReturnContext>(
      overviewReturnContextStorageKey
    )
    if (!storedContext) return
    const storedRouteContext = resolveAuthoritativeOverviewReturnContext({
      semanticFocus: storedContext.semanticFocus,
      activeSubset: null,
      subsetSource: storedContext.subsetSource,
      subsetValue: storedContext.subsetValue,
    })
    const storedSenderPage =
      typeof storedContext.senderPage === 'number' &&
      Number.isFinite(storedContext.senderPage) &&
      storedContext.senderPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE
        ? Math.round(storedContext.senderPage)
        : DEFAULT_OVERVIEW_WORKSPACE_PAGE

    if (
      storedContext.semanticFocus &&
      (subsetSource != null || subsetValue != null) &&
      selectedCluster
    ) {
      startTransition(() => {
        router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: null,
          clusterId: selectedCluster.clusterId,
          subsetSource: null,
          subsetValue: null,
          senderPage: storedSenderPage,
          }),
          { scroll: false }
        )
      })
      return
    }

    if (
      storedRouteContext.subsetSource !== subsetSource ||
      storedRouteContext.subsetValue !== subsetValue ||
      storedSenderPage !== requestedSenderPage
    ) {
      return
    }

    if (!semanticSubtypeFocusesEqual(activeSemanticSubtypeFocus, storedContext.semanticFocus)) {
      setActiveSemanticSubtypeFocus(storedContext.semanticFocus)
    }
    if (typeof window !== 'undefined' && storedContext.scrollTop != null) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: storedContext.scrollTop as number, behavior: 'auto' })
      })
    }
    writeDecisionWorkflowStorage(overviewReturnContextStorageKey, null)
  }, [
    activeSemanticSubtypeFocus,
    agentId,
    analysisScope,
    clusterId,
    mode,
    overviewReturnContextStorageKey,
    router,
    requestedSenderPage,
    selectedCluster,
    sessionId,
    subsetSource,
    subsetValue,
  ])

  useEffect(() => {
    if (mode !== 'overview') return
    if (!requestedSemanticFocusKey) return
    if (appliedRequestedSemanticFocusRef.current === requestedSemanticFocusKey) return

    appliedRequestedSemanticFocusRef.current = requestedSemanticFocusKey
    if (activeSemanticSubtypeFocus) return

    const requestedFamily = requestedSemanticFamily?.trim()
    const requestedSubtype = requestedSemanticSubtype?.trim()
    if (!requestedFamily || !requestedSubtype) return

    const familyRow = semanticRowModel.primaryFamilyRows.find((row) => row.id === requestedFamily)
    if (!familyRow) return

    const matchedChild = familyRow.children.find((child) =>
      requestedSubtype === 'remainder'
        ? child.focusTarget.kind === 'remainder'
        : child.focusTarget.kind === 'subtype' && child.focusTarget.subtypeKey === requestedSubtype
    )
    if (!matchedChild) return

    setExpandedSemanticMixFamilies((current) => ({
      ...current,
      [familyRow.id]: true,
    }))
    setActiveSemanticSubtypeFocus({
      id: matchedChild.id,
      label: matchedChild.label,
      family: matchedChild.focusTarget.family,
      familyLabel: familyRow.label,
      publishedSenderCount: matchedChild.senderCount,
      publishedParentSharePct: matchedChild.parentSharePct,
      publishedGroupSharePct: matchedChild.groupSharePct,
      subtypeKey: matchedChild.focusTarget.subtypeKey,
      kind: matchedChild.focusTarget.kind,
      tone: matchedChild.tone,
      surfacedSubtypeKeys: familyRow.children
        .filter((row) => row.focusTarget.kind === 'subtype' && row.focusTarget.subtypeKey)
        .map((row) => row.focusTarget.subtypeKey as string),
    })
  }, [
    activeSemanticSubtypeFocus,
    mode,
    requestedSemanticFamily,
    requestedSemanticFocusKey,
    requestedSemanticSubtype,
    semanticRowModel.primaryFamilyRows,
  ])
  const appliedReviewUnitFocusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isReviewUnitActive || !activeReviewUnit) {
      if (
        appliedReviewUnitFocusRef.current &&
        activeSemanticSubtypeFocus?.id === appliedReviewUnitFocusRef.current
      ) {
        setActiveSemanticSubtypeFocus(null)
      }
      appliedReviewUnitFocusRef.current = null
      return
    }

    if (!activeReviewUnit.semanticFamily) return
    const familyRow = semanticRowModel.primaryFamilyRows.find(
      (row) => row.id === activeReviewUnit.semanticFamily
    )
    if (!familyRow) return

    const nextFocus = buildSemanticSubtypeFocusFromPublishedReviewUnit({
      unit: activeReviewUnit,
      familyRow,
    })
    if (!nextFocus) return

    appliedReviewUnitFocusRef.current = nextFocus.id
    setExpandedSemanticMixFamilies((current) => ({
      ...current,
      [familyRow.id]: true,
    }))
    if (!semanticSubtypeFocusesEqual(activeSemanticSubtypeFocus, nextFocus)) {
      setActiveSemanticSubtypeFocus(nextFocus)
    }
  }, [
    activeReviewUnit,
    activeSemanticSubtypeFocus,
    isReviewUnitActive,
    semanticRowModel.primaryFamilyRows,
  ])

  const activeReviewUnitSemanticFocus = useMemo(
    () =>
      activeReviewUnit ? buildSemanticFocusFromPublishedReviewUnit(activeReviewUnit) : null,
    [activeReviewUnit]
  )
  const activeReviewUnitFallbackFamily = useMemo(
    () => groupReviewUnits.find((unit) => unit.semanticFamily)?.semanticFamily || null,
    [groupReviewUnits]
  )
  const activeReviewUnitFallbackFamilyLabel = useMemo(
    () =>
      activeReviewUnitFallbackFamily
        ? gmailSemanticFamilyDisplayLabel(activeReviewUnitFallbackFamily)
        : null,
    [activeReviewUnitFallbackFamily]
  )
  const activeReviewUnitSpilloverFamilies = useMemo(() => {
    if (!activeReviewUnit || activeReviewUnit.sourceKind !== 'spillover') return []

    const dominantFamily = activeReviewUnitFallbackFamily
    const familyDistribution = selectedClusterSemanticRollup?.family_distribution || []
    if (!dominantFamily || familyDistribution.length === 0) return []

    return familyDistribution
      .map((entry) => entry.family)
      .filter(
        (family, index, families): family is WorkspaceSender['semantic_family']['family'] =>
          Boolean(family) &&
          family !== dominantFamily &&
          families.indexOf(family) === index
      )
  }, [activeReviewUnit, activeReviewUnitFallbackFamily, selectedClusterSemanticRollup])
  const activeReviewUnitNeedsFallbackWorkspace = Boolean(
    isReviewUnitActive && activeReviewUnit && !activeReviewUnitSemanticFocus
  )
  const activeSemanticSubtypeFocusRequest = useMemo(
    () =>
      activeSemanticSubtypeFocus
        ? buildSemanticSubtypeFocusRequest(activeSemanticSubtypeFocus)
        : null,
    [activeSemanticSubtypeFocus]
  )
  const semanticFocusWorkspaceOrdering = useMemo(
    () => senderWorkspaceOrderingForDrilldownSort(drilldownSort),
    [drilldownSort]
  )
  const semanticFocusPageSize = isReviewUnitActive
    ? MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE
    : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE

  useEffect(() => {
    if (!isMarketingReviewUnitRouteActive || !selectedCluster || !activeReviewUnit) {
      setMarketingReviewUnitTruthState({
        status: 'idle',
        data: null,
        error: null,
      })
      return
    }

    let cancelled = false
    setMarketingReviewUnitTruthState({
      status: 'loading',
      data: null,
      error: null,
    })

    void (async () => {
      let collectedSenders: WorkspaceSender[] = []

      if (activeReviewUnitSemanticFocus) {
        const result = await collectWorkspaceSendersForSemanticFocus({
          selectedCluster,
          allClusters: runtimeClusters,
          analysisScope,
          cacheVersion,
          semanticFocus: activeReviewUnitSemanticFocus,
          ordering: semanticFocusWorkspaceOrdering,
          agentId,
          requestReason: 'sender_overview_marketing_review_unit_truth',
        })

        if (cancelled) return
        if ('aborted' in result) return
        if (!result.ok) {
          setMarketingReviewUnitTruthState({
            status: 'error',
            data: null,
            error: result.error,
          })
          return
        }

        collectedSenders = result.senders
      } else if (
        activeReviewUnit.sourceKind === 'spillover' &&
        activeReviewUnitSpilloverFamilies.length > 0
      ) {
        const spilloverSenders = new Map<string, WorkspaceSender>()

        for (const family of activeReviewUnitSpilloverFamilies) {
          const result = await collectWorkspaceSendersForSemanticFocus({
            selectedCluster,
            allClusters: runtimeClusters,
            analysisScope,
            cacheVersion,
            semanticFocus: {
              family,
              kind: 'family',
              subtypeKey: null,
              surfacedSubtypeKeys: [],
            },
            ordering: semanticFocusWorkspaceOrdering,
            agentId,
            requestReason: 'sender_overview_marketing_review_unit_truth_spillover_family',
          })

          if (cancelled) return
          if ('aborted' in result) return
          if (!result.ok) {
            setMarketingReviewUnitTruthState({
              status: 'error',
              data: null,
              error: result.error,
            })
            return
          }

          for (const sender of result.senders) {
            if (!spilloverSenders.has(sender.sender_key)) {
              spilloverSenders.set(sender.sender_key, sender)
            }
          }
        }

        collectedSenders = Array.from(spilloverSenders.values())
          .filter((sender) =>
            senderMatchesPublishedReviewUnit({
              sender,
              unit: activeReviewUnit,
              dominantSemanticFamily: activeReviewUnitFallbackFamily,
            })
          )
          .sort((left, right) =>
            compareWorkspaceSendersByOrdering(left, right, semanticFocusWorkspaceOrdering)
          )
      }

      if (cancelled) return

      setMarketingReviewUnitTruthState({
        status: 'ready',
        data: {
          senders: collectedSenders,
          senderTotalMatchesUnit:
            collectedSenders.length === Math.max(activeReviewUnit.senderCount, 0),
        },
        error: null,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [
    activeReviewUnit,
    activeReviewUnitFallbackFamily,
    activeReviewUnitSemanticFocus,
    activeReviewUnitSpilloverFamilies,
    agentId,
    analysisScope,
    cacheVersion,
    isMarketingReviewUnitRouteActive,
    runtimeClusters,
    selectedCluster,
    semanticFocusWorkspaceOrdering,
  ])

  useEffect(() => {
    if (mode !== 'overview' && !isReviewUnitActive) return
    const requestedSemanticFocus = activeReviewUnitSemanticFocus || activeSemanticSubtypeFocusRequest
    if (!selectedCluster || (!requestedSemanticFocus && !activeReviewUnitNeedsFallbackWorkspace)) {
      setSemanticFocusWorkspaceState({
        status: 'idle',
        data: null,
        error: null,
      })
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setSemanticFocusWorkspaceState((current) => ({
      status: 'loading',
      data: current.data,
      error: null,
    }))

    void (async () => {
      const result = await fetchGmailSenderWorkspace({
        selectedCluster,
        allClusters: runtimeClusters,
        analysisScope,
        cacheVersion,
        includeClusterSenderKeys: false,
        page: activeReviewUnitNeedsFallbackWorkspace ? DEFAULT_OVERVIEW_WORKSPACE_PAGE : requestedSenderPage,
        pageSize: semanticFocusPageSize,
        sort: semanticFocusWorkspaceOrdering.sort,
        direction: semanticFocusWorkspaceOrdering.direction,
        semanticFocus: requestedSemanticFocus,
        requestContext: {
          source: 'operations_review_page',
          component: 'sender_overview',
          reason: 'sender_overview_semantic_subtype_focus',
          phase: 'interactive',
          agentId,
        },
      })
      if (cancelled || ('aborted' in result && result.aborted)) return
      if (!result.ok) {
        setSemanticFocusWorkspaceState((current) => ({
          status: 'error',
          data: current.data,
          error: result.error,
        }))
        return
      }

      let nextData = result.data

      if (activeReviewUnitNeedsFallbackWorkspace && activeReviewUnit) {
        if (
          activeReviewUnit.sourceKind === 'spillover' &&
          activeReviewUnitSpilloverFamilies.length > 0
        ) {
          const spilloverSenders = new Map<string, WorkspaceSender>()

          for (const family of activeReviewUnitSpilloverFamilies) {
            let familyPage = DEFAULT_OVERVIEW_WORKSPACE_PAGE
            let familyTotalPages = DEFAULT_OVERVIEW_WORKSPACE_PAGE

            while (familyPage <= familyTotalPages) {
              const familyResult = await fetchGmailSenderWorkspace({
                selectedCluster,
                allClusters: runtimeClusters,
                analysisScope,
                cacheVersion,
                includeClusterSenderKeys: false,
                page: familyPage,
                pageSize: semanticFocusPageSize,
                sort: semanticFocusWorkspaceOrdering.sort,
                direction: semanticFocusWorkspaceOrdering.direction,
                semanticFocus: {
                  family,
                  kind: 'family',
                  subtypeKey: null,
                  surfacedSubtypeKeys: [],
                },
                requestContext: {
                  source: 'operations_review_page',
                  component: 'sender_overview',
                  reason: 'sender_overview_marketing_spillover_family',
                  phase: 'interactive',
                  agentId,
                },
              })
              if (cancelled || ('aborted' in familyResult && familyResult.aborted)) return
              if (!familyResult.ok) {
                setSemanticFocusWorkspaceState((current) => ({
                  status: 'error',
                  data: current.data,
                  error: familyResult.error,
                }))
                return
              }

              familyTotalPages = Math.max(
                DEFAULT_OVERVIEW_WORKSPACE_PAGE,
                familyResult.data.pagination.total_pages || DEFAULT_OVERVIEW_WORKSPACE_PAGE
              )
              for (const sender of familyResult.data.senders) {
                if (!spilloverSenders.has(sender.sender_key)) {
                  spilloverSenders.set(sender.sender_key, sender)
                }
              }
              familyPage += 1
            }
          }

          nextData = buildPublishedReviewUnitWorkspaceFromSenders({
            parentWorkspace: result.data,
            senders: Array.from(spilloverSenders.values()).sort((left, right) =>
              compareWorkspaceSendersByOrdering(left, right, semanticFocusWorkspaceOrdering)
            ),
            requestedPage: requestedSenderPage,
            requestedPageSize: semanticFocusPageSize,
          })
        } else {
          nextData = buildPublishedReviewUnitWorkspace({
            parentWorkspace: result.data,
            unit: activeReviewUnit,
            dominantSemanticFamily: activeReviewUnitFallbackFamily,
            requestedPage: requestedSenderPage,
            requestedPageSize: semanticFocusPageSize,
          })
        }
      }

      if (cancelled) return
      setSemanticFocusWorkspaceState({
        status: 'ready',
        data: nextData,
        error: null,
      })
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    activeSemanticSubtypeFocusRequest,
    activeReviewUnit,
    activeReviewUnitFallbackFamily,
    activeReviewUnitSpilloverFamilies,
    activeReviewUnitNeedsFallbackWorkspace,
    activeReviewUnitSemanticFocus,
    agentId,
    analysisScope,
    cacheVersion,
    isReviewUnitActive,
    mode,
    requestedSenderPage,
    runtimeClusters,
    selectedCluster,
    semanticFocusPageSize,
    semanticFocusWorkspaceOrdering.direction,
    semanticFocusWorkspaceOrdering.sort,
  ])

  const activeOverviewSubset = useMemo(() => {
    if (!renderedSubsetSource || !renderedSubsetValue) return null

    const subsetBaseWorkspace =
      renderedSubsetSource === 'review_unit'
        ? semanticFocusWorkspace
        : workflowOverviewWorkspace || displayOverviewWorkspace
    const visibleSenderTotal = Math.max(subsetBaseWorkspace?.senders.length || 0, 1)
    const clusterSenderTotal = Math.max(
      workspaceClusterSenderTotal(
        subsetBaseWorkspace || overviewShellWorkspace,
        selectedCluster?.senderCount
      ),
      1
    )
    const clusterMessageTotal = Math.max(
      workspaceClusterMessageTotal(
        subsetBaseWorkspace || overviewShellWorkspace,
        selectedCluster?.messageCount
      ),
      1
    )
    let label = renderedSubsetValue
    let chartCount = 0
    let senders: WorkspaceSender[] = []
    let sourceSummary = ''

    if (renderedSubsetSource === 'review_unit') {
      if (!activeReviewUnit) return null
      label = activeReviewUnit.label
      chartCount = activeReviewUnit.senderCount
      senders = semanticFocusWorkspace?.senders || []
      sourceSummary =
        isMarketingCleanupGroup
          ? 'Published review unit selected from the current artifact-backed cleanup structure.'
          : 'Focused view selected from the current artifact-backed cleanup structure for this direct-open parent.'
    } else if (renderedSubsetSource === 'category') {
      if (!subsetBaseWorkspace) return null
      const categoryEntry = subsetBaseWorkspace.analytics.sender_category_distribution.find(
        (entry) => entry.label === renderedSubsetValue
      )
      label = categoryEntry?.label || renderedSubsetValue
      chartCount = categoryEntry?.sender_count || 0
      senders = subsetBaseWorkspace.senders.filter(
        (sender) => senderPrimaryCanonicalCategory(sender) === label
      )
      sourceSummary =
        'Senders grouped by their dominant canonical Gmail category from indexed sender history.'
    } else if (renderedSubsetSource === 'composition') {
      if (!subsetBaseWorkspace) return null
      const signalValue =
        renderedSubsetValue === 'likely_machine_generated' ||
        renderedSubsetValue === 'likely_human' ||
        renderedSubsetValue === 'uncertain'
          ? renderedSubsetValue
          : null
      if (!signalValue) return null
      label = labelForSenderSignal(signalValue)
      chartCount = subsetBaseWorkspace.senders.filter((sender) => sender.sender_signal === signalValue).length
      senders = subsetBaseWorkspace.senders.filter((sender) => sender.sender_signal === signalValue)
      sourceSummary =
        'Senders grouped by exclusive sender-history heuristic buckets across the loaded sender set.'
    } else {
      if (!subsetBaseWorkspace) return null
      const contributorEntry = subsetBaseWorkspace.analytics.cluster_contribution.find(
        (entry) => entry.sender_key === renderedSubsetValue
      )
      const matchingSender =
        subsetBaseWorkspace.senders.find((sender) => sender.sender_key === renderedSubsetValue) || null
      label = contributorEntry?.sender || matchingSender?.sender || renderedSubsetValue
      chartCount = matchingSender ? 1 : contributorEntry ? 1 : 0
      senders = subsetBaseWorkspace.senders.filter(
        (sender) => sender.sender_key === renderedSubsetValue
      )
      sourceSummary = isFocusedSenderSubsetSource(renderedSubsetSource)
        ? renderedSubsetSource === 'distribution'
          ? 'Focused sender selected from the Sender Distribution rail for this cleanup group.'
          : 'High-impact sender pulled from the top contributor list for this cleanup group.'
        : 'Focused sender selected inside this cleanup group.'
    }

    const loadedCount = senders.length
    const messageCount = senders.reduce((sum, sender) => sum + sender.cleanup_group_message_count, 0)
    const unreadCount = senders.reduce((sum, sender) => sum + sender.unread_count, 0)
    const verificationCount = senders.filter((sender) => sender.requires_verification).length
    const protectedCount = senders.filter((sender) => Boolean(sender.protected_hint)).length
    const managedCount = senders.filter((sender) => Boolean(managedBySender[sender.sender_key])).length
    const eligibleCount = Math.max(loadedCount - managedCount, 0)
    const automatedCount = senders.filter(
      (sender) => sender.sender_signal === 'likely_machine_generated'
    ).length
    const humanCount = senders.filter((sender) => sender.sender_signal === 'likely_human').length
    const mixedCount = senders.filter((sender) => sender.sender_signal === 'uncertain').length
    const dominantSignalCandidates: Array<[WorkspaceSender['sender_signal'], number]> = [
      ['likely_machine_generated', automatedCount],
      ['likely_human', humanCount],
      ['uncertain', mixedCount],
    ]
    const dominantSignal =
      dominantSignalCandidates.sort((left, right) => right[1] - left[1])[0]?.[0] || 'uncertain'
    const dominantSignalLabel = labelForSenderSignal(dominantSignal)
    const dominantCategory =
      Object.entries(
        senders.reduce<Record<string, number>>((map, sender) => {
          const category = senderPrimaryCanonicalCategory(sender)
          map[category] = (map[category] || 0) + 1
          return map
        }, {})
      ).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ||
      'Mixed categories'
    const latestActivity =
      senders
        .slice()
        .sort((left, right) => dateSortValue(right.last_activity) - dateSortValue(left.last_activity))[0]
        ?.last_activity || null
    const largestVisibleSender =
      senders
        .slice()
        .sort(
          (left, right) =>
            right.cleanup_group_message_count - left.cleanup_group_message_count ||
            left.sender.localeCompare(right.sender)
        )[0] || null
    const shareOfClusterSenders =
      renderedSubsetSource === 'review_unit' && activeReviewUnit
        ? activeReviewUnit.groupSharePct
        : ratioPercent(chartCount || loadedCount, clusterSenderTotal)
    const shareOfVisibleSenders = ratioPercent(loadedCount, visibleSenderTotal)
    const loadedCoverageNote =
      renderedSubsetSource === 'review_unit'
        ? chartCount > loadedCount
          ? `Showing ${loadedCount.toLocaleString()} loaded senders from ${chartCount.toLocaleString()} senders in this ${reviewUnitNoun}.`
          : `${loadedCount.toLocaleString()} loaded senders currently match this ${reviewUnitNoun}.`
        : chartCount > loadedCount
          ? `Showing ${loadedCount.toLocaleString()} loaded senders from ${chartCount.toLocaleString()} senders in this segment.`
          : `${loadedCount.toLocaleString()} loaded senders currently match this segment.`
    const messageShareText =
      renderedSubsetSource === 'review_unit'
        ? `${formatPercent(shareOfClusterSenders)} of group senders`
        : isFocusedSenderSubsetSource(renderedSubsetSource) && overviewAnalytics
        ? overviewAnalytics.contributionItems.find((item) => item.id === renderedSubsetValue)?.detail ||
          `${formatPercent(ratioPercent(messageCount, clusterMessageTotal))} of group messages`
        : `${formatPercent(ratioPercent(messageCount, clusterMessageTotal))} of group messages`

    let whyItMatters = ''
    let reviewGuidance = ''
    let actionStyle = ''

    if (renderedSubsetSource === 'review_unit' && activeReviewUnit) {
      whyItMatters = isMarketingCleanupGroup
        ? activeReviewUnit.sourceKind === 'spillover' && activeReviewUnitFallbackFamilyLabel
          ? `${label} is the published spillover review unit for senders that sit outside ${activeReviewUnitFallbackFamilyLabel}, covering ${formatPercent(
              shareOfClusterSenders
            )} of group senders from current artifact truth.`
          : `${label} is a published review unit inside this cleanup group, covering ${formatPercent(
              shareOfClusterSenders
            )} of group senders from current artifact truth.`
        : `${label} is a focused view inside this cleanup group, covering ${formatPercent(
            shareOfClusterSenders
          )} of group senders from current artifact truth.`
      reviewGuidance =
        isMarketingCleanupGroup &&
        activeReviewUnit.sourceKind === 'spillover' &&
        activeReviewUnitFallbackFamilyLabel
          ? `Use this spillover unit as the bounded pass for senders that stay inside Marketing subscriptions but fall outside ${activeReviewUnitFallbackFamilyLabel}.`
          : activeReviewUnit.guidance
      actionStyle =
        isMarketingCleanupGroup
          ? activeReviewUnit.sourceKind === 'spillover'
            ? 'This review unit is session-only. The rows below are already scoped to the spillover sender universe without reopening the full Marketing parent.'
            : 'This review unit is session-only. It narrows the current review queue without creating a new cleanup group.'
          : 'This focused view is session-only. It narrows the current sender list without creating a new cleanup group.'
    } else if (renderedSubsetSource === 'category') {
      whyItMatters = `${formatPercent(shareOfClusterSenders)} of the cleanup group sits in this category lane, with ${messageShareText.toLowerCase()}.`
      if (dominantSignal === 'likely_machine_generated' && verificationCount === 0 && protectedCount === 0) {
        reviewGuidance = 'Fast lane. Most senders in this dominant canonical category lane sit in the Likely automated sender-history bucket and carry few caution signals, so Archive decisions should be easier to make quickly.'
      } else if (dominantSignal === 'likely_human') {
        reviewGuidance = 'Caution lane. Likely human senders dominate this category, so Keep or Quarantine decisions are more likely than broad Archive calls.'
      } else {
        reviewGuidance = 'Mixed lane. Expect a split between Keep Some, Quarantine, and Archive depending on the Unclear sender-history bucket and the preview evidence.'
      }
      actionStyle =
        verificationCount || protectedCount
          ? 'Start with the highest-impact sender rows and pause on protected or verification-heavy entries.'
          : 'Review this subset from highest-impact senders downward to bank quick wins without leaving Overview.'
    } else if (renderedSubsetSource === 'composition') {
      whyItMatters = `${formatPercent(shareOfVisibleSenders)} of the loaded sender set falls into this exclusive sender-history bucket.`
      if (renderedSubsetValue === 'likely_machine_generated') {
        reviewGuidance =
          verificationCount || protectedCount
            ? 'Mostly fast lane, but not blind lane. Push through obvious senders in the Likely automated bucket first, then slow down for protected or verification-heavy senders.'
            : 'Best fast-lane subset. These senders are in the Likely automated bucket, which usually makes review more straightforward.'
        actionStyle = 'Use this subset when you want a narrow, high-momentum starting pass before tackling Unclear senders.'
      } else if (renderedSubsetValue === 'likely_human') {
        reviewGuidance = 'Human-heavy caution lane. These senders are in the Likely human bucket and are more likely to deserve Keep or Not Sure, so read evidence before committing.'
        actionStyle = 'Treat message previews as supporting evidence and avoid assuming that volume alone means Archive.'
      } else {
        reviewGuidance = 'Unclear lane. Expect edge cases, category overlap, and more Custom Rule or Quarantine outcomes.'
        actionStyle = 'Good subset for deliberate review when you want to surface ambiguous senders before Management.'
      }
    } else {
      whyItMatters = `${label} is a single high-impact sender inside this cleanup group, representing ${messageShareText.toLowerCase()}.`
      if (largestVisibleSender?.requires_verification || largestVisibleSender?.protected_hint) {
        reviewGuidance = 'High-impact caution. One decision here changes the group meaningfully, so read the evidence before choosing Archive.'
      } else if (largestVisibleSender?.sender_signal === 'likely_machine_generated') {
        reviewGuidance = 'High-impact easy win. This sender drives visible volume and sits in the Likely automated bucket, so it is a strong candidate for a focused first decision.'
      } else if (largestVisibleSender?.sender_signal === 'likely_human') {
        reviewGuidance = 'High-impact but Likely human. Review carefully before making a broad Archive call.'
      } else {
        reviewGuidance = 'High-impact but Unclear. Keep Some or Quarantine may fit better than a blunt archive decision.'
      }
      actionStyle = 'Use this lane when you want to inspect the biggest single lever in the group before committing to full review.'
    }

    return {
      source: renderedSubsetSource,
      value: renderedSubsetValue,
      label,
      laneLabel:
        renderedSubsetSource === 'review_unit'
          ? reviewUnitSurfaceLabel
          : sortLabelForSubsetSource(renderedSubsetSource),
      chartCount: chartCount || loadedCount,
      loadedCount,
      shareOfClusterSenders,
      shareOfVisibleSenders,
      senders,
      messageCount,
      unreadCount,
      verificationCount,
      protectedCount,
      managedCount,
      eligibleCount,
      dominantSignal,
      dominantSignalLabel,
      dominantCategory,
      latestActivity,
      largestVisibleSender,
      loadedCoverageNote,
      sourceSummary,
      whyItMatters,
      reviewGuidance,
      actionStyle,
      messageShareText,
    }
  }, [
    activeReviewUnit,
    activeReviewUnitFallbackFamilyLabel,
    displayOverviewWorkspace,
    managedBySender,
    overviewShellWorkspace,
    overviewAnalytics,
    renderedSubsetSource,
    renderedSubsetValue,
    selectedCluster?.messageCount,
    selectedCluster?.senderCount,
    semanticFocusWorkspace,
    workflowOverviewWorkspace,
  ])
  const hasSubsetRouteContext = Boolean(renderedSubsetSource && renderedSubsetValue)
  const activeOverviewSubsetRouteContext = useMemo(
    () =>
      activeOverviewSubset
        ? {
            source: activeOverviewSubset.source,
            value: activeOverviewSubset.value,
          }
        : renderedSubsetSource && renderedSubsetValue
          ? {
              source: renderedSubsetSource,
              value: renderedSubsetValue,
            }
          : null,
    [activeOverviewSubset, renderedSubsetSource, renderedSubsetValue]
  )
  const overviewLoadedPage =
    workflowOverviewWorkspace?.pagination.page ||
    (effectiveWorkflowScope === normalizedAnalysisScope
      ? overviewShellWorkspace?.pagination.page || null
      : null)
  const overviewKnownTotalPages = Math.max(
    workflowOverviewWorkspace?.pagination.total_pages ||
      (effectiveWorkflowScope === normalizedAnalysisScope
        ? overviewShellWorkspace?.pagination.total_pages || 1
        : 1),
    1
  )
  const isOverviewSenderPageTransitionLoading = Boolean(
    mode === 'overview' &&
      (workflowOverviewWorkspace != null ||
        (effectiveWorkflowScope === normalizedAnalysisScope && overviewShellWorkspace != null)) &&
      workspaceState.status === 'loading' &&
      overviewLoadedPage != null &&
      overviewLoadedPage !== requestedSenderPage
  )
  const isSemanticFocusPageTransitionLoading = Boolean(
    mode === 'overview' &&
      renderedSemanticSubtypeFocus &&
      semanticFocusWorkspaceState.status === 'loading'
  )
  const isSenderWorkflowInlineLoading =
    isOverviewSenderPageTransitionLoading || isSemanticFocusPageTransitionLoading
  const senderWorkflowPagerClassName = 'w-full sm:max-w-[24rem] sm:ml-auto'
  const subsetBannerContext = useMemo(() => {
    if (!renderedSubsetSource || !renderedSubsetValue) return null
    if (activeOverviewSubset) {
      return {
        laneLabel: activeOverviewSubset.laneLabel,
        label: activeOverviewSubset.label,
        whyItMatters: activeOverviewSubset.whyItMatters,
        messageShareText: activeOverviewSubset.messageShareText,
        loadedCount: activeOverviewSubset.loadedCount,
        eligibleCount: activeOverviewSubset.eligibleCount,
      }
    }

    if (renderedSubsetSource === 'review_unit') {
      return {
        laneLabel: reviewUnitSurfaceLabel,
        label: activeReviewUnit?.label || reviewUnitSurfaceLabel,
        whyItMatters:
          isMarketingCleanupGroup
            ? activeReviewUnit?.sourceKind === 'spillover' && activeReviewUnitFallbackFamilyLabel
              ? `This spillover review unit stays inside the same parent cleanup group while isolating the senders outside ${activeReviewUnitFallbackFamilyLabel}.`
              : 'This review unit stays inside the same parent cleanup group and only narrows the session queue.'
            : 'This focused view stays inside the same parent cleanup group and only narrows the current sender list.',
        messageShareText: activeReviewUnit
          ? `${activeReviewUnit.targetLabel} · ${activeReviewUnit.groupSharePct}% of group senders`
          : `${reviewUnitSurfaceLabel} active`,
        loadedCount: null,
        eligibleCount: null,
      }
    }

    const fallbackContributorLabel =
      overviewAnalytics?.contributionItems.find((item) => item.id === renderedSubsetValue)?.label ||
      renderedSubsetValue
    const fallbackLabel =
      renderedSubsetSource === 'composition'
        ? labelForSenderSignal(
            renderedSubsetValue === 'likely_machine_generated' ||
              renderedSubsetValue === 'likely_human' ||
              renderedSubsetValue === 'uncertain'
              ? renderedSubsetValue
              : 'uncertain'
          )
        : isFocusedSenderSubsetSource(renderedSubsetSource)
          ? fallbackContributorLabel
          : renderedSubsetValue

    return {
      laneLabel: sortLabelForSubsetSource(renderedSubsetSource),
      label: fallbackLabel,
      whyItMatters:
        'This view stays centered on the selected subset while matching senders load in.',
      messageShareText: `Subset active · showing matches from page ${requestedSenderPage} of ${overviewKnownTotalPages}`,
      loadedCount: null,
      eligibleCount: null,
    }
  }, [
    activeReviewUnit,
    activeReviewUnitFallbackFamilyLabel,
    activeOverviewSubset,
    isMarketingCleanupGroup,
    overviewAnalytics,
    overviewKnownTotalPages,
    requestedSenderPage,
    renderedSubsetSource,
    renderedSubsetValue,
    reviewUnitSurfaceLabel,
  ])
  const authoritativeOverviewReturnContext = useMemo(
    () =>
      resolveAuthoritativeOverviewReturnContext({
        semanticFocus: activeSemanticSubtypeFocus,
        activeSubset: activeOverviewSubsetRouteContext,
        subsetSource,
        subsetValue,
      }),
    [
      activeOverviewSubsetRouteContext,
      activeSemanticSubtypeFocus,
      subsetSource,
      subsetValue,
    ]
  )
  const reviewPopulation = useMemo(() => {
    if (activeOverviewSubset) return activeOverviewSubset.senders
    if (workflowOverviewWorkspace) return workflowOverviewWorkspace.senders
    return []
  }, [activeOverviewSubset, workflowOverviewWorkspace])

  const eligibleSenders = useMemo(() => {
    return reviewPopulation.filter((sender) => !managedBySender[sender.sender_key])
  }, [managedBySender, reviewPopulation])
  const provisionalDecisionSeedSenderKey = useMemo(() => {
    const visibleSeedSender =
      reviewPopulation.find((sender) => !managedBySender[sender.sender_key]) || null
    if (visibleSeedSender) return visibleSeedSender.sender_key
    if (!displayOverviewWorkspace) return null
    return (
      displayOverviewWorkspace.senders.find((sender) => !managedBySender[sender.sender_key])
        ?.sender_key || null
    )
  }, [displayOverviewWorkspace, managedBySender, reviewPopulation])
  const fullAuthoritativeWorkflowSenderKeys = useMemo(() => {
    const candidateCollections = [
      decisionQueueSenderKeys,
      workspaceClusterGlobalSenderKeys(workflowCoverageWorkspace || null),
      workspaceClusterGlobalSenderKeys(workflowOverviewWorkspace || null),
      workspaceClusterGlobalSenderKeys(displayOverviewWorkspace || null),
      workspaceClusterGlobalSenderKeys(overviewShellWorkspace || null),
      workspaceClusterGlobalSenderKeys(workspace || null),
    ]
    for (const senderKeys of candidateCollections) {
      if (senderKeys.length > 0) return senderKeys
    }
    return reviewPopulation.map((sender) => sender.sender_key)
  }, [
    decisionQueueSenderKeys,
    displayOverviewWorkspace,
    overviewShellWorkspace,
    reviewPopulation,
    workflowCoverageWorkspace,
    workflowOverviewWorkspace,
    workspace,
  ])
  const decisionOrderedSenderKeys = useMemo(() => {
    if (activeOverviewSubset) return activeOverviewSubset.senders.map((sender) => sender.sender_key)
    if (decisionQueueSenderKeys.length > 0) return decisionQueueSenderKeys
    return reviewPopulation.map((sender) => sender.sender_key)
  }, [activeOverviewSubset, decisionQueueSenderKeys, reviewPopulation])
  const sharedWorkflowSubset = useMemo<SharedWorkflowSubsetContract>(() => {
    const parentClusterId =
      selectedCluster?.clusterId || requestedClusterId || rawRequestedClusterId || null
    const routeSubset = activeOverviewSubsetRouteContext
    const detachedWorkflowScopeActive = effectiveWorkflowScope !== normalizedAnalysisScope
    const focusedSenderSubsetActive = isFocusedSenderSubsetSource(routeSubset?.source)
    const baseLabel =
      cleanupGroupDisplayTitle({
        clusterId: selectedCluster?.canonicalClusterId || selectedCluster?.clusterId || parentClusterId,
        title: selectedCluster?.title || null,
      }) ||
      (parentClusterId ? cleanupGroupDisplayTitle({ clusterId: parentClusterId }) : null) ||
      humanizeCleanupGroupId(parentClusterId)
    const orderedSenderKeys = focusedSenderSubsetActive
      ? fullAuthoritativeWorkflowSenderKeys
      : activeOverviewSubset
        ? activeOverviewSubset.senders.map((sender) => sender.sender_key)
        : decisionOrderedSenderKeys
    const focusedSenderKey = focusedSenderSubsetActive
      ? activeOverviewSubset?.senders[0]?.sender_key || routeSubset?.value || null
      : null
    const kind: SharedWorkflowSubsetKind = focusedSenderSubsetActive
      ? 'focused_sender'
      : activeOverviewSubset
        ? 'derived_workflow_scope'
        : detachedWorkflowScopeActive
          ? 'derived_workflow_scope'
          : 'base_cluster'
    const populationMode: SharedWorkflowSubsetPopulationMode = focusedSenderSubsetActive
      ? 'focused_sender_only'
      : activeOverviewSubset
        ? 'route_subset_filtered'
        : detachedWorkflowScopeActive
          ? 'workflow_scope_filtered'
          : 'cluster_full'

    return {
      kind,
      parentClusterId,
      analysisScope: normalizedAnalysisScope,
      activeWorkflowScope: normalizedRequestedWorkflowScope,
      authoritativeScope: effectiveWorkflowScope,
      populationMode,
      orderedSenderKeys,
      focusedSenderKey,
      label: focusedSenderSubsetActive
        ? activeOverviewSubset?.label || routeSubset?.value || 'Focused sender'
        : activeOverviewSubset
          ? activeOverviewSubset.label
          : detachedWorkflowScopeActive
            ? `${baseLabel} · ${analysisScopeControlLabel(effectiveWorkflowScope)}`
            : baseLabel,
      source: {
        primary: focusedSenderSubsetActive
          ? 'focused_sender'
          : routeSubset
            ? 'route_subset'
            : detachedWorkflowScopeActive
              ? 'workflow_scope'
              : 'page_scope',
        workflowScope: normalizedRequestedWorkflowScope,
        routeSubset,
        semanticFocus: activeSemanticSubtypeFocus
          ? {
              id: activeSemanticSubtypeFocus.id,
              family: activeSemanticSubtypeFocus.family,
              subtypeKey: activeSemanticSubtypeFocus.subtypeKey,
              kind: activeSemanticSubtypeFocus.kind,
              label: activeSemanticSubtypeFocus.label,
            }
          : null,
      },
    }
  }, [
    activeOverviewSubset,
    activeOverviewSubsetRouteContext,
    activeSemanticSubtypeFocus,
    decisionOrderedSenderKeys,
    effectiveWorkflowScope,
    fullAuthoritativeWorkflowSenderKeys,
    normalizedAnalysisScope,
    normalizedRequestedWorkflowScope,
    rawRequestedClusterId,
    requestedClusterId,
    selectedCluster?.canonicalClusterId,
    selectedCluster?.clusterId,
    selectedCluster?.title,
  ])
  const authoritativeWorkflowSenderKeys = sharedWorkflowSubset.orderedSenderKeys
  const senderDistributionBaselineKey = useMemo(
    () =>
      [
        selectedCluster?.clusterId || requestedClusterId || rawRequestedClusterId || 'no-cluster',
        effectiveWorkflowScope,
      ].join('::'),
    [effectiveWorkflowScope, rawRequestedClusterId, requestedClusterId, selectedCluster?.clusterId]
  )
  const [senderDistributionWorkspaceState, setSenderDistributionWorkspaceState] =
    useState<SenderDistributionWorkspaceState>({
      status: 'idle',
      data: null,
      error: null,
    })
  const senderDistributionDedicatedFetchCluster = marketingReviewUnitEntryState
    ? null
    : effectiveWorkflowSelectedCluster || selectedCluster || null
  const senderDistributionCachedData = useMemo(() => {
    if (!senderDistributionDedicatedFetchCluster) {
      return null
    }
    return readCachedGmailSenderDistribution({
      selectedCluster: senderDistributionDedicatedFetchCluster,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
    })
  }, [
    cacheVersion,
    effectiveWorkflowScope,
    senderDistributionDedicatedFetchCluster,
  ])

  useEffect(() => {
    if (!senderDistributionDedicatedFetchCluster) {
      setSenderDistributionWorkspaceState((current) =>
        current.status === 'idle' && current.data == null && current.error == null
          ? current
          : { status: 'idle', data: null, error: null }
      )
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setSenderDistributionWorkspaceState({
      status: 'loading',
      data: senderDistributionCachedData,
      error: null,
    })

    void (async () => {
      let attempt = 0
      while (!cancelled) {
        const result = await fetchGmailSenderDistribution({
          selectedCluster: senderDistributionDedicatedFetchCluster,
          analysisScope: effectiveWorkflowScope,
          cacheVersion,
          requestContext: {
            source: 'operations_review_page',
            component: 'sender_distribution',
            reason: 'sender_distribution_chart',
            phase: 'interactive',
            agentId,
          },
        })
        if (cancelled || ('aborted' in result && result.aborted)) return
        if (!result.ok) {
          if (attempt < 5 && isTransientInboxAnalysisGuardError(result.error)) {
            attempt += 1
            await delayMs(1200)
            continue
          }
          setSenderDistributionWorkspaceState((current) => ({
            status: 'error',
            data: current.data,
            error: result.error,
          }))
          return
        }
        setSenderDistributionWorkspaceState({
          status: 'ready',
          data: result.data,
          error: null,
        })
        return
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    agentId,
    cacheVersion,
    effectiveWorkflowScope,
    senderDistributionBaselineKey,
    senderDistributionCachedData,
    senderDistributionDedicatedFetchCluster,
  ])

  const senderDistributionTotalRankedSenders = authoritativeWorkflowSenderKeys.length
  const senderDistributionData = senderDistributionWorkspaceState.data
  const senderDistributionGroupMessageTotal = Math.max(
    senderDistributionData?.selected_cluster.message_count || 0,
    1
  )
  const senderDistributionSenderLookup = useMemo(() => {
    const lookup = new Map<string, GmailSenderDistributionData['senders'][number]>()
    for (const sender of senderDistributionData?.senders || []) {
      if (!lookup.has(sender.sender_key)) {
        lookup.set(sender.sender_key, sender)
      }
    }
    return lookup
  }, [senderDistributionData?.senders])
  const senderDistributionMissingOrderAuthority = authoritativeWorkflowSenderKeys.length === 0
  const senderDistributionMissingOrderedKeys = useMemo(() => {
    if (senderDistributionMissingOrderAuthority) return []
    return authoritativeWorkflowSenderKeys.filter(
      (senderKey) => !senderDistributionSenderLookup.has(senderKey)
    )
  }, [
    authoritativeWorkflowSenderKeys,
    senderDistributionMissingOrderAuthority,
    senderDistributionSenderLookup,
  ])
  const senderDistributionCanRender =
    !senderDistributionMissingOrderAuthority &&
    authoritativeWorkflowSenderKeys.length > 0 &&
    senderDistributionMissingOrderedKeys.length === 0
  const senderDistributionItems = useMemo(() => {
    if (!senderDistributionCanRender) return []

    return authoritativeWorkflowSenderKeys
      .map((senderKey, index) => {
        const sender = senderDistributionSenderLookup.get(senderKey)
        if (!sender) return null
        const absoluteRank = index + 1
        const sharePct = ratioPercent(
          sender.cleanup_group_message_count,
          senderDistributionGroupMessageTotal
        )

        return {
          senderKey,
          label: sender.sender,
          rank: absoluteRank,
          sharePct,
          messageCount: sender.cleanup_group_message_count,
          messageCountLabel: `${sender.cleanup_group_message_count.toLocaleString()} message${
            sender.cleanup_group_message_count === 1 ? '' : 's'
          }`,
          shareLabel: `${formatPercent(sharePct)} of group`,
          rankLabel: `#${absoluteRank}`,
          supportLabel: `${labelForSenderSignal(sender.sender_signal)} · ${sender.unread_count.toLocaleString()} unread`,
          active: sharedWorkflowSubset.focusedSenderKey === senderKey,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [
    authoritativeWorkflowSenderKeys,
    senderDistributionCanRender,
    senderDistributionGroupMessageTotal,
    senderDistributionSenderLookup,
    sharedWorkflowSubset.focusedSenderKey,
  ])
  const senderDistributionScopeStatus = useMemo(
    () =>
      buildSenderDistributionRailScopeStatus({
        activeScope: activeRailScope,
        baselineScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        comparisonState:
          activeRailScope === effectiveWorkflowScope
            ? 'ready'
            : activeRailFastPackage?.state || 'unavailable_scope',
      }),
    [
      activeRailFastPackage?.state,
      activeRailScope,
      effectiveWorkflowScope,
      normalizedAnalysisScope,
    ]
  )
  const senderDistributionOrderingErrorMessage = useMemo(() => {
    if (senderDistributionWorkspaceState.status === 'loading') return null
    if (senderDistributionMissingOrderAuthority) {
      return 'Authoritative sender order is not ready for this scope yet.'
    }
    if (senderDistributionMissingOrderedKeys.length > 0) {
      return 'Sender distribution is incomplete for the current authoritative scope.'
    }
    return null
  }, [
    senderDistributionMissingOrderAuthority,
    senderDistributionMissingOrderedKeys.length,
    senderDistributionWorkspaceState.status,
  ])
  const senderDistributionLoading =
    senderDistributionItems.length === 0 &&
    senderDistributionWorkspaceState.status === 'loading'
  const senderDistributionUpdating =
    senderDistributionItems.length > 0 &&
    senderDistributionWorkspaceState.status === 'loading'
  const senderDistributionErrorMessage =
    senderDistributionItems.length === 0
      ? senderDistributionOrderingErrorMessage ||
        (senderDistributionWorkspaceState.status === 'error'
          ? senderDistributionWorkspaceState.error
          : null)
      : null
  const decisionEligibleSenderKeys = useMemo(
    () => authoritativeWorkflowSenderKeys.filter((senderKey) => !managedBySender[senderKey]),
    [authoritativeWorkflowSenderKeys, managedBySender]
  )
  const guidedDecisionSenderKey = decisionEligibleSenderKeys[0] || null
  const activeDecisionSenderKey = useMemo(() => {
    if (mode !== 'decision') return null
    if (decisionOverlayIntent === 'inspect') {
      return decisionInspectRequestedSenderKey || decisionInspectEntryContext?.senderKey || null
    }
    if (requestedDecisionSenderKey) {
      if (
        authoritativeWorkflowSenderKeys.length === 0 ||
        authoritativeWorkflowSenderKeys.includes(requestedDecisionSenderKey)
      ) {
        return requestedDecisionSenderKey
      }
    }
    if (sharedWorkflowSubset.kind === 'focused_sender' && sharedWorkflowSubset.focusedSenderKey) {
      return sharedWorkflowSubset.focusedSenderKey
    }
    if (guidedDecisionSenderKey) return guidedDecisionSenderKey
    return provisionalDecisionSeedSenderKey
  }, [
    decisionInspectEntryContext?.senderKey,
    decisionInspectRequestedSenderKey,
    authoritativeWorkflowSenderKeys,
    decisionOverlayIntent,
    guidedDecisionSenderKey,
    mode,
    provisionalDecisionSeedSenderKey,
    requestedDecisionSenderKey,
    sharedWorkflowSubset.focusedSenderKey,
    sharedWorkflowSubset.kind,
  ])
  const activeReviewUnitDecisionPageSize = useMemo(() => {
    if (activeOverviewSubset?.source !== 'review_unit') return null
    return Math.max(
      1,
      semanticFocusWorkspace?.pagination.page_size || DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE
    )
  }, [activeOverviewSubset?.source, semanticFocusWorkspace?.pagination.page_size])
  const activeReviewUnitDecisionPage = useMemo(() => {
    if (activeOverviewSubset?.source !== 'review_unit') return null
    return Math.max(
      DEFAULT_OVERVIEW_WORKSPACE_PAGE,
      semanticFocusWorkspace?.pagination.page || requestedSenderPage
    )
  }, [
    activeOverviewSubset?.source,
    requestedSenderPage,
    semanticFocusWorkspace?.pagination.page,
  ])
  const activeReviewUnitDecisionTotalPages = useMemo(() => {
    if (activeOverviewSubset?.source !== 'review_unit') return null
    const pageSize = Math.max(
      1,
      semanticFocusWorkspace?.pagination.page_size || DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE
    )
    const reportedTotalPages = semanticFocusWorkspace?.pagination.total_pages || 0
    const derivedTotalPages = Math.ceil(Math.max(activeOverviewSubset.chartCount, 0) / pageSize)
    return Math.max(DEFAULT_OVERVIEW_WORKSPACE_PAGE, reportedTotalPages, derivedTotalPages)
  }, [
    activeOverviewSubset?.chartCount,
    activeOverviewSubset?.source,
    semanticFocusWorkspace?.pagination.page_size,
    semanticFocusWorkspace?.pagination.total_pages,
  ])
  const activeReviewUnitDecisionPosition = useMemo(() => {
    if (!activeDecisionSenderKey || activeOverviewSubset?.source !== 'review_unit') return null
    const index = authoritativeWorkflowSenderKeys.indexOf(activeDecisionSenderKey)
    if (index < 0) return null
    const page = Math.max(
      DEFAULT_OVERVIEW_WORKSPACE_PAGE,
      semanticFocusWorkspace?.pagination.page || requestedSenderPage
    )
    const pageSize = Math.max(
      1,
      semanticFocusWorkspace?.pagination.page_size || DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE
    )
    return (page - 1) * pageSize + index + 1
  }, [
    activeDecisionSenderKey,
    activeOverviewSubset?.source,
    authoritativeWorkflowSenderKeys,
    requestedSenderPage,
    semanticFocusWorkspace?.pagination.page,
    semanticFocusWorkspace?.pagination.page_size,
  ])
  const marketingReviewUnitHasNextDecisionPage = Boolean(
    mode === 'decision' &&
      isMarketingReviewUnitRouteActive &&
      activeOverviewSubset?.source === 'review_unit' &&
      activeReviewUnitDecisionPage != null &&
      activeReviewUnitDecisionTotalPages != null &&
      activeReviewUnitDecisionPage < activeReviewUnitDecisionTotalPages
  )
  const decisionProgress = useMemo(
    () => ({
      total: activeOverviewSubset
        ? activeOverviewSubset.source === 'review_unit'
          ? activeMarketingReviewUnitTruth?.senderTotal ?? activeOverviewSubset.chartCount
          : reviewPopulation.length
        : workspaceClusterSenderTotal(
            workflowCoverageWorkspace || workspace,
            selectedCluster?.senderCount
          ),
      managed: activeOverviewSubset
        ? activeOverviewSubset.source === 'review_unit'
          ? isMarketingReviewUnitRouteActive &&
            activeMarketingReviewUnitTruth?.coverageReady &&
            activeMarketingReviewUnitTruth.managedCount != null
            ? activeMarketingReviewUnitTruth.managedCount
            : Math.max(
                activeReviewUnitDecisionPosition != null
                  ? activeReviewUnitDecisionPosition - 1
                  : 0,
                authoritativeWorkflowSenderKeys.filter((senderKey) =>
                  Boolean(managedBySender[senderKey])
                ).length
              )
          : Math.max(reviewPopulation.length - eligibleSenders.length, 0)
        : clusterManagedCount ?? 0,
      remaining: activeOverviewSubset
        ? activeOverviewSubset.source === 'review_unit'
          ? isMarketingReviewUnitRouteActive &&
            activeMarketingReviewUnitTruth?.coverageReady &&
            activeMarketingReviewUnitTruth.remainingCount != null
            ? activeMarketingReviewUnitTruth.remainingCount
            : Math.max(
                activeOverviewSubset.chartCount -
                  Math.max(
                    activeReviewUnitDecisionPosition != null
                      ? activeReviewUnitDecisionPosition - 1
                      : 0,
                    authoritativeWorkflowSenderKeys.filter((senderKey) =>
                      Boolean(managedBySender[senderKey])
                    ).length
                  ),
                0
              )
          : eligibleSenders.length
        : Math.max(
            workspaceClusterSenderTotal(
              workflowCoverageWorkspace || workspace,
              selectedCluster?.senderCount
            ) -
              (clusterManagedCount ?? 0),
            0
          ),
    }),
    [
      activeMarketingReviewUnitTruth,
      activeOverviewSubset,
      activeReviewUnitDecisionPosition,
      authoritativeWorkflowSenderKeys,
      clusterManagedCount,
      eligibleSenders.length,
      isMarketingReviewUnitRouteActive,
      managedBySender,
      reviewPopulation.length,
      selectedCluster?.senderCount,
      workflowCoverageWorkspace,
      workspace,
    ]
  )
  const scopedDecisionQueueLoading = Boolean(
    mode === 'decision' &&
      activeOverviewSubset &&
      activeOverviewSubset.chartCount > 0 &&
      activeOverviewSubset.loadedCount === 0
  )
  const decisionCurrentPosition = useMemo(() => {
    if (!activeDecisionSenderKey) return null
    const index = authoritativeWorkflowSenderKeys.indexOf(activeDecisionSenderKey)
    if (index < 0) return null
    if (activeOverviewSubset?.source === 'review_unit' && activeReviewUnitDecisionPosition != null) {
      return activeReviewUnitDecisionPosition
    }
    if (!activeOverviewSubset && decisionQueueSenderKeys.length === 0) {
      const pageWorkspace = workflowOverviewWorkspace || displayOverviewWorkspace
      const pageSize = Math.max(
        1,
        pageWorkspace?.pagination.page_size || DECISION_QUEUE_WORKSPACE_PAGE_SIZE
      )
      return (Math.max(decisionTargetPage, DEFAULT_OVERVIEW_WORKSPACE_PAGE) - 1) * pageSize + index + 1
    }
    return index + 1
  }, [
    activeDecisionSenderKey,
    activeOverviewSubset,
    activeReviewUnitDecisionPosition,
    authoritativeWorkflowSenderKeys,
    decisionQueueSenderKeys.length,
    decisionTargetPage,
    displayOverviewWorkspace,
    workflowOverviewWorkspace,
  ])

  const currentSender = useMemo(() => {
    if (mode !== 'decision') return null
    const lookupSenderKey = activeDecisionSenderKey
    if (!lookupSenderKey) return null

    if (decisionOverlayIntent === 'inspect') {
      const inspectSnapshot =
        decisionInspectEntryContext?.senderKey === lookupSenderKey
          ? decisionInspectEntryContext.sender
          : null
      const decisionWorkspaceSender =
        workspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
      if (decisionWorkspaceSender) return decisionWorkspaceSender
      const focusedSender =
        semanticFocusWorkspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
      if (focusedSender) return focusedSender
      if (inspectSnapshot) return inspectSnapshot
      const reviewPopulationSender =
        reviewPopulation.find((sender) => sender.sender_key === lookupSenderKey) || null
      if (reviewPopulationSender) return reviewPopulationSender
      return workflowOverviewWorkspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
    }

    if (activeOverviewSubset || subsetSource || subsetValue) {
      const subsetSender =
        activeOverviewSubset?.senders.find((sender) => sender.sender_key === lookupSenderKey) ||
        null
      if (subsetSender) return subsetSender
      return reviewPopulation.find((sender) => sender.sender_key === lookupSenderKey) || null
    }

    const focusedDecisionSender =
      workspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
    if (focusedDecisionSender) return focusedDecisionSender
    const visibleOverviewSender =
      displayOverviewWorkspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
    if (visibleOverviewSender) return visibleOverviewSender
    return workflowOverviewWorkspace?.senders.find((sender) => sender.sender_key === lookupSenderKey) || null
  }, [
    activeDecisionSenderKey,
    activeOverviewSubset,
    decisionInspectEntryContext,
    decisionOverlayIntent,
    displayOverviewWorkspace,
    mode,
    reviewPopulation,
    semanticFocusWorkspace,
    workflowOverviewWorkspace,
    workspace,
    subsetSource,
    subsetValue,
  ])
  useEffect(() => {
    if (
      mode !== 'decision' ||
      !isMarketingReviewUnitRouteActive ||
      activeOverviewSubset?.source !== 'review_unit' ||
      semanticFocusWorkspaceState.status !== 'ready' ||
      activeDecisionSenderKey ||
      activeReviewUnitDecisionPage == null ||
      activeReviewUnitDecisionTotalPages == null ||
      activeReviewUnitDecisionPage >= activeReviewUnitDecisionTotalPages ||
      !selectedCluster
    ) {
      return
    }

    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource,
            subsetValue,
            semanticFocus: activeSemanticSubtypeFocusRef.current,
          }),
          clusterId: selectedCluster.clusterId,
          mode: 'decision',
          subsetSource,
          subsetValue,
          senderPage: activeReviewUnitDecisionPage + 1,
          senderKey: null,
          overlayIntent: decisionOverlayIntent,
        }),
        { scroll: false }
      )
    })
  }, [
    activeDecisionSenderKey,
    activeOverviewSubset?.source,
    activeReviewUnitDecisionPage,
    activeReviewUnitDecisionTotalPages,
    agentId,
    analysisScope,
    decisionOverlayIntent,
    isMarketingReviewUnitRouteActive,
    mode,
    router,
    selectedCluster,
    semanticFocusWorkspaceState.status,
    sessionId,
    subsetSource,
    subsetValue,
    workflowScopeForOverviewContext,
  ])
  const activeDecisionEvidenceSenderKey = useMemo(() => {
    if (mode !== 'decision') return null
    return (
      activeDecisionSenderKey ||
      decisionInspectRequestedSenderKey ||
      decisionInspectEntryContext?.senderKey ||
      requestedDecisionSenderKey ||
      null
    )
  }, [
    activeDecisionSenderKey,
    decisionInspectEntryContext?.senderKey,
    decisionInspectRequestedSenderKey,
    mode,
    requestedDecisionSenderKey,
  ])
  const renderedDecisionSender = useMemo(() => {
    if (!currentSender) return null
    return applySnippetOverrides(currentSender, snippetOverridesBySender[currentSender.sender_key])
  }, [currentSender, snippetOverridesBySender])
  const decisionVisibleEvidenceCount = renderedDecisionSender
    ? visibleEvidenceBySender[renderedDecisionSender.sender_key] || 6
    : 0
  const decisionSenderSnippetOverrides = renderedDecisionSender
    ? snippetOverridesBySender[renderedDecisionSender.sender_key]
    : undefined
  const decisionSnippetHydrationState = renderedDecisionSender
    ? snippetHydrationStateBySender[renderedDecisionSender.sender_key] || null
    : null
  const decisionEvidenceWorkspaceReady = useMemo(() => {
    if (
      mode !== 'decision' ||
      !selectedCluster ||
      !activeDecisionEvidenceSenderKey
    ) {
      return true
    }
    return workspaceSnapshotMatchesRequest({
      snapshot: decisionReadyWorkspaceSnapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode: 'decision',
      cacheVersion,
      previewEvidenceSenderKey: activeDecisionEvidenceSenderKey,
    })
  }, [
    activeDecisionEvidenceSenderKey,
    cacheVersion,
    decisionReadyWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    selectedCluster,
  ])
  const decisionEvidenceResolutionState = useMemo<'ready' | 'resolving'>(() => {
    if (!renderedDecisionSender) return 'ready'
    if (renderedDecisionSender.preview_messages.length > 0) return 'ready'
    return decisionEvidenceWorkspaceReady || workspaceState.status === 'error'
      ? 'ready'
      : 'resolving'
  }, [decisionEvidenceWorkspaceReady, renderedDecisionSender, workspaceState.status])
  useEffect(() => {
    if (mode !== 'decision' || !selectedCluster) return
    const normalizedDecisionSenderKey =
      decisionOverlayIntent === 'inspect'
        ? decisionInspectRequestedSenderKey || decisionInspectEntryContext?.senderKey || null
        : activeDecisionSenderKey
    if (
      requestedDecisionSenderKey === normalizedDecisionSenderKey &&
      requestedDecisionOverlayIntent === decisionOverlayIntent
    ) {
      return
    }

    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: authoritativeOverviewReturnContext.subsetSource,
            subsetValue: authoritativeOverviewReturnContext.subsetValue,
            semanticFocus: activeSemanticSubtypeFocusRef.current,
          }),
          clusterId: selectedCluster.clusterId,
          mode: 'decision',
          senderPage: requestedSenderPage,
          subsetSource: authoritativeOverviewReturnContext.subsetSource,
          subsetValue: authoritativeOverviewReturnContext.subsetValue,
          senderKey: normalizedDecisionSenderKey,
          overlayIntent: decisionOverlayIntent,
        }),
        { scroll: false }
      )
    })
  }, [
    activeDecisionSenderKey,
    agentId,
    analysisScope,
    decisionInspectEntryContext?.senderKey,
    decisionInspectRequestedSenderKey,
    decisionOverlayIntent,
    mode,
    requestedSenderPage,
    requestedDecisionOverlayIntent,
    requestedDecisionSenderKey,
    router,
    selectedCluster,
    sessionId,
    authoritativeOverviewReturnContext.subsetSource,
    authoritativeOverviewReturnContext.subsetValue,
    workflowScopeForOverviewContext,
  ])

  const activeSubsetDrilldownSenders = useMemo(() => {
    if (!activeOverviewSubset) return []
    return activeOverviewSubset.senders
      .slice()
      .sort((left, right) => compareDrilldownSenders(left, right, drilldownSort, managedBySender))
      .slice(0, DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE)
  }, [activeOverviewSubset, drilldownSort, managedBySender])

  const semanticFocusedDrilldownSenders = useMemo(() => {
    if (!renderedSemanticSubtypeFocus || !semanticFocusWorkspace) return []
    return semanticFocusWorkspace.senders
  }, [renderedSemanticSubtypeFocus, semanticFocusWorkspace])

  const defaultDrilldownSenders = useMemo(() => {
    if (!workflowOverviewWorkspace) return []
    return workflowOverviewWorkspace.senders
      .slice()
      .sort((left, right) => compareDrilldownSenders(left, right, drilldownSort, managedBySender))
      .slice(0, DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE)
  }, [drilldownSort, managedBySender, workflowOverviewWorkspace])

  const visibleDrilldownSenders = useMemo(() => {
    const baseSenders = renderedSemanticSubtypeFocus
      ? semanticFocusedDrilldownSenders
      : activeOverviewSubset
        ? activeSubsetDrilldownSenders
        : defaultDrilldownSenders

    return baseSenders.map((sender) =>
      applySnippetOverrides(sender, snippetOverridesBySender[sender.sender_key])
    )
  }, [
    activeOverviewSubset,
    activeSubsetDrilldownSenders,
    defaultDrilldownSenders,
    renderedSemanticSubtypeFocus,
    semanticFocusedDrilldownSenders,
    snippetOverridesBySender,
  ])
  const semanticFocusPresentation = useMemo(() => {
    if (!renderedSemanticSubtypeFocus) return null

    const liveFocusedSenderCount =
      semanticFocusWorkspaceState.status === 'ready' && semanticFocusWorkspace
        ? semanticFocusWorkspace.pagination.total_senders
        : null
    const liveCountNote =
      liveFocusedSenderCount != null &&
      liveFocusedSenderCount !== renderedSemanticSubtypeFocus.publishedSenderCount
        ? ` The live review list below currently finds ${liveFocusedSenderCount.toLocaleString()} strong match${
            liveFocusedSenderCount === 1 ? '' : 's'
          }.`
        : ''

    return {
      eyebrow: isReviewUnitActive ? reviewUnitSurfaceLabel : 'Focused view',
      title: isReviewUnitActive
        ? `${semanticFocusTitle(renderedSemanticSubtypeFocus)}`
        : semanticFocusTitle(renderedSemanticSubtypeFocus),
      selectionDetail: isReviewUnitActive
        ? `${semanticFocusSelectionDetail(renderedSemanticSubtypeFocus)} ${
            isMarketingCleanupGroup
              ? 'This stays inside the same parent cleanup group and only changes the session review scope.'
              : 'This stays inside the same parent cleanup group and only narrows the current sender list for this session.'
          }`
        : semanticFocusSelectionDetail(renderedSemanticSubtypeFocus),
      laneDetail: semanticFocusLaneDetail(renderedSemanticSubtypeFocus),
      subsetDetail: hasSubsetRouteContext && !isReviewUnitActive
        ? 'The subset above still gives context, but the rows below now show the strongest matches for this pattern across the full group.'
        : null,
      publishedCountLabel: `${renderedSemanticSubtypeFocus.publishedSenderCount.toLocaleString()} sender${
        renderedSemanticSubtypeFocus.publishedSenderCount === 1 ? '' : 's'
      } are grouped in this pattern in the overview.`,
      liveCountNote,
      focusLabel: renderedSemanticSubtypeFocus.label,
    }
  }, [
    hasSubsetRouteContext,
    isReviewUnitActive,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.status,
  ])
  const activeReviewUnitPresentation = useMemo(() => {
    if (!isReviewUnitActive || renderedSemanticSubtypeFocus || !activeReviewUnit) return null

    const liveFocusedSenderCount =
      semanticFocusWorkspaceState.status === 'ready' && semanticFocusWorkspace
        ? semanticFocusWorkspace.pagination.total_senders
        : null
    const marketingParentLabel =
      cleanupGroupDisplayTitle({
        clusterId: selectedCanonicalClusterId || MARKETING_PARENT_CANONICAL_ID,
        title: selectedCluster?.title || missingScopedClusterName || null,
      }) || 'Marketing subscriptions'
    const isMarketingSpilloverUnit =
      isMarketingCleanupGroup && activeReviewUnit.sourceKind === 'spillover'
    const liveCountNote =
      isMarketingSpilloverUnit && liveFocusedSenderCount != null
        ? ` The live review list below is already scoped to ${liveFocusedSenderCount.toLocaleString()} spillover sender${
            liveFocusedSenderCount === 1 ? '' : 's'
          }.`
        : liveFocusedSenderCount != null && liveFocusedSenderCount !== activeReviewUnit.senderCount
          ? ` The live review list below currently finds ${liveFocusedSenderCount.toLocaleString()} matching sender${
              liveFocusedSenderCount === 1 ? '' : 's'
            } inside this published unit.`
          : ''

    return {
      eyebrow: reviewUnitSurfaceLabel,
      title:
        isMarketingSpilloverUnit && activeReviewUnitFallbackFamilyLabel
          ? `${activeReviewUnit.label} outside ${activeReviewUnitFallbackFamilyLabel}`
          : activeReviewUnit.label,
      selectionDetail: isMarketingSpilloverUnit
        ? activeReviewUnitFallbackFamilyLabel
          ? `Start here with ${activeReviewUnit.label}. These senders stay inside ${marketingParentLabel} but sit outside ${activeReviewUnitFallbackFamilyLabel}, so the workflow below is already the authoritative spillover review unit.`
          : `Start here with ${activeReviewUnit.label}. The workflow below is already scoped to this spillover review unit inside ${marketingParentLabel}.`
        : isMarketingCleanupGroup
          ? `${activeReviewUnit.label} stays inside the same parent cleanup group and narrows this session queue without opening broad Marketing review.`
          : `${activeReviewUnit.label} stays inside the same parent cleanup group and narrows the current sender list for this session.`,
      publishedCountLabel: `${activeReviewUnit.senderCount.toLocaleString()} sender${
        activeReviewUnit.senderCount === 1 ? '' : 's'
      } are grouped in this published ${reviewUnitNoun} in the overview.`,
      liveCountNote,
    }
  }, [
    activeReviewUnit,
    activeReviewUnitFallbackFamilyLabel,
    isMarketingCleanupGroup,
    isReviewUnitActive,
    missingScopedClusterName,
    renderedSemanticSubtypeFocus,
    selectedCanonicalClusterId,
    selectedCluster?.title,
    reviewUnitNoun,
    reviewUnitSurfaceLabel,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.status,
  ])
  const activeReviewUnitRowLabel = useMemo(() => {
    if (!isReviewUnitActive || renderedSemanticSubtypeFocus || !activeReviewUnit) return null
    if (activeReviewUnit.sourceKind === 'spillover') return 'Spillover match'
    return `${activeReviewUnit.label} match`
  }, [activeReviewUnit, isReviewUnitActive, renderedSemanticSubtypeFocus])
  const semanticFocusBannerClassName = `rounded-2xl border p-4 shadow-[0_16px_36px_rgba(2,6,23,0.2)] transition-colors duration-300 ${
    semanticFocusOrientationActive
      ? 'border-cyan-500/55 bg-[linear-gradient(180deg,rgba(13,45,66,0.96),rgba(8,22,35,0.98))]'
      : 'border-cyan-700/45 bg-[linear-gradient(180deg,rgba(11,39,57,0.95),rgba(7,18,30,0.98))]'
  }`
  const semanticFocusBanner = semanticFocusPresentation ? (
    <div className={semanticFocusBannerClassName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            {semanticFocusPresentation.eyebrow}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {semanticFocusPresentation.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {semanticFocusPresentation.selectionDetail}
          </p>
          {semanticFocusPresentation.subsetDetail ? (
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {semanticFocusPresentation.subsetDetail}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-5 text-cyan-100/90">
            {semanticFocusPresentation.publishedCountLabel}
            {semanticFocusPresentation.liveCountNote}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSemanticFocusBackAction}
          className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
        >
          {marketingReviewUnitBackLabel}
        </button>
      </div>
    </div>
  ) : null
  const activeReviewUnitBanner = activeReviewUnitPresentation ? (
    <div className={semanticFocusBannerClassName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            {activeReviewUnitPresentation.eyebrow}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {activeReviewUnitPresentation.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {activeReviewUnitPresentation.selectionDetail}
          </p>
          <p className="mt-2 text-xs leading-5 text-cyan-100/90">
            {activeReviewUnitPresentation.publishedCountLabel}
            {activeReviewUnitPresentation.liveCountNote}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSemanticFocusBackAction}
          className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs`}
        >
          {marketingReviewUnitBackLabel}
        </button>
      </div>
    </div>
  ) : null
  const reviewUnitContextBanner = semanticFocusBanner || activeReviewUnitBanner
  const senderListCoverage = useMemo(() => {
    if (!workflowOverviewWorkspace) return null

    const visibleRowCount = visibleDrilldownSenders.length
    const loadedWorkspaceCount = workflowOverviewWorkspace.senders.length
    const clusterSenderTotal = workspaceClusterSenderTotal(
      workflowCoverageWorkspace || workflowOverviewWorkspace,
      selectedCluster?.senderCount
    )
    const pageLabel = `Page ${workflowOverviewWorkspace.pagination.page} of ${Math.max(
      workflowOverviewWorkspace.pagination.total_pages || 1,
      1
    )}`

    if (activeOverviewSubset?.source === 'review_unit' && semanticFocusWorkspace) {
      const focusedTotalCount = semanticFocusWorkspace.pagination.total_senders || activeOverviewSubset.chartCount
      const focusedPageCount = Math.max(semanticFocusWorkspace.pagination.total_pages || 1, 1)
      const focusedPage =
        semanticFocusWorkspace.pagination.page || DEFAULT_OVERVIEW_WORKSPACE_PAGE
      const focusedPageLabel = `Matching page ${focusedPage} of ${focusedPageCount}`

      return {
        summary: `${visibleRowCount.toLocaleString()} row${
          visibleRowCount === 1 ? '' : 's'
        } on screen · ${activeOverviewSubset.loadedCount.toLocaleString()} matching sender${
          activeOverviewSubset.loadedCount === 1 ? '' : 's'
        } loaded in this page · ${focusedTotalCount.toLocaleString()} in the full ${reviewUnitNoun}.`,
        detail:
          focusedTotalCount > activeOverviewSubset.loadedCount
            ? `This page shows part of this ${reviewUnitNoun}, so ${(
                focusedTotalCount - activeOverviewSubset.loadedCount
              ).toLocaleString()} matching sender${
                focusedTotalCount - activeOverviewSubset.loadedCount === 1 ? '' : 's'
              } are still offscreen.`
            : `This page already includes every matching sender in this ${reviewUnitNoun}.`,
        navigationHint:
          isMarketingReviewUnitRouteActive
            ? 'Open a sender to confirm before deciding. Choose another unit when you want a different Marketing review scope.'
            : 'Open a sender to confirm before deciding. Back to full sender list when you want the broader queue again.',
        pageLabel: focusedPageLabel,
      }
    }

    if (renderedSemanticSubtypeFocus) {
      const focusLabel = renderedSemanticSubtypeFocus.label
      const focusSelectionDetail =
        semanticFocusPresentation?.selectionDetail ||
        semanticFocusSelectionDetail(renderedSemanticSubtypeFocus)
      const focusDetail =
        semanticFocusPresentation?.laneDetail || semanticFocusLaneDetail(renderedSemanticSubtypeFocus)

      if (semanticFocusWorkspaceState.status === 'loading') {
        return {
          summary: `Refreshing ${focusLabel} matches.`,
          detail: `${focusSelectionDetail} The list below is updating in place while the rest of the page stays put.`,
          navigationHint: marketingReviewUnitBackHint,
          pageLabel: `${focusLabel} matches · Updating`,
        }
      }

      if (semanticFocusWorkspaceState.status === 'error') {
        return {
          summary: `Could not refresh ${focusLabel} matches.`,
          detail:
            semanticFocusWorkspaceState.error
              ? `The focused list did not refresh just now. ${semanticFocusWorkspaceState.error}`
              : 'The focused list did not refresh just now.',
          navigationHint: marketingReviewUnitBackHint,
          pageLabel: `${focusLabel} matches unavailable`,
        }
      }

      const focusedWorkspace = semanticFocusWorkspace
      const focusedTotalCount = focusedWorkspace?.pagination.total_senders || 0
      const focusedPageCount = focusedWorkspace?.pagination.total_pages || 1
      const focusedPage =
        focusedWorkspace?.pagination.page || DEFAULT_OVERVIEW_WORKSPACE_PAGE
      const focusedPageLabel = `Matching page ${focusedPage} of ${focusedPageCount}`
      const publishedSubtypeCount = renderedSemanticSubtypeFocus.publishedSenderCount
      const publishedCountMatchesFocused =
        publishedSubtypeCount === focusedTotalCount

      return {
        summary: `Review these first — ${visibleRowCount.toLocaleString()} strongest match${
          visibleRowCount === 1 ? '' : 'es'
        } for ${focusLabel} ${visibleRowCount === 1 ? 'is' : 'are'} on screen.`,
        detail:
          publishedCountMatchesFocused
            ? focusedTotalCount > visibleRowCount
              ? `${focusSelectionDetail} ${focusDetail} This page shows the first ${visibleRowCount.toLocaleString()} strongest match${
                  visibleRowCount === 1 ? '' : 'es'
                }.`
              : `${focusSelectionDetail} ${focusDetail}`
            : `${focusSelectionDetail} ${focusDetail} ${publishedSubtypeCount.toLocaleString()} sender${
                publishedSubtypeCount === 1 ? '' : 's'
              } are grouped in this pattern in the overview, while the live review list below currently finds ${focusedTotalCount.toLocaleString()} strong match${
                focusedTotalCount === 1 ? '' : 'es'
              }. This page shows the first ${visibleRowCount.toLocaleString()} strongest match${
                visibleRowCount === 1 ? '' : 'es'
              }.`,
        navigationHint: isMarketingReviewUnitRouteActive
          ? 'Open a sender to confirm before deciding. Choose another unit when you want a different Marketing review scope.'
          : 'Open a sender to confirm before deciding. Back to full sender list when you want the broader queue again.',
        pageLabel: `${focusedPageLabel} · ${focusLabel} matches`,
      }
    }

    if (activeOverviewSubset) {
      const segmentLoadedCount = activeOverviewSubset.loadedCount
      const segmentTotalCount = Math.max(activeOverviewSubset.chartCount, segmentLoadedCount)
      const hasSegmentRowsOutsideLoadedPage = segmentTotalCount > segmentLoadedCount

      return {
        summary: `${visibleRowCount.toLocaleString()} row${
          visibleRowCount === 1 ? '' : 's'
        } on screen · ${segmentLoadedCount.toLocaleString()} matching sender${
          segmentLoadedCount === 1 ? '' : 's'
        } loaded in this page · ${segmentTotalCount.toLocaleString()} in the full segment.`,
        detail: hasSegmentRowsOutsideLoadedPage
          ? `This page shows part of this subset, so ${(
              segmentTotalCount - segmentLoadedCount
            ).toLocaleString()} matching sender${segmentTotalCount - segmentLoadedCount === 1 ? '' : 's'} are still offscreen.`
          : 'This page already includes every matching sender in this subset.',
        navigationHint:
          'Review the rows here first, or go back to the full sender list when you want the wider queue.',
        pageLabel: `Subset active · showing matches from page ${workflowOverviewWorkspace.pagination.page} of ${Math.max(
          workflowOverviewWorkspace.pagination.total_pages || 1,
          1
        )}`,
      }
    }

    const hasRowsOutsideLoadedPage = clusterSenderTotal > loadedWorkspaceCount

    return {
      summary: `${visibleRowCount.toLocaleString()} row${
        visibleRowCount === 1 ? '' : 's'
      } on screen · ${loadedWorkspaceCount.toLocaleString()} loaded in this page · ${clusterSenderTotal.toLocaleString()} in the full group.`,
      detail: hasRowsOutsideLoadedPage
        ? `This page shows part of the group, so ${(
            clusterSenderTotal - loadedWorkspaceCount
          ).toLocaleString()} sender${clusterSenderTotal - loadedWorkspaceCount === 1 ? '' : 's'} are still offscreen.`
        : 'This page already includes every sender in this group.',
      navigationHint:
        'Review the rows here first, or use the charts above when you want a narrower view.',
      pageLabel,
    }
  }, [
    activeOverviewSubset,
    isMarketingReviewUnitRouteActive,
    renderedSemanticSubtypeFocus,
    reviewUnitNoun,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.error,
    semanticFocusWorkspaceState.status,
    semanticFocusPresentation,
    selectedCluster?.senderCount,
    visibleDrilldownSenders.length,
    workflowCoverageWorkspace,
    workflowOverviewWorkspace,
  ])
  useEffect(() => {
    if (mode !== 'overview') {
      previousOverviewPageRef.current = requestedSenderPage
      senderWorkflowPendingScrollRef.current = false
      return
    }

    const previousPage = previousOverviewPageRef.current
    if (previousPage === requestedSenderPage) return

    previousOverviewPageRef.current = requestedSenderPage
    setExpandedSenderKey(null)
    setMessagePreviewState({
      selection: null,
      status: 'idle',
      data: null,
      error: null,
    })

    if (!senderWorkflowPendingScrollRef.current) return
    senderWorkflowPendingScrollRef.current = false
    window.requestAnimationFrame(() => {
      senderWorkflowSectionRef.current?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      })
    })
  }, [mode, requestedSenderPage])
  const expandedVisibleEvidenceCount = expandedSenderKey
    ? visibleEvidenceBySender[expandedSenderKey] || OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT
    : 0
  const expandedVisibleSender = useMemo(() => {
    if (!expandedSenderKey) return null
    return visibleDrilldownSenders.find((sender) => sender.sender_key === expandedSenderKey) || null
  }, [expandedSenderKey, visibleDrilldownSenders])
  const expandedSenderSnippetOverrides = expandedSenderKey
    ? snippetOverridesBySender[expandedSenderKey]
    : undefined

  useEffect(() => {
    if (!expandedVisibleSender) return

    const visibleMessages = expandedVisibleSender.preview_messages.slice(0, expandedVisibleEvidenceCount)
    const missingMessageIds = missingSnippetMessageIds(
      visibleMessages,
      expandedSenderSnippetOverrides
    )

    if (missingMessageIds.length === 0) {
      setSnippetHydrationStateBySender((current) => {
        const currentState = current[expandedVisibleSender.sender_key]
        if (!currentState?.loading && !currentState?.error) return current
        return {
          ...current,
          [expandedVisibleSender.sender_key]: {
            loading: false,
            error: null,
          },
        }
      })
      return
    }

    let cancelled = false
    setSnippetHydrationStateBySender((current) => ({
      ...current,
      [expandedVisibleSender.sender_key]: {
        loading: true,
        error: null,
      },
    }))

    void fetchOperationsMessageSnippets({
      messageIds: missingMessageIds,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_overview',
        reason: 'sender_row_expand_snippet_hydration',
        phase: 'interactive',
      },
    })
      .then((result) => {
        if (cancelled) return

        if (!result.ok) {
          setSnippetHydrationStateBySender((current) => ({
            ...current,
            [expandedVisibleSender.sender_key]: {
              loading: false,
              error: result.error,
            },
          }))
          return
        }

        const nextOverrides = missingMessageIds.reduce<Record<string, string | null>>(
          (map, messageId) => {
            map[messageId] = null
            return map
          },
          {}
        )
        for (const message of result.data.messages) {
          nextOverrides[message.message_id] = message.snippet
        }

        setSnippetOverridesBySender((current) => ({
          ...current,
          [expandedVisibleSender.sender_key]: {
            ...(current[expandedVisibleSender.sender_key] || {}),
            ...nextOverrides,
          },
        }))
        setSnippetHydrationStateBySender((current) => ({
          ...current,
          [expandedVisibleSender.sender_key]: {
            loading: false,
            error: null,
          },
        }))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSnippetHydrationStateBySender((current) => ({
          ...current,
          [expandedVisibleSender.sender_key]: {
            loading: false,
            error:
              error instanceof Error && error.message.trim()
                ? error.message
                : 'Failed to load preview text for this sender row.',
          },
        }))
      })

    return () => {
      cancelled = true
    }
  }, [
    expandedSenderSnippetOverrides,
    expandedVisibleEvidenceCount,
    expandedVisibleSender,
  ])

  useEffect(() => {
    if (mode !== 'decision' || !renderedDecisionSender) return

    const visibleMessages = renderedDecisionSender.preview_messages.slice(0, decisionVisibleEvidenceCount)
    const missingMessageIds = missingSnippetMessageIds(
      visibleMessages,
      decisionSenderSnippetOverrides
    )

    if (missingMessageIds.length === 0) {
      setSnippetHydrationStateBySender((current) => {
        const currentState = current[renderedDecisionSender.sender_key]
        if (!currentState?.loading && !currentState?.error) return current
        return {
          ...current,
          [renderedDecisionSender.sender_key]: {
            loading: false,
            error: null,
          },
        }
      })
      return
    }

    let cancelled = false
    setSnippetHydrationStateBySender((current) => ({
      ...current,
      [renderedDecisionSender.sender_key]: {
        loading: true,
        error: null,
      },
    }))

    void fetchOperationsMessageSnippets({
      messageIds: missingMessageIds,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_decision_mode',
        reason: 'decision_sender_evidence_snippet_hydration',
        phase: 'interactive',
      },
    })
      .then((result) => {
        if (cancelled) return

        if (!result.ok) {
          setSnippetHydrationStateBySender((current) => ({
            ...current,
            [renderedDecisionSender.sender_key]: {
              loading: false,
              error: result.error,
            },
          }))
          return
        }

        const nextOverrides = missingMessageIds.reduce<Record<string, string | null>>(
          (map, messageId) => {
            map[messageId] = null
            return map
          },
          {}
        )
        for (const message of result.data.messages) {
          nextOverrides[message.message_id] = message.snippet
        }

        setSnippetOverridesBySender((current) => ({
          ...current,
          [renderedDecisionSender.sender_key]: {
            ...(current[renderedDecisionSender.sender_key] || {}),
            ...nextOverrides,
          },
        }))
        setSnippetHydrationStateBySender((current) => ({
          ...current,
          [renderedDecisionSender.sender_key]: {
            loading: false,
            error: null,
          },
        }))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSnippetHydrationStateBySender((current) => ({
          ...current,
          [renderedDecisionSender.sender_key]: {
            loading: false,
            error:
              error instanceof Error && error.message.trim()
                ? error.message
                : 'Failed to load preview text for this sender in Decision Mode.',
          },
        }))
      })

    return () => {
      cancelled = true
    }
  }, [
    decisionSenderSnippetOverrides,
    decisionVisibleEvidenceCount,
    mode,
    renderedDecisionSender,
  ])

  const updateSubsetSelection = useCallback(
    (
      nextSubset: { source: OverviewSubsetSource; value: string } | null,
      options?: { senderPage?: number | null }
    ) => {
      if (
        isMarketingReviewUnitRouteActive &&
        nextSubset?.source &&
        nextSubset.source !== 'review_unit'
      ) {
        return
      }
      if (
        subsetSource === 'review_unit' &&
        nextSubset?.source !== 'review_unit' &&
        appliedReviewUnitFocusRef.current &&
        activeSemanticSubtypeFocus?.id === appliedReviewUnitFocusRef.current
      ) {
        setActiveSemanticSubtypeFocus(null)
      }
      startTransition(() => {
        router.replace(
          buildReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: workflowScopeForOverviewContext({
              subsetSource: nextSubset?.source || null,
              subsetValue: nextSubset?.value || null,
              semanticFocus: null,
            }),
            clusterId: selectedCluster?.clusterId || clusterId,
            mode,
            subsetSource: nextSubset?.source || null,
            subsetValue: nextSubset?.value || null,
            senderPage: options?.senderPage ?? null,
          }),
          { scroll: false }
        )
      })
    },
    [
      activeSemanticSubtypeFocus?.id,
      agentId,
      analysisScope,
      clusterId,
      isMarketingReviewUnitRouteActive,
      mode,
      router,
      selectedCluster?.clusterId,
      sessionId,
      subsetSource,
      workflowScopeForOverviewContext,
    ]
  )
  const handleSubsetBackAction = useCallback(() => {
    if (isMarketingReviewUnitRouteActive) {
      clearMarketingReviewUnitSelection()
      return
    }
    updateSubsetSelection(null, {
      senderPage: isFocusedSenderSubsetSource(renderedSubsetSource)
        ? requestedSenderPage
        : null,
    })
  }, [
    clearMarketingReviewUnitSelection,
    isMarketingReviewUnitRouteActive,
    renderedSubsetSource,
    requestedSenderPage,
    updateSubsetSelection,
  ])
  const handleSenderDistributionSelect = useCallback(
    (senderKey: string) => {
      const currentlyFocused = sharedWorkflowSubset.focusedSenderKey === senderKey
      const focusedIndex = authoritativeWorkflowSenderKeys.indexOf(senderKey)
      const targetSenderPage =
        focusedIndex >= 0
          ? Math.floor(focusedIndex / DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE) + 1
          : requestedSenderPage

      updateSubsetSelection(
        currentlyFocused
          ? null
          : {
              source: 'distribution',
              value: senderKey,
            },
        {
          senderPage: currentlyFocused
            ? requestedSenderPage
            : targetSenderPage,
        }
      )
    },
    [
      authoritativeWorkflowSenderKeys,
      requestedSenderPage,
      sharedWorkflowSubset.focusedSenderKey,
      updateSubsetSelection,
    ]
  )
  const clearSenderDistributionSelection = useCallback(() => {
    updateSubsetSelection(null, {
      senderPage: requestedSenderPage,
    })
  }, [requestedSenderPage, updateSubsetSelection])
  const updateDrilldownSort = useCallback(
    (nextSort: DrilldownSort) => {
      setDrilldownSort(nextSort)
      if (requestedSenderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE || !selectedCluster) return
      startTransition(() => {
        router.replace(
          buildReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: workflowScopeForOverviewContext({
              subsetSource,
              subsetValue,
              semanticFocus: activeSemanticSubtypeFocusRef.current,
            }),
            clusterId: selectedCluster.clusterId,
            subsetSource,
            subsetValue,
            senderPage: null,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      requestedSenderPage,
      router,
      selectedCluster,
      sessionId,
      subsetSource,
      subsetValue,
      workflowScopeForOverviewContext,
    ]
  )
  const senderWorkflowPagination = useMemo<SenderWorkflowPaginationModel | null>(() => {
    if (activeOverviewSubset?.source === 'review_unit' && semanticFocusWorkspace) {
      const focusedLoadedPage = semanticFocusWorkspace.pagination.page || requestedSenderPage
      const focusedTotalPages = Math.max(semanticFocusWorkspace.pagination.total_pages || 1, 1)
      const transitionPending =
        semanticFocusWorkspaceState.status === 'loading' && focusedLoadedPage !== requestedSenderPage
      const focusedPage = transitionPending ? requestedSenderPage : focusedLoadedPage

      return {
        currentPage: focusedPage,
        totalPages: focusedTotalPages,
        statusText: `Matching page ${focusedPage} of ${focusedTotalPages}`,
        hasMultiplePages: focusedTotalPages > 1,
        canPrevious: focusedPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE,
        canNext: focusedPage < focusedTotalPages,
        transitionPending,
      }
    }

    if (renderedSemanticSubtypeFocus) {
      const focusedLoadedPage = semanticFocusWorkspace?.pagination.page || requestedSenderPage
      const focusedTotalPages = Math.max(semanticFocusWorkspace?.pagination.total_pages || 1, 1)
      const transitionPending =
        semanticFocusWorkspaceState.status === 'loading' && focusedLoadedPage !== requestedSenderPage
      const focusedPage = transitionPending ? requestedSenderPage : focusedLoadedPage

      return {
        currentPage: focusedPage,
        totalPages: focusedTotalPages,
        statusText: `Matching page ${focusedPage} of ${focusedTotalPages}`,
        hasMultiplePages: focusedTotalPages > 1,
        canPrevious: focusedPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE,
        canNext: focusedPage < focusedTotalPages,
        transitionPending,
      }
    }

    if (!workflowOverviewWorkspace && !overviewShellWorkspace) return null

    const loadedPage =
      workflowOverviewWorkspace?.pagination.page ||
      (effectiveWorkflowScope === normalizedAnalysisScope
        ? overviewShellWorkspace?.pagination.page || requestedSenderPage
        : requestedSenderPage)
    const totalPages = overviewKnownTotalPages
    const transitionPending = workspaceState.status === 'loading' && loadedPage !== requestedSenderPage
    const currentPage = transitionPending ? requestedSenderPage : loadedPage
    const statusText = hasSubsetRouteContext
      ? `Subset active · showing matches from page ${currentPage} of ${totalPages}`
      : `Page ${currentPage} of ${totalPages}`

    return {
      currentPage,
      totalPages,
      statusText,
      hasMultiplePages: totalPages > 1,
      canPrevious: currentPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE,
      canNext: currentPage < totalPages,
      transitionPending,
    }
  }, [
    effectiveWorkflowScope,
    hasSubsetRouteContext,
    normalizedAnalysisScope,
    overviewKnownTotalPages,
    overviewShellWorkspace,
    requestedSenderPage,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.status,
    workflowOverviewWorkspace,
    workspaceState.status,
  ])
  const senderWorkflowCoverageDisplay = useMemo(() => {
    if (senderListCoverage) return senderListCoverage
    if (!isSenderWorkflowInlineLoading) return null

    if (renderedSemanticSubtypeFocus) {
      return {
        summary: `Refreshing ${renderedSemanticSubtypeFocus.label} matches.`,
        detail:
          'Stay here — the focused list is updating in place while the rest of the review surface stays put.',
        navigationHint: marketingReviewUnitBackHint,
        pageLabel:
          senderWorkflowPagination?.statusText ||
          `${renderedSemanticSubtypeFocus.label} matches · Matching page ${requestedSenderPage} of ${Math.max(
            semanticFocusWorkspace?.pagination.total_pages || 1,
            1
          )}`,
      }
    }

    if (hasSubsetRouteContext) {
      return {
        summary: `Refreshing this matching list from page ${requestedSenderPage} of ${overviewKnownTotalPages}.`,
        detail:
          'This matching list is updating in place while the rest of the page stays put.',
        navigationHint:
          'Subset paging still follows the full sender list in this view.',
        pageLabel:
          senderWorkflowPagination?.statusText ||
          `Subset active · showing matches from page ${requestedSenderPage} of ${overviewKnownTotalPages}`,
      }
    }

    return {
      summary: `Loading sender rows for page ${requestedSenderPage} of ${overviewKnownTotalPages}.`,
      detail:
        'Only the lower sender workflow is refreshing. Group context above stays mounted while the next page of rows loads.',
      navigationHint:
        'Pagination stays visible so you can keep your place while the next sender page arrives.',
      pageLabel:
        senderWorkflowPagination?.statusText ||
        `Page ${requestedSenderPage} of ${overviewKnownTotalPages}`,
    }
  }, [
    hasSubsetRouteContext,
    isSenderWorkflowInlineLoading,
    overviewKnownTotalPages,
    requestedSenderPage,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace?.pagination.total_pages,
    senderListCoverage,
    senderWorkflowPagination,
  ])
  const topSummarySenderDetail = activeMarketingReviewUnitTruth
    ? topSummarySenderTotalIsLoading
      ? 'Unit-scoped sender total is loading for this review unit.'
      : 'Primary KPI for this active Marketing review unit.'
    : topSummarySenderTotalIsLoading
      ? 'Scoped sender count will appear here as soon as the current cleanup group finishes loading.'
      : 'Review is sender-first.'
  const topSummaryManagedDetail = activeMarketingReviewUnitTruth
    ? topSummaryCoverageIsLoading
      ? 'Unit-scoped managed count is loading.'
      : 'Already covered in this unit.'
    : topSummaryCoverageIsLoading
      ? 'Managed sender coverage will appear once scoped sender truth is ready.'
      : 'Already covered.'
  const topSummaryRemainingDetail = activeMarketingReviewUnitTruth
    ? topSummaryCoverageIsLoading
      ? 'Unit-scoped remaining count is loading.'
      : 'Ready for review in this unit.'
    : topSummaryCoverageIsLoading
      ? 'The count left to review will appear once the current scoped workspace is ready.'
      : 'Ready for review.'
  const topSummarySupportingDetail = activeMarketingReviewUnitTruth
    ? topSummarySupportingMessageIsLoading
      ? 'Unit-scoped message workload is loading.'
      : 'Supports sender priority inside this unit.'
    : topSummarySupportingMessageIsLoading
      ? 'Scoped supporting-message volume will appear once the current cleanup group finishes loading.'
      : 'Supports sender priority.'
  const topSummaryCoveredSendersDetail = activeMarketingReviewUnitTruth
    ? topSummaryCoverageIsLoading || topSummaryRemainingCount == null
      ? 'Unit-scoped coverage is loading for this review unit.'
      : `${topSummaryRemainingCount.toLocaleString()} sender${
          topSummaryRemainingCount === 1 ? '' : 's'
        } still remaining in this unit`
    : topSummaryRemainingCount == null
      ? 'Scoped sender coverage is loading.'
      : `${topSummaryRemainingCount.toLocaleString()} sender${
          topSummaryRemainingCount === 1 ? '' : 's'
        } still remaining`
  const showOverviewBackgroundRefreshNotice = Boolean(
    workspaceState.status === 'loading' && !isOverviewSenderPageTransitionLoading
  )
  const navigateSenderWorkflowPage = useCallback(
    (nextPage: number) => {
      if (!senderWorkflowPagination || !selectedCluster) return
      const clampedPage = Math.min(
        Math.max(DEFAULT_OVERVIEW_WORKSPACE_PAGE, nextPage),
        senderWorkflowPagination.totalPages
      )
      if (clampedPage === requestedSenderPage) return
      senderWorkflowPendingScrollRef.current = true
      startTransition(() => {
        router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource,
            subsetValue,
            semanticFocus: activeSemanticSubtypeFocusRef.current,
          }),
          clusterId: selectedCluster.clusterId,
          subsetSource,
          subsetValue,
          senderPage: clampedPage,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      requestedSenderPage,
      router,
      selectedCluster,
      senderWorkflowPagination,
      sessionId,
      subsetSource,
      subsetValue,
      workflowScopeForOverviewContext,
    ]
  )

  const senderConcentrationChartItems = useMemo(() => {
    if (!overviewAnalytics) return []

    return overviewAnalytics.contributionItems.map((item, index) => {
      const itemId = item.id || item.label
      const active = renderedSubsetSource === 'contributor' && renderedSubsetValue === itemId
      const shareLabel =
        overviewAnalytics.groupMessageTotal > 0
          ? formatPercent(ratioPercent(item.value, overviewAnalytics.groupMessageTotal))
          : '0%'

      return {
        id: itemId,
        label: item.label,
        value: item.value,
        valueLabel: shareLabel,
        rankLabel: `#${index + 1}`,
        supportLabel: `${item.value.toLocaleString()} message${item.value === 1 ? '' : 's'}`,
        accentClass: 'bg-cyan-500',
        active,
        onClick: () =>
          updateSubsetSelection(
            active
              ? null
              : {
                  source: 'contributor',
                  value: itemId,
                }
          ),
      }
    })
  }, [overviewAnalytics, renderedSubsetSource, renderedSubsetValue, updateSubsetSelection])

  const closeDecisionMode = () => {
    if (!selectedCluster) return
    const semanticFocus = activeSemanticSubtypeFocusRef.current
    const returnRouteContext = resolveAuthoritativeOverviewReturnContext({
      semanticFocus,
      activeSubset: activeOverviewSubsetRouteContext,
      subsetSource,
      subsetValue,
    })
    writeDecisionWorkflowStorage<DecisionOverviewReturnContext>(
      overviewReturnContextStorageKey,
      {
        subsetSource: returnRouteContext.subsetSource,
        subsetValue: returnRouteContext.subsetValue,
        semanticFocus,
        senderPage: requestedSenderPage,
        scrollTop:
          decisionOverlayScrollTopRef.current ??
          (typeof window !== 'undefined' ? window.scrollY : null),
      }
    )
    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: returnRouteContext.subsetSource,
            subsetValue: returnRouteContext.subsetValue,
            semanticFocus,
          }),
          clusterId: selectedCluster.clusterId,
          subsetSource: returnRouteContext.subsetSource,
          subsetValue: returnRouteContext.subsetValue,
          senderPage: requestedSenderPage,
        }),
        { scroll: false }
      )
    })
  }

  const commitDecision = async (
    sender: WorkspaceSender,
    destinationState: GmailDestinationState
  ) => {
    if (!selectedCluster || !agentId) return
    setSubmittingSenderKey(sender.sender_key)
    setActionError(null)
    setActionNote(null)
    try {
      const res = await fetch('/api/runtime/gmail-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId,
          analysisScope,
          cluster: buildGmailCleanupWorkflowClusterPayload({
            cluster: selectedCluster,
            requestedClusterId: rawRequestedClusterId || selectedCluster.clusterId,
            reviewUnitKey: selectedWorkflowTarget?.identity.reviewUnitKey || null,
          }),
          allClusters: runtimeClusters.map((cluster) => ({
            clusterId: cluster.clusterId,
            canonicalClusterId: cluster.canonicalClusterId || cluster.clusterId,
            reviewUnitKey: null,
            legacyClusterIds: cluster.legacyClusterIds || [],
            sourceClusterIds: cluster.sourceClusterIds || [],
            clusterType: cluster.clusterType,
            title: cluster.title,
            query: cluster.query,
          })),
          senderPolicies: {},
          messageOverrides: {},
          senders: [
            {
              senderKey: sender.sender_key,
              sender: sender.sender,
              destinationState,
              source: 'sender_decision_mode',
              reason: buildDecisionReason({
                destinationState,
                clusterTitle: selectedCluster.title,
              }),
              messageCount: sender.cleanup_group_message_count,
              trustSignals: buildDestinationTrustSignals(sender),
            },
          ],
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
          }
        | null

      if (!res.ok || !payload?.ok) {
        setActionError(payload?.error || 'Failed to store this sender decision.')
        return
      }

      const initialExecution = initialExecutionForDestination(destinationState)
      const nextManagedBySender = {
        ...managedBySender,
        [sender.sender_key]: {
          destinationState,
          executionState: initialExecution.executionState,
          executionSource: initialExecution.executionSource,
          lastActionTimestamp: new Date().toISOString(),
        },
      }
      setManagedBySender((current) => ({
        ...current,
        [sender.sender_key]: {
          destinationState,
          executionState: initialExecution.executionState,
          executionSource: initialExecution.executionSource,
          lastActionTimestamp: new Date().toISOString(),
        },
      }))
      setActionNote(
        destinationState === 'KEEP'
          ? `${sender.sender} moved to Keep and stays out of the active work buckets.`
          : destinationState === 'ARCHIVE'
            ? `${sender.sender} moved to Archive. Gmail execution now waits in Management.`
            : destinationState === 'CUSTOM_RULE'
              ? `${sender.sender} moved to Custom Rules with pending refinement.`
            : `${sender.sender} moved to Quarantine for later review.`
      )

      if (mode === 'decision' && decisionOverlayIntent === 'inspect') {
        closeDecisionMode()
      } else if (mode === 'decision') {
        const nextSenderKey = nextDecisionSenderKey({
          orderedSenderKeys: authoritativeWorkflowSenderKeys,
          managedBySender: nextManagedBySender,
          currentSenderKey: sender.sender_key,
        })
        const nextSenderPage =
          !nextSenderKey &&
          marketingReviewUnitHasNextDecisionPage &&
          activeReviewUnitDecisionPage != null
            ? activeReviewUnitDecisionPage + 1
            : requestedSenderPage

        startTransition(() => {
          router.replace(
            buildReviewHref({
              agentId,
              sessionId,
              analysisScope,
              workflowScope: workflowScopeForOverviewContext({
                subsetSource: authoritativeOverviewReturnContext.subsetSource,
                subsetValue: authoritativeOverviewReturnContext.subsetValue,
                semanticFocus: activeSemanticSubtypeFocusRef.current,
              }),
              clusterId: selectedCluster.clusterId,
              mode: 'decision',
              senderPage: nextSenderPage,
              subsetSource: authoritativeOverviewReturnContext.subsetSource,
              subsetValue: authoritativeOverviewReturnContext.subsetValue,
              senderKey: nextSenderKey,
              overlayIntent: decisionOverlayIntent,
            }),
            { scroll: false }
          )
        })
      }
    } finally {
      setSubmittingSenderKey(null)
    }
  }

  if (marketingReviewUnitEntryState) {
    const marketingTitle =
      cleanupGroupDisplayTitle({
        clusterId: selectedCanonicalClusterId || MARKETING_PARENT_CANONICAL_ID,
        title: selectedCluster?.title || missingScopedClusterName || null,
      }) || 'Marketing subscriptions'
    const marketingClustersHref = buildClustersHref({
      agentId,
      sessionId,
      analysisScope,
    })
    const marketingManagementHref = buildManagementHref({ agentId, sessionId, analysisScope })
    const marketingRouteClusterId =
      selectedCluster?.canonicalClusterId ||
      selectedCluster?.clusterId ||
      selectedCanonicalClusterId ||
      MARKETING_PARENT_CANONICAL_ID
    const blockedRequestedUnitLabel =
      marketingReviewUnitEntryRequestedUnit?.label || requestedReviewUnit?.label || 'This Marketing unit'
    const blockedRequestedUnitCount =
      marketingReviewUnitEntryRequestedUnit?.senderCount ?? requestedReviewUnit?.senderCount ?? null
    const marketingStateHeadline =
      marketingReviewUnitEntryState === 'choose_unit'
        ? 'Choose a Marketing unit before review starts'
        : marketingReviewUnitEntryState === 'missing_unit'
          ? 'Marketing unit is missing from this route'
          : marketingReviewUnitEntryState === 'invalid_unit'
          ? 'Selected Marketing unit is unavailable'
          : marketingReviewUnitEntryState === 'oversized_unit'
            ? 'Selected Marketing unit is blocked'
            : 'Marketing units are unavailable'
    const marketingStateCopy =
      marketingReviewUnitEntryState === 'choose_unit'
        ? 'Marketing subscriptions is decomposed at first click. Choose one published unit below to enter review.'
        : marketingReviewUnitEntryState === 'missing_unit'
          ? 'This route asked for Marketing review-unit entry but did not include a unit id. Review stays blocked here until you choose one published unit below.'
          : marketingReviewUnitEntryState === 'invalid_unit'
          ? 'The requested Marketing unit is not valid anymore. Choose one of the current published units below, or return to Cleanup Groups.'
          : marketingReviewUnitEntryState === 'oversized_unit'
            ? `${blockedRequestedUnitLabel} is above the 400-sender hard max for first-click Marketing review entry${
                blockedRequestedUnitCount != null
                  ? ` (${blockedRequestedUnitCount.toLocaleString()} senders)`
                  : ''
              }. This route stays blocked instead of opening broad Marketing review. Choose one of the current valid published units below.`
            : 'This decomposed parent cannot open broad review. Review stays blocked until a valid published unit set is available again.'

    return (
      <div className="space-y-4">
        <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                Selected Cleanup Group
              </p>
              <h1 className="text-2xl font-semibold text-white">{marketingTitle}</h1>
              <p className="max-w-3xl text-sm text-slate-200">{marketingStateCopy}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={marketingClustersHref}
                className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
              >
                Cleanup Groups
              </Link>
              <Link
                href={marketingManagementHref}
                className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
              >
                Open Management
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Senders in group</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                {formatCountOrPlaceholder(selectedCluster?.senderCount ?? null)}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-200">
                Full Marketing parent scope remains contextual here until a valid unit is chosen.
              </p>
            </div>
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Entry mode</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">Unit-only</p>
              <p className="mt-2 text-xs leading-5 text-slate-200">
                Broad parent review is intentionally blocked for this decomposed parent.
              </p>
            </div>
          </div>
        </section>

        <section className={`${primarySurfaceClass} p-5 space-y-4`}>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Marketing Review Entry
            </p>
            <h2 className="text-xl font-semibold text-white">{marketingStateHeadline}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-200">{marketingStateCopy}</p>
          </div>

          {marketingReviewUnitEntryState === 'unavailable_units' ? (
            <div className="rounded-2xl border border-amber-700/45 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
              Published Marketing units are missing, invalid, or stale. Review entry stays blocked
              here rather than falling back to broad parent review.
            </div>
          ) : selectableMarketingReviewUnits.length === 0 ? (
            <div className="rounded-2xl border border-cyan-700/45 bg-cyan-950/15 p-4 text-sm leading-6 text-cyan-100">
              Loading the current published Marketing units for this blocked entry route. Broad
              parent review stays blocked while the chooser list resolves.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectableMarketingReviewUnits.map((unit) => (
                <Link
                  key={unit.id}
                  href={buildReviewHref({
                    agentId,
                    sessionId,
                    analysisScope,
                    clusterId: marketingRouteClusterId,
                    subsetSource: 'review_unit',
                    subsetValue: unit.id,
                  })}
                  className="rounded-2xl border border-cyan-700/45 bg-cyan-950/15 p-4 text-left transition hover:border-cyan-600/70 hover:bg-cyan-950/20"
                >
                  <p className="text-base font-semibold text-cyan-50">{unit.label}</p>
                  <p className="mt-2 text-sm text-cyan-100/90">
                    {unit.senderCount.toLocaleString()} senders
                  </p>
                  <p className="mt-1 text-xs text-cyan-200/80">
                    {unit.groupSharePct}% of Marketing subscriptions
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  if (runtime.loading && !renderRuntimeData && !continuityOverviewWorkspaceSnapshot) {
    return (
      <section className={`${primarySurfaceClass} p-4 text-sm text-slate-200`}>
        Loading sender decisions workspace…
      </section>
    )
  }

  if (retiredClusterRedirect) {
    return (
      <section className={`${primarySurfaceClass} p-4 text-sm text-slate-200`}>
        {retiredClusterRedirect.explanation}
      </section>
    )
  }

  if (runtime.error && !renderRuntimeData && !continuityOverviewWorkspaceSnapshot) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {runtime.error}
      </section>
    )
  }

  if (!selectedCluster && !missingScopedCluster && !requestedClusterId && !continuityOverviewWorkspaceSnapshot) {
    return (
      <section className={`${primarySurfaceClass} p-4 text-sm text-slate-200`}>
        No cleanup group is selected yet. Open Cleanup Groups first, then continue into Sender Overview.
      </section>
    )
  }

  const activeReviewClusterId = sharedWorkflowSubset.parentClusterId || ''
  const activeReviewClusterTitle =
    selectedCluster?.title || missingScopedClusterName || 'Selected cleanup group'
  const sharedWorkflowSubsetRouteSubset = sharedWorkflowSubset.source.routeSubset
  const managementHref = buildManagementHref({ agentId, sessionId, analysisScope })
  const decisionHref = buildReviewHref({
    agentId,
    sessionId,
    analysisScope,
    workflowScope: detachedWorkflowScope,
    clusterId: activeReviewClusterId,
    mode: 'decision',
    senderPage: decisionBootstrapTargetPage,
    senderKey: guidedDecisionSenderKey || provisionalDecisionSeedSenderKey,
    overlayIntent: 'guided',
  })
  const marketingChooseAnotherUnitHref =
    isMarketingCleanupGroup && activeReviewClusterId
      ? buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          clusterId: activeReviewClusterId,
        })
      : null
  const subsetDecisionHref = activeOverviewSubset
      ? buildReviewHref({
        agentId,
        sessionId,
        analysisScope,
        workflowScope: workflowScopeForOverviewContext({
          subsetSource: sharedWorkflowSubsetRouteSubset?.source || activeOverviewSubset.source,
          subsetValue: sharedWorkflowSubsetRouteSubset?.value || activeOverviewSubset.value,
          semanticFocus: null,
        }),
        clusterId: activeReviewClusterId,
        mode: 'decision',
        senderPage: requestedSenderPage,
        subsetSource: sharedWorkflowSubsetRouteSubset?.source || activeOverviewSubset.source,
        subsetValue: sharedWorkflowSubsetRouteSubset?.value || activeOverviewSubset.value,
        senderKey:
          sharedWorkflowSubset.focusedSenderKey ||
          activeOverviewSubset.senders.find((sender) => !managedBySender[sender.sender_key])?.sender_key ||
          null,
        overlayIntent: 'guided',
      })
    : decisionHref
  const reviewUnitDecisionQueueLoading = Boolean(
    activeOverviewSubset?.source === 'review_unit' &&
      semanticFocusWorkspaceState.status === 'loading' &&
      activeOverviewSubset.loadedCount === 0
  )
  const openDecisionModeForSender = (sender: WorkspaceSender) => {
    if (!activeReviewClusterId) return
    const scrollTop = typeof window !== 'undefined' ? window.scrollY : null
    const semanticFocus = activeSemanticSubtypeFocusRef.current
    const returnRouteContext = resolveAuthoritativeOverviewReturnContext({
      semanticFocus,
      activeSubset: activeOverviewSubsetRouteContext,
      subsetSource,
      subsetValue,
    })
    const inspectEntryContext: DecisionInspectEntryContext = {
      senderKey: sender.sender_key,
      sender,
    }
    setDecisionInspectEntryContext(inspectEntryContext)
    writeDecisionWorkflowStorage(decisionInspectEntryStorageKey, inspectEntryContext)
    writeDecisionWorkflowStorage<DecisionOverviewReturnContext>(
      overviewReturnContextStorageKey,
      {
        subsetSource: returnRouteContext.subsetSource,
        subsetValue: returnRouteContext.subsetValue,
        semanticFocus,
        senderPage: requestedSenderPage,
        scrollTop,
      }
    )
    decisionOverlayScrollTopRef.current = scrollTop
    startTransition(() => {
      router.replace(
        buildReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: returnRouteContext.subsetSource,
            subsetValue: returnRouteContext.subsetValue,
            semanticFocus,
          }),
          clusterId: activeReviewClusterId,
          mode: 'decision',
          senderPage: requestedSenderPage,
          subsetSource: returnRouteContext.subsetSource,
          subsetValue: returnRouteContext.subsetValue,
          senderKey: sender.sender_key,
          overlayIntent: 'inspect',
        }),
        { scroll: false }
      )
    })
  }
  const clusterQuery = serializeOperationsQuery(sessionId, analysisScope)
  const fullGroupDecisionQueueHydrated = Boolean(
    mode === 'decision' && activeOverviewSubset == null && decisionQueueSenderKeys.length > 0
  )
  const fullGroupDecisionQueueComplete = Boolean(
    fullGroupDecisionQueueHydrated && decisionEligibleSenderKeys.length === 0
  )
  const decisionWorkspaceReady =
    mode !== 'decision' ||
    (activeOverviewSubset != null
      ? !scopedDecisionQueueLoading
      : fullGroupDecisionQueueComplete) ||
    Boolean(
      workspace &&
        workspaceDataMatchesDecisionQueueView(workspace, decisionTargetPage) &&
        workspaceHasClusterGlobalSenderKeys(workspace) &&
      activeDecisionSenderKey != null &&
      currentSender != null
    )

  if (
    workspaceState.status === 'error' &&
    !workspace &&
    (effectiveWorkflowScope !== normalizedAnalysisScope || !displayOverviewWorkspace)
  ) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {workspaceState.error}
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Selected Cleanup Group
            </p>
            <h1 className="text-2xl font-semibold text-white">{activeReviewClusterTitle}</h1>
              <p className="max-w-3xl text-sm text-slate-200">
                {activeMarketingReviewUnitTruth
                  ? `${activeMarketingReviewUnitTruth.unitLabel} is the active Marketing review unit. Parent context only: ${activeReviewClusterTitle} stays visible as the parent cleanup group while the hero and handoff numbers below stay scoped to this unit.`
                  : isReviewUnitActive
                    ? `${
                        activeOverviewSubset?.label ||
                        activeReviewUnit?.label ||
                        (isMarketingCleanupGroup ? 'A review unit' : 'A focused view')
                      } is active inside this parent cleanup group. ${
                        isMarketingCleanupGroup
                          ? 'The parent group stays intact while this session narrows to that unit.'
                          : 'The parent group stays intact while this session narrows the current sender list.'
                      }`
                    : 'Sender Overview keeps the workflow simple: understand the group, scan the sender list, then open the exact sender you want in the same in-place Decision Mode overlay.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/agents/${agentId}/operations/clusters${clusterQuery}`}
              className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
            >
              Cleanup Groups
            </Link>
            <Link
              href={managementHref}
              className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
            >
              Open Management
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              {activeMarketingReviewUnitTruth ? 'Senders in unit' : 'Senders in group'}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummarySenderTotal)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummarySenderDetail}
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              {activeMarketingReviewUnitTruth ? 'Managed in unit' : 'Managed already'}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummaryManagedCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummaryManagedDetail}
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              {activeMarketingReviewUnitTruth ? 'Still to review in unit' : 'Still to review'}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummaryRemainingCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummaryRemainingDetail}
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              {activeMarketingReviewUnitTruth ? 'Supporting messages in unit' : 'Supporting messages in scope'}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummarySupportingMessageCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummarySupportingDetail}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-700/45 bg-[linear-gradient(180deg,rgba(13,74,57,0.30),rgba(12,48,66,0.24),rgba(9,15,23,0.96))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.28)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                Sender review goal
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {activeMarketingReviewUnitTruth
                  ? 'Give every sender in this review unit a decision.'
                  : 'Give every sender in this cleanup group a decision.'}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {activeMarketingReviewUnitTruth
                  ? 'Coverage is sender-level inside this active Marketing unit.'
                  : 'Coverage is sender-level, not message-level.'}
              </p>
            </div>
            <div
              className={`${nestedSurfaceClass} rounded-2xl border border-emerald-600/45 px-4 py-3 text-right`}
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                {activeMarketingReviewUnitTruth ? 'Covered in unit' : 'Covered senders'}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {activeMarketingReviewUnitTruth && topSummaryCoverageIsLoading
                  ? '— / —'
                  : topSummarySenderTotal == null
                  ? '— / —'
                  : `${topSummaryManagedCount == null ? '—' : topSummaryManagedCount.toLocaleString()} / ${topSummarySenderTotal.toLocaleString()}`}
              </p>
              <p className="mt-1 text-xs text-slate-200">
                {topSummaryCoveredSendersDetail}
              </p>
            </div>
          </div>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-gray-900/90 ring-1 ring-emerald-700/30">
            {topSummaryCoverageIsLoading ? (
              <div className="h-full w-full animate-pulse bg-emerald-400/15" />
            ) : (
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, topSummaryCoveragePct || 0))}%` }}
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <span>{topSummaryGoalSummary}</span>
            <span className="text-slate-300">{topSummaryGoalFollowUp}</span>
          </div>
        </div>

        {managementError ? (
          <p className="text-xs text-amber-200">
            Management state could not be fully loaded yet: {managementError}
          </p>
        ) : null}
        {showOverviewBackgroundRefreshNotice ? (
          <p className="text-xs text-slate-300">Refreshing scoped sender evidence in the background…</p>
        ) : null}
      </section>

      <div className={reviewPageShellClass}>
          <section className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}>
            <div>
              <p className="text-base font-semibold text-white">How to review this group</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Read the group quickly, then move into sender review with a clear frame.
              </p>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <div className={`${insetSurfaceClass} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Why this group exists
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {overviewBridgeCopy.whyThisGroupExists}
                </p>
              </div>
              <div className={`${insetSurfaceClass} rounded-2xl p-4`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Review approach
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {overviewBridgeCopy.reviewApproach}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <section className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}>
              <div>
                <p className="text-base font-semibold text-white">
                  Inside this group (share of group senders)
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Largest visible families ranked by share of group senders. Use this as the
                  internal-structure view, separate from message-weight concentration below.
                </p>
              </div>
              {groupInternalStructure &&
              groupReviewUnitStarters.length > 0 &&
              !semanticFocusPresentation &&
              !isMarketingReviewUnitRouteActive ? (
                <div className="rounded-xl border border-cyan-700/35 bg-[rgba(9,21,33,0.76)] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    {reviewUnitSurfaceLabelPlural} inside this group
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {groupInternalStructure.summary}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {isMarketingCleanupGroup
                      ? 'These review units keep the parent cleanup group intact and only narrow the current session queue.'
                      : 'These focused views keep the parent cleanup group intact and only narrow the current sender list for this session.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {groupReviewUnitStarters.map((starter) => (
                      <button
                        key={starter.id}
                        type="button"
                        onClick={starter.onClick}
                        aria-pressed={starter.active}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          starter.active
                            ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                            : 'border-white/10 bg-white/5 text-gray-100 hover:border-cyan-700/45 hover:text-white'
                        }`}
                      >
                        {starter.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-300">
                    {groupInternalStructure.howToStart.slice(0, 3).map((step) => (
                      <p key={step}>{step}</p>
                    ))}
                  </div>
                  {groupInternalStructure.intentionalRemainderNote ? (
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      {groupInternalStructure.intentionalRemainderNote}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {reviewUnitContextBanner}
              <CompactRankedBarChart
                items={semanticMixChartItems}
                scaleTotal={100}
                emptyStateTitle="No semantic mix is visible yet"
                emptyStateDetail="Published semantic family mix will appear here once the artifact-backed overview finishes loading."
                footer={
                  semanticRowModel.smallShareSummary
                    ? `Subtype lanes stay available on demand. Smaller lanes: ${semanticRowModel.smallShareSummary}`
                    : 'Subtype lanes stay available on demand without taking over the page.'
                }
              />
            </section>

            <section className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}>
              <div>
                <p className="text-base font-semibold text-white">
                  Sender concentration (top contributors by message share)
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Visible top contributors ranked by share of all group messages. This is a
                  contributor view, not the full sender distribution.
                </p>
              </div>
              <CompactRankedBarChart
                items={senderConcentrationChartItems}
                widthMode="relative_visible_max"
                emptyStateTitle="No sender concentration is visible yet"
                emptyStateDetail="Top contributors by message share will appear here once the scoped sender workspace finishes loading."
                footer={
                  overviewAnalytics
                    ? `Top ${overviewAnalytics.contributionItems.length.toLocaleString()} visible contributors by message share. Bar widths are scaled to the largest visible contributor so the tail stays legible, while labels still show true share of all group messages. ${overviewAnalytics.contributorStory}`
                    : 'Use this to see whether the group is dominated by a few senders or spread across many.'
                }
              />
            </section>
          </section>

          <section className={`${primarySurfaceClass} p-4 space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">How stable this read is</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Family-level descriptive read across all visible senders in this group.
                </p>
              </div>
              <span className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] text-slate-100`}>
                {overviewAnalytics
                  ? `${overviewAnalytics.senderTotal.toLocaleString()} sender${
                      overviewAnalytics.senderTotal === 1 ? '' : 's'
                    }`
                  : 'Sender read loading'}
              </span>
            </div>
            <CompactSegmentedStrip
              segments={readStabilitySegments}
              emptyStateTitle="No read stability is visible yet"
              emptyStateDetail="Stability summary will appear here once the artifact-backed overview finishes loading."
            />
          </section>

          <div
            data-sender-overview-rail-source={activeRailDisplay.sourceLabel}
            data-sender-overview-rail-state={activeRailDisplay.state}
            data-sender-overview-rail-scope={activeRailScope}
            data-shared-analysis-rail-tab={activeSharedAnalysisRailTab}
            data-shared-workflow-kind={sharedWorkflowSubset.kind}
            data-shared-workflow-population-mode={sharedWorkflowSubset.populationMode}
          >
            {activeSharedAnalysisRailTab === 'time_context' ? (
              <SenderTimeContextAnalysisRail
                granularity={activeRailDisplay.granularity}
                items={activeRailDisplay.items}
                overallActivity={activeRailDisplay.overallActivity}
                activityMix={activeRailDisplay.activityMix}
                patternSignal={activeRailDisplay.patternSignal}
                nextAction={activeRailDisplay.nextAction}
                scopeStatus={activeRailDisplay.scopeStatus}
                scopeControls={{
                  activeScope: activeRailScope,
                  pendingScope: null,
                  onSelectScope: handleRailScopeSelect,
                }}
                tabStrip={
                  <SharedAnalysisRailTabStrip
                    activeTab={activeSharedAnalysisRailTab}
                    onSelectTab={setActiveSharedAnalysisRailTab}
                  />
                }
                isUpdating={false}
                bodyOverride={activeRailDisplay.bodyOverride}
              />
            ) : (
              <SenderDistributionAnalysisRail
                items={senderDistributionItems}
                totalRankedSenders={senderDistributionTotalRankedSenders}
                focusedSenderKey={sharedWorkflowSubset.focusedSenderKey}
                onSelectSender={handleSenderDistributionSelect}
                onClearSelection={clearSenderDistributionSelection}
                scopeStatus={senderDistributionScopeStatus}
                scopeControls={{
                  activeScope: activeRailScope,
                  pendingScope: null,
                  onSelectScope: handleRailScopeSelect,
                }}
                tabStrip={
                  <SharedAnalysisRailTabStrip
                    activeTab={activeSharedAnalysisRailTab}
                    onSelectTab={setActiveSharedAnalysisRailTab}
                  />
                }
                isLoading={senderDistributionLoading}
                isUpdating={senderDistributionUpdating}
                errorMessage={senderDistributionErrorMessage}
              />
            )}
          </div>

          <section
            ref={senderWorkflowSectionRef}
            data-shared-workflow-label={sharedWorkflowSubset.label}
            data-shared-workflow-source={sharedWorkflowSubset.source.primary}
            className={`${primaryWorkflowSectionClass} space-y-4`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-4xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Sender workflow</p>
                <p className="mt-2 text-xl font-semibold text-white">Review senders</p>
                {senderWorkflowCoverageDisplay ? (
                  <p className="mt-3 text-sm font-medium leading-6 text-white">
                    {senderWorkflowCoverageDisplay.summary}
                  </p>
                ) : null}
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                  {senderWorkflowCoverageDisplay
                    ? senderWorkflowCoverageDisplay.detail
                    : hasSubsetRouteContext
                      ? 'This list shows the subset matches that are ready to review right now.'
                      : 'Start with the strongest rows here, then open a sender to confirm the evidence before deciding.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] ${workflowScopeSummary.badgeClassName}`}
                  >
                    {workflowScopeSummary.label}
                  </span>
                  {workflowScopeCompareOnlyNote ? (
                    <span className="rounded-full border border-amber-700/45 bg-amber-950/20 px-3 py-1 text-[11px] text-amber-100">
                      {workflowScopeCompareOnlyNote}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-300">
                  {workflowScopeSummary.detail}
                </p>
                {senderWorkflowCoverageDisplay ? (
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {senderWorkflowCoverageDisplay.navigationHint}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-[18rem] flex-col items-start gap-2 sm:items-end">
                {senderWorkflowPagination?.hasMultiplePages ? (
                  <SenderWorkflowPaginationControls
                    pagination={senderWorkflowPagination}
                    onPrevious={() =>
                      navigateSenderWorkflowPage(senderWorkflowPagination.currentPage - 1)
                    }
                    onNext={() =>
                      navigateSenderWorkflowPage(senderWorkflowPagination.currentPage + 1)
                    }
                    className={senderWorkflowPagerClassName}
                  />
                ) : senderWorkflowCoverageDisplay ? (
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                    {senderWorkflowCoverageDisplay.pageLabel}
                  </p>
                ) : null}
                {hasSubsetRouteContext ? (
                  <button
                    type="button"
                    onClick={handleSubsetBackAction}
                    className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
                  >
                    {marketingReviewUnitBackLabel}
                  </button>
                ) : null}
              </div>
            </div>

            {!hasSubsetRouteContext ? (
              <div className="space-y-4">
                {semanticFocusBanner}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                      {renderedSemanticSubtypeFocus ? 'Review this focused list' : 'Review this list'}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {renderedSemanticSubtypeFocus
                        ? 'Start with these senders, then open one to confirm before deciding.'
                        : 'Start with the strongest rows here, then open a sender to confirm before deciding.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['impact', 'Highest impact'],
                      ['recent', 'Most recent'],
                      ['unread', 'Most unread'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateDrilldownSort(value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          drilldownSort === value
                            ? 'border-cyan-700/60 bg-cyan-950/20 text-cyan-100'
                            : `${insetSurfaceClass} text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {isSenderWorkflowInlineLoading ? (
                  <SenderWorkflowRowLoadingState
                    title={
                      renderedSemanticSubtypeFocus
                        ? `Refreshing ${renderedSemanticSubtypeFocus.label} matches`
                        : `Loading sender rows for page ${requestedSenderPage} of ${overviewKnownTotalPages}`
                    }
                    detail={
                      renderedSemanticSubtypeFocus
                        ? 'Stay here — this focused list is updating in place while the rest of the page stays put.'
                        : 'Only the lower sender workflow is refreshing. The next page of sender rows will appear here as soon as it is ready.'
                    }
                  />
                ) : visibleDrilldownSenders.length === 0 ? (
                  <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-5`}>
                    <p className="text-sm font-semibold text-white">
                      {renderedSemanticSubtypeFocus
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? `Refreshing ${renderedSemanticSubtypeFocus.label} matches`
                          : semanticFocusWorkspaceState.status === 'error'
                            ? 'Could not refresh this focused list'
                            : `No strong matches for ${renderedSemanticSubtypeFocus.label} are on screen right now`
                        : 'No sender rows are ready on this page yet'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {renderedSemanticSubtypeFocus
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? 'Stay here — this focused list is updating in place.'
                          : semanticFocusWorkspaceState.status === 'error'
                            ? semanticFocusWorkspaceState.error ||
                              marketingReviewUnitBackHint
                            : marketingReviewUnitBackHint
                        : 'This page is still filling in. The next sender rows will appear here shortly.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleDrilldownSenders.map((sender) => (
                      <SenderDrilldownRow
                        key={sender.sender_key}
                        sender={sender}
                        groupSemanticRollup={overviewShellWorkspace?.analytics.semantic_rollup || null}
                        managedState={managedBySender[sender.sender_key] || null}
                        activeSemanticFocusLabel={
                          renderedSemanticSubtypeFocus
                            ? renderedSemanticSubtypeFocus.kind === 'remainder'
                              ? 'Broad remainder match'
                              : renderedSemanticSubtypeFocus.kind === 'family'
                                ? `${renderedSemanticSubtypeFocus.label} lane`
                              : `${renderedSemanticSubtypeFocus.label} match`
                            : activeReviewUnitRowLabel
                        }
                        expanded={expandedSenderKey === sender.sender_key}
                        onOpenDecisionMode={openDecisionModeForSender}
                        snippetHydrationState={snippetHydrationStateBySender[sender.sender_key] || null}
                        onOpenMessagePreview={(selectedSender, message) =>
                          setMessagePreviewState({
                            selection: {
                              senderKey: selectedSender.sender_key,
                              sender: selectedSender.sender,
                              message,
                            },
                            status: 'loading',
                            data: null,
                            error: null,
                          })
                        }
                        onToggle={() => {
                          setExpandedSenderKey((current) =>
                            current === sender.sender_key ? null : sender.sender_key
                          )
                          setVisibleEvidenceBySender((current) =>
                            current[sender.sender_key]
                              ? current
                              : {
                                  ...current,
                                  [sender.sender_key]: OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT,
                                }
                          )
                        }}
                        visibleEvidenceCount={
                          visibleEvidenceBySender[sender.sender_key] ||
                          OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT
                        }
                        onLoadMore={(count) =>
                          setVisibleEvidenceBySender((current) => ({
                            ...current,
                            [sender.sender_key]:
                              (current[sender.sender_key] ||
                                OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT) + count,
                          }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-700/45 bg-[linear-gradient(180deg,rgba(14,34,50,0.95),rgba(8,17,28,0.98))] p-4 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-3xl">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                        {subsetBannerContext?.laneLabel || 'Subset active'}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {subsetBannerContext?.label || 'Selected subset'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">
                        {subsetBannerContext?.whyItMatters ||
                          'Matching senders from this subset will appear here as the next page comes in.'}
                      </p>
                    </div>
                    <div className="max-w-sm text-sm leading-6 text-slate-100">
                      <p className="font-medium text-cyan-100">
                        {subsetBannerContext?.messageShareText || 'Subset active'}
                      </p>
                      {subsetBannerContext?.loadedCount != null &&
                      subsetBannerContext.eligibleCount != null ? (
                        <p className="mt-2">
                          {subsetBannerContext.loadedCount.toLocaleString()} matching sender
                          {subsetBannerContext.loadedCount === 1 ? '' : 's'} loaded in this page.{' '}
                          {subsetBannerContext.eligibleCount.toLocaleString()} still to review.
                        </p>
                      ) : (
                        <p className="mt-2">
                          {isReviewUnitActive
                            ? `Senders from this ${reviewUnitNoun} will appear here as soon as the scoped list is ready.`
                            : 'Matching senders from this subset will appear here as the next page comes in.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {semanticFocusBanner}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                      {isReviewUnitActive
                        ? isMarketingCleanupGroup
                          ? 'Review this unit'
                          : 'Review this focused view'
                        : renderedSemanticSubtypeFocus
                        ? 'Review this focused list'
                        : 'Review this matching list'}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {isReviewUnitActive
                        ? isMarketingCleanupGroup
                          ? 'This review unit stays inside the same parent cleanup group. Start with the strongest sender rows here, then open a sender to confirm before deciding.'
                          : 'This focused view stays inside the same parent cleanup group. Start with the strongest sender rows here, then open a sender to confirm before deciding.'
                        : renderedSemanticSubtypeFocus
                        ? 'Start here — these are the strongest matches for this pattern. Open a sender to confirm before deciding.'
                        : 'Start with the strongest matching rows here, then open a sender to confirm before deciding.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['impact', 'Highest impact'],
                      ['recent', 'Most recent'],
                      ['unread', 'Most unread'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateDrilldownSort(value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          drilldownSort === value
                            ? 'border-cyan-700/60 bg-cyan-950/20 text-cyan-100'
                            : `${insetSurfaceClass} text-slate-100 hover:border-cyan-700/45 hover:text-cyan-100`
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {isSenderWorkflowInlineLoading ? (
                  <SenderWorkflowRowLoadingState
                    title={
                      renderedSemanticSubtypeFocus
                        ? `Refreshing ${renderedSemanticSubtypeFocus.label} matches`
                        : `Loading matching senders from page ${requestedSenderPage} of ${overviewKnownTotalPages}`
                    }
                    detail={
                      renderedSemanticSubtypeFocus
                        ? 'Stay here — this focused list is updating in place while subset context and pagination stay visible.'
                        : 'This matching list is updating in place while the rest of the page stays put.'
                    }
                  />
                ) : visibleDrilldownSenders.length === 0 ? (
                  <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-5`}>
                    <p className="text-sm font-semibold text-white">
                      {renderedSemanticSubtypeFocus
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? `Refreshing ${renderedSemanticSubtypeFocus.label} matches`
                          : semanticFocusWorkspaceState.status === 'error'
                            ? 'Could not refresh this focused list'
                            : `No strong matches for ${renderedSemanticSubtypeFocus.label} are on screen right now`
                        : 'No matching sender rows are ready on this page yet'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {renderedSemanticSubtypeFocus
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? 'Stay here — this focused list is updating in place.'
                          : semanticFocusWorkspaceState.status === 'error'
                            ? semanticFocusWorkspaceState.error ||
                              marketingReviewUnitBackHint
                            : marketingReviewUnitBackHint
                        : 'This page does not include any matches for this subset yet. Go back to the full sender list when you want the wider queue.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleDrilldownSenders.map((sender) => (
                      <SenderDrilldownRow
                        key={sender.sender_key}
                        sender={sender}
                        groupSemanticRollup={overviewShellWorkspace?.analytics.semantic_rollup || null}
                        managedState={managedBySender[sender.sender_key] || null}
                        activeSemanticFocusLabel={
                          renderedSemanticSubtypeFocus
                            ? renderedSemanticSubtypeFocus.kind === 'remainder'
                              ? 'Broad remainder match'
                              : renderedSemanticSubtypeFocus.kind === 'family'
                                ? `${renderedSemanticSubtypeFocus.label} lane`
                              : `${renderedSemanticSubtypeFocus.label} match`
                            : activeReviewUnitRowLabel
                        }
                        expanded={expandedSenderKey === sender.sender_key}
                        onOpenDecisionMode={openDecisionModeForSender}
                        snippetHydrationState={snippetHydrationStateBySender[sender.sender_key] || null}
                        onOpenMessagePreview={(selectedSender, message) =>
                          setMessagePreviewState({
                            selection: {
                              senderKey: selectedSender.sender_key,
                              sender: selectedSender.sender,
                              message,
                            },
                            status: 'loading',
                            data: null,
                            error: null,
                          })
                        }
                        onToggle={() => {
                          setExpandedSenderKey((current) =>
                            current === sender.sender_key ? null : sender.sender_key
                          )
                          setVisibleEvidenceBySender((current) =>
                            current[sender.sender_key]
                              ? current
                              : {
                                  ...current,
                                  [sender.sender_key]: OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT,
                                }
                          )
                        }}
                        visibleEvidenceCount={
                          visibleEvidenceBySender[sender.sender_key] ||
                          OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT
                        }
                        onLoadMore={(count) =>
                          setVisibleEvidenceBySender((current) => ({
                            ...current,
                            [sender.sender_key]:
                              (current[sender.sender_key] ||
                                OVERVIEW_PREVIEW_EVIDENCE_INITIAL_COUNT) + count,
                          }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {senderWorkflowPagination?.hasMultiplePages ? (
              <SenderWorkflowPaginationControls
                pagination={senderWorkflowPagination}
                onPrevious={() =>
                  navigateSenderWorkflowPage(senderWorkflowPagination.currentPage - 1)
                }
                onNext={() =>
                  navigateSenderWorkflowPage(senderWorkflowPagination.currentPage + 1)
                }
                className={senderWorkflowPagerClassName}
              />
            ) : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Already decided here</p>
                <p className="mt-2 text-base font-semibold text-white">Managed senders</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Keep"
                  value={formatCountOrPlaceholder(overviewClusterCounts?.KEEP ?? null)}
                  detail="Stays out of review."
                />
                <SummaryCard
                  title="Archive"
                  value={formatCountOrPlaceholder(overviewClusterCounts?.ARCHIVE ?? null)}
                  detail="Waits in Management."
                />
                <SummaryCard
                  title="Custom Rules"
                  value={formatCountOrPlaceholder(overviewClusterCounts?.CUSTOM_RULE ?? null)}
                  detail="Pending refinement."
                />
                <SummaryCard
                  title="Quarantine"
                  value={formatCountOrPlaceholder(overviewClusterCounts?.QUARANTINE ?? null)}
                  detail="Deferred until reopened."
                />
              </div>
            </div>

            <div className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Ready to review</p>
                <p className="mt-2 text-base font-semibold text-white">Decision handoff</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] ${workflowScopeSummary.badgeClassName}`}
                  >
                    {workflowScopeSummary.label}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-200">
                {activeOverviewSubset
                  ? activeOverviewSubset.source === 'review_unit'
                    ? isMarketingCleanupGroup
                      ? 'You can review only this Marketing unit or choose another unit. Decision handoff here stays scoped to this unit only.'
                      : 'You can either review only this focused view or return to the full cleanup group. This scope is session-only and still uses the same one-sender-at-a-time Decision Mode.'
                    : 'You can either review the full cleanup group or hand off only this selected subset into the same one-sender-at-a-time decision flow. Gmail still never mutates here.'
                  : 'Decision Mode is the next step when you are ready to move from overview into one-sender-at-a-time action.'}
              </p>
              {activeOverviewSubset ? (
                <div className="space-y-3">
                  {reviewUnitDecisionQueueLoading ? (
                    <div className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500/40 px-5 py-3 text-sm font-semibold text-cyan-50">
                      {reviewUnitPreparingLabel}
                    </div>
                  ) : (
                    <Link
                      href={subsetDecisionHref}
                      scroll={false}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-cyan-400"
                    >
                      {activeOverviewSubset.source === 'review_unit'
                        ? reviewUnitActionLabel
                        : 'Review Selected Subset'}
                    </Link>
                  )}
                  <Link
                    href={
                      isMarketingCleanupGroup && activeOverviewSubset.source === 'review_unit'
                        ? marketingChooseAnotherUnitHref || decisionHref
                        : decisionHref
                    }
                    scroll={false}
                    className={`${quietSecondaryActionClass} inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold`}
                  >
                    {isMarketingCleanupGroup && activeOverviewSubset.source === 'review_unit'
                      ? 'Choose Another Unit'
                      : 'Review Full Group'}
                  </Link>
                </div>
              ) : (
                <Link
                  href={decisionHref}
                  scroll={false}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-cyan-400"
                >
                  Start Reviewing Senders
                </Link>
              )}
              <p className="text-xs leading-5 text-slate-300">
                {activeOverviewSubset
                  ? reviewUnitDecisionQueueLoading
                    ? `Preparing the full sender list for this ${reviewUnitNoun} before entering Decision Mode.`
                    : activeOverviewSubset.source === 'review_unit'
                    ? activeMarketingReviewUnitTruth && topSummaryCoverageIsLoading
                      ? 'Unit-scoped decision handoff is loading for this review unit.'
                      : `${topSummaryRemainingCount?.toLocaleString() || '0'} senders are ready to review inside this ${reviewUnitNoun}. This handoff stays unit-scoped, keeps the parent group intact, and does not create a taxonomy split.`
                    : `${activeOverviewSubset.eligibleCount.toLocaleString()} senders are ready to review inside this subset. This handoff is session-only and does not create a saved cleanup group.`
                  : workflowClusterProgress.remaining == null
                    ? 'Loading the exact cluster-global review count before handing this group into Decision Mode.'
                    : `Senders left to review: ${workflowClusterProgress.remaining.toLocaleString()} of ${workflowClusterProgress.total.toLocaleString()}. Already-managed senders stay out of the queue until reopened from Management.`}
              </p>
              {workflowScopeCompareOnlyNote ? (
                <p className="text-xs leading-5 text-amber-100">
                  {workflowScopeCompareOnlyNote}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      {decisionOverlayOpen ? (
        <div className="fixed inset-0 z-40 flex justify-center bg-slate-950/72 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close Decision Mode"
            onClick={closeDecisionMode}
            className="absolute inset-0"
          />
          <div className="relative z-10 flex h-full w-full max-w-6xl justify-center overflow-y-auto px-4 py-6 sm:px-6">
            {!renderedDecisionSender && workspaceState.status === 'error' ? (
              <section className="my-auto w-full max-w-3xl rounded-3xl border border-rose-900/45 bg-rose-950/20 p-6 text-sm text-rose-100">
                {workspaceState.error || 'Decision Mode could not load for this sender.'}
              </section>
            ) : !renderedDecisionSender && !decisionWorkspaceReady ? (
              <section className={`${primarySurfaceClass} my-auto w-full max-w-3xl p-6 text-sm text-slate-200`}>
                {activeOverviewSubset?.source === 'review_unit'
                  ? `Preparing the decision queue for ${activeOverviewSubset.label}…`
                  : 'Preparing the full decision queue for this cleanup group…'}
              </section>
            ) : !renderedDecisionSender ? (
              <section className="my-auto w-full max-w-4xl rounded-3xl border border-cyan-700/45 bg-[linear-gradient(180deg,rgba(13,34,50,0.94),rgba(8,16,27,0.98),rgba(10,14,22,0.98))] p-6 space-y-5 shadow-[0_22px_56px_rgba(2,6,23,0.3)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Decision Mode complete
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {activeOverviewSubset
                      ? `${activeOverviewSubset.label} has no senders left to review`
                      : 'This cleanup group has no senders left to review'}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm text-slate-200">
                    {activeOverviewSubset
                      ? isMarketingCleanupGroup && activeOverviewSubset.source === 'review_unit'
                        ? 'Every sender in this review unit is already managed or complete. You can close this overlay to keep exploring or continue in Management.'
                        : 'Every visible sender in this selected subset is already managed or complete. You can close this overlay to keep exploring or continue in Management.'
                      : 'Managed senders stay out of the queue until they are explicitly reopened. Continue in Management to push Archive work, inspect pending Custom Rules, or revisit deferred senders.'}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-300">Keep</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {formatCountOrPlaceholder(clusterCounts?.KEEP ?? null)}
                    </p>
                  </div>
                  <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-300">Archive</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {formatCountOrPlaceholder(clusterCounts?.ARCHIVE ?? null)}
                    </p>
                  </div>
                  <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-300">Custom Rules</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {formatCountOrPlaceholder(clusterCounts?.CUSTOM_RULE ?? null)}
                    </p>
                  </div>
                  <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
                    <p className="text-[10px] uppercase tracking-wide text-slate-300">Quarantine</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {formatCountOrPlaceholder(clusterCounts?.QUARANTINE ?? null)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={managementHref}
                    scroll={false}
                    className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-cyan-400"
                  >
                    Go to Management
                  </Link>
                  <button
                    type="button"
                    onClick={closeDecisionMode}
                    className={`${quietSecondaryActionClass} rounded-full px-5 py-2.5 text-sm`}
                  >
                    Back to Overview
                  </button>
                </div>
              </section>
            ) : (
              <section className="w-full max-w-5xl space-y-4">
                <div className={`${primarySurfaceClass} p-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                        Decision Mode
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {activeOverviewSubset
                          ? `Sender ${decisionCurrentPosition || 1} of ${decisionProgress.total.toLocaleString()} in ${activeOverviewSubset.label}`
                          : `Sender ${decisionCurrentPosition || 1} of ${decisionProgress.total.toLocaleString()} in this cleanup group`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-cyan-700/50 bg-cyan-950/20 px-3 py-1 text-xs text-cyan-100">
                        {Math.round(
                          ((decisionProgress.managed + (currentSender ? 1 : 0)) /
                            Math.max(decisionProgress.total, 1)) *
                            100
                        )}
                        % reviewed
                      </span>
                      <button
                        type="button"
                        onClick={closeDecisionMode}
                        className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-900">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.round(
                            (decisionProgress.managed / Math.max(decisionProgress.total, 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <GmailSharedSenderCard
                  sender={renderedDecisionSender}
                  mode="decision"
                  groupSemanticRollup={overviewShellWorkspace?.analytics.semantic_rollup || null}
                  managedState={managedBySender[renderedDecisionSender.sender_key] || null}
                  visibleEvidenceCount={decisionVisibleEvidenceCount}
                  onLoadMoreEvidence={(count) =>
                    setVisibleEvidenceBySender((current) => ({
                      ...current,
                      [renderedDecisionSender.sender_key]:
                        (current[renderedDecisionSender.sender_key] || 6) + count,
                    }))
                  }
                  snippetHydrationState={decisionSnippetHydrationState}
                  evidenceResolutionState={decisionEvidenceResolutionState}
                  onOpenMessagePreview={(selectedSender, message) =>
                    setMessagePreviewState({
                      selection: {
                        senderKey: selectedSender.sender_key,
                        sender: selectedSender.sender,
                        message,
                      },
                      status: 'loading',
                      data: null,
                      error: null,
                    })
                  }
                  headerSlot={
                    activeOverviewSubset ? (
                      <span
                        className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] text-cyan-100`}
                      >
                        {activeOverviewSubset.label}
                      </span>
                    ) : (
                      <span
                        className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] text-slate-100`}
                      >
                        One sender at a time
                      </span>
                    )
                  }
                  footerSlot={
                    <div className="space-y-4">
                      {actionNote ? (
                        <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/20 p-3 text-sm text-cyan-100">
                          {actionNote}
                        </div>
                      ) : null}
                      {actionError ? (
                        <div className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-3 text-sm text-rose-100">
                          {actionError}
                        </div>
                      ) : null}
                    </div>
                  }
                  actionsSlot={
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          label: 'Keep All',
                          description: 'Protect this sender and keep it out of the active work buckets.',
                          destinationState: 'KEEP' as const,
                          className: 'border-emerald-900/45 bg-emerald-950/18 text-emerald-100 hover:border-emerald-700/60',
                        },
                        {
                          label: 'Keep Some',
                          description: 'Store this sender as a pending Custom Rule for later refinement.',
                          destinationState: 'CUSTOM_RULE' as const,
                          className: 'border-violet-900/45 bg-violet-950/18 text-violet-100 hover:border-violet-700/60',
                        },
                        {
                          label: 'Archive All',
                          description: 'Queue this sender for Archive. Gmail changes still wait in Management.',
                          destinationState: 'ARCHIVE' as const,
                          className: 'border-cyan-900/45 bg-cyan-950/18 text-cyan-100 hover:border-cyan-700/60',
                        },
                        {
                          label: 'Not Sure',
                          description: 'Move this sender to Quarantine for later review.',
                          destinationState: 'QUARANTINE' as const,
                          className: 'border-amber-900/45 bg-amber-950/18 text-amber-100 hover:border-amber-700/60',
                        },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          disabled={submittingSenderKey === renderedDecisionSender.sender_key}
                          onClick={() =>
                            void commitDecision(renderedDecisionSender, action.destinationState)
                          }
                          className={`rounded-2xl border p-4 text-left transition ${action.className} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <p className="text-base font-semibold">{action.label}</p>
                          <p className="mt-2 text-sm leading-6 text-current/90">
                            {action.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  }
                />
              </section>
            )}
          </div>
        </div>
      ) : null}
      <MessagePreviewDrawer
        state={messagePreviewState}
        onClose={() =>
          setMessagePreviewState({
            selection: null,
            status: 'idle',
            data: null,
            error: null,
          })
        }
      />
    </div>
  )
}
