import type {
  GmailCleanupDiscoveryData,
  GmailMailboxProfile,
} from '@/lib/integrations/gmail/inboxAnalysis'
import type {
  GmailMailboxIntelligenceData,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import type { OperationsSelectedClusterRailFamily } from '@/lib/runtime/operationsWorkspace'
import {
  applyRuntimeSuggestionStatuses,
  deriveRuntimeSuggestionPromptContext,
  type RuntimeSuggestedActionCandidate,
  type RuntimeSuggestionHistory,
  type RuntimeSuggestionPromptContext,
  type RuntimeSuggestionSet,
} from '@/lib/runtime/suggestionLifecycle'
import type {
  RuntimeArchiveEvidence,
  RuntimeEvidence,
  RuntimeQueryReviewEvidence,
  RuntimeReviewEvidence,
} from '@/lib/runtime/stateLoaders'

const REVIEW_SENDER_CLUSTER_USER_REQUEST =
  'Review the recommended sender cluster before cleanup actions.'
const REVIEW_SENDER_CLUSTER_REASON =
  'Use inbox evidence to focus first on the highest-volume sender cluster.'

export type RuntimeRecommendation = {
  sender: string
  count: number
  reason: string
  batch_title: string
}

export type RuntimeReviewProposalAction = {
  tool: 'gmail'
  action: 'review_sender_cluster'
  args: {
    sender: string
    count: number
    batch_title: string
  }
}

export type RuntimeReviewProposal = {
  user_request: string
  proposed_actions: RuntimeReviewProposalAction[]
  approval_required: true
  reason: string
}

export type RuntimeActiveBatch = {
  sender: string
  fetched_count: number
  batch_title: string
  executed_at: string
}

export type RuntimeBatchSuggestionCandidate = {
  message_id: string
  reason: string
}

export type RuntimeBatchSuggestions = {
  archive_candidates: RuntimeBatchSuggestionCandidate[]
  unsubscribe_candidates: RuntimeBatchSuggestionCandidate[]
  reply_candidates: RuntimeBatchSuggestionCandidate[]
  important_candidates: RuntimeBatchSuggestionCandidate[]
}

export type RuntimeEvidenceBlock = {
  id: string
  title: string
  summary: string
  source_event_type: 'execution_result'
  executed_at: string
  tool: string
  action: string
}

export type RuntimeActiveWorkItem = {
  id: string
  title: string
  summary: string
  status: 'active'
  executed_at: string
  source_tool: string
  source_action: string
  reference_ids: string[]
}

export type RuntimeCleanupCluster = {
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
    thread_id?: string
    history_id?: string
    internal_date_ms?: number
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
    label_ids?: string[]
    category_labels?: string[]
    is_in_inbox?: boolean
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
  risk_note: string
  safety_note: string
  indexed_signal_window?: {
    count_last_30d: number
    count_last_90d: number
    count_last_180d: number
    count_total_indexed: number
    unread_count: number
    important_count: number
    starred_count: number
    in_inbox_count: number
    category_mix: Array<{ category: string; count: number }>
    first_seen_at: string | null
    last_seen_at: string | null
    exactness: 'indexed_exact'
  }
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

export type RuntimeCleanupPlan = {
  generated_at: string
  planning_mode: 'read_only'
  safety_defaults: string[]
  clusters: RuntimeCleanupCluster[]
}

export type RuntimeMailboxProfile = GmailMailboxProfile
export type RuntimeMailboxIntelligence = GmailMailboxIntelligenceData
export type RuntimeSenderOverview = Record<string, GmailSenderWorkspaceData>

export type RuntimeCleanupStrategyItem = {
  title: string
  reason: string
  estimated_count: number | null
  query?: string
  source: 'gmail_native' | 'gmail_native_plus_heuristic' | 'computed_recent_window_sample'
}

export type RuntimeCleanupStrategy = {
  generated_at: string
  analysis_window_days: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'
  freshness_status: 'fresh' | 'cached' | 'stale' | 'unknown'
  recommendation_confidence: 'preliminary' | 'moderate'
  confidence_note: string
  protect_first: RuntimeCleanupStrategyItem[]
  best_first_cleanup_waves: RuntimeCleanupStrategyItem[]
  rule_opportunities: RuntimeCleanupStrategyItem[]
  avoid_or_review_carefully: RuntimeCleanupStrategyItem[]
}

export type AssembleGmailRuntimeStateParams = {
  runtimeEvidence: RuntimeEvidence | null
  latestRuntimeReviewEvidence: RuntimeReviewEvidence | null
  latestRuntimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  latestRuntimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeSuggestionHistory: RuntimeSuggestionHistory
  cleanupDiscoveryData?: GmailCleanupDiscoveryData | null
  selectedClusterRailFamily?: OperationsSelectedClusterRailFamily | null
}

export type AssembledGmailRuntimeState = {
  completedArchiveSenders: Set<string>
  runtimeRecommendation: RuntimeRecommendation | null
  runtimeReviewProposal: RuntimeReviewProposal | null
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeBatchSuggestions: RuntimeBatchSuggestions | null
  runtimeCleanupPlan: RuntimeCleanupPlan | null
  runtimeMailboxProfile: RuntimeMailboxProfile | null
  runtimeMailboxIntelligence: RuntimeMailboxIntelligence | null
  runtimeSenderOverview: RuntimeSenderOverview | null
  runtimeSelectedClusterRailFamily: OperationsSelectedClusterRailFamily | null
  runtimeCleanupStrategy: RuntimeCleanupStrategy | null
  runtimeSuggestionSets: RuntimeSuggestionSet[]
  runtimeSuggestionPromptContext: RuntimeSuggestionPromptContext
  runtimeEvidenceBlocks: RuntimeEvidenceBlock[]
  runtimeActiveWorkItem: RuntimeActiveWorkItem | null
}

function normalizeRuntimeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function hasCleanupPlannerContext(history: RuntimeSuggestionHistory): boolean {
  return history.requests.some((request) =>
    request.proposed_actions.some(
      (action) => action.tool === 'gmail' && action.action === 'review_query_cluster'
    )
  )
}

export function shouldRunGmailCleanupDiscovery(params: {
  runtimeEvidence: RuntimeEvidence | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
  runtimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeSuggestionHistory: RuntimeSuggestionHistory
  isInboxCleanupIntent: boolean
}): boolean {
  return (
    Boolean(params.runtimeEvidence) ||
    Boolean(params.runtimeReviewEvidence) ||
    Boolean(params.runtimeQueryReviewEvidence) ||
    Boolean(params.runtimeArchiveEvidence) ||
    hasCleanupPlannerContext(params.runtimeSuggestionHistory) ||
    params.isInboxCleanupIntent
  )
}

function deriveCompletedArchiveSenders(params: {
  history: RuntimeSuggestionHistory
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
}): Set<string> {
  const completedSenders = new Set<string>()

  if (params.runtimeArchiveEvidence?.archive_result.sender) {
    const sender = normalizeRuntimeString(params.runtimeArchiveEvidence.archive_result.sender)
    if (sender) completedSenders.add(sender)
  }

  for (const request of params.history.requests) {
    if (!params.history.executed_approvals.has(request.approval_id)) continue

    for (const action of request.proposed_actions) {
      if (action.tool !== 'gmail' || action.action !== 'archive_messages') continue
      const args =
        typeof action.args === 'object' && action.args !== null
          ? (action.args as Record<string, unknown>)
          : null
      const sender = normalizeRuntimeString(args?.sender)
      if (sender) completedSenders.add(sender)
    }
  }

  return completedSenders
}

function deriveRuntimeRecommendation(
  runtimeEvidence: RuntimeEvidence | null,
  completedArchiveSenders: Set<string>
): RuntimeRecommendation | null {
  if (!runtimeEvidence) return null

  const rankedTopSenders = runtimeEvidence.inbox_analysis.top_senders
    .map((entry, index) => ({
      sender: typeof entry.sender === 'string' ? entry.sender.trim() : '',
      count: Number(entry.count),
      originalIndex: index,
    }))
    .filter(
      (entry) =>
        entry.sender.length > 0 &&
        Number.isFinite(entry.count) &&
        entry.count > 0 &&
        !completedArchiveSenders.has(normalizeRuntimeString(entry.sender))
    )
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      if (a.originalIndex !== b.originalIndex) return a.originalIndex - b.originalIndex
      return a.sender.localeCompare(b.sender, undefined, { sensitivity: 'base' })
    })

  const firstSenderCluster = rankedTopSenders[0]
  if (!firstSenderCluster) return null

  const sender = firstSenderCluster.sender
  const count = firstSenderCluster.count

  return {
    sender,
    count,
    reason: `${sender} is the highest-volume sender in the sampled inbox, so reviewing this cluster first should remove the largest chunk quickly.`,
    batch_title: `Batch 1: ${sender} review`,
  }
}

