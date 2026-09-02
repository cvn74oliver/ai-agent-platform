import { gmailCleanupDecisionWorkflowBlueprint } from '@/lib/integrations/gmail/gmailReviewUnitContract'
import {
  actionDefinitionById,
  failClosedDecisionWorkspaceActionGroup,
  finalizeDecisionWorkspaceApprovalQueue,
  finalizeDecisionWorkspaceActionGroup,
  type DecisionWorkspaceApprovalStatus,
  type DecisionWorkspaceActionAdapter,
  type DecisionWorkspaceActionGroup,
  type DecisionWorkspacePresentedApprovalAction,
  type DecisionWorkspacePresentedApprovalControl,
  type DecisionWorkspacePresentedApprovalRequest,
  type DecisionWorkspacePresentedAction,
} from '@/lib/runtime/decisionWorkspaceActionModel'
import type { GmailDecisionManagementSummaryData } from '@/lib/runtime/gmailCleanupWorkspace'
import type { DecisionWorkspaceActionDefinition } from '@/lib/runtime/decisionWorkspaceContract'
import type { OperationsRuntimeData } from '@/lib/runtime/operationsWorkspace'

type GmailManagementProfile = GmailDecisionManagementSummaryData['sender_profiles'][number]

const ADAPTER_ID = 'gmail.mailbox_cleanup.actions'
const SOURCE_ID = 'gmail.primary'
const workflow = gmailCleanupDecisionWorkflowBlueprint('subtype-first')
const workflowActions = workflow.actions

function requiredAction(actionId: string): DecisionWorkspaceActionDefinition | null {
  return actionDefinitionById(workflowActions, actionId)
}

function selectionAction(params: {
  id: string
  actionId: string
  label: string
  description: string
  tone: DecisionWorkspacePresentedAction['tone']
  compatibilityValue: 'KEEP' | 'CUSTOM_RULE' | 'ARCHIVE' | 'QUARANTINE'
}): DecisionWorkspacePresentedAction | null {
  const action = requiredAction(params.actionId)
  if (!action) return null
  return {
    id: params.id,
    catalogActionId: action.id,
    operation: 'select',
    workflowStageId: 'decision_mode',
    agentRoleId: 'human.reviewer',
    sourceId: action.effect === 'decision_only' ? null : SOURCE_ID,
    connectionId: action.effect === 'decision_only' ? null : SOURCE_ID,
    capability: action.capability,
    governingPrerequisite: null,
    declaredEffect: action.effect,
    invocationEffect: 'decision_only',
    risk: action.risk,
    reversibility: action.reversibility,
    approval: action.approval,
    supportsPreview: action.supportsPreview,
    idempotencyRequired: action.idempotencyRequired,
    label: params.label,
    description: params.description,
    pendingLabel: params.label,
    tone: params.tone,
    providerSpecific: action.effect !== 'decision_only',
    availability: { state: 'available', reason: null },
    compatibilityValue: params.compatibilityValue,
  }
}

function buildDecisionModeActions(): DecisionWorkspaceActionGroup {
  const actions = [
    selectionAction({
      id: 'gmail.decision.keep',
      actionId: 'keep',
      label: 'Keep All',
      description: 'Protect this sender and keep it out of the active work buckets.',
      tone: 'positive',
      compatibilityValue: 'KEEP',
    }),
    selectionAction({
      id: 'gmail.decision.custom_rule',
      actionId: 'custom_rule',
      label: 'Keep Some',
      description: 'Store this sender as a pending Custom Rule for later refinement.',
      tone: 'constructive',
      compatibilityValue: 'CUSTOM_RULE',
    }),
    selectionAction({
      id: 'gmail.decision.archive',
      actionId: 'archive',
      label: 'Archive All',
      description: 'Queue this sender for Archive. Gmail changes still wait in Management.',
      tone: 'primary',
      compatibilityValue: 'ARCHIVE',
    }),
    selectionAction({
      id: 'gmail.decision.quarantine',
      actionId: 'quarantine',
      label: 'Not Sure',
      description: 'Move this sender to Quarantine for later review.',
      tone: 'caution',
      compatibilityValue: 'QUARANTINE',
    }),
  ]

  if (actions.some((action) => action === null)) {
    return failClosedDecisionWorkspaceActionGroup({
      adapterId: ADAPTER_ID,
      surface: 'decision_mode',
      error: 'The Gmail workflow action catalog is incomplete.',
    })
  }

  return finalizeDecisionWorkspaceActionGroup({
    schemaVersion: 1,
    adapterId: ADAPTER_ID,
    workflowDefinitionId: workflow.workflowDefinition.definitionId,
    workflowVersion: workflow.workflowDefinition.version,
    runtimeInstanceId: null,
    subjectKind: workflow.decisionSubject.type,
    subjectId: null,
    surface: 'decision_mode',
    compatibilityValues: ['KEEP', 'CUSTOM_RULE', 'ARCHIVE', 'QUARANTINE'],
    actions: actions as DecisionWorkspacePresentedAction[],
    emptyLabel: 'No decision available right now',
    footnote: 'Decision Mode stores the destination. Gmail changes remain controlled in Management.',
  })
}

