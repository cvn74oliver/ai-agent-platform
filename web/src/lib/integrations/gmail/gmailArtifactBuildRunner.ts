import type { SupabaseClient } from '@supabase/supabase-js'
import {
  beginGmailArtifactBuild,
  clearGmailArtifactBuildVersionRows,
  countGmailArtifactVersionRows,
  createGmailArtifactVersion,
  failGmailArtifactBuild,
  loadGmailArtifactJobState,
  loadGmailArtifactPublicationState,
  loadGmailSenderWorkspaceSeedRowsForArtifactVersion,
  publishGmailArtifactBuild,
  updateGmailArtifactBuildProgress,
  type GmailArtifactAnalysisScope,
} from '@/lib/integrations/gmail/gmailArtifactStore'
import {
  finalizeGmailFullMailboxArtifacts,
  isGmailArtifactFinalizeCompleted,
  resolveArtifactReferenceNowMs,
  restoreGmailArtifactCheckpoint,
  restoreGmailArtifactFinalizeCheckpoint,
  serializeGmailArtifactCheckpoint,
  serializeGmailArtifactFinalizeCheckpoint,
  streamGmailSenderArtifactProjection,
} from '@/lib/integrations/gmail/gmailArtifactFullMailboxProjector'
import {
  loadGmailMailboxIndexCoverageForTenant,
  loadGmailMailboxIndexState,
} from '@/lib/integrations/gmail/gmailMailboxIndexer'

const FULL_BUILD_RETRY_ATTEMPTS = normalizeRuntimeCount(
  Number.parseInt(process.env.GMAIL_FULL_BUILD_RETRY_ATTEMPTS ?? '3', 10),
  3
)
const FULL_BUILD_RETRY_DELAY_MS = normalizeRuntimeCount(
  Number.parseInt(process.env.GMAIL_FULL_BUILD_RETRY_DELAY_MS ?? '2000', 10),
  2000
)
const FULL_BUILD_PROGRESS_LOG_INTERVAL = normalizeRuntimeCount(
  Number.parseInt(process.env.GMAIL_FULL_BUILD_PROGRESS_LOG_INTERVAL ?? '250', 10),
  250
)

export type GmailFullMailboxArtifactBuildResult = {
  ok: true
  tenant_id: string
  analysis_scope: GmailArtifactAnalysisScope
  artifact_version: string
  job_id: string
  resumed: boolean
  processed_sender_count: number
  processed_message_count: number
  processed_cluster_count: number
  indexed_corpus_size: number
  row_counts: Record<string, number>
}

type ResumeBuildContext = {
  artifactVersion: string
  jobId: string
  checkpointValue: string | null
  finalizeCheckpointValue: string | null
  processedSenderCount: number
  processedMessageCount: number
  processedClusterCount: number
}

type GmailFullMailboxBuildAttemptError = Error & {
  artifactVersion: string | null
  jobId: string | null
  phase: string
  retriable: boolean
  cause: unknown
}

const gmailFullBuildRunnerGlobal = globalThis as typeof globalThis & {
  __gmailFullBuildInjectedRetryFailures?: Set<string>
}

const injectedRetryFailures =
  gmailFullBuildRunnerGlobal.__gmailFullBuildInjectedRetryFailures || new Set<string>()
if (!gmailFullBuildRunnerGlobal.__gmailFullBuildInjectedRetryFailures) {
  gmailFullBuildRunnerGlobal.__gmailFullBuildInjectedRetryFailures = injectedRetryFailures
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function normalizeRuntimeCount(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.round(value))
  }
  return Math.max(1, Math.round(fallback))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stringifyBuildError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

function isRetriableFullBuildError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return /fetch failed|network|ECONNRESET|ETIMEDOUT|socket|temporar|bad gateway|cloudflare|502|503|504|520|522|524|timeout|retryable/i.test(
    message
  )
}

