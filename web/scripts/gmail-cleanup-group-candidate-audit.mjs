import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const envFilePath = path.join(webRoot, '.env.local')

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex <= 0) return null
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const contents = fs.readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    if (!(parsed.key in process.env)) {
      process.env[parsed.key] = parsed.value
    }
  }
}

function mkdirpForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function writeProofOutput(filePath, proof) {
  if (!filePath) return
  mkdirpForFile(filePath)
  fs.writeFileSync(filePath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${filePath}`)
}

function parseRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function parseString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseStringArray(value) {
  return Array.isArray(value)
    ? value.map((entry) => parseString(entry)).filter((entry) => entry != null)
    : []
}

function parseInteger(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function parseJsonRecord(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function uniqueStrings(values) {
  return Array.from(
    new Set(values.map((value) => parseString(value)).filter((value) => value != null))
  ).sort((left, right) => left.localeCompare(right))
}

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const CANDIDATE_ARTIFACT_VERSION = parseString(process.env.CANDIDATE_ARTIFACT_VERSION)
const CANDIDATE_JOB_ID = parseString(process.env.CANDIDATE_JOB_ID)
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

console.log('=== Gmail Cleanup Group Candidate Audit ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Candidate artifact version: ${CANDIDATE_ARTIFACT_VERSION || '(missing)'}`)
console.log(`Candidate job id: ${CANDIDATE_JOB_ID || '(not provided)'}`)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

try {
  assert.ok(CANDIDATE_ARTIFACT_VERSION, 'CANDIDATE_ARTIFACT_VERSION is required.')

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
  loadGmailClusterSummariesForArtifactVersion,
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion,
  loadGmailPreviewIndexRowsForArtifactVersion,
  loadGmailSenderScopeRollupsForArtifactVersion,
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion,
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')
const {
  assertSharedGroupSemanticRollupArtifactCongruence,
  buildFutureCanonicalCleanupGroupSurfaceIdentity,
} = await import('../src/lib/integrations/gmail/gmailSemanticRollupContract.ts')
const {
  GMAIL_CLEANUP_SHADOW_BASELINE_VERSION,
  buildGmailCleanupShadowRediscoveryReport,
} = await import('../src/lib/integrations/gmail/gmailCleanupShadowRediscovery.ts')
const { getRetiredCleanupGroupRedirect } = await import(
  '../src/lib/runtime/gmailCleanupClusterIdentity.ts'
)

assert.equal(
  process.env.BASELINE_ARTIFACT_VERSION || GMAIL_CLEANUP_SHADOW_BASELINE_VERSION,
  GMAIL_CLEANUP_SHADOW_BASELINE_VERSION,
  `Candidate validation is pinned to frozen shadow baseline ${GMAIL_CLEANUP_SHADOW_BASELINE_VERSION}.`
)

const supabase = await getSupabaseAdmin()
const publication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})

assert.notEqual(
  CANDIDATE_ARTIFACT_VERSION,
  publication?.published_version || null,
  'Candidate validator must inspect an unpublished artifact version directly.'
)

const baselineArtifactVersion = GMAIL_CLEANUP_SHADOW_BASELINE_VERSION
const [
  baselineRowCounts,
  baselineClusterSummaries,
  baselineMailboxSnapshot,
  baselineRollups,
  baselineSeedHeaders,
  baselineSeedRows,
  candidateRowCounts,
  candidateClusterSummaries,
  candidateMailboxSnapshot,
  candidateRollups,
  candidateSeedHeaders,
  candidateSeedRows,
  candidatePreviewRows,
  candidateJob,
] = await Promise.all([
  countGmailArtifactVersionRows({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  loadGmailClusterSummariesForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  loadGmailSenderScopeRollupsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: baselineArtifactVersion,
  }),
  countGmailArtifactVersionRows({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailClusterSummariesForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailSenderScopeRollupsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  loadGmailPreviewIndexRowsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  }),
  CANDIDATE_JOB_ID
    ? loadGmailArtifactJobState({
        supabase,
        jobId: CANDIDATE_JOB_ID,
      })
    : Promise.resolve(null),
])

assert.ok(
  baselineMailboxSnapshot,
  `Missing shadow baseline mailbox snapshot for ${baselineArtifactVersion}.`
)
assert.ok(
  candidateMailboxSnapshot,
  `Missing mailbox intelligence snapshot for candidate ${CANDIDATE_ARTIFACT_VERSION}.`
)

const baselineReport = buildGmailCleanupShadowRediscoveryReport({
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: baselineArtifactVersion,
  rowCounts: baselineRowCounts,
  clusterSummaries: baselineClusterSummaries,
  seedHeaders: baselineSeedHeaders,
  seedRows: baselineSeedRows,
  rollups: baselineRollups,
  mailboxSnapshots: baselineMailboxSnapshot ? [baselineMailboxSnapshot] : [],
})

