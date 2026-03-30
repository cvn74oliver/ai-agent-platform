import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  TARGET_CLUSTER_ID,
  buildSubscriptionSemanticAudit,
  loadSubscriptionSemanticAuditData,
} from './gmail-subscription-senders-semantic-audit.mjs'
import {
  canonicalSenderProfileFromPersistedStats,
  normalizePatternMix,
  operatorProfileFromPersistedStats,
  resolveSenderSemanticsFromCompatibility,
} from '../src/lib/integrations/gmail/gmailSenderProfile.ts'
import { buildSemanticAnalyticsDistributions } from '../src/lib/integrations/gmail/gmailSemanticRollups.ts'
import { buildSharedGroupSemanticRollupFromSemanticAnalytics } from '../src/lib/integrations/gmail/gmailSemanticRollupContract.ts'

const scriptPath = fileURLToPath(import.meta.url)

const EDITORIAL_PATTERNS = [
  /\bnewsletter\b/i,
  /\bdigest\b/i,
  /\broundup\b/i,
  /\bbriefing\b/i,
  /\bedition\b/i,
  /\bissue\b/i,
  /\brecap\b/i,
  /\bweekly\b/i,
  /\bdaily\b/i,
  /\bmonthly\b/i,
  /\btop stories\b/i,
  /\breads\b/i,
]

const OFFER_PATTERNS = [
  /\bsale\b/i,
  /\boffer\b/i,
  /\bcoupon\b/i,
  /\bdiscount\b/i,
  /\bdeal\b/i,
  /\bclearance\b/i,
  /\bsave\b/i,
  /\blast chance\b/i,
  /\b\d+%\s*off\b/i,
  /\bfree shipping\b/i,
  /\bpromo\b/i,
]

const PRODUCT_PATTERNS = [
  /\bintroducing\b/i,
  /\bannouncing\b/i,
  /\bannouncement\b/i,
  /\blaunch\b/i,
  /\brelease(?:d)?\b/i,
  /\bnew feature\b/i,
  /\bfeature\b/i,
  /\bproduct update\b/i,
  /\bnow available\b/i,
  /\bcoming soon\b/i,
  /\bwebinar\b/i,
  /\bdemo\b/i,
  /\broadmap\b/i,
  /\bversion\b/i,
]

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function countCueHits(subjects, patterns) {
  let hits = 0
  for (const subject of subjects) {
    const text = normalizeText(subject).toLowerCase()
    if (!text) continue
    if (patterns.some((pattern) => pattern.test(text))) hits += 1
  }
  return hits
}

function cueCountsForSubjects(subjects) {
  return {
    editorial_newsletter: countCueHits(subjects, EDITORIAL_PATTERNS),
    offer_campaign: countCueHits(subjects, OFFER_PATTERNS),
    product_marketing_update: countCueHits(subjects, PRODUCT_PATTERNS),
  }
}

function sumCleanupGroupMessageWeight(rows) {
  return rows.reduce(
    (sum, row) => sum + normalizeCount(row.cleanup_group_message_count),
    0
  )
}

function currentAfterStateTotals(audit) {
  return {
    artifact_version: audit.after.artifact_version,
    sender_count: audit.after.sender_count,
    cleanup_group_message_count: audit.after.cleanup_group_message_count,
    marketing_promotional_sender_count: audit.after.marketing_promotional_sender_count,
    resolved_marketing_subtype_sender_count: audit.after.resolved_marketing_subtype_sender_count,
    resolved_marketing_subtype_share_pct: audit.after.resolved_marketing_subtype_share_pct,
    unresolved_remainder_sender_count:
      audit.after.largest_unresolved_promotional_remainder_sender_count,
    subtype_sender_counts: audit.after.subtype_sender_counts,
    headline_family_subtype_persistence_state:
      audit.after.headline_family_subtype_persistence_state,
    headline_pattern_subtype_persistence_state:
      audit.after.headline_pattern_subtype_persistence_state,
  }
}

