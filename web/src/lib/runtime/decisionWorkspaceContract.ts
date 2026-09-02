export type DecisionWorkspaceUniverseDefinition = {
  type: string
  label: string
}

export type DecisionWorkspaceSubjectDefinition = {
  type: string
  singularLabel: string
  pluralLabel: string
}

export type PublishedWorkflowDefinitionReference = {
  definitionId: string
  version: string
  source: 'automation_published' | 'builtin_compatibility'
  publicationStatus: 'published'
}

export type DecisionWorkspaceRuntimeReference = {
  instanceId: string
  workflowDefinition: PublishedWorkflowDefinitionReference
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
}

export type DecisionWorkspaceSourceDefinition = {
  id: string
  providerType: string
  role: 'primary' | 'supporting'
  requiredCapabilities: readonly string[]
}

export type DecisionMetricValueType =
  | 'count'
  | 'currency'
  | 'rate'
  | 'score'
  | 'duration'
  | 'quantity'
  | 'status'

export type DecisionMetricAggregation =
  | 'sum'
  | 'average'
  | 'minimum'
  | 'maximum'
  | 'count'
  | 'distinct_count'
  | 'latest'
  | 'none'

export type DecisionMetricDirection =
  | 'higher_is_better'
  | 'lower_is_better'
  | 'target_range'
  | 'context_only'

export type DecisionMetricCrossSourcePolicy =
  | { mode: 'forbidden' }
  | { mode: 'same_definition_only' }
  | { mode: 'compatible_key'; compatibilityKey: string }

export type DecisionMetricDefinition = {
  id: string
  label: string
  valueType: DecisionMetricValueType
  unit: string
  aggregation: DecisionMetricAggregation
  direction: DecisionMetricDirection
  timeBasis: 'event_time' | 'snapshot_time' | 'interval'
  crossSource: DecisionMetricCrossSourcePolicy
}

export type DecisionWorkspaceEntityLinkDefinition = {
  id: string
  fromSubjectType: string
  toSubjectType: string
  cardinality: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many'
  authority: 'source_record' | 'workflow_rule' | 'human_confirmed'
  conflictPolicy: 'fail_closed' | 'prefer_authority' | 'require_human'
}

export type DecisionWorkspaceActivityDefinition = {
  type: string
  singularLabel: string
  pluralLabel: string
  occurredAtField: string
  primaryMetricId: string
}

export type DecisionWorkspaceActionDefinition = {
  id: string
  label: string
  capability: string
  effect: 'decision_only' | 'provider_read' | 'provider_write'
  risk: 'low' | 'medium' | 'high' | 'critical'
  reversibility:
    | 'reversible'
    | 'compensating_action'
    | 'irreversible'
    | 'not_applicable'
  approval: 'none' | 'policy' | 'always'
  supportsPreview: boolean
  idempotencyRequired: boolean
}

export type DecisionWorkspaceEvidencePolicy = {
  requiresSourceRecord: boolean
  requiresObservedAt: boolean
  requiresIngestedAt: boolean
  requiresFreshness: boolean
  requiresQuality: boolean
  requiresTransformationVersion: boolean
}

export type DecisionWorkspaceRecommendationPolicy = {
  requiresRationale: boolean
  requiresEvidence: boolean
  requiresConfidence: boolean
  requiresExpectedImpact: boolean
  supportsAlternatives: boolean
  requiresExpiryOrReevaluation: boolean
}

export type DecisionWorkspaceGovernance = {
  proprietaryBrain: {
    kind: 'versioned_knowledge_and_memory'
    ownership: 'tenant'
    privacy: 'private'
    provenance: 'required'
    feedbackCapture: 'required'
    foundationModelTraining: 'excluded'
  }
  sharedLearning: 'disabled' | 'explicit_opt_in'
  auditTrail: 'required'
  sopVersionReference: 'required'
}

export type DecisionWorkspaceSubjectReference = {
  type: string
  id: string
}

