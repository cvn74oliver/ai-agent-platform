export type ReviewUnitPartitionValue = {
  key: string
  label: string
  sourceKind: string
  unitRole: string
}

export type ReviewUnitPartitionPathEntry = ReviewUnitPartitionValue & {
  dimension: string
}

export type ReviewUnitSizingPolicy = {
  targetMin: number
  targetMax: number
  hardMax: number
}

export type WorkspaceUniverseDefinition = {
  type: string
  label: string
}

export type WorkspaceDecisionSubjectDefinition = {
  type: string
  singularLabel: string
  pluralLabel: string
}

export type WorkspaceDecisionActionDefinition = {
  id: string
  label: string
}

export type WorkspaceDecisionWorkflowBlueprint<TDimension extends string = string> = {
  schemaVersion: 1
  workspaceType: string
  workflowId: string
  universe: WorkspaceUniverseDefinition
  decisionSubject: WorkspaceDecisionSubjectDefinition
  evidenceKinds: readonly string[]
  actions: readonly WorkspaceDecisionActionDefinition[]
  reviewUnits: {
    dimensions: readonly TDimension[]
    sizing: ReviewUnitSizingPolicy
  }
}

export type ReviewUnitManifestEntry = {
  unitId: string
  label: string
  sourceKind: string
  sourceKey: string
  entityCount: number
  sharePct: number
  unitRole: string
  decompositionPath: string[]
  publicationStatus: 'materialized'
}

export type ReviewUnitAdapter<
  TEntity,
  TContext,
  TDimension extends string = string,
> = {
  adapterId: string
  blueprint: WorkspaceDecisionWorkflowBlueprint<TDimension>
  entityId: (entity: TEntity) => string
  partitionValue: (params: {
    dimension: TDimension
    entity: TEntity
    context: TContext
  }) => ReviewUnitPartitionValue
  compatibilityUnitId?: (params: {
    parentId: string
    path: ReviewUnitPartitionPathEntry[]
    context: TContext
  }) => string | null
  unitLabel?: (params: {
    path: ReviewUnitPartitionPathEntry[]
    duplicateTerminalLabels: Set<string>
    context: TContext
  }) => string
}

export type MaterializedReviewUnitPlan = {
  blueprintIdentity: {
    workspaceType: string
    workflowId: string
    decisionSubjectType: string
  }
  units: ReviewUnitManifestEntry[]
  reviewUnitIdByEntityId: Map<string, string>
}

export type ReviewUnitContractValidation = {
  errors: string[]
  parentEntityCount: number
  assignedEntityCount: number
  uniqueAssignedEntityCount: number
  largestUnitEntityCount: number
}

export type ReviewUnitMembershipScope = {
  tenantId: string
  workspaceType: string
  workspaceId: string
  workflowId: string
  decisionSubjectType: string
  analysisScope: string
  parentId: string
  artifactVersion: string
  reviewUnitId: string
}

export type ReviewUnitMembershipPage<TEntityRecord> = {
  total: number
  records: TEntityRecord[]
}

export interface ReviewUnitMembershipStore<TEntityRecord> {
  count(scope: ReviewUnitMembershipScope): Promise<number>
  loadPage(
    scope: ReviewUnitMembershipScope & { offset: number; limit: number }
  ): Promise<ReviewUnitMembershipPage<TEntityRecord>>
}

type ReviewUnitLeaf<TEntity> = {
  entities: TEntity[]
  path: ReviewUnitPartitionPathEntry[]
}

function normalizedToken(value: string | null | undefined, fallback = 'unknown'): string {
  const normalized = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
}

export function defaultReviewUnitId(
  parentId: string,
  path: ReviewUnitPartitionPathEntry[]
): string {
  const suffix = path
    .map((entry) => `${normalizedToken(entry.dimension)}-${normalizedToken(entry.key)}`)
    .join(':')
  return `review-unit:${normalizedToken(parentId)}:${suffix || 'all'}`
}

function defaultUnitLabel(
  path: ReviewUnitPartitionPathEntry[],
  duplicateTerminalLabels: Set<string>
): string {
  const last = path[path.length - 1]
  if (!last) return 'All entities'
  if (!duplicateTerminalLabels.has(last.label)) return last.label
  return path.map((entry) => entry.label).join(' · ')
}

