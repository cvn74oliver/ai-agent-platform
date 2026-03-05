import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isUuid } from '@/lib/runtime/types'
import type {
  RuntimeApprovalDecisionPayload,
  RuntimeAutoApproveRequest,
  RuntimeMode,
} from '@/lib/runtime/types'

const CONFIDENCE_THRESHOLD = 10

type AgentEventPayloadRow = {
  payload: unknown
}

type ProposedAction = {
  tool: string
  action: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseMode(value: unknown): RuntimeMode | null {
  return value === 'training' || value === 'guarded' ? value : null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseProposedActions(value: unknown): ProposedAction[] {
  if (!Array.isArray(value)) return []

  const actions: ProposedAction[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    const tool = typeof item.tool === 'string' ? item.tool.trim() : ''
    const action = typeof item.action === 'string' ? item.action.trim() : ''
    if (!tool || !action) continue
    actions.push({ tool, action })
  }

  return actions
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RuntimeAutoApproveRequest | null

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

    const supabase = await getSupabaseAdmin()

    const { data: modeRows, error: modeError } = await supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'runtime_mode_update')
      .order('created_at', { ascending: false })
      .limit(1)

    if (modeError) {
      console.error('[runtime/auto-approve] mode lookup error:', modeError)
      return NextResponse.json(
        { ok: false, error: 'Failed to load runtime mode.' },
        { status: 500 }
      )
    }

    let mode: RuntimeMode = 'training'
    const modePayload = modeRows?.[0] ? parsePayload(modeRows[0].payload) : null
    const parsedMode = parseMode(modePayload?.mode)
    if (parsedMode) mode = parsedMode

    if (mode !== 'guarded') {
      return NextResponse.json(
        { ok: false, error: 'Mode must be guarded' },
        { status: 400 }
      )
    }

    const { count: existingDecisionCount, error: existingDecisionError } = await supabase
      .from('agent_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'approval_decision')
      .eq('payload->>approval_id', approvalId)

    if (existingDecisionError) {
      console.error('[runtime/auto-approve] decision lookup error:', existingDecisionError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check existing decision.' },
        { status: 500 }
      )
    }

    if ((existingDecisionCount ?? 0) > 0) {
      return NextResponse.json(
        { ok: false, error: 'Already decided' },
        { status: 400 }
      )
    }

    const { data: requestRows, error: requestError } = await supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'approval_request')
      .eq('payload->>approval_id', approvalId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (requestError) {
      console.error('[runtime/auto-approve] request lookup error:', requestError)
      return NextResponse.json(
        { ok: false, error: 'Failed to load approval request.' },
        { status: 500 }
      )
    }

    const approvalRequestPayload = requestRows?.[0] ? parsePayload(requestRows[0].payload) : null
    const proposedActions = parseProposedActions(approvalRequestPayload?.proposed_actions)

    if (proposedActions.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No proposed actions' },
        { status: 400 }
      )
    }

    const { data: confidenceRows, error: confidenceError } = await supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'confidence_update')
      .eq('payload->>decision', 'approved')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (confidenceError) {
      console.error('[runtime/auto-approve] confidence lookup error:', confidenceError)
      return NextResponse.json(
        { ok: false, error: 'Failed to load confidence updates.' },
        { status: 500 }
      )
    }

    const maxApprovedCountByAction = new Map<string, number>()
    for (const row of (confidenceRows || []) as AgentEventPayloadRow[]) {
      const payload = parsePayload(row.payload)
      if (!payload) continue

      const tool = typeof payload.tool === 'string' ? payload.tool.trim() : ''
      const action = typeof payload.action === 'string' ? payload.action.trim() : ''
      if (!tool || !action) continue

      const newCount = toNumber(payload.new_count)
      if (newCount == null) continue

      const actionKey = `${tool}::${action}`
      const currentMax = maxApprovedCountByAction.get(actionKey)
      if (currentMax == null || newCount > currentMax) {
        maxApprovedCountByAction.set(actionKey, newCount)
      }
    }

    const allEligible = proposedActions.every((proposedAction) => {
      const actionKey = `${proposedAction.tool}::${proposedAction.action}`
      const approvedCount = maxApprovedCountByAction.get(actionKey) ?? 0
      return approvedCount >= CONFIDENCE_THRESHOLD
    })

    if (!allEligible) {
      return NextResponse.json(
        { ok: false, error: 'Not eligible' },
        { status: 400 }
      )
    }

    const decidedAt = new Date().toISOString()
    const payload: RuntimeApprovalDecisionPayload = {
      approval_id: approvalId,
      decision: 'approved',
      auto_approved: true,
      decided_at: decidedAt,
      reviewer_note: 'auto-approved (guarded mode)',
    }

    const { error: insertError } = await supabase.from('agent_events').insert([
      {
        agent_id: agentId,
        event_type: 'approval_decision',
        created_at: decidedAt,
        payload,
      },
    ])

    if (insertError) {
      console.error('[runtime/auto-approve] insert error:', insertError)
      return NextResponse.json(
        { ok: false, error: 'Failed to store approval decision.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[runtime/auto-approve] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/auto-approve.' },
      { status: 500 }
    )
  }
}
