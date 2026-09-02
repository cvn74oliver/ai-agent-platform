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
  approvals: Readonly<{
    getQueue: (compatibilityState: unknown) => DecisionWorkspaceApprovalQueue
  }>
}>

export type DecisionWorkspaceApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'executed'
  | 'rejected'

export type DecisionWorkspaceApprovalControlOperation = 'approve' | 'reject' | 'execute'

export type DecisionWorkspaceApprovalScopeMetrics = Readonly<{
  exactSelectedCount: number | null
  reviewedCount: number | null
  candidateCount: number | null
  excludedCount: number | null
  affectedSubjectsCount: number | null
}>

export type DecisionWorkspacePresentedApprovalAction = Readonly<{
  id: string
  order: number
  toolId: string
  actionId: string
  supported: boolean
  catalogActionId: string | null
  workflowStageId: string
  agentRoleId: string
  sourceId: string | null
  connectionId: string | null
  capability: string
  declaredEffect: DecisionWorkspaceActionDefinition['effect']
  risk: DecisionWorkspaceActionDefinition['risk']
  reversibility: DecisionWorkspaceActionDefinition['reversibility']
  approval: DecisionWorkspaceActionDefinition['approval']
  supportsPreview: boolean
  idempotencyRequired: boolean
  providerSpecific: boolean
  label: string
  description: string
  objectScope: string
  approvalEffect: string
  executionEffect: string
  scopeLabel: string
  affectedSubjectsLabel: string
  metrics: DecisionWorkspaceApprovalScopeMetrics
  evidenceBasis: string | null
  safeSignals: readonly string[]
  safetyExclusions: readonly string[]
}>

export type DecisionWorkspacePresentedApprovalControl = Readonly<{
  operation: DecisionWorkspaceApprovalControlOperation
  label: string
  pendingLabel: string
  tone: DecisionWorkspaceActionTone
  availability: DecisionWorkspaceActionAvailability
  compatibilityValue: 'approved' | 'rejected' | 'execute' | null
}>

export type DecisionWorkspacePresentedApprovalRequest = Readonly<{
  key: string
  approvalId: string
  status: DecisionWorkspaceApprovalStatus
  title: string
  reason: string
  bundleLabel: string
  atomicity: 'single_action' | 'workflow_declared_bundle'
  rejectionEffect: string
  actions: readonly DecisionWorkspacePresentedApprovalAction[]
  controls: readonly DecisionWorkspacePresentedApprovalControl[]
  validation: Readonly<{
    valid: boolean
    errors: readonly string[]
  }>
}>

