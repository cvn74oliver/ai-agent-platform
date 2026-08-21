'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import {
  gmailCleanupWorkflowDraftHasActiveContent,
  readGmailCleanupWorkflowDraft,
  readCachedGmailMailboxIntelligence,
  readLatestCachedGmailMailboxIntelligence,
  type GmailCleanupClusterRef,
  type GmailMailboxIntelligenceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  buildCleanupGroupPublishedReviewUnits,
  buildCleanupGroupInternalStructure,
  buildCleanupGroupIntentSnapshotsForUi,
  buildCleanupGroupSectionSummariesForUi,
  buildCleanupGroupSectionsForUi,
  getCleanupGroupSection,
  getCleanupGroupLaneLabel,
  getCleanupGroupSurfaceKind,
  getCleanupGroupSurfaceTier,
  isCleanupGroupSurfacedInUi,
  type CleanupGroupRecommendationReason,
  type CleanupGroupSurfaceKind,
  getCleanupGroupStartWith,
  getCleanupGroupWhyExists,
  recommendCleanupGroupPublishedReviewUnit,
  recommendCleanupGroupForUi,
} from '@/lib/runtime/cleanupGroupPresentation'
import { buildGmailSemanticPresentationPolicy } from '@/lib/runtime/gmailSemanticPresentationPolicy'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'

const MARKETING_PARENT_CANONICAL_ID = 'semantic.marketing_subscriptions'

function normalizedCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return Math.round(value)
}

function messageShareLabel(sharePct: number | null | undefined, messageCount: number | null): string {
  if (sharePct == null || !Number.isFinite(sharePct)) {
    return messageCount != null
      ? 'Message volume from the current cleanup snapshot.'
      : 'Impact details will appear once cleanup counts finish loading.'
  }
  if (sharePct <= 0 && (messageCount || 0) > 0) return '<1% of cleanup message volume'
  return `${Math.round(sharePct)}% of cleanup message volume`
}

function formatCountLabel(value: number | null | undefined, emptyLabel = '—'): string {
  if (value == null || !Number.isFinite(value)) return emptyLabel
  return Math.round(value).toLocaleString()
}

function cleanupGroupSectionMeaning(sectionId: string): string {
  if (sectionId === 'action') {
    return 'Primary workflow lane. This is the default place to begin when artifact truth supports a strong semantic parent.'
  }
  if (sectionId === 'backlog') {
    return 'Backlog lane for deliberate backlog reduction, not the default first move.'
  }
  if (sectionId === 'coverage') {
    return 'Coverage lanes stay visible for caution and completeness, not as the default place to start.'
  }
  if (sectionId === 'secondary') {
    return 'Secondary groups are optional exploration only and do not enter the primary decision flow.'
  }
  return 'Context stays available for completeness, but it remains collapsed and behaviorally demoted.'
}

function cleanupGroupNextStepInstruction(
  reason: CleanupGroupRecommendationReason,
  groupTitle: string | null
): string {
  if (reason === 'resume_work') {
    return groupTitle
      ? `Next step: resume ${groupTitle}.`
      : 'Next step: resume saved work in Sender Overview.'
  }
  if (reason === 'small_quick_win') {
    return groupTitle
      ? `Next step: start with ${groupTitle}.`
      : 'Next step: start with the quickest primary action lane in Sender Overview.'
  }
  if (reason === 'high_impact_manageable') {
    return groupTitle
      ? `Next step: open ${groupTitle} next.`
      : 'Next step: open the biggest manageable primary action lane in Sender Overview.'
  }
  if (reason === 'backlog') {
    return groupTitle
      ? `Next step: work ${groupTitle} next.`
      : 'Next step: work the backlog lane in Sender Overview.'
  }
  return 'Next step: compare the group sections below, then open Sender Overview.'
}

function buildDerivedReviewUnitHref(params: {
  agentId: string
  query: string
  clusterId: string
  unitId: string
}): string {
  return `/agents/${params.agentId}/operations/review${params.query}${params.query ? '&' : '?'}cluster_id=${encodeURIComponent(
    params.clusterId
  )}&subset_source=review_unit&subset_value=${encodeURIComponent(params.unitId)}`
}

function buildCleanupGroupFocusHref(params: {
  agentId: string
  query: string
  focusClusterId: string
}): string {
  const search = new URLSearchParams(params.query)
  search.set('focus_cluster', params.focusClusterId)
  const query = search.toString()
  return `/agents/${params.agentId}/operations/clusters${query ? `?${query}` : ''}#cleanup-group-cards`
}

function isMarketingCleanupGroup(canonicalClusterId: string | null | undefined): boolean {
  return canonicalClusterId === MARKETING_PARENT_CANONICAL_ID
}

