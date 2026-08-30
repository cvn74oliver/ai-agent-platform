'use client'

import Link from 'next/link'
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import type {
  GmailCleanupRuleIntent,
  GmailCleanupStage,
  GmailConfirmationPreviewData,
  GmailDestinationExecutionState,
  GmailDestinationState,
  GmailMailboxIntelligenceData,
  GmailMonitoringSummaryData,
  GmailPressureTrendData,
  GmailPressureTrendWindow,
  GmailScopeLadderCounts,
  GmailSenderPolicy,
  GmailSenderWorkspaceData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import { GMAIL_CLEANUP_ACTIVE_STAGES } from '@/lib/runtime/gmailCleanupWorkspace'
import {
  buildCleanupGroupInternalStructure,
  getCleanupGroupRecommendationExplanation,
  type CleanupGroupRecommendationReason,
} from '@/lib/runtime/cleanupGroupPresentation'
import {
  buildGmailSemanticPresentationPolicy,
  gmailSemanticFamilyDisplayLabel,
  gmailSemanticPatternClassDisplayLabel,
} from '@/lib/runtime/gmailSemanticPresentationPolicy'
import type {
  OptionalEvidenceDetailAvailability,
  OptionalEvidenceDetailOperatorAction,
} from '@/lib/runtime/optionalEvidenceDetail'

type TimeContextChartScope =
  | 'all_indexed'
  | 'last_year'
  | 'last_quarter'
  | 'last_month'
  | 'last_week'
  | 'last_day'
  | 'custom'

const DEFAULT_TIME_CONTEXT_VISIBLE_CHART_SCOPES: readonly TimeContextChartScope[] = [
  'all_indexed',
  'last_year',
  'last_quarter',
  'last_month',
  'last_week',
  'last_day',
  'custom',
]

type ScopeStep = {
  key: keyof GmailScopeLadderCounts
  label: string
  reason: string
}

const SCOPE_STEPS: ScopeStep[] = [
  {
    key: 'whole_mailbox',
    label: 'Whole mailbox',
    reason: 'Every indexed message provides sender history and safety context.',
  },
  {
    key: 'cleanup_candidate_universe',
    label: 'Cleanup candidate universe',
    reason: 'Only senders that fit current cleanup groups move forward.',
  },
  {
    key: 'cleanup_group',
    label: 'Cleanup group',
    reason: 'One sender cluster is selected so review stays manageable.',
  },
  {
    key: 'sender_set',
    label: 'Sender set',
    reason: 'The decision object is the sender, not individual messages.',
  },
  {
    key: 'loaded_preview_rows',
    label: 'Visible evidence rows',
    reason: 'Only the current evidence slice is on screen. The decision scope is still the sender set.',
  },
]

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value
  return new Date(parsed).toLocaleDateString()
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function cleanupGroupShareLabel(sharePct: number | null | undefined): string {
  if (sharePct == null || !Number.isFinite(sharePct)) return 'Impact share pending'
  if (sharePct <= 0) return '<1% of cleanup message volume'
  return `${Math.round(sharePct)}% of cleanup message volume`
}

function policyClass(policy: GmailSenderPolicy): string {
  if (policy === 'archive') return 'border-amber-700/60 bg-amber-950/30 text-amber-100'
  if (policy === 'keep') return 'border-emerald-700/60 bg-emerald-950/30 text-emerald-100'
  if (policy === 'quarantine') return 'border-orange-700/60 bg-orange-950/30 text-orange-100'
  if (policy === 'unsubscribe') return 'border-fuchsia-700/60 bg-fuchsia-950/30 text-fuchsia-100'
  if (policy === 'custom_rule') return 'border-sky-700/60 bg-sky-950/30 text-sky-100'
  return 'border-gray-700 bg-gray-900/60 text-gray-300'
}

function labelForPolicy(policy: Exclude<GmailSenderPolicy, 'undecided'>): string {
  if (policy === 'archive') return 'Archive'
  if (policy === 'keep') return 'Keep'
  if (policy === 'quarantine') return 'Quarantine'
  if (policy === 'unsubscribe') return 'Unsubscribe'
  return 'Custom Rule'
}

function policyFromDestinationState(state: GmailDestinationState): Exclude<GmailSenderPolicy, 'undecided'> {
  if (state === 'KEEP') return 'keep'
  if (state === 'ARCHIVE') return 'archive'
  if (state === 'QUARANTINE') return 'quarantine'
  if (state === 'UNSUBSCRIBE') return 'unsubscribe'
  return 'custom_rule'
}

function labelForDestinationState(state: GmailDestinationState): string {
  return labelForPolicy(policyFromDestinationState(state))
}

function labelForExecutionState(state: GmailDestinationExecutionState): string {
  if (state === 'not_applicable') return 'Not applicable'
  if (state === 'pending') return 'Pending'
  if (state === 'succeeded') return 'Succeeded'
  if (state === 'failed') return 'Failed'
  return 'Deferred'
}

function storedLaterPolicyLabel(
  policy: Exclude<GmailSenderPolicy, 'archive' | 'undecided'>
): string {
  if (policy === 'keep') return 'Keep preference saved'
  if (policy === 'quarantine') return 'Quarantine preference saved'
  if (policy === 'unsubscribe') return 'Unsubscribe preference saved'
  return 'Custom rule idea saved'
}

function confirmationPolicyTitle(policy: GmailSenderPolicy): string {
  if (policy === 'archive') return 'Archive now after approval'
  if (policy === 'keep') return 'Keep preference saved'
  if (policy === 'quarantine') return 'Quarantine preference saved'
  if (policy === 'unsubscribe') return 'Unsubscribe preference saved'
  if (policy === 'custom_rule') return 'Custom rule idea saved'
  return 'Leave untouched for now'
}

function confirmationPolicyDescription(policy: GmailSenderPolicy): string {
  if (policy === 'archive') {
    return 'Executes now after approval by removing the INBOX label from the exact matching messages.'
  }
  if (policy === 'keep') {
    return 'Stored for later in Phase 1 so this sender stays visible. Gmail does not change yet.'
  }
  if (policy === 'quarantine') {
    return 'Stored for later in Phase 1 as a quarantine preference. No quarantine move happens yet.'
  }
  if (policy === 'unsubscribe') {
    return 'Stored for later in Phase 1 as unsubscribe intent. No unsubscribe request is sent yet.'
  }
  if (policy === 'custom_rule') {
    return 'Stored for later in Phase 1 as custom-rule intent. The rule editor and executor arrive in a later phase.'
  }
  return 'No decision is stored yet, so this sender stays exactly as-is until you return.'
}

function stageTabClass(active: boolean): string {
  return active
    ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
    : 'border-slate-500/35 bg-[linear-gradient(180deg,rgba(23,31,44,0.96),rgba(14,20,30,0.96))] text-slate-200 hover:border-slate-400/55 hover:bg-[linear-gradient(180deg,rgba(29,38,52,0.98),rgba(17,23,34,0.98))] hover:text-white'
}

const neutralNestedSurfaceClass = 'app-surface-card-nested'
const neutralInsetSurfaceClass = 'app-surface-card-inset'
const neutralPillSurfaceClass = 'app-surface-card-tile'
const quietControlSurfaceClass =
  'app-surface-card-tile text-slate-200 hover:border-slate-400/55 hover:bg-[linear-gradient(180deg,rgba(30,40,55,0.98),rgba(17,24,35,0.98))] hover:text-white'
const quietSecondaryActionClass = quietControlSurfaceClass

function metricCard(title: string, value: string, subtitle: string, accent: string) {
  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl ${accent} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-200">{subtitle}</p>
    </div>
  )
}

function metricMeterCard(props: {
  title: string
  value: string
  subtitle: string
  accentClass: string
  titleClass?: string
  valueClass?: string
}) {
  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl ${props.accentClass} p-4`}>
      <p
        className={`text-center text-[10px] uppercase tracking-[0.22em] ${
          props.titleClass || 'text-slate-300'
        }`}
      >
        {props.title}
      </p>
      <p
        className={`mt-2 text-center text-5xl font-semibold tracking-tight ${
          props.valueClass || 'text-white'
        }`}
      >
        {props.value}
      </p>
      <p className="mt-3 text-center text-sm leading-5 text-slate-200">{props.subtitle}</p>
    </div>
  )
}

function sectionCard(title: string, subtitle: string, children: ReactNode) {
  return (
    <section className="app-surface-card rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{title}</p>
        <p className="mt-1 text-sm text-slate-200">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function insightCard(title: string, value: string, subtitle: string) {
  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
      <p className="text-[10px] uppercase tracking-wide text-slate-300">{title}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-200">{subtitle}</p>
    </div>
  )
}

function diagnosticRow(label: string, value: string, detail?: string) {
  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-200">{detail}</p> : null}
    </div>
  )
}

function loadingSkeleton(className: string) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[linear-gradient(90deg,rgba(36,49,66,0.72),rgba(24,34,47,0.96),rgba(36,49,66,0.72))] ${className}`}
    />
  )
}

type ManagementSignalsData = {
  approvalsWaiting: number
  archiveVerificationCount: number
  archiveFailureCount: number
  quarantineCount: number
  customRuleCount: number
  recentRestoreCount: number
}

const EMPTY_PRESSURE_TREND_SERIES: GmailPressureTrendData['series'] = []

export function MailboxContextMetrics(props: {
  totalSenderCount: number
  totalSupportingMessageCount: number
  underReviewSenderCount: number
  decidedSenderCount: number
}) {
  const senderUniverse = Math.max(props.totalSenderCount, 1)
  const messageDensity = props.totalSupportingMessageCount / senderUniverse
  const reviewRatio = props.underReviewSenderCount / senderUniverse
  const decisionRatio = props.decidedSenderCount / senderUniverse

  return (
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      {metricMeterCard({
        title: 'Indexed senders',
        value: props.totalSenderCount.toLocaleString(),
        subtitle: 'Total sender universe in scope for cleanup decisions.',
        accentClass: 'border-[var(--app-border-muted)] bg-[var(--app-surface-nested)]',
        titleClass: 'text-slate-500',
        valueClass: 'text-white',
      })}
      {metricMeterCard({
        title: 'Supporting messages',
        value: `~${props.totalSupportingMessageCount.toLocaleString()}`,
        subtitle: `Message pressure behind the indexed sender universe. ~${messageDensity.toFixed(1)} messages per indexed sender.`,
        accentClass: 'border-violet-950/60 bg-violet-950/10',
        titleClass: 'text-violet-300/70',
        valueClass: 'text-violet-100',
      })}
      {metricMeterCard({
        title: 'Senders in review',
        value: props.underReviewSenderCount.toLocaleString(),
        subtitle: `${Math.round(reviewRatio * 100)}% of indexed senders are currently surfaced for review.`,
        accentClass: 'border-cyan-950/60 bg-cyan-950/10',
        titleClass: 'text-cyan-300/80',
        valueClass: 'text-cyan-100',
      })}
      {metricMeterCard({
        title: 'Senders already decided',
        value: props.decidedSenderCount.toLocaleString(),
        subtitle: `${Math.round(decisionRatio * 100)}% of indexed senders. Current decided coverage snapshot.`,
        accentClass: 'border-emerald-950/60 bg-emerald-950/10',
        titleClass: 'text-emerald-300/75',
        valueClass: 'text-emerald-100',
      })}
    </section>
  )
}