function publishedBaselineTruthTotals(audit) {
  return {
    artifact_version: audit.before.artifact_version,
    sender_count: audit.before.sender_count,
    cleanup_group_message_count: audit.before.cleanup_group_message_count,
    marketing_promotional_sender_count: audit.before.marketing_promotional_sender_count,
    resolved_marketing_subtype_sender_count: audit.before.resolved_marketing_subtype_sender_count,
    resolved_marketing_subtype_share_pct: audit.before.resolved_marketing_subtype_share_pct,
    unresolved_remainder_sender_count:
      audit.before.largest_unresolved_promotional_remainder_sender_count,
    subtype_sender_counts: audit.before.subtype_sender_counts,
    headline_family_subtype_persistence_state:
      audit.before.headline_family_subtype_persistence_state,
    headline_pattern_subtype_persistence_state:
      audit.before.headline_pattern_subtype_persistence_state,
  }
}

function buildProjectedMarketingRows(data) {
  return data.seedRows
    .filter((row) => normalizeText(row.semantic_family_key) === 'marketing_promotional')
    .map((row) => {
      const statsRow = data.statsBySender.get(normalizeText(row.sender)) || null
      const previewRows = data.previewRowsBySenderKey.get(normalizeText(row.sender_key)) || []
      const previewSubjects = previewRows.map((previewRow) => previewRow.subject || '')
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
        'Thin history'
      const senderGlobalMessageCount =
        normalizeCount(statsRow?.message_count) ||
        normalizeCount(row.seed_payload?.total_sender_messages)
      const semantic = resolveSenderSemanticsFromCompatibility({
        sender: row.sender,
        subjectHints: previewSubjects,
        totalMessageCount: senderGlobalMessageCount,
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
        sourceKind: 'sender_stats',
      })

      return {
        sender: row.sender,
        sender_key: row.sender_key,
        cleanup_group_message_count: normalizeCount(row.cleanup_group_message_count),
        sender_global_message_count: senderGlobalMessageCount,
        published_subtype_key: normalizeText(row.semantic_subtype_key) || null,
        current_local_projected_subtype_key:
          normalizeText(semantic.semantic_family.subtype_key) || null,
        semantic_family: semantic.semantic_family,
        semantic_pattern: semantic.semantic_pattern,
        category_profile_mode: categoryProfile.category_profile_mode,
        operator_profile_mode: operatorProfile.operator_profile_mode,
        operator_profile_family: operatorProfile.operator_profile_family,
        dominant_pattern: dominantPattern,
        cue_counts: cueCountsForSubjects(previewSubjects),
      }
    })
}

function buildCurrentLocalAfterRollup(projectedRows, clusterMessageCount) {
  const analytics = buildSemanticAnalyticsDistributions(
    projectedRows.map((row) => ({
      semantic_family: row.semantic_family,
      semantic_pattern: row.semantic_pattern,
    }))
  )

  return buildSharedGroupSemanticRollupFromSemanticAnalytics({
    clusterId: TARGET_CLUSTER_ID,
    senderCount: projectedRows.length,
    messageCount: clusterMessageCount,
    semanticAnalytics: analytics,
  })
}

function bucketBy(rows, keyFn) {
  const buckets = new Map()

  for (const row of rows) {
    const bucketKey = keyFn(row)
    const existing = buckets.get(bucketKey) || {
      bucket_key: bucketKey,
      sender_count: 0,
      cleanup_group_message_weight: 0,
      cue_totals: {
        editorial_newsletter: 0,
        offer_campaign: 0,
        product_marketing_update: 0,
      },
      example_sender: row.sender,
    }
    existing.sender_count += 1
    existing.cleanup_group_message_weight += normalizeCount(row.cleanup_group_message_count)
    existing.cue_totals.editorial_newsletter += normalizeCount(
      row.cue_counts?.editorial_newsletter
    )
    existing.cue_totals.offer_campaign += normalizeCount(row.cue_counts?.offer_campaign)
    existing.cue_totals.product_marketing_update += normalizeCount(
      row.cue_counts?.product_marketing_update
    )
    buckets.set(bucketKey, existing)
  }

  return Array.from(buckets.values()).sort(
    (left, right) =>
      right.sender_count - left.sender_count ||
      right.cleanup_group_message_weight - left.cleanup_group_message_weight ||
      left.bucket_key.localeCompare(right.bucket_key)
  )
}

