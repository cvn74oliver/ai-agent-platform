import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import * as cheerio from 'cheerio'

const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'

// How long we consider a page "fresh" for delta sync (skip re-crawl)
const DEFAULT_DELTA_WINDOW_HOURS = 24 * 7 // 7 days

function hoursAgoIso(hours: number): string {
  const ms = Math.max(0, hours) * 60 * 60 * 1000
  return new Date(Date.now() - ms).toISOString()
}

async function shouldSkipDelta(opts: {
  supabase: any
  agentId: string
  url: string
  deltaWindowHours: number
}): Promise<boolean> {
  const { supabase, agentId, url, deltaWindowHours } = opts
  try {
    const cutoff = hoursAgoIso(deltaWindowHours)
    const { data, error } = await supabase
      .from('rag_pages')
      .select('last_crawled_at,status')
      .eq('agent_id', agentId)
      .eq('url', url)
      .maybeSingle()

    if (error || !data) return false
    if (data.status !== 'ok') return false
    if (!data.last_crawled_at) return false

    // Skip if crawled recently and was OK.
    return String(data.last_crawled_at) >= cutoff
  } catch {
    return false
  }
}

async function clearExistingPageDocs(opts: { supabase: any; agentId: string; url: string }) {
  const { supabase, agentId, url } = opts
  try {
    // Find existing doc IDs for this exact page URL
    const { data: rows, error } = await supabase
      .from('rag_documents')
      .select('id')
      .eq('agent_id', agentId)
      .eq('source_url', url)
      .limit(2000)

    if (error || !rows || rows.length === 0) return

    const ids = rows.map((r: any) => r.id)

    // Delete chunks first (FK)
    await supabase.from('rag_chunks').delete().in('document_id', ids)

    // Delete docs
    await supabase.from('rag_documents').delete().in('id', ids)
  } catch {
    // Non-fatal
  }
}

// ----------------------------------------------
// Helpers
// ----------------------------------------------

async function embedText(text: string): Promise<number[] | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const resp = await fetch(EMBEDDING_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    })

    const json = await resp.json().catch(() => null)

    if (!resp.ok) {
      console.warn('[rag/run] embed non-200:', resp.status, json?.error?.message || json)
      return null
    }

    return json?.data?.[0]?.embedding || null
  } catch (err) {
    console.error('[rag/run] embed error:', err)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function chunkText(text: string, chunkSize = 1500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let current: string[] = []

  for (const w of words) {
    if (current.join(' ').length + w.length > chunkSize) {
      chunks.push(current.join(' '))
      current = []
    }
    current.push(w)
  }
  if (current.length) chunks.push(current.join(' '))
  return chunks
}

function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token in English-ish text
  const t = (text || '').trim()
  if (!t) return 0
  return Math.max(1, Math.ceil(t.length / 4))
}

async function fetchHTML(url: string): Promise<{ html?: string; status: number; error?: string }> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Slightly more realistic headers to reduce bot blocking
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })

    const status = res.status

    if (!res.ok) {
      // Don’t attempt to parse body for blocked pages; just return status.
      return { status, error: `HTTP ${status}` }
    }

    const html = await res.text()
    return { status, html }
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'FETCH_TIMEOUT' : err?.message || 'Unknown fetch error'
    return { status: 0, error: msg }
  } finally {
    clearTimeout(id)
  }
}

function extractTitle(html: string): string | null {
  try {
    const $ = cheerio.load(html)
    const t = ($('title').first().text() || '').trim()
    return t || null
  } catch {
    return null
  }
}

function extractText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function extractLinks(html: string, baseUrl: string, maxPerPage = 50): string[] {
  const $ = cheerio.load(html)
  const out = new Set<string>()

  let baseOrigin = ''
  try {
    baseOrigin = new URL(baseUrl).origin
  } catch {
    // If baseUrl is weird, just return no links
    return []
  }

  $('a[href]').each((_, el) => {
    if (out.size >= maxPerPage) return

    const href = $(el).attr('href')?.trim()
    if (!href) return
    if (href.startsWith('#')) return
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return

    try {
      const abs = new URL(href, baseUrl)
      // Same-origin only
      if (abs.origin !== baseOrigin) return

      // Drop fragments
      abs.hash = ''

      const asStr = abs.toString()
      out.add(asStr)
    } catch {
      // ignore bad URLs
    }
  })

  return Array.from(out)
}

