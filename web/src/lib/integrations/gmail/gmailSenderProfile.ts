import type {
  GmailCanonicalSenderCategoryLabel,
  GmailCategorySummarySource,
  GmailDominantCategoryConfidence,
  GmailOperatorProfileFamily,
  GmailOperatorProfileMode,
  GmailOperatorProfileSource,
  GmailResolvedSemanticFamily,
  GmailResolvedSemanticPattern,
  GmailSenderCategoryDistributionEntry,
  GmailSenderCategoryProfileMode,
  GmailSenderOperatorProfile,
  GmailSenderPatternMixEntry,
  GmailSemanticConfidence,
  GmailSemanticFamily,
  GmailSemanticFamilyProvenance,
  GmailSemanticPatternClass,
  GmailSemanticPatternProvenance,
  GmailSemanticResolution,
} from '@/lib/runtime/gmailCleanupWorkspace'

const CANONICAL_GMAIL_CATEGORY_PRECEDENCE: GmailCanonicalSenderCategoryLabel[] = [
  'Promotions',
  'Social',
  'Updates',
  'Forums',
  'Primary',
]

const CANONICAL_GMAIL_CATEGORY_LABEL_MAP: Record<string, GmailCanonicalSenderCategoryLabel> = {
  CATEGORY_PROMOTIONS: 'Promotions',
  CATEGORY_SOCIAL: 'Social',
  CATEGORY_UPDATES: 'Updates',
  CATEGORY_FORUMS: 'Forums',
  CATEGORY_PRIMARY: 'Primary',
}

const CANONICAL_GMAIL_CATEGORY_SET = new Set<GmailCanonicalSenderCategoryLabel>([
  ...CANONICAL_GMAIL_CATEGORY_PRECEDENCE,
  'Uncategorized',
])

const CANONICAL_GMAIL_CATEGORY_SORT_WEIGHT = new Map<GmailCanonicalSenderCategoryLabel, number>([
  ['Promotions', 0],
  ['Social', 1],
  ['Updates', 2],
  ['Forums', 3],
  ['Primary', 4],
  ['Uncategorized', 5],
])

export const GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL = 'Newsletter / promotional'
export const GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS = 'Invoices / receipts'
export const GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING = 'Commerce / shipping updates'
export const GMAIL_PATTERN_LABEL_ALERTS_SECURITY = 'Alerts / security'
export const GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE = 'Human correspondence'
export const GMAIL_PATTERN_LABEL_GENERAL_UPDATES = 'General updates'
export const GMAIL_PATTERN_LABEL_UNRESOLVED = 'Unresolved / mixed'
export const GMAIL_PATTERN_LABEL_THIN_HISTORY = 'Thin history'
export const GMAIL_MARKETING_SUBTYPE_LABEL_EDITORIAL_NEWSLETTER = 'Editorial newsletter'
export const GMAIL_MARKETING_SUBTYPE_LABEL_OFFER_CAMPAIGN = 'Offer campaign'
export const GMAIL_MARKETING_SUBTYPE_LABEL_PRODUCT_MARKETING_UPDATE = 'Product marketing update'

const GENERAL_UPDATE_SUBJECT_PATTERN =
  /\b(update|updates|notification|notifications|notice|notices|reminder|reminders|status|statement|statements|summary|summaries|activity|activities|account|accounts|report|reports|available|availability|confirmation|confirmed|ready|scheduled)\b/
const MARKETING_EDITORIAL_SUBJECT_PATTERNS = [
  /\bnewsletter\b/,
  /\bnews digest\b/,
  /\bdigest\b/,
  /\broundup\b/,
  /\bbriefing\b/,
  /\bedition\b/,
  /\bdigital edition\b/,
  /\be-issue\b/,
  /\bissue\b/,
  /\brecap\b/,
  /\bweekly\b/,
  /\bdaily\b/,
  /\bmonthly\b/,
  /\bmagazine\b/,
  /\btop stories\b/,
  /\breads\b/,
  /\bspotlight\b/,
  /\bsummary\b/,
  /\bheadlines\b/,
  /\bhighlights\b/,
  /\bweekly ad\b/,
  /\bgift guide\b/,
]
const MARKETING_OFFER_SUBJECT_PATTERNS = [
  /(?<!for )\bsale\b/,
  /\boffer\b/,
  /\bcoupon\b/,
  /\bdiscount\b/,
  /\bdeal\b/,
  /\bclearance\b/,
  /\bsave\b/,
  /\blast chance\b/,
  /\b\d+%\s*off\b/,
  /\bfree shipping\b/,
  /\bpromo\b/,
]
const MARKETING_PRODUCT_UPDATE_SUBJECT_PATTERNS = [
  /\bintroducing\b/,
  /\bannouncing\b/,
  /\bannouncement\b/,
  /\blaunch\b/,
  /\brelease(?:d)?\b/,
  /\bnew feature\b/,
  /\bfeature\b/,
  /\bwhat(?:'|’)s new\b/,
  /\bproduct updates?\b/,
  /\bnew listings?\b/,
  /\bnew for sale\b/,
  /\bprice drops?\b/,
  /\bnew sellers?\b/,
  /\bseller perks?\b/,
  /\bnow available\b/,
  /\bcoming soon\b/,
  /\bwebinar\b/,
  /\bdemo\b/,
  /\bonboarding\b/,
  /\bchecklist\b/,
  /\btraining\b/,
  /\bcourse\b/,
  /\bworkshop\b/,
  /\ball hands\b/,
  /\bagenda\b/,
  /\bkeynote\b/,
  /\bbenchmarks?\b/,
  /\bmarket report\b/,
  /\bhome report\b/,
  /\breport is ready\b/,
  /\bplaybook\b/,
  /\bresearch\b/,
  /\brsvp\b/,
  /\binvited\b/,
  /\broadmap\b/,
  /\bstrategy\b/,
  /\bversion\b/,
]
const MARKETING_EDITORIAL_SENDER_PATTERNS = [
  /\bnewsletter\b/,
  /\bdigest\b/,
  /newsdigest/,
  /\bbriefing\b/,
  /\bdaily\b/,
  /\bedition\b/,
  /\bmagazine\b/,
  /\bnews\b/,
]

const DOMINANT_CATEGORY_CONFIDENCE_SET = new Set<GmailDominantCategoryConfidence>([
  'high',
  'medium',
  'low',
])

const CATEGORY_PROFILE_MODE_SET = new Set<GmailSenderCategoryProfileMode>([
  'dominant',
  'mixed',
  'uncategorized',
  'insufficient_data',
])

const OPERATOR_PROFILE_FAMILY_SET = new Set<GmailOperatorProfileFamily>([
  'marketing_promotional',
  'commerce_transactional',
  'account_notification',
  'security_alert',
  'social_community',
  'human_personal',
  'mixed_behavior',
  'insufficient_data',
])

const OPERATOR_PROFILE_MODE_SET = new Set<GmailOperatorProfileMode>([
  'clear',
  'mixed',
  'insufficient_data',
])

const OPERATOR_PROFILE_SOURCE_SET = new Set<GmailOperatorProfileSource>([
  'sender_global_operator_profile_v1',
  'insufficient_data',
])

type CanonicalSenderCategoryProfileCore = {
  category_distribution: GmailSenderCategoryDistributionEntry[]
  categorized_message_count: number
  uncategorized_message_count: number
  multi_category_message_count: number
  dominant_category: GmailCanonicalSenderCategoryLabel | null
  dominant_category_confidence: GmailDominantCategoryConfidence | null
  category_profile_mode: GmailSenderCategoryProfileMode
}

export type CanonicalSenderCategoryProfile = CanonicalSenderCategoryProfileCore & {
  category_summary: string
  category_summary_source: GmailCategorySummarySource
}

function roundSharePct(count: number, total: number): number {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((count / total) * 100)
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function normalizeCanonicalSenderCategoryLabel(
  value: unknown
): GmailCanonicalSenderCategoryLabel | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return CANONICAL_GMAIL_CATEGORY_SET.has(normalized as GmailCanonicalSenderCategoryLabel)
    ? (normalized as GmailCanonicalSenderCategoryLabel)
    : null
}

function sortCategoryDistribution(
  left: GmailSenderCategoryDistributionEntry,
  right: GmailSenderCategoryDistributionEntry
): number {
  if (left.label === 'Uncategorized' && right.label !== 'Uncategorized') return 1
  if (right.label === 'Uncategorized' && left.label !== 'Uncategorized') return -1
  return (
    right.count - left.count ||
    (CANONICAL_GMAIL_CATEGORY_SORT_WEIGHT.get(left.label) || 0) -
      (CANONICAL_GMAIL_CATEGORY_SORT_WEIGHT.get(right.label) || 0) ||
    left.label.localeCompare(right.label)
  )
}

function normalizeCategoryDistribution(
  value: unknown
): GmailSenderCategoryDistributionEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      const label = normalizeCanonicalSenderCategoryLabel(
        typeof entry === 'object' && entry != null ? (entry as { label?: unknown }).label : null
      )
      const count = normalizeCount(
        typeof entry === 'object' && entry != null ? (entry as { count?: unknown }).count : null
      )
      const sharePct = normalizeCount(
        typeof entry === 'object' && entry != null ? (entry as { share_pct?: unknown }).share_pct : null
      )
      if (!label || count <= 0) return null
      return {
        label,
        count,
        share_pct: sharePct,
      }
    })
    .filter((entry): entry is GmailSenderCategoryDistributionEntry => entry != null)
    .sort(sortCategoryDistribution)
}

export function normalizePatternMix(
  value: unknown
): GmailSenderPatternMixEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      const pattern =
        typeof entry === 'object' && entry != null && typeof (entry as { pattern?: unknown }).pattern === 'string'
          ? ((entry as { pattern: string }).pattern || '').trim()
          : ''
      const count = normalizeCount(
        typeof entry === 'object' && entry != null ? (entry as { count?: unknown }).count : null
      )
      const sharePct = normalizeCount(
        typeof entry === 'object' && entry != null ? (entry as { share_pct?: unknown }).share_pct : null
      )
      if (!pattern || count <= 0) return null
      return {
        pattern,
        count,
        share_pct: sharePct,
      }
    })
    .filter((entry): entry is GmailSenderPatternMixEntry => entry != null)
    .sort((left, right) => right.count - left.count || left.pattern.localeCompare(right.pattern))
}

function summarySourceForMode(
  mode: GmailSenderCategoryProfileMode
): GmailCategorySummarySource {
  if (mode === 'uncategorized') return 'uncategorized'
  if (mode === 'insufficient_data') return 'insufficient_data'
  return 'sender_global_category_distribution'
}

