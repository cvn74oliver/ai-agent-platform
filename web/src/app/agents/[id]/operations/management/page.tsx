'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  clearSenderFromGmailCleanupWorkflowDrafts,
  fetchGmailDecisionManagementSummary,
  persistGmailCleanupMemoryEvent,
  type GmailDecisionManagementSummaryData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  normalizeOperationsAnalysisScope,
  serializeOperationsQuery,
} from '@/lib/runtime/operationsWorkspace'

type LoadState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'ready'; data: GmailDecisionManagementSummaryData; error: null }
  | { status: 'error'; data: null; error: string }

type DestinationSummary = GmailDecisionManagementSummaryData['destination_summaries'][number]
type SenderProfile = GmailDecisionManagementSummaryData['sender_profiles'][number]

function destinationCardTone(state: GmailDecisionManagementSummaryData['destination_summaries'][number]['state']) {
  if (state === 'KEEP') return 'border-emerald-900/45 bg-emerald-950/15 text-emerald-100'
  if (state === 'ARCHIVE') return 'border-cyan-900/45 bg-cyan-950/15 text-cyan-100'
  if (state === 'QUARANTINE') return 'border-amber-900/45 bg-amber-950/15 text-amber-100'
  if (state === 'UNSUBSCRIBE') return 'border-fuchsia-900/45 bg-fuchsia-950/15 text-fuchsia-100'
  return 'border-violet-900/45 bg-violet-950/15 text-violet-100'
}

function executionTone(state: GmailDecisionManagementSummaryData['sender_profiles'][number]['execution_state']) {
  if (state === 'succeeded') return 'border-emerald-700/60 bg-emerald-950/25 text-emerald-100'
  if (state === 'failed') return 'border-rose-700/60 bg-rose-950/25 text-rose-100'
  if (state === 'deferred') return 'border-amber-700/60 bg-amber-950/25 text-amber-100'
  if (state === 'pending') return 'border-cyan-700/60 bg-cyan-950/25 text-cyan-100'
  return 'border-gray-700 bg-gray-950/50 text-gray-200'
}

function executionLabel(state: GmailDecisionManagementSummaryData['sender_profiles'][number]['execution_state']) {
  if (state === 'not_applicable') return 'Not applicable'
  if (state === 'pending') return 'Pending'
  if (state === 'succeeded') return 'Succeeded'
  if (state === 'failed') return 'Failed'
  return 'Deferred'
}

function archiveExecutionSummary(
  profile: GmailDecisionManagementSummaryData['sender_profiles'][number]
) {
  if (profile.execution_state === 'succeeded') {
    return 'Archive execution was confirmed against Gmail Inbox state.'
  }
  if (profile.execution_state === 'pending') {
    return 'Archive execution has been committed and is waiting for verification.'
  }
  if (profile.execution_state === 'failed') {
    return 'Archive execution did not complete successfully and needs intervention.'
  }
  if (profile.execution_state === 'deferred') {
    return 'Archive execution was requested, but Inbox removal is not fully confirmed yet.'
  }
  return 'No Inbox-visible archive execution was required for this sender.'
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'No recorded change yet'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value
  return new Date(parsed).toLocaleString()
}

function titleForDestinationState(state: DestinationSummary['state']): string {
  if (state === 'KEEP') return 'Keep'
  if (state === 'ARCHIVE') return 'Archive'
  if (state === 'QUARANTINE') return 'Quarantine'
  if (state === 'UNSUBSCRIBE') return 'Unsubscribe'
  return 'Custom Rule'
}

