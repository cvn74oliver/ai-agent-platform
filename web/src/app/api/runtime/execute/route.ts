import { NextResponse } from 'next/server'
import {
  isExecutionBoundToRequest,
  validateBoundApprovalDecision,
  validateBoundApprovalRequest,
} from '@/lib/runtime/runtimeApprovalIntegrity'
import {
  resolveRuntimeRequestAccess,
  resolveRuntimeRequestPrincipal,
} from '@/lib/runtime/runtimeRequestAccess'
import {
  analyzeGmailInboxForTenant,
  archiveGmailMessagesForTenant,
  normalizeMailboxProfileScope,
  reviewGmailQueryClusterForTenant,
  reviewGmailSenderClusterForTenant,
} from '@/lib/integrations/gmail/inboxAnalysis'
import { resolveGmailSenderPolicyArchiveScopeForTenant } from '@/lib/integrations/gmail/gmailCleanupWorkspace'
import {
  classifyGmailArchiveExecution,
  classifyGmailDraftExecution,
} from '@/lib/integrations/gmail/gmailDecisionWorkspaceExecutionPolicy'
import {
  prepareDecisionWorkspaceExecutionClaim,
  sanitizeDecisionWorkspaceProviderReceipt,
  type DecisionWorkspaceExecutionActionInput,
  type DecisionWorkspaceExecutionActionOutcome,
} from '@/lib/runtime/decisionWorkspaceExecutionModel'
import {
  claimRuntimeExecution,
  finalizeRuntimeExecution,
  recordRuntimeExecutionActionReceipt,
  resolveStaleRuntimeExecution,
} from '@/lib/runtime/runtimeExecutionLedger'
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

type GmailReviewSenderClusterArgs = {
  sender: string
  count?: number
  batch_title?: string
}

type GmailReviewQueryClusterArgs = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  estimated_count?: number
  risk_note?: string
  safety_note?: string
}

type GmailArchiveMessagesArgs = {
  message_ids?: string[]
  sender?: string
  batch_title?: string
  source_label?: string
  cluster_id?: string
  cluster_type?: string
  title?: string
  query?: string
  analysis_scope?: string
  clusters?: Array<{
    cluster_id: string
    cluster_type: string
    title: string
    query: string
  }>
  sender_policies?: Record<string, 'keep' | 'archive' | 'quarantine' | 'unsubscribe' | 'custom_rule' | 'undecided'>
  message_overrides?: Record<string, 'include' | 'exclude'>
  selection_customization?: Record<string, unknown>
}

type ParsedExecutionAction =
  | { tool: 'sandbox'; action: RuntimeProposedAction }
  | { tool: 'gmail'; action: 'draft_email'; args: GmailDraftArgs }
  | { tool: 'gmail'; action: 'analyze_inbox' }
  | { tool: 'gmail'; action: 'review_sender_cluster'; args: GmailReviewSenderClusterArgs }
  | { tool: 'gmail'; action: 'review_query_cluster'; args: GmailReviewQueryClusterArgs }
  | { tool: 'gmail'; action: 'archive_messages'; args: GmailArchiveMessagesArgs }

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

