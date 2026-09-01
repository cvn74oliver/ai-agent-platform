import assert from 'node:assert/strict'
import {
  decisionMetricsAreCrossSourceCompatible,
  defineDecisionWorkspaceContract,
  validateDecisionWorkspaceActionExecution,
  validateDecisionWorkspaceContract,
  validateDecisionWorkspaceHumanDecision,
  validateDecisionWorkspaceRecommendation,
} from '../src/lib/runtime/decisionWorkspaceContract.ts'
import { gmailCleanupDecisionWorkflowBlueprint } from '../src/lib/integrations/gmail/gmailReviewUnitContract.ts'

const evidencePolicy = {
  requiresSourceRecord: true,
  requiresObservedAt: true,
  requiresIngestedAt: true,
  requiresFreshness: true,
  requiresQuality: true,
  requiresTransformationVersion: true,
}

const recommendationPolicy = {
  requiresRationale: true,
  requiresEvidence: true,
  requiresConfidence: true,
  requiresExpectedImpact: true,
  supportsAlternatives: true,
  requiresExpiryOrReevaluation: true,
}

const governance = {
  proprietaryBrain: {
    kind: 'versioned_knowledge_and_memory',
    ownership: 'tenant',
    privacy: 'private',
    provenance: 'required',
    feedbackCapture: 'required',
    foundationModelTraining: 'excluded',
  },
  sharedLearning: 'disabled',
  auditTrail: 'required',
  sopVersionReference: 'required',
}

const sizing = { targetMin: 25, targetMax: 200, hardMax: 400 }

function countMetric(id, label, unit, compatibilityKey) {
  return {
    id,
    label,
    valueType: 'count',
    unit,
    aggregation: 'sum',
    direction: 'context_only',
    timeBasis: 'event_time',
    crossSource: compatibilityKey
      ? { mode: 'compatible_key', compatibilityKey }
      : { mode: 'same_definition_only' },
  }
}

function currencyMetric(id, label, compatibilityKey, direction = 'context_only') {
  return {
    id,
    label,
    valueType: 'currency',
    unit: 'USD',
    aggregation: 'sum',
    direction,
    timeBasis: 'interval',
    crossSource: { mode: 'compatible_key', compatibilityKey },
  }
}

function decisionAction(id, label) {
  return {
    id,
    label,
    capability: `decision.${id}`,
    effect: 'decision_only',
    risk: 'low',
    reversibility: 'not_applicable',
    approval: 'none',
    supportsPreview: false,
    idempotencyRequired: false,
  }
}

function providerAction({ id, label, capability, risk = 'medium', approval = 'policy' }) {
  return {
    id,
    label,
    capability,
    effect: 'provider_write',
    risk,
    reversibility: 'compensating_action',
    approval,
    supportsPreview: true,
    idempotencyRequired: true,
  }
}

function defineReferenceContract({
  workspaceType,
  workflowId,
  sources,
  universe,
  subject,
  activity,
  metrics,
  entityLinks = [],
  evidenceKinds,
  actions,
  dimensions,
}) {
  return defineDecisionWorkspaceContract({
    schemaVersion: 1,
    workspaceType,
    workflowId,
    workflowDefinition: {
      definitionId: `reference.${workspaceType}.${workflowId}`,
      version: '1',
      source: 'automation_published',
      publicationStatus: 'published',
    },
    sources,
    universe,
    decisionSubject: subject,
    activity,
    metrics,
    entityLinks,
    evidenceKinds,
    evidencePolicy,
    recommendationPolicy,
    actions,
    reviewUnits: { dimensions, sizing },
    governance,
  })
}

const gmail = gmailCleanupDecisionWorkflowBlueprint('subtype-first')

const customerService = defineReferenceContract({
  workspaceType: 'customer_service',
  workflowId: 'case_resolution',
  sources: [
    {
      id: 'zendesk.primary',
      providerType: 'zendesk',
      role: 'primary',
      requiredCapabilities: ['support.resolve_case', 'support.issue_refund'],
    },
    {
      id: 'live_chat.supporting',
      providerType: 'live_chat',
      role: 'supporting',
      requiredCapabilities: [],
    },
    {
      id: 'support_email.supporting',
      providerType: 'support_email',
      role: 'supporting',
      requiredCapabilities: [],
    },
  ],
  universe: { type: 'support_queue', label: 'Customer support queue' },
  subject: { type: 'case', singularLabel: 'Case', pluralLabel: 'Cases' },
  activity: {
    type: 'case_event',
    singularLabel: 'Case event',
    pluralLabel: 'Case events',
    occurredAtField: 'occurred_at',
    primaryMetricId: 'case_event_count',
  },
  metrics: [countMetric('case_event_count', 'Case activity', 'events')],
  entityLinks: [
    {
      id: 'case_to_customer',
      fromSubjectType: 'case',
      toSubjectType: 'customer',
      cardinality: 'many_to_one',
      authority: 'source_record',
      conflictPolicy: 'fail_closed',
    },
  ],
  evidenceKinds: ['conversation', 'customer_history', 'refund_policy', 'service_sla'],
  actions: [
    decisionAction('escalate', 'Escalate'),
    providerAction({
      id: 'resolve',
      label: 'Resolve case',
      capability: 'support.resolve_case',
    }),
    providerAction({
      id: 'refund',
      label: 'Issue refund',
      capability: 'support.issue_refund',
      risk: 'high',
      approval: 'always',
    }),
  ],
  dimensions: ['urgency', 'issue_type', 'refund_risk'],
})