function descriptivePopulationLabel(bucket) {
  const [
    patternClass,
    familyResolution,
    operatorProfileMode,
    operatorProfileFamily,
  ] = bucket.bucket_key.split('|')

  if (familyResolution === 'thin_history') {
    return 'weak-history / should stay unresolved'
  }

  if (familyResolution === 'mixed') {
    return 'mixed marketing remainder'
  }

  const editorialCueTotal = normalizeCount(bucket.cue_totals.editorial_newsletter)
  const offerCueTotal = normalizeCount(bucket.cue_totals.offer_campaign)
  const productCueTotal = normalizeCount(bucket.cue_totals.product_marketing_update)

  if (
    familyResolution === 'clear' &&
    operatorProfileMode === 'clear' &&
    operatorProfileFamily === 'marketing_promotional'
  ) {
    if (productCueTotal > editorialCueTotal && productCueTotal > offerCueTotal) {
      return 'hidden product/update candidate'
    }
    if (editorialCueTotal > productCueTotal && editorialCueTotal > offerCueTotal) {
      return 'hidden editorial candidate'
    }
  }

  if (
    familyResolution === 'clear' &&
    patternClass === 'service_update_cycle' &&
    productCueTotal >= editorialCueTotal &&
    productCueTotal > offerCueTotal
  ) {
    return 'hidden product/update candidate'
  }

  return 'mixed marketing remainder'
}

function editorialBlockerReason(row) {
  const editorialCueCount = normalizeCount(row.cue_counts?.editorial_newsletter)
  const offerCueCount = normalizeCount(row.cue_counts?.offer_campaign)
  const productCueCount = normalizeCount(row.cue_counts?.product_marketing_update)

  if (row.semantic_family.resolution === 'thin_history') return 'weak_history'
  if (offerCueCount > editorialCueCount && offerCueCount >= productCueCount) {
    return 'offer_dominance'
  }
  if (productCueCount > editorialCueCount && productCueCount >= offerCueCount) {
    return 'product_competition'
  }
  if (
    row.semantic_pattern.pattern_class !== 'promotional_cycle' ||
    (row.operator_profile_mode === 'clear' &&
      row.operator_profile_family !== 'marketing_promotional')
  ) {
    return 'mixed_non_marketing_patterns'
  }
  return 'mixed_non_marketing_patterns'
}

function productCandidateTier(row) {
  const editorialCueCount = normalizeCount(row.cue_counts?.editorial_newsletter)
  const offerCueCount = normalizeCount(row.cue_counts?.offer_campaign)
  const productCueCount = normalizeCount(row.cue_counts?.product_marketing_update)

  if (
    productCueCount > editorialCueCount &&
    productCueCount > offerCueCount &&
    row.semantic_family.resolution === 'clear' &&
    row.operator_profile_mode === 'clear' &&
    row.operator_profile_family === 'marketing_promotional' &&
    (row.semantic_pattern.pattern_class === 'promotional_cycle' ||
      row.semantic_pattern.pattern_class === 'service_update_cycle')
  ) {
    return 'high_confidence'
  }

  return 'borderline'
}

