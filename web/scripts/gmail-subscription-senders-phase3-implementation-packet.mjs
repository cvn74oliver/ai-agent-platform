import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  TARGET_CLUSTER_ID,
  loadSubscriptionSemanticAuditData,
} from './gmail-subscription-senders-semantic-audit.mjs'
import {
  GMAIL_PATTERN_LABEL_ALERTS_SECURITY,
  GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
  GMAIL_PATTERN_LABEL_GENERAL_UPDATES,
  GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE,
  GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
  GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL,
  GMAIL_PATTERN_LABEL_THIN_HISTORY,
  canonicalSenderProfileFromPersistedStats,
  normalizePatternMix,
  operatorProfileFromPersistedStats,
  resolveSenderSemanticsFromCompatibility,
} from '../src/lib/integrations/gmail/gmailSenderProfile.ts'
import { buildSemanticAnalyticsDistributions } from '../src/lib/integrations/gmail/gmailSemanticRollups.ts'
import { buildSharedGroupSemanticRollupFromSemanticAnalytics } from '../src/lib/integrations/gmail/gmailSemanticRollupContract.ts'

const scriptPath = fileURLToPath(import.meta.url)

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function roundSharePct(count, total) {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((count / total) * 100)
}

function ratio(count, total) {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return count / total
}

function patternCountForNames(patternMix, names) {
  const nameSet = new Set(names)
  return patternMix.reduce(
    (sum, entry) => (nameSet.has(entry.pattern) ? sum + normalizeCount(entry.count) : sum),
    0
  )
}

function subtypeCountsForMarketingRows(rows) {
  const counts = {
    offer_campaign: 0,
    product_marketing_update: 0,
    editorial_newsletter: 0,
    unresolved_remainder: 0,
  }

  for (const row of rows) {
    const subtypeKey = normalizeText(row.semantic.semantic_family.subtype_key) || null
    if (subtypeKey && subtypeKey in counts) {
      counts[subtypeKey] += 1
    } else {
      counts.unresolved_remainder += 1
    }
  }

  return counts
}

function buildLockedMetrics(projectedRows, clusterMessageCount) {
  const marketingRows = projectedRows.filter(
    (row) => row.semantic.semantic_family.family === 'marketing_promotional'
  )
  const analytics = buildSemanticAnalyticsDistributions(
    marketingRows.map((row) => ({
      semantic_family: row.semantic.semantic_family,
      semantic_pattern: row.semantic.semantic_pattern,
    }))
  )
  const rollup = buildSharedGroupSemanticRollupFromSemanticAnalytics({
    clusterId: TARGET_CLUSTER_ID,
    senderCount: marketingRows.length,
    messageCount: clusterMessageCount,
    semanticAnalytics: analytics,
  })
  const subtypeCounts = subtypeCountsForMarketingRows(marketingRows)
  const resolvedMarketingSubtypeSenderCount =
    subtypeCounts.offer_campaign +
    subtypeCounts.product_marketing_update +
    subtypeCounts.editorial_newsletter

  return {
    sender_count: projectedRows.length,
    cleanup_group_message_count: clusterMessageCount,
    marketing_promotional_sender_count: marketingRows.length,
    resolved_marketing_subtype_sender_count: resolvedMarketingSubtypeSenderCount,
    resolved_marketing_subtype_share_pct: roundSharePct(
      resolvedMarketingSubtypeSenderCount,
      marketingRows.length
    ),
    unresolved_remainder_sender_count: subtypeCounts.unresolved_remainder,
    subtype_sender_counts: subtypeCounts,
    headline_family_subtype_persistence_state: rollup.headline.family_subtype_persistence_state,
    headline_pattern_subtype_persistence_state: rollup.headline.pattern_subtype_persistence_state,
    trust_summary: rollup.trust.summary,
  }
}

