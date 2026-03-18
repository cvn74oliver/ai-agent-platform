import type { SupabaseClient } from '@supabase/supabase-js'
import { GMAIL_MAILBOX_INDEX_MAX_MESSAGES } from '@/lib/integrations/gmail/gmailMailboxIndexConfig'
import {
  buildGmailPressureTrendData,
  buildCleanupGroupIntelligence,
  buildQueryClusterBrowserSenderBreakdown,
  classifySenderCleanupCluster,
  classifySenderPatternFromSubject,
  isLikelyHumanPriorityRow,
  loadGmailSenderIndexSignalsForTenant,
  normalizeMailboxProfileScope,
  normalizeSender,
  rowCategoryHas,
  rowSender,
  rowSenderDomain,
  scopeDays,
  senderSignalFromText,
  type GmailAnalysisScope,
} from '@/lib/integrations/gmail/inboxAnalysis'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadIndexedGmailMessagesForTenant,
  type GmailMailboxIndexRow,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import type {
  GmailCleanupPreviewMessage,
  GmailConfirmationPreviewData,
  GmailMailboxIntelligenceData,
  GmailPressureTrendData,
  GmailPressureTrendWindow,
  GmailScopeLadderCounts,
  GmailSenderPolicy,
  GmailSenderWorkspaceFilter,
  GmailSenderWorkspaceSort,
  GmailSenderWorkspaceSortDirection,
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
  snapshot_key: string
}

type MailboxCoverageSnapshot = {
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
  snapshot_key: string
}

type ClusterResolution = {
  candidateRows: GmailMailboxIndexRow[]
  matchedRowsByCluster: Map<string, GmailMailboxIndexRow[]>
}

type DerivedWorkspaceState = LoadedMailboxContext & ClusterResolution

type DerivedWorkspaceCacheEntry = {
  expires_at_ms: number
  data: DerivedWorkspaceState
}

type LoadedMailboxContextCacheEntry = {
  expires_at_ms: number
  data: LoadedMailboxContext
}

type SenderWorkspaceBaseState = {
  selectedClusterRows: GmailMailboxIndexRow[]
  allSenders: GmailSenderWorkspaceData['senders']
}

type SenderWorkspaceBaseCacheEntry = {
  expires_at_ms: number
  data: SenderWorkspaceBaseState
}

type ConfirmationResolution = {
  preview: GmailConfirmationPreviewData
  archiveMessageIds: string[]
  archiveMessageIdsBySender: Record<string, string[]>
}

const GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS = 1000 * 60 * 10

const gmailCleanupWorkspaceGlobal = globalThis as typeof globalThis & {
  __gmailLoadedMailboxContextCache?: Map<string, LoadedMailboxContextCacheEntry>
  __gmailLoadedMailboxContextInflight?: Map<string, Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>>>
  __gmailDerivedWorkspaceCache?: Map<string, DerivedWorkspaceCacheEntry>
  __gmailDerivedWorkspaceInflight?: Map<string, Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>>>
  __gmailSenderWorkspaceBaseCache?: Map<string, SenderWorkspaceBaseCacheEntry>
  __gmailSenderWorkspaceBaseInflight?: Map<string, Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>>>
}

const loadedMailboxContextCache =
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache ||
  new Map<string, LoadedMailboxContextCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache) {
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextCache = loadedMailboxContextCache
}

const loadedMailboxContextInflight =
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight ||
  new Map<string, Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight) {
  gmailCleanupWorkspaceGlobal.__gmailLoadedMailboxContextInflight = loadedMailboxContextInflight
}

const derivedWorkspaceCache =
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache || new Map<string, DerivedWorkspaceCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache) {
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceCache = derivedWorkspaceCache
}

const derivedWorkspaceInflight =
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight ||
  new Map<string, Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight) {
  gmailCleanupWorkspaceGlobal.__gmailDerivedWorkspaceInflight = derivedWorkspaceInflight
}

