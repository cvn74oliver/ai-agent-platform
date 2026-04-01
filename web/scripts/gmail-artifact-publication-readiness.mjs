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
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

console.log('=== Gmail Artifact Publication Readiness ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadGmailArtifactPublicationState,
  reconcileGmailArtifactBuildLiveness,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const publicationBefore = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})

const buildLiveness = await reconcileGmailArtifactBuildLiveness({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  publication: publicationBefore,
  logPrefix: '[proof/gmail-artifact-publication-readiness]',
})

const proof = {
  ok: buildLiveness.build_is_live === false,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  analysis_scope: ANALYSIS_SCOPE,
  compare_and_set_ready: (buildLiveness.publication?.building_version ?? null) == null,
  publication_before: publicationBefore,
  build_liveness: buildLiveness,
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${PROOF_OUTPUT}`)
}

console.log(JSON.stringify(proof, null, 2))

