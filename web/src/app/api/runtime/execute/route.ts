import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isUuid } from '@/lib/runtime/types'
import type {
  RuntimeExecuteRequest,
  RuntimeExecutionActionResult,
  RuntimeExecutionResultPayload,
  RuntimeMode,
  RuntimeProposedAction,
} from '@/lib/runtime/types'

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

function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return null
}

function parseProposedActions(value: unknown): RuntimeProposedAction[] | null {
  if (!Array.isArray(value)) return null

  const actions: RuntimeProposedAction[] = []
  for (const item of value) {
    if (!isRecord(item)) return null

    const tool = typeof item.tool === 'string' ? item.tool.trim() : ''
    const action = typeof item.action === 'string' ? item.action.trim() : ''
    if (!tool || !action) return null

    actions.push({
      tool,
      action,
      args: item.args,
    })
  }

  return actions
}

function simulateSandboxAction(action: RuntimeProposedAction): RuntimeExecutionActionResult {
  if (action.action === 'noop') {
    return {
      tool: 'sandbox',
      action: action.action,
      success: true,
      note: 'noop simulated',
    }
  }

  if (action.action === 'log') {
    let echoedMessage: string | undefined
    if (isRecord(action.args) && typeof action.args.message === 'string') {
      echoedMessage = action.args.message
    }

    return {
      tool: 'sandbox',
      action: action.action,
      success: true,
      echoed_message: echoedMessage,
      echoed_args: action.args,
      note: 'log simulated',
    }
  }

  if (action.action === 'wait_ms') {
    let waitMs: number | undefined
    if (isRecord(action.args)) {
      const parsedMs = toNonNegativeNumber(action.args.ms)
      if (parsedMs != null) waitMs = parsedMs
    }

    return {
      tool: 'sandbox',
      action: action.action,
      success: true,
      wait_ms: waitMs,
      note: 'wait intent recorded (no actual wait)',
    }
  }

  return {
    tool: 'sandbox',
    action: action.action,
    success: true,
    note: 'sandbox action simulated',
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RuntimeExecuteRequest | null

    if (!body || typeof body.agent_id !== 'string' || !body.agent_id.trim()) {
      return NextResponse.json({ ok: false, error: 'agent_id is required' }, { status: 400 })
    }

    const agentId = body.agent_id.trim()
    if (!isUuid(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'agent_id must be a valid UUID' },
        { status: 400 }
      )
    }

    if (typeof body.approval_id !== 'string' || !body.approval_id.trim()) {
      return NextResponse.json({ ok: false, error: 'approval_id is required' }, { status: 400 })
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
      console.error('[runtime/execute] mode lookup error:', modeError)
      return NextResponse.json({ ok: false, error: 'Failed to load runtime mode.' }, { status: 500 })
    }

    let mode: RuntimeMode = 'training'
    const modePayload = modeRows?.[0] ? parsePayload(modeRows[0].payload) : null
    const parsedMode = parseMode(modePayload?.mode)
    if (parsedMode) mode = parsedMode

    if (mode !== 'guarded') {
      return NextResponse.json({ ok: false, error: 'Mode must be guarded' }, { status: 400 })
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
      console.error('[runtime/execute] approval request lookup error:', requestError)
      return NextResponse.json(
        { ok: false, error: 'Failed to load approval request.' },
        { status: 500 }
      )
    }

    const approvalRequestPayload = requestRows?.[0] ? parsePayload(requestRows[0].payload) : null
    if (!approvalRequestPayload) {
      return NextResponse.json({ ok: false, error: 'Approval request not found' }, { status: 400 })
    }

    const { count: approvedDecisionCount, error: decisionError } = await supabase
      .from('agent_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'approval_decision')
      .eq('payload->>approval_id', approvalId)
      .eq('payload->>decision', 'approved')

    if (decisionError) {
      console.error('[runtime/execute] approval decision lookup error:', decisionError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check approval decision.' },
        { status: 500 }
      )
    }

    if ((approvedDecisionCount ?? 0) === 0) {
      return NextResponse.json({ ok: false, error: 'Approval not approved' }, { status: 400 })
    }

    const { count: existingExecutionCount, error: existingExecutionError } = await supabase
      .from('agent_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'execution_result')
      .eq('payload->>approval_id', approvalId)

    if (existingExecutionError) {
      console.error('[runtime/execute] execution check error:', existingExecutionError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check execution history.' },
        { status: 500 }
      )
    }

    if ((existingExecutionCount ?? 0) > 0) {
      return NextResponse.json({ ok: false, error: 'Already executed' }, { status: 400 })
    }

    const proposedActions = parseProposedActions(approvalRequestPayload.proposed_actions)
    if (proposedActions == null) {
      return NextResponse.json(
        { ok: false, error: 'Invalid proposed_actions' },
        { status: 400 }
      )
    }

    const hasNonSandboxAction = proposedActions.some((action) => action.tool !== 'sandbox')
    if (hasNonSandboxAction) {
      return NextResponse.json(
        { ok: false, error: 'Non-sandbox actions not executable in Slice 6A' },
        { status: 400 }
      )
    }

    const results = proposedActions.map(simulateSandboxAction)
    const executedAt = new Date().toISOString()
    const executionPayload: RuntimeExecutionResultPayload = {
      approval_id: approvalId,
      results,
      executed_at: executedAt,
      success: true,
    }

    const { error: insertError } = await supabase.from('agent_events').insert([
      {
        agent_id: agentId,
        event_type: 'execution_result',
        created_at: executedAt,
        payload: executionPayload,
      },
    ])

    if (insertError) {
      console.error('[runtime/execute] insert error:', insertError)
      return NextResponse.json(
        { ok: false, error: 'Failed to store execution result.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, data: { executed: true } })
  } catch (err) {
    console.error('[runtime/execute] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/execute.' },
      { status: 500 }
    )
  }
}