function coerceAttemptError(error: unknown): GmailFullMailboxBuildAttemptError {
  if (
    error instanceof Error &&
    'artifactVersion' in error &&
    'jobId' in error &&
    'phase' in error &&
    'retriable' in error &&
    'cause' in error
  ) {
    return error as GmailFullMailboxBuildAttemptError
  }

  const wrapped = new Error(stringifyBuildError(error)) as GmailFullMailboxBuildAttemptError
  wrapped.name = 'GmailFullMailboxBuildAttemptError'
  wrapped.artifactVersion = null
  wrapped.jobId = null
  wrapped.phase = 'full_mailbox_build_failed'
  wrapped.retriable = isRetriableFullBuildError(error)
  wrapped.cause = error
  return wrapped
}

function createAttemptError(params: {
  error: unknown
  artifactVersion: string | null
  jobId: string | null
  phase: string
}): GmailFullMailboxBuildAttemptError {
  const wrapped = new Error(stringifyBuildError(params.error)) as GmailFullMailboxBuildAttemptError
  wrapped.name = 'GmailFullMailboxBuildAttemptError'
  wrapped.artifactVersion = normalizeText(params.artifactVersion) || null
  wrapped.jobId = normalizeText(params.jobId) || null
  wrapped.phase = normalizeText(params.phase) || 'full_mailbox_build_failed'
  wrapped.retriable = isRetriableFullBuildError(params.error)
  wrapped.cause = params.error
  return wrapped
}

function logFullBuildPhase(params: {
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion: string | null
  jobId: string | null
  attempt: number
  maxAttempts: number
  phase: string
  event: 'started' | 'completed' | 'skipped'
  durationMs?: number
  extra?: Record<string, unknown>
}): void {
  console.info(
    `[integrations/gmail/full-mailbox-artifact-build-phase] ${JSON.stringify({
      tenant_id: params.tenantId,
      analysis_scope: params.analysisScope,
      artifact_version: params.artifactVersion,
      job_id: params.jobId,
      attempt: params.attempt,
      max_attempts: params.maxAttempts,
      phase: params.phase,
      event: params.event,
      duration_ms:
        typeof params.durationMs === 'number' && Number.isFinite(params.durationMs)
          ? Math.max(0, Math.round(params.durationMs))
          : undefined,
      ...params.extra,
    })}`
  )
}

function maybeInjectRetryableFailure(params: {
  phase: string
  artifactVersion: string
  jobId: string
}): void {
  const configuredPhase = normalizeText(process.env.GMAIL_FULL_BUILD_INJECT_RETRYABLE_FAILURE_PHASE)
  if (!configuredPhase || configuredPhase !== params.phase) return
  const failureKey = [params.artifactVersion, params.jobId, params.phase].join('::')
  if (injectedRetryFailures.has(failureKey)) return
  injectedRetryFailures.add(failureKey)
  throw new Error(
    `Injected retryable full build failure at ${params.phase} (retryable fault injection).`
  )
}

