export type WorkflowActionKind =
  | 'approval_submitted'
  | 'analyze'
  | 'review_sender'
  | 'review_query'
  | 'pending_approval'
  | 'profile_refresh'
  | 'generic'

export type WorkflowActionInput = {
  id: string | null
  kind: WorkflowActionKind | null
  title: string
  detail: string
  ctaLabel: string | null
}

export type DerivedWorkflowState = {
  stage:
    | 'awaiting_approval'
    | 'review_result_ready'
    | 'analysis_request'
    | 'review_request'
    | 'action_request'
    | 'idle'
  lifecycleLabel: string
  lifecycleDetail: string
  blockedReason: string | null
  currentStepTitle: string
  currentStepDetail: string
  currentStepCtaLabel: string | null
  currentStepCtaIntent: 'open_approvals' | 'create_request' | 'none'
  currentStepMutationHint: string
  showReviewResultsState: boolean
  readOnlyContextDetail: string
  isActionable: boolean
  artifactMode: 'current' | 'historical' | 'none'
}

export function derivePlaygroundWorkflowState(params: {
  hasBlockingApprovalQueue: boolean
  hasCurrentReviewResult: boolean
  selectedAction: WorkflowActionInput | null
  fallbackStepTitle: string
  fallbackStepDetail: string
}): DerivedWorkflowState {
  const action = params.selectedAction
  const showReviewResultsState = Boolean(params.hasCurrentReviewResult && !params.hasBlockingApprovalQueue)

  if (params.hasBlockingApprovalQueue) {
    return {
      stage: 'awaiting_approval',
      lifecycleLabel: 'Awaiting approval decision',
      lifecycleDetail:
        'A request is pending/approved in the queue. Resolve approvals before advancing workflow actions.',
      blockedReason: 'Pending or approved requests are unresolved.',
      currentStepTitle: action?.title || params.fallbackStepTitle,
      currentStepDetail:
        action?.detail ||
        'Resolve approval queue items before creating additional workflow requests.',
      currentStepCtaLabel: action?.ctaLabel || 'Open approvals',
      currentStepCtaIntent: 'open_approvals',
      currentStepMutationHint:
        'This step opens approvals only. Inbox mutation requires separate approve + execute steps.',
      showReviewResultsState,
      readOnlyContextDetail:
        'Runtime details remain browse-only while approvals are unresolved.',
      isActionable: true,
      artifactMode: params.hasCurrentReviewResult ? 'current' : 'historical',
    }
  }

  if (showReviewResultsState) {
    return {
      stage: 'review_result_ready',
      lifecycleLabel: 'Review result ready',
      lifecycleDetail:
        'A review just executed. Inspect current reviewed evidence before creating the next request.',
      blockedReason: null,
      currentStepTitle: params.fallbackStepTitle,
      currentStepDetail: params.fallbackStepDetail,
      currentStepCtaLabel: null,
      currentStepCtaIntent: 'none',
      currentStepMutationHint:
        'Inspect review evidence first. Any mutation still requires separate approve + execute steps.',
      showReviewResultsState: true,
      readOnlyContextDetail:
        'Current reviewed evidence is primary; historical evidence is secondary.',
      isActionable: false,
      artifactMode: 'current',
    }
  }

  if (action?.kind === 'analyze') {
    return {
      stage: 'analysis_request',
      lifecycleLabel: 'Analysis request stage',
      lifecycleDetail:
        'Start with bounded inbox analysis evidence before mutation recommendations.',
      blockedReason: null,
      currentStepTitle: action.title,
      currentStepDetail: action.detail,
      currentStepCtaLabel: action.ctaLabel,
      currentStepCtaIntent: 'create_request',
      currentStepMutationHint:
        'This step creates a request only. Inbox mutation happens later after separate approve + execute steps.',
      showReviewResultsState: false,
      readOnlyContextDetail:
        'Read-only evidence is available below; this step creates a request only.',
      isActionable: true,
      artifactMode: params.hasCurrentReviewResult ? 'historical' : 'none',
    }
  }

  if (action?.kind === 'review_sender' || action?.kind === 'review_query') {
    return {
      stage: 'review_request',
      lifecycleLabel: 'Review request stage',
      lifecycleDetail:
        'Create a bounded review request before any archive/mutation request is proposed.',
      blockedReason: null,
      currentStepTitle: action.title,
      currentStepDetail: action.detail,
      currentStepCtaLabel: action.ctaLabel,
      currentStepCtaIntent: 'create_request',
      currentStepMutationHint:
        'This step creates a request only. Inbox mutation happens later after separate approve + execute steps.',
      showReviewResultsState: false,
      readOnlyContextDetail:
        'Review details are read-only context; creating a request does not mutate inbox now.',
      isActionable: true,
      artifactMode: params.hasCurrentReviewResult ? 'historical' : 'none',
    }
  }

  if (action?.id?.startsWith('batch:')) {
    return {
      stage: 'action_request',
      lifecycleLabel: 'Action request stage',
      lifecycleDetail:
        'Evidence-backed action can be requested. Inbox mutation still requires later approve + execute steps.',
      blockedReason: null,
      currentStepTitle: action.title,
      currentStepDetail: action.detail,
      currentStepCtaLabel: action.ctaLabel,
      currentStepCtaIntent: 'create_request',
      currentStepMutationHint:
        'This step creates a request only. Inbox mutation happens later after separate approve + execute steps.',
      showReviewResultsState: false,
      readOnlyContextDetail:
        'Current reviewed evidence remains available for verification before request submission.',
      isActionable: true,
      artifactMode: params.hasCurrentReviewResult ? 'current' : 'historical',
    }
  }

  return {
    stage: 'idle',
    lifecycleLabel: 'Idle / advisory stage',
    lifecycleDetail: 'No active approval-gated step is queued.',
    blockedReason: null,
    currentStepTitle: action?.title || params.fallbackStepTitle,
    currentStepDetail: action?.detail || params.fallbackStepDetail,
    currentStepCtaLabel: action?.ctaLabel || null,
    currentStepCtaIntent: action?.ctaLabel ? 'create_request' : 'none',
    currentStepMutationHint:
      'Use read-only evidence to decide the next request. No inbox mutation occurs in advisory mode.',
    showReviewResultsState: false,
    readOnlyContextDetail:
      'Use runtime details as context and ask for the next safe recommended action.',
    isActionable: Boolean(action?.ctaLabel),
    artifactMode: params.hasCurrentReviewResult ? 'historical' : 'none',
  }
}
