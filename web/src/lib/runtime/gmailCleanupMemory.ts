import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GmailCleanupMemoryWritePayload,
  GmailMonitoringSummaryData,
  GmailSenderPolicy,
} from '@/lib/runtime/gmailCleanupWorkspace'

const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'
const GMAIL_MEMORY_SOURCE_TYPES = new Set([
  'gmail_sender_policy_memory',
  'gmail_rule_intent_memory',
])

type GmailMemoryEventRow = {
  id?: string | null
  event_type: string | null
  created_at: string | null
  payload: unknown
}

type GmailMemoryDocRow = {
  source_type: string | null
  source_url: string | null
  title: string | null
  content: string | null
  embedding: unknown
  created_at: string | null
  meta?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normalizeSenderPolicy(
  value: unknown
): Exclude<GmailSenderPolicy, 'undecided'> | null {
  return value === 'keep' ||
    value === 'archive' ||
    value === 'quarantine' ||
    value === 'unsubscribe' ||
    value === 'custom_rule'
    ? value
    : null
}

function senderDomain(sender: string): string | null {
  const email = normalizeText(sender).toLowerCase()
  const at = email.indexOf('@')
  if (at <= 0 || at >= email.length - 1) return null
  return email.slice(at + 1)
}

async function embedText(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY || !text.trim()) return null
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
    const json = await resp.json().catch(() => null)
    const embedding = json?.data?.[0]?.embedding
    return Array.isArray(embedding) ? embedding.map((value: unknown) => Number(value)) : null
  } catch (error) {
    console.warn('[gmail-cleanup-memory] embedding failed:', error)
    return null
  }
}

