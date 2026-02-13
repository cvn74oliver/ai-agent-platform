'use client'
import { useEffect, useRef, useState } from 'react'

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void
}

export default function VoiceRecorder({ onTranscribed }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [analyserLevel, setAnalyserLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<BlobPart[]>([])
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // 🎤 Start recording + visualize levels
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    audioChunks.current = []

    // Audio visualization setup
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser
    sourceRef.current = source
    audioContextRef.current = audioCtx

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg =
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255
      setAnalyserLevel(avg)
      animationRef.current = requestAnimationFrame(updateLevel)
    }
    updateLevel()

    mediaRecorder.ondataavailable = (e) => audioChunks.current.push(e.data)
    mediaRecorder.onstop = async () => {
      cancelAnimationFrame(animationRef.current!)
      audioCtx.close()
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')

      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      onTranscribed(data.text)
    }

    mediaRecorder.start()
    setRecording(true)
  }

  // ⏹ Stop recording
  function stopRecording() {
    mediaRecorderRef.current?.stop()
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    setRecording(false)
  }

  return (
    <div className="flex flex-col items-center">
      {/* 🔴 Recording indicator */}
      {recording && (
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="text-red-400 font-semibold text-sm">
            Recording…
          </span>
        </div>
      )}

      {/* Mic level visual */}
      <div className="flex items-end gap-1 h-6 mb-2">
        {Array.from({ length: 10 }).map((_, i) => {
          const active = analyserLevel * 10 > i
          return (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all duration-100 ${
                active ? 'bg-green-400 h-6' : 'bg-gray-600 h-2'
              }`}
            />
          )
        })}
      </div>

      {/* Record/Stop button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded text-white font-medium ${
          recording
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {recording ? '⏹ Stop' : '🎤 Record'}
      </button>
    </div>
  )
}