import type {
  GmailSenderWorkspaceData,
  GmailSemanticFamily,
  GmailSemanticGroupPolicyMode,
  GmailSharedGroupSemanticRollup,
  GmailSharedGroupSemanticRollupFamilyLane,
} from '@/lib/runtime/gmailCleanupWorkspace'

type SemanticRowDisplayMode = 'hidden' | 'summary' | 'expanded'

type SemanticDistributionRowModel = {
  id: string
  label: string
  value: string
  detail: string | null
  widthPct: number
}

type SemanticDistributionChildRowModel = SemanticDistributionRowModel & {
  senderCount: number
  groupSharePct: number
  parentSharePct: number
  tone: 'resolved' | 'provisional' | 'unresolved'
  focusTarget: {
    family: GmailSemanticFamily
    subtypeKey: string | null
    kind: 'subtype' | 'remainder'
  }
}

type SemanticFamilyRowModel = SemanticDistributionRowModel & {
  children: SemanticDistributionChildRowModel[]
  expandable: boolean
  defaultExpanded: boolean
  expansionHint: string | null
}

type SemanticTrustBarModel = {
  key: string
  sharePct: number
  accentClass: string
}

type SemanticCoverageStatModel = {
  id: string
  label: string
  value: string
  detail: string
}

export type GmailSemanticPresentationPolicy = {
  mode: GmailSemanticGroupPolicyMode | 'neutral'
  badgeLabel: string
  leadingFamilyLabel: string | null
  topExplanation: {
    eyebrow: string
    title: string
    body: string
  }
  cleanupGroupCard: {
    headline: string
    support: string
    semanticSupport: string
    contextLabel: string
  }
  semanticRow: {
    sectionEyebrow: string
    sectionTitle: string
    sectionDescription: string
    primaryLabel: string
    primaryHeadline: string
    primaryDetail: string
    primaryFamilyRows: SemanticFamilyRowModel[]
    smallShareSummary: string | null
    decompositionTitle: string
    decompositionBadge: string | null
    decompositionMode: SemanticRowDisplayMode
    decompositionHeadline: string
    decompositionDetail: string
    decompositionCoverageStats: SemanticCoverageStatModel[]
    decompositionRows: SemanticDistributionRowModel[]
    trustTitle: string
    trustIntro: string
    trust: {
      resolutionLabel: string
      resolutionBars: SemanticTrustBarModel[]
      resolutionValue: string
      resolutionDetail: string
      confidenceLabel: string
      confidenceValue: string
      confidenceDetail: string
      provenanceLabel: string
      provenanceValue: string
      provenanceDetail: string
    }
    contributorTitle: string
    contributorDescription: string
  }
  senderCard: {
    surfaceTitle: string
    metricLabel: string
    familyLabel: string
    patternLabel: string
    usageLabel: string
    usageDetail: string
  }
}

export function gmailSemanticFamilyDisplayLabel(family: GmailSemanticFamily): string {
  if (family === 'marketing_promotional') return 'Marketing / promotional'
  if (family === 'commerce_transactional') return 'Commerce / shipping'
  if (family === 'account_notification') return 'Account / service updates'
  if (family === 'security_alert') return 'Security alerts'
  if (family === 'social_community') return 'Social / community'
  return 'Personal correspondence'
}

export function gmailSemanticPatternClassDisplayLabel(
  patternClass: GmailSenderWorkspaceData['senders'][number]['semantic_pattern']['pattern_class']
): string {
  if (patternClass === 'promotional_cycle') return 'Promotional cycle'
  if (patternClass === 'transactional_cycle') return 'Transactional cycle'
  if (patternClass === 'service_update_cycle') return 'Service / account updates'
  if (patternClass === 'security_cycle') return 'Security alerts'
  if (patternClass === 'social_activity_cycle') return 'Social activity'
  return 'Human correspondence'
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '0%'
  if (value < 1) return '<1%'
  return `${Math.round(value)}%`
}

function percentWidth(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(value, 100))
}

function ratioToPercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(value * 100, 100))
}

function formatRatioPercent(value: number | null | undefined): string {
  return formatPercent(ratioToPercent(value))
}

function ratioWidth(value: number | null | undefined): number {
  return percentWidth(ratioToPercent(value))
}

function formatSenderCount(value: number): string {
  return `${value.toLocaleString()} sender${value === 1 ? '' : 's'}`
}

function familyProvenanceLabel(
  provenance:
    | GmailSharedGroupSemanticRollup['trust']['provenance_distribution'][number]['provenance']
    | null
): string {
  if (provenance === 'operator_profile_compat') return 'Mostly from older sender-profile data'
  if (provenance === 'pattern_label_compat') return 'Mostly from older pattern labels'
  if (provenance === 'ranked_evidence_compat') return 'Mostly from sender and message evidence'
  if (provenance === 'subject_heuristic') return 'Mostly from subject-line clues'
  if (provenance === 'artifact_seed_compat') return 'Mostly from published seed data'
  return 'No single evidence source stands out yet'
}

function resolutionValueLabel(clearShare: number): string {
  if (clearShare < 50) return `Only ${formatPercent(clearShare)} fit one clear sender type`
  return `${formatPercent(clearShare)} fit one clear sender type`
}

