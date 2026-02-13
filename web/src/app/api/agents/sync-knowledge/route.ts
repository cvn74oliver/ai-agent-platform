import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type RagJobType = 'rag_crawl' | 'rag_drive_sync'

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  try {
    const body = await req.json().catch(() => ({}))
    const { agent_id } = body || {}

    if (!agent_id || typeof agent_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    // 1️⃣ Load agent & its sources
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, rag_sources, crawl_domains, onboarding_summary')
      .eq('id', agent_id)
      .single()

    if (agentErr || !agent) {
      console.error('[sync-knowledge] agent load error:', agentErr)
      return NextResponse.json(
        { ok: false, error: 'Agent not found or access denied.' },
        { status: 404 }
      )
    }

    // Normalize sources from both top-level + onboarding_summary
    const summary = (agent.onboarding_summary || {}) as any

    const ragSources: string[] = Array.isArray(agent.rag_sources)
      ? agent.rag_sources
      : Array.isArray(summary.rag_links)
      ? summary.rag_links
      : typeof summary.rag_links === 'string'
      ? summary.rag_links.split(/\s+/).filter(Boolean)
      : []

    const crawlDomains: string[] = Array.isArray(agent.crawl_domains)
      ? agent.crawl_domains
      : Array.isArray(summary.crawl_domains)
      ? summary.crawl_domains
      : typeof summary.crawl_domains === 'string'
      ? summary.crawl_domains.split(/\s+/).filter(Boolean)
      : []

    const driveLikeSources = ragSources.filter((url) =>
      ['drive.google.com', 'dropbox.com', 'sharepoint.com'].some((host) =>
        url.includes(host)
      )
    )

    const urlSources = crawlDomains.filter((u) => /^https?:\/\//i.test(u))

    if (driveLikeSources.length === 0 && urlSources.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No RAG / crawl sources found. Please add Drive/Dropbox/SharePoint links or crawl domains first.',
        },
        { status: 400 }
      )
    }

    const jobsToInsert: {
      agent_id: string
      job_type: RagJobType
      status: 'queued'
      total_sources: number
      processed_sources: number
      metadata: any
    }[] = []

    if (driveLikeSources.length > 0) {
      jobsToInsert.push({
        agent_id,
        job_type: 'rag_drive_sync',
        status: 'queued',
        total_sources: driveLikeSources.length,
        processed_sources: 0,
        metadata: { sources: driveLikeSources },
      })
    }

    if (urlSources.length > 0) {
      jobsToInsert.push({
        agent_id,
        job_type: 'rag_crawl',
        status: 'queued',
        total_sources: urlSources.length,
        processed_sources: 0,
        metadata: { urls: urlSources },
      })
    }

    // 2️⃣ Insert jobs
    const { data: jobs, error: jobsErr } = await supabase
      .from('rag_jobs')
      .insert(jobsToInsert)
      .select('*')

    if (jobsErr) {
      console.error('[sync-knowledge] job insert error:', jobsErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to create RAG jobs.' },
        { status: 500 }
      )
    }

    // For now we just queue jobs. A background worker / cron can later:
    // - Pick up queued jobs
    // - Fetch documents and pages
    // - Populate rag_documents and rag_chunks
    // - Mark job status as running -> completed / error

    return NextResponse.json({
      ok: true,
      data: {
        agent_id,
        jobs,
        message:
          'Knowledge sync jobs queued. A background worker should process these into rag_documents and rag_chunks.',
      },
    })
  } catch (err) {
    console.error('[sync-knowledge] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in sync-knowledge endpoint.' },
      { status: 500 }
    )
  }
}