function projectSenderRow(data, row, sourceKind) {
  const statsRow = data.statsBySender.get(normalizeText(row.sender)) || null
  const previewRows = data.previewRowsBySenderKey.get(normalizeText(row.sender_key)) || []
  const categoryProfile = canonicalSenderProfileFromPersistedStats({
    categoryDistribution: statsRow?.category_distribution,
    categorizedMessageCount: statsRow?.categorized_message_count,
    uncategorizedMessageCount: statsRow?.uncategorized_message_count,
    multiCategoryMessageCount: statsRow?.multi_category_message_count,
    dominantCategory: statsRow?.dominant_category,
    dominantCategoryConfidence: statsRow?.dominant_category_confidence,
    categoryProfileMode: statsRow?.category_profile_mode,
  })
  const patternMix = normalizePatternMix(statsRow?.pattern_mix)
  const operatorProfile = operatorProfileFromPersistedStats({
    family: statsRow?.operator_profile_family,
    mode: statsRow?.operator_profile_mode,
    confidence: statsRow?.operator_profile_confidence,
    summary: statsRow?.operator_profile_summary,
    reasons: statsRow?.operator_profile_reasons,
    source: statsRow?.operator_profile_source,
  })
  const dominantPattern =
    normalizeText(statsRow?.dominant_pattern) ||
    normalizeText(patternMix[0]?.pattern) ||
    normalizeText(row.seed_payload?.dominant_pattern) ||
    GMAIL_PATTERN_LABEL_THIN_HISTORY
  const totalMessageCount =
    normalizeCount(statsRow?.message_count) ||
    normalizeCount(row.seed_payload?.total_sender_messages)
  const semantic = resolveSenderSemanticsFromCompatibility({
    sender: row.sender,
    subjectHints: previewRows.map((previewRow) => previewRow.subject || ''),
    totalMessageCount,
    categoryProfile,
    patternMix,
    dominantPattern,
    operatorProfile,
    machineProbability:
      typeof statsRow?.machine_probability === 'number' &&
      Number.isFinite(statsRow.machine_probability)
        ? statsRow.machine_probability
        : null,
    humanProbability:
      typeof statsRow?.human_probability === 'number' &&
      Number.isFinite(statsRow.human_probability)
        ? statsRow.human_probability
        : null,
    sourceKind,
  })

  const newsletterPromoCount = patternCountForNames(patternMix, [
    GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL,
  ])
  const generalUpdatesCount = patternCountForNames(patternMix, [GMAIL_PATTERN_LABEL_GENERAL_UPDATES])
  const transactionalPatternCount = patternCountForNames(patternMix, [
    GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
    GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
  ])
  const securityPatternCount = patternCountForNames(patternMix, [GMAIL_PATTERN_LABEL_ALERTS_SECURITY])
  const humanPatternCount = patternCountForNames(patternMix, [GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE])
  const strongestMarketingAnchorCount = Math.max(newsletterPromoCount, generalUpdatesCount)
  const strongestConcreteNonMarketingCount = Math.max(
    transactionalPatternCount,
    securityPatternCount,
    humanPatternCount
  )
  const strongerConcreteNonMarketingEvidence =
    strongestConcreteNonMarketingCount >= strongestMarketingAnchorCount + 2 ||
    ratio(
      transactionalPatternCount + securityPatternCount + humanPatternCount,
      totalMessageCount
    ) >= 0.45

  return {
    sender: row.sender,
    sender_key: row.sender_key,
    cleanup_group_message_count: normalizeCount(row.cleanup_group_message_count),
    operator_profile_mode: operatorProfile.operator_profile_mode,
    operator_profile_family: operatorProfile.operator_profile_family,
    dominant_pattern: dominantPattern,
    stronger_concrete_non_marketing_evidence: strongerConcreteNonMarketingEvidence,
    semantic,
  }
}

function buildProjectedRows(data, sourceKind) {
  return data.seedRows.map((row) => projectSenderRow(data, row, sourceKind))
}

function resolutionDistributionForKeys(projectedBySenderKey, senderKeys) {
  const counts = {
    clear: 0,
    mixed: 0,
    thin_history: 0,
  }

  for (const senderKey of senderKeys) {
    const row = projectedBySenderKey.get(senderKey)
    if (!row) continue
    const resolution = row.semantic.semantic_pattern.resolution
    if (resolution in counts) counts[resolution] += 1
  }

  return counts
}