function splitLeaf<TEntity, TContext>(params: {
  leaf: ReviewUnitLeaf<TEntity>
  dimension: string
  context: TContext
  entityId: (entity: TEntity) => string
  partitionValue: (params: {
    dimension: string
    entity: TEntity
    context: TContext
  }) => ReviewUnitPartitionValue
}): ReviewUnitLeaf<TEntity>[] | null {
  const buckets = new Map<
    string,
    { value: ReviewUnitPartitionValue; entities: TEntity[] }
  >()
  for (const entity of params.leaf.entities) {
    const value = params.partitionValue({
      dimension: params.dimension,
      entity,
      context: params.context,
    })
    const key = normalizedToken(value.key)
    const bucket = buckets.get(key) || {
      value: { ...value, key },
      entities: [],
    }
    bucket.entities.push(entity)
    buckets.set(key, bucket)
  }
  if (buckets.size < 2) return null
  return Array.from(buckets.values())
    .sort((left, right) => left.value.key.localeCompare(right.value.key))
    .map((bucket) => ({
      entities: bucket.entities
        .slice()
        .sort((left, right) => params.entityId(left).localeCompare(params.entityId(right))),
      path: [
        ...params.leaf.path,
        { ...bucket.value, dimension: params.dimension },
      ],
    }))
}

function assertBlueprint<TDimension extends string>(
  blueprint: WorkspaceDecisionWorkflowBlueprint<TDimension>,
  actionable: boolean
): void {
  const requiredValues = [
    blueprint.workspaceType,
    blueprint.workflowId,
    blueprint.universe.type,
    blueprint.universe.label,
    blueprint.decisionSubject.type,
    blueprint.decisionSubject.singularLabel,
    blueprint.decisionSubject.pluralLabel,
  ]
  if (requiredValues.some((value) => !value.trim())) {
    throw new Error('Workspace decision workflow blueprint contains a blank identity or label.')
  }
  const dimensions = blueprint.reviewUnits.dimensions.map((dimension) => dimension.trim())
  if (
    dimensions.some((dimension) => !dimension) ||
    new Set(dimensions).size !== dimensions.length
  ) {
    throw new Error('Workspace decision workflow blueprint dimensions must be non-empty and unique.')
  }
  const actionIds = blueprint.actions.map((action) => action.id.trim())
  if (
    actionable &&
    (actionIds.length === 0 ||
      actionIds.some((actionId) => !actionId) ||
      new Set(actionIds).size !== actionIds.length)
  ) {
    throw new Error('An actionable workflow blueprint must define unique decision actions.')
  }
  const policy = blueprint.reviewUnits.sizing
  if (
    policy.targetMin < 0 ||
    policy.targetMax < 1 ||
    policy.targetMin > policy.targetMax ||
    policy.hardMax < policy.targetMax
  ) {
    throw new Error('Review-unit sizing policy is invalid.')
  }
}

export function materializeReviewUnits<
  TEntity,
  TContext,
  TDimension extends string,
>(params: {
  parentId: string
  parentLabel: string
  actionable: boolean
  entities: TEntity[]
  context: TContext
  adapter: ReviewUnitAdapter<TEntity, TContext, TDimension>
}): MaterializedReviewUnitPlan {
  const blueprint = params.adapter.blueprint
  const blueprintIdentity = {
    workspaceType: blueprint.workspaceType,
    workflowId: blueprint.workflowId,
    decisionSubjectType: blueprint.decisionSubject.type,
  }
  assertBlueprint(blueprint, params.actionable)
  if (!params.actionable) {
    return { blueprintIdentity, units: [], reviewUnitIdByEntityId: new Map() }
  }
  const entityIds = new Set<string>()
  for (const entity of params.entities) {
    const entityId = params.adapter.entityId(entity).trim()
    if (!entityId || entityIds.has(entityId)) {
      throw new Error(
        `Review-unit candidate ${params.parentId} contains a missing or duplicate entity ID.`
      )
    }
    entityIds.add(entityId)
  }

  let leaves: ReviewUnitLeaf<TEntity>[] = [
    {
      entities: params.entities
        .slice()
        .sort((left, right) =>
          params.adapter.entityId(left).localeCompare(params.adapter.entityId(right))
        ),
      path: [],
    },
  ]
  const policy = blueprint.reviewUnits.sizing
  for (const dimension of blueprint.reviewUnits.dimensions) {
    leaves = leaves.flatMap((leaf) => {
      if (leaf.entities.length <= policy.targetMax && leaf.path.length > 0) {
        return [leaf]
      }
      return (
        splitLeaf({
          leaf,
          dimension,
          context: params.context,
          entityId: params.adapter.entityId,
          partitionValue: params.adapter.partitionValue as (params: {
            dimension: string
            entity: TEntity
            context: TContext
          }) => ReviewUnitPartitionValue,
        }) || [leaf]
      )
    })
  }
  leaves = leaves.map((leaf) =>
    leaf.path.length > 0
      ? leaf
      : {
          ...leaf,
          path: [
            {
              dimension: 'all',
              key: 'all',
              label: `All ${params.parentLabel}`,
              sourceKind: 'materialized_partition',
              unitRole: 'bounded_partition',
            },
          ],
        }
  )
  const oversized = leaves.filter((leaf) => leaf.entities.length > policy.hardMax)
  if (oversized.length > 0) {
    throw new Error(
      `Review-unit candidate ${params.parentId} cannot be semantically partitioned below ${policy.hardMax} ${blueprint.decisionSubject.pluralLabel.toLowerCase()}; largest unresolved unit has ${Math.max(...oversized.map((leaf) => leaf.entities.length))}.`
    )
  }

  const terminalLabelCounts = new Map<string, number>()
  for (const leaf of leaves) {
    const label = leaf.path[leaf.path.length - 1]?.label || 'All entities'
    terminalLabelCounts.set(label, (terminalLabelCounts.get(label) || 0) + 1)
  }
  const duplicateTerminalLabels = new Set(
    Array.from(terminalLabelCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([label]) => label)
  )
  const reviewUnitIdByEntityId = new Map<string, string>()
  const units = leaves
    .map((leaf) => {
      const compatibleId = params.adapter.compatibilityUnitId?.({
        parentId: params.parentId,
        path: leaf.path,
        context: params.context,
      })
      const unitId = compatibleId || defaultReviewUnitId(params.parentId, leaf.path)
      for (const entity of leaf.entities) {
        reviewUnitIdByEntityId.set(params.adapter.entityId(entity), unitId)
      }
      const terminal = leaf.path[leaf.path.length - 1]
      return {
        unitId,
        label:
          params.adapter.unitLabel?.({
            path: leaf.path,
            duplicateTerminalLabels,
            context: params.context,
          }) || defaultUnitLabel(leaf.path, duplicateTerminalLabels),
        sourceKind: terminal.sourceKind,
        sourceKey: terminal.key,
        entityCount: leaf.entities.length,
        sharePct:
          params.entities.length > 0
            ? Math.round((leaf.entities.length / params.entities.length) * 100)
            : 0,
        unitRole: terminal.unitRole,
        decompositionPath: leaf.path.map(
          (entry) => `${entry.dimension}:${entry.key}`
        ),
        publicationStatus: 'materialized' as const,
      }
    })
    .sort(
      (left, right) =>
        left.label.localeCompare(right.label) || left.unitId.localeCompare(right.unitId)
    )
  return { blueprintIdentity, units, reviewUnitIdByEntityId }
}

