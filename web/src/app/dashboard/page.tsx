'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { appButtonClassName } from '@/components/ui/app-button'
import MetricCard from '@/components/ui/metric-card'
import PageHeader from '@/components/ui/page-header'
import StatePanel from '@/components/ui/state-panel'
import SurfaceCard from '@/components/ui/surface-card'
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
  if (short.length > 60) return 'Automata'
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <StatePanel
          tone="warning"
          title="Loading or not signed in"
          description="Open login if your workspace session does not restore automatically."
          className="max-w-md"
        >
          <Link href="/login" className={appButtonClassName({ variant: 'secondary', size: 'md' })}>
            Login
          </Link>
        </StatePanel>
      </div>
    )

  return (
    <DashboardLayout>
      <div className="app-page-stack">
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome back, ${email}`}
          description="Snapshot analytics across your agents, training data, and recent usage."
          tone="hero"
          actions={
            !onboarding ? (
              <Link href="/onboarding" className={appButtonClassName({ variant: 'primary', size: 'md' })}>
                Start Onboarding
              </Link>
            ) : undefined
          }
        />

        {metricsLoading ? (
          <StatePanel
            tone="accent"
            title="Loading dashboard metrics"
            description="Refreshing agent, training, and session summaries for this workspace."
          />
        ) : null}

        {metricsError ? (
          <StatePanel tone="danger" title="Dashboard metrics could not load" description={metricsError} />
        ) : null}

        {metrics ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                title="Total Agents"
                value={Number(metrics.totalAgents ?? 0).toLocaleString()}
                description="All agents currently available in your workspace."
                tone="accent"
              />
              <MetricCard
                title="Avg Quality Score"
                value={typeof metrics.avgQuality === 'number' ? metrics.avgQuality.toFixed(1) : '—'}
                description="Based on agents with a stored 0-10 quality score."
              />
              <MetricCard
                title="Training Examples"
                value={Number(metrics.totalTrainingExamples ?? 0).toLocaleString()}
                description="All fine-tune examples currently logged."
              />
              <MetricCard
                title="Last 7 Day Sessions"
                value={Number(metrics.last7Sessions ?? 0).toLocaleString()}
                description={`Active sessions recorded since ${last7Label}.`}
              />
              <MetricCard
                title="Last 7 Day Tokens"
                value={
                  Number.isFinite(Number(metrics.last7Tokens))
                    ? Number(metrics.last7Tokens).toLocaleString()
                    : '0'
                }
                description={`Estimated cost: $${
                  Number.isFinite(Number(metrics.last7CostUsd))
                    ? Number(metrics.last7CostUsd).toFixed(5)
                    : '0.00000'
                }`}
              />
              <MetricCard
                title="Needs Quality Work"
                value={Number(metrics.lowQualityAgents ?? 0).toLocaleString()}
                description="Agents currently below the 8/10 quality threshold."
              />
            </div>

            <SurfaceCard className="p-5">
              <p className="app-eyebrow">Recent Momentum</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Most Active Agent</h2>
              <p className="mt-3 text-lg font-semibold text-cyan-100">
                {prettyAgentTitle(metrics.topAgentName)}
              </p>
              {metrics.topAgentName && metrics.topAgentName !== prettyAgentTitle(metrics.topAgentName) ? (
                <p className="mt-2 text-[11px] text-gray-500">
                  Raw: <span className="font-mono">{metrics.topAgentName}</span>
                </p>
              ) : null}
              <p className="mt-3 text-sm text-gray-300">
                We&apos;ll expand this into per-agent charts and drilldowns next.
              </p>
            </SurfaceCard>
          </>
        ) : null}

        {!onboarding ? (
          <StatePanel
            tone="warning"
            title="Workspace onboarding is still incomplete"
            description="Add the core company, tone, and goal context so the rest of the platform has a better operating baseline."
          >
            <Link href="/onboarding" className={appButtonClassName({ variant: 'secondary', size: 'md' })}>
              Continue Onboarding
            </Link>
          </StatePanel>
        ) : null}

        {onboarding && !editing ? (
          <SurfaceCard className="max-w-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="app-eyebrow">Workspace Profile</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Your onboarding data</h2>
                <p className="mt-3 text-sm text-gray-300">
                  This profile powers the default workspace context used throughout Automata.
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className={appButtonClassName({ variant: 'primary', size: 'md' })}
              >
                Edit Profile
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Company</p>
                <p className="mt-2 text-sm text-white">{onboarding.company || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Tone</p>
                <p className="mt-2 text-sm text-white">{onboarding.tone || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Goal</p>
                <p className="mt-2 text-sm text-white">{onboarding.goal || '—'}</p>
              </div>
            </div>
          </SurfaceCard>
        ) : null}

        {editing ? (
          <SurfaceCard className="max-w-2xl p-6">
            <p className="app-eyebrow">Workspace Profile</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Edit onboarding data</h2>
            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-gray-500">Company</span>
                <input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-gray-500">Tone</span>
                <input
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-gray-500">Goal</span>
                <input
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={saveChanges} className={appButtonClassName({ variant: 'primary', size: 'md' })}>
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className={appButtonClassName({ variant: 'secondary', size: 'md' })}
              >
                Cancel
              </button>
            </div>
          </SurfaceCard>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
