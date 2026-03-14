type ActionLike = {
  tool: string
  action: string
  args?: unknown
}

type SampleMessageInput = {
  subject?: string | null
  from?: string | null
  date?: string | null
  snippet?: string | null
}

type ApprovalSummaryInput = {
  action?: ActionLike | null
  userRequest?: string | null
  sampleMessages?: SampleMessageInput[]
  sampleSubjects?: string[]
  sampleSnippets?: string[]
  sampleSize?: number | null
  totalSelectedCount?: number | null
}

export type ApprovalRepresentativeExample = {
  subject: string
  sender: string | null
  date: string | null
  snippet: string | null
}

export type ApprovalDecisionSummary = {
  headline: string
  actionLabel: string
  scopeLabel: string
  affectedCount: number | null
  affectedUnit: string
  affectedCountIsEstimate: boolean
  batchTypeLabel: string
  batchSourceLabel: string
  selectionMethodLabel: string
  selectionBasis: string
  contentBreakdown: string[]
  previewCoverageLabel: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Unknown'
  reversible: boolean
  safetySignals: string[]
  safetyExclusions: string[]
  representativeExamples: ApprovalRepresentativeExample[]
  scopeTotals: {
    reviewed: number | null
    selected: number | null
    excluded: number | null
  }
  approvalEffect: string[]
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function toFinitePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed)
  }
  return null
}

function toFiniteNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed)
  }
  return null
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function shortText(value: string, max = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

function normalizeSampleMessages(value: unknown): ApprovalRepresentativeExample[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const record = toRecord(item)
      if (!record) return null
      const subject = normalizeText(record.subject)
      const sender = normalizeText(record.from)
      const date = normalizeText(record.date)
      const snippet = normalizeText(record.snippet)
      if (!subject && !sender && !snippet) return null
      return {
        subject: subject || '(no subject)',
        sender: sender || null,
        date: date || null,
        snippet: snippet || null,
      }
    })
    .filter((item): item is ApprovalRepresentativeExample => Boolean(item))
}

