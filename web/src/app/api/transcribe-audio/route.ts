import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audio = formData.get('file') as Blob | null
    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 })
    }

    // Send audio to OpenAI Whisper
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: (() => {
        const fd = new FormData()
        fd.append('file', audio)
        fd.append('model', 'whisper-1')
        return fd
      })(),
    })

    const data = await resp.json()
    console.log('[transcribe-audio] transcript:', data.text)
    return NextResponse.json({ text: data.text })
  } catch (err: any) {
    console.error('[transcribe-audio] error:', err)
    return NextResponse.json(
      { error: err.message || 'Transcription failed' },
      { status: 500 },
    )
  }
}