function deriveRuntimeReviewProposal(params: {
  runtimeRecommendation: RuntimeRecommendation | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
}): RuntimeReviewProposal | null {
  const { runtimeRecommendation, runtimeReviewEvidence } = params
  if (!runtimeRecommendation) return null

  if (runtimeReviewEvidence) {
    const reviewedSender = normalizeRuntimeString(runtimeReviewEvidence.sender_review.sender)
    const recommendedSender = normalizeRuntimeString(runtimeRecommendation.sender)
    if (reviewedSender && recommendedSender && reviewedSender === recommendedSender) {
      return null
    }
  }

  return {
    user_request: REVIEW_SENDER_CLUSTER_USER_REQUEST,
    proposed_actions: [
      {
        tool: 'gmail',
        action: 'review_sender_cluster',
        args: {
          sender: runtimeRecommendation.sender,
          count: runtimeRecommendation.count,
          batch_title: runtimeRecommendation.batch_title,
        },
      },
    ],
    approval_required: true,
    reason: REVIEW_SENDER_CLUSTER_REASON,
  }
}

function deriveRuntimeActiveBatch(
  runtimeReviewEvidence: RuntimeReviewEvidence | null
): RuntimeActiveBatch | null {
  if (!runtimeReviewEvidence) return null

  const sender = runtimeReviewEvidence.sender_review.sender.trim()
  if (!sender) return null

  return {
    sender,
    fetched_count: runtimeReviewEvidence.sender_review.fetched_count,
    batch_title: `Batch 1: ${sender} review`,
    executed_at: runtimeReviewEvidence.executed_at,
  }
}

