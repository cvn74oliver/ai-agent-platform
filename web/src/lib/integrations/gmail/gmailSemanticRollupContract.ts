import { createHash } from 'node:crypto'
import {
  GMAIL_CLEANUP_GROUP_OPERATOR_VALUE_STATUSES,
  GMAIL_CLEANUP_GROUP_PROMOTION_STATUSES,
  GMAIL_CLEANUP_GROUP_REVIEW_UNIT_BASES,
  GMAIL_CLEANUP_GROUP_SURFACE_KINDS,
  GMAIL_CLEANUP_GROUP_SURFACE_TIERS,
  GMAIL_CLEANUP_GROUP_SURFACE_VISIBILITIES,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { buildCleanupGroupFutureCanonicalPublishIdentity } from '@/lib/runtime/gmailCleanupClusterIdentity'
import type {
  GmailCleanupGroupOperatorValueStatus,
  GmailCleanupGroupPromotionStatus,
  GmailCleanupGroupReviewUnitBasis,
  GmailSemanticGroupPolicyMode,
  GmailSemanticSubtypePersistenceState,
  GmailSharedGroupSemanticRollup,
  GmailSenderWorkspaceData,
  GmailSenderWorkspaceSemanticFamilyDistributionEntry,
  GmailSenderWorkspaceSemanticPatternDistributionEntry,
} from '@/lib/runtime/gmailCleanupWorkspace'
import type { CleanupGroupArtifactSurfaceDecision } from '@/lib/integrations/gmail/inboxAnalysis'
import {
  buildSemanticAnalyticsDistributions,
  countUncertainSemanticSenders,
  dominantSemanticFamily,
  dominantSemanticPattern,
} from '@/lib/integrations/gmail/gmailSemanticRollups'

export const GMAIL_SEMANTIC_ROLLUP_SCHEMA_VERSION = 2 as const

type SemanticAnalyticsDistributions = Pick<
  GmailSenderWorkspaceData['analytics'],
  | 'semantic_family_distribution'
  | 'semantic_pattern_distribution'
  | 'semantic_resolution_distribution'
  | 'semantic_confidence_distribution'
  | 'semantic_provenance_distribution'
  | 'semantic_umbrella_distribution'
>

type SemanticSenderLike = Pick<
  GmailSenderWorkspaceData['senders'][number],
  'semantic_family' | 'semantic_pattern'
>

type GmailSharedGroupSemanticRollupCompatInput =
  Omit<GmailSharedGroupSemanticRollup, 'surface' | 'promotion' | 'review_unit_plan'> & {
    surface?: Partial<GmailSharedGroupSemanticRollup['surface']> | null
    promotion?:
      | (Partial<Omit<GmailSharedGroupSemanticRollup['promotion'], 'metrics'>> & {
          metrics?: Partial<GmailSharedGroupSemanticRollup['promotion']['metrics']> | null
        })
      | null
    review_unit_plan?:
      | (Partial<Omit<GmailSharedGroupSemanticRollup['review_unit_plan'], 'units'>> & {
          units?: GmailSharedGroupSemanticRollup['review_unit_plan']['units'] | null
        })
      | null
  }

function roundSharePct(count: number, total: number): number {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((count / total) * 100)
}

function stableSerialize(value: unknown): string {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  )
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(',')}}`
}

function compatibleState(
  value: GmailSemanticSubtypePersistenceState | null
): GmailSemanticSubtypePersistenceState | null {
  return value === 'suppressed' || value === 'provisional' || value === 'survives' ? value : null
}

function semanticResolutionSharePct(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution'],
  scope: 'family' | 'pattern',
  resolution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution'][number]['resolution']
): number {
  return distribution.find((entry) => entry.scope === scope && entry.resolution === resolution)?.share_pct || 0
}

function semanticConfidenceSharePct(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution'],
  scope: 'family' | 'pattern',
  confidence: GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution'][number]['confidence']
): number {
  return distribution.find((entry) => entry.scope === scope && entry.confidence === confidence)?.share_pct || 0
}

function semanticUmbrellaSharePct(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution'],
  scope: 'family' | 'pattern',
  bucket: GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution'][number]['bucket']
): number {
  return distribution.find((entry) => entry.scope === scope && entry.bucket === bucket)?.share_pct || 0
}

function topSubtypeSupportsSurvival(
  topSubtype:
    | GmailSenderWorkspaceSemanticFamilyDistributionEntry['top_subtypes'][number]
    | GmailSenderWorkspaceSemanticPatternDistributionEntry['top_subtypes'][number]
    | null
): boolean {
  return Boolean(
    topSubtype &&
      !topSubtype.umbrella &&
      topSubtype.decomposition_status === 'resolved' &&
      topSubtype.key.trim()
  )
}

function deriveLaneSubtypePersistenceState(params: {
  groupPolicyMode: GmailSemanticGroupPolicyMode
  clearSharePct: number
  resolvedSubtypeCoveragePct: number
  topSubtype:
    | GmailSenderWorkspaceSemanticFamilyDistributionEntry['top_subtypes'][number]
    | GmailSenderWorkspaceSemanticPatternDistributionEntry['top_subtypes'][number]
    | null
}): GmailSemanticSubtypePersistenceState {
  if (params.groupPolicyMode !== 'semantic_first') return 'suppressed'
  const survivesTopSubtype = topSubtypeSupportsSurvival(params.topSubtype)
  if (
    survivesTopSubtype &&
    params.resolvedSubtypeCoveragePct >= 50 &&
    params.clearSharePct >= 60
  ) {
    return 'survives'
  }
  if (
    params.resolvedSubtypeCoveragePct >= 25 ||
    params.clearSharePct >= 40 ||
    params.topSubtype != null
  ) {
    return 'provisional'
  }
  return 'suppressed'
}

function deriveHeadlineSubtypePersistenceState(params: {
  groupPolicyMode: GmailSemanticGroupPolicyMode
  laneSharePct: number
  clearSharePct: number
  resolvedSubtypeCoveragePct: number
  topSubtype:
    | GmailSenderWorkspaceSemanticFamilyDistributionEntry['top_subtypes'][number]
    | GmailSenderWorkspaceSemanticPatternDistributionEntry['top_subtypes'][number]
    | null
}): GmailSemanticSubtypePersistenceState {
  if (params.groupPolicyMode !== 'semantic_first') return 'suppressed'
  const survivesTopSubtype = topSubtypeSupportsSurvival(params.topSubtype)
  if (
    survivesTopSubtype &&
    params.laneSharePct >= 35 &&
    params.resolvedSubtypeCoveragePct >= 50 &&
    params.clearSharePct >= 60
  ) {
    return 'survives'
  }
  if (
    params.resolvedSubtypeCoveragePct >= 25 ||
    params.clearSharePct >= 40 ||
    params.topSubtype != null
  ) {
    return 'provisional'
  }
  return 'suppressed'
}

function expectedFamilyReviewFlag(params: {
  groupPolicyMode: GmailSemanticGroupPolicyMode
  lane: GmailSharedGroupSemanticRollup['family_distribution'][number]
  isDominant: boolean
}): boolean {
  return (
    params.groupPolicyMode === 'semantic_first' &&
    params.isDominant &&
    params.lane.umbrella &&
    params.lane.share_pct >= 60
  )
}

function expectedPatternReviewFlag(params: {
  groupPolicyMode: GmailSemanticGroupPolicyMode
  lane: GmailSharedGroupSemanticRollup['pattern_distribution'][number]
  isDominant: boolean
}): boolean {
  const topSubtype = params.lane.top_subtypes[0] || null
  return (
    params.groupPolicyMode === 'semantic_first' &&
    params.isDominant &&
    params.lane.share_pct >= 50 &&
    !topSubtypeSupportsSurvival(topSubtype)
  )
}

export function semanticPolicyModeForCleanupGroup(clusterId: string): GmailSemanticGroupPolicyMode {
  const policyClusterId = sourceClusterIdForCleanupGroup(clusterId)
  if (
    policyClusterId === 'protected-trusted-senders' ||
    policyClusterId === 'needs-review-senders' ||
    policyClusterId === 'historical-out-of-inbox-senders'
  ) {
    return 'structural_only'
  }
  if (policyClusterId === 'dormant-backlog-senders') {
    return 'structural_backlog'
  }
  return 'semantic_first'
}

function sourceClusterIdForCleanupGroup(clusterId: string): string {
  const futureIdentity = buildCleanupGroupFutureCanonicalPublishIdentity(clusterId)
  return (
    futureIdentity?.sourceClusterIds.find(
      (sourceClusterId) =>
        sourceClusterId.trim().length > 0 && !sourceClusterId.startsWith('semantic-parent:')
    ) ||
    futureIdentity?.sourceClusterIds[0] ||
    clusterId
  )
}

function defaultCleanupGroupPromotionStatus(
  clusterId: string,
  policyMode: GmailSemanticGroupPolicyMode
): GmailCleanupGroupPromotionStatus {
  if (clusterId.startsWith('semantic-parent:')) return 'promoted'
  if (policyMode !== 'semantic_first') return 'structural_lane'
  if (clusterId === 'subscription-senders') return 'secondary_visible'
  return 'secondary_visible'
}

function defaultCleanupGroupOperatorValueStatus(
  policyMode: GmailSemanticGroupPolicyMode,
  clusterId?: string
): GmailCleanupGroupOperatorValueStatus {
  if (clusterId?.startsWith('semantic-parent:')) return 'strong'
  return policyMode === 'semantic_first' ? 'low' : 'not_applicable'
}

function defaultCleanupGroupReviewUnitBasis(
  policyMode: GmailSemanticGroupPolicyMode,
  clusterId: string
): GmailCleanupGroupReviewUnitBasis {
  const sourceClusterId = sourceClusterIdForCleanupGroup(clusterId)
  if (sourceClusterId === 'historical-out-of-inbox-senders') {
    return 'direct-open'
  }
  if (policyMode === 'structural_only' || policyMode === 'structural_backlog') {
    return 'structural_lane'
  }
  if (sourceClusterId === 'subscription-senders') return 'secondary_group'
  return 'not_promoted'
}

function defaultCleanupGroupSurfacePlan(params: {
  clusterId: string
  groupPolicyMode: GmailSemanticGroupPolicyMode
  senderCount: number
}): Pick<GmailSharedGroupSemanticRollup, 'surface' | 'promotion' | 'review_unit_plan'> {
  const sourceClusterId = sourceClusterIdForCleanupGroup(params.clusterId)
  const structuralSurface =
    params.clusterId.startsWith('semantic-parent:')
      ? {
          tier: 'featured_parent' as const,
          kind: 'semantic_parent' as const,
          top_level_rank: 0,
        }
      : sourceClusterId === 'dormant-backlog-senders'
      ? {
          tier: 'featured_parent' as const,
          kind: 'backlog_parent' as const,
          top_level_rank: 1,
        }
      : sourceClusterId === 'historical-out-of-inbox-senders'
        ? {
            tier: 'collapsed_parent' as const,
            kind: 'historical_parent' as const,
            top_level_rank: 4,
          }
        : params.groupPolicyMode !== 'semantic_first'
          ? {
              tier: 'featured_parent' as const,
              kind: 'structural_parent' as const,
              top_level_rank: sourceClusterId === 'protected-trusted-senders' ? 2 : 3,
            }
          : {
              tier: 'secondary' as const,
              kind: 'secondary_candidate' as const,
              top_level_rank: null,
            }

  return {
    surface: {
      tier: structuralSurface.tier,
      kind: structuralSurface.kind,
      visibility: 'visible',
      top_level_rank: structuralSurface.top_level_rank,
      canonical_cluster_id: params.clusterId,
      legacy_cluster_ids: [],
      source_cluster_ids: [params.clusterId],
    },
    promotion: {
      status: defaultCleanupGroupPromotionStatus(params.clusterId, params.groupPolicyMode),
      selected_axis: null,
      reason_codes: [],
      operator_value_status: defaultCleanupGroupOperatorValueStatus(
        params.groupPolicyMode,
        params.clusterId
      ),
      metrics: {
        sender_count: params.senderCount,
        dominant_share_pct: 0,
        clear_share_pct: 0,
        actionable_review_unit_count: 0,
        largest_review_unit_sender_count: 0,
      },
    },
    review_unit_plan: {
      required: false,
      basis: defaultCleanupGroupReviewUnitBasis(params.groupPolicyMode, params.clusterId),
      trigger_reason: null,
      units: [],
    },
  }
}

function normalizedText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizedTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => normalizedText(entry))
    .filter((entry): entry is string => entry != null)
}

function uniqueNormalizedTextArray(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => normalizedText(value)).filter(Boolean))) as string[]
}

export function buildFutureCanonicalCleanupGroupSurfaceIdentity(clusterId: string): Pick<
  GmailSharedGroupSemanticRollup['surface'],
  'canonical_cluster_id' | 'legacy_cluster_ids' | 'source_cluster_ids'
> {
  const futureIdentity = buildCleanupGroupFutureCanonicalPublishIdentity(clusterId)
  const normalizedClusterId = normalizedText(clusterId) || ''
  if (!futureIdentity) {
    return {
      canonical_cluster_id: normalizedClusterId,
      legacy_cluster_ids: [],
      source_cluster_ids: normalizedClusterId ? [normalizedClusterId] : [],
    }
  }

  return {
    canonical_cluster_id: futureIdentity.canonicalClusterId,
    legacy_cluster_ids: futureIdentity.legacyClusterIds,
    source_cluster_ids: futureIdentity.sourceClusterIds,
  }
}

export function applyFutureCanonicalCleanupGroupSurfaceIdentity(params: {
  clusterId: string
  rollup: GmailSharedGroupSemanticRollup
}): GmailSharedGroupSemanticRollup {
  const surfaceIdentity = buildFutureCanonicalCleanupGroupSurfaceIdentity(params.clusterId)
  return {
    ...params.rollup,
    surface: {
      ...params.rollup.surface,
      canonical_cluster_id: surfaceIdentity.canonical_cluster_id,
      legacy_cluster_ids: uniqueNormalizedTextArray([
        ...surfaceIdentity.legacy_cluster_ids,
        ...(params.rollup.surface.legacy_cluster_ids || []),
      ]),
      source_cluster_ids: uniqueNormalizedTextArray([
        ...surfaceIdentity.source_cluster_ids,
        ...(params.rollup.surface.source_cluster_ids || []),
      ]),
    },
  }
}

export function validateFutureCanonicalCleanupGroupSurfaceIdentity(params: {
  clusterId: string
  rollup: GmailSharedGroupSemanticRollup
}): string[] {
  const expected = buildFutureCanonicalCleanupGroupSurfaceIdentity(params.clusterId)
  const actual = params.rollup.surface
  const errors: string[] = []

  if (actual.canonical_cluster_id !== expected.canonical_cluster_id) {
    errors.push(
      `Expected future canonical surface id ${expected.canonical_cluster_id} for ${params.clusterId}, received ${actual.canonical_cluster_id}.`
    )
  }

  if (
    stableSerialize(uniqueNormalizedTextArray(actual.legacy_cluster_ids || [])) !==
    stableSerialize(uniqueNormalizedTextArray(expected.legacy_cluster_ids))
  ) {
    errors.push(`Future canonical legacy ids drifted for ${params.clusterId}.`)
  }

  if (
    stableSerialize(uniqueNormalizedTextArray(actual.source_cluster_ids || [])) !==
    stableSerialize(uniqueNormalizedTextArray(expected.source_cluster_ids))
  ) {
    errors.push(`Future canonical source ids drifted for ${params.clusterId}.`)
  }

  return errors
}

function compatibleCleanupGroupSurfacePlan(params: {
  clusterId?: string | null
  groupPolicyMode: GmailSemanticGroupPolicyMode
  senderCount: number
}): Pick<GmailSharedGroupSemanticRollup, 'surface' | 'promotion' | 'review_unit_plan'> {
  const clusterId = normalizedText(params.clusterId)
  if (clusterId) {
    return defaultCleanupGroupSurfacePlan({
      clusterId,
      groupPolicyMode: params.groupPolicyMode,
      senderCount: params.senderCount,
    })
  }
  return {
    surface: {
      tier: 'secondary',
      kind: 'secondary_candidate',
      visibility: 'visible',
      top_level_rank: null,
      canonical_cluster_id: '',
      legacy_cluster_ids: [],
      source_cluster_ids: [],
    },
    promotion: {
      status: params.groupPolicyMode === 'semantic_first' ? 'secondary_visible' : 'structural_lane',
      selected_axis: null,
      reason_codes: [],
      operator_value_status: params.groupPolicyMode === 'semantic_first' ? 'low' : 'not_applicable',
      metrics: {
        sender_count: params.senderCount,
        dominant_share_pct: 0,
        clear_share_pct: 0,
        actionable_review_unit_count: 0,
        largest_review_unit_sender_count: 0,
      },
    },
    review_unit_plan: {
      required: false,
      basis: params.groupPolicyMode === 'semantic_first' ? 'not_promoted' : 'structural_lane',
      trigger_reason: null,
      units: [],
    },
  }
}

export function ensureSharedGroupSemanticRollupCompatibility(params: {
  rollup: GmailSharedGroupSemanticRollupCompatInput
  clusterId?: string | null
}): GmailSharedGroupSemanticRollup {
  const inferredClusterId =
    normalizedText(params.rollup.surface?.canonical_cluster_id) ||
    normalizedTextArray(params.rollup.surface?.source_cluster_ids)[0] ||
    normalizedText(params.clusterId)
  const fallbackPlan = compatibleCleanupGroupSurfacePlan({
    clusterId: inferredClusterId,
    groupPolicyMode: params.rollup.group_policy_mode,
    senderCount: params.rollup.sender_basis.sender_count,
  })
  const sourceClusterIds = normalizedTextArray(params.rollup.surface?.source_cluster_ids)
  const resolvedSourceClusterIds =
    sourceClusterIds.length > 0
      ? sourceClusterIds
      : inferredClusterId
        ? [inferredClusterId]
        : fallbackPlan.surface.source_cluster_ids
  const canonicalClusterId =
    normalizedText(params.rollup.surface?.canonical_cluster_id) ||
    resolvedSourceClusterIds[0] ||
    fallbackPlan.surface.canonical_cluster_id

  return {
    ...params.rollup,
    surface: {
      tier: GMAIL_CLEANUP_GROUP_SURFACE_TIERS.includes(
        params.rollup.surface?.tier as (typeof GMAIL_CLEANUP_GROUP_SURFACE_TIERS)[number]
      )
        ? (params.rollup.surface?.tier as GmailSharedGroupSemanticRollup['surface']['tier'])
        : fallbackPlan.surface.tier,
      kind: GMAIL_CLEANUP_GROUP_SURFACE_KINDS.includes(
        params.rollup.surface?.kind as (typeof GMAIL_CLEANUP_GROUP_SURFACE_KINDS)[number]
      )
        ? (params.rollup.surface?.kind as GmailSharedGroupSemanticRollup['surface']['kind'])
        : fallbackPlan.surface.kind,
      visibility: GMAIL_CLEANUP_GROUP_SURFACE_VISIBILITIES.includes(
        params.rollup.surface?.visibility as (typeof GMAIL_CLEANUP_GROUP_SURFACE_VISIBILITIES)[number]
      )
        ? (params.rollup.surface?.visibility as GmailSharedGroupSemanticRollup['surface']['visibility'])
        : fallbackPlan.surface.visibility,
      top_level_rank:
        typeof params.rollup.surface?.top_level_rank === 'number'
          ? Math.max(0, Math.round(params.rollup.surface.top_level_rank))
          : fallbackPlan.surface.top_level_rank,
      canonical_cluster_id: canonicalClusterId,
      legacy_cluster_ids: normalizedTextArray(params.rollup.surface?.legacy_cluster_ids),
      source_cluster_ids: resolvedSourceClusterIds,
    },
    promotion: {
      status: GMAIL_CLEANUP_GROUP_PROMOTION_STATUSES.includes(
        params.rollup.promotion?.status as (typeof GMAIL_CLEANUP_GROUP_PROMOTION_STATUSES)[number]
      )
        ? (params.rollup.promotion?.status as GmailSharedGroupSemanticRollup['promotion']['status'])
        : fallbackPlan.promotion.status,
      selected_axis:
        params.rollup.promotion?.selected_axis === 'family' ||
        params.rollup.promotion?.selected_axis === 'pattern'
          ? params.rollup.promotion.selected_axis
          : fallbackPlan.promotion.selected_axis,
      reason_codes: normalizedTextArray(params.rollup.promotion?.reason_codes),
      operator_value_status: GMAIL_CLEANUP_GROUP_OPERATOR_VALUE_STATUSES.includes(
        params.rollup.promotion?.operator_value_status as (typeof GMAIL_CLEANUP_GROUP_OPERATOR_VALUE_STATUSES)[number]
      )
        ? (params.rollup.promotion?.operator_value_status as GmailSharedGroupSemanticRollup['promotion']['operator_value_status'])
        : fallbackPlan.promotion.operator_value_status,
      metrics: {
        sender_count:
          typeof params.rollup.promotion?.metrics?.sender_count === 'number'
            ? Math.max(0, Math.round(params.rollup.promotion.metrics.sender_count))
            : fallbackPlan.promotion.metrics.sender_count,
        dominant_share_pct:
          typeof params.rollup.promotion?.metrics?.dominant_share_pct === 'number'
            ? Math.max(0, Math.round(params.rollup.promotion.metrics.dominant_share_pct))
            : fallbackPlan.promotion.metrics.dominant_share_pct,
        clear_share_pct:
          typeof params.rollup.promotion?.metrics?.clear_share_pct === 'number'
            ? Math.max(0, Math.round(params.rollup.promotion.metrics.clear_share_pct))
            : fallbackPlan.promotion.metrics.clear_share_pct,
        actionable_review_unit_count:
          typeof params.rollup.promotion?.metrics?.actionable_review_unit_count === 'number'
            ? Math.max(0, Math.round(params.rollup.promotion.metrics.actionable_review_unit_count))
            : fallbackPlan.promotion.metrics.actionable_review_unit_count,
        largest_review_unit_sender_count:
          typeof params.rollup.promotion?.metrics?.largest_review_unit_sender_count === 'number'
            ? Math.max(
                0,
                Math.round(params.rollup.promotion.metrics.largest_review_unit_sender_count)
              )
            : fallbackPlan.promotion.metrics.largest_review_unit_sender_count,
      },
    },
    review_unit_plan: {
      required:
        typeof params.rollup.review_unit_plan?.required === 'boolean'
          ? params.rollup.review_unit_plan.required
          : fallbackPlan.review_unit_plan.required,
      basis: GMAIL_CLEANUP_GROUP_REVIEW_UNIT_BASES.includes(
        params.rollup.review_unit_plan?.basis as (typeof GMAIL_CLEANUP_GROUP_REVIEW_UNIT_BASES)[number]
      )
        ? (params.rollup.review_unit_plan?.basis as GmailSharedGroupSemanticRollup['review_unit_plan']['basis'])
        : fallbackPlan.review_unit_plan.basis,
      trigger_reason: normalizedText(params.rollup.review_unit_plan?.trigger_reason),
      units: Array.isArray(params.rollup.review_unit_plan?.units)
        ? params.rollup.review_unit_plan.units
        : fallbackPlan.review_unit_plan.units,
    },
  }
}

export function applyCleanupGroupArtifactSurfaceDecision(params: {
  rollup: GmailSharedGroupSemanticRollup
  decision?: Pick<CleanupGroupArtifactSurfaceDecision, 'surface' | 'promotion' | 'review_unit_plan'> | null
}): GmailSharedGroupSemanticRollup {
  if (!params.decision) return params.rollup
  return {
    ...params.rollup,
    surface: params.decision.surface,
    promotion: params.decision.promotion,
    review_unit_plan: params.decision.review_unit_plan,
  }
}

export function buildSharedGroupSemanticRollupHash(
  rollup: GmailSharedGroupSemanticRollup
): string {
  const serialized = stableSerialize({
    semantic_rollup_schema_version: GMAIL_SEMANTIC_ROLLUP_SCHEMA_VERSION,
    semantic_rollup: rollup,
  })
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`
}

