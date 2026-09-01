import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DECISION_WORKSPACE_READ_SCHEMA_VERSION,
  finalizeDecisionWorkspaceActivitySeriesReadModel,
  finalizeDecisionWorkspaceIntelligenceReadModel,
  finalizeDecisionWorkspaceItemOverviewReadModel,
  finalizeDecisionWorkspaceManagementReadModel,
  finalizeDecisionWorkspaceReviewGroupsReadModel,
  validateDecisionWorkspaceActivitySeriesReadModel,
  validateDecisionWorkspaceIntelligenceReadModel,
  validateDecisionWorkspaceItemOverviewReadModel,
  validateDecisionWorkspaceManagementReadModel,
  validateDecisionWorkspaceReviewGroupsReadModel,
} from '../src/lib/runtime/decisionWorkspaceReadModel.ts'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDirectory, '..')

const domains = [
  {
    id: 'gmail',
    workspaceType: 'mailbox_cleanup',
    subject: ['sender', 'senders'],
    activity: ['email', 'emails'],
    sources: [{ id: 'gmail.primary', providerType: 'gmail', role: 'primary' }],
    roles: [{ id: 'mailbox_cleanup_operator', label: 'Mailbox cleanup operator' }],
    unit: 'message',
  },
  {
    id: 'customer_service',
    workspaceType: 'customer_service',
    subject: ['case', 'cases'],
    activity: ['case event', 'case events'],
    sources: [
      { id: 'support.primary', providerType: 'support', role: 'primary' },
      { id: 'chat.supporting', providerType: 'chat', role: 'supporting' },
      { id: 'support_email.supporting', providerType: 'email', role: 'supporting' },
    ],
    roles: [{ id: 'service_operator', label: 'Service operator' }],
    unit: 'case_event',
  },
  {
    id: 'real_estate',
    workspaceType: 'real_estate',
    subject: ['property', 'properties'],
    activity: ['observation', 'observations'],
    sources: [{ id: 'property_market.primary', providerType: 'property_market_data', role: 'primary' }],
    roles: [{ id: 'portfolio_operator', label: 'Portfolio operator' }],
    unit: 'observation',
  },
  {
    id: 'crypto',
    workspaceType: 'crypto_portfolio',
    subject: ['position', 'positions'],
    activity: ['market event', 'market events'],
    sources: [
      { id: 'market.primary', providerType: 'market_data', role: 'primary' },
      { id: 'exchange.supporting', providerType: 'exchange', role: 'supporting' },
    ],
    roles: [{ id: 'portfolio_operator', label: 'Portfolio operator' }],
    unit: 'market_event',
  },
  {
    id: 'paid_media',
    workspaceType: 'paid_media',
    subject: ['campaign', 'campaigns'],
    activity: ['conversion', 'conversions'],
    sources: [
      { id: 'facebook.primary', providerType: 'facebook_ads', role: 'primary' },
      { id: 'google.supporting', providerType: 'google_ads', role: 'supporting' },
      { id: 'tiktok.supporting', providerType: 'tiktok_ads', role: 'supporting' },
      { id: 'email.supporting', providerType: 'email_marketing', role: 'supporting' },
    ],
    roles: [{ id: 'media_operator', label: 'Paid media operator' }],
    unit: 'conversion',
  },
  {
    id: 'bookkeeping',
    workspaceType: 'bookkeeping',
    subject: ['transaction', 'transactions'],
    activity: ['ledger event', 'ledger events'],
    sources: [{ id: 'ledger.primary', providerType: 'bookkeeping_ledger', role: 'primary' }],
    roles: [{ id: 'bookkeeper', label: 'Bookkeeper' }],
    unit: 'ledger_event',
  },
  {
    id: 'tax',
    workspaceType: 'tax_compliance',
    subject: ['tax issue', 'tax issues'],
    activity: ['deadline', 'deadlines'],
    sources: [{ id: 'tax_records.primary', providerType: 'tax_records', role: 'primary' }],
    roles: [{ id: 'tax_reviewer', label: 'Tax reviewer' }],
    unit: 'deadline',
  },
  {
    id: 'purchasing_shipping',
    workspaceType: 'purchasing_shipping',
    subject: ['order', 'orders'],
    activity: ['tracking event', 'tracking events'],
    sources: [
      { id: 'commerce.primary', providerType: 'commerce', role: 'primary' },
      { id: 'spreadsheet.supporting', providerType: 'spreadsheet', role: 'supporting' },
      { id: 'shipping.supporting', providerType: 'shipping', role: 'supporting' },
    ],
    roles: [
      { id: 'purchasing_agent', label: 'Purchasing agent' },
      { id: 'records_agent', label: 'Records agent' },
      { id: 'shipping_agent', label: 'Shipping agent' },
    ],
    unit: 'tracking_event',
  },
]

