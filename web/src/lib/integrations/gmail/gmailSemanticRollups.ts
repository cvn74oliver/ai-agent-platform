import {
  GMAIL_SEMANTIC_CONFIDENCE_LEVELS,
  GMAIL_SEMANTIC_FAMILIES,
  GMAIL_SEMANTIC_FAMILY_PROVENANCES,
  GMAIL_SEMANTIC_PATTERN_CLASSES,
  GMAIL_SEMANTIC_PATTERN_PROVENANCES,
  GMAIL_SEMANTIC_RESOLUTIONS,
  type GmailMailboxIntelligenceData,
  type GmailSemanticFamily,
  type GmailSemanticPatternClass,
  type GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'

type SemanticSenderLike = Pick<
  GmailSenderWorkspaceData['senders'][number],
  'semantic_family' | 'semantic_pattern'
>

function roundSharePct(count: number, total: number): number {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((count / total) * 100)
}

function familyIsUmbrella(family: GmailSemanticFamily): boolean {
  return (
    family === 'marketing_promotional' ||
    family === 'commerce_transactional' ||
    family === 'account_notification' ||
    family === 'social_community'
  )
}

type SubtypeAccumulator = {
  key: string
  label: string
  decomposition_path: string | null
  sender_count: number
  umbrella: boolean
  decomposition_status: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']['decomposition_status']
}

type FamilyAccumulator = {
  sender_count: number
  resolved_subtype_sender_count: number
  provisional_subtype_sender_count: number
  top_subtypes: Map<string, SubtypeAccumulator>
}

type PatternAccumulator = {
  sender_count: number
  resolved_subtype_sender_count: number
  provisional_subtype_sender_count: number
  top_subtypes: Map<string, SubtypeAccumulator>
}

function ensureFamilyAccumulator(
  counts: Map<GmailSemanticFamily, FamilyAccumulator>,
  family: GmailSemanticFamily
): FamilyAccumulator {
  const existing = counts.get(family)
  if (existing) return existing
  const created: FamilyAccumulator = {
    sender_count: 0,
    resolved_subtype_sender_count: 0,
    provisional_subtype_sender_count: 0,
    top_subtypes: new Map(),
  }
  counts.set(family, created)
  return created
}

function ensurePatternAccumulator(
  counts: Map<GmailSemanticPatternClass, PatternAccumulator>,
  patternClass: GmailSemanticPatternClass
): PatternAccumulator {
  const existing = counts.get(patternClass)
  if (existing) return existing
  const created: PatternAccumulator = {
    sender_count: 0,
    resolved_subtype_sender_count: 0,
    provisional_subtype_sender_count: 0,
    top_subtypes: new Map(),
  }
  counts.set(patternClass, created)
  return created
}

function updateSubtypeAccumulator(
  map: Map<string, SubtypeAccumulator>,
  params: {
    key: string
    label: string
    decompositionPath: string | null
    umbrella: boolean
    decompositionStatus: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']['decomposition_status']
  }
) {
  const existing = map.get(params.key)
  if (existing) {
    existing.sender_count += 1
    return
  }
  map.set(params.key, {
    key: params.key,
    label: params.label,
    decomposition_path: params.decompositionPath,
    sender_count: 1,
    umbrella: params.umbrella,
    decomposition_status: params.decompositionStatus,
  })
}

function topSubtypeEntries(
  entries: Map<string, SubtypeAccumulator>,
  totalSenders: number
): GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number]['top_subtypes'] {
  return Array.from(entries.values())
    .sort((left, right) => right.sender_count - left.sender_count || left.label.localeCompare(right.label))
    .slice(0, 4)
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      decomposition_path: entry.decomposition_path,
      sender_count: entry.sender_count,
      share_pct: roundSharePct(entry.sender_count, totalSenders),
      umbrella: entry.umbrella,
      decomposition_status: entry.decomposition_status,
    }))
}

function fixedDistribution<T extends string>(params: {
  options: readonly T[]
  totalSenders: number
  countForOption: (option: T) => number
}): Array<{ key: T; sender_count: number; share_pct: number }> {
  return params.options
    .map((option) => {
      const sender_count = params.countForOption(option)
      return {
        key: option,
        sender_count,
        share_pct: roundSharePct(sender_count, params.totalSenders),
      }
    })
    .filter((entry) => entry.sender_count > 0)
}