export function buildMirroredSemanticArtifactFieldsFromRollup(
  rollup: GmailSharedGroupSemanticRollup,
  options?: { clusterId?: string | null }
): {
  dominant_semantic_family: GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number]['family'] | null
  dominant_semantic_pattern: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'][number]['pattern_class'] | null
  uncertain_sender_count: number
  semantic_family_distribution: GmailSenderWorkspaceData['analytics']['semantic_family_distribution']
  semantic_pattern_distribution: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution']
  semantic_resolution_distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution']
  semantic_confidence_distribution: GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution']
  semantic_provenance_distribution: GmailSenderWorkspaceData['analytics']['semantic_provenance_distribution']
  semantic_umbrella_distribution: GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution']
  cleanup_group_surface_tier: GmailSharedGroupSemanticRollup['surface']['tier']
  cleanup_group_surface_kind: GmailSharedGroupSemanticRollup['surface']['kind']
  cleanup_group_surface_visibility: GmailSharedGroupSemanticRollup['surface']['visibility']
  cleanup_group_top_level_rank: number | null
  cleanup_group_canonical_cluster_id: string
  cleanup_group_legacy_cluster_ids: string[]
  cleanup_group_source_cluster_ids: string[]
  cleanup_group_promotion_status: GmailSharedGroupSemanticRollup['promotion']['status']
  cleanup_group_selected_semantic_axis: GmailSharedGroupSemanticRollup['promotion']['selected_axis']
  cleanup_group_operator_value_status: GmailSharedGroupSemanticRollup['promotion']['operator_value_status']
  cleanup_group_review_units_required: boolean
  cleanup_group_review_unit_basis: GmailSharedGroupSemanticRollup['review_unit_plan']['basis']
  cleanup_group_review_unit_count: number
  cleanup_group_demotion_reasons: string[]
} {
  const compatibleRollup = ensureSharedGroupSemanticRollupCompatibility({
    rollup,
    clusterId: options?.clusterId,
  })
  return {
    dominant_semantic_family: compatibleRollup.headline.dominant_semantic_family,
    dominant_semantic_pattern: compatibleRollup.headline.dominant_semantic_pattern,
    uncertain_sender_count: compatibleRollup.sender_basis.uncertain_sender_count,
    semantic_family_distribution: compatibleRollup.family_distribution.map((entry) => ({
      family: entry.family,
      sender_count: entry.sender_count,
      share_pct: entry.share_pct,
      umbrella: entry.umbrella,
      resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
      provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
      top_subtypes: entry.top_subtypes,
    })),
    semantic_pattern_distribution: compatibleRollup.pattern_distribution.map((entry) => ({
      pattern_class: entry.pattern_class,
      sender_count: entry.sender_count,
      share_pct: entry.share_pct,
      resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
      provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
      top_subtypes: entry.top_subtypes,
    })),
    semantic_resolution_distribution: compatibleRollup.trust.resolution_distribution,
    semantic_confidence_distribution: compatibleRollup.trust.confidence_distribution,
    semantic_provenance_distribution: compatibleRollup.trust.provenance_distribution,
    semantic_umbrella_distribution: compatibleRollup.trust.umbrella_distribution,
    cleanup_group_surface_tier: compatibleRollup.surface.tier,
    cleanup_group_surface_kind: compatibleRollup.surface.kind,
    cleanup_group_surface_visibility: compatibleRollup.surface.visibility,
    cleanup_group_top_level_rank: compatibleRollup.surface.top_level_rank,
    cleanup_group_canonical_cluster_id: compatibleRollup.surface.canonical_cluster_id,
    cleanup_group_legacy_cluster_ids: compatibleRollup.surface.legacy_cluster_ids,
    cleanup_group_source_cluster_ids: compatibleRollup.surface.source_cluster_ids,
    cleanup_group_promotion_status: compatibleRollup.promotion.status,
    cleanup_group_selected_semantic_axis: compatibleRollup.promotion.selected_axis,
    cleanup_group_operator_value_status: compatibleRollup.promotion.operator_value_status,
    cleanup_group_review_units_required: compatibleRollup.review_unit_plan.required,
    cleanup_group_review_unit_basis: compatibleRollup.review_unit_plan.basis,
    cleanup_group_review_unit_count: compatibleRollup.review_unit_plan.units.length,
    cleanup_group_demotion_reasons:
      compatibleRollup.promotion.status === 'promoted'
        ? []
        : compatibleRollup.promotion.reason_codes,
  }
}