const senderWorkspaceBaseCache =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache ||
  new Map<string, SenderWorkspaceBaseCacheEntry>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseCache = senderWorkspaceBaseCache
}

const senderWorkspaceBaseInflight =
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight ||
  new Map<string, Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>>>()
if (!gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight) {
  gmailCleanupWorkspaceGlobal.__gmailSenderWorkspaceBaseInflight = senderWorkspaceBaseInflight
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
    .sort((left, right) => left.cluster_id.localeCompare(right.cluster_id))
    .slice(0, 25)
}

function ensureSelectedClusterIncluded(
  clusters: ClusterInput[],
  selectedCluster: ClusterInput
): ClusterInput[] {
  return clusters.some((cluster) => cluster.cluster_id === selectedCluster.cluster_id)
    ? clusters
    : [selectedCluster, ...clusters].slice(0, 25)
}

function derivedWorkspaceCacheKey(params: {
  mailboxSnapshotKey: string
  clusters: ClusterInput[]
}): string {
  const clusterSignature = params.clusters
    .map((cluster) => [cluster.cluster_id, cluster.cluster_type, cluster.title, cluster.query].join('::'))
    .sort()
  return [params.mailboxSnapshotKey, ...clusterSignature].join('|||')
}

function mailboxSnapshotKey(params: {
  tenantId: string
  analysisScope: GmailAnalysisScope
  coverage: Awaited<ReturnType<typeof loadGmailMailboxIndexCoverageForTenant>>
}): string {
  return [
    params.tenantId.trim(),
    params.analysisScope,
    String(params.coverage.indexed_total_rows),
    String(params.coverage.indexed_inbox_rows),
    params.coverage.indexed_date_span_start || 'no-start',
    params.coverage.indexed_date_span_end || 'no-end',
  ].join('|||')
}

function senderWorkspaceBaseCacheKey(params: {
  mailboxSnapshotKey: string
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
}): string {
  return [
    derivedWorkspaceCacheKey(params),
    [params.selectedCluster.cluster_id, params.selectedCluster.cluster_type, params.selectedCluster.title].join('::'),
  ].join('|||')
}

function isRowWithinDays(row: GmailMailboxIndexRow, days: number, nowMs: number): boolean {
  if (!Number.isFinite(row.internal_date_ms || Number.NaN)) return false
  return (row.internal_date_ms || 0) >= nowMs - days * 24 * 60 * 60 * 1000
}

async function loadMailboxCoverageSnapshot(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
}): Promise<MailboxCoverageSnapshot> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const coverage = await loadGmailMailboxIndexCoverageForTenant({
    supabase: params.supabase,
    tenantId: params.tenantId,
  })
  return {
    coverage,
    snapshot_key: mailboxSnapshotKey({
      tenantId: params.tenantId,
      analysisScope,
      coverage,
    }),
  }
}

async function loadMailboxContext(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  coverageSnapshot?: MailboxCoverageSnapshot
}): Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const coverageSnapshot =
    params.coverageSnapshot ||
    (await loadMailboxCoverageSnapshot({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
    }))
  const cacheKey = coverageSnapshot.snapshot_key
  const cached = loadedMailboxContextCache.get(cacheKey)
  if (cached && cached.expires_at_ms > Date.now()) {
    return { ok: true, data: cached.data }
  }

  const inflight = loadedMailboxContextInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: LoadedMailboxContext } | ReturnType<typeof fail>> => {
    const indexedRows = await loadIndexedGmailMessagesForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      limit: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
    })

    const nowMs = Date.now()
    const selectedScopeDays = scopeDays(analysisScope)
    const scopedRows =
      selectedScopeDays != null
        ? indexedRows.filter((row) => isRowWithinDays(row, selectedScopeDays, nowMs))
        : indexedRows
    const scopedInboxRows = scopedRows.filter((row) => row.is_in_inbox)
    const data: LoadedMailboxContext = {
      coverage: coverageSnapshot.coverage,
      scopedRows,
      scopedInboxRows,
      snapshot_key: cacheKey,
    }
    loadedMailboxContextCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data,
    })
    return { ok: true, data }
  })()

  loadedMailboxContextInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    loadedMailboxContextInflight.delete(cacheKey)
  }
}

