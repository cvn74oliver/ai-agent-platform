import {
  buildGmailReviewUnitTimeContextChart,
  buildGmailSenderDistributionCacheKey,
  fetchGmailDecisionManagementSummary,
  fetchGmailMailboxIntelligence,
  fetchGmailPressureTrend,
  fetchGmailSenderDistribution,
  fetchGmailSenderOverviewWindow,
  fetchGmailSenderWorkspace,
  gmailCleanupWorkflowDraftHasActiveContent,
  readCachedGmailMailboxIntelligence,
  readCachedGmailPressureTrend,
  readCachedGmailSenderDistribution,
  readCachedGmailSenderOverviewWindow,
  readCachedGmailSenderWorkspace,
  readGmailCleanupWorkflowDraft,
  readLatestCachedGmailMailboxIntelligence,
  primeCachedGmailPressureTrend,
  resolveGmailSenderDistributionAuthorityKeys,
  type GmailCleanupClusterRef,
  type GmailDecisionManagementSummaryData,
  type GmailMailboxIntelligenceData,
  type GmailPressureTrendData,
  type GmailSenderOverviewWindow,
  type GmailSenderWorkspaceFilter,
  type GmailSenderWorkspaceSemanticFocus,
  type GmailSenderWorkspaceSort,
  type GmailSenderWorkspaceSortDirection,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  buildCleanupGroupIntentSnapshotsForUi,
  buildCleanupGroupPresentationPartitions,
  buildCleanupGroupPublishedReviewUnits,
  buildCleanupGroupSectionSummariesForUi,
  buildCleanupGroupSectionsForUi,
  getCleanupGroupDisplayTitle,
  getCleanupGroupLaneLabel,
  getCleanupGroupSection,
  getCleanupGroupStartWith,
  getCleanupGroupSurfaceKind,
  getCleanupGroupSurfaceTier,
  getCleanupGroupWhyExists,
  isCleanupGroupSurfacedInUi,
  recommendArtifactCleanupGroupForUi,
  recommendCleanupGroupForUi,
  recommendCleanupGroupPublishedReviewUnit,
  recommendRuntimeCleanupGroupForUi,
  type CleanupGroupPublishedReviewUnit,
} from '@/lib/runtime/cleanupGroupPresentation'
import {
  buildGmailCleanupPresentationPartitionBlueprints,
  buildGmailSemanticPresentationPolicy,
  gmailCleanupCopyForHumans,
} from '@/lib/runtime/gmailSemanticPresentationPolicy'
import {
  DECISION_WORKSPACE_READ_SCHEMA_VERSION,
  finalizeDecisionWorkspaceManagementReadModel,
  finalizeDecisionWorkspaceReviewGroupsReadModel,
  type DecisionReviewGroupReadModel,
  type DecisionReviewProgressReadModel,
  type DecisionReviewUnitReadModel,
  type DecisionWorkspaceCleanupClusterRef,
  type DecisionWorkspaceIntelligenceData,
  type DecisionWorkspaceIntelligenceGroup,
  type DecisionWorkspaceIntelligenceReadService,
  type DecisionWorkspaceItemOverviewReadService,
  type DecisionWorkspaceManagementEvidenceReadModel,
  type DecisionWorkspaceManagementEventReadModel,
  type DecisionWorkspaceManagementReadService,
  type DecisionWorkspacePressureTrendData,
  type DecisionWorkspaceReadAdapter,
  type DecisionWorkspaceReadAdapterInput,
  type DecisionWorkspaceReviewGroupsReadModel,
} from '@/lib/runtime/decisionWorkspaceReadModel'
import {
  DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
  GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
  MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
} from '@/lib/integrations/gmail/gmailWorkspaceContracts'
import {
  normalizeOperationsAnalysisScope,
  serializeOperationsQuery,
  type OperationsAnalysisScope,
  type OperationsRuntimeData,
} from '@/lib/runtime/operationsWorkspace'

type NativeGroup = {
  workflowGroupId: string
  presentationId: string
  isPresentationSlice: boolean
  validationErrors: string[]
  title: string
  canonicalId: string
  compatibilityIds: string[]
  sectionId: DecisionReviewGroupReadModel['sectionId']
  surfaceTier: DecisionReviewGroupReadModel['surfaceTier']
  surfaceKind: DecisionReviewGroupReadModel['surfaceKind']
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
  reviewUnits: CleanupGroupPublishedReviewUnit[]
}

const EMPTY_PROGRESS: DecisionReviewProgressReadModel = {
  latestGroupId: null,
  startedGroupCount: 0,
  startedGroupIds: [],
}

function normalizedCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return Math.round(value)
}

function toGenericReviewUnit(
  group: Pick<NativeGroup, 'canonicalId'>,
  unit: CleanupGroupPublishedReviewUnit
): DecisionReviewUnitReadModel {
  return {
    id: `${group.canonicalId}::${unit.id}`,
    parentId: group.canonicalId,
    label: unit.label,
    subjectCount: unit.senderCount,
    activityCount: null,
    groupSharePct: unit.groupSharePct,
    sourceKind: unit.sourceKind,
    sourceKey: unit.sourceKey,
    decompositionPath: unit.decompositionPath,
    unitRole: unit.unitRole,
    basis: unit.basis,
    semanticFamily: unit.semanticFamily,
    semanticSubtype: unit.semanticSubtype,
    focusKind: unit.focusKind,
    surfacedSubtypeKeys: unit.surfacedSubtypeKeys,
    reasonKind: unit.reasonKind,
    manageabilityState: unit.targetState,
    manageabilityLabel: unit.targetLabel,
    guidance: unit.guidance,
    kind: unit.kind,
    tone: unit.tone,
    familySharePct: unit.familySharePct,
    honestyLabel: unit.honestyLabel,
    targetRoute: {
      path: '/agents/[id]/operations/review',
      clusterId: group.canonicalId,
      subsetSource: 'review_unit',
      subsetValue: unit.id,
    },
  }
}

