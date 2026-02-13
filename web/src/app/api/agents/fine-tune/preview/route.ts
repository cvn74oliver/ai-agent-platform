import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizeTopic } from '@/lib/fine_tune_topics'

/**
 * Preview the fine-tune dataset for a given agent.
 *
 * POST body:
 * {
 *   "agent_id": "uuid"
 * }
 *
 * Response:
 * {
 *   ok: true,
 *   data: {
 *     total_examples: number,
 *     by_source: Record<string, number>,
 *     by_label: Record<string, number>,
 *     coverage_by_topic: Array<{
 *       topic: string,                        // can be a baseline topic or a dynamic tag-based topic
 *       count: number,                        // how many examples are tagged with this topic
 *       dimension: 'identity' | 'policy' | 'escalation' | 'domain',
 *       min_examples: number,                 // target examples for 100% coverage
 *       coverage_pct: number                  // 0–100 based on count / min_examples
 *     }>,
 *     samples: Array<{
 *       id: string,
 *       source: string | null,
 *       quality_label: string | null,
 *       created_at: string,
 *       user_input: string | null,
 *       agent_output: string | null,
 *       topics: string[]                  // inferred or tagged topics for this example
 *     }>
 *   }
 * }
 */
// Baseline topics that should always appear in coverage, even if count = 0.
// These are generic and can be refined or made agent-type–specific later.
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

// Convenience map to override classifyTopic/min_examples for baseline topics
const BASE_TOPIC_CONFIG: Record<
  string,
  { dimension: 'identity' | 'policy' | 'escalation' | 'domain'; min_examples: number }
> = BASE_TOPICS.reduce((acc, curr) => {
  acc[curr.topic] = { dimension: curr.dimension, min_examples: curr.min_examples }
  return acc
}, {} as Record<string, { dimension: 'identity' | 'policy' | 'escalation' | 'domain'; min_examples: number }>)

// Topic normalization (temporary local copy).
// TODO: move to a shared helper (used by orchestrator + preview) to prevent drift.

// Removed local normalizeTopic function as per instructions.

