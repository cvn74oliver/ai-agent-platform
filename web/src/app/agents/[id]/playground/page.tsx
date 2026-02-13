'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import VoiceRecorder from '@/components/VoiceRecorder'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function getLastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return null
}

function prettyAgentTitle(agent: any): string {
  const agentType = String(agent?.onboarding_summary?.agent_type || '').trim()
  if (agentType) return agentType

  const raw = String(agent?.name || '').trim()
  if (!raw) return 'Unnamed Agent'

  // If it's already short, keep it.
  const words = raw.replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (words.length <= 6 && raw.length <= 60) return raw

  // If it's a sentence/paragraph, return a compact role-ish fallback.
  return words.slice(0, 6).join(' ')
}

export default function AgentSummaryPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()

  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recalcLoading, setRecalcLoading] = useState(false)
  const [improveLoading, setImproveLoading] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')

  // Load agent data
  useEffect(() => {
    if (!params?.id) return

    async function loadAgent() {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error || !data) {
          console.error('[Summary] loadAgent error:', error)
          setError('❌ Agent not found or access denied.')
        } else {
          setAgent(data)
          setSessionId(null)
          setMessages([])
        }
      } catch (err) {
        console.error('[Summary] Load failed:', err)
        setError('⚠️ Error loading agent.')
      } finally {
        setLoading(false)
      }
    }

    loadAgent()
  }, [params?.id, supabase])

  async function recalculateQuality() {
    if (!agent?.id) return
    setRecalcLoading(true)

    try {
      const res = await fetch('/api/agents/recalculate-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })

      const data = await res.json()
      if (!data.ok) {
        alert(data.error || '⚠️ Failed to recalculate quality.')
      } else {
        // Refresh agent data after recalculation
        setAgent((prev) => ({ ...prev, quality_score: data.quality_score }))
      }
    } catch (err) {
      console.error('[Summary] recalc error:', err)
      alert('⚠️ Recalculation failed.')
    } finally {
      setRecalcLoading(false)
    }
  }

  async function improveQuality() {
    if (!agent?.id) return
    setImproveLoading(true)
    try {
      const res = await fetch('/api/agents/improve-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })

      const data = await res.json()
      console.log('[playground] improve-quality result:', data)

      if (!data.ok) {
        alert(data.error || '⚠️ Failed to generate improvement questions.')
        return
      }

      const score = data.data?.score
      const comment = data.data?.comment as string | undefined

      alert(
        `✅ Prompt Engineer review complete.\n\nCurrent quality score: ${
          typeof score === 'number' ? `${score}/10` : 'N/A'
        }${
          comment
            ? `\n\nSummary:\n${comment}`
            : '\n\nUse "Improve with Q&A" on the Summary tab to answer targeted questions and add training examples.'
        }`
      )
    } catch (err) {
      console.error('[playground] improve-quality error:', err)
      alert('⚠️ Improve Quality call failed. Check console for details.')
    } finally {
      setImproveLoading(false)
    }
  }

  async function handleFeedback(
    label: 'positive' | 'negative',
    originalAnswer: string,
    editedText?: string
  ): Promise<boolean> {
    if (!agent?.id) return false

    const userInput = getLastUserMessage(messages)

    // For "needs work", we *require* an edited answer from the user
    if (label === 'negative') {
      const trimmed = (editedText || '').trim()
      if (!trimmed) {
        alert('Please provide an edited answer for “Needs work”.')
        return false
      }
      editedText = trimmed
    }

    try {
      const payload: any = {
        agent_id: agent.id,
        // legacy feedback contract
        message: originalAnswer,
        rating: label === 'positive' ? 'up' : 'down',
        // new fine-tuning fields
        label,
        source: 'playground',
        user_input: userInput,
        agent_output: originalAnswer,
      }

      if (label === 'negative' && editedText) {
        payload.edited_text = editedText
      }

      const res = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('[playground] feedback result:', data)

      if (!data.ok) {
        alert(data.error || '⚠️ Failed to record feedback.')
        return false
      } else if (label === 'negative') {
        alert(
          '✅ Thanks! Your edited answer was saved as a fine-tuning example.\n\n' +
            'Future fine-tunes will use your version to teach the agent how to respond.'
        )
        return true
      } else {
        alert('✅ Thanks for the feedback!')
        return true
      }
    } catch (err) {
      console.error('[playground] feedback error:', err)
      alert('⚠️ Failed to record feedback. Check console for details.')
      return false
    }
  }

  async function sendMessage() {
    if (!agent?.id || !input.trim() || sending) return

    const text = input.trim()
    setInput('')

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setSending(true)

    try {
      const res = await fetch('/api/agents/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          messages: nextMessages,
          session_id: sessionId,
        }),
      })

      const data = await res.json()
      console.log('[playground] API result:', data)

      if (!data.ok || !data.data?.reply) {
        alert(data.error || '⚠️ Playground call failed.')
        return
      }

      const reply = data.data.reply as string
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      // Save the server-provided session_id so subsequent messages update the same agent_sessions row
      if (data?.data?.session_id && typeof data.data.session_id === 'string') {
        setSessionId(data.data.session_id)
      }
    } catch (err) {
      console.error('[playground] send error:', err)
      alert('⚠️ Failed to get a reply from the agent.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-300 p-6">Loading agent summary…</p>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-400 p-6">{error}</p>
      </DashboardLayout>
    )
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <p className="text-gray-400 p-6">No agent data available.</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded text-white flex flex-col min-h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              title={agent?.name || ''}
            >
              {prettyAgentTitle(agent)}
            </h1>
            <p className="text-[11px] text-gray-500 mt-1">
              Session: <span className="font-mono">{sessionId ? sessionId.slice(0, 8) : 'new'}</span>
            </p>
          </div>
          <button
            onClick={() => router.push(`/agents/${agent.id}/summary`)}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-xs"
          >
            ← Back to summary
          </button>
        </div>

        {/* 🌟 Agent Type & Quality + Recalculate */}
        <div className="mb-6 border border-gray-800 rounded p-4 bg-gray-800">
          {agent.onboarding_summary?.agent_type && (
            <p className="text-sm mb-1">
              <strong>Agent Type:</strong> {agent.onboarding_summary.agent_type}
            </p>
          )}
          {typeof agent.quality_score === 'number' && (
            <p className="text-sm mb-1">
              <strong>Quality Score:</strong> {agent.quality_score}/10
            </p>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="sm:max-w-[60%]">
              <p className="text-[11px] text-gray-400 leading-snug">
                After making manual edits below, you can:
              </p>
              <ul className="mt-1 ml-4 list-disc text-[11px] text-gray-400 space-y-0.5">
                <li>
                  <span className="font-semibold">Recalculate quality</span> – sends your current
                  summary back to the Prompt Engineer to rewrite and re-score the agent.
                </li>
                <li>
                  <span className="font-semibold">Improve with Q&amp;A</span> – the Prompt Engineer
                  will ask targeted questions, capture your answers as training examples, and then
                  re-score the agent after you finish.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end min-w-[220px]">
              <button
                onClick={recalculateQuality}
                disabled={recalcLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1 ${
                  recalcLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {recalcLoading ? 'Recalculating…' : '🚀 Recalculate quality'}
              </button>

              <button
                onClick={improveQuality}
                disabled={improveLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1 ${
                  improveLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {improveLoading ? 'Asking…' : '🧠 Improve with Q&A'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 border border-gray-800 rounded-lg p-3 bg-gray-950/40 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              Start by asking something this agent should be good at (e.g. “How do I handle a
              contaminated grow bag refund?”).
            </p>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {m.content}
                </div>

                {/* Feedback row for assistant messages */}
                {m.role === 'assistant' && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>How was this answer?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleFeedback('positive', m.content)
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white"
                      >
                        👍 Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(idx)
                          setEditDraft(m.content)
                        }}
                        className="px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white"
                      >
                        👎 Needs work
                      </button>
                    </div>

                    {editingIndex === idx && (
                      <div className="mt-2 border border-gray-700 rounded-lg p-2 bg-gray-900 space-y-2">
                        <p className="text-[11px] text-gray-300">
                          Edit this answer to what you wish the agent had said. Your version will be
                          stored as a fine-tuning example.
                        </p>

                        {/* Voice recorder for the corrected answer */}
                        <VoiceRecorder
                          onTranscribed={(text) => {
                            setEditDraft((prev) => (prev ? `${prev}\n${text}` : text))
                          }}
                        />

                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={4}
                          className="w-full mt-1 rounded bg-gray-800 text-white text-xs p-2 border border-gray-700 resize-y"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIndex(null)
                              setEditDraft('')
                            }}
                            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await handleFeedback('negative', m.content, editDraft)
                              if (!ok) return

                              // Replace the assistant message content with the corrected answer
                              setMessages((prev) =>
                                prev.map((msg, i) =>
                                  i === idx ? { ...msg, content: editDraft } : msg
                                )
                              )

                              // Exit edit mode
                              setEditingIndex(null)
                              setEditDraft('')
                            }}
                            className="px-3 py-1 rounded text-xs bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            💾 Save corrected answer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="mt-auto">
          <label className="block text-xs text-gray-400 mb-1">
            Ask this agent a question
          </label>

          {/* Primary: voice input */}
          <div className="mb-2">
            <p className="text-[11px] text-gray-400 mb-1">
              Tap the mic to speak your question, then tweak the text if needed before sending.
            </p>
            <VoiceRecorder
              onTranscribed={(text) => {
                setInput((prev) => (prev ? `${prev}\n${text}` : text))
              }}
            />
          </div>

          {/* Secondary: manual typing / editing */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full p-2 rounded bg-gray-800 text-white text-sm mb-2"
            placeholder="Example: A customer says their agar dish arrived contaminated. How should I respond?"
          />
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className={`px-4 py-2 rounded text-sm font-medium ${
                sending || !input.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sending ? 'Thinking…' : 'Send'}
            </button>
            <button
              onClick={() => {
                setMessages([])
                setSessionId(null)
              }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Clear conversation
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}