export function buildSharedGroupSemanticRollupFromSemanticAnalytics(params: {
  clusterId: string
  senderCount: number
  messageCount: number
  semanticAnalytics: SemanticAnalyticsDistributions
}): GmailSharedGroupSemanticRollup {
  const groupPolicyMode = semanticPolicyModeForCleanupGroup(params.clusterId)
  const familyClearSharePct = semanticResolutionSharePct(
    params.semanticAnalytics.semantic_resolution_distribution,
    'family',
    'clear'
  )
  const patternClearSharePct = semanticResolutionSharePct(
    params.semanticAnalytics.semantic_resolution_distribution,
    'pattern',
    'clear'
  )

  const familyDistribution = params.semanticAnalytics.semantic_family_distribution.map((entry, index) => {
    const resolvedSubtypeCoveragePct = roundSharePct(
      entry.resolved_subtype_sender_count,
      entry.sender_count
    )
    const provisionalSubtypeCoveragePct = roundSharePct(
      entry.provisional_subtype_sender_count,
      entry.sender_count
    )
    const topSubtype = entry.top_subtypes[0] || null
    const subtypePersistenceState = deriveLaneSubtypePersistenceState({
      groupPolicyMode,
      clearSharePct: familyClearSharePct,
      resolvedSubtypeCoveragePct,
      topSubtype,
    })

    return {
      family: entry.family,
      sender_count: entry.sender_count,
      share_pct: entry.share_pct,
      umbrella: entry.umbrella,
      resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
      resolved_subtype_coverage_pct: resolvedSubtypeCoveragePct,
      provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
      provisional_subtype_coverage_pct: provisionalSubtypeCoveragePct,
      subtype_persistence_state: subtypePersistenceState,
      decomposition_review_required: expectedFamilyReviewFlag({
        groupPolicyMode,
        lane: {
          family: entry.family,
          sender_count: entry.sender_count,
          share_pct: entry.share_pct,
          umbrella: entry.umbrella,
          resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
          resolved_subtype_coverage_pct: resolvedSubtypeCoveragePct,
          provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
          provisional_subtype_coverage_pct: provisionalSubtypeCoveragePct,
          subtype_persistence_state: subtypePersistenceState,
          decomposition_review_required: false,
          top_subtypes: entry.top_subtypes,
        },
        isDominant: index === 0,
      }),
      top_subtypes: entry.top_subtypes,
    }
  })

  const patternDistribution = params.semanticAnalytics.semantic_pattern_distribution.map((entry, index) => {
    const resolvedSubtypeCoveragePct = roundSharePct(
      entry.resolved_subtype_sender_count,
      entry.sender_count
    )
    const provisionalSubtypeCoveragePct = roundSharePct(
      entry.provisional_subtype_sender_count,
      entry.sender_count
    )
    const topSubtype = entry.top_subtypes[0] || null
    const subtypePersistenceState = deriveLaneSubtypePersistenceState({
      groupPolicyMode,
      clearSharePct: patternClearSharePct,
      resolvedSubtypeCoveragePct,
      topSubtype,
    })

    return {
      pattern_class: entry.pattern_class,
      sender_count: entry.sender_count,
      share_pct: entry.share_pct,
      resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
      resolved_subtype_coverage_pct: resolvedSubtypeCoveragePct,
      provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
      provisional_subtype_coverage_pct: provisionalSubtypeCoveragePct,
      subtype_persistence_state: subtypePersistenceState,
      decomposition_review_required: expectedPatternReviewFlag({
        groupPolicyMode,
        lane: {
          pattern_class: entry.pattern_class,
          sender_count: entry.sender_count,
          share_pct: entry.share_pct,
          resolved_subtype_sender_count: entry.resolved_subtype_sender_count,
          resolved_subtype_coverage_pct: resolvedSubtypeCoveragePct,
          provisional_subtype_sender_count: entry.provisional_subtype_sender_count,
          provisional_subtype_coverage_pct: provisionalSubtypeCoveragePct,
          subtype_persistence_state: subtypePersistenceState,
          decomposition_review_required: false,
          top_subtypes: entry.top_subtypes,
        },
        isDominant: index === 0,
      }),
      top_subtypes: entry.top_subtypes,
    }
  })

  const dominantFamilyLane = familyDistribution[0] || null
  const dominantPatternLane = patternDistribution[0] || null
  const uncertainSenderCount = countUncertainSemanticSenders(
    params.semanticAnalytics.semantic_resolution_distribution
  )
  const defaultSurfacePlan = defaultCleanupGroupSurfacePlan({
    clusterId: params.clusterId,
    groupPolicyMode,
    senderCount: params.senderCount,
  })

  return {
    group_policy_mode: groupPolicyMode,
    sender_basis: {
      sender_count: params.senderCount,
      message_count: params.messageCount,
      uncertain_sender_count: uncertainSenderCount,
      uncertain_sender_share_pct: roundSharePct(uncertainSenderCount, params.senderCount),
    },
    headline: {
      dominant_semantic_family: dominantSemanticFamily(
        params.semanticAnalytics.semantic_family_distribution
      ),
      dominant_semantic_pattern: dominantSemanticPattern(
        params.semanticAnalytics.semantic_pattern_distribution
      ),
      family_subtype_persistence_state: dominantFamilyLane
        ? deriveHeadlineSubtypePersistenceState({
            groupPolicyMode,
            laneSharePct: dominantFamilyLane.share_pct,
            clearSharePct: familyClearSharePct,
            resolvedSubtypeCoveragePct: dominantFamilyLane.resolved_subtype_coverage_pct,
            topSubtype: dominantFamilyLane.top_subtypes[0] || null,
          })
        : null,
      pattern_subtype_persistence_state: dominantPatternLane
        ? deriveHeadlineSubtypePersistenceState({
            groupPolicyMode,
            laneSharePct: dominantPatternLane.share_pct,
            clearSharePct: patternClearSharePct,
            resolvedSubtypeCoveragePct: dominantPatternLane.resolved_subtype_coverage_pct,
            topSubtype: dominantPatternLane.top_subtypes[0] || null,
          })
        : null,
    },
    family_distribution: familyDistribution,
    pattern_distribution: patternDistribution,
    trust: {
      resolution_distribution: params.semanticAnalytics.semantic_resolution_distribution,
      confidence_distribution: params.semanticAnalytics.semantic_confidence_distribution,
      provenance_distribution: params.semanticAnalytics.semantic_provenance_distribution,
      umbrella_distribution: params.semanticAnalytics.semantic_umbrella_distribution,
      summary: {
        family_clear_share_pct: familyClearSharePct,
        pattern_clear_share_pct: patternClearSharePct,
        family_low_confidence_share_pct: semanticConfidenceSharePct(
          params.semanticAnalytics.semantic_confidence_distribution,
          'family',
          'low'
        ),
        pattern_low_confidence_share_pct: semanticConfidenceSharePct(
          params.semanticAnalytics.semantic_confidence_distribution,
          'pattern',
          'low'
        ),
        family_umbrella_share_pct: semanticUmbrellaSharePct(
          params.semanticAnalytics.semantic_umbrella_distribution,
          'family',
          'umbrella'
        ),
        pattern_umbrella_share_pct: semanticUmbrellaSharePct(
          params.semanticAnalytics.semantic_umbrella_distribution,
          'pattern',
          'umbrella'
        ),
      },
    },
    surface: defaultSurfacePlan.surface,
    promotion: {
      ...defaultSurfacePlan.promotion,
      metrics: {
        ...defaultSurfacePlan.promotion.metrics,
        dominant_share_pct: dominantFamilyLane?.share_pct || dominantPatternLane?.share_pct || 0,
        clear_share_pct: Math.max(familyClearSharePct, patternClearSharePct),
      },
    },
    review_unit_plan: defaultSurfacePlan.review_unit_plan,
    completeness: {
      canonical: true,
      runtime_repair_expected: false,
    },
  }
}

