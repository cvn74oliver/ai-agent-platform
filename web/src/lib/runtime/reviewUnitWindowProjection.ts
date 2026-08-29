import type {
  ReviewUnitActivityBucket,
  ReviewUnitActivityResolution,
  ReviewUnitProjectionCoverage,
  ReviewUnitProjectionIdentity,
  ReviewUnitProjectionManifest,
  ReviewUnitProjectionValidation,
  ReviewUnitWindowRequest,
  ReviewUnitWindowResolution,
} from '@/lib/runtime/reviewUnitContract'

const UNIT_ROW_ENTITY_ID = '__review_unit__'
const MIN_VALID_TIMESTAMP_MS = 1

export type ReviewUnitProjectionEvent = {
  entityId: string
  occurredAt: string | number
  activityCount: number
  measurePayload?: Record<string, number>
}

export type ReviewUnitProjectionMaterialization = {
  manifest: ReviewUnitProjectionManifest
  activityBuckets: ReviewUnitActivityBucket[]
  validation: ReviewUnitProjectionValidation
}

export type ReviewUnitProjectionAccumulator = {
  addEvent: (event: ReviewUnitProjectionEvent) => boolean
  finalize: () => ReviewUnitProjectionMaterialization
}

export type ReviewUnitWindowWorkingSetMember = {
  entityId: string
  activityCount: number
}

export type ReviewUnitWindowProjectionRead = {
  window: ReviewUnitWindowResolution
  unitEntityTotal: number
  activeEntityTotal: number
  activityTotal: number
  members: Array<{
    entityId: string
    activityCount: number
    allIndexedActivityCount: number
  }>
  series: Array<{
    resolution: 'day' | 'year'
    bucketStart: string
    activeEntityCount: number
    activityCount: number
  }>
}

type ActivityAggregate = {
  activityCount: number
  measurePayload: Record<string, number>
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Review-unit projection activity counts must be finite and non-negative.')
  }
  return Math.round(value)
}

function timestampMs(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(parsed) || parsed < MIN_VALID_TIMESTAMP_MS) {
    throw new Error('Review-unit projection timestamps must be valid and later than epoch.')
  }
  return Math.round(parsed)
}

function assertTimeZone(timeZone: string): string {
  const normalized = normalizeText(timeZone)
  if (!normalized) throw new Error('Review-unit projection timezone is required.')
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(0)
  } catch {
    throw new Error(`Review-unit projection timezone ${normalized} is invalid.`)
  }
  return normalized
}

function localDateParts(timestamp: number, timeZone: string): {
  year: number
  month: number
  day: number
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('Review-unit projection could not resolve a local calendar date.')
  }
  return { year, month, day }
}

function dateKey(parts: { year: number; month: number; day: number }): string {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function bucketStartForResolution(
  timestamp: number,
  timeZone: string,
  resolution: Exclude<ReviewUnitActivityResolution, 'all_indexed'>
): string {
  const parts = localDateParts(timestamp, timeZone)
  if (resolution === 'day') return dateKey(parts)
  if (resolution === 'month') return dateKey({ ...parts, day: 1 })
  if (resolution === 'quarter') {
    return dateKey({ ...parts, month: Math.floor((parts.month - 1) / 3) * 3 + 1, day: 1 })
  }
  return dateKey({ year: parts.year, month: 1, day: 1 })
}

function mergeMeasures(
  target: Record<string, number>,
  source: Record<string, number> | null | undefined
): void {
  for (const [key, value] of Object.entries(source || {})) {
    if (!normalizeText(key) || !Number.isFinite(value) || value < 0) {
      throw new Error('Review-unit projection measures must use non-empty keys and non-negative numbers.')
    }
    target[key] = (target[key] || 0) + value
  }
}

function addAggregate(
  aggregates: Map<string, ActivityAggregate>,
  key: string,
  activityCount: number,
  measurePayload?: Record<string, number>
): void {
  const aggregate = aggregates.get(key) || { activityCount: 0, measurePayload: {} }
  aggregate.activityCount += activityCount
  mergeMeasures(aggregate.measurePayload, measurePayload)
  aggregates.set(key, aggregate)
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

// Deterministic drift fingerprint, not a security primitive.
export function reviewUnitProjectionFingerprint(value: unknown): string {
  const input = canonicalJson(value)
  let left = 0x811c9dc5
  let right = 0x9e3779b9
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index)
    left ^= code
    left = Math.imul(left, 0x01000193) >>> 0
    right ^= code + index
    right = Math.imul(right, 0x85ebca6b) >>> 0
  }
  return `fp1:${left.toString(16).padStart(8, '0')}${right.toString(16).padStart(8, '0')}`
}