function toGenericGroup(group: NativeGroup): DecisionReviewGroupReadModel {
  const reviewUnits = group.reviewUnits.map((unit) => toGenericReviewUnit(group, unit))
  const recommendedNativeUnitId = recommendCleanupGroupPublishedReviewUnit(group.reviewUnits)?.id || null
  return {
    id: group.presentationId,
    workflowGroupId: group.workflowGroupId,
    presentationId: group.presentationId,
    isPresentationSlice: group.isPresentationSlice,
    validationErrors: group.validationErrors,
    title: group.title,
    canonicalId: group.canonicalId,
    compatibilityIds: group.compatibilityIds,
    sectionId: group.sectionId,
    surfaceTier: group.surfaceTier,
    surfaceKind: group.surfaceKind,
    subjectCount: group.subjectCount,
    activityCount: group.activityCount,
    sharePct: group.sharePct,
    whyExists: group.whyExists,
    laneLabel: group.laneLabel,
    startWith: group.startWith,
    explanation: group.explanation,
    riskGuidance: group.riskGuidance,
    safetyGuidance: group.safetyGuidance,
    dominantSubject: group.dominantSubject,
    dominantPattern: group.dominantPattern,
    protectedActivityCount: group.protectedActivityCount,
    uncertainSubjectCount: group.uncertainSubjectCount,
    requiresExactUnitTotal: group.requiresExactUnitTotal,
    semanticContextLabel: group.semanticContextLabel,
    semanticHeadline: group.semanticHeadline,
    semanticSupport: group.semanticSupport,
    semanticSupplement: group.semanticSupplement,
    reviewUnits,
    recommendedReviewUnitId:
      reviewUnits.find((unit) => unit.targetRoute.subsetValue === recommendedNativeUnitId)?.id || null,
  }
}

function buildClusters(runtimeData: OperationsRuntimeData | null): GmailCleanupClusterRef[] {
  return (runtimeData?.runtime_cleanup_plan?.clusters || []).map((cluster) => ({
    clusterId: cluster.cluster_id,
    canonicalClusterId: cluster.canonical_cluster_id,
    legacyClusterIds: cluster.legacy_cluster_ids || [],
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
  }))
}

function resolveIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScopeId: OperationsAnalysisScope
  cacheVersion: string | null
  runtimeData: OperationsRuntimeData | null
}): GmailMailboxIntelligenceData | null {
  if (params.clusters.length === 0) return null
  const cached = readCachedGmailMailboxIntelligence({
    clusters: params.clusters,
    analysisScope: params.analysisScopeId,
    cacheVersion: params.cacheVersion,
  })
  if (cached) return cached
  const runtimeIntelligence = params.runtimeData?.runtime_mailbox_intelligence
  if (
    runtimeIntelligence &&
    runtimeIntelligence.analysis_scope === params.analysisScopeId &&
    runtimeIntelligence.source === 'gmail_index_cache'
  ) {
    return runtimeIntelligence
  }
  return readLatestCachedGmailMailboxIntelligence({
    clusters: params.clusters,
    analysisScope: params.analysisScopeId,
  })
}

