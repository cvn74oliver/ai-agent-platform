import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gmailDecisionWorkspaceActionAdapter } from '../src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts'
import { finalizeDecisionWorkspaceActionGroup } from '../src/lib/runtime/decisionWorkspaceActionModel.ts'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDirectory, '..')

function action(params) {
  const providerSpecific = params.sourceId != null
  return {
    id: `${params.domain}.${params.id}`,
    catalogActionId: `${params.domain}.${params.id}`,
    operation: params.operation || 'execute',
    workflowStageId: params.stage || 'decision_management',
    agentRoleId: params.role,
    sourceId: params.sourceId || null,
    connectionId: params.sourceId || null,
    capability: params.capability,
    governingPrerequisite: providerSpecific ? `${params.sourceId}.connection_verified` : null,
    declaredEffect: providerSpecific ? 'provider_write' : 'decision_only',
    invocationEffect: providerSpecific ? 'provider_write' : 'decision_only',
    risk: params.risk || (providerSpecific ? 'medium' : 'low'),
    reversibility: params.reversibility || (providerSpecific ? 'compensating_action' : 'not_applicable'),
    approval: params.approval || (providerSpecific ? 'policy' : 'none'),
    supportsPreview: providerSpecific,
    idempotencyRequired: providerSpecific,
    label: params.label,
    description: params.description || `${params.label} under the published workflow definition.`,
    pendingLabel: params.pendingLabel || `${params.label}…`,
    tone: params.tone || 'primary',
    providerSpecific,
    availability: { state: 'available', reason: null },
    compatibilityValue: params.compatibilityValue,
  }
}

function group(config) {
  const actions = config.actions.map((entry) => action({ domain: config.id, ...entry }))
  return finalizeDecisionWorkspaceActionGroup({
    schemaVersion: 1,
    adapterId: `reference.${config.id}.actions`,
    workflowDefinitionId: `reference.${config.id}.workflow`,
    workflowVersion: '1',
    runtimeInstanceId: `${config.id}:fixture`,
    subjectKind: config.subjectKind,
    subjectId: `${config.id}:subject-1`,
    surface: 'decision_management',
    compatibilityValues: actions.map((entry) => entry.compatibilityValue),
    actions,
    emptyLabel: 'No action available right now',
    footnote: `Actions are bound to the ${config.id} workflow, role, and source.`,
  })
}

