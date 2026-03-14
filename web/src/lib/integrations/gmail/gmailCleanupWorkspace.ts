import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildCleanupGroupIntelligence,
  buildQueryClusterBrowserSenderBreakdown,
  classifySenderPatternFromSubject,
  isLikelyHumanPriorityRow,
  loadGmailSenderIndexSignalsForTenant,
  matchClusterSpecFromIndex,
  normalizeMailboxProfileScope,
  normalizeSender,
  rowCategoryHas,
  rowSender,
  rowSenderDomain,
  scopeDays,
  senderSignalFromText,
  type GmailAnalysisScope,
  type GmailCleanupClusterSpec,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadIndexedGmailMessagesForTenant,
  type GmailMailboxIndexRow,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import type {
  GmailConfirmationPreviewData,
  GmailMailboxIntelligenceData,
  GmailScopeLadderCounts,
  GmailSenderPolicy,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'

type ClusterInput = {
  cluster_id: string
  cluster_type: string
  title: string
  query: string
  why_selected?: string | null
  risk_note?: string | null
  safety_note?: string | null
}

type LoadedMailboxContext = {
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  scopedRows: GmailMailboxIndexRow[]
  scopedInboxRows: GmailMailboxIndexRow[]
}

type ClusterResolution = {
  selectedClusterRows: GmailMailboxIndexRow[]
  candidateRows: GmailMailboxIndexRow[]
  matchedRowsByCluster: Map<string, GmailMailboxIndexRow[]>
}

type ConfirmationResolution = {
  preview: GmailConfirmationPreviewData
  archiveMessageIds: string[]
}

function fail(status: number, error: string) {
  return { ok: false as const, status, error }
}

function normalizeClusters(clusters: ClusterInput[]): ClusterInput[] {
  return clusters
    .map((cluster) => ({
      cluster_id: typeof cluster.cluster_id === 'string' ? cluster.cluster_id.trim() : '',
      cluster_type: typeof cluster.cluster_type === 'string' ? cluster.cluster_type.trim() : '',
      title: typeof cluster.title === 'string' ? cluster.title.trim() : '',
      query: typeof cluster.query === 'string' ? cluster.query.trim() : '',
      why_selected:
        typeof cluster.why_selected === 'string' && cluster.why_selected.trim()
          ? cluster.why_selected.trim()
          : null,
      risk_note:
        typeof cluster.risk_note === 'string' && cluster.risk_note.trim()
          ? cluster.risk_note.trim()
          : null,
      safety_note:
        typeof cluster.safety_note === 'string' && cluster.safety_note.trim()
          ? cluster.safety_note.trim()
          : null,
    }))
    .filter((cluster) => cluster.cluster_id && cluster.cluster_type && cluster.title && cluster.query)
    .slice(0, 25)
}

function asClusterSpecs(clusters: ClusterInput[]): GmailCleanupClusterSpec[] {
  return clusters.map((cluster) => ({
    cluster_id: cluster.cluster_id,
    cluster_type: cluster.cluster_type as GmailCleanupClusterSpec['cluster_type'],
    title: cluster.title,
    query: cluster.query,
    why_selected: cluster.why_selected || 'Guided cleanup group',
    risk_note: cluster.risk_note || 'Review sender evidence before archive.',
  }))
}

function isRowWithinDays(row: GmailMailboxIndexRow, days: number, nowMs: number): boolean {
  if (!Number.isFinite(row.internal_date_ms || Number.NaN)) return false
  return (row.internal_date_ms || 0) >= nowMs - days * 24 * 60 * 60 * 1000
}

async function loadMailboxContext(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
}): Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const [coverage, indexedRows] = await Promise.all([
    loadGmailMailboxIndexCoverageForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
    }),
    loadIndexedGmailMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      limit: 50_000,
    }),
  ])

  const nowMs = Date.now()
  const selectedScopeDays = scopeDays(analysisScope)
  const scopedRows =
    selectedScopeDays != null
      ? indexedRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
      : indexedRows
  const scopedInboxRows = scopedRows.filter((row) => row.is_in_inbox)

  return {
    ok: true,
    data: {
      coverage,
      scopedRows,
      scopedInboxRows,
    },
  }
}

