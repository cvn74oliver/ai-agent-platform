import type { DecisionWorkspaceActionDefinition } from '@/lib/runtime/decisionWorkspaceContract'

export type DecisionWorkspaceActionSurface = 'decision_mode' | 'decision_management'
export type DecisionWorkspaceActionAdapterId = 'gmail'
export type DecisionWorkspaceActionOperation = 'select' | 'execute' | 'reverse' | 'reopen' | 'verify'
export type DecisionWorkspaceActionAvailabilityState =
  | 'available'
  | 'unavailable'
  | 'pending'
  | 'executed'
  | 'failed'
  | 'reverted'
export type DecisionWorkspaceActionTone = 'positive' | 'constructive' | 'primary' | 'caution' | 'secondary'

export type DecisionWorkspaceActionAvailability = Readonly<{
  state: DecisionWorkspaceActionAvailabilityState
  reason: string | null
}>

export type DecisionWorkspacePresentedAction = Readonly<{
  id: string
  catalogActionId: string | null
  operation: DecisionWorkspaceActionOperation
  workflowStageId: string
  agentRoleId: string
  sourceId: string | null
  connectionId: string | null
  capability: string
  governingPrerequisite: string | null
  declaredEffect: DecisionWorkspaceActionDefinition['effect']
  invocationEffect: DecisionWorkspaceActionDefinition['effect']
  risk: DecisionWorkspaceActionDefinition['risk']
  reversibility: DecisionWorkspaceActionDefinition['reversibility']
  approval: DecisionWorkspaceActionDefinition['approval']
  supportsPreview: boolean
  idempotencyRequired: boolean
  label: string
  description: string
  pendingLabel: string
  tone: DecisionWorkspaceActionTone
  providerSpecific: boolean
  availability: DecisionWorkspaceActionAvailability
  compatibilityValue: string | null
}>

export type DecisionWorkspaceActionGroup = Readonly<{
  schemaVersion: 1
  adapterId: string
  workflowDefinitionId: string
  workflowVersion: string
  runtimeInstanceId: string | null
  subjectKind: string
  subjectId: string | null
  surface: DecisionWorkspaceActionSurface
  compatibilityValues: readonly string[]
  actions: readonly DecisionWorkspacePresentedAction[]
  emptyLabel: string
  footnote: string
  validation: Readonly<{
    valid: boolean
    errors: readonly string[]
  }>
}>

export type DecisionWorkspaceActionAdapter = Readonly<{
  id: string
  decisionMode: Readonly<{
    getActions: () => DecisionWorkspaceActionGroup
  }>
  management: Readonly<{
    getActions: (compatibilityState: unknown) => DecisionWorkspaceActionGroup
  }>
}>

const validIdentifier = (value: string): boolean => /^[a-z0-9][a-z0-9._:-]*$/.test(value)
const nonEmpty = (value: string): boolean => value.trim().length > 0
const validOpaqueIdentity = (value: string): boolean =>
  nonEmpty(value) && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value)
const validOperations = new Set<DecisionWorkspaceActionOperation>([
  'select',
  'execute',
  'reverse',
  'reopen',
  'verify',
])
const validAvailabilityStates = new Set<DecisionWorkspaceActionAvailabilityState>([
  'available',
  'unavailable',
  'pending',
  'executed',
  'failed',
  'reverted',
])
const validTones = new Set<DecisionWorkspaceActionTone>([
  'positive',
  'constructive',
  'primary',
  'caution',
  'secondary',
])
const validEffects = new Set<DecisionWorkspaceActionDefinition['effect']>([
  'decision_only',
  'provider_read',
  'provider_write',
])
const validRisks = new Set<DecisionWorkspaceActionDefinition['risk']>([
  'low',
  'medium',
  'high',
  'critical',
])
const validReversibility = new Set<DecisionWorkspaceActionDefinition['reversibility']>([
  'reversible',
  'compensating_action',
  'irreversible',
  'not_applicable',
])
const validApprovals = new Set<DecisionWorkspaceActionDefinition['approval']>([
  'none',
  'policy',
  'always',
])

