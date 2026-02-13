import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseAdmin()
    const body = await req.json().catch(() => ({}))

    const { agent_id, job_id } = body as {
      agent_id?: string
      job_id?: string
    }

    if (!agent_id && !job_id) {
      return NextResponse.json(
        { ok: false, error: 'agent_id or job_id is required' },
        { status: 400 }
      )
    }

    // 1) Find the job to mark complete
    let job

    if (job_id) {
      const { data, error } = await supabase
        .from('fine_tune_jobs')
        .select('*')
        .eq('id', job_id)
        .single()

      if (error || !data) {
        console.error('[fine-tune/mock-complete] job lookup error:', error)
        return NextResponse.json(
          { ok: false, error: 'Fine-tune job not found.' },
          { status: 404 }
        )
      }

      job = data
    } else {
      // Most recent pending job for this agent
      const { data, error } = await supabase
        .from('fine_tune_jobs')
        .select('*')
        .eq('agent_id', agent_id!)
        .eq('status', 'pending')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('[fine-tune/mock-complete] pending job lookup error:', error)
        return NextResponse.json(
          { ok: false, error: 'Error looking up fine-tune job.' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { ok: false, error: 'No pending fine-tune job found for this agent.' },
          { status: 404 }
        )
      }

      job = data
    }

    const jobId = job.id
    const agentId = agent_id || job.agent_id

    // 2) Mark the job as completed
    const { error: jobUpdateErr, data: updatedJobs } = await supabase
      .from('fine_tune_jobs')
      .update({
        status: 'completed',
        progress: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .limit(1)

    if (jobUpdateErr || !updatedJobs || updatedJobs.length === 0) {
      console.error('[fine-tune/mock-complete] job update error:', jobUpdateErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to update fine-tune job.' },
        { status: 500 }
      )
    }

    const updatedJob = updatedJobs[0]

    // 3) Update the agent’s fine_tune_status / progress
    const { data: agentData, error: agentErr } = await supabase
      .from('agents')
      .update({
        fine_tune_status: 'completed',
        fine_tune_progress: 100,
      })
      .eq('id', agentId)
      .select()
      .single()

    if (agentErr || !agentData) {
      console.error('[fine-tune/mock-complete] agent update error:', agentErr)
      return NextResponse.json(
        { ok: false, error: 'Fine-tune job completed, but failed to update agent row.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        job: updatedJob,
        agent: agentData,
      },
    })
  } catch (err) {
    console.error('[fine-tune/mock-complete] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in mock-complete route.' },
      { status: 500 }
    )
  }
}