import type {
  ReviewUnitActivityBucket,
  ReviewUnitProjectionCoverage,
  ReviewUnitProjectionManifest,
} from '@/lib/runtime/reviewUnitContract'
import {
  createReviewUnitWindowProjectionAccumulator,
  type ReviewUnitProjectionAccumulator,
  type ReviewUnitProjectionMaterialization,
} from '@/lib/runtime/reviewUnitWindowProjection'

export const GMAIL_REVIEW_UNIT_PROJECTION_ADAPTER_ID = 'gmail.sender_message_activity'
export const GMAIL_REVIEW_UNIT_PROJECTION_ADAPTER_SCHEMA_VERSION = 1
export const GMAIL_REVIEW_UNIT_PROJECTION_WORKFLOW_ID = 'gmail_inbox_cleanup'
export const GMAIL_REVIEW_UNIT_PROJECTION_WORKSPACE_TYPE = 'gmail'
export const GMAIL_REVIEW_UNIT_PROJECTION_DECISION_SUBJECT_TYPE = 'sender'

export type GmailReviewUnitProjectionSeed = {
  tenant_id: string
  analysis_scope: string
  cluster_id: string
  artifact_version: string
  review_unit_id: string | null
  sender_key: string
}

export type GmailReviewUnitProjectionMessage = {
  sender_key: string
  internal_date_ms: number | null
  date?: string | null
  is_in_inbox?: boolean
  is_unread?: boolean
  is_starred?: boolean
  is_important?: boolean
}

