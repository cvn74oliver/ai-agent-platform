export const DECISION_WORKSPACE_READ_SCHEMA_VERSION = 1 as const

export type DecisionWorkspaceReadAdapterId = 'gmail'

export type DecisionWorkspaceSourceIdentity = Readonly<{
  id: string
  providerType: string
  role: 'primary' | 'supporting'
}>

export type DecisionWorkspaceMetricDefinition = Readonly<{
  id: string
  valueType: 'count' | 'currency' | 'rate' | 'score' | 'duration' | 'quantity' | 'status'
  unit: string
  aggregation: 'sum' | 'weighted_average' | 'latest' | 'none'
}>

export type DecisionWorkspaceMetricObservation = Readonly<{
  definitionId: string
  value: number | string
  unit: string
  timeBasis: string
  sourceIds: readonly string[]
}>

export type DecisionReviewGroupSectionId =
  | 'action'
  | 'backlog'
  | 'coverage'
  | 'secondary'
  | 'context'

export type DecisionReviewGroupSurfaceTier =
  | 'featured_parent'
  | 'collapsed_parent'
  | 'secondary'

export type DecisionReviewGroupSurfaceKind =
  | 'semantic_parent'
  | 'backlog_parent'
  | 'structural_parent'
  | 'historical_parent'
  | 'secondary_candidate'

export type DecisionReviewRecommendationReason =
  | 'resume_work'
  | 'small_quick_win'
  | 'high_impact_manageable'
  | 'backlog'
  | 'none'

export type DecisionReviewUnitReadModel = Readonly<{
  id: string
  parentId: string
  label: string
  subjectCount: number
  activityCount: number | null
  groupSharePct: number
  sourceKind: string
  sourceKey: string
  decompositionPath: readonly string[]
  unitRole: string
  basis: string
  semanticFamily: string | null
  semanticSubtype: string | null
  focusKind: string | null
  surfacedSubtypeKeys: readonly string[]
  reasonKind: 'assignment_reason' | 'exclusion_reason' | null
  manageabilityState: 'under_target' | 'within_target' | 'near_cap' | 'oversized'
  manageabilityLabel: string
  guidance: string
  kind: 'family' | 'subtype' | 'remainder'
  tone: 'resolved' | 'provisional' | 'unresolved'
  familySharePct: number
  honestyLabel: string
  targetRoute: Readonly<{
    path: '/agents/[id]/operations/review'
    clusterId: string
    subsetSource: 'review_unit'
    subsetValue: string
  }>
}>

export type DecisionReviewGroupReadModel = Readonly<{
  id: string
  workflowGroupId: string
  presentationId: string
  isPresentationSlice: boolean
  validationErrors: readonly string[]
  title: string
  canonicalId: string
  compatibilityIds: readonly string[]
  sectionId: DecisionReviewGroupSectionId
  surfaceTier: DecisionReviewGroupSurfaceTier
  surfaceKind: DecisionReviewGroupSurfaceKind
  subjectCount: number | null
  activityCount: number | null
  sharePct: number | null
  whyExists: string
  laneLabel: string
  startWith: string | null
  explanation: string
  riskGuidance: string
  safetyGuidance: string
  dominantSubject: string | null
  dominantPattern: string | null
  protectedActivityCount: number | null
  uncertainSubjectCount: number | null
  requiresExactUnitTotal: boolean
  semanticContextLabel: string
  semanticHeadline: string
  semanticSupport: string
  semanticSupplement: string | null
  reviewUnits: readonly DecisionReviewUnitReadModel[]
  recommendedReviewUnitId: string | null
}>

export type DecisionReviewGroupSectionReadModel = Readonly<{
  id: DecisionReviewGroupSectionId
  title: string
  description: string
  defaultExpanded: boolean
  groups: readonly DecisionReviewGroupReadModel[]
}>

export type DecisionReviewGroupSectionSummaryReadModel = Readonly<{
  id: DecisionReviewGroupSectionId
  title: string
  description: string
  defaultExpanded: boolean
  groupCount: number
  totalSubjectCount: number
  totalActivityCount: number
}>

export type DecisionReviewIntentSnapshotReadModel = Readonly<{
  id: 'quick_start' | 'manageable_impact' | 'backlog_reduction'
  title: string
  description: string
  group: DecisionReviewGroupReadModel | null
}>

export type DecisionReviewProgressReadModel = Readonly<{
  latestGroupId: string | null
  startedGroupCount: number
  startedGroupIds: readonly string[]
}>

export type DecisionReviewRecommendationReadModel = Readonly<{
  reason: DecisionReviewRecommendationReason
  group: DecisionReviewGroupReadModel | null
  groupId: string | null
  unitId: string | null
  rationale: string
  expectedImpact: number | null
  confidence: 'high' | 'medium' | 'low' | 'unavailable'
  evidenceReferences: readonly string[]
}>

export type DecisionWorkspaceReadValidation = Readonly<{
  valid: boolean
  errors: readonly string[]
}>

export type DecisionWorkspaceReviewGroupsReadModel = Readonly<{
  schemaVersion: typeof DECISION_WORKSPACE_READ_SCHEMA_VERSION
  workspaceType: string
  workflowDefinition: Readonly<{ definitionId: string; version: string }>
  runtimeInstanceId: string
  analysisScopeId: string
  vocabulary: Readonly<{
    subjectSingular: string
    subjectPlural: string
    activitySingular: string
    activityPlural: string
  }>
  agentRoles: readonly Readonly<{ id: string; label: string }>[]
  sources: readonly DecisionWorkspaceSourceIdentity[]
  generatedAt: string
  observedAt: string
  freshness: Readonly<{ status: 'fresh' | 'stale' | 'unknown'; asOf: string }>
  quality: Readonly<{
    status: 'verified' | 'degraded' | 'unavailable'
    warnings: readonly string[]
  }>
  provenance: Readonly<{
    transformationId: string
    transformationVersion: string
    sourceReferences: readonly string[]
  }>
  metricDefinitions: readonly DecisionWorkspaceMetricDefinition[]
  metricObservations: readonly DecisionWorkspaceMetricObservation[]
  loading: boolean
  error: string | null
  unavailableReason: string | null
  hasResolvedIntelligence: boolean
  query: string
  sourceGroups: readonly DecisionReviewGroupReadModel[]
  groups: readonly DecisionReviewGroupReadModel[]
  primaryGroups: readonly DecisionReviewGroupReadModel[]
  optionalGroups: readonly DecisionReviewGroupReadModel[]
  secondaryGroups: readonly DecisionReviewGroupReadModel[]
  contextGroups: readonly DecisionReviewGroupReadModel[]
  sections: readonly DecisionReviewGroupSectionReadModel[]
  sectionSummaries: readonly DecisionReviewGroupSectionSummaryReadModel[]
  intentSnapshots: readonly DecisionReviewIntentSnapshotReadModel[]
  progress: DecisionReviewProgressReadModel
  recommendation: DecisionReviewRecommendationReadModel
  subjectScopeCount: number
  validation: DecisionWorkspaceReadValidation
}>

export type DecisionWorkspaceActivityWindowId =
  | 'all_indexed'
  | 'last_year'
  | 'last_quarter'
  | 'last_month'
  | 'last_week'
  | 'last_day'
  | 'custom'

export type DecisionWorkspaceActivityBucketReadModel = Readonly<{
  id: string
  label: string
  startAt: string
  endAt: string
  value: number
  sourceIds: readonly string[]
  explicitZero: boolean
}>