function summarizeCanonicalCategoryProfile(
  profile: CanonicalSenderCategoryProfileCore
): {
  category_summary: string
  category_summary_source: GmailCategorySummarySource
} {
  if (profile.category_profile_mode === 'insufficient_data') {
    return {
      category_summary: 'Insufficient data',
      category_summary_source: 'insufficient_data',
    }
  }

  if (profile.category_profile_mode === 'uncategorized') {
    return {
      category_summary: `Uncategorized (${profile.uncategorized_message_count})`,
      category_summary_source: 'uncategorized',
    }
  }

  const head = profile.category_distribution
    .slice(0, 2)
    .map((entry) => `${entry.label} (${entry.count})`)
    .join(' · ')

  if (head) {
    return {
      category_summary: head,
      category_summary_source: summarySourceForMode(profile.category_profile_mode),
    }
  }

  return {
    category_summary: 'Insufficient data',
    category_summary_source: 'insufficient_data',
  }
}

export function resolveCanonicalSenderCategoryFromLabels(
  categoryLabels: string[] | null | undefined
): {
  label: GmailCanonicalSenderCategoryLabel
  recognized_labels: GmailCanonicalSenderCategoryLabel[]
} {
  const recognizedLabels = Array.from(
    new Set(
      (categoryLabels || [])
        .map((label) => CANONICAL_GMAIL_CATEGORY_LABEL_MAP[label] || null)
        .filter((label): label is GmailCanonicalSenderCategoryLabel => label != null)
    )
  ).sort(
    (left, right) =>
      (CANONICAL_GMAIL_CATEGORY_SORT_WEIGHT.get(left) || 0) -
      (CANONICAL_GMAIL_CATEGORY_SORT_WEIGHT.get(right) || 0)
  )

  if (recognizedLabels.length === 0) {
    return {
      label: 'Uncategorized',
      recognized_labels: [],
    }
  }

  return {
    label: recognizedLabels[0],
    recognized_labels: recognizedLabels,
  }
}

export function classifySenderPatternFromSubjectText(subject: string | null | undefined): string {
  const text = (subject || '').toLowerCase()
  if (!text) return GMAIL_PATTERN_LABEL_UNRESOLVED
  if (/\b(newsletter|digest|subscription|promo|offer|sale|unsubscribe)\b/.test(text)) {
    return GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL
  }
  if (/\b(invoice|receipt|payment|bill|refund)\b/.test(text)) {
    return GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS
  }
  if (/\b(order|shipping|delivery|tracking|shipped|booking|itinerary|reservation|flight|hotel|trip|travel)\b/.test(text)) {
    return GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING
  }
  if (/\b(alert|security|otp|verify|verification|code|password|signin|login|reset)\b/.test(text)) {
    return GMAIL_PATTERN_LABEL_ALERTS_SECURITY
  }
  if (/\b(meeting|calendar|call|follow up|question|thanks)\b/.test(text)) {
    return GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE
  }
  if (GENERAL_UPDATE_SUBJECT_PATTERN.test(text)) {
    return GMAIL_PATTERN_LABEL_GENERAL_UPDATES
  }
  return GMAIL_PATTERN_LABEL_UNRESOLVED
}

export function buildCanonicalSenderCategoryProfile(params: {
  totalMessageCount: number
  categoryCounts: ReadonlyMap<GmailCanonicalSenderCategoryLabel, number>
  multiCategoryMessageCount: number
}): CanonicalSenderCategoryProfileCore {
  const totalMessageCount = normalizeCount(params.totalMessageCount)
  const uncategorizedMessageCount = normalizeCount(params.categoryCounts.get('Uncategorized') || 0)
  const categorizedMessageCount = Math.max(0, totalMessageCount - uncategorizedMessageCount)
  const categoryDistribution = Array.from(params.categoryCounts.entries())
    .map(([label, count]) => ({
      label,
      count: normalizeCount(count),
      share_pct: roundSharePct(normalizeCount(count), totalMessageCount),
    }))
    .filter((entry) => entry.count > 0)
    .sort(sortCategoryDistribution)

  if (totalMessageCount < 5) {
    return {
      category_distribution: categoryDistribution,
      categorized_message_count: categorizedMessageCount,
      uncategorized_message_count: uncategorizedMessageCount,
      multi_category_message_count: normalizeCount(params.multiCategoryMessageCount),
      dominant_category: null,
      dominant_category_confidence: null,
      category_profile_mode: 'insufficient_data',
    }
  }

  if (categorizedMessageCount === 0) {
    return {
      category_distribution: categoryDistribution,
      categorized_message_count: 0,
      uncategorized_message_count: uncategorizedMessageCount,
      multi_category_message_count: normalizeCount(params.multiCategoryMessageCount),
      dominant_category: 'Uncategorized',
      dominant_category_confidence: null,
      category_profile_mode: 'uncategorized',
    }
  }

  const categorizedDistribution = categoryDistribution.filter((entry) => entry.label !== 'Uncategorized')
  const topCategory = categorizedDistribution[0] || null
  const secondCategory = categorizedDistribution[1] || null

  if (!topCategory || categorizedMessageCount < 5) {
    return {
      category_distribution: categoryDistribution,
      categorized_message_count: categorizedMessageCount,
      uncategorized_message_count: uncategorizedMessageCount,
      multi_category_message_count: normalizeCount(params.multiCategoryMessageCount),
      dominant_category: null,
      dominant_category_confidence: null,
      category_profile_mode: 'insufficient_data',
    }
  }

  const topShare = topCategory.count / categorizedMessageCount
  const gapShare =
    (topCategory.count - (secondCategory?.count || 0)) / categorizedMessageCount
  const dominant =
    categorizedMessageCount >= 5 && topShare >= 0.55 && gapShare >= 0.1

  if (!dominant) {
    return {
      category_distribution: categoryDistribution,
      categorized_message_count: categorizedMessageCount,
      uncategorized_message_count: uncategorizedMessageCount,
      multi_category_message_count: normalizeCount(params.multiCategoryMessageCount),
      dominant_category: null,
      dominant_category_confidence: null,
      category_profile_mode: 'mixed',
    }
  }

  let confidence: GmailDominantCategoryConfidence = 'low'
  if (categorizedMessageCount >= 20 && topShare >= 0.7) confidence = 'high'
  else if (categorizedMessageCount >= 8 && topShare >= 0.6) confidence = 'medium'

  return {
    category_distribution: categoryDistribution,
    categorized_message_count: categorizedMessageCount,
    uncategorized_message_count: uncategorizedMessageCount,
    multi_category_message_count: normalizeCount(params.multiCategoryMessageCount),
    dominant_category: topCategory.label,
    dominant_category_confidence: confidence,
    category_profile_mode: 'dominant',
  }
}

export function buildPatternMixFromCounts(params: {
  patternCounts: ReadonlyMap<string, number>
  totalMessageCount: number
}): {
  dominant_pattern: string
  pattern_mix: GmailSenderPatternMixEntry[]
} {
  const totalMessageCount = normalizeCount(params.totalMessageCount)
  const patternMix = Array.from(params.patternCounts.entries())
    .map(([pattern, count]) => ({
      pattern: pattern.trim(),
      count: normalizeCount(count),
      share_pct: roundSharePct(normalizeCount(count), totalMessageCount),
    }))
    .filter((entry) => entry.pattern.length > 0 && entry.count > 0)
    .sort((left, right) => right.count - left.count || left.pattern.localeCompare(right.pattern))

  const topPattern = patternMix[0] || null
  const secondPattern = patternMix[1] || null
  const topShare = topPattern && totalMessageCount > 0 ? topPattern.count / totalMessageCount : 0
  const secondShare =
    secondPattern && totalMessageCount > 0 ? secondPattern.count / totalMessageCount : 0
  const gapShare = topShare - secondShare

  let dominantPattern = GMAIL_PATTERN_LABEL_THIN_HISTORY
  if (totalMessageCount >= 8 && topPattern) {
    if (topPattern.pattern === GMAIL_PATTERN_LABEL_UNRESOLVED) {
      dominantPattern = GMAIL_PATTERN_LABEL_UNRESOLVED
    } else if (topPattern.pattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES) {
      dominantPattern =
        topShare >= 0.55 && gapShare >= 0.15
          ? GMAIL_PATTERN_LABEL_GENERAL_UPDATES
          : GMAIL_PATTERN_LABEL_UNRESOLVED
    } else {
      dominantPattern =
        topShare >= 0.35 && gapShare >= 0.1
          ? topPattern.pattern
          : GMAIL_PATTERN_LABEL_UNRESOLVED
    }
  }

  return {
    dominant_pattern: dominantPattern,
    pattern_mix: patternMix,
  }
}

export function buildCanonicalSenderCategorySummary(
  profile: CanonicalSenderCategoryProfileCore
): CanonicalSenderCategoryProfile {
  const summary = summarizeCanonicalCategoryProfile(profile)
  return {
    ...profile,
    category_summary: summary.category_summary,
    category_summary_source: summary.category_summary_source,
  }
}

export function insufficientDataCanonicalSenderProfile(): CanonicalSenderCategoryProfile {
  return {
    category_distribution: [],
    categorized_message_count: 0,
    uncategorized_message_count: 0,
    multi_category_message_count: 0,
    dominant_category: null,
    dominant_category_confidence: null,
    category_profile_mode: 'insufficient_data',
    category_summary: 'Insufficient data',
    category_summary_source: 'insufficient_data',
  }
}

export function canonicalCategoryMixFromDistribution(
  distribution: GmailSenderCategoryDistributionEntry[]
): Array<{ category: string; count: number }> {
  return distribution.map((entry) => ({
    category: entry.label,
    count: entry.count,
  }))
}

