import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  finishHeavyAction,
  logHeavyActionEvent,
  tryStartHeavyAction,
} from '@/lib/runtime/heavyActionSafety'
import {
  analyzeGmailInboxForTenant,
  browseIndexedGmailQueryClusterMessagesForTenant,
  loadGmailCleanupGroupIntelligenceForTenant,
  loadGmailMessagePreviewForTenant,
  loadGmailMessageSnippetsForTenant,
  normalizeMailboxProfileScope,
  loadGmailSenderIndexSignalsForTenant,
  reviewGmailQueryClusterForTenant,
  reviewGmailSenderClusterForTenant,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailConfirmationPreviewForTenant,
  loadGmailMailboxIntelligenceForTenant,
  loadGmailPressureTrendForTenant,
  loadGmailSenderDistributionForTenant,
  loadGmailSenderWorkspaceForTenant,
} from '@/lib/integrations/gmail/gmailCleanupWorkspace'
import {
  DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE,
  GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE,
  MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE,
} from '@/lib/integrations/gmail/gmailWorkspaceContracts'

type AuthContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; tenantId: string }
  | { ok: false; response: NextResponse }

type RequestMeta = {
  source: string | null
  component: string | null
  reason: string | null
  phase: string | null
  agentId: string | null
}

const DISABLED_INITIAL_PAINT_LIVE_ACTIONS = new Set([
  'sender_distribution',
  'sender_workspace',
  'mailbox_intelligence',
  'mailbox_pressure_trend',
  'cleanup_group_intelligence',
  'confirmation_preview',
])

const HEAVY_INBOX_ANALYSIS_ACTIONS = new Set([
  'sender_distribution',
  'sender_workspace',
  'mailbox_intelligence',
  'mailbox_pressure_trend',
  'cleanup_group_intelligence',
  'confirmation_preview',
])

