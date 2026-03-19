'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { appButtonClassName } from '@/components/ui/app-button'
import PageHeader from '@/components/ui/page-header'
import StatePanel from '@/components/ui/state-panel'
import SurfaceCard from '@/components/ui/surface-card'
import { createClient } from '@/lib/supabase'
import ScenarioRecorder from '@/components/ScenarioRecorder'
import { Bot, Pencil, Check, X } from 'lucide-react'

export default function AgentsPage() {
  const supabase = createClient()
  const [agents, setAgents] = useState<any[]>([])
  const [monitorVoice, setMonitorVoice] = useState(false)
  const [voiceTraits, setVoiceTraits] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftTagline, setDraftTagline] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    async function loadAgents() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) console.error('Error loading agents:', error)
      else setAgents(data)
    }

    loadAgents()
  }, [supabase])

  function startEdit(agent: any) {
    setEditingId(agent.id)
    setDraftName(agent.name || '')
    setDraftTagline(agent.description || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName('')
    setDraftTagline('')
  }

  async function saveEdit() {
    if (!editingId) return
    const name = draftName.trim()
    const description = draftTagline.trim()
    if (!name) {
      alert('Name is required.')
      return
    }

    try {
      setSavingEdit(true)
      const { data, error } = await supabase
        .from('agents')
        .update({ name, description })
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        console.error('Error updating agent:', error)
        alert('Failed to update agent.')
        return
      }

      setAgents((prev) => prev.map((a) => (a.id === editingId ? data : a)))
      cancelEdit()
    } finally {
      setSavingEdit(false)
    }
  }

  function shortText(s: any, max = 120): string {
    const t = typeof s === 'string' ? s.trim() : ''
    if (!t) return ''
    return t.length > max ? t.slice(0, max - 1) + '…' : t
  }

  function shortTitleFromText(s: any, maxWords = 6): string {
    let t = typeof s === 'string' ? s.trim() : ''
    if (!t) return ''

    // Take only the first line/sentence-ish chunk
    t = t.split(/\r?\n/)[0] || t
    t = t.split(/[.!?]/)[0] || t

    // Strip common long intro prefixes
    t = t.replace(/^\s*(my\s+company\s+name\s+is\s+)/i, '')
    t = t.replace(/^\s*(the\s+company\s+is\s+)/i, '')
    t = t.replace(/^\s*(curative\s+mushrooms\s+is\s+)/i, '')
    t = t.replace(/^\s*(curative\s+mushrooms\s+provides\s+)/i, '')

    // Prefer the role before " for " (e.g., "Customer Support Agent")
    const forIdx = t.toLowerCase().indexOf(' for ')
    if (forIdx > 0) t = t.slice(0, forIdx)

    // Collapse whitespace
    t = t.replace(/\s+/g, ' ').trim()

    // Remove filler words
    const filler = new Set(['a','an','the','and','or','with','to','of','in','on','for','this','that','is','are','by'])
    const wordsRaw = t.split(' ').filter(Boolean)
    const words = wordsRaw.filter((w) => !filler.has(w.toLowerCase()))

    const base = words.length ? words : wordsRaw
    return base.slice(0, maxWords).join(' ').trim()
  }

  function inferRoleTitle(agent: any): string {
    const blob = [
      agent?.agent_type,
      agent?.onboarding_summary?.agent_type,
      agent?.name,
      agent?.description,
      agent?.onboarding_summary?.mission,
      agent?.onboarding_summary?.topics,
    ]
      .filter((v) => typeof v === 'string')
      .join(' ')
      .toLowerCase()

    if (!blob) return ''

    // High-signal role detection
    if (blob.includes('customer support')) return 'Customer Support Agent'
    if (blob.includes('support agent')) return 'Customer Support Agent'
    if (blob.includes('operations')) return 'Operations Assistant'
    if (blob.includes('automation')) return 'Automation Specialist'
    if (blob.includes('marketing')) return 'Marketing Assistant'
    if (blob.includes('sales')) return 'Sales Assistant'
    if (blob.includes('project manager')) return 'Project Manager Agent'
    if (blob.includes('prompt engineer')) return 'Prompt Engineer Agent'

    // Domain-specific
    if (blob.includes('mushroom') && blob.includes('grow')) return 'Mushroom Growing Coach'
    if (blob.includes('mushroom') && blob.includes('cultivat')) return 'Mushroom Cultivation Coach'
    if (blob.includes('mental health') || blob.includes('wellness')) return 'Wellness Support Agent'

    // Generic fallback
    if (blob.includes('ai agent') || blob.includes('assistant')) return 'AI Assistant'

    return ''
  }

  function agentDisplayTitle(agent: any): string {
    // 1) Prefer role-like agent_type fields
    const role = agent?.agent_type || agent?.onboarding_summary?.agent_type
    const roleShort = shortTitleFromText(role, 6)

    // If roleShort is non-empty and not obviously a paragraph, use it.
    // (If it contains many commas or is very long even after shortening, fall back.)
    if (roleShort && roleShort.length <= 48) return roleShort

    // 2) Infer a clean role title from other fields
    const inferred = inferRoleTitle(agent)
    if (inferred) return inferred

    // 3) Otherwise use the name but keep it short and clean
    const nameShort = shortTitleFromText(agent?.name, 6)
    if (nameShort) return nameShort

    return 'Untitled Agent'
  }

  // Delete an agent
  async function deleteAgent(id: string) {
    const confirmed = confirm('Are you sure you want to delete this agent?')
    if (!confirmed) return

    const { error } = await supabase.from('agents').delete().eq('id', id)
    if (error) console.error('Error deleting agent:', error)
    else setAgents(agents.filter((a) => a.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="app-page-stack">
        <PageHeader
          eyebrow="Agents"
          title="Your AI agents"
          description="Manage every active agent, edit its profile, and open its operations workspace from one consistent surface."
          tone="hero"
          actions={
            <Link href="/agents/new" className={appButtonClassName({ variant: 'primary', size: 'md' })}>
              New Agent
            </Link>
          }
        />

        <SurfaceCard className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="app-eyebrow">Creation Setup</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Create a new agent</h2>
              <p className="mt-3 text-sm text-gray-300">
                Guided setup remains the fastest way to create a new agent. Voice capture is optional and keeps the current staged creation flow intact.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/agents/new" className={appButtonClassName({ variant: 'secondary', size: 'md' })}>
                Start Guided Setup
              </Link>
            </div>
          </div>

          <label className="mt-6 flex items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={monitorVoice}
              onChange={(e) => setMonitorVoice(e.target.checked)}
              className="h-4 w-4 rounded-md p-0"
            />
            <span>Monitor my voice to capture tone and personality</span>
          </label>

          <div className="mt-4">
            {monitorVoice ? (
              <ScenarioRecorder
                scenario="Imagine you’re helping a customer decide which grow kit to buy.
              Speak in the tone and energy level you want your agent to have."
                onTraitsCaptured={(traits) => setVoiceTraits(traits)}
              />
            ) : (
              <StatePanel
                title="Voice monitoring is off"
                description="The guided setup will ask a few questions instead so the agent can learn your personality and operating style."
              />
            )}
          </div>

          {voiceTraits ? (
            <p className="mt-4 text-xs text-cyan-100">
              Voice traits captured for this session. Guided setup will continue from the new-agent flow.
            </p>
          ) : null}
        </SurfaceCard>

        {agents.length === 0 ? (
          <StatePanel
            tone="warning"
            title="No agents yet"
            description="Create your first agent to start building workspace behaviors, operations, and automations."
          >
            <Link href="/agents/new" className={appButtonClassName({ variant: 'secondary', size: 'md' })}>
              Create Your First Agent
            </Link>
          </StatePanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => {
              const isEditing = editingId === agent.id
              const actionDisabled = isEditing || savingEdit

              return (
                <SurfaceCard key={agent.id} className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-900/45 bg-cyan-950/10 text-cyan-100">
                        <Bot size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Agent</p>
                        {isEditing ? (
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="mt-2 w-full min-w-0"
                            placeholder="Agent name"
                          />
                        ) : (
                          <h3 className="mt-2 text-lg font-semibold leading-snug text-white">
                            {agentDisplayTitle(agent)}
                          </h3>
                        )}
                      </div>
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(agent)}
                        className="rounded-full border border-gray-700 bg-gray-950/55 p-2 text-gray-400 hover:border-cyan-700/60 hover:text-white"
                        title="Edit name and tagline"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <textarea
                      value={draftTagline}
                      onChange={(e) => setDraftTagline(e.target.value)}
                      rows={3}
                      className="mt-4 w-full"
                      placeholder="Short tagline (what this agent does)"
                    />
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-gray-300">
                      {shortText(agent.description, 140) ||
                        'No tagline yet. Use the edit control to add a short description.'}
                    </p>
                  )}

                  {isEditing ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className={appButtonClassName({ variant: 'primary', size: 'sm' })}
                        title="Save"
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={savingEdit}
                        className={appButtonClassName({ variant: 'secondary', size: 'sm' })}
                        title="Cancel"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-2">
                    <button
                      onClick={() => (window.location.href = `/agents/${agent.id}`)}
                      disabled={actionDisabled}
                      className={appButtonClassName({ variant: 'primary', size: 'md', block: true })}
                    >
                      Edit Agent
                    </button>

                    {agent.id ? (
                      <button
                        onClick={() => (window.location.href = `/agents/${agent.id}/operations/intelligence`)}
                        disabled={actionDisabled}
                        className={appButtonClassName({ variant: 'secondary', size: 'md', block: true })}
                      >
                        Open Operations
                      </button>
                    ) : null}

                    <button
                      onClick={() => (window.location.href = `/automations?agent_id=${agent.id}`)}
                      disabled={actionDisabled}
                      className={appButtonClassName({ variant: 'ghost', size: 'md', block: true })}
                    >
                      Manage Automations
                    </button>

                    <button
                      onClick={() => deleteAgent(agent.id)}
                      disabled={actionDisabled}
                      className={appButtonClassName({ variant: 'destructive', size: 'md', block: true })}
                    >
                      Delete
                    </button>
                  </div>
                </SurfaceCard>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
