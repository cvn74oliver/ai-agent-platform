import type {
  RuntimeActiveBatch,
  RuntimeActiveWorkItem,
  RuntimeBatchSuggestions,
  RuntimeCleanupPlan,
  RuntimeCleanupStrategy,
  RuntimeEvidenceBlock,
  RuntimeMailboxProfile,
  RuntimeRecommendation,
  RuntimeReviewProposal,
} from '@/lib/runtime/gmailRuntimeAssembler'
import type { RuntimeSuggestionSet } from '@/lib/runtime/suggestionLifecycle'
import type {
  RuntimeArchiveEvidence,
  RuntimeApprovalQueueItem,
  RuntimeApprovalQueueSummary,
  RuntimeEvidence,
  RuntimeQueryReviewEvidence,
  RuntimeReviewResultItem,
  RuntimeReviewEvidence,
  SessionChatMessage,
} from '@/lib/runtime/stateLoaders'

export type RuntimeProposalAction = {
  tool: 'gmail'
  action: 'analyze_inbox'
}

export type RuntimeProposal = {
  user_request: string
  proposed_actions: RuntimeProposalAction[]
  approval_required: true
  reason: string
}

export type PlaygroundRuntimeResponseData = {
  reply?: string
  session_id?: string
  session_messages?: SessionChatMessage[]
  runtime_proposal?: RuntimeProposal
  runtime_evidence?: RuntimeEvidence
  runtime_recommendation?: RuntimeRecommendation
  runtime_review_proposal?: RuntimeReviewProposal
  runtime_review_evidence?: RuntimeReviewEvidence
  runtime_query_review_evidence?: RuntimeQueryReviewEvidence
  runtime_review_results?: RuntimeReviewResultItem[]
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
  runtime_approval_queue_items?: RuntimeApprovalQueueItem[]
}

export type PlaygroundRuntimeSuccessResponse = {
  ok: true
  data: PlaygroundRuntimeResponseData
}

export type PlaygroundRuntimeErrorResponse = {
  ok: false
  error: string
}

const ANALYZE_INBOX_ACTION: RuntimeProposalAction = {
  tool: 'gmail',
  action: 'analyze_inbox',
}

const ANALYZE_INBOX_USER_REQUEST = 'Analyze inbox metadata before suggesting cleanup actions.'
const ANALYZE_INBOX_REASON = 'Need inbox evidence before cleanup recommendations.'

function normalizeIntentText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function isInboxCleanupIntent(value: string): boolean {
  const text = normalizeIntentText(value)
  if (!text) return false

  const mentionsInbox = /\b(inbox|gmail|email|emails|mailbox|mail)\b/.test(text)
  const mentionsCleanup =
    /\b(clean ?up|cleanup|organize|organise|declutter|sort|triage|archive|label|spam|junk|unsubscribe)\b/.test(
      text
    )

  return mentionsInbox && mentionsCleanup
}

function isInboxRefreshIntent(value: string): boolean {
  const text = normalizeIntentText(value)
  if (!text) return false

  const mentionsInbox = /\b(inbox|gmail|email|mailbox|mail)\b/.test(text)
  const mentionsRefresh = /\b(refresh|reanaly[sz]e|re-?check|scan again|check again|run again|latest)\b/.test(
    text
  )

  return mentionsInbox && mentionsRefresh
}

function isExplicitRuntimeApprovalRequestIntent(value: string): boolean {
  const text = normalizeIntentText(value)
  if (!text) return false

  const mentionsInboxScope =
    /\bgmail\.analyze_inbox\b/.test(text) ||
    /\banaly[sz]e[_\s-]?inbox\b/.test(text) ||
    /\b(inbox|gmail|email|mailbox|mail)\b/.test(text)

  if (!mentionsInboxScope) return false

  const asksToCreateOrSendApproval =
    /\bcreate\b[\w\s-]{0,40}\bapproval\b(?:[\w\s-]{0,20}\brequest\b)?/.test(text) ||
    /\bsend\b[\w\s-]{0,20}\bfor\b[\w\s-]{0,20}\bapproval\b/.test(text) ||
    /\bqueue\b[\w\s-]{0,20}\bfor\b[\w\s-]{0,20}\bapproval\b/.test(text) ||
    /\bruntime approval request\b/.test(text)

  const asksForApprovalUi =
    /\bshow\b[\w\s-]{0,30}\bapproval\b[\w\s-]{0,20}\b(button|card)\b/.test(text) ||
    /\bproposed action card\b/.test(text) ||
    /\bapproval button\b/.test(text)

  return asksToCreateOrSendApproval || asksForApprovalUi
}

export function deriveAnalyzeInboxRuntimeProposal(params: {
  lastUserMessageText: string
  runtimeEvidence: RuntimeEvidence | null
}): RuntimeProposal | null {
  const text = params.lastUserMessageText
  const explicitRuntimeApprovalIntent =
    text.length > 0 && isExplicitRuntimeApprovalRequestIntent(text)

  const shouldProposeAnalyzeInbox =
    text.length > 0 &&
    (explicitRuntimeApprovalIntent ||
      (isInboxCleanupIntent(text) && (!params.runtimeEvidence || isInboxRefreshIntent(text))))

  return shouldProposeAnalyzeInbox
    ? {
        user_request: ANALYZE_INBOX_USER_REQUEST,
        proposed_actions: [ANALYZE_INBOX_ACTION],
        approval_required: true,
        reason: ANALYZE_INBOX_REASON,
      }
    : null
}