export function canonicalSenderProfileFromPersistedStats(params: {
  categoryDistribution: unknown
  categorizedMessageCount: unknown
  uncategorizedMessageCount: unknown
  multiCategoryMessageCount: unknown
  dominantCategory: unknown
  dominantCategoryConfidence: unknown
  categoryProfileMode: unknown
}): CanonicalSenderCategoryProfile {
  const categoryDistribution = normalizeCategoryDistribution(params.categoryDistribution)
  const categorizedMessageCount = normalizeCount(params.categorizedMessageCount)
  const uncategorizedMessageCount = normalizeCount(params.uncategorizedMessageCount)
  const multiCategoryMessageCount = normalizeCount(params.multiCategoryMessageCount)
  const dominantCategory = normalizeCanonicalSenderCategoryLabel(params.dominantCategory)
  const dominantCategoryConfidence =
    typeof params.dominantCategoryConfidence === 'string' &&
    DOMINANT_CATEGORY_CONFIDENCE_SET.has(
      params.dominantCategoryConfidence as GmailDominantCategoryConfidence
    )
      ? (params.dominantCategoryConfidence as GmailDominantCategoryConfidence)
      : null
  const categoryProfileMode =
    typeof params.categoryProfileMode === 'string' &&
    CATEGORY_PROFILE_MODE_SET.has(params.categoryProfileMode as GmailSenderCategoryProfileMode)
      ? (params.categoryProfileMode as GmailSenderCategoryProfileMode)
      : 'insufficient_data'

  const looksMissing =
    categoryDistribution.length === 0 &&
    categorizedMessageCount === 0 &&
    uncategorizedMessageCount === 0 &&
    multiCategoryMessageCount === 0 &&
    dominantCategory == null &&
    dominantCategoryConfidence == null &&
    categoryProfileMode === 'insufficient_data'

  if (looksMissing) return insufficientDataCanonicalSenderProfile()

  return buildCanonicalSenderCategorySummary({
    category_distribution: categoryDistribution,
    categorized_message_count: categorizedMessageCount,
    uncategorized_message_count: uncategorizedMessageCount,
    multi_category_message_count: multiCategoryMessageCount,
    dominant_category: categoryProfileMode === 'uncategorized' ? 'Uncategorized' : dominantCategory,
    dominant_category_confidence:
      categoryProfileMode === 'dominant' ? dominantCategoryConfidence : null,
    category_profile_mode: categoryProfileMode,
  })
}

type SenderSignalBucket = 'likely_machine_generated' | 'likely_human' | 'uncertain'

type SemanticCompatibilitySourceKind = 'sender_stats' | 'artifact_seed'

type SemanticSubtypeSelection = {
  subtypeKey: string
  subtypeLabel: string
  umbrella: boolean
  decompositionStatus: 'resolved' | 'deferred'
}

type SemanticPatternSelection = {
  patternClass: GmailSemanticPatternClass
  subtype: SemanticSubtypeSelection | null
  familySubtype: SemanticSubtypeSelection | null
  provenance: GmailSemanticPatternProvenance
  resolution: GmailSemanticResolution
  confidence: GmailSemanticConfidence
}

type SemanticCompatibilityParams = {
  sender?: string | null
  subjectHints?: Array<string | null | undefined>
  totalMessageCount: number
  categoryProfile: Pick<
    CanonicalSenderCategoryProfile,
    | 'category_distribution'
    | 'categorized_message_count'
    | 'uncategorized_message_count'
    | 'dominant_category'
    | 'dominant_category_confidence'
    | 'category_profile_mode'
  >
  patternMix: GmailSenderPatternMixEntry[]
  dominantPattern: string | null | undefined
  operatorProfile: GmailSenderOperatorProfile
  machineProbability: number | null
  humanProbability: number | null
  sourceKind?: SemanticCompatibilitySourceKind
}

type OperatorProfileCandidate = {
  family: Exclude<
    GmailOperatorProfileFamily,
    'account_notification' | 'mixed_behavior' | 'insufficient_data'
  >
  score: number
  qualifies: boolean
  reasons: string[]
}

function normalizeOperatorProfileFamily(value: unknown): GmailOperatorProfileFamily | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return OPERATOR_PROFILE_FAMILY_SET.has(normalized as GmailOperatorProfileFamily)
    ? (normalized as GmailOperatorProfileFamily)
    : null
}

function normalizeOperatorProfileMode(value: unknown): GmailOperatorProfileMode | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return OPERATOR_PROFILE_MODE_SET.has(normalized as GmailOperatorProfileMode)
    ? (normalized as GmailOperatorProfileMode)
    : null
}

function normalizeOperatorProfileSource(value: unknown): GmailOperatorProfileSource | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return OPERATOR_PROFILE_SOURCE_SET.has(normalized as GmailOperatorProfileSource)
    ? (normalized as GmailOperatorProfileSource)
    : null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)
}

function normalizeSemanticConfidence(
  value: GmailDominantCategoryConfidence | null | undefined
): GmailSemanticConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return 'low'
}

function senderSignalBucketFromProbabilities(params: {
  machineProbability: number | null | undefined
  humanProbability: number | null | undefined
}): SenderSignalBucket {
  const machineProbability =
    typeof params.machineProbability === 'number' && Number.isFinite(params.machineProbability)
      ? params.machineProbability
      : 0
  const humanProbability =
    typeof params.humanProbability === 'number' && Number.isFinite(params.humanProbability)
      ? params.humanProbability
      : 0
  if (humanProbability >= 0.65) return 'likely_human'
  if (machineProbability >= 0.65) return 'likely_machine_generated'
  return 'uncertain'
}

function categoryCountForLabel(
  distribution: GmailSenderCategoryDistributionEntry[],
  label: GmailCanonicalSenderCategoryLabel
): number {
  return normalizeCount(distribution.find((entry) => entry.label === label)?.count || 0)
}

function patternCountForNames(
  patternMix: GmailSenderPatternMixEntry[],
  names: string[]
): number {
  const nameSet = new Set(names)
  return patternMix.reduce(
    (sum, entry) => (nameSet.has(entry.pattern) ? sum + normalizeCount(entry.count) : sum),
    0
  )
}

function ratio(count: number, total: number): number {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(total) || total <= 0) return 0
  return count / total
}

function formatRatioPercent(value: number): string {
  return `${Math.round(Math.max(0, value) * 100)}%`
}

function isConcreteOperatorProfileFamily(
  family: GmailOperatorProfileFamily | null | undefined
): family is GmailSemanticFamily {
  return (
    family === 'marketing_promotional' ||
    family === 'commerce_transactional' ||
    family === 'account_notification' ||
    family === 'security_alert' ||
    family === 'social_community' ||
    family === 'human_personal'
  )
}

function isFallbackPatternLabel(label: string | null | undefined): boolean {
  return (
    !label ||
    label === GMAIL_PATTERN_LABEL_UNRESOLVED ||
    label === GMAIL_PATTERN_LABEL_THIN_HISTORY
  )
}

function patternLabelToSemanticPatternClass(
  label: string | null | undefined
): GmailSemanticPatternClass | null {
  switch (label) {
    case GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL:
      return 'promotional_cycle'
    case GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS:
    case GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING:
      return 'transactional_cycle'
    case GMAIL_PATTERN_LABEL_ALERTS_SECURITY:
      return 'security_cycle'
    case GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE:
      return 'human_correspondence_cycle'
    case GMAIL_PATTERN_LABEL_GENERAL_UPDATES:
      return 'service_update_cycle'
    default:
      return null
  }
}

function patternLabelToSemanticFamily(
  label: string | null | undefined
): GmailSemanticFamily | null {
  switch (label) {
    case GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL:
      return 'marketing_promotional'
    case GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS:
    case GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING:
      return 'commerce_transactional'
    case GMAIL_PATTERN_LABEL_ALERTS_SECURITY:
      return 'security_alert'
    case GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE:
      return 'human_personal'
    case GMAIL_PATTERN_LABEL_GENERAL_UPDATES:
      return 'account_notification'
    default:
      return null
  }
}

function patternLabelToSubtypeSelection(
  label: string | null | undefined
): SemanticSubtypeSelection | null {
  switch (label) {
    case GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS:
      return {
        subtypeKey: 'invoices_receipts',
        subtypeLabel: GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
        umbrella: false,
        decompositionStatus: 'resolved',
      }
    case GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING:
      return {
        subtypeKey: 'commerce_shipping_updates',
        subtypeLabel: GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
        umbrella: false,
        decompositionStatus: 'resolved',
      }
    case GMAIL_PATTERN_LABEL_ALERTS_SECURITY:
      return {
        subtypeKey: 'alerts_security',
        subtypeLabel: GMAIL_PATTERN_LABEL_ALERTS_SECURITY,
        umbrella: false,
        decompositionStatus: 'resolved',
      }
    case GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE:
      return {
        subtypeKey: 'human_correspondence',
        subtypeLabel: GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE,
        umbrella: false,
        decompositionStatus: 'resolved',
      }
    case GMAIL_PATTERN_LABEL_GENERAL_UPDATES:
      return {
        subtypeKey: 'general_updates',
        subtypeLabel: GMAIL_PATTERN_LABEL_GENERAL_UPDATES,
        umbrella: true,
        decompositionStatus: 'deferred',
      }
    default:
      return null
  }
}

function familyToDefaultPatternClass(family: GmailSemanticFamily): GmailSemanticPatternClass {
  switch (family) {
    case 'marketing_promotional':
      return 'promotional_cycle'
    case 'commerce_transactional':
      return 'transactional_cycle'
    case 'account_notification':
      return 'service_update_cycle'
    case 'security_alert':
      return 'security_cycle'
    case 'social_community':
      return 'social_activity_cycle'
    case 'human_personal':
      return 'human_correspondence_cycle'
  }
}

function familyIsUmbrella(family: GmailSemanticFamily): boolean {
  return (
    family === 'marketing_promotional' ||
    family === 'commerce_transactional' ||
    family === 'account_notification' ||
    family === 'social_community'
  )
}

function semanticDecompositionPath(
  scope: 'family' | 'pattern'
): (base: string, subtypeKey?: string | null) => string {
  return (base: string, subtypeKey?: string | null) =>
    subtypeKey ? `${scope}/${base}/${subtypeKey}` : `${scope}/${base}`
}

const familyDecompositionPath = semanticDecompositionPath('family')
const patternDecompositionPath = semanticDecompositionPath('pattern')

function resolvedSubtypeSelection(
  subtypeKey: string,
  subtypeLabel: string
): SemanticSubtypeSelection {
  return {
    subtypeKey,
    subtypeLabel,
    umbrella: false,
    decompositionStatus: 'resolved',
  }
}

function marketingSubtypeSignalCount(historyCount: number, cueHits: number): number {
  return Math.max(0, historyCount) + Math.min(3, Math.max(0, cueHits))
}

function countMatchingSubjectHints(
  subjectHints: Array<string | null | undefined>,
  patterns: RegExp[]
): number {
  let matches = 0
  for (const subjectHint of subjectHints) {
    const text = (subjectHint || '').trim().toLowerCase()
    if (!text) continue
    if (patterns.some((pattern) => pattern.test(text))) matches += 1
  }
  return matches
}

function countMatchingSenderHints(
  sender: string | null | undefined,
  patterns: RegExp[]
): number {
  const text = (sender || '').trim().toLowerCase()
  if (!text) return 0
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0)
}