function buildSubjectBreakdown(subjects: string[]): string[] {
  const buckets: Array<{ key: string; label: string; match: RegExp }> = [
    { key: 'shipping', label: 'Shipping updates', match: /\b(ship|shipping|delivery|delivered|dispatch)\b/i },
    { key: 'invoice', label: 'Invoices / receipts', match: /\b(invoice|receipt|payment|bill|order confirmation)\b/i },
    { key: 'promo', label: 'Promotions / newsletters', match: /\b(newsletter|promo|sale|discount|offer|deal)\b/i },
    { key: 'alert', label: 'Alerts / automated notices', match: /\b(alert|verify|verification|security|otp|code)\b/i },
    { key: 'social', label: 'Social notifications', match: /\b(comment|like|follow|mention|tag)\b/i },
  ]

  const counts = new Map<string, number>()
  for (const subject of subjects) {
    const bucket = buckets.find((entry) => entry.match.test(subject))
    const key = bucket?.key || 'general'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const rows = Array.from(counts.entries()).map(([key, count]) => {
    const label = buckets.find((entry) => entry.key === key)?.label || 'General updates'
    return { label, count }
  })
  rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  return rows.slice(0, 4).map((row) => `${row.count} ${row.label.toLowerCase()}`)
}

function coerceRiskLevel(value: string | null): 'Low' | 'Medium' | 'High' | 'Unknown' {
  if (!value) return 'Unknown'
  const normalized = value.toLowerCase()
  if (normalized.includes('high')) return 'High'
  if (normalized.includes('medium') || normalized.includes('moderate')) return 'Medium'
  if (normalized.includes('low')) return 'Low'
  return 'Unknown'
}

function buildFallbackExamples(subjects: string[], snippets: string[]): ApprovalRepresentativeExample[] {
  if (subjects.length > 0) {
    return subjects.slice(0, 3).map((subject) => ({
      subject,
      sender: null,
      date: null,
      snippet: null,
    }))
  }
  if (snippets.length > 0) {
    return snippets.slice(0, 3).map((snippet) => ({
      subject: shortText(snippet, 90),
      sender: null,
      date: null,
      snippet: snippet,
    }))
  }
  return [
    {
      subject: 'Representative preview from related reviewed evidence.',
      sender: null,
      date: null,
      snippet: null,
    },
  ]
}

type EngagementSummary = {
  sampledCount: number | null
  unreadCount: number | null
  importantCount: number | null
  starredCount: number | null
  repliedHeuristicCount: number | null
  engagementRisk: 'low' | 'medium' | 'high' | null
  confidence: 'preliminary' | 'moderate' | null
  evidenceMode: 'engagement_based' | 'pattern_based' | null
}

function parseEngagementSummary(value: unknown): EngagementSummary {
  const record = toRecord(value)
  if (!record) {
    return {
      sampledCount: null,
      unreadCount: null,
      importantCount: null,
      starredCount: null,
      repliedHeuristicCount: null,
      engagementRisk: null,
      confidence: null,
      evidenceMode: null,
    }
  }

  const riskText = normalizeText(record.engagementRisk)?.toLowerCase()
  const confidenceText = normalizeText(record.confidence)?.toLowerCase()
  const evidenceModeText = normalizeText(record.evidenceMode)?.toLowerCase()

  return {
    sampledCount: toFiniteNonNegativeInteger(record.sampledCount),
    unreadCount: toFiniteNonNegativeInteger(record.unreadCount),
    importantCount: toFiniteNonNegativeInteger(record.importantCount),
    starredCount: toFiniteNonNegativeInteger(record.starredCount),
    repliedHeuristicCount: toFiniteNonNegativeInteger(record.repliedHeuristicCount),
    engagementRisk:
      riskText === 'low' || riskText === 'medium' || riskText === 'high' ? riskText : null,
    confidence:
      confidenceText === 'preliminary' || confidenceText === 'moderate'
        ? confidenceText
        : null,
    evidenceMode:
      evidenceModeText === 'engagement_based' || evidenceModeText === 'pattern_based'
        ? evidenceModeText
        : null,
  }
}

type SelectionCustomizationSummary = {
  reviewedCount: number | null
  candidateCount: number | null
  selectedCount: number | null
  excludedCount: number | null
  excludedSenders: string[]
}

function parseSelectionCustomization(value: unknown): SelectionCustomizationSummary | null {
  const record = toRecord(value)
  if (!record) return null
  return {
    reviewedCount: toFiniteNonNegativeInteger(record.reviewed_count),
    candidateCount: toFiniteNonNegativeInteger(record.candidate_count),
    selectedCount: toFiniteNonNegativeInteger(record.selected_count),
    excludedCount: toFiniteNonNegativeInteger(record.excluded_count),
    excludedSenders: normalizeStringList(record.excluded_senders).slice(0, 6),
  }
}

export function buildApprovalDecisionSummary(input: ApprovalSummaryInput): ApprovalDecisionSummary | null {
  const action = input.action
  if (!action) return null

  const args = toRecord(action.args)
  const sender = normalizeText(args?.sender)
  const clusterTitle = normalizeText(args?.title)
  const clusterType = normalizeText(args?.cluster_type)
  const batchTitle = normalizeText(args?.batch_title)

  const requestedCountFromArgs =
    toFinitePositiveInteger(args?.count) ||
    toFinitePositiveInteger(args?.estimated_count) ||
    toFinitePositiveInteger(args?.requested_count)
  const messageIds = normalizeStringList(args?.message_ids)
  const totalSelectedCount =
    requestedCountFromArgs ||
    toFinitePositiveInteger(input.totalSelectedCount) ||
    (messageIds.length > 0 ? messageIds.length : null)

  const argsSampleMessages = normalizeSampleMessages(args?.sample_messages)
  const inputSampleMessages = (input.sampleMessages || [])
    .map((message) => ({
      subject: normalizeText(message.subject) || '(no subject)',
      sender: normalizeText(message.from) || null,
      date: normalizeText(message.date) || null,
      snippet: normalizeText(message.snippet) || null,
    }))
    .filter((message) => Boolean(message.subject || message.sender || message.snippet))

  const sampleMessages = (inputSampleMessages.length > 0 ? inputSampleMessages : argsSampleMessages).slice(0, 6)
  const sampleSubjects =
    (input.sampleSubjects || [])
      .map((subject) => (typeof subject === 'string' ? subject.trim() : ''))
      .filter((subject) => subject.length > 0)
      .slice(0, 10)
  const sampleSnippets =
    (input.sampleSnippets || [])
      .map((snippet) => (typeof snippet === 'string' ? snippet.trim() : ''))
      .filter((snippet) => snippet.length > 0)
      .slice(0, 8)

  const representativeExamples =
    sampleMessages.length > 0 ? sampleMessages.slice(0, 5) : buildFallbackExamples(sampleSubjects, sampleSnippets)

  const breakdownFromArgs = normalizeStringList(args?.content_breakdown)
  const contentBreakdown =
    breakdownFromArgs.length > 0
      ? breakdownFromArgs.slice(0, 5)
      : buildSubjectBreakdown(
          sampleMessages
            .map((message) => message.subject)
            .filter((subject) => Boolean(subject && subject.trim()))
            .concat(sampleSubjects)
        )

  const sampleSize =
    toFinitePositiveInteger(input.sampleSize) ||
    toFinitePositiveInteger(args?.sample_size) ||
    (sampleMessages.length > 0 ? sampleMessages.length : null)

  const selectionBasis =
    normalizeText(args?.selection_basis) ||
    shortText(input.userRequest || '') ||
    'Selected from reviewed runtime evidence based on low-action-value patterns.'

  const riskLevel = coerceRiskLevel(normalizeText(args?.risk_level) || normalizeText(args?.risk_note))
  const reversible =
    typeof args?.reversible === 'boolean'
      ? args.reversible
      : action.tool === 'gmail' && action.action === 'archive_messages'

  const safetySignals = normalizeStringList(args?.safe_signals)
  const safetyExclusionsFromArgs = normalizeStringList(args?.safety_exclusions)
  const engagementSummary = parseEngagementSummary(args?.engagement_summary)
  const selectionCustomization = parseSelectionCustomization(args?.selection_customization)

  if (action.tool === 'gmail' && action.action === 'analyze_inbox') {
    const scope = totalSelectedCount || sampleSize || 25
    return {
      headline: 'Analyze inbox sample',
      actionLabel: `Analyze ${scope} sampled emails`,
      scopeLabel: `${scope} email metadata records (read-only)` ,
      affectedCount: scope,
      affectedUnit: 'emails',
      affectedCountIsEstimate: false,
      batchTypeLabel: 'Inbox metadata sample',
      batchSourceLabel: 'Recent inbox activity',
      selectionMethodLabel: 'Bounded inbox analysis sample',
      selectionBasis,
      contentBreakdown:
        contentBreakdown.length > 0 ? contentBreakdown : ['Representative metadata patterns from recent inbox activity'],
      previewCoverageLabel: `Preview sample: ${sampleSize || scope} of ${scope} sampled emails`,
      riskLevel: 'Low',
      reversible: true,
      safetySignals: safetySignals.length > 0 ? safetySignals : ['Read-only', 'No inbox mutation', 'Bounded sample'],
      safetyExclusions:
        safetyExclusionsFromArgs.length > 0
          ? safetyExclusionsFromArgs
          : ['No archive', 'No delete', 'No unsubscribe', 'No sender blocking'],
      representativeExamples,
      scopeTotals: {
        reviewed: scope,
        selected: scope,
        excluded: null,
      },
      approvalEffect: [
        'On approve: request becomes executable.',
        'On execute: metadata evidence is generated for next-step recommendations.',
        'No inbox content is modified.',
      ],
    }
  }

  if (action.tool === 'gmail' && action.action === 'review_sender_cluster') {
    const selected = totalSelectedCount || sampleSize || 25
    const preview = sampleSize || Math.min(25, selected)
    const sourceLabel = batchTitle || (sender ? `${sender} sender batch` : 'Sender cluster batch')
    return {
      headline: `Review sender sample${sender ? ` · ${sender}` : ''}`,
      actionLabel: `Review ${selected} sender-cluster emails`,
      scopeLabel: `${selected} selected emails`,
      affectedCount: selected,
      affectedUnit: 'emails',
      affectedCountIsEstimate: false,
      batchTypeLabel: 'Sender cluster',
      batchSourceLabel: sourceLabel,
      selectionMethodLabel: 'Reviewed sender cluster',
      selectionBasis,
      contentBreakdown:
        contentBreakdown.length > 0 ? contentBreakdown : ['Sender-recurring transactional updates'],
      previewCoverageLabel:
        preview < selected
          ? `Showing ${preview} representative emails out of ${selected} selected`
          : `Preview includes all ${selected} selected emails`,
      riskLevel: riskLevel === 'Unknown' ? 'Low' : riskLevel,
      reversible: true,
      safetySignals:
        safetySignals.length > 0
          ? safetySignals
          : ['Already reviewed', 'No reply needed', 'Archive only in later step', 'Reversible'],
      safetyExclusions:
        safetyExclusionsFromArgs.length > 0
          ? safetyExclusionsFromArgs
          : ['No delete', 'No unsubscribe', 'No sender blocking', 'No mutation in this step'],
      representativeExamples,
      scopeTotals: {
        reviewed: selected,
        selected,
        excluded: null,
      },
      approvalEffect: [
        'On approve: this review request becomes executable.',
        'On execute: reviewed sender-batch evidence is returned.',
        'No archive/delete/unsubscribe happens in this review step.',
      ],
    }
  }

  if (action.tool === 'gmail' && action.action === 'review_query_cluster') {
    const selected = totalSelectedCount || sampleSize || 25
    const preview = sampleSize || Math.min(25, selected)
    const sourceLabel = clusterTitle || normalizeText(args?.source_label) || 'Query-backed cleanup batch'
    return {
      headline: `Preview matching emails${clusterTitle ? ` · ${clusterTitle}` : ''}`,
      actionLabel: `Review ${selected} query-matching emails`,
      scopeLabel: `${selected} estimated matching emails`,
      affectedCount: selected,
      affectedUnit: 'emails',
      affectedCountIsEstimate: true,
      batchTypeLabel: clusterType ? `${clusterType} query cluster` : 'Query cluster',
      batchSourceLabel: sourceLabel,
      selectionMethodLabel: 'Reviewed query cluster',
      selectionBasis,
      contentBreakdown:
        contentBreakdown.length > 0 ? contentBreakdown : ['Query-backed recurring pattern cluster'],
      previewCoverageLabel:
        preview < selected
          ? `Showing ${preview} representative emails out of ${selected} estimated matches`
          : `Preview includes ${preview} of ${selected} estimated matches`,
      riskLevel: riskLevel === 'Unknown' ? 'Low' : riskLevel,
      reversible: true,
      safetySignals:
        safetySignals.length > 0
          ? safetySignals
          : ['Query-backed', 'Already reviewed', 'No inbox changes yet', 'Reversible'],
      safetyExclusions:
        safetyExclusionsFromArgs.length > 0
          ? safetyExclusionsFromArgs
          : ['No delete', 'No unsubscribe', 'No sender blocking', 'No mutation in preview step'],
      representativeExamples,
      scopeTotals: {
        reviewed: selected,
        selected,
        excluded: null,
      },
      approvalEffect: [
        'On approve: this preview request becomes executable.',
        'On execute: representative query-batch evidence is returned.',
        'No archive occurs until a later separately approved action.',
      ],
    }
  }

  if (action.tool === 'gmail' && action.action === 'archive_messages') {
    const selected =
      selectionCustomization?.selectedCount ||
      totalSelectedCount ||
      messageIds.length ||
      sampleSize ||
      0
    const candidateCount = selectionCustomization?.candidateCount
    const excludedCount = selectionCustomization?.excludedCount
    const preview = sampleSize || Math.min(5, Math.max(selected, 5))
    const sourceLabel = batchTitle || (sender ? `${sender} reviewed batch` : 'Reviewed runtime batch')
    const engagementSignalText =
      engagementSummary.sampledCount != null
        ? `Engagement sample ${engagementSummary.sampledCount} (important ${engagementSummary.importantCount ?? 0}, starred ${engagementSummary.starredCount ?? 0}, reply-like ${engagementSummary.repliedHeuristicCount ?? 0}, unread ${engagementSummary.unreadCount ?? 0})`
        : null
    const evidenceModeText =
      engagementSummary.evidenceMode === 'engagement_based'
        ? 'Engagement-based recommendation'
        : engagementSummary.evidenceMode === 'pattern_based'
          ? 'Pattern-based recommendation'
          : null
    const confidenceText = engagementSummary.confidence
      ? `Confidence: ${engagementSummary.confidence}`
      : null
    const adjustedRiskLevel =
      riskLevel === 'Unknown'
        ? engagementSummary.engagementRisk === 'high'
          ? 'High'
          : engagementSummary.engagementRisk === 'medium'
            ? 'Medium'
            : 'Low'
        : riskLevel
    const archiveSelectionBasis =
      engagementSignalText || evidenceModeText || confidenceText
        ? `${selectionBasis} ${
            [
              engagementSignalText,
              evidenceModeText,
              confidenceText,
            ]
              .filter(Boolean)
              .join(' · ')
          }`
        : selectionBasis
    const scopeLabel =
      candidateCount != null && excludedCount != null
        ? `${selected} selected of ${candidateCount} candidates (${excludedCount} excluded/kept)`
        : `${selected} selected emails in this batch`
    const customizationBreakdown =
      candidateCount != null && excludedCount != null
        ? [`Selection customization: ${selected}/${candidateCount} selected (${excludedCount} excluded/kept)`]
        : []
    const excludedSenderBreakdown =
      selectionCustomization?.excludedSenders && selectionCustomization.excludedSenders.length > 0
        ? [`Excluded senders: ${selectionCustomization.excludedSenders.join(', ')}`]
        : []
    return {
      headline: `Archive ${selected || 'selected'} emails`,
      actionLabel: `Archive ${selected || 'selected'} low-action-value emails`,
      scopeLabel,
      affectedCount: selected || null,
      affectedUnit: 'emails',
      affectedCountIsEstimate: false,
      batchTypeLabel: 'Transactional notifications',
      batchSourceLabel: sourceLabel,
      selectionMethodLabel: 'Reviewed sender/query cluster + runtime suggestions',
      selectionBasis: archiveSelectionBasis,
      contentBreakdown:
        [
          ...(contentBreakdown.length > 0
            ? contentBreakdown
            : ['Transactional updates', 'Low action value', 'Reviewed batch']),
          ...customizationBreakdown,
          ...excludedSenderBreakdown,
        ].slice(0, 6),
      previewCoverageLabel:
        selected > 0
          ? `Showing ${preview} representative emails out of ${selected} selected`
          : 'Representative preview from reviewed batch',
      riskLevel: adjustedRiskLevel,
      reversible,
      safetySignals:
        safetySignals.length > 0
          ? safetySignals
          : [
              'Transactional',
              'Already reviewed',
              'No reply needed',
              'Archive only',
              'Reversible',
              ...(customizationBreakdown.length > 0 ? ['Operator-customized subset'] : []),
              ...(engagementSignalText ? [engagementSignalText] : []),
              ...(evidenceModeText ? [evidenceModeText] : []),
              ...(confidenceText ? [confidenceText] : []),
            ],
      safetyExclusions:
        safetyExclusionsFromArgs.length > 0
          ? safetyExclusionsFromArgs
          : [
              'No delete',
              'No unsubscribe',
              'No sender blocking',
              'No starred/important override',
              'No mutation without separate approve + execute steps',
            ],
      representativeExamples,
      scopeTotals: {
        reviewed: selectionCustomization?.reviewedCount ?? null,
        selected,
        excluded: excludedCount ?? null,
      },
      approvalEffect: [
        'On approve: this request becomes executable.',
        `On execute: INBOX label is removed from ${selected || 'selected'} emails.`,
        'Emails remain searchable in All Mail (no deletion).',
      ],
    }
  }

  const sourceLabel = normalizeText(args?.source_label) || clusterTitle || batchTitle || sender || 'Runtime-selected batch'
  return {
    headline: `${action.tool}.${action.action}`,
    actionLabel: `Run ${action.tool}.${action.action}`,
    scopeLabel: totalSelectedCount ? `${totalSelectedCount} estimated items` : 'Scope defined by action payload',
    affectedCount: totalSelectedCount || null,
    affectedUnit: 'items',
    affectedCountIsEstimate: true,
    batchTypeLabel: 'Runtime action batch',
    batchSourceLabel: sourceLabel,
    selectionMethodLabel: 'Runtime strategy selection',
    selectionBasis,
    contentBreakdown:
      contentBreakdown.length > 0 ? contentBreakdown : ['Representative sample and workflow metadata'],
    previewCoverageLabel:
      sampleSize && totalSelectedCount
        ? `Preview sample: ${sampleSize} of ${totalSelectedCount}`
        : 'Preview is representative and may not list every affected item',
    riskLevel,
    reversible,
    safetySignals: safetySignals.length > 0 ? safetySignals : ['Approval-gated'],
    safetyExclusions:
      safetyExclusionsFromArgs.length > 0
        ? safetyExclusionsFromArgs
        : ['No auto-execution without explicit approval + execute steps'],
    representativeExamples,
    scopeTotals: {
      reviewed: null,
      selected: totalSelectedCount || null,
      excluded: null,
    },
    approvalEffect: ['On approve: request advances to the next supervised lifecycle step.'],
  }
}
