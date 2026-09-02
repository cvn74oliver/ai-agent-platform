'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useDecisionWorkspaceRead } from '@/components/runtime/DecisionWorkspaceReadContext'
import { useDecisionWorkspacePresentation } from '@/components/runtime/DecisionWorkspacePresentationContext'
import { resolveDecisionWorkspacePresentationSlot } from '@/lib/runtime/decisionWorkspacePresentation'
import {
  type DecisionReviewGroupSurfaceKind,
  type DecisionReviewRecommendationReason,
  type DecisionReviewUnitReadModel,
} from '@/lib/runtime/decisionWorkspaceReadModel'

function messageShareLabel(sharePct: number | null | undefined, messageCount: number | null): string {
  if (sharePct == null || !Number.isFinite(sharePct)) {
    return messageCount != null
      ? 'Email volume in this group.'
      : 'Email totals will appear once the counts finish loading.'
  }
  if (sharePct <= 0 && (messageCount || 0) > 0) return '<1% of cleanup email volume'
  return `${Math.round(sharePct)}% of cleanup email volume`
}

function formatCountLabel(value: number | null | undefined, emptyLabel = '—'): string {
  if (value == null || !Number.isFinite(value)) return emptyLabel
  return Math.round(value).toLocaleString()
}

function cleanupGroupSectionMeaning(sectionId: string): string {
  if (sectionId === 'action') {
    return 'Begin here for the clearest, most useful first pass.'
  }
  if (sectionId === 'backlog') {
    return 'Work through older or repeatedly ignored items after the clearest groups.'
  }
  if (sectionId === 'coverage') {
    return 'Slow down here because the items are unclear, sensitive, or likely worth keeping.'
  }
  if (sectionId === 'secondary') {
    return 'Use these focused groups when they match your goal.'
  }
  return 'Reference information only; there is no review action.'
}

