import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregateDecisionWorkspaceExecutionStatus,
  canTransitionDecisionWorkspaceExecutionAction,
  prepareDecisionWorkspaceExecutionClaim,
  sanitizeDecisionWorkspaceProviderReceipt,
  staleDecisionWorkspaceExecutionStatus,
} from '../src/lib/runtime/decisionWorkspaceExecutionModel.ts'
import {
  classifyGmailArchiveExecution,
  classifyGmailDraftExecution,
} from '../src/lib/integrations/gmail/gmailDecisionWorkspaceExecutionPolicy.ts'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(webRoot, '..')
const readWeb = (relativePath) => readFileSync(join(webRoot, relativePath), 'utf8')
const readRepo = (relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8')
const sha256 = (relativePath) =>
  createHash('sha256').update(readFileSync(join(webRoot, relativePath))).digest('hex')

const identity = {
  tenantId: '11111111-1111-4111-8111-111111111111',
  agentId: '22222222-2222-4222-8222-222222222222',
  requestEventId: '33333333-3333-4333-8333-333333333333',
}

const requestEventIds = [
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
  '99999999-9999-4999-8999-999999999999',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
]

const domainFixtures = [
  {
    domain: 'gmail',
    actions: [
      {
        tool: 'gmail',
        action: 'archive_messages',
        args: { message_ids: ['m-1', 'm-2'] },
        providerType: 'gmail',
        sourceId: 'gmail.primary',
        connectionId: 'gmail.connection.primary',
        agentRoleId: 'mailbox.operator',
        capability: 'gmail.archive_messages',
        effect: 'provider_write',
        reversibility: 'reversible',
      },
    ],
  },
  {
    domain: 'customer_service',
    actions: [
      {
        tool: 'service_desk',
        action: 'update_case',
        args: { case_id: 'case-1' },
        providerType: 'service_desk',
        sourceId: 'support.primary',
        connectionId: 'support.connection.primary',
        agentRoleId: 'case.owner',
        capability: 'service_desk.update_case',
        effect: 'provider_write',
        reversibility: 'compensating_action',
      },
      {
        tool: 'messaging',
        action: 'send_response',
        args: { case_id: 'case-1' },
        providerType: 'messaging',
        sourceId: 'support.messaging',
        connectionId: 'messaging.connection.primary',
        agentRoleId: 'response.writer',
        capability: 'messaging.send_response',
        effect: 'provider_write',
        reversibility: 'irreversible',
      },
    ],
  },
  {
    domain: 'real_estate',
    actions: [
      {
        tool: 'real_estate_crm',
        action: 'update_lead',
        args: { lead_id: 'lead-1' },
        providerType: 'real_estate_crm',
        sourceId: 'real_estate.crm',
        connectionId: 'real_estate.connection.primary',
        agentRoleId: 'lead.coordinator',
        capability: 'real_estate_crm.update_lead',
        effect: 'provider_write',
        reversibility: 'compensating_action',
      },
    ],
  },
  {
    domain: 'investments_crypto',
    actions: [
      {
        tool: 'broker',
        action: 'prepare_trade',
        args: { asset_id: 'asset-1' },
        providerType: 'broker',
        sourceId: 'portfolio.broker',
        connectionId: 'broker.connection.primary',
        agentRoleId: 'portfolio.reviewer',
        capability: 'broker.prepare_trade',
        effect: 'provider_write',
        reversibility: 'irreversible',
      },
    ],
  },
  {
    domain: 'paid_media',
    actions: [
      {
        tool: 'ad_network_a',
        action: 'pause_campaign',
        args: { campaign_id: 'campaign-a' },
        providerType: 'ad_network_a',
        sourceId: 'paid_media.network_a',
        connectionId: 'ad_network_a.connection',
        agentRoleId: 'campaign.operator',
        capability: 'ad_network_a.pause_campaign',
        effect: 'provider_write',
        reversibility: 'reversible',
      },
      {
        tool: 'ad_network_b',
        action: 'pause_campaign',
        args: { campaign_id: 'campaign-b' },
        providerType: 'ad_network_b',
        sourceId: 'paid_media.network_b',
        connectionId: 'ad_network_b.connection',
        agentRoleId: 'campaign.operator',
        capability: 'ad_network_b.pause_campaign',
        effect: 'provider_write',
        reversibility: 'reversible',
      },
    ],
  },
  {
    domain: 'bookkeeping',
    actions: [
      {
        tool: 'accounting',
        action: 'classify_transaction',
        args: { transaction_id: 'txn-1' },
        providerType: 'accounting',
        sourceId: 'books.ledger',
        connectionId: 'accounting.connection.primary',
        agentRoleId: 'bookkeeper',
        capability: 'accounting.classify_transaction',
        effect: 'provider_write',
        reversibility: 'reversible',
      },
    ],
  },
  {
    domain: 'tax',
    actions: [
      {
        tool: 'tax_system',
        action: 'record_compliance_checkpoint',
        args: { filing_id: 'filing-1' },
        providerType: 'tax_system',
        sourceId: 'tax.compliance',
        connectionId: 'tax.connection.primary',
        agentRoleId: 'tax.reviewer',
        capability: 'tax_system.record_compliance_checkpoint',
        effect: 'provider_write',
        reversibility: 'compensating_action',
      },
    ],
  },
  {
    domain: 'shipping_purchasing',
    actions: [
      {
        tool: 'purchasing',
        action: 'purchase_item',
        args: { offer_id: 'offer-1' },
        providerType: 'purchasing',
        sourceId: 'commerce.purchasing',
        connectionId: 'purchasing.connection.primary',
        agentRoleId: 'purchasing.agent',
        capability: 'purchasing.purchase_item',
        effect: 'provider_write',
        reversibility: 'compensating_action',
      },
      {
        tool: 'spreadsheet',
        action: 'append_purchase',
        args: { sheet_id: 'purchases' },
        providerType: 'spreadsheet',
        sourceId: 'operations.purchases_sheet',
        connectionId: 'spreadsheet.connection.primary',
        agentRoleId: 'records.agent',
        capability: 'spreadsheet.append_purchase',
        effect: 'provider_write',
        reversibility: 'reversible',
      },
      {
        tool: 'shipping',
        action: 'create_tracking_record',
        args: { shipment_id: 'shipment-1' },
        providerType: 'shipping',
        sourceId: 'logistics.shipping',
        connectionId: 'shipping.connection.primary',
        agentRoleId: 'shipping.agent',
        capability: 'shipping.create_tracking_record',
        effect: 'provider_write',
        reversibility: 'compensating_action',
      },
    ],
  },
]

const claims = domainFixtures.map((fixture, index) =>
  prepareDecisionWorkspaceExecutionClaim({
    ...identity,
    requestEventId: requestEventIds[index],
    workflowContext: {
      definition_id: `${fixture.domain}.workflow`,
      definition_version: '1',
      runtime_instance_id: `${fixture.domain}.runtime.1`,
    },
    actions: fixture.actions,
  })
)

assert.equal(claims.length, 8)
assert.equal(new Set(claims.map((claim) => claim.executionKey)).size, 8)
for (const [index, claim] of claims.entries()) {
  assert.equal(claim.actions.length, domainFixtures[index].actions.length)
  assert.equal(new Set(claim.actions.map((action) => action.idempotency_key)).size, claim.actions.length)
  assert.ok(claim.actions.every((action) => action.provider_type.length > 0))
  assert.ok(claim.actions.every((action) => action.capability.length > 0))
}

const canonicalA = prepareDecisionWorkspaceExecutionClaim({
  ...identity,
  actions: [
    {
      tool: 'gmail',
      action: 'draft_email',
      args: { to: 'person@example.com', subject: 'Hello', metadata: { b: 2, a: 1 } },
      providerType: 'gmail',
      sourceId: 'gmail.primary',
      capability: 'gmail.draft_email',
      effect: 'provider_write',
      reversibility: 'compensating_action',
    },
  ],
})
const canonicalB = prepareDecisionWorkspaceExecutionClaim({
  ...identity,
  actions: [
    {
      tool: 'gmail',
      action: 'draft_email',
      args: { metadata: { a: 1, b: 2 }, subject: 'Hello', to: 'person@example.com' },
      providerType: 'gmail',
      sourceId: 'gmail.primary',
      capability: 'gmail.draft_email',
      effect: 'provider_write',
      reversibility: 'compensating_action',
    },
  ],
})
assert.equal(canonicalA.executionKey, canonicalB.executionKey)
assert.equal(canonicalA.actionFingerprint, canonicalB.actionFingerprint)
assert.equal(canonicalA.actions[0].idempotency_key, canonicalB.actions[0].idempotency_key)

const reordered = prepareDecisionWorkspaceExecutionClaim({
  ...identity,
  actions: [
    {
      tool: 'gmail',
      action: 'analyze_inbox',
      providerType: 'gmail',
      sourceId: 'gmail.primary',
      capability: 'gmail.analyze_inbox',
      effect: 'provider_read',
      reversibility: 'not_applicable',
    },
    canonicalA.actions[0].approved_action.tool === 'gmail'
      ? {
          tool: 'gmail',
          action: 'draft_email',
          args: canonicalA.actions[0].approved_action.args,
          providerType: 'gmail',
          sourceId: 'gmail.primary',
          capability: 'gmail.draft_email',
          effect: 'provider_write',
          reversibility: 'compensating_action',
        }
      : null,
  ].filter(Boolean),
})
assert.equal(reordered.executionKey, canonicalA.executionKey)
assert.notEqual(reordered.actionFingerprint, canonicalA.actionFingerprint)

const claimRegistry = new Map()
const claimAtomically = (claim) => {
  const existing = claimRegistry.get(claim.executionKey)
  if (existing) {
    return {
      invocationAuthorized: false,
      conflict: existing.actionFingerprint !== claim.actionFingerprint,
    }
  }
  claimRegistry.set(claim.executionKey, claim)
  return { invocationAuthorized: true, conflict: false }
}
const simultaneousClaims = await Promise.all([
  Promise.resolve().then(() => claimAtomically(canonicalA)),
  Promise.resolve().then(() => claimAtomically(canonicalA)),
])
assert.equal(
  simultaneousClaims.filter((result) => result.invocationAuthorized).length,
  1
)
const conflictingReplay = claimAtomically(reordered)
assert.equal(conflictingReplay.invocationAuthorized, false)
assert.equal(conflictingReplay.conflict, true)

assert.throws(
  () =>
    prepareDecisionWorkspaceExecutionClaim({
      ...identity,
      actions: [
        {
          tool: 'Unsafe Provider',
          action: 'write',
          providerType: 'unsafe',
          capability: 'unsafe.write',
          effect: 'provider_write',
          reversibility: 'irreversible',
        },
      ],
    }),
  /stable identifier/
)

assert.equal(canTransitionDecisionWorkspaceExecutionAction('claimed', 'executing'), true)
assert.equal(canTransitionDecisionWorkspaceExecutionAction('executing', 'partial'), true)
assert.equal(canTransitionDecisionWorkspaceExecutionAction('partial', 'reverted'), true)
assert.equal(canTransitionDecisionWorkspaceExecutionAction('succeeded', 'executing'), false)
assert.equal(aggregateDecisionWorkspaceExecutionStatus(['succeeded']), 'succeeded')
assert.equal(aggregateDecisionWorkspaceExecutionStatus(['succeeded', 'failed']), 'partial')
assert.equal(aggregateDecisionWorkspaceExecutionStatus(['succeeded', 'indeterminate']), 'indeterminate')
assert.equal(aggregateDecisionWorkspaceExecutionStatus(['failed', 'skipped']), 'failed')
assert.equal(aggregateDecisionWorkspaceExecutionStatus(['claimed', 'claimed']), 'executing')
assert.equal(
  staleDecisionWorkspaceExecutionStatus({
    status: 'executing',
    leaseExpiresAt: '2026-09-02T00:00:00.000Z',
    now: new Date('2026-09-02T00:15:00.000Z'),
  }),
  'indeterminate'
)

assert.deepEqual(
  sanitizeDecisionWorkspaceProviderReceipt({ provider_id: 'receipt-1', count: 2 }),
  { count: 2, provider_id: 'receipt-1' }
)
assert.throws(
  () => sanitizeDecisionWorkspaceProviderReceipt({ access_token: 'must-not-be-stored' }),
  /prohibited key/
)

const archiveSuccess = classifyGmailArchiveExecution({
  requested_count: 2,
  archived_count: 2,
  message_ids: ['m-1', 'm-2'],
  accepted_message_ids: ['m-1', 'm-2'],
  failed_message_ids: [],
  partial_failure: false,
})
assert.equal(archiveSuccess.status, 'succeeded')

const archivePartial = classifyGmailArchiveExecution({
  requested_count: 2,
  archived_count: 1,
  message_ids: ['m-1'],
  accepted_message_ids: ['m-1'],
  failed_message_ids: ['m-2'],
  partial_failure: true,
})
assert.equal(archivePartial.status, 'partial')
assert.deepEqual(archivePartial.receipt?.failed_message_ids, ['m-2'])

const archiveFailure = classifyGmailArchiveExecution({
  requested_count: 2,
  archived_count: 0,
  message_ids: [],
  accepted_message_ids: [],
  failed_message_ids: ['m-1', 'm-2'],
  partial_failure: true,
})
assert.equal(archiveFailure.status, 'failed')

assert.equal(
  classifyGmailDraftExecution({
    phase: 'provider_response',
    httpStatus: 200,
    draftId: 'draft-1',
    messageId: 'message-1',
  }).status,
  'succeeded'
)
assert.equal(
  classifyGmailDraftExecution({ phase: 'provider_response', httpStatus: 400 }).status,
  'failed'
)
assert.equal(
  classifyGmailDraftExecution({ phase: 'provider_response', httpStatus: 500 }).status,
  'indeterminate'
)
assert.equal(
  classifyGmailDraftExecution({ phase: 'transport_failure' }).reconciliationStatus,
  'manual_required'
)

const simulateFailFastBundle = (outcomes) => {
  const statuses = outcomes.map(() => 'claimed')
  const attemptCounts = outcomes.map(() => 0)
  const transitionCounts = outcomes.map(() => 1)
  let stopped = false

  for (const [index, outcome] of outcomes.entries()) {
    if (stopped) {
      statuses[index] = 'skipped'
      transitionCounts[index] += 1
      continue
    }
    statuses[index] = 'executing'
    attemptCounts[index] += 1
    transitionCounts[index] += 1
    statuses[index] = outcome
    transitionCounts[index] += 1
    if (outcome !== 'succeeded') stopped = true
  }

  return {
    statuses,
    attemptCounts,
    transitionCounts,
    aggregate: aggregateDecisionWorkspaceExecutionStatus(statuses),
  }
}

const singleSuccess = simulateFailFastBundle(['succeeded'])
assert.deepEqual(singleSuccess.statuses, ['succeeded'])
assert.equal(singleSuccess.aggregate, 'succeeded')
assert.deepEqual(singleSuccess.attemptCounts, [1])

const successThenFailure = simulateFailFastBundle(['succeeded', 'failed', 'succeeded'])
assert.deepEqual(successThenFailure.statuses, ['succeeded', 'failed', 'skipped'])
assert.equal(successThenFailure.aggregate, 'partial')
assert.deepEqual(successThenFailure.attemptCounts, [1, 1, 0])

const archivePartialBundle = simulateFailFastBundle([archivePartial.status, 'succeeded'])
assert.deepEqual(archivePartialBundle.statuses, ['partial', 'skipped'])
assert.equal(archivePartialBundle.aggregate, 'partial')

const ambiguousDraftBundle = simulateFailFastBundle(['indeterminate', 'succeeded'])
assert.deepEqual(ambiguousDraftBundle.statuses, ['indeterminate', 'skipped'])
assert.equal(ambiguousDraftBundle.aggregate, 'indeterminate')

const paidMediaPartial = simulateFailFastBundle(['succeeded', 'failed'])
assert.equal(paidMediaPartial.aggregate, 'partial')
const shippingPurchasingPartial = simulateFailFastBundle(['succeeded', 'failed', 'succeeded'])
assert.deepEqual(shippingPurchasingPartial.statuses, ['succeeded', 'failed', 'skipped'])
assert.equal(shippingPurchasingPartial.aggregate, 'partial')

const migration = readRepo(
  'supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql'
)
for (const objectName of [
  'decision_workspace_execution_runs',
  'decision_workspace_execution_actions',
  'claim_decision_workspace_execution',
  'record_decision_workspace_action_receipt',
  'finalize_decision_workspace_execution',
  'resolve_stale_decision_workspace_execution',
]) {
  assert.match(migration, new RegExp(objectName))
}
assert.match(migration, /on conflict \(tenant_id, agent_id, request_event_id\) do nothing/i)
assert.match(migration, /invocation_authorized', v_created/)
assert.match(migration, /v_approved_actions is distinct from v_request_payload -> 'proposed_actions'/)
assert.match(migration, /r\.lease_token = p_lease_token/g)
assert.match(migration, /count\(\*\) filter \(where status = 'indeterminate'\)/)
assert.match(migration, /revoke all on table public\.decision_workspace_execution_runs from anon, authenticated/i)
assert.match(migration, /grant execute on function public\.claim_decision_workspace_execution[\s\S]*to service_role/i)
assert.doesNotMatch(migration, /\b(drop table|truncate|delete from)\b/i)

const route = readWeb('src/app/api/runtime/execute/route.ts')
const handler = route.slice(route.indexOf('export async function POST'))
const claimIndex = handler.indexOf('claimRuntimeExecution({')
const draftIndex = handler.indexOf('createGmailDraft({')
const archiveIndex = handler.indexOf('archiveGmailMessagesForTenant({')
assert.ok(claimIndex >= 0 && draftIndex > claimIndex && archiveIndex > claimIndex)
assert.match(handler, /if \(!claim\.invocationAuthorized\)[\s\S]*status: 409/)
assert.match(handler, /finalizeRuntimeExecution\([\s\S]*compatibilityPayload: executionPayload/)
assert.doesNotMatch(handler, /event_type: 'execution_result'/)
assert.match(handler, /archiveOutcome\.status !== 'succeeded'/)
assert.match(handler, /Gmail draft outcome requires reconciliation before another attempt/)

const inboxAnalysis = readWeb('src/lib/integrations/gmail/inboxAnalysis.ts')
assert.match(inboxAnalysis, /accepted_message_ids: mutation\.data\.accepted_message_ids/)
assert.match(inboxAnalysis, /failed_message_ids: mutation\.data\.failed_message_ids/)
assert.match(inboxAnalysis, /partial_failure: mutation\.data\.partial_failure/)
assert.match(inboxAnalysis, /const GMAIL_BATCH_MODIFY_CHUNK_SIZE = 100/)
assert.match(inboxAnalysis, /const GMAIL_BATCH_MODIFY_CONCURRENCY = 4/)
assert.match(inboxAnalysis, /modifyResponse\.status === 401 && !retriedAfterUnauthorized/)

assert.equal(
  sha256('src/lib/runtime/stateLoaders.ts'),
  '27ce88c8aa54c386efb612e285507dad313e4e16b1412ec90154ca46af43eab1'
)
assert.equal(
  sha256('src/app/agents/[id]/operations/approvals/page.tsx'),
  'fec9b3c769feb98b5e7f354f241a4cf146e843464dbeb07776aa704fa3ea4311'
)

console.log(
  JSON.stringify(
    {
      ok: true,
      domains: domainFixtures.map((fixture) => fixture.domain),
      domain_count: domainFixtures.length,
      simultaneous_claim_authorities: simultaneousClaims.filter(
        (result) => result.invocationAuthorized
      ).length,
      conflicting_replay_authorized: conflictingReplay.invocationAuthorized,
      single_success_status: singleSuccess.aggregate,
      success_then_failure_status: successThenFailure.aggregate,
      multi_source_partial_status: aggregateDecisionWorkspaceExecutionStatus([
        'succeeded',
        'failed',
      ]),
      stale_status: 'indeterminate',
      gmail_archive_partial: archivePartial.status,
      gmail_draft_ambiguous: 'indeterminate',
      skipped_trailing_actions: successThenFailure.statuses.at(-1) === 'skipped',
      frozen_gmail_ui: true,
    },
    null,
    2
  )
)