function truthClassification(row) {
  const editorialCueCount = normalizeCount(row.cue_counts?.editorial_newsletter)
  const offerCueCount = normalizeCount(row.cue_counts?.offer_campaign)
  const productCueCount = normalizeCount(row.cue_counts?.product_marketing_update)

  if (row.semantic_family.resolution === 'thin_history') return 'keep_unresolved'
  if (row.semantic_family.resolution === 'mixed') return 'decomposable'

  if (
    row.semantic_family.resolution === 'clear' &&
    ((productCueCount > editorialCueCount && productCueCount > offerCueCount) ||
      (editorialCueCount > productCueCount && editorialCueCount > offerCueCount))
  ) {
    return 'promotable'
  }

  return 'decomposable'
}

function summarizeRows(rows) {
  return {
    sender_count: rows.length,
    cleanup_group_message_weight: sumCleanupGroupMessageWeight(rows),
  }
}

function buildReconciliations(unresolvedRows, breakdowns, classifications) {
  const unresolvedSenderTotal = unresolvedRows.length
  const unresolvedMessageTotal = sumCleanupGroupMessageWeight(unresolvedRows)

  const reconcileSenders = (entries) =>
    entries.reduce((sum, entry) => sum + normalizeCount(entry.sender_count), 0)
  const reconcileMessages = (entries) =>
    entries.reduce((sum, entry) => sum + normalizeCount(entry.cleanup_group_message_weight), 0)

  const senderReconciliations = {
    by_pattern_class: {
      expected: unresolvedSenderTotal,
      actual: reconcileSenders(breakdowns.by_pattern_class),
    },
    by_family_resolution: {
      expected: unresolvedSenderTotal,
      actual: reconcileSenders(breakdowns.by_family_resolution),
    },
    by_operator_profile: {
      expected: unresolvedSenderTotal,
      actual: reconcileSenders(breakdowns.by_operator_profile),
    },
    by_combined_bucket: {
      expected: unresolvedSenderTotal,
      actual: reconcileSenders(breakdowns.by_combined_bucket),
    },
    by_truth_classification: {
      expected: unresolvedSenderTotal,
      actual:
        normalizeCount(classifications.promotable.sender_count) +
        normalizeCount(classifications.decomposable.sender_count) +
        normalizeCount(classifications.keep_unresolved.sender_count),
    },
  }

  const messageWeightReconciliations = {
    by_pattern_class: {
      expected: unresolvedMessageTotal,
      actual: reconcileMessages(breakdowns.by_pattern_class),
    },
    by_family_resolution: {
      expected: unresolvedMessageTotal,
      actual: reconcileMessages(breakdowns.by_family_resolution),
    },
    by_operator_profile: {
      expected: unresolvedMessageTotal,
      actual: reconcileMessages(breakdowns.by_operator_profile),
    },
    by_combined_bucket: {
      expected: unresolvedMessageTotal,
      actual: reconcileMessages(breakdowns.by_combined_bucket),
    },
    by_truth_classification: {
      expected: unresolvedMessageTotal,
      actual:
        normalizeCount(classifications.promotable.cleanup_group_message_weight) +
        normalizeCount(classifications.decomposable.cleanup_group_message_weight) +
        normalizeCount(classifications.keep_unresolved.cleanup_group_message_weight),
    },
  }

  for (const entry of Object.values(senderReconciliations)) {
    entry.passed = entry.expected === entry.actual
  }

  for (const entry of Object.values(messageWeightReconciliations)) {
    entry.passed = entry.expected === entry.actual
  }

  return {
    unresolved_remainder_sender_target: unresolvedSenderTotal,
    unresolved_remainder_message_weight_target: unresolvedMessageTotal,
    sender_reconciliations: senderReconciliations,
    message_weight_reconciliations: messageWeightReconciliations,
    all_327_reconciliations_passed:
      Object.values(senderReconciliations).every((entry) => entry.passed) &&
      unresolvedSenderTotal === 327,
    all_message_weight_reconciliations_passed: Object.values(
      messageWeightReconciliations
    ).every((entry) => entry.passed),
  }
}

