import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id } = body as { agent_id?: string }

    if (!agent_id) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // 1️⃣ Load the agent (to get user_id and make sure it exists)
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, user_id, fine_tune_status')
      .eq('id', agent_id)
      .single()

    if (agentErr || !agent) {
      console.error('[fine-tune/start] agent load error:', agentErr)
      return NextResponse.json(
        { ok: false, error: 'Agent not found or access denied.' },
        { status: 404 }
      )
    }

    // 2️⃣ Count how many training examples we currently have
    //    We now treat `fine_tune_examples` as the canonical store for LLM training rows.
    const { count: exampleCount, error: countErr } = await supabase
      .from('fine_tune_examples')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent_id)

    if (countErr) {
      console.error('[fine-tune/start] training_data count error:', countErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to count training examples.' },
        { status: 500 }
      )
    }

    const safeExampleCount = exampleCount ?? 0

    // 3️⃣ Insert a fine_tune_jobs row
    const { data: job, error: jobErr } = await supabase
      .from('fine_tune_jobs')
      .insert([
        {
          agent_id,
          user_id: agent.user_id ?? null,
          status: 'pending',
          progress: 0,
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (jobErr || !job) {
      console.error('[fine-tune/start] insert error:', jobErr)
      return NextResponse.json(
        { ok: false, error: 'Failed to create fine-tune job.' },
        { status: 500 }
      )
    }

    // 4️⃣ Update the agent’s fine-tune status + progress bar
    const { error: agentUpdateErr } = await supabase
      .from('agents')
      .update({
        fine_tune_status: 'queued',   // you can call this "started" if you prefer
        fine_tune_progress: 0,
      })
      .eq('id', agent_id)

    if (agentUpdateErr) {
      console.warn('[fine-tune/start] agent update warning:', agentUpdateErr)
      // not fatal — job still exists
    }

    return NextResponse.json({
      ok: true,
      data: {
        job_id: job.id,
        example_count: safeExampleCount,
      },
    })
  } catch (err) {
    console.error('[fine-tune/start] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in fine-tune start route.' },
      { status: 500 }
    )
  }
}