import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase'
import {
  runPlaygroundChatCompletion,
  type PlaygroundChatMessage as ChatMessage,
} from '@/lib/runtime/playgroundChatService'
import { logPlaygroundCallAnalytics } from '@/lib/runtime/playgroundAnalyticsService'
import {
  applyPlaygroundChatResultToResponseData,
  buildPlaygroundErrorResponse,
  buildPlaygroundOpenAiFailureResponse,
  type PlaygroundRuntimeResponseData,
  buildPlaygroundSuccessResponse,
  buildPlaygroundRuntimeResponseData,
  deriveAnalyzeInboxRuntimeProposal,
  deriveInboxCleanupIntent,
} from '@/lib/runtime/playgroundResponseBuilder'
import {
  normalizePlaygroundRequestBody,
  resolvePlaygroundSessionId,
} from '@/lib/runtime/playgroundRequestSessionService'
import { loadPlaygroundAgentConfig } from '@/lib/runtime/playgroundAgentConfigService'
import {
  buildPlaygroundReviewDetailSystemPrompt,
  buildPlaygroundSystemPrompt,
} from '@/lib/runtime/playgroundPromptBuilder'
import { loadPlaygroundRagContext } from '@/lib/runtime/playgroundRagService'
import { loadPlaygroundRuntimeState } from '@/lib/runtime/runtimeStateService'
import {
  normalizeOperationsAnalysisScope,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'
import {
  loadLatestQueryClusterReviewEvidence,
  loadLatestSenderClusterReviewEvidence,
  loadPlaygroundSessionMessages,
  loadRecentReviewResults,
  loadRuntimeSuggestionHistory,
} from '@/lib/runtime/stateLoaders'

async function resolvePlaygroundSupabaseClient() {
  const hasAdminConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  )

  if (hasAdminConfig) {
    return getSupabaseAdmin()
  }

  console.warn(
    '[playground] SUPABASE_SERVICE_ROLE_KEY missing; falling back to request-scoped Supabase client.'
  )
  return createServerSupabaseClient()
}