export function buildSharedGroupSemanticRollupFromSenders(params: {
  clusterId: string
  messageCount: number
  senders: SemanticSenderLike[]
}): GmailSharedGroupSemanticRollup {
  return buildSharedGroupSemanticRollupFromSemanticAnalytics({
    clusterId: params.clusterId,
    senderCount: params.senders.length,
    messageCount: params.messageCount,
    semanticAnalytics: buildSemanticAnalyticsDistributions(params.senders),
  })
}

export function buildPersistedSemanticRollupArtifactFields(params: {
  clusterId: string
  senderCount: number
  messageCount: number
  semanticAnalytics: SemanticAnalyticsDistributions
  futureCanonicalPublishFromRegistry?: boolean | null
  artifactSurfaceDecision?: Pick<
    CleanupGroupArtifactSurfaceDecision,
    'surface' | 'promotion' | 'review_unit_plan'
  > | null
}): {
  group_policy_mode: GmailSemanticGroupPolicyMode
  semantic_rollup_schema_version: number
  semantic_rollup_hash: string
  semantic_rollup: GmailSharedGroupSemanticRollup
} & ReturnType<typeof buildMirroredSemanticArtifactFieldsFromRollup> {
  const semanticRollupBase = applyCleanupGroupArtifactSurfaceDecision({
    rollup: buildSharedGroupSemanticRollupFromSemanticAnalytics(params),
    decision: params.artifactSurfaceDecision,
  })
  const semanticRollup =
    params.futureCanonicalPublishFromRegistry === true
      ? applyFutureCanonicalCleanupGroupSurfaceIdentity({
          clusterId: params.clusterId,
          rollup: semanticRollupBase,
        })
      : semanticRollupBase
  return {
    group_policy_mode: semanticRollup.group_policy_mode,
    semantic_rollup_schema_version: GMAIL_SEMANTIC_ROLLUP_SCHEMA_VERSION,
    semantic_rollup_hash: buildSharedGroupSemanticRollupHash(semanticRollup),
    semantic_rollup: semanticRollup,
    ...buildMirroredSemanticArtifactFieldsFromRollup(semanticRollup),
  }
}

