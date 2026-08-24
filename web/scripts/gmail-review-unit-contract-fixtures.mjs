import assert from 'node:assert/strict'
import {
  GMAIL_REVIEW_UNIT_HARD_MAX,
  materializeGmailReviewUnits,
  validateGmailReviewUnitContract,
} from '../src/lib/integrations/gmail/gmailReviewUnitContract.ts'
import {
  buildCleanupGroupPresentationPartitions,
  findDuplicateCleanupReviewUnitLabels,
  getCleanupGroupDisplayTitle,
  getCleanupGroupSection,
} from '../src/lib/runtime/cleanupGroupPresentation.ts'
import {
  buildGmailCleanupPresentationPartitionBlueprints,
  gmailCleanupCopyForHumans,
  gmailCleanupReviewUnitDisplayLabel,
} from '../src/lib/runtime/gmailSemanticPresentationPolicy.ts'
import { gmailSenderWorkspaceMatchesExpectedReviewUnitCount } from '../src/lib/runtime/gmailCleanupWorkspace.ts'

const CUTOFF = '2026-04-12T23:59:59.000Z'

assert.equal(getCleanupGroupSection('semantic.marketing_subscriptions').title, 'Start Here')
assert.equal(getCleanupGroupSection('structural.backlog').title, 'Work Through Older Items')
assert.equal(getCleanupGroupSection('structural.unresolved').title, 'Review Carefully')
assert.equal(
  getCleanupGroupSection('secondary.system_notifications').title,
  'Optional Specialized Groups'
)
assert.equal(getCleanupGroupSection('context.historical').title, 'Reference Only')
assert.equal(
  getCleanupGroupDisplayTitle('structural.backlog', 'Dormant low-attention senders'),
  'Older messages you rarely use'
)
assert.equal(
  gmailCleanupReviewUnitDisplayLabel({
    unit: {
      label: 'Promotional Cycle',
      source_key: 'promotional_cycle',
      source_kind: 'pattern_subtype',
      decomposition_path: ['pattern:promotional_cycle'],
    },
  }),
  'Recurring promotions and newsletters'
)
assert.equal(
  gmailCleanupReviewUnitDisplayLabel({
    unit: {
      label: 'Non-promotional spillover / exceptions',
      source_key: 'spillover',
      source_kind: 'spillover',
      decomposition_path: [],
    },
  }),
  'Other messages in this group'
)
assert.equal(
  gmailCleanupReviewUnitDisplayLabel({
    unit: {
      label: 'Protected Legacy Protected Human Dominant',
      source_key: 'protected_legacy_protected_human_dominant',
      source_kind: 'protection_reason',
      decomposition_path: ['protection_reason:protected_legacy_protected_human_dominant'],
    },
  }),
  'People you interact with often'
)
assert.equal(
  gmailCleanupReviewUnitDisplayLabel({
    unit: {
      label: 'Alerts Security',
      source_key: 'alerts_security',
      source_kind: 'family_lane',
      decomposition_path: ['family:security_alert'],
    },
  }),
  'Dedicated login and security alerts'
)
assert.equal(
  gmailCleanupCopyForHumans(
    'Promoted from subscription senders because marketing/promotion dominates 93%.'
  ),
  'Promoted from subscription senders because marketing/promotion makes up 93% of this group.'
)
assert.equal(
  gmailSenderWorkspaceMatchesExpectedReviewUnitCount({
    reviewUnitId: 'review-unit:example',
    expectedReviewUnitSenderCount: 39,
    actualReviewUnitSenderCount: 0,
  }),
  false
)
assert.equal(
  gmailSenderWorkspaceMatchesExpectedReviewUnitCount({
    reviewUnitId: 'review-unit:example',
    expectedReviewUnitSenderCount: 39,
    actualReviewUnitSenderCount: 39,
  }),
  true
)

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

function publishedPresentationUnit(id, senderCount, sourceKey, sourceKind, decompositionPath) {
  const sourceUnit = {
    label: sourceKey,
    source_key: sourceKey,
    source_kind: sourceKind,
    decomposition_path: decompositionPath,
  }
  return {
    id,
    senderCount,
    sourceKey,
    sourceKind,
    decompositionPath,
    label: gmailCleanupReviewUnitDisplayLabel({ unit: sourceUnit }),
  }
}

