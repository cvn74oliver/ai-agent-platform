import type {
  GmailCleanupGroupReviewUnit,
  GmailCleanupGroupReviewUnitBasis,
} from '@/lib/runtime/gmailCleanupWorkspace'

export const GMAIL_REVIEW_UNIT_TARGET_MIN = 50
export const GMAIL_REVIEW_UNIT_TARGET_MAX = 300
export const GMAIL_REVIEW_UNIT_HARD_MAX = 400

export type GmailReviewUnitSeed = {
  senderKey: string
  semanticFamilyKey: string | null
  semanticSubtypeKey: string | null
  semanticPatternKey: string | null
  lastActivityAt: string | null
  messageCount: number
  assignmentReason: string | null
  exclusionReason: string | null
}

type ReviewUnitDimension =
  | 'subtype'
  | 'family'
  | 'pattern'
  | 'protection_reason'
  | 'exclusion_reason'
  | 'recency'
  | 'volume'

type PartitionValue = {
  key: string
  label: string
  sourceKind: GmailCleanupGroupReviewUnit['source_kind']
  unitRole: GmailCleanupGroupReviewUnit['unit_role']
}

type PartitionPathEntry = PartitionValue & {
  dimension: ReviewUnitDimension | 'all'
}

type ReviewUnitLeaf = {
  senders: GmailReviewUnitSeed[]
  path: PartitionPathEntry[]
}

export type GmailMaterializedReviewUnitPlan = {
  basis: GmailCleanupGroupReviewUnitBasis
  units: GmailCleanupGroupReviewUnit[]
  reviewUnitIdBySenderKey: Map<string, string>
}

export type GmailReviewUnitContractValidation = {
  errors: string[]
  parentSenderCount: number
  assignedSenderCount: number
  uniqueAssignedSenderCount: number
  largestUnitSenderCount: number
}

const MARKETING_PARENT_IDS = new Set([
  'semantic.marketing_subscriptions',
  'semantic-parent:subscription-senders:family:marketing_promotional',
])

