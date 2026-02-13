import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// ────────────────────────────────────────────────────────────────
// TEMPORARY TYPE RELAXATION PATCH
// This loosens several strict type errors in the guided-setup answer route.
// It can be removed later after adding full interfaces for model responses.
// ────────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyRecord = Record<string, any>;
declare global {
  // widen inference for .shift() / followups
  interface Array<T> {
    shift(): T | undefined;
  }
}

/**
 * PROMPT-ENGINEER (STABLE)
 * Phase 1: Milestones only (no model calls). Always ask all 10 questions in order.
 * Phase 2: Single refine pass (rewrite + quality + follow-up). One follow-up at a time.
 * Stops after max 2 refinement passes. Then finalize & insert with user_id (RLS safe).
 * Saves quality_score + quality_feedback.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

const TARGET_QUALITY_SCORE = 8
const MAX_REFINE_PASSES = 2

type Fields = {
  agent_type?: string
  company?: string
  mission?: string
  tone?: string
  audience?: string
  topics?: string
  guardrails?: string
  rag_links?: string[]
  crawl_domains?: string[]
  formats?: string
  constraints?: string

  // 🧩 Agent-specific dynamic fields
  product_list?: string
  common_issue_categories?: string
  escalation_policy?: string
  custom_notes?: string
}

type AgentField = {
  key: string          // internal id, e.g. "mission", "refund_policy"
  label: string        // human label, e.g. "Mission", "Refund Policy"
  description?: string // optional help text or tooltip
  type: 'text' | 'textarea' | 'select' | 'tags'
  group?: 'core' | 'agent_specific' | 'custom'
  value: string | string[] | null
}

type Turn = { role: 'user' | 'assistant'; text: string }

type FollowUp = { field: keyof Fields; question: string }

type QAItem = {
  question: string
  answer?: string
  clarification?: string
}

type State = {
  qa_log: QAItem[]     // 👈 stores question, answer, and clarification per step
  transcript: Turn[]   // still keeps the overall chat log
  fields: Fields       // flat map of core values (backward-compatible)
  field_schema?: AgentField[]
  phase?: 'milestones' | 'base' | 'dynamic' | 'refine' | 'followups' | 'final' | 'done'
  current_key?: keyof Fields | null
  pending_followups?: FollowUp[]
  refine_passes?: number
  finished?: boolean
  dynamic_index?: number | null    // NEW: index into field_schema during dynamic phase
}

const MILESTONES: Array<{ key: keyof Fields; q: string; isUrls?: boolean }> = [
  {
    key: 'agent_type',
    q: "What type of AI agent are we creating? (Examples: Customer Support Agent, Technical Documentation Agent, Sales Assistant, Marketing Content Writer, Compliance Agent, Social Media Writer, etc.)",
  },
  {
    key: 'company',
    q: "What's your company's name and what does it do?",
  },
  {
    key: 'mission',
    q: "What is this agent's mission or primary purpose? What problem is it solving for your company or customers?",
  },
  {
    key: 'tone',
    q: "What tone should this agent use (friendly, expert, playful, serious, etc.)?",
  },
  {
    key: 'audience',
    q: "Who is this agent speaking to? Describe your primary audience.",
  },
  {
    key: 'topics',
    q: "Which subjects should this agent know best (products, policies, procedures, legal topics, etc.)?",
  },
  {
    key: 'guardrails',
    q: "List any legal, compliance, or brand guardrails the agent must follow (what to avoid, required disclaimers, sensitive areas).",
  },
  {
    key: 'formats',
    q: "What output formats should this agent produce (emails, replies, posts, scripts, checklists, etc.)?",
  },
  {
    key: 'constraints',
    q: "Any constraints on language, tone, or topics this agent must avoid?",
  },
  {
    key: 'rag_links',
    q: "Paste your Google Drive / Dropbox / SharePoint link containing your company documents, PDFs, training materials, or reference files.",
    isUrls: true,
  },
  {
    key: 'crawl_domains',
    q: "List any website URLs that this agent should crawl (one per line). Use * to include all pages, e.g. https://blog.example.com/*",
    isUrls: true,
  },
]

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  const { session_id, user_text } = await req.json()
  if (!session_id || typeof user_text !== 'string') {
    return NextResponse.json({ error: 'session_id and user_text required' }, { status: 400 })
  }


  // Load state
  const { data: sess } = await supabase
    .from('guided_setup_sessions')
    .select('id, state_json')
    .eq('id', session_id)
    .single()

  const state: State = normalize(sess?.state_json)
// 🩹 Initialize current_key for first milestone if missing
if (!state.current_key) {
  state.current_key = MILESTONES[0]?.key
  console.log('[debug] 🧠 First milestone initialized:', state.current_key)
}

  if (state.phase === 'done' || state.finished) {
    return NextResponse.json({ done: true, question: '✅ Setup already finished.' })
  }

  // Always log user turn & training sample
  state.transcript.push({ role: 'user', text: user_text })
  await supabase.from('training_data').insert([
    { agent_id: session_id, example_text: user_text, example_type: 'guided_setup' },
  ])

  // 📌 Link this answer to the last asked question
const lastUnanswered = [...state.qa_log].reverse().find(item => !item.answer)
if (lastUnanswered) {
  lastUnanswered.answer = user_text
}

  console.log('[debug] 🧩 Current key before saving:', state.current_key)
  console.log('[debug] 🧩 Fields before:', state.fields)
  console.log('[debug] 🧩 Transcript so far:', state.transcript.map(t => t.role + ': ' + t.text))

  // Commit last answer and move to the next milestone (ONLY in milestones phase)
  if (state.phase === 'milestones' && state.current_key) {
    assignAnswerToField(state, state.current_key, user_text)

    ;(state.fields as Record<string, any>)[state.current_key!] = user_text

    const currentIndex = MILESTONES.findIndex(m => m.key === state.current_key)
    const next = MILESTONES[currentIndex + 1]
    state.current_key = next ? next.key : null
  }

console.log('[debug] ✅ After commit:', {
  currentKey: state.current_key,
  fieldsNow: state.fields,
  transcriptLen: state.transcript.length,
})

  // ──────────────────────────────────────────────────────────────────
  // PHASE 1 — MILESTONES (no model calls, always ask all 10)
  // ──────────────────────────────────────────────────────────────────
  if (!state.phase || state.phase === 'milestones') {
    state.phase = 'milestones'

    const nextKey = nextUnfilledKey(state.fields)
    console.log('[debug] 🔍 nextUnfilledKey returned:', nextKey)

    // 🧩 If all milestones are complete, transition to dynamic questions (if any), otherwise refine
    if (!nextKey) {
      console.log('[debug] 🌙 All milestones complete — generating dynamic field schema...')

      if (!state.field_schema || state.field_schema.length === 0) {
        const schema = generateDynamicFieldSchema(state)
        state.field_schema = schema
        console.log('[debug] 🧬 Generated dynamic field schema:', schema)
      }

      // If we have dynamic fields, enter dynamic phase and ask the first one
      if (state.field_schema && state.field_schema.length > 0) {
        state.phase = 'dynamic'
        state.dynamic_index = 0

        const firstField = state.field_schema[0]
        const dynQuestion =
          firstField.description
            ? `${firstField.label}: ${firstField.description}`
            : `Please provide: ${firstField.label}`

        console.log('[debug] 🧬 Asking first dynamic question:', dynQuestion)

        // NEW: log dynamic question into transcript and qa_log
        state.transcript.push({ role: 'assistant', text: dynQuestion })
        state.qa_log.push({ question: dynQuestion })

        await saveState(supabase, session_id, state)
        return NextResponse.json({
          done: false,
          question: dynQuestion,
          coverage: '75%', // arbitrary; we can refine this later
        })
      }

      // Fallback: no dynamic fields, go straight to refine
      console.log('[debug] 🌙 No dynamic fields — entering refine phase...')
      state.phase = 'refine'
      await saveState(supabase, session_id, state)
      return await runRefinePhase(state)
    }

    // 🧠 Normal progression: ask the next milestone question
    const nextQ = MILESTONES.find(m => m.key === nextKey)?.q || ''
    state.current_key = nextKey
    state.transcript.push({ role: 'assistant', text: nextQ })
    // 📌 Log milestone question
    state.qa_log.push({ question: nextQ })  
    await saveState(supabase, session_id, state)
    const progress = Math.round(((10 - countUnfilled(state.fields)) / 10) * 60)

    return NextResponse.json({
      done: false,
      question: nextQ,
      coverage: `${progress}%`,
    })
  }

  // Handle dynamic agent-specific questions based on field_schema
  if (state.phase === 'dynamic') {
    if (!state.field_schema || state.field_schema.length === 0) {
      console.warn('[dynamic] ⚠ No field_schema present, falling through to refine.')
      state.phase = 'refine'
      await saveState(supabase, session_id, state)
      return await runRefinePhase(state)
    }

    const idx = typeof state.dynamic_index === 'number' ? state.dynamic_index : 0
    const currentField = state.field_schema[idx]

    if (!currentField) {
      console.log('[dynamic] ✅ No more dynamic fields — entering refine phase.')
      state.phase = 'refine'
      await saveState(supabase, session_id, state)
      return await runRefinePhase(state)
    }

    // Store the user's answer into the dynamic field
    console.log('[dynamic] 📝 Capturing answer for dynamic field:', currentField.key)
    state.field_schema[idx] = {
      ...currentField,
      value: user_text,
    }

    // Optionally: also mirror into flat fields for compatibility, if keys don't collide
    if (!(currentField.key in state.fields)) {
      ;(state.fields as AnyRecord)[currentField.key] = user_text
    }

    // Move to the next dynamic field
    const nextIndex = idx + 1
    if (nextIndex < state.field_schema.length) {
      state.dynamic_index = nextIndex
      const nextField = state.field_schema[nextIndex]
      const nextQuestion =
        nextField.description
          ? `${nextField.label}: ${nextField.description}`
          : `Please provide: ${nextField.label}`

      console.log('[dynamic] 🧬 Asking next dynamic question:', nextQuestion)

      // NEW: log dynamic question into transcript and qa_log
      state.transcript.push({ role: 'assistant', text: nextQuestion })
      state.qa_log.push({ question: nextQuestion })

      await saveState(supabase, session_id, state)
      return NextResponse.json({
        done: false,
        question: nextQuestion,
        coverage: '85%', // we can refine this later
      })
    }

    // No more dynamic fields — move into refine
    console.log('[dynamic] ✅ Completed all dynamic fields — entering refine phase.')
    state.phase = 'refine'
    await saveState(supabase, session_id, state)
    return await runRefinePhase(state)
  }

  // Call the handler if in refine or followups mode
  if (state.phase === 'refine' || state.phase === 'followups') {

    // 🩹 FIX: If answering a followup, store that answer into fields
    if (state.phase === 'followups' && state.current_key) {
      assignAnswerToField(state, state.current_key, user_text)
    }

    return await runRefinePhase(state)
  }

  // ✅ Fallback: if we somehow reach here without a phase match
  await saveState(supabase, session_id, state)
  console.warn('[debug] ⚠️ Reached ultimate fallback — returning generic prompt')
  return NextResponse.json({
    done: false,
    question: 'Processing complete data...',
  })

// ──────────────────────────────────────────────────────────────────
// PHASE 3 — Quality loop (score + followups) and single final rewrite
// ──────────────────────────────────────────────────────────────────
async function runRefinePhase(state: State) {
  // Increment passes through the evaluation/followup cycle
  state.refine_passes = (state.refine_passes || 0) + 1

  const evalResult = await evaluateQuality(state)
  const score = evalResult.score ?? 0
  const comment = evalResult.comment ?? null

  console.log(`[refine] pass ${state.refine_passes} — score: ${score}/10`)

  // 🚦 Safety cap: if we've tried enough times, do a final rewrite and finalize with best we have
  if ((state.refine_passes || 0) >= MAX_REFINE_PASSES && score < TARGET_QUALITY_SCORE) {
    console.log('[refine] 🚦 Max passes reached — doing final rewrite and finalizing.')

    const refineResult = await finalRefine(state)
    if (refineResult.ok) {
      state.fields = refineResult.rewritten
    } else {
      console.warn('[refine] ⚠ finalRefine failed, using current fields.')
    }

    return await finalize({
      supabase,
      state,
      session_id,
      evalResult: { score, comment },
    })
  }

  // 🧠 Build follow-up list from evaluation
  let followupsRaw: string[] = Array.isArray(evalResult.followups) ? [...evalResult.followups] : []

  // If under target OR this is the first refinement pass, we want followups
  const needsFollowups = score < TARGET_QUALITY_SCORE || (state.refine_passes || 0) === 1

  if (needsFollowups) {
    // Ensure at least one followup exists
    if (followupsRaw.length === 0) {
      followupsRaw.push(
        'CUSTOM_NOTES: Is there any additional context or nuance you would like this agent to know that has not been captured yet?'
      )
    }

    const parsedFollowups = followupsRaw
      .map(q => parseFollowup(q))
      .filter((fu): fu is FollowUp => fu !== null)

    if (parsedFollowups.length > 0) {
      state.phase = 'followups'
      state.pending_followups = parsedFollowups
      const nextFU = state.pending_followups.shift()!
      state.current_key = nextFU.field
      state.transcript.push({ role: 'assistant', text: nextFU.question })

      // NEW: log follow-up question into qa_log
      state.qa_log.push({ question: nextFU.question })

      await saveState(supabase, session_id, state)

      const progress = Math.min(80 + (state.refine_passes || 1) * 5, 95)
      return NextResponse.json({
        done: false,
        question: nextFU.question,
        coverage: `${progress}%`,
      })
    }
  }

  // 🎯 If we hit the target score (and we've already done at least one pass), do a single final rewrite and finalize
  if (score >= TARGET_QUALITY_SCORE) {
    console.log('[refine] 🎯 Target score reached — running final rewrite + finalize.')

    const refineResult = await finalRefine(state)
    if (refineResult.ok) {
      state.fields = refineResult.rewritten
    } else {
      console.warn('[refine] ⚠ finalRefine failed, using current fields.')
    }

    return await finalize({
      supabase,
      state,
      session_id,
      evalResult: { score, comment },
    })
  }

  // If we get here, score is still < target but we had no valid followups (rare).
  console.warn('[refine] ⚠ No valid follow-ups — doing final rewrite and finalizing.')
  const refineResult = await finalRefine(state)
  if (refineResult.ok) {
    state.fields = refineResult.rewritten
  } else {
    console.warn('[refine] ⚠ finalRefine failed, using current fields.')
  }

  return await finalize({
    supabase,
    state,
    session_id,
    evalResult: { score, comment },
  })
}



/* ──────────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────────── */

