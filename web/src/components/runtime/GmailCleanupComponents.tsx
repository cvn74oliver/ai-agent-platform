'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type {
  GmailCleanupRuleIntent,
  GmailCleanupStage,
  GmailConfirmationPreviewData,
  GmailMailboxIntelligenceData,
  GmailMonitoringSummaryData,
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
    label: 'Loaded preview rows',
    reason: 'This is just the evidence slice currently on screen, not the action scope.',
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

export function GmailScopeLadder(props: {
  title: string
  subtitle: string
  counts: GmailScopeLadderCounts
}) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950/35 p-4 space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">{props.title}</p>
        <p className="mt-1 text-sm text-gray-300">{props.subtitle}</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {SCOPE_STEPS.map((step) => (
          <div key={step.key} className="rounded-2xl border border-gray-800 bg-gray-950/55 p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{step.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {props.counts[step.key].toLocaleString()}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-400">{step.reason}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function MailboxMissionPanel(props: {
  healthLabel: string
  pendingApprovals: number
  cleanupGroupCount: number
  cleanupSenderCount: number
  decidedSenderCount: number
  startedClusterCount: number
  nextCluster:
    | {
        clusterId: string
        title: string
        senderCount: number
        sharePct: number
      }
    | null
  resumeTask:
    | {
        title: string
        href: string
        stageLabel: string
      }
    | null
  buildClusterHref: (clusterId: string) => string
}) {
  const decidedPct =
    props.cleanupSenderCount > 0
      ? Math.min(100, Math.round((props.decidedSenderCount / props.cleanupSenderCount) * 100))
      : 0

  return (
    <section className="rounded-3xl border border-cyan-900/45 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,rgba(8,47,73,0.28),rgba(3,7,18,0.72))] p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Mission panel</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Sender-first inbox briefing</h2>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Lead with senders, not raw mailbox volume. The fastest path is to review the highest-impact sender group, keep protected senders visible, and approve finished archive-now work when it is ready.
          </p>
        </div>
        <div className="min-w-[220px] rounded-2xl border border-cyan-900/45 bg-gray-950/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Cleanup progress</p>
          <p className="mt-2 text-3xl font-semibold text-white">{decidedPct}%</p>
          <p className="mt-2 text-sm text-gray-300">
            {props.decidedSenderCount.toLocaleString()} of {props.cleanupSenderCount.toLocaleString()} cleanup senders have decisions in this browser session.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-900">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(6, decidedPct)}%` }} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard(
            'Cleanup senders',
            props.cleanupSenderCount.toLocaleString(),
            `${props.cleanupGroupCount.toLocaleString()} cleanup groups are ready for review.`,
            'border-cyan-900/50 bg-gray-950/40'
          )}
          {metricCard(
            'Pending approvals',
            props.pendingApprovals.toLocaleString(),
            'Archive remains the only live Gmail mutation in Phase 1.',
            'border-amber-900/50 bg-gray-950/40'
          )}
          {metricCard(
            'Health status',
            props.healthLabel,
            'Index freshness and sender intelligence are reused instead of recomputed during navigation.',
            'border-emerald-900/50 bg-gray-950/40'
          )}
          {metricCard(
            'Started clusters',
            props.startedClusterCount.toLocaleString(),
            'These are clusters with saved sender decisions in local workflow drafts.',
            'border-slate-800 bg-gray-950/40'
          )}
        </div>
        <div className="space-y-3">
          {props.resumeTask ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Resume previous task</p>
              <p className="mt-2 text-lg font-semibold text-white">{props.resumeTask.title}</p>
              <p className="mt-2 text-sm text-gray-300">Resume at {props.resumeTask.stageLabel}.</p>
              <Link
                href={props.resumeTask.href}
                className="mt-4 inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
              >
                Resume sender review
              </Link>
            </div>
          ) : null}
          {props.nextCluster ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Next recommended action</p>
              <p className="mt-2 text-lg font-semibold text-white">{props.nextCluster.title}</p>
              <p className="mt-2 text-sm text-gray-300">
                Review {props.nextCluster.senderCount.toLocaleString()} senders first. This cluster represents {props.nextCluster.sharePct}% of the current cleanup opportunity.
              </p>
              <Link
                href={props.buildClusterHref(props.nextCluster.clusterId)}
                className="mt-4 inline-flex rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
              >
                Open next cleanup group
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function CleanupGroupContributionCards(props: {
  groups: GmailMailboxIntelligenceData['cleanup_groups']
  buildClusterHref: (clusterId: string) => string
}) {
  const previewGroups = props.groups.slice(0, 3)
  return sectionCard(
    'Cleanup Groups Preview',
    'Mailbox Intelligence only previews the next sender clusters. Open Cleanup Groups for the full selection surface.',
    <div className="grid gap-3 xl:grid-cols-2">
      {previewGroups.map((group) => (
        <Link
          key={group.cluster_id}
          href={props.buildClusterHref(group.cluster_id)}
          className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4 hover:border-cyan-700/60 hover:bg-cyan-950/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{group.title}</p>
              <p className="mt-1 text-xs text-gray-400">{group.why_selected}</p>
            </div>
            <span className="rounded-full border border-gray-700 bg-gray-900/70 px-2 py-1 text-[11px] text-gray-200">
              {group.share_pct}% of candidates
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Senders</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {group.sender_count.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Messages</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {group.message_count.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <p className="text-xs text-gray-300">
              Safe / risky: {group.safety_note} {group.risk_note}
            </p>
            <p className="text-xs text-gray-500">
              Dominant sender: {group.dominant_sender || '—'} · dominant pattern:{' '}
              {group.dominant_pattern || '—'}
            </p>
          </div>
        </Link>
      ))}
      {props.groups.length > previewGroups.length ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 p-4">
          <p className="text-sm font-medium text-white">
            {props.groups.length - previewGroups.length} more cleanup groups are ready
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Use the Cleanup Groups page when you need the full sender-cluster list and selection controls.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function MailboxIntelligenceDashboard(props: {
  data: GmailMailboxIntelligenceData
  buildClusterHref: (clusterId: string) => string
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-3">
        {metricCard(
          'Cleanup senders',
          props.data.cleanup_candidate_universe.sender_count.toLocaleString(),
          `${props.data.cleanup_candidate_universe.message_count.toLocaleString()} supporting messages fit the current cleanup groups.`,
          'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Protected senders',
          props.data.protected_safe_context.protected_sender_count.toLocaleString(),
          `${props.data.protected_safe_context.protected_message_count.toLocaleString()} protected messages remain out of archive-now actions.`,
          'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Whole mailbox senders',
          props.data.whole_mailbox.sender_count.toLocaleString(),
          `${props.data.whole_mailbox.message_count.toLocaleString()} indexed messages across the current mailbox history window.`,
          'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
        )}
      </div>

      {sectionCard(
        'Mailbox context',
        'Mailbox Intelligence stays high-level in Phase 1: it explains coverage, safety context, and where to go next.',
        <div className="grid gap-3 xl:grid-cols-3">
          {metricCard(
            'Low-risk candidates',
            props.data.protected_safe_context.low_risk_candidate_message_count.toLocaleString(),
            'These candidate messages currently show no strong protection signals.',
            'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
          )}
          {metricCard(
            'Caution candidates',
            props.data.protected_safe_context.caution_candidate_message_count.toLocaleString(),
            'These candidate messages still show protection signals and should stay visible during sender review.',
            'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
          )}
          {metricCard(
            'Likely human senders',
            props.data.protected_safe_context.likely_human_sender_count.toLocaleString(),
            'These senders remain supporting context only. Detailed sender analytics now live in Sender Decisions.',
            'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
          )}
        </div>
      )}

      {sectionCard(
        'Human / automation context',
        'This stays as a high-level safety signal so Mailbox Intelligence does not become a second sender-review page.',
        <div className="grid gap-3 sm:grid-cols-3">
          {props.data.whole_mailbox.human_vs_automation.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4 text-left"
            >
              <p className="text-xs text-gray-400">{entry.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{entry.count.toLocaleString()}</p>
              <p className="mt-2 text-xs text-gray-500">Exactness: {entry.exactness}</p>
            </div>
          ))}
        </div>
      )}

      <CleanupGroupContributionCards groups={props.data.cleanup_groups} buildClusterHref={props.buildClusterHref} />
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
  open: boolean
  onToggleOpen: () => void
  onPolicyChange: (policy: GmailSenderPolicy) => void
  onOpenMessage: (messageId: string) => void
  snippetLoading?: boolean
}) {
  const classificationSummary =
    props.sender.sender_signal === 'likely_machine_generated'
      ? `Machine-like history ${formatPercent(props.sender.machine_probability)}`
      : props.sender.sender_signal === 'likely_human'
        ? `Human-like history ${formatPercent(props.sender.human_probability)}`
        : 'Mixed or uncertain sender behavior'

  const verificationSummary = props.sender.requires_verification
    ? `We pause this sender because ${props.sender.verification_reasons.join(', ').toLowerCase()}.`
    : 'No strong verification blockers are currently visible in the cached evidence.'

  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{props.sender.sender}</p>
          <p className="mt-1 text-xs text-gray-500">
            {(props.sender.sender_domain || 'Unknown domain')} · {props.sender.category_summary}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${policyClass(props.policy)}`}>
          {props.policy === 'undecided' ? 'No policy yet' : props.policy}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Group messages</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {props.sender.cleanup_group_message_count.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Total sender history</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {(props.sender.total_sender_messages || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/65 p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Unread</p>
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
          'Why it is here',
          props.sender.dominant_pattern,
          `${props.sender.cleanup_group_message_count.toLocaleString()} messages from this sender match the selected cleanup group.`
        )}
        {insightCard(
          'Classification',
          classificationSummary,
          props.sender.first_seen
            ? `First seen ${formatDate(props.sender.first_seen)} and last active ${formatDate(props.sender.last_activity)}.`
            : 'History is inferred from the current indexed sender record.'
        )}
        {insightCard(
          'Protection behavior',
          props.sender.protected_hint || 'No protected hint',
          verificationSummary
        )}
      </div>
      {props.sender.requires_verification ? (
        <div className="rounded-2xl border border-amber-800/50 bg-amber-950/15 p-3">
          <p className="text-xs font-medium text-amber-100">Needs verification</p>
          <p className="mt-1 text-sm text-amber-50">
            {props.sender.verification_reasons.join(' · ')}. Archive will still exclude protected evidence unless you explicitly include it later.
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

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current != null) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setSearchInputValue(props.data.view.search)
  }, [props.data.selected_cluster.cluster_id, props.data.view.search])

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
        <h1 className="mt-2 text-2xl font-semibold text-white">Review senders, not message batches</h1>
        <p className="mt-2 text-sm text-gray-300">
          Each card represents one sender in the selected cleanup group. Messages only appear as evidence inside the sender card.
        </p>
      </section>
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Draft decisions persist for this cleanup group during Phase 1, so you can leave and return later without losing current sender policies.
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
        'Sender-specific analytics now live here so chart clicks can drive the visible sender list without bouncing back to Mailbox Intelligence.',
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
            {HorizontalBarChart({
              title: 'Sender category distribution',
              accentClass: 'bg-emerald-500',
              activeLabel: activeInsight?.label,
              onItemClick: (item) => {
                setSearchInputValue(item.label)
                props.onSearchChange(item.label)
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list filtered toward senders whose category summary matches ${item.label}.`,
                })
              },
              items: props.data.analytics.sender_category_distribution.map((category) => ({
                label: category.label,
                value: category.sender_count,
              })),
            })}
            {TimelineChart({
              title: `Sender activity timeline (${props.data.analytics.sender_activity_timeline_granularity})`,
              accentClass: 'bg-fuchsia-500/80',
              onItemClick: (item) => {
                props.onSortChange('last_activity')
                props.onDirectionChange('desc')
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list reordered by recent activity after selecting ${item.label}.`,
                })
              },
              items: props.data.analytics.sender_activity_timeline.map((item) => ({
                label: item.label,
                count: item.sender_count,
              })),
            })}
            {HorizontalBarChart({
              title: 'Cluster contribution',
              accentClass: 'bg-cyan-500',
              activeLabel: activeInsight?.label,
              onItemClick: (item) => {
                setSearchInputValue(item.label)
                props.onSearchChange(item.label)
                props.onSortChange('message_count')
                props.onDirectionChange('desc')
                setActiveInsight({
                  label: item.label,
                  detail: `Sender list narrowed to ${item.label}, one of the largest contributors inside this cleanup group.`,
                })
              },
              items: props.data.analytics.cluster_contribution.map((sender) => ({
                label: sender.sender,
                value: sender.message_count,
                detail: `${sender.share_pct}% of cluster messages`,
              })),
            })}
          </div>
        </div>
      )}
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-4">
        <div className="grid gap-3 xl:grid-cols-3">
          {metricCard(
            'Selected group',
            props.data.selected_cluster.sender_count.toLocaleString(),
            `${props.data.selected_cluster.title} currently resolves to ${props.data.selected_cluster.message_count.toLocaleString()} candidate messages.`,
            'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
          )}
          {metricCard(
            'Filtered senders',
            props.data.pagination.total_senders.toLocaleString(),
            `${props.data.pagination.cluster_total_senders.toLocaleString()} total senders exist in this cleanup group before filters.`,
            'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
          )}
          {metricCard(
            'Needs verification',
            props.data.exceptions_count.toLocaleString(),
            'Verification is surfaced inline here during Phase 1, not in a separate review stage.',
            'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
          )}
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
          className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
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
  policyBySender: Record<string, GmailSenderPolicy>
  onPolicyChange: (senderKey: string, sender: string, policy: GmailSenderPolicy) => void
  onRemoveDecision: (senderKey: string, sender: string) => void
  onOpenSenderReview: (sender: string) => void
}) {
  if (!props.preview) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Load Confirmation to compute exact message impact from the current sender decisions.
      </div>
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
        <h1 className="mt-2 text-2xl font-semibold text-white">Review what archives now and what is only stored for later</h1>
        <p className="mt-2 text-sm text-gray-300">
          Archive is the only live Gmail action in Phase 1. Keep, quarantine, unsubscribe, and custom-rule decisions are stored as future intent only and do not execute in Gmail yet.
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
          <p className="text-xs font-medium text-white">What changes now</p>
          <p className="text-sm text-gray-300">
            After approval, Archive removes the INBOX label from the exact matching messages above. Everything remains in All Mail.
          </p>
          <p className="text-sm text-gray-300">
            Protected exclusions: {props.preview.protected_exclusions_count.toLocaleString()} messages remain out of archive because protection signals are still present.
          </p>
          <button
            type="button"
            onClick={() => void props.createArchiveApproval()}
            disabled={props.creatingApproval || props.preview.exact_archive_impact.message_count === 0}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {props.creatingApproval
              ? 'Creating approval…'
              : props.preview.undecided_sender_count > 0
                ? 'Approve archive-now decisions'
                : 'Create archive approval'}
          </button>
          {props.actionNote ? <p className="text-xs text-cyan-200">{props.actionNote}</p> : null}
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">What is stored for later</p>
          <div className="space-y-2">
            {props.preview.future_behavior_summary.map((entry) => (
              <div key={entry.policy} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <p className="text-sm font-medium text-white">
                  {entry.policy === 'keep'
                    ? 'Keep intent'
                    : entry.policy === 'quarantine'
                      ? 'Quarantine intent'
                      : entry.policy === 'unsubscribe'
                        ? 'Unsubscribe intent'
                        : 'Custom-rule intent'}{' '}
                  · {entry.sender_count.toLocaleString()} senders
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {entry.message_count.toLocaleString()} current messages · {entry.behavior}
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
                  <p className="text-sm font-semibold text-white">{group.label}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {group.policy === 'archive'
                      ? 'Executes now after approval'
                      : group.policy === 'undecided'
                        ? 'No action yet; sender stays untouched'
                        : 'Stored for later in Phase 1; no Gmail change executes now'}
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