function deriveRuntimeBatchSuggestions(params: {
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
}): RuntimeBatchSuggestions | null {
  const { runtimeActiveBatch, runtimeReviewEvidence } = params
  if (!runtimeActiveBatch || !runtimeReviewEvidence) return null

  const activeSender = runtimeActiveBatch.sender.trim().toLowerCase()
  const evidenceSender = runtimeReviewEvidence.sender_review.sender.trim().toLowerCase()
  if (!activeSender || !evidenceSender || activeSender !== evidenceSender) return null

  const messages = runtimeReviewEvidence.sender_review.messages
  const archiveCandidates: RuntimeBatchSuggestionCandidate[] = []
  const unsubscribeCandidates: RuntimeBatchSuggestionCandidate[] = []
  const replyCandidates: RuntimeBatchSuggestionCandidate[] = []
  const importantCandidates: RuntimeBatchSuggestionCandidate[] = []

  const addUnique = (
    list: RuntimeBatchSuggestionCandidate[],
    messageId: string,
    reason: string
  ) => {
    if (list.some((item) => item.message_id === messageId)) return
    list.push({ message_id: messageId, reason })
  }

  const hasKeyword = (value: string, regex: RegExp) => regex.test(value)

  for (const message of messages) {
    const messageId = message.message_id.trim()
    if (!messageId) continue

    const subject = (message.subject || '').toLowerCase()
    const from = (message.from || '').toLowerCase()
    const snippet = (message.snippet || '').toLowerCase()
    const text = `${subject} ${from} ${snippet}`.trim()

    const newsletterOrPromo = hasKeyword(
      text,
      /\b(newsletter|digest|promotion|promo|sale|offer|discount|deal|marketing)\b/
    )
    const noReplyLike = hasKeyword(text, /\b(no-?reply|do-?not-?reply|noreply)\b/)
    const hasUnsubscribeCue = hasKeyword(
      text,
      /\b(unsubscribe|opt out|manage preferences|email preferences)\b/
    )
    const asksForResponse = hasKeyword(
      text,
      /\b(reply|respond|response needed|question|can you|could you|please review|action required|follow up|follow-up)\b/
    )
    const likelyImportant = hasKeyword(
      text,
      /\b(urgent|asap|deadline|invoice|payment|security|verification|account|contract|incident|issue|meeting)\b/
    )

    if (newsletterOrPromo || noReplyLike) {
      addUnique(
        archiveCandidates,
        messageId,
        'Looks like routine promo/newsletter traffic with low immediate action value.'
      )
    }

    if (hasUnsubscribeCue || (newsletterOrPromo && noReplyLike)) {
      addUnique(
        unsubscribeCandidates,
        messageId,
        'Contains unsubscribe cues or recurring sender patterns.'
      )
    }

    if (asksForResponse && !noReplyLike) {
      addUnique(
        replyCandidates,
        messageId,
        'Appears to request a response or explicit follow-up.'
      )
    }

    if (likelyImportant) {
      addUnique(
        importantCandidates,
        messageId,
        'Contains urgency or business-critical signals worth prioritizing.'
      )
    }
  }

  const limit = (items: RuntimeBatchSuggestionCandidate[]) => items.slice(0, 8)

  return {
    archive_candidates: limit(archiveCandidates),
    unsubscribe_candidates: limit(unsubscribeCandidates),
    reply_candidates: limit(replyCandidates),
    important_candidates: limit(importantCandidates),
  }
}