export function validateReviewUnitContract(params: {
  parentId: string
  actionable: boolean
  parentEntityIds: string[]
  units: ReviewUnitManifestEntry[]
  reviewUnitIdByEntityId: Map<string, string>
  hardMax: number
}): ReviewUnitContractValidation {
  const errors: string[] = []
  const parentIds = new Set(params.parentEntityIds)
  if (parentIds.size !== params.parentEntityIds.length) {
    errors.push(`${params.parentId}: parent membership contains duplicate entity IDs.`)
  }
  const unitIds = new Set(params.units.map((unit) => unit.unitId))
  if (unitIds.size !== params.units.length) {
    errors.push(`${params.parentId}: unit IDs are not unique.`)
  }
  const countsByUnit = new Map<string, number>()
  for (const [entityId, reviewUnitId] of params.reviewUnitIdByEntityId.entries()) {
    if (!parentIds.has(entityId)) {
      errors.push(`${params.parentId}: child membership contains an unknown entity.`)
    }
    if (!unitIds.has(reviewUnitId)) {
      errors.push(`${params.parentId}: entity references an unknown child unit.`)
    }
    countsByUnit.set(reviewUnitId, (countsByUnit.get(reviewUnitId) || 0) + 1)
  }
  if (params.actionable && params.units.length === 0) {
    errors.push(`${params.parentId}: actionable parent has no child units.`)
  }
  if (
    !params.actionable &&
    (params.units.length > 0 || params.reviewUnitIdByEntityId.size > 0)
  ) {
    errors.push(`${params.parentId}: informational parent must not publish review membership.`)
  }
  for (const unit of params.units) {
    const actualCount = countsByUnit.get(unit.unitId) || 0
    if (actualCount !== unit.entityCount) {
      errors.push(
        `${params.parentId}/${unit.unitId}: manifest count ${unit.entityCount} does not match membership ${actualCount}.`
      )
    }
    if (unit.entityCount > params.hardMax) {
      errors.push(`${params.parentId}/${unit.unitId}: child exceeds the hard maximum.`)
    }
  }
  if (params.actionable && params.reviewUnitIdByEntityId.size !== parentIds.size) {
    errors.push(`${params.parentId}: child union does not equal parent membership.`)
  }
  return {
    errors,
    parentEntityCount: parentIds.size,
    assignedEntityCount: Array.from(countsByUnit.values()).reduce(
      (sum, count) => sum + count,
      0
    ),
    uniqueAssignedEntityCount: params.reviewUnitIdByEntityId.size,
    largestUnitEntityCount: params.units.reduce(
      (largest, unit) => Math.max(largest, unit.entityCount),
      0
    ),
  }
}
