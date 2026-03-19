import { after, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
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
  loadGmailMailboxIndexState,
  primeAcceptedOperatorBackfillRunForTenant,
  primeAcceptedSmartSyncRunForTenant,
  syncGmailMailboxIndexForTenant,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'

type AuthContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; tenantId: string }
  | { ok: false; response: NextResponse }

type MailboxIndexExecutionState =
  | 'idle'
  | 'running'
  | 'stalled'
  | 'completed'
  | 'completed_no_growth'
  | 'failed'

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

    const state = await loadGmailMailboxIndexState({
      supabase: auth.supabase,
      tenantId: auth.tenantId,
    })
    const coverage = await loadGmailMailboxIndexCoverageForTenant({
      supabase: auth.supabase,
      tenantId: auth.tenantId,
    })
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
    const historicalBackfill = buildHistoricalBackfillSummary(state)
    const syncHealth =
      executionState === 'failed' || executionState === 'stalled'
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
        usable_with_cached_index: indexedCount > 0,
        last_index_duration_ms: state?.last_index_duration_ms ?? null,
        has_gmail_connection: hasGmailConnection,
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
      trigger === 'smart_sync' ? 'incremental' : trigger === 'operator_backfill' ? 'full' : requestedMode
    const background =
      trigger === 'smart_sync' || trigger === 'operator_backfill'
        ? true
        : !(trigger === 'manual_full_reindex' && mode === 'full') && requestedBackground
    const runId = crypto.randomUUID()
    const currentState = await loadGmailMailboxIndexState({
      supabase: auth.supabase,
      tenantId: auth.tenantId,
    })
    if (trigger !== 'manual_full_reindex' && isManualFullRunActive(currentState)) {
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
          await syncGmailMailboxIndexForTenant({
            supabase: auth.supabase,
            tenantId: auth.tenantId,
            mode,
            maxMessages,
            allowFullRescanOnHistoryGap: trigger !== 'smart_sync',
            backfillWindowMonths:
              trigger === 'operator_backfill' ? requestedBackfillWindowMonths : undefined,
            logPrefix: '[integrations/gmail/mailbox-index/background]',
            runId,
            trigger,
          })
        } catch (error) {
          console.error('[integrations/gmail/mailbox-index] background sync failed:', error)
        }
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
      backfillWindowMonths:
        trigger === 'operator_backfill' ? requestedBackfillWindowMonths : undefined,
      logPrefix: '[integrations/gmail/mailbox-index]',
      runId,
      trigger,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          reason: result.reason,
          data: result,
        },
        { status: result.reason === 'already_running' ? 409 : 400 }
      )
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    console.error('[integrations/gmail/mailbox-index] POST failed:', error)
    return NextResponse.json({ error: 'Unexpected error while indexing mailbox.' }, { status: 500 })
  }
}
