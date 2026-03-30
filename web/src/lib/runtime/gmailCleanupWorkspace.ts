import {
  normalizeOperationsAnalysisScope,
  type OperationsAnalysisScope,
  type OperationsInboxAnalysisRequestContext,
} from '@/lib/runtime/operationsWorkspace'
import {
  listCleanupClusterIdentityKeys,
  resolveCleanupClusterIdentity,
  type CleanupClusterIdentitySource,
} from '@/lib/runtime/gmailCleanupClusterIdentity'

export const GMAIL_CLEANUP_STAGES = [
  'senders',
  'exceptions',
  'confirmation',
  'rules',
  'monitoring',
] as const

export type GmailCleanupStage = (typeof GMAIL_CLEANUP_STAGES)[number]

export const GMAIL_CLEANUP_ACTIVE_STAGES = ['senders', 'confirmation'] as const
export const GMAIL_CLEANUP_PLACEHOLDER_STAGES = ['exceptions', 'rules', 'monitoring'] as const

export const GMAIL_SENDER_POLICIES = [
  'undecided',
  'keep',
  'archive',
  'quarantine',
  'unsubscribe',
  'custom_rule',
] as const

export type GmailSenderPolicy = (typeof GMAIL_SENDER_POLICIES)[number]

export const GMAIL_SENDER_WORKSPACE_FILTERS = [
  'all',
  'needs_verification',
  'protected',
  'likely_machine_generated',
  'likely_human',
] as const

export type GmailSenderWorkspaceFilter = (typeof GMAIL_SENDER_WORKSPACE_FILTERS)[number]

export const GMAIL_SENDER_WORKSPACE_SORTS = [
  'message_count',
  'sender',
  'unread_count',
  'last_activity',
] as const

export type GmailSenderWorkspaceSort = (typeof GMAIL_SENDER_WORKSPACE_SORTS)[number]

export const GMAIL_SENDER_WORKSPACE_SORT_DIRECTIONS = ['asc', 'desc'] as const

export type GmailSenderWorkspaceSortDirection =
  (typeof GMAIL_SENDER_WORKSPACE_SORT_DIRECTIONS)[number]

export type GmailSenderWorkspaceSemanticFocus = {
  family: GmailSemanticFamily
  kind: 'family' | 'subtype' | 'remainder'
  subtypeKey: string | null
  surfacedSubtypeKeys: string[]
}

export const GMAIL_CANONICAL_SENDER_CATEGORY_LABELS = [
  'Promotions',
  'Social',
  'Updates',
  'Forums',
  'Primary',
  'Uncategorized',
] as const

export type GmailCanonicalSenderCategoryLabel =
  (typeof GMAIL_CANONICAL_SENDER_CATEGORY_LABELS)[number]

export const GMAIL_SENDER_CATEGORY_PROFILE_MODES = [
  'dominant',
  'mixed',
  'uncategorized',
  'insufficient_data',
] as const

export type GmailSenderCategoryProfileMode =
  (typeof GMAIL_SENDER_CATEGORY_PROFILE_MODES)[number]

export const GMAIL_DOMINANT_CATEGORY_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const

export type GmailDominantCategoryConfidence =
  (typeof GMAIL_DOMINANT_CATEGORY_CONFIDENCE_LEVELS)[number]

export const GMAIL_OPERATOR_PROFILE_FAMILIES = [
  'marketing_promotional',
  'commerce_transactional',
  'account_notification',
  'security_alert',
  'social_community',
  'human_personal',
  'mixed_behavior',
  'insufficient_data',
] as const

export type GmailOperatorProfileFamily =
  (typeof GMAIL_OPERATOR_PROFILE_FAMILIES)[number]

export const GMAIL_OPERATOR_PROFILE_MODES = ['clear', 'mixed', 'insufficient_data'] as const

export type GmailOperatorProfileMode =
  (typeof GMAIL_OPERATOR_PROFILE_MODES)[number]

export const GMAIL_OPERATOR_PROFILE_SOURCES = [
  'sender_global_operator_profile_v1',
  'insufficient_data',
] as const

export type GmailOperatorProfileSource =
  (typeof GMAIL_OPERATOR_PROFILE_SOURCES)[number]

export const GMAIL_SEMANTIC_FAMILIES = [
  'marketing_promotional',
  'commerce_transactional',
  'account_notification',
  'security_alert',
  'social_community',
  'human_personal',
] as const

export type GmailSemanticFamily = (typeof GMAIL_SEMANTIC_FAMILIES)[number]

export const GMAIL_SEMANTIC_PATTERN_CLASSES = [
  'promotional_cycle',
  'transactional_cycle',
  'service_update_cycle',
  'security_cycle',
  'social_activity_cycle',
  'human_correspondence_cycle',
] as const

export type GmailSemanticPatternClass = (typeof GMAIL_SEMANTIC_PATTERN_CLASSES)[number]

export const GMAIL_SEMANTIC_RESOLUTIONS = ['clear', 'mixed', 'thin_history'] as const

export type GmailSemanticResolution = (typeof GMAIL_SEMANTIC_RESOLUTIONS)[number]

export const GMAIL_SEMANTIC_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const

export type GmailSemanticConfidence = (typeof GMAIL_SEMANTIC_CONFIDENCE_LEVELS)[number]

export const GMAIL_SEMANTIC_DECOMPOSITION_STATUSES = [
  'not_applicable',
  'candidate',
  'resolved',
  'deferred',
] as const

export type GmailSemanticDecompositionStatus =
  (typeof GMAIL_SEMANTIC_DECOMPOSITION_STATUSES)[number]

export const GMAIL_SEMANTIC_FAMILY_PROVENANCES = [
  'operator_profile_compat',
  'ranked_evidence_compat',
  'artifact_seed_compat',
] as const

export type GmailSemanticFamilyProvenance =
  (typeof GMAIL_SEMANTIC_FAMILY_PROVENANCES)[number]

export const GMAIL_SEMANTIC_PATTERN_PROVENANCES = [
  'pattern_label_compat',
  'ranked_evidence_compat',
  'subject_heuristic',
  'artifact_seed_compat',
] as const

export type GmailSemanticPatternProvenance =
  (typeof GMAIL_SEMANTIC_PATTERN_PROVENANCES)[number]

export const GMAIL_SEMANTIC_GROUP_POLICY_MODES = [
  'structural_only',
  'structural_backlog',
  'semantic_first',
] as const

export type GmailSemanticGroupPolicyMode =
  (typeof GMAIL_SEMANTIC_GROUP_POLICY_MODES)[number]

export const GMAIL_SEMANTIC_SUBTYPE_PERSISTENCE_STATES = [
  'suppressed',
  'provisional',
  'survives',
] as const

export type GmailSemanticSubtypePersistenceState =
  (typeof GMAIL_SEMANTIC_SUBTYPE_PERSISTENCE_STATES)[number]

export const GMAIL_CLEANUP_GROUP_SURFACE_TIERS = [
  'featured_parent',
  'collapsed_parent',
  'secondary',
] as const

export type GmailCleanupGroupSurfaceTier =
  (typeof GMAIL_CLEANUP_GROUP_SURFACE_TIERS)[number]

export const GMAIL_CLEANUP_GROUP_SURFACE_KINDS = [
  'semantic_parent',
  'backlog_parent',
  'structural_parent',
  'historical_parent',
  'secondary_candidate',
] as const

export type GmailCleanupGroupSurfaceKind =
  (typeof GMAIL_CLEANUP_GROUP_SURFACE_KINDS)[number]

export const GMAIL_CLEANUP_GROUP_SURFACE_VISIBILITIES = ['visible'] as const

export type GmailCleanupGroupSurfaceVisibility =
  (typeof GMAIL_CLEANUP_GROUP_SURFACE_VISIBILITIES)[number]

export const GMAIL_CLEANUP_GROUP_PROMOTION_STATUSES = [
  'promoted',
  'demoted_small',
  'demoted_mixed',
  'demoted_low_operator_value',
  'demoted_cap_exceeded',
  'structural_lane',
  'secondary_visible',
  'unresolved',
] as const

export type GmailCleanupGroupPromotionStatus =
  (typeof GMAIL_CLEANUP_GROUP_PROMOTION_STATUSES)[number]

export const GMAIL_CLEANUP_GROUP_OPERATOR_VALUE_STATUSES = [
  'strong',
  'low',
  'not_applicable',
] as const

export type GmailCleanupGroupOperatorValueStatus =
  (typeof GMAIL_CLEANUP_GROUP_OPERATOR_VALUE_STATUSES)[number]

export const GMAIL_CLEANUP_GROUP_REVIEW_UNIT_BASES = [
  'selected_axis_dominant_lane',
  'structural_lane',
  'secondary_group',
  'not_promoted',
] as const

export type GmailCleanupGroupReviewUnitBasis =
  (typeof GMAIL_CLEANUP_GROUP_REVIEW_UNIT_BASES)[number]

export type GmailCleanupGroupSemanticAxis = 'family' | 'pattern'

export type GmailCleanupGroupReviewUnit = {
  unit_id: string
  label: string
  source_kind:
    | 'family_subtype'
    | 'pattern_subtype'
    | 'family_remainder'
    | 'pattern_remainder'
    | 'spillover'
  source_key: string
  sender_count: number
  share_pct: number
  unit_role: 'subtype' | 'dominant_remainder' | 'spillover'
}

export type GmailSemanticDecompositionMetadata = {
  umbrella: boolean
  decomposition_status: GmailSemanticDecompositionStatus
  subtype_key: string | null
  subtype_label: string | null
  decomposition_path: string | null
}

export type GmailResolvedSemanticFamily = GmailSemanticDecompositionMetadata & {
  family: GmailSemanticFamily
  resolution: GmailSemanticResolution
  confidence: GmailSemanticConfidence
  provenance: GmailSemanticFamilyProvenance
}

export type GmailResolvedSemanticPattern = GmailSemanticDecompositionMetadata & {
  pattern_class: GmailSemanticPatternClass
  resolution: GmailSemanticResolution
  confidence: GmailSemanticConfidence
  provenance: GmailSemanticPatternProvenance
}

export const GMAIL_CATEGORY_SUMMARY_SOURCES = [
  'sender_global_category_distribution',
  'uncategorized',
  'insufficient_data',
  'signal_category_mix',
  'selected_cluster_row_categories',
  'pattern_fallback',
] as const

export type GmailCategorySummarySource = (typeof GMAIL_CATEGORY_SUMMARY_SOURCES)[number]

export const GMAIL_CLEANUP_EXCLUSION_REASONS = [
  'no_inbox_rows',
  'no_safe_rows',
  'too_few_safe_rows',
  'safe_ratio_too_low',
  'protected_human_sender',
  'protected_human_dominant',
  'score_below_threshold',
  'no_cluster_match',
] as const

export type GmailCleanupExclusionReason = (typeof GMAIL_CLEANUP_EXCLUSION_REASONS)[number]

