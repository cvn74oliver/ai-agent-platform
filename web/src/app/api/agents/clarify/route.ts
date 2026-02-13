import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const MODEL = 'gpt-4o-mini'

export async function POST(req: Request) {
  try {
    const { agent_id, field_key, user_question } = await req.json()

    if (!agent_id || !field_key || !user_question) {
      return NextResponse.json(
        { ok: false, error: 'Missing agent_id, field_key, or user_question' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // Load agent
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('onboarding_summary, clarify_threads')
      .eq('id', agent_id)
      .single()

    if (agentErr || !agent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    const fieldValue = agent.onboarding_summary[field_key] || ''

    const prompt = `
The user is asking for clarification about the field: "${field_key}"
The current value of this field is: "${fieldValue}"

User question: "${user_question}"

Provide a short, helpful clarification that guides the user on how to answer this specific field.
Keep it conversational.
    `

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: prompt }],
        max_tokens: 120,
        temperature: 0.4
      })
    })

    const openaiJSON = await openaiResp.json()
    const answer =
      openaiJSON?.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't generate a clarification."

    return NextResponse.json({ ok: true, clarification: answer })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}