function normalize(raw: any): State {
  return {
    qa_log: Array.isArray(raw?.qa_log) ? raw.qa_log : [],
    transcript: Array.isArray(raw?.transcript) ? raw.transcript : [],
    fields: typeof raw?.fields === 'object' && raw?.fields ? raw.fields : {},
    field_schema: Array.isArray(raw?.field_schema) ? raw.field_schema : undefined,
    phase: raw?.phase || 'milestones',
    current_key: raw?.current_key ?? null,
    pending_followups: Array.isArray(raw?.pending_followups) ? raw.pending_followups : [],
    refine_passes: raw?.refine_passes || 0,
    finished: raw?.finished || false,
    dynamic_index: typeof raw?.dynamic_index === 'number' ? raw.dynamic_index : null,
  }
}

async function saveState(supabase: any, session_id: string, state: State) {
  const { error } = await supabase
    .from('guided_setup_sessions')
    .update({ state_json: state })
    .eq('id', session_id)

  if (error) {
    console.error('[saveState] Failed to update guided_setup_sessions:', error.message)
  }
}

function hasValue(v: any) {
  if (v === null || v === undefined) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'object') return Object.keys(v).length > 0
  return !!v
}

function nextUnfilledKey(fields: Fields): keyof Fields | null {
  for (const m of MILESTONES) {
    if (!hasValue(fields[m.key])) return m.key
  }
  return null
}