function providerArchiveAction(params: {
  operation: 'execute' | 'reverse'
  label: string
  pendingLabel: string
  description: string
  tone: DecisionWorkspacePresentedAction['tone']
  compatibilityValue: 'push_archive' | 'restore_archive'
}): DecisionWorkspacePresentedAction | null {
  const action = requiredAction('archive')
  if (!action) return null
  return {
    id: `gmail.management.archive.${params.operation}`,
    catalogActionId: action.id,
    operation: params.operation,
    workflowStageId: 'decision_management',
    agentRoleId: 'human.operator',
    sourceId: SOURCE_ID,
    connectionId: SOURCE_ID,
    capability: action.capability,
    governingPrerequisite: 'gmail.connection_and_scope_verified',
    declaredEffect: action.effect,
    invocationEffect: 'provider_write',
    risk: action.risk,
    reversibility: action.reversibility,
    approval: action.approval,
    supportsPreview: action.supportsPreview,
    idempotencyRequired: action.idempotencyRequired,
    label: params.label,
    description: params.description,
    pendingLabel: params.pendingLabel,
    tone: params.tone,
    providerSpecific: true,
    availability: { state: 'available', reason: null },
    compatibilityValue: params.compatibilityValue,
  }
}

function reopenAction(): DecisionWorkspacePresentedAction {
  return {
    id: 'gmail.management.decision.reopen',
    catalogActionId: null,
    operation: 'reopen',
    workflowStageId: 'decision_management',
    agentRoleId: 'human.reviewer',
    sourceId: null,
    connectionId: null,
    capability: 'decision.reopen',
    governingPrerequisite: null,
    declaredEffect: 'decision_only',
    invocationEffect: 'decision_only',
    risk: 'low',
    reversibility: 'not_applicable',
    approval: 'none',
    supportsPreview: false,
    idempotencyRequired: false,
    label: 'Reopen in Decisions',
    description: 'Return this sender to Decision Mode while preserving its management history.',
    pendingLabel: 'Reopening…',
    tone: 'secondary',
    providerSpecific: false,
    availability: { state: 'available', reason: null },
    compatibilityValue: 'reopen',
  }
}

function isGmailManagementProfile(value: unknown): value is GmailManagementProfile {
  if (!value || typeof value !== 'object') return false
  const destination = (value as { destination_state?: unknown }).destination_state
  return (
    destination === 'KEEP' ||
    destination === 'ARCHIVE' ||
    destination === 'CUSTOM_RULE' ||
    destination === 'QUARANTINE'
  )
}

function managementAvailability(profile: GmailManagementProfile): {
  push: boolean
  restore: boolean
  reopen: boolean
  footnote: string
} {
  if (profile.destination_state === 'KEEP') {
    return {
      push: false,
      restore: false,
      reopen: true,
      footnote: 'Quiet managed state. Keep stays visible in summary and filters without becoming active work.',
    }
  }
  if (profile.destination_state === 'QUARANTINE') {
    return {
      push: false,
      restore: false,
      reopen: true,
      footnote: 'Deferred on purpose. Reopen when this sender needs another decision pass.',
    }
  }
  if (profile.destination_state === 'CUSTOM_RULE') {
    const pushRequested = profile.execution_source === 'push_requested' || profile.execution_state === 'pending'
    return {
      push: false,
      restore: false,
      reopen: !pushRequested,
      footnote: pushRequested
        ? 'Waiting on external execution or verification before more actions become available.'
        : 'Valid managed state. Gmail action stays unavailable until the later refinement slice ships.',
    }
  }

  const pushRequested = profile.execution_source === 'push_requested' || profile.execution_state === 'pending'
  const applied = profile.execution_source === 'verified_applied' && profile.execution_state === 'succeeded'
  if (pushRequested) {
    return {
      push: false,
      restore: false,
      reopen: false,
      footnote: 'Waiting on Gmail execution or verification before more actions become available.',
    }
  }
  if (applied) {
    return {
      push: false,
      restore: true,
      reopen: false,
      footnote: 'Restore will return verified archive changes back into Inbox while keeping the sender managed.',
    }
  }
  return {
    push: true,
    restore: false,
    reopen: true,
    footnote: 'Push to Gmail is the only action here that changes Gmail in slice 1.',
  }
}