const referenceDomains = [
  {
    id: 'customer_service',
    subjectKind: 'case',
    actions: [
      { id: 'close_case', label: 'Resolve case', role: 'service_agent', sourceId: 'support.primary', capability: 'support.close_case', compatibilityValue: 'close_case' },
      { id: 'issue_refund', label: 'Issue approved refund', role: 'service_supervisor', sourceId: 'payments.primary', capability: 'payments.issue_refund', compatibilityValue: 'issue_refund', risk: 'high', approval: 'always' },
    ],
  },
  {
    id: 'real_estate',
    subjectKind: 'property',
    actions: [
      { id: 'request_diligence', label: 'Request due diligence', role: 'property_analyst', sourceId: 'property.primary', capability: 'property.request_diligence', compatibilityValue: 'request_diligence' },
      { id: 'submit_offer', label: 'Submit approved offer', role: 'licensed_broker', sourceId: 'broker.primary', capability: 'broker.submit_offer', compatibilityValue: 'submit_offer', risk: 'critical', approval: 'always' },
    ],
  },
  {
    id: 'crypto',
    subjectKind: 'position',
    actions: [
      { id: 'place_order', label: 'Place approved order', role: 'portfolio_operator', sourceId: 'exchange.primary', capability: 'exchange.place_order', compatibilityValue: 'place_order', risk: 'critical', approval: 'always' },
      { id: 'cancel_order', label: 'Cancel open order', role: 'portfolio_operator', sourceId: 'exchange.primary', capability: 'exchange.cancel_order', compatibilityValue: 'cancel_order', risk: 'high' },
    ],
  },
  {
    id: 'paid_media',
    subjectKind: 'campaign',
    actions: [
      { id: 'pause_facebook', label: 'Pause on Facebook', role: 'media_operator', sourceId: 'paid_media.facebook', capability: 'facebook_ads.pause_campaign', compatibilityValue: 'pause_facebook' },
      { id: 'pause_google', label: 'Pause on Google', role: 'media_operator', sourceId: 'paid_media.google', capability: 'google_ads.pause_campaign', compatibilityValue: 'pause_google' },
      { id: 'pause_tiktok', label: 'Pause on TikTok', role: 'media_operator', sourceId: 'paid_media.tiktok', capability: 'tiktok_ads.pause_campaign', compatibilityValue: 'pause_tiktok' },
      { id: 'pause_email', label: 'Pause email campaign', role: 'email_operator', sourceId: 'paid_media.email', capability: 'email.pause_campaign', compatibilityValue: 'pause_email' },
    ],
  },
  {
    id: 'bookkeeping',
    subjectKind: 'transaction',
    actions: [
      { id: 'post_entry', label: 'Post ledger entry', role: 'bookkeeper', sourceId: 'ledger.primary', capability: 'ledger.post_entry', compatibilityValue: 'post_entry' },
      { id: 'reverse_entry', label: 'Reverse ledger entry', role: 'reviewing_accountant', sourceId: 'ledger.primary', capability: 'ledger.reverse_entry', compatibilityValue: 'reverse_entry', operation: 'reverse', risk: 'high', approval: 'always' },
    ],
  },
  {
    id: 'tax',
    subjectKind: 'tax_issue',
    actions: [
      { id: 'file_return', label: 'File approved return', role: 'tax_reviewer', sourceId: 'tax_filing.primary', capability: 'tax.file_return', compatibilityValue: 'file_return', risk: 'critical', approval: 'always', reversibility: 'compensating_action' },
      { id: 'pay_balance', label: 'Pay approved balance', role: 'tax_authorizer', sourceId: 'tax_payment.primary', capability: 'tax.pay_balance', compatibilityValue: 'pay_balance', risk: 'critical', approval: 'always' },
    ],
  },
  {
    id: 'purchasing_shipping',
    subjectKind: 'order',
    actions: [
      { id: 'place_purchase', label: 'Place approved purchase', role: 'purchasing_agent', sourceId: 'commerce.primary', capability: 'commerce.place_order', compatibilityValue: 'place_purchase', stage: 'purchasing', risk: 'high', approval: 'always' },
      { id: 'update_records', label: 'Update purchase record', role: 'records_agent', sourceId: 'spreadsheet.primary', capability: 'spreadsheet.update_row', compatibilityValue: 'update_records', stage: 'records' },
      { id: 'create_shipment', label: 'Create shipment', role: 'shipping_agent', sourceId: 'shipping.primary', capability: 'shipping.create_shipment', compatibilityValue: 'create_shipment', stage: 'shipping' },
    ],
  },
]

const gmailDecisionActions = gmailDecisionWorkspaceActionAdapter.decisionMode.getActions()
assert.equal(gmailDecisionActions.validation.valid, true)
assert.deepEqual(gmailDecisionActions.actions.map((entry) => entry.label), [
  'Keep All',
  'Keep Some',
  'Archive All',
  'Not Sure',
])
assert.deepEqual(gmailDecisionActions.actions.map((entry) => entry.compatibilityValue), [
  'KEEP',
  'CUSTOM_RULE',
  'ARCHIVE',
  'QUARANTINE',
])
assert.equal(gmailDecisionActions.actions.every((entry) => entry.invocationEffect === 'decision_only'), true)

const referenceGroups = referenceDomains.map(group)
assert.equal(referenceGroups.length + 1, 8)
for (const referenceGroup of referenceGroups) {
  assert.equal(referenceGroup.validation.valid, true, referenceGroup.validation.errors.join('\n'))
  assert.equal(referenceGroup.actions.length > 0, true)
  assert.equal(referenceGroup.actions.every((entry) => entry.sourceId && entry.connectionId), true)
  assert.equal(referenceGroup.actions.every((entry) => entry.agentRoleId), true)
  assert.equal(
    referenceGroup.actions.some((entry) => /gmail|inbox|archive all|keep all/i.test(entry.label)),
    false
  )
}