type GmailDraftCreateAttemptResult = {
  outcome: DecisionWorkspaceExecutionActionOutcome
  draftId: string | null
  messageId: string | null
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

function parseGmailAnalyzeInboxArgs(args: unknown): true | null {
  if (args == null) return true
  if (isRecord(args) && Object.keys(args).length === 0) return true
  return null
}

function parseGmailReviewSenderClusterArgs(args: unknown): GmailReviewSenderClusterArgs | null {
  if (!isRecord(args)) return null

  const sender = typeof args.sender === 'string' ? args.sender.trim().toLowerCase() : ''
  if (!sender) return null

  const count = toNonNegativeNumber(args.count) ?? undefined
  const batchTitle = typeof args.batch_title === 'string' && args.batch_title.trim()
    ? args.batch_title.trim()
    : undefined

  return {
    sender,
    ...(count != null ? { count } : {}),
    ...(batchTitle ? { batch_title: batchTitle } : {}),
  }
}

function parseGmailReviewQueryClusterArgs(args: unknown): GmailReviewQueryClusterArgs | null {
  if (!isRecord(args)) return null

  const clusterId = typeof args.cluster_id === 'string' ? args.cluster_id.trim() : ''
  const clusterType = typeof args.cluster_type === 'string' ? args.cluster_type.trim() : ''
  const title = typeof args.title === 'string' ? args.title.trim() : ''
  const query = typeof args.query === 'string' ? args.query.trim() : ''
  if (!clusterId || !clusterType || !title || !query) return null

  const estimatedCount = toNonNegativeNumber(args.estimated_count) ?? undefined
  const riskNote =
    typeof args.risk_note === 'string' && args.risk_note.trim() ? args.risk_note.trim() : undefined
  const safetyNote =
    typeof args.safety_note === 'string' && args.safety_note.trim()
      ? args.safety_note.trim()
      : undefined

  return {
    cluster_id: clusterId,
    cluster_type: clusterType,
    title,
    query,
    ...(estimatedCount != null ? { estimated_count: estimatedCount } : {}),
    ...(riskNote ? { risk_note: riskNote } : {}),
    ...(safetyNote ? { safety_note: safetyNote } : {}),
  }
}

function parseGmailArchiveMessagesArgs(args: unknown): GmailArchiveMessagesArgs | null {
  if (!isRecord(args)) return null

  const messageIdsRaw = Array.isArray(args.message_ids) ? args.message_ids : []
  const seen = new Set<string>()
  const messageIds: string[] = []
  for (const entry of messageIdsRaw) {
    if (typeof entry !== 'string') continue
    const id = entry.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    messageIds.push(id)
  }

  const sender = typeof args.sender === 'string' && args.sender.trim()
    ? args.sender.trim().toLowerCase()
    : undefined
  const batchTitle = typeof args.batch_title === 'string' && args.batch_title.trim()
    ? args.batch_title.trim()
    : undefined
  const sourceLabel = typeof args.source_label === 'string' && args.source_label.trim()
    ? args.source_label.trim()
    : undefined
  const clusterId =
    typeof args.cluster_id === 'string' && args.cluster_id.trim() ? args.cluster_id.trim() : undefined
  const clusterType =
    typeof args.cluster_type === 'string' && args.cluster_type.trim()
      ? args.cluster_type.trim()
      : undefined
  const title = typeof args.title === 'string' && args.title.trim() ? args.title.trim() : undefined
  const query = typeof args.query === 'string' && args.query.trim() ? args.query.trim() : undefined
  const analysisScope =
    typeof args.analysis_scope === 'string' && args.analysis_scope.trim()
      ? args.analysis_scope.trim()
      : undefined
  const senderPolicies =
    isRecord(args.sender_policies) && Object.keys(args.sender_policies).length > 0
      ? (args.sender_policies as Record<
          string,
          'keep' | 'archive' | 'quarantine' | 'unsubscribe' | 'custom_rule' | 'undecided'
        >)
      : undefined
  const messageOverrides =
    isRecord(args.message_overrides) && Object.keys(args.message_overrides).length > 0
      ? (args.message_overrides as Record<string, 'include' | 'exclude'>)
      : undefined
  const clusters = Array.isArray(args.clusters)
    ? args.clusters
        .filter(
          (
            entry
          ): entry is {
            cluster_id: string
            cluster_type: string
            title: string
            query: string
          } =>
            isRecord(entry) &&
            typeof entry.cluster_id === 'string' &&
            typeof entry.cluster_type === 'string' &&
            typeof entry.title === 'string' &&
            typeof entry.query === 'string'
        )
        .map((entry) => ({
          cluster_id: entry.cluster_id.trim(),
          cluster_type: entry.cluster_type.trim(),
          title: entry.title.trim(),
          query: entry.query.trim(),
        }))
        .filter((entry) => entry.cluster_id && entry.cluster_type && entry.title && entry.query)
    : undefined
  const selectionCustomization =
    isRecord(args.selection_customization) ? (args.selection_customization as Record<string, unknown>) : undefined

  const hasDirectMessageIds = messageIds.length > 0
  const hasSenderPolicyScope =
    Boolean(clusterId && clusterType && title && query) &&
    Boolean(senderPolicies && Object.keys(senderPolicies).length > 0)

  if (!hasDirectMessageIds && !hasSenderPolicyScope) return null

  return {
    ...(messageIds.length > 0 ? { message_ids: messageIds } : {}),
    ...(sender ? { sender } : {}),
    ...(batchTitle ? { batch_title: batchTitle } : {}),
    ...(sourceLabel ? { source_label: sourceLabel } : {}),
    ...(clusterId ? { cluster_id: clusterId } : {}),
    ...(clusterType ? { cluster_type: clusterType } : {}),
    ...(title ? { title } : {}),
    ...(query ? { query } : {}),
    ...(analysisScope ? { analysis_scope: analysisScope } : {}),
    ...(clusters ? { clusters } : {}),
    ...(senderPolicies ? { sender_policies: senderPolicies } : {}),
    ...(messageOverrides ? { message_overrides: messageOverrides } : {}),
    ...(selectionCustomization ? { selection_customization: selectionCustomization } : {}),
  }
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
      if (action.action === 'draft_email') {
        const gmailArgs = parseGmailDraftArgs(action.args)
        if (!gmailArgs) {
          return { actions: [], error: 'invalid_gmail' }
        }

        parsed.push({ tool: 'gmail', action: 'draft_email', args: gmailArgs })
        continue
      }

      if (action.action === 'analyze_inbox') {
        if (!parseGmailAnalyzeInboxArgs(action.args)) {
          return { actions: [], error: 'invalid_gmail' }
        }

        parsed.push({ tool: 'gmail', action: 'analyze_inbox' })
        continue
      }

      if (action.action === 'review_sender_cluster') {
        const reviewArgs = parseGmailReviewSenderClusterArgs(action.args)
        if (!reviewArgs) {
          return { actions: [], error: 'invalid_gmail' }
        }

        parsed.push({ tool: 'gmail', action: 'review_sender_cluster', args: reviewArgs })
        continue
      }

      if (action.action === 'review_query_cluster') {
        const queryReviewArgs = parseGmailReviewQueryClusterArgs(action.args)
        if (!queryReviewArgs) {
          return { actions: [], error: 'invalid_gmail' }
        }

        parsed.push({ tool: 'gmail', action: 'review_query_cluster', args: queryReviewArgs })
        continue
      }

      if (action.action === 'archive_messages') {
        const archiveArgs = parseGmailArchiveMessagesArgs(action.args)
        if (!archiveArgs) {
          return { actions: [], error: 'invalid_gmail' }
        }

        parsed.push({ tool: 'gmail', action: 'archive_messages', args: archiveArgs })
        continue
      }

      return { actions: [], error: 'invalid_gmail' }
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
}): Promise<GmailDraftCreateAttemptResult> {
  const mimeMessage = [`To: ${params.to}`, `Subject: ${params.subject}`, '', params.body].join('\r\n')
  const raw = toBase64Url(mimeMessage)

  try {
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

    const draftData = (await gmailResponse
      .json()
      .catch(() => null)) as GmailDraftCreateResponse | null
    const draftId = typeof draftData?.id === 'string' ? draftData.id.trim() : ''
    const messageId = typeof draftData?.message?.id === 'string' ? draftData.message.id.trim() : ''
    const outcome = classifyGmailDraftExecution({
      phase: 'provider_response',
      httpStatus: gmailResponse.status,
      draftId,
      messageId,
      errorCode: gmailResponse.ok ? 'gmail_draft_receipt_missing' : 'gmail_draft_provider_error',
    })

    if (outcome.status !== 'succeeded') {
      console.error('[runtime/execute] Gmail draft create did not return a definitive success receipt.')
    }
    return {
      outcome,
      draftId: draftId || null,
      messageId: messageId || null,
    }
  } catch {
    return {
      outcome: classifyGmailDraftExecution({
        phase: 'transport_failure',
        errorCode: 'gmail_draft_transport_failure',
      }),
      draftId: null,
      messageId: null,
    }
  }
}

