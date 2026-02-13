import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json().catch(() => ({}))
    const session_id = body?.session_id as string

    if (!session_id) {
      return NextResponse.json({ ok: false, message: 'session_id required' }, { status: 400 })
    }

    // mark session finished and set status
    const { data: sess } = await supabase
      .from('guided_setup_sessions')
      .select('state_json')
      .eq('id', session_id)
      .single()

    const state = sess?.state_json || {}
    state.finished = true

    await supabase
      .from('guided_setup_sessions')
      .update({ state_json: state, status: 'complete' })
      .eq('id', session_id)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[guided-setup/end] error:', err?.message || err)
    return NextResponse.json({ ok: false, message: 'end failed' }, { status: 500 })
  }
}