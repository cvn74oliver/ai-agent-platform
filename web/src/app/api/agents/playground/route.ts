import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'

const CHAT_MODEL = 'gpt-4o-mini'
const EMBEDDING_MODEL = 'text-embedding-3-small'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type RagDocumentRow = {
  id: string
  job_id: string
  source_type: string | null
  source_url: string | null
  content: string | null
  embedding: number[] | null
}

// Helper: Parse Postgres float array column (may be string or array)
function parsePgFloatArray(v: unknown): number[] | null {
  // pgvector (Supabase) may come back as an object; try common shapes.
  if (v && typeof v === 'object') {
    const anyV: any = v
    const candidate =
      anyV?.data ||
      anyV?.value ||
      anyV?.vector ||
      anyV?.embedding ||
      null

    if (Array.isArray(candidate)) {
      const out = candidate.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
      return out.length ? out : null
    }

    // Some clients serialize as { "0": 0.1, "1": 0.2, ... }
    const vals = Object.values(anyV)
    if (vals.length && vals.every((x) => typeof x === 'number')) {
      return (vals as number[]).filter((n) => Number.isFinite(n))
    }
  }

  if (Array.isArray(v)) {
    const out = v.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    return out.length ? out : null
  }

  if (typeof v === 'string') {
    // Common Postgres array string format: "{1,2,3}" or "[1,2,3]"
    const t = v.trim()
    const inner = t.startsWith('{') && t.endsWith('}') ? t.slice(1, -1) : t
    const inner2 = inner.startsWith('[') && inner.endsWith(']') ? inner.slice(1, -1) : inner
    const parts = inner2
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    const nums = parts
      .map((p) => Number(p))
      .filter((n) => Number.isFinite(n))

    return nums.length ? nums : null
  }

  return null
}

function normalizeEmbedding(v: unknown): number[] | null {
  return parsePgFloatArray(v)
}

/**
 * Simple cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const va = a[i]
    const vb = b[i]
    dot += va * vb
    na += va * va
    nb += vb * vb
  }
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * Fetch an embedding vector for the given text using OpenAI.
 */
async function embedText(text: string): Promise<number[] | null> {
  try {
    const resp = await fetch(EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    })

    const json = await resp.json()
    const vec = json?.data?.[0]?.embedding
    if (!Array.isArray(vec)) {
      console.error('[playground] embedding response malformed:', json)
      return null
    }
    return vec as number[]
  } catch (err) {
    console.error('[playground] embedText error:', err)
    return null
  }
}

/**
 * Retrieve top-K relevant RAG chunks for this agent + query text.
 * Uses:
 *  - rag_jobs (filter by agent_id, status = 'completed')
 *  - rag_documents (filter by job_id, take most recent N)
 *  - JS cosine similarity to rank chunks
 */
async function retrieveRagContext(opts: {
  supabase: any
  agentId: string
  queryText: string
  maxJobs?: number
  maxDocs?: number
  topK?: number
  minSim?: number
}): Promise<
  {
    content: string
    source_type: string | null
    source_url: string | null
    similarity: number
  }[]
> {
  const {
    supabase,
    agentId,
    queryText,
    maxJobs = 10,
    maxDocs = 800,
    topK = 5,
    minSim = 0.25,
  } = opts

  const qLower = (queryText || '').toLowerCase()
  const wantsLink = /\b(link|url|article|blog)\b/i.test(queryText || '')

  function urlKeywordScore(url: string, q: string): number {
    const u = (url || '').toLowerCase()
    if (!u) return 0

    // Simple overlap scoring
    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ''))
      .filter((t) => t.length >= 4)
      .slice(0, 12)

    if (tokens.length === 0) return 0
    let hit = 0
    for (const t of tokens) {
      if (u.includes(t)) hit++
    }
    return hit / tokens.length
  }

  // 1️⃣ Embed the query text
  const queryEmbedding = await embedText(queryText)
  if (!queryEmbedding) {
    console.warn('[playground] No query embedding — skipping RAG.')
    return []
  }

  // 2️⃣ Fetch recent *completed* jobs for this agent
const { data: jobs, error: jobsErr } = await supabase
  .from('rag_jobs')
  .select('id, status')
  .eq('agent_id', agentId)
  // For now, include all non-failed jobs so we still use docs even if status
  // is still "pending". Later, when your worker marks jobs "completed",
  // we can tighten this to .eq('status', 'completed').
  .neq('status', 'failed')
  .order('created_at', { ascending: false })
  .limit(maxJobs)

