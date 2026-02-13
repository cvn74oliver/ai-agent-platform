'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/app/components/DashboardLayout'


type Metrics = {
  totalAgents: number
  avgQuality: number | null
  totalTrainingExamples: number
  last7Sessions: number
  last7Tokens: number
  last7CostUsd: number
  topAgentName: string | null
  lowQualityAgents: number
}

function prettyAgentTitle(raw: string | null): string {
  if (!raw) return '—'

  const s = String(raw).trim()
  if (!s) return '—'

  const lowered = s.toLowerCase()

  // Prefer common role-style names (avoid showing paragraph-like titles)
  const roleMatchers: Array<[RegExp, string]> = [
    [/customer\s*support/i, 'Customer Support Agent'],
    [/support\s*agent/i, 'Customer Support Agent'],
    [/operations\s*assistant/i, 'Operations Assistant'],
    [/mushroom\s*growing\s*coach/i, 'Mushroom Growing Coach'],
    [/mushroom\s*coach/i, 'Mushroom Growing Coach'],
    [/mushroom\s*growing/i, 'Mushroom Growing Coach'],
    [/superstar\s*mushroom\s*grower/i, 'Superstar Mushroom Grower'],
  ]

  for (const [re, label] of roleMatchers) {
    if (re.test(s)) return label
  }

  // If the stored name is an entire sentence/paragraph, pick a compact fallback.
  // Try to extract a short, role-ish phrase from the beginning.
  const words = s
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .split(' ')
    .filter(Boolean)

  // Avoid returning the common long boilerplate phrase.
  if (lowered.startsWith('curative mushrooms provides') || lowered.startsWith('the company is')) {
    return 'Mushroom Growing Coach'
  }

  // Generic short title fallback (max 6 words)
  const short = words.slice(0, 6).join(' ')
  // If it's still huge (e.g., one giant token), keep it safe.
  if (short.length > 60) return 'AI Agent'
  return short
}