function buildManagementActions(compatibilityState: unknown): DecisionWorkspaceActionGroup {
  if (!isGmailManagementProfile(compatibilityState)) {
    return failClosedDecisionWorkspaceActionGroup({
      adapterId: ADAPTER_ID,
      surface: 'decision_management',
      error: 'Gmail management action state is missing or invalid.',
    })
  }

  const availability = managementAvailability(compatibilityState)
  const actions: DecisionWorkspacePresentedAction[] = []
  if (availability.push) {
    const push = providerArchiveAction({
      operation: 'execute',
      label: 'Push to Gmail',
      pendingLabel: 'Pushing…',
      description: 'Apply and verify the stored archive destination in Gmail.',
      tone: 'primary',
      compatibilityValue: 'push_archive',
    })
    if (!push) {
      return failClosedDecisionWorkspaceActionGroup({
        adapterId: ADAPTER_ID,
        surface: 'decision_management',
        error: 'The Gmail archive action definition is unavailable.',
      })
    }
    actions.push(push)
  }
  if (availability.restore) {
    const restore = providerArchiveAction({
      operation: 'reverse',
      label: 'Restore',
      pendingLabel: 'Restoring…',
      description: 'Return verified archive changes to Inbox while keeping the sender managed.',
      tone: 'caution',
      compatibilityValue: 'restore_archive',
    })
    if (!restore) {
      return failClosedDecisionWorkspaceActionGroup({
        adapterId: ADAPTER_ID,
        surface: 'decision_management',
        error: 'The Gmail archive reversal definition is unavailable.',
      })
    }
    actions.push(restore)
  }
  if (availability.reopen) actions.push(reopenAction())

  return finalizeDecisionWorkspaceActionGroup({
    schemaVersion: 1,
    adapterId: ADAPTER_ID,
    workflowDefinitionId: workflow.workflowDefinition.definitionId,
    workflowVersion: workflow.workflowDefinition.version,
    runtimeInstanceId: null,
    subjectKind: workflow.decisionSubject.type,
    subjectId: compatibilityState.sender_key,
    surface: 'decision_management',
    compatibilityValues: ['push_archive', 'restore_archive', 'reopen'],
    actions,
    emptyLabel: 'No action available right now',
    footnote: availability.footnote,
  })
}

const decisionModeActions = buildDecisionModeActions()

type RawApprovalAction = {
  tool: string
  action: string
  args?: unknown
}

type ApprovalProjectionInput = {
  data: OperationsRuntimeData | null
  localOverrides: Record<string, DecisionWorkspaceApprovalStatus>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return null
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim())
}

function safeIdentifier(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._:-]*$/.test(normalized) ? normalized : fallback
}

function normalizedApprovalStatus(value: unknown): DecisionWorkspaceApprovalStatus {
  return value === 'approved' || value === 'executed' || value === 'rejected'
    ? value
    : 'pending_approval'
}

function approvalProjectionInput(value: unknown): ApprovalProjectionInput | null {
  if (!isRecord(value)) return null
  const data = value.data == null || isRecord(value.data)
    ? (value.data as OperationsRuntimeData | null)
    : null
  if (value.data != null && data == null) return null
  if (!isRecord(value.localOverrides)) return null

  const localOverrides: Record<string, DecisionWorkspaceApprovalStatus> = {}
  for (const [approvalId, status] of Object.entries(value.localOverrides)) {
    if (
      status === 'pending_approval' ||
      status === 'approved' ||
      status === 'executed' ||
      status === 'rejected'
    ) {
      localOverrides[approvalId] = status
    }
  }
  return { data, localOverrides }
}

