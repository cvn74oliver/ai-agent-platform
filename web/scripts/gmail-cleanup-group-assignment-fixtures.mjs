import assert from 'node:assert/strict'

const {
  assignSenderCleanupGroupDecision,
  classifySenderCleanupClusterDecision,
  isCleanupCandidateGroupId,
  normalizeSender,
} = await import('../src/lib/integrations/gmail/inboxAnalysis.ts')
const {
  buildGmailArtifactDerivedRows,
  buildWholeMailboxAggregateFromRows,
  projectGmailSenderArtifactSlice,
} = await import('../src/lib/integrations/gmail/gmailArtifactFullMailboxProjector.ts')
const {
  GMAIL_CLEANUP_EXCLUSION_REASONS,
} = await import('../src/lib/runtime/gmailCleanupWorkspace.ts')

const ANALYSIS_SCOPE = 'all_indexed'
const ARTIFACT_VERSION = 'fixture-cleanup-group-assignment'
const TENANT_ID = 'fixture-tenant'
const NOW_MS = Date.parse('2026-03-25T12:00:00.000Z')

let messageCounter = 0

function isoFromMs(value) {
  return new Date(value).toISOString()
}

function makeRow(params) {
  messageCounter += 1
  const timestamp = NOW_MS - (params.daysAgo || 0) * 24 * 60 * 60 * 1000 - messageCounter * 1000
  const categories = Array.isArray(params.category_labels) ? params.category_labels : ['CATEGORY_UPDATES']
  const labelIds = [
    ...(params.is_in_inbox === false ? [] : ['INBOX']),
    ...(params.is_unread ? ['UNREAD'] : []),
    ...(params.is_important ? ['IMPORTANT'] : []),
    ...(params.is_starred ? ['STARRED'] : []),
    ...categories,
  ]
  const sender = params.sender
  return {
    tenant_id: TENANT_ID,
    message_id: `fixture-message-${String(messageCounter).padStart(4, '0')}`,
    thread_id: `fixture-thread-${String(messageCounter).padStart(4, '0')}`,
    sender,
    sender_key: normalizeSender(sender),
    subject: params.subject || 'Hello there',
    internal_date_ms: timestamp,
    date: isoFromMs(timestamp),
    label_ids: Array.from(new Set(labelIds)),
    category_labels: categories,
    is_in_inbox: params.is_in_inbox !== false,
    is_unread: params.is_unread === true,
    is_starred: params.is_starred === true,
    is_important: params.is_important === true,
    indexed_at: isoFromMs(NOW_MS),
    updated_at: isoFromMs(NOW_MS),
  }
}

function rowsFor(sender, definitions) {
  return definitions.map((definition) => makeRow({ sender, ...definition }))
}

