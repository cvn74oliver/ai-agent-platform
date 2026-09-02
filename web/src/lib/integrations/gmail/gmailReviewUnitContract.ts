import {
  materializeReviewUnits,
  validateReviewUnitContract,
  type ReviewUnitAdapter,
  type ReviewUnitPartitionPathEntry,
  type ReviewUnitPartitionValue,
  type WorkspaceDecisionWorkflowBlueprint,
} from '@/lib/runtime/reviewUnitContract'
import { defineDecisionWorkspaceContract } from '@/lib/runtime/decisionWorkspaceContract'
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

export type GmailReviewUnitDimension =
  | 'subtype'
  | 'family'
  | 'pattern'
  | 'protection_reason'
  | 'exclusion_reason'
  | 'recency'
  | 'volume'

type GmailReviewUnitContext = {
  artifactCutoffAt: string
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

function recencyValue(timestamp: string | null, cutoffAt: string): ReviewUnitPartitionValue {
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
    return {
      key: '0_30_days',
      label: 'Active in the last 30 days',
      sourceKind: 'recency_band',
      unitRole: 'bounded_partition',
    }
  }
  if (days <= 90) {
    return {
      key: '31_90_days',
      label: 'Active 31–90 days ago',
      sourceKind: 'recency_band',
      unitRole: 'bounded_partition',
    }
  }
  if (days <= 365) {
    return {
      key: '91_365_days',
      label: 'Active 91–365 days ago',
      sourceKind: 'recency_band',
      unitRole: 'bounded_partition',
    }
  }
  return {
    key: 'over_365_days',
    label: 'Inactive for over 365 days',
    sourceKind: 'recency_band',
    unitRole: 'bounded_partition',
  }
}

function volumeValue(messageCount: number): ReviewUnitPartitionValue {
  const count = Number.isFinite(messageCount) ? Math.max(0, Math.floor(messageCount)) : 0
  if (count <= 1) {
    return {
      key: '1_message',
      label: '1 supporting message',
      sourceKind: 'volume_band',
      unitRole: 'bounded_partition',
    }
  }
  if (count <= 5) {
    return {
      key: '2_5_messages',
      label: '2–5 supporting messages',
      sourceKind: 'volume_band',
      unitRole: 'bounded_partition',
    }
  }
  if (count <= 20) {
    return {
      key: '6_20_messages',
      label: '6–20 supporting messages',
      sourceKind: 'volume_band',
      unitRole: 'bounded_partition',
    }
  }
  return {
    key: 'over_20_messages',
    label: 'Over 20 supporting messages',
    sourceKind: 'volume_band',
    unitRole: 'bounded_partition',
  }
}

function valueForDimension(params: {
  dimension: GmailReviewUnitDimension
  sender: GmailReviewUnitSeed
  cutoffAt: string
}): ReviewUnitPartitionValue {
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
  if (params.dimension === 'recency') {
    return recencyValue(sender.lastActivityAt, params.cutoffAt)
  }
  return volumeValue(sender.messageCount)
}

function dimensionsForBasis(
  basis: GmailCleanupGroupReviewUnitBasis
): GmailReviewUnitDimension[] {
  if (basis === 'subtype-first') return ['subtype', 'pattern', 'recency', 'volume']
  if (basis === 'protection-reason-first') {
    return ['protection_reason', 'family', 'subtype', 'pattern', 'recency', 'volume']
  }
  if (basis === 'exclusion-reason-first') {
    return ['exclusion_reason', 'family', 'subtype', 'pattern', 'recency', 'volume']
  }
  return ['family', 'subtype', 'pattern', 'recency', 'volume']
}