export const GMAIL_ASSIGNED_CLEANUP_GROUP_IDS = [
  'subscription-senders',
  'retail-commerce-senders',
  'social-platform-senders',
  'system-notification-senders',
  'dormant-backlog-senders',
  'protected-trusted-senders',
  'historical-out-of-inbox-senders',
  'needs-review-senders',
] as const

export type GmailAssignedCleanupGroupId =
  (typeof GMAIL_ASSIGNED_CLEANUP_GROUP_IDS)[number]

export const GMAIL_CLEANUP_ASSIGNMENT_REASONS = [
  'protected_signal_override',
  'protected_legacy_protected_human_sender',
  'protected_legacy_protected_human_dominant',
  'historical_no_inbox_rows',
  'behavioral_safe_rows',
  'behavioral_broader_rows',
  'needs_review_no_safe_rows',
  'needs_review_too_few_safe_rows',
  'needs_review_safe_ratio_too_low',
  'needs_review_score_below_threshold',
  'needs_review_no_cluster_match',
  'needs_review_unclassified',
] as const

export type GmailCleanupAssignmentReason =
  (typeof GMAIL_CLEANUP_ASSIGNMENT_REASONS)[number]

export type GmailCleanupClusterRef = {
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[]
  sourceClusterIds?: string[]
  clusterType: string
  title: string
  query: string
  whySelected?: string | null
  riskNote?: string | null
  safetyNote?: string | null
  senderCount?: number | null
  messageCount?: number | null
  estimatedCount?: number | null
  surfaceTier?: GmailCleanupGroupSurfaceTier | null
  surfaceKind?: GmailCleanupGroupSurfaceKind | null
  surfaceVisibility?: GmailCleanupGroupSurfaceVisibility | null
  topLevelRank?: number | null
}

export type GmailCleanupWorkflowIdentity = {
  canonicalClusterId: string
  reviewUnitKey: string | null
}

export type GmailCleanupWorkflowClusterPayload = {
  clusterId: string
  canonicalClusterId: string
  reviewUnitKey: string | null
  legacyClusterIds: string[]
  sourceClusterIds: string[]
  clusterType: string
  title: string
  query: string
}

export type GmailNormalizedWorkflowTarget = {
  identity: GmailCleanupWorkflowIdentity
  metadata: {
    clusterType: string
    title: string
    query: string
  }
  compat: {
    requestedClusterId: string | null
    legacyClusterIds: string[]
    sourceClusterIds: string[]
  }
}

export type GmailScopeLadderCounts = {
  whole_mailbox: number
  cleanup_candidate_universe: number
  cleanup_group: number
  sender_set: number
  loaded_preview_rows: number
}

export type GmailCleanupPreviewMessage = {
  message_id: string
  thread_id?: string
  history_id?: string
  internal_date_ms?: number
  subject: string | null
  from: string | null
  date: string | null
  snippet: string | null
  label_ids?: string[]
  category_labels?: string[]
  is_in_inbox?: boolean
  is_unread?: boolean
  is_important?: boolean
  is_starred?: boolean
}

export type GmailPressureTimelineComposition = {
  label: string
  count: number
  share_pct: number
}

export type GmailPressureTimelineEvidenceSignal = {
  label: string
  count: number
  share_pct: number
  exactness: 'actual' | 'inferred'
}

export type GmailSenderCategoryDistributionEntry = {
  label: GmailCanonicalSenderCategoryLabel
  count: number
  share_pct: number
}

export type GmailSenderPatternMixEntry = {
  pattern: string
  count: number
  share_pct: number
}

/** @deprecated Use `GmailResolvedSemanticFamily` and `GmailResolvedSemanticPattern` on sender records. */
export type GmailSenderOperatorProfile = {
  /** @deprecated Use `semantic_family.family`. */
  operator_profile_family: GmailOperatorProfileFamily
  /** @deprecated Use `semantic_family.resolution`. */
  operator_profile_mode: GmailOperatorProfileMode
  /** @deprecated Use `semantic_family.confidence`. */
  operator_profile_confidence: GmailDominantCategoryConfidence | null
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_summary: string
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_reasons: string[]
  /** @deprecated Use `semantic_family.provenance`. */
  operator_profile_source: GmailOperatorProfileSource
}