function resolveClusterRows(params: {
  scopedInboxRows: GmailMailboxIndexRow[]
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
}): ClusterResolution {
  const nowMs = Date.now()
  const matchedRowsByCluster = new Map<string, GmailMailboxIndexRow[]>()
  const matchedCandidateIds = new Map<string, GmailMailboxIndexRow>()
  const specs = asClusterSpecs(params.clusters)

  for (const spec of specs) {
    const rows = params.scopedInboxRows.filter((row) => matchClusterSpecFromIndex({ row, spec, nowMs }))
    matchedRowsByCluster.set(spec.cluster_id, rows)
    for (const row of rows) matchedCandidateIds.set(row.message_id, row)
  }

  return {
    candidateRows: Array.from(matchedCandidateIds.values()).sort(
      (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
    ),
    selectedClusterRows:
      matchedRowsByCluster.get(params.selectedCluster.cluster_id)?.slice().sort(
        (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
      ) || [],
    matchedRowsByCluster,
  }
}

function protectionLabel(row: GmailMailboxIndexRow): string | null {
  if (row.is_starred) return 'Starred messages present'
  if (row.is_important) return 'Important messages present'
  if (rowCategoryHas(row, 'CATEGORY_PRIMARY')) return 'Primary-category evidence present'
  return null
}

function senderDomainFromString(sender: string): string | null {
  const normalized = normalizeSender(sender)
  const at = normalized.indexOf('@')
  if (at <= 0 || at >= normalized.length - 1) return null
  return normalized.slice(at + 1)
}

function buildScopeLadderCounts(params: {
  wholeMailbox: number
  cleanupCandidate: number
  cleanupGroup: number
  senderSet: number
  loadedPreviewRows: number
}): GmailScopeLadderCounts {
  return {
    whole_mailbox: params.wholeMailbox,
    cleanup_candidate_universe: params.cleanupCandidate,
    cleanup_group: params.cleanupGroup,
    sender_set: params.senderSet,
    loaded_preview_rows: params.loadedPreviewRows,
  }
}

function topCategorySummary(rows: GmailMailboxIndexRow[]): string {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const label = rowCategoryHas(row, 'CATEGORY_PROMOTIONS')
      ? 'Promotions'
      : rowCategoryHas(row, 'CATEGORY_SOCIAL')
        ? 'Social'
        : rowCategoryHas(row, 'CATEGORY_UPDATES')
          ? 'Updates'
          : rowCategoryHas(row, 'CATEGORY_FORUMS')
            ? 'Forums'
            : rowCategoryHas(row, 'CATEGORY_PRIMARY')
              ? 'Primary'
              : classifySenderPatternFromSubject(row.subject)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([label, count]) => `${label} (${count})`)
    .join(' · ')
}

function latestPolicyForSender(
  senderPolicies: Record<string, GmailSenderPolicy>,
  senderKey: string
): GmailSenderPolicy {
  const value = senderPolicies[senderKey]
  return value || 'undecided'
}

function buildMailboxSenderRanking(params: {
  scopedRows: GmailMailboxIndexRow[]
  candidateRows: GmailMailboxIndexRow[]
}): GmailMailboxIntelligenceData['sender_ranking'] {
  const senderMap = new Map<
    string,
    {
      sender: string
      total: number
      candidate: number
      protected: number
      unread: number
      firstSeen: number | null
      lastSeen: number | null
      rows: GmailMailboxIndexRow[]
    }
  >()

  for (const row of params.scopedRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current =
      senderMap.get(senderKey) ||
      {
        sender,
        total: 0,
        candidate: 0,
        protected: 0,
        unread: 0,
        firstSeen: null,
        lastSeen: null,
        rows: [],
      }
    current.total += 1
    if (row.is_unread) current.unread += 1
    if (protectionLabel(row)) current.protected += 1
    current.rows.push(row)
    if (typeof row.internal_date_ms === 'number' && Number.isFinite(row.internal_date_ms)) {
      current.firstSeen =
        current.firstSeen == null ? row.internal_date_ms : Math.min(current.firstSeen, row.internal_date_ms)
      current.lastSeen =
        current.lastSeen == null ? row.internal_date_ms : Math.max(current.lastSeen, row.internal_date_ms)
    }
    senderMap.set(senderKey, current)
  }

  for (const row of params.candidateRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = senderMap.get(senderKey)
    if (current) current.candidate += 1
  }

  return Array.from(senderMap.entries())
    .map(([senderKey, entry]) => ({
      sender: entry.sender,
      sender_key: senderKey,
      total_message_count: entry.total,
      cleanup_candidate_message_count: entry.candidate,
      protected_message_count: entry.protected,
      unread_count: entry.unread,
      first_seen: entry.firstSeen != null ? new Date(entry.firstSeen).toISOString() : null,
      last_seen: entry.lastSeen != null ? new Date(entry.lastSeen).toISOString() : null,
      category_summary: topCategorySummary(entry.rows) || 'General updates',
      sender_signal: senderSignalFromText({
        sender: entry.sender,
        sampleText: `${entry.sender} ${entry.rows.find((row) => row.subject)?.subject || ''}`,
      }),
    }))
    .sort(
      (a, b) =>
        b.cleanup_candidate_message_count - a.cleanup_candidate_message_count ||
        b.total_message_count - a.total_message_count ||
        a.sender.localeCompare(b.sender)
    )
}

export async function loadGmailMailboxIntelligenceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
}): Promise<{ ok: true; data: GmailMailboxIntelligenceData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  if (clusters.length === 0) return fail(400, 'clusters[] is required for mailbox_intelligence.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const mailbox = await loadMailboxContext({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  if (!mailbox.ok) return mailbox

  const clusterResolution = resolveClusterRows({
    scopedInboxRows: mailbox.data.scopedInboxRows,
    clusters,
    selectedCluster: clusters[0],
  })

  const wholeMailbox = buildCleanupGroupIntelligence({
    rows: mailbox.data.scopedRows,
    coverage: mailbox.data.coverage,
    analysisScope,
    clusterCount: clusters.length,
  })
  const cleanupCandidateUniverse = buildCleanupGroupIntelligence({
    rows: clusterResolution.candidateRows,
    coverage: mailbox.data.coverage,
    analysisScope,
    clusterCount: clusters.length,
  })

  const protectedRows = mailbox.data.scopedRows.filter((row) => protectionLabel(row))
  const likelyHumanRows = mailbox.data.scopedRows.filter((row) => isLikelyHumanPriorityRow(row))
  const cautionCandidateRows = clusterResolution.candidateRows.filter((row) => protectionLabel(row))
  const lowRiskCandidateRows = clusterResolution.candidateRows.filter((row) => !protectionLabel(row))
  const protectedSenderSet = new Set(protectedRows.map((row) => normalizeSender(rowSender(row) || '')))
  const humanSenderSet = new Set(likelyHumanRows.map((row) => normalizeSender(rowSender(row) || '')))

  const cleanupGroups = clusters.map((cluster) => {
    const rows = clusterResolution.matchedRowsByCluster.get(cluster.cluster_id) || []
    const senderCounts = new Map<string, number>()
    const patternCounts = new Map<string, number>()
    const uncertainSenderKeys = new Set<string>()

    for (const row of rows) {
      const sender = rowSender(row) || 'Unknown sender'
      const senderKey = normalizeSender(sender) || sender.toLowerCase()
      senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
      const pattern = classifySenderPatternFromSubject(row.subject)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
      if (senderSignalFromText({ sender, sampleText: `${sender} ${row.subject || ''}` }) === 'uncertain') {
        uncertainSenderKeys.add(senderKey)
      }
      if (rowCategoryHas(row, 'CATEGORY_PRIMARY') && rowCategoryHas(row, 'CATEGORY_PROMOTIONS')) {
        uncertainSenderKeys.add(senderKey)
      }
    }

    const dominantSender = Array.from(senderCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const dominantPattern = Array.from(patternCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      cluster_id: cluster.cluster_id,
      cluster_type: cluster.cluster_type,
      title: cluster.title,
      query: cluster.query,
      why_selected: cluster.why_selected || 'Grouped by shared sender behavior.',
      risk_note: cluster.risk_note || 'Review for mixed-content senders before archive.',
      safety_note: cluster.safety_note || 'Sender-first review keeps protected traffic visible.',
      message_count: rows.length,
      sender_count: new Set(rows.map((row) => normalizeSender(rowSender(row) || ''))).size,
      share_pct:
        clusterResolution.candidateRows.length > 0
          ? Math.round((rows.length / clusterResolution.candidateRows.length) * 100)
          : 0,
      dominant_sender: dominantSender,
      dominant_pattern: dominantPattern,
      protected_message_count: rows.filter((row) => protectionLabel(row)).length,
      uncertain_sender_count: uncertainSenderKeys.size,
    }
  })

  const data: GmailMailboxIntelligenceData = {
    analysis_scope: analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: mailbox.data.coverage.indexed_total_rows,
      cleanupCandidate: clusterResolution.candidateRows.length,
      cleanupGroup: 0,
      senderSet: wholeMailbox.sender_ranking.length,
      loadedPreviewRows: Math.min(25, wholeMailbox.sender_ranking.length),
    }),
    whole_mailbox: {
      message_count: mailbox.data.coverage.indexed_total_rows,
      sender_count: wholeMailbox.sender_ranking.length,
      indexed_inbox_rows: mailbox.data.coverage.indexed_inbox_rows,
      indexed_date_span_start: mailbox.data.coverage.indexed_date_span_start,
      indexed_date_span_end: mailbox.data.coverage.indexed_date_span_end,
      top_senders: wholeMailbox.top_senders,
      sender_volume_distribution: wholeMailbox.sender_volume_distribution,
      activity_timeline: wholeMailbox.activity_timeline,
      activity_timeline_granularity: wholeMailbox.activity_timeline_granularity,
      category_breakdown: wholeMailbox.category_breakdown,
      human_vs_automation: wholeMailbox.human_vs_automation,
    },
    cleanup_candidate_universe: {
      message_count: cleanupCandidateUniverse.cleanup_group_total_messages,
      sender_count: cleanupCandidateUniverse.cleanup_group_sender_count,
      cleanup_date_span_start: cleanupCandidateUniverse.cleanup_date_span_start,
      cleanup_date_span_end: cleanupCandidateUniverse.cleanup_date_span_end,
      top_senders: cleanupCandidateUniverse.top_senders,
      sender_volume_distribution: cleanupCandidateUniverse.sender_volume_distribution,
      activity_timeline: cleanupCandidateUniverse.activity_timeline,
      activity_timeline_granularity: cleanupCandidateUniverse.activity_timeline_granularity,
      category_breakdown: cleanupCandidateUniverse.category_breakdown,
      human_vs_automation: cleanupCandidateUniverse.human_vs_automation,
    },
    protected_safe_context: {
      protected_message_count: protectedRows.length,
      protected_sender_count: protectedSenderSet.size,
      likely_human_message_count: likelyHumanRows.length,
      likely_human_sender_count: humanSenderSet.size,
      caution_candidate_message_count: cautionCandidateRows.length,
      low_risk_candidate_message_count: lowRiskCandidateRows.length,
      summary:
        cautionCandidateRows.length > 0
          ? `${cautionCandidateRows.length.toLocaleString()} candidate messages still show protection signals and should funnel through Exceptions before archive.`
          : 'Current cleanup candidates are mostly low-risk machine-like traffic.',
    },
    cleanup_groups: cleanupGroups.sort((a, b) => b.message_count - a.message_count || a.title.localeCompare(b.title)),
    sender_ranking: buildMailboxSenderRanking({
      scopedRows: mailbox.data.scopedRows,
      candidateRows: clusterResolution.candidateRows,
    }),
    source: 'gmail_index_cache',
  }

  return { ok: true, data }
}

export async function loadGmailSenderWorkspaceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  page?: number
  pageSize?: number
}): Promise<{ ok: true; data: GmailSenderWorkspaceData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for sender_workspace.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for sender_workspace.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const page = Math.max(1, Math.floor(params.page || 1))
  const pageSize = Math.min(Math.max(Math.floor(params.pageSize || 12), 6), 40)
  const mailbox = await loadMailboxContext({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  if (!mailbox.ok) return mailbox

  const clusterResolution = resolveClusterRows({
    scopedInboxRows: mailbox.data.scopedInboxRows,
    clusters,
    selectedCluster,
  })

  const senderBreakdown = buildQueryClusterBrowserSenderBreakdown({
    rows: clusterResolution.selectedClusterRows,
    cleanupGroupRows: clusterResolution.selectedClusterRows,
    previewLimit: 5,
  })

  const totalSenders = senderBreakdown.length
  const totalPages = Math.max(1, Math.ceil(totalSenders / pageSize))
  const normalizedPage = Math.min(page, totalPages)
  const rangeStart = (normalizedPage - 1) * pageSize
  const pagedEntries = senderBreakdown.slice(rangeStart, rangeStart + pageSize)
  const senderSignals = await loadGmailSenderIndexSignalsForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
    senders: pagedEntries.map((entry) => entry.sender),
    queryMode: 'sender_page',
  })
  const signalBySender = new Map(
    (senderSignals.ok ? senderSignals.data.senders : []).map((entry) => [
      normalizeSender(entry.sender),
      entry,
    ])
  )

  const senders = pagedEntries.map((entry) => {
    const signal = signalBySender.get(entry.sender_key)
    const verificationReasons: string[] = []
    if (entry.batch_protected_count > 0) verificationReasons.push('Protected message evidence')
    if (entry.preview_messages.some((message) => (message.category_labels || []).length > 1)) {
      verificationReasons.push('Mixed category evidence')
    }
    if ((signal?.human_probability || 0) >= 0.45) verificationReasons.push('Human-like history')
    if ((signal?.machine_probability || 0) >= 0.45 && (signal?.human_probability || 0) >= 0.3) {
      verificationReasons.push('Mixed sender behavior')
    }
    if (entry.batch_important_count > 0 || entry.batch_starred_count > 0) {
      verificationReasons.push('Important or starred activity')
    }

    const senderRow = clusterResolution.selectedClusterRows.find(
      (row) => normalizeSender(rowSender(row) || '') === entry.sender_key
    )

    return {
      sender: entry.sender,
      sender_key: entry.sender_key,
      sender_domain: (senderRow ? rowSenderDomain(senderRow) : null) || senderDomainFromString(entry.sender),
      cleanup_group_message_count: entry.cleanup_group_message_count,
      total_sender_messages: signal?.message_count_indexed ?? null,
      unread_count: entry.batch_unread_count,
      last_activity: signal?.last_seen || entry.batch_last_seen,
      first_seen: signal?.first_seen || entry.batch_first_seen,
      category_summary:
        signal?.category_mix
          ?.slice()
          .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
          .slice(0, 2)
          .map((item) => `${item.category} (${item.count})`)
          .join(' · ') || entry.pattern_summary,
      dominant_pattern: entry.dominant_pattern,
      sender_signal:
        signal?.machine_probability != null || signal?.human_probability != null
          ? (signal.human_probability || 0) >= 0.65
            ? 'likely_human'
            : (signal.machine_probability || 0) >= 0.65
              ? 'likely_machine_generated'
              : 'uncertain'
          : senderSignalFromText({
              sender: entry.sender,
              sampleText: `${entry.sender} ${entry.preview_messages.map((message) => message.subject || '').join(' ')}`,
            }),
      machine_probability: signal?.machine_probability ?? null,
      human_probability: signal?.human_probability ?? null,
      protected_hint: entry.batch_protected_count > 0 ? 'Protected message evidence present' : null,
      requires_verification: verificationReasons.length > 0,
      verification_reasons: verificationReasons,
      preview_messages: entry.preview_messages,
      learned_policy: null,
    }
  })

  const data: GmailSenderWorkspaceData = {
    analysis_scope: analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: mailbox.data.coverage.indexed_total_rows,
      cleanupCandidate: clusterResolution.candidateRows.length,
      cleanupGroup: clusterResolution.selectedClusterRows.length,
      senderSet: senderBreakdown.length,
      loadedPreviewRows: senders.reduce((sum, sender) => sum + sender.preview_messages.length, 0),
    }),
    selected_cluster: {
      cluster_id: selectedCluster.cluster_id,
      cluster_type: selectedCluster.cluster_type,
      title: selectedCluster.title,
      query: selectedCluster.query,
      why_selected: selectedCluster.why_selected || 'Chosen from Cleanup Groups.',
      risk_note: selectedCluster.risk_note || 'Confirm mixed senders before archive.',
      safety_note: selectedCluster.safety_note || 'Messages remain in All Mail; only INBOX changes after approval.',
      message_count: clusterResolution.selectedClusterRows.length,
      sender_count: senderBreakdown.length,
      share_pct:
        clusterResolution.candidateRows.length > 0
          ? Math.round((clusterResolution.selectedClusterRows.length / clusterResolution.candidateRows.length) * 100)
          : 0,
    },
    senders,
    pagination: {
      page: normalizedPage,
      page_size: pageSize,
      total_senders: totalSenders,
      total_pages: totalPages,
    },
    exceptions_count: senders.filter((sender) => sender.requires_verification).length,
    source: 'gmail_index_cache',
  }

  return { ok: true, data }
}