function buildNativeGroups(
  clusters: GmailCleanupClusterRef[],
  resolvedIntelligence: GmailMailboxIntelligenceData | null
): { sourceGroups: NativeGroup[]; groups: NativeGroup[] } {
  const fallbackCards = clusters.map((cluster) => ({
    cluster_id: cluster.clusterId,
    cluster_type: cluster.clusterType,
    title: cluster.title,
    query: cluster.query,
    why_selected: cluster.whySelected || 'Grouped by the current cleanup plan.',
    risk_note: cluster.riskNote || 'Review mixed senders carefully before approving bulk archive.',
    safety_note: cluster.safetyNote || 'Sender-first review protects safe traffic while you inspect this group.',
    sender_count: normalizedCount(cluster.senderCount),
    message_count: normalizedCount(cluster.messageCount),
    estimated_count: normalizedCount(cluster.estimatedCount),
  }))
  const sourceGroups = (resolvedIntelligence?.cleanup_groups || fallbackCards)
    .map((group): NativeGroup => {
      const semanticPresentation = buildGmailSemanticPresentationPolicy(
        'semantic_rollup' in group ? group.semantic_rollup : null
      ).cleanupGroupCard
      const semanticSupport = gmailCleanupCopyForHumans(semanticPresentation.support) || semanticPresentation.support
      const semanticSupplement =
        gmailCleanupCopyForHumans(semanticPresentation.semanticSupport) || semanticPresentation.semanticSupport
      const reviewUnits = buildCleanupGroupPublishedReviewUnits(
        group.cluster_id,
        'semantic_rollup' in group ? group.semantic_rollup : null
      )
      const section = getCleanupGroupSection(group.cluster_id)
      return {
        workflowGroupId: group.cluster_id,
        presentationId: group.cluster_id,
        isPresentationSlice: false,
        validationErrors: [],
        title: getCleanupGroupDisplayTitle(group.cluster_id, group.title),
        canonicalId: 'canonical_cluster_id' in group ? group.canonical_cluster_id : group.cluster_id,
        compatibilityIds:
          'legacy_cluster_ids' in group && Array.isArray(group.legacy_cluster_ids)
            ? group.legacy_cluster_ids
            : [],
        sectionId: section.id,
        surfaceTier: getCleanupGroupSurfaceTier(group.cluster_id),
        surfaceKind: getCleanupGroupSurfaceKind(group.cluster_id),
        subjectCount: normalizedCount(group.sender_count),
        activityCount: normalizedCount(group.message_count),
        sharePct: 'share_pct' in group ? group.share_pct : null,
        whyExists: getCleanupGroupWhyExists(group.cluster_id),
        laneLabel: getCleanupGroupLaneLabel(group.cluster_id),
        startWith: getCleanupGroupStartWith(group.cluster_id),
        explanation: gmailCleanupCopyForHumans(group.why_selected) || group.why_selected,
        riskGuidance: gmailCleanupCopyForHumans(group.risk_note) || group.risk_note,
        safetyGuidance: gmailCleanupCopyForHumans(group.safety_note) || group.safety_note,
        dominantSubject: 'dominant_sender' in group ? group.dominant_sender : null,
        dominantPattern: 'dominant_pattern' in group ? group.dominant_pattern : null,
        protectedActivityCount:
          'protected_message_count' in group ? normalizedCount(group.protected_message_count) : null,
        uncertainSubjectCount:
          'uncertain_sender_count' in group ? normalizedCount(group.uncertain_sender_count) : null,
        requiresExactUnitTotal: reviewUnits.length > 0,
        semanticContextLabel:
          gmailCleanupCopyForHumans(semanticPresentation.contextLabel) || semanticPresentation.contextLabel,
        semanticHeadline:
          gmailCleanupCopyForHumans(semanticPresentation.headline) || semanticPresentation.headline,
        semanticSupport,
        semanticSupplement:
          semanticSupplement.toLowerCase() === semanticSupport.toLowerCase() ? null : semanticSupplement,
        reviewUnits,
      }
    })
    .filter((group) => isCleanupGroupSurfacedInUi(group.workflowGroupId))

  const groups = sourceGroups.flatMap((group): NativeGroup[] => {
    const blueprints = buildGmailCleanupPresentationPartitionBlueprints({
      canonicalClusterId: group.canonicalId,
      reviewUnits: group.reviewUnits.map((unit) => ({
        id: unit.id,
        sourceKey: unit.sourceKey,
        sourceKind: unit.sourceKind,
        decompositionPath: unit.decompositionPath,
      })),
    })
    if (!blueprints) return [group]
    const result = buildCleanupGroupPresentationPartitions({
      parentId: group.canonicalId,
      parentSenderCount: group.subjectCount,
      reviewUnits: group.reviewUnits,
      blueprints,
    })
    if (result.errors.length > 0) return [{ ...group, validationErrors: result.errors }]
    return result.partitions.map((partition) => {
      const reviewUnits = partition.reviewUnits.map((unit) => ({
        ...unit,
        groupSharePct:
          partition.senderCount > 0
            ? Math.round((unit.senderCount / partition.senderCount) * 100)
            : 0,
      }))
      return {
        ...group,
        presentationId: `${group.workflowGroupId}::${partition.id}`,
        isPresentationSlice: true,
        validationErrors: [],
        title: partition.title,
        subjectCount: partition.senderCount,
        activityCount: null,
        sharePct: null,
        whyExists: partition.whyExists,
        startWith: partition.startWith,
        explanation: partition.whyExists,
        semanticContextLabel: 'Why these items are together',
        semanticHeadline: partition.title,
        semanticSupport: partition.whyExists,
        semanticSupplement: null,
        reviewUnits,
      }
    })
  })
  return { sourceGroups, groups }
}

function recommendationRationale(reason: DecisionWorkspaceReviewGroupsReadModel['recommendation']['reason']): string {
  if (reason === 'resume_work') return 'Resume the most recently active review group.'
  if (reason === 'small_quick_win') return 'Start with the clearest manageable group.'
  if (reason === 'high_impact_manageable') return 'Start with the highest-impact manageable group.'
  if (reason === 'backlog') return 'Continue with the older-items backlog.'
  return 'No default group is available.'
}

