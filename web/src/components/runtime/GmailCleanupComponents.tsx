'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
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
    : 'border-gray-800 bg-gray-950/35 text-gray-300 hover:border-gray-700 hover:text-white'
}

function metricCard(title: string, value: string, subtitle: string, accent: string) {
  return (
    <div className={`rounded-2xl border ${accent} p-4`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
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
    <div className={`rounded-2xl border ${props.accentClass} p-4`}>
      <p
        className={`text-center text-[10px] uppercase tracking-[0.22em] ${
          props.titleClass || 'text-gray-500'
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
      <p className="mt-3 text-center text-sm leading-5 text-gray-300">{props.subtitle}</p>
    </div>
  )
}

function sectionCard(title: string, subtitle: string, children: ReactNode) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{title}</p>
        <p className="mt-1 text-sm text-gray-300">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function insightCard(title: string, value: string, subtitle: string) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">{subtitle}</p>
    </div>
  )
}

function diagnosticRow(label: string, value: string, detail?: string) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-gray-400">{detail}</p> : null}
    </div>
  )
}

function loadingSkeleton(className: string) {
  return <div className={`animate-pulse rounded-xl bg-gray-800/70 ${className}`} />
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
    <section className="grid gap-3 xl:grid-cols-4">
      {metricMeterCard({
        title: 'Indexed senders',
        value: props.totalSenderCount.toLocaleString(),
        subtitle: 'Total sender universe in scope for cleanup decisions.',
        accentClass: 'border-gray-800 bg-gray-950/45',
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
    actionLabel: props.approvalHref ? 'Open Confirmation' : null,
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
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
          Management signals
        </p>
        <p className="text-xs text-gray-500">
          Execution friction and downstream state that materially affects inbox health
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-gray-800/80 bg-gray-950/45 xl:flex xl:items-stretch">
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
        <div className="min-h-0 bg-white/[0.025] xl:flex-[0.95] xl:self-stretch">
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
      badgeClass: 'border-gray-700 bg-gray-950/30 text-gray-200',
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

function HorizontalBarChart(props: {
  title: string
  items: Array<{ label: string; value: number; detail?: string }>
  accentClass: string
  activeLabel?: string | null
  onItemClick?: (item: { label: string; value: number; detail?: string }) => void
}) {
  const max = maxChartValue(props.items.map((item) => item.value))

  return sectionCard(
    props.title,
    'Live cached intelligence rendered as fast visual context instead of long text-only lists.',
    <div className="space-y-3">
      {props.items.map((item) => {
        const active = props.activeLabel === item.label
        const row = (
          <div
            className={`space-y-1.5 rounded-xl px-2 py-1 ${
              active ? 'bg-cyan-950/20 ring-1 ring-cyan-700/40' : ''
            }`}
          >
          <div className="flex items-center justify-between gap-3 text-xs text-gray-300">
            <span>{item.label}</span>
            <span>
              {item.value.toLocaleString()}
              {item.detail ? ` · ${item.detail}` : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-900">
            <div
              className={`h-full rounded-full ${props.accentClass}`}
              style={{ width: `${Math.max(8, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
          </div>
        )

        if (!props.onItemClick) {
          return <div key={item.label}>{row}</div>
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => props.onItemClick?.(item)}
            className="block w-full rounded-xl text-left hover:bg-gray-950/40"
          >
            {row}
          </button>
        )
      })}
    </div>
  )
}

