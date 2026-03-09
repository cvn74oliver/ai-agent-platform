'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import VoiceRecorder from '@/components/VoiceRecorder'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type RuntimeProposalAction = {
  tool: 'gmail'
  action: 'analyze_inbox'
}

type RuntimeProposal = {
  user_request: string
  proposed_actions: RuntimeProposalAction[]
  approval_required: true
  reason: string
}

type RuntimeInboxAnalysisData = {
  total_messages_estimate: number
  sample_size: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  top_senders: Array<{ sender: string; count: number }>
  sample_subject_lines: string[]
}

type RuntimeEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'analyze_inbox'
  inbox_analysis: RuntimeInboxAnalysisData
}

type RuntimeRecommendation = {
  sender: string
  count: number
  reason: string
  batch_title: string
}

type RuntimeReviewProposalAction = {
  tool: 'gmail'
  action: 'review_sender_cluster'
  args: {
    sender: string
    count: number
    batch_title: string
  }
}

type RuntimeReviewProposal = {
  user_request: string
  proposed_actions: RuntimeReviewProposalAction[]
  approval_required: true
  reason: string
}

type RuntimeReviewEvidenceData = {
  sender: string
  fetched_count: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  sample_subject_lines: string[]
  snippet_previews: string[]
  messages: Array<{
    message_id: string
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
  }>
}

type RuntimeReviewEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'review_sender_cluster'
  sender_review: RuntimeReviewEvidenceData
}

type RuntimeQueryReviewEvidenceData = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  estimated_count: number | null
  fetched_count: number
  sampled_oldest_message_date: string | null
  sampled_newest_message_date: string | null
  sample_subject_lines: string[]
  snippet_previews: string[]
  reviewed_messages_preview: Array<{
    message_id: string
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
  }>
  risk_note: string
  safety_note: string
}

type RuntimeQueryReviewEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'review_query_cluster'
  query_review: RuntimeQueryReviewEvidenceData
}

type RuntimeArchiveEvidenceData = {
  sender: string | null
  batch_title: string | null
  requested_count: number
  archived_count: number
  message_ids: string[]
}

type RuntimeArchiveEvidence = {
  source_event_type: 'execution_result'
  executed_at: string
  approval_id: string
  tool: 'gmail'
  action: 'archive_messages'
  archive_result: RuntimeArchiveEvidenceData
}

type RuntimeActiveBatch = {
  sender: string
  fetched_count: number
  batch_title: string
  executed_at: string
}

type RuntimeBatchSuggestionCandidate = {
  message_id: string
  reason: string
}

type RuntimeBatchSuggestions = {
  archive_candidates: RuntimeBatchSuggestionCandidate[]
  unsubscribe_candidates: RuntimeBatchSuggestionCandidate[]
  reply_candidates: RuntimeBatchSuggestionCandidate[]
  important_candidates: RuntimeBatchSuggestionCandidate[]
}

type RuntimeSuggestedActionCandidate = {
  id: string
  label: string
  reason: string
  message_ids: string[]
  status: 'ready' | 'pending_approval' | 'approved' | 'executed'
  approval_id?: string
  proposed_action: {
    tool: string
    action: string
    args?: Record<string, unknown>
  }
}

type RuntimeSuggestionSet = {
  id: string
  title: string
  summary: string
  candidates: RuntimeSuggestedActionCandidate[]
}

type RuntimeEvidenceBlock = {
  id: string
  title: string
  summary: string
  source_event_type: 'execution_result'
  executed_at: string
  tool: string
  action: string
}

type RuntimeActiveWorkItem = {
  id: string
  title: string
  summary: string
  status: 'active'
  executed_at: string
  source_tool: string
  source_action: string
  reference_ids: string[]
}

type RuntimeCleanupPlanCluster = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  why_selected: string
  estimated_count: number
  sample_preview: Array<{
    message_id: string
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
  }>
  risk_note: string
  safety_note: string
  status: RuntimeSuggestedActionCandidate['status']
  approval_id?: string
  proposed_action: {
    tool: 'gmail'
    action: 'review_query_cluster'
    args: {
      cluster_id: string
      cluster_type: string
      title: string
      query: string
      estimated_count: number
      message_ids: string[]
      risk_note: string
      safety_note: string
    }
  }
}

type RuntimeCleanupPlan = {
  generated_at: string
  planning_mode: 'read_only'
  safety_defaults: string[]
  clusters: RuntimeCleanupPlanCluster[]
}

type RuntimePlanAction = {
  tool: string
  action: string
  args?: unknown
}

type RuntimeProposalKind = string

type RuntimeBatchSuggestionKind = keyof RuntimeBatchSuggestions
type RuntimeRehydrateTrigger =
  | 'mount'
  | 'focus'
  | 'visibility'
  | 'poll'
  | 'post-submit'
  | 'runtime_refresh'

type PlaygroundApiResponse = {
  ok?: boolean
  error?: string
  data?: {
    reply?: string
    session_id?: string
    runtime_proposal?: RuntimeProposal
    runtime_evidence?: RuntimeEvidence
    runtime_recommendation?: RuntimeRecommendation
    runtime_review_proposal?: RuntimeReviewProposal
    runtime_review_evidence?: RuntimeReviewEvidence
    runtime_query_review_evidence?: RuntimeQueryReviewEvidence
    runtime_archive_evidence?: RuntimeArchiveEvidence
    runtime_active_batch?: RuntimeActiveBatch
    runtime_batch_suggestions?: RuntimeBatchSuggestions
    runtime_cleanup_plan?: RuntimeCleanupPlan
    runtime_active_work_item?: RuntimeActiveWorkItem
    runtime_evidence_blocks?: RuntimeEvidenceBlock[]
    runtime_suggestion_sets?: RuntimeSuggestionSet[]
  }
}

type PersistedPlaygroundState = {
  version: 1
  updated_at: string
  messages: ChatMessage[]
  session_id: string | null
  runtime_proposal: RuntimeProposal | null
  runtime_evidence: RuntimeEvidence | null
  runtime_recommendation: RuntimeRecommendation | null
  runtime_review_proposal: RuntimeReviewProposal | null
  runtime_review_evidence: RuntimeReviewEvidence | null
  runtime_query_review_evidence: RuntimeQueryReviewEvidence | null
  runtime_archive_evidence: RuntimeArchiveEvidence | null
  runtime_active_batch: RuntimeActiveBatch | null
  runtime_batch_suggestions: RuntimeBatchSuggestions | null
  runtime_cleanup_plan: RuntimeCleanupPlan | null
  runtime_active_work_item: RuntimeActiveWorkItem | null
  runtime_evidence_blocks: RuntimeEvidenceBlock[]
  runtime_suggestion_sets: RuntimeSuggestionSet[]
  created_approval_id: string | null
  created_approval_kind: RuntimeProposalKind | null
}

type PlaygroundAgent = {
  id: string
  name?: string | null
  user_id?: string | null
  primary_prompt?: string | null
  quality_score?: number | null
  onboarding_summary?: {
    agent_type?: string | null
  } | null
}

const PLAYGROUND_STORAGE_PREFIX = 'playground.runtime.v2'
const PLAYGROUND_ACTIVE_SESSION_PREFIX = 'playground.runtime.active_session.v1'
const PLAYGROUND_SESSION_QUERY_PARAM = 'playground_session_id'
const PERSISTED_MESSAGE_LIMIT = 40
const REHYDRATE_INTERVAL_MS = 12000
const REHYDRATE_MIN_GAP_MS = 4000

function getLastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return null
}

function approvalKindLabel(kind: RuntimeProposalKind | null): string {
  return kind || 'runtime action'
}

function suggestionStatusLabel(status: RuntimeSuggestedActionCandidate['status']): string {
  if (status === 'pending_approval') return 'Pending approval'
  if (status === 'approved') return 'Approved'
  if (status === 'executed') return 'Executed'
  return 'Ready'
}

function batchSuggestionKindFromAction(action: string): RuntimeBatchSuggestionKind | null {
  if (action === 'archive_messages') return 'archive_candidates'
  if (action === 'unsubscribe_senders') return 'unsubscribe_candidates'
  if (action === 'draft_replies') return 'reply_candidates'
  if (action === 'mark_important') return 'important_candidates'
  return null
}

function draftStorageKeyForAgent(agentId: string): string {
  return `${PLAYGROUND_STORAGE_PREFIX}:${agentId}:draft`
}

function sessionStorageKeyForAgent(agentId: string, sessionId: string): string {
  return `${PLAYGROUND_STORAGE_PREFIX}:${agentId}:session:${sessionId}`
}

function activeSessionKeyForAgent(agentId: string): string {
  return `${PLAYGROUND_ACTIVE_SESSION_PREFIX}:${agentId}`
}

