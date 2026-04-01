import type { SupabaseClient } from '@supabase/supabase-js'
import {
  addWholeMailboxAggregateDelta,
  buildGmailClusterArtifactRows,
  buildGmailMailboxIntelligenceRows,
  buildWholeMailboxAggregateFromRows,
  extractWholeMailboxAggregateFromSnapshotPayload,
  loadGmailMailboxRowsForSenders,
  resolveArtifactReferenceNowMs,
  loadGmailSenderStatsMap,
  projectGmailSenderArtifactSlice,
  recomputeGmailSenderStatsForSenders,
  subtractWholeMailboxAggregateDelta,
  type GmailClusterSpecSnapshot,
  type GmailMailboxStreamRow,
} from '@/lib/integrations/gmail/gmailArtifactFullMailboxProjector'
import {
  beginGmailArtifactBuild,
  createGmailArtifactVersion,
  failGmailArtifactBuild,
  loadGmailArtifactPublicationStatesForTenant,
  loadGmailClusterSummariesForArtifactVersion,
  loadGmailMailboxIntelligenceSnapshotForArtifactVersion,
  loadGmailPreviewIndexRowsForArtifactVersion,
  loadGmailSenderScopeRollupsForArtifactVersion,
  loadGmailSenderWorkspaceSeedHeadersForArtifactVersion,
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion,
  publishGmailArtifactBuild,
  reconcileGmailArtifactBuildLiveness,
  updateGmailArtifactBuildProgress,
  upsertGmailClusterSummaries,
  upsertGmailMailboxIntelligenceBuckets,
  upsertGmailMailboxIntelligenceSnapshots,
  upsertGmailPreviewIndexRows,
  upsertGmailSenderScopeRollupRows,
  upsertGmailSenderWorkspaceSeedHeaders,
  upsertGmailSenderWorkspaceSeedRows,
  type GmailArtifactAnalysisScope,
  type GmailClusterSummaryArtifactRow,
  type GmailPreviewIndexRow,
  type GmailSenderScopeRollupRow,
  type GmailSenderWorkspaceSeedHeaderRow,
  type GmailSenderWorkspaceSeedRow,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'
import { isCleanupCandidateGroupId } from '@/lib/integrations/gmail/inboxAnalysis'

export type GmailArtifactIncrementalMessageRow = {
  message_id: string
  thread_id: string | null
  sender: string | null
  subject: string | null
  internal_date_ms: number | null
  date: string | null
  label_ids: string[]
  category_labels: string[]
  is_in_inbox: boolean
  is_unread: boolean
  is_starred: boolean
  is_important: boolean
}

export type GmailArtifactIncrementalChangedMessage = {
  message_id: string
  before: GmailArtifactIncrementalMessageRow | null
  after: GmailArtifactIncrementalMessageRow | null
}

export type GmailArtifactIncrementalRefreshHint = {
  strategy: 'incremental'
  sync_run_id: string | null
  affected_sender_keys: string[]
  changed_messages: GmailArtifactIncrementalChangedMessage[]
}

type ScopeRefreshResult = {
  analysis_scope: GmailArtifactAnalysisScope
  status: 'updated' | 'skipped' | 'failed'
  artifact_version: string | null
  recomputed_sender_count: number
  recomputed_cluster_count: number
  row_counts?: Record<string, number>
  reason?: string
}

export type GmailArtifactIncrementalRefreshResult = {
  ok: boolean
  tenant_id: string
  affected_sender_keys: string[]
  changed_message_count: number
  scopes: ScopeRefreshResult[]
}

const LEGACY_SECONDARY_SYSTEM_NOTIFICATIONS_ID = 'secondary.system_notifications'
const RETIRED_RETAIL_CLEANUP_GROUP_ID = 'retail-commerce-senders'

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value)
  return normalized ? normalized : null
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))
}

function summaryPayloadCanonicalClusterId(row: GmailClusterSummaryArtifactRow): string {
  const payload =
    row.summary_payload && typeof row.summary_payload === 'object'
      ? (row.summary_payload as Record<string, unknown>)
      : null
  return normalizeText(payload?.cleanup_group_canonical_cluster_id) || normalizeText(row.cluster_id)
}