function countUnfilled(fields: Fields) {
  return MILESTONES.filter(m => !hasValue(fields[m.key])).length
}

function assignAnswerToField(state: State, key: keyof Fields, answer: string) {
  const text = answer.trim()
  if (!text) return

  if (key === 'rag_links') {
    // Only accept Drive/Dropbox/SharePoint links
    const urls = extractUrls(text).filter(u =>
      u.includes('drive.google.com') ||
      u.includes('dropbox.com') ||
      u.includes('sharepoint.com')
    )
    if (urls.length) {
      state.fields.rag_links = Array.from(new Set([...(state.fields.rag_links || []), ...urls]))
    }
    return
  }

  if (key === 'crawl_domains') {
    // Accept any http(s) URL that is NOT Drive/Dropbox/SharePoint
    const urls = extractUrls(text).filter(u =>
      !u.includes('drive.google.com') &&
      !u.includes('dropbox.com') &&
      !u.includes('sharepoint.com')
    )
    if (urls.length) {
      state.fields.crawl_domains = Array.from(new Set([...(state.fields.crawl_domains || []), ...urls]))
    }
    return
  }

  // Merge plain text fields normally
  const prev = (state.fields[key] as string | undefined) || ''
  state.fields[key] = prev ? `${prev}\n${text}` : text
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s]+/g) || []
  return matches.map(u => u.trim())
}