function resolveMarketingPromotionalSubtype(params: {
  sender: string | null | undefined
  subjectHints: Array<string | null | undefined>
  totalMessages: number
  categorizedMessages: number
  categoryProfile: Pick<CanonicalSenderCategoryProfile, 'category_distribution'>
  patternMix: GmailSenderPatternMixEntry[]
  dominantPattern: string | null | undefined
  operatorProfile: GmailSenderOperatorProfile
  familyResolution: GmailSemanticResolution
  allowClearFamilyRescue?: boolean
}): SemanticSubtypeSelection | null {
  if (params.totalMessages < 8 || params.categorizedMessages < 5) return null

  const promotionsShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Promotions'),
    params.categorizedMessages
  )
  const newsletterPromoCount = patternCountForNames(params.patternMix, [
    GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL,
  ])
  const generalUpdatesCount = patternCountForNames(params.patternMix, [
    GMAIL_PATTERN_LABEL_GENERAL_UPDATES,
  ])
  const transactionalPatternCount = patternCountForNames(params.patternMix, [
    GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
    GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
  ])
  const transactionalShare = ratio(
    transactionalPatternCount,
    params.totalMessages
  )
  const securityPatternCount = patternCountForNames(params.patternMix, [
    GMAIL_PATTERN_LABEL_ALERTS_SECURITY,
  ])
  const securityShare = ratio(
    securityPatternCount,
    params.totalMessages
  )
  const humanPatternCount = patternCountForNames(params.patternMix, [
    GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE,
  ])
  const humanShare = ratio(
    humanPatternCount,
    params.totalMessages
  )
  const marketingPatternCount = newsletterPromoCount + generalUpdatesCount
  const nonMarketingPatternCount =
    transactionalPatternCount + securityPatternCount + humanPatternCount
  const clearMarketingOperatorProfile =
    params.operatorProfile.operator_profile_mode === 'clear' &&
    params.operatorProfile.operator_profile_family === 'marketing_promotional'
  const hasMarketingGrounding =
    params.familyResolution === 'clear' || clearMarketingOperatorProfile || promotionsShare >= 0.35

  if (!hasMarketingGrounding) return null

  const editorialCueHits = countMatchingSubjectHints(
    params.subjectHints,
    MARKETING_EDITORIAL_SUBJECT_PATTERNS
  )
  const editorialSenderCueHits = countMatchingSenderHints(
    params.operatorProfile.operator_profile_mode === 'insufficient_data' ? null : params.sender,
    MARKETING_EDITORIAL_SENDER_PATTERNS
  )
  const offerCueHits = countMatchingSubjectHints(
    params.subjectHints,
    MARKETING_OFFER_SUBJECT_PATTERNS
  )
  const productUpdateCueHits = countMatchingSubjectHints(
    params.subjectHints,
    MARKETING_PRODUCT_UPDATE_SUBJECT_PATTERNS
  )

  const dominantPatternSupportsProduct =
    params.dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES
  const dominantPatternSupportsEditorial =
    params.dominantPattern === GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL
  const productSignalCount = marketingSubtypeSignalCount(generalUpdatesCount, productUpdateCueHits)
  const editorialSignalCount =
    marketingSubtypeSignalCount(newsletterPromoCount, editorialCueHits) + editorialSenderCueHits * 2
  const editorialCueSupport = editorialCueHits + editorialSenderCueHits * 2
  const marketingSubtypeSignalHistory = productSignalCount + editorialSignalCount
  const productSignalLead = productSignalCount - editorialSignalCount
  const editorialSignalLead = editorialSignalCount - productSignalCount
  const productCueHistoryStrong =
    productUpdateCueHits >= 8 &&
    productUpdateCueHits >= editorialCueHits + 2 &&
    offerCueHits <= productUpdateCueHits * 3
  const editorialCueHistoryStrong =
    editorialCueHits + editorialSenderCueHits * 2 >= 8 &&
    editorialCueHits + editorialSenderCueHits * 2 >= productUpdateCueHits &&
    offerCueHits <= Math.max(12, (editorialCueHits + editorialSenderCueHits * 2) * 3)
  const productStrongCueBypassesMixedHistory = productCueHistoryStrong && params.totalMessages >= 12
  const editorialStrongCueBypassesMixedHistory = editorialCueHistoryStrong && params.totalMessages >= 12
  const marketingPatternHistoryReady =
    marketingSubtypeSignalHistory >= 3 &&
    (nonMarketingPatternCount <= Math.max(12, marketingSubtypeSignalHistory * 3) ||
      productStrongCueBypassesMixedHistory ||
      editorialStrongCueBypassesMixedHistory)
  const productPatternAnchored =
    params.totalMessages >= 12 &&
    generalUpdatesCount >= 2 &&
    productUpdateCueHits >= 1 &&
    offerCueHits <= productUpdateCueHits + 4
  const editorialPatternAnchored =
    params.totalMessages >= 12 &&
    newsletterPromoCount >= 2 &&
    (editorialCueHits >= 1 || editorialSenderCueHits >= 1) &&
    offerCueHits <= editorialCueHits + editorialSenderCueHits * 2 + 4
  const productListingAlertStrong =
    params.totalMessages >= 20 &&
    productUpdateCueHits >= 8 &&
    (newsletterPromoCount >= 2 || generalUpdatesCount >= 1) &&
    offerCueHits <= productUpdateCueHits + 16
  const productBackfillSupported =
    params.totalMessages >= 20 &&
    generalUpdatesCount >= 1 &&
    (productUpdateCueHits >= 1 || generalUpdatesCount >= 3 || dominantPatternSupportsProduct) &&
    newsletterPromoCount <= generalUpdatesCount + 2 &&
    offerCueHits <= Math.max(4, productUpdateCueHits + 6) &&
    transactionalShare + securityShare + humanShare < 0.35
  const editorialBackfillSupported =
    params.totalMessages >= 20 &&
    (newsletterPromoCount >= 1 || editorialSenderCueHits >= 1) &&
    (editorialCueHits >= 1 ||
      editorialSenderCueHits >= 1 ||
      newsletterPromoCount >= 3 ||
      dominantPatternSupportsEditorial) &&
    generalUpdatesCount <= newsletterPromoCount + 2 &&
    offerCueHits <= Math.max(4, editorialCueHits + editorialSenderCueHits * 2 + 6) &&
    transactionalShare + securityShare + humanShare < 0.35
  const productCueDominant =
    productUpdateCueHits >= 2 &&
    productUpdateCueHits >= editorialCueHits + 1 &&
    offerCueHits <= productUpdateCueHits + 1
  const editorialCueDominant =
    editorialCueHits >= 2 &&
    editorialCueHits >= productUpdateCueHits + 1 &&
    offerCueHits <= editorialCueHits + 1

  const productHistoryLeadStrong =
    hasMarketingGrounding &&
    ((productSignalCount >= 3 && productSignalLead >= 1) ||
      (productCueDominant && productSignalCount >= 2 && productSignalLead >= 0) ||
      productPatternAnchored ||
      productBackfillSupported ||
      productListingAlertStrong ||
      productCueHistoryStrong) &&
    marketingPatternHistoryReady &&
    transactionalShare + securityShare + humanShare < 0.45
  const editorialHistoryLeadStrong =
    ((editorialSignalCount >= 3 && editorialSignalLead >= 1) ||
      (editorialCueDominant && editorialSignalCount >= 2 && editorialSignalLead >= 0) ||
      editorialPatternAnchored ||
      editorialBackfillSupported ||
      editorialCueHistoryStrong) &&
    marketingPatternHistoryReady

  const productHistoryClearlyWins =
    productHistoryLeadStrong &&
    (productSignalLead >= 2 ||
      productCueDominant ||
      productListingAlertStrong ||
      productCueHistoryStrong ||
      productBackfillSupported ||
      (dominantPatternSupportsProduct && generalUpdatesCount >= 2) ||
      generalUpdatesCount >= 4)
  const editorialHistoryClearlyWins =
    editorialHistoryLeadStrong &&
    (editorialSignalLead >= 2 ||
      editorialCueDominant ||
      editorialBackfillSupported ||
      editorialCueHistoryStrong ||
      (dominantPatternSupportsEditorial && newsletterPromoCount >= 2) ||
      newsletterPromoCount >= 4)
  const productPersistenceSupported =
    hasMarketingGrounding &&
    marketingPatternHistoryReady &&
    (generalUpdatesCount >= 1 ||
      productCueHistoryStrong ||
      productPatternAnchored ||
      productBackfillSupported ||
      productListingAlertStrong) &&
    (productUpdateCueHits >= 1 ||
      productCueHistoryStrong ||
      productPatternAnchored ||
      productBackfillSupported ||
      productListingAlertStrong) &&
    productSignalLead >= 0 &&
    transactionalShare + securityShare + humanShare < 0.45 &&
    (productCueDominant ||
      productPatternAnchored ||
      productBackfillSupported ||
      productListingAlertStrong ||
      productCueHistoryStrong ||
      dominantPatternSupportsProduct ||
      clearMarketingOperatorProfile ||
      generalUpdatesCount >= 2)
  const editorialPersistenceSupported =
    marketingPatternHistoryReady &&
    (newsletterPromoCount >= 1 ||
      editorialCueHistoryStrong ||
      editorialPatternAnchored ||
      editorialBackfillSupported) &&
    (editorialCueHits >= 1 ||
      editorialSenderCueHits >= 1 ||
      editorialCueHistoryStrong ||
      editorialPatternAnchored ||
      editorialBackfillSupported) &&
    editorialSignalLead >= 0 &&
    (editorialCueDominant ||
      editorialPatternAnchored ||
      editorialBackfillSupported ||
      editorialCueHistoryStrong ||
      dominantPatternSupportsEditorial ||
      clearMarketingOperatorProfile ||
      newsletterPromoCount >= 2)

  const productBlockedBySubjects =
    offerCueHits >= productUpdateCueHits + 3 && offerCueHits >= editorialCueHits + 2
  const editorialBlockedBySubjects =
    offerCueHits >= editorialCueHits + 3 && offerCueHits >= productUpdateCueHits + 2

  const productMarketingUpdateQualifies =
    (productHistoryClearlyWins || productPersistenceSupported) &&
    !productBlockedBySubjects
  const editorialNewsletterQualifies =
    (editorialHistoryClearlyWins || editorialPersistenceSupported) &&
    !editorialBlockedBySubjects
  const dominantPatternNeedsClearFamilyRescue =
    params.dominantPattern === GMAIL_PATTERN_LABEL_UNRESOLVED ||
    params.dominantPattern === GMAIL_PATTERN_LABEL_THIN_HISTORY
  const strongestMarketingAnchorCount = Math.max(newsletterPromoCount, generalUpdatesCount)
  const strongestConcreteNonMarketingCount = Math.max(
    transactionalPatternCount,
    securityPatternCount,
    humanPatternCount
  )
  const strongerConcreteNonMarketingEvidence =
    strongestConcreteNonMarketingCount >= strongestMarketingAnchorCount + 2 ||
    transactionalShare + securityShare + humanShare >= 0.45
  const clearFamilyRescueEligible =
    params.allowClearFamilyRescue !== false &&
    params.familyResolution === 'clear' &&
    clearMarketingOperatorProfile &&
    dominantPatternNeedsClearFamilyRescue &&
    !productMarketingUpdateQualifies &&
    !editorialNewsletterQualifies &&
    !strongerConcreteNonMarketingEvidence
  const productClearFamilyRescueQualifies =
    clearFamilyRescueEligible &&
    generalUpdatesCount >= 1 &&
    productUpdateCueHits >= 1 &&
    productSignalCount >= 2 &&
    productSignalLead >= 1 &&
    productUpdateCueHits >= editorialCueHits &&
    offerCueHits <= productUpdateCueHits + 1 &&
    nonMarketingPatternCount <= marketingPatternCount + 2 &&
    transactionalShare + securityShare + humanShare < 0.35
  const editorialClearFamilyRescueQualifies =
    clearFamilyRescueEligible &&
    (newsletterPromoCount >= 1 || editorialSenderCueHits >= 1) &&
    editorialCueSupport >= 1 &&
    editorialSignalCount >= 2 &&
    editorialSignalLead >= 1 &&
    editorialCueSupport >= productUpdateCueHits &&
    offerCueHits <= editorialCueSupport + 1 &&
    nonMarketingPatternCount <= marketingPatternCount + 2 &&
    transactionalShare + securityShare + humanShare < 0.35

  if (
    productMarketingUpdateQualifies ||
    editorialNewsletterQualifies ||
    productClearFamilyRescueQualifies ||
    editorialClearFamilyRescueQualifies
  ) {
    const productHistoryScore =
      productSignalCount * 3 +
      (dominantPatternSupportsProduct ? 2 : 0) +
      Math.min(6, productUpdateCueHits) +
      (productPatternAnchored ? 2 : 0)
    const editorialHistoryScore =
      editorialSignalCount * 3 +
      (dominantPatternSupportsEditorial ? 2 : 0) +
      Math.min(6, editorialCueHits) +
      editorialSenderCueHits * 2 +
      (editorialPatternAnchored ? 2 : 0)
    const productSelectionQualifies =
      productMarketingUpdateQualifies || productClearFamilyRescueQualifies
    const editorialSelectionQualifies =
      editorialNewsletterQualifies || editorialClearFamilyRescueQualifies

    if (productSelectionQualifies && !editorialSelectionQualifies) {
      return resolvedSubtypeSelection(
        'product_marketing_update',
        GMAIL_MARKETING_SUBTYPE_LABEL_PRODUCT_MARKETING_UPDATE
      )
    }

    if (editorialSelectionQualifies && !productSelectionQualifies) {
      return resolvedSubtypeSelection(
        'editorial_newsletter',
        GMAIL_MARKETING_SUBTYPE_LABEL_EDITORIAL_NEWSLETTER
      )
    }

    if (editorialCueHits >= productUpdateCueHits + 6) {
      return resolvedSubtypeSelection(
        'editorial_newsletter',
        GMAIL_MARKETING_SUBTYPE_LABEL_EDITORIAL_NEWSLETTER
      )
    }

    if (productUpdateCueHits >= editorialCueHits + 6) {
      return resolvedSubtypeSelection(
        'product_marketing_update',
        GMAIL_MARKETING_SUBTYPE_LABEL_PRODUCT_MARKETING_UPDATE
      )
    }

    if (productHistoryScore > editorialHistoryScore) {
      return resolvedSubtypeSelection(
        'product_marketing_update',
        GMAIL_MARKETING_SUBTYPE_LABEL_PRODUCT_MARKETING_UPDATE
      )
    }

    if (editorialHistoryScore > productHistoryScore) {
      return resolvedSubtypeSelection(
        'editorial_newsletter',
        GMAIL_MARKETING_SUBTYPE_LABEL_EDITORIAL_NEWSLETTER
      )
    }

    if (productUpdateCueHits > editorialCueHits) {
      return resolvedSubtypeSelection(
        'product_marketing_update',
        GMAIL_MARKETING_SUBTYPE_LABEL_PRODUCT_MARKETING_UPDATE
      )
    }

    return resolvedSubtypeSelection(
      'editorial_newsletter',
      GMAIL_MARKETING_SUBTYPE_LABEL_EDITORIAL_NEWSLETTER
    )
  }

  const offerHistoryGrounded =
    promotionsShare >= 0.55 &&
    (params.familyResolution === 'clear' ||
      clearMarketingOperatorProfile ||
      dominantPatternSupportsEditorial ||
      dominantPatternSupportsProduct ||
      marketingPatternCount >= 1)
  const offerBlockedByClearHistoryLead =
    productMarketingUpdateQualifies ||
    editorialNewsletterQualifies ||
    productClearFamilyRescueQualifies ||
    editorialClearFamilyRescueQualifies
  const offerCampaignQualifies =
    offerHistoryGrounded &&
    offerCueHits >= 2 &&
    offerCueHits >= editorialCueHits + 1 &&
    offerCueHits >= productUpdateCueHits + 1 &&
    !offerBlockedByClearHistoryLead

  if (offerCampaignQualifies) {
    return resolvedSubtypeSelection(
      'offer_campaign',
      GMAIL_MARKETING_SUBTYPE_LABEL_OFFER_CAMPAIGN
    )
  }

  return null
}

