import type { getSupabaseAdmin } from '@/lib/supabase'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

type PlaygroundUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

type PlaygroundConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function logPlaygroundCallAnalytics(params: {
  supabase: SupabaseAdminClient
  currentSessionId: string | null
  sessionOrigin?: 'playground' | 'playground_review_detail'
  agentId: string
  agentUserId: string | null
  usage: PlaygroundUsage | null | undefined
  lastUserMessage: string | null
  ragChunkCount: number
  conversationMessages?: PlaygroundConversationMessage[] | null
}): Promise<{ sessionId: string | null }> {
  let sessionId = params.currentSessionId
  const sessionOrigin =
    params.sessionOrigin === 'playground_review_detail' ? 'playground_review_detail' : 'playground'

  try {
    const usage = params.usage || {}
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

    if (!sessionId) {
      // 4.1 Create a new session row when the caller does not provide one
      const { data: sessionRow, error: sessionErr } = await params.supabase
        .from('agent_sessions')
        .insert([
          {
            user_id: params.agentUserId ?? null,
            agent_id: params.agentId,
            origin: sessionOrigin,
            started_at: new Date().toISOString(),
            total_prompt_tokens: promptTokens,
            total_completion_tokens: completionTokens,
            total_tokens: totalTokens,
            total_cost_cents: totalCostCents,
            approx_human_minutes: approxHumanMinutes,
            metadata: {
              playground_source: 'agents/playground',
              session_origin: sessionOrigin,
            },
          },
        ])
        .select()
        .single()

      if (sessionErr) {
        console.warn('[playground] agent_sessions insert failed:', sessionErr)
      } else if (sessionRow?.id) {
        sessionId = sessionRow.id
      }
    }

    if (sessionId) {
      // 4.2 Log an event tied to the current session
      const { error: eventErr } = await params.supabase.from('agent_events').insert([
        {
          session_id: sessionId,
          agent_id: params.agentId,
          event_type: 'playground.call',
          created_at: new Date().toISOString(),
          token_usage: usage,
          payload: {
            last_user_message: params.lastUserMessage,
            rag_used: params.ragChunkCount > 0,
            rag_chunk_count: params.ragChunkCount,
            session_origin: sessionOrigin,
          },
        },
      ])

      if (eventErr) {
        console.warn('[playground] agent_events insert failed:', eventErr)
      }

      const snapshotMessages = Array.isArray(params.conversationMessages)
        ? params.conversationMessages
            .filter(
              (message): message is PlaygroundConversationMessage =>
                !!message &&
                (message.role === 'user' || message.role === 'assistant') &&
                typeof message.content === 'string'
            )
            .slice(-40)
        : []

      if (snapshotMessages.length > 0) {
        const { error: snapshotErr } = await params.supabase.from('agent_events').insert([
          {
            session_id: sessionId,
            agent_id: params.agentId,
            event_type: 'playground.session_snapshot',
            created_at: new Date().toISOString(),
            payload: {
              session_id: sessionId,
              message_count: snapshotMessages.length,
              updated_at: new Date().toISOString(),
              session_origin: sessionOrigin,
              messages: snapshotMessages,
            },
          },
        ])

        if (snapshotErr) {
          console.warn('[playground] session snapshot insert failed (non-fatal):', snapshotErr)
        }
      }
    }
  } catch (analyticsErr) {
    console.warn('[playground] analytics logging failed (non-fatal):', analyticsErr)
  }

  return { sessionId }
}