function assertIdentity(identity: ReviewUnitProjectionIdentity): ReviewUnitProjectionIdentity {
  const normalized = {
    tenantId: normalizeText(identity.tenantId),
    workspaceType: normalizeText(identity.workspaceType),
    workspaceId: normalizeText(identity.workspaceId),
    workflowId: normalizeText(identity.workflowId),
    decisionSubjectType: normalizeText(identity.decisionSubjectType),
    analysisScope: normalizeText(identity.analysisScope),
    parentId: normalizeText(identity.parentId),
    artifactVersion: normalizeText(identity.artifactVersion),
    reviewUnitId: normalizeText(identity.reviewUnitId),
  }
  if (Object.values(normalized).some((value) => !value)) {
    throw new Error('Review-unit projection identity contains a blank field.')
  }
  return normalized
}

function normalizeCoverage(
  coverage: ReviewUnitProjectionCoverage
): ReviewUnitProjectionCoverage & { startMs: number; endMs: number } {
  const startMs = timestampMs(coverage.startAt)
  const endMs = timestampMs(coverage.endAt)
  if (endMs <= startMs) {
    throw new Error('Review-unit projection coverage must be a non-empty half-open range.')
  }
  return {
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    timeZone: assertTimeZone(coverage.timeZone),
    startMs,
    endMs,
  }
}

export function resolveReviewUnitWindow(params: {
  request: ReviewUnitWindowRequest
  coverage: ReviewUnitProjectionCoverage
}): ReviewUnitWindowResolution {
  const coverage = normalizeCoverage(params.coverage)
  const request: ReviewUnitWindowRequest = {
    kind: params.request.kind,
    presetKey: normalizeText(params.request.presetKey) || null,
    requestedStartAt: normalizeText(params.request.requestedStartAt) || null,
    requestedEndAt: normalizeText(params.request.requestedEndAt) || null,
    timeZone: assertTimeZone(params.request.timeZone),
  }
  if (request.timeZone !== coverage.timeZone) {
    throw new Error('Review-unit window timezone must match the materialized projection timezone.')
  }
  if (request.kind === 'all_indexed') {
    return {
      request,
      effectiveStartAt: coverage.startAt,
      effectiveEndAt: coverage.endAt,
      clampedStart: false,
      clampedEnd: false,
      empty: false,
    }
  }
  if (request.kind === 'preset' && !request.presetKey) {
    throw new Error('A preset review-unit window requires a stable preset key.')
  }
  if (!request.requestedStartAt || !request.requestedEndAt) {
    throw new Error('Preset and Custom review-unit windows require explicit half-open bounds.')
  }
  const requestedStartMs = timestampMs(request.requestedStartAt)
  const requestedEndMs = timestampMs(request.requestedEndAt)
  if (requestedEndMs <= requestedStartMs) {
    throw new Error('Review-unit window end must be after its start.')
  }
  const effectiveStartMs = Math.max(coverage.startMs, requestedStartMs)
  const effectiveEndMs = Math.min(coverage.endMs, requestedEndMs)
  const empty = effectiveEndMs <= effectiveStartMs
  return {
    request,
    effectiveStartAt: new Date(effectiveStartMs).toISOString(),
    effectiveEndAt: new Date(Math.max(effectiveStartMs, effectiveEndMs)).toISOString(),
    clampedStart: effectiveStartMs !== requestedStartMs,
    clampedEnd: effectiveEndMs !== requestedEndMs,
    empty,
  }
}