const itemOverviewTitles = {
  gmail: 'Sender Overview',
  customer_service: 'Case Overview',
  real_estate: 'Property Overview',
  crypto: 'Position Overview',
  paid_media: 'Campaign Overview',
  bookkeeping: 'Transaction Overview',
  tax: 'Compliance Item Overview',
  purchasing_shipping: 'Order & Shipment Overview',
}

const managementStateLabels = {
  gmail: ['Keep', 'Archive'],
  customer_service: ['Resolved', 'Escalated'],
  real_estate: ['Shortlisted', 'Investigate'],
  crypto: ['Hold', 'Reduce'],
  paid_media: ['Scale', 'Pause'],
  bookkeeping: ['Reconciled', 'Flagged'],
  tax: ['Accepted', 'Investigate'],
  purchasing_shipping: ['Purchase approved', 'Fulfillment hold'],
}

function group(config, index, subjectCount = 10, activityCount = 20) {
  const workflowGroupId = `${config.id}.group_${index}`
  const unitId = `${workflowGroupId}::unit_1`
  return {
    id: workflowGroupId,
    workflowGroupId,
    presentationId: workflowGroupId,
    isPresentationSlice: false,
    validationErrors: [],
    title: `${config.subject[1]} group ${index}`,
    canonicalId: workflowGroupId,
    compatibilityIds: [],
    sectionId: index <= 7 ? 'action' : index <= 9 ? 'secondary' : 'context',
    surfaceTier: index <= 7 ? 'featured_parent' : 'secondary',
    surfaceKind: index <= 7 ? 'semantic_parent' : index <= 9 ? 'secondary_candidate' : 'historical_parent',
    subjectCount,
    activityCount,
    sharePct: null,
    whyExists: `Groups ${config.subject[1]} by a stable decision purpose.`,
    laneLabel: index <= 7 ? 'Start here' : index <= 9 ? 'Optional' : 'Reference only',
    startWith: null,
    explanation: `A deterministic ${config.workspaceType} review group.`,
    riskGuidance: 'Review evidence before taking action.',
    safetyGuidance: 'Preserve protected subjects and reversible decisions.',
    dominantSubject: null,
    dominantPattern: null,
    protectedActivityCount: 0,
    uncertainSubjectCount: 0,
    requiresExactUnitTotal: true,
    semanticContextLabel: 'Why these items are together',
    semanticHeadline: `${config.subject[1]} group ${index}`,
    semanticSupport: 'Stable adapter-provided grouping.',
    semanticSupplement: null,
    reviewUnits: [
      {
        id: unitId,
        parentId: workflowGroupId,
        label: `${config.subject[1]} unit ${index}`,
        subjectCount,
        activityCount,
        groupSharePct: 100,
        sourceKind: 'adapter_partition',
        sourceKey: `unit_${index}`,
        decompositionPath: [`group_${index}`, `unit_${index}`],
        unitRole: 'decision_unit',
        basis: 'adapter_defined',
        semanticFamily: `${config.id}_family`,
        semanticSubtype: `unit_${index}`,
        focusKind: 'adapter_partition',
        surfacedSubtypeKeys: [`unit_${index}`],
        reasonKind: null,
        manageabilityState: 'within_target',
        manageabilityLabel: 'Manageable',
        guidance: 'Review this bounded unit.',
        kind: 'subtype',
        tone: 'resolved',
        familySharePct: 100,
        honestyLabel: 'Adapter-backed',
        targetRoute: {
          path: '/agents/[id]/operations/review',
          clusterId: workflowGroupId,
          subsetSource: 'review_unit',
          subsetValue: `unit_${index}`,
        },
      },
    ],
    recommendedReviewUnitId: unitId,
  }
}