export function gmailCleanupDecisionWorkflowBlueprint(
  basis: GmailCleanupGroupReviewUnitBasis
): WorkspaceDecisionWorkflowBlueprint<GmailReviewUnitDimension> {
  return defineDecisionWorkspaceContract({
    schemaVersion: 1,
    workspaceType: 'gmail',
    workflowId: 'mailbox_cleanup',
    workflowDefinition: {
      definitionId: 'builtin.gmail.mailbox_cleanup',
      version: '1',
      source: 'builtin_compatibility',
      publicationStatus: 'published',
    },
    sources: [
      {
        id: 'gmail.primary',
        providerType: 'gmail',
        role: 'primary',
        requiredCapabilities: [
          'gmail.archive_messages',
          'gmail.quarantine_sender',
          'gmail.unsubscribe_sender',
          'gmail.create_rule',
        ],
      },
    ],
    universe: { type: 'mailbox', label: 'Mailbox' },
    decisionSubject: {
      type: 'sender',
      singularLabel: 'Sender',
      pluralLabel: 'Senders',
    },
    activity: {
      type: 'message',
      singularLabel: 'Message',
      pluralLabel: 'Messages',
      occurredAtField: 'internal_date',
      primaryMetricId: 'supporting_message_count',
    },
    metrics: [
      {
        id: 'supporting_message_count',
        label: 'Supporting messages',
        valueType: 'count',
        unit: 'messages',
        aggregation: 'sum',
        direction: 'context_only',
        timeBasis: 'event_time',
        crossSource: { mode: 'same_definition_only' },
      },
      {
        id: 'active_sender_count',
        label: 'Active senders',
        valueType: 'count',
        unit: 'senders',
        aggregation: 'distinct_count',
        direction: 'context_only',
        timeBasis: 'event_time',
        crossSource: { mode: 'same_definition_only' },
      },
    ],
    entityLinks: [],
    evidenceKinds: [
      'semantic_family',
      'semantic_subtype',
      'semantic_pattern',
      'last_activity',
      'supporting_message_count',
      'assignment_reason',
      'exclusion_reason',
    ],
    evidencePolicy: {
      requiresSourceRecord: true,
      requiresObservedAt: true,
      requiresIngestedAt: true,
      requiresFreshness: true,
      requiresQuality: true,
      requiresTransformationVersion: true,
    },
    recommendationPolicy: {
      requiresRationale: true,
      requiresEvidence: true,
      requiresConfidence: true,
      requiresExpectedImpact: true,
      supportsAlternatives: true,
      requiresExpiryOrReevaluation: true,
    },
    actions: [
      {
        id: 'keep',
        label: 'Always keep',
        capability: 'decision.keep',
        effect: 'decision_only',
        risk: 'low',
        reversibility: 'not_applicable',
        approval: 'none',
        supportsPreview: false,
        idempotencyRequired: false,
      },
      {
        id: 'archive',
        label: 'Archive automatically',
        capability: 'gmail.archive_messages',
        effect: 'provider_write',
        risk: 'medium',
        reversibility: 'reversible',
        approval: 'policy',
        supportsPreview: true,
        idempotencyRequired: true,
      },
      {
        id: 'quarantine',
        label: 'Quarantine',
        capability: 'gmail.quarantine_sender',
        effect: 'provider_write',
        risk: 'high',
        reversibility: 'reversible',
        approval: 'always',
        supportsPreview: true,
        idempotencyRequired: true,
      },
      {
        id: 'unsubscribe',
        label: 'Unsubscribe',
        capability: 'gmail.unsubscribe_sender',
        effect: 'provider_write',
        risk: 'high',
        reversibility: 'compensating_action',
        approval: 'always',
        supportsPreview: true,
        idempotencyRequired: true,
      },
      {
        id: 'custom_rule',
        label: 'Create custom rule',
        capability: 'gmail.create_rule',
        effect: 'provider_write',
        risk: 'medium',
        reversibility: 'reversible',
        approval: 'policy',
        supportsPreview: true,
        idempotencyRequired: true,
      },
    ],
    reviewUnits: {
      dimensions: dimensionsForBasis(basis),
      sizing: {
        targetMin: GMAIL_REVIEW_UNIT_TARGET_MIN,
        targetMax: GMAIL_REVIEW_UNIT_TARGET_MAX,
        hardMax: GMAIL_REVIEW_UNIT_HARD_MAX,
      },
    },
    governance: {
      proprietaryBrain: {
        kind: 'versioned_knowledge_and_memory',
        ownership: 'tenant',
        privacy: 'private',
        provenance: 'required',
        feedbackCapture: 'required',
        foundationModelTraining: 'excluded',
      },
      sharedLearning: 'disabled',
      auditTrail: 'required',
      sopVersionReference: 'required',
    },
  })
}