assert.equal(
  baselineReport.publish_gate_report.pass,
  true,
  'Accepted shadow baseline must pass its publish gates before candidate comparison.'
)

const candidateProjectionReport = buildGmailCleanupShadowRediscoveryReport({
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: CANDIDATE_ARTIFACT_VERSION,
  rowCounts: candidateRowCounts,
  clusterSummaries: candidateClusterSummaries,
  seedHeaders: candidateSeedHeaders,
  seedRows: candidateSeedRows,
  rollups: candidateRollups,
  mailboxSnapshots: candidateMailboxSnapshot ? [candidateMailboxSnapshot] : [],
})

assert.equal(
  candidateProjectionReport.publish_gate_report.pass,
  true,
  'Candidate artifact must satisfy the accepted shadow publish-gate report.'
)

for (const key of [
  'gmail_sender_scope_rollups',
  'gmail_sender_workspace_seed_headers',
  'gmail_sender_workspace_seed_rows',
  'gmail_cluster_summaries',
  'gmail_mailbox_intelligence_snapshots',
  'gmail_mailbox_intelligence_buckets',
  'gmail_preview_index',
]) {
  assert.ok(candidateRowCounts[key] > 0, `Candidate artifact is missing rows for ${key}.`)
}

assert.ok(getRetiredCleanupGroupRedirect('retail-commerce-senders'))

const totalSenderCount = candidateRollups.length
const assignedSenderCount = candidateRollups.filter(
  (row) => typeof row.assigned_cleanup_group_id === 'string' && row.assigned_cleanup_group_id.trim()
).length
const duplicateSenderCount =
  totalSenderCount - new Set(candidateRollups.map((row) => row.sender_key)).size
const groupCounts = candidateRollups.reduce((accumulator, row) => {
  const clusterId = row.assigned_cleanup_group_id || 'UNASSIGNED'
  accumulator[clusterId] = (accumulator[clusterId] || 0) + 1
  return accumulator
}, {})

assert.equal(assignedSenderCount, totalSenderCount, 'All candidate senders must remain assigned.')
assert.equal(duplicateSenderCount, 0, 'Candidate artifact must not duplicate sender membership.')
assert.equal(
  groupCounts['retail-commerce-senders'] || 0,
  0,
  'Candidate sender scope rollups must not retain retail-commerce-senders.'
)

const expectedSourceAfterCounts = Object.fromEntries(
  baselineReport.old_vs_new_parent_counts.source_after.map((entry) => [
    entry.cluster_id,
    entry.sender_count,
  ])
)
const expectedCanonicalClusterIds = baselineReport.shadow_rebuild_output_result.projected_canonical_cluster_ids
  .slice()
  .sort((left, right) => left.localeCompare(right))
const candidateClusterIds = candidateClusterSummaries
  .map((summary) => summary.cluster_id)
  .slice()
  .sort((left, right) => left.localeCompare(right))
const candidateHeaderClusterIds = uniqueStrings(
  candidateSeedHeaders.map((header) => header.cluster_id)
)

assert.deepEqual(
  groupCounts,
  expectedSourceAfterCounts,
  'Candidate sender distribution must match the accepted shadow post-retirement source assignment.'
)
assert.deepEqual(
  candidateClusterIds,
  expectedCanonicalClusterIds,
  'Candidate canonical cluster ids must match the accepted shadow canonical projection.'
)
assert.deepEqual(
  candidateHeaderClusterIds,
  expectedCanonicalClusterIds,
  'Candidate seed headers must expose the full canonical cluster set.'
)
assert.equal(
  candidateClusterIds.includes('retail-commerce-senders'),
  false,
  'Candidate canonical cluster ids must not contain retail-commerce-senders.'
)
assert.equal(
  candidateClusterIds.includes('secondary.system_notifications'),
  false,
  'Legacy secondary.system_notifications must never appear as a canonical candidate cluster id.'
)

if (candidateJob) {
  assert.equal(candidateJob.artifact_version, CANDIDATE_ARTIFACT_VERSION)
  assert.equal(candidateJob.status, 'completed')
  assert.equal(candidateJob.phase, 'candidate_ready')
}
const candidateFinalizeCheckpoint = parseJsonRecord(candidateJob?.cluster_checkpoint)
const expectedPreviewIndexRows =
  typeof candidateFinalizeCheckpoint?.derived_row_counts?.preview_index_rows === 'number'
    ? Math.max(0, Math.round(candidateFinalizeCheckpoint.derived_row_counts.preview_index_rows))
    : null