function validateAction(
  action: DecisionWorkspacePresentedAction,
  compatibilityValues: ReadonlySet<string>
): string[] {
  const errors: string[] = []
  if (!validIdentifier(action.id)) errors.push(`Invalid action id: ${action.id || '<missing>'}.`)
  if (action.catalogActionId !== null && !validIdentifier(action.catalogActionId)) {
    errors.push(`Invalid catalog action id for ${action.id}.`)
  }
  if (!validOperations.has(action.operation)) errors.push(`Invalid operation for ${action.id}.`)
  if (!validIdentifier(action.workflowStageId)) errors.push(`Invalid workflow stage for ${action.id}.`)
  if (!validIdentifier(action.agentRoleId)) errors.push(`Invalid agent role for ${action.id}.`)
  if (!validIdentifier(action.capability)) errors.push(`Invalid capability for ${action.id}.`)
  if (!validEffects.has(action.declaredEffect)) errors.push(`Invalid declared effect for ${action.id}.`)
  if (!validEffects.has(action.invocationEffect)) errors.push(`Invalid invocation effect for ${action.id}.`)
  if (!validRisks.has(action.risk)) errors.push(`Invalid risk for ${action.id}.`)
  if (!validReversibility.has(action.reversibility)) {
    errors.push(`Invalid reversibility for ${action.id}.`)
  }
  if (!validApprovals.has(action.approval)) errors.push(`Invalid approval for ${action.id}.`)
  if (!validTones.has(action.tone)) errors.push(`Invalid control tone for ${action.id}.`)
  if (!validAvailabilityStates.has(action.availability.state)) {
    errors.push(`Invalid availability state for ${action.id}.`)
  }
  if (!nonEmpty(action.label)) errors.push(`Missing label for ${action.id}.`)
  if (!nonEmpty(action.description)) errors.push(`Missing description for ${action.id}.`)
  if (!nonEmpty(action.pendingLabel)) errors.push(`Missing pending label for ${action.id}.`)
  if (action.sourceId !== null && !validIdentifier(action.sourceId)) {
    errors.push(`Invalid source id for ${action.id}.`)
  }
  if (action.connectionId !== null && !validIdentifier(action.connectionId)) {
    errors.push(`Invalid connection id for ${action.id}.`)
  }
  if (action.providerSpecific && (action.sourceId === null || action.connectionId === null)) {
    errors.push(`Provider-specific action ${action.id} requires source and connection identity.`)
  }
  if (
    action.invocationEffect === 'provider_write' &&
    action.operation !== 'execute' &&
    action.operation !== 'reverse'
  ) {
    errors.push(`Provider-write action ${action.id} must be an execute or reverse operation.`)
  }
  if (action.invocationEffect === 'provider_write' && !action.idempotencyRequired) {
    errors.push(`Provider-write action ${action.id} must require idempotency.`)
  }
  if (
    action.invocationEffect === 'provider_write' &&
    action.approval === 'none' &&
    action.risk !== 'low'
  ) {
    errors.push(`Provider-write action ${action.id} cannot bypass approval above low risk.`)
  }
  if (action.operation === 'select' && action.invocationEffect !== 'decision_only') {
    errors.push(`Decision selection ${action.id} must not invoke a provider operation.`)
  }
  if (action.operation === 'reopen' && action.invocationEffect !== 'decision_only') {
    errors.push(`Decision reopen ${action.id} must not invoke a provider operation.`)
  }
  if (action.availability.state === 'available' && !nonEmpty(action.compatibilityValue || '')) {
    errors.push(`Available action ${action.id} requires a compatibility value.`)
  }
  if (
    action.compatibilityValue !== null &&
    !compatibilityValues.has(action.compatibilityValue)
  ) {
    errors.push(`Unsupported compatibility value for ${action.id}.`)
  }
  if (action.availability.state !== 'available' && action.compatibilityValue !== null) {
    errors.push(`Unavailable action ${action.id} must not expose an invocation value.`)
  }
  if (action.availability.state === 'unavailable' && !nonEmpty(action.availability.reason || '')) {
    errors.push(`Unavailable action ${action.id} requires a reason.`)
  }
  return errors
}

