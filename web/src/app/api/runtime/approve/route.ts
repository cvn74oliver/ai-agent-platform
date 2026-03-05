import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  RuntimeApproveRequest,
  RuntimeApprovalDecisionPayload,
} from '@/lib/runtime/types'
import { isUuid } from '@/lib/runtime/types'

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RuntimeApproveRequest | null

    if (!body || typeof body.agent_id !== 'string' || !body.agent_id.trim()) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const agentId = body.agent_id.trim()
    if (!isUuid(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'agent_id must be a valid UUID' },
        { status: 400 }
      )
    }

    if (typeof body.approval_id !== 'string' || !body.approval_id.trim()) {
      return NextResponse.json(
        { ok: false, error: 'approval_id is required' },
        { status: 400 }
      )
    }

    const approvalId = body.approval_id.trim()
    if (!isUuid(approvalId)) {
      return NextResponse.json(
        { ok: false, error: 'approval_id must be a valid UUID' },
        { status: 400 }
      )
    }

    if (body.decision !== 'approved' && body.decision !== 'rejected') {
      return NextResponse.json(
        { ok: false, error: 'decision must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const decidedAt = new Date().toISOString()

    const payload: RuntimeApprovalDecisionPayload = {
      approval_id: approvalId,
      decision: body.decision,
      reviewer_note:
        typeof body.reviewer_note === 'string' && body.reviewer_note.trim()
          ? body.reviewer_note.trim()
          : undefined,
      decided_at: decidedAt,
    }

    const { error } = await supabase.from('agent_events').insert([
      {
        agent_id: agentId,
        event_type: 'approval_decision',
        created_at: decidedAt,
        payload,
      },
    ])

    if (error) {
      console.error('[runtime/approve] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to store approval decision.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[runtime/approve] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/approve.' },
      { status: 500 }
    )
  }
}
