'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import VoiceRecorder from '@/components/VoiceRecorder'

export default function ChatPage() {
  const params = useParams()
  const agentId = params.id
  const [conversation, setConversation] = useState<{ role: string; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const limit = 5 // five-message limit

  async function sendMessage(text: string) {
    if (!text.trim()) return
    if (messageCount >= limit) return alert('Conversation limit reached.')

    setLoading(true)
    const userMsg = { role: 'user', text }
    setConversation((c) => [...c, userMsg])
    setInput('')
    setMessageCount((n) => n + 1)

    try {
      // send message to AI
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent_id: agentId,
          agentPersonality: { name: 'Your Digital Twin' },
        }),
      })
      const data = await res.json()
      const aiText = data.reply || '...'
      const aiMsg = { role: 'assistant', text: aiText }
      setConversation((c) => [...c, aiMsg])

      // optional voice playback
      const audioResp = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const audioBlob = await audioResp.blob()
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Chat or TTS error:', err)
    }

    setLoading(false)
  }

  return (
    <div className="h-screen bg-gray-900 text-white p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Talk with Your Digital Twin</h2>

      <div className="flex-1 overflow-y-auto space-y-3 border border-gray-700 rounded p-4 mb-4">
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded mb-3 ${
              msg.role === 'user'
                ? 'bg-blue-700 text-white self-end'
                : 'bg-gray-700 text-gray-100 self-start'
            }`}
          >
            <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.text}

            {/* Feedback for AI responses */}
            {msg.role === 'assistant' && (
              <div className="mt-2 flex gap-3 text-sm">
                <button
                  onClick={async () => {
                    await fetch('/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        agent_id: agentId,
                        question: conversation[i - 1]?.text || '',
                        ai_answer: msg.text,
                        helpful: true,
                      }),
                    })
                    alert('👍 Thanks for your feedback!')
                  }}
                  className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-white"
                >
                  👍
                </button>
                <button
                  onClick={() => {
                    const correction = prompt('What would you have said instead?')
                    if (!correction) return
                    fetch('/api/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        agent_id: agentId,
                        question: conversation[i - 1]?.text || '',
                        ai_answer: msg.text,
                        correct_answer: correction,
                        helpful: false,
                      }),
                    })
                    alert('👎 Feedback saved, thank you!')
                  }}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white"
                >
                  👎
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type or talk to your AI..."
          className="flex-1 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
        />
        <VoiceRecorder onTranscribed={(text) => sendMessage(text)} />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </div>

      <p className="text-gray-400 text-sm mt-2">
        Limit: {limit - messageCount} messages remaining.
      </p>
    </div>
  )
}