export function buildSemanticFamilyDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_family_distribution'] {
  const counts = new Map<GmailSemanticFamily, FamilyAccumulator>()
  for (const sender of senders) {
    const accumulator = ensureFamilyAccumulator(counts, sender.semantic_family.family)
    accumulator.sender_count += 1
    if (sender.semantic_family.subtype_key && sender.semantic_family.subtype_label) {
      updateSubtypeAccumulator(accumulator.top_subtypes, {
        key: sender.semantic_family.subtype_key,
        label: sender.semantic_family.subtype_label,
        decompositionPath: sender.semantic_family.decomposition_path,
        umbrella: sender.semantic_family.umbrella,
        decompositionStatus: sender.semantic_family.decomposition_status,
      })
    }
    if (
      sender.semantic_family.subtype_key &&
      sender.semantic_family.decomposition_status === 'resolved'
    ) {
      accumulator.resolved_subtype_sender_count += 1
    } else if (
      familyIsUmbrella(sender.semantic_family.family) ||
      sender.semantic_family.umbrella ||
      sender.semantic_family.decomposition_status !== 'not_applicable'
    ) {
      accumulator.provisional_subtype_sender_count += 1
    }
  }

  return GMAIL_SEMANTIC_FAMILIES.map((family) => {
    const accumulator = counts.get(family)
    if (!accumulator || accumulator.sender_count <= 0) return null
    return {
      family,
      sender_count: accumulator.sender_count,
      share_pct: roundSharePct(accumulator.sender_count, senders.length),
      umbrella: familyIsUmbrella(family),
      resolved_subtype_sender_count: accumulator.resolved_subtype_sender_count,
      provisional_subtype_sender_count: accumulator.provisional_subtype_sender_count,
      top_subtypes: topSubtypeEntries(accumulator.top_subtypes, senders.length),
    }
  })
    .filter(
      (
        entry
      ): entry is GmailSenderWorkspaceData['analytics']['semantic_family_distribution'][number] =>
        entry != null
    )
    .sort((left, right) => right.sender_count - left.sender_count || left.family.localeCompare(right.family))
}

export function buildSemanticPatternDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'] {
  const counts = new Map<GmailSemanticPatternClass, PatternAccumulator>()
  for (const sender of senders) {
    const accumulator = ensurePatternAccumulator(counts, sender.semantic_pattern.pattern_class)
    accumulator.sender_count += 1
    if (sender.semantic_pattern.subtype_key && sender.semantic_pattern.subtype_label) {
      updateSubtypeAccumulator(accumulator.top_subtypes, {
        key: sender.semantic_pattern.subtype_key,
        label: sender.semantic_pattern.subtype_label,
        decompositionPath: sender.semantic_pattern.decomposition_path,
        umbrella: sender.semantic_pattern.umbrella,
        decompositionStatus: sender.semantic_pattern.decomposition_status,
      })
    }
    if (
      sender.semantic_pattern.subtype_key &&
      !sender.semantic_pattern.umbrella &&
      sender.semantic_pattern.decomposition_status === 'resolved'
    ) {
      accumulator.resolved_subtype_sender_count += 1
    } else {
      accumulator.provisional_subtype_sender_count += 1
    }
  }

  return GMAIL_SEMANTIC_PATTERN_CLASSES.map((patternClass) => {
    const accumulator = counts.get(patternClass)
    if (!accumulator || accumulator.sender_count <= 0) return null
    return {
      pattern_class: patternClass,
      sender_count: accumulator.sender_count,
      share_pct: roundSharePct(accumulator.sender_count, senders.length),
      resolved_subtype_sender_count: accumulator.resolved_subtype_sender_count,
      provisional_subtype_sender_count: accumulator.provisional_subtype_sender_count,
      top_subtypes: topSubtypeEntries(accumulator.top_subtypes, senders.length),
    }
  })
    .filter(
      (
        entry
      ): entry is GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'][number] =>
        entry != null
    )
    .sort(
      (left, right) =>
        right.sender_count - left.sender_count ||
        left.pattern_class.localeCompare(right.pattern_class)
    )
}