export type DecisionWorkspaceEvidenceReference = {
  id: string
  kind: string
  sourceId: string
  sourceRecordId: string
  observedAt: string
  ingestedAt: string
  transformationVersion: string
  freshness: 'fresh' | 'stale' | 'unknown'
  quality: 'complete' | 'partial' | 'conflicting' | 'unknown'
}

export type DecisionWorkspaceRecommendationRecord = Readonly<{
  id: string
  runtime: DecisionWorkspaceRuntimeReference
  subject: DecisionWorkspaceSubjectReference
  proposedActionId: string
  governingRuleId: string
  rationale: string
  confidence: number
  expectedImpact: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  alternatives: readonly string[]
  assumptions: readonly string[]
  evidence: readonly DecisionWorkspaceEvidenceReference[]
  createdAt: string
  expiresAt: string | null
  reevaluateAt: string | null
}>

export type DecisionWorkspaceHumanDecisionRecord = Readonly<{
  id: string
  recommendationId: string
  runtime: DecisionWorkspaceRuntimeReference
  subject: DecisionWorkspaceSubjectReference
  actorId: string
  decidedAt: string
  outcome: 'accepted' | 'rejected' | 'alternative_selected' | 'deferred'
  selectedActionId: string | null
  reason: string
  scope: 'subject' | 'review_unit' | 'workflow'
}>

export type DecisionWorkspaceExecutionStatus =
  | 'proposed'
  | 'approved'
  | 'claimed'
  | 'executing'
  | 'executed'
  | 'succeeded'
  | 'failed'
  | 'partial'
  | 'indeterminate'
  | 'skipped'
  | 'reverted'

export type DecisionWorkspaceExecutionTransition = Readonly<{
  from: DecisionWorkspaceExecutionStatus | null
  to: DecisionWorkspaceExecutionStatus
  at: string
  actorId: string
}>

export type DecisionWorkspaceActionExecutionRecord = Readonly<{
  id: string
  decisionId: string
  runtime: DecisionWorkspaceRuntimeReference
  subject: DecisionWorkspaceSubjectReference
  actionId: string
  sourceId: string | null
  providerType?: string | null
  connectionId?: string | null
  agentRoleId?: string | null
  capability: string
  status: DecisionWorkspaceExecutionStatus
  idempotencyKey: string | null
  previewReference: string | null
  providerReceipt: string | Readonly<Record<string, unknown>> | null
  rollbackReference: string | null
  errorCode: string | null
  transitions: readonly DecisionWorkspaceExecutionTransition[]
}>

export type DecisionWorkspaceSourceStatus = Readonly<{
  sourceId: string
  connectionStatus: 'connected' | 'degraded' | 'disconnected' | 'unauthorized'
  freshness: 'fresh' | 'stale' | 'unknown'
  observedAt: string
  detail: string | null
}>

export type DecisionWorkspaceSizingPolicy = {
  targetMin: number
  targetMax: number
  hardMax: number
}

export type DecisionWorkspaceContract<TDimension extends string = string> = {
  schemaVersion: 1
  workspaceType: string
  workflowId: string
  workflowDefinition: PublishedWorkflowDefinitionReference
  sources: readonly DecisionWorkspaceSourceDefinition[]
  universe: DecisionWorkspaceUniverseDefinition
  decisionSubject: DecisionWorkspaceSubjectDefinition
  activity: DecisionWorkspaceActivityDefinition
  metrics: readonly DecisionMetricDefinition[]
  entityLinks: readonly DecisionWorkspaceEntityLinkDefinition[]
  evidenceKinds: readonly string[]
  evidencePolicy: DecisionWorkspaceEvidencePolicy
  recommendationPolicy: DecisionWorkspaceRecommendationPolicy
  actions: readonly DecisionWorkspaceActionDefinition[]
  reviewUnits: {
    dimensions: readonly TDimension[]
    sizing: DecisionWorkspaceSizingPolicy
  }
  governance: DecisionWorkspaceGovernance
}