function confidenceValueLabel(params: {
  clearShare: number
  highShare: number
  mediumShare: number
  lowShare: number
}): string {
  if (params.lowShare >= 30 || params.clearShare < 50) {
    return `Confidence is still limited (${formatPercent(params.lowShare)} low confidence)`
  }
  if (params.highShare >= 60 && params.clearShare >= 60) {
    return `Confidence looks strong (${formatPercent(params.highShare)} high confidence)`
  }
  if (params.mediumShare >= 40) {
    return `Confidence is mixed (${formatPercent(params.mediumShare)} medium confidence)`
  }
  const strongerShare = Math.max(params.highShare, params.mediumShare)
  if (strongerShare > 0) {
    return `Confidence looks steady (${formatPercent(strongerShare)} stronger confidence)`
  }
  return 'Confidence looks steady'
}

function leadingFamilyLane(
  rollup: GmailSharedGroupSemanticRollup
): GmailSharedGroupSemanticRollupFamilyLane | null {
  if (rollup.family_distribution.length === 0) return null
  return (
    rollup.family_distribution.find(
      (entry) => entry.family === rollup.headline.dominant_semantic_family
    ) || rollup.family_distribution[0]
  )
}

function subtypeSupportDetail(
  lane: GmailSharedGroupSemanticRollupFamilyLane | null,
  mode: GmailSemanticPresentationPolicy['mode']
): string {
  if (!lane) {
    if (mode === 'structural_only') {
      return 'Semantic mix is supporting context only while this group stays structurally framed.'
    }
    if (mode === 'structural_backlog') {
      return 'Semantic mix is supporting context only while backlog age remains the lead story.'
    }
    return 'Published semantic framing is still loading for this cleanup group.'
  }
  const topSubtype = lane.top_subtypes[0] || null
  if (mode === 'structural_only') {
    return topSubtype
      ? `${gmailSemanticFamilyDisplayLabel(lane.family)} is the biggest visible category here, with ${topSubtype.label} as the clearest subtype.`
      : `${gmailSemanticFamilyDisplayLabel(lane.family)} is the biggest visible category inside this structural group.`
  }
  if (mode === 'structural_backlog') {
    return topSubtype
      ? `${gmailSemanticFamilyDisplayLabel(lane.family)} is the biggest visible category in this backlog, with ${topSubtype.label} as the clearest subtype.`
      : `${gmailSemanticFamilyDisplayLabel(lane.family)} is the biggest visible category in this backlog.`
  }
  if (lane.subtype_persistence_state === 'survives' && topSubtype) {
    return `${topSubtype.label} is strong enough to stay visible inside ${gmailSemanticFamilyDisplayLabel(lane.family)}.`
  }
  if (lane.subtype_persistence_state === 'provisional' && topSubtype) {
    return `${topSubtype.label} is starting to split out, but it is not stable enough to lead on its own yet.`
  }
  return `${gmailSemanticFamilyDisplayLabel(lane.family)} is the right category to lead with here. Subtype detail stays hidden until it is stronger.`
}

function laneCoverageBreakdown(lane: GmailSharedGroupSemanticRollupFamilyLane | null): {
  resolvedSenderCount: number
  resolvedSharePct: number
  provisionalSenderCount: number
  provisionalSharePct: number
  unresolvedSenderCount: number
  unresolvedSharePct: number
} {
  if (!lane) {
    return {
      resolvedSenderCount: 0,
      resolvedSharePct: 0,
      provisionalSenderCount: 0,
      provisionalSharePct: 0,
      unresolvedSenderCount: 0,
      unresolvedSharePct: 0,
    }
  }

  const resolvedSenderCount = Math.max(0, lane.resolved_subtype_sender_count)
  const visibleSubtypeSenderCount = Math.min(
    lane.sender_count,
    leadSubtypeSenderCount(lane.top_subtypes)
  )
  const provisionalSenderCount = Math.max(0, visibleSubtypeSenderCount - resolvedSenderCount)
  const unresolvedSenderCount = Math.max(
    0,
    lane.sender_count - visibleSubtypeSenderCount
  )

  return {
    resolvedSenderCount,
    resolvedSharePct: Math.max(0, lane.resolved_subtype_coverage_pct),
    provisionalSenderCount,
    provisionalSharePct: Math.round(
      (provisionalSenderCount / Math.max(lane.sender_count, 1)) * 100
    ),
    unresolvedSenderCount,
    unresolvedSharePct: Math.round((unresolvedSenderCount / Math.max(lane.sender_count, 1)) * 100),
  }
}

function leadSubtypeSenderCount(topSubtypes: GmailSharedGroupSemanticRollupFamilyLane['top_subtypes']): number {
  return topSubtypes.reduce((sum, entry) => sum + Math.max(0, entry.sender_count), 0)
}

