import { NextResponse } from 'next/server'
import {
  classifyDecisionReplay,
  validateBoundApprovalDecision,
  validateBoundApprovalRequest,
} from '@/lib/runtime/runtimeApprovalIntegrity'
import {
  resolveRuntimeRequestAccess,
  resolveRuntimeRequestPrincipal,
} from '@/lib/runtime/runtimeRequestAccess'
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
    const principal = await resolveRuntimeRequestPrincipal({
      req,
      requireSameOrigin: true,
    })
    if (!principal.ok) return principal.response

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

    const access = await resolveRuntimeRequestAccess({
      principal,
      agentId,
    })
    if (!access.ok) return access.response
    const supabase = access.admin

    const { data: approvalRequestRows, error: approvalRequestError } = await supabase
      .from('agent_events')
      .select('id,agent_id,payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'approval_request')
      .eq('payload->>approval_id', approvalId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (approvalRequestError) {
      console.error('[runtime/approve] approval request lookup failed')
      return NextResponse.json(
        { ok: false, error: 'Failed to load approval request.' },
        { status: 500 }
      )
    }

    const approvalRequest = validateBoundApprovalRequest({
      row: approvalRequestRows?.[0],
      agentId,
      approvalId,
    })
    if (!approvalRequest) {
      return NextResponse.json(
        { ok: false, error: 'Approval request not found or access denied.' },
        { status: 404 }
      )
    }

    const { data: currentDecisionRows, error: currentDecisionError } = await supabase
      .from('agent_events')
      .select('id,agent_id,payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'approval_decision')
      .eq('payload->>approval_id', approvalId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (currentDecisionError) {
      console.error('[runtime/approve] current decision lookup failed')
      return NextResponse.json(
        { ok: false, error: 'Failed to check current approval decision.' },
        { status: 500 }
      )
    }

    const currentDecisionRow = currentDecisionRows?.[0]
    const currentDecision = validateBoundApprovalDecision({
      row: currentDecisionRow,
      agentId,
      approvalId,
    })
    if (currentDecisionRow && !currentDecision) {
      return NextResponse.json(
        { ok: false, error: 'Current approval decision is invalid.' },
        { status: 409 }
      )
    }

    const replay = classifyDecisionReplay(currentDecision, body.decision)
    if (replay === 'idempotent') {
      return NextResponse.json({ ok: true })
    }
    if (replay === 'conflict') {
      return NextResponse.json(
        { ok: false, error: 'Approval already has a conflicting decision.' },
        { status: 409 }
      )
    }

    const decidedAt = new Date().toISOString()

    const payload: RuntimeApprovalDecisionPayload = {
      approval_id: approvalId,
      actor_id: access.actorId,
      tenant_id: access.tenantId,
      request_event_id: approvalRequest.eventId,
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
      const proposedActions = parseProposedActions(approvalRequest.payload.proposed_actions)

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
            actor_id: access.actorId,
            tenant_id: access.tenantId,
            request_event_id: approvalRequest.eventId,
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