export type GmailSenderWorkspaceOperatorProfileFamilyDistributionEntry = {
  family: GmailOperatorProfileFamily
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceDominantPatternDistributionEntry = {
  pattern: string
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceOperatorProfileModeDistributionEntry = {
  mode: GmailOperatorProfileMode
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceCategorySummarySourceDistributionEntry = {
  source: GmailCategorySummarySource
  sender_count: number
  share_pct: number
}

export type GmailSemanticRollupSubtypeEntry = {
  key: string
  label: string
  decomposition_path: string | null
  sender_count: number
  share_pct: number
  umbrella: boolean
  decomposition_status: GmailSemanticDecompositionStatus
}

export type GmailSenderWorkspaceSemanticFamilyDistributionEntry = {
  family: GmailSemanticFamily
  sender_count: number
  share_pct: number
  umbrella: boolean
  resolved_subtype_sender_count: number
  provisional_subtype_sender_count: number
  top_subtypes: GmailSemanticRollupSubtypeEntry[]
}

export type GmailSenderWorkspaceSemanticPatternDistributionEntry = {
  pattern_class: GmailSemanticPatternClass
  sender_count: number
  share_pct: number
  resolved_subtype_sender_count: number
  provisional_subtype_sender_count: number
  top_subtypes: GmailSemanticRollupSubtypeEntry[]
}

export type GmailSenderWorkspaceSemanticResolutionDistributionEntry = {
  scope: 'family' | 'pattern'
  resolution: GmailSemanticResolution
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceSemanticConfidenceDistributionEntry = {
  scope: 'family' | 'pattern'
  confidence: GmailSemanticConfidence
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceSemanticProvenanceDistributionEntry = {
  scope: 'family' | 'pattern'
  provenance: GmailSemanticFamilyProvenance | GmailSemanticPatternProvenance
  sender_count: number
  share_pct: number
}

export type GmailSenderWorkspaceSemanticUmbrellaDistributionEntry = {
  scope: 'family' | 'pattern'
  bucket: 'umbrella' | 'non_umbrella'
  sender_count: number
  share_pct: number
}

export type GmailSharedGroupSemanticRollupFamilyLane = {
  family: GmailSemanticFamily
  sender_count: number
  share_pct: number
  umbrella: boolean
  resolved_subtype_sender_count: number
  resolved_subtype_coverage_pct: number
  provisional_subtype_sender_count: number
  provisional_subtype_coverage_pct: number
  subtype_persistence_state: GmailSemanticSubtypePersistenceState
  decomposition_review_required: boolean
  top_subtypes: GmailSemanticRollupSubtypeEntry[]
}

export type GmailSharedGroupSemanticRollupPatternLane = {
  pattern_class: GmailSemanticPatternClass
  sender_count: number
  share_pct: number
  resolved_subtype_sender_count: number
  resolved_subtype_coverage_pct: number
  provisional_subtype_sender_count: number
  provisional_subtype_coverage_pct: number
  subtype_persistence_state: GmailSemanticSubtypePersistenceState
  decomposition_review_required: boolean
  top_subtypes: GmailSemanticRollupSubtypeEntry[]
}

export type GmailSharedGroupSemanticRollup = {
  group_policy_mode: GmailSemanticGroupPolicyMode
  sender_basis: {
    sender_count: number
    message_count: number
    uncertain_sender_count: number
    uncertain_sender_share_pct: number
  }
  headline: {
    dominant_semantic_family: GmailSemanticFamily | null
    dominant_semantic_pattern: GmailSemanticPatternClass | null
    family_subtype_persistence_state: GmailSemanticSubtypePersistenceState | null
    pattern_subtype_persistence_state: GmailSemanticSubtypePersistenceState | null
  }
  family_distribution: GmailSharedGroupSemanticRollupFamilyLane[]
  pattern_distribution: GmailSharedGroupSemanticRollupPatternLane[]
  trust: {
    resolution_distribution: GmailSenderWorkspaceSemanticResolutionDistributionEntry[]
    confidence_distribution: GmailSenderWorkspaceSemanticConfidenceDistributionEntry[]
    provenance_distribution: GmailSenderWorkspaceSemanticProvenanceDistributionEntry[]
    umbrella_distribution: GmailSenderWorkspaceSemanticUmbrellaDistributionEntry[]
    summary: {
      family_clear_share_pct: number
      pattern_clear_share_pct: number
      family_low_confidence_share_pct: number
      pattern_low_confidence_share_pct: number
      family_umbrella_share_pct: number
      pattern_umbrella_share_pct: number
    }
  }
  surface: {
    tier: GmailCleanupGroupSurfaceTier
    kind: GmailCleanupGroupSurfaceKind
    visibility: GmailCleanupGroupSurfaceVisibility
    top_level_rank: number | null
    canonical_cluster_id: string
    legacy_cluster_ids: string[]
    source_cluster_ids: string[]
  }
  promotion: {
    status: GmailCleanupGroupPromotionStatus
    selected_axis: GmailCleanupGroupSemanticAxis | null
    reason_codes: string[]
    operator_value_status: GmailCleanupGroupOperatorValueStatus
    metrics: {
      sender_count: number
      dominant_share_pct: number
      clear_share_pct: number
      actionable_review_unit_count: number
      largest_review_unit_sender_count: number
    }
  }
  review_unit_plan: {
    required: boolean
    basis: GmailCleanupGroupReviewUnitBasis
    trigger_reason: string | null
    units: GmailCleanupGroupReviewUnit[]
  }
  completeness: {
    canonical: true
    runtime_repair_expected: false
  }
}

export type GmailPressureTimelineBucket = {
  label: string
  count: number
  composition?: GmailPressureTimelineComposition[]
  evidence_signals?: GmailPressureTimelineEvidenceSignal[]
}

export const GMAIL_PRESSURE_TREND_WINDOWS = [
  'all_indexed',
  'last_year',
  'last_quarter',
  'last_month',
  'last_week',
  'last_day',
  'custom',
] as const

export type GmailPressureTrendWindow = (typeof GMAIL_PRESSURE_TREND_WINDOWS)[number]

export const GMAIL_PRESSURE_TREND_GROUPINGS = [
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
] as const

export type GmailPressureTrendGrouping = (typeof GMAIL_PRESSURE_TREND_GROUPINGS)[number]

export type GmailPressureTrendBucket = GmailPressureTimelineBucket & {
  bucket_start_at: string
  bucket_end_at: string
}

export type GmailPressureTrendData = {
  window: {
    key: GmailPressureTrendWindow
    label: string
    requested_start: string | null
    requested_end: string | null
    effective_start: string | null
    effective_end: string | null
    limited_by_indexed_coverage: boolean
  }
  grouping: {
    key: GmailPressureTrendGrouping
    label: string
  }
  indexed_coverage: {
    indexed_total_rows: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
  }
  time_zone: string
  series: GmailPressureTrendBucket[]
  source: 'gmail_index_cache'
}

export type GmailMailboxIntelligenceData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  whole_mailbox: {
    message_count: number
    sender_count: number
    indexed_inbox_rows: number
    indexed_date_span_start: string | null
    indexed_date_span_end: string | null
    top_senders: Array<{
      sender: string
      sender_key: string
      message_count: number
      share_pct: number
    }>
    sender_volume_distribution: Array<{
      label: string
      sender_count: number
    }>
    activity_timeline: GmailPressureTimelineBucket[]
    activity_timeline_granularity: 'week' | 'month'
    category_breakdown: Array<{
      label: string
      count: number
    }>
    human_vs_automation: Array<{
      label: string
      count: number
      exactness: 'inferred'
    }>
  }
  cleanup_candidate_universe: {
    message_count: number
    sender_count: number
    cleanup_date_span_start: string | null
    cleanup_date_span_end: string | null
    top_senders: Array<{
      sender: string
      sender_key: string
      message_count: number
      share_pct: number
    }>
    sender_volume_distribution: Array<{
      label: string
      sender_count: number
    }>
    activity_timeline: GmailPressureTimelineBucket[]
    activity_timeline_granularity: 'week' | 'month'
    category_breakdown: Array<{
      label: string
      count: number
    }>
    human_vs_automation: Array<{
      label: string
      count: number
      exactness: 'inferred'
    }>
  }
  protected_safe_context: {
    protected_message_count: number
    protected_sender_count: number
    likely_human_message_count: number
    likely_human_sender_count: number
    caution_candidate_message_count: number
    low_risk_candidate_message_count: number
    summary: string
  }
  cleanup_groups: Array<{
    cluster_id: string
    canonical_cluster_id: string
    legacy_cluster_ids: string[]
    source_cluster_ids: string[]
    cluster_type: string
    title: string
    query: string
    why_selected: string
    risk_note: string
    safety_note: string
    message_count: number
    sender_count: number
    share_pct: number
    dominant_sender: string | null
    dominant_semantic_family: GmailSemanticFamily | null
    dominant_semantic_pattern: GmailSemanticPatternClass | null
    dominant_pattern: string | null
    protected_message_count: number
    uncertain_sender_count: number
    surface_tier: GmailCleanupGroupSurfaceTier
    surface_kind: GmailCleanupGroupSurfaceKind
    surface_visibility: GmailCleanupGroupSurfaceVisibility
    top_level_rank: number | null
    promotion_status: GmailCleanupGroupPromotionStatus
    selected_semantic_axis: GmailCleanupGroupSemanticAxis | null
    operator_value_status: GmailCleanupGroupOperatorValueStatus
    review_units_required: boolean
    review_unit_basis: GmailCleanupGroupReviewUnitBasis
    review_unit_count: number
    semantic_rollup_schema_version: number | null
    semantic_rollup_hash: string | null
    semantic_rollup: GmailSharedGroupSemanticRollup | null
    semantic_family_distribution: GmailSenderWorkspaceSemanticFamilyDistributionEntry[]
    semantic_pattern_distribution: GmailSenderWorkspaceSemanticPatternDistributionEntry[]
    semantic_resolution_distribution: GmailSenderWorkspaceSemanticResolutionDistributionEntry[]
    semantic_confidence_distribution: GmailSenderWorkspaceSemanticConfidenceDistributionEntry[]
    semantic_provenance_distribution: GmailSenderWorkspaceSemanticProvenanceDistributionEntry[]
    semantic_umbrella_distribution: GmailSenderWorkspaceSemanticUmbrellaDistributionEntry[]
  }>
  sender_ranking: Array<{
    sender: string
    sender_key: string
    total_message_count: number
    cleanup_candidate_message_count: number
    protected_message_count: number
    unread_count: number
    first_seen: string | null
    last_seen: string | null
    category_summary: string
    sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
    assigned_cleanup_group_id: GmailAssignedCleanupGroupId
    assignment_reason: GmailCleanupAssignmentReason
    is_cleanup_candidate: boolean
    cleanup_exclusion_reason: GmailCleanupExclusionReason | null
  }>
  initial_pressure_trend?: GmailPressureTrendData | null
  source: 'gmail_index_cache'
}

export type GmailSenderWorkspaceSender = {
  sender: string
  sender_key: string
  sender_domain: string | null
  cleanup_group_message_count: number
  total_sender_messages: number | null
  unread_count: number
  last_activity: string | null
  first_seen: string | null
  category_distribution: GmailSenderCategoryDistributionEntry[]
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailCanonicalSenderCategoryLabel | null
  dominant_category_confidence: GmailDominantCategoryConfidence | null
  category_profile_mode: GmailSenderCategoryProfileMode
  category_summary: string
  category_summary_source: GmailCategorySummarySource
  semantic_family: GmailResolvedSemanticFamily
  semantic_pattern: GmailResolvedSemanticPattern
  /** @deprecated Use `semantic_pattern.pattern_class` and decomposition metadata. */
  dominant_pattern: string
  pattern_mix: GmailSenderPatternMixEntry[]
  /** @deprecated Use `semantic_family.family`. */
  operator_profile_family: GmailOperatorProfileFamily
  /** @deprecated Use `semantic_family.resolution`. */
  operator_profile_mode: GmailOperatorProfileMode
  /** @deprecated Use `semantic_family.confidence`. */
  operator_profile_confidence: GmailDominantCategoryConfidence | null
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_summary: string
  /** @deprecated Use `semantic_family` metadata. */
  operator_profile_reasons: string[]
  /** @deprecated Use `semantic_family.provenance`. */
  operator_profile_source: GmailOperatorProfileSource
  sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  machine_probability: number | null
  human_probability: number | null
  protected_hint: string | null
  requires_verification: boolean
  verification_reasons: string[]
  preview_messages: GmailCleanupPreviewMessage[]
  learned_policy: GmailSenderPolicy | null
}

export type GmailSenderWorkspaceData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  selected_cluster: {
    cluster_id: string
    canonical_cluster_id: string
    legacy_cluster_ids: string[]
    cluster_type: string
    title: string
    query: string
    why_selected: string
    risk_note: string
    safety_note: string
    message_count: number
    sender_count: number
    share_pct: number
    surface_tier?: GmailCleanupGroupSurfaceTier | null
    surface_kind?: GmailCleanupGroupSurfaceKind | null
    surface_visibility?: GmailCleanupGroupSurfaceVisibility | null
    top_level_rank?: number | null
  }
  senders: GmailSenderWorkspaceSender[]
  pagination: {
    page: number
    page_size: number
    total_senders: number
    total_pages: number
    cluster_total_senders: number
  }
  cluster_global: {
    sender_keys: string[]
    sender_keys_complete: boolean
  }
  analytics: {
    sender_category_distribution: Array<{
      label: string
      sender_count: number
    }>
    cleanup_group_surface_tier?: GmailCleanupGroupSurfaceTier | null
    cleanup_group_surface_kind?: GmailCleanupGroupSurfaceKind | null
    cleanup_group_surface_visibility?: GmailCleanupGroupSurfaceVisibility | null
    cleanup_group_top_level_rank?: number | null
    cleanup_group_canonical_cluster_id?: string | null
    cleanup_group_legacy_cluster_ids?: string[]
    cleanup_group_source_cluster_ids?: string[]
    cleanup_group_promotion_status?: GmailCleanupGroupPromotionStatus | null
    cleanup_group_selected_semantic_axis?: GmailCleanupGroupSemanticAxis | null
    cleanup_group_operator_value_status?: GmailCleanupGroupOperatorValueStatus | null
    cleanup_group_review_units_required?: boolean | null
    cleanup_group_review_unit_basis?: GmailCleanupGroupReviewUnitBasis | null
    cleanup_group_review_unit_count?: number | null
    cleanup_group_demotion_reasons?: string[]
    semantic_rollup_schema_version: number | null
    semantic_rollup_hash: string | null
    semantic_rollup: GmailSharedGroupSemanticRollup | null
    semantic_family_distribution: GmailSenderWorkspaceSemanticFamilyDistributionEntry[]
    semantic_pattern_distribution: GmailSenderWorkspaceSemanticPatternDistributionEntry[]
    semantic_resolution_distribution: GmailSenderWorkspaceSemanticResolutionDistributionEntry[]
    semantic_confidence_distribution: GmailSenderWorkspaceSemanticConfidenceDistributionEntry[]
    semantic_provenance_distribution: GmailSenderWorkspaceSemanticProvenanceDistributionEntry[]
    semantic_umbrella_distribution: GmailSenderWorkspaceSemanticUmbrellaDistributionEntry[]
    /** @deprecated Use `semantic_family_distribution`. */
    operator_profile_family_distribution: GmailSenderWorkspaceOperatorProfileFamilyDistributionEntry[]
    /** @deprecated Use `semantic_pattern_distribution`. */
    dominant_pattern_distribution: GmailSenderWorkspaceDominantPatternDistributionEntry[]
    /** @deprecated Use `semantic_resolution_distribution` with `scope='family'`. */
    operator_profile_mode_distribution: GmailSenderWorkspaceOperatorProfileModeDistributionEntry[]
    /** @deprecated Use `semantic_provenance_distribution`. */
    category_summary_source_distribution: GmailSenderWorkspaceCategorySummarySourceDistributionEntry[]
    sender_activity_timeline: Array<{
      label: string
      sender_count: number
    }>
    sender_activity_timeline_granularity: 'day' | 'week' | 'month'
    cluster_contribution: Array<{
      sender: string
      sender_key: string
      message_count: number
      share_pct: number
    }>
  }
  view: {
    search: string
    filter: GmailSenderWorkspaceFilter
    sort: GmailSenderWorkspaceSort
    direction: GmailSenderWorkspaceSortDirection
  }
  exceptions_count: number
  source: 'gmail_index_cache'
}

export type GmailSenderDistributionSender = {
  sender: string
  sender_key: string
  cleanup_group_message_count: number
  unread_count: number
  last_activity: string | null
  sender_signal: 'likely_machine_generated' | 'likely_human' | 'uncertain'
  requires_verification: boolean
}

export type GmailSenderDistributionData = {
  analysis_scope: OperationsAnalysisScope
  selected_cluster: {
    cluster_id: string
    canonical_cluster_id: string
    legacy_cluster_ids: string[]
    cluster_type: string
    title: string
    query: string
    message_count: number
    sender_count: number
  }
  senders: GmailSenderDistributionSender[]
  source: 'gmail_index_cache'
}

export type GmailConfirmationPreviewGroup = {
  policy: GmailSenderPolicy
  label: string
  sender_count: number
  message_count: number
  senders: Array<{
    sender: string
    sender_key: string
    message_count: number
  }>
}

export type GmailConfirmationPreviewData = {
  analysis_scope: OperationsAnalysisScope
  scope_ladder: GmailScopeLadderCounts
  selected_cluster: {
    cluster_id: string
    title: string
    message_count: number
    sender_count: number
  }
  exact_archive_impact: {
    sender_count: number
    message_count: number
    message_id_sample: string[]
  }
  future_behavior_summary: Array<{
    policy: Exclude<GmailSenderPolicy, 'archive' | 'undecided'>
    sender_count: number
    message_count: number
    behavior: string
  }>
  protected_exclusions_count: number
  undecided_sender_count: number
  groups: GmailConfirmationPreviewGroup[]
  source: 'gmail_index_cache'
}

export type GmailCleanupRuleIntent = {
  sender_key: string
  sender: string
  intent_type: 'keep' | 'quarantine' | 'unsubscribe' | 'custom_rule'
  label: string
  description: string
}

export type GmailMonitoringRecommendation = {
  id: string
  title: string
  summary: string
  recommended_policy: Exclude<GmailSenderPolicy, 'undecided'>
  confidence: 'high' | 'moderate'
  sender_key: string | null
  sender: string | null
  domain: string | null
  evidence: string[]
}

export type GmailMonitoringSummaryData = {
  learned_policies: Array<{
    sender_key: string
    sender: string
    domain: string | null
    policy: Exclude<GmailSenderPolicy, 'undecided'>
    updated_at: string
    source: 'agent_events'
    event_count: number
  }>
  rule_intents: Array<{
    sender_key: string
    sender: string
    intent_type: GmailCleanupRuleIntent['intent_type']
    label: string
    description: string
    updated_at: string
  }>
  recommendations: GmailMonitoringRecommendation[]
  semantic_matches: Array<{
    sender_key: string | null
    sender: string | null
    policy: Exclude<GmailSenderPolicy, 'undecided'> | null
    similarity: number
    excerpt: string
    source_url: string | null
  }>
  recent_events: Array<{
    id: string
    event_type: string
    created_at: string
    summary: string
  }>
}

export const GMAIL_DESTINATION_STATES = [
  'KEEP',
  'ARCHIVE',
  'QUARANTINE',
  'UNSUBSCRIBE',
  'CUSTOM_RULE',
] as const

export type GmailDestinationState = (typeof GMAIL_DESTINATION_STATES)[number]

export const GMAIL_DESTINATION_EXECUTION_STATES = [
  'not_applicable',
  'pending',
  'succeeded',
  'failed',
  'deferred',
] as const

export type GmailDestinationExecutionState =
  (typeof GMAIL_DESTINATION_EXECUTION_STATES)[number]

export type GmailSenderDestinationTrustSignals = {
  sender_signal: GmailSenderWorkspaceSender['sender_signal'] | null
  category_summary: string | null
  dominant_pattern: string | null
  protected_hint: string | null
  requires_verification: boolean
  verification_reasons: string[]
  cleanup_group_message_count: number | null
  total_sender_messages: number | null
  unread_count: number | null
  last_activity: string | null
}

export type GmailSenderDestinationHistoryItem = {
  destination_state: GmailDestinationState
  destination_timestamp: string
  destination_source: string
  destination_reason: string | null
}

export type GmailSenderDestinationProfile = {
  sender_key: string
  sender: string
  domain: string | null
  cluster: GmailCleanupWorkflowClusterPayload | null
  trust_signals: GmailSenderDestinationTrustSignals | null
  destination_state: GmailDestinationState
  destination_timestamp: string
  destination_source: string
  destination_reason: string | null
  destination_history: GmailSenderDestinationHistoryItem[]
  execution_state: GmailDestinationExecutionState
  execution_timestamp: string | null
  execution_source: string | null
  execution_warning: string | null
  execution_message_count: number | null
  execution_message_ids: string[] | null
  last_action_timestamp: string
}

export type GmailDecisionManagementSummaryData = {
  destination_summaries: Array<{
    state: GmailDestinationState
    label: string
    sender_count: number
    latest_destination_timestamp: string | null
    supporting_message_count: number
    summary: string
  }>
  sender_profiles: GmailSenderDestinationProfile[]
  recent_decision_activity: Array<{
    id: string
    sender_key: string
    sender: string
    destination_state: GmailDestinationState
    destination_timestamp: string
    destination_source: string
    destination_reason: string | null
    execution_state: GmailDestinationExecutionState | null
    execution_warning: string | null
  }>
  recommendation_summary: {
    status: 'deferred_phase_2'
    summary: string
  }
}

export type GmailCleanupWorkflowDraft = {
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
  ruleIntents: GmailCleanupRuleIntent[]
  currentStage: GmailCleanupStage
  confirmationPreview: GmailConfirmationPreviewData | null
  snapshotVersion?: string | null
  updatedAt: number
}

export type GmailCleanupMemoryWritePayload = {
  agentId: string
  sessionId: string | null
  cluster: GmailCleanupWorkflowClusterPayload | null
  action:
    | {
        type: 'sender_policy_set' | 'sender_policy_removed'
        senderKey: string
        sender: string
        policy: GmailSenderPolicy
      }
    | {
        type: 'rule_intent_set' | 'rule_intent_removed'
        senderKey: string
        sender: string
        intentType: GmailCleanupRuleIntent['intent_type']
        label: string
        description: string
      }
    | {
        type: 'destination_commit'
        senders: Array<{
          senderKey: string
          sender: string
          destinationState: GmailDestinationState
          source: string
          reason: string
          messageCount?: number | null
          trustSignals?: Partial<GmailSenderDestinationTrustSignals> | null
        }>
      }
    | {
        type: 'destination_execution_update'
        senders: Array<{
          senderKey: string
          sender: string
          executionState: GmailDestinationExecutionState
          executionSource: string
          executionWarning?: string | null
          executionMessageCount?: number | null
          executionMessageIds?: string[] | null
          executionTimestamp?: string | null
        }>
      }
    | {
        type: 'destination_state_clear'
        senderKey: string
        sender: string
        reason: string
      }
}

function normalizeInboxAnalysisRequestContext(
  value: OperationsInboxAnalysisRequestContext | undefined
): {
  source: string | null
  component: string | null
  reason: string | null
  phase: OperationsInboxAnalysisRequestContext['phase'] | null
  agentId: string | null
} {
  return {
    source: typeof value?.source === 'string' && value.source.trim() ? value.source.trim() : null,
    component:
      typeof value?.component === 'string' && value.component.trim() ? value.component.trim() : null,
    reason: typeof value?.reason === 'string' && value.reason.trim() ? value.reason.trim() : null,
    phase: value?.phase || null,
    agentId:
      typeof value?.agentId === 'string' && value.agentId.trim() ? value.agentId.trim() : null,
  }
}

function contextParams(value: OperationsInboxAnalysisRequestContext | undefined) {
  const context = normalizeInboxAnalysisRequestContext(value)
  return {
    request_source: context.source,
    request_component: context.component,
    request_reason: context.reason,
    request_phase: context.phase,
    request_agent_id: context.agentId,
  }
}

type CachedInboxAnalysisEntry<T> = {
  expiresAtMs: number
  data: T
}

const GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_TTL_MS = 1000 * 60 * 10
const GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX = 'gmail.inbox.analysis.v1'
const GMAIL_RUNTIME_SUMMARY_CLIENT_CACHE_TTL_MS = 15 * 1000
const GMAIL_RUNTIME_SUMMARY_STORAGE_PREFIX = 'gmail.runtime.summary.v1'

const gmailCleanupRuntimeGlobal = globalThis as typeof globalThis & {
  __gmailInboxAnalysisClientCache?: Map<string, CachedInboxAnalysisEntry<unknown>>
  __gmailInboxAnalysisClientInflight?: Map<string, Promise<unknown>>
  __gmailRuntimeSummaryClientCache?: Map<string, CachedInboxAnalysisEntry<unknown>>
  __gmailRuntimeSummaryClientInflight?: Map<string, Promise<unknown>>
}

const gmailInboxAnalysisClientCache =
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache ||
  new Map<string, CachedInboxAnalysisEntry<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache) {
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientCache = gmailInboxAnalysisClientCache
}

const gmailInboxAnalysisClientInflight =
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight || new Map<string, Promise<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight) {
  gmailCleanupRuntimeGlobal.__gmailInboxAnalysisClientInflight = gmailInboxAnalysisClientInflight
}

const gmailRuntimeSummaryClientCache =
  gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientCache ||
  new Map<string, CachedInboxAnalysisEntry<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientCache) {
  gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientCache = gmailRuntimeSummaryClientCache
}

