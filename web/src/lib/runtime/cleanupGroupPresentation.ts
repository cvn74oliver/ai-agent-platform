import type {
  GmailCleanupClusterRef,
  GmailCleanupGroupReviewUnit,
  GmailCleanupGroupReviewUnitBasis,
  GmailMailboxIntelligenceData,
  GmailSemanticFamily,
  GmailSenderWorkspaceSemanticFocus,
  GmailSharedGroupSemanticRollup,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  resolveCleanupClusterIdentity,
  type CleanupCanonicalGroupDescriptor,
} from '@/lib/runtime/gmailCleanupClusterIdentity'
import { gmailSemanticFamilyDisplayLabel } from '@/lib/runtime/gmailSemanticPresentationPolicy'

export type CleanupGroupSectionId =
  | 'semantic_parents'
  | 'structural_lanes'
  | 'secondary'
  | 'context'

export type CleanupGroupRecommendationReason =
  | 'resume_work'
  | 'small_quick_win'
  | 'high_impact_manageable'
  | 'backlog'
  | 'none'

export type CleanupGroupUiSection = {
  id: CleanupGroupSectionId
  title: string
  description: string
  defaultExpanded: boolean
}

export type CleanupGroupRecommendationCopy = {
  title: string
  detail: string
  bridgeDetail: string
}

export type CleanupGroupIntentId =
  | 'quick_start'
  | 'manageable_impact'
  | 'backlog_reduction'

export type CleanupGroupIntentSnapshot<T> = {
  id: CleanupGroupIntentId
  title: string
  description: string
  group: T | null
}

export type CleanupGroupInternalPattern = {
  id: string
  label: string
  semanticFamily: GmailSemanticFamily
  semanticSubtype: string | null
  kind: 'family' | 'subtype' | 'remainder'
  senderCount: number
  groupSharePct: number
  familySharePct: number
  tone: 'resolved' | 'provisional' | 'unresolved'
  guidance: string
}

export type CleanupGroupInternalStructure = {
  dominantFamily: {
    key: GmailSemanticFamily
    label: string
    senderCount: number
    sharePct: number
  }
  summary: string
  patterns: CleanupGroupInternalPattern[]
  remainder: CleanupGroupInternalPattern | null
  howToStart: string[]
  intentionalRemainderNote: string | null
}

export type CleanupGroupDerivedReviewUnit = {
  id: string
  label: string
  semanticFamily: GmailSemanticFamily
  semanticSubtype: string | null
  kind: 'family' | 'subtype' | 'remainder'
  tone: CleanupGroupInternalPattern['tone']
  senderCount: number
  groupSharePct: number
  familySharePct: number
  guidance: string
  honestyLabel: string
}

export const CLEANUP_GROUP_REVIEW_UNIT_TARGET_MIN = 50
export const CLEANUP_GROUP_REVIEW_UNIT_TARGET_MAX = 300
export const CLEANUP_GROUP_REVIEW_UNIT_HARD_MAX = 400

export type CleanupGroupPublishedReviewUnitTargetState =
  | 'under_target'
  | 'within_target'
  | 'near_cap'
  | 'oversized'

export type CleanupGroupPublishedReviewUnit = {
  id: string
  label: string
  senderCount: number
  groupSharePct: number
  sourceKind: GmailCleanupGroupReviewUnit['source_kind']
  sourceKey: string
  unitRole: GmailCleanupGroupReviewUnit['unit_role']
  basis: GmailCleanupGroupReviewUnitBasis
  semanticFamily: GmailSemanticFamily | null
  semanticSubtype: string | null
  focusKind: GmailSenderWorkspaceSemanticFocus['kind'] | null
  surfacedSubtypeKeys: string[]
  reasonKind: 'assignment_reason' | 'exclusion_reason' | null
  targetState: CleanupGroupPublishedReviewUnitTargetState
  targetLabel: string
  guidance: string
}

export type CleanupGroupSurfaceTier = 'featured_parent' | 'collapsed_parent' | 'secondary'

export type CleanupGroupSurfaceKind =
  | 'semantic_parent'
  | 'backlog_parent'
  | 'structural_parent'
  | 'historical_parent'
  | 'secondary_candidate'

export type CleanupGroupSectionSummary<T> = CleanupGroupUiSection & {
  groups: T[]
  groupCount: number
  totalSenderCount: number
  totalImpactCount: number
}

type CleanupGroupUiMeta = {
  sectionId: CleanupGroupSectionId
  laneLabel: 'Semantic parent' | 'Structural lane' | 'Secondary' | 'Context'
  title: string
  whyExists: string
  startWith: string | null
}

type CleanupGroupSurfaceMeta = {
  tier: CleanupGroupSurfaceTier
  kind: CleanupGroupSurfaceKind
}

const FALLBACK_SURFACE_META: CleanupGroupSurfaceMeta = {
  tier: 'secondary',
  kind: 'secondary_candidate',
}