function buildFamilyChildRows(params: {
  lane: GmailSharedGroupSemanticRollupFamilyLane
  totalGroupSenders: number
  mode: GmailSemanticPresentationPolicy['mode']
}): SemanticDistributionChildRowModel[] {
  const familyLabel = gmailSemanticFamilyDisplayLabel(params.lane.family)
  const coverage = laneCoverageBreakdown(params.lane)
  const children: SemanticDistributionChildRowModel[] = params.lane.top_subtypes.map((entry) => ({
    id: `${params.lane.family}:${entry.key}`,
    label: entry.label,
    value: formatRatioPercent(
      Math.max(0, Math.min(entry.sender_count / Math.max(params.lane.sender_count, 1), 1))
    ),
    senderCount: entry.sender_count,
    groupSharePct: Math.max(0, Math.min(entry.share_pct, 100)),
    parentSharePct: Math.max(
      0,
      Math.min((entry.sender_count / Math.max(params.lane.sender_count, 1)) * 100, 100)
    ),
    detail: `${formatRatioPercent(
      Math.max(0, Math.min(entry.sender_count / Math.max(params.lane.sender_count, 1), 1))
    )} of ${familyLabel.toLowerCase()} · ${formatPercent(entry.share_pct)} of group · ${formatSenderCount(
      entry.sender_count
    )}.${
      params.mode === 'semantic_first'
        ? ' Visible inside the family, but not strong enough to replace the family headline yet.'
        : ' Supporting subtype detail only.'
    }`,
    widthPct: ratioWidth(
      Math.max(0, Math.min(entry.sender_count / Math.max(params.lane.sender_count, 1), 1))
    ),
    tone: params.lane.subtype_persistence_state === 'survives' ? 'resolved' : 'provisional',
    focusTarget: {
      family: params.lane.family,
      subtypeKey: entry.key,
      kind: 'subtype',
    },
  }))

  if (coverage.unresolvedSenderCount > 0) {
    children.push({
      id: `${params.lane.family}:unresolved`,
      label: `Still broad inside ${familyLabel}`,
      value: formatRatioPercent(
        Math.max(0, Math.min(coverage.unresolvedSenderCount / Math.max(params.lane.sender_count, 1), 1))
      ),
      senderCount: coverage.unresolvedSenderCount,
      groupSharePct: Math.max(
        0,
        Math.min((coverage.unresolvedSenderCount / Math.max(params.totalGroupSenders, 1)) * 100, 100)
      ),
      parentSharePct: Math.max(
        0,
        Math.min((coverage.unresolvedSenderCount / Math.max(params.lane.sender_count, 1)) * 100, 100)
      ),
      detail: `${formatRatioPercent(
        Math.max(0, Math.min(coverage.unresolvedSenderCount / Math.max(params.lane.sender_count, 1), 1))
      )} of ${familyLabel.toLowerCase()} · ${formatRatioPercent(
        Math.max(0, Math.min(coverage.unresolvedSenderCount / Math.max(params.totalGroupSenders, 1), 1))
      )} of group · ${formatSenderCount(
        coverage.unresolvedSenderCount
      )}. These senders still need the broader ${familyLabel.toLowerCase()} label, or only show subtype strands too small to surface clearly yet.`,
      widthPct: ratioWidth(
        Math.max(0, Math.min(coverage.unresolvedSenderCount / Math.max(params.lane.sender_count, 1), 1))
      ),
      tone: 'unresolved',
      focusTarget: {
        family: params.lane.family,
        subtypeKey: null,
        kind: 'remainder',
      },
    })
  }

  return children
}