function rawModel(config, groups = [group(config, 1)]) {
  const sourceIds = config.sources.map((source) => source.id)
  const primaryGroups = groups.filter((entry) => entry.sectionId !== 'secondary' && entry.sectionId !== 'context')
  const optionalGroups = groups.filter((entry) => entry.sectionId === 'secondary' || entry.sectionId === 'context')
  const recommendationGroup = primaryGroups[0] || null
  const generatedAt = '2026-09-01T00:00:00.000Z'
  return {
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: config.workspaceType,
    workflowDefinition: { definitionId: `${config.id}.workflow`, version: '1' },
    runtimeInstanceId: `${config.id}:fixture`,
    analysisScopeId: 'fixture_scope',
    vocabulary: {
      subjectSingular: config.subject[0],
      subjectPlural: config.subject[1],
      activitySingular: config.activity[0],
      activityPlural: config.activity[1],
    },
    agentRoles: config.roles,
    sources: config.sources,
    generatedAt,
    observedAt: generatedAt,
    freshness: { status: 'fresh', asOf: generatedAt },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: `${config.id}.fixture_adapter`,
      transformationVersion: '1',
      sourceReferences: sourceIds.map((id) => `source:${id}`),
    },
    metricDefinitions: [
      { id: 'subjects_in_scope', valueType: 'count', unit: config.subject[0], aggregation: 'sum' },
      { id: 'activity_impact', valueType: 'count', unit: config.unit, aggregation: 'sum' },
    ],
    metricObservations: [
      {
        definitionId: 'activity_impact',
        value: groups.reduce((sum, entry) => sum + (entry.activityCount || 0), 0),
        unit: config.unit,
        timeBasis: 'fixture_scope',
        sourceIds,
      },
    ],
    loading: false,
    error: null,
    unavailableReason: null,
    hasResolvedIntelligence: true,
    query: '?analysis_scope=fixture_scope',
    sourceGroups: groups,
    groups,
    primaryGroups,
    optionalGroups,
    secondaryGroups: groups.filter((entry) => entry.sectionId === 'secondary'),
    contextGroups: groups.filter((entry) => entry.sectionId === 'context'),
    sections: [],
    sectionSummaries: [],
    intentSnapshots: [],
    progress: { latestGroupId: null, startedGroupCount: 0, startedGroupIds: [] },
    recommendation: {
      reason: recommendationGroup ? 'high_impact_manageable' : 'none',
      group: recommendationGroup,
      groupId: recommendationGroup?.workflowGroupId || null,
      unitId: recommendationGroup?.recommendedReviewUnitId || null,
      rationale: 'Deterministic fixture recommendation.',
      expectedImpact: recommendationGroup?.activityCount || null,
      confidence: recommendationGroup ? 'high' : 'unavailable',
      evidenceReferences: recommendationGroup ? [`review_group:${recommendationGroup.id}`] : [],
    },
    subjectScopeCount: groups.reduce((sum, entry) => sum + (entry.subjectCount || 0), 0),
  }
}

function rawActivitySeries(config) {
  const sourceIds = config.sources.map((source) => source.id)
  const raw = {
    id: `${config.id}.activity_series`,
    metricDefinitionId: 'activity_impact',
    unit: config.unit,
    windowId: 'last_month',
    compatibilityQueryId: 'pressure_window=last_month',
    requestedStartAt: null,
    requestedEndAt: null,
    effectiveStartAt: '2026-08-01T00:00:00.000Z',
    effectiveEndAt: '2026-09-01T00:00:00.000Z',
    timeZone: 'UTC',
    grouping: 'week',
    coverageStartAt: '2026-08-01T00:00:00.000Z',
    coverageEndAt: '2026-09-01T00:00:00.000Z',
    limitedByCoverage: false,
    requiresExplicitZeroBuckets: true,
    buckets: [
      {
        id: `${config.id}.bucket_1`,
        label: 'Aug 1',
        startAt: '2026-08-01T00:00:00.000Z',
        endAt: '2026-08-08T00:00:00.000Z',
        value: 12,
        sourceIds,
        explicitZero: false,
      },
      {
        id: `${config.id}.bucket_2`,
        label: 'Aug 8',
        startAt: '2026-08-08T00:00:00.000Z',
        endAt: '2026-08-15T00:00:00.000Z',
        value: 0,
        sourceIds,
        explicitZero: true,
      },
      {
        id: `${config.id}.bucket_3`,
        label: 'Aug 15',
        startAt: '2026-08-15T00:00:00.000Z',
        endAt: '2026-08-22T00:00:00.000Z',
        value: 8,
        sourceIds,
        explicitZero: false,
      },
    ],
    freshness: { status: 'fresh', asOf: '2026-09-01T00:00:00.000Z' },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: `${config.id}.activity_adapter`,
      transformationVersion: '1',
      sourceReferences: sourceIds.map((id) => `source:${id}`),
    },
  }
  return finalizeDecisionWorkspaceActivitySeriesReadModel(raw, config.sources)
}

