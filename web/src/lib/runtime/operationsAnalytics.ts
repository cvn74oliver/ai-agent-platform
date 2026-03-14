import { classifyMessagePattern, type RuntimeCleanupPlanCluster } from '@/lib/runtime/operationsWorkspace'

export type OverviewAnalyticsModel = {
  topVolumeClusters: Array<{
    cluster_id: string
    title: string
    estimated_count: number
    width_pct: number
    is_estimated: true
  }>
  topPatternSeries: Array<{
    label: string
    value: number
    width_pct: number
    is_estimated: true
  }>
  lowValueVsProtected: {
    low_value_estimated: number
    protected_estimated: number
    low_value_width_pct: number
    protected_width_pct: number
    is_estimated: true
  }
}

export type MessageSignalCoverage = {
  total: number
  unread_known: number
  starred_known: number
  important_known: number
  labels_known: number
  dated_known: number
  in_inbox_known: number
  category_known: number
  thread_participation_hint_known: number
  has_unread_signal: boolean
  has_starred_or_important_signal: boolean
  has_date_signal: boolean
  has_label_signal: boolean
  has_category_signal: boolean
  has_thread_participation_hint: boolean
}

export type OverviewOperatorInsight = {
  next_review_cluster: RuntimeCleanupPlanCluster | null
  largest_cluster: RuntimeCleanupPlanCluster | null
  safest_cluster: RuntimeCleanupPlanCluster | null
  most_mixed_or_risky_cluster: RuntimeCleanupPlanCluster | null
}