async function runGmailFullMailboxArtifactBuildAttempt(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope: GmailArtifactAnalysisScope
  artifactVersion?: string | null
  jobId?: string | null
  resumeJobId?: string | null
  attempt: number
  maxAttempts: number
}): Promise<GmailFullMailboxArtifactBuildResult> {
  const buildStartedAt = Date.now()
  const tenantId = normalizeText(params.tenantId)
  const analysisScope = params.analysisScope || 'all_indexed'
  if (!tenantId) {
    throw new Error('tenantId is required for full mailbox artifact builds.')
  }

  let activePhase = 'loading_inputs'
  let artifactVersion = normalizeText(params.artifactVersion) || null
  let jobId = normalizeText(params.jobId) || null

  try {
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'started',
      extra: {
        requested_resume_job_id: normalizeText(params.resumeJobId) || null,
      },
    })

    const inputLoadStartedAt = Date.now()
    const [coverage, indexState, publication] = await Promise.all([
      loadGmailMailboxIndexCoverageForTenant({
        supabase: params.supabase,
        tenantId,
      }),
      loadGmailMailboxIndexState({
        supabase: params.supabase,
        tenantId,
      }),
      loadGmailArtifactPublicationState({
        supabase: params.supabase,
        tenantId,
        analysisScope,
      }),
    ])
    const inputLoadMs = Math.max(0, Date.now() - inputLoadStartedAt)
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'completed',
      durationMs: inputLoadMs,
      extra: {
        indexed_total_rows: coverage.indexed_total_rows,
        indexed_inbox_rows: coverage.indexed_inbox_rows,
        published_version_before: publication?.published_version ?? null,
        building_version_before: publication?.building_version ?? null,
      },
    })

    let resume: ResumeBuildContext | null = null
    const resumeJobId = normalizeText(params.resumeJobId)
    if (resumeJobId) {
      activePhase = 'loading_resume_job'
      logFullBuildPhase({
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        phase: activePhase,
        event: 'started',
        extra: {
          resume_job_id: resumeJobId,
        },
      })
      const resumeStartedAt = Date.now()
      const resumeJob = await loadGmailArtifactJobState({
        supabase: params.supabase,
        jobId: resumeJobId,
      })
      if (
        resumeJob &&
        resumeJob.tenant_id === tenantId &&
        resumeJob.analysis_scope === analysisScope &&
        resumeJob.status !== 'completed'
      ) {
        resume = {
          artifactVersion: resumeJob.artifact_version,
          jobId: resumeJob.job_id,
          checkpointValue: resumeJob.message_checkpoint,
          finalizeCheckpointValue: resumeJob.cluster_checkpoint,
          processedSenderCount: normalizeCount(resumeJob.processed_sender_count),
          processedMessageCount: normalizeCount(resumeJob.processed_message_count),
          processedClusterCount: normalizeCount(resumeJob.processed_cluster_count),
        }
      } else {
        throw new Error(`Unable to resume Gmail artifact build job ${resumeJobId}.`)
      }
      logFullBuildPhase({
        tenantId,
        analysisScope,
        artifactVersion: resume?.artifactVersion ?? artifactVersion,
        jobId: resume?.jobId ?? jobId,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        phase: activePhase,
        event: 'completed',
        durationMs: Math.max(0, Date.now() - resumeStartedAt),
        extra: {
          resumed: true,
          processed_sender_count_before: resume.processedSenderCount,
          processed_message_count_before: resume.processedMessageCount,
          processed_cluster_count_before: resume.processedClusterCount,
        },
      })
    }

    const providedArtifactVersion = normalizeText(params.artifactVersion)
    artifactVersion =
      resume?.artifactVersion ||
      artifactVersion ||
      providedArtifactVersion ||
      createGmailArtifactVersion('full-mailbox')
    jobId =
      resume?.jobId ||
      jobId ||
      normalizeText(params.jobId) ||
      `full-rebuild:${tenantId}:${analysisScope}:${artifactVersion}`
    if (!artifactVersion || !jobId) {
      throw new Error('Failed to establish artifactVersion/jobId for full mailbox artifact build.')
    }
    const activeArtifactVersion = artifactVersion
    const activeJobId = jobId

    const checkpoint = restoreGmailArtifactCheckpoint({
      value: resume?.checkpointValue ?? null,
      analysisScope,
    })
    const finalizeCheckpoint = restoreGmailArtifactFinalizeCheckpoint(
      resume?.finalizeCheckpointValue ?? null
    )
    const referenceNowMs = normalizeCount(checkpoint.reference_now_ms)
      ? normalizeCount(checkpoint.reference_now_ms)
      : resolveArtifactReferenceNowMs({ coverage })
    checkpoint.reference_now_ms = referenceNowMs

    const publishedSeedRows =
      !resume && normalizeText(publication?.published_version)
        ? await loadGmailSenderWorkspaceSeedRowsForArtifactVersion({
            supabase: params.supabase,
            tenantId,
            analysisScope,
            artifactVersion: normalizeText(publication?.published_version),
          })
        : []
    const publishedSeedRowsBySenderKey = new Map(
      publishedSeedRows.map((row) => [row.sender_key, row] as const)
    )

    console.info(
      `[integrations/gmail/full-mailbox-artifact-build-attempt] ${JSON.stringify({
        tenant_id: tenantId,
        analysis_scope: analysisScope,
        artifact_version: artifactVersion,
        job_id: jobId,
        attempt: params.attempt,
        max_attempts: params.maxAttempts,
        resumed: resume != null,
        checkpoint_sender_key: checkpoint.cursor?.sender_key ?? null,
        finalize_stage: finalizeCheckpoint.current_stage,
        completed_finalize_write_stages: finalizeCheckpoint.completed_write_stages,
      })}`
    )

    if (!resume) {
      await beginGmailArtifactBuild({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        jobType: 'full_rebuild',
        phase: 'projecting_sender_scope',
        lastIndexStateUpdatedAt: indexState?.updated_at || null,
        lastIndexedMessageCount: coverage.indexed_total_rows,
        senderCheckpoint: null,
        messageCheckpoint: serializeGmailArtifactCheckpoint(checkpoint),
        clusterCheckpoint: null,
      })
      if (providedArtifactVersion) {
        await clearGmailArtifactBuildVersionRows({
          supabase: params.supabase,
          tenantId,
          analysisScope,
          artifactVersion,
        })
      }
    } else {
      if (publication?.building_version && publication.building_version !== artifactVersion) {
        throw new Error(
          `Cannot resume artifact build ${jobId}: publication building_version is ${publication.building_version}, expected ${artifactVersion}.`
        )
      }
      await beginGmailArtifactBuild({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        jobType: 'full_rebuild',
        phase: 'projecting_sender_scope',
        lastIndexStateUpdatedAt: indexState?.updated_at || null,
        lastIndexedMessageCount: coverage.indexed_total_rows,
        senderCheckpoint: checkpoint.cursor?.sender_key || null,
        messageCheckpoint: serializeGmailArtifactCheckpoint(checkpoint),
        clusterCheckpoint: serializeGmailArtifactFinalizeCheckpoint(finalizeCheckpoint),
      })
    }

    activePhase = 'projecting_sender_scope'
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'started',
      extra: {
        resumed: resume != null,
      },
    })

    let lastLoggedProjectionCount = normalizeCount(resume?.processedSenderCount)
    const projectionStartedAt = Date.now()
    const projection = await streamGmailSenderArtifactProjection({
      supabase: params.supabase,
      tenantId,
      analysisScope,
      artifactVersion,
      initialCheckpoint: checkpoint,
      referenceNowMs,
      publishedSeedRowsBySenderKey,
      onCheckpoint: async (progress) => {
        const totalProcessedSenderCount =
          normalizeCount(resume?.processedSenderCount) + progress.processed_sender_count
        const totalProcessedMessageCount =
          normalizeCount(resume?.processedMessageCount) + progress.processed_message_count
        const totalProcessedClusterCount = Math.max(
          normalizeCount(resume?.processedClusterCount),
          progress.matched_cluster_count
        )
        await updateGmailArtifactBuildProgress({
          supabase: params.supabase,
          jobId: activeJobId,
          tenantId,
          analysisScope,
          artifactVersion: activeArtifactVersion,
          phase: 'projecting_sender_scope',
          senderCheckpoint: progress.last_cursor?.sender_key || null,
          messageCheckpoint: serializeGmailArtifactCheckpoint(progress.checkpoint),
          processedSenderCount: totalProcessedSenderCount,
          processedMessageCount: totalProcessedMessageCount,
          processedClusterCount: totalProcessedClusterCount,
        })
        if (
          totalProcessedSenderCount === 0 ||
          totalProcessedSenderCount - lastLoggedProjectionCount < FULL_BUILD_PROGRESS_LOG_INTERVAL
        ) {
          return
        }
        lastLoggedProjectionCount = totalProcessedSenderCount
        console.info(
          `[integrations/gmail/full-mailbox-artifact-build-progress] ${JSON.stringify({
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: activeArtifactVersion,
            job_id: activeJobId,
            attempt: params.attempt,
            phase: 'projecting_sender_scope',
            processed_sender_count: totalProcessedSenderCount,
            processed_message_count: totalProcessedMessageCount,
            processed_cluster_count: totalProcessedClusterCount,
            last_cursor: progress.last_cursor,
          })}`
        )
      },
    })
    const projectionMs = Math.max(0, Date.now() - projectionStartedAt)

    const totalProcessedSenderCount =
      normalizeCount(resume?.processedSenderCount) + projection.processed_sender_count
    const totalProcessedMessageCount =
      normalizeCount(resume?.processedMessageCount) + projection.processed_message_count
    const totalProcessedClusterCount = Math.max(
      normalizeCount(resume?.processedClusterCount),
      projection.matched_cluster_count
    )
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'completed',
      durationMs: projectionMs,
      extra: {
        processed_sender_count: totalProcessedSenderCount,
        processed_message_count: totalProcessedMessageCount,
        processed_cluster_count: totalProcessedClusterCount,
      },
    })

    activePhase = 'finalizing_artifacts'
    const finalizeAlreadyCompleted = isGmailArtifactFinalizeCompleted(finalizeCheckpoint)
    await updateGmailArtifactBuildProgress({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      phase: finalizeAlreadyCompleted
        ? 'publishing_artifacts'
        : 'finalizing_artifacts/loading_finalize_inputs',
      senderCheckpoint: projection.last_cursor?.sender_key || null,
      messageCheckpoint: serializeGmailArtifactCheckpoint(projection.checkpoint),
      clusterCheckpoint: serializeGmailArtifactFinalizeCheckpoint(finalizeCheckpoint),
      processedSenderCount: totalProcessedSenderCount,
      processedMessageCount: totalProcessedMessageCount,
      processedClusterCount: totalProcessedClusterCount,
    })

    let finalizeMs = 0
    let finalizedCheckpoint = finalizeCheckpoint
    if (finalizeAlreadyCompleted) {
      logFullBuildPhase({
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        phase: activePhase,
        event: 'skipped',
        extra: {
          reason: 'resume_checkpoint_already_completed_finalize',
        },
      })
    } else {
      logFullBuildPhase({
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        phase: activePhase,
        event: 'started',
      })
      const finalizeStartedAt = Date.now()
      const finalizeResult = await finalizeGmailFullMailboxArtifacts({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
        coverage,
        checkpoint: projection.checkpoint,
        initialFinalizeCheckpoint: finalizeCheckpoint,
        onProgress: async (progress) => {
          finalizedCheckpoint = progress.checkpoint
          await updateGmailArtifactBuildProgress({
            supabase: params.supabase,
            jobId: activeJobId,
            tenantId,
            analysisScope,
            artifactVersion: activeArtifactVersion,
            phase: `finalizing_artifacts/${progress.stage}`,
            senderCheckpoint: projection.last_cursor?.sender_key || null,
            messageCheckpoint: serializeGmailArtifactCheckpoint(projection.checkpoint),
            clusterCheckpoint: serializeGmailArtifactFinalizeCheckpoint(progress.checkpoint),
            processedSenderCount: totalProcessedSenderCount,
            processedMessageCount: totalProcessedMessageCount,
            processedClusterCount: totalProcessedClusterCount,
          })
          console.info(
            `[integrations/gmail/full-mailbox-artifact-build-progress] ${JSON.stringify({
              tenant_id: tenantId,
              analysis_scope: analysisScope,
              artifact_version: activeArtifactVersion,
              job_id: activeJobId,
              attempt: params.attempt,
              phase: `finalizing_artifacts/${progress.stage}`,
              processed_sender_count: totalProcessedSenderCount,
              processed_message_count: totalProcessedMessageCount,
              processed_cluster_count: totalProcessedClusterCount,
              finalize_input_row_counts: progress.checkpoint.input_row_counts,
              finalize_derived_row_counts: progress.checkpoint.derived_row_counts,
              completed_finalize_write_stages: progress.checkpoint.completed_write_stages,
            })}`
          )
        },
      })
      finalizeMs = Math.max(0, Date.now() - finalizeStartedAt)
      finalizedCheckpoint = finalizeResult.finalize_checkpoint
      logFullBuildPhase({
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        phase: activePhase,
        event: 'completed',
        durationMs: finalizeMs,
        extra: {
          row_counts: finalizeResult.row_counts,
          completed_finalize_write_stages: finalizedCheckpoint.completed_write_stages,
        },
      })
    }

    activePhase = 'counting_rows'
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'started',
    })
    const rowCountStartedAt = Date.now()
    let rowCounts: Record<string, number> = {}
    let rowCountError: string | null = null
    try {
      rowCounts = await countGmailArtifactVersionRows({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
      })
    } catch (error) {
      rowCountError = stringifyBuildError(error)
    }
    const rowCountMs = Math.max(0, Date.now() - rowCountStartedAt)
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'completed',
      durationMs: rowCountMs,
      extra: {
        row_count_error: rowCountError,
        row_counts: rowCounts,
      },
    })

    activePhase = 'publishing_artifacts'
    await updateGmailArtifactBuildProgress({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      phase: activePhase,
      senderCheckpoint: projection.last_cursor?.sender_key || null,
      messageCheckpoint: serializeGmailArtifactCheckpoint(projection.checkpoint),
      clusterCheckpoint: serializeGmailArtifactFinalizeCheckpoint(finalizedCheckpoint),
      processedSenderCount: totalProcessedSenderCount,
      processedMessageCount: totalProcessedMessageCount,
      processedClusterCount: totalProcessedClusterCount,
    })
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'started',
      extra: {
        published_version_before: publication?.published_version ?? null,
      },
    })
    maybeInjectRetryableFailure({
      phase: activePhase,
      artifactVersion,
      jobId,
    })
    const publishStartedAt = Date.now()
    await publishGmailArtifactBuild({
      supabase: params.supabase,
      jobId,
      tenantId,
      analysisScope,
      artifactVersion,
      lastIndexStateUpdatedAt: indexState?.updated_at || null,
      lastIndexedMessageCount: coverage.indexed_total_rows,
      processedSenderCount: totalProcessedSenderCount,
      processedMessageCount: totalProcessedMessageCount,
      processedClusterCount: totalProcessedClusterCount,
    })
    const publishMs = Math.max(0, Date.now() - publishStartedAt)
    logFullBuildPhase({
      tenantId,
      analysisScope,
      artifactVersion,
      jobId,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      phase: activePhase,
      event: 'completed',
      durationMs: publishMs,
      extra: {
        published_version_after: artifactVersion,
      },
    })

    console.info(
      `[integrations/gmail/full-mailbox-artifact-build] ${JSON.stringify({
        tenant_id: tenantId,
        analysis_scope: analysisScope,
        artifact_version: artifactVersion,
        job_id: jobId,
        attempt: params.attempt,
        max_attempts: params.maxAttempts,
        resumed: resume != null,
        processed_sender_count: totalProcessedSenderCount,
        processed_message_count: totalProcessedMessageCount,
        matched_cluster_count: totalProcessedClusterCount,
        indexed_corpus_size: coverage.indexed_total_rows,
        row_counts: rowCounts,
        row_count_error: rowCountError,
        timing_ms: {
          inputs_load: inputLoadMs,
          projection: projectionMs,
          finalize: finalizeMs,
          row_count: rowCountMs,
          publish: publishMs,
          total: Math.max(0, Date.now() - buildStartedAt),
        },
      })}`
    )

    return {
      ok: true,
      tenant_id: tenantId,
      analysis_scope: analysisScope,
      artifact_version: artifactVersion,
      job_id: jobId,
      resumed: resume != null,
      processed_sender_count: totalProcessedSenderCount,
      processed_message_count: totalProcessedMessageCount,
      processed_cluster_count: totalProcessedClusterCount,
      indexed_corpus_size: coverage.indexed_total_rows,
      row_counts: rowCounts,
    }
  } catch (error) {
    throw createAttemptError({
      error,
      artifactVersion,
      jobId,
      phase: activePhase,
    })
  }
}