function normalizedToken(value: string | null | undefined, fallback = 'unknown'): string {
  const normalized = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function recencyValue(timestamp: string | null, cutoffAt: string): PartitionValue {
  const cutoffMs = Date.parse(cutoffAt)
  const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN
  if (!Number.isFinite(cutoffMs) || !Number.isFinite(timestampMs) || timestampMs > cutoffMs) {
    return {
      key: 'unknown',
      label: 'Unknown recency',
      sourceKind: 'recency_band',
      unitRole: 'bounded_partition',
    }
  }
  const days = Math.floor((cutoffMs - timestampMs) / 86_400_000)
  if (days <= 30) {
    return { key: '0_30_days', label: 'Active in the last 30 days', sourceKind: 'recency_band', unitRole: 'bounded_partition' }
  }
  if (days <= 90) {
    return { key: '31_90_days', label: 'Active 31–90 days ago', sourceKind: 'recency_band', unitRole: 'bounded_partition' }
  }
  if (days <= 365) {
    return { key: '91_365_days', label: 'Active 91–365 days ago', sourceKind: 'recency_band', unitRole: 'bounded_partition' }
  }
  return { key: 'over_365_days', label: 'Inactive for over 365 days', sourceKind: 'recency_band', unitRole: 'bounded_partition' }
}

function volumeValue(messageCount: number): PartitionValue {
  const count = Number.isFinite(messageCount) ? Math.max(0, Math.floor(messageCount)) : 0
  if (count <= 1) {
    return { key: '1_message', label: '1 supporting message', sourceKind: 'volume_band', unitRole: 'bounded_partition' }
  }
  if (count <= 5) {
    return { key: '2_5_messages', label: '2–5 supporting messages', sourceKind: 'volume_band', unitRole: 'bounded_partition' }
  }
  if (count <= 20) {
    return { key: '6_20_messages', label: '6–20 supporting messages', sourceKind: 'volume_band', unitRole: 'bounded_partition' }
  }
  return { key: 'over_20_messages', label: 'Over 20 supporting messages', sourceKind: 'volume_band', unitRole: 'bounded_partition' }
}

function valueForDimension(params: {
  dimension: ReviewUnitDimension
  sender: GmailReviewUnitSeed
  cutoffAt: string
}): PartitionValue {
  const sender = params.sender
  if (params.dimension === 'subtype') {
    if (sender.semanticSubtypeKey) {
      return {
        key: normalizedToken(sender.semanticSubtypeKey),
        label: humanize(sender.semanticSubtypeKey),
        sourceKind: 'family_subtype',
        unitRole: 'subtype',
      }
    }
    if (normalizedToken(sender.semanticFamilyKey) === 'marketing_promotional') {
      return {
        key: 'marketing_promotional_remainder',
        label: 'Broad marketing / promotional remainder',
        sourceKind: 'family_remainder',
        unitRole: 'dominant_remainder',
      }
    }
    return {
      key: 'non_promotional_spillover',
      label: 'Non-promotional spillover / exceptions',
      sourceKind: 'spillover',
      unitRole: 'spillover',
    }
  }
  if (params.dimension === 'family') {
    const key = normalizedToken(sender.semanticFamilyKey)
    return {
      key,
      label: key === 'unknown' ? 'Unknown semantic family' : humanize(key),
      sourceKind: 'family_lane',
      unitRole: 'family_lane',
    }
  }
  if (params.dimension === 'pattern') {
    const key = normalizedToken(sender.semanticPatternKey)
    return {
      key,
      label: key === 'unknown' ? 'Unknown semantic pattern' : humanize(key),
      sourceKind: 'pattern_subtype',
      unitRole: 'subtype',
    }
  }
  if (params.dimension === 'protection_reason') {
    const key = normalizedToken(sender.assignmentReason)
    return {
      key,
      label: key === 'unknown' ? 'Unknown protection reason' : humanize(key),
      sourceKind: 'assignment_reason',
      unitRole: 'reason',
    }
  }
  if (params.dimension === 'exclusion_reason') {
    const key = normalizedToken(sender.exclusionReason)
    return {
      key,
      label: key === 'unknown' ? 'Unknown exclusion reason' : humanize(key),
      sourceKind: 'exclusion_reason',
      unitRole: 'reason',
    }
  }
  if (params.dimension === 'recency') return recencyValue(sender.lastActivityAt, params.cutoffAt)
  return volumeValue(sender.messageCount)
}

function dimensionsForBasis(basis: GmailCleanupGroupReviewUnitBasis): ReviewUnitDimension[] {
  if (basis === 'subtype-first') return ['subtype', 'pattern', 'recency', 'volume']
  if (basis === 'protection-reason-first') {
    return ['protection_reason', 'family', 'subtype', 'pattern', 'recency', 'volume']
  }
  if (basis === 'exclusion-reason-first') {
    return ['exclusion_reason', 'family', 'subtype', 'pattern', 'recency', 'volume']
  }
  return ['family', 'subtype', 'pattern', 'recency', 'volume']
}

function splitLeaf(params: {
  leaf: ReviewUnitLeaf
  dimension: ReviewUnitDimension
  cutoffAt: string
}): ReviewUnitLeaf[] | null {
  const buckets = new Map<string, { value: PartitionValue; senders: GmailReviewUnitSeed[] }>()
  for (const sender of params.leaf.senders) {
    const value = valueForDimension({ dimension: params.dimension, sender, cutoffAt: params.cutoffAt })
    const bucket = buckets.get(value.key) || { value, senders: [] }
    bucket.senders.push(sender)
    buckets.set(value.key, bucket)
  }
  if (buckets.size < 2) return null
  return Array.from(buckets.values())
    .sort((left, right) => left.value.key.localeCompare(right.value.key))
    .map((bucket) => ({
      senders: bucket.senders.slice().sort((left, right) => left.senderKey.localeCompare(right.senderKey)),
      path: [...params.leaf.path, { ...bucket.value, dimension: params.dimension }],
    }))
}

function compatibilityUnitId(parentId: string, path: PartitionPathEntry[]): string | null {
  if (!MARKETING_PARENT_IDS.has(parentId) || path.length !== 1 || path[0].dimension !== 'subtype') {
    return null
  }
  const key = path[0].key
  if (key === 'marketing_promotional_remainder') return 'family:marketing_promotional:remainder'
  if (key === 'non_promotional_spillover') return 'family:spillover'
  return `family:${key}`
}

function unitId(parentId: string, path: PartitionPathEntry[]): string {
  const compatible = compatibilityUnitId(parentId, path)
  if (compatible) return compatible
  const suffix = path
    .map((entry) => `${normalizedToken(entry.dimension)}-${normalizedToken(entry.key)}`)
    .join(':')
  return `review-unit:${normalizedToken(parentId)}:${suffix || 'all'}`
}

function unitLabel(path: PartitionPathEntry[], duplicateLabels: Set<string>): string {
  const last = path[path.length - 1]
  if (!last) return 'All senders'
  if (!duplicateLabels.has(last.label)) return last.label
  return path.map((entry) => entry.label).join(' · ')
}

export function materializeGmailReviewUnits(params: {
  parentId: string
  parentLabel: string
  basis: GmailCleanupGroupReviewUnitBasis
  actionable: boolean
  artifactCutoffAt: string
  senders: GmailReviewUnitSeed[]
}): GmailMaterializedReviewUnitPlan {
  if (!params.actionable) {
    return { basis: params.basis, units: [], reviewUnitIdBySenderKey: new Map() }
  }
  const senderKeys = new Set<string>()
  for (const sender of params.senders) {
    if (!sender.senderKey || senderKeys.has(sender.senderKey)) {
      throw new Error(`Review-unit candidate ${params.parentId} contains a missing or duplicate sender key.`)
    }
    senderKeys.add(sender.senderKey)
  }
  let leaves: ReviewUnitLeaf[] = [
    {
      senders: params.senders.slice().sort((left, right) => left.senderKey.localeCompare(right.senderKey)),
      path: [],
    },
  ]
  for (const dimension of dimensionsForBasis(params.basis)) {
    leaves = leaves.flatMap((leaf) => {
      if (leaf.senders.length <= GMAIL_REVIEW_UNIT_TARGET_MAX && leaf.path.length > 0) return [leaf]
      const split = splitLeaf({ leaf, dimension, cutoffAt: params.artifactCutoffAt })
      return split || [leaf]
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
  const oversized = leaves.filter((leaf) => leaf.senders.length > GMAIL_REVIEW_UNIT_HARD_MAX)
  if (oversized.length > 0) {
    throw new Error(
      `Review-unit candidate ${params.parentId} cannot be semantically partitioned below ${GMAIL_REVIEW_UNIT_HARD_MAX} senders; largest unresolved unit has ${Math.max(...oversized.map((leaf) => leaf.senders.length))}.`
    )
  }
  const labelCounts = new Map<string, number>()
  for (const leaf of leaves) {
    const label = leaf.path[leaf.path.length - 1]?.label || 'All senders'
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
  }
  const duplicateLabels = new Set(
    Array.from(labelCounts.entries()).filter(([, count]) => count > 1).map(([label]) => label)
  )
  const reviewUnitIdBySenderKey = new Map<string, string>()
  const units = leaves
    .map((leaf) => {
      const id = unitId(params.parentId, leaf.path)
      for (const sender of leaf.senders) reviewUnitIdBySenderKey.set(sender.senderKey, id)
      const terminal = leaf.path[leaf.path.length - 1]
      return {
        unit_id: id,
        label: unitLabel(leaf.path, duplicateLabels),
        source_kind: terminal.sourceKind,
        source_key: terminal.key,
        sender_count: leaf.senders.length,
        share_pct:
          params.senders.length > 0 ? Math.round((leaf.senders.length / params.senders.length) * 100) : 0,
        unit_role: terminal.unitRole,
        decomposition_path: leaf.path.map((entry) => `${entry.dimension}:${entry.key}`),
        publication_status: 'materialized' as const,
      } satisfies GmailCleanupGroupReviewUnit
    })
    .sort((left, right) => left.label.localeCompare(right.label) || left.unit_id.localeCompare(right.unit_id))
  return { basis: params.basis, units, reviewUnitIdBySenderKey }
}

export function validateGmailReviewUnitContract(params: {
  parentId: string
  actionable: boolean
  parentSenderKeys: string[]
  units: GmailCleanupGroupReviewUnit[]
  reviewUnitIdBySenderKey: Map<string, string>
}): GmailReviewUnitContractValidation {
  const errors: string[] = []
  const parentKeys = new Set(params.parentSenderKeys)
  if (parentKeys.size !== params.parentSenderKeys.length) {
    errors.push(`${params.parentId}: parent membership contains duplicate sender keys.`)
  }
  const unitIds = new Set(params.units.map((unit) => unit.unit_id))
  if (unitIds.size !== params.units.length) errors.push(`${params.parentId}: unit IDs are not unique.`)
  const countsByUnit = new Map<string, number>()
  for (const [senderKey, reviewUnitId] of params.reviewUnitIdBySenderKey.entries()) {
    if (!parentKeys.has(senderKey)) errors.push(`${params.parentId}: child membership contains an unknown sender.`)
    if (!unitIds.has(reviewUnitId)) errors.push(`${params.parentId}: sender references an unknown child unit.`)
    countsByUnit.set(reviewUnitId, (countsByUnit.get(reviewUnitId) || 0) + 1)
  }
  if (params.actionable && params.units.length === 0) errors.push(`${params.parentId}: actionable parent has no child units.`)
  if (!params.actionable && (params.units.length > 0 || params.reviewUnitIdBySenderKey.size > 0)) {
    errors.push(`${params.parentId}: informational parent must not publish review membership.`)
  }
  for (const unit of params.units) {
    const actualCount = countsByUnit.get(unit.unit_id) || 0
    if (actualCount !== unit.sender_count) {
      errors.push(`${params.parentId}/${unit.unit_id}: manifest count ${unit.sender_count} does not match membership ${actualCount}.`)
    }
    if (unit.sender_count > GMAIL_REVIEW_UNIT_HARD_MAX) {
      errors.push(`${params.parentId}/${unit.unit_id}: child exceeds the hard maximum.`)
    }
  }
  if (params.actionable && params.reviewUnitIdBySenderKey.size !== parentKeys.size) {
    errors.push(`${params.parentId}: child union does not equal parent membership.`)
  }
  return {
    errors,
    parentSenderCount: parentKeys.size,
    assignedSenderCount: Array.from(countsByUnit.values()).reduce((sum, count) => sum + count, 0),
    uniqueAssignedSenderCount: params.reviewUnitIdBySenderKey.size,
    largestUnitSenderCount: params.units.reduce((largest, unit) => Math.max(largest, unit.sender_count), 0),
  }
}
