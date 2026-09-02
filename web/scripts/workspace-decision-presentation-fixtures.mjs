import assert from 'node:assert/strict'
import {
  buildDecisionWorkspaceChromeSnapshot,
  defineDecisionWorkspacePresentation,
  presentationHasProviderControl,
  renderDecisionWorkspaceCopy,
  resolveDecisionWorkspacePresentationSlot,
  validateDecisionWorkspacePresentation,
} from '../src/lib/runtime/decisionWorkspacePresentation.ts'
import { gmailDecisionWorkspacePresentation } from '../src/lib/integrations/gmail/gmailDecisionWorkspacePresentation.ts'

const slotIds = [
  'workspace',
  'health_overview',
  'review_groups',
  'item_overview',
  'decision_mode',
  'decision_management',
]

function makePresentation(params) {
  const slotTitle = {
    workspace: params.workspaceTitle,
    health_overview: params.healthTitle,
    review_groups: 'Review Groups',
    item_overview: params.itemOverviewTitle,
    decision_mode: 'Decision Mode',
    decision_management: 'Decision Management',
  }
  const slots = Object.fromEntries(
    slotIds.map((slotId) => [
      slotId,
      {
        semanticId: slotId,
        title: slotTitle[slotId],
        subtitle: `${slotTitle[slotId]} for the published ${params.workflowLabel} workflow.`,
        ariaLabel: `${slotTitle[slotId]} for ${params.subjectPlural}`,
      },
    ])
  )
  const prompts = Object.fromEntries(
    slotIds.map((slotId) => [
      slotId,
      [`What needs attention in ${slotTitle[slotId]}?`],
    ])
  )
  const context = Object.fromEntries(
    slotIds.map((slotId) => [
      slotId,
      `Current context: ${slotTitle[slotId]}. Preserve the published workflow and source identity.`,
    ])
  )
  return defineDecisionWorkspacePresentation({
    schemaVersion: 1,
    presentationId: `reference.${params.id}.presentation`,
    version: '1',
    workflowDefinition: {
      definitionId: `reference.${params.id}.workflow`,
      version: '1',
    },
    governance: {
      provenanceId: `reference.${params.id}.presentation.fixture`,
      authoredBy: `${params.agentLabel} fixture author`,
      approvedBy: 'Human fixture reviewer',
      approvalStatus: 'human_approved',
      reversibleToVersion: null,
    },
    agentRoles: params.agentRoles || [{ id: `${params.id}_analyst`, label: params.agentLabel }],
    sources: params.sources,
    slots,
    nouns: {
      universe: params.universe,
      subjectSingular: params.subjectSingular,
      subjectPlural: params.subjectPlural,
      activitySingular: params.activitySingular,
      activityPlural: params.activityPlural,
      evidenceSingular: params.evidenceSingular,
      evidencePlural: params.evidencePlural,
    },
    metricLabels: {
      itemsInScope: `${params.subjectPlural} in scope`,
      reviewCandidates: 'Review candidates',
      decisionsMade: 'Decisions made',
      recommendations: 'Recommendations',
      executionStatus: 'Execution status',
    },
    semanticMetrics: params.metrics,
    actionLabels: params.actions,
    providerControls: params.providerControls || [],
    assistant: { prompts, context },
    copy: {
      workspaceDescription: `Decision workspace for ${params.workflowLabel}.`,
      controlCenterDescription: `Committed ${params.subjectPlural.toLowerCase()} and execution truth.`,
      entryTitle: `Opening ${params.workspaceTitle}`,
      entryDescription: `Review evidence and decisions for ${params.workflowLabel}.`,
      healthExplanation: `${params.healthTitle} uses the approved semantic metrics for this workflow.`,
    },
  })
}