function destinationBucketContext(summary: DestinationSummary, profiles: SenderProfile[]): string {
  const succeeded = profiles.filter((profile) => profile.execution_state === 'succeeded').length
  const deferred = profiles.filter((profile) => profile.execution_state === 'deferred').length
  const pending = profiles.filter((profile) => profile.execution_state === 'pending').length
  const failed = profiles.filter((profile) => profile.execution_state === 'failed').length

  if (summary.state === 'ARCHIVE') {
    if (failed > 0) {
      return `${failed.toLocaleString()} archive destinations need manual follow-up.`
    }
    if (deferred + pending > 0) {
      return `${(deferred + pending).toLocaleString()} archive destinations are still waiting on verified Inbox removal.`
    }
    if (succeeded > 0) {
      return `${succeeded.toLocaleString()} archive destinations have verified Gmail execution.`
    }
    return 'Archive destinations are ready for verified execution tracking.'
  }

  if (summary.state === 'KEEP') {
    return 'Keep is a stored sender preference in Phase 1, so Gmail execution is intentionally not applicable.'
  }
  if (summary.state === 'QUARANTINE') {
    return 'Quarantine stays as a stored caution state for now while downstream execution remains deferred.'
  }
  if (summary.state === 'UNSUBSCRIBE') {
    return 'Unsubscribe stays as committed intent until the unsubscribe executor arrives in a later phase.'
  }
  return 'Custom Rule holds sender-specific intent until rule authoring and automation arrive in a later phase.'
}

function managementPriority(profile: SenderProfile): number {
  if (profile.execution_state === 'failed') return 0
  if (profile.execution_state === 'deferred') return 1
  if (profile.execution_state === 'pending') return 2
  if (profile.destination_state === 'CUSTOM_RULE') return 3
  if (profile.destination_state === 'UNSUBSCRIBE') return 4
  if (profile.destination_state === 'QUARANTINE') return 5
  if (profile.execution_state === 'succeeded') return 6
  return 7
}

function managementPriorityLabel(profile: SenderProfile): string {
  if (profile.execution_state === 'failed') return 'Needs attention'
  if (profile.execution_state === 'deferred') return 'Follow up'
  if (profile.execution_state === 'pending') return 'In progress'
  if (profile.destination_state === 'CUSTOM_RULE') return 'Future rule work'
  if (profile.destination_state === 'UNSUBSCRIBE') return 'Future unsubscribe work'
  if (profile.destination_state === 'QUARANTINE') return 'Future quarantine work'
  if (profile.execution_state === 'succeeded') return 'Executed'
  return 'Managed'
}

function loadingSkeleton(className: string) {
  return <div className={`animate-pulse rounded-2xl bg-gray-800/70 ${className}`} />
}

