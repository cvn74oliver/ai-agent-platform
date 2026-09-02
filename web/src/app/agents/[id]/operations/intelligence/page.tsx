'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  InboxHealthGauge,
  MailboxIntelligenceDashboard,
  MailboxIntelligenceLoadingState,
  MailboxMissionPanel,
} from '@/components/runtime/GmailCleanupComponents'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import { useDecisionWorkspaceRead } from '@/components/runtime/DecisionWorkspaceReadContext'
import { useDecisionWorkspacePresentation } from '@/components/runtime/DecisionWorkspacePresentationContext'
import { resolveDecisionWorkspacePresentationSlot } from '@/lib/runtime/decisionWorkspacePresentation'
import {
  type DecisionReviewRecommendationReason,
  type DecisionWorkspaceCleanupClusterRef,
  type DecisionWorkspaceIntelligenceData,
  type DecisionWorkspaceIntelligenceGroup,
  type DecisionWorkspaceManagementSignals,
  type DecisionWorkspacePressureTrendData,
  type DecisionWorkspacePressureTrendWindow,
  type DecisionWorkspaceWorkflowProgress,
} from '@/lib/runtime/decisionWorkspaceReadModel'
import {
  serializeOperationsQuery,
  type OperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'

type LoadState =
  | { status: 'idle' | 'loading'; seedKey: string | null; data: null; error: null }
  | { status: 'ready'; seedKey: string; data: DecisionWorkspaceIntelligenceData; error: null }
  | { status: 'error'; seedKey: string; data: null; error: string }

type PressureTrendLoadState =
  | { status: 'idle'; data: null; error: null; requestKey: null }
  | { status: 'loading'; data: null; error: null; requestKey: string }
  | { status: 'ready'; data: DecisionWorkspacePressureTrendData; error: null; requestKey: string }
  | { status: 'error'; data: null; error: string; requestKey: string }

type CleanupGroupSummary = DecisionWorkspaceIntelligenceGroup | null

type HealthTrendSignal = {
  direction: 'rising' | 'falling' | 'stable' | 'unknown'
  label: string
  detail: string
  peakLabel: string | null
  peakBucketStartAt?: string | null
  peakCount: number
  latestLabel: string | null
  latestBucketStartAt?: string | null
}

type PressureTrendSelection = {
  window: DecisionWorkspacePressureTrendWindow
  start: string | null
  end: string | null
}

type PressureTrendSeed = PressureTrendSelection & {
  timeZone: string
  requestKey: string
}

type PressureTrendSeedCandidate = {
  data: DecisionWorkspacePressureTrendData
  source: 'cached_intelligence' | 'runtime_intelligence' | 'mailbox_intelligence_fetch'
}

type PressureTrendSeedDecision =
  | {
      usable: true
      candidate: PressureTrendSeedCandidate
      requestKey: string
    }
  | {
      usable: false
      reason: string
    }

type MailboxHealthIntelligence = {
  score: number
  state: string
  primaryDriver: string
  driverWhyNow: string
  pressureDirection: string
  predictedOutcome: string
  recommendedIntervention: string
  interventionWhyBest: string
  expectedImpact: string
  impactConfidence: string
  currentStatus: string
  currentStatusDetail: string
  nextActionTitle: string
  nextActionDetail: string
  topRiskTitle: string
  topRiskDetail: string
  progressLabel: string
  progressDetail: string
  progressStatus: string
  progressOutcome: string
  progressPct: number
  nextActionMode: 'approve_queue' | 'resume_work' | 'open_group' | 'refresh'
}

function workflowClusterIdFromArtifactCluster(
  cluster: DecisionWorkspaceIntelligenceGroup | null | undefined
): string | null {
  if (!cluster) return null
  return cluster.canonical_cluster_id || cluster.cluster_id
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function indexReadinessLabel(value: string | null | undefined): string {
  if (value === 'healthy') return 'Current snapshot ready'
  if (value === 'degraded_usable') return 'Current snapshot partially ready'
  if (value === 'uninitialized') return 'Snapshot not ready yet'
  if (value === 'unavailable') return 'Snapshot unavailable'
  return 'Snapshot state unknown'
}

function safeBrowserTimeZone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return resolved && resolved.trim() ? resolved.trim() : 'UTC'
  } catch {
    return 'UTC'
  }
}

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isTransientInboxAnalysisGuardError(value: string | null | undefined): boolean {
  return (
    typeof value === 'string' &&
    (/already running/i.test(value) || /just requested/i.test(value) || /wait briefly/i.test(value))
  )
}

function dateInputFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function dateInputValueFromDate(date: Date, timeZone: string): string {
  const parts = dateInputFormatter(timeZone).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '0000'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function dateInputValueFromIso(value: string | null | undefined, timeZone: string): string | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || parsed < Date.UTC(1971, 0, 1)) return null
  return dateInputValueFromDate(new Date(parsed), timeZone)
}

function normalizePressureTrendWindow(value: string | null): DecisionWorkspacePressureTrendWindow | null {
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
  return null
}

function legacyScopeToPressureTrendSelection(
  analysisScope: OperationsAnalysisScope,
  timeZone: string
): PressureTrendSelection {
  const now = new Date()
  if (analysisScope === '365d') return { window: 'last_year', start: null, end: null }
  if (analysisScope === '90d') return { window: 'last_quarter', start: null, end: null }
  if (analysisScope === '30d') return { window: 'last_month', start: null, end: null }
  if (analysisScope === '7d') return { window: 'last_week', start: null, end: null }
  if (analysisScope === '60d' || analysisScope === '180d') {
    const days = analysisScope === '60d' ? 60 : 180
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return {
      window: 'custom',
      start: dateInputValueFromDate(start, timeZone),
      end: dateInputValueFromDate(now, timeZone),
    }
  }
  return { window: 'all_indexed', start: null, end: null }
}

function pressureTrendSelectionFromSearch(params: {
  pressureWindow: string | null
  pressureStart: string | null
  pressureEnd: string | null
  analysisScope: OperationsAnalysisScope
  timeZone: string
}): PressureTrendSelection {
  const normalizedWindow = normalizePressureTrendWindow(params.pressureWindow)
  if (normalizedWindow === 'custom' && params.pressureStart && params.pressureEnd) {
    return {
      window: 'custom',
      start: params.pressureStart,
      end: params.pressureEnd,
    }
  }
  if (normalizedWindow && normalizedWindow !== 'custom') {
    return { window: normalizedWindow, start: null, end: null }
  }
  return legacyScopeToPressureTrendSelection(params.analysisScope, params.timeZone)
}

function pressureTrendDateRangeLabel(data: DecisionWorkspacePressureTrendData): string {
  if (!data.window.effective_start || !data.window.effective_end) {
    return `Showing ${data.window.label.toLowerCase()}`
  }
  const startMs = Date.parse(data.window.effective_start)
  const endMs = Date.parse(data.window.effective_end)
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    startMs < Date.UTC(1971, 0, 1) ||
    endMs < Date.UTC(1971, 0, 1)
  ) {
    return `Showing ${data.window.label.toLowerCase()}`
  }
  const start = new Date(startMs)
  const end = new Date(endMs)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: data.time_zone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `Showing ${formatter.format(start)} - ${formatter.format(end)}`
}

function pressureTrendRangeDetail(data: DecisionWorkspacePressureTrendData): string {
  const base = `${pressureTrendDateRangeLabel(data)} · ${data.grouping.label.toLowerCase()}`
  return data.window.limited_by_indexed_coverage
    ? `${base} · adjusted to available indexed history`
    : base
}

function readyPressureTrendState(
  data: DecisionWorkspacePressureTrendData,
  requestKey: string
): PressureTrendLoadState {
  return {
    status: 'ready',
    data,
    error: null,
    requestKey,
  }
}

function pressureTrendSelectionsMatch(
  left: PressureTrendSelection,
  right: PressureTrendSelection
): boolean {
  return left.window === right.window && left.start === right.start && left.end === right.end
}