export function deriveInboxCleanupIntent(value: string): boolean {
  return isInboxCleanupIntent(value)
}

export function buildPlaygroundRuntimeResponseData(params: {
  responseSessionId: string | null
  sessionMessages?: SessionChatMessage[] | null
  runtimeProposal: RuntimeProposal | null
  runtimeEvidence: RuntimeEvidence | null
  runtimeRecommendation: RuntimeRecommendation | null
  runtimeReviewProposal: RuntimeReviewProposal | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
  runtimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  runtimeReviewResults: RuntimeReviewResultItem[]
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeBatchSuggestions: RuntimeBatchSuggestions | null
  runtimeCleanupPlan: RuntimeCleanupPlan | null
  runtimeMailboxProfile: RuntimeMailboxProfile | null
  runtimeCleanupStrategy: RuntimeCleanupStrategy | null
  runtimeActiveWorkItem: RuntimeActiveWorkItem | null
  runtimeEvidenceBlocks: RuntimeEvidenceBlock[]
  runtimeSuggestionSets: RuntimeSuggestionSet[]
  runtimeApprovalQueueSummary: RuntimeApprovalQueueSummary
  runtimeApprovalQueueItems: RuntimeApprovalQueueItem[]
}): PlaygroundRuntimeResponseData {
  const responseData: PlaygroundRuntimeResponseData = {}

  if (params.responseSessionId) {
    responseData.session_id = params.responseSessionId
  }
  if (Array.isArray(params.sessionMessages) && params.sessionMessages.length > 0) {
    responseData.session_messages = params.sessionMessages
  }

  if (params.runtimeProposal) {
    responseData.runtime_proposal = params.runtimeProposal
  }

  if (params.runtimeEvidence) {
    responseData.runtime_evidence = params.runtimeEvidence
  }

  if (params.runtimeRecommendation) {
    responseData.runtime_recommendation = params.runtimeRecommendation
  }

  if (params.runtimeReviewProposal) {
    responseData.runtime_review_proposal = params.runtimeReviewProposal
  }

  if (params.runtimeReviewEvidence) {
    responseData.runtime_review_evidence = params.runtimeReviewEvidence
  }

  if (params.runtimeQueryReviewEvidence) {
    responseData.runtime_query_review_evidence = params.runtimeQueryReviewEvidence
  }
  if (params.runtimeReviewResults.length > 0) {
    responseData.runtime_review_results = params.runtimeReviewResults
  }

  if (params.runtimeArchiveEvidence) {
    responseData.runtime_archive_evidence = params.runtimeArchiveEvidence
  }

  if (params.runtimeActiveBatch) {
    responseData.runtime_active_batch = params.runtimeActiveBatch
  }

  if (params.runtimeBatchSuggestions) {
    responseData.runtime_batch_suggestions = params.runtimeBatchSuggestions
  }

  if (params.runtimeCleanupPlan) {
    responseData.runtime_cleanup_plan = params.runtimeCleanupPlan
  }

  if (params.runtimeMailboxProfile) {
    responseData.runtime_mailbox_profile = params.runtimeMailboxProfile
  }

  if (params.runtimeCleanupStrategy) {
    responseData.runtime_cleanup_strategy = params.runtimeCleanupStrategy
  }

  if (params.runtimeActiveWorkItem) {
    responseData.runtime_active_work_item = params.runtimeActiveWorkItem
  }

  if (params.runtimeEvidenceBlocks.length > 0) {
    responseData.runtime_evidence_blocks = params.runtimeEvidenceBlocks
  }

  if (params.runtimeSuggestionSets.length > 0) {
    responseData.runtime_suggestion_sets = params.runtimeSuggestionSets
  }

  responseData.runtime_approval_queue_summary = params.runtimeApprovalQueueSummary
  if (params.runtimeApprovalQueueItems.length > 0) {
    responseData.runtime_approval_queue_items = params.runtimeApprovalQueueItems
  }

  return responseData
}

export function applyPlaygroundChatResultToResponseData(params: {
  responseData: PlaygroundRuntimeResponseData
  responseSessionId: string | null
  reply: string
}): PlaygroundRuntimeResponseData {
  const nextData: PlaygroundRuntimeResponseData = {
    ...params.responseData,
    reply: params.reply,
  }
  if (params.responseSessionId) {
    nextData.session_id = params.responseSessionId
  }
  return nextData
}

export function buildPlaygroundSuccessResponse(params: {
  responseData: PlaygroundRuntimeResponseData
}): PlaygroundRuntimeSuccessResponse {
  return {
    ok: true,
    data: params.responseData,
  }
}

export function buildPlaygroundOpenAiFailureResponse(params: {
  status: number
  msg: string
}): { status: 502; body: PlaygroundRuntimeErrorResponse } {
  return {
    status: 502,
    body: {
      ok: false,
      error: `OpenAI ${params.status}: ${params.msg}`,
    },
  }
}

export function buildPlaygroundErrorResponse(params: {
  status: number
  error: string
}): { status: number; body: PlaygroundRuntimeErrorResponse } {
  return {
    status: params.status,
    body: {
      ok: false,
      error: params.error,
    },
  }
}
