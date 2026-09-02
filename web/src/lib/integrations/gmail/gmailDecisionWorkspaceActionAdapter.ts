import { gmailCleanupDecisionWorkflowBlueprint } from '@/lib/integrations/gmail/gmailReviewUnitContract'
import {
  actionDefinitionById,
  failClosedDecisionWorkspaceActionGroup,
  finalizeDecisionWorkspaceActionGroup,
  type DecisionWorkspaceActionAdapter,
  type DecisionWorkspaceActionGroup,
  type DecisionWorkspacePresentedAction,
} from '@/lib/runtime/decisionWorkspaceActionModel'
import type { GmailDecisionManagementSummaryData } from '@/lib/runtime/gmailCleanupWorkspace'
import type { DecisionWorkspaceActionDefinition } from '@/lib/runtime/decisionWorkspaceContract'

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

export const gmailDecisionWorkspaceActionAdapter: DecisionWorkspaceActionAdapter = {
  id: ADAPTER_ID,
  decisionMode: {
    getActions: () => decisionModeActions,
  },
  management: {
    getActions: buildManagementActions,
  },
}