if (expectedPreviewIndexRows != null) {
  assert.equal(
    candidateRowCounts.gmail_preview_index,
    expectedPreviewIndexRows,
    'Candidate preview-index row count must match the finalized derived preview-index row count.'
  )
}
const nonCanonicalPreviewRows = candidatePreviewRows.filter((row) => {
  const expectedIdentity = buildFutureCanonicalCleanupGroupSurfaceIdentity(row.cluster_id)
  return row.cluster_id !== expectedIdentity.canonical_cluster_id
})
assert.equal(
  nonCanonicalPreviewRows.length,
  0,
  'Candidate preview index must not retain source/legacy cluster ids after finalize.'
)

const expectedReviewUnitPlans = new Map(
  baselineReport.published_review_unit_plan_result.map((plan) => [plan.canonical_cluster_id, plan])
)
const summaryByClusterId = new Map(
  candidateClusterSummaries.map((summary) => [summary.cluster_id, summary])
)
const headerByClusterId = new Map(candidateSeedHeaders.map((header) => [header.cluster_id, header]))

const snapshotPayload = parseRecord(candidateMailboxSnapshot.snapshot_payload)
const snapshotCleanupGroups = Array.isArray(snapshotPayload.cleanup_groups)
  ? snapshotPayload.cleanup_groups.map((entry) => parseRecord(entry))
  : []
const snapshotCleanupGroupsByClusterId = new Map(
  snapshotCleanupGroups.map((entry) => [parseString(entry.cluster_id) || '', entry])
)
const snapshotCleanupGroupIds = uniqueStrings(
  snapshotCleanupGroups.map((entry) => parseString(entry.cluster_id))
)

assert.deepEqual(
  snapshotCleanupGroupIds,
  expectedCanonicalClusterIds,
  'Mailbox snapshot cleanup_groups must expose the full canonical cluster set.'
)

function assertSurfaceIdentity(label, clusterId, payload) {
  const expectedIdentity = buildFutureCanonicalCleanupGroupSurfaceIdentity(clusterId)
  const actualCanonicalClusterId =
    parseString(payload.cleanup_group_canonical_cluster_id) ||
    parseString(payload.canonical_cluster_id) ||
    clusterId
  const actualLegacyClusterIds = uniqueStrings(
    parseStringArray(payload.cleanup_group_legacy_cluster_ids || payload.legacy_cluster_ids)
  )
  const actualSourceClusterIds = uniqueStrings(
    parseStringArray(payload.cleanup_group_source_cluster_ids || payload.source_cluster_ids)
  )

  assert.equal(
    actualCanonicalClusterId,
    expectedIdentity.canonical_cluster_id,
    `${label} canonical identity drifted for ${clusterId}.`
  )
  assert.deepEqual(
    actualLegacyClusterIds,
    uniqueStrings(expectedIdentity.legacy_cluster_ids),
    `${label} legacy identity drifted for ${clusterId}.`
  )
  assert.deepEqual(
    actualSourceClusterIds,
    uniqueStrings(expectedIdentity.source_cluster_ids),
    `${label} source identity drifted for ${clusterId}.`
  )
  assert.notEqual(
    actualCanonicalClusterId,
    'secondary.system_notifications',
    `${label} must not publish legacy secondary.system_notifications as canonical for ${clusterId}.`
  )
}