function executionActionInput(action: RuntimeProposedAction): DecisionWorkspaceExecutionActionInput {
  if (action.tool === 'sandbox') {
    return {
      tool: action.tool,
      action: action.action,
      args: action.args,
      providerType: 'sandbox',
      sourceId: null,
      connectionId: null,
      agentRoleId: null,
      capability: `sandbox.${action.action}`,
      effect: 'decision_only',
      reversibility: 'not_applicable',
    }
  }

  const providerWrite = action.action === 'draft_email' || action.action === 'archive_messages'
  return {
    tool: action.tool,
    action: action.action,
    args: action.args,
    providerType: action.tool,
    sourceId: action.tool === 'gmail' ? 'gmail.primary' : null,
    connectionId: null,
    agentRoleId: null,
    capability: `${action.tool}.${action.action}`,
    effect: providerWrite ? 'provider_write' : 'provider_read',
    reversibility:
      action.action === 'archive_messages'
        ? 'reversible'
        : action.action === 'draft_email'
          ? 'compensating_action'
          : 'not_applicable',
  }
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
    const principal = await resolveRuntimeRequestPrincipal({
      req,
      requireSameOrigin: true,
    })
    if (!principal.ok) return principal.response

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

    const access = await resolveRuntimeRequestAccess({
      principal,
      agentId,
    })
    if (!access.ok) return access.response
    const supabase = access.admin

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
      .select('id,agent_id,payload')
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

    const approvalRequest = validateBoundApprovalRequest({
      row: requestRows?.[0],
      agentId,
      approvalId,
    })
    if (!approvalRequest) {
      return NextResponse.json(
        { ok: false, error: 'Approval request not found or access denied.' },
        { status: 404 }
      )
    }

    const { data: decisionRows, error: decisionError } = await supabase
      .from('agent_events')
      .select('id,agent_id,payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'approval_decision')
      .eq('payload->>approval_id', approvalId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (decisionError) {
      console.error('[runtime/execute] approval decision lookup error:', decisionError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check approval decision.' },
        { status: 500 }
      )
    }

    const currentDecision = validateBoundApprovalDecision({
      row: decisionRows?.[0],
      agentId,
      approvalId,
    })
    if (!currentDecision || currentDecision.decision !== 'approved') {
      return NextResponse.json({ ok: false, error: 'Approval not approved' }, { status: 400 })
    }

    const { data: existingExecutionRows, error: existingExecutionError } = await supabase
      .from('agent_events')
      .select('id,agent_id,payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'execution_result')
      .eq('payload->>approval_id', approvalId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (existingExecutionError) {
      console.error('[runtime/execute] execution check error:', existingExecutionError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check execution history.' },
        { status: 500 }
      )
    }

    const alreadyExecuted = (existingExecutionRows || []).some((row) =>
      isExecutionBoundToRequest({
        row,
        agentId,
        approvalId,
        requestEventId: approvalRequest.eventId,
      })
    )
    if (alreadyExecuted) {
      return NextResponse.json({ ok: false, error: 'Already executed' }, { status: 400 })
    }

    const proposedActions = parseProposedActions(approvalRequest.payload.proposed_actions)
    if (proposedActions == null) {
      return NextResponse.json(
        { ok: false, error: 'Invalid proposed_actions' },
        { status: 400 }
      )
    }

    const parsedExecution = parseExecutionActions(proposedActions)
    if (parsedExecution.error === 'invalid_gmail') {
      return NextResponse.json({ ok: false, error: 'Invalid gmail action arguments' }, { status: 400 })
    }

    if (parsedExecution.error === 'unsupported') {
      return NextResponse.json(
        { ok: false, error: 'Unsupported runtime tool action.' },
        { status: 400 }
      )
    }

    const executionActions = parsedExecution.actions
    const hasGmailDraftAction = executionActions.some(
      (action) => action.tool === 'gmail' && action.action === 'draft_email'
    )

    const tenantId = access.tenantId
    let gmailAccessToken = ''
    let gmailRefreshToken = ''
    let gmailTokenExpiresAt: unknown = null
    if (hasGmailDraftAction) {
      const { data: connectionRow, error: connectionError } = await supabase
        .from('integration_connections')
        .select('access_token,refresh_token,expires_at')
        .eq('tenant_id', tenantId)
        .eq('provider', 'gmail')
        .maybeSingle()

      if (connectionError) {
        console.error('[runtime/execute] Gmail connection lookup error:', connectionError)
        return NextResponse.json(
          { ok: false, error: 'Failed to load Gmail connection.' },
          { status: 500 }
        )
      }

      gmailAccessToken =
        typeof connectionRow?.access_token === 'string' ? connectionRow.access_token.trim() : ''
      gmailRefreshToken =
        typeof connectionRow?.refresh_token === 'string' ? connectionRow.refresh_token.trim() : ''
      gmailTokenExpiresAt = connectionRow?.expires_at

      if (!gmailAccessToken || !gmailRefreshToken) {
        return NextResponse.json({ ok: false, error: 'Gmail not connected' }, { status: 400 })
      }
    }

    let preparedClaim
    try {
      preparedClaim = prepareDecisionWorkspaceExecutionClaim({
        tenantId,
        agentId,
        requestEventId: approvalRequest.eventId,
        workflowContext: {
          source: 'builtin_compatibility',
          ...(typeof approvalRequest.payload.session_id === 'string' &&
          approvalRequest.payload.session_id.trim()
            ? { runtime_instance_id: approvalRequest.payload.session_id.trim() }
            : {}),
        },
        actions: proposedActions.map(executionActionInput),
      })
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Approved execution metadata is invalid.' },
        { status: 400 }
      )
    }

    const claim = await claimRuntimeExecution({
      supabase,
      tenantId,
      agentId,
      actorId: access.actorId,
      approvalId,
      requestEventId: approvalRequest.eventId,
      decisionEventId: currentDecision.eventId,
      claim: preparedClaim,
    })
    if (!claim.ok) {
      console.error('[runtime/execute] execution claim failed')
      return NextResponse.json(
        { ok: false, error: claim.error },
        { status: claim.kind === 'conflict' ? 409 : 500 }
      )
    }

    if (!claim.invocationAuthorized) {
      let durableStatus = claim.status
      if (
        (claim.status === 'claimed' || claim.status === 'executing') &&
        isExpiredTimestamp(claim.leaseExpiresAt)
      ) {
        const stale = await resolveStaleRuntimeExecution({
          supabase,
          tenantId,
          executionId: claim.executionId,
          actorId: access.actorId,
        })
        if (stale.ok) durableStatus = stale.status
      }

      return NextResponse.json(
        {
          ok: false,
          error:
            durableStatus === 'indeterminate'
              ? 'Execution outcome requires reconciliation before another attempt.'
              : 'This approved request already has a durable execution claim.',
          data: {
            execution_id: claim.executionId,
            status: durableStatus,
            executed: durableStatus === 'succeeded',
          },
        },
        { status: 409 }
      )
    }

    const startAction = async (actionIndex: number) =>
      recordRuntimeExecutionActionReceipt({
        supabase,
        tenantId,
        executionId: claim.executionId,
        leaseToken: claim.leaseToken,
        actionIndex,
        expectedStatus: 'claimed',
        nextStatus: 'executing',
        actorId: access.actorId,
      })

    const completeAction = async (
      actionIndex: number,
      outcome: DecisionWorkspaceExecutionActionOutcome
    ) =>
      recordRuntimeExecutionActionReceipt({
        supabase,
        tenantId,
        executionId: claim.executionId,
        leaseToken: claim.leaseToken,
        actionIndex,
        expectedStatus: 'executing',
        nextStatus: outcome.status,
        actorId: access.actorId,
        providerReceipt: outcome.receipt,
        errorCode: outcome.errorCode,
        reconciliationStatus: outcome.reconciliationStatus,
      })

    const stopAfterOutcome = async (params: {
      actionIndex: number
      outcome: DecisionWorkspaceExecutionActionOutcome
      error: string
      status: number
    }) => {
      const recorded = await completeAction(params.actionIndex, params.outcome)
      if (!recorded.ok) {
        return NextResponse.json({ ok: false, error: recorded.error }, { status: 500 })
      }

      for (let index = params.actionIndex + 1; index < executionActions.length; index += 1) {
        const skipped = await recordRuntimeExecutionActionReceipt({
          supabase,
          tenantId,
          executionId: claim.executionId,
          leaseToken: claim.leaseToken,
          actionIndex: index,
          expectedStatus: 'claimed',
          nextStatus: 'skipped',
          actorId: access.actorId,
          errorCode: 'prior_action_not_succeeded',
        })
        if (!skipped.ok) {
          return NextResponse.json({ ok: false, error: skipped.error }, { status: 500 })
        }
      }

      const finalized = await finalizeRuntimeExecution({
        supabase,
        tenantId,
        executionId: claim.executionId,
        leaseToken: claim.leaseToken,
        actorId: access.actorId,
      })
      if (!finalized.ok) {
        return NextResponse.json({ ok: false, error: finalized.error }, { status: 500 })
      }

      return NextResponse.json(
        {
          ok: false,
          error: params.error,
          data: {
            execution_id: claim.executionId,
            status: finalized.status,
            executed: false,
          },
        },
        { status: finalized.status === 'partial' || finalized.status === 'indeterminate' ? 409 : params.status }
      )
    }

    const results: RuntimeExecutionActionResult[] = []
    let draftId: string | null = null
    let messageId: string | null = null
    let gmailTokenRefreshed = false

    for (const [actionIndex, action] of executionActions.entries()) {
      const started = await startAction(actionIndex)
      if (!started.ok) {
        return NextResponse.json({ ok: false, error: started.error }, { status: 500 })
      }

      if (action.tool === 'sandbox') {
        const result = simulateSandboxAction(action.action)
        const completed = await completeAction(actionIndex, {
          status: 'succeeded',
          receipt: sanitizeDecisionWorkspaceProviderReceipt({
            provider_type: 'sandbox',
            operation: action.action.action,
            simulated: true,
          }),
          errorCode: null,
          reconciliationStatus: 'not_required',
        })
        if (!completed.ok) {
          return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
        }
        results.push(result)
        continue
      }

      if (action.action === 'draft_email') {
        if (isExpiredTimestamp(gmailTokenExpiresAt) && !gmailTokenRefreshed) {
          const clientId = process.env.GOOGLE_CLIENT_ID
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET
          if (!clientId || !clientSecret) {
            return stopAfterOutcome({
              actionIndex,
              outcome: classifyGmailDraftExecution({
                phase: 'pre_dispatch_failure',
                errorCode: 'gmail_draft_credentials_unavailable',
              }),
              error: 'Gmail draft execution prerequisites are unavailable.',
              status: 500,
            })
          }

          const refreshedToken = await refreshGmailAccessToken({
            refreshToken: gmailRefreshToken,
            clientId,
            clientSecret,
          })
          if (!refreshedToken) {
            return stopAfterOutcome({
              actionIndex,
              outcome: classifyGmailDraftExecution({
                phase: 'pre_dispatch_failure',
                errorCode: 'gmail_draft_token_refresh_failed',
              }),
              error: 'Failed to refresh Gmail access token.',
              status: 500,
            })
          }

          gmailAccessToken = refreshedToken.accessToken
          gmailTokenExpiresAt = refreshedToken.expiresAt
          gmailTokenRefreshed = true
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
            return stopAfterOutcome({
              actionIndex,
              outcome: classifyGmailDraftExecution({
                phase: 'pre_dispatch_failure',
                errorCode: 'gmail_draft_token_persistence_failed',
              }),
              error: 'Failed to persist refreshed Gmail token.',
              status: 500,
            })
          }
        }

        const draft = await createGmailDraft({
          accessToken: gmailAccessToken,
          to: action.args.to,
          subject: action.args.subject,
          body: action.args.body,
        })

        if (draft.outcome.status !== 'succeeded' || !draft.draftId || !draft.messageId) {
          return stopAfterOutcome({
            actionIndex,
            outcome: draft.outcome,
            error:
              draft.outcome.status === 'indeterminate'
                ? 'Gmail draft outcome requires reconciliation before another attempt.'
                : 'Failed to create Gmail draft.',
            status: 500,
          })
        }

        draftId = draft.draftId
        messageId = draft.messageId
        const completed = await completeAction(actionIndex, draft.outcome)
        if (!completed.ok) {
          return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
        }
        results.push({
          tool: 'gmail',
          action: 'draft_email',
          success: true,
          draft_id: draft.draftId,
          message_id: draft.messageId,
        })
        continue
      }

      if (action.action === 'review_sender_cluster') {
        const review = await reviewGmailSenderClusterForTenant({
          supabase,
          tenantId,
          sender: action.args.sender,
          logPrefix: '[runtime/execute]',
        })

        if (!review.ok) {
          return stopAfterOutcome({
            actionIndex,
            outcome: {
              status: 'failed',
              receipt: null,
              errorCode: 'gmail_sender_review_failed',
              reconciliationStatus: 'not_required',
            },
            error: review.error,
            status: review.status,
          })
        }

        const completed = await completeAction(actionIndex, {
          status: 'succeeded',
          receipt: sanitizeDecisionWorkspaceProviderReceipt({
            provider_type: 'gmail',
            operation: 'review_sender_cluster',
            sender: action.args.sender,
          }),
          errorCode: null,
          reconciliationStatus: 'not_required',
        })
        if (!completed.ok) {
          return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
        }

        results.push({
          tool: 'gmail',
          action: 'review_sender_cluster',
          success: true,
          sender_review: review.data,
        })
        continue
      }

      if (action.action === 'review_query_cluster') {
        const queryReview = await reviewGmailQueryClusterForTenant({
          supabase,
          tenantId,
          clusterId: action.args.cluster_id,
          clusterType: action.args.cluster_type,
          title: action.args.title,
          query: action.args.query,
          estimatedCount: action.args.estimated_count ?? null,
          riskNote: action.args.risk_note ?? null,
          safetyNote: action.args.safety_note ?? null,
          logPrefix: '[runtime/execute]',
        })

        if (!queryReview.ok) {
          return stopAfterOutcome({
            actionIndex,
            outcome: {
              status: 'failed',
              receipt: null,
              errorCode: 'gmail_query_review_failed',
              reconciliationStatus: 'not_required',
            },
            error: queryReview.error,
            status: queryReview.status,
          })
        }

        const completed = await completeAction(actionIndex, {
          status: 'succeeded',
          receipt: sanitizeDecisionWorkspaceProviderReceipt({
            provider_type: 'gmail',
            operation: 'review_query_cluster',
            cluster_id: action.args.cluster_id,
            cluster_type: action.args.cluster_type,
          }),
          errorCode: null,
          reconciliationStatus: 'not_required',
        })
        if (!completed.ok) {
          return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
        }

        results.push({
          tool: 'gmail',
          action: 'review_query_cluster',
          success: true,
          query_review: queryReview.data,
        })
        continue
      }

      if (action.action === 'archive_messages') {
        let resolvedMessageIds = action.args.message_ids || []
        if (
          resolvedMessageIds.length === 0 &&
          action.args.cluster_id &&
          action.args.cluster_type &&
          action.args.title &&
          action.args.query &&
          action.args.sender_policies
        ) {
          const resolved = await resolveGmailSenderPolicyArchiveScopeForTenant({
            supabase,
            tenantId,
            analysisScope: normalizeMailboxProfileScope(action.args.analysis_scope),
            clusters:
              action.args.clusters && action.args.clusters.length > 0
                ? action.args.clusters
                : [
                    {
                      cluster_id: action.args.cluster_id,
                      cluster_type: action.args.cluster_type,
                      title: action.args.title,
                      query: action.args.query,
                    },
                  ],
            selectedCluster: {
              cluster_id: action.args.cluster_id,
              cluster_type: action.args.cluster_type,
              title: action.args.title,
              query: action.args.query,
            },
            senderPolicies: action.args.sender_policies,
            messageOverrides: action.args.message_overrides,
          })

          if (!resolved.ok) {
            return stopAfterOutcome({
              actionIndex,
              outcome: {
                status: 'failed',
                receipt: null,
                errorCode: 'gmail_archive_scope_resolution_failed',
                reconciliationStatus: 'not_required',
              },
              error: resolved.error,
              status: resolved.status,
            })
          }
          resolvedMessageIds = resolved.data.messageIds
        }

        const archive = await archiveGmailMessagesForTenant({
          supabase,
          tenantId,
          messageIds: resolvedMessageIds,
          sender: action.args.sender ?? null,
          batchTitle:
            action.args.batch_title ??
            action.args.source_label ??
            action.args.title ??
            null,
          logPrefix: '[runtime/execute]',
        })

        if (!archive.ok) {
          const ambiguous = archive.status >= 500
          return stopAfterOutcome({
            actionIndex,
            outcome: {
              status: ambiguous ? 'indeterminate' : 'failed',
              receipt: null,
              errorCode: ambiguous
                ? 'gmail_archive_outcome_indeterminate'
                : 'gmail_archive_precondition_failed',
              reconciliationStatus: ambiguous ? 'manual_required' : 'not_required',
            },
            error: ambiguous
              ? 'Gmail archive outcome requires reconciliation before another attempt.'
              : archive.error,
            status: archive.status,
          })
        }

        const archiveOutcome = classifyGmailArchiveExecution(archive.data)
        if (archiveOutcome.status !== 'succeeded') {
          return stopAfterOutcome({
            actionIndex,
            outcome: archiveOutcome,
            error: 'Gmail archived only part of the approved message scope.',
            status: 409,
          })
        }

        const completed = await completeAction(actionIndex, archiveOutcome)
        if (!completed.ok) {
          return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
        }

        results.push({
          tool: 'gmail',
          action: 'archive_messages',
          success: true,
          archive_result: archive.data,
        })
        continue
      }

      const analysis = await analyzeGmailInboxForTenant({
        supabase,
        tenantId,
        logPrefix: '[runtime/execute]',
      })

      if (!analysis.ok) {
        return stopAfterOutcome({
          actionIndex,
          outcome: {
            status: 'failed',
            receipt: null,
            errorCode: 'gmail_inbox_analysis_failed',
            reconciliationStatus: 'not_required',
          },
          error: analysis.error,
          status: analysis.status,
        })
      }

      const completed = await completeAction(actionIndex, {
        status: 'succeeded',
        receipt: sanitizeDecisionWorkspaceProviderReceipt({
          provider_type: 'gmail',
          operation: 'analyze_inbox',
          completed: true,
        }),
        errorCode: null,
        reconciliationStatus: 'not_required',
      })
      if (!completed.ok) {
        return NextResponse.json({ ok: false, error: completed.error }, { status: 500 })
      }

      results.push({
        tool: 'gmail',
        action: 'analyze_inbox',
        success: true,
        inbox_analysis: analysis.data,
      })
    }

    const executedAt = new Date().toISOString()
    const executionPayload: RuntimeExecutionResultPayload = {
      approval_id: approvalId,
      actor_id: access.actorId,
      tenant_id: access.tenantId,
      request_event_id: approvalRequest.eventId,
      decision_event_id: currentDecision.eventId,
      results,
      executed_at: executedAt,
      success: true,
      status: 'succeeded',
      ...(draftId && messageId
        ? {
            tool: 'gmail' as const,
            action: 'draft_email' as const,
            draft_id: draftId,
            message_id: messageId,
          }
        : {}),
    }

    const finalized = await finalizeRuntimeExecution({
      supabase,
      tenantId,
      executionId: claim.executionId,
      leaseToken: claim.leaseToken,
      actorId: access.actorId,
      compatibilityPayload: executionPayload,
    })
    if (!finalized.ok || finalized.status !== 'succeeded') {
      console.error('[runtime/execute] successful action receipts could not be finalized')
      return NextResponse.json(
        { ok: false, error: finalized.ok ? 'Execution did not finalize successfully.' : finalized.error },
        { status: 500 }
      )
    }

    if (draftId) {
      return NextResponse.json({
        ok: true,
        data: {
          execution_id: claim.executionId,
          status: finalized.status,
          executed: true,
          draft_id: draftId,
          results,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        execution_id: claim.executionId,
        status: finalized.status,
        executed: true,
        results,
      },
    })
  } catch (err) {
    console.error('[runtime/execute] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/execute.' },
      { status: 500 }
    )
  }
}