function rawIntelligence(config, reviewGroups = finalizeDecisionWorkspaceReviewGroupsReadModel(rawModel(config))) {
  const sourceIds = config.sources.map((source) => source.id)
  return {
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: config.workspaceType,
    workflowDefinition: { definitionId: `${config.id}.workflow`, version: '1' },
    runtimeInstanceId: `${config.id}:fixture`,
    analysisScopeId: 'fixture_scope',
    vocabulary: {
      subjectSingular: config.subject[0],
      subjectPlural: config.subject[1],
      activitySingular: config.activity[0],
      activityPlural: config.activity[1],
    },
    agentRoles: config.roles,
    sources: config.sources,
    generatedAt: '2026-09-01T00:00:00.000Z',
    observedAt: '2026-09-01T00:00:00.000Z',
    freshness: { status: 'fresh', asOf: '2026-09-01T00:00:00.000Z' },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: `${config.id}.intelligence_adapter`,
      transformationVersion: '1',
      sourceReferences: sourceIds.map((id) => `source:${id}`),
    },
    metricDefinitions: [
      { id: 'subjects_in_scope', valueType: 'count', unit: config.subject[0], aggregation: 'sum' },
      { id: 'activity_impact', valueType: 'count', unit: config.unit, aggregation: 'sum' },
      { id: `${config.id}.health_score`, valueType: 'score', unit: 'score_0_100', aggregation: 'latest' },
      { id: 'decisions_made', valueType: 'count', unit: config.subject[0], aggregation: 'sum' },
    ],
    scopeMetrics: [
      { definitionId: 'subjects_in_scope', value: 100, unit: config.subject[0], timeBasis: 'fixture_scope', sourceIds },
      { definitionId: 'activity_impact', value: 20, unit: config.unit, timeBasis: 'fixture_scope', sourceIds },
      { definitionId: 'decisions_made', value: 17, unit: config.subject[0], timeBasis: 'fixture_scope', sourceIds },
    ],
    health: {
      scoreDefinitionId: `${config.id}.health_score`,
      score: 64,
      minimum: 0,
      maximum: 100,
      directionality: 'higher_is_better',
      state: 'stable',
      explanation: `Health reflects the versioned ${config.workspaceType} decision policy.`,
    },
    activitySeries: rawActivitySeries(config),
    lifecycleSignals: {
      awaitingApproval: 3,
      executingOrVerifying: 1,
      failed: 0,
      executedReversible: 4,
      deferredOrUnsupported: 2,
      evidenceReferences: sourceIds.map((id) => `source:${id}:lifecycle`),
    },
    recommendation: {
      id: `${config.id}.recommendation_1`,
      interventionId: `${config.id}.intervention_1`,
      title: `Review the next ${config.subject[0]} group`,
      rationale: 'This group is the strongest bounded opportunity under the published workflow.',
      expectedImpact: `Reduce unresolved ${config.activity[1]}.`,
      confidence: 'high',
      metricDefinitionIds: ['subjects_in_scope', 'activity_impact'],
      evidenceReferences: sourceIds.map((id) => `source:${id}:recommendation`),
      alternatives: ['Continue current work'],
      assumptions: ['Published workflow remains active'],
      navigationTarget: { path: '/agents/[id]/operations/clusters', compatibilityQuery: 'focus_cluster=group_1' },
    },
    workflowProgress: {
      decidedSubjectCount: 17,
      startedGroupCount: 1,
      latestGroupId: reviewGroups.groups[0]?.id || null,
      latestStageId: 'overview',
    },
    reviewGroups,
    loading: false,
    error: null,
    unavailableReason: null,
  }
}

function rawItemOverview(config) {
  const sourceIds = config.sources.map((source) => source.id)
  const generatedAt = '2026-09-01T00:00:00.000Z'
  const metricDefinitions = [
    { id: 'subject_activity', valueType: 'count', unit: config.unit, aggregation: 'sum' },
  ]
  const subjects = [1, 2].map((index) => {
    const id = `${config.id}.subject_${index}`
    return {
      id,
      presentationId: id,
      title: `${config.subject[0]} ${index}`,
      subtitle: `${itemOverviewTitles[config.id]} fixture subject`,
      sourceIds,
      metricObservations: [
        {
          definitionId: 'subject_activity',
          value: index * 10,
          unit: config.unit,
          timeBasis: 'fixture_scope',
          sourceIds,
        },
      ],
      evidenceReferences: sourceIds.map((sourceId) => `source:${sourceId}:subject:${index}`),
      classificationIds: [`${config.id}.classification_${index}`],
      requiresReview: true,
    }
  })
  return {
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: config.workspaceType,
    workflowDefinition: { definitionId: `${config.id}.workflow`, version: '1' },
    runtimeInstanceId: `${config.id}:fixture`,
    analysisScopeId: 'fixture_scope',
    vocabulary: {
      subjectSingular: config.subject[0],
      subjectPlural: config.subject[1],
      activitySingular: config.activity[0],
      activityPlural: config.activity[1],
    },
    agentRoles: config.roles,
    sources: config.sources,
    generatedAt,
    observedAt: generatedAt,
    freshness: { status: 'fresh', asOf: generatedAt },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: `${config.id}.item_overview_adapter`,
      transformationVersion: '1',
      sourceReferences: sourceIds.map((id) => `source:${id}`),
    },
    selectedGroup: {
      id: `${config.id}.group_1`,
      presentationId: `${config.id}.group_1`,
      title: itemOverviewTitles[config.id],
    },
    reviewUnitId: `${config.id}.group_1::unit_1`,
    scope: {
      scopeId: 'fixture_scope',
      windowId: 'last_month',
      timeZone: 'UTC',
      subsetId: `${config.id}.subset_1`,
    },
    metricDefinitions,
    metricObservations: [
      {
        definitionId: 'subject_activity',
        value: 30,
        unit: config.unit,
        timeBasis: 'fixture_scope',
        sourceIds,
      },
    ],
    orderedSubjectIds: subjects.map((subject) => subject.id),
    subjects,
    pagination: { page: 1, pageSize: 25, totalSubjects: 2, totalPages: 1 },
    loading: false,
    error: null,
    unavailableReason: null,
  }
}

