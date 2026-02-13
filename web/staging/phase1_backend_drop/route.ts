import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server' // <- your existing helper that returns a Supabase client
import { z } from 'zod'

/**
 * Request schema:
 * - Required: session_id, prompt_id
 * - Optional: clarification_response { question, answer }
 * - Optional: agent & category to support "latest active" fallback if prompt_id not found (useful for version bump)
 */
const ClarifyRequestSchema = z.object({
  session_id: z.string().uuid().nonempty(),
  prompt_id: z.string().uuid().optional(), // primary mode
  agent: z.string().optional(),            // fallback for latest active prompt
  category: z.string().optional(),         // fallback for latest active prompt
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

// Simple structured logger
function log(meta: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), route: '/api/guided-setup/clarify', ...meta }))
}

export async function POST(req: Request) {
  const t0 = Date.now()
  const hdrs = headers()
  const sessionToken = hdrs.get('authorization')?.replace('Bearer ', '') || null

  let body: ClarifyRequest
  try {
    body = ClarifyRequestSchema.parse(await req.json())
  } catch (e: any) {
    log({ level: 'warn', event: 'invalid_request', error: e?.errors })
    return err('INVALID_REQUEST', 'Missing or invalid fields: session_id and prompt_id (or agent+category) are required.', e?.errors)
  }

  const supabase = createClient({ cookiesStore: cookies() })

  // Hydrate Supabase auth from Authorization: Bearer <token> if provided
  if (sessionToken) {
    try {
      const { error } = await supabase.auth.setSession({ access_token: sessionToken, refresh_token: '' })
      if (error) log({ level: 'warn', event: 'auth_set_session_failed', error: error.message })
    } catch (e: any) {
      log({ level: 'warn', event: 'auth_set_session_throw', error: e?.message })
    }
  }

  // 1) Resolve prompt
  let prompt: any = null

  if (body.prompt_id) {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, agent, category, version, status, prompt_body, clarifications_json')
      .eq('id', body.prompt_id)
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      prompt = data
    }
  }

  // Optional fallback: if specific prompt_id not found, get latest active by agent+category
  if (!prompt && body.agent && body.category) {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, agent, category, version, status, prompt_body, clarifications_json, created_at')
      .eq('agent', body.agent)
      .eq('category', body.category)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      prompt = data
    }
  }

  if (!prompt) {
    log({ level: 'info', event: 'prompt_not_found', session_id: body.session_id, prompt_id: body.prompt_id })
    return err('PROMPT_NOT_FOUND', 'No prompt found for given ID or version.')
  }

  // 2) Load existing session state
  const { data: sessionRow, error: sessErr } = await supabase
    .from('guided_setup_sessions')
    .select('id, state_json')
    .eq('id', body.session_id)
    .limit(1)
    .maybeSingle()

  if (sessErr || !sessionRow) {
    // For Phase 1, we treat a missing session as INVALID_REQUEST (frontend should create session before this)
    log({ level: 'warn', event: 'session_missing', session_id: body.session_id, err: sessErr?.message })
    return err('INVALID_REQUEST', 'Session not found or not accessible.')
  }

  // Normalize state_json
  const state = normalizeState(sessionRow.state_json)

  // 3) If we received a clarification_response, append and persist
  if (body.clarification_response) {
    const nextState = appendResponse(state, body.clarification_response)

    const { error: updErr } = await supabase
      .from('guided_setup_sessions')
      .update({ state_json: nextState })
      .eq('id', sessionRow.id)

    if (updErr) {
      log({ level: 'error', event: 'state_update_failed', session_id: body.session_id, err: updErr.message })
      return err('INTERNAL', 'Failed to update session state.')
    }

    // overwrite local copy with persisted version
    state.responses = nextState.responses
    state.last_saved = nextState.last_saved
  }

  const latency = Date.now() - t0
  log({
    level: 'info',
    event: 'clarify_ok',
    session_id: body.session_id,
    prompt_id: prompt.id,
    status: 200,
    latency_ms: latency,
  })

  // 4) Respond
  return ok({
    prompt: {
      id: prompt.id,
      agent: prompt.agent,
      category: prompt.category,
      version: prompt.version,
      prompt_body: prompt.prompt_body,
    },
    clarifications: prompt.clarifications_json || [],
    session_state: {
      last_saved: state.last_saved,
      responses: state.responses,
    },
  })
}

/** Helpers **/

function normalizeState(raw: any) {
  const responses = Array.isArray(raw?.responses) ? raw.responses : []
  const last_saved = raw?.last_saved ?? new Date().toISOString()
  return { responses, last_saved }
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