function classifyTopic(
  topic: string
): 'identity' | 'policy' | 'escalation' | 'domain' {
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
    // 1) Total count
    const { data: countRows, error: countErr, count } = await supabase
      .from('fine_tune_examples')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent_id)

    if (countErr) {
      console.error('[fine-tune/preview] count error:', countErr)
      return NextResponse.json(
        { ok: false, error: countErr.message },
        { status: 500 }
      )
    }

    const total_examples = typeof count === 'number' ? count : 0
    // Note: countRows is head: true so the count is on the response metadata
    // We can re-query without head for grouping.

    // 2) Group by source
    const { data: bySourceRows, error: bySourceErr } = await supabase
      .from('fine_tune_examples')
      .select('source, id')
      .eq('agent_id', agent_id)

    if (bySourceErr) {
      console.error('[fine-tune/preview] by-source error:', bySourceErr)
      return NextResponse.json(
        { ok: false, error: bySourceErr.message },
        { status: 500 }
      )
    }

    const by_source: Record<string, number> = {}
    const by_label: Record<string, number> = {}

    ;(bySourceRows || []).forEach((row: any) => {
      const s = (row.source || 'unknown') as string
      by_source[s] = (by_source[s] || 0) + 1
    })

    // 3) Group by quality_label
    const { data: byLabelRows, error: byLabelErr } = await supabase
      .from('fine_tune_examples')
      .select('quality_label, id')
      .eq('agent_id', agent_id)

    if (byLabelErr) {
      console.error('[fine-tune/preview] by-label error:', byLabelErr)
      return NextResponse.json(
        { ok: false, error: byLabelErr.message },
        { status: 500 }
      )
    }

    ;(byLabelRows || []).forEach((row: any) => {
      const lbl = (row.quality_label || 'unlabeled') as string
      by_label[lbl] = (by_label[lbl] || 0) + 1
    })

    // 3b) Aggregate coverage by topic from tags[]
    const { data: tagRows, error: tagErr } = await supabase
      .from('fine_tune_examples')
      .select('tags')
      .eq('agent_id', agent_id)

    if (tagErr) {
      console.error('[fine-tune/preview] tags error:', tagErr)
      return NextResponse.json(
        { ok: false, error: tagErr.message },
        { status: 500 }
      )
    }

    const topicCounts: Record<string, number> = {}
    // Track raw topic variants per canonical topic so the UI can show a dropdown/expand list.
    const topicVariants: Record<string, Record<string, number>> = {}

    ;(tagRows || []).forEach((row: any) => {
      const tags = row?.tags
      if (!tags) return

      // New shape: tags is an object like { role, topic, rating, variant }
      if (typeof tags === 'object' && !Array.isArray(tags)) {
        const topic = (tags as any).topic
        if (typeof topic === 'string') {
          const rawKey = topic.trim()
          if (rawKey) {
            const canonical = normalizeTopic(rawKey)
            if (canonical) {
              topicCounts[canonical] = (topicCounts[canonical] || 0) + 1
              topicVariants[canonical] = topicVariants[canonical] || {}
              topicVariants[canonical][rawKey] = (topicVariants[canonical][rawKey] || 0) + 1
            }
          }
        }
        return
      }

      // Legacy shape: tags is an array of strings
      if (Array.isArray(tags)) {
        tags.forEach((raw: any) => {
          const rawKey = raw.trim()
          if (!rawKey) return
          const canonical = normalizeTopic(rawKey)
          if (!canonical) return
          topicCounts[canonical] = (topicCounts[canonical] || 0) + 1
          topicVariants[canonical] = topicVariants[canonical] || {}
          topicVariants[canonical][rawKey] = (topicVariants[canonical][rawKey] || 0) + 1
        })
      }
    })

    // Ensure all baseline topics appear in the coverage, even if we have 0 examples so far.
    BASE_TOPICS.forEach((base) => {
      const canonicalBase = normalizeTopic(base.topic) || base.topic
      if (!(canonicalBase in topicCounts)) {
        topicCounts[canonicalBase] = 0
      }
      // Ensure variants map exists for baseline topics so UI can safely render.
      topicVariants[canonicalBase] = topicVariants[canonicalBase] || {}
      // Include the baseline topic itself as a variant with 0 so it can appear in dropdowns.
      if (!(base.topic in topicVariants[canonicalBase])) {
        topicVariants[canonicalBase][base.topic] = 0
      }
    })

    const coverage_by_topic = Object.entries(topicCounts).map(
      ([topic, countVal]) => {
        // If this is one of our baseline topics, use its config; otherwise infer from the name
        const baseCfg = BASE_TOPIC_CONFIG[topic]
        const dimension = baseCfg?.dimension ?? classifyTopic(topic)

        // Simple heuristic thresholds we can refine later for non-baseline topics
        const min_examples =
          baseCfg?.min_examples ??
          (dimension === 'identity'
            ? 3
            : dimension === 'policy'
            ? 5
            : dimension === 'escalation'
            ? 4
            : 8) // domain

        const coverage_pct = Math.max(
          0,
          Math.min(100, Math.round((countVal / min_examples) * 100))
        )

        const variantsObj = topicVariants[topic] || {}
        const variants = Object.entries(variantsObj)
          .map(([raw, c]) => ({ raw_topic: raw, count: c }))
          .sort((a, b) => b.count - a.count || a.raw_topic.localeCompare(b.raw_topic))

        return {
          topic,
          count: countVal,
          dimension,
          min_examples,
          coverage_pct,
          variants,
        }
      }
    )

    // 4) Sample a few recent examples for inspection
    const { data: sampleRows, error: sampleErr } = await supabase
      .from('fine_tune_examples')
      .select(
        'id, source, quality_label, created_at, user_input, agent_output, tags'
      )
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (sampleErr) {
      console.error('[fine-tune/preview] samples error:', sampleErr)
      return NextResponse.json(
        { ok: false, error: sampleErr.message },
        { status: 500 }
      )
    }

    const samples = (sampleRows || []).map((row: any) => {
      let topics: string[] = []
      let canonical_topics: string[] = []
      const tags = row?.tags
      if (tags) {
        if (typeof tags === 'object' && !Array.isArray(tags)) {
          const topic = (tags as any).topic
          if (typeof topic === 'string') {
            const trimmed = topic.trim()
            if (trimmed) {
              topics.push(trimmed)
            }
          }
        } else if (Array.isArray(tags)) {
          tags.forEach((raw: any) => {
            if (typeof raw !== 'string') return
            const trimmed = raw.trim()
            if (trimmed) {
              topics.push(trimmed)
            }
          })
        }
      }
      canonical_topics = Array.from(
        new Set(
          topics
            .map((t) => normalizeTopic(t))
            .filter((t) => typeof t === 'string' && t.length > 0)
        )
      )
      return {
        id: row.id,
        source: row.source,
        quality_label: row.quality_label,
        created_at: row.created_at,
        user_input: row.user_input,
        agent_output: row.agent_output,
        topics,
        canonical_topics,
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        total_examples,
        by_source,
        by_label,
        coverage_by_topic,
        samples,
      },
    })
  } catch (err) {
    console.error('[fine-tune/preview] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in fine-tune preview.' },
      { status: 500 }
    )
  }
}