import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'   // ✅ use dynamic admin loader
import { z } from 'zod'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

const ClarifyRequestSchema = z.object({
  session_id: z.string().uuid().nonempty(),
  prompt_id: z.string().uuid().optional(),
  agent: z.string().optional(),
  category: z.string().optional(),
  clarification_request: z.string().optional(),
  clarification_response: z
    .object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
    .optional(),
})

type ClarifyRequest = z.infer<typeof ClarifyRequestSchema>
type ApiErrorCode = 'INVALID_REQUEST' | 'PROMPT_NOT_FOUND' | 'INTERNAL'
type ApiError = { code: ApiErrorCode; message: string; details?: any }

function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data, error: null })
}
function err(code: ApiErrorCode, message: string, details?: any, status = 400) {
  return NextResponse.json({ ok: false, data: null, error: { code, message, details } }, { status })
}

function log(meta: Record<string, any>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), route: '/api/guided-setup/clarify', ...meta }))
}

export async function POST(req: Request) {
  const t0 = Date.now()
  const hdrs = await headers()
  const sessionToken = hdrs.get('authorization')?.replace('Bearer ', '') || null
  const supabase = await getSupabaseAdmin()

  let body: ClarifyRequest
  try {
    body = ClarifyRequestSchema.parse(await req.json())
  } catch (e: any) {
    return err('INVALID_REQUEST', 'Missing or invalid fields.', e?.errors)
  }

  // Authenticate (optional)
  if (sessionToken) {
    try {
      const { error } = await supabase.auth.setSession({ access_token: sessionToken, refresh_token: '' })
      if (error) log({ level: 'warn', event: 'auth_set_session_failed', error: error.message })
    } catch (e: any) {
      log({ level: 'warn', event: 'auth_set_session_throw', error: e?.message })
    }
  }

  // 1) Load or resolve prompt
  let prompt: any = null
  if (body.prompt_id) {
    const { data } = await supabase
      .from('prompts')
      .select('id, agent, category, version, status, prompt_body, clarifications_json')
      .eq('id', body.prompt_id)
      .maybeSingle()
    prompt = data
  }
  if (!prompt && body.agent && body.category) {
    const { data } = await supabase
      .from('prompts')
      .select('id, agent, category, version, status, prompt_body, clarifications_json, created_at')
      .eq('agent', body.agent)
      .eq('category', body.category)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    prompt = data
  }
  if (!prompt) return err('PROMPT_NOT_FOUND', 'No prompt found for given ID or version.')

  // 2) Load existing session
  const { data: sessionRow, error: sessErr } = await supabase
    .from('guided_setup_sessions')
    .select('id, state_json')
    .eq('id', body.session_id)
    .limit(1)
    .maybeSingle()

  if (sessErr || !sessionRow)
    return err('INVALID_REQUEST', 'Session not found or not accessible.', sessErr?.message)

  const state = normalizeState(sessionRow.state_json)

  // 3) Generate clarification via OpenAI if needed
  let clarification = ''
  if (body.clarification_request) {
    const currentQuestion = state.qa_log?.at(-1)?.question || 'the most recent question'
    const openaiPrompt = `
You are clarifying an onboarding interview question for a user.
The AI interviewer previously asked: "${currentQuestion}"
The user asked: "${body.clarification_request}"

Respond in one or two short sentences, helping the user understand
what kind of information or detail they should provide in their answer.
Keep it conversational and helpful.
`
    try {
      const resp = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.4,
          messages: [{ role: 'system', content: openaiPrompt }],
        }),
      })
      const data = await resp.json()
      clarification =
        data?.choices?.[0]?.message?.content?.trim() ||
        "I'm sorry, I wasn't able to clarify that."
    } catch (e: any) {
      log({ level: 'error', event: 'openai_error', error: e?.message })
      clarification = "I'm sorry, I couldn't connect to the clarification service."
    }

    // store in qa_log if available
    if (state.qa_log?.length) {
      state.qa_log[state.qa_log.length - 1].clarification = clarification
    }
  }

  // 4) Handle direct clarification_response updates
  if (body.clarification_response) {
    const nextState = appendResponse(state, body.clarification_response)
    const { error: updErr } = await supabase
      .from('guided_setup_sessions')
      .update({ state_json: nextState })
      .eq('id', sessionRow.id)
    if (updErr) return err('INTERNAL', 'Failed to update session state.', updErr.message)
    state.responses = nextState.responses
    state.last_saved = nextState.last_saved
  }

  const latency = Date.now() - t0
  log({ level: 'info', event: 'clarify_ok', session_id: body.session_id, latency_ms: latency })

  return ok({
    prompt: {
      id: prompt.id,
      agent: prompt.agent,
      category: prompt.category,
      version: prompt.version,
      prompt_body: prompt.prompt_body,
    },
    clarification,
    session_state: {
      last_saved: state.last_saved,
      responses: state.responses,
    },
  })
}

/** Helpers **/
function normalizeState(raw: any) {
  const responses = Array.isArray(raw?.responses) ? raw.responses : []
  const qa_log = Array.isArray(raw?.qa_log) ? raw.qa_log : []
  const last_saved = raw?.last_saved ?? new Date().toISOString()
  return { responses, qa_log, last_saved }
}

function appendResponse(
  state: { responses: Array<{ question: string; answer: string }>; last_saved: string },
  incoming: { question: string; answer: string }
) {
  const deduped = state.responses.filter(
    (r) => !(equalsInsensitive(r.question, incoming.question) && r.answer === incoming.answer)
  )
  deduped.push({ question: incoming.question, answer: incoming.answer })
  return {
    responses: deduped,
    last_saved: new Date().toISOString(),
  }
}

function equalsInsensitive(a?: string, b?: string) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()
}