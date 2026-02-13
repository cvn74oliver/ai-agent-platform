import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizeTopic } from '@/lib/fine_tune_topics'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const QUESTION_MODEL = process.env.OPENAI_ORCHESTRATOR_MODEL || 'gpt-4o-mini'

type TopicStats = {
  topic: string
  dimension: string
  example_count: number
  positive_count: number
  negative_count: number
}

/**
 * POST /api/agents/fine-tune/orchestrate
 *
 * Body:
 * {
 *   "agent_id": "uuid",
 *   "topic"?: "canonical_topic_key" // optional: force a specific topic if it still needs examples
 * }
 *
 * Response:
 * {
 *   ok: true,
 *   data: {
 *     topic: string
 *     dimension: string
 *     suggested_question: string
 *     reason: string
 *     required_examples: number
 *     current_examples: number
 *   }
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

  const { agent_id, topic } = body || {}
  const requestedTopic = typeof topic === 'string' ? normalizeTopic(topic) : ''
  if (!agent_id) {
    return NextResponse.json(
      { ok: false, error: 'agent_id is required' },
      { status: 400 }
    )
  }

  try {
    // 1) Pull all fine-tune examples for this agent (we keep it simple & let JS aggregate)
    const { data: rows, error } = await supabase
      .from('fine_tune_examples')
      .select('tags, quality_label, user_input, agent_output, created_at')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[orchestrate] fine_tune_examples query error:', error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    const examples = rows || []

    const lastTags = (examples[0] as any)?.tags || {}
    const lastTopicRaw: string =
      typeof lastTags.topic === 'string'
        ? lastTags.topic
        : Array.isArray(lastTags.topics) && lastTags.topics.length > 0
        ? lastTags.topics[0]
        : ''
    const lastTopic = lastTopicRaw ? normalizeTopic(lastTopicRaw) : ''

    const lastQuestion =
      typeof (examples[0] as any)?.user_input === 'string'
        ? ((examples[0] as any).user_input as string)
        : ''

    // Core topics we want to cover even if there are no examples yet.
    // This prevents the orchestrator from getting stuck only repeating topics that already exist in the dataset.
    const CORE_TOPICS: Array<{ topic: string; dimension: string }> = [
      { topic: 'agent_identity_and_mission', dimension: 'identity' },
      { topic: 'tone_and_style', dimension: 'identity' },
      { topic: 'customer_support_resources', dimension: 'domain' },
      { topic: 'legal_and_compliance_guardrails', dimension: 'policy' },
      { topic: 'escalation_and_handoff_rules', dimension: 'escalation' },
      { topic: 'contamination_in_grow_bags', dimension: 'domain' },
    ]


    // If there is literally no data yet, suggest a very generic starting point
    if (examples.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          topic: 'agent_identity_and_mission',
          dimension: 'identity',
          suggested_question:
            "What is this agent's mission at your company, and how should it help customers day-to-day?",
          reason:
            'No fine-tune data exists yet. A strong foundation begins with clearly defining the agent’s mission and identity.',
          required_examples: 20,
          current_examples: 0,
        },
      })
    }

    // 2) Aggregate by topic + dimension from tags JSON
    const statsMap = new Map<string, TopicStats>()

    // Seed the stats map with core topics at zero so we can recommend them even before examples exist.
    for (const ct of CORE_TOPICS) {
      const key = `${ct.dimension}::${ct.topic}`
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          topic: ct.topic,
          dimension: ct.dimension,
          example_count: 0,
          positive_count: 0,
          negative_count: 0,
        })
      }
    }

    for (const row of examples) {
      const tags = (row as any).tags || {}
      const topicRaw: string =
        typeof tags.topic === 'string'
          ? tags.topic
          : Array.isArray(tags.topics) && tags.topics.length > 0
          ? tags.topics[0]
          : 'uncategorized'

      const topic: string = normalizeTopic(topicRaw)

      const dimension: string =
        typeof tags.dimension === 'string'
          ? tags.dimension
          : topic.includes('mission') ||
            topic.includes('identity') ||
            topic.includes('tone')
          ? 'identity'
          : topic.includes('legal') ||
            topic.includes('compliance') ||
            topic.includes('guardrails')
          ? 'policy'
          : topic.includes('escalation') ||
            topic.includes('handoff')
          ? 'escalation'
          : 'domain'

      const key = `${dimension}::${topic}`
      const quality = (row as any).quality_label as string | null

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          topic,
          dimension,
          example_count: 0,
          positive_count: 0,
          negative_count: 0,
        })
      }

      const st = statsMap.get(key)!
      st.example_count += 1
      if (quality === 'positive') st.positive_count += 1
      if (quality === 'negative') st.negative_count += 1
    }

    const stats = Array.from(statsMap.values())

    // 3) Simple coverage heuristic:
    //    - Target N examples per topic (can tune later)
    //    - Prefer topics with low coverage and/or more negatives.

    const TARGETS_BY_DIMENSION: Record<string, number> = {
      policy: 5,
      escalation: 4,
      identity: 3,
      domain: 8,
      other: 8,
    }

    function targetForDimension(dim: string): number {
      const d = String(dim || 'other')
      return TARGETS_BY_DIMENSION[d] ?? TARGETS_BY_DIMENSION.other
    }

    const DIM_PRIORITY: Record<string, number> = {
      policy: 0,
      escalation: 1,
      identity: 2,
      domain: 3,
      other: 9,
    }

    type Ranked = TopicStats & {
      target_examples: number
      remaining: number
      coverage_pct: number
      score: number
    }

    const ranked: Ranked[] = stats.map((st) => {
      const target = targetForDimension(st.dimension)
      const remaining = Math.max(0, target - st.example_count)
      const coverage = Math.min(100, Math.round((st.example_count / target) * 100))

      const needs = target > 0 && remaining > 0
      const dimRank = DIM_PRIORITY[String(st.dimension || 'other')] ?? 9

      // Score: lower = higher priority (used for last-topic avoidance window)
      let score = 0
      score += (needs ? 0 : 1) * 100000
      score += dimRank * 10000
      score += (100 - Math.min(100, remaining * 10)) * 100 // more remaining => higher priority
      score += (50 - Math.min(50, st.negative_count)) * 10  // more negatives => higher priority
      score += coverage // lower coverage => higher priority

      return {
        ...st,
        target_examples: target,
        remaining,
        coverage_pct: coverage,
        score,
      }
    })

    // Small question bank to avoid repeating the exact same wording forever.
    // We keep it deterministic (based on example_count) so it’s stable across calls.
    const QUESTION_BANK: Record<string, string[]> = {
      contamination_in_grow_bags: [
        "What should I do if my mushroom grow bag arrives contaminated before I've injected it?",
        "A grow bag arrived with visible contamination before injection—what’s the correct resolution for the customer?",
        "If a customer’s bag looks contaminated right out of the box (before inoculation), what steps should support take?",
        "My bag arrived contaminated prior to injection. Should I still use it, or what should I do next?",
      ],
      customer_support_resources: [
        'Where can I find the Curative Mushrooms help center or customer support page?',
        'How do I contact Curative Mushrooms customer support, and where is the help center?',
        'What’s the best way for a customer to get help—support page, email, or another channel?',
      ],
      agent_identity_and_mission: [
        "What is this agent's mission at Curative Mushrooms, and how should it treat customers?",
        "In one paragraph, what is this agent’s mission and how should it help customers day-to-day?",
        "What outcomes should this agent optimize for when supporting Curative Mushrooms customers?",
      ],
      legal_and_compliance_guardrails: [
        'What legal or compliance rules must this agent follow when talking about spores and mushroom cultivation?',
        'What topics should the agent avoid, and what compliance guardrails must it follow in customer chats?',
        'List the key safety/legal disclaimers the agent should use when relevant.',
      ],
      escalation_and_handoff_rules: [
        'In what situations should this agent escalate a conversation to a human representative?',
        'What are the red-flag scenarios that require handoff to a human support rep?',
        'When should the agent stop and escalate rather than continuing to advise the customer?',
      ],
      tone_and_style: [
        'How would you describe the ideal tone and style this agent should use when talking to customers?',
        'What tone should the agent use (friendly, concise, empathetic, etc.) and what should it avoid?',
        'Give 3 “do” and 3 “don’t” rules for the agent’s writing style.',
      ],
      mushroom_types_and_effects: [
        'What are “Happy Mushrooms,” and how should you explain the term to a customer in a compliant way?',
        'A customer asks: “What are Happy Mushrooms?” How should the agent answer (and what should it avoid saying)?',
        'How do you explain the difference between gourmet/medicinal mushrooms and “Happy Mushrooms” in your brand language?',
        'What’s the safest, most helpful way to respond if a customer asks about effects or potency?',
      ],
    }

    // Pick the "weakest" topic (lowest score). If there’s a tie, pick the one
    // with fewer positive examples.
    ranked.sort((a, b) => {
      const aNeeds = a.target_examples > 0 && a.remaining > 0
      const bNeeds = b.target_examples > 0 && b.remaining > 0
      if (aNeeds !== bNeeds) return aNeeds ? -1 : 1

      const aDimRank = DIM_PRIORITY[String(a.dimension || 'other')] ?? 9
      const bDimRank = DIM_PRIORITY[String(b.dimension || 'other')] ?? 9
      if (aDimRank !== bDimRank) return aDimRank - bDimRank

      if (a.remaining !== b.remaining) return b.remaining - a.remaining
      if (a.negative_count !== b.negative_count) return b.negative_count - a.negative_count
      if (a.coverage_pct !== b.coverage_pct) return a.coverage_pct - b.coverage_pct

      return String(a.topic || '').localeCompare(String(b.topic || ''))
    })

    const best = ranked[0]

    // If the caller requested a topic (e.g., click-to-train), honor it if it still needs examples.
    // If the topic is already met (or not found), fall back to smart prioritization.
    let chosen = best
    if (requestedTopic) {
      const forced = ranked.find((r) => r.topic === requestedTopic)
      if (forced && forced.target_examples > 0 && forced.remaining > 0) {
        chosen = forced
      }
    }

    // Prefer not to repeat the same topic we just trained, unless it is clearly the top priority.
    // This makes “Save & Next” feel more intelligent and diverse.
    if (!requestedTopic && lastTopic && ranked.length > 1 && best.topic === lastTopic) {
      const SCORE_WINDOW = 1500
      const alt = ranked.find(
        (r) => r.topic !== lastTopic && r.score <= best.score + SCORE_WINDOW
      )
      if (alt) chosen = alt
    }

    // 4) Suggest a question + rationale.
    function buildQuestionAndReason(st: Ranked) {
      const baseReason = `This topic currently has ${st.example_count} example(s) out of a target of ${st.target_examples}, with ${st.positive_count} 👍 and ${st.negative_count} 👎.`
      const coverageBit =
        st.coverage_pct === 0
          ? 'No coverage yet.'
          : st.coverage_pct < 50
          ? 'Coverage is still low.'
          : 'Coverage is moderate but could be improved.'

      let suggested_question = ''

      const canonicalTopic = normalizeTopic(st.topic)

      const candidates = QUESTION_BANK[canonicalTopic]
      if (candidates && candidates.length > 0) {
        // Deterministic rotation based on how many examples we already have for this topic.
        let idx = Math.max(0, st.example_count) % candidates.length
        suggested_question = candidates[idx]

        // If we would repeat the exact same question the user just answered, rotate once more.
        if (lastQuestion && suggested_question === lastQuestion && candidates.length > 1) {
          idx = (idx + 1) % candidates.length
          suggested_question = candidates[idx]
        }
      } else {
        const humanTopic = st.topic.replace(/_/g, ' ')
        const genericTemplates = [
          `Ask one realistic customer question a buyer might ask about ${humanTopic}.`,
          `Write one short, specific customer question related to ${humanTopic}.`,
          `What’s a common customer question about ${humanTopic} that this agent should answer well?`,
          `Give one high-impact customer question that helps train the agent on ${humanTopic}.`,
        ]
        let idx = Math.max(0, st.example_count) % genericTemplates.length
        suggested_question = genericTemplates[idx]

        if (lastQuestion && suggested_question === lastQuestion && genericTemplates.length > 1) {
          idx = (idx + 1) % genericTemplates.length
          suggested_question = genericTemplates[idx]
        }
      }

      const reason = `${baseReason} ${coverageBit} This makes "${st.topic}" a high-impact target for the next few training examples.`
      return { suggested_question, reason }
    }

    const { suggested_question, reason } = buildQuestionAndReason(chosen)

    async function generateDynamicQuestion(args: {
      topic: string
      dimension: string
      reason: string
      lastQuestion: string
      examples: any[]
    }): Promise<string | null> {
      try {
        // Keep evidence small and relevant
        const recent = (args.examples || []).slice(0, 12).map((r) => {
          const tags = (r as any).tags || {}
          return {
            source: (r as any).source || null,
            topic: tags.topic || tags.topics?.[0] || null,
            dimension: tags.dimension || null,
            quality: (r as any).quality_label || null,
            user_input: (r as any).user_input || null,
            agent_output: (r as any).agent_output || null,
          }
        })

        const sys = `You are a senior prompt engineer helping build training data.

Your job: write ONE natural, specific question to ask the user next so we can improve an AI agent.

Rules:
- The question must be easy for a non-technical user to understand.
- Do NOT mention internal labels like "topic", "dimension", "category", or quote category names.
- Use the provided evidence to avoid asking something already answered.
- Prefer high-leverage gaps (compliance/guardrails, escalation boundaries, product/service scope, and common customer issues).
- The question MUST target the chosen focus area.
- Do NOT repeat the exact last question.
- Output ONLY the question text (no JSON, no bullets, no extra commentary).`

        const user = JSON.stringify(
          {
            chosen_focus: {
              topic: args.topic,
              dimension: args.dimension,
              reason: args.reason,
            },
            last_question: args.lastQuestion || null,
            recent_examples: recent,
          },
          null,
          2
        )

        const resp = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: QUESTION_MODEL,
            temperature: 0.4,
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: user },
            ],
          }),
        })

        const raw = await resp.json()
        let txt = raw?.choices?.[0]?.message?.content || ''
        txt = txt.replace(/```/g, '').trim()

        if (!txt) return null

        // Hard guardrails
        if (args.lastQuestion && txt === args.lastQuestion) return null
        if (txt.length < 8) return null

        return txt
      } catch (e) {
        console.error('[orchestrate] generateDynamicQuestion error:', e)
        return null
      }
    }

    const dynamicQ = await generateDynamicQuestion({
      topic: chosen.topic,
      dimension: chosen.dimension,
      reason,
      lastQuestion,
      examples,
    })

    const finalQuestion = dynamicQ || suggested_question

    return NextResponse.json({
      ok: true,
      data: {
        topic: chosen.topic,
        dimension: chosen.dimension,
        suggested_question: finalQuestion,
        reason,
        required_examples: chosen.target_examples,
        current_examples: chosen.example_count,
        coverage_pct: chosen.coverage_pct,
        positive_count: chosen.positive_count,
        negative_count: chosen.negative_count,
      },
    })
  } catch (err) {
    console.error('[fine-tune/orchestrate] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in fine-tune orchestrator.' },
      { status: 500 }
    )
  }
}