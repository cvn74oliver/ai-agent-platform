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
import {
  loadPlaygroundRuntimeState,
  type PlaygroundRuntimeRefreshFailureDiagnostics,
} from '@/lib/runtime/runtimeStateService'
import {
  finishHeavyAction,
  logHeavyActionEvent,
  tryStartHeavyAction,
} from '@/lib/runtime/heavyActionSafety'
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

const MANUAL_RUNTIME_REFRESH_COOLDOWN_MS = 30 * 1000

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
  let requestRehydrateOnly = false
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
      preferred_cluster_id?: string
      transition_edge?: 'smart_sync_handoff' | 'build_pending_poll'
    }
    const normalizedRequest = normalizePlaygroundRequestBody(body)
    const forceMailboxProfileRefresh = body.refresh_mailbox_profile === true
    const mailboxProfileWindowDays = body.mailbox_profile_window_days === 60 ? 60 : 30
    const preferredClusterId =
      typeof body.preferred_cluster_id === 'string' && body.preferred_cluster_id.trim()
        ? body.preferred_cluster_id.trim()
        : null
    const transitionEdge =
      body.transition_edge === 'smart_sync_handoff' || body.transition_edge === 'build_pending_poll'
        ? body.transition_edge
        : null
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
    requestRehydrateOnly = rehydrateOnly
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

    const bypassManualRuntimeRefreshGuard =
      rehydrateOnly && forceMailboxProfileRefresh && analysisScope === 'all_indexed'
    const manualRuntimeRefreshKey =
      forceMailboxProfileRefresh && !bypassManualRuntimeRefreshGuard
        ? ['manual_runtime_refresh', agent.id, analysisScope].join('::')
        : null
    let manualRuntimeRefreshStartedAt: number | null = null
    if (manualRuntimeRefreshKey) {
      const guard = tryStartHeavyAction({
        key: manualRuntimeRefreshKey,
        cooldownMs: MANUAL_RUNTIME_REFRESH_COOLDOWN_MS,
      })
      if (!guard.ok) {
        logHeavyActionEvent({
          category: 'runtime_refresh',
          route: '/api/agents/playground',
          action: 'manual_runtime_refresh',
          triggerSource: sessionOrigin || null,
          requestMode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
          tenantId: null,
          agentId: agent.id,
          blockedBy: guard.reason,
          durationMs: 0,
          outcome: 'blocked',
          extra: {
            selected_analysis_scope: analysisScope,
            retry_after_ms: guard.retryAfterMs,
          },
        })
        const errorResponse = buildPlaygroundErrorResponse({
          status: 409,
          error:
            guard.reason === 'already_running'
              ? 'Cleanup analysis refresh is already running for this workspace.'
              : 'Cleanup analysis refresh was started moments ago. Please wait briefly before trying again.',
          reason: guard.reason,
        })
        logTiming({
          rehydrateOnly,
          status: errorResponse.status,
          outcome: `manual_refresh_${guard.reason}`,
        })
        return NextResponse.json(errorResponse.body, { status: errorResponse.status })
      }
      manualRuntimeRefreshStartedAt = guard.startedAtMs
      console.info(
        `[playground][manual-regeneration] ${JSON.stringify({
          event: 'started',
          route: '/api/agents/playground',
          request_mode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
          selected_analysis_scope: analysisScope,
          agent_id: agent.id,
          trigger_source: sessionOrigin || null,
        })}`
      )
    } else if (bypassManualRuntimeRefreshGuard) {
      console.info(
        `[playground][manual-regeneration] ${JSON.stringify({
          event: 'guard_bypassed_for_build_pending_rehydrate',
          route: '/api/agents/playground',
          request_mode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
          selected_analysis_scope: analysisScope,
          agent_id: agent.id,
          trigger_source: sessionOrigin || null,
        })}`
      )
    }

    const runtimeStateStartedAt = Date.now()
    let runtimeInputs
    let runtimeState
    let runtimeApprovalQueueSummary
    let runtimeApprovalQueueItems
    let manualCleanupRegenerationDiagnostics = null
    try {
      ;({
        runtimeInputs,
        runtimeState,
        runtimeApprovalQueueSummary,
        runtimeApprovalQueueItems,
        manualCleanupRegenerationDiagnostics,
      } = await loadPlaygroundRuntimeState({
        supabase,
        agentId: agent.id,
        isInboxCleanupIntent: deriveInboxCleanupIntent(lastUserMessageText),
        agentUserId: typeof agent.user_id === 'string' ? agent.user_id : null,
        sessionScopeId: responseSessionId || incomingSessionId || null,
        forceMailboxProfileRefresh,
        analysisScope,
        preferredClusterId,
        transitionEdge,
        requestMode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
      }))
    } finally {
      if (manualRuntimeRefreshKey && manualRuntimeRefreshStartedAt != null) {
        finishHeavyAction({
          key: manualRuntimeRefreshKey,
          cooldownMs: MANUAL_RUNTIME_REFRESH_COOLDOWN_MS,
        })
      }
    }
    timing.runtime_state_ms = Date.now() - runtimeStateStartedAt

    if (manualRuntimeRefreshStartedAt != null) {
      const requestTotalMs = Date.now() - requestStartedAt
      logHeavyActionEvent({
        category: 'runtime_refresh',
        route: '/api/agents/playground',
        action: 'manual_runtime_refresh',
        triggerSource: sessionOrigin || null,
        requestMode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
        tenantId: null,
        agentId: agent.id,
        blockedBy: null,
        durationMs: Date.now() - manualRuntimeRefreshStartedAt,
        outcome: 'completed',
        extra: {
          selected_analysis_scope: analysisScope,
          cleanup_profile_status: runtimeState.runtimeMailboxProfile?.freshness?.status || null,
          cleanup_cluster_count: runtimeState.runtimeCleanupPlan?.clusters.length || 0,
          runtime_snapshot_generated_at: runtimeState.runtimeCleanupPlan?.generated_at || null,
        },
      })
      console.info(
        `[playground][manual-regeneration] ${JSON.stringify({
          event: 'completed',
          route: '/api/agents/playground',
          request_mode: rehydrateOnly ? 'rehydrate_only' : 'full_chat',
          selected_analysis_scope: analysisScope,
          agent_id: agent.id,
          request_total_ms: requestTotalMs,
          runtime_state_ms: timing.runtime_state_ms,
          cleanup_plan_ms: manualCleanupRegenerationDiagnostics?.cleanupPlanMs ?? null,
          discovery_total_ms: manualCleanupRegenerationDiagnostics?.discoveryTotalMs ?? null,
          wrapper_snapshot_preload_skipped:
            manualCleanupRegenerationDiagnostics?.wrapperSnapshotPreloadSkipped ?? null,
          wrapper_index_metadata_preload_skipped:
            manualCleanupRegenerationDiagnostics?.wrapperIndexMetadataPreloadSkipped ?? null,
          discovery_row_cache_hit:
            manualCleanupRegenerationDiagnostics?.discoveryRowCacheHit ?? null,
          indexed_rows_load_ms: manualCleanupRegenerationDiagnostics?.indexedRowsLoadMs ?? null,
          index_sync_disabled_by_request:
            manualCleanupRegenerationDiagnostics?.indexSyncDisabledByRequest ?? null,
          snapshot_save_mode: manualCleanupRegenerationDiagnostics?.snapshotSaveMode ?? null,
          final_runtime_assemble_ms:
            manualCleanupRegenerationDiagnostics?.finalRuntimeAssembleMs ?? null,
          cleanup_cluster_count: runtimeState.runtimeCleanupPlan?.clusters.length || 0,
          cleanup_profile_status: runtimeState.runtimeMailboxProfile?.freshness?.status || null,
        })}`
      )
    }

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
      runtimeMailboxIntelligence,
      runtimeSenderOverview,
      runtimeSelectedClusterRailFamily,
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
      runtimeMailboxIntelligence,
      runtimeSenderOverview,
      runtimeSelectedClusterRailFamily,
      runtimeCleanupStrategy,
      runtimeActiveWorkItem,
      runtimeEvidenceBlocks,
      runtimeSuggestionSets,
      runtimeApprovalQueueSummary,
      runtimeApprovalQueueItems,
    })

    const rehydrateDiagnostics =
      rehydrateOnly
        ? {
            request_force_mailbox_profile_refresh: forceMailboxProfileRefresh,
            request_analysis_scope: analysisScope,
            runtime_cleanup_plan_generated_at: runtimeCleanupPlan?.generated_at || null,
            runtime_cleanup_plan_cluster_count: runtimeCleanupPlan?.clusters.length || 0,
            runtime_mailbox_profile_generated_at: runtimeMailboxProfile?.generated_at || null,
            runtime_mailbox_profile_freshness_last_generated_at:
              runtimeMailboxProfile?.freshness?.last_generated_at || null,
            derived_cache_version:
              runtimeCleanupPlan?.generated_at ||
              runtimeMailboxProfile?.freshness?.last_generated_at ||
              runtimeMailboxProfile?.generated_at ||
              null,
            manual_cleanup_regeneration_diagnostics: manualCleanupRegenerationDiagnostics,
          }
        : null

    if (rehydrateDiagnostics) {
      ;(
        responseData as typeof responseData & {
          runtime_rehydrate_diagnostics?: typeof rehydrateDiagnostics
        }
      ).runtime_rehydrate_diagnostics = rehydrateDiagnostics
    }

    if (rehydrateOnly) {
      logTiming({
        rehydrateOnly: true,
        status: 200,
        outcome:
          manualCleanupRegenerationDiagnostics?.continuityState ===
          'build_pending_showing_stable_snapshot'
            ? 'rehydrate_build_pending_ok'
            : 'rehydrate_ok',
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
    const runtimeRefreshDiagnostics =
      isPlaygroundRuntimeRefreshFailureDiagnostics(err) && err.playgroundRuntimeRefreshDiagnostics
        ? err.playgroundRuntimeRefreshDiagnostics
        : null
    console.error('[playground] unexpected error:', {
      error_message: err instanceof Error ? err.message : String(err),
      error_stack: err instanceof Error ? err.stack ?? null : null,
      runtime_refresh_diagnostics: runtimeRefreshDiagnostics,
    })
    const errorResponse = buildPlaygroundErrorResponse({
      status: 500,
      error: 'Unexpected error in playground route.',
    })
    logTiming({
      rehydrateOnly: requestRehydrateOnly,
      status: errorResponse.status,
      outcome: 'unexpected_error',
    })
    return NextResponse.json(
      runtimeRefreshDiagnostics
        ? ({
            ...errorResponse.body,
            diagnostics: {
              failing_phase: runtimeRefreshDiagnostics.failingPhase,
              runtime_refresh: runtimeRefreshDiagnostics,
            },
          } as typeof errorResponse.body & {
            diagnostics: {
              failing_phase: PlaygroundRuntimeRefreshFailureDiagnostics['failingPhase']
              runtime_refresh: PlaygroundRuntimeRefreshFailureDiagnostics
            }
          })
        : errorResponse.body,
      { status: errorResponse.status }
    )
  }
}

function isPlaygroundRuntimeRefreshFailureDiagnostics(
  value: unknown
): value is {
  playgroundRuntimeRefreshDiagnostics?: PlaygroundRuntimeRefreshFailureDiagnostics
} {
  return typeof value === 'object' && value !== null && 'playgroundRuntimeRefreshDiagnostics' in value
}
