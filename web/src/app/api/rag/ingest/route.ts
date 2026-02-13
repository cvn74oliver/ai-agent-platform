import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const USER_AGENT =
  'CurativeAgents/0.1 (+https://curativemushrooms.com; contact: support@curativemushrooms.com)'

// Very naive HTML → text stripper
function stripHtml(html: string): string {
  return html
    // remove scripts/styles
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // remove tags
    .replace(/<[^>]+>/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Turn "https://support.curativemushrooms.com/*" → "https://support.curativemushrooms.com/"
function normalizePatternToBaseUrl(pattern: string): string {
  const trimmed = pattern.trim()
  if (!trimmed.includes('*')) return trimmed
  return trimmed.replace(/\*+.*$/, '').replace(/\/?$/, '/')
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { job_id } = body as { job_id?: string }

    if (!job_id) {
      return NextResponse.json(
        { ok: false, error: 'job_id is required' },
        { status: 400 },
      )
    }

    const supabase = await getSupabaseAdmin()

    // 1) Load the job row
    const { data: job, error: jobErr } = await supabase
      .from('rag_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobErr || !job) {
      console.error('[rag/ingest] job load failed:', jobErr)
      return NextResponse.json(
        { ok: false, error: 'RAG job not found.' },
        { status: 404 },
      )
    }

    // 2) Load documents for this job
    const { data: docs, error: docsErr } = await supabase
      .from('rag_documents')
      .select('id, source_type, source_url, content')
      .eq('job_id', job_id)

    if (docsErr) {
      console.error('[rag/ingest] docs load failed:', docsErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to load rag_documents for job.' },
        { status: 500 },
      )
    }

    if (!docs || docs.length === 0) {
      console.warn('[rag/ingest] no documents found for job:', job_id)
      await supabase
        .from('rag_jobs')
        .update({
          status: 'completed',
          error: null,
        })
        .eq('id', job_id)

      return NextResponse.json({
        ok: true,
        data: {
          ingested: 0,
          skipped: 0,
          message: 'No documents to ingest for this job.',
        },
      })
    }

    let ingestedCount = 0
    let skippedCount = 0

    // 3) Loop through docs and fetch content (for URL types)
    for (const doc of docs) {
      const { id, source_type, source_url, content } = doc as {
        id: string
        source_type: string
        source_url: string
        content: string | null
      }

      // If content already present, skip
      if (content && content.trim().length > 0) {
        skippedCount += 1
        continue
      }

      if (source_type === 'url') {
        const baseUrl = normalizePatternToBaseUrl(source_url)
        console.log('[rag/ingest] fetching url:', baseUrl)

        try {
          const resp = await fetch(baseUrl, {
            method: 'GET',
            headers: {
              'User-Agent': USER_AGENT,
              Accept: 'text/html,application/xhtml+xml',
            },
          })

          if (!resp.ok) {
            console.warn('[rag/ingest] non-200 for', baseUrl, resp.status)
            skippedCount += 1
            continue
          }

          const html = await resp.text()
          const text = stripHtml(html)

          if (!text) {
            console.warn('[rag/ingest] empty content after strip for', baseUrl)
            skippedCount += 1
            continue
          }

          const { error: updErr } = await supabase
            .from('rag_documents')
            .update({ content: text })
            .eq('id', id)

          if (updErr) {
            console.error('[rag/ingest] failed to update content for doc', id, updErr)
            skippedCount += 1
          } else {
            ingestedCount += 1
          }
        } catch (e) {
          console.error('[rag/ingest] fetch failed for', baseUrl, e)
          skippedCount += 1
        }
      } else if (source_type === 'drive') {
        // For now, we don’t have Drive API auth wired — skip but count it
        console.log(
          '[rag/ingest] skipping drive source (not yet implemented):',
          source_url,
        )
        skippedCount += 1
      } else {
        console.log('[rag/ingest] unknown source_type, skipping:', source_type)
        skippedCount += 1
      }
    }

    // 4) Update job status
    await supabase
      .from('rag_jobs')
      .update({
        status: 'completed',
        error: null,
      })
      .eq('id', job_id)

    return NextResponse.json({
      ok: true,
      data: {
        job_id,
        ingested: ingestedCount,
        skipped: skippedCount,
      },
    })
  } catch (err) {
    console.error('[rag/ingest] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in RAG ingest route.' },
      { status: 500 },
    )
  }
}