function resolveClusterRows(params: {
  scopedInboxRows: GmailMailboxIndexRow[]
  clusters: ClusterInput[]
}): ClusterResolution {
  const nowMs = Date.now()
  const matchedRowsByCluster = new Map<string, GmailMailboxIndexRow[]>()
  const matchedCandidateIds = new Map<string, GmailMailboxIndexRow>()
  const clusterIdSet = new Set(params.clusters.map((cluster) => cluster.cluster_id))
  for (const cluster of params.clusters) {
    matchedRowsByCluster.set(cluster.cluster_id, [])
  }

  const senderBuckets = new Map<string, { sender: string; rows: GmailMailboxIndexRow[] }>()
  for (const row of params.scopedInboxRows) {
    const sender = row.sender || ''
    const senderKey = normalizeSender(sender)
    if (!senderKey) continue
    const current = senderBuckets.get(senderKey) || { sender, rows: [] }
    current.rows.push(row)
    senderBuckets.set(senderKey, current)
  }

  for (const entry of senderBuckets.values()) {
    const clusterSpec = classifySenderCleanupCluster({
      sender: entry.sender,
      rows: entry.rows,
      nowMs,
    })
    if (!clusterSpec || !clusterIdSet.has(clusterSpec.cluster_id)) continue
    const clusterRows = matchedRowsByCluster.get(clusterSpec.cluster_id)
    if (!clusterRows) continue
    const orderedRows = entry.rows
      .slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    clusterRows.push(...orderedRows)
    for (const row of orderedRows) matchedCandidateIds.set(row.message_id, row)
  }

  return {
    candidateRows: Array.from(matchedCandidateIds.values()).sort(
      (a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)
    ),
    matchedRowsByCluster,
  }
}

async function loadDerivedWorkspaceState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
}): Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>> {
  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const clusters = normalizeClusters(params.clusters)
  const coverageSnapshot = await loadMailboxCoverageSnapshot({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
  })
  const cacheKey = derivedWorkspaceCacheKey({
    mailboxSnapshotKey: coverageSnapshot.snapshot_key,
    clusters,
  })
  const nowMs = Date.now()
  const cached = derivedWorkspaceCache.get(cacheKey)
  if (cached && cached.expires_at_ms > nowMs) {
    return { ok: true, data: cached.data }
  }

  const inflight = derivedWorkspaceInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: DerivedWorkspaceState } | ReturnType<typeof fail>> => {
    const mailbox = await loadMailboxContext({
      supabase: params.supabase,
      tenantId: params.tenantId,
      analysisScope,
      coverageSnapshot,
    })
    if (!mailbox.ok) return mailbox

    const clusterResolution = resolveClusterRows({
      scopedInboxRows: mailbox.data.scopedInboxRows,
      clusters,
    })
    const data: DerivedWorkspaceState = {
      ...mailbox.data,
      ...clusterResolution,
    }
    derivedWorkspaceCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data,
    })
    return { ok: true, data }
  })()

  derivedWorkspaceInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    derivedWorkspaceInflight.delete(cacheKey)
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

function buildPreviewMessages(
  rows: GmailMailboxIndexRow[],
  previewLimit = 5
): GmailCleanupPreviewMessage[] {
  return rows
    .slice()
    .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0))
    .slice(0, Math.min(Math.max(previewLimit, 1), 8))
    .map((row) => ({
      message_id: row.message_id,
      thread_id: row.thread_id || undefined,
      internal_date_ms: row.internal_date_ms || undefined,
      subject: row.subject,
      from: row.sender,
      date: row.date,
      snippet: row.subject,
      label_ids: row.label_ids,
      category_labels: row.category_labels,
      is_in_inbox: row.is_in_inbox,
      is_unread: row.is_unread,
      is_important: row.is_important,
      is_starred: row.is_starred,
    }))
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