const realEstate = defineReferenceContract({
  workspaceType: 'investments',
  workflowId: 'real_estate_scouting',
  sources: [
    {
      id: 'property_market.primary',
      providerType: 'property_market_data',
      role: 'primary',
      requiredCapabilities: ['property.request_diligence'],
    },
  ],
  universe: { type: 'opportunity_pipeline', label: 'Property opportunity pipeline' },
  subject: { type: 'property', singularLabel: 'Property', pluralLabel: 'Properties' },
  activity: {
    type: 'market_observation',
    singularLabel: 'Market observation',
    pluralLabel: 'Market observations',
    occurredAtField: 'observed_at',
    primaryMetricId: 'market_observation_count',
  },
  metrics: [countMetric('market_observation_count', 'Market observations', 'observations')],
  evidenceKinds: ['valuation', 'cash_flow', 'location', 'inspection', 'financing'],
  actions: [
    decisionAction('shortlist', 'Shortlist'),
    providerAction({
      id: 'request_diligence',
      label: 'Request due diligence',
      capability: 'property.request_diligence',
    }),
  ],
  dimensions: ['market', 'strategy', 'risk'],
})

const crypto = defineReferenceContract({
  workspaceType: 'investments',
  workflowId: 'crypto_portfolio',
  sources: [
    {
      id: 'market_data.primary',
      providerType: 'crypto_market_data',
      role: 'primary',
      requiredCapabilities: [],
    },
    {
      id: 'exchange.execution',
      providerType: 'crypto_exchange',
      role: 'supporting',
      requiredCapabilities: ['portfolio.rebalance'],
    },
  ],
  universe: { type: 'portfolio', label: 'Crypto portfolio' },
  subject: { type: 'position', singularLabel: 'Position', pluralLabel: 'Positions' },
  activity: {
    type: 'position_observation',
    singularLabel: 'Position observation',
    pluralLabel: 'Position observations',
    occurredAtField: 'observed_at',
    primaryMetricId: 'position_observation_count',
  },
  metrics: [countMetric('position_observation_count', 'Position observations', 'observations')],
  evidenceKinds: ['liquidity', 'risk', 'allocation', 'market_signal', 'thesis'],
  actions: [
    decisionAction('monitor', 'Monitor'),
    providerAction({
      id: 'rebalance',
      label: 'Rebalance position',
      capability: 'portfolio.rebalance',
      risk: 'high',
      approval: 'always',
    }),
  ],
  dimensions: ['risk', 'strategy', 'liquidity'],
})

const paidMedia = defineReferenceContract({
  workspaceType: 'paid_media',
  workflowId: 'campaign_optimization',
  sources: ['facebook_ads', 'google_ads', 'tiktok_ads', 'email_ad_buying'].map(
    (providerType, index) => ({
      id: `${providerType}.${index === 0 ? 'primary' : 'supporting'}`,
      providerType,
      role: index === 0 ? 'primary' : 'supporting',
      requiredCapabilities: ['ads.update_delivery'],
    })
  ),
  universe: { type: 'campaign_portfolio', label: 'Paid media portfolio' },
  subject: { type: 'campaign', singularLabel: 'Campaign', pluralLabel: 'Campaigns' },
  activity: {
    type: 'delivery_interval',
    singularLabel: 'Delivery interval',
    pluralLabel: 'Delivery intervals',
    occurredAtField: 'interval_started_at',
    primaryMetricId: 'spend_usd',
  },
  metrics: [
    currencyMetric('spend_usd', 'Spend', 'paid_media.spend.usd', 'lower_is_better'),
    currencyMetric('attributed_revenue_usd', 'Attributed revenue', 'paid_media.revenue.usd', 'higher_is_better'),
  ],
  evidenceKinds: ['spend', 'conversion', 'attribution', 'creative', 'audience'],
  actions: [
    decisionAction('observe', 'Keep observing'),
    providerAction({
      id: 'change_delivery',
      label: 'Pause or scale',
      capability: 'ads.update_delivery',
      risk: 'high',
      approval: 'always',
    }),
  ],
  dimensions: ['channel', 'objective', 'performance_band'],
})