function publishedArtifactSupportsCanonicalIncrementalRefresh(
  clusterSummaries: GmailClusterSummaryArtifactRow[]
): boolean {
  return (
    clusterSummaries.length > 0 &&
    clusterSummaries.every((row) => {
      const clusterId = normalizeText(row.cluster_id)
      const canonicalClusterId = summaryPayloadCanonicalClusterId(row)
      return (
        clusterId.length > 0 &&
        clusterId === canonicalClusterId &&
        canonicalClusterId !== LEGACY_SECONDARY_SYSTEM_NOTIFICATIONS_ID &&
        clusterId !== RETIRED_RETAIL_CLEANUP_GROUP_ID
      )
    })
  )
}

function toStreamRow(params: {
  tenantId: string
  row: GmailArtifactIncrementalMessageRow
}): GmailMailboxStreamRow {
  return {
    tenant_id: params.tenantId,
    message_id: normalizeText(params.row.message_id),
    thread_id: normalizeNullableText(params.row.thread_id),
    sender: normalizeNullableText(params.row.sender),
    sender_key: normalizeText(params.row.sender) || 'unknown',
    subject: normalizeNullableText(params.row.subject),
    internal_date_ms:
      typeof params.row.internal_date_ms === 'number' && Number.isFinite(params.row.internal_date_ms)
        ? Math.round(params.row.internal_date_ms)
        : null,
    date: normalizeNullableText(params.row.date),
    label_ids: normalizeStringArray(params.row.label_ids),
    category_labels: normalizeStringArray(params.row.category_labels),
    is_in_inbox: params.row.is_in_inbox === true,
    is_unread: params.row.is_unread === true,
    is_starred: params.row.is_starred === true,
    is_important: params.row.is_important === true,
    indexed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function groupRowsBySenderKey(rows: GmailMailboxStreamRow[]): Map<string, GmailMailboxStreamRow[]> {
  const grouped = new Map<string, GmailMailboxStreamRow[]>()
  for (const row of rows) {
    const senderKey = normalizeText(row.sender_key)
    if (!senderKey) continue
    const bucket = grouped.get(senderKey) || []
    bucket.push(row)
    grouped.set(senderKey, bucket)
  }
  return grouped
}

function buildPreviousRowsFromHint(params: {
  tenantId: string
  currentRows: GmailMailboxStreamRow[]
  hint: GmailArtifactIncrementalRefreshHint
}): GmailMailboxStreamRow[] {
  const previousRowsByMessageId = new Map(
    params.currentRows.map((row) => [row.message_id, row] as const)
  )

  for (const changedMessage of params.hint.changed_messages) {
    const afterMessageId = normalizeText(changedMessage.after?.message_id)
    if (afterMessageId) {
      previousRowsByMessageId.delete(afterMessageId)
    }
    if (changedMessage.before) {
      const previousRow = toStreamRow({
        tenantId: params.tenantId,
        row: changedMessage.before,
      })
      previousRowsByMessageId.set(previousRow.message_id, previousRow)
    }
  }

  return Array.from(previousRowsByMessageId.values()).sort(
    (left, right) =>
      left.sender_key.localeCompare(right.sender_key) ||
      (right.internal_date_ms || 0) - (left.internal_date_ms || 0) ||
      left.message_id.localeCompare(right.message_id)
  )
}

function buildClusterSpecsFromHeaders(
  headers: GmailSenderWorkspaceSeedHeaderRow[]
): Record<string, GmailClusterSpecSnapshot> {
  return Object.fromEntries(
    headers.map((header) => [
      header.cluster_id,
      {
        cluster_id: header.cluster_id,
        cluster_type: header.cluster_type,
        title: header.title,
        query: header.query,
        why_selected: normalizeNullableText(header.why_selected),
        risk_note: normalizeNullableText(header.risk_note),
        safety_note: normalizeNullableText(header.safety_note),
      } satisfies GmailClusterSpecSnapshot,
    ])
  )
}

function sortRollups(rows: GmailSenderScopeRollupRow[]): GmailSenderScopeRollupRow[] {
  return rows.slice().sort(
    (left, right) =>
      right.cleanup_candidate_message_count - left.cleanup_candidate_message_count ||
      right.total_message_count - left.total_message_count ||
      left.sender.localeCompare(right.sender)
  )
}

function sortHeaders(rows: GmailSenderWorkspaceSeedHeaderRow[]): GmailSenderWorkspaceSeedHeaderRow[] {
  return rows.slice().sort(
    (left, right) => right.message_count - left.message_count || left.title.localeCompare(right.title)
  )
}

function sortClusterSummaries(
  rows: GmailClusterSummaryArtifactRow[]
): GmailClusterSummaryArtifactRow[] {
  return rows.slice().sort(
    (left, right) => right.message_count - left.message_count || left.title.localeCompare(right.title)
  )
}

function sortSeedRows(rows: GmailSenderWorkspaceSeedRow[]): GmailSenderWorkspaceSeedRow[] {
  return rows.slice().sort(
    (left, right) =>
      left.cluster_id.localeCompare(right.cluster_id) || left.default_rank - right.default_rank
  )
}

function sortPreviewRows(rows: GmailPreviewIndexRow[]): GmailPreviewIndexRow[] {
  return rows.slice().sort(
    (left, right) =>
      left.cluster_id.localeCompare(right.cluster_id) ||
      left.sender_key.localeCompare(right.sender_key) ||
      left.preview_rank - right.preview_rank
  )
}

function withArtifactVersion<T extends { artifact_version: string }>(
  row: T,
  artifactVersion: string
): T {
  return row.artifact_version === artifactVersion
    ? row
    : {
        ...row,
        artifact_version: artifactVersion,
      }
}

function validateArtifactVersion(params: {
  headers: GmailSenderWorkspaceSeedHeaderRow[]
  seedRows: GmailSenderWorkspaceSeedRow[]
  rollups: GmailSenderScopeRollupRow[]
  clusterSummaries: GmailClusterSummaryArtifactRow[]
  previewRows: GmailPreviewIndexRow[]
  snapshotPayload: Record<string, unknown>
}): string[] {
  const errors: string[] = []
  const headerClusterIds = new Set(params.headers.map((row) => row.cluster_id))
  const summaryClusterIds = new Set(params.clusterSummaries.map((row) => row.cluster_id))
  if (headerClusterIds.size !== summaryClusterIds.size) {
    errors.push('Header and cluster summary counts diverged.')
  }
  for (const clusterId of headerClusterIds) {
    if (!summaryClusterIds.has(clusterId)) {
      errors.push(`Missing cluster summary for ${clusterId}.`)
    }
  }

  const seedKeySet = new Set(
    params.seedRows.map((row) => `${row.cluster_id}::${row.sender_key}`)
  )
  for (const row of params.seedRows) {
    if (!headerClusterIds.has(row.cluster_id)) {
      errors.push(`Seed row ${row.sender_key} references missing header ${row.cluster_id}.`)
      break
    }
  }
  for (const row of params.previewRows) {
    if (!headerClusterIds.has(row.cluster_id)) {
      errors.push(`Preview row ${row.message_id} references missing header ${row.cluster_id}.`)
      break
    }
    if (!seedKeySet.has(`${row.cluster_id}::${row.sender_key}`)) {
      errors.push(`Preview row ${row.message_id} references missing seed row ${row.sender_key}.`)
      break
    }
  }

  const snapshot = params.snapshotPayload as {
    whole_mailbox?: { sender_count?: unknown }
    cleanup_candidate_universe?: { message_count?: unknown }
    cleanup_groups?: unknown
  }
  const candidatePreviewRowCount = params.previewRows.filter((row) =>
    isCleanupCandidateGroupId(row.cluster_id)
  ).length
  if (
    typeof snapshot.whole_mailbox?.sender_count === 'number' &&
    snapshot.whole_mailbox.sender_count !== params.rollups.length
  ) {
    errors.push('Mailbox intelligence sender count no longer matches rollup count.')
  }
  if (
    typeof snapshot.cleanup_candidate_universe?.message_count === 'number' &&
    snapshot.cleanup_candidate_universe.message_count !== candidatePreviewRowCount
  ) {
    errors.push('Mailbox intelligence candidate message count no longer matches preview rows.')
  }
  if (
    Array.isArray(snapshot.cleanup_groups) &&
    snapshot.cleanup_groups.length !== params.clusterSummaries.length
  ) {
    errors.push('Mailbox intelligence cleanup groups no longer match cluster summaries.')
  }

  return errors
}

export async function refreshPublishedGmailArtifactsIncrementally(params: {
  supabase: SupabaseClient
  tenantId: string
  hint: GmailArtifactIncrementalRefreshHint | null | undefined
  analysisScopes?: GmailArtifactAnalysisScope[] | null
  logPrefix?: string
}): Promise<GmailArtifactIncrementalRefreshResult> {
  const tenantId = normalizeText(params.tenantId)
  const hint = params.hint
  const logPrefix =
    params.logPrefix ?? '[integrations/gmail/incremental-artifact-refresh]'

  if (!tenantId || !hint || hint.strategy !== 'incremental') {
    return {
      ok: true,
      tenant_id: tenantId,
      affected_sender_keys: [],
      changed_message_count: 0,
      scopes: [],
    }
  }

  const affectedSenderKeys = uniqueStrings(hint.affected_sender_keys)
  if (affectedSenderKeys.length === 0) {
    return {
      ok: true,
      tenant_id: tenantId,
      affected_sender_keys: [],
      changed_message_count: hint.changed_messages.length,
      scopes: [],
    }
  }

  const coveragePromise = loadGmailMailboxIndexCoverageForTenant({
    supabase: params.supabase,
    tenantId,
  })
  const [publications, coverage, indexState, currentRows, senderStatsResult] = await Promise.all([
    loadGmailArtifactPublicationStatesForTenant({
      supabase: params.supabase,
      tenantId,
    }),
    coveragePromise,
    loadGmailMailboxIndexState({
      supabase: params.supabase,
      tenantId,
    }),
    loadGmailMailboxRowsForSenders({
      supabase: params.supabase,
      tenantId,
      senderKeys: affectedSenderKeys,
    }),
    coveragePromise.then((coverage) =>
      recomputeGmailSenderStatsForSenders({
        supabase: params.supabase,
        tenantId,
        senderKeys: affectedSenderKeys,
        referenceNowMs: resolveArtifactReferenceNowMs({ coverage }),
      })
    ),
  ])
  const referenceNowMs = resolveArtifactReferenceNowMs({ coverage })

  if (!senderStatsResult.ok) {
    throw new Error(senderStatsResult.error)
  }

  const scopeFilter = new Set(
    (params.analysisScopes || []).map((analysisScope) => normalizeText(analysisScope)).filter(Boolean)
  )
  const publishedScopes = publications.filter((publication) => {
    if (!normalizeText(publication.published_version)) return false
    return scopeFilter.size === 0 || scopeFilter.has(publication.analysis_scope)
  })
  if (publishedScopes.length === 0) {
    return {
      ok: true,
      tenant_id: tenantId,
      affected_sender_keys: affectedSenderKeys,
      changed_message_count: hint.changed_messages.length,
      scopes: [],
    }
  }

  const previousRows = buildPreviousRowsFromHint({
    tenantId,
    currentRows,
    hint,
  })
  const currentRowsBySender = groupRowsBySenderKey(currentRows)
  const previousRowsBySender = groupRowsBySenderKey(previousRows)

  const scopes: ScopeRefreshResult[] = []
  for (const publication of publishedScopes) {
    const refreshStartedAt = Date.now()
    const buildLiveness = await reconcileGmailArtifactBuildLiveness({
      supabase: params.supabase,
      tenantId,
      analysisScope: publication.analysis_scope,
      publication,
      logPrefix,
    })
    const activePublication = buildLiveness.publication ?? publication
    const analysisScope = activePublication.analysis_scope
    const publishedVersion = normalizeText(activePublication.published_version)
    if (!publishedVersion) continue
    if (buildLiveness.build_is_live) {
      scopes.push({
        analysis_scope: analysisScope,
        status: 'skipped',
        artifact_version: activePublication.building_version,
        recomputed_sender_count: 0,
        recomputed_cluster_count: 0,
        reason: buildLiveness.reclaim_reason || 'build_in_progress',
      })
      continue
    }

    const publishedClusterSummaries = await loadGmailClusterSummariesForArtifactVersion({
      supabase: params.supabase,
      tenantId,
      analysisScope,
      artifactVersion: publishedVersion,
    })
    if (!publishedArtifactSupportsCanonicalIncrementalRefresh(publishedClusterSummaries)) {
      scopes.push({
        analysis_scope: analysisScope,
        status: 'skipped',
        artifact_version: publishedVersion,
        recomputed_sender_count: 0,
        recomputed_cluster_count: 0,
        reason: 'full_rebuild_required_for_canonical_cutover',
      })
      continue
    }

    const artifactVersion = createGmailArtifactVersion('incremental')
    const jobId = `incremental:${tenantId}:${analysisScope}:${artifactVersion}`

    try {
      await beginGmailArtifactBuild({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        jobType: 'incremental_refresh',
        phase: 'loading_published_artifact',
        lastIndexStateUpdatedAt: indexState?.updated_at ?? null,
        lastIndexedMessageCount: coverage.indexed_total_rows,
        senderCheckpoint: affectedSenderKeys[affectedSenderKeys.length - 1] ?? null,
        messageCheckpoint: String(hint.changed_messages.length),
        clusterCheckpoint: null,
      })

      const publishedArtifactLoadStartedAt = Date.now()
      const [headers, seedRows, rollups, previewRows, snapshot] =
        await Promise.all([
          loadGmailSenderWorkspaceSeedHeadersForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: publishedVersion,
          }),
          loadGmailSenderWorkspaceSeedRowsForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: publishedVersion,
          }),
          loadGmailSenderScopeRollupsForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: publishedVersion,
          }),
          loadGmailPreviewIndexRowsForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: publishedVersion,
          }),
          loadGmailMailboxIntelligenceSnapshotForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: publishedVersion,
          }),
        ])
      const clusterSummaries = publishedClusterSummaries
      const publishedArtifactLoadMs = Math.max(0, Date.now() - publishedArtifactLoadStartedAt)

      const baseAggregate = extractWholeMailboxAggregateFromSnapshotPayload({
        analysisScope,
        snapshotPayload: (snapshot?.snapshot_payload as Record<string, unknown> | null | undefined) ?? null,
      })
      if (!baseAggregate) {
        throw new Error(
          'Published mailbox intelligence snapshot is missing incremental aggregate metadata.'
        )
      }
      const aggregateStrategy =
        snapshot?.snapshot_payload &&
        typeof snapshot.snapshot_payload === 'object' &&
        (snapshot.snapshot_payload as { artifact_internal?: unknown }).artifact_internal
          ? 'delta_from_published_internal'
          : 'delta_from_published_snapshot'

      const oldClusterSpecs = buildClusterSpecsFromHeaders(headers)
      const oldClusterIds = new Set<string>()
      for (const row of seedRows) {
        if (affectedSenderKeys.includes(row.sender_key)) {
          oldClusterIds.add(row.cluster_id)
        }
      }
      for (const row of previewRows) {
        if (affectedSenderKeys.includes(row.sender_key)) {
          oldClusterIds.add(row.cluster_id)
        }
      }

      let nextAggregate = baseAggregate
      const projectionStartedAt = Date.now()
      const senderProjections = affectedSenderKeys.map((senderKey) => {
        if (baseAggregate) {
          nextAggregate = subtractWholeMailboxAggregateDelta({
            base: nextAggregate,
            delta: buildWholeMailboxAggregateFromRows({
              analysisScope,
              rows: previousRowsBySender.get(senderKey) || [],
              nowMs: referenceNowMs,
            }),
          })
          nextAggregate = addWholeMailboxAggregateDelta({
            base: nextAggregate,
            delta: buildWholeMailboxAggregateFromRows({
              analysisScope,
              rows: currentRowsBySender.get(senderKey) || [],
              nowMs: referenceNowMs,
            }),
          })
        }
        return projectGmailSenderArtifactSlice({
          tenantId,
          analysisScope,
          artifactVersion,
          senderKey,
          sender: senderKey,
          rows: currentRowsBySender.get(senderKey) || [],
          nowMs: referenceNowMs,
        })
      })
      const projectionMs = Math.max(0, Date.now() - projectionStartedAt)

      const impactedClusterIds = new Set(oldClusterIds)
      const nextClusterSpecs: Record<string, GmailClusterSpecSnapshot> = {}
      for (const projection of senderProjections) {
        if (projection.cluster_spec) {
          impactedClusterIds.add(projection.cluster_spec.cluster_id)
          nextClusterSpecs[projection.cluster_spec.cluster_id] = projection.cluster_spec
        }
      }

      const affectedSenderSet = new Set(affectedSenderKeys)
      const nextRollups = sortRollups([
        ...rollups
          .filter((row) => !affectedSenderSet.has(row.sender_key))
          .map((row) => withArtifactVersion(row, artifactVersion)),
        ...senderProjections
          .map((projection) => projection.rollup_row)
          .filter((row): row is GmailSenderScopeRollupRow => row != null),
      ])
      const nextPreviewRows = sortPreviewRows([
        ...previewRows
          .filter((row) => !affectedSenderSet.has(row.sender_key))
          .map((row) => withArtifactVersion(row, artifactVersion)),
        ...senderProjections.flatMap((projection) => projection.preview_rows),
      ])

      const impactedClusterPreviewRows = nextPreviewRows.filter((row) =>
        impactedClusterIds.has(row.cluster_id)
      )
      const impactedClusterSenderKeys = uniqueStrings(
        impactedClusterPreviewRows.map((row) => row.sender_key)
      )
      const impactedStatsStartedAt = Date.now()
      const impactedStatsBySenderKey = await loadGmailSenderStatsMap({
        supabase: params.supabase,
        tenantId,
        senders: impactedClusterSenderKeys,
      })
      const impactedStatsMs = Math.max(0, Date.now() - impactedStatsStartedAt)
      const impactedClusterSpecs = Object.fromEntries(
        Array.from(impactedClusterIds)
          .map((clusterId) => [clusterId, nextClusterSpecs[clusterId] || oldClusterSpecs[clusterId]] as const)
          .filter((entry): entry is [string, GmailClusterSpecSnapshot] => entry[1] != null)
      )

      const impactedClusterRows = buildGmailClusterArtifactRows({
        tenantId,
        analysisScope,
        artifactVersion,
        clusterSpecs: impactedClusterSpecs,
        previewRows: impactedClusterPreviewRows,
        statsBySenderKey: impactedStatsBySenderKey,
        rollups: nextRollups,
      })

      const nextHeaders = sortHeaders([
        ...headers
          .filter((header) => !impactedClusterIds.has(header.cluster_id))
          .map((header) => withArtifactVersion(header, artifactVersion)),
        ...impactedClusterRows.seedHeaders,
      ])
      const nextSeedRows = sortSeedRows([
        ...seedRows
          .filter((row) => !impactedClusterIds.has(row.cluster_id))
          .map((row) => withArtifactVersion(row, artifactVersion)),
        ...impactedClusterRows.seedRows,
      ])
      const nextClusterSummaries = sortClusterSummaries([
        ...clusterSummaries
          .filter((row) => !impactedClusterIds.has(row.cluster_id))
          .map((row) => withArtifactVersion(row, artifactVersion)),
        ...impactedClusterRows.clusterSummaries,
      ])

      const mailboxIntelligenceStartedAt = Date.now()
      const mailboxIntelligenceRows = buildGmailMailboxIntelligenceRows({
        tenantId,
        analysisScope,
        artifactVersion,
        coverage,
        aggregate: nextAggregate,
        rollups: nextRollups,
        previewRows: nextPreviewRows,
        clusterSummaries: nextClusterSummaries,
      })
      const mailboxIntelligenceMs = Math.max(0, Date.now() - mailboxIntelligenceStartedAt)

      const validationStartedAt = Date.now()
      const consistencyErrors = validateArtifactVersion({
        headers: nextHeaders,
        seedRows: nextSeedRows,
        rollups: nextRollups,
        clusterSummaries: nextClusterSummaries,
        previewRows: nextPreviewRows,
        snapshotPayload: mailboxIntelligenceRows.snapshotPayload as unknown as Record<string, unknown>,
      })
      if (consistencyErrors.length > 0) {
        throw new Error(consistencyErrors.join(' | '))
      }
      const validationMs = Math.max(0, Date.now() - validationStartedAt)

      await updateGmailArtifactBuildProgress({
        supabase: params.supabase,
        jobId,
        tenantId,
        analysisScope,
        artifactVersion,
        phase: 'writing_incremental_artifact',
        senderCheckpoint: affectedSenderKeys[affectedSenderKeys.length - 1] ?? null,
        processedSenderCount: affectedSenderKeys.length,
        processedMessageCount: hint.changed_messages.length,
        processedClusterCount: impactedClusterIds.size,
      })

      const writeStartedAt = Date.now()
      await Promise.all([
        upsertGmailSenderWorkspaceSeedHeaders({
          supabase: params.supabase,
          rows: nextHeaders,
        }),
        upsertGmailSenderWorkspaceSeedRows({
          supabase: params.supabase,
          rows: nextSeedRows,
        }),
        upsertGmailSenderScopeRollupRows({
          supabase: params.supabase,
          rows: nextRollups,
        }),
        upsertGmailClusterSummaries({
          supabase: params.supabase,
          rows: nextClusterSummaries,
        }),
        upsertGmailMailboxIntelligenceSnapshots({
          supabase: params.supabase,
          rows: mailboxIntelligenceRows.snapshotRows,
        }),
        upsertGmailMailboxIntelligenceBuckets({
          supabase: params.supabase,
          rows: mailboxIntelligenceRows.bucketRows,
        }),
        upsertGmailPreviewIndexRows({
          supabase: params.supabase,
          rows: nextPreviewRows,
        }),
      ])
      const writeMs = Math.max(0, Date.now() - writeStartedAt)

      const rowCounts = {
        gmail_sender_workspace_seed_headers: nextHeaders.length,
        gmail_sender_workspace_seed_rows: nextSeedRows.length,
        gmail_sender_scope_rollups: nextRollups.length,
        gmail_cluster_summaries: nextClusterSummaries.length,
        gmail_mailbox_intelligence_snapshots: mailboxIntelligenceRows.snapshotRows.length,
        gmail_mailbox_intelligence_buckets: mailboxIntelligenceRows.bucketRows.length,
        gmail_preview_index: nextPreviewRows.length,
      }
      const publishStartedAt = Date.now()
      await publishGmailArtifactBuild({
        supabase: params.supabase,
        jobId,
        tenantId,
        analysisScope,
        artifactVersion,
        lastIndexStateUpdatedAt: indexState?.updated_at ?? null,
        lastIndexedMessageCount: coverage.indexed_total_rows,
        processedSenderCount: affectedSenderKeys.length,
        processedMessageCount: hint.changed_messages.length,
        processedClusterCount: impactedClusterIds.size,
      })
      const publishMs = Math.max(0, Date.now() - publishStartedAt)

      console.info(
        `${logPrefix} ${JSON.stringify({
          tenant_id: tenantId,
          analysis_scope: analysisScope,
          published_version_before: publishedVersion,
          artifact_version: artifactVersion,
          sync_run_id: hint.sync_run_id,
          affected_sender_keys: affectedSenderKeys,
          aggregate_strategy: aggregateStrategy,
          recomputed_sender_count: affectedSenderKeys.length,
          impacted_cluster_ids: Array.from(impactedClusterIds).sort(),
          recomputed_cluster_count: impactedClusterIds.size,
          changed_message_count: hint.changed_messages.length,
          row_counts: rowCounts,
          timing_ms: {
            published_artifact_load: publishedArtifactLoadMs,
            sender_projection: projectionMs,
            impacted_stats_load: impactedStatsMs,
            mailbox_intelligence_rebuild: mailboxIntelligenceMs,
            validation: validationMs,
            artifact_write: writeMs,
            publish: publishMs,
            total: Math.max(0, Date.now() - refreshStartedAt),
          },
        })}`
      )

      scopes.push({
        analysis_scope: analysisScope,
        status: 'updated',
        artifact_version: artifactVersion,
        recomputed_sender_count: affectedSenderKeys.length,
        recomputed_cluster_count: impactedClusterIds.size,
        row_counts: rowCounts,
      })
    } catch (error) {
      await failGmailArtifactBuild({
        supabase: params.supabase,
        jobId,
        tenantId,
        analysisScope,
        artifactVersion,
        error,
        phase: 'incremental_refresh_failed',
      })
      console.error(
        `${logPrefix} ${JSON.stringify({
          tenant_id: tenantId,
          analysis_scope: analysisScope,
          artifact_version: artifactVersion,
          sync_run_id: hint.sync_run_id,
          error: error instanceof Error ? error.message : String(error),
        })}`
      )
      scopes.push({
        analysis_scope: analysisScope,
        status: 'failed',
        artifact_version: artifactVersion,
        recomputed_sender_count: affectedSenderKeys.length,
        recomputed_cluster_count: 0,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    ok: scopes.every((scope) => scope.status !== 'failed'),
    tenant_id: tenantId,
    affected_sender_keys: affectedSenderKeys,
    changed_message_count: hint.changed_messages.length,
    scopes,
  }
}
