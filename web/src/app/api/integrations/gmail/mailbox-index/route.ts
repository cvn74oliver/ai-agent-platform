import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
  syncGmailMailboxIndexForTenant,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'

type AuthContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; tenantId: string }
  | { ok: false; response: NextResponse }

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
    const rawStatus = state?.last_sync_status ?? null
    const statusLower = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : ''
    const syncHealth =
      statusLower.includes('failed') || statusLower.includes('out_of_date')
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
        sync_health: syncHealth,
        usable_with_cached_index: indexedCount > 0,
        last_index_duration_ms: state?.last_index_duration_ms ?? null,
        has_gmail_connection: Boolean(gmailConnectionRow),
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
    const background = body?.background !== false
    const maxMessages =
      typeof body?.max_messages === 'number' && Number.isFinite(body.max_messages)
        ? Math.min(Math.max(Math.round(body.max_messages), 1), 50_000)
        : 50_000

    if (background) {
      void syncGmailMailboxIndexForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        mode,
        maxMessages,
        allowFullRescanOnHistoryGap: true,
        logPrefix: '[integrations/gmail/mailbox-index/background]',
      }).catch((error) => {
        console.error('[integrations/gmail/mailbox-index] background sync failed:', error)
      })

      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          data: {
            mode,
            background: true,
            max_messages: maxMessages,
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
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          reason: result.reason,
          data: result,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    console.error('[integrations/gmail/mailbox-index] POST failed:', error)
    return NextResponse.json({ error: 'Unexpected error while indexing mailbox.' }, { status: 500 })
  }
}