function rawManagement(config) {
  const sourceIds = config.sources.map((source) => source.id)
  const generatedAt = '2026-09-01T00:00:00.000Z'
  const workflowDefinitionId = `${config.id}.workflow`
  const labels = managementStateLabels[config.id]
  const stateIds = labels.map((_, index) => `${config.id}.decision_state_${index + 1}`)
  const capabilities = config.sources.map((source, index) => ({
    id: `${config.id}.capability_${index + 1}`,
    sourceId: source.id,
    kind: index === 0 ? 'execute' : 'verify',
    providerSpecific: true,
  }))
  const evidence = [
    ...config.sources.map((source, index) => ({
      id: `${config.id}.evidence_source_${index + 1}`,
      sourceId: source.id,
      kind: 'provider_record',
    })),
    { id: `${config.id}.evidence_receipt`, sourceId: sourceIds[0], kind: 'receipt' },
    { id: `${config.id}.evidence_history_1`, sourceId: sourceIds[0], kind: 'history' },
    { id: `${config.id}.evidence_history_2`, sourceId: sourceIds[1] || sourceIds[0], kind: 'history' },
    { id: `${config.id}.evidence_activity`, sourceId: sourceIds[0], kind: 'activity' },
    { id: `${config.id}.evidence_state_1`, sourceId: sourceIds[0], kind: 'provider_record' },
    { id: `${config.id}.evidence_state_2`, sourceId: sourceIds[1] || sourceIds[0], kind: 'provider_record' },
  ]
  const subjectIds = [`${config.id}.managed_subject_1`, `${config.id}.managed_subject_2`]
  const history = subjectIds.map((subjectId, index) => ({
    id: `${config.id}.history_${index + 1}`,
    subjectId,
    decisionStateId: stateIds[index],
    kind: 'decision',
    occurredAt: `2026-08-${20 + index}T00:00:00.000Z`,
    sourceIds: [sourceIds[index] || sourceIds[0]],
    evidenceReferences: [`${config.id}.evidence_history_${index + 1}`],
  }))
  const managedSubjects = subjectIds.map((id, index) => {
    const sourceId = sourceIds[index] || sourceIds[0]
    return {
      id,
      presentationId: `${config.id}:subject:${index + 1}`,
      title: `${config.subject[0]} ${index + 1}`,
      sourceIds: [sourceId],
      workflowDefinitionId,
      groupId: `${config.id}.managed_group`,
      decisionStateId: stateIds[index],
      reason: `Versioned ${config.workspaceType} fixture decision.`,
      decidedAt: `2026-08-${20 + index}T00:00:00.000Z`,
      lastChangedAt: `2026-08-${20 + index}T00:00:00.000Z`,
      historyEventIds: [history[index].id],
      evidenceReferences: [`${config.id}.evidence_source_${Math.min(index + 1, sourceIds.length)}`],
      execution:
        index === 0
          ? {
              status: 'executed',
              capabilityId: capabilities[0].id,
              sourceId: sourceIds[0],
              observedAt: '2026-08-22T00:00:00.000Z',
              warning: null,
              impactMetric: {
                definitionId: 'managed_activity_impact',
                value: 10,
                unit: config.unit,
                timeBasis: 'fixture_scope',
                sourceIds: [sourceIds[0]],
              },
              receiptEvidenceReferences: [`${config.id}.evidence_receipt`],
            }
          : {
              status: 'deferred',
              capabilityId: null,
              sourceId: null,
              observedAt: null,
              warning: null,
              impactMetric: null,
              receiptEvidenceReferences: [],
            },
    }
  })
  return {
    schemaVersion: DECISION_WORKSPACE_READ_SCHEMA_VERSION,
    workspaceType: config.workspaceType,
    workflowDefinition: { definitionId: workflowDefinitionId, version: '1' },
    runtimeInstanceId: `${config.id}:fixture`,
    analysisScopeId: 'fixture_scope',
    vocabulary: {
      subjectSingular: config.subject[0],
      subjectPlural: config.subject[1],
      activitySingular: config.activity[0],
      activityPlural: config.activity[1],
    },
    agentRoles: config.roles,
    sources: config.sources,
    capabilities,
    generatedAt,
    observedAt: generatedAt,
    freshness: { status: 'fresh', asOf: generatedAt },
    quality: { status: 'verified', warnings: [] },
    provenance: {
      transformationId: `${config.id}.management_adapter`,
      transformationVersion: '1',
      sourceReferences: sourceIds.map((sourceId) => `source:${sourceId}`),
    },
    metricDefinitions: [
      { id: 'managed_activity_impact', valueType: 'count', unit: config.unit, aggregation: 'sum' },
    ],
    evidence,
    decisionStates: labels.map((label, index) => ({
      id: stateIds[index],
      label,
      subjectCount: 1,
      activityImpact: {
        definitionId: 'managed_activity_impact',
        value: (index + 1) * 10,
        unit: config.unit,
        timeBasis: 'fixture_scope',
        sourceIds: [sourceIds[index] || sourceIds[0]],
      },
      lastChangedAt: `2026-08-${20 + index}T00:00:00.000Z`,
      sourceIds: [sourceIds[index] || sourceIds[0]],
      evidenceReferences: [`${config.id}.evidence_state_${index + 1}`],
    })),
    managedSubjects,
    decisionHistory: history,
    recentActivity: [
      {
        id: `${config.id}.activity_1`,
        subjectId: subjectIds[0],
        decisionStateId: stateIds[0],
        kind: 'execution',
        occurredAt: '2026-08-22T00:00:00.000Z',
        sourceIds: [sourceIds[0]],
        evidenceReferences: [`${config.id}.evidence_activity`],
      },
    ],
    recommendation: {
      status: 'informational',
      summary: `Review the managed ${config.subject[1]} using the published workflow.`,
    },
    loading: false,
    error: null,
    unavailableReason: null,
  }
}