function projectReviewGroups(
  input: DecisionWorkspaceReadAdapterInput,
  progress: DecisionReviewProgressReadModel
): DecisionWorkspaceReviewGroupsReadModel {
  const runtimeData = (input.runtimeData || null) as OperationsRuntimeData | null
  const analysisScope = normalizeOperationsAnalysisScope(input.analysisScopeId)
  const cacheVersion = runtimeData?.runtime_cleanup_plan?.generated_at || null
  const clusters = buildClusters(runtimeData)
  const resolvedIntelligence = resolveIntelligence({
    clusters,
    analysisScopeId: analysisScope,
    cacheVersion,
    runtimeData,
  })
  const native = buildNativeGroups(clusters, resolvedIntelligence)
  const sourceGroups = native.sourceGroups.map(toGenericGroup)
  const groups = native.groups.map(toGenericGroup)
  const primaryGroups = groups.filter((group) => group.sectionId !== 'secondary' && group.sectionId !== 'context')
  const secondaryGroups = groups.filter((group) => group.sectionId === 'secondary')
  const contextGroups = groups.filter((group) => group.sectionId === 'context')
  const optionalGroups = groups.filter((group) => group.sectionId === 'secondary' || group.sectionId === 'context')
  const sections = buildCleanupGroupSectionsForUi(groups, (group) => group.workflowGroupId)
  const sourcePrimaryGroups = sourceGroups.filter(
    (group) => group.sectionId !== 'secondary' && group.sectionId !== 'context'
  )
  const sectionSummaries = buildCleanupGroupSectionSummariesForUi({
    groups: sourcePrimaryGroups,
    getClusterId: (group) => group.workflowGroupId,
    getSenderCount: (group) => group.subjectCount,
    getImpactCount: (group) => group.activityCount,
  }).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    defaultExpanded: section.defaultExpanded,
    groupCount: section.groupCount,
    totalSubjectCount: section.totalSenderCount,
    totalActivityCount: section.totalImpactCount,
  }))
  const intentSnapshots = buildCleanupGroupIntentSnapshotsForUi({
    groups: sourceGroups,
    getClusterId: (group) => group.workflowGroupId,
    getSenderCount: (group) => group.subjectCount,
    getImpactCount: (group) => group.activityCount,
  })
  const recommendationResult = recommendCleanupGroupForUi({
    groups,
    latestClusterId: progress.latestGroupId,
    getClusterId: (group) => group.workflowGroupId,
    getSenderCount: (group) => group.subjectCount,
    getImpactCount: (group) => group.activityCount,
  })
  const recommendedGroup = recommendationResult.group
  const groupedSubjectScope = sourceGroups.reduce((total, group) => total + (group.subjectCount ?? 0), 0)
  const subjectScopeCount =
    groupedSubjectScope > 0
      ? groupedSubjectScope
      : normalizedCount(resolvedIntelligence?.whole_mailbox?.sender_count) ??
        normalizedCount(resolvedIntelligence?.cleanup_candidate_universe?.sender_count) ??
        0
  const generatedAt =
    cacheVersion ||
    new Date(input.observedAt || 0).toISOString()
  const observedAt = new Date(input.observedAt || Date.parse(generatedAt) || 0).toISOString()
  const metricDefinitions = [
    { id: 'subjects_in_scope', valueType: 'count' as const, unit: 'sender', aggregation: 'sum' as const },
    { id: 'activities_in_group', valueType: 'count' as const, unit: 'message', aggregation: 'sum' as const },
  ]
  const metricObservations = [
    {
      definitionId: 'subjects_in_scope',
      value: subjectScopeCount,
      unit: 'sender',
      timeBasis: input.analysisScopeId,
      sourceIds: ['gmail.primary'],
    },
  ]
  return finalizeDecisionWorkspaceReviewGroupsReadModel({
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: 'mailbox_cleanup',
    workflowDefinition: { definitionId: 'builtin.gmail.mailbox_cleanup', version: '1' },
    runtimeInstanceId: input.runtimeSessionId || input.requestedSessionId || `agent:${input.agentId}`,
    analysisScopeId: analysisScope,
    vocabulary: {
      subjectSingular: 'sender',
      subjectPlural: 'senders',
      activitySingular: 'email',
      activityPlural: 'emails',
    },
    agentRoles: [{ id: 'mailbox_cleanup_operator', label: 'Mailbox cleanup operator' }],
    sources: [{ id: 'gmail.primary', providerType: 'gmail', role: 'primary' }],
    generatedAt,
    observedAt,
    freshness: { status: resolvedIntelligence ? 'fresh' : 'unknown', asOf: generatedAt },
    quality: {
      status: clusters.length === 0 ? 'unavailable' : resolvedIntelligence ? 'verified' : 'degraded',
      warnings: resolvedIntelligence ? [] : ['Using the current runtime cleanup snapshot.'],
    },
    provenance: {
      transformationId: 'gmail.review_groups.compatibility_adapter',
      transformationVersion: '1',
      sourceReferences: resolvedIntelligence
        ? ['runtime_cleanup_plan', 'runtime_mailbox_intelligence_or_existing_cache']
        : ['runtime_cleanup_plan'],
    },
    metricDefinitions,
    metricObservations,
    loading: input.loading,
    error: input.error,
    unavailableReason: clusters.length === 0 ? 'No review groups are available yet.' : null,
    hasResolvedIntelligence: Boolean(resolvedIntelligence),
    query: serializeOperationsQuery(
      input.runtimeSessionId || input.requestedSessionId,
      analysisScope
    ),
    sourceGroups,
    groups,
    primaryGroups,
    optionalGroups,
    secondaryGroups,
    contextGroups,
    sections,
    sectionSummaries,
    intentSnapshots,
    progress,
    recommendation: {
      reason: recommendationResult.reason,
      group: recommendedGroup,
      groupId: recommendedGroup?.workflowGroupId || null,
      unitId: recommendedGroup?.recommendedReviewUnitId || null,
      rationale: recommendationRationale(recommendationResult.reason),
      expectedImpact: recommendedGroup?.activityCount ?? null,
      confidence: recommendedGroup ? 'high' : 'unavailable',
      evidenceReferences: recommendedGroup
        ? [`review_group:${recommendedGroup.workflowGroupId}`]
        : [],
    },
    subjectScopeCount,
  })
}

