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

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_DRAFTS_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'

type GmailDraftArgs = {
  to: string
  subject: string
  body: string
}

type ParsedExecutionAction =
  | { tool: 'sandbox'; action: RuntimeProposedAction }
  | { tool: 'gmail'; action: 'draft_email'; args: GmailDraftArgs }

type GoogleRefreshTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

type GmailDraftCreateResponse = {
  id?: string
  message?: {
    id?: string
  }
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

function parseGmailDraftArgs(args: unknown): GmailDraftArgs | null {
  if (!isRecord(args)) return null

  const to = typeof args.to === 'string' ? args.to.trim() : ''
  const subject = typeof args.subject === 'string' ? args.subject : null
  const body = typeof args.body === 'string' ? args.body : null

  if (!to || subject == null || body == null) return null
  return { to, subject, body }
}

function parseExecutionActions(
  actions: RuntimeProposedAction[]
): { actions: ParsedExecutionAction[]; error?: 'invalid_gmail' | 'unsupported' } {
  const parsed: ParsedExecutionAction[] = []

  for (const action of actions) {
    if (action.tool === 'sandbox') {
      parsed.push({ tool: 'sandbox', action })
      continue
    }

    if (action.tool === 'gmail') {
      if (action.action !== 'draft_email') {
        return { actions: [], error: 'invalid_gmail' }
      }

      const gmailArgs = parseGmailDraftArgs(action.args)
      if (!gmailArgs) {
        return { actions: [], error: 'invalid_gmail' }
      }

      parsed.push({ tool: 'gmail', action: 'draft_email', args: gmailArgs })
      continue
    }

    return { actions: [], error: 'unsupported' }
  }

  return { actions: parsed }
}

function isExpiredTimestamp(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false

  return parsed <= Date.now()
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function refreshGmailAccessToken(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
}): Promise<{ accessToken: string; expiresAt: string | null } | null> {
  const tokenBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  })

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
    cache: 'no-store',
  })

  const tokenData = (await tokenResponse.json().catch(() => null)) as GoogleRefreshTokenResponse | null
  if (!tokenResponse.ok || !tokenData?.access_token) {
    console.error('[runtime/execute] Gmail refresh token error:', tokenData)
    return null
  }

  const expiresAt =
    typeof tokenData.expires_in === 'number'
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

  return {
    accessToken: tokenData.access_token,
    expiresAt,
  }
}

