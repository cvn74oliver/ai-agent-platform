import assert from 'node:assert/strict'
import {
  resolveGmailFreshHeadRecoveryBridge,
  resolveGmailRecoveryBridgeLookupBefore,
  resolveGmailRecoveryBridgeOutcome,
} from '../src/lib/integrations/gmail/gmailMailboxIndexer.ts'

const nowMs = Date.parse('2026-08-15T12:00:00.000Z')

const priorSegmentLookupBefore = resolveGmailRecoveryBridgeLookupBefore({
  lastTerminalReason: 'recent_window_reached',
  lastYieldDetail: {
    inserted_rows: 7_000,
    updated_rows: 0,
    already_indexed_rows: 0,
    existing_rows_seen: 0,
    oldest_message_seen_at: '2026-07-01T08:30:56.000Z',
    newest_message_seen_at: '2026-08-15T07:49:35.000Z',
    next_page_token_present: true,
  },
})
assert.equal(priorSegmentLookupBefore, '2026-07-01T08:30:56.000Z')
assert.equal(
  resolveGmailRecoveryBridgeLookupBefore({
    lastTerminalReason: 'gmail_pagination_exhausted',
    lastYieldDetail: {
      inserted_rows: 7_000,
      updated_rows: 0,
      already_indexed_rows: 0,
      existing_rows_seen: 0,
      oldest_message_seen_at: '2026-07-01T08:30:56.000Z',
      newest_message_seen_at: '2026-08-15T07:49:35.000Z',
      next_page_token_present: false,
    },
  }),
  null
)

const priorContinuityBridge = resolveGmailFreshHeadRecoveryBridge({
  nowMs,
  recentRecoveryWindowDays: 45,
  indexedBoundaryAt: '2026-04-15T18:30:00.000Z',
  overlapDays: 2,
})
assert.deepEqual(priorContinuityBridge, {
  boundary_at: '2026-04-15T18:30:00.000Z',
  cutoff_at: '2026-04-13T00:00:00.000Z',
  source: 'indexed_continuity',
})

const resumedBridge = resolveGmailFreshHeadRecoveryBridge({
  nowMs,
  recentRecoveryWindowDays: 45,
  indexedBoundaryAt: '2026-08-15T08:00:00.000Z',
  persistedBoundaryAt: priorContinuityBridge.boundary_at,
  overlapDays: 2,
})
assert.deepEqual(resumedBridge, {
  boundary_at: '2026-04-15T18:30:00.000Z',
  cutoff_at: '2026-04-13T00:00:00.000Z',
  source: 'persisted_bridge',
})

const recentContinuityBridge = resolveGmailFreshHeadRecoveryBridge({
  nowMs,
  recentRecoveryWindowDays: 45,
  indexedBoundaryAt: '2026-08-01T12:00:00.000Z',
  overlapDays: 2,
})
assert.deepEqual(recentContinuityBridge, {
  boundary_at: '2026-08-01T12:00:00.000Z',
  cutoff_at: '2026-07-02T00:00:00.000Z',
  source: 'indexed_continuity',
})

const emptyIndexBridge = resolveGmailFreshHeadRecoveryBridge({
  nowMs,
  recentRecoveryWindowDays: 45,
  indexedBoundaryAt: null,
})
assert.deepEqual(emptyIndexBridge, {
  boundary_at: null,
  cutoff_at: '2026-07-02T00:00:00.000Z',
  source: 'fixed_recent_window',
})

assert.equal(
  resolveGmailRecoveryBridgeOutcome({
    bridgeActive: true,
    boundaryReached: true,
    stoppedOnEmptyPage: false,
    nextPageTokenPresent: true,
    processedMessages: 1_900,
    maxMessages: 2_500,
  }),
  'completed'
)
assert.equal(
  resolveGmailRecoveryBridgeOutcome({
    bridgeActive: true,
    boundaryReached: false,
    stoppedOnEmptyPage: false,
    nextPageTokenPresent: true,
    processedMessages: 2_500,
    maxMessages: 2_500,
  }),
  'yielded'
)
assert.equal(
  resolveGmailRecoveryBridgeOutcome({
    bridgeActive: false,
    boundaryReached: false,
    stoppedOnEmptyPage: false,
    nextPageTokenPresent: true,
    processedMessages: 2_500,
    maxMessages: 2_500,
  }),
  'inactive'
)

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      prior_segment_lookup_before: priorSegmentLookupBefore,
      prior_boundary_cutoff: priorContinuityBridge.cutoff_at,
      resumed_boundary_source: resumedBridge.source,
      fixed_window_cutoff: emptyIndexBridge.cutoff_at,
      bridge_outcomes: ['completed', 'yielded', 'inactive'],
    },
    null,
    2
  )
)