const gmailRuntimeSummaryClientInflight =
  gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientInflight || new Map<string, Promise<unknown>>()
if (!gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientInflight) {
  gmailCleanupRuntimeGlobal.__gmailRuntimeSummaryClientInflight = gmailRuntimeSummaryClientInflight
}

function cleanupClusterIdentitySource(cluster: {
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
  sourceClusterIds?: string[] | null
}): CleanupClusterIdentitySource {
  return {
    clusterId: cluster.clusterId,
    canonicalClusterId: cluster.canonicalClusterId ?? cluster.clusterId,
    legacyClusterIds: Array.isArray(cluster.legacyClusterIds) ? cluster.legacyClusterIds : [],
    sourceClusterIds: Array.isArray(cluster.sourceClusterIds) ? cluster.sourceClusterIds : [],
  }
}

function normalizeWorkflowString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueWorkflowClusterIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeWorkflowString(value)).filter(Boolean))
  )
}

function normalizeReviewUnitKey(params: {
  subsetSource?: string | null
  subsetValue?: string | null
  reviewUnitKey?: string | null
}): string | null {
  const direct = normalizeWorkflowString(params.reviewUnitKey)
  if (direct) return direct
  return params.subsetSource === 'review_unit' ? normalizeWorkflowString(params.subsetValue) || null : null
}

function canonicalClusterIdFromIdentity(params: {
  requestedClusterId: string
  explicitCanonicalClusterId?: string | null
  identity: ReturnType<typeof resolveCleanupClusterIdentity>
}): string {
  return (
    normalizeWorkflowString(params.identity.canonicalDescriptor?.canonicalClusterId) ||
    normalizeWorkflowString(params.identity.canonicalClusterId) ||
    normalizeWorkflowString(params.explicitCanonicalClusterId) ||
    normalizeWorkflowString(params.requestedClusterId)
  )
}

function normalizedCleanupClusterIdentity(params: {
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
  sourceClusterIds?: string[] | null
}) {
  const requestedClusterId = normalizeWorkflowString(params.clusterId)
  const explicitCanonicalClusterId = normalizeWorkflowString(params.canonicalClusterId) || null
  const legacyClusterIds = uniqueWorkflowClusterIds(params.legacyClusterIds ?? [])
  const sourceClusterIds = uniqueWorkflowClusterIds(params.sourceClusterIds ?? [])
  const identitySources =
    explicitCanonicalClusterId || legacyClusterIds.length > 0 || sourceClusterIds.length > 0
      ? [
          cleanupClusterIdentitySource({
            clusterId: explicitCanonicalClusterId || requestedClusterId,
            canonicalClusterId: explicitCanonicalClusterId,
            legacyClusterIds,
            sourceClusterIds,
          }),
        ]
      : []
  const identity = resolveCleanupClusterIdentity(requestedClusterId, identitySources)
  const canonicalClusterId = canonicalClusterIdFromIdentity({
    requestedClusterId,
    explicitCanonicalClusterId,
    identity,
  })

  return {
    ...identity,
    canonicalClusterId,
    legacyClusterIds: uniqueWorkflowClusterIds([
      ...legacyClusterIds,
      ...identity.legacyClusterIds,
      identity.matchedDescriptorAliasKind === 'legacy' ? requestedClusterId : null,
    ]),
    sourceClusterIds: uniqueWorkflowClusterIds([
      ...sourceClusterIds,
      ...identity.sourceClusterIds,
      identity.matchedDescriptorAliasKind === 'source' ||
      identity.matchedDescriptorAliasKind === 'transitional_surface'
        ? requestedClusterId
        : null,
    ]),
  }
}

