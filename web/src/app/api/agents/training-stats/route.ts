import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  try {
    const { agent_id } = await req.json()

    if (!agent_id || typeof agent_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    // 1️⃣ Training examples from fine_tune_examples (grouped by source)
    const { data: ftRows, error: ftErr } = await supabase
      .from('fine_tune_examples')
      .select('source')
      .eq('agent_id', agent_id)

    if (ftErr) {
      console.error('[training-stats] fine_tune_examples error:', ftErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to load training data' },
        { status: 500 }
      )
    }

    const examplesByType: Record<string, number> = {}
    for (const row of ftRows || []) {
      const t = (row as any).source || 'unknown'
      examplesByType[t] = (examplesByType[t] || 0) + 1
    }
    const totalExamples = (ftRows || []).length

    // 2️⃣ Knowledge sources from rag_jobs + rag_documents
    const { data: jobRows, error: jobErr } = await supabase
      .from('rag_jobs')
      .select('id, status')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })

    if (jobErr) {
      console.error('[training-stats] rag_jobs error:', jobErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to load knowledge jobs' },
        { status: 500 }
      )
    }

    let ragSources = 0
    let latestJobStatus: string | null = null

    if (jobRows && jobRows.length > 0) {
      const jobIds = jobRows.map((j) => j.id)
      latestJobStatus = jobRows[0]?.status || null

      const { data: docRows, error: docErr } = await supabase
        .from('rag_documents')
        .select('id')
        .in('job_id', jobIds)

      if (docErr) {
        console.error('[training-stats] rag_documents error:', docErr)
      } else {
        ragSources = (docRows || []).length
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        total_examples: totalExamples,
        examples_by_type: examplesByType,
        rag_sources: ragSources,
        latest_rag_status: latestJobStatus,
      },
    })
  } catch (err) {
    console.error('[training-stats] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in training-stats' },
      { status: 500 }
    )
  }
}