export const DECISION_WORKSPACE_PRESENTATION_SCHEMA_VERSION = 1 as const

export const DECISION_WORKSPACE_PRESENTATION_SLOT_IDS = [
  'workspace',
  'health_overview',
  'review_groups',
  'item_overview',
  'decision_mode',
  'decision_management',
] as const

export type DecisionWorkspacePresentationSlotId =
  (typeof DECISION_WORKSPACE_PRESENTATION_SLOT_IDS)[number]

export type DecisionWorkspacePresentationSlot = Readonly<{
  semanticId: DecisionWorkspacePresentationSlotId
  title: string
  subtitle: string
  ariaLabel: string
}>

export type DecisionWorkspacePresentationSource = Readonly<{
  id: string
  providerType: string
  providerLabel: string
  role: 'primary' | 'supporting'
}>

export type DecisionWorkspacePresentationAgentRole = Readonly<{
  id: string
  label: string
}>

export type DecisionWorkspaceProviderControl = Readonly<{
  id: string
  sourceId: string
  providerType: string
  label: string
  requiredCapability: string
}>

export type DecisionWorkspacePresentationDefinition = Readonly<{
  schemaVersion: typeof DECISION_WORKSPACE_PRESENTATION_SCHEMA_VERSION
  presentationId: string
  version: string
  workflowDefinition: Readonly<{
    definitionId: string
    version: string
  }>
  governance: Readonly<{
    provenanceId: string
    authoredBy: string
    approvedBy: string
    approvalStatus: 'human_approved'
    reversibleToVersion: string | null
  }>
  agentRoles: readonly DecisionWorkspacePresentationAgentRole[]
  sources: readonly DecisionWorkspacePresentationSource[]
  slots: Readonly<Record<DecisionWorkspacePresentationSlotId, DecisionWorkspacePresentationSlot>>
  nouns: Readonly<{
    universe: string
    subjectSingular: string
    subjectPlural: string
    activitySingular: string
    activityPlural: string
    evidenceSingular: string
    evidencePlural: string
  }>
  metricLabels: Readonly<{
    itemsInScope: string
    reviewCandidates: string
    decisionsMade: string
    recommendations: string
    executionStatus: string
  }>
  semanticMetrics: readonly Readonly<{
    id: string
    label: string
    valueType: 'count' | 'currency' | 'rate' | 'score' | 'duration' | 'quantity' | 'status'
    unit: string
  }>[]
  actionLabels: readonly Readonly<{
    id: string
    label: string
  }>[]
  providerControls: readonly DecisionWorkspaceProviderControl[]
  assistant: Readonly<{
    prompts: Readonly<Record<DecisionWorkspacePresentationSlotId, readonly string[]>>
    context: Readonly<Record<DecisionWorkspacePresentationSlotId, string>>
  }>
  copy: Readonly<{
    workspaceDescription: string
    controlCenterDescription: string
    entryTitle: string
    entryDescription: string
    healthExplanation: string
  }>
}>

export type DecisionWorkspacePresentationValidation = Readonly<{
  errors: string[]
  slotCount: number
  sourceCount: number
  agentRoleCount: number
  providerControlCount: number
}>

