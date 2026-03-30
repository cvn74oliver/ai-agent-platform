'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import VoiceRecorder from '@/components/VoiceRecorder'
import ApprovalDecisionCard from '@/components/runtime/ApprovalDecisionCard'
import { buildApprovalDecisionSummary } from '@/lib/runtime/approvalSummary'
import {
  derivePlaygroundWorkflowState,
  type WorkflowActionInput,
} from '@/lib/runtime/playgroundWorkflowState'

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
    label_ids?: string[]
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
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
    label_ids?: string[]
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
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

type RuntimeReviewResult = {
  id: string
  kind: 'review_sender_cluster' | 'review_query_cluster'
  executed_at: string
  approval_id: string
  title: string
  objective: string
  source_label: string
  cluster_id: string | null
  cluster_type: string | null
  sender: string | null
  query: string | null
  estimated_count: number | null
  fetched_count: number
  sample_subject_lines: string[]
  snippet_previews: string[]
  messages: Array<{
    message_id: string
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
    label_ids?: string[]
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
  risk_note: string | null
  safety_note: string | null
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

type RuntimeApprovalQueueSummary = {
  pending: number
  approved: number
  executed: number
  rejected: number
  pending_approval_ids: string[]
  approved_approval_ids: string[]
  scope: 'session' | 'agent'
  scope_session_id?: string
}

type ClearedSessionApprovalContext = {
  session_id: string
  captured_at: string
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
  sender_count: number
  message_count: number
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

type RuntimeMailboxProfile = {
  generated_at: string
  analysis_window_days: 30 | 60
  profile_model: string
  metadata_scan_basis: {
    message_id_scan_count: number
    metadata_message_count: number
  }
  recommendation_confidence: 'preliminary' | 'moderate'
  freshness?: {
    status: 'fresh' | 'cached' | 'stale'
    last_generated_at: string
    expires_at: string | null
    cache_ttl_seconds: number
  }
  native_signal_counts: {
    inbox_recent_estimate: number
    category_primary_estimate: number
    category_promotions_estimate: number
    category_social_estimate: number
    category_updates_estimate: number
    category_forums_estimate: number
    unread_recent_estimate: number
    important_recent_estimate: number
    starred_recent_estimate: number
    likely_machine_generated_recent_estimate: number
    likely_human_priority_recent_estimate: number
    stale_unread_30d_estimate: number
    stale_unread_60d_estimate: number
    stale_unread_90d_estimate: number
  }
  recurring_categories: Array<{
    category: 'primary' | 'promotions' | 'social' | 'updates' | 'forums'
    estimated_count: number
    source: 'gmail_native'
  }>
  sender_frequency: Array<{
    sender: string
    count: number
    signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
    source: 'computed_recent_window_sample'
  }>
  subject_patterns: Array<{
    pattern: string
    count: number
    source: 'computed_recent_window_sample'
  }>
  protection_candidates: Array<{
    title: string
    query: string
    estimated_count: number
    reason: string
    source: 'gmail_native' | 'gmail_native_plus_heuristic'
  }>
  cleanup_candidates: Array<{
    title: string
    query: string
    estimated_count: number
    reason: string
    source: 'gmail_native' | 'gmail_native_plus_heuristic'
  }>
  rule_opportunities: Array<{
    title: string
    query: string
    estimated_count: number
    reason: string
    source: 'gmail_native' | 'gmail_native_plus_heuristic'
  }>
  notes: string[]
}

type RuntimeCleanupStrategyItem = {
  title: string
  reason: string
  estimated_count: number | null
  query?: string
  source: 'gmail_native' | 'gmail_native_plus_heuristic' | 'computed_recent_window_sample'
}

type RuntimeCleanupStrategy = {
  generated_at: string
  analysis_window_days: 30 | 60
  freshness_status: 'fresh' | 'cached' | 'stale' | 'unknown'
  recommendation_confidence: 'preliminary' | 'moderate'
  confidence_note: string
  protect_first: RuntimeCleanupStrategyItem[]
  best_first_cleanup_waves: RuntimeCleanupStrategyItem[]
  rule_opportunities: RuntimeCleanupStrategyItem[]
  avoid_or_review_carefully: RuntimeCleanupStrategyItem[]
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
  | 'profile_refresh'

type PlaygroundApiResponse = {
  ok?: boolean
  error?: string
  data?: {
    reply?: string
    session_id?: string
    session_messages?: ChatMessage[]
    runtime_proposal?: RuntimeProposal
    runtime_evidence?: RuntimeEvidence
    runtime_recommendation?: RuntimeRecommendation
    runtime_review_proposal?: RuntimeReviewProposal
    runtime_review_evidence?: RuntimeReviewEvidence
    runtime_query_review_evidence?: RuntimeQueryReviewEvidence
    runtime_review_results?: RuntimeReviewResult[]
    runtime_archive_evidence?: RuntimeArchiveEvidence
    runtime_active_batch?: RuntimeActiveBatch
    runtime_batch_suggestions?: RuntimeBatchSuggestions
    runtime_cleanup_plan?: RuntimeCleanupPlan
    runtime_mailbox_profile?: RuntimeMailboxProfile
    runtime_cleanup_strategy?: RuntimeCleanupStrategy
    runtime_active_work_item?: RuntimeActiveWorkItem
    runtime_evidence_blocks?: RuntimeEvidenceBlock[]
    runtime_suggestion_sets?: RuntimeSuggestionSet[]
    runtime_approval_queue_summary?: RuntimeApprovalQueueSummary
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
  runtime_review_results: RuntimeReviewResult[]
  runtime_archive_evidence: RuntimeArchiveEvidence | null
  runtime_active_batch: RuntimeActiveBatch | null
  runtime_batch_suggestions: RuntimeBatchSuggestions | null
  runtime_cleanup_plan: RuntimeCleanupPlan | null
  runtime_mailbox_profile: RuntimeMailboxProfile | null
  runtime_cleanup_strategy: RuntimeCleanupStrategy | null
  runtime_active_work_item: RuntimeActiveWorkItem | null
  runtime_evidence_blocks: RuntimeEvidenceBlock[]
  runtime_suggestion_sets: RuntimeSuggestionSet[]
  runtime_approval_queue_summary: RuntimeApprovalQueueSummary | null
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
const PLAYGROUND_FRESH_START_PREFIX = 'playground.runtime.fresh_start.v1'
const PLAYGROUND_CLEARED_CHAT_SESSION_PREFIX = 'playground.runtime.cleared_chat_session.v1'
const PLAYGROUND_SESSION_QUERY_PARAM = 'playground_session_id'
const PLAYGROUND_SENDER_PREFERENCES_PREFIX = 'playground.runtime.sender_preferences.v1'
const PERSISTED_MESSAGE_LIMIT = 40
const REHYDRATE_INTERVAL_MS = 12000
const REHYDRATE_MIN_GAP_MS = 7000
const REHYDRATE_SYNC_INDICATOR_DELAY_MS = 650
const OPTIMISTIC_APPROVAL_HOLD_MS = 15000
const REHYDRATE_TRIGGER_MIN_GAP_MS: Record<RuntimeRehydrateTrigger, number> = {
  mount: 12000,
  focus: 12000,
  visibility: 12000,
  poll: REHYDRATE_INTERVAL_MS - 500,
  'post-submit': 3000,
  runtime_refresh: 5000,
  profile_refresh: 2000,
}
const REHYDRATE_TRIGGER_LABEL: Record<RuntimeRehydrateTrigger, string> = {
  mount: 'mount',
  focus: 'focus',
  visibility: 'visibility',
  poll: 'lifecycle-poll',
  'post-submit': 'post-submit',
  runtime_refresh: 'return-from-approvals',
  profile_refresh: 'profile-refresh',
}

function logRehydrateTrace(params: {
  trigger: RuntimeRehydrateTrigger
  decision: 'allow' | 'skip'
  reason: string
  sessionId: string | null
}) {
  if (process.env.NODE_ENV === 'production') return
  const triggerLabel = REHYDRATE_TRIGGER_LABEL[params.trigger] || params.trigger
  console.log(
    `[playground][rehydrate:${triggerLabel}] ${params.decision}=${params.reason} session=${
      params.sessionId || 'none'
    }`
  )
}

function logSessionDecision(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return
  const suffix = details ? ` ${JSON.stringify(details)}` : ''
  console.log(`[playground][session:${event}]${suffix}`)
}

function getActionableApprovalIdsFromRuntimeData(
  data?: PlaygroundApiResponse['data']
): Set<string> {
  const actionableIds = new Set<string>()
  if (!data) return actionableIds

  for (const set of data.runtime_suggestion_sets || []) {
    for (const candidate of set.candidates || []) {
      if (
        (candidate.status === 'pending_approval' || candidate.status === 'approved') &&
        typeof candidate.approval_id === 'string' &&
        candidate.approval_id.trim()
      ) {
        actionableIds.add(candidate.approval_id.trim())
      }
    }
  }

  for (const cluster of data.runtime_cleanup_plan?.clusters || []) {
    if (
      (cluster.status === 'pending_approval' || cluster.status === 'approved') &&
      typeof cluster.approval_id === 'string' &&
      cluster.approval_id.trim()
    ) {
      actionableIds.add(cluster.approval_id.trim())
    }
  }

  for (const approvalId of data.runtime_approval_queue_summary?.pending_approval_ids || []) {
    if (typeof approvalId === 'string' && approvalId.trim()) {
      actionableIds.add(approvalId.trim())
    }
  }
  for (const approvalId of data.runtime_approval_queue_summary?.approved_approval_ids || []) {
    if (typeof approvalId === 'string' && approvalId.trim()) {
      actionableIds.add(approvalId.trim())
    }
  }

  return actionableIds
}

function getLastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return null
}

function compactRuntimeText(value: string, max = 170): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

type RuntimeStepConsequence = {
  thisStep: string
  inboxChangesNow: string
  afterStep: string
}

type NextActionKind =
  | 'approval_submitted'
  | 'analyze'
  | 'review_sender'
  | 'review_query'
  | 'pending_approval'
  | 'profile_refresh'
  | 'generic'

type NextActionCandidate = {
  id: string
  kind: NextActionKind
  title: string
  detail: string
  ctaLabel: string | null
  onClick: (() => void) | null
  consequence: RuntimeStepConsequence | null
}

type ClusterMakeupEntry = {
  label: string
  count: number
}

type FuturePreventionRecommendation = {
  recommend: boolean
  reason: string
  target: string
  safety: string
}

type SenderPreference = 'keep' | 'neutral' | 'deprioritize'

type EngagementSignalSummary = {
  sampledCount: number
  unreadCount: number
  importantCount: number
  starredCount: number
  repliedHeuristicCount: number
  engagementRisk: 'low' | 'medium' | 'high'
  confidence: 'preliminary' | 'moderate'
  evidenceMode: 'engagement_based' | 'pattern_based'
}

type ArchiveCustomizationState = {
  excludedMessageIds: string[]
  excludedSenderKeys: string[]
  excludedPatternKeys: string[]
}

const SENDER_PREFERENCE_UI: Record<
  SenderPreference,
  {
    label: string
    description: string
    effect: string
  }
> = {
  keep: {
    label: 'Always keep newsletters from this sender',
    description: 'Suppress archive recommendations for this sender in future waves.',
    effect: 'Archive suppressed because this sender is marked Always keep.',
  },
  neutral: {
    label: 'No preference',
    description: 'Use reviewed evidence only.',
    effect: 'No sender preference is applied.',
  },
  deprioritize: {
    label: 'Lower priority (more likely archive candidate)',
    description: 'Increase archive recommendation priority after bounded review.',
    effect: 'Archive priority is increased because this sender is marked Lower priority.',
  },
}

function buildRuntimeStepConsequence(params: {
  mode:
    | 'analyze'
    | 'review_sender'
    | 'review_query'
    | 'pending_approval'
    | 'profile_refresh'
    | 'none'
  title?: string | null
  sender?: string | null
}): RuntimeStepConsequence | null {
  if (params.mode === 'analyze') {
    return {
      thisStep: 'Ask for approval to run bounded inbox metadata analysis (about 25 messages).',
      inboxChangesNow: 'None. This only creates a request.',
      afterStep: 'After approval + execute, analysis evidence appears and the assistant recommends safe review clusters.',
    }
  }

  if (params.mode === 'review_sender') {
    return {
      thisStep: `Ask for approval to preview up to 25 emails from ${params.sender || 'the selected sender'}.`,
      inboxChangesNow: 'None. This only creates a request.',
      afterStep: 'After approval + execute, sender review evidence appears and the assistant proposes safe next actions.',
    }
  }

  if (params.mode === 'review_query') {
    return {
      thisStep: `Ask for approval to preview up to 25 emails for "${params.title || 'this cleanup cluster'}".`,
      inboxChangesNow: 'None. This only creates a request.',
      afterStep: 'After approval + execute, query-review evidence appears; archive still needs a separate later approval.',
    }
  }

  if (params.mode === 'pending_approval') {
    return {
      thisStep: 'Review and resolve the pending approval request.',
      inboxChangesNow: 'None until an approved action is executed.',
      afterStep: 'After your approval decision, the assistant syncs and surfaces the next safe step.',
    }
  }

  if (params.mode === 'profile_refresh') {
    return {
      thisStep: 'Refresh the 30-day mailbox profile to improve strategy quality.',
      inboxChangesNow: 'None. This is analysis-only.',
      afterStep: 'Cleanup suggestions become promotable when profile context is fresh.',
    }
  }

  return null
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

function freshStartKeyForAgent(agentId: string): string {
  return `${PLAYGROUND_FRESH_START_PREFIX}:${agentId}`
}

function clearedChatSessionKeyForAgent(agentId: string): string {
  return `${PLAYGROUND_CLEARED_CHAT_SESSION_PREFIX}:${agentId}`
}

function normalizeRuntimeKey(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

function formatEstimateLabel(value: number | null | undefined, ambiguous: boolean): string {
  if (value == null || !Number.isFinite(value)) return ''
  if (ambiguous) return ' (directional estimate)'
  return ` (~${value})`
}

function toRuntimeTimestamp(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function classifySubjectPattern(subject: string): string {
  const normalized = subject.toLowerCase()
  if (/\b(ship|shipping|delivery|dispatch|tracking)\b/.test(normalized)) return 'Shipping updates'
  if (/\b(invoice|receipt|payment|bill|refund)\b/.test(normalized)) return 'Invoices / receipts'
  if (/\b(newsletter|digest|subscription|unsubscribe|promo|sale|offer|deal)\b/.test(normalized)) {
    return 'Newsletter / promotional'
  }
  if (/\b(alert|verify|verification|otp|security|code)\b/.test(normalized)) return 'Alerts / security'
  if (/\b(order|purchase|confirmation)\b/.test(normalized)) return 'Order confirmations'
  return 'General updates'
}

function summarizeClusterMakeup(params: {
  messages: Array<{ from?: string | null; subject?: string | null }>
  sampleSubjects: string[]
  ambiguityHints: string[]
}): {
  topSenders: ClusterMakeupEntry[]
  topPatterns: ClusterMakeupEntry[]
  homogeneityLabel: string
  ambiguityLabel: string
} {
  const senderCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()
  const totalMessages = Math.max(params.messages.length, params.sampleSubjects.length, 1)

  for (const message of params.messages) {
    const sender = (message.from || '').trim() || 'Unknown sender'
    senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
    const subject = (message.subject || '').trim()
    if (subject) {
      const pattern = classifySubjectPattern(subject)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    }
  }

  if (patternCounts.size === 0) {
    for (const subject of params.sampleSubjects) {
      const normalized = (subject || '').trim()
      if (!normalized) continue
      const pattern = classifySubjectPattern(normalized)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    }
  }

  const topSenders = Array.from(senderCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 4)
  const topPatterns = Array.from(patternCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 4)

  const leadingSenderShare =
    topSenders.length > 0 ? topSenders[0].count / Math.max(1, params.messages.length) : 0
  const leadingPatternShare = topPatterns.length > 0 ? topPatterns[0].count / totalMessages : 0
  const homogeneityLabel =
    leadingSenderShare >= 0.7 || leadingPatternShare >= 0.7
      ? 'Mostly homogeneous'
      : 'Mixed cluster'

  const hintText = params.ambiguityHints.join(' ').toLowerCase()
  const hasAmbiguityHint = /\boverlap|estimate|ambiguous|mixed\b/.test(hintText)
  const ambiguityLabel = hasAmbiguityHint
    ? 'High overlap / ambiguity'
    : leadingPatternShare >= 0.55
      ? 'Low ambiguity'
      : 'Moderate ambiguity'

  return { topSenders, topPatterns, homogeneityLabel, ambiguityLabel }
}

function deriveFuturePreventionRecommendation(params: {
  title: string
  clusterType: string | null
  topSenders: ClusterMakeupEntry[]
  topPatterns: ClusterMakeupEntry[]
  ambiguityLabel: string
}): FuturePreventionRecommendation {
  const normalizedTitle = params.title.toLowerCase()
  const normalizedType = (params.clusterType || '').toLowerCase()
  const topSender = params.topSenders[0]?.label || 'Primary sender in this cluster'
  const lowRiskPattern =
    /\bnewsletter|promotional|transactional|no-reply|notification|updates\b/.test(normalizedTitle) ||
    /\bnewsletter|promotional|transactional|no-reply|notification|updates\b/.test(normalizedType)
  const ambiguous = params.ambiguityLabel.toLowerCase().includes('high')

  if (lowRiskPattern && !ambiguous) {
    return {
      recommend: true,
      reason: 'Recurring low-action-value pattern appears stable and review evidence is consistent.',
      target: topSender,
      safety: 'Safe for supervised rule proposal; keep human review before enabling persistent automation.',
    }
  }

  return {
    recommend: false,
    reason: 'Cluster appears mixed or overlap is high; prioritize another bounded review before proposing a rule.',
    target: topSender,
    safety: 'Needs careful review before any durable filter/rule recommendation.',
  }
}

function senderPreferenceStorageKey(agentId: string): string {
  return `${PLAYGROUND_SENDER_PREFERENCES_PREFIX}:${agentId}`
}

function normalizeSenderIdentity(value: string | null | undefined): string {
  const raw = (value || '').trim().toLowerCase()
  if (!raw) return ''
  const emailMatch = raw.match(/<([^>]+)>/)
  const email = emailMatch?.[1]?.trim().toLowerCase() || raw
  if (!email) return raw
  const atIndex = email.indexOf('@')
  if (atIndex > 0 && atIndex < email.length - 1) return email
  return raw
}

function deriveSenderPreference(
  senderPreferences: Record<string, SenderPreference>,
  sender: string | null | undefined
): SenderPreference {
  const key = normalizeSenderIdentity(sender)
  if (!key) return 'neutral'
  return senderPreferences[key] || 'neutral'
}

function deriveEngagementSignals(
  messages: Array<{
    subject: string | null
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
): EngagementSignalSummary {
  const sampledCount = messages.length
  let unreadCount = 0
  let importantCount = 0
  let starredCount = 0
  let repliedHeuristicCount = 0

  for (const message of messages) {
    if (message.is_unread) unreadCount += 1
    if (message.is_important) importantCount += 1
    if (message.is_starred) starredCount += 1
    if (typeof message.subject === 'string' && /^\s*re:/i.test(message.subject)) {
      repliedHeuristicCount += 1
    }
  }

  const interactionTouches = importantCount + starredCount + repliedHeuristicCount
  const engagementRatio = sampledCount > 0 ? interactionTouches / sampledCount : 0
  const engagementRisk: EngagementSignalSummary['engagementRisk'] =
    engagementRatio >= 0.3 || importantCount > 0 || starredCount > 0
      ? 'high'
      : engagementRatio >= 0.12 || unreadCount > Math.max(1, Math.floor(sampledCount * 0.4))
        ? 'medium'
        : 'low'

  return {
    sampledCount,
    unreadCount,
    importantCount,
    starredCount,
    repliedHeuristicCount,
    engagementRisk,
    confidence: sampledCount >= 12 ? 'moderate' : 'preliminary',
    evidenceMode: sampledCount >= 5 ? 'engagement_based' : 'pattern_based',
  }
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

type AgentExperienceExamples = {
  emptyHint: string
  placeholder: string
}

function deriveAgentExperienceExamples(agentTypeRaw: string | null | undefined): AgentExperienceExamples {
  const agentType = (agentTypeRaw || '').toLowerCase().trim()

  const inboxSignals = /\b(inbox|gmail|email|mailbox|ops|operations|assistant)\b/.test(agentType)
  if (inboxSignals) {
    return {
      emptyHint:
        'Start with an operations prompt (e.g. "Profile my inbox for the last 30 days and suggest the safest first cleanup wave.").',
      placeholder:
        'Example: Build a cleanup strategy from my 30-day mailbox profile and tell me the safest first review cluster.',
    }
  }

  return {
    emptyHint:
      'Start with a task this agent should handle well (e.g. "Give me a structured next-step plan for this request.").',
    placeholder:
      'Example: Review this request and propose the safest next actions with clear assumptions.',
  }
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
  const [runtimeReviewResults, setRuntimeReviewResults] = useState<RuntimeReviewResult[]>([])
  const [runtimeArchiveEvidence, setRuntimeArchiveEvidence] = useState<RuntimeArchiveEvidence | null>(null)
  const [runtimeActiveBatch, setRuntimeActiveBatch] = useState<RuntimeActiveBatch | null>(null)
  const [runtimeBatchSuggestions, setRuntimeBatchSuggestions] = useState<RuntimeBatchSuggestions | null>(null)
  const [runtimeCleanupPlan, setRuntimeCleanupPlan] = useState<RuntimeCleanupPlan | null>(null)
  const [runtimeMailboxProfile, setRuntimeMailboxProfile] = useState<RuntimeMailboxProfile | null>(null)
  const [runtimeCleanupStrategy, setRuntimeCleanupStrategy] = useState<RuntimeCleanupStrategy | null>(null)
  const [runtimeActiveWorkItem, setRuntimeActiveWorkItem] = useState<RuntimeActiveWorkItem | null>(null)
  const [runtimeEvidenceBlocks, setRuntimeEvidenceBlocks] = useState<RuntimeEvidenceBlock[]>([])
  const [runtimeSuggestionSets, setRuntimeSuggestionSets] = useState<RuntimeSuggestionSet[]>([])
  const [runtimeApprovalQueueSummary, setRuntimeApprovalQueueSummary] =
    useState<RuntimeApprovalQueueSummary | null>(null)
  const [approvalSubmitting, setApprovalSubmitting] = useState(false)
  const [createdApprovalId, setCreatedApprovalId] = useState<string | null>(null)
  const [createdApprovalKind, setCreatedApprovalKind] = useState<RuntimeProposalKind | null>(null)
  const [runtimeRehydrating, setRuntimeRehydrating] = useState(false)
  const [showRuntimeSyncIndicator, setShowRuntimeSyncIndicator] = useState(false)
  const [showAllCleanupClusters, setShowAllCleanupClusters] = useState(false)
  const [declinedStepKeys, setDeclinedStepKeys] = useState<string[]>([])
  const [skippedStepHistory, setSkippedStepHistory] = useState<string[]>([])
  const [preferredStepId, setPreferredStepId] = useState<string | null>(null)
  const [alternateStepHint, setAlternateStepHint] = useState<string | null>(null)
  const [conversationResetting, setConversationResetting] = useState(false)
  const [freshStartMode, setFreshStartMode] = useState(false)
  const [clearedChatSessionId, setClearedChatSessionId] = useState<string | null>(null)
  const [clearedSessionApprovalContext, setClearedSessionApprovalContext] =
    useState<ClearedSessionApprovalContext | null>(null)
  const [authoritativeQueueSyncPending, setAuthoritativeQueueSyncPending] = useState(false)
  const [senderPreferences, setSenderPreferences] = useState<Record<string, SenderPreference>>({})
  const [archiveCustomizationByResult, setArchiveCustomizationByResult] = useState<
    Record<string, ArchiveCustomizationState>
  >({})
  const storageReadyRef = useRef(false)
  const rehydrateInFlightRef = useRef(false)
  const lastRehydrateAtRef = useRef(0)
  const messagesRef = useRef<ChatMessage[]>([])
  const sessionIdRef = useRef<string | null>(null)
  const loadedAgentIdRef = useRef<string | null>(null)
  const freshStartModeRef = useRef(false)
  const clearSuppressUntilRef = useRef(0)
  const lastTriggerAtRef = useRef<Partial<Record<RuntimeRehydrateTrigger, number>>>({})
  const mountRehydrateKeyRef = useRef<string | null>(null)
  const runtimeRefreshHandledRef = useRef(false)
  const runtimeSyncTimerRef = useRef<number | null>(null)
  const createdApprovalIdRef = useRef<string | null>(null)
  const optimisticApprovalCreatedAtRef = useRef(0)
  const approvalsNavInFlightRef = useRef(false)
  const runtimeStateEpochRef = useRef(0)
  const hasRuntimeStateRef = useRef(false)
  const sendingRef = useRef(false)
  const conversationResettingRef = useRef(false)
  const clearedChatSessionIdRef = useRef<string | null>(null)

  const runtimeRefreshRequested = searchParams.get('runtime_refresh') === '1'
  const showRuntimeDebugMode = process.env.NODE_ENV !== 'production' && searchParams.get('debug') === '1'
  const requestedSessionId = (() => {
    const value = searchParams.get(PLAYGROUND_SESSION_QUERY_PARAM)
    return value && value.trim() ? value.trim() : null
  })()

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const agentId = agent?.id
    if (!agentId) return
    const raw = readPersistedState(senderPreferenceStorageKey(agentId))
    if (!raw) {
      setSenderPreferences({})
      return
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, SenderPreference>
      if (!parsed || typeof parsed !== 'object') {
        setSenderPreferences({})
        return
      }
      const normalized: Record<string, SenderPreference> = {}
      for (const [key, value] of Object.entries(parsed)) {
        if (!key.trim()) continue
        if (value === 'keep' || value === 'neutral' || value === 'deprioritize') {
          normalized[key] = value
        }
      }
      setSenderPreferences(normalized)
    } catch {
      setSenderPreferences({})
    }
  }, [agent?.id])

  useEffect(() => {
    const agentId = agent?.id
    if (!agentId) return
    writePersistedState(senderPreferenceStorageKey(agentId), JSON.stringify(senderPreferences))
  }, [agent?.id, senderPreferences])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    createdApprovalIdRef.current = createdApprovalId
    if (!createdApprovalId) {
      optimisticApprovalCreatedAtRef.current = 0
    }
  }, [createdApprovalId])

  useEffect(() => {
    hasRuntimeStateRef.current = Boolean(
      runtimeProposal ||
        runtimeEvidence ||
        runtimeRecommendation ||
        runtimeReviewProposal ||
        runtimeReviewEvidence ||
        runtimeQueryReviewEvidence ||
        runtimeReviewResults.length > 0 ||
        runtimeArchiveEvidence ||
        runtimeActiveBatch ||
        runtimeBatchSuggestions ||
        runtimeCleanupPlan ||
        runtimeMailboxProfile ||
        runtimeCleanupStrategy ||
        runtimeActiveWorkItem ||
        runtimeEvidenceBlocks.length > 0 ||
        runtimeSuggestionSets.length > 0 ||
        runtimeApprovalQueueSummary ||
        createdApprovalId
    )
  }, [
    createdApprovalId,
    runtimeActiveBatch,
    runtimeActiveWorkItem,
    runtimeArchiveEvidence,
    runtimeBatchSuggestions,
    runtimeCleanupPlan,
    runtimeMailboxProfile,
    runtimeCleanupStrategy,
    runtimeEvidence,
    runtimeEvidenceBlocks,
    runtimeProposal,
    runtimeRecommendation,
    runtimeReviewEvidence,
    runtimeQueryReviewEvidence,
    runtimeReviewResults,
    runtimeReviewProposal,
    runtimeSuggestionSets,
    runtimeApprovalQueueSummary,
  ])

  useEffect(() => {
    freshStartModeRef.current = freshStartMode
  }, [freshStartMode])

  useEffect(() => {
    sendingRef.current = sending
  }, [sending])

  useEffect(() => {
    conversationResettingRef.current = conversationResetting
  }, [conversationResetting])

  useEffect(() => {
    clearedChatSessionIdRef.current = clearedChatSessionId
  }, [clearedChatSessionId])

  useEffect(() => {
    if (!runtimeRehydrating) {
      if (runtimeSyncTimerRef.current) {
        window.clearTimeout(runtimeSyncTimerRef.current)
        runtimeSyncTimerRef.current = null
      }
      if (showRuntimeSyncIndicator) {
        setShowRuntimeSyncIndicator(false)
      }
      return
    }

    runtimeSyncTimerRef.current = window.setTimeout(() => {
      setShowRuntimeSyncIndicator(true)
    }, REHYDRATE_SYNC_INDICATOR_DELAY_MS)

    return () => {
      if (runtimeSyncTimerRef.current) {
        window.clearTimeout(runtimeSyncTimerRef.current)
        runtimeSyncTimerRef.current = null
      }
    }
  }, [runtimeRehydrating, showRuntimeSyncIndicator])

  const applyRuntimeData = useCallback((data?: PlaygroundApiResponse['data']) => {
    if (!data) return
    setRuntimeProposal(data.runtime_proposal ?? null)
    setRuntimeEvidence(data.runtime_evidence ?? null)
    setRuntimeRecommendation(data.runtime_recommendation ?? null)
    setRuntimeReviewProposal(data.runtime_review_proposal ?? null)
    setRuntimeReviewEvidence(data.runtime_review_evidence ?? null)
    setRuntimeQueryReviewEvidence(data.runtime_query_review_evidence ?? null)
    setRuntimeReviewResults(
      Array.isArray(data.runtime_review_results) ? data.runtime_review_results : []
    )
    setRuntimeArchiveEvidence(data.runtime_archive_evidence ?? null)
    setRuntimeActiveBatch(data.runtime_active_batch ?? null)
    setRuntimeBatchSuggestions(data.runtime_batch_suggestions ?? null)
    if ('runtime_cleanup_plan' in data) {
      setRuntimeCleanupPlan(data.runtime_cleanup_plan ?? null)
    }
    if ('runtime_mailbox_profile' in data) {
      setRuntimeMailboxProfile(data.runtime_mailbox_profile ?? null)
    }
    if ('runtime_cleanup_strategy' in data) {
      setRuntimeCleanupStrategy(data.runtime_cleanup_strategy ?? null)
    }
    setRuntimeActiveWorkItem(data.runtime_active_work_item ?? null)
    setRuntimeEvidenceBlocks(
      Array.isArray(data.runtime_evidence_blocks) ? data.runtime_evidence_blocks : []
    )
    setRuntimeSuggestionSets(
      Array.isArray(data.runtime_suggestion_sets) ? data.runtime_suggestion_sets : []
    )
    if ('runtime_approval_queue_summary' in data) {
      const nextSummary = data.runtime_approval_queue_summary ?? null
      setRuntimeApprovalQueueSummary(nextSummary)
      if (nextSummary) {
        setClearedSessionApprovalContext((prev) => {
          if (!prev) return prev
          const summarySessionId = nextSummary.scope_session_id || null
          if (summarySessionId && summarySessionId === prev.session_id) {
            if (nextSummary.pending <= 0 && nextSummary.approved <= 0) return null
            return prev
          }
          if (!summarySessionId && nextSummary.scope === 'agent' && nextSummary.pending <= 0 && nextSummary.approved <= 0) {
            return null
          }
          return prev
        })
      }
    }
    if (typeof data.session_id === 'string' && data.session_id.trim()) {
      const nextSessionId = data.session_id.trim()
      sessionIdRef.current = nextSessionId
      setSessionId((prev) => (prev === nextSessionId ? prev : nextSessionId))
    }
  }, [])

  const clearRuntimeState = useCallback(() => {
    sessionIdRef.current = null
    createdApprovalIdRef.current = null
    optimisticApprovalCreatedAtRef.current = 0
    setSessionId(null)
    setRuntimeProposal(null)
    setRuntimeEvidence(null)
    setRuntimeRecommendation(null)
    setRuntimeReviewProposal(null)
    setRuntimeReviewEvidence(null)
    setRuntimeQueryReviewEvidence(null)
    setRuntimeReviewResults([])
    setRuntimeArchiveEvidence(null)
    setRuntimeActiveBatch(null)
    setRuntimeBatchSuggestions(null)
    setRuntimeCleanupPlan(null)
    setRuntimeMailboxProfile(null)
    setRuntimeCleanupStrategy(null)
    setRuntimeActiveWorkItem(null)
    setRuntimeEvidenceBlocks([])
    setRuntimeSuggestionSets([])
    setRuntimeApprovalQueueSummary(null)
    setCreatedApprovalId(null)
    setCreatedApprovalKind(null)
    setShowAllCleanupClusters(false)
    setDeclinedStepKeys([])
    setSkippedStepHistory([])
    setPreferredStepId(null)
    setAlternateStepHint(null)
    setClearedSessionApprovalContext(null)
    setAuthoritativeQueueSyncPending(false)
  }, [])

  const reconcileOptimisticApprovalState = useCallback(
    (data: PlaygroundApiResponse['data'] | undefined, trigger: RuntimeRehydrateTrigger) => {
      const actionableApprovalIds = getActionableApprovalIdsFromRuntimeData(data)
      const optimisticApprovalId = createdApprovalIdRef.current

      if (
        optimisticApprovalId &&
        !actionableApprovalIds.has(optimisticApprovalId)
      ) {
        const optimisticAgeMs =
          optimisticApprovalCreatedAtRef.current > 0
            ? Date.now() - optimisticApprovalCreatedAtRef.current
            : Infinity
        const shouldHoldOptimistic =
          (trigger === 'post-submit' || trigger === 'poll' || trigger === 'focus') &&
          optimisticAgeMs < OPTIMISTIC_APPROVAL_HOLD_MS
        if (shouldHoldOptimistic) {
          return
        }
        logSessionDecision('approval_reconciled_cleared', {
          approval_id: optimisticApprovalId,
          trigger,
          actionable_pending_count: actionableApprovalIds.size,
        })
        createdApprovalIdRef.current = null
        setCreatedApprovalId(null)
        setCreatedApprovalKind(null)
      }

      if (trigger === 'runtime_refresh' && actionableApprovalIds.size === 0) {
        logSessionDecision('runtime_refresh_no_pending_blockers')
      }
      if (trigger === 'runtime_refresh') {
        setAuthoritativeQueueSyncPending(false)
      }
    },
    []
  )

  const rehydrateRuntimeState = useCallback(
    async (opts?: {
      sessionIdOverride?: string | null
      messagesOverride?: ChatMessage[]
      force?: boolean
      trigger?: RuntimeRehydrateTrigger
      refreshMailboxProfile?: boolean
      mailboxProfileWindowDays?: 30 | 60
    }) => {
      const trigger = opts?.trigger || 'mount'
      const requestEpoch = runtimeStateEpochRef.current
      const targetSessionId = opts?.sessionIdOverride ?? sessionIdRef.current ?? null
      if (!agent?.id) {
        logRehydrateTrace({ trigger, decision: 'skip', reason: 'no_agent', sessionId: targetSessionId })
        return
      }
      if (rehydrateInFlightRef.current) {
        logRehydrateTrace({ trigger, decision: 'skip', reason: 'in_flight', sessionId: targetSessionId })
        return
      }
      const now = Date.now()
      if (!opts?.force && now < clearSuppressUntilRef.current) {
        logRehydrateTrace({ trigger, decision: 'skip', reason: 'clear_cooldown', sessionId: targetSessionId })
        return
      }
      if (!opts?.force && now - lastRehydrateAtRef.current < REHYDRATE_MIN_GAP_MS) {
        logRehydrateTrace({ trigger, decision: 'skip', reason: 'global_cooldown', sessionId: targetSessionId })
        return
      }
      if (!opts?.force) {
        const sinceTrigger = now - (lastTriggerAtRef.current[trigger] || 0)
        if (sinceTrigger < (REHYDRATE_TRIGGER_MIN_GAP_MS[trigger] || REHYDRATE_MIN_GAP_MS)) {
          logRehydrateTrace({ trigger, decision: 'skip', reason: 'trigger_cooldown', sessionId: targetSessionId })
          return
        }
      }

      logRehydrateTrace({
        trigger,
        decision: 'allow',
        reason: opts?.force ? 'forced' : 'cooldown_ok',
        sessionId: targetSessionId,
      })

      rehydrateInFlightRef.current = true
      lastRehydrateAtRef.current = now
      lastTriggerAtRef.current[trigger] = now
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
            refresh_mailbox_profile: opts?.refreshMailboxProfile === true,
            mailbox_profile_window_days: opts?.mailboxProfileWindowDays ?? 30,
          }),
        })

        const data = (await res.json().catch(() => ({}))) as PlaygroundApiResponse
        if (requestEpoch !== runtimeStateEpochRef.current) {
          return
        }
        if (!res.ok || !data?.ok) return
        const serverSessionMessages = Array.isArray(data.data?.session_messages)
          ? data.data.session_messages
              .filter(
                (message): message is ChatMessage =>
                  !!message &&
                  (message.role === 'user' || message.role === 'assistant') &&
                  typeof message.content === 'string'
              )
              .slice(-PERSISTED_MESSAGE_LIMIT)
          : []
        const shouldApplyServerMessages =
          serverSessionMessages.length > 0 &&
          normalizeRuntimeKey(clearedChatSessionIdRef.current) !== normalizeRuntimeKey(targetSessionId) &&
          (trigger === 'runtime_refresh' ||
            trigger === 'mount' ||
            (!sendingRef.current &&
              !conversationResettingRef.current &&
              !freshStartModeRef.current &&
              messagesRef.current.length === 0))

        if (shouldApplyServerMessages) {
          messagesRef.current = serverSessionMessages
          setMessages((prev) =>
            JSON.stringify(prev) === JSON.stringify(serverSessionMessages)
              ? prev
              : serverSessionMessages
          )
        }
        applyRuntimeData(data.data)
        reconcileOptimisticApprovalState(data.data, trigger)
      } catch (err) {
        console.warn('[playground] runtime rehydrate failed (non-fatal):', err)
      } finally {
        rehydrateInFlightRef.current = false
        setRuntimeRehydrating(false)
        if (trigger === 'runtime_refresh') {
          setAuthoritativeQueueSyncPending(false)
        }
      }
    },
    [agent?.id, applyRuntimeData, reconcileOptimisticApprovalState]
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
            mountRehydrateKeyRef.current = null
            runtimeRefreshHandledRef.current = false
            lastTriggerAtRef.current = {}
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
    const freshStartStorageKey = freshStartKeyForAgent(agent.id)
    const clearedChatSessionKey = clearedChatSessionKeyForAgent(agent.id)
    const draftKey = draftStorageKeyForAgent(agent.id)
    const freshStartValue = readSessionStorageValue(freshStartStorageKey)
    const clearedChatSessionValue = readSessionStorageValue(clearedChatSessionKey)
    const restoredClearedChatSessionId =
      typeof clearedChatSessionValue === 'string' && clearedChatSessionValue.trim()
        ? clearedChatSessionValue.trim()
        : null
    setClearedChatSessionId(restoredClearedChatSessionId)
    const sessionIdFromActiveStorageRaw = readSessionStorageValue(activeSessionKey)
    const sessionIdFromActiveStorage =
      typeof sessionIdFromActiveStorageRaw === 'string' && sessionIdFromActiveStorageRaw.trim()
        ? sessionIdFromActiveStorageRaw.trim()
        : null
    const shouldStartFresh =
      freshStartValue === '1' && !requestedSessionId && !sessionIdFromActiveStorage
    const preferredSessionId = requestedSessionId || sessionIdFromActiveStorage
    const persistedSessionState =
      preferredSessionId && preferredSessionId.trim()
        ? parsePersistedState(readPersistedState(sessionStorageKeyForAgent(agent.id, preferredSessionId)))
        : null
    const persistedDraftState = parsePersistedState(readSessionStorageValue(draftKey))
    const restoreSource = persistedSessionState ? 'session' : persistedDraftState ? 'draft' : null
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
    const canRestorePersistedMessages =
      normalizeRuntimeKey(restoredClearedChatSessionId) === '' ||
      normalizeRuntimeKey(restoredClearedChatSessionId) !== normalizeRuntimeKey(restoredSessionId)
    const persistedMessagesForRestore = canRestorePersistedMessages ? restoredMessages : []
    if (shouldStartFresh) {
      if (messagesRef.current.length > 0) {
        logSessionDecision('skipped_restore_due_to_fresh_start', {
          reason: 'active_messages_present',
          message_count: messagesRef.current.length,
        })
        storageReadyRef.current = true
        return
      }
      logSessionDecision('fresh_start_applied', {
        agent_id: agent.id,
        had_session_restore: Boolean(persistedSessionState),
        had_draft_restore: Boolean(persistedDraftState),
      })
      messagesRef.current = []
      setMessages([])
      setFreshStartMode(false)
      removeSessionStorageValue(freshStartStorageKey)
      mountRehydrateKeyRef.current = `fresh:${agent.id}`
      storageReadyRef.current = true
      return
    }

    if (persisted) {
      if (restoreSource === 'session') {
        logSessionDecision('restore_from_session', {
          session_id: restoredSessionId,
          message_count: persistedMessagesForRestore.length,
        })
      } else {
        logSessionDecision('restore_from_draft', {
          message_count: persistedMessagesForRestore.length,
        })
      }
      messagesRef.current = persistedMessagesForRestore
      sessionIdRef.current = restoredSessionId
      setDeclinedStepKeys([])
      setAlternateStepHint(null)
      setMessages(persistedMessagesForRestore)
      setSessionId(restoredSessionId)
      setRuntimeProposal(persisted.runtime_proposal ?? null)
      setRuntimeEvidence(persisted.runtime_evidence ?? null)
      setRuntimeRecommendation(persisted.runtime_recommendation ?? null)
      setRuntimeReviewProposal(persisted.runtime_review_proposal ?? null)
      setRuntimeReviewEvidence(persisted.runtime_review_evidence ?? null)
      setRuntimeQueryReviewEvidence(persisted.runtime_query_review_evidence ?? null)
      setRuntimeReviewResults(
        Array.isArray(persisted.runtime_review_results) ? persisted.runtime_review_results : []
      )
      setRuntimeArchiveEvidence(persisted.runtime_archive_evidence ?? null)
      setRuntimeActiveBatch(persisted.runtime_active_batch ?? null)
      setRuntimeBatchSuggestions(persisted.runtime_batch_suggestions ?? null)
      setRuntimeCleanupPlan(persisted.runtime_cleanup_plan ?? null)
      setRuntimeMailboxProfile(persisted.runtime_mailbox_profile ?? null)
      setRuntimeCleanupStrategy(persisted.runtime_cleanup_strategy ?? null)
      setRuntimeActiveWorkItem(persisted.runtime_active_work_item ?? null)
      setRuntimeEvidenceBlocks(
        Array.isArray(persisted.runtime_evidence_blocks) ? persisted.runtime_evidence_blocks : []
      )
      setRuntimeSuggestionSets(
        Array.isArray(persisted.runtime_suggestion_sets) ? persisted.runtime_suggestion_sets : []
      )
      setRuntimeApprovalQueueSummary(persisted.runtime_approval_queue_summary ?? null)
      setCreatedApprovalId(persisted.created_approval_id ?? null)
      setCreatedApprovalKind(persisted.created_approval_kind ?? null)
    } else {
      if (freshStartValue === '1') {
        logSessionDecision('skipped_restore_due_to_fresh_start', {
          reason: 'session_context_present',
          requested_session_id: requestedSessionId,
          active_session_id: sessionIdFromActiveStorage,
        })
      }
      if (requestedSessionId && requestedSessionId !== sessionIdRef.current) {
        sessionIdRef.current = requestedSessionId
        setSessionId((prev) => (prev === requestedSessionId ? prev : requestedSessionId))
      }
    }

    if (runtimeRefreshRequested) {
      logSessionDecision('return_from_approvals_restore', {
        source: restoreSource || 'runtime_refresh_only',
        session_id: requestedSessionId || sessionIdFromActiveStorage || sessionIdRef.current || null,
      })
    }

    setFreshStartMode(false)
    storageReadyRef.current = true
    const rehydrateSessionId = restoredSessionId || sessionIdRef.current
    const rehydrateMessages = persisted ? persistedMessagesForRestore : messagesRef.current
    const hasRehydrateContext =
      Boolean(rehydrateSessionId) || rehydrateMessages.length > 0 || runtimeRefreshRequested
    if (!hasRehydrateContext) {
      return
    }
    const mountRehydrateKey = `${agent.id}:${rehydrateSessionId || 'none'}:${requestedSessionId || 'none'}`
    if (mountRehydrateKeyRef.current === mountRehydrateKey) return
    mountRehydrateKeyRef.current = mountRehydrateKey
    if (runtimeRefreshRequested) return
    void rehydrateRuntimeState({
      sessionIdOverride: rehydrateSessionId,
      messagesOverride: rehydrateMessages,
      force: true,
      trigger: 'mount',
    })
  }, [agent?.id, rehydrateRuntimeState, requestedSessionId, runtimeRefreshRequested])

  useEffect(() => {
    if (!agent?.id) return
    if (!freshStartMode) {
      removeSessionStorageValue(freshStartKeyForAgent(agent.id))
      return
    }
    writeSessionStorageValue(freshStartKeyForAgent(agent.id), '1')
  }, [agent?.id, freshStartMode])

  useEffect(() => {
    if (!agent?.id || !storageReadyRef.current) return

    const draftKey = draftStorageKeyForAgent(agent.id)
    const activeSessionKey = activeSessionKeyForAgent(agent.id)
    const hasPersistableRuntimeState = Boolean(
      runtimeProposal ||
        runtimeEvidence ||
        runtimeRecommendation ||
        runtimeReviewProposal ||
        runtimeReviewEvidence ||
        runtimeQueryReviewEvidence ||
        runtimeReviewResults.length > 0 ||
        runtimeArchiveEvidence ||
        runtimeActiveBatch ||
        runtimeBatchSuggestions ||
        runtimeCleanupPlan ||
        runtimeMailboxProfile ||
        runtimeCleanupStrategy ||
        runtimeActiveWorkItem ||
        runtimeEvidenceBlocks.length > 0 ||
        runtimeSuggestionSets.length > 0 ||
        runtimeApprovalQueueSummary ||
        createdApprovalId
    )

    if (freshStartMode && messages.length === 0 && !sessionId && !hasPersistableRuntimeState) {
      removePersistedState(draftKey)
      removeSessionStorageValue(activeSessionKey)
      return
    }

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
      runtime_review_results: runtimeReviewResults,
      runtime_archive_evidence: runtimeArchiveEvidence,
      runtime_active_batch: runtimeActiveBatch,
      runtime_batch_suggestions: runtimeBatchSuggestions,
      runtime_cleanup_plan: runtimeCleanupPlan,
      runtime_mailbox_profile: runtimeMailboxProfile,
      runtime_cleanup_strategy: runtimeCleanupStrategy,
      runtime_active_work_item: runtimeActiveWorkItem,
      runtime_evidence_blocks: runtimeEvidenceBlocks,
      runtime_suggestion_sets: runtimeSuggestionSets,
      runtime_approval_queue_summary: runtimeApprovalQueueSummary,
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
    freshStartMode,
    messages,
    runtimeActiveBatch,
    runtimeActiveWorkItem,
    runtimeArchiveEvidence,
    runtimeBatchSuggestions,
    runtimeCleanupPlan,
    runtimeMailboxProfile,
    runtimeCleanupStrategy,
    runtimeEvidence,
    runtimeEvidenceBlocks,
    runtimeApprovalQueueSummary,
    runtimeProposal,
    runtimeRecommendation,
    runtimeReviewEvidence,
    runtimeQueryReviewEvidence,
    runtimeReviewResults,
    runtimeReviewProposal,
    runtimeSuggestionSets,
    sessionId,
  ])

  useEffect(() => {
    if (!agent?.id) return
    if (!runtimeRefreshRequested) {
      runtimeRefreshHandledRef.current = false
      return
    }
    if (runtimeRefreshHandledRef.current) return
    runtimeRefreshHandledRef.current = true

    if (createdApprovalIdRef.current) {
      createdApprovalIdRef.current = null
      setCreatedApprovalId(null)
      setCreatedApprovalKind(null)
    }

    if (!freshStartMode) {
      setAuthoritativeQueueSyncPending(true)
      setRuntimeApprovalQueueSummary(null)
      void rehydrateRuntimeState({ force: true, trigger: 'runtime_refresh' })
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('runtime_refresh')
      router.replace(`${url.pathname}${url.search}${url.hash}`)
    }
  }, [agent?.id, freshStartMode, rehydrateRuntimeState, router, runtimeRefreshRequested])

  useEffect(() => {
    if (runtimeCleanupPlan) return
    setShowAllCleanupClusters(false)
  }, [runtimeCleanupPlan])

  useEffect(() => {
    if (!agent?.id) return

    const canRehydrateFromUiContext = () =>
      Boolean(sessionIdRef.current) ||
      messagesRef.current.length > 0 ||
      hasRuntimeStateRef.current

    const handleFocus = () => {
      if (!canRehydrateFromUiContext()) return
      void rehydrateRuntimeState({ trigger: 'focus' })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (!canRehydrateFromUiContext()) return
      void rehydrateRuntimeState({ trigger: 'visibility' })
    }

      window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [agent?.id, rehydrateRuntimeState])

  const hasInFlightLifecycle = runtimeApprovalQueueSummary
    ? runtimeApprovalQueueSummary.pending > 0 || runtimeApprovalQueueSummary.approved > 0
    : runtimeSuggestionSets.some((set) =>
        set.candidates.some(
          (candidate) => candidate.status === 'pending_approval' || candidate.status === 'approved'
        )
      ) ||
      (runtimeCleanupPlan?.clusters || []).some(
        (cluster) => cluster.status === 'pending_approval' || cluster.status === 'approved'
      )

  useEffect(() => {
    if (!agent?.id || !hasInFlightLifecycle || freshStartMode) return

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void rehydrateRuntimeState({ trigger: 'poll' })
    }, REHYDRATE_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [agent?.id, freshStartMode, hasInFlightLifecycle, rehydrateRuntimeState])

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
          session_id: sessionIdRef.current || undefined,
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
      createdApprovalIdRef.current = approvalId
      optimisticApprovalCreatedAtRef.current = Date.now()
      setCreatedApprovalKind(params.kind)
      setRuntimeApprovalQueueSummary((prev) => {
        const scopedSessionId = sessionIdRef.current || undefined
        if (!prev) {
          return {
            pending: 1,
            approved: 0,
            executed: 0,
            rejected: 0,
            pending_approval_ids: [approvalId],
            approved_approval_ids: [],
            scope: scopedSessionId ? 'session' : 'agent',
            ...(scopedSessionId ? { scope_session_id: scopedSessionId } : {}),
          }
        }
        if (
          prev.pending_approval_ids.includes(approvalId) ||
          prev.approved_approval_ids.includes(approvalId)
        ) {
          return prev
        }
        return {
          ...prev,
          pending: prev.pending + 1,
          pending_approval_ids: [...prev.pending_approval_ids, approvalId],
        }
      })
      setClearedSessionApprovalContext(null)
      const firstAction = params.proposedActions[0]
      if (
        firstAction?.tool === 'gmail' &&
        firstAction?.action === 'review_query_cluster' &&
        firstAction.args &&
        typeof firstAction.args === 'object' &&
        'cluster_id' in (firstAction.args as Record<string, unknown>) &&
        typeof (firstAction.args as Record<string, unknown>).cluster_id === 'string'
      ) {
        const clusterId = ((firstAction.args as Record<string, unknown>).cluster_id as string).trim()
        if (clusterId) {
          updateCleanupClusterStatus({
            clusterId,
            status: 'pending_approval',
            approvalId,
          })
        }
      }
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

    const sampleMessages = runtimeReviewEvidence?.sender_review.messages.slice(0, 5) || []
    const sampleSize = runtimeReviewEvidence?.sender_review.fetched_count || Math.min(25, sampleMessages.length || 25)
    const sender = runtimeReviewProposal.proposed_actions[0]?.args?.sender || null
    const batchTitle = runtimeReviewProposal.proposed_actions[0]?.args?.batch_title || null

    await submitRuntimePlanProposal({
      userRequest: runtimeReviewProposal.user_request,
      proposedActions: runtimeReviewProposal.proposed_actions.map((action) => ({
        tool: action.tool,
        action: action.action,
        args: {
          ...(typeof action.args === 'object' && action.args !== null
            ? (action.args as Record<string, unknown>)
            : {}),
          sample_messages: sampleMessages,
          sample_size: sampleSize,
          source_label: batchTitle || (sender ? `${sender} sender cluster` : 'Sender cluster'),
          selection_basis: runtimeReviewProposal.reason,
          risk_level: 'low',
          safe_signals: ['Transactional', 'Already reviewed', 'No reply needed', 'Archive only', 'Reversible'],
          safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
        },
      })),
      kind: 'gmail.review_sender_cluster',
    })
  }

  async function submitAdHocRuntimeSenderReview(sender: string, count: number) {
    if (!sender || approvalSubmitting) return
    const batchTitle = `Batch: ${sender} review`
    await submitRuntimePlanProposal({
      userRequest: `Review sender cluster before cleanup actions: ${sender}.`,
      proposedActions: [
        {
          tool: 'gmail',
          action: 'review_sender_cluster',
          args: {
            sender,
            count,
            batch_title: batchTitle,
            source_label: `${sender} sender cluster`,
            selection_basis: `Sender recurrence detected for ${sender}; review before cleanup.`,
            risk_level: 'low',
            safe_signals: ['Sender-cluster review', 'No inbox changes yet', 'Reversible'],
            safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
          },
        },
      ],
      kind: 'gmail.review_sender_cluster',
    })
  }

  async function submitRuntimeBatchSuggestionProposal(kind: RuntimeBatchSuggestionKind) {
    if (!effectiveRuntimeBatchSuggestions || !runtimeActiveBatch || approvalSubmitting) return
    if (runtimeMailboxProfile?.analysis_window_days !== 30) {
      alert('Refresh mailbox profile (30-day window) before proposing cleanup approvals.')
      return
    }

    const currentState = batchSuggestionStateByKind[kind]?.status || 'ready'
    if (currentState !== 'ready') return

    const candidates = effectiveRuntimeBatchSuggestions[kind]
    if (!Array.isArray(candidates) || candidates.length === 0) return
    if (kind === 'archive_candidates' && archiveRecommendationBlockedByPreference) {
      alert('Archive request is blocked because this sender is marked Always keep.')
      return
    }
    if (kind === 'archive_candidates' && reviewEngagementSignals.engagementRisk === 'high') {
      alert('Archive request is blocked because engagement signals are high in this reviewed sample.')
      return
    }

    const messageIds =
      kind === 'archive_candidates' ? selectedArchiveMessageIds : candidates.map((candidate) => candidate.message_id)
    if (kind === 'archive_candidates' && messageIds.length === 0) {
      alert('No messages are currently selected for archive. Adjust exclusions before submitting.')
      return
    }
    const reviewMessages = runtimeReviewEvidence?.sender_review.messages.slice(0, 5) || []
    const archiveSafeSignals = [
      'Review evidence available',
      reviewEngagementSignals.evidenceMode === 'engagement_based'
        ? `Engagement-based sample (${reviewEngagementSignals.sampledCount})`
        : 'Pattern-based sample',
      reviewEngagementSignals.starredCount > 0
        ? `${reviewEngagementSignals.starredCount} starred in sample`
        : 'No starred in sample',
      reviewEngagementSignals.importantCount > 0
        ? `${reviewEngagementSignals.importantCount} important in sample`
        : 'No important in sample',
      reviewEngagementSignals.repliedHeuristicCount > 0
        ? `${reviewEngagementSignals.repliedHeuristicCount} reply-like subjects`
        : 'No reply-like subjects',
      `Confidence: ${reviewEngagementSignals.confidence}`,
    ]
    const archiveSafetyExclusions = [
      'No delete',
      'No unsubscribe',
      'No sender blocking',
      'No starred/important override',
      activeBatchSenderPreference === 'keep'
        ? 'Sender marked Always keep'
        : 'Sender preference does not block archive',
    ]

    const sharedArgs = {
      sender: runtimeActiveBatch.sender,
      batch_title: runtimeActiveBatch.batch_title,
      message_ids: messageIds,
      sample_messages: reviewMessages,
      sample_size:
        runtimeReviewEvidence?.sender_review.messages.length || Math.min(5, Math.max(1, messageIds.length)),
      source_label: runtimeActiveBatch.batch_title || `${runtimeActiveBatch.sender} reviewed batch`,
      selection_basis:
        `Selected from reviewed batch ${runtimeActiveBatch.batch_title} using runtime suggestion heuristics. ` +
        `Evidence mode: ${reviewEngagementSignals.evidenceMode}. Engagement risk: ${reviewEngagementSignals.engagementRisk}.`,
      risk_level: reviewEngagementSignals.engagementRisk === 'medium' ? 'medium' : 'low',
      safe_signals:
        kind === 'archive_candidates'
          ? archiveSafeSignals
          : ['Review evidence available', 'No inbox changes yet', 'Reversible'],
      safety_exclusions:
        kind === 'archive_candidates'
          ? archiveSafetyExclusions
          : ['No delete', 'No unsubscribe', 'No sender blocking'],
      engagement_summary: reviewEngagementSignals,
      sender_preference: activeBatchSenderPreference,
      selection_customization:
        kind === 'archive_candidates'
          ? {
              reviewed_count: currentReviewFetchedCount,
              candidate_count: archiveCandidateIdsRaw.length,
              selected_count: messageIds.length,
              excluded_count: excludedArchiveCount,
              excluded_senders: excludedArchiveSenders,
              excluded_sender_keys: Array.from(archiveExcludedByManualSenderKeys),
              excluded_pattern_keys: Array.from(archiveExcludedByManualPatternKeys),
              selected_message_ids: messageIds,
              excluded_message_ids: Array.from(archiveExcludedMessageIds),
              basis: 'reviewed_result_customization',
            }
          : undefined,
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

  async function submitRuntimeCleanupClusterProposal(cluster: RuntimeCleanupPlanCluster) {
    if (approvalSubmitting || cluster.status !== 'ready') return

    await submitRuntimePlanProposal({
      userRequest: `Review query-backed cleanup cluster: ${cluster.title}.`,
      proposedActions: [
        {
          tool: cluster.proposed_action.tool,
          action: cluster.proposed_action.action,
          args: {
            ...cluster.proposed_action.args,
            sample_messages: cluster.sample_preview.slice(0, 5),
            sample_size: cluster.sample_preview.length,
            source_label: cluster.title,
            selection_basis: cluster.why_selected,
            risk_level: 'low',
            safe_signals: ['Query-backed', 'Already reviewed', 'No inbox changes yet', 'Reversible'],
            safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
          },
        },
      ],
      kind: `${cluster.proposed_action.tool}.${cluster.proposed_action.action}`,
    })
  }

  function openApprovals() {
    const agentId = agent?.id
    if (!agentId) return
    if (approvalsNavInFlightRef.current) return
    approvalsNavInFlightRef.current = true
    window.setTimeout(() => {
      approvalsNavInFlightRef.current = false
    }, 1200)

    if (typeof window === 'undefined') {
      router.push('/approvals')
      return
    }

    const current = new URL(window.location.href)
    current.searchParams.delete('runtime_refresh')
    const currentSessionId = sessionIdRef.current || clearedSessionApprovalContext?.session_id || null
    if (currentSessionId && currentSessionId.trim()) {
      current.searchParams.set(PLAYGROUND_SESSION_QUERY_PARAM, currentSessionId.trim())
    } else {
      current.searchParams.delete(PLAYGROUND_SESSION_QUERY_PARAM)
    }
    const returnTo = `${current.pathname}${current.search}${current.hash}`
    const query = new URLSearchParams({
      return_to: returnTo,
      agent_id: agentId,
      scope: currentSessionId ? 'session' : 'agent',
    })
    if (currentSessionId && currentSessionId.trim()) {
      query.set('session_id', currentSessionId.trim())
    }
    router.push(`/approvals?${query.toString()}`)
  }

  function openReviewResultDetail(resultId?: string | null) {
    const agentId = agent?.id
    if (!agentId) return
    const query = new URLSearchParams()
    if (resultId && resultId.trim()) {
      query.set('result_id', resultId.trim())
    }
    if (sessionIdRef.current && sessionIdRef.current.trim()) {
      query.set(PLAYGROUND_SESSION_QUERY_PARAM, sessionIdRef.current.trim())
    }
    router.push(`/agents/${agentId}/operations/review${query.toString() ? `?${query.toString()}` : ''}`)
  }

  function refreshMailboxProfile() {
    void rehydrateRuntimeState({
      force: true,
      trigger: 'profile_refresh',
      refreshMailboxProfile: true,
      mailboxProfileWindowDays: runtimeMailboxProfile?.analysis_window_days ?? 30,
    })
  }

  async function sendMessage() {
    if (!agent?.id || !input.trim() || sending) return

    const text = input.trim()
    const wasFreshStart = freshStartModeRef.current
    setInput('')

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    messagesRef.current = nextMessages
    setMessages(nextMessages)
    setSending(true)
    setCreatedApprovalId(null)
    setCreatedApprovalKind(null)
    setAlternateStepHint(null)
    setDeclinedStepKeys([])
    setSkippedStepHistory([])
    setPreferredStepId(null)
    setConversationResetting(false)

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
      const activeSessionAfterReply =
        (typeof data.data.session_id === 'string' && data.data.session_id.trim()
          ? data.data.session_id.trim()
          : sessionIdRef.current || '').trim() || null
      if (
        activeSessionAfterReply &&
        normalizeRuntimeKey(clearedChatSessionIdRef.current) === normalizeRuntimeKey(activeSessionAfterReply)
      ) {
        setClearedChatSessionId(null)
        if (agent?.id) {
          removeSessionStorageValue(clearedChatSessionKeyForAgent(agent.id))
        }
      }
      if (wasFreshStart) {
        setFreshStartMode(false)
        setClearedSessionApprovalContext(null)
        clearSuppressUntilRef.current = 0
        logSessionDecision('first_message_after_clear', {
          session_id: data.data.session_id || sessionIdRef.current || null,
        })
      }
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

  const effectiveRuntimeApprovalQueueSummary = authoritativeQueueSyncPending
    ? null
    : runtimeApprovalQueueSummary

  const approvalStatusById = new Map<string, 'pending_approval' | 'approved'>()
  if (effectiveRuntimeApprovalQueueSummary) {
    for (const approvalId of effectiveRuntimeApprovalQueueSummary.pending_approval_ids || []) {
      if (typeof approvalId === 'string' && approvalId.trim()) {
        approvalStatusById.set(approvalId.trim(), 'pending_approval')
      }
    }
    for (const approvalId of effectiveRuntimeApprovalQueueSummary.approved_approval_ids || []) {
      if (typeof approvalId === 'string' && approvalId.trim()) {
        approvalStatusById.set(approvalId.trim(), 'approved')
      }
    }
  }

  const resolvedRuntimeSuggestionSets: RuntimeSuggestionSet[] = runtimeSuggestionSets.map((set) => ({
    ...set,
    candidates: set.candidates.map((candidate) => {
      const approvalId =
        typeof candidate.approval_id === 'string' && candidate.approval_id.trim()
          ? candidate.approval_id.trim()
          : null
      if (authoritativeQueueSyncPending && (candidate.status === 'pending_approval' || candidate.status === 'approved')) {
        return {
          ...candidate,
          status: 'ready',
          approval_id: undefined,
        }
      }
      if (!approvalId) return candidate
      if (candidate.status !== 'pending_approval' && candidate.status !== 'approved') {
        return candidate
      }

      const resolvedStatus = approvalStatusById.get(approvalId)
      if (!resolvedStatus) {
        return {
          ...candidate,
          status: 'ready',
          approval_id: undefined,
        }
      }

      return {
        ...candidate,
        status: resolvedStatus,
        approval_id: approvalId,
      }
    }),
  }))

  const resolvedCleanupClusters: RuntimeCleanupPlanCluster[] = (runtimeCleanupPlan?.clusters || []).map((cluster) => {
    const approvalId =
      typeof cluster.approval_id === 'string' && cluster.approval_id.trim()
        ? cluster.approval_id.trim()
        : null
    if (authoritativeQueueSyncPending && (cluster.status === 'pending_approval' || cluster.status === 'approved')) {
      return {
        ...cluster,
        status: 'ready',
        approval_id: undefined,
      }
    }
    if (!approvalId) return cluster
    if (cluster.status !== 'pending_approval' && cluster.status !== 'approved') return cluster

    const resolvedStatus = approvalStatusById.get(approvalId)
    if (!resolvedStatus) {
      return {
        ...cluster,
        status: 'ready',
        approval_id: undefined,
      }
    }

    return {
      ...cluster,
      status: resolvedStatus,
      approval_id: approvalId,
    }
  })

  const batchSuggestionStateByKind: Partial<
    Record<RuntimeBatchSuggestionKind, { status: RuntimeSuggestedActionCandidate['status']; approvalId?: string }>
  > = {}
  for (const set of resolvedRuntimeSuggestionSets) {
    for (const candidate of set.candidates) {
      const kind = batchSuggestionKindFromAction(candidate.proposed_action.action)
      if (!kind || batchSuggestionStateByKind[kind]) continue
      batchSuggestionStateByKind[kind] = {
        status: candidate.status,
        approvalId: candidate.approval_id,
      }
    }
  }

  const runtimeCandidates = resolvedRuntimeSuggestionSets.flatMap((set) => set.candidates)
  const candidateCounts = {
    ready: runtimeCandidates.filter((candidate) => candidate.status === 'ready').length,
    pending: runtimeCandidates.filter((candidate) => candidate.status === 'pending_approval').length,
    approved: runtimeCandidates.filter((candidate) => candidate.status === 'approved').length,
    executed: runtimeCandidates.filter((candidate) => candidate.status === 'executed').length,
  }
  const cleanupClusters = resolvedCleanupClusters
  const visibleCleanupClusters = showAllCleanupClusters ? cleanupClusters : cleanupClusters.slice(0, 3)
  const hiddenCleanupClusterCount = Math.max(0, cleanupClusters.length - visibleCleanupClusters.length)
  const cleanupClusterCounts = {
    ready: cleanupClusters.filter((cluster) => cluster.status === 'ready').length,
    pending: cleanupClusters.filter((cluster) => cluster.status === 'pending_approval').length,
    approved: cleanupClusters.filter((cluster) => cluster.status === 'approved').length,
    executed: cleanupClusters.filter((cluster) => cluster.status === 'executed').length,
  }
  const pendingApprovalCount =
    effectiveRuntimeApprovalQueueSummary?.pending ??
    candidateCounts.pending + cleanupClusterCounts.pending
  const approvedApprovalCount =
    effectiveRuntimeApprovalQueueSummary?.approved ??
    candidateCounts.approved + cleanupClusterCounts.approved
  const executedApprovalCount =
    effectiveRuntimeApprovalQueueSummary?.executed ??
    candidateCounts.executed + cleanupClusterCounts.executed
  const cleanupSectionPendingCount = Math.max(cleanupClusterCounts.pending, pendingApprovalCount)
  const cleanupSectionIncludesNonClusterPending = pendingApprovalCount > cleanupClusterCounts.pending
  const hasPendingApprovalQueue = pendingApprovalCount > 0
  const hasApprovedApprovalQueue = approvedApprovalCount > 0
  const hasBlockingApprovalQueue = hasPendingApprovalQueue || hasApprovedApprovalQueue
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
  const overallReviewedSignalCount = Number(Boolean(runtimeReviewEvidence)) + Number(Boolean(runtimeQueryReviewEvidence))
  const overallExecutedSignalCount = executedApprovalCount
  const mailboxProfileFreshness = runtimeMailboxProfile?.freshness?.status || 'fresh'
  const mailboxProfileFreshnessLabel =
    mailboxProfileFreshness === 'stale'
      ? 'Stale'
      : mailboxProfileFreshness === 'cached'
        ? 'Cached'
        : 'Fresh'
  const has30DayMailboxProfile = runtimeMailboxProfile?.analysis_window_days === 30
  const canPromoteCleanupActions = has30DayMailboxProfile
  const agentExperienceExamples = deriveAgentExperienceExamples(agent?.onboarding_summary?.agent_type)
  const trustSampleSize = runtimeEvidence?.inbox_analysis.sample_size ?? 0
  const trustProfileWindow = runtimeMailboxProfile?.analysis_window_days ?? null
  const trustMetadataScanCount = runtimeMailboxProfile?.metadata_scan_basis?.metadata_message_count ?? null
  const trustRecommendationConfidence =
    runtimeMailboxProfile?.recommendation_confidence || 'preliminary'
  const hasEstimateOverlapNoteFromProfile = Boolean(
    runtimeMailboxProfile?.notes.some((note) => /estimate/i.test(note) && /overlap/i.test(note))
  )
  const overlapCounts = runtimeMailboxProfile
    ? [
        runtimeMailboxProfile.native_signal_counts.category_promotions_estimate,
        runtimeMailboxProfile.native_signal_counts.category_social_estimate,
        runtimeMailboxProfile.native_signal_counts.category_updates_estimate,
        runtimeMailboxProfile.native_signal_counts.likely_machine_generated_recent_estimate,
        runtimeMailboxProfile.native_signal_counts.stale_unread_30d_estimate,
      ].filter((value) => Number.isFinite(value) && value > 0)
    : []
  const overlapFrequency = new Map<number, number>()
  for (const value of overlapCounts) {
    overlapFrequency.set(value, (overlapFrequency.get(value) || 0) + 1)
  }
  let maxOverlapFrequency = 0
  for (const count of overlapFrequency.values()) {
    if (count > maxOverlapFrequency) maxOverlapFrequency = count
  }
  const hasEstimateOverlapNote =
    hasEstimateOverlapNoteFromProfile || (overlapCounts.length >= 3 && maxOverlapFrequency >= 3)

  const senderReviewExecutedTs = toRuntimeTimestamp(runtimeReviewEvidence?.executed_at)
  const queryReviewExecutedTs = toRuntimeTimestamp(runtimeQueryReviewEvidence?.executed_at)
  const archiveExecutedTs = toRuntimeTimestamp(runtimeArchiveEvidence?.executed_at)

  const reviewResultsSorted = [...runtimeReviewResults].sort(
    (a, b) => toRuntimeTimestamp(b.executed_at) - toRuntimeTimestamp(a.executed_at)
  )
  const latestReviewResult = reviewResultsSorted[0] || null
  const latestReviewExecutedTs = latestReviewResult
    ? toRuntimeTimestamp(latestReviewResult.executed_at)
    : Math.max(senderReviewExecutedTs, queryReviewExecutedTs)
  const hasCurrentReviewResult = latestReviewExecutedTs > 0 && latestReviewExecutedTs >= archiveExecutedTs

  const currentReviewTitle = hasCurrentReviewResult
    ? latestReviewResult?.title ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.title || 'Reviewed query cluster'
        : runtimeReviewEvidence?.sender_review.sender || 'Reviewed sender cluster')
    : null
  const currentReviewClusterType = hasCurrentReviewResult
    ? latestReviewResult?.cluster_type ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.cluster_type || null
        : 'sender_cluster')
    : null
  const currentReviewObjective = hasCurrentReviewResult
    ? latestReviewResult?.objective ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? 'Confirm this query-backed cluster is cohesive and safe before approving any mutation step.'
        : 'Confirm this sender cluster is cohesive and safe before approving any mutation step.')
    : null

  const currentReviewMessages = hasCurrentReviewResult
    ? latestReviewResult?.messages ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.reviewed_messages_preview || []
        : runtimeReviewEvidence?.sender_review.messages || [])
    : []
  const currentReviewSampleSubjects = hasCurrentReviewResult
    ? latestReviewResult?.sample_subject_lines ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.sample_subject_lines || []
        : runtimeReviewEvidence?.sender_review.sample_subject_lines || [])
    : []
  const currentReviewEstimatedCount = hasCurrentReviewResult
    ? latestReviewResult?.estimated_count ??
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.estimated_count ?? null
        : null)
    : null
  const currentReviewFetchedCount = hasCurrentReviewResult
    ? latestReviewResult?.fetched_count ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.fetched_count || 0
        : runtimeReviewEvidence?.sender_review.fetched_count || 0)
    : 0
  const currentReviewRiskNote = hasCurrentReviewResult
    ? latestReviewResult?.risk_note ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.risk_note || ''
        : '')
    : ''
  const currentReviewSafetyNote = hasCurrentReviewResult
    ? latestReviewResult?.safety_note ||
      (queryReviewExecutedTs >= senderReviewExecutedTs
        ? runtimeQueryReviewEvidence?.query_review.safety_note || ''
        : '')
    : ''

  const currentReviewMakeup = hasCurrentReviewResult
    ? summarizeClusterMakeup({
        messages: currentReviewMessages.map((message) => ({
          from: message.from,
          subject: message.subject,
        })),
        sampleSubjects: currentReviewSampleSubjects,
        ambiguityHints: [currentReviewRiskNote, currentReviewSafetyNote, hasEstimateOverlapNote ? 'overlap estimate' : ''],
      })
    : null
  const currentReviewFuturePrevention = hasCurrentReviewResult && currentReviewMakeup
    ? deriveFuturePreventionRecommendation({
        title: currentReviewTitle || 'Reviewed cluster',
        clusterType: currentReviewClusterType,
        topSenders: currentReviewMakeup.topSenders,
        topPatterns: currentReviewMakeup.topPatterns,
        ambiguityLabel: currentReviewMakeup.ambiguityLabel,
      })
    : null

  const senderReviewIsHistorical =
    Boolean(runtimeReviewEvidence) &&
    (!hasCurrentReviewResult || (latestReviewResult ? latestReviewResult.kind !== 'review_sender_cluster' : queryReviewExecutedTs >= senderReviewExecutedTs))
  const queryReviewIsHistorical =
    Boolean(runtimeQueryReviewEvidence) &&
    (!hasCurrentReviewResult || (latestReviewResult ? latestReviewResult.kind !== 'review_query_cluster' : senderReviewExecutedTs > queryReviewExecutedTs))
  const archiveEvidenceIsHistorical =
    Boolean(runtimeArchiveEvidence) &&
    ((hasCurrentReviewResult && archiveExecutedTs < latestReviewExecutedTs) || (latestReviewExecutedTs > 0 && archiveExecutedTs < latestReviewExecutedTs))

  const currentReviewSenderKey =
    hasCurrentReviewResult && latestReviewResult?.kind === 'review_sender_cluster'
      ? normalizeRuntimeKey(latestReviewResult.sender || null)
      : ''
  const currentReviewClusterId =
    hasCurrentReviewResult && latestReviewResult?.kind === 'review_query_cluster'
      ? normalizeRuntimeKey(latestReviewResult.cluster_id || null)
      : ''
  const reviewedSenderHistory = new Set(
    runtimeReviewResults
      .filter((result) => result.kind === 'review_sender_cluster')
      .map((result) => normalizeRuntimeKey(result.sender || null))
      .filter(Boolean)
  )
  const reviewedQueryClusterHistory = new Set(
    runtimeReviewResults
      .filter((result) => result.kind === 'review_query_cluster')
      .map((result) => normalizeRuntimeKey(result.cluster_id || null))
      .filter(Boolean)
  )

  const isDeclinedStep = (id: string): boolean => declinedStepKeys.includes(id)
  const reviewProposalSender = runtimeReviewProposal?.proposed_actions[0]?.args?.sender || ''
  const reviewProposalStepId = `review_sender:${normalizeRuntimeKey(reviewProposalSender)}`
  const reviewProposalSenderAlreadyReviewed =
    normalizeRuntimeKey(reviewProposalSender).length > 0 &&
    reviewedSenderHistory.has(normalizeRuntimeKey(reviewProposalSender))

  const alternateSenderCandidates =
    runtimeEvidence?.inbox_analysis.top_senders
      .map((entry) => ({
        sender: (entry.sender || '').trim(),
        count: Number(entry.count),
      }))
      .filter(
        (entry) =>
          entry.sender.length > 0 &&
          Number.isFinite(entry.count) &&
          entry.count > 0 &&
          normalizeRuntimeKey(entry.sender) !== normalizeRuntimeKey(reviewProposalSender)
      )
      .slice(0, 3) || []
  const batchSuggestionDefs: Array<{
    key: RuntimeBatchSuggestionKind
    title: string
    ctaLabel: string
    emptyLabel: string
  }> = [
    {
      key: 'archive_candidates',
      title: 'Archive this reviewed batch',
      ctaLabel: 'Ask for approval to archive selected emails',
      emptyLabel: 'No archive action recommended yet',
    },
    {
      key: 'unsubscribe_candidates',
      title: 'Review unsubscribe candidates for this batch',
      ctaLabel: 'Ask for approval to unsubscribe selected senders',
      emptyLabel: 'No unsubscribe action recommended yet',
    },
    {
      key: 'reply_candidates',
      title: 'Review reply candidates for this batch',
      ctaLabel: 'Ask for approval to draft replies for selected emails',
      emptyLabel: 'No reply action recommended yet',
    },
    {
      key: 'important_candidates',
      title: 'Review important-mark candidates for this batch',
      ctaLabel: 'Ask for approval to mark selected emails important',
      emptyLabel: 'No important-mark action recommended yet',
    },
  ]
  const latestReviewSenderKey =
    latestReviewResult?.kind === 'review_sender_cluster'
      ? normalizeRuntimeKey(latestReviewResult.sender || null)
      : ''
  const activeBatchSenderKey = normalizeRuntimeKey(runtimeActiveBatch?.sender || null)
  const reviewEvidenceSenderKey = normalizeRuntimeKey(runtimeReviewEvidence?.sender_review.sender || null)
  const hasResultBoundBatchSuggestionContext =
    Boolean(
      runtimeBatchSuggestions &&
      latestReviewResult &&
      latestReviewResult.kind === 'review_sender_cluster' &&
      latestReviewSenderKey &&
      latestReviewSenderKey === activeBatchSenderKey &&
      latestReviewSenderKey === reviewEvidenceSenderKey
    )
  const effectiveRuntimeBatchSuggestions = hasResultBoundBatchSuggestionContext
    ? runtimeBatchSuggestions
    : null
  const hasStaleBatchSuggestionContext =
    Boolean(runtimeBatchSuggestions) && !effectiveRuntimeBatchSuggestions
  const currentReviewPrimarySender =
    hasCurrentReviewResult && currentReviewMakeup?.topSenders?.[0]?.label
      ? currentReviewMakeup.topSenders[0].label
      : latestReviewResult?.sender || runtimeActiveBatch?.sender || null
  const activeBatchSenderPreference = deriveSenderPreference(
    senderPreferences,
    currentReviewPrimarySender
  )
  const reviewEngagementSignals = deriveEngagementSignals(
    (currentReviewMessages || []).map((message) => ({
      subject: message.subject,
      is_unread: message.is_unread,
      is_important: message.is_important,
      is_starred: message.is_starred,
    }))
  )
  const archiveRecommendationBlockedByPreference = activeBatchSenderPreference === 'keep'
  const currentReviewContextKey =
    latestReviewResult?.id ||
    (currentReviewClusterId ? `query:${currentReviewClusterId}` : '') ||
    (currentReviewSenderKey ? `sender:${currentReviewSenderKey}` : '') ||
    null
  const currentCustomization = currentReviewContextKey
    ? archiveCustomizationByResult[currentReviewContextKey] || { excludedMessageIds: [], excludedSenderKeys: [], excludedPatternKeys: [] }
    : { excludedMessageIds: [], excludedSenderKeys: [], excludedPatternKeys: [] }
  const reviewedMessageById = new Map(
    (currentReviewMessages || []).map((message) => [message.message_id, message] as const)
  )
  const archiveCandidateIdsRaw = Array.isArray(effectiveRuntimeBatchSuggestions?.archive_candidates)
    ? effectiveRuntimeBatchSuggestions.archive_candidates
        .map((candidate) => candidate.message_id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []
  const archiveExcludedBySender = new Set<string>()
  for (const messageId of archiveCandidateIdsRaw) {
    const sender = reviewedMessageById.get(messageId)?.from || null
    if (deriveSenderPreference(senderPreferences, sender) === 'keep') {
      archiveExcludedBySender.add(messageId)
    }
  }
  const archiveExcludedByManualSenderKeys = new Set(
    (currentCustomization.excludedSenderKeys || [])
      .map((value) => normalizeSenderIdentity(value))
      .filter((value) => value.length > 0)
  )
  const archiveExcludedByManualSender = new Set<string>()
  for (const messageId of archiveCandidateIdsRaw) {
    const senderKey = normalizeSenderIdentity(reviewedMessageById.get(messageId)?.from || null)
    if (senderKey && archiveExcludedByManualSenderKeys.has(senderKey)) {
      archiveExcludedByManualSender.add(messageId)
    }
  }
  const archiveExcludedByManualPatternKeys = new Set(
    (currentCustomization.excludedPatternKeys || [])
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0)
  )
  const archiveExcludedByManualPattern = new Set<string>()
  for (const messageId of archiveCandidateIdsRaw) {
    const subject = reviewedMessageById.get(messageId)?.subject || ''
    const patternLabel = classifySubjectPattern(subject || '').trim()
    const patternKey = patternLabel.toLowerCase()
    if (patternKey && archiveExcludedByManualPatternKeys.has(patternKey)) {
      archiveExcludedByManualPattern.add(messageId)
    }
  }
  const archiveExcludedByManual = new Set(
    currentCustomization.excludedMessageIds
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
  )
  const archiveExcludedMessageIds = new Set<string>([
    ...Array.from(archiveExcludedBySender),
    ...Array.from(archiveExcludedByManualSender),
    ...Array.from(archiveExcludedByManualPattern),
    ...Array.from(archiveExcludedByManual),
  ])
  const selectedArchiveMessageIds = archiveCandidateIdsRaw.filter(
    (messageId) => !archiveExcludedMessageIds.has(messageId)
  )
  const selectedArchiveCount = selectedArchiveMessageIds.length
  const excludedArchiveCount = archiveExcludedMessageIds.size
  const excludedArchiveSenders = Array.from(
    new Set(
      Array.from(archiveExcludedMessageIds)
        .map((messageId) => normalizeSenderIdentity(reviewedMessageById.get(messageId)?.from || null))
        .filter((sender) => sender.length > 0)
    )
  )
  const archiveCandidatePatternCounts = Array.from(
    archiveCandidateIdsRaw.reduce((map, messageId) => {
      const patternLabel = classifySubjectPattern(reviewedMessageById.get(messageId)?.subject || '').trim()
      const patternKey = patternLabel.toLowerCase() || 'general updates'
      const current = map.get(patternKey)
      if (current) {
        current.count += 1
        return map
      }
      map.set(patternKey, { patternKey, patternLabel: patternLabel || 'General updates', count: 1 })
      return map
    }, new Map<string, { patternKey: string; patternLabel: string; count: number }>())
      .values()
  )
    .sort((a, b) => b.count - a.count || a.patternLabel.localeCompare(b.patternLabel))
    .slice(0, 6)
  const archiveCandidateSenderCounts = Array.from(
    archiveCandidateIdsRaw.reduce((map, messageId) => {
      const senderLabel = (reviewedMessageById.get(messageId)?.from || '').trim() || 'Unknown sender'
      const senderKey = normalizeSenderIdentity(senderLabel)
      if (!senderKey) return map
      const current = map.get(senderKey)
      if (current) {
        current.count += 1
        return map
      }
      map.set(senderKey, { senderKey, senderLabel, count: 1 })
      return map
    }, new Map<string, { senderKey: string; senderLabel: string; count: number }>())
      .values()
  )
    .sort((a, b) => b.count - a.count || a.senderLabel.localeCompare(b.senderLabel))
    .slice(0, 6)
  const archiveCustomizationRows = archiveCandidateIdsRaw
    .map((messageId) => reviewedMessageById.get(messageId))
    .filter((message): message is NonNullable<typeof message> => Boolean(message))
    .slice(0, 14)
  const archiveIncludedPreviewRows = selectedArchiveMessageIds
    .map((messageId) => reviewedMessageById.get(messageId))
    .filter((message): message is NonNullable<typeof message> => Boolean(message))
    .slice(0, 8)
  const excludedArchivePreviewRows = Array.from(archiveExcludedMessageIds)
    .map((messageId) => reviewedMessageById.get(messageId))
    .filter((message): message is NonNullable<typeof message> => Boolean(message))
    .slice(0, 6)

  const runtimeActionCandidates: NextActionCandidate[] = []
  const showOptimisticApprovalStep =
    Boolean(createdApprovalId) &&
    !runtimeRefreshRequested &&
    !hasPendingApprovalQueue &&
    !hasApprovedApprovalQueue

  if (showOptimisticApprovalStep) {
    runtimeActionCandidates.push({
      id: `approval:${createdApprovalId}`,
      kind: 'approval_submitted',
      title: 'Approval request submitted',
      detail: 'A review request is waiting for your decision before other steps can continue.',
      ctaLabel: 'Open approvals',
      onClick: openApprovals,
      consequence: buildRuntimeStepConsequence({ mode: 'pending_approval' }),
    })
  }

  if (runtimeProposal && !approvalSubmitting) {
    runtimeActionCandidates.push({
      id: 'analyze_inbox',
      kind: 'analyze',
      title: 'Analyze inbox sample',
      detail: 'Start with inbox analysis evidence before any cleanup actions.',
      ctaLabel: 'Ask for approval to analyze inbox sample',
      onClick: submitRuntimeProposal,
      consequence: buildRuntimeStepConsequence({ mode: 'analyze' }),
    })
  }

  const reviewProposalMatchesCurrentReview =
    currentReviewSenderKey.length > 0 &&
    normalizeRuntimeKey(reviewProposalSender) === currentReviewSenderKey

  if (
    runtimeReviewProposal &&
    !approvalSubmitting &&
    reviewProposalSender &&
    !reviewProposalMatchesCurrentReview &&
    !reviewProposalSenderAlreadyReviewed
  ) {
    runtimeActionCandidates.push({
      id: reviewProposalStepId,
      kind: 'review_sender',
      title: 'Review the recommended batch',
      detail:
        runtimeReviewProposal.proposed_actions[0]?.args?.batch_title ||
        'Inspect the top sender cluster before selecting actions.',
      ctaLabel: 'Ask for approval to review sender sample',
      onClick: submitRuntimeReviewProposal,
      consequence: buildRuntimeStepConsequence({
        mode: 'review_sender',
        sender: reviewProposalSender,
      }),
    })
  }

  for (const cluster of cleanupClusters) {
    if (cluster.status !== 'ready') continue
    if (reviewedQueryClusterHistory.has(normalizeRuntimeKey(cluster.cluster_id))) continue
    const clusterIdMatchesCurrentReview =
      currentReviewClusterId.length > 0 &&
      normalizeRuntimeKey(cluster.cluster_id) === currentReviewClusterId
    if (clusterIdMatchesCurrentReview) continue
    runtimeActionCandidates.push({
      id: `review_query:${cluster.cluster_id}`,
      kind: 'review_query',
      title: 'Review a query-backed cleanup cluster',
      detail: cluster.title,
      ctaLabel: 'Ask for approval to preview matching emails',
      onClick: () => submitRuntimeCleanupClusterProposal(cluster),
      consequence: buildRuntimeStepConsequence({
        mode: 'review_query',
        title: cluster.title,
      }),
    })
  }

  for (const senderOption of alternateSenderCandidates) {
    const senderLabel = senderOption.sender
    runtimeActionCandidates.push({
      id: `review_sender_alt:${normalizeRuntimeKey(senderLabel)}`,
      kind: 'review_sender',
      title: 'Review an alternate sender cluster',
      detail: `${senderLabel} (${senderOption.count})`,
      ctaLabel: 'Ask for approval to review sender sample',
      onClick: () => void submitAdHocRuntimeSenderReview(senderLabel, senderOption.count),
      consequence: buildRuntimeStepConsequence({
        mode: 'review_sender',
        sender: senderLabel,
      }),
    })
  }

  if (hasPendingApprovalQueue || hasApprovedApprovalQueue) {
    runtimeActionCandidates.push({
      id: 'pending_approval',
      kind: 'pending_approval',
      title: 'Resolve pending approvals',
      detail: 'A review request is waiting for your decision before other steps can continue.',
      ctaLabel: 'Open approvals',
      onClick: openApprovals,
      consequence: buildRuntimeStepConsequence({ mode: 'pending_approval' }),
    })
  }

  if (effectiveRuntimeBatchSuggestions && canPromoteCleanupActions) {
    for (const def of batchSuggestionDefs) {
      if (def.key === 'archive_candidates') {
        if (archiveRecommendationBlockedByPreference) continue
        if (reviewEngagementSignals.engagementRisk === 'high') continue
      }
      const suggestionState = batchSuggestionStateByKind[def.key]?.status || 'ready'
      if (suggestionState !== 'ready') continue
      const candidates = effectiveRuntimeBatchSuggestions[def.key]
      if (!Array.isArray(candidates) || candidates.length === 0) continue
      runtimeActionCandidates.push({
        id: `batch:${def.key}`,
        kind: 'generic',
        title: def.title,
        detail: `${candidates.length} messages selected from current reviewed batch.`,
        ctaLabel: def.ctaLabel,
        onClick: () => void submitRuntimeBatchSuggestionProposal(def.key),
        consequence: {
          thisStep: `Submit an approval request for ${def.title.toLowerCase()}.`,
          inboxChangesNow: 'None. This only creates an approval request.',
          afterStep: 'If approved, action can be executed in a separate supervised step.',
        },
      })
    }
  }

  if (candidateCounts.ready > 0 && !canPromoteCleanupActions) {
    runtimeActionCandidates.push({
      id: 'refresh_profile',
      kind: 'profile_refresh',
      title: 'Refresh mailbox profile before cleanup approvals',
      detail: 'Only analysis/review steps are promoted until a 30-day mailbox profile is available.',
      ctaLabel: 'Refresh profile',
      onClick: refreshMailboxProfile,
      consequence: buildRuntimeStepConsequence({ mode: 'profile_refresh' }),
    })
  }

  if (candidateCounts.ready > 0 && canPromoteCleanupActions) {
    runtimeActionCandidates.push({
      id: 'generic_ready',
      kind: 'generic',
      title: 'Propose next batch action',
      detail: 'Suggested batch actions are ready to submit for approval.',
      ctaLabel: null,
      onClick: null,
      consequence: null,
    })
  }

  const filteredActionCandidates = runtimeActionCandidates.filter(
    (candidate) => !isDeclinedStep(candidate.id)
  )
  const selectedBlockingCandidate = hasBlockingApprovalQueue
    ? filteredActionCandidates.find((candidate) => candidate.kind === 'approval_submitted') ||
      filteredActionCandidates.find((candidate) => candidate.kind === 'pending_approval') ||
      null
    : null
  const selectedByPreference =
    preferredStepId && filteredActionCandidates.some((candidate) => candidate.id === preferredStepId)
      ? filteredActionCandidates.find((candidate) => candidate.id === preferredStepId) || null
      : null
  const selectedNextAction =
    selectedBlockingCandidate || selectedByPreference || filteredActionCandidates[0] || null
  const selectedActionInput: WorkflowActionInput | null = selectedNextAction
    ? {
        id: selectedNextAction.id,
        kind: selectedNextAction.kind,
        title: selectedNextAction.title,
        detail: selectedNextAction.detail,
        ctaLabel: selectedNextAction.ctaLabel,
      }
    : null
  const workflowState = derivePlaygroundWorkflowState({
    hasBlockingApprovalQueue,
    hasCurrentReviewResult,
    selectedAction: selectedActionInput,
    fallbackStepTitle: `Review results: ${currentReviewTitle || 'recent reviewed batch'}`,
    fallbackStepDetail:
      'Inspect this just-executed review evidence before moving to the next approval step.',
  })
  const showReviewResultsState = workflowState.showReviewResultsState
  const reviewResultRecommendedAction =
    hasCurrentReviewResult && !hasBlockingApprovalQueue
      ? selectedNextAction
      : null
  const nextActionTitle = workflowState.currentStepTitle
  const nextActionDetail = workflowState.currentStepDetail
  const nextActionCtaLabel = workflowState.currentStepCtaLabel
  const nextActionHandler = nextActionCtaLabel
    ? selectedNextAction?.onClick || (hasBlockingApprovalQueue ? openApprovals : null)
    : null
  const nextActionConsequence = showReviewResultsState
    ? null
    : selectedNextAction?.consequence ||
      (workflowState.stage === 'awaiting_approval'
        ? buildRuntimeStepConsequence({ mode: 'pending_approval' })
        : null)
  const hasAlternateStepOption =
    !hasBlockingApprovalQueue && !showReviewResultsState && filteredActionCandidates.length > 1
  const hasPreviousSkippedStep =
    !hasBlockingApprovalQueue && !showReviewResultsState && skippedStepHistory.length > 0
  const currentNextActionId = selectedNextAction?.id || null
  const currentStepIsAnalyze = currentNextActionId === 'analyze_inbox'
  const currentStepIsRecommendedSenderReview =
    selectedNextAction?.kind === 'review_sender' && currentNextActionId === reviewProposalStepId
  const lifecycleState = {
    label: workflowState.lifecycleLabel,
    detail: workflowState.lifecycleDetail,
  }
  const senderPreferenceEffectLabel =
    SENDER_PREFERENCE_UI[activeBatchSenderPreference].effect
  const senderPreferenceUi = SENDER_PREFERENCE_UI[activeBatchSenderPreference]
  const showArchiveCustomizationPanel = Boolean(
    effectiveRuntimeBatchSuggestions &&
      archiveCandidateIdsRaw.length > 0 &&
      (currentNextActionId === 'batch:archive_candidates' ||
        reviewResultRecommendedAction?.id === 'batch:archive_candidates')
  )
  const decisionDiffIncludedExamples = archiveIncludedPreviewRows.slice(0, 3)
  const decisionDiffExcludedExamples = excludedArchivePreviewRows.slice(0, 3)
  const engagementRiskLabel =
    reviewEngagementSignals.engagementRisk.charAt(0).toUpperCase() +
    reviewEngagementSignals.engagementRisk.slice(1)

  let currentStepActionForSummary: RuntimePlanAction | null = null
  let currentStepUserRequestForSummary: string | null = null
  let currentStepSampleMessages: Array<{
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
  }> = []
  let currentStepSampleSubjects: string[] = []
  let currentStepSampleSnippets: string[] = []
  let currentStepSampleSize: number | null = null
  let currentStepTotalCount: number | null = null

  if (currentNextActionId === 'analyze_inbox' && runtimeProposal?.proposed_actions?.[0]) {
    currentStepActionForSummary = runtimeProposal.proposed_actions[0]
    currentStepUserRequestForSummary = runtimeProposal.user_request
    currentStepSampleSubjects = runtimeEvidence?.inbox_analysis.sample_subject_lines || []
    currentStepSampleSize = runtimeEvidence?.inbox_analysis.sample_size ?? 25
  } else if (currentNextActionId === reviewProposalStepId && runtimeReviewProposal?.proposed_actions?.[0]) {
    currentStepActionForSummary = runtimeReviewProposal.proposed_actions[0]
    currentStepUserRequestForSummary = runtimeReviewProposal.user_request
    currentStepSampleMessages = runtimeReviewEvidence?.sender_review.messages.slice(0, 5) || []
    currentStepSampleSubjects = runtimeReviewEvidence?.sender_review.sample_subject_lines || []
    currentStepSampleSnippets = runtimeReviewEvidence?.sender_review.snippet_previews || []
    currentStepSampleSize = runtimeReviewEvidence?.sender_review.fetched_count ?? 25
    currentStepTotalCount = runtimeReviewProposal.proposed_actions[0]?.args?.count ?? null
  } else if (currentNextActionId?.startsWith('review_query:')) {
    const clusterId = currentNextActionId.slice('review_query:'.length)
    const cluster = cleanupClusters.find((item) => item.cluster_id === clusterId)
    if (cluster) {
      currentStepActionForSummary = {
        tool: cluster.proposed_action.tool,
        action: cluster.proposed_action.action,
        args: {
          ...cluster.proposed_action.args,
          sample_messages: cluster.sample_preview.slice(0, 5),
          sample_size: cluster.sample_preview.length,
          source_label: cluster.title,
          selection_basis: cluster.why_selected,
          risk_level: 'low',
          safe_signals: ['Query-backed', 'Already reviewed', 'No inbox changes yet', 'Reversible'],
          safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
        },
      }
      currentStepUserRequestForSummary = `Review query-backed cleanup cluster: ${cluster.title}.`
      currentStepSampleMessages = cluster.sample_preview.slice(0, 5)
      currentStepSampleSubjects = cluster.sample_preview
        .map((sample) => (sample.subject || '').trim())
        .filter((subject) => subject.length > 0)
      currentStepSampleSnippets = cluster.sample_preview
        .map((sample) => (sample.snippet || '').trim())
        .filter((snippet) => snippet.length > 0)
      currentStepSampleSize = cluster.sample_preview.length
      currentStepTotalCount = cluster.estimated_count
    }
  } else if (currentNextActionId?.startsWith('review_sender_alt:')) {
    const senderKey = currentNextActionId.slice('review_sender_alt:'.length)
    const senderOption = alternateSenderCandidates.find(
      (entry) => normalizeRuntimeKey(entry.sender) === senderKey
    )
    if (senderOption) {
      currentStepActionForSummary = {
        tool: 'gmail',
        action: 'review_sender_cluster',
        args: {
          sender: senderOption.sender,
          count: senderOption.count,
          batch_title: `Batch: ${senderOption.sender} review`,
          source_label: `${senderOption.sender} sender cluster`,
          selection_basis: `Sender recurrence detected in inbox analysis for ${senderOption.sender}.`,
          risk_level: 'low',
          safe_signals: ['Sender-cluster review', 'No inbox changes yet', 'Reversible'],
          safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
        },
      }
      currentStepUserRequestForSummary = `Review sender cluster before cleanup actions: ${senderOption.sender}.`
      currentStepTotalCount = senderOption.count
      currentStepSampleSize = Math.min(25, senderOption.count)
    }
  } else if (
    currentNextActionId?.startsWith('batch:') &&
    runtimeActiveBatch &&
    effectiveRuntimeBatchSuggestions
  ) {
    const kind = currentNextActionId.slice('batch:'.length) as RuntimeBatchSuggestionKind
    const messageIds = Array.isArray(effectiveRuntimeBatchSuggestions[kind])
      ? effectiveRuntimeBatchSuggestions[kind].map((candidate) => candidate.message_id)
      : []
    const sharedArgs = {
      sender: runtimeActiveBatch.sender,
      batch_title: runtimeActiveBatch.batch_title,
      message_ids: kind === 'archive_candidates' ? selectedArchiveMessageIds : messageIds,
      sample_messages: runtimeReviewEvidence?.sender_review.messages.slice(0, 5) || [],
      sample_size: runtimeReviewEvidence?.sender_review.messages.length || Math.min(5, messageIds.length),
      source_label: runtimeActiveBatch.batch_title || runtimeActiveBatch.sender,
      selection_basis: `Low-action-value items selected from reviewed batch ${runtimeActiveBatch.batch_title}.`,
      risk_level: 'low',
      safe_signals: ['Transactional', 'Already reviewed', 'No reply needed', 'Archive only', 'Reversible'],
      safety_exclusions: ['No delete', 'No unsubscribe', 'No sender blocking'],
      engagement_summary: reviewEngagementSignals,
      sender_preference: activeBatchSenderPreference,
      selection_customization:
        kind === 'archive_candidates'
          ? {
              reviewed_count: currentReviewFetchedCount,
              candidate_count: archiveCandidateIdsRaw.length,
              selected_count: selectedArchiveCount,
              excluded_count: excludedArchiveCount,
              excluded_senders: excludedArchiveSenders,
              excluded_sender_keys: Array.from(archiveExcludedByManualSenderKeys),
              excluded_pattern_keys: Array.from(archiveExcludedByManualPatternKeys),
              selected_message_ids: selectedArchiveMessageIds,
              excluded_message_ids: Array.from(archiveExcludedMessageIds),
              basis: 'reviewed_result_customization',
            }
          : undefined,
    }
    if (kind === 'archive_candidates') {
      currentStepActionForSummary = { tool: 'gmail', action: 'archive_messages', args: sharedArgs }
      currentStepUserRequestForSummary = `Archive low-value messages from ${runtimeActiveBatch.sender} in ${runtimeActiveBatch.batch_title}.`
    } else if (kind === 'unsubscribe_candidates') {
      currentStepActionForSummary = { tool: 'gmail', action: 'unsubscribe_senders', args: sharedArgs }
      currentStepUserRequestForSummary = `Unsubscribe from repetitive senders in ${runtimeActiveBatch.batch_title}.`
    } else if (kind === 'reply_candidates') {
      currentStepActionForSummary = { tool: 'gmail', action: 'draft_replies', args: sharedArgs }
      currentStepUserRequestForSummary = `Prepare reply actions for response-needed messages in ${runtimeActiveBatch.batch_title}.`
    } else if (kind === 'important_candidates') {
      currentStepActionForSummary = { tool: 'gmail', action: 'mark_important', args: sharedArgs }
      currentStepUserRequestForSummary = `Mark important messages in ${runtimeActiveBatch.batch_title} for priority follow-up.`
    }
    currentStepTotalCount = kind === 'archive_candidates' ? selectedArchiveCount : messageIds.length
    currentStepSampleMessages = runtimeReviewEvidence?.sender_review.messages.slice(0, 5) || []
    currentStepSampleSubjects = runtimeReviewEvidence?.sender_review.sample_subject_lines || []
    currentStepSampleSnippets = runtimeReviewEvidence?.sender_review.snippet_previews || []
    currentStepSampleSize = runtimeReviewEvidence?.sender_review.messages.length || Math.min(5, messageIds.length)
  }

  const currentStepDecisionSummary = buildApprovalDecisionSummary({
    action: currentStepActionForSummary,
    userRequest: currentStepUserRequestForSummary,
    sampleMessages: currentStepSampleMessages,
    sampleSubjects: currentStepSampleSubjects,
    sampleSnippets: currentStepSampleSnippets,
    sampleSize: currentStepSampleSize,
    totalSelectedCount: currentStepTotalCount,
  })

  const handleSkipCurrentStep = () => {
    if (!currentNextActionId || hasBlockingApprovalQueue) return
    setSkippedStepHistory((prev) =>
      prev.includes(currentNextActionId) ? prev : [...prev, currentNextActionId]
    )
    setDeclinedStepKeys((prev) =>
      prev.includes(currentNextActionId) ? prev : [...prev, currentNextActionId]
    )
    if (preferredStepId === currentNextActionId) {
      setPreferredStepId(null)
    }
    setAlternateStepHint('Showing another safe review option.')
  }

  const handleRestorePreviousStep = () => {
    if (hasBlockingApprovalQueue) return
    const lastSkipped = skippedStepHistory[skippedStepHistory.length - 1]
    if (!lastSkipped) return
    setSkippedStepHistory((prev) => prev.slice(0, -1))
    setDeclinedStepKeys((prev) => prev.filter((id) => id !== lastSkipped))
    setPreferredStepId(lastSkipped)
    setAlternateStepHint('Restored previous recommendation.')
  }

  const selectAsCurrentStep = (stepId: string, label: string) => {
    if (hasBlockingApprovalQueue) {
      setAlternateStepHint('Resolve pending approvals first. Other options remain available for context below.')
      return
    }
    setPreferredStepId(stepId)
    setDeclinedStepKeys((prev) => prev.filter((id) => id !== stepId))
    setAlternateStepHint(`Current Step set to: ${label}`)
  }

  const applySenderPreference = (sender: string | null, preference: SenderPreference) => {
    const key = normalizeSenderIdentity(sender)
    if (!key) return
    setSenderPreferences((prev) => ({
      ...prev,
      [key]: preference,
    }))
  }

  const updateArchiveCustomization = (
    updater: (prev: ArchiveCustomizationState) => ArchiveCustomizationState
  ) => {
    if (!currentReviewContextKey) return
    setArchiveCustomizationByResult((prev) => {
      const current = prev[currentReviewContextKey] || {
        excludedMessageIds: [],
        excludedSenderKeys: [],
        excludedPatternKeys: [],
      }
      const nextValue = updater(current)
      return {
        ...prev,
        [currentReviewContextKey]: {
          excludedMessageIds: Array.from(
            new Set(nextValue.excludedMessageIds.map((id) => id.trim()).filter(Boolean))
          ),
          excludedSenderKeys: Array.from(
            new Set(nextValue.excludedSenderKeys.map((value) => normalizeSenderIdentity(value)).filter(Boolean))
          ),
          excludedPatternKeys: Array.from(
            new Set(nextValue.excludedPatternKeys.map((value) => value.trim().toLowerCase()).filter(Boolean))
          ),
        },
      }
    })
  }

  const toggleArchiveSenderExclusion = (senderKey: string) => {
    updateArchiveCustomization((prev) => {
      const next = new Set(prev.excludedSenderKeys || [])
      if (next.has(senderKey)) {
        next.delete(senderKey)
      } else {
        next.add(senderKey)
      }
      return {
        ...prev,
        excludedSenderKeys: Array.from(next),
      }
    })
  }

  const toggleArchiveMessageExclusion = (messageId: string) => {
    updateArchiveCustomization((prev) => {
      const next = new Set(prev.excludedMessageIds || [])
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return {
        ...prev,
        excludedMessageIds: Array.from(next),
      }
    })
  }

  const toggleArchivePatternExclusion = (patternKey: string) => {
    updateArchiveCustomization((prev) => {
      const normalized = patternKey.trim().toLowerCase()
      if (!normalized) return prev
      const next = new Set((prev.excludedPatternKeys || []).map((value) => value.trim().toLowerCase()))
      if (next.has(normalized)) {
        next.delete(normalized)
      } else {
        next.add(normalized)
      }
      return {
        ...prev,
        excludedPatternKeys: Array.from(next),
      }
    })
  }

  const clearArchiveCustomization = () => {
    if (!currentReviewContextKey) return
    setArchiveCustomizationByResult((prev) => {
      if (!prev[currentReviewContextKey]) return prev
      return {
        ...prev,
        [currentReviewContextKey]: {
          excludedMessageIds: [],
          excludedSenderKeys: [],
          excludedPatternKeys: [],
        },
      }
    })
  }

  const showRuntimeCard = Boolean(
    runtimeProposal ||
      runtimeRecommendation ||
      runtimeReviewProposal ||
      runtimeReviewEvidence ||
      runtimeQueryReviewEvidence ||
      runtimeReviewResults.length > 0 ||
      runtimeArchiveEvidence ||
      runtimeActiveBatch ||
      effectiveRuntimeBatchSuggestions ||
      hasStaleBatchSuggestionContext ||
      runtimeCleanupPlan ||
      runtimeMailboxProfile ||
      runtimeCleanupStrategy ||
      runtimeActiveWorkItem ||
      runtimeEvidenceBlocks.length > 0 ||
      runtimeSuggestionSets.length > 0 ||
      runtimeApprovalQueueSummary ||
      createdApprovalId ||
      runtimeEvidence
  )
  const hasSecondaryRuntimeDetails = Boolean(
    runtimeActiveWorkItem ||
      runtimeEvidenceBlocks.length > 0 ||
      runtimeSuggestionSets.length > 0 ||
      runtimeEvidence ||
      runtimeRecommendation ||
      runtimeCleanupPlan ||
      runtimeMailboxProfile ||
      runtimeCleanupStrategy ||
      runtimeReviewProposal ||
      runtimeReviewEvidence ||
      runtimeQueryReviewEvidence ||
      runtimeReviewResults.length > 0 ||
      runtimeArchiveEvidence ||
      effectiveRuntimeBatchSuggestions ||
      hasStaleBatchSuggestionContext ||
      runtimeProposal ||
      runtimeApprovalQueueSummary ||
      createdApprovalId
  )
  const showSessionRestorePlaceholder =
    runtimeRehydrating &&
    Boolean(sessionId || requestedSessionId) &&
    normalizeRuntimeKey(clearedChatSessionId) !== normalizeRuntimeKey(sessionId || requestedSessionId) &&
    messages.length === 0 &&
    !freshStartMode &&
    !conversationResetting
  const hasClearedSessionUnresolvedApprovals = false
  const showLegacyRuntimeDashboard =
    process.env.NODE_ENV !== 'production' &&
    searchParams.get('show_legacy_runtime') === '1'
  const activeOperationsSessionId = (sessionId || requestedSessionId || '').trim() || null
  const operationsWorkspaceQuery = new URLSearchParams()
  if (activeOperationsSessionId) {
    operationsWorkspaceQuery.set(PLAYGROUND_SESSION_QUERY_PARAM, activeOperationsSessionId)
  }
  const operationsWorkspaceHref = agent?.id
    ? `/agents/${agent.id}/operations${
        operationsWorkspaceQuery.toString() ? `?${operationsWorkspaceQuery.toString()}` : ''
      }`
    : null
  const operationsReviewHref =
    agent?.id && latestReviewResult?.id
      ? `/agents/${agent.id}/operations/review?${new URLSearchParams({
          ...(activeOperationsSessionId ? { [PLAYGROUND_SESSION_QUERY_PARAM]: activeOperationsSessionId } : {}),
          result_id: latestReviewResult.id,
        }).toString()}`
      : null

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

        {showSessionRestorePlaceholder && !showRuntimeCard && (
          <section className="mb-3 rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-3">
            <p className="text-xs text-cyan-200">Restoring active Playground session…</p>
          </section>
        )}

        {hasClearedSessionUnresolvedApprovals && (
          <section className="mb-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 space-y-1.5">
            <p className="text-xs font-medium text-amber-200">
              Unresolved approvals remain from session{' '}
              <span className="font-mono">{clearedSessionApprovalContext?.session_id.slice(0, 8)}</span>.
            </p>
            <button
              type="button"
              onClick={openApprovals}
              className="px-3 py-1.5 rounded text-xs font-medium bg-amber-700 hover:bg-amber-600 text-white"
            >
              Open approvals
            </button>
          </section>
        )}

        {showRuntimeCard && (
          <section className="mb-4 rounded-xl border border-cyan-900/55 bg-gradient-to-b from-cyan-950/20 to-gray-950/35 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-cyan-300">Operations workspace</p>
                <p className="text-sm font-semibold text-cyan-100">Runtime operations moved to dedicated workspace</p>
                <p className="text-xs text-gray-300">
                  Use Operations for cluster review, decision building, approvals, and history. Playground stays chat-first.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {operationsWorkspaceHref ? (
                  <button
                    type="button"
                    onClick={() => router.push(operationsWorkspaceHref)}
                    className="rounded-md bg-cyan-700 hover:bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Open Operations Workspace
                  </button>
                ) : null}
                {operationsReviewHref ? (
                  <button
                    type="button"
                    onClick={() => router.push(operationsReviewHref)}
                    className="rounded-md bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-cyan-200"
                  >
                    Open latest review detail
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openApprovals}
                  className="rounded-md bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-cyan-200"
                >
                  Open approvals
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded border border-amber-900/55 bg-amber-950/15 p-2">
                <p className="text-[10px] uppercase tracking-wide text-amber-300">Pending approvals</p>
                <p className="text-base font-semibold text-amber-100">{runtimeApprovalQueueSummary?.pending || 0}</p>
              </div>
              <div className="rounded border border-blue-900/55 bg-blue-950/15 p-2">
                <p className="text-[10px] uppercase tracking-wide text-blue-300">Approved</p>
                <p className="text-base font-semibold text-blue-100">{runtimeApprovalQueueSummary?.approved || 0}</p>
              </div>
              <div className="rounded border border-emerald-900/55 bg-emerald-950/15 p-2">
                <p className="text-[10px] uppercase tracking-wide text-emerald-300">Executed</p>
                <p className="text-base font-semibold text-emerald-100">{runtimeApprovalQueueSummary?.executed || 0}</p>
              </div>
              <div className="rounded border border-gray-800 bg-gray-950/30 p-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Latest reviewed result</p>
                <p className="text-xs font-medium text-gray-100 truncate">
                  {latestReviewResult?.title || 'No reviewed result yet'}
                </p>
              </div>
            </div>
          </section>
        )}

        {showRuntimeCard && showLegacyRuntimeDashboard && (
          <section className="mb-3 rounded-xl border border-cyan-900/60 bg-gradient-to-b from-cyan-950/30 to-gray-900/60 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-cyan-100">Runtime Operations Dashboard</p>
                <p className="text-xs text-cyan-100/80">Approval-gated inbox workflow.</p>
                {showRuntimeSyncIndicator && (
                  <p className="text-[10px] text-cyan-300/65 mt-1">Syncing runtime state…</p>
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

            <div className="rounded-xl border border-cyan-900/60 bg-gray-950/60 p-3 space-y-3">
              <div className="rounded-lg border border-cyan-900/45 bg-cyan-950/20 p-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-cyan-300">Mission status</p>
                    <p className="text-xs text-cyan-100/90">Inbox cleanup overview</p>
                  </div>
                  <p className="text-[11px] text-cyan-200/80">Executive runtime summary</p>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-cyan-900/35 bg-gray-950/45 p-2">
                    <p className="text-[11px] text-cyan-300">Current workflow progress</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Active cleanup flow steps</span>
                      <span>
                        {workflowCompletedSteps}/{workflowSteps.length} ({workflowProgressPercent}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{ width: `${workflowProgressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Tracks this workflow path only.
                    </p>
                  </div>

                  <div className="rounded-md border border-gray-800 bg-gray-950/45 p-2">
                    <p className="text-[11px] text-gray-300">Overall inbox cleanup progress</p>
                    <p className="mt-1 text-xs text-gray-200">Not yet available</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Total cleanup coverage metric is pending product definition.
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Signals: {overallReviewedSignalCount} reviewed cluster
                      {overallReviewedSignalCount === 1 ? '' : 's'}, {overallExecutedSignalCount} executed action
                      {overallExecutedSignalCount === 1 ? '' : 's'}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-950/45 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-300">
                    Evidence basis
                  </p>
                  <span className="text-[11px] text-gray-500">Trust snapshot</span>
                </div>
                <div className="mt-1 grid gap-1 text-[11px] text-gray-300 sm:grid-cols-2">
                  <p>Quick sample (preview only): {trustSampleSize} messages</p>
                  <p>Mailbox profile window: {trustProfileWindow ? `${trustProfileWindow} days` : 'not available'}</p>
                  <p>
                    Pattern scan basis:{' '}
                    {trustMetadataScanCount != null ? `${trustMetadataScanCount} messages` : 'not available'}
                  </p>
                  <p>Confidence: {trustRecommendationConfidence}</p>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Strategy uses profile + pattern scan signals. Quick sample is for preview, not full-mailbox precision.
                </p>
                {hasEstimateOverlapNote && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    Some cluster estimates overlap because Gmail query estimates are approximate across related filters.
                  </p>
                )}
                {!canPromoteCleanupActions && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    Cleanup approvals are de-emphasized until a 30-day mailbox profile is available.
                  </p>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded border border-cyan-900/35 bg-cyan-950/10 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-cyan-300">Current lifecycle state</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-100">{lifecycleState.label}</p>
                  <p className="mt-1 text-[11px] text-gray-300">{lifecycleState.detail}</p>
                </div>
                <div className="rounded border border-cyan-900/35 bg-cyan-950/10 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-cyan-300">Next user action</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-100">{nextActionTitle}</p>
                  <p className="mt-1 text-[11px] text-gray-300">{nextActionDetail}</p>
                  <p className="mt-1 text-[11px] text-cyan-200/90">
                    {workflowState.currentStepMutationHint}
                  </p>
                </div>
                <div className="rounded border border-gray-800 bg-gray-950/40 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-300">Read-only context</p>
                  <p className="mt-1 text-[11px] text-gray-300">{workflowState.readOnlyContextDetail}</p>
                  {workflowState.blockedReason && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      {workflowState.blockedReason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col items-start gap-1.5">
                  {nextActionCtaLabel && nextActionHandler ? (
                    <button
                      type="button"
                      onClick={nextActionHandler}
                      disabled={approvalSubmitting}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        approvalSubmitting
                          ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                          : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                      }`}
                    >
                      {approvalSubmitting ? 'Submitting…' : nextActionCtaLabel}
                    </button>
                  ) : null}
                  {selectedNextAction &&
                    (selectedNextAction.kind === 'analyze' ||
                      selectedNextAction.kind === 'review_sender' ||
                      selectedNextAction.kind === 'review_query') && (
                      <p className="max-w-[340px] text-[10px] text-gray-400">
                        Need preview-only context first? Open Runtime details for read-only evidence without creating an approval request.
                      </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {hasAlternateStepOption && currentNextActionId ? (
                    <button
                      type="button"
                      onClick={handleSkipCurrentStep}
                      disabled={approvalSubmitting}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                        approvalSubmitting
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : 'bg-gray-800 hover:bg-gray-700 text-cyan-200'
                      }`}
                    >
                      Not this step
                    </button>
                  ) : null}
                  {hasPreviousSkippedStep ? (
                    <button
                      type="button"
                      onClick={handleRestorePreviousStep}
                      disabled={approvalSubmitting}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                        approvalSubmitting
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : 'bg-gray-800 hover:bg-gray-700 text-cyan-200'
                      }`}
                    >
                      Back to previous
                    </button>
                  ) : null}
                </div>
              </div>
              {alternateStepHint && (
                <p className="text-[11px] text-cyan-300">{alternateStepHint}</p>
              )}

              {showReviewResultsState && currentReviewMakeup && (
                <div className="rounded-lg border border-cyan-800/55 bg-cyan-950/20 p-2.5 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-cyan-300">Review results</p>
                      <p className="text-sm font-semibold text-cyan-100">{currentReviewTitle || 'Reviewed batch'}</p>
                      <p className="text-[11px] text-gray-300">{currentReviewObjective}</p>
                    </div>
                    <span className="rounded-full border border-cyan-900/70 bg-cyan-950/45 px-2 py-0.5 text-[11px] text-cyan-100">
                      {currentReviewEstimatedCount != null
                        ? `~${currentReviewEstimatedCount} estimated · ${currentReviewFetchedCount} previewed`
                        : `${currentReviewFetchedCount} previewed`}
                    </span>
                  </div>

                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Objective:</span>{' '}
                      {currentReviewObjective || 'Review this batch before any mutation recommendation.'}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Batch summary:</span>{' '}
                      {currentReviewMakeup.homogeneityLabel} · {currentReviewMakeup.ambiguityLabel}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Recommended next action:</span>{' '}
                      {reviewResultRecommendedAction?.title || 'No immediate action queued.'}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">If executed later:</span> INBOX label changes only after separate approval + execute step.
                    </p>
                  </div>
                  {currentReviewMakeup.topSenders.length > 0 && (
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Top senders:</span>{' '}
                      {currentReviewMakeup.topSenders
                        .slice(0, 4)
                        .map((entry) => `${entry.label} (${entry.count})`)
                        .join(' · ')}
                    </p>
                  )}
                  {currentReviewMakeup.topPatterns.length > 0 && (
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Message types:</span>{' '}
                      {currentReviewMakeup.topPatterns
                        .slice(0, 4)
                        .map((entry) => `${entry.label} (${entry.count})`)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-300">
                    <span className="text-gray-400">Evidence signals:</span>{' '}
                    unread {reviewEngagementSignals.unreadCount}, important {reviewEngagementSignals.importantCount},
                    starred {reviewEngagementSignals.starredCount}, reply-like {reviewEngagementSignals.repliedHeuristicCount} ·{' '}
                    {reviewEngagementSignals.evidenceMode === 'engagement_based' ? 'engagement-based' : 'pattern-based'} · confidence{' '}
                    {reviewEngagementSignals.confidence}
                  </p>
                  <p className="text-[11px] text-gray-300">
                    <span className="text-gray-400">Opened status:</span> not available from Gmail metadata in this flow. Engagement is inferred from unread, important, starred, and reply-like subject signals.
                  </p>
                  <p className="text-[11px] text-gray-300">
                    <span className="text-gray-400">Archive recommendation basis:</span>{' '}
                    {reviewEngagementSignals.evidenceMode === 'engagement_based'
                      ? 'Engagement + pattern evidence'
                      : 'Pattern evidence'}{' '}
                    suggests this batch is low-action-value when protected signals are absent.
                  </p>
                  <p className="text-[11px] text-gray-300">
                    <span className="text-gray-400">Protected/excluded signals:</span>{' '}
                    important/starred/reply-like cues are checked; no delete/unsubscribe/sender-blocking is included.
                  </p>
                  {currentReviewFuturePrevention && (
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Future prevention:</span>{' '}
                      {currentReviewFuturePrevention.recommend
                        ? `Consider a supervised rule for ${currentReviewFuturePrevention.target}.`
                        : `No rule recommendation yet for ${currentReviewFuturePrevention.target}.`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openReviewResultDetail(latestReviewResult?.id || null)}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-cyan-700 hover:bg-cyan-600 text-white"
                    >
                      Open full review result details
                    </button>
                    {reviewResultRecommendedAction?.ctaLabel && reviewResultRecommendedAction.onClick ? (
                      <button
                        type="button"
                        onClick={reviewResultRecommendedAction.onClick}
                        disabled={approvalSubmitting}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          approvalSubmitting
                            ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                            : 'bg-gray-800 hover:bg-gray-700 text-cyan-200'
                        }`}
                      >
                        {approvalSubmitting ? 'Submitting…' : reviewResultRecommendedAction.ctaLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {nextActionConsequence && (
                <div className="rounded-lg border border-cyan-900/35 bg-cyan-950/15 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-cyan-300">What happens next</p>
                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-200">
                    <p>This step: {nextActionConsequence.thisStep}</p>
                    <p>Inbox changes now: {nextActionConsequence.inboxChangesNow}</p>
                    <p>After this step: {nextActionConsequence.afterStep}</p>
                  </div>
                </div>
              )}

              {(archiveRecommendationBlockedByPreference ||
                reviewEngagementSignals.engagementRisk === 'high') && (
                <div className="rounded-lg border border-amber-900/45 bg-amber-950/15 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-amber-300">Archive guardrail</p>
                  <p className="mt-1 text-[11px] text-gray-200">
                    {archiveRecommendationBlockedByPreference
                      ? 'Archive suggestions are suppressed because this sender is marked Always keep.'
                      : 'Archive suggestions are suppressed because recent engagement signals (important/starred/replied) are high in the reviewed sample.'}
                  </p>
                </div>
              )}

              {!archiveRecommendationBlockedByPreference &&
                reviewEngagementSignals.engagementRisk !== 'high' &&
                (reviewResultRecommendedAction?.id?.startsWith('batch:archive_candidates') ||
                  currentNextActionId === 'batch:archive_candidates') && (
                  <div className="rounded-lg border border-emerald-900/45 bg-emerald-950/15 p-2">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Archive trust summary
                    </p>
                    <p className="mt-1 text-[11px] text-gray-200">
                      Low-value rationale is based on current reviewed batch makeup +{' '}
                      {reviewEngagementSignals.evidenceMode === 'engagement_based'
                        ? 'engagement signals'
                        : 'pattern signals'}{' '}
                      (confidence: {reviewEngagementSignals.confidence}).
                    </p>
                    <p className="mt-1 text-[11px] text-gray-300">
                      {senderPreferenceEffectLabel}
                    </p>
                  </div>
                )}

              {hasCurrentReviewResult && (
                <div className="rounded-lg border border-gray-800 bg-gray-950/30 p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-300">
                      Future sender policy
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Affects future recommendations only
                    </p>
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-3">
                    {(['keep', 'neutral', 'deprioritize'] as SenderPreference[]).map((value) => {
                      const active = activeBatchSenderPreference === value
                      const option = SENDER_PREFERENCE_UI[value]
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => applySenderPreference(currentReviewPrimarySender, value)}
                          className={`rounded border px-2 py-1.5 text-left ${
                            active
                              ? 'border-cyan-600 bg-cyan-700/60 text-white'
                              : 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-cyan-200'
                          }`}
                        >
                          <p className="text-[11px] font-medium">{option.label}</p>
                          <p className={`mt-0.5 text-[10px] ${active ? 'text-cyan-100' : 'text-gray-400'}`}>
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-cyan-300">{senderPreferenceEffectLabel}</p>
                </div>
              )}

              {showArchiveCustomizationPanel && (
                <div className="rounded-lg border border-cyan-700/60 bg-gradient-to-b from-cyan-950/30 to-gray-950/45 p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-cyan-300">Decision summary</p>
                      <p className="text-sm font-semibold text-cyan-100">Archive subset decision diff</p>
                    </div>
                    <span className="rounded-full border border-cyan-800/70 bg-cyan-950/45 px-2 py-0.5 text-[11px] text-cyan-100">
                      {senderPreferenceUi.label}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded border border-gray-800 bg-gray-950/35 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Reviewed</p>
                      <p className="text-lg font-semibold text-gray-100">{currentReviewFetchedCount}</p>
                    </div>
                    <div className="rounded border border-emerald-900/60 bg-emerald-950/25 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-300">Archive selected</p>
                      <p className="text-lg font-semibold text-emerald-100">{selectedArchiveCount}</p>
                    </div>
                    <div className="rounded border border-amber-900/60 bg-amber-950/25 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-amber-300">Kept / excluded</p>
                      <p className="text-lg font-semibold text-amber-100">{excludedArchiveCount}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Risk:</span> {engagementRiskLabel}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Confidence:</span> {reviewEngagementSignals.confidence}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Effect if executed:</span> removes INBOX only from selected emails; remains in All Mail.
                    </p>
                    <p className="text-[11px] text-gray-300">
                      <span className="text-gray-400">Protected exclusions:</span> no delete, no unsubscribe, no sender blocking.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded border border-emerald-900/45 bg-emerald-950/15 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-emerald-300">Included examples</p>
                      {decisionDiffIncludedExamples.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                          {decisionDiffIncludedExamples.map((message) => (
                            <li key={message.message_id} className="text-[11px] text-gray-200">
                              {message.subject || '(no subject)'} · {message.from || 'Unknown sender'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-500">No included examples selected yet.</p>
                      )}
                    </div>
                    <div className="rounded border border-amber-900/45 bg-amber-950/15 p-2">
                      <p className="text-[11px] uppercase tracking-wide text-amber-300">Excluded examples</p>
                      {decisionDiffExcludedExamples.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                          {decisionDiffExcludedExamples.map((message) => (
                            <li key={message.message_id} className="text-[11px] text-gray-200">
                              {message.subject || '(no subject)'} · {message.from || 'Unknown sender'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[11px] text-gray-500">No exclusions applied.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showArchiveCustomizationPanel && (
                <div className="rounded-lg border border-cyan-900/35 bg-cyan-950/10 p-2.5 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-cyan-300">Customize before approval</p>
                      <p className="text-[11px] text-gray-300">
                        Choose what to keep/exclude before submitting the archive request.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearArchiveCustomization}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                    >
                      Reset selection
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-200">
                      Candidates {archiveCandidateIdsRaw.length}
                    </span>
                    <span className="rounded-full border border-emerald-900/70 bg-emerald-950/30 px-2 py-0.5 text-[11px] text-emerald-200">
                      Selected {selectedArchiveCount}
                    </span>
                    <span className="rounded-full border border-amber-900/70 bg-amber-950/30 px-2 py-0.5 text-[11px] text-amber-200">
                      Excluded/kept {excludedArchiveCount}
                    </span>
                  </div>
                  {archiveCandidatePatternCounts.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-gray-400">Select groups for archive (pattern groups)</p>
                      <div className="space-y-1">
                        {archiveCandidatePatternCounts.map((entry) => {
                          const excluded = archiveExcludedByManualPatternKeys.has(entry.patternKey)
                          return (
                            <label
                              key={entry.patternKey}
                              className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950/35 p-1.5 text-[11px]"
                            >
                              <span className="text-gray-200">{entry.patternLabel}</span>
                              <span className="flex items-center gap-2">
                                <span className="text-gray-500">({entry.count})</span>
                                <input
                                  type="checkbox"
                                  checked={!excluded}
                                  onChange={() => toggleArchivePatternExclusion(entry.patternKey)}
                                />
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {archiveCandidateSenderCounts.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-gray-400">Select groups for archive (sender groups)</p>
                      <div className="space-y-1">
                        {archiveCandidateSenderCounts.map((entry) => {
                          const excluded = archiveExcludedByManualSenderKeys.has(entry.senderKey)
                          return (
                            <label
                              key={entry.senderKey}
                              className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950/35 p-1.5 text-[11px]"
                            >
                              <span className="text-gray-200" title={entry.senderLabel}>
                                {entry.senderLabel}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-gray-500">({entry.count})</span>
                                <input
                                  type="checkbox"
                                  checked={!excluded}
                                  onChange={() => toggleArchiveSenderExclusion(entry.senderKey)}
                                />
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {archiveCustomizationRows.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-gray-400">
                        Review individual examples (unchecked = kept out of this archive request)
                      </p>
                      <div className="space-y-1">
                        {archiveCustomizationRows.map((message) => {
                          const excluded = archiveExcludedMessageIds.has(message.message_id)
                          return (
                            <label
                              key={message.message_id}
                              className={`flex items-start gap-2 rounded border p-1.5 ${
                                excluded
                                  ? 'border-amber-900/45 bg-amber-950/10'
                                  : 'border-gray-800 bg-gray-950/35'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!excluded}
                                onChange={() => toggleArchiveMessageExclusion(message.message_id)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-[11px] ${
                                    excluded ? 'text-amber-100/80' : 'text-gray-100'
                                  }`}
                                  title={message.subject || '(no subject)'}
                                >
                                  {message.subject || '(no subject)'}
                                </p>
                                <p
                                  className={`truncate text-[10px] ${
                                    excluded ? 'text-amber-300/70' : 'text-gray-400'
                                  }`}
                                  title={message.from || 'Unknown sender'}
                                >
                                  {message.from || 'Unknown sender'} · {message.date || 'Date unavailable'}
                                </p>
                                {excluded ? (
                                  <p className="mt-0.5 text-[10px] text-amber-300">Excluded</p>
                                ) : null}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500">
                    This customization only changes the selected subset for the approval request. No inbox changes occur now.
                  </p>
                </div>
              )}

              {currentStepDecisionSummary && (
                <ApprovalDecisionCard
                  summary={currentStepDecisionSummary}
                  className="rounded-lg border border-cyan-800/60 bg-gradient-to-b from-cyan-950/25 to-gray-950/40 p-3"
                />
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Current workflow progress</span>
                  <span>
                    {workflowCompletedSteps}/{workflowSteps.length} complete ({workflowProgressPercent}%)
                  </span>
                </div>
                <div className="h-2 rounded bg-gray-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all" style={{ width: `${workflowProgressPercent}%` }} />
                </div>
                <p className="text-[11px] text-gray-500">
                  Progress for the current cleanup flow, not total inbox cleanup.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-300">
                  Ready {candidateCounts.ready + cleanupClusterCounts.ready}
                </span>
                <span className="rounded-full border border-amber-900/70 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-200">
                  Pending {pendingApprovalCount}
                </span>
                <span className="rounded-full border border-blue-900/70 bg-blue-950/40 px-2 py-0.5 text-[11px] text-blue-200">
                  Approved {approvedApprovalCount}
                </span>
                <span className="rounded-full border border-emerald-900/70 bg-emerald-950/40 px-2 py-0.5 text-[11px] text-emerald-200">
                  Executed {executedApprovalCount}
                </span>
                {createdApprovalId ? (
                  <span className="rounded-full border border-cyan-900/60 bg-cyan-950/30 px-2 py-0.5 text-[11px] text-cyan-200">
                    Latest {createdApprovalId.slice(0, 8)}
                  </span>
                ) : null}
              </div>
              {effectiveRuntimeApprovalQueueSummary ? (
                <p className="text-[11px] text-gray-500">
                  Queue scope:{' '}
                  {effectiveRuntimeApprovalQueueSummary.scope === 'session'
                    ? `current session (${(effectiveRuntimeApprovalQueueSummary.scope_session_id || sessionId || '').slice(0, 8) || 'active'})`
                    : 'all approvals for this agent'}
                </p>
              ) : authoritativeQueueSyncPending ? (
                <p className="text-[11px] text-gray-500">Queue scope: syncing latest approval state…</p>
              ) : null}
              {showRuntimeDebugMode && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                    mode_applied: playground
                  </span>
                  <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                    lifecycle_state: {currentNextActionId || 'none'}
                  </span>
                  {latestReviewResult?.id && (
                    <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                      result_id: {latestReviewResult.id.slice(0, 18)}
                    </span>
                  )}
                  {createdApprovalId && (
                    <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                      approval_id: {createdApprovalId.slice(0, 18)}
                    </span>
                  )}
                  {currentReviewClusterId && (
                    <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                      cluster_id: {currentReviewClusterId}
                    </span>
                  )}
                  {runtimeActiveBatch && (
                    <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                      active_batch_id: {`${runtimeActiveBatch.sender}:${runtimeActiveBatch.executed_at}`.slice(0, 24)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {hasSecondaryRuntimeDetails && (
              <details className="rounded-lg border border-gray-800 bg-gray-950/30 p-2 text-xs text-gray-200">
                <summary className="cursor-pointer list-none font-medium text-gray-300">
                  Runtime details & evidence
                </summary>
                <div className="mt-2 max-h-[40vh] overflow-y-auto pr-1 space-y-1.5">
                  {runtimeEvidence && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Inbox analysis
                        <span className="ml-2 text-gray-400 font-normal">
                          {runtimeEvidence.inbox_analysis.sample_size} sampled
                        </span>
                      </summary>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-300">
                          Executed:{' '}
                          {runtimeEvidence.executed_at
                            ? new Date(runtimeEvidence.executed_at).toLocaleString()
                            : '—'}
                        </p>
                        <p className="text-gray-300">
                          Estimate: {runtimeEvidence.inbox_analysis.total_messages_estimate}
                        </p>
                        <p className="text-gray-400">
                          Top senders:{' '}
                          {runtimeEvidence.inbox_analysis.top_senders.length > 0
                            ? runtimeEvidence.inbox_analysis.top_senders
                                .slice(0, 4)
                                .map((entry) => `${entry.sender} (${entry.count})`)
                                .join(', ')
                            : 'none in sample'}
                        </p>
                      </div>
                    </details>
                  )}

                  {runtimeMailboxProfile && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Mailbox profile ({runtimeMailboxProfile.analysis_window_days}d)
                        <span className="ml-2 text-gray-400 font-normal">
                          Inbox est {runtimeMailboxProfile.native_signal_counts.inbox_recent_estimate}
                        </span>
                      </summary>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-gray-300">
                            Last generated:{' '}
                            {new Date(
                              runtimeMailboxProfile.freshness?.last_generated_at ||
                                runtimeMailboxProfile.generated_at
                            ).toLocaleString()}
                            {' '}· Window {runtimeMailboxProfile.analysis_window_days}d
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                mailboxProfileFreshness === 'stale'
                                  ? 'border-amber-900/70 bg-amber-950/40 text-amber-200'
                                  : mailboxProfileFreshness === 'cached'
                                    ? 'border-blue-900/70 bg-blue-950/40 text-blue-200'
                                    : 'border-emerald-900/70 bg-emerald-950/40 text-emerald-200'
                              }`}
                            >
                              {mailboxProfileFreshnessLabel}
                            </span>
                            <button
                              type="button"
                              onClick={refreshMailboxProfile}
                              disabled={runtimeRehydrating}
                              className={`px-2 py-1 rounded text-[11px] font-medium ${
                                runtimeRehydrating
                                  ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
                              }`}
                            >
                              {runtimeRehydrating ? 'Refreshing…' : 'Refresh profile'}
                            </button>
                          </div>
                        </div>
                        {hasEstimateOverlapNote ? (
                          <p className="text-gray-300">
                            Native signals show high-overlap directional volume across promotions, social,
                            updates, and unread buckets in this window.
                          </p>
                        ) : (
                          <p className="text-gray-300">
                            Native signals: promotions {runtimeMailboxProfile.native_signal_counts.category_promotions_estimate}
                            , social {runtimeMailboxProfile.native_signal_counts.category_social_estimate}, updates{' '}
                            {runtimeMailboxProfile.native_signal_counts.category_updates_estimate}, unread{' '}
                            {runtimeMailboxProfile.native_signal_counts.unread_recent_estimate}
                          </p>
                        )}
                        {hasEstimateOverlapNote ? (
                          <p className="text-gray-300">
                            Heuristic traffic signals are directional in this run (machine-generated vs likely human-priority overlap).
                          </p>
                        ) : (
                          <p className="text-gray-300">
                            Heuristics: machine-generated ~
                            {runtimeMailboxProfile.native_signal_counts.likely_machine_generated_recent_estimate},
                            likely human-priority ~
                            {runtimeMailboxProfile.native_signal_counts.likely_human_priority_recent_estimate}
                          </p>
                        )}
                        {runtimeMailboxProfile.sender_frequency.length > 0 && (
                          <p className="text-gray-400">
                            Top senders:{' '}
                            {runtimeMailboxProfile.sender_frequency
                              .slice(0, 4)
                              .map((entry) => `${entry.sender} (${entry.count})`)
                              .join(', ')}
                          </p>
                        )}
                        <details className="rounded border border-cyan-900/25 bg-gray-950/25 p-1.5">
                          <summary className="cursor-pointer list-none text-[11px] text-gray-400">
                            Protection / cleanup / rule opportunities
                          </summary>
                          <div className="mt-1 space-y-1">
                            {runtimeMailboxProfile.protection_candidates.slice(0, 3).map((candidate) => (
                              <p key={`protect-${candidate.title}`} className="text-gray-500">
                                Protect: {candidate.title}
                                {formatEstimateLabel(candidate.estimated_count, hasEstimateOverlapNote)}
                              </p>
                            ))}
                            {runtimeMailboxProfile.cleanup_candidates.slice(0, 3).map((candidate) => (
                              <p key={`cleanup-${candidate.title}`} className="text-gray-500">
                                Cleanup: {candidate.title}
                                {formatEstimateLabel(candidate.estimated_count, hasEstimateOverlapNote)}
                              </p>
                            ))}
                            {runtimeMailboxProfile.rule_opportunities.slice(0, 3).map((candidate) => (
                              <p key={`rule-${candidate.title}`} className="text-gray-500">
                                Rule: {candidate.title}
                                {formatEstimateLabel(candidate.estimated_count, hasEstimateOverlapNote)}
                              </p>
                            ))}
                          </div>
                        </details>
                        {runtimeMailboxProfile.notes.length > 0 && (
                          <p className="text-[11px] text-gray-500">
                            {runtimeMailboxProfile.notes[0]}
                          </p>
                        )}
                      </div>
                    </details>
                  )}

                  {runtimeCleanupStrategy && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Cleanup strategy
                        <span className="ml-2 text-gray-400 font-normal">
                          {runtimeCleanupStrategy.analysis_window_days}d · {runtimeCleanupStrategy.freshness_status} · {runtimeCleanupStrategy.recommendation_confidence}
                        </span>
                      </summary>
                      <div className="mt-1 space-y-1.5">
                        <p className="text-[11px] text-gray-500">{runtimeCleanupStrategy.confidence_note}</p>

                        <div className="grid gap-1.5 sm:grid-cols-2">
                          <div className="rounded border border-emerald-900/35 bg-emerald-950/10 p-1.5">
                            <p className="text-[11px] font-semibold text-emerald-200">Protect first</p>
                            {runtimeCleanupStrategy.protect_first.length > 0 ? (
                              runtimeCleanupStrategy.protect_first.slice(0, 2).map((item) => (
                                <p key={`protect-${item.title}`} className="text-[11px] text-gray-300">
                                  {item.title}
                                  {formatEstimateLabel(item.estimated_count, hasEstimateOverlapNote)} ·{' '}
                                  {compactRuntimeText(item.reason, 150)}
                                </p>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No high-signal protection groups identified.</p>
                            )}
                          </div>

                          <div className="rounded border border-cyan-900/35 bg-cyan-950/10 p-1.5">
                            <p className="text-[11px] font-semibold text-cyan-200">Best first cleanup waves</p>
                            {runtimeCleanupStrategy.best_first_cleanup_waves.length > 0 ? (
                              runtimeCleanupStrategy.best_first_cleanup_waves.slice(0, 2).map((item) => (
                                <p key={`wave-${item.title}`} className="text-[11px] text-gray-300">
                                  {item.title}
                                  {formatEstimateLabel(item.estimated_count, hasEstimateOverlapNote)} ·{' '}
                                  {compactRuntimeText(item.reason, 150)}
                                </p>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No low-risk cleanup wave identified yet.</p>
                            )}
                          </div>

                          <div className="rounded border border-blue-900/35 bg-blue-950/10 p-1.5">
                            <p className="text-[11px] font-semibold text-blue-200">Rule opportunities</p>
                            {runtimeCleanupStrategy.rule_opportunities.length > 0 ? (
                              runtimeCleanupStrategy.rule_opportunities.slice(0, 2).map((item) => (
                                <p key={`rule-${item.title}`} className="text-[11px] text-gray-300">
                                  {item.title}
                                  {formatEstimateLabel(item.estimated_count, hasEstimateOverlapNote)} ·{' '}
                                  {compactRuntimeText(item.reason, 150)}
                                </p>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No strong repeat-rule pattern yet.</p>
                            )}
                          </div>

                          <div className="rounded border border-amber-900/35 bg-amber-950/10 p-1.5">
                            <p className="text-[11px] font-semibold text-amber-200">Avoid / review carefully</p>
                            {runtimeCleanupStrategy.avoid_or_review_carefully.length > 0 ? (
                              runtimeCleanupStrategy.avoid_or_review_carefully.slice(0, 2).map((item) => (
                                <p key={`avoid-${item.title}`} className="text-[11px] text-gray-300">
                                  {item.title}
                                  {formatEstimateLabel(item.estimated_count, hasEstimateOverlapNote)} ·{' '}
                                  {compactRuntimeText(item.reason, 150)}
                                </p>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No additional caution segments surfaced.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  )}

                  {runtimeRecommendation && !currentStepIsRecommendedSenderReview && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Recommended batch
                        <span className="ml-2 text-gray-400 font-normal">
                          {runtimeRecommendation.sender} ({runtimeRecommendation.count})
                        </span>
                      </summary>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-300">{runtimeRecommendation.batch_title}</p>
                        <p className="text-gray-300">{runtimeRecommendation.reason}</p>
                      </div>
                    </details>
                  )}

                  {runtimeCleanupPlan && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Query cleanup clusters
                        <span className="ml-2 text-gray-400 font-normal">
                          {cleanupClusterCounts.ready} ready / {cleanupSectionPendingCount} pending
                        </span>
                      </summary>
                      <div className="mt-1 space-y-1.5">
                        {cleanupSectionIncludesNonClusterPending && (
                          <p className="text-[11px] text-gray-500">
                            Pending includes current-step approvals outside this cluster list (for example sender review).
                          </p>
                        )}
                        {hasEstimateOverlapNote && (
                          <p className="text-[11px] text-amber-300">
                            Volumes are directional estimates; related Gmail queries can overlap.
                          </p>
                        )}
                        {visibleCleanupClusters.map((cluster) => (
                          <div
                            key={cluster.cluster_id}
                            className="rounded border border-cyan-900/25 bg-gray-950/35 p-1.5 space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-cyan-100">
                                {cluster.title}
                                {formatEstimateLabel(cluster.estimated_count, hasEstimateOverlapNote)}
                              </p>
                              <span className="text-[11px] text-gray-400">
                                {suggestionStatusLabel(cluster.status)}
                              </span>
                            </div>
                            <p className="text-gray-300">{cluster.why_selected}</p>
                            {cluster.status === 'ready' ? (
                              <div className="space-y-1.5">
                                <div className="rounded border border-cyan-900/30 bg-cyan-950/10 p-1.5">
                                  <p className="text-[11px] uppercase tracking-wide text-cyan-300">What happens next</p>
                                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-200">
                                    <p>This step: Preview up to 25 matching emails for this cluster.</p>
                                    <p>Inbox changes now: none (review only).</p>
                                    <p>After review: assistant proposes safe next actions, still approval-gated.</p>
                                  </div>
                                </div>
                                {currentNextActionId === `review_query:${cluster.cluster_id}` ? (
                                  <p className="text-[11px] text-cyan-300">Managed from Current Step</p>
                                ) : hasBlockingApprovalQueue ? (
                                  <p className="text-[11px] text-gray-500">
                                    Waiting on approvals. Browse-only until Current Step is resolved.
                                  </p>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectAsCurrentStep(
                                        `review_query:${cluster.cluster_id}`,
                                        cluster.title
                                      )
                                    }
                                    className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                                  >
                                    Select as next step
                                  </button>
                                )}
                              </div>
                            ) : null}
                            <details className="rounded border border-cyan-900/25 bg-gray-950/20 p-1.5">
                              <summary className="cursor-pointer list-none text-[11px] text-gray-400">
                                Preview sample / query / safety (read-only)
                              </summary>
                              <div className="mt-1 space-y-1">
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
                              </div>
                            </details>
                          </div>
                        ))}
                        {hiddenCleanupClusterCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAllCleanupClusters((prev) => !prev)}
                            className="text-[11px] text-cyan-300 hover:text-cyan-200"
                          >
                            {showAllCleanupClusters
                              ? 'Show fewer clusters'
                              : `Show more clusters (${hiddenCleanupClusterCount})`}
                          </button>
                        )}
                      </div>
                    </details>
                  )}

                  {hasCurrentReviewResult && (
                    <div className="rounded border border-cyan-800/45 bg-cyan-950/15 p-2 text-xs text-gray-200">
                      <p className="font-semibold text-cyan-100">Current review result</p>
                      <p className="mt-1 text-[11px] text-gray-300">
                        Deep review evidence is handled in the dedicated result detail page to avoid context duplication here.
                      </p>
                      <button
                        type="button"
                        onClick={() => openReviewResultDetail(latestReviewResult?.id || null)}
                        className="mt-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                      >
                        Open full review details
                      </button>
                    </div>
                  )}

                  {runtimeReviewProposal &&
                    !currentStepIsRecommendedSenderReview &&
                    !reviewProposalSenderAlreadyReviewed && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Sender review proposal
                      </summary>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-300">
                          {runtimeReviewProposal.proposed_actions[0]?.args?.batch_title || 'Sender cluster review'}
                        </p>
                        <p className="text-gray-300">
                          {runtimeReviewProposal.proposed_actions[0]?.args?.sender || '—'} (
                          {runtimeReviewProposal.proposed_actions[0]?.args?.count ?? 0})
                        </p>
                        <p className="text-gray-300">{runtimeReviewProposal.reason}</p>
                        <p className="text-[11px] text-cyan-200">Review only · no inbox changes yet.</p>
                        {reviewProposalSender ? (
                          hasBlockingApprovalQueue ? (
                            <p className="text-[11px] text-gray-500">
                              Waiting on approvals. Browse-only until Current Step is resolved.
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                selectAsCurrentStep(
                                  reviewProposalStepId,
                                  runtimeReviewProposal.proposed_actions[0]?.args?.batch_title ||
                                    'Sender review'
                                )
                              }
                              className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                            >
                              Select as next step
                            </button>
                          )
                        ) : null}
                      </div>
                    </details>
                  )}

                  {runtimeReviewProposal && reviewProposalSenderAlreadyReviewed && (
                    <div className="rounded border border-gray-800 bg-gray-950/30 p-2 text-[11px] text-gray-400">
                      Sender review recommendation for {reviewProposalSender || 'this sender'} is already part of historical reviewed results and is not promoted as a current step.
                    </div>
                  )}

                  {effectiveRuntimeBatchSuggestions && latestReviewResult && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Batch suggestions for current reviewed result
                      </summary>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Bound to: {latestReviewResult.title}
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {batchSuggestionDefs.map((item) => {
                          const candidates = effectiveRuntimeBatchSuggestions[item.key]
                          const candidateState = batchSuggestionStateByKind[item.key]?.status || 'ready'
                          const candidateApprovalId = batchSuggestionStateByKind[item.key]?.approvalId
                          const sampleReason = candidates[0]?.reason || item.emptyLabel
                          const stateLabel =
                            candidateState === 'executed'
                              ? 'Already executed'
                              : candidateState === 'approved'
                                ? 'Approved'
                                : candidateState === 'pending_approval'
                                  ? 'Pending approval'
                                  : 'Current'
                          const lifecycleScopeLabel =
                            candidateState === 'executed' ? 'Historical' : 'Current workflow'
                          return (
                            <div
                              key={item.key}
                              className="rounded border border-cyan-900/25 bg-gray-950/25 p-1.5 space-y-1"
                            >
                              <p className="text-cyan-100">
                                {item.title}
                                {candidates.length > 0 ? ` (${candidates.length})` : ''}
                              </p>
                              <p className="text-gray-500">
                                {stateLabel} · {lifecycleScopeLabel}
                                {candidateApprovalId ? ` (${candidateApprovalId})` : ''}
                              </p>
                              <p className="text-[11px] text-gray-300">{sampleReason}</p>
                              {candidateState === 'ready' && canPromoteCleanupActions ? (
                                currentNextActionId === `batch:${item.key}` ? (
                                  <p className="text-[11px] text-cyan-300">Managed from Current Step</p>
                                ) : hasBlockingApprovalQueue ? (
                                  <p className="text-[11px] text-gray-500">
                                    Waiting on approvals. Browse-only until Current Step is resolved.
                                  </p>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectAsCurrentStep(`batch:${item.key}`, item.ctaLabel)
                                    }
                                    className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                                  >
                                    Select as next step
                                  </button>
                                )
                              ) : candidateState === 'ready' ? (
                                <p className="text-[11px] text-amber-300">
                                  Refresh 30-day mailbox profile before promoting cleanup approvals.
                                </p>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  )}

                  {hasStaleBatchSuggestionContext && (
                    <div className="rounded border border-gray-800 bg-gray-950/30 p-2 text-[11px] text-gray-400">
                      Batch suggestions are available for a previous reviewed batch. Open that result detail to inspect historical suggestions.
                    </div>
                  )}
                  {hasCurrentReviewResult && !effectiveRuntimeBatchSuggestions && !hasStaleBatchSuggestionContext && (
                    <div className="rounded border border-gray-800 bg-gray-950/30 p-2 text-[11px] text-gray-400">
                      No current action suggestions are bound to this reviewed result yet. Open result detail for full context before proposing the next step.
                    </div>
                  )}

                  {(runtimeReviewResults.length > 1 || runtimeArchiveEvidence || senderReviewIsHistorical || queryReviewIsHistorical) && (
                    <details className="rounded border border-gray-800 bg-gray-950/30 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-gray-300">
                        Historical timeline
                      </summary>
                      <div className="mt-1 space-y-1">
                        {runtimeReviewResults.length > 1 && (
                          <p className="text-[11px] text-gray-400">
                            Reviewed batches: {runtimeReviewResults.length} total. Latest historical batch:{' '}
                            {runtimeReviewResults[1]?.title || 'n/a'}.
                          </p>
                        )}
                        {runtimeArchiveEvidence && (
                          <p className="text-[11px] text-gray-400">
                            Latest archive event: {runtimeArchiveEvidence.archive_result.archived_count}/
                            {runtimeArchiveEvidence.archive_result.requested_count} ·{' '}
                            {runtimeArchiveEvidence.executed_at
                              ? new Date(runtimeArchiveEvidence.executed_at).toLocaleString()
                              : 'time unavailable'}
                            {archiveEvidenceIsHistorical ? ' (historical)' : ''}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => openReviewResultDetail(latestReviewResult?.id || null)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                        >
                          Open review detail history
                        </button>
                      </div>
                    </details>
                  )}

                  {runtimeProposal && !currentStepIsAnalyze && (
                    <details className="rounded border border-cyan-900/35 bg-gray-900/35 p-2 text-xs text-gray-200">
                      <summary className="cursor-pointer list-none font-semibold text-cyan-100">
                        Analyze-inbox proposal
                      </summary>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-300">{runtimeProposal.reason}</p>
                        <p className="text-[11px] text-cyan-200">Review only · no inbox changes yet.</p>
                        <pre className="rounded bg-gray-950 p-1.5 text-[11px] overflow-x-auto">{`{ "tool": "gmail", "action": "analyze_inbox" }`}</pre>
                        {hasBlockingApprovalQueue ? (
                          <p className="text-[11px] text-gray-500">
                            Waiting on approvals. Browse-only until Current Step is resolved.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => selectAsCurrentStep('analyze_inbox', 'Analyze inbox sample')}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
                          >
                            Select as next step
                          </button>
                        )}
                      </div>
                    </details>
                  )}

                  {createdApprovalId && (
                    <div className="rounded border border-emerald-900/70 bg-emerald-950/30 p-2 text-xs text-emerald-100">
                      Approval created: <span className="font-mono">{createdApprovalId}</span>
                    </div>
                  )}

                  {showRuntimeDebugMode &&
                    (runtimeActiveWorkItem || runtimeEvidenceBlocks.length > 0 || runtimeSuggestionSets.length > 0) && (
                    <details className="rounded border border-gray-800 bg-gray-950/20 p-2 text-xs text-gray-300">
                      <summary className="cursor-pointer list-none text-gray-400">
                        Technical internals (debug)
                      </summary>
                      <div className="mt-1 space-y-1.5">
                        {runtimeActiveWorkItem && (
                          <div className="rounded border border-gray-800 bg-gray-950/30 p-1.5">
                            <p className="text-gray-200">{runtimeActiveWorkItem.title}</p>
                            <p className="text-gray-400">{runtimeActiveWorkItem.summary}</p>
                          </div>
                        )}
                        {runtimeEvidenceBlocks.length > 0 && (
                          <p className="text-gray-400">
                            Evidence blocks: {runtimeEvidenceBlocks.length}
                          </p>
                        )}
                        {runtimeSuggestionSets.length > 0 && (
                          <p className="text-gray-400">
                            Suggestion sets: {runtimeSuggestionSets.length}
                          </p>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </details>
            )}
          </section>
        )}

        {/* Chat window */}
        <div className="mb-2 flex items-end justify-between">
          <p className="text-lg font-semibold text-gray-100">Conversation</p>
          <p className="text-[11px] text-gray-500">Playground chat</p>
        </div>
        <div className="flex-1 border border-gray-600/80 rounded-lg p-3 bg-gray-950/70 shadow-[0_0_0_1px_rgba(17,24,39,0.55)_inset] overflow-y-auto mb-3 space-y-3">
          {messages.length === 0 &&
            (showSessionRestorePlaceholder ? (
              <div className="rounded border border-gray-700/70 bg-gray-900/70 p-3 text-xs text-gray-300 space-y-1">
                <p className="font-medium text-gray-200">Restoring conversation context…</p>
                <p>Loading your active Playground session and runtime state.</p>
              </div>
            ) : conversationResetting ? (
              <div className="rounded border border-gray-700/70 bg-gray-900/70 p-3 text-xs text-gray-300 space-y-1">
                <p className="font-medium text-gray-200">Starting a fresh Playground session…</p>
                <p>Previous conversation context was cleared. No inbox actions are being run.</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {freshStartMode
                  ? 'Fresh start active. Ask the assistant to begin a new inbox workflow.'
                  : agentExperienceExamples.emptyHint}
              </p>
            ))}

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
            placeholder={agentExperienceExamples.placeholder}
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
                logSessionDecision('clear_conversation_applied', {
                  session_id: sessionIdToClear || null,
                  message_count: messagesRef.current.length,
                })
                messagesRef.current = []
                setMessages([])
                setInput('')
                setEditingIndex(null)
                setEditDraft('')
                setDeclinedStepKeys([])
                setAlternateStepHint(null)
                setSkippedStepHistory([])
                setPreferredStepId(null)
                setCreatedApprovalId(null)
                setCreatedApprovalKind(null)
                if (sessionIdToClear) {
                  const normalizedClearedSessionId = sessionIdToClear.trim()
                  if (normalizedClearedSessionId && agent?.id) {
                    setClearedChatSessionId(normalizedClearedSessionId)
                    writeSessionStorageValue(
                      clearedChatSessionKeyForAgent(agent.id),
                      normalizedClearedSessionId
                    )
                  }
                  setClearedSessionApprovalContext({
                    session_id: sessionIdToClear,
                    captured_at: new Date().toISOString(),
                  })
                }
                setFreshStartMode(false)
                clearSuppressUntilRef.current = 0
                runtimeStateEpochRef.current += 1
                if (typeof window !== 'undefined' && agent?.id) {
                  removeSessionStorageValue(freshStartKeyForAgent(agent.id))
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