export type DecisionWorkspaceContractValidation = {
  errors: string[]
  metricCount: number
  actionCount: number
  sourceCount: number
}

const CONTRACT_IDENTIFIER = /^[a-z0-9][a-z0-9._:-]*$/

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validIdentifier(value: unknown): value is string {
  return nonEmpty(value) && CONTRACT_IDENTIFIER.test(value)
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

export function validateDecisionWorkspaceContract<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>
): DecisionWorkspaceContractValidation {
  const errors: string[] = []

  if (contract.schemaVersion !== 1) errors.push('Decision workspace schema version must be 1.')
  if (!validIdentifier(contract.workspaceType)) errors.push('Workspace type must be a stable identifier.')
  if (!validIdentifier(contract.workflowId)) errors.push('Workflow ID must be a stable identifier.')
  if (!validIdentifier(contract.workflowDefinition.definitionId)) {
    errors.push('Published workflow definition ID must be a stable identifier.')
  }
  if (!nonEmpty(contract.workflowDefinition.version)) {
    errors.push('Published workflow definition version is required.')
  }
  if (contract.workflowDefinition.publicationStatus !== 'published') {
    errors.push('Decision workspaces must reference a published workflow definition.')
  }

  if (!validIdentifier(contract.universe.type) || !nonEmpty(contract.universe.label)) {
    errors.push('Universe type and label are required.')
  }
  if (
    !validIdentifier(contract.decisionSubject.type) ||
    !nonEmpty(contract.decisionSubject.singularLabel) ||
    !nonEmpty(contract.decisionSubject.pluralLabel)
  ) {
    errors.push('Decision subject type and labels are required.')
  }
  if (
    !validIdentifier(contract.activity.type) ||
    !nonEmpty(contract.activity.singularLabel) ||
    !nonEmpty(contract.activity.pluralLabel) ||
    !validIdentifier(contract.activity.occurredAtField) ||
    !validIdentifier(contract.activity.primaryMetricId)
  ) {
    errors.push('Activity type, labels, timestamp field, and primary metric are required.')
  }

  if (contract.sources.length === 0) errors.push('At least one source binding is required.')
  const sourceIds = contract.sources.map((source) => source.id)
  for (const duplicate of duplicateValues(sourceIds)) {
    errors.push(`Duplicate source ID: ${duplicate}.`)
  }
  for (const source of contract.sources) {
    if (!validIdentifier(source.id) || !validIdentifier(source.providerType)) {
      errors.push('Source IDs and provider types must be stable identifiers.')
    }
    if (source.requiredCapabilities.some((capability) => !validIdentifier(capability))) {
      errors.push(`Source ${source.id} contains an invalid capability identifier.`)
    }
  }

  if (contract.metrics.length === 0) errors.push('At least one semantic metric is required.')
  const metricIds = contract.metrics.map((metric) => metric.id)
  for (const duplicate of duplicateValues(metricIds)) {
    errors.push(`Duplicate metric ID: ${duplicate}.`)
  }
  for (const metric of contract.metrics) {
    if (!validIdentifier(metric.id) || !nonEmpty(metric.label) || !nonEmpty(metric.unit)) {
      errors.push('Metric IDs, labels, and units are required.')
    }
    if (
      metric.crossSource.mode === 'compatible_key' &&
      !validIdentifier(metric.crossSource.compatibilityKey)
    ) {
      errors.push(`Metric ${metric.id} requires a valid cross-source compatibility key.`)
    }
  }
  if (!metricIds.includes(contract.activity.primaryMetricId)) {
    errors.push('Activity primary metric must reference a declared metric.')
  }

  const entityLinkIds = contract.entityLinks.map((link) => link.id)
  for (const duplicate of duplicateValues(entityLinkIds)) {
    errors.push(`Duplicate entity-link ID: ${duplicate}.`)
  }
  for (const link of contract.entityLinks) {
    if (
      !validIdentifier(link.id) ||
      !validIdentifier(link.fromSubjectType) ||
      !validIdentifier(link.toSubjectType)
    ) {
      errors.push('Entity-link IDs and subject types must be stable identifiers.')
    }
  }

  if (contract.evidenceKinds.length === 0) errors.push('At least one evidence kind is required.')
  for (const duplicate of duplicateValues([...contract.evidenceKinds])) {
    errors.push(`Duplicate evidence kind: ${duplicate}.`)
  }
  if (contract.evidenceKinds.some((kind) => !validIdentifier(kind))) {
    errors.push('Evidence kinds must be stable identifiers.')
  }

  const actionIds = contract.actions.map((action) => action.id)
  for (const duplicate of duplicateValues(actionIds)) {
    errors.push(`Duplicate action ID: ${duplicate}.`)
  }
  const declaredCapabilities = new Set(
    contract.sources.flatMap((source) => [...source.requiredCapabilities])
  )
  for (const action of contract.actions) {
    if (!validIdentifier(action.id) || !nonEmpty(action.label) || !validIdentifier(action.capability)) {
      errors.push('Action IDs, labels, and capabilities are required.')
    }
    if (action.effect !== 'decision_only' && !declaredCapabilities.has(action.capability)) {
      errors.push(`Action ${action.id} requires undeclared capability ${action.capability}.`)
    }
    if (action.effect === 'provider_write' && action.approval === 'none' && action.risk !== 'low') {
      errors.push(`Provider-write action ${action.id} cannot bypass approval above low risk.`)
    }
    if (action.effect === 'provider_write' && !action.idempotencyRequired) {
      errors.push(`Provider-write action ${action.id} must require idempotency.`)
    }
  }

  const dimensions = [...contract.reviewUnits.dimensions]
  for (const duplicate of duplicateValues(dimensions)) {
    errors.push(`Duplicate review-unit dimension: ${duplicate}.`)
  }
  if (dimensions.some((dimension) => !validIdentifier(dimension))) {
    errors.push('Review-unit dimensions must be stable identifiers.')
  }
  const sizing = contract.reviewUnits.sizing
  if (
    !Number.isInteger(sizing.targetMin) ||
    !Number.isInteger(sizing.targetMax) ||
    !Number.isInteger(sizing.hardMax) ||
    sizing.targetMin < 1 ||
    sizing.targetMin > sizing.targetMax ||
    sizing.targetMax > sizing.hardMax
  ) {
    errors.push('Review-unit sizing must satisfy 1 <= targetMin <= targetMax <= hardMax.')
  }

  if (
    contract.governance.proprietaryBrain.kind !== 'versioned_knowledge_and_memory' ||
    contract.governance.proprietaryBrain.ownership !== 'tenant' ||
    contract.governance.proprietaryBrain.privacy !== 'private' ||
    contract.governance.proprietaryBrain.provenance !== 'required' ||
    contract.governance.proprietaryBrain.feedbackCapture !== 'required' ||
    contract.governance.proprietaryBrain.foundationModelTraining !== 'excluded' ||
    contract.governance.auditTrail !== 'required' ||
    contract.governance.sopVersionReference !== 'required'
  ) {
    errors.push(
      'A private tenant-owned proprietary brain, audit trail, feedback provenance, and SOP version provenance are mandatory.'
    )
  }

  return {
    errors,
    metricCount: contract.metrics.length,
    actionCount: contract.actions.length,
    sourceCount: contract.sources.length,
  }
}