function primarySenderCategory(summary: string): string {
  const head = summary.split('·')[0]?.trim() || ''
  const cleaned = head.replace(/\(\d+\)\s*$/, '').trim()
  return cleaned || 'Other'
}

function buildSenderActivityTimeline(params: {
  senders: GmailSenderWorkspaceData['senders']
  analysisScope: GmailAnalysisScope
}): {
  items: GmailSenderWorkspaceData['analytics']['sender_activity_timeline']
  granularity: GmailSenderWorkspaceData['analytics']['sender_activity_timeline_granularity']
} {
  const analysisScopeDays = scopeDays(params.analysisScope)
  const granularity = analysisScopeDays != null && analysisScopeDays <= 90 ? 'week' : 'month'
  const counts = new Map<string, number>()

  for (const sender of params.senders) {
    const lastSeenMs =
      typeof sender.last_activity === 'string' && sender.last_activity.trim()
        ? Date.parse(sender.last_activity)
        : Number.NaN
    if (!Number.isFinite(lastSeenMs)) continue
    const date = new Date(lastSeenMs)
    const label =
      granularity === 'week'
        ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')} / week ${Math.max(1, Math.ceil(date.getUTCDate() / 7))}`
        : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  return {
    items: Array.from(counts.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(-8)
      .map(([label, senderCount]) => ({ label, sender_count: senderCount })),
    granularity,
  }
}

function buildSenderCategoryDistribution(
  senders: GmailSenderWorkspaceData['senders']
): GmailSenderWorkspaceData['analytics']['sender_category_distribution'] {
  const counts = new Map<string, number>()
  for (const sender of senders) {
    const label = primarySenderCategory(sender.category_summary)
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([label, senderCount]) => ({ label, sender_count: senderCount }))
}

function buildClusterContributionMetrics(params: {
  senders: GmailSenderWorkspaceData['senders']
  clusterMessageCount: number
}): GmailSenderWorkspaceData['analytics']['cluster_contribution'] {
  return params.senders
    .slice()
    .sort(
      (left, right) =>
        right.cleanup_group_message_count - left.cleanup_group_message_count ||
        left.sender.localeCompare(right.sender)
    )
    .slice(0, 6)
    .map((sender) => ({
      sender: sender.sender,
      sender_key: sender.sender_key,
      message_count: sender.cleanup_group_message_count,
      share_pct:
        params.clusterMessageCount > 0
          ? Math.round((sender.cleanup_group_message_count / params.clusterMessageCount) * 100)
          : 0,
    }))
}

async function loadSenderWorkspaceBaseState(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  workspace: DerivedWorkspaceState
}): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> {
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for sender workspace base state.')

  const cacheKey = senderWorkspaceBaseCacheKey({
    mailboxSnapshotKey: params.workspace.snapshot_key,
    clusters,
    selectedCluster,
  })
  const cached = senderWorkspaceBaseCache.get(cacheKey)
  if (cached && cached.expires_at_ms > Date.now()) {
    return { ok: true, data: cached.data }
  }

  const inflight = senderWorkspaceBaseInflight.get(cacheKey)
  if (inflight) return inflight

  const request = (async (): Promise<{ ok: true; data: SenderWorkspaceBaseState } | ReturnType<typeof fail>> => {
    const selectedClusterRows =
      params.workspace.matchedRowsByCluster
        .get(selectedCluster.cluster_id)
        ?.slice()
        .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)) || []
    const rowsBySenderKey = new Map<string, GmailMailboxIndexRow[]>()
    for (const row of selectedClusterRows) {
      const sender = rowSender(row) || 'Unknown sender'
      const senderKey = normalizeSender(sender) || sender.toLowerCase()
      const current = rowsBySenderKey.get(senderKey) || []
      current.push(row)
      rowsBySenderKey.set(senderKey, current)
    }

    const senderBreakdown = buildQueryClusterBrowserSenderBreakdown({
      rows: selectedClusterRows,
      cleanupGroupRows: selectedClusterRows,
      previewLimit: 5,
      includePreviewMessages: false,
    })

    const senderSignals = await loadGmailSenderIndexSignalsForTenant({
      supabase: params.supabase,
      tenantId: params.tenantId,
      senders: senderBreakdown.map((entry) => entry.sender),
      queryMode: 'sender_page',
    })
    const signalBySender = new Map(
      (senderSignals.ok ? senderSignals.data.senders : []).map((entry) => [
        normalizeSender(entry.sender),
        entry,
      ])
    )

    const allSenders = senderBreakdown.map((entry) => {
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

      const senderRows = rowsBySenderKey.get(entry.sender_key) || []
      const senderRow = senderRows[0]

      return {
        sender: entry.sender,
        sender_key: entry.sender_key,
        sender_domain:
          (senderRow ? rowSenderDomain(senderRow) : null) || senderDomainFromString(entry.sender),
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
        preview_messages: buildPreviewMessages(senderRows, 5),
        learned_policy: null,
      }
    })

    const data: SenderWorkspaceBaseState = {
      selectedClusterRows,
      allSenders,
    }
    senderWorkspaceBaseCache.set(cacheKey, {
      expires_at_ms: Date.now() + GMAIL_DERIVED_WORKSPACE_CACHE_TTL_MS,
      data,
    })
    return { ok: true, data }
  })()

  senderWorkspaceBaseInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    senderWorkspaceBaseInflight.delete(cacheKey)
  }
}