if (jobs && jobs.length) {
  console.log(
    '[playground] Using rag_jobs IDs:',
    jobs.map((j: any) => `${j.id} (${j.status})`)
  )
}

  if (jobsErr) {
    console.error('[playground] rag_jobs query error:', jobsErr)
    return []
  }

  if (!jobs || jobs.length === 0) {
    console.log('[playground] No completed rag_jobs for this agent yet.')
    return []
  }

  // 3️⃣ Fetch recent document chunks for this agent.
  // We intentionally do NOT depend on rag_jobs status here.
  // The worker may leave jobs as pending while documents/chunks are already written.

const { data: docsRecent, error: docsErr } = await supabase
  .from('rag_documents')
  .select('*')
  .eq('agent_id', agentId)
  .order('created_at', { ascending: false })
  .limit(maxDocs)

if (docsErr) {
  console.error('[playground] rag_documents (by agent_id) query error:', docsErr)
  return []
}

let docs = (docsRecent || []) as any[]

// If user wants a link, pull extra blog docs to improve hit rate
if (wantsLink) {
  const { data: blogDocs, error: blogErr } = await supabase
    .from('rag_documents')
    .select('*')
    .eq('agent_id', agentId)
    .ilike('source_url', '%blog.curativemushrooms.com%')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (blogErr) {
    console.warn('[playground] rag_documents (blog) query error (non-fatal):', blogErr)
  } else if (Array.isArray(blogDocs) && blogDocs.length > 0) {
    const byId = new Map<string, any>()
    for (const d of docs) byId.set(String(d.id), d)
    for (const d of blogDocs) byId.set(String(d.id), d)
    docs = Array.from(byId.values())
  }
}

