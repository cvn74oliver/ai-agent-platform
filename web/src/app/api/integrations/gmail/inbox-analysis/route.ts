import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
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
  loadGmailSenderWorkspaceForTenant,
} from '@/lib/integrations/gmail/gmailCleanupWorkspace'

type AuthContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; tenantId: string }
  | { ok: false; response: NextResponse }

type RequestMeta = {
  source: string | null
  component: string | null
  reason: string | null
  phase: string | null
}

function normalizeRequestMeta(body: Record<string, unknown> | null): RequestMeta {
  const readString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null

  return {
    source: readString(body?.request_source),
    component: readString(body?.request_component),
    reason: readString(body?.request_reason),
    phase: readString(body?.request_phase),
  }
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
    const logRequest = (status: number, ok: boolean, extra?: Record<string, unknown>) => {
      console.info(
        `[integrations/gmail/inbox-analysis/request] ${JSON.stringify({
          action,
          request_source: requestMeta.source,
          request_component: requestMeta.component,
          request_reason: requestMeta.reason,
          request_phase: requestMeta.phase,
          duration_ms: Math.max(0, Date.now() - requestStartedAt),
          status,
          ok,
          ...(extra || {}),
        })}`
      )
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
            })
          : null
      const page =
        typeof body?.page === 'number' && Number.isFinite(body.page)
          ? Math.max(1, Math.floor(body.page))
          : 1
      const pageSize =
        typeof body?.page_size === 'number' && Number.isFinite(body.page_size)
          ? Math.min(Math.max(Math.floor(body.page_size), 6), 40)
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
        clusters: rawClusters,
        selectedCluster: {
          cluster_id: selectedCluster.cluster_id,
          cluster_type: selectedCluster.cluster_type,
          title: selectedCluster.title,
          query: selectedCluster.query,
          why_selected: selectedCluster.why_selected,
          risk_note: selectedCluster.risk_note,
          safety_note: selectedCluster.safety_note,
        },
        page,
        pageSize,
        search,
        filter,
        sort,
        direction,
      })

      if (!workspace.ok) {
        logRequest(workspace.status, false, { cluster_id: selectedCluster.cluster_id })
        return NextResponse.json({ error: workspace.error }, { status: workspace.status })
      }

      logRequest(200, true, {
        cluster_id: selectedCluster.cluster_id,
        sender_count: workspace.data.selected_cluster.sender_count,
        page: workspace.data.pagination.page,
      })
      return NextResponse.json({ ok: true, data: workspace.data })
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