function parseEmbedding(value: unknown): number[] | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const numbers = value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
    return numbers.length > 0 ? numbers : null
  }
  if (typeof value === 'string' && value.trim()) {
    const cleaned = value.replace(/^\[|\]$/g, '')
    const numbers = cleaned
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
    return numbers.length > 0 ? numbers : null
  }
  return null
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index]
    normA += a[index] * a[index]
    normB += b[index] * b[index]
  }
  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function buildMemoryDocument(params: GmailCleanupMemoryWritePayload): {
  sourceType: string
  sourceUrl: string
  title: string
  content: string
  meta: Record<string, unknown>
  eventType: string
  eventPayload: Record<string, unknown>
  mirrorToRag: boolean
} {
  const action = params.action
  if (action.type === 'sender_policy_set' || action.type === 'sender_policy_removed') {
    const domain = senderDomain(action.sender)
    const eventType =
      action.type === 'sender_policy_set' ? 'sender_policy_set' : 'sender_policy_removed'
    return {
      sourceType: 'gmail_sender_policy_memory',
      sourceUrl: `gmail://sender-policy/${encodeURIComponent(action.senderKey)}`,
      title: `${action.sender} -> ${action.policy}`,
      content: [
        `Sender decision for ${action.sender}.`,
        `Policy: ${action.policy}.`,
        params.cluster ? `Cluster: ${params.cluster.title}.` : null,
        domain ? `Domain: ${domain}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      meta: {
        workspace: 'gmail_cleanup',
        sender_key: action.senderKey,
        sender: action.sender,
        domain,
        policy: action.policy,
        cluster: params.cluster,
        session_id: params.sessionId,
      },
      eventType,
      eventPayload: {
        workspace: 'gmail_cleanup',
        session_id: params.sessionId,
        sender_key: action.senderKey,
        sender: action.sender,
        domain,
        policy: action.policy,
        cluster: params.cluster,
      },
      mirrorToRag: action.type === 'sender_policy_set',
    }
  }

  const ruleAction = action as Extract<
    GmailCleanupMemoryWritePayload['action'],
    { type: 'rule_intent_set' | 'rule_intent_removed' }
  >
  const domain = senderDomain(ruleAction.sender)
  const isCreate = ruleAction.type === 'rule_intent_set'
  return {
    sourceType: 'gmail_rule_intent_memory',
    sourceUrl: `gmail://rule-intent/${encodeURIComponent(ruleAction.intentType)}/${encodeURIComponent(ruleAction.senderKey)}`,
    title: `${ruleAction.sender} -> ${ruleAction.label}`,
    content: [
      `Rule intent for ${ruleAction.sender}.`,
      `Intent: ${ruleAction.intentType}.`,
      `Label: ${ruleAction.label}.`,
      ruleAction.description,
      params.cluster ? `Cluster: ${params.cluster.title}.` : null,
      domain ? `Domain: ${domain}.` : null,
    ]
      .filter(Boolean)
      .join(' '),
    meta: {
      workspace: 'gmail_cleanup',
      sender_key: ruleAction.senderKey,
      sender: ruleAction.sender,
      domain,
      intent_type: ruleAction.intentType,
      label: ruleAction.label,
      description: ruleAction.description,
      cluster: params.cluster,
      session_id: params.sessionId,
    },
    eventType: isCreate ? 'rule_created' : 'rule_rejected',
    eventPayload: {
      workspace: 'gmail_cleanup',
      session_id: params.sessionId,
      sender_key: ruleAction.senderKey,
      sender: ruleAction.sender,
      domain,
      intent_type: ruleAction.intentType,
      label: ruleAction.label,
      description: ruleAction.description,
      cluster: params.cluster,
    },
    mirrorToRag: isCreate,
  }
}

export async function persistGmailCleanupMemory(params: {
  supabase: SupabaseClient
  agentId: string
  payload: GmailCleanupMemoryWritePayload
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const document = buildMemoryDocument(params.payload)
  const createdAt = new Date().toISOString()

  const { error: eventError } = await params.supabase.from('agent_events').insert([
    {
      agent_id: params.agentId,
      event_type: document.eventType,
      created_at: createdAt,
      payload: {
        ...document.eventPayload,
        recorded_at: createdAt,
      },
    },
  ])

  if (eventError) {
    console.error('[gmail-cleanup-memory] event insert failed:', eventError)
    return { ok: false, error: 'Failed to store Gmail cleanup event memory.' }
  }

  const embedding = await embedText(document.content)
  await params.supabase
    .from('rag_documents')
    .delete()
    .eq('agent_id', params.agentId)
    .eq('source_url', document.sourceUrl)
    .eq('source_type', document.sourceType)

  if (document.mirrorToRag) {
    const { error: ragError } = await params.supabase.from('rag_documents').insert([
      {
        agent_id: params.agentId,
        job_id: null,
        source_type: document.sourceType,
        source_url: document.sourceUrl,
        title: document.title,
        raw_text: document.content,
        content: document.content,
        embedding,
        meta: document.meta,
        http_status: 200,
        error_code: null,
      },
    ])

    if (ragError) {
      console.warn('[gmail-cleanup-memory] rag mirror failed (non-fatal):', ragError)
    }
  }

  return { ok: true }
}

function recommendationId(prefix: string, key: string): string {
  return `${prefix}:${key}`
}

export async function loadGmailMonitoringSummary(params: {
  supabase: SupabaseClient
  agentId: string
  clusterId?: string | null
  clusterTitle?: string | null
  candidateSenders?: Array<{ senderKey: string; sender: string }>
}): Promise<{ ok: true; data: GmailMonitoringSummaryData } | { ok: false; error: string }> {
  const { data: eventRows, error: eventError } = await params.supabase
    .from('agent_events')
    .select('id,event_type,created_at,payload')
    .eq('agent_id', params.agentId)
    .in('event_type', [
      'sender_policy_set',
      'sender_policy_removed',
      'rule_created',
      'rule_rejected',
      'automation_recommendation_generated',
    ])
    .order('created_at', { ascending: false })
    .limit(400)

  if (eventError) {
    console.error('[gmail-cleanup-memory] summary event load failed:', eventError)
    return { ok: false, error: 'Failed to load Gmail cleanup event memory.' }
  }

  const rows = (eventRows || []) as GmailMemoryEventRow[]
  const latestPolicyBySender = new Map<
    string,
    GmailMonitoringSummaryData['learned_policies'][number]
  >()
  const latestRuleBySender = new Map<
    string,
    GmailMonitoringSummaryData['rule_intents'][number]
  >()
  const policyEventCounts = new Map<string, number>()
  const recentEvents: GmailMonitoringSummaryData['recent_events'] = []

  for (const row of rows) {
    const payload = parsePayload(row.payload)
    if (!payload) continue
    const senderKey = normalizeText(payload.sender_key)
    const sender = normalizeText(payload.sender)
    const domain = normalizeText(payload.domain) || senderDomain(sender)
    const createdAt = row.created_at || new Date().toISOString()

    if (recentEvents.length < 20) {
      recentEvents.push({
        id: row.id || `${row.event_type || 'event'}:${createdAt}`,
        event_type: row.event_type || 'unknown',
        created_at: createdAt,
        summary:
          row.event_type === 'sender_policy_set'
            ? `${sender || 'Sender'} learned as ${normalizeText(payload.policy) || 'policy'}`
            : row.event_type === 'rule_created'
              ? `${sender || 'Sender'} created rule intent ${normalizeText(payload.intent_type)}`
              : row.event_type === 'rule_rejected'
                ? `${sender || 'Sender'} removed rule intent ${normalizeText(payload.intent_type)}`
                : row.event_type === 'sender_policy_removed'
                  ? `${sender || 'Sender'} policy removed`
                  : 'Recommendation generated',
      })
    }

    if (row.event_type === 'sender_policy_set') {
      const policy = normalizeSenderPolicy(payload.policy)
      if (!senderKey || !sender || !policy) continue
      if (!latestPolicyBySender.has(senderKey)) {
        latestPolicyBySender.set(senderKey, {
          sender_key: senderKey,
          sender,
          domain,
          policy,
          updated_at: createdAt,
          source: 'agent_events',
          event_count: 0,
        })
      }
      policyEventCounts.set(senderKey, (policyEventCounts.get(senderKey) || 0) + 1)
      continue
    }

    if (row.event_type === 'sender_policy_removed') {
      if (senderKey) latestPolicyBySender.delete(senderKey)
      continue
    }

    if (row.event_type === 'rule_created') {
      const intentType = normalizeText(payload.intent_type)
      if (!senderKey || !sender || !intentType) continue
      if (!latestRuleBySender.has(senderKey)) {
        latestRuleBySender.set(senderKey, {
          sender_key: senderKey,
          sender,
          intent_type:
            intentType === 'keep' ||
            intentType === 'quarantine' ||
            intentType === 'unsubscribe' ||
            intentType === 'custom_rule'
              ? intentType
              : 'custom_rule',
          label: normalizeText(payload.label) || 'Rule intent',
          description: normalizeText(payload.description) || 'Future Gmail automation intent.',
          updated_at: createdAt,
        })
      }
      continue
    }

    if (row.event_type === 'rule_rejected' && senderKey) {
      latestRuleBySender.delete(senderKey)
    }
  }

  const learnedPolicies = Array.from(latestPolicyBySender.values())
    .map((entry) => ({
      ...entry,
      event_count: policyEventCounts.get(entry.sender_key) || 1,
    }))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  const ruleIntents = Array.from(latestRuleBySender.values()).sort(
    (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
  )

  const { data: ragRows, error: ragError } = await params.supabase
    .from('rag_documents')
    .select('source_type,source_url,title,content,embedding,created_at,meta')
    .eq('agent_id', params.agentId)
    .in('source_type', Array.from(GMAIL_MEMORY_SOURCE_TYPES))
    .order('created_at', { ascending: false })
    .limit(250)

  if (ragError) {
    console.warn('[gmail-cleanup-memory] rag load failed (non-fatal):', ragError)
  }

  const candidateSenders = params.candidateSenders || []
  const recommendations: GmailMonitoringSummaryData['recommendations'] = []
  const semanticMatches: GmailMonitoringSummaryData['semantic_matches'] = []
  const domainPolicyMap = new Map<string, Array<Exclude<GmailSenderPolicy, 'undecided'>>>()

  for (const policy of learnedPolicies) {
    if (!policy.domain) continue
    const current = domainPolicyMap.get(policy.domain) || []
    current.push(policy.policy)
    domainPolicyMap.set(policy.domain, current)
  }

  for (const sender of candidateSenders) {
    const domain = senderDomain(sender.sender)
    if (!domain) continue
    const domainPolicies = domainPolicyMap.get(domain) || []
    if (domainPolicies.length < 2) continue
    const policyCounts = new Map<string, number>()
    for (const policy of domainPolicies) {
      policyCounts.set(policy, (policyCounts.get(policy) || 0) + 1)
    }
    const topPolicy = Array.from(policyCounts.entries()).sort((a, b) => b[1] - a[1])[0]
    if (!topPolicy) continue
    recommendations.push({
      id: recommendationId('domain', `${domain}:${sender.senderKey}`),
      title: `Domain memory suggests ${topPolicy[0]}`,
      summary: `${domainPolicies.length} prior decisions from ${domain} lean toward ${topPolicy[0]}.`,
      recommended_policy: topPolicy[0] as Exclude<GmailSenderPolicy, 'undecided'>,
      confidence: topPolicy[1] >= 3 ? 'high' : 'moderate',
      sender_key: sender.senderKey,
      sender: sender.sender,
      domain,
      evidence: [
        `${topPolicy[1]} learned decisions from ${domain}`,
        'Monitoring uses sender/domain memory before suggesting automation',
      ],
    })
  }

  const queryText =
    candidateSenders.length > 0
      ? candidateSenders
          .slice(0, 8)
          .map((sender) => `${sender.sender} cleanup policy`)
          .join(' | ')
      : `${params.clusterTitle || 'gmail cleanup'} sender policy memory`

  const queryEmbedding = await embedText(queryText)
  if (queryEmbedding && Array.isArray(ragRows)) {
    const scored = (ragRows as GmailMemoryDocRow[])
      .map((row) => {
        const embedding = parseEmbedding(row.embedding)
        if (!embedding || !row.content) return null
        const similarity = cosineSimilarity(queryEmbedding, embedding)
        const meta = parsePayload(row.meta)
        const policy = normalizeSenderPolicy(meta?.policy)
        return {
          sender_key: normalizeText(meta?.sender_key) || null,
          sender: normalizeText(meta?.sender) || null,
          policy,
          similarity,
          excerpt: row.content.slice(0, 220),
          source_url: row.source_url,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6)

    semanticMatches.push(...scored)

    for (const match of scored.slice(0, 3)) {
      if (!match.policy) continue
      recommendations.push({
        id: recommendationId('semantic', match.source_url || match.sender_key || String(match.similarity)),
        title: `Similar learned sender pattern found`,
        summary: match.sender
          ? `${match.sender} previously learned as ${match.policy}.`
          : `Semantic Gmail memory suggests ${match.policy}.`,
        recommended_policy: match.policy,
        confidence: match.similarity >= 0.84 ? 'high' : 'moderate',
        sender_key: match.sender_key,
        sender: match.sender,
        domain: match.sender ? senderDomain(match.sender) : null,
        evidence: [
          `Semantic similarity ${match.similarity.toFixed(2)}`,
          'Retrieved from Gmail cleanup memory in rag_documents',
        ],
      })
    }
  }

  const dedupedRecommendations = Array.from(
    new Map(recommendations.map((entry) => [entry.id, entry])).values()
  )
    .sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence === 'high' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    .slice(0, 8)

  if (dedupedRecommendations.length > 0) {
    const latestRecommendationKey = dedupedRecommendations.map((entry) => entry.id).join('|')
    const latestEvent = rows.find((row) => row.event_type === 'automation_recommendation_generated')
    const latestPayload = latestEvent ? parsePayload(latestEvent.payload) : null
    const latestKey = normalizeText(latestPayload?.recommendation_key)
    if (latestKey !== latestRecommendationKey.toLowerCase()) {
      await params.supabase.from('agent_events').insert([
        {
          agent_id: params.agentId,
          event_type: 'automation_recommendation_generated',
          created_at: new Date().toISOString(),
          payload: {
            workspace: 'gmail_cleanup',
            recommendation_key: latestRecommendationKey,
            cluster_id: params.clusterId || null,
            cluster_title: params.clusterTitle || null,
            recommendations: dedupedRecommendations.slice(0, 3),
          },
        },
      ])
    }
  }

  return {
    ok: true,
    data: {
      learned_policies: learnedPolicies,
      rule_intents: ruleIntents,
      recommendations: dedupedRecommendations,
      semantic_matches: semanticMatches,
      recent_events: recentEvents,
    },
  }
}