for (const config of domains) {
  const model = rawModel(config)
  const validation = validateDecisionWorkspaceReviewGroupsReadModel(model)
  assert.deepEqual(validation.errors, [], `${config.id} should validate through the shared envelope`)
  assert.equal(finalizeDecisionWorkspaceReviewGroupsReadModel(model).validation.valid, true)
  const activitySeries = rawActivitySeries(config)
  assert.equal(activitySeries.validation.valid, true, `${config.id} activity series should validate`)
  assert.equal(activitySeries.buckets[1].value, 0, `${config.id} must preserve explicit zero buckets`)
  const intelligence = rawIntelligence(config)
  assert.deepEqual(
    validateDecisionWorkspaceIntelligenceReadModel(intelligence).errors,
    [],
    `${config.id} intelligence should validate through the shared contract`
  )
  assert.equal(finalizeDecisionWorkspaceIntelligenceReadModel(intelligence).validation.valid, true)
  const itemOverview = rawItemOverview(config)
  assert.deepEqual(
    validateDecisionWorkspaceItemOverviewReadModel(itemOverview).errors,
    [],
    `${config.id} Item Overview should validate through the shared contract`
  )
  assert.equal(finalizeDecisionWorkspaceItemOverviewReadModel(itemOverview).validation.valid, true)
  assert.equal(itemOverview.selectedGroup.title, itemOverviewTitles[config.id])
  const management = rawManagement(config)
  assert.deepEqual(
    validateDecisionWorkspaceManagementReadModel(management).errors,
    [],
    `${config.id} management should validate through the shared contract`
  )
  assert.equal(finalizeDecisionWorkspaceManagementReadModel(management).validation.valid, true)
  assert.deepEqual(management.decisionStates.map((state) => state.label), managementStateLabels[config.id])
}

const paidMedia = rawModel(domains.find((entry) => entry.id === 'paid_media'))
assert.equal(paidMedia.sources.length, 4, 'paid media must preserve four source identities')
assert.deepEqual(paidMedia.metricObservations[0].sourceIds, paidMedia.sources.map((source) => source.id))
const incompatiblePaidMedia = structuredClone(paidMedia)
incompatiblePaidMedia.metricObservations[0].unit = 'currency:usd'
const incompatibleResult = finalizeDecisionWorkspaceReviewGroupsReadModel(incompatiblePaidMedia)
assert.equal(incompatibleResult.validation.valid, false, 'incompatible multi-source metrics must fail closed')
assert.equal(incompatibleResult.groups.length, 0, 'failed validation must expose no review groups')

const shipping = rawModel(domains.find((entry) => entry.id === 'purchasing_shipping'))
assert.equal(shipping.agentRoles.length, 3, 'purchasing/shipping must preserve three agent roles')
assert.equal(shipping.sources.length, 3, 'purchasing/shipping must preserve three source identities')
assert.equal(rawIntelligence(domains.find((entry) => entry.id === 'paid_media')).sources.length, 4)
assert.equal(rawIntelligence(domains.find((entry) => entry.id === 'purchasing_shipping')).agentRoles.length, 3)
assert.equal(rawItemOverview(domains.find((entry) => entry.id === 'paid_media')).sources.length, 4)
assert.equal(rawItemOverview(domains.find((entry) => entry.id === 'purchasing_shipping')).agentRoles.length, 3)
assert.equal(rawManagement(domains.find((entry) => entry.id === 'paid_media')).sources.length, 4)
assert.equal(rawManagement(domains.find((entry) => entry.id === 'purchasing_shipping')).agentRoles.length, 3)
assert.notDeepEqual(
  managementStateLabels.customer_service,
  managementStateLabels.gmail,
  'non-Gmail adapters must own approved domain decision-state labels'
)

