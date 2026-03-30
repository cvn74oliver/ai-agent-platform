import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  loadGmailDecisionManagementSummary,
  loadGmailMonitoringSummary,
  persistGmailCleanupMemory,
} from '@/lib/runtime/gmailCleanupMemory'
import {
  buildGmailCleanupWorkflowClusterPayload,
  type GmailCleanupMemoryWritePayload,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { isUuid } from '@/lib/runtime/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function normalizeCluster(
  value: unknown
): GmailCleanupMemoryWritePayload['cluster'] {
  if (
    !isRecord(value) ||
    typeof value.clusterId !== 'string' ||
    typeof value.clusterType !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.query !== 'string'
  ) {
    return null
  }

  return buildGmailCleanupWorkflowClusterPayload({
    cluster: {
      clusterId: normalizeText(value.clusterId),
      canonicalClusterId: normalizeText(value.canonicalClusterId) || null,
      legacyClusterIds: normalizeStringArray(value.legacyClusterIds),
      sourceClusterIds: normalizeStringArray(value.sourceClusterIds),
      clusterType: normalizeText(value.clusterType),
      title: normalizeText(value.title),
      query: normalizeText(value.query),
    },
    reviewUnitKey: normalizeText(value.reviewUnitKey) || null,
  })
}

function parseBody(value: unknown): GmailCleanupMemoryWritePayload | null {
  if (!isRecord(value)) return null
  const agentId = typeof value.agentId === 'string' ? value.agentId.trim() : ''
  if (!agentId) return null
  const sessionId =
    typeof value.sessionId === 'string' && value.sessionId.trim() ? value.sessionId.trim() : null

  const cluster = normalizeCluster(value.cluster)

  if (!isRecord(value.action) || typeof value.action.type !== 'string') return null

  if (value.action.type === 'sender_policy_set' || value.action.type === 'sender_policy_removed') {
    if (
      typeof value.action.senderKey !== 'string' ||
      typeof value.action.sender !== 'string' ||
      typeof value.action.policy !== 'string'
    ) {
      return null
    }
    const policy =
      value.action.policy === 'undecided' ||
      value.action.policy === 'keep' ||
      value.action.policy === 'archive' ||
      value.action.policy === 'quarantine' ||
      value.action.policy === 'unsubscribe' ||
      value.action.policy === 'custom_rule'
        ? value.action.policy
        : null
    if (!policy) return null
    return {
      agentId,
      sessionId,
      cluster,
      action: {
        type: value.action.type,
        senderKey: value.action.senderKey.trim(),
        sender: value.action.sender.trim(),
        policy,
      },
    }
  }

  if (value.action.type === 'rule_intent_set' || value.action.type === 'rule_intent_removed') {
    if (
      typeof value.action.senderKey !== 'string' ||
      typeof value.action.sender !== 'string' ||
      typeof value.action.intentType !== 'string' ||
      typeof value.action.label !== 'string' ||
      typeof value.action.description !== 'string'
    ) {
      return null
    }
    return {
      agentId,
      sessionId,
      cluster,
      action: {
        type: value.action.type,
        senderKey: value.action.senderKey.trim(),
        sender: value.action.sender.trim(),
        intentType: value.action.intentType as
          | 'keep'
          | 'quarantine'
          | 'unsubscribe'
          | 'custom_rule',
        label: value.action.label.trim(),
        description: value.action.description.trim(),
      },
    }
  }

  if (value.action.type === 'destination_commit') {
    if (!Array.isArray(value.action.senders) || value.action.senders.length === 0) return null
    const senders = value.action.senders
      .filter(
        (
          entry
        ): entry is {
          senderKey: string
          sender: string
          destinationState: 'KEEP' | 'ARCHIVE' | 'QUARANTINE' | 'UNSUBSCRIBE' | 'CUSTOM_RULE'
          source: string
          reason: string
          messageCount?: number | null
          trustSignals?: Record<string, unknown> | null
        } =>
          isRecord(entry) &&
          typeof entry.senderKey === 'string' &&
          typeof entry.sender === 'string' &&
          typeof entry.destinationState === 'string' &&
          typeof entry.source === 'string' &&
          typeof entry.reason === 'string'
      )
      .map((entry) => ({
        senderKey: entry.senderKey.trim(),
        sender: entry.sender.trim(),
        destinationState: entry.destinationState,
        source: entry.source.trim(),
        reason: entry.reason.trim(),
        messageCount:
          typeof entry.messageCount === 'number' && Number.isFinite(entry.messageCount)
            ? entry.messageCount
            : null,
        trustSignals: isRecord(entry.trustSignals) ? entry.trustSignals : null,
      }))
      .filter(
        (entry) =>
          entry.senderKey &&
          entry.sender &&
          entry.source &&
          entry.reason &&
          (entry.destinationState === 'KEEP' ||
            entry.destinationState === 'ARCHIVE' ||
            entry.destinationState === 'QUARANTINE' ||
            entry.destinationState === 'UNSUBSCRIBE' ||
            entry.destinationState === 'CUSTOM_RULE')
      )

    if (senders.length === 0) return null

    return {
      agentId,
      sessionId,
      cluster,
      action: {
        type: 'destination_commit',
        senders,
      },
    }
  }

  if (value.action.type === 'destination_state_clear') {
    if (
      typeof value.action.senderKey !== 'string' ||
      typeof value.action.sender !== 'string' ||
      typeof value.action.reason !== 'string'
    ) {
      return null
    }
    return {
      agentId,
      sessionId,
      cluster,
      action: {
        type: 'destination_state_clear',
        senderKey: value.action.senderKey.trim(),
        sender: value.action.sender.trim(),
        reason: value.action.reason.trim(),
      },
    }
  }

  return null
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agent_id')?.trim() || ''
    if (!agentId || !isUuid(agentId)) {
      return NextResponse.json({ ok: false, error: 'agent_id is required.' }, { status: 400 })
    }

    const sendersRaw = url.searchParams.get('senders')
    const parsedSenders = sendersRaw ? JSON.parse(sendersRaw) : []
    const candidateSenders = Array.isArray(parsedSenders)
      ? parsedSenders
          .filter(
            (entry): entry is { senderKey: string; sender: string } =>
              isRecord(entry) &&
              typeof entry.senderKey === 'string' &&
              typeof entry.sender === 'string'
          )
          .map((entry) => ({
            senderKey: entry.senderKey.trim(),
            sender: entry.sender.trim(),
          }))
      : []

    const supabase = await getSupabaseAdmin()
    const requestedView = url.searchParams.get('view')?.trim() || 'monitoring'
    const summary =
      requestedView === 'decision_management'
        ? await loadGmailDecisionManagementSummary({
            supabase,
            agentId,
          })
        : await loadGmailMonitoringSummary({
            supabase,
            agentId,
            clusterId: url.searchParams.get('cluster_id'),
            clusterTitle: url.searchParams.get('cluster_title'),
            candidateSenders,
          })

    if (!summary.ok) {
      return NextResponse.json({ ok: false, error: summary.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: summary.data })
  } catch (error) {
    console.error('[runtime/gmail-memory] GET failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to load Gmail cleanup monitoring summary.' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = parseBody(await req.json().catch(() => null))
    if (!body || !isUuid(body.agentId)) {
      return NextResponse.json(
        { ok: false, error: 'Valid Gmail cleanup memory payload required.' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const result = await persistGmailCleanupMemory({
      supabase,
      agentId: body.agentId,
      payload: body,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[runtime/gmail-memory] POST failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to store Gmail cleanup memory.' },
      { status: 500 }
    )
  }
}