function incrementCalendarKey(value: string, resolution: 'day' | 'year'): string {
  const parsed = Date.parse(`${value.slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(parsed)) {
    throw new Error('Review-unit projection contains an invalid calendar bucket.')
  }
  const next = new Date(parsed)
  if (resolution === 'year') next.setUTCFullYear(next.getUTCFullYear() + 1)
  else next.setUTCDate(next.getUTCDate() + 1)
  return resolution === 'year'
    ? `${String(next.getUTCFullYear()).padStart(4, '0')}-01-01`
    : next.toISOString().slice(0, 10)
}

function localCalendarKey(
  timestamp: number,
  timeZone: string,
  resolution: 'day' | 'year'
): string {
  const parts = localDateParts(timestamp, timeZone)
  return resolution === 'year'
    ? `${String(parts.year).padStart(4, '0')}-01-01`
    : dateKey(parts)
}

/**
 * Reads an immutable review-unit materialization through one resolved workflow window.
 * The result is adapter-neutral: email senders, portfolio positions, tax records, or any
 * other decision subject all use the same fixed-membership and activity-projection rules.
 */
export function readReviewUnitWindowProjectionMaterialization(params: {
  materialization: ReviewUnitProjectionMaterialization
  request: ReviewUnitWindowRequest
}): ReviewUnitWindowProjectionRead {
  const { manifest, activityBuckets } = params.materialization
  const validation = validateReviewUnitWindowProjection({ manifest, activityBuckets })
  if (validation.errors.length > 0) {
    throw new Error(`Review-unit projection is invalid: ${validation.errors.join(' ')}`)
  }
  const window = resolveReviewUnitWindow({
    request: params.request,
    coverage: manifest.coverage,
  })
  const allIndexedRows = activityBuckets.filter(
    (row) => row.resolution === 'all_indexed' && row.rowKind === 'entity'
  )
  const allIndexedActivityByEntity = new Map(
    allIndexedRows.map((row) => [row.entityId, normalizeCount(row.activityCount)] as const)
  )
  if (
    allIndexedRows.length !== manifest.unitEntityTotal ||
    allIndexedActivityByEntity.size !== manifest.unitEntityTotal
  ) {
    throw new Error('Review-unit projection fixed membership is incomplete.')
  }

  const resolution = params.request.kind === 'all_indexed' ? 'year' : 'day'
  const effectiveStartMs = Date.parse(window.effectiveStartAt)
  const effectiveEndMs = Date.parse(window.effectiveEndAt)
  if (!Number.isFinite(effectiveStartMs) || !Number.isFinite(effectiveEndMs)) {
    throw new Error('Review-unit projection resolved invalid effective bounds.')
  }
  const startKey = localCalendarKey(effectiveStartMs, manifest.coverage.timeZone, resolution)
  const finalKey = window.empty
    ? null
    : localCalendarKey(
        Math.max(effectiveStartMs, effectiveEndMs - 1),
        manifest.coverage.timeZone,
        resolution
      )
  const selectedEntityRows =
    params.request.kind === 'all_indexed'
      ? allIndexedRows
      : activityBuckets.filter(
          (row) =>
            row.resolution === 'day' &&
            row.rowKind === 'entity' &&
            finalKey != null &&
            row.bucketStart >= startKey &&
            row.bucketStart <= finalKey
        )
  const activityByEntity = new Map<string, number>()
  for (const row of selectedEntityRows) {
    activityByEntity.set(
      row.entityId,
      (activityByEntity.get(row.entityId) || 0) + normalizeCount(row.activityCount)
    )
  }
  const members = allIndexedRows
    .map((row) => ({
      entityId: row.entityId,
      activityCount:
        params.request.kind === 'all_indexed'
          ? normalizeCount(row.activityCount)
          : activityByEntity.get(row.entityId) || 0,
      allIndexedActivityCount: allIndexedActivityByEntity.get(row.entityId) || 0,
    }))
    .sort(
      (left, right) =>
        right.activityCount - left.activityCount || left.entityId.localeCompare(right.entityId)
    )
  const activeEntityTotal = members.filter((member) => member.activityCount > 0).length
  const activityTotal = members.reduce((sum, member) => sum + member.activityCount, 0)

  const seriesRows = activityBuckets.filter(
    (row) =>
      row.resolution === resolution &&
      row.rowKind === 'entity' &&
      finalKey != null &&
      row.bucketStart >= startKey &&
      row.bucketStart <= finalKey
  )
  const seriesByBucket = new Map<
    string,
    { activeEntityIds: Set<string>; activityCount: number }
  >()
  for (const row of seriesRows) {
    const aggregate = seriesByBucket.get(row.bucketStart) || {
      activeEntityIds: new Set<string>(),
      activityCount: 0,
    }
    if (row.activityCount > 0) aggregate.activeEntityIds.add(row.entityId)
    aggregate.activityCount += normalizeCount(row.activityCount)
    seriesByBucket.set(row.bucketStart, aggregate)
  }
  const series: ReviewUnitWindowProjectionRead['series'] = []
  if (finalKey != null) {
    for (let key = startKey; key <= finalKey; key = incrementCalendarKey(key, resolution)) {
      const aggregate = seriesByBucket.get(key)
      series.push({
        resolution,
        bucketStart: key,
        activeEntityCount: aggregate?.activeEntityIds.size || 0,
        activityCount: aggregate?.activityCount || 0,
      })
    }
  }
  if (series.reduce((sum, bucket) => sum + bucket.activityCount, 0) !== activityTotal) {
    throw new Error('Review-unit projection series does not reconcile with window activity.')
  }

  return {
    window,
    unitEntityTotal: manifest.unitEntityTotal,
    activeEntityTotal,
    activityTotal,
    members,
    series,
  }
}

/**
 * Resolves the decision-working set without mutating immutable review-unit membership.
 * All Indexed retains the complete published unit. Narrower windows contain only entities
 * with activity in the resolved interval. This contract is platform-generic: Gmail senders,
 * portfolio positions, tax transactions, or any other decision subject use the same rule.
 */
export function resolveReviewUnitWindowWorkingEntityIds(params: {
  windowKind: ReviewUnitWindowRequest['kind']
  unitEntityTotal: number
  activeEntityTotal: number
  members: ReviewUnitWindowWorkingSetMember[]
}): string[] {
  const unitEntityTotal = normalizeCount(params.unitEntityTotal)
  const activeEntityTotal = normalizeCount(params.activeEntityTotal)
  const memberIds = params.members.map((member) => normalizeText(member.entityId))
  const uniqueMemberIds = new Set(memberIds)
  if (
    memberIds.some((entityId) => !entityId) ||
    uniqueMemberIds.size !== memberIds.length ||
    memberIds.length !== unitEntityTotal
  ) {
    throw new Error('Review-unit window members do not equal fixed review-unit membership.')
  }
  const activeEntityIds = params.members
    .filter((member) => normalizeCount(member.activityCount) > 0)
    .map((member) => normalizeText(member.entityId))
  if (activeEntityIds.length !== activeEntityTotal) {
    throw new Error('Review-unit active entity total does not match window activity membership.')
  }
  return params.windowKind === 'all_indexed' ? memberIds : activeEntityIds
}

function rowIdentity(identity: ReviewUnitProjectionIdentity) {
  return {
    tenantId: identity.tenantId,
    workspaceType: identity.workspaceType,
    workspaceId: identity.workspaceId,
    workflowId: identity.workflowId,
    decisionSubjectType: identity.decisionSubjectType,
    analysisScope: identity.analysisScope,
    parentId: identity.parentId,
    artifactVersion: identity.artifactVersion,
    reviewUnitId: identity.reviewUnitId,
  }
}

export function createReviewUnitWindowProjectionAccumulator(params: {
  identity: ReviewUnitProjectionIdentity
  adapterId: string
  adapterSchemaVersion: number
  memberEntityIds: string[]
  coverage: ReviewUnitProjectionCoverage
  metadata?: Record<string, unknown>
}): ReviewUnitProjectionAccumulator {
  const identity = assertIdentity(params.identity)
  const coverage = normalizeCoverage(params.coverage)
  const adapterId = normalizeText(params.adapterId)
  const adapterSchemaVersion = normalizeCount(params.adapterSchemaVersion)
  if (!adapterId || adapterSchemaVersion < 1) {
    throw new Error('Review-unit projection adapter identity is invalid.')
  }
  const members = params.memberEntityIds.map(normalizeText).sort()
  if (members.length === 0 || members.some((member) => !member)) {
    throw new Error('Review-unit projection requires non-empty fixed membership.')
  }
  const memberSet = new Set(members)
  if (memberSet.size !== members.length || memberSet.has(UNIT_ROW_ENTITY_ID)) {
    throw new Error('Review-unit projection membership contains a duplicate or reserved entity ID.')
  }

  const allIndexedByEntity = new Map<string, ActivityAggregate>()
  const resolutionEntityAggregates = new Map<ReviewUnitActivityResolution, Map<string, ActivityAggregate>>(
    (['day', 'month', 'quarter', 'year'] as const).map(
      (resolution) =>
        [resolution, new Map<string, ActivityAggregate>()] as const
    )
  )
  for (const member of members) {
    allIndexedByEntity.set(member, { activityCount: 0, measurePayload: {} })
  }

  const addEvent = (event: ReviewUnitProjectionEvent): boolean => {
    const entityId = normalizeText(event.entityId)
    if (!memberSet.has(entityId)) {
      throw new Error(`Review-unit projection event references non-member entity ${entityId || '(blank)'}.`)
    }
    const occurredAtMs = timestampMs(event.occurredAt)
    if (occurredAtMs < coverage.startMs || occurredAtMs >= coverage.endMs) return false
    const activityCount = normalizeCount(event.activityCount)
    const allIndexed = allIndexedByEntity.get(entityId)
    if (!allIndexed) throw new Error('Review-unit projection membership index drifted.')
    allIndexed.activityCount += activityCount
    mergeMeasures(allIndexed.measurePayload, event.measurePayload)
    for (const resolution of ['day', 'month', 'quarter', 'year'] as const) {
      const bucketStart = bucketStartForResolution(occurredAtMs, coverage.timeZone, resolution)
      addAggregate(
        resolutionEntityAggregates.get(resolution) as Map<string, ActivityAggregate>,
        `${bucketStart}\u0000${entityId}`,
        activityCount,
        event.measurePayload
      )
    }
    return true
  }

  const finalize = (): ReviewUnitProjectionMaterialization => {
    const rows: ReviewUnitActivityBucket[] = []
    const coverageBucketStart = bucketStartForResolution(coverage.startMs, coverage.timeZone, 'day')
    const unitAllIndexed: ActivityAggregate = { activityCount: 0, measurePayload: {} }
    for (const entityId of members) {
      const aggregate = allIndexedByEntity.get(entityId) as ActivityAggregate
      unitAllIndexed.activityCount += aggregate.activityCount
      mergeMeasures(unitAllIndexed.measurePayload, aggregate.measurePayload)
      rows.push({
        ...rowIdentity(identity),
        resolution: 'all_indexed',
        bucketStart: coverageBucketStart,
        rowKind: 'entity',
        entityId,
        activityCount: aggregate.activityCount,
        measurePayload: { ...aggregate.measurePayload },
      })
    }
    rows.push({
      ...rowIdentity(identity),
      resolution: 'all_indexed',
      bucketStart: coverageBucketStart,
      rowKind: 'unit',
      entityId: UNIT_ROW_ENTITY_ID,
      activityCount: unitAllIndexed.activityCount,
      measurePayload: { ...unitAllIndexed.measurePayload },
    })

    for (const resolution of ['day', 'month', 'quarter', 'year'] as const) {
      const unitAggregates = new Map<string, ActivityAggregate>()
      for (const [key, aggregate] of resolutionEntityAggregates.get(resolution) || []) {
        const separatorIndex = key.indexOf('\u0000')
        const bucketStart = key.slice(0, separatorIndex)
        const entityId = key.slice(separatorIndex + 1)
        rows.push({
          ...rowIdentity(identity),
          resolution,
          bucketStart,
          rowKind: 'entity',
          entityId,
          activityCount: aggregate.activityCount,
          measurePayload: { ...aggregate.measurePayload },
        })
        addAggregate(
          unitAggregates,
          bucketStart,
          aggregate.activityCount,
          aggregate.measurePayload
        )
      }
      for (const [bucketStart, aggregate] of unitAggregates) {
        rows.push({
          ...rowIdentity(identity),
          resolution,
          bucketStart,
          rowKind: 'unit',
          entityId: UNIT_ROW_ENTITY_ID,
          activityCount: aggregate.activityCount,
          measurePayload: { ...aggregate.measurePayload },
        })
      }
    }

    rows.sort(
      (left, right) =>
        left.resolution.localeCompare(right.resolution) ||
        left.bucketStart.localeCompare(right.bucketStart) ||
        left.rowKind.localeCompare(right.rowKind) ||
        left.entityId.localeCompare(right.entityId)
    )
    const membershipHash = reviewUnitProjectionFingerprint(members)
    const manifestBase = {
      ...rowIdentity(identity),
      adapterId,
      adapterSchemaVersion,
      unitEntityTotal: members.length,
      membershipHash,
      allIndexedActivityTotal: unitAllIndexed.activityCount,
      coverage: {
        startAt: coverage.startAt,
        endAt: coverage.endAt,
        timeZone: coverage.timeZone,
      },
      supportedResolutions: [
        'all_indexed',
        'day',
        'month',
        'quarter',
        'year',
      ] as ReviewUnitActivityResolution[],
      validationStatus: 'candidate_validated' as const,
      metadata: { ...(params.metadata || {}) },
    }
    const projectionHash = reviewUnitProjectionFingerprint({ manifest: manifestBase, rows })
    const manifest: ReviewUnitProjectionManifest = { ...manifestBase, projectionHash }
    const validation = validateReviewUnitWindowProjection({ manifest, activityBuckets: rows })
    if (validation.errors.length > 0) {
      throw new Error(`Review-unit window projection validation failed: ${validation.errors.join(' ')}`)
    }
    return { manifest, activityBuckets: rows, validation }
  }

  return { addEvent, finalize }
}

export function materializeReviewUnitWindowProjection(params: {
  identity: ReviewUnitProjectionIdentity
  adapterId: string
  adapterSchemaVersion: number
  memberEntityIds: string[]
  coverage: ReviewUnitProjectionCoverage
  events: ReviewUnitProjectionEvent[]
  metadata?: Record<string, unknown>
}): ReviewUnitProjectionMaterialization {
  const accumulator = createReviewUnitWindowProjectionAccumulator(params)
  for (const event of params.events) accumulator.addEvent(event)
  return accumulator.finalize()
}

export function validateReviewUnitWindowProjection(params: {
  manifest: ReviewUnitProjectionManifest
  activityBuckets: ReviewUnitActivityBucket[]
}): ReviewUnitProjectionValidation {
  const errors: string[] = []
  const identity = assertIdentity(params.manifest)
  const coverage = normalizeCoverage(params.manifest.coverage)
  const matchingRows = params.activityBuckets.filter((row) => {
    const rowMatches =
      row.tenantId === identity.tenantId &&
      row.workspaceType === identity.workspaceType &&
      row.workspaceId === identity.workspaceId &&
      row.workflowId === identity.workflowId &&
      row.decisionSubjectType === identity.decisionSubjectType &&
      row.analysisScope === identity.analysisScope &&
      row.parentId === identity.parentId &&
      row.artifactVersion === identity.artifactVersion &&
      row.reviewUnitId === identity.reviewUnitId
    if (!rowMatches) errors.push('Projection activity row identity does not match its manifest.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.bucketStart)) {
      errors.push('Projection activity row has an invalid calendar bucket.')
    }
    try {
      normalizeCount(row.activityCount)
      mergeMeasures({}, row.measurePayload)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Projection row is invalid.')
    }
    return rowMatches
  })
  if (matchingRows.length !== params.activityBuckets.length) {
    errors.push('Projection activity rows include mixed identity or artifact versions.')
  }

  const allIndexedEntityRows = matchingRows.filter(
    (row) => row.resolution === 'all_indexed' && row.rowKind === 'entity'
  )
  const uniqueEntityIds = new Set(allIndexedEntityRows.map((row) => row.entityId))
  if (
    uniqueEntityIds.size !== allIndexedEntityRows.length ||
    uniqueEntityIds.size !== params.manifest.unitEntityTotal
  ) {
    errors.push('All Indexed entity rows do not equal fixed review-unit membership.')
  }
  const allIndexedActivityTotal = allIndexedEntityRows.reduce(
    (sum, row) => sum + row.activityCount,
    0
  )
  const activeEntityTotal = allIndexedEntityRows.filter((row) => row.activityCount > 0).length
  const unitAllIndexedRows = matchingRows.filter(
    (row) => row.resolution === 'all_indexed' && row.rowKind === 'unit'
  )
  if (
    unitAllIndexedRows.length !== 1 ||
    unitAllIndexedRows[0]?.activityCount !== allIndexedActivityTotal ||
    params.manifest.allIndexedActivityTotal !== allIndexedActivityTotal
  ) {
    errors.push('All Indexed unit total does not reconcile with entity activity.')
  }
  const dailyActivityTotal = matchingRows
    .filter((row) => row.resolution === 'day' && row.rowKind === 'entity')
    .reduce((sum, row) => sum + row.activityCount, 0)
  const monthlyActivityTotal = matchingRows
    .filter((row) => row.resolution === 'month' && row.rowKind === 'entity')
    .reduce((sum, row) => sum + row.activityCount, 0)
  if (
    dailyActivityTotal !== allIndexedActivityTotal ||
    monthlyActivityTotal !== allIndexedActivityTotal
  ) {
    errors.push('Daily/monthly activity does not reconcile with All Indexed activity.')
  }
  for (const resolution of ['day', 'month', 'quarter', 'year'] as const) {
    const entityByBucket = new Map<string, number>()
    for (const row of matchingRows) {
      if (row.resolution !== resolution || row.rowKind !== 'entity') continue
      if (!uniqueEntityIds.has(row.entityId)) {
        errors.push(`${resolution} activity references an entity outside fixed membership.`)
      }
      entityByBucket.set(
        row.bucketStart,
        (entityByBucket.get(row.bucketStart) || 0) + row.activityCount
      )
    }
    const unitRows = matchingRows.filter(
      (row) => row.resolution === resolution && row.rowKind === 'unit'
    )
    for (const row of unitRows) {
      if ((entityByBucket.get(row.bucketStart) || 0) !== row.activityCount) {
        errors.push(`${resolution} unit bucket does not reconcile with entity activity.`)
      }
      entityByBucket.delete(row.bucketStart)
    }
    if (entityByBucket.size > 0) {
      errors.push(`${resolution} entity activity is missing a unit rollup bucket.`)
    }
  }
  if (coverage.startMs < MIN_VALID_TIMESTAMP_MS || coverage.endMs <= coverage.startMs) {
    errors.push('Projection coverage is invalid.')
  }
  const expectedHash = reviewUnitProjectionFingerprint({
    manifest: {
      tenantId: params.manifest.tenantId,
      workspaceType: params.manifest.workspaceType,
      workspaceId: params.manifest.workspaceId,
      workflowId: params.manifest.workflowId,
      decisionSubjectType: params.manifest.decisionSubjectType,
      analysisScope: params.manifest.analysisScope,
      parentId: params.manifest.parentId,
      artifactVersion: params.manifest.artifactVersion,
      reviewUnitId: params.manifest.reviewUnitId,
      adapterId: params.manifest.adapterId,
      adapterSchemaVersion: params.manifest.adapterSchemaVersion,
      unitEntityTotal: params.manifest.unitEntityTotal,
      membershipHash: params.manifest.membershipHash,
      allIndexedActivityTotal: params.manifest.allIndexedActivityTotal,
      coverage: params.manifest.coverage,
      supportedResolutions: params.manifest.supportedResolutions,
      validationStatus: params.manifest.validationStatus,
      metadata: params.manifest.metadata,
    },
    rows: params.activityBuckets,
  })
  if (params.manifest.projectionHash !== expectedHash) {
    errors.push('Projection hash does not match the manifest and activity rows.')
  }
  return {
    errors: Array.from(new Set(errors)),
    unitEntityTotal: params.manifest.unitEntityTotal,
    activityEntityTotal: uniqueEntityIds.size,
    activeEntityTotal,
    allIndexedActivityTotal,
    dailyActivityTotal,
    monthlyActivityTotal,
  }
}

export const REVIEW_UNIT_PROJECTION_UNIT_ENTITY_ID = UNIT_ROW_ENTITY_ID