/* ──────────────────────────────────────────────────────────────────
   Dynamic field schema generator (stub for now)
   Later this can be driven by an LLM; for now it’s simple heuristics.
─────────────────────────────────────────────────────────────────── */

function generateDynamicFieldSchema(state: State): AgentField[] {
  const agentTypeRaw = state.fields.agent_type || ''
  const agentType = agentTypeRaw.toLowerCase()

  const fields: AgentField[] = []

  // Agent-specific fields
  if (agentType.includes('support') || agentType.includes('customer service')) {
    // Customer Support style agent
    fields.push(
      {
        key: 'product_list',
        label: 'Products / Services Supported',
        description: 'List the main products, kits, or services this support agent will help with.',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      },
      {
        key: 'common_issue_categories',
        label: 'Common Issue Categories',
        description:
          'Describe the top 5–10 types of problems customers usually have (e.g., contamination, shipping delays, refunds).',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      },
      {
        key: 'escalation_policy',
        label: 'Escalation Policy',
        description:
          'When should this agent hand off to a human? Describe any red flags or situations that must be escalated.',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      }
    )
  } else if (agentType.includes('tax') || agentType.includes('cpa')) {
    // Tax / CPA style agent
    fields.push(
      {
        key: 'jurisdictions',
        label: 'Jurisdictions / Regions',
        description: 'Which countries or states does this tax agent need to know (e.g., US federal, Texas, EU)?',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      },
      {
        key: 'tax_forms',
        label: 'Key Tax Forms & Documents',
        description: 'List the main forms or document types this agent will be asked about.',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      },
      {
        key: 'disclaimer_policy',
        label: 'Legal Disclaimer Policy',
        description:
          'Provide any legal disclaimers the agent must always state (e.g., not a substitute for a licensed CPA).',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      }
    )
  } else {
    // Generic / fallback agent-specific fields
    fields.push(
      {
        key: 'key_tasks',
        label: 'Key Tasks for This Agent',
        description: 'What are the main tasks this agent should perform day-to-day?',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      },
      {
        key: 'success_definition',
        label: 'What Does Success Look Like?',
        description: 'Describe how you’ll know this agent is doing a great job. What outcomes matter most?',
        type: 'textarea',
        group: 'agent_specific',
        value: null,
      }
    )
  }

  // Always include a custom notes field as a wildcard catch-all
  fields.push({
    key: 'custom_notes',
    label: 'Additional Context (Anything Else)',
    description:
      'Add any extra information that was not captured above. The prompt engineer will incorporate what matters.',
    type: 'textarea',
    group: 'custom',
    value: null,
  })

  return fields
}

