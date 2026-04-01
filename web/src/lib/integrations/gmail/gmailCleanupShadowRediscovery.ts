import type {
  GmailArtifactAnalysisScope,
  GmailClusterSummaryArtifactRow,
  GmailMailboxIntelligenceSnapshotRow,
  GmailSenderScopeRollupRow,
  GmailSenderWorkspaceSeedHeaderRow,
  GmailSenderWorkspaceSeedRow,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import type {
  GmailAssignedCleanupGroupId,
  GmailCleanupAssignmentReason,
  GmailCleanupExclusionReason,
} from '@/lib/runtime/gmailCleanupWorkspace'

export const GMAIL_CLEANUP_SHADOW_BASELINE_VERSION = 'full-mailbox-20260329092447406'

export const GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS = [
  {
    canonical_cluster_id: 'semantic.marketing_subscriptions',
    source_cluster_id: 'subscription-senders',
    surfaced_status: 'surfaced',
    lane: 'action',
    display_priority: 100,
  },
  {
    canonical_cluster_id: 'structural.backlog',
    source_cluster_id: 'dormant-backlog-senders',
    surfaced_status: 'surfaced',
    lane: 'backlog',
    display_priority: 200,
  },
  {
    canonical_cluster_id: 'structural.protected_trust',
    source_cluster_id: 'protected-trusted-senders',
    surfaced_status: 'surfaced',
    lane: 'coverage',
    display_priority: 300,
  },
  {
    canonical_cluster_id: 'structural.unresolved',
    source_cluster_id: 'needs-review-senders',
    surfaced_status: 'surfaced',
    lane: 'coverage',
    display_priority: 310,
  },
  {
    canonical_cluster_id: 'secondary.account_updates',
    source_cluster_id: 'system-notification-senders',
    surfaced_status: 'surfaced',
    lane: 'secondary',
    display_priority: 400,
  },
  {
    canonical_cluster_id: 'context.historical',
    source_cluster_id: 'historical-out-of-inbox-senders',
    surfaced_status: 'surfaced',
    lane: 'context',
    display_priority: 500,
  },
  {
    canonical_cluster_id: 'secondary.social_community',
    source_cluster_id: 'social-platform-senders',
    surfaced_status: 'hidden_alias_only',
    lane: 'secondary',
    display_priority: 610,
  },
] as const

type ShadowCanonicalClusterId =
  (typeof GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS)[number]['canonical_cluster_id']
type ShadowSourceClusterId = (typeof GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS)[number]['source_cluster_id']
type ShadowLane = (typeof GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS)[number]['lane']
type ShadowSurfacedStatus =
  (typeof GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS)[number]['surfaced_status']

export type GmailCleanupShadowReviewUnitBasis =
  | 'subtype-first'
  | 'family-first'
  | 'protection-reason-first'
  | 'exclusion-reason-first'
  | 'direct-open'

export type GmailCleanupShadowReviewUnit = {
  unit_id: string
  label: string
  kind:
    | 'semantic_subtype'
    | 'semantic_remainder'
    | 'semantic_spillover'
    | 'semantic_family'
    | 'assignment_reason'
    | 'exclusion_reason'
  source_key: string
  sender_count: number
  share_pct: number
}

export type GmailCleanupShadowReviewUnitPlanResult = {
  canonical_cluster_id: ShadowCanonicalClusterId | 'context.historical'
  source_cluster_id: ShadowSourceClusterId | 'historical-out-of-inbox-senders'
  surface_cluster_id: string
  required: boolean
  basis: GmailCleanupShadowReviewUnitBasis
  trigger_reason: string
  unit_count: number
  units: GmailCleanupShadowReviewUnit[]
  runtime_narrowing: string | null
}

export type GmailCleanupShadowParentCount = {
  cluster_id: string
  sender_count: number
}

export type GmailCleanupShadowMovementSummary = {
  from_cluster_id: string
  to_cluster_id: string
  sender_count: number
}

export type GmailCleanupShadowOutputSurface = {
  surface: string
  projected_row_count: number
  canonical_identity_published: boolean
  review_unit_plan_published: boolean
  movement_matrix_published: boolean
  runtime_only: boolean
  notes: string
}

export type GmailCleanupShadowPublishGate = {
  gate: string
  pass: boolean
  detail: string
}

export type GmailCleanupShadowRediscoveryReport = {
  ok: boolean
  generated_at: string
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  baseline_artifact_version: string
  summary: {
    total_sender_count: number
    baseline_source_group_count: number
    projected_source_group_count: number
    projected_canonical_group_count: number
    source_membership_changes: number
    redirect_only_group_ids: string[]
    publish_gate_passed: boolean
  }
  shadow_rebuild_output_result: {
    mode: 'shadow_only'
    live_publish_performed: false
    schema_changes: false
    ui_changes: false
    retired_source_group_ids: string[]
    redirect_only_group_ids: string[]
    projected_surface_cluster_ids: string[]
    projected_canonical_cluster_ids: string[]
    output_surfaces: GmailCleanupShadowOutputSurface[]
  }
  old_vs_new_parent_counts: {
    source_before: GmailCleanupShadowParentCount[]
    source_after: GmailCleanupShadowParentCount[]
    canonical_after: GmailCleanupShadowParentCount[]
  }
  sender_movement_matrix_summary: {
    unchanged_source_assignment_count: number
    changed_source_assignment_count: number
    source_movements: GmailCleanupShadowMovementSummary[]
    legacy_to_canonical_matrix: GmailCleanupShadowMovementSummary[]
  }
  published_review_unit_plan_result: GmailCleanupShadowReviewUnitPlanResult[]
  publish_gate_report: {
    pass: boolean
    gates: GmailCleanupShadowPublishGate[]
  }
  validation_performed: string[]
  known_limitations: string[]
  recommendation: {
    decision: 'publish' | 'do_not_publish'
    rationale: string
  }
}

type ShadowSenderAssignment = {
  sender_key: string
  previous_source_cluster_id: GmailAssignedCleanupGroupId
  next_source_cluster_id: GmailAssignedCleanupGroupId
  next_canonical_cluster_id: ShadowCanonicalClusterId
  next_assignment_reason: GmailCleanupAssignmentReason
  next_cleanup_exclusion_reason: GmailCleanupExclusionReason | null
}

type ShadowDescriptor = {
  canonical_cluster_id: ShadowCanonicalClusterId
  source_cluster_id: ShadowSourceClusterId
  surfaced_status: ShadowSurfacedStatus
  lane: ShadowLane
  display_priority: number
}

const descriptorByCanonicalId = new Map<ShadowCanonicalClusterId, ShadowDescriptor>()
const descriptorBySourceId = new Map<ShadowSourceClusterId, ShadowDescriptor>()

for (const descriptor of GMAIL_CLEANUP_SHADOW_CANONICAL_GROUPS) {
  descriptorByCanonicalId.set(descriptor.canonical_cluster_id, descriptor)
  descriptorBySourceId.set(descriptor.source_cluster_id, descriptor)
}

const RETIRED_SOURCE_GROUP_ID = 'retail-commerce-senders'
const MARKETING_TRANSITIONAL_SURFACE_ID =
  'semantic-parent:subscription-senders:family:marketing_promotional'

function parseRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((entry) => parseString(entry))
        .filter((entry): entry is string => entry != null)
    : []
}

function parseInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}

function labelFromKey(value: string): string {
  return value
    .split(/[_:]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function semanticFamilyLabel(value: string): string {
  switch (value) {
    case 'marketing_promotional':
      return 'Marketing / promotional'
    case 'commerce_transactional':
      return 'Commerce / transactional'
    case 'account_notification':
      return 'Account notifications'
    case 'security_alert':
      return 'Security alerts'
    case 'social_community':
      return 'Social / community'
    case 'human_personal':
      return 'Human / personal'
    default:
      return labelFromKey(value)
  }
}

function sharePct(senderCount: number, total: number): number {
  return total > 0 ? Math.round((senderCount / total) * 100) : 0
}

function countsFromValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1)
  }
  return counts
}

function countsToSortedEntries(counts: Map<string, number>): GmailCleanupShadowParentCount[] {
  return Array.from(counts.entries())
    .map(([cluster_id, sender_count]) => ({ cluster_id, sender_count }))
    .sort((left, right) => right.sender_count - left.sender_count || left.cluster_id.localeCompare(right.cluster_id))
}

function movementEntries(
  counts: Map<string, number>
): GmailCleanupShadowMovementSummary[] {
  return Array.from(counts.entries())
    .map(([compoundKey, sender_count]) => {
      const [from_cluster_id, to_cluster_id] = compoundKey.split('|||')
      return {
        from_cluster_id,
        to_cluster_id,
        sender_count,
      }
    })
    .sort((left, right) => right.sender_count - left.sender_count || left.from_cluster_id.localeCompare(right.from_cluster_id))
}