function buildRenderableReviewUnits<T extends { senderCount: number; targetState: string }>(
  reviewUnits: T[]
): T[] {
  return reviewUnits.filter((unit) => unit.senderCount > 0 && unit.targetState !== 'oversized')
}

function cleanupGroupSurfaceRoleLabel(kind: CleanupGroupSurfaceKind): string {
  if (kind === 'semantic_parent') return 'Semantic parent'
  if (kind === 'backlog_parent') return 'Backlog parent'
  if (kind === 'structural_parent') return 'Structural lane'
  if (kind === 'historical_parent') return 'Historical coverage lane'
  return 'Secondary artifact group'
}

function cleanupGroupSurfaceRoleDetail(kind: CleanupGroupSurfaceKind): string {
  if (kind === 'semantic_parent') {
    return 'This parent earns direct top-level status because the current artifact shows one coherent semantic story.'
  }
  if (kind === 'backlog_parent') {
    return 'This parent stays top-level because backlog age is the real organizing frame, not one semantic category.'
  }
  if (kind === 'structural_parent') {
    return 'This parent stays top-level for safety or coverage, while internal review units only narrow work inside the lane.'
  }
  if (kind === 'historical_parent') {
    return 'This coverage lane stays visible for completeness, but it is reduced on purpose and not framed like a normal cleanup start.'
  }
  return 'This artifact group still exists and can be opened, but it is no longer surfaced as an equal-weight top-level parent in this pass.'
}

