import type { getSupabaseAdmin } from '@/lib/supabase'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

const PLAYGROUND_AGENT_CONFIG_CACHE_TTL_MS = 1000 * 60 * 5

type CachedPlaygroundAgentConfigEntry = {
  expiresAtMs: number
  data: LoadedPlaygroundAgentConfig
}

type AgentLookupRow = {
  id: string
  user_id: string | null
  name: string | null
  primary_prompt: string | null
  onboarding_summary: unknown
  rag_sources: unknown
  crawl_domains: unknown
  quality_score: unknown
  quality_feedback: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type LoadedPlaygroundAgentConfig = {
  agent: AgentLookupRow
  summary: Record<string, unknown>
  ragSources: string[]
  crawlDomains: string[]
}

const playgroundAgentConfigGlobal = globalThis as typeof globalThis & {
  __playgroundAgentConfigCache?: Map<string, CachedPlaygroundAgentConfigEntry>
}

const playgroundAgentConfigCache =
  playgroundAgentConfigGlobal.__playgroundAgentConfigCache || new Map<string, CachedPlaygroundAgentConfigEntry>()

if (!playgroundAgentConfigGlobal.__playgroundAgentConfigCache) {
  playgroundAgentConfigGlobal.__playgroundAgentConfigCache = playgroundAgentConfigCache
}

export async function loadPlaygroundAgentConfig(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<
  | { ok: true; data: LoadedPlaygroundAgentConfig }
  | { ok: false; error: unknown | null }
> {
  const cacheKey = params.agentId.trim()
  const now = Date.now()
  const cached = cacheKey ? playgroundAgentConfigCache.get(cacheKey) || null : null
  if (cached && cached.expiresAtMs > now) {
    return { ok: true, data: cached.data }
  }

  const { data: agent, error } = await params.supabase
    .from('agents')
    .select(
      'id, user_id, name, primary_prompt, onboarding_summary, rag_sources, crawl_domains, quality_score, quality_feedback'
    )
    .eq('id', params.agentId)
    .single()

  if (error || !agent) {
    if (cached?.data) {
      return { ok: true, data: cached.data }
    }
    return { ok: false, error: error ?? null }
  }

  const typedAgent = agent as AgentLookupRow
  const summary = isRecord(typedAgent.onboarding_summary) ? typedAgent.onboarding_summary : {}

  const ragSources: string[] = Array.isArray(typedAgent.rag_sources)
    ? typedAgent.rag_sources
    : Array.isArray(summary.rag_links)
    ? summary.rag_links
    : typeof summary.rag_links === 'string'
    ? [summary.rag_links]
    : []

  const crawlDomains: string[] = Array.isArray(typedAgent.crawl_domains)
    ? typedAgent.crawl_domains
    : Array.isArray(summary.crawl_domains)
    ? summary.crawl_domains
    : typeof summary.crawl_domains === 'string'
    ? summary.crawl_domains
        .split(/[\n,]+/)
        .map((v: string) => v.trim())
        .filter(Boolean)
    : []

  const loaded = {
    agent: typedAgent,
    summary,
    ragSources,
    crawlDomains,
  } satisfies LoadedPlaygroundAgentConfig

  if (cacheKey) {
    playgroundAgentConfigCache.set(cacheKey, {
      expiresAtMs: now + PLAYGROUND_AGENT_CONFIG_CACHE_TTL_MS,
      data: loaded,
    })
  }

  return {
    ok: true,
    data: loaded,
  }
}
