import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/rag/schedule
 *
 * Body: { agent_id: string, mode?: 'delta' | 'full', ttl_hours?: number, run_now?: boolean, include_wildcards?: boolean }  // run_now defaults to true but is skipped if nothing is queued
 *
 * Creates:
 *  - a rag_jobs row (status = 'pending')
 *  - rag_documents seed rows for each RAG source + crawl domain
 *
 * Notes:
 * - mode='delta' avoids duplicating exact (non-wildcard) seeds that already exist.
 * - wildcard crawl patterns (containing '*') are enqueued ONLY in full mode by default.
 *   In delta mode, pass include_wildcards=true if you want discovery crawls.
 * - By default, immediately triggers `/api/rag/run` (fire-and-forget).
 */
export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  try {
    const { agent_id, run_now, mode, ttl_hours, include_wildcards } = await req.json()

    if (!agent_id || typeof agent_id !== 'string') {
      return NextResponse.json({ ok: false, error: 'agent_id is required' }, { status: 400 })
    }

    const runNow = run_now !== false // default: true (keeps running even if user navigates away)
    const syncMode: 'delta' | 'full' = mode === 'full' ? 'full' : 'delta'
    const ttlHours = Number.isFinite(Number(ttl_hours)) ? Math.max(0, Number(ttl_hours)) : 0

    // In delta mode, we default to NOT enqueuing wildcard crawls (avoids re-scraping everything).
    // You can override by passing include_wildcards=true.
    const includeWildcards = syncMode === 'full' ? true : include_wildcards === true

    // 1) Load agent
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, user_id, rag_sources, crawl_domains')
      .eq('id', agent_id)
      .single()

    if (agentErr || !agent) {
      console.error('[rag/schedule] agent load error:', agentErr)
      return NextResponse.json({ ok: false, error: 'Agent not found or access denied.' }, { status: 404 })
    }

    const rag_sources: string[] = Array.isArray((agent as any).rag_sources)
      ? (agent as any).rag_sources
      : typeof (agent as any).rag_sources === 'string'
      ? [(agent as any).rag_sources]
      : []

    const crawl_domains: string[] = Array.isArray((agent as any).crawl_domains)
      ? (agent as any).crawl_domains
      : typeof (agent as any).crawl_domains === 'string'
      ? [(agent as any).crawl_domains]
      : []

    if (rag_sources.length === 0 && crawl_domains.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'This agent has no RAG sources or crawl domains configured yet. Add them on the summary page first.',
        },
        { status: 400 }
      )
    }

    // 2) Create rag_jobs row (NOTE: no `meta` column on this table)
    const { data: jobRow, error: jobErr } = await supabase
      .from('rag_jobs')
      .insert([
        {
          user_id: (agent as any).user_id || null,
          agent_id: (agent as any).id,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (jobErr || !jobRow) {
      console.error('[rag/schedule] job insert error:', jobErr)
      return NextResponse.json({ ok: false, error: 'Failed to create RAG job.' }, { status: 500 })
    }

    const job_id = (jobRow as any).id as string

    // 3) Build seed URL set
    const seedUrls = Array.from(new Set([...rag_sources.filter(Boolean), ...crawl_domains.filter(Boolean)]))
    const isWildcard = (u: string) => u.includes('*')
    const hadWildcardSeeds = seedUrls.some(isWildcard)

    // In delta mode, avoid inserting duplicate exact seeds.
    let existingSeedUrlSet = new Set<string>()
    if (syncMode === 'delta' && seedUrls.length > 0) {
      const exactUrls = seedUrls.filter((u) => !isWildcard(u))
      if (exactUrls.length > 0) {
        const { data: existingRows, error: existingErr } = await supabase
          .from('rag_documents')
          .select('source_url')
          .eq('agent_id', (agent as any).id)
          .in('source_url', exactUrls)

        if (existingErr) {
          console.warn('[rag/schedule] existing seed lookup failed (non-fatal):', existingErr)
        } else {
          existingSeedUrlSet = new Set(
            (existingRows || [])
              .map((r: any) => String(r?.source_url || '').trim())
              .filter(Boolean)
          )
        }
      }
    }

    const docsToInsert: {
      agent_id: string
      job_id: string
      source_type: string
      source_url: string
      title: string | null
      raw_text: string | null
      // meta is optional; include only if your table supports it
      meta?: Record<string, unknown>
    }[] = []

    // Drive-style sources
    for (const url of rag_sources) {
      if (!url) continue
      if (syncMode === 'delta' && existingSeedUrlSet.has(url)) continue

      docsToInsert.push({
        agent_id: (agent as any).id,
        job_id,
        source_type: 'drive',
        source_url: url,
        title: null,
        raw_text: null,
        meta: { mode: syncMode },
      })
    }

    // Crawl domains
    for (const url of crawl_domains) {
      if (!url) continue
      const wildcard = isWildcard(url)

      // In delta mode, only enqueue wildcard crawls if explicitly requested.
      if (syncMode === 'delta' && wildcard && !includeWildcards) continue

      if (syncMode === 'delta' && !wildcard && existingSeedUrlSet.has(url)) continue

      docsToInsert.push({
        agent_id: (agent as any).id,
        job_id,
        source_type: 'url',
        source_url: url,
        title: null,
        raw_text: null,
        meta: { mode: syncMode, wildcard, include_wildcards: includeWildcards, ttl_hours: ttlHours },
      })
    }

    if (docsToInsert.length === 0) {
      // Nothing new to queue. Mark the job as completed so UIs polling status don't hang.
      await supabase
        .from('rag_jobs')
        .update({ status: 'completed', error: 'no_changes' })
        .eq('id', job_id)

      return NextResponse.json({
        ok: true,
        data: {
          job_id,
          document_count: 0,
          documents_queued: 0,
          mode: syncMode,
          ttl_hours: ttlHours,
          run_now: false,
          include_wildcards: includeWildcards,
          seed_urls_total: seedUrls.length,
          seed_urls_had_wildcards: hadWildcardSeeds,
          seed_urls_skipped_existing: syncMode === 'delta' ? existingSeedUrlSet.size : 0,
          docs_queued: 0,
          docs_inserted: 0,
          note:
            syncMode === 'delta' && hadWildcardSeeds && !includeWildcards
              ? 'delta_mode_skipped_wildcards'
              : 'no_new_sources',
        },
      })
    }

    let insertedDocs: any[] = []
    if (docsToInsert.length > 0) {
      const { data: docs, error: docsErr } = await supabase.from('rag_documents').insert(docsToInsert).select()

      if (docsErr) {
        console.error('[rag/schedule] document insert error:', docsErr)
        return NextResponse.json(
          { ok: false, error: 'RAG job created, but failed to create document records. Check logs.' },
          { status: 500 }
        )
      }

      insertedDocs = docs || []
    }

    // Optional: immediately run worker (default on).
    // Fire-and-forget so the UI can navigate away without aborting the schedule request.
    if (runNow) {
      const runUrl = new URL('/api/rag/run', req.url)
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 1500)
      fetch(runUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id, mode: syncMode, ttl_hours: ttlHours }),
        signal: controller.signal,
      })
        .catch((e) => {
          // This is expected in dev when the worker is slow; the job is still queued.
          console.warn('[rag/schedule] run_now trigger threw (non-fatal):', e)
        })
        .finally(() => clearTimeout(t))
    }

    return NextResponse.json({
      ok: true,
      data: {
        // Backward-compatible keys used by the UI
        job_id,
        document_count: insertedDocs.length,
        documents_queued: docsToInsert.length,

        // Newer, more explicit fields
        mode: syncMode,
        ttl_hours: ttlHours,
        run_now: runNow,
        include_wildcards: includeWildcards,

        // What we intended to enqueue vs what actually inserted.
        seed_urls_total: seedUrls.length,
        seed_urls_had_wildcards: hadWildcardSeeds,
        seed_urls_skipped_existing: syncMode === 'delta' ? existingSeedUrlSet.size : 0,
        docs_queued: docsToInsert.length,
        docs_inserted: insertedDocs.length,
      },
    })
  } catch (err) {
    console.error('[rag/schedule] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error scheduling RAG job.' }, { status: 500 })
  }
}