import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  RuntimeApproveRequest,
  RuntimeApprovalDecisionPayload,
  RuntimeConfidenceUpdatePayload,
} from '@/lib/runtime/types'
import { isUuid } from '@/lib/runtime/types'

const CONFIDENCE_THRESHOLD = 10

type ProposedAction = {
  tool: string
  action: string
  args?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  return isRecord(parsed) ? parsed : null
}

function parseProposedActions(value: unknown): ProposedAction[] {
  if (!Array.isArray(value)) return []

  const actions: ProposedAction[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const tool = item.tool
    const action = item.action
    if (typeof tool !== 'string' || !tool.trim()) continue
    if (typeof action !== 'string' || !action.trim()) continue
    actions.push({
      tool: tool.trim(),
      action: action.trim(),
      args: item.args,
    })
  }
  return actions
}

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

    try {
      const { data: approvalRequestRows, error: approvalRequestError } = await supabase
        .from('agent_events')
        .select('payload, created_at')
        .eq('agent_id', agentId)
        .eq('event_type', 'approval_request')
        .eq('payload->>approval_id', approvalId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (approvalRequestError) {
        console.error('[runtime/approve] approval request lookup error:', approvalRequestError)
      } else {
        const approvalRequest = approvalRequestRows?.[0]
        const parsedPayload = approvalRequest ? parsePayload(approvalRequest.payload) : null
        const proposedActions = parseProposedActions(parsedPayload?.proposed_actions)

        if (proposedActions.length > 0) {
          for (const proposedAction of proposedActions) {
            const { count: approvedCount, error: countError } = await supabase
              .from('agent_events')
              .select('id', { count: 'exact', head: true })
              .eq('agent_id', agentId)
              .eq('event_type', 'confidence_update')
              .eq('payload->>tool', proposedAction.tool)
              .eq('payload->>action', proposedAction.action)
              .eq('payload->>decision', 'approved')

            if (countError) {
              console.error('[runtime/approve] confidence count error:', countError)
              continue
            }

            const currentCount = approvedCount ?? 0
            const increment = body.decision === 'approved' ? 1 : 0
            const newCount = currentCount + increment
            const eligibleAuto =
              body.decision === 'approved' && newCount >= CONFIDENCE_THRESHOLD

            const confidencePayload: RuntimeConfidenceUpdatePayload = {
              approval_id: approvalId,
              tool: proposedAction.tool,
              action: proposedAction.action,
              decision: body.decision,
              new_count: newCount,
              threshold: CONFIDENCE_THRESHOLD,
              eligible_auto: eligibleAuto,
              updated_at: decidedAt,
            }

            const { error: confidenceInsertError } = await supabase
              .from('agent_events')
              .insert([
                {
                  agent_id: agentId,
                  event_type: 'confidence_update',
                  created_at: decidedAt,
                  payload: confidencePayload,
                },
              ])

            if (confidenceInsertError) {
              console.error('[runtime/approve] confidence insert error:', confidenceInsertError)
            }
          }
        }
      }
    } catch (confidenceErr) {
      console.error('[runtime/approve] confidence update error:', confidenceErr)
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