export type DecisionWorkspaceActivitySeriesReadModel = Readonly<{
  id: string
  metricDefinitionId: string
  unit: string
  windowId: DecisionWorkspaceActivityWindowId
  compatibilityQueryId: string
  requestedStartAt: string | null
  requestedEndAt: string | null
  effectiveStartAt: string | null
  effectiveEndAt: string | null
  timeZone: string
  grouping: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  coverageStartAt: string | null
  coverageEndAt: string | null
  limitedByCoverage: boolean
  requiresExplicitZeroBuckets: boolean
  buckets: readonly DecisionWorkspaceActivityBucketReadModel[]
  freshness: DecisionWorkspaceReviewGroupsReadModel['freshness']
  quality: DecisionWorkspaceReviewGroupsReadModel['quality']
  provenance: DecisionWorkspaceReviewGroupsReadModel['provenance']
  validation: DecisionWorkspaceReadValidation
}>

export type DecisionWorkspaceLifecycleSignalsReadModel = Readonly<{
  awaitingApproval: number
  executingOrVerifying: number
  failed: number
  executedReversible: number
  deferredOrUnsupported: number
  evidenceReferences: readonly string[]
}>

export type DecisionWorkspaceHealthReadModel = Readonly<{
  scoreDefinitionId: string
  score: number
  minimum: number
  maximum: number
  directionality: 'higher_is_better' | 'lower_is_better' | 'target_range'
  state: string
  explanation: string
}>

export type DecisionWorkspaceIntelligenceRecommendationReadModel = Readonly<{
  id: string
  interventionId: string
  title: string
  rationale: string
  expectedImpact: string
  confidence: 'high' | 'medium' | 'low' | 'unavailable'
  metricDefinitionIds: readonly string[]
  evidenceReferences: readonly string[]
  alternatives: readonly string[]
  assumptions: readonly string[]
  navigationTarget: Readonly<{
    path: string
    compatibilityQuery: string
  }> | null
}>

export type DecisionWorkspaceIntelligenceReadModel = Readonly<{
  schemaVersion: typeof DECISION_WORKSPACE_READ_SCHEMA_VERSION
  workspaceType: string
  workflowDefinition: Readonly<{ definitionId: string; version: string }>
  runtimeInstanceId: string
  analysisScopeId: string
  vocabulary: DecisionWorkspaceReviewGroupsReadModel['vocabulary']
  agentRoles: DecisionWorkspaceReviewGroupsReadModel['agentRoles']
  sources: DecisionWorkspaceReviewGroupsReadModel['sources']
  generatedAt: string
  observedAt: string
  freshness: DecisionWorkspaceReviewGroupsReadModel['freshness']
  quality: DecisionWorkspaceReviewGroupsReadModel['quality']
  provenance: DecisionWorkspaceReviewGroupsReadModel['provenance']
  metricDefinitions: readonly DecisionWorkspaceMetricDefinition[]
  scopeMetrics: readonly DecisionWorkspaceMetricObservation[]
  health: DecisionWorkspaceHealthReadModel
  activitySeries: DecisionWorkspaceActivitySeriesReadModel | null
  lifecycleSignals: DecisionWorkspaceLifecycleSignalsReadModel
  recommendation: DecisionWorkspaceIntelligenceRecommendationReadModel
  workflowProgress: Readonly<{
    decidedSubjectCount: number
    startedGroupCount: number
    latestGroupId: string | null
    latestStageId: string | null
  }>
  reviewGroups: DecisionWorkspaceReviewGroupsReadModel
  loading: boolean
  error: string | null
  unavailableReason: string | null
  validation: DecisionWorkspaceReadValidation
}>

export type DecisionWorkspaceItemOverviewSubjectReadModel = Readonly<{
  id: string
  presentationId: string
  title: string
  subtitle: string | null
  sourceIds: readonly string[]
  metricObservations: readonly DecisionWorkspaceMetricObservation[]
  evidenceReferences: readonly string[]
  classificationIds: readonly string[]
  requiresReview: boolean
}>

export type DecisionWorkspaceItemOverviewAnalysisTab = 'time_context' | 'sender_distribution'

export type DecisionWorkspaceItemOverviewReadModel = Readonly<{
  schemaVersion: typeof DECISION_WORKSPACE_READ_SCHEMA_VERSION
  workspaceType: string
  workflowDefinition: Readonly<{ definitionId: string; version: string }>
  runtimeInstanceId: string
  analysisScopeId: string
  vocabulary: DecisionWorkspaceReviewGroupsReadModel['vocabulary']
  agentRoles: DecisionWorkspaceReviewGroupsReadModel['agentRoles']
  sources: DecisionWorkspaceReviewGroupsReadModel['sources']
  generatedAt: string
  observedAt: string
  freshness: DecisionWorkspaceReviewGroupsReadModel['freshness']
  quality: DecisionWorkspaceReviewGroupsReadModel['quality']
  provenance: DecisionWorkspaceReviewGroupsReadModel['provenance']
  selectedGroup: Readonly<{
    id: string
    presentationId: string
    title: string
  }>
  reviewUnitId: string | null
  scope: Readonly<{
    scopeId: string
    windowId: DecisionWorkspaceActivityWindowId | null
    timeZone: string
    subsetId: string | null
  }>
  metricDefinitions: readonly DecisionWorkspaceMetricDefinition[]
  metricObservations: readonly DecisionWorkspaceMetricObservation[]
  orderedSubjectIds: readonly string[]
  subjects: readonly DecisionWorkspaceItemOverviewSubjectReadModel[]
  pagination: Readonly<{
    page: number
    pageSize: number
    totalSubjects: number
    totalPages: number
  }>
  loading: boolean
  error: string | null
  unavailableReason: string | null
  validation: DecisionWorkspaceReadValidation
}>

/**
 * Transitional adapter DTOs preserve the accepted page lifecycle while the framework-facing
 * model above owns portable meaning. They are provider-projected compatibility values, not
 * framework semantic definitions.
 */
export type DecisionWorkspaceCleanupClusterRef = Readonly<{
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[]
  sourceClusterIds?: string[]
  clusterType: string
  title: string
  query: string
  whySelected?: string | null
  riskNote?: string | null
  safetyNote?: string | null
  senderCount?: number | null
  messageCount?: number | null
  estimatedCount?: number | null
  surfaceTier?: string | null
  surfaceKind?: string | null
  surfaceVisibility?: string | null
  topLevelRank?: number | null
}>

export type DecisionWorkspacePressureTrendWindow = DecisionWorkspaceActivityWindowId

export type DecisionWorkspacePressureTrendBucket = Readonly<{
  label: string
  count: number
  bucket_start_at: string
  bucket_end_at: string
  composition?: Array<Readonly<{ label: string; count: number; share_pct: number }>>
  evidence_signals?: Array<Readonly<{ label: string; count: number; share_pct: number }>>
}>

export type DecisionWorkspacePressureTrendData = Readonly<{
  window: Readonly<{
    key: DecisionWorkspacePressureTrendWindow
    label: string
    requested_start: string | null
    requested_end: string | null
    effective_start: string | null
    effective_end: string | null
    limited_by_indexed_coverage: boolean
  }>
  grouping: Readonly<{
    key: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
    label: string
  }>
  indexed_coverage: Readonly<{
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }>
  time_zone: string
  series: readonly DecisionWorkspacePressureTrendBucket[]
  source: string
}>

