import {
  createGmailArtifactVersion,
  type GmailArtifactAnalysisScope,
  type GmailClusterSummaryArtifactRow,
  type GmailMailboxIntelligenceBucketRow,
  type GmailMailboxIntelligenceSnapshotRow,
  type GmailPreviewIndexRow,
  type GmailSenderWorkspaceSeedHeaderRow,
  type GmailSenderWorkspaceSeedRow,
  type GmailShadowArtifactBundle,
} from '@/lib/integrations/gmail/gmailArtifactStore'

export type GmailArtifactProjectionPreviewInput = {
  previewRank: number
  messageId: string
  threadId?: string | null
  sender?: string | null
  subject?: string | null
  snippet?: string | null
  internalDateMs?: number | null
  date?: string | null
  labelIds?: string[]
  categoryLabels?: string[]
  isInInbox?: boolean
  isUnread?: boolean
  isImportant?: boolean
  isStarred?: boolean
  protectedHint?: string | null
  payload?: Record<string, unknown>
}

export type GmailArtifactProjectionSenderInput = {
  senderKey: string
  sender: string
  senderDomain?: string | null
  defaultRank: number
  cleanupGroupMessageCount?: number
  unreadCount?: number
  protectedHint?: string | null
  requiresVerification?: boolean
  verificationReasons?: string[]
  previewMessageIds?: string[]
  previewReady?: boolean
  payload?: Record<string, unknown>
  previews?: GmailArtifactProjectionPreviewInput[]
}

export type GmailArtifactProjectionClusterInput = {
  clusterId: string
  clusterType: string
  title: string
  query: string
  whySelected?: string | null
  riskNote?: string | null
  safetyNote?: string | null
  messageCount?: number
  senderCount?: number
  sharePct?: number
  dominantSender?: string | null
  dominantPattern?: string | null
  protectedMessageCount?: number
  uncertainSenderCount?: number
  pagination?: Record<string, unknown>
  analytics?: Record<string, unknown>
  headerSource?: string
  summaryPayload?: Record<string, unknown>
  senders?: GmailArtifactProjectionSenderInput[]
}

export type GmailArtifactProjectionBucketInput = {
  bucketKind: string
  bucketKey: string
  bucketStartAt: string
  bucketEndAt?: string | null
  bucketValue?: number
  payload?: Record<string, unknown>
}

export type GmailArtifactProjectionInput = {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion?: string | null
  lastIndexStateUpdatedAt?: string | null
  lastIndexedMessageCount?: number | null
  mailboxIntelligenceSnapshot?: Record<string, unknown>
  mailboxIntelligenceBuckets?: GmailArtifactProjectionBucketInput[]
  clusters?: GmailArtifactProjectionClusterInput[]
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value)
  return normalized ? normalized : null
}

function normalizeInteger(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return fallback
}