export function finalizeDecisionWorkspaceActionGroup(input: Omit<DecisionWorkspaceActionGroup, 'validation'>): DecisionWorkspaceActionGroup {
  const errors: string[] = []
  if (!validIdentifier(input.adapterId)) errors.push('Action adapter id is invalid.')
  if (!validIdentifier(input.workflowDefinitionId)) errors.push('Workflow definition id is invalid.')
  if (!validIdentifier(input.workflowVersion)) errors.push('Workflow version is invalid.')
  if (input.runtimeInstanceId !== null && !validOpaqueIdentity(input.runtimeInstanceId)) {
    errors.push('Runtime instance id is invalid.')
  }
  if (!validIdentifier(input.subjectKind)) errors.push('Subject kind is invalid.')
  if (input.subjectId !== null && !validOpaqueIdentity(input.subjectId)) {
    errors.push('Subject id is invalid.')
  }
  if (!nonEmpty(input.emptyLabel)) errors.push('Action group empty label is required.')
  if (!nonEmpty(input.footnote)) errors.push('Action group footnote is required.')

  const compatibilityValues = new Set<string>()
  for (const value of input.compatibilityValues) {
    if (!nonEmpty(value)) errors.push('Compatibility values must not be empty.')
    if (compatibilityValues.has(value)) errors.push(`Duplicate compatibility value: ${value}.`)
    compatibilityValues.add(value)
  }

  const seen = new Set<string>()
  for (const action of input.actions) {
    if (seen.has(action.id)) errors.push(`Duplicate action id: ${action.id}.`)
    seen.add(action.id)
    errors.push(...validateAction(action, compatibilityValues))
  }

  if (errors.length > 0) {
    return {
      schemaVersion: 1,
      adapterId: validIdentifier(input.adapterId) ? input.adapterId : 'framework.fail_closed',
      workflowDefinitionId: validIdentifier(input.workflowDefinitionId)
        ? input.workflowDefinitionId
        : 'framework.unknown',
      workflowVersion: validIdentifier(input.workflowVersion) ? input.workflowVersion : 'unknown',
      runtimeInstanceId: null,
      subjectKind: validIdentifier(input.subjectKind) ? input.subjectKind : 'decision_subject',
      subjectId: null,
      surface: input.surface,
      compatibilityValues: [],
      actions: [],
      emptyLabel: 'No action available right now',
      footnote: 'Action metadata is unavailable or unsafe. No operation can run.',
      validation: { valid: false, errors },
    }
  }

  return {
    ...input,
    compatibilityValues: [...input.compatibilityValues],
    actions: input.actions.map((action) => ({
      ...action,
      availability: { ...action.availability },
    })),
    validation: { valid: true, errors: [] },
  }
}

export function failClosedDecisionWorkspaceActionGroup(params: {
  adapterId: string
  surface: DecisionWorkspaceActionSurface
  error: string
}): DecisionWorkspaceActionGroup {
  return {
    schemaVersion: 1,
    adapterId: validIdentifier(params.adapterId) ? params.adapterId : 'framework.fail_closed',
    workflowDefinitionId: 'framework.unknown',
    workflowVersion: 'unknown',
    runtimeInstanceId: null,
    subjectKind: 'decision_subject',
    subjectId: null,
    surface: params.surface,
    compatibilityValues: [],
    actions: [],
    emptyLabel: 'No action available right now',
    footnote: 'Action metadata is unavailable or unsafe. No operation can run.',
    validation: { valid: false, errors: [params.error] },
  }
}

export function actionDefinitionById(
  actions: readonly DecisionWorkspaceActionDefinition[],
  actionId: string
): DecisionWorkspaceActionDefinition | null {
  return actions.find((action) => action.id === actionId) || null
}
