export const GMAIL_CLEANUP_GROUP_LANES = [
  'action',
  'backlog',
  'coverage',
  'secondary',
  'context',
] as const

export type GmailCleanupGroupLane = (typeof GMAIL_CLEANUP_GROUP_LANES)[number]

export const GMAIL_CLEANUP_GROUP_TYPES = [
  'semantic',
  'structural',
  'exception',
  'protected',
  'secondary',
  'context',
] as const

export type GmailCleanupGroupType = (typeof GMAIL_CLEANUP_GROUP_TYPES)[number]

export const GMAIL_CLEANUP_GROUP_SURFACED_STATUSES = ['surfaced', 'hidden_alias_only'] as const

export type GmailCleanupGroupSurfacedStatus =
  (typeof GMAIL_CLEANUP_GROUP_SURFACED_STATUSES)[number]

export const GMAIL_CLEANUP_GROUP_ALIAS_KINDS = ['legacy', 'transitional_surface'] as const

export type GmailCleanupGroupAliasKind = (typeof GMAIL_CLEANUP_GROUP_ALIAS_KINDS)[number]

export type CleanupCanonicalGroupAlias = {
  clusterId: string
  kind: GmailCleanupGroupAliasKind
}

export type CleanupCanonicalGroupDescriptor = {
  canonicalClusterId: string
  aliases: CleanupCanonicalGroupAlias[]
  lane: GmailCleanupGroupLane
  groupType: GmailCleanupGroupType
  surfacedStatus: GmailCleanupGroupSurfacedStatus
  displayPriority: number
  primaryEntryEligible: boolean
}

export type CleanupGroupFutureCanonicalPublishIdentity = {
  canonicalClusterId: string
  legacyClusterIds: string[]
  sourceClusterIds: string[]
}

type CleanupCanonicalGroupRegistryEntry = CleanupCanonicalGroupDescriptor

export const GMAIL_CLEANUP_CANONICAL_GROUP_REGISTRY = [
  {
    canonicalClusterId: 'semantic.marketing_subscriptions',
    aliases: [
      { clusterId: 'subscription-senders', kind: 'legacy' },
      {
        clusterId: 'semantic-parent:subscription-senders:family:marketing_promotional',
        kind: 'transitional_surface',
      },
    ],
    lane: 'action',
    groupType: 'semantic',
    surfacedStatus: 'surfaced',
    displayPriority: 100,
    primaryEntryEligible: true,
  },
  {
    canonicalClusterId: 'structural.backlog',
    aliases: [{ clusterId: 'dormant-backlog-senders', kind: 'legacy' }],
    lane: 'backlog',
    groupType: 'structural',
    surfacedStatus: 'surfaced',
    displayPriority: 200,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'structural.unresolved',
    aliases: [{ clusterId: 'needs-review-senders', kind: 'legacy' }],
    lane: 'coverage',
    groupType: 'exception',
    surfacedStatus: 'surfaced',
    displayPriority: 300,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'structural.protected_trust',
    aliases: [{ clusterId: 'protected-trusted-senders', kind: 'legacy' }],
    lane: 'coverage',
    groupType: 'protected',
    surfacedStatus: 'surfaced',
    displayPriority: 310,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'secondary.system_notifications',
    aliases: [{ clusterId: 'system-notification-senders', kind: 'legacy' }],
    lane: 'secondary',
    groupType: 'secondary',
    surfacedStatus: 'surfaced',
    displayPriority: 400,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'context.historical',
    aliases: [{ clusterId: 'historical-out-of-inbox-senders', kind: 'legacy' }],
    lane: 'context',
    groupType: 'context',
    surfacedStatus: 'surfaced',
    displayPriority: 500,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'secondary.social_community',
    aliases: [{ clusterId: 'social-platform-senders', kind: 'legacy' }],
    lane: 'secondary',
    groupType: 'secondary',
    surfacedStatus: 'surfaced',
    displayPriority: 610,
    primaryEntryEligible: false,
  },
  {
    canonicalClusterId: 'secondary.commerce_activity',
    aliases: [{ clusterId: 'retail-commerce-senders', kind: 'legacy' }],
    lane: 'secondary',
    groupType: 'secondary',
    surfacedStatus: 'hidden_alias_only',
    displayPriority: 620,
    primaryEntryEligible: false,
  },
] as const satisfies readonly CleanupCanonicalGroupRegistryEntry[]