const customerService = makePresentation({
  id: 'customer_service',
  workspaceTitle: 'Support decision workspace',
  workflowLabel: 'case resolution',
  healthTitle: 'Service health',
  itemOverviewTitle: 'Case Overview',
  universe: 'Support queue',
  subjectSingular: 'Case',
  subjectPlural: 'Cases',
  activitySingular: 'Case event',
  activityPlural: 'Case events',
  evidenceSingular: 'Case record',
  evidencePlural: 'Case records',
  agentLabel: 'Case resolution agent',
  sources: [{ id: 'support.primary', providerType: 'support', providerLabel: 'Support', role: 'primary' }],
  metrics: [{ id: 'case_event_count', label: 'Case events', valueType: 'count', unit: 'events' }],
  actions: [{ id: 'resolve_case', label: 'Resolve case' }, { id: 'issue_refund', label: 'Issue refund' }],
})

const realEstate = makePresentation({
  id: 'real_estate',
  workspaceTitle: 'Property decision workspace',
  workflowLabel: 'property scouting',
  healthTitle: 'Portfolio health',
  itemOverviewTitle: 'Property Overview',
  universe: 'Property pipeline',
  subjectSingular: 'Property',
  subjectPlural: 'Properties',
  activitySingular: 'Market observation',
  activityPlural: 'Market observations',
  evidenceSingular: 'Property record',
  evidencePlural: 'Property records',
  agentLabel: 'Property research agent',
  sources: [{ id: 'property.primary', providerType: 'property_data', providerLabel: 'Property data', role: 'primary' }],
  metrics: [{ id: 'asking_price', label: 'Asking price', valueType: 'currency', unit: 'USD' }],
  actions: [{ id: 'shortlist', label: 'Shortlist' }, { id: 'due_diligence', label: 'Request due diligence' }],
})

const crypto = makePresentation({
  id: 'crypto',
  workspaceTitle: 'Investment decision workspace',
  workflowLabel: 'crypto portfolio management',
  healthTitle: 'Portfolio health',
  itemOverviewTitle: 'Position Overview',
  universe: 'Portfolio',
  subjectSingular: 'Position',
  subjectPlural: 'Positions',
  activitySingular: 'Position observation',
  activityPlural: 'Position observations',
  evidenceSingular: 'Market signal',
  evidencePlural: 'Market signals',
  agentLabel: 'Portfolio analysis agent',
  sources: [{ id: 'crypto.primary', providerType: 'crypto_exchange', providerLabel: 'Exchange', role: 'primary' }],
  metrics: [{ id: 'position_value', label: 'Position value', valueType: 'currency', unit: 'USD' }],
  actions: [{ id: 'monitor', label: 'Monitor' }, { id: 'rebalance', label: 'Rebalance position' }],
})

const paidMediaSources = [
  ['paid_media.facebook', 'facebook_ads', 'Facebook Ads', 'primary'],
  ['paid_media.google', 'google_ads', 'Google Ads', 'supporting'],
  ['paid_media.tiktok', 'tiktok_ads', 'TikTok Ads', 'supporting'],
  ['paid_media.email', 'email_ads', 'Email ads', 'supporting'],
].map(([id, providerType, providerLabel, role]) => ({ id, providerType, providerLabel, role }))

const paidMedia = makePresentation({
  id: 'paid_media',
  workspaceTitle: 'Paid media decision workspace',
  workflowLabel: 'multi-source campaign optimization',
  healthTitle: 'Campaign health',
  itemOverviewTitle: 'Campaign Overview',
  universe: 'Campaign portfolio',
  subjectSingular: 'Campaign',
  subjectPlural: 'Campaigns',
  activitySingular: 'Performance observation',
  activityPlural: 'Performance observations',
  evidenceSingular: 'Attribution record',
  evidencePlural: 'Attribution records',
  agentLabel: 'Paid media agent',
  sources: paidMediaSources,
  metrics: [
    { id: 'spend', label: 'Spend', valueType: 'currency', unit: 'USD' },
    { id: 'attributed_revenue', label: 'Attributed revenue', valueType: 'currency', unit: 'USD' },
  ],
  actions: [{ id: 'observe', label: 'Keep observing' }, { id: 'pause', label: 'Pause campaign' }, { id: 'scale', label: 'Scale campaign' }],
  providerControls: paidMediaSources.map((source) => ({
    id: `${source.providerType}.sync_status`,
    sourceId: source.id,
    providerType: source.providerType,
    label: `${source.providerLabel} status`,
    requiredCapability: `${source.providerType}.read_status`,
  })),
})