async function createGmailDraft(params: {
  accessToken: string
  to: string
  subject: string
  body: string
}): Promise<{ draftId: string; messageId: string } | null> {
  const mimeMessage = [`To: ${params.to}`, `Subject: ${params.subject}`, '', params.body].join('\r\n')
  const raw = toBase64Url(mimeMessage)

  const gmailResponse = await fetch(GMAIL_DRAFTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw },
    }),
    cache: 'no-store',
  })

  const draftData = (await gmailResponse.json().catch(() => null)) as GmailDraftCreateResponse | null
  const draftId = typeof draftData?.id === 'string' ? draftData.id : ''
  const messageId = typeof draftData?.message?.id === 'string' ? draftData.message.id : ''

  if (!gmailResponse.ok || !draftId || !messageId) {
    console.error('[runtime/execute] Gmail draft create error:', draftData)
    return null
  }

  return { draftId, messageId }
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

    const parsedExecution = parseExecutionActions(proposedActions)
    if (parsedExecution.error === 'invalid_gmail') {
      return NextResponse.json({ ok: false, error: 'Invalid gmail draft arguments' }, { status: 400 })
    }

    if (parsedExecution.error === 'unsupported') {
      return NextResponse.json(
        { ok: false, error: 'Non-sandbox actions not executable in Slice 6A' },
        { status: 400 }
      )
    }

    const executionActions = parsedExecution.actions
    const hasGmailAction = executionActions.some((action) => action.tool === 'gmail')

    let gmailAccessToken = ''
    if (hasGmailAction) {
      const { data: agentRow, error: agentError } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agentId)
        .maybeSingle()

      if (agentError) {
        console.error('[runtime/execute] agent lookup error:', agentError)
        return NextResponse.json({ ok: false, error: 'Failed to load agent.' }, { status: 500 })
      }

      const userId = typeof agentRow?.user_id === 'string' ? agentRow.user_id : ''
      if (!userId) {
        return NextResponse.json({ ok: false, error: 'Gmail not connected' }, { status: 400 })
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('[runtime/execute] profile lookup error:', profileError)
        return NextResponse.json({ ok: false, error: 'Failed to load profile.' }, { status: 500 })
      }

      const tenantId = typeof profileRow?.tenant_id === 'string' ? profileRow.tenant_id : ''
      if (!tenantId) {
        return NextResponse.json({ ok: false, error: 'Gmail not connected' }, { status: 400 })
      }

      const { data: connectionRow, error: connectionError } = await supabase
        .from('integration_connections')
        .select('access_token,refresh_token,expires_at')
        .eq('tenant_id', tenantId)
        .eq('provider', 'gmail')
        .maybeSingle()

      if (connectionError) {
        console.error('[runtime/execute] Gmail connection lookup error:', connectionError)
        return NextResponse.json({ ok: false, error: 'Failed to load Gmail connection.' }, { status: 500 })
      }

      const accessToken =
        typeof connectionRow?.access_token === 'string' ? connectionRow.access_token.trim() : ''
      const refreshToken =
        typeof connectionRow?.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''

      if (!accessToken || !refreshToken) {
        return NextResponse.json({ ok: false, error: 'Gmail not connected' }, { status: 400 })
      }

      gmailAccessToken = accessToken

      if (isExpiredTimestamp(connectionRow?.expires_at)) {
        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          return NextResponse.json(
            { ok: false, error: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.' },
            { status: 500 }
          )
        }

        const refreshedToken = await refreshGmailAccessToken({
          refreshToken,
          clientId,
          clientSecret,
        })

        if (!refreshedToken) {
          return NextResponse.json(
            { ok: false, error: 'Failed to refresh Gmail access token.' },
            { status: 500 }
          )
        }

        gmailAccessToken = refreshedToken.accessToken

        const { error: updateConnectionError } = await supabase
          .from('integration_connections')
          .update({
            access_token: refreshedToken.accessToken,
            expires_at: refreshedToken.expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId)
          .eq('provider', 'gmail')

        if (updateConnectionError) {
          console.error('[runtime/execute] Gmail connection update error:', updateConnectionError)
          return NextResponse.json(
            { ok: false, error: 'Failed to persist refreshed Gmail token.' },
            { status: 500 }
          )
        }
      }
    }

    const results: RuntimeExecutionActionResult[] = []
    let draftId: string | null = null
    let messageId: string | null = null

    for (const action of executionActions) {
      if (action.tool === 'sandbox') {
        results.push(simulateSandboxAction(action.action))
        continue
      }

      const draft = await createGmailDraft({
        accessToken: gmailAccessToken,
        to: action.args.to,
        subject: action.args.subject,
        body: action.args.body,
      })

      if (!draft) {
        return NextResponse.json({ ok: false, error: 'Failed to create Gmail draft.' }, { status: 500 })
      }

      draftId = draft.draftId
      messageId = draft.messageId
      results.push({
        tool: 'gmail',
        action: 'draft_email',
        success: true,
        draft_id: draft.draftId,
        message_id: draft.messageId,
      })
    }

    const executedAt = new Date().toISOString()
    const executionPayload: RuntimeExecutionResultPayload =
      draftId && messageId
        ? {
            approval_id: approvalId,
            tool: 'gmail',
            action: 'draft_email',
            draft_id: draftId,
            message_id: messageId,
            executed_at: executedAt,
            success: true,
            ...(results.some((result) => result.tool === 'sandbox') ? { results } : {}),
          }
        : {
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

    if (draftId) {
      return NextResponse.json({ ok: true, data: { executed: true, draft_id: draftId } })
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
