import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const envFilePath = path.join(webRoot, '.env.local')
const ANALYSIS_SCOPE = '30d'

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

function sortRecordDescending(record) {
  return Object.fromEntries(Object.entries(record).sort((left, right) => right[1] - left[1]))
}

loadEnvFile(envFilePath)

const tenantId =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadGmailMailboxIndexState,
} = await import('../src/lib/integrations/gmail/gmailMailboxIndexer.ts')
const {
  runGmailFullMailboxArtifactBuild,
} = await import('../src/lib/integrations/gmail/gmailArtifactBuildRunner.ts')
const {
  loadGmailArtifactPublicationState,
  loadGmailSenderScopeRollupsForArtifactVersion,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const indexState = await loadGmailMailboxIndexState({
  supabase,
  tenantId,
})

assert.equal(
  indexState?.active_run_id ?? null,
  null,
  'Cannot rebuild the 30d artifact while gmail_mailbox_index_state.active_run_id is set.'
)

async function loadRollupCountsForPublishedVersion() {
  const publication = await loadGmailArtifactPublicationState({
    supabase,
    tenantId,
    analysisScope: ANALYSIS_SCOPE,
  })
  const artifactVersion = publication?.published_version || null
  if (!artifactVersion) {
    return { publication, artifactVersion: null, groupCounts: {} }
  }

  const rollups = await loadGmailSenderScopeRollupsForArtifactVersion({
    supabase,
    tenantId,
    analysisScope: ANALYSIS_SCOPE,
    artifactVersion,
  })
  return {
    publication,
    artifactVersion,
    groupCounts: sortRecordDescending(
      rollups.reduce((accumulator, row) => {
        accumulator[row.assigned_cleanup_group_id] =
          (accumulator[row.assigned_cleanup_group_id] || 0) + 1
        return accumulator
      }, {})
    ),
  }
}

const before = await loadRollupCountsForPublishedVersion()
const { result: buildResult, entries: buildLogs } = await captureLogs(async () =>
  runGmailFullMailboxArtifactBuild({
    supabase,
    tenantId,
    analysisScope: ANALYSIS_SCOPE,
  })
)
const after = await loadRollupCountsForPublishedVersion()

assert.equal(
  after.publication?.published_version,
  buildResult.artifact_version,
  'Expected the 30d publication to move to the newly built artifact version.'
)

console.log(
  JSON.stringify(
    {
      ok: true,
      generated_at: new Date().toISOString(),
      tenant_id: tenantId,
      analysis_scope: ANALYSIS_SCOPE,
      build_job_id: buildResult.job_id,
      artifact_version: buildResult.artifact_version,
      publication_before: before.publication,
      publication_after: after.publication,
      group_counts_before: before.groupCounts,
      group_counts_after: after.groupCounts,
      build_logs: buildLogs.map((entry) => entry.text),
    },
    null,
    2
  )
)