export type CleanupClusterIdentitySource = {
  clusterId: string
  canonicalClusterId?: string | null
  legacyClusterIds?: string[] | null
  sourceClusterIds?: string[] | null
}

export type CleanupClusterIdentityResolution = 'canonical' | 'legacy_alias' | 'unresolved'

export type CleanupClusterDescriptorResolution =
  | 'canonical'
  | 'transitional_alias'
  | 'legacy_alias'
  | 'source_alias'
  | 'unresolved'

export type ResolvedCleanupClusterIdentity = {
  requestedClusterId: string
  canonicalClusterId: string | null
  matchedClusterId: string | null
  matchedLegacyClusterId: string | null
  legacyClusterIds: string[]
  sourceClusterIds: string[]
  resolution: CleanupClusterIdentityResolution
  canonicalDescriptor: CleanupCanonicalGroupDescriptor | null
  descriptorResolution: CleanupClusterDescriptorResolution
  matchedDescriptorAliasId: string | null
  matchedDescriptorAliasKind: GmailCleanupGroupAliasKind | 'source' | null
}

type CleanupClusterAliasLookupEntry = {
  descriptor: CleanupCanonicalGroupDescriptor
  alias: CleanupCanonicalGroupAlias
}

function normalizeClusterId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueClusterIds(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeClusterId(value)).filter(Boolean)))
}

function descriptorLegacyClusterIds(
  descriptor: CleanupCanonicalGroupDescriptor | null | undefined
): string[] {
  if (!descriptor) return []
  return uniqueClusterIds(
    descriptor.aliases
      .filter((alias) => alias.kind === 'legacy')
      .map((alias) => alias.clusterId)
  )
}

function descriptorTransitionalClusterIds(
  descriptor: CleanupCanonicalGroupDescriptor | null | undefined
): string[] {
  if (!descriptor) return []
  return uniqueClusterIds(
    descriptor.aliases
      .filter((alias) => alias.kind === 'transitional_surface')
      .map((alias) => alias.clusterId)
  )
}

function normalizeCleanupCanonicalGroupDescriptor(
  entry: CleanupCanonicalGroupRegistryEntry
): CleanupCanonicalGroupDescriptor {
  return {
    canonicalClusterId: normalizeClusterId(entry.canonicalClusterId),
    aliases: uniqueClusterIds(entry.aliases.map((alias) => alias.clusterId)).map((clusterId) => {
      const alias = entry.aliases.find((entryAlias) => normalizeClusterId(entryAlias.clusterId) === clusterId)
      if (!alias) {
        throw new Error(
          `[gmail-cleanup-cluster-identity] Missing alias metadata for ${clusterId}.`
        )
      }
      return {
        clusterId,
        kind: alias.kind,
      }
    }),
    lane: entry.lane,
    groupType: entry.groupType,
    surfacedStatus: entry.surfacedStatus,
    displayPriority: entry.displayPriority,
    primaryEntryEligible: entry.primaryEntryEligible,
  }
}

const cleanupCanonicalRegistryDescriptors = GMAIL_CLEANUP_CANONICAL_GROUP_REGISTRY.map(
  normalizeCleanupCanonicalGroupDescriptor
)

const cleanupCanonicalDescriptorById = new Map<string, CleanupCanonicalGroupDescriptor>()
const cleanupCanonicalDescriptorByAliasId = new Map<string, CleanupClusterAliasLookupEntry>()

for (const descriptor of cleanupCanonicalRegistryDescriptors) {
  if (!descriptor.canonicalClusterId) {
    throw new Error('[gmail-cleanup-cluster-identity] Canonical cleanup cluster ids must be non-empty.')
  }
  const existingDescriptor = cleanupCanonicalDescriptorById.get(descriptor.canonicalClusterId)
  if (existingDescriptor) {
    throw new Error(
      `[gmail-cleanup-cluster-identity] Duplicate canonical cleanup cluster id: ${descriptor.canonicalClusterId}`
    )
  }
  cleanupCanonicalDescriptorById.set(descriptor.canonicalClusterId, descriptor)

  for (const alias of descriptor.aliases) {
    if (alias.clusterId === descriptor.canonicalClusterId) {
      throw new Error(
        `[gmail-cleanup-cluster-identity] Alias duplicates canonical cleanup cluster id: ${alias.clusterId}`
      )
    }
    const existingAlias = cleanupCanonicalDescriptorByAliasId.get(alias.clusterId)
    if (existingAlias) {
      throw new Error(
        `[gmail-cleanup-cluster-identity] Duplicate cleanup cluster alias: ${alias.clusterId}`
      )
    }
    cleanupCanonicalDescriptorByAliasId.set(alias.clusterId, {
      descriptor,
      alias,
    })
  }
}