export function defineDecisionWorkspaceContract<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>
): DecisionWorkspaceContract<TDimension> {
  const validation = validateDecisionWorkspaceContract(contract)
  if (validation.errors.length > 0) {
    throw new Error(`Invalid decision workspace contract: ${validation.errors.join(' ')}`)
  }
  return contract
}

function workflowDefinitionMatches(
  expected: PublishedWorkflowDefinitionReference,
  actual: PublishedWorkflowDefinitionReference
): boolean {
  return (
    expected.definitionId === actual.definitionId &&
    expected.version === actual.version &&
    expected.source === actual.source &&
    actual.publicationStatus === 'published'
  )
}

function validateRuntimeReference<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>,
  runtime: DecisionWorkspaceRuntimeReference,
  errors: string[]
): void {
  if (!validIdentifier(runtime.instanceId)) {
    errors.push('Runtime instance ID must be a stable identifier.')
  }
  if (!workflowDefinitionMatches(contract.workflowDefinition, runtime.workflowDefinition)) {
    errors.push('Runtime record must retain the exact published workflow definition and version.')
  }
}

function validateSubjectReference<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>,
  subject: DecisionWorkspaceSubjectReference,
  errors: string[]
): void {
  if (subject.type !== contract.decisionSubject.type || !nonEmpty(subject.id)) {
    errors.push('Runtime subject must match the contract decision-subject type and have an ID.')
  }
}