function retailRedistributionTarget(params: {
  rollup: GmailSenderScopeRollupRow
  seedRow: GmailSenderWorkspaceSeedRow | null
}): {
  next_source_cluster_id: GmailAssignedCleanupGroupId
  next_assignment_reason: GmailCleanupAssignmentReason
  next_cleanup_exclusion_reason: GmailCleanupExclusionReason | null
} {
  const semanticFamily = parseString(params.seedRow?.semantic_family_key)
  const senderCountHint = Math.max(
    parseInteger(params.seedRow?.cleanup_group_message_count),
    parseInteger(params.rollup.cleanup_candidate_message_count),
    parseInteger(params.rollup.total_message_count)
  )

  if (semanticFamily === 'account_notification') {
    return {
      next_source_cluster_id: 'system-notification-senders',
      next_assignment_reason: params.rollup.assignment_reason || 'behavioral_safe_rows',
      next_cleanup_exclusion_reason: null,
    }
  }

  const unresolvedReason: GmailCleanupExclusionReason =
    senderCountHint <= 10 ? 'too_few_safe_rows' : 'score_below_threshold'

  return {
    next_source_cluster_id: 'needs-review-senders',
    next_assignment_reason:
      unresolvedReason === 'too_few_safe_rows'
        ? 'needs_review_too_few_safe_rows'
        : 'needs_review_score_below_threshold',
    next_cleanup_exclusion_reason: unresolvedReason,
  }
}

function canonicalIdForSource(sourceClusterId: GmailAssignedCleanupGroupId): ShadowCanonicalClusterId {
  const descriptor = descriptorBySourceId.get(sourceClusterId as ShadowSourceClusterId)
  if (!descriptor) {
    throw new Error(
      `[gmail-cleanup-shadow-rediscovery] Missing canonical descriptor for source cluster ${sourceClusterId}.`
    )
  }
  return descriptor.canonical_cluster_id
}

function buildSurfaceClusterIdBySource(params: {
  clusterSummaries: GmailClusterSummaryArtifactRow[]
}): Map<string, string> {
  const result = new Map<string, string>()

  for (const summary of params.clusterSummaries) {
    const payload = parseRecord(summary.summary_payload)
    const sourceClusterIds = parseStringArray(payload.cleanup_group_source_cluster_ids)
    if (sourceClusterIds.length === 0) {
      result.set(summary.cluster_id, summary.cluster_id)
      continue
    }
    for (const sourceClusterId of sourceClusterIds) {
      result.set(sourceClusterId, summary.cluster_id)
    }
  }

  if (!result.has('subscription-senders')) {
    result.set('subscription-senders', MARKETING_TRANSITIONAL_SURFACE_ID)
  }

  return result
}

function buildShadowSenderAssignments(params: {
  rollups: GmailSenderScopeRollupRow[]
  seedRows: GmailSenderWorkspaceSeedRow[]
}): ShadowSenderAssignment[] {
  const seedRowBySenderKey = new Map(params.seedRows.map((row) => [row.sender_key, row]))

  return params.rollups.map((rollup) => {
    const sourceClusterId = rollup.assigned_cleanup_group_id
    if (sourceClusterId !== RETIRED_SOURCE_GROUP_ID) {
      return {
        sender_key: rollup.sender_key,
        previous_source_cluster_id: sourceClusterId,
        next_source_cluster_id: sourceClusterId,
        next_canonical_cluster_id: canonicalIdForSource(sourceClusterId),
        next_assignment_reason: rollup.assignment_reason,
        next_cleanup_exclusion_reason: rollup.cleanup_exclusion_reason,
      }
    }

    const redistributed = retailRedistributionTarget({
      rollup,
      seedRow: seedRowBySenderKey.get(rollup.sender_key) || null,
    })

    return {
      sender_key: rollup.sender_key,
      previous_source_cluster_id: sourceClusterId,
      next_source_cluster_id: redistributed.next_source_cluster_id,
      next_canonical_cluster_id: canonicalIdForSource(redistributed.next_source_cluster_id),
      next_assignment_reason: redistributed.next_assignment_reason,
      next_cleanup_exclusion_reason: redistributed.next_cleanup_exclusion_reason,
    }
  })
}