export function buildGmailSemanticPresentationPolicy(
  rollup: GmailSharedGroupSemanticRollup | null
): GmailSemanticPresentationPolicy {
  if (!rollup) {
    return {
      mode: 'neutral',
      badgeLabel: 'Published framing pending',
      leadingFamilyLabel: null,
      topExplanation: {
        eyebrow: 'Group context',
        title: 'Published group framing is loading',
        body: 'This page will switch to published semantic framing as soon as the current artifact-backed rollup is available. Until then, use the sender list, safety notes, and evidence as the main guide.',
      },
      cleanupGroupCard: {
        headline: 'Published group framing is still loading for this cleanup group.',
        support:
          'Use the safety note and sender evidence while the page waits for the persisted semantic rollup.',
        semanticSupport: 'Descriptive semantic support will appear once the published rollup is ready.',
        contextLabel: 'Group context',
      },
      semanticRow: {
        sectionEyebrow: 'Supporting semantic mix',
        sectionTitle: 'Use semantic context only after the published rollup loads',
        sectionDescription:
          'This row stays intentionally neutral until published semantic framing is available.',
        primaryLabel: 'Published semantic family',
        primaryHeadline: 'Published semantic context is loading for this cleanup group.',
        primaryDetail:
          'The page will avoid semantic-first framing until the current artifact provides a canonical rollup.',
        primaryFamilyRows: [],
        smallShareSummary: null,
        decompositionTitle: "What's inside this category",
        decompositionBadge: null,
        decompositionMode: 'hidden',
        decompositionHeadline: 'Subtype detail will appear once the published rollup is ready.',
        decompositionDetail:
          'Subtype detail stays hidden until the canonical group rollup is available.',
        decompositionCoverageStats: [],
        decompositionRows: [],
        trustTitle: 'How reliable this read is',
        trustIntro:
          'Trust becomes meaningful once the published rollup is available for this cleanup group.',
        trust: {
          resolutionLabel: 'Clear sender type',
          resolutionBars: [],
          resolutionValue: 'Loading resolution',
          resolutionDetail: 'Resolution detail will appear once the current artifact-backed rollup is ready.',
          confidenceLabel: 'Confidence',
          confidenceValue: 'Loading confidence',
          confidenceDetail: 'Confidence detail will appear once the current artifact-backed rollup is ready.',
          provenanceLabel: 'Main evidence source',
          provenanceValue: 'Loading provenance',
          provenanceDetail: 'Evidence-source detail will appear once the current artifact-backed rollup is ready.',
        },
        contributorTitle: 'Keep contributor weight secondary to group context',
        contributorDescription:
          'Use message weight only after the published group framing is available.',
      },
      senderCard: {
        surfaceTitle: 'Semantic context',
        metricLabel: 'Semantic family',
        familyLabel: 'Semantic family',
        patternLabel: 'Pattern class',
        usageLabel: 'How to use this read',
        usageDetail:
          'Use the sender semantic read as supporting context only after the published group framing loads.',
      },
    }
  }

  const mode = rollup.group_policy_mode
  const familyLanes = rollup.family_distribution
  const leadLane = leadingFamilyLane(rollup)
  const leadFamilyLabel = leadLane ? gmailSemanticFamilyDisplayLabel(leadLane.family) : null
  const topSubtype = leadLane?.top_subtypes[0] || null
  const clearShare = rollup.trust.summary.family_clear_share_pct
  const lowConfidenceShare = rollup.trust.summary.family_low_confidence_share_pct
  const familyUmbrellaShare = rollup.trust.summary.family_umbrella_share_pct
  const familyMixedShare =
    rollup.trust.resolution_distribution.find(
      (entry) => entry.scope === 'family' && entry.resolution === 'mixed'
    )?.share_pct || 0
  const familyThinHistoryShare =
    rollup.trust.resolution_distribution.find(
      (entry) => entry.scope === 'family' && entry.resolution === 'thin_history'
    )?.share_pct || 0
  const highConfidenceShare =
    rollup.trust.confidence_distribution.find(
      (entry) => entry.scope === 'family' && entry.confidence === 'high'
    )?.share_pct || 0
  const mediumConfidenceShare =
    rollup.trust.confidence_distribution.find(
      (entry) => entry.scope === 'family' && entry.confidence === 'medium'
    )?.share_pct || 0
  const laneCoverage = laneCoverageBreakdown(leadLane)
  const leadFamilyLowerLabel = leadFamilyLabel ? leadFamilyLabel.toLowerCase() : 'this family'
  const familyProvenanceLeader =
    rollup.trust.provenance_distribution
      .filter((entry) => entry.scope === 'family')
      .slice()
      .sort(
        (left, right) =>
          right.sender_count - left.sender_count || left.provenance.localeCompare(right.provenance)
      )[0] || null

  const primaryFamilyRows = familyLanes
    .filter((entry) => entry.share_pct >= 1)
    .map((entry) => {
      const laneTopSubtype = entry.top_subtypes[0] || null
      const childRows = buildFamilyChildRows({
        lane: entry,
        totalGroupSenders: rollup.sender_basis.sender_count,
        mode,
      })
      let detail = `${formatSenderCount(entry.sender_count)} in this group.`
      if (entry.subtype_persistence_state === 'survives' && laneTopSubtype) {
        detail = `${detail} Clearest subtype: ${laneTopSubtype.label}.`
      } else if (entry.subtype_persistence_state === 'provisional' && laneTopSubtype) {
        detail = `${detail} Early split: ${laneTopSubtype.label}.`
      } else if (entry.umbrella) {
        detail = `${detail} Still a broad category.`
      }
      return {
        id: entry.family,
        label: gmailSemanticFamilyDisplayLabel(entry.family),
        value: formatPercent(entry.share_pct),
        detail,
        widthPct: percentWidth(entry.share_pct),
        children: childRows,
        expandable: childRows.length > 0,
        defaultExpanded:
          mode === 'semantic_first' &&
          entry.family === rollup.headline.dominant_semantic_family &&
          entry.share_pct > 50 &&
          childRows.length > 0,
        expansionHint:
          childRows.length > 0
            ? entry.subtype_persistence_state === 'survives'
              ? 'Expand to inspect the subtype breakdown.'
              : 'Expand to inspect the subtype breakdown without replacing the family headline.'
            : null,
      }
    })
  const visiblePrimaryFamilyRows =
    primaryFamilyRows.length > 0
      ? primaryFamilyRows
      : familyLanes.slice(0, 1).map((entry) => ({
          id: entry.family,
          label: gmailSemanticFamilyDisplayLabel(entry.family),
          value: formatPercent(entry.share_pct),
          detail: `${formatSenderCount(entry.sender_count)} in this group.`,
          widthPct: percentWidth(entry.share_pct),
          children: [],
          expandable: false,
          defaultExpanded: false,
          expansionHint: null,
        }))
  const smallShareLanes = familyLanes.filter((entry) => entry.share_pct < 1)
  const smallShareSummary =
    smallShareLanes.length === 0
      ? null
      : smallShareLanes
          .slice(0, 3)
          .map(
            (entry) =>
              `${gmailSemanticFamilyDisplayLabel(entry.family)} ${formatPercent(entry.share_pct)} (${formatSenderCount(entry.sender_count)})`
          )
          .join(' · ')

  const decompositionRows =
    mode === 'semantic_first' && leadLane?.top_subtypes.length
      ? [
          ...leadLane.top_subtypes.slice(0, 4).map((entry) => ({
            id: entry.key,
            label: entry.label,
            value: formatRatioPercent(
              Math.max(
                0,
                Math.min(entry.sender_count / Math.max(rollup.sender_basis.sender_count, 1), 1)
              )
            ),
            detail: `${formatSenderCount(entry.sender_count)} in this group. ${formatRatioPercent(
              Math.max(0, Math.min(entry.sender_count / Math.max(leadLane.sender_count, 1), 1))
            )} of ${gmailSemanticFamilyDisplayLabel(leadLane.family).toLowerCase()} senders.${
              leadLane.subtype_persistence_state === 'survives'
                ? ' Strong enough to keep visible without replacing the family headline.'
                : ' Visible inside the family, but not strong enough to replace the family headline yet.'
            }`,
            widthPct: ratioWidth(
              Math.max(
                0,
                Math.min(entry.sender_count / Math.max(rollup.sender_basis.sender_count, 1), 1)
              )
            ),
          })),
          ...(leadLane.subtype_persistence_state === 'provisional' && laneCoverage.unresolvedSenderCount > 0
            ? [
                {
                  id: 'unresolved_remainder',
                  label: `Still broad inside ${gmailSemanticFamilyDisplayLabel(leadLane.family)}`,
                  value: formatRatioPercent(
                    Math.max(
                      0,
                      Math.min(
                        laneCoverage.unresolvedSenderCount /
                          Math.max(rollup.sender_basis.sender_count, 1),
                        1
                      )
                    )
                  ),
                  detail: `${formatSenderCount(
                    laneCoverage.unresolvedSenderCount
                  )} in this group. ${formatPercent(
                    laneCoverage.unresolvedSharePct
                  )} of ${gmailSemanticFamilyDisplayLabel(
                    leadLane.family
                  ).toLowerCase()} senders still need the broad family label without a trustworthy subtype.`,
                  widthPct: ratioWidth(
                    Math.max(
                      0,
                      Math.min(
                        laneCoverage.unresolvedSenderCount /
                          Math.max(rollup.sender_basis.sender_count, 1),
                        1
                      )
                    )
                  ),
                },
              ]
            : []),
        ]
      : []

  const decompositionCoverageStats: SemanticCoverageStatModel[] =
    mode === 'semantic_first' && leadLane
      ? [
          {
            id: 'resolved',
            label: 'Named subtypes',
            value: formatPercent(laneCoverage.resolvedSharePct),
            detail: `${formatSenderCount(laneCoverage.resolvedSenderCount)} already resolve to named subtypes inside ${leadFamilyLowerLabel}.`,
          },
          {
            id: 'provisional',
            label: 'Early split signals',
            value: formatPercent(laneCoverage.provisionalSharePct),
            detail: `${formatSenderCount(laneCoverage.provisionalSenderCount)} show a subtype direction, but not strongly enough to treat as settled.`,
          },
          {
            id: 'unresolved',
            label: 'Still broad',
            value: formatPercent(laneCoverage.unresolvedSharePct),
            detail: `${formatSenderCount(laneCoverage.unresolvedSenderCount)} still need the broad family label, or only show subtype strands too small to surface clearly yet.`,
          },
        ]
      : []

  const badgeLabel =
    mode === 'structural_only'
      ? 'Structural group'
      : mode === 'structural_backlog'
        ? 'Backlog group'
        : 'Semantic group'

  const topExplanation =
    mode === 'structural_only'
      ? {
          eyebrow: 'Structural context',
          title: 'Why this group exists',
          body: leadFamilyLabel
            ? `This is a structural cleanup group. Grouping rules outrank semantic interpretation here, so ${leadFamilyLabel} only describes the biggest visible category inside the group rather than explaining why the group exists.`
            : 'This is a structural cleanup group. Grouping rules outrank semantic interpretation here, so semantic mix should be read as descriptive support only.',
        }
      : mode === 'structural_backlog'
        ? {
            eyebrow: 'Backlog context',
            title: 'Why this backlog exists',
            body: leadFamilyLabel
              ? `This is a backlog-framed cleanup group. Dormancy and low-attention age explain why these senders are together, while ${leadFamilyLabel} only describes the biggest visible category inside the backlog.`
              : 'This is a backlog-framed cleanup group. Dormancy and low-attention age explain why these senders are together, while semantic mix stays descriptive only.',
          }
        : {
            eyebrow: 'Semantic overview',
            title: 'Primary semantic story',
            body: leadFamilyLabel
              ? leadLane?.subtype_persistence_state === 'provisional'
                ? laneCoverage.provisionalSharePct > 0
                  ? `${leadFamilyLabel} currently leads this cleanup group at ${formatPercent(
                      leadLane?.share_pct || 0
                    )}. Named subtypes already explain ${formatPercent(
                      laneCoverage.resolvedSharePct
                    )} of that family, another ${formatPercent(
                      laneCoverage.provisionalSharePct
                    )} show an early split, and the rest still stays under the broader family.`
                  : `${leadFamilyLabel} currently leads this cleanup group at ${formatPercent(
                      leadLane?.share_pct || 0
                    )}. Named subtypes already explain ${formatPercent(
                      laneCoverage.resolvedSharePct
                    )} of that family, while the remaining ${formatPercent(
                      laneCoverage.unresolvedSharePct
                    )} still stays under the broader family.`
                : `${leadFamilyLabel} currently leads this cleanup group at ${formatPercent(
                    leadLane?.share_pct || 0
                  )}. Semantic meaning can headline this page here, while trust and subtype detail stay supporting context.`
              : 'This cleanup group is semantically framed first. Trust and subtype detail still stay supporting context behind the main semantic family.',
          }

  const cleanupGroupCard =
    mode === 'structural_only'
      ? {
          headline: leadFamilyLabel
            ? `Structural group first; ${leadFamilyLabel} is only the biggest descriptive category.`
            : 'Structural group first; semantic mix is descriptive support only.',
          support:
            'Use this group when you need to review a structural bucket, not when you need a clean semantic opportunity category.',
          semanticSupport: subtypeSupportDetail(leadLane, mode),
          contextLabel: 'Structural review context',
        }
      : mode === 'structural_backlog'
        ? {
            headline: leadFamilyLabel
              ? `Backlog group first; ${leadFamilyLabel} only describes the biggest category inside the backlog.`
              : 'Backlog group first; semantic mix only describes what sits in the backlog.',
            support:
              'Use this group when you want to work a stale backlog without letting semantic categories replace the dormancy frame.',
            semanticSupport: subtypeSupportDetail(leadLane, mode),
            contextLabel: 'Backlog review context',
          }
        : {
            headline: leadFamilyLabel
              ? `${leadFamilyLabel} is the clearest semantic family in this cleanup group.`
              : 'This cleanup group is semantically framed first.',
            support:
              leadLane?.subtype_persistence_state === 'survives' && topSubtype
                ? `${topSubtype.label} is strong enough to stay visible without replacing the main semantic family.`
                : subtypeSupportDetail(leadLane, mode),
            semanticSupport: subtypeSupportDetail(leadLane, mode),
            contextLabel: 'Semantic review context',
          }

  const semanticRow: GmailSemanticPresentationPolicy['semanticRow'] =
    mode === 'structural_only'
      ? {
          sectionEyebrow: 'Descriptive semantic mix',
          sectionTitle: 'Use sender meaning as descriptive support',
          sectionDescription:
            'This row explains what sits inside the group, not why the group exists. Structural routing still outranks semantic interpretation here.',
          primaryLabel: 'Biggest semantic family',
          primaryHeadline: leadFamilyLabel
            ? `${leadFamilyLabel} is the biggest visible semantic family inside this structural group.`
            : 'Semantic mix is descriptive support only for this structural group.',
          primaryDetail: subtypeSupportDetail(leadLane, mode),
          primaryFamilyRows: visiblePrimaryFamilyRows,
          smallShareSummary,
          decompositionTitle: 'Subtype status',
          decompositionBadge: topSubtype ? 'Supporting detail only' : null,
          decompositionMode: topSubtype ? 'summary' : 'hidden',
          decompositionHeadline: topSubtype
            ? `${topSubtype.label} is the clearest subtype we can see here.`
            : 'Subtype detail stays secondary for this structural group.',
          decompositionDetail:
            'This only describes the biggest visible category inside the group. It should not become the main reason to act.',
          decompositionCoverageStats: [],
          decompositionRows: [],
          trustTitle: 'How reliable this read is',
          trustIntro:
            'This helps you judge how stable the descriptive semantic read is. It does not replace the structural reason this group exists.',
          trust: {
            resolutionLabel: 'Clear sender type',
            resolutionBars: [
              { key: 'clear', sharePct: percentWidth(clearShare), accentClass: 'bg-emerald-500' },
              { key: 'mixed', sharePct: percentWidth(familyMixedShare), accentClass: 'bg-amber-400' },
              {
                key: 'thin_history',
                sharePct: percentWidth(familyThinHistoryShare),
                accentClass: 'bg-slate-400',
              },
            ],
            resolutionValue: resolutionValueLabel(clearShare),
            resolutionDetail: `${formatPercent(familyMixedShare)} show mixed behavior and ${formatPercent(
              familyThinHistoryShare
            )} still need more history. Structural routing still leads this page.`,
            confidenceLabel: 'Confidence',
            confidenceValue: confidenceValueLabel({
              clearShare,
              highShare: highConfidenceShare,
              mediumShare: mediumConfidenceShare,
              lowShare: lowConfidenceShare,
            }),
            confidenceDetail: `${formatPercent(lowConfidenceShare)} low confidence, ${formatPercent(
              mediumConfidenceShare
            )} medium, and ${formatPercent(highConfidenceShare)} high across family reads.`,
            provenanceLabel: 'Main evidence source',
            provenanceValue: familyProvenanceLabel(familyProvenanceLeader?.provenance || null),
            provenanceDetail: familyProvenanceLeader
              ? `${formatPercent(familyProvenanceLeader.share_pct)} of family reads mainly rely on this source.`
              : 'No single evidence source dominates yet.',
          },
          contributorTitle: 'Keep contributor weight secondary to structural context',
          contributorDescription:
            'Use message weight after the structural explanation and descriptive semantic mix, not as a competing story.',
        }
      : mode === 'structural_backlog'
        ? {
            sectionEyebrow: 'Backlog semantic context',
            sectionTitle: 'Use sender meaning to describe the backlog',
            sectionDescription:
              'This row describes what has accumulated inside the backlog. Dormancy still explains why the group exists.',
            primaryLabel: 'Biggest semantic family',
            primaryHeadline: leadFamilyLabel
              ? `${leadFamilyLabel} is the biggest visible semantic family inside this backlog.`
              : 'Semantic mix describes the backlog without replacing the dormancy frame.',
            primaryDetail: subtypeSupportDetail(leadLane, mode),
            primaryFamilyRows: visiblePrimaryFamilyRows,
            smallShareSummary,
            decompositionTitle: 'Subtype status',
            decompositionBadge: topSubtype ? 'Supporting detail only' : null,
          decompositionMode: topSubtype ? 'summary' : 'hidden',
          decompositionHeadline: topSubtype
            ? `${topSubtype.label} is the clearest subtype we can see inside this backlog.`
            : 'Subtype detail stays secondary while backlog framing leads.',
          decompositionDetail:
            'This helps describe what has built up in the backlog. Dormancy and backlog age still matter more than subtype detail.',
          decompositionCoverageStats: [],
          decompositionRows: [],
          trustTitle: 'How reliable this read is',
            trustIntro:
              'This helps you judge how stable the backlog description is. It does not replace the dormancy frame.',
            trust: {
              resolutionLabel: 'Clear sender type',
              resolutionBars: [
                { key: 'clear', sharePct: percentWidth(clearShare), accentClass: 'bg-emerald-500' },
                { key: 'mixed', sharePct: percentWidth(familyMixedShare), accentClass: 'bg-amber-400' },
                {
                  key: 'thin_history',
                  sharePct: percentWidth(familyThinHistoryShare),
                  accentClass: 'bg-slate-400',
                },
              ],
              resolutionValue: resolutionValueLabel(clearShare),
              resolutionDetail: `${formatPercent(familyMixedShare)} show mixed behavior and ${formatPercent(
                familyThinHistoryShare
              )} still need more history. Dormancy still leads this page.`,
              confidenceLabel: 'Confidence',
              confidenceValue: confidenceValueLabel({
                clearShare,
                highShare: highConfidenceShare,
                mediumShare: mediumConfidenceShare,
                lowShare: lowConfidenceShare,
              }),
              confidenceDetail: `${formatPercent(lowConfidenceShare)} low confidence, ${formatPercent(
                mediumConfidenceShare
              )} medium, and ${formatPercent(highConfidenceShare)} high across family reads.`,
              provenanceLabel: 'Main evidence source',
              provenanceValue: familyProvenanceLabel(familyProvenanceLeader?.provenance || null),
              provenanceDetail: familyProvenanceLeader
                ? `${formatPercent(familyProvenanceLeader.share_pct)} of family reads mainly rely on this source.`
                : 'No single evidence source dominates yet.',
            },
            contributorTitle: 'Keep contributor weight secondary to backlog context',
            contributorDescription:
              'Use message weight after the backlog explanation and descriptive semantic mix, not as a competing story.',
          }
        : {
            sectionEyebrow: 'Semantic mix',
            sectionTitle:
              leadLane?.subtype_persistence_state === 'provisional'
                ? 'Read the main family first, then inspect what is already splitting out'
                : 'Read the cleanup group through its main semantic family',
            sectionDescription:
              leadLane?.subtype_persistence_state === 'provisional'
                ? 'The family label is still the most honest headline here, but the published rollup already shows meaningful subtype structure underneath it.'
                : 'Semantic family can lead this row for this group. Subtype detail and reliability stay supporting context behind the main category.',
            primaryLabel: 'Main semantic family',
            primaryHeadline: leadFamilyLabel
              ? `${leadFamilyLabel} is the clearest semantic family in this cleanup group.`
              : 'Semantic family mix is the primary story in this cleanup group.',
            primaryDetail: subtypeSupportDetail(leadLane, mode),
            primaryFamilyRows: visiblePrimaryFamilyRows,
            smallShareSummary,
            decompositionTitle: 'Breakdown status',
            decompositionBadge:
              leadLane?.subtype_persistence_state === 'survives'
                ? 'Clear split'
                : leadLane?.subtype_persistence_state === 'provisional'
                  ? 'Useful but still provisional'
                  : leadLane
                    ? 'Too broad to split yet'
                    : null,
            decompositionMode:
              (leadLane?.subtype_persistence_state === 'survives' ||
                leadLane?.subtype_persistence_state === 'provisional') &&
              decompositionRows.length > 0
                ? 'expanded'
                : topSubtype
                  ? 'summary'
                  : 'hidden',
            decompositionHeadline:
              leadLane?.subtype_persistence_state === 'survives' && topSubtype
                ? `${topSubtype.label} is the clearest subtype inside ${leadFamilyLabel || 'this category'}.`
                : leadLane?.subtype_persistence_state === 'provisional' && topSubtype
                  ? `${leadFamilyLabel || 'This category'} is still the right headline, but meaningful subtype lanes are already visible underneath it.`
                  : topSubtype
                    ? `${leadFamilyLabel || 'This category'} is still too broad to split cleanly.`
                    : 'Subtype detail will appear when a stable leading subtype exists.',
            decompositionDetail:
              leadLane?.subtype_persistence_state === 'survives'
                ? 'These subtype rows stay visible because the split is strong enough to keep without overclaiming.'
                : leadLane?.subtype_persistence_state === 'provisional'
                  ? laneCoverage.provisionalSharePct > 0
                    ? `Named subtypes already explain ${formatPercent(
                        laneCoverage.resolvedSharePct
                      )} of ${leadFamilyLowerLabel}. Another ${formatPercent(
                        laneCoverage.provisionalSharePct
                      )} show an early split, while ${formatPercent(
                        laneCoverage.unresolvedSharePct
                      )} still stays broad.`
                    : `Named subtypes already explain ${formatPercent(
                        laneCoverage.resolvedSharePct
                      )} of ${leadFamilyLowerLabel}, while ${formatPercent(
                        laneCoverage.unresolvedSharePct
                      )} still remains broad.`
                  : 'Keep the family label as the main story here. The subtype split is not strong enough yet.',
            decompositionCoverageStats,
            decompositionRows,
            trustTitle: 'How reliable this read is',
            trustIntro:
              'This helps you judge how strongly the main semantic family can lead. Clear reads matter first; confidence and evidence source stay supporting context.',
            trust: {
              resolutionLabel: 'Clear sender type',
              resolutionBars: [
                { key: 'clear', sharePct: percentWidth(clearShare), accentClass: 'bg-emerald-500' },
                { key: 'mixed', sharePct: percentWidth(familyMixedShare), accentClass: 'bg-amber-400' },
                {
                  key: 'thin_history',
                  sharePct: percentWidth(familyThinHistoryShare),
                  accentClass: 'bg-slate-400',
                },
              ],
              resolutionValue: resolutionValueLabel(clearShare),
              resolutionDetail: `${formatPercent(familyMixedShare)} show mixed behavior and ${formatPercent(
                familyThinHistoryShare
              )} still need more history. ${
                familyUmbrellaShare >= 50
                  ? 'Broad umbrella categories are still a big share of this group.'
                  : 'The main semantic family remains the clearest story here.'
              }`,
              confidenceLabel: 'Confidence',
              confidenceValue: confidenceValueLabel({
                clearShare,
                highShare: highConfidenceShare,
                mediumShare: mediumConfidenceShare,
                lowShare: lowConfidenceShare,
              }),
              confidenceDetail: `${formatPercent(lowConfidenceShare)} low confidence, ${formatPercent(
                mediumConfidenceShare
              )} medium, and ${formatPercent(highConfidenceShare)} high across family reads.`,
              provenanceLabel: 'Main evidence source',
              provenanceValue: familyProvenanceLabel(familyProvenanceLeader?.provenance || null),
              provenanceDetail: familyProvenanceLeader
                ? `${formatPercent(familyProvenanceLeader.share_pct)} of family reads mainly rely on this source.`
                : 'No single evidence source dominates yet.',
            },
            contributorTitle: 'Keep contributor weight secondary to semantic context',
            contributorDescription:
              'Use message weight after the main semantic family, not as a competing story inside the semantic row.',
          }

  const senderCard =
    mode === 'structural_only'
      ? {
          surfaceTitle: 'Descriptive semantic context',
          metricLabel: 'Semantic family',
          familyLabel: 'Semantic family',
          patternLabel: 'Pattern class',
          usageLabel: 'How to use this read',
          usageDetail:
            'Use this sender semantic read as descriptive support only. The cleanup group itself is structural first.',
        }
      : mode === 'structural_backlog'
        ? {
            surfaceTitle: 'Backlog semantic context',
            metricLabel: 'Semantic family',
            familyLabel: 'Semantic family',
            patternLabel: 'Pattern class',
            usageLabel: 'How to use this read',
            usageDetail:
              'Use this sender semantic read to describe what sits inside the backlog, not why the group exists.',
          }
        : {
            surfaceTitle: 'Semantic context',
            metricLabel: 'Semantic family',
            familyLabel: 'Semantic family',
            patternLabel: 'Pattern class',
            usageLabel: 'How to use this read',
            usageDetail:
              leadLane?.subtype_persistence_state === 'provisional'
                ? 'Use this sender read to see whether the sender already fits a named subtype or still sits inside the broader family.'
                : 'Use this sender semantic read as supporting context for the group’s main semantic story.',
          }

  return {
    mode,
    badgeLabel,
    leadingFamilyLabel: leadFamilyLabel,
    topExplanation,
    cleanupGroupCard,
    semanticRow,
    senderCard,
  }
}
