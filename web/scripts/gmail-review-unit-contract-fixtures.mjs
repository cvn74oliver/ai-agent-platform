import assert from 'node:assert/strict'
import {
  GMAIL_REVIEW_UNIT_HARD_MAX,
  materializeGmailReviewUnits,
  validateGmailReviewUnitContract,
} from '../src/lib/integrations/gmail/gmailReviewUnitContract.ts'

const CUTOFF = '2026-04-12T23:59:59.000Z'

function seeds(count, options = {}) {
  return Array.from({ length: count }, (_, index) => ({
    senderKey: `${options.prefix || 'sender'}-${String(index).padStart(4, '0')}`,
    semanticFamilyKey: options.family ?? 'marketing_promotional',
    semanticSubtypeKey: options.subtype ?? null,
    semanticPatternKey: options.pattern ?? 'newsletter',
    lastActivityAt: options.lastActivityAt ?? '2026-04-01T00:00:00.000Z',
    messageCount: options.messageCount ?? 3,
    assignmentReason: options.assignmentReason ?? 'behavioral_safe_rows',
    exclusionReason: options.exclusionReason ?? null,
  }))
}

const marketingSenders = [
  ...seeds(347, { prefix: 'deals', subtype: 'marketing_candidate_deals_discounts' }),
  ...seeds(218, { prefix: 'remainder' }),
  ...seeds(160, { prefix: 'launch', subtype: 'marketing_candidate_product_launch_updates' }),
  ...seeds(76, { prefix: 'editorial', subtype: 'marketing_candidate_editorial_content' }),
  ...seeds(56, { prefix: 'spillover', family: 'commerce_transactional' }),
]
const marketing = materializeGmailReviewUnits({
  parentId: 'semantic.marketing_subscriptions',
  parentLabel: 'Marketing / promotional subscriptions',
  basis: 'subtype-first',
  actionable: true,
  artifactCutoffAt: CUTOFF,
  senders: marketingSenders,
})
assert.deepEqual(
  marketing.units.map((unit) => unit.sender_count).sort((left, right) => right - left),
  [347, 218, 160, 76, 56]
)
assert.equal(marketing.units.reduce((sum, unit) => sum + unit.sender_count, 0), 857)
assert(marketing.units.some((unit) => unit.unit_id === 'family:marketing_candidate_deals_discounts'))
assert(marketing.units.some((unit) => unit.unit_id === 'family:marketing_promotional:remainder'))
assert(marketing.units.some((unit) => unit.unit_id === 'family:spillover'))

const marketingValidation = validateGmailReviewUnitContract({
  parentId: 'semantic.marketing_subscriptions',
  actionable: true,
  parentSenderKeys: marketingSenders.map((sender) => sender.senderKey),
  units: marketing.units,
  reviewUnitIdBySenderKey: marketing.reviewUnitIdBySenderKey,
})
assert.deepEqual(marketingValidation.errors, [])
assert.equal(marketingValidation.uniqueAssignedSenderCount, 857)
assert(marketingValidation.largestUnitSenderCount <= GMAIL_REVIEW_UNIT_HARD_MAX)

const protectedSenders = [
  ...seeds(300, {
    prefix: 'protected-human',
    family: 'human_personal',
    assignmentReason: 'protected_signal_override',
  }),
  ...seeds(300, {
    prefix: 'protected-commerce',
    family: 'commerce_transactional',
    assignmentReason: 'protected_signal_override',
  }),
  ...seeds(400, {
    prefix: 'protected-legacy',
    family: 'account_notification',
    assignmentReason: 'protected_legacy_protected_human_sender',
  }),
]
const protectedPlan = materializeGmailReviewUnits({
  parentId: 'structural.protected_trust',
  parentLabel: 'Protected / trusted senders',
  basis: 'protection-reason-first',
  actionable: true,
  artifactCutoffAt: CUTOFF,
  senders: protectedSenders,
})
assert(protectedPlan.units.every((unit) => unit.sender_count <= GMAIL_REVIEW_UNIT_HARD_MAX))
assert.equal(protectedPlan.units.reduce((sum, unit) => sum + unit.sender_count, 0), 1000)

const stableAgain = materializeGmailReviewUnits({
  parentId: 'structural.protected_trust',
  parentLabel: 'Protected / trusted senders',
  basis: 'protection-reason-first',
  actionable: true,
  artifactCutoffAt: CUTOFF,
  senders: protectedSenders.slice().reverse(),
})
assert.deepEqual(stableAgain.units, protectedPlan.units)

const unknowns = materializeGmailReviewUnits({
  parentId: 'structural.unresolved',
  parentLabel: 'Needs review senders',
  basis: 'exclusion-reason-first',
  actionable: true,
  artifactCutoffAt: CUTOFF,
  senders: [
    ...seeds(200, { prefix: 'known', exclusionReason: 'score_below_threshold' }),
    ...seeds(200, { prefix: 'unknown', exclusionReason: null }),
  ],
})
assert(unknowns.units.some((unit) => unit.label === 'Unknown exclusion reason'))

const contextPlan = materializeGmailReviewUnits({
  parentId: 'context.historical',
  parentLabel: 'Historical context',
  basis: 'family-first',
  actionable: false,
  artifactCutoffAt: CUTOFF,
  senders: seeds(500, { prefix: 'historical' }),
})
assert.equal(contextPlan.units.length, 0)
assert.equal(contextPlan.reviewUnitIdBySenderKey.size, 0)

assert.throws(
  () =>
    materializeGmailReviewUnits({
      parentId: 'structural.backlog',
      parentLabel: 'Dormant low-attention senders',
      basis: 'family-first',
      actionable: true,
      artifactCutoffAt: CUTOFF,
      senders: seeds(401, { prefix: 'unsplittable' }),
    }),
  /cannot be semantically partitioned/
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      marketing_fixture: marketing.units.map((unit) => ({
        id: unit.unit_id,
        count: unit.sender_count,
      })),
      protected_unit_counts: protectedPlan.units.map((unit) => unit.sender_count),
      unknown_remainder_visible: true,
      context_informational_only: true,
      fail_closed_over_400: true,
    },
    null,
    2
  )
)