function buildMemo() {
  return loadSubscriptionSemanticAuditData().then((data) => {
    const audit = buildSubscriptionSemanticAudit(data)
    const projectedRows = buildProjectedMarketingRows(data)
    const unresolvedRows = projectedRows.filter(
      (row) => !normalizeText(row.current_local_projected_subtype_key)
    )
    const currentLocalRollup = buildCurrentLocalAfterRollup(
      projectedRows,
      normalizeCount(data.clusterSummary?.message_count)
    )
    const marketingFamilyLane =
      currentLocalRollup.family_distribution.find(
        (entry) => entry.family === 'marketing_promotional'
      ) || null
    const promotionalPatternLane =
      currentLocalRollup.pattern_distribution.find(
        (entry) => entry.pattern_class === 'promotional_cycle'
      ) || null

    const remainderBreakdowns = {
      by_pattern_class: bucketBy(
        unresolvedRows,
        (row) => row.semantic_pattern.pattern_class
      ),
      by_family_resolution: bucketBy(
        unresolvedRows,
        (row) => row.semantic_family.resolution
      ),
      by_operator_profile: bucketBy(
        unresolvedRows,
        (row) => `${row.operator_profile_mode}|${row.operator_profile_family}`
      ),
      by_combined_bucket: bucketBy(
        unresolvedRows,
        (row) =>
          [
            row.semantic_pattern.pattern_class,
            row.semantic_family.resolution,
            row.operator_profile_mode,
            row.operator_profile_family,
          ].join('|')
      ).map((bucket) => ({
        ...bucket,
        population_label: descriptivePopulationLabel(bucket),
      })),
    }

    const largestMajorPopulations = remainderBreakdowns.by_combined_bucket.slice(0, 5)

    const unresolvedMessageWeightTotal = sumCleanupGroupMessageWeight(unresolvedRows)
    const publishedBaselineTruth = publishedBaselineTruthTotals(audit)
    const currentLocalAfterState = currentAfterStateTotals(audit)

    const editorialCandidatePool = unresolvedRows.filter(
      (row) => normalizeCount(row.cue_counts?.editorial_newsletter) > 0
    )
    const editorialBlockers = bucketBy(editorialCandidatePool, editorialBlockerReason)
    const capturedElsewhereEditorialLike = projectedRows.filter((row) => {
      const editorialCueCount = normalizeCount(row.cue_counts?.editorial_newsletter)
      const offerCueCount = normalizeCount(row.cue_counts?.offer_campaign)
      const productCueCount = normalizeCount(row.cue_counts?.product_marketing_update)
      return (
        normalizeText(row.current_local_projected_subtype_key) &&
        normalizeText(row.current_local_projected_subtype_key) !== 'editorial_newsletter' &&
        editorialCueCount > productCueCount &&
        editorialCueCount > offerCueCount
      )
    })

    const unresolvedProductCandidatePool = unresolvedRows.filter(
      (row) => normalizeCount(row.cue_counts?.product_marketing_update) > 0
    )
    const highConfidenceProductCandidates = unresolvedProductCandidatePool.filter(
      (row) => productCandidateTier(row) === 'high_confidence'
    )
    const borderlineProductCandidates = unresolvedProductCandidatePool.filter(
      (row) => productCandidateTier(row) === 'borderline'
    )
    const productExpansionPosture =
      highConfidenceProductCandidates.length >= borderlineProductCandidates.length &&
      sumCleanupGroupMessageWeight(highConfidenceProductCandidates) >=
        sumCleanupGroupMessageWeight(borderlineProductCandidates)
        ? 'continue'
        : 'tighten'

    const classifications = {
      promotable: summarizeRows(
        unresolvedRows.filter((row) => truthClassification(row) === 'promotable')
      ),
      decomposable: summarizeRows(
        unresolvedRows.filter((row) => truthClassification(row) === 'decomposable')
      ),
      keep_unresolved: summarizeRows(
        unresolvedRows.filter((row) => truthClassification(row) === 'keep_unresolved')
      ),
    }

    const clearFamilyUnresolvedRows = unresolvedRows.filter(
      (row) => row.semantic_family.resolution === 'clear'
    )

    const memo = {
      ok: true,
      generated_at: new Date().toISOString(),
      grounding: {
        artifact_version: data.artifactVersion,
        cluster_id: TARGET_CLUSTER_ID,
        locked_scope: {
          diagnostic_only: true,
          read_only: true,
          no_resolver_change: true,
          no_threshold_change: true,
          no_schema_runtime_ui_taxonomy_rebuild_change: true,
        },
        published_baseline_truth_source: 'published artifact seed truth',
        current_local_after_state_source:
          'current local resolver and current local rollup contract against the locked artifact',
      },
      current_truth: {
        published_baseline_truth: publishedBaselineTruth,
        current_local_after_state: currentLocalAfterState,
      },
      persistence_reconciliation: {
        published_baseline_truth: {
          resolved_marketing_subtype_sender_count:
            publishedBaselineTruth.resolved_marketing_subtype_sender_count,
          resolved_marketing_subtype_share_pct:
            publishedBaselineTruth.resolved_marketing_subtype_share_pct,
          unresolved_remainder_sender_count:
            publishedBaselineTruth.unresolved_remainder_sender_count,
          headline_family_subtype_persistence_state:
            publishedBaselineTruth.headline_family_subtype_persistence_state,
          headline_pattern_subtype_persistence_state:
            publishedBaselineTruth.headline_pattern_subtype_persistence_state,
        },
        current_local_after_state: {
          resolved_marketing_subtype_sender_count:
            currentLocalAfterState.resolved_marketing_subtype_sender_count,
          resolved_marketing_subtype_share_pct:
            currentLocalAfterState.resolved_marketing_subtype_share_pct,
          unresolved_remainder_sender_count:
            currentLocalAfterState.unresolved_remainder_sender_count,
          headline_family_subtype_persistence_state:
            currentLocalAfterState.headline_family_subtype_persistence_state,
          headline_pattern_subtype_persistence_state:
            currentLocalAfterState.headline_pattern_subtype_persistence_state,
          dominant_family_lane: marketingFamilyLane,
          dominant_pattern_lane: promotionalPatternLane,
          trust_summary: currentLocalRollup.trust.summary,
          subtype_coverage_gain_sender_count:
            currentLocalAfterState.resolved_marketing_subtype_sender_count -
            publishedBaselineTruth.resolved_marketing_subtype_sender_count,
        },
        exact_contract_gates: {
          family_headline_gate: {
            current_state: marketingFamilyLane?.subtype_persistence_state || null,
            lane_share_pct: marketingFamilyLane?.share_pct || 0,
            resolved_subtype_coverage_pct:
              marketingFamilyLane?.resolved_subtype_coverage_pct || 0,
            clear_share_pct: currentLocalRollup.trust.summary.family_clear_share_pct,
            failing_gate:
              'The dominant family top subtype is still umbrella-coded, so it does not qualify as a survival-supporting subtype under the current rollup contract.',
          },
          pattern_headline_gate: {
            current_state: promotionalPatternLane?.subtype_persistence_state || null,
            lane_share_pct: promotionalPatternLane?.share_pct || 0,
            resolved_subtype_coverage_pct:
              promotionalPatternLane?.resolved_subtype_coverage_pct || 0,
            clear_share_pct: currentLocalRollup.trust.summary.pattern_clear_share_pct,
            failing_gate:
              'The dominant promotional pattern lane still fails the clear-share requirement for survives because pattern clear share is 3%, below the contract threshold of 60%.',
          },
        },
        main_conclusion:
          'Subtype coverage improved because the current local after-state absorbs 228 additional marketing senders into existing subtypes under the locked artifact, but headline persistence still remains provisional because the family headline does not have a survival-supporting non-umbrella top subtype and the pattern headline still fails the current contract clear-share gate.',
      },
      remainder_population_breakdown: {
        published_baseline_truth: {
          unresolved_remainder_sender_count:
            publishedBaselineTruth.unresolved_remainder_sender_count,
        },
        current_local_after_state: {
          unresolved_remainder_sender_count:
            currentLocalAfterState.unresolved_remainder_sender_count,
          unresolved_remainder_cleanup_group_message_weight:
            unresolvedMessageWeightTotal,
        },
        by_pattern_class: remainderBreakdowns.by_pattern_class,
        by_family_resolution: remainderBreakdowns.by_family_resolution,
        by_operator_profile: remainderBreakdowns.by_operator_profile,
        by_combined_bucket: remainderBreakdowns.by_combined_bucket,
        largest_major_populations: largestMajorPopulations,
      },
      editorial_ceiling_analysis: {
        published_baseline_truth: {
          editorial_newsletter_sender_count:
            publishedBaselineTruth.subtype_sender_counts.editorial_newsletter,
        },
        current_local_after_state: {
          editorial_newsletter_sender_count:
            currentLocalAfterState.subtype_sender_counts.editorial_newsletter,
          editorial_cross_50_gap:
            50 - currentLocalAfterState.subtype_sender_counts.editorial_newsletter,
        },
        estimated_editorial_candidate_pool: {
          sender_count: editorialCandidatePool.length,
          cleanup_group_message_weight: sumCleanupGroupMessageWeight(editorialCandidatePool),
        },
        unresolved_editorial_candidate_blockers: editorialBlockers,
        captured_elsewhere_editorial_like_senders: summarizeRows(
          capturedElsewhereEditorialLike
        ),
      },
      product_marketing_expansion_analysis: {
        published_baseline_truth: {
          product_marketing_update_sender_count:
            publishedBaselineTruth.subtype_sender_counts.product_marketing_update,
        },
        current_local_after_state: {
          product_marketing_update_sender_count:
            currentLocalAfterState.subtype_sender_counts.product_marketing_update,
        },
        high_confidence_candidates: summarizeRows(highConfidenceProductCandidates),
        borderline_candidates: summarizeRows(borderlineProductCandidates),
        expansion_posture: productExpansionPosture,
      },
      remainder_truth_classification: {
        current_local_after_state: {
          unresolved_remainder_sender_count:
            currentLocalAfterState.unresolved_remainder_sender_count,
          unresolved_remainder_cleanup_group_message_weight:
            unresolvedMessageWeightTotal,
        },
        classification_rules: {
          promotable:
            'family_resolution = clear and cue lead is editorial or product/update over both alternative cue families',
          decomposable:
            'family_resolution = mixed, or family_resolution = clear without a clean editorial/product cue lead',
          keep_unresolved: 'family_resolution = thin_history',
        },
        promotable: classifications.promotable,
        decomposable: classifications.decomposable,
        keep_unresolved: classifications.keep_unresolved,
      },
      recommended_next_phase: {
        phase_name:
          'Clear-Family Unresolved Marketing Remainder Pattern-Clarity Pass',
        target_population: {
          label:
            'clear-family unresolved marketing remainder under the current locked artifact',
          sender_count: clearFamilyUnresolvedRows.length,
          cleanup_group_message_weight: sumCleanupGroupMessageWeight(
            clearFamilyUnresolvedRows
          ),
        },
        resolver_objective:
          'Increase pattern-level clarity inside the existing clear-family unresolved marketing remainder so current subtype gains can translate into stronger persistence under the current contract.',
        explicit_guardrail:
          'Preserve the current resolver and current rollup-contract thresholds, and leave thin-history or mixed remainder senders unresolved unless current evidence already supports existing subtype assignment.',
      },
      validations: buildReconciliations(unresolvedRows, remainderBreakdowns, classifications),
    }

    return memo
  })
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === scriptPath

if (isMain) {
  const memo = await buildMemo()
  console.log(JSON.stringify(memo, null, 2))
}
