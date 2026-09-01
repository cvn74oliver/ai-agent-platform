import assert from 'node:assert/strict'
import { materializeGmailReviewUnitWindowProjections } from '../src/lib/integrations/gmail/gmailReviewUnitWindowProjection.ts'
import {
  resolvePublishedReviewUnitProjectionWindow,
  resolveReviewUnitProjectionIdentity,
} from '../src/lib/integrations/gmail/gmailCleanupWorkspace.ts'

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

function manifestSupabase(rows, observedMatches, artifactRows = []) {
  return {
    from(table) {
      assert.equal(table, 'workspace_review_unit_projection_manifests')
      let matchedValues = {}
      return {
        select() {
          return this
        },
        match(values) {
          matchedValues = values
          observedMatches.push(values)
          return this
        },
        order() {
          return this
        },
        async limit(value) {
          const exactReviewUnitQuery = typeof matchedValues.review_unit_id === 'string'
          assert.equal(value, exactReviewUnitQuery ? 2 : 1)
          return { data: exactReviewUnitQuery ? rows : artifactRows, error: null }
        },
      }
    },
  }
}

const manifestMatches = []
const compositeIdentity = await resolveReviewUnitProjectionIdentity({
  supabase: manifestSupabase(
    [
      {
        parent_id: 'semantic-parent:subscription-senders:family:marketing_promotional',
        validation_status: 'candidate_validated',
        coverage_start_at: '2022-12-02T14:20:51.000Z',
        coverage_end_at: '2026-08-15T07:49:35.001Z',
        projection_timezone: 'UTC',
      },
    ],
    manifestMatches
  ),
  tenantId,
  analysisScope: 'all_indexed',
  artifactVersion: `${artifactVersion}-identity-composite`,
  reviewUnitId: 'review-unit:semantic-parent:marketing-promotional:remainder',
  legacyParentId: 'semantic.marketing_subscriptions',
})
assert.deepEqual(compositeIdentity, {
  source: 'published_manifest',
  parentId: 'semantic-parent:subscription-senders:family:marketing_promotional',
  coverageStartAt: '2022-12-02T14:20:51.000Z',
  coverageEndAt: '2026-08-15T07:49:35.001Z',
  timeZone: 'UTC',
})
assert.equal(manifestMatches[0].review_unit_id, 'review-unit:semantic-parent:marketing-promotional:remainder')
assert.equal(manifestMatches[0].artifact_version, `${artifactVersion}-identity-composite`)

assert.deepEqual(
  resolvePublishedReviewUnitProjectionWindow({
    window: 'last_month',
    start: null,
    end: null,
    coverageStartAt: compositeIdentity.coverageStartAt,
    coverageEndAt: compositeIdentity.coverageEndAt,
    timeZone: compositeIdentity.timeZone,
  }),
  { start: '2026-07-17', end: '2026-08-15', timeZone: 'UTC' }
)

const legacyIdentity = await resolveReviewUnitProjectionIdentity({
  supabase: manifestSupabase([], []),
  tenantId,
  analysisScope: 'all_indexed',
  artifactVersion: `${artifactVersion}-identity-legacy`,
  reviewUnitId: 'family:legacy-child',
  legacyParentId: 'legacy.parent',
})
assert.deepEqual(legacyIdentity, { source: 'legacy_artifact', parentId: 'legacy.parent' })

await assert.rejects(
  () =>
    resolveReviewUnitProjectionIdentity({
      supabase: manifestSupabase([], [], [{ review_unit_id: 'family:another-current-unit' }]),
      tenantId,
      analysisScope: 'all_indexed',
      artifactVersion: `${artifactVersion}-identity-current-missing-exact`,
      reviewUnitId: 'family:missing-current-child',
      legacyParentId: 'legacy.parent',
    }),
  /identity is missing/
)

await assert.rejects(
  () =>
    resolveReviewUnitProjectionIdentity({
      supabase: manifestSupabase(
        [
          {
            parent_id: 'parent:a',
            validation_status: 'candidate_validated',
            coverage_start_at: '2026-01-01T00:00:00.000Z',
            coverage_end_at: '2026-08-15T00:00:00.000Z',
            projection_timezone: 'UTC',
          },
          {
            parent_id: 'parent:b',
            validation_status: 'candidate_validated',
            coverage_start_at: '2026-01-01T00:00:00.000Z',
            coverage_end_at: '2026-08-15T00:00:00.000Z',
            projection_timezone: 'UTC',
          },
        ],
        []
      ),
      tenantId,
      analysisScope: 'all_indexed',
      artifactVersion: `${artifactVersion}-identity-ambiguous`,
      reviewUnitId: 'family:ambiguous-child',
      legacyParentId: 'legacy.parent',
    }),
  /ambiguous/
)

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
      manifest_parent_identity_is_authoritative: true,
      legacy_fallback_requires_absent_projection_manifest: true,
      current_artifact_missing_exact_manifest_fails_closed: true,
      ambiguous_manifest_identity_fails_closed: true,
    },
    null,
    2
  )
)