function deriveRuntimeSuggestionSet(params: {
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeBatchSuggestions: RuntimeBatchSuggestions | null
}): RuntimeSuggestionSet | null {
  const { runtimeActiveBatch, runtimeBatchSuggestions } = params
  if (!runtimeActiveBatch || !runtimeBatchSuggestions) return null

  const uniqueMessageIds = (items: RuntimeBatchSuggestionCandidate[]): string[] => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const item of items) {
      const id = item.message_id.trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      result.push(id)
    }
    return result
  }

  const candidates: RuntimeSuggestedActionCandidate[] = []
  const defs: Array<{
    key: keyof RuntimeBatchSuggestions
    id: string
    label: string
    tool: string
    action: string
    fallbackReason: string
  }> = [
    {
      key: 'archive_candidates',
      id: 'archive',
      label: 'Archive candidates',
      tool: 'gmail',
      action: 'archive_messages',
      fallbackReason: 'Low-value messages that are likely safe to archive after approval.',
    },
    {
      key: 'unsubscribe_candidates',
      id: 'unsubscribe',
      label: 'Unsubscribe candidates',
      tool: 'gmail',
      action: 'unsubscribe_senders',
      fallbackReason: 'Recurring sender traffic that may benefit from unsubscribe review.',
    },
    {
      key: 'reply_candidates',
      id: 'reply',
      label: 'Reply candidates',
      tool: 'gmail',
      action: 'draft_replies',
      fallbackReason: 'Messages that appear to need a response draft.',
    },
    {
      key: 'important_candidates',
      id: 'important',
      label: 'Important candidates',
      tool: 'gmail',
      action: 'mark_important',
      fallbackReason: 'Messages that look business-critical and need prioritization.',
    },
  ]

  for (const def of defs) {
    const entries = runtimeBatchSuggestions[def.key]
    const messageIds = uniqueMessageIds(entries)
    if (messageIds.length === 0) continue

    const reason = entries[0]?.reason || def.fallbackReason
    candidates.push({
      id: def.id,
      label: def.label,
      reason,
      message_ids: messageIds,
      status: 'ready',
      proposed_action: {
        tool: def.tool,
        action: def.action,
        args: {
          sender: runtimeActiveBatch.sender,
          batch_title: runtimeActiveBatch.batch_title,
          message_ids: messageIds,
        },
      },
    })
  }

  if (candidates.length === 0) return null

  return {
    id: 'active-batch-suggestions',
    title: 'Active batch suggestions',
    summary: `Approval-gated candidate actions for ${runtimeActiveBatch.batch_title}.`,
    candidates,
  }
}

function deriveRuntimeQueryReviewSuggestionSet(params: {
  runtimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
}): RuntimeSuggestionSet | null {
  const queryReview = params.runtimeQueryReviewEvidence?.query_review
  if (!queryReview) return null

  const candidateMessageIds: string[] = []
  const seen = new Set<string>()
  const lowRiskRegex = /\b(newsletter|digest|promotion|promo|deal|offer|unsubscribe|noreply|no-?reply)\b/

  for (const message of queryReview.reviewed_messages_preview) {
    const messageId = message.message_id.trim()
    if (!messageId || seen.has(messageId)) continue

    const text = `${message.subject || ''} ${message.from || ''} ${message.snippet || ''}`.toLowerCase()
    if (!lowRiskRegex.test(text)) continue

    seen.add(messageId)
    candidateMessageIds.push(messageId)
    if (candidateMessageIds.length >= 8) break
  }

  if (candidateMessageIds.length === 0) return null

  return {
    id: `query-review-suggestions:${queryReview.cluster_id}`,
    title: 'Reviewed query cluster suggestions',
    summary: `Approval-gated next-step candidates for ${queryReview.title}.`,
    candidates: [
      {
        id: `query-archive:${queryReview.cluster_id}`,
        label: 'Archive low-risk reviewed sample',
        reason:
          'Low-risk newsletter/no-reply style messages detected in the bounded reviewed sample. Keep approval in the loop.',
        message_ids: candidateMessageIds,
        status: 'ready',
        proposed_action: {
          tool: 'gmail',
          action: 'archive_messages',
          args: {
            batch_title: queryReview.title,
            message_ids: candidateMessageIds,
            cluster_id: queryReview.cluster_id,
            cluster_type: queryReview.cluster_type,
            query: queryReview.query,
          },
        },
      },
    ],
  }
}

