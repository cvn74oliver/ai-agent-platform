'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import ScenarioRecorder from '@/components/ScenarioRecorder'
import { Bot, Trash, Pencil, Check, X } from 'lucide-react'

export default function AgentsPage() {
  const supabase = createClient()
  const [agents, setAgents] = useState<any[]>([])
  const [monitorVoice, setMonitorVoice] = useState(false)
  const [voiceTraits, setVoiceTraits] = useState<any>(null)
  const [creating, setCreating] = useState(false)
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

// Create new agent
async function createAgent() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  setCreating(true)

  // Trainer mode: twin (default) or role (if monitoring voice)
  const trainerMode = monitorVoice ? 'role' : 'twin'

  // log traits being saved
  console.log('saving to Supabase →', voiceTraits)

  try {
    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          user_id: user.id,
          name: 'New Agent',
          description: monitorVoice
            ? 'Created with monitored voice traits.'
            : 'Created with AI personality questions.',
          personality: { tone: 'neutral', expertise: 'general' },
          trainer_mode: trainerMode,
          // ⚡️ convert traits to a JSON-safe format
          voice_traits: voiceTraits ? JSON.stringify(voiceTraits) : null,
        },
      ])
      .select()

    if (error) {
      console.error('Error creating agent:', error)
    } else {
      setAgents([data[0], ...agents])
    }
  } catch (err) {
    console.error('Insert failed:', err)
  }

  setCreating(false)
  setVoiceTraits(null)
  setMonitorVoice(false)
}

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your AI Agents</h2>
        </div>

        {/* Agent creation box */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-3">Create a New Agent</h3>

          <label className="flex items-center gap-2 mb-4 text-gray-300">
            <input
              type="checkbox"
              checked={monitorVoice}
              onChange={(e) => setMonitorVoice(e.target.checked)}
            />
            <span>Monitor my voice to capture tone & personality</span>
          </label>

          {monitorVoice ? (
            <ScenarioRecorder
              scenario="Imagine you’re helping a customer decide which grow kit to buy. 
              Speak in the tone and energy level you want your agent to have."
              onTraitsCaptured={(traits) => setVoiceTraits(traits)}
            />
          ) : (
            <p className="text-gray-400 mb-4">
              Voice monitoring is off. The AI will instead ask a few questions to understand the
              agent’s personality.
            </p>
          )}

            <button
            onClick={() => (window.location.href = '/agents/new')}
            disabled={creating}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white text-sm mt-4"
            >
            + New Agent
            </button>
        </div>

        {/* Existing agents */}
        {agents.length === 0 ? (
          <p className="text-gray-400">
            You don’t have any agents yet. Create one above.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-800 p-6 rounded-xl shadow-xl text-center relative"
              >
                <div className="flex justify-center mb-4 text-blue-400">
                  <Bot size={28} />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {editingId === agent.id ? (
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="w-full max-w-[220px] bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                      placeholder="Agent name"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold leading-snug line-clamp-2">{agentDisplayTitle(agent)}</h3>
                  )}

                  {editingId !== agent.id && (
                    <button
                      onClick={() => startEdit(agent)}
                      className="text-gray-400 hover:text-white"
                      title="Edit name & tagline"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>

                {editingId === agent.id ? (
                  <textarea
                    value={draftTagline}
                    onChange={(e) => setDraftTagline(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-xs text-white mb-4"
                    placeholder="Short tagline (what this agent does)"
                  />
                ) : (
                  <p className="text-gray-300 mb-4 text-sm line-clamp-3">
                    {shortText(agent.description, 140) || 'No tagline yet. Click the pencil to add a short description.'}
                  </p>
                )}

                {editingId === agent.id && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <button
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className={`px-3 py-1.5 rounded text-white text-xs font-medium ${
                        savingEdit ? 'bg-gray-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                      title="Save"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Check size={14} /> Save
                      </span>
                    </button>

                    <button
                      onClick={cancelEdit}
                      disabled={savingEdit}
                      className={`px-3 py-1.5 rounded text-white text-xs font-medium ${
                        savingEdit ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      title="Cancel"
                    >
                      <span className="inline-flex items-center gap-1">
                        <X size={14} /> Cancel
                      </span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => (window.location.href = `/agents/${agent.id}`)}
                  disabled={editingId === agent.id || savingEdit}
                  className={`px-5 py-2 rounded text-white text-sm mb-2 ${
                    editingId === agent.id || savingEdit
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  Edit Agent
                </button>

                {agent.id ? (
                  <button
                    onClick={() => (window.location.href = `/agents/${agent.id}/operations/intelligence`)}
                    disabled={editingId === agent.id || savingEdit}
                    className={`px-5 py-2 rounded text-white text-sm mb-2 ${
                      editingId === agent.id || savingEdit
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                  >
                    Open Operations
                  </button>
                ) : null}

                <button
                  onClick={() => (window.location.href = `/automations?agent_id=${agent.id}`)}
                  disabled={editingId === agent.id || savingEdit}
                  className={`px-5 py-2 rounded text-white text-sm mb-2 ${
                    editingId === agent.id || savingEdit
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Manage Automations
                </button>

                <button
                  onClick={() => deleteAgent(agent.id)}
                  disabled={editingId === agent.id || savingEdit}
                  className={`px-5 py-2 rounded text-white text-sm ${
                    editingId === agent.id || savingEdit
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