const bookkeeping = makePresentation({
  id: 'bookkeeping',
  workspaceTitle: 'Bookkeeping decision workspace',
  workflowLabel: 'transaction classification',
  healthTitle: 'Books health',
  itemOverviewTitle: 'Transaction Overview',
  universe: 'Ledger',
  subjectSingular: 'Transaction',
  subjectPlural: 'Transactions',
  activitySingular: 'Ledger entry',
  activityPlural: 'Ledger entries',
  evidenceSingular: 'Transaction record',
  evidencePlural: 'Transaction records',
  agentLabel: 'Bookkeeping agent',
  sources: [{ id: 'books.primary', providerType: 'ledger', providerLabel: 'Ledger', role: 'primary' }],
  metrics: [{ id: 'transaction_value', label: 'Transaction value', valueType: 'currency', unit: 'USD' }],
  actions: [{ id: 'categorize', label: 'Categorize transaction' }, { id: 'escalate', label: 'Escalate' }],
})

const tax = makePresentation({
  id: 'tax',
  workspaceTitle: 'Tax decision workspace',
  workflowLabel: 'tax compliance review',
  healthTitle: 'Compliance health',
  itemOverviewTitle: 'Tax Issue Overview',
  universe: 'Tax records',
  subjectSingular: 'Tax issue',
  subjectPlural: 'Tax issues',
  activitySingular: 'Compliance observation',
  activityPlural: 'Compliance observations',
  evidenceSingular: 'Compliance record',
  evidencePlural: 'Compliance records',
  agentLabel: 'Tax review agent',
  sources: [{ id: 'tax.primary', providerType: 'tax_records', providerLabel: 'Tax records', role: 'primary' }],
  metrics: [{ id: 'exposure_value', label: 'Potential exposure', valueType: 'currency', unit: 'USD' }],
  actions: [{ id: 'accountant_review', label: 'Review with accountant' }],
})

const shipping = makePresentation({
  id: 'shipping',
  workspaceTitle: 'Commerce operations workspace',
  workflowLabel: 'purchasing and fulfillment',
  healthTitle: 'Fulfillment health',
  itemOverviewTitle: 'Shipment Overview',
  universe: 'Fulfillment pipeline',
  subjectSingular: 'Shipment',
  subjectPlural: 'Shipments',
  activitySingular: 'Fulfillment update',
  activityPlural: 'Fulfillment updates',
  evidenceSingular: 'Order or tracking record',
  evidencePlural: 'Order and tracking records',
  agentLabel: 'Fulfillment agent',
  agentRoles: [
    { id: 'purchasing_agent', label: 'Purchasing agent' },
    { id: 'spreadsheet_agent', label: 'Spreadsheet maintenance agent' },
    { id: 'shipping_agent', label: 'Shipping agent' },
  ],
  sources: [
    { id: 'commerce.orders', providerType: 'commerce', providerLabel: 'Commerce', role: 'primary' },
    { id: 'commerce.sheet', providerType: 'spreadsheet', providerLabel: 'Spreadsheet', role: 'supporting' },
    { id: 'commerce.shipping', providerType: 'shipping', providerLabel: 'Shipping', role: 'supporting' },
  ],
  metrics: [{ id: 'delivery_exception_count', label: 'Delivery exceptions', valueType: 'count', unit: 'exceptions' }],
  actions: [{ id: 'update_tracking', label: 'Update tracking record' }],
})

const sevenDomains = [
  gmailDecisionWorkspacePresentation,
  customerService,
  realEstate,
  crypto,
  paidMedia,
  bookkeeping,
  tax,
]