function latestPolicyForSender(
  senderPolicies: Record<string, GmailSenderPolicy>,
  senderKey: string
): GmailSenderPolicy {
  const value = senderPolicies[senderKey]
  return value || 'undecided'
}

function normalizeSenderWorkspaceFilter(value: unknown): GmailSenderWorkspaceFilter {
  return value === 'needs_verification' ||
    value === 'protected' ||
    value === 'likely_machine_generated' ||
    value === 'likely_human'
    ? value
    : 'all'
}

function normalizeSenderWorkspaceSort(value: unknown): GmailSenderWorkspaceSort {
  return value === 'sender' || value === 'unread_count' || value === 'last_activity'
    ? value
    : 'message_count'
}

function normalizeSenderWorkspaceSortDirection(value: unknown): GmailSenderWorkspaceSortDirection {
  return value === 'asc' ? 'asc' : 'desc'
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

function normalizePressureTrendWindow(value: unknown): GmailPressureTrendWindow {
  if (
    value === 'all_indexed' ||
    value === 'last_year' ||
    value === 'last_quarter' ||
    value === 'last_month' ||
    value === 'last_week' ||
    value === 'last_day' ||
    value === 'custom'
  ) {
    return value
  }
  return 'all_indexed'
}

export async function loadGmailPressureTrendForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  cacheVersion?: string | null
  clusters: ClusterInput[]
  pressureWindow?: GmailPressureTrendWindow
  pressureStart?: string | null
  pressureEnd?: string | null
  timeZone?: string | null
}): Promise<{ ok: true; data: GmailPressureTrendData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  if (clusters.length === 0) return fail(400, 'clusters[] is required for mailbox_pressure_trend.')

  const workspace = await loadDerivedWorkspaceState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope: 'all_indexed',
    clusters,
  })
  if (!workspace.ok) return workspace

  const trend = buildGmailPressureTrendData({
    rows: workspace.data.candidateRows,
    coverage: workspace.data.coverage,
    pressureWindow: normalizePressureTrendWindow(params.pressureWindow),
    pressureStart: params.pressureStart,
    pressureEnd: params.pressureEnd,
    timeZone: params.timeZone,
  })
  if (!trend.ok) {
    return fail(400, trend.error)
  }

  return { ok: true, data: trend.data }
}

export async function loadGmailMailboxIntelligenceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
}): Promise<{ ok: true; data: GmailMailboxIntelligenceData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  if (clusters.length === 0) return fail(400, 'clusters[] is required for mailbox_intelligence.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const workspace = await loadDerivedWorkspaceState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters,
  })
  if (!workspace.ok) return workspace

  const wholeMailbox = buildCleanupGroupIntelligence({
    rows: workspace.data.scopedRows,
    coverage: workspace.data.coverage,
    analysisScope,
    clusterCount: clusters.length,
  })
  const cleanupCandidateUniverse = buildCleanupGroupIntelligence({
    rows: workspace.data.candidateRows,
    coverage: workspace.data.coverage,
    analysisScope,
    clusterCount: clusters.length,
  })

  const protectedRows = workspace.data.scopedRows.filter((row) => protectionLabel(row))
  const likelyHumanRows = workspace.data.scopedRows.filter((row) => isLikelyHumanPriorityRow(row))
  const cautionCandidateRows = workspace.data.candidateRows.filter((row) => protectionLabel(row))
  const lowRiskCandidateRows = workspace.data.candidateRows.filter((row) => !protectionLabel(row))
  const protectedSenderSet = new Set(protectedRows.map((row) => normalizeSender(rowSender(row) || '')))
  const humanSenderSet = new Set(likelyHumanRows.map((row) => normalizeSender(rowSender(row) || '')))

  const cleanupGroups = clusters.map((cluster) => {
    const rows = workspace.data.matchedRowsByCluster.get(cluster.cluster_id) || []
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
        workspace.data.candidateRows.length > 0
          ? Math.round((rows.length / workspace.data.candidateRows.length) * 100)
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
      wholeMailbox: workspace.data.coverage.indexed_total_rows,
      cleanupCandidate: workspace.data.candidateRows.length,
      cleanupGroup: 0,
      senderSet: wholeMailbox.sender_ranking.length,
      loadedPreviewRows: Math.min(25, wholeMailbox.sender_ranking.length),
    }),
    whole_mailbox: {
      message_count: workspace.data.coverage.indexed_total_rows,
      sender_count: wholeMailbox.sender_ranking.length,
      indexed_inbox_rows: workspace.data.coverage.indexed_inbox_rows,
      indexed_date_span_start: workspace.data.coverage.indexed_date_span_start,
      indexed_date_span_end: workspace.data.coverage.indexed_date_span_end,
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
      scopedRows: workspace.data.scopedRows,
      candidateRows: workspace.data.candidateRows,
    }),
    source: 'gmail_index_cache',
  }

  return { ok: true, data }
}

export async function loadGmailSenderWorkspaceForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  page?: number
  pageSize?: number
  search?: string | null
  filter?: GmailSenderWorkspaceFilter
  sort?: GmailSenderWorkspaceSort
  direction?: GmailSenderWorkspaceSortDirection
}): Promise<{ ok: true; data: GmailSenderWorkspaceData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for sender_workspace.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for sender_workspace.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const page = Math.max(1, Math.floor(params.page || 1))
  const pageSize = Math.min(Math.max(Math.floor(params.pageSize || 12), 6), 40)
  const searchInput = typeof params.search === 'string' ? params.search.trim() : ''
  const search = searchInput.toLowerCase()
  const filter = normalizeSenderWorkspaceFilter(params.filter)
  const sort = normalizeSenderWorkspaceSort(params.sort)
  const direction = normalizeSenderWorkspaceSortDirection(params.direction)
  const workspace = await loadDerivedWorkspaceState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
  })
  if (!workspace.ok) return workspace

  const senderWorkspaceBase = await loadSenderWorkspaceBaseState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
    selectedCluster,
    workspace: workspace.data,
  })
  if (!senderWorkspaceBase.ok) return senderWorkspaceBase

  const selectedClusterRows = senderWorkspaceBase.data.selectedClusterRows
  const allSenders = senderWorkspaceBase.data.allSenders.slice()

  const filteredSenders = allSenders.filter((sender) => {
    if (search) {
      const haystack = [
        sender.sender,
        sender.sender_domain || '',
        sender.category_summary,
        sender.dominant_pattern,
        sender.verification_reasons.join(' '),
        sender.sender_signal,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filter === 'needs_verification') return sender.requires_verification
    if (filter === 'protected') return Boolean(sender.protected_hint)
    if (filter === 'likely_machine_generated') return sender.sender_signal === 'likely_machine_generated'
    if (filter === 'likely_human') return sender.sender_signal === 'likely_human'
    return true
  })

  filteredSenders.sort((left, right) => {
    let delta = 0
    if (sort === 'sender') {
      delta = left.sender.localeCompare(right.sender)
    } else if (sort === 'unread_count') {
      delta = left.unread_count - right.unread_count
    } else if (sort === 'last_activity') {
      delta =
        (Date.parse(left.last_activity || '') || 0) - (Date.parse(right.last_activity || '') || 0)
    } else {
      delta = left.cleanup_group_message_count - right.cleanup_group_message_count
    }
    if (delta === 0) delta = left.sender.localeCompare(right.sender)
    return direction === 'asc' ? delta : delta * -1
  })

  const totalSenders = filteredSenders.length
  const totalPages = Math.max(1, Math.ceil(totalSenders / pageSize))
  const normalizedPage = Math.min(page, totalPages)
  const rangeStart = (normalizedPage - 1) * pageSize
  const senders = filteredSenders.slice(rangeStart, rangeStart + pageSize)
  const senderActivityTimeline = buildSenderActivityTimeline({
    senders: allSenders,
    analysisScope,
  })

  const data: GmailSenderWorkspaceData = {
    analysis_scope: analysisScope,
    scope_ladder: buildScopeLadderCounts({
      wholeMailbox: workspace.data.coverage.indexed_total_rows,
      cleanupCandidate: workspace.data.candidateRows.length,
      cleanupGroup: selectedClusterRows.length,
      senderSet: filteredSenders.length,
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
      message_count: selectedClusterRows.length,
      sender_count: allSenders.length,
      share_pct:
        workspace.data.candidateRows.length > 0
          ? Math.round((selectedClusterRows.length / workspace.data.candidateRows.length) * 100)
          : 0,
    },
    senders,
    pagination: {
      page: normalizedPage,
      page_size: pageSize,
      total_senders: totalSenders,
      total_pages: totalPages,
      cluster_total_senders: allSenders.length,
    },
    analytics: {
      sender_category_distribution: buildSenderCategoryDistribution(allSenders),
      sender_activity_timeline: senderActivityTimeline.items,
      sender_activity_timeline_granularity: senderActivityTimeline.granularity,
      cluster_contribution: buildClusterContributionMetrics({
        senders: allSenders,
        clusterMessageCount: selectedClusterRows.length,
      }),
    },
    view: {
      search: searchInput,
      filter,
      sort,
      direction,
    },
    exceptions_count: allSenders.filter((sender) => sender.requires_verification).length,
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
            ? 'Archive after approval'
            : policy === 'keep'
              ? 'Keep as a future preference'
              : policy === 'quarantine'
                ? 'Store quarantine decision'
                : policy === 'unsubscribe'
                  ? 'Store unsubscribe decision'
                  : policy === 'custom_rule'
                    ? 'Store custom rule decision'
                    : 'No decision yet',
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
  const archiveMessageIdsBySender = archiveResolution.archiveRows.reduce<Record<string, string[]>>(
    (acc, row) => {
      const sender = rowSender(row) || 'Unknown sender'
      const senderKey = normalizeSender(sender) || sender.toLowerCase()
      const current = acc[senderKey] || []
      current.push(row.message_id)
      acc[senderKey] = current
      return acc
    },
    {}
  )

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
            ? 'Stored as a future keep preference in Phase 1. It does not execute a Gmail change now.'
            : policy === 'quarantine'
              ? 'Stored as a future quarantine decision in Phase 1. It does not execute a Gmail change now.'
              : policy === 'unsubscribe'
                ? 'Stored as a future unsubscribe decision in Phase 1. It does not execute a Gmail change now.'
                : 'Stored as a future custom-rule decision in Phase 1. It does not execute a Gmail change now.',
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
    archiveMessageIdsBySender,
  }
}

export async function loadGmailConfirmationPreviewForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<{ ok: true; data: GmailConfirmationPreviewData } | ReturnType<typeof fail>> {
  if (!params.tenantId) return fail(400, 'User profile is missing tenant_id.')
  const clusters = normalizeClusters(params.clusters)
  const selectedCluster = normalizeClusters([params.selectedCluster])[0]
  if (!selectedCluster) return fail(400, 'selected_cluster is required for confirmation_preview.')
  if (clusters.length === 0) return fail(400, 'clusters[] is required for confirmation_preview.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const workspace = await loadDerivedWorkspaceState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
  })
  if (!workspace.ok) return workspace

  const selectedClusterRows =
    workspace.data.matchedRowsByCluster
      .get(selectedCluster.cluster_id)
      ?.slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)) || []

  return {
    ok: true,
    data: buildConfirmationPreview({
      analysisScope,
      coverage: workspace.data.coverage,
      candidateRows: workspace.data.candidateRows,
      selectedCluster,
      selectedClusterRows,
      senderPolicies: params.senderPolicies,
      messageOverrides: params.messageOverrides || {},
    }).preview,
  }
}

