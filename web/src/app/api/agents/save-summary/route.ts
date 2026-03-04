import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { agent_id, onboarding_summary, additional_notes } = await req.json()

    if (!agent_id) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // 🔍 Normalize onboarding_summary so we can safely read rag_links / crawl_domains
    const summary =
      onboarding_summary && typeof onboarding_summary === 'object'
        ? onboarding_summary
        : {}

    // --- Normalize RAG sources (Drive/Dropbox/etc) ---
    // NOTE: agents.rag_sources is JSONB in the DB. We always write a JSON ARRAY
    // (including empty []) so downstream scheduling doesn't see `{}`.
    const rawRagLinks = (summary as any).rag_links
    let rag_sources: string[] = []

    if (Array.isArray(rawRagLinks)) {
      rag_sources = rawRagLinks
        .map((v: unknown) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
    } else if (typeof rawRagLinks === 'string') {
      rag_sources = rawRagLinks
        .split(/\r?\n|,/)
        .map((v) => v.trim())
        .filter(Boolean)
    }

    // --- Normalize crawl domains (URLs / wildcards) ---
    // NOTE: agents.crawl_domains is JSONB in the DB. Always write a JSON ARRAY.
    const rawCrawl = (summary as any).crawl_domains
    let crawl_domains: string[] = []

    if (Array.isArray(rawCrawl)) {
      crawl_domains = rawCrawl
        .map((v: unknown) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
    } else if (typeof rawCrawl === 'string') {
      crawl_domains = rawCrawl
        .split(/\r?\n|,/)
        .map((v) => v.trim())
        .filter(Boolean)
    }

    // Build update payload.
    // IMPORTANT: rag_sources + crawl_domains are derived from onboarding_summary.
    // We ALWAYS write them (including empty arrays) so they accurately reflect
    // the Summary page and so the scheduler doesn't treat `{}` as "no sources".
    const updatePayload: Record<string, any> = {
      onboarding_summary,
      additional_notes,
      rag_sources,     // jsonb array
      crawl_domains,   // jsonb array
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updatePayload)
      .eq('id', agent_id)
      .select()
      .single()

    if (error) {
      console.error('[save-summary] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, data: { agent: data } })
  } catch (err: any) {
    console.error('[save-summary] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in save-summary route.' },
      { status: 500 }
    )
  }
}