/* ──────────────────────────────────────────────────────────────────
   Evaluation-only pass (score + followups, NO rewrite)
─────────────────────────────────────────────────────────────────── */

async function evaluateQuality(state: State): Promise<{
  score: number | null
  comment: string | null
  followups: string[]
}> {
  console.log('[debug] 🧪 Entering evaluateQuality()...')

  const sys = `
You are an expert prompt engineer evaluating an AI agent definition.

You will:
1. Analyze all the provided fields (agent_type, company, mission, tone, audience, topics, guardrails, rag_links, crawl_domains, formats, constraints, product_list, common_issue_categories, escalation_policy, custom_notes).
2. Use agent_type to understand what kind of agent this is and what it needs to do well.
3. Assign a numeric quality score from 0–10 for how complete and usable this agent definition is as a production prompt.
   • 10 = excellent, needs no further clarification.
   • 8–9 = strong and ready for use; only minor polish could be added.
   • 6–7 = usable but missing important details or clarity.
   • 0–5 = weak or incomplete; major gaps remain.
4. Identify any missing or unclear information and generate up to 3 targeted follow-up questions that, if answered, would most improve the agent’s prompt. Avoid asking for more detail about the exact same field in multiple rounds if it has already been expanded with concrete examples.
5. Each follow-up question must begin with the FIELD NAME in UPPERCASE (e.g., "MISSION: ...") and give clear guidance on what to add or improve.

Return ONLY valid JSON with all keys always present:
{
  "score": number (0–10),
  "comment": string,
  "followups": array of strings
}
If you are unsure, always include at least one follow-up question suggesting improvement areas.
`

  const user = `"fields": ${JSON.stringify(state.fields, null, 2)}\n\n"transcript_last_10": ${JSON.stringify(
    state.transcript.slice(-10),
    null,
    2
  )}`

  try {
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      }),
    })

    const raw = await resp.json()
    let txt = raw?.choices?.[0]?.message?.content || '{}'
    txt = txt.replace(/```json/i, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(txt)

    console.log('[debug] 🧪 Raw evaluation output:', txt)
    console.log('[debug] 🧪 Parsed evaluation result:', JSON.stringify(parsed, null, 2))

    const score = typeof parsed?.score === 'number' ? parsed.score : null
    const comment = typeof parsed?.comment === 'string' ? parsed.comment : null

    let followups: string[] = []
    if (Array.isArray(parsed?.followups)) {
      followups = parsed.followups
        .filter((q: any) => typeof q === 'string' && q.includes(':'))
        .slice(0, 3)
    }

    return { score, comment, followups }
  } catch (e) {
    console.error('[evaluateQuality] error:', e)
    return {
      score: null,
      comment: null,
      followups: [],
    }
  }
}

/* ──────────────────────────────────────────────────────────────────
   Final refine (rewrite + score + followups)
─────────────────────────────────────────────────────────────────── */

async function finalRefine(state: State): Promise<{
  ok: boolean
  rewritten: Fields
  followups: string[]
  score: number | null
  comment: string | null
}> {
  console.log('[debug] 🧠 Entering finalRefine() for deep thinking...')

  const sys = `
You are an expert prompt engineer whose goal is to rewrite an AI agent definition into a clean, production-ready prompt.

IMPORTANT: The current agent definition blocks are too short. Your job is to expand them into high-signal, production-grade guidance.
- Be detailed and specific.
- Avoid fluff.
- Use structure (headings, bullets, checklists).
- Prefer actionable policy, examples, and edge cases.
- You may use short paragraphs, but do not keep fields at 1–3 sentences.

You will:
1. Analyze all the provided fields (agent_type, company, mission, tone, audience, topics, guardrails, rag_links, crawl_domains, formats, constraints, product_list, common_issue_categories, escalation_policy, custom_notes, plus any dynamic fields).
2. Use agent_type to understand what kind of agent this is (e.g., Customer Support, Sales, Marketing Writer, Technical Assistant) and tailor all rewrites to that job.
3. Use recent training/feedback examples as an evidence pack when available. If examples reveal products, disclaimers, common customer questions, escalation steps, or compliance risks, include them.
4. Assign a numeric quality score from 0–10.
5. Rewrite every field clearly and consistently. ALWAYS paraphrase the user’s wording. Do NOT copy long paragraphs verbatim.

OUTPUT LENGTH TARGETS (high signal, not fluff):
- agent_type: 1 short phrase.
- company: ~800–1400 characters. Include what the company offers, who it serves, and what “good” looks like.
- mission: ~1200–2200 characters. Include outcomes, boundaries, what the agent must prioritize, and how to help users succeed.
- tone: 1 short phrase + 2–4 bullet examples of how it should sound.
- audience: ~500–900 characters. Include needs, goals, likely objections, and what they care about.
- topics: ~1200–2400 characters. Use a structured list grouped by category. Include subtopics.
- guardrails: ~2000–3500 characters. This is critical. Include explicit do/don’t rules, refusal/redirect style, safety/compliance, and what to do when uncertain.
- formats: ~400–800 characters. List supported output formats + any formatting rules.
- constraints: ~800–1600 characters. Include what to avoid, prohibited claims, and operational constraints.
- product_list / products_services_supported (if present or inferable): include a detailed, structured list. Do NOT return empty.
- escalation_policy (if present or inferable): include step-by-step escalation guidance.
- common_issue_categories / categories / additional content (if present): expand with practical detail.

STRUCTURE REQUIREMENTS
- Use Markdown-style structure inside string fields where helpful (e.g., "###", "-", numbered steps). Newlines are allowed.
- Guardrails must include:
  - What the agent can/can’t advise on
  - When to ask clarifying questions
  - When to refuse
  - When to escalate
  - Example safe responses for sensitive scenarios
- Topics should be grouped into buckets (e.g., "Onboarding", "Troubleshooting", "Safety", "Product guidance", etc.)

RAG LINKS
- rag_links / crawl_domains: keep as-is but ensure formatting is valid (array of URLs or clean string). Do not invent URLs.

IMPORTANT PRESERVATION RULE
- product_list / products_services_supported MUST be preserved if present; if evidence suggests products/services, include them. Do not return empty.

Return ONLY valid JSON with all keys:
{
  "rewritten": {...all fields...},
  "score": number,
  "comment": string,
  "followups": string[]
}
`

  // Build the user content payload cleanly
  const user = `"fields": ${JSON.stringify(state.fields, null, 2)}\n\n"transcript_last_10": ${JSON.stringify(
    state.transcript.slice(-10),
    null,
    2
  )}`;

  try {
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      }),
    })

    const raw = await resp.json()
    let txt = raw?.choices?.[0]?.message?.content || '{}'
    txt = txt.replace(/```json/i, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(txt)

    console.log('[debug] 🔍 Raw model output:', txt)
    console.log('[debug] 🧩 Parsed refine result:', JSON.stringify(parsed, null, 2))

const coreRewritten = sanitizeRewritten(parsed?.rewritten || {})
const score = typeof parsed?.score === 'number' ? parsed.score : null
const comment = typeof parsed?.comment === 'string' ? parsed.comment : null

// 🔐 Merge core rewrites into existing fields so we KEEP dynamic keys
const mergedFields: Fields & AnyRecord = {
  ...(state.fields as AnyRecord),
  ...coreRewritten,
}

let followups: string[] = []
if (Array.isArray(parsed?.followups)) {
  followups = parsed.followups
    .filter((q: any) => typeof q === 'string' && q.includes(':'))
    .slice(0, 3)
}

const adjustedScore = score ?? 0
const adjustedComment = comment ?? 'No comment from model.'

console.log(
  `[refine] 🔁 Round ${(state.refine_passes || 1)} complete — score: ${adjustedScore}/10`
)

return {
  ok: true,
  rewritten: mergedFields,
  followups,
  score: adjustedScore,
  comment: adjustedComment,
}
  } catch (e) {
    console.error('[finalRefine] error:', e)
    return {
      ok: false,
      rewritten: state.fields,
      followups: [],
      score: null,
      comment: null,
    }
  }
}

