import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = createClient()
  const { agent_id } = await req.json()

  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 })

  // 1️⃣ Fetch examples that haven't been scored yet
  const { data: examples, error } = await supabase
    .from('training_data')
    .select('id, example_text')
    .eq('agent_id', agent_id)
    .is('is_relevant', null)
    .limit(20)

  if (error) throw error
  if (!examples || examples.length === 0)
    return NextResponse.json({ message: 'No new examples to evaluate.' })

  // 2️⃣ Use a lightweight model (mini) to rate each example
  const prompt = `
You are a data quality evaluator. For each example below, decide if it should be included in a fine-tuning dataset.
Output a JSON array where each item has "relevant" (true/false) and "score" (0–1).

Examples:
${examples.map((e, i) => `${i + 1}. ${e.example_text}`).join('\n')}
`
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // very cheap evaluator
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  })

  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content || '[]'
  let results: any[] = []
  try {
    results = JSON.parse(text)
  } catch {
    console.warn('Bad JSON from evaluator, skipping...')
    return NextResponse.json({ message: 'Evaluator returned invalid JSON' })
  }

  // 3️⃣ Update the database with results
  for (let i = 0; i < results.length; i++) {
    const ex = examples[i]
    const r = results[i]
    if (!ex || r?.relevant === undefined) continue

    await supabase
      .from('training_data')
      .update({
        is_relevant: r.relevant,
        relevance_score: r.score ?? 0,
      })
      .eq('id', ex.id)
  }

// 4️⃣ Update the agent's last_relevance_check timestamp
await supabase
  .from('agents')
  .update({ last_relevance_check: new Date().toISOString() })
  .eq('id', agent_id)

// ✅ After updating examples, update the agent's dataset_progress
const { count: totalExamples } = await supabase
  .from('training_data')
  .select('*', { count: 'exact', head: true })
  .eq('agent_id', agent_id)

const { count: approvedExamples } = await supabase
  .from('training_data')
  .select('*', { count: 'exact', head: true })
  .eq('agent_id', agent_id)
  .eq('is_relevant', true)

// calculate % of goal (e.g., target = 1000 examples)
const targetExamples = 1000
const progress = Math.min(
  Math.round(((approvedExamples || 0) / targetExamples) * 100),
  100
)

await supabase
  .from('agents')
  .update({ dataset_progress: progress })
  .eq('id', agent_id)

  return NextResponse.json({ evaluated: results.length })
}