export function validateDecisionWorkspaceRecommendation<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>,
  recommendation: DecisionWorkspaceRecommendationRecord
): string[] {
  const errors: string[] = []
  validateRuntimeReference(contract, recommendation.runtime, errors)
  validateSubjectReference(contract, recommendation.subject, errors)

  if (!validIdentifier(recommendation.id)) errors.push('Recommendation ID must be stable.')
  if (!contract.actions.some((action) => action.id === recommendation.proposedActionId)) {
    errors.push('Recommendation proposed action must exist in the contract action catalog.')
  }
  if (!validIdentifier(recommendation.governingRuleId)) {
    errors.push('Recommendation must retain a governing SOP/workflow rule ID.')
  }
  if (!nonEmpty(recommendation.rationale)) errors.push('Recommendation rationale is required.')
  if (
    !Number.isFinite(recommendation.confidence) ||
    recommendation.confidence < 0 ||
    recommendation.confidence > 1
  ) {
    errors.push('Recommendation confidence must be between 0 and 1.')
  }
  if (!nonEmpty(recommendation.expectedImpact)) {
    errors.push('Recommendation expected impact is required.')
  }
  if (
    contract.recommendationPolicy.requiresEvidence &&
    recommendation.evidence.length === 0
  ) {
    errors.push('Recommendation evidence is required by policy.')
  }
  if (
    contract.recommendationPolicy.requiresExpiryOrReevaluation &&
    !nonEmpty(recommendation.expiresAt) &&
    !nonEmpty(recommendation.reevaluateAt)
  ) {
    errors.push('Recommendation must define an expiry or re-evaluation time.')
  }

  const sourceIds = new Set(contract.sources.map((source) => source.id))
  const evidenceKinds = new Set(contract.evidenceKinds)
  for (const evidence of recommendation.evidence) {
    if (!validIdentifier(evidence.id) || !evidenceKinds.has(evidence.kind)) {
      errors.push('Recommendation evidence must have a stable ID and declared evidence kind.')
    }
    if (!sourceIds.has(evidence.sourceId) || !nonEmpty(evidence.sourceRecordId)) {
      errors.push('Recommendation evidence must retain a declared source and source-record ID.')
    }
    if (
      !nonEmpty(evidence.observedAt) ||
      !nonEmpty(evidence.ingestedAt) ||
      !nonEmpty(evidence.transformationVersion)
    ) {
      errors.push('Recommendation evidence must retain observation, ingestion, and transformation provenance.')
    }
  }
  return errors
}