const bookkeeping = defineReferenceContract({
  workspaceType: 'finance',
  workflowId: 'bookkeeping_review',
  sources: [
    {
      id: 'ledger.primary',
      providerType: 'bookkeeping_ledger',
      role: 'primary',
      requiredCapabilities: ['ledger.categorize_transaction'],
    },
  ],
  universe: { type: 'company_books', label: 'Company books' },
  subject: { type: 'transaction', singularLabel: 'Transaction', pluralLabel: 'Transactions' },
  activity: {
    type: 'ledger_entry',
    singularLabel: 'Ledger entry',
    pluralLabel: 'Ledger entries',
    occurredAtField: 'posted_at',
    primaryMetricId: 'transaction_count',
  },
  metrics: [countMetric('transaction_count', 'Transactions', 'transactions')],
  evidenceKinds: ['account', 'merchant', 'receipt', 'category', 'anomaly'],
  actions: [
    decisionAction('escalate', 'Escalate'),
    providerAction({
      id: 'categorize',
      label: 'Categorize transaction',
      capability: 'ledger.categorize_transaction',
    }),
  ],
  dimensions: ['review_reason', 'account', 'materiality'],
})

const tax = defineReferenceContract({
  workspaceType: 'finance',
  workflowId: 'tax_compliance_review',
  sources: [
    {
      id: 'tax_records.primary',
      providerType: 'tax_accounting',
      role: 'primary',
      requiredCapabilities: [],
    },
  ],
  universe: { type: 'tax_file', label: 'Tax file' },
  subject: { type: 'tax_issue', singularLabel: 'Tax issue', pluralLabel: 'Tax issues' },
  activity: {
    type: 'compliance_observation',
    singularLabel: 'Compliance observation',
    pluralLabel: 'Compliance observations',
    occurredAtField: 'observed_at',
    primaryMetricId: 'compliance_observation_count',
  },
  metrics: [
    countMetric('compliance_observation_count', 'Compliance observations', 'observations'),
  ],
  evidenceKinds: ['tax_year', 'documentation', 'classification', 'rule', 'deadline'],
  actions: [decisionAction('review', 'Review with accountant')],
  dimensions: ['tax_year', 'issue_type', 'risk'],
})

for (const contract of [gmail, customerService, realEstate, crypto, paidMedia, bookkeeping, tax]) {
  assert.deepEqual(validateDecisionWorkspaceContract(contract).errors, [])
  assert.equal(contract.governance.proprietaryBrain.foundationModelTraining, 'excluded')
  assert.equal(contract.governance.proprietaryBrain.privacy, 'private')
  assert.equal(contract.workflowDefinition.publicationStatus, 'published')
}

const facebookSpend = paidMedia.metrics.find((metric) => metric.id === 'spend_usd')
const googleSpend = { ...facebookSpend, id: 'google_spend_usd' }
const refundValue = currencyMetric('refund_value_usd', 'Refund value', 'support.refunds.usd')
const privateMetric = { ...facebookSpend, crossSource: { mode: 'forbidden' } }
assert(decisionMetricsAreCrossSourceCompatible(facebookSpend, googleSpend))
assert(!decisionMetricsAreCrossSourceCompatible(facebookSpend, refundValue))
assert(!decisionMetricsAreCrossSourceCompatible(facebookSpend, privateMetric))

const unsafeWrite = structuredClone(customerService)
unsafeWrite.actions = unsafeWrite.actions.map((action) =>
  action.id === 'refund' ? { ...action, idempotencyRequired: false } : action
)
assert(
  validateDecisionWorkspaceContract(unsafeWrite).errors.some((error) =>
    error.includes('must require idempotency')
  )
)

const undeclaredCapability = structuredClone(realEstate)
undeclaredCapability.actions = [
  providerAction({ id: 'buy', label: 'Buy property', capability: 'property.buy', risk: 'critical', approval: 'always' }),
]
assert(
  validateDecisionWorkspaceContract(undeclaredCapability).errors.some((error) =>
    error.includes('undeclared capability')
  )
)

assert.equal(bookkeeping.workspaceType, tax.workspaceType)
assert.notEqual(bookkeeping.decisionSubject.type, tax.decisionSubject.type)

