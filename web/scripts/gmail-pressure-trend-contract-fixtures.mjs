import assert from 'node:assert/strict'
import {
  buildGmailPressureTrendData,
  pressureTrendResolvedWindow,
} from '../src/lib/integrations/gmail/inboxAnalysis.ts'
import { normalizePublishedPressureTrendSeries } from '../src/lib/integrations/gmail/gmailCleanupWorkspace.ts'

const aprilEnd = Date.parse('2026-04-12T00:00:00.000Z')
const firstRealMessage = Date.parse('2022-12-02T00:00:00.000Z')
const coverage = {
  indexed_total_rows: 3,
  indexed_inbox_rows: 3,
  indexed_date_span_start: '1970-01-01T00:00:00.000Z',
  indexed_date_span_end: '2026-08-21T00:00:00.000Z',
}
const rows = [
  { internal_date_ms: 0 },
  { internal_date_ms: firstRealMessage },
  { internal_date_ms: aprilEnd },
]

const allIndexed = buildGmailPressureTrendData({
  rows,
  coverage,
  pressureWindow: 'all_indexed',
  timeZone: 'UTC',
  nowMs: Date.parse('2026-08-21T00:00:00.000Z'),
})
assert.equal(allIndexed.ok, true)
assert.equal(allIndexed.data.window.effective_start, new Date(firstRealMessage).toISOString())
assert.equal(allIndexed.data.window.effective_end, new Date(aprilEnd).toISOString())
assert.equal(allIndexed.data.series[0].label, 'Q4 2022')
assert.equal(allIndexed.data.series.at(-1).label, 'Q2 2026')
assert(!allIndexed.data.series.some((bucket) => bucket.label.includes('1970')))

const legacyPublishedArtifact = normalizePublishedPressureTrendSeries({
  indexedDateSpanStart: '1970-01-01T00:00:00.000Z',
  indexedDateSpanEnd: '2024-12-31T23:59:59.999Z',
  series: [
    {
      label: '1970',
      count: 0,
      composition: [],
      evidence_signals: [],
      bucket_start_at: '1970-01-01T00:00:00.000Z',
      bucket_end_at: '1970-12-31T23:59:59.999Z',
    },
    {
      label: '1971',
      count: 0,
      composition: [],
      evidence_signals: [],
      bucket_start_at: '1971-01-01T00:00:00.000Z',
      bucket_end_at: '1971-12-31T23:59:59.999Z',
    },
    {
      label: '2022',
      count: 12,
      composition: [],
      evidence_signals: [],
      bucket_start_at: '2022-01-01T00:00:00.000Z',
      bucket_end_at: '2022-12-31T23:59:59.999Z',
    },
    {
      label: '2023',
      count: 0,
      composition: [],
      evidence_signals: [],
      bucket_start_at: '2023-01-01T00:00:00.000Z',
      bucket_end_at: '2023-12-31T23:59:59.999Z',
    },
    {
      label: '2024',
      count: 4,
      composition: [],
      evidence_signals: [],
      bucket_start_at: '2024-01-01T00:00:00.000Z',
      bucket_end_at: '2024-12-31T23:59:59.999Z',
    },
  ],
})
assert.equal(legacyPublishedArtifact.indexedDateSpanStart, '2022-01-01T00:00:00.000Z')
assert.equal(legacyPublishedArtifact.indexedDateSpanEnd, '2024-12-31T23:59:59.999Z')
assert.deepEqual(
  legacyPublishedArtifact.series.map((bucket) => bucket.label),
  ['2022', '2023', '2024']
)

const validPublishedCoverage = normalizePublishedPressureTrendSeries({
  indexedDateSpanStart: '2022-12-02T00:00:00.000Z',
  indexedDateSpanEnd: '2024-12-31T23:59:59.999Z',
  series: legacyPublishedArtifact.series,
})
assert.equal(validPublishedCoverage.indexedDateSpanStart, '2022-12-02T00:00:00.000Z')
assert.deepEqual(
  validPublishedCoverage.series.map((bucket) => bucket.label),
  ['2022', '2023', '2024']
)

const lastMonth = pressureTrendResolvedWindow({
  coverage,
  pressureWindow: 'last_month',
  timeZone: 'UTC',
  nowMs: Date.parse('2026-08-21T00:00:00.000Z'),
  rowStartMs: firstRealMessage,
  rowEndMs: aprilEnd,
})
assert.equal(lastMonth.ok, true)
assert.equal(lastMonth.data.effectiveEndExclusiveMs, aprilEnd + 1)
assert(lastMonth.data.effectiveStartMs >= Date.parse('2026-03-13T00:00:00.000Z'))

const custom = pressureTrendResolvedWindow({
  coverage,
  pressureWindow: 'custom',
  pressureStart: '2026-04-01',
  pressureEnd: '2026-08-21',
  timeZone: 'UTC',
  nowMs: Date.parse('2026-08-21T00:00:00.000Z'),
  rowStartMs: firstRealMessage,
  rowEndMs: aprilEnd,
})
assert.equal(custom.ok, true)
assert.equal(custom.data.effectiveEndExclusiveMs, aprilEnd + 1)
assert.equal(custom.data.limitedByIndexedCoverage, true)

const emptyCoverage = buildGmailPressureTrendData({
  rows: [],
  coverage: {
    indexed_total_rows: 0,
    indexed_inbox_rows: 0,
    indexed_date_span_start: null,
    indexed_date_span_end: null,
  },
  pressureWindow: 'all_indexed',
  timeZone: 'UTC',
  nowMs: Date.parse('2026-08-21T00:00:00.000Z'),
})
assert.equal(emptyCoverage.ok, true)
assert.equal(emptyCoverage.data.window.effective_start, null)
assert.equal(emptyCoverage.data.window.effective_end, null)
assert.deepEqual(emptyCoverage.data.series, [])

const emptySeedWithRealCoverage = buildGmailPressureTrendData({
  rows: [],
  coverage: {
    indexed_total_rows: 3,
    indexed_inbox_rows: 3,
    indexed_date_span_start: new Date(firstRealMessage).toISOString(),
    indexed_date_span_end: new Date(aprilEnd).toISOString(),
  },
  pressureWindow: 'all_indexed',
  timeZone: 'UTC',
  nowMs: Date.parse('2026-08-21T00:00:00.000Z'),
})
assert.equal(emptySeedWithRealCoverage.ok, true)
assert.equal(emptySeedWithRealCoverage.data.window.effective_start, new Date(firstRealMessage).toISOString())
assert.equal(emptySeedWithRealCoverage.data.window.effective_end, new Date(aprilEnd).toISOString())
assert(emptySeedWithRealCoverage.data.series.length > 0)
assert(emptySeedWithRealCoverage.data.series.every((bucket) => bucket.count === 0))
assert(!emptySeedWithRealCoverage.data.series.some((bucket) => bucket.label.includes('1970')))

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      all_indexed_start: allIndexed.data.window.effective_start,
      all_indexed_end: allIndexed.data.window.effective_end,
      bucket_count: allIndexed.data.series.length,
      last_month_end: new Date(lastMonth.data.effectiveEndExclusiveMs - 1).toISOString(),
      custom_end: new Date(custom.data.effectiveEndExclusiveMs - 1).toISOString(),
      empty_coverage_ready: emptyCoverage.data.series.length === 0,
      empty_seed_coverage_buckets: emptySeedWithRealCoverage.data.series.length,
      legacy_artifact_start: legacyPublishedArtifact.indexedDateSpanStart,
      legacy_internal_zero_preserved: legacyPublishedArtifact.series[1]?.label === '2023',
    },
    null,
    2
  )
)