export function normalizeGmailCleanupWorkflowTarget(params: {
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
  sourceClusterIds?: string[] | null
  clusterType: string
  title: string
  query: string
  requestedClusterId?: string | null
  subsetSource?: string | null
  subsetValue?: string | null
  reviewUnitKey?: string | null
}): GmailNormalizedWorkflowTarget | null {
  const requestedClusterId =
    normalizeWorkflowString(params.requestedClusterId) || normalizeWorkflowString(params.clusterId)
  const clusterType = normalizeWorkflowString(params.clusterType)
  const title = normalizeWorkflowString(params.title)
  const query = normalizeWorkflowString(params.query)
  if (!requestedClusterId || !clusterType || !title || !query) return null

  const identity = normalizedCleanupClusterIdentity({
    clusterId: requestedClusterId,
    canonicalClusterId: params.canonicalClusterId,
    legacyClusterIds: params.legacyClusterIds,
    sourceClusterIds: params.sourceClusterIds,
  })

  return {
    identity: {
      canonicalClusterId: canonicalClusterIdFromIdentity({
        requestedClusterId,
        explicitCanonicalClusterId: params.canonicalClusterId,
        identity,
      }),
      reviewUnitKey: normalizeReviewUnitKey({
        subsetSource: params.subsetSource,
        subsetValue: params.subsetValue,
        reviewUnitKey: params.reviewUnitKey,
      }),
    },
    metadata: {
      clusterType,
      title,
      query,
    },
    compat: {
      requestedClusterId,
      legacyClusterIds: identity.legacyClusterIds,
      sourceClusterIds: identity.sourceClusterIds,
    },
  }
}

export function buildGmailCleanupWorkflowClusterPayload(params: {
  cluster: GmailCleanupClusterRef
  requestedClusterId?: string | null
  subsetSource?: string | null
  subsetValue?: string | null
  reviewUnitKey?: string | null
}): GmailCleanupWorkflowClusterPayload | null {
  const workflowTarget = normalizeGmailCleanupWorkflowTarget({
    clusterId: params.cluster.clusterId,
    canonicalClusterId: params.cluster.canonicalClusterId,
    legacyClusterIds: params.cluster.legacyClusterIds,
    sourceClusterIds: params.cluster.sourceClusterIds,
    clusterType: params.cluster.clusterType,
    title: params.cluster.title,
    query: params.cluster.query,
    requestedClusterId: params.requestedClusterId,
    subsetSource: params.subsetSource,
    subsetValue: params.subsetValue,
    reviewUnitKey: params.reviewUnitKey,
  })
  if (!workflowTarget) return null

  return {
    clusterId: workflowTarget.identity.canonicalClusterId,
    canonicalClusterId: workflowTarget.identity.canonicalClusterId,
    reviewUnitKey: workflowTarget.identity.reviewUnitKey,
    legacyClusterIds: workflowTarget.compat.legacyClusterIds,
    sourceClusterIds: workflowTarget.compat.sourceClusterIds,
    clusterType: workflowTarget.metadata.clusterType,
    title: workflowTarget.metadata.title,
    query: workflowTarget.metadata.query,
  }
}

export function gmailCleanupWorkflowTargetsEqual(
  left: GmailNormalizedWorkflowTarget | null | undefined,
  right: GmailNormalizedWorkflowTarget | null | undefined
): boolean {
  if (!left || !right) return false
  return (
    left.identity.canonicalClusterId === right.identity.canonicalClusterId &&
    left.identity.reviewUnitKey === right.identity.reviewUnitKey
  )
}

function clusterCacheSignature(cluster: GmailCleanupClusterRef): string {
  return [
    cluster.canonicalClusterId || cluster.clusterId,
    ...(cluster.legacyClusterIds || []).slice().sort(),
    cluster.clusterType,
    cluster.title,
    cluster.query,
    cluster.whySelected || '',
    cluster.riskNote || '',
    cluster.safetyNote || '',
    cluster.senderCount ?? '',
    cluster.messageCount ?? '',
    cluster.estimatedCount ?? '',
  ].join('::')
}

function sortedClusterCacheSignatures(clusters: GmailCleanupClusterRef[]): string[] {
  return clusters.map((cluster) => clusterCacheSignature(cluster)).sort()
}

function senderPoliciesSignature(value: Record<string, GmailSenderPolicy>): string {
  return Object.entries(value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, policy]) => `${key}:${policy}`)
    .join('|')
}

function messageOverridesSignature(value: Record<string, 'include' | 'exclude'>): string {
  return Object.entries(value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, override]) => `${key}:${override}`)
    .join('|')
}

function clientInboxAnalysisStorageKey(cacheKey: string): string {
  return `${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:${cacheKey}`
}

function clientRuntimeSummaryStorageKey(cacheKey: string): string {
  return `${GMAIL_RUNTIME_SUMMARY_STORAGE_PREFIX}:${cacheKey}`
}

function readPersistedClientInboxAnalysisCache<T>(cacheKey: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(clientInboxAnalysisStorageKey(cacheKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedInboxAnalysisEntry<T> | null
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAtMs !== 'number') return null
    if (parsed.expiresAtMs <= Date.now()) {
      window.sessionStorage.removeItem(clientInboxAnalysisStorageKey(cacheKey))
      return null
    }
    gmailInboxAnalysisClientCache.set(cacheKey, parsed as CachedInboxAnalysisEntry<unknown>)
    return parsed.data
  } catch {
    return null
  }
}

function readClientInboxAnalysisCache<T>(cacheKey: string): T | null {
  const cached = gmailInboxAnalysisClientCache.get(cacheKey)
  if (!cached) return null
  if (cached.expiresAtMs <= Date.now()) {
    gmailInboxAnalysisClientCache.delete(cacheKey)
    return null
  }
  return cached.data as T
}

function writeClientInboxAnalysisCache<T>(cacheKey: string, data: T): T {
  const entry = {
    expiresAtMs: Date.now() + GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_TTL_MS,
    data,
  }
  gmailInboxAnalysisClientCache.set(cacheKey, entry)
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(clientInboxAnalysisStorageKey(cacheKey), JSON.stringify(entry))
    } catch {
      // Ignore storage quota failures; the in-memory cache remains the primary fast path.
    }
  }
  return data
}

function readClientRuntimeSummaryCache<T>(cacheKey: string): T | null {
  const cached = gmailRuntimeSummaryClientCache.get(cacheKey)
  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.data as T
  }
  if (cached) {
    gmailRuntimeSummaryClientCache.delete(cacheKey)
  }
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(clientRuntimeSummaryStorageKey(cacheKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedInboxAnalysisEntry<T> | null
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAtMs !== 'number') return null
    if (parsed.expiresAtMs <= Date.now()) {
      window.localStorage.removeItem(clientRuntimeSummaryStorageKey(cacheKey))
      return null
    }
    gmailRuntimeSummaryClientCache.set(cacheKey, parsed as CachedInboxAnalysisEntry<unknown>)
    return parsed.data
  } catch {
    return null
  }
}

function writeClientRuntimeSummaryCache<T>(cacheKey: string, data: T): T {
  const entry = {
    expiresAtMs: Date.now() + GMAIL_RUNTIME_SUMMARY_CLIENT_CACHE_TTL_MS,
    data,
  }
  gmailRuntimeSummaryClientCache.set(cacheKey, entry)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(clientRuntimeSummaryStorageKey(cacheKey), JSON.stringify(entry))
    } catch {
      // Ignore localStorage quota failures; the in-memory cache remains the primary fast path.
    }
  }
  return data
}

async function requestCachedInboxAnalysis<T>(params: {
  action:
    | 'mailbox_intelligence'
    | 'mailbox_pressure_trend'
    | 'sender_distribution'
    | 'sender_workspace'
    | 'confirmation_preview'
  cacheKey: string
  body: Record<string, unknown>
  errorMessage: string
  signal?: AbortSignal
}): Promise<{ ok: true; data: T } | { ok: false; error: string; aborted?: true }> {
  const action = typeof params.action === 'string' && params.action.trim() ? params.action.trim() : ''
  if (!action) {
    console.warn(
      `[gmail-cleanup][inbox-analysis-client-guard] ${JSON.stringify({
        blocked: true,
        reason: 'missing_action',
        cache_key: params.cacheKey,
      })}`
    )
    return { ok: false, error: 'Inbox analysis action is required before requesting Gmail analysis.' }
  }

  const cached =
    readClientInboxAnalysisCache<T>(params.cacheKey) ||
    readPersistedClientInboxAnalysisCache<T>(params.cacheKey)
  if (cached) return { ok: true, data: cached }

  const inflight = gmailInboxAnalysisClientInflight.get(params.cacheKey)
  if (inflight) {
    return (await inflight) as { ok: true; data: T } | { ok: false; error: string; aborted?: true }
  }

  const request = (async (): Promise<{ ok: true; data: T } | { ok: false; error: string; aborted?: true }> => {
    try {
      const res = await fetch('/api/integrations/gmail/inbox-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: params.signal,
        body: JSON.stringify({
          ...params.body,
          action,
        }),
      })

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: T }
        | null

      if (!res.ok || !payload?.ok || !payload.data) {
        return { ok: false, error: payload?.error || params.errorMessage }
      }

      return { ok: true, data: writeClientInboxAnalysisCache(params.cacheKey, payload.data) }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, error: 'Request cancelled.', aborted: true }
      }
      return { ok: false, error: params.errorMessage }
    }
  })()

  gmailInboxAnalysisClientInflight.set(params.cacheKey, request as Promise<unknown>)
  try {
    return await request
  } finally {
    gmailInboxAnalysisClientInflight.delete(params.cacheKey)
  }
}

export function gmailCleanupWorkflowDraftStorageKey(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
}): string {
  return [
    'gmail.cleanup.workflow.v2',
    params.agentId,
    params.sessionId || 'none',
    params.clusterId,
  ].join(':')
}

function gmailCleanupWorkflowDraftClusterFallbackStorageKey(params: {
  agentId: string
  clusterId: string
}): string {
  return ['gmail.cleanup.workflow.v2', params.agentId, 'cluster_fallback', params.clusterId].join(':')
}

