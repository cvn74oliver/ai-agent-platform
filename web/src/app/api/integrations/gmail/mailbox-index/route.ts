import { after, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  finishHeavyAction,
  logHeavyActionEvent,
  tryStartHeavyAction,
} from '@/lib/runtime/heavyActionSafety'
import {
  clampGmailMailboxIndexMaxMessages,
  GMAIL_OPERATOR_BACKFILL_INTENT,
  normalizeGmailOperatorBackfillWindowMonths,
  normalizeGmailMailboxIndexTrigger,
  type GmailOperatorBackfillWindowMonths,
} from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  isHistoricalBackfillWindowComplete,
  isManualFullRunActive,
  isMailboxIndexRunActive,
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxRecentHealthForTenant,
  loadGmailMailboxIndexState,
  primeAcceptedOperatorBackfillRunForTenant,
  primeAcceptedSmartSyncRunForTenant,
  syncGmailMailboxIndexForTenant,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import {
  refreshPublishedGmailArtifactsIncrementally,
  type GmailArtifactIncrementalRefreshHint,
} from '@/lib/integrations/gmail/gmailArtifactIncrementalUpdater'
import { runGmailFullMailboxArtifactBuild } from '@/lib/integrations/gmail/gmailArtifactBuildRunner'
import {
  loadGmailArtifactPublicationStatesForTenant,
  reconcileGmailArtifactBuildLiveness,
  updateGmailArtifactPublicationFreshness,
  type GmailArtifactAnalysisScope,
  type GmailArtifactBuildLivenessResult,
  type GmailArtifactFreshnessState,
  type GmailArtifactPublicationRow,
  type GmailArtifactRefreshStrategy,
} from '@/lib/integrations/gmail/gmailArtifactStore'

const MAILBOX_INDEX_MANUAL_ACTION_COOLDOWN_MS = 15 * 1000
const INCREMENTAL_REFRESH_MAX_CHANGED_MESSAGES = 2_000
const INCREMENTAL_REFRESH_MAX_AFFECTED_SENDERS = 500
const SMART_SYNC_MANAGED_ANALYSIS_SCOPES: GmailArtifactAnalysisScope[] = [
  'all_indexed',
  '7d',
  '30d',
  '90d',
  '180d',
  '365d',
]

type AuthContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; tenantId: string }
  | { ok: false; response: NextResponse }

type MailboxIndexSyncResult = Awaited<ReturnType<typeof syncGmailMailboxIndexForTenant>>

type MailboxIndexExecutionState =
  | 'idle'
  | 'running'
  | 'stalled'
  | 'completed'
  | 'completed_no_growth'
  | 'failed'

type ArtifactRefreshScopeTarget = {
  analysisScope: GmailArtifactAnalysisScope
  publication: GmailArtifactPublicationRow | null
  buildLiveness: GmailArtifactBuildLivenessResult
}

type ArtifactRefreshExecutionPlan = {
  analysisScope: GmailArtifactAnalysisScope
  action: 'none' | 'incremental' | 'full_rebuild'
  decisionState: GmailArtifactFreshnessState
  reason: string
  refreshStrategy: GmailArtifactRefreshStrategy | null
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function mailboxSyncProducedArtifactDrift(result: MailboxIndexSyncResult): boolean {
  if (!result.ok || ('deferred' in result && result.deferred)) return false
  return Boolean(
    result.rows_after !== result.rows_before ||
      result.processed_messages > 0 ||
      result.upserted_messages > 0 ||
      result.deleted_messages > 0
  )
}

async function buildArtifactRefreshScopeTargets(params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  tenantId: string
  publications: GmailArtifactPublicationRow[]
  logPrefix: string
}): Promise<ArtifactRefreshScopeTarget[]> {
  const publicationByScope = new Map(
    params.publications.map((publication) => [publication.analysis_scope, publication] as const)
  )
  const managedScopes = Array.from(
    new Set<GmailArtifactAnalysisScope>([
      ...SMART_SYNC_MANAGED_ANALYSIS_SCOPES,
      ...params.publications.map((publication) => publication.analysis_scope),
    ])
  )
  const targets = managedScopes.map((analysisScope) => ({
    analysisScope,
    publication: publicationByScope.get(analysisScope) ?? null,
  }))

  return Promise.all(
    targets.map(async (target) => {
      const buildLiveness = await reconcileGmailArtifactBuildLiveness({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: target.analysisScope,
        publication: target.publication,
        logPrefix: `${params.logPrefix}/artifact-build-liveness`,
      })

      return {
        analysisScope: target.analysisScope,
        publication: buildLiveness.publication,
        buildLiveness,
      }
    })
  )
}

