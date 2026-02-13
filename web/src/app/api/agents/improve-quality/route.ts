import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRecord = Record<string, any>

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

type EvalResult = {
  score: number | null
  comment: string | null
  followups: string[]
}

// Small helper: run the evaluator on an onboarding_summary object
async function evaluateAgentFields(fields: AnyRecord, recentExamples: AnyRecord[]): Promise<EvalResult> {
  const sys = `
You are an expert prompt engineer evaluating an AI agent configuration.

You will:
1. Analyze all provided fields (agent_type, company, mission, tone, audience, topics, guardrails, rag_links, crawl_domains, formats, constraints, product_list, common_issue_categories, escalation_policy, custom_notes).
2. Use agent_type to understand what kind of agent this is and what it needs to do well.
3. Assign a numeric quality score from 0–10 for how complete and usable this definition is as a production-ready prompt.
   • 10 = excellent, needs no further clarification.
   • 8–9 = strong and ready for use; only minor polish could be added.
   • 6–7 = usable but missing important details or clarity.
   • 0–5 = weak or incomplete; major gaps remain.
4. Identify missing or unclear information and generate up to 3 targeted follow-up questions that, if answered, would most improve the agent’s prompt.
5. Each follow-up question must begin with the FIELD NAME in UPPERCASE (e.g., "MISSION: ...") and give clear guidance on what to add or improve.
6. You will also be given a small sample of recent training/feedback examples (Q/A pairs) from real usage and manual training.
   • Use these examples to infer missing details that should be added to the agent fields.
   • Do NOT ask follow-up questions for information that is already clearly answered in the examples.
   • If examples reveal gaps or policy risks (e.g., legality/guardrails), prioritize followups that will tighten compliance.

Return ONLY valid JSON:
{
  "score": number,
  "comment": string,
  "followups": string[]
}
`

  const user = JSON.stringify(
    {
      fields,
      recent_examples: recentExamples,
    },
    null,
    2
  )

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

    const score =
      typeof parsed?.score === 'number'
        ? parsed.score
        : null
    const comment =
      typeof parsed?.comment === 'string'
        ? parsed.comment
        : null

    let followups: string[] = []
    if (Array.isArray(parsed?.followups)) {
      followups = parsed.followups
        .filter((q: any) => typeof q === 'string' && q.includes(':'))
        .slice(0, 3)
    }

    return {
      score,
      comment,
      followups,
    }
  } catch (err) {
    console.error('[improve-quality] evaluate error:', err)
    return {
      score: null,
      comment: null,
      followups: [],
    }
  }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  const { agent_id } = await req.json().catch(() => ({} as AnyRecord))
  if (!agent_id || typeof agent_id !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'agent_id is required' },
      { status: 400 }
    )
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, onboarding_summary, quality_score, quality_feedback')
    .eq('id', agent_id)
    .single()

  if (error || !agent) {
    console.error('[improve-quality] load error:', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Agent not found or access denied.' },
      { status: 404 }
    )
  }

  const fields: AnyRecord =
    (agent.onboarding_summary && typeof agent.onboarding_summary === 'object')
      ? agent.onboarding_summary
      : {}

  if (!Object.keys(fields).length) {
    return NextResponse.json(
      { ok: false, error: 'Agent has no onboarding_summary to evaluate yet.' },
      { status: 400 }
    )
  }

  const { data: exRows, error: exErr } = await supabase
    .from('fine_tune_examples')
    .select('source, tags, user_input, agent_output, quality_label, created_at')
    .eq('agent_id', agent_id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (exErr) {
    console.error('[improve-quality] fine_tune_examples load error:', exErr)
  }

  const recentExamples = (exRows || []) as AnyRecord[]

  const evalResult = await evaluateAgentFields(fields, recentExamples)
  console.log('[improve-quality] evalResult:', evalResult)

  return NextResponse.json({
    ok: true,
    data: {
      agent_id,
      previous_score: agent.quality_score ?? null,
      previous_comment: agent.quality_feedback ?? null,
      score: evalResult.score,
      comment: evalResult.comment,
      followups: evalResult.followups,
    },
  })
}