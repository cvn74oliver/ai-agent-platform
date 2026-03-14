const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const CHAT_MODEL = 'gpt-4o-mini'

export type PlaygroundChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type OpenAIChatRaw = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
  }
}

export type PlaygroundChatCompletionResult =
  | {
      ok: true
      raw: OpenAIChatRaw | null
      reply: string
    }
  | {
      ok: false
      status: number
      msg: string
      raw: OpenAIChatRaw | null
    }

export async function runPlaygroundChatCompletion(params: {
  openAiMessages: PlaygroundChatMessage[]
}): Promise<PlaygroundChatCompletionResult> {
  const resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.4,
      messages: params.openAiMessages,
    }),
  })

  const raw = (await resp.json().catch(() => null)) as OpenAIChatRaw | null

  if (!resp.ok) {
    const msg = raw?.error?.message || resp.statusText || 'OpenAI request failed'
    return {
      ok: false,
      status: resp.status,
      msg,
      raw,
    }
  }

  const reply: string = raw?.choices?.[0]?.message?.content || ''
  return {
    ok: true,
    raw,
    reply,
  }
}