export function deriveOperationsOverviewAnalytics(params: {
  clusters: RuntimeCleanupPlanCluster[]
  protectedEstimatedCount: number
  mailboxProfileNativeSignals?: {
    category_primary_estimate: number
    category_promotions_estimate: number
    category_social_estimate: number
    category_updates_estimate: number
    category_forums_estimate: number
    likely_machine_generated_recent_estimate: number
  } | null
}): OverviewAnalyticsModel {
  const topVolumeClusters = [...params.clusters]
    .sort((a, b) => b.estimated_count - a.estimated_count)
    .slice(0, 5)
  const topVolumeMax = Math.max(1, topVolumeClusters[0]?.estimated_count || 1)

  const topPatternSeriesRaw = params.mailboxProfileNativeSignals
    ? [
        {
          label: 'Primary',
          value: params.mailboxProfileNativeSignals.category_primary_estimate,
        },
        {
          label: 'Promotions',
          value: params.mailboxProfileNativeSignals.category_promotions_estimate,
        },
        {
          label: 'Social',
          value: params.mailboxProfileNativeSignals.category_social_estimate,
        },
        {
          label: 'Updates',
          value: params.mailboxProfileNativeSignals.category_updates_estimate,
        },
        {
          label: 'Forums',
          value: params.mailboxProfileNativeSignals.category_forums_estimate,
        },
      ]
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : (() => {
        const patternCounts = new Map<string, number>()
        for (const cluster of params.clusters) {
          const dominantPattern = classifyMessagePattern(cluster.sample_preview[0]?.subject || cluster.title)
          patternCounts.set(
            dominantPattern,
            (patternCounts.get(dominantPattern) || 0) + Math.max(1, cluster.estimated_count)
          )
        }
        return Array.from(patternCounts.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      })()
  const topPatternMax = Math.max(1, topPatternSeriesRaw[0]?.value || 1)

  const lowValueEstimated = params.mailboxProfileNativeSignals
    ? Math.max(0, params.mailboxProfileNativeSignals.likely_machine_generated_recent_estimate)
    : params.clusters.reduce((sum, cluster) => sum + Math.max(0, cluster.estimated_count || 0), 0)
  const protectedEstimated = Math.max(0, params.protectedEstimatedCount)
  const splitTotal = Math.max(1, lowValueEstimated + protectedEstimated)

  return {
    topVolumeClusters: topVolumeClusters.map((cluster) => ({
      cluster_id: cluster.cluster_id,
      title: cluster.title,
      estimated_count: cluster.estimated_count,
      width_pct: Math.max(8, Math.round((cluster.estimated_count / topVolumeMax) * 100)),
      is_estimated: true as const,
    })),
    topPatternSeries: topPatternSeriesRaw.map((entry) => ({
      label: entry.label,
      value: entry.value,
      width_pct: Math.max(8, Math.round((entry.value / topPatternMax) * 100)),
      is_estimated: true as const,
    })),
    lowValueVsProtected: {
      low_value_estimated: lowValueEstimated,
      protected_estimated: protectedEstimated,
      low_value_width_pct: Math.round((lowValueEstimated / splitTotal) * 100),
      protected_width_pct: Math.round((protectedEstimated / splitTotal) * 100),
      is_estimated: true as const,
    },
  }
}

export function deriveMessageSignalCoverage(
  messages: Array<{
    date?: string | null
    label_ids?: string[] | null
    category_labels?: string[] | null
    is_in_inbox?: boolean
    is_unread?: boolean
    is_starred?: boolean
    is_important?: boolean
  }>
): MessageSignalCoverage {
  const total = messages.length
  const unreadKnown = messages.filter((message) => typeof message.is_unread === 'boolean').length
  const starredKnown = messages.filter((message) => typeof message.is_starred === 'boolean').length
  const importantKnown = messages.filter((message) => typeof message.is_important === 'boolean').length
  const labelsKnown = messages.filter((message) => Array.isArray(message.label_ids)).length
  const categoryKnown = messages.filter((message) => Array.isArray(message.category_labels)).length
  const inInboxKnown = messages.filter((message) => typeof message.is_in_inbox === 'boolean').length
  const threadParticipationKnown = messages.filter((message) => {
    return Array.isArray(message.label_ids) && message.label_ids.some((label) => label.toUpperCase() === 'SENT')
  }).length
  const datedKnown = messages.filter((message) => {
    if (typeof message.date !== 'string' || !message.date.trim()) return false
    return Number.isFinite(Date.parse(message.date))
  }).length

  return {
    total,
    unread_known: unreadKnown,
    starred_known: starredKnown,
    important_known: importantKnown,
    labels_known: labelsKnown,
    in_inbox_known: inInboxKnown,
    category_known: categoryKnown,
    thread_participation_hint_known: threadParticipationKnown,
    dated_known: datedKnown,
    has_unread_signal: unreadKnown > 0,
    has_starred_or_important_signal: starredKnown > 0 || importantKnown > 0,
    has_date_signal: datedKnown > 0,
    has_label_signal: labelsKnown > 0,
    has_category_signal: categoryKnown > 0,
    has_thread_participation_hint: threadParticipationKnown > 0,
  }
}

function riskScore(cluster: RuntimeCleanupPlanCluster): number {
  const text = `${cluster.risk_note} ${cluster.safety_note}`.toLowerCase()
  if (text.includes('high')) return 3
  if (text.includes('medium')) return 2
  if (text.includes('mixed')) return 2
  return 1
}

function patternDiversityScore(cluster: RuntimeCleanupPlanCluster): number {
  const patterns = new Set<string>()
  for (const sample of cluster.sample_preview || []) {
    patterns.add(classifyMessagePattern(sample.subject))
  }
  return patterns.size
}

export function deriveOverviewOperatorInsights(
  clusters: RuntimeCleanupPlanCluster[]
): OverviewOperatorInsight {
  const nextReviewCluster =
    clusters.find((cluster) => cluster.status === 'ready') || clusters[0] || null
  const largestCluster =
    [...clusters].sort((a, b) => b.estimated_count - a.estimated_count)[0] || null
  const safestCluster =
    [...clusters]
      .sort((a, b) => {
        const riskDelta = riskScore(a) - riskScore(b)
        if (riskDelta !== 0) return riskDelta
        return b.estimated_count - a.estimated_count
      })[0] || null
  const mostMixedOrRisky =
    [...clusters]
      .sort((a, b) => {
        const bScore = riskScore(b) * 100 + patternDiversityScore(b)
        const aScore = riskScore(a) * 100 + patternDiversityScore(a)
        return bScore - aScore
      })[0] || null

  return {
    next_review_cluster: nextReviewCluster,
    largest_cluster: largestCluster,
    safest_cluster: safestCluster,
    most_mixed_or_risky_cluster: mostMixedOrRisky,
  }
}