function chooseArtifactRefreshPlanForScope(params: {
  target: ArtifactRefreshScopeTarget
  result: MailboxIndexSyncResult
  hint: GmailArtifactIncrementalRefreshHint | null
}): ArtifactRefreshExecutionPlan {
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

function toPublicMailboxIndexResult<T extends Record<string, unknown>>(result: T): T {
  const next = { ...result }
  delete next.artifact_refresh_hint
  return next
}

async function transitionArtifactPublicationFreshness(params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  currentPublication: GmailArtifactPublicationRow | null
  nextState: GmailArtifactFreshnessState
  reason: string
  refreshStrategy?: GmailArtifactRefreshStrategy | null
  refreshRequestedAt?: string | null
  refreshStartedAt?: string | null
  refreshCompletedAt?: string | null
  refreshJobId?: string | null
  refreshSyncRunId?: string | null
  logPrefix: string
}): Promise<GmailArtifactPublicationRow> {
  const nextPublication = await updateGmailArtifactPublicationFreshness({
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

  console.info(
    `${params.logPrefix}/freshness ${JSON.stringify({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      previous_state: params.currentPublication?.freshness_state ?? null,
      freshness_state: nextPublication.freshness_state,
      freshness_reason: nextPublication.freshness_reason,
      refresh_strategy: nextPublication.refresh_strategy,
      refresh_requested_at: nextPublication.refresh_requested_at,
      refresh_started_at: nextPublication.refresh_started_at,
      refresh_completed_at: nextPublication.refresh_completed_at,
      refresh_job_id: nextPublication.refresh_job_id,
      refresh_sync_run_id: nextPublication.refresh_sync_run_id,
      published_version: nextPublication.published_version,
      building_version: nextPublication.building_version,
    })}`
  )

  return nextPublication
}

async function refreshArtifactsAfterCompletedSync(params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  tenantId: string
  result: MailboxIndexSyncResult
  logPrefix: string
}): Promise<void> {
  const result = params.result
  if (!result.ok || ('deferred' in result && result.deferred)) return

  const refreshHint =
    result.effective_mode === 'incremental' ? result.artifact_refresh_hint ?? null : null
  const decisionAt = new Date().toISOString()
  const publications = await loadGmailArtifactPublicationStatesForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  const scopeTargets = await buildArtifactRefreshScopeTargets({
    supabase: params.supabase,
    tenantId: params.tenantId,
    publications,
    logPrefix: `${params.logPrefix}/artifact-refresh`,
  })
  const plans = scopeTargets.map((target) =>
    chooseArtifactRefreshPlanForScope({
      target,
      result,
      hint: refreshHint,
    })
  )

  console.info(
    `${params.logPrefix}/artifact-refresh ${JSON.stringify({
      tenant_id: params.tenantId,
      sync_run_id: result.run_id,
      effective_mode: result.effective_mode,
      trigger: result.trigger,
      rows_before: result.rows_before,
      rows_after: result.rows_after,
      growth_delta: result.growth_delta,
      processed_messages: result.processed_messages,
      upserted_messages: result.upserted_messages,
      deleted_messages: result.deleted_messages,
      changed_message_count: refreshHint?.changed_messages.length ?? 0,
      affected_sender_count: refreshHint?.affected_sender_keys.length ?? 0,
      build_liveness: scopeTargets.map((target) => ({
        analysis_scope: target.analysisScope,
        build_is_live: target.buildLiveness.build_is_live,
        reclaim_applied: target.buildLiveness.reclaim_applied,
        reclaim_reason: target.buildLiveness.reclaim_reason,
        liveness_status: target.buildLiveness.status,
      })),
      plans: plans.map((plan) => ({
        analysis_scope: plan.analysisScope,
        action: plan.action,
        freshness_state: plan.decisionState,
        refresh_strategy: plan.refreshStrategy,
        reason: plan.reason,
      })),
    })}`
  )

  for (const target of scopeTargets) {
    const plan = plans.find((entry) => entry.analysisScope === target.analysisScope)
    if (!plan) continue

    let publication = target.publication
    if (mailboxSyncProducedArtifactDrift(result) || !normalizeText(publication?.published_version)) {
      publication = await transitionArtifactPublicationFreshness({
        supabase: params.supabase,
        tenantId: params.tenantId,
        analysisScope: target.analysisScope,
        currentPublication: publication,
        nextState: 'stale',
        reason: 'sync_completed_artifact_refresh_required',
        refreshStrategy: plan.refreshStrategy,
        refreshRequestedAt: decisionAt,
        refreshSyncRunId: result.run_id,
        logPrefix: `${params.logPrefix}/artifact-refresh`,
      })
    }

    publication = await transitionArtifactPublicationFreshness({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope: target.analysisScope,
      currentPublication: publication,
      nextState: plan.decisionState,
      reason: plan.reason,
      refreshStrategy: plan.refreshStrategy,
      refreshRequestedAt: decisionAt,
      refreshCompletedAt: plan.decisionState === 'fresh' ? decisionAt : undefined,
      refreshSyncRunId: result.run_id,
      logPrefix: `${params.logPrefix}/artifact-refresh`,
    })

    try {
      if (plan.action === 'incremental' && refreshHint) {
        const refreshResult = await refreshPublishedGmailArtifactsIncrementally({
          supabase: params.supabase,
          tenantId: params.tenantId,
          hint: refreshHint,
          analysisScopes: [plan.analysisScope],
          logPrefix: `${params.logPrefix}/artifact-refresh`,
        })
        console.info(
          `${params.logPrefix}/artifact-refresh ${JSON.stringify({
            tenant_id: params.tenantId,
            sync_run_id: result.run_id,
            analysis_scope: plan.analysisScope,
            action: plan.action,
            ok: refreshResult.ok,
            scopes: refreshResult.scopes,
          })}`
        )
      } else if (plan.action === 'full_rebuild') {
        const buildResult = await runGmailFullMailboxArtifactBuild({
          supabase: params.supabase,
          tenantId: params.tenantId,
          analysisScope: plan.analysisScope,
        })
        console.info(
          `${params.logPrefix}/artifact-refresh ${JSON.stringify({
            tenant_id: params.tenantId,
            sync_run_id: result.run_id,
            analysis_scope: plan.analysisScope,
            action: plan.action,
            ok: true,
            artifact_version: buildResult.artifact_version,
            job_id: buildResult.job_id,
            processed_sender_count: buildResult.processed_sender_count,
            processed_message_count: buildResult.processed_message_count,
            processed_cluster_count: buildResult.processed_cluster_count,
          })}`
        )
      }
    } catch (error) {
      console.error(
        `${params.logPrefix}/artifact-refresh ${JSON.stringify({
          tenant_id: params.tenantId,
          sync_run_id: result.run_id,
          analysis_scope: plan.analysisScope,
          action: plan.action,
          error: error instanceof Error ? error.message : String(error),
        })}`
      )
    }
  }
}

function isAuthFailureReason(value: string | null | undefined): boolean {
  return (
    value === 'missing_connection' ||
    value === 'missing_token' ||
    value === 'insufficient_scope' ||
    value === 'refresh_failed' ||
    value === 'invalid_grant'
  )
}

function buildExecutionState(
  state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>
): MailboxIndexExecutionState {
  const status = state?.last_sync_status ?? null
  if (status === 'full_scan_in_progress' || status === 'incremental_sync_in_progress') {
    return isMailboxIndexRunActive(state) ? 'running' : 'stalled'
  }
  if (
    status === 'full_scan_complete_no_growth' ||
    status === 'incremental_sync_complete_no_growth'
  ) {
    return 'completed_no_growth'
  }
  if (
    status === 'full_scan_complete' ||
    status === 'incremental_sync_complete' ||
    status === 'incremental_sync_degraded'
  ) {
    return 'completed'
  }
  if (
    typeof status === 'string' &&
    (status.includes('failed') || status.includes('out_of_date') || status.includes('listing_failed'))
  ) {
    return 'failed'
  }
  return 'idle'
}

function buildRequiresReconnect(params: {
  hasGmailConnection: boolean
  state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>
}): boolean {
  if (!params.hasGmailConnection) return true
  const failureReason = params.state?.last_failure_reason ?? null
  if (isAuthFailureReason(failureReason)) return true
  const status = params.state?.last_sync_status ?? null
  if (status === 'full_scan_auth_failed' || status === 'incremental_sync_auth_failed') return true
  const error = params.state?.last_sync_error ?? ''
  return error.toLowerCase().includes('reconnect gmail')
}

function buildResumeCheckpointSummary(params: {
  pageToken: string | null | undefined
  pageIndex: number | null | undefined
  processedMessages: number | null | undefined
  processedAt: string | null | undefined
}) {
  const nextPageTokenPresent = Boolean(
    typeof params.pageToken === 'string' && params.pageToken.trim()
  )
  const pageIndex = typeof params.pageIndex === 'number' ? params.pageIndex : null
  const processedMessages =
    typeof params.processedMessages === 'number' ? params.processedMessages : null
  const processedAt =
    typeof params.processedAt === 'string' && params.processedAt.trim() ? params.processedAt : null
  const usable =
    nextPageTokenPresent &&
    ((pageIndex != null && pageIndex > 0) || (processedMessages != null && processedMessages > 0))
  return {
    usable,
    next_page_token_present: nextPageTokenPresent,
    page_index: pageIndex,
    processed_messages: processedMessages,
    processed_at: processedAt,
  }
}

function normalizeBackfillWindowMonths(
  value: number | null | undefined
): GmailOperatorBackfillWindowMonths | null {
  if (value === 24 || value === 36) return value
  return null
}

function normalizeBackfillCutoffAt(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

function buildHistoricalBackfillSummary(state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>) {
  return {
    active_window_months: normalizeBackfillWindowMonths(state?.active_backfill_window_months ?? null),
    active_cutoff_at: normalizeBackfillCutoffAt(state?.active_backfill_cutoff_at ?? null),
    completed_window_months: normalizeBackfillWindowMonths(
      state?.backfill_completed_window_months ?? null
    ),
    completed_cutoff_at: normalizeBackfillCutoffAt(state?.backfill_completed_cutoff_at ?? null),
    completed_at:
      typeof state?.backfill_completed_at === 'string' && state.backfill_completed_at.trim()
        ? state.backfill_completed_at
        : null,
  }
}

function buildActiveRunSummary(state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>) {
  if (!state?.active_run_id) return null
  const resumeCheckpoint =
    state.active_run_trigger === 'operator_backfill'
      ? buildResumeCheckpointSummary({
          pageToken: state.backfill_resume_page_token,
          pageIndex: state.backfill_resume_page_index,
          processedMessages: state.backfill_resume_processed_messages,
          processedAt: state.backfill_resume_processed_at,
        })
      : buildResumeCheckpointSummary({
          pageToken: state.active_next_page_token,
          pageIndex: state.active_last_page_index,
          processedMessages: state.active_processed_messages,
          processedAt: state.active_last_processed_at,
        })
  return {
    run_id: state.active_run_id,
    mode: state.active_effective_mode ?? state.active_run_mode,
    requested_mode: state.active_requested_mode ?? null,
    effective_mode: state.active_effective_mode ?? state.active_run_mode ?? null,
    trigger: state.active_run_trigger,
    requested_max_messages: state.active_requested_max_messages,
    started_at: state.active_started_at,
    heartbeat_at: state.active_heartbeat_at,
    started_from_checkpoint: state.active_started_from_checkpoint ?? null,
    rows_before: state.active_rows_before ?? null,
    processed_messages: state.active_processed_messages ?? null,
    list_pages_fetched: state.active_list_pages_fetched ?? null,
    backfill_window_months:
      state.active_run_trigger === 'operator_backfill'
        ? normalizeBackfillWindowMonths(state.active_backfill_window_months ?? null)
        : null,
    backfill_cutoff_at:
      state.active_run_trigger === 'operator_backfill'
        ? normalizeBackfillCutoffAt(state.active_backfill_cutoff_at ?? null)
        : null,
    resume_checkpoint: resumeCheckpoint,
    yield_detail: state.active_yield_detail ?? null,
  }
}

function buildRunModeFromStatus(status: string | null | undefined): 'full' | 'incremental' | null {
  if (typeof status !== 'string') return null
  if (status.startsWith('full_scan')) return 'full'
  if (status.startsWith('incremental_')) return 'incremental'
  return null
}

function buildLastResultSummary(state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>) {
  const hasResult =
    state?.last_completed_at != null ||
    state?.last_requested_mode != null ||
    state?.last_effective_mode != null ||
    state?.last_rows_before != null ||
    state?.last_rows_after != null ||
    state?.last_sync_error != null ||
    state?.last_failure_reason != null ||
    state?.last_failure_reason_detail != null ||
    state?.last_terminal_reason != null
  if (!hasResult) return null
  const status = state?.last_sync_status ?? null
  const resumeCheckpoint =
    state?.last_run_trigger === 'operator_backfill'
      ? buildResumeCheckpointSummary({
          pageToken: state?.backfill_resume_page_token,
          pageIndex: state?.backfill_resume_page_index,
          processedMessages: state?.backfill_resume_processed_messages,
          processedAt: state?.backfill_resume_processed_at,
        })
      : buildResumeCheckpointSummary({
          pageToken: state?.last_resume_page_token,
          pageIndex: state?.last_resume_page_index,
          processedMessages: state?.last_processed_messages,
        processedAt: state?.last_resume_processed_at,
      })
  const historicalBackfillSummary = buildHistoricalBackfillSummary(state)
  return {
    status,
    mode: state?.last_effective_mode ?? buildRunModeFromStatus(status) ?? state?.last_completed_mode ?? null,
    run_id: state?.last_run_id ?? null,
    trigger: state?.last_run_trigger ?? null,
    requested_mode: state?.last_requested_mode ?? null,
    effective_mode:
      state?.last_effective_mode ?? buildRunModeFromStatus(status) ?? state?.last_completed_mode ?? null,
    completed_at: state?.last_completed_at ?? null,
    started_from_checkpoint: state?.last_started_from_checkpoint ?? null,
    rows_before: state?.last_rows_before ?? null,
    rows_after: state?.last_rows_after ?? null,
    growth_delta: state?.last_growth_delta ?? null,
    processed_messages: state?.last_processed_messages ?? null,
    upserted_messages: state?.last_upserted_messages ?? null,
    deleted_messages: state?.last_deleted_messages ?? null,
    failure_reason: state?.last_failure_reason ?? null,
    failure_reason_detail: state?.last_failure_reason_detail ?? null,
    terminal_reason: state?.last_terminal_reason ?? null,
    gmail_result_size_estimate: state?.last_gmail_result_size_estimate ?? null,
    list_pages_fetched: state?.last_list_pages_fetched ?? null,
    backfill_window_months:
      state?.last_run_trigger === 'operator_backfill'
        ? historicalBackfillSummary.active_window_months ??
          historicalBackfillSummary.completed_window_months
        : null,
    backfill_cutoff_at:
      state?.last_run_trigger === 'operator_backfill'
        ? historicalBackfillSummary.active_cutoff_at ?? historicalBackfillSummary.completed_cutoff_at
        : null,
    resume_checkpoint: resumeCheckpoint,
    yield_detail: state?.last_yield_detail ?? null,
  }
}

async function resolveAuthContext(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[integrations/gmail/mailbox-index] auth error:', authError)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Failed to authenticate user.' }, { status: 500 }),
    }
  }
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[integrations/gmail/mailbox-index] profile lookup failed:', profileError)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Failed to resolve tenant.' }, { status: 500 }),
    }
  }

  const tenantId = typeof profileRow?.tenant_id === 'string' ? profileRow.tenant_id.trim() : ''
  if (!tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User profile is missing tenant_id.' }, { status: 400 }),
    }
  }

  return { ok: true, supabase, tenantId }
}