export default function Dashboard() {
  const supabase = createClient()

  const [email, setEmail] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ company: '', tone: '', goal: '' })

  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const last7Label = useMemo(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d.toLocaleDateString()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadUserData() {
      try {
        setMetricsLoading(true)
        setMetricsError(null)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setEmail(null)
          return
        }

        if (!cancelled) setEmail(user.email ?? null)

        // Onboarding data (profile)
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('onboarding_data')
          .eq('id', user.id)
          .single()

        if (!cancelled) {
          if (!profileErr && profileRow?.onboarding_data) {
            setOnboarding(profileRow.onboarding_data)
            setFormData(profileRow.onboarding_data)
          } else {
            setOnboarding(null)
          }
        }

        const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        // Agents
        const { data: agentRows, error: agentsErr } = await supabase
          .from('agents')
          .select('id,name,quality_score')
          .eq('user_id', user.id)

        if (agentsErr) throw agentsErr

        const agents = (agentRows || []) as any[]
        const totalAgents = agents.length

        const qualityVals = agents
          .map((a) => (typeof a.quality_score === 'number' ? a.quality_score : null))
          .filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 10)

        const avgQuality =
          qualityVals.length > 0
            ? qualityVals.reduce((a, b) => a + b, 0) / qualityVals.length
            : null

        const lowQualityAgents = agents.filter(
          (a) => typeof a.quality_score === 'number' && a.quality_score < 8
        ).length

        // Training examples
        const agentIds = agents.map((a) => a.id).filter(Boolean)

        let totalTrainingExamples = 0

        if (agentIds.length > 0) {
          const { count: trainingCount, error: trainingErr } = await supabase
            .from('fine_tune_examples')
            .select('id', { count: 'exact', head: true })
            .in('agent_id', agentIds)

          if (trainingErr) throw trainingErr
          totalTrainingExamples = trainingCount ?? 0
        } else {
          // Fallback if user has no agents
          const { count: trainingCount, error: trainingErr } = await supabase
            .from('fine_tune_examples')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (trainingErr) throw trainingErr
          totalTrainingExamples = trainingCount ?? 0
        }

        // Sessions (last 7 days)
        const agentIdsForSessions = agents.map((a) => a.id).filter(Boolean)

        let sessions: any[] = []
        if (agentIdsForSessions.length > 0) {
          const { data: sessionRows, error: sessionsErr } = await supabase
            .from('agent_sessions')
            .select('agent_id,total_tokens,total_cost_cents,started_at')
            .in('agent_id', agentIdsForSessions)
            .gte('started_at', sinceIso)

          if (sessionsErr) throw sessionsErr
          sessions = (sessionRows || []) as any[]
        }

        const last7Sessions = sessions.length
        const last7Tokens = sessions.reduce(
          (acc, s) => acc + (typeof s.total_tokens === 'number' ? s.total_tokens : 0),
          0
        )
        const last7CostCents = sessions.reduce(
          (acc, s) => acc + (typeof s.total_cost_cents === 'number' ? s.total_cost_cents : 0),
          0
        )
        const last7CostUsd = (last7CostCents || 0) / 100

        // Most active agent
        const countsByAgent: Record<string, number> = {}
        for (const s of sessions) {
          const aid = s.agent_id
          if (!aid) continue
          countsByAgent[aid] = (countsByAgent[aid] || 0) + 1
        }

        let topAgentId: string | null = null
        let topCount = 0
        for (const [aid, c] of Object.entries(countsByAgent)) {
          if (c > topCount) {
            topCount = c
            topAgentId = aid
          }
        }

        const rawTopAgentName = topAgentId
          ? (agents.find((a) => a.id === topAgentId)?.name as string | undefined) || null
          : null

        const topAgentName = rawTopAgentName ? prettyAgentTitle(rawTopAgentName) : null

        const next: Metrics = {
          totalAgents,
          avgQuality,
          totalTrainingExamples,
          last7Sessions,
          last7Tokens,
          last7CostUsd,
          topAgentName,
          lowQualityAgents,
        }

        if (!cancelled) setMetrics(next)
      } catch (e: any) {
        console.error('[dashboard] loadUserData failed:', e)
        if (!cancelled) {
          setMetrics(null)
          setMetricsError(e?.message || 'Failed to load dashboard data')
        }
      } finally {
        if (!cancelled) setMetricsLoading(false)
      }
    }

    loadUserData()

    return () => {
      cancelled = true
    }
  }, [supabase])

  async function saveChanges() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_data: formData })
      .eq('id', user.id)

    if (!error) {
      setOnboarding(formData)
      setEditing(false)
    }
  }

  if (!email)
    return (
      <div className="p-10 text-center text-white bg-gray-900 h-screen">
        Loading or not signed in… <a href="/login">Login</a>
      </div>
    )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Welcome back, {email}</h2>
        <p className="text-xs text-gray-400">
          Snapshot analytics across your agents, training data, and recent usage.
        </p>
      </div>

      {metricsLoading && (
        <p className="mt-4 text-xs text-gray-400">Loading dashboard metrics…</p>
      )}

      {metricsError && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
          <p className="text-xs text-red-200">{metricsError}</p>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Total Agents</p>
              <p className="text-2xl font-bold text-white">{Number(metrics.totalAgents ?? 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">All agents in your workspace.</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Avg Quality Score</p>
              <p className="text-2xl font-bold text-white">
                {typeof metrics.avgQuality === 'number' ? metrics.avgQuality.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Based on agents with a 0–10 stored quality score.
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Training Examples</p>
              <p className="text-2xl font-bold text-white">
                {Number(metrics.totalTrainingExamples ?? 0)}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">All fine-tune examples logged.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Last 7 Days Sessions</p>
              <p className="text-2xl font-bold text-white">{Number(metrics.last7Sessions ?? 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">Since {last7Label}.</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Last 7 Days Tokens</p>
              <p className="text-2xl font-bold text-white">
                {Number.isFinite(Number(metrics.last7Tokens))
                  ? Number(metrics.last7Tokens).toLocaleString()
                  : '0'}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Est. cost: ${
                  Number.isFinite(Number(metrics.last7CostUsd))
                    ? Number(metrics.last7CostUsd).toFixed(5)
                    : '0.00000'
                }
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <p className="text-xs text-gray-400">Needs Quality Work</p>
              <p className="text-2xl font-bold text-white">{Number(metrics.lowQualityAgents ?? 0)}</p>
              <p className="text-[11px] text-gray-500 mt-1">Agents below 8/10 quality.</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-800 p-4 rounded-xl shadow-xl">
            <p className="text-xs text-gray-400">Most Active Agent (Last 7 Days)</p>
            <p className="text-lg font-semibold text-white mt-1">
              {prettyAgentTitle(metrics.topAgentName)}
            </p>
            {metrics.topAgentName && metrics.topAgentName !== prettyAgentTitle(metrics.topAgentName) && (
              <p className="text-[11px] text-gray-500 mt-1">
                Raw: <span className="font-mono">{metrics.topAgentName}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              We’ll expand this into per-agent charts + drilldowns next.
            </p>
          </div>
        </>
      )}

      {!onboarding && (
        <p className="text-gray-400 mt-6">
          You haven’t completed onboarding yet.{' '}
          <a href="/onboarding" className="text-blue-400 underline">
            Click here
          </a>{' '}
          to begin.
        </p>
      )}

      {onboarding && !editing && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl mt-6 max-w-lg">
          <h3 className="text-xl font-semibold mb-4">Your Onboarding Data</h3>
          <p>
            <b>Company:</b> {onboarding.company}
          </p>
          <p>
            <b>Tone:</b> {onboarding.tone}
          </p>
          <p>
            <b>Goal:</b> {onboarding.goal}
          </p>

          <button
            onClick={() => setEditing(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white"
          >
            Edit
          </button>
        </div>
      )}

      {editing && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-xl mt-6 max-w-lg">
          <h3 className="text-xl font-semibold mb-4">Edit Onboarding Data</h3>

          <label className="block mb-2">Company</label>
          <input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full p-3 rounded text-black mb-4"
          />

          <label className="block mb-2">Tone</label>
          <input
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full p-3 rounded text-black mb-4"
          />

          <label className="block mb-2">Goal</label>
          <input
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="w-full p-3 rounded text-black mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={saveChanges}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}