function isUsableCachedPressureTrend(params: {
  data: DecisionWorkspacePressureTrendData | null
  selection: PressureTrendSelection
  timeZone: string
}): params is {
  data: DecisionWorkspacePressureTrendData
  selection: PressureTrendSelection
  timeZone: string
} {
  const data = params.data
  if (!data || data.source !== 'gmail_index_cache') return false
  if (data.window.key !== params.selection.window) return false
  if ((data.window.requested_start || null) !== params.selection.start) return false
  if ((data.window.requested_end || null) !== params.selection.end) return false
  if (data.time_zone !== params.timeZone) return false

  const coverageStartMs = Date.parse(data.indexed_coverage.indexed_date_span_start || '')
  const coverageEndMs = Date.parse(data.indexed_coverage.indexed_date_span_end || '')
  const effectiveStartMs = Date.parse(data.window.effective_start || '')
  const effectiveEndMs = Date.parse(data.window.effective_end || '')
  if (
    !Number.isFinite(coverageStartMs) ||
    !Number.isFinite(coverageEndMs) ||
    coverageStartMs < Date.UTC(1971, 0, 1) ||
    coverageEndMs < coverageStartMs ||
    !Number.isFinite(effectiveStartMs) ||
    !Number.isFinite(effectiveEndMs) ||
    effectiveStartMs < coverageStartMs ||
    effectiveEndMs < effectiveStartMs ||
    effectiveEndMs > coverageEndMs + 24 * 60 * 60 * 1000
  ) {
    return false
  }

  return (
    data.series.length > 0 &&
    data.series.every((bucket) => {
      const bucketStartMs = Date.parse(bucket.bucket_start_at)
      const bucketEndMs = Date.parse(bucket.bucket_end_at)
      return (
        Number.isFinite(bucketStartMs) &&
        Number.isFinite(bucketEndMs) &&
        bucketStartMs >= Date.UTC(1971, 0, 1) &&
        bucketEndMs > bucketStartMs
      )
    })
  )
}

function pressureTrendSeedDecision(params: {
  candidates: Array<PressureTrendSeedCandidate | null>
  selection: PressureTrendSelection
  defaultSelection: PressureTrendSelection
  timeZone: string
  requestKey: string
}): PressureTrendSeedDecision {
  if (!pressureTrendSelectionsMatch(params.selection, params.defaultSelection)) {
    return { usable: false, reason: 'non_default_selection' }
  }

  let sawCandidate = false
  let sawTimeZoneMismatch = false
  let sawWindowMismatch = false
  let sawStartMismatch = false
  let sawEndMismatch = false
  let sawInvalidCoverage = false
  let sawInvalidSeries = false

  for (const candidate of params.candidates) {
    if (!candidate?.data) continue
    sawCandidate = true

    if (candidate.data.source !== 'gmail_index_cache') {
      continue
    }
    if (candidate.data.window.key !== params.selection.window) {
      sawWindowMismatch = true
      continue
    }

    const requestedStart = candidate.data.window.requested_start || null
    const requestedEnd = candidate.data.window.requested_end || null
    if (requestedStart !== params.selection.start) {
      sawStartMismatch = true
      continue
    }
    if (requestedEnd !== params.selection.end) {
      sawEndMismatch = true
      continue
    }
    if (candidate.data.time_zone !== params.timeZone) {
      sawTimeZoneMismatch = true
      continue
    }
    const coverageStartMs = Date.parse(candidate.data.indexed_coverage.indexed_date_span_start || '')
    const coverageEndMs = Date.parse(candidate.data.indexed_coverage.indexed_date_span_end || '')
    const effectiveStartMs = Date.parse(candidate.data.window.effective_start || '')
    const effectiveEndMs = Date.parse(candidate.data.window.effective_end || '')
    if (
      !Number.isFinite(coverageStartMs) ||
      !Number.isFinite(coverageEndMs) ||
      coverageStartMs < Date.UTC(1971, 0, 1) ||
      coverageEndMs < coverageStartMs ||
      !Number.isFinite(effectiveStartMs) ||
      !Number.isFinite(effectiveEndMs) ||
      effectiveStartMs < coverageStartMs ||
      effectiveEndMs < effectiveStartMs ||
      effectiveEndMs > coverageEndMs + 24 * 60 * 60 * 1000
    ) {
      sawInvalidCoverage = true
      continue
    }
    if (
      candidate.data.series.length === 0 ||
      candidate.data.series.some((bucket) => {
        const bucketStartMs = Date.parse(bucket.bucket_start_at)
        const bucketEndMs = Date.parse(bucket.bucket_end_at)
        return (
          !Number.isFinite(bucketStartMs) ||
          !Number.isFinite(bucketEndMs) ||
          bucketStartMs < Date.UTC(1971, 0, 1) ||
          bucketEndMs <= bucketStartMs
        )
      })
    ) {
      sawInvalidSeries = true
      continue
    }

    return {
      usable: true,
      candidate,
      requestKey: params.requestKey,
    }
  }

  if (!sawCandidate) {
    return { usable: false, reason: 'seed_absent' }
  }
  if (sawTimeZoneMismatch) {
    return { usable: false, reason: 'seed_time_zone_mismatch' }
  }
  if (sawInvalidCoverage) {
    return { usable: false, reason: 'seed_invalid_indexed_coverage' }
  }
  if (sawInvalidSeries) {
    return { usable: false, reason: 'seed_invalid_series' }
  }
  if (sawWindowMismatch) {
    return { usable: false, reason: 'seed_window_mismatch' }
  }
  if (sawStartMismatch) {
    return { usable: false, reason: 'seed_start_mismatch' }
  }
  if (sawEndMismatch) {
    return { usable: false, reason: 'seed_end_mismatch' }
  }
  return { usable: false, reason: 'seed_untrusted' }
}

function buildPressureTrendRequestKey(params: {
  cacheVersion: string | null
  timeZone: string
  selection: PressureTrendSelection
  clusters: DecisionWorkspaceCleanupClusterRef[]
}): string {
  return [
    params.cacheVersion || 'default',
    params.timeZone,
    params.selection.window,
    params.selection.start || 'none',
    params.selection.end || 'none',
    ...params.clusters.map((cluster) =>
      [cluster.clusterId, cluster.clusterType, cluster.title, cluster.query].join('::')
    ),
  ].join('|||')
}

function chartPressureTrend(data: DecisionWorkspacePressureTrendData): HealthTrendSignal {
  const timeline = data.series
  if (timeline.length === 0) {
    return {
      direction: 'unknown',
      label: 'No visible pressure history yet',
      detail:
        'This active range does not include chartable indexed periods yet.',
      peakLabel: null,
      peakBucketStartAt: null,
      peakCount: 0,
      latestLabel: null,
      latestBucketStartAt: null,
    }
  }

  const peak =
    timeline
      .slice()
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.bucket_start_at.localeCompare(right.bucket_start_at) ||
          left.label.localeCompare(right.label)
      )[0] || null
  const latest = timeline[timeline.length - 1] || null
  const previous = timeline.length > 1 ? timeline[timeline.length - 2] || null : null

  if ((peak?.count || 0) === 0) {
    return {
      direction: 'unknown',
      label: 'No visible pressure in this window',
      detail:
        'This active range currently shows zero supporting-message pressure across every visible bucket.',
      peakLabel: peak?.label || null,
      peakBucketStartAt: peak?.bucket_start_at || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
      latestBucketStartAt: latest?.bucket_start_at || null,
    }
  }

  if (timeline.length === 1) {
    return {
      direction: 'unknown',
      label: 'Only one visible period is available',
      detail: 'Only one visible period is available, so direction needs at least two visible periods.',
      peakLabel: peak?.label || null,
      peakBucketStartAt: peak?.bucket_start_at || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
      latestBucketStartAt: latest?.bucket_start_at || null,
    }
  }

  if (timeline.length < 3) {
    const shortWindowDelta = (latest?.count || 0) - (previous?.count || 0)
    return {
      direction: 'unknown',
      label:
        shortWindowDelta > 0
          ? 'Pressure ticked up in a short window'
          : shortWindowDelta < 0
            ? 'Pressure eased in a short window'
            : 'Pressure held steady in a short window',
      detail:
        'Only a few visible periods are in view, so treat this as directional context rather than a durable trend.',
      peakLabel: peak?.label || null,
      peakBucketStartAt: peak?.bucket_start_at || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
      latestBucketStartAt: latest?.bucket_start_at || null,
    }
  }

  const splitIndex = Math.max(1, Math.floor(timeline.length / 2))
  const earlier = timeline.slice(0, splitIndex).reduce((total, item) => total + item.count, 0)
  const recent = timeline.slice(splitIndex).reduce((total, item) => total + item.count, 0)

  if (recent > earlier * 1.15) {
    return {
      direction: 'rising',
      label: 'Pressure is rising',
      detail:
        'New inbox noise is arriving faster than cleanup is reducing it across this active range.',
      peakLabel: peak?.label || null,
      peakBucketStartAt: peak?.bucket_start_at || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
      latestBucketStartAt: latest?.bucket_start_at || null,
    }
  }

  if (recent < earlier * 0.85) {
    return {
      direction: 'falling',
      label: 'Pressure is easing',
      detail:
        'Cleanup decisions are reducing visible pressure faster than new pressure is arriving across this active range.',
      peakLabel: peak?.label || null,
      peakBucketStartAt: peak?.bucket_start_at || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
      latestBucketStartAt: latest?.bucket_start_at || null,
    }
  }

  return {
    direction: 'stable',
    label: 'Pressure is steady',
    detail:
      'New pressure and cleanup are moving at roughly the same pace across this active range.',
    peakLabel: peak?.label || null,
    peakBucketStartAt: peak?.bucket_start_at || null,
    peakCount: peak?.count || 0,
    latestLabel: latest?.label || null,
    latestBucketStartAt: latest?.bucket_start_at || null,
  }
}

