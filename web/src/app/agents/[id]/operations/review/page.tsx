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
  buildGmailSenderDistributionCacheKey,
  buildGmailCleanupWorkflowClusterPayload,
  fetchGmailDecisionManagementSummary,
  fetchGmailSenderDistribution,
  fetchGmailSenderOverviewWindow,
  fetchGmailSenderWorkspace,
  normalizeGmailCleanupWorkflowTarget,
  readCachedGmailSenderDistribution,
  readCachedGmailSenderOverviewWindow,
  readCachedGmailSenderWorkspace,
  type GmailCleanupClusterRef,
  type GmailDestinationExecutionState,
  type GmailDestinationState,
  type GmailSenderOverviewWindowData,
  type GmailSenderDistributionData,
  type GmailSenderDestinationTrustSignals,
  type GmailSenderWorkspaceSemanticFocus,
  type GmailSenderWorkspaceData,
  type GmailTimeContextBucketSelection,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  buildCleanupGroupFutureCanonicalPublishIdentity,
  resolveCleanupClusterIdentity,
} from '@/lib/runtime/gmailCleanupClusterIdentity'
import {
  DEFAULT_OPERATIONS_ANALYSIS_SCOPE,
  type OperationsSelectedClusterRailFamilyScopeEntry,
  analysisScopeControlLabel,
  fetchOperationsMessagePreview,
  fetchOperationsMessageSnippets,
  normalizeOperationsAnalysisScope,
  serializeOperationsQuery,
  type OperationsMessagePreviewData,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'
import {
  buildCleanupGroupPublishedReviewUnits,
  buildCleanupGroupInternalStructure,
  buildSemanticFocusFromPublishedReviewUnit,
  findCleanupGroupPublishedReviewUnit,
  getCleanupGroupDisplayTitle,
  getCleanupGroupLaneLabel,
  type CleanupGroupPublishedReviewUnit,
} from '@/lib/runtime/cleanupGroupPresentation'
import {
  DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
  GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
  MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
} from '@/lib/integrations/gmail/gmailWorkspaceContracts'
import { pressureTrendResolvedWindow } from '@/lib/integrations/gmail/inboxAnalysis'
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
type PublishedReviewUnitEntryState =
  | 'choose_unit'
  | 'missing_unit'
  | 'invalid_unit'
  | 'oversized_unit'
  | 'unavailable_units'
type DrilldownSort = 'impact' | 'recent' | 'unread'

const MARKETING_PARENT_CANONICAL_ID = 'semantic.marketing_subscriptions'
type SharedAnalysisRailTab = 'time_context' | 'sender_distribution'
type TimeContextChartScope =
  | 'all_indexed'
  | 'last_year'
  | 'last_quarter'
  | 'last_month'
  | 'last_week'
  | 'last_day'
  | 'custom'
type SenderOverviewWindowSelection = {
  window: Extract<TimeContextChartScope, 'last_day' | 'custom'>
  start: string | null
  end: string | null
}
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
type SemanticFocusRouteParams = {
  family: WorkspaceSender['semantic_family']['family']
  subtype: string
}
type SemanticFocusChangeReason = 'direct_select' | 'clear' | 'restore' | 'system'
type SharedWorkflowSubsetKind = 'base_cluster' | 'derived_workflow_scope' | 'focused_sender'
type SharedWorkflowSubsetPopulationMode =
  | 'cluster_full'
  | 'workflow_scope_filtered'
  | 'workflow_window_filtered'
  | 'time_bucket_filtered'
  | 'combined_filtered'
  | 'route_subset_filtered'
  | 'focused_sender_only'
type SharedWorkflowSubsetPrimarySource =
  | 'page_scope'
  | 'workflow_scope'
  | 'workflow_window'
  | 'time_context_bucket'
  | 'combined_filters'
  | 'route_subset'
  | 'focused_sender'
type SharedWorkflowResolvedFilterKind =
  | 'workflow_scope'
  | 'workflow_window'
  | 'time_context_bucket'
  | 'review_unit'
  | 'semantic_focus'
  | 'route_subset'
  | 'focused_sender'
type SharedWorkflowResolvedFilter = {
  kind: SharedWorkflowResolvedFilterKind
  label: string
  senderCount: number
  exact: boolean
}
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
  resolvedSenderCount: number
  resolvedFilters: SharedWorkflowResolvedFilter[]
  source: {
    primary: SharedWorkflowSubsetPrimarySource
    workflowScope: OperationsAnalysisScope | null
    senderOverviewWindowLabel: string | null
    timeContextBucketLabel: string | null
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
  senderOverviewWindowSelection: SenderOverviewWindowSelection | null
}
type TimeContextBucketNotice = {
  reason: 'empty_bucket' | 'low_confidence' | 'missing_data' | 'invalid_selection'
  tone: 'info' | 'warning' | 'error'
  title: string
  detail: string
}
type TimeContextBucketInteractionMode = 'workflow_narrowing' | 'chart_only_focus'
type ResolvedTimeContextState =
  | {
      mode: 'default_overview'
      pageScope: OperationsAnalysisScope
      workflowScope: OperationsAnalysisScope
      routeWorkflowScope: OperationsAnalysisScope | null
      windowSelection: null
      chartFocusLabel: null
    }
  | {
      mode: 'scoped_workflow_scope'
      pageScope: OperationsAnalysisScope
      workflowScope: OperationsAnalysisScope
      routeWorkflowScope: OperationsAnalysisScope
      windowSelection: null
      chartFocusLabel: null
    }
  | {
      mode: 'workflow_window'
      pageScope: OperationsAnalysisScope
      workflowScope: OperationsAnalysisScope
      routeWorkflowScope: OperationsAnalysisScope
      windowSelection: SenderOverviewWindowSelection
      chartFocusLabel: null
    }
  | {
      mode: 'chart_focus_only'
      pageScope: OperationsAnalysisScope
      workflowScope: OperationsAnalysisScope
      routeWorkflowScope: OperationsAnalysisScope | null
      windowSelection: null
      chartFocusLabel: string
    }
type PendingNarrowingInteractionKind =
  | 'sender_distribution'
  | 'time_context_bucket'
  | 'semantic_focus'
  | 'route_subset'
  | 'clear_narrowing'
  | 'clear_workflow_scope'
type PendingNarrowingInteractionExpectation = {
  workflowScope: OperationsAnalysisScope | null
  subsetSource: OverviewSubsetSource | null
  subsetValue: string | null
  semanticFocusId: string | null
  timeContextBucketLabel: string | null
  timeContextBucketStartAt: string | null
  timeContextBucketEndExclusiveAt: string | null
}
type PendingNarrowingInteraction = {
  kind: PendingNarrowingInteractionKind
  label: string
  senderKey: string | null
  timeContextBucketLabel: string | null
  timeContextBucketStartAt: string | null
  timeContextBucketEndExclusiveAt: string | null
  expectation: PendingNarrowingInteractionExpectation
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
const WORKSPACE_GUARD_ATTACH_WAIT_MS = 5000
const WORKSPACE_GUARD_ATTACH_POLL_MS = 150
const SENDER_DISTRIBUTION_GUARD_ATTACH_WAIT_MS = 5000
const SENDER_DISTRIBUTION_GUARD_ATTACH_POLL_MS = 150
const DECISION_WORKFLOW_STORAGE_TTL_MS = 15 * 60 * 1000
const DECISION_WORKFLOW_STORAGE_VERSION = 1
const REVIEW_SCOPE_TRANSITION_SNAPSHOT_TTL_MS = 90 * 1000
const TIME_CONTEXT_LANE_A_WORKFLOW_SCOPES: readonly OperationsAnalysisScope[] = [
  'all_indexed',
  '365d',
  '90d',
  '30d',
  '7d',
]
const TIME_CONTEXT_VISIBLE_CHART_SCOPES: readonly TimeContextChartScope[] = [
  'all_indexed',
  'last_year',
  'last_quarter',
  'last_month',
  'last_week',
  'last_day',
  'custom',
]
type WorkspaceSnapshot = {
  data: GmailSenderWorkspaceData
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  source: WorkspaceSnapshotSource
  cacheVersion: string | null
  previewEvidenceSenderKey: string | null
  timeContextBucketLabel: string | null
  timeContextBucketStartAt: string | null
  timeContextBucketEndExclusiveAt: string | null
  senderOverviewWindowSignature: string | null
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

const reviewScopeTransitionSnapshots = new Map<
  string,
  { snapshot: WorkspaceSnapshot; capturedAt: number }
>()
const senderOverviewRailMemoryStore = new Map<string, SenderOverviewRailFastPackage>()

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
  reviewUnitId: string | null
  requestPhase: 'interactive' | 'deferred'
  seedSnapshot: WorkspaceSnapshot | null
  previewEvidenceSenderKey: string | null
  timeContextBucketLabel: string | null
  timeContextBucketStartAt: string | null
  timeContextBucketEndExclusiveAt: string | null
  senderOverviewWindowSelection: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone: string | null
}

type SenderTimeContextRailMetricModel = {
  value: string
  detail: string
}

type SenderOverviewRailFastSourceLabel =
  | 'hydrated_page'
  | 'workflow_workspace'
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
    granularity: 'hour' | 'day' | 'week' | 'month'
    items: Array<{ label: string; count: number; messageCount?: number | null }>
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
  | { status: 'idle'; data: null; error: null; requestKey: null }
  | {
      status: 'loading'
      data: GmailSenderWorkspaceData | null
      error: null
      requestKey: string
    }
  | { status: 'ready'; data: GmailSenderWorkspaceData; error: null; requestKey: string }
  | {
      status: 'error'
      data: GmailSenderWorkspaceData | null
      error: string
      requestKey: string
    }

type SenderDistributionWorkspaceState =
  | { status: 'idle'; data: GmailSenderDistributionData | null; error: null; requestKey: null }
  | {
      status: 'loading'
      data: GmailSenderDistributionData | null
      error: null
      requestKey: string
    }
  | {
      status: 'ready'
      data: GmailSenderDistributionData
      error: null
      requestKey: string
    }
  | {
      status: 'error'
      data: GmailSenderDistributionData | null
      error: string
      requestKey: string
    }

type SenderOverviewWindowState =
  | { status: 'idle'; data: GmailSenderOverviewWindowData | null; error: null; requestKey: null }
  | {
      status: 'loading'
      data: GmailSenderOverviewWindowData | null
      error: null
      requestKey: string
    }
  | {
      status: 'ready'
      data: GmailSenderOverviewWindowData
      error: null
      requestKey: string
    }
  | {
      status: 'error'
      data: GmailSenderOverviewWindowData | null
      error: string
      requestKey: string
    }

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

function safeBrowserTimeZone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return resolved && resolved.trim() ? resolved.trim() : 'UTC'
  } catch {
    return 'UTC'
  }
}

function dateInputFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function dateInputValueFromDate(date: Date, timeZone: string): string {
  const parts = dateInputFormatter(timeZone).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '0000'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function dateInputValueFromIso(value: string | null | undefined, timeZone: string): string | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || parsed < Date.UTC(1971, 0, 1)) return null
  return dateInputValueFromDate(new Date(parsed), timeZone)
}

function senderOverviewWindowControlLabel(selection: SenderOverviewWindowSelection): string {
  return selection.window === 'custom' ? 'Custom' : '1D'
}

function normalizeSenderOverviewWindow(value: string | null): SenderOverviewWindowSelection['window'] | null {
  if (value === 'last_day' || value === 'custom') return value
  return null
}

function senderOverviewWindowSelectionFromSearch(params: {
  senderOverviewWindow: string | null
  senderOverviewStart: string | null
  senderOverviewEnd: string | null
}): SenderOverviewWindowSelection | null {
  const window = normalizeSenderOverviewWindow(params.senderOverviewWindow)
  if (!window) return null
  if (window === 'custom') {
    if (!params.senderOverviewStart || !params.senderOverviewEnd) return null
    return {
      window,
      start: params.senderOverviewStart,
      end: params.senderOverviewEnd,
    }
  }
  return {
    window,
    start: null,
    end: null,
  }
}

function senderOverviewWindowSelectionsMatch(
  left: SenderOverviewWindowSelection | null | undefined,
  right: SenderOverviewWindowSelection | null | undefined
): boolean {
  if (left === right) return true
  if (!left || !right) return left == null && right == null
  return left.window === right.window && left.start === right.start && left.end === right.end
}

function senderOverviewWindowSelectionSignature(params: {
  selection: SenderOverviewWindowSelection | null | undefined
  timeZone?: string | null
}): string | null {
  if (!params.selection) return null
  return [
    params.selection.window,
    params.selection.start || 'none',
    params.selection.end || 'none',
    params.timeZone?.trim() || 'UTC',
  ].join('::')
}

function senderOverviewWindowRangeDetail(data: GmailSenderOverviewWindowData): string {
  return timeContextRangeDetail({
    label: data.window.label,
    effectiveStart: data.window.effective_start,
    effectiveEnd: data.window.effective_end,
    groupingLabel: data.grouping.label,
    limitedByIndexedCoverage: data.window.limited_by_indexed_coverage,
    timeZone: data.time_zone,
  })
}

function timeContextRangeDetail(params: {
  label: string
  effectiveStart: string | null
  effectiveEnd: string | null
  groupingLabel: string
  limitedByIndexedCoverage: boolean
  timeZone: string
}): string {
  if (!params.effectiveStart || !params.effectiveEnd) {
    return `Showing ${params.label.toLowerCase()}`
  }
  const startMs = Date.parse(params.effectiveStart)
  const endMs = Date.parse(params.effectiveEnd)
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    startMs < Date.UTC(1971, 0, 1) ||
    endMs < Date.UTC(1971, 0, 1)
  ) {
    return `Showing ${params.label.toLowerCase()}`
  }
  const start = new Date(startMs)
  const end = new Date(endMs)
  const usesHourlyFormatting = /hour/i.test(params.groupingLabel)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: params.timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(usesHourlyFormatting
      ? {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  })
  const base = `Showing ${formatter.format(start)} - ${formatter.format(end)} · ${params.groupingLabel.toLowerCase()}`
  return params.limitedByIndexedCoverage
    ? `${base} · adjusted to available indexed history`
    : base
}

function clampDateInputToBounds(
  value: string,
  min: string | null,
  max: string | null
): string {
  let next = value
  if (min && next < min) next = min
  if (max && next > max) next = max
  return next
}

function parseTimelineBucketStartMs(
  label: string,
  granularity: 'hour' | 'day' | 'week' | 'month',
  bucketStartIso?: string | null
): number | null {
  const bucketStartMs =
    typeof bucketStartIso === 'string' && bucketStartIso.trim().length > 0
      ? Date.parse(bucketStartIso)
      : Number.NaN
  if (Number.isFinite(bucketStartMs)) return bucketStartMs
  const normalized = label.trim()
  if (!normalized) return null
  if (granularity === 'hour') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(normalized)) return null
    const parsed = Date.parse(`${normalized}:00:00Z`)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (granularity === 'month') {
    if (!/^\d{4}-\d{2}$/.test(normalized)) return null
    const parsed = Date.parse(`${normalized}-01T00:00:00Z`)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null
  const parsed = Date.parse(`${normalized}T00:00:00Z`)
  return Number.isFinite(parsed) ? parsed : null
}

function nextTimelineBucketStartMs(
  bucketStartMs: number,
  granularity: 'hour' | 'day' | 'week' | 'month'
): number {
  const start = new Date(bucketStartMs)
  if (granularity === 'hour') return start.getTime() + 60 * 60 * 1000
  if (granularity === 'month') return addUtcMonths(start, 1).getTime()
  if (granularity === 'week') return addUtcWeeks(start, 1).getTime()
  return addUtcDays(start, 1).getTime()
}

function timeContextResolvedWindowFromTimeline(params: {
  granularity: 'hour' | 'day' | 'week' | 'month'
  items: Array<{
    label: string
    count: number
    bucketStartIso?: string | null
    bucketEndExclusiveIso?: string | null
  }>
  coverageEndIso?: string | null
  limitedByIndexedCoverage: boolean
  timeZone: string
}): {
  groupingLabel: string
  label: string
  effectiveStart: string | null
  effectiveEnd: string | null
  limitedByIndexedCoverage: boolean
  timeZone: string
} | null {
  if (!params.items.length) return null
  const firstBucketStartMs = parseTimelineBucketStartMs(
    params.items[0].label,
    params.granularity,
    params.items[0].bucketStartIso
  )
  const lastBucketStartMs = parseTimelineBucketStartMs(
    params.items[params.items.length - 1].label,
    params.granularity,
    params.items[params.items.length - 1].bucketStartIso
  )
  if (firstBucketStartMs == null || lastBucketStartMs == null) return null

  const lastBucketEndExclusiveMs =
    typeof params.items[params.items.length - 1]?.bucketEndExclusiveIso === 'string'
      ? Date.parse(params.items[params.items.length - 1]!.bucketEndExclusiveIso as string)
      : Number.NaN
  const bucketEndExclusiveMs = Number.isFinite(lastBucketEndExclusiveMs)
    ? lastBucketEndExclusiveMs
    : nextTimelineBucketStartMs(lastBucketStartMs, params.granularity)
  const coverageEndMs = params.coverageEndIso ? Date.parse(params.coverageEndIso) : Number.NaN
  const effectiveEndMs =
    Number.isFinite(coverageEndMs) && coverageEndMs > firstBucketStartMs
      ? Math.min(bucketEndExclusiveMs - 1, coverageEndMs)
      : bucketEndExclusiveMs - 1
  if (effectiveEndMs < firstBucketStartMs) return null

  return {
    groupingLabel:
      params.granularity === 'hour'
        ? 'Hourly bars'
        : params.granularity === 'day'
        ? 'Daily bars'
        : params.granularity === 'week'
          ? 'Weekly bars'
          : 'Monthly bars',
    label:
      params.granularity === 'hour'
        ? 'Trailing 24 hours'
        : params.granularity === 'day'
        ? 'Recent activity'
        : params.granularity === 'week'
          ? 'Quarterly window'
          : 'Indexed history window',
    effectiveStart: new Date(firstBucketStartMs).toISOString(),
    effectiveEnd: new Date(effectiveEndMs).toISOString(),
    limitedByIndexedCoverage: params.limitedByIndexedCoverage,
    timeZone: params.timeZone,
  }
}

function timeContextCoverageFromTimeline(params: {
  granularity: 'hour' | 'day' | 'week' | 'month'
  items: Array<{
    label: string
    count: number
    bucketStartIso?: string | null
    bucketEndExclusiveIso?: string | null
  }>
  coverageEndIso?: string | null
}): {
  indexed_total_rows: number
  indexed_inbox_rows: number
  indexed_date_span_start: string | null
  indexed_date_span_end: string | null
} | null {
  if (!params.items.length) return null
  const firstBucketStartMs = parseTimelineBucketStartMs(
    params.items[0].label,
    params.granularity,
    params.items[0].bucketStartIso
  )
  const lastBucketStartMs = parseTimelineBucketStartMs(
    params.items[params.items.length - 1].label,
    params.granularity,
    params.items[params.items.length - 1].bucketStartIso
  )
  if (firstBucketStartMs == null || lastBucketStartMs == null) return null

  const lastBucketEndExclusiveMs =
    typeof params.items[params.items.length - 1]?.bucketEndExclusiveIso === 'string'
      ? Date.parse(params.items[params.items.length - 1]!.bucketEndExclusiveIso as string)
      : Number.NaN
  const bucketEndExclusiveMs = Number.isFinite(lastBucketEndExclusiveMs)
    ? lastBucketEndExclusiveMs
    : nextTimelineBucketStartMs(lastBucketStartMs, params.granularity)
  const coverageEndMs = params.coverageEndIso ? Date.parse(params.coverageEndIso) : Number.NaN
  const effectiveEndMs =
    Number.isFinite(coverageEndMs) && coverageEndMs > firstBucketStartMs
      ? Math.min(bucketEndExclusiveMs - 1, coverageEndMs)
      : bucketEndExclusiveMs - 1
  if (effectiveEndMs < firstBucketStartMs) return null

  return {
    indexed_total_rows: 0,
    indexed_inbox_rows: 0,
    indexed_date_span_start: new Date(firstBucketStartMs).toISOString(),
    indexed_date_span_end: new Date(effectiveEndMs).toISOString(),
  }
}

function buildSenderOverviewWindowRequestKey(params: {
  clusterId: string
  analysisScope: OperationsAnalysisScope
  cacheVersion: string | null
  selection: SenderOverviewWindowSelection
  timeZone: string
}): string {
  return [
    params.clusterId,
    params.analysisScope,
    params.cacheVersion || 'default',
    params.selection.window,
    params.selection.start || 'none',
    params.selection.end || 'none',
    params.timeZone,
  ].join('::')
}