export function buildSemanticResolutionDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution'] {
  const familyCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()
  for (const sender of senders) {
    familyCounts.set(
      sender.semantic_family.resolution,
      (familyCounts.get(sender.semantic_family.resolution) || 0) + 1
    )
    patternCounts.set(
      sender.semantic_pattern.resolution,
      (patternCounts.get(sender.semantic_pattern.resolution) || 0) + 1
    )
  }

  return [
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_RESOLUTIONS,
      totalSenders: senders.length,
      countForOption: (option) => familyCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'family' as const,
      resolution: key,
      sender_count,
      share_pct,
    })),
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_RESOLUTIONS,
      totalSenders: senders.length,
      countForOption: (option) => patternCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'pattern' as const,
      resolution: key,
      sender_count,
      share_pct,
    })),
  ]
}

export function buildSemanticConfidenceDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_confidence_distribution'] {
  const familyCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()
  for (const sender of senders) {
    familyCounts.set(
      sender.semantic_family.confidence,
      (familyCounts.get(sender.semantic_family.confidence) || 0) + 1
    )
    patternCounts.set(
      sender.semantic_pattern.confidence,
      (patternCounts.get(sender.semantic_pattern.confidence) || 0) + 1
    )
  }

  return [
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_CONFIDENCE_LEVELS,
      totalSenders: senders.length,
      countForOption: (option) => familyCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'family' as const,
      confidence: key,
      sender_count,
      share_pct,
    })),
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_CONFIDENCE_LEVELS,
      totalSenders: senders.length,
      countForOption: (option) => patternCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'pattern' as const,
      confidence: key,
      sender_count,
      share_pct,
    })),
  ]
}

export function buildSemanticProvenanceDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_provenance_distribution'] {
  const familyCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()
  for (const sender of senders) {
    familyCounts.set(
      sender.semantic_family.provenance,
      (familyCounts.get(sender.semantic_family.provenance) || 0) + 1
    )
    patternCounts.set(
      sender.semantic_pattern.provenance,
      (patternCounts.get(sender.semantic_pattern.provenance) || 0) + 1
    )
  }

  return [
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_FAMILY_PROVENANCES,
      totalSenders: senders.length,
      countForOption: (option) => familyCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'family' as const,
      provenance: key,
      sender_count,
      share_pct,
    })),
    ...fixedDistribution({
      options: GMAIL_SEMANTIC_PATTERN_PROVENANCES,
      totalSenders: senders.length,
      countForOption: (option) => patternCounts.get(option) || 0,
    }).map(({ key, sender_count, share_pct }) => ({
      scope: 'pattern' as const,
      provenance: key,
      sender_count,
      share_pct,
    })),
  ]
}

export function buildSemanticUmbrellaDistribution(
  senders: SemanticSenderLike[]
): GmailSenderWorkspaceData['analytics']['semantic_umbrella_distribution'] {
  let familyUmbrellaCount = 0
  let patternUmbrellaCount = 0
  for (const sender of senders) {
    if (sender.semantic_family.umbrella) familyUmbrellaCount += 1
    if (sender.semantic_pattern.umbrella) patternUmbrellaCount += 1
  }

  return [
    {
      scope: 'family',
      bucket: 'umbrella',
      sender_count: familyUmbrellaCount,
      share_pct: roundSharePct(familyUmbrellaCount, senders.length),
    },
    {
      scope: 'family',
      bucket: 'non_umbrella',
      sender_count: Math.max(senders.length - familyUmbrellaCount, 0),
      share_pct: roundSharePct(Math.max(senders.length - familyUmbrellaCount, 0), senders.length),
    },
    {
      scope: 'pattern',
      bucket: 'umbrella',
      sender_count: patternUmbrellaCount,
      share_pct: roundSharePct(patternUmbrellaCount, senders.length),
    },
    {
      scope: 'pattern',
      bucket: 'non_umbrella',
      sender_count: Math.max(senders.length - patternUmbrellaCount, 0),
      share_pct: roundSharePct(Math.max(senders.length - patternUmbrellaCount, 0), senders.length),
    },
  ]
}

export function buildSemanticAnalyticsDistributions(
  senders: SemanticSenderLike[]
): Pick<
  GmailSenderWorkspaceData['analytics'],
  | 'semantic_family_distribution'
  | 'semantic_pattern_distribution'
  | 'semantic_resolution_distribution'
  | 'semantic_confidence_distribution'
  | 'semantic_provenance_distribution'
  | 'semantic_umbrella_distribution'