export default function OperationsClustersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const focusCluster = searchParams.get('focus_cluster')
  const [workflowProgress, setWorkflowProgress] = useState<{
    latestClusterId: string | null
    startedGroupCount: number
    startedClusterIds: string[]
  }>({
    latestClusterId: null,
    startedGroupCount: 0,
    startedClusterIds: [],
  })
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)
  const cacheVersion = runtime.data?.runtime_cleanup_plan?.generated_at || null
  const clusters = useMemo<GmailCleanupClusterRef[]>(
    () =>
      (runtime.data?.runtime_cleanup_plan?.clusters || []).map((cluster) => ({
        clusterId: cluster.cluster_id,
        canonicalClusterId: cluster.canonical_cluster_id,
        legacyClusterIds: cluster.legacy_cluster_ids || [],
        clusterType: cluster.cluster_type,
        title: cluster.title,
        query: cluster.query,
        whySelected: cluster.why_selected,
        riskNote: cluster.risk_note,
        safetyNote: cluster.safety_note,
        senderCount: cluster.sender_count,
        messageCount: cluster.message_count,
        estimatedCount: cluster.estimated_count,
        surfaceTier: cluster.surface_tier || null,
        surfaceKind: cluster.surface_kind || null,
        surfaceVisibility: cluster.surface_visibility || null,
        topLevelRank: cluster.top_level_rank ?? null,
      })),
    [runtime.data?.runtime_cleanup_plan?.clusters]
  )
  const cachedIntelligence = useMemo(
    () =>
      clusters.length > 0
        ? readCachedGmailMailboxIntelligence({
            clusters,
            analysisScope: runtime.analysisScope,
            cacheVersion,
          })
        : null,
    [cacheVersion, clusters, runtime.analysisScope]
  )
  const latestStableIntelligence = useMemo(
    () =>
      clusters.length > 0
        ? readLatestCachedGmailMailboxIntelligence({
            clusters,
            analysisScope: runtime.analysisScope,
          })
        : null,
    [clusters, runtime.analysisScope]
  )
  const trustedRuntimeIntelligence = useMemo<GmailMailboxIntelligenceData | null>(() => {
    const runtimeIntelligence = runtime.data?.runtime_mailbox_intelligence
    if (!runtimeIntelligence || clusters.length === 0) return null
    if (runtimeIntelligence.analysis_scope !== runtime.analysisScope) return null
    if (runtimeIntelligence.source !== 'gmail_index_cache') return null
    return runtimeIntelligence
  }, [clusters.length, runtime.analysisScope, runtime.data?.runtime_mailbox_intelligence])
  const resolvedIntelligence = cachedIntelligence || trustedRuntimeIntelligence || latestStableIntelligence
  const fallbackGroupCards = useMemo(
    () =>
      clusters.map((cluster) => ({
        cluster_id: cluster.clusterId,
        cluster_type: cluster.clusterType,
        title: cluster.title,
        query: cluster.query,
        why_selected: cluster.whySelected || 'Grouped by the current cleanup plan.',
        risk_note: cluster.riskNote || 'Review mixed senders carefully before approving bulk archive.',
        safety_note:
          cluster.safetyNote || 'Sender-first review protects safe traffic while you inspect this group.',
        sender_count:
          typeof cluster.senderCount === 'number' && Number.isFinite(cluster.senderCount)
            ? Math.max(0, Math.round(cluster.senderCount))
            : null,
        message_count:
          typeof cluster.messageCount === 'number' && Number.isFinite(cluster.messageCount)
            ? Math.max(0, Math.round(cluster.messageCount))
            : null,
        estimated_count:
          typeof cluster.estimatedCount === 'number' && Number.isFinite(cluster.estimatedCount)
            ? Math.max(0, Math.round(cluster.estimatedCount))
            : null,
      })),
    [clusters]
  )
  const renderedGroups = useMemo(
    () =>
      (resolvedIntelligence?.cleanup_groups || fallbackGroupCards)
        .map((group) => {
          const semanticPresentation = buildGmailSemanticPresentationPolicy(
            'semantic_rollup' in group ? group.semantic_rollup : null
          ).cleanupGroupCard
          const internalStructure = buildCleanupGroupInternalStructure(
            group.cluster_id,
            'semantic_rollup' in group ? group.semantic_rollup : null
          )
          const reviewUnits = buildCleanupGroupPublishedReviewUnits(
            group.cluster_id,
            'semantic_rollup' in group ? group.semantic_rollup : null
          )
          const recommendedReviewUnit = recommendCleanupGroupPublishedReviewUnit(reviewUnits)
          const section = getCleanupGroupSection(group.cluster_id)

          return {
            clusterId: group.cluster_id,
            title: group.title,
            canonicalClusterId:
              'canonical_cluster_id' in group ? group.canonical_cluster_id : group.cluster_id,
            legacyClusterIds:
              'legacy_cluster_ids' in group && Array.isArray(group.legacy_cluster_ids)
                ? group.legacy_cluster_ids
                : [],
            sectionId: section.id,
            surfaceTier: getCleanupGroupSurfaceTier(group.cluster_id),
            surfaceKind: getCleanupGroupSurfaceKind(group.cluster_id),
            senderCount: normalizedCount(group.sender_count),
            messageCount: normalizedCount(group.message_count),
            sharePct: 'share_pct' in group ? group.share_pct : null,
            whyExists: getCleanupGroupWhyExists(group.cluster_id),
            laneLabel: getCleanupGroupLaneLabel(group.cluster_id),
            startWith: getCleanupGroupStartWith(group.cluster_id),
            whySelected: group.why_selected,
            riskNote: group.risk_note,
            safetyNote: group.safety_note,
            dominantSender: 'dominant_sender' in group ? group.dominant_sender : null,
            dominantPattern: 'dominant_pattern' in group ? group.dominant_pattern : null,
            protectedMessageCount:
              'protected_message_count' in group
                ? normalizedCount(group.protected_message_count)
                : null,
            uncertainSenderCount:
              'uncertain_sender_count' in group
                ? normalizedCount(group.uncertain_sender_count)
                : null,
            semanticContextLabel: semanticPresentation.contextLabel,
            semanticHeadline: semanticPresentation.headline,
            semanticSupport: semanticPresentation.support,
            semanticSupplement: semanticPresentation.semanticSupport,
            internalStructure,
            reviewUnits,
            recommendedReviewUnit,
          }
        })
        .filter((group) => isCleanupGroupSurfacedInUi(group.clusterId)),
    [fallbackGroupCards, resolvedIntelligence?.cleanup_groups]
  )
  const primaryDecisionGroups = useMemo(
    () => renderedGroups.filter((group) => group.sectionId !== 'secondary' && group.sectionId !== 'context'),
    [renderedGroups]
  )
  const secondaryGroups = useMemo(
    () => renderedGroups.filter((group) => group.sectionId === 'secondary'),
    [renderedGroups]
  )
  const contextGroups = useMemo(
    () => renderedGroups.filter((group) => group.sectionId === 'context'),
    [renderedGroups]
  )
  const optionalGroups = useMemo(
    () => renderedGroups.filter((group) => group.sectionId === 'secondary' || group.sectionId === 'context'),
    [renderedGroups]
  )
  const groupedSections = useMemo(
    () => buildCleanupGroupSectionsForUi(renderedGroups, (group) => group.clusterId),
    [renderedGroups]
  )
  const sectionSummaries = useMemo(
    () =>
      buildCleanupGroupSectionSummariesForUi({
        groups: primaryDecisionGroups,
        getClusterId: (group) => group.clusterId,
        getSenderCount: (group) => group.senderCount,
        getImpactCount: (group) => group.messageCount,
      }),
    [primaryDecisionGroups]
  )
  const intentSnapshots = useMemo(
    () =>
      buildCleanupGroupIntentSnapshotsForUi({
        groups: renderedGroups,
        getClusterId: (group) => group.clusterId,
        getSenderCount: (group) => group.senderCount,
        getImpactCount: (group) => group.messageCount,
      }),
    [renderedGroups]
  )
  const latestStartedGroup = useMemo(
    () =>
      workflowProgress.latestClusterId
        ? renderedGroups.find((group) => group.clusterId === workflowProgress.latestClusterId) || null
        : null,
    [renderedGroups, workflowProgress.latestClusterId]
  )
  const recommendation = useMemo(
    () => {
      if (latestStartedGroup) {
        return {
          group: latestStartedGroup,
          reason: 'resume_work' as const,
        }
      }
      return recommendCleanupGroupForUi({
        groups: renderedGroups,
        latestClusterId: null,
        getClusterId: (group) => group.clusterId,
        getSenderCount: (group) => group.senderCount,
        getImpactCount: (group) => group.messageCount,
      })
    },
    [latestStartedGroup, renderedGroups]
  )
  const startedClusterIdSet = useMemo(
    () => new Set(workflowProgress.startedClusterIds),
    [workflowProgress.startedClusterIds]
  )
  const mainParentCount = primaryDecisionGroups.length
  const optionalGroupCount = optionalGroups.length
  const secondaryGroupCount = secondaryGroups.length
  const contextGroupCount = contextGroups.length
  const parentLanesWithSavedWorkCount = primaryDecisionGroups.filter((group) =>
    startedClusterIdSet.has(group.clusterId)
  ).length
  const parentLanesStillToReviewCount = Math.max(
    mainParentCount - parentLanesWithSavedWorkCount,
    0
  )
  const optionalGroupsWithSavedWorkCount = optionalGroups.filter((group) =>
    startedClusterIdSet.has(group.clusterId)
  ).length
  const cleanupScopeSenderCount = useMemo(() => {
    const groupedSenderScope = renderedGroups.reduce((total, group) => total + (group.senderCount ?? 0), 0)
    if (groupedSenderScope > 0) return groupedSenderScope

    const resolvedWholeMailboxSenderCount = normalizedCount(resolvedIntelligence?.whole_mailbox?.sender_count)
    if (resolvedWholeMailboxSenderCount != null) return resolvedWholeMailboxSenderCount

    return normalizedCount(resolvedIntelligence?.cleanup_candidate_universe?.sender_count) ?? 0
  }, [
    renderedGroups,
    resolvedIntelligence?.cleanup_candidate_universe?.sender_count,
    resolvedIntelligence?.whole_mailbox?.sender_count,
  ])
  const groupCoveragePct =
    mainParentCount > 0 ? (parentLanesWithSavedWorkCount / mainParentCount) * 100 : 0
  const recommendedGroup = recommendation.group
  const nextStepInstruction = useMemo(
    () => cleanupGroupNextStepInstruction(recommendation.reason, recommendedGroup?.title || null),
    [recommendation.reason, recommendedGroup?.title]
  )
  const recommendedClusterId = recommendation.group?.clusterId || null
  const focusedClusterId = focusCluster || null

  useEffect(() => {
    if (typeof window === 'undefined' || !agentId) return
    if (clusters.length === 0) return

    const syncLatestWorkflowCluster = () => {
      let startedGroupCount = 0
      let latestClusterId: string | null = null
      let latestUpdatedAt = 0
      const startedClusterIds: string[] = []

      for (const cluster of clusters) {
        const draft = readGmailCleanupWorkflowDraft({
          agentId,
          sessionId: runtime.sessionId || requestedSessionId || null,
          clusterId: cluster.clusterId,
          canonicalClusterId: cluster.canonicalClusterId,
          legacyClusterIds: cluster.legacyClusterIds,
          snapshotVersion: cacheVersion,
        })
        if (!gmailCleanupWorkflowDraftHasActiveContent(draft)) continue
        startedGroupCount += 1
        startedClusterIds.push(cluster.clusterId)
        if (draft.updatedAt >= latestUpdatedAt) {
          latestUpdatedAt = draft.updatedAt
          latestClusterId = cluster.clusterId
        }
      }

      setWorkflowProgress({
        latestClusterId,
        startedGroupCount,
        startedClusterIds,
      })
    }

    syncLatestWorkflowCluster()
    window.addEventListener('storage', syncLatestWorkflowCluster)
    window.addEventListener('focus', syncLatestWorkflowCluster)
    return () => {
      window.removeEventListener('storage', syncLatestWorkflowCluster)
      window.removeEventListener('focus', syncLatestWorkflowCluster)
    }
  }, [agentId, cacheVersion, clusters, requestedSessionId, runtime.sessionId])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-4 text-sm text-gray-300">
        Loading Cleanup Groups…
      </section>
    )
  }

  if (runtime.error && !runtime.data) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {runtime.error}
      </section>
    )
  }

  if (clusters.length === 0) {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-4 text-sm text-gray-300">
        No cleanup groups are available yet. Refresh cleanup analysis from Mailbox Intelligence first.
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Cleanup Groups</p>
            <h1 className="text-2xl font-semibold text-white">Choose the parent lane to review next</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Cleanup Groups now renders a lane-first view from the current artifact: Action, Backlog,
              and Coverage stay open by default, while Secondary and Context remain collapsed for
              optional exploration only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/agents/${agentId}/operations/intelligence${query}`}
              className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
            >
              Back to intelligence
            </Link>
            {recommendedGroup && !isMarketingCleanupGroup(recommendedGroup.canonicalClusterId) ? (
              <Link
                href={`/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(recommendedGroup.clusterId)}`}
                className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
              >
                Open sender overview
              </Link>
            ) : recommendedGroup ? (
              <Link
                href={buildCleanupGroupFocusHref({
                  agentId,
                  query,
                  focusClusterId: recommendedGroup.clusterId,
                })}
                className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
              >
                Choose a Marketing unit
              </Link>
            ) : (
              <a
                href="#cleanup-group-cards"
                className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
              >
                Jump to group sections
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Expanded decision lanes
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(mainParentCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              Action, Backlog, and Coverage stay open as the primary workflow lanes.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Collapsed optional lanes
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(optionalGroupCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {formatCountLabel(secondaryGroupCount)} secondary lane{secondaryGroupCount === 1 ? '' : 's'} and{' '}
              {formatCountLabel(contextGroupCount)} context lane{contextGroupCount === 1 ? '' : 's'} stay
              available below without entering the primary decision flow.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Decision lanes with saved work
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(parentLanesWithSavedWorkCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {formatCountLabel(parentLanesStillToReviewCount)} parent lanes still need a first pass.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Senders in cleanup scope
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(cleanupScopeSenderCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">Total sender scope here.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-700/45 bg-[linear-gradient(180deg,rgba(13,74,57,0.30),rgba(12,48,66,0.24),rgba(9,15,23,0.96))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.28)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                Decision-lane selection goal
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                Give every expanded decision lane a first pass.
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Coverage here is measured against the open Action, Backlog, and Coverage lanes.
                Secondary and Context remain available below, but they stay visually and behaviorally demoted.
              </p>
            </div>
            <div className="app-surface-card-nested rounded-2xl border border-emerald-600/45 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                Decision lanes started
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatCountLabel(parentLanesWithSavedWorkCount)} / {formatCountLabel(mainParentCount)}
              </p>
              <p className="mt-1 text-xs text-slate-200">
                {formatCountLabel(parentLanesStillToReviewCount)} parent lanes still need a first pass
              </p>
            </div>
          </div>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-gray-900/90 ring-1 ring-emerald-700/30">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, groupCoveragePct))}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <span>
              {formatCountLabel(parentLanesWithSavedWorkCount)} decision lanes started ·{' '}
              {formatCountLabel(parentLanesStillToReviewCount)} decision lanes still need a first pass
            </span>
            <span className="text-slate-300">
              {nextStepInstruction}
            </span>
          </div>
          {optionalGroupsWithSavedWorkCount > 0 ? (
            <p className="mt-3 text-xs leading-5 text-slate-300">
              {formatCountLabel(optionalGroupsWithSavedWorkCount)} optional lane
              {optionalGroupsWithSavedWorkCount === 1 ? '' : 's'} already have saved work and can
              still be reopened below when needed.
            </p>
          ) : null}
        </div>
      </section>

      {!resolvedIntelligence ? (
        <section className="app-surface-card rounded-2xl p-4 text-sm text-slate-200">
          <p className="font-medium text-white">Rendering from the current runtime cleanup snapshot</p>
          <p className="mt-2 leading-6 text-slate-200">
            Initial page-load live mailbox intelligence stays disabled for safety. Cleanup Groups is
            using the current runtime cleanup plan until cached mailbox intelligence is available.
          </p>
        </section>
      ) : null}

      <section className="app-surface-card-inset rounded-2xl p-3 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Choose by intent</p>
          <p className="mt-1 text-sm text-slate-200">
            Use a shortcut if you do not want to scan every expanded decision lane first.
          </p>
        </div>
        <div className="grid gap-2 xl:grid-cols-3">
          {intentSnapshots.map((snapshot) => {
            const snapshotGroup = snapshot.group
            const snapshotHref = snapshotGroup
              ? isMarketingCleanupGroup(snapshotGroup.canonicalClusterId)
                ? buildCleanupGroupFocusHref({
                    agentId,
                    query,
                    focusClusterId: snapshotGroup.clusterId,
                  })
                : `/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(snapshotGroup.clusterId)}`
              : null
            const snapshotContent = (
              <>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">{snapshot.title}</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {snapshotGroup ? snapshotGroup.title : 'No matching group right now'}
                </p>
                <p className="mt-2 text-sm text-slate-200">{snapshot.description}</p>
                {snapshotGroup ? (
                  <>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-100">
                        {snapshotGroup.laneLabel}
                      </span>
                      <span className="rounded-full border border-cyan-900/45 bg-cyan-950/10 px-2.5 py-1 text-xs text-cyan-100">
                        {cleanupGroupSurfaceRoleLabel(snapshotGroup.surfaceKind)}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Workload</p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {formatCountLabel(snapshotGroup.senderCount)} senders
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Impact</p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {formatCountLabel(snapshotGroup.messageCount)} messages
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-gray-400">
                    This shortcut is not available in the current snapshot, so choose manually from the cards below.
                  </p>
                )}
              </>
            )

            if (snapshotHref) {
              return (
                <Link
                  key={snapshot.id}
                  href={snapshotHref}
                  className="rounded-xl border border-[var(--app-border-muted)] bg-[var(--app-surface-nested)] p-3 transition-colors hover:border-cyan-700/45 hover:text-white"
                >
                  {snapshotContent}
                </Link>
              )
            }

            return (
              <div
                key={snapshot.id}
                className="rounded-xl border border-[var(--app-border-muted)] bg-[var(--app-surface-nested)] p-3"
              >
                {snapshotContent}
              </div>
            )
          })}
        </div>
        <div className="border-t border-[var(--app-border-muted)] pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-300">
              Expanded-lane context: quick section-level guidance before you compare the surfaced cards.
            </p>
            <a
              href="#cleanup-group-cards"
              className="text-xs text-cyan-100 underline decoration-cyan-700/60 underline-offset-4 hover:text-cyan-50"
            >
              See sectioned cards
            </a>
          </div>
          <div className="mt-3 grid gap-2 xl:grid-cols-3">
            {sectionSummaries.map((section) => (
              <div key={section.id} className="rounded-xl border border-[var(--app-border-muted)] bg-[var(--app-surface-nested)] p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">{section.title}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {section.groupCount.toLocaleString()} parent{section.groupCount === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{cleanupGroupSectionMeaning(section.id)}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {section.totalSenderCount.toLocaleString()} senders ·{' '}
                  {section.totalImpactCount.toLocaleString()} messages
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cleanup-group-cards" className="app-surface-card rounded-2xl p-4 space-y-4">
        {groupedSections.map((section) => {
          const featuredLaneGroups = section.groups.filter((group) => group.surfaceTier === 'featured_parent')
          const collapsedLaneGroups = section.groups.filter((group) => group.surfaceTier === 'collapsed_parent')
          const demotedLaneGroups = section.groups.filter((group) => group.surfaceTier === 'secondary')

          const sectionContent = (
            <div className="space-y-4">
              {featuredLaneGroups.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {featuredLaneGroups.map((group) => {
                    const isFocused = focusedClusterId === group.clusterId
                    const isRecommended = recommendedClusterId === group.clusterId
                    const isMarketingParent = isMarketingCleanupGroup(group.canonicalClusterId)
                    const renderableReviewUnits = buildRenderableReviewUnits(group.reviewUnits)
                    const marketingUnitsReady =
                      isMarketingParent &&
                      renderableReviewUnits.length > 0 &&
                      renderableReviewUnits.length === group.reviewUnits.length &&
                      renderableReviewUnits.reduce((sum, unit) => sum + unit.senderCount, 0) ===
                        group.senderCount
                    const cardClassName = isFocused
                      ? 'border-cyan-700/60 bg-[linear-gradient(180deg,rgba(17,53,73,0.18),rgba(17,23,34,0.98))]'
                      : group.surfaceKind === 'semantic_parent'
                        ? 'border-cyan-700/35 bg-[linear-gradient(180deg,rgba(12,45,68,0.22),rgba(15,24,36,0.98))]'
                        : group.surfaceKind === 'backlog_parent'
                          ? 'border-amber-700/35 bg-[linear-gradient(180deg,rgba(69,42,12,0.20),rgba(18,22,31,0.98))]'
                          : isRecommended
                            ? 'border-cyan-900/45 bg-cyan-950/10'
                            : 'border-[var(--app-border-muted)] bg-[var(--app-surface-nested)]'

                    return (
                      <article key={group.clusterId} className={`rounded-2xl border p-4 ${cardClassName}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{group.title}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-300">
                              {cleanupGroupSurfaceRoleDetail(group.surfaceKind)}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            <span className="rounded-full border border-cyan-900/45 bg-cyan-950/10 px-2.5 py-1 text-xs text-cyan-100">
                              {cleanupGroupSurfaceRoleLabel(group.surfaceKind)}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-100">
                              {group.laneLabel}
                            </span>
                            {isRecommended ? (
                              <span className="rounded-full border border-cyan-700/60 bg-cyan-950/25 px-2.5 py-1 text-xs text-cyan-100">
                                Recommended next
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="app-surface-card-inset rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Workload</p>
                            <p className="mt-1 text-xl font-semibold text-white">
                              {group.senderCount != null ? group.senderCount.toLocaleString() : '—'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Sender count</p>
                          </div>
                          <div className="app-surface-card-inset rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">Impact</p>
                            <p className="mt-1 text-xl font-semibold text-white">
                              {group.messageCount != null ? group.messageCount.toLocaleString() : '—'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {messageShareLabel(group.sharePct, group.messageCount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="app-surface-card-inset rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">
                              Why this parent exists
                            </p>
                            <p className="mt-2 text-sm leading-6 text-gray-300">{group.whyExists}</p>
                          </div>
                          {isMarketingParent ? (
                            <div className="app-surface-card-inset rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                Choose unit
                              </p>
                              <p className="mt-2 text-sm leading-6 text-gray-200">
                                {marketingUnitsReady
                                  ? 'Start from a bounded published unit. Marketing subscriptions does not open as a broad parent from this root card.'
                                  : 'Published Marketing units are unavailable or do not reconcile to the parent, so review entry is paused.'}
                              </p>
                              {marketingUnitsReady ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  {renderableReviewUnits.map((unit) => (
                                    <Link
                                      key={unit.id}
                                      href={buildDerivedReviewUnitHref({
                                        agentId,
                                        query,
                                        clusterId: group.canonicalClusterId || group.clusterId,
                                        unitId: unit.id,
                                      })}
                                      className="rounded-xl border border-cyan-700/45 bg-cyan-950/15 p-3 text-left transition hover:border-cyan-600/70 hover:bg-cyan-950/20"
                                    >
                                      <p className="text-sm font-medium text-cyan-50">{unit.label}</p>
                                      <p className="mt-1 text-xs text-cyan-100/90">
                                        {unit.senderCount.toLocaleString()} senders
                                      </p>
                                      <p className="mt-1 text-[11px] text-cyan-200/80">
                                        {unit.groupSharePct}% of parent · {unit.targetLabel}
                                      </p>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-3 rounded-xl border border-amber-700/35 bg-amber-950/20 px-3 py-3 text-xs leading-5 text-amber-100">
                                  Review entry remains paused until all five published units are valid and reconcile exactly to the 857-sender parent.
                                </div>
                              )}
                            </div>
                          ) : null}
                          {group.startWith ? (
                            <div className="rounded-xl border border-cyan-900/45 bg-cyan-950/10 px-3 py-2 text-sm text-cyan-50">
                              <span className="font-medium text-cyan-100">Start with:</span>{' '}
                              {group.startWith}
                            </div>
                          ) : null}
                          <details className="app-surface-card-inset rounded-xl p-3">
                            <summary className="cursor-pointer list-none text-sm font-medium text-gray-200">
                              Supporting details
                            </summary>
                            <div className="mt-3 space-y-3 text-sm text-gray-300">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                  {group.semanticContextLabel}
                                </p>
                                <p className="mt-1 font-medium text-white">{group.semanticHeadline}</p>
                                <p className="mt-2 text-xs leading-5 text-gray-300">
                                  {group.semanticSupport}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-gray-400">
                                  {group.semanticSupplement}
                                </p>
                              </div>
                              <div className="space-y-2 text-xs leading-5 text-gray-300">
                                <p>Selection note: {group.whySelected}</p>
                                <p>Safety context: {group.safetyNote}</p>
                                <p>Review caution: {group.riskNote}</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                Dominant sender: {group.dominantSender || '—'} · dominant pattern:{' '}
                                {group.dominantPattern || '—'} · uncertain senders:{' '}
                                {group.uncertainSenderCount != null
                                  ? group.uncertainSenderCount.toLocaleString()
                                  : '—'}{' '}
                                · protected messages:{' '}
                                {group.protectedMessageCount != null
                                  ? group.protectedMessageCount.toLocaleString()
                                  : '—'}
                              </p>
                            </div>
                          </details>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {!isMarketingParent ? (
                            <Link
                              href={`/agents/${agentId}/operations/review${query}${
                                query ? '&' : '?'
                              }cluster_id=${encodeURIComponent(
                                group.canonicalClusterId || group.clusterId
                              )}`}
                              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
                            >
                              Open full group
                            </Link>
                          ) : null}
                          <Link
                            href={`/agents/${agentId}/operations/intelligence${query}`}
                            className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
                          >
                            Back to intelligence
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {collapsedLaneGroups.map((group) => {
                const isFocused = focusedClusterId === group.clusterId
                const isRecommended = recommendedClusterId === group.clusterId
                const clusterQuery = `${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(group.clusterId)}`
                const fullGroupHref = `/agents/${agentId}/operations/review${clusterQuery}`
                return (
                  <div
                    key={group.clusterId}
                    className={`rounded-2xl border px-4 py-4 ${
                      isFocused || isRecommended
                        ? 'border-cyan-700/45 bg-cyan-950/10'
                        : 'border-white/10 bg-[rgba(15,20,28,0.72)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-100">
                            {cleanupGroupSurfaceRoleLabel(group.surfaceKind)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-100">
                            {group.laneLabel}
                          </span>
                          {isRecommended ? (
                            <span className="rounded-full border border-cyan-700/60 bg-cyan-950/25 px-2.5 py-1 text-xs text-cyan-100">
                              Recommended next
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-base font-semibold text-white">{group.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {cleanupGroupSurfaceRoleDetail(group.surfaceKind)}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-300">{group.whyExists}</p>
                      </div>
                      <div className="flex min-w-[13rem] flex-col gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <p className="text-[10px] uppercase tracking-wide text-slate-300">Coverage</p>
                          <p className="mt-1 text-xl font-semibold text-white">
                            {formatCountLabel(group.senderCount)} senders
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatCountLabel(group.messageCount)} messages
                          </p>
                        </div>
                        <Link
                          href={fullGroupHref}
                          className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white"
                        >
                          Open coverage lane
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}

              {demotedLaneGroups.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  {demotedLaneGroups.map((group) => {
                    const isFocused = focusedClusterId === group.clusterId
                    const isRecommended = recommendedClusterId === group.clusterId
                    const hasSavedWork = startedClusterIdSet.has(group.clusterId)
                    const clusterQuery = `${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(group.clusterId)}`
                    const fullGroupHref = `/agents/${agentId}/operations/review${clusterQuery}`
                    return (
                      <article
                        key={group.clusterId}
                        className={`rounded-xl border p-3 ${
                          isFocused || isRecommended
                            ? 'border-cyan-700/45 bg-cyan-950/10'
                            : 'border-[var(--app-border-muted)] bg-[var(--app-surface-nested)]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{group.title}</p>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                            {cleanupGroupSurfaceRoleLabel(group.surfaceKind)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-300">
                          {cleanupGroupSurfaceRoleDetail(group.surfaceKind)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                            {formatCountLabel(group.senderCount)} senders
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                            {group.laneLabel}
                          </span>
                          {hasSavedWork ? (
                            <span className="rounded-full border border-emerald-700/45 bg-emerald-950/20 px-2 py-0.5 text-[11px] text-emerald-100">
                              Saved work
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={fullGroupHref}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-white"
                          >
                            Open group
                          </Link>
                          {group.reviewUnits.length > 0 && group.recommendedReviewUnit ? (
                            <Link
                              href={buildDerivedReviewUnitHref({
                                agentId,
                                query,
                                clusterId: group.clusterId,
                                unitId: group.recommendedReviewUnit.id,
                              })}
                              className="rounded-full border border-cyan-700/45 bg-cyan-950/10 px-3 py-1.5 text-xs text-cyan-100 hover:border-cyan-600/60 hover:text-white"
                            >
                              Review {group.recommendedReviewUnit.label}
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )

          const header = (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{section.title}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{section.title}</h2>
                <p className="mt-1 text-sm text-slate-200">{section.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!section.defaultExpanded ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                    Collapsed by default
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                  {section.groups.length.toLocaleString()} group{section.groups.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          )

          if (!section.defaultExpanded) {
            return (
              <details key={section.id} className="app-surface-card-inset rounded-2xl p-4">
                <summary className="cursor-pointer list-none">
                  {header}
                </summary>
                <div className="mt-4">{sectionContent}</div>
              </details>
            )
          }

          return (
            <section key={section.id} className="app-surface-card-inset rounded-2xl p-4 space-y-4">
              {header}
              {sectionContent}
            </section>
          )
        })}
      </section>
    </div>
  )
}