export function gmailCleanupWorkflowDraftHasActiveContent(
  draft: GmailCleanupWorkflowDraft | null | undefined
): draft is GmailCleanupWorkflowDraft {
  if (!draft) return false
  return (
    Object.keys(draft.senderPolicies || {}).length > 0 ||
    Object.keys(draft.messageOverrides || {}).length > 0 ||
    (draft.ruleIntents?.length || 0) > 0 ||
    draft.confirmationPreview != null
  )
}

function normalizeWorkflowDraft(value: Partial<GmailCleanupWorkflowDraft> | null): GmailCleanupWorkflowDraft | null {
  if (!value || typeof value !== 'object') return null
  return {
    senderPolicies:
      value.senderPolicies && typeof value.senderPolicies === 'object'
        ? (value.senderPolicies as Record<string, GmailSenderPolicy>)
        : {},
    messageOverrides:
      value.messageOverrides && typeof value.messageOverrides === 'object'
        ? (value.messageOverrides as Record<string, 'include' | 'exclude'>)
        : {},
    ruleIntents: Array.isArray(value.ruleIntents) ? (value.ruleIntents as GmailCleanupRuleIntent[]) : [],
    currentStage:
      typeof value.currentStage === 'string' &&
      GMAIL_CLEANUP_STAGES.includes(value.currentStage as GmailCleanupStage)
        ? (value.currentStage as GmailCleanupStage)
        : 'senders',
    confirmationPreview:
      value.confirmationPreview && typeof value.confirmationPreview === 'object'
        ? (value.confirmationPreview as GmailConfirmationPreviewData)
        : null,
    snapshotVersion:
      typeof value.snapshotVersion === 'string' && value.snapshotVersion.trim()
        ? value.snapshotVersion.trim()
        : null,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  }
}

function draftMatchesSnapshot(
  draft: GmailCleanupWorkflowDraft | null,
  snapshotVersion: string | null | undefined
): draft is GmailCleanupWorkflowDraft {
  if (!draft) return false
  if (!snapshotVersion || !snapshotVersion.trim()) return true
  if (!draft.snapshotVersion || !draft.snapshotVersion.trim()) return true
  return draft.snapshotVersion.trim() === snapshotVersion.trim()
}

function readStoredWorkflowDraft(key: string): GmailCleanupWorkflowDraft | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return normalizeWorkflowDraft(JSON.parse(raw) as Partial<GmailCleanupWorkflowDraft>)
  } catch {
    return null
  }
}

export function readGmailCleanupWorkflowDraft(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
  snapshotVersion?: string | null
}): GmailCleanupWorkflowDraft | null {
  const identity = normalizedCleanupClusterIdentity({
    clusterId: params.clusterId,
    canonicalClusterId: params.canonicalClusterId,
    legacyClusterIds: params.legacyClusterIds,
  })
  const identityKeys = listCleanupClusterIdentityKeys(identity)
  const primaryClusterId = identity.canonicalClusterId || params.clusterId
  const sessionDraft = readStoredWorkflowDraft(
    gmailCleanupWorkflowDraftStorageKey({
      agentId: params.agentId,
      sessionId: params.sessionId,
      clusterId: primaryClusterId,
    })
  )
  if (draftMatchesSnapshot(sessionDraft, params.snapshotVersion)) return sessionDraft

  const fallbackDraft = readStoredWorkflowDraft(
    gmailCleanupWorkflowDraftClusterFallbackStorageKey({
      agentId: params.agentId,
      clusterId: primaryClusterId,
    })
  )
  if (draftMatchesSnapshot(fallbackDraft, params.snapshotVersion)) return fallbackDraft

  for (const legacyClusterId of identityKeys.slice(1)) {
    const legacySessionDraft = readStoredWorkflowDraft(
      gmailCleanupWorkflowDraftStorageKey({
        agentId: params.agentId,
        sessionId: params.sessionId,
        clusterId: legacyClusterId,
      })
    )
    if (draftMatchesSnapshot(legacySessionDraft, params.snapshotVersion)) return legacySessionDraft

    const legacyFallbackDraft = readStoredWorkflowDraft(
      gmailCleanupWorkflowDraftClusterFallbackStorageKey({
        agentId: params.agentId,
        clusterId: legacyClusterId,
      })
    )
    if (draftMatchesSnapshot(legacyFallbackDraft, params.snapshotVersion)) return legacyFallbackDraft
  }

  return null
}

export function writeGmailCleanupWorkflowDraft(
  params: {
    agentId: string
    sessionId: string | null
    clusterId: string
    canonicalClusterId?: string | null
    legacyClusterIds?: string[] | null
    snapshotVersion?: string | null
  },
  draft: GmailCleanupWorkflowDraft
) {
  if (typeof window === 'undefined') return
  const identity = normalizedCleanupClusterIdentity({
    clusterId: params.clusterId,
    canonicalClusterId: params.canonicalClusterId,
    legacyClusterIds: params.legacyClusterIds,
  })
  const identityKeys = listCleanupClusterIdentityKeys(identity)
  const primaryClusterId = identity.canonicalClusterId || params.clusterId
  const sessionKey = gmailCleanupWorkflowDraftStorageKey({
    agentId: params.agentId,
    sessionId: params.sessionId,
    clusterId: primaryClusterId,
  })
  const fallbackKey = gmailCleanupWorkflowDraftClusterFallbackStorageKey({
    agentId: params.agentId,
    clusterId: primaryClusterId,
  })
  if (!gmailCleanupWorkflowDraftHasActiveContent(draft)) {
    window.localStorage.removeItem(sessionKey)
    window.localStorage.removeItem(fallbackKey)
    for (const legacyClusterId of identityKeys.slice(1)) {
      window.localStorage.removeItem(
        gmailCleanupWorkflowDraftStorageKey({
          agentId: params.agentId,
          sessionId: params.sessionId,
          clusterId: legacyClusterId,
        })
      )
      window.localStorage.removeItem(
        gmailCleanupWorkflowDraftClusterFallbackStorageKey({
          agentId: params.agentId,
          clusterId: legacyClusterId,
        })
      )
    }
    return
  }
  const payload = JSON.stringify({
    ...draft,
    snapshotVersion: params.snapshotVersion ?? draft.snapshotVersion ?? null,
  })
  window.localStorage.setItem(sessionKey, payload)
  window.localStorage.setItem(fallbackKey, payload)
  for (const legacyClusterId of identityKeys.slice(1)) {
    window.localStorage.removeItem(
      gmailCleanupWorkflowDraftStorageKey({
        agentId: params.agentId,
        sessionId: params.sessionId,
        clusterId: legacyClusterId,
      })
    )
    window.localStorage.removeItem(
      gmailCleanupWorkflowDraftClusterFallbackStorageKey({
        agentId: params.agentId,
        clusterId: legacyClusterId,
      })
    )
  }
}

export function clearGmailCleanupWorkflowDraft(params: {
  agentId: string
  sessionId: string | null
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
}) {
  if (typeof window === 'undefined') return
  const identity = normalizedCleanupClusterIdentity({
    clusterId: params.clusterId,
    canonicalClusterId: params.canonicalClusterId,
    legacyClusterIds: params.legacyClusterIds,
  })
  const identityKeys = listCleanupClusterIdentityKeys(identity)
  const primaryClusterId = identity.canonicalClusterId || params.clusterId
  window.localStorage.removeItem(
    gmailCleanupWorkflowDraftStorageKey({
      agentId: params.agentId,
      sessionId: params.sessionId,
      clusterId: primaryClusterId,
    })
  )
  window.localStorage.removeItem(
    gmailCleanupWorkflowDraftClusterFallbackStorageKey({
      agentId: params.agentId,
      clusterId: primaryClusterId,
    })
  )
  for (const legacyClusterId of identityKeys.slice(1)) {
    window.localStorage.removeItem(
      gmailCleanupWorkflowDraftStorageKey({
        agentId: params.agentId,
        sessionId: params.sessionId,
        clusterId: legacyClusterId,
      })
    )
    window.localStorage.removeItem(
      gmailCleanupWorkflowDraftClusterFallbackStorageKey({
        agentId: params.agentId,
        clusterId: legacyClusterId,
      })
    )
  }
}

export function clearSenderFromGmailCleanupWorkflowDrafts(params: {
  agentId: string
  senderKey: string
  sessionId?: string | null
}) {
  if (typeof window === 'undefined') return
  const sessionPrefix = `gmail.cleanup.workflow.v2:${params.agentId}:${params.sessionId || 'none'}:`
  const fallbackPrefix = `gmail.cleanup.workflow.v2:${params.agentId}:cluster_fallback:`
  const updates = new Map<string, GmailCleanupWorkflowDraft | null>()

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key) continue
    const matchesSession = key.startsWith(sessionPrefix)
    const matchesFallback = key.startsWith(fallbackPrefix)
    if (!matchesSession && !matchesFallback) continue
    const draft = readStoredWorkflowDraft(key)
    if (!draft) continue
    const hadSenderPolicy = Boolean(draft.senderPolicies?.[params.senderKey])
    const hadIntent = draft.ruleIntents?.some((intent) => intent.sender_key === params.senderKey)
    if (!hadSenderPolicy && !hadIntent) continue

    const nextSenderPolicies = { ...draft.senderPolicies }
    delete nextSenderPolicies[params.senderKey]
    const nextDraft: GmailCleanupWorkflowDraft = {
      ...draft,
      senderPolicies: nextSenderPolicies,
      ruleIntents: draft.ruleIntents.filter((intent) => intent.sender_key !== params.senderKey),
      confirmationPreview: null,
      currentStage:
        Object.keys(nextSenderPolicies).length > 0 ||
        Object.keys(draft.messageOverrides || {}).length > 0 ||
        draft.ruleIntents.some((intent) => intent.sender_key !== params.senderKey)
          ? draft.currentStage
          : 'senders',
      updatedAt: Date.now(),
    }
    updates.set(key, gmailCleanupWorkflowDraftHasActiveContent(nextDraft) ? nextDraft : null)
  }

  for (const [key, draft] of updates.entries()) {
    if (!draft) {
      window.localStorage.removeItem(key)
      continue
    }
    window.localStorage.setItem(key, JSON.stringify(draft))
  }
}

function mailboxIntelligenceCacheKey(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
}): string {
  return [
    'mailbox_intelligence',
    params.analysisScope,
    params.cacheVersion,
    ...sortedClusterCacheSignatures(params.clusters),
  ].join('|||')
}

function mailboxIntelligenceCacheKeySegments(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
}): { suffix: string[] } {
  return {
    suffix: sortedClusterCacheSignatures(params.clusters),
  }
}

function mailboxIntelligenceCacheMatches(params: {
  cacheKey: string
  clusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
}): boolean {
  const segments = params.cacheKey.split('|||')
  if (segments.length < 4) return false
  if (segments[0] !== 'mailbox_intelligence') return false
  if (segments[1] !== params.analysisScope) return false
  const expectedSuffix = mailboxIntelligenceCacheKeySegments({
    clusters: params.clusters,
    analysisScope: params.analysisScope,
  }).suffix
  const actualSuffix = segments.slice(3)
  if (actualSuffix.length !== expectedSuffix.length) return false
  return actualSuffix.every((segment, index) => segment === expectedSuffix[index])
}