> {
  return {
    semantic_family_distribution: buildSemanticFamilyDistribution(senders),
    semantic_pattern_distribution: buildSemanticPatternDistribution(senders),
    semantic_resolution_distribution: buildSemanticResolutionDistribution(senders),
    semantic_confidence_distribution: buildSemanticConfidenceDistribution(senders),
    semantic_provenance_distribution: buildSemanticProvenanceDistribution(senders),
    semantic_umbrella_distribution: buildSemanticUmbrellaDistribution(senders),
  }
}

export function buildCompatibilityOperatorProfileFamilyDistribution(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_family_distribution']
): GmailSenderWorkspaceData['analytics']['operator_profile_family_distribution'] {
  return distribution.map((entry) => ({
    family: entry.family,
    sender_count: entry.sender_count,
    share_pct: entry.share_pct,
  }))
}

export function semanticPatternClassLabel(patternClass: GmailSemanticPatternClass): string {
  switch (patternClass) {
    case 'promotional_cycle':
      return 'Promotional cycle'
    case 'transactional_cycle':
      return 'Transactional cycle'
    case 'service_update_cycle':
      return 'Service / account updates'
    case 'security_cycle':
      return 'Security alerts'
    case 'social_activity_cycle':
      return 'Social activity'
    case 'human_correspondence_cycle':
      return 'Human correspondence'
  }
}

export function dominantPatternCompatibilityLabel(
  entry: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution'][number] | null
): string | null {
  if (!entry) return null
  const topSubtype = entry.top_subtypes[0] || null
  if (
    topSubtype &&
    !topSubtype.umbrella &&
    topSubtype.decomposition_status === 'resolved' &&
    topSubtype.sender_count >= Math.ceil(entry.sender_count / 2)
  ) {
    return topSubtype.label
  }
  return semanticPatternClassLabel(entry.pattern_class)
}

export function buildCompatibilityDominantPatternDistribution(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution']
): GmailSenderWorkspaceData['analytics']['dominant_pattern_distribution'] {
  return distribution.map((entry) => ({
    pattern: dominantPatternCompatibilityLabel(entry) || semanticPatternClassLabel(entry.pattern_class),
    sender_count: entry.sender_count,
    share_pct: entry.share_pct,
  }))
}

export function buildCompatibilityOperatorProfileModeDistribution(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution']
): GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'] {
  const familyDistribution = distribution.filter((entry) => entry.scope === 'family')
  const countForResolution = (resolution: 'clear' | 'mixed' | 'thin_history') =>
    familyDistribution.find((entry) => entry.resolution === resolution)?.sender_count || 0
  const totalSenders = familyDistribution.reduce((sum, entry) => sum + entry.sender_count, 0)

  const entries: GmailSenderWorkspaceData['analytics']['operator_profile_mode_distribution'] = [
    {
      mode: 'clear',
      sender_count: countForResolution('clear'),
      share_pct: roundSharePct(countForResolution('clear'), totalSenders),
    },
    {
      mode: 'mixed',
      sender_count: countForResolution('mixed'),
      share_pct: roundSharePct(countForResolution('mixed'), totalSenders),
    },
    {
      mode: 'insufficient_data',
      sender_count: countForResolution('thin_history'),
      share_pct: roundSharePct(countForResolution('thin_history'), totalSenders),
    },
  ]

  return entries.filter((entry) => entry.sender_count > 0)
}

export function countUncertainSemanticSenders(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_resolution_distribution']
): number {
  return distribution
    .filter((entry) => entry.scope === 'family' && entry.resolution !== 'clear')
    .reduce((sum, entry) => sum + entry.sender_count, 0)
}

export function dominantSemanticFamily(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_family_distribution']
): GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_family'] {
  return distribution[0]?.family || null
}

export function dominantSemanticPattern(
  distribution: GmailSenderWorkspaceData['analytics']['semantic_pattern_distribution']
): GmailMailboxIntelligenceData['cleanup_groups'][number]['dominant_semantic_pattern'] {
  return distribution[0]?.pattern_class || null
}
