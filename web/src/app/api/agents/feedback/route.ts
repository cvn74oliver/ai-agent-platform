import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const TOPIC_MODEL = 'gpt-4o-mini'

async function inferTopicForExample(params: { agentSummary: any; user_input: string | null; agent_output: string }): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }
  const systemPrompt = `You classify a single training example into a short topic label.

Requirements:
- Return ONLY a valid JSON object with this shape:
  { "topic": "snake_case_label" }
- The topic must be:
  - snake_case
  - no spaces
  - max 3–4 words
- Base your decision on:
  - the agent’s onboarding summary
  - the user_input (if provided)
  - the agent_output.
Do not include explanations, commentary, or any extra text—return ONLY the JSON object.`
  const userMessage = JSON.stringify({
    agentSummary: params.agentSummary,
    user_input: params.user_input,
    agent_output: params.agent_output,
  })
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: TOPIC_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    })
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) {
      return null
    }
    let parsed: any = null
    try {
      parsed = JSON.parse(content)
    } catch (parseErr) {
      console.warn('[inferTopicForExample] model did not return JSON, got:', content)
      return null
    }
    if (parsed && typeof parsed.topic === 'string' && parsed.topic.trim().length > 0) {
      return parsed.topic.trim()
    }
    return null
  } catch (e) {
    console.error('[inferTopicForExample] error parsing or fetching:', e)
    return null
  }
}

/**
 * Store playground / agent feedback as training examples.
 *
 * Expected JSON body:
 * {
 *   agent_id: string,
 *   role: 'assistant' | 'user',
 *   message: string,
 *   rating: 'up' | 'down',
 *   edited_text?: string,
 *   user_input?: string,      // optional
 *   source?: string           // e.g. "playground", "improve_qna"
 * }
 */
export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { agent_id, role, message, rating, edited_text, source, user_input, agent_output } = body || {}

  const cleanRole =
    role === 'assistant' || role === 'user' ? role : 'assistant'

  const finalSource =
    typeof source === 'string' && source.trim().length > 0
      ? source.trim()
      : 'playground'

  const insertRows: any[] = []

  if (finalSource === 'manual_finetune') {
    // Manual fine-tune flow: we allow examples without a `message`, but we still
    // require agent_id and rating, and we derive the answer text from edited_text,
    // agent_output, or message in that order.
    if (!agent_id || !rating) {
      return NextResponse.json(
        { ok: false, error: 'agent_id and rating are required for manual_finetune.' },
        { status: 400 }
      )
    }

    const manualText =
      (typeof edited_text === 'string' && edited_text.trim()) ||
      (typeof agent_output === 'string' && agent_output.trim()) ||
      (typeof message === 'string' && message.trim()) ||
      ''

    if (!manualText) {
      return NextResponse.json(
        { ok: false, error: 'A non-empty answer is required for manual_finetune examples.' },
        { status: 400 }
      )
    }

    insertRows.push({
      agent_id,
      user_input: typeof user_input === 'string' ? user_input : null,
      agent_output: manualText,
      quality_label: rating === 'down' ? 'negative' : 'positive',
      source: finalSource,
      tags: {
        rating,
        role: cleanRole,
        mode: 'manual_finetune',
      },
    })
  } else {
    // Existing playground / improve_qna flow
    if (!agent_id || !message || !rating) {
      return NextResponse.json(
        { ok: false, error: 'agent_id, message, and rating are required' },
        { status: 400 }
      )
    }

    const baseText =
      edited_text && edited_text.trim().length > 0
        ? edited_text.trim()
        : String(message || '').trim()

    if (!baseText) {
      return NextResponse.json(
        { ok: false, error: 'Empty feedback text' },
        { status: 400 }
      )
    }

    if (rating === 'up') {
      insertRows.push({
        agent_id,
        user_input: typeof user_input === 'string' ? user_input : null,
        agent_output: baseText,
        quality_label: 'positive',
        source: finalSource,
        tags: {
          rating,
          role: cleanRole,
        },
      })
    } else if (rating === 'down' && edited_text && edited_text.trim().length > 0) {
      insertRows.push(
        {
          agent_id,
          user_input: typeof user_input === 'string' ? user_input : null,
          agent_output: String(message || '').trim(),
          quality_label: 'negative',
          source: finalSource,
          tags: {
            rating: 'down',
            role: cleanRole,
            variant: 'original',
          },
        },
        {
          agent_id,
          user_input: typeof user_input === 'string' ? user_input : null,
          agent_output: edited_text.trim(),
          quality_label: 'positive',
          source: finalSource,
          tags: {
            rating: 'down',
            role: cleanRole,
            variant: 'edited',
          },
        }
      )
    } else if (rating === 'down') {
      return NextResponse.json(
        {
          ok: false,
          error: 'edited_text is required when rating is "down".',
        },
        { status: 400 }
      )
    }
  }

  let agentSummary: any = null
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('onboarding_summary')
      .eq('id', agent_id)
      .single()
    if (!error && data) {
      agentSummary = data?.onboarding_summary || null
    }
  } catch (e) {
    // ignore errors here
  }

  for (const row of insertRows) {
    const topic = await inferTopicForExample({
      agentSummary,
      user_input: row.user_input || null,
      agent_output: row.agent_output || '',
    })
    if (topic) {
      if (!row.tags) {
        row.tags = {}
      }
      row.tags.topic = topic
    }
  }

  const { error } = await supabase.from('fine_tune_examples').insert(insertRows)

  if (error) {
    console.error('[feedback] insert error:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}