function preferSpecificPatternOverGeneralUpdates(params: {
  topLabel: string
  topCount: number
  topSharePct: number
  specificFallback: GmailSenderPatternMixEntry | null
}): boolean {
  if (params.topLabel !== GMAIL_PATTERN_LABEL_GENERAL_UPDATES || !params.specificFallback) return false
  return (
    params.specificFallback.count + 1 >= params.topCount ||
    params.specificFallback.share_pct >= Math.max(0, params.topSharePct - 10)
  )
}

function chooseConcretePatternLabelFromMix(
  patternMix: GmailSenderPatternMixEntry[],
  dominantPattern: string | null | undefined
): string | null {
  if (
    !isFallbackPatternLabel(dominantPattern) &&
    dominantPattern &&
    dominantPattern !== GMAIL_PATTERN_LABEL_GENERAL_UPDATES
  ) {
    return dominantPattern
  }

  const concreteEntries = patternMix.filter((entry) => !isFallbackPatternLabel(entry.pattern))
  if (concreteEntries.length === 0) {
    return dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES
      ? GMAIL_PATTERN_LABEL_GENERAL_UPDATES
      : null
  }

  const sorted = concreteEntries
    .slice()
    .sort((left, right) => right.count - left.count || left.pattern.localeCompare(right.pattern))
  const top = sorted[0]
  if (!top) return null
  const specificFallback =
    sorted.find((entry) => entry.pattern !== GMAIL_PATTERN_LABEL_GENERAL_UPDATES) || null
  if (
    preferSpecificPatternOverGeneralUpdates({
      topLabel: top.pattern,
      topCount: top.count,
      topSharePct: top.share_pct,
      specificFallback,
    })
  ) {
    return specificFallback?.pattern || null
  }
  return top.pattern
}

function selectConcretePatternLabelFromSubjects(
  subjectHints: Array<string | null | undefined>
): string | null {
  const counts = new Map<string, number>()
  for (const subjectHint of subjectHints) {
    const label = classifySenderPatternFromSubjectText(subjectHint)
    if (isFallbackPatternLabel(label)) continue
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  if (counts.size === 0) return null
  const ranked = Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  )
  const top = ranked[0]?.[0] || null
  const second = ranked[1] || null
  if (
    top === GMAIL_PATTERN_LABEL_GENERAL_UPDATES &&
    second &&
    second[1] + 1 >= (ranked[0]?.[1] || 0)
  ) {
    return second[0]
  }
  return top
}

function senderHeuristicFamily(sender: string | null | undefined): GmailSemanticFamily | null {
  const normalized = (sender || '').trim().toLowerCase()
  if (!normalized) return null
  if (/\b(newsletter|digest|substack|patreon|promotions?|promo|offers?|deals?|marketing)\b/.test(normalized)) {
    return 'marketing_promotional'
  }
  if (
    /\b(order|orders|shipping|delivery|tracking|receipt|invoice|billing|payments?|booking|reservation|trip|travel|shop)\b/.test(
      normalized
    )
  ) {
    return 'commerce_transactional'
  }
  if (/\b(security|verify|verification|auth|signin|login|password|otp|code|alert)\b/.test(normalized)) {
    return 'security_alert'
  }
  if (/\b(linkedin|facebook|instagram|reddit|discord|slack|tiktok|community|forum|social)\b/.test(normalized)) {
    return 'social_community'
  }
  if (/\b(account|support|helpdesk|status|notification|notifications|updates?)\b/.test(normalized)) {
    return 'account_notification'
  }
  return null
}

function fallbackFamilyFromCategoryAndSignal(params: {
  dominantCategory: GmailCanonicalSenderCategoryLabel | null
  signalBucket: SenderSignalBucket
}): GmailSemanticFamily {
  switch (params.dominantCategory) {
    case 'Promotions':
      return 'marketing_promotional'
    case 'Social':
    case 'Forums':
      return 'social_community'
    case 'Updates':
      return 'account_notification'
    case 'Primary':
      return params.signalBucket === 'likely_machine_generated'
        ? 'account_notification'
        : 'human_personal'
    default:
      return params.signalBucket === 'likely_human'
        ? 'human_personal'
        : 'account_notification'
  }
}

function semanticConfidenceFromScore(params: {
  score: number
  secondScore: number
  totalMessages: number
  preferLow?: boolean
}): GmailSemanticConfidence {
  if (params.preferLow) return 'low'
  const lead = Math.max(0, params.score - params.secondScore)
  if (params.totalMessages >= 20 && params.score >= 85 && lead >= 20) return 'high'
  if (params.totalMessages >= 8 && params.score >= 60 && lead >= 10) return 'medium'
  return 'low'
}