export type DecisionWorkspaceApprovalQueue = Readonly<{
  schemaVersion: 1
  adapterId: string
  workflowDefinitionId: string
  workflowVersion: string
  runtimeInstanceId: string | null
  subjectKind: string
  presentation: Readonly<{
    eyebrow: string
    title: string
    description: string
    steps: readonly string[]
  }>
  requests: readonly DecisionWorkspacePresentedApprovalRequest[]
  summary: Readonly<Record<DecisionWorkspaceApprovalStatus, number>>
  validation: Readonly<{
    valid: boolean
    errors: readonly string[]
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
const validApprovalStatuses = new Set<DecisionWorkspaceApprovalStatus>([
  'pending_approval',
  'approved',
  'executed',
  'rejected',
])
const validApprovalControlOperations = new Set<DecisionWorkspaceApprovalControlOperation>([
  'approve',
  'reject',
  'execute',
])

const validDisplayText = (value: string, maxLength = 2_000): boolean =>
  nonEmpty(value) && value.length <= maxLength && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)

function validateApprovalAction(action: DecisionWorkspacePresentedApprovalAction): string[] {
  const errors: string[] = []
  if (!validIdentifier(action.id)) errors.push(`Invalid approval action id: ${action.id || '<missing>'}.`)
  if (!Number.isInteger(action.order) || action.order < 0) errors.push(`Invalid action order for ${action.id}.`)
  if (!validIdentifier(action.toolId)) errors.push(`Invalid tool id for ${action.id}.`)
  if (!validIdentifier(action.actionId)) errors.push(`Invalid raw action id for ${action.id}.`)
  if (!action.supported) errors.push(`Unsupported approval action: ${action.toolId}.${action.actionId}.`)
  if (action.catalogActionId !== null && !validIdentifier(action.catalogActionId)) {
    errors.push(`Invalid catalog action id for ${action.id}.`)
  }
  if (!validIdentifier(action.workflowStageId)) errors.push(`Invalid workflow stage for ${action.id}.`)
  if (!validIdentifier(action.agentRoleId)) errors.push(`Invalid agent role for ${action.id}.`)
  if (!validIdentifier(action.capability)) errors.push(`Invalid capability for ${action.id}.`)
  if (!validEffects.has(action.declaredEffect)) errors.push(`Invalid declared effect for ${action.id}.`)
  if (!validRisks.has(action.risk)) errors.push(`Invalid risk for ${action.id}.`)
  if (!validReversibility.has(action.reversibility)) errors.push(`Invalid reversibility for ${action.id}.`)
  if (!validApprovals.has(action.approval)) errors.push(`Invalid approval policy for ${action.id}.`)
  if (!validDisplayText(action.label, 240)) errors.push(`Invalid label for ${action.id}.`)
  if (!validDisplayText(action.description)) errors.push(`Invalid description for ${action.id}.`)
  if (!validDisplayText(action.objectScope)) errors.push(`Invalid object scope for ${action.id}.`)
  if (!validDisplayText(action.approvalEffect)) errors.push(`Invalid approval effect for ${action.id}.`)
  if (!validDisplayText(action.executionEffect)) errors.push(`Invalid execution effect for ${action.id}.`)
  if (!validDisplayText(action.scopeLabel)) errors.push(`Invalid scope label for ${action.id}.`)
  if (!validDisplayText(action.affectedSubjectsLabel, 120)) {
    errors.push(`Invalid affected-subject label for ${action.id}.`)
  }
  if (action.sourceId !== null && !validIdentifier(action.sourceId)) errors.push(`Invalid source id for ${action.id}.`)
  if (action.connectionId !== null && !validIdentifier(action.connectionId)) {
    errors.push(`Invalid connection id for ${action.id}.`)
  }
  if (action.providerSpecific && (action.sourceId === null || action.connectionId === null)) {
    errors.push(`Provider-specific approval action ${action.id} requires source and connection identity.`)
  }
  if (action.declaredEffect === 'provider_write' && !action.idempotencyRequired) {
    errors.push(`Provider-write approval action ${action.id} must require idempotency.`)
  }
  if (action.evidenceBasis !== null && !validDisplayText(action.evidenceBasis)) {
    errors.push(`Invalid evidence basis for ${action.id}.`)
  }
  for (const signal of [...action.safeSignals, ...action.safetyExclusions]) {
    if (!validDisplayText(signal, 500)) errors.push(`Invalid safety text for ${action.id}.`)
  }
  for (const value of Object.values(action.metrics)) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      errors.push(`Invalid scope metric for ${action.id}.`)
    }
  }
  return errors
}

function validateApprovalControl(control: DecisionWorkspacePresentedApprovalControl): string[] {
  const errors: string[] = []
  if (!validApprovalControlOperations.has(control.operation)) errors.push('Invalid approval control operation.')
  if (!validDisplayText(control.label, 120)) errors.push(`Invalid ${control.operation} label.`)
  if (!validDisplayText(control.pendingLabel, 120)) errors.push(`Invalid ${control.operation} pending label.`)
  if (!validTones.has(control.tone)) errors.push(`Invalid ${control.operation} control tone.`)
  if (!validAvailabilityStates.has(control.availability.state)) {
    errors.push(`Invalid ${control.operation} availability state.`)
  }
  if (control.availability.state === 'available' && control.compatibilityValue === null) {
    errors.push(`Available ${control.operation} control requires a compatibility value.`)
  }
  if (control.availability.state !== 'available' && control.compatibilityValue !== null) {
    errors.push(`Unavailable ${control.operation} control must not expose a compatibility value.`)
  }
  if (control.availability.state === 'unavailable' && !validDisplayText(control.availability.reason || '')) {
    errors.push(`Unavailable ${control.operation} control requires a reason.`)
  }
  return errors
}