function resolveCleanupCanonicalDescriptorForId(
  clusterId: string | null | undefined
): {
  descriptor: CleanupCanonicalGroupDescriptor
  resolution: CleanupClusterDescriptorResolution
  matchedAliasId: string | null
  matchedAliasKind: GmailCleanupGroupAliasKind | 'source' | null
} | null {
  const normalizedId = normalizeClusterId(clusterId)
  if (!normalizedId) return null

  const descriptor = cleanupCanonicalDescriptorById.get(normalizedId)
  if (descriptor) {
    return {
      descriptor,
      resolution: 'canonical',
      matchedAliasId: null,
      matchedAliasKind: null,
    }
  }

  const aliasEntry = cleanupCanonicalDescriptorByAliasId.get(normalizedId)
  if (aliasEntry) {
    return {
      descriptor: aliasEntry.descriptor,
      resolution: aliasEntry.alias.kind === 'transitional_surface' ? 'transitional_alias' : 'legacy_alias',
      matchedAliasId: aliasEntry.alias.clusterId,
      matchedAliasKind: aliasEntry.alias.kind,
    }
  }

  return null
}

function runtimeLegacyClusterIdsForSource(source: CleanupClusterIdentitySource): string[] {
  const sourceClusterId = normalizeClusterId(source.clusterId)
  const canonicalClusterId = normalizeClusterId(source.canonicalClusterId) || sourceClusterId
  return uniqueClusterIds([
    ...(Array.isArray(source.legacyClusterIds) ? source.legacyClusterIds : []),
    sourceClusterId && sourceClusterId !== canonicalClusterId ? sourceClusterId : '',
  ])
}

function sourceClusterIdsForSource(source: CleanupClusterIdentitySource): string[] {
  return uniqueClusterIds(Array.isArray(source.sourceClusterIds) ? source.sourceClusterIds : [])
}

function resolveCleanupCanonicalDescriptorFromSource(
  source: CleanupClusterIdentitySource
): CleanupCanonicalGroupDescriptor | null {
  const candidates = uniqueClusterIds([
    normalizeClusterId(source.canonicalClusterId),
    normalizeClusterId(source.clusterId),
    ...(Array.isArray(source.legacyClusterIds) ? source.legacyClusterIds : []),
    ...(Array.isArray(source.sourceClusterIds) ? source.sourceClusterIds : []),
  ])

  for (const candidate of candidates) {
    const resolved = resolveCleanupCanonicalDescriptorForId(candidate)
    if (resolved) {
      return resolved.descriptor
    }
  }

  return null
}

function buildResolvedCleanupClusterIdentity(params: {
  requestedClusterId: string
  canonicalClusterId: string | null
  matchedClusterId: string | null
  matchedLegacyClusterId: string | null
  legacyClusterIds: string[]
  sourceClusterIds?: string[]
  resolution: CleanupClusterIdentityResolution
  canonicalDescriptor?: CleanupCanonicalGroupDescriptor | null
  descriptorResolution?: CleanupClusterDescriptorResolution
  matchedDescriptorAliasId?: string | null
  matchedDescriptorAliasKind?: GmailCleanupGroupAliasKind | 'source' | null
}): ResolvedCleanupClusterIdentity {
  return {
    requestedClusterId: params.requestedClusterId,
    canonicalClusterId: params.canonicalClusterId,
    matchedClusterId: params.matchedClusterId,
    matchedLegacyClusterId: params.matchedLegacyClusterId,
    legacyClusterIds: params.legacyClusterIds,
    sourceClusterIds: params.sourceClusterIds ?? [],
    resolution: params.resolution,
    canonicalDescriptor: params.canonicalDescriptor ?? null,
    descriptorResolution: params.descriptorResolution ?? 'unresolved',
    matchedDescriptorAliasId: params.matchedDescriptorAliasId ?? null,
    matchedDescriptorAliasKind: params.matchedDescriptorAliasKind ?? null,
  }
}