/**
 * Crawl one pattern (exact URL or wildcard) up to maxDepth/maxPages,
 * chunk & embed content, and write into rag_documents.
 *
 * patternUrl stays as the stored source_url for analytics, but we
 * crawl individual page URLs under the hood.
 */
async function crawlUrlTree(opts: {
  supabase: any
  jobId: string
  agentId: string
  patternUrl: string
  maxDepth: number
  maxPages: number
  mode: 'delta' | 'full'
  deltaWindowHours: number
}): Promise<{ success: number; fail: number; skipped: number }> {
  const { supabase, jobId, agentId, patternUrl, maxDepth, maxPages, mode, deltaWindowHours } = opts

  const rawPattern = (patternUrl || '').trim()
  if (!rawPattern) return { success: 0, fail: 0, skipped: 0 }

  // Track whether the *input pattern* was a wildcard.
  const patternWasWildcard = rawPattern.endsWith('*')

  let base = rawPattern

  // Normalize wildcard patterns like https://site.com/* → https://site.com/
  if (base.endsWith('*')) {
    base = base.replace(/\*+$/, '')
    if (!base.endsWith('/')) {
      base += '/'
    }
  }

  const queue: { url: string; depth: number }[] = [{ url: base, depth: 0 }]

  // If a help center root is blocked, the /hc/en-us/ path often works better.
  const helpCenterFallback = (() => {
    try {
      const u = new URL(base)
      if (u.hostname.startsWith('support.') && (u.pathname === '/' || u.pathname === '')) {
        u.pathname = '/hc/en-us/'
        u.hash = ''
        return u.toString()
      }
    } catch {}
    return null
  })()

  const visited = new Set<string>()
  let pagesCrawled = 0
  let success = 0
  let fail = 0
  let skipped = 0

  while (queue.length && pagesCrawled < maxPages) {
    const { url, depth } = queue.shift()!

    if (visited.has(url)) continue
    visited.add(url)

    console.log('[rag/run] Fetching URL:', url)

    // Lightweight progress signal (helps UI polling / debugging without schema changes)
    try {
      await supabase
        .from('rag_jobs')
        .update({ error: `running: processed=${pagesCrawled} ok=${success} fail=${fail} skipped=${skipped}` })
        .eq('id', jobId)
    } catch {
      // non-fatal
    }

    // DELTA MODE:
    // - For explicit URLs, we use a freshness window (recent OK crawls are skipped).
    // - For wildcard patterns, we use a *snapshot* rule: if we've *ever* crawled the URL successfully
    //   (status=ok in rag_pages), we skip it. This avoids re-scraping the full site on every “Sync New/Changed”.
    //   If content behind a wildcard changes, users must run a full resync.
    if (mode === 'delta') {
      if (patternWasWildcard) {
        try {
          const { data: pageRow, error: pageErr } = await supabase
            .from('rag_pages')
            .select('status')
            .eq('agent_id', agentId)
            .eq('url', url)
            .maybeSingle()

          if (!pageErr && pageRow?.status === 'ok') {
            skipped++
            continue
          }
        } catch {
          // fall through to crawl
        }
      } else {
        const skip = await shouldSkipDelta({
          supabase,
          agentId,
          url,
          deltaWindowHours,
        })
        if (skip) {
          skipped++
          continue
        }
      }
    }

    // FULL MODE: avoid duplicate documents by clearing existing docs/chunks for this exact page.
    if (mode === 'full') {
      await clearExistingPageDocs({ supabase, agentId, url })
    }

    const resp = await fetchHTML(url)
    const status = resp.status

    if (resp.error || !resp.html) {
      const errMsg = resp.error || `HTTP ${status}`

      // If blocked at the support root, try the /hc/en-us/ fallback once.
      if ((status === 403 || errMsg.includes('HTTP 403')) && helpCenterFallback && url === base) {
        console.warn('[rag/run] blocked at support root, retrying fallback:', helpCenterFallback)
        queue.unshift({ url: helpCenterFallback, depth })
        continue
      }

      console.warn('[rag/run] URL failed:', url, errMsg)
      fail++

      // Best-effort: keep a minimal document row for debugging/analytics
      await supabase.from('rag_documents').insert({
        job_id: jobId,
        agent_id: agentId || null,
        source_type: 'url',
        source_url: url,
        title: null,
        raw_text: null,
        meta: { pattern: patternUrl },
        content: null,
        embedding: null,
        http_status: status,
        error_code: errMsg,
      })

      // Track crawl status in rag_pages (safe even if table has unique(url) only)
      await supabase.from('rag_pages').upsert(
        {
          agent_id: agentId || null,
          url,
          title: null,
          page_type: 'crawl',
          last_crawled_at: new Date().toISOString(),
          status: status === 403 ? 'blocked' : 'error',
          error: errMsg,
        },
        { onConflict: 'url' }
      )

      continue
    }

    const title = extractTitle(resp.html)
    const text = extractText(resp.html)

    if (!text || text.length < 20) {
      console.warn('[rag/run] URL had no readable text:', url)
      fail++

      await supabase.from('rag_documents').insert({
        job_id: jobId,
        agent_id: agentId || null,
        source_type: 'url',
        source_url: url,
        title,
        raw_text: null,
        meta: { pattern: patternUrl },
        content: null,
        embedding: null,
        http_status: status,
        error_code: 'NO_TEXT',
      })

      await supabase.from('rag_pages').upsert(
        {
          agent_id: agentId || null,
          url,
          title,
          page_type: 'crawl',
          last_crawled_at: new Date().toISOString(),
          status: 'no_text',
          error: 'NO_TEXT',
        },
        { onConflict: 'url' }
      )

      continue
    }

    // Record page success (one row per page)
    await supabase.from('rag_pages').upsert(
      {
        agent_id: agentId || null,
        url,
        title,
        page_type: 'crawl',
        last_crawled_at: new Date().toISOString(),
        status: 'ok',
        error: null,
      },
      { onConflict: 'url' }
    )

    const chunks = chunkText(text)
    for (const chunk of chunks) {
      const vec = await embedText(chunk)

      const { data: docRow } = await supabase
        .from('rag_documents')
        .insert({
          job_id: jobId,
          agent_id: agentId || null,
          source_type: 'url',
          source_url: url, // store the actual page URL
          title,
          // Avoid duplicating the full page body for every chunk row.
          raw_text: null,
          meta: { pattern: patternUrl, text_len: text.length },
          content: chunk,
          embedding: vec,
          http_status: status,
          error_code: vec ? null : 'EMBED_FAIL',
        })
        .select('id')
        .single()

      // Mirror chunk into rag_chunks for retrieval paths that use rag_chunks
      if (docRow?.id) {
        await supabase.from('rag_chunks').insert({
          document_id: docRow.id,
          agent_id: agentId || null,
          content: chunk,
          tokens: estimateTokens(chunk),
        })
      }
    }

    success++
    pagesCrawled++

    // If we still have depth budget, enqueue internal links for the next layer
    if (depth < maxDepth) {
      const links = extractLinks(resp.html, url)
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: depth + 1 })
        }
      }
    }
  }

  return { success, fail, skipped }
}