function mirrorsMatchRollup(
  rollup: GmailSharedGroupSemanticRollup,
  payload: Record<string, unknown>
): boolean {
  const expected = buildMirroredSemanticArtifactFieldsFromRollup(rollup)
  return (
    payload.group_policy_mode === rollup.group_policy_mode &&
    stableSerialize(payload.dominant_semantic_family ?? null) ===
      stableSerialize(expected.dominant_semantic_family) &&
    stableSerialize(payload.dominant_semantic_pattern ?? null) ===
      stableSerialize(expected.dominant_semantic_pattern) &&
    stableSerialize(payload.uncertain_sender_count ?? null) ===
      stableSerialize(expected.uncertain_sender_count) &&
    stableSerialize(payload.semantic_family_distribution ?? null) ===
      stableSerialize(expected.semantic_family_distribution) &&
    stableSerialize(payload.semantic_pattern_distribution ?? null) ===
      stableSerialize(expected.semantic_pattern_distribution) &&
    stableSerialize(payload.semantic_resolution_distribution ?? null) ===
      stableSerialize(expected.semantic_resolution_distribution) &&
    stableSerialize(payload.semantic_confidence_distribution ?? null) ===
      stableSerialize(expected.semantic_confidence_distribution) &&
    stableSerialize(payload.semantic_provenance_distribution ?? null) ===
      stableSerialize(expected.semantic_provenance_distribution) &&
    stableSerialize(payload.semantic_umbrella_distribution ?? null) ===
      stableSerialize(expected.semantic_umbrella_distribution) &&
    stableSerialize(payload.cleanup_group_surface_tier ?? null) ===
      stableSerialize(expected.cleanup_group_surface_tier) &&
    stableSerialize(payload.cleanup_group_surface_kind ?? null) ===
      stableSerialize(expected.cleanup_group_surface_kind) &&
    stableSerialize(payload.cleanup_group_surface_visibility ?? null) ===
      stableSerialize(expected.cleanup_group_surface_visibility) &&
    stableSerialize(payload.cleanup_group_top_level_rank ?? null) ===
      stableSerialize(expected.cleanup_group_top_level_rank) &&
    stableSerialize(payload.cleanup_group_canonical_cluster_id ?? null) ===
      stableSerialize(expected.cleanup_group_canonical_cluster_id) &&
    stableSerialize(payload.cleanup_group_legacy_cluster_ids ?? null) ===
      stableSerialize(expected.cleanup_group_legacy_cluster_ids) &&
    stableSerialize(payload.cleanup_group_source_cluster_ids ?? null) ===
      stableSerialize(expected.cleanup_group_source_cluster_ids) &&
    stableSerialize(payload.cleanup_group_promotion_status ?? null) ===
      stableSerialize(expected.cleanup_group_promotion_status) &&
    stableSerialize(payload.cleanup_group_selected_semantic_axis ?? null) ===
      stableSerialize(expected.cleanup_group_selected_semantic_axis) &&
    stableSerialize(payload.cleanup_group_operator_value_status ?? null) ===
      stableSerialize(expected.cleanup_group_operator_value_status) &&
    stableSerialize(payload.cleanup_group_review_units_required ?? null) ===
      stableSerialize(expected.cleanup_group_review_units_required) &&
    stableSerialize(payload.cleanup_group_review_unit_basis ?? null) ===
      stableSerialize(expected.cleanup_group_review_unit_basis) &&
    stableSerialize(payload.cleanup_group_review_unit_count ?? null) ===
      stableSerialize(expected.cleanup_group_review_unit_count) &&
    stableSerialize(payload.cleanup_group_demotion_reasons ?? null) ===
      stableSerialize(expected.cleanup_group_demotion_reasons)
  )
}

