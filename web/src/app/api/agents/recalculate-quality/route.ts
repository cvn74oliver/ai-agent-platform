import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

// Keep the quality target the same as guided-setup
const TARGET_QUALITY_SCORE = 8

const OPENAI_TIMEOUT_MS = 18_000
const OPENAI_MAX_RETRIES = 1

// Per-phase defaults
const OPENAI_TIMEOUT_EVAL_MS = 18_000
const OPENAI_TIMEOUT_REFINE_MS = 70_000

// Circuit breaker: record last OpenAI abort time
let lastOpenAIAbortAt = 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeModelJson(rawText: string): string {
  let t = (rawText || '').trim()
  t = t.replace(/```json/i, '').replace(/```/g, '').trim()
  // remove trailing commas before } or ] (common LLM issue)
  t = t.replace(/,(\s*[}\]])/g, '$1')
  return t
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const json = await res.json().catch(() => null)
    return { res, json }
  } finally {
    clearTimeout(id)
  }
}

async function callOpenAI(
  messages: any[],
  temperature: number,
  opts?: { timeoutMs?: number; maxRetries?: number; responseFormat?: any }
) {
  let lastErr: any = null
  const timeoutMs = opts?.timeoutMs ?? OPENAI_TIMEOUT_MS
  const maxRetries = opts?.maxRetries ?? OPENAI_MAX_RETRIES

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { res, json } = await fetchJsonWithTimeout(
        OPENAI_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        messages,
        ...(opts?.responseFormat ? { response_format: opts.responseFormat } : {}),
      }),
        },
        timeoutMs
      )

      if (!res.ok) {
        const msg = json?.error?.message || res.statusText || 'OpenAI request failed'
        throw new Error(`OpenAI ${res.status}: ${msg}`)
      }

      const rawContent = json?.choices?.[0]?.message?.content || '{}'
      return normalizeModelJson(rawContent)
    } catch (e: any) {
      lastErr = e
      const isLast = attempt >= maxRetries

      const msg = String(e?.message || e)
      const name = String(e?.name || '')
      const code = String((e as any)?.code || '')
      const causeCode = String((e as any)?.cause?.code || '')

      // Do not retry timeouts/aborts/socket closes; they tend to repeat and just hang the UI.
      const nonRetryable =
        name === 'AbortError' ||
        code === 'UND_ERR_SOCKET' ||
        causeCode === 'UND_ERR_SOCKET' ||
        msg.includes('This operation was aborted') ||
        msg.includes('other side closed')

      if (nonRetryable) lastOpenAIAbortAt = Date.now()

      const logFn = nonRetryable ? console.warn : console.error
      logFn('[recalculate-quality] OpenAI call failed', {
        attempt,
        isLast,
        nonRetryable,
        error: msg,
      })

      if (isLast || nonRetryable) break
      await sleep(400 * (attempt + 1))
    }
  }

  throw lastErr || new Error('OpenAI call failed')
}

function charLen(v: any): number {
  return typeof v === 'string' ? v.trim().length : 0
}

function isRewriteTooShort(rewritten: any): boolean {
  // Conservative minimums (characters). We want substance, not fluff.
  const mins: Record<string, number> = {
    company: 600,
    mission: 900,
    topics: 900,
    guardrails: 1400,
    constraints: 500,
  }

  for (const [k, min] of Object.entries(mins)) {
    if (charLen(rewritten?.[k]) < min) return true
  }
  return false
}

type Fields = {
  agent_type?: string
  company?: string
  mission?: string
  tone?: string
  audience?: string
  topics?: string
  guardrails?: string
  rag_links?: string[] | string
  crawl_domains?: string[] | string
  formats?: string
  constraints?: string
  // plus any dynamic fields like product_list, escalation_policy, etc.
  [key: string]: any
}

type Turn = { role: 'user' | 'assistant'; text: string }

type State = {
  fields: Fields
  transcript: Turn[]
}

type EvidenceExample = {
  source?: string
  tags?: any
  user_input?: string | null
  agent_output?: string | null
  quality_label?: string | null
  created_at?: string | null
}