// ----------------------------------------------
// MAIN WORKER
// ----------------------------------------------

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  // Optional: allow UI to run jobs for a specific agent (clears that agent's backlog).
  let targetAgentId: string | null = null
  let maxJobs = 10
  let mode: 'delta' | 'full' = 'full'
  let deltaWindowHours = DEFAULT_DELTA_WINDOW_HOURS

  try {
    const body = await req.json().catch(() => ({} as any))

    if (body && typeof body.agent_id === 'string' && body.agent_id.trim()) {
      targetAgentId = body.agent_id.trim()
    }

    if (body && typeof body.max_jobs === 'number' && Number.isFinite(body.max_jobs)) {
      maxJobs = Math.max(1, Math.min(50, Math.floor(body.max_jobs)))
    }

    if (body && typeof body.mode === 'string') {
      const m = body.mode.toLowerCase()
      if (m === 'delta' || m === 'full') mode = m
    }

    if (body && typeof body.delta_window_hours === 'number' && Number.isFinite(body.delta_window_hours)) {
      deltaWindowHours = Math.max(1, Math.min(24 * 30, Math.floor(body.delta_window_hours)))
    }
  } catch {
    // ignore body parse errors; keep defaults
  }

  // 1) Pull pending jobs. If agent_id is provided, clear that agent's backlog.
  let q = supabase
    .from('rag_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (targetAgentId) {
    q = q.eq('agent_id', targetAgentId)
  }

  const { data: jobs, error: jobErr } = await q.limit(maxJobs)

  if (jobErr || !jobs || jobs.length === 0) {
    return NextResponse.json({ ok: true, data: { message: `No pending RAG jobs. (mode=${mode})` } })
  }

  const results: any[] = []
  for (const job of jobs) {
    const jobId = job.id as string
    const agentId = job.agent_id as string

    console.log('[rag/run] Running job:', jobId)

    // Mark job as "running" (also update updated_at via trigger if present)
    await supabase.from('rag_jobs').update({ status: 'running', error: null }).eq('id', jobId)

    // 2. Fetch agent so we know which URLs to crawl
    const { data: agent } = await supabase
      .from('agents')
      .select('crawl_domains, rag_sources')
      .eq('id', agentId)
      .single()

    const urls: string[] = [
      ...(agent?.crawl_domains || []),
      ...(agent?.rag_sources || []),
    ]
      .map((u: any) => String(u).trim())
      .filter(Boolean)

    let totalSuccess = 0
    let totalFail = 0
    let totalSkipped = 0

    // 3. For each configured URL / pattern, choose crawl strategy
    for (const pattern of urls) {
      // Drive folders are special – we might handle them via a different
      // worker later. For now, we skip them instead of burning tokens.
      if (pattern.includes('drive.google.com')) {
        console.log('[rag/run] skipping drive source (not yet implemented):', pattern)
        continue
      }

      const isWildcard = pattern.endsWith('*')

      // Depth & page limits:
      // - wildcard: crawl base + internal links (depth 2, up to 50 pages)
      // - exact URL: crawl that one page only (depth 0, 1 page)
      const maxDepth = isWildcard ? 2 : 0
      const maxPages = isWildcard ? 50 : 1

      const { success, fail, skipped } = await crawlUrlTree({
        supabase,
        jobId,
        agentId,
        patternUrl: pattern,
        maxDepth,
        maxPages,
        mode,
        deltaWindowHours,
      })

      totalSuccess += success
      totalFail += fail
      totalSkipped += skipped
    }

    // 4. Mark job as completed/error
    const isAllFailed = totalFail > 0 && totalSuccess === 0
    await supabase
      .from('rag_jobs')
      .update({
        status: isAllFailed ? 'error' : 'completed',
        // Clear progress text; only store error codes when something actually failed.
        error: isAllFailed ? 'all_pages_failed' : totalFail > 0 ? 'partial_failures' : null,
      })
      .eq('id', jobId)

    results.push({
      job_id: jobId,
      agent_id: agentId,
      mode,
      delta_window_hours: mode === 'delta' ? deltaWindowHours : null,
      successCount: totalSuccess,
      skippedCount: totalSkipped,
      failCount: totalFail,
      message: `RAG job completed (${mode}${mode === 'delta' ? (agent?.crawl_domains?.some((u: any) => String(u || '').trim().endsWith('*')) ? '/snapshot' : '') : ''}). Pages crawled: ${totalSuccess}, skipped: ${totalSkipped}, failures: ${totalFail}.`,
    })
  }

  return NextResponse.json({ ok: true, data: { jobs: results } })
}