function runtimeDescriptorContext(
  descriptor: CleanupCanonicalGroupDescriptor,
  sources: CleanupClusterIdentitySource[]
): {
  legacyClusterIds: string[]
  sourceClusterIds: string[]
} {
  const matchedSources = sources.filter((source) => {
    const sourceDescriptor = resolveCleanupCanonicalDescriptorFromSource(source)
    return sourceDescriptor?.canonicalClusterId === descriptor.canonicalClusterId
  })

  return {
    legacyClusterIds: uniqueClusterIds([
      ...descriptorLegacyClusterIds(descriptor),
      ...matchedSources.flatMap((source) => runtimeLegacyClusterIdsForSource(source)),
    ]),
    sourceClusterIds: uniqueClusterIds([
      ...descriptorTransitionalClusterIds(descriptor),
      ...matchedSources.flatMap((source) => sourceClusterIdsForSource(source)),
    ]),
  }
}

export function getCleanupCanonicalGroupDescriptor(
  canonicalClusterId: string | null | undefined
): CleanupCanonicalGroupDescriptor | null {
  return cleanupCanonicalDescriptorById.get(normalizeClusterId(canonicalClusterId)) || null
}

export function listCleanupCanonicalGroupDescriptors(): CleanupCanonicalGroupDescriptor[] {
  return cleanupCanonicalRegistryDescriptors.slice()
}

export function buildCleanupGroupFutureCanonicalPublishIdentity(
  clusterId: string | null | undefined
): CleanupGroupFutureCanonicalPublishIdentity | null {
  const normalizedId = normalizeClusterId(clusterId)
  if (!normalizedId) return null

  const resolved = resolveCleanupCanonicalDescriptorForId(normalizedId)
  if (!resolved) {
    return {
      canonicalClusterId: normalizedId,
      legacyClusterIds: [],
      sourceClusterIds: [normalizedId],
    }
  }

  const descriptor = resolved.descriptor
  const legacyClusterIds = descriptorLegacyClusterIds(descriptor)
  const sourceClusterIds = uniqueClusterIds([
    ...descriptorTransitionalClusterIds(descriptor),
    ...legacyClusterIds,
    normalizedId !== descriptor.canonicalClusterId ? normalizedId : '',
  ])

  return {
    canonicalClusterId: descriptor.canonicalClusterId,
    legacyClusterIds,
    sourceClusterIds,
  }
}

