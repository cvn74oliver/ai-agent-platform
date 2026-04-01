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

function parseString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseNullableEnv(value) {
  if (value == null) return null
  const normalized = String(value).trim()
  if (!normalized || normalized.toLowerCase() === 'null') return null
  return normalized
}

function parseOptionalInteger(value) {
  const normalized = parseNullableEnv(value)
  if (normalized == null) return null
  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected integer value, received ${normalized}.`)
  }
  return Math.max(0, Math.round(parsed))
}

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const ACTION = parseString(process.env.GMAIL_PUBLICATION_ACTION) || 'publish'
const TARGET_ARTIFACT_VERSION = parseString(process.env.TARGET_ARTIFACT_VERSION)
const TARGET_JOB_ID = parseString(process.env.TARGET_JOB_ID)
const EXPECTED_PUBLISHED_VERSION = parseNullableEnv(process.env.EXPECTED_PUBLISHED_VERSION)
const EXPECTED_LAST_INDEX_STATE_UPDATED_AT = parseNullableEnv(
  process.env.EXPECTED_LAST_INDEX_STATE_UPDATED_AT
)
const EXPECTED_LAST_INDEXED_MESSAGE_COUNT = parseOptionalInteger(
  process.env.EXPECTED_LAST_INDEXED_MESSAGE_COUNT
)
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

console.log('=== Gmail Artifact Publication Promote ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Action: ${ACTION}`)
console.log(`Target artifact version: ${TARGET_ARTIFACT_VERSION || '(missing)'}`)
console.log(`Target job id: ${TARGET_JOB_ID || '(missing)'}`)
console.log(`Expected published version: ${EXPECTED_PUBLISHED_VERSION ?? 'null'}`)
console.log(
  `Expected last_index_state_updated_at: ${EXPECTED_LAST_INDEX_STATE_UPDATED_AT ?? 'null'}`
)
console.log(
  `Expected last_indexed_message_count: ${
    EXPECTED_LAST_INDEXED_MESSAGE_COUNT == null ? 'null' : String(EXPECTED_LAST_INDEXED_MESSAGE_COUNT)
  }`
)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

assert.ok(TARGET_ARTIFACT_VERSION, 'TARGET_ARTIFACT_VERSION is required.')
assert.ok(TARGET_JOB_ID, 'TARGET_JOB_ID is required.')
assert.ok(
  ACTION === 'publish' || ACTION === 'rollback',
  'GMAIL_PUBLICATION_ACTION must be publish or rollback.'
)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
  promoteGmailArtifactPublication,
  reconcileGmailArtifactBuildLiveness,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const publicationBeforeRaw = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})
const buildLiveness = await reconcileGmailArtifactBuildLiveness({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  publication: publicationBeforeRaw,
  logPrefix: '[proof/gmail-artifact-publication-promote]',
})
const publicationBefore = buildLiveness.publication
const targetJob = await loadGmailArtifactJobState({
  supabase,
  jobId: TARGET_JOB_ID,
})
const targetRowCounts = await countGmailArtifactVersionRows({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: TARGET_ARTIFACT_VERSION,
})

assert.ok(
  targetJob,
  `Target job ${TARGET_JOB_ID} must exist before ${ACTION === 'rollback' ? 'rollback' : 'publish'}.`
)
assert.equal(targetJob.artifact_version, TARGET_ARTIFACT_VERSION)
assert.equal(targetJob.status, 'completed')
assert.ok(
  targetRowCounts.gmail_sender_scope_rollups > 0 &&
    targetRowCounts.gmail_cluster_summaries > 0 &&
    targetRowCounts.gmail_sender_workspace_seed_headers > 0 &&
    targetRowCounts.gmail_sender_workspace_seed_rows > 0 &&
    targetRowCounts.gmail_mailbox_intelligence_snapshots > 0 &&
    targetRowCounts.gmail_preview_index > 0,
  `Target artifact ${TARGET_ARTIFACT_VERSION} is missing required rows for ${ACTION}.`
)
assert.equal(
  buildLiveness.build_is_live,
  false,
  `${ACTION} precheck failed: artifact build lock remains live after liveness reconciliation (${buildLiveness.status}).`
)
assert.equal(
  publicationBefore?.published_version ?? null,
  EXPECTED_PUBLISHED_VERSION,
  `${ACTION} precheck failed: published_version drifted before compare-and-set.`
)
assert.equal(
  publicationBefore?.building_version ?? null,
  null,
  `${ACTION} precheck failed: building_version must be null before compare-and-set.`
)
assert.equal(
  publicationBefore?.last_index_state_updated_at ?? null,
  EXPECTED_LAST_INDEX_STATE_UPDATED_AT,
  `${ACTION} precheck failed: last_index_state_updated_at drifted before compare-and-set.`
)
assert.equal(
  publicationBefore?.last_indexed_message_count ?? null,
  EXPECTED_LAST_INDEXED_MESSAGE_COUNT,
  `${ACTION} precheck failed: last_indexed_message_count drifted before compare-and-set.`
)

const publicationAfter = await promoteGmailArtifactPublication({
  supabase,
  jobId: TARGET_JOB_ID,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: TARGET_ARTIFACT_VERSION,
  lastIndexStateUpdatedAt: EXPECTED_LAST_INDEX_STATE_UPDATED_AT,
  lastIndexedMessageCount: EXPECTED_LAST_INDEXED_MESSAGE_COUNT,
  expectedCurrentPublication: {
    published_version: EXPECTED_PUBLISHED_VERSION,
    building_version: null,
    last_index_state_updated_at: EXPECTED_LAST_INDEX_STATE_UPDATED_AT,
    last_indexed_message_count: EXPECTED_LAST_INDEXED_MESSAGE_COUNT,
  },
})

assert.equal(
  publicationAfter.published_version,
  TARGET_ARTIFACT_VERSION,
  `${ACTION} did not move published_version to ${TARGET_ARTIFACT_VERSION}.`
)

const proof = {
  ok: true,
  action: ACTION,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  analysis_scope: ANALYSIS_SCOPE,
  target_artifact_version: TARGET_ARTIFACT_VERSION,
  target_job_id: TARGET_JOB_ID,
  expected_current_publication: {
    published_version: EXPECTED_PUBLISHED_VERSION,
    building_version: null,
    last_index_state_updated_at: EXPECTED_LAST_INDEX_STATE_UPDATED_AT,
    last_indexed_message_count: EXPECTED_LAST_INDEXED_MESSAGE_COUNT,
  },
  build_liveness: buildLiveness,
  publication_before: publicationBefore,
  publication_after: publicationAfter,
  target_job: targetJob,
  target_row_counts: targetRowCounts,
  immediate_post_flip_validation_hooks: [
    'npm run audit:gmail-cleanup-group-live',
    'npm run accept:gmail-workspace-data-access',
  ],
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${PROOF_OUTPUT}`)
}

console.log(JSON.stringify(proof, null, 2))
