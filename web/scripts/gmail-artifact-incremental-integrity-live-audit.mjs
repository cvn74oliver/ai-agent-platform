import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const scriptDir = path.dirname(new URL(import.meta.url).pathname)
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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
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

function mailboxSyncProducedArtifactDrift(result) {
  if (!result.ok || ('deferred' in result && result.deferred)) return false
  return Boolean(
    result.rows_after !== result.rows_before ||
      result.processed_messages > 0 ||
      result.upserted_messages > 0 ||
      result.deleted_messages > 0
  )
}

function toIncrementalComparableRow(row) {
  return {
    message_id: row.message_id,
    thread_id: row.thread_id,
    sender: row.sender,
    subject: row.subject,
    internal_date_ms: row.internal_date_ms,
    date: row.date,
    label_ids: Array.isArray(row.label_ids) ? row.label_ids : [],
    category_labels: Array.isArray(row.category_labels) ? row.category_labels : [],
    is_in_inbox: row.is_in_inbox === true,
    is_unread: row.is_unread === true,
    is_starred: row.is_starred === true,
    is_important: row.is_important === true,
  }
}

function summarizePublication(publication) {
  if (!publication) return null
  return {
    analysis_scope: publication.analysis_scope,
    published_version: publication.published_version,
    build_status: publication.build_status,
    freshness_state: publication.freshness_state,
    freshness_reason: publication.freshness_reason,
    refresh_strategy: publication.refresh_strategy,
    refresh_requested_at: publication.refresh_requested_at,
    refresh_started_at: publication.refresh_started_at,
    refresh_completed_at: publication.refresh_completed_at,
    refresh_job_id: publication.refresh_job_id,
    refresh_sync_run_id: publication.refresh_sync_run_id,
  }
}

function chooseRefreshPlan(params) {
  const publication = params.target.buildLiveness.publication
  const hasPublishedBaseline = Boolean(normalizeText(publication?.published_version))
  const buildInProgress = params.target.buildLiveness.build_is_live
  const syncProducedDrift = mailboxSyncProducedArtifactDrift(params.result)

  if (!hasPublishedBaseline) {
    return {
      analysisScope: params.target.analysisScope,
      action: buildInProgress ? 'none' : 'full_rebuild',
      decisionState: buildInProgress ? 'refresh_skipped' : 'full_rebuild_required',
      reason: buildInProgress
        ? 'refresh_skipped_missing_baseline_while_build_in_progress'
        : 'missing_published_baseline',
      refreshStrategy: 'full_rebuild',
    }
  }

  if (!syncProducedDrift) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'none',
      decisionState: 'fresh',
      reason: 'sync_completed_without_artifact_drift',
      refreshStrategy: publication?.refresh_strategy ?? null,
    }
  }

  if (buildInProgress) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'none',
      decisionState: 'refresh_skipped',
      reason: 'refresh_skipped_existing_build_in_progress',
      refreshStrategy:
        params.result.effective_mode === 'incremental' ? 'incremental' : 'full_rebuild',
    }
  }

  if (params.result.effective_mode !== 'incremental') {
    return {
      analysisScope: params.target.analysisScope,
      action: 'full_rebuild',
      decisionState: 'full_rebuild_required',
      reason:
        params.result.trigger === 'operator_backfill'
          ? 'operator_backfill_completed_requires_full_rebuild'
          : 'non_incremental_sync_requires_full_rebuild',
      refreshStrategy: 'full_rebuild',
    }
  }

  if (params.result.used_fallback_full_scan) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'full_rebuild',
      decisionState: 'full_rebuild_required',
      reason: 'incremental_sync_used_fallback_full_scan',
      refreshStrategy: 'full_rebuild',
    }
  }

  if (params.result.terminal_reason === 'incremental_sync_degraded') {
    return {
      analysisScope: params.target.analysisScope,
      action: 'full_rebuild',
      decisionState: 'full_rebuild_required',
      reason: 'incremental_sync_degraded_requires_full_rebuild',
      refreshStrategy: 'full_rebuild',
    }
  }

  if (!params.hint) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'full_rebuild',
      decisionState: 'full_rebuild_required',
      reason: 'incremental_sync_missing_refresh_hint',
      refreshStrategy: 'full_rebuild',
    }
  }

  if (
    params.hint.changed_messages.length === 0 ||
    params.hint.affected_sender_keys.length === 0
  ) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'none',
      decisionState: 'refresh_skipped',
      reason: 'refresh_skipped_no_incremental_scope_delta',
      refreshStrategy: 'incremental',
    }
  }

  return {
    analysisScope: params.target.analysisScope,
    action: 'incremental',
    decisionState: 'refresh_pending',
    reason: 'eligible_incremental_sync_delta',
    refreshStrategy: 'incremental',
  }
}