function actionScope(args: Record<string, unknown>, actionId: string) {
  const selectionCustomization = isRecord(args.selection_customization)
    ? args.selection_customization
    : null
  const selectionScope =
    selectionCustomization && typeof selectionCustomization.analysis_scope === 'string'
      ? selectionCustomization.analysis_scope.trim()
      : ''
  const matchingMessagesInScope = selectionCustomization
    ? toFiniteNumber(selectionCustomization.matching_messages_in_scope)
    : null
  const exactSelectedCountFromIds = Array.isArray(args.message_ids)
    ? args.message_ids.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).length
    : null
  const exactSelectedCountFromCustomization = selectionCustomization
    ? toFiniteNumber(selectionCustomization.selected_count)
    : null
  const exactSelectedCount = exactSelectedCountFromCustomization ?? exactSelectedCountFromIds
  const reviewedCount = selectionCustomization
    ? toFiniteNumber(selectionCustomization.reviewed_count)
    : null
  const candidateCount = selectionCustomization
    ? toFiniteNumber(selectionCustomization.candidate_count)
    : null
  const excludedCount = selectionCustomization
    ? toFiniteNumber(selectionCustomization.excluded_count)
    : null
  const affectedSubjectsCount = selectionCustomization
    ? (() => {
        const excluded = parseStringList(selectionCustomization.excluded_senders)
        if (excluded.length > 0) return excluded.length
        if (typeof args.sender === 'string' && args.sender.trim()) return 1
        return null
      })()
    : null
  const objectScope =
    (typeof args.source_label === 'string' && args.source_label.trim()) ||
    (typeof args.batch_title === 'string' && args.batch_title.trim()) ||
    (typeof args.sender === 'string' && args.sender.trim()) ||
    (typeof args.title === 'string' && args.title.trim()) ||
    (typeof args.query === 'string' && args.query.trim()) ||
    'Scope not specified'
  const scopeLabel =
    actionId === 'archive_messages'
      ? exactSelectedCount != null
        ? `Exact message-id scope (${exactSelectedCount} selected ids${
            selectionScope ? ` · window ${selectionScope}` : ''
          }${matchingMessagesInScope != null ? ` · matching in scope ${matchingMessagesInScope}` : ''})`
        : 'Cluster-derived scope (exact ids unavailable)'
      : actionId === 'draft_email'
        ? 'One Gmail draft; sending is not part of this action'
        : 'Read-only review/analysis scope'

  return {
    objectScope,
    scopeLabel,
    metrics: {
      exactSelectedCount,
      reviewedCount,
      candidateCount,
      excludedCount,
      affectedSubjectsCount,
    },
    evidenceBasis:
      typeof args.selection_basis === 'string' && args.selection_basis.trim()
        ? args.selection_basis.trim()
        : null,
    safeSignals: parseStringList(args.safe_signals),
    safetyExclusions: parseStringList(args.safety_exclusions),
  }
}

function validGmailActionArguments(actionId: string, argsValue: unknown): boolean {
  const args = isRecord(argsValue) ? argsValue : null
  if (actionId === 'analyze_inbox') return argsValue == null || Boolean(args && Object.keys(args).length === 0)
  if (!args) return false
  if (actionId === 'draft_email') {
    return (
      typeof args.to === 'string' &&
      args.to.trim().length > 0 &&
      typeof args.subject === 'string' &&
      typeof args.body === 'string'
    )
  }
  if (actionId === 'review_sender_cluster') {
    return typeof args.sender === 'string' && args.sender.trim().length > 0
  }
  if (actionId === 'review_query_cluster') {
    return ['cluster_id', 'cluster_type', 'title', 'query'].every(
      (key) => typeof args[key] === 'string' && (args[key] as string).trim().length > 0
    )
  }
  if (actionId === 'archive_messages') {
    const directIds = Array.isArray(args.message_ids)
      ? args.message_ids.some((entry) => typeof entry === 'string' && entry.trim().length > 0)
      : false
    const hasCluster = ['cluster_id', 'cluster_type', 'title', 'query'].every(
      (key) => typeof args[key] === 'string' && (args[key] as string).trim().length > 0
    )
    const hasPolicies = isRecord(args.sender_policies) && Object.keys(args.sender_policies).length > 0
    return directIds || (hasCluster && hasPolicies)
  }
  return false
}