function sanitizeRewritten(obj: any): Fields {
  const out: Fields = {}

  const copyString = (key: keyof Fields) => {
    const val = obj?.[key]
    if (typeof val === 'string') {
      ;(out as any)[key] = val.trim()
    }
  }

  // Core fields
  copyString('agent_type')
  copyString('company')
  copyString('mission')
  copyString('tone')
  copyString('audience')
  copyString('topics')
  copyString('guardrails')
  copyString('formats')
  copyString('constraints')

  // Agent-specific dynamic fields
  copyString('product_list')
  copyString('common_issue_categories')
  copyString('escalation_policy')
  copyString('custom_notes')

  // RAG + crawl
  if (Array.isArray(obj?.rag_links)) {
    out.rag_links = obj.rag_links.filter((u: any) => typeof u === 'string')
  } else if (typeof obj?.rag_links === 'string') {
    // allow the model to return a single string and we’ll clean it later
    out.rag_links = obj.rag_links.trim()
  }

  if (Array.isArray(obj?.crawl_domains)) {
    out.crawl_domains = obj.crawl_domains.filter((u: any) => typeof u === 'string')
  } else if (typeof obj?.crawl_domains === 'string') {
    out.crawl_domains = obj.crawl_domains.trim()
  }

  // Safety net: copy any other string fields the model added that we didn’t explicitly map
  for (const [key, value] of Object.entries(obj)) {
    if (!(key in out) && typeof value === 'string') {
      ;(out as any)[key] = value.trim()
    }
  }

  return out
}

