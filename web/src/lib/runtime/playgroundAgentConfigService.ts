import type { getSupabaseAdmin } from '@/lib/supabase'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

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

export async function loadPlaygroundAgentConfig(params: {
  supabase: SupabaseAdminClient
  agentId: string
}): Promise<
  | { ok: true; data: LoadedPlaygroundAgentConfig }
  | { ok: false; error: unknown | null }
> {
  const { data: agent, error } = await params.supabase
    .from('agents')
    .select(
      'id, user_id, name, primary_prompt, onboarding_summary, rag_sources, crawl_domains, quality_score, quality_feedback'
    )
    .eq('id', params.agentId)
    .single()

  if (error || !agent) {
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

  return {
    ok: true,
    data: {
      agent: typedAgent,
      summary,
      ragSources,
      crawlDomains,
    },
  }
}

