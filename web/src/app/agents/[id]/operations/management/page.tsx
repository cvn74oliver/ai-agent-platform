'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  clearSenderFromGmailCleanupWorkflowDrafts,
  fetchGmailDecisionManagementSummary,
  persistGmailCleanupMemoryEvent,
  type GmailDecisionManagementSummaryData,
} from '@/lib/runtime/gmailCleanupWorkspace'
import {
  normalizeOperationsAnalysisScope,
} from '@/lib/runtime/operationsWorkspace'

type LoadState =
  | { status: 'idle' | 'loading'; data: null; error: null }
  | { status: 'ready'; data: GmailDecisionManagementSummaryData; error: null }
  | { status: 'error'; data: null; error: string }

type SenderProfile = GmailDecisionManagementSummaryData['sender_profiles'][number]
type BucketFilter = 'ALL' | 'ARCHIVE' | 'CUSTOM_RULE' | 'QUARANTINE' | 'KEEP'
type BucketKey = Exclude<BucketFilter, 'ALL'>
type ExecutionKind =
  | 'protected_no_action'
  | 'deferred_review'
  | 'pending_refinement'
  | 'ready_to_push'
  | 'push_requested'
  | 'verified_applied'
  | 'sync_mismatch_or_failed'
  | 'reversed'
type ExecutionLane = 'active_work' | 'waiting' | 'applied' | 'stored' | 'quiet'

function normalizeBucketFilter(value: string | null): BucketFilter {
  return value === 'ARCHIVE' || value === 'CUSTOM_RULE' || value === 'QUARANTINE' || value === 'KEEP'
    ? value
    : 'ALL'
}

function buildManagementHref(params: {
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  bucket?: BucketFilter | null
}): string {
  const search = new URLSearchParams()
  if (params.sessionId) search.set('playground_session_id', params.sessionId)
  if (params.analysisScope && params.analysisScope !== '365d') {
    search.set('analysis_scope', params.analysisScope)
  }
  if (params.bucket && params.bucket !== 'ALL') search.set('bucket', params.bucket)
  const query = search.toString()
  return `/agents/${params.agentId}/operations/management${query ? `?${query}` : ''}`
}

function buildReviewHref(params: {
  agentId: string
  sessionId: string | null
  analysisScope: string | null | undefined
  mode?: 'overview' | 'decision'
}): string {
  const search = new URLSearchParams()
  if (params.sessionId) search.set('playground_session_id', params.sessionId)
  if (params.analysisScope && params.analysisScope !== '365d') {
    search.set('analysis_scope', normalizeOperationsAnalysisScope(params.analysisScope))
  }
  if (params.mode === 'decision') search.set('mode', 'decision')
  const query = search.toString()
  return `/agents/${params.agentId}/operations/review${query ? `?${query}` : ''}`
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'No recorded change'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value
  return new Date(parsed).toLocaleString()
}