function assertDailyContinuity(params) {
  const { rows, expectedCount, label } = params
  assert.equal(rows.length, expectedCount, `${label} should have ${expectedCount} daily buckets.`)
  for (let index = 1; index < rows.length; index += 1) {
    const previousStartMs = Date.parse(rows[index - 1].bucket_start_at)
    const currentStartMs = Date.parse(rows[index].bucket_start_at)
    assert.equal(
      currentStartMs - previousStartMs,
      24 * 60 * 60 * 1000,
      `${label} bucket ${index + 1} should start exactly one day after the previous bucket.`
    )
  }
  for (const row of rows) {
    assert.equal(
      normalizeText(row.bucket_payload?.grouping_key),
      'day',
      `${label} buckets must stay on daily granularity.`
    )
    assert.ok(
      typeof row.bucket_value === 'number' && Number.isFinite(row.bucket_value),
      `${label} bucket values must be numeric.`
    )
  }
}

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null
const MANAGED_SCOPES = ['all_indexed', '7d', '30d']

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
  syncGmailMailboxIndexForTenant,
} = await import('../src/lib/integrations/gmail/gmailMailboxIndexer.ts')
const {
  refreshPublishedGmailArtifactsIncrementally,
} = await import('../src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts')
const { runGmailFullMailboxArtifactBuild } = await import(
  '../src/lib/integrations/gmail/gmailArtifactBuildRunner.ts'
)
const {
  loadGmailArtifactPublicationStatesForTenant,
  reconcileGmailArtifactBuildLiveness,
  updateGmailArtifactPublicationFreshness,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const supabase = await getSupabaseAdmin()
const [indexStateBefore, coverageBefore, publicationsBefore] = await Promise.all([
  loadGmailMailboxIndexState({ supabase, tenantId: TENANT_ID }),
  loadGmailMailboxIndexCoverageForTenant({ supabase, tenantId: TENANT_ID }),
  loadGmailArtifactPublicationStatesForTenant({ supabase, tenantId: TENANT_ID }),
])

assert.equal(
  indexStateBefore?.active_run_id ?? null,
  null,
  'Mailbox index must be idle before running the incremental integrity audit.'
)

const { data: recentMessage, error: recentMessageError } = await supabase
  .from('gmail_messages')
  .select(
    'message_id,thread_id,sender,subject,internal_date_ms,date,label_ids,category_labels,is_in_inbox,is_unread,is_starred,is_important'
  )
  .eq('tenant_id', TENANT_ID)
  .not('sender', 'is', null)
  .not('internal_date_ms', 'is', null)
  .order('internal_date_ms', { ascending: false })
  .limit(1)
  .maybeSingle()

if (recentMessageError) {
  throw new Error(`Failed to load a recent gmail_messages row: ${recentMessageError.message}`)
}
assert.ok(recentMessage, 'The incremental integrity audit requires at least one indexed Gmail message.')

const { result: syncResult, entries: syncLogs } = await captureLogs(async () =>
  syncGmailMailboxIndexForTenant({
    supabase,
    tenantId: TENANT_ID,
    mode: 'incremental',
    trigger: 'smart_sync',
    logPrefix: '[codex/gmail-artifact-integrity/smart-sync]',
  })
)

assert.equal(syncResult.ok, true, 'Smart Sync must complete successfully before artifact verification.')
assert.equal(
  'deferred' in syncResult ? syncResult.deferred : false,
  false,
  'Smart Sync unexpectedly deferred during the integrity audit.'
)

let verificationSource = 'real_smart_sync'
let drivingResult = syncResult
let drivingHint =
  syncResult.effective_mode === 'incremental' ? syncResult.artifact_refresh_hint ?? null : null

if (!mailboxSyncProducedArtifactDrift(syncResult) || !drivingHint) {
  verificationSource = 'synthetic_live_incremental_probe'
  const syntheticRunId = `codex-artifact-integrity-${Date.now()}`
  const comparableRow = toIncrementalComparableRow(recentMessage)
  drivingHint = {
    strategy: 'incremental',
    sync_run_id: syntheticRunId,
    affected_sender_keys: [recentMessage.sender],
    changed_messages: [
      {
        message_id: recentMessage.message_id,
        before: comparableRow,
        after: comparableRow,
      },
    ],
  }
  drivingResult = {
    ok: true,
    run_id: syntheticRunId,
    mode: 'incremental',
    requested_mode: 'incremental',
    effective_mode: 'incremental',
    trigger: 'smart_sync',
    rows_before: Math.max(0, coverageBefore.indexed_total_rows - 1),
    rows_after: coverageBefore.indexed_total_rows,
    growth_delta: 1,
    processed_messages: 1,
    upserted_messages: 1,
    deleted_messages: 0,
    used_fallback_full_scan: false,
    terminal_reason: null,
    artifact_refresh_hint: drivingHint,
  }
}

async function transitionPublicationFreshness(params) {
  return updateGmailArtifactPublicationFreshness({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: params.analysisScope,
    freshnessState: params.nextState,
    freshnessReason: params.reason,
    refreshStrategy: params.refreshStrategy,
    refreshRequestedAt: params.refreshRequestedAt,
    refreshStartedAt: params.refreshStartedAt,
    refreshCompletedAt: params.refreshCompletedAt,
    refreshJobId: params.refreshJobId,
    refreshSyncRunId: params.refreshSyncRunId,
  })
}

const { result: refreshExecution, entries: refreshLogs } = await captureLogs(async () => {
  const decisionAt = new Date().toISOString()
  const publications = await loadGmailArtifactPublicationStatesForTenant({
    supabase,
    tenantId: TENANT_ID,
  })
  const refreshTargets = await Promise.all(
    MANAGED_SCOPES.map(async (analysisScope) => {
      const publication =
        publications.find((entry) => entry.analysis_scope === analysisScope) ?? null
      const buildLiveness = await reconcileGmailArtifactBuildLiveness({
        supabase,
        tenantId: TENANT_ID,
        analysisScope,
        publication,
        logPrefix: '[codex/gmail-artifact-integrity/refresh]',
      })
      return {
        analysisScope,
        publication: buildLiveness.publication,
        buildLiveness,
      }
    })
  )

  const plans = refreshTargets.map((target) =>
    chooseRefreshPlan({
      target,
      result: drivingResult,
      hint: drivingHint,
    })
  )
  const executions = []

  for (const target of refreshTargets) {
    const plan = plans.find((entry) => entry.analysisScope === target.analysisScope)
    if (!plan) continue

    let publication = target.publication
    if (
      mailboxSyncProducedArtifactDrift(drivingResult) ||
      !normalizeText(publication?.published_version)
    ) {
      publication = await transitionPublicationFreshness({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: target.analysisScope,
        currentPublication: publication,
        nextState: 'stale',
        reason: 'sync_completed_artifact_refresh_required',
        refreshStrategy: plan.refreshStrategy,
        refreshRequestedAt: decisionAt,
        refreshSyncRunId: drivingResult.run_id,
      })
    }

    publication = await transitionPublicationFreshness({
      supabase,
      tenantId: TENANT_ID,
      analysisScope: target.analysisScope,
      currentPublication: publication,
      nextState: plan.decisionState,
      reason: plan.reason,
      refreshStrategy: plan.refreshStrategy,
      refreshRequestedAt: decisionAt,
      refreshCompletedAt: plan.decisionState === 'fresh' ? decisionAt : undefined,
      refreshSyncRunId: drivingResult.run_id,
    })

    if (plan.action === 'incremental' && drivingHint) {
      const refreshResult = await refreshPublishedGmailArtifactsIncrementally({
        supabase,
        tenantId: TENANT_ID,
        hint: drivingHint,
        analysisScopes: [plan.analysisScope],
        logPrefix: '[codex/gmail-artifact-integrity/refresh]',
      })
      executions.push({
        analysis_scope: plan.analysisScope,
        action: plan.action,
        result: refreshResult,
      })
      continue
    }

    if (plan.action === 'full_rebuild') {
      const buildResult = await runGmailFullMailboxArtifactBuild({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: plan.analysisScope,
      })
      executions.push({
        analysis_scope: plan.analysisScope,
        action: plan.action,
        result: buildResult,
      })
      continue
    }

    executions.push({
      analysis_scope: plan.analysisScope,
      action: plan.action,
      result: {
        freshness_state: plan.decisionState,
        reason: plan.reason,
      },
    })
  }

  return {
    targets: refreshTargets.map((target) => ({
      analysis_scope: target.analysisScope,
      publication: summarizePublication(target.publication),
      build_is_live: target.buildLiveness.build_is_live,
      reclaim_applied: target.buildLiveness.reclaim_applied,
      reclaim_reason: target.buildLiveness.reclaim_reason,
      liveness_status: target.buildLiveness.status,
    })),
    plans,
    executions,
  }
})

const combinedLogs = [...syncLogs, ...refreshLogs]
const forbiddenLogFragments = [
  'references missing header',
  'candidate message count no longer matches preview rows',
]
for (const fragment of forbiddenLogFragments) {
  assert.equal(
    combinedLogs.some((entry) => entry.text.includes(fragment)),
    false,
    `Observed forbidden integrity log fragment: ${fragment}`
  )
}

const publicationsAfter = await loadGmailArtifactPublicationStatesForTenant({
  supabase,
  tenantId: TENANT_ID,
})

const allIndexedAfter =
  publicationsAfter.find((publication) => publication.analysis_scope === 'all_indexed') ?? null
assert.ok(
  normalizeText(allIndexedAfter?.published_version),
  'Expected all_indexed to keep a published artifact after the integrity refresh.'
)
assert.equal(
  allIndexedAfter?.freshness_state,
  'fresh',
  'Expected all_indexed freshness to recover after the incremental integrity refresh.'
)
assert.equal(
  allIndexedAfter?.build_status,
  'published',
  'Expected all_indexed build_status to be published after the incremental integrity refresh.'
)

const scope30dAfter =
  publicationsAfter.find((publication) => publication.analysis_scope === '30d') ?? null
assert.ok(
  normalizeText(scope30dAfter?.published_version),
  'Expected 30d to have a published artifact for month-window verification.'
)
assert.equal(
  scope30dAfter?.freshness_state,
  'fresh',
  'Expected 30d freshness to be fresh after month-window verification.'
)

const scope7dAfter =
  publicationsAfter.find((publication) => publication.analysis_scope === '7d') ?? null
assert.ok(
  normalizeText(scope7dAfter?.published_version),
  'Expected 7d to have a published artifact for week-window verification.'
)
assert.equal(
  scope7dAfter?.freshness_state,
  'fresh',
  'Expected 7d freshness to be fresh after week-window verification.'
)

const { data: weekBuckets, error: weekBucketsError } = await supabase
  .from('gmail_mailbox_intelligence_buckets')
  .select('bucket_kind,bucket_key,bucket_start_at,bucket_end_at,bucket_value,bucket_payload')
  .eq('tenant_id', TENANT_ID)
  .eq('analysis_scope', '7d')
  .eq('artifact_version', scope7dAfter.published_version)
  .eq('bucket_kind', 'pressure_trend_last_week')
  .order('bucket_start_at', { ascending: true })

if (weekBucketsError) {
  throw new Error(`Failed to load 7d mailbox intelligence buckets: ${weekBucketsError.message}`)
}

const { data: monthBuckets, error: monthBucketsError } = await supabase
  .from('gmail_mailbox_intelligence_buckets')
  .select('bucket_kind,bucket_key,bucket_start_at,bucket_end_at,bucket_value,bucket_payload')
  .eq('tenant_id', TENANT_ID)
  .eq('analysis_scope', '30d')
  .eq('artifact_version', scope30dAfter.published_version)
  .eq('bucket_kind', 'pressure_trend_last_month')
  .order('bucket_start_at', { ascending: true })

if (monthBucketsError) {
  throw new Error(`Failed to load 30d mailbox intelligence buckets: ${monthBucketsError.message}`)
}

assertDailyContinuity({
  rows: weekBuckets || [],
  expectedCount: 7,
  label: '1W / 7d pressure trend',
})
assertDailyContinuity({
  rows: monthBuckets || [],
  expectedCount: 30,
  label: '1M / 30d pressure trend',
})

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  verification_source: verificationSource,
  smart_sync_result: syncResult,
  refresh_driver_result: {
    run_id: drivingResult.run_id,
    effective_mode: drivingResult.effective_mode,
    trigger: drivingResult.trigger,
    processed_messages: drivingResult.processed_messages,
    upserted_messages: drivingResult.upserted_messages,
    deleted_messages: drivingResult.deleted_messages,
    changed_message_count: drivingHint?.changed_messages.length ?? 0,
    affected_sender_count: drivingHint?.affected_sender_keys.length ?? 0,
  },
  publications_before: Object.fromEntries(
    publicationsBefore.map((publication) => [publication.analysis_scope, summarizePublication(publication)])
  ),
  refresh_execution: refreshExecution,
  publications_after: Object.fromEntries(
    publicationsAfter.map((publication) => [publication.analysis_scope, summarizePublication(publication)])
  ),
  week_bucket_count: weekBuckets?.length ?? 0,
  month_bucket_count: monthBuckets?.length ?? 0,
  week_bucket_preview: (weekBuckets || []).map((row) => ({
    bucket_start_at: row.bucket_start_at,
    bucket_value: row.bucket_value,
  })),
  month_bucket_preview: (monthBuckets || []).map((row) => ({
    bucket_start_at: row.bucket_start_at,
    bucket_value: row.bucket_value,
  })),
  forbidden_logs_absent: true,
  smart_sync_logs: syncLogs.map((entry) => entry.text),
  refresh_logs: refreshLogs.map((entry) => entry.text),
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
}

console.log(JSON.stringify(proof, null, 2))
