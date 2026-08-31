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

function optionalInteger(name, fallback) {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  assert.ok(Number.isFinite(parsed), `${name} must be an integer.`)
  return parsed
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
const artifactVersion = requiredText('TARGET_ARTIFACT_VERSION')
const jobId = requiredText('TARGET_JOB_ID')
const expectedPublishedVersion = requiredText('EXPECTED_PUBLISHED_VERSION')
const expectedJobPhase = process.env.EXPECTED_JOB_PHASE?.trim() || 'candidate_ready'
const expectedManifestCount = optionalInteger('EXPECTED_REVIEW_UNIT_MANIFEST_COUNT', 60)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const [publication, job, rowCounts, manifestResult] = await Promise.all([
  loadGmailArtifactPublicationState({ supabase, tenantId, analysisScope }),
  loadGmailArtifactJobState({ supabase, jobId }),
  countGmailArtifactVersionRows({ supabase, tenantId, analysisScope, artifactVersion }),
  supabase
    .from('workspace_review_unit_projection_manifests')
    .select('parent_id,review_unit_id,validation_status')
    .eq('tenant_id', tenantId)
    .eq('analysis_scope', analysisScope)
    .eq('artifact_version', artifactVersion),
])

if (manifestResult.error) {
  throw new Error(`Failed to read review-unit projection manifests: ${manifestResult.error.message}`)
}
const manifests = manifestResult.data || []
const invalidManifests = manifests.filter(
  (manifest) => manifest.validation_status !== 'candidate_validated'
)
const parentCount = new Set(manifests.map((manifest) => manifest.parent_id)).size

assert.ok(publication, 'Publication state must exist.')
assert.equal(publication.published_version, expectedPublishedVersion)
assert.equal(publication.building_version, null, 'Publication must not have an active build lock.')
assert.ok(job, `Candidate job ${jobId} must exist.`)
assert.equal(job.tenant_id, tenantId)
assert.equal(job.analysis_scope, analysisScope)
assert.equal(job.artifact_version, artifactVersion)
assert.equal(job.status, 'completed')
assert.equal(job.phase, expectedJobPhase)
assert.ok(rowCounts.gmail_sender_scope_rollups > 0)
assert.ok(rowCounts.gmail_cluster_summaries > 0)
assert.ok(rowCounts.gmail_sender_workspace_seed_headers > 0)
assert.ok(rowCounts.gmail_sender_workspace_seed_rows > 0)
assert.ok(rowCounts.gmail_mailbox_intelligence_snapshots > 0)
assert.ok(rowCounts.gmail_mailbox_intelligence_buckets > 0)
assert.ok(rowCounts.gmail_preview_index > 0)
assert.equal(manifests.length, expectedManifestCount)
assert.equal(invalidManifests.length, 0)

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: tenantId,
  analysis_scope: analysisScope,
  target_artifact_version: artifactVersion,
  target_job_id: jobId,
  expected_job_phase: expectedJobPhase,
  publication_before: publication,
  candidate_job: job,
  candidate_row_counts: rowCounts,
  review_unit_projection: {
    manifest_count: manifests.length,
    validated_manifest_count: manifests.length - invalidManifests.length,
    parent_count: parentCount,
  },
}

writeProof(process.env.PROOF_OUTPUT, proof)
console.log(JSON.stringify(proof, null, 2))