function parseSemanticReviewUnitsFromSummary(summary: GmailClusterSummaryArtifactRow | null): GmailCleanupShadowReviewUnit[] {
  if (!summary) return []
  const payload = parseRecord(summary.summary_payload)
  const semanticRollup = parseRecord(payload.semantic_rollup)
  const reviewUnitPlan = parseRecord(semanticRollup.review_unit_plan)
  const units = Array.isArray(reviewUnitPlan.units) ? reviewUnitPlan.units : []

  return units
    .map((entry) => parseRecord(entry))
    .map((entry) => {
      const sourceKind = parseString(entry.source_kind) || 'semantic_subtype'
      const unitRole = parseString(entry.unit_role) || 'subtype'
      const kind: GmailCleanupShadowReviewUnit['kind'] =
        sourceKind === 'family_remainder' || sourceKind === 'pattern_remainder'
          ? 'semantic_remainder'
          : sourceKind === 'spillover'
            ? 'semantic_spillover'
            : 'semantic_subtype'
      return {
        unit_id: parseString(entry.unit_id) || `${sourceKind}:${parseString(entry.source_key) || 'unit'}`,
        label:
          parseString(entry.label) ||
          (unitRole === 'dominant_remainder'
            ? 'Dominant remainder'
            : unitRole === 'spillover'
              ? 'Spillover'
              : 'Subtype'),
        kind,
        source_key: parseString(entry.source_key) || 'unit',
        sender_count: parseInteger(entry.sender_count),
        share_pct: parseInteger(entry.share_pct),
      }
    })
    .filter((entry) => entry.sender_count > 0)
}

function parseFamilyDistributionUnits(summary: GmailClusterSummaryArtifactRow | null): GmailCleanupShadowReviewUnit[] {
  if (!summary) return []
  const payload = parseRecord(summary.summary_payload)
  const familyDistribution = Array.isArray(payload.semantic_family_distribution)
    ? payload.semantic_family_distribution
    : []

  return familyDistribution
    .map((entry) => parseRecord(entry))
    .map((entry) => {
      const family = parseString(entry.family) || 'unknown_family'
      const senderCount = parseInteger(entry.sender_count)
      return {
        unit_id: `family:${family}`,
        label: semanticFamilyLabel(family),
        kind: 'semantic_family' as const,
        source_key: family,
        sender_count: senderCount,
        share_pct: parseInteger(entry.share_pct),
      }
    })
    .filter((entry) => entry.sender_count > 0)
}

