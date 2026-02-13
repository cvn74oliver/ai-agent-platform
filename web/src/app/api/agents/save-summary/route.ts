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
    const rawRagLinks = (summary as any).rag_links
    let rag_sources: string[] | null = null

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
    const rawCrawl = (summary as any).crawl_domains
    let crawl_domains: string[] | null = null

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

    // Build update payload – only include rag_sources / crawl_domains
    // if we actually found values (so we don’t accidentally nuke them with null)
    const updatePayload: Record<string, any> = {
      onboarding_summary,
      additional_notes,
    }

    if (rag_sources && rag_sources.length > 0) {
      updatePayload.rag_sources = rag_sources
    }
    if (crawl_domains && crawl_domains.length > 0) {
      updatePayload.crawl_domains = crawl_domains
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