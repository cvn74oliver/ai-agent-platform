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
  }
}

const REQUIRED_RECENT_SCOPES = ['7d', '30d', '90d', '180d', '365d']
const MANAGED_SCOPES = ['all_indexed', ...REQUIRED_RECENT_SCOPES]
const INCREMENTAL_REFRESH_MAX_CHANGED_MESSAGES = 2_000
const INCREMENTAL_REFRESH_MAX_AFFECTED_SENDERS = 500
const TARGET_BUILD_SCOPE = '7d'
const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

loadEnvFile(envFilePath)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
} = await import('../src/lib/integrations/gmail/gmailMailboxIndexer.ts')
const {
  loadGmailArtifactPublicationState,
  loadGmailArtifactPublicationStatesForTenant,
  loadSelectedClusterRailFamily,
  reconcileGmailArtifactBuildLiveness,
  updateGmailArtifactPublicationFreshness,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')
const {
  runGmailFullMailboxArtifactBuild,
} = await import('../src/lib/integrations/gmail/gmailArtifactBuildRunner.ts')

function mailboxSyncProducedArtifactDrift(result) {
  if (!result.ok || ('deferred' in result && result.deferred)) return false
  return Boolean(
    result.rows_after !== result.rows_before ||
      result.processed_messages > 0 ||
      result.upserted_messages > 0 ||
      result.deleted_messages > 0
  )
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

  if (
    params.hint.changed_messages.length > INCREMENTAL_REFRESH_MAX_CHANGED_MESSAGES ||
    params.hint.affected_sender_keys.length > INCREMENTAL_REFRESH_MAX_AFFECTED_SENDERS
  ) {
    return {
      analysisScope: params.target.analysisScope,
      action: 'full_rebuild',
      decisionState: 'full_rebuild_required',
      reason: 'incremental_delta_exceeded_incremental_threshold',
      refreshStrategy: 'full_rebuild',
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

const supabase = await getSupabaseAdmin()
const [indexState, coverage, publicationsBefore] = await Promise.all([
  loadGmailMailboxIndexState({ supabase, tenantId: TENANT_ID }),
  loadGmailMailboxIndexCoverageForTenant({ supabase, tenantId: TENANT_ID }),
  loadGmailArtifactPublicationStatesForTenant({ supabase, tenantId: TENANT_ID }),
])

assert.equal(
  indexState?.active_run_id ?? null,
  null,
  'Mailbox index must be idle before running the live freshness audit.'
)

const allIndexedBefore =
  publicationsBefore.find((publication) => publication.analysis_scope === 'all_indexed') ?? null
assert.ok(
  normalizeText(allIndexedBefore?.published_version),
  'The live freshness audit requires an existing all_indexed published artifact.'
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
assert.ok(recentMessage, 'The live freshness audit requires at least one indexed Gmail message.')

const { data: clusterSummary, error: clusterSummaryError } = await supabase
  .from('gmail_cluster_summaries')
  .select('cluster_id,title,message_count')
  .eq('tenant_id', TENANT_ID)
  .eq('analysis_scope', 'all_indexed')
  .eq('artifact_version', allIndexedBefore.published_version)
  .order('message_count', { ascending: false })
  .limit(1)
  .maybeSingle()

if (clusterSummaryError) {
  throw new Error(`Failed to load a live all_indexed cluster summary: ${clusterSummaryError.message}`)
}
assert.ok(clusterSummary?.cluster_id, 'The live freshness audit requires at least one cluster.')

const familyBefore = await loadSelectedClusterRailFamily({
  supabase,
  tenantId: TENANT_ID,
  preferredClusterId: clusterSummary.cluster_id,
  clusterTitle: clusterSummary.title ?? null,
})

const syntheticRunId = `codex-freshness-audit-${Date.now()}`
const comparableRow = toIncrementalComparableRow(recentMessage)
const syntheticResult = {
  ok: true,
  run_id: syntheticRunId,
  mode: 'incremental',
  requested_mode: 'incremental',
  effective_mode: 'incremental',
  trigger: 'smart_sync',
  rows_before: Math.max(0, coverage.indexed_total_rows - 1),
  rows_after: coverage.indexed_total_rows,
  growth_delta: 1,
  processed_messages: 1,
  upserted_messages: 1,
  deleted_messages: 0,
  used_fallback_full_scan: false,
  terminal_reason: null,
  artifact_refresh_hint: {
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
  },
}
const refreshHint = syntheticResult.artifact_refresh_hint
const decisionAt = new Date().toISOString()
const refreshTargets = await Promise.all(
  Array.from(
    new Set([
      ...MANAGED_SCOPES,
      ...publicationsBefore.map((publication) => publication.analysis_scope),
    ])
  ).map(async (analysisScope) => {
    const publication =
      publicationsBefore.find((entry) => entry.analysis_scope === analysisScope) ?? null
    const buildLiveness = await reconcileGmailArtifactBuildLiveness({
      supabase,
      tenantId: TENANT_ID,
      analysisScope,
      publication,
      nowMs:
        publication?.build_status === 'building' &&
        (analysisScope === TARGET_BUILD_SCOPE ||
          (analysisScope === 'all_indexed' &&
            normalizeText(publication.refresh_job_id).startsWith('incremental:')))
          ? Date.now() + 31 * 60 * 1000
          : undefined,
      logPrefix: '[codex/live-audit/gmail-analysis-rail-freshness]/artifact-build-liveness',
    })
    return {
      analysisScope,
      publication: buildLiveness.publication,
      buildLiveness,
    }
  })
)
const refreshPlans = refreshTargets.map((target) =>
  chooseRefreshPlan({
    target,
    result: syntheticResult,
    hint: refreshHint,
  })
)
const queuedScopes = []
const executedScopes = []

for (const target of refreshTargets) {
  const plan = refreshPlans.find((entry) => entry.analysisScope === target.analysisScope)
  if (!plan) continue

  let publication = target.publication
  if (
    mailboxSyncProducedArtifactDrift(syntheticResult) ||
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
      refreshSyncRunId: syntheticRunId,
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
    refreshSyncRunId: syntheticRunId,
  })

  if (plan.action === 'incremental' && refreshHint) {
    queuedScopes.push({
      analysis_scope: plan.analysisScope,
      action: plan.action,
      freshness_state: plan.decisionState,
      reason: plan.reason,
    })
  } else if (plan.action === 'full_rebuild' && plan.analysisScope === TARGET_BUILD_SCOPE) {
    await runGmailFullMailboxArtifactBuild({
      supabase,
      tenantId: TENANT_ID,
      analysisScope: plan.analysisScope,
    })
    executedScopes.push({
      analysis_scope: plan.analysisScope,
      action: plan.action,
      status: 'completed',
    })
  } else if (plan.action === 'full_rebuild') {
    queuedScopes.push({
      analysis_scope: plan.analysisScope,
      action: plan.action,
      freshness_state: plan.decisionState,
      reason: plan.reason,
    })
  }
}

const publicationsAfterRefresh = await loadGmailArtifactPublicationStatesForTenant({
  supabase,
  tenantId: TENANT_ID,
})
const familyAfterRefresh = await loadSelectedClusterRailFamily({
  supabase,
  tenantId: TENANT_ID,
  preferredClusterId: clusterSummary.cluster_id,
  clusterTitle: clusterSummary.title ?? null,
})

const publicationScopesAfterRefresh = new Set(
  publicationsAfterRefresh.map((publication) => publication.analysis_scope)
)
for (const scope of REQUIRED_RECENT_SCOPES) {
  assert.ok(
    publicationScopesAfterRefresh.has(scope),
    `Expected Smart Sync refresh planning to manage ${scope} instead of silently skipping it.`
  )
}

const railStatesAfterRefresh = Object.fromEntries(
  familyAfterRefresh.family.scopes.map((entry) => [
    entry.scope,
    {
      state: entry.state,
      artifact_version: entry.artifact_version,
      visible_cluster_count: entry.visible_cluster_count,
    },
  ])
)

const freshnessProbeScope =
  publicationsAfterRefresh.find(
    (publication) =>
      REQUIRED_RECENT_SCOPES.includes(publication.analysis_scope) &&
      normalizeText(publication.published_version)
  )?.analysis_scope ?? 'all_indexed'
const publicationBeforeProbe = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: freshnessProbeScope,
})
assert.ok(
  normalizeText(publicationBeforeProbe?.published_version),
  `Expected a published artifact before running the live freshness probe for ${freshnessProbeScope}.`
)

const staleRequestedAt = new Date(Date.now() + 60 * 1000).toISOString()
const staleStartedAt = new Date(Date.now() - 60 * 1000).toISOString()
await updateGmailArtifactPublicationFreshness({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: freshnessProbeScope,
  freshnessState: 'refresh_failed',
  freshnessReason: 'codex_live_publish_freshness_probe',
  refreshStrategy: 'full_rebuild',
  refreshRequestedAt: staleRequestedAt,
  refreshStartedAt: staleStartedAt,
  refreshCompletedAt: null,
  refreshJobId: 'codex-live-freshness-probe',
  refreshSyncRunId: syntheticRunId,
})

const publicationAfterInjectedFailure = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: freshnessProbeScope,
})