function healthTrend(data: DecisionWorkspaceIntelligenceData): HealthTrendSignal {
  const timeline = data.cleanup_candidate_universe.activity_timeline
  if (timeline.length === 0) {
    return {
      direction: 'unknown',
      label: 'No visible pressure history yet',
      detail:
        'The current cleanup snapshot does not include enough chartable timeline history to show whether inbox pressure is rising or easing.',
      peakLabel: null,
      peakCount: 0,
      latestLabel: null,
    }
  }

  const peak =
    timeline
      .slice()
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))[0] || null
  const latest = timeline[timeline.length - 1] || null
  const previous = timeline.length > 1 ? timeline[timeline.length - 2] || null : null

  if ((peak?.count || 0) === 0) {
    return {
      direction: 'unknown',
      label: 'No visible pressure in this window',
      detail:
        'The current visible cleanup window shows no supporting-message pressure yet, so Pressure Trend can only provide context until fresh activity appears.',
      peakLabel: peak?.label || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
    }
  }

  if (timeline.length === 1) {
    return {
      direction: 'unknown',
      label: 'Only one visible period is available',
      detail: `${latest?.label || 'The visible period'} shows ${(latest?.count || 0).toLocaleString()} supporting messages, but pressure movement needs at least two visible periods.`,
      peakLabel: peak?.label || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
    }
  }

  const splitIndex = Math.max(1, Math.floor(timeline.length / 2))
  const earlier = timeline.slice(0, splitIndex).reduce((total, item) => total + item.count, 0)
  const recent = timeline.slice(splitIndex).reduce((total, item) => total + item.count, 0)

  if (timeline.length < 3) {
    const shortWindowDelta = (latest?.count || 0) - (previous?.count || 0)
    const label =
      shortWindowDelta > 0
        ? 'Pressure ticked up in a short window'
        : shortWindowDelta < 0
          ? 'Pressure eased in a short window'
          : 'Pressure held steady in a short window'
    return {
      direction: 'unknown',
      label,
      detail: `Only ${timeline.length} visible periods are in view, so treat this as directional context rather than a durable trend. ${(latest?.count || 0).toLocaleString()} supporting messages in ${latest?.label || 'the latest period'} versus ${(previous?.count || 0).toLocaleString()} in ${previous?.label || 'the prior period'}.`,
      peakLabel: peak?.label || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
    }
  }

  if (recent > earlier * 1.15) {
    return {
      direction: 'rising',
      label: 'Pressure is rising',
      detail: `New inbox noise is arriving faster than cleanup is reducing it. ${recent.toLocaleString()} recent supporting messages versus ${earlier.toLocaleString()} earlier in the visible window.`,
      peakLabel: peak?.label || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
    }
  }

  if (recent < earlier * 0.85) {
    return {
      direction: 'falling',
      label: 'Pressure is easing',
      detail: `Cleanup decisions are reducing visible inbox noise faster than new noise arrives. ${recent.toLocaleString()} recent supporting messages versus ${earlier.toLocaleString()} earlier in the visible window.`,
      peakLabel: peak?.label || null,
      peakCount: peak?.count || 0,
      latestLabel: latest?.label || null,
    }
  }

  return {
    direction: 'stable',
    label: 'Pressure is steady',
    detail: `New inbox noise and cleanup progress are moving at roughly the same pace, so the cleanup-ready sender set is not shrinking yet. ${recent.toLocaleString()} recent supporting messages versus ${earlier.toLocaleString()} earlier in the visible window.`,
    peakLabel: peak?.label || null,
    peakCount: peak?.count || 0,
    latestLabel: latest?.label || null,
  }
}

function healthStateFromScore(
  score: number,
  syncHealth: string | null | undefined
): string {
  if (syncHealth === 'unavailable') return 'Unavailable'
  if (syncHealth === 'uninitialized') return 'Not indexed yet'
  if (syncHealth === 'degraded_usable') return 'Degraded but usable'
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Stable'
  if (score >= 40) return 'Warning'
  if (score >= 20) return 'Degraded'
  return 'Critical'
}