function cleanupGroupNextStepInstruction(
  reason: DecisionReviewRecommendationReason,
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
      : 'Next step: start with the clearest manageable group.'
  }
  if (reason === 'high_impact_manageable') {
    return groupTitle
      ? `Next step: open ${groupTitle} next.`
      : 'Next step: open the highest-impact manageable group.'
  }
  if (reason === 'backlog') {
    return groupTitle
      ? `Next step: work ${groupTitle} next.`
      : 'Next step: work through the older-items group.'
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

function buildRenderableReviewUnits(
  reviewUnits: readonly DecisionReviewUnitReadModel[]
): DecisionReviewUnitReadModel[] {
  return reviewUnits.filter((unit) => unit.subjectCount > 0)
}

const CLEANUP_GROUP_PRIMARY_CHOICE_LIMIT = 8
const CLEANUP_GROUP_TINY_SUBJECT_LIMIT = 5
const CLEANUP_GROUP_TINY_PARENT_SHARE_PCT = 1

type CleanupReviewUnitTiers = {
  primary: DecisionReviewUnitReadModel[]
  moreSpecific: DecisionReviewUnitReadModel[]
  specialHandling: DecisionReviewUnitReadModel[]
}

function cleanupReviewUnitNeedsSpecialHandling(unit: DecisionReviewUnitReadModel): boolean {
  if (unit.reasonKind != null) return true
  if (unit.semanticFamily === 'security_alert' || unit.semanticFamily === 'human_personal') {
    return true
  }
  const semanticIdentity = [
    unit.id,
    unit.label,
    unit.sourceKey,
    unit.semanticSubtype,
    ...unit.decompositionPath,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()
  return /\b(security|risk|fraud|scam|protected|trusted|compliance|identity|authentication|login|legal|medical|personal)\b/.test(
    semanticIdentity
  )
}

function buildCleanupReviewUnitTiers(
  reviewUnits: DecisionReviewUnitReadModel[]
): CleanupReviewUnitTiers {
  const primary: DecisionReviewUnitReadModel[] = []
  const moreSpecific: DecisionReviewUnitReadModel[] = []
  const specialHandling: DecisionReviewUnitReadModel[] = []
  const ordinary: DecisionReviewUnitReadModel[] = []

  for (const unit of reviewUnits) {
    const isTiny =
      unit.subjectCount < CLEANUP_GROUP_TINY_SUBJECT_LIMIT &&
      unit.groupSharePct < CLEANUP_GROUP_TINY_PARENT_SHARE_PCT
    if (isTiny && cleanupReviewUnitNeedsSpecialHandling(unit)) {
      specialHandling.push(unit)
    } else if (isTiny) {
      moreSpecific.push(unit)
    } else {
      ordinary.push(unit)
    }
  }

  ordinary.sort(
    (left, right) =>
      right.subjectCount - left.subjectCount ||
      right.groupSharePct - left.groupSharePct ||
      left.label.localeCompare(right.label)
  )
  primary.push(...ordinary.slice(0, CLEANUP_GROUP_PRIMARY_CHOICE_LIMIT))
  moreSpecific.push(...ordinary.slice(CLEANUP_GROUP_PRIMARY_CHOICE_LIMIT))

  if (primary.length === 0) {
    const promoted = moreSpecific.shift() ?? specialHandling.shift()
    if (promoted) primary.push(promoted)
  }

  return { primary, moreSpecific, specialHandling }
}

function CleanupReviewUnitChoice(props: {
  unit: DecisionReviewUnitReadModel
  reviewUnitsReady: boolean
  agentId: string
  query: string
  clusterId: string
  compact?: boolean
}) {
  const selectable = props.reviewUnitsReady && props.unit.manageabilityState !== 'oversized'
  const content = props.compact ? (
    <>
      {props.unit.label} · {props.unit.subjectCount.toLocaleString()} decision subjects
      {!selectable ? ' · paused' : ''}
    </>
  ) : (
    <>
      <p className="text-sm font-medium text-cyan-50">{props.unit.label}</p>
      <p className="mt-1 text-xs text-cyan-100/90">
        {props.unit.subjectCount.toLocaleString()} decision subjects
      </p>
      <p className="mt-1 text-[11px] text-cyan-200/80">
        {props.unit.groupSharePct}% of this group · {props.unit.manageabilityLabel}
      </p>
    </>
  )

  return selectable ? (
    <Link
      href={buildDerivedReviewUnitHref({
        agentId: props.agentId,
        query: props.query,
        clusterId: props.clusterId,
        unitId: props.unit.targetRoute.subsetValue,
      })}
      className={
        props.compact
          ? 'rounded-xl border border-cyan-700/45 bg-cyan-950/10 px-3 py-2 text-xs text-cyan-100 hover:border-cyan-600/60 hover:text-white'
          : 'rounded-xl border border-cyan-700/45 bg-cyan-950/15 p-3 text-left transition hover:border-cyan-600/70 hover:bg-cyan-950/20'
      }
    >
      {content}
    </Link>
  ) : (
    <div
      className={
        props.compact
          ? 'rounded-xl border border-amber-700/35 bg-amber-950/15 px-3 py-2 text-xs text-amber-100'
          : 'rounded-xl border border-amber-700/35 bg-amber-950/15 p-3 text-left'
      }
    >
      {content}
    </div>
  )
}

function actionableReviewUnitsReady(params: {
  parentSenderCount: number | null
  reviewUnits: readonly DecisionReviewUnitReadModel[]
  presentationErrors?: string[]
}): boolean {
  const normalizedLabels = params.reviewUnits.map((unit) => unit.label.trim().toLowerCase())
  return (
    (params.presentationErrors?.length || 0) === 0 &&
    params.parentSenderCount != null &&
    params.reviewUnits.length > 0 &&
    new Set(normalizedLabels).size === normalizedLabels.length &&
    params.reviewUnits.every(
      (unit) => unit.subjectCount > 0 && unit.manageabilityState !== 'oversized'
    ) &&
    params.reviewUnits.reduce((sum, unit) => sum + unit.subjectCount, 0) ===
      params.parentSenderCount
  )
}

function cleanupGroupDecisionValueDetail(params: {
  surfaceKind: DecisionReviewGroupSurfaceKind
  senderCount: number | null
  messageCount: number | null
  sharePct: number | null
}): string | null {
  if (params.surfaceKind !== 'semantic_parent') return null

  const senderDetail =
    params.senderCount == null ? 'a meaningful set of senders' : `${params.senderCount.toLocaleString()} senders`
  const messageDetail =
    params.messageCount == null ? 'a meaningful amount of email' : `${params.messageCount.toLocaleString()} emails`
  const impactDetail =
    params.sharePct == null || !Number.isFinite(params.sharePct)
      ? ''
      : `, representing ${Math.round(params.sharePct)}% of the cleanup email volume`

  return `Start here because ${senderDetail} account for ${messageDetail}${impactDetail}, the messages share a comparatively consistent purpose, and the work is already divided into manageable choices. That combination offers useful progress with less ambiguity than the groups below.`
}

function cleanupGroupSurfaceRoleLabel(kind: DecisionReviewGroupSurfaceKind): string {
  if (kind === 'semantic_parent') return 'Clear category'
  if (kind === 'backlog_parent') return 'Older items'
  if (kind === 'structural_parent') return 'Careful review'
  if (kind === 'historical_parent') return 'Reference only'
  return 'Optional group'
}

function cleanupGroupSurfaceRoleDetail(kind: DecisionReviewGroupSurfaceKind): string {
  if (kind === 'semantic_parent') {
    return 'These items share a clear purpose, so the system can offer a simple guided starting point.'
  }
  if (kind === 'backlog_parent') {
    return 'These items belong together because they are older or repeatedly ignored, even when their subjects differ.'
  }
  if (kind === 'structural_parent') {
    return 'These items need extra care. The smaller groups make them easier to review without applying a broad decision.'
  }
  if (kind === 'historical_parent') {
    return 'This history helps explain the full picture, but it does not create work for you to review.'
  }
  return 'This focused category is available when it matches the work you want to do, but it is not required for the main guided flow.'
}

export default function OperationsClustersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { reviewGroups } = useDecisionWorkspaceRead()
  const presentation = useDecisionWorkspacePresentation()
  const healthSlot = resolveDecisionWorkspacePresentationSlot(presentation, 'health_overview')
  const reviewGroupsSlot = resolveDecisionWorkspacePresentationSlot(presentation, 'review_groups')
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const focusCluster = searchParams.get('focus_cluster')
  const {
    query,
    groups: renderedGroups,
    primaryGroups: primaryDecisionGroups,
    optionalGroups,
    secondaryGroups,
    contextGroups,
    sections: groupedSections,
    sectionSummaries,
    intentSnapshots,
    progress,
    recommendation,
    subjectScopeCount: cleanupScopeSenderCount,
  } = reviewGroups
  const startedClusterIdSet = new Set(progress.startedGroupIds)
  const mainParentCount = primaryDecisionGroups.length
  const optionalGroupCount = optionalGroups.length
  const secondaryGroupCount = secondaryGroups.length
  const contextGroupCount = contextGroups.length
  const parentLanesWithSavedWorkCount = primaryDecisionGroups.filter((group) =>
    startedClusterIdSet.has(group.workflowGroupId)
  ).length
  const parentLanesStillToReviewCount = Math.max(
    mainParentCount - parentLanesWithSavedWorkCount,
    0
  )
  const optionalGroupsWithSavedWorkCount = optionalGroups.filter((group) =>
    startedClusterIdSet.has(group.workflowGroupId)
  ).length
  const groupCoveragePct =
    mainParentCount > 0 ? (parentLanesWithSavedWorkCount / mainParentCount) * 100 : 0
  const recommendedGroup = recommendation.group
  const nextStepInstruction = cleanupGroupNextStepInstruction(
    recommendation.reason,
    recommendedGroup?.title || null
  )
  const recommendedClusterId = recommendation.groupId
  const focusedClusterId = focusCluster || null

  if (reviewGroups.loading && renderedGroups.length === 0) {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-4 text-sm text-gray-300">
        Loading {reviewGroupsSlot.title}…
      </section>
    )
  }

  if (reviewGroups.error && renderedGroups.length === 0) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {reviewGroups.error}
      </section>
    )
  }

  if (renderedGroups.length === 0) {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-4 text-sm text-gray-300">
        No {presentation.nouns.subjectPlural.toLowerCase()} are available for {reviewGroupsSlot.title} yet.
        Refresh cleanup analysis from {healthSlot.title} first.
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-700/50 bg-[linear-gradient(180deg,rgba(14,31,47,0.98),rgba(8,17,29,0.98),rgba(4,9,16,0.98))] p-5 space-y-4 shadow-[0_24px_64px_rgba(2,6,23,0.36)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{reviewGroupsSlot.title}</p>
            <h1 className="text-2xl font-semibold text-white">{reviewGroupsSlot.subtitle}</h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Start with the clearest opportunity, then work through older items and anything that
              needs extra care. Optional specialized groups remain available when they match your goal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/agents/${agentId}/operations/intelligence${query}`}
              className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
            >
              Back to {healthSlot.title}
            </Link>
            {recommendedGroup ? (
              <Link
                href={buildCleanupGroupFocusHref({
                  agentId,
                  query,
                  focusClusterId: recommendedGroup.workflowGroupId,
                })}
                className="app-surface-card-tile rounded-full px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
              >
                Choose a smaller group
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
              Main review groups
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(mainParentCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              The guided stages stay open so you can see the recommended path.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Optional and reference groups
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(optionalGroupCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {formatCountLabel(secondaryGroupCount)} optional group{secondaryGroupCount === 1 ? '' : 's'} and{' '}
              {formatCountLabel(contextGroupCount)} reference group{contextGroupCount === 1 ? '' : 's'} stay
              available below without interrupting the main guided flow.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Groups already started
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {formatCountLabel(parentLanesWithSavedWorkCount)}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">
              {formatCountLabel(parentLanesStillToReviewCount)} main groups still need a first pass.
            </p>
          </div>
          <div className="app-surface-card-nested rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              {presentation.metricLabels.itemsInScope}
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
                Guided review goal
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                Give each main review group a first pass.
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Follow the stages in order: start with the clearest opportunity, work through older
                items, then review sensitive or unclear items carefully. Optional groups can wait.
              </p>
            </div>
            <div className="app-surface-card-nested rounded-2xl border border-emerald-600/45 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                Main groups started
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatCountLabel(parentLanesWithSavedWorkCount)} / {formatCountLabel(mainParentCount)}
              </p>
              <p className="mt-1 text-xs text-slate-200">
                {formatCountLabel(parentLanesStillToReviewCount)} main groups still need a first pass
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
              {formatCountLabel(parentLanesWithSavedWorkCount)} main groups started ·{' '}
              {formatCountLabel(parentLanesStillToReviewCount)} main groups still need a first pass
            </span>
            <span className="text-slate-300">
              {nextStepInstruction}
            </span>
          </div>
          {optionalGroupsWithSavedWorkCount > 0 ? (
            <p className="mt-3 text-xs leading-5 text-slate-300">
              {formatCountLabel(optionalGroupsWithSavedWorkCount)} optional group
              {optionalGroupsWithSavedWorkCount === 1 ? '' : 's'} already{' '}
              {optionalGroupsWithSavedWorkCount === 1 ? 'has' : 'have'} saved work and can
              still be reopened below when needed.
            </p>
          ) : null}
        </div>
      </section>

      {!reviewGroups.hasResolvedIntelligence ? (
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
            Use a shortcut when you want the system to point you to a useful next group.
          </p>
        </div>
        <div className="grid gap-2 xl:grid-cols-3">
          {intentSnapshots.map((snapshot) => {
            const snapshotGroup = snapshot.group
            const snapshotHref = snapshotGroup
              ? buildCleanupGroupFocusHref({
                  agentId,
                  query,
                  focusClusterId: snapshotGroup.workflowGroupId,
                })
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
                          {formatCountLabel(snapshotGroup.subjectCount)} senders
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Impact</p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {formatCountLabel(snapshotGroup.activityCount)} emails
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
              A quick guide to each stage before you compare the groups below.
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
                  {section.groupCount.toLocaleString()} group{section.groupCount === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{cleanupGroupSectionMeaning(section.id)}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {section.totalSubjectCount.toLocaleString()} senders ·{' '}
                  {section.totalActivityCount.toLocaleString()} emails
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
                    const isFocused = focusedClusterId === group.workflowGroupId
                    const isRecommended = recommendedClusterId === group.workflowGroupId
                    const actionableParent = group.surfaceKind !== 'historical_parent'
                    const renderableReviewUnits = buildRenderableReviewUnits(group.reviewUnits)
                    const reviewUnitTiers = buildCleanupReviewUnitTiers(renderableReviewUnits)
                    const reviewUnitsReady = actionableReviewUnitsReady({
                      parentSenderCount: group.subjectCount,
                      reviewUnits: renderableReviewUnits,
                      presentationErrors: [...group.validationErrors],
                    })
                    const decisionValueDetail = cleanupGroupDecisionValueDetail({
                      surfaceKind: group.surfaceKind,
                      senderCount: group.subjectCount,
                      messageCount: group.activityCount,
                      sharePct: group.sharePct,
                    })
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
                      <article key={group.presentationId} className={`rounded-2xl border p-4 ${cardClassName}`}>
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
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">People or services</p>
                            <p className="mt-1 text-xl font-semibold text-white">
                              {group.subjectCount != null ? group.subjectCount.toLocaleString() : '—'}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Items to review</p>
                          </div>
                          {group.isPresentationSlice ? (
                            <div className="app-surface-card-inset rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">Smaller groups</p>
                              <p className="mt-1 text-xl font-semibold text-white">
                                {group.reviewUnits.length.toLocaleString()}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">Exact review choices</p>
                            </div>
                          ) : (
                            <div className="app-surface-card-inset rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">Emails</p>
                              <p className="mt-1 text-xl font-semibold text-white">
                                {group.activityCount != null ? group.activityCount.toLocaleString() : '—'}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {messageShareLabel(group.sharePct, group.activityCount)}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="app-surface-card-inset rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">
                              {decisionValueDetail ? 'Why start here' : 'Why this group exists'}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-gray-300">
                              {decisionValueDetail || group.whyExists}
                            </p>
                          </div>
                          {actionableParent ? (
                            <div className="app-surface-card-inset rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                Choose a smaller group
                              </p>
                              <p className="mt-2 text-sm leading-6 text-gray-200">
                                {reviewUnitsReady
                                  ? 'Pick one manageable group below. Each sender appears in exactly one option, and the options add up to the full group.'
                                  : 'The smaller groups are not ready or do not add up correctly, so review is paused to protect the data.'}
                              </p>
                              {renderableReviewUnits.length > 0 ? (
                                <div className="mt-3 space-y-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {reviewUnitTiers.primary.map((unit) => (
                                      <CleanupReviewUnitChoice
                                        key={unit.id}
                                        unit={unit}
                                        reviewUnitsReady={reviewUnitsReady}
                                        agentId={agentId}
                                        query={query}
                                        clusterId={group.canonicalId}
                                      />
                                    ))}
                                  </div>
                                  {reviewUnitTiers.moreSpecific.length > 0 ? (
                                    <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                      <summary className="cursor-pointer text-xs font-medium text-slate-200">
                                        More specific groups ({reviewUnitTiers.moreSpecific.length})
                                      </summary>
                                      <p className="mt-2 text-xs leading-5 text-slate-400">
                                        Lower-volume or overflow choices remain exact and individually selectable.
                                      </p>
                                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {reviewUnitTiers.moreSpecific.map((unit) => (
                                          <CleanupReviewUnitChoice
                                            key={unit.id}
                                            unit={unit}
                                            reviewUnitsReady={reviewUnitsReady}
                                            agentId={agentId}
                                            query={query}
                                            clusterId={group.canonicalId}
                                          />
                                        ))}
                                      </div>
                                    </details>
                                  ) : null}
                                  {reviewUnitTiers.specialHandling.length > 0 ? (
                                    <details className="rounded-xl border border-amber-700/35 bg-amber-950/10 p-3">
                                      <summary className="cursor-pointer text-xs font-medium text-amber-100">
                                        Special handling ({reviewUnitTiers.specialHandling.length})
                                      </summary>
                                      <p className="mt-2 text-xs leading-5 text-amber-100/80">
                                        These choices stay separate because their risk, trust, or action needs are materially different.
                                      </p>
                                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {reviewUnitTiers.specialHandling.map((unit) => (
                                          <CleanupReviewUnitChoice
                                            key={unit.id}
                                            unit={unit}
                                            reviewUnitsReady={reviewUnitsReady}
                                            agentId={agentId}
                                            query={query}
                                            clusterId={group.canonicalId}
                                          />
                                        ))}
                                      </div>
                                    </details>
                                  ) : null}
                                </div>
                              ) : null}
                              {!reviewUnitsReady ? (
                                <div className="mt-3 rounded-xl border border-amber-700/35 bg-amber-950/20 px-3 py-3 text-xs leading-5 text-amber-100">
                                  Review remains paused until every smaller group is manageable and all smaller-group totals match the full group exactly.
                                  {group.validationErrors.length > 0 ? (
                                    <span className="mt-2 block">
                                      The display grouping also failed its exact-membership check.
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
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
                                <p>
                                  Why it was grouped this way:{' '}
                                  {decisionValueDetail || group.explanation}
                                </p>
                                <p>What the system is protecting: {group.safetyGuidance}</p>
                                <p>What to check while reviewing: {group.riskGuidance}</p>
                              </div>
                              {group.dominantSubject || group.dominantPattern ? (
                                <p className="text-xs text-gray-500">
                                  Most visible sender: {group.dominantSubject || 'Not available'} · most common pattern:{' '}
                                  {group.dominantPattern || 'Not available'}
                                </p>
                              ) : null}
                            </div>
                          </details>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
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
                const isFocused = focusedClusterId === group.workflowGroupId
                const isRecommended = recommendedClusterId === group.workflowGroupId
                return (
                  <div
                    key={group.presentationId}
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
                          <p className="text-[10px] uppercase tracking-wide text-slate-300">Reference coverage</p>
                          <p className="mt-1 text-xl font-semibold text-white">
                            {formatCountLabel(group.subjectCount)} senders
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatCountLabel(group.activityCount)} emails
                          </p>
                        </div>
                        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs leading-5 text-slate-300">
                          Reference information only. There is no review action here.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {demotedLaneGroups.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  {demotedLaneGroups.map((group) => {
                    const isFocused = focusedClusterId === group.workflowGroupId
                    const isRecommended = recommendedClusterId === group.workflowGroupId
                    const hasSavedWork = startedClusterIdSet.has(group.workflowGroupId)
                    const renderableReviewUnits = buildRenderableReviewUnits(group.reviewUnits)
                    const reviewUnitTiers = buildCleanupReviewUnitTiers(renderableReviewUnits)
                    const reviewUnitsReady = actionableReviewUnitsReady({
                      parentSenderCount: group.subjectCount,
                      reviewUnits: renderableReviewUnits,
                      presentationErrors: [...group.validationErrors],
                    })
                    return (
                      <article
                        key={group.presentationId}
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
                            {formatCountLabel(group.subjectCount)} senders
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
                        <div className="mt-4 grid gap-2">
                          {reviewUnitTiers.primary.map((unit) => (
                            <CleanupReviewUnitChoice
                              key={unit.id}
                              unit={unit}
                              reviewUnitsReady={reviewUnitsReady}
                              agentId={agentId}
                              query={query}
                              clusterId={group.canonicalId}
                              compact
                            />
                          ))}
                          {reviewUnitTiers.moreSpecific.length > 0 ? (
                            <details className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <summary className="cursor-pointer text-xs font-medium text-slate-200">
                                More specific groups ({reviewUnitTiers.moreSpecific.length})
                              </summary>
                              <div className="mt-3 grid gap-2">
                                {reviewUnitTiers.moreSpecific.map((unit) => (
                                  <CleanupReviewUnitChoice
                                    key={unit.id}
                                    unit={unit}
                                    reviewUnitsReady={reviewUnitsReady}
                                    agentId={agentId}
                                    query={query}
                                    clusterId={group.canonicalId}
                                    compact
                                  />
                                ))}
                              </div>
                            </details>
                          ) : null}
                          {reviewUnitTiers.specialHandling.length > 0 ? (
                            <details className="rounded-xl border border-amber-700/35 bg-amber-950/10 p-3">
                              <summary className="cursor-pointer text-xs font-medium text-amber-100">
                                Special handling ({reviewUnitTiers.specialHandling.length})
                              </summary>
                              <div className="mt-3 grid gap-2">
                                {reviewUnitTiers.specialHandling.map((unit) => (
                                  <CleanupReviewUnitChoice
                                    key={unit.id}
                                    unit={unit}
                                    reviewUnitsReady={reviewUnitsReady}
                                    agentId={agentId}
                                    query={query}
                                    clusterId={group.canonicalId}
                                    compact
                                  />
                                ))}
                              </div>
                            </details>
                          ) : null}
                          {!reviewUnitsReady ? (
                            <p className="text-xs leading-5 text-amber-100">
                              Review is paused until all smaller-group counts add up exactly.
                            </p>
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