const buildResult = await runGmailFullMailboxArtifactBuild({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: freshnessProbeScope,
})
const publicationAfterProbe = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: freshnessProbeScope,
})

assert.equal(publicationAfterProbe?.published_version, buildResult.artifact_version)
assert.equal(publicationAfterProbe?.build_status, 'published')
assert.equal(publicationAfterProbe?.freshness_state, 'fresh')
assert.equal(publicationAfterProbe?.freshness_reason, 'published_artifact_current')

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  indexed_message_count: coverage.indexed_total_rows,
  indexed_date_span_end: coverage.indexed_date_span_end,
  publications_before: publicationsBefore.map(summarizePublication),
  family_before: familyBefore.scope_resolution,
  smart_sync_refresh_probe: {
    synthetic_run_id: syntheticRunId,
    only_all_indexed_before_refresh:
      publicationsBefore.length === 1 && publicationsBefore[0]?.analysis_scope === 'all_indexed',
    refresh_plans: refreshPlans,
    queued_scopes: queuedScopes,
    executed_scopes: executedScopes,
    publications_after: publicationsAfterRefresh.map(summarizePublication),
    required_recent_scopes_present_after_refresh: REQUIRED_RECENT_SCOPES.filter((scope) =>
      publicationScopesAfterRefresh.has(scope)
    ),
    rail_states_after_refresh: railStatesAfterRefresh,
  },
  live_publish_freshness_probe: {
    analysis_scope: freshnessProbeScope,
    publication_before_probe: summarizePublication(publicationBeforeProbe),
    publication_after_injected_failure: summarizePublication(publicationAfterInjectedFailure),
    build_result: {
      job_id: buildResult.job_id,
      artifact_version: buildResult.artifact_version,
      processed_sender_count: buildResult.processed_sender_count,
      processed_message_count: buildResult.processed_message_count,
      processed_cluster_count: buildResult.processed_cluster_count,
    },
    publication_after_probe: summarizePublication(publicationAfterProbe),
  },
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
}

console.log(JSON.stringify(proof, null, 2))
