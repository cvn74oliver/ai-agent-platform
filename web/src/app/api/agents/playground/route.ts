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
  title: string | null
  content: string | null
  embedding: number[] | null
}

// -----------------------------------------------------------------------------
// Embedding helpers (robust parsing + cosine similarity)
// -----------------------------------------------------------------------------

function parseEmbedding(v: unknown): number[] | null {
  if (!v) return null
  if (Array.isArray(v)) {
    const out = v.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    return out.length ? out : null
  }
  if (typeof v === 'string') {
    const t = v.trim()
    const inner = t.startsWith('{') && t.endsWith('}') ? t.slice(1, -1) : t
    const inner2 = inner.startsWith('[') && inner.endsWith(']') ? inner.slice(1, -1) : inner
    const parts = inner2.split(',').map((p) => p.trim()).filter(Boolean)
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n))
    return nums.length ? nums : null
  }

  // Some clients serialize as objects; attempt numeric values.
  if (typeof v === 'object') {
    const vals = Object.values(v as any)
    if (vals.length && vals.every((x) => typeof x === 'number')) {
      const out = (vals as number[]).filter((n) => Number.isFinite(n))
      return out.length ? out : null
    }
  }

  return null
}

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

function normalizeText(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
}

function urlKeywordScore(url: string, q: string): number {
  const u = (url || '').toLowerCase()
  if (!u) return 0

  const tokens = (q || '')
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

async function retrieveRagContextJsFallback(opts: {
  supabase: any
  agentId: string
  queryText: string
  topK: number
  minSim: number
}): Promise<
  {
    content: string
    source_type: string | null
    source_url: string | null
    similarity: number
  }[]
> {
  const { supabase, agentId, queryText, topK, minSim } = opts

  // NOTE: This is a fallback for environments where pgvector/RPC isn't available or isn't wired.
  // We keep limits conservative to avoid heavy CPU.
  const wantsLink = /\b(link|url|article|blog)\b/i.test(queryText || '')
  const preferDrive = isBookIntent(queryText)

  const queryEmbedding = await embedText(queryText)
  if (!queryEmbedding) return []

  // Fetch a bigger set so we can rank in JS.
  // Prefer recent docs, but pull enough to include Drive.
  const maxDocs = wantsLink ? 2500 : 1500

  const { data: docsRecent, error: docsErr } = await supabase
    .from('rag_documents')
    .select('id, source_type, source_url, title, content, embedding, created_at')
    .eq('agent_id', agentId)
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(maxDocs)

  if (docsErr) {
    console.warn('[playground] JS fallback rag_documents query error:', docsErr)
    return []
  }

  const docs = Array.isArray(docsRecent) ? (docsRecent as any[]) : []
  if (!docs.length) return []

  const scored = docs
    .map((d) => {
      const emb = parseEmbedding(d?.embedding)
      const content = normalizeText(d?.content)
      const title = normalizeText(d?.title)
      const url = typeof d?.source_url === 'string' ? d.source_url : ''

      if (!emb || !content) return null

      // Base sim
      let sim = cosineSimilarity(emb, queryEmbedding)

      // Apply consistent boosts/penalties (title/link boost, drive boost, junk-url penalty)
      sim = applyRetrievalAdjustments({
        baseSim: sim,
        sourceType: (d?.source_type ?? null) as string | null,
        sourceUrl: url || null,
        title,
        queryText,
        wantsLink,
        preferDrive,
      })

      return {
        content,
        source_type: (d?.source_type ?? null) as string | null,
        source_url: (d?.source_url ?? null) as string | null,
        similarity: sim,
      }
    })
    .filter(Boolean) as {
    content: string
    source_type: string | null
    source_url: string | null
    similarity: number
  }[]

  scored.sort((a, b) => b.similarity - a.similarity)

  const seen = new Set<string>()
  const deduped = scored.filter((r) => {
    const urlKey = String(r?.source_url || '')
    if (!urlKey) return true
    if (seen.has(urlKey)) return false
    seen.add(urlKey)
    return true
  })

  const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
  const top = deduped.filter((r) => r.similarity >= threshold).slice(0, topK)

  console.log(
    '[playground] RAG retrieved chunks (JS fallback):',
    top.map((t) => ({
      sim: t.similarity.toFixed(3),
      url: t.source_url,
      type: t.source_type,
    }))
  )

  return top
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
function vectorLiteralFromArray(vec: number[]): string {
  // PostgREST accepts pgvector input as a string like "[0.1,0.2,...]"
  return `[${vec.join(',')}]`
}

function urlBadnessPenalty(url: string, queryText?: string): number {
  const u = (url || '').toLowerCase()
  if (!u) return 0

  // Always penalize noisy e-commerce/account URLs
  if (u.includes('/my-account')) return 0.30
  if (u.includes('/cart')) return 0.25
  if (u.includes('/checkout')) return 0.25
  if (u.includes('add_to_compare')) return 0.35
  if (u.includes('add_to_wishlist')) return 0.35
  if (u.includes('add-to-cart=')) return 0.35
  if (u.includes('?')) return 0.08

  // If user is asking about book/PDF content (not buying), de-prioritize store product pages
  const qt = String(queryText || '')
  if (qt && isBookIntent(qt) && u.includes('/product/')) return 0.22

  return 0
}

function isBookIntent(q: string): boolean {
  const t = (q || '').toLowerCase()
  return (
    t.includes('table of contents') ||
    t.includes('toc') ||
    t.includes('chapter') ||
    t.includes('page ') ||
    t.includes('section') ||
    t.includes('in the book') ||
    t.includes('in the guide') ||
    t.includes('this guide') ||
    t.includes('pdf') ||
    t.includes('ebook') ||
    t.includes('book') ||
    t.includes('manual')
  )
}

function productPagePenalty(url: string, queryText: string): number {
  const u = (url || '').toLowerCase()
  if (!u) return 0

  // If the user is asking about book/PDF content, product pages are often the wrong source.
  // Keep a small extra penalty here; main penalty is in urlBadnessPenalty.
  if (isBookIntent(queryText) && u.includes('/product/')) return 0.06

  return 0
}

function applyRetrievalAdjustments(opts: {
  baseSim: number
  sourceType: string | null
  sourceUrl: string | null
  title: string
  queryText: string
  wantsLink: boolean
  preferDrive: boolean
}): number {
  let sim = Number.isFinite(opts.baseSim) ? opts.baseSim : 0

  // Title boost helps when users search by filename (esp. Drive PDFs)
  if (opts.title) {
    const tBoost = urlKeywordScore(opts.title, opts.queryText)
    sim = Math.max(sim, 0.20 + tBoost * 0.80)
  }

  // Link intent boost
  if (opts.wantsLink && opts.sourceUrl) {
    const uBoost = urlKeywordScore(opts.sourceUrl, opts.queryText)
    sim = Math.max(sim, 0.15 + uBoost * 0.85)
  }

  // When the user is asking about *book/guide/PDF content*, heavily prefer Drive chunks.
  if (opts.sourceType === 'drive') {
    sim += opts.preferDrive ? 0.28 : 0.12
  }

  // Penalize junk URLs + product pages (when not shopping)
  if (opts.sourceUrl) {
    sim -= urlBadnessPenalty(opts.sourceUrl, opts.queryText)
    sim -= productPagePenalty(opts.sourceUrl, opts.queryText)
  }

  return sim
}

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
  const { supabase, agentId, queryText, topK = 5, minSim = 0.25 } = opts

  const wantsLink = /\b(link|url|article|blog)\b/i.test(queryText || '')
  const preferDrive = isBookIntent(queryText)

  // 1) Embed query
  const queryEmbedding = await embedText(queryText)
  if (!queryEmbedding) {
    console.warn('[playground] No query embedding — skipping RAG.')
    return []
  }

  // ---------------------------------------------------------------------------
  // Drive-first retrieval for "book/PDF" questions.
  // IMPORTANT: pgvector RPC may return mostly URL pages; boosts don't help if
  // no Drive rows are returned. So we do an explicit Drive-only pass first.
  // ---------------------------------------------------------------------------
  if (preferDrive) {
    try {
      const driveMaxDocs = 2500
      const { data: driveDocs, error: driveErr } = await supabase
        .from('rag_documents')
        .select('id, source_type, source_url, title, content, embedding, created_at')
        .eq('agent_id', agentId)
        .eq('source_type', 'drive')
        .not('content', 'is', null)
        .not('embedding', 'is', null)
        .order('created_at', { ascending: false })
        .limit(driveMaxDocs)

      if (driveErr) {
        console.warn('[playground] drive-first rag_documents query error (non-fatal):', driveErr)
      } else {
        const docs = Array.isArray(driveDocs) ? (driveDocs as any[]) : []

        const scoredDrive = docs
          .map((d) => {
            const emb = parseEmbedding(d?.embedding)
            const content = normalizeText(d?.content)
            const title = normalizeText(d?.title)
            const url = typeof d?.source_url === 'string' ? d.source_url : ''
            if (!emb || !content) return null

            let sim = cosineSimilarity(emb, queryEmbedding)
            sim = applyRetrievalAdjustments({
              baseSim: sim,
              sourceType: 'drive',
              sourceUrl: url || null,
              title,
              queryText,
              wantsLink,
              preferDrive: true,
            })

            return {
              content,
              source_type: 'drive' as const,
              source_url: (d?.source_url ?? null) as string | null,
              similarity: sim,
            }
          })
          .filter(Boolean) as {
          content: string
          source_type: 'drive'
          source_url: string | null
          similarity: number
        }[]

        scoredDrive.sort((a, b) => b.similarity - a.similarity)

        const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
        const topDrive = scoredDrive.filter((r) => r.similarity >= threshold).slice(0, topK)

        if (topDrive.length > 0) {
          console.log(
            '[playground] RAG retrieved chunks (drive-first):',
            topDrive.map((t) => ({
              sim: Number(t.similarity || 0).toFixed(3),
              url: t.source_url,
              type: t.source_type,
            }))
          )
          return topDrive
        }
      }
    } catch (e) {
      console.warn('[playground] drive-first retrieval threw (non-fatal):', e)
    }
  }

  // 2) Try pgvector RPC first (fast + scalable)
  try {
    const fetchCount = wantsLink ? Math.max(topK * 6, 30) : Math.max(topK * 8, 80)
    const queryVec = vectorLiteralFromArray(queryEmbedding)

    const { data, error } = await supabase.rpc('match_rag_documents', {
      p_agent_id: agentId,
      p_query_embedding: queryVec,
      p_match_count: fetchCount,
    })

    if (error) {
      console.warn('[playground] match_rag_documents rpc error (will fallback):', error)
    } else {
      const rows = Array.isArray(data) ? data : []

      if (rows.length > 0) {
        const normalized = rows
          .map((r: any) => {
            const content = normalizeText(r?.content)
            const title = normalizeText(r?.title)
            const url = typeof r?.source_url === 'string' ? r.source_url : ''

            // Some RPCs return distance instead of similarity.
            // We standardize on similarity where higher is better.
            let sim = typeof r?.similarity === 'number' ? r.similarity : 0
            if (typeof r?.distance === 'number' && sim === 0) {
              sim = 1 - r.distance
            }

            // Apply consistent boosts/penalties
            sim = applyRetrievalAdjustments({
              baseSim: sim,
              sourceType: (r?.source_type ?? null) as string | null,
              sourceUrl: url || null,
              title,
              queryText,
              wantsLink,
              preferDrive,
            })

            return {
              content,
              source_type: (r?.source_type ?? null) as string | null,
              source_url: (r?.source_url ?? null) as string | null,
              similarity: sim,
            }
          })
          .filter((r: any) => typeof r?.content === 'string' && r.content.length > 0)

        normalized.sort((a: any, b: any) => b.similarity - a.similarity)

        const seen = new Set<string>()
        const deduped = normalized.filter((r: any) => {
          const urlKey = String(r?.source_url || '')
          if (!urlKey) return true
          if (seen.has(urlKey)) return false
          seen.add(urlKey)
          return true
        })

        const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
        const top = deduped.filter((r: any) => r.similarity >= threshold).slice(0, topK)

        console.log(
          '[playground] RAG retrieved chunks (pgvector):',
          top.map((t: any) => ({
            sim: Number(t.similarity || 0).toFixed(3),
            url: t.source_url,
            type: t.source_type,
          }))
        )

        if (top.length > 0) return top
      }
    }
  } catch (e) {
    console.warn('[playground] match_rag_documents rpc threw (will fallback):', e)
  }

  // 3) JS cosine fallback (works with float8[] embeddings)
  return retrieveRagContextJsFallback({
    supabase,
    agentId,
    queryText,
    topK,
    minSim,
  })
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