function normalizeBoolean(value: unknown): boolean {
  return value === true
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean)
    : []
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function buildGmailArtifactShadowBundle(
  params: GmailArtifactProjectionInput
): GmailShadowArtifactBundle {
  const artifactVersion = normalizeText(params.artifactVersion) || createGmailArtifactVersion()
  const clusters = Array.isArray(params.clusters) ? params.clusters : []

  const senderWorkspaceSeedHeaders: GmailSenderWorkspaceSeedHeaderRow[] = []
  const senderWorkspaceSeedRows: GmailSenderWorkspaceSeedRow[] = []
  const clusterSummaries: GmailClusterSummaryArtifactRow[] = []
  const previewIndexRows: GmailPreviewIndexRow[] = []

  for (const cluster of clusters) {
    const clusterId = normalizeText(cluster.clusterId)
    if (!clusterId) continue
    const clusterType = normalizeText(cluster.clusterType)
    const title = normalizeText(cluster.title)
    const query = normalizeText(cluster.query)
    const senders = Array.isArray(cluster.senders) ? cluster.senders : []
    const senderCount = normalizeInteger(cluster.senderCount, senders.length)

    senderWorkspaceSeedHeaders.push({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      cluster_id: clusterId,
      artifact_version: artifactVersion,
      cluster_type: clusterType,
      title,
      query,
      why_selected: normalizeNullableText(cluster.whySelected),
      risk_note: normalizeNullableText(cluster.riskNote),
      safety_note: normalizeNullableText(cluster.safetyNote),
      message_count: normalizeInteger(cluster.messageCount),
      sender_count: senderCount,
      share_pct: Math.min(100, normalizeInteger(cluster.sharePct)),
      pagination: normalizeJsonObject(cluster.pagination),
      analytics: normalizeJsonObject(cluster.analytics),
      source: normalizeText(cluster.headerSource) || 'shadow_artifact',
    })

    clusterSummaries.push({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      cluster_id: clusterId,
      artifact_version: artifactVersion,
      cluster_type: clusterType,
      title,
      query,
      why_selected: normalizeNullableText(cluster.whySelected),
      risk_note: normalizeNullableText(cluster.riskNote),
      safety_note: normalizeNullableText(cluster.safetyNote),
      message_count: normalizeInteger(cluster.messageCount),
      sender_count: senderCount,
      share_pct: Math.min(100, normalizeInteger(cluster.sharePct)),
      dominant_sender: normalizeNullableText(cluster.dominantSender),
      dominant_pattern: normalizeNullableText(cluster.dominantPattern),
      protected_message_count: normalizeInteger(cluster.protectedMessageCount),
      uncertain_sender_count: normalizeInteger(cluster.uncertainSenderCount),
      summary_payload: normalizeJsonObject(cluster.summaryPayload),
    })

    for (const sender of senders) {
      const senderKey = normalizeText(sender.senderKey)
      if (!senderKey) continue

      senderWorkspaceSeedRows.push({
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        cluster_id: clusterId,
        sender_key: senderKey,
        artifact_version: artifactVersion,
        default_rank: normalizeInteger(sender.defaultRank),
        sender: normalizeText(sender.sender),
        sender_domain: normalizeNullableText(sender.senderDomain),
        cleanup_group_message_count: normalizeInteger(sender.cleanupGroupMessageCount),
        unread_count: normalizeInteger(sender.unreadCount),
        protected_hint: normalizeNullableText(sender.protectedHint),
        requires_verification: normalizeBoolean(sender.requiresVerification),
        verification_reasons: normalizeStringArray(sender.verificationReasons),
        preview_message_ids: normalizeStringArray(sender.previewMessageIds),
        preview_ready: normalizeBoolean(sender.previewReady),
        semantic_family_key: null,
        semantic_subtype_key: null,
        semantic_pattern_key: null,
        review_unit_id: null,
        last_activity_at: null,
        seed_payload: normalizeJsonObject(sender.payload),
      })

      const previews = Array.isArray(sender.previews) ? sender.previews : []
      for (const preview of previews) {
        previewIndexRows.push({
          tenant_id: params.tenantId,
          analysis_scope: params.analysisScope,
          cluster_id: clusterId,
          sender_key: senderKey,
          artifact_version: artifactVersion,
          preview_rank: normalizeInteger(preview.previewRank),
          message_id: normalizeText(preview.messageId),
          thread_id: normalizeNullableText(preview.threadId),
          sender: normalizeNullableText(preview.sender ?? sender.sender),
          subject: normalizeNullableText(preview.subject),
          snippet: normalizeNullableText(preview.snippet),
          internal_date_ms:
            typeof preview.internalDateMs === 'number' && Number.isFinite(preview.internalDateMs)
              ? Math.round(preview.internalDateMs)
              : null,
          date: normalizeNullableText(preview.date),
          label_ids: normalizeStringArray(preview.labelIds),
          category_labels: normalizeStringArray(preview.categoryLabels),
          is_in_inbox: normalizeBoolean(preview.isInInbox),
          is_unread: normalizeBoolean(preview.isUnread),
          is_important: normalizeBoolean(preview.isImportant),
          is_starred: normalizeBoolean(preview.isStarred),
          protected_hint: normalizeNullableText(preview.protectedHint),
          preview_payload: normalizeJsonObject(preview.payload),
        })
      }
    }
  }

  const mailboxIntelligenceSnapshots: GmailMailboxIntelligenceSnapshotRow[] = [
    {
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      artifact_version: artifactVersion,
      snapshot_payload: normalizeJsonObject(params.mailboxIntelligenceSnapshot),
      source: 'shadow_artifact',
    },
  ]

  const mailboxIntelligenceBuckets: GmailMailboxIntelligenceBucketRow[] = (
    params.mailboxIntelligenceBuckets || []
  )
    .map((bucket) => {
      const bucketKind = normalizeText(bucket.bucketKind)
      const bucketKey = normalizeText(bucket.bucketKey)
      const bucketStartAt = normalizeText(bucket.bucketStartAt)
      if (!bucketKind || !bucketKey || !bucketStartAt) return null
      return {
        tenant_id: params.tenantId,
        analysis_scope: params.analysisScope,
        artifact_version: artifactVersion,
        bucket_kind: bucketKind,
        bucket_key: bucketKey,
        bucket_start_at: bucketStartAt,
        bucket_end_at: normalizeNullableText(bucket.bucketEndAt),
        bucket_value: normalizeInteger(bucket.bucketValue),
        bucket_payload: normalizeJsonObject(bucket.payload),
      }
    })
    .filter((entry): entry is GmailMailboxIntelligenceBucketRow => entry != null)

  return {
    tenant_id: params.tenantId,
    analysis_scope: params.analysisScope,
    artifact_version: artifactVersion,
    last_index_state_updated_at: normalizeNullableText(params.lastIndexStateUpdatedAt),
    last_indexed_message_count:
      typeof params.lastIndexedMessageCount === 'number' && Number.isFinite(params.lastIndexedMessageCount)
        ? Math.max(0, Math.round(params.lastIndexedMessageCount))
        : null,
    sender_workspace_seed_headers: senderWorkspaceSeedHeaders,
    sender_workspace_seed_rows: senderWorkspaceSeedRows,
    cluster_summaries: clusterSummaries,
    mailbox_intelligence_snapshots: mailboxIntelligenceSnapshots,
    mailbox_intelligence_buckets: mailboxIntelligenceBuckets,
    preview_index_rows: previewIndexRows,
  }
}