const HEAVY_INBOX_ANALYSIS_COOLDOWN_MS = 1500
function stableHeavyKey(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableHeavyKey(entry)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([key, entry]) => `${key}:${stableHeavyKey(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function heavyInboxAnalysisRequestKey(params: {
  tenantId: string
  action: string
  body: Record<string, unknown> | null
}): string | null {
  const payload = params.body || {}
  if (params.action === 'cleanup_group_intelligence' || params.action === 'mailbox_intelligence') {
    return [
      params.tenantId,
      params.action,
      stableHeavyKey({
        analysis_scope: payload.analysis_scope ?? null,
        cache_version: payload.cache_version ?? null,
        clusters: payload.clusters ?? [],
      }),
    ].join('::')
  }
  if (params.action === 'mailbox_pressure_trend') {
    return [
      params.tenantId,
      params.action,
      stableHeavyKey({
        cache_version: payload.cache_version ?? null,
        clusters: payload.clusters ?? [],
        pressure_window: payload.pressure_window ?? null,
        pressure_start: payload.pressure_start ?? null,
        pressure_end: payload.pressure_end ?? null,
        time_zone: payload.time_zone ?? null,
      }),
    ].join('::')
  }
  if (params.action === 'sender_workspace') {
    return [
      params.tenantId,
      params.action,
      stableHeavyKey({
        analysis_scope: payload.analysis_scope ?? null,
        cache_version: payload.cache_version ?? null,
        selected_cluster: payload.selected_cluster ?? null,
        page: payload.page ?? null,
        page_size: payload.page_size ?? null,
        search: payload.search ?? null,
        filter: payload.filter ?? null,
        sort: payload.sort ?? null,
        direction: payload.direction ?? null,
        semantic_focus: payload.semantic_focus ?? null,
      }),
    ].join('::')
  }
  if (params.action === 'sender_distribution') {
    return [
      params.tenantId,
      params.action,
      stableHeavyKey({
        analysis_scope: payload.analysis_scope ?? null,
        cache_version: payload.cache_version ?? null,
        selected_cluster: payload.selected_cluster ?? null,
      }),
    ].join('::')
  }
  if (params.action === 'confirmation_preview') {
    return [
      params.tenantId,
      params.action,
      stableHeavyKey({
        analysis_scope: payload.analysis_scope ?? null,
        cache_version: payload.cache_version ?? null,
        selected_cluster: payload.selected_cluster ?? null,
        sender_policies: payload.sender_policies ?? {},
        message_overrides: payload.message_overrides ?? {},
      }),
    ].join('::')
  }
  return null
}

function normalizeRequestMeta(body: Record<string, unknown> | null): RequestMeta {
  const readString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null

  return {
    source: readString(body?.request_source),
    component: readString(body?.request_component),
    reason: readString(body?.request_reason),
    phase: readString(body?.request_phase),
    agentId: readString(body?.request_agent_id),
  }
}

function clampSenderWorkspacePageSize(params: {
  requestedPageSize: number
  page: number
  search: string
  filter: string
  sort: string
  direction: string
  requestMeta: RequestMeta
}): number {
  const normalizedPageSize = Math.min(
    Math.max(Math.floor(params.requestedPageSize || 12), 6),
    MAX_GMAIL_SENDER_WORKSPACE_PAGE_SIZE
  )

  const isDefaultSenderOverviewFirstPaintShape =
    params.requestMeta.component === 'sender_overview' &&
    params.page === 1 &&
    params.search === '' &&
    params.filter === 'all' &&
    params.sort === 'message_count' &&
    params.direction === 'desc'

  const isDefaultDecisionQueueShape =
    params.requestMeta.component === 'decision_mode' &&
    params.page === 1 &&
    params.search === '' &&
    params.filter === 'all' &&
    params.sort === 'message_count' &&
    params.direction === 'desc'

  if (isDefaultSenderOverviewFirstPaintShape) {
    return Math.min(normalizedPageSize, DEFAULT_GMAIL_SENDER_OVERVIEW_WORKSPACE_PAGE_SIZE)
  }

  if (isDefaultDecisionQueueShape) {
    return Math.min(
      Math.max(Math.floor(params.requestedPageSize || GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE), 12),
      GMAIL_DECISION_QUEUE_WORKSPACE_PAGE_SIZE
    )
  }

  return normalizedPageSize
}

async function resolveAuthContext(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[integrations/gmail/inbox-analysis] Auth error:', authError)
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
    console.error('[integrations/gmail/inbox-analysis] Profile lookup error:', profileError)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Failed to resolve tenant.' }, { status: 500 }),
    }
  }

  const tenantId = typeof profileRow?.tenant_id === 'string' ? profileRow.tenant_id : ''
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

    const analysis = await analyzeGmailInboxForTenant({
      supabase: auth.supabase,
      tenantId: auth.tenantId,
    })
    if (!analysis.ok) {
      return NextResponse.json({ error: analysis.error }, { status: analysis.status })
    }

    return NextResponse.json({
      ok: true,
      data: analysis.data,
    })
  } catch (error) {
    console.error('[integrations/gmail/inbox-analysis] Unexpected error:', error)
    return NextResponse.json({ error: 'Unexpected error while analyzing inbox.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await resolveAuthContext()
    if (!auth.ok) return auth.response

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const action = typeof body?.action === 'string' ? body.action.trim() : ''
    const requestMeta = normalizeRequestMeta(body)
    const requestStartedAt = Date.now()
    const heavyActionKey = HEAVY_INBOX_ANALYSIS_ACTIONS.has(action)
      ? heavyInboxAnalysisRequestKey({
          tenantId: auth.tenantId,
          action,
          body,
        })
      : null
    let heavyActionStartedAt: number | null = null
    let heavyActionFinalized = false
    const finalizeHeavyAction = (params: {
      status: number
      ok: boolean
      blockedBy?: 'already_running' | 'cooldown_active' | null
      outcome?: string
      extra?: Record<string, unknown>
    }) => {
      if (!heavyActionKey || heavyActionStartedAt == null || heavyActionFinalized) return
      heavyActionFinalized = true
      finishHeavyAction({
        key: heavyActionKey,
        cooldownMs: HEAVY_INBOX_ANALYSIS_COOLDOWN_MS,
        applyCooldown: params.blockedBy == null,
      })
      logHeavyActionEvent({
        category: 'inbox_analysis',
        route: '/api/integrations/gmail/inbox-analysis',
        action,
        triggerSource: requestMeta.source,
        requestMode: requestMeta.phase,
        tenantId: auth.tenantId,
        agentId: null,
        blockedBy: params.blockedBy ?? null,
        durationMs: Date.now() - heavyActionStartedAt,
        outcome: params.outcome || (params.ok ? 'completed' : 'failed'),
        extra: params.extra,
      })
    }
    const logRequest = (status: number, ok: boolean, extra?: Record<string, unknown>) => {
      console.info(
        `[integrations/gmail/inbox-analysis/request] ${JSON.stringify({
          action,
          request_source: requestMeta.source,
          request_component: requestMeta.component,
          request_reason: requestMeta.reason,
          request_phase: requestMeta.phase,
          request_agent_id: requestMeta.agentId,
          duration_ms: Math.max(0, Date.now() - requestStartedAt),
          status,
          ok,
          ...(extra || {}),
        })}`
      )
      finalizeHeavyAction({ status, ok, extra })
    }

    if (
      requestMeta.phase === 'initial_paint' &&
      DISABLED_INITIAL_PAINT_LIVE_ACTIONS.has(action)
    ) {
      logRequest(409, false, {
        disabled_reason: 'initial_paint_live_fetch_disabled',
      })
      logHeavyActionEvent({
        category: 'inbox_analysis',
        route: '/api/integrations/gmail/inbox-analysis',
        action,
        triggerSource: requestMeta.source,
        requestMode: requestMeta.phase,
        tenantId: auth.tenantId,
        agentId: null,
        blockedBy: null,
        durationMs: Math.max(0, Date.now() - requestStartedAt),
        outcome: 'initial_paint_live_fetch_disabled',
        extra: {
          disabled_reason: 'initial_paint_live_fetch_disabled',
        },
      })
      return NextResponse.json(
        {
          ok: false,
          error: 'Initial page-load live analysis is temporarily disabled for safety.',
          reason: 'initial_paint_live_fetch_disabled',
        },
        { status: 409 }
      )
    }

    if (heavyActionKey) {
      const guard = tryStartHeavyAction({
        key: heavyActionKey,
        cooldownMs: HEAVY_INBOX_ANALYSIS_COOLDOWN_MS,
      })
      if (!guard.ok) {
        logRequest(409, false, {
          disabled_reason: guard.reason,
          retry_after_ms: guard.retryAfterMs,
        })
        logHeavyActionEvent({
          category: 'inbox_analysis',
          route: '/api/integrations/gmail/inbox-analysis',
          action,
          triggerSource: requestMeta.source,
          requestMode: requestMeta.phase,
          tenantId: auth.tenantId,
          agentId: null,
          blockedBy: guard.reason,
          durationMs: Math.max(0, Date.now() - requestStartedAt),
          outcome: 'blocked',
          extra: {
            retry_after_ms: guard.retryAfterMs,
          },
        })
        return NextResponse.json(
          {
            ok: false,
            error:
              guard.reason === 'already_running'
                ? 'This analysis is already running. Please wait for the current request to finish.'
                : 'This analysis was just requested. Please wait briefly before retrying.',
            reason: guard.reason,
            retry_after_ms: guard.retryAfterMs,
          },
          { status: 409 }
        )
      }
      heavyActionStartedAt = guard.startedAtMs
    }

    if (action === 'review_query_cluster') {
      const clusterId = typeof body?.cluster_id === 'string' ? body.cluster_id.trim() : ''
      const clusterType = typeof body?.cluster_type === 'string' ? body.cluster_type.trim() : ''
      const title = typeof body?.title === 'string' ? body.title.trim() : ''
      const query = typeof body?.query === 'string' ? body.query.trim() : ''
      const estimatedCount =
        typeof body?.estimated_count === 'number' && Number.isFinite(body.estimated_count)
          ? body.estimated_count
          : undefined
      const maxResultsRaw =
        typeof body?.max_results === 'number' && Number.isFinite(body.max_results)
          ? Math.round(body.max_results)
          : undefined
      const maxResults =
        typeof maxResultsRaw === 'number' ? Math.min(Math.max(maxResultsRaw, 10), 120) : undefined
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)

      if (!clusterId || !clusterType || !title || !query) {
        logRequest(400, false, { cluster_id: clusterId || null })
        return NextResponse.json(
          { error: 'cluster_id, cluster_type, title, and query are required.' },
          { status: 400 }
        )
      }

      const review = await reviewGmailQueryClusterForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        clusterId,
        clusterType,
        title,
        query,
        ...(estimatedCount != null ? { estimatedCount } : {}),
        ...(maxResults != null ? { maxResults } : {}),
        analysisScope,
      })

      if (!review.ok) {
        logRequest(review.status, false, { cluster_id: clusterId })
        return NextResponse.json({ error: review.error }, { status: review.status })
      }

      logRequest(200, true, { cluster_id: clusterId })
      return NextResponse.json({ ok: true, data: review.data })
    }

    if (action === 'browse_query_cluster') {
      const clusterId = typeof body?.cluster_id === 'string' ? body.cluster_id.trim() : ''
      const clusterType = typeof body?.cluster_type === 'string' ? body.cluster_type.trim() : ''
      const title = typeof body?.title === 'string' ? body.title.trim() : ''
      const query = typeof body?.query === 'string' ? body.query.trim() : ''
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const reviewUnitId =
        typeof body?.review_unit_id === 'string' && body.review_unit_id.trim()
          ? body.review_unit_id.trim()
          : undefined
      const page =
        typeof body?.page === 'number' && Number.isFinite(body.page)
          ? Math.max(1, Math.floor(body.page))
          : 1
      const pageSize =
        typeof body?.page_size === 'number' && Number.isFinite(body.page_size)
          ? Math.min(Math.max(Math.floor(body.page_size), 10), 200)
          : 50
      const sort =
        body?.sort === 'oldest' || body?.sort === 'newest' ? body.sort : 'newest'
      const interactionFilter =
        body?.interaction_filter === 'unread' ||
        body?.interaction_filter === 'starred_or_important' ||
        body?.interaction_filter === 'no_recent_interaction_90d'
          ? body.interaction_filter
          : 'all'

      if (!clusterId || !clusterType || !title || !query) {
        logRequest(400, false, { cluster_id: clusterId || null })
        return NextResponse.json(
          { error: 'cluster_id, cluster_type, title, and query are required.' },
          { status: 400 }
        )
      }

      const browser = await browseIndexedGmailQueryClusterMessagesForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        clusterId,
        clusterType,
        title,
        query,
        analysisScope,
        ...(reviewUnitId ? { reviewUnitId } : {}),
        page,
        pageSize,
        sort,
        interactionFilter,
      })

      if (!browser.ok) {
        logRequest(browser.status, false, {
          cluster_id: clusterId,
          review_unit_id: reviewUnitId || null,
          page,
          page_size: pageSize,
        })
        return NextResponse.json({ error: browser.error }, { status: browser.status })
      }

      logRequest(200, true, {
        cluster_id: clusterId,
        review_unit_id: browser.data.selected_review_unit_id,
        page: browser.data.page,
        page_size: browser.data.page_size,
      })
      return NextResponse.json({ ok: true, data: browser.data })
    }

    if (action === 'cleanup_group_intelligence') {
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const cacheVersion =
        typeof body?.cache_version === 'string' && body.cache_version.trim()
          ? body.cache_version.trim()
          : null
      const rawClusters = Array.isArray(body?.clusters)
        ? body.clusters.filter(
            (
              entry
            ): entry is {
              cluster_id: string
              cluster_type: string
              title: string
              query: string
              estimated_count?: number
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { cluster_id?: unknown }).cluster_id === 'string' &&
              typeof (entry as { cluster_type?: unknown }).cluster_type === 'string' &&
              typeof (entry as { title?: unknown }).title === 'string' &&
              typeof (entry as { query?: unknown }).query === 'string'
          )
        : []
      const clusters = rawClusters
        .map((cluster) => ({
          cluster_id: cluster.cluster_id.trim(),
          cluster_type: cluster.cluster_type.trim(),
          title: cluster.title.trim(),
          query: cluster.query.trim(),
        }))
        .filter((cluster) => cluster.cluster_id && cluster.cluster_type && cluster.title && cluster.query)
        .slice(0, 25)

      if (clusters.length === 0) {
        logRequest(400, false, { cluster_count: 0 })
        return NextResponse.json({ error: 'clusters[] is required.' }, { status: 400 })
      }

      const intelligence = await loadGmailCleanupGroupIntelligenceForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        analysisScope,
        clusters,
        cacheVersion,
      })

      if (!intelligence.ok) {
        logRequest(intelligence.status, false, { cluster_count: clusters.length })
        return NextResponse.json({ error: intelligence.error }, { status: intelligence.status })
      }

      logRequest(200, true, {
        cluster_count: clusters.length,
        cleanup_group_total_messages: intelligence.data.cleanup_group_total_messages,
      })
      return NextResponse.json({ ok: true, data: intelligence.data })
    }

    if (action === 'mailbox_intelligence') {
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const cacheVersion =
        typeof body?.cache_version === 'string' && body.cache_version.trim()
          ? body.cache_version.trim()
          : null
      const initialPressureWindow =
        body?.initial_pressure_window === 'all_indexed' ||
        body?.initial_pressure_window === 'last_year' ||
        body?.initial_pressure_window === 'last_quarter' ||
        body?.initial_pressure_window === 'last_month' ||
        body?.initial_pressure_window === 'last_week' ||
        body?.initial_pressure_window === 'last_day' ||
        body?.initial_pressure_window === 'custom'
          ? body.initial_pressure_window
          : null
      const initialPressureStart =
        typeof body?.initial_pressure_start === 'string' && body.initial_pressure_start.trim()
          ? body.initial_pressure_start.trim()
          : null
      const initialPressureEnd =
        typeof body?.initial_pressure_end === 'string' && body.initial_pressure_end.trim()
          ? body.initial_pressure_end.trim()
          : null
      const initialTimeZone =
        typeof body?.initial_time_zone === 'string' && body.initial_time_zone.trim()
          ? body.initial_time_zone.trim()
          : null
      const rawClusters = Array.isArray(body?.clusters)
        ? body.clusters.filter(
            (
              entry
            ): entry is {
              cluster_id: string
              cluster_type: string
              title: string
              query: string
              why_selected?: string
              risk_note?: string
              safety_note?: string
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { cluster_id?: unknown }).cluster_id === 'string' &&
              typeof (entry as { cluster_type?: unknown }).cluster_type === 'string' &&
              typeof (entry as { title?: unknown }).title === 'string' &&
              typeof (entry as { query?: unknown }).query === 'string'
          )
        : []

      const intelligence = await loadGmailMailboxIntelligenceForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        analysisScope,
        cacheVersion,
        initialPressureWindow,
        initialPressureStart,
        initialPressureEnd,
        initialTimeZone,
        clusters: rawClusters,
      })

      if (!intelligence.ok) {
        logRequest(intelligence.status, false, { cluster_count: rawClusters.length })
        return NextResponse.json({ error: intelligence.error }, { status: intelligence.status })
      }

      logRequest(200, true, {
        cluster_count: rawClusters.length,
        cleanup_candidate_messages: intelligence.data.cleanup_candidate_universe.message_count,
      })
      return NextResponse.json({ ok: true, data: intelligence.data })
    }

    if (action === 'mailbox_pressure_trend') {
      const cacheVersion =
        typeof body?.cache_version === 'string' && body.cache_version.trim()
          ? body.cache_version.trim()
          : null
      const pressureWindow =
        body?.pressure_window === 'all_indexed' ||
        body?.pressure_window === 'last_year' ||
        body?.pressure_window === 'last_quarter' ||
        body?.pressure_window === 'last_month' ||
        body?.pressure_window === 'last_week' ||
        body?.pressure_window === 'last_day' ||
        body?.pressure_window === 'custom'
          ? body.pressure_window
          : 'all_indexed'
      const pressureStart =
        typeof body?.pressure_start === 'string' && body.pressure_start.trim()
          ? body.pressure_start.trim()
          : null
      const pressureEnd =
        typeof body?.pressure_end === 'string' && body.pressure_end.trim()
          ? body.pressure_end.trim()
          : null
      const timeZone =
        typeof body?.time_zone === 'string' && body.time_zone.trim()
          ? body.time_zone.trim()
          : null
      const rawClusters = Array.isArray(body?.clusters)
        ? body.clusters.filter(
            (
              entry
            ): entry is {
              cluster_id: string
              cluster_type: string
              title: string
              query: string
              why_selected?: string
              risk_note?: string
              safety_note?: string
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { cluster_id?: unknown }).cluster_id === 'string' &&
              typeof (entry as { cluster_type?: unknown }).cluster_type === 'string' &&
              typeof (entry as { title?: unknown }).title === 'string' &&
              typeof (entry as { query?: unknown }).query === 'string'
          )
        : []

      const trend = await loadGmailPressureTrendForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        cacheVersion,
        clusters: rawClusters,
        pressureWindow,
        pressureStart,
        pressureEnd,
        timeZone,
      })

      if (!trend.ok) {
        logRequest(trend.status, false, { cluster_count: rawClusters.length, pressure_window: pressureWindow })
        return NextResponse.json({ error: trend.error }, { status: trend.status })
      }

      logRequest(200, true, {
        cluster_count: rawClusters.length,
        pressure_window: pressureWindow,
        series_count: trend.data.series.length,
      })
      return NextResponse.json({ ok: true, data: trend.data })
    }

    if (action === 'sender_workspace') {
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const cacheVersion =
        typeof body?.cache_version === 'string' && body.cache_version.trim()
          ? body.cache_version.trim()
          : null
      const rawClusters = Array.isArray(body?.clusters)
        ? body.clusters.filter(
            (
              entry
            ): entry is {
              cluster_id: string
              cluster_type: string
              title: string
              query: string
              sender_count?: number
              message_count?: number
              estimated_count?: number
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { cluster_id?: unknown }).cluster_id === 'string' &&
              typeof (entry as { cluster_type?: unknown }).cluster_type === 'string' &&
              typeof (entry as { title?: unknown }).title === 'string' &&
              typeof (entry as { query?: unknown }).query === 'string'
          )
        : []
      const selectedCluster =
        typeof body?.selected_cluster === 'object' && body.selected_cluster !== null
          ? (body.selected_cluster as {
              cluster_id?: string
              cluster_type?: string
              title?: string
              query?: string
              why_selected?: string
              risk_note?: string
              safety_note?: string
              sender_count?: number
              message_count?: number
              estimated_count?: number
            })
        : null
      const page =
        typeof body?.page === 'number' && Number.isFinite(body.page)
          ? Math.max(1, Math.floor(body.page))
          : 1
      const pageSize =
        typeof body?.page_size === 'number' && Number.isFinite(body.page_size)
          ? Math.floor(body.page_size)
          : 12
      const search = typeof body?.search === 'string' ? body.search.trim() : ''
      const filter =
        body?.filter === 'needs_verification' ||
        body?.filter === 'protected' ||
        body?.filter === 'likely_machine_generated' ||
        body?.filter === 'likely_human'
          ? body.filter
          : 'all'
      const sort =
        body?.sort === 'sender' || body?.sort === 'unread_count' || body?.sort === 'last_activity'
          ? body.sort
          : 'message_count'
      const direction = body?.direction === 'asc' ? 'asc' : 'desc'
      const includeClusterSenderKeys = body?.include_cluster_sender_keys === true
      const previewEvidenceSenderKey =
        typeof body?.preview_evidence_sender_key === 'string' &&
        body.preview_evidence_sender_key.trim().length > 0
          ? body.preview_evidence_sender_key.trim()
          : null
      const semanticFocus =
        typeof body?.semantic_focus === 'object' && body.semantic_focus !== null
          ? (body.semantic_focus as {
              family?: string
              kind?: string
              subtype_key?: string | null
              surfaced_subtype_keys?: unknown
            })
          : null
      const effectivePageSize = clampSenderWorkspacePageSize({
        requestedPageSize: pageSize,
        page,
        search,
        filter,
        sort,
        direction,
        requestMeta,
      })

      if (
        !selectedCluster?.cluster_id ||
        !selectedCluster.cluster_type ||
        !selectedCluster.title ||
        !selectedCluster.query
      ) {
        logRequest(400, false, { cluster_id: null })
        return NextResponse.json(
          { error: 'selected_cluster is required for sender_workspace.' },
          { status: 400 }
        )
      }

      const workspace = await loadGmailSenderWorkspaceForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        analysisScope,
        cacheVersion,
        selectedCluster: {
          cluster_id: selectedCluster.cluster_id,
          cluster_type: selectedCluster.cluster_type,
          title: selectedCluster.title,
          query: selectedCluster.query,
          why_selected: selectedCluster.why_selected,
          risk_note: selectedCluster.risk_note,
          safety_note: selectedCluster.safety_note,
          sender_count:
            typeof selectedCluster.sender_count === 'number' &&
            Number.isFinite(selectedCluster.sender_count)
              ? selectedCluster.sender_count
              : null,
          message_count:
            typeof selectedCluster.message_count === 'number' &&
            Number.isFinite(selectedCluster.message_count)
              ? selectedCluster.message_count
              : null,
          estimated_count:
            typeof selectedCluster.estimated_count === 'number' &&
            Number.isFinite(selectedCluster.estimated_count)
              ? selectedCluster.estimated_count
              : null,
        },
        clusters: rawClusters.map((cluster) => ({
          cluster_id: cluster.cluster_id,
          cluster_type: cluster.cluster_type,
          title: cluster.title,
          query: cluster.query,
          sender_count:
            typeof cluster.sender_count === 'number' && Number.isFinite(cluster.sender_count)
              ? cluster.sender_count
              : null,
          message_count:
            typeof cluster.message_count === 'number' && Number.isFinite(cluster.message_count)
              ? cluster.message_count
              : null,
          estimated_count:
            typeof cluster.estimated_count === 'number' && Number.isFinite(cluster.estimated_count)
              ? cluster.estimated_count
              : null,
        })),
        page,
        pageSize: effectivePageSize,
        search,
        filter,
        sort,
        direction,
        includeClusterSenderKeys,
        previewEvidenceSenderKey,
        requestAgentId: requestMeta.agentId,
        semanticFocus:
          semanticFocus &&
          typeof semanticFocus.family === 'string' &&
          (semanticFocus.kind === 'family' ||
            semanticFocus.kind === 'subtype' ||
            semanticFocus.kind === 'remainder')
            ? {
                family: semanticFocus.family as
                  | 'marketing_promotional'
                  | 'commerce_transactional'
                  | 'account_notification'
                  | 'security_alert'
                  | 'social_community'
                  | 'human_personal',
                kind: semanticFocus.kind,
                subtypeKey:
                  typeof semanticFocus.subtype_key === 'string' && semanticFocus.subtype_key.trim()
                    ? semanticFocus.subtype_key.trim()
                    : null,
                surfacedSubtypeKeys: Array.isArray(semanticFocus.surfaced_subtype_keys)
                  ? semanticFocus.surfaced_subtype_keys
                      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                      .map((entry) => entry.trim())
                  : [],
              }
            : null,
      })

      if (!workspace.ok) {
        logRequest(workspace.status, false, { cluster_id: selectedCluster.cluster_id })
        return NextResponse.json({ error: workspace.error }, { status: workspace.status })
      }

      logRequest(200, true, {
        cluster_id: selectedCluster.cluster_id,
        sender_count: workspace.data.selected_cluster.sender_count,
        page: workspace.data.pagination.page,
        requested_page_size: pageSize,
        effective_page_size: effectivePageSize,
        returned_page_size: workspace.data.pagination.page_size,
        returned_total_senders: workspace.data.pagination.total_senders,
        returned_sender_count: workspace.data.senders.length,
        returned_sender_keys_complete: workspace.data.cluster_global.sender_keys_complete,
        queue_contract_parity:
          workspace.data.pagination.page_size === effectivePageSize &&
          workspace.data.cluster_global.sender_keys_complete === includeClusterSenderKeys,
        include_cluster_sender_keys: includeClusterSenderKeys,
        semantic_focus_active: semanticFocus != null,
      })
      return NextResponse.json({ ok: true, data: workspace.data })
    }

    if (action === 'sender_distribution') {
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const selectedCluster =
        typeof body?.selected_cluster === 'object' && body.selected_cluster !== null
          ? (body.selected_cluster as {
              cluster_id?: string
              canonical_cluster_id?: string
              legacy_cluster_ids?: unknown
              source_cluster_ids?: unknown
              cluster_type?: string
              title?: string
              query?: string
              sender_count?: number
              message_count?: number
            })
          : null

      if (
        !selectedCluster?.cluster_id ||
        !selectedCluster.cluster_type ||
        !selectedCluster.title ||
        !selectedCluster.query
      ) {
        logRequest(400, false, { cluster_id: null })
        return NextResponse.json(
          { error: 'selected_cluster is required for sender_distribution.' },
          { status: 400 }
        )
      }

      const distribution = await loadGmailSenderDistributionForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        analysisScope,
        selectedCluster: {
          cluster_id: selectedCluster.cluster_id,
          canonical_cluster_id:
            typeof selectedCluster.canonical_cluster_id === 'string' &&
            selectedCluster.canonical_cluster_id.trim()
              ? selectedCluster.canonical_cluster_id.trim()
              : null,
          legacy_cluster_ids: Array.isArray(selectedCluster.legacy_cluster_ids)
            ? selectedCluster.legacy_cluster_ids
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                .map((entry) => entry.trim())
            : null,
          source_cluster_ids: Array.isArray(selectedCluster.source_cluster_ids)
            ? selectedCluster.source_cluster_ids
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                .map((entry) => entry.trim())
            : null,
          cluster_type: selectedCluster.cluster_type,
          title: selectedCluster.title,
          query: selectedCluster.query,
          sender_count:
            typeof selectedCluster.sender_count === 'number' &&
            Number.isFinite(selectedCluster.sender_count)
              ? selectedCluster.sender_count
              : null,
          message_count:
            typeof selectedCluster.message_count === 'number' &&
            Number.isFinite(selectedCluster.message_count)
              ? selectedCluster.message_count
              : null,
        },
      })

      if (!distribution.ok) {
        logRequest(distribution.status, false, { cluster_id: selectedCluster.cluster_id })
        return NextResponse.json({ error: distribution.error }, { status: distribution.status })
      }

      logRequest(200, true, {
        cluster_id: selectedCluster.cluster_id,
        sender_count: distribution.data.selected_cluster.sender_count,
        returned_sender_count: distribution.data.senders.length,
      })
      return NextResponse.json({ ok: true, data: distribution.data })
    }

    if (action === 'confirmation_preview') {
      const analysisScope = normalizeMailboxProfileScope(body?.analysis_scope)
      const cacheVersion =
        typeof body?.cache_version === 'string' && body.cache_version.trim()
          ? body.cache_version.trim()
          : null
      const rawClusters = Array.isArray(body?.clusters)
        ? body.clusters.filter(
            (
              entry
            ): entry is {
              cluster_id: string
              cluster_type: string
              title: string
              query: string
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { cluster_id?: unknown }).cluster_id === 'string' &&
              typeof (entry as { cluster_type?: unknown }).cluster_type === 'string' &&
              typeof (entry as { title?: unknown }).title === 'string' &&
              typeof (entry as { query?: unknown }).query === 'string'
          )
        : []
      const selectedCluster =
        typeof body?.selected_cluster === 'object' && body.selected_cluster !== null
          ? (body.selected_cluster as {
              cluster_id?: string
              cluster_type?: string
              title?: string
              query?: string
            })
          : null
      const senderPolicies =
        typeof body?.sender_policies === 'object' && body.sender_policies
          ? (body.sender_policies as Record<string, 'keep' | 'archive' | 'quarantine' | 'unsubscribe' | 'custom_rule' | 'undecided'>)
          : {}
      const messageOverrides =
        typeof body?.message_overrides === 'object' && body.message_overrides
          ? (body.message_overrides as Record<string, 'include' | 'exclude'>)
          : {}

      if (
        !selectedCluster?.cluster_id ||
        !selectedCluster.cluster_type ||
        !selectedCluster.title ||
        !selectedCluster.query
      ) {
        logRequest(400, false, { cluster_id: null })
        return NextResponse.json(
          { error: 'selected_cluster is required for confirmation_preview.' },
          { status: 400 }
        )
      }

      const preview = await loadGmailConfirmationPreviewForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        analysisScope,
        cacheVersion,
        clusters: rawClusters,
        selectedCluster: {
          cluster_id: selectedCluster.cluster_id,
          cluster_type: selectedCluster.cluster_type,
          title: selectedCluster.title,
          query: selectedCluster.query,
        },
        senderPolicies,
        messageOverrides,
      })

      if (!preview.ok) {
        logRequest(preview.status, false, { cluster_id: selectedCluster.cluster_id })
        return NextResponse.json({ error: preview.error }, { status: preview.status })
      }

      logRequest(200, true, {
        cluster_id: selectedCluster.cluster_id,
        archive_message_count: preview.data.exact_archive_impact.message_count,
      })
      return NextResponse.json({ ok: true, data: preview.data })
    }

    if (action === 'review_sender_cluster') {
      const sender = typeof body?.sender === 'string' ? body.sender.trim() : ''
      const maxResultsRaw =
        typeof body?.max_results === 'number' && Number.isFinite(body.max_results)
          ? Math.round(body.max_results)
          : undefined
      const maxResults =
        typeof maxResultsRaw === 'number' ? Math.min(Math.max(maxResultsRaw, 10), 60) : undefined

      if (!sender) {
        logRequest(400, false, { sender: null })
        return NextResponse.json({ error: 'sender is required.' }, { status: 400 })
      }

      const review = await reviewGmailSenderClusterForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        sender,
        ...(maxResults != null ? { maxResults } : {}),
      })

      if (!review.ok) {
        logRequest(review.status, false, { sender })
        return NextResponse.json({ error: review.error }, { status: review.status })
      }

      logRequest(200, true, { sender })
      return NextResponse.json({ ok: true, data: review.data })
    }

    if (action === 'sender_index_signals') {
      const rawSenders = Array.isArray(body?.senders)
        ? body.senders.filter((entry): entry is string => typeof entry === 'string')
        : []
      const senders = rawSenders
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 25)

      if (senders.length === 0) {
        logRequest(400, false, { sender_count: 0 })
        return NextResponse.json({ error: 'senders[] is required.' }, { status: 400 })
      }

      const signals = await loadGmailSenderIndexSignalsForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        senders,
        queryMode: requestMeta.reason === 'expand_details' ? 'sender_detail' : 'sender_page',
      })
      if (!signals.ok) {
        logRequest(signals.status, false, { sender_count: senders.length })
        return NextResponse.json({ error: signals.error }, { status: signals.status })
      }
      logRequest(200, true, { sender_count: senders.length })
      return NextResponse.json({ ok: true, data: signals.data })
    }

    if (action === 'load_message_snippets') {
      const rawMessageIds = Array.isArray(body?.message_ids)
        ? body.message_ids.filter((entry): entry is string => typeof entry === 'string')
        : []
      const messageIds = rawMessageIds
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 200)

      if (messageIds.length === 0) {
        logRequest(400, false, { message_count: 0 })
        return NextResponse.json({ error: 'message_ids[] is required.' }, { status: 400 })
      }

      const snippets = await loadGmailMessageSnippetsForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        messageIds,
      })
      if (!snippets.ok) {
        logRequest(snippets.status, false, { message_count: messageIds.length })
        return NextResponse.json({ error: snippets.error }, { status: snippets.status })
      }
      logRequest(200, true, { message_count: messageIds.length })
      return NextResponse.json({ ok: true, data: snippets.data })
    }

    if (action === 'load_message_preview') {
      const messageId = typeof body?.message_id === 'string' ? body.message_id.trim() : ''

      if (!messageId) {
        logRequest(400, false, { message_id: null })
        return NextResponse.json({ error: 'message_id is required.' }, { status: 400 })
      }

      const preview = await loadGmailMessagePreviewForTenant({
        supabase: auth.supabase,
        tenantId: auth.tenantId,
        messageId,
      })
      if (!preview.ok) {
        logRequest(preview.status, false, { message_id: messageId })
        return NextResponse.json({ error: preview.error }, { status: preview.status })
      }

      logRequest(200, true, { message_id: messageId })
      return NextResponse.json({ ok: true, data: preview.data })
    }

    logRequest(400, false)
    return NextResponse.json(
      {
        error:
          'Unsupported action. Use review_query_cluster, browse_query_cluster, cleanup_group_intelligence, review_sender_cluster, sender_index_signals, load_message_snippets, or load_message_preview.',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('[integrations/gmail/inbox-analysis] Unexpected POST error:', error)
    return NextResponse.json(
      { error: 'Unexpected error while loading Gmail review evidence.' },
      { status: 500 }
    )
  }
}