const paidMediaRuntime = {
  instanceId: 'runtime.paid_media.001',
  workflowDefinition: paidMedia.workflowDefinition,
  status: 'running',
}
const campaignSubject = { type: 'campaign', id: 'campaign-123' }
const recommendation = {
  id: 'recommendation.001',
  runtime: paidMediaRuntime,
  subject: campaignSubject,
  proposedActionId: 'change_delivery',
  governingRuleId: 'sop.paid_media.efficiency_guardrail',
  rationale: 'Spend exceeded the published efficiency guardrail.',
  confidence: 0.93,
  expectedImpact: 'Reduce inefficient spend while preserving stronger campaigns.',
  urgency: 'high',
  alternatives: ['observe'],
  assumptions: ['Attribution data is current.'],
  evidence: [
    {
      id: 'evidence.001',
      kind: 'spend',
      sourceId: 'facebook_ads.primary',
      sourceRecordId: 'campaign-123:2026-08-31',
      observedAt: '2026-08-31T09:00:00.000Z',
      ingestedAt: '2026-08-31T09:05:00.000Z',
      transformationVersion: 'paid-media-metrics-v1',
      freshness: 'fresh',
      quality: 'complete',
    },
  ],
  createdAt: '2026-08-31T09:06:00.000Z',
  expiresAt: null,
  reevaluateAt: '2026-08-31T10:06:00.000Z',
}
assert.deepEqual(validateDecisionWorkspaceRecommendation(paidMedia, recommendation), [])

const decision = {
  id: 'decision.001',
  recommendationId: recommendation.id,
  runtime: paidMediaRuntime,
  subject: campaignSubject,
  actorId: 'operator-1',
  decidedAt: '2026-08-31T09:10:00.000Z',
  outcome: 'accepted',
  selectedActionId: 'change_delivery',
  reason: 'The evidence and projected impact meet the published approval policy.',
  scope: 'subject',
}
assert.deepEqual(validateDecisionWorkspaceHumanDecision(paidMedia, decision), [])

const execution = {
  id: 'execution.001',
  decisionId: decision.id,
  runtime: paidMediaRuntime,
  subject: campaignSubject,
  actionId: 'change_delivery',
  sourceId: 'facebook_ads.primary',
  capability: 'ads.update_delivery',
  status: 'executed',
  idempotencyKey: 'decision.001:change_delivery',
  previewReference: 'preview.001',
  providerReceipt: 'provider-receipt-001',
  rollbackReference: 'rollback.001',
  errorCode: null,
  transitions: [
    { from: null, to: 'proposed', at: '2026-08-31T09:06:00.000Z', actorId: 'agent-1' },
    { from: 'proposed', to: 'approved', at: '2026-08-31T09:10:00.000Z', actorId: 'operator-1' },
    { from: 'approved', to: 'executing', at: '2026-08-31T09:11:00.000Z', actorId: 'runtime-1' },
    { from: 'executing', to: 'executed', at: '2026-08-31T09:12:00.000Z', actorId: 'runtime-1' },
  ],
}
assert.deepEqual(validateDecisionWorkspaceActionExecution(paidMedia, execution), [])

const staleWorkflowRecommendation = structuredClone(recommendation)
staleWorkflowRecommendation.runtime.workflowDefinition.version = '0'
assert(
  validateDecisionWorkspaceRecommendation(paidMedia, staleWorkflowRecommendation).some((error) =>
    error.includes('exact published workflow definition and version')
  )
)

const missingReceiptExecution = { ...execution, providerReceipt: null }
assert(
  validateDecisionWorkspaceActionExecution(paidMedia, missingReceiptExecution).some((error) =>
    error.includes('provider receipt')
  )
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      reference_contracts: [
        `${gmail.workspaceType}:${gmail.workflowId}`,
        `${customerService.workspaceType}:${customerService.workflowId}`,
        `${realEstate.workspaceType}:${realEstate.workflowId}`,
        `${crypto.workspaceType}:${crypto.workflowId}`,
        `${paidMedia.workspaceType}:${paidMedia.workflowId}`,
        `${bookkeeping.workspaceType}:${bookkeeping.workflowId}`,
        `${tax.workspaceType}:${tax.workflowId}`,
      ],
      arbitrary_provider_registration: true,
      multiple_sources: true,
      multiple_decision_subjects_in_one_workspace: true,
      cross_source_metrics_fail_closed: true,
      provider_writes_require_declared_capabilities_and_idempotency: true,
      recommendation_decision_execution_history_is_versioned_and_validated: true,
      provider_receipts_and_lifecycle_transitions_are_required: true,
      proprietary_brain_is_private_versioned_knowledge_not_model_training: true,
    },
    null,
    2
  )
)