function TimelineChart(props: {
  title: string
  items: Array<{ label: string; count: number }>
  accentClass: string
  onItemClick?: (item: { label: string; count: number }) => void
}) {
  const max = maxChartValue(props.items.map((item) => item.count))
  const peak = props.items
    .slice()
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))[0]
  const latest = props.items[props.items.length - 1]

  return sectionCard(
    props.title,
    'Activity stays sender-first, but the timeline shows how much of the cleanup universe is recent versus historical.',
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {insightCard(
          'Peak period',
          peak ? `${peak.label} · ${peak.count.toLocaleString()}` : '—',
          'This is the heaviest recent activity window in the cached cleanup sender universe.'
        )}
        {insightCard(
          'Latest period',
          latest ? `${latest.label} · ${latest.count.toLocaleString()}` : '—',
          'Click any period below to sort the sender table toward recent activity.'
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {props.items.map((item) => {
          const chartCard = (
            <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
              <div className="flex h-24 items-end">
                <div
                  className={`w-full rounded-t-xl ${props.accentClass}`}
                  style={{ height: `${Math.max(12, Math.round((item.count / max) * 100))}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-400">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-white">{item.count.toLocaleString()}</p>
            </div>
          )

          if (!props.onItemClick) {
            return <div key={item.label}>{chartCard}</div>
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => props.onItemClick?.(item)}
              className="block w-full rounded-2xl text-left hover:bg-gray-950/35"
            >
              {chartCard}
            </button>
          )
        })}
      </div>
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
          : 'border-gray-700 bg-gray-950/30 text-gray-300'
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
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{props.title}</p>
              <span className="rounded-full border border-gray-800 bg-gray-950/45 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-300">
                {props.activeRangeLabel || 'Active chart range'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {windowOptions.map((option) => {
                const active = props.activeWindow === option.key
                const className = active
                  ? 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
                  : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700 hover:text-white'
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
          <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3">
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
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
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
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
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
                  className="rounded-xl border border-gray-700 bg-gray-950/40 px-4 py-2 text-sm text-gray-300 hover:border-gray-600 hover:text-white"
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
      <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3">
        {props.loading ? (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-950/45 px-6 text-center">
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
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-950/45 px-6 text-center">
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

export function GmailScopeLadder(props: {
  title: string
  subtitle: string
  counts: GmailScopeLadderCounts
  hiddenKeys?: Array<keyof GmailScopeLadderCounts>
}) {
  const hiddenKeys = new Set(props.hiddenKeys || [])
  const visibleSteps = SCOPE_STEPS.filter((step) => !hiddenKeys.has(step.key))

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950/35 p-4 space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{props.title}</p>
        <p className="mt-1 text-sm text-gray-300">{props.subtitle}</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {visibleSteps.map((step) => {
          const isEvidenceStep = step.key === 'loaded_preview_rows'
          return (
          <div
            key={step.key}
            className={`rounded-2xl border p-3 ${
              isEvidenceStep
                ? 'border-dashed border-gray-800 bg-gray-950/35'
                : 'border-gray-800 bg-gray-950/55'
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{step.label}</p>
            <p className={`mt-2 font-semibold text-white ${isEvidenceStep ? 'text-xl' : 'text-2xl'}`}>
              {props.counts[step.key].toLocaleString()}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-400">{step.reason}</p>
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
          <div className="rounded-2xl border border-emerald-700/30 bg-gray-950/50 px-4 py-3 text-right">
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

      <div className="rounded-3xl border border-gray-800 bg-gray-950/55 p-5 space-y-5">
        <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Inbox health</p>
              <p className={`mt-3 text-6xl font-semibold ${scoreMeta.scoreClass}`}>
                {boundedScore}
                <span className="ml-2 text-xl font-medium text-gray-400">/ 100</span>
              </p>
            </div>
            <div className="min-h-[132px] rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
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
              className="block w-full rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-left"
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

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onMouseEnter={() => setHoveredSection('driver')}
                onFocus={() => setHoveredSection('driver')}
                onMouseLeave={() => setHoveredSection(null)}
                onBlur={() => setHoveredSection(null)}
                className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-left"
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
                className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-left"
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
                className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-left"
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
      ? 'Open Confirmation'
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
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mission briefing</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <div className="rounded-2xl border border-cyan-900/35 bg-gray-950/45 p-4">
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
      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
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
            <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
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
              : 'border-gray-800 bg-gray-950/55'
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
              Open Confirmation
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
        <section className="grid gap-3 xl:grid-cols-4">
          {[
            'Indexed senders',
            'Supporting messages',
            'Senders in review',
            'Senders already decided',
          ].map((label) => (
            <div key={label} className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{label}</p>
              {loadingSkeleton('mt-3 h-8 w-24')}
              {loadingSkeleton('mt-3 h-2.5 w-full')}
              {loadingSkeleton('mt-2 h-3 w-5/6')}
            </div>
          ))}
        </section>
        <div className="rounded-3xl border border-gray-800 bg-gray-950/45 p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Inbox health rail</p>
              {loadingSkeleton('mt-3 h-14 w-36')}
            </div>
            <div className="flex flex-wrap gap-2">
              {['Critical', 'Degraded', 'Warning', 'Stable', 'Healthy'].map((band) => (
                <span
                  key={band}
                  className="rounded-full border border-gray-700 bg-gray-950/60 px-2.5 py-1 text-[11px] text-gray-400"
                >
                  {band}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-800">
            <div className="grid h-6 grid-cols-12 gap-px bg-gray-900/50 px-px py-px">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full ${index < 4 ? 'bg-emerald-400/70' : 'bg-gray-800'}`}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
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
          <div className="flex h-48 items-end gap-2 rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
            {['h-10', 'h-14', 'h-[4.5rem]', 'h-24', 'h-20', 'h-12'].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col justify-end gap-2">
                {loadingSkeleton(`${height} w-full`)}
                {loadingSkeleton('h-3 w-full')}
              </div>
            ))}
          </div>
          <div className="grid gap-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-gray-800 bg-gray-950/55 p-3">
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
}) {
  const rankedGroups = props.groups
    .slice()
    .sort(
      (left, right) =>
        right.sender_count - left.sender_count ||
        right.message_count - left.message_count ||
        left.title.localeCompare(right.title)
    )
    .slice(0, 3)
  const recommendedGroup = rankedGroups[0] || null
  const alternateGroup = rankedGroups[1] || null
  return sectionCard(
    'Cleanup Groups Handoff',
    'Mailbox Intelligence should hand off one clear next group, not recreate the full Cleanup Groups surface.',
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      {recommendedGroup ? (
        <Link
          href={props.buildClusterHref(recommendedGroup.cluster_id)}
          className="rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-4 hover:border-cyan-700/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Recommended next group</p>
              <p className="mt-1 text-lg font-semibold text-white">{recommendedGroup.title}</p>
            </div>
            <span className="rounded-full border border-cyan-700/45 bg-cyan-950/20 px-2.5 py-1 text-[11px] text-cyan-100">
              {recommendedGroup.share_pct}% of cleanup candidates
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-300">
            {recommendedGroup.why_selected ||
              `${recommendedGroup.sender_count.toLocaleString()} senders generate the strongest recurring inbox noise in the current cleanup opportunity.`}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {diagnosticRow(
              'Sender scope',
              `${recommendedGroup.sender_count.toLocaleString()} senders`,
              'Primary decision scope for the next review pass.'
            )}
            {diagnosticRow(
              'Expected payoff',
              `~${recommendedGroup.message_count.toLocaleString()} supporting messages`,
              'Supporting message context explains the likely payoff; the decision object is still the sender.'
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Why this is next</p>
            <p className="mt-1 text-sm font-semibold text-white">
              Open this group first to act on the biggest remaining sender opportunity before smaller clusters dilute attention.
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Safety context: {recommendedGroup.safety_note} {recommendedGroup.risk_note}
            </p>
          </div>
          <span className="mt-4 inline-flex rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200">
            Open in Cleanup Groups
          </span>
        </Link>
      ) : null}
      <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Bridge into Cleanup Groups</p>
        <div className="mt-3 grid gap-3">
          {diagnosticRow(
            'Open next',
            recommendedGroup ? recommendedGroup.title : 'No recommended group yet',
            recommendedGroup
              ? `${recommendedGroup.sender_count.toLocaleString()} cleanup-ready senders are the biggest remaining opportunity in the current snapshot.`
              : 'Refresh cleanup analysis to generate the next sender group recommendation.'
          )}
          {diagnosticRow(
            'Alternate after that',
            alternateGroup ? alternateGroup.title : 'No alternate group yet',
            alternateGroup
              ? `${alternateGroup.sender_count.toLocaleString()} senders and ~${alternateGroup.message_count.toLocaleString()} supporting messages are next after the primary handoff.`
              : 'No second-ranked group is available in the current snapshot.'
          )}
          {diagnosticRow(
            'What changes after you click through',
            'You move from command guidance to full group selection',
            'Cleanup Groups owns the full comparison surface. Mailbox Intelligence only hands off the clearest next bridge.'
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
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">
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
          className="block w-full rounded-xl border border-gray-800 bg-gray-950/70 p-3 text-left hover:border-cyan-700/60"
        >
          <p className="text-sm font-medium text-white">{message.subject || '(no subject)'}</p>
          <p className="mt-1 text-xs text-gray-500">
            {formatDate(message.date)} · {(message.category_labels || []).join(', ') || 'No category'}
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-300">
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

  const senderBadges = [
    props.sender.category_summary,
    props.sender.sender_signal === 'likely_machine_generated'
      ? 'Likely automated'
      : props.sender.sender_signal === 'likely_human'
        ? 'Likely human'
        : 'Mixed signal',
    props.sender.protected_hint ? 'Protected signals' : null,
    props.sender.requires_verification ? 'Needs verification' : null,
  ].filter(Boolean) as string[]
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

  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{props.sender.sender}</p>
          <p className="mt-1 text-xs text-gray-500">
            {(props.sender.sender_domain || 'Unknown domain')} · {props.sender.category_summary}
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
            className="rounded-full border border-gray-800 bg-gray-950/65 px-2.5 py-1 text-[11px] text-gray-300"
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Messages in this group</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {props.sender.cleanup_group_message_count.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">All indexed history</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {(props.sender.total_sender_messages || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Unread now</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {props.sender.unread_count.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Last activity</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatDate(props.sender.last_activity)}</p>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        {insightCard(
          'Why this sender is in scope',
          props.sender.dominant_pattern,
          `${props.sender.cleanup_group_message_count.toLocaleString()} messages from this sender match the selected cleanup group.`
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
          {props.data.selected_cluster.why_selected}
        </p>
        <p className="mt-2 text-sm text-gray-300">
          This is the drill-down workspace for Phase 1. Review senders, use analytics to focus the list, and open messages only when you need evidence.
        </p>
      </section>
      {sectionCard(
        'Cluster brief',
        'Start with the sender set itself: why it surfaced, what to watch, and how much of the cleanup mission is already decided.',
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
              'Why this group surfaced',
              props.data.selected_cluster.why_selected,
              `${props.data.selected_cluster.share_pct}% of the cleanup candidate universe currently sits in this sender group.`
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
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
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
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Sender list controls</p>
            <p className="mt-2 text-sm text-gray-300">
              Showing {props.data.pagination.total_senders.toLocaleString()} senders from{' '}
              {props.data.pagination.cluster_total_senders.toLocaleString()} in this cleanup group.
              Messages stay secondary evidence only.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-950/55 px-3 py-2 text-xs text-gray-300">
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
              className="w-full rounded-2xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-700/60"
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
              className="w-full rounded-2xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60"
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
              className="w-full rounded-2xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60"
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
              className="w-full rounded-2xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-700/60"
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
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
          No senders match the current search and filter controls.
        </section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {props.data.senders.map((sender) => (
          <SenderCard
            key={sender.sender_key}
            sender={sender}
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