function deriveRuntimeEvidenceBlocks(params: {
  runtimeEvidence: RuntimeEvidence | null
  runtimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
}): RuntimeEvidenceBlock[] {
  const blocks: RuntimeEvidenceBlock[] = []

  if (params.runtimeEvidence) {
    const topSenders = params.runtimeEvidence.inbox_analysis.top_senders
      .slice(0, 3)
      .map((entry) => `${entry.sender} (${entry.count})`)
      .join(', ')

    blocks.push({
      id: `gmail.analyze_inbox:${params.runtimeEvidence.approval_id || params.runtimeEvidence.executed_at}`,
      title: 'Inbox analysis evidence',
      summary: `Sample ${params.runtimeEvidence.inbox_analysis.sample_size}/${params.runtimeEvidence.inbox_analysis.total_messages_estimate}; top senders: ${topSenders || 'none'}.`,
      source_event_type: 'execution_result',
      executed_at: params.runtimeEvidence.executed_at,
      tool: params.runtimeEvidence.tool,
      action: params.runtimeEvidence.action,
    })
  }

  if (params.runtimeReviewEvidence) {
    blocks.push({
      id: `gmail.review_sender_cluster:${params.runtimeReviewEvidence.approval_id || params.runtimeReviewEvidence.executed_at}`,
      title: 'Reviewed batch evidence',
      summary: `Reviewed ${params.runtimeReviewEvidence.sender_review.fetched_count} messages for sender ${params.runtimeReviewEvidence.sender_review.sender}.`,
      source_event_type: 'execution_result',
      executed_at: params.runtimeReviewEvidence.executed_at,
      tool: params.runtimeReviewEvidence.tool,
      action: params.runtimeReviewEvidence.action,
    })
  }

  if (params.runtimeQueryReviewEvidence) {
    blocks.push({
      id: `gmail.review_query_cluster:${params.runtimeQueryReviewEvidence.approval_id || params.runtimeQueryReviewEvidence.executed_at}`,
      title: 'Query-cluster review evidence',
      summary: `Reviewed ${params.runtimeQueryReviewEvidence.query_review.fetched_count} messages for "${params.runtimeQueryReviewEvidence.query_review.title}".`,
      source_event_type: 'execution_result',
      executed_at: params.runtimeQueryReviewEvidence.executed_at,
      tool: params.runtimeQueryReviewEvidence.tool,
      action: params.runtimeQueryReviewEvidence.action,
    })
  }

  if (params.runtimeArchiveEvidence) {
    blocks.push({
      id: `gmail.archive_messages:${params.runtimeArchiveEvidence.approval_id || params.runtimeArchiveEvidence.executed_at}`,
      title: 'Archive execution evidence',
      summary: `Archived ${params.runtimeArchiveEvidence.archive_result.archived_count}/${params.runtimeArchiveEvidence.archive_result.requested_count} messages from Inbox.`,
      source_event_type: 'execution_result',
      executed_at: params.runtimeArchiveEvidence.executed_at,
      tool: params.runtimeArchiveEvidence.tool,
      action: params.runtimeArchiveEvidence.action,
    })
  }

  return blocks
}

function deriveRuntimeActiveWorkItem(params: {
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeEvidenceBlocks: RuntimeEvidenceBlock[]
}): RuntimeActiveWorkItem | null {
  const { runtimeActiveBatch, runtimeEvidenceBlocks } = params
  if (!runtimeActiveBatch) return null

  const referenceIds = runtimeEvidenceBlocks
    .filter((block) => block.tool === 'gmail' && block.action === 'review_sender_cluster')
    .map((block) => block.id)

  return {
    id: `gmail.review_sender_cluster:${runtimeActiveBatch.sender.toLowerCase()}`,
    title: runtimeActiveBatch.batch_title,
    summary: `Working sender cluster ${runtimeActiveBatch.sender} (${runtimeActiveBatch.fetched_count} reviewed messages).`,
    status: 'active',
    executed_at: runtimeActiveBatch.executed_at,
    source_tool: 'gmail',
    source_action: 'review_sender_cluster',
    reference_ids: referenceIds,
  }
}

function deriveCurrentBatchSender(params: {
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeRecommendation: RuntimeRecommendation | null
  runtimeReviewProposal: RuntimeReviewProposal | null
}): string {
  const fromActiveBatch = normalizeRuntimeString(params.runtimeActiveBatch?.sender)
  if (fromActiveBatch) return fromActiveBatch

  const fromReviewProposal = normalizeRuntimeString(
    params.runtimeReviewProposal?.proposed_actions?.[0]?.args?.sender
  )
  if (fromReviewProposal) return fromReviewProposal

  const fromRecommendation = normalizeRuntimeString(params.runtimeRecommendation?.sender)
  return fromRecommendation
}

function alignRuntimeReviewEvidenceToSender(params: {
  runtimeReviewEvidence: RuntimeReviewEvidence | null
  currentSender: string
}): RuntimeReviewEvidence | null {
  if (!params.runtimeReviewEvidence) return null
  if (!params.currentSender) return params.runtimeReviewEvidence

  const reviewSender = normalizeRuntimeString(params.runtimeReviewEvidence.sender_review.sender)
  if (!reviewSender || reviewSender !== params.currentSender) return null

  return params.runtimeReviewEvidence
}