const publishedProtectedUnits = [
  publishedPresentationUnit('purchases-volume-1', 170, '1_message', 'volume_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:over_365_days',
    'volume:1_message',
  ]),
  publishedPresentationUnit('purchases-volume-2-5', 130, '2_5_messages', 'volume_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:over_365_days',
    'volume:2_5_messages',
  ]),
  publishedPresentationUnit('purchases-volume-6-20', 27, '6_20_messages', 'volume_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:over_365_days',
    'volume:6_20_messages',
  ]),
  publishedPresentationUnit('purchases-recency-31-90', 4, '31_90_days', 'recency_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:31_90_days',
  ]),
  publishedPresentationUnit('purchases-recency-91-365', 61, '91_365_days', 'recency_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:91_365_days',
  ]),
  publishedPresentationUnit('purchases-recency-0-30', 3, '0_30_days', 'recency_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:0_30_days',
  ]),
  publishedPresentationUnit(
    'purchases-shipping',
    176,
    'commerce_shipping_updates',
    'family_subtype',
    ['family:commerce_transactional']
  ),
  publishedPresentationUnit('purchases-invoices', 138, 'invoices_receipts', 'family_lane', [
    'family:commerce_transactional',
  ]),
  publishedPresentationUnit('purchases-volume-over-20', 2, 'over_20_messages', 'volume_band', [
    'family:commerce_transactional',
    'pattern:transactional_cycle',
    'recency:over_365_days',
    'volume:over_20_messages',
  ]),
  publishedPresentationUnit('account-general', 205, 'general_updates', 'family_lane', [
    'family:account_notification',
  ]),
  publishedPresentationUnit('account-security', 124, 'security_alert', 'family_lane', [
    'family:security_alert',
  ]),
  publishedPresentationUnit('account-security-pattern', 4, 'security_cycle', 'pattern_subtype', [
    'family:commerce_transactional',
    'pattern:security_cycle',
  ]),
  publishedPresentationUnit('account-service-pattern', 26, 'service_update_cycle', 'pattern_subtype', [
    'family:commerce_transactional',
    'pattern:service_update_cycle',
  ]),
  publishedPresentationUnit('people-pattern', 28, 'human_correspondence_cycle', 'pattern_subtype', [
    'family:commerce_transactional',
    'pattern:human_correspondence_cycle',
  ]),
  publishedPresentationUnit('people-direct', 59, 'human_personal', 'family_lane', [
    'family:human_personal',
  ]),
  publishedPresentationUnit(
    'people-frequent',
    154,
    'protected_legacy_protected_human_dominant',
    'protection_reason',
    ['protection_reason:protected_legacy_protected_human_dominant']
  ),
  publishedPresentationUnit(
    'people-known',
    32,
    'protected_legacy_protected_human_sender',
    'protection_reason',
    ['protection_reason:protected_legacy_protected_human_sender']
  ),
  publishedPresentationUnit('services-marketing', 239, 'marketing_promotional', 'family_lane', [
    'family:marketing_promotional',
  ]),
  publishedPresentationUnit(
    'services-other-account',
    273,
    'non_promotional_spillover',
    'spillover',
    ['family:account_notification']
  ),
  publishedPresentationUnit('services-promotional-pattern', 5, 'promotional_cycle', 'pattern_subtype', [
    'family:commerce_transactional',
    'pattern:promotional_cycle',
  ]),
  publishedPresentationUnit('services-social', 7, 'social_community', 'family_lane', [
    'family:social_community',
  ]),
]
const protectedPresentationBlueprints = buildGmailCleanupPresentationPartitionBlueprints({
  canonicalClusterId: 'structural.protected_trust',
  reviewUnits: publishedProtectedUnits,
})
assert(protectedPresentationBlueprints)
const protectedPresentation = buildCleanupGroupPresentationPartitions({
  parentId: 'structural.protected_trust',
  parentSenderCount: 1867,
  reviewUnits: publishedProtectedUnits,
  blueprints: protectedPresentationBlueprints,
})
assert.deepEqual(protectedPresentation.errors, [])
assert.deepEqual(
  protectedPresentation.partitions.map((partition) => partition.senderCount),
  [273, 359, 711, 524]
)
assert.equal(
  protectedPresentation.partitions.reduce((sum, partition) => sum + partition.senderCount, 0),
  1867
)
assert.deepEqual(findDuplicateCleanupReviewUnitLabels(publishedProtectedUnits), [])
assert.equal(
  publishedProtectedUnits.find((unit) => unit.id === 'purchases-recency-31-90')?.label,
  'Last email from these senders was 31–90 days ago'
)
assert.equal(
  publishedProtectedUnits.find((unit) => unit.id === 'purchases-volume-6-20')?.label,
  'Received 6–20 emails from each sender'
)

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
      protected_presentation_group_counts: protectedPresentation.partitions.map(
        (partition) => partition.senderCount
      ),
      visible_labels_unique: true,
      unknown_remainder_visible: true,
      context_informational_only: true,
      fail_closed_over_400: true,
    },
    null,
    2
  )
)