function finalizeApprovalRequest(
  request: Omit<DecisionWorkspacePresentedApprovalRequest, 'validation'>
): DecisionWorkspacePresentedApprovalRequest {
  const errors: string[] = []
  if (!validOpaqueIdentity(request.key)) errors.push('Approval request key is invalid.')
  if (!validOpaqueIdentity(request.approvalId)) errors.push('Approval id is invalid.')
  if (!validApprovalStatuses.has(request.status)) errors.push('Approval status is invalid.')
  if (!validDisplayText(request.title, 240)) errors.push('Approval request title is invalid.')
  if (!validDisplayText(request.reason)) errors.push('Approval request reason is invalid.')
  if (!validDisplayText(request.bundleLabel, 240)) errors.push('Approval bundle label is invalid.')
  if (request.actions.length > 1 && request.atomicity !== 'workflow_declared_bundle') {
    errors.push('Multi-action approval requires an explicitly declared workflow bundle.')
  }
  if (request.actions.length === 1 && request.atomicity !== 'single_action') {
    errors.push('Single-action approval must use single-action atomicity.')
  }
  if (!validDisplayText(request.rejectionEffect)) errors.push('Approval rejection effect is invalid.')
  if (request.actions.length === 0) errors.push('Approval request has no proposed actions.')

  const actionIds = new Set<string>()
  request.actions.forEach((action, index) => {
    if (action.order !== index) errors.push(`Approval action order is not contiguous at index ${index}.`)
    if (actionIds.has(action.id)) errors.push(`Duplicate approval action id: ${action.id}.`)
    actionIds.add(action.id)
    errors.push(...validateApprovalAction(action))
  })

  const controlOperations = new Set<DecisionWorkspaceApprovalControlOperation>()
  for (const control of request.controls) {
    if (controlOperations.has(control.operation)) errors.push(`Duplicate approval control: ${control.operation}.`)
    controlOperations.add(control.operation)
    errors.push(...validateApprovalControl(control))
  }

  const expectedOperations =
    request.status === 'pending_approval'
      ? ['approve', 'reject']
      : request.status === 'approved'
        ? ['execute']
        : []
  if (
    errors.length === 0 &&
    (request.controls.length !== expectedOperations.length ||
      expectedOperations.some((operation) => !controlOperations.has(operation as DecisionWorkspaceApprovalControlOperation)))
  ) {
    errors.push(`Approval controls do not match ${request.status} state.`)
  }

  if (errors.length > 0) {
    return {
      key: validOpaqueIdentity(request.key) ? request.key : 'approval:invalid',
      approvalId: validOpaqueIdentity(request.approvalId) ? request.approvalId : 'unavailable',
      status: validApprovalStatuses.has(request.status) ? request.status : 'pending_approval',
      title: 'Approval request unavailable',
      reason: 'This request contains missing, unsupported, or unsafe action metadata.',
      bundleLabel: 'No operation can run',
      atomicity: request.atomicity,
      rejectionEffect: 'No approval decision or execution is available for this invalid request.',
      actions: request.actions.map((action) => ({
        ...action,
        label: validDisplayText(action.label, 240) ? action.label : 'Unsupported action',
        description: 'This proposed action cannot be safely presented or invoked.',
        approvalEffect: 'No approval effect is available.',
        executionEffect: 'No execution effect is available.',
        scopeLabel: 'Scope unavailable',
        safeSignals: [],
        safetyExclusions: ['Controls are disabled because the action bundle did not validate.'],
      })),
      controls: [],
      validation: { valid: false, errors },
    }
  }

  return {
    ...request,
    actions: request.actions.map((action) => ({
      ...action,
      metrics: { ...action.metrics },
      safeSignals: [...action.safeSignals],
      safetyExclusions: [...action.safetyExclusions],
    })),
    controls: request.controls.map((control) => ({
      ...control,
      availability: { ...control.availability },
    })),
    validation: { valid: true, errors: [] },
  }
}

