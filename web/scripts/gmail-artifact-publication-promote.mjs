import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function requiredText(name) {
  const value = process.env[name]?.trim()
  assert.ok(value, `${name} is required.`)
  return value
}

function writeProof(filePath, proof) {
  if (!filePath) return
  const resolved = path.resolve(process.cwd(), filePath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
}

loadEnvFile(path.join(webRoot, '.env.local'))

const tenantId = process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const analysisScope = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const action = process.env.GMAIL_PUBLICATION_ACTION?.trim() || 'publish'
const artifactVersion = requiredText('TARGET_ARTIFACT_VERSION')
const jobId = requiredText('TARGET_JOB_ID')
const expectedPublishedVersion = requiredText('EXPECTED_PUBLISHED_VERSION')

assert.ok(action === 'publish' || action === 'rollback', 'GMAIL_PUBLICATION_ACTION must be publish or rollback.')

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
  publishGmailArtifactBuild,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const publicationBefore = await loadGmailArtifactPublicationState({
  supabase,
  tenantId,
  analysisScope,
})
const [job, rowCounts] = await Promise.all([
  loadGmailArtifactJobState({ supabase, jobId }),
  countGmailArtifactVersionRows({ supabase, tenantId, analysisScope, artifactVersion }),
])

assert.ok(publicationBefore, 'Publication state must exist.')
assert.equal(publicationBefore.published_version, expectedPublishedVersion)
assert.equal(publicationBefore.building_version, null, 'Publication must not have an active build lock.')
assert.ok(job, `Target job ${jobId} must exist.`)
assert.equal(job.tenant_id, tenantId)
assert.equal(job.analysis_scope, analysisScope)
assert.equal(job.artifact_version, artifactVersion)
assert.equal(job.status, 'completed')
if (action === 'publish') assert.equal(job.phase, 'candidate_ready')
assert.ok(rowCounts.gmail_sender_scope_rollups > 0)
assert.ok(rowCounts.gmail_cluster_summaries > 0)
assert.ok(rowCounts.gmail_sender_workspace_seed_headers > 0)
assert.ok(rowCounts.gmail_sender_workspace_seed_rows > 0)
assert.ok(rowCounts.gmail_mailbox_intelligence_snapshots > 0)
assert.ok(rowCounts.gmail_mailbox_intelligence_buckets > 0)
assert.ok(rowCounts.gmail_preview_index > 0)
if (action === 'publish') {
  assert.ok(rowCounts.workspace_review_unit_projection_manifests > 0)
  assert.ok(rowCounts.workspace_review_unit_activity_buckets > 0)
}

await publishGmailArtifactBuild({
  supabase,
  jobId,
  tenantId,
  analysisScope,
  artifactVersion,
  lastIndexStateUpdatedAt: publicationBefore.last_index_state_updated_at,
  lastIndexedMessageCount: publicationBefore.last_indexed_message_count,
  processedSenderCount: job.processed_sender_count,
  processedMessageCount: job.processed_message_count,
  processedClusterCount: job.processed_cluster_count,
  markJobPublished: action === 'publish',
  expectedCurrentPublication: {
    published_version: publicationBefore.published_version,
    building_version: publicationBefore.building_version,
    build_status: publicationBefore.build_status,
    refresh_job_id: publicationBefore.refresh_job_id,
    last_index_state_updated_at: publicationBefore.last_index_state_updated_at,
    last_indexed_message_count: publicationBefore.last_indexed_message_count,
  },
})

const publicationAfter = await loadGmailArtifactPublicationState({
  supabase,
  tenantId,
  analysisScope,
})
assert.equal(publicationAfter?.published_version, artifactVersion)
assert.equal(publicationAfter?.building_version, null)

const proof = {
  ok: true,
  action,
  generated_at: new Date().toISOString(),
  tenant_id: tenantId,
  analysis_scope: analysisScope,
  target_artifact_version: artifactVersion,
  target_job_id: jobId,
  publication_before: publicationBefore,
  publication_after: publicationAfter,
  target_job: job,
  target_row_counts: rowCounts,
}

writeProof(process.env.PROOF_OUTPUT, proof)
console.log(JSON.stringify(proof, null, 2))