export type DecisionWorkspaceIntelligenceGroup = Readonly<{
  cluster_id: string
  canonical_cluster_id: string
  legacy_cluster_ids: readonly string[]
  source_cluster_ids: readonly string[]
  cluster_type: string
  title: string
  query: string
  why_selected: string
  risk_note: string
  safety_note: string
  message_count: number
  sender_count: number
  share_pct: number
  dominant_sender: string | null
  dominant_semantic_family: unknown
  dominant_semantic_pattern: unknown
  dominant_pattern: string | null
  protected_message_count: number
  uncertain_sender_count: number
  surface_tier: string
  surface_kind: string
  surface_visibility: string
  top_level_rank: number | null
  promotion_status: string
  selected_semantic_axis: string | null
  operator_value_status: string
  review_units_required: boolean
  review_unit_basis: string
  review_unit_count: number
  semantic_rollup_schema_version: number | null
  semantic_rollup_hash: string | null
  semantic_rollup: unknown
  semantic_family_distribution: readonly unknown[]
  semantic_pattern_distribution: readonly unknown[]
  semantic_resolution_distribution: readonly unknown[]
  semantic_confidence_distribution: readonly unknown[]
  semantic_provenance_distribution: readonly unknown[]
  semantic_umbrella_distribution: readonly unknown[]
}>

export type DecisionWorkspaceIntelligenceData = Readonly<{
  analysis_scope: string
  whole_mailbox: Readonly<{
    message_count: number
    sender_count: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }>
  cleanup_candidate_universe: Readonly<{
    message_count: number
    sender_count: number
    activity_timeline: readonly Readonly<{ label: string; count: number }>[]
  }>
  protected_safe_context: Readonly<{
    protected_message_count: number
    protected_sender_count: number
  }>
  cleanup_groups: readonly DecisionWorkspaceIntelligenceGroup[]
  initial_pressure_trend?: DecisionWorkspacePressureTrendData | null
  source: string
}>

export type DecisionWorkspaceManagementSignals = Readonly<{
  managedSenderCount: number
  archiveVerificationCount: number
  archiveFailureCount: number
  quarantineCount: number
  customRuleCount: number
  recentRestoreCount: number
}>

export type DecisionWorkspaceWorkflowProgress = Readonly<{
  decidedSenderCount: number
  startedClusterCount: number
  latestClusterId: string | null
  latestStage: string | null
}>

export type DecisionWorkspaceManagementCapabilityReadModel = Readonly<{
  id: string
  sourceId: string
  kind: 'execute' | 'reverse' | 'verify'
  providerSpecific: true
}>

export type DecisionWorkspaceManagementEvidenceReadModel = Readonly<{
  id: string
  sourceId: string
  kind: 'provider_record' | 'history' | 'activity' | 'receipt'
}>

export type DecisionWorkspaceManagedSubjectExecutionReadModel = Readonly<{
  status: 'not_applicable' | 'pending' | 'executed' | 'failed' | 'deferred' | 'reverted'
  capabilityId: string | null
  sourceId: string | null
  observedAt: string | null
  warning: string | null
  impactMetric: DecisionWorkspaceMetricObservation | null
  receiptEvidenceReferences: readonly string[]
}>

export type DecisionWorkspaceManagementEventReadModel = Readonly<{
  id: string
  subjectId: string
  decisionStateId: string
  kind: 'decision' | 'execution' | 'reversal'
  occurredAt: string
  sourceIds: readonly string[]
  evidenceReferences: readonly string[]
}>

export type DecisionWorkspaceDecisionStateSummaryReadModel = Readonly<{
  id: string
  label: string
  subjectCount: number
  activityImpact: DecisionWorkspaceMetricObservation | null
  lastChangedAt: string | null
  sourceIds: readonly string[]
  evidenceReferences: readonly string[]
}>

export type DecisionWorkspaceManagedSubjectReadModel = Readonly<{
  id: string
  presentationId: string
  title: string
  sourceIds: readonly string[]
  workflowDefinitionId: string
  groupId: string | null
  decisionStateId: string
  reason: string | null
  decidedAt: string
  lastChangedAt: string
  historyEventIds: readonly string[]
  evidenceReferences: readonly string[]
  execution: DecisionWorkspaceManagedSubjectExecutionReadModel
}>

export type DecisionWorkspaceManagementReadModel = Readonly<{
  schemaVersion: typeof DECISION_WORKSPACE_READ_SCHEMA_VERSION
  workspaceType: string
  workflowDefinition: Readonly<{ definitionId: string; version: string }>
  runtimeInstanceId: string
  analysisScopeId: string
  vocabulary: DecisionWorkspaceReviewGroupsReadModel['vocabulary']
  agentRoles: DecisionWorkspaceReviewGroupsReadModel['agentRoles']
  sources: DecisionWorkspaceReviewGroupsReadModel['sources']
  capabilities: readonly DecisionWorkspaceManagementCapabilityReadModel[]
  generatedAt: string
  observedAt: string
  freshness: DecisionWorkspaceReviewGroupsReadModel['freshness']
  quality: DecisionWorkspaceReviewGroupsReadModel['quality']
  provenance: DecisionWorkspaceReviewGroupsReadModel['provenance']
  metricDefinitions: readonly DecisionWorkspaceMetricDefinition[]
  evidence: readonly DecisionWorkspaceManagementEvidenceReadModel[]
  decisionStates: readonly DecisionWorkspaceDecisionStateSummaryReadModel[]
  managedSubjects: readonly DecisionWorkspaceManagedSubjectReadModel[]
  decisionHistory: readonly DecisionWorkspaceManagementEventReadModel[]
  recentActivity: readonly DecisionWorkspaceManagementEventReadModel[]
  recommendation: Readonly<{
    status: 'unavailable' | 'deferred' | 'informational'
    summary: string
  }>
  loading: boolean
  error: string | null
  unavailableReason: string | null
  validation: DecisionWorkspaceReadValidation
}>

/**
 * Transitional provider payloads stay opaque to the framework. They preserve accepted provider UI
 * and action seams while the portable management model owns reusable read meaning.
 */
export type DecisionWorkspaceProviderCompatibilityValue = Readonly<{
  providerType: string
  value: unknown
}>

export type DecisionWorkspaceManagementReadValue = Readonly<{
  model: DecisionWorkspaceManagementReadModel
  compatibilityValue: DecisionWorkspaceProviderCompatibilityValue
}>

export type DecisionWorkspaceReadResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: string; aborted?: boolean; reason?: string | null }>

export type DecisionWorkspaceManagementReadService = Readonly<{
  readSummary: (params: {
    agentId: string
  }) => Promise<DecisionWorkspaceReadResult<DecisionWorkspaceManagementReadValue>>
}>

export type DecisionWorkspaceItemOverviewRequestContext = Readonly<{
  source: string
  component: string
  reason: string
  phase: 'initial_paint' | 'deferred' | 'interactive' | 'fallback'
  agentId?: string
}>

