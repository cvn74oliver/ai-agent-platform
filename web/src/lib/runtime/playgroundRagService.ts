import type { getSupabaseAdmin } from '@/lib/supabase'

const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

type RagSourceType = string | null

type RagDocumentCandidate = {
  content: string
  source_type: RagSourceType
  source_url: string | null
  similarity: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

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

  if (typeof v === 'object') {
    const vals = Object.values(v)
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

function vectorLiteralFromArray(vec: number[]): string {
  return `[${vec.join(',')}]`
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

function urlBadnessPenalty(url: string, queryText?: string): number {
  const u = (url || '').toLowerCase()
  if (!u) return 0

  if (u.includes('/my-account')) return 0.30
  if (u.includes('/cart')) return 0.25
  if (u.includes('/checkout')) return 0.25
  if (u.includes('add_to_compare')) return 0.35
  if (u.includes('add_to_wishlist')) return 0.35
  if (u.includes('add-to-cart=')) return 0.35
  if (u.includes('?')) return 0.08

  const qt = String(queryText || '')
  if (qt && isBookIntent(qt) && u.includes('/product/')) return 0.22

  return 0
}

function productPagePenalty(url: string, queryText: string): number {
  const u = (url || '').toLowerCase()
  if (!u) return 0
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

  if (opts.title) {
    const tBoost = urlKeywordScore(opts.title, opts.queryText)
    sim = Math.max(sim, 0.20 + tBoost * 0.80)
  }

  if (opts.wantsLink && opts.sourceUrl) {
    const uBoost = urlKeywordScore(opts.sourceUrl, opts.queryText)
    sim = Math.max(sim, 0.15 + uBoost * 0.85)
  }

  if (opts.sourceType === 'drive') {
    sim += opts.preferDrive ? 0.28 : 0.12
  }

  if (opts.sourceUrl) {
    sim -= urlBadnessPenalty(opts.sourceUrl, opts.queryText)
    sim -= productPagePenalty(opts.sourceUrl, opts.queryText)
  }

  return sim
}

function normalizeRagCandidate(record: Record<string, unknown>): RagDocumentCandidate | null {
  const content = normalizeText(record.content)
  const sourceType = typeof record.source_type === 'string' ? record.source_type : null
  const sourceUrl = typeof record.source_url === 'string' ? record.source_url : null
  const similarity =
    typeof record.similarity === 'number' && Number.isFinite(record.similarity)
      ? record.similarity
      : 0

  if (!content) return null

  return {
    content,
    source_type: sourceType,
    source_url: sourceUrl,
    similarity,
  }
}

function dedupeBySourceUrl(rows: RagDocumentCandidate[]): RagDocumentCandidate[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const urlKey = String(row.source_url || '')
    if (!urlKey) return true
    if (seen.has(urlKey)) return false
    seen.add(urlKey)
    return true
  })
}

async function retrieveRagContextJsFallback(opts: {
  supabase: SupabaseAdminClient
  agentId: string
  queryText: string
  topK: number
  minSim: number
}): Promise<RagDocumentCandidate[]> {
  const { supabase, agentId, queryText, topK, minSim } = opts

  const wantsLink = /\b(link|url|article|blog)\b/i.test(queryText || '')
  const preferDrive = isBookIntent(queryText)

  const queryEmbedding = await embedText(queryText)
  if (!queryEmbedding) return []

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

  const docs = Array.isArray(docsRecent) ? docsRecent : []
  if (!docs.length) return []

  const scored = docs
    .map((row) => {
      if (!isRecord(row)) return null

      const emb = parseEmbedding(row.embedding)
      const content = normalizeText(row.content)
      const title = normalizeText(row.title)
      const url = typeof row.source_url === 'string' ? row.source_url : ''

      if (!emb || !content) return null

      let sim = cosineSimilarity(emb, queryEmbedding)
      sim = applyRetrievalAdjustments({
        baseSim: sim,
        sourceType: typeof row.source_type === 'string' ? row.source_type : null,
        sourceUrl: url || null,
        title,
        queryText,
        wantsLink,
        preferDrive,
      })

      return {
        content,
        source_type: typeof row.source_type === 'string' ? row.source_type : null,
        source_url: typeof row.source_url === 'string' ? row.source_url : null,
        similarity: sim,
      }
    })
    .filter((row): row is RagDocumentCandidate => row != null)

  scored.sort((a, b) => b.similarity - a.similarity)
  const deduped = dedupeBySourceUrl(scored)

  const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
  const top = deduped.filter((row) => row.similarity >= threshold).slice(0, topK)

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

async function retrieveRagContext(opts: {
  supabase: SupabaseAdminClient
  agentId: string
  queryText: string
  maxJobs?: number
  maxDocs?: number
  topK?: number
  minSim?: number
}): Promise<RagDocumentCandidate[]> {
  const { supabase, agentId, queryText, topK = 5, minSim = 0.25 } = opts

  const wantsLink = /\b(link|url|article|blog)\b/i.test(queryText || '')
  const preferDrive = isBookIntent(queryText)

  const queryEmbedding = await embedText(queryText)
  if (!queryEmbedding) {
    console.warn('[playground] No query embedding — skipping RAG.')
    return []
  }

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
        const docs = Array.isArray(driveDocs) ? driveDocs : []

        const scoredDrive: RagDocumentCandidate[] = []
        for (const row of docs) {
          if (!isRecord(row)) continue

          const emb = parseEmbedding(row.embedding)
          const content = normalizeText(row.content)
          const title = normalizeText(row.title)
          const url = typeof row.source_url === 'string' ? row.source_url : ''
          if (!emb || !content) continue

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

          scoredDrive.push({
            content,
            source_type: 'drive',
            source_url: typeof row.source_url === 'string' ? row.source_url : null,
            similarity: sim,
          })
        }

        scoredDrive.sort((a, b) => b.similarity - a.similarity)

        const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
        const topDrive = scoredDrive.filter((row) => row.similarity >= threshold).slice(0, topK)

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
          .map((row) => {
            if (!isRecord(row)) return null

            const content = normalizeText(row.content)
            const title = normalizeText(row.title)
            const url = typeof row.source_url === 'string' ? row.source_url : ''

            let sim = typeof row.similarity === 'number' ? row.similarity : 0
            if (typeof row.distance === 'number' && sim === 0) {
              sim = 1 - row.distance
            }

            sim = applyRetrievalAdjustments({
              baseSim: sim,
              sourceType: typeof row.source_type === 'string' ? row.source_type : null,
              sourceUrl: url || null,
              title,
              queryText,
              wantsLink,
              preferDrive,
            })

            return normalizeRagCandidate({
              content,
              source_type: typeof row.source_type === 'string' ? row.source_type : null,
              source_url: typeof row.source_url === 'string' ? row.source_url : null,
              similarity: sim,
            })
          })
          .filter((row): row is RagDocumentCandidate => row != null)

        normalized.sort((a, b) => b.similarity - a.similarity)
        const deduped = dedupeBySourceUrl(normalized)

        const threshold = wantsLink ? Math.min(minSim, 0.2) : minSim
        const top = deduped.filter((row) => row.similarity >= threshold).slice(0, topK)

        console.log(
          '[playground] RAG retrieved chunks (pgvector):',
          top.map((t) => ({
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

  return retrieveRagContextJsFallback({
    supabase,
    agentId,
    queryText,
    topK,
    minSim,
  })
}

export function formatPlaygroundRagContextBlocks(chunks: RagDocumentCandidate[]): string[] {
  return chunks.map((chunk, idx) => {
    const header = `Context #${idx + 1} — source_type: ${
      chunk.source_type || 'unknown'
    }, source_url: ${chunk.source_url || 'unknown'}`
    return `${header}\n${chunk.content}`
  })
}

export async function loadPlaygroundRagContext(params: {
  supabase: SupabaseAdminClient
  agentId: string
  queryText: string
  maxJobs?: number
  maxDocs?: number
  topK?: number
  minSim?: number
}): Promise<string[]> {
  const chunks = await retrieveRagContext({
    supabase: params.supabase,
    agentId: params.agentId,
    queryText: params.queryText,
    maxJobs: params.maxJobs,
    maxDocs: params.maxDocs,
    topK: params.topK,
    minSim: params.minSim,
  })

  if (chunks.length === 0) return []
  return formatPlaygroundRagContextBlocks(chunks)
}