function alignRuntimeArchiveEvidenceToSender(params: {
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  currentSender: string
}): RuntimeArchiveEvidence | null {
  if (!params.runtimeArchiveEvidence) return null
  if (!params.currentSender) return params.runtimeArchiveEvidence

  const archiveSender = normalizeRuntimeString(params.runtimeArchiveEvidence.archive_result.sender)
  if (!archiveSender || archiveSender !== params.currentSender) return null

  return params.runtimeArchiveEvidence
}

function deriveRuntimeCleanupPlan(params: {
  cleanupDiscoveryData: GmailCleanupDiscoveryData
}): RuntimeCleanupPlan | null {
  const clusters = params.cleanupDiscoveryData.clusters
    .filter((cluster) => cluster.estimated_count > 0 && cluster.query.trim().length > 0)
    .map((cluster) => {
      const messageIds = cluster.sample_preview
        .map((item) => item.message_id.trim())
        .filter(Boolean)
          return {
            cluster_id: cluster.cluster_id,
            cluster_type: cluster.cluster_type,
            title: cluster.title,
            query: cluster.query,
            why_selected: cluster.why_selected,
            sender_count: cluster.sender_count ?? 0,
            message_count: cluster.message_count ?? cluster.estimated_count,
            estimated_count: cluster.estimated_count,
            sample_preview: cluster.sample_preview,
            risk_note: cluster.risk_note,
        safety_note: cluster.safety_note,
        ...(cluster.indexed_signal_window
          ? { indexed_signal_window: cluster.indexed_signal_window }
          : {}),
        status: 'ready' as const,
        proposed_action: {
          tool: 'gmail' as const,
          action: 'review_query_cluster' as const,
          args: {
            cluster_id: cluster.cluster_id,
            cluster_type: cluster.cluster_type,
            title: cluster.title,
            query: cluster.query,
            estimated_count: cluster.estimated_count,
            message_ids: messageIds,
            risk_note: cluster.risk_note,
            safety_note: cluster.safety_note,
          },
        },
      }
    })

  if (clusters.length === 0) return null

  return {
    generated_at: params.cleanupDiscoveryData.generated_at,
    planning_mode: 'read_only',
    safety_defaults: params.cleanupDiscoveryData.safety_defaults,
    clusters,
  }
}

function deriveRuntimeCleanupSuggestionSet(
  runtimeCleanupPlan: RuntimeCleanupPlan | null
): RuntimeSuggestionSet | null {
  if (!runtimeCleanupPlan || runtimeCleanupPlan.clusters.length === 0) return null

  return {
    id: 'gmail-query-cleanup-suggestions',
    title: 'Query-backed cleanup clusters',
    summary: 'Approval-gated review proposals using Gmail-native query filters.',
    candidates: runtimeCleanupPlan.clusters.map((cluster) => ({
      id: `cleanup:${cluster.cluster_id}`,
      label: cluster.title,
      reason: cluster.why_selected,
      message_ids: cluster.proposed_action.args.message_ids,
      status: cluster.status,
      proposed_action: {
        tool: cluster.proposed_action.tool,
        action: cluster.proposed_action.action,
        args: cluster.proposed_action.args,
      },
    })),
  }
}

