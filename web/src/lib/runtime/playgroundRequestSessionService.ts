import type { getSupabaseAdmin } from '@/lib/supabase'
import { loadLatestPlaygroundSessionId } from '@/lib/runtime/stateLoaders'
import type { PlaygroundChatMessage } from '@/lib/runtime/playgroundChatService'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

type PlaygroundRequestBody = {
  agent_id?: string
  messages?: PlaygroundChatMessage[]
  session_id?: string
  rehydrate_only?: boolean
  session_origin?: 'playground' | 'playground_review_detail'
  request_mode?: 'playground' | 'playground_review_detail'
}

export type NormalizedPlaygroundRequest = {
  agentId: string | undefined
  rehydrateOnly: boolean
  sessionOrigin: 'playground' | 'playground_review_detail'
  requestMode: 'playground' | 'playground_review_detail'
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
  const sessionOrigin =
    body.session_origin === 'playground_review_detail' ? 'playground_review_detail' : 'playground'
  const requestMode =
    body.request_mode === 'playground_review_detail' ? 'playground_review_detail' : 'playground'
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
    sessionOrigin,
    requestMode,
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
  sessionOrigin?: 'playground' | 'playground_review_detail'
  allowFallbackToLatest?: boolean
}): Promise<string | null> {
  let responseSessionId: string | null = params.incomingSessionId
  const allowFallbackToLatest = params.allowFallbackToLatest !== false
  if (!responseSessionId && allowFallbackToLatest) {
    responseSessionId = await loadLatestPlaygroundSessionId({
      supabase: params.supabase,
      agentId: params.agentId,
      origin: params.sessionOrigin,
    })
  }
  return responseSessionId
}
