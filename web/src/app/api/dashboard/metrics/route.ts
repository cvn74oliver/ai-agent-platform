

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Dashboard metrics API
// NOTE: This route currently aggregates metrics across all agents in the project.
// If/when you add multi-tenant scoping, filter queries by tenant_id and/or user_id.

type DashboardMetrics = {
  total_agents: number
  avg_quality_score: number | null
  training_examples: number
  last_7_days_sessions: number
  last_7_days_tokens: number
  needs_quality_work: number
  most_active_agent_id: string | null
  most_active_agent_sessions: number
  window_days: number
  generated_at: string
}

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

function toIsoDaysAgo(days: number) {
  const ms = Math.max(0, days) * 24 * 60 * 60 * 1000
  return new Date(Date.now() - ms).toISOString()
}

async function computeMetrics(days: number): Promise<DashboardMetrics> {
  const supabase = await getSupabaseAdmin()
  const windowDays = Number.isFinite(days) ? Math.max(1, Math.min(90, Math.floor(days))) : 7
  const sinceIso = toIsoDaysAgo(windowDays)

  // 1) Total agents
  const { count: agentsCount, error: agentsCountErr } = await supabase
    .from('agents')
    .select('id', { count: 'exact', head: true })

  if (agentsCountErr) {
    console.error('[dashboard/metrics] agents count error:', agentsCountErr)
  }

  // 2) Avg quality score (simple JS average; OK for now, optimize with SQL later)
  const { data: qRows, error: qErr } = await supabase
    .from('agents')
    .select('quality_score')
    .limit(5000)

  if (qErr) {
    console.error('[dashboard/metrics] quality_score load error:', qErr)
  }

  const scores = (qRows || [])
    .map((r: any) => (typeof r?.quality_score === 'number' ? r.quality_score : null))
    .filter((v: number | null): v is number => typeof v === 'number')

  const avgQuality = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null

  // 3) Training examples logged
  const { count: examplesCount, error: exErr } = await supabase
    .from('fine_tune_examples')
    .select('id', { count: 'exact', head: true })

  if (exErr) {
    console.error('[dashboard/metrics] fine_tune_examples count error:', exErr)
  }

  // 4) Sessions + tokens in last N days (agent_sessions)
  const { data: sessionRows, error: sessErr } = await supabase
    .from('agent_sessions')
    .select('agent_id,total_tokens,started_at')
    .gte('started_at', sinceIso)
    .limit(10000)

  if (sessErr) {
    console.error('[dashboard/metrics] agent_sessions load error:', sessErr)
  }

  const lastSessions = sessionRows || []
  const lastSessionsCount = lastSessions.length
  const lastTokens = lastSessions.reduce((acc: number, s: any) => {
    const t = typeof s?.total_tokens === 'number' ? s.total_tokens : 0
    return acc + t
  }, 0)

  // 5) Most active agent by sessions in the window
  const countsByAgent: Record<string, number> = {}
  for (const s of lastSessions) {
    const id = typeof s?.agent_id === 'string' ? s.agent_id : null
    if (!id) continue
    countsByAgent[id] = (countsByAgent[id] || 0) + 1
  }

  let mostActiveAgentId: string | null = null
  let mostActiveCount = 0
  for (const [agentId, c] of Object.entries(countsByAgent)) {
    if (c > mostActiveCount) {
      mostActiveCount = c
      mostActiveAgentId = agentId
    }
  }

  // 6) Needs quality work
  // Define “needs” as < 8 OR null
  const { data: qualityAllRows, error: qAllErr } = await supabase
    .from('agents')
    .select('quality_score')
    .limit(5000)

  if (qAllErr) {
    console.error('[dashboard/metrics] agents quality_score re-load error:', qAllErr)
  }

  const needsQuality = (qualityAllRows || []).reduce((acc: number, r: any) => {
    const v = r?.quality_score
    if (typeof v !== 'number') return acc + 1
    return v < 8 ? acc + 1 : acc
  }, 0)

  return {
    total_agents: agentsCount ?? 0,
    avg_quality_score: avgQuality,
    training_examples: examplesCount ?? 0,
    last_7_days_sessions: lastSessionsCount,
    last_7_days_tokens: lastTokens,
    needs_quality_work: needsQuality,
    most_active_agent_id: mostActiveAgentId,
    most_active_agent_sessions: mostActiveCount,
    window_days: windowDays,
    generated_at: new Date().toISOString(),
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const days = typeof body?.days === 'number' ? body.days : 7

    const metrics = await computeMetrics(days)
    return json({ ok: true, data: metrics })
  } catch (err: any) {
    console.error('[dashboard/metrics] POST error:', err)
    return json({ ok: false, error: String(err?.message || err) }, 500)
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? Number(daysParam) : 7

    const metrics = await computeMetrics(days)
    return json({ ok: true, data: metrics })
  } catch (err: any) {
    console.error('[dashboard/metrics] GET error:', err)
    return json({ ok: false, error: String(err?.message || err) }, 500)
  }
}