function parseFollowup(q: string): FollowUp | null {
  const [rawField, ...rest] = q.split(':')
  if (!rawField || rest.length === 0) return null
  const field = rawField.trim().toLowerCase() as keyof Fields
    const allowed: Array<keyof Fields> = [
    'agent_type',
    'company',
    'mission',
    'tone',
    'audience',
    'topics',
    'guardrails',
    'rag_links',
    'crawl_domains',
    'formats',
    'constraints',
    'product_list',
    'common_issue_categories',
    'escalation_policy',
    'custom_notes',
  ]
  if (!allowed.includes(field)) return null
  const question = rest.join(':').trim()
  return { field, question }
}

// ---------- FINALIZE ----------
async function finalize({ supabase, state, session_id, evalResult }: any) {
  const f = state.fields

  // 🧩 Build a cleaner, concise prompt
  const prompt = [
    f.agent_type && `You are a ${f.agent_type}.`,
    f.company && `You represent ${f.company}.`,
    f.mission && `Mission: ${f.mission}.`,
    f.tone && `Speak in a ${f.tone} tone.`,
    f.audience && `Primary audience: ${f.audience}.`,
  ]
    .filter(Boolean)
    .join(' ')

  // 🔹 Try to get authenticated user ID (main fix)
  let user_id: string | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) console.warn('[finalize] auth.getUser error:', error.message)
    if (data?.user?.id) user_id = data.user.id
  } catch (err) {
    console.warn('[finalize] failed to get user from auth context:', err)
  }

  // 🔹 If that fails, attempt session recovery
  if (!user_id) {
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) console.warn('[finalize] auth.getSession error:', sessionErr.message)
      user_id = sessionData?.session?.user?.id || null
    } catch (err) {
      console.warn('[finalize] failed to recover user session:', err)
    }
  }

  // 🔹 Final fallback (for local dev, not prod)
  if (!user_id) {
    user_id = process.env.SUPABASE_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000'
    console.warn('[finalize] ⚠️ Using fallback user_id:', user_id)
  } else {
    console.log('[finalize] ✅ Authenticated user_id:', user_id)
  }

  // 🤖 Create clean, meaningful agent name & subtitle
  const companyName = f.company?.split(/[.!?]/)[0]?.trim() || 'Unnamed Company'
  const shortName = `${companyName} AI Agent`

  const missionSnippet =
    f.mission?.split(/[.!?]/)[0]?.trim() ||
    'Assists with your company’s key operations.'
  const toneSnippet =
    f.tone?.split(/[.!?]/)[0]?.trim() ||
    'friendly and professional'
  const audienceSnippet =
    f.audience?.split(/[.!?]/)[0]?.trim() ||
    'team members and customers'

  const shortDesc = `${missionSnippet} Speaks in a ${toneSnippet} tone for ${audienceSnippet}.`
    .replace(/\s+/g, ' ')
    .slice(0, 150)
    .trim()

  // 🔗 Normalize rag_sources & crawl_domains (always arrays)
  const ragSources =
    Array.isArray(f.rag_links)
      ? f.rag_links
      : typeof f.rag_links === 'string'
      ? extractUrls(f.rag_links)
      : []

  const crawlDomains =
    Array.isArray(f.crawl_domains)
      ? f.crawl_domains
      : typeof f.crawl_domains === 'string'
      ? extractUrls(f.crawl_domains)
      : []

  // ✅ Create agent entry
  const { data, error } = await supabase
    .from('agents')
    .insert([
      {
        user_id,
        name: shortName,
        description: shortDesc,
        primary_prompt: prompt,
        company: f.company || null,
        mission: f.mission || null,
        tone: f.tone || null,
        audience: f.audience || null,
        topics: f.topics || null,
        guardrails: f.guardrails || null,
        formats: f.formats || null,
        constraints: f.constraints || null,
        rag_sources: ragSources,
        crawl_domains: crawlDomains,
        onboarding_summary: f,
        fine_tune_status: 'not_started',
        quality_score: evalResult?.score || null,
        quality_feedback: evalResult?.comment || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[finalize] ❌ Insert error:', error.message)
    return NextResponse.json({
      done: true,
      message: 'Agent created but DB policy blocked record.',
      error: error.message,
    })
  }

  // ✅ Mark session complete
  state.finished = true
  await supabase
    .from('guided_setup_sessions')
    .update({ state_json: state, status: 'complete' })
    .eq('id', session_id)

  console.log('[finalize] 🎉 Agent created successfully with ID:', data.id)

  return NextResponse.json({
    done: true,
    agent_id: data.id,
    message: '🎉 Setup complete with quality rating!',
  })
}
}