export async function resolveGmailSenderPolicyArchiveScopeForTenant(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailAnalysisScope
  cacheVersion?: string | null
  clusters: ClusterInput[]
  selectedCluster: ClusterInput
  senderPolicies: Record<string, GmailSenderPolicy>
  messageOverrides?: Record<string, 'include' | 'exclude'>
}): Promise<
  | {
      ok: true
      data: {
        messageIds: string[]
        messageIdsBySender: Record<string, string[]>
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
  if (clusters.length === 0) return fail(400, 'clusters[] is required for archive resolution.')

  const analysisScope = normalizeMailboxProfileScope(params.analysisScope)
  const workspace = await loadDerivedWorkspaceState({
    supabase: params.supabase,
    tenantId: params.tenantId,
    analysisScope,
    clusters: ensureSelectedClusterIncluded(clusters, selectedCluster),
  })
  if (!workspace.ok) return workspace

  const selectedClusterRows =
    workspace.data.matchedRowsByCluster
      .get(selectedCluster.cluster_id)
      ?.slice()
      .sort((a, b) => (b.internal_date_ms || 0) - (a.internal_date_ms || 0)) || []
  const resolution = buildConfirmationPreview({
    analysisScope,
    coverage: workspace.data.coverage,
    candidateRows: workspace.data.candidateRows,
    selectedCluster,
    selectedClusterRows,
    senderPolicies: params.senderPolicies,
    messageOverrides: params.messageOverrides || {},
  })

  return {
    ok: true,
    data: {
      messageIds: resolution.archiveMessageIds,
      messageIdsBySender: resolution.archiveMessageIdsBySender,
      selectedCount: resolution.preview.exact_archive_impact.message_count,
      matchingMessagesInScope: selectedClusterRows.length,
      senderCount: resolution.preview.exact_archive_impact.sender_count,
    },
  }
}