function buildMailboxHealthIntelligence(params: {
  data: DecisionWorkspaceIntelligenceData
  syncHealth: string | null | undefined
  pendingApprovals: number
  workflowProgress: DecisionWorkspaceWorkflowProgress
  managedSenderCount: number
  nextCluster: CleanupGroupSummary
  nextClusterReason: DecisionReviewRecommendationReason
  resumeCluster: CleanupGroupSummary
}): MailboxHealthIntelligence {
  const totalSenders = Math.max(params.data.whole_mailbox.sender_count, 1)
  const cleanupSenders = params.data.cleanup_candidate_universe.sender_count
  const cleanupMessages = params.data.cleanup_candidate_universe.message_count
  const managedSenders = Math.min(params.managedSenderCount, totalSenders)
  const remainingUndecidedSenders = Math.max(totalSenders - managedSenders, 0)
  const activeDraftSenders = Math.min(params.workflowProgress.decidedSenderCount, cleanupSenders)
  const protectedSenders = params.data.protected_safe_context.protected_sender_count
  const decisionCoverageRatio = managedSenders / totalSenders
  const activeReviewProgressRatio = cleanupSenders > 0 ? activeDraftSenders / cleanupSenders : 1
  const unresolvedRatio = remainingUndecidedSenders / totalSenders
  const dominantShareRatio = (params.nextCluster?.share_pct || 0) / 100
  const coverageScore = decisionCoverageRatio * 78
  const activeReviewReliefScore = clamp(1 - unresolvedRatio * 0.85, 0.08, 1) * 14
  const executionFrictionPenalty =
    (params.pendingApprovals > 0 ? 0.45 : 0) +
    clamp(protectedSenders / Math.max(cleanupSenders + protectedSenders, 1), 0, 0.5) * 0.3 +
    dominantShareRatio * 0.15
  const executionScore = clamp(1 - executionFrictionPenalty, 0.08, 1) * 8
  const rawScore = coverageScore + activeReviewReliefScore + executionScore
  const score =
    params.syncHealth === 'uninitialized' || params.syncHealth === 'unavailable'
      ? 0
      : Math.round(rawScore)
  const state = healthStateFromScore(score, params.syncHealth)
  const trend = healthTrend(params.data)

  const primaryDriver =
    params.pendingApprovals > 0
      ? 'Cleanup is paused at the approval queue'
      : decisionCoverageRatio < 0.35
        ? 'Too many senders still lack decisions'
        : protectedSenders > Math.max(10, Math.round(cleanupSenders * 0.15))
          ? 'Protected senders are slowing safe cleanup'
          : params.nextCluster && params.nextClusterReason === 'small_quick_win'
            ? `${params.nextCluster.title} is the quickest place to start`
            : params.nextCluster && params.nextClusterReason === 'high_impact_manageable'
              ? `${params.nextCluster.title} is the biggest manageable primary action lane`
              : params.nextCluster && params.nextClusterReason === 'backlog'
                ? `${params.nextCluster.title} is the clearest backlog pass`
            : remainingUndecidedSenders > 0
              ? 'Decision coverage is improving, but not complete'
              : 'Every indexed sender currently has a decision'

  const predictedOutcome =
    params.pendingApprovals > 0
      ? 'Visible inbox noise will keep rising while ready archive work sits in the approval queue.'
      : decisionCoverageRatio < 1
        ? `${remainingUndecidedSenders.toLocaleString()} indexed senders still lack committed decisions, so inbox clarity will remain incomplete even if many existing messages are already safe to keep.`
        : trend.direction === 'rising'
          ? 'Inbox clarity is strong, but incoming pressure is rising faster than current cleanup is reducing visible noise.'
          : 'Decision coverage is complete, so the inbox should remain operationally clean unless new undecided senders enter the indexed universe.'

  const averageGroupMessages =
    params.data.cleanup_groups.length > 0
      ? Math.round(cleanupMessages / params.data.cleanup_groups.length)
      : cleanupMessages
  const estimatedApprovedSenders = Math.max(
    1,
    Math.round(
      cleanupSenders *
        Math.max(activeReviewProgressRatio, 1 / Math.max(params.data.cleanup_groups.length, 1))
    )
  )
  const estimatedApprovalMessages = Math.min(
    cleanupMessages,
    Math.max(
      averageGroupMessages,
      Math.round(cleanupMessages * Math.max(activeReviewProgressRatio, 0.15))
    )
  )

  let nextActionMode: MailboxHealthIntelligence['nextActionMode'] = 'refresh'
  let recommendedIntervention = 'Refresh cleanup analysis'
  let interventionWhyBest =
    'Refreshing the recommendation set only matters when the current sender opportunity is stale or missing.'
  let expectedImpact = 'Rebuild the recommendation set so the next sender opportunity is visible again.'
  let impactConfidence =
    'Low confidence. This payoff depends on a refreshed recommendation set, so sender impact cannot be estimated precisely yet.'
  if (params.pendingApprovals > 0) {
    nextActionMode = 'approve_queue'
    recommendedIntervention = 'Approve archive queue'
    interventionWhyBest =
      'You already did the review work. Approving it is the fastest path to visible cleanup, and it beats opening another sender group before this work lands.'
    expectedImpact = `Unlock already-decided work for ~${estimatedApprovedSenders.toLocaleString()} senders and reduce visible inbox noise across ~${estimatedApprovalMessages.toLocaleString()} supporting messages.`
    impactConfidence =
      'High confidence. The sender scope is already decided, and improving decision coverage is the primary cleanliness gain. Message reduction is supporting impact, not the definition of clean.'
  } else if (params.resumeCluster) {
    nextActionMode = 'resume_work'
    recommendedIntervention = `Resume ${params.resumeCluster.title}`
    interventionWhyBest =
      params.nextCluster &&
      workflowClusterIdFromArtifactCluster(params.nextCluster) !==
        workflowClusterIdFromArtifactCluster(params.resumeCluster)
        ? `This beats opening ${params.nextCluster.title} because unfinished work already has momentum and raises decision coverage faster than restarting on a new group.`
        : 'This beats starting over because the unfinished work already has context and saved decisions attached to it.'
    expectedImpact = `Continue work on ${params.resumeCluster.sender_count.toLocaleString()} senders with ~${params.resumeCluster.message_count.toLocaleString()} supporting messages, raising decision coverage once those senders are approved.`
    impactConfidence =
      'Medium confidence. The cleanliness gain comes from moving more senders into decided state; visible message reduction still depends on which of those senders are archive-safe.'
  } else if (params.nextCluster) {
    nextActionMode = 'open_group'
    recommendedIntervention = `Open ${params.nextCluster.title}`
    interventionWhyBest =
      params.nextClusterReason === 'small_quick_win'
        ? `This beats the heavier safety / coverage lanes because ${params.nextCluster.title} should give you momentum fast without opening an overwhelming review set.`
        : params.nextClusterReason === 'backlog'
          ? `This is the clearest remaining backlog pass without dropping straight into the safety / coverage lanes.`
          : `This is the strongest manageable sender-first opportunity in the current snapshot.`
    expectedImpact = `Resolve ${params.nextCluster.sender_count.toLocaleString()} senders and improve decision coverage across the indexed sender universe, with ~${params.nextCluster.message_count.toLocaleString()} supporting messages showing likely impact.`
    impactConfidence =
      'Medium confidence. The cleanliness gain comes from deciding those senders; message reduction is secondary and depends on how many of them are archive-safe.'
  }

  const driverWhyNow =
    params.pendingApprovals > 0
      ? 'Approvals are the only thing stopping visible progress right now. The review work is already done.'
      : decisionCoverageRatio < 0.35
        ? `Inbox health is low because only ${managedSenders.toLocaleString()} of ${totalSenders.toLocaleString()} indexed senders currently have committed decisions. A clean inbox means each sender has a decision, even if many messages are intentionally kept.`
        : protectedSenders > Math.max(10, Math.round(cleanupSenders * 0.15))
          ? 'Protected senders keep cleanup safe, but they also slow progress until ambiguous senders are reviewed carefully.'
          : params.nextCluster && params.nextClusterReason === 'small_quick_win'
            ? `${params.nextCluster.title} is the fastest low-friction starting point right now, which makes it the best way to create momentum before touching the backlog or safety / coverage lanes.`
            : params.nextCluster && params.nextClusterReason === 'high_impact_manageable'
              ? `${params.nextCluster.title} balances sender workload and message impact better than the heavier safety / coverage lanes, so it is the best manageable primary action lane right now.`
              : params.nextCluster && params.nextClusterReason === 'backlog'
                ? 'Backlog is the clearest remaining path because the smaller primary action lanes are exhausted and safety / coverage lanes should not be the default start.'
            : remainingUndecidedSenders > 0
              ? `${remainingUndecidedSenders.toLocaleString()} indexed senders still lack committed decisions, so coverage is improving but the inbox is not yet fully clean.`
              : 'Decision coverage is complete, so any remaining health drag now comes from execution friction and pressure trend.'

  const currentStatus =
    params.pendingApprovals > 0
      ? 'Visible cleanup is waiting on approval'
      : decisionCoverageRatio >= 0.85
        ? 'Most indexed senders already have decisions'
        : params.workflowProgress.startedClusterCount > 0
          ? 'Sender cleanup is already in motion'
          : cleanupSenders > 0
            ? 'A sender cleanup mission is ready'
            : 'Waiting for cleanup recommendations'
  const currentStatusDetail =
    params.pendingApprovals > 0
      ? `${managedSenders.toLocaleString()} of ${totalSenders.toLocaleString()} indexed senders already have committed decisions. ${params.pendingApprovals.toLocaleString()} archive approvals are waiting before that coverage creates visible inbox reduction for ~${estimatedApprovedSenders.toLocaleString()} senders.`
      : params.workflowProgress.startedClusterCount > 0
        ? `${managedSenders.toLocaleString()} of ${totalSenders.toLocaleString()} indexed senders already have committed decisions. ${remainingUndecidedSenders.toLocaleString()} still lack one, and ${cleanupSenders.toLocaleString()} of those are already in the active review universe backed by ~${cleanupMessages.toLocaleString()} supporting messages.`
        : `${managedSenders.toLocaleString()} of ${totalSenders.toLocaleString()} indexed senders already have committed decisions. ${remainingUndecidedSenders.toLocaleString()} still need one, and ${cleanupSenders.toLocaleString()} are currently surfaced for review.`

  const topRiskTitle =
    params.pendingApprovals > 0
      ? 'Approval queue'
      : decisionCoverageRatio < 0.5
        ? 'Low decision coverage'
        : protectedSenders > 0
          ? 'Protected sender ambiguity'
          : trend.direction === 'rising'
            ? 'Inbound pressure is increasing'
            : 'Open sender review set'
  const topRiskDetail =
    params.pendingApprovals > 0
      ? `Approve archive work to unlock visible inbox reduction for ~${estimatedApprovedSenders.toLocaleString()} decided senders.`
      : decisionCoverageRatio < 0.5
        ? `${remainingUndecidedSenders.toLocaleString()} indexed senders still lack committed decisions, so inbox clarity remains weak even before message pressure is considered.`
        : protectedSenders > 0
          ? `${protectedSenders.toLocaleString()} protected senders still require cautious handling.`
          : trend.direction === 'rising'
            ? trend.detail
            : `${cleanupSenders.toLocaleString()} cleanup-ready senders still need decisions before inbox pressure can ease, and those senders are backed by ~${cleanupMessages.toLocaleString()} supporting messages.`

  const nextActionTitle =
    nextActionMode === 'approve_queue'
      ? 'Approve archive queue'
      : nextActionMode === 'resume_work'
        ? `Resume ${params.resumeCluster?.title || 'saved work'}`
        : nextActionMode === 'open_group'
          ? `Open ${params.nextCluster?.title || 'recommended group'}`
          : 'Refresh cleanup analysis'
  const nextActionDetail =
    nextActionMode === 'approve_queue'
      ? 'Approvals are blocking the next visible gain. Clear them first, then open the next sender group.'
      : nextActionMode === 'resume_work'
        ? `${params.resumeCluster?.sender_count.toLocaleString() || '0'} senders already have momentum in this unfinished group, backed by ~${params.resumeCluster?.message_count.toLocaleString() || '0'} supporting messages. Finishing it raises decision coverage faster than starting over.`
        : nextActionMode === 'open_group'
          ? `${
              params.nextClusterReason === 'small_quick_win'
                ? `${params.nextCluster?.sender_count.toLocaleString() || '0'} senders make this the quickest low-friction primary action lane to start, backed by ~${params.nextCluster?.message_count.toLocaleString() || '0'} supporting messages.`
                : params.nextClusterReason === 'backlog'
                  ? `${params.nextCluster?.sender_count.toLocaleString() || '0'} senders sit in the main backlog lane, backed by ~${params.nextCluster?.message_count.toLocaleString() || '0'} supporting messages.`
                  : `${params.nextCluster?.sender_count.toLocaleString() || '0'} senders make this the biggest manageable primary action lane right now, backed by ~${params.nextCluster?.message_count.toLocaleString() || '0'} supporting messages.`
            }${
              workflowClusterIdFromArtifactCluster(params.nextCluster) ===
              'semantic.marketing_subscriptions'
                ? ' Start with offer campaigns for fast cleanup, then review product updates for selective keep decisions.'
                : ''
            }`
          : 'The dashboard needs a refreshed recommendation set before work can continue.'

  const progressStatus =
    params.pendingApprovals > 0
      ? 'Decisions exist, but execution is waiting'
      : decisionCoverageRatio >= 0.66
        ? 'Coverage is moving toward clean'
        : decisionCoverageRatio > 0
          ? 'Coverage is improving, but still incomplete'
          : 'Decision coverage has not started yet'
  const progressOutcome =
    params.pendingApprovals > 0
      ? 'Clearing approvals converts already-decided sender work into visible inbox reduction without changing the cleanliness goal.'
      : decisionCoverageRatio >= 0.66
        ? `More than half of the indexed sender universe already has committed decisions, so the remaining cleanliness gap is shrinking.`
        : decisionCoverageRatio > 0
          ? `${managedSenders.toLocaleString()} indexed senders already have decisions, but ${remainingUndecidedSenders.toLocaleString()} still do not, so clarity remains partial.`
          : `No indexed senders have committed decisions yet, so inbox cleanliness has not begun.`

  return {
    score,
    state,
    primaryDriver,
    driverWhyNow,
    pressureDirection: trend.label,
    predictedOutcome,
    recommendedIntervention,
    interventionWhyBest,
    expectedImpact,
    impactConfidence,
    currentStatus,
    currentStatusDetail,
    nextActionTitle,
    nextActionDetail,
    topRiskTitle,
    topRiskDetail,
    progressLabel:
      `${managedSenders.toLocaleString()} / ${totalSenders.toLocaleString()} indexed senders decided`,
    progressDetail:
      `${remainingUndecidedSenders.toLocaleString()} indexed senders still lack committed decisions. ${cleanupSenders.toLocaleString()} are already surfaced in the current cleanup review universe, backed by ~${cleanupMessages.toLocaleString()} supporting messages.`,
    progressStatus,
    progressOutcome,
    progressPct: Math.round(decisionCoverageRatio * 100),
    nextActionMode,
  }
}

