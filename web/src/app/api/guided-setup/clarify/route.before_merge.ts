import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

export async function POST(req: Request) {
  try {
    const { session_id, clarification_request } = await req.json()
    if (!session_id || !clarification_request)
      return NextResponse.json({ error: 'Missing session_id or clarification_request' }, { status: 400 })

    const supabase = createClient()

    // 🔹 Load the existing session
    const { data: sess, error } = await supabase
      .from('guided_setup_sessions')
      .select('state_json')
      .eq('id', session_id)
      .single()

    if (error || !sess?.state_json)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const state = sess.state_json
    const currentQuestion = state.qa_log?.at(-1)?.question || 'the most recent question'

    // 🧠 Ask OpenAI to clarify the current question
    const prompt = `
You are clarifying an onboarding interview question for a user.
The AI interviewer previously asked: "${currentQuestion}"
The user asked: "${clarification_request}"

Respond in one or two short sentences, helping the user understand
what kind of information or detail they should provide in their answer.
Keep it conversational and helpful.
`

    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [{ role: 'system', content: prompt }],
      }),
    })

    const data = await resp.json()
    const clarification =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I wasn't able to clarify that."

    // 💾 Save clarification to the last question in qa_log
    const updatedState = { ...state }
    if (updatedState.qa_log?.length > 0) {
      updatedState.qa_log[updatedState.qa_log.length - 1].clarification = clarification
    }

    await supabase
      .from('guided_setup_sessions')
      .update({ state_json: updatedState })
      .eq('id', session_id)

    // ✅ Return the clarification message
    return NextResponse.json({ clarification })
  } catch (err: any) {
    console.error('[clarify] error:', err)
    return NextResponse.json(
      { error: err.message || 'Clarify route failed.' },
      { status: 500 },
    )
  }
}