const FALLBACK_UI_META: CleanupGroupUiMeta = {
  sectionId: 'structural_lanes',
  laneLabel: 'Structural lane',
  title: 'Cleanup group',
  whyExists: 'Grouped into the current cleanup snapshot as a sender-first review pass.',
  startWith: null,
}

const CLEANUP_GROUP_CANONICAL_TITLES = {
  'semantic.marketing_subscriptions': 'Marketing subscriptions',
  'structural.backlog': 'Backlog',
  'structural.unresolved': 'Unresolved',
  'structural.protected_trust': 'Protected trust',
  'secondary.account_updates': 'Account updates',
  'context.historical': 'Historical',
  'secondary.social_community': 'Social community',
} as const satisfies Record<string, string>

const CLEANUP_GROUP_DEFAULT_REVIEW_UNIT_FAMILY_BY_CANONICAL_ID: Partial<
  Record<string, GmailSemanticFamily>
> = {
  'semantic.marketing_subscriptions': 'marketing_promotional',
}

export const CLEANUP_GROUP_UI_SECTIONS: CleanupGroupUiSection[] = [
  {
    id: 'semantic_parents',
    title: 'Semantic parents',
    description:
      'Top-level canonical semantic entry points. Start here when the published artifact supports one coherent semantic parent.',
    defaultExpanded: true,
  },
  {
    id: 'structural_lanes',
    title: 'Structural lanes',
    description:
      'Structural backlog, protected, and unresolved groups stay top-level when workflow or safety framing outranks one semantic family.',
    defaultExpanded: true,
  },
  {
    id: 'secondary',
    title: 'Secondary',
    description:
      'Optional canonical secondary groups stay available without becoming equal-weight starting points.',
    defaultExpanded: false,
  },
  {
    id: 'context',
    title: 'Context',
    description:
      'Historical context stays available for completeness, but remains visually and behaviorally reduced.',
    defaultExpanded: false,
  },
]

function cleanupGroupDescriptor(clusterId: string): CleanupCanonicalGroupDescriptor | null {
  return resolveCleanupClusterIdentity(clusterId, []).canonicalDescriptor
}

function cleanupGroupCanonicalId(clusterId: string): string {
  return cleanupGroupDescriptor(clusterId)?.canonicalClusterId || clusterId
}