function readPersistedState(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const localValue = window.localStorage.getItem(key)
    if (localValue) return localValue
  } catch {
    // ignore
  }
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writePersistedState(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore and continue with session fallback
  }
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function removePersistedState(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function readSessionStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function removeSessionStorageValue(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function parsePersistedState(value: string | null): PersistedPlaygroundState | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as PersistedPlaygroundState
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

function prettyAgentTitle(agent: PlaygroundAgent | null): string {
  const agentType = String(agent?.onboarding_summary?.agent_type || '').trim()
  if (agentType) return agentType

  const raw = String(agent?.name || '').trim()
  if (!raw) return 'Unnamed Agent'

  // If it's already short, keep it.
  const words = raw.replace(/\s+/g, ' ').split(' ').filter(Boolean)
  if (words.length <= 6 && raw.length <= 60) return raw

  // If it's a sentence/paragraph, return a compact role-ish fallback.
  return words.slice(0, 6).join(' ')
}

export default function AgentSummaryPage() {
  const supabase = useMemo(() => createClient(), [])
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [agent, setAgent] = useState<PlaygroundAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recalcLoading, setRecalcLoading] = useState(false)
  const [improveLoading, setImproveLoading] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [runtimeProposal, setRuntimeProposal] = useState<RuntimeProposal | null>(null)
  const [runtimeEvidence, setRuntimeEvidence] = useState<RuntimeEvidence | null>(null)
  const [runtimeRecommendation, setRuntimeRecommendation] = useState<RuntimeRecommendation | null>(null)
  const [runtimeReviewProposal, setRuntimeReviewProposal] = useState<RuntimeReviewProposal | null>(null)
  const [runtimeReviewEvidence, setRuntimeReviewEvidence] = useState<RuntimeReviewEvidence | null>(null)
  const [runtimeQueryReviewEvidence, setRuntimeQueryReviewEvidence] =
    useState<RuntimeQueryReviewEvidence | null>(null)
  const [runtimeArchiveEvidence, setRuntimeArchiveEvidence] = useState<RuntimeArchiveEvidence | null>(null)
  const [runtimeActiveBatch, setRuntimeActiveBatch] = useState<RuntimeActiveBatch | null>(null)
  const [runtimeBatchSuggestions, setRuntimeBatchSuggestions] = useState<RuntimeBatchSuggestions | null>(null)
  const [runtimeCleanupPlan, setRuntimeCleanupPlan] = useState<RuntimeCleanupPlan | null>(null)
  const [runtimeActiveWorkItem, setRuntimeActiveWorkItem] = useState<RuntimeActiveWorkItem | null>(null)
  const [runtimeEvidenceBlocks, setRuntimeEvidenceBlocks] = useState<RuntimeEvidenceBlock[]>([])
  const [runtimeSuggestionSets, setRuntimeSuggestionSets] = useState<RuntimeSuggestionSet[]>([])
  const [approvalSubmitting, setApprovalSubmitting] = useState(false)
  const [createdApprovalId, setCreatedApprovalId] = useState<string | null>(null)
  const [createdApprovalKind, setCreatedApprovalKind] = useState<RuntimeProposalKind | null>(null)
  const [runtimeRehydrating, setRuntimeRehydrating] = useState(false)
  const storageReadyRef = useRef(false)
  const rehydrateInFlightRef = useRef(false)
  const lastRehydrateAtRef = useRef(0)
  const messagesRef = useRef<ChatMessage[]>([])
  const sessionIdRef = useRef<string | null>(null)
  const loadedAgentIdRef = useRef<string | null>(null)

  const runtimeRefreshRequested = searchParams.get('runtime_refresh') === '1'
  const requestedSessionId = (() => {
    const value = searchParams.get(PLAYGROUND_SESSION_QUERY_PARAM)
    return value && value.trim() ? value.trim() : null
  })()

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const applyRuntimeData = useCallback((data?: PlaygroundApiResponse['data']) => {
    if (!data) return
    setRuntimeProposal(data.runtime_proposal ?? null)
    setRuntimeEvidence(data.runtime_evidence ?? null)
    setRuntimeRecommendation(data.runtime_recommendation ?? null)
    setRuntimeReviewProposal(data.runtime_review_proposal ?? null)
    setRuntimeReviewEvidence(data.runtime_review_evidence ?? null)
    setRuntimeQueryReviewEvidence(data.runtime_query_review_evidence ?? null)
    setRuntimeArchiveEvidence(data.runtime_archive_evidence ?? null)
    setRuntimeActiveBatch(data.runtime_active_batch ?? null)
    setRuntimeBatchSuggestions(data.runtime_batch_suggestions ?? null)
    if ('runtime_cleanup_plan' in data) {
      setRuntimeCleanupPlan(data.runtime_cleanup_plan ?? null)
    }
    setRuntimeActiveWorkItem(data.runtime_active_work_item ?? null)
    setRuntimeEvidenceBlocks(
      Array.isArray(data.runtime_evidence_blocks) ? data.runtime_evidence_blocks : []
    )
    setRuntimeSuggestionSets(
      Array.isArray(data.runtime_suggestion_sets) ? data.runtime_suggestion_sets : []
    )
    if (typeof data.session_id === 'string' && data.session_id.trim()) {
      const nextSessionId = data.session_id.trim()
      sessionIdRef.current = nextSessionId
      setSessionId((prev) => (prev === nextSessionId ? prev : nextSessionId))
    }
  }, [])

  const clearRuntimeState = useCallback(() => {
    sessionIdRef.current = null
    setSessionId(null)
    setRuntimeProposal(null)
    setRuntimeEvidence(null)
    setRuntimeRecommendation(null)
    setRuntimeReviewProposal(null)
    setRuntimeReviewEvidence(null)
    setRuntimeQueryReviewEvidence(null)
    setRuntimeArchiveEvidence(null)
    setRuntimeActiveBatch(null)
    setRuntimeBatchSuggestions(null)
    setRuntimeCleanupPlan(null)
    setRuntimeActiveWorkItem(null)
    setRuntimeEvidenceBlocks([])
    setRuntimeSuggestionSets([])
    setCreatedApprovalId(null)
    setCreatedApprovalKind(null)
  }, [])

  const rehydrateRuntimeState = useCallback(
    async (opts?: {
      sessionIdOverride?: string | null
      messagesOverride?: ChatMessage[]
      force?: boolean
      trigger?: RuntimeRehydrateTrigger
    }) => {
      if (!agent?.id || rehydrateInFlightRef.current) return
      const now = Date.now()
      if (!opts?.force && now - lastRehydrateAtRef.current < REHYDRATE_MIN_GAP_MS) return

      if (process.env.NODE_ENV !== 'production') {
        const trigger = opts?.trigger || 'mount'
        console.log(`[playground][rehydrate:${trigger}]`)
      }

      rehydrateInFlightRef.current = true
      lastRehydrateAtRef.current = now
      setRuntimeRehydrating(true)

      try {
        const res = await fetch('/api/agents/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: agent.id,
            messages: (opts?.messagesOverride ?? messagesRef.current).slice(-PERSISTED_MESSAGE_LIMIT),
            session_id: opts?.sessionIdOverride ?? sessionIdRef.current,
            rehydrate_only: true,
          }),
        })

        const data = (await res.json().catch(() => ({}))) as PlaygroundApiResponse
        if (!res.ok || !data?.ok) return
        applyRuntimeData(data.data)
      } catch (err) {
        console.warn('[playground] runtime rehydrate failed (non-fatal):', err)
      } finally {
        rehydrateInFlightRef.current = false
        setRuntimeRehydrating(false)
      }
    },
    [agent?.id, applyRuntimeData]
  )

  // Load agent data
  useEffect(() => {
    if (!params?.id) return

    async function loadAgent() {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error || !data) {
          console.error('[Summary] loadAgent error:', error)
          setError('❌ Agent not found or access denied.')
        } else {
          const nextAgent = data as PlaygroundAgent
          const nextAgentId =
            typeof nextAgent.id === 'string' && nextAgent.id.trim() ? nextAgent.id.trim() : null
          const previousLoadedAgentId = loadedAgentIdRef.current
          const hasAgentSwitched =
            Boolean(previousLoadedAgentId) &&
            Boolean(nextAgentId) &&
            previousLoadedAgentId !== nextAgentId

          storageReadyRef.current = false
          setAgent(nextAgent)

          // Only reset local conversation/runtime state when switching to a different agent.
          // On same-agent reloads (including dev effect re-runs), preserve restored UI state.
          if (hasAgentSwitched) {
            messagesRef.current = []
            setMessages([])
            clearRuntimeState()
          }

          loadedAgentIdRef.current = nextAgentId
        }
      } catch (err) {
        console.error('[Summary] Load failed:', err)
        setError('⚠️ Error loading agent.')
      } finally {
        setLoading(false)
      }
    }

    loadAgent()
  }, [clearRuntimeState, params?.id, supabase])

  useEffect(() => {
    if (!agent?.id) return

    const activeSessionKey = activeSessionKeyForAgent(agent.id)
    const draftKey = draftStorageKeyForAgent(agent.id)
    const sessionIdFromActiveStorageRaw = readSessionStorageValue(activeSessionKey)
    const sessionIdFromActiveStorage =
      typeof sessionIdFromActiveStorageRaw === 'string' && sessionIdFromActiveStorageRaw.trim()
        ? sessionIdFromActiveStorageRaw.trim()
        : null
    const preferredSessionId = requestedSessionId || sessionIdFromActiveStorage
    const persistedSessionState =
      preferredSessionId && preferredSessionId.trim()
        ? parsePersistedState(readPersistedState(sessionStorageKeyForAgent(agent.id, preferredSessionId)))
        : null
    const persistedDraftState = parsePersistedState(readSessionStorageValue(draftKey))
    const persisted = persistedSessionState || persistedDraftState

    const restoredMessages = Array.isArray(persisted?.messages)
      ? persisted.messages
          .filter(
            (message): message is ChatMessage =>
              !!message &&
              (message.role === 'user' || message.role === 'assistant') &&
              typeof message.content === 'string'
          )
          .slice(-PERSISTED_MESSAGE_LIMIT)
      : []
    const persistedSessionId =
      typeof persisted?.session_id === 'string' && persisted.session_id.trim()
        ? persisted.session_id.trim()
        : null
    const restoredSessionId = requestedSessionId || persistedSessionId

    messagesRef.current = restoredMessages
    sessionIdRef.current = restoredSessionId

    if (persisted) {
      setMessages(restoredMessages)
      setSessionId(restoredSessionId)
      setRuntimeProposal(persisted.runtime_proposal ?? null)
      setRuntimeEvidence(persisted.runtime_evidence ?? null)
      setRuntimeRecommendation(persisted.runtime_recommendation ?? null)
      setRuntimeReviewProposal(persisted.runtime_review_proposal ?? null)
      setRuntimeReviewEvidence(persisted.runtime_review_evidence ?? null)
      setRuntimeQueryReviewEvidence(persisted.runtime_query_review_evidence ?? null)
      setRuntimeArchiveEvidence(persisted.runtime_archive_evidence ?? null)
      setRuntimeActiveBatch(persisted.runtime_active_batch ?? null)
      setRuntimeBatchSuggestions(persisted.runtime_batch_suggestions ?? null)
      setRuntimeCleanupPlan(persisted.runtime_cleanup_plan ?? null)
      setRuntimeActiveWorkItem(persisted.runtime_active_work_item ?? null)
      setRuntimeEvidenceBlocks(
        Array.isArray(persisted.runtime_evidence_blocks) ? persisted.runtime_evidence_blocks : []
      )
      setRuntimeSuggestionSets(
        Array.isArray(persisted.runtime_suggestion_sets) ? persisted.runtime_suggestion_sets : []
      )
      setCreatedApprovalId(persisted.created_approval_id ?? null)
      setCreatedApprovalKind(persisted.created_approval_kind ?? null)
    }

    storageReadyRef.current = true
    void rehydrateRuntimeState({
      sessionIdOverride: restoredSessionId,
      messagesOverride: restoredMessages,
      force: true,
      trigger: 'mount',
    })
  }, [agent?.id, rehydrateRuntimeState, requestedSessionId])

  useEffect(() => {
    if (!agent?.id || !storageReadyRef.current) return

    const draftKey = draftStorageKeyForAgent(agent.id)
    const activeSessionKey = activeSessionKeyForAgent(agent.id)
    const payload: PersistedPlaygroundState = {
      version: 1,
      updated_at: new Date().toISOString(),
      messages: messages.slice(-PERSISTED_MESSAGE_LIMIT),
      session_id: sessionId,
      runtime_proposal: runtimeProposal,
      runtime_evidence: runtimeEvidence,
      runtime_recommendation: runtimeRecommendation,
      runtime_review_proposal: runtimeReviewProposal,
      runtime_review_evidence: runtimeReviewEvidence,
      runtime_query_review_evidence: runtimeQueryReviewEvidence,
      runtime_archive_evidence: runtimeArchiveEvidence,
      runtime_active_batch: runtimeActiveBatch,
      runtime_batch_suggestions: runtimeBatchSuggestions,
      runtime_cleanup_plan: runtimeCleanupPlan,
      runtime_active_work_item: runtimeActiveWorkItem,
      runtime_evidence_blocks: runtimeEvidenceBlocks,
      runtime_suggestion_sets: runtimeSuggestionSets,
      created_approval_id: createdApprovalId,
      created_approval_kind: createdApprovalKind,
    }

    const serializedPayload = JSON.stringify(payload)
    const normalizedSessionId = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null

    if (normalizedSessionId) {
      writePersistedState(sessionStorageKeyForAgent(agent.id, normalizedSessionId), serializedPayload)
      removePersistedState(draftKey)
      writeSessionStorageValue(activeSessionKey, normalizedSessionId)
      return
    }

    writeSessionStorageValue(draftKey, serializedPayload)
    removeSessionStorageValue(activeSessionKey)
  }, [
    agent?.id,
    createdApprovalId,
    createdApprovalKind,
    messages,
    runtimeActiveBatch,
    runtimeActiveWorkItem,
    runtimeArchiveEvidence,
    runtimeBatchSuggestions,
    runtimeCleanupPlan,
    runtimeEvidence,
    runtimeEvidenceBlocks,
    runtimeProposal,
    runtimeRecommendation,
    runtimeReviewEvidence,
    runtimeQueryReviewEvidence,
    runtimeReviewProposal,
    runtimeSuggestionSets,
    sessionId,
  ])

  useEffect(() => {
    if (!agent?.id || !runtimeRefreshRequested) return
    void rehydrateRuntimeState({ force: true, trigger: 'runtime_refresh' })

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('runtime_refresh')
      router.replace(`${url.pathname}${url.search}${url.hash}`)
    }
  }, [agent?.id, rehydrateRuntimeState, router, runtimeRefreshRequested])

  useEffect(() => {
    if (!agent?.id) return

    const handleFocus = () => {
      void rehydrateRuntimeState({ trigger: 'focus' })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      void rehydrateRuntimeState({ trigger: 'visibility' })
    }

      window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [agent?.id, rehydrateRuntimeState])

  const hasInFlightLifecycle = runtimeSuggestionSets.some((set) =>
    set.candidates.some(
      (candidate) => candidate.status === 'pending_approval' || candidate.status === 'approved'
    )
  )

  useEffect(() => {
    if (!agent?.id || !hasInFlightLifecycle) return

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void rehydrateRuntimeState({ trigger: 'poll' })
    }, REHYDRATE_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [agent?.id, hasInFlightLifecycle, rehydrateRuntimeState])

  async function recalculateQuality() {
    if (!agent?.id) return
    setRecalcLoading(true)

    try {
      const res = await fetch('/api/agents/recalculate-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })

      const data = await res.json()
      if (!data.ok) {
        alert(data.error || '⚠️ Failed to recalculate quality.')
      } else {
        // Refresh agent data after recalculation
        setAgent((prev) =>
          prev
            ? {
                ...prev,
                quality_score:
                  typeof data.quality_score === 'number' ? data.quality_score : prev.quality_score,
              }
            : prev
        )
      }
    } catch (err) {
      console.error('[Summary] recalc error:', err)
      alert('⚠️ Recalculation failed.')
    } finally {
      setRecalcLoading(false)
    }
  }

  async function improveQuality() {
    if (!agent?.id) return
    setImproveLoading(true)
    try {
      const res = await fetch('/api/agents/improve-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })

      const data = await res.json()
      console.log('[playground] improve-quality result:', data)

      if (!data.ok) {
        alert(data.error || '⚠️ Failed to generate improvement questions.')
        return
      }

      const score = data.data?.score
      const comment = data.data?.comment as string | undefined

      alert(
        `✅ Prompt Engineer review complete.\n\nCurrent quality score: ${
          typeof score === 'number' ? `${score}/10` : 'N/A'
        }${
          comment
            ? `\n\nSummary:\n${comment}`
            : '\n\nUse "Improve with Q&A" on the Summary tab to answer targeted questions and add training examples.'
        }`
      )
    } catch (err) {
      console.error('[playground] improve-quality error:', err)
      alert('⚠️ Improve Quality call failed. Check console for details.')
    } finally {
      setImproveLoading(false)
    }
  }

  async function handleFeedback(
    label: 'positive' | 'negative',
    originalAnswer: string,
    editedText?: string
  ): Promise<boolean> {
    if (!agent?.id) return false

    const userInput = getLastUserMessage(messages)

    // For "needs work", we *require* an edited answer from the user
    if (label === 'negative') {
      const trimmed = (editedText || '').trim()
      if (!trimmed) {
        alert('Please provide an edited answer for “Needs work”.')
        return false
      }
      editedText = trimmed
    }

    try {
      const payload: {
        agent_id: string
        message: string
        rating: 'up' | 'down'
        label: 'positive' | 'negative'
        source: 'playground'
        user_input: string | null
        agent_output: string
        edited_text?: string
      } = {
        agent_id: agent.id,
        // legacy feedback contract
        message: originalAnswer,
        rating: label === 'positive' ? 'up' : 'down',
        // new fine-tuning fields
        label,
        source: 'playground',
        user_input: userInput,
        agent_output: originalAnswer,
      }

      if (label === 'negative' && editedText) {
        payload.edited_text = editedText
      }

      const res = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('[playground] feedback result:', data)

      if (!data.ok) {
        alert(data.error || '⚠️ Failed to record feedback.')
        return false
      } else if (label === 'negative') {
        alert(
          '✅ Thanks! Your edited answer was saved as a fine-tuning example.\n\n' +
            'Future fine-tunes will use your version to teach the agent how to respond.'
        )
        return true
      } else {
        alert('✅ Thanks for the feedback!')
        return true
      }
    } catch (err) {
      console.error('[playground] feedback error:', err)
      alert('⚠️ Failed to record feedback. Check console for details.')
      return false
    }
  }

  async function submitRuntimePlanProposal(params: {
    userRequest: string
    proposedActions: RuntimePlanAction[]
    kind: RuntimeProposalKind
  }): Promise<string | null> {
    if (!agent?.id || approvalSubmitting) return null

    setApprovalSubmitting(true)
    try {
      const res = await fetch('/api/runtime/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          user_request: params.userRequest,
          proposed_actions: params.proposedActions,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        data?: { approval_id?: string }
      }

      if (!res.ok || !data?.ok) {
        alert(data?.error || '⚠️ Failed to create approval request.')
        return null
      }

      const approvalId =
        data?.data && typeof data.data.approval_id === 'string' ? data.data.approval_id : ''
      if (!approvalId) {
        alert('⚠️ Approval created but approval_id was missing.')
        return null
      }

      setCreatedApprovalId(approvalId)
      setCreatedApprovalKind(params.kind)
      window.setTimeout(() => {
        void rehydrateRuntimeState({ force: true, trigger: 'post-submit' })
      }, 900)
      return approvalId
    } catch (err) {
      console.error('[playground] runtime proposal error:', err)
      alert('⚠️ Failed to create runtime approval request.')
      return null
    } finally {
      setApprovalSubmitting(false)
    }
  }

  function updateSuggestionCandidateStatus(params: {
    matcher: (candidate: RuntimeSuggestedActionCandidate) => boolean
    status: RuntimeSuggestedActionCandidate['status']
    approvalId?: string
  }) {
    setRuntimeSuggestionSets((prev) =>
      prev.map((set) => ({
        ...set,
        candidates: set.candidates.map((candidate) =>
          params.matcher(candidate)
            ? {
                ...candidate,
                status: params.status,
                ...(params.approvalId ? { approval_id: params.approvalId } : {}),
              }
            : candidate
        ),
      }))
    )
  }

  function updateCleanupClusterStatus(params: {
    clusterId: string
    status: RuntimeSuggestedActionCandidate['status']
    approvalId?: string
  }) {
    setRuntimeCleanupPlan((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        clusters: prev.clusters.map((cluster) =>
          cluster.cluster_id === params.clusterId
            ? {
                ...cluster,
                status: params.status,
                ...(params.approvalId ? { approval_id: params.approvalId } : {}),
              }
            : cluster
        ),
      }
    })
  }

  async function submitRuntimeProposal() {
    if (!runtimeProposal || approvalSubmitting) return

    await submitRuntimePlanProposal({
      userRequest: runtimeProposal.user_request,
      proposedActions: runtimeProposal.proposed_actions,
      kind: 'gmail.analyze_inbox',
    })
  }

  async function submitRuntimeReviewProposal() {
    if (!runtimeReviewProposal || approvalSubmitting) return

    await submitRuntimePlanProposal({
      userRequest: runtimeReviewProposal.user_request,
      proposedActions: runtimeReviewProposal.proposed_actions,
      kind: 'gmail.review_sender_cluster',
    })
  }

  async function submitRuntimeBatchSuggestionProposal(kind: RuntimeBatchSuggestionKind) {
    if (!runtimeBatchSuggestions || !runtimeActiveBatch || approvalSubmitting) return

    const currentState = batchSuggestionStateByKind[kind]?.status || 'ready'
    if (currentState !== 'ready') return

    const candidates = runtimeBatchSuggestions[kind]
    if (!Array.isArray(candidates) || candidates.length === 0) return

    const messageIds = candidates.map((candidate) => candidate.message_id)

    const sharedArgs = {
      sender: runtimeActiveBatch.sender,
      batch_title: runtimeActiveBatch.batch_title,
      message_ids: messageIds,
    }

    if (kind === 'archive_candidates') {
      const approvalId = await submitRuntimePlanProposal({
        userRequest: `Archive low-value messages from ${runtimeActiveBatch.sender} in ${runtimeActiveBatch.batch_title}.`,
        proposedActions: [{ tool: 'gmail', action: 'archive_messages', args: sharedArgs }],
        kind: 'gmail.archive_messages',
      })
      if (approvalId) {
        updateSuggestionCandidateStatus({
          matcher: (candidate) =>
            candidate.proposed_action.tool === 'gmail' &&
            candidate.proposed_action.action === 'archive_messages',
          status: 'pending_approval',
          approvalId,
        })
      }
      return
    }

    if (kind === 'unsubscribe_candidates') {
      const approvalId = await submitRuntimePlanProposal({
        userRequest: `Unsubscribe from repetitive senders in ${runtimeActiveBatch.batch_title}.`,
        proposedActions: [{ tool: 'gmail', action: 'unsubscribe_senders', args: sharedArgs }],
        kind: 'gmail.unsubscribe_senders',
      })
      if (approvalId) {
        updateSuggestionCandidateStatus({
          matcher: (candidate) =>
            candidate.proposed_action.tool === 'gmail' &&
            candidate.proposed_action.action === 'unsubscribe_senders',
          status: 'pending_approval',
          approvalId,
        })
      }
      return
    }

    if (kind === 'reply_candidates') {
      const approvalId = await submitRuntimePlanProposal({
        userRequest: `Prepare reply actions for response-needed messages in ${runtimeActiveBatch.batch_title}.`,
        proposedActions: [{ tool: 'gmail', action: 'draft_replies', args: sharedArgs }],
        kind: 'gmail.draft_replies',
      })
      if (approvalId) {
        updateSuggestionCandidateStatus({
          matcher: (candidate) =>
            candidate.proposed_action.tool === 'gmail' &&
            candidate.proposed_action.action === 'draft_replies',
          status: 'pending_approval',
          approvalId,
        })
      }
      return
    }

    const approvalId = await submitRuntimePlanProposal({
      userRequest: `Mark important messages in ${runtimeActiveBatch.batch_title} for priority follow-up.`,
      proposedActions: [{ tool: 'gmail', action: 'mark_important', args: sharedArgs }],
      kind: 'gmail.mark_important',
    })
    if (approvalId) {
      updateSuggestionCandidateStatus({
        matcher: (candidate) =>
          candidate.proposed_action.tool === 'gmail' &&
          candidate.proposed_action.action === 'mark_important',
        status: 'pending_approval',
        approvalId,
      })
    }
  }

  async function submitRuntimeSuggestedActionCandidate(
    setTitle: string,
    candidate: RuntimeSuggestedActionCandidate
  ) {
    if (!candidate.proposed_action || approvalSubmitting || candidate.status !== 'ready') return

    const approvalId = await submitRuntimePlanProposal({
      userRequest: `${candidate.label} from ${setTitle}.`,
      proposedActions: [
        {
          tool: candidate.proposed_action.tool,
          action: candidate.proposed_action.action,
          args: candidate.proposed_action.args,
        },
      ],
      kind: `${candidate.proposed_action.tool}.${candidate.proposed_action.action}`,
    })

    if (approvalId) {
      updateSuggestionCandidateStatus({
        matcher: (item) =>
          item.id === candidate.id &&
          item.proposed_action.tool === candidate.proposed_action.tool &&
          item.proposed_action.action === candidate.proposed_action.action,
        status: 'pending_approval',
        approvalId,
      })
    }
  }

  async function submitRuntimeCleanupClusterProposal(cluster: RuntimeCleanupPlanCluster) {
    if (approvalSubmitting || cluster.status !== 'ready') return

    const approvalId = await submitRuntimePlanProposal({
      userRequest: `Review query-backed cleanup cluster: ${cluster.title}.`,
      proposedActions: [
        {
          tool: cluster.proposed_action.tool,
          action: cluster.proposed_action.action,
          args: cluster.proposed_action.args,
        },
      ],
      kind: `${cluster.proposed_action.tool}.${cluster.proposed_action.action}`,
    })

    if (approvalId) {
      updateCleanupClusterStatus({
        clusterId: cluster.cluster_id,
        status: 'pending_approval',
        approvalId,
      })
    }
  }

  function openApprovals() {
    if (typeof window === 'undefined') {
      router.push('/approvals')
      return
    }

    const current = new URL(window.location.href)
    current.searchParams.delete('runtime_refresh')
    const currentSessionId = sessionIdRef.current
    if (currentSessionId && currentSessionId.trim()) {
      current.searchParams.set(PLAYGROUND_SESSION_QUERY_PARAM, currentSessionId.trim())
    } else {
      current.searchParams.delete(PLAYGROUND_SESSION_QUERY_PARAM)
    }
    const returnTo = `${current.pathname}${current.search}${current.hash}`
    router.push(`/approvals?return_to=${encodeURIComponent(returnTo)}`)
  }

  async function sendMessage() {
    if (!agent?.id || !input.trim() || sending) return

    const text = input.trim()
    setInput('')

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    messagesRef.current = nextMessages
    setMessages(nextMessages)
    setSending(true)
    setCreatedApprovalId(null)
    setCreatedApprovalKind(null)

    try {
      const res = await fetch('/api/agents/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          messages: nextMessages,
          session_id: sessionId,
        }),
      })

      const data = (await res.json()) as PlaygroundApiResponse
      console.log('[playground] API result:', data)

      if (!data.ok || !data.data?.reply) {
        alert(data.error || '⚠️ Playground call failed.')
        return
      }

      const reply = data.data.reply as string
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      applyRuntimeData(data.data)
    } catch (err) {
      console.error('[playground] send error:', err)
      alert('⚠️ Failed to get a reply from the agent.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded text-white space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-64 rounded bg-gray-800" />
            <div className="h-4 w-40 rounded bg-gray-800" />
            <div className="h-28 rounded bg-gray-800/70 border border-gray-800" />
            <div className="h-56 rounded bg-gray-950/60 border border-gray-800" />
            <div className="h-24 rounded bg-gray-800/70 border border-gray-800" />
          </div>
          <p className="text-xs text-gray-400">
            Preparing runtime workspace, approvals context, and chat session…
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-400 p-6">{error}</p>
      </DashboardLayout>
    )
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <p className="text-gray-400 p-6">No agent data available.</p>
      </DashboardLayout>
    )
  }

  const batchSuggestionStateByKind: Partial<
    Record<RuntimeBatchSuggestionKind, { status: RuntimeSuggestedActionCandidate['status']; approvalId?: string }>
  > = {}
  for (const set of runtimeSuggestionSets) {
    for (const candidate of set.candidates) {
      const kind = batchSuggestionKindFromAction(candidate.proposed_action.action)
      if (!kind || batchSuggestionStateByKind[kind]) continue
      batchSuggestionStateByKind[kind] = {
        status: candidate.status,
        approvalId: candidate.approval_id,
      }
    }
  }

  const runtimeCandidates = runtimeSuggestionSets.flatMap((set) => set.candidates)
  const candidateCounts = {
    ready: runtimeCandidates.filter((candidate) => candidate.status === 'ready').length,
    pending: runtimeCandidates.filter((candidate) => candidate.status === 'pending_approval').length,
    approved: runtimeCandidates.filter((candidate) => candidate.status === 'approved').length,
    executed: runtimeCandidates.filter((candidate) => candidate.status === 'executed').length,
  }
  const cleanupClusters = runtimeCleanupPlan?.clusters || []
  const cleanupClusterCounts = {
    ready: cleanupClusters.filter((cluster) => cluster.status === 'ready').length,
    pending: cleanupClusters.filter((cluster) => cluster.status === 'pending_approval').length,
    approved: cleanupClusters.filter((cluster) => cluster.status === 'approved').length,
    executed: cleanupClusters.filter((cluster) => cluster.status === 'executed').length,
  }
  const hasReviewEvidence = Boolean(runtimeReviewEvidence || runtimeQueryReviewEvidence || runtimeActiveBatch)
  const hasExecutionEvidence = Boolean(runtimeArchiveEvidence || candidateCounts.executed > 0)
  const workflowSteps = [
    { label: 'Analyze inbox', done: Boolean(runtimeEvidence) },
    { label: 'Review cluster', done: hasReviewEvidence },
    { label: 'Execute approved action', done: hasExecutionEvidence },
  ]
  const workflowCompletedSteps = workflowSteps.filter((step) => step.done).length
  const workflowProgressPercent =
    workflowSteps.length > 0 ? Math.round((workflowCompletedSteps / workflowSteps.length) * 100) : 0

  let nextActionTitle = 'Ask for next recommended task'
  let nextActionDetail =
    'No immediate approval-gated action is queued. Ask the assistant for the next safe cleanup step.'
  let nextActionCtaLabel: string | null = null
  let nextActionHandler: (() => void) | null = null

  if (createdApprovalId) {
    nextActionTitle = 'Approval request submitted'
    nextActionDetail = `Approval ${createdApprovalId} is waiting in the approvals queue.`
    nextActionCtaLabel = 'Open approvals'
    nextActionHandler = openApprovals
  } else if (runtimeProposal && !approvalSubmitting) {
    nextActionTitle = 'Send inbox analysis for approval'
    nextActionDetail = 'Start with inbox analysis evidence before any cleanup actions.'
    nextActionCtaLabel = 'Send for approval'
    nextActionHandler = submitRuntimeProposal
  } else if (runtimeReviewProposal && !approvalSubmitting) {
    nextActionTitle = 'Review the recommended batch'
    nextActionDetail =
      runtimeReviewProposal.proposed_actions[0]?.args?.batch_title ||
      'Inspect the top sender cluster before selecting actions.'
    nextActionCtaLabel = 'Send for approval'
    nextActionHandler = submitRuntimeReviewProposal
  } else if (cleanupClusterCounts.ready > 0) {
    nextActionTitle = 'Review a query-backed cleanup cluster'
    nextActionDetail =
      runtimeCleanupPlan?.clusters[0]?.title ||
      'A conservative query cluster is ready for read-only review.'
  } else if (candidateCounts.pending + candidateCounts.approved > 0) {
    nextActionTitle = 'Resolve pending approvals'
    nextActionDetail = 'One or more actions are waiting for approval or execution.'
    nextActionCtaLabel = 'Open approvals'
    nextActionHandler = openApprovals
  } else if (candidateCounts.ready > 0) {
    nextActionTitle = 'Propose next batch action'
    nextActionDetail = 'Suggested batch actions are ready to submit for approval.'
  }

  const showRuntimeCard = Boolean(
    runtimeProposal ||
      runtimeRecommendation ||
      runtimeReviewProposal ||
      runtimeReviewEvidence ||
      runtimeQueryReviewEvidence ||
      runtimeArchiveEvidence ||
      runtimeActiveBatch ||
      runtimeBatchSuggestions ||
      runtimeCleanupPlan ||
      runtimeActiveWorkItem ||
      runtimeEvidenceBlocks.length > 0 ||
      runtimeSuggestionSets.length > 0 ||
      createdApprovalId ||
      runtimeEvidence
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded text-white flex flex-col min-h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold"
              title={agent?.name || ''}
            >
              {prettyAgentTitle(agent)}
            </h1>
            <p className="text-[11px] text-gray-500 mt-1">
              Session: <span className="font-mono">{sessionId ? sessionId.slice(0, 8) : 'new'}</span>
            </p>
          </div>
          <button
            onClick={() => router.push(`/agents/${agent.id}/summary`)}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-xs"
          >
            ← Back to summary
          </button>
        </div>

        {/* 🌟 Agent Type & Quality + Recalculate */}
        <div className="mb-6 border border-gray-800 rounded p-4 bg-gray-800">
          {agent.onboarding_summary?.agent_type && (
            <p className="text-sm mb-1">
              <strong>Agent Type:</strong> {agent.onboarding_summary.agent_type}
            </p>
          )}
          {typeof agent.quality_score === 'number' && (
            <p className="text-sm mb-1">
              <strong>Quality Score:</strong> {agent.quality_score}/10
            </p>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="sm:max-w-[60%]">
              <p className="text-[11px] text-gray-400 leading-snug">
                After making manual edits below, you can:
              </p>
              <ul className="mt-1 ml-4 list-disc text-[11px] text-gray-400 space-y-0.5">
                <li>
                  <span className="font-semibold">Recalculate quality</span> – sends your current
                  summary back to the Prompt Engineer to rewrite and re-score the agent.
                </li>
                <li>
                  <span className="font-semibold">Improve with Q&amp;A</span> – the Prompt Engineer
                  will ask targeted questions, capture your answers as training examples, and then
                  re-score the agent after you finish.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end min-w-[220px]">
              <button
                onClick={recalculateQuality}
                disabled={recalcLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1 ${
                  recalcLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {recalcLoading ? 'Recalculating…' : '🚀 Recalculate quality'}
              </button>

              <button
                onClick={improveQuality}
                disabled={improveLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1 ${
                  improveLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {improveLoading ? 'Asking…' : '🧠 Improve with Q&A'}
              </button>
            </div>
          </div>
        </div>

        {showRuntimeCard && (
          <section className="mb-5 rounded-xl border border-cyan-900/60 bg-gradient-to-b from-cyan-950/30 to-gray-900/60 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-cyan-100">Runtime Operations Dashboard</p>
                <p className="text-xs text-cyan-100/80">
                  Approval-gated inbox workflow. Summary first, evidence second.
                </p>
                {runtimeRehydrating && (
                  <p className="text-[11px] text-cyan-300/80 mt-1">Syncing latest runtime state…</p>
                )}
              </div>
              <button
                type="button"
                onClick={openApprovals}
                className="px-3 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white"
              >
                Open approvals
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-cyan-900/50 bg-gray-950/50 p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-cyan-300">Next action</p>
                <p className="text-sm font-semibold text-cyan-100">{nextActionTitle}</p>
                <p className="text-xs text-gray-300">{nextActionDetail}</p>
                {nextActionCtaLabel && nextActionHandler && (
                  <button
                    type="button"
                    onClick={nextActionHandler}
                    disabled={approvalSubmitting}
                    className={`mt-2 px-3 py-1.5 rounded text-xs font-medium ${
                      approvalSubmitting
                        ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    {approvalSubmitting ? 'Submitting…' : nextActionCtaLabel}
                  </button>
                )}
              </div>

              <div className="rounded border border-cyan-900/50 bg-gray-950/50 p-3 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-cyan-300">Workflow progress</p>
                <p className="text-sm font-semibold text-cyan-100">
                  {workflowCompletedSteps}/{workflowSteps.length} stages complete ({workflowProgressPercent}%)
                </p>
                <div className="h-2 rounded bg-gray-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all" style={{ width: `${workflowProgressPercent}%` }} />
                </div>
                <p className="text-[11px] text-gray-400">
                  Derived from runtime evidence and action lifecycle status.
                </p>
              </div>

              <div className="rounded border border-cyan-900/50 bg-gray-950/50 p-3 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-cyan-300">Queue status</p>
                <p className="text-xs text-gray-300">
                  Suggestions: ready {candidateCounts.ready}, pending {candidateCounts.pending}, approved{' '}
                  {candidateCounts.approved}, executed {candidateCounts.executed}
                </p>
                {cleanupClusters.length > 0 && (
                  <p className="text-xs text-gray-300">
                    Clusters: ready {cleanupClusterCounts.ready}, pending {cleanupClusterCounts.pending}, approved{' '}
                    {cleanupClusterCounts.approved}, executed {cleanupClusterCounts.executed}
                  </p>
                )}
                {createdApprovalId && (
                  <p className="text-xs text-emerald-300">
                    Latest approval: <span className="font-mono">{createdApprovalId}</span>
                  </p>
                )}
              </div>
            </div>

            {(runtimeActiveWorkItem || runtimeEvidenceBlocks.length > 0 || runtimeSuggestionSets.length > 0) && (
              <details className="rounded border border-cyan-900/50 bg-gray-900/50 p-3 text-xs text-gray-200 space-y-2">
                <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                  Runtime scaffolding (generic details)
                </summary>
                <p className="text-gray-400 mt-1">
                  Low-level runtime lifecycle structures used for state reconciliation.
                </p>

                {runtimeActiveWorkItem && (
                  <div className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-0.5">
                    <p className="text-cyan-100">{runtimeActiveWorkItem.title}</p>
                    <p className="text-gray-300">{runtimeActiveWorkItem.summary}</p>
                    <p className="text-gray-400">
                      Executed:{' '}
                      {runtimeActiveWorkItem.executed_at
                        ? new Date(runtimeActiveWorkItem.executed_at).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                )}

                {runtimeEvidenceBlocks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-cyan-100">Evidence blocks</p>
                    {runtimeEvidenceBlocks.slice(0, 3).map((block) => (
                      <div
                        key={block.id}
                        className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-0.5"
                      >
                        <p className="text-gray-200">{block.title}</p>
                        <p className="text-gray-400">{block.summary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {runtimeSuggestionSets.map((set) => (
                  <div
                    key={set.id}
                    className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-1"
                  >
                    <p className="text-cyan-100">{set.title}</p>
                    <p className="text-gray-400">{set.summary}</p>
                    {set.candidates.map((candidate) => {
                      const suggestionKind = batchSuggestionKindFromAction(
                        candidate.proposed_action.action
                      )
                      const isHandledByGmailCard =
                        set.id === 'active-batch-suggestions' &&
                        Boolean(runtimeBatchSuggestions) &&
                        suggestionKind != null
                      const isHandledByCleanupCard =
                        Boolean(runtimeCleanupPlan) &&
                        candidate.proposed_action.tool === 'gmail' &&
                        candidate.proposed_action.action === 'review_query_cluster'
                      return (
                        <div
                          key={`${set.id}:${candidate.id}`}
                          className="rounded border border-cyan-900/30 bg-gray-900/60 p-2 space-y-1"
                        >
                          <p className="text-gray-200">
                            {candidate.label} ({candidate.message_ids.length})
                          </p>
                          <p className="text-gray-400">{candidate.reason}</p>
                          <p className="text-gray-400">
                            Status: {suggestionStatusLabel(candidate.status)}
                            {candidate.approval_id ? ` (${candidate.approval_id})` : ''}
                          </p>
                          {!isHandledByGmailCard && !isHandledByCleanupCard && candidate.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() => submitRuntimeSuggestedActionCandidate(set.title, candidate)}
                              disabled={approvalSubmitting}
                              className={`px-3 py-1.5 rounded text-xs font-medium ${
                                approvalSubmitting
                                  ? 'bg-gray-600 cursor-not-allowed'
                                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                              }`}
                            >
                              {approvalSubmitting ? 'Submitting…' : 'Send for approval'}
                            </button>
                          )}
                          {isHandledByGmailCard && (
                            <p className="text-gray-500">Use the Gmail batch card below for actions.</p>
                          )}
                          {isHandledByCleanupCard && (
                            <p className="text-gray-500">Use the cleanup planner card below for actions.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </details>
            )}

            {runtimeEvidence && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200">
                <p className="font-semibold text-cyan-100 mb-1">Latest Inbox Analysis Evidence</p>
                <p className="text-gray-300">
                  Executed:{' '}
                  {runtimeEvidence.executed_at
                    ? new Date(runtimeEvidence.executed_at).toLocaleString()
                    : '—'}
                </p>
                <p className="text-gray-300">
                  Sample size: {runtimeEvidence.inbox_analysis.sample_size} / estimate:{' '}
                  {runtimeEvidence.inbox_analysis.total_messages_estimate}
                </p>
                <p className="text-gray-300">
                  Top senders:{' '}
                  {runtimeEvidence.inbox_analysis.top_senders.length > 0
                    ? runtimeEvidence.inbox_analysis.top_senders
                        .map((entry) => `${entry.sender} (${entry.count})`)
                        .join(', ')
                    : 'none in sample'}
                </p>
              </div>
            )}

            {runtimeRecommendation && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-1">
                <p className="font-semibold text-cyan-100">Recommended first batch</p>
                <p className="text-gray-300">{runtimeRecommendation.batch_title}</p>
                <p className="text-gray-300">
                  Sender: <span className="font-medium text-gray-100">{runtimeRecommendation.sender}</span> (
                  {runtimeRecommendation.count})
                </p>
                <p className="text-gray-300">{runtimeRecommendation.reason}</p>
              </div>
            )}

            {runtimeCleanupPlan && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-2">
                <p className="font-semibold text-cyan-100">Query-backed cleanup plan</p>
                <p className="text-gray-400">
                  Generated:{' '}
                  {runtimeCleanupPlan.generated_at
                    ? new Date(runtimeCleanupPlan.generated_at).toLocaleString()
                    : '—'}{' '}
                  | Mode: {runtimeCleanupPlan.planning_mode}
                </p>
                {runtimeCleanupPlan.safety_defaults.length > 0 && (
                  <p className="text-gray-400">
                    Safety defaults: {runtimeCleanupPlan.safety_defaults.slice(0, 4).join(' | ')}
                  </p>
                )}
                <p className="text-gray-300">
                  Cluster queue: {cleanupClusterCounts.ready} ready / {cleanupClusterCounts.pending} pending /{' '}
                  {cleanupClusterCounts.approved} approved / {cleanupClusterCounts.executed} executed
                </p>
                <details className="rounded border border-cyan-900/40 bg-gray-950/40 p-2">
                  <summary className="cursor-pointer list-none text-cyan-100 font-medium">
                    View cluster details
                  </summary>
                  <div className="mt-2 space-y-2">
                    {runtimeCleanupPlan.clusters.slice(0, 6).map((cluster) => (
                      <div
                        key={cluster.cluster_id}
                        className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-1"
                      >
                        <p className="text-cyan-100">
                          {cluster.title} (~{cluster.estimated_count})
                        </p>
                        <p className="text-gray-400">Status: {suggestionStatusLabel(cluster.status)}</p>
                        <p className="text-gray-400">{cluster.why_selected}</p>
                        <p className="text-gray-500 font-mono break-all">Query: {cluster.query}</p>
                        <p className="text-gray-500">Risk: {cluster.risk_note}</p>
                        <p className="text-gray-500">Safety: {cluster.safety_note}</p>
                        {cluster.sample_preview.length > 0 && (
                          <p className="text-gray-500">
                            Sample:{' '}
                            {cluster.sample_preview
                              .slice(0, 2)
                              .map((sample) => sample.subject || sample.from || sample.message_id)
                              .join(' | ')}
                          </p>
                        )}
                        {cluster.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => submitRuntimeCleanupClusterProposal(cluster)}
                            disabled={approvalSubmitting}
                            className={`px-3 py-1.5 rounded text-xs font-medium ${
                              approvalSubmitting
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                            }`}
                          >
                            {approvalSubmitting ? 'Submitting…' : 'Send cluster for approval'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {runtimeReviewProposal && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-2">
                <p className="font-semibold text-cyan-100">Review this batch</p>
                <p className="text-gray-300">
                  {runtimeReviewProposal.proposed_actions[0]?.args?.batch_title || 'Sender cluster review'}
                </p>
                <p className="text-gray-300">
                  Sender:{' '}
                  <span className="font-medium text-gray-100">
                    {runtimeReviewProposal.proposed_actions[0]?.args?.sender || '—'}
                  </span>{' '}
                  ({runtimeReviewProposal.proposed_actions[0]?.args?.count ?? 0})
                </p>
                <p className="text-gray-300">{runtimeReviewProposal.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitRuntimeReviewProposal}
                    disabled={approvalSubmitting}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      approvalSubmitting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    {approvalSubmitting ? 'Submitting…' : 'Send for approval'}
                  </button>
                  <button
                    type="button"
                    onClick={openApprovals}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    Open approvals
                  </button>
                </div>
              </div>
            )}

            {runtimeReviewEvidence && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-1">
                <p className="font-semibold text-cyan-100">Latest Reviewed Batch Evidence</p>
                <p className="text-gray-300">
                  Sender: <span className="font-medium text-gray-100">{runtimeReviewEvidence.sender_review.sender}</span>
                </p>
                <p className="text-gray-300">
                  Fetched count: {runtimeReviewEvidence.sender_review.fetched_count}
                </p>
                <p className="text-gray-300">
                  Dates:{' '}
                  {runtimeReviewEvidence.sender_review.sampled_oldest_message_date || '—'} to{' '}
                  {runtimeReviewEvidence.sender_review.sampled_newest_message_date || '—'}
                </p>
                <p className="text-gray-300">
                  Subject lines:{' '}
                  {runtimeReviewEvidence.sender_review.sample_subject_lines.length > 0
                    ? runtimeReviewEvidence.sender_review.sample_subject_lines.slice(0, 3).join(' | ')
                    : 'none'}
                </p>
                <p className="text-gray-300">
                  Snippet previews:{' '}
                  {runtimeReviewEvidence.sender_review.snippet_previews.length > 0
                    ? runtimeReviewEvidence.sender_review.snippet_previews.slice(0, 2).join(' | ')
                    : 'none'}
                </p>
                {runtimeActiveBatch && (
                  <div className="mt-1 rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-0.5">
                    <p className="text-cyan-100">Current active reviewed batch</p>
                    <p className="text-gray-300">{runtimeActiveBatch.batch_title}</p>
                    <p className="text-gray-400">
                      Sender: {runtimeActiveBatch.sender} ({runtimeActiveBatch.fetched_count})
                    </p>
                    <p className="text-gray-400">
                      Executed:{' '}
                      {runtimeActiveBatch.executed_at
                        ? new Date(runtimeActiveBatch.executed_at).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                )}
                {runtimeReviewEvidence.sender_review.messages.length > 0 && (
                  <details className="rounded border border-cyan-900/40 bg-gray-950/40 p-2">
                    <summary className="cursor-pointer list-none text-cyan-100 font-medium">
                      Reviewed messages ({runtimeReviewEvidence.sender_review.messages.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {runtimeReviewEvidence.sender_review.messages.slice(0, 5).map((message) => (
                        <div
                          key={message.message_id}
                          className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-0.5"
                        >
                          <p className="text-gray-200">
                            {message.subject || '(no subject)'}
                          </p>
                          <p className="text-gray-400">
                            From: {message.from || '—'} | Date: {message.date || '—'}
                          </p>
                          <p className="text-gray-400">{message.snippet || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {runtimeQueryReviewEvidence && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-1">
                <p className="font-semibold text-cyan-100">Latest Query Cluster Review Evidence</p>
                <p className="text-gray-300">
                  Cluster: <span className="font-medium text-gray-100">{runtimeQueryReviewEvidence.query_review.title}</span>
                </p>
                <p className="text-gray-300">
                  Type: {runtimeQueryReviewEvidence.query_review.cluster_type} | ID:{' '}
                  {runtimeQueryReviewEvidence.query_review.cluster_id}
                </p>
                <p className="text-gray-500 font-mono break-all">
                  Query: {runtimeQueryReviewEvidence.query_review.query}
                </p>
                <p className="text-gray-300">
                  Estimated count: {runtimeQueryReviewEvidence.query_review.estimated_count ?? '—'} | Fetched count:{' '}
                  {runtimeQueryReviewEvidence.query_review.fetched_count}
                </p>
                <p className="text-gray-300">
                  Dates:{' '}
                  {runtimeQueryReviewEvidence.query_review.sampled_oldest_message_date || '—'} to{' '}
                  {runtimeQueryReviewEvidence.query_review.sampled_newest_message_date || '—'}
                </p>
                <p className="text-gray-300">
                  Subject lines:{' '}
                  {runtimeQueryReviewEvidence.query_review.sample_subject_lines.length > 0
                    ? runtimeQueryReviewEvidence.query_review.sample_subject_lines.slice(0, 3).join(' | ')
                    : 'none'}
                </p>
                <p className="text-gray-300">
                  Snippet previews:{' '}
                  {runtimeQueryReviewEvidence.query_review.snippet_previews.length > 0
                    ? runtimeQueryReviewEvidence.query_review.snippet_previews.slice(0, 2).join(' | ')
                    : 'none'}
                </p>
                <p className="text-gray-500">Risk: {runtimeQueryReviewEvidence.query_review.risk_note}</p>
                <p className="text-gray-500">Safety: {runtimeQueryReviewEvidence.query_review.safety_note}</p>
                {runtimeQueryReviewEvidence.query_review.reviewed_messages_preview.length > 0 && (
                  <details className="rounded border border-cyan-900/40 bg-gray-950/40 p-2">
                    <summary className="cursor-pointer list-none text-cyan-100 font-medium">
                      Reviewed messages preview ({runtimeQueryReviewEvidence.query_review.reviewed_messages_preview.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {runtimeQueryReviewEvidence.query_review.reviewed_messages_preview
                        .slice(0, 5)
                        .map((message) => (
                          <div
                            key={message.message_id}
                            className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-0.5"
                          >
                            <p className="text-gray-200">{message.subject || '(no subject)'}</p>
                            <p className="text-gray-400">
                              From: {message.from || '—'} | Date: {message.date || '—'}
                            </p>
                            <p className="text-gray-400">{message.snippet || '—'}</p>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {runtimeArchiveEvidence && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-1">
                <p className="font-semibold text-cyan-100">Latest Archive Execution Evidence</p>
                <p className="text-gray-300">
                  Executed:{' '}
                  {runtimeArchiveEvidence.executed_at
                    ? new Date(runtimeArchiveEvidence.executed_at).toLocaleString()
                    : '—'}
                </p>
                <p className="text-gray-300">
                  Sender:{' '}
                  <span className="font-medium text-gray-100">
                    {runtimeArchiveEvidence.archive_result.sender || '—'}
                  </span>
                </p>
                <p className="text-gray-300">
                  Batch title: {runtimeArchiveEvidence.archive_result.batch_title || '—'}
                </p>
                <p className="text-gray-300">
                  Archived from Inbox: {runtimeArchiveEvidence.archive_result.archived_count} /{' '}
                  {runtimeArchiveEvidence.archive_result.requested_count}
                </p>
                <p className="text-gray-300">
                  Message IDs:{' '}
                  {runtimeArchiveEvidence.archive_result.message_ids.length > 0
                    ? runtimeArchiveEvidence.archive_result.message_ids.slice(0, 5).join(' | ')
                    : 'none'}
                </p>
              </div>
            )}

            {runtimeBatchSuggestions && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-2">
                <p className="font-semibold text-cyan-100">Suggested actions for this batch</p>
                {(
                  [
                    {
                      key: 'archive_candidates',
                      title: 'Archive candidates',
                      buttonLabel: 'Propose archive',
                    },
                    {
                      key: 'unsubscribe_candidates',
                      title: 'Unsubscribe candidates',
                      buttonLabel: 'Propose unsubscribe',
                    },
                    {
                      key: 'reply_candidates',
                      title: 'Reply candidates',
                      buttonLabel: 'Propose reply',
                    },
                    {
                      key: 'important_candidates',
                      title: 'Important candidates',
                      buttonLabel: 'Propose mark important',
                    },
                  ] as Array<{
                    key: RuntimeBatchSuggestionKind
                    title: string
                    buttonLabel: string
                  }>
                ).map((item) => {
                  const candidates = runtimeBatchSuggestions[item.key]
                  const candidateState = batchSuggestionStateByKind[item.key]?.status || 'ready'
                  const candidateApprovalId = batchSuggestionStateByKind[item.key]?.approvalId
                  return (
                    <div
                      key={item.key}
                      className="rounded border border-cyan-900/40 bg-gray-950/40 p-2 space-y-1"
                    >
                      <p className="text-cyan-100">
                        {item.title} ({candidates.length})
                      </p>
                      <p className="text-gray-400">
                        {candidates.length > 0
                          ? candidates
                              .slice(0, 3)
                              .map((candidate) => candidate.message_id)
                              .join(' | ')
                          : 'No candidates in current reviewed sample.'}
                      </p>
                      {candidates[0]?.reason ? (
                        <p className="text-gray-500">{candidates[0].reason}</p>
                      ) : null}
                      <p className="text-gray-500">
                        Status: {suggestionStatusLabel(candidateState)}
                        {candidateApprovalId ? ` (${candidateApprovalId})` : ''}
                      </p>
                      {candidateState === 'ready' ? (
                        <button
                          type="button"
                          onClick={() => submitRuntimeBatchSuggestionProposal(item.key)}
                          disabled={approvalSubmitting || candidates.length === 0}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            approvalSubmitting || candidates.length === 0
                              ? 'bg-gray-600 cursor-not-allowed'
                              : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                          }`}
                        >
                          {approvalSubmitting ? 'Submitting…' : item.buttonLabel}
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}

            {runtimeProposal && (
              <div className="rounded border border-cyan-900/60 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-2">
                <p className="font-semibold text-cyan-100">Proposed Runtime Action</p>
                <p className="text-gray-300">{runtimeProposal.reason}</p>
                <pre className="rounded bg-gray-950 p-2 text-[11px] overflow-x-auto">{`{ "tool": "gmail", "action": "analyze_inbox" }`}</pre>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitRuntimeProposal}
                    disabled={approvalSubmitting}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      approvalSubmitting
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    {approvalSubmitting ? 'Submitting…' : 'Send for approval'}
                  </button>
                  <button
                    type="button"
                    onClick={openApprovals}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    Open approvals
                  </button>
                </div>
              </div>
            )}

            {createdApprovalId && (
              <div className="rounded border border-emerald-900/70 bg-emerald-950/30 p-3 text-xs text-emerald-100">
                {`Approval request created for ${approvalKindLabel(createdApprovalKind)}: `}
                <span className="font-mono">{createdApprovalId}</span>
              </div>
            )}
          </section>
        )}

        {/* Chat window */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-200">Conversation</p>
          <p className="text-[11px] text-gray-500">Chat context sent with each Playground call</p>
        </div>
        <div className="flex-1 border border-gray-800 rounded-lg p-3 bg-gray-950/40 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              Start by asking something this agent should be good at (e.g. “How do I handle a
              contaminated grow bag refund?”).
            </p>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {m.content}
                </div>

                {/* Feedback row for assistant messages */}
                {m.role === 'assistant' && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>How was this answer?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleFeedback('positive', m.content)
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white"
                      >
                        👍 Good
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(idx)
                          setEditDraft(m.content)
                        }}
                        className="px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white"
                      >
                        👎 Needs work
                      </button>
                    </div>

                    {editingIndex === idx && (
                      <div className="mt-2 border border-gray-700 rounded-lg p-2 bg-gray-900 space-y-2">
                        <p className="text-[11px] text-gray-300">
                          Edit this answer to what you wish the agent had said. Your version will be
                          stored as a fine-tuning example.
                        </p>

                        {/* Voice recorder for the corrected answer */}
                        <VoiceRecorder
                          onTranscribed={(text) => {
                            setEditDraft((prev) => (prev ? `${prev}\n${text}` : text))
                          }}
                        />

                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={4}
                          className="w-full mt-1 rounded bg-gray-800 text-white text-xs p-2 border border-gray-700 resize-y"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIndex(null)
                              setEditDraft('')
                            }}
                            className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await handleFeedback('negative', m.content, editDraft)
                              if (!ok) return

                              // Replace the assistant message content with the corrected answer
                              setMessages((prev) =>
                                prev.map((msg, i) =>
                                  i === idx ? { ...msg, content: editDraft } : msg
                                )
                              )

                              // Exit edit mode
                              setEditingIndex(null)
                              setEditDraft('')
                            }}
                            className="px-3 py-1 rounded text-xs bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            💾 Save corrected answer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="mt-auto">
          <p className="text-[11px] text-gray-500 mb-1">Compose next message</p>
          <label className="block text-xs text-gray-400 mb-1">
            Ask this agent a question
          </label>

          {/* Primary: voice input */}
          <div className="mb-2">
            <p className="text-[11px] text-gray-400 mb-1">
              Tap the mic to speak your question, then tweak the text if needed before sending.
            </p>
            <VoiceRecorder
              onTranscribed={(text) => {
                setInput((prev) => (prev ? `${prev}\n${text}` : text))
              }}
            />
          </div>

          {/* Secondary: manual typing / editing */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full p-2 rounded bg-gray-800 text-white text-sm mb-2"
            placeholder="Example: A customer says their agar dish arrived contaminated. How should I respond?"
          />
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className={`px-4 py-2 rounded text-sm font-medium ${
                sending || !input.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sending ? 'Thinking…' : 'Send'}
            </button>
            <button
              onClick={() => {
                const sessionIdToClear = sessionIdRef.current
                messagesRef.current = []
                setMessages([])
                clearRuntimeState()
                if (typeof window !== 'undefined' && agent?.id) {
                  removePersistedState(draftStorageKeyForAgent(agent.id))
                  removeSessionStorageValue(activeSessionKeyForAgent(agent.id))
                  if (sessionIdToClear && sessionIdToClear.trim()) {
                    removePersistedState(sessionStorageKeyForAgent(agent.id, sessionIdToClear.trim()))
                  }
                  const url = new URL(window.location.href)
                  url.searchParams.delete(PLAYGROUND_SESSION_QUERY_PARAM)
                  router.replace(`${url.pathname}${url.search}${url.hash}`)
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Clear conversation
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
