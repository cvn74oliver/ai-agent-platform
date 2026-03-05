import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isUuid } from '@/lib/runtime/types'
import type { RuntimeMode, RuntimeModeUpdatePayload } from '@/lib/runtime/types'

type RuntimeModeRequest = {
  agent_id?: unknown
  mode?: unknown
}

function parseMode(value: unknown): RuntimeMode | null {
  if (value === 'training' || value === 'guarded') return value
  return null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RuntimeModeRequest | null
    const rawAgentId = typeof body?.agent_id === 'string' ? body.agent_id.trim() : ''
    const mode = parseMode(body?.mode)

    if (!rawAgentId) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    if (!isUuid(rawAgentId)) {
      return NextResponse.json(
        { ok: false, error: 'agent_id must be a valid UUID' },
        { status: 400 }
      )
    }

    if (!mode) {
      return NextResponse.json(
        { ok: false, error: 'mode must be "training" or "guarded"' },
        { status: 400 }
      )
    }

    const updatedAt = new Date().toISOString()
    const payload: RuntimeModeUpdatePayload = {
      mode,
      updated_at: updatedAt,
    }

    const supabase = await getSupabaseAdmin()
    const { error } = await supabase.from('agent_events').insert([
      {
        agent_id: rawAgentId,
        event_type: 'runtime_mode_update',
        created_at: updatedAt,
        payload,
      },
    ])

    if (error) {
      console.error('[runtime/mode] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to update runtime mode.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[runtime/mode] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/mode.' },
      { status: 500 }
    )
  }
}
