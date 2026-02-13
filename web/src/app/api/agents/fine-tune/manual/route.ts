import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Keep this in sync with preview/route.ts
const BASE_TOPICS: {
  topic: string
  dimension: 'identity' | 'policy' | 'escalation' | 'domain'
  min_examples: number
}[] = [
  {
    topic: 'agent_identity_and_mission',
    dimension: 'identity',
    min_examples: 3,
  },
  {
    topic: 'tone_and_style',
    dimension: 'identity',
    min_examples: 3,
  },
  {
    topic: 'legal_and_compliance_guardrails',
    dimension: 'policy',
    min_examples: 5,
  },
  {
    topic: 'escalation_and_handoff_rules',
    dimension: 'escalation',
    min_examples: 4,
  },
]

const BASE_TOPIC_CONFIG: Record<
  string,
  { dimension: 'identity' | 'policy' | 'escalation' | 'domain'; min_examples: number }
> = BASE_TOPICS.reduce((acc, curr) => {
  acc[curr.topic] = { dimension: curr.dimension, min_examples: curr.min_examples }
  return acc
}, {} as Record<string, { dimension: 'identity' | 'policy' | 'escalation' | 'domain'; min_examples: number }>)

function classifyTopic(topic: string): 'identity' | 'policy' | 'escalation' | 'domain' {
  const t = topic.toLowerCase()

  if (t.includes('mission') || t.includes('tone') || t.includes('identity')) {
    return 'identity'
  }
  if (t.includes('policy') || t.includes('refund') || t.includes('legal')) {
    return 'policy'
  }
  if (t.includes('escalation') || t.includes('red_flag') || t.includes('handoff')) {
    return 'escalation'
  }
  return 'domain'
}

// Very simple prompt templates for now – later we can let the Prompt Engineer
// generate these dynamically.
function buildQuestionForTopic(topic: string): string {
  const t = topic.toLowerCase()

  if (t === 'contamination_in_grow_bags') {
    return 'Write the ideal answer this agent should give when a customer reports that their grow bag arrived contaminated before they injected it.'
  }
  if (t === 'customer_support_resources') {
    return 'Write the ideal answer this agent should give when a customer asks how to contact customer support or where to find the help center link.'
  }
  if (t === 'agent_identity_and_mission') {
    return 'Write a concise, high-signal description of this agent’s mission and what it is responsible for at the company.'
  }
  if (t === 'tone_and_style') {
    return 'Write a short set of bullet points that describe the exact tone and style this agent should use when talking to customers.'
  }
  if (t === 'legal_and_compliance_guardrails') {
    return 'Write a clear set of do’s and don’ts for this agent around legal, compliance, and refund policy topics.'
  }
  if (t === 'escalation_and_handoff_rules') {
    return 'Describe the exact situations where this agent must escalate to a human, and what information it should include when handing off.'
  }

  // Generic fallback
  return `Give the ideal answer this agent should produce for a common question in the "${topic}" area. Focus on clarity, correctness, and matching the company’s policies.`
}

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

  const { agent_id } = body || {}
  if (!agent_id) {
    return NextResponse.json(
      { ok: false, error: 'agent_id is required' },
      { status: 400 }
    )
  }

  try {
    // 1) Pull all tags for this agent so we can count examples per topic
    const { data: tagRows, error: tagErr } = await supabase
      .from('fine_tune_examples')
      .select('tags')
      .eq('agent_id', agent_id)

    if (tagErr) {
      console.error('[fine-tune/manual] tags error:', tagErr)
      return NextResponse.json(
        { ok: false, error: tagErr.message },
        { status: 500 }
      )
    }

    const topicCounts: Record<string, number> = {}

    ;(tagRows || []).forEach((row: any) => {
      const tags = row?.tags
      if (!tags) return

      if (typeof tags === 'object' && !Array.isArray(tags)) {
        const topic = (tags as any).topic
        if (typeof topic === 'string') {
          const key = topic.trim()
          if (key) {
            topicCounts[key] = (topicCounts[key] || 0) + 1
          }
        }
        return
      }

      if (Array.isArray(tags)) {
        tags.forEach((raw: any) => {
          if (typeof raw !== 'string') return
          const key = raw.trim()
          if (!key) return
          topicCounts[key] = (topicCounts[key] || 0) + 1
        })
      }
    })

    // 2) Ensure baseline topics are present even if count=0
    BASE_TOPICS.forEach((base) => {
      if (!(base.topic in topicCounts)) {
        topicCounts[base.topic] = 0
      }
    })

    // 3) Compute coverage for each topic
    const topicsWithCoverage = Object.entries(topicCounts).map(([topic, count]) => {
      const baseCfg = BASE_TOPIC_CONFIG[topic]
      const dimension = baseCfg?.dimension ?? classifyTopic(topic)
      const min_examples =
        baseCfg?.min_examples ??
        (dimension === 'identity'
          ? 3
          : dimension === 'policy'
          ? 5
          : dimension === 'escalation'
          ? 4
          : 8)

      const coverage_pct = Math.max(0, Math.min(100, Math.round((count / min_examples) * 100)))

      return {
        topic,
        dimension,
        count,
        min_examples,
        coverage_pct,
      }
    })

    // 4) Pick the lowest-coverage topic
    const sorted = topicsWithCoverage.sort((a, b) => a.coverage_pct - b.coverage_pct)
    const next = sorted[0]

    if (!next) {
      return NextResponse.json({
        ok: true,
        data: {
          done: true,
          message:
            'No topics found for this agent yet. Try generating some examples in the Playground first.',
        },
      })
    }

    const question = buildQuestionForTopic(next.topic)

    return NextResponse.json({
      ok: true,
      data: {
        done: false,
        topic: next.topic,
        dimension: next.dimension,
        coverage_pct: next.coverage_pct,
        current_examples_for_topic: next.count,
        goal_examples_for_topic: next.min_examples,
        prompt: question,
      },
    })
  } catch (err) {
    console.error('[fine-tune/manual] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in manual fine-tune route.' },
      { status: 500 }
    )
  }
}