type RagEvidence = {
  source_type?: string | null
  source_url?: string | null
  created_at?: string | null
  content?: string | null
}

const EVAL_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'agent_quality_eval',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'comment', 'followups'],
      properties: {
        score: { type: 'number' },
        comment: { type: 'string' },
        followups: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const

const REFINE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'agent_prompt_refine',
    // Use strict schema so OpenAI reliably returns valid JSON with the allowed keys.
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['rewritten', 'score', 'comment', 'followups'],
      properties: {
        rewritten: {
          type: 'object',
          additionalProperties: false,
          properties: {
            agent_type: { type: 'string' },
            company: { type: 'string' },
            mission: { type: 'string' },
            tone: { type: 'string' },
            audience: { type: 'string' },
            topics: { type: 'string' },
            guardrails: { type: 'string' },
            formats: { type: 'string' },
            constraints: { type: 'string' },

            product_list: { type: 'string' },
            products_services_supported: { type: 'string' },
            escalation_policy: { type: 'string' },
            common_issue_categories: { type: 'string' },
            custom_notes: { type: 'string' },

            rag_links: { type: 'array', items: { type: 'string' } },
            crawl_domains: { type: 'array', items: { type: 'string' } },
          },
          required: [
            'agent_type',
            'company',
            'mission',
            'tone',
            'audience',
            'topics',
            'guardrails',
            'formats',
            'constraints',
            'product_list',
            'products_services_supported',
            'escalation_policy',
            'common_issue_categories',
            'custom_notes',
            'rag_links',
            'crawl_domains',
          ],
        },
        score: { type: 'number' },
        comment: { type: 'string' },
        followups: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const

function buildFieldDiff(opts: {
  before: any
  after: any
  keys: string[]
}): Array<{ key: string; before: string | null; after: string | null; delta_chars: number }> {
  const out: Array<{ key: string; before: string | null; after: string | null; delta_chars: number }> = []
  const b = opts.before || {}
  const a = opts.after || {}

  for (const key of opts.keys) {
    const beforeVal = typeof b?.[key] === 'string' ? b[key] : null
    const afterVal = typeof a?.[key] === 'string' ? a[key] : null

    // Only include keys that actually changed (including added/removed)
    if ((beforeVal ?? '') !== (afterVal ?? '')) {
      const delta = (afterVal ? afterVal.length : 0) - (beforeVal ? beforeVal.length : 0)
      out.push({ key, before: beforeVal, after: afterVal, delta_chars: delta })
    }
  }

  return out
}

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  const { agent_id, force_refine, dry_run } = await req.json()
  const dryRun = dry_run === true
  const forceRefine = force_refine === true
  if (!agent_id) {
    return NextResponse.json(
      { ok: false, error: 'agent_id is required' },
      { status: 400 },
    )
  }

  // 1) Load the agent and its onboarding_summary
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agent_id)
    .single()

  if (error || !agent?.onboarding_summary) {
    console.error('[recalculate-quality] load error:', error)
    return NextResponse.json(
      { ok: false, error: 'Agent not found or missing onboarding_summary' },
      { status: 404 },
    )
  }

  const prevQualityScore = typeof agent.quality_score === 'number' ? agent.quality_score : null
  const prevQualityFeedback = typeof agent.quality_feedback === 'string' ? agent.quality_feedback : null

  const state: State = {
    fields: agent.onboarding_summary as Fields,
    transcript: [], // we don’t need transcript for this pass
  }

  // Evidence pack: recent training/feedback examples so the Prompt Engineer can rewrite using real data
  const { data: exRows, error: exErr } = await supabase
    .from('fine_tune_examples')
    .select('source, tags, user_input, agent_output, quality_label, created_at')
    .eq('agent_id', agent_id)
    .order('created_at', { ascending: false })
    .limit(25)

  if (exErr) {
    console.error('[recalculate-quality] fine_tune_examples load error:', exErr)
  }

  const recentExamples: EvidenceExample[] = (exRows || []) as any

  // RAG evidence pack: recent embedded knowledge chunks (Drive + crawled pages)
  // We keep this small to avoid huge prompts.
  const { data: ragRows, error: ragErr } = await supabase
    .from('rag_documents')
    .select('source_type, source_url, content, created_at')
    .eq('agent_id', agent_id)
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60)

  if (ragErr) {
    console.error('[recalculate-quality] rag_documents load error:', ragErr)
  }

  const ragEvidence: RagEvidence[] = compactRagEvidence((ragRows || []) as any, 10)

  console.log('[recalculate-quality] rag evidence pack:', {
    total_rows: Array.isArray(ragRows) ? ragRows.length : 0,
    packed: ragEvidence.length,
    sample_url: ragEvidence?.[0]?.source_url || null,
  })

  const evalExamples = compactEvidence(recentExamples, 10)
  const refineExamples = compactEvidence(recentExamples, 8)

  // 2) Evaluate quality
  const evalResult = await evaluateQuality(state, evalExamples, ragEvidence)
  const score = typeof evalResult.score === 'number' ? evalResult.score : null
  const comment = typeof evalResult.comment === 'string' ? evalResult.comment : null

  console.log(
    `[recalculate-quality] current score for agent ${agent_id}: ${score ?? 'n/a'}/10`,
  )

    // 3) Run final refine rewrite only when needed.
    // - Skip if evaluation failed (no numeric score)
    // - Skip if OpenAI just aborted recently (circuit breaker)
    // - Skip unless forced OR the agent is below the target score
    //   (The target score is our gating signal for whether we should spend time rewriting.)
  const evalFailed = score === null

  // Circuit breaker: if OpenAI just aborted in the last 60s, skip a second call.
  const openAIRecentlyAborted = Date.now() - lastOpenAIAbortAt < 60_000

  // IMPORTANT: Normal recalc should be fast.
  // Only run the expensive rewrite when explicitly forced OR when below target quality.
  const needsRefine =
    forceRefine || (typeof score === 'number' && score < TARGET_QUALITY_SCORE)

  const refineResult = !evalFailed && !openAIRecentlyAborted && needsRefine
    ? await finalRefine(state, refineExamples, ragEvidence)
    : { ok: false, rewritten: state.fields, followups: [], score: null, comment: null }

  console.log('[recalculate-quality] refine ran?', {
    forceRefine,
    evalFailed,
    openAIRecentlyAborted,
    needsRefine,
    refineOk: refineResult.ok,
  })

  const rewrittenFields = refineResult.ok ? refineResult.rewritten : state.fields

  const shouldUpdateQuality =
    typeof refineResult?.score === 'number' || typeof evalResult?.score === 'number'

  // Prefer finalRefine score/comment when available
  const finalScore =
    typeof refineResult?.score === 'number'
      ? refineResult.score
      : typeof evalResult?.score === 'number'
      ? evalResult.score
      : prevQualityScore ?? 0

  const finalComment =
    typeof refineResult?.comment === 'string'
      ? refineResult.comment
      : typeof evalResult?.comment === 'string'
      ? evalResult.comment
      : prevQualityFeedback ?? 'No evaluation comment.'

  // Merge rewrite onto existing fields so omitted keys are preserved.
  // Also guard key fields from being wiped by empty/omitted rewrites.
  const existingFields = state.fields as any
  const rewrittenAny = rewrittenFields as any
  const mergedFields: Fields = {
    ...existingFields,
    ...rewrittenAny,
  }

  // Protect product list fields from being wiped
  for (const key of ['product_list', 'products_services_supported'] as const) {
    const v = rewrittenAny?.[key]
    const emptyArray = Array.isArray(v) && v.length === 0
    const emptyString = typeof v === 'string' && v.trim().length === 0
    if (v === undefined || v === null || emptyArray || emptyString) {
      if (existingFields?.[key] !== undefined) {
        ;(mergedFields as any)[key] = existingFields[key]
      }
    }
  }

    // Protect core contract fields from being unintentionally reduced
  const coreContractFields = [
    'company',
    'mission',
    'audience',
    'topics',
    'guardrails',
    'formats',
    'constraints',
    'product_list',
    'products_services_supported',
    'common_issue_categories',
    'escalation_policy',
    'custom_notes',
  ] as const

  for (const key of coreContractFields) {
    const oldVal =
      typeof existingFields?.[key] === 'string'
        ? existingFields[key].trim()
        : null

    const newVal =
      typeof rewrittenAny?.[key] === 'string'
        ? rewrittenAny[key].trim()
        : null

    if (oldVal && newVal) {
      // If rewrite shrank field drastically (more than 30%), preserve original
      if (newVal.length < oldVal.length * 0.7) {
        ;(mergedFields as any)[key] = oldVal
      }
    }

    // If rewrite removed the field entirely, preserve original
    if (oldVal && !newVal) {
      ;(mergedFields as any)[key] = oldVal
    }
  }

  const contractKeysForDiff = [
    'agent_type',
    'company',
    'mission',
    'tone',
    'audience',
    'topics',
    'guardrails',
    'formats',
    'constraints',
    'product_list',
    'products_services_supported',
    'common_issue_categories',
    'escalation_policy',
    'custom_notes',
    'rag_links',
    'crawl_domains',
  ]

  const fieldDiff = buildFieldDiff({
    before: existingFields,
    after: mergedFields,
    keys: contractKeysForDiff,
  })

  // 4) Build primary prompt (same pattern as finalize in guided-setup)
  const f = mergedFields
  const promptParts = [
    f.agent_type && `You are a ${f.agent_type}.`,
    f.company && `You represent ${f.company}.`,
    f.mission && `Mission: ${f.mission}.`,
    f.tone && `Speak in a ${f.tone} tone.`,
    f.audience && `Primary audience: ${f.audience}.`,
  ].filter(Boolean)

  const primaryPrompt = promptParts.join(' ')
  
  // Normalize rag_sources & crawl_domains
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

  // ─────────────────────────────────────────────
  // DRY RUN: compute everything but do NOT write to the DB.
  // This is used to safely validate that RAG evidence is influencing the rewrite
  // without risking overwriting Q&A-earned contract fields.
  // ─────────────────────────────────────────────
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      data: {
        dry_run: true,
        agent_id,
        score: finalScore,
        comment: finalComment,
        eval: {
          score: score,
          comment: comment,
          followups: evalResult.followups,
        },
        refine: {
          ran: refineResult.ok,
          forced: forceRefine,
        },
        diff: fieldDiff,
        // Helpful for debugging / UI preview (but do not persist)
        preview_onboarding_summary: mergedFields,
      },
    })
  }

  // 5) Update the agent with new fields + quality score
  const { data: updated, error: updErr } = await supabase
    .from('agents')
    .update({
      onboarding_summary: mergedFields,
      primary_prompt: primaryPrompt,
      rag_sources: ragSources,
      crawl_domains: crawlDomains,
      ...(shouldUpdateQuality ? { quality_score: finalScore, quality_feedback: finalComment } : {}),
    })
    .eq('id', agent_id)
    .select()
    .single()

  if (updErr) {
    console.error('[recalculate-quality] update error:', updErr)
    return NextResponse.json(
      { ok: false, error: updErr.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    data: {
      agent: updated,
    },
  })
}