export function validateSharedGroupSemanticRollup(params: {
  clusterId: string
  rollup: GmailSharedGroupSemanticRollup
}): string[] {
  const rollup = ensureSharedGroupSemanticRollupCompatibility({
    rollup: params.rollup,
    clusterId: params.clusterId,
  })
  const errors: string[] = []
  const expectedPolicyMode = semanticPolicyModeForCleanupGroup(params.clusterId)
  if (rollup.group_policy_mode !== expectedPolicyMode) {
    errors.push(
      `Expected group policy mode ${expectedPolicyMode} for ${params.clusterId}, received ${rollup.group_policy_mode}.`
    )
  }
  if (!rollup.completeness.canonical || rollup.completeness.runtime_repair_expected) {
    errors.push(`Semantic rollup completeness flags are invalid for ${params.clusterId}.`)
  }
  if (!rollup.surface.canonical_cluster_id.trim()) {
    errors.push(`Surface canonical cluster id is missing for ${params.clusterId}.`)
  }
  if (!Array.isArray(rollup.surface.source_cluster_ids) || rollup.surface.source_cluster_ids.length === 0) {
    errors.push(`Surface source cluster ids are missing for ${params.clusterId}.`)
  }
  if (
    rollup.review_unit_plan.required &&
    rollup.review_unit_plan.units.length === 0
  ) {
    errors.push(`Review-unit plan is marked required without units for ${params.clusterId}.`)
  }
  if (
    rollup.promotion.metrics.actionable_review_unit_count >
    rollup.review_unit_plan.units.length
  ) {
    errors.push(`Promotion metrics overstate review-unit count for ${params.clusterId}.`)
  }

  const expectedDominantFamily = rollup.family_distribution[0]?.family || null
  const expectedDominantPattern = rollup.pattern_distribution[0]?.pattern_class || null
  if (rollup.headline.dominant_semantic_family !== expectedDominantFamily) {
    errors.push(`Dominant semantic family drift detected for ${params.clusterId}.`)
  }
  if (rollup.headline.dominant_semantic_pattern !== expectedDominantPattern) {
    errors.push(`Dominant semantic pattern drift detected for ${params.clusterId}.`)
  }
  if (rollup.sender_basis.uncertain_sender_count > rollup.sender_basis.sender_count) {
    errors.push(`Uncertain sender count exceeds sender count for ${params.clusterId}.`)
  }

  rollup.family_distribution.forEach((lane, index) => {
    const expectedCoverage = roundSharePct(lane.resolved_subtype_sender_count, lane.sender_count)
    if (lane.resolved_subtype_coverage_pct !== expectedCoverage) {
      errors.push(`Family resolved subtype coverage drift detected for ${params.clusterId}/${lane.family}.`)
    }
    const expectedProvisionalCoverage = roundSharePct(
      lane.provisional_subtype_sender_count,
      lane.sender_count
    )
    if (lane.provisional_subtype_coverage_pct !== expectedProvisionalCoverage) {
      errors.push(`Family provisional subtype coverage drift detected for ${params.clusterId}/${lane.family}.`)
    }
    if (
      lane.resolved_subtype_sender_count > lane.sender_count ||
      lane.provisional_subtype_sender_count > lane.sender_count
    ) {
      errors.push(`Family subtype counts exceed sender count for ${params.clusterId}/${lane.family}.`)
    }
    const expectedState = deriveLaneSubtypePersistenceState({
      groupPolicyMode: rollup.group_policy_mode,
      clearSharePct: rollup.trust.summary.family_clear_share_pct,
      resolvedSubtypeCoveragePct: lane.resolved_subtype_coverage_pct,
      topSubtype: lane.top_subtypes[0] || null,
    })
    if (lane.subtype_persistence_state !== expectedState) {
      errors.push(`Family subtype persistence state drift detected for ${params.clusterId}/${lane.family}.`)
    }
    const expectedReviewRequired = expectedFamilyReviewFlag({
      groupPolicyMode: rollup.group_policy_mode,
      lane,
      isDominant: index === 0,
    })
    if (lane.decomposition_review_required !== expectedReviewRequired) {
      errors.push(`Family decomposition review flag drift detected for ${params.clusterId}/${lane.family}.`)
    }
    if (lane.subtype_persistence_state === 'survives' && !topSubtypeSupportsSurvival(lane.top_subtypes[0] || null)) {
      errors.push(`Family subtype survival is too aggressive for ${params.clusterId}/${lane.family}.`)
    }
  })

  rollup.pattern_distribution.forEach((lane, index) => {
    const expectedCoverage = roundSharePct(lane.resolved_subtype_sender_count, lane.sender_count)
    if (lane.resolved_subtype_coverage_pct !== expectedCoverage) {
      errors.push(
        `Pattern resolved subtype coverage drift detected for ${params.clusterId}/${lane.pattern_class}.`
      )
    }
    const expectedProvisionalCoverage = roundSharePct(
      lane.provisional_subtype_sender_count,
      lane.sender_count
    )
    if (lane.provisional_subtype_coverage_pct !== expectedProvisionalCoverage) {
      errors.push(
        `Pattern provisional subtype coverage drift detected for ${params.clusterId}/${lane.pattern_class}.`
      )
    }
    const expectedState = deriveLaneSubtypePersistenceState({
      groupPolicyMode: rollup.group_policy_mode,
      clearSharePct: rollup.trust.summary.pattern_clear_share_pct,
      resolvedSubtypeCoveragePct: lane.resolved_subtype_coverage_pct,
      topSubtype: lane.top_subtypes[0] || null,
    })
    if (lane.subtype_persistence_state !== expectedState) {
      errors.push(
        `Pattern subtype persistence state drift detected for ${params.clusterId}/${lane.pattern_class}.`
      )
    }
    const expectedReviewRequired = expectedPatternReviewFlag({
      groupPolicyMode: rollup.group_policy_mode,
      lane,
      isDominant: index === 0,
    })
    if (lane.decomposition_review_required !== expectedReviewRequired) {
      errors.push(
        `Pattern decomposition review flag drift detected for ${params.clusterId}/${lane.pattern_class}.`
      )
    }
    if (lane.subtype_persistence_state === 'survives' && !topSubtypeSupportsSurvival(lane.top_subtypes[0] || null)) {
      errors.push(`Pattern subtype survival is too aggressive for ${params.clusterId}/${lane.pattern_class}.`)
    }
  })

  const expectedHeadlineFamilyState =
    rollup.family_distribution[0] != null
      ? deriveHeadlineSubtypePersistenceState({
          groupPolicyMode: rollup.group_policy_mode,
          laneSharePct: rollup.family_distribution[0].share_pct,
          clearSharePct: rollup.trust.summary.family_clear_share_pct,
          resolvedSubtypeCoveragePct: rollup.family_distribution[0].resolved_subtype_coverage_pct,
          topSubtype: rollup.family_distribution[0].top_subtypes[0] || null,
        })
      : null
  if (compatibleState(rollup.headline.family_subtype_persistence_state) !== expectedHeadlineFamilyState) {
    errors.push(`Headline family subtype persistence state drift detected for ${params.clusterId}.`)
  }

  const expectedHeadlinePatternState =
    rollup.pattern_distribution[0] != null
      ? deriveHeadlineSubtypePersistenceState({
          groupPolicyMode: rollup.group_policy_mode,
          laneSharePct: rollup.pattern_distribution[0].share_pct,
          clearSharePct: rollup.trust.summary.pattern_clear_share_pct,
          resolvedSubtypeCoveragePct: rollup.pattern_distribution[0].resolved_subtype_coverage_pct,
          topSubtype: rollup.pattern_distribution[0].top_subtypes[0] || null,
        })
      : null
  if (
    compatibleState(rollup.headline.pattern_subtype_persistence_state) !== expectedHeadlinePatternState
  ) {
    errors.push(`Headline pattern subtype persistence state drift detected for ${params.clusterId}.`)
  }

  return errors
}