for (const presentation of [...sevenDomains, shipping]) {
  const validation = validateDecisionWorkspacePresentation(presentation)
  assert.deepEqual(validation.errors, [], `${presentation.presentationId} should validate`)
  const chrome = buildDecisionWorkspaceChromeSnapshot(presentation)
  assert.equal(chrome.workflowDefinitionVersion, '1')
  assert.equal(chrome.approvalStatus, 'human_approved')
  assert.match(chrome.provenanceId, /\.presentation\./)
  assert.ok(chrome.sourceIds.length >= 1)
  assert.ok(chrome.agentRoleIds.length >= 1)
}

assert.deepEqual(
  sevenDomains.map((presentation) => presentation.slots.health_overview.title),
  ['Inbox health', 'Service health', 'Portfolio health', 'Portfolio health', 'Campaign health', 'Books health', 'Compliance health']
)

for (const presentation of sevenDomains.slice(1)) {
  const chromeText = JSON.stringify(buildDecisionWorkspaceChromeSnapshot(presentation))
  assert.doesNotMatch(chromeText, /gmail|mailbox|sender|inbox/i)
}

assert.equal(paidMedia.sources.length, 4)
assert.equal(paidMedia.providerControls.length, 4)
assert.equal(shipping.agentRoles.length, 3)
assert.deepEqual(shipping.sources.map((source) => source.id), [
  'commerce.orders',
  'commerce.sheet',
  'commerce.shipping',
])

assert.equal(
  presentationHasProviderControl(gmailDecisionWorkspacePresentation, 'gmail.smart_sync', 'gmail.primary'),
  true
)
assert.equal(presentationHasProviderControl(customerService, 'gmail.smart_sync'), false)

const unsafeSlots = structuredClone(customerService.slots)
unsafeSlots.health_overview.title = '<script>unsafe</script>'
assert.equal(
  resolveDecisionWorkspacePresentationSlot({ slots: unsafeSlots }, 'health_overview').title,
  'Decision health'
)

const missingTitleSlots = structuredClone(customerService.slots)
missingTitleSlots.health_overview.title = ''
assert.equal(
  resolveDecisionWorkspacePresentationSlot({ slots: missingTitleSlots }, 'health_overview').title,
  'Decision health'
)

const ungovernedPresentation = {
  ...customerService,
  governance: { ...customerService.governance, approvalStatus: 'machine_generated' },
}
assert.match(
  validateDecisionWorkspacePresentation(ungovernedPresentation).errors.join(' '),
  /human approval/
)

const invalidSemanticSlots = structuredClone(customerService.slots)
invalidSemanticSlots.health_overview.semanticId = 'review_groups'
const invalidSemanticPresentation = { ...customerService, slots: invalidSemanticSlots }
assert.match(
  validateDecisionWorkspacePresentation(invalidSemanticPresentation).errors.join(' '),
  /retain its framework semantic ID/
)

assert.equal(
  renderDecisionWorkspaceCopy('Review {{subject_plural}} in {{universe}}.', {
    subject_plural: 'Cases',
    universe: 'Support queue',
  }),
  'Review Cases in Support queue.'
)
assert.throws(
  () => renderDecisionWorkspaceCopy('Review {{unknown_token}}.', {}),
  /missing or unsafe/
)

console.log(
  JSON.stringify(
    {
      fixture: 'workspace-decision-presentation',
      domains: sevenDomains.map((presentation) => ({
        id: presentation.presentationId,
        healthTitle: presentation.slots.health_overview.title,
        sources: presentation.sources.length,
        providerControls: presentation.providerControls.length,
      })),
      multiAgentReference: {
        id: shipping.presentationId,
        agentRoles: shipping.agentRoles.length,
        sources: shipping.sources.length,
      },
      safeFallback: 'Decision health',
      pageLoadModelCalls: 0,
      requestFamiliesAdded: 0,
    },
    null,
    2
  )
)