if (!docs || docs.length === 0) {
  console.log('[playground] No rag_documents available for this agent yet.')
  return []
}

  // 4️⃣ Compute cosine similarity in Node
  const pickText = (row: any): string | null => {
    const candidates = [
      row?.content,
      row?.chunk,
      row?.chunk_text,
      row?.text,
      row?.raw_text,
      row?.page_text,
    ]

    for (const c of candidates) {
      if (typeof c === 'string') {
        const t = c.trim()
        if (t) return t
      }
    }

    return null
  }

  const usable = (docs as any[]).map((d: any) => {
    const emb = normalizeEmbedding(d?.embedding)
    const content = pickText(d)
    return { ...d, __emb: emb, __content: content }
  })

  const usableCount = usable.filter((d) => Array.isArray(d.__emb) && typeof d.__content === 'string').length
  const embType = typeof (docs?.[0] as any)?.embedding

  console.log('[playground] rag_docs loaded:', {
    total: docs.length,
    usable: usableCount,
    sample_embedding_type: embType,
    sample_has_content: typeof (docs?.[0] as any)?.content === 'string',
  })

  const scored = usable
    .filter((d) => Array.isArray(d.__emb) && typeof d.__content === 'string')
    .map((d) => {
    const sim = cosineSimilarity(d.__emb as number[], queryEmbedding)
    const url = (d.source_url || d.url || d.source || null) as any
    const urlBoost = wantsLink && typeof url === 'string' ? urlKeywordScore(url, queryText) : 0

    // For link requests, allow URL overlap to influence ranking strongly.
    const blended = wantsLink ? Math.max(sim, 0.15 + urlBoost * 0.85) : sim

    return {
      content: d.__content as string,
      source_type: d.source_type,
      source_url: url,
      similarity: blended,
    }
    })

  // 5️⃣ Sort by similarity desc, filter threshold, slice topK
  const top = scored
    .filter((d) => d.similarity >= (wantsLink ? Math.min(minSim, 0.2) : minSim))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)

  if (top.length === 0) {
    const best = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map((t) => ({ sim: Number(t.similarity.toFixed(3)), url: t.source_url }))
    console.log('[playground] No chunks met threshold', { minSim, best })
  }

  console.log(
    '[playground] RAG retrieved chunks:',
    top.map((t) => ({
      sim: t.similarity.toFixed(3),
      url: t.source_url,
      type: t.source_type,
    }))
  )

  return top
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id, messages } = body as {
      agent_id?: string
      messages?: ChatMessage[]
    }

    if (!agent_id || !Array.isArray(messages)) {
      return NextResponse.json(
        { ok: false, error: 'agent_id and messages[] are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // Load the agent + onboarding summary
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, user_id, name, primary_prompt, onboarding_summary, rag_sources, crawl_domains, quality_score, quality_feedback')
      .eq('id', agent_id)
      .single()

    if (error || !agent) {
      console.error('[playground] Failed to load agent:', error)
      return NextResponse.json(
        { ok: false, error: 'Agent not found or access denied.' },
        { status: 404 }
      )
    }

    const summary = (agent.onboarding_summary || {}) as any

    // ─────────────────────────────────────────────
    // 1) Build base system prompt from agent summary
    // ─────────────────────────────────────────────
    const sysLines: string[] = []

    if (summary.agent_type) {
      sysLines.push(`You are a ${summary.agent_type}.`)
    } else {
      sysLines.push('You are an AI assistant acting as a company agent.')
    }

    if (summary.company) {
      sysLines.push(`Company: ${summary.company}`)
    }

    if (summary.mission) {
      sysLines.push(`Mission: ${summary.mission}`)
    }

    if (summary.audience) {
      sysLines.push(`Primary audience: ${summary.audience}`)
    }

    if (summary.tone) {
      sysLines.push(`Speak in this tone: ${summary.tone}`)
    }

    if (summary.topics) {
      sysLines.push(`Key topics / expertise: ${summary.topics}`)
    }

    if (summary.guardrails) {
      sysLines.push(
        `Guardrails (legal / brand / compliance): ${summary.guardrails}. Always obey these.`
      )
    }

    if (summary.constraints) {
      sysLines.push(`Additional constraints / things to avoid: ${summary.constraints}`)
    }

    // RAG + Crawl hints from static config
    const ragSources: string[] = Array.isArray(agent.rag_sources)
      ? agent.rag_sources
      : Array.isArray(summary.rag_links)
      ? summary.rag_links
      : typeof summary.rag_links === 'string'
      ? [summary.rag_links]
      : []

    const crawlDomains: string[] = Array.isArray(agent.crawl_domains)
      ? agent.crawl_domains
      : Array.isArray(summary.crawl_domains)
      ? summary.crawl_domains
      : typeof summary.crawl_domains === 'string'
      ? summary.crawl_domains.split(/[\n,]+/).map((v: string) => v.trim()).filter(Boolean)
      : []

    // ─────────────────────────────────────────────
    // 2) RAG retrieval based on last user message
    // ─────────────────────────────────────────────
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    let ragContextBlocks: string[] = []

    if (lastUserMessage && lastUserMessage.content.trim()) {
      try {
        const ragChunks = await retrieveRagContext({
          supabase,
          agentId: agent.id,
          queryText: lastUserMessage.content,
          maxJobs: 10,
          maxDocs: 800,
          topK: 5,
          minSim: 0.25,
        })

        if (ragChunks.length > 0) {
          ragContextBlocks = ragChunks.map((chunk, idx) => {
            const header = `Context #${idx + 1} — source_type: ${
              chunk.source_type || 'unknown'
            }, source_url: ${chunk.source_url || 'unknown'}`
            return `${header}\n${chunk.content}`
          })

          sysLines.push(
            '\nWhen answering, you MUST rely primarily on the following context blocks. ' +
              'If the user asks something that is not supported by these blocks or clearly outside ' +
              'your documented knowledge, say that you do not have that information instead of guessing.'
          )
        }
      } catch (err) {
        console.error('[playground] RAG retrieval failed, falling back to prompt-only:', err)
      }
    }

    // Include static hints about where knowledge comes from
    if (ragSources.length) {
      sysLines.push(
        `Reference documents have been synced from these sources: ${ragSources.join(
          ', '
        )}. Your answers should be consistent with those documents.`
      )
    }

    if (crawlDomains.length) {
      sysLines.push(
        `The company website / help center lives at: ${crawlDomains.join(
          ', '
        )}. Use this only as high-level background context.`
      )
    }

    // Also incorporate primary_prompt if set
    if (agent.primary_prompt) {
      sysLines.push('\nBase agent prompt:\n' + agent.primary_prompt)
    }

    // 🚫 URL / LINK SAFETY RULES
    sysLines.push(`
URL & LINK RULES (CRITICAL):

1. Only mention a URL or link if it appears explicitly in:
   • The RAG context blocks below, or
   • The static configuration in this system prompt (e.g., crawl_domains, rag_sources, or base site URL).

2. NEVER guess or invent a URL path, article slug, or product URL.
   • If the user asks for a specific article or product link and you do not see that exact URL in the context, say you do not know the exact link and instead:
     – Point them to the main site or relevant top-level page you DO see, or
     – Suggest they use the site’s navigation or search.

3. When listing blog posts or products:
   • Use the titles, headings, or descriptions that appear in the RAG context.
   • If titles are unclear or missing, summarize what the context says instead of making up catchy names.

4. When unsure:
   • Be honest. Say something like: "I don’t have the exact URL or title for that page in my current training data."
   • Do NOT fabricate URLs that “look right” (e.g., /the-science-behind-psilocybin).
`)

    // Finally, append RAG context blocks
    if (ragContextBlocks.length > 0) {
      sysLines.push('\n=== RAG CONTEXT BLOCKS ===')
      sysLines.push(ragContextBlocks.join('\n\n---\n\n'))
    }

    const systemPrompt = sysLines.join('\n')

    // ─────────────────────────────────────────────
    // 3) Build messages for OpenAI Chat
    // ─────────────────────────────────────────────
    const trimmedHistory: ChatMessage[] = messages.slice(-12) // keep last 12 turns max
    const openAiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.filter((m) => m.role === 'user' || m.role === 'assistant'),
    ]

    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0.4,
        messages: openAiMessages,
      }),
    })

    const raw = await resp.json().catch(() => null)

    if (!resp.ok) {
      const msg = raw?.error?.message || resp.statusText || 'OpenAI request failed'
      console.error('[playground] OpenAI chat failed:', { status: resp.status, msg, raw })
      return NextResponse.json(
        { ok: false, error: `OpenAI ${resp.status}: ${msg}` },
        { status: 502 }
      )
    }

    const reply: string = raw?.choices?.[0]?.message?.content || ''

    // ─────────────────────────────────────────────
    // 4) Log basic analytics for this Playground call
    // ─────────────────────────────────────────────
    try {
      const usage = raw?.usage || {}
      const promptTokens = usage.prompt_tokens ?? 0
      const completionTokens = usage.completion_tokens ?? 0
      const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens)

      // TODO: refine cost model per 1K tokens; this is just a placeholder
      const approxCostPer1k = 0.0005 // $0.0005 per 1K tokens (example)
      const totalCostDollars = (totalTokens / 1000) * approxCostPer1k
      const totalCostCents = Math.round(totalCostDollars * 100)

      // Rough “human minutes saved” placeholder (we can tune later)
      // e.g., assume 250 tokens ≈ 1 human-written minute
      const approxHumanMinutes = totalTokens / 250

      // 4.1 Create a session row
      const { data: sessionRow, error: sessionErr } = await supabase
        .from('agent_sessions')
        .insert([
          {
            user_id: agent.user_id ?? null,
            agent_id: agent.id,
            origin: 'playground',
            started_at: new Date().toISOString(),
            total_prompt_tokens: promptTokens,
            total_completion_tokens: completionTokens,
            total_tokens: totalTokens,
            total_cost_cents: totalCostCents,
            approx_human_minutes: approxHumanMinutes,
            metadata: {
              playground_source: 'agents/playground',
            },
          },
        ])
        .select()
        .single()

      if (sessionErr) {
        console.warn('[playground] agent_sessions insert failed:', sessionErr)
      } else if (sessionRow) {
        // 4.2 Log an event tied to this session
        const { error: eventErr } = await supabase.from('agent_events').insert([
          {
            session_id: sessionRow.id,
            agent_id: agent.id,
            event_type: 'playground.call',
            created_at: new Date().toISOString(),
            token_usage: usage,
            payload: {
              last_user_message: lastUserMessage?.content ?? null,
              rag_used: ragContextBlocks.length > 0,
              rag_chunk_count: ragContextBlocks.length,
            },
          },
        ])

        if (eventErr) {
          console.warn('[playground] agent_events insert failed:', eventErr)
        }
      }
    } catch (analyticsErr) {
      console.warn('[playground] analytics logging failed (non-fatal):', analyticsErr)
    }

    return NextResponse.json({
      ok: true,
      data: {
        reply,
      },
    })

  } catch (err) {
    console.error('[playground] unexpected error:', err)
    return NextResponse.json(
      { ok: false, error: 'Unexpected error in playground route.' },
      { status: 500 }
    )
  }
}