function resolveArchivePolicyMessages(params: {
  rows: GmailMailboxIndexRow[]
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}) {
  const archiveRows: GmailMailboxIndexRow[] = []
  let protectedExclusionsCount = 0

  for (const row of params.rows) {
    const senderKey = normalizeSender(rowSender(row) || '')
    const policy = latestPolicyForSender(params.senderPolicies, senderKey)
    const override = params.messageOverrides[row.message_id]
    const protectedReason = protectionLabel(row)

    if (override === 'exclude') {
      if (policy === 'archive') protectedExclusionsCount += 1
      continue
    }

    const shouldArchive = policy === 'archive' || override === 'include'
    if (!shouldArchive) continue

    if (protectedReason && override !== 'include') {
      protectedExclusionsCount += 1
      continue
    }

    archiveRows.push(row)
  }

  return { archiveRows, protectedExclusionsCount }
}

function buildConfirmationPreview(params: {
  analysisScope: GmailAnalysisScope
  coverage: LoadedMailboxContext['coverage']
  candidateRows: GmailMailboxIndexRow[]
  selectedCluster: ClusterInput
  selectedClusterRows: GmailMailboxIndexRow[]
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides: Record<string, 'include' | 'exclude'>
}): ConfirmationResolution {
  const groups = new Map<
    GmailSenderPolicy,
    {
      policy: GmailSenderPolicy
      label: string
      senderCounts: Map<string, { sender: string; count: number }>
      messageCount: number
    }
  >()

  const pushToGroup = (policy: GmailSenderPolicy, senderKey: string, sender: string, count: number) => {
    const existing =
      groups.get(policy) ||
      {
        policy,
        label:
          policy === 'archive'
            ? 'Archive now'
            : policy === 'keep'
              ? 'Always keep'
              : policy === 'quarantine'
                ? 'Quarantine later'
                : policy === 'unsubscribe'
                  ? 'Unsubscribe intent'
                  : policy === 'custom_rule'
                    ? 'Custom rule intent'
                    : 'Undecided',
        senderCounts: new Map<string, { sender: string; count: number }>(),
        messageCount: 0,
      }
    existing.messageCount += count
    const current = existing.senderCounts.get(senderKey) || { sender, count: 0 }
    current.count += count
    existing.senderCounts.set(senderKey, current)
    groups.set(policy, existing)
  }

  const rowsBySender = new Map<string, GmailMailboxIndexRow[]>()
  for (const row of params.selectedClusterRows) {
    const sender = rowSender(row) || 'Unknown sender'
    const senderKey = normalizeSender(sender) || sender.toLowerCase()
    const current = rowsBySender.get(senderKey) || []
    current.push(row)
    rowsBySender.set(senderKey, current)
  }

  const archiveResolution = resolveArchivePolicyMessages({
    rows: params.selectedClusterRows,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides,
  })
  const archiveMessageIdSet = new Set(archiveResolution.archiveRows.map((row) => row.message_id))

  for (const [senderKey, rows] of rowsBySender.entries()) {
    const sender = rowSender(rows[0]) || 'Unknown sender'
    const policy = latestPolicyForSender(params.senderPolicies, senderKey)
    if (policy === 'archive') {
      pushToGroup(
        'archive',
        senderKey,
        sender,
        rows.filter((row) => archiveMessageIdSet.has(row.message_id)).length
      )
      continue
    }
    pushToGroup(policy, senderKey, sender, rows.length)
  }

  const groupList = Array.from(groups.values())
    .map((group) => ({
      policy: group.policy,
      label: group.label,
      sender_count: group.senderCounts.size,
      message_count: group.messageCount,
      senders: Array.from(group.senderCounts.entries())
        .map(([senderKey, value]) => ({
          sender_key: senderKey,
          sender: value.sender,
          message_count: value.count,
        }))
        .sort((a, b) => b.message_count - a.message_count || a.sender.localeCompare(b.sender))
        .slice(0, 8),
    }))
    .sort((a, b) => b.message_count - a.message_count || a.label.localeCompare(b.label))

  const futureBehaviorPolicies: Array<Exclude<GmailSenderPolicy, 'archive' | 'undecided'>> = [
    'keep',
    'quarantine',
    'unsubscribe',
    'custom_rule',
  ]

  const preview: GmailConfirmationPreviewData = {
    analysis_scope: params.analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: params.coverage.indexed_total_rows,
      cleanupCandidate: params.candidateRows.length,
      cleanupGroup: params.selectedClusterRows.length,
      senderSet: rowsBySender.size,
      loadedPreviewRows: 0,
    }),
    selected_cluster: {
      cluster_id: params.selectedCluster.cluster_id,
      title: params.selectedCluster.title,
      message_count: params.selectedClusterRows.length,
      sender_count: rowsBySender.size,
    },
    exact_archive_impact: {
      sender_count: new Set(archiveResolution.archiveRows.map((row) => normalizeSender(rowSender(row) || ''))).size,
      message_count: archiveResolution.archiveRows.length,
      message_id_sample: archiveResolution.archiveRows.slice(0, 25).map((row) => row.message_id),
    },
    future_behavior_summary: futureBehaviorPolicies.map((policy) => {
      const group = groupList.find((entry) => entry.policy === policy)
      return {
        policy,
        sender_count: group?.sender_count || 0,
        message_count: group?.message_count || 0,
        behavior:
          policy === 'keep'
            ? 'Keep visible in the inbox.'
            : policy === 'quarantine'
              ? 'Store as future quarantine intent only.'
              : policy === 'unsubscribe'
                ? 'Store unsubscribe intent for future automation.'
                : 'Store a custom rule intent for later approval.',
      }
    }),
    protected_exclusions_count: archiveResolution.protectedExclusionsCount,
    undecided_sender_count: groupList.find((entry) => entry.policy === 'undecided')?.sender_count || 0,
    groups: groupList,
    source: 'gmail_index_cache',
  }

  return {
    preview,
    archiveMessageIds: archiveResolution.archiveRows.map((row) => row.message_id),
  }
}

export async function loadGmailConfirmationPreviewForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<{ ok: true; data: GmailConfirmationPreviewData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for confirmation_preview.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const mailbox = await loadMailboxContext({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  if (!mailbox.ok) return mailbox

  const clusterResolution = resolveClusterRows({
    scopedInboxRows: mailbox.data.scopedInboxRows,
    clusters,
    selectedCluster,
  })

  return {
    ok: true,
    data: buildConfirmationPreview({
      analysisScope,
      coverage: mailbox.data.coverage,
      candidateRows: clusterResolution.candidateRows,
      selectedCluster,
      selectedClusterRows: clusterResolution.selectedClusterRows,
      senderPolicies: params.senderPolicies,
      messageOverrides: params.messageOverrides || {},
    }).preview,
  }
}

export async function resolveGmailSenderPolicyArchiveScopeForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<
  | {
      ok: true
      data: {
        messageIds: string[]
        selectedCount: number
        matchingMessagesInScope: number
        senderCount: number
      }
    }
  | ReturnType<typeof fail>
> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for archive resolution.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const mailbox = await loadMailboxContext({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  if (!mailbox.ok) return mailbox

  const clusterResolution = resolveClusterRows({
    scopedInboxRows: mailbox.data.scopedInboxRows,
    clusters,
    selectedCluster,
  })
  const resolution = buildConfirmationPreview({
    analysisScope,
    coverage: mailbox.data.coverage,
    candidateRows: clusterResolution.candidateRows,
    selectedCluster,
    selectedClusterRows: clusterResolution.selectedClusterRows,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides || {},
  })

  return {
    ok: true,
    data: {
      messageIds: resolution.archiveMessageIds,
      selectedCount: resolution.preview.exact_archive_impact.message_count,
      matchingMessagesInScope: clusterResolution.selectedClusterRows.length,
      senderCount: resolution.preview.exact_archive_impact.sender_count,
    },
  }
}