export async function runGmailFullMailboxArtifactBuild(params: {
  supabase: SupabaseClient
  tenantId: string
  analysisScope?: GmailArtifactAnalysisScope
  artifactVersion?: string | null
  jobId?: string | null
  resumeJobId?: string | null
}): Promise<GmailFullMailboxArtifactBuildResult> {
  const tenantId = normalizeText(params.tenantId)
  const analysisScope = params.analysisScope || 'all_indexed'
  if (!tenantId) {
    throw new Error('tenantId is required for full mailbox artifact builds.')
  }

  let resumeJobId = normalizeText(params.resumeJobId) || null
  let artifactVersion = normalizeText(params.artifactVersion) || null
  let jobId = normalizeText(params.jobId) || null
  let lastError: GmailFullMailboxBuildAttemptError | null = null

  for (let attempt = 1; attempt <= FULL_BUILD_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await runGmailFullMailboxArtifactBuildAttempt({
        supabase: params.supabase,
        tenantId,
        analysisScope,
        artifactVersion,
        jobId,
        resumeJobId,
        attempt,
        maxAttempts: FULL_BUILD_RETRY_ATTEMPTS,
      })
      if (attempt > 1) {
        console.info(
          `[integrations/gmail/full-mailbox-artifact-build-recovery] ${JSON.stringify({
            tenant_id: tenantId,
            analysis_scope: analysisScope,
            artifact_version: result.artifact_version,
            job_id: result.job_id,
            recovered_after_attempts: attempt,
            max_attempts: FULL_BUILD_RETRY_ATTEMPTS,
          })}`
        )
      }
      return result
    } catch (error) {
      const attemptError = coerceAttemptError(error)
      lastError = attemptError
      artifactVersion = normalizeText(attemptError.artifactVersion) || artifactVersion
      jobId = normalizeText(attemptError.jobId) || jobId
      const canRetry =
        attempt < FULL_BUILD_RETRY_ATTEMPTS &&
        attemptError.retriable &&
        (jobId != null || resumeJobId != null)

      let jobSnapshot = null as Awaited<ReturnType<typeof loadGmailArtifactJobState>> | null
      if (jobId) {
        try {
          jobSnapshot = await loadGmailArtifactJobState({
            supabase: params.supabase,
            jobId,
          })
        } catch {
          jobSnapshot = null
        }
      }

      if (!canRetry) {
        if (jobId && artifactVersion) {
          await failGmailArtifactBuild({
            supabase: params.supabase,
            jobId,
            tenantId,
            analysisScope,
            artifactVersion,
            error: attemptError.cause,
            phase: attemptError.phase || 'full_mailbox_build_failed',
          })
        }
        throw attemptError.cause instanceof Error ? attemptError.cause : attemptError
      }

      console.warn(
        `[integrations/gmail/full-mailbox-artifact-build-retry] ${JSON.stringify({
          tenant_id: tenantId,
          analysis_scope: analysisScope,
          artifact_version: artifactVersion,
          job_id: jobId,
          attempt,
          max_attempts: FULL_BUILD_RETRY_ATTEMPTS,
          next_attempt: attempt + 1,
          phase: attemptError.phase,
          error: attemptError.message,
          processed_sender_count: jobSnapshot?.processed_sender_count ?? null,
          processed_message_count: jobSnapshot?.processed_message_count ?? null,
          processed_cluster_count: jobSnapshot?.processed_cluster_count ?? null,
          cluster_checkpoint: jobSnapshot?.cluster_checkpoint ?? null,
        })}`
      )

      if (jobId && artifactVersion) {
        try {
          await updateGmailArtifactBuildProgress({
            supabase: params.supabase,
            jobId,
            tenantId,
            analysisScope,
            artifactVersion,
            phase: `retry_scheduled/${attemptError.phase}`,
            senderCheckpoint: jobSnapshot?.sender_checkpoint ?? undefined,
            messageCheckpoint: jobSnapshot?.message_checkpoint ?? undefined,
            clusterCheckpoint: jobSnapshot?.cluster_checkpoint ?? undefined,
            processedSenderCount: jobSnapshot?.processed_sender_count ?? undefined,
            processedMessageCount: jobSnapshot?.processed_message_count ?? undefined,
            processedClusterCount: jobSnapshot?.processed_cluster_count ?? undefined,
          })
        } catch {
          // Best-effort observability only.
        }
      }

      resumeJobId = jobId || resumeJobId
      await sleep(FULL_BUILD_RETRY_DELAY_MS * attempt)
    }
  }

  throw lastError?.cause instanceof Error ? lastError.cause : lastError ?? new Error('Full build failed.')
}