/* ──────────────────────────────────────────────────────────────────
   Shared helpers: evaluateQuality + finalRefine
─────────────────────────────────────────────────────────────────── */

async function evaluateQuality(
  state: State,
  recentExamples: EvidenceExample[],
  ragEvidence: RagEvidence[]
): Promise<{
  score: number | null
  comment: string | null
  followups: string[]
}> {
  console.log('[recalculate-quality] 🧪 Entering evaluateQuality()...')

  const sys = `
You are an expert prompt engineer evaluating an AI agent definition.

You will:
1. Analyze all the provided fields (agent_type, company, mission, tone, audience, topics, guardrails, rag_links, crawl_domains, formats, constraints).
2. Use agent_type to understand what kind of agent this is and what it needs to do well.
3. Assign a numeric quality score from 0–10 for how complete and usable this agent definition is as a production prompt.
   • 10 = excellent, needs no further clarification.
   • 8–9 = strong and ready for use; only minor polish could be added.
   • 6–7 = usable but missing important details or clarity.
   • 0–5 = weak or incomplete; major gaps remain.
4. Identify any missing or unclear information and generate up to 3 targeted follow-up questions that, if answered, would most improve the agent’s prompt.
5. You will also be given recent training/feedback examples (Q/A pairs). Use them to infer missing details and avoid asking follow-ups for info already answered in examples.
   If examples reveal compliance risks or missing product/service context, mention it explicitly.
6. You will also be given a small RAG evidence pack (rag_evidence) sourced from crawled pages + Google Drive. Use it to infer missing details and strengthen your evaluation.

Return ONLY valid JSON with all keys:
{
  "score": number,
  "comment": string,
  "followups": string[]
}
`

  const user = JSON.stringify(
    {
      fields: state.fields,
      recent_examples: recentExamples,
      rag_evidence: ragEvidence,
    },
    null,
    2
  )


  try {
    const txt = await callOpenAI(
      [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      0.1,
      { timeoutMs: OPENAI_TIMEOUT_EVAL_MS, maxRetries: 0, responseFormat: EVAL_RESPONSE_FORMAT }
    )

    // Debug: log a short preview of the model output (avoid huge one-line JSON spam)
    console.log('[recalculate-quality] 🧪 eval raw (first 500 chars):', txt.slice(0, 500))

    let parsed: any = null
    try {
      parsed = JSON.parse(txt)
    } catch (e) {
      console.error('[recalculate-quality] evaluateQuality JSON parse failed', e)
      return {
        score: null,
        comment: 'Evaluation failed due to malformed model output.',
        followups: [],
      }
    }

    // Debug: log a summary of the parsed output
    console.log('[recalculate-quality] 🧪 eval parsed:', {
      score: parsed?.score,
      followups_count: Array.isArray(parsed?.followups) ? parsed.followups.length : 0,
    })

    const score = typeof parsed?.score === 'number' ? parsed.score : null
    const comment = typeof parsed?.comment === 'string' ? parsed.comment : null
    const followups = Array.isArray(parsed?.followups)
      ? parsed.followups.filter((q: any) => typeof q === 'string')
      : []

    return { score, comment, followups }
  } catch (e) {
    console.error('[recalculate-quality] evaluateQuality error (skipping refine):', e)
    return { score: null, comment: null, followups: [] }
  }
}

async function finalRefine(
  state: State,
  recentExamples: EvidenceExample[],
  ragEvidence: RagEvidence[]
): Promise<{
  ok: boolean
  rewritten: Fields
  followups: string[]
  score: number | null
  comment: string | null
}> {
  console.log('[recalculate-quality] 🧠 Entering finalRefine()...')

  const sys = `
You are an expert prompt engineer whose goal is to rewrite an AI agent definition into a clean, production-ready prompt.

IMPORTANT: The current agent definition blocks are too short. Your job is to expand them into high-signal, production-grade guidance.
- Be detailed and specific.
- Avoid fluff.
- Use structure (headings, bullets, checklists).
- Prefer actionable policy, examples, and edge cases.
- You may use short paragraphs, but do not keep fields at 1–3 sentences.

You will:
1. Analyze all the provided fields (agent_type, company, mission, tone, audience, topics, guardrails, rag_links, crawl_domains, formats, constraints, plus any dynamic fields).
2. Use agent_type to understand what kind of agent this is (e.g., Customer Support, Sales, Marketing Writer, Technical Assistant) and tailor all rewrites to that job.
3. Use the recent training/feedback examples as the PRIMARY authoritative signal.
   - These examples reflect deliberate Improve Quality with Q&A refinement and manual training.
   - If there is any tension between examples and RAG evidence, the examples ALWAYS win.
   - Do not remove, weaken, or override policies clearly expressed in examples.

3b. You will also be given a small RAG evidence pack (rag_evidence) sourced from crawled pages + Google Drive.
   - Use it ONLY to add accurate, factual detail or fill gaps.
   - Do NOT let RAG evidence override tone, guardrails, escalation logic, or positioning established in the fields or examples.
   - RAG evidence is supplemental, not authoritative.

3c. PRESERVATION REQUIREMENT:
   - Treat the existing field content as a canonical contract shaped by iterative Q&A refinement.
   - Expand and clarify it, but do NOT shrink, delete, or substantially change intent unless explicitly contradicted by examples.
   - Never remove escalation logic, safety boundaries, or product definitions already present.
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
- common_issues / categories / additional_content (if present): expand with practical detail.

STRUCTURE REQUIREMENTS
- IMPORTANT: All rewritten fields must be STRINGS (single text blocks with newlines allowed). Do NOT return arrays or objects for fields like topics, guardrails, constraints, formats, product_list, or common_issue_categories. The only exceptions that may be arrays are rag_links and crawl_domains.
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

  const user = JSON.stringify(
    {
      fields: state.fields,
      recent_examples: recentExamples,
      rag_evidence: ragEvidence,
    },
    null,
    2
  );

  try {
    async function runOnce(extraUserNudge?: string) {
      const messages: any[] = [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ]

      if (extraUserNudge) {
        messages.push({ role: 'user', content: extraUserNudge })
      }

      const txt = await callOpenAI(messages, extraUserNudge ? 0.2 : 0.3, {
        timeoutMs: OPENAI_TIMEOUT_REFINE_MS,
        maxRetries: 0,
        responseFormat: REFINE_RESPONSE_FORMAT,
      })

      // Debug: log a short preview instead of the full one-line JSON
      console.log('[recalculate-quality] 🔍 refine raw (first 700 chars):', txt.slice(0, 700))

      let parsed: any = null
      try {
        parsed = JSON.parse(txt)
      } catch (e) {
        console.error('[recalculate-quality] finalRefine JSON parse failed', e)
        parsed = { rewritten: state.fields, score: null, comment: null, followups: [] }
      }
      // Debug: log a summary of the parsed output
      console.log('[recalculate-quality] 🔍 refine parsed:', {
        score: parsed?.score,
        rewritten_keys: parsed?.rewritten ? Object.keys(parsed.rewritten).length : 0,
      })
      const rewritten = sanitizeRewritten(parsed?.rewritten || {})
      const score = typeof parsed?.score === 'number' ? parsed.score : null
      const comment = typeof parsed?.comment === 'string' ? parsed.comment : null
      const followups: string[] = Array.isArray(parsed?.followups)
        ? parsed.followups.filter((q: any) => typeof q === 'string')
        : []

      return { rewritten, score, comment, followups }
    }

    let out = await runOnce()

    if (isRewriteTooShort(out.rewritten)) {
      try {
        const retry = await runOnce(
          'Your previous rewrite is still too short and under-detailed. Expand each key field (company, mission, topics, guardrails, constraints) with structured bullets, edge cases, and examples. Do NOT add fluff.'
        )
        out = retry
      } catch (e) {
        console.error('[recalculate-quality] retry failed, keeping first rewrite', e)
      }
    }

    return {
      ok: true,
      rewritten: out.rewritten,
      followups: out.followups,
      score: out.score,
      comment: out.comment,
    }
  } catch (e) {
    // Reduce stack spam for aborts/expected network errors
    const msg = String((e as any)?.message || e)
    const name = String((e as any)?.name || '')
    const code = String((e as any)?.code || '')
    const causeCode = String((e as any)?.cause?.code || '')

    const isAbort =
      name === 'AbortError' ||
      code === 'UND_ERR_SOCKET' ||
      causeCode === 'UND_ERR_SOCKET' ||
      msg.includes('This operation was aborted') ||
      msg.includes('other side closed')

    if (isAbort) {
      console.warn('[recalculate-quality] finalRefine aborted (skipping rewrite):', msg)
    } else {
      console.error('[recalculate-quality] finalRefine error (skipping rewrite):', e)
    }
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
  if (typeof obj?.agent_type === 'string') out.agent_type = obj.agent_type.trim()
  if (typeof obj?.company === 'string') out.company = obj.company.trim()
  if (typeof obj?.mission === 'string') out.mission = obj.mission.trim()
  if (typeof obj?.tone === 'string') out.tone = obj.tone.trim()
  if (typeof obj?.audience === 'string') out.audience = obj.audience.trim()
  if (typeof obj?.topics === 'string') out.topics = obj.topics.trim()
  else if (obj?.topics !== undefined) out.topics = JSON.stringify(obj.topics, null, 2)

  if (typeof obj?.guardrails === 'string') out.guardrails = obj.guardrails.trim()
  else if (obj?.guardrails !== undefined) out.guardrails = JSON.stringify(obj.guardrails, null, 2)
  if (Array.isArray(obj?.rag_links)) out.rag_links = obj.rag_links.filter((u: any) => typeof u === 'string')
  else if (typeof obj?.rag_links === 'string') out.rag_links = obj.rag_links.trim()

  if (Array.isArray(obj?.crawl_domains)) out.crawl_domains = obj.crawl_domains.filter((u: any) => typeof u === 'string')
  else if (typeof obj?.crawl_domains === 'string') out.crawl_domains = obj.crawl_domains.trim()

  if (typeof obj?.formats === 'string') out.formats = obj.formats.trim()
  else if (obj?.formats !== undefined) out.formats = JSON.stringify(obj.formats, null, 2)

  if (typeof obj?.constraints === 'string') out.constraints = obj.constraints.trim()
  else if (obj?.constraints !== undefined) out.constraints = JSON.stringify(obj.constraints, null, 2)

  if (typeof obj?.escalation_policy === 'string') (out as any).escalation_policy = obj.escalation_policy.trim()
  else if (obj?.escalation_policy !== undefined) (out as any).escalation_policy = JSON.stringify(obj.escalation_policy, null, 2)

  if (typeof obj?.common_issue_categories === 'string') (out as any).common_issue_categories = obj.common_issue_categories.trim()
  else if (obj?.common_issue_categories !== undefined) (out as any).common_issue_categories = JSON.stringify(obj.common_issue_categories, null, 2)

  if (typeof obj?.product_list === 'string') (out as any).product_list = obj.product_list.trim()
  else if (obj?.product_list !== undefined) (out as any).product_list = JSON.stringify(obj.product_list, null, 2)

  if (typeof obj?.products_services_supported === 'string') (out as any).products_services_supported = obj.products_services_supported.trim()
  else if (obj?.products_services_supported !== undefined) (out as any).products_services_supported = JSON.stringify(obj.products_services_supported, null, 2)

  // Keep any extra dynamic fields too
  for (const key of Object.keys(obj)) {
    if (key in out) continue

    if (key === 'rag_links' || key === 'crawl_domains') {
      ;(out as any)[key] = obj[key]
      continue
    }

    const v = obj[key]
    if (typeof v === 'string') {
      ;(out as any)[key] = v
    } else if (v !== null && v !== undefined) {
      ;(out as any)[key] = JSON.stringify(v, null, 2)
    }
  }

  return out
}

function truncateText(v: any, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t) return null
  return t.length > max ? t.slice(0, max) + '…' : t
}

function compactEvidence(examples: EvidenceExample[], limit: number): EvidenceExample[] {
  return (examples || []).slice(0, limit).map((ex) => ({
    source: ex.source,
    tags: ex.tags,
    quality_label: ex.quality_label,
    created_at: ex.created_at,
    user_input: truncateText(ex.user_input, 160),
    agent_output: truncateText(ex.agent_output, 260),
  }))
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s,]+/g) || []
  return matches.map((u) => u.trim())
}
function compactRagEvidence(rows: RagEvidence[], limit: number): RagEvidence[] {
  const out: RagEvidence[] = []
  const seen = new Set<string>()

  for (const r of rows || []) {
    const url = typeof r?.source_url === 'string' ? r.source_url : ''
    if (url && seen.has(url)) continue
    if (url) seen.add(url)

    out.push({
      source_type: r?.source_type ?? null,
      source_url: r?.source_url ?? null,
      created_at: r?.created_at ?? null,
      content: truncateText(r?.content, 700),
    })

    if (out.length >= limit) break
  }

  return out
}