export async function GET() {
  try {
    const auth = await resolveAuthContext()
    if (!auth.ok) return auth.response

    const [state, coverage, publications, recentHealth] = await Promise.all([
      loadGmailMailboxIndexState({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
      }),
      loadGmailMailboxIndexCoverageForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
      }),
      loadGmailArtifactPublicationStatesForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
      }),
      loadGmailMailboxRecentHealthForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
      }),
    ])
    const { data: gmailConnectionRow, error: gmailConnectionError } = await auth.supabase
      .from('integration_connections')
      .select('tenant_id')
      .eq('tenant_id', auth.tenantId)
      .eq('provider', 'gmail')
      .maybeSingle()
    const indexedCount = coverage.indexed_total_rows
    const indexedInboxCount = coverage.indexed_inbox_rows
    const executionState = buildExecutionState(state)
    const hasGmailConnection = Boolean(gmailConnectionRow)
    const requiresReconnect = buildRequiresReconnect({
      hasGmailConnection,
      state,
    })
    const primaryPublication =
      publications.find((publication) => publication.analysis_scope === 'all_indexed') ??
      publications[0] ??
      null
    const historicalBackfill = buildHistoricalBackfillSummary(state)
    const hasFalseHealthyState = recentHealth.false_healthy_state
    const syncHealth =
      executionState === 'failed' || executionState === 'stalled'
        ? indexedCount > 0
          ? 'degraded_usable'
          : 'unavailable'
        : hasFalseHealthyState
          ? indexedCount > 0
            ? 'degraded_usable'
            : 'unavailable'
        : indexedCount > 0
          ? 'healthy'
          : 'uninitialized'

    return NextResponse.json({
      ok: true,
      data: {
        tenant_id: auth.tenantId,
        indexed_message_count: indexedCount,
        indexed_inbox_count: indexedInboxCount,
        indexed_total_rows: indexedCount,
        indexed_inbox_rows: indexedInboxCount,
        mailbox_estimated_total: state?.mailbox_estimated_total ?? null,
        index_completion_pct: state?.index_completion_pct ?? null,
        indexed_oldest_message_at: coverage.indexed_date_span_start,
        indexed_newest_message_at: coverage.indexed_date_span_end,
        indexed_date_span_start: coverage.indexed_date_span_start,
        indexed_date_span_end: coverage.indexed_date_span_end,
        last_full_scan_at: state?.last_full_scan_at ?? null,
        last_incremental_sync_at: state?.last_incremental_sync_at ?? null,
        last_sync_status: state?.last_sync_status ?? null,
        last_sync_error: state?.last_sync_error ?? null,
        execution_state: executionState,
        active_run: buildActiveRunSummary(state),
        last_result: buildLastResultSummary(state),
        historical_backfill: historicalBackfill,
        requires_reconnect: requiresReconnect,
        coverage_increased:
          executionState === 'running' || executionState === 'stalled'
            ? null
            : typeof state?.last_growth_delta === 'number'
              ? state.last_growth_delta > 0
              : null,
        sync_health: syncHealth,
        usable_with_cached_index: indexedCount > 0 && !hasFalseHealthyState,
        recent_window_health: recentHealth,
        last_index_duration_ms: state?.last_index_duration_ms ?? null,
        has_gmail_connection: hasGmailConnection,
        artifact_refresh: primaryPublication
          ? {
              analysis_scope: primaryPublication.analysis_scope,
              freshness_state: primaryPublication.freshness_state,
              freshness_reason: primaryPublication.freshness_reason,
              refresh_strategy: primaryPublication.refresh_strategy,
              refresh_requested_at: primaryPublication.refresh_requested_at,
              refresh_started_at: primaryPublication.refresh_started_at,
              refresh_completed_at: primaryPublication.refresh_completed_at,
              refresh_job_id: primaryPublication.refresh_job_id,
              refresh_sync_run_id: primaryPublication.refresh_sync_run_id,
              published_version: primaryPublication.published_version,
              building_version: primaryPublication.building_version,
              build_status: primaryPublication.build_status,
            }
          : null,
        artifact_publications: publications.map((publication) => ({
          analysis_scope: publication.analysis_scope,
          freshness_state: publication.freshness_state,
          freshness_reason: publication.freshness_reason,
          refresh_strategy: publication.refresh_strategy,
          refresh_requested_at: publication.refresh_requested_at,
          refresh_started_at: publication.refresh_started_at,
          refresh_completed_at: publication.refresh_completed_at,
          refresh_job_id: publication.refresh_job_id,
          refresh_sync_run_id: publication.refresh_sync_run_id,
          published_version: publication.published_version,
          building_version: publication.building_version,
          build_status: publication.build_status,
        })),
        state,
        status_error: null,
        connection_error: gmailConnectionError ? gmailConnectionError.message : null,
      },
    })
  } catch (error) {
    console.error('[integrations/gmail/mailbox-index] GET failed:', error)
    return NextResponse.json({ error: 'Unexpected error while loading mailbox index status.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const requestStartedAt = Date.now()
    const auth = await resolveAuthContext()
    if (!auth.ok) return auth.response

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const requestedMode = body?.mode === 'full' ? 'full' : 'incremental'
    const requestedBackground = body?.background !== false
    const rawBackfillWindowMonths =
      typeof body?.backfill_window_months === 'number' ? body.backfill_window_months : null
    const requestedBackfillWindowMonths = normalizeGmailOperatorBackfillWindowMonths(
      rawBackfillWindowMonths
    )
    const operatorIntent =
      typeof body?.operator_intent === 'string' ? body.operator_intent.trim() : ''
    const maxMessages = clampGmailMailboxIndexMaxMessages(
      typeof body?.max_messages === 'number' ? body.max_messages : null
    )
    const trigger = normalizeGmailMailboxIndexTrigger(body?.trigger, requestedMode)
    const recentHealth =
      trigger === 'smart_sync' || trigger === 'manual_full_reindex'
        ? await loadGmailMailboxRecentHealthForTenant({
            supabase: auth.supabase,
            tenantId: auth.tenantId,
          })
        : null
    const forceFreshHeadRecovery =
      recentHealth?.false_healthy_state === true &&
      (trigger === 'smart_sync' || trigger === 'manual_full_reindex')
    const heavyActionKey = ['mailbox_index_manual_action', auth.tenantId].join('::')
    const logHeavyMailboxIndexAction = (params: {
      blockedBy: 'already_running' | 'cooldown_active' | null
      outcome: string
      extra?: Record<string, unknown>
    }) => {
      logHeavyActionEvent({
        category: 'mailbox_index',
        route: '/api/integrations/gmail/mailbox-index',
        action: trigger,
        triggerSource: typeof body?.trigger === 'string' ? body.trigger.trim() || null : null,
        requestMode: mode,
        tenantId: auth.tenantId,
        agentId: null,
        blockedBy: params.blockedBy,
        durationMs: Date.now() - requestStartedAt,
        outcome: params.outcome,
        extra: params.extra,
      })
    }
    if (trigger === 'operator_backfill' && operatorIntent !== GMAIL_OPERATOR_BACKFILL_INTENT) {
      console.warn(
        '[integrations/gmail/mailbox-index] operator_backfill_rejected_missing_explicit_intent',
        {
          tenantId: auth.tenantId,
          provided_operator_intent: operatorIntent || null,
        }
      )
      return NextResponse.json(
        {
          ok: false,
          error: 'Continue Backfill must be started from the explicit operator action.',
          reason: 'operator_backfill_requires_explicit_intent',
        },
        { status: 400 }
      )
    }
    if (
      trigger === 'operator_backfill' &&
      rawBackfillWindowMonths != null &&
      rawBackfillWindowMonths !== 24 &&
      rawBackfillWindowMonths !== 36
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Continue Backfill supports only 24-month or 36-month historical windows.',
          reason: 'invalid_backfill_window',
        },
        { status: 400 }
      )
    }
    const mode =
      trigger === 'smart_sync'
        ? forceFreshHeadRecovery
          ? 'full'
          : 'incremental'
        : trigger === 'operator_backfill'
          ? 'full'
          : requestedMode
    const background =
      trigger === 'smart_sync' || trigger === 'operator_backfill'
        ? true
        : !(trigger === 'manual_full_reindex' && mode === 'full') && requestedBackground
    const guard = tryStartHeavyAction({
      key: heavyActionKey,
      cooldownMs: MAILBOX_INDEX_MANUAL_ACTION_COOLDOWN_MS,
    })
    if (!guard.ok) {
      logHeavyMailboxIndexAction({
        blockedBy: guard.reason,
        outcome: 'blocked',
        extra: {
          retry_after_ms: guard.retryAfterMs,
          requested_mode: requestedMode,
          effective_mode: mode,
          background,
          force_fresh_head_recovery: forceFreshHeadRecovery,
        },
      })
      return NextResponse.json(
        {
          ok: false,
          error:
            guard.reason === 'already_running'
              ? 'A mailbox index action is already running for this tenant.'
              : 'A mailbox index action was started moments ago. Please wait briefly before trying again.',
          reason: guard.reason,
          retry_after_ms: guard.retryAfterMs,
        },
        { status: 409 }
      )
    }
    const runId = crypto.randomUUID()
    try {
      const currentState = await loadGmailMailboxIndexState({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
      })
      if (trigger !== 'manual_full_reindex' && isManualFullRunActive(currentState)) {
        logHeavyMailboxIndexAction({
          blockedBy: 'already_running',
          outcome: 'manual_full_run_active',
          extra: {
            requested_mode: requestedMode,
            effective_mode: mode,
            background,
            force_fresh_head_recovery: forceFreshHeadRecovery,
          },
        })
        return NextResponse.json({
          ok: true,
          deferred: true,
          reason: 'manual_full_run_active',
          data: {
            execution_state: 'running',
            active_run: buildActiveRunSummary(currentState),
          },
        })
      }
      if (isMailboxIndexRunActive(currentState)) {
        logHeavyMailboxIndexAction({
          blockedBy: 'already_running',
          outcome: 'already_running',
          extra: {
            requested_mode: requestedMode,
            effective_mode: mode,
            background,
            force_fresh_head_recovery: forceFreshHeadRecovery,
          },
        })
        return NextResponse.json(
          {
            ok: false,
            error: 'A mailbox index run is already in progress for this tenant.',
            reason: 'already_running',
            data: {
              execution_state: 'running',
              active_run: buildActiveRunSummary(currentState),
            },
          },
          { status: 409 }
        )
      }
      if (
        trigger === 'operator_backfill' &&
        isHistoricalBackfillWindowComplete({
          state: currentState,
          requestedWindowMonths: requestedBackfillWindowMonths,
        })
      ) {
        logHeavyMailboxIndexAction({
          blockedBy: null,
          outcome: 'historical_window_complete',
          extra: {
            requested_mode: requestedMode,
            effective_mode: mode,
            background,
            requested_backfill_window_months: requestedBackfillWindowMonths,
            force_fresh_head_recovery: forceFreshHeadRecovery,
          },
        })
        return NextResponse.json({
          ok: true,
          complete: true,
          reason: 'historical_window_complete',
          data: {
            trigger,
            requested_mode: mode,
            effective_mode: mode,
            execution_state: buildExecutionState(currentState),
            historical_backfill: buildHistoricalBackfillSummary(currentState),
            requested_backfill_window_months: requestedBackfillWindowMonths,
          },
        })
      }

      if (background) {
      let acceptedRunData:
        | {
            run_id: string
            mode: 'full' | 'incremental'
            requested_mode: 'full' | 'incremental'
            effective_mode: 'full' | 'incremental'
            trigger: typeof trigger
            background: true
            max_messages: number
            execution_state: 'running'
            rows_before?: number
            resume_checkpoint?: unknown
            started_from_checkpoint?: boolean
            backfill_window_months?: GmailOperatorBackfillWindowMonths | null
            backfill_cutoff_at?: string | null
          }
        | null = null

        if (trigger === 'smart_sync') {
          const acceptedRun = await primeAcceptedSmartSyncRunForTenant({
            supabase: auth.supabase,
            tenantId: auth.tenantId,
            runId,
            maxMessages,
            forceFreshHeadRecovery,
            currentState,
          })
          acceptedRunData = {
            run_id: acceptedRun.run_id,
            mode: acceptedRun.effective_mode,
            requested_mode: acceptedRun.requested_mode,
            effective_mode: acceptedRun.effective_mode,
            trigger,
            background: true,
            max_messages: maxMessages,
            execution_state: 'running',
            rows_before: acceptedRun.rows_before,
            resume_checkpoint: acceptedRun.resume_checkpoint,
            started_from_checkpoint: acceptedRun.started_from_checkpoint,
          }
        } else if (trigger === 'operator_backfill') {
          const acceptedRun = await primeAcceptedOperatorBackfillRunForTenant({
            supabase: auth.supabase,
            tenantId: auth.tenantId,
            runId,
            maxMessages,
            backfillWindowMonths: requestedBackfillWindowMonths,
            currentState,
          })
          acceptedRunData = {
            run_id: acceptedRun.run_id,
            mode: acceptedRun.effective_mode,
            requested_mode: acceptedRun.requested_mode,
            effective_mode: acceptedRun.effective_mode,
            trigger,
            background: true,
            max_messages: maxMessages,
            execution_state: 'running',
            rows_before: acceptedRun.rows_before,
            resume_checkpoint: acceptedRun.resume_checkpoint,
            started_from_checkpoint: acceptedRun.started_from_checkpoint,
            backfill_window_months: acceptedRun.backfill_window_months ?? null,
            backfill_cutoff_at: acceptedRun.backfill_cutoff_at ?? null,
          }
        }

        after(async () => {
          try {
            const result = await syncGmailMailboxIndexForTenant({
              supabase: auth.supabase,
              tenantId: auth.tenantId,
              mode,
              maxMessages,
              allowFullRescanOnHistoryGap: trigger !== 'smart_sync',
              forceFreshHeadRecovery,
              backfillWindowMonths:
                trigger === 'operator_backfill' ? requestedBackfillWindowMonths : undefined,
              logPrefix: '[integrations/gmail/mailbox-index/background]',
              runId,
              trigger,
            })
            await refreshArtifactsAfterCompletedSync({
              supabase: auth.supabase,
              tenantId: auth.tenantId,
              result,
              logPrefix: '[integrations/gmail/mailbox-index/background]',
            })
          } catch (error) {
            console.error('[integrations/gmail/mailbox-index] background sync failed:', error)
          }
        })

        logHeavyMailboxIndexAction({
          blockedBy: null,
          outcome: 'accepted',
          extra: {
            requested_mode: requestedMode,
            effective_mode: mode,
            background: true,
            max_messages: maxMessages,
            force_fresh_head_recovery: forceFreshHeadRecovery,
            run_id: acceptedRunData?.run_id || runId,
            rows_before: acceptedRunData?.rows_before ?? null,
            backfill_window_months: acceptedRunData?.backfill_window_months ?? null,
          },
        })
        return NextResponse.json(
          {
            ok: true,
            accepted: true,
            data: acceptedRunData ?? {
              run_id: runId,
              mode,
              requested_mode: mode,
              effective_mode: mode,
              trigger,
              background: true,
              max_messages: maxMessages,
              execution_state: 'running',
            },
            recent_window_health: recentHealth,
          },
          { status: 202 }
        )
      }

      const result = await syncGmailMailboxIndexForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        mode,
        maxMessages,
        allowFullRescanOnHistoryGap: trigger !== 'smart_sync',
        forceFreshHeadRecovery,
        backfillWindowMonths:
          trigger === 'operator_backfill' ? requestedBackfillWindowMonths : undefined,
        logPrefix: '[integrations/gmail/mailbox-index]',
        runId,
        trigger,
      })

      if (!result.ok) {
        logHeavyMailboxIndexAction({
          blockedBy: result.reason === 'already_running' ? 'already_running' : null,
          outcome: 'failed',
          extra: {
            requested_mode: requestedMode,
            effective_mode: mode,
            background: false,
            max_messages: maxMessages,
            force_fresh_head_recovery: forceFreshHeadRecovery,
            reason: result.reason,
          },
        })
        return NextResponse.json(
          {
            ok: false,
            error: result.error,
            reason: result.reason,
            data: toPublicMailboxIndexResult(result),
          },
          { status: result.reason === 'already_running' ? 409 : 400 }
        )
      }

      after(async () => {
        await refreshArtifactsAfterCompletedSync({
          supabase: auth.supabase,
          tenantId: auth.tenantId,
          result,
          logPrefix: '[integrations/gmail/mailbox-index]',
        })
      })

      logHeavyMailboxIndexAction({
        blockedBy: null,
        outcome: 'completed',
        extra: {
          requested_mode: requestedMode,
          effective_mode: mode,
          background: false,
          max_messages: maxMessages,
          processed_messages: result.processed_messages,
          upserted_messages: result.upserted_messages,
          deleted_messages: result.deleted_messages,
          rows_before: result.rows_before,
          rows_after: result.rows_after,
          growth_delta: result.growth_delta,
        },
      })
      return NextResponse.json({ ok: true, data: toPublicMailboxIndexResult(result) })
    } finally {
      finishHeavyAction({
        key: heavyActionKey,
        cooldownMs: MAILBOX_INDEX_MANUAL_ACTION_COOLDOWN_MS,
      })
    }
  } catch (error) {
    console.error('[integrations/gmail/mailbox-index] POST failed:', error)
    return NextResponse.json({ error: 'Unexpected error while indexing mailbox.' }, { status: 500 })
  }
}
