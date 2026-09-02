import {
  sanitizeDecisionWorkspaceProviderReceipt,
  type DecisionWorkspaceExecutionActionOutcome,
} from '@/lib/runtime/decisionWorkspaceExecutionModel'

export type GmailArchiveExecutionReceiptInput = Readonly<{
  requested_count: number
  archived_count: number
  message_ids: readonly string[]
  accepted_message_ids: readonly string[]
  failed_message_ids: readonly string[]
  partial_failure: boolean
}>

export type GmailDraftExecutionAttempt = Readonly<{
  phase: 'pre_dispatch_failure' | 'provider_response' | 'transport_failure'
  httpStatus?: number | null
  draftId?: string | null
  messageId?: string | null
  errorCode?: string | null
}>

export function classifyGmailArchiveExecution(
  input: GmailArchiveExecutionReceiptInput
): DecisionWorkspaceExecutionActionOutcome {
  const receipt = sanitizeDecisionWorkspaceProviderReceipt({
    provider_type: 'gmail',
    operation: 'archive_messages',
    requested_count: input.requested_count,
    accepted_count: input.archived_count,
    failed_count: input.failed_message_ids.length,
    message_ids: [...input.message_ids],
    accepted_message_ids: [...input.accepted_message_ids],
    failed_message_ids: [...input.failed_message_ids],
    partial_failure: input.partial_failure,
  })

  if (input.partial_failure || input.failed_message_ids.length > 0) {
    return {
      status: input.archived_count > 0 ? 'partial' : 'failed',
      receipt,
      errorCode: 'gmail_archive_partial_failure',
      reconciliationStatus: input.archived_count > 0 ? 'pending' : 'not_required',
    }
  }

  return {
    status: 'succeeded',
    receipt,
    errorCode: null,
    reconciliationStatus: 'not_required',
  }
}

export function classifyGmailDraftExecution(
  attempt: GmailDraftExecutionAttempt
): DecisionWorkspaceExecutionActionOutcome {
  const draftId = attempt.draftId?.trim() || ''
  const messageId = attempt.messageId?.trim() || ''
  const httpStatus = attempt.httpStatus ?? null

  if (
    attempt.phase === 'provider_response' &&
    httpStatus != null &&
    httpStatus >= 200 &&
    httpStatus < 300 &&
    draftId &&
    messageId
  ) {
    return {
      status: 'succeeded',
      receipt: sanitizeDecisionWorkspaceProviderReceipt({
        provider_type: 'gmail',
        operation: 'draft_email',
        http_status: httpStatus,
        draft_id: draftId,
        message_id: messageId,
      }),
      errorCode: null,
      reconciliationStatus: 'not_required',
    }
  }

  if (attempt.phase === 'pre_dispatch_failure') {
    return {
      status: 'failed',
      receipt: null,
      errorCode: attempt.errorCode?.trim() || 'gmail_draft_pre_dispatch_failure',
      reconciliationStatus: 'not_required',
    }
  }

  const definitiveFailure =
    attempt.phase === 'provider_response' &&
    httpStatus != null &&
    httpStatus >= 400 &&
    httpStatus < 500 &&
    httpStatus !== 408 &&
    httpStatus !== 409 &&
    httpStatus !== 429

  if (definitiveFailure) {
    return {
      status: 'failed',
      receipt: sanitizeDecisionWorkspaceProviderReceipt({
        provider_type: 'gmail',
        operation: 'draft_email',
        http_status: httpStatus,
      }),
      errorCode: attempt.errorCode?.trim() || 'gmail_draft_rejected',
      reconciliationStatus: 'not_required',
    }
  }

  return {
    status: 'indeterminate',
    receipt:
      httpStatus == null
        ? null
        : sanitizeDecisionWorkspaceProviderReceipt({
            provider_type: 'gmail',
            operation: 'draft_email',
            http_status: httpStatus,
          }),
    errorCode: attempt.errorCode?.trim() || 'gmail_draft_outcome_indeterminate',
    reconciliationStatus: 'manual_required',
  }
}