export function finalizeDecisionWorkspaceApprovalQueue(input: {
  schemaVersion: 1
  adapterId: string
  workflowDefinitionId: string
  workflowVersion: string
  runtimeInstanceId: string | null
  subjectKind: string
  presentation: DecisionWorkspaceApprovalQueue['presentation']
  requests: readonly Omit<DecisionWorkspacePresentedApprovalRequest, 'validation'>[]
}): DecisionWorkspaceApprovalQueue {
  const errors: string[] = []
  if (!validIdentifier(input.adapterId)) errors.push('Approval adapter id is invalid.')
  if (!validIdentifier(input.workflowDefinitionId)) errors.push('Approval workflow definition id is invalid.')
  if (!validIdentifier(input.workflowVersion)) errors.push('Approval workflow version is invalid.')
  if (input.runtimeInstanceId !== null && !validOpaqueIdentity(input.runtimeInstanceId)) {
    errors.push('Approval runtime instance id is invalid.')
  }
  if (!validIdentifier(input.subjectKind)) errors.push('Approval subject kind is invalid.')
  if (!validDisplayText(input.presentation.eyebrow, 120)) errors.push('Approval eyebrow is invalid.')
  if (!validDisplayText(input.presentation.title, 240)) errors.push('Approval title is invalid.')
  if (!validDisplayText(input.presentation.description)) errors.push('Approval description is invalid.')
  if (input.presentation.steps.length === 0) errors.push('Approval presentation steps are required.')
  for (const step of input.presentation.steps) {
    if (!validDisplayText(step, 500)) errors.push('Approval presentation step is invalid.')
  }

  const seenKeys = new Set<string>()
  const seenApprovalIds = new Set<string>()
  const requests = input.requests.map((request) => {
    if (seenKeys.has(request.key)) errors.push(`Duplicate approval request key: ${request.key}.`)
    if (seenApprovalIds.has(request.approvalId)) errors.push(`Duplicate approval id: ${request.approvalId}.`)
    seenKeys.add(request.key)
    seenApprovalIds.add(request.approvalId)
    return finalizeApprovalRequest(request)
  })

  const summary: Record<DecisionWorkspaceApprovalStatus, number> = {
    pending_approval: 0,
    approved: 0,
    executed: 0,
    rejected: 0,
  }
  for (const request of requests) summary[request.status] += 1
  for (const request of requests) errors.push(...request.validation.errors.map((error) => `${request.approvalId}: ${error}`))

  if (errors.some((error) => error.startsWith('Duplicate approval'))) {
    return {
      schemaVersion: 1,
      adapterId: validIdentifier(input.adapterId) ? input.adapterId : 'framework.fail_closed',
      workflowDefinitionId: validIdentifier(input.workflowDefinitionId)
        ? input.workflowDefinitionId
        : 'framework.unknown',
      workflowVersion: validIdentifier(input.workflowVersion) ? input.workflowVersion : 'unknown',
      runtimeInstanceId: null,
      subjectKind: validIdentifier(input.subjectKind) ? input.subjectKind : 'approval_subject',
      presentation: {
        eyebrow: 'Approvals',
        title: 'Approval Queue',
        description: 'Approval metadata is unavailable or unsafe.',
        steps: ['No approval or execution control is available.'],
      },
      requests: [],
      summary: { pending_approval: 0, approved: 0, executed: 0, rejected: 0 },
      validation: { valid: false, errors },
    }
  }

  return {
    ...input,
    presentation: { ...input.presentation, steps: [...input.presentation.steps] },
    requests,
    summary,
    validation: { valid: errors.length === 0, errors },
  }
}

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