function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`
}

function senderSignalLabel(
  value: SenderProfile['trust_signals'] extends infer T
    ? T extends { sender_signal: infer U }
      ? U
      : never
    : never
): string | null {
  if (value === 'likely_machine_generated') return 'Likely machine generated'
  if (value === 'likely_human') return 'Likely human'
  if (value === 'uncertain') return 'Needs verification'
  return null
}

function supportingMessageCount(profile: SenderProfile): number {
  return profile.trust_signals?.cleanup_group_message_count || profile.execution_message_count || 0
}

function destinationBadge(profile: SenderProfile): { label: string; className: string } {
  if (profile.destination_state === 'KEEP') {
    return {
      label: 'Keep',
      className: 'border-emerald-900/45 bg-emerald-950/20 text-emerald-100',
    }
  }
  if (profile.destination_state === 'ARCHIVE') {
    return {
      label: 'Archive',
      className: 'border-cyan-900/45 bg-cyan-950/20 text-cyan-100',
    }
  }
  if (profile.destination_state === 'CUSTOM_RULE') {
    return {
      label: 'Custom Rule',
      className: 'border-violet-900/45 bg-violet-950/20 text-violet-100',
    }
  }
  return {
    label: 'Quarantine',
    className: 'border-amber-900/45 bg-amber-950/20 text-amber-100',
  }
}

function executionPresentation(profile: SenderProfile): {
  kind: ExecutionKind
  lane: ExecutionLane
  label: string
  detail: string
  actionSummary: string
  className: string
  canPushArchive: boolean
  canRestoreArchive: boolean
  canReopen: boolean
} {
  if (profile.destination_state === 'KEEP') {
    return {
      kind: 'protected_no_action',
      lane: 'quiet',
      label: 'Protected',
      detail:
        'Stored destination only. Keep remains visible in summary, filters, and sender profile management without competing as active work.',
      actionSummary: 'Quiet managed state. Reopen only if this sender should return to Decisions.',
      className: 'border-emerald-900/45 bg-emerald-950/10 text-emerald-100',
      canPushArchive: false,
      canRestoreArchive: false,
      canReopen: true,
    }
  }

  if (profile.destination_state === 'QUARANTINE') {
    return {
      kind: 'deferred_review',
      lane: 'stored',
      label: 'Deferred Review',
      detail:
        'Stored destination only. This sender is intentionally parked for later review and does not change Gmail in this slice.',
      actionSummary:
        'Controlled deferral. Reopen when you want this sender back in Decision Mode for a new decision.',
      className: 'border-amber-900/45 bg-amber-950/10 text-amber-100',
      canPushArchive: false,
      canRestoreArchive: false,
      canReopen: true,
    }
  }

  if (profile.destination_state === 'CUSTOM_RULE') {
    const refinedReady = profile.execution_source === 'ready_to_push'
    const pushRequested = profile.execution_source === 'push_requested' || profile.execution_state === 'pending'
    const applied = profile.execution_source === 'verified_applied' && profile.execution_state === 'succeeded'
    const reversed = profile.execution_source === 'reversed' && profile.execution_state === 'succeeded'
    const mismatch =
      profile.execution_source === 'sync_mismatch_or_failed' ||
      profile.execution_state === 'failed'

    if (applied) {
      return {
        kind: 'verified_applied',
        lane: 'applied',
        label: 'Verified Applied',
        detail: 'A legacy downstream action exists for this sender and was verified after execution.',
        actionSummary:
          'This state is already applied. Reopen only if you intend to supersede the managed destination.',
        className: 'border-emerald-900/45 bg-emerald-950/10 text-emerald-100',
        canPushArchive: false,
        canRestoreArchive: false,
        canReopen: true,
      }
    }
    if (reversed) {
      return {
        kind: 'reversed',
        lane: 'applied',
        label: 'Reversed',
        detail:
          'A previous external action was reversed. The sender remains managed until you explicitly reopen it.',
        actionSummary:
          'Reopen returns the sender to Decision Mode while preserving the management history.',
        className: 'border-slate-700 bg-slate-950/35 text-slate-100',
        canPushArchive: false,
        canRestoreArchive: false,
        canReopen: true,
      }
    }
    if (pushRequested) {
      return {
        kind: 'push_requested',
        lane: 'waiting',
        label: 'Push Requested',
        detail: 'A legacy downstream push is in progress for this sender.',
        actionSummary: 'No new action is available while this sender waits on external execution or verification.',
        className: 'border-cyan-900/45 bg-cyan-950/10 text-cyan-100',
        canPushArchive: false,
        canRestoreArchive: false,
        canReopen: false,
      }
    }
    if (mismatch) {
      return {
        kind: 'sync_mismatch_or_failed',
        lane: 'active_work',
        label: 'Needs Attention',
        detail: profile.execution_warning || 'Execution and sync truth need follow-up before this sender is trusted again.',
        actionSummary: 'This is a valid managed state, but its execution history needs operator attention.',
        className: 'border-rose-900/45 bg-rose-950/10 text-rose-100',
        canPushArchive: false,
        canRestoreArchive: false,
        canReopen: true,
      }
    }
    if (refinedReady) {
      return {
        kind: 'ready_to_push',
        lane: 'stored',
        label: 'Ready After Refinement',
        detail:
          'Refinement history exists, but Gmail action remains outside slice 1. This sender stays managed until the refinement flow ships.',
        actionSummary: 'No Gmail action is available in this slice even when refinement metadata exists.',
        className: 'border-violet-900/45 bg-violet-950/10 text-violet-100',
        canPushArchive: false,
        canRestoreArchive: false,
        canReopen: true,
      }
    }
    return {
      kind: 'pending_refinement',
      lane: 'stored',
      label: 'Pending Refinement',
      detail:
        'Stored destination only. This is an intentional managed state while category-level refinement remains out of scope for slice 1.',
      actionSummary:
        'No Gmail action is available yet. The next step is later refinement, not another decision or immediate execution.',
      className: 'border-violet-900/45 bg-violet-950/10 text-violet-100',
      canPushArchive: false,
      canRestoreArchive: false,
      canReopen: true,
    }
  }

  const readyToPush =
    profile.execution_source === 'ready_to_push' ||
    (profile.execution_state === 'deferred' && !profile.execution_source)
  const pushRequested = profile.execution_source === 'push_requested' || profile.execution_state === 'pending'
  const applied = profile.execution_source === 'verified_applied' && profile.execution_state === 'succeeded'
  const reversed = profile.execution_source === 'reversed' && profile.execution_state === 'succeeded'
  const mismatch =
    profile.execution_source === 'sync_mismatch_or_failed' || profile.execution_state === 'failed'

  if (applied) {
    return {
      kind: 'verified_applied',
      lane: 'applied',
      label: 'Verified Applied',
      detail: 'Gmail Inbox state has been verified for this archive destination.',
      actionSummary:
        'Restore is available here in Management because this is where Gmail mutations are controlled and verified.',
      className: 'border-emerald-900/45 bg-emerald-950/10 text-emerald-100',
      canPushArchive: false,
      canRestoreArchive: true,
      canReopen: false,
    }
  }
  if (reversed) {
    return {
      kind: 'reversed',
      lane: 'applied',
      label: 'Reversed',
      detail:
        'Inbox restore has been verified. The sender remains managed until you reopen it for a new decision.',
      actionSummary: 'You can push again later or reopen this sender back into Decision Mode.',
      className: 'border-slate-700 bg-slate-950/35 text-slate-100',
      canPushArchive: true,
      canRestoreArchive: false,
      canReopen: true,
    }
  }
  if (pushRequested) {
    return {
      kind: 'push_requested',
      lane: 'waiting',
      label: 'Push Requested',
      detail: 'Archive push is in progress and waiting on Gmail execution or verification.',
      actionSummary: 'This sender is waiting on Gmail. New archive actions stay locked until verification finishes.',
      className: 'border-cyan-900/45 bg-cyan-950/10 text-cyan-100',
      canPushArchive: false,
      canRestoreArchive: false,
      canReopen: false,
    }
  }
  if (mismatch) {
    return {
      kind: 'sync_mismatch_or_failed',
      lane: 'active_work',
      label: 'Needs Attention',
      detail: profile.execution_warning || 'Archive execution did not fully verify against Gmail state.',
      actionSummary:
        'Management is the place to retry or reopen because Gmail changes only happen from this surface.',
      className: 'border-rose-900/45 bg-rose-950/10 text-rose-100',
      canPushArchive: true,
      canRestoreArchive: false,
      canReopen: true,
    }
  }
  if (readyToPush) {
    return {
      kind: 'ready_to_push',
      lane: 'active_work',
      label: 'Ready to Push',
      detail: 'Stored destination only. Gmail will change only after an explicit Management push.',
      actionSummary:
        'Push to Gmail is the execution step. Decision Mode stored the destination earlier but did not mutate Gmail.',
      className: 'border-cyan-900/45 bg-cyan-950/10 text-cyan-100',
      canPushArchive: true,
      canRestoreArchive: false,
      canReopen: true,
    }
  }
  return {
    kind: 'ready_to_push',
    lane: 'active_work',
    label: 'Ready to Push',
    detail: 'Stored destination only. Gmail will change only after an explicit Management push.',
    actionSummary:
      'Push to Gmail is the execution step. Decision Mode stored the destination earlier but did not mutate Gmail.',
    className: 'border-cyan-900/45 bg-cyan-950/10 text-cyan-100',
    canPushArchive: true,
    canRestoreArchive: false,
    canReopen: true,
  }
}

type DecoratedProfile = {
  profile: SenderProfile
  destination: ReturnType<typeof destinationBadge>
  execution: ReturnType<typeof executionPresentation>
  supportingMessages: number
}

function decorateProfile(profile: SenderProfile): DecoratedProfile {
  return {
    profile,
    destination: destinationBadge(profile),
    execution: executionPresentation(profile),
    supportingMessages: supportingMessageCount(profile),
  }
}

function groupPriority(item: DecoratedProfile): number {
  if (item.execution.kind === 'sync_mismatch_or_failed') return 0
  if (item.execution.kind === 'ready_to_push') return 1
  if (item.execution.kind === 'push_requested') return 2
  if (item.execution.kind === 'verified_applied') return 3
  if (item.execution.kind === 'reversed') return 4
  if (item.execution.kind === 'pending_refinement') return 5
  if (item.execution.kind === 'deferred_review') return 6
  return 7
}

function sortDecoratedProfiles(items: DecoratedProfile[]): DecoratedProfile[] {
  return [...items].sort((left, right) => {
    const priority = groupPriority(left) - groupPriority(right)
    if (priority !== 0) return priority
    return Date.parse(right.profile.last_action_timestamp) - Date.parse(left.profile.last_action_timestamp)
  })
}

function sumSupportingMessages(items: DecoratedProfile[]): number {
  return items.reduce((total, item) => total + item.supportingMessages, 0)
}

function countByKind(items: DecoratedProfile[], kind: ExecutionKind): number {
  return items.filter((item) => item.execution.kind === kind).length
}

function actionFootnote(item: DecoratedProfile): string {
  if (item.execution.canPushArchive) {
    return 'Push to Gmail is the only action here that changes Gmail in slice 1.'
  }
  if (item.execution.canRestoreArchive) {
    return 'Restore will return verified archive changes back into Inbox while keeping the sender managed.'
  }
  if (item.profile.destination_state === 'CUSTOM_RULE') {
    return 'Valid managed state. Gmail action stays unavailable until the later refinement slice ships.'
  }
  if (item.profile.destination_state === 'QUARANTINE') {
    return 'Deferred on purpose. Reopen when this sender needs another decision pass.'
  }
  if (item.profile.destination_state === 'KEEP') {
    return 'Quiet managed state. Keep stays visible in summary and filters without becoming active work.'
  }
  if (item.execution.kind === 'push_requested') {
    return 'Waiting on Gmail execution or verification before more actions become available.'
  }
  return 'No additional action is available right now.'
}

const nestedSurfaceClass = 'app-surface-card-nested'
const insetSurfaceClass = 'app-surface-card-inset'
const insetPillClass = 'app-surface-card-tile'
const quietSecondaryActionClass =
  'app-surface-card-tile text-gray-200 hover:border-cyan-700/60 hover:text-cyan-100'

function SectionHeader(props: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-lg font-semibold text-white">{props.title}</p>
        <p className="mt-1 text-sm text-gray-400">{props.subtitle}</p>
      </div>
    </div>
  )
}

function SummaryCard(props: {
  title: string
  value: string
  detail: string
  className: string
}) {
  return (
    <div className={`${nestedSurfaceClass} rounded-2xl p-4 ${props.className}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">{props.title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-300">{props.detail}</p>
    </div>
  )
}

