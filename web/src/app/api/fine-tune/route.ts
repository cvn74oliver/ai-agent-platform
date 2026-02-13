import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = createClient()
  const { agent_id } = await req.json()
  if (!agent_id)
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

  // create a fake training job
  await supabase
    .from('agents')
    .update({ fine_tune_status: 'training', fine_tune_progress: 0 })
    .eq('id', agent_id)

  // simulate progress
  for (let i = 1; i <= 10; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    await supabase
      .from('agents')
      .update({ fine_tune_progress: i / 10 })
      .eq('id', agent_id)
  }

  // mark complete
  await supabase
    .from('agents')
    .update({ fine_tune_status: 'completed', fine_tune_progress: 1 })
    .eq('id', agent_id)

  return NextResponse.json({ message: 'Fine-tuning complete' })
}