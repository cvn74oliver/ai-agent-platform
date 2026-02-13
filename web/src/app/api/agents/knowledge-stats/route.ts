import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Returns, for a given agent:
 * - total doc count
 * - ok vs error doc counts
 * - per-source_url breakdown
 *
 * It joins rag_documents → rag_jobs so we only see docs for this agent.
 */
export async function POST(req: Request) {
  try {
    const { agent_id } = await req.json()

    if (!agent_id) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // Overall totals for this agent
    const { data: rows, error } = await supabase
      .from('rag_documents')
      .select(
        `
        id,
        source_url,
        http_status,
        error_code,
        rag_jobs!inner(agent_id)
      `
      )
      .eq('rag_jobs.agent_id', agent_id)

    if (error) {
      console.error('[knowledge-stats] rag_documents query error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to query rag_documents' },
        { status: 500 }
      )
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          total_docs: 0,
          ok_docs: 0,
          error_docs: 0,
          sources: [],
        },
      })
    }

    type Row = {
      source_url: string | null
      http_status: number | null
      error_code: string | null
    }

    let total = 0
    let ok = 0
    let err = 0

    const perSource: Record<
      string,
      { source_url: string; doc_count: number; ok_count: number; error_count: number }
    > = {}

    for (const r of rows as Row[]) {
      const url = r.source_url || 'unknown'
      total += 1

      const isOk =
        r.http_status !== null &&
        r.http_status >= 200 &&
        r.http_status < 300 &&
        !r.error_code

      const isError =
        (r.http_status !== null && r.http_status >= 400) ||
        (!!r.error_code && r.error_code.trim().length > 0)

      if (isOk) ok += 1
      if (isError) err += 1

      if (!perSource[url]) {
        perSource[url] = {
          source_url: url,
          doc_count: 0,
          ok_count: 0,
          error_count: 0,
        }
      }
      perSource[url].doc_count += 1
      if (isOk) perSource[url].ok_count += 1
      if (isError) perSource[url].error_count += 1
    }

    const sources = Object.values(perSource).sort(
      (a, b) => b.doc_count - a.doc_count
    )

    return NextResponse.json({
      ok: true,
      data: {
        total_docs: total,
        ok_docs: ok,
        error_docs: err,
        sources,
      },
    })
  } catch (err) {
    console.error('[knowledge-stats] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in knowledge-stats route.' },
      { status: 500 }
    )
  }
}