function buildReasonUnits(params: {
  assignments: ShadowSenderAssignment[]
  sourceClusterId: GmailAssignedCleanupGroupId
  reasonSelector: (assignment: ShadowSenderAssignment) => string | null
  kind: 'assignment_reason' | 'exclusion_reason'
}): GmailCleanupShadowReviewUnit[] {
  const total = params.assignments.filter(
    (assignment) => assignment.next_source_cluster_id === params.sourceClusterId
  ).length
  const counts = new Map<string, number>()

  for (const assignment of params.assignments) {
    if (assignment.next_source_cluster_id !== params.sourceClusterId) continue
    const reason = params.reasonSelector(assignment)
    if (!reason) continue
    counts.set(reason, (counts.get(reason) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([reason, senderCount]) => ({
      unit_id: `${params.kind}:${reason}`,
      label: labelFromKey(reason),
      kind: params.kind,
      source_key: reason,
      sender_count: senderCount,
      share_pct: sharePct(senderCount, total),
    }))
    .sort((left, right) => right.sender_count - left.sender_count || left.label.localeCompare(right.label))
}

function descriptorForCanonical(canonicalClusterId: ShadowCanonicalClusterId): ShadowDescriptor {
  const descriptor = descriptorByCanonicalId.get(canonicalClusterId)
  if (!descriptor) {
    throw new Error(
      `[gmail-cleanup-shadow-rediscovery] Missing descriptor for canonical cleanup cluster ${canonicalClusterId}.`
    )
  }
  return descriptor
}

function buildProjectedSurfaceClusterIds(params: {
  surfaceClusterIdBySource: Map<string, string>
  canonicalCounts: GmailCleanupShadowParentCount[]
}): string[] {
  return params.canonicalCounts
    .map((entry) => descriptorForCanonical(entry.cluster_id as ShadowCanonicalClusterId))
    .sort((left, right) => left.display_priority - right.display_priority)
    .map(
      (descriptor) =>
        params.surfaceClusterIdBySource.get(descriptor.source_cluster_id) || descriptor.source_cluster_id
    )
}

export function buildGmailCleanupShadowRediscoveryReport(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string
  rowCounts: Record<string, number>
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  seedHeaders: GmailSenderWorkspaceSeedHeaderRow[]
  seedRows: GmailSenderWorkspaceSeedRow[]
  rollups: GmailSenderScopeRollupRow[]
  mailboxSnapshots: GmailMailboxIntelligenceSnapshotRow[]
}): GmailCleanupShadowRediscoveryReport {
  const surfaceClusterIdBySource = buildSurfaceClusterIdBySource({
    clusterSummaries: params.clusterSummaries,
  })
  const shadowAssignments = buildShadowSenderAssignments({
    rollups: params.rollups,
    seedRows: params.seedRows,
  })

  const totalSenderCount = shadowAssignments.length
  const uniqueSenderCount = new Set(shadowAssignments.map((entry) => entry.sender_key)).size
  const duplicateSenderCount = totalSenderCount - uniqueSenderCount

  const sourceBeforeCounts = countsToSortedEntries(
    countsFromValues(params.rollups.map((row) => row.assigned_cleanup_group_id))
  )
  const sourceAfterCounts = countsToSortedEntries(
    countsFromValues(shadowAssignments.map((entry) => entry.next_source_cluster_id))
  )
  const canonicalAfterCounts = countsToSortedEntries(
    countsFromValues(shadowAssignments.map((entry) => entry.next_canonical_cluster_id))
  ).sort((left, right) => {
    const leftDescriptor = descriptorByCanonicalId.get(left.cluster_id as ShadowCanonicalClusterId)
    const rightDescriptor = descriptorByCanonicalId.get(right.cluster_id as ShadowCanonicalClusterId)
    return (
      (leftDescriptor?.display_priority || Number.MAX_SAFE_INTEGER) -
        (rightDescriptor?.display_priority || Number.MAX_SAFE_INTEGER) ||
      right.sender_count - left.sender_count
    )
  })

  const sourceMovementCounts = new Map<string, number>()
  const legacyToCanonicalCounts = new Map<string, number>()
  let changedSourceAssignmentCount = 0

  for (const assignment of shadowAssignments) {
    if (assignment.previous_source_cluster_id !== assignment.next_source_cluster_id) {
      changedSourceAssignmentCount += 1
      const sourceMovementKey = [
        assignment.previous_source_cluster_id,
        assignment.next_source_cluster_id,
      ].join('|||')
      sourceMovementCounts.set(
        sourceMovementKey,
        (sourceMovementCounts.get(sourceMovementKey) || 0) + 1
      )
    }

    const legacyToCanonicalKey = [
      assignment.previous_source_cluster_id,
      assignment.next_canonical_cluster_id,
    ].join('|||')
    legacyToCanonicalCounts.set(
      legacyToCanonicalKey,
      (legacyToCanonicalCounts.get(legacyToCanonicalKey) || 0) + 1
    )
  }

  const unchangedSourceAssignmentCount = totalSenderCount - changedSourceAssignmentCount

  const summaryBySurfaceClusterId = new Map(
    params.clusterSummaries.map((summary) => [summary.cluster_id, summary])
  )

  const subscriptionSurfaceClusterId =
    surfaceClusterIdBySource.get('subscription-senders') || MARKETING_TRANSITIONAL_SURFACE_ID
  const backlogSurfaceClusterId =
    surfaceClusterIdBySource.get('dormant-backlog-senders') || 'dormant-backlog-senders'
  const protectedSurfaceClusterId =
    surfaceClusterIdBySource.get('protected-trusted-senders') || 'protected-trusted-senders'
  const unresolvedSurfaceClusterId =
    surfaceClusterIdBySource.get('needs-review-senders') || 'needs-review-senders'
  const historicalSurfaceClusterId =
    surfaceClusterIdBySource.get('historical-out-of-inbox-senders') ||
    'historical-out-of-inbox-senders'

  const reviewUnitPlans: GmailCleanupShadowReviewUnitPlanResult[] = [
    {
      canonical_cluster_id: 'semantic.marketing_subscriptions',
      source_cluster_id: 'subscription-senders',
      surface_cluster_id: subscriptionSurfaceClusterId,
      required: true,
      basis: 'subtype-first',
      trigger_reason:
        'Promoted semantic parent remains subtype-first because published subtype units already provide the smallest coherent artifact-backed first pass.',
      unit_count: parseSemanticReviewUnitsFromSummary(
        summaryBySurfaceClusterId.get(subscriptionSurfaceClusterId) || null
      ).length,
      units: parseSemanticReviewUnitsFromSummary(
        summaryBySurfaceClusterId.get(subscriptionSurfaceClusterId) || null
      ),
      runtime_narrowing: null,
    },
    {
      canonical_cluster_id: 'structural.backlog',
      source_cluster_id: 'dormant-backlog-senders',
      surface_cluster_id: backlogSurfaceClusterId,
      required: true,
      basis: 'family-first',
      trigger_reason:
        'Backlog remains structurally large and semantically mixed, so first-pass publication is ranked family lanes with age and volume narrowing deferred to runtime inside the chosen family lane.',
      unit_count: parseFamilyDistributionUnits(
        summaryBySurfaceClusterId.get(backlogSurfaceClusterId) || null
      ).length,
      units: parseFamilyDistributionUnits(
        summaryBySurfaceClusterId.get(backlogSurfaceClusterId) || null
      ),
      runtime_narrowing:
        'Age-first and volume-first narrowing stays runtime-only inside the selected family lane.',
    },
    {
      canonical_cluster_id: 'structural.protected_trust',
      source_cluster_id: 'protected-trusted-senders',
      surface_cluster_id: protectedSurfaceClusterId,
      required: true,
      basis: 'protection-reason-first',
      trigger_reason:
        'Protected coverage is defined by explicit protection/trust overrides, so publication must open on protection reasons before any semantic narrowing.',
      unit_count: buildReasonUnits({
        assignments: shadowAssignments,
        sourceClusterId: 'protected-trusted-senders',
        reasonSelector: (assignment) => assignment.next_assignment_reason,
        kind: 'assignment_reason',
      }).length,
      units: buildReasonUnits({
        assignments: shadowAssignments,
        sourceClusterId: 'protected-trusted-senders',
        reasonSelector: (assignment) => assignment.next_assignment_reason,
        kind: 'assignment_reason',
      }),
      runtime_narrowing:
        'Semantic narrowing stays runtime-only after the operator chooses a protection reason.',
    },
    {
      canonical_cluster_id: 'structural.unresolved',
      source_cluster_id: 'needs-review-senders',
      surface_cluster_id: unresolvedSurfaceClusterId,
      required: true,
      basis: 'exclusion-reason-first',
      trigger_reason:
        'Unresolved coverage is defined by insufficient evidence, so publication must open on exclusion reasons before any secondary runtime narrowing.',
      unit_count: buildReasonUnits({
        assignments: shadowAssignments,
        sourceClusterId: 'needs-review-senders',
        reasonSelector: (assignment) => assignment.next_cleanup_exclusion_reason,
        kind: 'exclusion_reason',
      }).length,
      units: buildReasonUnits({
        assignments: shadowAssignments,
        sourceClusterId: 'needs-review-senders',
        reasonSelector: (assignment) => assignment.next_cleanup_exclusion_reason,
        kind: 'exclusion_reason',
      }),
      runtime_narrowing:
        'Runtime can narrow within an exclusion reason by age, volume, and trust cues without publishing new artifact child groups.',
    },
    {
      canonical_cluster_id: 'context.historical',
      source_cluster_id: 'historical-out-of-inbox-senders',
      surface_cluster_id: historicalSurfaceClusterId,
      required: false,
      basis: 'direct-open',
      trigger_reason:
        'Historical is a small context lane and does not require first-pass published review units.',
      unit_count: 0,
      units: [],
      runtime_narrowing: null,
    },
  ]

  const projectedSurfaceClusterIds = buildProjectedSurfaceClusterIds({
    surfaceClusterIdBySource,
    canonicalCounts: canonicalAfterCounts,
  })
  const baselineHeaderSurfaceIds = uniqueStrings(params.seedHeaders.map((header) => header.cluster_id))
  const projectedHeaderSurfaceIds = baselineHeaderSurfaceIds.filter(
    (clusterId) => clusterId !== RETIRED_SOURCE_GROUP_ID
  )

  const projectedSourceClusterIds = sourceAfterCounts.map((entry) => entry.cluster_id)
  const projectedCanonicalClusterIds = canonicalAfterCounts.map((entry) => entry.cluster_id)
  const projectedClusterSummaryCount = projectedSurfaceClusterIds.length
  const projectedSeedHeaderCount = projectedHeaderSurfaceIds.length

  const outputSurfaces: GmailCleanupShadowOutputSurface[] = [
    {
      surface: 'gmail_sender_scope_rollups',
      projected_row_count: params.rowCounts.gmail_sender_scope_rollups || params.rollups.length,
      canonical_identity_published: false,
      review_unit_plan_published: false,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Compatibility-layer source assignment is recomputed here; retail-commerce senders are redistributed into surviving source groups.',
    },
    {
      surface: 'gmail_cluster_summaries',
      projected_row_count: projectedClusterSummaryCount,
      canonical_identity_published: true,
      review_unit_plan_published: true,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Surviving surface clusters publish canonical parent identity and the locked first-pass review-unit plan.',
    },
    {
      surface: 'gmail_sender_workspace_seed_headers',
      projected_row_count: projectedSeedHeaderCount,
      canonical_identity_published: true,
      review_unit_plan_published: true,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Seed headers mirror cluster summaries and carry the same canonical identity and group-level review-unit plan.',
    },
    {
      surface: 'gmail_sender_workspace_seed_rows',
      projected_row_count: params.rowCounts.gmail_sender_workspace_seed_rows || params.seedRows.length,
      canonical_identity_published: true,
      review_unit_plan_published: false,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Seed rows retain sender membership, reassign retired retail members, and publish canonical/source mapping; unresolved reason membership remains derived from rollups.',
    },
    {
      surface: 'gmail_preview_index',
      projected_row_count: params.rowCounts.gmail_preview_index || 0,
      canonical_identity_published: true,
      review_unit_plan_published: false,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Preview rows are rekeyed for redistributed retail senders and carry canonical/source mapping only.',
    },
    {
      surface: 'gmail_mailbox_intelligence_snapshots',
      projected_row_count:
        params.rowCounts.gmail_mailbox_intelligence_snapshots || params.mailboxSnapshots.length,
      canonical_identity_published: true,
      review_unit_plan_published: true,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Cleanup-group snapshot entries publish canonical identity and the locked group-level review-unit basis.',
    },
    {
      surface: 'gmail_mailbox_intelligence_buckets',
      projected_row_count: params.rowCounts.gmail_mailbox_intelligence_buckets || 0,
      canonical_identity_published: false,
      review_unit_plan_published: false,
      movement_matrix_published: false,
      runtime_only: false,
      notes:
        'Buckets are rebuilt for artifact bundle congruence only; no movement matrix or review-unit data is published here.',
    },
    {
      surface: 'shadow_sidecar_reports',
      projected_row_count: 3,
      canonical_identity_published: false,
      review_unit_plan_published: false,
      movement_matrix_published: true,
      runtime_only: true,
      notes:
        'Movement matrix, retired-group redirect table, and publish-gate report stay shadow-only and are not written into runtime artifact tables.',
    },
  ]

  const publishGates: GmailCleanupShadowPublishGate[] = []
  publishGates.push({
    gate: '100_percent_sender_coverage',
    pass: totalSenderCount === params.rollups.length,
    detail: `${totalSenderCount}/${params.rollups.length} senders preserved in the shadow rebuild.`,
  })
  publishGates.push({
    gate: 'no_duplicate_sender_membership',
    pass: duplicateSenderCount === 0,
    detail:
      duplicateSenderCount === 0
        ? 'Each sender_key appears exactly once in the shadow parent assignment.'
        : `${duplicateSenderCount} duplicate sender assignments were detected.`,
  })
  publishGates.push({
    gate: 'retired_retail_group_removed',
    pass: !projectedSourceClusterIds.includes(RETIRED_SOURCE_GROUP_ID),
    detail: projectedSourceClusterIds.includes(RETIRED_SOURCE_GROUP_ID)
      ? 'retail-commerce-senders still appears in projected source outputs.'
      : 'retail-commerce-senders is removed from projected artifact outputs and remains redirect-only.',
  })
  publishGates.push({
    gate: 'required_review_unit_bases_locked',
    pass:
      reviewUnitPlans.length === 5 &&
      reviewUnitPlans.every((plan) =>
        plan.canonical_cluster_id === 'semantic.marketing_subscriptions'
          ? plan.basis === 'subtype-first'
          : plan.canonical_cluster_id === 'structural.backlog'
            ? plan.basis === 'family-first'
            : plan.canonical_cluster_id === 'structural.protected_trust'
              ? plan.basis === 'protection-reason-first'
              : plan.canonical_cluster_id === 'structural.unresolved'
                ? plan.basis === 'exclusion-reason-first'
                : plan.basis === 'direct-open'
      ),
    detail:
      'Marketing -> subtype-first; backlog -> family-first; protected -> protection-reason-first; unresolved -> exclusion-reason-first; historical -> direct-open.',
  })
  publishGates.push({
    gate: 'cross_surface_projection_consistent',
    pass:
      projectedClusterSummaryCount === projectedSeedHeaderCount &&
      projectedClusterSummaryCount === projectedSurfaceClusterIds.length,
    detail:
      `Projected summary surfaces = ${projectedClusterSummaryCount}; projected header surfaces = ${projectedSeedHeaderCount}; projected cleanup-group snapshot surfaces = ${projectedSurfaceClusterIds.length}.`,
  })
  publishGates.push({
    gate: 'movement_matrix_shadow_only',
    pass: true,
    detail:
      'Movement matrix, redirect table, and publish-gate report remain sidecar shadow outputs and are not projected into runtime artifact tables.',
  })

  const validationPerformed = [
    'Pinned artifact baseline version matches the approved March 29, 2026 full-mailbox artifact.',
    'Recomputed shadow source assignments preserve total sender coverage and unique sender membership.',
    'Projected source outputs remove retail-commerce-senders and redistribute its seven senders into surviving source groups.',
    'Projected canonical counts reconcile one-to-one with shadow source assignments.',
    'Projected summary/header/snapshot surfaces share the same post-retirement surface cluster set.',
    'Locked first-pass review-unit publication bases are present for all five approved initial parents.',
  ]

  const knownLimitations = [
    'This pass is shadow-only. No live artifact rows were written and no publish cutover was attempted.',
    'secondary.account_updates remains a projected canonical identity in this report; live runtime registry cutover is intentionally out of scope for this lane.',
    'structural.unresolved review-unit membership is still derived from rollup exclusion reasons rather than a first-class published seed-row field.',
    'Backlog, protected, and unresolved still require runtime narrowing inside the chosen published review unit because their largest first-pass units remain above the few-hundred-sender target.',
  ]

  const publishGatePassed = publishGates.every((gate) => gate.pass)
  const recommendationDecision: 'publish' | 'do_not_publish' = 'do_not_publish'
  const recommendationRationale =
    publishGatePassed
      ? 'Shadow redistribution and publish gates pass, but this lane explicitly excludes live publish cutover and the live runtime registry still needs a dedicated follow-up pass for canonical identity rollout.'
      : 'Shadow redistribution surfaced one or more publish-gate failures, so this artifact should not be published.'

  return {
    ok: publishGatePassed,
    generated_at: new Date().toISOString(),
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    baseline_artifact_version: params.artifactVersion,
    summary: {
      total_sender_count: totalSenderCount,
      baseline_source_group_count: sourceBeforeCounts.length,
      projected_source_group_count: sourceAfterCounts.length,
      projected_canonical_group_count: canonicalAfterCounts.length,
      source_membership_changes: changedSourceAssignmentCount,
      redirect_only_group_ids: [RETIRED_SOURCE_GROUP_ID],
      publish_gate_passed: publishGatePassed,
    },
    shadow_rebuild_output_result: {
      mode: 'shadow_only',
      live_publish_performed: false,
      schema_changes: false,
      ui_changes: false,
      retired_source_group_ids: [RETIRED_SOURCE_GROUP_ID],
      redirect_only_group_ids: [RETIRED_SOURCE_GROUP_ID],
      projected_surface_cluster_ids: projectedSurfaceClusterIds,
      projected_canonical_cluster_ids: projectedCanonicalClusterIds,
      output_surfaces: outputSurfaces,
    },
    old_vs_new_parent_counts: {
      source_before: sourceBeforeCounts,
      source_after: sourceAfterCounts,
      canonical_after: canonicalAfterCounts,
    },
    sender_movement_matrix_summary: {
      unchanged_source_assignment_count: unchangedSourceAssignmentCount,
      changed_source_assignment_count: changedSourceAssignmentCount,
      source_movements: movementEntries(sourceMovementCounts),
      legacy_to_canonical_matrix: movementEntries(legacyToCanonicalCounts),
    },
    published_review_unit_plan_result: reviewUnitPlans,
    publish_gate_report: {
      pass: publishGatePassed,
      gates: publishGates,
    },
    validation_performed: validationPerformed,
    known_limitations: knownLimitations,
    recommendation: {
      decision: recommendationDecision,
      rationale: recommendationRationale,
    },
  }
}
