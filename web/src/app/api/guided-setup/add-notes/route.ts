import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = createClient()
  const { session_id, notes } = await req.json()

  await supabase.from('training_data').insert([
    {
      agent_id: session_id,
      example_text: notes,
      example_type: 'extra_notes',
    },
  ])

  return NextResponse.json({ message: 'Extra info saved.' })
}