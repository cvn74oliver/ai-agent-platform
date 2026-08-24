import assert from 'node:assert/strict'
import {
  materializeReviewUnitWindowProjection,
  resolveReviewUnitWindow,
} from '../src/lib/runtime/reviewUnitWindowProjection.ts'

const coverage = {
  startAt: '2026-01-01T00:00:00.000Z',
  endAt: '2026-05-01T00:00:00.000Z',
  timeZone: 'UTC',
}

function identity(overrides = {}) {
  return {
    tenantId: '00000000-0000-4000-8000-000000000001',
    workspaceType: 'portfolio_management',
    workspaceId: '00000000-0000-4000-8000-000000000010',
    workflowId: 'position_review',
    decisionSubjectType: 'position',
    analysisScope: 'all_indexed',
    parentId: 'portfolio.risk_review',
    artifactVersion: 'fixture-2026-05',
    reviewUnitId: 'review-unit:portfolio-risk:high-volatility',
    ...overrides,
  }
}

const cryptoProjection = materializeReviewUnitWindowProjection({
  identity: identity(),
  adapterId: 'portfolio.position_activity',
  adapterSchemaVersion: 1,
  memberEntityIds: ['btc', 'eth', 'sol', 'cash'],
  coverage,
  events: [
    {
      entityId: 'btc',
      occurredAt: '2026-01-15T10:00:00.000Z',
      activityCount: 2,
      measurePayload: { fills: 2, notional_units: 40 },
    },
    {
      entityId: 'eth',
      occurredAt: '2026-03-01T10:00:00.000Z',
      activityCount: 1,
      measurePayload: { fills: 1, notional_units: 10 },
    },
    {
      entityId: 'btc',
      occurredAt: '2026-03-01T11:00:00.000Z',
      activityCount: 3,
      measurePayload: { fills: 3, notional_units: 60 },
    },
  ],
  metadata: { measure_label: 'Portfolio activity' },
})

assert.deepEqual(cryptoProjection.validation.errors, [])
assert.equal(cryptoProjection.manifest.unitEntityTotal, 4)
assert.equal(cryptoProjection.validation.activityEntityTotal, 4)
assert.equal(cryptoProjection.validation.activeEntityTotal, 2)
assert.equal(cryptoProjection.validation.allIndexedActivityTotal, 6)
assert.equal(cryptoProjection.validation.dailyActivityTotal, 6)
assert.equal(cryptoProjection.validation.monthlyActivityTotal, 6)
const cryptoAllIndexedRows = cryptoProjection.activityBuckets.filter(
  (row) => row.resolution === 'all_indexed' && row.rowKind === 'entity'
)
assert.equal(cryptoAllIndexedRows.length, 4)
assert.equal(cryptoAllIndexedRows.find((row) => row.entityId === 'cash')?.activityCount, 0)
assert.equal(cryptoAllIndexedRows.find((row) => row.entityId === 'sol')?.activityCount, 0)

const cryptoStableAgain = materializeReviewUnitWindowProjection({
  identity: identity(),
  adapterId: 'portfolio.position_activity',
  adapterSchemaVersion: 1,
  memberEntityIds: ['sol', 'btc', 'cash', 'eth'],
  coverage,
  events: [
    {
      entityId: 'btc',
      occurredAt: '2026-03-01T11:00:00.000Z',
      activityCount: 3,
      measurePayload: { notional_units: 60, fills: 3 },
    },
    {
      entityId: 'btc',
      occurredAt: '2026-01-15T10:00:00.000Z',
      activityCount: 2,
      measurePayload: { notional_units: 40, fills: 2 },
    },
    {
      entityId: 'eth',
      occurredAt: '2026-03-01T10:00:00.000Z',
      activityCount: 1,
      measurePayload: { notional_units: 10, fills: 1 },
    },
  ],
  metadata: { measure_label: 'Portfolio activity' },
})
assert.equal(cryptoStableAgain.manifest.membershipHash, cryptoProjection.manifest.membershipHash)
assert.equal(cryptoStableAgain.manifest.projectionHash, cryptoProjection.manifest.projectionHash)

const taxProjection = materializeReviewUnitWindowProjection({
  identity: identity({
    workspaceType: 'tax_accounting',
    workflowId: 'transaction_review',
    decisionSubjectType: 'transaction',
    parentId: 'tax.transactions_needing_decisions',
    reviewUnitId: 'review-unit:tax:missing-documentation',
  }),
  adapterId: 'tax.transaction_activity',
  adapterSchemaVersion: 1,
  memberEntityIds: ['txn-1', 'txn-2', 'txn-3'],
  coverage,
  events: [
    {
      entityId: 'txn-1',
      occurredAt: '2026-02-10T12:00:00.000Z',
      activityCount: 1,
      measurePayload: { evidence_updates: 1 },
    },
  ],
  metadata: { measure_label: 'Evidence updates' },
})
assert.deepEqual(taxProjection.validation.errors, [])
assert.equal(taxProjection.manifest.unitEntityTotal, 3)
assert.equal(taxProjection.validation.activeEntityTotal, 1)

const clampedCustom = resolveReviewUnitWindow({
  coverage,
  request: {
    kind: 'custom',
    requestedStartAt: '2025-12-01T00:00:00.000Z',
    requestedEndAt: '2026-08-01T00:00:00.000Z',
    timeZone: 'UTC',
  },
})
assert.equal(clampedCustom.effectiveStartAt, coverage.startAt)
assert.equal(clampedCustom.effectiveEndAt, coverage.endAt)
assert.equal(clampedCustom.clampedStart, true)
assert.equal(clampedCustom.clampedEnd, true)

const readyEmpty = resolveReviewUnitWindow({
  coverage,
  request: {
    kind: 'custom',
    requestedStartAt: '2027-01-01T00:00:00.000Z',
    requestedEndAt: '2027-02-01T00:00:00.000Z',
    timeZone: 'UTC',
  },
})
assert.equal(readyEmpty.empty, true)
assert.equal(readyEmpty.effectiveStartAt, readyEmpty.effectiveEndAt)

assert.throws(
  () =>
    materializeReviewUnitWindowProjection({
      identity: identity(),
      adapterId: 'portfolio.position_activity',
      adapterSchemaVersion: 1,
      memberEntityIds: ['btc'],
      coverage,
      events: [
        {
          entityId: 'unknown-position',
          occurredAt: '2026-03-01T00:00:00.000Z',
          activityCount: 1,
        },
      ],
    }),
  /non-member entity/
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      platform_generic: true,
      crypto: {
        fixed_members: cryptoProjection.manifest.unitEntityTotal,
        active_members: cryptoProjection.validation.activeEntityTotal,
        activity_total: cryptoProjection.validation.allIndexedActivityTotal,
      },
      tax: {
        fixed_members: taxProjection.manifest.unitEntityTotal,
        active_members: taxProjection.validation.activeEntityTotal,
      },
      stable_membership_and_projection_hashes: true,
      zero_activity_members_retained: true,
      custom_bounds_clamped_to_coverage: true,
      ready_empty_window_supported: true,
      cross_membership_activity_fails_closed: true,
    },
    null,
    2
  )
)