function buildImplementationPacket(data) {
  const clusterMessageCount = normalizeCount(data.clusterSummary?.message_count)
  const beforeRows = buildProjectedRows(data, 'artifact_seed')
  const afterRows = buildProjectedRows(data, 'sender_stats')
  const beforeBySenderKey = new Map(beforeRows.map((row) => [normalizeText(row.sender_key), row]))
  const afterBySenderKey = new Map(afterRows.map((row) => [normalizeText(row.sender_key), row]))
  const beforeMetrics = buildLockedMetrics(beforeRows, clusterMessageCount)
  const afterMetrics = buildLockedMetrics(afterRows, clusterMessageCount)

  const targetPoolRows = beforeRows.filter(
    (row) =>
      row.semantic.semantic_family.family === 'marketing_promotional' &&
      row.semantic.semantic_family.resolution === 'clear' &&
      row.operator_profile_mode === 'clear' &&
      row.operator_profile_family === 'marketing_promotional' &&
      !normalizeText(row.semantic.semantic_family.subtype_key)
  )
  const targetPoolSenderKeys = new Set(targetPoolRows.map((row) => normalizeText(row.sender_key)))

  const targetPoolAccounting = {
    target_pool_size_at_execution_start: targetPoolRows.length,
    stayed_unresolved: 0,
    resolved_to_product_marketing_update: 0,
    resolved_to_editorial_newsletter: 0,
    resolved_to_offer_campaign: 0,
    excluded_due_to_stronger_non_marketing_evidence: 0,
  }

  for (const beforeRow of targetPoolRows) {
    const afterRow = afterBySenderKey.get(normalizeText(beforeRow.sender_key))
    const afterSubtype = normalizeText(afterRow?.semantic.semantic_family.subtype_key) || null

    if (afterSubtype === 'product_marketing_update') {
      targetPoolAccounting.resolved_to_product_marketing_update += 1
      continue
    }
    if (afterSubtype === 'editorial_newsletter') {
      targetPoolAccounting.resolved_to_editorial_newsletter += 1
      continue
    }
    if (afterSubtype === 'offer_campaign') {
      targetPoolAccounting.resolved_to_offer_campaign += 1
      continue
    }

    targetPoolAccounting.stayed_unresolved += 1
    if (afterRow?.stronger_concrete_non_marketing_evidence) {
      targetPoolAccounting.excluded_due_to_stronger_non_marketing_evidence += 1
    }
  }

  const netNewResolvedFromTargetPool =
    targetPoolAccounting.resolved_to_product_marketing_update +
    targetPoolAccounting.resolved_to_editorial_newsletter +
    targetPoolAccounting.resolved_to_offer_campaign

  const resolvedOutsideTargetPoolSenderCount = beforeRows.filter((beforeRow) => {
    if (beforeRow.semantic.semantic_family.family !== 'marketing_promotional') return false
    if (targetPoolSenderKeys.has(normalizeText(beforeRow.sender_key))) return false
    const beforeSubtype = normalizeText(beforeRow.semantic.semantic_family.subtype_key) || null
    const afterSubtype =
      normalizeText(afterBySenderKey.get(normalizeText(beforeRow.sender_key))?.semantic.semantic_family.subtype_key) ||
      null
    return beforeSubtype == null && afterSubtype != null
  }).length

  const alreadyResolvedBeforeRows = beforeRows.filter((row) => {
    return (
      row.semantic.semantic_family.family === 'marketing_promotional' &&
      normalizeText(row.semantic.semantic_family.subtype_key)
    )
  })
  const preservedResolvedSenderCount = alreadyResolvedBeforeRows.filter((beforeRow) => {
    const afterSubtype =
      normalizeText(afterBySenderKey.get(normalizeText(beforeRow.sender_key))?.semantic.semantic_family.subtype_key) ||
      null
    return afterSubtype != null
  }).length
  const sameSubtypePreservationCount = alreadyResolvedBeforeRows.filter((beforeRow) => {
    const beforeSubtype = normalizeText(beforeRow.semantic.semantic_family.subtype_key) || null
    const afterSubtype =
      normalizeText(afterBySenderKey.get(normalizeText(beforeRow.sender_key))?.semantic.semantic_family.subtype_key) ||
      null
    return beforeSubtype != null && beforeSubtype === afterSubtype
  }).length

  const marketingBeforeUnresolvedRows = beforeRows.filter((row) => {
    return (
      row.semantic.semantic_family.family === 'marketing_promotional' &&
      !normalizeText(row.semantic.semantic_family.subtype_key)
    )
  })
  const weakHistoryRows = marketingBeforeUnresolvedRows.filter(
    (row) => row.semantic.semantic_family.resolution === 'thin_history'
  )
  const mixedRows = marketingBeforeUnresolvedRows.filter(
    (row) => row.semantic.semantic_family.resolution === 'mixed'
  )
  const weakHistoryResolvedAfterSenderCount = weakHistoryRows.filter((beforeRow) => {
    const afterSubtype =
      normalizeText(afterBySenderKey.get(normalizeText(beforeRow.sender_key))?.semantic.semantic_family.subtype_key) ||
      null
    return afterSubtype != null
  }).length
  const mixedResolvedAfterSenderCount = mixedRows.filter((beforeRow) => {
    const afterSubtype =
      normalizeText(afterBySenderKey.get(normalizeText(beforeRow.sender_key))?.semantic.semantic_family.subtype_key) ||
      null
    return afterSubtype != null
  }).length

  const beforeTargetPoolPatternResolutionDistribution = resolutionDistributionForKeys(
    beforeBySenderKey,
    targetPoolRows.map((row) => normalizeText(row.sender_key))
  )
  const afterTargetPoolPatternResolutionDistribution = resolutionDistributionForKeys(
    afterBySenderKey,
    targetPoolRows.map((row) => normalizeText(row.sender_key))
  )

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    grounding: {
      artifact_version: data.artifactVersion,
      cluster_id: TARGET_CLUSTER_ID,
      before_projection: 'current resolver with clear-family rescue disabled',
      after_projection: 'current resolver with phase3 clear-family rescue enabled',
    },
    locked_metrics: {
      before: beforeMetrics,
      after: afterMetrics,
    },
    target_pool_accounting: {
      ...targetPoolAccounting,
      reconciled_total:
        targetPoolAccounting.stayed_unresolved +
        targetPoolAccounting.resolved_to_product_marketing_update +
        targetPoolAccounting.resolved_to_editorial_newsletter +
        targetPoolAccounting.resolved_to_offer_campaign,
      reconciles:
        targetPoolAccounting.stayed_unresolved +
          targetPoolAccounting.resolved_to_product_marketing_update +
          targetPoolAccounting.resolved_to_editorial_newsletter +
          targetPoolAccounting.resolved_to_offer_campaign ===
        targetPoolAccounting.target_pool_size_at_execution_start,
      resolved_outside_target_pool_sender_count: resolvedOutsideTargetPoolSenderCount,
    },
    subtype_gain_breakdown_target_pool_only: {
      product_marketing_update: targetPoolAccounting.resolved_to_product_marketing_update,
      editorial_newsletter: targetPoolAccounting.resolved_to_editorial_newsletter,
      offer_campaign: targetPoolAccounting.resolved_to_offer_campaign,
      total_net_new_resolved: netNewResolvedFromTargetPool,
    },
    offer_anti_regression: {
      offer_campaign_gains_from_target_pool: targetPoolAccounting.resolved_to_offer_campaign,
      total_net_new_resolved_from_target_pool: netNewResolvedFromTargetPool,
      offer_share_of_net_new_resolved_pct:
        netNewResolvedFromTargetPool > 0
          ? Math.round(
              (targetPoolAccounting.resolved_to_offer_campaign / netNewResolvedFromTargetPool) * 100
            )
          : 0,
      combined_product_and_editorial_gains:
        targetPoolAccounting.resolved_to_product_marketing_update +
        targetPoolAccounting.resolved_to_editorial_newsletter,
      offer_not_more_than_half:
        targetPoolAccounting.resolved_to_offer_campaign * 2 <= netNewResolvedFromTargetPool,
      combined_product_and_editorial_not_less_than_offer:
        targetPoolAccounting.resolved_to_product_marketing_update +
          targetPoolAccounting.resolved_to_editorial_newsletter >=
        targetPoolAccounting.resolved_to_offer_campaign,
      passes:
        targetPoolAccounting.resolved_to_offer_campaign * 2 <= netNewResolvedFromTargetPool &&
        targetPoolAccounting.resolved_to_product_marketing_update +
          targetPoolAccounting.resolved_to_editorial_newsletter >=
          targetPoolAccounting.resolved_to_offer_campaign,
    },
    pattern_clarity_results: {
      cluster_pattern_clear_share_pct_before: beforeMetrics.trust_summary.pattern_clear_share_pct,
      cluster_pattern_clear_share_pct_after: afterMetrics.trust_summary.pattern_clear_share_pct,
      cluster_pattern_clear_share_pct_delta:
        afterMetrics.trust_summary.pattern_clear_share_pct -
        beforeMetrics.trust_summary.pattern_clear_share_pct,
      target_pool_pattern_resolution_distribution_before:
        beforeTargetPoolPatternResolutionDistribution,
      target_pool_pattern_resolution_distribution_after:
        afterTargetPoolPatternResolutionDistribution,
      target_pool_clear_pattern_delta:
        afterTargetPoolPatternResolutionDistribution.clear -
        beforeTargetPoolPatternResolutionDistribution.clear,
    },
    already_resolved_stability: {
      already_resolved_sender_count_before: beforeMetrics.resolved_marketing_subtype_sender_count,
      already_resolved_sender_count_after: afterMetrics.resolved_marketing_subtype_sender_count,
      preserved_resolved_sender_count: preservedResolvedSenderCount,
      same_subtype_preservation_count: sameSubtypePreservationCount,
      downgraded_or_churned_sender_count:
        beforeMetrics.resolved_marketing_subtype_sender_count - sameSubtypePreservationCount,
      passes:
        preservedResolvedSenderCount === beforeMetrics.resolved_marketing_subtype_sender_count &&
        sameSubtypePreservationCount === beforeMetrics.resolved_marketing_subtype_sender_count,
    },
    population_guardrails: {
      weak_history_sender_count_before: weakHistoryRows.length,
      weak_history_resolved_after_sender_count: weakHistoryResolvedAfterSenderCount,
      mixed_sender_count_before: mixedRows.length,
      mixed_resolved_after_sender_count: mixedResolvedAfterSenderCount,
      weak_history_stayed_unresolved: weakHistoryResolvedAfterSenderCount === 0,
      mixed_stayed_unresolved: mixedResolvedAfterSenderCount === 0,
    },
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath

if (isMain) {
  const data = await loadSubscriptionSemanticAuditData()
  const packet = buildImplementationPacket(data)
  console.log(JSON.stringify(packet, null, 2))
}