export function resolveCleanupClusterIdentity(
  requestedClusterId: string | null | undefined,
  sources: CleanupClusterIdentitySource[]
): ResolvedCleanupClusterIdentity {
  const requestedId = normalizeClusterId(requestedClusterId)
  if (!requestedId) {
    return buildResolvedCleanupClusterIdentity({
      requestedClusterId: '',
      canonicalClusterId: null,
      matchedClusterId: null,
      matchedLegacyClusterId: null,
      legacyClusterIds: [],
      sourceClusterIds: [],
      resolution: 'unresolved',
    })
  }

  for (const source of sources) {
    const sourceClusterId = normalizeClusterId(source.clusterId)
    const canonicalClusterId = normalizeClusterId(source.canonicalClusterId) || sourceClusterId
    if (!canonicalClusterId) continue

    const legacyClusterIds = runtimeLegacyClusterIdsForSource(source)
    const sourceClusterIds = sourceClusterIdsForSource(source)

    if (requestedId === canonicalClusterId) {
      const descriptorMatch =
        resolveCleanupCanonicalDescriptorForId(canonicalClusterId) ||
        resolveCleanupCanonicalDescriptorForId(sourceClusterId)
      const descriptorContext = descriptorMatch
        ? runtimeDescriptorContext(descriptorMatch.descriptor, sources)
        : {
            legacyClusterIds: [],
            sourceClusterIds: [],
          }

      return buildResolvedCleanupClusterIdentity({
        requestedClusterId: requestedId,
        canonicalClusterId,
        matchedClusterId: canonicalClusterId,
        matchedLegacyClusterId: null,
        legacyClusterIds,
        sourceClusterIds: uniqueClusterIds([
          ...sourceClusterIds,
          ...descriptorContext.sourceClusterIds,
        ]),
        resolution: 'canonical',
        canonicalDescriptor: descriptorMatch?.descriptor ?? null,
        descriptorResolution: descriptorMatch?.resolution ?? 'unresolved',
        matchedDescriptorAliasId: descriptorMatch?.matchedAliasId ?? null,
        matchedDescriptorAliasKind: descriptorMatch?.matchedAliasKind ?? null,
      })
    }

    const matchedLegacyClusterId = legacyClusterIds.find((legacyId) => legacyId === requestedId) || null
    if (matchedLegacyClusterId) {
      const descriptorMatch =
        resolveCleanupCanonicalDescriptorForId(matchedLegacyClusterId) ||
        resolveCleanupCanonicalDescriptorForId(canonicalClusterId) ||
        resolveCleanupCanonicalDescriptorForId(sourceClusterId)
      const descriptorContext = descriptorMatch
        ? runtimeDescriptorContext(descriptorMatch.descriptor, sources)
        : {
            legacyClusterIds: [],
            sourceClusterIds: [],
          }

      return buildResolvedCleanupClusterIdentity({
        requestedClusterId: requestedId,
        canonicalClusterId,
        matchedClusterId: canonicalClusterId,
        matchedLegacyClusterId,
        legacyClusterIds,
        sourceClusterIds: uniqueClusterIds([
          ...sourceClusterIds,
          ...descriptorContext.sourceClusterIds,
        ]),
        resolution: 'legacy_alias',
        canonicalDescriptor: descriptorMatch?.descriptor ?? null,
        descriptorResolution: descriptorMatch?.resolution ?? 'legacy_alias',
        matchedDescriptorAliasId: descriptorMatch?.matchedAliasId ?? matchedLegacyClusterId,
        matchedDescriptorAliasKind: descriptorMatch?.matchedAliasKind ?? 'legacy',
      })
    }
  }

  const descriptorMatch = resolveCleanupCanonicalDescriptorForId(requestedId)
  if (descriptorMatch) {
    const descriptorContext = runtimeDescriptorContext(descriptorMatch.descriptor, sources)
    return buildResolvedCleanupClusterIdentity({
      requestedClusterId: requestedId,
      canonicalClusterId: null,
      matchedClusterId: null,
      matchedLegacyClusterId: null,
      legacyClusterIds: descriptorContext.legacyClusterIds,
      sourceClusterIds: descriptorContext.sourceClusterIds,
      resolution: 'unresolved',
      canonicalDescriptor: descriptorMatch.descriptor,
      descriptorResolution: descriptorMatch.resolution,
      matchedDescriptorAliasId: descriptorMatch.matchedAliasId,
      matchedDescriptorAliasKind: descriptorMatch.matchedAliasKind,
    })
  }

  for (const source of sources) {
    const descriptor = resolveCleanupCanonicalDescriptorFromSource(source)
    if (!descriptor) continue
    const sourceClusterIds = runtimeDescriptorContext(descriptor, [source]).sourceClusterIds
    const matchedSourceClusterId = sourceClusterIds.find((sourceClusterId) => sourceClusterId === requestedId)
    if (!matchedSourceClusterId) continue

    const descriptorContext = runtimeDescriptorContext(descriptor, sources)
    return buildResolvedCleanupClusterIdentity({
      requestedClusterId: requestedId,
      canonicalClusterId: null,
      matchedClusterId: null,
      matchedLegacyClusterId: null,
      legacyClusterIds: descriptorContext.legacyClusterIds,
      sourceClusterIds: descriptorContext.sourceClusterIds,
      resolution: 'unresolved',
      canonicalDescriptor: descriptor,
      descriptorResolution: 'source_alias',
      matchedDescriptorAliasId: matchedSourceClusterId,
      matchedDescriptorAliasKind: 'source',
    })
  }

  return buildResolvedCleanupClusterIdentity({
    requestedClusterId: requestedId,
    canonicalClusterId: null,
    matchedClusterId: null,
    matchedLegacyClusterId: null,
    legacyClusterIds: [],
    sourceClusterIds: [],
    resolution: 'unresolved',
  })
}

export function listCleanupClusterIdentityKeys(
  identity: ResolvedCleanupClusterIdentity | null | undefined
): string[] {
  if (!identity?.canonicalClusterId) return []
  return uniqueClusterIds([identity.canonicalClusterId, ...identity.legacyClusterIds])
}