for (const clusterId of expectedCanonicalClusterIds) {
  const summary = summaryByClusterId.get(clusterId)
  const header = headerByClusterId.get(clusterId)
  const snapshotGroup = snapshotCleanupGroupsByClusterId.get(clusterId)

  assert.ok(summary, `Missing candidate cluster summary for ${clusterId}.`)
  assert.ok(header, `Missing candidate seed header for ${clusterId}.`)
  assert.ok(snapshotGroup, `Missing candidate snapshot cleanup_group for ${clusterId}.`)

  assertSurfaceIdentity('cluster summary', clusterId, parseRecord(summary.summary_payload))
  assertSurfaceIdentity('seed header', clusterId, parseRecord(header.analytics))
  assertSurfaceIdentity('snapshot cleanup_group', clusterId, snapshotGroup)

  assertSharedGroupSemanticRollupArtifactCongruence({
    clusterId,
    headerAnalytics: parseRecord(header.analytics),
    summaryPayload: parseRecord(summary.summary_payload),
  })

  const expectedReviewUnitPlan = expectedReviewUnitPlans.get(clusterId) || null
  if (expectedReviewUnitPlan) {
    const summaryPayload = parseRecord(summary.summary_payload)
    const headerAnalytics = parseRecord(header.analytics)
    const snapshotRequired = snapshotGroup.review_units_required === true
    const snapshotReviewUnitBasis = parseString(snapshotGroup.review_unit_basis) || 'not_promoted'
    const snapshotReviewUnitCount = parseInteger(snapshotGroup.review_unit_count)

    assert.equal(
      parseString(summaryPayload.cleanup_group_review_unit_basis),
      expectedReviewUnitPlan.basis,
      `Summary review-unit basis drifted for ${clusterId}.`
    )
    assert.equal(
      parseString(headerAnalytics.cleanup_group_review_unit_basis),
      expectedReviewUnitPlan.basis,
      `Header review-unit basis drifted for ${clusterId}.`
    )
    assert.equal(
      snapshotReviewUnitBasis,
      expectedReviewUnitPlan.basis,
      `Snapshot review-unit basis drifted for ${clusterId}.`
    )
    assert.equal(
      summaryPayload.cleanup_group_review_units_required === true,
      expectedReviewUnitPlan.required,
      `Summary review-unit requirement drifted for ${clusterId}.`
    )
    assert.equal(
      headerAnalytics.cleanup_group_review_units_required === true,
      expectedReviewUnitPlan.required,
      `Header review-unit requirement drifted for ${clusterId}.`
    )
    assert.equal(
      snapshotRequired,
      expectedReviewUnitPlan.required,
      `Snapshot review-unit requirement drifted for ${clusterId}.`
    )

    if (expectedReviewUnitPlan.required) {
      assert.ok(
        parseInteger(summaryPayload.cleanup_group_review_unit_count) > 0,
        `Summary review-unit count must be positive for required cluster ${clusterId}.`
      )
      assert.ok(
        parseInteger(headerAnalytics.cleanup_group_review_unit_count) > 0,
        `Header review-unit count must be positive for required cluster ${clusterId}.`
      )
      assert.ok(
        snapshotReviewUnitCount > 0,
        `Snapshot review-unit count must be positive for required cluster ${clusterId}.`
      )
    }
  }
}

for (const row of candidateSeedRows) {
  assertSurfaceIdentity(
    `seed row ${row.sender_key}`,
    row.cluster_id,
    parseRecord(row.seed_payload)
  )
}

for (const row of candidatePreviewRows) {
  assertSurfaceIdentity(
    `preview row ${row.cluster_id}/${row.sender_key}/${row.preview_rank}`,
    row.cluster_id,
    parseRecord(row.preview_payload)
  )
}

const secondarySummary = summaryByClusterId.get('secondary.account_updates')
assert.ok(secondarySummary, 'Candidate artifact must include canonical secondary.account_updates.')
assertSurfaceIdentity(
  'secondary.account_updates summary',
  'secondary.account_updates',
  parseRecord(secondarySummary.summary_payload)
)

  const proof = {
    ok: true,
    safe_to_publish: true,
    generated_at: new Date().toISOString(),
    tenant_id: TENANT_ID,
    analysis_scope: ANALYSIS_SCOPE,
    baseline_artifact_version: baselineArtifactVersion,
    candidate_artifact_version: CANDIDATE_ARTIFACT_VERSION,
    candidate_job_id: CANDIDATE_JOB_ID,
    candidate_is_unpublished: CANDIDATE_ARTIFACT_VERSION !== (publication?.published_version || null),
    publication_state: publication,
    candidate_job: candidateJob,
    row_counts: candidateRowCounts,
    sender_distribution: groupCounts,
    expected_sender_distribution: expectedSourceAfterCounts,
    candidate_canonical_cluster_ids: candidateClusterIds,
    expected_canonical_cluster_ids: expectedCanonicalClusterIds,
    duplicate_sender_count: duplicateSenderCount,
    finalized_preview_index_rows: expectedPreviewIndexRows,
    non_canonical_preview_row_count: nonCanonicalPreviewRows.length,
    published_review_unit_plan_result: baselineReport.published_review_unit_plan_result,
    candidate_publish_gate_report: candidateProjectionReport.publish_gate_report,
    retail_redirect_only: getRetiredCleanupGroupRedirect('retail-commerce-senders'),
  }

  writeProofOutput(PROOF_OUTPUT, proof)
  console.log(JSON.stringify(proof, null, 2))
} catch (error) {
  writeProofOutput(PROOF_OUTPUT, {
    ok: false,
    safe_to_publish: false,
    generated_at: new Date().toISOString(),
    tenant_id: TENANT_ID,
    analysis_scope: ANALYSIS_SCOPE,
    candidate_artifact_version: CANDIDATE_ARTIFACT_VERSION,
    candidate_job_id: CANDIDATE_JOB_ID,
    validation_error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack || null,
          }
        : { name: 'UnknownError', message: String(error), stack: null },
  })
  throw error
}
