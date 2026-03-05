import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isUuid } from '@/lib/runtime/types'
import type { RuntimeConfidenceActionSummary } from '@/lib/runtime/types'

const CONFIDENCE_THRESHOLD = 10

type AgentEventRow = {
  payload: unknown
}

type ConfidenceAggregate = {
  tool: string
  action: string
  maxPayloadCount: number | null
  fallbackRowCount: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value
  return isRecord(parsed) ? parsed : null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agent_id')?.trim() || ''

    if (!agentId) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    if (!isUuid(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'agent_id must be a valid UUID' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from('agent_events')
      .select('payload')
      .eq('agent_id', agentId)
      .eq('event_type', 'confidence_update')
      .eq('payload->>decision', 'approved')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (error) {
      console.error('[runtime/confidence] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to load confidence data.' },
        { status: 500 }
      )
    }

    const grouped = new Map<string, ConfidenceAggregate>()
    for (const row of (data || []) as AgentEventRow[]) {
      try {
        const payload = parsePayload(row.payload)
        if (!payload) continue

        const tool = typeof payload.tool === 'string' ? payload.tool.trim() : ''
        const action = typeof payload.action === 'string' ? payload.action.trim() : ''
        if (!tool || !action) continue

        const key = `${tool}::${action}`
        const payloadCount = toNumber(payload.new_count)
        const current = grouped.get(key) ?? {
          tool,
          action,
          maxPayloadCount: null,
          fallbackRowCount: 0,
        }

        if (payloadCount != null) {
          current.maxPayloadCount =
            current.maxPayloadCount == null
              ? payloadCount
              : Math.max(current.maxPayloadCount, payloadCount)
        } else {
          current.fallbackRowCount += 1
        }

        grouped.set(key, current)
      } catch {
        continue
      }
    }

    const actions: RuntimeConfidenceActionSummary[] = Array.from(grouped.values()).map(
      (entry) => {
        const approvedCount =
          entry.maxPayloadCount != null ? entry.maxPayloadCount : entry.fallbackRowCount

        return {
          tool: entry.tool,
          action: entry.action,
          approved_count: approvedCount,
          threshold: CONFIDENCE_THRESHOLD,
          eligible_auto: approvedCount >= CONFIDENCE_THRESHOLD,
        }
      }
    )

    return NextResponse.json({
      ok: true,
      data: {
        actions,
      },
    })
  } catch (err) {
    console.error('[runtime/confidence] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/runtime/confidence.' },
      { status: 500 }
    )
  }
}