function LaneCard(props: {
  title: string
  value: string
  detail: string
  className: string
}) {
  return (
    <div className={`${nestedSurfaceClass} rounded-2xl p-4 ${props.className}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{props.title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-300">{props.detail}</p>
    </div>
  )
}

function SenderRow(props: {
  item: DecoratedProfile
  onPushArchive: (profile: SenderProfile) => Promise<void>
  onRestoreArchive: (profile: SenderProfile) => Promise<void>
  onReopen: (profile: SenderProfile) => Promise<void>
  pushingSenderKey: string | null
  restoringSenderKey: string | null
  reopeningSenderKey: string | null
}) {
  const { item } = props
  const { profile, destination, execution } = item
  const isPushing = props.pushingSenderKey === profile.sender_key
  const isRestoring = props.restoringSenderKey === profile.sender_key
  const isReopening = props.reopeningSenderKey === profile.sender_key
  const signalLabel = senderSignalLabel(profile.trust_signals?.sender_signal ?? null)
  const supportingSummary =
    item.supportingMessages > 0 ? pluralize(item.supportingMessages, 'cleanup-group message') : null
  const totalSenderSummary =
    profile.trust_signals?.total_sender_messages != null
      ? pluralize(profile.trust_signals.total_sender_messages, 'total sender message')
      : null
  const unreadSummary =
    profile.trust_signals?.unread_count != null
      ? pluralize(profile.trust_signals.unread_count, 'unread message')
      : null
  const detailSummary =
    profile.trust_signals?.category_summary ||
    profile.trust_signals?.dominant_pattern ||
    profile.trust_signals?.protected_hint ||
    null

  return (
    <article className="app-surface-card rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{profile.sender}</p>
          <p className="mt-1 text-xs text-gray-500">Last changed {formatDateTime(profile.last_action_timestamp)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
            {profile.domain ? (
              <span className={`${insetPillClass} rounded-full px-2.5 py-1`}>
                {profile.domain}
              </span>
            ) : null}
            {supportingSummary ? (
              <span className={`${insetPillClass} rounded-full px-2.5 py-1`}>
                {supportingSummary}
              </span>
            ) : null}
            {totalSenderSummary ? (
              <span className={`${insetPillClass} rounded-full px-2.5 py-1`}>
                {totalSenderSummary}
              </span>
            ) : null}
            {unreadSummary ? (
              <span className={`${insetPillClass} rounded-full px-2.5 py-1`}>
                {unreadSummary}
              </span>
            ) : null}
            {signalLabel ? (
              <span className={`${insetPillClass} rounded-full px-2.5 py-1`}>
                {signalLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Destination</span>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${destination.className}`}>
            {destination.label}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Execution</span>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${execution.className}`}>
            {execution.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1.15fr_0.95fr]">
        <div className={`${nestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Destination state</p>
          <p className="mt-2 text-sm text-gray-200">
            {profile.destination_reason || `${destination.label} is the active managed destination for this sender.`}
          </p>
          {detailSummary ? <p className="mt-2 text-xs leading-5 text-gray-400">{detailSummary}</p> : null}
        </div>
        <div className={`${nestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Execution / sync truth</p>
          <p className="mt-2 text-sm text-gray-200">{execution.detail}</p>
          {profile.execution_message_count ? (
            <p className="mt-2 text-xs text-gray-400">
              Last verified execution touched {pluralize(profile.execution_message_count, 'message')}.
            </p>
          ) : null}
          {profile.trust_signals?.requires_verification &&
          profile.trust_signals.verification_reasons.length > 0 ? (
            <p className="mt-2 text-xs leading-5 text-gray-400">
              Verification context: {profile.trust_signals.verification_reasons.join(', ')}.
            </p>
          ) : null}
          {profile.execution_warning ? (
            <p className="mt-2 text-xs leading-5 text-gray-400">{profile.execution_warning}</p>
          ) : null}
        </div>
        <div className={`${nestedSurfaceClass} rounded-xl p-3`}>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Available actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {execution.canPushArchive ? (
              <button
                type="button"
                disabled={isPushing || isRestoring || isReopening}
                onClick={() => void props.onPushArchive(profile)}
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPushing ? 'Pushing…' : 'Push to Gmail'}
              </button>
            ) : null}
            {execution.canRestoreArchive ? (
              <button
                type="button"
                disabled={isPushing || isRestoring || isReopening}
                onClick={() => void props.onRestoreArchive(profile)}
                className="rounded-full border border-amber-700/50 bg-amber-950/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:border-amber-600/70 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRestoring ? 'Restoring…' : 'Restore'}
              </button>
            ) : null}
            {execution.canReopen ? (
              <button
                type="button"
                disabled={isPushing || isRestoring || isReopening}
                onClick={() => void props.onReopen(profile)}
                className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isReopening ? 'Reopening…' : 'Reopen in Decisions'}
              </button>
            ) : null}
            {!execution.canPushArchive && !execution.canRestoreArchive && !execution.canReopen ? (
              <span className={`${insetPillClass} rounded-full px-4 py-2 text-sm text-gray-400`}>
                No action available right now
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-400">{actionFootnote(item)}</p>
        </div>
      </div>
    </article>
  )
}

function SenderGroup(props: {
  title: string
  subtitle: string
  items: DecoratedProfile[]
  onPushArchive: (profile: SenderProfile) => Promise<void>
  onRestoreArchive: (profile: SenderProfile) => Promise<void>
  onReopen: (profile: SenderProfile) => Promise<void>
  pushingSenderKey: string | null
  restoringSenderKey: string | null
  reopeningSenderKey: string | null
}) {
  return (
    <div className="space-y-3">
      <div className="app-surface-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-white">{props.title}</p>
        <p className="mt-1 text-sm text-gray-400">{props.subtitle}</p>
      </div>
      <div className="space-y-3">
        {props.items.map((item) => (
          <SenderRow
            key={item.profile.sender_key}
            item={item}
            onPushArchive={props.onPushArchive}
            onRestoreArchive={props.onRestoreArchive}
            onReopen={props.onReopen}
            pushingSenderKey={props.pushingSenderKey}
            restoringSenderKey={props.restoringSenderKey}
            reopeningSenderKey={props.reopeningSenderKey}
          />
        ))}
      </div>
    </div>
  )
}

export default function OperationsDecisionManagementPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const sessionId = searchParams.get('playground_session_id')
  const analysisScope = normalizeOperationsAnalysisScope(searchParams.get('analysis_scope'))
  const bucket = normalizeBucketFilter(searchParams.get('bucket'))

  const [state, setState] = useState<LoadState>({ status: 'loading', data: null, error: null })
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pushingSenderKey, setPushingSenderKey] = useState<string | null>(null)
  const [restoringSenderKey, setRestoringSenderKey] = useState<string | null>(null)
  const [reopeningSenderKey, setReopeningSenderKey] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const result = await fetchGmailDecisionManagementSummary({ agentId })
    if (!result.ok) {
      setState({ status: 'error', data: null, error: result.error })
      return
    }
    setState({ status: 'ready', data: result.data, error: null })
  }, [agentId])

  useEffect(() => {
    if (!agentId) return
    void reload()
  }, [agentId, reload])

  const pushArchive = async (profile: SenderProfile) => {
    setPushingSenderKey(profile.sender_key)
    setActionNote(null)
    setActionError(null)
    try {
      const res = await fetch('/api/runtime/gmail-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_archive',
          agentId,
          sessionId,
          senderKey: profile.sender_key,
          sender: profile.sender,
          analysisScope,
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            data?: {
              sender_key: string
              sender: string
              archive_execution: {
                status: 'pending' | 'succeeded' | 'failed' | 'deferred' | 'not_applicable'
                message_count: number
                warning?: string | null
              }
            }
          }
        | null

      if (!res.ok || !payload?.ok || !payload.data) {
        setActionError(payload?.error || 'Failed to push this archive sender to Gmail.')
        return
      }

      const execution = payload.data.archive_execution
      if (execution.status === 'succeeded') {
        setActionNote(
          `${profile.sender} archive is now verified in Gmail for ${execution.message_count.toLocaleString()} messages.`
        )
      } else if (execution.status === 'pending') {
        setActionNote(`${profile.sender} archive push has been requested and is still in progress.`)
      } else {
        setActionError(
          `${profile.sender} needs attention: ${execution.warning || 'Archive execution could not be fully verified.'}`
        )
      }
      await reload()
    } finally {
      setPushingSenderKey(null)
    }
  }

  const restoreArchive = async (profile: SenderProfile) => {
    setRestoringSenderKey(profile.sender_key)
    setActionNote(null)
    setActionError(null)
    try {
      const res = await fetch('/api/runtime/gmail-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_archive',
          agentId,
          sessionId,
          senderKey: profile.sender_key,
          sender: profile.sender,
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
              }
            }
          }
        | null

      if (!res.ok || !payload?.ok || !payload.data) {
        setActionError(payload?.error || 'Failed to restore this archive sender.')
        return
      }

      const restore = payload.data.restore_execution
      if (restore.status === 'succeeded') {
        setActionNote(
          `${profile.sender} was restored in Gmail for ${restore.message_count.toLocaleString()} messages. The archive destination remains managed until you reopen it.`
        )
      } else {
        setActionError(
          `${profile.sender} restore needs attention: ${restore.warning || 'Inbox restore could not be fully verified.'}`
        )
      }
      await reload()
    } finally {
      setRestoringSenderKey(null)
    }
  }

  const reopenSender = async (profile: SenderProfile) => {
    setReopeningSenderKey(profile.sender_key)
    setActionNote(null)
    setActionError(null)
    try {
      const result = await persistGmailCleanupMemoryEvent({
        agentId,
        sessionId,
        cluster: profile.cluster,
        action: {
          type: 'destination_state_clear',
          senderKey: profile.sender_key,
          sender: profile.sender,
          reason:
            'Sender was explicitly reopened from Management so it can return to the decision queue.',
        },
      })

      if (!result.ok) {
        setActionError(result.error)
        return
      }

      clearSenderFromGmailCleanupWorkflowDrafts({
        agentId,
        senderKey: profile.sender_key,
        sessionId,
      })
      setActionNote(`${profile.sender} was reopened and will be eligible in Sender Decisions again.`)
      await reload()
    } finally {
      setReopeningSenderKey(null)
    }
  }

  if (state.status === 'loading') {
    return (
      <section className="app-surface-card-subtle rounded-2xl p-5 text-sm text-gray-300">
        Loading Management control center…
      </section>
    )
  }

  if (state.status === 'error' || !state.data) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-5 text-sm text-rose-100">
        {state.error || 'Failed to load Decision Management.'}
      </section>
    )
  }

  const senderProfiles = state.data.sender_profiles.filter(
    (profile) =>
      profile.destination_state === 'KEEP' ||
      profile.destination_state === 'ARCHIVE' ||
      profile.destination_state === 'CUSTOM_RULE' ||
      profile.destination_state === 'QUARANTINE'
  )

  const decoratedProfiles = senderProfiles.map(decorateProfile)
  const profilesByBucket: Record<BucketKey, DecoratedProfile[]> = {
    ARCHIVE: sortDecoratedProfiles(
      decoratedProfiles.filter((item) => item.profile.destination_state === 'ARCHIVE')
    ),
    CUSTOM_RULE: sortDecoratedProfiles(
      decoratedProfiles.filter((item) => item.profile.destination_state === 'CUSTOM_RULE')
    ),
    QUARANTINE: sortDecoratedProfiles(
      decoratedProfiles.filter((item) => item.profile.destination_state === 'QUARANTINE')
    ),
    KEEP: sortDecoratedProfiles(decoratedProfiles.filter((item) => item.profile.destination_state === 'KEEP')),
  }

  const archiveReadyItems = profilesByBucket.ARCHIVE.filter((item) => item.execution.kind === 'ready_to_push')
  const archiveWaitingItems = profilesByBucket.ARCHIVE.filter((item) => item.execution.kind === 'push_requested')
  const archiveAppliedItems = profilesByBucket.ARCHIVE.filter(
    (item) => item.execution.kind === 'verified_applied'
  )
  const archiveAttentionItems = profilesByBucket.ARCHIVE.filter(
    (item) => item.execution.kind === 'sync_mismatch_or_failed'
  )
  const archiveReversedItems = profilesByBucket.ARCHIVE.filter((item) => item.execution.kind === 'reversed')

  const customPendingItems = profilesByBucket.CUSTOM_RULE.filter(
    (item) => item.execution.kind === 'pending_refinement'
  )
  const customLegacyItems = profilesByBucket.CUSTOM_RULE.filter(
    (item) => item.execution.kind !== 'pending_refinement'
  )
  const quarantineDeferredItems = profilesByBucket.QUARANTINE.filter(
    (item) => item.execution.kind === 'deferred_review'
  )

  const totalManagedCount = decoratedProfiles.length
  const totalManagedMessages = sumSupportingMessages(decoratedProfiles)
  const archiveReadyCount = archiveReadyItems.length
  const archiveWaitingCount = archiveWaitingItems.length
  const archiveAppliedCount = archiveAppliedItems.length
  const archiveNeedsAttentionCount = archiveAttentionItems.length
  const archiveReversedCount = archiveReversedItems.length
  const customPendingCount = customPendingItems.length
  const quarantineCount = profilesByBucket.QUARANTINE.length
  const keepCount = profilesByBucket.KEEP.length
  const readyArchiveMessages = sumSupportingMessages(archiveReadyItems) + sumSupportingMessages(archiveAttentionItems)

  const visibleSections =
    bucket === 'ALL'
      ? (['ARCHIVE', 'CUSTOM_RULE', 'QUARANTINE'] as const)
      : bucket === 'KEEP'
        ? ([] as const)
        : ([bucket] as const)

  return (
    <div className="space-y-4">
      <section className="app-page-header app-page-header-hero rounded-3xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Management</p>
            <h1 className="text-2xl font-semibold text-white">Execution and sync control center</h1>
            <p className="max-w-3xl text-sm text-gray-300">
              Decisions are already stored. Management is where you see what can act now, what is stored for later, what Gmail has already applied, and where attention is needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildReviewHref({ agentId, sessionId, analysisScope })}
              className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
            >
              Sender Overview
            </Link>
            <Link
              href={buildReviewHref({ agentId, sessionId, analysisScope, mode: 'decision' })}
              className={`${quietSecondaryActionClass} rounded-full px-4 py-2 text-sm`}
            >
              Decision Mode
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard
            title="Managed senders"
            value={totalManagedCount.toLocaleString()}
            detail={
              totalManagedMessages > 0
                ? `${pluralize(totalManagedMessages, 'cleanup-group message')} represented across all managed destinations.`
                : 'Managed sender count across all current destinations.'
            }
            className="border-[var(--app-border-muted)]"
          />
          <SummaryCard
            title="Archive ready now"
            value={archiveReadyCount.toLocaleString()}
            detail={
              readyArchiveMessages > 0
                ? `${pluralize(readyArchiveMessages, 'message')} can change Gmail from Management now.`
                : 'Ready archive work stays here until you explicitly push it.'
            }
            className="border-cyan-900/45 bg-cyan-950/10"
          />
          <SummaryCard
            title="Custom Rules pending"
            value={customPendingCount.toLocaleString()}
            detail="Valid managed state only. These senders are waiting on later refinement, not Gmail execution."
            className="border-violet-900/45 bg-violet-950/10"
          />
          <SummaryCard
            title="Quarantined"
            value={quarantineCount.toLocaleString()}
            detail="Deferred on purpose. These senders remain parked until you reopen them for another decision."
            className="border-amber-900/45 bg-amber-950/10"
          />
          <SummaryCard
            title="Archive applied"
            value={archiveAppliedCount.toLocaleString()}
            detail="These archive destinations have verified Gmail application and can be restored from here."
            className="border-emerald-900/45 bg-emerald-950/10"
          />
          <SummaryCard
            title="Keep protected"
            value={keepCount.toLocaleString()}
            detail="Quiet managed context only. Keep appears in summary, filters, and sender profiles."
            className="border-emerald-900/35 bg-emerald-950/8"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-5">
          <LaneCard
            title="Act now"
            value={pluralize(archiveReadyCount + archiveNeedsAttentionCount, 'sender')}
            detail={
              archiveNeedsAttentionCount > 0
                ? `${archiveNeedsAttentionCount.toLocaleString()} need follow-up and ${archiveReadyCount.toLocaleString()} are ready to push.`
                : `${archiveReadyCount.toLocaleString()} archive senders are ready to push right now.`
            }
            className="border-cyan-900/35 bg-cyan-950/8"
          />
          <LaneCard
            title="Waiting on Gmail"
            value={pluralize(archiveWaitingCount, 'sender')}
            detail="Push requested states stay here until Gmail execution or verification resolves."
            className="border-sky-900/35 bg-sky-950/8"
          />
          <LaneCard
            title="Stored for later"
            value={pluralize(customPendingCount + quarantineCount, 'sender')}
            detail="Custom Rules and Quarantine are managed destinations with no Gmail mutation path in slice 1."
            className="border-violet-900/25 bg-violet-950/8"
          />
          <LaneCard
            title="Already applied"
            value={pluralize(archiveAppliedCount, 'sender')}
            detail="Verified archive work lives here until you restore or leave it as applied history."
            className="border-emerald-900/25 bg-emerald-950/8"
          />
          <LaneCard
            title="Quiet managed"
            value={pluralize(keepCount, 'sender')}
            detail="Keep remains a real destination state, but it stays out of the primary work buckets."
            className="border-[var(--app-border-muted)]"
          />
        </div>

        <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/15 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Execution trust</p>
          <p className="mt-2 text-sm text-gray-200">
            Gmail mutation happens only here in the Archive bucket. Decision Mode stored sender destinations earlier, but no Gmail action occurs until you press <span className="font-semibold text-white">Push to Gmail</span> from Management.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'ARCHIVE', 'CUSTOM_RULE', 'QUARANTINE', 'KEEP'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                router.replace(
                  buildManagementHref({
                    agentId,
                    sessionId,
                    analysisScope,
                    bucket: value,
                  }),
                  { scroll: false }
                )
              }}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                bucket === value
                  ? 'border-cyan-700/60 bg-cyan-950/20 text-cyan-100'
                  : `${insetSurfaceClass} text-gray-300 hover:border-cyan-700/40 hover:text-cyan-100`
              }`}
            >
              {value === 'ALL'
                ? 'All active work'
                : value === 'CUSTOM_RULE'
                  ? 'Custom Rules'
                  : value === 'KEEP'
                    ? 'Keep (quiet)'
                    : value.charAt(0) + value.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {actionNote ? (
          <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/20 p-3 text-sm text-cyan-100">
            {actionNote}
          </div>
        ) : null}
        {actionError ? (
          <div className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-3 text-sm text-rose-100">
            {actionError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="app-surface-card rounded-2xl p-5 space-y-4">
          <SectionHeader
            title="How to read Management"
            subtitle="This page separates durable sender intent from actual Gmail truth so operators can act with confidence."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Destination truth</p>
              <p className="mt-2 text-sm text-gray-200">
                Keep, Archive, Custom Rule, or Quarantine. This is the stored managed state created during decisions.
              </p>
            </div>
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Execution / sync truth</p>
              <p className="mt-2 text-sm text-gray-200">
                Ready, waiting, verified, needs attention, reversed, pending refinement, deferred review, or protected.
              </p>
            </div>
            <div className={`${nestedSurfaceClass} rounded-2xl p-4`}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Available actions</p>
              <p className="mt-2 text-sm text-gray-200">
                Archive can push or restore here. Stored-only states can reopen into Decision Mode. Keep stays intentionally quiet.
              </p>
            </div>
          </div>
        </div>

        <div className="app-surface-card rounded-2xl p-5 space-y-4">
          <SectionHeader
            title="Current operating picture"
            subtitle="A calm view of what needs action now versus what is safely stored for later."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-900/35 bg-rose-950/8 p-4">
              <p className="text-[10px] uppercase tracking-wide text-rose-300">Needs attention</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {archiveNeedsAttentionCount.toLocaleString()}
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-300">
                Archive senders whose Gmail execution needs retry, verification, or deliberate reopening.
              </p>
            </div>
            <div className="app-surface-card-inset rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-300">Reversed archive</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {archiveReversedCount.toLocaleString()}
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-300">
                Restored archive work remains visible here until you reopen or push it again later.
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-gray-300">
            Custom Rules and Quarantine are intentionally stored-only in slice 1. They are managed states, not broken states, and they remain visible so you can decide when to refine or reopen them later.
          </p>
        </div>
      </section>

      {visibleSections.map((section) => {
        const items = profilesByBucket[section]

        if (section === 'ARCHIVE') {
          return (
            <section key={section} className="app-surface-card rounded-2xl p-5 space-y-4">
              <SectionHeader
                title="Archive bucket"
                subtitle="This is the only slice-1 bucket that can change Gmail. Push, verification, restore, and reopen all live here."
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                  title="Senders"
                  value={items.length.toLocaleString()}
                  detail="Archive destinations currently managed in this workspace."
                  className="border-[var(--app-border-muted)]"
                />
                <SummaryCard
                  title="Message impact"
                  value={sumSupportingMessages(items).toLocaleString()}
                  detail="Cleanup-group messages represented by archive decisions."
                  className="border-[var(--app-border-muted)]"
                />
                <SummaryCard
                  title="Needs action"
                  value={(archiveReadyCount + archiveNeedsAttentionCount).toLocaleString()}
                  detail={`${archiveReadyCount.toLocaleString()} ready to push · ${archiveNeedsAttentionCount.toLocaleString()} need attention`}
                  className="border-cyan-900/35 bg-cyan-950/8"
                />
                <SummaryCard
                  title="Waiting"
                  value={archiveWaitingCount.toLocaleString()}
                  detail="Archive pushes waiting on Gmail execution or verification."
                  className="border-sky-900/35 bg-sky-950/8"
                />
                <SummaryCard
                  title="Applied / reversed"
                  value={`${archiveAppliedCount.toLocaleString()} / ${archiveReversedCount.toLocaleString()}`}
                  detail="Verified archive applications and verified restores."
                  className="border-emerald-900/25 bg-emerald-950/8"
                />
              </div>

              <div className="rounded-2xl border border-cyan-900/45 bg-cyan-950/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">Pre-push safety preview</p>
                <p className="mt-2 text-sm text-gray-200">
                  {readyArchiveMessages > 0
                    ? `${pluralize(readyArchiveMessages, 'cleanup-group message')} are currently behind archive work that can act from this page. Nothing touches Gmail until you explicitly push from Management.`
                    : 'There is no ready archive work to push right now. Verified or deferred states remain visible here for control and audit.'}
                </p>
              </div>

              {archiveAttentionItems.length > 0 || archiveReadyItems.length > 0 ? (
                <SenderGroup
                  title="Action needed now"
                  subtitle="These senders are either ready to push or need operator attention before archive execution can be trusted."
                  items={[...archiveAttentionItems, ...archiveReadyItems]}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {archiveWaitingItems.length > 0 ? (
                <SenderGroup
                  title="Waiting on Gmail"
                  subtitle="Archive requests have been sent and are waiting on execution or verification."
                  items={archiveWaitingItems}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {archiveAppliedItems.length > 0 ? (
                <SenderGroup
                  title="Already applied"
                  subtitle="These archive destinations have verified Gmail application and can be restored from this control center."
                  items={archiveAppliedItems}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {archiveReversedItems.length > 0 ? (
                <SenderGroup
                  title="Reversed"
                  subtitle="Archive restores are verified, but the sender remains managed until you reopen it or push again later."
                  items={archiveReversedItems}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {items.length === 0 ? (
                <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4 text-sm text-gray-400`}>
                  No senders are currently in Archive.
                </div>
              ) : null}
            </section>
          )
        }

        if (section === 'CUSTOM_RULE') {
          return (
            <section key={section} className="app-surface-card rounded-2xl p-5 space-y-4">
              <SectionHeader
                title="Custom Rules bucket"
                subtitle="These senders are intentionally pending. Management keeps them visible and trustworthy without pretending execution is available yet."
              />
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryCard
                  title="Senders"
                  value={items.length.toLocaleString()}
                  detail="Managed senders routed into the Custom Rule path."
                  className="border-[var(--app-border-muted)]"
                />
                <SummaryCard
                  title="Message impact"
                  value={sumSupportingMessages(items).toLocaleString()}
                  detail="Cleanup-group messages represented by stored Custom Rule intent."
                  className="border-[var(--app-border-muted)]"
                />
                <SummaryCard
                  title="Pending refinement"
                  value={customPendingCount.toLocaleString()}
                  detail="Valid managed state only. Gmail action remains unavailable in slice 1."
                  className="border-violet-900/35 bg-violet-950/8"
                />
              </div>

              <div className="rounded-2xl border border-violet-900/45 bg-violet-950/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300">What comes next</p>
                <p className="mt-2 text-sm text-gray-200">
                  Custom Rules are stored here on purpose. The later refinement pass will turn this bucket into a rule-definition workflow, but this slice keeps the state visible without shipping that editor yet.
                </p>
              </div>

              {customPendingItems.length > 0 ? (
                <SenderGroup
                  title="Awaiting refinement"
                  subtitle="These senders are safely stored and waiting for the future refinement step."
                  items={customPendingItems}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {customLegacyItems.length > 0 ? (
                <SenderGroup
                  title="Existing execution history"
                  subtitle="Legacy or non-slice-1 execution states remain visible here so the sender history stays understandable."
                  items={customLegacyItems}
                  onPushArchive={pushArchive}
                  onRestoreArchive={restoreArchive}
                  onReopen={reopenSender}
                  pushingSenderKey={pushingSenderKey}
                  restoringSenderKey={restoringSenderKey}
                  reopeningSenderKey={reopeningSenderKey}
                />
              ) : null}

              {items.length === 0 ? (
                <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4 text-sm text-gray-400`}>
                  No senders are currently pending in Custom Rules.
                </div>
              ) : null}
            </section>
          )
        }

        return (
          <section key={section} className="app-surface-card rounded-2xl p-5 space-y-4">
            <SectionHeader
              title="Quarantine bucket"
              subtitle="Quarantine is controlled deferral. These senders remain managed and visible without taking Gmail action in this slice."
            />
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                title="Senders"
                value={items.length.toLocaleString()}
                detail="Managed senders currently deferred for later review."
                className="border-[var(--app-border-muted)]"
              />
              <SummaryCard
                title="Message impact"
                value={sumSupportingMessages(items).toLocaleString()}
                detail="Cleanup-group messages represented by deferred quarantine decisions."
                className="border-[var(--app-border-muted)]"
              />
              <SummaryCard
                title="Deferred review"
                value={quarantineDeferredItems.length.toLocaleString()}
                detail="No Gmail action runs here. Reopen when you want this sender back in Decisions."
                className="border-amber-900/35 bg-amber-950/8"
              />
            </div>

            <div className="rounded-2xl border border-amber-900/45 bg-amber-950/15 p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300">Controlled deferral</p>
              <p className="mt-2 text-sm text-gray-200">
                Quarantine means the sender has been deliberately parked for later review. It is a managed state, not a forgotten state, and reopening remains available whenever you want another decision pass.
              </p>
            </div>

            {quarantineDeferredItems.length > 0 ? (
              <SenderGroup
                title="Deferred review"
                subtitle="These senders are intentionally waiting for later review and can be reopened at any time."
                items={quarantineDeferredItems}
                onPushArchive={pushArchive}
                onRestoreArchive={restoreArchive}
                onReopen={reopenSender}
                pushingSenderKey={pushingSenderKey}
                restoringSenderKey={restoringSenderKey}
                reopeningSenderKey={reopeningSenderKey}
              />
            ) : null}

            {items.length === 0 ? (
              <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4 text-sm text-gray-400`}>
                No senders are currently deferred in Quarantine.
              </div>
            ) : null}
          </section>
        )
      })}

      {bucket === 'KEEP' ? (
        <section className="app-surface-card rounded-2xl p-5 space-y-4">
          <SectionHeader
            title="Keep filter"
            subtitle="Keep remains a real managed destination, but it is intentionally quiet so it does not compete with Archive, Custom Rules, or Quarantine."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard
              title="Protected senders"
              value={profilesByBucket.KEEP.length.toLocaleString()}
              detail="Managed senders with a Keep destination."
              className="border-[var(--app-border-muted)]"
            />
            <SummaryCard
              title="Message context"
              value={sumSupportingMessages(profilesByBucket.KEEP).toLocaleString()}
              detail="Cleanup-group messages represented by protected Keep decisions."
              className="border-[var(--app-border-muted)]"
            />
            <SummaryCard
              title="Quiet managed state"
              value={countByKind(profilesByBucket.KEEP, 'protected_no_action').toLocaleString()}
              detail="Keep stays visible in summary, filters, and sender rows without becoming active work."
              className="border-emerald-900/35 bg-emerald-950/8"
            />
          </div>

          <div className="rounded-2xl border border-emerald-900/35 bg-emerald-950/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">Quiet context</p>
            <p className="mt-2 text-sm text-gray-200">
              Keep is still managed so you can filter it, audit it, or reopen it later, but it remains intentionally out of the primary work sections.
            </p>
          </div>

          {profilesByBucket.KEEP.length === 0 ? (
            <div className={`${insetSurfaceClass} rounded-2xl border-dashed p-4 text-sm text-gray-400`}>
              No senders are currently protected in Keep.
            </div>
          ) : (
            <SenderGroup
              title="Protected senders"
              subtitle="These senders are intentionally quiet managed state and can be reopened if you need a new decision."
              items={profilesByBucket.KEEP}
              onPushArchive={pushArchive}
              onRestoreArchive={restoreArchive}
              onReopen={reopenSender}
              pushingSenderKey={pushingSenderKey}
              restoringSenderKey={restoringSenderKey}
              reopeningSenderKey={reopeningSenderKey}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