const PRESSURE_TREND_CLIENT_CACHE_VERSION = 'v2'

function pressureTrendCacheKey(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion: string
  pressureWindow: GmailPressureTrendWindow
  pressureStart: string | null
  pressureEnd: string | null
  timeZone: string
}): string {
  return [
    'pressure_trend',
    PRESSURE_TREND_CLIENT_CACHE_VERSION,
    params.cacheVersion,
    params.pressureWindow,
    params.pressureStart || 'none',
    params.pressureEnd || 'none',
    params.timeZone || 'UTC',
    ...sortedClusterCacheSignatures(params.clusters),
  ].join('|||')
}

function senderWorkspaceCacheKey(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
  includeClusterSenderKeys: boolean
  page: number
  pageSize: number
  search: string
  filter: GmailSenderWorkspaceFilter
  sort: GmailSenderWorkspaceSort
  direction: GmailSenderWorkspaceSortDirection
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  previewEvidenceSenderKey?: string | null
}): string {
  const semanticFocusSignature = params.semanticFocus
    ? [
        params.semanticFocus.family,
        params.semanticFocus.kind,
        params.semanticFocus.subtypeKey || 'none',
        params.semanticFocus.surfacedSubtypeKeys.slice().sort().join(',') || 'none',
      ].join(':')
    : 'none'
  return [
    'sender_workspace',
    params.analysisScope,
    params.cacheVersion,
    clusterCacheSignature(params.selectedCluster),
    ...sortedClusterCacheSignatures(params.allClusters),
    params.includeClusterSenderKeys ? 'with_cluster_sender_keys' : 'without_cluster_sender_keys',
    String(params.page),
    String(params.pageSize),
    params.search,
    params.filter,
    params.sort,
    params.direction,
    semanticFocusSignature,
    params.previewEvidenceSenderKey || 'no-preview-evidence-sender',
  ].join('|||')
}

function senderDistributionCacheKey(params: {
  selectedCluster: GmailCleanupClusterRef
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
}): string {
  return [
    'sender_distribution',
    params.analysisScope,
    params.cacheVersion,
    clusterCacheSignature(params.selectedCluster),
  ].join('|||')
}

function confirmationPreviewCacheKey(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope: OperationsAnalysisScope
  cacheVersion: string
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}): string {
  return [
    'confirmation_preview',
    params.analysisScope,
    params.cacheVersion,
    clusterCacheSignature(params.selectedCluster),
    ...sortedClusterCacheSignatures(params.allClusters),
    senderPoliciesSignature(params.senderPolicies),
    messageOverridesSignature(params.messageOverrides),
  ].join('|||')
}

export function readCachedGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
}): GmailMailboxIntelligenceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  return (
    readClientInboxAnalysisCache<GmailMailboxIntelligenceData>(
      mailboxIntelligenceCacheKey({
        clusters: params.clusters,
        analysisScope,
        cacheVersion,
      })
    ) ||
    readPersistedClientInboxAnalysisCache<GmailMailboxIntelligenceData>(
      mailboxIntelligenceCacheKey({
        clusters: params.clusters,
        analysisScope,
        cacheVersion,
      })
    )
  )
}

export function readCachedGmailPressureTrend(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion?: string | null
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): GmailPressureTrendData | null {
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const pressureStart =
    typeof params.pressureStart === 'string' && params.pressureStart.trim()
      ? params.pressureStart.trim()
      : null
  const pressureEnd =
    typeof params.pressureEnd === 'string' && params.pressureEnd.trim()
      ? params.pressureEnd.trim()
      : null
  const timeZone =
    typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC'
  const cacheKey = pressureTrendCacheKey({
    clusters: params.clusters,
    cacheVersion,
    pressureWindow: params.pressureWindow,
    pressureStart,
    pressureEnd,
    timeZone,
  })
  return (
    readClientInboxAnalysisCache<GmailPressureTrendData>(cacheKey) ||
    readPersistedClientInboxAnalysisCache<GmailPressureTrendData>(cacheKey)
  )
}

export function primeCachedGmailPressureTrend(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion?: string | null
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  data: GmailPressureTrendData
}): GmailPressureTrendData {
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const pressureStart =
    typeof params.pressureStart === 'string' && params.pressureStart.trim()
      ? params.pressureStart.trim()
      : null
  const pressureEnd =
    typeof params.pressureEnd === 'string' && params.pressureEnd.trim()
      ? params.pressureEnd.trim()
      : null
  const timeZone =
    typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC'

  return writeClientInboxAnalysisCache(
    pressureTrendCacheKey({
      clusters: params.clusters,
      cacheVersion,
      pressureWindow: params.pressureWindow,
      pressureStart,
      pressureEnd,
      timeZone,
    }),
    params.data
  )
}

export function readLatestCachedGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
}): GmailMailboxIntelligenceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  let latestEntry: CachedInboxAnalysisEntry<GmailMailboxIntelligenceData> | null = null

  for (const [cacheKey, entry] of gmailInboxAnalysisClientCache.entries()) {
    if (entry.expiresAtMs <= Date.now()) continue
    if (
      !mailboxIntelligenceCacheMatches({
        cacheKey,
        clusters: params.clusters,
        analysisScope,
      })
    ) {
      continue
    }
    if (!latestEntry || entry.expiresAtMs > latestEntry.expiresAtMs) {
      latestEntry = entry as CachedInboxAnalysisEntry<GmailMailboxIntelligenceData>
    }
  }

  if (latestEntry?.data) return latestEntry.data
  if (typeof window === 'undefined') return null

  const storagePrefix = `${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:mailbox_intelligence|||${analysisScope}|||`
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index)
    if (!storageKey || !storageKey.startsWith(storagePrefix)) continue
    const rawCacheKey = storageKey.slice(`${GMAIL_INBOX_ANALYSIS_CLIENT_CACHE_STORAGE_PREFIX}:`.length)
    if (
      !mailboxIntelligenceCacheMatches({
        cacheKey: rawCacheKey,
        clusters: params.clusters,
        analysisScope,
      })
    ) {
      continue
    }
    const persisted = readPersistedClientInboxAnalysisCache<GmailMailboxIntelligenceData>(rawCacheKey)
    if (!persisted) continue
    const persistedEntry = gmailInboxAnalysisClientCache.get(rawCacheKey)
    if (!persistedEntry || persistedEntry.expiresAtMs <= Date.now()) continue
    if (!latestEntry || persistedEntry.expiresAtMs > latestEntry.expiresAtMs) {
      latestEntry = persistedEntry as CachedInboxAnalysisEntry<GmailMailboxIntelligenceData>
    }
  }

  return latestEntry?.data || null
}

export function readCachedGmailSenderWorkspace(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  includeClusterSenderKeys?: boolean
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  previewEvidenceSenderKey?: string | null
}): GmailSenderWorkspaceData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 12
  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const filter = params.filter ?? 'all'
  const sort = params.sort ?? 'message_count'
  const direction = params.direction ?? 'desc'
  const includeClusterSenderKeys = params.includeClusterSenderKeys === true
  const cacheKey = senderWorkspaceCacheKey({
    selectedCluster: params.selectedCluster,
    allClusters: params.allClusters,
    analysisScope,
    cacheVersion,
    includeClusterSenderKeys,
    page,
    pageSize,
    search,
    filter,
    sort,
    direction,
    semanticFocus: params.semanticFocus ?? null,
    previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
  })
  return (
    readClientInboxAnalysisCache<GmailSenderWorkspaceData>(cacheKey) ||
    readPersistedClientInboxAnalysisCache<GmailSenderWorkspaceData>(cacheKey)
  )
}

export function readCachedGmailSenderDistribution(params: {
  selectedCluster: GmailCleanupClusterRef
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
}): GmailSenderDistributionData | null {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const cacheKey = senderDistributionCacheKey({
    selectedCluster: params.selectedCluster,
    analysisScope,
    cacheVersion,
  })
  return (
    readClientInboxAnalysisCache<GmailSenderDistributionData>(cacheKey) ||
    readPersistedClientInboxAnalysisCache<GmailSenderDistributionData>(cacheKey)
  )
}

export async function fetchGmailMailboxIntelligence(params: {
  clusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  initialPressureWindow?: GmailPressureTrendWindow
  initialPressureStart?: string | null
  initialPressureEnd?: string | null
  initialTimeZone?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailMailboxIntelligenceData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const initialPressureStart =
    typeof params.initialPressureStart === 'string' && params.initialPressureStart.trim()
      ? params.initialPressureStart.trim()
      : null
  const initialPressureEnd =
    typeof params.initialPressureEnd === 'string' && params.initialPressureEnd.trim()
      ? params.initialPressureEnd.trim()
      : null
  const initialTimeZone =
    typeof params.initialTimeZone === 'string' && params.initialTimeZone.trim()
      ? params.initialTimeZone.trim()
      : null
  return requestCachedInboxAnalysis<GmailMailboxIntelligenceData>({
    action: 'mailbox_intelligence',
    cacheKey: mailboxIntelligenceCacheKey({
      clusters: params.clusters,
      analysisScope,
      cacheVersion,
    }),
    body: {
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      initial_pressure_window: params.initialPressureWindow ?? null,
      initial_pressure_start: initialPressureStart,
      initial_pressure_end: initialPressureEnd,
      initial_time_zone: initialTimeZone,
      clusters: params.clusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.whySelected ?? undefined,
        risk_note: cluster.riskNote ?? undefined,
        safety_note: cluster.safetyNote ?? undefined,
      })),
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load Mailbox Intelligence.',
  })
}

export async function fetchGmailPressureTrend(params: {
  clusters: GmailCleanupClusterRef[]
  cacheVersion?: string | null
  pressureWindow: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
  signal?: AbortSignal
}): Promise<{ ok: true; data: GmailPressureTrendData } | { ok: false; error: string; aborted?: true }> {
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const pressureStart =
    typeof params.pressureStart === 'string' && params.pressureStart.trim()
      ? params.pressureStart.trim()
      : null
  const pressureEnd =
    typeof params.pressureEnd === 'string' && params.pressureEnd.trim()
      ? params.pressureEnd.trim()
      : null
  const timeZone =
    typeof params.timeZone === 'string' && params.timeZone.trim() ? params.timeZone.trim() : 'UTC'

  return requestCachedInboxAnalysis<GmailPressureTrendData>({
    action: 'mailbox_pressure_trend',
    cacheKey: pressureTrendCacheKey({
      clusters: params.clusters,
      cacheVersion,
      pressureWindow: params.pressureWindow,
      pressureStart,
      pressureEnd,
      timeZone,
    }),
    body: {
      cache_version: params.cacheVersion ?? null,
      pressure_window: params.pressureWindow,
      pressure_start: pressureStart,
      pressure_end: pressureEnd,
      time_zone: timeZone,
      clusters: params.clusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.whySelected ?? undefined,
        risk_note: cluster.riskNote ?? undefined,
        safety_note: cluster.safetyNote ?? undefined,
      })),
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load Pressure Trend.',
    signal: params.signal,
  })
}