function ManagementSignalsSection(props: {
  managementSignals: ManagementSignalsData
  approvalHref: string | null
  managementHref: string | null
}) {
  const primaryManagementSignal = {
    label: 'Approvals waiting',
    value: props.managementSignals.approvalsWaiting.toLocaleString(),
    detail:
      props.managementSignals.approvalsWaiting > 0
        ? 'Approvals are the only thing stopping visible inbox reduction right now.'
        : 'No approvals are currently blocking visible inbox reduction.',
    actionLabel: props.approvalHref ? 'Open Management' : null,
    href: props.approvalHref,
  }
  const secondaryManagementSignalRows = [
    {
      label: 'Archive follow-up',
      value: props.managementSignals.archiveVerificationCount.toLocaleString(),
      detail:
        props.managementSignals.archiveVerificationCount > 0
          ? 'Archive work exists, but some inbox removals still need follow-up before the result is fully trusted.'
          : 'No senders currently need archive follow-up before the result is fully trusted.',
      actionLabel: props.managementHref ? 'Open Management' : null,
      href: props.managementHref,
      emphasis: 'actionable' as const,
      valueClass: 'text-cyan-100',
      labelClass: 'text-cyan-100/80',
      detailClass: 'text-cyan-50/78',
      rowClass: 'bg-cyan-950/12',
    },
    {
      label: 'Quarantine states',
      value: props.managementSignals.quarantineCount.toLocaleString(),
      detail:
        props.managementSignals.quarantineCount > 0
          ? 'These senders already have quarantine intent, so they count toward decision coverage even though execution is deferred in Phase 1.'
          : 'No senders currently sit in quarantine intent within this management snapshot.',
      actionLabel: null,
      href: null,
      emphasis: 'info' as const,
      valueClass: 'text-orange-100',
      labelClass: 'text-orange-100/78',
      detailClass: 'text-white/68',
      rowClass: 'bg-transparent',
    },
    {
      label: 'Rule-covered senders',
      value: props.managementSignals.customRuleCount.toLocaleString(),
      detail:
        props.managementSignals.customRuleCount > 0
          ? 'These senders already have custom-rule intent, which improves coverage now and sets up future automation.'
          : 'No senders currently have custom-rule intent contributing to this snapshot.',
      actionLabel: null,
      href: null,
      emphasis: 'info' as const,
      valueClass: 'text-violet-100',
      labelClass: 'text-violet-100/80',
      detailClass: 'text-white/68',
      rowClass: 'bg-transparent',
    },
    {
      label: 'Recent restores',
      value: props.managementSignals.recentRestoreCount.toLocaleString(),
      detail:
        props.managementSignals.recentRestoreCount > 0
          ? 'Recently restored senders have re-entered active management attention and may need a fresh decision.'
          : 'No recent restore activity is currently pushing senders back into active management attention.',
      actionLabel: null,
      href: null,
      emphasis: 'info' as const,
      valueClass: 'text-slate-100',
      labelClass: 'text-slate-100/78',
      detailClass: 'text-white/68',
      rowClass: 'bg-transparent',
    },
  ] as Array<{
    label: string
    value: string
    detail: string
    actionLabel: string | null
    href: string | null
    emphasis: 'actionable' | 'info'
    valueClass: string
    labelClass: string
    detailClass: string
    rowClass: string
  }>

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
          Management signals
        </p>
        <p className="text-xs text-slate-300">
          Execution friction and downstream state that materially affects inbox health
        </p>
      </div>
      <div className="app-surface-card overflow-hidden rounded-3xl xl:flex xl:items-stretch">
        <div className="flex flex-col border-b border-white/8 bg-amber-950/35 p-5 xl:min-h-[19rem] xl:flex-[1.05] xl:border-b-0 xl:border-r xl:border-r-white/8 xl:p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/82">
            {primaryManagementSignal.label}
          </p>
          <p className="mt-3 text-5xl font-semibold leading-none text-white sm:text-6xl">
            {primaryManagementSignal.value}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-5 text-white/92">
            {primaryManagementSignal.detail}
          </p>
          {primaryManagementSignal.href && primaryManagementSignal.actionLabel ? (
            <div className="mt-auto pt-5">
              <Link
                href={primaryManagementSignal.href}
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-gray-950 shadow-[0_10px_24px_rgba(252,211,77,0.22)] hover:bg-amber-200 xl:w-auto xl:min-w-[12rem]"
              >
                {primaryManagementSignal.actionLabel}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="min-h-0 bg-[linear-gradient(180deg,rgba(22,30,43,0.72),rgba(13,19,29,0.72))] xl:flex-[0.95] xl:self-stretch">
          <div className="grid h-full min-h-0 xl:grid-rows-4">
            {secondaryManagementSignalRows.map((signal, index) => (
              <div
                key={signal.label}
                className={`flex min-h-0 flex-col justify-center px-4 py-3 sm:px-5 xl:px-6 xl:py-0 ${
                  index < secondaryManagementSignalRows.length - 1 ? 'border-b border-white/8' : ''
                } ${signal.rowClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <p className={`text-2xl font-semibold leading-none ${signal.valueClass}`}>
                        {signal.value}
                      </p>
                      <p className={`min-w-0 text-[10px] uppercase tracking-[0.24em] ${signal.labelClass}`}>
                        {signal.label}
                      </p>
                    </div>
                    <p
                      className={`mt-1.5 min-w-0 text-xs leading-4 xl:overflow-hidden xl:text-ellipsis xl:whitespace-nowrap ${signal.detailClass}`}
                    >
                      {signal.detail}
                    </p>
                  </div>
                  {signal.href && signal.actionLabel ? (
                    <Link
                      href={signal.href}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-black/30"
                    >
                      {signal.actionLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function healthSeverityMeta(score: number, state: string): {
  label: string
  badgeClass: string
  scoreClass: string
} {
  if (state === 'Unavailable' || state === 'Not indexed yet') {
    return {
      label: state,
      badgeClass: 'border-[var(--app-border-muted)] bg-[var(--app-surface-3)] text-gray-200',
      scoreClass: 'text-gray-200',
    }
  }
  if (score >= 80) {
    return {
      label: 'Healthy',
      badgeClass: 'border-emerald-700/50 bg-emerald-950/20 text-emerald-100',
      scoreClass: 'text-emerald-200',
    }
  }
  if (score >= 60) {
    return {
      label: 'Stable',
      badgeClass: 'border-cyan-700/50 bg-cyan-950/20 text-cyan-100',
      scoreClass: 'text-cyan-100',
    }
  }
  if (score >= 40) {
    return {
      label: 'Warning',
      badgeClass: 'border-amber-700/50 bg-amber-950/20 text-amber-100',
      scoreClass: 'text-amber-100',
    }
  }
  if (score >= 20) {
    return {
      label: 'Degraded',
      badgeClass: 'border-orange-700/50 bg-orange-950/20 text-orange-100',
      scoreClass: 'text-orange-100',
    }
  }
  return {
    label: 'Critical',
    badgeClass: 'border-rose-700/50 bg-rose-950/20 text-rose-100',
    scoreClass: 'text-rose-100',
  }
}

function maxChartValue(values: number[]): number {
  const max = Math.max(...values, 0)
  return max > 0 ? max : 1
}

export function HorizontalBarChart(props: {
  title: string
  items: Array<{ id?: string; label: string; value: number; detail?: string }>
  accentClass: string
  activeId?: string | null
  activeLabel?: string | null
  onItemClick?: (item: { id?: string; label: string; value: number; detail?: string }) => void
  description?: string
  emptyStateTitle?: string
  emptyStateDetail?: string
  scaleMode?: 'relative_visible_max' | 'absolute_total'
  scaleTotal?: number | null
  scaleNote?: string | null
  detailFormatter?: (
    item: { id?: string; label: string; value: number; detail?: string },
    meta: {
      rank: number
      total: number
      max: number
      scaleMode: 'relative_visible_max' | 'absolute_total'
      scaleTotal: number | null
    }
  ) => {
    label: string
    value: string
    detail: string
    footer?: string | null
  }
}) {
  const max = maxChartValue(props.items.map((item) => item.value))
  const scaleMode = props.scaleMode === 'absolute_total' ? 'absolute_total' : 'relative_visible_max'
  const scaleTotal =
    scaleMode === 'absolute_total' &&
    typeof props.scaleTotal === 'number' &&
    Number.isFinite(props.scaleTotal) &&
    props.scaleTotal > 0
      ? props.scaleTotal
      : null
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(() => props.items[0]?.label ?? null)
  const hasControlledActive = props.activeId !== undefined || props.activeLabel !== undefined

  const resolvedHoveredLabel =
    hoveredLabel && props.items.some((item) => item.label === hoveredLabel) ? hoveredLabel : null
  const resolvedSelectedLabel =
    selectedLabel && props.items.some((item) => item.label === selectedLabel)
      ? selectedLabel
      : props.items[0]?.label ?? null

  const hoveredItem = resolvedHoveredLabel
    ? props.items.find((item) => item.label === resolvedHoveredLabel) || null
    : null
  const externalActiveItem =
    props.activeId != null
      ? props.items.find((item) => item.id === props.activeId) || null
      : props.activeLabel != null
        ? props.items.find((item) => item.label === props.activeLabel) || null
        : null
  const selectedItem = resolvedSelectedLabel
    ? props.items.find((item) => item.label === resolvedSelectedLabel) || null
    : null
  const activeItem =
    hoveredItem ||
    externalActiveItem ||
    (hasControlledActive ? props.items[0] || null : selectedItem || props.items[0] || null)
  const activeIndex = activeItem
    ? props.items.findIndex(
        (item) => (item.id || item.label) === (activeItem.id || activeItem.label)
      )
    : -1
  const detail =
    activeItem && props.detailFormatter
      ? props.detailFormatter(activeItem, {
          rank: Math.max(activeIndex, 0),
          total: props.items.length,
          max,
          scaleMode,
          scaleTotal,
        })
      : activeItem
        ? {
            label: activeItem.label,
            value: activeItem.value.toLocaleString(),
            detail:
              activeItem.detail ||
              'Hover to inspect this segment or click to keep it selected while you read.',
            footer:
              activeIndex >= 0
                ? `Rank ${activeIndex + 1} of ${props.items.length} visible segments.`
                : null,
          }
        : null

  return sectionCard(
    props.title,
    props.description || 'Live cached intelligence rendered as fast visual context instead of long text-only lists.',
    <div className="space-y-3">
      {props.scaleNote ? <p className="text-[11px] leading-5 text-slate-300">{props.scaleNote}</p> : null}
      {!activeItem || !detail ? (
        <div className={`${neutralInsetSurfaceClass} rounded-2xl border-dashed p-4`}>
          <p className="text-sm font-semibold text-white">
            {props.emptyStateTitle || 'No visible chart data yet'}
          </p>
          <p className="mt-2 text-sm text-slate-200">
            {props.emptyStateDetail || 'This chart will appear as soon as scoped sender intelligence is available.'}
          </p>
        </div>
      ) : (
        <>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Selected segment</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{detail.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{detail.value}</p>
              </div>
              <span className={`${neutralPillSurfaceClass} rounded-full px-2.5 py-1 text-[11px] text-slate-100`}>
                {activeIndex >= 0
                  ? `Rank ${activeIndex + 1} of ${props.items.length} visible`
                  : 'Inspecting'}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-200">{detail.detail}</p>
            {detail.footer ? <p className="mt-2 text-[11px] text-slate-300">{detail.footer}</p> : null}
          </div>
          <div className="space-y-2">
            {props.items.map((item) => {
              const active = activeItem.label === item.label
              const rawWidthPct =
                scaleMode === 'absolute_total' && scaleTotal
                  ? Math.max(0, Math.min((item.value / scaleTotal) * 100, 100))
                  : Math.max(0, Math.min((item.value / max) * 100, 100))
              const minWidthPx = item.value > 0 ? '2px' : '0px'
              return (
                <button
                  key={item.id || item.label}
                  type="button"
                  onMouseEnter={() => setHoveredLabel(item.label)}
                  onMouseLeave={() => setHoveredLabel(null)}
                  onFocus={() => setHoveredLabel(item.label)}
                  onBlur={() => setHoveredLabel(null)}
                  onClick={() => {
                    setSelectedLabel(item.label)
                    props.onItemClick?.(item)
                  }}
                  className={`block w-full rounded-xl border text-left transition ${
                    active
                      ? 'border-cyan-700/45 bg-cyan-950/18 ring-1 ring-cyan-700/35 shadow-[0_10px_24px_rgba(2,6,23,0.14)]'
                      : 'border-slate-500/25 bg-[rgba(12,17,25,0.74)] hover:border-slate-400/45 hover:bg-[rgba(18,25,37,0.92)]'
                  }`}
                >
                  <div className="space-y-1.5 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-200">
                      <span>{item.label}</span>
                      <span>
                        {item.value.toLocaleString()}
                        {item.detail ? ` · ${item.detail}` : ''}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(7,12,20,0.94)]">
                      <div
                        className={`h-full rounded-full ${props.accentClass}`}
                        style={{
                          width: `${rawWidthPct}%`,
                          minWidth: rawWidthPct > 0 ? minWidthPx : undefined,
                        }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function TimelineChart(props: {
  title: string
  items: Array<{ label: string; count: number }>
  accentClass: string
  onItemClick?: (item: { label: string; count: number }) => void
  readOnly?: boolean
  description?: string
  emptyStateTitle?: string
  emptyStateDetail?: string
  detailFormatter?: (
    item: { label: string; count: number },
    meta: {
      rank: number
      total: number
      max: number
      peak: { label: string; count: number } | null
      latest: { label: string; count: number } | null
    }
  ) => {
    label: string
    value: string
    detail: string
    footer?: string | null
  }
}) {
  const max = maxChartValue(props.items.map((item) => item.count))
  const peak = props.items
    .slice()
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))[0]
  const latest = props.items[props.items.length - 1]
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(() => latest?.label || props.items[0]?.label || null)

  const resolvedHoveredLabel =
    hoveredLabel && props.items.some((item) => item.label === hoveredLabel) ? hoveredLabel : null
  const resolvedSelectedLabel =
    selectedLabel && props.items.some((item) => item.label === selectedLabel)
      ? selectedLabel
      : latest?.label || props.items[0]?.label || null

  const hoveredItem = resolvedHoveredLabel
    ? props.items.find((item) => item.label === resolvedHoveredLabel) || null
    : null
  const selectedItem = resolvedSelectedLabel
    ? props.items.find((item) => item.label === resolvedSelectedLabel) || null
    : null
  const activeItem =
    hoveredItem || (props.readOnly ? latest || props.items[0] || null : selectedItem || latest || props.items[0] || null)
  const activeIndex = activeItem ? props.items.findIndex((item) => item.label === activeItem.label) : -1
  const detail =
    activeItem && props.detailFormatter
      ? props.detailFormatter(activeItem, {
          rank: Math.max(activeIndex, 0),
          total: props.items.length,
          max,
          peak: peak || null,
          latest: latest || null,
        })
      : activeItem
        ? {
            label: activeItem.label,
            value: `${activeItem.count.toLocaleString()} senders`,
            detail:
              props.readOnly
                ? 'Hover this timeline to compare sender activity periods inside the selected cleanup group.'
                : 'This period shows sender activity inside the selected cleanup group, not mailbox-wide message traffic.',
            footer:
              peak && latest
                ? `Peak period: ${peak.label}. Latest visible period: ${latest.label}.`
                : null,
          }
        : null

  return sectionCard(
    props.title,
    props.description || 'Activity stays sender-first, but the timeline shows how much of the cleanup universe is recent versus historical.',
    <div className="space-y-4">
      {!activeItem || !detail ? (
        <div className={`${neutralInsetSurfaceClass} rounded-2xl border-dashed p-4`}>
          <p className="text-sm font-semibold text-white">
            {props.emptyStateTitle || 'No visible timeline data yet'}
          </p>
          <p className="mt-2 text-sm text-slate-200">
            {props.emptyStateDetail || 'This timeline will render once scoped sender activity is available.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            {insightCard('Selected period', `${detail.label} · ${detail.value}`, detail.detail)}
            {insightCard(
              'Peak period',
              peak ? `${peak.label} · ${peak.count.toLocaleString()}` : '—',
              'The heaviest visible sender-activity window inside this cleanup group.'
            )}
            {insightCard(
              'Latest period',
              latest ? `${latest.label} · ${latest.count.toLocaleString()}` : '—',
              props.readOnly
                ? 'Hover the bars below to compare periods. Timeline drill-down is intentionally off in this surface.'
                : 'Hover or click a period below to keep the detail panel focused while you read.'
            )}
          </div>
          <div className={`${neutralInsetSurfaceClass} rounded-2xl p-4`}>
            <div className="flex min-h-[14rem] items-end gap-3 overflow-x-auto pb-1">
              {props.items.map((item) => {
                const active = activeItem.label === item.label
                const height = `${Math.max(18, Math.round((item.count / max) * 100))}%`
                const content = (
                  <>
                    <div className="flex h-40 items-end">
                      <div
                        className={`w-full rounded-t-2xl ${props.accentClass}`}
                        style={{ height }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-300">{item.label}</p>
                    <p className="mt-1 text-sm font-medium text-white">{item.count.toLocaleString()}</p>
                  </>
                )

                if (props.readOnly) {
                  return (
                    <div
                      key={item.label}
                      onMouseEnter={() => setHoveredLabel(item.label)}
                      onMouseLeave={() => setHoveredLabel(null)}
                      className={`flex min-w-[4.5rem] flex-1 flex-col justify-end rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-cyan-700/50 bg-cyan-950/18 ring-1 ring-cyan-700/40 shadow-[0_10px_24px_rgba(2,6,23,0.16)]'
                          : 'border-slate-500/30 bg-[linear-gradient(180deg,rgba(26,34,46,0.98),rgba(15,21,31,0.98))]'
                      }`}
                    >
                      {content}
                    </div>
                  )
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onMouseEnter={() => setHoveredLabel(item.label)}
                    onMouseLeave={() => setHoveredLabel(null)}
                    onFocus={() => setHoveredLabel(item.label)}
                    onBlur={() => setHoveredLabel(null)}
                    onClick={() => {
                      setSelectedLabel(item.label)
                      props.onItemClick?.(item)
                    }}
                    className={`flex min-w-[4.5rem] flex-1 flex-col justify-end rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-cyan-700/50 bg-cyan-950/18 ring-1 ring-cyan-700/40 shadow-[0_10px_24px_rgba(2,6,23,0.16)]'
                        : 'border-slate-500/30 bg-[linear-gradient(180deg,rgba(26,34,46,0.98),rgba(15,21,31,0.98))] hover:border-slate-400/50'
                    }`}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </div>
          {detail.footer ? <p className="text-xs leading-5 text-slate-200">{detail.footer}</p> : null}
        </>
      )}
    </div>
  )
}

function CompactTrendChart(props: {
  title: string
  summary: string | null
  detail: string | null
  items: GmailPressureTrendData['series'] | null
  direction: 'rising' | 'falling' | 'stable' | 'unknown'
  peakBucketStartAt: string | null
  peakCount: number
  latestBucketStartAt: string | null
  groups: GmailMailboxIntelligenceData['cleanup_groups']
  nextActionTitle: string
  nextActionDetail: string
  activeWindow: GmailPressureTrendWindow
  activeRangeLabel: string | null
  loading: boolean
  error: string | null
  customRangeStart: string | null
  customRangeEnd: string | null
  customRangeMin: string | null
  customRangeMax: string | null
  onSelectWindow: (window: Exclude<GmailPressureTrendWindow, 'custom'>) => void
  onApplyCustomRange: (start: string, end: string) => void
}) {
  const items = props.items ?? EMPTY_PRESSURE_TREND_SERIES
  const chartItems = items.map((item, index) => ({
    ...item,
    bucketKey: item.bucket_start_at || `${item.label}-${index}`,
  }))
  const buildDefaultCustomRangeDraft = () => ({
    start: props.customRangeStart || props.customRangeMin || '',
    end: props.customRangeEnd || props.customRangeMax || '',
  })
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(
    () => props.latestBucketStartAt
  )
  const [hoveredBucketKey, setHoveredBucketKey] = useState<string | null>(null)
  const [mountedNowMs] = useState(() => Date.now())
  const [customEditorOpen, setCustomEditorOpen] = useState(() => props.activeWindow === 'custom')
  const [customRangeDraft, setCustomRangeDraft] = useState(buildDefaultCustomRangeDraft)
  const chartViewportRef = useRef<HTMLDivElement | null>(null)
  const [chartViewportWidth, setChartViewportWidth] = useState(0)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const max = maxChartValue(items.map((item) => item.count))
  const chartHeight = 264
  const paddingLeft = 56
  const paddingRight = 28
  const paddingTop = 20
  const paddingBottom = 48

  const windowOptions: Array<{ key: GmailPressureTrendWindow; label: string }> = [
    { key: 'all_indexed', label: 'All indexed' },
    { key: 'last_year', label: '1Y' },
    { key: 'last_quarter', label: '1Q' },
    { key: 'last_month', label: '1M' },
    { key: 'last_week', label: '1W' },
    { key: 'last_day', label: '1D' },
    { key: 'custom', label: 'Custom' },
  ]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const desktopQuery = window.matchMedia('(min-width: 1280px)')
    const syncViewport = (matches: boolean) => {
      setIsDesktopViewport(matches)
    }

    syncViewport(desktopQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      syncViewport(event.matches)
    }

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', handleChange)
      return () => desktopQuery.removeEventListener('change', handleChange)
    }

    desktopQuery.addListener(handleChange)
    return () => desktopQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const node = chartViewportRef.current
    if (!node) return

    const syncWidth = (nextWidth?: number) => {
      const measuredWidth = Math.floor(nextWidth || node.getBoundingClientRect().width)
      if (measuredWidth > 0) {
        setChartViewportWidth(measuredWidth)
      }
    }

    syncWidth()

    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') return
      const handleResize = () => syncWidth()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      syncWidth(entries[0]?.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const rankedGroups = props.groups
    .slice()
    .sort(
      (left, right) =>
        right.sender_count - left.sender_count ||
        right.message_count - left.message_count ||
        left.title.localeCompare(right.title)
    )
  const selectedItem =
    chartItems.find((item) => item.bucketKey === selectedBucketKey) ||
    chartItems.find((item) => item.bucket_start_at === props.latestBucketStartAt) ||
    chartItems[chartItems.length - 1] ||
    null
  const hoveredItem = hoveredBucketKey
    ? chartItems.find((item) => item.bucketKey === hoveredBucketKey) || null
    : null
  const activeItem = hoveredItem || selectedItem
  const selectBar = (bucketKey: string) => {
    setSelectedBucketKey((current) => (current === bucketKey ? current : bucketKey))
  }
  const previewBar = (bucketKey: string) => {
    setHoveredBucketKey((current) => (current === bucketKey ? current : bucketKey))
  }
  const clearPreviewBar = (bucketKey: string) => {
    setHoveredBucketKey((current) => (current === bucketKey ? null : current))
  }
  const handleBarKeyDown = (event: KeyboardEvent<SVGRectElement>, bucketKey: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    selectBar(bucketKey)
  }
  const applyCustomRange = () => {
    if (!customRangeDraft.start || !customRangeDraft.end || customRangeDraft.start > customRangeDraft.end) {
      return
    }
    props.onApplyCustomRange(customRangeDraft.start, customRangeDraft.end)
    setCustomEditorOpen(false)
  }

  const hoveredIndex = hoveredItem
    ? chartItems.findIndex((item) => item.bucketKey === hoveredItem.bucketKey)
    : -1
  const activeIndex = activeItem
    ? chartItems.findIndex((item) => item.bucketKey === activeItem.bucketKey)
    : -1
  const hoveredPreviousItem = hoveredIndex > 0 ? chartItems[hoveredIndex - 1] : null
  const previousItem = activeIndex > 0 ? chartItems[activeIndex - 1] : null
  const hoveredMessageDelta =
    hoveredItem && hoveredPreviousItem ? hoveredItem.count - hoveredPreviousItem.count : null
  const messageDelta = activeItem && previousItem ? activeItem.count - previousItem.count : null
  const totalGroupMessages = rankedGroups.reduce((sum, group) => sum + group.message_count, 0)
  const totalGroupSenders = rankedGroups.reduce((sum, group) => sum + group.sender_count, 0)
  const averageMessagesPerSender = totalGroupSenders > 0 ? totalGroupMessages / totalGroupSenders : 0
  const dominantGroup = rankedGroups[0] || null
  const secondaryGroups = rankedGroups.slice(1, 3)
  const hasVisiblePeriods = chartItems.length > 0
  const hasAnyPressure = chartItems.some((item) => item.count > 0)
  const dominantGroupLabel = dominantGroup ? dominantGroup.title : 'No dominant sender group yet'
  const dominantGroupExplanation = dominantGroup
    ? `${dominantGroup.title} is the largest unresolved cleanup group in the current snapshot, so it is the best available pressure proxy for this window. ${
        secondaryGroups.length > 0
          ? `Next largest unresolved groups: ${secondaryGroups.map((group) => group.title).join(' and ')}.`
          : 'No secondary cleanup group is large enough to change the read meaningfully yet.'
      }`
    : 'No cleanup groups are available yet to attribute sender pressure.'
  const weightedMessagesPerSender =
    dominantGroup
      ? dominantGroup.message_count / Math.max(dominantGroup.sender_count, 1)
      : averageMessagesPerSender
  const estimatedSenderDelta =
    messageDelta == null
      ? null
      : messageDelta === 0
        ? 0
        : Math.sign(messageDelta) *
          Math.max(1, Math.round(Math.abs(messageDelta) / Math.max(weightedMessagesPerSender, 1)))
  const senderDeltaDetail =
    estimatedSenderDelta == null
      ? 'This is the first visible period in the current pressure window.'
      : estimatedSenderDelta > 0
        ? 'Pressure likely came from more active senders entering the period, not just louder existing ones. Decision coverage was losing ground across a wider sender set.'
        : estimatedSenderDelta < 0
          ? 'Fewer active senders likely contributed in this period than in the prior one, so cleanup was probably shrinking the open sender surface.'
          : 'Most of the change likely came from existing senders changing volume, not from a larger sender set.'
  const currentReadLabel =
    messageDelta == null
      ? 'Starting point in view'
      : messageDelta > 0
        ? 'Pressure rose'
        : messageDelta < 0
          ? 'Pressure eased'
          : 'Pressure held steady'
  const executionFriction =
    props.nextActionTitle.toLowerCase().includes('approve')
      ? 'Archive approvals are the current execution blocker, so sender decisions are ahead of visible inbox reduction.'
      : 'Execution friction is lower than decision friction right now, so the next gain comes from resolving more senders.'
  const interventionTitle =
    props.nextActionTitle.toLowerCase().includes('approve')
      ? props.nextActionTitle
      : dominantGroup
        ? `Open ${dominantGroup.title}`
        : props.nextActionTitle
  const interventionExplanation = props.nextActionTitle.toLowerCase().includes('approve')
    ? `${props.nextActionDetail} ${executionFriction} ${
        dominantGroup
          ? `${dominantGroup.title} remains the clearest unresolved cleanup lever once approvals are clear.`
          : 'No dominant cleanup group is visible yet once approvals are clear.'
      }`
    : dominantGroup
      ? `${dominantGroup.title} is the clearest unresolved pressure lever in the current snapshot, so opening it should improve the next sender-first decision surface. ${executionFriction}`
      : `${props.nextActionTitle} remains the best available intervention from the current snapshot. ${executionFriction}`

  const chartWidth = chartViewportWidth > 0 ? chartViewportWidth : 320
  const chartInnerWidth = Math.max(chartWidth - paddingLeft - paddingRight, 1)
  const slotWidth = chartItems.length > 0 ? chartInnerWidth / chartItems.length : chartInnerWidth
  const targetGap =
    chartItems.length > 1
      ? Math.min(Math.max(slotWidth * (isDesktopViewport ? 0.16 : 0.22), 1), 6)
      : 0
  const barWidth = chartItems.length > 0 ? Math.max(2, slotWidth - targetGap) : chartInnerWidth
  const gap = chartItems.length > 1 ? Math.max(slotWidth - barWidth, 0) : 0
  const bars = chartItems.map((item, index) => {
    const x = paddingLeft + index * slotWidth + gap / 2
    const height =
      item.count > 0
        ? Math.max(16, (item.count / max) * (chartHeight - paddingTop - paddingBottom))
        : props.activeWindow === 'last_day'
          ? 4
          : 0
    const y = chartHeight - paddingBottom - height
    return { ...item, x, y, width: barWidth, height }
  })
  const summarizePressureMix = (
    composition: Array<{ label: string; share_pct: number }>
  ): string | null => {
    const visibleComposition = composition
      .filter((item) => item.share_pct > 0)
      .slice()
      .sort((left, right) => right.share_pct - left.share_pct || left.label.localeCompare(right.label))
    if (visibleComposition.length === 0) return null
    const segments = visibleComposition.map((item) => `${item.label} ${item.share_pct}%`)
    return segments.join(' · ')
  }
  const summarizeEvidenceSignals = (
    evidenceSignals: Array<{ label: string; share_pct: number }>
  ): string | null => {
    const signalOrder: Record<string, number> = {
      'Machine-likely correspondence': 0,
      'Human-likely correspondence': 1,
      'Protected evidence': 2,
    }
    const signalLabel: Record<string, string> = {
      'Machine-likely correspondence': 'Machine-likely',
      'Human-likely correspondence': 'Human-likely',
      'Protected evidence': 'Protected evidence',
    }
    const visibleSignals = evidenceSignals
      .filter((item) => item.share_pct > 0)
      .slice()
      .sort(
        (left, right) =>
          (signalOrder[left.label] ?? 99) - (signalOrder[right.label] ?? 99) ||
          right.share_pct - left.share_pct ||
          left.label.localeCompare(right.label)
      )
    if (visibleSignals.length === 0) return null
    return visibleSignals
      .map((item) => `${signalLabel[item.label] || item.label} ${item.share_pct}%`)
      .join(' · ')
  }

  const hoverHasPeriodComposition = Boolean(
    hoveredItem && Array.isArray(hoveredItem.composition) && hoveredItem.count > 0
  )
  const hoverComposition = hoverHasPeriodComposition
    ? (hoveredItem?.composition || []).filter((item) => item.count > 0)
    : []
  const hoverPressureMixSummary =
    hoverComposition.length === 0 ? null : summarizePressureMix(hoverComposition)
  const hoverEvidenceSignalSummary =
    !hoveredItem || hoveredItem.count === 0
      ? null
      : summarizeEvidenceSignals(hoveredItem.evidence_signals || [])
  const hoverBestNextMove = hoverHasPeriodComposition ? interventionTitle : null
  const hoverCardWidth = hoverHasPeriodComposition
    ? isDesktopViewport
      ? 276
      : 228
    : isDesktopViewport
      ? 220
      : 184
  const hoveredBar = hoveredItem
    ? bars.find((bar) => bar.bucketKey === hoveredItem.bucketKey) || null
    : null
  const hoverCardLeft = hoveredBar
    ? Math.min(
        Math.max(8, hoveredBar.x + hoveredBar.width / 2 - hoverCardWidth / 2),
        Math.max(8, chartWidth - hoverCardWidth - 8)
      )
    : 8
  const hoverPressureLabel = hoveredItem ? hoveredItem.count.toLocaleString() : ''
  const hoverPreviousLabel = hoveredPreviousItem
    ? hoveredPreviousItem.count.toLocaleString()
    : 'No prior period in view'
  const hoverDeltaLabel =
    hoveredMessageDelta == null
      ? 'Not measurable yet'
      : hoveredMessageDelta === 0
        ? '0'
        : `${hoveredMessageDelta > 0 ? '+' : ''}${hoveredMessageDelta.toLocaleString()}`
  const axisLabelValues = [max, Math.round(max / 2), 0]
  const longestLabelLength = chartItems.reduce(
    (longest, item) => Math.max(longest, item.label.length),
    0
  )
  const estimatedLabelWidth = Math.max(36, Math.min(96, longestLabelLength * 6))
  const labelCadence =
    chartItems.length <= 1
      ? 1
      : Math.max(1, Math.ceil(estimatedLabelWidth / Math.max(slotWidth, 1)))
  const directionClass =
    props.direction === 'rising'
      ? 'border-amber-700/50 bg-amber-950/15 text-amber-100'
      : props.direction === 'falling'
        ? 'border-emerald-700/50 bg-emerald-950/15 text-emerald-100'
        : props.direction === 'stable'
          ? 'border-sky-700/50 bg-sky-950/15 text-sky-100'
          : 'border-[var(--app-border-muted)] bg-[var(--app-surface-3)] text-gray-300'
  const selectedPeriodLabel = activeItem ? activeItem.label : 'No visible period yet'
  const selectedPeriodSummary =
    !activeItem
      ? 'No visible period is available in this window yet.'
      : activeItem.count === 0
        ? 'No supporting-message pressure landed in this selected period.'
        : messageDelta == null
          ? 'Use this as the starting point for the visible window.'
          : messageDelta > 0
            ? 'Cleanup lost ground in this selected period.'
            : messageDelta < 0
              ? 'Cleanup gained ground in this selected period.'
              : 'Cleanup and new pressure held even in this selected period.'
  const selectedPressureLabel = activeItem ? activeItem.count.toLocaleString() : 'Unavailable'
  const selectedPressureDetail = activeItem
    ? 'Supporting messages in this selected period.'
    : 'The current window does not have chartable periods yet.'
  const previousPressureLabel = previousItem
    ? previousItem.count.toLocaleString()
    : 'No prior period in view'
  const previousPressureDetail = previousItem
    ? `${previousItem.label} is the comparison period for this selected bar.`
    : hasVisiblePeriods
      ? 'A prior comparison appears after the first visible bucket.'
      : 'A prior comparison appears once chartable periods are available.'
  const deltaLabel =
    messageDelta == null
      ? 'Not measurable yet'
      : messageDelta === 0
        ? '0'
        : `${messageDelta > 0 ? '+' : ''}${messageDelta.toLocaleString()}`
  const deltaDetail =
    messageDelta == null
      ? 'This selected period is the first visible bucket in the current window.'
      : messageDelta > 0
        ? 'More supporting-message pressure landed than in the comparison period.'
        : messageDelta < 0
          ? 'Less supporting-message pressure landed than in the comparison period.'
          : 'Supporting-message pressure matched the comparison period.'
  const groundReadLabel =
    !activeItem
      ? 'No visible read yet'
      : activeItem.count === 0
        ? 'No pressure landed'
        : currentReadLabel
  const peakGapCount =
    activeItem && props.peakCount > 0 ? Math.max(props.peakCount - activeItem.count, 0) : null
  const latestBucketContainsNow =
    Boolean(
      props.latestBucketStartAt &&
        bars.some((bar) => {
          if (bar.bucket_start_at !== props.latestBucketStartAt) return false
          const bucketStartMs = Date.parse(bar.bucket_start_at)
          const bucketEndMs = Date.parse(bar.bucket_end_at)
          return (
            Number.isFinite(bucketStartMs) &&
            Number.isFinite(bucketEndMs) &&
            mountedNowMs >= bucketStartMs &&
            mountedNowMs <= bucketEndMs
          )
        })
    )
  const latestPeriodLabel = latestBucketContainsNow ? 'Current' : 'Latest in range'
  const latestPeriodLegendLabel = latestBucketContainsNow ? 'Current period' : 'Latest in range'
  const groundReadDetail =
    !activeItem
      ? 'Pressure Trend needs visible buckets before it can explain what changed.'
      : activeItem.count === 0
        ? 'This selected period shows zero supporting-message pressure, so read it against the rest of the visible window.'
        : messageDelta == null
          ? 'This period establishes the starting point for the current visible window.'
          : `${senderDeltaDetail}${
              activeItem.bucket_start_at === props.peakBucketStartAt
                ? ' This is also the visible peak in the current window.'
                : peakGapCount != null
                  ? ` This sits ${peakGapCount.toLocaleString()} supporting messages below the visible peak.`
                  : ''
            }${chartItems.length < 3 ? ' This is a short visible window, so treat the read as directional context.' : ''}`
  const driverCardValue = props.nextActionTitle.toLowerCase().includes('approve')
    ? 'Approval queue is the active blocker'
    : dominantGroupLabel
  const driverCardDetail = props.nextActionTitle.toLowerCase().includes('approve')
    ? `Current snapshot only, not a period mix. ${executionFriction} ${
        dominantGroup
          ? `${dominantGroup.title} remains the largest unresolved cleanup group in the current snapshot.`
          : 'No dominant cleanup group is visible yet.'
      }`
    : `Current snapshot only, not a period mix. ${dominantGroupExplanation}`
  const hasPeriodCompositionPayload = Boolean(activeItem && Array.isArray(activeItem.composition))
  const periodComposition = hasPeriodCompositionPayload
    ? (activeItem?.composition || []).filter((item) => item.count > 0)
    : []
  const selectedPressureMixSummary =
    !activeItem || activeItem.count === 0
      ? null
      : (() => {
          const summary = summarizePressureMix(periodComposition)
          return summary ? `Pressure mix: ${summary}.` : null
        })()
  const selectedEvidenceSignalSummary =
    !activeItem || activeItem.count === 0
      ? null
      : (() => {
          const summary = summarizeEvidenceSignals(activeItem.evidence_signals || [])
          return summary ? `Evidence signals: ${summary}. These overlap with Pressure mix.` : null
        })()
  const defaultSummary = props.loading
    ? 'Loading Pressure Trend…'
    : 'Select a real window to inspect indexed pressure.'
  const defaultDetail = props.loading
    ? 'Fetching the active range and regrouping it from real message timestamps.'
    : props.error || 'Pressure Trend updates independently from the rest of Mailbox Intelligence.'
  const customRangeInvalid =
    !customRangeDraft.start ||
    !customRangeDraft.end ||
    customRangeDraft.start > customRangeDraft.end ||
    (props.customRangeMin != null && customRangeDraft.start < props.customRangeMin) ||
    (props.customRangeMax != null && customRangeDraft.end > props.customRangeMax)

  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4 space-y-4`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{props.title}</p>
              <span className={`${neutralPillSurfaceClass} rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100`}>
                {props.activeRangeLabel || 'Active chart range'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {windowOptions.map((option) => {
                const active = props.activeWindow === option.key
                const className = active
                  ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                  : 'border-slate-500/35 bg-[linear-gradient(180deg,rgba(22,30,42,0.96),rgba(13,19,29,0.96))] text-slate-200 hover:border-slate-400/55 hover:text-white'
                if (option.key === 'custom') {
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setCustomRangeDraft(buildDefaultCustomRangeDraft())
                        setCustomEditorOpen(true)
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${className}`}
                    >
                      {option.label}
                    </button>
                  )
                }
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setCustomEditorOpen(false)
                      props.onSelectWindow(option.key as Exclude<GmailPressureTrendWindow, 'custom'>)
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${className}`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="max-w-md text-right text-xs leading-5 text-gray-400">
            Window changes only update Pressure Trend. Hero, Mission Control, and the rest of the dashboard stay on the current workspace scope.
          </p>
        </div>
        {customEditorOpen ? (
          <div className={`${neutralInsetSurfaceClass} rounded-2xl p-3`}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="space-y-2 text-xs text-gray-300">
                <span className="uppercase tracking-[0.18em] text-gray-500">Start date</span>
                <input
                  type="date"
                  value={customRangeDraft.start}
                  min={props.customRangeMin || undefined}
                  max={props.customRangeMax || undefined}
                  onChange={(event) =>
                    setCustomRangeDraft((current) => ({ ...current, start: event.target.value }))
                  }
                  className={`${neutralInsetSurfaceClass} w-full rounded-xl px-3 py-2 text-sm text-gray-100`}
                />
              </label>
              <label className="space-y-2 text-xs text-gray-300">
                <span className="uppercase tracking-[0.18em] text-gray-500">End date</span>
                <input
                  type="date"
                  value={customRangeDraft.end}
                  min={props.customRangeMin || undefined}
                  max={props.customRangeMax || undefined}
                  onChange={(event) =>
                    setCustomRangeDraft((current) => ({ ...current, end: event.target.value }))
                  }
                  className={`${neutralInsetSurfaceClass} w-full rounded-xl px-3 py-2 text-sm text-gray-100`}
                />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  onClick={applyCustomRange}
                  disabled={customRangeInvalid}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ${
                    customRangeInvalid
                      ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                      : 'bg-cyan-700 text-white hover:bg-cyan-600'
                  }`}
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomRangeDraft(buildDefaultCustomRangeDraft())
                    setCustomEditorOpen(false)
                  }}
                  className={`${quietControlSurfaceClass} rounded-xl px-4 py-2 text-sm`}
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-400">
              Custom ranges are limited to indexed history. Out-of-range requests are adjusted to the available indexed span instead of pretending coverage exists.
            </p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-white">{props.summary || defaultSummary}</p>
          <p className="max-w-4xl text-sm leading-6 text-gray-300">{props.detail || defaultDetail}</p>
          <p className="text-xs text-gray-400">
            {props.activeRangeLabel ||
              'Each bar is built from real indexed timestamps, zero-filled across the active range, and never regrouped from coarse monthly or weekly snapshots.'}
          </p>
        </div>
      </div>
      <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
        {props.loading ? (
          <div className={`${neutralInsetSurfaceClass} flex h-72 items-center justify-center rounded-2xl border-dashed px-6 text-center`}>
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-semibold text-white">Loading active Pressure Trend range…</p>
              <p className="text-sm leading-6 text-gray-400">
                Regrouping indexed messages into real hourly, daily, weekly, monthly, quarterly, or yearly buckets.
              </p>
            </div>
          </div>
        ) : props.error ? (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-rose-900/45 bg-rose-950/20 px-6 text-center">
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-semibold text-rose-100">Pressure Trend could not load.</p>
              <p className="text-sm leading-6 text-rose-100/80">{props.error}</p>
            </div>
          </div>
        ) : !hasVisiblePeriods || !hasAnyPressure ? (
          <div className={`${neutralInsetSurfaceClass} flex h-72 items-center justify-center rounded-2xl border-dashed px-6 text-center`}>
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-semibold text-white">
                {!hasVisiblePeriods
                  ? 'No chartable periods are available yet.'
                  : 'No supporting-message pressure is visible in this window.'}
              </p>
              <p className="text-sm leading-6 text-gray-400">
                {!hasVisiblePeriods
                  ? 'Pressure Trend becomes measurable once the active range contains chartable buckets.'
                  : 'The active range includes visible buckets, but all of them currently carry zero supporting-message pressure.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div ref={chartViewportRef} className="relative">
              <div className="relative" style={{ width: chartWidth }}>
                {hoveredItem && hoveredBar ? (
                  <div
                    className="pointer-events-none absolute top-3 z-10 rounded-2xl border border-cyan-900/60 bg-gray-950/95 px-3 py-2 shadow-[0_18px_40px_rgba(2,12,27,0.55)]"
                    style={{ left: hoverCardLeft, width: hoverCardWidth }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">
                      Quick read
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{hoveredItem.label}</p>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Pressure</span>
                        <span className="font-medium text-white">{hoverPressureLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Previous</span>
                        <span className="font-medium text-white">{hoverPreviousLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Change</span>
                        <span className="font-medium text-white">{hoverDeltaLabel}</span>
                      </div>
                    </div>
                    {hoverHasPeriodComposition ? (
                      <div className="mt-3 border-t border-cyan-950/50 pt-2 text-[11px]">
                        {hoverPressureMixSummary ? (
                          <div>
                            <p className="text-gray-500">Pressure mix</p>
                            <p className="mt-0.5 leading-5 text-gray-100">
                              {hoverPressureMixSummary}
                            </p>
                          </div>
                        ) : null}
                        {hoverEvidenceSignalSummary ? (
                          <div className="mt-2">
                            <p className="text-gray-500">Evidence signals (overlap)</p>
                            <p className="mt-0.5 leading-5 text-gray-200">
                              {hoverEvidenceSignalSummary}
                            </p>
                          </div>
                        ) : null}
                        {hoverBestNextMove ? (
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <span className="text-gray-500">Best next move</span>
                            <span className="max-w-[150px] text-right leading-5 text-cyan-50">
                              {hoverBestNextMove}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-72"
                  style={{ width: chartWidth }}
                >
                  {axisLabelValues.map((value, index) => {
                    const ratio = index === 0 ? 1 : index === 1 ? 0.5 : 0
                    const y =
                      chartHeight -
                      paddingBottom -
                      ratio * (chartHeight - paddingTop - paddingBottom)
                    return (
                      <text
                        key={`tick-${index}-${value}`}
                        x={10}
                        y={y + (ratio === 0 ? 0 : 4)}
                        fill="rgba(148,163,184,0.7)"
                        fontSize="11"
                      >
                        {value.toLocaleString()}
                      </text>
                    )
                  })}
                  {[0.25, 0.5, 0.75].map((ratio) => {
                    const y =
                      chartHeight -
                      paddingBottom -
                      ratio * (chartHeight - paddingTop - paddingBottom)
                    return (
                      <line
                        key={ratio}
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="rgba(148,163,184,0.14)"
                        strokeWidth="1"
                      />
                    )
                  })}
                  <line
                    x1={paddingLeft}
                    y1={chartHeight - paddingBottom}
                    x2={chartWidth - paddingRight}
                    y2={chartHeight - paddingBottom}
                    stroke="rgba(148,163,184,0.18)"
                    strokeWidth="1"
                  />
                  {bars.map((bar, index) => {
                    const isPeak = bar.bucket_start_at === props.peakBucketStartAt
                    const isLatest = bar.bucket_start_at === props.latestBucketStartAt
                    const isActive = activeItem?.bucketKey === bar.bucketKey
                    const isSelected = selectedItem?.bucketKey === bar.bucketKey
                    const fill =
                      isActive
                        ? 'rgb(103 232 249)'
                        : isPeak && isLatest
                          ? 'rgb(217 70 239)'
                          : isPeak
                            ? 'rgb(245 158 11)'
                            : isLatest
                              ? 'rgb(6 182 212)'
                              : 'rgb(71 85 105)'
                    const edgeSafeAnchor =
                      index === 0 ? 'start' : index === bars.length - 1 ? 'end' : 'middle'
                    const edgeSafeX =
                      index === 0
                        ? bar.x
                        : index === bars.length - 1
                          ? bar.x + bar.width
                          : bar.x + bar.width / 2
                    const shouldShowLabel =
                      chartItems.length <= 6 ||
                      index % labelCadence === 0 ||
                      index === bars.length - 1 ||
                      isPeak ||
                      isLatest

                    return (
                      <g key={bar.bucketKey}>
                        {(isPeak || isLatest) && !isActive ? (
                          <text
                            x={edgeSafeX}
                            y={Math.max(18, bar.y - 8)}
                            textAnchor={edgeSafeAnchor}
                            fill={isPeak ? 'rgb(251 191 36)' : 'rgb(34 211 238)'}
                            fontSize="11"
                            fontWeight="600"
                          >
                            {isPeak ? 'Peak' : latestPeriodLabel}
                          </text>
                        ) : null}
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          rx={Math.min(12, Math.max(2, bar.width / 2))}
                          className="cursor-pointer"
                          fill={fill}
                          stroke={isActive ? 'white' : 'rgba(255,255,255,0.12)'}
                          strokeWidth={isActive ? 2 : 1}
                          role="button"
                          aria-label={`${bar.label}. ${bar.count.toLocaleString()} supporting messages${
                            isPeak ? '. Visible peak.' : ''
                          }${isLatest ? `. ${latestPeriodLegendLabel}.` : ''}`}
                          aria-pressed={isSelected}
                          onMouseEnter={() => previewBar(bar.bucketKey)}
                          onMouseLeave={() => clearPreviewBar(bar.bucketKey)}
                          onFocus={() => previewBar(bar.bucketKey)}
                          onBlur={() => clearPreviewBar(bar.bucketKey)}
                          onClick={() => selectBar(bar.bucketKey)}
                          onKeyDown={(event) => handleBarKeyDown(event, bar.bucketKey)}
                          tabIndex={0}
                        />
                        {shouldShowLabel ? (
                          <text
                            x={edgeSafeX}
                            y={chartHeight - 14}
                            textAnchor={edgeSafeAnchor}
                            fill="rgba(203,213,225,0.82)"
                            fontSize="11"
                          >
                            {bar.label}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Peak period
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  {latestPeriodLegendLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${directionClass.split(' ')[1] || 'bg-gray-700'}`} />
                  {props.summary || defaultSummary}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Hover shows the detailed mix. Click keeps a compact summary below.
              </p>
            </div>
          </>
        )}
      </div>
      <div className="rounded-2xl border border-cyan-900/35 bg-cyan-950/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Selected period</p>
            <p className="mt-2 text-lg font-semibold text-white">{selectedPeriodLabel}</p>
            <p className="mt-1 text-sm text-cyan-50/90">{selectedPeriodSummary}</p>
            {selectedPressureMixSummary ? (
              <p className="mt-2 text-xs leading-5 text-cyan-100/80">
                {selectedPressureMixSummary}
              </p>
            ) : null}
            {selectedEvidenceSignalSummary ? (
              <p className="mt-2 text-xs leading-5 text-cyan-100/70">
                {selectedEvidenceSignalSummary}
              </p>
            ) : null}
          </div>
          <p className="max-w-sm text-xs leading-5 text-cyan-100/70">
            Hover carries the detailed mix. Click keeps the compact period summary below.
          </p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {diagnosticRow('Pressure', selectedPressureLabel, selectedPressureDetail)}
          {diagnosticRow('Previous period', previousPressureLabel, previousPressureDetail)}
          {diagnosticRow('Change vs prior', deltaLabel, deltaDetail)}
        </div>
        <div
          className={`mt-3 grid gap-3 ${hasPeriodCompositionPayload ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}
        >
          {diagnosticRow('Ground read', groundReadLabel, groundReadDetail)}
          {hasPeriodCompositionPayload ? null : diagnosticRow('Snapshot driver', driverCardValue, driverCardDetail)}
          {diagnosticRow('Best next move', interventionTitle, interventionExplanation)}
        </div>
      </div>
    </div>
  )
}

type SenderTimeContextRailMetric = {
  value: string
  detail: string
}

function formatSignedCount(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'Not measurable yet'
  if (value === 0) return '0'
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}`
}

function hasMeaningfullyDistinctActivityPeak(
  peak: { label: string; count: number } | null,
  latest: { label: string; count: number } | null
): boolean {
  if (!peak || !latest) return false
  if (peak.label === latest.label || peak.count <= latest.count) return false
  const difference = peak.count - latest.count
  return difference >= Math.max(3, Math.round(Math.max(peak.count, latest.count) * 0.15))
}

function senderTimeContextInterpretation(params: {
  item: { label: string; count: number }
  previous: { label: string; count: number } | null
  peak: { label: string; count: number } | null
  latest: { label: string; count: number } | null
}): string {
  const { item, previous, peak, latest } = params
  if (item.count === 0) {
    return 'No activity was visible here.'
  }
  if (peak && latest && item.label === peak.label && item.label === latest.label) {
    return 'This group is still sitting at its visible high point.'
  }
  if (peak && item.label === peak.label) {
    return 'This is the strongest visible activity window in the group.'
  }
  if (latest && item.label === latest.label) {
    if (peak && peak.count > item.count) {
      return 'Recent activity is below the visible peak.'
    }
    return 'Recent activity is still carrying the main workload.'
  }
  if (!previous) {
    return 'This period sets the starting point for the visible timeline.'
  }
  const delta = item.count - previous.count
  if (delta > 0) {
    return 'Activity climbed from the previous visible period.'
  }
  if (delta < 0) {
    return 'Activity eased from the previous visible period.'
  }
  return 'Activity held steady against the previous visible period.'
}

function senderTimeContextWhatHappened(params: {
  item: { label: string; count: number }
  previous: { label: string; count: number } | null
  peak: { label: string; count: number } | null
  latest: { label: string; count: number } | null
}): string {
  const { item, previous, peak, latest } = params
  if (item.count === 0) {
    return `No supporting activity landed in ${item.label}, so this part of the timeline does not add fresh workload.`
  }
  if (!previous) {
    return `${item.label} is the first visible checkpoint in this timeline, with ${item.count.toLocaleString()} supporting messages.`
  }
  const delta = item.count - previous.count
  if (peak && latest && item.label === peak.label && item.label === latest.label) {
    return `${item.label} is both the latest and strongest visible window, with ${item.count.toLocaleString()} supporting messages still driving this group.`
  }
  if (peak && item.label === peak.label) {
    return `${item.label} is the visible peak at ${item.count.toLocaleString()} supporting messages, up ${Math.max(delta, 0).toLocaleString()} from the prior period.`
  }
  if (latest && item.label === latest.label) {
    if (delta > 0) {
      return `${item.label} is the latest visible period and activity is climbing again, up ${delta.toLocaleString()} messages from ${previous.label}.`
    }
    if (delta < 0) {
      return `${item.label} is the latest visible period and activity has eased by ${Math.abs(delta).toLocaleString()} messages since ${previous.label}.`
    }
    return `${item.label} matches ${previous.label}, so the recent pace is holding steady.`
  }
  if (delta > 0) {
    return `${item.label} sits above ${previous.label} by ${delta.toLocaleString()} messages, showing a stronger burst of activity in that window.`
  }
  if (delta < 0) {
    return `${item.label} sits below ${previous.label} by ${Math.abs(delta).toLocaleString()} messages, showing a lighter window than the period before it.`
  }
  return `${item.label} matches ${previous.label}, so activity stayed even across both visible periods.`
}

function senderTimeContextWhyItMatters(params: {
  item: { label: string; count: number }
  peak: { label: string; count: number } | null
  latest: { label: string; count: number } | null
}): string {
  const { item, peak, latest } = params
  if (item.count === 0) {
    return 'That usually means the work in this cleanup group comes from other periods, not from fresh activity here.'
  }
  if (peak && latest && item.label === peak.label && item.label === latest.label) {
    return 'This means the pressure is still live right now, not just leftover buildup from an older spike.'
  }
  if (peak && latest && item.label === peak.label) {
    const difference = Math.max(peak.count - latest.count, 0)
    return difference > 0
      ? `This is where the heaviest buildup happened. The latest visible period is ${difference.toLocaleString()} messages lower, so the group now mixes live work with residue from that spike.`
      : 'This peak is still representative of the current workload.'
  }
  if (latest && item.label === latest.label) {
    if (peak && peak.count > item.count) {
      return `Current activity is ${Math.abs(peak.count - item.count).toLocaleString()} messages below the visible peak, so part of today’s review load comes from earlier accumulation.`
    }
    return 'Current activity is still close to the top of the visible range, so the workload remains active.'
  }
  if (latest && item.count > latest.count) {
    return `This period was heavier than the current one by ${Math.abs(item.count - latest.count).toLocaleString()} messages, which points to stronger historical buildup than the group is carrying right now.`
  }
  if (latest && item.count < latest.count) {
    return `The current period now runs ${Math.abs(latest.count - item.count).toLocaleString()} messages above this one, so pressure is still active rather than purely historical.`
  }
  return 'This period helps separate a stable stretch of activity from the stronger spikes nearby.'
}

function senderTimeContextWhatToDo(params: {
  item: { label: string; count: number }
  latest: { label: string; count: number } | null
  nextActionDetail: string
}): string {
  const { item, latest, nextActionDetail } = params
  if (latest && item.label !== latest.label && item.count > latest.count) {
    return `Use ${item.label} to understand where the backlog built up, then move back into sender review with that pattern in mind. ${nextActionDetail}`
  }
  if (latest && item.label === latest.label) {
    return `Use the current period as the live read on this cleanup group, then keep the next sender decisions moving. ${nextActionDetail}`
  }
  return nextActionDetail
}

function SenderOverviewAnalysisRailShell(props: {
  modeLabel: string
  description: string
  activeRangeLabel?: string | null
  tabStrip?: ReactNode
  scopeStatus?: {
    label: string
    detail: string
    tone: 'aligned' | 'comparing' | 'outside' | 'not_loaded'
  }
  controlStrip?: ReactNode
  children: ReactNode
}) {
  const scopeStatusClassName = props.scopeStatus
    ? props.scopeStatus.tone === 'aligned'
      ? 'border-emerald-700/45 bg-emerald-950/20 text-emerald-100'
      : props.scopeStatus.tone === 'comparing'
        ? 'border-cyan-700/55 bg-cyan-950/20 text-cyan-100'
        : props.scopeStatus.tone === 'outside'
          ? 'border-amber-700/45 bg-amber-950/20 text-amber-100'
          : 'border-slate-600/55 bg-slate-950/45 text-slate-100'
    : ''

  return (
    <section className="app-surface-card rounded-[28px] p-5 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Analysis rail</p>
          <span className="rounded-full border border-cyan-700/55 bg-cyan-950/20 px-3 py-1 text-xs text-cyan-100">
            {props.modeLabel}
          </span>
          {props.scopeStatus ? (
            <span className={`rounded-full border px-3 py-1 text-xs ${scopeStatusClassName}`}>
              {props.scopeStatus.label}
            </span>
          ) : null}
          {props.activeRangeLabel ? (
            <span className="rounded-full border border-slate-600/55 bg-slate-950/40 px-3 py-1 text-xs text-slate-100">
              {props.activeRangeLabel}
            </span>
          ) : null}
        </div>
        <p className="max-w-4xl text-sm leading-6 text-slate-300">{props.description}</p>
        {props.scopeStatus ? (
          <p className="max-w-4xl text-xs leading-5 text-slate-400">{props.scopeStatus.detail}</p>
        ) : null}
        {props.tabStrip ? props.tabStrip : null}
        {props.controlStrip ? props.controlStrip : null}
      </div>
      {props.children}
    </section>
  )
}

type SharedAnalysisRailTab = 'time_context' | 'sender_distribution'

type SenderDistributionRailItem = {
  senderKey: string
  label: string
  rank: number
  sharePct: number
  messageCount: number
  messageCountLabel: string
  shareLabel: string
  rankLabel: string
  supportLabel: string
  active: boolean
}

function senderDistributionInterpretation(params: {
  item: SenderDistributionRailItem
  topItem: SenderDistributionRailItem | null
  visibleTopThreeShare: number
}): string {
  const { item, topItem, visibleTopThreeShare } = params
  if (item.messageCount === 0) {
    return 'This sender keeps its stable child-group rank, but it had no supporting messages in the selected window.'
  }
  if (item.rank === 1) {
    return visibleTopThreeShare >= 60
      ? 'This sender is leading a top-heavy current scope.'
      : 'This sender leads the current scope, but workload is still shared across several senders.'
  }
  if (topItem && item.sharePct >= topItem.sharePct * 0.8) {
    return 'This sender is close to the leading contributor and still materially shapes the group.'
  }
  if (item.sharePct >= 12) {
    return 'This sender carries a meaningful share of the current cleanup group.'
  }
  return 'This sender sits in the long tail relative to the higher-ranked bars to the left.'
}

function senderDistributionWhatHappened(item: SenderDistributionRailItem): string {
  if (item.messageCount === 0) {
    return `${item.label} remains in the fixed child-group order but contributed no messages in this selected window.`
  }
  if (item.rank === 1) {
    return `${item.label} is the largest contributor in the current scope.`
  }
  return `${item.label} is ${item.rankLabel.toLowerCase()} in the current scope.`
}

function senderDistributionWhyItMatters(params: {
  item: SenderDistributionRailItem
  topItem: SenderDistributionRailItem | null
  visibleTopThreeShare: number
}): string {
  const { item, topItem, visibleTopThreeShare } = params
  if (item.messageCount === 0) {
    return 'Keeping the sender visible preserves the exact child membership while making the selected-window inactivity explicit.'
  }
  if (item.rank === 1) {
    return visibleTopThreeShare >= 60
      ? 'A large share of this group is concentrated near the top, so starting here should cut into the workload quickly.'
      : 'This sender leads the group, but the workload is still spread enough that the next few bars matter too.'
  }
  if (item.rank <= 3) {
    return 'This sender still sits near the top of the current scope and is representative of the pressure in this group.'
  }
  if (topItem && item.sharePct >= topItem.sharePct * 0.5) {
    return 'This sender is below the leader but still strong enough to change the shape of the current scope.'
  }
  return 'This sender helps explain the tail of the group rather than the dominant pressure at the top.'
}

function senderDistributionWhatToDo(item: SenderDistributionRailItem, locked: boolean): string {
  if (locked) {
    return 'Keep this sender in local chart focus while you compare the neighboring bars, or clear focus to return to the default read.'
  }
  if (item.messageCount === 0) {
    return 'Compare the nonzero bars in this window, or switch back to All indexed to review this sender’s full contribution.'
  }
  if (item.rank === 1) {
    return 'Start with this sender first, then compare the next few bars to see whether the group is top-heavy.'
  }
  if (item.rank <= 3) {
    return 'Compare this sender against the bars immediately to the left, then focus it when you want to anchor the rail read locally.'
  }
  return 'Use this sender as a tail comparison, then return to the higher-ranked bars when you want the fastest reduction.'
}

export function SharedAnalysisRailTabStrip(props: {
  activeTab: SharedAnalysisRailTab
  onSelectTab?: (tab: SharedAnalysisRailTab) => void
}) {
  const tabs: Array<{ id: SharedAnalysisRailTab; label: string }> = [
    { id: 'sender_distribution', label: 'Sender Distribution' },
    { id: 'time_context', label: 'Time Context' },
  ]

  return (
    <div role="tablist" aria-label="Shared Analysis Rail tabs" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = props.activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => props.onSelectTab?.(tab.id)}
            className={
              active
                ? 'rounded-full border border-cyan-500/75 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-50'
                : 'rounded-full border border-slate-600/55 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-700/55 hover:text-cyan-100'
            }
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function SenderDistributionPlaceholderRail(props: {
  cleanupGroupLabel: string
  authoritativeScopeLabel: string
  kindLabel: string
  populationModeLabel: string
  tabStrip?: ReactNode
}) {
  return (
    <SenderOverviewAnalysisRailShell
      modeLabel="Sender Distribution"
      description="Sender Distribution is reserved for the Phase 2 ranked sender view. Phase 1 keeps this tab as a strict placeholder so the shared rail foundation lands without changing workflow behavior."
      tabStrip={props.tabStrip}
    >
      <div className={`${neutralInsetSurfaceClass} rounded-[24px] p-5 space-y-4`}>
        <div className="rounded-2xl border border-slate-700/45 bg-[rgba(9,21,33,0.76)] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Phase 1 placeholder</p>
          <p className="mt-2 text-lg font-semibold text-white">Foundation only</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
            This tab does not rank senders, render a chart, or change the workflow below yet. It
            only confirms that the shared rail container and shared workflow contract are in place
            for later phases.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Cleanup group</p>
            <p className="mt-2 text-sm font-semibold text-white">{props.cleanupGroupLabel}</p>
          </div>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
              Authoritative scope
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{props.authoritativeScopeLabel}</p>
          </div>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Contract kind</p>
            <p className="mt-2 text-sm font-semibold text-white">{props.kindLabel}</p>
          </div>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
              Population mode
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{props.populationModeLabel}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/45 bg-[rgba(9,21,33,0.76)] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">What stays true now</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            The workflow list and guided Decision Mode still follow the current page-session truth.
            This placeholder only surfaces that normalized contract without introducing Phase 2
            ranking behavior or Phase 3 timeframe-driven workflow changes.
          </p>
        </div>
      </div>
    </SenderOverviewAnalysisRailShell>
  )
}

export function SenderDistributionAnalysisRail(props: {
  items: SenderDistributionRailItem[]
  totalRankedSenders: number
  fixedGroupSenderTotal?: number | null
  focusedSenderKey: string | null
  pendingSenderKey?: string | null
  authoritativeContext?: {
    label: string
    detail: string
    chips: Array<{ key: string; label: string }>
  }
  onSelectSender?: (senderKey: string) => void
  onClearSelection?: () => void
  scopeControls?: {
    activeScope: TimeContextChartScope
    pendingScope: TimeContextChartScope | null
    onSelectScope?: (scope: TimeContextChartScope) => void
    allowedScopes?: readonly TimeContextChartScope[]
    customRangeStart?: string | null
    customRangeEnd?: string | null
    customRangeMin?: string | null
    customRangeMax?: string | null
    activeRangeLabel?: string | null
    onApplyCustomRange?: (start: string, end: string) => void
  }
  scopeStatus?: {
    label: string
    detail: string
    tone: 'aligned' | 'comparing' | 'outside' | 'not_loaded'
  }
  tabStrip?: ReactNode
  isUpdating?: boolean
  isLoading?: boolean
  errorMessage?: string | null
  interactionStatusLabel?: string | null
}) {
  const [hoveredSenderKey, setHoveredSenderKey] = useState<string | null>(null)
  const setHoveredSenderKeyIfChanged = useCallback((nextSenderKey: string | null) => {
    setHoveredSenderKey((current) => (current === nextSenderKey ? current : nextSenderKey))
  }, [])
  const clearHoveredSenderKey = useCallback(() => {
    setHoveredSenderKey((current) => (current == null ? current : null))
  }, [])
  const chartViewportRef = useRef<HTMLDivElement | null>(null)
  const [chartViewportWidth, setChartViewportWidth] = useState(0)
  const max = maxChartValue(props.items.map((item) => item.messageCount))
  const chartHeight = 272
  const paddingLeft = 56
  const paddingRight = 20
  const paddingTop = 24
  const paddingBottom = 44
  const activeScope = props.scopeControls?.activeScope || null

  useEffect(() => {
    const node = chartViewportRef.current
    if (!node) return

    const syncWidth = (nextWidth?: number) => {
      const measuredWidth = Math.floor(nextWidth || node.getBoundingClientRect().width)
      if (measuredWidth > 0) {
        setChartViewportWidth((current) => (current === measuredWidth ? current : measuredWidth))
      }
    }

    syncWidth()

    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') return
      const handleResize = () => syncWidth()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      syncWidth(entries[0]?.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = chartViewportRef.current
    if (!node || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return
    }

    const syncWidth = () => {
      const measuredWidth = Math.floor(node.getBoundingClientRect().width)
      if (measuredWidth > 0) {
        setChartViewportWidth((current) => (current === measuredWidth ? current : measuredWidth))
      }
    }

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      syncWidth()
      secondFrame = window.requestAnimationFrame(syncWidth)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
    }
  }, [activeScope, props.items.length])

  const hoveredItem = props.items.find((item) => item.senderKey === hoveredSenderKey) || null
  const resolvedFocusedSenderKey = props.pendingSenderKey || props.focusedSenderKey
  const lockedItem = props.items.find((item) => item.senderKey === resolvedFocusedSenderKey) || null
  const focusedItem = lockedItem || props.items[0] || null
  const metricItem = hoveredItem || focusedItem
  const previewingDifferentSender =
    Boolean(hoveredItem && focusedItem && hoveredItem.senderKey !== focusedItem.senderKey)
  const anchoredStateLabel = lockedItem ? 'Locked selection' : 'Default focus'
  const anchoredStateDetail = lockedItem
    ? 'This sender stays anchored below until you clear the local chart focus.'
    : 'This sender anchors the read until you focus another one.'
  const metricRowDetail =
    previewingDifferentSender && hoveredItem && focusedItem
      ? `Previewing ${hoveredItem.label} while ${focusedItem.label} stays anchored below.`
      : metricItem
        ? `Showing exact sender metrics for ${metricItem.label}.`
        : 'No sender is available yet.'
  const topItem = props.items[0] || null
  const visibleTopThreeShare = props.items
    .slice(0, 3)
    .reduce((sum, item) => sum + item.sharePct, 0)
  const activeInterpretation =
    focusedItem
      ? senderDistributionInterpretation({
          item: focusedItem,
          topItem,
          visibleTopThreeShare,
        })
      : 'No sender is available yet.'
  const whatHappened = focusedItem
    ? senderDistributionWhatHappened(focusedItem)
    : 'No sender is available yet.'
  const whyItMatters = focusedItem
    ? senderDistributionWhyItMatters({
        item: focusedItem,
        topItem,
        visibleTopThreeShare,
      })
    : 'The cleanup group needs sender distribution data before this rail can explain the workload.'
  const whatToDo = focusedItem
    ? senderDistributionWhatToDo(focusedItem, Boolean(lockedItem))
    : 'Wait for ranked sender data to load, then start with the highest visible bar.'
  const statusPillLabel =
    props.interactionStatusLabel ||
    (props.isUpdating ? 'Updating sender ranking…' : null)
  const chartWidth = chartViewportWidth > 0 ? chartViewportWidth : 320
  const chartInnerWidth = Math.max(chartWidth - paddingLeft - paddingRight, 1)
  const chartInnerHeight = Math.max(chartHeight - paddingTop - paddingBottom, 1)
  const slotWidth = props.items.length > 0 ? chartInnerWidth / props.items.length : chartInnerWidth
  const gap = props.items.length > 1 ? (slotWidth >= 10 ? Math.min(slotWidth * 0.18, 10) : 0) : 0
  const barWidth = props.items.length > 0 ? Math.max(Math.min(slotWidth - gap, 24), Math.min(slotWidth, 1)) : chartInnerWidth
  const bars = props.items.map((item, index) => {
    const x = paddingLeft + index * slotWidth + Math.max(slotWidth - barWidth, 0) / 2
    const height =
      item.messageCount > 0
        ? Math.max(18, (item.messageCount / max) * (chartHeight - paddingTop - paddingBottom))
        : 8
    const y = chartHeight - paddingBottom - height
    const slotX = paddingLeft + index * slotWidth
    return { ...item, x, y, width: barWidth, height, slotX, slotWidth }
  })
  const hoveredBar =
    hoveredItem ? bars.find((bar) => bar.senderKey === hoveredItem.senderKey) || null : null
  const hoverCardWidth = 248
  const hoverCardLeft = hoveredBar
    ? Math.min(
        Math.max(12, hoveredBar.x + hoveredBar.width / 2 - hoverCardWidth / 2),
        Math.max(12, chartWidth - hoverCardWidth - 12)
      )
    : 12
  const axisLabelValues = [max, Math.round(max / 2), 0]
  const slotMarkerIndexes = useMemo(() => {
    if (props.items.length === 0) return []
    if (props.items.length <= 12) {
      return props.items.map((_, index) => index)
    }
    return Array.from(
      new Set([
        0,
        Math.floor((props.items.length - 1) * 0.25),
        Math.floor((props.items.length - 1) * 0.5),
        Math.floor((props.items.length - 1) * 0.75),
        props.items.length - 1,
      ])
    )
  }, [props.items])
  const updateHoveredSenderKeyFromChartPosition = (
    clientX: number,
    clientY: number,
    currentTarget: SVGSVGElement
  ) => {
    if (props.items.length === 0) return

    const rect = currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const chartX = ((clientX - rect.left) / rect.width) * chartWidth
    const chartY = ((clientY - rect.top) / rect.height) * chartHeight

    if (
      chartX < paddingLeft ||
      chartX > chartWidth - paddingRight ||
      chartY < paddingTop ||
      chartY > chartHeight - paddingBottom
    ) {
      clearHoveredSenderKey()
      return
    }

    const slotIndex = Math.min(
      props.items.length - 1,
      Math.max(0, Math.floor((chartX - paddingLeft) / Math.max(slotWidth, 1 / chartWidth)))
    )
    const hoveredBar = bars[slotIndex]
    setHoveredSenderKeyIfChanged(hoveredBar?.senderKey || null)
  }
  const handleChartPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    updateHoveredSenderKeyFromChartPosition(event.clientX, event.clientY, event.currentTarget)
  }

  return (
    <SenderOverviewAnalysisRailShell
      modeLabel="Sender Distribution"
      description="Rank senders inside the current workflow scope. Scope chips still change the shared sender universe, while bar clicks keep the rail in local focus without collapsing the workflow below."
      activeRangeLabel={props.scopeControls?.activeRangeLabel}
      tabStrip={props.tabStrip}
      scopeStatus={props.scopeStatus}
      controlStrip={
        props.scopeControls ? (
          <div data-sender-distribution-control-model="shared_window_parity">
            <TimeContextChartScopeStrip
              key={[
                props.scopeControls.activeScope || 'none',
                props.scopeControls.customRangeStart || 'none',
                props.scopeControls.customRangeEnd || 'none',
              ].join('::')}
              helperText="Window changes update Sender Distribution, the sender workflow, and Decision Mode together without leaving this tab."
              activeScope={props.scopeControls.activeScope}
              pendingScope={props.scopeControls.pendingScope}
              onSelectScope={props.scopeControls.onSelectScope}
              allowedScopes={
                props.scopeControls.allowedScopes || DEFAULT_TIME_CONTEXT_VISIBLE_CHART_SCOPES
              }
              customRangeStart={props.scopeControls.customRangeStart}
              customRangeEnd={props.scopeControls.customRangeEnd}
              customRangeMin={props.scopeControls.customRangeMin}
              customRangeMax={props.scopeControls.customRangeMax}
              activeRangeLabel={props.scopeControls.activeRangeLabel}
              onApplyCustomRange={props.scopeControls.onApplyCustomRange}
            />
          </div>
        ) : null
      }
    >
      <div
        className={`${neutralInsetSurfaceClass} relative rounded-[24px] p-4`}
        data-sender-distribution-visual-root="true"
      >
        {statusPillLabel ? (
          <div className="mb-3 flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/80 bg-slate-950/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-50 shadow-[0_14px_32px_rgba(8,145,178,0.18)]">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(8,47,73,0.22)]" />
              {statusPillLabel}
            </div>
          </div>
        ) : null}

        {props.items.length === 0 ? (
          <div className="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-slate-500/25 px-6 text-center">
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-semibold text-white">
                {props.isLoading
                  ? 'Loading authoritative sender distribution'
                  : props.errorMessage
                    ? 'Could not load sender distribution for this scope'
                    : 'No sender distribution is available for this scope'}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                {props.isLoading
                  ? `${props.authoritativeContext?.detail || 'This rail is still loading the current authoritative sender universe.'} The workflow below stays mounted while the chart catches up.`
                  : props.errorMessage ||
                    `${props.authoritativeContext?.detail || 'The current authoritative scope and narrowing state are ready.'} There are zero senders to draw in this distribution.`}
              </p>
              {props.authoritativeContext?.chips.length ? (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {props.authoritativeContext.chips.map((chip) => (
                    <span
                      key={chip.key}
                      className="rounded-full border border-slate-700/60 bg-slate-900/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-200"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-700/45 bg-[rgba(9,21,33,0.76)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                    Authoritative sender distribution
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    This chart shows the full current-scope sender population. Workflow
                    pagination below does not change the rail shape.
                  </p>
                  {props.authoritativeContext ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                        {props.authoritativeContext.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {props.authoritativeContext.chips.map((chip) => (
                          <span
                            key={chip.key}
                            className="rounded-full border border-slate-700/60 bg-slate-900/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-200"
                          >
                            {chip.label}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs leading-5 text-slate-300">
                        {props.authoritativeContext.detail}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full border border-cyan-700/45 bg-cyan-950/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                    {`${props.totalRankedSenders.toLocaleString()} active sender${
                      props.totalRankedSenders === 1 ? '' : 's'
                    }`}
                  </span>
                  {props.fixedGroupSenderTotal != null &&
                  props.fixedGroupSenderTotal !== props.totalRankedSenders ? (
                    <span className="text-[10px] text-slate-400">
                      {`${props.fixedGroupSenderTotal.toLocaleString()} sender${
                        props.fixedGroupSenderTotal === 1 ? '' : 's'
                      } in this fixed review group`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div ref={chartViewportRef} className="relative mt-4 w-full">
                {hoveredItem && hoveredBar ? (
                  <div
                    data-sender-distribution-hover-card="true"
                    className="pointer-events-none absolute top-3 z-10 rounded-2xl border border-cyan-900/60 bg-gray-950/95 px-3 py-2 shadow-[0_18px_40px_rgba(2,12,27,0.55)]"
                    style={{ left: hoverCardLeft, width: hoverCardWidth }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">
                      Quick read
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{hoveredItem.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-cyan-100/75">
                      {hoveredItem.supportLabel}
                    </p>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Rank slot</span>
                        <span className="font-medium text-white">{hoveredItem.rankLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Group share</span>
                        <span className="font-medium text-white">{hoveredItem.shareLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">Supporting volume</span>
                        <span className="font-medium text-white">
                          {hoveredItem.messageCountLabel}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 border-t border-cyan-950/50 pt-2 text-[11px] leading-5 text-gray-100">
                      {senderDistributionInterpretation({
                        item: hoveredItem,
                        topItem,
                        visibleTopThreeShare,
                      })}
                    </p>
                  </div>
                ) : null}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-72 w-full"
                  onPointerMove={handleChartPointerMove}
                  onPointerLeave={clearHoveredSenderKey}
                >
                  {axisLabelValues.map((value, index) => {
                    const ratio = index === 0 ? 1 : index === 1 ? 0.5 : 0
                    const y =
                      chartHeight -
                      paddingBottom -
                      ratio * (chartHeight - paddingTop - paddingBottom)
                    return (
                      <g key={`tick-${value}-${index}`}>
                        <text
                          x={10}
                          y={y + (ratio === 0 ? 0 : 4)}
                          fill="rgba(148,163,184,0.7)"
                          fontSize="11"
                        >
                          {value.toLocaleString()}
                        </text>
                        {ratio > 0 ? (
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="rgba(148,163,184,0.14)"
                            strokeWidth="1"
                          />
                        ) : null}
                      </g>
                    )
                  })}
                  <line
                    x1={paddingLeft}
                    y1={chartHeight - paddingBottom}
                    x2={chartWidth - paddingRight}
                    y2={chartHeight - paddingBottom}
                    stroke="rgba(148,163,184,0.18)"
                    strokeWidth="1"
                  />
                  {bars.map((bar) => {
                    const isHovered = hoveredItem?.senderKey === bar.senderKey
                    const isLocked = lockedItem?.senderKey === bar.senderKey
                    const isPending = props.pendingSenderKey === bar.senderKey
                    const isDefaultFocused = !isLocked && focusedItem?.senderKey === bar.senderKey
                    return (
                      <g key={bar.senderKey}>
                        <rect
                          data-sender-distribution-slot={bar.senderKey}
                          x={bar.slotX}
                          y={paddingTop}
                          width={Math.max(bar.slotWidth, 1)}
                          height={chartInnerHeight}
                          fill="rgba(0,0,0,0.001)"
                          className="cursor-pointer"
                          role="button"
                          aria-label={`${bar.label}, ${bar.rankLabel}, ${bar.messageCountLabel}, ${bar.shareLabel}.`}
                          aria-pressed={isLocked}
                          tabIndex={0}
                          onPointerEnter={() => setHoveredSenderKeyIfChanged(bar.senderKey)}
                          onPointerMove={() => setHoveredSenderKeyIfChanged(bar.senderKey)}
                          onPointerLeave={() =>
                            setHoveredSenderKey((current) =>
                              current === bar.senderKey ? null : current
                            )
                          }
                          onFocus={() => setHoveredSenderKeyIfChanged(bar.senderKey)}
                          onBlur={() =>
                            setHoveredSenderKey((current) =>
                              current === bar.senderKey ? null : current
                            )
                          }
                          onClick={() => props.onSelectSender?.(bar.senderKey)}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter' && event.key !== ' ') return
                            event.preventDefault()
                            props.onSelectSender?.(bar.senderKey)
                          }}
                        />
                        {isPending ? (
                          <rect
                            x={bar.x - 5}
                            y={Math.max(8, bar.y - 5)}
                            width={bar.width + 10}
                            height={bar.height + 10}
                            rx={Math.min(18, Math.max(8, bar.width / 2))}
                            fill="none"
                            stroke="rgba(165,243,252,0.95)"
                            strokeWidth={2.5}
                            pointerEvents="none"
                          />
                        ) : (isLocked || isDefaultFocused) ? (
                          <rect
                            x={bar.x - 3}
                            y={Math.max(10, bar.y - 3)}
                            width={bar.width + 6}
                            height={bar.height + 6}
                            rx={Math.min(18, Math.max(8, bar.width / 2))}
                            fill="none"
                            stroke={
                              isLocked
                                ? 'rgba(255,255,255,0.92)'
                                : 'rgba(148,163,184,0.42)'
                            }
                            strokeWidth={isLocked ? 2.25 : 1.5}
                            pointerEvents="none"
                          />
                        ) : null}
                        <rect
                          data-sender-distribution-bar={bar.senderKey}
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          rx={Math.min(14, Math.max(4, bar.width / 3))}
                          fill={
                            isHovered
                              ? 'rgba(125,211,252,0.92)'
                              : isPending
                                ? 'rgba(56,189,248,0.96)'
                              : isLocked
                                ? 'rgba(103,232,249,0.8)'
                                : isDefaultFocused
                                  ? 'rgba(148,163,184,0.72)'
                                  : 'rgba(100,116,139,0.82)'
                          }
                          stroke={
                            isHovered
                              ? 'rgba(186,230,253,0.95)'
                              : isPending
                                ? 'rgba(186,230,253,0.9)'
                              : isLocked
                                ? 'rgba(255,255,255,0.24)'
                                : isDefaultFocused
                                  ? 'rgba(148,163,184,0.28)'
                                  : 'rgba(255,255,255,0.1)'
                          }
                          strokeWidth={isPending ? 1.75 : isHovered ? 1.5 : 1}
                          className="transition-all duration-150"
                          pointerEvents="none"
                        />
                        {isHovered && !isPending ? (
                          <rect
                            x={bar.x - 2}
                            y={Math.max(12, bar.y - 2)}
                            width={bar.width + 4}
                            height={bar.height + 4}
                            rx={Math.min(18, Math.max(8, bar.width / 2))}
                            fill="none"
                            stroke="rgba(186,230,253,0.9)"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        ) : null}
                      </g>
                    )
                  })}
                  {slotMarkerIndexes.map((index) => {
                    const bar = bars[index]
                    if (!bar) return null
                    const markerX =
                      index === 0
                        ? bar.slotX
                        : index === bars.length - 1
                          ? bar.slotX + bar.slotWidth
                          : bar.slotX + bar.slotWidth / 2
                    const textAnchor =
                      index === 0 ? 'start' : index === bars.length - 1 ? 'end' : 'middle'
                    return (
                      <text
                        key={`slot-marker-${bar.senderKey}`}
                        x={markerX}
                        y={chartHeight - 14}
                        textAnchor={textAnchor}
                        fill="rgba(203,213,225,0.82)"
                        fontSize="11"
                      >
                        {bar.rankLabel}
                      </text>
                    )
                  })}
                </svg>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                    Locked selection
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300/60 bg-slate-400/20" />
                    Default focus
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                    Hover preview
                  </span>
                </div>
                <p>Baseline labels show rank slots only. Hover previews and local focus reveal sender identity without changing the workflow below.</p>
              </div>
            </div>
          </>
        )}

        {props.isUpdating ? (
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-slate-950/16" />
        ) : null}
      </div>

      {props.items.length > 0 ? (
        <div
          className="rounded-[24px] border border-cyan-900/35 bg-cyan-950/10 p-4"
          data-sender-distribution-readout="true"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">In focus</p>
                <span className={`${neutralPillSurfaceClass} rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-100`}>
                  {anchoredStateLabel}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">
                {focusedItem?.label || 'No sender in focus yet'}
              </p>
              <p className="mt-1 text-sm text-cyan-50/90">{activeInterpretation}</p>
              <p className="mt-2 text-xs leading-5 text-cyan-100/75">{anchoredStateDetail}</p>
            </div>
            {lockedItem && props.onClearSelection ? (
              <button
                type="button"
                onClick={props.onClearSelection}
                className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
                data-sender-distribution-clear-focus="true"
              >
                Clear focus
              </button>
            ) : (
              <p className="max-w-sm text-xs leading-5 text-cyan-100/70">
                The rail is currently centered on the highest-ranked sender in the current scope.
              </p>
            )}
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  Exact metrics
                </p>
                <p className="mt-1 text-xs leading-5 text-cyan-100/75">{metricRowDetail}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {diagnosticRow(
              'Rank slot',
              metricItem ? metricItem.rankLabel : '—',
              previewingDifferentSender && hoveredItem && focusedItem
                ? `${hoveredItem.label} is being previewed while ${focusedItem.label} stays locked below.`
                : metricItem
                  ? `${metricItem.label} in the current scope.`
                  : 'No sender is available yet.'
            )}
            {diagnosticRow(
              'Group share',
              metricItem ? metricItem.shareLabel : '—',
              'Share of cleanup-group volume in the current authoritative scope.'
            )}
            {diagnosticRow(
              'Supporting volume',
              metricItem ? metricItem.messageCountLabel : '—',
              metricItem
                ? metricItem.supportLabel
                : 'Sender signal and unread context appear here once the rail is ready.'
            )}
          </div>

          <div className={`${neutralNestedSurfaceClass} mt-4 rounded-[22px] p-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                Across this cleanup group
              </p>
              <span className="text-[11px] leading-5 text-slate-400">
                This durable read stays anchored to the locked sender until you clear it.
              </span>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {diagnosticRow(
                'What happened',
                focusedItem ? focusedItem.label : 'No sender yet',
                whatHappened
              )}
              {diagnosticRow('Why it matters', 'Workload read', whyItMatters)}
              {diagnosticRow('What to do', lockedItem ? 'Stay focused' : 'Next move', whatToDo)}
            </div>
          </div>
        </div>
      ) : null}
    </SenderOverviewAnalysisRailShell>
  )
}

function timeContextChartScopeControlLabel(scope: TimeContextChartScope): string {
  if (scope === 'all_indexed') return 'All indexed'
  if (scope === 'last_year') return '1Y'
  if (scope === 'last_quarter') return '1Q'
  if (scope === 'last_month') return '1M'
  if (scope === 'last_week') return '1W'
  if (scope === 'last_day') return '1D'
  return 'Custom'
}

function timeContextBucketUnitLabel(
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
  count = 1
): string {
  const plural = count === 1 ? '' : 's'
  if (granularity === 'hour') return `hour${plural}`
  if (granularity === 'week') return `week${plural}`
  if (granularity === 'month') return `month${plural}`
  if (granularity === 'quarter') return `quarter${plural}`
  if (granularity === 'year') return `year${plural}`
  return `day${plural}`
}

function TimeContextChartScopeStrip(props: {
  activeScope: TimeContextChartScope | null
  pendingScope: TimeContextChartScope | null
  onSelectScope?: (scope: TimeContextChartScope) => void
  allowedScopes: readonly TimeContextChartScope[]
  helperText?: string
  customRangeStart?: string | null
  customRangeEnd?: string | null
  customRangeMin?: string | null
  customRangeMax?: string | null
  activeRangeLabel?: string | null
  onApplyCustomRange?: (start: string, end: string) => void
}) {
  const buildDefaultCustomRangeDraft = () => ({
    start: props.customRangeStart || props.customRangeMin || '',
    end: props.customRangeEnd || props.customRangeMax || '',
  })
  const [customEditorOpen, setCustomEditorOpen] = useState(() => props.activeScope === 'custom')
  const [customRangeDraft, setCustomRangeDraft] = useState(buildDefaultCustomRangeDraft)

  const applyCustomRange = () => {
    if (
      !props.onApplyCustomRange ||
      !customRangeDraft.start ||
      !customRangeDraft.end ||
      customRangeDraft.start > customRangeDraft.end
    ) {
      return
    }
    props.onApplyCustomRange(customRangeDraft.start, customRangeDraft.end)
    setCustomEditorOpen(false)
  }

  const renderScopeButton = (scope: TimeContextChartScope) => {
    const isActive = props.activeScope === scope
    const isPending = props.pendingScope === scope
    const interactive = typeof props.onSelectScope === 'function'
    const className = isActive
      ? 'rounded-full border border-cyan-500/75 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-50'
      : isPending
        ? 'rounded-full border border-cyan-400/70 bg-cyan-950/28 px-3 py-1.5 text-xs font-medium text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
        : 'rounded-full border border-slate-600/55 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-700/55 hover:text-cyan-100'
    const label =
      isPending && !isActive
        ? `${timeContextChartScopeControlLabel(scope)} · Applying`
        : timeContextChartScopeControlLabel(scope)

    if (!interactive) {
      return (
        <span key={scope} className={className}>
          {label}
        </span>
      )
    }

    return (
      <button
        key={scope}
        type="button"
        aria-pressed={isActive}
        aria-busy={isPending}
        disabled={isPending}
        onClick={() => {
          if (scope === 'custom') {
            setCustomRangeDraft(buildDefaultCustomRangeDraft())
            setCustomEditorOpen(true)
            return
          }
          props.onSelectScope?.(scope)
        }}
        className={className}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {props.allowedScopes.map((scope) => renderScopeButton(scope))}
        </div>
        <p className="max-w-md text-right text-xs leading-5 text-slate-400">
          {props.helperText ||
            'Window changes update the shared Analysis Rail and sender workflow together without reloading the page.'}
        </p>
      </div>
      {customEditorOpen && props.onApplyCustomRange ? (
        <div className={`${neutralInsetSurfaceClass} rounded-2xl border border-cyan-700/30 p-3`}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Start date</span>
              <input
                type="date"
                value={customRangeDraft.start}
                min={props.customRangeMin || undefined}
                max={props.customRangeMax || undefined}
                onChange={(event) =>
                  setCustomRangeDraft((current) => ({ ...current, start: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-600/55 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">End date</span>
              <input
                type="date"
                value={customRangeDraft.end}
                min={props.customRangeMin || undefined}
                max={props.customRangeMax || undefined}
                onChange={(event) =>
                  setCustomRangeDraft((current) => ({ ...current, end: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-600/55 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/70"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] leading-5 text-slate-300">
              Custom ranges are limited to indexed history. Out-of-range requests are adjusted to the available indexed span instead of pretending coverage exists.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomRangeDraft(buildDefaultCustomRangeDraft())
                  setCustomEditorOpen(false)
                }}
                className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={
                  !customRangeDraft.start ||
                  !customRangeDraft.end ||
                  customRangeDraft.start > customRangeDraft.end
                }
                className="rounded-full border border-cyan-500/70 bg-cyan-950/35 px-3 py-1.5 text-xs font-medium text-cyan-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Apply range
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SenderTimeContextAnalysisRail(props: {
  items: Array<{
    label: string
    count: number
    messageCount?: number | null
    bucketStartIso?: string | null
    bucketEndExclusiveIso?: string | null
  }>
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  overallActivity: SenderTimeContextRailMetric
  activityMix: SenderTimeContextRailMetric
  patternSignal: SenderTimeContextRailMetric
  nextAction: {
    title: string
    detail: string
  }
  workflowContext?: {
    total: number | null
    label?: string | null
    detail?: string | null
  } | null
  scopeControls?: {
    activeScope: TimeContextChartScope | null
    pendingScope: TimeContextChartScope | null
    onSelectScope?: (scope: TimeContextChartScope) => void
    allowedScopes: readonly TimeContextChartScope[]
    customRangeStart?: string | null
    customRangeEnd?: string | null
    customRangeMin?: string | null
    customRangeMax?: string | null
    activeRangeLabel?: string | null
    onApplyCustomRange?: (start: string, end: string) => void
  }
  scopeStatus?: {
    label: string
    detail: string
    tone: 'aligned' | 'comparing' | 'outside' | 'not_loaded'
  }
  tabStrip?: ReactNode
  isUpdating?: boolean
  bodyOverride?: ReactNode | null
  workflowSenderUniverseTotal?: number | null
  bucketSelection?: {
    activeLabel: string | null
    mode?: 'workflow_narrowing' | 'chart_only_focus'
    onToggleBucket?: (item: {
      label: string
      count: number
      messageCount?: number | null
      bucketStartIso?: string | null
      bucketEndExclusiveIso?: string | null
    }) => void
    disabledReason?: string | null
    isLoading?: boolean
    notice?: {
      tone: 'info' | 'warning' | 'error'
      title: string
      detail: string
    } | null
  }
}) {
  // Time Context is a recurring-observation projection: bar height preserves
  // every activity occurrence, while selection resolves the distinct subjects
  // behind that activity without inventing an exclusive timeline partition.
  const formatTimelineBucketLabel = (
    label: string,
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    format: 'axis' | 'compact' | 'full' = 'compact'
  ): string => {
    const normalized = label.trim()
    if (!normalized) return label

    if (granularity === 'hour') {
      const parsed = /^\d{4}-\d{2}-\d{2}T\d{2}$/.test(normalized)
        ? Date.parse(`${normalized}:00:00Z`)
        : Date.parse(normalized)
      if (!Number.isFinite(parsed)) return normalized
      const date = new Date(parsed)
      if (format === 'axis') {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
          timeZone: 'UTC',
        })
      }
      if (format === 'full') {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        })
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      })
    }

    if (granularity === 'month') {
      const parsed = /^\d{4}-\d{2}$/.test(normalized)
        ? Date.parse(`${normalized}-01T00:00:00Z`)
        : Date.parse(normalized)
      if (!Number.isFinite(parsed)) return normalized
      const date = new Date(parsed)
      const monthLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        timeZone: 'UTC',
      })
      if (format === 'axis') {
        return `${monthLabel} '${String(date.getUTCFullYear()).slice(-2)}`
      }
      return `${monthLabel} ${date.getUTCFullYear()}`
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
    const parsed = Date.parse(`${normalized}T00:00:00Z`)
    if (!Number.isFinite(parsed)) return normalized
    const dateLabel = new Date(parsed).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    if (granularity === 'week' && format === 'full') {
      return `Week of ${dateLabel}`
    }
      return dateLabel
  }
  const formatTimelineBucketSpanLabel = (item: {
    label: string
    bucketStartIso?: string | null
    bucketEndExclusiveIso?: string | null
  }): string => {
    const startMs =
      typeof item.bucketStartIso === 'string' ? Date.parse(item.bucketStartIso) : Number.NaN
    const endExclusiveMs =
      typeof item.bucketEndExclusiveIso === 'string'
        ? Date.parse(item.bucketEndExclusiveIso)
        : Number.NaN
    if (!Number.isFinite(startMs) || !Number.isFinite(endExclusiveMs)) {
      return formatTimelineBucketLabel(item.label, props.granularity, 'full')
    }
    const start = new Date(startMs)
    const end = new Date(Math.max(startMs, endExclusiveMs - 1))
    if (props.granularity === 'hour') {
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      })
      return `${formatter.format(start)} - ${formatter.format(end)}`
    }
    const sameDay =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCDate() === end.getUTCDate()
    if (sameDay) {
      return start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
    const startLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(sameYear ? {} : { year: 'numeric' }),
      timeZone: 'UTC',
    })
    const endLabel = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
    return `${startLabel} - ${endLabel}`
  }
  const rawChartItems = props.items.map((item, index) => ({
    ...item,
    messageCount:
      typeof item.messageCount === 'number' && Number.isFinite(item.messageCount)
        ? Math.max(0, item.messageCount)
        : null,
    activityCount:
      typeof item.messageCount === 'number' && Number.isFinite(item.messageCount)
        ? Math.max(0, item.messageCount)
        : Math.max(0, item.count),
    key: `${item.label}-${index}`,
    compactLabel: formatTimelineBucketLabel(item.label, props.granularity, 'axis'),
    detailLabel: formatTimelineBucketSpanLabel(item),
  }))
  const activeScope = props.scopeControls?.activeScope || null
  const usesFixedDailySlots =
    activeScope === 'last_day' || activeScope === 'last_week' || activeScope === 'last_month'
  const usesCompressedTimeline = activeScope === 'custom'
  const hiddenInactiveItems = usesCompressedTimeline
    ? rawChartItems.filter((item) => item.activityCount === 0)
    : []
  const chartItems = usesCompressedTimeline
    ? rawChartItems.filter((item) => item.activityCount > 0)
    : rawChartItems
  const hiddenInactiveBucketCount = hiddenInactiveItems.length
  const hiddenInactiveBucketUnitLabel = timeContextBucketUnitLabel(
    props.granularity,
    hiddenInactiveBucketCount
  )
  const peakItem = chartItems
    .slice()
    .sort(
      (left, right) =>
        right.activityCount - left.activityCount || left.label.localeCompare(right.label)
    )[0] || null
  const latestItem = chartItems[chartItems.length - 1] || null
  const activeBucketMode = props.bucketSelection?.mode || 'workflow_narrowing'
  const activeBucketLabel = props.bucketSelection?.activeLabel || null
  const activeBucketItem =
    activeBucketLabel != null
      ? chartItems.find((item) => item.label === activeBucketLabel) || null
      : null
  const bucketSelectionEnabled = typeof props.bucketSelection?.onToggleBucket === 'function'
  const bucketSelectionDisabledReason = props.bucketSelection?.disabledReason || null
  const bucketSelectionNotice = props.bucketSelection?.notice || null
  const defaultFocusedItem =
    hasMeaningfullyDistinctActivityPeak(
      peakItem ? { ...peakItem, count: peakItem.activityCount } : null,
      latestItem ? { ...latestItem, count: latestItem.activityCount } : null
    ) && peakItem
      ? peakItem
      : latestItem || chartItems[0] || null
  const [hoveredInteraction, setHoveredInteraction] = useState<{
    scope: TimeContextChartScope | null
    itemKey: string | null
  }>({
    scope: activeScope,
    itemKey: null,
  })
  const chartViewportRef = useRef<HTMLDivElement | null>(null)
  const [chartViewportWidth, setChartViewportWidth] = useState(0)
  const max = maxChartValue(chartItems.map((item) => item.activityCount))
  const chartHeight = 272
  const paddingLeft = 56
  const paddingRight = 36
  const paddingTop = 24
  const paddingBottom = 44

  useEffect(() => {
    const node = chartViewportRef.current
    if (!node) return

    const syncWidth = (nextWidth?: number) => {
      const measuredWidth = Math.floor(nextWidth || node.getBoundingClientRect().width)
      if (measuredWidth > 0) setChartViewportWidth(measuredWidth)
    }

    syncWidth()

    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') return
      const handleResize = () => syncWidth()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      syncWidth(entries[0]?.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = chartViewportRef.current
    if (!node || typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return
    }

    const syncWidth = () => {
      const measuredWidth = Math.floor(node.getBoundingClientRect().width)
      if (measuredWidth > 0) {
        setChartViewportWidth((current) => (current === measuredWidth ? current : measuredWidth))
      }
    }

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      syncWidth()
      secondFrame = window.requestAnimationFrame(syncWidth)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
    }
  }, [activeScope, chartItems.length, props.bodyOverride])

  const hoveredItemKey = hoveredInteraction.scope === activeScope ? hoveredInteraction.itemKey : null
  const resolvedHoveredItemKey =
    hoveredItemKey && chartItems.some((item) => item.key === hoveredItemKey) ? hoveredItemKey : null
  const hoveredItem =
    chartItems.find((item) => item.key === resolvedHoveredItemKey) || null
  const anchoredItem = activeBucketItem || defaultFocusedItem
  const anchoredIndex = anchoredItem
    ? chartItems.findIndex((item) => item.key === anchoredItem.key)
    : -1
  const previousAnchoredItem = anchoredIndex > 0 ? chartItems[anchoredIndex - 1] : null
  const activeInterpretation =
    anchoredItem
      ? senderTimeContextInterpretation({
          item: {
            ...anchoredItem,
            label: anchoredItem.detailLabel,
            count: anchoredItem.activityCount,
          },
          previous: previousAnchoredItem
            ? {
                ...previousAnchoredItem,
                label: previousAnchoredItem.detailLabel,
                count: previousAnchoredItem.activityCount,
              }
            : null,
          peak: peakItem
            ? { ...peakItem, label: peakItem.detailLabel, count: peakItem.activityCount }
            : null,
          latest: latestItem
            ? { ...latestItem, label: latestItem.detailLabel, count: latestItem.activityCount }
            : null,
        })
      : 'No visible activity is available yet.'
  const whatHappened =
    anchoredItem
      ? senderTimeContextWhatHappened({
          item: {
            ...anchoredItem,
            label: anchoredItem.detailLabel,
            count: anchoredItem.activityCount,
          },
          previous: previousAnchoredItem
            ? {
                ...previousAnchoredItem,
                label: previousAnchoredItem.detailLabel,
                count: previousAnchoredItem.activityCount,
              }
            : null,
          peak: peakItem
            ? { ...peakItem, label: peakItem.detailLabel, count: peakItem.activityCount }
            : null,
          latest: latestItem
            ? { ...latestItem, label: latestItem.detailLabel, count: latestItem.activityCount }
            : null,
        })
      : 'No visible activity is available yet.'
  const whyItMatters =
    anchoredItem
      ? senderTimeContextWhyItMatters({
          item: {
            ...anchoredItem,
            label: anchoredItem.detailLabel,
            count: anchoredItem.activityCount,
          },
          peak: peakItem
            ? { ...peakItem, label: peakItem.detailLabel, count: peakItem.activityCount }
            : null,
          latest: latestItem
            ? { ...latestItem, label: latestItem.detailLabel, count: latestItem.activityCount }
            : null,
        })
      : 'The cleanup group needs visible timeline data before this rail can explain the workload.'
  const whatToDo =
    anchoredItem
      ? senderTimeContextWhatToDo({
          item: {
            ...anchoredItem,
            label: anchoredItem.detailLabel,
            count: anchoredItem.activityCount,
          },
          latest: latestItem
            ? { ...latestItem, label: latestItem.detailLabel, count: latestItem.activityCount }
            : null,
          nextActionDetail: props.nextAction.detail,
        })
      : props.nextAction.detail
  const chartWidth = chartViewportWidth > 0 ? chartViewportWidth : 320
  const chartInnerHeight = chartHeight - paddingTop - paddingBottom
  const chartInnerWidth = Math.max(chartWidth - paddingLeft - paddingRight, 1)
  const slotWidth = chartItems.length > 0 ? chartInnerWidth / chartItems.length : chartInnerWidth
  const gap =
    chartItems.length > 1
      ? usesFixedDailySlots
        ? Math.min(Math.max(slotWidth * 0.18, 2), 8)
        : Math.min(Math.max(slotWidth * 0.18, 6), 18)
      : 0
  const barWidth =
    chartItems.length > 0
      ? usesFixedDailySlots
        ? Math.max(Math.min(slotWidth - gap, slotWidth), 2)
        : Math.max(Math.min(slotWidth - gap, slotWidth), Math.min(slotWidth, 2))
      : chartInnerWidth
  const minimumAxisLabelSpacingPx =
    props.granularity === 'month' ? 86 : chartItems.length > 20 ? 62 : 46
  const trailingAxisLabelGuardPx =
    props.granularity === 'month' ? 88 : chartItems.length > 20 ? 54 : 34
  const axisLabelStep =
    chartItems.length <= 2
      ? 1
      : Math.max(1, Math.ceil(minimumAxisLabelSpacingPx / Math.max(slotWidth, 1)))
  const baseBars = chartItems.map((item, index) => {
    const slotX = paddingLeft + index * slotWidth
    const x = slotX + Math.max(slotWidth - barWidth, 0) / 2
    const height =
      item.activityCount > 0
        ? Math.max(18, (item.activityCount / max) * chartInnerHeight)
        : 0
    const y = chartHeight - paddingBottom - height
    return {
      ...item,
      slotX,
      slotWidth,
      x,
      y,
      width: barWidth,
      height,
      isZeroValue: item.activityCount === 0,
    }
  })
  const axisLabelIndexes = new Set<number>()
  const lastBar = baseBars[baseBars.length - 1] || null
  let lastShownLabelX = Number.NEGATIVE_INFINITY
  baseBars.forEach((bar, index) => {
    const lastIndex = baseBars.length - 1
    const yearBoundary =
      props.granularity === 'month' &&
      index > 0 &&
      bar.label.slice(0, 4) !== baseBars[index - 1]?.label.slice(0, 4)
    const candidate =
      index === 0 || index === lastIndex || index % axisLabelStep === 0 || yearBoundary
    if (!candidate) return
    const slotLeft = usesFixedDailySlots ? bar.slotX : bar.x
    const slotRight = usesFixedDailySlots ? bar.slotX + bar.slotWidth : bar.x + bar.width
    const labelX =
      index === 0
        ? slotLeft
        : index === lastIndex
          ? slotRight
          : slotLeft + (slotRight - slotLeft) / 2
    if (
      index !== lastIndex &&
      lastBar &&
      (usesFixedDailySlots
        ? lastBar.slotX + lastBar.slotWidth
        : lastBar.x + lastBar.width) -
        labelX <
        trailingAxisLabelGuardPx
    ) {
      return
    }
    if (index !== 0 && labelX - lastShownLabelX < minimumAxisLabelSpacingPx) {
      return
    }
    axisLabelIndexes.add(index)
    lastShownLabelX = labelX
  })
  if (baseBars.length > 0) {
    axisLabelIndexes.add(baseBars.length - 1)
  }
  const bars = baseBars.map((bar, index) => ({
    ...bar,
    showAxisLabel: axisLabelIndexes.has(index),
  }))
  const hoveredBar =
    hoveredItem ? bars.find((bar) => bar.key === hoveredItem.key) || null : null
  const hoverPreviousItem =
    hoveredItem
      ? chartItems[chartItems.findIndex((item) => item.key === hoveredItem.key) - 1] || null
      : null
  const hoverDelta =
    hoveredItem && hoverPreviousItem
      ? hoveredItem.activityCount - hoverPreviousItem.activityCount
      : null
  const hoverCardWidth = 248
  const hoverCardLeft = hoveredBar
    ? Math.min(
        Math.max(
          12,
          (usesFixedDailySlots
            ? hoveredBar.slotX + hoveredBar.slotWidth / 2
            : hoveredBar.x + hoveredBar.width / 2) -
            hoverCardWidth / 2
        ),
        Math.max(12, chartWidth - hoverCardWidth - 12)
      )
    : 12
  const axisLabelValues = [max, Math.round(max / 2), 0]
  const previewingDifferentPeriod =
    Boolean(hoveredItem && anchoredItem && hoveredItem.key !== anchoredItem.key)
  const anchoredStateLabel = activeBucketItem
    ? activeBucketMode === 'chart_only_focus'
      ? 'Focused bucket'
      : 'Selected bucket'
    : 'Default focus'
  const anchoredStateDetail = activeBucketItem
    ? activeBucketMode === 'chart_only_focus'
      ? 'This bucket anchors the lower-card read without applying any additional workflow filter.'
      : 'This selected bucket anchors the lower-card read while hover previews another visible period.'
    : 'This period anchors the lower-card read while hover previews another visible period.'
  const metricPanelDetail =
    previewingDifferentPeriod && hoveredItem && anchoredItem
      ? `Previewing ${hoveredItem.detailLabel} while ${anchoredItem.detailLabel} stays anchored as the ${
          activeBucketItem
            ? activeBucketMode === 'chart_only_focus'
              ? 'focused bucket'
              : 'selected bucket'
            : 'default focus'
        }.`
      : anchoredItem
        ? activeBucketMode === 'chart_only_focus' && activeBucketItem
          ? `Showing the exact chart truth for ${anchoredItem.detailLabel} without applying any additional bucket filter below.`
          : `Showing the exact bucket truth for ${anchoredItem.detailLabel}.`
        : 'No visible period is available yet.'
  const workflowSenderUniverseTotal = Math.max(0, props.workflowSenderUniverseTotal || 0)
  const workflowContextTotal =
    typeof props.workflowContext?.total === 'number' && Number.isFinite(props.workflowContext.total)
      ? Math.max(0, props.workflowContext.total)
      : 0
  const workflowContextLabel =
    props.workflowContext?.label?.trim() || 'Workflow context'
  const workflowContextDetail =
    props.workflowContext?.detail?.trim() || null
  const bucketUnitLabel = 'period'
  const bucketMeaningLead =
    'Each bar shows total activity inside that exact period. In this email workspace, activity means supporting messages. One sender can contribute several messages in one period or appear across several periods.'
  const metricSupportingMessages =
    anchoredItem &&
    typeof anchoredItem.messageCount === 'number' &&
    Number.isFinite(anchoredItem.messageCount)
      ? Math.max(0, anchoredItem.messageCount)
      : null
  const metricTruthNote = anchoredItem
    ? activeBucketMode === 'chart_only_focus'
      ? `${metricSupportingMessages != null ? `${metricSupportingMessages.toLocaleString()} supporting messages came from ` : 'Activity came from '}${anchoredItem.count.toLocaleString()} distinct senders in ${anchoredItem.detailLabel}. This focus stays local to the chart while the active workflow below remains unchanged.`
      : workflowSenderUniverseTotal > 0
      ? anchoredItem.count === workflowSenderUniverseTotal
        ? `${metricSupportingMessages != null ? `${metricSupportingMessages.toLocaleString()} supporting messages came from ` : 'Activity came from '}${anchoredItem.count.toLocaleString()} distinct senders in ${anchoredItem.detailLabel}. Those senders match the full current workflow scope.`
        : `${metricSupportingMessages != null ? `${metricSupportingMessages.toLocaleString()} supporting messages came from ` : 'Activity came from '}${anchoredItem.count.toLocaleString()} distinct senders in ${anchoredItem.detailLabel}. The current workflow contains ${workflowSenderUniverseTotal.toLocaleString()} unique senders; clicking this ${bucketUnitLabel} reviews only the senders active here.`
      : `${metricSupportingMessages != null ? `${metricSupportingMessages.toLocaleString()} supporting messages came from ` : 'Activity came from '}${anchoredItem.count.toLocaleString()} distinct senders in ${anchoredItem.detailLabel}.`
    : 'No visible bucket is available yet.'
  const workflowContextNote =
    activeBucketMode === 'chart_only_focus' && anchoredItem && workflowContextTotal > 0
      ? `${workflowContextLabel}: the workflow below currently shows ${workflowContextTotal.toLocaleString()} unique senders. ${anchoredItem.detailLabel} is an activity view inside that unchanged workflow context.`
      : null
  const compressedTimelineDisclosure =
    usesCompressedTimeline && hiddenInactiveBucketCount > 0
      ? `${timeContextChartScopeControlLabel(activeScope || 'custom')} hides ${hiddenInactiveBucketCount.toLocaleString()} inactive ${hiddenInactiveBucketUnitLabel} in this Time Context view so visible activity periods flow continuously. Hover and lower-card readouts still use the original raw bucket truth for each visible period.`
      : null
  const scopeSemanticsDisclosure =
    'All Time Context scopes read the same canonical subject-activity facts. Scope buttons change only the visible window or aggregation level, so overlapping dates reconcile while repeated activity remains visible.'
  const compressedTimelineEmptyStateDetail =
    usesCompressedTimeline
      ? hiddenInactiveBucketCount > 0
        ? `Compressed mode hides ${hiddenInactiveBucketCount.toLocaleString()} inactive ${hiddenInactiveBucketUnitLabel}, and this window has no active periods left to render.`
        : 'This Time Context window has no active periods to render.'
      : null

  return (
    <SenderOverviewAnalysisRailShell
      modeLabel="Time Context"
      description="Inspect when this group was most active. Window controls change the shared workflow, and selecting a bar narrows the workflow to that exact period."
      activeRangeLabel={props.scopeControls?.activeRangeLabel}
      tabStrip={props.tabStrip}
      scopeStatus={props.scopeStatus}
      controlStrip={
        props.scopeControls ? (
          <div data-time-context-control-model="shared_window_parity">
            <TimeContextChartScopeStrip
              key={[
                props.scopeControls.activeScope || 'none',
                props.scopeControls.customRangeStart || 'none',
                props.scopeControls.customRangeEnd || 'none',
              ].join('::')}
              helperText="Window changes update Time Context, Sender Distribution, the sender workflow, and Decision Mode together without reloading the page."
              activeScope={props.scopeControls.activeScope}
              pendingScope={props.scopeControls.pendingScope}
              onSelectScope={props.scopeControls.onSelectScope}
              allowedScopes={props.scopeControls.allowedScopes}
              customRangeStart={props.scopeControls.customRangeStart}
              customRangeEnd={props.scopeControls.customRangeEnd}
              customRangeMin={props.scopeControls.customRangeMin}
              customRangeMax={props.scopeControls.customRangeMax}
              activeRangeLabel={props.scopeControls.activeRangeLabel}
              onApplyCustomRange={props.scopeControls.onApplyCustomRange}
            />
          </div>
        ) : null
      }
    >
      <div
        className={`${neutralInsetSurfaceClass} relative rounded-[24px] p-4`}
        data-time-context-visual-root="true"
        data-time-context-granularity={props.granularity}
        data-time-context-bucket-count={chartItems.length}
        data-time-context-raw-bucket-count={rawChartItems.length}
        data-time-context-compressed-mode={usesCompressedTimeline ? 'true' : 'false'}
        data-time-context-hidden-bucket-count={hiddenInactiveBucketCount}
      >
        {props.isUpdating ? (
          <div className="mb-3 flex justify-end">
            <div className="rounded-full border border-cyan-700/45 bg-slate-950/85 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
              Updating time window…
            </div>
          </div>
        ) : null}
        {compressedTimelineDisclosure ? (
          <div
            className="mb-3 rounded-2xl border border-cyan-700/40 bg-cyan-950/14 px-4 py-3"
            data-time-context-compressed-disclosure="true"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
              Inactive periods hidden
            </p>
            <p className="mt-2 text-sm leading-6 text-cyan-50">
              {compressedTimelineDisclosure}
            </p>
          </div>
        ) : null}
        {activeBucketItem ? (
          <div className="mb-3 rounded-2xl border border-cyan-700/40 bg-cyan-950/14 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  Focused bucket
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {`${activeBucketItem.detailLabel} anchors the lower readout.`}
                </p>
                <p className="mt-1 text-xs leading-5 text-cyan-100/75">
                  {activeBucketMode === 'workflow_narrowing'
                    ? 'The surrounding bars stay visible while the workflow below narrows to this exact period.'
                    : 'This focus is local to Time Context. The surrounding bars stay visible, the chart keeps the same scope, and the workflow below stays unchanged.'}
                </p>
              </div>
              {props.bucketSelection?.onToggleBucket ? (
                <button
                  type="button"
                  onClick={() =>
                    props.bucketSelection?.onToggleBucket?.({
                      label: activeBucketItem.label,
                      count: activeBucketItem.count,
                      messageCount: activeBucketItem.messageCount,
                      bucketStartIso: activeBucketItem.bucketStartIso,
                      bucketEndExclusiveIso: activeBucketItem.bucketEndExclusiveIso,
                    })
                  }
                  className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
                  data-time-context-clear-focus="true"
                >
                  {activeBucketMode === 'workflow_narrowing' ? 'Clear period' : 'Clear focus'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {bucketSelectionNotice ? (
          <div
            className={`mb-3 rounded-2xl border px-4 py-3 ${
              bucketSelectionNotice.tone === 'error'
                ? 'border-rose-700/45 bg-rose-950/18'
                : bucketSelectionNotice.tone === 'warning'
                  ? 'border-amber-700/45 bg-amber-950/18'
                  : 'border-cyan-700/40 bg-cyan-950/14'
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-[0.22em] ${
                bucketSelectionNotice.tone === 'error'
                  ? 'text-rose-200'
                  : bucketSelectionNotice.tone === 'warning'
                    ? 'text-amber-200'
                    : 'text-cyan-300'
              }`}
            >
              {bucketSelectionNotice.title}
            </p>
            <p
              className={`mt-2 text-sm leading-6 ${
                bucketSelectionNotice.tone === 'error'
                  ? 'text-rose-50'
                  : bucketSelectionNotice.tone === 'warning'
                    ? 'text-amber-50'
                    : 'text-cyan-50'
              }`}
            >
              {bucketSelectionNotice.detail}
            </p>
          </div>
        ) : null}
        {props.bodyOverride ? (
          <div className="min-h-[52rem]">{props.bodyOverride}</div>
        ) : chartItems.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-500/25 px-6 text-center">
            <div className="max-w-xl space-y-2">
              <p className="text-sm font-semibold text-white">
                {usesCompressedTimeline
                  ? 'No active time context is visible in this window'
                  : 'No visible time context yet'}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                {compressedTimelineEmptyStateDetail ||
                  'This rail will appear once the cleanup group has enough sender activity to chart.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="mb-4 rounded-2xl border border-slate-500/15 bg-black/10 px-4 py-3"
              data-time-context-metric-meaning="true"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Metric meaning</p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                {bucketMeaningLead}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300/85">
                Focused bucket details below separate total activity from the unique senders who
                produced it. Clicking a bar reviews each of those senders once and keeps their
                individual message volume visible in the list.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300/85">
                A sender may contribute activity in more than one period. Activity bars are additive
                across non-overlapping periods, while unique sender counts are not because the same
                sender may appear again later.
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300/85">
                Read bar height as activity volume. Use the focused details to see how many unique
                senders created that activity, then click the bar to inspect those senders.
              </p>
              {scopeSemanticsDisclosure ? (
                <p className="mt-1 text-xs leading-5 text-slate-300/85">
                  {scopeSemanticsDisclosure}
                </p>
              ) : null}
            </div>
            <div ref={chartViewportRef} className="relative w-full">
              {hoveredItem && hoveredBar ? (
                <div
                  className="pointer-events-none absolute top-3 z-10 rounded-2xl border border-cyan-900/60 bg-gray-950/95 px-3 py-2 shadow-[0_18px_40px_rgba(2,12,27,0.55)]"
                  style={{ left: hoverCardLeft, width: hoverCardWidth }}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">
                    Quick read
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{hoveredItem.detailLabel}</p>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Supporting messages</span>
                      <span className="font-medium text-white">
                        {hoveredItem.activityCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Active senders</span>
                      <span className="font-medium text-white">{hoveredItem.count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Previous messages</span>
                      <span className="font-medium text-white">
                        {hoverPreviousItem
                          ? hoverPreviousItem.activityCount.toLocaleString()
                          : 'No prior period'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-500">Message change</span>
                      <span className="font-medium text-white">{formatSignedCount(hoverDelta)}</span>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-cyan-950/50 pt-2 text-[11px] leading-5 text-gray-100">
                    {senderTimeContextInterpretation({
                      item: {
                        ...hoveredItem,
                        label: hoveredItem.detailLabel,
                        count: hoveredItem.activityCount,
                      },
                      previous: hoverPreviousItem
                        ? {
                            ...hoverPreviousItem,
                            label: hoverPreviousItem.detailLabel,
                            count: hoverPreviousItem.activityCount,
                          }
                        : null,
                      peak: peakItem
                        ? { ...peakItem, label: peakItem.detailLabel, count: peakItem.activityCount }
                        : null,
                      latest: latestItem
                        ? {
                            ...latestItem,
                            label: latestItem.detailLabel,
                            count: latestItem.activityCount,
                          }
                        : null,
                    })}
                  </p>
                </div>
              ) : null}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-72 w-full">
                {axisLabelValues.map((value, index) => {
                  const ratio = index === 0 ? 1 : index === 1 ? 0.5 : 0
                  const y =
                    chartHeight -
                    paddingBottom -
                    ratio * (chartHeight - paddingTop - paddingBottom)
                  return (
                    <g key={`tick-${value}-${index}`}>
                      <text
                        x={10}
                        y={y + (ratio === 0 ? 0 : 4)}
                        fill="rgba(148,163,184,0.7)"
                        fontSize="11"
                      >
                        {value.toLocaleString()}
                      </text>
                      {ratio > 0 ? (
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="rgba(148,163,184,0.14)"
                          strokeWidth="1"
                        />
                      ) : null}
                    </g>
                  )
                })}
                <line
                  x1={paddingLeft}
                  y1={chartHeight - paddingBottom}
                  x2={chartWidth - paddingRight}
                  y2={chartHeight - paddingBottom}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="1"
                />
                {bars.map((bar, index) => {
                  const isPeak = peakItem?.key === bar.key
                  const isLatest = latestItem?.key === bar.key
                  const isHovered = hoveredItem?.key === bar.key
                  const isDefaultFocused =
                    activeBucketItem == null && defaultFocusedItem?.key === bar.key
                  const isActiveBucket = activeBucketLabel === bar.label
                  const canInteractWithBucket =
                    bucketSelectionEnabled &&
                    bucketSelectionDisabledReason == null &&
                    bar.count > 0
                  const bucketInteractionLabel =
                    activeBucketMode === 'workflow_narrowing'
                      ? 'Press to narrow the workflow to this exact period.'
                      : 'Press to focus this bucket in the lower readout.'
                  const interactionX = usesFixedDailySlots ? bar.slotX : bar.x
                  const interactionWidth = usesFixedDailySlots ? bar.slotWidth : bar.width
                  const slotCenterX = interactionX + interactionWidth / 2
                  const slotOutlineInset = usesFixedDailySlots
                    ? Math.min(Math.max(interactionWidth * 0.12, 0.75), 1.5)
                    : 0
                  const activeOutlineInset = usesFixedDailySlots
                    ? Math.min(Math.max(interactionWidth * 0.08, 0.5), 1)
                    : 0
                  const hoverOutlineInset = usesFixedDailySlots
                    ? Math.min(Math.max(interactionWidth * 0.06, 0.35), 0.8)
                    : 0
                  const markerInset = usesFixedDailySlots
                    ? Math.min(Math.max(interactionWidth * 0.18, 1), 3)
                    : 2
                  const bucketAriaLabel = `${bar.detailLabel}. ${bar.activityCount.toLocaleString()} supporting messages from ${bar.count.toLocaleString()} active senders.${
                    bar.count === 0
                      ? ' Bucket selection is unavailable because this bucket is empty.'
                      : bucketSelectionDisabledReason
                        ? ` Bucket selection is unavailable because ${bucketSelectionDisabledReason}.`
                        : canInteractWithBucket
                          ? ` ${bucketInteractionLabel}`
                          : ''
                  }`
                  const defaultFocusedFill = isPeak
                    ? 'rgba(158,114,28,0.92)'
                    : isLatest
                      ? 'rgba(79,111,137,0.88)'
                      : 'rgba(148,163,184,0.62)'
                  const defaultFocusedStroke = isPeak
                    ? 'rgba(251,191,36,0.42)'
                    : isLatest
                      ? 'rgba(34,211,238,0.28)'
                      : 'rgba(148,163,184,0.22)'
                  const markerLabel = isPeak && isLatest ? 'Peak + latest' : isPeak ? 'Peak' : isLatest ? 'Latest' : null
                  const markerAnchorY = bar.isZeroValue ? chartHeight - paddingBottom : bar.y
                  const anchor =
                    index === 0 ? 'start' : index === bars.length - 1 ? 'end' : 'middle'
                  const labelX =
                    index === 0
                      ? interactionX
                      : index === bars.length - 1
                        ? interactionX + interactionWidth
                        : slotCenterX
                  return (
                    <g key={bar.key}>
                      {markerLabel ? (
                        <text
                          x={labelX}
                          y={Math.max(18, markerAnchorY - 8)}
                          textAnchor={anchor}
                          fill={
                            isPeak && isLatest
                              ? 'rgba(251,191,36,0.72)'
                              : isPeak
                                ? 'rgba(251,191,36,0.72)'
                                : 'rgba(34,211,238,0.66)'
                          }
                          fontSize="10"
                          fontWeight="500"
                        >
                          {markerLabel}
                        </text>
                      ) : null}
                      {isPeak ? (
                        <line
                          x1={interactionX + markerInset}
                          y1={Math.max(14, markerAnchorY - 3)}
                          x2={interactionX + interactionWidth - markerInset}
                          y2={Math.max(14, markerAnchorY - 3)}
                          stroke="rgba(251,191,36,0.5)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      ) : null}
                      {isLatest ? (
                        <line
                          x1={interactionX + markerInset}
                          y1={Math.max(18, markerAnchorY - (isPeak ? 8 : 3))}
                          x2={interactionX + interactionWidth - markerInset}
                          y2={Math.max(18, markerAnchorY - (isPeak ? 8 : 3))}
                          stroke="rgba(34,211,238,0.48)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      ) : null}
                      {bar.isZeroValue ? (
                        <>
                          <line
                            x1={slotCenterX}
                            y1={paddingTop + 8}
                            x2={slotCenterX}
                            y2={chartHeight - paddingBottom - 8}
                            stroke="rgba(148,163,184,0.1)"
                            strokeWidth="1"
                            strokeDasharray="1.5 7"
                            pointerEvents="none"
                          />
                          <rect
                            x={
                              interactionX +
                              Math.max(
                                (interactionWidth -
                                  Math.min(Math.max(interactionWidth * 0.34, 6), 10)) /
                                  2,
                                0
                              )
                            }
                            y={chartHeight - paddingBottom - 2}
                            width={Math.min(Math.max(interactionWidth * 0.34, 6), 10)}
                            height={2}
                            rx={999}
                            fill="rgba(148,163,184,0.12)"
                            pointerEvents="none"
                          />
                          <rect
                            x={interactionX}
                            y={paddingTop}
                            width={interactionWidth}
                            height={chartInnerHeight}
                            rx={Math.min(14, Math.max(4, interactionWidth / 3))}
                            fill="rgba(0,0,0,0.001)"
                            data-time-context-zero-slot="true"
                            data-time-context-bucket-label={bar.detailLabel}
                            data-time-context-bucket-count={bar.count}
                            data-time-context-bucket-activity-count={bar.activityCount}
                            data-time-context-bucket-message-count={
                              bar.messageCount != null ? bar.messageCount : ''
                            }
                            role={canInteractWithBucket ? 'button' : 'img'}
                            aria-label={bucketAriaLabel}
                            aria-pressed={canInteractWithBucket ? isActiveBucket : undefined}
                            tabIndex={0}
                            onMouseEnter={() =>
                              setHoveredInteraction({
                                scope: activeScope,
                                itemKey: bar.key,
                              })
                            }
                            onMouseLeave={() =>
                              setHoveredInteraction((current) =>
                                current.scope === activeScope && current.itemKey === bar.key
                                  ? { scope: activeScope, itemKey: null }
                                  : current
                              )
                            }
                            onFocus={() =>
                              setHoveredInteraction({
                                scope: activeScope,
                                itemKey: bar.key,
                              })
                            }
                            onBlur={() =>
                              setHoveredInteraction((current) =>
                                current.scope === activeScope && current.itemKey === bar.key
                                  ? { scope: activeScope, itemKey: null }
                                  : current
                              )
                            }
                            onClick={() =>
                              canInteractWithBucket
                                ? props.bucketSelection?.onToggleBucket?.({
                                    label: bar.label,
                                    count: bar.count,
                                    messageCount: bar.messageCount,
                                    bucketStartIso: bar.bucketStartIso,
                                    bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                                  })
                                : undefined
                            }
                            onKeyDown={(event) => {
                              if (!canInteractWithBucket) return
                              if (event.key !== 'Enter' && event.key !== ' ') return
                              event.preventDefault()
                              props.bucketSelection?.onToggleBucket?.({
                                label: bar.label,
                                count: bar.count,
                                messageCount: bar.messageCount,
                                bucketStartIso: bar.bucketStartIso,
                                bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                              })
                            }}
                          />
                        </>
                      ) : null}
                      {isDefaultFocused ? (
                        <rect
                          x={usesFixedDailySlots ? interactionX + slotOutlineInset : bar.x - 3}
                          y={
                            bar.isZeroValue
                              ? paddingTop
                              : usesFixedDailySlots
                                ? Math.max(10, bar.y - 2)
                                : Math.max(10, bar.y - 3)
                          }
                          width={
                            usesFixedDailySlots
                              ? Math.max(interactionWidth - slotOutlineInset * 2, 1)
                              : bar.width + 6
                          }
                          height={
                            bar.isZeroValue
                              ? chartInnerHeight
                              : usesFixedDailySlots
                                ? bar.height + 4
                                : bar.height + 6
                          }
                          rx={Math.min(18, Math.max(8, interactionWidth / 2))}
                          fill="none"
                          stroke="rgba(148,163,184,0.42)"
                          strokeWidth="1.5"
                          pointerEvents="none"
                        />
                      ) : null}
                      {isActiveBucket ? (
                        <rect
                          x={usesFixedDailySlots ? interactionX + activeOutlineInset : bar.x - 5}
                          y={
                            bar.isZeroValue
                              ? paddingTop
                              : usesFixedDailySlots
                                ? Math.max(8, bar.y - 3)
                                : Math.max(8, bar.y - 5)
                          }
                          width={
                            usesFixedDailySlots
                              ? Math.max(interactionWidth - activeOutlineInset * 2, 1)
                              : bar.width + 10
                          }
                          height={
                            bar.isZeroValue
                              ? chartInnerHeight
                              : usesFixedDailySlots
                                ? bar.height + 6
                                : bar.height + 10
                          }
                          rx={Math.min(20, Math.max(10, interactionWidth / 2))}
                          fill="none"
                          stroke="rgba(34,211,238,0.92)"
                          strokeWidth={2.25}
                          pointerEvents="none"
                        />
                      ) : null}
                      {!bar.isZeroValue ? (
                        <>
                          {usesFixedDailySlots ? (
                            <rect
                              x={interactionX}
                              y={paddingTop}
                              width={interactionWidth}
                              height={chartInnerHeight}
                              rx={Math.min(14, Math.max(4, interactionWidth / 3))}
                              fill="rgba(0,0,0,0.001)"
                              data-time-context-bucket-label={bar.detailLabel}
                              data-time-context-bucket-count={bar.count}
                              data-time-context-bucket-activity-count={bar.activityCount}
                              data-time-context-bucket-message-count={
                                bar.messageCount != null ? bar.messageCount : ''
                              }
                              role={canInteractWithBucket ? 'button' : 'img'}
                              aria-label={bucketAriaLabel}
                              aria-pressed={canInteractWithBucket ? isActiveBucket : undefined}
                              tabIndex={0}
                              onMouseEnter={() =>
                                setHoveredInteraction({
                                  scope: activeScope,
                                  itemKey: bar.key,
                                })
                              }
                              onMouseLeave={() =>
                                setHoveredInteraction((current) =>
                                  current.scope === activeScope && current.itemKey === bar.key
                                    ? { scope: activeScope, itemKey: null }
                                    : current
                                )
                              }
                              onFocus={() =>
                                setHoveredInteraction({
                                  scope: activeScope,
                                  itemKey: bar.key,
                                })
                              }
                              onBlur={() =>
                                setHoveredInteraction((current) =>
                                  current.scope === activeScope && current.itemKey === bar.key
                                    ? { scope: activeScope, itemKey: null }
                                    : current
                                )
                              }
                              onClick={() =>
                                canInteractWithBucket
                                  ? props.bucketSelection?.onToggleBucket?.({
                                      label: bar.label,
                                      count: bar.count,
                                      messageCount: bar.messageCount,
                                      bucketStartIso: bar.bucketStartIso,
                                      bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                                    })
                                  : undefined
                              }
                              onKeyDown={(event) => {
                                if (!canInteractWithBucket) return
                                if (event.key !== 'Enter' && event.key !== ' ') return
                                event.preventDefault()
                                props.bucketSelection?.onToggleBucket?.({
                                  label: bar.label,
                                  count: bar.count,
                                  messageCount: bar.messageCount,
                                  bucketStartIso: bar.bucketStartIso,
                                  bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                                })
                              }}
                            />
                          ) : null}
                          <rect
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                            rx={Math.min(14, Math.max(4, bar.width / 3))}
                            pointerEvents={usesFixedDailySlots ? 'none' : undefined}
                            data-time-context-bucket-label={
                              usesFixedDailySlots ? undefined : bar.detailLabel
                            }
                            data-time-context-bucket-count={
                              usesFixedDailySlots ? undefined : bar.count
                            }
                            data-time-context-bucket-activity-count={
                              usesFixedDailySlots ? undefined : bar.activityCount
                            }
                            data-time-context-bucket-message-count={
                              usesFixedDailySlots
                                ? undefined
                                : bar.messageCount != null
                                  ? bar.messageCount
                                  : ''
                            }
                            fill={
                              isHovered
                                ? 'rgba(125,211,252,0.92)'
                                : isActiveBucket
                                  ? activeBucketMode === 'chart_only_focus'
                                    ? 'rgba(34,211,238,0.68)'
                                    : defaultFocusedFill
                                  : isDefaultFocused
                                  ? defaultFocusedFill
                                  : isPeak
                                    ? 'rgba(158,114,28,0.92)'
                                    : isLatest
                                      ? 'rgba(79,111,137,0.88)'
                                      : 'rgba(100,116,139,0.82)'
                            }
                            stroke={
                              isHovered
                                ? 'rgba(186,230,253,0.95)'
                                : isActiveBucket
                                  ? 'rgba(186,230,253,0.98)'
                                  : isDefaultFocused
                                  ? defaultFocusedStroke
                                  : isPeak
                                    ? 'rgba(251,191,36,0.42)'
                                    : isLatest
                                      ? 'rgba(34,211,238,0.28)'
                                      : 'rgba(255,255,255,0.1)'
                            }
                            strokeWidth={isHovered ? 1.5 : 1}
                            className="transition-all duration-150"
                            role={usesFixedDailySlots ? undefined : canInteractWithBucket ? 'button' : 'img'}
                            aria-label={usesFixedDailySlots ? undefined : bucketAriaLabel}
                            aria-pressed={
                              usesFixedDailySlots
                                ? undefined
                                : canInteractWithBucket
                                  ? isActiveBucket
                                  : undefined
                            }
                            tabIndex={usesFixedDailySlots ? undefined : 0}
                            onMouseEnter={() =>
                              usesFixedDailySlots
                                ? undefined
                                : setHoveredInteraction({
                                    scope: activeScope,
                                    itemKey: bar.key,
                                  })
                            }
                            onMouseLeave={() =>
                              usesFixedDailySlots
                                ? undefined
                                : setHoveredInteraction((current) =>
                                    current.scope === activeScope && current.itemKey === bar.key
                                      ? { scope: activeScope, itemKey: null }
                                      : current
                                  )
                            }
                            onFocus={() =>
                              usesFixedDailySlots
                                ? undefined
                                : setHoveredInteraction({
                                    scope: activeScope,
                                    itemKey: bar.key,
                                  })
                            }
                            onBlur={() =>
                              usesFixedDailySlots
                                ? undefined
                                : setHoveredInteraction((current) =>
                                    current.scope === activeScope && current.itemKey === bar.key
                                      ? { scope: activeScope, itemKey: null }
                                      : current
                                  )
                            }
                            onClick={() =>
                              usesFixedDailySlots
                                ? undefined
                                : canInteractWithBucket
                                  ? props.bucketSelection?.onToggleBucket?.({
                                      label: bar.label,
                                      count: bar.count,
                                      messageCount: bar.messageCount,
                                      bucketStartIso: bar.bucketStartIso,
                                      bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                                    })
                                  : undefined
                            }
                            onKeyDown={(event) => {
                              if (usesFixedDailySlots || !canInteractWithBucket) return
                              if (event.key !== 'Enter' && event.key !== ' ') return
                              event.preventDefault()
                              props.bucketSelection?.onToggleBucket?.({
                                    label: bar.label,
                                    count: bar.count,
                                    messageCount: bar.messageCount,
                                    bucketStartIso: bar.bucketStartIso,
                                    bucketEndExclusiveIso: bar.bucketEndExclusiveIso,
                                  })
                            }}
                          />
                        </>
                      ) : null}
                      {isHovered ? (
                        <rect
                          x={usesFixedDailySlots ? interactionX + hoverOutlineInset : bar.x - 2}
                          y={
                            bar.isZeroValue
                              ? paddingTop
                              : usesFixedDailySlots
                                ? Math.max(12, bar.y - 1.5)
                                : Math.max(12, bar.y - 2)
                          }
                          width={
                            usesFixedDailySlots
                              ? Math.max(interactionWidth - hoverOutlineInset * 2, 1)
                              : bar.width + 4
                          }
                          height={
                            bar.isZeroValue
                              ? chartInnerHeight
                              : usesFixedDailySlots
                                ? bar.height + 3
                                : bar.height + 4
                          }
                          rx={Math.min(18, Math.max(8, interactionWidth / 2))}
                          fill="none"
                          stroke="rgba(186,230,253,0.9)"
                          strokeWidth="2"
                          pointerEvents="none"
                        />
                      ) : null}
                      {bar.showAxisLabel ? (
                        <text
                          x={labelX}
                          y={chartHeight - 14}
                          textAnchor={anchor}
                          data-time-context-axis-label="true"
                          fill={
                            isHovered
                              ? 'rgba(255,255,255,0.98)'
                              : isDefaultFocused
                                ? 'rgba(226,232,240,0.9)'
                                : 'rgba(203,213,225,0.82)'
                          }
                          fontSize="10.5"
                          fontWeight={isHovered ? '600' : '500'}
                        >
                          {bar.compactLabel}
                        </text>
                      ) : null}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-300/60 bg-slate-400/20" />
                  Default focus
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                  Hover preview
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full bg-amber-300/70" />
                  Peak period
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full bg-cyan-300/70" />
                  Latest visible period
                </span>
                {usesCompressedTimeline ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-cyan-300/70 bg-cyan-400/15" />
                    Inactive periods hidden
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="relative inline-flex h-3 w-3 items-center justify-center">
                      <span className="h-3 border-l border-dashed border-slate-400/45" />
                    </span>
                    Reserved zero slot
                  </span>
                )}
                {activeBucketItem ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-cyan-300" />
                    {activeBucketMode === 'chart_only_focus' ? 'Focused bucket' : 'Workflow bucket'}
                  </span>
                ) : null}
              </div>
              <p>
                {usesCompressedTimeline
                  ? 'Bar height shows supporting-message activity. Inactive periods are disclosed above; hover shows the distinct senders behind each bar.'
                  : 'Bar height shows supporting-message activity. Hover shows the distinct senders behind each bar; click reviews those senders.'}
              </p>
            </div>
          </>
        )}
        {props.isUpdating ? (
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-slate-950/22" />
        ) : null}
      </div>

      {props.bodyOverride ? null : (
        <div
          className="rounded-[24px] border border-cyan-900/35 bg-cyan-950/10 p-4"
          data-time-context-readout="true"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">In focus</p>
                <span className={`${neutralPillSurfaceClass} rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-100`}>
                  {anchoredStateLabel}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">
                {anchoredItem ? anchoredItem.label : 'No visible period yet'}
              </p>
              <p className="mt-1 text-sm text-cyan-50/90">{activeInterpretation}</p>
              <p className="mt-2 text-xs leading-5 text-cyan-100/75">{anchoredStateDetail}</p>
            </div>
            <p className="max-w-sm text-xs leading-5 text-cyan-100/70">
              {activeBucketItem
                ? activeBucketMode === 'chart_only_focus'
                  ? 'The rail keeps this focused bucket as the authoritative chart read while the workflow context stays unchanged.'
                  : 'The rail keeps this selected bucket as the authoritative lower-card read while the chart stays full-scope above.'
                : 'The rail is currently centered on the period that best explains the visible workload.'}
            </p>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Focused bucket truth</p>
                <p className="mt-1 text-xs leading-5 text-cyan-100/75">{metricPanelDetail}</p>
              </div>
            </div>
          </div>

          <div
            className="mt-3 rounded-2xl border border-cyan-900/35 bg-black/10 px-4 py-3"
            data-time-context-truth-summary="true"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">How to read these numbers</p>
            <p
              className="mt-2 text-sm font-medium text-cyan-50"
              data-time-context-focused-bucket-label="true"
            >
              {anchoredItem ? anchoredItem.detailLabel : 'No visible period yet'}
            </p>
            <div
              className={`mt-3 grid gap-3 ${
                activeBucketMode === 'chart_only_focus' ? 'md:grid-cols-2' : 'md:grid-cols-3'
              }`}
            >
              <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Supporting messages in this bucket
                </p>
                <p
                  className="mt-1 text-sm font-semibold text-white"
                  data-time-context-supporting-messages="true"
                >
                  {anchoredItem ? anchoredItem.activityCount.toLocaleString() : '—'}
                </p>
              </div>
              <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Active senders in this bucket
                </p>
                <p
                  className="mt-1 text-sm font-semibold text-white"
                  data-time-context-active-senders="true"
                >
                  {anchoredItem ? anchoredItem.count.toLocaleString() : '—'}
                </p>
              </div>
              {activeBucketMode === 'chart_only_focus' ? null : (
                <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                    Senders in current workflow scope
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold text-white"
                    data-time-context-workflow-total="true"
                  >
                    {workflowSenderUniverseTotal > 0
                      ? workflowSenderUniverseTotal.toLocaleString()
                      : '—'}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-cyan-100/80" data-time-context-truth-note="true">
              {metricTruthNote}
            </p>
            {workflowContextNote ? (
              <div className="mt-3 rounded-2xl border border-cyan-900/35 bg-cyan-950/16 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                  {workflowContextLabel}
                </p>
                <p
                  className="mt-1 text-sm font-semibold text-white"
                  data-time-context-workflow-total="true"
                >
                  {workflowContextTotal > 0 ? workflowContextTotal.toLocaleString() : '—'}
                </p>
                {workflowContextDetail ? (
                  <p className="mt-1 text-xs leading-5 text-cyan-100/75">{workflowContextDetail}</p>
                ) : null}
                <p className="mt-1 text-xs leading-5 text-cyan-100/80">
                  {workflowContextNote}
                </p>
              </div>
            ) : null}
          </div>

          <div className={`${neutralNestedSurfaceClass} mt-4 rounded-[22px] p-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Across this cleanup group</p>
              <span className="text-[11px] leading-5 text-slate-400">
                {activeBucketItem
                  ? activeBucketMode === 'chart_only_focus'
                    ? 'These signals stay anchored to the focused bucket while hover previews another visible period.'
                    : 'These signals stay anchored to the selected bucket while hover previews another visible period.'
                  : 'These signals stay anchored to the default focus while hover previews another visible period.'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                props.overallActivity,
                props.activityMix,
                props.patternSignal,
              ].map((metric, index) => {
                const label = index === 0 ? 'Overall activity' : index === 1 ? 'Activity mix' : 'Pattern signal'
                return (
                  <div
                    key={label}
                    className="min-w-[180px] flex-1 rounded-xl border border-slate-400/10 bg-black/10 px-3 py-2"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">{metric.value}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-300/90">{metric.detail}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {diagnosticRow(
                'What happened',
                anchoredItem ? anchoredItem.label : 'No visible period yet',
                whatHappened
              )}
              {diagnosticRow('Why it matters', 'Workload read', whyItMatters)}
              {diagnosticRow('What to do', props.nextAction.title, whatToDo)}
            </div>
          </div>
        </div>
      )}
    </SenderOverviewAnalysisRailShell>
  )
}

export function GmailScopeLadder(props: {
  title: string
  subtitle: string
  counts: GmailScopeLadderCounts
  hiddenKeys?: Array<keyof GmailScopeLadderCounts>
}) {
  const hiddenKeys = new Set(props.hiddenKeys || [])
  const visibleSteps = SCOPE_STEPS.filter((step) => !hiddenKeys.has(step.key))

  return (
    <section className="app-surface-card rounded-2xl p-4 space-y-3">
      <div>
        <p className="app-eyebrow">{props.title}</p>
        <p className="mt-1 text-sm text-slate-200">{props.subtitle}</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {visibleSteps.map((step) => {
          const isEvidenceStep = step.key === 'loaded_preview_rows'
          return (
          <div
            key={step.key}
            className={`rounded-2xl p-3 ${
              isEvidenceStep
                ? `${neutralInsetSurfaceClass} border-dashed`
                : neutralNestedSurfaceClass
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">{step.label}</p>
            <p className={`mt-2 font-semibold text-white ${isEvidenceStep ? 'text-xl' : 'text-2xl'}`}>
              {props.counts[step.key].toLocaleString()}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-200">{step.reason}</p>
          </div>
          )
        })}
      </div>
    </section>
  )
}

export function InboxHealthGauge(props: {
  score: number
  healthState: string
  indexedStateLabel: string
  contextMetrics: {
    totalSenderCount: number
    totalSupportingMessageCount: number
    underReviewSenderCount: number
    decidedSenderCount: number
  }
  managementSignals: ManagementSignalsData
  primaryDriver: string
  driverInsight: string
  recommendedIntervention: string
  interventionInsight: string
  expectedImpact: string
  impactInsight: string
  explanation: string
}) {
  const scoreMeta = healthSeverityMeta(props.score, props.healthState)
  const boundedScore = Math.max(0, Math.min(100, props.score))
  const markerPosition = Math.max(3, Math.min(97, boundedScore))
  const coverageRatio =
    props.contextMetrics.totalSenderCount > 0
      ? props.contextMetrics.decidedSenderCount / props.contextMetrics.totalSenderCount
      : 0
  const remainingSenders = Math.max(
    props.contextMetrics.totalSenderCount - props.contextMetrics.decidedSenderCount,
    0
  )
  const [hoveredSection, setHoveredSection] = useState<'band' | 'driver' | 'intervention' | 'impact' | null>(
    null
  )
  const hoverCopy =
    hoveredSection === 'driver'
        ? props.driverInsight
        : hoveredSection === 'intervention'
          ? props.interventionInsight
        : hoveredSection === 'impact'
          ? props.impactInsight
          : `Inbox health tracks committed sender decision coverage first, then execution friction. ${props.explanation} ${
              props.managementSignals.approvalsWaiting > 0
                ? 'Right now, approvals are the main reason sender decisions are not yet turning into visible inbox reduction.'
                : props.managementSignals.archiveVerificationCount > 0
                  ? 'Right now, verification friction is slowing trust in visible archive reduction even though sender decisions already exist.'
                  : 'Right now, the biggest remaining improvement comes from deciding more senders, not from chasing message count alone.'
            }`
  const hoverTitle =
    hoveredSection === 'driver'
      ? 'Why this driver matters now'
      : hoveredSection === 'intervention'
        ? 'Why this beats the next-best option'
        : hoveredSection === 'impact'
          ? 'Why this improvement is credible'
          : 'How to read this score'
  const scoreBandSegments = [
    { label: 'Critical', range: '0-19', className: 'bg-rose-500' },
    { label: 'Degraded', range: '20-39', className: 'bg-orange-500' },
    { label: 'Warning', range: '40-59', className: 'bg-amber-400' },
    { label: 'Stable', range: '60-79', className: 'bg-sky-400' },
    { label: 'Healthy', range: '80-100', className: 'bg-emerald-500' },
  ]

  return (
    <section className="rounded-3xl border border-cyan-900/45 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),linear-gradient(180deg,rgba(8,47,73,0.16),rgba(3,7,18,0.72))] p-5 space-y-5">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
          Visual intelligence
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Inbox health</h2>
        <p className="mt-3 text-sm text-gray-300">
          A fast visual read on sender decision coverage, the execution friction affecting it, and the intervention most likely to improve inbox clarity next.
        </p>
      </div>

      <MailboxContextMetrics
        totalSenderCount={props.contextMetrics.totalSenderCount}
        totalSupportingMessageCount={props.contextMetrics.totalSupportingMessageCount}
        underReviewSenderCount={props.contextMetrics.underReviewSenderCount}
        decidedSenderCount={props.contextMetrics.decidedSenderCount}
      />

      <div className="rounded-3xl border border-emerald-800/45 bg-[linear-gradient(180deg,rgba(6,78,59,0.3),rgba(2,6,23,0.7))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
              Inbox cleanliness goal
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              Every sender should have a decision.
            </p>
            <p className="mt-2 text-sm text-gray-300">
              A clean inbox is not zero inbox. Keeping a sender is still a clean outcome. The goal is to remove uncertainty by deciding how each sender should be treated.
            </p>
          </div>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl border border-emerald-700/30 px-4 py-3 text-right`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">Decided senders</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {props.contextMetrics.decidedSenderCount.toLocaleString()} /{' '}
              {props.contextMetrics.totalSenderCount.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {Math.round(coverageRatio * 100)}% committed coverage
            </p>
          </div>
        </div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-gray-900/90 ring-1 ring-emerald-700/30">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${Math.max(0, Math.min(100, coverageRatio * 100))}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-300">
          <span>{remainingSenders.toLocaleString()} indexed senders still need a committed decision.</span>
          <span>Clean means decision coverage across the indexed sender universe.</span>
        </div>
      </div>

      <div className="app-surface-card rounded-3xl p-5 space-y-5">
        <div className="grid gap-5 2xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Inbox health</p>
              <p className={`mt-3 text-6xl font-semibold ${scoreMeta.scoreClass}`}>
                {boundedScore}
                <span className="ml-2 text-xl font-medium text-gray-400">/ 100</span>
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} min-h-[132px] rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{hoverTitle}</p>
              <p className="mt-2 text-sm font-medium text-white">
                {hoverCopy}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onMouseEnter={() => setHoveredSection('band')}
              onFocus={() => setHoveredSection('band')}
              onMouseLeave={() => setHoveredSection(null)}
              onBlur={() => setHoveredSection(null)}
              className={`${neutralNestedSurfaceClass} block w-full rounded-2xl p-4 text-left`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Health rail</p>
                  <p className="mt-1 text-xs text-gray-400">Mailbox snapshot: {props.indexedStateLabel}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${scoreMeta.badgeClass}`}>
                  {props.healthState}
                </span>
              </div>
              <div className="mt-4 flex overflow-hidden rounded-2xl border border-gray-800">
                {scoreBandSegments.map((segment) => (
                  <div key={segment.label} className={`relative flex-1 ${segment.className}`}>
                    <div className="h-6 bg-transparent" />
                  </div>
                ))}
              </div>
              <div className="relative mt-2 h-4">
                <div
                  className="absolute top-0 h-4 w-px -translate-x-1/2 bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
                  style={{ left: `${markerPosition}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-gray-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </button>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <button
                type="button"
                onMouseEnter={() => setHoveredSection('driver')}
                onFocus={() => setHoveredSection('driver')}
                onMouseLeave={() => setHoveredSection(null)}
                onBlur={() => setHoveredSection(null)}
                className={`${neutralNestedSurfaceClass} rounded-2xl p-4 text-left`}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Primary driver</p>
                <p className="mt-2 text-sm font-medium text-white">{props.primaryDriver}</p>
              </button>
              <button
                type="button"
                onMouseEnter={() => setHoveredSection('intervention')}
                onFocus={() => setHoveredSection('intervention')}
                onMouseLeave={() => setHoveredSection(null)}
                onBlur={() => setHoveredSection(null)}
                className={`${neutralNestedSurfaceClass} rounded-2xl p-4 text-left`}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Next intervention</p>
                <p className="mt-2 text-sm font-medium text-white">{props.recommendedIntervention}</p>
              </button>
              <button
                type="button"
                onMouseEnter={() => setHoveredSection('impact')}
                onFocus={() => setHoveredSection('impact')}
                onMouseLeave={() => setHoveredSection(null)}
                onBlur={() => setHoveredSection(null)}
                className={`${neutralNestedSurfaceClass} rounded-2xl p-4 text-left`}
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Expected improvement</p>
                <p className="mt-2 text-sm font-medium text-white">{props.expectedImpact}</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function MailboxMissionPanel(props: {
  healthLabel: string
  pendingApprovals: number
  cleanupGroupCount: number
  cleanupSenderCount: number
  cleanupMessageCount: number
  protectedSenderCount: number
  wholeMailboxSenderCount: number
  wholeMailboxMessageCount: number
  healthTrendLabel: string
  healthTrendDetail: string
  healthIntelligence: {
    score: number
    state: string
    primaryDriver: string
    pressureDirection: string
    predictedOutcome: string
    recommendedIntervention: string
    expectedImpact: string
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
  decidedSenderCount: number
  startedClusterCount: number
  nextCluster:
    | {
        clusterId: string
        title: string
        senderCount: number
        sharePct: number
        messageCount: number
      }
    | null
  resumeTask:
    | {
        title: string
        href: string
        stageLabel: string
      }
    | null
  nextActionHref: string | null
  approvalHref: string | null
}) {
  const actionButtonLabel =
    props.healthIntelligence.nextActionMode === 'approve_queue'
      ? 'Open Management'
      : props.healthIntelligence.nextActionMode === 'resume_work'
        ? 'Resume sender review'
      : props.healthIntelligence.nextActionMode === 'open_group'
        ? 'Open Cleanup Groups'
        : null
  const actionButtonClass =
    props.healthIntelligence.nextActionMode === 'approve_queue'
      ? 'bg-amber-500 text-gray-950 hover:bg-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.28)]'
      : 'bg-cyan-500 text-gray-950 hover:bg-cyan-400 shadow-[0_10px_30px_rgba(6,182,212,0.24)]'
  const showResumeLink =
    Boolean(props.resumeTask) && props.healthIntelligence.nextActionMode !== 'resume_work'
  const showApprovalLink =
    props.pendingApprovals > 0 &&
    Boolean(props.approvalHref) &&
    props.healthIntelligence.nextActionMode !== 'approve_queue'
  const approvalsArePrimary = props.healthIntelligence.nextActionMode === 'approve_queue'

  return (
    <section className="rounded-3xl border border-cyan-900/45 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(8,47,73,0.28),rgba(3,7,18,0.72))] p-5 space-y-5">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Mission control</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">AI-guided next move</h2>
        <p className="mt-3 text-sm text-gray-300">
          Read the bottleneck, the next action, the payoff, and the work already in motion without dropping into sender drill-down yet.
        </p>
      </div>
      <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
        <div className="app-surface-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mission briefing</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {diagnosticRow(
              'Current status',
              props.healthIntelligence.currentStatus,
              props.healthIntelligence.currentStatusDetail
            )}
            {diagnosticRow(
              'Main bottleneck',
              props.healthIntelligence.primaryDriver,
              props.healthIntelligence.topRiskDetail
            )}
            {diagnosticRow(
              'Decision scope',
              `${props.cleanupSenderCount.toLocaleString()} senders under review`,
              `Backed by ~${props.cleanupMessageCount.toLocaleString()} supporting messages out of ${props.wholeMailboxSenderCount.toLocaleString()} indexed senders and ~${props.wholeMailboxMessageCount.toLocaleString()} indexed messages. Decisions happen at the sender level; message counts explain impact only.`
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Do next</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {props.healthIntelligence.nextActionTitle}
              </p>
            </div>
            <span className="rounded-full border border-cyan-700/40 bg-cyan-950/30 px-3 py-1 text-[11px] text-cyan-100">
              Primary action
            </span>
          </div>
          {props.nextActionHref && actionButtonLabel ? (
            <Link
              href={props.nextActionHref}
              className={`mt-4 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${actionButtonClass}`}
            >
              {actionButtonLabel}
            </Link>
          ) : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.84fr_1.16fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Why now</p>
              <p className="mt-2 text-sm text-gray-300">{props.healthIntelligence.nextActionDetail}</p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-2xl border border-cyan-900/35 p-4`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Expected payoff</p>
              <p className="mt-2 text-sm font-medium text-white">
                {props.healthIntelligence.expectedImpact}
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                If nothing changes: {props.healthIntelligence.predictedOutcome}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1.12fr_0.88fr]">
        <div className="app-surface-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Work in progress</p>
              <p className="mt-2 text-lg font-semibold text-white">{props.healthIntelligence.progressStatus}</p>
            </div>
            <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-200">
              {props.healthIntelligence.progressPct}% of indexed senders decided
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300">{props.healthIntelligence.progressOutcome}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {diagnosticRow(
              'Committed cleanliness coverage',
              props.healthIntelligence.progressLabel,
              `${props.healthIntelligence.progressDetail} Denominator: committed sender decisions / indexed sender universe.`
            )}
            {diagnosticRow(
              'Started work',
              `${props.startedClusterCount.toLocaleString()} sender groups already opened`,
              `${props.decidedSenderCount.toLocaleString()} active-review senders already have local draft decisions, while ${Math.max(props.cleanupSenderCount - props.decidedSenderCount, 0).toLocaleString()} cleanup-ready senders in the current review universe still need one.`
            )}
          </div>
          {props.resumeTask ? (
            <div className={`${neutralNestedSurfaceClass} mt-4 rounded-2xl p-3`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Resume work</p>
              <p className="mt-1 text-sm font-semibold text-white">{props.resumeTask.title}</p>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Resume at {props.resumeTask.stageLabel}. Finishing started work should outrank opening a brand-new sender group when possible.
              </p>
              {showResumeLink ? (
                <Link
                  href={props.resumeTask.href}
                  className="mt-3 inline-flex text-sm font-medium text-cyan-200 underline decoration-cyan-700/60 underline-offset-4 hover:text-cyan-100"
                >
                  Resume sender review
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            props.pendingApprovals > 0
              ? 'border-amber-800/55 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(69,26,3,0.38))]'
              : 'border-[var(--app-border-muted)] bg-[var(--app-surface-nested)]'
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Approvals</p>
          {props.pendingApprovals > 0 ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <p className="text-3xl font-semibold text-amber-100">
                {props.pendingApprovals.toLocaleString()}
                <span className="ml-2 text-base font-medium text-amber-50/85">
                  archive approvals waiting
                </span>
              </p>
              {approvalsArePrimary ? (
                <span className="rounded-full border border-amber-600/40 bg-amber-950/25 px-3 py-1 text-[11px] text-amber-100">
                  Primary action above
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-lg font-semibold text-white">No archive approvals waiting</p>
          )}
          <p className="mt-2 text-sm text-gray-300">
            {props.pendingApprovals > 0
              ? 'Archive is the only live Phase 1 Gmail action. Clearing this queue turns stored archive decisions into visible inbox reduction.'
              : 'No execution bottleneck is waiting right now, so the next best improvement comes from sender review.'}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {diagnosticRow(
              'Current queue effect',
              props.pendingApprovals > 0 ? 'Visible cleanup is blocked' : 'No approval blocker',
              props.pendingApprovals > 0
                ? 'Prepared archive work cannot reduce inbox noise until an operator approves it.'
                : 'Any next gain will come from opening or resuming sender review.'
            )}
            {diagnosticRow(
              'After it clears',
              props.pendingApprovals > 0 ? 'Inbox noise drops immediately' : 'Open sender review for the next gain',
              props.pendingApprovals > 0
                ? 'Approved archive work is the fastest path to visible inbox reduction.'
                : 'Resume saved work or open the recommended sender group to create the next payoff.'
            )}
          </div>
          {showApprovalLink ? (
            <Link
              href={props.approvalHref || '#'}
              className="automata-primary-button mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open Management
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function MailboxIntelligenceLoadingState(props: {
  pendingApprovals: number
  startedClusterCount: number
  decidedSenderCount: number
  clusterCount: number
  resumeHref: string | null
  nextActionHref: string | null
}) {
  const likelyAction =
    props.pendingApprovals > 0
      ? 'Approve archive queue'
      : props.resumeHref
        ? 'Resume sender review'
        : props.nextActionHref
          ? 'Open Cleanup Groups'
          : 'Wait for refreshed guidance'
  const likelyReason =
    props.pendingApprovals > 0
      ? 'Archive approvals are blocking visible cleanup progress.'
      : props.resumeHref
        ? 'Started sender work already has momentum and should finish before opening a new group.'
        : props.nextActionHref
          ? 'The latest stable snapshot already has a recommended sender group queued up.'
          : 'Mailbox Intelligence is still preparing the next recommendation.'
  const runtimeStatus =
    props.pendingApprovals > 0
      ? 'Approval queue is the current hard checkpoint.'
      : props.startedClusterCount > 0
        ? `${props.startedClusterCount.toLocaleString()} sender groups already have saved work.`
        : `${props.clusterCount.toLocaleString()} sender groups are ready from the latest stable snapshot.`

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-cyan-900/45 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(8,47,73,0.28),rgba(3,7,18,0.72))] p-5 space-y-4">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Visual intelligence</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Loading inbox intelligence…</h2>
          <p className="mt-3 text-sm text-gray-300">
            Using the latest stable runtime snapshot while cached intelligence hydrates.
          </p>
        </div>
        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {[
            'Indexed senders',
            'Supporting messages',
            'Senders in review',
            'Senders already decided',
          ].map((label) => (
            <div key={label} className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</p>
              {loadingSkeleton('mt-3 h-8 w-24')}
              {loadingSkeleton('mt-3 h-2.5 w-full')}
              {loadingSkeleton('mt-2 h-3 w-5/6')}
            </div>
          ))}
        </section>
        <div className="app-surface-card rounded-3xl p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Inbox health rail</p>
              {loadingSkeleton('mt-3 h-14 w-36')}
            </div>
            <div className="flex flex-wrap gap-2">
              {['Critical', 'Degraded', 'Warning', 'Stable', 'Healthy'].map((band) => (
                <span
                  key={band}
                  className={`${neutralPillSurfaceClass} rounded-full px-2.5 py-1 text-[11px] text-gray-400`}
                >
                  {band}
                </span>
              ))}
            </div>
          </div>
          <div className={`${neutralInsetSurfaceClass} overflow-hidden rounded-2xl`}>
            <div className="grid h-6 grid-cols-12 gap-px bg-[var(--app-surface-3)] px-px py-px">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full ${index < 4 ? 'bg-emerald-400/70' : 'bg-gray-800'}`}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
            <div className="app-surface-card rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mission briefing</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Current status</p>
                  <p className="mt-2 text-sm font-medium text-white">{runtimeStatus}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Main bottleneck</p>
                  <p className="mt-2 text-sm font-medium text-white">{likelyReason}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Do next</p>
              <p className="mt-2 text-lg font-semibold text-white">{likelyAction}</p>
              <p className="mt-2 text-sm text-gray-300">
                {props.decidedSenderCount.toLocaleString()} sender decisions are already saved in local Phase 1 drafts.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Expected payoff</p>
                  {loadingSkeleton('mt-2 h-3 w-full')}
                  {loadingSkeleton('mt-2 h-3 w-5/6')}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Loading now</p>
                  <p className="mt-2 text-sm text-gray-300">
                    Loading inbox intelligence, fetching latest health signals, and preparing next-action guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {sectionCard(
        'Pressure trend',
        'Analyzing whether new inbox noise is outrunning cleanup progress.',
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {loadingSkeleton('h-16 w-full')}
            {loadingSkeleton('h-16 w-full')}
          </div>
          <div className={`${neutralInsetSurfaceClass} flex h-48 items-end gap-2 rounded-2xl p-3`}>
            {['h-10', 'h-14', 'h-[4.5rem]', 'h-24', 'h-20', 'h-12'].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col justify-end gap-2">
                {loadingSkeleton(`${height} w-full`)}
                {loadingSkeleton('h-3 w-full')}
              </div>
            ))}
          </div>
          <div className="grid gap-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
                {loadingSkeleton('h-3 w-24')}
                {loadingSkeleton('mt-2 h-4 w-full')}
                {loadingSkeleton('mt-2 h-3 w-5/6')}
              </div>
            ))}
          </div>
        </div>
      )}
      {sectionCard(
        'Cleanup Groups handoff',
        'Preparing the next recommended sender group and likely improvement estimate.',
        <div className="space-y-3">
          {loadingSkeleton('h-28 w-full')}
          <div className="grid gap-3 sm:grid-cols-3">
            {loadingSkeleton('h-14 w-full')}
            {loadingSkeleton('h-14 w-full')}
            {loadingSkeleton('h-14 w-full')}
          </div>
          {loadingSkeleton('h-12 w-full')}
        </div>
      )}
    </div>
  )
}

export function CleanupGroupContributionCards(props: {
  groups: GmailMailboxIntelligenceData['cleanup_groups']
  buildClusterHref: (clusterId: string) => string
  openGroupsHref: string
  recommendedGroup: GmailMailboxIntelligenceData['cleanup_groups'][number] | null
  recommendedReason: CleanupGroupRecommendationReason
}) {
  const recommendationCopy = getCleanupGroupRecommendationExplanation(props.recommendedReason)
  const internalStructure =
    props.recommendedGroup?.cluster_id === 'subscription-senders'
    ? buildCleanupGroupInternalStructure(
        props.recommendedGroup.cluster_id,
        props.recommendedGroup.semantic_rollup || null
      )
    : null
  return sectionCard(
    'Cleanup Groups Handoff',
    'Mailbox Intelligence should hand off one clear next group, not recreate the full Cleanup Groups surface.',
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      {props.recommendedGroup ? (
        <Link
          href={props.buildClusterHref(props.recommendedGroup.cluster_id)}
          className="rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-4 hover:border-cyan-700/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Recommended next group</p>
              <p className="mt-1 text-lg font-semibold text-white">{props.recommendedGroup.title}</p>
            </div>
            <span className="rounded-full border border-cyan-700/45 bg-cyan-950/20 px-2.5 py-1 text-[11px] text-cyan-100">
              {cleanupGroupShareLabel(props.recommendedGroup.share_pct)}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-300">
            {props.recommendedGroup.why_selected ||
              `${props.recommendedGroup.sender_count.toLocaleString()} senders are currently grouped into the clearest next primary action lane.`}
          </p>
          {internalStructure ? (
            <div className={`${neutralNestedSurfaceClass} mt-4 rounded-2xl p-3`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                Patterns inside this group
              </p>
              <p className="mt-1 text-sm text-gray-200">{internalStructure.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {internalStructure.patterns.map((pattern) => (
                  <span
                    key={pattern.id}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-100"
                  >
                    {pattern.label} · {pattern.groupSharePct}%
                  </span>
                ))}
                {internalStructure.remainder ? (
                  <span className="rounded-full border border-slate-500/35 bg-slate-900/50 px-2.5 py-1 text-[11px] text-slate-100">
                    {internalStructure.remainder.label} · {internalStructure.remainder.groupSharePct}%
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-300">
                {internalStructure.howToStart.slice(0, 3).map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
              {internalStructure.intentionalRemainderNote ? (
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {internalStructure.intentionalRemainderNote}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {diagnosticRow(
              'Sender scope',
              `${props.recommendedGroup.sender_count.toLocaleString()} senders`,
              'Primary decision scope for the next review pass.'
            )}
            {diagnosticRow(
              'Expected payoff',
              `~${props.recommendedGroup.message_count.toLocaleString()} supporting messages`,
              'Supporting message context explains the likely payoff; the decision object is still the sender.'
            )}
          </div>
          <div className={`${neutralNestedSurfaceClass} mt-4 rounded-2xl p-3`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Why this is next</p>
            <p className="mt-1 text-sm font-semibold text-white">{recommendationCopy.title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-400">{recommendationCopy.detail}</p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Safety context: {props.recommendedGroup.safety_note} {props.recommendedGroup.risk_note}
            </p>
          </div>
          <span className="mt-4 inline-flex rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200">
            Open in Cleanup Groups
          </span>
        </Link>
      ) : (
        <div className="rounded-2xl border border-[var(--app-border-muted)] bg-[var(--app-surface-nested)] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Recommended next group</p>
          <p className="mt-2 text-lg font-semibold text-white">No default group is highlighted</p>
          <p className="mt-3 text-sm text-gray-300">{recommendationCopy.detail}</p>
          <div className={`${neutralNestedSurfaceClass} mt-4 rounded-2xl p-3`}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Why this is next</p>
            <p className="mt-1 text-sm font-semibold text-white">{recommendationCopy.title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-400">{recommendationCopy.bridgeDetail}</p>
          </div>
        </div>
      )}
      <div className={`${neutralInsetSurfaceClass} rounded-2xl border-dashed p-4`}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Bridge into Cleanup Groups</p>
        <div className="mt-3 grid gap-3">
          {diagnosticRow(
            'Open next',
            props.recommendedGroup ? props.recommendedGroup.title : 'No default recommendation',
            props.recommendedGroup
              ? recommendationCopy.detail
              : 'Safety / coverage lanes stay available, but Cleanup Groups should not auto-pick one for you.'
          )}
          {diagnosticRow(
            'Recommendation rule',
            recommendationCopy.title,
            recommendationCopy.bridgeDetail
          )}
          {diagnosticRow(
            'What changes after you click through',
            'You move from command guidance to full group selection',
            'Cleanup Groups owns the full comparison surface. Mailbox Intelligence only hands off the clearest next primary action lane or, when appropriate, the deliberate backlog lane.'
          )}
        </div>
        <Link
          href={props.openGroupsHref}
          className="mt-4 inline-flex rounded-full border border-cyan-700/45 bg-cyan-950/10 px-4 py-2 text-sm text-cyan-100 hover:border-cyan-600"
        >
          Open full Cleanup Groups
        </Link>
      </div>
    </div>
  )
}

export function MailboxIntelligenceDashboard(props: {
  data: GmailMailboxIntelligenceData
  buildClusterHref: (clusterId: string) => string
  openGroupsHref: string
  recommendedCleanupGroup: GmailMailboxIntelligenceData['cleanup_groups'][number] | null
  recommendedCleanupGroupReason: CleanupGroupRecommendationReason
  managementSignals: ManagementSignalsData
  approvalHref: string | null
  managementHref: string | null
  nextActionTitle: string
  nextActionDetail: string
      pressureTrend:
        | {
            direction: 'rising' | 'falling' | 'stable' | 'unknown'
            label: string
            detail: string
            peakLabel: string | null
            peakBucketStartAt?: string | null
            peakCount: number
            latestLabel: string | null
            latestBucketStartAt?: string | null
          }
        | null
  pressureTrendSeries: GmailPressureTrendData['series'] | null
  pressureTrendSelection: {
    window: GmailPressureTrendWindow
    start: string | null
    end: string | null
  }
  pressureTrendLoading: boolean
  pressureTrendError: string | null
  pressureTrendRangeDetail: string | null
  pressureTrendCoverageMin: string | null
  pressureTrendCoverageMax: string | null
  onSelectPressureTrendWindow: (window: Exclude<GmailPressureTrendWindow, 'custom'>) => void
  onApplyPressureTrendCustomRange: (start: string, end: string) => void
}) {
  return (
    <div className="space-y-4">
      <CompactTrendChart
        key={[
          props.pressureTrendSelection.window,
          props.pressureTrendSelection.start || 'none',
          props.pressureTrendSelection.end || 'none',
          props.pressureTrend?.latestBucketStartAt || 'none',
        ].join('::')}
        title="Pressure trend"
        summary={props.pressureTrend?.label || null}
        detail={props.pressureTrend?.detail || null}
        direction={props.pressureTrend?.direction || 'unknown'}
        peakBucketStartAt={props.pressureTrend?.peakBucketStartAt || null}
        peakCount={props.pressureTrend?.peakCount || 0}
        latestBucketStartAt={props.pressureTrend?.latestBucketStartAt || null}
        items={props.pressureTrendSeries}
        groups={props.data.cleanup_groups}
        nextActionTitle={props.nextActionTitle}
        nextActionDetail={props.nextActionDetail}
        activeWindow={props.pressureTrendSelection.window}
        activeRangeLabel={props.pressureTrendRangeDetail}
        loading={props.pressureTrendLoading}
        error={props.pressureTrendError}
        customRangeStart={props.pressureTrendSelection.start}
        customRangeEnd={props.pressureTrendSelection.end}
        customRangeMin={props.pressureTrendCoverageMin}
        customRangeMax={props.pressureTrendCoverageMax}
        onSelectWindow={props.onSelectPressureTrendWindow}
        onApplyCustomRange={props.onApplyPressureTrendCustomRange}
      />

      <ManagementSignalsSection
        managementSignals={props.managementSignals}
        approvalHref={props.approvalHref}
        managementHref={props.managementHref}
      />

      <CleanupGroupContributionCards
        groups={props.data.cleanup_groups}
        buildClusterHref={props.buildClusterHref}
        openGroupsHref={props.openGroupsHref}
        recommendedGroup={props.recommendedCleanupGroup}
        recommendedReason={props.recommendedCleanupGroupReason}
      />
    </div>
  )
}

export function StageNavigation(props: {
  currentStage: GmailCleanupStage
  buildStageHref: (stage: GmailCleanupStage) => string
}) {
  const stages: Array<{ stage: GmailCleanupStage; label: string }> = [
    { stage: 'senders', label: 'Sender Decisions' },
    { stage: 'confirmation', label: 'Confirmation' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {stages
        .filter((item) =>
          GMAIL_CLEANUP_ACTIVE_STAGES.includes(item.stage as (typeof GMAIL_CLEANUP_ACTIVE_STAGES)[number])
        )
        .map((item) => (
        <Link
          key={item.stage}
          href={props.buildStageHref(item.stage)}
          className={`rounded-full border px-3 py-1.5 text-xs ${stageTabClass(props.currentStage === item.stage)}`}
        >
          {item.label}
        </Link>
        ))}
    </div>
  )
}

export function SenderEvidenceDrawer(props: {
  open: boolean
  sender: string
  messages: GmailSenderWorkspaceData['senders'][number]['preview_messages']
  onOpenMessage: (messageId: string) => void
  snippetLoading?: boolean
}) {
  if (!props.open) return null
  return (
    <div className={`${neutralNestedSurfaceClass} rounded-2xl p-3 space-y-2`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-slate-300">
          Message evidence for {props.sender}
        </p>
        {props.snippetLoading ? (
          <span className="text-[11px] text-cyan-200">Loading preview text…</span>
        ) : null}
      </div>
      {props.messages.map((message) => (
        <button
          key={message.message_id}
          type="button"
          onClick={() => props.onOpenMessage(message.message_id)}
          className={`${neutralInsetSurfaceClass} block w-full rounded-xl p-3 text-left hover:border-cyan-700/60 hover:bg-[linear-gradient(180deg,rgba(18,28,41,0.98),rgba(10,17,26,0.98))]`}
        >
          <p className="text-sm font-medium text-white">{message.subject || '(no subject)'}</p>
          <p className="mt-1 text-xs text-slate-300">
            {formatDate(message.date)} · {(message.category_labels || []).join(', ') || 'No category'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {message.snippet ||
              (props.snippetLoading
                ? 'Loading preview text from Gmail…'
                : 'Preview text unavailable here. Open the full message preview for more evidence.')}
          </p>
        </button>
      ))}
    </div>
  )
}

export type GmailSharedSenderCardManagedState = {
  destinationState: GmailDestinationState
  executionState: GmailDestinationExecutionState
  lastActionTimestamp: string
}

export type GmailSharedSenderCardSnippetHydrationState = {
  loading: boolean
  error: string | null
  availability: OptionalEvidenceDetailAvailability | null
}

function gmailOptionalEvidenceRecoveryCopy(
  operatorAction: OptionalEvidenceDetailOperatorAction
): string {
  if (operatorAction === 'connect_source') {
    return 'Connect Gmail in Settings to restore preview text.'
  }
  if (operatorAction === 'review_source_permissions') {
    return 'Review Gmail access in Settings to allow preview text.'
  }
  return 'Reconnect Gmail in Settings to restore preview text.'
}

function sharedSenderSignalLabel(
  senderSignal: GmailSenderWorkspaceData['senders'][number]['sender_signal']
): string {
  if (senderSignal === 'likely_machine_generated') return 'Likely automated'
  if (senderSignal === 'likely_human') return 'Likely human'
  return 'Mixed signal'
}

function sharedSenderSemanticFamilyBadge(
  sender: GmailSenderWorkspaceData['senders'][number]
): string {
  if (sender.semantic_family.resolution === 'thin_history') return 'Thin semantic history'
  if (sender.semantic_family.resolution === 'mixed') return 'Mixed semantic read'
  return gmailSemanticFamilyDisplayLabel(sender.semantic_family.family)
}

function sharedSenderSemanticPatternBadge(
  sender: GmailSenderWorkspaceData['senders'][number]
): string {
  if (sender.semantic_pattern.resolution === 'thin_history') return 'Pattern needs more history'
  if (sender.semantic_pattern.resolution === 'mixed') return 'Mixed pattern'
  return gmailSemanticPatternClassDisplayLabel(sender.semantic_pattern.pattern_class)
}

function sharedSenderSemanticSubtitle(
  sender: GmailSenderWorkspaceData['senders'][number]
): string {
  const familyBadge = sharedSenderSemanticFamilyBadge(sender)
  const patternBadge = sharedSenderSemanticPatternBadge(sender)
  if (patternBadge === familyBadge || sender.semantic_pattern.resolution !== 'clear') {
    return familyBadge
  }
  return `${familyBadge} · ${patternBadge}`
}

function sharedSenderSemanticSummary(
  sender: GmailSenderWorkspaceData['senders'][number]
): string {
  if (sender.semantic_family.resolution === 'thin_history') {
    return 'Not enough sender history for a stable semantic read yet.'
  }

  const familyLabel = gmailSemanticFamilyDisplayLabel(sender.semantic_family.family)
  const patternLabel = gmailSemanticPatternClassDisplayLabel(sender.semantic_pattern.pattern_class)

  if (sender.semantic_family.resolution === 'mixed') {
    return `${familyLabel} is the closest fit, but this sender still mixes different behaviors.`
  }

  if (sender.semantic_pattern.resolution === 'thin_history') {
    return `${familyLabel} is the main semantic read. Pattern detail still needs more history.`
  }

  if (sender.semantic_pattern.resolution === 'mixed') {
    return `${familyLabel} is the main semantic read. The recurring pattern is still mixed.`
  }

  return `${familyLabel} is the main semantic read, with ${patternLabel.toLowerCase()} as the clearest recurring pattern.`
}

function sharedEvidenceCategoryLabel(label: string | null | undefined): string {
  const normalized = label?.replace(/\s+/g, ' ').trim() || ''
  if (!normalized) return 'Other'
  if (!/^CATEGORY_|^TAB_|_/.test(normalized)) return normalized
  return normalized
    .replace(/^CATEGORY_/, '')
    .replace(/^TAB_/, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function sharedEvidencePreviewText(
  subject: string | null | undefined,
  snippet: string | null | undefined
): string | null {
  const normalizedSubject = subject?.replace(/\s+/g, ' ').trim() || ''
  let normalizedSnippet = snippet?.replace(/\s+/g, ' ').trim() || ''
  if (!normalizedSnippet) return null

  if (normalizedSubject) {
    normalizedSnippet = normalizedSnippet
      .replace(
        new RegExp(
          `^${normalizedSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*[-:|·]\\s*)?`,
          'i'
        ),
        ''
      )
      .trim()
  }

  if (!normalizedSnippet) return null
  if (normalizedSubject && normalizedSnippet.toLowerCase() === normalizedSubject.toLowerCase()) {
    return null
  }

  return normalizedSnippet
}

function sharedSenderEvidenceGroups(
  messages: GmailSenderWorkspaceData['senders'][number]['preview_messages']
): Array<[string, GmailSenderWorkspaceData['senders'][number]['preview_messages']]> {
  const grouped = new Map<
    string,
    GmailSenderWorkspaceData['senders'][number]['preview_messages']
  >()

  for (const message of messages) {
    const rawLabel =
      message.category_labels?.find((label) => typeof label === 'string' && label.trim().length > 0) ||
      message.label_ids?.find((label) => typeof label === 'string' && label.trim().length > 0) ||
      'OTHER'
    const bucket = grouped.get(rawLabel) || []
    bucket.push(message)
    grouped.set(rawLabel, bucket)
  }

  return Array.from(grouped.entries()).sort((left, right) => {
    if (right[1].length !== left[1].length) return right[1].length - left[1].length
    return sharedEvidenceCategoryLabel(left[0]).localeCompare(sharedEvidenceCategoryLabel(right[0]))
  })
}

function sharedSenderEvidenceAvailability(
  messages: GmailSenderWorkspaceData['senders'][number]['preview_messages'],
  resolutionState: 'ready' | 'resolving' = 'ready'
): {
  state: 'full_preview_available' | 'subject_only_evidence_available' | 'no_previewable_evidence'
  label: string
  detail: string
  emptyState: string
} {
  if (resolutionState === 'resolving' && messages.length === 0) {
    return {
      state: 'no_previewable_evidence',
      label: 'Loading evidence',
      detail: 'Supporting evidence for this sender is still loading.',
      emptyState: 'Supporting evidence for this sender is still loading.',
    }
  }
  if (messages.length === 0) {
    return {
      state: 'no_previewable_evidence',
      label: 'No previewable evidence',
      detail: 'No previewable evidence is loaded for this sender yet.',
      emptyState: 'No previewable evidence is loaded for this sender yet.',
    }
  }
  const hasPreviewText = messages.some(
    (message) => typeof message.snippet === 'string' && message.snippet.trim().length > 0
  )
  if (hasPreviewText) {
    return {
      state: 'full_preview_available',
      label: 'Full preview available',
      detail: 'Recent evidence includes preview text, so you can read proof before opening the full message preview.',
      emptyState: 'No previewable evidence is loaded for this sender yet.',
    }
  }
  return {
    state: 'subject_only_evidence_available',
    label: 'Subject-only evidence',
    detail: 'Recent evidence is limited to subject and timestamp context. Snippet text is still unavailable for these messages.',
    emptyState: 'Only subject and timestamp evidence is loaded for this sender right now.',
  }
}

export function GmailSharedSenderCard(props: {
  sender: GmailSenderWorkspaceData['senders'][number]
  mode: 'overview' | 'decision'
  groupSemanticRollup?: GmailSenderWorkspaceData['analytics']['semantic_rollup']
  managedState?: GmailSharedSenderCardManagedState | null
  visibleEvidenceCount?: number
  onLoadMoreEvidence?: ((count: number) => void) | null
  snippetHydrationState?: GmailSharedSenderCardSnippetHydrationState | null
  onRetrySnippetHydration?: (() => void) | null
  evidenceResolutionState?: 'ready' | 'resolving'
  onOpenMessagePreview?: ((
    sender: GmailSenderWorkspaceData['senders'][number],
    message: GmailSenderWorkspaceData['senders'][number]['preview_messages'][number]
  ) => void) | null
  headerSlot?: ReactNode
  footerSlot?: ReactNode
  actionsSlot?: ReactNode
  className?: string
}) {
  const isOverviewMode = props.mode === 'overview'
  const visibleEvidenceCount = Math.max(
    1,
    props.visibleEvidenceCount || (isOverviewMode ? 2 : 6)
  )
  const visibleMessages = props.sender.preview_messages.slice(0, visibleEvidenceCount)
  const evidenceGroups = sharedSenderEvidenceGroups(visibleMessages)
  const remainingEvidenceCount = Math.max(props.sender.preview_messages.length - visibleMessages.length, 0)
  const loadMoreCount = Math.min(isOverviewMode ? 2 : 3, remainingEvidenceCount)
  const evidenceAvailability = sharedSenderEvidenceAvailability(
    visibleMessages.length > 0 ? visibleMessages : props.sender.preview_messages,
    props.evidenceResolutionState || 'ready'
  )
  const committedSummary = props.managedState
    ? props.managedState.destinationState === 'ARCHIVE'
      ? `Already managed as Archive. Execution ${labelForExecutionState(props.managedState.executionState).toLowerCase()}.`
      : `Already managed as ${labelForDestinationState(props.managedState.destinationState)}.`
    : null
  const evidenceContextLabel =
    props.mode === 'decision' ? 'Evidence behind this sender' : 'Visible proof in Overview'
  const cardShellClass =
    props.className ||
    (isOverviewMode
      ? 'app-surface-card rounded-2xl border border-cyan-700/35 bg-[linear-gradient(180deg,rgba(14,25,37,0.98),rgba(7,13,21,0.99))] p-4 shadow-[0_14px_32px_rgba(2,6,23,0.22)]'
      : 'app-surface-card rounded-[28px] border border-cyan-700/35 bg-[linear-gradient(180deg,rgba(15,24,36,0.98),rgba(8,14,23,0.99))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.28)]')
  const presentationPolicy = useMemo(
    () => buildGmailSemanticPresentationPolicy(props.groupSemanticRollup || null),
    [props.groupSemanticRollup]
  )
  const semanticFamilyLabel = sharedSenderSemanticFamilyBadge(props.sender)
  const semanticPatternLabel = sharedSenderSemanticPatternBadge(props.sender)
  const semanticSubtitle = sharedSenderSemanticSubtitle(props.sender)
  const semanticSummary = sharedSenderSemanticSummary(props.sender)
  const senderBadges = Array.from(
    new Set(
      (isOverviewMode
        ? [
          sharedSenderSignalLabel(props.sender.sender_signal),
          props.sender.requires_verification
            ? 'Needs verification'
            : props.sender.protected_hint
              ? 'Protected context'
              : null,
          ]
        : [
          semanticFamilyLabel,
          semanticPatternLabel,
          sharedSenderSignalLabel(props.sender.sender_signal),
          props.sender.protected_hint ? 'Protected signals' : null,
          props.sender.requires_verification ? 'Needs verification' : null,
          ]
      ).filter(Boolean) as string[]
    )
  )

  return (
    <article className={cardShellClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className={isOverviewMode ? 'space-y-1.5' : 'space-y-2'}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            {props.mode === 'decision' ? 'Decision Mode' : 'Overview preview'}
          </p>
          <div>
            <h3
              className={
                isOverviewMode
                  ? 'text-lg font-semibold tracking-tight text-white'
                  : 'text-2xl font-semibold tracking-tight text-white'
              }
            >
              {props.sender.sender}
            </h3>
            <p className={isOverviewMode ? 'mt-1 text-xs leading-5 text-slate-200' : 'mt-1 text-sm text-slate-200'}>
              {props.sender.sender_domain || 'Unknown domain'} · {semanticSubtitle} · last activity{' '}
              {formatDate(props.sender.last_activity)}
            </p>
          </div>
        </div>
        {props.headerSlot ? <div className="shrink-0">{props.headerSlot}</div> : null}
      </div>

      <div className={isOverviewMode ? 'mt-3 flex flex-wrap gap-1.5' : 'mt-4 flex flex-wrap gap-2'}>
        {senderBadges.map((badge) => (
          <span
            key={`${props.sender.sender_key}-${badge}`}
            className={`${neutralPillSurfaceClass} rounded-full ${
              isOverviewMode ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
            } text-slate-200`}
          >
            {badge}
          </span>
        ))}
      </div>

      {committedSummary && !isOverviewMode ? (
        <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/40 p-3">
          <p className="text-xs font-medium text-slate-100">Current managed state</p>
          <p className="mt-1 text-sm text-slate-300">{committedSummary}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            Last destination update {formatDate(props.managedState?.lastActionTimestamp)}.
          </p>
        </div>
      ) : null}

      {isOverviewMode ? (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className={`${neutralNestedSurfaceClass} rounded-xl p-2.5`}>
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-300">Messages in group</p>
              <p className="mt-1 text-base font-semibold text-white">
                {props.sender.cleanup_group_message_count.toLocaleString()}
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-xl p-2.5`}>
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-300">Unread</p>
              <p className="mt-1 text-base font-semibold text-white">
                {props.sender.unread_count.toLocaleString()}
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-xl p-2.5`}>
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-300">Indexed total</p>
              <p className="mt-1 text-base font-semibold text-white">
                {(props.sender.total_sender_messages || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
            <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                {presentationPolicy.senderCard.surfaceTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-100">{semanticSummary}</p>
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-200">
                <p>
                  <span className="text-slate-400">Signal:</span>{' '}
                  {sharedSenderSignalLabel(props.sender.sender_signal)}
                </p>
                <p>
                  <span className="text-slate-400">Review:</span>{' '}
                  {props.sender.requires_verification
                    ? props.sender.verification_reasons.join(' · ')
                    : props.sender.protected_hint || 'No extra caution from current proof.'}
                </p>
              </div>
            </div>

            <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                    {evidenceContextLabel}
                  </p>
                  <span className="mt-1.5 inline-flex rounded-full border border-slate-700/70 bg-slate-950/35 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                    {evidenceAvailability.label}
                  </span>
                </div>
                {remainingEvidenceCount > 0 && props.onLoadMoreEvidence ? (
                  <button
                    type="button"
                    onClick={() => props.onLoadMoreEvidence?.(loadMoreCount)}
                    className={`${quietControlSurfaceClass} rounded-full px-3 py-1.5 text-xs`}
                  >
                    Show {loadMoreCount} more
                  </button>
                ) : null}
              </div>

              {props.snippetHydrationState?.loading ? (
                <p className="mt-3 text-[11px] text-cyan-200">Loading recent proof text…</p>
              ) : null}
              {props.snippetHydrationState?.error ? (
                <p className="mt-3 text-[11px] text-amber-200">
                  Some recent proof text is still unavailable.
                </p>
              ) : null}
              <div className="mt-3 space-y-2">
                {evidenceGroups.map(([label, messages]) => (
                  <div key={label} className={`${neutralInsetSurfaceClass} rounded-xl p-3`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-white">
                        {sharedEvidenceCategoryLabel(label)}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        {messages.length.toLocaleString()} shown
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {messages.map((message) => {
                        const previewText = sharedEvidencePreviewText(message.subject, message.snippet)

                        return props.onOpenMessagePreview ? (
                          <button
                            key={message.message_id}
                            type="button"
                            onClick={() => props.onOpenMessagePreview?.(props.sender, message)}
                            className={`${neutralNestedSurfaceClass} block w-full rounded-xl p-2.5 text-left hover:border-cyan-700/45`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-xs font-medium text-white">
                                {message.subject || 'No subject'}
                              </p>
                              <span className="text-[10px] text-slate-300">
                                {message.date || 'No timestamp'}
                              </span>
                            </div>
                            {previewText ? (
                              <p className="mt-2 text-xs leading-5 text-slate-200">{previewText}</p>
                            ) : (
                              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                Preview text is not available yet
                              </p>
                            )}
                            <p className="mt-2 text-[10px] font-medium text-cyan-200">
                              Open full preview
                            </p>
                          </button>
                        ) : (
                          <div key={message.message_id} className={`${neutralNestedSurfaceClass} rounded-xl p-2.5`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-xs font-medium text-white">
                                {message.subject || 'No subject'}
                              </p>
                              <span className="text-[10px] text-slate-300">
                                {message.date || 'No timestamp'}
                              </span>
                            </div>
                            {previewText ? (
                              <p className="mt-2 text-xs leading-5 text-slate-200">{previewText}</p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {props.sender.preview_messages.length === 0 ? (
                  <div className={`${neutralInsetSurfaceClass} rounded-xl p-3 text-sm text-slate-300`}>
                    {evidenceAvailability.emptyState}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Messages in group</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {props.sender.cleanup_group_message_count.toLocaleString()}
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Unread</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {props.sender.unread_count.toLocaleString()}
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Indexed total</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {(props.sender.total_sender_messages || 0).toLocaleString()}
              </p>
            </div>
            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-300">
                {presentationPolicy.senderCard.metricLabel}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-white">
                {semanticFamilyLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                {presentationPolicy.senderCard.surfaceTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-100">
                {semanticSummary}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <p>
                  <span className="text-slate-400">Sender signal:</span>{' '}
                  {sharedSenderSignalLabel(props.sender.sender_signal)}
                </p>
                <p>
                  <span className="text-slate-400">{presentationPolicy.senderCard.familyLabel}:</span>{' '}
                  {semanticFamilyLabel}
                </p>
                <p>
                  <span className="text-slate-400">{presentationPolicy.senderCard.patternLabel}:</span>{' '}
                  {semanticPatternLabel}
                </p>
                <p>
                  <span className="text-slate-400">{presentationPolicy.senderCard.usageLabel}:</span>{' '}
                  {presentationPolicy.senderCard.usageDetail}
                </p>
              </div>
              {props.sender.protected_hint ? (
                <div className="mt-4 rounded-2xl border border-amber-900/45 bg-amber-950/18 p-3 text-sm text-amber-100">
                  Protected hint: {props.sender.protected_hint}
                </div>
              ) : null}
              {props.sender.requires_verification ? (
                <div className="mt-4 rounded-2xl border border-amber-900/45 bg-amber-950/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-amber-200">
                    Verification signals
                  </p>
                  <p className="mt-2 text-sm text-amber-100">
                    {props.sender.verification_reasons.join(' · ')}
                  </p>
                </div>
              ) : null}
            </div>

            <div className={`${neutralNestedSurfaceClass} rounded-2xl p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                    {evidenceContextLabel}
                  </p>
                  <span className="mt-2 inline-flex rounded-full border border-slate-700/70 bg-slate-950/35 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200">
                    {evidenceAvailability.label}
                  </span>
                  <p className="mt-2 text-sm text-slate-200">
                    Messages remain supporting evidence only.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{evidenceAvailability.detail}</p>
                </div>
                {remainingEvidenceCount > 0 && props.onLoadMoreEvidence ? (
                  <button
                    type="button"
                    onClick={() => props.onLoadMoreEvidence?.(loadMoreCount)}
                    className={`${quietControlSurfaceClass} rounded-full px-3 py-1.5 text-xs`}
                  >
                    Show {loadMoreCount} more
                  </button>
                ) : null}
              </div>

              {props.snippetHydrationState?.loading ? (
                <p className="mt-3 text-[11px] text-cyan-200">Loading recent proof text…</p>
              ) : null}
              {props.snippetHydrationState?.error ? (
                <p className="mt-3 text-[11px] text-amber-200">
                  Some recent proof text is still unavailable.
                </p>
              ) : null}
              {props.snippetHydrationState?.availability?.state ===
              'subject_only_available' ? (
                <div
                  className="mt-3 rounded-2xl border border-cyan-800/40 bg-cyan-950/15 p-3"
                  data-optional-evidence-state="subject_only_available"
                >
                  <p className="text-sm font-medium text-cyan-100">
                    Subject and date evidence is still available.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {gmailOptionalEvidenceRecoveryCopy(
                      props.snippetHydrationState.availability.operator_action
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/settings"
                      className={`${quietSecondaryActionClass} rounded-full px-3 py-1.5 text-xs`}
                    >
                      Open Gmail settings
                    </Link>
                    {props.onRetrySnippetHydration ? (
                      <button
                        type="button"
                        onClick={props.onRetrySnippetHydration}
                        className={`${quietControlSurfaceClass} rounded-full px-3 py-1.5 text-xs`}
                      >
                        Try preview text again
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {evidenceGroups.map(([label, messages]) => (
                  <div key={label} className={`${neutralInsetSurfaceClass} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {sharedEvidenceCategoryLabel(label)}
                      </p>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {messages.length.toLocaleString()} shown
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {messages.map((message) => {
                        const previewText = sharedEvidencePreviewText(message.subject, message.snippet)

                        return props.onOpenMessagePreview ? (
                          <button
                            key={message.message_id}
                            type="button"
                            onClick={() => props.onOpenMessagePreview?.(props.sender, message)}
                            className={`${neutralNestedSurfaceClass} block w-full rounded-2xl p-3 text-left hover:border-cyan-700/45`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-sm font-medium text-white">
                                {message.subject || 'No subject'}
                              </p>
                              <span className="text-[11px] text-slate-300">
                                {message.date || 'No timestamp'}
                              </span>
                            </div>
                            {previewText ? (
                              <p className="mt-3 text-sm leading-6 text-slate-200">{previewText}</p>
                            ) : (
                              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                Preview text is not available for this message yet
                              </p>
                            )}
                            <p className="mt-3 text-[11px] font-medium text-cyan-200">
                              Open full message preview
                            </p>
                          </button>
                        ) : (
                          <div key={message.message_id} className={`${neutralNestedSurfaceClass} rounded-2xl p-3`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-sm font-medium text-white">
                                {message.subject || 'No subject'}
                              </p>
                              <span className="text-[11px] text-slate-300">
                                {message.date || 'No timestamp'}
                              </span>
                            </div>
                            {previewText ? (
                              <p className="mt-3 text-sm leading-6 text-slate-200">{previewText}</p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {props.sender.preview_messages.length === 0 ? (
                  <div className={`${neutralInsetSurfaceClass} rounded-2xl p-4 text-sm text-slate-300`}>
                    {evidenceAvailability.emptyState}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}

      {props.actionsSlot ? <div className="mt-5">{props.actionsSlot}</div> : null}
      {props.footerSlot ? <div className="mt-5">{props.footerSlot}</div> : null}
    </article>
  )
}

function SenderPolicyButtons(props: {
  value: GmailSenderPolicy
  onChange: (policy: GmailSenderPolicy) => void
}) {
  const options: Array<[GmailSenderPolicy, string]> = [
    ['keep', 'Keep'],
    ['archive', 'Archive'],
    ['quarantine', 'Quarantine'],
    ['unsubscribe', 'Unsubscribe'],
    ['custom_rule', 'Custom rule'],
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([policy, label]) => (
        <button
          key={policy}
          type="button"
          onClick={() => props.onChange(policy)}
          className={`rounded-full border px-3 py-1.5 text-xs ${policyClass(
            props.value === policy ? policy : 'undecided'
          )}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SenderCard(props: {
  sender: GmailSenderWorkspaceData['senders'][number]
  groupSemanticRollup?: GmailSenderWorkspaceData['analytics']['semantic_rollup']
  policy: GmailSenderPolicy
  committedState?: {
    destinationState: GmailDestinationState
    executionState: GmailDestinationExecutionState
    lastActionTimestamp: string
  } | null
  open: boolean
  onToggleOpen: () => void
  onPolicyChange: (policy: GmailSenderPolicy) => void
  onOpenMessage: (messageId: string) => void
  snippetLoading?: boolean
}) {
  const classificationSummary =
    props.sender.sender_signal === 'likely_machine_generated'
      ? `Likely automated ${formatPercent(props.sender.machine_probability)}`
      : props.sender.sender_signal === 'likely_human'
        ? `Likely human ${formatPercent(props.sender.human_probability)}`
        : 'Mixed or uncertain sender behavior'

  const verificationSummary = props.sender.requires_verification
    ? `We pause this sender because ${props.sender.verification_reasons.join(', ').toLowerCase()}.`
    : 'No strong verification blockers are currently visible in the cached evidence.'

  const semanticFamilyLabel = sharedSenderSemanticFamilyBadge(props.sender)
  const semanticPatternLabel = sharedSenderSemanticPatternBadge(props.sender)
  const semanticSubtitle = sharedSenderSemanticSubtitle(props.sender)
  const semanticSummary = sharedSenderSemanticSummary(props.sender)
  const senderBadges = Array.from(
    new Set(
      [
        semanticFamilyLabel,
        semanticPatternLabel,
        props.sender.sender_signal === 'likely_machine_generated'
          ? 'Likely automated'
          : props.sender.sender_signal === 'likely_human'
            ? 'Likely human'
            : 'Mixed signal',
        props.sender.protected_hint ? 'Protected signals' : null,
        props.sender.requires_verification ? 'Needs verification' : null,
      ].filter(Boolean) as string[]
    )
  )
  const hasDraftPolicy = props.policy !== 'undecided'
  const committedPolicy = props.committedState
    ? policyFromDestinationState(props.committedState.destinationState)
    : null
  const committedDestinationLabel = props.committedState
    ? labelForDestinationState(props.committedState.destinationState)
    : null
  const committedLastActionLabel = props.committedState
    ? formatDate(props.committedState.lastActionTimestamp)
    : '—'
  const primaryStateLabel = hasDraftPolicy
    ? `Draft: ${labelForPolicy(props.policy as Exclude<GmailSenderPolicy, 'undecided'>)}`
    : committedPolicy
      ? `Managed: ${labelForPolicy(committedPolicy)}`
      : 'No decision yet'
  const primaryStateClass = hasDraftPolicy
    ? policyClass(props.policy)
    : committedPolicy
      ? policyClass(committedPolicy)
      : policyClass('undecided')
  const committedSummary = props.committedState
    ? props.committedState.destinationState === 'ARCHIVE'
      ? `Already managed as Archive. Execution ${labelForExecutionState(props.committedState.executionState).toLowerCase()}.`
      : `Already managed as ${labelForDestinationState(props.committedState.destinationState)}. This stays out of Confirmation until you make a new draft decision.`
    : null
  const presentationPolicy = buildGmailSemanticPresentationPolicy(props.groupSemanticRollup || null)

  return (
    <article className="app-surface-card rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{props.sender.sender}</p>
          <p className="mt-1 text-xs text-gray-500">
            {(props.sender.sender_domain || 'Unknown domain')} · {semanticSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${primaryStateClass}`}>
            {primaryStateLabel}
          </span>
          {hasDraftPolicy && committedPolicy ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${policyClass(committedPolicy)}`}
            >
              Managed: {labelForPolicy(committedPolicy)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {senderBadges.map((badge) => (
          <span
            key={`${props.sender.sender_key}-${badge}`}
            className={`${neutralPillSurfaceClass} rounded-full px-2.5 py-1 text-[11px] text-gray-300`}
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Messages in this group</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {props.sender.cleanup_group_message_count.toLocaleString()}
          </p>
        </div>
        <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">All indexed history</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {(props.sender.total_sender_messages || 0).toLocaleString()}
          </p>
        </div>
        <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Unread now</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {props.sender.unread_count.toLocaleString()}
          </p>
        </div>
        <div className={`${neutralNestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Last activity</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatDate(props.sender.last_activity)}</p>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        {insightCard(
          presentationPolicy.senderCard.surfaceTitle,
          `${semanticFamilyLabel} · ${semanticPatternLabel}`,
          semanticSummary
        )}
        {insightCard(
          'Sender profile',
          classificationSummary,
          props.sender.first_seen
            ? `First seen ${formatDate(props.sender.first_seen)} and last active ${formatDate(props.sender.last_activity)}.`
            : 'History is inferred from the current indexed sender record.'
        )}
        {insightCard(
          'Review caution',
          props.sender.protected_hint || 'No protected hint',
          verificationSummary
        )}
      </div>
      {props.sender.requires_verification ? (
        <div className="rounded-2xl border border-amber-800/50 bg-amber-950/15 p-3">
          <p className="text-xs font-medium text-amber-100">Needs verification</p>
          <p className="mt-1 text-sm text-amber-50">
            Pause before trusting this sender for archive-now work. Signals: {props.sender.verification_reasons.join(' · ')}. Protected evidence still remains excluded from archive in Phase 1.
          </p>
        </div>
      ) : null}
      {committedSummary ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
          <p className="text-xs font-medium text-slate-100">
            {hasDraftPolicy ? 'Current managed state' : 'Already managed'}
          </p>
          <p className="mt-1 text-sm text-slate-300">{committedSummary}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            {hasDraftPolicy
              ? `You are editing a new draft change. Gmail and Management stay at ${committedDestinationLabel || 'the committed destination'} until you approve again.`
              : `Last destination update ${committedLastActionLabel}.`}
          </p>
        </div>
      ) : null}
      <SenderPolicyButtons value={props.policy} onChange={props.onPolicyChange} />
      <button
        type="button"
        onClick={props.onToggleOpen}
        className="rounded-full border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-cyan-700/60"
      >
        {props.open ? 'Hide evidence' : 'Show evidence'}
      </button>
      <SenderEvidenceDrawer
        open={props.open}
        sender={props.sender.sender}
        messages={props.sender.preview_messages}
        onOpenMessage={props.onOpenMessage}
        snippetLoading={props.snippetLoading}
      />
    </article>
  )
}

export function SenderDecisionStage(props: {
  data: GmailSenderWorkspaceData
  isRefreshing: boolean
  blockingError: string | null
  draftSavedAt: number
  policyBySender: Record<string, GmailSenderPolicy>
  committedBySender: Record<
    string,
    {
      destinationState: GmailDestinationState
      executionState: GmailDestinationExecutionState
      lastActionTimestamp: string
    }
  >
  openSenderKey: string | null
  onToggleSender: (senderKey: string) => void
  onPolicyChange: (senderKey: string, sender: string, policy: GmailSenderPolicy) => void
  onOpenMessage: (messageId: string) => void
  onPageChange: (page: number) => void
  onSearchChange: (value: string) => void
  onFilterChange: (value: GmailSenderWorkspaceData['view']['filter']) => void
  onSortChange: (value: GmailSenderWorkspaceData['view']['sort']) => void
  onDirectionChange: (value: GmailSenderWorkspaceData['view']['direction']) => void
  snippetLoadingSenderKey?: string | null
}) {
  const searchDebounceRef = useRef<number | null>(null)
  const [activeInsight, setActiveInsight] = useState<{ label: string; detail: string } | null>(null)
  const [searchInputValue, setSearchInputValue] = useState(props.data.view.search)
  const decidedSenderCount = Object.values(props.policyBySender).filter(
    (policy) => policy && policy !== 'undecided'
  ).length
  const presentationPolicy = useMemo(
    () => buildGmailSemanticPresentationPolicy(props.data.analytics.semantic_rollup),
    [props.data.analytics.semantic_rollup]
  )
  const committedVisibleCount = props.data.senders.filter(
    (sender) => props.committedBySender[sender.sender_key]
  ).length
  const archiveNowCount = Object.values(props.policyBySender).filter(
    (policy) => policy === 'archive'
  ).length
  const storedLaterCount = Object.values(props.policyBySender).filter((policy) =>
    ['keep', 'quarantine', 'unsubscribe', 'custom_rule'].includes(policy)
  ).length
  const quickFilters: Array<{
    value: GmailSenderWorkspaceData['view']['filter']
    label: string
  }> = [
    { value: 'all', label: 'All senders' },
    { value: 'needs_verification', label: 'Needs verification' },
    { value: 'protected', label: 'Protected signals' },
    { value: 'likely_machine_generated', label: 'Likely automated' },
    { value: 'likely_human', label: 'Likely human' },
  ]

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current != null) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  const queueSearchChange = (value: string) => {
    setSearchInputValue(value)
    if (searchDebounceRef.current != null) {
      window.clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = window.setTimeout(() => {
      props.onSearchChange(value)
      searchDebounceRef.current = null
    }, 250)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Sender Decisions</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {props.data.selected_cluster.title}
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          {presentationPolicy.topExplanation.body}
        </p>
        <p className="mt-2 text-sm text-gray-300">
          This is the drill-down workspace for Phase 1. Review senders, use analytics to focus the list, and open messages only when you need evidence.
        </p>
      </section>
      {sectionCard(
        'Cluster brief',
        'Start with the group context, the safety frame, and how much of the cleanup mission is already decided.',
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-5">
            {metricCard(
              'Senders in group',
              props.data.selected_cluster.sender_count.toLocaleString(),
              `${props.data.selected_cluster.message_count.toLocaleString()} supporting messages sit behind this sender set.`,
              'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
            )}
            {metricCard(
              'Draft decisions',
              decidedSenderCount.toLocaleString(),
              'Only these live session choices flow into Confirmation until you approve again.',
              'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
            )}
            {metricCard(
              'Archive in draft',
              archiveNowCount.toLocaleString(),
              'These senders currently contribute to the exact archive approval preview.',
              'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
            )}
            {metricCard(
              'Stored later in draft',
              storedLaterCount.toLocaleString(),
              'Keep, quarantine, unsubscribe, and custom-rule choices remain stored intent only in Phase 1.',
              'border-slate-800 bg-gradient-to-b from-slate-900/40 to-gray-950/40'
            )}
            {metricCard(
              'Already managed',
              committedVisibleCount.toLocaleString(),
              'Visible senders with committed destination states show managed badges without reopening Confirmation.',
              'border-violet-900/50 bg-gradient-to-b from-violet-950/20 to-gray-950/40'
            )}
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            {insightCard(
              presentationPolicy.topExplanation.title,
              presentationPolicy.cleanupGroupCard.headline,
              presentationPolicy.cleanupGroupCard.support
            )}
            {insightCard(
              'Safety context',
              props.data.selected_cluster.safety_note,
              props.data.selected_cluster.risk_note
            )}
            {insightCard(
              'How to use this page',
              'Decide at the sender level',
              'Click analytics to focus the sender list, then use evidence previews only when you need proof before storing a policy.'
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => props.onFilterChange(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  props.data.view.filter === filter.value
                    ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                    : 'border-gray-800 bg-gray-950/50 text-gray-300 hover:border-gray-700 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <section className="app-surface-card rounded-2xl p-4 text-sm text-gray-300">
        Draft decisions persist for this cleanup group during Phase 1, so you can leave and return later without losing current sender policies.
        <span className="ml-2 text-gray-500">
          Managed badges come from committed destination state and stay separate from the live draft buffer.
        </span>
        {props.draftSavedAt > 0 ? (
          <span className="ml-2 text-gray-500">Last draft update saved in this browser session.</span>
        ) : null}
        {props.isRefreshing ? (
          <span className="ml-2 text-cyan-200">Updating the visible sender slice…</span>
        ) : null}
      </section>
      {props.blockingError ? (
        <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
          {props.blockingError}
        </section>
      ) : null}
      {sectionCard(
        'Sender analytics',
        'Click category bands or top contributors to focus the sender list here. Timeline interactions sort the list toward recent activity without sending you back to Mailbox Intelligence.',
        <div className="space-y-3">
          {activeInsight ? (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-3">
              <div>
                <p className="text-xs font-medium text-cyan-100">{activeInsight.label}</p>
                <p className="mt-1 text-sm text-cyan-50">{activeInsight.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveInsight(null)
                  setSearchInputValue('')
                  props.onSearchChange('')
                }}
                className="rounded-full border border-cyan-700/45 px-3 py-1 text-xs text-cyan-100"
              >
                Clear insight filter
              </button>
            </div>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-3">
            <HorizontalBarChart
              title="Sender category distribution"
              accentClass="bg-emerald-500"
              activeLabel={activeInsight?.label}
              onItemClick={(item) => {
                setSearchInputValue(item.label)
                props.onSearchChange(item.label)
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list filtered toward senders whose category summary matches ${item.label}.`,
                })
              }}
              items={props.data.analytics.sender_category_distribution.map((category) => ({
                label: category.label,
                value: category.sender_count,
              }))}
            />
            <TimelineChart
              title={`Sender activity timeline (${props.data.analytics.sender_activity_timeline_granularity})`}
              accentClass="bg-fuchsia-500/80"
              onItemClick={(item) => {
                props.onSortChange('last_activity')
                props.onDirectionChange('desc')
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list reordered by recent activity after selecting ${item.label}.`,
                })
              }}
              items={props.data.analytics.sender_activity_timeline.map((item) => ({
                label: item.label,
                count: item.sender_count,
              }))}
            />
            <HorizontalBarChart
              title="Cluster contribution"
              accentClass="bg-cyan-500"
              activeLabel={activeInsight?.label}
              onItemClick={(item) => {
                setSearchInputValue(item.label)
                props.onSearchChange(item.label)
                props.onSortChange('message_count')
                props.onDirectionChange('desc')
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list narrowed to ${item.label}, one of the largest contributors inside this cleanup group.`,
                })
              }}
              items={props.data.analytics.cluster_contribution.map((sender) => ({
                label: sender.sender,
                value: sender.message_count,
                detail: `${sender.share_pct}% of cluster messages`,
              }))}
            />
          </div>
        </div>
      )}
      <section className="app-surface-card rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Sender list controls</p>
            <p className="mt-2 text-sm text-gray-300">
              Showing {props.data.pagination.total_senders.toLocaleString()} senders from{' '}
              {props.data.pagination.cluster_total_senders.toLocaleString()} in this cleanup group.
              Messages stay secondary evidence only.
            </p>
          </div>
          <div className={`${neutralNestedSurfaceClass} rounded-2xl px-3 py-2 text-xs text-gray-300`}>
            {props.data.exceptions_count.toLocaleString()} senders currently show verification cues
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Search senders</span>
            <input
              value={searchInputValue}
              onChange={(event) => queueSearchChange(event.target.value)}
              placeholder="sender or domain"
              className={`${neutralInsetSurfaceClass} w-full rounded-2xl px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-700/60`}
            />
            <p className="text-[11px] text-gray-500">Search waits briefly before reloading the sender slice.</p>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Filter</span>
            <select
              value={props.data.view.filter}
              onChange={(event) =>
                props.onFilterChange(event.target.value as GmailSenderWorkspaceData['view']['filter'])
              }
              className={`${neutralInsetSurfaceClass} w-full rounded-2xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60`}
            >
              <option value="all">All senders</option>
              <option value="needs_verification">Needs verification</option>
              <option value="protected">Protected evidence</option>
              <option value="likely_machine_generated">Likely machine generated</option>
              <option value="likely_human">Likely human</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Sort</span>
            <select
              value={props.data.view.sort}
              onChange={(event) =>
                props.onSortChange(event.target.value as GmailSenderWorkspaceData['view']['sort'])
              }
              className={`${neutralInsetSurfaceClass} w-full rounded-2xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60`}
            >
              <option value="message_count">Group message count</option>
              <option value="sender">Sender name</option>
              <option value="unread_count">Unread count</option>
              <option value="last_activity">Last activity</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Direction</span>
            <select
              value={props.data.view.direction}
              onChange={(event) =>
                props.onDirectionChange(
                  event.target.value as GmailSenderWorkspaceData['view']['direction']
                )
              }
              className={`${neutralInsetSurfaceClass} w-full rounded-2xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60`}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
        {(props.data.view.search || props.data.view.filter !== 'all') && !activeInsight ? (
          <p className="text-xs text-gray-500">
            Active list state: {props.data.view.search ? `search "${props.data.view.search}"` : 'no search'} ·{' '}
            {props.data.view.filter === 'all' ? 'all senders' : props.data.view.filter.replaceAll('_', ' ')}
          </p>
        ) : null}
      </section>
      {props.data.senders.length === 0 ? (
        <section className="app-surface-card rounded-2xl p-4 text-sm text-gray-300">
          No senders match the current search and filter controls.
        </section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {props.data.senders.map((sender) => (
          <SenderCard
            key={sender.sender_key}
            sender={sender}
            groupSemanticRollup={props.data.analytics.semantic_rollup}
            policy={props.policyBySender[sender.sender_key] || 'undecided'}
            committedState={props.committedBySender[sender.sender_key] || null}
            open={props.openSenderKey === sender.sender_key}
            onToggleOpen={() => props.onToggleSender(sender.sender_key)}
            onPolicyChange={(policy) => props.onPolicyChange(sender.sender_key, sender.sender, policy)}
            onOpenMessage={props.onOpenMessage}
            snippetLoading={props.snippetLoadingSenderKey === sender.sender_key}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Page {props.data.pagination.page} of {props.data.pagination.total_pages} ·{' '}
          {props.data.pagination.total_senders.toLocaleString()} senders in this group
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => props.onPageChange(Math.max(1, props.data.pagination.page - 1))}
            disabled={props.data.pagination.page === 1}
            className="rounded border border-gray-700 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              props.onPageChange(
                Math.min(props.data.pagination.total_pages, props.data.pagination.page + 1)
              )
            }
            disabled={props.data.pagination.page === props.data.pagination.total_pages}
            className="rounded border border-gray-700 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export function DeferredStagePlaceholder(props: {
  stage: Exclude<GmailCleanupStage, 'senders' | 'confirmation'>
  selectedClusterTitle: string
  senderCount: number
  exceptionsCount: number
  openSendersHref: string
  openConfirmationHref: string
}) {
  const copy =
    props.stage === 'exceptions'
      ? {
          title: 'Exceptions / Verification moves inline in Phase 1',
          body: `Verification is currently handled inside Sender Decisions for ${props.selectedClusterTitle}. Use the "Needs verification" filter there to isolate the risky senders without leaving the main workflow.`,
        }
      : props.stage === 'rules'
        ? {
            title: 'Rules / Automation is deferred to a later phase',
            body: `Phase 1 stores sender policies and rule intents, but it does not ship the full rules surface yet. Confirmation is the current endpoint for exact archive impact.`,
          }
        : {
            title: 'Monitoring is deferred to a later phase',
            body: `Memory writes are still being recorded, but the interactive monitoring workspace is intentionally held for a later rebuild phase while the sender-first foundation is stabilized.`,
          }

  return (
    <section className="rounded-2xl border border-amber-900/45 bg-gradient-to-b from-amber-950/20 to-gray-950/45 p-5 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300">Phase 2+ placeholder</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">{copy.body}</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {metricCard(
          'Current sender set',
          props.senderCount.toLocaleString(),
          `${props.selectedClusterTitle} remains fully reviewable in the sender-first workspace.`,
          'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Verification cues',
          props.exceptionsCount.toLocaleString(),
          'These senders are already flagged inline and can be filtered immediately.',
          'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Active Phase 1 end state',
          'Confirmation',
          'Use Confirmation for exact current-message impact and archive approval creation.',
          'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={props.openSendersHref}
          className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Back to Sender Decisions
        </Link>
        <Link
          href={props.openConfirmationHref}
          className="automata-primary-button rounded-full px-4 py-2 text-sm font-medium text-white"
        >
          Open Confirmation
        </Link>
      </div>
    </section>
  )
}

export function ExceptionsStage(props: {
  senders: GmailSenderWorkspaceData['senders']
  policyBySender: Record<string, GmailSenderPolicy>
  onPolicyChange: (senderKey: string, sender: string, policy: GmailSenderPolicy) => void
  onOpenMessage: (messageId: string) => void
}) {
  const exceptions = props.senders.filter((sender) => sender.requires_verification)

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-900/45 bg-gradient-to-b from-amber-950/20 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300">Exceptions / Verification</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Confirm mixed or protected senders</h1>
        <p className="mt-2 text-sm text-gray-300">
          This stage isolates the uncertain senders so protected traffic stays visible before any archive action is requested.
        </p>
      </section>
      {exceptions.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
          No exception senders are currently loaded on this page.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {exceptions.map((sender) => (
            <SenderCard
              key={sender.sender_key}
              sender={sender}
              groupSemanticRollup={null}
              policy={props.policyBySender[sender.sender_key] || 'undecided'}
              open={true}
              onToggleOpen={() => undefined}
              onPolicyChange={(policy) => props.onPolicyChange(sender.sender_key, sender.sender, policy)}
              onOpenMessage={props.onOpenMessage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ConfirmationStage(props: {
  preview: GmailConfirmationPreviewData | null
  createArchiveApproval: () => Promise<void>
  creatingApproval: boolean
  actionNote: string | null
  hasPendingSessionDecisions: boolean
  policyBySender: Record<string, GmailSenderPolicy>
  onPolicyChange: (senderKey: string, sender: string, policy: GmailSenderPolicy) => void
  onRemoveDecision: (senderKey: string, sender: string) => void
  onOpenSenderReview: (sender: string) => void
}) {
  if (!props.preview) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Confirmation</p>
        <h1 className="text-xl font-semibold text-white">
          {props.hasPendingSessionDecisions
            ? 'Preparing the current session confirmation set'
            : 'No pending decisions in this session'}
        </h1>
        <p className="text-sm text-gray-300">
          {props.hasPendingSessionDecisions
            ? 'Computing exact current-message impact from the decisions you made in this active review session.'
            : 'Confirmation only shows the live decision buffer for the current session. Previously approved work now lives in Management and history, not in this pending review surface.'}
        </p>
        {props.actionNote ? <p className="text-sm text-cyan-200">{props.actionNote}</p> : null}
      </section>
    )
  }

  const decidedSenderCount = Math.max(
    0,
    props.preview.selected_cluster.sender_count - props.preview.undecided_sender_count
  )
  const groupOrder: GmailSenderPolicy[] = [
    'archive',
    'keep',
    'quarantine',
    'unsubscribe',
    'custom_rule',
    'undecided',
  ]
  const orderedGroups = props.preview.groups
    .slice()
    .sort(
      (left, right) =>
        groupOrder.indexOf(left.policy) - groupOrder.indexOf(right.policy) ||
        left.label.localeCompare(right.label)
    )

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Confirmation</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Review archive-now work and the preferences saved for later
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Approval commits sender destinations immediately. Archive is the only Phase 1 Gmail mutation attempt, and it is only treated as executed when inbox-label removal is actually confirmed. Keep, quarantine, unsubscribe, and custom-rule decisions are stored for later management only.
        </p>
      </section>
      <div className="grid gap-3 xl:grid-cols-3">
        {metricCard(
          'Decision coverage',
          decidedSenderCount.toLocaleString(),
          `${props.preview.selected_cluster.sender_count.toLocaleString()} senders are in this cluster; ${props.preview.undecided_sender_count.toLocaleString()} still remain untouched.`,
          'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Archive-now senders',
          props.preview.exact_archive_impact.sender_count.toLocaleString(),
          `${props.preview.exact_archive_impact.message_count.toLocaleString()} messages will lose the INBOX label now.`,
          'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Undecided senders',
          props.preview.undecided_sender_count.toLocaleString(),
          'These senders stay exactly as they are today and can be reviewed later without blocking archive-now work.',
          'border-slate-800 bg-gradient-to-b from-slate-900/40 to-gray-950/40'
        )}
      </div>
      {props.preview.undecided_sender_count > 0 ? (
        <section className="rounded-2xl border border-amber-900/45 bg-amber-950/10 p-4">
          <p className="text-sm font-medium text-amber-100">Partial completion is allowed in Phase 1</p>
          <p className="mt-2 text-sm text-amber-50">
            You can approve the archive-now senders today and return later to continue this cleanup group. Undecided senders stay unchanged until you explicitly review them.
          </p>
        </section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">What executes now</p>
          <p className="text-sm text-gray-300">
            After approval, the destination state is committed right away. Archive then attempts to remove the INBOX label from the exact matching messages above, but this page should only treat archive as successful once that Gmail change is confirmed.
          </p>
          <p className="text-sm text-gray-300">
            Protected exclusions: {props.preview.protected_exclusions_count.toLocaleString()} messages remain out of archive because protection signals are still present.
          </p>
          <button
            type="button"
            onClick={() => void props.createArchiveApproval()}
            disabled={props.creatingApproval || decidedSenderCount === 0}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {props.creatingApproval
              ? 'Committing destinations…'
              : props.preview.undecided_sender_count > 0
                ? 'Approve decisions and attempt archive'
                : 'Approve decisions'}
          </button>
          {props.actionNote ? <p className="text-xs text-cyan-200">{props.actionNote}</p> : null}
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">What is saved for later</p>
          <div className="space-y-2">
            {props.preview.future_behavior_summary.map((entry) => (
              <div key={entry.policy} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <p className="text-sm font-medium text-white">
                  {storedLaterPolicyLabel(entry.policy)} · {entry.sender_count.toLocaleString()} senders
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {entry.message_count.toLocaleString()} current messages · {entry.behavior}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {confirmationPolicyDescription(entry.policy)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
        <p className="text-xs font-medium text-white">Decision review</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {orderedGroups.map((group) => (
            <div key={group.policy} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {confirmationPolicyTitle(group.policy)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {confirmationPolicyDescription(group.policy)}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs ${policyClass(group.policy)}`}>
                  {group.policy}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {group.sender_count.toLocaleString()} senders · {group.message_count.toLocaleString()} messages
              </p>
              <div className="mt-3 space-y-2">
                {group.senders.map((sender) => (
                  <div key={sender.sender_key} className="rounded-xl border border-gray-800 bg-gray-950/70 p-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white">{sender.sender}</p>
                        <p className="text-xs text-gray-500">
                          {sender.message_count.toLocaleString()} messages
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ['archive', 'Archive'],
                            ['keep', 'Keep'],
                            ['quarantine', 'Quarantine'],
                            ['unsubscribe', 'Unsubscribe'],
                            ['custom_rule', 'Custom rule'],
                          ] as Array<[GmailSenderPolicy, string]>
                        ).map(([policy, label]) => (
                          <button
                            key={`${sender.sender_key}-${policy}`}
                            type="button"
                            onClick={() => props.onPolicyChange(sender.sender_key, sender.sender, policy)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] ${
                              props.policyBySender[sender.sender_key] === policy
                                ? policyClass(policy)
                                : 'border-gray-700 bg-gray-950/50 text-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => props.onRemoveDecision(sender.sender_key, sender.sender)}
                          className="rounded-full border border-gray-700 bg-gray-950/50 px-2.5 py-1 text-[11px] text-gray-300"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => props.onOpenSenderReview(sender.sender)}
                          className="rounded-full border border-cyan-700/45 bg-cyan-950/10 px-2.5 py-1 text-[11px] text-cyan-100"
                        >
                          Open in Sender Decisions
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function RulesAutomationStage(props: {
  ruleIntents: GmailCleanupRuleIntent[]
  onAddIntent?: (intent: GmailCleanupRuleIntent['intent_type']) => void
}) {
  const intentOptions: Array<[GmailCleanupRuleIntent['intent_type'], string]> = [
    ['keep', 'Add keep intent'],
    ['quarantine', 'Add quarantine intent'],
    ['unsubscribe', 'Add unsubscribe intent'],
    ['custom_rule', 'Add custom rule intent'],
  ]

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-sky-900/45 bg-gradient-to-b from-sky-950/20 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300">Rules / Automation</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Future behavior is defined here</h1>
        <p className="mt-2 text-sm text-gray-300">
          Archive executes now after approval. Keep, quarantine, unsubscribe, and custom rule are stored as explicit learned intents for future automation.
        </p>
      </section>
      {props.onAddIntent ? (
        <div className="flex flex-wrap gap-2">
          {intentOptions.map(([intent, label]) => (
            <button
              key={intent}
              type="button"
              onClick={() => props.onAddIntent?.(intent)}
              className="rounded-full border border-gray-700 bg-gray-950/55 px-3 py-1.5 text-xs text-gray-200 hover:border-sky-700/60"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {props.ruleIntents.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
            No explicit rule intents yet. Add one from your sender decisions to teach future behavior.
          </div>
        ) : (
          props.ruleIntents.map((intent) => (
            <div key={`${intent.sender_key}-${intent.intent_type}`} className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
              <p className="text-sm font-semibold text-white">{intent.label}</p>
              <p className="mt-1 text-xs text-gray-500">{intent.sender}</p>
              <p className="mt-3 text-sm text-gray-300">{intent.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function MonitoringRecommendationCard(props: {
  recommendation: GmailMonitoringSummaryData['recommendations'][number]
}) {
  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{props.recommendation.title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {props.recommendation.sender || props.recommendation.domain || 'Mailbox-level pattern'}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${policyClass(props.recommendation.recommended_policy)}`}>
          {props.recommendation.recommended_policy}
        </span>
      </div>
      <p className="mt-3 text-sm text-gray-300">{props.recommendation.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.recommendation.evidence.map((item) => (
          <span key={item} className="rounded-full border border-gray-800 bg-gray-950/70 px-2.5 py-1 text-[11px] text-gray-300">
            {item}
          </span>
        ))}
      </div>
    </article>
  )
}

export function MonitoringStage(props: {
  data: GmailMonitoringSummaryData | null
}) {
  if (!props.data) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Monitoring loads learned policies, memory-backed recommendations, and semantic Gmail matches after data arrives.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-fuchsia-900/45 bg-gradient-to-b from-fuchsia-950/20 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-300">Monitoring</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">User actions become memory, memory becomes recommendations</h1>
        <p className="mt-2 text-sm text-gray-300">
          Monitoring is the supervision layer for the Gmail agent. It reads event memory plus RAG memory and turns them into guided suggestions.
        </p>
      </section>
      <div className="grid gap-4 xl:grid-cols-3">
        {metricCard(
          'Learned policies',
          props.data.learned_policies.length.toLocaleString(),
          'Explicit sender decisions stored in the workspace memory layer.',
          'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Rule intents',
          props.data.rule_intents.length.toLocaleString(),
          'Future Gmail behaviors waiting for broader automation.',
          'border-sky-900/50 bg-gradient-to-b from-sky-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Recommendations',
          props.data.recommendations.length.toLocaleString(),
          'Suggestions generated from exact event memory and semantic Gmail memory.',
          'border-fuchsia-900/50 bg-gradient-to-b from-fuchsia-950/20 to-gray-950/40'
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">Learned sender policies</p>
          <div className="space-y-2">
            {props.data.learned_policies.map((policy) => (
              <div key={policy.sender_key} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{policy.sender}</p>
                    <p className="text-xs text-gray-500">
                      {policy.domain || 'No domain'} · {policy.event_count} learned events
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${policyClass(policy.policy)}`}>
                    {policy.policy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">Recommendation queue</p>
          <div className="space-y-3">
            {props.data.recommendations.map((recommendation) => (
              <MonitoringRecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">Semantic memory matches</p>
          <div className="space-y-2">
            {props.data.semantic_matches.map((match, index) => (
              <div key={`${match.source_url || 'match'}-${index}`} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <p className="text-sm text-white">
                  {match.sender || 'Mailbox memory'} · similarity {match.similarity.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-gray-500">{match.policy || 'No policy'}</p>
                <p className="mt-2 text-sm text-gray-300">{match.excerpt}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">Recent memory events</p>
          <div className="space-y-2">
            {props.data.recent_events.map((event) => (
              <div key={event.id} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <p className="text-sm text-white">{event.summary}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {event.event_type} · {formatDate(event.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