const fixtureCases = [
  {
    id: 'subscription_safe_rows',
    sender: 'newsletter@updates.example',
    rows: rowsFor('newsletter@updates.example', [
      {
        subject: 'Weekly newsletter',
        category_labels: ['CATEGORY_PROMOTIONS'],
        daysAgo: 2,
      },
      {
        subject: 'Manage preferences for your newsletter',
        category_labels: ['CATEGORY_PROMOTIONS'],
        daysAgo: 5,
      },
      {
        subject: 'Digest roundup',
        category_labels: ['CATEGORY_PROMOTIONS'],
        daysAgo: 9,
      },
    ]),
    expectedLegacyClusterId: 'subscription-senders',
    expectedLegacyExclusionReason: null,
    expectedAssignedGroupId: 'subscription-senders',
    expectedAssignmentReason: 'behavioral_safe_rows',
    expectedCleanupCandidate: true,
  },
  {
    id: 'system_broader_rows_rescue',
    sender: 'alerts@service.example',
    rows: rowsFor('alerts@service.example', [
      {
        subject: 'Notification code',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 1,
      },
      {
        subject: 'Notification code',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 3,
      },
      {
        subject: 'Notification code',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 7,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'too_few_safe_rows',
    expectedAssignedGroupId: 'system-notification-senders',
    expectedAssignmentReason: 'behavioral_broader_rows',
    expectedCleanupCandidate: true,
  },
  {
    id: 'protected_explicit_star_override',
    sender: 'alerts-starred@service.example',
    rows: rowsFor('alerts-starred@service.example', [
      {
        subject: 'Notification code',
        category_labels: ['CATEGORY_UPDATES'],
        is_starred: true,
        daysAgo: 1,
      },
      {
        subject: 'Notification code',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 4,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'too_few_safe_rows',
    expectedAssignedGroupId: 'protected-trusted-senders',
    expectedAssignmentReason: 'protected_signal_override',
    expectedCleanupCandidate: false,
  },
  {
    id: 'historical_no_inbox_rows',
    sender: 'archive-only@history.example',
    rows: rowsFor('archive-only@history.example', [
      {
        subject: 'Past receipt',
        category_labels: ['CATEGORY_UPDATES'],
        is_in_inbox: false,
        daysAgo: 30,
      },
      {
        subject: 'Archived note',
        category_labels: ['CATEGORY_UPDATES'],
        is_in_inbox: false,
        daysAgo: 60,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'no_inbox_rows',
    expectedAssignedGroupId: 'historical-out-of-inbox-senders',
    expectedAssignmentReason: 'historical_no_inbox_rows',
    expectedCleanupCandidate: false,
  },
  {
    id: 'historical_protected_overlap',
    sender: 'vip@archive.example',
    rows: rowsFor('vip@archive.example', [
      {
        subject: 'Saved thread',
        category_labels: ['CATEGORY_UPDATES'],
        is_in_inbox: false,
        is_important: true,
        daysAgo: 20,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'no_inbox_rows',
    expectedAssignedGroupId: 'protected-trusted-senders',
    expectedAssignmentReason: 'protected_signal_override',
    expectedCleanupCandidate: false,
  },
  {
    id: 'needs_review_no_safe_rows',
    sender: 'mailer-daemon@primary.example',
    rows: rowsFor('mailer-daemon@primary.example', [
      {
        subject: 'Hello there',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 1,
      },
      {
        subject: 'Hello there again',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 8,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'no_safe_rows',
    expectedAssignedGroupId: 'needs-review-senders',
    expectedAssignmentReason: 'needs_review_no_safe_rows',
    expectedCleanupCandidate: false,
  },
  {
    id: 'needs_review_too_few_safe_rows',
    sender: 'mailer-daemon@misc.example',
    rows: rowsFor('mailer-daemon@misc.example', [
      {
        subject: 'Hello there',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 1,
      },
      {
        subject: 'Hello there',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 3,
      },
      {
        subject: 'Hello there',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 7,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'too_few_safe_rows',
    expectedAssignedGroupId: 'needs-review-senders',
    expectedAssignmentReason: 'needs_review_too_few_safe_rows',
    expectedCleanupCandidate: false,
  },
  {
    id: 'needs_review_safe_ratio_too_low',
    sender: 'no-reply@ratio.example',
    rows: rowsFor('no-reply@ratio.example', [
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 1,
      },
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 4,
      },
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 7,
      },
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 12,
      },
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 18,
      },
      {
        subject: 'Status note',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 25,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'safe_ratio_too_low',
    expectedAssignedGroupId: 'needs-review-senders',
    expectedAssignmentReason: 'needs_review_safe_ratio_too_low',
    expectedCleanupCandidate: false,
  },
  {
    id: 'protected_human_sender',
    sender: 'alex@consulting.example',
    rows: rowsFor('alex@consulting.example', [
      {
        subject: 'Follow up on invoice',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 1,
      },
      {
        subject: 'Question about payment',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 4,
      },
      {
        subject: 'Thanks for the follow up',
        category_labels: ['CATEGORY_UPDATES'],
        is_important: true,
        daysAgo: 6,
      },
      {
        subject: 'Please review invoice',
        category_labels: ['CATEGORY_UPDATES'],
        is_important: true,
        daysAgo: 9,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'protected_human_sender',
    expectedAssignedGroupId: 'protected-trusted-senders',
    expectedAssignmentReason: 'protected_legacy_protected_human_sender',
    expectedCleanupCandidate: false,
  },
  {
    id: 'protected_human_dominant',
    sender: 'team@company.example',
    rows: rowsFor('team@company.example', [
      {
        subject: 'Project status',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 1,
      },
      {
        subject: 'Project status',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 3,
      },
      {
        subject: 'Project status',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 8,
      },
      {
        subject: 'Project status',
        category_labels: ['CATEGORY_PRIMARY'],
        daysAgo: 13,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'protected_human_dominant',
    expectedAssignedGroupId: 'protected-trusted-senders',
    expectedAssignmentReason: 'protected_legacy_protected_human_dominant',
    expectedCleanupCandidate: false,
  },
  {
    id: 'needs_review_score_below_threshold',
    sender: 'hello@misc.example',
    rows: rowsFor('hello@misc.example', [
      {
        subject: 'Hello there',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 2,
      },
      {
        subject: 'Checking in',
        category_labels: ['CATEGORY_UPDATES'],
        daysAgo: 10,
      },
    ]),
    expectedLegacyClusterId: null,
    expectedLegacyExclusionReason: 'score_below_threshold',
    expectedAssignedGroupId: 'needs-review-senders',
    expectedAssignmentReason: 'needs_review_score_below_threshold',
    expectedCleanupCandidate: false,
  },
]

for (const fixtureCase of fixtureCases) {
  const legacy = classifySenderCleanupClusterDecision({
    sender: fixtureCase.sender,
    rows: fixtureCase.rows,
    nowMs: NOW_MS,
  })
  const assignment = assignSenderCleanupGroupDecision({
    sender: fixtureCase.sender,
    rows: fixtureCase.rows,
    nowMs: NOW_MS,
  })

  assert.equal(
    legacy.clusterSpec?.cluster_id || null,
    fixtureCase.expectedLegacyClusterId,
    `${fixtureCase.id}: unexpected legacy cluster outcome`
  )
  assert.equal(
    legacy.exclusionReason,
    fixtureCase.expectedLegacyExclusionReason,
    `${fixtureCase.id}: unexpected legacy exclusion reason`
  )
  assert.equal(
    assignment.groupSpec.cluster_id,
    fixtureCase.expectedAssignedGroupId,
    `${fixtureCase.id}: unexpected assigned cleanup group`
  )
  assert.equal(
    assignment.assignmentReason,
    fixtureCase.expectedAssignmentReason,
    `${fixtureCase.id}: unexpected assignment reason`
  )
  assert.equal(
    assignment.isCleanupCandidate,
    fixtureCase.expectedCleanupCandidate,
    `${fixtureCase.id}: unexpected cleanup candidate flag`
  )
}

const allRows = fixtureCases.flatMap((fixtureCase) => fixtureCase.rows)
const projections = fixtureCases.map((fixtureCase) =>
  projectGmailSenderArtifactSlice({
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
    senderKey: normalizeSender(fixtureCase.sender),
    sender: fixtureCase.sender,
    rows: fixtureCase.rows,
    nowMs: NOW_MS,
  })
)
const rollups = projections
  .map((projection) => projection.rollup_row)
  .filter((row) => row != null)
const previewRows = projections.flatMap((projection) => projection.preview_rows)
const clusterSpecs = Object.fromEntries(
  projections
    .map((projection) => projection.cluster_spec)
    .filter((clusterSpec) => clusterSpec != null)
    .map((clusterSpec) => [clusterSpec.cluster_id, clusterSpec])
)

const coverage = {
  indexed_total_rows: allRows.length,
  indexed_inbox_rows: allRows.filter((row) => row.is_in_inbox).length,
  indexed_date_span_start:
    allRows.length > 0
      ? isoFromMs(
          Math.min(
            ...allRows.map((row) =>
              typeof row.internal_date_ms === 'number' ? row.internal_date_ms : NOW_MS
            )
          )
        )
      : null,
  indexed_date_span_end:
    allRows.length > 0
      ? isoFromMs(
          Math.max(
            ...allRows.map((row) =>
              typeof row.internal_date_ms === 'number' ? row.internal_date_ms : NOW_MS
            )
          )
        )
      : null,
}
const aggregate = buildWholeMailboxAggregateFromRows({
  analysisScope: ANALYSIS_SCOPE,
  rows: allRows,
  nowMs: NOW_MS,
})
const derived = buildGmailArtifactDerivedRows({
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: ARTIFACT_VERSION,
  coverage,
  aggregate,
  rollups,
  previewRows,
  clusterSpecs,
  statsBySenderKey: new Map(),
})

const assignedSenderCount = rollups.length
const totalSenderCount = fixtureCases.length
const unassignedSenderCount = rollups.filter((row) => !row.assigned_cleanup_group_id).length
const uniqueAssignedSenders = new Set(rollups.map((row) => row.sender_key))
const groupCounts = rollups.reduce((accumulator, row) => {
  accumulator[row.assigned_cleanup_group_id] = (accumulator[row.assigned_cleanup_group_id] || 0) + 1
  return accumulator
}, {})
const sumOfGroupCounts = Object.values(groupCounts).reduce((sum, count) => sum + count, 0)

assert.equal(totalSenderCount, assignedSenderCount, 'Total senders must equal assigned sender count')
assert.equal(unassignedSenderCount, 0, 'No sender may remain unassigned')
assert.equal(
  uniqueAssignedSenders.size,
  assignedSenderCount,
  'Each sender must appear in exactly one rollup assignment'
)
assert.equal(sumOfGroupCounts, totalSenderCount, 'Cleanup group counts must sum to total senders')

const seedRowsBySenderKey = new Map(derived.seedRows.map((row) => [row.sender_key, row]))
assert.equal(
  derived.seedRows.length,
  totalSenderCount,
  'Seed rows must be derived from assigned groups for every sender'
)
assert.equal(
  derived.snapshotPayload.sender_ranking.length,
  totalSenderCount,
  'Mailbox intelligence sender ranking must retain every sender'
)

for (const rollup of rollups) {
  const seedRow = seedRowsBySenderKey.get(rollup.sender_key)
  assert.ok(seedRow, `Missing seed row for ${rollup.sender_key}`)
  assert.equal(
    seedRow.cluster_id,
    rollup.assigned_cleanup_group_id,
    `Seed row cluster mismatch for ${rollup.sender_key}`
  )
}

const candidatePreviewRows = previewRows.filter((row) => isCleanupCandidateGroupId(row.cluster_id))
assert.equal(
  derived.snapshotPayload.cleanup_candidate_universe.message_count,
  candidatePreviewRows.length,
  'Cleanup candidate universe message count must only reflect candidate groups'
)
assert.equal(
  derived.snapshotPayload.cleanup_candidate_universe.sender_count,
  rollups.filter((row) => row.is_cleanup_candidate).length,
  'Cleanup candidate universe sender count must match candidate rollups'
)

const historicalSenderKey = normalizeSender('archive-only@history.example')
const historicalSeedRow = seedRowsBySenderKey.get(historicalSenderKey)
assert.ok(historicalSeedRow, 'Historical sender must still produce a seed row')
assert.equal(
  historicalSeedRow.cluster_id,
  'historical-out-of-inbox-senders',
  'No-inbox sender must land in the historical group'
)
assert.equal(
  previewRows.some((row) => row.sender_key === historicalSenderKey),
  false,
  'Historical out-of-inbox sender should not require preview rows to stay in the artifact'
)

const protectedHistoricalSenderKey = normalizeSender('vip@archive.example')
assert.equal(
  seedRowsBySenderKey.get(protectedHistoricalSenderKey)?.cluster_id || null,
  'protected-trusted-senders',
  'Protected signal must override historical no-inbox placement'
)

const exclusionReasonMapping = {
  no_inbox_rows: ['historical-out-of-inbox-senders', 'protected-trusted-senders'],
  no_safe_rows: ['needs-review-senders', 'protected-trusted-senders'],
  too_few_safe_rows: [
    'subscription-senders',
    'retail-commerce-senders',
    'social-platform-senders',
    'system-notification-senders',
    'dormant-backlog-senders',
    'needs-review-senders',
    'protected-trusted-senders',
  ],
  safe_ratio_too_low: [
    'subscription-senders',
    'retail-commerce-senders',
    'social-platform-senders',
    'system-notification-senders',
    'dormant-backlog-senders',
    'needs-review-senders',
    'protected-trusted-senders',
  ],
  protected_human_sender: ['protected-trusted-senders'],
  protected_human_dominant: ['protected-trusted-senders'],
  score_below_threshold: ['needs-review-senders'],
  no_cluster_match: ['needs-review-senders'],
}

assert.deepEqual(
  Object.keys(exclusionReasonMapping).sort(),
  [...GMAIL_CLEANUP_EXCLUSION_REASONS].sort(),
  'Every legacy cleanup exclusion reason must map to a concrete new outcome'
)

for (const fixtureCase of fixtureCases) {
  if (!fixtureCase.expectedLegacyExclusionReason) continue
  const mappedTargets = exclusionReasonMapping[fixtureCase.expectedLegacyExclusionReason]
  assert.ok(
    mappedTargets.includes(fixtureCase.expectedAssignedGroupId),
    `${fixtureCase.id}: mapped targets must include ${fixtureCase.expectedAssignedGroupId}`
  )
}

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  analysis_scope: ANALYSIS_SCOPE,
  artifact_version: ARTIFACT_VERSION,
  sender_counts: {
    total_sender_count: totalSenderCount,
    assigned_sender_count: assignedSenderCount,
    unassigned_sender_count: unassignedSenderCount,
    unique_assigned_sender_count: uniqueAssignedSenders.size,
    multi_assigned_sender_count: assignedSenderCount - uniqueAssignedSenders.size,
    group_count_sum: sumOfGroupCounts,
  },
  group_counts: groupCounts,
  candidate_counts: {
    candidate_sender_count: rollups.filter((row) => row.is_cleanup_candidate).length,
    candidate_preview_row_count: candidatePreviewRows.length,
    cleanup_candidate_universe_message_count:
      derived.snapshotPayload.cleanup_candidate_universe.message_count,
  },
  structural_group_presence: {
    protected_trusted_senders: groupCounts['protected-trusted-senders'] || 0,
    historical_out_of_inbox_senders: groupCounts['historical-out-of-inbox-senders'] || 0,
    needs_review_senders: groupCounts['needs-review-senders'] || 0,
  },
  fixture_results: fixtureCases.map((fixtureCase) => {
    const assignment = assignSenderCleanupGroupDecision({
      sender: fixtureCase.sender,
      rows: fixtureCase.rows,
      nowMs: NOW_MS,
    })
    const legacy = classifySenderCleanupClusterDecision({
      sender: fixtureCase.sender,
      rows: fixtureCase.rows,
      nowMs: NOW_MS,
    })
    return {
      id: fixtureCase.id,
      sender: fixtureCase.sender,
      legacy_cluster_id: legacy.clusterSpec?.cluster_id || null,
      legacy_exclusion_reason: legacy.exclusionReason,
      assigned_cleanup_group_id: assignment.groupSpec.cluster_id,
      assignment_reason: assignment.assignmentReason,
      is_cleanup_candidate: assignment.isCleanupCandidate,
      evidence_source: assignment.evidenceSource,
    }
  }),
  exclusion_reason_mapping: exclusionReasonMapping,
}

console.log(JSON.stringify(proof, null, 2))