function compatibilityUnitId(
  parentId: string,
  path: ReviewUnitPartitionPathEntry[]
): string | null {
  if (
    !MARKETING_PARENT_IDS.has(parentId) ||
    path.length !== 1 ||
    path[0].dimension !== 'subtype'
  ) {
    return null
  }
  const key = path[0].key
  if (key === 'marketing_promotional_remainder') {
    return 'family:marketing_promotional:remainder'
  }
  if (key === 'non_promotional_spillover') return 'family:spillover'
  return `family:${key}`
}

function unitLabel(
  path: ReviewUnitPartitionPathEntry[],
  duplicateLabels: Set<string>
): string {
  const last = path[path.length - 1]
  if (!last) return 'All senders'
  if (!duplicateLabels.has(last.label)) return last.label
  return path.map((entry) => entry.label).join(' · ')
}

function gmailReviewUnitAdapter(
  basis: GmailCleanupGroupReviewUnitBasis
): ReviewUnitAdapter<GmailReviewUnitSeed, GmailReviewUnitContext, GmailReviewUnitDimension> {
  return {
    adapterId: 'gmail_sender_cleanup',
    blueprint: gmailCleanupDecisionWorkflowBlueprint(basis),
    entityId: (sender) => sender.senderKey,
    partitionValue: ({ dimension, entity, context }) =>
      valueForDimension({
        dimension,
        sender: entity,
        cutoffAt: context.artifactCutoffAt,
      }),
    compatibilityUnitId: ({ parentId, path }) => compatibilityUnitId(parentId, path),
    unitLabel: ({ path, duplicateTerminalLabels }) =>
      unitLabel(path, duplicateTerminalLabels),
  }
}

export function materializeGmailReviewUnits(params: {
  parentId: string
  parentLabel: string
  basis: GmailCleanupGroupReviewUnitBasis
  actionable: boolean
  artifactCutoffAt: string
  senders: GmailReviewUnitSeed[]
}): GmailMaterializedReviewUnitPlan {
  const materialized = materializeReviewUnits({
    parentId: params.parentId,
    parentLabel: params.parentLabel,
    actionable: params.actionable,
    entities: params.senders,
    context: { artifactCutoffAt: params.artifactCutoffAt },
    adapter: gmailReviewUnitAdapter(params.basis),
  })
  return {
    basis: params.basis,
    units: materialized.units.map(
      (unit) =>
        ({
          unit_id: unit.unitId,
          label: unit.label,
          source_kind: unit.sourceKind as GmailCleanupGroupReviewUnit['source_kind'],
          source_key: unit.sourceKey,
          sender_count: unit.entityCount,
          share_pct: unit.sharePct,
          unit_role: unit.unitRole as GmailCleanupGroupReviewUnit['unit_role'],
          decomposition_path: unit.decompositionPath,
          publication_status: unit.publicationStatus,
        }) satisfies GmailCleanupGroupReviewUnit
    ),
    reviewUnitIdBySenderKey: materialized.reviewUnitIdByEntityId,
  }
}

export function validateGmailReviewUnitContract(params: {
  parentId: string
  actionable: boolean
  parentSenderKeys: string[]
  units: GmailCleanupGroupReviewUnit[]
  reviewUnitIdBySenderKey: Map<string, string>
}): GmailReviewUnitContractValidation {
  const validation = validateReviewUnitContract({
    parentId: params.parentId,
    actionable: params.actionable,
    parentEntityIds: params.parentSenderKeys,
    units: params.units.map((unit) => ({
      unitId: unit.unit_id,
      label: unit.label,
      sourceKind: unit.source_kind,
      sourceKey: unit.source_key,
      entityCount: unit.sender_count,
      sharePct: unit.share_pct,
      unitRole: unit.unit_role,
      decompositionPath: unit.decomposition_path || [],
      publicationStatus: 'materialized' as const,
    })),
    reviewUnitIdByEntityId: params.reviewUnitIdBySenderKey,
    hardMax: GMAIL_REVIEW_UNIT_HARD_MAX,
  })
  return {
    errors: validation.errors,
    parentSenderCount: validation.parentEntityCount,
    assignedSenderCount: validation.assignedEntityCount,
    uniqueAssignedSenderCount: validation.uniqueAssignedEntityCount,
    largestUnitSenderCount: validation.largestUnitEntityCount,
  }
}
