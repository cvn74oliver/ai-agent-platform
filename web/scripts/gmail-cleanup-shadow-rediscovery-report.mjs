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

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const ARTIFACT_VERSION =
  process.env.GMAIL_CLEANUP_SHADOW_ARTIFACT_VERSION || 'full-mailbox-20260329092447406'
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

console.log('=== Gmail Cleanup Shadow Rediscovery Report ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Pinned artifact version: ${ARTIFACT_VERSION}`)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  countGmailArtifactVersionRows,
  loadGmailArtifactPublicationState,
  loadGmailClusterSummariesForArtifactVersion,
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion,
  loadGmailSenderScopeRollupsForArtifactVersion,
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion,
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')
const {
  GMAIL_CLEANUP_SHADOW_BASELINE_VERSION,
  buildGmailCleanupShadowRediscoveryReport,
} = await import('../src/lib/integrations/gmail/gmailCleanupShadowRediscovery.ts')

assert.equal(
  ARTIFACT_VERSION,
  GMAIL_CLEANUP_SHADOW_BASELINE_VERSION,
  `Shadow rediscovery is pinned to ${GMAIL_CLEANUP_SHADOW_BASELINE_VERSION} for this pass.`
)

const supabase = await getSupabaseAdmin()
const publication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})
const rowCounts = await countGmailArtifactVersionRows({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: ARTIFACT_VERSION,
})
const [clusterSummaries, mailboxSnapshot, rollups, seedHeaders, seedRows] = await Promise.all([
  loadGmailClusterSummariesForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
  }),
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
  }),
  loadGmailSenderScopeRollupsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
  }),
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
  }),
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion: ARTIFACT_VERSION,
  }),
])

assert.ok(rowCounts.gmail_sender_scope_rollups > 0, 'Expected sender scope rollups for the pinned artifact.')
assert.ok(clusterSummaries.length > 0, 'Expected cluster summaries for the pinned artifact.')
assert.ok(seedHeaders.length > 0, 'Expected seed headers for the pinned artifact.')
assert.ok(seedRows.length > 0, 'Expected seed rows for the pinned artifact.')
assert.ok(mailboxSnapshot, 'Expected a mailbox intelligence snapshot for the pinned artifact.')

const report = buildGmailCleanupShadowRediscoveryReport({
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion: ARTIFACT_VERSION,
  rowCounts,
  clusterSummaries,
  seedHeaders,
  seedRows,
  rollups,
  mailboxSnapshots: mailboxSnapshot ? [mailboxSnapshot] : [],
})

assert.equal(
  report.publish_gate_report.pass,
  true,
  'Shadow rediscovery publish gates must pass for the approved baseline artifact.'
)

const proof = {
  ...report,
  publication_state: publication,
  baseline_row_counts: rowCounts,
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${PROOF_OUTPUT}`)
}

console.log(JSON.stringify(proof, null, 2))