const IDENTIFIER = /^[a-z0-9][a-z0-9._:-]*$/
const COPY_TOKEN = /{{\s*([a-z][a-z0-9_]*)\s*}}/g
const UNSAFE_COPY = /[<>{}]|[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export const FRAMEWORK_PRESENTATION_SLOT_FALLBACKS: Readonly<
  Record<DecisionWorkspacePresentationSlotId, DecisionWorkspacePresentationSlot>
> = Object.freeze({
  workspace: Object.freeze({
    semanticId: 'workspace',
    title: 'Decision workspace',
    subtitle: 'Review evidence, recommendations, decisions, actions, and outcomes.',
    ariaLabel: 'Decision workspace',
  }),
  health_overview: Object.freeze({
    semanticId: 'health_overview',
    title: 'Decision health',
    subtitle: 'A visual read on decision coverage, friction, and the next useful intervention.',
    ariaLabel: 'Decision health overview',
  }),
  review_groups: Object.freeze({
    semanticId: 'review_groups',
    title: 'Review Groups',
    subtitle: 'Choose a bounded group of items to review next.',
    ariaLabel: 'Review Groups',
  }),
  item_overview: Object.freeze({
    semanticId: 'item_overview',
    title: 'Item Overview',
    subtitle: 'Understand scope, evidence, and progress before focused review.',
    ariaLabel: 'Item Overview',
  }),
  decision_mode: Object.freeze({
    semanticId: 'decision_mode',
    title: 'Decision Mode',
    subtitle: 'Review one decision subject at a time.',
    ariaLabel: 'Decision Mode',
  }),
  decision_management: Object.freeze({
    semanticId: 'decision_management',
    title: 'Decision Management',
    subtitle: 'Inspect committed decisions, execution truth, and follow-up.',
    ariaLabel: 'Decision Management',
  }),
})

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validIdentifier(value: unknown): value is string {
  return nonEmpty(value) && IDENTIFIER.test(value)
}

export function isSafeDecisionWorkspaceCopy(value: unknown, maxLength = 240): value is string {
  return nonEmpty(value) && value.trim().length <= maxLength && !UNSAFE_COPY.test(value)
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

export function resolveDecisionWorkspacePresentationSlot(
  presentation: Pick<DecisionWorkspacePresentationDefinition, 'slots'> | null | undefined,
  slotId: DecisionWorkspacePresentationSlotId
): DecisionWorkspacePresentationSlot {
  const candidate = presentation?.slots?.[slotId]
  const fallback = FRAMEWORK_PRESENTATION_SLOT_FALLBACKS[slotId]
  if (
    !candidate ||
    candidate.semanticId !== slotId ||
    !isSafeDecisionWorkspaceCopy(candidate.title, 80) ||
    !isSafeDecisionWorkspaceCopy(candidate.subtitle) ||
    !isSafeDecisionWorkspaceCopy(candidate.ariaLabel, 120)
  ) {
    return fallback
  }
  return candidate
}

export function renderDecisionWorkspaceCopy(
  template: string,
  tokens: Readonly<Record<string, string>>
): string {
  if (
    !nonEmpty(template) ||
    template.length > 1_000 ||
    /[<>]|[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(template)
  ) {
    throw new Error('Presentation copy template is missing or unsafe.')
  }
  const rendered = template.replace(COPY_TOKEN, (_match, token: string) => {
    const value = tokens[token]
    if (!isSafeDecisionWorkspaceCopy(value, 160)) {
      throw new Error(`Presentation copy token ${token} is missing or unsafe.`)
    }
    return value.trim()
  })
  if (rendered.includes('{{') || rendered.includes('}}')) {
    throw new Error('Presentation copy contains an invalid token expression.')
  }
  for (const token of Object.keys(tokens)) {
    if (!IDENTIFIER.test(token)) {
      throw new Error(`Presentation copy token name ${token} is invalid.`)
    }
  }
  return rendered
}

export function presentationHasProviderControl(
  presentation: DecisionWorkspacePresentationDefinition,
  controlId: string,
  sourceId?: string
): boolean {
  return presentation.providerControls.some(
    (control) => control.id === controlId && (!sourceId || control.sourceId === sourceId)
  )
}

export function validateDecisionWorkspacePresentation(
  presentation: DecisionWorkspacePresentationDefinition
): DecisionWorkspacePresentationValidation {
  const errors: string[] = []
  if (presentation.schemaVersion !== DECISION_WORKSPACE_PRESENTATION_SCHEMA_VERSION) {
    errors.push('Decision workspace presentation schema version must be 1.')
  }
  if (!validIdentifier(presentation.presentationId)) {
    errors.push('Presentation ID must be a stable identifier.')
  }
  if (!nonEmpty(presentation.version)) errors.push('Presentation version is required.')
  if (!validIdentifier(presentation.workflowDefinition.definitionId)) {
    errors.push('Published workflow definition ID must be a stable identifier.')
  }
  if (!nonEmpty(presentation.workflowDefinition.version)) {
    errors.push('Published workflow definition version is required.')
  }
  if (
    !validIdentifier(presentation.governance.provenanceId) ||
    !isSafeDecisionWorkspaceCopy(presentation.governance.authoredBy, 100) ||
    !isSafeDecisionWorkspaceCopy(presentation.governance.approvedBy, 100) ||
    presentation.governance.approvalStatus !== 'human_approved' ||
    (presentation.governance.reversibleToVersion !== null &&
      !nonEmpty(presentation.governance.reversibleToVersion))
  ) {
    errors.push(
      'Presentation governance must retain provenance, human approval, and an explicit reversible version boundary.'
    )
  }
  if (presentation.sources.length === 0) errors.push('At least one presentation source is required.')
  if (presentation.agentRoles.length === 0) errors.push('At least one agent role is required.')

  for (const slotId of DECISION_WORKSPACE_PRESENTATION_SLOT_IDS) {
    const slot = presentation.slots[slotId]
    if (!slot || slot.semanticId !== slotId) {
      errors.push(`Presentation slot ${slotId} must retain its framework semantic ID.`)
      continue
    }
    if (!isSafeDecisionWorkspaceCopy(slot.title, 80)) {
      errors.push(`Presentation slot ${slotId} title is missing or unsafe.`)
    }
    if (!isSafeDecisionWorkspaceCopy(slot.subtitle)) {
      errors.push(`Presentation slot ${slotId} subtitle is missing or unsafe.`)
    }
    if (!isSafeDecisionWorkspaceCopy(slot.ariaLabel, 120)) {
      errors.push(`Presentation slot ${slotId} accessibility label is missing or unsafe.`)
    }
    const prompts = presentation.assistant.prompts[slotId]
    if (!Array.isArray(prompts) || prompts.length === 0) {
      errors.push(`Presentation slot ${slotId} requires assistant prompts.`)
    } else if (prompts.some((prompt) => !isSafeDecisionWorkspaceCopy(prompt))) {
      errors.push(`Presentation slot ${slotId} contains unsafe assistant prompt copy.`)
    }
    if (!isSafeDecisionWorkspaceCopy(presentation.assistant.context[slotId], 500)) {
      errors.push(`Presentation slot ${slotId} assistant context is missing or unsafe.`)
    }
  }

  const sourceIds = presentation.sources.map((source) => source.id)
  const sourceIdSet = new Set(sourceIds)
  for (const duplicate of duplicates(sourceIds)) errors.push(`Duplicate presentation source: ${duplicate}.`)
  for (const source of presentation.sources) {
    if (!validIdentifier(source.id) || !validIdentifier(source.providerType)) {
      errors.push('Presentation sources require stable IDs and provider types.')
    }
    if (!isSafeDecisionWorkspaceCopy(source.providerLabel, 80)) {
      errors.push(`Presentation source ${source.id} provider label is missing or unsafe.`)
    }
  }

  const roleIds = presentation.agentRoles.map((role) => role.id)
  for (const duplicate of duplicates(roleIds)) errors.push(`Duplicate presentation agent role: ${duplicate}.`)
  for (const role of presentation.agentRoles) {
    if (!validIdentifier(role.id) || !isSafeDecisionWorkspaceCopy(role.label, 80)) {
      errors.push('Presentation agent roles require stable IDs and safe labels.')
    }
  }

  const controlIds = presentation.providerControls.map((control) => control.id)
  for (const duplicate of duplicates(controlIds)) errors.push(`Duplicate provider control: ${duplicate}.`)
  for (const control of presentation.providerControls) {
    if (
      !validIdentifier(control.id) ||
      !validIdentifier(control.providerType) ||
      !validIdentifier(control.requiredCapability) ||
      !sourceIdSet.has(control.sourceId) ||
      !isSafeDecisionWorkspaceCopy(control.label, 100)
    ) {
      errors.push(`Provider control ${control.id || 'unknown'} is invalid or references an unknown source.`)
    }
  }

  const nounValues = Object.values(presentation.nouns)
  if (nounValues.some((value) => !isSafeDecisionWorkspaceCopy(value, 80))) {
    errors.push('Presentation nouns must be safe, non-empty copy.')
  }
  if (Object.values(presentation.metricLabels).some((value) => !isSafeDecisionWorkspaceCopy(value, 100))) {
    errors.push('Framework metric labels must be safe, non-empty copy.')
  }
  for (const metric of presentation.semanticMetrics) {
    if (!validIdentifier(metric.id) || !isSafeDecisionWorkspaceCopy(metric.label, 100) || !nonEmpty(metric.unit)) {
      errors.push(`Semantic metric ${metric.id || 'unknown'} is invalid.`)
    }
  }
  for (const action of presentation.actionLabels) {
    if (!validIdentifier(action.id) || !isSafeDecisionWorkspaceCopy(action.label, 100)) {
      errors.push(`Action label ${action.id || 'unknown'} is invalid.`)
    }
  }
  if (Object.values(presentation.copy).some((value) => !isSafeDecisionWorkspaceCopy(value, 1_000))) {
    errors.push('Presentation explanatory copy must be safe and non-empty.')
  }

  return {
    errors,
    slotCount: DECISION_WORKSPACE_PRESENTATION_SLOT_IDS.length,
    sourceCount: presentation.sources.length,
    agentRoleCount: presentation.agentRoles.length,
    providerControlCount: presentation.providerControls.length,
  }
}

export function defineDecisionWorkspacePresentation(
  presentation: DecisionWorkspacePresentationDefinition
): DecisionWorkspacePresentationDefinition {
  const validation = validateDecisionWorkspacePresentation(presentation)
  if (validation.errors.length > 0) {
    throw new Error(`Invalid decision workspace presentation: ${validation.errors.join(' ')}`)
  }
  return presentation
}

export function buildDecisionWorkspaceChromeSnapshot(
  presentation: DecisionWorkspacePresentationDefinition
): Readonly<{
  presentationId: string
  version: string
  workflowDefinitionId: string
  workflowDefinitionVersion: string
  provenanceId: string
  approvalStatus: 'human_approved'
  reversibleToVersion: string | null
  agentRoleIds: readonly string[]
  sourceIds: readonly string[]
  slotTitles: Readonly<Record<DecisionWorkspacePresentationSlotId, string>>
  providerControlIds: readonly string[]
}> {
  const slotTitles = Object.fromEntries(
    DECISION_WORKSPACE_PRESENTATION_SLOT_IDS.map((slotId) => [
      slotId,
      resolveDecisionWorkspacePresentationSlot(presentation, slotId).title,
    ])
  ) as Record<DecisionWorkspacePresentationSlotId, string>
  return {
    presentationId: presentation.presentationId,
    version: presentation.version,
    workflowDefinitionId: presentation.workflowDefinition.definitionId,
    workflowDefinitionVersion: presentation.workflowDefinition.version,
    provenanceId: presentation.governance.provenanceId,
    approvalStatus: presentation.governance.approvalStatus,
    reversibleToVersion: presentation.governance.reversibleToVersion,
    agentRoleIds: presentation.agentRoles.map((role) => role.id),
    sourceIds: presentation.sources.map((source) => source.id),
    slotTitles,
    providerControlIds: presentation.providerControls.map((control) => control.id),
  }
}