const gmailConfig = domains.find((entry) => entry.id === 'gmail')
const gmailCounts = [915, 800, 700, 650, 600, 500, 400, 300, 140, 139]
const gmailGroups = gmailCounts.map((count, index) =>
  group(gmailConfig, index + 1, count, index === 0 ? 75844 : count * 20)
)
const gmailModel = rawModel(gmailConfig, gmailGroups)
assert.equal(gmailModel.primaryGroups.length, 7)
assert.equal(gmailModel.optionalGroups.length, 3)
assert.equal(gmailModel.subjectScopeCount, 5144)
assert.equal(gmailModel.recommendation.group.subjectCount, 915)
assert.equal(gmailModel.recommendation.group.activityCount, 75844)
assert.equal(validateDecisionWorkspaceReviewGroupsReadModel(gmailModel).valid, true)

const corruptions = [
  ['workflow identity', (model) => { model.workflowDefinition.definitionId = '' }],
  ['source identity', (model) => { model.sources[0].id = '' }],
  ['provenance', (model) => { model.provenance.sourceReferences = [] }],
  ['freshness', (model) => { model.freshness.asOf = 'not-a-date' }],
  ['quality', (model) => { model.quality = null }],
  ['metric identity', (model) => { model.metricDefinitions[0].id = '' }],
  ['group identity', (model) => { model.groups[0].id = '' }],
  ['unit identity', (model) => { model.groups[0].reviewUnits[0].id = '' }],
  ['negative count', (model) => { model.groups[0].subjectCount = -1 }],
  ['contradictory child total', (model) => { model.groups[0].reviewUnits[0].subjectCount = 9 }],
]

for (const [label, corrupt] of corruptions) {
  const candidate = structuredClone(rawModel(gmailConfig))
  corrupt(candidate)
  assert.equal(
    finalizeDecisionWorkspaceReviewGroupsReadModel(candidate).groups.length,
    0,
    `${label} must fail closed`
  )
}

const intelligenceCorruptions = [
  ['score range', (model) => { model.health.score = 101 }],
  ['score definition', (model) => { model.health.scoreDefinitionId = '' }],
  ['recommendation evidence', (model) => { model.recommendation.evidenceReferences = [] }],
  ['recommendation metric', (model) => { model.recommendation.metricDefinitionIds = ['missing_metric'] }],
  ['negative lifecycle count', (model) => { model.lifecycleSignals.failed = -1 }],
]
for (const [label, corrupt] of intelligenceCorruptions) {
  const candidate = structuredClone(rawIntelligence(gmailConfig))
  corrupt(candidate)
  const result = finalizeDecisionWorkspaceIntelligenceReadModel(candidate)
  assert.equal(result.validation.valid, false, `${label} must fail closed`)
  assert.equal(result.activitySeries, null, `${label} must expose no activity series`)
  assert.equal(result.recommendation.confidence, 'unavailable', `${label} must expose no recommendation`)
}

const itemOverviewCorruptions = [
  ['duplicate subject identity', (model) => { model.subjects[1].id = model.subjects[0].id }],
  ['missing evidence identity', (model) => { model.subjects[0].evidenceReferences = [] }],
  ['incompatible metric unit', (model) => { model.subjects[0].metricObservations[0].unit = 'currency:usd' }],
  ['invalid source identity', (model) => { model.subjects[0].sourceIds = ['missing.source'] }],
  ['contradictory pagination', (model) => { model.pagination.totalSubjects = 1 }],
]
for (const [label, corrupt] of itemOverviewCorruptions) {
  const candidate = structuredClone(rawItemOverview(gmailConfig))
  corrupt(candidate)
  const result = finalizeDecisionWorkspaceItemOverviewReadModel(candidate)
  assert.equal(result.validation.valid, false, `${label} must fail closed`)
  assert.equal(result.subjects.length, 0, `${label} must expose no actionable subjects`)
}

const managementCorruptions = [
  ['duplicate managed subject', (model) => { model.managedSubjects[1].id = model.managedSubjects[0].id }],
  ['missing state label', (model) => { model.decisionStates[0].label = '' }],
  ['contradictory state total', (model) => { model.decisionStates[0].subjectCount = 2 }],
  ['missing subject evidence', (model) => { model.managedSubjects[0].evidenceReferences = ['missing.evidence'] }],
  ['invalid execution provenance', (model) => { model.managedSubjects[0].execution.receiptEvidenceReferences = [] }],
  ['missing history event', (model) => { model.managedSubjects[0].historyEventIds = ['missing.event'] }],
]
for (const [label, corrupt] of managementCorruptions) {
  const candidate = structuredClone(rawManagement(gmailConfig))
  corrupt(candidate)
  const result = finalizeDecisionWorkspaceManagementReadModel(candidate)
  assert.equal(result.validation.valid, false, `${label} must fail closed`)
  assert.equal(result.managedSubjects.length, 0, `${label} must expose no managed subjects`)
}

const paidMediaManagement = structuredClone(
  rawManagement(domains.find((entry) => entry.id === 'paid_media'))
)
paidMediaManagement.managedSubjects[0].execution.capabilityId = paidMediaManagement.capabilities[1].id
assert.equal(
  finalizeDecisionWorkspaceManagementReadModel(paidMediaManagement).validation.valid,
  false,
  'cross-source provider capabilities must fail closed'
)