export function assertSharedGroupSemanticRollupArtifactCongruence(params: {
  clusterId: string
  headerAnalytics: Record<string, unknown>
  summaryPayload: Record<string, unknown>
}): void {
  const headerRollup = params.headerAnalytics.semantic_rollup as GmailSharedGroupSemanticRollup | null
  const summaryRollup = params.summaryPayload.semantic_rollup as GmailSharedGroupSemanticRollup | null
  const headerHash = typeof params.headerAnalytics.semantic_rollup_hash === 'string'
    ? params.headerAnalytics.semantic_rollup_hash
    : null
  const summaryHash = typeof params.summaryPayload.semantic_rollup_hash === 'string'
    ? params.summaryPayload.semantic_rollup_hash
    : null
  const headerSchemaVersion = params.headerAnalytics.semantic_rollup_schema_version
  const summarySchemaVersion = params.summaryPayload.semantic_rollup_schema_version
  const errors: string[] = []

  if (!headerRollup || !summaryRollup) {
    errors.push(`Missing semantic_rollup payload for ${params.clusterId}.`)
  } else {
    if (stableSerialize(headerRollup) !== stableSerialize(summaryRollup)) {
      errors.push(`Semantic rollup mismatch between header and summary for ${params.clusterId}.`)
    }
    const expectedHash = buildSharedGroupSemanticRollupHash(headerRollup)
    if (headerHash !== expectedHash || summaryHash !== expectedHash) {
      errors.push(`Semantic rollup hash mismatch detected for ${params.clusterId}.`)
    }
    if (!mirrorsMatchRollup(headerRollup, params.headerAnalytics)) {
      errors.push(`Header semantic mirrors drift from canonical rollup for ${params.clusterId}.`)
    }
    if (!mirrorsMatchRollup(summaryRollup, params.summaryPayload)) {
      errors.push(`Summary semantic mirrors drift from canonical rollup for ${params.clusterId}.`)
    }
    errors.push(...validateSharedGroupSemanticRollup({ clusterId: params.clusterId, rollup: headerRollup }))
  }

  if (
    headerSchemaVersion !== GMAIL_SEMANTIC_ROLLUP_SCHEMA_VERSION ||
    summarySchemaVersion !== GMAIL_SEMANTIC_ROLLUP_SCHEMA_VERSION
  ) {
    errors.push(`Unexpected semantic rollup schema version for ${params.clusterId}.`)
  }

  if (errors.length > 0) {
    throw new Error(
      `Semantic rollup artifact validation failed for ${params.clusterId}: ${errors.join(' ')}`
    )
  }
}