function readReviewGroupsProgress(
  input: DecisionWorkspaceReadAdapterInput,
  model: DecisionWorkspaceReviewGroupsReadModel
): DecisionReviewProgressReadModel {
  if (typeof window === 'undefined' || !input.agentId || model.sourceGroups.length === 0) {
    return EMPTY_PROGRESS
  }
  let startedGroupCount = 0
  let latestGroupId: string | null = null
  let latestUpdatedAt = 0
  const startedGroupIds: string[] = []
  for (const group of model.sourceGroups) {
    const draft = readGmailCleanupWorkflowDraft({
      agentId: input.agentId,
      sessionId: input.runtimeSessionId || input.requestedSessionId || null,
      clusterId: group.workflowGroupId,
      canonicalClusterId: group.canonicalId,
      legacyClusterIds: [...group.compatibilityIds],
      snapshotVersion: model.generatedAt,
    })
    if (!gmailCleanupWorkflowDraftHasActiveContent(draft)) continue
    startedGroupCount += 1
    startedGroupIds.push(group.workflowGroupId)
    if (draft.updatedAt >= latestUpdatedAt) {
      latestUpdatedAt = draft.updatedAt
      latestGroupId = group.workflowGroupId
    }
  }
  return { latestGroupId, startedGroupCount, startedGroupIds }
}

function nativeClusters(
  clusters: readonly DecisionWorkspaceCleanupClusterRef[]
): GmailCleanupClusterRef[] {
  return clusters.map((cluster) => ({
    clusterId: cluster.clusterId,
    canonicalClusterId: cluster.canonicalClusterId,
    legacyClusterIds: cluster.legacyClusterIds ? [...cluster.legacyClusterIds] : undefined,
    sourceClusterIds: cluster.sourceClusterIds ? [...cluster.sourceClusterIds] : undefined,
    clusterType: cluster.clusterType,
    title: cluster.title,
    query: cluster.query,
    whySelected: cluster.whySelected,
    riskNote: cluster.riskNote,
    safetyNote: cluster.safetyNote,
    senderCount: cluster.senderCount,
    messageCount: cluster.messageCount,
    estimatedCount: cluster.estimatedCount,
    surfaceTier: cluster.surfaceTier as GmailCleanupClusterRef['surfaceTier'],
    surfaceKind: cluster.surfaceKind as GmailCleanupClusterRef['surfaceKind'],
    surfaceVisibility: cluster.surfaceVisibility as GmailCleanupClusterRef['surfaceVisibility'],
    topLevelRank: cluster.topLevelRank,
  }))
}

function compatibilityIntelligence(
  data: GmailMailboxIntelligenceData | null
): DecisionWorkspaceIntelligenceData | null {
  return data as unknown as DecisionWorkspaceIntelligenceData | null
}

function compatibilityPressureTrend(
  data: GmailPressureTrendData | null
): DecisionWorkspacePressureTrendData | null {
  return data as unknown as DecisionWorkspacePressureTrendData | null
}