function gmailApprovalAction(
  rawAction: RawApprovalAction,
  order: number
): DecisionWorkspacePresentedApprovalAction {
  const toolId = safeIdentifier(rawAction.tool, 'unknown')
  const actionId = safeIdentifier(rawAction.action, 'unknown')
  const args = isRecord(rawAction.args) ? rawAction.args : {}
  const scope = actionScope(args, actionId)
  const archiveDefinition = actionId === 'archive_messages' ? requiredAction('archive') : null
  const known = toolId === 'gmail' && [
    'draft_email',
    'analyze_inbox',
    'review_sender_cluster',
    'review_query_cluster',
    'archive_messages',
  ].includes(actionId)
  const supported = known && validGmailActionArguments(actionId, rawAction.args)

  const metadata: Record<string, {
    label: string
    description: string
    capability: string
    effect: DecisionWorkspaceActionDefinition['effect']
    risk: DecisionWorkspaceActionDefinition['risk']
    reversibility: DecisionWorkspaceActionDefinition['reversibility']
    approval: DecisionWorkspaceActionDefinition['approval']
    supportsPreview: boolean
    idempotencyRequired: boolean
    approvalEffect: string
    executionEffect: string
  }> = {
    draft_email: {
      label: 'Create Gmail draft',
      description: 'Prepare one Gmail draft for later human review; this action does not send it.',
      capability: 'gmail.create_draft',
      effect: 'provider_write',
      risk: 'medium',
      reversibility: 'reversible',
      approval: 'always',
      supportsPreview: true,
      idempotencyRequired: true,
      approvalEffect: 'This draft request becomes executable with the rest of the shown bundle.',
      executionEffect: 'On execute: create one Gmail draft. No message is sent.',
    },
    analyze_inbox: {
      label: 'Analyze inbox metadata',
      description: 'Run bounded Gmail metadata analysis without changing messages.',
      capability: 'gmail.analyze_inbox',
      effect: 'provider_read',
      risk: 'low',
      reversibility: 'not_applicable',
      approval: 'policy',
      supportsPreview: false,
      idempotencyRequired: false,
      approvalEffect: 'This analysis becomes executable with the rest of the shown bundle.',
      executionEffect: 'On execute: run bounded metadata analysis only. No inbox mutation.',
    },
    review_sender_cluster: {
      label: 'Review this sender cluster',
      description: 'Run read-only sender review and attach evidence.',
      capability: 'gmail.review_sender_cluster',
      effect: 'provider_read',
      risk: 'low',
      reversibility: 'not_applicable',
      approval: 'policy',
      supportsPreview: true,
      idempotencyRequired: false,
      approvalEffect: 'This sender review becomes executable with the rest of the shown bundle.',
      executionEffect: 'On execute: run read-only preview and attach review evidence. No inbox mutation.',
    },
    review_query_cluster: {
      label: 'Review this query cluster',
      description: 'Run read-only query-cluster review and attach evidence.',
      capability: 'gmail.review_query_cluster',
      effect: 'provider_read',
      risk: 'low',
      reversibility: 'not_applicable',
      approval: 'policy',
      supportsPreview: true,
      idempotencyRequired: false,
      approvalEffect: 'This query review becomes executable with the rest of the shown bundle.',
      executionEffect: 'On execute: run read-only preview and attach review evidence. No inbox mutation.',
    },
    archive_messages: {
      label: 'Archive selected emails',
      description: 'Apply the exact approved Gmail archive scope without deleting or unsubscribing.',
      capability: archiveDefinition?.capability || 'gmail.archive_messages',
      effect: 'provider_write',
      risk: archiveDefinition?.risk || 'medium',
      reversibility: archiveDefinition?.reversibility || 'reversible',
      approval: archiveDefinition?.approval || 'policy',
      supportsPreview: archiveDefinition?.supportsPreview ?? true,
      idempotencyRequired: archiveDefinition?.idempotencyRequired ?? true,
      approvalEffect: 'This exact archive scope becomes executable with the rest of the shown bundle.',
      executionEffect: 'On execute: remove INBOX label from selected emails only. No delete/unsubscribe.',
    },
  }
  const selected = metadata[actionId]
  const fallback = {
    label: 'Unsupported approval action',
    description: 'This tool/action combination is not declared by the selected Gmail adapter.',
    capability: 'framework.unsupported',
    effect: 'decision_only' as const,
    risk: 'critical' as const,
    reversibility: 'not_applicable' as const,
    approval: 'always' as const,
    supportsPreview: false,
    idempotencyRequired: false,
    approvalEffect: 'No approval effect is available.',
    executionEffect: 'No operation can run from this approval card.',
  }
  const presented = selected || fallback

  return {
    id: `gmail.approval.${actionId}.${order}`,
    order,
    toolId,
    actionId,
    supported,
    catalogActionId: actionId === 'archive_messages' ? archiveDefinition?.id || null : null,
    workflowStageId: 'runtime_approval',
    agentRoleId: 'human.operator',
    sourceId: supported ? SOURCE_ID : null,
    connectionId: supported ? SOURCE_ID : null,
    capability: presented.capability,
    declaredEffect: presented.effect,
    risk: presented.risk,
    reversibility: presented.reversibility,
    approval: presented.approval,
    supportsPreview: presented.supportsPreview,
    idempotencyRequired: presented.idempotencyRequired,
    providerSpecific: supported,
    label: presented.label,
    description: presented.description,
    objectScope: scope.objectScope,
    approvalEffect: presented.approvalEffect,
    executionEffect: presented.executionEffect,
    scopeLabel: scope.scopeLabel,
    affectedSubjectsLabel: 'affected senders',
    metrics: scope.metrics,
    evidenceBasis: scope.evidenceBasis,
    safeSignals: scope.safeSignals,
    safetyExclusions: supported
      ? scope.safetyExclusions
      : ['Controls are disabled because this action is missing supported Gmail metadata.'],
  }
}