function deriveRuntimeCleanupStrategy(
  runtimeMailboxProfile: RuntimeMailboxProfile | null
): RuntimeCleanupStrategy | null {
  if (!runtimeMailboxProfile) return null

  const mapCandidate = (
    candidate: {
      title: string
      reason: string
      estimated_count: number
      query: string
      source: 'gmail_native' | 'gmail_native_plus_heuristic'
    }
  ): RuntimeCleanupStrategyItem => ({
    title: candidate.title,
    reason: candidate.reason,
    estimated_count: candidate.estimated_count,
    query: candidate.query,
    source: candidate.source,
  })

  const protectFirst = runtimeMailboxProfile.protection_candidates
    .slice()
    .sort((a, b) => b.estimated_count - a.estimated_count)
    .slice(0, 3)
    .map(mapCandidate)

  const cleanupWaves = runtimeMailboxProfile.cleanup_candidates
    .slice()
    .sort((a, b) => b.estimated_count - a.estimated_count)
    .slice(0, 4)
    .map(mapCandidate)

  const ruleOpportunities = runtimeMailboxProfile.rule_opportunities
    .slice()
    .sort((a, b) => b.estimated_count - a.estimated_count)
    .slice(0, 3)
    .map(mapCandidate)

  const avoidOrReviewCarefully: RuntimeCleanupStrategyItem[] = []
  const pushAvoidItem = (item: RuntimeCleanupStrategyItem) => {
    if (avoidOrReviewCarefully.some((entry) => entry.title === item.title)) return
    avoidOrReviewCarefully.push(item)
  }

  if (runtimeMailboxProfile.native_signal_counts.category_primary_estimate > 0) {
    const windowSuffix = analysisWindowQuerySuffix(runtimeMailboxProfile.analysis_window_days)
    pushAvoidItem({
      title: 'Primary category correspondence',
      reason:
        'Primary inbox traffic is more likely to include human-important threads. Keep this out of broad early cleanup waves.',
      estimated_count: runtimeMailboxProfile.native_signal_counts.category_primary_estimate,
      query: `in:inbox category:primary${windowSuffix}`,
      source: 'gmail_native',
    })
  }

  if (runtimeMailboxProfile.native_signal_counts.likely_human_priority_recent_estimate > 0) {
    const windowSuffix = analysisWindowQuerySuffix(runtimeMailboxProfile.analysis_window_days)
    pushAvoidItem({
      title: 'Likely human-priority correspondence',
      reason:
        'Signals indicate likely human/business-priority messages. Require review-first handling instead of bulk cleanup.',
      estimated_count: runtimeMailboxProfile.native_signal_counts.likely_human_priority_recent_estimate,
      query: `in:inbox category:primary${windowSuffix} -from:noreply -from:no-reply`,
      source: 'gmail_native_plus_heuristic',
    })
  }

  if (runtimeMailboxProfile.native_signal_counts.stale_unread_30d_estimate > 0) {
    pushAvoidItem({
      title: 'Stale unread backlog',
      reason:
        'Unread backlog can include deferred intent. Process in bounded review waves with approval, not bulk assumptions.',
      estimated_count: runtimeMailboxProfile.native_signal_counts.stale_unread_30d_estimate,
      query: 'in:inbox is:unread older_than:30d -is:starred -is:important',
      source: 'gmail_native',
    })
  }

  return {
    generated_at: new Date().toISOString(),
    analysis_window_days: runtimeMailboxProfile.analysis_window_days,
    freshness_status: runtimeMailboxProfile.freshness?.status || 'unknown',
    recommendation_confidence:
      runtimeMailboxProfile.recommendation_confidence === 'moderate' ? 'moderate' : 'preliminary',
    confidence_note:
      runtimeMailboxProfile.recommendation_confidence === 'moderate'
        ? 'Moderate confidence: Gmail-native estimates plus broader bounded metadata sampling support these cleanup priorities.'
        : 'Preliminary confidence: strategy is based on Gmail-native estimates plus bounded metadata sampling; validate with approval-gated reviews.',
    protect_first: protectFirst,
    best_first_cleanup_waves: cleanupWaves,
    rule_opportunities: ruleOpportunities,
    avoid_or_review_carefully: avoidOrReviewCarefully.slice(0, 4),
  }
}

function applyRuntimeCleanupPlanStatuses(params: {
  runtimeCleanupPlan: RuntimeCleanupPlan
  suggestionSetWithStatuses: RuntimeSuggestionSet
}): RuntimeCleanupPlan {
  const statusByCluster = new Map<
    string,
    { status: RuntimeSuggestedActionCandidate['status']; approval_id?: string }
  >()

  for (const candidate of params.suggestionSetWithStatuses.candidates) {
    const key = candidate.id.startsWith('cleanup:') ? candidate.id.slice('cleanup:'.length) : ''
    if (!key) continue
    statusByCluster.set(key, {
      status: candidate.status,
      ...(candidate.approval_id ? { approval_id: candidate.approval_id } : {}),
    })
  }

  return {
    ...params.runtimeCleanupPlan,
    clusters: params.runtimeCleanupPlan.clusters.map((cluster) => {
      const resolved = statusByCluster.get(cluster.cluster_id)
      return {
        ...cluster,
        status: resolved?.status ?? cluster.status,
        ...(resolved?.approval_id ? { approval_id: resolved.approval_id } : {}),
      }
    }),
  }
}

function analysisWindowQuerySuffix(
  analysisWindowDays: RuntimeMailboxProfile['analysis_window_days']
): string {
  return analysisWindowDays === 'all_indexed' ? '' : ` newer_than:${analysisWindowDays}d`
}