export function validateDecisionWorkspaceHumanDecision<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>,
  decision: DecisionWorkspaceHumanDecisionRecord
): string[] {
  const errors: string[] = []
  validateRuntimeReference(contract, decision.runtime, errors)
  validateSubjectReference(contract, decision.subject, errors)

  if (!validIdentifier(decision.id) || !validIdentifier(decision.recommendationId)) {
    errors.push('Decision and recommendation IDs must be stable.')
  }
  if (!nonEmpty(decision.actorId) || !nonEmpty(decision.decidedAt) || !nonEmpty(decision.reason)) {
    errors.push('Decision actor, time, and reason are required.')
  }
  if (
    decision.selectedActionId !== null &&
    !contract.actions.some((action) => action.id === decision.selectedActionId)
  ) {
    errors.push('Decision selected action must exist in the contract action catalog.')
  }
  if (
    (decision.outcome === 'accepted' || decision.outcome === 'alternative_selected') &&
    decision.selectedActionId === null
  ) {
    errors.push('Accepted or alternative decisions must select an action.')
  }
  return errors
}

export function validateDecisionWorkspaceActionExecution<TDimension extends string>(
  contract: DecisionWorkspaceContract<TDimension>,
  execution: DecisionWorkspaceActionExecutionRecord
): string[] {
  const errors: string[] = []
  validateRuntimeReference(contract, execution.runtime, errors)
  validateSubjectReference(contract, execution.subject, errors)

  const action = contract.actions.find((candidate) => candidate.id === execution.actionId)
  if (!validIdentifier(execution.id) || !validIdentifier(execution.decisionId)) {
    errors.push('Execution and decision IDs must be stable.')
  }
  if (!action || action.capability !== execution.capability) {
    errors.push('Execution action and capability must match the contract action catalog.')
  }
  if (action?.effect === 'provider_write') {
    const source = contract.sources.find((candidate) => candidate.id === execution.sourceId)
    if (!source || !source.requiredCapabilities.includes(action.capability)) {
      errors.push('Provider execution must target a declared source capability.')
    }
    if (action.idempotencyRequired && !nonEmpty(execution.idempotencyKey)) {
      errors.push('Provider execution requires an idempotency key.')
    }
  } else if (execution.sourceId !== null) {
    errors.push('Decision-only execution must not claim a provider source.')
  }
  const hasProviderReceipt =
    nonEmpty(execution.providerReceipt) ||
    (typeof execution.providerReceipt === 'object' &&
      execution.providerReceipt !== null &&
      !Array.isArray(execution.providerReceipt))
  if (
    action?.effect === 'provider_write' &&
    (execution.status === 'executed' || execution.status === 'succeeded' || execution.status === 'partial') &&
    !hasProviderReceipt
  ) {
    errors.push('Executed provider action must retain a provider receipt.')
  }
  if (execution.transitions.length === 0) {
    errors.push('Execution must retain at least one lifecycle transition.')
  } else {
    const first = execution.transitions[0]
    const last = execution.transitions[execution.transitions.length - 1]
    if (first.from !== null || first.to !== 'proposed') {
      errors.push('Execution lifecycle must begin at proposed.')
    }
    if (last.to !== execution.status) {
      errors.push('Execution lifecycle history must end at the current status.')
    }
    for (let index = 1; index < execution.transitions.length; index += 1) {
      if (execution.transitions[index].from !== execution.transitions[index - 1].to) {
        errors.push('Execution lifecycle transitions must be contiguous.')
        break
      }
    }
  }
  return errors
}

export function decisionMetricsAreCrossSourceCompatible(
  left: DecisionMetricDefinition,
  right: DecisionMetricDefinition
): boolean {
  if (left.crossSource.mode === 'forbidden' || right.crossSource.mode === 'forbidden') {
    return false
  }
  if (
    left.valueType !== right.valueType ||
    left.unit !== right.unit ||
    left.aggregation !== right.aggregation ||
    left.timeBasis !== right.timeBasis
  ) {
    return false
  }
  if (
    left.crossSource.mode === 'same_definition_only' ||
    right.crossSource.mode === 'same_definition_only'
  ) {
    return left.id === right.id
  }
  return left.crossSource.compatibilityKey === right.crossSource.compatibilityKey
}