const paidMedia = referenceGroups.find((entry) => entry.adapterId.includes('paid_media'))
assert.deepEqual(paidMedia.actions.map((entry) => entry.sourceId), [
  'paid_media.facebook',
  'paid_media.google',
  'paid_media.tiktok',
  'paid_media.email',
])
const fulfillment = referenceGroups.find((entry) => entry.adapterId.includes('purchasing_shipping'))
assert.deepEqual(fulfillment.actions.map((entry) => entry.agentRoleId), [
  'purchasing_agent',
  'records_agent',
  'shipping_agent',
])
assert.deepEqual(fulfillment.actions.map((entry) => entry.workflowStageId), [
  'purchasing',
  'records',
  'shipping',
])

function gmailProfile(destinationState, executionSource = null, executionState = 'deferred') {
  return {
    sender_key: `sender-${destinationState.toLowerCase()}`,
    destination_state: destinationState,
    execution_source: executionSource,
    execution_state: executionState,
  }
}

const managementCases = [
  [gmailProfile('KEEP'), ['reopen']],
  [gmailProfile('QUARANTINE'), ['reopen']],
  [gmailProfile('CUSTOM_RULE'), ['reopen']],
  [gmailProfile('CUSTOM_RULE', 'push_requested', 'pending'), []],
  [gmailProfile('ARCHIVE', 'ready_to_push'), ['push_archive', 'reopen']],
  [gmailProfile('ARCHIVE', 'verified_applied', 'succeeded'), ['restore_archive']],
  [gmailProfile('ARCHIVE', 'push_requested', 'pending'), []],
]
for (const [profile, expected] of managementCases) {
  const result = gmailDecisionWorkspaceActionAdapter.management.getActions(profile)
  assert.equal(result.validation.valid, true, result.validation.errors.join('\n'))
  assert.deepEqual(result.actions.map((entry) => entry.compatibilityValue), expected)
}
assert.equal(gmailDecisionWorkspaceActionAdapter.management.getActions(null).validation.valid, false)

const unsafe = {
  ...gmailDecisionActions,
  actions: [
    {
      ...gmailDecisionActions.actions[2],
      id: 'unsafe.provider_action',
      sourceId: null,
      connectionId: null,
      compatibilityValue: 'UNDECLARED_VALUE',
    },
  ],
  validation: undefined,
}
const unsafeResult = finalizeDecisionWorkspaceActionGroup(unsafe)
assert.equal(unsafeResult.validation.valid, false)
assert.deepEqual(unsafeResult.actions, [])
assert.equal(unsafeResult.compatibilityValues.length, 0)

const reviewSource = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/review/page.tsx'),
  'utf8'
)
const managementSource = fs.readFileSync(
  path.join(webRoot, 'src/app/agents/[id]/operations/management/page.tsx'),
  'utf8'
)
const pureSources = [
  'src/lib/runtime/decisionWorkspaceActionModel.ts',
  'src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts',
  'src/components/runtime/DecisionWorkspaceActionContext.tsx',
  'src/app/agents/[id]/operations/layout.tsx',
].map((relativePath) => fs.readFileSync(path.join(webRoot, relativePath), 'utf8'))

assert.match(reviewSource, /decisionActionGroup\.actions\.map/)
assert.doesNotMatch(reviewSource, /destinationState:\s*'KEEP' as const/)
assert.match(managementSource, /item\.actions\.actions\.map/)
assert.doesNotMatch(managementSource, /canPushArchive|canRestoreArchive|canReopen/)
assert.equal((reviewSource.match(/fetch\('\/api\/runtime\/gmail-destinations'/g) || []).length, 1)
assert.equal((managementSource.match(/fetch\('\/api\/runtime\/gmail-destinations'/g) || []).length, 2)
for (const source of pureSources) {
  assert.doesNotMatch(source, /\bfetch\s*\(|setInterval\s*\(|setTimeout\s*\(|openai|anthropic/i)
}

console.log('Workspace decision action-model fixtures passed.')
console.log(`Domains verified: ${referenceGroups.length + 1}.`)
console.log('Gmail Decision Mode and Management compatibility behavior preserved.')
console.log('Unsafe metadata fails closed; new contract/provider seams introduce zero requests or timers.')