function isTransientInboxAnalysisGuardError(failure: {
  reason?: string | null
  error?: string | null
}): boolean {
  if (failure.reason === 'already_running' || failure.reason === 'cooldown_active') {
    return true
  }
  return (
    typeof failure.error === 'string' &&
    (/already running/i.test(failure.error) ||
      /just requested/i.test(failure.error) ||
      /wait briefly/i.test(failure.error))
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

function appendSenderOverviewWindowParams(
  search: URLSearchParams,
  selection: SenderOverviewWindowSelection | null | undefined
): void {
  search.delete('sender_overview_window')
  search.delete('sender_overview_start')
  search.delete('sender_overview_end')
  if (!selection) return
  search.set('sender_overview_window', selection.window)
  if (selection.window === 'custom' && selection.start && selection.end) {
    search.set('sender_overview_start', selection.start)
    search.set('sender_overview_end', selection.end)
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

function buildRenderablePublishedReviewUnits<T extends { senderCount: number; targetState: string }>(
  reviewUnits: T[]
): T[] {
  return reviewUnits.filter((unit) => unit.senderCount > 0 && unit.targetState !== 'oversized')
}

function hasRequestedReviewUnitValue(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hydrateClusterRefWithCanonicalIdentity(cluster: GmailCleanupClusterRef): GmailCleanupClusterRef {
  const publishIdentity = buildCleanupGroupFutureCanonicalPublishIdentity(
    cluster.canonicalClusterId || cluster.clusterId
  )
  if (!publishIdentity) return cluster

  return {
    ...cluster,
    canonicalClusterId: cluster.canonicalClusterId || publishIdentity.canonicalClusterId,
    legacyClusterIds: uniqueNonEmptyStrings([
      ...(cluster.legacyClusterIds || []),
      ...publishIdentity.legacyClusterIds,
    ]),
    sourceClusterIds: uniqueNonEmptyStrings([
      ...(cluster.sourceClusterIds || []),
      ...publishIdentity.sourceClusterIds,
    ]),
  }
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

type ReviewHrefParams = {
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
  semanticRoute?: SemanticFocusRouteParams | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
}

function buildReviewHref(params: ReviewHrefParams): string {
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
  if (
    params.subsetSource !== 'review_unit' &&
    params.semanticRoute?.family &&
    params.semanticRoute.subtype
  ) {
    search.set('semantic_family', params.semanticRoute.family)
    search.set('semantic_subtype', params.semanticRoute.subtype)
  }
  appendSenderOverviewWindowParams(search, params.senderOverviewWindowSelection)
  const query = search.toString()
  return `/agents/${params.agentId}/operations/review${query ? `?${query}` : ''}`
}

function buildSemanticFocusRouteParams(
  focus: SemanticSubtypeFocus | null | undefined
): SemanticFocusRouteParams | null {
  if (!focus || focus.kind === 'family') return null
  const subtype = focus.kind === 'remainder' ? 'remainder' : focus.subtypeKey
  if (!subtype) return null
  return {
    family: focus.family,
    subtype,
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
  if (params.subsetSource === 'review_unit' && params.subsetValue) {
    return {
      subsetSource: params.subsetSource,
      subsetValue: params.subsetValue,
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
  if (source === 'review_unit') return 'Derived review unit'
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
  pending?: boolean
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
  pending?: boolean
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
        const activeShellClass = item.pending
          ? 'border-cyan-400/70 bg-cyan-950/18 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
          : item.active
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
                  {item.pending ? (
                    <span className="shrink-0 rounded-full border border-cyan-400/60 bg-cyan-950/28 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-100">
                      Applying
                    </span>
                  ) : null}
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
                className={`h-full rounded-full transition-opacity ${item.accentClass} ${
                  item.pending ? 'opacity-95' : ''
                }`}
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
                className={`block w-full text-left transition hover:text-white ${
                  item.pending ? 'cursor-progress' : ''
                }`}
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
                  const childShellClass = child.pending
                    ? 'border-cyan-400/70 bg-cyan-950/18 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
                    : child.active
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
                            {child.pending ? (
                              <span className="shrink-0 rounded-full border border-cyan-400/60 bg-cyan-950/28 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-100">
                                Applying
                              </span>
                            ) : child.active ? (
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
                          className={`h-full rounded-full transition-opacity ${child.accentClass} ${
                            child.pending ? 'opacity-95' : ''
                          }`}
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
                      className={`block w-full rounded-lg border px-2.5 py-2 text-left transition hover:border-cyan-700/45 hover:text-white ${
                        child.pending ? 'cursor-progress' : ''
                      } ${childShellClass}`}
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
      <div className="rounded-2xl border border-cyan-200/70 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(9,21,33,0.94))] p-4 shadow-[0_18px_40px_rgba(8,145,178,0.2)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{props.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">{props.detail}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/90 bg-cyan-300 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.24)]">
            <span className="h-2 w-2 rounded-full bg-slate-950" />
            Updating now
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            className={`${senderRowShellClass} border-cyan-300/25 bg-[linear-gradient(180deg,rgba(28,52,73,0.72),rgba(10,15,23,0.99))]`}
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 lg:flex-nowrap">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-44 animate-pulse rounded-full bg-cyan-200/45" />
                <div className="h-3 w-full max-w-[18rem] animate-pulse rounded-full bg-cyan-100/20" />
                <div className="h-3 w-full max-w-[24rem] animate-pulse rounded-full bg-cyan-100/15" />
              </div>
              <div className="grid min-w-[11rem] gap-2 sm:grid-cols-2 lg:w-[20rem]">
                <div className="h-7 animate-pulse rounded-full bg-cyan-100/18" />
                <div className="h-7 animate-pulse rounded-full bg-cyan-100/18" />
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

function buildSemanticFocusFromDerivedReviewUnit(params: {
  unit: CleanupGroupPublishedReviewUnit
  familyRow: SemanticFamilyRowPresentation
}): SemanticSubtypeFocus | null {
  if (!params.unit.semanticFamily) return null

  const surfacedSubtypeKeys = params.familyRow.children
    .filter((row) => row.focusTarget.kind === 'subtype' && row.focusTarget.subtypeKey)
    .map((row) => row.focusTarget.subtypeKey as string)

  if (params.unit.kind === 'family') {
    return {
      id: params.unit.id,
      label: params.unit.label,
      family: params.unit.semanticFamily,
      familyLabel: params.familyRow.label,
      publishedSenderCount: params.unit.senderCount,
      publishedParentSharePct: params.unit.familySharePct,
      publishedGroupSharePct: params.unit.groupSharePct,
      subtypeKey: null,
      kind: 'family',
      tone: params.unit.tone,
      surfacedSubtypeKeys,
    }
  }

  const matchedChild = params.familyRow.children.find((child) =>
    params.unit.kind === 'remainder'
      ? child.focusTarget.kind === 'remainder'
      : child.focusTarget.kind === 'subtype' &&
        child.focusTarget.subtypeKey === params.unit.semanticSubtype
  )
  if (!matchedChild) return null

  return {
    id: matchedChild.id,
    label: matchedChild.label,
    family: matchedChild.focusTarget.family,
    familyLabel: params.familyRow.label,
    publishedSenderCount: matchedChild.senderCount,
    publishedParentSharePct: matchedChild.parentSharePct,
    publishedGroupSharePct: matchedChild.groupSharePct,
    subtypeKey: matchedChild.focusTarget.subtypeKey,
    kind: matchedChild.focusTarget.kind,
    tone: matchedChild.tone,
    surfacedSubtypeKeys,
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
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
}): WorkspaceSnapshot {
  return {
    data: params.data,
    clusterId: params.clusterId,
    analysisScope: params.analysisScope,
    mode: params.mode,
    source: params.source,
    cacheVersion: params.cacheVersion,
    previewEvidenceSenderKey: params.previewEvidenceSenderKey || null,
    timeContextBucketLabel:
      typeof params.timeContextBucketLabel === 'string' && params.timeContextBucketLabel.trim()
        ? params.timeContextBucketLabel.trim()
        : null,
    timeContextBucketStartAt:
      typeof params.timeContextBucketStartAt === 'string' && params.timeContextBucketStartAt.trim()
        ? params.timeContextBucketStartAt.trim()
        : null,
    timeContextBucketEndExclusiveAt:
      typeof params.timeContextBucketEndExclusiveAt === 'string' &&
      params.timeContextBucketEndExclusiveAt.trim()
        ? params.timeContextBucketEndExclusiveAt.trim()
        : null,
    senderOverviewWindowSignature: senderOverviewWindowSelectionSignature({
      selection: params.senderOverviewWindowSelection,
      timeZone: params.senderOverviewWindowTimeZone,
    }),
  }
}

function buildWorkspaceRequestKey(params: {
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  reviewUnitId?: string | null
  previewEvidenceSenderKey?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
}): string {
  return [
    params.clusterId,
    params.analysisScope,
    params.mode,
    normalizeWorkspaceCacheVersion(params.cacheVersion),
    params.reviewUnitId?.trim() || 'no-review-unit',
    params.previewEvidenceSenderKey || 'no-preview-evidence-sender',
    normalizeTimeContextBucketLabel(params.timeContextBucketLabel) || 'no-time-context-bucket',
    normalizeTimeContextBucketIso(params.timeContextBucketStartAt) || 'no-time-context-bucket-start',
    normalizeTimeContextBucketIso(params.timeContextBucketEndExclusiveAt) || 'no-time-context-bucket-end',
    senderOverviewWindowSelectionSignature({
      selection: params.senderOverviewWindowSelection,
      timeZone: params.senderOverviewWindowTimeZone,
    }) || 'no-sender-overview-window',
  ].join('::')
}

function normalizeWorkspaceCacheVersion(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTimeContextBucketLabel(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeTimeContextBucketIso(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function workspaceSnapshotRequestKey(snapshot: WorkspaceSnapshot): string {
  return [
    snapshot.clusterId,
    snapshot.analysisScope,
    snapshot.mode,
    normalizeWorkspaceCacheVersion(snapshot.cacheVersion),
    snapshot.previewEvidenceSenderKey || 'no-preview-evidence-sender',
    normalizeTimeContextBucketLabel(snapshot.timeContextBucketLabel) || 'no-time-context-bucket',
    normalizeTimeContextBucketIso(snapshot.timeContextBucketStartAt) || 'no-time-context-bucket-start',
    normalizeTimeContextBucketIso(snapshot.timeContextBucketEndExclusiveAt) || 'no-time-context-bucket-end',
    snapshot.senderOverviewWindowSignature || 'no-sender-overview-window',
  ].join('::')
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
  const clusterTitle = params.entry.cluster_title || params.fallbackClusterTitle
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
  workflowWindowLabel?: string | null
}): SenderOverviewRailScopeStatus {
  const activeScopeLabel = analysisScopeControlLabel(params.activeScope)
  const baselineScopeLabel = analysisScopeControlLabel(params.baselineScope)
  const workflowScopeLabel = analysisScopeControlLabel(params.workflowScope)
  const workflowMatchesPageScope = params.workflowScope === params.baselineScope
  const comparingAlternateScope = params.activeScope !== params.workflowScope
  const workflowBoundaryLabel = workflowMatchesPageScope ? baselineScopeLabel : workflowScopeLabel

  if (params.workflowWindowLabel) {
    if (!comparingAlternateScope) {
      return {
        label: 'Workflow window',
        detail: `${params.workflowWindowLabel} is narrowing Sender Distribution, the workflow list, and Decision Mode inside ${workflowBoundaryLabel}.`,
        tone: 'comparing',
      }
    }

    if (params.comparisonState === 'outside_timeframe') {
      return {
        label: `Comparing ${activeScopeLabel}`,
        detail: `${activeScopeLabel} does not include this cleanup group, so ${params.workflowWindowLabel} remains the active window inside ${workflowBoundaryLabel}.`,
        tone: 'outside',
      }
    }

    if (params.comparisonState === 'unavailable_scope') {
      return {
        label: `Comparing ${activeScopeLabel}`,
        detail: `${activeScopeLabel} has not been loaded for this cleanup group yet, so ${params.workflowWindowLabel} remains the active window inside ${workflowBoundaryLabel}.`,
        tone: 'not_loaded',
      }
    }

    return {
      label: `Comparing ${activeScopeLabel}`,
      detail: `${params.workflowWindowLabel} remains authoritative inside ${workflowBoundaryLabel} while ${activeScopeLabel} is comparison-only in the rail.`,
      tone: 'comparing',
    }
  }

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
  granularity: 'hour' | 'day' | 'week' | 'month'
  items: Array<{ label: string; count: number }>
}): boolean {
  if (params.items.length === 0) return false
  const pattern =
    params.granularity === 'hour'
      ? /^\d{4}-\d{2}-\d{2}T\d{2}$/
      : params.granularity === 'month'
        ? /^\d{4}-\d{2}$/
        : /^\d{4}-\d{2}-\d{2}$/
  return params.items.every((item) => pattern.test((item.label || '').trim()))
}

function mapWorkflowScopeToTimeContextChartScope(
  scope: OperationsAnalysisScope
): TimeContextChartScope | null {
  if (scope === 'all_indexed') return 'all_indexed'
  if (scope === '365d') return 'last_year'
  if (scope === '90d') return 'last_quarter'
  if (scope === '30d') return 'last_month'
  if (scope === '7d') return 'last_week'
  return null
}

function mapTimeContextChartScopeToWorkflowScope(
  scope: TimeContextChartScope
): OperationsAnalysisScope | null {
  if (scope === 'all_indexed') return 'all_indexed'
  if (scope === 'last_year') return '365d'
  if (scope === 'last_quarter') return '90d'
  if (scope === 'last_month') return '30d'
  if (scope === 'last_week') return '7d'
  return null
}

function workflowScopeForSenderOverviewWindowSelection(params: {
  selection: SenderOverviewWindowSelection | null
  effectiveWorkflowScope: OperationsAnalysisScope
  normalizedAnalysisScope: OperationsAnalysisScope
}): OperationsAnalysisScope | null {
  if (!params.selection) return null
  if (params.selection.window === 'last_day') {
    return '7d'
  }
  return params.effectiveWorkflowScope !== params.normalizedAnalysisScope
    ? params.effectiveWorkflowScope
    : null
}

function isTimeContextLaneAAuthorizedScope(scope: OperationsAnalysisScope): boolean {
  return TIME_CONTEXT_LANE_A_WORKFLOW_SCOPES.includes(scope)
}

function utcDayBucketKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`
}

function utcMonthBucketKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function utcWeekBucketKey(date: Date): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  start.setUTCDate(start.getUTCDate() - diff)
  return utcDayBucketKey(start)
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function addUtcWeeks(date: Date, weeks: number): Date {
  return addUtcDays(date, weeks * 7)
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

function labelsMatchContiguousUtcDays(labels: string[]): boolean {
  if (labels.length === 0) return false
  for (let index = 1; index < labels.length; index += 1) {
    const previousMs = Date.parse(`${labels[index - 1]}T00:00:00Z`)
    if (!Number.isFinite(previousMs)) return false
    const expected = utcDayBucketKey(addUtcDays(new Date(previousMs), 1))
    if (labels[index] !== expected) return false
  }
  return true
}

function labelsMatchContiguousUtcMonths(labels: string[]): boolean {
  if (labels.length === 0) return false
  for (let index = 1; index < labels.length; index += 1) {
    const [year, month] = labels[index - 1].split('-').map((value) => Number.parseInt(value, 10))
    if (!Number.isFinite(year) || !Number.isFinite(month)) return false
    const expected = utcMonthBucketKey(addUtcMonths(new Date(Date.UTC(year, month - 1, 1)), 1))
    if (labels[index] !== expected) return false
  }
  return true
}

function labelsMatchContiguousUtcWeeks(labels: string[]): boolean {
  if (labels.length === 0) return false
  for (let index = 1; index < labels.length; index += 1) {
    const previousMs = Date.parse(`${labels[index - 1]}T00:00:00Z`)
    if (!Number.isFinite(previousMs)) return false
    const expected = utcWeekBucketKey(addUtcWeeks(new Date(previousMs), 1))
    if (labels[index] !== expected) return false
  }
  return true
}

function senderOverviewTimeContextLaneATimelineIsCanonical(params: {
  scope: OperationsAnalysisScope
  granularity: 'hour' | 'day' | 'week' | 'month'
  items: Array<{
    label: string
    count: number
    contractVersion?: string | null
    metricFamily?: string | null
    timeZone?: string | null
    bucketStartIso?: string | null
    bucketEndExclusiveIso?: string | null
  }>
  expectedSenderTotal: number
  coverageStartIso?: string | null
}): boolean {
  if (!isTimeContextLaneAAuthorizedScope(params.scope)) return false
  if (params.items.length === 0) return false
  const expectedGranularity =
    params.scope === '90d'
      ? 'week'
      : params.scope === '7d' || params.scope === '30d'
        ? 'day'
        : 'month'
  const expectedBucketCount =
    params.scope === '365d'
      ? 12
      : params.scope === '90d'
        ? 13
        : params.scope === '30d'
          ? 30
          : params.scope === '7d'
            ? 7
            : null
  if (params.granularity !== expectedGranularity) return false
  if (expectedBucketCount != null && params.items.length !== expectedBucketCount) return false
  let previousEndExclusiveMs: number | null = null
  for (const item of params.items) {
    if (item.contractVersion !== 'ace046_phase3_timeline_v1') return false
    if (item.metricFamily !== 'sender_activity') return false
    if (!item.timeZone) return false
    const bucketStartMs =
      typeof item.bucketStartIso === 'string' ? Date.parse(item.bucketStartIso) : Number.NaN
    const bucketEndExclusiveMs =
      typeof item.bucketEndExclusiveIso === 'string'
        ? Date.parse(item.bucketEndExclusiveIso)
        : Number.NaN
    if (!Number.isFinite(bucketStartMs) || !Number.isFinite(bucketEndExclusiveMs)) {
      return false
    }
    if (bucketStartMs >= bucketEndExclusiveMs) return false
    if (previousEndExclusiveMs != null && bucketStartMs !== previousEndExclusiveMs) {
      return false
    }
    previousEndExclusiveMs = bucketEndExclusiveMs
  }
  if (expectedBucketCount != null) {
    return true
  }
  // All indexed is non-additive: a sender can be counted in every month where it had activity.
  return true
}

function workspaceHasCanonicalTimeContextTimeline(
  workspace: GmailSenderWorkspaceData | null | undefined,
  scope: OperationsAnalysisScope
): boolean {
  if (!workspace) return false
  return senderOverviewTimeContextLaneATimelineIsCanonical({
    scope,
    granularity: workspace.analytics.sender_activity_timeline_granularity || 'month',
    items: workspace.analytics.sender_activity_timeline.map((item) => ({
      label: item.label,
      count: item.sender_count,
      contractVersion: item.contract_version ?? null,
      metricFamily: item.metric_family ?? null,
      timeZone: item.time_zone ?? null,
      bucketStartIso: normalizeTimeContextBucketIso(item.bucket_start_iso),
      bucketEndExclusiveIso: normalizeTimeContextBucketIso(item.bucket_end_exclusive_iso),
    })),
    expectedSenderTotal: workspaceClusterSenderTotal(workspace),
  })
}

function requiresScopedTimeContextTimeline(params: {
  analysisScope: OperationsAnalysisScope
  timeContextBucketLabel?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
}): boolean {
  if (params.timeContextBucketLabel != null) return false
  if (params.senderOverviewWindowSelection != null) return false
  return (
    params.analysisScope === '7d' ||
    params.analysisScope === '30d' ||
    params.analysisScope === '365d'
  )
}

function workspaceSnapshotMatchesRequest(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  allowStaleCacheVersion?: boolean
  previewEvidenceSenderKey?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
}): boolean {
  return Boolean(
    params.snapshot &&
      params.snapshot.clusterId === params.clusterId &&
      params.snapshot.analysisScope === params.analysisScope &&
      params.snapshot.mode === params.mode &&
      (params.allowStaleCacheVersion === true ||
        normalizeWorkspaceCacheVersion(params.snapshot.cacheVersion) ===
          normalizeWorkspaceCacheVersion(params.cacheVersion)) &&
      (params.previewEvidenceSenderKey == null ||
        params.snapshot.previewEvidenceSenderKey === params.previewEvidenceSenderKey) &&
      normalizeTimeContextBucketLabel(params.snapshot.timeContextBucketLabel) ===
        normalizeTimeContextBucketLabel(params.timeContextBucketLabel) &&
      normalizeTimeContextBucketIso(params.snapshot.timeContextBucketStartAt) ===
        normalizeTimeContextBucketIso(params.timeContextBucketStartAt) &&
      normalizeTimeContextBucketIso(params.snapshot.timeContextBucketEndExclusiveAt) ===
        normalizeTimeContextBucketIso(params.timeContextBucketEndExclusiveAt) &&
      params.snapshot.senderOverviewWindowSignature ===
        senderOverviewWindowSelectionSignature({
          selection: params.senderOverviewWindowSelection,
          timeZone: params.senderOverviewWindowTimeZone,
        }) &&
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
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
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
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: params.senderOverviewWindowTimeZone,
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
  allowStaleCacheVersion?: boolean
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
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
      allowStaleCacheVersion: params.allowStaleCacheVersion,
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: params.senderOverviewWindowTimeZone,
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
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  if (
    snapshot.clusterId !== params.clusterId ||
    snapshot.analysisScope !== params.analysisScope ||
    normalizeWorkspaceCacheVersion(snapshot.cacheVersion) !==
    normalizeWorkspaceCacheVersion(params.cacheVersion) ||
    normalizeTimeContextBucketLabel(snapshot.timeContextBucketLabel) !==
      normalizeTimeContextBucketLabel(params.timeContextBucketLabel) ||
    normalizeTimeContextBucketIso(snapshot.timeContextBucketStartAt) !==
      normalizeTimeContextBucketIso(params.timeContextBucketStartAt) ||
    normalizeTimeContextBucketIso(snapshot.timeContextBucketEndExclusiveAt) !==
      normalizeTimeContextBucketIso(params.timeContextBucketEndExclusiveAt) ||
    snapshot.senderOverviewWindowSignature !==
      senderOverviewWindowSelectionSignature({
        selection: params.senderOverviewWindowSelection,
        timeZone: params.senderOverviewWindowTimeZone,
      }) ||
    snapshot.data.selected_cluster.cluster_id !== params.clusterId ||
    (!workspaceHasUsableClusterGlobalSenderKeys(snapshot.data) &&
      !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope))
  ) {
    return false
  }

  if (
    requiresScopedTimeContextTimeline({
      analysisScope: params.analysisScope,
      timeContextBucketLabel: params.timeContextBucketLabel,
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
    }) &&
    !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope)
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
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
}): boolean {
  const snapshot = params.snapshot
  if (!snapshot) return false
  if (
    snapshot.clusterId !== params.clusterId ||
    snapshot.analysisScope !== params.analysisScope ||
    normalizeTimeContextBucketLabel(snapshot.timeContextBucketLabel) !==
      normalizeTimeContextBucketLabel(params.timeContextBucketLabel) ||
    normalizeTimeContextBucketIso(snapshot.timeContextBucketStartAt) !==
      normalizeTimeContextBucketIso(params.timeContextBucketStartAt) ||
    normalizeTimeContextBucketIso(snapshot.timeContextBucketEndExclusiveAt) !==
      normalizeTimeContextBucketIso(params.timeContextBucketEndExclusiveAt) ||
    snapshot.senderOverviewWindowSignature !==
      senderOverviewWindowSelectionSignature({
        selection: params.senderOverviewWindowSelection,
        timeZone: params.senderOverviewWindowTimeZone,
      }) ||
    snapshot.data.selected_cluster.cluster_id !== params.clusterId ||
    (!workspaceHasUsableClusterGlobalSenderKeys(snapshot.data) &&
      !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope))
  ) {
    return false
  }

  if (
    requiresScopedTimeContextTimeline({
      analysisScope: params.analysisScope,
      timeContextBucketLabel: params.timeContextBucketLabel,
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
    }) &&
    !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope)
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

function workspacePageHasRenderableRowsOrTrulyEmpty(
  data: GmailSenderWorkspaceData
): boolean {
  const totalSenders = workspaceClusterSenderTotal(data)
  return data.senders.length > 0 || totalSenders === 0
}

function workspaceSnapshotSatisfiesCurrentMode(params: {
  snapshot: WorkspaceSnapshot | null | undefined
  clusterId: string
  analysisScope: OperationsAnalysisScope
  mode: ReviewMode
  cacheVersion: string | null
  page: number
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
  senderOverviewWindowTimeZone?: string | null
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
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: params.senderOverviewWindowTimeZone,
    })
  ) {
    return false
  }

  if (!workspacePageHasRenderableRowsOrTrulyEmpty(snapshot.data)) return false
  if (
    !workspaceHasClusterGlobalSenderKeys(snapshot.data) &&
    !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope)
  ) {
    return false
  }
  if (
    params.mode === 'overview' &&
    requiresScopedTimeContextTimeline({
      analysisScope: params.analysisScope,
      timeContextBucketLabel: params.timeContextBucketLabel,
      senderOverviewWindowSelection: params.senderOverviewWindowSelection,
    }) &&
    !workspaceHasCanonicalTimeContextTimeline(snapshot.data, params.analysisScope)
  ) {
    return false
  }
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
  const browserTimeZone = useMemo(() => safeBrowserTimeZone(), [])
  const requestedWorkflowScope = searchParams.get('workflow_scope')
  const normalizedRequestedWorkflowScope =
    requestedWorkflowScope != null
      ? normalizeOperationsAnalysisScope(requestedWorkflowScope)
      : null
  const effectiveWorkflowScope = normalizedRequestedWorkflowScope || normalizedAnalysisScope
  const senderOverviewWindowSelection = useMemo(
    () =>
      senderOverviewWindowSelectionFromSearch({
        senderOverviewWindow: searchParams.get('sender_overview_window'),
        senderOverviewStart: searchParams.get('sender_overview_start'),
        senderOverviewEnd: searchParams.get('sender_overview_end'),
      }),
    [searchParams]
  )
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
      (renderRuntimeData?.runtime_cleanup_plan?.clusters || []).map((cluster) =>
        hydrateClusterRefWithCanonicalIdentity({
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
          title: cluster.title,
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
        })
      ),
    [renderRuntimeData?.runtime_cleanup_plan?.clusters]
  )
  const runtimeMailboxIntelligenceClusters = useMemo<GmailCleanupClusterRef[]>(
    () =>
      (renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups || []).map((cluster) =>
        hydrateClusterRefWithCanonicalIdentity({
          clusterId: cluster.cluster_id,
          canonicalClusterId: cluster.canonical_cluster_id,
          legacyClusterIds: cluster.legacy_cluster_ids || [],
          sourceClusterIds: cluster.source_cluster_ids || [],
          clusterType: cluster.cluster_type,
          title: cluster.title,
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
        })
      ),
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
  const selectedCanonicalClusterId =
    selectedCluster?.canonicalClusterId || selectedCluster?.clusterId || resolvedRequestedClusterId
  const selectedMailboxIntelligenceGroup = useMemo(() => {
    if (!selectedCanonicalClusterId) return null
    return (
      (renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups || []).find(
        (group) =>
          (group.canonical_cluster_id || group.cluster_id) === selectedCanonicalClusterId ||
          group.cluster_id === selectedCanonicalClusterId
      ) || null
    )
  }, [renderRuntimeData?.runtime_mailbox_intelligence?.cleanup_groups, selectedCanonicalClusterId])
  const publishedReviewUnitEntryUnits = useMemo(
    () =>
      selectedCluster
        ? buildCleanupGroupPublishedReviewUnits(
            selectedCluster.clusterId,
            selectedMailboxIntelligenceGroup?.semantic_rollup || null
          )
        : [],
    [selectedCluster, selectedMailboxIntelligenceGroup?.semantic_rollup]
  )
  const publishedReviewUnitEntryRequestedUnit = useMemo(
    () =>
      subsetSource === 'review_unit'
        ? findCleanupGroupPublishedReviewUnit(publishedReviewUnitEntryUnits, subsetValue?.trim())
        : null,
    [publishedReviewUnitEntryUnits, subsetSource, subsetValue]
  )
  const selectablePublishedReviewUnits = useMemo(
    () => buildRenderablePublishedReviewUnits(publishedReviewUnitEntryUnits),
    [publishedReviewUnitEntryUnits]
  )
  const publishedReviewUnitsRequired =
    selectedMailboxIntelligenceGroup?.semantic_rollup?.review_unit_plan?.required === true
  const publishedReviewUnitEntryState = useMemo<PublishedReviewUnitEntryState | null>(() => {
    if (!selectedCluster) return null
    if (!publishedReviewUnitsRequired && publishedReviewUnitEntryUnits.length === 0) return null
    if (subsetSource === 'review_unit' && !hasRequestedReviewUnitValue(subsetValue)) {
      return 'missing_unit'
    }
    if (selectablePublishedReviewUnits.length === 0) return 'unavailable_units'
    if (subsetSource !== 'review_unit') return 'choose_unit'
    if (!publishedReviewUnitEntryRequestedUnit) return 'invalid_unit'
    if (publishedReviewUnitEntryRequestedUnit.targetState === 'oversized') return 'oversized_unit'
    return null
  }, [
    publishedReviewUnitEntryRequestedUnit,
    publishedReviewUnitEntryUnits.length,
    publishedReviewUnitsRequired,
    selectablePublishedReviewUnits.length,
    selectedCluster,
    subsetSource,
    subsetValue,
  ])
  useEffect(() => {
    if (runtime.loading || !renderRuntimeData) return
    if (
      publishedReviewUnitEntryState !== 'missing_unit' &&
      publishedReviewUnitEntryState !== 'invalid_unit'
    ) {
      return
    }

    router.replace(`/agents/${agentId}/operations/clusters${serializeOperationsQuery(sessionId, analysisScope)}`)
  }, [
    agentId,
    analysisScope,
    publishedReviewUnitEntryState,
    renderRuntimeData,
    router,
    runtime.loading,
    sessionId,
  ])
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
  const railScopeResetKey = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('workflow_scope')
    return next.toString()
  }, [searchParams])
  const [pendingSenderDistributionScope, setPendingSenderDistributionScope] =
    useState<OperationsAnalysisScope | null>(null)
  const [pendingTimeContextScope, setPendingTimeContextScope] =
    useState<OperationsAnalysisScope | null>(null)
  const [pendingSenderOverviewWindowSelection, setPendingSenderOverviewWindowSelection] =
    useState<SenderOverviewWindowSelection | null>(null)
  const [selectedTimeContextBucket, setSelectedTimeContextBucket] =
    useState<GmailTimeContextBucketSelection | null>(null)
  const [localSenderDistributionFocusKey, setLocalSenderDistributionFocusKey] = useState<string | null>(
    null
  )
  const [timeContextBucketNotice, setTimeContextBucketNotice] =
    useState<TimeContextBucketNotice | null>(null)
  const [pendingNarrowingInteraction, setPendingNarrowingInteraction] =
    useState<PendingNarrowingInteraction | null>(null)
  const currentRequestedWorkflowScope =
    requestedWorkflowScope != null ? normalizedRequestedWorkflowScope : null
  const resolvedTimeContextState = useMemo<ResolvedTimeContextState>(() => {
    if (senderOverviewWindowSelection && currentRequestedWorkflowScope) {
      return {
        mode: 'workflow_window',
        pageScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        routeWorkflowScope: currentRequestedWorkflowScope,
        windowSelection: senderOverviewWindowSelection,
        chartFocusLabel: null,
      }
    }
    if (selectedTimeContextBucket?.label) {
      return {
        mode: 'scoped_workflow_scope',
        pageScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        routeWorkflowScope: currentRequestedWorkflowScope || effectiveWorkflowScope,
        windowSelection: null,
        chartFocusLabel: null,
      }
    }
    if (currentRequestedWorkflowScope) {
      return {
        mode: 'scoped_workflow_scope',
        pageScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        routeWorkflowScope: currentRequestedWorkflowScope,
        windowSelection: null,
        chartFocusLabel: null,
      }
    }
    return {
      mode: 'default_overview',
      pageScope: normalizedAnalysisScope,
      workflowScope: effectiveWorkflowScope,
      routeWorkflowScope: null,
      windowSelection: null,
      chartFocusLabel: null,
    }
  }, [
    selectedTimeContextBucket?.label,
    currentRequestedWorkflowScope,
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    senderOverviewWindowSelection,
  ])
  const activeRailScope = resolvedTimeContextState.workflowScope
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
    setPendingSenderDistributionScope(null)
  }, [activeRailScopeBaselineKey])
  useEffect(() => {
    setPendingTimeContextScope(null)
  }, [activeRailScopeBaselineKey])
  useEffect(() => {
    setLocalSenderDistributionFocusKey(null)
  }, [activeRailScopeBaselineKey])
  useEffect(() => {
    setPendingSenderOverviewWindowSelection((current) =>
      current == null ||
      senderOverviewWindowSelection == null ||
      senderOverviewWindowSelectionsMatch(current, senderOverviewWindowSelection)
        ? null
        : current
    )
  }, [senderOverviewWindowSelection])
  useEffect(() => {
    setPendingSenderDistributionScope((current) =>
      current != null && current === effectiveWorkflowScope ? null : current
    )
  }, [effectiveWorkflowScope])
  useEffect(() => {
    setPendingTimeContextScope((current) =>
      current != null && current === effectiveWorkflowScope ? null : current
    )
  }, [effectiveWorkflowScope])
  useEffect(() => {
    setSelectedTimeContextBucket(null)
  }, [
    effectiveWorkflowScope,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
  ])
  useEffect(() => {
    setLocalSenderDistributionFocusKey(null)
  }, [
    effectiveWorkflowScope,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
    subsetSource,
    subsetValue,
  ])
  useEffect(() => {
    if (!senderOverviewWindowSelection) return
    setPendingNarrowingInteraction((current) =>
      current?.kind === 'time_context_bucket' ? null : current
    )
    setTimeContextBucketNotice(null)
    setSelectedTimeContextBucket(null)
  }, [senderOverviewWindowSelection])
  const activeTimeContextChartScope = useMemo(
    () =>
      resolvedTimeContextState.windowSelection?.window ||
      mapWorkflowScopeToTimeContextChartScope(effectiveWorkflowScope) ||
      'all_indexed',
    [effectiveWorkflowScope, resolvedTimeContextState.windowSelection]
  )
  const timeContextBucketInteractionMode: TimeContextBucketInteractionMode =
    'workflow_narrowing'
  const pendingTimeContextChartScope = useMemo(
    () => {
      if (pendingSenderOverviewWindowSelection) return pendingSenderOverviewWindowSelection.window
      return pendingTimeContextScope != null
        ? mapWorkflowScopeToTimeContextChartScope(pendingTimeContextScope)
        : null
    },
    [pendingSenderOverviewWindowSelection, pendingTimeContextScope]
  )
  const requestedTimeContextBucketLabel = selectedTimeContextBucket?.label || null
  const requestedTimeContextBucketStartAt =
    selectedTimeContextBucket?.bucket_start_at || null
  const requestedTimeContextBucketEndExclusiveAt =
    selectedTimeContextBucket?.bucket_end_exclusive_at || null
  const timeContextBucketRequestActive = requestedTimeContextBucketLabel != null
  const senderOverviewWorkflowWindowActive = resolvedTimeContextState.mode === 'workflow_window'
  const workflowScopeForOverviewContext = useCallback(
    (params: {
      subsetSource: OverviewSubsetSource | null
      subsetValue: string | null
      semanticFocus: SemanticSubtypeFocus | null
    }) => {
      void params
      return currentRequestedWorkflowScope
    },
    [currentRequestedWorkflowScope]
  )
  const buildPendingNarrowingExpectation = useCallback(
    (
      overrides?: Partial<PendingNarrowingInteractionExpectation>
    ): PendingNarrowingInteractionExpectation => ({
      workflowScope: currentRequestedWorkflowScope,
      subsetSource,
      subsetValue,
      semanticFocusId: activeSemanticSubtypeFocusRef.current?.id || null,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      ...overrides,
    }),
    [
      currentRequestedWorkflowScope,
      requestedTimeContextBucketLabel,
      requestedTimeContextBucketStartAt,
      requestedTimeContextBucketEndExclusiveAt,
      subsetSource,
      subsetValue,
    ]
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
    if (typeof transitionTitle === 'string' && transitionTitle.trim()) return transitionTitle
    const remembered = rememberedRequestedClustersRef.current.get(rawRequestedClusterId)
    if (remembered?.title) return remembered.title
    return humanizeCleanupGroupId(rawRequestedClusterId)
  }, [rawRequestedClusterId, reviewScopeTransitionSnapshot?.data.selected_cluster.title])
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
  const senderOverviewWindowRequestKey = useMemo(
    () =>
      selectedCluster && senderOverviewWindowSelection
        ? buildSenderOverviewWindowRequestKey({
            clusterId: selectedCluster.clusterId,
            analysisScope: effectiveWorkflowScope,
            cacheVersion,
            selection: senderOverviewWindowSelection,
            timeZone: browserTimeZone,
          })
        : null,
    [
      browserTimeZone,
      cacheVersion,
      effectiveWorkflowScope,
      selectedCluster,
      senderOverviewWindowSelection,
    ]
  )
  const cachedSenderOverviewWindow = useMemo(
    () =>
      selectedCluster && senderOverviewWindowSelection
        ? readCachedGmailSenderOverviewWindow({
            selectedCluster,
            analysisScope: effectiveWorkflowScope,
            cacheVersion,
            pressureWindow: senderOverviewWindowSelection.window,
            pressureStart: senderOverviewWindowSelection.start,
            pressureEnd: senderOverviewWindowSelection.end,
            timeZone: browserTimeZone,
          })
        : null,
    [
      browserTimeZone,
      cacheVersion,
      effectiveWorkflowScope,
      runtimeClusters,
      selectedCluster,
      senderOverviewWindowSelection,
    ]
  )
  const [senderOverviewWindowState, setSenderOverviewWindowState] = useState<SenderOverviewWindowState>(
    () =>
      senderOverviewWindowRequestKey && cachedSenderOverviewWindow
        ? {
            status: 'ready',
            data: cachedSenderOverviewWindow,
            error: null,
            requestKey: senderOverviewWindowRequestKey,
          }
        : {
            status: 'idle',
            data: null,
            error: null,
            requestKey: null,
          }
  )
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: null,
      senderOverviewStart: null,
      senderOverviewEnd: null,
      timeZone: browserTimeZone,
    })
  }, [
    analysisScope,
    browserTimeZone,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    mode,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    runtimeClusters,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
    selectedCluster,
  ])
  useEffect(() => {
    if (!selectedCluster || !senderOverviewWindowSelection || !senderOverviewWindowRequestKey) {
      setSenderOverviewWindowState({
        status: 'idle',
        data: null,
        error: null,
        requestKey: null,
      })
      return
          }

        let cancelled = false
        const controller = new AbortController()
        const seedData = cachedSenderOverviewWindow

    setSenderOverviewWindowState({
      status: 'loading',
      data: seedData,
      error: null,
      requestKey: senderOverviewWindowRequestKey,
    })

    void (async () => {
      let attempt = 0
      while (!cancelled) {
        const result = await fetchGmailSenderOverviewWindow({
          selectedCluster,
          allClusters: runtimeClusters,
          analysisScope: effectiveWorkflowScope,
          cacheVersion,
          pressureWindow: senderOverviewWindowSelection.window,
          pressureStart: senderOverviewWindowSelection.start,
          pressureEnd: senderOverviewWindowSelection.end,
          timeZone: browserTimeZone,
          requestContext: {
            source: 'operations_review_page',
            component: 'sender_overview',
            reason: 'time_context_workflow_window',
            phase: 'interactive',
            agentId,
          },
          signal: controller.signal,
        })
        if (cancelled || ('aborted' in result && result.aborted)) return
        if (!result.ok) {
          if (attempt < 5 && isTransientInboxAnalysisGuardError(result)) {
            attempt += 1
            await delayMs(1200)
            continue
          }
          setSenderOverviewWindowState({
            status: 'error',
            data: seedData,
            error: result.error,
            requestKey: senderOverviewWindowRequestKey,
          })
          return
        }
        setSenderOverviewWindowState({
          status: 'ready',
          data: result.data,
          error: null,
          requestKey: senderOverviewWindowRequestKey,
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
    browserTimeZone,
    cacheVersion,
    cachedSenderOverviewWindow,
    effectiveWorkflowScope,
    runtimeClusters,
    selectedCluster,
    senderOverviewWindowRequestKey,
    senderOverviewWindowSelection,
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    cachedWorkspace,
    decisionPreviewEvidenceSenderKey,
    mode,
    normalizedAnalysisScope,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindowSelection,
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: senderOverviewWindowSelection?.window || null,
      senderOverviewStart: senderOverviewWindowSelection?.start || null,
      senderOverviewEnd: senderOverviewWindowSelection?.end || null,
      timeZone: browserTimeZone,
    })
  }, [
    analysisScope,
    browserTimeZone,
    cacheVersion,
    mode,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    runtimeClusters,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
    selectedCluster,
  ])
  const cachedDecisionWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !cachedDecisionWorkspace) return null
    return buildWorkspaceSnapshot({
      data: cachedDecisionWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: normalizedAnalysisScope,
      mode: 'decision',
      source: 'cache',
      cacheVersion,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    cachedDecisionWorkspace,
    normalizedAnalysisScope,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindowSelection,
    selectedCluster,
  ])
  const workflowCachedWorkspace = useMemo(() => {
    if (!selectedCluster || senderOverviewWindowSelection) return null
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: null,
      senderOverviewStart: null,
      senderOverviewEnd: null,
      timeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    runtimeClusters,
    senderOverviewWindowSelection,
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindowSelection,
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: senderOverviewWindowSelection?.window || null,
      senderOverviewStart: senderOverviewWindowSelection?.start || null,
      senderOverviewEnd: senderOverviewWindowSelection?.end || null,
      timeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    runtimeClusters,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
    selectedCluster,
  ])
  const workflowCachedDecisionWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster || !workflowCachedDecisionWorkspace) return null
    return buildWorkspaceSnapshot({
      data: workflowCachedDecisionWorkspace,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode: 'decision',
      source: 'cache',
      cacheVersion,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
      ? workflowCachedWorkspaceSnapshot
      : null
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
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
  const hasDefaultOverviewBootstrapRailSeed = useMemo(() => {
    const scopes = renderRuntimeData?.runtime_selected_cluster_rail_family?.scopes
    return Array.isArray(scopes) && scopes.length > 0
  }, [renderRuntimeData?.runtime_selected_cluster_rail_family])
  const initialPassiveReadyWorkspaceSnapshot = useMemo(
    () =>
      mode === 'decision'
        ? workflowCachedReadyWorkspaceSnapshot || null
        : workflowCachedReadyWorkspaceSnapshot ||
            (!timeContextBucketRequestActive &&
            !senderOverviewWorkflowWindowActive &&
            effectiveWorkflowScope === normalizedAnalysisScope
              ? trustedRuntimeOverviewWorkspaceSnapshot
              : null) ||
            null,
    [
      effectiveWorkflowScope,
      mode,
      normalizedAnalysisScope,
      senderOverviewWorkflowWindowActive,
      timeContextBucketRequestActive,
      trustedRuntimeOverviewWorkspaceSnapshot,
      workflowCachedReadyWorkspaceSnapshot,
    ]
  )
  const initialPassiveSeedWorkspaceSnapshot = useMemo(
    () =>
      mode === 'overview'
        ? workflowCachedWorkspaceSnapshot ||
            (!timeContextBucketRequestActive &&
            !senderOverviewWorkflowWindowActive &&
            effectiveWorkflowScope === normalizedAnalysisScope
              ? trustedRuntimeOverviewWorkspaceSnapshot
              : null) ||
            null
        : null,
    [
      effectiveWorkflowScope,
      mode,
      normalizedAnalysisScope,
      senderOverviewWorkflowWindowActive,
      timeContextBucketRequestActive,
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
    return (
      cachedWorkspaceSnapshot ||
      (!timeContextBucketRequestActive && !senderOverviewWorkflowWindowActive
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null) ||
      null
    )
  }, [
    cachedWorkspaceSnapshot,
    initialPassiveReadyWorkspaceSnapshot,
    initialPassiveSeedWorkspaceSnapshot,
    senderOverviewWorkflowWindowActive,
    timeContextBucketRequestActive,
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
  // Keep the document locked only when Decision Mode has an actual cleanup
  // group to render. An unscoped guidance route must remain page-scrollable.
  const decisionOverlayOpen =
    mode === 'decision' && !missingScopedCluster && selectedCluster != null
  const decisionOverlayScrollTopRef = useRef<number | null>(null)
  const decisionOverlayPreviouslyOpenRef = useRef<boolean>(decisionOverlayOpen)
  const activeSemanticSubtypeFocusRef = useRef<SemanticSubtypeFocus | null>(null)
  const currentSemanticRouteParamsRef = useRef<SemanticFocusRouteParams | null>(null)
  const senderOverviewWindowSelectionRef = useRef<SenderOverviewWindowSelection | null>(
    senderOverviewWindowSelection
  )
  const senderWorkflowSectionRef = useRef<HTMLElement | null>(null)
  const senderWorkflowPendingScrollRef = useRef<boolean>(false)
  const semanticFocusRefocusPendingRef = useRef<boolean>(false)
  const previousOverviewPageRef = useRef<number>(requestedSenderPage)
  const buildScopedReviewHref = useCallback(
    (
      params: Omit<ReviewHrefParams, 'semanticRoute'> & {
        semanticFocus?: SemanticSubtypeFocus | null
        semanticRoute?: SemanticFocusRouteParams | null
      }
    ) => {
      const { semanticFocus, semanticRoute, ...rest } = params
      const resolvedSemanticRoute =
        semanticRoute !== undefined
          ? semanticRoute
          : semanticFocus !== undefined
            ? buildSemanticFocusRouteParams(semanticFocus)
            : currentSemanticRouteParamsRef.current
      return buildReviewHref({
        ...rest,
        semanticRoute: resolvedSemanticRoute,
        senderOverviewWindowSelection:
          params.senderOverviewWindowSelection !== undefined
            ? params.senderOverviewWindowSelection
            : senderOverviewWindowSelectionRef.current,
      })
    },
    []
  )
  const setWorkspaceStateIfChanged = useCallback((next: WorkspaceStateTransition) => {
    setWorkspaceState((current) => {
      const candidate = typeof next === 'function' ? next(current) : next
      return workspaceStatesEqual(current, candidate) ? current : candidate
    })
  }, [])
  const navigateScopedReviewState = useCallback(
    (params: {
      workflowScope?: OperationsAnalysisScope | null
      clusterId?: string | null
      subsetSource?: OverviewSubsetSource | null
      subsetValue?: string | null
      senderPage?: number | null
      semanticFocus?: SemanticSubtypeFocus | null
      semanticRoute?: SemanticFocusRouteParams | null
      senderKey?: string | null
      overlayIntent?: DecisionOverlayIntent | null
      senderOverviewWindowSelection?: SenderOverviewWindowSelection | null
      pendingSenderDistributionScope?: OperationsAnalysisScope | null
      pendingTimeContextScope?: OperationsAnalysisScope | null
      pendingSenderOverviewWindowSelection?: SenderOverviewWindowSelection | null
    }) => {
      const nextClusterId = params.clusterId ?? selectedCluster?.clusterId ?? clusterId
      if (!nextClusterId) return

      if (params.pendingSenderDistributionScope !== undefined) {
        setPendingSenderDistributionScope(params.pendingSenderDistributionScope)
      }
      if (params.pendingTimeContextScope !== undefined) {
        setPendingTimeContextScope(params.pendingTimeContextScope)
      }
      if (params.pendingSenderOverviewWindowSelection !== undefined) {
        setPendingSenderOverviewWindowSelection(params.pendingSenderOverviewWindowSelection)
      }

      senderWorkflowPendingScrollRef.current = false
      startTransition(() => {
        router.replace(
          buildScopedReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: params.workflowScope,
            clusterId: nextClusterId,
            mode,
            subsetSource: params.subsetSource,
            subsetValue: params.subsetValue,
            senderPage: params.senderPage ?? null,
            semanticFocus: params.semanticFocus,
            semanticRoute: params.semanticRoute,
            senderKey: params.senderKey ?? null,
            overlayIntent: params.overlayIntent ?? null,
            senderOverviewWindowSelection: params.senderOverviewWindowSelection ?? null,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      buildScopedReviewHref,
      clusterId,
      mode,
      router,
      selectedCluster?.clusterId,
      sessionId,
    ]
  )
  useEffect(() => {
    if (!selectedCluster) return
    if (!senderOverviewWindowSelection) return
    const desiredWorkflowScope = workflowScopeForSenderOverviewWindowSelection({
      selection: senderOverviewWindowSelection,
      effectiveWorkflowScope: currentRequestedWorkflowScope || effectiveWorkflowScope,
      normalizedAnalysisScope,
    })
    if (desiredWorkflowScope === currentRequestedWorkflowScope) return

    navigateScopedReviewState({
      workflowScope: desiredWorkflowScope,
      clusterId: selectedCluster.clusterId,
      subsetSource,
      subsetValue,
      senderPage: searchParams.get('sender_page') != null ? requestedSenderPage : null,
      semanticFocus: activeSemanticSubtypeFocusRef.current,
      senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
      overlayIntent: mode === 'decision' ? decisionOverlayIntent : null,
      senderOverviewWindowSelection,
    })
  }, [
    currentRequestedWorkflowScope,
    decisionOverlayIntent,
    effectiveWorkflowScope,
    mode,
    navigateScopedReviewState,
    normalizedAnalysisScope,
    requestedDecisionSenderKey,
    requestedSenderPage,
    searchParams,
    selectedCluster,
    senderOverviewWindowSelection,
    subsetSource,
    subsetValue,
  ])
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
      ? workspaceState.snapshot
      : null
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
    selectedCluster,
    workspaceState.snapshot,
  ])
  const currentReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    return workspaceSnapshotSatisfiesCurrentMode({
      snapshot: workspaceState.snapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
      page: mode === 'overview' ? requestedSenderPage : DEFAULT_OVERVIEW_WORKSPACE_PAGE,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
      ? workspaceState.snapshot
      : null
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    mode,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
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
    if (
      senderOverviewWindowSelection &&
      nextOverviewSnapshot.analysisScope === normalizedAnalysisScope &&
      nextOverviewSnapshot.senderOverviewWindowSignature !==
        senderOverviewWindowSelectionSignature({
          selection: senderOverviewWindowSelection,
          timeZone: browserTimeZone,
        })
    ) {
      return
    }
    setPersistedOverviewWorkspaceSnapshot((current) =>
      workspaceSnapshotsMateriallyEqual(current, nextOverviewSnapshot) ? current : nextOverviewSnapshot
    )
  }, [
    browserTimeZone,
    cachedWorkspaceSnapshot,
    normalizedAnalysisScope,
    senderOverviewWindowSelection,
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

    const shouldAllowStaleContinuitySnapshot =
      runtime.loading ||
      runtime.refreshing ||
      workspaceState.status === 'loading' ||
      runtime.runtimeContinuity?.phase === 'build_pending' ||
      runtime.runtimeContinuity?.phase === 'ready'

    const exactMatch =
      candidateSnapshots.find((snapshot) =>
        workspaceSnapshotMatchesOverviewShellTruth({
          snapshot,
          clusterId: requestedClusterId,
          analysisScope: normalizedAnalysisScope,
          cacheVersion,
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null

    if (exactMatch) return exactMatch
    if (!shouldAllowStaleContinuitySnapshot) return null

    return (
      candidateSnapshots.find((snapshot) =>
        workspaceSnapshotMatchesOverviewShellTruth({
          snapshot,
          clusterId: requestedClusterId,
          analysisScope: normalizedAnalysisScope,
          cacheVersion,
          allowStaleCacheVersion: true,
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null
    )
  }, [
    browserTimeZone,
    cacheVersion,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedClusterId,
    reviewScopeTransitionSnapshot,
    runtime.loading,
    runtime.refreshing,
    runtime.runtimeContinuity?.phase,
    senderOverviewWindowSelection,
    workspaceState.status,
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
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null
    )
  }, [
    browserTimeZone,
    cacheVersion,
    cachedWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    senderOverviewWindowSelection,
    selectedCluster,
    trustedRuntimeOverviewStructureSnapshot,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
  ])
  const continuityShellEligibleForCurrentRoute =
    !timeContextBucketRequestActive &&
    !senderOverviewWorkflowWindowActive &&
    effectiveWorkflowScope === normalizedAnalysisScope
  const buildPendingContinuityActive = runtime.runtimeContinuity?.phase === 'build_pending'
  const continuityLiveReplacementSnapshot = useMemo(() => {
    if (!selectedCluster || !continuityShellEligibleForCurrentRoute) return null
    const candidateSnapshots = [
      currentReadyWorkspaceSnapshot,
      currentMatchingWorkspaceSnapshot,
      workflowCachedReadyWorkspaceSnapshot,
      workflowCachedWorkspaceSnapshot,
      trustedRuntimeOverviewWorkspaceSnapshot,
      trustedRuntimeOverviewStructureSnapshot,
    ]

    return (
      candidateSnapshots.find((snapshot) => {
        if (
          !workspaceSnapshotMatchesOverviewShellTruth({
            snapshot,
            clusterId: selectedCluster.clusterId,
            analysisScope: normalizedAnalysisScope,
            cacheVersion,
            senderOverviewWindowSelection,
            senderOverviewWindowTimeZone: browserTimeZone,
          })
        ) {
          return false
        }
        return workspaceHasUsableClusterGlobalSenderKeys(snapshot?.data)
      }) || null
    )
  }, [
    browserTimeZone,
    cacheVersion,
    continuityShellEligibleForCurrentRoute,
    currentMatchingWorkspaceSnapshot,
    currentReadyWorkspaceSnapshot,
    normalizedAnalysisScope,
    selectedCluster,
    senderOverviewWindowSelection,
    trustedRuntimeOverviewStructureSnapshot,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedReadyWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const shouldHoldContinuityShell = Boolean(
    continuityShellEligibleForCurrentRoute &&
      continuityOverviewWorkspaceSnapshot &&
      requestedClusterId &&
      !continuityLiveReplacementSnapshot &&
      (buildPendingContinuityActive ||
        missingScopedCluster ||
        runtime.loading ||
        runtime.refreshing ||
        workspaceState.status === 'loading' ||
        !selectedCluster ||
        !scopedOverviewShellWorkspaceSnapshot)
  )
  const hasDefaultOverviewShellSnapshot = Boolean(
    continuityOverviewWorkspaceSnapshot || scopedOverviewShellWorkspaceSnapshot
  )
  const effectiveRuntimeContinuityPhase =
    runtime.runtimeContinuity?.phase === 'build_pending' && !shouldHoldContinuityShell
      ? 'ready'
      : runtime.runtimeContinuity?.phase || null
  const passiveReadyWorkspaceSnapshot = useMemo(() => {
    if (!selectedCluster) return null
    return mode === 'decision'
      ? currentReadyWorkspaceSnapshot || workflowCachedReadyWorkspaceSnapshot || null
      : currentReadyWorkspaceSnapshot ||
          workflowCachedReadyWorkspaceSnapshot ||
          (!timeContextBucketRequestActive && effectiveWorkflowScope === normalizedAnalysisScope
            ? trustedRuntimeOverviewWorkspaceSnapshot
            : null) ||
          null
  }, [
    currentReadyWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    selectedCluster,
    timeContextBucketRequestActive,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedReadyWorkspaceSnapshot,
  ])
  const passiveWorkspaceSeedSnapshot = useMemo(() => {
    if (mode !== 'overview') return null
    return (
      currentMatchingWorkspaceSnapshot ||
      workflowCachedWorkspaceSnapshot ||
      (!timeContextBucketRequestActive && effectiveWorkflowScope === normalizedAnalysisScope
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null) ||
      null
    )
  }, [
    currentMatchingWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    timeContextBucketRequestActive,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
  ])
  const workspaceRequestKey = useMemo(() => {
    if (
      !selectedCluster ||
      publishedReviewUnitEntryState ||
      publishedReviewUnitEntryRequestedUnit
    ) {
      return null
    }
    return buildWorkspaceRequestKey({
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      mode,
      cacheVersion,
      previewEvidenceSenderKey: decisionPreviewEvidenceSenderKey,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    publishedReviewUnitEntryRequestedUnit,
    publishedReviewUnitEntryState,
    selectedCluster,
    senderOverviewWindowSelection,
  ])
const requiresCanonicalDefaultOverviewBaseline = useMemo(
  () =>
    mode === 'overview' &&
    isDefaultOverviewContext &&
    resolvedTimeContextState.mode === 'default_overview' &&
    effectiveWorkflowScope === normalizedAnalysisScope &&
    normalizedAnalysisScope === 'all_indexed' &&
    !timeContextBucketRequestActive &&
    !senderOverviewWorkflowWindowActive &&
    requestedTimeContextBucketLabel == null &&
    senderOverviewWindowSelection == null,
  [
    effectiveWorkflowScope,
    isDefaultOverviewContext,
    mode,
    normalizedAnalysisScope,
    requestedTimeContextBucketLabel,
    resolvedTimeContextState.mode,
    senderOverviewWindowSelection,
    senderOverviewWorkflowWindowActive,
    timeContextBucketRequestActive,
  ]
)
const hasCanonicalDefaultOverviewBaseline = useMemo(() => {
  if (!selectedCluster || !requiresCanonicalDefaultOverviewBaseline) return false

  const candidateSnapshots = [
    cachedWorkspaceSnapshot,
    currentMatchingWorkspaceSnapshot,
    persistedOverviewWorkspaceSnapshot,
    workflowCachedWorkspaceSnapshot,
    workflowCachedDecisionWorkspaceSnapshot,
    trustedRuntimeOverviewWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    scopedOverviewShellWorkspaceSnapshot,
  ]

  return candidateSnapshots.some((snapshot) => {
  if (!snapshot) {
    return false
  }

  if (
    !workspaceSnapshotMatchesClusterCoverageTruth({
      snapshot,
      clusterId: selectedCluster.clusterId,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  ) {
    return false
  }

  return workspaceHasCanonicalTimeContextTimeline(snapshot.data, effectiveWorkflowScope)
  })
}, [
  browserTimeZone,
  cacheVersion,
  continuityOverviewWorkspaceSnapshot,
  currentMatchingWorkspaceSnapshot,
  effectiveWorkflowScope,
  requiresCanonicalDefaultOverviewBaseline,
  scopedOverviewShellWorkspaceSnapshot,
  selectedCluster,
  senderOverviewWindowSelection,
  cachedWorkspaceSnapshot,
  persistedOverviewWorkspaceSnapshot,
  trustedRuntimeOverviewWorkspaceSnapshot,
  workflowCachedDecisionWorkspaceSnapshot,
  workflowCachedWorkspaceSnapshot,
])
const hasDeferrableDefaultOverviewBaselineSeed =
  requiresCanonicalDefaultOverviewBaseline
    ? hasCanonicalDefaultOverviewBaseline
    : Boolean(
        cachedWorkspaceSnapshot ||
          trustedRuntimeOverviewWorkspaceSnapshot ||
          hasDefaultOverviewBootstrapRailSeed ||
          hasDefaultOverviewShellSnapshot
      )
const shouldDeferLiveFetchForDefaultOverview =
  mode === 'overview' &&
  isDefaultOverviewContext &&
  resolvedTimeContextState.mode === 'default_overview' &&
  defaultOverviewRuntimeGate.clusterId === selectedCluster?.clusterId &&
  defaultOverviewRuntimeGate.status === 'waiting' &&
  hasDeferrableDefaultOverviewBaselineSeed
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
        timeContextBucketLabel: requestedTimeContextBucketLabel,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
    )

    if (hasCoverageTruth && (!requiresCanonicalDefaultOverviewBaseline || hasCanonicalDefaultOverviewBaseline)) {
      return false
    }
    return Boolean(passiveReadyWorkspaceSnapshot || passiveWorkspaceSeedSnapshot)
  }, [
    browserTimeZone,
    cacheVersion,
    currentMatchingWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    normalizedAnalysisScope,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    requestedTimeContextBucketLabel,
    requiresCanonicalDefaultOverviewBaseline,
    senderOverviewWindowSelection,
    selectedCluster,
    hasCanonicalDefaultOverviewBaseline,
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
      !timeContextBucketRequestActive &&
      !senderOverviewWorkflowWindowActive &&
      effectiveWorkflowScope === normalizedAnalysisScope
        ? persistedOverviewWorkspaceSnapshot
        : null,
      !timeContextBucketRequestActive &&
      !senderOverviewWorkflowWindowActive &&
      effectiveWorkflowScope === normalizedAnalysisScope
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null,
    ]

    return (
      snapshotsToCheck.find((snapshot) =>
        workspaceSnapshotMatchesClusterCoverageContext({
          snapshot,
          clusterId: selectedCluster.clusterId,
          analysisScope: effectiveWorkflowScope,
          timeContextBucketLabel: requestedTimeContextBucketLabel,
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null
    )
  }, [
    browserTimeZone,
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedTimeContextBucketLabel,
    senderOverviewWorkflowWindowActive,
    senderOverviewWindowSelection,
    selectedCluster,
    timeContextBucketRequestActive,
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
          (!timeContextBucketRequestActive &&
          !senderOverviewWorkflowWindowActive &&
          effectiveWorkflowScope === normalizedAnalysisScope
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
      senderOverviewWorkflowWindowActive,
      timeContextBucketRequestActive,
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
          timeContextBucketLabel: requestedTimeContextBucketLabel,
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null
    )
  }, [
    browserTimeZone,
    cacheVersion,
    decisionTargetPage,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
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
  const workspaceFetchPlan = useMemo<WorkspaceFetchPlan | null>(() => {
    if (!workspaceRequestKey || !selectedCluster) return null
    if (mode === 'overview') {
      if (!shouldFetchOverviewCoverageBackfill && passiveReadyWorkspaceSnapshot) return null
    } else if (!shouldFetchDecisionWorkspacePage) {
      return null
    }
    return {
      requestKey: workspaceRequestKey,
      selectedCluster,
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
      reviewUnitId: publishedReviewUnitEntryRequestedUnit?.id || null,
      requestPhase: mode === 'decision' ? 'interactive' : 'deferred',
      seedSnapshot:
        mode === 'decision'
          ? passiveReadyWorkspaceSnapshot || workflowCachedReadyWorkspaceSnapshot || null
          : senderOverviewWindowSelection
            ? null
            : passiveReadyWorkspaceSnapshot || passiveWorkspaceSeedSnapshot || null,
      previewEvidenceSenderKey: mode === 'decision' ? decisionPreviewEvidenceSenderKey : null,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    }
  }, [
    browserTimeZone,
    buildPendingContinuityActive,
    cacheVersion,
    decisionPreviewEvidenceSenderKey,
    decisionTargetPage,
    effectiveWorkflowScope,
    publishedReviewUnitEntryRequestedUnit?.id,
    shouldFetchOverviewCoverageBackfill,
    shouldFetchDecisionWorkspacePage,
    mode,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    runtimeClusters,
    senderOverviewWindowSelection,
    selectedCluster,
    shouldHoldContinuityShell,
    workflowCachedReadyWorkspaceSnapshot,
    workspaceRequestKey,
  ])
  const workspaceFetchPlanToken = useMemo(() => {
    if (!workspaceFetchPlan?.requestKey) return null
    return [
      workspaceFetchPlan.requestKey,
      workspaceFetchPlan.requestPhase,
      workspaceFetchPlan.page,
      workspaceFetchPlan.reviewUnitId || 'no-review-unit',
      workspaceFetchPlan.seedSnapshot?.source || 'no-seed',
      workspaceFetchPlan.seedSnapshot?.data.selected_cluster.cluster_id || 'no-cluster',
      workspaceFetchPlan.seedSnapshot?.data.cluster_global.sender_keys_complete === true ? 'keys' : 'no-keys',
      workspaceFetchPlan.seedSnapshot?.data.pagination.page || 0,
      workspaceFetchPlan.seedSnapshot?.data.pagination.page_size || 0,
      workspaceFetchPlan.previewEvidenceSenderKey || 'no-preview-evidence-sender',
      workspaceFetchPlan.timeContextBucketLabel || 'no-time-context-bucket',
      workspaceFetchPlan.senderOverviewWindowSelection?.window || 'no-sender-overview-window',
      workspaceFetchPlan.senderOverviewWindowSelection?.start || 'no-sender-overview-start',
      workspaceFetchPlan.senderOverviewWindowSelection?.end || 'no-sender-overview-end',
      workspaceFetchPlan.senderOverviewWindowTimeZone || 'UTC',
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
    if (!selectedCluster || rawRequestedClusterId === selectedCluster.clusterId) return
    startTransition(() => {
      router.replace(
        buildScopedReviewHref({
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
          senderPage: null,
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
    buildScopedReviewHref,
    decisionOverlayIntent,
    mode,
    requestedDecisionSenderKey,
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
        buildScopedReviewHref({
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
    buildScopedReviewHref,
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
          senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
        }
      )
      startTransition(() => {
        router.replace(
        buildScopedReviewHref({
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
          senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
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
    buildScopedReviewHref,
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
    const shouldParticipateInDefaultOverviewGate =
      selectedCluster != null &&
      mode === 'overview' &&
      isDefaultOverviewContext &&
      resolvedTimeContextState.mode === 'default_overview'

    if (!shouldParticipateInDefaultOverviewGate) {
      setDefaultOverviewRuntimeGate((current) =>
        current.clusterId === null && current.status === 'idle'
          ? current
          : IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE
      )
      return
    }

    if (hasDeferrableDefaultOverviewBaselineSeed) {
      setDefaultOverviewRuntimeGate((current) =>
        current.clusterId === null && current.status === 'idle'
          ? current
          : IDLE_DEFAULT_OVERVIEW_RUNTIME_GATE
      )
      return
    }

    const nextClusterId = selectedCluster.clusterId
    const runtimeAttemptInFlight = runtime.loading && !runtime.data
    const shouldWaitForDefaultOverviewRuntime =
      runtimeAttemptInFlight && hasDeferrableDefaultOverviewBaselineSeed

    setDefaultOverviewRuntimeGate((current) => {
      if (current.clusterId !== nextClusterId) {
        return {
          clusterId: nextClusterId,
          status: shouldWaitForDefaultOverviewRuntime ? 'waiting' : 'ready_for_fallback',
        }
      }

      if (current.status === 'waiting') {
        if (shouldWaitForDefaultOverviewRuntime) return current
        return { clusterId: nextClusterId, status: 'ready_for_fallback' }
      }

      if (
        current.status === 'ready_for_fallback' &&
        shouldWaitForDefaultOverviewRuntime
      ) {
        return { clusterId: nextClusterId, status: 'waiting' }
      }

      return current
    })
  }, [
    hasDeferrableDefaultOverviewBaselineSeed,
    isDefaultOverviewContext,
    mode,
    resolvedTimeContextState.mode,
    runtime.data,
    runtime.loading,
    selectedCluster,
  ])

  useEffect(() => {
    if (!selectedCluster) return
    const plan = workspaceFetchPlanRef.current

    if (
      plan?.requestKey &&
      mode === 'overview' &&
      workspaceState.status === 'ready' &&
      currentReadyWorkspaceSnapshot &&
      workspaceSnapshotSatisfiesCurrentMode({
        snapshot: currentReadyWorkspaceSnapshot,
        clusterId: plan.selectedCluster.clusterId,
        analysisScope: plan.normalizedAnalysisScope,
        mode: plan.mode,
        cacheVersion: plan.cacheVersion,
        page: plan.page,
        timeContextBucketLabel: plan.timeContextBucketLabel,
        timeContextBucketStartAt: plan.timeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
        senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
      })
    ) {
      setWorkspaceStateIfChanged({
        status: 'ready',
        snapshot: currentReadyWorkspaceSnapshot,
        error: null,
      })
      return
    }

    if (shouldHoldContinuityShell && continuityOverviewWorkspaceSnapshot) {
      setWorkspaceStateIfChanged({
        status: plan?.requestKey ? 'loading' : 'ready',
        snapshot: continuityOverviewWorkspaceSnapshot,
        error: null,
      })
      if (!plan?.requestKey) return
    }

    if (shouldDeferLiveFetchForDefaultOverview) {
      setWorkspaceStateIfChanged((current) => ({
        status: 'loading',
        snapshot: current.snapshot || passiveWorkspaceSeedSnapshot || null,
        error: null,
      }))
      return
    }

    if (!plan?.requestKey) {
      if (passiveReadyWorkspaceSnapshot) {
        setWorkspaceStateIfChanged({
          status: 'ready',
          snapshot: passiveReadyWorkspaceSnapshot,
          error: null,
        })
        return
      }

      if (
        mode === 'decision' &&
        currentMatchingWorkspaceSnapshot &&
        !decisionReadyWorkspaceSnapshot
      ) {
        setWorkspaceStateIfChanged((current) => ({
          status: 'loading',
          snapshot: current.snapshot || currentMatchingWorkspaceSnapshot,
          error: null,
        }))
      }
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setWorkspaceStateIfChanged((current) => ({
      status: 'loading',
      snapshot: current.snapshot || plan.seedSnapshot || null,
      error: null,
    }))

    void (async () => {
      const readLatestWorkspaceCacheSnapshot = () => {
      const cachedData = readCachedGmailSenderWorkspace({
          selectedCluster: plan.selectedCluster,
          allClusters: plan.allClusters,
          analysisScope: plan.analysisScope,
          cacheVersion: plan.cacheVersion,
          includeClusterSenderKeys: true,
          page: plan.page,
          pageSize: plan.pageSize,
          reviewUnitId: plan.reviewUnitId,
          previewEvidenceSenderKey: plan.previewEvidenceSenderKey,
          timeContextBucketLabel: plan.timeContextBucketLabel,
          senderOverviewWindow: plan.senderOverviewWindowSelection?.window || null,
          senderOverviewStart: plan.senderOverviewWindowSelection?.start || null,
          senderOverviewEnd: plan.senderOverviewWindowSelection?.end || null,
          timeZone: plan.senderOverviewWindowTimeZone,
        })
        if (!cachedData) return null
        const snapshot = buildWorkspaceSnapshot({
          data: cachedData,
          clusterId: plan.selectedCluster.clusterId,
          analysisScope: plan.normalizedAnalysisScope,
          mode: plan.mode,
          source: 'cache',
          cacheVersion: plan.cacheVersion,
          previewEvidenceSenderKey: plan.previewEvidenceSenderKey,
          timeContextBucketLabel: plan.timeContextBucketLabel,
          timeContextBucketStartAt: plan.timeContextBucketStartAt,
          timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
          senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
        })
        return workspaceSnapshotSatisfiesCurrentMode({
          snapshot,
          clusterId: plan.selectedCluster.clusterId,
          analysisScope: plan.normalizedAnalysisScope,
          mode: plan.mode,
          cacheVersion: plan.cacheVersion,
          page: plan.page,
          timeContextBucketLabel: plan.timeContextBucketLabel,
          timeContextBucketStartAt: plan.timeContextBucketStartAt,
          timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
          senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
        })
          ? snapshot
          : null
      }

      const result = await fetchGmailSenderWorkspace({
        selectedCluster: plan.selectedCluster,
        allClusters: plan.allClusters,
        analysisScope: plan.analysisScope,
        cacheVersion: plan.cacheVersion,
        includeClusterSenderKeys: true,
        page: plan.page,
        pageSize: plan.pageSize,
        reviewUnitId: plan.reviewUnitId,
        previewEvidenceSenderKey: plan.previewEvidenceSenderKey,
        timeContextBucketLabel: plan.timeContextBucketLabel,
        timeContextBucketStartAt: plan.timeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
        senderOverviewWindow: plan.senderOverviewWindowSelection?.window || null,
        senderOverviewStart: plan.senderOverviewWindowSelection?.start || null,
        senderOverviewEnd: plan.senderOverviewWindowSelection?.end || null,
        timeZone: plan.senderOverviewWindowTimeZone,
        requestContext: {
          source: 'operations_review_page',
          component: plan.mode === 'decision' ? 'decision_mode' : 'sender_overview',
          reason: plan.mode === 'decision' ? 'sender_decision_queue' : 'sender_overview',
          phase: plan.requestPhase,
          agentId,
        },
        signal: plan.requestPhase === 'interactive' ? controller.signal : undefined,
      })
      if (cancelled || ('aborted' in result && result.aborted)) {
        return
      }
        if (!result.ok) {
          if (isTransientInboxAnalysisGuardError(result)) {
          const attachDeadlineMs = Date.now() + WORKSPACE_GUARD_ATTACH_WAIT_MS
          while (!cancelled && Date.now() < attachDeadlineMs) {
            const attachedSnapshot = readLatestWorkspaceCacheSnapshot()
            if (attachedSnapshot) {
              setWorkspaceStateIfChanged({
                status: 'ready',
                snapshot: attachedSnapshot,
                error: null,
              })
              return
            }
            await delayMs(WORKSPACE_GUARD_ATTACH_POLL_MS)
          }
          if (cancelled) return
          setWorkspaceStateIfChanged((current) => {
            const currentSnapshotUsable =
              current.snapshot &&
              workspaceSnapshotSatisfiesCurrentMode({
                snapshot: current.snapshot,
                clusterId: plan.selectedCluster.clusterId,
                analysisScope: plan.normalizedAnalysisScope,
                mode: plan.mode,
                cacheVersion: plan.cacheVersion,
                page: plan.page,
                timeContextBucketLabel: plan.timeContextBucketLabel,
                timeContextBucketStartAt: plan.timeContextBucketStartAt,
                timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
                senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
                senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
              })
            const seedSnapshotUsable =
              plan.seedSnapshot &&
              workspaceSnapshotSatisfiesCurrentMode({
                snapshot: plan.seedSnapshot,
                clusterId: plan.selectedCluster.clusterId,
                analysisScope: plan.normalizedAnalysisScope,
                mode: plan.mode,
                cacheVersion: plan.cacheVersion,
                page: plan.page,
                timeContextBucketLabel: plan.timeContextBucketLabel,
                timeContextBucketStartAt: plan.timeContextBucketStartAt,
                timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
                senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
                senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
              })
            const fallbackSnapshot = currentSnapshotUsable
              ? current.snapshot
              : seedSnapshotUsable
                ? plan.seedSnapshot
                : null
            if (!fallbackSnapshot) {
              return {
                status: 'error',
                snapshot: null,
                error: result.error,
              }
            }
            return {
              status: 'ready',
              snapshot: fallbackSnapshot,
              error: null,
            }
          })
          return
        }
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
        timeContextBucketLabel: plan.timeContextBucketLabel,
        timeContextBucketStartAt: plan.timeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
        senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
      })
      if (
        !workspaceSnapshotSatisfiesCurrentMode({
          snapshot: nextSnapshot,
          clusterId: plan.selectedCluster.clusterId,
          analysisScope: plan.normalizedAnalysisScope,
          mode: plan.mode,
          cacheVersion: plan.cacheVersion,
          page: plan.page,
          timeContextBucketLabel: plan.timeContextBucketLabel,
          timeContextBucketStartAt: plan.timeContextBucketStartAt,
          timeContextBucketEndExclusiveAt: plan.timeContextBucketEndExclusiveAt,
          senderOverviewWindowSelection: plan.senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: plan.senderOverviewWindowTimeZone,
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
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    agentId,
    continuityOverviewWorkspaceSnapshot,
    currentMatchingWorkspaceSnapshot,
    currentReadyWorkspaceSnapshot,
    decisionReadyWorkspaceSnapshot,
    mode,
    passiveReadyWorkspaceSnapshot,
    passiveWorkspaceSeedSnapshot,
    selectedCluster,
    setWorkspaceStateIfChanged,
    shouldDeferLiveFetchForDefaultOverview,
    shouldHoldContinuityShell,
    buildPendingContinuityActive,
    workspaceFetchPlanToken,
    workspaceState.status,
  ])

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
            (!timeContextBucketRequestActive &&
            !senderOverviewWorkflowWindowActive &&
            effectiveWorkflowScope === normalizedAnalysisScope
              ? trustedRuntimeOverviewWorkspaceSnapshot
              : null) ||
            null
    }
    return mode === 'decision'
      ? decisionReadyWorkspaceSnapshot || null
      : currentMatchingWorkspaceSnapshot ||
          workflowCachedWorkspaceSnapshot ||
          (workspaceState.status === 'loading'
            ? workspaceState.snapshot
            : null) ||
          (!timeContextBucketRequestActive &&
          !senderOverviewWorkflowWindowActive &&
          effectiveWorkflowScope === normalizedAnalysisScope
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
    senderOverviewWorkflowWindowActive,
    shouldHoldContinuityShell,
    timeContextBucketRequestActive,
    trustedRuntimeOverviewWorkspaceSnapshot,
    workspaceState.snapshot,
    workspaceState.status,
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
          senderOverviewWindowSelection,
          senderOverviewWindowTimeZone: browserTimeZone,
        })
      ) || null
    )
  }, [
    browserTimeZone,
    cacheVersion,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedSenderPage,
    senderOverviewWindowSelection,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
    ) {
      return trustedRuntimeOverviewWorkspaceSnapshot
    }
    return overviewWorkspaceSnapshot
  }, [
    browserTimeZone,
    cacheVersion,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    overviewWorkspaceSnapshot,
    requestedSenderPage,
    senderOverviewWindowSelection,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
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
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
    ) {
      return persistedOverviewWorkspaceSnapshot
    }
    return null
  }, [
    browserTimeZone,
    cacheVersion,
    cachedDecisionWorkspaceSnapshot,
    cachedWorkspaceSnapshot,
    continuityOverviewWorkspaceSnapshot,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    senderOverviewWindowSelection,
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
        timeContextBucketLabel: requestedTimeContextBucketLabel,
        timeContextBucketStartAt: requestedTimeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      })
        ? workspaceState.snapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workspaceState.snapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
        timeContextBucketLabel: requestedTimeContextBucketLabel,
        timeContextBucketStartAt: requestedTimeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
        ? workspaceState.snapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workflowCachedWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
        timeContextBucketLabel: requestedTimeContextBucketLabel,
        timeContextBucketStartAt: requestedTimeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
        ? workflowCachedWorkspaceSnapshot
        : null,
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: workflowCachedDecisionWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: effectiveWorkflowScope,
        cacheVersion,
        timeContextBucketLabel: requestedTimeContextBucketLabel,
        timeContextBucketStartAt: requestedTimeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
        ? workflowCachedDecisionWorkspaceSnapshot
        : null,
      !timeContextBucketRequestActive &&
      !senderOverviewWorkflowWindowActive &&
      effectiveWorkflowScope === normalizedAnalysisScope &&
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: trustedRuntimeOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
        ? trustedRuntimeOverviewWorkspaceSnapshot
        : null,
      !timeContextBucketRequestActive &&
      !senderOverviewWorkflowWindowActive &&
      effectiveWorkflowScope === normalizedAnalysisScope &&
      workspaceSnapshotMatchesClusterCoverageTruth({
        snapshot: persistedOverviewWorkspaceSnapshot,
        clusterId: selectedCluster.clusterId,
        analysisScope: normalizedAnalysisScope,
        cacheVersion,
        senderOverviewWindowSelection,
        senderOverviewWindowTimeZone: browserTimeZone,
      })
        ? persistedOverviewWorkspaceSnapshot
        : null,
    ]

    return candidateSnapshots.find((snapshot) => snapshot != null) || null
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    persistedOverviewWorkspaceSnapshot,
    requestedTimeContextBucketLabel,
    selectedCluster,
    senderOverviewWindowSelection,
    senderOverviewWorkflowWindowActive,
    timeContextBucketRequestActive,
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
  const authoritativeBucketWorkflowWorkspace = useMemo(
    () =>
      normalizeWorkspaceDataContract(
        effectiveWorkflowScope === '7d' && requestedTimeContextBucketLabel
          ? workflowOverviewWorkspace || workflowCoverageWorkspace
          : requestedTimeContextBucketLabel
          ? workflowOverviewWorkspace || workflowCoverageWorkspace
          : workflowOverviewWorkspace || workflowCoverageWorkspace
      ),
    [
      effectiveWorkflowScope,
      requestedTimeContextBucketLabel,
      workflowOverviewWorkspace,
      workflowCoverageWorkspace,
    ]
  )
  const authoritativeTimeContextRailWorkspace = useMemo(
    () =>
      normalizeWorkspaceDataContract(
        authoritativeBucketWorkflowWorkspace ||
          (!timeContextBucketRequestActive &&
          !senderOverviewWorkflowWindowActive &&
          effectiveWorkflowScope === normalizedAnalysisScope
            ? overviewShellWorkspace || overviewCoverageWorkspace || displayOverviewWorkspace
            : null)
      ),
    [
      authoritativeBucketWorkflowWorkspace,
      displayOverviewWorkspace,
      effectiveWorkflowScope,
      normalizedAnalysisScope,
      overviewCoverageWorkspace,
      overviewShellWorkspace,
      senderOverviewWorkflowWindowActive,
      timeContextBucketRequestActive,
    ]
  )
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
  const topSummaryAuthoritativeWorkspace = useMemo(() => {
    const candidates = senderOverviewWindowSelection
      ? [
          workflowCoverageWorkspace,
          workflowOverviewWorkspace,
        ]
      : requestedTimeContextBucketLabel
        ? [
            authoritativeBucketWorkflowWorkspace,
            workflowCoverageWorkspace,
            workflowOverviewWorkspace,
            displayOverviewWorkspace,
            overviewCoverageWorkspace,
            overviewShellWorkspace,
          ]
        : [
            workflowCoverageWorkspace,
            workflowOverviewWorkspace,
            displayOverviewWorkspace,
            overviewCoverageWorkspace,
            overviewShellWorkspace,
          ]
    return candidates.find((workspace) => workspace != null) || null
  }, [
    authoritativeBucketWorkflowWorkspace,
    displayOverviewWorkspace,
    workflowCoverageWorkspace,
    overviewCoverageWorkspace,
    overviewShellWorkspace,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
    workflowOverviewWorkspace,
  ])
  const topSummaryManagedCount = useMemo(
    () => workspaceClusterManagedSenderCount(topSummaryAuthoritativeWorkspace, managedBySender),
    [managedBySender, topSummaryAuthoritativeWorkspace]
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
    topSummaryAuthoritativeWorkspace
      ? Math.max(workspaceClusterSenderTotal(topSummaryAuthoritativeWorkspace), 0)
      : null
  const overviewManagedCount = topSummaryAuthoritativeWorkspace ? topSummaryManagedCount : null
  const overviewRemainingCount =
    overviewSenderTotal != null && overviewManagedCount != null
      ? Math.max(overviewSenderTotal - overviewManagedCount, 0)
      : null
  const overviewCoveragePct =
    overviewSenderTotal != null && overviewManagedCount != null
      ? ratioPercent(overviewManagedCount, Math.max(overviewSenderTotal, 1))
      : null
  const overviewSupportingMessageCount =
    topSummaryAuthoritativeWorkspace
      ? workspaceClusterMessageTotal(topSummaryAuthoritativeWorkspace)
      : null
  const overviewNextStep =
    overviewRemainingCount == null
      ? null
      : overviewRemainingCount > 0
        ? `Next step: review the ${overviewRemainingCount.toLocaleString()} sender${
            overviewRemainingCount === 1 ? '' : 's'
          } that still need a decision in Decision Mode.`
        : 'Next step: every sender in this cleanup group is already covered, so you can continue to Management when ready.'
  const topSummarySenderTotal = overviewSenderTotal
  const topSummaryRemainingCount = overviewRemainingCount
  const topSummaryCoveragePct = overviewCoveragePct
  const topSummarySupportingMessageCount = overviewSupportingMessageCount
  const topSummaryGoalSummary =
    overviewManagedCount != null && overviewRemainingCount != null
      ? `${overviewManagedCount.toLocaleString()} covered · ${overviewRemainingCount.toLocaleString()} remaining`
      : 'Sender coverage is loading for this cleanup group.'
  const topSummaryGoalFollowUp =
    overviewNextStep || 'Next-step guidance will appear once exact sender coverage is ready.'
  const lastCompleteOverviewSummaryRef = useRef<{
    senderTotal: number
    managedCount: number
    remainingCount: number
    coveragePct: number
    supportingMessageCount: number
    goalSummary: string
    goalFollowUp: string
  } | null>(null)
  useEffect(() => {
    if (
      topSummarySenderTotal == null ||
      topSummaryManagedCount == null ||
      topSummaryRemainingCount == null ||
      topSummaryCoveragePct == null ||
      topSummarySupportingMessageCount == null
    ) {
      return
    }

    lastCompleteOverviewSummaryRef.current = {
      senderTotal: topSummarySenderTotal,
      managedCount: topSummaryManagedCount,
      remainingCount: topSummaryRemainingCount,
      coveragePct: topSummaryCoveragePct,
      supportingMessageCount: topSummarySupportingMessageCount,
      goalSummary: topSummaryGoalSummary,
      goalFollowUp: topSummaryGoalFollowUp,
    }
  }, [
    topSummaryCoveragePct,
    topSummaryGoalFollowUp,
    topSummaryGoalSummary,
    topSummaryManagedCount,
    topSummaryRemainingCount,
    topSummarySenderTotal,
    topSummarySupportingMessageCount,
  ])
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

  const baselineTimeContextOverallActivityMetric = useMemo(() => {
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

  const baselineTimeContextActivityMixMetric = useMemo(() => {
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

  const baselineTimeContextPatternSignalMetric = useMemo(() => {
    if (!overviewAnalytics || overviewAnalytics.senderTotal === 0) {
      return {
        value: 'Pattern signal loading',
        detail: 'This cleanup group needs sender pattern coverage before the read stabilizes.',
      }
    }

    if (
      overviewAnalytics.familyClearReadCount >=
      Math.max(1, Math.round(overviewAnalytics.senderTotal * 0.6))
    ) {
      return {
        value: `${overviewAnalytics.familyClearReadCount.toLocaleString()} clear patterns`,
        detail: 'Across this cleanup group, most senders follow a stable pattern, so review can stay fast and confident.',
      }
    }

    if (
      overviewAnalytics.familyMixedReadCount >=
      Math.max(overviewAnalytics.familyClearReadCount, 1)
    ) {
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

  const baselineTimeContextNextAction = useMemo(() => {
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
        hydratedOverviewPageWorkspace?.selected_cluster.title ||
        overviewShellWorkspace.selected_cluster.title ||
        selectedCluster?.title ||
        null,
      visibleClusterCount: runtimeClusters.length,
      chart: {
        granularity: overviewShellWorkspace.analytics.sender_activity_timeline_granularity || 'month',
        items: overviewShellWorkspace.analytics.sender_activity_timeline.map((item) => ({
          label: item.label,
          count: item.sender_count,
          messageCount: item.message_count ?? null,
          contractVersion: item.contract_version ?? null,
          metricFamily: item.metric_family ?? null,
          timeZone: item.time_zone ?? null,
          bucketStartIso: normalizeTimeContextBucketIso(item.bucket_start_iso),
          bucketEndExclusiveIso: normalizeTimeContextBucketIso(item.bucket_end_exclusive_iso),
        })),
      },
      metrics: {
        overallActivity: baselineTimeContextOverallActivityMetric,
        activityMix: baselineTimeContextActivityMixMetric,
        patternSignal: baselineTimeContextPatternSignalMetric,
        nextAction: baselineTimeContextNextAction,
      },
    }
  }, [
    agentId,
    cacheVersion,
    hydratedOverviewPageWorkspace?.selected_cluster.title,
    hydratedOverviewRailSourceLabel,
    missingScopedCluster,
    missingScopedClusterName,
    normalizedAnalysisScope,
    overviewShellWorkspace,
    requestedClusterId,
    runtimeClusters.length,
    selectedCluster?.clusterId,
    selectedCluster?.title,
    sessionId,
    baselineTimeContextActivityMixMetric,
    baselineTimeContextNextAction,
    baselineTimeContextOverallActivityMetric,
    baselineTimeContextPatternSignalMetric,
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
      runtimeSelectedClusterRailFamily.cluster_title ||
      selectedCluster?.title ||
      missingScopedClusterName ||
      null

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
        currentHydratedRailPackage?.clusterTitle ||
        selectedCluster?.title ||
        missingScopedClusterName ||
        null
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
      selectedCluster?.clusterId,
      selectedCluster?.title,
      sessionId,
    ]
  )
  const handleRailScopeSelect = useCallback(
    (nextScope: OperationsAnalysisScope) => {
      const normalizedNext = normalizeOperationsAnalysisScope(nextScope)
      if (
        normalizedNext === effectiveWorkflowScope ||
        pendingSenderDistributionScope === normalizedNext
      ) {
        return
      }

      if (!selectedCluster) return
      // Sender Distribution chips are workflow-driving controls. They must still be able to
      // restore the truthful `workflow_scope` even while the detached comparison rail package
      // for that scope is parity-loading or unavailable.
      if (
        normalizedNext === effectiveWorkflowScope &&
        subsetSource == null &&
        subsetValue == null &&
        !activeSemanticSubtypeFocusRef.current &&
        requestedSenderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE
      ) {
        return
      }

      navigateScopedReviewState({
        workflowScope: normalizedNext,
        clusterId: selectedCluster.clusterId,
        subsetSource,
        subsetValue,
        senderPage: null,
        semanticFocus: activeSemanticSubtypeFocusRef.current,
        overlayIntent: mode === 'decision' ? 'guided' : null,
        senderOverviewWindowSelection: null,
        pendingSenderDistributionScope: normalizedNext,
      })
    },
    [
      effectiveWorkflowScope,
      mode,
      navigateScopedReviewState,
      pendingSenderDistributionScope,
      requestedSenderPage,
      selectedCluster,
      subsetSource,
      subsetValue,
    ]
  )
  const updateSenderOverviewWindowQuery = useCallback(
    (nextSelection: SenderOverviewWindowSelection | null) => {
      if (!selectedCluster) return
      const nextWorkflowScope = workflowScopeForSenderOverviewWindowSelection({
        selection: nextSelection,
        effectiveWorkflowScope,
        normalizedAnalysisScope,
      })
      navigateScopedReviewState({
        workflowScope: nextWorkflowScope,
        clusterId: selectedCluster.clusterId,
        subsetSource,
        subsetValue,
        senderPage: searchParams.get('sender_page') != null ? requestedSenderPage : null,
        semanticFocus: activeSemanticSubtypeFocusRef.current,
        senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
        overlayIntent: mode === 'decision' ? decisionOverlayIntent : null,
        senderOverviewWindowSelection: nextSelection,
        pendingSenderOverviewWindowSelection: nextSelection,
      })
    },
    [
      decisionOverlayIntent,
      mode,
      effectiveWorkflowScope,
      navigateScopedReviewState,
      normalizedAnalysisScope,
      requestedDecisionSenderKey,
      requestedSenderPage,
      searchParams,
      selectedCluster,
      subsetSource,
      subsetValue,
    ]
  )
  const handleTimeContextRailScopeSelect = useCallback(
    (nextScope: TimeContextChartScope) => {
      if (nextScope === 'last_day') {
        if (
          senderOverviewWindowSelection?.window === 'last_day' ||
          pendingSenderOverviewWindowSelection?.window === 'last_day'
        ) {
          return
        }
        updateSenderOverviewWindowQuery({
          window: 'last_day',
          start: null,
          end: null,
        })
        return
      }
      if (nextScope === 'custom') return
      const normalizedNext = mapTimeContextChartScopeToWorkflowScope(nextScope)
      if (normalizedNext == null) return
      if (
        pendingTimeContextScope === normalizedNext ||
        (normalizedNext === effectiveWorkflowScope &&
          senderOverviewWindowSelection == null &&
          pendingSenderOverviewWindowSelection == null)
      ) {
        return
      }
      // Workflow-driving Time Context shortcuts must be able to restore the authoritative
      // workflow scope even when the detached rail package is still parity-loading or only
      // has status-mode data. Blocking on a ready fast package makes 1W look inert while a
      // workflow window is active, even though restoring `workflow_scope=7d` is the truthful
      // next state for the page.
      if (!selectedCluster) return
      const clearsFocusedSenderSubset =
        isFocusedSenderSubsetSource(subsetSource) && subsetValue != null
      const nextSubsetSource = clearsFocusedSenderSubset ? null : subsetSource
      const nextSubsetValue = clearsFocusedSenderSubset ? null : subsetValue

      navigateScopedReviewState({
        workflowScope: normalizedNext,
        clusterId: selectedCluster.clusterId,
        subsetSource: nextSubsetSource,
        subsetValue: nextSubsetValue,
        senderPage: null,
        semanticFocus: activeSemanticSubtypeFocusRef.current,
        overlayIntent: mode === 'decision' ? 'guided' : null,
        senderOverviewWindowSelection: null,
        pendingTimeContextScope: normalizedNext,
      })
    },
    [
      effectiveWorkflowScope,
      mode,
      navigateScopedReviewState,
      pendingSenderOverviewWindowSelection,
      pendingTimeContextScope,
      selectedCluster,
      senderOverviewWindowSelection,
      subsetSource,
      subsetValue,
      updateSenderOverviewWindowQuery,
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
  const timeContextRailPackage = useMemo(
    () =>
      effectiveWorkflowScope === normalizedAnalysisScope
        ? resolvedBaselineRailFastPackage
        : resolveRailFastPackageForScope(effectiveWorkflowScope),
    [
      effectiveWorkflowScope,
      normalizedAnalysisScope,
      resolveRailFastPackageForScope,
      resolvedBaselineRailFastPackage,
    ]
  )
  const displayedSenderOverviewWindowData = useMemo(() => {
    if (!senderOverviewWindowSelection || !senderOverviewWindowRequestKey) return null
    if (senderOverviewWindowState.requestKey === senderOverviewWindowRequestKey) {
      return senderOverviewWindowState.data
    }
    return cachedSenderOverviewWindow
  }, [
    cachedSenderOverviewWindow,
    senderOverviewWindowRequestKey,
    senderOverviewWindowSelection,
    senderOverviewWindowState.data,
    senderOverviewWindowState.requestKey,
  ])
  const activeTimeContextVisibleSeries = useMemo(() => {
    if (senderOverviewWindowSelection) {
      return displayedSenderOverviewWindowData?.series || []
    }

    return (
      authoritativeTimeContextRailWorkspace?.analytics.sender_activity_timeline.map((item) => ({
        label: item.label,
      })) || []
    )
  }, [
    authoritativeTimeContextRailWorkspace?.analytics.sender_activity_timeline,
    displayedSenderOverviewWindowData?.series,
    senderOverviewWindowSelection,
  ])
  useEffect(() => {
    if (!selectedTimeContextBucket?.label) return
    if (
      !activeTimeContextVisibleSeries.some(
        (item) => item.label === selectedTimeContextBucket.label
      )
    ) {
      setSelectedTimeContextBucket(null)
    }
  }, [
    activeTimeContextVisibleSeries,
    selectedTimeContextBucket,
  ])
  const senderOverviewWindowLoading =
    senderOverviewWindowSelection != null &&
    senderOverviewWindowRequestKey != null &&
    senderOverviewWindowState.requestKey === senderOverviewWindowRequestKey &&
    senderOverviewWindowState.status === 'loading'
  const senderOverviewWindowError =
    senderOverviewWindowSelection != null &&
    senderOverviewWindowRequestKey != null &&
    senderOverviewWindowState.requestKey === senderOverviewWindowRequestKey &&
    senderOverviewWindowState.status === 'error'
      ? senderOverviewWindowState.error
      : null
  const workflowTimeContextMetrics = useMemo(() => {
    if (!authoritativeTimeContextRailWorkspace) return null

    const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const dominantSender =
      authoritativeTimeContextRailWorkspace.analytics.cluster_contribution[0]?.sender || null
    const remainingSenderCount = workflowClusterProgress.remaining

    return {
      overallActivity: buildDetachedRailOverallActivityMetric({
        messageCount: Math.max(
          authoritativeTimeContextRailWorkspace.selected_cluster.message_count || 0,
          0
        ),
        scope: effectiveWorkflowScope,
      }),
      activityMix: buildDetachedRailActivityMixMetric({
        dominantSender,
        scope: effectiveWorkflowScope,
      }),
      patternSignal: buildDetachedRailPatternSignalMetric(
        authoritativeTimeContextRailWorkspace.analytics.semantic_resolution_distribution
      ),
      nextAction:
        remainingSenderCount == null
          ? {
              title: `Review ${workflowScopeLabel}`,
              detail: `${workflowScopeLabel} is the current workflow timeframe for this cleanup group.`,
            }
          : remainingSenderCount > 0
            ? {
                title: `Review ${remainingSenderCount.toLocaleString()} remaining sender${
                  remainingSenderCount === 1 ? '' : 's'
                }`,
                detail: `${workflowScopeLabel} is the active workflow timeframe, so these senders are the current review universe.`,
              }
            : {
                title: 'Continue to Management',
                detail: `${workflowScopeLabel} already has full sender coverage for this cleanup group.`,
              },
    }
  }, [
    authoritativeTimeContextRailWorkspace,
    effectiveWorkflowScope,
    workflowClusterProgress.remaining,
  ])
  const canonicalTimeContextRailChart = useMemo(() => {
    const usesSharedCrossScopeTimeContextUniverse =
      effectiveWorkflowScope === '7d' ||
      effectiveWorkflowScope === '30d' ||
      effectiveWorkflowScope === '365d'
    if (
      authoritativeTimeContextRailWorkspace &&
      workspaceHasCanonicalTimeContextTimeline(
        authoritativeTimeContextRailWorkspace,
        effectiveWorkflowScope
      )
    ) {
      return {
        granularity:
          authoritativeTimeContextRailWorkspace.analytics.sender_activity_timeline_granularity ||
          'month',
        items: authoritativeTimeContextRailWorkspace.analytics.sender_activity_timeline.map((item) => ({
          label: item.label,
          count: item.sender_count,
          messageCount: item.message_count ?? null,
          contractVersion: item.contract_version ?? null,
          metricFamily: item.metric_family ?? null,
          timeZone: item.time_zone ?? null,
          bucketStartIso: normalizeTimeContextBucketIso(item.bucket_start_iso),
          bucketEndExclusiveIso: normalizeTimeContextBucketIso(item.bucket_end_exclusive_iso),
        })),
        workflowSenderUniverseTotal: usesSharedCrossScopeTimeContextUniverse
          ? null
          : workspaceClusterSenderTotal(authoritativeTimeContextRailWorkspace),
        metrics: workflowTimeContextMetrics,
        sourceLabel:
          effectiveWorkflowScope === normalizedAnalysisScope
            ? hydratedOverviewRailSourceLabel
            : ('workflow_workspace' as const),
        state: 'ready' as const,
      }
    }

    if (!timeContextRailPackage?.chart || timeContextRailPackage.state !== 'ready') return null
    const packageItems = timeContextRailPackage.chart.items.map((item) => ({
      label: item.label,
      count: item.count,
      messageCount: item.messageCount ?? null,
      bucketStartIso:
        'bucketStartIso' in item ? normalizeTimeContextBucketIso(item.bucketStartIso) : null,
      bucketEndExclusiveIso:
        'bucketEndExclusiveIso' in item
          ? normalizeTimeContextBucketIso(item.bucketEndExclusiveIso)
          : null,
    }))
    const workflowSenderUniverseTotal = Math.max(
      0,
      Math.round(timeContextRailPackage.visibleClusterCount || 0)
    )
    if (
      !senderOverviewTimeContextLaneATimelineIsCanonical({
        scope: effectiveWorkflowScope,
        granularity: timeContextRailPackage.chart.granularity,
        items: packageItems,
        expectedSenderTotal: workflowSenderUniverseTotal,
        coverageStartIso:
          renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start ||
          null,
      })
    ) {
      return null
    }
    return {
      granularity: timeContextRailPackage.chart.granularity,
      items: packageItems,
      workflowSenderUniverseTotal: usesSharedCrossScopeTimeContextUniverse
        ? null
        : workflowSenderUniverseTotal,
      metrics: timeContextRailPackage.metrics,
      sourceLabel: timeContextRailPackage.sourceLabel,
      state: timeContextRailPackage.state,
    }
  }, [
    authoritativeTimeContextRailWorkspace,
    effectiveWorkflowScope,
    hydratedOverviewRailSourceLabel,
    normalizedAnalysisScope,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start,
    timeContextRailPackage,
    workflowTimeContextMetrics,
  ])
  const timeContextLaneABodyOverride = useMemo(() => {
    const activeScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const authorizedScopeLabels = TIME_CONTEXT_LANE_A_WORKFLOW_SCOPES.map((scope) =>
      analysisScopeControlLabel(scope)
    ).join(', ')
    const activeClusterTitle =
      timeContextRailPackage?.clusterTitle ||
      selectedCluster?.title ||
      missingScopedClusterName ||
      'This cleanup group'

    if (canonicalTimeContextRailChart) {
      return null
    }

    if (!isTimeContextLaneAAuthorizedScope(effectiveWorkflowScope)) {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
            <p className="mt-2 text-lg font-semibold text-white">Lane A is limited to protected scopes</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              {activeScopeLabel} remains part of the broader Time Context model, but Lane A only ships
              chart grammar for {authorizedScopeLabels}.
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-cyan-200">Status handling</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              No alternate chart dataset is shown here. Lane A stays in explicit status mode instead
              of inventing unsupported scope truth.
            </p>
          </div>
        </div>
      )
    }

    if (timeContextRailPackage?.state === 'outside_timeframe') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
            <p className="mt-2 text-lg font-semibold text-white">This group is not active in this timeframe</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              {activeClusterTitle} is outside {activeScopeLabel}, so Lane A does not show bucket counts
              for this scope.
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-cyan-200">Status handling</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              No alternate timeframe truth is substituted here. The rail stays explicit about the
              missing same-array view.
            </p>
          </div>
        </div>
      )
    }

    if (!authoritativeTimeContextRailWorkspace) {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
            <p className="mt-2 text-lg font-semibold text-white">Timeframe not yet loaded</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              {activeScopeLabel} does not yet have a loaded workflow sender array for {activeClusterTitle},
              so Lane A cannot render parity-ready buckets yet.
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-cyan-200">Status handling</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              No partial or alternate dataset is shown while the authoritative workflow universe is
              still unavailable.
            </p>
          </div>
        </div>
      )
    }

    if (!workspaceHasUsableClusterGlobalSenderKeys(authoritativeTimeContextRailWorkspace)) {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
            <p className="mt-2 text-lg font-semibold text-white">Authoritative sender universe is incomplete</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Lane A only shows chart truth when the full workflow sender universe is available for
              {activeScopeLabel}.
            </p>
          </div>
          <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
            <p className="text-[10px] uppercase tracking-wide text-cyan-200">Status handling</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              This rail will not compute chart counts from partial rows or a truncated sender set.
            </p>
          </div>
        </div>
      )
    }

    return null
  }, [
    canonicalTimeContextRailChart,
    effectiveWorkflowScope,
    missingScopedClusterName,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start,
    selectedCluster?.title,
    authoritativeTimeContextRailWorkspace,
    timeContextRailPackage,
  ])
  const activeRailDisplay = useMemo(() => {
    if (senderOverviewWindowSelection) {
      const activeWindowData = displayedSenderOverviewWindowData
      const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
      const activeRangeLabel = activeWindowData
        ? senderOverviewWindowRangeDetail(activeWindowData)
        : senderOverviewWindowSelection.window === 'custom' &&
            senderOverviewWindowSelection.start &&
            senderOverviewWindowSelection.end
          ? timeContextRangeDetail({
              label: 'custom range',
              effectiveStart: senderOverviewWindowSelection.start,
              effectiveEnd: senderOverviewWindowSelection.end,
              groupingLabel: 'selected window',
              limitedByIndexedCoverage: false,
              timeZone: browserTimeZone,
            })
          : 'Showing last 24 hours'

      if (activeWindowData) {
        return {
          granularity: activeWindowData.grouping.key,
          items: activeWindowData.series.map((item) => ({
            label: item.label,
            count: item.count,
            messageCount: item.message_count ?? null,
          })),
          overallActivity: {
            value: `${activeWindowData.summary.supporting_message_count.toLocaleString()} supporting messages`,
            detail: `${activeRangeLabel} inside the active workflow window.`,
          },
          activityMix: activeWindowData.summary.dominant_sender
            ? {
                value: `${activeWindowData.summary.dominant_sender} leads`,
                detail: `${activeWindowData.summary.dominant_sender} is the most active sender inside this active workflow window.`,
              }
            : {
                value: 'Activity spread across senders',
                detail: 'No single sender dominates this active workflow window yet.',
              },
          patternSignal: buildDetachedRailPatternSignalMetric(
            activeWindowData.summary.semantic_resolution_distribution
          ),
          nextAction: {
            title: 'Workflow window is active',
            detail: `${workflowScopeLabel} remains the current workflow boundary, and this active window is narrowing the sender workflow, Sender Distribution, and Decision Mode together.`,
          },
          bodyOverride: null,
          workflowSenderUniverseTotal: activeWindowData.selected_cluster.sender_count,
          sourceLabel: 'workflow_window',
          state: 'ready' as const,
          scopeStatus: {
            label: 'Workflow window',
            detail: `${workflowScopeLabel} stays as the current workflow boundary while the live workflow below narrows to this window.`,
            tone: 'comparing' as const,
          },
        }
      }

      return {
        granularity: 'day' as const,
        items: [],
        overallActivity: {
          value: 'Workflow window pending',
          detail: 'Time Context is waiting for row-backed window truth before showing chart bars.',
        },
        activityMix: {
          value: 'Baseline scope preserved',
          detail: `${workflowScopeLabel} stays as the current workflow boundary while the active workflow window resolves.`,
        },
        patternSignal: {
          value: senderOverviewWindowError ? 'Window unavailable' : 'Loading row-backed truth',
          detail:
            senderOverviewWindowError ||
            'The active workflow window is fetching from the current workflow sender universe.',
        },
        nextAction: {
          title: 'Keep workflow window active',
          detail: `${workflowScopeLabel} remains visible as the current workflow boundary while this workflow window resolves.`,
        },
        bodyOverride: (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Time Context</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {senderOverviewWindowError ? 'Workflow window unavailable' : 'Loading workflow window'}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                {senderOverviewWindowError ||
                  'Time Context is loading row-backed sender history for the selected workflow window.'}
              </p>
            </div>
            <div className={`${nestedSurfaceClass} rounded-2xl border border-cyan-700/35 p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-cyan-200">Workflow contract</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {workflowScopeLabel} remains the current workflow boundary, and this active workflow window will narrow the sender workflow, Sender Distribution, and Decision Mode together once the row-backed truth is ready.
              </p>
            </div>
          </div>
        ),
        workflowSenderUniverseTotal: null,
        sourceLabel: 'workflow_window',
        state: senderOverviewWindowError ? ('unavailable_scope' as const) : ('ready' as const),
        scopeStatus: {
          label: 'Workflow window',
          detail: `${workflowScopeLabel} stays visible as the current workflow boundary while this workflow window resolves.`,
          tone: senderOverviewWindowError ? ('not_loaded' as const) : ('comparing' as const),
        },
      }
    }

    const currentRailState =
      timeContextRailPackage?.state || 'unavailable_scope'

    if (canonicalTimeContextRailChart && canonicalTimeContextRailChart.metrics) {
      return {
        granularity: canonicalTimeContextRailChart.granularity,
        items: canonicalTimeContextRailChart.items,
        overallActivity: canonicalTimeContextRailChart.metrics.overallActivity,
        activityMix: canonicalTimeContextRailChart.metrics.activityMix,
        patternSignal: canonicalTimeContextRailChart.metrics.patternSignal,
        nextAction: canonicalTimeContextRailChart.metrics.nextAction,
        bodyOverride: null,
        workflowSenderUniverseTotal: canonicalTimeContextRailChart.workflowSenderUniverseTotal,
        sourceLabel: canonicalTimeContextRailChart.sourceLabel,
        state: canonicalTimeContextRailChart.state,
        scopeStatus: buildSenderOverviewRailScopeStatus({
          activeScope: effectiveWorkflowScope,
          baselineScope: normalizedAnalysisScope,
          workflowScope: effectiveWorkflowScope,
          state: canonicalTimeContextRailChart.state,
        }),
      }
    }

    return {
      granularity: 'month' as const,
      items: [],
      overallActivity: {
        value: 'Parity status only',
        detail:
          'Lane A shows quantitative bars only when the active authorized scope and the workflow scope share the same loaded sender array.',
      },
      activityMix: {
        value: 'No alternate dataset',
        detail:
          'This rail will not substitute detached, partial, or alternate-scope chart counts while parity is unavailable.',
      },
      patternSignal: {
        value: 'Explicit fallback',
        detail:
          'When same-array derivation is unavailable, Time Context stays in status mode instead of presenting conflicting quantitative truth.',
      },
      nextAction: {
        title: 'Use a protected scope',
        detail:
          'Lane A is limited to All Indexed, 1M, and 1W once that same scope is loaded as the active workflow sender universe.',
      },
      bodyOverride: timeContextLaneABodyOverride,
      workflowSenderUniverseTotal: null,
      sourceLabel: timeContextRailPackage?.sourceLabel || 'unavailable_scope',
      state: currentRailState,
      scopeStatus: buildSenderOverviewRailScopeStatus({
        activeScope: effectiveWorkflowScope,
        baselineScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        state: currentRailState,
      }),
    }
  }, [
    canonicalTimeContextRailChart,
    authoritativeTimeContextRailWorkspace,
    browserTimeZone,
    displayedSenderOverviewWindowData,
    effectiveWorkflowScope,
    hydratedOverviewRailSourceLabel,
    normalizedAnalysisScope,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start,
    senderOverviewWindowError,
    senderOverviewWindowSelection,
    timeContextLaneABodyOverride,
    timeContextRailPackage,
  ])
  const workflowScopeCompareOnlyNote = null
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
  const groupReviewUnits = useMemo(
    () => {
      if (!selectedCluster) return []
      const publishedReviewUnits = buildCleanupGroupPublishedReviewUnits(
        selectedCluster.clusterId,
        overviewShellWorkspace?.analytics.semantic_rollup || null
      )
      if (publishedReviewUnits.length > 0) return publishedReviewUnits
      return publishedReviewUnitEntryUnits
    },
    [
      overviewShellWorkspace?.analytics.semantic_rollup,
      publishedReviewUnitEntryUnits,
      selectedCluster,
    ]
  )
  const activeDerivedReviewUnit = useMemo(
    () =>
      subsetSource === 'review_unit'
        ? findCleanupGroupPublishedReviewUnit(groupReviewUnits, subsetValue) ||
          publishedReviewUnitEntryRequestedUnit
        : null,
    [
      groupReviewUnits,
      publishedReviewUnitEntryRequestedUnit,
      subsetSource,
      subsetValue,
    ]
  )
  const isDerivedReviewUnitActive = subsetSource === 'review_unit'
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
  const requestedSemanticRouteParams = useMemo<SemanticFocusRouteParams | null>(() => {
    if (subsetSource === 'review_unit') return null
    const family = requestedSemanticFamily?.trim()
    const subtype = requestedSemanticSubtype?.trim()
    if (!family || !subtype) return null
    return {
      family: family as WorkspaceSender['semantic_family']['family'],
      subtype,
    }
  }, [requestedSemanticFamily, requestedSemanticSubtype, subsetSource])
  const appliedRequestedSemanticFocusRef = useRef<string | null>(null)
  const [semanticFocusOrientationActive, setSemanticFocusOrientationActive] = useState(false)
  const [semanticFocusOrientationKey, setSemanticFocusOrientationKey] = useState(0)
  const [semanticFocusWorkspaceState, setSemanticFocusWorkspaceState] =
    useState<SemanticFocusWorkspaceState>({
      status: 'idle',
      data: null,
      error: null,
      requestKey: null,
    })
  const semanticFocusWorkspace = useMemo(
    () => normalizeWorkspaceDataContract(semanticFocusWorkspaceState.data),
    [semanticFocusWorkspaceState.data]
  )
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
      if (changeReason !== 'system') {
        setPendingNarrowingInteraction({
          kind: nextFocus ? 'semantic_focus' : 'clear_narrowing',
          label: nextFocus ? nextFocus.label : 'broader scope',
          senderKey: null,
          timeContextBucketLabel: null,
          timeContextBucketStartAt: null,
          timeContextBucketEndExclusiveAt: null,
          expectation: buildPendingNarrowingExpectation({
            subsetSource,
            subsetValue,
            semanticFocusId: nextFocus?.id || null,
            timeContextBucketLabel: null,
            timeContextBucketStartAt: null,
            timeContextBucketEndExclusiveAt: null,
          }),
        })
      }
      setActiveSemanticSubtypeFocus(nextFocus)
      if (!selectedCluster) return
      startTransition(() => {
        router.replace(
          buildScopedReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: workflowScopeForOverviewContext({
              subsetSource,
              subsetValue,
              semanticFocus: nextFocus,
            }),
            clusterId: selectedCluster.clusterId,
            subsetSource,
            subsetValue,
            senderPage: null,
            semanticFocus: nextFocus,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      buildPendingNarrowingExpectation,
      buildScopedReviewHref,
      router,
      selectedCluster,
      sessionId,
      subsetSource,
      subsetValue,
      workflowScopeForOverviewContext,
    ]
  )

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
          pending:
            pendingNarrowingInteraction?.kind === 'semantic_focus' &&
            pendingNarrowingInteraction.expectation.semanticFocusId === child.id,
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
    pendingNarrowingInteraction,
    renderedSemanticSubtypeFocus,
    semanticRowModel.primaryFamilyRows,
    updateSemanticSubtypeFocus,
  ])
  const groupReviewUnitStarters = useMemo(() => {
    if (!groupInternalStructure || groupReviewUnits.length === 0) return []

    return groupReviewUnits
      .map((unit) => {
        const familyRow = semanticRowModel.primaryFamilyRows.find(
          (row) => row.id === unit.semanticFamily
        )
        if (!familyRow) return null
        const focus = buildSemanticFocusFromDerivedReviewUnit({
          unit,
          familyRow,
        })
        if (!focus) return null
        return {
          id: unit.id,
          label: unit.label,
          guidance: unit.guidance,
          active: renderedSemanticSubtypeFocus?.id === focus.id,
          pending:
            pendingNarrowingInteraction?.kind === 'semantic_focus' &&
            pendingNarrowingInteraction.expectation.semanticFocusId === focus.id,
          onClick: () =>
            updateSemanticSubtypeFocus(
              renderedSemanticSubtypeFocus?.id === focus.id ? null : focus,
              renderedSemanticSubtypeFocus?.id === focus.id ? 'clear' : 'direct_select'
            ),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }, [
    groupInternalStructure,
    groupReviewUnits,
    pendingNarrowingInteraction,
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
  const currentSemanticRouteParams = useMemo<SemanticFocusRouteParams | null>(() => {
    if (subsetSource === 'review_unit') return null
    return buildSemanticFocusRouteParams(activeSemanticSubtypeFocus) || requestedSemanticRouteParams
  }, [activeSemanticSubtypeFocus, requestedSemanticRouteParams, subsetSource])

  useEffect(() => {
    currentSemanticRouteParamsRef.current = currentSemanticRouteParams
  }, [currentSemanticRouteParams])

  useEffect(() => {
    senderOverviewWindowSelectionRef.current = senderOverviewWindowSelection
  }, [senderOverviewWindowSelection])

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
  }, [mode, selectedCluster?.clusterId])

  useEffect(() => {
    if (mode !== 'overview') return
    if (subsetSource === 'review_unit') return
    if (requestedSemanticFocusKey) return
    appliedRequestedSemanticFocusRef.current = null
    if (activeSemanticSubtypeFocus) {
      setActiveSemanticSubtypeFocus(null)
    }
  }, [
    activeSemanticSubtypeFocus,
    mode,
    requestedSemanticFocusKey,
    subsetSource,
  ])

  useEffect(() => {
    if (mode !== 'overview') return
    const storedContext = readDecisionWorkflowStorage<DecisionOverviewReturnContext>(
      overviewReturnContextStorageKey
    )
    if (!storedContext) return
    const storedSenderOverviewWindowSelection =
      storedContext.senderOverviewWindowSelection || null
    const storedRouteContext = resolveAuthoritativeOverviewReturnContext({
      semanticFocus: storedContext.semanticFocus,
      activeSubset: null,
      subsetSource: storedContext.subsetSource,
      subsetValue: storedContext.subsetValue,
    })
    const storedSemanticFocus =
      storedRouteContext.subsetSource === 'review_unit' ? null : storedContext.semanticFocus
    const storedSenderPage =
      typeof storedContext.senderPage === 'number' &&
      Number.isFinite(storedContext.senderPage) &&
      storedContext.senderPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE
        ? Math.round(storedContext.senderPage)
        : DEFAULT_OVERVIEW_WORKSPACE_PAGE
    const restoreClusterId = selectedCluster?.clusterId || clusterId || requestedClusterId

    if (
      storedSemanticFocus &&
      storedRouteContext.subsetSource !== 'review_unit' &&
      (subsetSource != null || subsetValue != null) &&
      restoreClusterId
    ) {
      startTransition(() => {
        router.replace(
        buildScopedReviewHref({
          agentId,
          sessionId,
          analysisScope,
          workflowScope: workflowScopeForOverviewContext({
            subsetSource: null,
            subsetValue: null,
            semanticFocus: storedSemanticFocus,
          }),
          clusterId: restoreClusterId,
          subsetSource: null,
          subsetValue: null,
          senderPage: storedSenderPage,
          semanticFocus: storedSemanticFocus,
          senderOverviewWindowSelection: storedSenderOverviewWindowSelection,
          }),
          { scroll: false }
        )
      })
      return
    }

    if (
      storedRouteContext.subsetSource !== subsetSource ||
      storedRouteContext.subsetValue !== subsetValue ||
      storedSenderPage !== requestedSenderPage ||
      !senderOverviewWindowSelectionsMatch(
        storedSenderOverviewWindowSelection,
        senderOverviewWindowSelection
      )
    ) {
      if (!restoreClusterId) return
      startTransition(() => {
        router.replace(
          buildScopedReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: workflowScopeForOverviewContext({
              subsetSource: storedRouteContext.subsetSource,
              subsetValue: storedRouteContext.subsetValue,
              semanticFocus: storedSemanticFocus,
            }),
            clusterId: restoreClusterId,
            subsetSource: storedRouteContext.subsetSource,
            subsetValue: storedRouteContext.subsetValue,
            senderPage: storedSenderPage,
            semanticFocus: storedSemanticFocus,
            senderOverviewWindowSelection: storedSenderOverviewWindowSelection,
          }),
          { scroll: false }
        )
      })
      return
    }

    if (!semanticSubtypeFocusesEqual(activeSemanticSubtypeFocus, storedSemanticFocus)) {
      setActiveSemanticSubtypeFocus(storedSemanticFocus)
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
    buildScopedReviewHref,
    clusterId,
    mode,
    overviewReturnContextStorageKey,
    router,
    requestedClusterId,
    requestedSenderPage,
    selectedCluster,
    sessionId,
    senderOverviewWindowSelection,
    subsetSource,
    subsetValue,
    workflowScopeForOverviewContext,
  ])

  useEffect(() => {
    if (mode !== 'overview') return
    if (!requestedSemanticFocusKey) return
    if (appliedRequestedSemanticFocusRef.current === requestedSemanticFocusKey) return
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

    appliedRequestedSemanticFocusRef.current = requestedSemanticFocusKey
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
  const appliedDerivedReviewUnitFocusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isDerivedReviewUnitActive || !activeDerivedReviewUnit) {
      if (
        appliedDerivedReviewUnitFocusRef.current &&
        activeSemanticSubtypeFocus?.id === appliedDerivedReviewUnitFocusRef.current
      ) {
        setActiveSemanticSubtypeFocus(null)
      }
      appliedDerivedReviewUnitFocusRef.current = null
      return
    }

    const familyRow = semanticRowModel.primaryFamilyRows.find(
      (row) => row.id === activeDerivedReviewUnit.semanticFamily
    )
    if (!familyRow) return

    const nextFocus = buildSemanticFocusFromDerivedReviewUnit({
      unit: activeDerivedReviewUnit,
      familyRow,
    })
    if (!nextFocus) return

    appliedDerivedReviewUnitFocusRef.current = nextFocus.id
    setExpandedSemanticMixFamilies((current) => ({
      ...current,
      [familyRow.id]: true,
    }))
    if (!semanticSubtypeFocusesEqual(activeSemanticSubtypeFocus, nextFocus)) {
      setActiveSemanticSubtypeFocus(nextFocus)
    }
  }, [
    activeDerivedReviewUnit,
    activeSemanticSubtypeFocus,
    isDerivedReviewUnitActive,
    semanticRowModel.primaryFamilyRows,
  ])

  const activePublishedReviewUnitFocusRequest = useMemo(
    () =>
      isDerivedReviewUnitActive && activeDerivedReviewUnit
        ? buildSemanticFocusFromPublishedReviewUnit(activeDerivedReviewUnit)
        : null,
    [activeDerivedReviewUnit, isDerivedReviewUnitActive]
  )
  const activeSemanticSubtypeFocusRequest = useMemo(
    () =>
      activePublishedReviewUnitFocusRequest ||
      (activeSemanticSubtypeFocus
        ? buildSemanticSubtypeFocusRequest(activeSemanticSubtypeFocus)
        : null),
    [activePublishedReviewUnitFocusRequest, activeSemanticSubtypeFocus]
  )
  const semanticFocusWorkspaceOrdering = useMemo(
    () => senderWorkspaceOrderingForDrilldownSort(drilldownSort),
    [drilldownSort]
  )
  const semanticFocusPageSize = isDerivedReviewUnitActive
    ? MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE
    : DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE

  const semanticFocusWorkspaceRequestPlan = useMemo(() => {
    if (mode !== 'overview' && !isDerivedReviewUnitActive) return null
    const reviewUnitId =
      isDerivedReviewUnitActive && activeDerivedReviewUnit ? activeDerivedReviewUnit.id : null
    if (!selectedCluster || (!activeSemanticSubtypeFocusRequest && !reviewUnitId)) return null
    return {
      selectedCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
      page: requestedSenderPage,
      pageSize: semanticFocusPageSize,
      sort: semanticFocusWorkspaceOrdering.sort,
      direction: semanticFocusWorkspaceOrdering.direction,
      semanticFocus: activeSemanticSubtypeFocusRequest,
      reviewUnitId,
      expectedReviewUnitSenderCount:
        isDerivedReviewUnitActive && activeDerivedReviewUnit
          ? activeDerivedReviewUnit.senderCount
          : null,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
    }
  }, [
    activeSemanticSubtypeFocusRequest,
    activeDerivedReviewUnit,
    cacheVersion,
    effectiveWorkflowScope,
    isDerivedReviewUnitActive,
    mode,
    requestedSenderPage,
    requestedTimeContextBucketLabel,
    runtimeClusters,
    selectedCluster,
    semanticFocusPageSize,
    semanticFocusWorkspaceOrdering.direction,
    semanticFocusWorkspaceOrdering.sort,
  ])
  const semanticFocusWorkspaceRequestKey = useMemo(() => {
    const plan = semanticFocusWorkspaceRequestPlan
    if (!plan) return null
    return [
      agentId,
      plan.selectedCluster.clusterId,
      plan.analysisScope,
      plan.cacheVersion,
      plan.page,
      plan.pageSize,
      plan.sort,
      plan.direction,
      plan.reviewUnitId || 'no-review-unit',
      plan.semanticFocus?.family || 'no-semantic-family',
      plan.semanticFocus?.subtypeKey || 'no-subtype',
      plan.semanticFocus?.kind || 'no-semantic-focus',
      subsetSource === 'review_unit' ? 'review_unit' : 'semantic_focus',
      subsetSource === 'review_unit' ? renderedSubsetValue || 'missing-review-unit' : 'no-review-unit',
      plan.timeContextBucketLabel || 'no-time-context-bucket',
    ].join('::')
  }, [agentId, renderedSubsetValue, semanticFocusWorkspaceRequestPlan, subsetSource])
  const semanticFocusWorkspaceRequestPlanRef = useRef(semanticFocusWorkspaceRequestPlan)

  useEffect(() => {
    semanticFocusWorkspaceRequestPlanRef.current = semanticFocusWorkspaceRequestPlan
  }, [semanticFocusWorkspaceRequestPlan])

  useEffect(() => {
    const plan = semanticFocusWorkspaceRequestPlanRef.current
    if (!semanticFocusWorkspaceRequestKey || !plan) {
      setSemanticFocusWorkspaceState({
        status: 'idle',
        data: null,
        error: null,
        requestKey: null,
      })
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setSemanticFocusWorkspaceState((current) => ({
      status: 'loading',
      data: current.requestKey === semanticFocusWorkspaceRequestKey ? current.data : null,
      error: null,
      requestKey: semanticFocusWorkspaceRequestKey,
    }))

    void fetchGmailSenderWorkspace({
      selectedCluster: plan.selectedCluster,
      allClusters: plan.allClusters,
      analysisScope: plan.analysisScope,
      cacheVersion: plan.cacheVersion,
      includeClusterSenderKeys: true,
      page: plan.page,
      pageSize: plan.pageSize,
      sort: plan.sort,
      direction: plan.direction,
      semanticFocus: plan.semanticFocus,
      reviewUnitId: plan.reviewUnitId,
      expectedReviewUnitSenderCount: plan.expectedReviewUnitSenderCount,
      timeContextBucketLabel: plan.timeContextBucketLabel,
      requestContext: {
        source: 'operations_review_page',
        component: 'sender_overview',
        reason: 'sender_overview_semantic_subtype_focus',
        phase: 'interactive',
        agentId,
      },
      signal: controller.signal,
    }).then((result) => {
      if (cancelled || ('aborted' in result && result.aborted)) return
      if (!result.ok) {
        if (
          plan.reviewUnitId &&
          result.error.toLowerCase().includes('selected cleanup child')
        ) {
          router.replace(`/agents/${agentId}/operations/clusters`)
          return
        }
        setSemanticFocusWorkspaceState((current) =>
          current.requestKey === semanticFocusWorkspaceRequestKey
            ? {
                status: 'error',
                data: current.data,
                error: result.error,
                requestKey: semanticFocusWorkspaceRequestKey,
              }
            : current
        )
        return
      }
      setSemanticFocusWorkspaceState((current) =>
        current.requestKey === semanticFocusWorkspaceRequestKey
          ? {
              status: 'ready',
              data: result.data,
              error: null,
              requestKey: semanticFocusWorkspaceRequestKey,
            }
          : current
      )
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [agentId, router, semanticFocusWorkspaceRequestKey])
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
      if (!activeDerivedReviewUnit) return null
      label = activeDerivedReviewUnit.label
      chartCount = activeDerivedReviewUnit.senderCount
      senders = semanticFocusWorkspace?.senders || []
      sourceSummary =
        'Derived review unit created from the current artifact-backed structure inside this cleanup group.'
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
      renderedSubsetSource === 'review_unit' && activeDerivedReviewUnit
        ? activeDerivedReviewUnit.groupSharePct
        : ratioPercent(chartCount || loadedCount, clusterSenderTotal)
    const shareOfVisibleSenders = ratioPercent(loadedCount, visibleSenderTotal)
    const loadedCoverageNote =
      renderedSubsetSource === 'review_unit'
        ? chartCount > loadedCount
          ? `Showing ${loadedCount.toLocaleString()} loaded senders from ${chartCount.toLocaleString()} senders in this derived review unit.`
          : `${loadedCount.toLocaleString()} loaded senders currently match this derived review unit.`
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

    if (renderedSubsetSource === 'review_unit' && activeDerivedReviewUnit) {
      const familyLabel = activeDerivedReviewUnit.semanticFamily
        ? gmailSemanticFamilyDisplayLabel(activeDerivedReviewUnit.semanticFamily)
        : 'the published semantic family'
      whyItMatters =
        activeDerivedReviewUnit.kind === 'family'
          ? `${label} is a descriptive family-backed review unit inside this parent cleanup group, covering ${formatPercent(
              shareOfClusterSenders
            )} of group senders from current artifact truth.`
          : activeDerivedReviewUnit.kind === 'remainder'
          ? `${label} keeps the broad unresolved portion of ${familyLabel} visible without presenting it like a taxonomy split.`
          : `${label} is a derived review unit inside this cleanup group, covering ${formatPercent(
              shareOfClusterSenders
            )} of group senders from current artifact truth.`
      reviewGuidance = activeDerivedReviewUnit.guidance
      actionStyle =
        'This derived review unit is session-only. It narrows the current review queue without creating a new cleanup group.'
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
      laneLabel: sortLabelForSubsetSource(renderedSubsetSource),
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
    activeDerivedReviewUnit,
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
  const isReviewUnitPageTransitionLoading = Boolean(
    mode === 'overview' &&
      isDerivedReviewUnitActive &&
      semanticFocusWorkspaceState.status !== 'ready' &&
      semanticFocusWorkspaceState.status !== 'error'
  )
  const isSenderWorkflowInlineLoading =
    isOverviewSenderPageTransitionLoading ||
    isSemanticFocusPageTransitionLoading ||
    isReviewUnitPageTransitionLoading
  const focusedSenderWorkflowLabel =
    renderedSemanticSubtypeFocus?.label ||
    (isDerivedReviewUnitActive
      ? activeDerivedReviewUnit?.label || activeOverviewSubset?.label || 'selected smaller group'
      : null)
  const senderWorkflowPagerClassName = 'w-full sm:max-w-[24rem] sm:ml-auto'
  const activeWorkflowNarrowing = Boolean(
    renderedSemanticSubtypeFocus ||
      hasSubsetRouteContext ||
      senderOverviewWorkflowWindowActive
  )
  const hasDetachedWorkflowScope = effectiveWorkflowScope !== normalizedAnalysisScope
  const activeOverviewSubsetTotalPages = useMemo(() => {
    if (!activeOverviewSubset) return null
    const totalSubsetCount = Math.max(activeOverviewSubset.chartCount, activeOverviewSubset.loadedCount)
    return Math.max(
      Math.ceil(totalSubsetCount / DEFAULT_OVERVIEW_WORKSPACE_PAGE_SIZE),
      1
    )
  }, [activeOverviewSubset])
  const activeOverviewSubsetPageStatus = useMemo(() => {
    if (!activeOverviewSubset || !activeOverviewSubsetTotalPages) return null
    const currentPage = Math.min(
      Math.max(
        workflowOverviewWorkspace?.pagination.page || requestedSenderPage,
        DEFAULT_OVERVIEW_WORKSPACE_PAGE
      ),
      activeOverviewSubsetTotalPages
    )
    return {
      currentPage,
      totalPages: activeOverviewSubsetTotalPages,
      summaryText:
        activeOverviewSubsetTotalPages > 1
          ? `Subset active · showing matches from page ${currentPage} of ${activeOverviewSubsetTotalPages}`
          : 'Subset active · all matches are on one page',
      pageLabel:
        activeOverviewSubsetTotalPages > 1
          ? `Subset active · page ${currentPage} of ${activeOverviewSubsetTotalPages}`
          : 'Subset active · single-page result',
    }
  }, [
    activeOverviewSubset,
    activeOverviewSubsetTotalPages,
    requestedSenderPage,
    workflowOverviewWorkspace?.pagination.page,
  ])
  const subsetBannerContext = useMemo(() => {
    if (!renderedSubsetSource || !renderedSubsetValue) return null
    if (activeOverviewSubset) {
      return {
        laneLabel: activeOverviewSubset.laneLabel,
        label: activeOverviewSubset.label,
        whyItMatters: activeOverviewSubset.whyItMatters,
        messageShareText:
          activeOverviewSubsetPageStatus?.summaryText || activeOverviewSubset.messageShareText,
        loadedCount: activeOverviewSubset.loadedCount,
        eligibleCount: activeOverviewSubset.eligibleCount,
      }
    }

    if (renderedSubsetSource === 'review_unit') {
      return {
        laneLabel: 'Derived review unit',
        label: activeDerivedReviewUnit?.label || 'Derived review unit',
        whyItMatters:
          'This derived review unit stays inside the same parent cleanup group and only narrows the session queue.',
        messageShareText: activeDerivedReviewUnit
          ? `${activeDerivedReviewUnit.honestyLabel} · ${activeDerivedReviewUnit.groupSharePct}% of group senders`
          : 'Derived review unit active',
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
      messageShareText:
        activeOverviewSubsetPageStatus?.summaryText ||
        `Subset active · showing matches from page ${requestedSenderPage} of ${overviewKnownTotalPages}`,
      loadedCount: null,
      eligibleCount: null,
    }
  }, [
    activeDerivedReviewUnit,
    activeOverviewSubset,
    activeOverviewSubsetPageStatus,
    overviewAnalytics,
    overviewKnownTotalPages,
    requestedSenderPage,
    renderedSubsetSource,
    renderedSubsetValue,
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
    if (workspaceHasUsableClusterGlobalSenderKeys(workflowCoverageWorkspace)) {
      return workspaceClusterGlobalSenderKeys(workflowCoverageWorkspace)
    }
    if (
      senderOverviewWindowSelection &&
      workspaceHasUsableClusterGlobalSenderKeys(workflowOverviewWorkspace)
    ) {
      return workspaceClusterGlobalSenderKeys(workflowOverviewWorkspace)
    }

    const candidateCollections = senderOverviewWindowSelection
      ? [
          workspaceClusterGlobalSenderKeys(workflowCoverageWorkspace || null),
          workspaceClusterGlobalSenderKeys(workflowOverviewWorkspace || null),
        ]
      : [
          workspaceClusterGlobalSenderKeys(authoritativeBucketWorkflowWorkspace || null),
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
    return senderOverviewWindowSelection ? [] : reviewPopulation.map((sender) => sender.sender_key)
  }, [
    authoritativeBucketWorkflowWorkspace,
    senderOverviewWindowSelection,
    decisionQueueSenderKeys,
    displayOverviewWorkspace,
    overviewShellWorkspace,
    reviewPopulation,
    workflowCoverageWorkspace,
    workflowOverviewWorkspace,
    workspace,
  ])
  const workflowScopeUniverseOrderedSenderKeys = useMemo(() => {
    if (requestedTimeContextBucketLabel) {
      const broadScopeSenderKeys = workspaceClusterGlobalSenderKeys(
        authoritativeBucketWorkflowWorkspace || null
      )
      if (broadScopeSenderKeys.length > 0) {
        return broadScopeSenderKeys
      }
    }
    return fullAuthoritativeWorkflowSenderKeys
  }, [
    authoritativeBucketWorkflowWorkspace,
    fullAuthoritativeWorkflowSenderKeys,
    requestedTimeContextBucketLabel,
  ])
  const baseSharedWorkflowSubset = useMemo<SharedWorkflowSubsetContract>(() => {
    const parentClusterId =
      selectedCluster?.clusterId || requestedClusterId || rawRequestedClusterId || null
    const routeSubset = activeOverviewSubsetRouteContext
    const detachedWorkflowScopeActive = effectiveWorkflowScope !== normalizedAnalysisScope
    const workflowWindowSubsetActive = Boolean(
      senderOverviewWindowSelection &&
        workspaceHasUsableClusterGlobalSenderKeys(workflowOverviewWorkspace)
    )
    const workflowWindowOrderedSenderKeys = workflowWindowSubsetActive
      ? workspaceClusterGlobalSenderKeys(workflowOverviewWorkspace)
      : []
    const workflowWindowLabel =
      senderOverviewWindowSelection ? senderOverviewWindowControlLabel(senderOverviewWindowSelection) : null
    const focusedSenderSubsetActive = isFocusedSenderSubsetSource(routeSubset?.source)
    const timeContextBucketSubsetActive = Boolean(
      requestedTimeContextBucketLabel &&
        workspaceSnapshot?.timeContextBucketLabel === requestedTimeContextBucketLabel &&
        workspaceSnapshot?.timeContextBucketStartAt === requestedTimeContextBucketStartAt &&
        workspaceSnapshot?.timeContextBucketEndExclusiveAt ===
          requestedTimeContextBucketEndExclusiveAt &&
        workspaceHasUsableClusterGlobalSenderKeys(authoritativeBucketWorkflowWorkspace)
    )
    const timeContextBucketOrderedSenderKeys = timeContextBucketSubsetActive
      ? workspaceClusterGlobalSenderKeys(authoritativeBucketWorkflowWorkspace)
      : []
    const publishedReviewUnitSubsetActive = activeOverviewSubset?.source === 'review_unit'
    const publishedReviewUnitOrderedSenderKeys =
      publishedReviewUnitSubsetActive && semanticFocusWorkspace
        ? workspaceHasUsableClusterGlobalSenderKeys(semanticFocusWorkspace)
          ? workspaceClusterGlobalSenderKeys(semanticFocusWorkspace)
          : semanticFocusWorkspace.senders.map((sender) => sender.sender_key)
        : []
    const semanticFocusedSubsetActive =
      activeSemanticSubtypeFocus != null && !publishedReviewUnitSubsetActive
    const semanticFocusOrderedSenderKeys =
      semanticFocusedSubsetActive && semanticFocusWorkspace
        ? workspaceHasUsableClusterGlobalSenderKeys(semanticFocusWorkspace)
          ? workspaceClusterGlobalSenderKeys(semanticFocusWorkspace)
          : semanticFocusWorkspace.senders.map((sender) => sender.sender_key)
        : []
    const routeSubsetOrderedSenderKeys = focusedSenderSubsetActive
      ? [activeOverviewSubset?.senders[0]?.sender_key || routeSubset?.value || ''].filter(Boolean)
      : activeOverviewSubset && activeOverviewSubset.source !== 'review_unit'
        ? activeOverviewSubset.senders.map((sender) => sender.sender_key)
        : []
    const baseLabel = selectedCluster?.title || humanizeCleanupGroupId(parentClusterId)
    const resolvedFilters: SharedWorkflowResolvedFilter[] = []
    let orderedSenderKeys =
      publishedReviewUnitSubsetActive && publishedReviewUnitOrderedSenderKeys.length > 0
        ? publishedReviewUnitOrderedSenderKeys
        : workflowScopeUniverseOrderedSenderKeys

    if (detachedWorkflowScopeActive) {
      resolvedFilters.push({
        kind: 'workflow_scope',
        label: analysisScopeControlLabel(effectiveWorkflowScope),
        senderCount: workflowScopeUniverseOrderedSenderKeys.length,
        exact: true,
      })
    }

    if (workflowWindowSubsetActive && workflowWindowLabel) {
      resolvedFilters.push({
        kind: 'workflow_window',
        label: workflowWindowLabel,
        senderCount: workflowWindowOrderedSenderKeys.length,
        exact: true,
      })
      const allowedSenderKeys = new Set(workflowWindowOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    }

    if (timeContextBucketSubsetActive) {
      resolvedFilters.push({
        kind: 'time_context_bucket',
        label: requestedTimeContextBucketLabel || 'Time Context bucket',
        senderCount: timeContextBucketOrderedSenderKeys.length,
        exact: true,
      })
      const allowedSenderKeys = new Set(timeContextBucketOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    }

    if (publishedReviewUnitSubsetActive && publishedReviewUnitOrderedSenderKeys.length > 0) {
      resolvedFilters.push({
        kind: 'review_unit',
        label: activeOverviewSubset?.label || 'Published review unit',
        senderCount: activeOverviewSubset?.chartCount || publishedReviewUnitOrderedSenderKeys.length,
        exact: workspaceHasUsableClusterGlobalSenderKeys(semanticFocusWorkspace),
      })
      const allowedSenderKeys = new Set(publishedReviewUnitOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    }

    if (semanticFocusedSubsetActive && semanticFocusOrderedSenderKeys.length > 0) {
      const publishedReviewUnitSenderCount =
        activeOverviewSubset?.source === 'review_unit'
          ? activeOverviewSubset.chartCount
          : null
      resolvedFilters.push({
        kind: 'semantic_focus',
        label: activeSemanticSubtypeFocus?.label || 'Focused semantic segment',
        senderCount: publishedReviewUnitSenderCount ?? semanticFocusOrderedSenderKeys.length,
        exact:
          publishedReviewUnitSenderCount != null ||
          workspaceHasUsableClusterGlobalSenderKeys(semanticFocusWorkspace),
      })
      const allowedSenderKeys = new Set(semanticFocusOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    }

    if (focusedSenderSubsetActive && routeSubsetOrderedSenderKeys.length > 0) {
      resolvedFilters.push({
        kind: 'focused_sender',
        label: activeOverviewSubset?.label || routeSubset?.value || 'Focused sender',
        senderCount: routeSubsetOrderedSenderKeys.length,
        exact: true,
      })
      const allowedSenderKeys = new Set(routeSubsetOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    } else if (activeOverviewSubset && routeSubsetOrderedSenderKeys.length > 0) {
      resolvedFilters.push({
        kind: 'route_subset',
        label: activeOverviewSubset.label,
        senderCount: routeSubsetOrderedSenderKeys.length,
        exact: false,
      })
      const allowedSenderKeys = new Set(routeSubsetOrderedSenderKeys)
      orderedSenderKeys = orderedSenderKeys.filter((senderKey) => allowedSenderKeys.has(senderKey))
    }

    const focusedSenderKey =
      focusedSenderSubsetActive
        ? routeSubsetOrderedSenderKeys[0] || activeOverviewSubset?.senders[0]?.sender_key || routeSubset?.value || null
        : null
    const combinedFiltersActive = resolvedFilters.length > 1
    const kind: SharedWorkflowSubsetKind =
      focusedSenderSubsetActive && orderedSenderKeys.length <= 1
        ? 'focused_sender'
        : resolvedFilters.length > 0
          ? 'derived_workflow_scope'
          : 'base_cluster'
    const populationMode: SharedWorkflowSubsetPopulationMode = focusedSenderSubsetActive
      ? 'focused_sender_only'
      : combinedFiltersActive
        ? 'combined_filtered'
      : workflowWindowSubsetActive
        ? 'workflow_window_filtered'
      : timeContextBucketSubsetActive
        ? 'time_bucket_filtered'
      : resolvedFilters.length > 0
        ? detachedWorkflowScopeActive
          ? 'workflow_scope_filtered'
          : 'route_subset_filtered'
        : 'cluster_full'
    const filterLabels = resolvedFilters.map((filter) => filter.label)
    const label =
      filterLabels.length > 0 ? `${baseLabel} · ${filterLabels.join(' · ')}` : baseLabel
    const sourcePrimary: SharedWorkflowSubsetPrimarySource = focusedSenderSubsetActive
      ? 'focused_sender'
      : combinedFiltersActive
        ? 'combined_filters'
      : workflowWindowSubsetActive
        ? 'workflow_window'
      : timeContextBucketSubsetActive
        ? 'time_context_bucket'
      : activeOverviewSubset
        ? 'route_subset'
      : detachedWorkflowScopeActive
        ? 'workflow_scope'
        : 'page_scope'

    return {
      kind,
      parentClusterId,
      analysisScope: normalizedAnalysisScope,
      activeWorkflowScope: normalizedRequestedWorkflowScope,
      authoritativeScope: effectiveWorkflowScope,
      populationMode,
      orderedSenderKeys,
      focusedSenderKey,
      label,
      resolvedSenderCount:
        activeOverviewSubset?.source === 'review_unit'
          ? activeOverviewSubset.chartCount
          : orderedSenderKeys.length,
      resolvedFilters,
      source: {
        primary: sourcePrimary,
        workflowScope: normalizedRequestedWorkflowScope,
        senderOverviewWindowLabel: workflowWindowSubsetActive ? workflowWindowLabel : null,
        timeContextBucketLabel:
          timeContextBucketSubsetActive ? requestedTimeContextBucketLabel : null,
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
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    normalizedRequestedWorkflowScope,
    rawRequestedClusterId,
    requestedTimeContextBucketLabel,
    requestedClusterId,
    senderOverviewWindowSelection,
    semanticFocusWorkspace,
    selectedCluster?.clusterId,
    selectedCluster?.title,
    authoritativeBucketWorkflowWorkspace,
    workflowOverviewWorkspace,
    workflowScopeUniverseOrderedSenderKeys,
    workspaceSnapshot?.timeContextBucketLabel,
  ])
  const senderDistributionSemanticFocus = activeSemanticSubtypeFocusRequest
  const senderDistributionReviewUnitId =
    isDerivedReviewUnitActive && activeDerivedReviewUnit ? activeDerivedReviewUnit.id : null
  const senderDistributionDedicatedFetchCluster =
    subsetSource === 'review_unit' && !activeDerivedReviewUnit ? null : selectedCluster || null
  const senderDistributionExpectedSenderKeys = baseSharedWorkflowSubset.orderedSenderKeys
  const senderDistributionRequestKey = useMemo(() => {
    if (!senderDistributionDedicatedFetchCluster) {
      return null
    }
    return buildGmailSenderDistributionCacheKey({
      selectedCluster: senderDistributionDedicatedFetchCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      cacheVersion: cacheVersion?.trim() || 'default',
      semanticFocus: senderDistributionSemanticFocus,
      reviewUnitId: senderDistributionReviewUnitId,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: senderOverviewWindowSelection?.window || null,
      senderOverviewStart: senderOverviewWindowSelection?.start || null,
      senderOverviewEnd: senderOverviewWindowSelection?.end || null,
      timeZone: browserTimeZone,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    runtimeClusters,
    senderDistributionDedicatedFetchCluster,
    senderDistributionSemanticFocus,
    senderDistributionReviewUnitId,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
  ])
  const senderDistributionLifecycleKey = senderDistributionRequestKey
    ? `${agentId}::${senderDistributionRequestKey}`
    : null
  const senderDistributionCachedData = useMemo(() => {
    if (!senderDistributionDedicatedFetchCluster) {
      return null
    }
    return readCachedGmailSenderDistribution({
      selectedCluster: senderDistributionDedicatedFetchCluster,
      allClusters: runtimeClusters,
      analysisScope: effectiveWorkflowScope,
      cacheVersion,
      semanticFocus: senderDistributionSemanticFocus,
      reviewUnitId: senderDistributionReviewUnitId,
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindow: senderOverviewWindowSelection?.window || null,
      senderOverviewStart: senderOverviewWindowSelection?.start || null,
      senderOverviewEnd: senderOverviewWindowSelection?.end || null,
      timeZone: browserTimeZone,
      expectedSenderKeys: senderDistributionExpectedSenderKeys,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    effectiveWorkflowScope,
    runtimeClusters,
    senderDistributionSemanticFocus,
    senderDistributionReviewUnitId,
    requestedTimeContextBucketLabel,
    requestedTimeContextBucketStartAt,
    requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindowSelection?.end,
    senderOverviewWindowSelection?.start,
    senderOverviewWindowSelection?.window,
    senderDistributionDedicatedFetchCluster,
    senderDistributionExpectedSenderKeys,
  ])
  const [senderDistributionWorkspaceState, setSenderDistributionWorkspaceState] =
    useState<SenderDistributionWorkspaceState>(() =>
      senderDistributionRequestKey && senderDistributionCachedData
        ? {
            status: 'ready',
            data: senderDistributionCachedData,
            error: null,
            requestKey: senderDistributionRequestKey,
          }
        : {
            status: 'idle',
            data: null,
            error: null,
            requestKey: null,
          }
    )
  const senderDistributionWorkspaceStateRef = useRef(senderDistributionWorkspaceState)
  const senderDistributionInitialFetchIssuedRef = useRef(false)
  const senderDistributionRequestGenerationRef = useRef(0)
  const senderDistributionActiveRequestOwnerRef = useRef<{
    lifecycleKey: string
    generation: number
  } | null>(null)
  const senderDistributionRequestPlan = {
    lifecycleKey: senderDistributionLifecycleKey,
    requestKey: senderDistributionRequestKey,
    selectedCluster: senderDistributionDedicatedFetchCluster,
    allClusters: runtimeClusters,
    analysisScope: effectiveWorkflowScope,
    cacheVersion,
    semanticFocus: senderDistributionSemanticFocus,
    reviewUnitId: senderDistributionReviewUnitId,
    timeContextBucketLabel: requestedTimeContextBucketLabel,
    timeContextBucketStartAt: requestedTimeContextBucketStartAt,
    timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
    senderOverviewWindow: senderOverviewWindowSelection?.window || null,
    senderOverviewStart: senderOverviewWindowSelection?.start || null,
    senderOverviewEnd: senderOverviewWindowSelection?.end || null,
    timeZone: browserTimeZone,
    expectedSenderKeys: senderDistributionExpectedSenderKeys,
    cachedData: senderDistributionCachedData,
    shouldHoldContinuityShell,
    agentId,
  }
  const senderDistributionRequestPlanRef = useRef(senderDistributionRequestPlan)
  senderDistributionRequestPlanRef.current = senderDistributionRequestPlan

  useEffect(() => {
    senderDistributionWorkspaceStateRef.current = senderDistributionWorkspaceState
  }, [senderDistributionWorkspaceState])

  useEffect(() => {
    const lifecycleKey = senderDistributionLifecycleKey
    const initialRequestPlan = senderDistributionRequestPlanRef.current
    const initialSelectedCluster = initialRequestPlan.selectedCluster
    if (
      !lifecycleKey ||
      initialRequestPlan.lifecycleKey !== lifecycleKey ||
      !initialRequestPlan.requestKey ||
      !initialSelectedCluster
    ) {
      setSenderDistributionWorkspaceState((current) =>
        current.status === 'idle' &&
        current.data == null &&
        current.error == null &&
        current.requestKey == null
          ? current
          : { status: 'idle', data: null, error: null, requestKey: null }
      )
      return
    }

    const requestKey = initialRequestPlan.requestKey
    const currentState = senderDistributionWorkspaceStateRef.current
    if (currentState.requestKey === requestKey && currentState.status === 'ready') {
      return
    }

    const activeOwner = senderDistributionActiveRequestOwnerRef.current
    if (
      currentState.requestKey === requestKey &&
      currentState.status === 'loading' &&
      activeOwner?.lifecycleKey === lifecycleKey &&
      activeOwner.generation === senderDistributionRequestGenerationRef.current
    ) {
      return
    }

    if (initialRequestPlan.shouldHoldContinuityShell && initialRequestPlan.cachedData) {
      const cachedData = initialRequestPlan.cachedData
      setSenderDistributionWorkspaceState((current) =>
        current.status === 'ready' &&
        current.data === cachedData &&
        current.error == null &&
        current.requestKey === requestKey
          ? current
          : {
              status: 'ready',
              data: cachedData,
              error: null,
              requestKey,
            }
      )
      return
    }

    const seedData = currentState.data || initialRequestPlan.cachedData
    const senderDistributionRequestPhase = senderDistributionInitialFetchIssuedRef.current
      ? 'interactive'
      : 'deferred'
    senderDistributionInitialFetchIssuedRef.current = true
    const owner = {
      lifecycleKey,
      generation: senderDistributionRequestGenerationRef.current + 1,
    }
    senderDistributionRequestGenerationRef.current = owner.generation
    senderDistributionActiveRequestOwnerRef.current = owner

    const ownsCurrentVisibleState = () => {
      const currentOwner = senderDistributionActiveRequestOwnerRef.current
      return (
        currentOwner?.lifecycleKey === owner.lifecycleKey &&
        currentOwner.generation === owner.generation &&
        senderDistributionRequestPlanRef.current.lifecycleKey === owner.lifecycleKey &&
        senderDistributionWorkspaceStateRef.current.requestKey === requestKey
      )
    }

    const readLatestSenderDistributionCache = () => {
      const latestPlan = senderDistributionRequestPlanRef.current
      const latestSelectedCluster = latestPlan.selectedCluster
      if (latestPlan.lifecycleKey !== lifecycleKey || !latestSelectedCluster) return null
      return readCachedGmailSenderDistribution({
        selectedCluster: latestSelectedCluster,
        allClusters: latestPlan.allClusters,
        analysisScope: latestPlan.analysisScope,
        cacheVersion: latestPlan.cacheVersion,
        semanticFocus: latestPlan.semanticFocus,
        reviewUnitId: latestPlan.reviewUnitId,
        timeContextBucketLabel: latestPlan.timeContextBucketLabel,
        timeContextBucketStartAt: latestPlan.timeContextBucketStartAt,
        timeContextBucketEndExclusiveAt: latestPlan.timeContextBucketEndExclusiveAt,
        senderOverviewWindow: latestPlan.senderOverviewWindow,
        senderOverviewStart: latestPlan.senderOverviewStart,
        senderOverviewEnd: latestPlan.senderOverviewEnd,
        timeZone: latestPlan.timeZone,
        expectedSenderKeys: latestPlan.expectedSenderKeys,
      })
    }

    const loadingState: SenderDistributionWorkspaceState = {
      status: 'loading',
      data: seedData,
      error: null,
      requestKey,
    }
    senderDistributionWorkspaceStateRef.current = loadingState
    setSenderDistributionWorkspaceState(loadingState)

    void (async () => {
      try {
        const result = await fetchGmailSenderDistribution({
          selectedCluster: initialSelectedCluster,
          allClusters: initialRequestPlan.allClusters,
          analysisScope: initialRequestPlan.analysisScope,
          cacheVersion: initialRequestPlan.cacheVersion,
          semanticFocus: initialRequestPlan.semanticFocus,
          reviewUnitId: initialRequestPlan.reviewUnitId,
          timeContextBucketLabel: initialRequestPlan.timeContextBucketLabel,
          timeContextBucketStartAt: initialRequestPlan.timeContextBucketStartAt,
          timeContextBucketEndExclusiveAt: initialRequestPlan.timeContextBucketEndExclusiveAt,
          senderOverviewWindow: initialRequestPlan.senderOverviewWindow,
          senderOverviewStart: initialRequestPlan.senderOverviewStart,
          senderOverviewEnd: initialRequestPlan.senderOverviewEnd,
          timeZone: initialRequestPlan.timeZone,
          expectedSenderKeys: initialRequestPlan.expectedSenderKeys,
          requestContext: {
            source: 'operations_review_page',
            component: 'sender_distribution',
            reason: 'sender_distribution_chart',
            phase: senderDistributionRequestPhase,
            agentId: initialRequestPlan.agentId,
          },
        })
        if (!ownsCurrentVisibleState() || ('aborted' in result && result.aborted)) return
        if (!result.ok) {
          if (isTransientInboxAnalysisGuardError(result)) {
            const attachDeadlineMs = Date.now() + SENDER_DISTRIBUTION_GUARD_ATTACH_WAIT_MS
            while (ownsCurrentVisibleState() && Date.now() < attachDeadlineMs) {
              const attachedData = readLatestSenderDistributionCache()
              if (attachedData && ownsCurrentVisibleState()) {
                const readyState: SenderDistributionWorkspaceState = {
                  status: 'ready',
                  data: attachedData,
                  error: null,
                  requestKey,
                }
                senderDistributionWorkspaceStateRef.current = readyState
                setSenderDistributionWorkspaceState(readyState)
                return
              }
              await delayMs(SENDER_DISTRIBUTION_GUARD_ATTACH_POLL_MS)
            }
            if (!ownsCurrentVisibleState()) return
          }

          const errorState: SenderDistributionWorkspaceState = {
            status: 'error',
            data: null,
            error: result.error,
            requestKey,
          }
          senderDistributionWorkspaceStateRef.current = errorState
          setSenderDistributionWorkspaceState(errorState)
          return
        }

        const readyState: SenderDistributionWorkspaceState = {
          status: 'ready',
          data: result.data,
          error: null,
          requestKey,
        }
        senderDistributionWorkspaceStateRef.current = readyState
        setSenderDistributionWorkspaceState(readyState)
      } finally {
        if (ownsCurrentVisibleState()) {
          senderDistributionActiveRequestOwnerRef.current = null
        }
      }
    })()

    return () => {
      const activeRequestOwner = senderDistributionActiveRequestOwnerRef.current
      if (
        activeRequestOwner?.lifecycleKey === owner.lifecycleKey &&
        activeRequestOwner.generation === owner.generation
      ) {
        senderDistributionActiveRequestOwnerRef.current = null
      }
    }
  }, [senderDistributionLifecycleKey])
  const senderDistributionData = senderDistributionWorkspaceState.data
  const senderDistributionSenderLookup = useMemo(() => {
    const lookup = new Map<string, GmailSenderDistributionData['senders'][number]>()
    for (const sender of senderDistributionData?.senders || []) {
      if (!lookup.has(sender.sender_key)) {
        lookup.set(sender.sender_key, sender)
      }
    }
    return lookup
  }, [senderDistributionData?.senders])
  const sharedWorkflowSubset = baseSharedWorkflowSubset
  const authoritativeWorkflowSenderKeys = sharedWorkflowSubset.orderedSenderKeys
  const senderDistributionBroadSenderKeys = useMemo(
    () => (senderDistributionData?.senders || []).map((sender) => sender.sender_key),
    [senderDistributionData?.senders]
  )
  const senderDistributionAuthoritativeWorkflowSenderKeys =
    activeOverviewSubset?.source === 'review_unit' &&
    senderDistributionWorkspaceState.status === 'ready' &&
    senderDistributionBroadSenderKeys.length === activeOverviewSubset.chartCount
      ? senderDistributionBroadSenderKeys
      : authoritativeWorkflowSenderKeys
  const senderDistributionEmptyScopedSubset =
    senderDistributionWorkspaceState.status === 'ready' &&
    senderDistributionData != null &&
    senderDistributionData.senders.length === 0
  const senderDistributionMissingOrderAuthority =
    senderDistributionAuthoritativeWorkflowSenderKeys.length === 0 && !senderDistributionEmptyScopedSubset
  const senderDistributionMissingOrderedKeys = useMemo(() => {
    if (senderDistributionMissingOrderAuthority) return []
    return senderDistributionAuthoritativeWorkflowSenderKeys.filter(
      (senderKey) => !senderDistributionSenderLookup.has(senderKey)
    )
  }, [
    senderDistributionAuthoritativeWorkflowSenderKeys,
    senderDistributionMissingOrderAuthority,
    senderDistributionSenderLookup,
  ])
  const senderDistributionConsistentWithWorkflow =
    !senderDistributionMissingOrderAuthority && senderDistributionMissingOrderedKeys.length === 0
  const senderDistributionOrderedSenderKeys = useMemo(() => {
    if (!senderDistributionConsistentWithWorkflow) return []
    return senderDistributionAuthoritativeWorkflowSenderKeys.filter((senderKey) =>
      senderDistributionSenderLookup.has(senderKey)
    )
  }, [
    senderDistributionAuthoritativeWorkflowSenderKeys,
    senderDistributionConsistentWithWorkflow,
    senderDistributionSenderLookup,
  ])
  const senderDistributionTotalRankedSenders = senderDistributionOrderedSenderKeys.length
  const senderDistributionBroadMessageTotal = useMemo(() => {
    if (senderDistributionBroadSenderKeys.length === 0) return 0
    return senderDistributionBroadSenderKeys.reduce(
      (sum, senderKey) =>
        sum + (senderDistributionSenderLookup.get(senderKey)?.cleanup_group_message_count || 0),
      0
    )
  }, [senderDistributionBroadSenderKeys, senderDistributionSenderLookup])
  const senderDistributionGroupMessageTotal = Math.max(
    senderDistributionBroadMessageTotal || senderDistributionData?.selected_cluster.message_count || 0,
    1
  )
  const senderDistributionCanRender =
    senderDistributionConsistentWithWorkflow &&
    senderDistributionOrderedSenderKeys.length > 0
  const senderDistributionItems = useMemo(() => {
    if (!senderDistributionCanRender) return []

    return senderDistributionOrderedSenderKeys
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
    senderDistributionCanRender,
    senderDistributionGroupMessageTotal,
    senderDistributionOrderedSenderKeys,
    senderDistributionSenderLookup,
    sharedWorkflowSubset.focusedSenderKey,
  ])
  useEffect(() => {
    if (sharedWorkflowSubset.focusedSenderKey != null) {
      setLocalSenderDistributionFocusKey(null)
      return
    }
    setLocalSenderDistributionFocusKey((current) =>
      current != null && senderDistributionSenderLookup.has(current) ? current : null
    )
  }, [senderDistributionSenderLookup, sharedWorkflowSubset.focusedSenderKey])
  const senderDistributionScopeStatus = useMemo(
    () =>
      buildSenderDistributionRailScopeStatus({
        activeScope: activeRailScope,
        baselineScope: normalizedAnalysisScope,
        workflowScope: effectiveWorkflowScope,
        workflowWindowLabel: senderOverviewWindowSelection
          ? senderOverviewWindowControlLabel(senderOverviewWindowSelection)
          : null,
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
      senderOverviewWindowSelection,
    ]
  )
  const senderDistributionFocusedSenderLabel = useMemo(() => {
    if (!sharedWorkflowSubset.focusedSenderKey) return null
    return (
      senderDistributionSenderLookup.get(sharedWorkflowSubset.focusedSenderKey)?.sender ||
      baseSharedWorkflowSubset.source.routeSubset?.value ||
      null
    )
  }, [
    baseSharedWorkflowSubset.source.routeSubset?.value,
    senderDistributionSenderLookup,
    sharedWorkflowSubset.focusedSenderKey,
  ])
  const timeContextBucketSelectionApplied = Boolean(
    requestedTimeContextBucketLabel &&
      authoritativeBucketWorkflowWorkspace &&
      workspaceSnapshot?.timeContextBucketLabel === requestedTimeContextBucketLabel &&
      workspaceSnapshot?.timeContextBucketStartAt === requestedTimeContextBucketStartAt &&
      workspaceSnapshot?.timeContextBucketEndExclusiveAt ===
        requestedTimeContextBucketEndExclusiveAt
  )
  const stableOverviewSummary = lastCompleteOverviewSummaryRef.current
  const publishedReviewUnitSummaryActive = activeOverviewSubset?.source === 'review_unit'
  const publishedReviewUnitDistributionReady = Boolean(
    publishedReviewUnitSummaryActive &&
      senderDistributionReviewUnitId &&
      senderDistributionWorkspaceState.status === 'ready' &&
      senderDistributionData &&
      senderDistributionBroadSenderKeys.length === activeOverviewSubset.chartCount
  )
  const publishedReviewUnitManagedCount = publishedReviewUnitDistributionReady
    ? senderDistributionBroadSenderKeys.reduce(
        (count, senderKey) => count + (managedBySender[senderKey] ? 1 : 0),
        0
      )
    : null
  const publishedReviewUnitRemainingCount =
    publishedReviewUnitSummaryActive && publishedReviewUnitManagedCount != null
      ? Math.max(activeOverviewSubset.chartCount - publishedReviewUnitManagedCount, 0)
      : null
  const publishedReviewUnitCoveragePct =
    publishedReviewUnitSummaryActive && publishedReviewUnitManagedCount != null
      ? ratioPercent(
          publishedReviewUnitManagedCount,
          Math.max(activeOverviewSubset.chartCount, 1)
        )
      : null
  const renderedTopSummarySenderTotal =
    publishedReviewUnitSummaryActive
      ? activeOverviewSubset.chartCount
      : topSummarySenderTotal ?? stableOverviewSummary?.senderTotal ?? null
  const renderedTopSummaryManagedCount =
    publishedReviewUnitSummaryActive
      ? publishedReviewUnitManagedCount
      : topSummaryManagedCount ?? stableOverviewSummary?.managedCount ?? null
  const renderedTopSummaryRemainingCount =
    publishedReviewUnitSummaryActive
      ? publishedReviewUnitRemainingCount
      : topSummaryRemainingCount ?? stableOverviewSummary?.remainingCount ?? null
  const renderedTopSummaryCoveragePct =
    publishedReviewUnitSummaryActive
      ? publishedReviewUnitCoveragePct
      : topSummaryCoveragePct ?? stableOverviewSummary?.coveragePct ?? null
  const renderedTopSummarySupportingMessageCount =
    publishedReviewUnitSummaryActive
      ? publishedReviewUnitDistributionReady
        ? senderDistributionBroadMessageTotal
        : null
      : topSummarySupportingMessageCount ?? stableOverviewSummary?.supportingMessageCount ?? null
  const renderedTopSummaryCoverageIsLoading =
    renderedTopSummaryManagedCount == null ||
    renderedTopSummaryRemainingCount == null ||
    renderedTopSummaryCoveragePct == null
  const renderedTopSummarySenderTotalIsLoading = renderedTopSummarySenderTotal == null
  const renderedTopSummarySupportingMessageIsLoading =
    renderedTopSummarySupportingMessageCount == null
  const renderedTopSummaryGoalSummary =
    renderedTopSummaryManagedCount != null && renderedTopSummaryRemainingCount != null
      ? `${renderedTopSummaryManagedCount.toLocaleString()} covered · ${renderedTopSummaryRemainingCount.toLocaleString()} remaining`
      : stableOverviewSummary?.goalSummary || topSummaryGoalSummary
  const renderedTopSummaryGoalFollowUp =
    publishedReviewUnitSummaryActive
      ? publishedReviewUnitRemainingCount == null
        ? 'Unit-wide coverage will appear when the focused distribution is ready.'
        : publishedReviewUnitRemainingCount > 0
          ? `Next step: review the ${publishedReviewUnitRemainingCount.toLocaleString()} senders that still need a decision in this unit.`
          : 'Next step: every sender in this published review unit is already covered.'
      : stableOverviewSummary?.goalFollowUp || topSummaryGoalFollowUp
  const renderedTimeContextWorkflowSenderUniverseTotal =
    activeRailDisplay.workflowSenderUniverseTotal
  const renderedTimeContextWorkflowContext = senderOverviewWindowSelection
    ? {
        total: sharedWorkflowSubset.resolvedSenderCount,
        label: 'Active workflow window',
        detail: `${analysisScopeControlLabel(effectiveWorkflowScope)} stays the current workflow boundary. This active workflow window is what narrows the sender workflow below.`,
      }
    : null
  const renderedTimeContextNextAction = activeRailDisplay.nextAction
  const activeTimeContextWorkflowTimeline = useMemo(() => {
    if (!canonicalTimeContextRailChart) return null
    const granularity = canonicalTimeContextRailChart.granularity
    const items = canonicalTimeContextRailChart.items.map((item) => ({
      label: item.label,
      count: item.count,
      bucketStartIso: normalizeTimeContextBucketIso(item.bucketStartIso),
      bucketEndExclusiveIso: normalizeTimeContextBucketIso(item.bucketEndExclusiveIso),
    }))
    return items.length > 0 ? { granularity, items } : null
  }, [canonicalTimeContextRailChart])
  const activeTimeContextIndexedCoverage = useMemo(() => {
    if (displayedSenderOverviewWindowData?.indexed_coverage) {
      return displayedSenderOverviewWindowData.indexed_coverage
    }
    if (
      activeTimeContextWorkflowTimeline &&
      senderOverviewWindowSelection == null &&
      authoritativeTimeContextRailWorkspace &&
      workspaceHasCanonicalTimeContextTimeline(
        authoritativeTimeContextRailWorkspace,
        effectiveWorkflowScope
      )
    ) {
      const coverageFromTimeline = timeContextCoverageFromTimeline({
        granularity: activeTimeContextWorkflowTimeline.granularity,
        items: activeTimeContextWorkflowTimeline.items,
        coverageEndIso:
          renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_end ||
          null,
      })
      if (coverageFromTimeline) return coverageFromTimeline
    }
    return {
      indexed_total_rows: 0,
      indexed_inbox_rows: 0,
      indexed_date_span_start:
        renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start ||
        null,
      indexed_date_span_end:
        renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_end ||
        null,
    }
  }, [
    activeTimeContextWorkflowTimeline,
    authoritativeTimeContextRailWorkspace,
    displayedSenderOverviewWindowData?.indexed_coverage,
    effectiveWorkflowScope,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_end,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start,
    senderOverviewWindowSelection,
  ])
  const activeTimeContextResolvedWindow = useMemo(() => {
    if (displayedSenderOverviewWindowData) {
      return {
        groupingLabel: displayedSenderOverviewWindowData.grouping.label,
        label: displayedSenderOverviewWindowData.window.label,
        effectiveStart: displayedSenderOverviewWindowData.window.effective_start,
        effectiveEnd: displayedSenderOverviewWindowData.window.effective_end,
        limitedByIndexedCoverage: displayedSenderOverviewWindowData.window.limited_by_indexed_coverage,
        timeZone: displayedSenderOverviewWindowData.time_zone,
      }
    }
    if (
      senderOverviewWindowSelection == null &&
      activeTimeContextWorkflowTimeline &&
      authoritativeTimeContextRailWorkspace &&
      workspaceHasCanonicalTimeContextTimeline(
        authoritativeTimeContextRailWorkspace,
        effectiveWorkflowScope
      )
    ) {
      const resolvedFromTimeline = timeContextResolvedWindowFromTimeline({
        granularity: activeTimeContextWorkflowTimeline.granularity,
        items: activeTimeContextWorkflowTimeline.items,
        coverageEndIso: activeTimeContextIndexedCoverage.indexed_date_span_end,
        limitedByIndexedCoverage: effectiveWorkflowScope !== 'all_indexed',
        timeZone: browserTimeZone,
      })
      if (resolvedFromTimeline) return resolvedFromTimeline
    }
    const resolved = pressureTrendResolvedWindow({
      coverage: activeTimeContextIndexedCoverage,
      pressureWindow: activeTimeContextChartScope,
      pressureStart: senderOverviewWindowSelection?.start,
      pressureEnd: senderOverviewWindowSelection?.end,
      timeZone: browserTimeZone,
    })
    if (!resolved.ok) return null
    return {
      groupingLabel: resolved.data.grouping === 'hour'
        ? 'Hourly bars'
        : resolved.data.grouping === 'day'
          ? 'Daily bars'
          : resolved.data.grouping === 'week'
            ? 'Weekly bars'
            : resolved.data.grouping === 'month'
              ? 'Monthly bars'
              : resolved.data.grouping === 'quarter'
                ? 'Quarterly bars'
                : 'Yearly bars',
      label: resolved.data.label,
      effectiveStart: resolved.data.effectiveStartMs != null ? new Date(resolved.data.effectiveStartMs).toISOString() : null,
      effectiveEnd:
        resolved.data.effectiveStartMs != null && resolved.data.effectiveEndExclusiveMs != null
          ? new Date(
              Math.max(
                resolved.data.effectiveStartMs,
                resolved.data.effectiveEndExclusiveMs - 1
              )
            ).toISOString()
          : null,
      limitedByIndexedCoverage: resolved.data.limitedByIndexedCoverage,
      timeZone: resolved.data.timeZone,
    }
  }, [
    activeTimeContextChartScope,
    activeTimeContextIndexedCoverage,
    activeTimeContextWorkflowTimeline,
    authoritativeTimeContextRailWorkspace,
    browserTimeZone,
    displayedSenderOverviewWindowData,
    effectiveWorkflowScope,
    renderRuntimeData?.runtime_mailbox_intelligence?.whole_mailbox.indexed_date_span_start,
    senderOverviewWindowSelection,
  ])
  const timeContextActiveRangeLabel = useMemo(() => {
    if (activeTimeContextResolvedWindow) {
      return timeContextRangeDetail(activeTimeContextResolvedWindow)
    }
    if (
      senderOverviewWindowSelection?.window === 'custom' &&
      senderOverviewWindowSelection.start &&
      senderOverviewWindowSelection.end
    ) {
      return timeContextRangeDetail({
        label: 'custom range',
        effectiveStart: senderOverviewWindowSelection.start,
        effectiveEnd: senderOverviewWindowSelection.end,
        groupingLabel: 'selected window',
        limitedByIndexedCoverage: false,
        timeZone: browserTimeZone,
      })
    }
    if (senderOverviewWindowSelection?.window === 'last_day') {
      return 'Showing last 24 hours'
    }
    return null
  }, [activeTimeContextResolvedWindow, browserTimeZone, senderOverviewWindowSelection])
  const timeContextCustomRangeMin = useMemo(
    () =>
      dateInputValueFromIso(
        activeTimeContextIndexedCoverage.indexed_date_span_start || null,
        browserTimeZone
      ),
    [
      activeTimeContextIndexedCoverage.indexed_date_span_start,
      browserTimeZone,
    ]
  )
  const timeContextCustomRangeMax = useMemo(
    () =>
      dateInputValueFromIso(
        activeTimeContextIndexedCoverage.indexed_date_span_end || null,
        browserTimeZone
      ),
    [
      activeTimeContextIndexedCoverage.indexed_date_span_end,
      browserTimeZone,
    ]
  )
  const applySenderOverviewCustomRange = useCallback(
    (start: string, end: string) => {
      const clampedStart = clampDateInputToBounds(
        start,
        timeContextCustomRangeMin,
        timeContextCustomRangeMax
      )
      const clampedEnd = clampDateInputToBounds(
        end,
        timeContextCustomRangeMin,
        timeContextCustomRangeMax
      )
      const normalizedStart = clampedStart <= clampedEnd ? clampedStart : clampedEnd
      const normalizedEnd = clampedStart <= clampedEnd ? clampedEnd : clampedStart
      updateSenderOverviewWindowQuery({
        window: 'custom',
        start: normalizedStart,
        end: normalizedEnd,
      })
    },
    [timeContextCustomRangeMax, timeContextCustomRangeMin, updateSenderOverviewWindowQuery]
  )
  const activeSenderDistributionControlScope = useMemo(
    () =>
      senderOverviewWindowSelection?.window ||
      mapWorkflowScopeToTimeContextChartScope(activeRailScope) ||
      'all_indexed',
    [activeRailScope, senderOverviewWindowSelection]
  )
  const pendingSenderDistributionControlScope = useMemo(
    () => {
      if (pendingSenderOverviewWindowSelection) return pendingSenderOverviewWindowSelection.window
      return pendingSenderDistributionScope != null
        ? mapWorkflowScopeToTimeContextChartScope(pendingSenderDistributionScope)
        : null
    },
    [pendingSenderDistributionScope, pendingSenderOverviewWindowSelection]
  )
  const handleSenderDistributionControlSelect = useCallback(
    (nextScope: TimeContextChartScope) => {
      if (nextScope === 'last_day') {
        if (
          senderOverviewWindowSelection?.window === 'last_day' ||
          pendingSenderOverviewWindowSelection?.window === 'last_day'
        ) {
          return
        }
        updateSenderOverviewWindowQuery({
          window: 'last_day',
          start: null,
          end: null,
        })
        return
      }
      if (nextScope === 'custom') return
      const normalizedNext = mapTimeContextChartScopeToWorkflowScope(nextScope)
      if (normalizedNext == null) return
      if (
        normalizedNext === effectiveWorkflowScope &&
        (senderOverviewWindowSelection != null || pendingSenderOverviewWindowSelection != null)
      ) {
        if (!selectedCluster) return
        const clearsFocusedSenderSubset =
          isFocusedSenderSubsetSource(subsetSource) && subsetValue != null
        const nextSubsetSource = clearsFocusedSenderSubset ? null : subsetSource
        const nextSubsetValue = clearsFocusedSenderSubset ? null : subsetValue

        navigateScopedReviewState({
          workflowScope: normalizedNext,
          clusterId: selectedCluster.clusterId,
          subsetSource: nextSubsetSource,
          subsetValue: nextSubsetValue,
          senderPage: null,
          semanticFocus: activeSemanticSubtypeFocusRef.current,
          overlayIntent: mode === 'decision' ? 'guided' : null,
          senderOverviewWindowSelection: null,
          pendingSenderDistributionScope: normalizedNext,
          pendingSenderOverviewWindowSelection: null,
        })
        return
      }
      handleRailScopeSelect(normalizedNext)
    },
    [
      effectiveWorkflowScope,
      handleRailScopeSelect,
      mode,
      navigateScopedReviewState,
      pendingSenderOverviewWindowSelection,
      selectedCluster,
      senderOverviewWindowSelection,
      subsetSource,
      subsetValue,
      updateSenderOverviewWindowQuery,
    ]
  )
  const senderDistributionAuthoritativeContext = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = []
    const seenChipLabels = new Set<string>()
    const pushChip = (key: string, label: string) => {
      const normalizedLabel = label.trim().toLowerCase()
      if (!normalizedLabel || seenChipLabels.has(normalizedLabel)) return
      seenChipLabels.add(normalizedLabel)
      chips.push({ key, label })
    }

    pushChip(`scope:${effectiveWorkflowScope}`, analysisScopeControlLabel(effectiveWorkflowScope))
    for (const filter of sharedWorkflowSubset.resolvedFilters) {
      pushChip(`filter:${filter.kind}:${filter.label}`, filter.label)
    }
    if (senderDistributionFocusedSenderLabel) {
      pushChip(
        `focused_sender:${sharedWorkflowSubset.focusedSenderKey || senderDistributionFocusedSenderLabel}`,
        `Locked: ${senderDistributionFocusedSenderLabel}`
      )
    }

    const activeWorkflowWindowFilter =
      sharedWorkflowSubset.resolvedFilters.find((filter) => filter.kind === 'workflow_window') ||
      null
    const workflowFilterSummary =
      sharedWorkflowSubset.resolvedFilters.length > 0
        ? sharedWorkflowSubset.resolvedFilters.map((filter) => filter.label).join(' + ')
        : null
    const detail = activeWorkflowWindowFilter
      ? `${analysisScopeControlLabel(effectiveWorkflowScope)} remains the workflow boundary, and ${activeWorkflowWindowFilter.label} is the active window narrowing Sender Distribution together with the workflow below.`
      : workflowFilterSummary
        ? `${analysisScopeControlLabel(effectiveWorkflowScope)} remains the workflow boundary, and Sender Distribution is currently narrowed to ${workflowFilterSummary} together with the workflow below.`
        : `${analysisScopeControlLabel(effectiveWorkflowScope)} is driving the full cleanup-group sender universe for this rail.`

    return {
      label: 'Current rail context',
      detail,
      chips,
    }
  }, [
    effectiveWorkflowScope,
    senderDistributionFocusedSenderLabel,
    sharedWorkflowSubset.focusedSenderKey,
    sharedWorkflowSubset.resolvedFilters,
  ])
  const workflowScopeSummary = useMemo(() => {
    const pageScopeLabel = analysisScopeControlLabel(normalizedAnalysisScope)
    const workflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
    const activeFilterLabels = sharedWorkflowSubset.resolvedFilters.map((filter) => filter.label)

    if (activeFilterLabels.length === 0) {
      if (effectiveWorkflowScope === normalizedAnalysisScope) {
        return {
          label: 'Workflow scope matches page',
          detail: `${pageScopeLabel} is driving the sender workflow, coverage, and Decision Mode queue.`,
          badgeClassName: 'border-emerald-700/45 bg-emerald-950/20 text-emerald-100',
        }
      }

      return {
        label: `Workflow filtered to ${workflowScopeLabel}`,
        detail: `${workflowScopeLabel} is driving the workflow summary, sender rows, Sender Distribution, Decision Mode queue, and Time Context chart together. ${pageScopeLabel} remains page context only.`,
        badgeClassName: 'border-cyan-700/55 bg-cyan-950/20 text-cyan-100',
      }
    }

    const filterSummary =
      activeFilterLabels.length === 1
        ? activeFilterLabels[0]
        : activeFilterLabels.join(' + ')
    const label =
      sharedWorkflowSubset.source.primary === 'combined_filters'
        ? `Workflow filtered by ${activeFilterLabels.length} active filters`
        : `Workflow narrowed to ${filterSummary}`

    return {
      label,
      detail: `${workflowScopeLabel} remains the workflow scope boundary, and the final sender universe is the deterministic intersection of ${filterSummary}. Workflow summary, sender rows, pagination totals, Sender Distribution, and the Decision Mode queue all consume that same ordered sender set.`,
      badgeClassName: 'border-cyan-500/65 bg-cyan-950/25 text-cyan-50',
    }
  }, [
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    sharedWorkflowSubset.resolvedFilters,
    sharedWorkflowSubset.source.primary,
  ])
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
  const senderDistributionRequestExpected = senderDistributionRequestKey != null
  const senderDistributionLoading =
    !senderDistributionConsistentWithWorkflow &&
    senderDistributionRequestExpected &&
    (senderDistributionWorkspaceState.status === 'idle' ||
      senderDistributionWorkspaceState.status === 'loading')
      ? true
      : senderDistributionItems.length === 0 &&
    senderDistributionRequestExpected &&
    (senderDistributionWorkspaceState.status === 'idle' ||
      senderDistributionWorkspaceState.status === 'loading')
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
  const senderDistributionRailState = !senderDistributionRequestExpected
    ? 'unavailable_scope'
    : senderDistributionWorkspaceState.status === 'error' || senderDistributionErrorMessage
      ? 'unavailable_scope'
      : senderDistributionLoading || senderDistributionUpdating
        ? 'loading'
        : senderDistributionWorkspaceState.status === 'ready' &&
            senderDistributionConsistentWithWorkflow
          ? 'ready'
          : 'incomplete_scope'
  const activeSharedAnalysisRailSource =
    activeSharedAnalysisRailTab === 'time_context'
      ? activeRailDisplay.sourceLabel
      : 'sender_distribution'
  const activeSharedAnalysisRailState =
    activeSharedAnalysisRailTab === 'time_context'
      ? activeRailDisplay.state
      : senderDistributionRailState
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
  const decisionProgress = useMemo(
    () => {
      const total = authoritativeWorkflowSenderKeys.length
      const managed = authoritativeWorkflowSenderKeys.filter((senderKey) => managedBySender[senderKey]).length
      return {
        total,
        managed,
        remaining: Math.max(total - managed, 0),
      }
    },
    [authoritativeWorkflowSenderKeys, managedBySender]
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
      timeContextBucketLabel: requestedTimeContextBucketLabel,
      timeContextBucketStartAt: requestedTimeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: requestedTimeContextBucketEndExclusiveAt,
      senderOverviewWindowSelection,
      senderOverviewWindowTimeZone: browserTimeZone,
    })
  }, [
    activeDecisionEvidenceSenderKey,
    browserTimeZone,
    cacheVersion,
    decisionReadyWorkspaceSnapshot,
    effectiveWorkflowScope,
    mode,
    requestedTimeContextBucketLabel,
    senderOverviewWindowSelection,
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
        buildScopedReviewHref({
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
    buildScopedReviewHref,
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
  const clearOverviewNarrowingState = useCallback(() => {
    if (!selectedCluster && !clusterId) return
    setPendingNarrowingInteraction({
      kind: 'clear_narrowing',
      label: 'broader scope',
      senderKey: null,
      timeContextBucketLabel: null,
      timeContextBucketStartAt: null,
      timeContextBucketEndExclusiveAt: null,
      expectation: buildPendingNarrowingExpectation({
        workflowScope: workflowScopeForOverviewContext({
          subsetSource: null,
          subsetValue: null,
          semanticFocus: null,
        }),
        subsetSource: null,
        subsetValue: null,
        semanticFocusId: null,
        timeContextBucketLabel: null,
        timeContextBucketStartAt: null,
        timeContextBucketEndExclusiveAt: null,
      }),
    })
    setTimeContextBucketNotice(null)
    navigateScopedReviewState({
      workflowScope: workflowScopeForOverviewContext({
        subsetSource: null,
        subsetValue: null,
        semanticFocus: null,
      }),
      clusterId: selectedCluster?.clusterId || clusterId,
      subsetSource: null,
      subsetValue: null,
      senderPage: null,
      semanticFocus: null,
      semanticRoute: null,
      senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
      overlayIntent: mode === 'decision' ? decisionOverlayIntent : null,
      senderOverviewWindowSelection: null,
    })
  }, [
    buildPendingNarrowingExpectation,
    clusterId,
    decisionOverlayIntent,
    mode,
    navigateScopedReviewState,
    requestedDecisionSenderKey,
    selectedCluster,
    setTimeContextBucketNotice,
    workflowScopeForOverviewContext,
  ])
  const clearWorkflowScopeOverride = useCallback(() => {
    if (!selectedCluster && !clusterId) return
    setPendingNarrowingInteraction({
      kind: 'clear_workflow_scope',
      label: 'All indexed',
      senderKey: null,
      timeContextBucketLabel: null,
      timeContextBucketStartAt: null,
      timeContextBucketEndExclusiveAt: null,
      expectation: buildPendingNarrowingExpectation({
        workflowScope: null,
        semanticFocusId: activeSemanticSubtypeFocusRef.current?.id || null,
        timeContextBucketLabel: null,
        timeContextBucketStartAt: null,
        timeContextBucketEndExclusiveAt: null,
      }),
    })
    setTimeContextBucketNotice(null)
    navigateScopedReviewState({
      workflowScope: null,
      clusterId: selectedCluster?.clusterId || clusterId,
      subsetSource,
      subsetValue,
      senderPage: null,
      semanticFocus: activeSemanticSubtypeFocusRef.current,
      senderKey: mode === 'decision' ? requestedDecisionSenderKey : null,
      overlayIntent: mode === 'decision' ? decisionOverlayIntent : null,
      senderOverviewWindowSelection: null,
    })
  }, [
    buildPendingNarrowingExpectation,
    clusterId,
    decisionOverlayIntent,
    mode,
    navigateScopedReviewState,
    requestedDecisionSenderKey,
    selectedCluster,
    setTimeContextBucketNotice,
    subsetSource,
    subsetValue,
  ])
  const timeContextBucketSelectionLoading = false
  useEffect(() => {
    if (!pendingNarrowingInteraction) return

    const routeMatches =
      pendingNarrowingInteraction.expectation.workflowScope === currentRequestedWorkflowScope &&
      pendingNarrowingInteraction.expectation.subsetSource === subsetSource &&
      pendingNarrowingInteraction.expectation.subsetValue === subsetValue &&
      pendingNarrowingInteraction.expectation.semanticFocusId ===
        (activeSemanticSubtypeFocus?.id || null) &&
      pendingNarrowingInteraction.expectation.timeContextBucketLabel ===
        requestedTimeContextBucketLabel

    if (!routeMatches) return

    const loadingSettled =
      pendingTimeContextScope == null &&
      workspaceState.status !== 'loading' &&
      semanticFocusWorkspaceState.status !== 'loading' &&
      !isSenderWorkflowInlineLoading &&
      !senderDistributionUpdating &&
      !timeContextBucketSelectionLoading

    let authoritativeReady = false
    if (pendingNarrowingInteraction.kind === 'sender_distribution') {
      authoritativeReady =
        pendingNarrowingInteraction.senderKey != null &&
        sharedWorkflowSubset.focusedSenderKey === pendingNarrowingInteraction.senderKey &&
        sharedWorkflowSubset.resolvedFilters.some((filter) => filter.kind === 'focused_sender')
    } else if (pendingNarrowingInteraction.kind === 'time_context_bucket') {
      authoritativeReady =
        pendingNarrowingInteraction.timeContextBucketLabel != null &&
        timeContextBucketSelectionApplied &&
        sharedWorkflowSubset.resolvedFilters.some(
          (filter) =>
            filter.kind === 'time_context_bucket' &&
            filter.label === pendingNarrowingInteraction.timeContextBucketLabel
        )
    } else if (pendingNarrowingInteraction.kind === 'clear_workflow_scope') {
      authoritativeReady = currentRequestedWorkflowScope == null
    } else {
      authoritativeReady = true
    }

    if (authoritativeReady && loadingSettled) {
      setPendingNarrowingInteraction(null)
    }
  }, [
    activeSemanticSubtypeFocus?.id,
    currentRequestedWorkflowScope,
    isSenderWorkflowInlineLoading,
    pendingNarrowingInteraction,
    pendingTimeContextScope,
    requestedTimeContextBucketLabel,
    senderDistributionUpdating,
    semanticFocusWorkspaceState.status,
    sharedWorkflowSubset.focusedSenderKey,
    sharedWorkflowSubset.resolvedFilters,
    subsetSource,
    subsetValue,
    timeContextBucketSelectionApplied,
    timeContextBucketSelectionLoading,
    workspaceState.status,
  ])
  const timeContextBucketInteractionDisabledReason = useMemo(() => {
    if (activeRailDisplay.state !== 'ready' || activeRailDisplay.bodyOverride) {
      return 'the chart is not parity-ready for the current workflow scope'
    }
    return null
  }, [
    activeRailDisplay.bodyOverride,
    activeRailDisplay.state,
  ])
  const handleTimeContextBucketToggle = useCallback(
    (item: {
      label: string
      count: number
      messageCount?: number | null
      bucketStartIso?: string | null
      bucketEndExclusiveIso?: string | null
    }) => {
      if (!selectedCluster && !clusterId) return
      if (item.count <= 0) {
        setTimeContextBucketNotice({
          reason: 'empty_bucket',
          tone: 'warning',
          title: 'Bucket not focusable',
          detail:
            'This visible bucket contains zero active senders, so the lower readout stays anchored to the current focus until you choose a non-empty bucket.',
        })
        return
      }
      if (timeContextBucketInteractionDisabledReason) {
        setTimeContextBucketNotice({
          reason: 'missing_data',
          tone: 'warning',
          title: 'Bucket focus blocked',
          detail: `Chart focus is unavailable because ${timeContextBucketInteractionDisabledReason}.`,
        })
        return
      }
      setTimeContextBucketNotice(null)
      if (
        !item.bucketStartIso ||
        !item.bucketEndExclusiveIso ||
        Number.isNaN(Date.parse(item.bucketStartIso)) ||
        Number.isNaN(Date.parse(item.bucketEndExclusiveIso))
      ) {
        setTimeContextBucketNotice({
          reason: 'invalid_selection',
          tone: 'error',
          title: 'Bucket selection unavailable',
          detail:
            'This bucket is missing canonical interval bounds, so workflow narrowing cannot safely apply it.',
        })
        return
      }
      setSelectedTimeContextBucket((current) =>
        current?.label === item.label &&
        current.bucket_start_at === item.bucketStartIso &&
        current.bucket_end_exclusive_at === item.bucketEndExclusiveIso
          ? null
          : (() => {
              const bucketStartAt = normalizeTimeContextBucketIso(item.bucketStartIso)
              const bucketEndExclusiveAt = normalizeTimeContextBucketIso(
                item.bucketEndExclusiveIso
              )
              if (!bucketStartAt || !bucketEndExclusiveAt) return null
              return {
                label: item.label,
                bucket_start_at: bucketStartAt,
                bucket_end_exclusive_at: bucketEndExclusiveAt,
              }
            })()
      )
    },
    [
      clusterId,
      selectedCluster,
      timeContextBucketInteractionDisabledReason,
    ]
  )
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
      eyebrow: isDerivedReviewUnitActive ? 'Derived review unit' : 'Focused view',
      title: isDerivedReviewUnitActive
        ? `${semanticFocusTitle(renderedSemanticSubtypeFocus)}`
        : semanticFocusTitle(renderedSemanticSubtypeFocus),
      selectionDetail: isDerivedReviewUnitActive
        ? `${semanticFocusSelectionDetail(renderedSemanticSubtypeFocus)} This stays inside the same parent cleanup group and only changes the session review scope.`
        : semanticFocusSelectionDetail(renderedSemanticSubtypeFocus),
      laneDetail: semanticFocusLaneDetail(renderedSemanticSubtypeFocus),
      subsetDetail: hasSubsetRouteContext && !isDerivedReviewUnitActive
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
    isDerivedReviewUnitActive,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.status,
  ])
  const semanticFocusBannerClassName = `rounded-2xl border p-4 shadow-[0_16px_36px_rgba(2,6,23,0.2)] transition-colors duration-300 ${
    semanticFocusOrientationActive
      ? 'border-cyan-500/55 bg-[linear-gradient(180deg,rgba(13,45,66,0.96),rgba(8,22,35,0.98))]'
      : 'border-cyan-700/45 bg-[linear-gradient(180deg,rgba(11,39,57,0.95),rgba(7,18,30,0.98))]'
  }`
  const clearNarrowingPending = false
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
          onClick={clearOverviewNarrowingState}
          disabled={clearNarrowingPending}
          className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm ${
            clearNarrowingPending
              ? 'cursor-progress border-cyan-100/85 bg-cyan-300 text-slate-950 opacity-100 shadow-[0_14px_32px_rgba(34,211,238,0.24)]'
              : ''
          }`}
        >
          {clearNarrowingPending ? 'Returning to broader scope…' : 'Clear narrowed state'}
        </button>
      </div>
    </div>
  ) : null
  const senderListCoverage = useMemo(() => {
    if (!workflowOverviewWorkspace) return null

    const visibleRowCount = visibleDrilldownSenders.length
    const loadedWorkspaceCount = workflowOverviewWorkspace.senders.length
    const clusterSenderTotal = workspaceClusterSenderTotal(
      requestedTimeContextBucketLabel
        ? authoritativeBucketWorkflowWorkspace
        : workflowCoverageWorkspace || workflowOverviewWorkspace,
      selectedCluster?.senderCount
    )
    const pageLabel = `Page ${workflowOverviewWorkspace.pagination.page} of ${Math.max(
      workflowOverviewWorkspace.pagination.total_pages || 1,
      1
    )}`

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
          navigationHint:
            'Back to full sender list when you want the broader queue again.',
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
          navigationHint:
            'Back to full sender list when you want the broader queue again.',
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
        } for ${focusLabel} ${visibleRowCount === 1 ? 'is' : 'are'} on screen · ${focusedTotalCount.toLocaleString()} matching sender${
          focusedTotalCount === 1 ? '' : 's'
        } in this focused slice.`,
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
        navigationHint:
          'Open a sender to confirm before deciding. Back to full sender list when you want the broader queue again.',
        pageLabel: `${focusedPageLabel} · ${focusLabel} matches`,
      }
    }

    if (activeOverviewSubset) {
      const segmentLoadedCount = activeOverviewSubset.loadedCount
      const segmentTotalCount = Math.max(activeOverviewSubset.chartCount, segmentLoadedCount)
      const hasSegmentRowsOutsideLoadedPage = segmentTotalCount > segmentLoadedCount
      const subsetPageLabel =
        activeOverviewSubsetPageStatus?.pageLabel ||
        `Subset active · showing matches from page ${workflowOverviewWorkspace.pagination.page} of ${Math.max(
          workflowOverviewWorkspace.pagination.total_pages || 1,
          1
        )}`

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
        pageLabel: subsetPageLabel,
      }
    }

    if (requestedTimeContextBucketLabel) {
      const hasBucketRowsOutsideLoadedPage = clusterSenderTotal > loadedWorkspaceCount

      return {
        summary: `${visibleRowCount.toLocaleString()} row${
          visibleRowCount === 1 ? '' : 's'
        } on screen · ${loadedWorkspaceCount.toLocaleString()} loaded in this page · ${clusterSenderTotal.toLocaleString()} in the active Time Context bucket.`,
        detail: hasBucketRowsOutsideLoadedPage
          ? `This page shows part of the ${requestedTimeContextBucketLabel} bucket, so ${(
              clusterSenderTotal - loadedWorkspaceCount
            ).toLocaleString()} matching sender${
              clusterSenderTotal - loadedWorkspaceCount === 1 ? '' : 's'
            } are still offscreen.`
          : `This page already includes every sender currently in the ${requestedTimeContextBucketLabel} bucket.`,
        navigationHint:
          'Decision Mode consumes this already narrowed authoritative order without recomputing bucket membership.',
        pageLabel: `Bucket active · ${requestedTimeContextBucketLabel} · ${pageLabel}`,
      }
    }

    const activeWorkflowScopeEmpty =
      workflowOverviewWorkspace.pagination.total_senders === 0 &&
      effectiveWorkflowScope !== normalizedAnalysisScope
    if (activeWorkflowScopeEmpty) {
      const activeScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
      const baselineScopeLabel = analysisScopeControlLabel(normalizedAnalysisScope)

      return {
        summary:
          '0 rows on screen · 0 loaded in this page · 0 in the active workflow scope.',
        detail: `${activeScopeLabel} currently contributes no sender rows from this cleanup group. The page shell stays anchored to ${baselineScopeLabel}, where ${clusterSenderTotal.toLocaleString()} senders remain in the full group.`,
        navigationHint:
          'Choose a broader ready scope when you want active sender rows, or stay here to confirm that this recent window is empty.',
        pageLabel: `${pageLabel} · ${activeScopeLabel} empty`,
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
    effectiveWorkflowScope,
    normalizedAnalysisScope,
    renderedSemanticSubtypeFocus,
    requestedTimeContextBucketLabel,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.error,
    semanticFocusWorkspaceState.status,
    semanticFocusPresentation,
    selectedCluster?.senderCount,
    authoritativeBucketWorkflowWorkspace,
    activeOverviewSubsetPageStatus,
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
      options?: {
        senderPage?: number | null
        interactionKind?: PendingNarrowingInteractionKind
        label?: string | null
        senderKey?: string | null
      }
    ) => {
      const shouldClearDerivedSemanticFocus =
        subsetSource === 'review_unit' &&
        nextSubset?.source !== 'review_unit' &&
        appliedDerivedReviewUnitFocusRef.current &&
        activeSemanticSubtypeFocusRef.current?.id === appliedDerivedReviewUnitFocusRef.current
      const nextSemanticFocus = shouldClearDerivedSemanticFocus
        ? null
        : activeSemanticSubtypeFocusRef.current
      if (
        shouldClearDerivedSemanticFocus &&
        activeSemanticSubtypeFocusRef.current?.id === appliedDerivedReviewUnitFocusRef.current
      ) {
        setActiveSemanticSubtypeFocus(null)
      }
      setPendingNarrowingInteraction({
        kind:
          options?.interactionKind ||
          (nextSubset ? 'route_subset' : 'clear_narrowing'),
        label: options?.label || nextSubset?.value || 'broader scope',
        senderKey: options?.senderKey || null,
        timeContextBucketLabel: null,
        timeContextBucketStartAt: null,
        timeContextBucketEndExclusiveAt: null,
        expectation: buildPendingNarrowingExpectation({
          subsetSource: nextSubset?.source || null,
          subsetValue: nextSubset?.value || null,
          semanticFocusId: nextSemanticFocus?.id || null,
          timeContextBucketLabel: null,
          timeContextBucketStartAt: null,
          timeContextBucketEndExclusiveAt: null,
        }),
      })
      startTransition(() => {
        router.replace(
          buildScopedReviewHref({
            agentId,
            sessionId,
            analysisScope,
            workflowScope: workflowScopeForOverviewContext({
              subsetSource: nextSubset?.source || null,
              subsetValue: nextSubset?.value || null,
              semanticFocus: nextSemanticFocus,
            }),
            clusterId: selectedCluster?.clusterId || clusterId,
            mode,
            subsetSource: nextSubset?.source || null,
            subsetValue: nextSubset?.value || null,
            senderPage: options?.senderPage ?? null,
            semanticFocus: nextSemanticFocus,
          }),
          { scroll: false }
        )
      })
    },
    [
      agentId,
      analysisScope,
      buildPendingNarrowingExpectation,
      buildScopedReviewHref,
      clusterId,
      mode,
      router,
      selectedCluster?.clusterId,
      sessionId,
      subsetSource,
      workflowScopeForOverviewContext,
    ]
  )
  const handleSenderDistributionSelect = useCallback(
    (senderKey: string) => {
      setLocalSenderDistributionFocusKey((current) => (current === senderKey ? null : senderKey))
    },
    []
  )
  const clearSenderDistributionSelection = useCallback(() => {
    setLocalSenderDistributionFocusKey(null)
  }, [])
  const updateDrilldownSort = useCallback(
    (nextSort: DrilldownSort) => {
      setDrilldownSort(nextSort)
      if (requestedSenderPage === DEFAULT_OVERVIEW_WORKSPACE_PAGE || !selectedCluster) return
      startTransition(() => {
        router.replace(
          buildScopedReviewHref({
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
      buildScopedReviewHref,
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

    if (activeOverviewSubset) {
      const totalPages = Math.max(activeOverviewSubsetPageStatus?.totalPages || 1, 1)
      const loadedPage = workflowOverviewWorkspace?.pagination.page || requestedSenderPage
      const transitionPending = workspaceState.status === 'loading' && loadedPage !== requestedSenderPage
      const currentPage = Math.min(
        transitionPending ? requestedSenderPage : loadedPage,
        totalPages
      )

      return {
        currentPage,
        totalPages,
        statusText:
          totalPages > 1
            ? `Subset active · showing matches from page ${currentPage} of ${totalPages}`
            : 'Subset active · all matches are on one page',
        hasMultiplePages: totalPages > 1,
        canPrevious: currentPage > DEFAULT_OVERVIEW_WORKSPACE_PAGE,
        canNext: currentPage < totalPages,
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
      : requestedTimeContextBucketLabel
        ? `Bucket active · showing matches from page ${currentPage} of ${totalPages}`
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
    activeOverviewSubset,
    activeOverviewSubsetPageStatus?.totalPages,
    effectiveWorkflowScope,
    hasSubsetRouteContext,
    normalizedAnalysisScope,
    overviewKnownTotalPages,
    overviewShellWorkspace,
    requestedTimeContextBucketLabel,
    requestedSenderPage,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace,
    semanticFocusWorkspaceState.status,
    workflowOverviewWorkspace,
    workspaceState.status,
  ])
  const senderWorkflowCoverageDisplay = useMemo(() => {
    if (pendingNarrowingInteraction) {
      if (pendingNarrowingInteraction.kind === 'sender_distribution') {
        return {
          summary: `Applying sender focus to ${pendingNarrowingInteraction.label}.`,
          detail:
            'The click registered immediately. The workflow is narrowing to this exact sender while the rest of the review surface stays mounted.',
          navigationHint:
            'Clear narrowed state when you want to return to the broader queue.',
          pageLabel: senderWorkflowPagination?.statusText || 'Sender focus · updating',
        }
      }

      if (pendingNarrowingInteraction.kind === 'time_context_bucket') {
        return {
          summary: `Refreshing the ${pendingNarrowingInteraction.label} workflow bucket.`,
          detail:
            'The workflow is narrowing to the exact sender set for this Time Context bucket while the full chart stays mounted above.',
          navigationHint:
            'Clear narrowed state when you want to return to the broader current workflow scope.',
          pageLabel:
            senderWorkflowPagination?.statusText ||
            `Bucket active · updating ${pendingNarrowingInteraction.label}`,
        }
      }

      if (pendingNarrowingInteraction.kind === 'clear_narrowing') {
        return {
          summary: 'Returning to broader scope…',
          detail:
            'The previous narrowed view has been cleared immediately. The broader workflow is restoring in place now.',
          navigationHint:
            'Stay here while the broader sender universe settles back into the workflow below.',
          pageLabel: senderWorkflowPagination?.statusText || 'Broad scope · restoring',
        }
      }

      if (pendingNarrowingInteraction.kind === 'clear_workflow_scope') {
        return {
          summary: 'Returning to All indexed…',
          detail:
            'The workflow scope override has been cleared. The broader All indexed sender universe is restoring in place now.',
          navigationHint:
            'Stay here while the broader workflow boundary settles back into the page shell.',
          pageLabel: senderWorkflowPagination?.statusText || 'All indexed · restoring',
        }
      }

      return {
        summary: `Refreshing ${pendingNarrowingInteraction.label}.`,
        detail:
          'This narrowed view is updating in place while the rest of the review surface stays mounted.',
        navigationHint:
          'Stay here while the refreshed narrowed sender universe resolves below.',
        pageLabel: senderWorkflowPagination?.statusText || 'Narrowed view · updating',
      }
    }

    if (senderListCoverage) return senderListCoverage
    if (!isSenderWorkflowInlineLoading) return null

    if (renderedSemanticSubtypeFocus) {
      return {
        summary: `Refreshing ${renderedSemanticSubtypeFocus.label} matches.`,
        detail:
          'Stay here — the focused list is updating in place while the rest of the review surface stays put.',
        navigationHint:
          'Back to full sender list when you want the broader queue again.',
        pageLabel:
          senderWorkflowPagination?.statusText ||
          `${renderedSemanticSubtypeFocus.label} matches · Matching page ${requestedSenderPage} of ${Math.max(
            semanticFocusWorkspace?.pagination.total_pages || 1,
            1
          )}`,
      }
    }

    if (hasSubsetRouteContext) {
      const subsetLoadingLabel =
        activeOverviewSubsetPageStatus?.totalPages && activeOverviewSubsetPageStatus.totalPages > 1
          ? `page ${Math.min(requestedSenderPage, activeOverviewSubsetPageStatus.totalPages)} of ${activeOverviewSubsetPageStatus.totalPages}`
          : 'the current result'
      return {
        summary: `Refreshing this matching list from ${subsetLoadingLabel}.`,
        detail:
          'This matching list is updating in place while the rest of the page stays put.',
        navigationHint:
          'Subset paging still follows the full sender list in this view.',
        pageLabel:
          senderWorkflowPagination?.statusText ||
          activeOverviewSubsetPageStatus?.pageLabel ||
          'Subset active · updating',
      }
    }

    if (requestedTimeContextBucketLabel) {
      return {
        summary: `Refreshing the ${requestedTimeContextBucketLabel} workflow bucket.`,
        detail:
          'The workflow is narrowing to the exact sender set for this Time Context bucket while the full chart stays mounted above.',
        navigationHint:
          'Clear narrowed state when you want to return to the broader current workflow scope.',
        pageLabel:
          senderWorkflowPagination?.statusText ||
          `Bucket active · updating ${requestedTimeContextBucketLabel}`,
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
    activeOverviewSubsetPageStatus,
    hasSubsetRouteContext,
    isSenderWorkflowInlineLoading,
    overviewKnownTotalPages,
    pendingNarrowingInteraction,
    requestedTimeContextBucketLabel,
    requestedSenderPage,
    renderedSemanticSubtypeFocus,
    semanticFocusWorkspace?.pagination.total_pages,
    senderListCoverage,
    senderWorkflowPagination,
  ])
  const workflowWindowActive = senderOverviewWindowSelection != null
  const chartOnlyWorkflowScopeLabel = analysisScopeControlLabel(effectiveWorkflowScope)
  const chartOnlyRangeLabel = timeContextActiveRangeLabel || 'Showing last 24 hours'
  const runtimeContinuityLabel =
    effectiveRuntimeContinuityPhase === 'build_pending'
      ? 'Fresh results are still building'
      : effectiveRuntimeContinuityPhase === 'ready'
        ? 'Updated results are ready'
        : null
  const stableRuntimeContinuitySnapshotVersion =
    runtime.runtimeContinuity?.stableSnapshotVersion || null
  const runtimeContinuityDetail =
    effectiveRuntimeContinuityPhase === 'build_pending'
      ? `Smart Sync has already finished indexing, but published runtime results are still building. This page is intentionally keeping the last stable snapshot visible${stableRuntimeContinuitySnapshotVersion ? ` from ${new Date(stableRuntimeContinuitySnapshotVersion).toLocaleString()}` : ''} until the new published truth is ready.`
      : effectiveRuntimeContinuityPhase === 'ready'
        ? 'The refreshed published runtime truth has loaded, and linked workflow surfaces are now re-reading from the new cache version.'
        : null
  const mailboxSyncTruthLabel = runtime.smartMailboxSyncStarting
    ? 'Smart Sync starting'
    : effectiveRuntimeContinuityPhase === 'build_pending'
      ? 'Smart Sync finished · published results still building'
      : effectiveRuntimeContinuityPhase === 'ready'
        ? 'Smart Sync refreshed · new runtime truth loaded'
        : runtime.mailboxIndexHealth?.execution_state
          ? `Mailbox index ${runtime.mailboxIndexHealth.execution_state.replace(/_/g, ' ')}`
          : 'Mailbox index status unavailable'
  const mailboxSyncTruthDetail = runtime.mailboxIndexHealth
    ? effectiveRuntimeContinuityPhase === 'build_pending'
      ? `Mailbox index coverage already reflects ${formatCountOrPlaceholder(runtime.mailboxIndexHealth.indexed_message_count)} indexed rows. Published runtime truth is still processing, so the current review state stays on the last stable snapshot until artifact build completes.`
      : effectiveRuntimeContinuityPhase === 'ready'
        ? `Mailbox index coverage currently tracks ${formatCountOrPlaceholder(runtime.mailboxIndexHealth.indexed_message_count)} indexed rows, and the refreshed published runtime truth is now active on this page.`
        : `Mailbox index coverage currently tracks ${formatCountOrPlaceholder(runtime.mailboxIndexHealth.indexed_message_count)} indexed rows. Smart Sync and backfill update this mailbox coverage truth.`
    : 'Mailbox coverage truth will appear here once the mailbox index health check is ready.'
  const artifactFreshnessStatus = renderRuntimeData?.runtime_mailbox_profile?.freshness?.status || null
  const artifactFreshnessGeneratedAt =
    renderRuntimeData?.runtime_mailbox_profile?.freshness?.last_generated_at ||
    renderRuntimeData?.runtime_mailbox_profile?.generated_at ||
    null
  const artifactFreshnessLabel =
    effectiveRuntimeContinuityPhase === 'build_pending'
      ? 'Artifact refresh in progress · showing last stable snapshot'
      : effectiveRuntimeContinuityPhase === 'ready'
        ? 'Artifact refreshed · new runtime truth loaded'
        : artifactFreshnessStatus
          ? `Artifact ${artifactFreshnessStatus}`
          : 'Artifact freshness unavailable'
  const artifactFreshnessDetail = artifactFreshnessGeneratedAt
    ? effectiveRuntimeContinuityPhase === 'build_pending'
      ? `Published runtime truth last generated ${new Date(artifactFreshnessGeneratedAt).toLocaleString()}. A newer build is still in progress, so workflow totals and rails stay on this stable publication until the refreshed version is ready.`
      : effectiveRuntimeContinuityPhase === 'ready'
        ? `Published runtime truth refreshed at ${new Date(artifactFreshnessGeneratedAt).toLocaleString()}. Workflow totals and rails are now reading from the updated publication layer.`
        : `Published runtime truth last generated ${new Date(artifactFreshnessGeneratedAt).toLocaleString()}. Workflow totals and rails read this publication layer separately from live sync progress.`
    : 'Workflow totals and rails read published runtime state separately from live mailbox sync progress.'
  const workflowTruthLabel = `${chartOnlyWorkflowScopeLabel} workflow truth`
  const workflowTruthDetail = workflowWindowActive
    ? `${workflowScopeSummary.detail} ${chartOnlyRangeLabel} is the active workflow window and currently narrows the live sender universe to ${sharedWorkflowSubset.resolvedSenderCount.toLocaleString()} sender${
        sharedWorkflowSubset.resolvedSenderCount === 1 ? '' : 's'
      }.`
    : `${workflowScopeSummary.detail} Current sender universe: ${sharedWorkflowSubset.resolvedSenderCount.toLocaleString()} sender${
        sharedWorkflowSubset.resolvedSenderCount === 1 ? '' : 's'
      }.`
  const chartCompareTruthLabel = workflowWindowActive
    ? `${chartOnlyRangeLabel} chart truth`
    : 'Workflow-aligned chart window'
  const chartCompareTruthDetail = workflowWindowActive
    ? `${chartOnlyRangeLabel} now uses the same narrowed sender universe as workflow totals, Sender Distribution, and Decision Mode. Chart counts still measure bucket activity, while workflow totals measure senders and review coverage in that same window.`
    : `${chartOnlyWorkflowScopeLabel} is currently driving the chart, workflow summary, sender rows, Sender Distribution, and Decision Mode queue together. Chart totals and workflow totals still describe different metrics inside that same sender universe.`
  const renderedHeroSummary = workflowWindowActive
    ? `${chartOnlyRangeLabel} is the active workflow window inside ${chartOnlyWorkflowScopeLabel}. Sender rows, Sender Distribution, pagination, and Decision Mode now narrow to that same sender universe${isDerivedReviewUnitActive ? ` while ${activeOverviewSubset?.label || activeDerivedReviewUnit?.label || 'this derived review unit'} stays narrowed inside the parent cleanup group` : ''}.`
    : isDerivedReviewUnitActive
      ? `${activeOverviewSubset?.label || activeDerivedReviewUnit?.label || 'A derived review unit'} is active inside this parent cleanup group. The parent group stays intact while this session narrows to that unit.`
      : 'Sender Overview keeps the workflow simple: understand the group, scan the sender list, then open the exact sender you want in the same in-place Decision Mode overlay.'
  const topSummarySenderLabel = workflowWindowActive ? 'Senders in workflow window' : 'Senders in workflow scope'
  const topSummaryManagedLabel = 'Managed already'
  const topSummaryRemainingLabel = 'Still to review'
  const topSummarySupportingLabel = workflowWindowActive
    ? 'Supporting messages in workflow window'
    : 'Supporting messages in workflow scope'
  const topSummarySenderValue = renderedTopSummarySenderTotal
  const topSummaryManagedValue = renderedTopSummaryManagedCount
  const topSummaryRemainingValue = renderedTopSummaryRemainingCount
  const topSummarySupportingValue = renderedTopSummarySupportingMessageCount
  const topSummarySenderCardIsLoading = renderedTopSummarySenderTotalIsLoading
  const topSummaryManagedCardIsLoading = renderedTopSummaryCoverageIsLoading
  const topSummaryRemainingCardIsLoading = renderedTopSummaryCoverageIsLoading
  const topSummarySupportingCardIsLoading = renderedTopSummarySupportingMessageIsLoading
  const topSummarySenderDetail =
    topSummarySenderCardIsLoading
      ? 'Scoped sender count will appear here as soon as the current cleanup group finishes loading.'
      : workflowWindowActive
        ? `${chartOnlyRangeLabel} is the active workflow window. This sender count matches the live workflow below.`
        : publishedReviewUnitSummaryActive
          ? 'Published sender total for this review unit.'
          : 'Review is sender-first.'
  const topSummaryManagedDetail =
    topSummaryManagedCardIsLoading
      ? 'Managed sender coverage will appear once scoped sender truth is ready.'
      : workflowWindowActive
        ? 'Covered senders inside this active workflow window.'
        : publishedReviewUnitSummaryActive
          ? 'Covered senders inside this published review unit.'
          : 'Already covered.'
  const topSummaryRemainingDetail =
    topSummaryRemainingCardIsLoading
      ? 'The count left to review will appear once the current scoped workspace is ready.'
      : workflowWindowActive
        ? `Decision Mode and the sender workflow are both narrowed to ${chartOnlyRangeLabel}.`
        : publishedReviewUnitSummaryActive
          ? 'Ready for review inside this published unit.'
          : 'Ready for review.'
  const topSummarySupportingDetail =
    topSummarySupportingCardIsLoading
      ? 'Scoped supporting-message volume will appear once the current cleanup group finishes loading.'
      : workflowWindowActive
        ? 'Supporting message volume from the same active workflow window.'
        : publishedReviewUnitSummaryActive
          ? 'Focused supporting-message volume for this published unit.'
          : 'Supports sender priority.'
  const topSummaryCoveredSendersDetail =
    workflowWindowActive
      ? renderedTopSummaryRemainingCount == null
        ? 'Scoped sender coverage is loading.'
        : `${renderedTopSummaryRemainingCount.toLocaleString()} sender${
            renderedTopSummaryRemainingCount === 1 ? '' : 's'
          } still remaining in ${chartOnlyRangeLabel}.`
      : renderedTopSummaryRemainingCount == null
        ? 'Scoped sender coverage is loading.'
        : `${renderedTopSummaryRemainingCount.toLocaleString()} sender${
            renderedTopSummaryRemainingCount === 1 ? '' : 's'
          } still remaining`
  const senderReviewGoalEyebrow = 'Workflow review goal'
  const senderReviewGoalTitle = workflowWindowActive
    ? `Give every sender in ${chartOnlyRangeLabel} a decision.`
    : publishedReviewUnitSummaryActive
      ? `Give every sender in ${activeOverviewSubset.label} a decision.`
      : 'Give every sender in this cleanup group a decision.'
  const senderReviewGoalDetail = workflowWindowActive
    ? `${chartOnlyRangeLabel} is now the active workflow window, so this progress meter, Sender Distribution, and the sender list all track the same narrowed sender universe.`
    : publishedReviewUnitSummaryActive
      ? 'Coverage is sender-level and stays inside this published review unit.'
      : 'Coverage is sender-level, not message-level.'
  const senderReviewGoalMeterLabel = 'Covered senders'
  const senderReviewGoalManagedCount = renderedTopSummaryManagedCount
  const senderReviewGoalTotal = renderedTopSummarySenderTotal
  const senderReviewGoalCoveragePct = renderedTopSummaryCoveragePct
  const senderReviewGoalCoverageIsLoading = renderedTopSummaryCoverageIsLoading
  const senderReviewGoalSummary = renderedTopSummaryGoalSummary
  const senderReviewGoalFollowUp = renderedTopSummaryGoalFollowUp
  const chartOnlyBaselineSummary = null
  const pendingNarrowingSummaryLine = null
  const pendingNarrowingSummaryBannerClassName =
    'rounded-2xl border border-cyan-100/85 bg-[linear-gradient(180deg,rgba(165,243,252,0.24),rgba(10,24,37,0.98))] px-4 py-3 shadow-[0_20px_40px_rgba(8,145,178,0.18)]'
  const workflowFeedbackVisualActive = false
  const topSummaryCardClassName = `${nestedSurfaceClass} rounded-2xl p-4`
  const workflowSectionClassName = `${primaryWorkflowSectionClass} space-y-4`
  const renderedFocusedSenderKey =
    sharedWorkflowSubset.focusedSenderKey || localSenderDistributionFocusKey
  const renderedTimeContextBucketLabel = requestedTimeContextBucketLabel
  const clearWorkflowScopePending = false
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
          buildScopedReviewHref({
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
      buildScopedReviewHref,
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
      const pending =
        pendingNarrowingInteraction?.kind === 'route_subset' &&
        pendingNarrowingInteraction.expectation.subsetSource === 'contributor' &&
        pendingNarrowingInteraction.expectation.subsetValue === itemId
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
        pending,
        onClick: () =>
          updateSubsetSelection(
            active
              ? null
              : {
                  source: 'contributor',
                  value: itemId,
                },
            {
              interactionKind: active ? 'clear_narrowing' : 'route_subset',
              label: item.label,
            }
          ),
      }
    })
  }, [
    overviewAnalytics,
    pendingNarrowingInteraction,
    renderedSubsetSource,
    renderedSubsetValue,
    updateSubsetSelection,
  ])

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
        senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
      }
    )
    startTransition(() => {
      router.replace(
        buildScopedReviewHref({
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
          semanticFocus,
          senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
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

        startTransition(() => {
          router.replace(
            buildScopedReviewHref({
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
              senderKey: nextSenderKey,
              overlayIntent: decisionOverlayIntent,
              senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
            }),
            { scroll: false }
          )
        })
      }
    } finally {
      setSubmittingSenderKey(null)
    }
  }

  if (publishedReviewUnitEntryState) {
    const parentTitle = selectedCluster
      ? getCleanupGroupDisplayTitle(selectedCluster.clusterId, selectedCluster.title)
      : 'Selected cleanup group'
    const operationsQuery = serializeOperationsQuery(sessionId, analysisScope)
    const cleanupGroupsHref = `/agents/${agentId}/operations/clusters${operationsQuery}`
    const routeClusterId =
      selectedCluster?.canonicalClusterId ||
      selectedCluster?.clusterId ||
      selectedCanonicalClusterId ||
      MARKETING_PARENT_CANONICAL_ID
    const blockedUnitLabel =
      publishedReviewUnitEntryRequestedUnit?.label || 'The requested review unit'
    const headline =
      publishedReviewUnitEntryState === 'choose_unit'
        ? `Choose a ${parentTitle} unit before review starts`
        : publishedReviewUnitEntryState === 'missing_unit'
          ? 'Review unit is missing from this route'
          : publishedReviewUnitEntryState === 'invalid_unit'
            ? 'Selected review unit is unavailable'
            : publishedReviewUnitEntryState === 'oversized_unit'
              ? 'Selected review unit is above the safe review limit'
              : 'Published review units are unavailable'
    const guidance =
      publishedReviewUnitEntryState === 'choose_unit'
        ? 'This parent is intentionally decomposed at first click. Choose one published child unit below; the broad parent will not open as a review queue.'
        : publishedReviewUnitEntryState === 'missing_unit'
          ? 'This route requested unit-based review without a unit id. Choose a current published child below.'
          : publishedReviewUnitEntryState === 'invalid_unit'
            ? 'The requested unit is no longer part of the published artifact. Choose a current published child below.'
            : publishedReviewUnitEntryState === 'oversized_unit'
              ? `${blockedUnitLabel} exceeds the 400-sender first-click limit, so broad review remains blocked.`
              : 'The published artifact does not currently expose a complete safe child-unit set. Broad-parent review remains blocked.'

    return (
      <div className="space-y-4" data-published-review-entry-state={publishedReviewUnitEntryState}>
        <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                Published Review Entry
              </p>
              <h1 className="text-2xl font-semibold text-white">{parentTitle}</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-200">{guidance}</p>
            </div>
            <Link
              href={cleanupGroupsHref}
              className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
            >
              Cleanup Groups
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="app-surface-card-inset rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Parent context</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                {formatCountOrPlaceholder(selectedCluster?.senderCount ?? null)}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-200">
                Senders in the parent; this total is context, not the active review queue.
              </p>
            </div>
            <div className="app-surface-card-inset rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Entry contract</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">Unit-only</p>
              <p className="mt-2 text-xs leading-5 text-slate-200">
                Each valid first-click unit stays at or below 400 senders.
              </p>
            </div>
          </div>
        </section>

        <section className={`${primarySurfaceClass} p-5 space-y-4`}>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Published Review Units
            </p>
            <h2 className="text-xl font-semibold text-white">{headline}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-200">{guidance}</p>
          </div>

          {selectablePublishedReviewUnits.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectablePublishedReviewUnits.map((unit) => (
                <Link
                  key={unit.id}
                  href={buildReviewHref({
                    agentId,
                    sessionId,
                    analysisScope,
                    clusterId: routeClusterId,
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
                    {unit.groupSharePct}% of the published parent · {unit.targetLabel}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-700/45 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
              No valid published child units are available. This page is intentionally failing closed rather than opening broad-parent review.
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
    selectedCluster
      ? getCleanupGroupDisplayTitle(selectedCluster.clusterId, selectedCluster.title)
      : missingScopedClusterName || 'Selected cleanup group'
  const sharedWorkflowSubsetRouteSubset = sharedWorkflowSubset.source.routeSubset
  const managementHref = buildManagementHref({ agentId, sessionId, analysisScope })
  const decisionHref = buildScopedReviewHref({
    agentId,
    sessionId,
    analysisScope,
    workflowScope: currentRequestedWorkflowScope,
    clusterId: activeReviewClusterId,
    mode: 'decision',
    senderPage: decisionBootstrapTargetPage,
    senderKey: guidedDecisionSenderKey || provisionalDecisionSeedSenderKey,
    overlayIntent: 'guided',
    senderOverviewWindowSelection: senderOverviewWindowSelection,
  })
  const subsetDecisionHref = activeOverviewSubset
      ? buildScopedReviewHref({
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
        senderOverviewWindowSelection: senderOverviewWindowSelection,
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
        senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
      }
    )
    decisionOverlayScrollTopRef.current = scrollTop
    startTransition(() => {
      router.replace(
        buildScopedReviewHref({
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
          semanticFocus,
          senderOverviewWindowSelection: senderOverviewWindowSelectionRef.current,
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
  const overviewWorkspaceFailureSettled = Boolean(
    mode !== 'overview' ||
      (
        workspaceFetchPlan == null &&
        defaultOverviewRuntimeGate.status !== 'waiting' &&
        !passiveReadyWorkspaceSnapshot &&
        !passiveWorkspaceSeedSnapshot &&
        !continuityOverviewWorkspaceSnapshot &&
        !displayOverviewWorkspace &&
        !overviewShellWorkspace
      )
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
    overviewWorkspaceFailureSettled &&
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
      <section
        data-review-hero="true"
        className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Selected Cleanup Group
            </p>
            <h1 className="text-2xl font-semibold text-white">{activeReviewClusterTitle}</h1>
            <p className="max-w-3xl text-sm text-slate-200">{renderedHeroSummary}</p>
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
          <div className={topSummaryCardClassName}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">{topSummarySenderLabel}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummarySenderValue)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummarySenderDetail}
            </p>
          </div>
          <div className={topSummaryCardClassName}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">{topSummaryManagedLabel}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummaryManagedValue)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummaryManagedDetail}
            </p>
          </div>
          <div className={topSummaryCardClassName}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">{topSummaryRemainingLabel}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummaryRemainingValue)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummaryRemainingDetail}
            </p>
          </div>
          <div className={topSummaryCardClassName}>
            <p className="text-[10px] uppercase tracking-wide text-slate-300">{topSummarySupportingLabel}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountOrPlaceholder(topSummarySupportingValue)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {topSummarySupportingDetail}
            </p>
          </div>
        </div>

        <div
          data-review-goal="true"
          className="rounded-3xl border border-emerald-700/45 bg-[linear-gradient(180deg,rgba(13,74,57,0.30),rgba(12,48,66,0.24),rgba(9,15,23,0.96))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.28)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                {senderReviewGoalEyebrow}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {senderReviewGoalTitle}
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {senderReviewGoalDetail}
              </p>
            </div>
            <div
              className={`${nestedSurfaceClass} rounded-2xl border border-emerald-600/45 px-4 py-3 text-right`}
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                {senderReviewGoalMeterLabel}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {senderReviewGoalTotal == null
                  ? '— / —'
                  : `${senderReviewGoalManagedCount == null ? '—' : senderReviewGoalManagedCount.toLocaleString()} / ${senderReviewGoalTotal.toLocaleString()}`}
              </p>
              <p className="mt-1 text-xs text-slate-200">
                {topSummaryCoveredSendersDetail}
              </p>
            </div>
          </div>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-gray-900/90 ring-1 ring-emerald-700/30">
            {senderReviewGoalCoverageIsLoading ? (
              <div className="h-full w-full animate-pulse bg-emerald-400/15" />
            ) : (
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, senderReviewGoalCoveragePct || 0))}%` }}
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <span>{senderReviewGoalSummary}</span>
            <span className="text-slate-300">{senderReviewGoalFollowUp}</span>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {runtimeContinuityLabel || managementError || showOverviewBackgroundRefreshNotice ? (
          <div
            data-review-continuity-panel="true"
            className={`${secondaryWorkflowSectionClass} border-cyan-500/35 bg-[linear-gradient(180deg,rgba(14,37,54,0.96),rgba(8,19,31,0.98))] p-5 space-y-4`}
          >
            {runtimeContinuityLabel ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                    Smart Sync continuity
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{runtimeContinuityLabel}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-200">{runtimeContinuityDetail}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/70 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      effectiveRuntimeContinuityPhase === 'ready'
                        ? 'bg-emerald-300'
                        : 'bg-cyan-300'
                    }`}
                  />
                  {effectiveRuntimeContinuityPhase === 'ready' ? 'Updated' : 'Processing'}
                </span>
              </div>
            ) : null}
            {managementError ? (
              <p className="text-xs text-amber-200">
                Management state could not be fully loaded yet: {managementError}
              </p>
            ) : null}
            {showOverviewBackgroundRefreshNotice ? (
              <p className="text-xs text-slate-300">Refreshing scoped sender evidence in the background…</p>
            ) : null}
          </div>
        ) : null}

        <section
          data-review-context-row="true"
          className="space-y-4"
        >
          <div
            className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}
            data-review-truth-guide="true"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  Page truth guide
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  This review page keeps mailbox sync and artifact freshness visible, while hero
                  metrics, workflow scope, sender rows, Sender Distribution, and Time Context now
                  read the same active sender universe.
                </p>
              </div>
              <span className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] text-slate-100`}>
                Unified workflow scope
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className={`${topSummaryCardClassName} border border-slate-700/45`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Mailbox index / sync truth
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{mailboxSyncTruthLabel}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">{mailboxSyncTruthDetail}</p>
              </div>
              <div className={`${topSummaryCardClassName} border border-slate-700/45`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Artifact freshness / publication truth
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{artifactFreshnessLabel}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">{artifactFreshnessDetail}</p>
              </div>
              <div className={`${topSummaryCardClassName} border border-slate-700/45`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Workflow truth
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{workflowTruthLabel}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">{workflowTruthDetail}</p>
              </div>
              <div className={`${topSummaryCardClassName} border border-slate-700/45`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Chart compare truth
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{chartCompareTruthLabel}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">{chartCompareTruthDetail}</p>
              </div>
            </div>
          </div>

          {chartOnlyBaselineSummary ? (
            <div
              data-review-baseline-panel="true"
              className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                    Cleanup-group baseline
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {chartOnlyBaselineSummary}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    These broader totals stay visible as baseline context for the selected cleanup group. They are not the 1D chart-window truth block.
                  </p>
                </div>
                <span
                  className={`${insetPillClass} rounded-full px-3 py-1 text-[11px] text-slate-100`}
                >
                  {chartOnlyWorkflowScopeLabel} workflow stays below
                </span>
              </div>
            </div>
          ) : null}

          {pendingNarrowingSummaryLine ? (
            <div
              data-review-pending-narrowing="true"
              className={pendingNarrowingSummaryBannerClassName}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-900/70">
                    Narrowing update in progress
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {pendingNarrowingSummaryLine}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-950/15 bg-slate-950 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100 shadow-[0_14px_32px_rgba(2,6,23,0.28)]">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  Updating
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section
          data-review-orientation-row="true"
          className={`${secondaryWorkflowSectionClass} p-5 space-y-4`}
        >
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
      </div>

      <div className={reviewPageShellClass}>
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
              {groupInternalStructure && groupReviewUnitStarters.length > 0 && !semanticFocusPresentation ? (
                <div className="rounded-xl border border-cyan-700/35 bg-[rgba(9,21,33,0.76)] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Review units inside this group
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {groupInternalStructure.summary}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    These derived review units keep the parent cleanup group intact and only narrow
                    the current session queue.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {groupReviewUnitStarters.map((starter) => (
                      <button
                        key={starter.id}
                        type="button"
                        onClick={starter.onClick}
                        aria-pressed={starter.active}
                        aria-busy={starter.pending}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          starter.pending
                            ? 'border-cyan-400/70 bg-cyan-950/28 text-cyan-100'
                            : starter.active
                            ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                            : 'border-white/10 bg-white/5 text-gray-100 hover:border-cyan-700/45 hover:text-white'
                        }`}
                      >
                        {starter.pending ? `${starter.label} · Applying…` : starter.label}
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
              {semanticFocusPresentation ? (
                <div
                  className={`rounded-xl border px-4 py-3 transition-colors duration-300 ${
                    semanticFocusOrientationActive
                      ? 'border-cyan-500/50 bg-cyan-950/18'
                      : 'border-cyan-700/35 bg-[rgba(9,21,33,0.76)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                        {semanticFocusPresentation.eyebrow}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {semanticFocusPresentation.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-slate-200">
                        {semanticFocusPresentation.selectionDetail}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-cyan-100/90">
                        {semanticFocusPresentation.publishedCountLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearOverviewNarrowingState}
                      disabled={clearNarrowingPending}
                      className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs ${
                        clearNarrowingPending
                          ? 'cursor-progress border-cyan-100/85 bg-cyan-300 text-slate-950 opacity-100 shadow-[0_14px_32px_rgba(34,211,238,0.24)]'
                          : ''
                      }`}
                    >
                      {clearNarrowingPending ? 'Returning to broader scope…' : 'Clear narrowed state'}
                    </button>
                  </div>
                </div>
              ) : null}
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
            data-sender-overview-rail-source={activeSharedAnalysisRailSource}
            data-sender-overview-rail-state={activeSharedAnalysisRailState}
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
                nextAction={renderedTimeContextNextAction}
                workflowContext={renderedTimeContextWorkflowContext}
                workflowSenderUniverseTotal={renderedTimeContextWorkflowSenderUniverseTotal}
                scopeStatus={activeRailDisplay.scopeStatus}
                scopeControls={{
                  activeScope: activeTimeContextChartScope,
                  pendingScope: pendingTimeContextChartScope,
                  onSelectScope: handleTimeContextRailScopeSelect,
                  allowedScopes: TIME_CONTEXT_VISIBLE_CHART_SCOPES,
                  customRangeStart: senderOverviewWindowSelection?.start || null,
                  customRangeEnd: senderOverviewWindowSelection?.end || null,
                  customRangeMin: timeContextCustomRangeMin,
                  customRangeMax: timeContextCustomRangeMax,
                  activeRangeLabel: timeContextActiveRangeLabel,
                  onApplyCustomRange: applySenderOverviewCustomRange,
                }}
                tabStrip={
                  <SharedAnalysisRailTabStrip
                    activeTab={activeSharedAnalysisRailTab}
                    onSelectTab={setActiveSharedAnalysisRailTab}
                  />
                }
                isUpdating={pendingTimeContextScope != null || senderOverviewWindowLoading}
                bodyOverride={activeRailDisplay.bodyOverride}
                bucketSelection={{
                  activeLabel: renderedTimeContextBucketLabel,
                  mode: timeContextBucketInteractionMode,
                  onToggleBucket: handleTimeContextBucketToggle,
                  disabledReason: timeContextBucketInteractionDisabledReason,
                  isLoading: timeContextBucketSelectionLoading,
                  notice: timeContextBucketNotice,
                }}
              />
            ) : (
              <SenderDistributionAnalysisRail
                items={senderDistributionItems}
                totalRankedSenders={senderDistributionTotalRankedSenders}
                focusedSenderKey={renderedFocusedSenderKey}
                authoritativeContext={senderDistributionAuthoritativeContext}
                onSelectSender={handleSenderDistributionSelect}
                onClearSelection={clearSenderDistributionSelection}
                scopeStatus={senderDistributionScopeStatus}
                scopeControls={{
                  activeScope: activeSenderDistributionControlScope,
                  pendingScope: pendingSenderDistributionControlScope,
                  onSelectScope: handleSenderDistributionControlSelect,
                  allowedScopes: TIME_CONTEXT_VISIBLE_CHART_SCOPES,
                  customRangeStart: senderOverviewWindowSelection?.start || null,
                  customRangeEnd: senderOverviewWindowSelection?.end || null,
                  customRangeMin: timeContextCustomRangeMin,
                  customRangeMax: timeContextCustomRangeMax,
                  activeRangeLabel: timeContextActiveRangeLabel,
                  onApplyCustomRange: applySenderOverviewCustomRange,
                }}
                tabStrip={
                  <SharedAnalysisRailTabStrip
                    activeTab={activeSharedAnalysisRailTab}
                    onSelectTab={setActiveSharedAnalysisRailTab}
                  />
                }
                isLoading={senderDistributionLoading}
                isUpdating={
                  pendingSenderDistributionScope != null || senderDistributionUpdating
                }
                errorMessage={senderDistributionErrorMessage}
              />
            )}
          </div>

          <section
            ref={senderWorkflowSectionRef}
            data-shared-workflow-label={sharedWorkflowSubset.label}
            data-shared-workflow-source={sharedWorkflowSubset.source.primary}
            className={workflowSectionClassName}
          >
            {workflowFeedbackVisualActive ? (
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(180deg,rgba(165,243,252,0.12),rgba(14,116,144,0.08),rgba(0,0,0,0))]" />
            ) : null}
            {senderWorkflowCoverageDisplay && workflowFeedbackVisualActive ? (
              <div className="rounded-2xl border border-cyan-100/85 bg-[linear-gradient(180deg,rgba(165,243,252,0.24),rgba(10,24,37,0.98))] px-4 py-3 shadow-[0_20px_40px_rgba(8,145,178,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-950/70">
                      Workflow update in progress
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {senderWorkflowCoverageDisplay.summary}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-cyan-50">
                      {senderWorkflowCoverageDisplay.detail}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/90 bg-cyan-300 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.24)]">
                    <span className="h-2 w-2 rounded-full bg-slate-950" />
                    Applying now
                  </span>
                </div>
              </div>
            ) : null}
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
                  <p
                    className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] ${
                      workflowFeedbackVisualActive
                        ? 'border-cyan-100/85 bg-cyan-300 text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.22)]'
                        : 'border-cyan-700/40 bg-cyan-950/20 text-cyan-200'
                    }`}
                  >
                    {senderWorkflowCoverageDisplay.pageLabel}
                  </p>
                ) : null}
                {activeWorkflowNarrowing ? (
                  <button
                    type="button"
                    onClick={clearOverviewNarrowingState}
                    disabled={clearNarrowingPending}
                    className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm ${
                      clearNarrowingPending
                        ? 'cursor-progress border-cyan-100/85 bg-cyan-300 text-slate-950 opacity-100 shadow-[0_14px_32px_rgba(34,211,238,0.24)]'
                        : ''
                    }`}
                  >
                    {clearNarrowingPending ? 'Returning to broader scope…' : 'Clear narrowed state'}
                  </button>
                ) : null}
                {hasDetachedWorkflowScope ? (
                  <button
                    type="button"
                    onClick={clearWorkflowScopeOverride}
                    disabled={clearWorkflowScopePending}
                    className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm ${
                      clearWorkflowScopePending
                        ? 'cursor-progress border-cyan-100/85 bg-cyan-300 text-slate-950 opacity-100 shadow-[0_14px_32px_rgba(34,211,238,0.24)]'
                        : ''
                    }`}
                  >
                    {clearWorkflowScopePending ? 'Returning to All indexed…' : 'Back to All indexed'}
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
                        : workflowOverviewWorkspace?.pagination.total_senders === 0 &&
                            effectiveWorkflowScope !== normalizedAnalysisScope
                          ? `No sender rows are in scope for ${analysisScopeControlLabel(effectiveWorkflowScope)}`
                          : 'No sender rows are ready on this page yet'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {renderedSemanticSubtypeFocus
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? 'Stay here — this focused list is updating in place.'
                          : semanticFocusWorkspaceState.status === 'error'
                            ? semanticFocusWorkspaceState.error ||
                              'Back to full sender list when you want the broader queue again.'
                            : 'Back to full sender list when you want the broader queue again.'
                        : workflowOverviewWorkspace?.pagination.total_senders === 0 &&
                            effectiveWorkflowScope !== normalizedAnalysisScope
                          ? `${analysisScopeControlLabel(effectiveWorkflowScope)} is genuinely empty for this cleanup group. The broader All indexed shell stays visible above for context, but there are no sender rows to review in this ready scope.`
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
                            : null
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
                          {isDerivedReviewUnitActive
                            ? 'Senders from this derived review unit will appear here as soon as the scoped list is ready.'
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
                      {isDerivedReviewUnitActive
                        ? 'Review this derived unit'
                        : renderedSemanticSubtypeFocus
                        ? 'Review this focused list'
                        : 'Review this matching list'}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {isDerivedReviewUnitActive
                        ? 'This derived review unit stays inside the same parent cleanup group. Start with the strongest sender rows here, then open a sender to confirm before deciding.'
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
                      focusedSenderWorkflowLabel
                        ? `Loading ${focusedSenderWorkflowLabel}`
                        : `Loading matching senders from page ${requestedSenderPage} of ${overviewKnownTotalPages}`
                    }
                    detail={
                      focusedSenderWorkflowLabel
                        ? 'Stay here — the first matching sender rows will appear as soon as this smaller group is ready. You do not need to change the analysis window.'
                        : 'This matching list is updating in place while the rest of the page stays put.'
                    }
                  />
                ) : visibleDrilldownSenders.length === 0 ? (
                  <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-5`}>
                    <p className="text-sm font-semibold text-white">
                      {focusedSenderWorkflowLabel
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? `Loading ${focusedSenderWorkflowLabel}`
                          : semanticFocusWorkspaceState.status === 'error'
                            ? 'Could not load this smaller group'
                            : `No matching senders for ${focusedSenderWorkflowLabel} are on screen right now`
                        : 'No matching sender rows are ready on this page yet'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {focusedSenderWorkflowLabel
                        ? semanticFocusWorkspaceState.status === 'loading'
                          ? 'Stay here — the sender list is loading. You do not need to change the analysis window.'
                          : semanticFocusWorkspaceState.status === 'error'
                            ? semanticFocusWorkspaceState.error ||
                              'Return to Cleanup Groups and choose this smaller group again.'
                            : 'Return to Cleanup Groups when you want to choose another smaller group.'
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
                            : null
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
                    ? 'Continue with this published review unit in the same one-sender-at-a-time Decision Mode, or return to Cleanup Groups to choose another unit.'
                    : 'You can either review the full cleanup group or hand off only this selected subset into the same one-sender-at-a-time decision flow. Gmail still never mutates here.'
                  : 'Decision Mode is the next step when you are ready to move from overview into one-sender-at-a-time action.'}
              </p>
              {activeOverviewSubset ? (
                <div className="space-y-3">
                  {reviewUnitDecisionQueueLoading ? (
                    <div className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500/40 px-5 py-3 text-sm font-semibold text-cyan-50">
                      Preparing This Unit
                    </div>
                  ) : (
                    <Link
                      href={subsetDecisionHref}
                      scroll={false}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-cyan-400"
                    >
                      {activeOverviewSubset.source === 'review_unit'
                        ? 'Review This Unit'
                        : 'Review Selected Subset'}
                    </Link>
                  )}
                  {activeOverviewSubset.source === 'review_unit' ? (
                    <Link
                      href={`/agents/${agentId}/operations/clusters`}
                      className={`${quietSecondaryActionClass} inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold`}
                    >
                      Choose Another Unit
                    </Link>
                  ) : (
                    <Link
                      href={decisionHref}
                      scroll={false}
                      className={`${quietSecondaryActionClass} inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold`}
                    >
                      Review Full Group
                    </Link>
                  )}
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
                    ? 'Preparing the full sender list for this published review unit before entering Decision Mode.'
                    : activeOverviewSubset.source === 'review_unit'
                    ? `${activeOverviewSubset.chartCount.toLocaleString()} senders are in this published review unit. ${activeOverviewSubset.loadedCount.toLocaleString()} are shown on this page, and the exact child membership stays stable across Sender Overview and Decision Mode.`
                    : `${activeOverviewSubset.eligibleCount.toLocaleString()} senders are ready to review inside this subset. This handoff is session-only and does not create a saved cleanup group.`
                  : workflowOverviewWorkspace?.pagination.total_senders === 0 &&
                      effectiveWorkflowScope !== normalizedAnalysisScope
                    ? `No senders are in scope for ${analysisScopeControlLabel(effectiveWorkflowScope)}. Broaden the ready scope when you want active senders in Decision Mode.`
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
                      ? 'Every visible sender in this selected subset is already managed or complete. You can close this overlay to keep exploring or continue in Management.'
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
