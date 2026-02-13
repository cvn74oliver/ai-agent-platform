import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  // 1️⃣ create a new session record
  const { data: session, error: sessErr } = await supabase
    .from('guided_setup_sessions')
    .insert([{ status: 'active', state_json: {} }])
    .select()
    .single()

  if (sessErr) {
    console.error('[guided-setup/start] insert error:', sessErr)
    return NextResponse.json({ error: sessErr.message }, { status: 500 })
  }

// 2️⃣ define the first question directly (no model call)
// This MUST match the first milestone key: agent_type
const question =
  "What type of AI agent are we creating? (Examples: Customer Support Agent, Technical Documentation Agent, Sales Assistant, Marketing Content Writer, Compliance Agent, Social Media Writer, etc.)"

  // 3️⃣ return the session id + first question
  return NextResponse.json({ session_id: session.id, question })
}