export async function POST(req: Request) {
  const requestStartedAt = Date.now()
  const timing = {
    request_normalize_ms: 0,
    session_resolution_ms: 0,
    agent_config_ms: 0,
    runtime_state_ms: 0,
    rag_ms: 0,
    prompt_build_ms: 0,
    chat_completion_ms: 0,
    analytics_ms: 0,
  }

  const logTiming = (params: { rehydrateOnly: boolean; status: number; outcome: string }) => {
    const totalMs = Date.now() - requestStartedAt
    console.info(
      `[playground][timing] ${JSON.stringify({
        rehydrate_only: params.rehydrateOnly,
        outcome: params.outcome,
        status: params.status,
        phases_ms: timing,
        total_ms: totalMs,
      })}`
    )
  }

  try {
    const normalizeStartedAt = Date.now()
    const body = (await req.json()) as {
      agent_id?: string
      messages?: ChatMessage[]
      session_id?: string
      session_origin?: 'playground' | 'playground_review_detail'
      request_mode?: 'playground' | 'playground_review_detail'
      rehydrate_only?: boolean
      refresh_mailbox_profile?: boolean
      mailbox_profile_window_days?: 30 | 60
      analysis_scope?: OperationsAnalysisScope
    }
    const normalizedRequest = normalizePlaygroundRequestBody(body)
    const forceMailboxProfileRefresh = body.refresh_mailbox_profile === true
    const mailboxProfileWindowDays = body.mailbox_profile_window_days === 60 ? 60 : 30
    const analysisScope = normalizeOperationsAnalysisScope(
      typeof body.analysis_scope === 'string' && body.analysis_scope.trim()
        ? body.analysis_scope
        : mailboxProfileWindowDays === 60
          ? '60d'
          : '30d'
    )

    if (!normalizedRequest.isValid || !normalizedRequest.agentId) {
      const errorResponse = buildPlaygroundErrorResponse({
        status: 400,
        error: 'agent_id and messages[] are required',
      })
      timing.request_normalize_ms = Date.now() - normalizeStartedAt
      logTiming({
        rehydrateOnly: normalizedRequest.rehydrateOnly,
        status: errorResponse.status,
        outcome: 'invalid_request',
      })
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }
    const {
      agentId: agent_id,
      rehydrateOnly,
      safeMessages,
      incomingSessionId,
      sessionOrigin,
      requestMode,
      lastUserMessage,
      lastUserMessageText,
    } = normalizedRequest
    const isReviewDetailMode = requestMode === 'playground_review_detail'
    timing.request_normalize_ms = Date.now() - normalizeStartedAt

    const supabase = await resolvePlaygroundSupabaseClient()

    const agentConfigStartedAt = Date.now()
    const loadedAgent = await loadPlaygroundAgentConfig({
      supabase,
      agentId: agent_id,
    })
    timing.agent_config_ms = Date.now() - agentConfigStartedAt

    if (!loadedAgent.ok) {
      console.error('[playground] Failed to load agent:', loadedAgent.error)
      const errorResponse = buildPlaygroundErrorResponse({
        status: 404,
        error: 'Agent not found or access denied.',
      })
      logTiming({
        rehydrateOnly,
        status: errorResponse.status,
        outcome: 'agent_not_found',
      })
      return NextResponse.json(errorResponse.body, { status: errorResponse.status })
    }
    const { agent, summary, ragSources, crawlDomains } = loadedAgent.data

    const sessionResolutionStartedAt = Date.now()
    let responseSessionId = await resolvePlaygroundSessionId({
      supabase,
      agentId: agent.id,
      incomingSessionId,
      sessionOrigin,
      allowFallbackToLatest: Boolean(incomingSessionId),
    })
    const sessionMessages =
      !isReviewDetailMode && responseSessionId && responseSessionId.trim()
        ? await loadPlaygroundSessionMessages({
            supabase,
            agentId: agent.id,
            sessionId: responseSessionId,
          })
        : null
    timing.session_resolution_ms = Date.now() - sessionResolutionStartedAt

    if (isReviewDetailMode) {
      if (rehydrateOnly) {
        const runtimeStateStartedAt = Date.now()
        const [
          reviewResults,
          latestRuntimeReviewEvidence,
          latestRuntimeQueryReviewEvidence,
          runtimeSuggestionHistory,
        ] =
          await Promise.all([
            loadRecentReviewResults({
              supabase,
              agentId: agent.id,
            }),
            loadLatestSenderClusterReviewEvidence({
              supabase,
              agentId: agent.id,
            }),
            loadLatestQueryClusterReviewEvidence({
              supabase,
              agentId: agent.id,
            }),
            responseSessionId
              ? loadRuntimeSuggestionHistory({
                  supabase,
                  agentId: agent.id,
                })
              : Promise.resolve(null),
          ])
        timing.runtime_state_ms = Date.now() - runtimeStateStartedAt

        let scopedReviewResults = reviewResults
        let scopedSenderReviewEvidence = latestRuntimeReviewEvidence
        let scopedQueryReviewEvidence = latestRuntimeQueryReviewEvidence

        if (responseSessionId && runtimeSuggestionHistory) {
          const scopedApprovalIds = new Set(
            runtimeSuggestionHistory.requests
              .filter((request) => request.session_id && request.session_id === responseSessionId)
              .map((request) => request.approval_id)
          )

          scopedReviewResults = reviewResults.filter((result) =>
            scopedApprovalIds.has(result.approval_id)
          )
          if (
            scopedSenderReviewEvidence &&
            !scopedApprovalIds.has(scopedSenderReviewEvidence.approval_id)
          ) {
            scopedSenderReviewEvidence = null
          }
          if (
            scopedQueryReviewEvidence &&
            !scopedApprovalIds.has(scopedQueryReviewEvidence.approval_id)
          ) {
            scopedQueryReviewEvidence = null
          }
        }

        const responseData: PlaygroundRuntimeResponseData = {}
        if (responseSessionId) responseData.session_id = responseSessionId
        if (scopedReviewResults.length > 0) responseData.runtime_review_results = scopedReviewResults
        if (scopedSenderReviewEvidence) {
          responseData.runtime_review_evidence = scopedSenderReviewEvidence
        }
        if (scopedQueryReviewEvidence) {
          responseData.runtime_query_review_evidence = scopedQueryReviewEvidence
        }

        logTiming({
          rehydrateOnly: true,
          status: 200,
          outcome: 'review_detail_rehydrate_ok',
        })
        return NextResponse.json(
          buildPlaygroundSuccessResponse({
            responseData,
          })
        )
      }

      const promptBuildStartedAt = Date.now()
      const systemPrompt = buildPlaygroundReviewDetailSystemPrompt({
        summary,
        agentPrimaryPrompt: typeof agent.primary_prompt === 'string' ? agent.primary_prompt : null,
      })
      timing.prompt_build_ms = Date.now() - promptBuildStartedAt

      const trimmedHistory: ChatMessage[] = safeMessages.slice(-12)
      const openAiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...trimmedHistory.filter((m) => m.role === 'user' || m.role === 'assistant'),
      ]

      const chatCompletionStartedAt = Date.now()
      const chatResult = await runPlaygroundChatCompletion({
        openAiMessages,
      })
      timing.chat_completion_ms = Date.now() - chatCompletionStartedAt

      if (!chatResult.ok) {
        console.error('[playground] OpenAI chat failed:', {
          status: chatResult.status,
          msg: chatResult.msg,
          raw: chatResult.raw,
        })
        const failureResponse = buildPlaygroundOpenAiFailureResponse({
          status: chatResult.status,
          msg: chatResult.msg,
        })
        logTiming({
          rehydrateOnly: false,
          status: failureResponse.status,
          outcome: 'review_detail_chat_failed',
        })
        return NextResponse.json(failureResponse.body, { status: failureResponse.status })
      }

      const raw = chatResult.raw
      const reply = chatResult.reply

      const analyticsStartedAt = Date.now()
      const conversationMessages = [
        ...safeMessages
          .slice(-12)
          .filter((message): message is { role: 'user' | 'assistant'; content: string } =>
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string'
          ),
        { role: 'assistant' as const, content: reply },
      ]
      const analytics = await logPlaygroundCallAnalytics({
        supabase,
        currentSessionId: responseSessionId,
        sessionOrigin,
        agentId: agent.id,
        agentUserId: typeof agent.user_id === 'string' ? agent.user_id : null,
        usage: raw?.usage || null,
        lastUserMessage: lastUserMessage?.content ?? null,
        ragChunkCount: 0,
        conversationMessages,
      })
      timing.analytics_ms = Date.now() - analyticsStartedAt
      responseSessionId = analytics.sessionId

      const finalizedResponseData = applyPlaygroundChatResultToResponseData({
        responseData: {},
        responseSessionId,
        reply,
      })
      logTiming({
        rehydrateOnly: false,
        status: 200,
        outcome: 'review_detail_chat_ok',
      })
      return NextResponse.json(
        buildPlaygroundSuccessResponse({ responseData: finalizedResponseData })
      )
    }

    const runtimeStateStartedAt = Date.now()
    const { runtimeInputs, runtimeState, runtimeApprovalQueueSummary, runtimeApprovalQueueItems } =
      await loadPlaygroundRuntimeState({
      supabase,
      agentId: agent.id,
      isInboxCleanupIntent: deriveInboxCleanupIntent(lastUserMessageText),
      agentUserId: typeof agent.user_id === 'string' ? agent.user_id : null,
      sessionScopeId: responseSessionId || incomingSessionId || null,
      forceMailboxProfileRefresh,
      analysisScope,
      requestMode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
    })
    timing.runtime_state_ms = Date.now() - runtimeStateStartedAt

    const { runtimeEvidence, latestRuntimeQueryReviewEvidence, reviewResults } = runtimeInputs

    const {
      runtimeRecommendation,
      runtimeReviewProposal,
      runtimeActiveBatch,
      runtimeReviewEvidence,
      runtimeArchiveEvidence,
      runtimeBatchSuggestions,
      runtimeCleanupPlan,
      runtimeMailboxProfile,
      runtimeCleanupStrategy,
      runtimeSuggestionSets,
      runtimeSuggestionPromptContext,
      runtimeEvidenceBlocks,
      runtimeActiveWorkItem,
    } = runtimeState

    const runtimeProposal = deriveAnalyzeInboxRuntimeProposal({
      lastUserMessageText,
      runtimeEvidence,
    })

    const responseData = buildPlaygroundRuntimeResponseData({
      responseSessionId,
      sessionMessages,
      runtimeProposal,
      runtimeEvidence,
      runtimeRecommendation,
      runtimeReviewProposal,
      runtimeReviewEvidence,
      runtimeQueryReviewEvidence: latestRuntimeQueryReviewEvidence,
      runtimeReviewResults: reviewResults,
      runtimeArchiveEvidence,
      runtimeActiveBatch,
      runtimeBatchSuggestions,
      runtimeCleanupPlan,
      runtimeMailboxProfile,
      runtimeCleanupStrategy,
      runtimeActiveWorkItem,
      runtimeEvidenceBlocks,
      runtimeSuggestionSets,
      runtimeApprovalQueueSummary,
      runtimeApprovalQueueItems,
    })

    if (rehydrateOnly) {
      logTiming({
        rehydrateOnly: true,
        status: 200,
        outcome: 'rehydrate_ok',
      })
      return NextResponse.json(buildPlaygroundSuccessResponse({ responseData }))
    }

    // ─────────────────────────────────────────────
    // 2) RAG retrieval based on last user message
    // ─────────────────────────────────────────────
    let ragContextBlocks: string[] = []

    if (lastUserMessageText) {
      const ragStartedAt = Date.now()
      try {
        ragContextBlocks = await loadPlaygroundRagContext({
          supabase,
          agentId: agent.id,
          queryText: lastUserMessageText,
          maxJobs: 10,
          maxDocs: 800,
          topK: 5,
          minSim: 0.25,
        })
      } catch (err) {
        console.error('[playground] RAG retrieval failed, falling back to prompt-only:', err)
      } finally {
        timing.rag_ms = Date.now() - ragStartedAt
      }
    }

    const promptBuildStartedAt = Date.now()
    const systemPrompt = buildPlaygroundSystemPrompt({
      summary,
      agentPrimaryPrompt: typeof agent.primary_prompt === 'string' ? agent.primary_prompt : null,
      runtimeProposal,
      runtimeEvidence,
      runtimeRecommendation,
      runtimeReviewProposal,
      runtimeReviewEvidence,
      runtimeQueryReviewEvidence: latestRuntimeQueryReviewEvidence,
      runtimeArchiveEvidence,
      runtimeActiveBatch,
      runtimeBatchSuggestions,
      runtimeCleanupPlan,
      runtimeMailboxProfile,
      runtimeCleanupStrategy,
      runtimeActiveWorkItem,
      runtimeSuggestionSets,
      runtimeSuggestionPromptContext,
      ragSources,
      crawlDomains,
      ragContextBlocks,
    })
    timing.prompt_build_ms = Date.now() - promptBuildStartedAt

    // ─────────────────────────────────────────────
    // 3) Build messages for OpenAI Chat
    // ─────────────────────────────────────────────
    const trimmedHistory: ChatMessage[] = safeMessages.slice(-12) // keep last 12 turns max
    const openAiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.filter((m) => m.role === 'user' || m.role === 'assistant'),
    ]

    const chatCompletionStartedAt = Date.now()
    const chatResult = await runPlaygroundChatCompletion({
      openAiMessages,
    })
    timing.chat_completion_ms = Date.now() - chatCompletionStartedAt

    if (!chatResult.ok) {
      console.error('[playground] OpenAI chat failed:', {
        status: chatResult.status,
        msg: chatResult.msg,
        raw: chatResult.raw,
      })
      const failureResponse = buildPlaygroundOpenAiFailureResponse({
        status: chatResult.status,
        msg: chatResult.msg,
      })
      logTiming({
        rehydrateOnly: false,
        status: failureResponse.status,
        outcome: 'chat_failed',
      })
      return NextResponse.json(failureResponse.body, { status: failureResponse.status })
    }

    const raw = chatResult.raw
    const reply = chatResult.reply

    // ─────────────────────────────────────────────
    // 4) Log basic analytics for this Playground call
    // ─────────────────────────────────────────────
    const analyticsStartedAt = Date.now()
    const conversationMessages = [
      ...safeMessages
        .slice(-12)
        .filter((message): message is { role: 'user' | 'assistant'; content: string } =>
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string'
        ),
      { role: 'assistant' as const, content: reply },
    ]
    const analytics = await logPlaygroundCallAnalytics({
      supabase,
      currentSessionId: responseSessionId,
      sessionOrigin,
      agentId: agent.id,
      agentUserId: typeof agent.user_id === 'string' ? agent.user_id : null,
      usage: raw?.usage || null,
      lastUserMessage: lastUserMessage?.content ?? null,
      ragChunkCount: ragContextBlocks.length,
      conversationMessages,
    })
    timing.analytics_ms = Date.now() - analyticsStartedAt
    responseSessionId = analytics.sessionId
    const finalizedResponseData = applyPlaygroundChatResultToResponseData({
      responseData,
      responseSessionId,
      reply,
    })
    logTiming({
      rehydrateOnly: false,
      status: 200,
      outcome: 'chat_ok',
    })
    return NextResponse.json(buildPlaygroundSuccessResponse({ responseData: finalizedResponseData }))

  } catch (err) {
    console.error('[playground] unexpected error:', err)
    const errorResponse = buildPlaygroundErrorResponse({
      status: 500,
      error: 'Unexpected error in playground route.',
    })
    logTiming({
      rehydrateOnly: false,
      status: errorResponse.status,
      outcome: 'unexpected_error',
    })
    return NextResponse.json(errorResponse.body, { status: errorResponse.status })
  }
}