export function assembleGmailRuntimeState(
  params: AssembleGmailRuntimeStateParams
): AssembledGmailRuntimeState {
  const completedArchiveSenders = deriveCompletedArchiveSenders({
    history: params.runtimeSuggestionHistory,
    runtimeArchiveEvidence: params.latestRuntimeArchiveEvidence,
  })
  const runtimeRecommendation = deriveRuntimeRecommendation(
    params.runtimeEvidence,
    completedArchiveSenders
  )
  const runtimeReviewProposal = deriveRuntimeReviewProposal({
    runtimeRecommendation,
    runtimeReviewEvidence: params.latestRuntimeReviewEvidence,
  })
  const runtimeActiveBatchCandidate = deriveRuntimeActiveBatch(params.latestRuntimeReviewEvidence)
  const runtimeActiveBatch =
    runtimeActiveBatchCandidate &&
    !completedArchiveSenders.has(normalizeRuntimeString(runtimeActiveBatchCandidate.sender))
      ? runtimeActiveBatchCandidate
      : null

  const currentBatchSender = deriveCurrentBatchSender({
    runtimeActiveBatch,
    runtimeRecommendation,
    runtimeReviewProposal,
  })
  const runtimeReviewEvidence = alignRuntimeReviewEvidenceToSender({
    runtimeReviewEvidence: params.latestRuntimeReviewEvidence,
    currentSender: currentBatchSender,
  })
  const runtimeArchiveEvidence = alignRuntimeArchiveEvidenceToSender({
    runtimeArchiveEvidence: params.latestRuntimeArchiveEvidence,
    currentSender: currentBatchSender,
  })
  const runtimeMailboxProfile = params.cleanupDiscoveryData?.mailbox_profile || null
  const runtimeMailboxIntelligence =
    params.cleanupDiscoveryData?.mailbox_intelligence_snapshot || null
  const runtimeSenderOverview = params.cleanupDiscoveryData?.sender_overview_snapshot || null
  const runtimeSelectedClusterRailFamily = params.selectedClusterRailFamily || null

  const runtimeBatchSuggestions = deriveRuntimeBatchSuggestions({
    runtimeActiveBatch,
    runtimeReviewEvidence: params.latestRuntimeReviewEvidence,
  })
  const hasUsableMailboxProfile = Boolean(runtimeMailboxProfile)

  const runtimeSuggestionSetDraft = hasUsableMailboxProfile
    ? deriveRuntimeSuggestionSet({
        runtimeActiveBatch,
        runtimeBatchSuggestions,
      })
    : null
  const runtimeSuggestionSet = runtimeSuggestionSetDraft
    ? applyRuntimeSuggestionStatuses({
        suggestionSet: runtimeSuggestionSetDraft,
        history: params.runtimeSuggestionHistory,
      })
    : null

  const runtimeQueryReviewSuggestionSetDraft = hasUsableMailboxProfile
    ? deriveRuntimeQueryReviewSuggestionSet({
        runtimeQueryReviewEvidence: params.latestRuntimeQueryReviewEvidence,
      })
    : null
  const runtimeQueryReviewSuggestionSet = runtimeQueryReviewSuggestionSetDraft
    ? applyRuntimeSuggestionStatuses({
        suggestionSet: runtimeQueryReviewSuggestionSetDraft,
        history: params.runtimeSuggestionHistory,
      })
    : null

  let runtimeCleanupPlan: RuntimeCleanupPlan | null = null
  const runtimeCleanupStrategy = deriveRuntimeCleanupStrategy(runtimeMailboxProfile)
  if (params.cleanupDiscoveryData) {
    runtimeCleanupPlan = deriveRuntimeCleanupPlan({
      cleanupDiscoveryData: params.cleanupDiscoveryData,
    })
  }

  const runtimeCleanupSuggestionSetDraft = deriveRuntimeCleanupSuggestionSet(runtimeCleanupPlan)
  const runtimeCleanupSuggestionSet = runtimeCleanupSuggestionSetDraft
    ? applyRuntimeSuggestionStatuses({
        suggestionSet: runtimeCleanupSuggestionSetDraft,
        history: params.runtimeSuggestionHistory,
      })
    : null

  if (runtimeCleanupPlan && runtimeCleanupSuggestionSet) {
    runtimeCleanupPlan = applyRuntimeCleanupPlanStatuses({
      runtimeCleanupPlan,
      suggestionSetWithStatuses: runtimeCleanupSuggestionSet,
    })
  }

  const runtimeSuggestionSets: RuntimeSuggestionSet[] = []
  if (runtimeSuggestionSet) runtimeSuggestionSets.push(runtimeSuggestionSet)
  if (runtimeQueryReviewSuggestionSet) runtimeSuggestionSets.push(runtimeQueryReviewSuggestionSet)
  if (runtimeCleanupSuggestionSet) runtimeSuggestionSets.push(runtimeCleanupSuggestionSet)

  const runtimeSuggestionPromptContext = deriveRuntimeSuggestionPromptContext(runtimeSuggestionSets)
  const runtimeEvidenceBlocks = deriveRuntimeEvidenceBlocks({
    runtimeEvidence: params.runtimeEvidence,
    runtimeQueryReviewEvidence: params.latestRuntimeQueryReviewEvidence,
    runtimeArchiveEvidence,
    runtimeReviewEvidence,
  })
  const runtimeActiveWorkItem = deriveRuntimeActiveWorkItem({
    runtimeActiveBatch,
    runtimeEvidenceBlocks,
  })

  return {
    completedArchiveSenders,
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
  }
}