export default function OperationsIntelligencePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const { intelligence: intelligenceService } = useDecisionWorkspaceRead()
  const presentation = useDecisionWorkspacePresentation()
  const healthSlot = resolveDecisionWorkspacePresentationSlot(presentation, 'health_overview')
  const reviewGroupsSlot = resolveDecisionWorkspacePresentationSlot(presentation, 'review_groups')
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const intelligencePathname = agentId ? `/agents/${agentId}/operations/intelligence` : '/agents/unknown/operations/intelligence'
  const requestedSessionId = searchParams.get('playground_session_id')
  const browserTimeZone = useMemo(() => safeBrowserTimeZone(), [])
  const pressureTrendSelection = useMemo(
    () =>
      pressureTrendSelectionFromSearch({
        pressureWindow: searchParams.get('pressure_window'),
        pressureStart: searchParams.get('pressure_start'),
        pressureEnd: searchParams.get('pressure_end'),
        analysisScope: runtime.analysisScope,
        timeZone: browserTimeZone,
      }),
    [browserTimeZone, runtime.analysisScope, searchParams]
  )
  const defaultPressureTrendSelection = useMemo(
    () => legacyScopeToPressureTrendSelection(runtime.analysisScope, browserTimeZone),
    [browserTimeZone, runtime.analysisScope]
  )
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)
  const cacheVersion = runtime.data?.runtime_cleanup_plan?.generated_at || null
  const clusters = useMemo<DecisionWorkspaceCleanupClusterRef[]>(
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
        ? intelligenceService.readCachedIntelligence({
            clusters,
            analysisScopeId: runtime.analysisScope,
            cacheVersion,
          })
        : null,
    [cacheVersion, clusters, intelligenceService, runtime.analysisScope]
  )
  const latestStableIntelligence = useMemo(
    () =>
      clusters.length > 0
        ? intelligenceService.readLatestStableIntelligence({
            clusters,
            analysisScopeId: runtime.analysisScope,
          })
        : null,
    [clusters, intelligenceService, runtime.analysisScope]
  )
  const trustedRuntimeIntelligence = useMemo(() => {
    const runtimeIntelligence = runtime.data?.runtime_mailbox_intelligence
    const freshnessStatus = runtime.data?.runtime_mailbox_profile?.freshness?.status
    if (clusters.length === 0 || !runtimeIntelligence) return null
    if (runtimeIntelligence.analysis_scope !== runtime.analysisScope) return null
    if (runtimeIntelligence.source !== 'gmail_index_cache') return null
    if (freshnessStatus !== 'fresh' && freshnessStatus !== 'cached') return null
    return runtimeIntelligence
  }, [
    clusters.length,
    runtime.analysisScope,
    runtime.data?.runtime_mailbox_intelligence,
    runtime.data?.runtime_mailbox_profile?.freshness?.status,
  ])
  const cachedPressureTrend = useMemo(
    () =>
      clusters.length > 0
        ? intelligenceService.readCachedActivitySeries({
            clusters,
            cacheVersion,
            pressureWindow: pressureTrendSelection.window,
            pressureStart: pressureTrendSelection.start,
            pressureEnd: pressureTrendSelection.end,
            timeZone: browserTimeZone,
          })
        : null,
    [browserTimeZone, cacheVersion, clusters, intelligenceService, pressureTrendSelection]
  )
  const usableCachedPressureTrend = useMemo(
    () =>
      isUsableCachedPressureTrend({
        data: cachedPressureTrend,
        selection: pressureTrendSelection,
        timeZone: browserTimeZone,
      })
        ? cachedPressureTrend
        : null,
    [browserTimeZone, cachedPressureTrend, pressureTrendSelection]
  )
  const pressureTrendRequestKey = useMemo(
    () =>
      buildPressureTrendRequestKey({
        cacheVersion,
        timeZone: browserTimeZone,
        selection: pressureTrendSelection,
        clusters,
      }),
    [browserTimeZone, cacheVersion, clusters, pressureTrendSelection]
  )
  const mailboxIntelligenceSeedKey = useMemo(
    () =>
      [
        runtime.analysisScope,
        cacheVersion || 'default',
        ...clusters.map((cluster) =>
          [
            cluster.clusterId,
            cluster.clusterType,
            cluster.title,
            cluster.query,
            cluster.estimatedCount ?? '',
          ].join('::')
        ),
      ].join('|||'),
    [cacheVersion, clusters, runtime.analysisScope]
  )
  const [state, setState] = useState<LoadState>({
    status: 'idle',
    seedKey: null,
    data: null,
    error: null,
  })
  const [pressureTrendState, setPressureTrendState] = useState<PressureTrendLoadState>({
    status: 'idle',
    data: null,
    error: null,
    requestKey: null,
  })
  const pressureTrendAttemptedKeyRef = useRef<string | null>(null)
  const [workflowProgress, setWorkflowProgress] = useState<DecisionWorkspaceWorkflowProgress>({
    decidedSenderCount: 0,
    startedClusterCount: 0,
    latestClusterId: null,
    latestStage: null,
  })
  const [managementSignals, setManagementSignals] = useState<DecisionWorkspaceManagementSignals>({
    managedSenderCount: 0,
    archiveVerificationCount: 0,
    archiveFailureCount: 0,
    quarantineCount: 0,
    customRuleCount: 0,
    recentRestoreCount: 0,
  })

  const updatePressureTrendQuery = (nextSelection: PressureTrendSelection) => {
    const nextSearch = new URLSearchParams(searchParams.toString())
    nextSearch.set('pressure_window', nextSelection.window)
    if (nextSelection.window === 'custom' && nextSelection.start && nextSelection.end) {
      nextSearch.set('pressure_start', nextSelection.start)
      nextSearch.set('pressure_end', nextSelection.end)
    } else {
      nextSearch.delete('pressure_start')
      nextSearch.delete('pressure_end')
    }
    const nextQuery = nextSearch.toString()
    router.replace(nextQuery ? `${intelligencePathname}?${nextQuery}` : intelligencePathname, {
      scroll: false,
    })
  }
  const currentMailboxIntelligenceState = useMemo<LoadState>(() => {
    if (state.seedKey !== mailboxIntelligenceSeedKey) {
      return {
        status: 'idle',
        seedKey: mailboxIntelligenceSeedKey,
        data: null,
        error: null,
      }
    }
    return state
  }, [mailboxIntelligenceSeedKey, state])
  const mailboxIntelligenceRequestStateRef = useRef<LoadState>(currentMailboxIntelligenceState)
  useEffect(() => {
    mailboxIntelligenceRequestStateRef.current = currentMailboxIntelligenceState
  }, [currentMailboxIntelligenceState])
  const pressureTrendSeedRef = useRef<PressureTrendSeed>({
    window: pressureTrendSelection.window,
    start: pressureTrendSelection.start,
    end: pressureTrendSelection.end,
    timeZone: browserTimeZone,
    requestKey: pressureTrendRequestKey,
  })
  const pressureTrendInitialPaintLogRef = useRef<string | null>(null)
  const isPressureTrendInitialPaintPhase =
    pressureTrendState.status === 'idle' && !usableCachedPressureTrend
  const resolvedIntelligence =
    cachedIntelligence ||
    trustedRuntimeIntelligence ||
    (currentMailboxIntelligenceState.status === 'ready'
      ? currentMailboxIntelligenceState.data
      : latestStableIntelligence)
  const resolvedPressureTrendState = useMemo<PressureTrendLoadState>(
    () => {
      if (usableCachedPressureTrend) {
        return readyPressureTrendState(usableCachedPressureTrend, pressureTrendRequestKey)
      }
      const seedDecision = pressureTrendSeedDecision({
        candidates: [
          cachedIntelligence?.initial_pressure_trend
            ? {
                data: cachedIntelligence.initial_pressure_trend,
                source: 'cached_intelligence',
              }
            : null,
          trustedRuntimeIntelligence?.initial_pressure_trend
            ? {
                data: trustedRuntimeIntelligence.initial_pressure_trend,
                source: 'runtime_intelligence',
              }
            : null,
          currentMailboxIntelligenceState.status === 'ready' &&
          currentMailboxIntelligenceState.data.initial_pressure_trend
            ? {
                data: currentMailboxIntelligenceState.data.initial_pressure_trend,
                source: 'mailbox_intelligence_fetch',
              }
            : null,
        ],
        selection: pressureTrendSelection,
        defaultSelection: defaultPressureTrendSelection,
        timeZone: browserTimeZone,
        requestKey: pressureTrendRequestKey,
      })
      if (seedDecision.usable) {
        return readyPressureTrendState(seedDecision.candidate.data, seedDecision.requestKey)
      }
      return pressureTrendState
    },
    [
      browserTimeZone,
      cachedIntelligence,
      usableCachedPressureTrend,
      defaultPressureTrendSelection,
      pressureTrendRequestKey,
      pressureTrendSelection,
      pressureTrendState,
      currentMailboxIntelligenceState,
      trustedRuntimeIntelligence,
    ]
  )
  const initialPressureTrendSeedDecision = useMemo(
    () => {
      const candidates = [
        cachedIntelligence?.initial_pressure_trend
          ? {
              data: cachedIntelligence.initial_pressure_trend,
              source: 'cached_intelligence' as const,
            }
          : null,
        trustedRuntimeIntelligence?.initial_pressure_trend
          ? {
              data: trustedRuntimeIntelligence.initial_pressure_trend,
              source: 'runtime_intelligence' as const,
            }
          : null,
        currentMailboxIntelligenceState.status === 'ready' &&
        currentMailboxIntelligenceState.data.initial_pressure_trend
          ? {
              data: currentMailboxIntelligenceState.data.initial_pressure_trend,
              source: 'mailbox_intelligence_fetch' as const,
            }
          : null,
      ]

      if (
        trustedRuntimeIntelligence &&
        !trustedRuntimeIntelligence.initial_pressure_trend &&
        !cachedIntelligence?.initial_pressure_trend &&
        !(
          currentMailboxIntelligenceState.status === 'ready' &&
          currentMailboxIntelligenceState.data.initial_pressure_trend
        )
      ) {
        return { usable: false, reason: 'seed_absent_in_runtime_mailbox_intelligence' } satisfies PressureTrendSeedDecision
      }

      return pressureTrendSeedDecision({
        candidates,
        selection: pressureTrendSelection,
        defaultSelection: defaultPressureTrendSelection,
        timeZone: browserTimeZone,
        requestKey: pressureTrendRequestKey,
      })
    },
    [
      browserTimeZone,
      cachedIntelligence,
      defaultPressureTrendSelection,
      pressureTrendRequestKey,
      pressureTrendSelection,
      currentMailboxIntelligenceState,
      trustedRuntimeIntelligence,
    ]
  )
  const pressureTrendRequestPlanRef = useRef({
    clusters,
    cacheVersion,
    selection: pressureTrendSelection,
    timeZone: browserTimeZone,
    isInitialPaint: isPressureTrendInitialPaintPhase,
    seedDecision: initialPressureTrendSeedDecision,
  })
  useEffect(() => {
    pressureTrendRequestPlanRef.current = {
      clusters,
      cacheVersion,
      selection: pressureTrendSelection,
      timeZone: browserTimeZone,
      isInitialPaint: isPressureTrendInitialPaintPhase,
      seedDecision: initialPressureTrendSeedDecision,
    }
  }, [
    browserTimeZone,
    cacheVersion,
    clusters,
    initialPressureTrendSeedDecision,
    isPressureTrendInitialPaintPhase,
    pressureTrendSelection,
  ])
  const canRequestPressureTrend =
    clusters.length > 0 &&
    !usableCachedPressureTrend &&
    Boolean(resolvedIntelligence) &&
    !(isPressureTrendInitialPaintPhase && initialPressureTrendSeedDecision.usable)

  useEffect(() => {
    pressureTrendSeedRef.current = {
      window: pressureTrendSelection.window,
      start: pressureTrendSelection.start,
      end: pressureTrendSelection.end,
      timeZone: browserTimeZone,
      requestKey: pressureTrendRequestKey,
    }
  }, [
    browserTimeZone,
    pressureTrendRequestKey,
    pressureTrendSelection.end,
    pressureTrendSelection.start,
    pressureTrendSelection.window,
  ])

  useEffect(() => {
    if (!isPressureTrendInitialPaintPhase) return
    if (clusters.length === 0) return
    if (pressureTrendInitialPaintLogRef.current === pressureTrendRequestKey) return

    if (initialPressureTrendSeedDecision.usable) {
      console.info('pressure_trend_initial_paint_seed_applied', {
        source: initialPressureTrendSeedDecision.candidate.source,
        request_key: pressureTrendRequestKey,
        window: pressureTrendSelection.window,
        start: pressureTrendSelection.start,
        end: pressureTrendSelection.end,
        time_zone: browserTimeZone,
      })
      pressureTrendInitialPaintLogRef.current = pressureTrendRequestKey
      return
    }

    console.info(
      `pressure_trend_initial_paint_seed_skipped_reason: ${initialPressureTrendSeedDecision.reason}`,
      {
        request_key: pressureTrendRequestKey,
        window: pressureTrendSelection.window,
        start: pressureTrendSelection.start,
        end: pressureTrendSelection.end,
        time_zone: browserTimeZone,
      }
    )
    pressureTrendInitialPaintLogRef.current = pressureTrendRequestKey
  }, [
    browserTimeZone,
    clusters.length,
    initialPressureTrendSeedDecision,
    isPressureTrendInitialPaintPhase,
    pressureTrendRequestKey,
    pressureTrendSelection.end,
    pressureTrendSelection.start,
    pressureTrendSelection.window,
  ])

  useEffect(() => {
    if (!initialPressureTrendSeedDecision.usable) return

    intelligenceService.primeCachedActivitySeries({
      clusters,
      cacheVersion,
      pressureWindow: pressureTrendSelection.window,
      pressureStart: pressureTrendSelection.start,
      pressureEnd: pressureTrendSelection.end,
      timeZone: browserTimeZone,
      data: initialPressureTrendSeedDecision.candidate.data,
    })
  }, [
    browserTimeZone,
    cacheVersion,
    clusters,
    intelligenceService,
    initialPressureTrendSeedDecision,
    pressureTrendSelection.end,
    pressureTrendSelection.start,
    pressureTrendSelection.window,
  ])

  useEffect(() => {
    if (clusters.length === 0) return
    if (cachedIntelligence || trustedRuntimeIntelligence || latestStableIntelligence) return
    const requestState = mailboxIntelligenceRequestStateRef.current
    if (requestState.seedKey === mailboxIntelligenceSeedKey && requestState.status !== 'idle') {
      return
    }

    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      const loadingState: LoadState = {
        status: 'loading',
        seedKey: mailboxIntelligenceSeedKey,
        data: null,
        error: null,
      }
      mailboxIntelligenceRequestStateRef.current = loadingState
      setState(loadingState)

      let attempt = 0
      while (!cancelled) {
        const result = await intelligenceService.fetchIntelligence({
          clusters,
          analysisScopeId: runtime.analysisScope,
          cacheVersion,
          initialPressureWindow: pressureTrendSelection.window,
          initialPressureStart: pressureTrendSelection.start,
          initialPressureEnd: pressureTrendSelection.end,
          initialTimeZone: browserTimeZone,
          requestContext: {
            source: 'operations_intelligence_page',
            component: 'mailbox_intelligence',
            reason: 'mailbox_intelligence_seed_miss',
            phase: 'deferred',
          },
        })

        if (cancelled || (!result.ok && result.aborted)) return
        if (!result.ok) {
          if (attempt < 20 && isTransientInboxAnalysisGuardError(result.error)) {
            attempt += 1
            await delayMs(1200)
            continue
          }
          const errorState: LoadState = {
            status: 'error',
            seedKey: mailboxIntelligenceSeedKey,
            data: null,
            error: result.error,
          }
          mailboxIntelligenceRequestStateRef.current = errorState
          setState(errorState)
          return
        }
        const readyState: LoadState = {
          status: 'ready',
          seedKey: mailboxIntelligenceSeedKey,
          data: result.data,
          error: null,
        }
        mailboxIntelligenceRequestStateRef.current = readyState
        setState(readyState)
        return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    browserTimeZone,
    cacheVersion,
    cachedIntelligence,
    clusters,
    latestStableIntelligence,
    intelligenceService,
    mailboxIntelligenceSeedKey,
    pressureTrendSelection.end,
    pressureTrendSelection.start,
    pressureTrendSelection.window,
    runtime.analysisScope,
    trustedRuntimeIntelligence,
  ])

  useEffect(() => {
    if (!canRequestPressureTrend) return
    if (pressureTrendAttemptedKeyRef.current === pressureTrendRequestKey) return
    pressureTrendAttemptedKeyRef.current = pressureTrendRequestKey

    const requestPlan = pressureTrendRequestPlanRef.current
    const controller = new AbortController()
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setPressureTrendState({
        status: 'loading',
        data: null,
        error: null,
        requestKey: pressureTrendRequestKey,
      })
    })
    const allowRequestAbort = !requestPlan.isInitialPaint
    const fetchReason =
      requestPlan.isInitialPaint && !requestPlan.seedDecision.usable
        ? requestPlan.seedDecision.reason
        : !requestPlan.isInitialPaint
          ? 'interactive_window_change'
          : null

    if (fetchReason && requestPlan.isInitialPaint) {
      console.info(`pressure_trend_initial_paint_fetch_required_reason: ${fetchReason}`, {
        request_key: pressureTrendRequestKey,
        window: requestPlan.selection.window,
        start: requestPlan.selection.start,
        end: requestPlan.selection.end,
        time_zone: requestPlan.timeZone,
      })
    }

    void intelligenceService.fetchActivitySeries({
      clusters: requestPlan.clusters,
      cacheVersion: requestPlan.cacheVersion,
      pressureWindow: requestPlan.selection.window,
      pressureStart: requestPlan.selection.start,
      pressureEnd: requestPlan.selection.end,
      timeZone: requestPlan.timeZone,
      requestContext: {
        source: 'operations_intelligence_page',
        component: 'pressure_trend',
        reason: requestPlan.isInitialPaint
          ? 'pressure_trend_initial_paint_seed_miss'
          : 'pressure_trend_window_change',
        phase: requestPlan.isInitialPaint ? 'deferred' : 'interactive',
      },
      signal: allowRequestAbort ? controller.signal : undefined,
    }).then((result) => {
      if (cancelled || (!result.ok && result.aborted)) return
      if (!result.ok) {
        setPressureTrendState({
          status: 'error',
          data: null,
          error: result.error,
          requestKey: pressureTrendRequestKey,
        })
        return
      }
      setPressureTrendState({
        status: 'ready',
        data: result.data,
        error: null,
        requestKey: pressureTrendRequestKey,
      })
    })

    return () => {
      cancelled = true
      if (allowRequestAbort) controller.abort()
    }
  }, [
    canRequestPressureTrend,
    intelligenceService,
    pressureTrendRequestKey,
  ])

  useEffect(() => {
    if (typeof window === 'undefined' || !agentId) return

    const syncProgress = () => {
      setWorkflowProgress(
        intelligenceService.readWorkflowProgress({
          agentId,
          sessionId: runtime.sessionId || requestedSessionId || null,
          cacheVersion,
          clusters,
        })
      )
    }

    syncProgress()
    window.addEventListener('storage', syncProgress)
    window.addEventListener('focus', syncProgress)
    return () => {
      window.removeEventListener('storage', syncProgress)
      window.removeEventListener('focus', syncProgress)
    }
  }, [agentId, cacheVersion, clusters, intelligenceService, requestedSessionId, runtime.sessionId])

  useEffect(() => {
    if (!agentId) return
    let cancelled = false

    const loadManagementSummary = () => {
      void intelligenceService.readManagementSignals({ agentId }).then((signals) => {
        if (cancelled || !signals) return
        setManagementSignals(signals)
      })
    }

    loadManagementSummary()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', loadManagementSummary)
    }

    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', loadManagementSummary)
      }
    }
  }, [agentId, intelligenceService])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-4 text-sm text-gray-300">
        Loading {healthSlot.title}…
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
        No {presentation.nouns.subjectPlural.toLowerCase()} are available for {reviewGroupsSlot.title} yet.
        Refresh cleanup analysis to populate {healthSlot.title}.
      </section>
    )
  }

  if (currentMailboxIntelligenceState.status === 'error' && !resolvedIntelligence) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {currentMailboxIntelligenceState.error}
      </section>
    )
  }

  if (!resolvedIntelligence) {
    const pendingApprovals = runtime.data?.runtime_approval_queue_summary?.pending || 0
    const nextRuntimeCluster = intelligenceService.recommendRuntimeReviewGroup({
      groups: clusters,
      latestClusterId: workflowProgress.latestClusterId,
    }).group
    const nextRuntimeActionHref = nextRuntimeCluster
      ? `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(nextRuntimeCluster.clusterId)}`
      : null
    const resumeStage = workflowProgress.latestStage === 'decision' ? 'decision' : 'overview'
    const resumeRuntimeHref =
      workflowProgress.latestClusterId
        ? `/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(workflowProgress.latestClusterId)}${resumeStage === 'decision' ? '&mode=decision' : ''}`
        : null

    return (
      <div className="space-y-4">
        <MailboxIntelligenceLoadingState
          pendingApprovals={pendingApprovals}
          startedClusterCount={workflowProgress.startedClusterCount}
          decidedSenderCount={workflowProgress.decidedSenderCount}
          clusterCount={clusters.length}
          resumeHref={resumeRuntimeHref}
          nextActionHref={nextRuntimeActionHref}
        />
      </div>
    )
  }

  const pendingApprovals = runtime.data?.runtime_approval_queue_summary?.pending || 0
  const nextClusterRecommendation = intelligenceService.recommendArtifactReviewGroup({
    groups: resolvedIntelligence.cleanup_groups,
    latestClusterId: workflowProgress.latestClusterId,
  })
  const nextCluster = nextClusterRecommendation.group
  const resumeCluster =
    workflowProgress.latestClusterId &&
    resolvedIntelligence.cleanup_groups.find(
      (cluster) => workflowClusterIdFromArtifactCluster(cluster) === workflowProgress.latestClusterId
    )
      ? resolvedIntelligence.cleanup_groups.find(
          (cluster) => workflowClusterIdFromArtifactCluster(cluster) === workflowProgress.latestClusterId
        ) || null
      : null
  const resumeStage = workflowProgress.latestStage === 'decision' ? 'decision' : 'overview'
  const trend = healthTrend(resolvedIntelligence)
  const displayedPressureTrendState: PressureTrendLoadState =
    clusters.length === 0
      ? { status: 'idle', data: null, error: null, requestKey: null }
      : resolvedPressureTrendState
  const pressureTrendLoading =
    clusters.length > 0 && displayedPressureTrendState.requestKey !== pressureTrendRequestKey
  const pressureTrendData =
    !pressureTrendLoading && displayedPressureTrendState.status === 'ready'
      ? displayedPressureTrendState.data
      : null
  const pressureTrendSummary = pressureTrendData ? chartPressureTrend(pressureTrendData) : null
  const customRangeMin = dateInputValueFromIso(
    resolvedIntelligence.whole_mailbox.indexed_date_span_start,
    browserTimeZone
  )
  const customRangeMax = dateInputValueFromIso(
    resolvedIntelligence.whole_mailbox.indexed_date_span_end,
    browserTimeZone
  )
  const healthIntelligence = buildMailboxHealthIntelligence({
    data: resolvedIntelligence,
    syncHealth: runtime.mailboxIndexHealth?.sync_health,
    pendingApprovals,
    workflowProgress,
    managedSenderCount: managementSignals.managedSenderCount,
    nextCluster,
    nextClusterReason: nextClusterRecommendation.reason,
    resumeCluster,
  })
  const confirmationClusterId =
    workflowProgress.latestClusterId ||
    workflowClusterIdFromArtifactCluster(resumeCluster) ||
    workflowClusterIdFromArtifactCluster(nextCluster) ||
    null
  const nextActionHref =
    healthIntelligence.nextActionMode === 'approve_queue' && confirmationClusterId
      ? `/agents/${agentId}/operations/management${query}`
      : healthIntelligence.nextActionMode === 'resume_work' && resumeCluster
      ? `/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(workflowClusterIdFromArtifactCluster(resumeCluster) || resumeCluster.cluster_id)}${resumeStage === 'decision' ? '&mode=decision' : ''}`
      : healthIntelligence.nextActionMode === 'open_group' && nextCluster
        ? `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(workflowClusterIdFromArtifactCluster(nextCluster) || nextCluster.cluster_id)}`
        : null

  return (
    <div className="space-y-4">
      <InboxHealthGauge
        score={healthIntelligence.score}
        healthState={healthIntelligence.state}
        indexedStateLabel={indexReadinessLabel(runtime.mailboxIndexHealth?.sync_health)}
        contextMetrics={{
          totalSenderCount: resolvedIntelligence.whole_mailbox.sender_count,
          totalSupportingMessageCount: resolvedIntelligence.whole_mailbox.message_count,
          underReviewSenderCount: resolvedIntelligence.cleanup_candidate_universe.sender_count,
          decidedSenderCount: managementSignals.managedSenderCount,
        }}
        managementSignals={{
          approvalsWaiting: pendingApprovals,
          archiveVerificationCount: managementSignals.archiveVerificationCount,
          archiveFailureCount: managementSignals.archiveFailureCount,
          quarantineCount: managementSignals.quarantineCount,
          customRuleCount: managementSignals.customRuleCount,
          recentRestoreCount: managementSignals.recentRestoreCount,
        }}
        primaryDriver={healthIntelligence.primaryDriver}
        driverInsight={healthIntelligence.driverWhyNow}
        recommendedIntervention={healthIntelligence.recommendedIntervention}
        interventionInsight={healthIntelligence.interventionWhyBest}
        expectedImpact={healthIntelligence.expectedImpact}
        impactInsight={healthIntelligence.impactConfidence}
        explanation={`Inbox health reflects decision coverage across the indexed sender universe. ${managementSignals.managedSenderCount.toLocaleString()} of ${resolvedIntelligence.whole_mailbox.sender_count.toLocaleString()} senders already have committed decisions, so ${Math.max(resolvedIntelligence.whole_mailbox.sender_count - managementSignals.managedSenderCount, 0).toLocaleString()} still need review. Message counts describe impact only; they do not define whether the inbox is clean.`}
      />

      <MailboxMissionPanel
        healthLabel={indexReadinessLabel(runtime.mailboxIndexHealth?.sync_health)}
        pendingApprovals={pendingApprovals}
        cleanupGroupCount={resolvedIntelligence.cleanup_groups.length}
        cleanupSenderCount={resolvedIntelligence.cleanup_candidate_universe.sender_count}
        cleanupMessageCount={resolvedIntelligence.cleanup_candidate_universe.message_count}
        protectedSenderCount={resolvedIntelligence.protected_safe_context.protected_sender_count}
        wholeMailboxSenderCount={resolvedIntelligence.whole_mailbox.sender_count}
        wholeMailboxMessageCount={resolvedIntelligence.whole_mailbox.message_count}
        healthTrendLabel={trend.label}
        healthTrendDetail={trend.detail}
        healthIntelligence={healthIntelligence}
        decidedSenderCount={workflowProgress.decidedSenderCount}
        startedClusterCount={workflowProgress.startedClusterCount}
        nextCluster={
          nextCluster
            ? {
                clusterId: workflowClusterIdFromArtifactCluster(nextCluster) || nextCluster.cluster_id,
                title: nextCluster.title,
                senderCount: nextCluster.sender_count,
                sharePct: nextCluster.share_pct,
                messageCount: nextCluster.message_count,
              }
            : null
        }
        resumeTask={
          resumeCluster
            ? {
                title: resumeCluster.title,
                stageLabel: resumeStage === 'decision' ? 'Decision Mode' : 'Sender Overview',
                href: `/agents/${agentId}/operations/review${query}${query ? '&' : '?'}cluster_id=${encodeURIComponent(workflowClusterIdFromArtifactCluster(resumeCluster) || resumeCluster.cluster_id)}${resumeStage === 'decision' ? '&mode=decision' : ''}`,
              }
            : null
        }
        nextActionHref={nextActionHref}
        approvalHref={confirmationClusterId ? `/agents/${agentId}/operations/management${query}` : null}
      />

      <MailboxIntelligenceDashboard
        groups={resolvedIntelligence.cleanup_groups}
        openGroupsHref={`/agents/${agentId}/operations/clusters${query}`}
        recommendedCleanupGroup={nextCluster}
        recommendedCleanupGroupReason={nextClusterRecommendation.reason}
        managementSignals={{
          approvalsWaiting: pendingApprovals,
          archiveVerificationCount: managementSignals.archiveVerificationCount,
          archiveFailureCount: managementSignals.archiveFailureCount,
          quarantineCount: managementSignals.quarantineCount,
          customRuleCount: managementSignals.customRuleCount,
          recentRestoreCount: managementSignals.recentRestoreCount,
        }}
        approvalHref={confirmationClusterId ? `/agents/${agentId}/operations/management${query}` : null}
        managementHref={`/agents/${agentId}/operations/management${query}`}
        pressureTrend={pressureTrendSummary}
        pressureTrendSeries={pressureTrendData?.series || null}
        nextActionTitle={healthIntelligence.nextActionTitle}
        nextActionDetail={healthIntelligence.nextActionDetail}
        pressureTrendSelection={pressureTrendSelection}
        pressureTrendLoading={pressureTrendLoading}
        pressureTrendError={
          !pressureTrendLoading && displayedPressureTrendState.status === 'error'
            ? displayedPressureTrendState.error
            : null
        }
        pressureTrendRangeDetail={
          pressureTrendData ? pressureTrendRangeDetail(pressureTrendData) : null
        }
        pressureTrendCoverageMin={customRangeMin}
        pressureTrendCoverageMax={customRangeMax}
        onSelectPressureTrendWindow={(window) =>
          updatePressureTrendQuery({ window, start: null, end: null })
        }
        onApplyPressureTrendCustomRange={(start, end) =>
          updatePressureTrendQuery({ window: 'custom', start, end })
        }
        buildClusterHref={(clusterId) =>
          `/agents/${agentId}/operations/clusters${query}${query ? '&' : '?'}focus_cluster=${encodeURIComponent(clusterId)}`
        }
      />
    </div>
  )
}