function semanticPatternConfidence(params: {
  totalMessages: number
  patternMix: GmailSenderPatternMixEntry[]
  selectedLabel: string | null
  resolution: GmailSemanticResolution
}): GmailSemanticConfidence {
  if (!params.selectedLabel || params.selectedLabel === GMAIL_PATTERN_LABEL_GENERAL_UPDATES) return 'low'
  if (params.resolution !== 'clear') return 'low'
  const selectedEntry = params.patternMix.find((entry) => entry.pattern === params.selectedLabel) || null
  const share = selectedEntry && params.totalMessages > 0 ? selectedEntry.count / params.totalMessages : 0
  if (params.totalMessages >= 20 && share >= 0.5) return 'high'
  if (params.totalMessages >= 8 && share >= 0.25) return 'medium'
  return 'low'
}

function familyCandidateScores(params: {
  totalMessageCount: number
  categoryProfile: Pick<
    CanonicalSenderCategoryProfile,
    'category_distribution' | 'categorized_message_count' | 'uncategorized_message_count'
  >
  patternMix: GmailSenderPatternMixEntry[]
  dominantPattern: string
  machineProbability: number | null
  humanProbability: number | null
}): {
  signalBucket: SenderSignalBucket
  candidates: Array<{ family: GmailSemanticFamily; score: number; reasons: string[] }>
} {
  const totalMessages = normalizeCount(params.totalMessageCount)
  const categorizedMessages = normalizeCount(params.categoryProfile.categorized_message_count)
  const signalBucket = senderSignalBucketFromProbabilities({
    machineProbability: params.machineProbability,
    humanProbability: params.humanProbability,
  })
  const dominantPattern =
    (params.dominantPattern || '').trim() || GMAIL_PATTERN_LABEL_GENERAL_UPDATES

  const promotionsShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Promotions'),
    categorizedMessages
  )
  const socialShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Social'),
    categorizedMessages
  )
  const forumsShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Forums'),
    categorizedMessages
  )
  const updatesShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Updates'),
    categorizedMessages
  )
  const primaryShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Primary'),
    categorizedMessages
  )
  const socialForumsShare = socialShare + forumsShare
  const updatesPrimaryShare = updatesShare + primaryShare
  const newsletterShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL]),
    totalMessages
  )
  const transactionalShare = ratio(
    patternCountForNames(params.patternMix, [
      GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
      GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
    ]),
    totalMessages
  )
  const securityShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_ALERTS_SECURITY]),
    totalMessages
  )
  const humanShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE]),
    totalMessages
  )
  const generalUpdatesShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_GENERAL_UPDATES]),
    totalMessages
  )

  const marketingScore =
    (promotionsShare >= 0.55 ? 70 : promotionsShare >= 0.35 ? 50 : 0) +
    (newsletterShare >= 0.2 ? 20 : newsletterShare >= 0.1 ? 10 : 0) +
    (signalBucket === 'likely_machine_generated' ? 10 : signalBucket === 'uncertain' ? 5 : 0)
  const commercePatternScore =
    transactionalShare >= 0.3
      ? 40
      : transactionalShare >= 0.2 ||
          dominantPattern === GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING ||
          dominantPattern === GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS
        ? 30
        : 0
  const commerceScore =
    (updatesPrimaryShare >= 0.75 ? 40 : updatesPrimaryShare >= 0.6 ? 30 : 0) +
    commercePatternScore +
    (signalBucket === 'likely_machine_generated' ? 20 : signalBucket === 'uncertain' ? 10 : 0)
  const socialScore =
    (socialForumsShare >= 0.75 ? 75 : socialForumsShare >= 0.6 ? 60 : 0) +
    (signalBucket === 'likely_machine_generated' ? 15 : signalBucket === 'uncertain' ? 5 : 0)
  const securityScore =
    (updatesPrimaryShare >= 0.8 ? 30 : updatesPrimaryShare >= 0.7 ? 20 : 0) +
    (securityShare >= 0.4 ? 40 : securityShare >= 0.3 ? 30 : 0) +
    (signalBucket === 'likely_machine_generated' ? 30 : 0)
  const humanScore =
    (primaryShare >= 0.7 ? 30 : primaryShare >= 0.5 ? 20 : 0) +
    (humanShare >= 0.5 ? 40 : humanShare >= 0.35 ? 30 : 0) +
    (signalBucket === 'likely_human' ? 30 : 0)
  const accountScore =
    (updatesPrimaryShare >= 0.75 ? 55 : updatesPrimaryShare >= 0.6 ? 45 : 0) +
    (generalUpdatesShare >= 0.35
      ? 10
      : dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES
        ? 5
        : 0) +
    (signalBucket === 'likely_machine_generated' ? 10 : signalBucket === 'uncertain' ? 5 : 0)

  const candidatesBase: Array<{ family: GmailSemanticFamily; score: number; reasons: string[] }> = [
      {
        family: 'marketing_promotional',
        score: marketingScore,
        reasons: [
          `Promotions accounts for ${formatRatioPercent(promotionsShare)} of categorized sender history.`,
          ...(newsletterShare >= 0.1
            ? [
                `Newsletter/promotional pattern accounts for ${formatRatioPercent(newsletterShare)} of indexed sender history.`,
              ]
            : []),
        ],
      },
      {
        family: 'commerce_transactional',
        score: commerceScore,
        reasons: [
          `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
          ...(commercePatternScore >= 30
            ? [
                transactionalShare >= 0.2
                  ? `Transactional commerce patterns account for ${formatRatioPercent(transactionalShare)} of indexed sender history.`
                  : `Dominant pattern is ${dominantPattern}.`,
              ]
            : []),
        ],
      },
      {
        family: 'account_notification',
        score: accountScore,
        reasons: [
          `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
          ...(generalUpdatesShare >= 0.35
            ? [
                `General-updates pattern accounts for ${formatRatioPercent(generalUpdatesShare)} of indexed sender history.`,
              ]
            : dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES
              ? ['Dominant pattern is General updates.']
              : []),
        ],
      },
      {
        family: 'security_alert',
        score: securityScore,
        reasons: [
          `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
          `Security-alert pattern accounts for ${formatRatioPercent(securityShare)} of indexed sender history.`,
        ],
      },
      {
        family: 'social_community',
        score: socialScore,
        reasons: [
          `Social/Forums accounts for ${formatRatioPercent(socialForumsShare)} of categorized sender history.`,
        ],
      },
      {
        family: 'human_personal',
        score: humanScore,
        reasons: [
          `Primary accounts for ${formatRatioPercent(primaryShare)} of categorized sender history.`,
          `Human-correspondence pattern accounts for ${formatRatioPercent(humanShare)} of indexed sender history.`,
        ],
      },
    ]
  const candidates = candidatesBase.map((candidate) => ({
      ...candidate,
      reasons: [
        ...candidate.reasons,
        ...(signalBucket === 'likely_machine_generated'
          ? ['Sender-history signal bucket is Likely automated.']
          : signalBucket === 'likely_human'
            ? ['Sender-history signal bucket is Likely human.']
            : ['Sender-history signal bucket is Unclear.']),
      ],
    }))

  return {
    signalBucket,
    candidates,
  }
}

function resolveSemanticPatternSelection(
  params: SemanticCompatibilityParams & {
    family: GmailSemanticFamily
    familyResolution: GmailSemanticResolution
  }
): SemanticPatternSelection {
  const sourceKind = params.sourceKind || 'sender_stats'
  const totalMessages = normalizeCount(params.totalMessageCount)
  const concreteLabelFromMix = chooseConcretePatternLabelFromMix(params.patternMix, params.dominantPattern)
  const concreteLabelFromSubjects = selectConcretePatternLabelFromSubjects(params.subjectHints || [])
  const selectedLabel = concreteLabelFromMix || concreteLabelFromSubjects || null
  const selectedClass =
    patternLabelToSemanticPatternClass(selectedLabel) || familyToDefaultPatternClass(params.family)

  let provenance: GmailSemanticPatternProvenance =
    sourceKind === 'artifact_seed' ? 'artifact_seed_compat' : 'ranked_evidence_compat'
  if (selectedLabel) {
    provenance =
      sourceKind === 'artifact_seed'
        ? 'artifact_seed_compat'
        : concreteLabelFromMix
          ? 'pattern_label_compat'
          : 'subject_heuristic'
  }

  const patternFallbackState =
    params.dominantPattern === GMAIL_PATTERN_LABEL_UNRESOLVED
      ? 'mixed'
      : params.dominantPattern === GMAIL_PATTERN_LABEL_THIN_HISTORY
        ? 'thin_history'
        : null
  const resolution: GmailSemanticResolution =
    selectedLabel == null
      ? params.familyResolution === 'mixed'
        ? 'mixed'
        : 'thin_history'
      : patternFallbackState || params.familyResolution

  const clearFamilyRescueAllowed = sourceKind !== 'artifact_seed'
  const baseMarketingSubtype =
    params.family === 'marketing_promotional'
      ? resolveMarketingPromotionalSubtype({
          sender: params.sender,
          subjectHints: params.subjectHints || [],
          totalMessages,
          categorizedMessages: normalizeCount(params.categoryProfile.categorized_message_count),
          categoryProfile: params.categoryProfile,
          patternMix: params.patternMix,
          dominantPattern: params.dominantPattern,
          operatorProfile: params.operatorProfile,
          familyResolution: params.familyResolution,
          allowClearFamilyRescue: false,
        })
      : null
  const marketingSubtype =
    baseMarketingSubtype ||
    (params.family === 'marketing_promotional' && clearFamilyRescueAllowed
      ? resolveMarketingPromotionalSubtype({
          sender: params.sender,
          subjectHints: params.subjectHints || [],
          totalMessages,
          categorizedMessages: normalizeCount(params.categoryProfile.categorized_message_count),
          categoryProfile: params.categoryProfile,
          patternMix: params.patternMix,
          dominantPattern: params.dominantPattern,
          operatorProfile: params.operatorProfile,
          familyResolution: params.familyResolution,
          allowClearFamilyRescue: true,
        })
      : null)
  const rescuedMarketingSubtype = baseMarketingSubtype == null && marketingSubtype != null
  const resolvedPatternResolution: GmailSemanticResolution =
    rescuedMarketingSubtype ? 'clear' : resolution
  const confidence = semanticPatternConfidence({
    totalMessages,
    patternMix: params.patternMix,
    selectedLabel,
    resolution: resolvedPatternResolution,
  })
  const subtype = marketingSubtype || patternLabelToSubtypeSelection(selectedLabel)
  const familySubtype = marketingSubtype
  const resolvedPatternClass = marketingSubtype ? 'promotional_cycle' : selectedClass

  return {
    patternClass: resolvedPatternClass,
    subtype,
    familySubtype,
    provenance,
    resolution: resolvedPatternResolution,
    confidence,
  }
}

function operatorProfileSummaryForFamily(
  family: Exclude<GmailOperatorProfileFamily, 'mixed_behavior' | 'insufficient_data'>
): string {
  switch (family) {
    case 'marketing_promotional':
      return 'Promotions-heavy sender with marketing/promotional behavior'
    case 'commerce_transactional':
      return 'Notification-heavy sender with transactional commerce behavior'
    case 'account_notification':
      return 'Updates/Primary sender with general account-notification behavior'
    case 'security_alert':
      return 'Notification-heavy sender with strong security-alert behavior'
    case 'social_community':
      return 'Social/community sender with social or forum-heavy history'
    case 'human_personal':
      return 'Primary-heavy sender with human-personal correspondence behavior'
  }
}

export function insufficientDataOperatorProfile(
  reasons: string[] = []
): GmailSenderOperatorProfile {
  return {
    operator_profile_family: 'insufficient_data',
    operator_profile_mode: 'insufficient_data',
    operator_profile_confidence: null,
    operator_profile_summary: 'Insufficient data',
    operator_profile_reasons: reasons,
    operator_profile_source: 'insufficient_data',
  }
}

function mixedBehaviorOperatorProfile(params: {
  topFamily: OperatorProfileCandidate
  secondFamily: OperatorProfileCandidate
}): GmailSenderOperatorProfile {
  return {
    operator_profile_family: 'mixed_behavior',
    operator_profile_mode: 'mixed',
    operator_profile_confidence: null,
    operator_profile_summary: 'Competing strong sender-history interpretations are present',
    operator_profile_reasons: [
      `${params.topFamily.family} scored ${params.topFamily.score}.`,
      `${params.secondFamily.family} scored ${params.secondFamily.score}.`,
      'The top two qualified interpretations are close enough that picking one would overstate certainty.',
    ],
    operator_profile_source: 'sender_global_operator_profile_v1',
  }
}

function clearOperatorProfile(params: {
  family: Exclude<GmailOperatorProfileFamily, 'mixed_behavior' | 'insufficient_data'>
  score: number
  secondBestScore: number
  reasons: string[]
}): GmailSenderOperatorProfile {
  const lead = Math.max(0, params.score - params.secondBestScore)
  let confidence: GmailDominantCategoryConfidence = 'low'
  if (params.score >= 85 && lead >= 20) confidence = 'high'
  else if (params.score >= 70 && lead >= 15) confidence = 'medium'

  return {
    operator_profile_family: params.family,
    operator_profile_mode: 'clear',
    operator_profile_confidence: confidence,
    operator_profile_summary: operatorProfileSummaryForFamily(params.family),
    operator_profile_reasons: params.reasons,
    operator_profile_source: 'sender_global_operator_profile_v1',
  }
}

export function buildConservativeOperatorProfile(params: {
  totalMessageCount: number
  categoryProfile: Pick<
    CanonicalSenderCategoryProfile,
    'category_distribution' | 'categorized_message_count' | 'uncategorized_message_count'
  >
  patternMix: GmailSenderPatternMixEntry[]
  dominantPattern: string
  machineProbability: number | null
  humanProbability: number | null
}): GmailSenderOperatorProfile {
  const totalMessages = normalizeCount(params.totalMessageCount)
  const categorizedMessages = normalizeCount(params.categoryProfile.categorized_message_count)
  const uncategorizedMessages = normalizeCount(params.categoryProfile.uncategorized_message_count)
  const uncategorizedRatio = ratio(uncategorizedMessages, totalMessages)
  const signalBucket = senderSignalBucketFromProbabilities({
    machineProbability: params.machineProbability,
    humanProbability: params.humanProbability,
  })
  const dominantPattern =
    (params.dominantPattern || '').trim() || GMAIL_PATTERN_LABEL_GENERAL_UPDATES

  if (totalMessages < 8) {
    return insufficientDataOperatorProfile([
      `Only ${totalMessages.toLocaleString()} indexed message${totalMessages === 1 ? '' : 's'} are available for this sender.`,
    ])
  }

  if (categorizedMessages < 8) {
    return insufficientDataOperatorProfile([
      `Only ${categorizedMessages.toLocaleString()} categorized indexed message${categorizedMessages === 1 ? '' : 's'} are available for this sender.`,
    ])
  }

  const promotionsShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Promotions'),
    categorizedMessages
  )
  const socialShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Social'),
    categorizedMessages
  )
  const forumsShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Forums'),
    categorizedMessages
  )
  const updatesShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Updates'),
    categorizedMessages
  )
  const primaryShare = ratio(
    categoryCountForLabel(params.categoryProfile.category_distribution, 'Primary'),
    categorizedMessages
  )
  const socialForumsShare = socialShare + forumsShare
  const updatesPrimaryShare = updatesShare + primaryShare

  const newsletterShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_NEWSLETTER_PROMOTIONAL]),
    totalMessages
  )
  const transactionalShare = ratio(
    patternCountForNames(params.patternMix, [
      GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING,
      GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS,
    ]),
    totalMessages
  )
  const securityShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_ALERTS_SECURITY]),
    totalMessages
  )
  const humanShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_HUMAN_CORRESPONDENCE]),
    totalMessages
  )
  const generalUpdatesShare = ratio(
    patternCountForNames(params.patternMix, [GMAIL_PATTERN_LABEL_GENERAL_UPDATES]),
    totalMessages
  )

  const marketingScore =
    (promotionsShare >= 0.55 ? 70 : promotionsShare >= 0.35 ? 50 : 0) +
    (newsletterShare >= 0.2 ? 20 : newsletterShare >= 0.1 ? 10 : 0) +
    (signalBucket === 'likely_machine_generated' ? 10 : signalBucket === 'uncertain' ? 5 : 0)
  const marketingQualifies = promotionsShare >= 0.35 && marketingScore >= 65
  const marketingReasons = [
    `Promotions accounts for ${formatRatioPercent(promotionsShare)} of categorized sender history.`,
    ...(newsletterShare >= 0.1
      ? [`Newsletter/promotional pattern accounts for ${formatRatioPercent(newsletterShare)} of indexed sender history.`]
      : []),
    ...(signalBucket === 'likely_machine_generated'
      ? ['Sender-history signal bucket is Likely automated.']
      : signalBucket === 'uncertain'
        ? ['Sender-history signal bucket is Unclear.']
        : []),
  ]

  const commercePatternScore =
    transactionalShare >= 0.3
      ? 40
      : transactionalShare >= 0.2 ||
          dominantPattern === GMAIL_PATTERN_LABEL_COMMERCE_SHIPPING ||
          dominantPattern === GMAIL_PATTERN_LABEL_INVOICES_RECEIPTS
        ? 30
        : 0
  const commerceScore =
    (updatesPrimaryShare >= 0.75 ? 40 : updatesPrimaryShare >= 0.6 ? 30 : 0) +
    commercePatternScore +
    (signalBucket === 'likely_machine_generated' ? 20 : signalBucket === 'uncertain' ? 10 : 0)
  const commerceQualifies =
    updatesPrimaryShare >= 0.6 && commercePatternScore >= 30 && commerceScore >= 70
  const commerceReasons = [
    `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
    ...(commercePatternScore >= 30
      ? [
          transactionalShare >= 0.2
            ? `Transactional commerce patterns account for ${formatRatioPercent(transactionalShare)} of indexed sender history.`
            : `Dominant pattern is ${dominantPattern}.`,
        ]
      : []),
    ...(signalBucket === 'likely_machine_generated'
      ? ['Sender-history signal bucket is Likely automated.']
      : signalBucket === 'uncertain'
        ? ['Sender-history signal bucket is Unclear.']
        : []),
  ]

  const socialScore =
    (socialForumsShare >= 0.75 ? 75 : socialForumsShare >= 0.6 ? 60 : 0) +
    (signalBucket === 'likely_machine_generated' ? 15 : signalBucket === 'uncertain' ? 5 : 0)
  const socialQualifies = socialForumsShare >= 0.6 && socialScore >= 65
  const socialReasons = [
    `Social/Forums accounts for ${formatRatioPercent(socialForumsShare)} of categorized sender history.`,
    ...(signalBucket === 'likely_machine_generated'
      ? ['Sender-history signal bucket is Likely automated.']
      : signalBucket === 'uncertain'
        ? ['Sender-history signal bucket is Unclear.']
        : []),
  ]

  const securityScore =
    (updatesPrimaryShare >= 0.8 ? 30 : updatesPrimaryShare >= 0.7 ? 20 : 0) +
    (securityShare >= 0.4 ? 40 : securityShare >= 0.3 ? 30 : 0) +
    (signalBucket === 'likely_machine_generated' ? 30 : 0)
  const securityQualifies =
    totalMessages >= 20 &&
    categorizedMessages >= 8 &&
    updatesPrimaryShare >= 0.7 &&
    securityShare >= 0.3 &&
    signalBucket === 'likely_machine_generated' &&
    securityScore >= 80
  const securityReasons = [
    `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
    `Security-alert pattern accounts for ${formatRatioPercent(securityShare)} of indexed sender history.`,
    ...(signalBucket === 'likely_machine_generated'
      ? ['Sender-history signal bucket is Likely automated.']
      : []),
  ]

  const humanScore =
    (primaryShare >= 0.7 ? 30 : primaryShare >= 0.5 ? 20 : 0) +
    (humanShare >= 0.5 ? 40 : humanShare >= 0.35 ? 30 : 0) +
    (signalBucket === 'likely_human' ? 30 : 0)
  const humanQualifies =
    totalMessages >= 10 &&
    categorizedMessages >= 8 &&
    primaryShare >= 0.5 &&
    humanShare >= 0.35 &&
    signalBucket === 'likely_human' &&
    humanScore >= 80
  const humanReasons = [
    `Primary accounts for ${formatRatioPercent(primaryShare)} of categorized sender history.`,
    `Human-correspondence pattern accounts for ${formatRatioPercent(humanShare)} of indexed sender history.`,
    ...(signalBucket === 'likely_human' ? ['Sender-history signal bucket is Likely human.'] : []),
  ]

  const specificCandidates: OperatorProfileCandidate[] = [
    {
      family: 'marketing_promotional',
      score: marketingScore,
      qualifies: marketingQualifies,
      reasons: marketingReasons,
    },
    {
      family: 'commerce_transactional',
      score: commerceScore,
      qualifies: commerceQualifies,
      reasons: commerceReasons,
    },
    {
      family: 'security_alert',
      score: securityScore,
      qualifies: securityQualifies,
      reasons: securityReasons,
    },
    {
      family: 'social_community',
      score: socialScore,
      qualifies: socialQualifies,
      reasons: socialReasons,
    },
    {
      family: 'human_personal',
      score: humanScore,
      qualifies: humanQualifies,
      reasons: humanReasons,
    },
  ]

  const qualifyingSpecific = specificCandidates
    .filter((candidate) => candidate.qualifies)
    .sort((left, right) => right.score - left.score)

  if (qualifyingSpecific.length >= 2) {
    const [topFamily, secondFamily] = qualifyingSpecific
    if (topFamily.score >= 65 && secondFamily.score >= 65 && topFamily.score - secondFamily.score <= 10) {
      return mixedBehaviorOperatorProfile({
        topFamily,
        secondFamily,
      })
    }
  }

  if (qualifyingSpecific.length >= 1) {
    const [winner] = qualifyingSpecific
    const secondBestScore = qualifyingSpecific[1]?.score || 0
    return clearOperatorProfile({
      family: winner.family,
      score: winner.score,
      secondBestScore,
      reasons: winner.reasons,
    })
  }

  const accountScore =
    (updatesPrimaryShare >= 0.75 ? 55 : updatesPrimaryShare >= 0.6 ? 45 : 0) +
    (generalUpdatesShare >= 0.35 ? 10 : dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES ? 5 : 0) +
    (signalBucket === 'likely_machine_generated' ? 10 : signalBucket === 'uncertain' ? 5 : 0)
  const accountQualifies = updatesPrimaryShare >= 0.6 && accountScore >= 55
  if (accountQualifies) {
    const secondBestScore = specificCandidates
      .map((candidate) => candidate.score)
      .sort((left, right) => right - left)[0] || 0
    return clearOperatorProfile({
      family: 'account_notification',
      score: accountScore,
      secondBestScore,
      reasons: [
        `Updates/Primary accounts for ${formatRatioPercent(updatesPrimaryShare)} of categorized sender history.`,
        ...(generalUpdatesShare >= 0.35
          ? [`General-updates pattern accounts for ${formatRatioPercent(generalUpdatesShare)} of indexed sender history.`]
          : dominantPattern === GMAIL_PATTERN_LABEL_GENERAL_UPDATES
            ? ['Dominant pattern is General updates.']
            : []),
        ...(signalBucket === 'likely_machine_generated'
          ? ['Sender-history signal bucket is Likely automated.']
          : signalBucket === 'uncertain'
            ? ['Sender-history signal bucket is Unclear.']
            : []),
        'No stronger specific operator family qualified.',
      ],
    })
  }

  if (uncategorizedRatio >= 0.8) {
    return insufficientDataOperatorProfile([
      `Uncategorized messages account for ${formatRatioPercent(uncategorizedRatio)} of indexed sender history.`,
      'No operator-profile family qualified strongly enough to support a clear interpretation.',
    ])
  }

  return insufficientDataOperatorProfile([
    'Sender-global category and pattern evidence is not strong enough for a conservative operator-profile assignment.',
  ])
}

export function operatorProfileFromPersistedStats(params: {
  family: unknown
  mode: unknown
  confidence: unknown
  summary: unknown
  reasons: unknown
  source: unknown
}): GmailSenderOperatorProfile {
  const family = normalizeOperatorProfileFamily(params.family)
  const mode = normalizeOperatorProfileMode(params.mode)
  const confidence =
    typeof params.confidence === 'string' &&
    DOMINANT_CATEGORY_CONFIDENCE_SET.has(params.confidence as GmailDominantCategoryConfidence)
      ? (params.confidence as GmailDominantCategoryConfidence)
      : null
  const summary =
    typeof params.summary === 'string' && params.summary.trim() ? params.summary.trim() : ''
  const reasons = normalizeStringArray(params.reasons)
  const source = normalizeOperatorProfileSource(params.source)

  const looksMissing =
    (family == null || family === 'insufficient_data') &&
    (mode == null || mode === 'insufficient_data') &&
    confidence == null &&
    reasons.length === 0 &&
    (!summary || summary === 'Insufficient data') &&
    (source == null || source === 'insufficient_data')

  if (looksMissing) return insufficientDataOperatorProfile()

  if (mode === 'mixed' || family === 'mixed_behavior') {
    return {
      operator_profile_family: 'mixed_behavior',
      operator_profile_mode: 'mixed',
      operator_profile_confidence: null,
      operator_profile_summary:
        summary || 'Competing strong sender-history interpretations are present',
      operator_profile_reasons: reasons,
      operator_profile_source: source || 'sender_global_operator_profile_v1',
    }
  }

  if (
    mode === 'clear' &&
    family &&
    family !== 'insufficient_data'
  ) {
    return {
      operator_profile_family: family,
      operator_profile_mode: 'clear',
      operator_profile_confidence: confidence || 'low',
      operator_profile_summary: summary || operatorProfileSummaryForFamily(family),
      operator_profile_reasons: reasons,
      operator_profile_source: source || 'sender_global_operator_profile_v1',
    }
  }

  return insufficientDataOperatorProfile(reasons)
}

export function resolveSenderSemanticsFromCompatibility(
  params: SemanticCompatibilityParams
): {
  semantic_family: GmailResolvedSemanticFamily
  semantic_pattern: GmailResolvedSemanticPattern
} {
  const sourceKind = params.sourceKind || 'sender_stats'
  const totalMessages = normalizeCount(params.totalMessageCount)
  const categorizedMessages = normalizeCount(params.categoryProfile.categorized_message_count)
  const dominantPattern = (params.dominantPattern || '').trim() || GMAIL_PATTERN_LABEL_THIN_HISTORY
  const subjectHints = normalizeStringArray(params.subjectHints || [])
  const concretePatternLabel =
    chooseConcretePatternLabelFromMix(params.patternMix, dominantPattern) ||
    selectConcretePatternLabelFromSubjects(subjectHints)
  const signalBucket = senderSignalBucketFromProbabilities({
    machineProbability: params.machineProbability,
    humanProbability: params.humanProbability,
  })
  const legacyConcreteFamily =
    params.operatorProfile.operator_profile_mode === 'clear' &&
    isConcreteOperatorProfileFamily(params.operatorProfile.operator_profile_family)
      ? params.operatorProfile.operator_profile_family
      : null

  const candidateScores = familyCandidateScores({
    totalMessageCount: totalMessages,
    categoryProfile: params.categoryProfile,
    patternMix: params.patternMix,
    dominantPattern,
    machineProbability: params.machineProbability,
    humanProbability: params.humanProbability,
  }).candidates
  const rankedCandidates = candidateScores
    .slice()
    .sort((left, right) => right.score - left.score || left.family.localeCompare(right.family))
  const topCandidate = rankedCandidates[0] || null
  const secondCandidate = rankedCandidates[1] || null

  const heuristicFamily =
    senderHeuristicFamily(params.sender) ||
    patternLabelToSemanticFamily(concretePatternLabel) ||
    fallbackFamilyFromCategoryAndSignal({
      dominantCategory: params.categoryProfile.dominant_category,
      signalBucket,
    })

  let family = legacyConcreteFamily || heuristicFamily
  let familyProvenance: GmailSemanticFamilyProvenance =
    sourceKind === 'artifact_seed' ? 'artifact_seed_compat' : 'ranked_evidence_compat'
  let familyResolution: GmailSemanticResolution = 'thin_history'
  let familyConfidence: GmailSemanticConfidence = 'low'

  if (legacyConcreteFamily) {
    family = legacyConcreteFamily
    familyProvenance =
      sourceKind === 'artifact_seed' ? 'artifact_seed_compat' : 'operator_profile_compat'
    familyResolution = 'clear'
    familyConfidence = normalizeSemanticConfidence(
      params.operatorProfile.operator_profile_confidence
    )
  } else if (topCandidate && topCandidate.score > 0) {
    family = topCandidate.family
    familyResolution =
      params.operatorProfile.operator_profile_mode === 'mixed' ||
      dominantPattern === GMAIL_PATTERN_LABEL_UNRESOLVED ||
      ((secondCandidate?.score || 0) > 0 &&
        topCandidate.score - (secondCandidate?.score || 0) <= 10)
        ? 'mixed'
        : totalMessages >= 8 && categorizedMessages >= 5 && topCandidate.score >= 60
          ? 'clear'
          : 'thin_history'
    familyConfidence = semanticConfidenceFromScore({
      score: topCandidate.score,
      secondScore: secondCandidate?.score || 0,
      totalMessages,
      preferLow: familyResolution !== 'clear',
    })
  } else {
    familyResolution =
      params.operatorProfile.operator_profile_mode === 'mixed' ||
      dominantPattern === GMAIL_PATTERN_LABEL_UNRESOLVED
        ? 'mixed'
        : 'thin_history'
  }

  const semanticPattern = resolveSemanticPatternSelection({
    ...params,
    sourceKind,
    family,
    familyResolution,
  })

  const familySubtype =
    semanticPattern.familySubtype ||
    (semanticPattern.subtype &&
    patternLabelToSemanticFamily(semanticPattern.subtype.subtypeLabel) === family
      ? semanticPattern.subtype
      : null)
  const familyUmbrella = familyIsUmbrella(family)

  return {
    semantic_family: {
      family,
      resolution: familyResolution,
      confidence: familyConfidence,
      provenance: familyProvenance,
      umbrella: familyUmbrella,
      decomposition_status: familySubtype
        ? familySubtype.decompositionStatus
        : familyUmbrella
          ? 'candidate'
          : 'not_applicable',
      subtype_key: familySubtype?.subtypeKey || null,
      subtype_label: familySubtype?.subtypeLabel || null,
      decomposition_path:
        familySubtype != null
          ? familyDecompositionPath(family, familySubtype.subtypeKey)
          : familyUmbrella
            ? familyDecompositionPath(family)
            : null,
    },
    semantic_pattern: {
      pattern_class: semanticPattern.patternClass,
      resolution: semanticPattern.resolution,
      confidence: semanticPattern.confidence,
      provenance: semanticPattern.provenance,
      umbrella: semanticPattern.subtype ? semanticPattern.subtype.umbrella : true,
      decomposition_status: semanticPattern.subtype
        ? semanticPattern.subtype.decompositionStatus
        : 'candidate',
      subtype_key: semanticPattern.subtype?.subtypeKey || null,
      subtype_label: semanticPattern.subtype?.subtypeLabel || null,
      decomposition_path: semanticPattern.subtype
        ? patternDecompositionPath(
            semanticPattern.patternClass,
            semanticPattern.subtype.subtypeKey
          )
        : patternDecompositionPath(semanticPattern.patternClass),
    },
  }
}