export type DecisionWorkspaceItemOverviewWorkspaceParams = Readonly<{
  selectedGroup: DecisionWorkspaceCleanupClusterRef
  allGroups: readonly DecisionWorkspaceCleanupClusterRef[]
  analysisScopeId: string
  cacheVersion: string | null
  includeOrderedSubjectIds?: boolean
  page?: number
  pageSize?: number
  search?: string | null
  filter?: string
  sort?: string
  direction?: string
  semanticFocus?: unknown
  reviewUnitId?: string | null
  expectedReviewUnitSubjectCount?: number | null
  previewEvidenceSubjectId?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  overviewWindow?: DecisionWorkspaceActivityWindowId | null
  overviewStart?: string | null
  overviewEnd?: string | null
  timeZone?: string | null
  requestContext?: DecisionWorkspaceItemOverviewRequestContext
  signal?: AbortSignal
}>

export type DecisionWorkspaceItemOverviewWindowParams = Readonly<{
  selectedGroup: DecisionWorkspaceCleanupClusterRef
  allGroups: readonly DecisionWorkspaceCleanupClusterRef[]
  analysisScopeId: string
  cacheVersion: string | null
  reviewUnitId?: string | null
  windowId: DecisionWorkspaceActivityWindowId
  startAt?: string | null
  endAt?: string | null
  timeZone?: string | null
  requestContext?: DecisionWorkspaceItemOverviewRequestContext
  signal?: AbortSignal
}>

export type DecisionWorkspaceItemOverviewDistributionParams = Readonly<{
  selectedGroup: DecisionWorkspaceCleanupClusterRef
  allGroups: readonly DecisionWorkspaceCleanupClusterRef[]
  analysisScopeId: string
  cacheVersion: string | null
  semanticFocus?: unknown
  reviewUnitId?: string | null
  timeContextBucketLabel?: string | null
  timeContextBucketStartAt?: string | null
  timeContextBucketEndExclusiveAt?: string | null
  overviewWindow?: DecisionWorkspaceActivityWindowId | null
  overviewStart?: string | null
  overviewEnd?: string | null
  timeZone?: string | null
  expectedSubjectIds?: readonly string[]
  requestContext?: DecisionWorkspaceItemOverviewRequestContext
  signal?: AbortSignal
}>

/**
 * The compatibility values are deliberately opaque to the framework. The selected adapter owns
 * their provider shape while the portable Item Overview model above owns reusable meaning.
 */
export type DecisionWorkspaceItemOverviewCompatibilityValue = unknown

export type DecisionWorkspaceItemOverviewReadService = Readonly<{
  capabilities: Readonly<{
    defaultPageSize: number
    decisionQueuePageSize: number
    maximumPageSize: number
  }>
  readCachedWorkspace: (
    params: DecisionWorkspaceItemOverviewWorkspaceParams
  ) => DecisionWorkspaceItemOverviewCompatibilityValue | null
  fetchWorkspace: (
    params: DecisionWorkspaceItemOverviewWorkspaceParams
  ) => Promise<DecisionWorkspaceReadResult<DecisionWorkspaceItemOverviewCompatibilityValue>>
  readCachedWindow: (
    params: DecisionWorkspaceItemOverviewWindowParams
  ) => DecisionWorkspaceItemOverviewCompatibilityValue | null
  fetchWindow: (
    params: DecisionWorkspaceItemOverviewWindowParams
  ) => Promise<DecisionWorkspaceReadResult<DecisionWorkspaceItemOverviewCompatibilityValue>>
  buildDistributionRequestKey: (params: DecisionWorkspaceItemOverviewDistributionParams) => string
  readCachedDistribution: (
    params: DecisionWorkspaceItemOverviewDistributionParams
  ) => DecisionWorkspaceItemOverviewCompatibilityValue | null
  fetchDistribution: (
    params: DecisionWorkspaceItemOverviewDistributionParams
  ) => Promise<DecisionWorkspaceReadResult<DecisionWorkspaceItemOverviewCompatibilityValue>>
  resolveDistributionAuthoritySubjectIds: (params: {
    reviewUnitActive: boolean
    responseReady: boolean
    responseSubjectIds: readonly string[]
    fallbackSubjectIds: readonly string[]
  }) => readonly string[]
  buildReviewUnitActivitySeries: (
    projection: DecisionWorkspaceItemOverviewCompatibilityValue | null
  ) => DecisionWorkspaceItemOverviewCompatibilityValue
}>

export type DecisionWorkspaceIntelligenceReadService = Readonly<{
  readCachedIntelligence: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    analysisScopeId: string
    cacheVersion: string | null
  }) => DecisionWorkspaceIntelligenceData | null
  readLatestStableIntelligence: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    analysisScopeId: string
  }) => DecisionWorkspaceIntelligenceData | null
  fetchIntelligence: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    analysisScopeId: string
    cacheVersion: string | null
    initialPressureWindow: DecisionWorkspacePressureTrendWindow
    initialPressureStart: string | null
    initialPressureEnd: string | null
    initialTimeZone: string
    requestContext: Readonly<{ source: string; component: string; reason: string; phase: string }>
  }) => Promise<DecisionWorkspaceReadResult<DecisionWorkspaceIntelligenceData>>
  readCachedActivitySeries: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    cacheVersion: string | null
    pressureWindow: DecisionWorkspacePressureTrendWindow
    pressureStart: string | null
    pressureEnd: string | null
    timeZone: string
  }) => DecisionWorkspacePressureTrendData | null
  primeCachedActivitySeries: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    cacheVersion: string | null
    pressureWindow: DecisionWorkspacePressureTrendWindow
    pressureStart: string | null
    pressureEnd: string | null
    timeZone: string
    data: DecisionWorkspacePressureTrendData
  }) => void
  fetchActivitySeries: (params: {
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
    cacheVersion: string | null
    pressureWindow: DecisionWorkspacePressureTrendWindow
    pressureStart: string | null
    pressureEnd: string | null
    timeZone: string
    requestContext: Readonly<{ source: string; component: string; reason: string; phase: string }>
    signal?: AbortSignal
  }) => Promise<DecisionWorkspaceReadResult<DecisionWorkspacePressureTrendData>>
  readWorkflowProgress: (params: {
    agentId: string
    sessionId: string | null
    cacheVersion: string | null
    clusters: readonly DecisionWorkspaceCleanupClusterRef[]
  }) => DecisionWorkspaceWorkflowProgress
  readManagementSignals: (params: { agentId: string }) => Promise<DecisionWorkspaceManagementSignals | null>
  recommendArtifactReviewGroup: (params: {
    groups: readonly DecisionWorkspaceIntelligenceGroup[]
    latestClusterId: string | null
  }) => Readonly<{
    group: DecisionWorkspaceIntelligenceGroup | null
    reason: DecisionReviewRecommendationReason
  }>
  recommendRuntimeReviewGroup: (params: {
    groups: readonly DecisionWorkspaceCleanupClusterRef[]
    latestClusterId: string | null
  }) => Readonly<{
    group: DecisionWorkspaceCleanupClusterRef | null
    reason: DecisionReviewRecommendationReason
  }>
}>

export type DecisionWorkspaceReadAdapterInput = Readonly<{
  agentId: string
  requestedSessionId: string | null
  runtimeSessionId: string | null
  analysisScopeId: string
  runtimeData: unknown
  loading: boolean
  error: string | null
  observedAt: number | null
}>

