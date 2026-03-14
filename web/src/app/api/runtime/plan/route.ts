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

type LifecycleEventRow = {
  event_type: string | null
  payload: unknown
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function parseRecordPayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function dedupeKeyFromAction(action: RuntimeProposedAction): string | null {
  if (action.tool !== 'gmail') return null
  if (action.action === 'analyze_inbox') return 'gmail.analyze_inbox'

  const args = isRecord(action.args) ? action.args : null
  const messageIds = Array.isArray(args?.message_ids)
    ? args.message_ids
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
        .sort()
        .join(',')
    : ''
  if (action.action === 'review_sender_cluster') {
    const sender = normalizeText(args?.sender)
    if (!sender) return null
    const batchTitle = normalizeText(args?.batch_title)
    return `gmail.review_sender_cluster|sender=${sender}|batch=${batchTitle || '-'}`
  }

  if (action.action === 'review_query_cluster') {
    const clusterId = normalizeText(args?.cluster_id)
    const query = normalizeText(args?.query)
    const title = normalizeText(args?.title)
    if (!clusterId && !query && !title) return null
    return `gmail.review_query_cluster|cluster=${clusterId || '-'}|query=${query || '-'}|title=${title || '-'}`
  }

  if (action.action === 'archive_messages') {
    const sender = normalizeText(args?.sender)
    const batchTitle = normalizeText(args?.batch_title)
    const clusterId = normalizeText(args?.cluster_id)
    const policies =
      args?.sender_policies && typeof args.sender_policies === 'object'
        ? Object.entries(args.sender_policies as Record<string, unknown>)
            .map(([key, value]) => `${normalizeText(key)}:${normalizeText(value)}`)
            .sort()
            .join(',')
        : ''
    return `gmail.archive_messages|sender=${sender || '-'}|batch=${batchTitle || '-'}|cluster=${clusterId || '-'}|messages=${messageIds || '-'}|policies=${policies || '-'}`
  }

  if (action.action === 'unsubscribe_senders') {
    const sender = normalizeText(args?.sender)
    const batchTitle = normalizeText(args?.batch_title)
    return `gmail.unsubscribe_senders|sender=${sender || '-'}|batch=${batchTitle || '-'}|messages=${messageIds || '-'}`
  }

  if (action.action === 'draft_replies') {
    const sender = normalizeText(args?.sender)
    const batchTitle = normalizeText(args?.batch_title)
    return `gmail.draft_replies|sender=${sender || '-'}|batch=${batchTitle || '-'}|messages=${messageIds || '-'}`
  }

  if (action.action === 'mark_important') {
    const sender = normalizeText(args?.sender)
    const batchTitle = normalizeText(args?.batch_title)
    return `gmail.mark_important|sender=${sender || '-'}|batch=${batchTitle || '-'}|messages=${messageIds || '-'}`
  }

  return null
}

function dedupeKeyFromProposedActions(actions: RuntimeProposedAction[]): string | null {
  if (actions.length !== 1) return null
  return dedupeKeyFromAction(actions[0])
}

async function findExistingPendingApproval(params: {
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>
  agentId: string
  sessionId: string | null
  dedupeKey: string
}): Promise<string | null> {
  const { data, error } = await params.supabase
    .from('agent_events')
    .select('event_type,payload,created_at')
    .eq('agent_id', params.agentId)
    .in('event_type', ['approval_request', 'approval_decision', 'execution_result'])
    .order('created_at', { ascending: false })
    .limit(800)

  if (error) {
    console.warn('[runtime/plan] lifecycle lookup failed (non-fatal):', error)
    return null
  }

  const latestDecisionByApproval = new Map<string, 'approved' | 'rejected'>()
  const executedApprovals = new Set<string>()

  for (const row of (data || []) as LifecycleEventRow[]) {
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    if (row.event_type === 'approval_decision') {
      const approvalId = typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
      const decision =
        payload.decision === 'approved' || payload.decision === 'rejected'
          ? payload.decision
          : null
      if (!approvalId || !decision || latestDecisionByApproval.has(approvalId)) continue
      latestDecisionByApproval.set(approvalId, decision)
      continue
    }

    if (row.event_type === 'execution_result') {
      const approvalId = typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
      if (!approvalId) continue
      executedApprovals.add(approvalId)
    }
  }

  for (const row of (data || []) as LifecycleEventRow[]) {
    if (row.event_type !== 'approval_request') continue
    const payload = parseRecordPayload(row.payload)
    if (!payload) continue

    const approvalId = typeof payload.approval_id === 'string' ? payload.approval_id.trim() : ''
    if (!approvalId) continue
    if (executedApprovals.has(approvalId)) continue

    const decision = latestDecisionByApproval.get(approvalId)
    if (decision === 'rejected') continue

    const payloadSessionId =
      typeof payload.session_id === 'string' && payload.session_id.trim()
        ? payload.session_id.trim()
        : null
    if (params.sessionId) {
      if (payloadSessionId !== params.sessionId) continue
    } else if (payloadSessionId) {
      // Keep dedupe scope stable: sessionless requests should only dedupe against other sessionless requests.
      continue
    }

    const actions = validateProposedActions(payload.proposed_actions)
    if (!actions) continue
    const payloadDedupeKey = dedupeKeyFromProposedActions(actions)
    if (!payloadDedupeKey || payloadDedupeKey !== params.dedupeKey) continue

    return approvalId
  }

  return null
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
    const sessionIdRaw = typeof body.session_id === 'string' ? body.session_id.trim() : ''
    const sessionId = sessionIdRaw || null
    if (sessionId && !isUuid(sessionId)) {
      return NextResponse.json(
        { ok: false, error: 'session_id must be a valid UUID when provided' },
        { status: 400 }
      )
    }

    const proposedActions = validateProposedActions(body.proposed_actions)
    if (proposedActions === null) {
      return NextResponse.json(
        { ok: false, error: 'proposed_actions must be an array of { tool, action, args? }' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const dedupeKey = dedupeKeyFromProposedActions(proposedActions)
    if (dedupeKey) {
      const existingApprovalId = await findExistingPendingApproval({
        supabase,
        agentId,
        sessionId,
        dedupeKey,
      })
      if (existingApprovalId) {
        return NextResponse.json({
          ok: true,
          data: {
            approval_id: existingApprovalId,
            reused_existing: true,
          },
        })
      }
    }

    const approvalId = crypto.randomUUID()
    const nowIso = new Date().toISOString()
    const planJson = generatePlanJson(userRequest, proposedActions, nowIso)

    const payload: RuntimeApprovalRequestPayload = {
      approval_id: approvalId,
      agent_id: agentId,
      ...(sessionId ? { session_id: sessionId } : {}),
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