function approvalControls(
  status: DecisionWorkspaceApprovalStatus,
  valid: boolean
): DecisionWorkspacePresentedApprovalControl[] {
  if (!valid) return []
  if (status === 'pending_approval') {
    return [
      {
        operation: 'approve',
        label: 'Approve request',
        pendingLabel: 'Approving…',
        tone: 'primary',
        availability: { state: 'available', reason: null },
        compatibilityValue: 'approved',
      },
      {
        operation: 'reject',
        label: 'Reject request',
        pendingLabel: 'Rejecting…',
        tone: 'caution',
        availability: { state: 'available', reason: null },
        compatibilityValue: 'rejected',
      },
    ]
  }
  if (status === 'approved') {
    return [
      {
        operation: 'execute',
        label: 'Execute approved action',
        pendingLabel: 'Executing…',
        tone: 'positive',
        availability: { state: 'available', reason: null },
        compatibilityValue: 'execute',
      },
    ]
  }
  return []
}

function approvalRequest(params: {
  key: string
  approvalId: string
  status: DecisionWorkspaceApprovalStatus
  title?: string
  reason?: string
  rawActions: RawApprovalAction[]
}): Omit<DecisionWorkspacePresentedApprovalRequest, 'validation'> {
  const actions = params.rawActions.map(gmailApprovalAction)
  const valid = actions.length > 0 && actions.every((action) => action.supported)
  const firstAction = actions[0]
  return {
    key: params.key,
    approvalId: params.approvalId,
    status: params.status,
    title:
      params.title ||
      (actions.length > 1
        ? `${actions.length} Gmail actions require one approval`
        : firstAction?.label || 'Approval request'),
    reason: params.reason || firstAction?.evidenceBasis || 'Runtime approval request',
    bundleLabel:
      actions.length === 1
        ? '1 proposed action'
        : `${actions.length} proposed actions — one approval covers this complete bundle`,
    atomicity: actions.length === 1 ? 'single_action' : 'workflow_declared_bundle',
    rejectionEffect:
      'Rejecting marks this complete request non-actionable. A new request can be created later from Review Detail.',
    actions,
    controls: approvalControls(params.status, valid),
  }
}

