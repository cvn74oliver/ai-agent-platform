import assert from 'node:assert/strict'
import { materializeGmailReviewUnitWindowProjections } from '../src/lib/integrations/gmail/gmailReviewUnitWindowProjection.ts'

const tenantId = '00000000-0000-4000-8000-000000000001'
const artifactVersion = 'gmail-fixture-2026-04'
const unitA = 'family:commerce_shipping_updates'
const unitB = 'family:human_personal'
const seedRows = [
  ['sender-a@example.com', unitA],
  ['sender-b@example.com', unitA],
  ['sender-c@example.com', unitA],
  ['person@example.com', unitB],
].map(([sender_key, review_unit_id]) => ({
  tenant_id: tenantId,
  analysis_scope: 'all_indexed',
  cluster_id: 'structural.protected_trust',
  artifact_version: artifactVersion,
  review_unit_id,
  sender_key,
}))

const messagesBySender = new Map([
  [
    'sender-a@example.com',
    [
      {
        sender_key: 'sender-a@example.com',
        internal_date_ms: Date.parse('2026-02-01T12:00:00.000Z'),
        is_in_inbox: true,
        is_unread: true,
      },
      {
        sender_key: 'sender-a@example.com',
        internal_date_ms: Date.parse('2026-03-01T12:00:00.000Z'),
        is_in_inbox: false,
        is_important: true,
      },
      {
        sender_key: 'sender-a@example.com',
        internal_date_ms: Date.parse('2027-01-01T00:00:00.000Z'),
        is_in_inbox: true,
      },
    ],
  ],
  [
    'sender-b@example.com',
    [
      {
        sender_key: 'sender-b@example.com',
        internal_date_ms: Date.parse('2026-02-15T12:00:00.000Z'),
        is_in_inbox: true,
      },
    ],
  ],
  ['sender-c@example.com', []],
  [
    'person@example.com',
    [
      {
        sender_key: 'person@example.com',
        internal_date_ms: Date.parse('2026-04-12T23:59:59.000Z'),
        is_in_inbox: true,
        is_starred: true,
      },
    ],
  ],
])

const requestedBatches = []
const bundle = await materializeGmailReviewUnitWindowProjections({
  tenantId,
  workspaceId: tenantId,
  analysisScope: 'all_indexed',
  artifactVersion,
  indexedCoverageStartAt: '2026-01-01T00:00:00.000Z',
  indexedCoverageEndAt: '2026-04-12T23:59:59.000Z',
  timeZone: 'UTC',
  seedRows,
  senderBatchSize: 2,
  loadMessagesForSenderKeys: async (senderKeys) => {
    requestedBatches.push(senderKeys.slice())
    return senderKeys.flatMap((senderKey) => messagesBySender.get(senderKey) || [])
  },
})

assert.equal(bundle.manifests.length, 2)
assert.equal(requestedBatches.length, 2)
assert(requestedBatches.every((batch) => batch.length <= 2))
assert.deepEqual(bundle.validations.flatMap((validation) => validation.errors), [])

const shippingManifest = bundle.manifests.find((manifest) => manifest.reviewUnitId === unitA)
const humanManifest = bundle.manifests.find((manifest) => manifest.reviewUnitId === unitB)
assert(shippingManifest)
assert(humanManifest)
assert.equal(shippingManifest.unitEntityTotal, 3)
assert.equal(shippingManifest.allIndexedActivityTotal, 3)
assert.equal(humanManifest.unitEntityTotal, 1)
assert.equal(humanManifest.allIndexedActivityTotal, 1)
assert.equal(humanManifest.coverage.endAt, '2026-04-12T23:59:59.001Z')

const shippingAllIndexed = bundle.activityBuckets.filter(
  (row) =>
    row.reviewUnitId === unitA && row.resolution === 'all_indexed' && row.rowKind === 'entity'
)
assert.equal(shippingAllIndexed.length, 3)
assert.equal(
  shippingAllIndexed.find((row) => row.entityId === 'sender-c@example.com')?.activityCount,
  0
)
assert.equal(
  shippingAllIndexed.find((row) => row.entityId === 'sender-a@example.com')?.measurePayload
    .protected_messages,
  1
)
assert.equal(
  shippingAllIndexed.find((row) => row.entityId === 'sender-a@example.com')?.activityCount,
  2
)

await assert.rejects(
  () =>
    materializeGmailReviewUnitWindowProjections({
      tenantId,
      workspaceId: tenantId,
      analysisScope: 'all_indexed',
      artifactVersion,
      indexedCoverageStartAt: '2026-01-01T00:00:00.000Z',
      indexedCoverageEndAt: '2026-04-12T23:59:59.000Z',
      timeZone: 'UTC',
      seedRows: [...seedRows, { ...seedRows[0], review_unit_id: unitB }],
      loadMessagesForSenderKeys: async () => [],
    }),
  /assigned more than once/
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      adapter: shippingManifest.adapterId,
      stable_review_unit_ids_preserved: bundle.manifests.map((manifest) => manifest.reviewUnitId),
      fixed_membership_total: bundle.manifests.reduce(
        (sum, manifest) => sum + manifest.unitEntityTotal,
        0
      ),
      activity_total: bundle.manifests.reduce(
        (sum, manifest) => sum + manifest.allIndexedActivityTotal,
        0
      ),
      zero_activity_sender_retained: true,
      out_of_coverage_message_excluded: true,
      bounded_sender_loading: requestedBatches,
      duplicate_membership_fails_closed: true,
    },
    null,
    2
  )
)
