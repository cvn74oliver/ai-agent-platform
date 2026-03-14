'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
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

export function CleanupGroupContributionCards(props: {
  groups: GmailMailboxIntelligenceData['cleanup_groups']
  buildClusterHref: (clusterId: string) => string
}) {
  return sectionCard(
    'Cleanup Groups',
    'Mailbox Intelligence should naturally hand off into the next sender group to review.',
    <div className="grid gap-3 xl:grid-cols-2">
      {props.groups.map((group) => (
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
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Messages</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {group.message_count.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Senders</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {group.sender_count.toLocaleString()}
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
    </div>
  )
}

export function MailboxIntelligenceDashboard(props: {
  data: GmailMailboxIntelligenceData
  buildClusterHref: (clusterId: string) => string
}) {
  const [filter, setFilter] = useState<'all' | 'cleanup' | 'protected' | 'human'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const filteredSenders = useMemo(() => {
    const rows = props.data.sender_ranking.filter((sender) => {
      if (filter === 'cleanup') return sender.cleanup_candidate_message_count > 0
      if (filter === 'protected') return sender.protected_message_count > 0
      if (filter === 'human') return sender.sender_signal === 'likely_human'
      return true
    })
    return rows
  }, [filter, props.data.sender_ranking])

  const totalPages = Math.max(1, Math.ceil(filteredSenders.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleSenders = filteredSenders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-3">
        {metricCard(
          'Whole mailbox',
          props.data.whole_mailbox.message_count.toLocaleString(),
          `${props.data.whole_mailbox.sender_count.toLocaleString()} senders across all indexed history.`,
          'border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Cleanup candidates',
          props.data.cleanup_candidate_universe.message_count.toLocaleString(),
          `${props.data.cleanup_candidate_universe.sender_count.toLocaleString()} senders fit the current cleanup groups.`,
          'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Protected / safe',
          props.data.protected_safe_context.protected_message_count.toLocaleString(),
          props.data.protected_safe_context.summary,
          'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
        )}
      </div>

      {sectionCard(
        'Analytics',
        'These views combine whole-mailbox context, cleanup-candidate context, and protected/safe context in one dashboard.',
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-200">Top cleanup senders</p>
            <div className="space-y-2">
              {props.data.cleanup_candidate_universe.top_senders.map((sender) => (
                <button
                  key={sender.sender_key}
                  type="button"
                  onClick={() => setFilter('cleanup')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950/55 px-3 py-2 text-left hover:border-cyan-700/60"
                >
                  <span className="text-sm text-white">{sender.sender}</span>
                  <span className="text-xs text-gray-300">
                    {sender.message_count.toLocaleString()} · {sender.share_pct}%
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-200">Sender volume distribution</p>
            <div className="space-y-2">
              {props.data.cleanup_candidate_universe.sender_volume_distribution.map((bucket) => (
                <button
                  key={bucket.label}
                  type="button"
                  onClick={() => setFilter('cleanup')}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950/55 px-3 py-2 text-left hover:border-cyan-700/60"
                >
                  <span className="text-sm text-white">{bucket.label}</span>
                  <span className="text-xs text-gray-300">
                    {bucket.sender_count.toLocaleString()} senders
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-200">Category breakdown</p>
            <div className="flex flex-wrap gap-2">
              {props.data.cleanup_candidate_universe.category_breakdown.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => setFilter('cleanup')}
                  className="rounded-full border border-gray-800 bg-gray-950/55 px-3 py-1.5 text-xs text-gray-200 hover:border-cyan-700/60"
                >
                  {category.label} · {category.count.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-200">Human vs automation</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {props.data.whole_mailbox.human_vs_automation.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => setFilter(entry.label === 'Human-like' ? 'human' : 'all')}
                  className="rounded-2xl border border-gray-800 bg-gray-950/55 p-3 text-left hover:border-cyan-700/60"
                >
                  <p className="text-xs text-gray-400">{entry.label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {entry.count.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <CleanupGroupContributionCards groups={props.data.cleanup_groups} buildClusterHref={props.buildClusterHref} />

      {sectionCard(
        'Sender ranking',
        'The table below keeps the hierarchy explicit: you are seeing senders, not every message at once.',
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'All senders'],
              ['cleanup', 'Cleanup candidates'],
              ['protected', 'Protected / safe'],
              ['human', 'Likely human'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilter(value as 'all' | 'cleanup' | 'protected' | 'human')
                  setPage(1)
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${stageTabClass(filter === value)}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-2">Sender</th>
                  <th className="pb-2">Whole mailbox</th>
                  <th className="pb-2">Cleanup candidates</th>
                  <th className="pb-2">Protected</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {visibleSenders.map((sender) => (
                  <tr key={sender.sender_key} className="border-t border-gray-900/80 text-gray-200">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{sender.sender}</p>
                      <p className="text-xs text-gray-500">{sender.sender_signal}</p>
                    </td>
                    <td className="py-3 pr-4">{sender.total_message_count.toLocaleString()}</td>
                    <td className="py-3 pr-4">{sender.cleanup_candidate_message_count.toLocaleString()}</td>
                    <td className="py-3 pr-4">{sender.protected_message_count.toLocaleString()}</td>
                    <td className="py-3 pr-4">{sender.category_summary}</td>
                    <td className="py-3">{formatDate(sender.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing {visibleSenders.length.toLocaleString()} senders from {filteredSenders.length.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-700 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-gray-700 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function StageNavigation(props: {
  currentStage: GmailCleanupStage
  buildStageHref: (stage: GmailCleanupStage) => string
}) {
  const stages: Array<{ stage: GmailCleanupStage; label: string }> = [
    { stage: 'senders', label: 'Sender Decisions' },
    { stage: 'exceptions', label: 'Exceptions / Verification' },
    { stage: 'confirmation', label: 'Confirmation' },
    { stage: 'rules', label: 'Rules / Automation' },
    { stage: 'monitoring', label: 'Monitoring' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((item) => (
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
}) {
  if (!props.open) return null
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3 space-y-2">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Message evidence for {props.sender}
      </p>
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
          <p className="mt-2 text-sm text-gray-300">{message.snippet || 'No snippet available.'}</p>
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
}) {
  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{props.sender.sender}</p>
          <p className="mt-1 text-xs text-gray-500">
            {props.sender.sender_signal} · {props.sender.category_summary}
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
      {props.sender.requires_verification ? (
        <div className="rounded-2xl border border-amber-800/50 bg-amber-950/15 p-3">
          <p className="text-xs font-medium text-amber-100">Needs verification</p>
          <p className="mt-1 text-sm text-amber-50">{props.sender.verification_reasons.join(' · ')}</p>
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
      />
    </article>
  )
}

export function SenderDecisionStage(props: {
  data: GmailSenderWorkspaceData
  policyBySender: Record<string, GmailSenderPolicy>
  openSenderKey: string | null
  onToggleSender: (senderKey: string) => void
  onPolicyChange: (senderKey: string, sender: string, policy: GmailSenderPolicy) => void
  onOpenMessage: (messageId: string) => void
  onPageChange: (page: number) => void
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Sender Decisions</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Review senders, not message batches</h1>
        <p className="mt-2 text-sm text-gray-300">
          Each card represents one sender in the selected cleanup group. Messages only appear as evidence inside the sender card.
        </p>
      </section>
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
}) {
  if (!props.preview) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Load Confirmation to compute exact message impact from the current sender decisions.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Confirmation</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Exact message impact is shown here</h1>
        <p className="mt-2 text-sm text-gray-300">
          Sender decisions stay sender-first until this point. Confirmation is where exact current-message impact becomes explicit.
        </p>
      </section>
      <div className="grid gap-3 xl:grid-cols-3">
        {metricCard(
          'Archive now',
          props.preview.exact_archive_impact.message_count.toLocaleString(),
          `${props.preview.exact_archive_impact.sender_count.toLocaleString()} senders will lose the INBOX label now.`,
          'border-amber-900/50 bg-gradient-to-b from-amber-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Protected exclusions',
          props.preview.protected_exclusions_count.toLocaleString(),
          'Messages kept out of archive because protection signals are still present.',
          'border-emerald-900/50 bg-gradient-to-b from-emerald-950/20 to-gray-950/40'
        )}
        {metricCard(
          'Undecided senders',
          props.preview.undecided_sender_count.toLocaleString(),
          'Resolve these before turning sender decisions into future automation rules.',
          'border-slate-800 bg-gradient-to-b from-slate-900/40 to-gray-950/40'
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">What changes now</p>
          <p className="text-sm text-gray-300">
            Archive removes the INBOX label from the exact matching messages above. Everything remains in All Mail.
          </p>
          <button
            type="button"
            onClick={() => void props.createArchiveApproval()}
            disabled={props.creatingApproval || props.preview.exact_archive_impact.message_count === 0}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {props.creatingApproval ? 'Creating approval…' : 'Create archive approval'}
          </button>
          {props.actionNote ? <p className="text-xs text-cyan-200">{props.actionNote}</p> : null}
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
          <p className="text-xs font-medium text-white">What becomes future behavior</p>
          <div className="space-y-2">
            {props.preview.future_behavior_summary.map((entry) => (
              <div key={entry.policy} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <p className="text-sm font-medium text-white">
                  {entry.policy} · {entry.sender_count.toLocaleString()} senders
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
        <p className="text-xs font-medium text-white">Decision groups</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {props.preview.groups.map((group) => (
            <div key={group.policy} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-sm font-semibold text-white">{group.label}</p>
              <p className="mt-1 text-xs text-gray-400">
                {group.sender_count.toLocaleString()} senders · {group.message_count.toLocaleString()} messages
              </p>
              <div className="mt-3 space-y-2">
                {group.senders.map((sender) => (
                  <div key={sender.sender_key} className="rounded-xl border border-gray-800 bg-gray-950/70 p-2">
                    <p className="text-sm text-white">{sender.sender}</p>
                    <p className="text-xs text-gray-500">{sender.message_count.toLocaleString()} messages</p>
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