export default function OperationsDecisionManagementPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const query = serializeOperationsQuery(
    searchParams.get('playground_session_id'),
    normalizeOperationsAnalysisScope(searchParams.get('analysis_scope'))
  )
  const [state, setState] = useState<LoadState>({ status: 'loading', data: null, error: null })
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [clearingSenderKey, setClearingSenderKey] = useState<string | null>(null)
  const [restoringSenderKey, setRestoringSenderKey] = useState<string | null>(null)

  useEffect(() => {
    if (!agentId) return
    let cancelled = false
    void fetchGmailDecisionManagementSummary({ agentId }).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setState({ status: 'error', data: null, error: result.error })
        return
      }
      setState({ status: 'ready', data: result.data, error: null })
    })
    return () => {
      cancelled = true
    }
  }, [agentId])

  const reload = async () => {
    const result = await fetchGmailDecisionManagementSummary({ agentId })
    if (!result.ok) {
      setState({ status: 'error', data: null, error: result.error })
      return
    }
    setState({ status: 'ready', data: result.data, error: null })
  }

  const clearDestinationState = async (senderKey: string, sender: string) => {
    setClearingSenderKey(senderKey)
    setActionNote(null)
    try {
      const result = await persistGmailCleanupMemoryEvent({
        agentId,
        sessionId: searchParams.get('playground_session_id'),
        cluster: null,
        action: {
          type: 'destination_state_clear',
          senderKey,
          sender,
          reason:
            'Destination state was cleared from the management scaffold so the sender can be reviewed again.',
        },
      })
      if (!result.ok) {
        setActionNote(result.error)
        return
      }
      clearSenderFromGmailCleanupWorkflowDrafts({
        agentId,
        senderKey,
        sessionId: searchParams.get('playground_session_id'),
      })
      setActionNote(`${sender} was removed from the active destination layer. Any external Gmail reversal still requires a future restore surface.`)
      await reload()
    } finally {
      setClearingSenderKey(null)
    }
  }

  const restoreArchiveDestination = async (senderKey: string, sender: string) => {
    setRestoringSenderKey(senderKey)
    setActionNote(null)
    try {
      const res = await fetch('/api/runtime/gmail-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_archive',
          agentId,
          sessionId: searchParams.get('playground_session_id'),
          senderKey,
          sender,
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            data?: {
              sender_key: string
              sender: string
              restore_execution: {
                status: 'pending' | 'succeeded' | 'failed' | 'deferred' | 'not_applicable'
                message_count: number
                warning?: string | null
                cleared_destination_state: boolean
              }
            }
          }
        | null

      if (!res.ok || !payload?.ok || !payload.data) {
        setActionNote(payload?.error || 'Failed to restore Inbox state for this archive sender.')
        return
      }

      const restore = payload.data.restore_execution
      if (restore.status === 'succeeded' && restore.cleared_destination_state) {
        clearSenderFromGmailCleanupWorkflowDrafts({
          agentId,
          senderKey,
          sessionId: searchParams.get('playground_session_id'),
        })
        setActionNote(
          `${sender} was restored to Inbox for ~${restore.message_count.toLocaleString()} messages and removed from the active archive destination layer.`
        )
      } else if (restore.status === 'failed') {
        setActionNote(
          `${sender} restore needs attention: ${restore.warning || 'Inbox restore could not be completed.'}`
        )
      } else {
        setActionNote(
          `${sender} restore is still in follow-up: ${restore.warning || 'Inbox restore could not be fully confirmed yet.'}`
        )
      }
      await reload()
    } finally {
      setRestoringSenderKey(null)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="space-y-4">
        <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
              Decision Management Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-white">Loading committed sender states…</h1>
            <p className="max-w-3xl text-sm text-gray-300">
              Preparing destination buckets, execution truth, and the current sender management layer.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            {loadingSkeleton('h-56')}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {loadingSkeleton('h-28')}
              {loadingSkeleton('h-28')}
            </div>
          </div>
        </section>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-800 bg-gray-950/35 p-4">
              {loadingSkeleton('h-24')}
            </div>
          ))}
        </section>
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-3">
            {loadingSkeleton('h-8 w-48')}
            {loadingSkeleton('h-28')}
            {loadingSkeleton('h-28')}
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-3">
            {loadingSkeleton('h-8 w-56')}
            {loadingSkeleton('h-24')}
            {loadingSkeleton('h-24')}
          </div>
        </section>
      </div>
    )
  }

  if (state.status === 'error' || !state.data) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-5 text-sm text-rose-100">
        {state.error || 'Failed to load Decision Management.'}
      </section>
    )
  }

  const archiveExecutionAttentionProfiles = state.data.sender_profiles.filter(
    (profile) =>
      profile.destination_state === 'ARCHIVE' &&
      (profile.execution_state === 'failed' ||
        profile.execution_state === 'deferred' ||
        profile.execution_state === 'pending')
  )
  const senderProfiles = state.data.sender_profiles
  const executionCounts = senderProfiles.reduce(
    (counts, profile) => {
      counts[profile.execution_state] += 1
      return counts
    },
    {
      not_applicable: 0,
      pending: 0,
      succeeded: 0,
      failed: 0,
      deferred: 0,
    } as Record<SenderProfile['execution_state'], number>
  )
  const largestBucket =
    state.data.destination_summaries
      .slice()
      .sort((left, right) => right.sender_count - left.sender_count)[0] || null
  const futureIntentProfiles = senderProfiles.filter((profile) =>
    profile.destination_state === 'QUARANTINE' ||
    profile.destination_state === 'UNSUBSCRIBE' ||
    profile.destination_state === 'CUSTOM_RULE'
  )
  const restoreReadyCount = senderProfiles.filter(
    (profile) => profile.destination_state === 'ARCHIVE' && profile.execution_state === 'succeeded'
  ).length
  const managedProfiles = senderProfiles
    .slice()
    .sort((left, right) => {
      const priorityDelta = managementPriority(left) - managementPriority(right)
      if (priorityDelta !== 0) return priorityDelta
      return Date.parse(right.last_action_timestamp) - Date.parse(left.last_action_timestamp)
    })
  const bucketProfiles = new Map<DestinationSummary['state'], SenderProfile[]>()
  for (const summary of state.data.destination_summaries) {
    bucketProfiles.set(summary.state, [])
  }
  for (const profile of senderProfiles) {
    bucketProfiles.set(profile.destination_state, [
      ...(bucketProfiles.get(profile.destination_state) || []),
      profile,
    ])
  }

  const nextAction = (() => {
    if (archiveExecutionAttentionProfiles.length > 0) {
      const failedCount = archiveExecutionAttentionProfiles.filter(
        (profile) => profile.execution_state === 'failed'
      ).length
      return {
        title:
          failedCount > 0
            ? 'Resolve archive execution warnings'
            : 'Follow up deferred archive execution',
        detail:
          failedCount > 0
            ? `${failedCount.toLocaleString()} archive destinations need intervention before this layer can be treated as fully executed.`
            : `${archiveExecutionAttentionProfiles.length.toLocaleString()} archive destinations still need execution confirmation or follow-up.`,
        payoff:
          'Closing these gaps makes the post-confirmation layer trustworthy and easier to manage later.',
      }
    }
    if (futureIntentProfiles.length > 0) {
      return {
        title: 'Review stored future-intent destinations',
        detail: `${futureIntentProfiles.length.toLocaleString()} senders are managed as quarantine, unsubscribe, or custom-rule intent until later-phase execution arrives.`,
        payoff:
          'You can keep using this dashboard as the source of truth without losing where those senders should go next.',
      }
    }
    if (largestBucket && largestBucket.sender_count > 0) {
      return {
        title: `Keep an eye on ${largestBucket.label.toLowerCase()}`,
        detail: `${largestBucket.sender_count.toLocaleString()} managed senders currently live in the largest destination bucket.`,
        payoff: 'This gives you the clearest view of where committed sender state is accumulating.',
      }
    }
    return {
      title: 'Approve the first confirmation set',
      detail:
        'No destination states have been committed yet, so this dashboard will fill in as soon as approved senders land here.',
      payoff: 'The management layer becomes the durable home for committed sender states and later adjustments.',
    }
  })()

  const attentionCards = (() => {
    const cards: Array<{
      title: string
      tone: string
      value: string
      detail: string
      senders: string[]
    }> = []

    if (archiveExecutionAttentionProfiles.length > 0) {
      cards.push({
        title: 'Archive follow-up',
        tone: 'border-amber-900/45 bg-amber-950/12 text-amber-100',
        value: `${archiveExecutionAttentionProfiles.length.toLocaleString()} senders`,
        detail:
          'These archive destinations are still pending, deferred, or failed. Review warnings here before treating the state as fully executed.',
        senders: archiveExecutionAttentionProfiles.slice(0, 3).map((profile) => profile.sender),
      })
    } else {
      cards.push({
        title: 'Archive follow-up',
        tone: 'border-emerald-900/45 bg-emerald-950/12 text-emerald-100',
        value: 'No urgent blockers',
        detail:
          'Archive destinations are either verified, not applicable, or absent right now.',
        senders: [],
      })
    }

    if (restoreReadyCount > 0) {
      cards.push({
        title: 'Restore-ready archive states',
        tone: 'border-cyan-900/45 bg-cyan-950/12 text-cyan-100',
        value: `${restoreReadyCount.toLocaleString()} senders`,
        detail:
          'These archive destinations were verified and can be restored from this dashboard if the operator changes course.',
        senders: managedProfiles
          .filter(
            (profile) =>
              profile.destination_state === 'ARCHIVE' && profile.execution_state === 'succeeded'
          )
          .slice(0, 3)
          .map((profile) => profile.sender),
      })
    } else {
      cards.push({
        title: 'Restore-ready archive states',
        tone: 'border-gray-800 bg-gray-950/35 text-gray-200',
        value: 'None yet',
        detail:
          'Verified archive destinations will surface here once there is real Inbox state to restore.',
        senders: [],
      })
    }

    cards.push({
      title: 'Future-intent destinations',
      tone: 'border-fuchsia-900/45 bg-fuchsia-950/12 text-fuchsia-100',
      value: `${futureIntentProfiles.length.toLocaleString()} senders`,
      detail:
        'Custom Rule, Unsubscribe, and Quarantine stay visible here as committed intent until later-phase executors arrive.',
      senders: futureIntentProfiles.slice(0, 3).map((profile) => profile.sender),
    })

    return cards
  })()

  return (
    <div className="space-y-4">
      <header className="app-page-header app-page-header-hero rounded-3xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/30 to-gray-950/45 p-5 space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="max-w-3xl space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                Decision Management Dashboard
              </p>
              <h1 className="text-2xl font-semibold text-white">
                Post-confirmation home for committed sender states
              </h1>
              <p className="text-sm text-gray-300">
                See what is already managed, what still needs attention, what actually executed, and
                where follow-up belongs next.
              </p>
            </div>
            <div className="grid gap-3 xl:grid-cols-[0.82fr_0.82fr_1.36fr]">
              <article className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Current posture
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {senderProfiles.length > 0
                    ? `${senderProfiles.length.toLocaleString()} senders are now under destination management`
                    : 'No senders are managed yet'}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {largestBucket && largestBucket.sender_count > 0
                    ? `${titleForDestinationState(largestBucket.state)} is the largest bucket with ${largestBucket.sender_count.toLocaleString()} senders.`
                    : 'Approve a confirmation set to start building durable sender states here.'}
                </p>
              </article>
              <article className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Main checkpoint
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {archiveExecutionAttentionProfiles.length > 0
                    ? 'Archive execution still needs follow-up'
                    : futureIntentProfiles.length > 0
                      ? 'Future-intent destinations are parked safely'
                      : 'Execution truth is currently stable'}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {archiveExecutionAttentionProfiles.length > 0
                    ? `${archiveExecutionAttentionProfiles.length.toLocaleString()} archive destinations still need verification or manual attention.`
                    : futureIntentProfiles.length > 0
                      ? `${futureIntentProfiles.length.toLocaleString()} senders are intentionally stored for later execution work.`
                      : 'No current execution blockers are surfacing above the managed destination layer.'}
                </p>
              </article>
              <article className="rounded-2xl border border-cyan-900/45 bg-cyan-950/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Do next</p>
                <p className="mt-2 text-lg font-semibold text-white">{nextAction.title}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Why now</p>
                    <p className="mt-1 text-sm text-gray-300">{nextAction.detail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Expected payoff</p>
                    <p className="mt-1 text-sm text-gray-300">{nextAction.payoff}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Managed senders</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {senderProfiles.length.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-300">
                Supporting message context stays secondary at{' '}
                {state.data.destination_summaries
                  .reduce((sum, summary) => sum + summary.supporting_message_count, 0)
                  .toLocaleString()}{' '}
                messages.
              </p>
            </article>
            <article className="rounded-2xl border border-gray-800 bg-gray-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Execution truth</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {executionCounts.succeeded.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Executed successfully</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {(executionCounts.deferred + executionCounts.pending + executionCounts.failed).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Need follow-up or verification</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {executionCounts.not_applicable.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Stored state only</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {restoreReadyCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Restore-ready archive senders</p>
                </div>
              </div>
            </article>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/agents/${agentId}/operations/review?stage=confirmation${query ? `&${query.slice(1)}` : ''}`}
            className="rounded-full border border-gray-700 bg-gray-900/40 px-3 py-1.5 text-gray-200 hover:border-cyan-700/60 hover:text-cyan-100"
          >
            Back to Confirmation
          </Link>
          <Link
            href={`/agents/${agentId}/operations/history${query}`}
            className="rounded-full border border-gray-700 bg-gray-900/40 px-3 py-1.5 text-gray-200 hover:border-cyan-700/60 hover:text-cyan-100"
          >
            Open legacy history
          </Link>
        </div>
        {actionNote ? (
          <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/12 p-3 text-sm text-cyan-100">
            {actionNote}
          </div>
        ) : null}
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {state.data.destination_summaries.map((summary) => (
          (() => {
            const profilesInBucket = bucketProfiles.get(summary.state) || []
            const isLargest = largestBucket?.state === summary.state && summary.sender_count > 0
            return (
          <article
            key={summary.state}
            className={`rounded-2xl border p-4 ${destinationCardTone(summary.state)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] opacity-80">{summary.label}</p>
              {isLargest ? (
                <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
                  Largest bucket
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-4xl font-semibold">{summary.sender_count.toLocaleString()}</p>
              <p className="pb-1 text-xs uppercase tracking-[0.18em] opacity-70">senders</p>
            </div>
            <p className="mt-2 text-xs opacity-80">
              {summary.supporting_message_count.toLocaleString()} supporting messages
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1">
                {summary.state === 'ARCHIVE'
                  ? `${profilesInBucket.filter((profile) => profile.execution_state === 'succeeded').length.toLocaleString()} executed`
                  : `${profilesInBucket.filter((profile) => profile.execution_state === 'not_applicable').length.toLocaleString()} stored`}
              </span>
              {summary.state === 'ARCHIVE' ? (
                <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1">
                  {(profilesInBucket.filter(
                    (profile) =>
                      profile.execution_state === 'deferred' ||
                      profile.execution_state === 'pending' ||
                      profile.execution_state === 'failed'
                  ).length).toLocaleString()}{' '}
                  need follow-up
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1">
                  Phase 1 stored intent
                </span>
              )}
            </div>
            <p className="mt-4 text-sm opacity-90">{summary.summary}</p>
            <p className="mt-3 text-sm opacity-90">{destinationBucketContext(summary, profilesInBucket)}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] opacity-70">
              {summary.latest_destination_timestamp
                ? `Latest change ${formatDateTime(summary.latest_destination_timestamp)}`
                : 'No sender committed yet'}
            </p>
          </article>
            )
          })()
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
              Attention and execution status
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              What needs operator attention now
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              This layer highlights execution truth, follow-up pressure, and the sender states that
              matter most before you scan the full management list.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {attentionCards.map((card) => (
              <article key={card.title} className={`rounded-2xl border p-4 ${card.tone}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{card.title}</p>
                <p className="mt-2 text-lg font-semibold">{card.value}</p>
                <p className="mt-2 text-sm opacity-90">{card.detail}</p>
                {card.senders.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                    {card.senders.map((sender) => (
                      <span
                        key={sender}
                        className="rounded-full border border-white/15 bg-black/10 px-2.5 py-1"
                      >
                        {sender}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
                Recent decision activity
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">Latest destination changes</h2>
              <p className="mt-2 text-sm text-gray-300">
                Recent committed state changes stay visible here so you can see what just moved into
                management without scanning the full sender list.
              </p>
            </div>
            <div className="space-y-2">
              {state.data.recent_decision_activity.length > 0 ? (
                state.data.recent_decision_activity.map((activity) => (
                  <article
                    key={activity.id}
                    className="rounded-xl border border-gray-800 bg-gray-900/35 p-3 text-sm text-gray-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {activity.sender} {'->'} {titleForDestinationState(activity.destination_state)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(activity.destination_timestamp)} ·{' '}
                          {activity.destination_source.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {activity.execution_state ? (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${executionTone(activity.execution_state)}`}
                        >
                          {executionLabel(activity.execution_state)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-300">
                      {activity.execution_warning ||
                        activity.destination_reason ||
                        'Destination state recorded from confirmation approval.'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-800 bg-gray-950/30 p-4 text-sm text-gray-400">
                  Recent destination activity will appear here after the first confirmed approval.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">AI rule recommendations</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Future intelligence layer</h2>
            </div>
            <p className="text-sm text-gray-300">{state.data.recommendation_summary.summary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900/35 p-3">
                <p className="text-sm font-medium text-white">Rule recommendations</p>
                <p className="mt-2 text-sm text-gray-400">
                  This area will propose reusable rules from repeated sender decisions and committed
                  destination patterns.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/35 p-3">
                <p className="text-sm font-medium text-white">Automation suggestions</p>
                <p className="mt-2 text-sm text-gray-400">
                  Later phases will surface safe automation ideas once enough sender-state history is
                  available.
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/35 p-3">
                <p className="text-sm font-medium text-white">Sender-pattern actions</p>
                <p className="mt-2 text-sm text-gray-400">
                  Expect future intelligence to connect repeated archive, keep, and caution patterns
                  into guided follow-up actions.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-950/35 p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
              Sender management list
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">Committed sender states</h2>
            <p className="mt-2 text-sm text-gray-300">
              Sender identity leads. Destination state is the primary management truth. Execution
              state stays visible as supporting context for what actually changed in Gmail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
            <span className="rounded-full border border-gray-700 bg-gray-950/60 px-3 py-1">
              {managedProfiles.length.toLocaleString()} managed senders
            </span>
            <span className="rounded-full border border-gray-700 bg-gray-950/60 px-3 py-1">
              {archiveExecutionAttentionProfiles.length.toLocaleString()} archive follow-ups
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {managedProfiles.length > 0 ? (
            managedProfiles.map((profile) => (
              <article
                key={profile.sender_key}
                className="rounded-2xl border border-gray-800 bg-gray-900/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-white">{profile.sender}</p>
                      <span className="rounded-full border border-gray-700 bg-gray-950/60 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-200">
                        {titleForDestinationState(profile.destination_state)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${executionTone(profile.execution_state)}`}
                      >
                        {executionLabel(profile.execution_state)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-400">
                      <span>{profile.domain || 'Unknown domain'}</span>
                      <span>{managementPriorityLabel(profile)}</span>
                      <span>{profile.destination_history.length.toLocaleString()} recorded state changes</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-gray-700 bg-gray-950/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-200">
                    {profile.destination_source.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Destination context
                      </p>
                      <p className="mt-1 text-sm text-gray-300">
                        {profile.destination_reason ||
                          'Destination state recorded from confirmation approval.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Execution truth
                      </p>
                      <p className="mt-1 text-sm text-gray-300">
                        {profile.destination_state === 'ARCHIVE'
                          ? archiveExecutionSummary(profile)
                          : profile.destination_state === 'KEEP'
                            ? 'Keep remains a stored sender preference in Phase 1 and does not execute a Gmail change.'
                            : 'This destination state is committed now and intentionally deferred beyond state tracking in Phase 1.'}
                      </p>
                    </div>
                    {profile.execution_warning ? (
                      <div className="rounded-xl border border-amber-900/45 bg-amber-950/15 p-3 text-sm text-amber-100">
                        {profile.execution_warning}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-xl border border-gray-800 bg-gray-950/55 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Last action
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {formatDateTime(profile.last_action_timestamp)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-gray-950/55 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Supporting context
                      </p>
                      <div className="mt-1 space-y-1 text-sm text-gray-300">
                        {profile.execution_timestamp ? (
                          <p>Execution updated {formatDateTime(profile.execution_timestamp)}</p>
                        ) : null}
                        {profile.execution_message_count != null ? (
                          <p>{profile.execution_message_count.toLocaleString()} messages touched</p>
                        ) : null}
                        {profile.trust_signals?.sender_signal ? (
                          <p>Signal {profile.trust_signals.sender_signal.replace(/_/g, ' ')}</p>
                        ) : null}
                        {profile.trust_signals?.requires_verification ? (
                          <p>Verification still matters for this sender</p>
                        ) : null}
                        {!profile.execution_timestamp &&
                        profile.execution_message_count == null &&
                        !profile.trust_signals?.sender_signal &&
                        !profile.trust_signals?.requires_verification ? (
                          <p>No extra supporting context recorded yet.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span>Latest destination change {formatDateTime(profile.destination_timestamp)}</span>
                    {profile.execution_source ? (
                      <span>Execution source {profile.execution_source.replace(/_/g, ' ')}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={clearingSenderKey === profile.sender_key}
                      onClick={() => void clearDestinationState(profile.sender_key, profile.sender)}
                      className="rounded-full border border-gray-700 bg-gray-950/60 px-3 py-1.5 text-xs text-gray-200 hover:border-cyan-700/60 hover:text-cyan-100 disabled:opacity-50"
                    >
                      {clearingSenderKey === profile.sender_key ? 'Clearing…' : 'Remove destination state'}
                    </button>
                    {profile.destination_state === 'ARCHIVE' ? (
                      <button
                        type="button"
                        disabled={restoringSenderKey === profile.sender_key}
                        onClick={() => void restoreArchiveDestination(profile.sender_key, profile.sender)}
                        className="rounded-full border border-amber-900/45 bg-amber-950/15 px-3 py-1.5 text-xs text-amber-100 hover:border-amber-700/60 disabled:opacity-50"
                      >
                        {restoringSenderKey === profile.sender_key ? 'Restoring Inbox…' : 'Restore Inbox'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 p-6 text-sm text-gray-400">
              No sender destinations have been committed yet. Approving decisions from Confirmation
              will turn this page into the durable home for managed sender states.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
