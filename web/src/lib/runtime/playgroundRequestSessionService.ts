import type { getSupabaseAdmin } from '@/lib/supabase'
import { loadLatestPlaygroundSessionId } from '@/lib/runtime/stateLoaders'
import type { PlaygroundChatMessage } from '@/lib/runtime/playgroundChatService'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

type PlaygroundRequestBody = {
  agent_id?: string
  messages?: PlaygroundChatMessage[]
  session_id?: string
  rehydrate_only?: boolean
}

export type NormalizedPlaygroundRequest = {
  agentId: string | undefined
  rehydrateOnly: boolean
  safeMessages: PlaygroundChatMessage[]
  incomingSessionId: string | null
  isValid: boolean
  lastUserMessage: PlaygroundChatMessage | undefined
  lastUserMessageText: string
}

export function normalizePlaygroundRequestBody(
  body: PlaygroundRequestBody
): NormalizedPlaygroundRequest {
  const { agent_id, messages, session_id, rehydrate_only } = body
  const rehydrateOnly = rehydrate_only === true
  const safeMessages = Array.isArray(messages) ? messages : []
  const incomingSessionId =
    typeof session_id === 'string' && session_id.trim().length > 0 ? session_id.trim() : null
  const isValid = Boolean(agent_id) && (Array.isArray(messages) || rehydrateOnly)
  const lastUserMessage = [...safeMessages].reverse().find((m) => m.role === 'user')
  const lastUserMessageText =
    lastUserMessage && typeof lastUserMessage.content === 'string' ? lastUserMessage.content.trim() : ''

  return {
    agentId: agent_id,
    rehydrateOnly,
    safeMessages,
    incomingSessionId,
    isValid,
    lastUserMessage,
    lastUserMessageText,
  }
}

export async function resolvePlaygroundSessionId(params: {
  supabase: SupabaseAdminClient
  agentId: string
  incomingSessionId: string | null
  allowFallbackToLatest?: boolean
}): Promise<string | null> {
  let responseSessionId: string | null = params.incomingSessionId
  const allowFallbackToLatest = params.allowFallbackToLatest !== false
  if (!responseSessionId && allowFallbackToLatest) {
    responseSessionId = await loadLatestPlaygroundSessionId({
      supabase: params.supabase,
      agentId: params.agentId,
    })
  }
  return responseSessionId
}
