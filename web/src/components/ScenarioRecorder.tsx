'use client'
import { useState, useRef } from 'react'

interface ScenarioRecorderProps {
  scenario: string
  onTraitsCaptured: (traits: any) => void
}

export default function ScenarioRecorder({ scenario, onTraitsCaptured }: ScenarioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = handleStop
    recorder.start()
    setRecording(true)
  }

async function handleStop() {
  setLoading(true)
  try {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('file', blob, 'scenario-recording.webm')

    const res = await fetch('/api/analyze-voice', { method: 'POST', body: formData })
    const data = await res.json()
    setResult(data.traits)
    console.log('Captured traits before send:', data.traits)
    if (data.traits) onTraitsCaptured(data.traits)
  } catch (err) {
    console.error('Analyze voice failed:', err)
  } finally {
    setLoading(false)   // <— guarantees overlay disappears
  }
}

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md text-white">
      <h3 className="text-xl font-semibold mb-3">Scenario Recording</h3>
      <p className="text-gray-300 mb-4">{scenario}</p>

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded text-white ${
            recording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {recording ? 'Stop Recording' : '🎤 Start Recording'}
        </button>

        {loading && <span className="text-gray-400">Analyzing your tone...</span>}

        {/* Optional test button */}
        <button
          onClick={async () => {
            const silent = new Blob([new Uint8Array(1024)], { type: 'audio/webm' })
            const formData = new FormData()
            formData.append('file', silent, 'test.webm')
            const res = await fetch('/api/analyze-voice', { method: 'POST', body: formData })
            const data = await res.json()
            console.log('TEST TRAITS:', data)
            alert('Test upload sent. Check Network → /api/analyze-voice → Preview to see JSON.')
          }}
          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Test Upload
        </button>
      </div>

      {result && (
        <div className="bg-gray-900 p-4 rounded-lg mt-4">
          <h4 className="text-lg font-semibold mb-2">Detected Personality Traits</h4>
          <pre className="text-gray-300 text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}