export async function fetchGmailSenderWorkspace(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  includeClusterSenderKeys?: boolean
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
  semanticFocus?: GmailSenderWorkspaceSemanticFocus | null
  previewEvidenceSenderKey?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
  signal?: AbortSignal
}): Promise<{ ok: true; data: GmailSenderWorkspaceData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 12
  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const filter = params.filter ?? 'all'
  const sort = params.sort ?? 'message_count'
  const direction = params.direction ?? 'desc'
  const cacheVersion = params.cacheVersion?.trim() || 'default'
  const includeClusterSenderKeys = params.includeClusterSenderKeys === true

  return requestCachedInboxAnalysis<GmailSenderWorkspaceData>({
    action: 'sender_workspace',
    cacheKey: senderWorkspaceCacheKey({
      selectedCluster: params.selectedCluster,
      allClusters: params.allClusters,
      analysisScope,
      cacheVersion,
      includeClusterSenderKeys,
      page,
      pageSize,
      search,
      filter,
      sort,
      direction,
      semanticFocus: params.semanticFocus ?? null,
      previewEvidenceSenderKey: params.previewEvidenceSenderKey ?? null,
    }),
    body: {
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      selected_cluster: {
        cluster_id: params.selectedCluster.clusterId,
        canonical_cluster_id:
          typeof params.selectedCluster.canonicalClusterId === 'string' &&
          params.selectedCluster.canonicalClusterId.trim()
            ? params.selectedCluster.canonicalClusterId.trim()
            : undefined,
        legacy_cluster_ids:
          Array.isArray(params.selectedCluster.legacyClusterIds) &&
          params.selectedCluster.legacyClusterIds.length > 0
            ? params.selectedCluster.legacyClusterIds
            : undefined,
        cluster_type: params.selectedCluster.clusterType,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
        why_selected: params.selectedCluster.whySelected ?? undefined,
        risk_note: params.selectedCluster.riskNote ?? undefined,
        safety_note: params.selectedCluster.safetyNote ?? undefined,
        sender_count:
          typeof params.selectedCluster.senderCount === 'number' &&
          Number.isFinite(params.selectedCluster.senderCount)
            ? Math.max(0, Math.round(params.selectedCluster.senderCount))
            : undefined,
        message_count:
          typeof params.selectedCluster.messageCount === 'number' &&
          Number.isFinite(params.selectedCluster.messageCount)
            ? Math.max(0, Math.round(params.selectedCluster.messageCount))
            : undefined,
        estimated_count:
          typeof params.selectedCluster.estimatedCount === 'number' &&
          Number.isFinite(params.selectedCluster.estimatedCount)
            ? Math.max(0, Math.round(params.selectedCluster.estimatedCount))
            : undefined,
      },
      clusters: params.allClusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        canonical_cluster_id:
          typeof cluster.canonicalClusterId === 'string' && cluster.canonicalClusterId.trim()
            ? cluster.canonicalClusterId.trim()
            : undefined,
        legacy_cluster_ids:
          Array.isArray(cluster.legacyClusterIds) && cluster.legacyClusterIds.length > 0
            ? cluster.legacyClusterIds
            : undefined,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        sender_count:
          typeof cluster.senderCount === 'number' && Number.isFinite(cluster.senderCount)
            ? Math.max(0, Math.round(cluster.senderCount))
            : undefined,
        message_count:
          typeof cluster.messageCount === 'number' && Number.isFinite(cluster.messageCount)
            ? Math.max(0, Math.round(cluster.messageCount))
            : undefined,
        estimated_count:
          typeof cluster.estimatedCount === 'number' && Number.isFinite(cluster.estimatedCount)
            ? Math.max(0, Math.round(cluster.estimatedCount))
            : undefined,
      })),
      page,
      page_size: pageSize,
      include_cluster_sender_keys: includeClusterSenderKeys,
      search,
      filter,
      sort,
      direction,
      preview_evidence_sender_key:
        typeof params.previewEvidenceSenderKey === 'string' && params.previewEvidenceSenderKey.trim()
          ? params.previewEvidenceSenderKey.trim()
          : null,
      semantic_focus: params.semanticFocus
        ? {
            family: params.semanticFocus.family,
            kind: params.semanticFocus.kind,
            subtype_key: params.semanticFocus.subtypeKey,
            surfaced_subtype_keys: params.semanticFocus.surfacedSubtypeKeys,
          }
        : null,
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load sender workspace.',
    signal: params.signal,
  })
}

export async function fetchGmailSenderDistribution(params: {
  selectedCluster: GmailCleanupClusterRef
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  requestContext?: OperationsInboxAnalysisRequestContext
  signal?: AbortSignal
}): Promise<{ ok: true; data: GmailSenderDistributionData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const cacheVersion = params.cacheVersion?.trim() || 'default'

  return requestCachedInboxAnalysis<GmailSenderDistributionData>({
    action: 'sender_distribution',
    cacheKey: senderDistributionCacheKey({
      selectedCluster: params.selectedCluster,
      analysisScope,
      cacheVersion,
    }),
    body: {
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      selected_cluster: {
        cluster_id: params.selectedCluster.clusterId,
        canonical_cluster_id:
          typeof params.selectedCluster.canonicalClusterId === 'string' &&
          params.selectedCluster.canonicalClusterId.trim()
            ? params.selectedCluster.canonicalClusterId.trim()
            : undefined,
        legacy_cluster_ids:
          Array.isArray(params.selectedCluster.legacyClusterIds) &&
          params.selectedCluster.legacyClusterIds.length > 0
            ? params.selectedCluster.legacyClusterIds
            : undefined,
        source_cluster_ids:
          Array.isArray(params.selectedCluster.sourceClusterIds) &&
          params.selectedCluster.sourceClusterIds.length > 0
            ? params.selectedCluster.sourceClusterIds
            : undefined,
        cluster_type: params.selectedCluster.clusterType,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
        sender_count:
          typeof params.selectedCluster.senderCount === 'number' &&
          Number.isFinite(params.selectedCluster.senderCount)
            ? Math.max(0, Math.round(params.selectedCluster.senderCount))
            : undefined,
        message_count:
          typeof params.selectedCluster.messageCount === 'number' &&
          Number.isFinite(params.selectedCluster.messageCount)
            ? Math.max(0, Math.round(params.selectedCluster.messageCount))
            : undefined,
      },
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to load Sender Distribution.',
    signal: params.signal,
  })
}

export async function fetchGmailConfirmationPreview(params: {
  selectedCluster: GmailCleanupClusterRef
  allClusters: GmailCleanupClusterRef[]
  analysisScope?: OperationsAnalysisScope
  cacheVersion?: string | null
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
  requestContext?: OperationsInboxAnalysisRequestContext
}): Promise<{ ok: true; data: GmailConfirmationPreviewData } | { ok: false; error: string; aborted?: true }> {
  const analysisScope = normalizeOperationsAnalysisScope(params.analysisScope)
  const messageOverrides = params.messageOverrides || {}
  const cacheVersion = params.cacheVersion?.trim() || 'default'

  return requestCachedInboxAnalysis<GmailConfirmationPreviewData>({
    action: 'confirmation_preview',
    cacheKey: confirmationPreviewCacheKey({
      selectedCluster: params.selectedCluster,
      allClusters: params.allClusters,
      analysisScope,
      cacheVersion,
      senderPolicies: params.senderPolicies,
      messageOverrides,
    }),
    body: {
      analysis_scope: analysisScope,
      cache_version: params.cacheVersion ?? null,
      selected_cluster: {
        cluster_id: params.selectedCluster.clusterId,
        cluster_type: params.selectedCluster.clusterType,
        title: params.selectedCluster.title,
        query: params.selectedCluster.query,
      },
      clusters: params.allClusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
      })),
      sender_policies: params.senderPolicies,
      message_overrides: messageOverrides,
      ...contextParams(params.requestContext),
    },
    errorMessage: 'Failed to compute confirmation preview.',
  })
}

export async function fetchGmailMonitoringSummary(params: {
  agentId: string
  selectedCluster?: GmailCleanupClusterRef | null
  candidateSenders?: Array<{ senderKey: string; sender: string }>
}): Promise<{ ok: true; data: GmailMonitoringSummaryData } | { ok: false; error: string }> {
  const query = new URLSearchParams({ agent_id: params.agentId })
  if (params.selectedCluster?.clusterId) query.set('cluster_id', params.selectedCluster.clusterId)
  if (params.selectedCluster?.title) query.set('cluster_title', params.selectedCluster.title)
  if (params.candidateSenders && params.candidateSenders.length > 0) {
    query.set('senders', JSON.stringify(params.candidateSenders))
  }

  const res = await fetch(`/api/runtime/gmail-memory?${query.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; data?: GmailMonitoringSummaryData }
    | null

  if (!res.ok || !payload?.ok || !payload.data) {
    return { ok: false, error: payload?.error || 'Failed to load Monitoring summary.' }
  }
  return { ok: true, data: payload.data }
}

export async function fetchGmailDecisionManagementSummary(params: {
  agentId: string
}): Promise<{ ok: true; data: GmailDecisionManagementSummaryData } | { ok: false; error: string }> {
  const cacheKey = ['decision_management', params.agentId.trim()].join('::')
  const cached = readClientRuntimeSummaryCache<GmailDecisionManagementSummaryData>(cacheKey)
  if (cached) {
    return { ok: true, data: cached }
  }

  const inflight = gmailRuntimeSummaryClientInflight.get(cacheKey)
  if (inflight) {
    return (await inflight) as
      | { ok: true; data: GmailDecisionManagementSummaryData }
      | { ok: false; error: string }
  }

  const query = new URLSearchParams({
    agent_id: params.agentId,
    view: 'decision_management',
  })

  const request = (async (): Promise<
    { ok: true; data: GmailDecisionManagementSummaryData } | { ok: false; error: string }
  > => {
    const res = await fetch(`/api/runtime/gmail-memory?${query.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: string; data?: GmailDecisionManagementSummaryData }
      | null

    if (!res.ok || !payload?.ok || !payload.data) {
      return { ok: false, error: payload?.error || 'Failed to load Decision Management summary.' }
    }
    return { ok: true, data: writeClientRuntimeSummaryCache(cacheKey, payload.data) }
  })()

  gmailRuntimeSummaryClientInflight.set(cacheKey, request as Promise<unknown>)
  try {
    return await request
  } finally {
    gmailRuntimeSummaryClientInflight.delete(cacheKey)
  }
}

export async function persistGmailCleanupMemoryEvent(
  payload: GmailCleanupMemoryWritePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/runtime/gmail-memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
  if (!res.ok || !body?.ok) {
    return { ok: false, error: body?.error || 'Failed to store Gmail cleanup memory.' }
  }
  return { ok: true }
}