const corruptSeries = structuredClone(rawActivitySeries(gmailConfig))
delete corruptSeries.validation
corruptSeries.buckets[1].startAt = '2026-07-01T00:00:00.000Z'
assert.equal(validateDecisionWorkspaceActivitySeriesReadModel(corruptSeries, gmailConfig.sources).valid, false)

const sourceFiles = [
  'src/lib/runtime/decisionWorkspaceReadModel.ts',
  'src/components/runtime/DecisionWorkspaceReadContext.tsx',
  'src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts',
  'src/app/agents/[id]/operations/clusters/page.tsx',
  'src/app/agents/[id]/operations/intelligence/page.tsx',
]
for (const relativePath of sourceFiles) {
  const source = fs.readFileSync(path.join(webRoot, relativePath), 'utf8')
  assert.equal(/\bfetch\s*\(/.test(source), false, `${relativePath} must define zero new requests`)
  assert.equal(/openai|anthropic|generateText|streamText|chat\.completions/i.test(source), false, `${relativePath} must make zero model calls`)
}
const clustersPage = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/clusters/page.tsx'),
  'utf8'
)
assert.equal(/gmailCleanup|GmailMailbox|gmailSemantic|gmailDecisionWorkspaceReadAdapter/.test(clustersPage), false)
const intelligencePage = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/intelligence/page.tsx'),
  'utf8'
)
assert.equal(
  /from ['"]@\/lib\/runtime\/gmailCleanupWorkspace['"]/.test(intelligencePage),
  false,
  'Intelligence page must not import Gmail data/cache/request/draft helpers'
)
assert.equal(/setInterval|poll/i.test(intelligencePage), false, 'Intelligence page must not add polling')

const reviewPage = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/review/page.tsx'),
  'utf8'
)
const managementPage = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/management/page.tsx'),
  'utf8'
)
const gmailAdapter = fs.readFileSync(
  path.join(webRoot, 'src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts'),
  'utf8'
)
const readContext = fs.readFileSync(
  path.join(webRoot, 'src/components/runtime/DecisionWorkspaceReadContext.tsx'),
  'utf8'
)
for (const helper of [
  'readCachedGmailSenderWorkspace',
  'fetchGmailSenderWorkspace',
  'readCachedGmailSenderOverviewWindow',
  'fetchGmailSenderOverviewWindow',
  'buildGmailSenderDistributionCacheKey',
  'readCachedGmailSenderDistribution',
  'fetchGmailSenderDistribution',
  'resolveGmailSenderDistributionAuthorityKeys',
  'buildGmailReviewUnitTimeContextChart',
]) {
  assert.equal(reviewPage.includes(helper), false, `Review page must not import or call ${helper}`)
}
assert.equal(
  (reviewPage.match(/fetch\('\/api\/runtime\/gmail-destinations'/g) || []).length,
  1,
  'The frozen Gmail destination provider action must remain exactly once'
)
assert.equal(reviewPage.includes('fetchGmailDecisionManagementSummary'), false)
assert.equal(managementPage.includes('fetchGmailDecisionManagementSummary'), false)
assert.equal(gmailAdapter.includes('fetchGmailDecisionManagementSummary'), true)
assert.equal(readContext.includes('management: adapter.management'), true)
assert.equal(
  (managementPage.match(/fetch\('\/api\/runtime\/gmail-destinations'/g) || []).length,
  2,
  'The two frozen Gmail management provider actions must remain exactly present'
)
assert.equal(
  (managementPage.match(/await persistGmailCleanupMemoryEvent\(/g) || []).length,
  1,
  'The frozen Gmail reopen-memory helper must remain exactly once'
)
assert.equal(/setInterval\s*\(/.test(managementPage), false, 'Management must not add interval polling')
assert.equal(/setInterval\s*\(/.test(reviewPage), false, 'Item Overview must not add interval polling')
assert.equal(
  /openai|anthropic|generateText|streamText|chat\.completions/i.test(reviewPage),
  false,
  'Item Overview must make zero model calls at render time'
)

console.log('PASS workspace decision read-model fixtures')
console.log(`domains=${domains.length}`)
console.log('gmail=7 main / 3 optional-reference / 5,144 subjects / 915 subjects / 75,844 activities')
console.log('paid_media_sources=4 incompatible_aggregation=fail_closed')
console.log('purchasing_shipping_roles=3 sources=3')
console.log('intelligence_domains=8 activity_series_zero_buckets=preserved fail_closed=verified')
console.log('item_overview_domains=8 titles=domain_adaptive multi_source=preserved multi_role=preserved fail_closed=verified')
console.log('management_domains=8 labels=adapter_owned capabilities=source_bound execution_provenance=verified fail_closed=verified')
console.log('model_calls=0 new_request_definitions=0')
