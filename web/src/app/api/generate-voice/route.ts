import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1', // text-to-speech model
        voice: 'alloy', // other options: verse, aria, echo
        input: text,
        format: 'mp3',
      }),
    })

    const arrayBuffer = await resp.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (err: any) {
    console.error('[generate-voice] error:', err)
    return NextResponse.json({ error: err.message || 'TTS failed' }, { status: 500 })
  }
}