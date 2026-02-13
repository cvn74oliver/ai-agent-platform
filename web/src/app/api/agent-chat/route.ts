import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, agentPersonality } = await req.json()

    const systemPrompt = `
You are ${agentPersonality?.name || 'the user’s digital twin'}.
Speak naturally, like the user would.
Stay concise, personal, and reflective.
`

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.8,
      }),
    })

    const data = await resp.json()
    const reply = data?.choices?.[0]?.message?.content || ''
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[agent-chat] error:', err)
    return NextResponse.json({ reply: 'Something went wrong.' }, { status: 200 })
  }
}