export type GmailReviewUnitProjectionArtifactBundle = {
  manifests: ReviewUnitProjectionManifest[]
  activityBuckets: ReviewUnitActivityBucket[]
  validations: ReviewUnitProjectionMaterialization['validation'][]
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function projectionCoverage(params: {
  startAt: string
  endAt: string
  timeZone: string
}): ReviewUnitProjectionCoverage {
  const startMs = Date.parse(params.startAt)
  const inclusiveEndMs = Date.parse(params.endAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(inclusiveEndMs) || inclusiveEndMs < startMs) {
    throw new Error('Gmail projection requires valid indexed coverage bounds.')
  }
  return {
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(inclusiveEndMs + 1).toISOString(),
    timeZone: params.timeZone,
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function messageTimestamp(message: GmailReviewUnitProjectionMessage): number | null {
  if (typeof message.internal_date_ms === 'number' && Number.isFinite(message.internal_date_ms)) {
    return Math.round(message.internal_date_ms)
  }
  const parsed = Date.parse(normalizeText(message.date))
  return Number.isFinite(parsed) ? parsed : null
}

export async function materializeGmailReviewUnitWindowProjections(params: {
  tenantId: string
  workspaceId: string
  analysisScope: string
  artifactVersion: string
  indexedCoverageStartAt: string
  indexedCoverageEndAt: string
  timeZone: string
  seedRows: GmailReviewUnitProjectionSeed[]
  loadMessagesForSenderKeys: (
    senderKeys: string[]
  ) => Promise<GmailReviewUnitProjectionMessage[]>
  senderBatchSize?: number
}): Promise<GmailReviewUnitProjectionArtifactBundle> {
  const tenantId = normalizeText(params.tenantId)
  const workspaceId = normalizeText(params.workspaceId)
  const analysisScope = normalizeText(params.analysisScope)
  const artifactVersion = normalizeText(params.artifactVersion)
  if (!tenantId || !workspaceId || !analysisScope || !artifactVersion) {
    throw new Error('Gmail projection identity is incomplete.')
  }
  const coverage = projectionCoverage({
    startAt: params.indexedCoverageStartAt,
    endAt: params.indexedCoverageEndAt,
    timeZone: params.timeZone,
  })
  const actionableSeeds = params.seedRows.filter((row) => normalizeText(row.review_unit_id))
  const seedBySenderKey = new Map<string, GmailReviewUnitProjectionSeed>()
  const memberIdsByUnit = new Map<string, string[]>()
  for (const seed of actionableSeeds) {
    const senderKey = normalizeText(seed.sender_key)
    const parentId = normalizeText(seed.cluster_id)
    const reviewUnitId = normalizeText(seed.review_unit_id)
    if (
      !senderKey ||
      !parentId ||
      !reviewUnitId ||
      normalizeText(seed.tenant_id) !== tenantId ||
      normalizeText(seed.analysis_scope) !== analysisScope ||
      normalizeText(seed.artifact_version) !== artifactVersion
    ) {
      throw new Error('Gmail projection seed identity is incomplete or mixed-version.')
    }
    if (seedBySenderKey.has(senderKey)) {
      throw new Error(`Gmail projection sender ${senderKey} is assigned more than once.`)
    }
    seedBySenderKey.set(senderKey, seed)
    const unitKey = `${parentId}\u0000${reviewUnitId}`
    const members = memberIdsByUnit.get(unitKey) || []
    members.push(senderKey)
    memberIdsByUnit.set(unitKey, members)
  }
  if (seedBySenderKey.size === 0) {
    throw new Error('Gmail candidate has no actionable review-unit membership to project.')
  }

  const accumulatorByUnit = new Map<string, ReviewUnitProjectionAccumulator>()
  for (const [unitKey, memberEntityIds] of memberIdsByUnit) {
    const [parentId, reviewUnitId] = unitKey.split('\u0000')
    accumulatorByUnit.set(
      unitKey,
      createReviewUnitWindowProjectionAccumulator({
        identity: {
          tenantId,
          workspaceType: GMAIL_REVIEW_UNIT_PROJECTION_WORKSPACE_TYPE,
          workspaceId,
          workflowId: GMAIL_REVIEW_UNIT_PROJECTION_WORKFLOW_ID,
          decisionSubjectType: GMAIL_REVIEW_UNIT_PROJECTION_DECISION_SUBJECT_TYPE,
          analysisScope,
          parentId,
          artifactVersion,
          reviewUnitId,
        },
        adapterId: GMAIL_REVIEW_UNIT_PROJECTION_ADAPTER_ID,
        adapterSchemaVersion: GMAIL_REVIEW_UNIT_PROJECTION_ADAPTER_SCHEMA_VERSION,
        memberEntityIds,
        coverage,
        metadata: {
          activity_measure: 'indexed_messages',
          compatibility_workspace_identity: workspaceId === tenantId ? 'tenant_scoped' : 'workspace_scoped',
        },
      })
    )
  }

  const senderBatchSize = Math.max(1, Math.min(Math.round(params.senderBatchSize || 50), 100))
  const senderKeys = Array.from(seedBySenderKey.keys()).sort()
  for (const senderBatch of chunk(senderKeys, senderBatchSize)) {
    const messages = await params.loadMessagesForSenderKeys(senderBatch)
    const expectedSenderKeys = new Set(senderBatch)
    for (const message of messages) {
      const senderKey = normalizeText(message.sender_key)
      if (!expectedSenderKeys.has(senderKey)) {
        throw new Error(`Gmail projection loader returned unexpected sender ${senderKey || '(blank)'}.`)
      }
      const seed = seedBySenderKey.get(senderKey)
      if (!seed) throw new Error('Gmail projection seed lookup drifted.')
      const timestamp = messageTimestamp(message)
      if (timestamp == null) continue
      const unitKey = `${normalizeText(seed.cluster_id)}\u0000${normalizeText(seed.review_unit_id)}`
      const accumulator = accumulatorByUnit.get(unitKey)
      if (!accumulator) throw new Error('Gmail projection accumulator lookup drifted.')
      accumulator.addEvent({
        entityId: senderKey,
        occurredAt: timestamp,
        activityCount: 1,
        measurePayload: {
          indexed_messages: 1,
          inbox_messages: message.is_in_inbox === true ? 1 : 0,
          unread_messages: message.is_unread === true ? 1 : 0,
          protected_messages:
            message.is_starred === true || message.is_important === true ? 1 : 0,
        },
      })
    }
  }

  const materializations = Array.from(accumulatorByUnit.values()).map((accumulator) =>
    accumulator.finalize()
  )
  materializations.sort(
    (left, right) =>
      left.manifest.parentId.localeCompare(right.manifest.parentId) ||
      left.manifest.reviewUnitId.localeCompare(right.manifest.reviewUnitId)
  )
  return {
    manifests: materializations.map((entry) => entry.manifest),
    activityBuckets: materializations.flatMap((entry) => entry.activityBuckets),
    validations: materializations.map((entry) => entry.validation),
  }
}
