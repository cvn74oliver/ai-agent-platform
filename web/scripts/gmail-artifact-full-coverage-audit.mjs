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

function parseRestoreStateFromCheckpoint(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    const restoreState =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed.publication_restore_state
        : null
    return restoreState && typeof restoreState === 'object' && !Array.isArray(restoreState)
      ? restoreState
      : null
  } catch {
    return null
  }
}

function parseFinalizeCheckpoint(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function formatArg(value) {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message || String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

async function captureLogs(run) {
  const entries = []
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  const intercept = (level) => (...args) => {
    const text = args.map((value) => formatArg(value)).join(' ')
    entries.push({ level, text })
    original[level](...args)
  }

  console.log = intercept('log')
  console.info = intercept('info')
  console.warn = intercept('warn')
  console.error = intercept('error')

  try {
    const result = await run()
    return { result, entries }
  } finally {
    console.log = original.log
    console.info = original.info
    console.warn = original.warn
    console.error = original.error
  }
}

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const RESUME_JOB_ID = process.env.GMAIL_FULL_BUILD_RESUME_JOB_ID || null
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

if (ANALYSIS_SCOPE !== 'all_indexed') {
  console.error(
    `This full-coverage harness is currently locked to analysis_scope=all_indexed. Received ${ANALYSIS_SCOPE}.`
  )
  process.exit(1)
}

console.log('=== Gmail Full Mailbox Artifact Coverage Audit ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Resume job: ${RESUME_JOB_ID || '(new build)'}`)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
} = await import('../src/lib/integrations/gmail/gmailMailboxIndexer.ts')
const {
  runGmailFullMailboxArtifactBuild,
} = await import('../src/lib/integrations/gmail/gmailArtifactBuildRunner.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const indexState = await loadGmailMailboxIndexState({
  supabase,
  tenantId: TENANT_ID,
})

assert.equal(
  indexState?.active_run_id ?? null,
  null,
  'Cannot run Phase G full-mailbox artifact build while gmail_mailbox_index_state.active_run_id is set.'
)

const preBuildPublication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})
const coverageBefore = await loadGmailMailboxIndexCoverageForTenant({
  supabase,
  tenantId: TENANT_ID,
})

const { result: buildResult, entries: buildLogs } = await captureLogs(async () =>
  runGmailFullMailboxArtifactBuild({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    resumeJobId: RESUME_JOB_ID,
    publishResult: false,
  })
)

assert.equal(
  buildResult.processed_message_count,
  coverageBefore.indexed_total_rows,
  'processed_message_count must match the indexed corpus size for full-mailbox coverage'
)

const postBuildPublication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})
const job = await loadGmailArtifactJobState({
  supabase,
  jobId: buildResult.job_id,
})
const rowCounts = await countGmailArtifactVersionRows({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: buildResult.artifact_version,
})
const expectedRestoredPublication =
  parseRestoreStateFromCheckpoint(job?.message_checkpoint) || preBuildPublication
const finalizeCheckpoint = parseFinalizeCheckpoint(job?.cluster_checkpoint)
const expectedPreviewIndexRows =
  typeof finalizeCheckpoint?.derived_row_counts?.preview_index_rows === 'number'
    ? Math.max(0, Math.round(finalizeCheckpoint.derived_row_counts.preview_index_rows))
    : null

assert.equal(
  buildResult.publication_action,
  'candidate_ready',
  'Full-mailbox build audit must complete as a candidate-only build in this lane.'
)
assert.equal(
  postBuildPublication?.published_version ?? null,
  expectedRestoredPublication?.published_version ?? null,
  'candidate-only full-mailbox build must not mutate published_version'
)
assert.equal(
  postBuildPublication?.building_version ?? null,
  expectedRestoredPublication?.building_version ?? null,
  'candidate-only full-mailbox build must restore the prebuild building_version state'
)
assert.equal(
  postBuildPublication?.build_status ?? null,
  expectedRestoredPublication?.build_status ?? null,
  'candidate-only full-mailbox build must restore the prebuild build_status'
)
assert.ok(rowCounts.gmail_sender_workspace_seed_headers > 0)
assert.ok(rowCounts.gmail_sender_workspace_seed_rows > 0)
assert.ok(rowCounts.gmail_sender_scope_rollups > 0)
assert.ok(rowCounts.gmail_cluster_summaries > 0)
assert.ok(rowCounts.gmail_mailbox_intelligence_snapshots > 0)
assert.ok(rowCounts.gmail_preview_index > 0)
if (expectedPreviewIndexRows != null) {
  assert.equal(
    rowCounts.gmail_preview_index,
    expectedPreviewIndexRows,
    'candidate-only full-mailbox build must leave gmail_preview_index at the finalized derived row count'
  )
}

const forbiddenLogFragments = [
  'loadIndexedGmailMessagesForTenant(limit=100000)',
  '[integrations/gmail/mailbox-indexer/indexed-rows]',
]
for (const fragment of forbiddenLogFragments) {
  assert.equal(
    buildLogs.some((entry) => entry.text.includes(fragment)),
    false,
    `Observed forbidden capped-mailbox build log fragment: ${fragment}`
  )
}

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  analysis_scope: ANALYSIS_SCOPE,
  build_job_id: buildResult.job_id,
  artifact_version: buildResult.artifact_version,
  publication_action: buildResult.publication_action,
  resumed: buildResult.resumed,
  publication_before: preBuildPublication,
  expected_restored_publication: expectedRestoredPublication,
  publication_after: postBuildPublication,
  auto_published: false,
  processed_sender_count: buildResult.processed_sender_count,
  processed_message_count: buildResult.processed_message_count,
  processed_cluster_count: buildResult.processed_cluster_count,
  indexed_corpus_size: coverageBefore.indexed_total_rows,
  indexed_inbox_rows: coverageBefore.indexed_inbox_rows,
  job_row: job,
  row_counts: rowCounts,
  finalized_preview_index_rows: expectedPreviewIndexRows,
  build_logs: buildLogs.map((entry) => entry.text),
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${PROOF_OUTPUT}`)
}

console.log(JSON.stringify(proof, null, 2))