function stableManagementId(prefix: string, value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${prefix}.${(hash >>> 0).toString(36)}`
}

function gmailDecisionStateId(state: string): string {
  return `gmail.decision_state.${state.toLowerCase()}`
}

function gmailExecutionStatus(
  profile: GmailDecisionManagementSummaryData['sender_profiles'][number]
): 'not_applicable' | 'pending' | 'executed' | 'failed' | 'deferred' | 'reverted' {
  if (profile.execution_state === 'pending') return 'pending'
  if (profile.execution_state === 'failed') return 'failed'
  if (profile.execution_state === 'deferred') return 'deferred'
  if (profile.execution_state === 'succeeded') {
    return profile.execution_source === 'reversed' ? 'reverted' : 'executed'
  }
  return 'not_applicable'
}

function projectGmailManagementReadModel(
  agentId: string,
  data: GmailDecisionManagementSummaryData
) {
  const sourceId = 'gmail.primary'
  const workflowDefinitionId = 'gmail.cleanup_management'
  const observedAt = new Date().toISOString()
  const evidence = new Map<string, DecisionWorkspaceManagementEvidenceReadModel>()
  const addEvidence = (
    kind: DecisionWorkspaceManagementEvidenceReadModel['kind'],
    value: string
  ): string => {
    const id = stableManagementId(`gmail.evidence.${kind}`, value)
    evidence.set(id, { id, sourceId, kind })
    return id
  }
  const subjectIds = new Map(
    data.sender_profiles.map((profile) => [
      profile.sender_key,
      stableManagementId('gmail.subject', profile.sender_key),
    ])
  )
  const decisionHistory: DecisionWorkspaceManagementEventReadModel[] = []

  for (const profile of data.sender_profiles) {
    const subjectId = subjectIds.get(profile.sender_key)!
    profile.destination_history.forEach((history, index) => {
      const eventId = stableManagementId(
        'gmail.history',
        `${profile.sender_key}:${history.destination_timestamp}:${history.destination_state}:${history.destination_source}:${index}`
      )
      decisionHistory.push({
        id: eventId,
        subjectId,
        decisionStateId: gmailDecisionStateId(history.destination_state),
        kind: history.destination_source.toLowerCase().includes('revers') ? 'reversal' : 'decision',
        occurredAt: history.destination_timestamp,
        sourceIds: [sourceId],
        evidenceReferences: [addEvidence('history', eventId)],
      })
    })
  }

  const recentActivity = data.recent_decision_activity.flatMap<DecisionWorkspaceManagementEventReadModel>(
    (activity) => {
      const subjectId = subjectIds.get(activity.sender_key)
      if (!subjectId) return []
      const eventId = stableManagementId('gmail.activity', activity.id)
      const source = activity.destination_source.toLowerCase()
      return [{
        id: eventId,
        subjectId,
        decisionStateId: gmailDecisionStateId(activity.destination_state),
        kind: source.includes('restore') || source.includes('revers') ? 'reversal' : activity.execution_state ? 'execution' : 'decision',
        occurredAt: activity.destination_timestamp,
        sourceIds: [sourceId],
        evidenceReferences: [addEvidence('activity', eventId)],
      }]
    }
  )

  const managedSubjects = data.sender_profiles.map((profile) => {
    const subjectId = subjectIds.get(profile.sender_key)!
    const executionStatus = gmailExecutionStatus(profile)
    const executionEvidence =
      executionStatus === 'not_applicable'
        ? []
        : [
            addEvidence(
              'receipt',
              `${profile.sender_key}:${profile.execution_source || profile.execution_state}:${profile.execution_timestamp || profile.last_action_timestamp}`
            ),
            ...(profile.execution_message_ids || []).map((messageId) =>
              addEvidence('receipt', `${profile.sender_key}:message:${messageId}`)
            ),
          ]
    const capabilityId =
      executionStatus === 'not_applicable'
        ? null
        : executionStatus === 'reverted'
          ? 'gmail.archive.restore'
          : 'gmail.archive.execute'
    return {
      id: subjectId,
      presentationId: profile.sender_key,
      title: profile.sender,
      sourceIds: [sourceId],
      workflowDefinitionId,
      groupId: profile.cluster?.canonicalClusterId || profile.cluster?.clusterId || null,
      decisionStateId: gmailDecisionStateId(profile.destination_state),
      reason: profile.destination_reason,
      decidedAt: profile.destination_timestamp,
      lastChangedAt: profile.last_action_timestamp,
      historyEventIds: decisionHistory
        .filter((event) => event.subjectId === subjectId)
        .map((event) => event.id),
      evidenceReferences: [addEvidence('provider_record', `profile:${profile.sender_key}`)],
      execution: {
        status: executionStatus,
        capabilityId,
        sourceId: capabilityId ? sourceId : null,
        observedAt: profile.execution_timestamp,
        warning: profile.execution_warning,
        impactMetric:
          profile.execution_message_count == null
            ? null
            : {
                definitionId: 'managed_activity_impact',
                value: profile.execution_message_count,
                unit: 'message',
                timeBasis: 'execution_observation',
                sourceIds: [sourceId],
              },
        receiptEvidenceReferences: executionEvidence,
      },
    } as const
  })

  const decisionStates = data.destination_summaries.map((summary) => ({
    id: gmailDecisionStateId(summary.state),
    label: summary.label,
    subjectCount: summary.sender_count,
    activityImpact: {
      definitionId: 'managed_activity_impact',
      value: summary.supporting_message_count,
      unit: 'message',
      timeBasis: 'managed_decisions',
      sourceIds: [sourceId],
    },
    lastChangedAt: summary.latest_destination_timestamp,
    sourceIds: [sourceId],
    evidenceReferences: [addEvidence('provider_record', `summary:${summary.state}`)],
  }))

  return finalizeDecisionWorkspaceManagementReadModel({
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: 'mailbox_cleanup',
    workflowDefinition: { definitionId: workflowDefinitionId, version: '1' },
    runtimeInstanceId: `gmail:${agentId}`,
    analysisScopeId: 'managed_decisions',
    vocabulary: {
      subjectSingular: 'sender',
      subjectPlural: 'senders',
      activitySingular: 'email',
      activityPlural: 'emails',
    },
    agentRoles: [{ id: 'mailbox_cleanup_operator', label: 'Mailbox cleanup operator' }],
    sources: [{ id: sourceId, providerType: 'gmail', role: 'primary' }],
    capabilities: [
      { id: 'gmail.archive.execute', sourceId, kind: 'execute', providerSpecific: true },
      { id: 'gmail.archive.restore', sourceId, kind: 'reverse', providerSpecific: true },
      { id: 'gmail.execution.verify', sourceId, kind: 'verify', providerSpecific: true },
    ],
    generatedAt: observedAt,
    observedAt,
    freshness: { status: 'fresh', asOf: observedAt },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: 'gmail.decision_management_read_adapter',
      transformationVersion: '1',
      sourceReferences: ['gmail_memory:decision_management'],
    },
    metricDefinitions: [
      { id: 'managed_activity_impact', valueType: 'count', unit: 'message', aggregation: 'sum' },
    ],
    evidence: [...evidence.values()],
    decisionStates,
    managedSubjects,
    decisionHistory,
    recentActivity,
    recommendation: {
      status: 'deferred',
      summary: data.recommendation_summary.summary,
    },
    loading: false,
    error: null,
    unavailableReason: null,
  })
}

const management: DecisionWorkspaceManagementReadService = {
  async readSummary(params) {
    const result = await fetchGmailDecisionManagementSummary(params)
    if (!result.ok) return result
    return {
      ok: true,
      data: {
        model: projectGmailManagementReadModel(params.agentId, result.data),
        compatibilityValue: { providerType: 'gmail', value: result.data },
      },
    }
  },
}

const intelligence: DecisionWorkspaceIntelligenceReadService = {
  readCachedIntelligence(params) {
    return compatibilityIntelligence(
      readCachedGmailMailboxIntelligence({
        clusters: nativeClusters(params.clusters),
        analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
        cacheVersion: params.cacheVersion,
      })
    )
  },
  readLatestStableIntelligence(params) {
    return compatibilityIntelligence(
      readLatestCachedGmailMailboxIntelligence({
        clusters: nativeClusters(params.clusters),
        analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      })
    )
  },
  async fetchIntelligence(params) {
    const result = await fetchGmailMailboxIntelligence({
      clusters: nativeClusters(params.clusters),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      initialPressureWindow: params.initialPressureWindow,
      initialPressureStart: params.initialPressureStart,
      initialPressureEnd: params.initialPressureEnd,
      initialTimeZone: params.initialTimeZone,
      requestContext: params.requestContext as Parameters<typeof fetchGmailMailboxIntelligence>[0]['requestContext'],
    })
    return result.ok
      ? { ok: true, data: compatibilityIntelligence(result.data) as DecisionWorkspaceIntelligenceData }
      : result
  },
  readCachedActivitySeries(params) {
    return compatibilityPressureTrend(
      readCachedGmailPressureTrend({
        clusters: nativeClusters(params.clusters),
        cacheVersion: params.cacheVersion,
        pressureWindow: params.pressureWindow,
        pressureStart: params.pressureStart,
        pressureEnd: params.pressureEnd,
        timeZone: params.timeZone,
      })
    )
  },
  primeCachedActivitySeries(params) {
    primeCachedGmailPressureTrend({
      clusters: nativeClusters(params.clusters),
      cacheVersion: params.cacheVersion,
      pressureWindow: params.pressureWindow,
      pressureStart: params.pressureStart,
      pressureEnd: params.pressureEnd,
      timeZone: params.timeZone,
      data: params.data as unknown as GmailPressureTrendData,
    })
  },
  async fetchActivitySeries(params) {
    const result = await fetchGmailPressureTrend({
      clusters: nativeClusters(params.clusters),
      cacheVersion: params.cacheVersion,
      pressureWindow: params.pressureWindow,
      pressureStart: params.pressureStart,
      pressureEnd: params.pressureEnd,
      timeZone: params.timeZone,
      requestContext: params.requestContext as Parameters<typeof fetchGmailPressureTrend>[0]['requestContext'],
      signal: params.signal,
    })
    return result.ok
      ? { ok: true, data: compatibilityPressureTrend(result.data) as DecisionWorkspacePressureTrendData }
      : result
  },
  readWorkflowProgress(params) {
    let decidedSenderCount = 0
    let startedClusterCount = 0
    let latestClusterId: string | null = null
    let latestStage: string | null = null
    let latestUpdatedAt = 0
    for (const cluster of params.clusters) {
      const draft = readGmailCleanupWorkflowDraft({
        agentId: params.agentId,
        sessionId: params.sessionId,
        clusterId: cluster.clusterId,
        canonicalClusterId: cluster.canonicalClusterId,
        legacyClusterIds: cluster.legacyClusterIds ? [...cluster.legacyClusterIds] : undefined,
        snapshotVersion: params.cacheVersion,
      })
      if (!gmailCleanupWorkflowDraftHasActiveContent(draft)) continue
      decidedSenderCount += Object.keys(draft.senderPolicies || {}).length
      startedClusterCount += 1
      if (draft.updatedAt >= latestUpdatedAt) {
        latestUpdatedAt = draft.updatedAt
        latestClusterId = cluster.canonicalClusterId || cluster.clusterId
        latestStage = draft.currentStage
      }
    }
    return { decidedSenderCount, startedClusterCount, latestClusterId, latestStage }
  },
  async readManagementSignals(params) {
    const result = await fetchGmailDecisionManagementSummary(params)
    if (!result.ok) return null
    return {
      managedSenderCount: new Set(result.data.sender_profiles.map((profile) => profile.sender_key)).size,
      archiveVerificationCount: result.data.sender_profiles.filter(
        (profile) =>
          profile.destination_state === 'ARCHIVE' &&
          (profile.execution_state === 'deferred' || profile.execution_state === 'pending')
      ).length,
      archiveFailureCount: result.data.sender_profiles.filter(
        (profile) => profile.destination_state === 'ARCHIVE' && profile.execution_state === 'failed'
      ).length,
      quarantineCount:
        result.data.destination_summaries.find((summary) => summary.state === 'QUARANTINE')
          ?.sender_count || 0,
      customRuleCount:
        result.data.destination_summaries.find((summary) => summary.state === 'CUSTOM_RULE')
          ?.sender_count || 0,
      recentRestoreCount: result.data.recent_decision_activity.filter((activity) => {
        const source = activity.destination_source.toLowerCase()
        const reason = activity.destination_reason?.toLowerCase() || ''
        return source.includes('restore') || source.includes('reversed') || reason.includes('restore')
      }).length,
    }
  },
  recommendArtifactReviewGroup(params) {
    const result = recommendArtifactCleanupGroupForUi({
      groups: params.groups as unknown as GmailMailboxIntelligenceData['cleanup_groups'],
      latestClusterId: params.latestClusterId,
    })
    return {
      group: result.group as unknown as DecisionWorkspaceIntelligenceGroup | null,
      reason: result.reason,
    }
  },
  recommendRuntimeReviewGroup(params) {
    const result = recommendRuntimeCleanupGroupForUi({
      groups: nativeClusters(params.groups),
      latestClusterId: params.latestClusterId,
    })
    return {
      group: result.group as unknown as DecisionWorkspaceCleanupClusterRef | null,
      reason: result.reason,
    }
  },
}

function nativeCluster(cluster: DecisionWorkspaceCleanupClusterRef): GmailCleanupClusterRef {
  return nativeClusters([cluster])[0]
}

const itemOverview: DecisionWorkspaceItemOverviewReadService = {
  capabilities: {
    defaultPageSize: DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
    decisionQueuePageSize: GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
    maximumPageSize: MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
  },
  readCachedWorkspace(params) {
    return readCachedGmailSenderWorkspace({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      includeClusterSenderKeys: params.includeOrderedSubjectIds,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      filter: params.filter as GmailSenderWorkspaceFilter | undefined,
      sort: params.sort as GmailSenderWorkspaceSort | undefined,
      direction: params.direction as GmailSenderWorkspaceSortDirection | undefined,
      semanticFocus: params.semanticFocus as GmailSenderWorkspaceSemanticFocus | null | undefined,
      reviewUnitId: params.reviewUnitId,
      previewEvidenceSenderKey: params.previewEvidenceSubjectId,
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindow: params.overviewWindow as GmailSenderOverviewWindow | null | undefined,
      senderOverviewStart: params.overviewStart,
      senderOverviewEnd: params.overviewEnd,
      timeZone: params.timeZone,
    })
  },
  async fetchWorkspace(params) {
    return fetchGmailSenderWorkspace({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      includeClusterSenderKeys: params.includeOrderedSubjectIds,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      filter: params.filter as GmailSenderWorkspaceFilter | undefined,
      sort: params.sort as GmailSenderWorkspaceSort | undefined,
      direction: params.direction as GmailSenderWorkspaceSortDirection | undefined,
      semanticFocus: params.semanticFocus as GmailSenderWorkspaceSemanticFocus | null | undefined,
      reviewUnitId: params.reviewUnitId,
      expectedReviewUnitSenderCount: params.expectedReviewUnitSubjectCount,
      previewEvidenceSenderKey: params.previewEvidenceSubjectId,
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindow: params.overviewWindow as GmailSenderOverviewWindow | null | undefined,
      senderOverviewStart: params.overviewStart,
      senderOverviewEnd: params.overviewEnd,
      timeZone: params.timeZone,
      requestContext: params.requestContext,
      signal: params.signal,
    })
  },
  readCachedWindow(params) {
    return readCachedGmailSenderOverviewWindow({
      selectedCluster: nativeCluster(params.selectedGroup),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      reviewUnitId: params.reviewUnitId,
      pressureWindow: params.windowId as GmailSenderOverviewWindow,
      pressureStart: params.startAt,
      pressureEnd: params.endAt,
      timeZone: params.timeZone,
    })
  },
  async fetchWindow(params) {
    return fetchGmailSenderOverviewWindow({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      reviewUnitId: params.reviewUnitId,
      pressureWindow: params.windowId as GmailSenderOverviewWindow,
      pressureStart: params.startAt,
      pressureEnd: params.endAt,
      timeZone: params.timeZone,
      requestContext: params.requestContext,
      signal: params.signal,
    })
  },
  buildDistributionRequestKey(params) {
    return buildGmailSenderDistributionCacheKey({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion?.trim() || 'default',
      semanticFocus: params.semanticFocus as GmailSenderWorkspaceSemanticFocus | null | undefined,
      reviewUnitId: params.reviewUnitId,
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindow: params.overviewWindow as GmailSenderOverviewWindow | null | undefined,
      senderOverviewStart: params.overviewStart,
      senderOverviewEnd: params.overviewEnd,
      timeZone: params.timeZone,
    })
  },
  readCachedDistribution(params) {
    return readCachedGmailSenderDistribution({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      semanticFocus: params.semanticFocus as GmailSenderWorkspaceSemanticFocus | null | undefined,
      reviewUnitId: params.reviewUnitId,
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindow: params.overviewWindow as GmailSenderOverviewWindow | null | undefined,
      senderOverviewStart: params.overviewStart,
      senderOverviewEnd: params.overviewEnd,
      timeZone: params.timeZone,
      expectedSenderKeys: params.expectedSubjectIds ? [...params.expectedSubjectIds] : undefined,
    })
  },
  async fetchDistribution(params) {
    return fetchGmailSenderDistribution({
      selectedCluster: nativeCluster(params.selectedGroup),
      allClusters: nativeClusters(params.allGroups),
      analysisScope: normalizeOperationsAnalysisScope(params.analysisScopeId),
      cacheVersion: params.cacheVersion,
      semanticFocus: params.semanticFocus as GmailSenderWorkspaceSemanticFocus | null | undefined,
      reviewUnitId: params.reviewUnitId,
      timeContextBucketLabel: params.timeContextBucketLabel,
      timeContextBucketStartAt: params.timeContextBucketStartAt,
      timeContextBucketEndExclusiveAt: params.timeContextBucketEndExclusiveAt,
      senderOverviewWindow: params.overviewWindow as GmailSenderOverviewWindow | null | undefined,
      senderOverviewStart: params.overviewStart,
      senderOverviewEnd: params.overviewEnd,
      timeZone: params.timeZone,
      expectedSenderKeys: params.expectedSubjectIds ? [...params.expectedSubjectIds] : undefined,
      requestContext: params.requestContext,
      signal: params.signal,
    })
  },
  resolveDistributionAuthoritySubjectIds(params) {
    return resolveGmailSenderDistributionAuthorityKeys({
      reviewUnitActive: params.reviewUnitActive,
      responseReady: params.responseReady,
      responseSenderKeys: [...params.responseSubjectIds],
      fallbackSenderKeys: [...params.fallbackSubjectIds],
    })
  },
  buildReviewUnitActivitySeries(projection) {
    return buildGmailReviewUnitTimeContextChart(
      projection as Parameters<typeof buildGmailReviewUnitTimeContextChart>[0]
    )
  },
}

export const gmailDecisionWorkspaceReadAdapter: DecisionWorkspaceReadAdapter = {
  id: 'gmail',
  intelligence,
  itemOverview,
  management,
  projectReviewGroups,
  readReviewGroupsProgress,
}
