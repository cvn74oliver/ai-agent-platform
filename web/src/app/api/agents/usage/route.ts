import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type UsageRow = {
  origin: string | null
  total_tokens: number | null
  approx_human_minutes: string | null
  started_at: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { agent_id } = body as { agent_id?: string }

    if (!agent_id) {
      return NextResponse.json(
        { ok: false, error: 'agent_id is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // Look back 30 days for now
    const now = new Date()
    const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const from7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('agent_sessions')
      .select('origin, total_tokens, approx_human_minutes, started_at')
      .eq('agent_id', agent_id)
      .gte('started_at', from30)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('[agents/usage] Supabase error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to load usage stats.' },
        { status: 500 }
      )
    }

    const rows: UsageRow[] = (data || []) as UsageRow[]

    function aggregate(fromIso: string) {
      const from = new Date(fromIso).getTime()

      let sessions = 0
      let playgroundSessions = 0
      let totalTokens = 0
      let humanMinutes = 0

      for (const row of rows) {
        const ts = new Date(row.started_at).getTime()
        if (ts < from) continue

        sessions += 1
        if (row.origin === 'playground') {
          playgroundSessions += 1
        }

        if (typeof row.total_tokens === 'number') {
          totalTokens += row.total_tokens
        }
        if (row.approx_human_minutes != null) {
          const mins = parseFloat(row.approx_human_minutes)
          if (!Number.isNaN(mins)) {
            humanMinutes += mins
          }
        }
      }

      return {
        sessions,
        playground_sessions: playgroundSessions,
        total_tokens: totalTokens,
        approx_human_minutes: parseFloat(humanMinutes.toFixed(2)),
      }
    }

    const last_30_days = aggregate(from30)
    const last_7_days = aggregate(from7)

    return NextResponse.json({
      ok: true,
      data: {
        last_7_days,
        last_30_days,
      },
    })
  } catch (err) {
    console.error('[agents/usage] Unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in /api/agents/usage.' },
      { status: 500 }
    )
  }
}