export type DecisionWorkspaceReadAdapter = Readonly<{
  id: DecisionWorkspaceReadAdapterId
  intelligence: DecisionWorkspaceIntelligenceReadService
  itemOverview: DecisionWorkspaceItemOverviewReadService
  management: DecisionWorkspaceManagementReadService
  projectReviewGroups: (
    input: DecisionWorkspaceReadAdapterInput,
    progress: DecisionReviewProgressReadModel
  ) => DecisionWorkspaceReviewGroupsReadModel
  readReviewGroupsProgress: (
    input: DecisionWorkspaceReadAdapterInput,
    model: DecisionWorkspaceReviewGroupsReadModel
  ) => DecisionReviewProgressReadModel
}>

const ID = /^[a-z0-9][a-z0-9._:-]*$/

function validText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validCount(value: number | null): boolean {
  return value == null || (Number.isFinite(value) && value >= 0)
}

export function validateDecisionWorkspaceReviewGroupsReadModel(
  model: Omit<DecisionWorkspaceReviewGroupsReadModel, 'validation'>
): DecisionWorkspaceReadValidation {
  const errors: string[] = []
  if (model.schemaVersion !== DECISION_WORKSPACE_READ_SCHEMA_VERSION) {
    errors.push('Decision workspace read schema version must be 1.')
  }
  if (!ID.test(model.workspaceType)) errors.push('Workspace type must be a stable identifier.')
  if (!ID.test(model.workflowDefinition.definitionId) || !validText(model.workflowDefinition.version)) {
    errors.push('Workflow definition identity and version are required.')
  }
  if (!validText(model.runtimeInstanceId) || !validText(model.analysisScopeId)) {
    errors.push('Runtime instance and analysis scope identity are required.')
  }
  if (model.agentRoles.length === 0 || model.agentRoles.some((role) => !ID.test(role.id) || !validText(role.label))) {
    errors.push('At least one valid agent role is required.')
  }
  if (model.sources.length === 0 || model.sources.some((source) => !ID.test(source.id) || !ID.test(source.providerType))) {
    errors.push('At least one valid source identity is required.')
  }
  if (!Number.isFinite(Date.parse(model.generatedAt)) || !Number.isFinite(Date.parse(model.observedAt))) {
    errors.push('Generated and observed timestamps are required.')
  }
  if (
    !model.freshness ||
    !['fresh', 'stale', 'unknown'].includes(model.freshness.status) ||
    !Number.isFinite(Date.parse(model.freshness.asOf))
  ) {
    errors.push('Freshness identity is required.')
  }
  if (
    !model.quality ||
    !['verified', 'degraded', 'unavailable'].includes(model.quality.status) ||
    !Array.isArray(model.quality.warnings)
  ) {
    errors.push('Quality status is required.')
  }
  if (!ID.test(model.provenance.transformationId) || !validText(model.provenance.transformationVersion) || model.provenance.sourceReferences.length === 0) {
    errors.push('Transformation provenance is required.')
  }
  const sourceIds = new Set(model.sources.map((source) => source.id))
  const definitions = new Map(model.metricDefinitions.map((definition) => [definition.id, definition]))
  if (definitions.size !== model.metricDefinitions.length) errors.push('Metric definition IDs must be unique.')
  if (
    model.metricDefinitions.length === 0 ||
    model.metricDefinitions.some(
      (definition) => !ID.test(definition.id) || !validText(definition.unit)
    )
  ) {
    errors.push('Metric definitions must have stable IDs and units.')
  }
  for (const observation of model.metricObservations) {
    const definition = definitions.get(observation.definitionId)
    if (!definition || definition.unit !== observation.unit) {
      errors.push(`Metric observation ${observation.definitionId} has no compatible definition.`)
    }
    if (observation.sourceIds.length === 0 || observation.sourceIds.some((id) => !sourceIds.has(id))) {
      errors.push(`Metric observation ${observation.definitionId} has invalid source identity.`)
    }
    if (typeof observation.value === 'number' && !Number.isFinite(observation.value)) {
      errors.push(`Metric observation ${observation.definitionId} has a non-finite value.`)
    }
  }
  const groupIds = new Set<string>()
  const unitIds = new Set<string>()
  for (const group of model.groups) {
    if (
      !ID.test(group.id) ||
      !ID.test(group.workflowGroupId) ||
      !ID.test(group.canonicalId) ||
      groupIds.has(group.id)
    ) {
      errors.push(`Review group identity ${group.id} is invalid or duplicated.`)
    }
    groupIds.add(group.id)
    if (!validText(group.title) || !validText(group.explanation) || !validText(group.safetyGuidance) || !validText(group.riskGuidance)) {
      errors.push(`Review group ${group.id} is missing required operator guidance.`)
    }
    if (!validCount(group.subjectCount) || !validCount(group.activityCount)) errors.push(`Review group ${group.id} has an invalid count.`)
    let childTotal = 0
    for (const unit of group.reviewUnits) {
      if (!validText(unit.id) || unitIds.has(unit.id)) errors.push(`Review unit identity ${unit.id} is invalid or duplicated.`)
      unitIds.add(unit.id)
      if (unit.parentId !== group.canonicalId || !validCount(unit.subjectCount) || !validCount(unit.activityCount)) {
        errors.push(`Review unit ${unit.id} has invalid parent identity or count.`)
      }
      childTotal += unit.subjectCount
    }
    if (group.requiresExactUnitTotal && group.subjectCount != null && childTotal !== group.subjectCount) {
      errors.push(`Review group ${group.id} child subject totals contradict the parent total.`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function finalizeDecisionWorkspaceReviewGroupsReadModel(
  model: Omit<DecisionWorkspaceReviewGroupsReadModel, 'validation'>
): DecisionWorkspaceReviewGroupsReadModel {
  const validation = validateDecisionWorkspaceReviewGroupsReadModel(model)
  if (validation.valid) return { ...model, validation }
  return {
    ...model,
    quality: { status: 'unavailable', warnings: validation.errors },
    unavailableReason: 'Decision workspace data is unavailable because its read contract failed validation.',
    sourceGroups: [],
    groups: [],
    primaryGroups: [],
    optionalGroups: [],
    secondaryGroups: [],
    contextGroups: [],
    sections: [],
    sectionSummaries: [],
    intentSnapshots: [],
    recommendation: {
      reason: 'none',
      group: null,
      groupId: null,
      unitId: null,
      rationale: 'No recommendation is available while the read contract is invalid.',
      expectedImpact: null,
      confidence: 'unavailable',
      evidenceReferences: [],
    },
    subjectScopeCount: 0,
    validation,
  }
}

export function validateDecisionWorkspaceActivitySeriesReadModel(
  model: Omit<DecisionWorkspaceActivitySeriesReadModel, 'validation'>,
  sources: readonly DecisionWorkspaceSourceIdentity[]
): DecisionWorkspaceReadValidation {
  const errors: string[] = []
  const sourceIds = new Set(sources.map((source) => source.id))
  if (!ID.test(model.id) || !ID.test(model.metricDefinitionId) || !validText(model.unit)) {
    errors.push('Activity series identity, metric definition, and unit are required.')
  }
  if (!validText(model.compatibilityQueryId) || !validText(model.timeZone)) {
    errors.push('Activity series compatibility query and time zone are required.')
  }
  const bucketIds = new Set<string>()
  let previousEnd = Number.NEGATIVE_INFINITY
  for (const bucket of model.buckets) {
    const start = Date.parse(bucket.startAt)
    const end = Date.parse(bucket.endAt)
    if (!ID.test(bucket.id) || bucketIds.has(bucket.id)) {
      errors.push(`Activity bucket ${bucket.id} is invalid or duplicated.`)
    }
    bucketIds.add(bucket.id)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < previousEnd) {
      errors.push(`Activity bucket ${bucket.id} is unordered, overlapping, or has an invalid range.`)
    }
    previousEnd = end
    if (!Number.isFinite(bucket.value) || bucket.value < 0 || bucket.explicitZero !== (bucket.value === 0)) {
      errors.push(`Activity bucket ${bucket.id} has an invalid value or zero-bucket declaration.`)
    }
    if (bucket.sourceIds.length === 0 || bucket.sourceIds.some((id) => !sourceIds.has(id))) {
      errors.push(`Activity bucket ${bucket.id} has invalid source identity.`)
    }
  }
  if (model.requiresExplicitZeroBuckets && model.buckets.some((bucket) => bucket.value === 0 && !bucket.explicitZero)) {
    errors.push('Required zero buckets must remain explicit.')
  }
  const coverageStart = Date.parse(model.coverageStartAt || '')
  const coverageEnd = Date.parse(model.coverageEndAt || '')
  if (
    model.buckets.length > 0 &&
    (!Number.isFinite(coverageStart) || !Number.isFinite(coverageEnd) || coverageEnd < coverageStart)
  ) {
    errors.push('Activity series coverage bounds are invalid.')
  }
  if (
    model.buckets.some(
      (bucket) => Date.parse(bucket.startAt) < coverageStart || Date.parse(bucket.endAt) > coverageEnd
    )
  ) {
    errors.push('Activity buckets must remain inside declared coverage.')
  }
  return { valid: errors.length === 0, errors }
}

export function finalizeDecisionWorkspaceActivitySeriesReadModel(
  model: Omit<DecisionWorkspaceActivitySeriesReadModel, 'validation'>,
  sources: readonly DecisionWorkspaceSourceIdentity[]
): DecisionWorkspaceActivitySeriesReadModel {
  const validation = validateDecisionWorkspaceActivitySeriesReadModel(model, sources)
  if (validation.valid) return { ...model, validation }
  return {
    ...model,
    buckets: [],
    quality: { status: 'unavailable', warnings: validation.errors },
    validation,
  }
}

export function validateDecisionWorkspaceIntelligenceReadModel(
  model: Omit<DecisionWorkspaceIntelligenceReadModel, 'validation'>
): DecisionWorkspaceReadValidation {
  const errors: string[] = []
  const sourceIds = new Set(model.sources.map((source) => source.id))
  const roleIds = new Set(model.agentRoles.map((role) => role.id))
  const definitions = new Map(model.metricDefinitions.map((definition) => [definition.id, definition]))
  if (model.schemaVersion !== DECISION_WORKSPACE_READ_SCHEMA_VERSION) errors.push('Decision workspace read schema version must be 1.')
  if (!ID.test(model.workspaceType) || !ID.test(model.workflowDefinition.definitionId) || !validText(model.workflowDefinition.version)) {
    errors.push('Workspace and workflow identity are required.')
  }
  if (!validText(model.runtimeInstanceId) || !validText(model.analysisScopeId)) {
    errors.push('Runtime instance and analysis scope identity are required.')
  }
  if (sourceIds.size !== model.sources.length || model.sources.some((source) => !ID.test(source.id) || !ID.test(source.providerType))) {
    errors.push('Source identities must be valid and unique.')
  }
  if (roleIds.size !== model.agentRoles.length || model.agentRoles.some((role) => !ID.test(role.id) || !validText(role.label))) {
    errors.push('Agent role identities must be valid and unique.')
  }
  if (definitions.size !== model.metricDefinitions.length || model.metricDefinitions.some((definition) => !ID.test(definition.id) || !validText(definition.unit))) {
    errors.push('Metric definitions must be valid and unique.')
  }
  for (const observation of model.scopeMetrics) {
    const definition = definitions.get(observation.definitionId)
    if (!definition || definition.unit !== observation.unit) {
      errors.push(`Scope metric ${observation.definitionId} has no compatible definition.`)
    }
    if (observation.sourceIds.length === 0 || observation.sourceIds.some((id) => !sourceIds.has(id))) {
      errors.push(`Scope metric ${observation.definitionId} has invalid source identity.`)
    }
    if (typeof observation.value === 'number' && (!Number.isFinite(observation.value) || observation.value < 0)) {
      errors.push(`Scope metric ${observation.definitionId} has an invalid value.`)
    }
  }
  if (
    !ID.test(model.health.scoreDefinitionId) ||
    !Number.isFinite(model.health.score) ||
    !Number.isFinite(model.health.minimum) ||
    !Number.isFinite(model.health.maximum) ||
    model.health.maximum <= model.health.minimum ||
    model.health.score < model.health.minimum ||
    model.health.score > model.health.maximum ||
    !validText(model.health.explanation)
  ) {
    errors.push('Health score definition, range, directionality, and explanation are required.')
  }
  const lifecycleValues = Object.entries(model.lifecycleSignals)
    .filter(([key]) => key !== 'evidenceReferences')
    .map(([, value]) => value)
  if (lifecycleValues.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    errors.push('Lifecycle signal counts must be finite and non-negative.')
  }
  if (
    !ID.test(model.recommendation.id) ||
    !ID.test(model.recommendation.interventionId) ||
    !validText(model.recommendation.title) ||
    !validText(model.recommendation.rationale) ||
    model.recommendation.metricDefinitionIds.length === 0 ||
    model.recommendation.metricDefinitionIds.some((id) => !definitions.has(id)) ||
    model.recommendation.evidenceReferences.length === 0
  ) {
    errors.push('Recommendation identity, rationale, metric linkage, and evidence are required.')
  }
  if (model.activitySeries && !model.activitySeries.validation.valid) {
    errors.push(...model.activitySeries.validation.errors.map((error) => `Activity series: ${error}`))
  }
  if (!model.reviewGroups.validation.valid) {
    errors.push('Referenced Review Groups model must be valid.')
  }
  if (!Number.isFinite(Date.parse(model.generatedAt)) || !Number.isFinite(Date.parse(model.observedAt))) {
    errors.push('Generated and observed timestamps are required.')
  }
  return { valid: errors.length === 0, errors }
}

export function finalizeDecisionWorkspaceIntelligenceReadModel(
  model: Omit<DecisionWorkspaceIntelligenceReadModel, 'validation'>
): DecisionWorkspaceIntelligenceReadModel {
  const validation = validateDecisionWorkspaceIntelligenceReadModel(model)
  if (validation.valid) return { ...model, validation }
  return {
    ...model,
    quality: { status: 'unavailable', warnings: validation.errors },
    activitySeries: null,
    unavailableReason: 'Decision intelligence is unavailable because its read contract failed validation.',
    recommendation: {
      id: 'recommendation.unavailable',
      interventionId: 'intervention.unavailable',
      title: 'No recommendation is available',
      rationale: 'The read contract must validate before a recommendation can be shown.',
      expectedImpact: 'Unavailable',
      confidence: 'unavailable',
      metricDefinitionIds: [],
      evidenceReferences: [],
      alternatives: [],
      assumptions: [],
      navigationTarget: null,
    },
    validation,
  }
}

function validateManagementMetricObservation(
  observation: DecisionWorkspaceMetricObservation | null,
  definitions: ReadonlyMap<string, DecisionWorkspaceMetricDefinition>,
  sourceIds: ReadonlySet<string>,
  label: string,
  errors: string[]
): void {
  if (!observation) return
  const definition = definitions.get(observation.definitionId)
  if (!definition || definition.unit !== observation.unit) {
    errors.push(`${label} has no compatible metric definition.`)
  }
  if (
    observation.sourceIds.length === 0 ||
    observation.sourceIds.some((sourceId) => !sourceIds.has(sourceId))
  ) {
    errors.push(`${label} has invalid source identity.`)
  }
  if (
    typeof observation.value === 'number' &&
    (!Number.isFinite(observation.value) || observation.value < 0)
  ) {
    errors.push(`${label} has an invalid value.`)
  }
}

export function validateDecisionWorkspaceManagementReadModel(
  model: Omit<DecisionWorkspaceManagementReadModel, 'validation'>
): DecisionWorkspaceReadValidation {
  const errors: string[] = []
  const sourceIds = new Set(model.sources.map((source) => source.id))
  const roleIds = new Set(model.agentRoles.map((role) => role.id))
  const capabilityIds = new Set(model.capabilities.map((capability) => capability.id))
  const evidenceIds = new Set(model.evidence.map((evidence) => evidence.id))
  const definitions = new Map(model.metricDefinitions.map((definition) => [definition.id, definition]))
  const stateIds = new Set(model.decisionStates.map((state) => state.id))
  const subjectIds = new Set(model.managedSubjects.map((subject) => subject.id))
  const allEvents = [...model.decisionHistory, ...model.recentActivity]
  const eventIds = new Set(allEvents.map((event) => event.id))

  if (model.schemaVersion !== DECISION_WORKSPACE_READ_SCHEMA_VERSION) {
    errors.push('Decision workspace read schema version must be 1.')
  }
  if (
    !ID.test(model.workspaceType) ||
    !ID.test(model.workflowDefinition.definitionId) ||
    !validText(model.workflowDefinition.version) ||
    !validText(model.runtimeInstanceId) ||
    !validText(model.analysisScopeId)
  ) {
    errors.push('Workspace, workflow, runtime, and analysis identity are required.')
  }
  if (
    sourceIds.size !== model.sources.length ||
    model.sources.some((source) => !ID.test(source.id) || !ID.test(source.providerType))
  ) {
    errors.push('Source identities must be valid and unique.')
  }
  if (
    roleIds.size !== model.agentRoles.length ||
    model.agentRoles.some((role) => !ID.test(role.id) || !validText(role.label))
  ) {
    errors.push('Agent role identities must be valid and unique.')
  }
  if (
    capabilityIds.size !== model.capabilities.length ||
    model.capabilities.some(
      (capability) => !ID.test(capability.id) || !sourceIds.has(capability.sourceId)
    )
  ) {
    errors.push('Capability identities must be valid, unique, and source-backed.')
  }
  if (
    evidenceIds.size !== model.evidence.length ||
    model.evidence.some((evidence) => !ID.test(evidence.id) || !sourceIds.has(evidence.sourceId))
  ) {
    errors.push('Evidence identities must be valid, unique, and source-backed.')
  }
  if (
    definitions.size !== model.metricDefinitions.length ||
    model.metricDefinitions.some(
      (definition) => !ID.test(definition.id) || !validText(definition.unit)
    )
  ) {
    errors.push('Metric definitions must be valid and unique.')
  }
  if (
    stateIds.size !== model.decisionStates.length ||
    model.decisionStates.some(
      (state) =>
        !ID.test(state.id) ||
        !validText(state.label) ||
        !Number.isFinite(state.subjectCount) ||
        state.subjectCount < 0 ||
        state.sourceIds.length === 0 ||
        state.sourceIds.some((sourceId) => !sourceIds.has(sourceId)) ||
        state.evidenceReferences.length === 0 ||
        state.evidenceReferences.some((evidenceId) => !evidenceIds.has(evidenceId)) ||
        (state.lastChangedAt != null && !Number.isFinite(Date.parse(state.lastChangedAt)))
    )
  ) {
    errors.push('Decision-state summaries must have valid identity, counts, sources, evidence, and time.')
  }
  for (const state of model.decisionStates) {
    validateManagementMetricObservation(
      state.activityImpact,
      definitions,
      sourceIds,
      `Decision state ${state.id}`,
      errors
    )
  }
  if (
    model.decisionStates.reduce((total, state) => total + state.subjectCount, 0) !==
    model.managedSubjects.length
  ) {
    errors.push('Decision-state subject totals must equal the managed-subject total.')
  }
  if (subjectIds.size !== model.managedSubjects.length) {
    errors.push('Managed-subject identities must be unique.')
  }
  for (const subject of model.managedSubjects) {
    if (
      !ID.test(subject.id) ||
      !validText(subject.presentationId) ||
      !validText(subject.title) ||
      subject.workflowDefinitionId !== model.workflowDefinition.definitionId ||
      !stateIds.has(subject.decisionStateId) ||
      subject.sourceIds.length === 0 ||
      subject.sourceIds.some((sourceId) => !sourceIds.has(sourceId)) ||
      subject.evidenceReferences.length === 0 ||
      subject.evidenceReferences.some((evidenceId) => !evidenceIds.has(evidenceId)) ||
      !Number.isFinite(Date.parse(subject.decidedAt)) ||
      !Number.isFinite(Date.parse(subject.lastChangedAt)) ||
      subject.historyEventIds.some((eventId) => !eventIds.has(eventId))
    ) {
      errors.push(`Managed subject ${subject.id || '(missing)'} has invalid identity or references.`)
    }
    const execution = subject.execution
    if (
      (execution.sourceId != null && !sourceIds.has(execution.sourceId)) ||
      (execution.capabilityId != null && !capabilityIds.has(execution.capabilityId)) ||
      (execution.observedAt != null && !Number.isFinite(Date.parse(execution.observedAt))) ||
      execution.receiptEvidenceReferences.some((evidenceId) => !evidenceIds.has(evidenceId))
    ) {
      errors.push(`Managed subject ${subject.id || '(missing)'} has invalid execution references.`)
    }
    if (execution.capabilityId && execution.sourceId) {
      const capability = model.capabilities.find((entry) => entry.id === execution.capabilityId)
      if (capability?.sourceId !== execution.sourceId) {
        errors.push(`Managed subject ${subject.id} has a cross-source capability mismatch.`)
      }
    }
    if (
      (execution.status === 'executed' || execution.status === 'reverted') &&
      (!execution.sourceId ||
        !execution.capabilityId ||
        !execution.observedAt ||
        execution.receiptEvidenceReferences.length === 0)
    ) {
      errors.push(`Managed subject ${subject.id} has an unproven provider execution claim.`)
    }
    validateManagementMetricObservation(
      execution.impactMetric,
      definitions,
      sourceIds,
      `Managed subject ${subject.id} execution`,
      errors
    )
  }
  if (eventIds.size !== allEvents.length) errors.push('Decision event identities must be unique.')
  for (const event of allEvents) {
    if (
      !ID.test(event.id) ||
      !subjectIds.has(event.subjectId) ||
      !stateIds.has(event.decisionStateId) ||
      !Number.isFinite(Date.parse(event.occurredAt)) ||
      event.sourceIds.length === 0 ||
      event.sourceIds.some((sourceId) => !sourceIds.has(sourceId)) ||
      event.evidenceReferences.length === 0 ||
      event.evidenceReferences.some((evidenceId) => !evidenceIds.has(evidenceId))
    ) {
      errors.push(`Decision event ${event.id || '(missing)'} has invalid identity or references.`)
    }
  }
  if (
    !Number.isFinite(Date.parse(model.generatedAt)) ||
    !Number.isFinite(Date.parse(model.observedAt)) ||
    !Number.isFinite(Date.parse(model.freshness.asOf)) ||
    !model.quality ||
    !validText(model.provenance.transformationId) ||
    !validText(model.provenance.transformationVersion) ||
    model.provenance.sourceReferences.length === 0 ||
    !validText(model.recommendation.summary)
  ) {
    errors.push('Freshness, quality, recommendation, timestamps, and provenance are required.')
  }
  return { valid: errors.length === 0, errors }
}

export function finalizeDecisionWorkspaceManagementReadModel(
  model: Omit<DecisionWorkspaceManagementReadModel, 'validation'>
): DecisionWorkspaceManagementReadModel {
  const validation = validateDecisionWorkspaceManagementReadModel(model)
  if (validation.valid) return { ...model, validation }
  return {
    ...model,
    quality: { status: 'unavailable', warnings: validation.errors },
    managedSubjects: [],
    decisionHistory: [],
    recentActivity: [],
    recommendation: {
      status: 'unavailable',
      summary: 'Management guidance is unavailable because its read contract failed validation.',
    },
    unavailableReason: 'Managed decision state is unavailable because its read contract failed validation.',
    validation,
  }
}

export function validateDecisionWorkspaceItemOverviewReadModel(
  model: Omit<DecisionWorkspaceItemOverviewReadModel, 'validation'>
): DecisionWorkspaceReadValidation {
  const errors: string[] = []
  const sourceIds = new Set(model.sources.map((source) => source.id))
  const roleIds = new Set(model.agentRoles.map((role) => role.id))
  const definitions = new Map(model.metricDefinitions.map((definition) => [definition.id, definition]))
  const subjectIds = new Set<string>()

  if (model.schemaVersion !== DECISION_WORKSPACE_READ_SCHEMA_VERSION) {
    errors.push('Decision workspace read schema version must be 1.')
  }
  if (
    !ID.test(model.workspaceType) ||
    !ID.test(model.workflowDefinition.definitionId) ||
    !validText(model.workflowDefinition.version) ||
    !validText(model.runtimeInstanceId) ||
    !validText(model.analysisScopeId)
  ) {
    errors.push('Workspace, workflow, runtime, and analysis-scope identity are required.')
  }
  if (
    sourceIds.size !== model.sources.length ||
    model.sources.length === 0 ||
    model.sources.some((source) => !ID.test(source.id) || !ID.test(source.providerType))
  ) {
    errors.push('Source identities must be valid and unique.')
  }
  if (
    roleIds.size !== model.agentRoles.length ||
    model.agentRoles.length === 0 ||
    model.agentRoles.some((role) => !ID.test(role.id) || !validText(role.label))
  ) {
    errors.push('Agent-role identities must be valid and unique.')
  }
  if (
    !ID.test(model.provenance.transformationId) ||
    !validText(model.provenance.transformationVersion) ||
    model.provenance.sourceReferences.length === 0
  ) {
    errors.push('Transformation provenance is required.')
  }
  if (
    !Number.isFinite(Date.parse(model.generatedAt)) ||
    !Number.isFinite(Date.parse(model.observedAt)) ||
    !Number.isFinite(Date.parse(model.freshness.asOf))
  ) {
    errors.push('Generated, observed, and freshness timestamps are required.')
  }
  if (
    !ID.test(model.selectedGroup.id) ||
    !ID.test(model.selectedGroup.presentationId) ||
    !validText(model.selectedGroup.title) ||
    !validText(model.scope.scopeId) ||
    !validText(model.scope.timeZone)
  ) {
    errors.push('Selected-group and scope identity are required.')
  }
  if (
    definitions.size !== model.metricDefinitions.length ||
    model.metricDefinitions.length === 0 ||
    model.metricDefinitions.some((definition) => !ID.test(definition.id) || !validText(definition.unit))
  ) {
    errors.push('Metric definitions must be valid and unique.')
  }

  const validateObservation = (observation: DecisionWorkspaceMetricObservation, owner: string) => {
    const definition = definitions.get(observation.definitionId)
    if (!definition || definition.unit !== observation.unit) {
      errors.push(`${owner} metric ${observation.definitionId} has no compatible definition.`)
    }
    if (
      observation.sourceIds.length === 0 ||
      observation.sourceIds.some((sourceId) => !sourceIds.has(sourceId))
    ) {
      errors.push(`${owner} metric ${observation.definitionId} has invalid source identity.`)
    }
    if (
      typeof observation.value === 'number' &&
      (!Number.isFinite(observation.value) || observation.value < 0)
    ) {
      errors.push(`${owner} metric ${observation.definitionId} has an invalid value.`)
    }
  }

  for (const observation of model.metricObservations) validateObservation(observation, 'Overview')
  for (const subject of model.subjects) {
    if (
      !ID.test(subject.id) ||
      !ID.test(subject.presentationId) ||
      subjectIds.has(subject.id) ||
      !validText(subject.title)
    ) {
      errors.push(`Subject identity ${subject.id} is invalid or duplicated.`)
    }
    subjectIds.add(subject.id)
    if (subject.sourceIds.length === 0 || subject.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) {
      errors.push(`Subject ${subject.id} has invalid source identity.`)
    }
    if (subject.evidenceReferences.length === 0) {
      errors.push(`Subject ${subject.id} requires evidence identity.`)
    }
    for (const observation of subject.metricObservations) {
      validateObservation(observation, `Subject ${subject.id}`)
    }
  }

  if (
    new Set(model.orderedSubjectIds).size !== model.orderedSubjectIds.length ||
    model.orderedSubjectIds.some((subjectId) => !subjectIds.has(subjectId))
  ) {
    errors.push('Ordered subject identity must be unique and reference rendered subjects.')
  }
  if (
    !Number.isInteger(model.pagination.page) ||
    !Number.isInteger(model.pagination.pageSize) ||
    !Number.isInteger(model.pagination.totalSubjects) ||
    !Number.isInteger(model.pagination.totalPages) ||
    model.pagination.page < 1 ||
    model.pagination.pageSize < 1 ||
    model.pagination.totalSubjects < 0 ||
    model.pagination.totalPages < 0 ||
    model.subjects.length > model.pagination.pageSize ||
    model.orderedSubjectIds.length > model.pagination.totalSubjects
  ) {
    errors.push('Item Overview pagination is invalid or contradicts the subject universe.')
  }

  return { valid: errors.length === 0, errors }
}

export function finalizeDecisionWorkspaceItemOverviewReadModel(
  model: Omit<DecisionWorkspaceItemOverviewReadModel, 'validation'>
): DecisionWorkspaceItemOverviewReadModel {
  const validation = validateDecisionWorkspaceItemOverviewReadModel(model)
  if (validation.valid) return { ...model, validation }
  return {
    ...model,
    quality: { status: 'unavailable', warnings: validation.errors },
    orderedSubjectIds: [],
    subjects: [],
    pagination: {
      ...model.pagination,
      totalSubjects: 0,
      totalPages: 0,
    },
    unavailableReason: 'Item Overview is unavailable because its read contract failed validation.',
    validation,
  }
}
