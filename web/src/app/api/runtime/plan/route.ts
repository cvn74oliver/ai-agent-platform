import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  RuntimePlanJson,
  RuntimePlanRequest,
  RuntimeProposedAction,
  RuntimeApprovalRequestPayload,
} from '@/lib/runtime/types'
import { isUuid } from '@/lib/runtime/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateProposedActions(value: unknown): RuntimeProposedAction[] | null {
  if (value == null) return []
  if (!Array.isArray(value)) return null

  const actions: RuntimeProposedAction[] = []
  for (const item of value) {
    if (!isRecord(item)) return null
    const tool = item.tool
    const action = item.action
    if (typeof tool !== 'string' || !tool.trim()) return null
    if (typeof action !== 'string' || !action.trim()) return null
    actions.push({
      tool: tool.trim(),
      action: action.trim(),
      args: item.args,
    })
  }
  return actions
}

function generatePlanJson(
  userRequest: string,
  proposedActions: RuntimeProposedAction[],
  generatedAt: string
): RuntimePlanJson {
  const baseSteps: RuntimePlanJson['steps'] = [
    {
      id: 1,
      title: 'Interpret request',
      description: 'Clarify intent, required inputs, and expected output boundaries.',
    },
    {
      id: 2,
      title: 'Await approval',
      description: 'Pause execution until a reviewer approves or rejects this plan.',
    },
  ]

  const actionSteps = proposedActions.map((action, index) => ({
    id: baseSteps.length + index + 1,
    title: `Proposed action ${index + 1}`,
    description: `${action.tool}.${action.action}`,
    proposed_action: action,
  }))

  return {
    version: 'mvp.v1',
    approval_required: true,
    generated_at: generatedAt,
    goal: userRequest,
    steps: actionSteps.length
      ? [...baseSteps, ...actionSteps]
      : [
          ...baseSteps,
          {
            id: 3,
            title: 'Prepare execution outline',
            description: 'Create a safe, minimal action outline based on the approved request.',
          },
        ],
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RuntimePlanRequest | null

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

    if (typeof body.user_request !== 'string' || !body.user_request.trim()) {
      return NextResponse.json(
        { ok: false, error: 'user_request is required' },
        { status: 400 }
      )
    }

    const userRequest = body.user_request.trim()

    const proposedActions = validateProposedActions(body.proposed_actions)
    if (proposedActions === null) {
      return NextResponse.json(
        { ok: false, error: 'proposed_actions must be an array of { tool, action, args? }' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const approvalId = crypto.randomUUID()
    const nowIso = new Date().toISOString()
    const planJson = generatePlanJson(userRequest, proposedActions, nowIso)

    const payload: RuntimeApprovalRequestPayload = {
      approval_id: approvalId,
      agent_id: agentId,
      user_request: userRequest,
      plan_json: planJson,
      proposed_actions: proposedActions,
      created_at: nowIso,
    }

    const { error } = await supabase.from('agent_events').insert([
      {
        agent_id: agentId,
        event_type: 'approval_request',
        created_at: nowIso,
        payload,
      },
    ])

    if (error) {
      console.error('[runtime/plan] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to create approval request.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        approval_id: approvalId,
        plan_json: planJson,
      },
    })
  } catch (err) {
    console.error('[runtime/plan] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/plan.' },
      { status: 500 }
    )
  }
}