function buildApprovalQueue(compatibilityState: unknown) {
  const input = approvalProjectionInput(compatibilityState)
  const data = input?.data || null
  const overrides = input?.localOverrides || {}
  const requests: Omit<DecisionWorkspacePresentedApprovalRequest, 'validation'>[] = []
  const seen = new Set<string>()
  const addRequest = (request: Omit<DecisionWorkspacePresentedApprovalRequest, 'validation'>) => {
    if (seen.has(request.approvalId)) return
    seen.add(request.approvalId)
    requests.push({ ...request, status: overrides[request.approvalId] || request.status })
  }

  for (const queueItem of data?.runtime_approval_queue_items || []) {
    const approvalId = typeof queueItem.approval_id === 'string' ? queueItem.approval_id.trim() : ''
    if (!approvalId) continue
    const rawActions = Array.isArray(queueItem.proposed_actions)
      ? queueItem.proposed_actions.map((action) => ({
          tool: typeof action.tool === 'string' ? action.tool : '',
          action: typeof action.action === 'string' ? action.action : '',
          args: action.args,
        }))
      : []
    const firstArgs = isRecord(rawActions[0]?.args) ? rawActions[0].args : {}
    addRequest(
      approvalRequest({
        key: `queue:${approvalId}`,
        approvalId,
        status: normalizedApprovalStatus(queueItem.status),
        title:
          rawActions.length > 1
            ? `${rawActions.length} Gmail actions require one approval`
            : (typeof firstArgs.title === 'string' && firstArgs.title.trim()) || undefined,
        reason:
          (typeof queueItem.user_request === 'string' && queueItem.user_request.trim()) ||
          (typeof firstArgs.selection_basis === 'string' && firstArgs.selection_basis.trim()) ||
          undefined,
        rawActions,
      })
    )
  }

  for (const set of data?.runtime_suggestion_sets || []) {
    for (const candidate of set.candidates || []) {
      const approvalId = candidate.approval_id?.trim() || ''
      if (!approvalId) continue
      if (
        candidate.status !== 'pending_approval' &&
        candidate.status !== 'approved' &&
        candidate.status !== 'executed'
      ) {
        continue
      }
      addRequest(
        approvalRequest({
          key: `approval:${approvalId}`,
          approvalId,
          status: candidate.status,
          title: candidate.label,
          reason: candidate.reason,
          rawActions: [candidate.proposed_action],
        })
      )
    }
  }

  for (const cluster of data?.runtime_cleanup_plan?.clusters || []) {
    const approvalId = cluster.approval_id?.trim() || ''
    if (!approvalId) continue
    if (
      cluster.status !== 'pending_approval' &&
      cluster.status !== 'approved' &&
      cluster.status !== 'executed'
    ) {
      continue
    }
    addRequest(
      approvalRequest({
        key: `cluster:${cluster.cluster_id}:${approvalId}`,
        approvalId,
        status: cluster.status,
        title: cluster.title,
        reason: cluster.why_selected,
        rawActions: [
          {
            tool: 'gmail',
            action: 'review_query_cluster',
            args: {
              cluster_id: cluster.cluster_id,
              cluster_type: cluster.cluster_type,
              title: cluster.title,
              query: cluster.query,
              estimated_count: cluster.estimated_count,
              selection_basis: cluster.why_selected,
              safety_exclusions: ['No inbox mutation while pending/approved'],
            },
          },
        ],
      })
    )
  }

  requests.sort((a, b) => a.title.localeCompare(b.title))
  return finalizeDecisionWorkspaceApprovalQueue({
    schemaVersion: 1,
    adapterId: ADAPTER_ID,
    workflowDefinitionId: workflow.workflowDefinition.definitionId,
    workflowVersion: workflow.workflowDefinition.version,
    runtimeInstanceId: data?.session_id || null,
    subjectKind: 'approval_request',
    presentation: {
      eyebrow: 'Pending Approvals',
      title: 'Approval Queue (actual approval step)',
      description:
        'This is where real approve/reject decisions happen. Creating a request in Sender Decisions or Confirmation only sends it here; no inbox mutation happens until approve + execute.',
      steps: [
        '1) Sender Decisions / Confirmation: create request',
        '2) Pending Approvals (this page): approve or reject the complete shown bundle',
        '3) Execute approved action: apply every action in that approved bundle',
      ],
    },
    requests,
  })
}

export const gmailDecisionWorkspaceActionAdapter: DecisionWorkspaceActionAdapter = {
  id: ADAPTER_ID,
  decisionMode: {
    getActions: () => decisionModeActions,
  },
  management: {
    getActions: buildManagementActions,
  },
  approvals: {
    getQueue: buildApprovalQueue,
  },
}
