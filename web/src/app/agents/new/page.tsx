'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import VoiceRecorder from '@/components/VoiceRecorder'
import { submitGuidedAnswer } from '@/utils/submitGuidedAnswer'

let setupLock = false

export default function GuidedSetupPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)

  const [history, setHistory] = useState<{ q: string; a: string }[]>([])
  const [future, setFuture] = useState<{ q: string; a: string }[]>([])

  // 🟢 Start guided setup exactly once
useEffect(() => {
  if (finished || sessionId) return
  if (setupLock) {
    console.log('[debug] 🚫 Setup already started, skipping')
    return
  }
  setupLock = true

  async function start() {
    try {
      console.log('[debug] 🎬 Starting guided session...')
      const res = await fetch('/api/guided-setup/start', { method: 'POST' })
      const data = await res.json()
      console.log('[debug] ✅ Guided session started:', data)
      setSessionId(data.session_id)
      setQuestion(data.question || "Let's begin...")
    } catch (err) {
      console.error('[debug] ❌ Failed to start guided setup:', err)
      setQuestion('⚠️ There was a problem starting your session. Please refresh.')
    }
  }

  start()
}, [finished, sessionId])

  // 🟣 Submit current answer
  async function submit() {
    console.log('[debug] 🚀 Submitting answer:', { sessionId, answer })
    if (!sessionId || !answer.trim()) return
    setLoading(true)
    setHistory((h) => [...h, { q: question, a: answer }])
    setFuture([])

const data = await submitGuidedAnswer(sessionId, answer)
    setLoading(false)
    setAnswer('')

    if (data.done) {
      // 🧩 close the session so it won’t restart
      try {
        await fetch('/api/guided-setup/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
      } catch (err) {
        console.warn('[GuidedSetup] End route failed silently:', err)
      }

      setFinished(true)
      setQuestion('✅ Thank you! I have everything I need. Your agent is ready!')

      setTimeout(() => {
        if (data.agent_id) {
          window.location.href = `/agents/${data.agent_id}/summary`
        } else {
          alert('✅ Setup finished, but I couldn’t find the new agent ID. Please check your Agents page.')
          window.location.href = '/agents'
        }
      }, 1500)
      return
    }

    setQuestion(data.question || 'Preparing your next question…')
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg text-white text-center">
        <h2 className="text-2xl font-bold mb-4">🗣 Guided Agent Setup</h2>

        <p className="text-lg mb-6">{question || 'Preparing your first question…'}</p>

        {!finished && (
          <>
            <VoiceRecorder
              onTranscribed={(text) => {
                setAnswer(text)
                submit()
              }}
            />

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full p-3 mb-3 rounded bg-gray-800 text-white"
              placeholder="(Optional) Type your answer if mic isn’t available…"
            />

            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              <button
                onClick={submit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white text-lg"
              >
                {loading ? 'Thinking…' : 'Send'}
              </button>
<button
  onClick={async () => {
    if (!sessionId) return
    try {
      const res = await fetch('/api/guided-setup/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          prompt_id: 'd0aa3f4d-15e9-4e91-a241-d2b6a224b981', // your seeded Frontend prompt
          clarification_response: {
            question: 'User asked for clarification',
            answer: answer || 'Can you clarify?'
          }
        }),
      })

      const data = await res.json()
      console.log('[clarify] API result:', data)
      if (data?.data?.clarifications?.length) {
        alert(`Clarification question: ${data.data.clarifications[0].question}`)
      } else if (data?.error) {
        alert(`Clarify error: ${data.error.message || data.error}`)
      } else {
        alert('Clarify called successfully — see console for details.')
      }
    } catch (err) {
      console.error('[clarify] failed:', err)
      alert('Clarify API failed — check console.')
    }
  }}
  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded text-white text-sm"
>
  Get Clarification
</button>
              {/* Go Back */}
              {history.length > 0 && (
                <button
                  onClick={() => {
                    const last = history[history.length - 1]
                    setFuture((f) => [{ q: question, a: answer }, ...f])
                    setQuestion(last.q)
                    setAnswer(last.a)
                    setHistory(history.slice(0, -1))
                  }}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded text-white text-sm"
                >
                  ← Go Back
                </button>
              )}

              {/* Go Forward */}
              {future.length > 0 && (
                <button
                  onClick={() => {
                    const [next, ...rest] = future
                    setHistory((h) => [...h, { q: question, a: answer }])
                    setQuestion(next.q)
                    setAnswer(next.a)
                    setFuture(rest)
                  }}
                  className="bg-green-700 hover:bg-green-600 px-6 py-2 rounded text-white text-sm"
                >
                  Go Forward →
                </button>
              )}
            </div>
          </>
        )}

        {finished && (
          <p className="text-green-400 text-lg mt-6">
            🎉 Setup complete! Redirecting to your new agent…
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}