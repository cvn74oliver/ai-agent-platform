import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  clampGmailMailboxIndexMaxMessages,
  normalizeGmailMailboxIndexTrigger,
} from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  isMailboxIndexRunActive,
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
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

function buildActiveRunSummary(state: Awaited<ReturnType<typeof loadGmailMailboxIndexState>>) {
  if (!state?.active_run_id) return null
  return {
    run_id: state.active_run_id,
    mode: state.active_effective_mode ?? state.active_run_mode,
    requested_mode: state.active_requested_mode ?? null,
    effective_mode: state.active_effective_mode ?? state.active_run_mode ?? null,
    trigger: state.active_run_trigger,
    requested_max_messages: state.active_requested_max_messages,
    started_at: state.active_started_at,
    heartbeat_at: state.active_heartbeat_at,
    rows_before: state.active_rows_before ?? null,
    processed_messages: state.active_processed_messages ?? null,
    list_pages_fetched: state.active_list_pages_fetched ?? null,
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
  return {
    status,
    mode: state?.last_effective_mode ?? buildRunModeFromStatus(status) ?? state?.last_completed_mode ?? null,
    run_id: state?.last_run_id ?? null,
    trigger: state?.last_run_trigger ?? null,
    requested_mode: state?.last_requested_mode ?? null,
    effective_mode:
      state?.last_effective_mode ?? buildRunModeFromStatus(status) ?? state?.last_completed_mode ?? null,
    completed_at: state?.last_completed_at ?? null,
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
    const mode = body?.mode === 'full' ? 'full' : 'incremental'
    const requestedBackground = body?.background !== false
    const maxMessages = clampGmailMailboxIndexMaxMessages(
      typeof body?.max_messages === 'number' ? body.max_messages : null
    )
    const trigger = normalizeGmailMailboxIndexTrigger(body?.trigger, mode)
    const background = !(trigger === 'manual_full_reindex' && mode === 'full') && requestedBackground
    const runId = crypto.randomUUID()
    const currentState = await loadGmailMailboxIndexState({
      supabase: auth.supabase,
      tenantId: auth.tenantId,
    })
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

    if (background) {
      void syncGmailMailboxIndexForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        mode,
        maxMessages,
        allowFullRescanOnHistoryGap: true,
        logPrefix: '[integrations/gmail/mailbox-index/background]',
        runId,
        trigger,
      }).catch((error) => {
        console.error('[integrations/gmail/mailbox-index] background sync failed:', error)
      })

      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          data: {
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
      allowFullRescanOnHistoryGap: true,
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
