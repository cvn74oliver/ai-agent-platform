import type { getSupabaseAdmin } from '@/lib/supabase'
import { discoverGmailCleanupClustersForTenant } from '@/lib/integrations/gmail/inboxAnalysis'
import {
  assembleGmailRuntimeState,
  shouldRunGmailCleanupDiscovery,
  type AssembledGmailRuntimeState,
} from '@/lib/runtime/gmailRuntimeAssembler'
import {
  loadPlaygroundRuntimeStateInputsWithTiming,
  type PlaygroundRuntimeStateInputs,
} from '@/lib/runtime/stateLoaders'

type SupabaseAdminClient = Awaited<ReturnType<typeof getSupabaseAdmin>>

export type PlaygroundRuntimeStateServiceResult = {
  runtimeInputs: PlaygroundRuntimeStateInputs
  runtimeState: AssembledGmailRuntimeState
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function loadTenantIdForUser(params: {
  supabase: SupabaseAdminClient
  userId: string | null
}): Promise<string | null> {
  if (!params.userId) return null

  const { data, error } = await params.supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', params.userId)
    .maybeSingle()

  if (error) {
    console.warn('[playground] tenant_id lookup failed (non-fatal):', error)
    return null
  }

  const tenantId =
    isRecord(data) && typeof data.tenant_id === 'string' ? data.tenant_id.trim() : ''
  return tenantId || null
}

export async function loadPlaygroundRuntimeState(params: {
  supabase: SupabaseAdminClient
  agentId: string
  agentUserId: string | null
  isInboxCleanupIntent: boolean
  requestMode?: 'rehydrate_only' | 'full_chat'
}): Promise<PlaygroundRuntimeStateServiceResult> {
  const runtimeStateStartedAt = Date.now()
  const phaseMs = {
    inbox_cleanup_intent_gate_ms: 0,
    analyze_inbox_evidence_ms: 0,
    sender_cluster_review_ms: 0,
    query_cluster_review_ms: 0,
    archive_evidence_ms: 0,
    suggestion_history_ms: 0,
    cleanup_plan_ms: 0,
    batch_suggestions_ms: 0,
    other_runtime_state_ms: 0,
    runtime_state_total_ms: 0,
  }

  const runtimeInputsStartedAt = Date.now()
  const loadedRuntimeInputs = await loadPlaygroundRuntimeStateInputsWithTiming({
    supabase: params.supabase,
    agentId: params.agentId,
  })
  const runtimeInputs = loadedRuntimeInputs.runtimeInputs
  phaseMs.analyze_inbox_evidence_ms = loadedRuntimeInputs.timingMs.analyze_inbox_evidence_ms
  phaseMs.sender_cluster_review_ms = loadedRuntimeInputs.timingMs.sender_cluster_review_ms
  phaseMs.query_cluster_review_ms = loadedRuntimeInputs.timingMs.query_cluster_review_ms
  phaseMs.archive_evidence_ms = loadedRuntimeInputs.timingMs.archive_evidence_ms
  phaseMs.suggestion_history_ms = loadedRuntimeInputs.timingMs.suggestion_history_ms
  const runtimeInputsTotalMs = Date.now() - runtimeInputsStartedAt

  const assembleInitialStartedAt = Date.now()
  let runtimeState = assembleGmailRuntimeState({
    runtimeEvidence: runtimeInputs.runtimeEvidence,
    latestRuntimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
    latestRuntimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
    latestRuntimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    cleanupDiscoveryData: null,
  })
  phaseMs.batch_suggestions_ms += Date.now() - assembleInitialStartedAt

  const intentGateStartedAt = Date.now()
  const shouldRunCleanupDiscovery = shouldRunGmailCleanupDiscovery({
    runtimeEvidence: runtimeInputs.runtimeEvidence,
    runtimeReviewEvidence: runtimeState.runtimeReviewEvidence,
    runtimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
    runtimeArchiveEvidence: runtimeState.runtimeArchiveEvidence,
    runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
    isInboxCleanupIntent: params.isInboxCleanupIntent,
  })
  phaseMs.inbox_cleanup_intent_gate_ms = Date.now() - intentGateStartedAt

  if (shouldRunCleanupDiscovery) {
    const cleanupPlanStartedAt = Date.now()
    const tenantId = await loadTenantIdForUser({
      supabase: params.supabase,
      userId: params.agentUserId,
    })

    if (tenantId) {
      const topSenders =
        runtimeInputs.runtimeEvidence?.inbox_analysis.top_senders.map((entry) => entry.sender) || []
      const cleanupDiscovery = await discoverGmailCleanupClustersForTenant({
        supabase: params.supabase,
        tenantId,
        topSenders,
        logPrefix: '[playground/cleanup-discovery]',
      })

      if (cleanupDiscovery.ok) {
        const assembleWithCleanupStartedAt = Date.now()
        runtimeState = assembleGmailRuntimeState({
          runtimeEvidence: runtimeInputs.runtimeEvidence,
          latestRuntimeReviewEvidence: runtimeInputs.latestRuntimeReviewEvidence,
          latestRuntimeQueryReviewEvidence: runtimeInputs.latestRuntimeQueryReviewEvidence,
          latestRuntimeArchiveEvidence: runtimeInputs.latestRuntimeArchiveEvidence,
          runtimeSuggestionHistory: runtimeInputs.runtimeSuggestionHistory,
          cleanupDiscoveryData: cleanupDiscovery.data,
        })
        phaseMs.batch_suggestions_ms += Date.now() - assembleWithCleanupStartedAt
      } else {
        console.warn('[playground] cleanup discovery failed (non-fatal):', cleanupDiscovery.error)
      }
    }
    phaseMs.cleanup_plan_ms = Date.now() - cleanupPlanStartedAt
  }

  phaseMs.runtime_state_total_ms = Date.now() - runtimeStateStartedAt
  const knownMs =
    phaseMs.inbox_cleanup_intent_gate_ms +
    phaseMs.analyze_inbox_evidence_ms +
    phaseMs.sender_cluster_review_ms +
    phaseMs.query_cluster_review_ms +
    phaseMs.archive_evidence_ms +
    phaseMs.suggestion_history_ms +
    phaseMs.cleanup_plan_ms +
    phaseMs.batch_suggestions_ms
  phaseMs.other_runtime_state_ms = Math.max(0, phaseMs.runtime_state_total_ms - knownMs)

  console.info(
    `[playground][runtime-state-timing] ${JSON.stringify({
      request_mode: params.requestMode ?? 'unknown',
      runtime_inputs_total_ms: runtimeInputsTotalMs,
      phases_ms: phaseMs,
    })}`
  )

  return {
    runtimeInputs,
    runtimeState,
  }
}