function humanizeCleanupGroupTitle(clusterId: string): string {
  const normalized = clusterId
    .split('.')
    .pop()
    ?.split(':')
    .pop()
    ?.replace(/[_-]+/g, ' ')
    .trim()

  if (!normalized) return 'Cleanup group'
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getCleanupGroupCanonicalClusterId(clusterId: string): string {
  return cleanupGroupCanonicalId(clusterId)
}

export function getCleanupGroupPrimaryLabel(
  clusterId: string,
  fallbackTitle?: string | null
): string {
  const canonicalClusterId = cleanupGroupCanonicalId(clusterId)
  const registryTitle =
    CLEANUP_GROUP_CANONICAL_TITLES[
      canonicalClusterId as keyof typeof CLEANUP_GROUP_CANONICAL_TITLES
    ]
  if (registryTitle) return registryTitle
  if (typeof fallbackTitle === 'string' && fallbackTitle.trim()) return fallbackTitle.trim()
  return humanizeCleanupGroupTitle(canonicalClusterId)
}

function reviewUnitSemanticFamily(params: {
  clusterId: string
  unit: GmailCleanupGroupReviewUnit
}): GmailSemanticFamily | null {
  const canonicalClusterId = cleanupGroupCanonicalId(params.clusterId)

  if (
    params.unit.source_kind === 'family_lane' ||
    params.unit.source_kind === 'family_remainder'
  ) {
    if (
      params.unit.source_key === 'marketing_promotional' ||
      params.unit.source_key === 'commerce_transactional' ||
      params.unit.source_key === 'account_notification' ||
      params.unit.source_key === 'security_alert' ||
      params.unit.source_key === 'social_community' ||
      params.unit.source_key === 'human_personal'
    ) {
      return params.unit.source_key
    }
  }

  if (params.unit.source_kind === 'family_subtype') {
    return (
      CLEANUP_GROUP_DEFAULT_REVIEW_UNIT_FAMILY_BY_CANONICAL_ID[canonicalClusterId] || null
    )
  }

  return null
}

function reviewUnitTargetState(senderCount: number): CleanupGroupPublishedReviewUnitTargetState {
  if (senderCount > CLEANUP_GROUP_REVIEW_UNIT_HARD_MAX) return 'oversized'
  if (senderCount > CLEANUP_GROUP_REVIEW_UNIT_TARGET_MAX) return 'near_cap'
  if (senderCount < CLEANUP_GROUP_REVIEW_UNIT_TARGET_MIN) return 'under_target'
  return 'within_target'
}

function reviewUnitTargetLabel(targetState: CleanupGroupPublishedReviewUnitTargetState): string {
  if (targetState === 'oversized') return 'Blocking: above hard max'
  if (targetState === 'near_cap') return 'Near cap'
  if (targetState === 'under_target') return 'Small but valid'
  return 'Target size'
}

function reviewUnitGuidance(params: {
  basis: GmailCleanupGroupReviewUnitBasis
  unit: GmailCleanupGroupReviewUnit
}): string {
  if (params.unit.source_kind === 'assignment_reason') {
    return 'Start here to keep protected review bounded by one protection reason.'
  }
  if (params.unit.source_kind === 'exclusion_reason') {
    return 'Start here to keep unresolved review bounded by one exclusion reason.'
  }
  if (params.unit.source_kind === 'family_lane') {
    return 'Start here to narrow the first pass to one semantic family lane.'
  }
  if (params.unit.source_kind === 'family_remainder') {
    return 'Use this remainder after the named subtype slices.'
  }
  if (params.basis === 'subtype-first') {
    return 'Start here for the narrowest published subtype slice.'
  }
  return 'Start here to narrow the sender queue before entering review.'
}

export function buildCleanupGroupPublishedReviewUnits(
  clusterId: string,
  rollup: GmailSharedGroupSemanticRollup | null
): CleanupGroupPublishedReviewUnit[] {
  const unitPlan = rollup?.review_unit_plan
  if (!unitPlan?.units?.length) return []

  const marketingSubtypeKeys = unitPlan.units
    .filter((unit) => unit.source_kind === 'family_subtype')
    .map((unit) => unit.source_key)

  return unitPlan.units.map((unit) => {
    const semanticFamily = reviewUnitSemanticFamily({ clusterId, unit })
    const focusKind =
      unit.source_kind === 'family_lane'
        ? 'family'
        : unit.source_kind === 'family_subtype'
          ? 'subtype'
          : unit.source_kind === 'family_remainder'
            ? 'remainder'
            : null
    const targetState = reviewUnitTargetState(unit.sender_count)
    return {
      id: unit.unit_id,
      label: unit.label,
      senderCount: Math.max(0, unit.sender_count),
      groupSharePct: Math.max(0, Math.min(unit.share_pct, 100)),
      sourceKind: unit.source_kind,
      sourceKey: unit.source_key,
      unitRole: unit.unit_role,
      basis: unitPlan.basis,
      semanticFamily,
      semanticSubtype: unit.source_kind === 'family_subtype' ? unit.source_key : null,
      focusKind,
      surfacedSubtypeKeys:
        unit.source_kind === 'family_remainder' ? marketingSubtypeKeys : marketingSubtypeKeys,
      reasonKind:
        unit.source_kind === 'assignment_reason' || unit.source_kind === 'exclusion_reason'
          ? unit.source_kind
          : null,
      targetState,
      targetLabel: reviewUnitTargetLabel(targetState),
      guidance: reviewUnitGuidance({
        basis: unitPlan.basis,
        unit,
      }),
    }
  })
}

export function findCleanupGroupPublishedReviewUnit(
  units: CleanupGroupPublishedReviewUnit[],
  unitId: string | null | undefined
): CleanupGroupPublishedReviewUnit | null {
  if (!unitId) return null
  return units.find((unit) => unit.id === unitId) || null
}

export function recommendCleanupGroupPublishedReviewUnit(
  units: CleanupGroupPublishedReviewUnit[]
): CleanupGroupPublishedReviewUnit | null {
  return units.find((unit) => unit.targetState !== 'oversized') || units[0] || null
}

export function buildSemanticFocusFromPublishedReviewUnit(
  unit: CleanupGroupPublishedReviewUnit
): GmailSenderWorkspaceSemanticFocus | null {
  if (!unit.semanticFamily || !unit.focusKind) return null
  return {
    family: unit.semanticFamily,
    kind: unit.focusKind,
    subtypeKey: unit.focusKind === 'subtype' ? unit.semanticSubtype : null,
    surfacedSubtypeKeys: unit.surfacedSubtypeKeys,
  }
}

function cleanupGroupUiMeta(clusterId: string): CleanupGroupUiMeta {
  const descriptor = cleanupGroupDescriptor(clusterId)
  const canonicalClusterId = descriptor?.canonicalClusterId || clusterId

  if (!descriptor) return FALLBACK_UI_META

  if (descriptor.lane === 'action') {
    return {
      sectionId: 'semantic_parents',
      laneLabel: 'Semantic parent',
      title: getCleanupGroupPrimaryLabel(canonicalClusterId),
      whyExists:
        'This semantic parent stays top-level because the published artifact supports one coherent semantic cleanup family.',
      startWith:
        canonicalClusterId === 'semantic.marketing_subscriptions'
          ? 'Offer campaigns first · Product updates next'
          : null,
    }
  }

  if (descriptor.lane === 'backlog') {
    return {
      sectionId: 'structural_lanes',
      laneLabel: 'Structural lane',
      title: getCleanupGroupPrimaryLabel(canonicalClusterId),
      whyExists:
        'This structural lane stays top-level because backlog state is the real organizing frame, not one semantic family.',
      startWith: 'Unread first · Highest-volume backlog',
    }
  }

  if (descriptor.lane === 'coverage') {
    return {
      sectionId: 'structural_lanes',
      laneLabel: 'Structural lane',
      title: getCleanupGroupPrimaryLabel(canonicalClusterId),
      whyExists:
        descriptor.groupType === 'protected'
          ? 'This structural lane stays top-level so protected trust remains visible without being reframed as a semantic parent.'
          : 'This structural lane stays top-level because mixed or low-evidence senders still need explicit coverage.',
      startWith: null,
    }
  }

  if (descriptor.lane === 'secondary') {
    return {
      sectionId: 'secondary',
      laneLabel: 'Secondary',
      title: getCleanupGroupPrimaryLabel(canonicalClusterId),
      whyExists:
        'This canonical secondary group remains available without becoming an equal-weight entry point.',
      startWith: null,
    }
  }

  if (descriptor.lane === 'context') {
    return {
      sectionId: 'context',
      laneLabel: 'Context',
      title: getCleanupGroupPrimaryLabel(canonicalClusterId),
      whyExists:
        'This context group stays visible for completeness, but it is intentionally reduced and not treated as a primary start point.',
      startWith: null,
    }
  }

  return FALLBACK_UI_META
}

function cleanupGroupRank(clusterId: string): number {
  const descriptor = cleanupGroupDescriptor(clusterId)
  return descriptor?.displayPriority ?? 9999
}

function compareCleanupGroupsByUiOrder(leftId: string, rightId: string): number {
  const rankDelta = cleanupGroupRank(leftId) - cleanupGroupRank(rightId)
  if (rankDelta !== 0) return rankDelta
  return leftId.localeCompare(rightId)
}

export function getCleanupGroupSection(clusterId: string): CleanupGroupUiSection {
  const meta = cleanupGroupUiMeta(clusterId)
  return (
    CLEANUP_GROUP_UI_SECTIONS.find((section) => section.id === meta.sectionId) ||
    CLEANUP_GROUP_UI_SECTIONS[0]
  )
}

function cleanupGroupSurfaceMeta(clusterId: string): CleanupGroupSurfaceMeta {
  const descriptor = cleanupGroupDescriptor(clusterId)
  if (!descriptor) {
    return FALLBACK_SURFACE_META
  }

  if (descriptor.lane === 'action') {
    return {
      tier: 'featured_parent',
      kind: 'semantic_parent',
    }
  }
  if (descriptor.lane === 'backlog') {
    return {
      tier: 'featured_parent',
      kind: 'backlog_parent',
    }
  }
  if (descriptor.lane === 'coverage') {
    return {
      tier: 'featured_parent',
      kind: 'structural_parent',
    }
  }
  if (descriptor.lane === 'context') {
    return {
      tier: 'collapsed_parent',
      kind: 'historical_parent',
    }
  }
  return {
    tier: 'secondary',
    kind: 'secondary_candidate',
  }
}

export function getCleanupGroupSurfaceTier(clusterId: string): CleanupGroupSurfaceTier {
  return cleanupGroupSurfaceMeta(clusterId).tier
}

export function getCleanupGroupSurfaceKind(clusterId: string): CleanupGroupSurfaceKind {
  return cleanupGroupSurfaceMeta(clusterId).kind
}

export function isCleanupGroupSurfacedInUi(clusterId: string): boolean {
  return cleanupGroupDescriptor(clusterId)?.surfacedStatus === 'surfaced'
}

export function getCleanupGroupLaneLabel(clusterId: string): CleanupGroupUiMeta['laneLabel'] {
  return cleanupGroupUiMeta(clusterId).laneLabel
}

export function getCleanupGroupTitle(clusterId: string, fallbackTitle?: string | null): string {
  const meta = cleanupGroupUiMeta(clusterId)
  if (meta.title && meta.title !== FALLBACK_UI_META.title) return meta.title
  return getCleanupGroupPrimaryLabel(clusterId, fallbackTitle)
}

export function getCleanupGroupWhyExists(clusterId: string): string {
  return cleanupGroupUiMeta(clusterId).whyExists
}

export function getCleanupGroupStartWith(clusterId: string): string | null {
  return cleanupGroupUiMeta(clusterId).startWith
}

export function sortCleanupGroupsForUi<T>(
  groups: T[],
  getClusterId: (group: T) => string
): T[] {
  return groups
    .slice()
    .sort((left, right) =>
      compareCleanupGroupsByUiOrder(getClusterId(left), getClusterId(right))
    )
}

export function buildCleanupGroupSectionsForUi<T>(
  groups: T[],
  getClusterId: (group: T) => string
): Array<CleanupGroupUiSection & { groups: T[] }> {
  const sortedGroups = sortCleanupGroupsForUi(groups, getClusterId)
  return CLEANUP_GROUP_UI_SECTIONS.map((section) => ({
    ...section,
    groups: sortedGroups.filter((group) => getCleanupGroupSection(getClusterId(group)).id === section.id),
  })).filter((section) => section.groups.length > 0)
}

export function buildCleanupGroupSectionSummariesForUi<T>(params: {
  groups: T[]
  getClusterId: (group: T) => string
  getSenderCount: (group: T) => number | null | undefined
  getImpactCount: (group: T) => number | null | undefined
}): Array<CleanupGroupSectionSummary<T>> {
  return buildCleanupGroupSectionsForUi(params.groups, params.getClusterId).map((section) => ({
    ...section,
    groupCount: section.groups.length,
    totalSenderCount: section.groups.reduce((total, group) => {
      const count = normalizedSenderCount(params.getSenderCount(group))
      return total + (count ?? 0)
    }, 0),
    totalImpactCount: section.groups.reduce((total, group) => {
      const count = normalizedImpactCount(params.getImpactCount(group))
      return total + count
    }, 0),
  }))
}

function normalizedSenderCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return Math.round(value)
}

function normalizedImpactCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.round(value)
}

function formatPercentLabel(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '0%'
  if (value < 1) return '<1%'
  return `${Math.round(value)}%`
}

function leadSubtypeSenderCount(
  topSubtypes: GmailSharedGroupSemanticRollup['family_distribution'][number]['top_subtypes']
): number {
  return topSubtypes.reduce((sum, entry) => sum + Math.max(0, entry.sender_count), 0)
}

function dominantFamilyLane(
  rollup: GmailSharedGroupSemanticRollup
): GmailSharedGroupSemanticRollup['family_distribution'][number] | null {
  if (rollup.family_distribution.length === 0) return null
  return (
    rollup.family_distribution.find(
      (entry) => entry.family === rollup.headline.dominant_semantic_family
    ) || rollup.family_distribution[0]
  )
}

function listLabels(values: string[]): string {
  if (values.length === 0) return ''
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`
}

function patternGuidance(
  clusterId: string,
  pattern: Pick<CleanupGroupInternalPattern, 'semanticSubtype' | 'label' | 'tone' | 'kind'>
): string {
  const canonicalClusterId = cleanupGroupCanonicalId(clusterId)

  if (canonicalClusterId === 'semantic.marketing_subscriptions') {
    if (pattern.semanticSubtype === 'offer_campaign') {
      return 'Start with offer campaigns for fast cleanup.'
    }
    if (pattern.semanticSubtype === 'product_marketing_update') {
      return 'Then review product updates for selective keep decisions.'
    }
    if (pattern.semanticSubtype === 'editorial_newsletter') {
      return 'Use editorial newsletters after that to separate valuable reading from passive subscriptions.'
    }
    if (pattern.semanticSubtype === 'remainder') {
      return 'Leave the broader promotional remainder for last when you want a wider cleanup pass.'
    }
  }

  if (pattern.kind === 'family') {
    if (canonicalClusterId === 'structural.backlog') {
      return `Start with ${pattern.label.toLowerCase()} when you want one descriptive backlog slice at a time.`
    }
    if (canonicalClusterId === 'structural.unresolved') {
      return `Use ${pattern.label.toLowerCase()} when you want one evidence profile at a time inside this mixed coverage lane.`
    }
    if (canonicalClusterId === 'structural.protected_trust') {
      return `Use ${pattern.label.toLowerCase()} when you want to inspect one descriptive slice without changing this safety lane.`
    }
    return `Use ${pattern.label.toLowerCase()} as a narrower descriptive lane inside this parent group.`
  }

  if (pattern.semanticSubtype === 'remainder') {
    return `Review the broader ${pattern.label.toLowerCase()} last, after the clearest visible patterns.`
  }

  if (pattern.tone === 'resolved') {
    return `Start with ${pattern.label.toLowerCase()} for the clearest first pass.`
  }

  return `Start with the strongest ${pattern.label.toLowerCase()} matches, then fall back to the broader family.`
}

function buildSemanticFirstInternalStructure(
  clusterId: string,
  rollup: GmailSharedGroupSemanticRollup
): CleanupGroupInternalStructure | null {
  const leadLane = dominantFamilyLane(rollup)
  if (!leadLane) return null

  const dominantFamilyLabel = gmailSemanticFamilyDisplayLabel(leadLane.family)
  const visibleSubtypeSenderCount = Math.min(leadLane.sender_count, leadSubtypeSenderCount(leadLane.top_subtypes))
  const unresolvedSenderCount = Math.max(0, leadLane.sender_count - visibleSubtypeSenderCount)
  const unresolvedFamilySharePct = Math.round(
    (unresolvedSenderCount / Math.max(leadLane.sender_count, 1)) * 100
  )
  const unresolvedGroupSharePct = Math.round(
    (unresolvedSenderCount / Math.max(rollup.sender_basis.sender_count, 1)) * 100
  )

  const patterns = leadLane.top_subtypes.slice(0, 3).map((entry) => {
    const pattern: CleanupGroupInternalPattern = {
      id: `${leadLane.family}:${entry.key}`,
      label: entry.label,
      semanticFamily: leadLane.family,
      semanticSubtype: entry.key,
      kind: 'subtype',
      senderCount: entry.sender_count,
      groupSharePct: Math.max(0, Math.min(entry.share_pct, 100)),
      familySharePct: Math.round(
        (entry.sender_count / Math.max(leadLane.sender_count, 1)) * 100
      ),
      tone: leadLane.subtype_persistence_state === 'survives' ? 'resolved' : 'provisional',
      guidance: '',
    }

    pattern.guidance = patternGuidance(clusterId, pattern)
    return pattern
  })

  const remainder =
    unresolvedSenderCount > 0
      ? {
          id: `${leadLane.family}:remainder`,
          label: `Broad ${dominantFamilyLabel.toLowerCase()} remainder`,
          semanticFamily: leadLane.family,
          semanticSubtype: 'remainder',
          kind: 'remainder' as const,
          senderCount: unresolvedSenderCount,
          groupSharePct: unresolvedGroupSharePct,
          familySharePct: unresolvedFamilySharePct,
          tone: 'unresolved' as const,
          guidance: '',
        }
      : null

  if (remainder) {
    remainder.guidance = patternGuidance(clusterId, remainder)
  }

  const summary =
    patterns.length > 0
      ? `${dominantFamilyLabel} leads this group at ${formatPercentLabel(
          leadLane.share_pct
        )}. ${listLabels(patterns.map((pattern) => pattern.label))} are the clearest patterns inside it.`
      : `${dominantFamilyLabel} leads this group at ${formatPercentLabel(
          leadLane.share_pct
        )}, and the visible traffic still sits mostly inside the broader family.`

  const howToStart = patterns.map((pattern) => pattern.guidance)
  if (remainder) {
    howToStart.push(remainder.guidance)
  }

  const intentionalRemainderNote = remainder
    ? cleanupGroupCanonicalId(clusterId) === 'semantic.marketing_subscriptions'
      ? 'A large portion is still broad promotional traffic and is intentionally grouped here.'
      : `Some senders still stay under the broader ${dominantFamilyLabel.toLowerCase()} label, and that is expected in this group.`
    : null

  return {
    dominantFamily: {
      key: leadLane.family,
      label: dominantFamilyLabel,
      senderCount: leadLane.sender_count,
      sharePct: leadLane.share_pct,
    },
    summary,
    patterns,
    remainder,
    howToStart,
    intentionalRemainderNote,
  }
}

function buildStructuralInternalStructure(
  clusterId: string,
  rollup: GmailSharedGroupSemanticRollup
): CleanupGroupInternalStructure | null {
  const familyLanes = rollup.family_distribution.filter((lane) => lane.sender_count > 0)
  if (familyLanes.length === 0) return null

  const leadLane = familyLanes[0]
  const dominantFamilyLabel = gmailSemanticFamilyDisplayLabel(leadLane.family)
  const patterns = familyLanes.slice(0, 3).map((lane) => {
    const pattern: CleanupGroupInternalPattern = {
      id: `family:${lane.family}`,
      label: gmailSemanticFamilyDisplayLabel(lane.family),
      semanticFamily: lane.family,
      semanticSubtype: null,
      kind: 'family',
      senderCount: lane.sender_count,
      groupSharePct: Math.max(0, Math.min(lane.share_pct, 100)),
      familySharePct: 100,
      tone: lane.umbrella ? 'provisional' : 'resolved',
      guidance: '',
    }
    pattern.guidance = patternGuidance(clusterId, pattern)
    return pattern
  })

  const summary =
    patterns.length > 1
      ? `${dominantFamilyLabel} is the biggest visible family at ${formatPercentLabel(
          leadLane.share_pct
        )}. ${listLabels(patterns.map((pattern) => pattern.label))} are the clearest descriptive lanes inside this parent.`
      : `${dominantFamilyLabel} is the biggest visible family at ${formatPercentLabel(
          leadLane.share_pct
        )}, but this parent still stays structurally framed rather than semantically split.`

  const canonicalClusterId = cleanupGroupCanonicalId(clusterId)
  const laneContext =
    canonicalClusterId === 'structural.backlog'
      ? 'Smaller families stay in the broader backlog lane until you want the full pass.'
      : canonicalClusterId === 'context.historical'
        ? 'Historical coverage stays compact here and does not become a normal review taxonomy.'
        : 'Smaller families stay in the broader structural lane until you want the full parent pass.'

  return {
    dominantFamily: {
      key: leadLane.family,
      label: dominantFamilyLabel,
      senderCount: leadLane.sender_count,
      sharePct: leadLane.share_pct,
    },
    summary,
    patterns,
    remainder: null,
    howToStart: patterns.map((pattern) => pattern.guidance),
    intentionalRemainderNote: laneContext,
  }
}

export function buildCleanupGroupInternalStructure(
  clusterId: string,
  rollup: GmailSharedGroupSemanticRollup | null
): CleanupGroupInternalStructure | null {
  if (!rollup) return null
  if (rollup.group_policy_mode === 'semantic_first') {
    return buildSemanticFirstInternalStructure(clusterId, rollup)
  }
  if (cleanupGroupCanonicalId(clusterId) === 'context.historical') return null
  return buildStructuralInternalStructure(clusterId, rollup)
}

function cleanupGroupDerivedReviewUnitHonestyLabel(
  kind: CleanupGroupDerivedReviewUnit['kind'],
  tone: CleanupGroupDerivedReviewUnit['tone']
): string {
  if (kind === 'remainder') return 'Broad remainder'
  if (kind === 'family') return 'Descriptive family lane'
  return tone === 'resolved' ? 'Subtype-backed' : 'Subtype-backed · provisional'
}

export function buildCleanupGroupDerivedReviewUnits(
  internalStructure: CleanupGroupInternalStructure | null
): CleanupGroupDerivedReviewUnit[] {
  if (!internalStructure) return []

  const units = internalStructure.patterns.map((pattern) => ({
    id: pattern.id,
    label: pattern.label,
    semanticFamily: pattern.semanticFamily,
    semanticSubtype: pattern.semanticSubtype,
    kind: pattern.kind,
    tone: pattern.tone,
    senderCount: pattern.senderCount,
    groupSharePct: pattern.groupSharePct,
    familySharePct: pattern.familySharePct,
    guidance: pattern.guidance,
    honestyLabel: cleanupGroupDerivedReviewUnitHonestyLabel(pattern.kind, pattern.tone),
  }))

  if (internalStructure.remainder) {
    units.push({
      id: internalStructure.remainder.id,
      label: internalStructure.remainder.label,
      semanticFamily: internalStructure.remainder.semanticFamily,
      semanticSubtype: internalStructure.remainder.semanticSubtype,
      kind: 'remainder',
      tone: internalStructure.remainder.tone,
      senderCount: internalStructure.remainder.senderCount,
      groupSharePct: internalStructure.remainder.groupSharePct,
      familySharePct: internalStructure.remainder.familySharePct,
      guidance: internalStructure.remainder.guidance,
      honestyLabel: cleanupGroupDerivedReviewUnitHonestyLabel(
        'remainder',
        internalStructure.remainder.tone
      ),
    })
  }

  return units
}

export function findCleanupGroupDerivedReviewUnit(
  units: CleanupGroupDerivedReviewUnit[],
  unitId: string | null | undefined
): CleanupGroupDerivedReviewUnit | null {
  if (!unitId) return null
  return units.find((unit) => unit.id === unitId) || null
}

export function recommendCleanupGroupDerivedReviewUnit(
  units: CleanupGroupDerivedReviewUnit[]
): CleanupGroupDerivedReviewUnit | null {
  return units[0] || null
}

function buildRecommendationCandidates<T>(params: {
  groups: T[]
  latestClusterId: string | null | undefined
  getClusterId: (group: T) => string
  getSenderCount: (group: T) => number | null | undefined
  getImpactCount: (group: T) => number | null | undefined
}) {
  return params.groups.map((group) => {
    const clusterId = params.getClusterId(group)
    const meta = cleanupGroupUiMeta(clusterId)
    return {
      group,
      clusterId,
      sectionId: meta.sectionId,
      senderCount: normalizedSenderCount(params.getSenderCount(group)),
      impactCount: normalizedImpactCount(params.getImpactCount(group)),
      isResumeTarget: Boolean(params.latestClusterId && clusterId === params.latestClusterId),
    }
  })
}

export function getCleanupGroupRecommendationExplanation(
  reason: CleanupGroupRecommendationReason
): CleanupGroupRecommendationCopy {
  if (reason === 'resume_work') {
    return {
      title: 'Resume saved work first',
      detail:
        'This group already has active draft work, so continuing it should outrank opening a brand-new semantic parent or structural lane.',
      bridgeDetail:
        'Cleanup Groups stays the full comparison surface, but the handoff should send you back to the group where work is already in motion.',
    }
  }
  if (reason === 'small_quick_win') {
    return {
      title: 'Smallest quick win in the semantic parents',
      detail:
        'This is the first visible semantic parent with a small enough sender scope to create momentum quickly.',
      bridgeDetail:
        'Cleanup Groups still owns the full comparison view. Mailbox Intelligence only points to the quickest clear semantic parent.',
    }
  }
  if (reason === 'backlog') {
    return {
      title: 'Backlog is the clearest remaining pass',
      detail:
        'The semantic parents are no longer the default path, so Backlog becomes the next deliberate structural pass.',
      bridgeDetail:
        'Cleanup Groups remains the full selection surface, while Mailbox Intelligence only points to the clearest remaining structural lane that is still meant for active work.',
    }
  }
  if (reason === 'none') {
    return {
      title: 'No default next group',
      detail:
        'Structural safety and context groups remain available, but they should not auto-recommend themselves as the default next step.',
      bridgeDetail: 'Open Cleanup Groups to choose from the remaining groups manually.',
    }
  }
  return {
    title: 'Biggest manageable semantic parent',
    detail:
      'This is the highest-impact visible semantic parent that still stays within the manageable sender-scope threshold.',
    bridgeDetail:
      'Cleanup Groups still owns the full comparison surface. Mailbox Intelligence only points to the strongest manageable next semantic parent.',
  }
}

export function buildCleanupGroupIntentSnapshotsForUi<T>(params: {
  groups: T[]
  getClusterId: (group: T) => string
  getSenderCount: (group: T) => number | null | undefined
  getImpactCount: (group: T) => number | null | undefined
}): Array<CleanupGroupIntentSnapshot<T>> {
  const candidates = buildRecommendationCandidates({
    groups: params.groups,
    latestClusterId: null,
    getClusterId: params.getClusterId,
    getSenderCount: params.getSenderCount,
    getImpactCount: params.getImpactCount,
  })
  const startHereCandidates = candidates.filter(
    (candidate) => candidate.sectionId === 'semantic_parents'
  )
  const quickStart =
    sortCleanupGroupsForUi(
      startHereCandidates.filter(
        (candidate) => candidate.senderCount != null && candidate.senderCount <= 150
      ),
      (candidate) => candidate.clusterId
    )[0] || null
  const manageableImpact =
    startHereCandidates
      .filter((candidate) => candidate.senderCount != null && candidate.senderCount <= 1000)
      .slice()
      .sort((left, right) => {
        const impactDelta = right.impactCount - left.impactCount
        if (impactDelta !== 0) return impactDelta
        return compareCleanupGroupsByUiOrder(left.clusterId, right.clusterId)
      })[0] || null
  const backlogReduction =
    sortCleanupGroupsForUi(
      candidates.filter(
        (candidate) => cleanupGroupCanonicalId(candidate.clusterId) === 'structural.backlog'
      ),
      (candidate) => candidate.clusterId
    )[0] || null

  return [
    {
      id: 'quick_start',
      title: 'Quickest start',
      description: 'Best first pass when you want momentum fast.',
      group: quickStart?.group || null,
    },
    {
      id: 'manageable_impact',
      title: 'Highest manageable impact',
      description: 'Best next lane when you want the strongest payoff without opening an endless pass.',
      group: manageableImpact?.group || null,
    },
    {
      id: 'backlog_reduction',
      title: 'Backlog-focused option',
      description: 'Best next lane when you want to reduce older buildup on purpose.',
      group: backlogReduction?.group || null,
    },
  ]
}

export function recommendCleanupGroupForUi<T>(params: {
  groups: T[]
  latestClusterId?: string | null
  getClusterId: (group: T) => string
  getSenderCount: (group: T) => number | null | undefined
  getImpactCount: (group: T) => number | null | undefined
}): { group: T | null; reason: CleanupGroupRecommendationReason } {
  const candidates = buildRecommendationCandidates({
    groups: params.groups,
    latestClusterId: params.latestClusterId,
    getClusterId: params.getClusterId,
    getSenderCount: params.getSenderCount,
    getImpactCount: params.getImpactCount,
  })

  const resumeTarget = candidates.find((candidate) => candidate.isResumeTarget)
  if (resumeTarget) {
    return { group: resumeTarget.group, reason: 'resume_work' }
  }

  const semanticParentCandidates = candidates.filter(
    (candidate) => candidate.sectionId === 'semantic_parents'
  )
  const smallQuickWin = sortCleanupGroupsForUi(
    semanticParentCandidates.filter(
      (candidate) => candidate.senderCount != null && candidate.senderCount <= 150
    ),
    (candidate) => candidate.clusterId
  )[0]
  if (smallQuickWin) {
    return { group: smallQuickWin.group, reason: 'small_quick_win' }
  }

  const manageableStartHere = semanticParentCandidates
    .filter((candidate) => candidate.senderCount != null && candidate.senderCount <= 1000)
    .slice()
    .sort((left, right) => {
      const impactDelta = right.impactCount - left.impactCount
      if (impactDelta !== 0) return impactDelta
      return compareCleanupGroupsByUiOrder(left.clusterId, right.clusterId)
    })[0]
  if (manageableStartHere) {
    return { group: manageableStartHere.group, reason: 'high_impact_manageable' }
  }

  const backlogTarget = sortCleanupGroupsForUi(
    candidates.filter(
      (candidate) => cleanupGroupCanonicalId(candidate.clusterId) === 'structural.backlog'
    ),
    (candidate) => candidate.clusterId
  )[0]
  if (backlogTarget) {
    return { group: backlogTarget.group, reason: 'backlog' }
  }

  return { group: null, reason: 'none' }
}

export function recommendArtifactCleanupGroupForUi(params: {
  groups: GmailMailboxIntelligenceData['cleanup_groups']
  latestClusterId?: string | null
}) {
  return recommendCleanupGroupForUi({
    groups: params.groups,
    latestClusterId: params.latestClusterId,
    getClusterId: (group) => group.cluster_id,
    getSenderCount: (group) => group.sender_count,
    getImpactCount: (group) => group.message_count,
  })
}

export function recommendRuntimeCleanupGroupForUi(params: {
  groups: GmailCleanupClusterRef[]
  latestClusterId?: string | null
}) {
  return recommendCleanupGroupForUi({
    groups: params.groups,
    latestClusterId: params.latestClusterId,
    getClusterId: (group) => group.clusterId,
    getSenderCount: (group) => group.senderCount ?? group.estimatedCount ?? null,
    getImpactCount: (group) => group.messageCount ?? group.estimatedCount ?? null,
  })
}
