'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  normalizeOperationsAnalysisScope,
  type OperationsAnalysisScope,
  fetchOperationsRuntimeSnapshot,
  deriveOperationsIntelligenceCacheVersion,
  type OperationsRuntimeData,
} from '@/lib/runtime/operationsWorkspace'
import {
  GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
  GMAIL_OPERATOR_BACKFILL_DEFAULT_WINDOW_MONTHS,
  GMAIL_OPERATOR_BACKFILL_EXTENDED_WINDOW_MONTHS,
  GMAIL_OPERATOR_BACKFILL_INTENT,
  type GmailOperatorBackfillWindowMonths,
} from '@/lib/integrations/gmail/gmailMailboxIndexConfig'

type SnapshotStatus = {
  loading: boolean
  refreshing: boolean
  error: string | null
  data: OperationsRuntimeData | null
  loadedAt: number | null
  runtimeContinuity:
    | {
        phase: 'build_pending' | 'ready'
        stableSnapshotVersion: string | null
        latestVersion: string | null
        freshnessState: string | null
        buildStatus: string | null
        publishedVersion: string | null
        buildingVersion: string | null
        updatedAt: number
      }
    | null
  mailboxIndexHealth: MailboxIndexHealth | null
  manualMailboxReindexStarting: boolean
  smartMailboxSyncStarting: boolean
  operatorMailboxBackfillStarting: boolean
  pendingSmartMailboxSyncRun: PendingMailboxIndexRun | null
  pendingOperatorMailboxBackfillRun: PendingMailboxIndexRun | null
}

type SnapshotRefreshOptions = {
  force?: boolean
  silent?: boolean
  forceMailboxProfileRefresh?: boolean
  refreshReason?: string
  transitionEdge?: 'smart_sync_handoff' | 'build_pending_poll' | null
}

type SnapshotRefreshResult =
  | { ok: true }
  | { ok: false; error: string; reason?: string | null }

type TriggerManualReindexResult =
  | { ok: true; attached: boolean }
  | { ok: false; error: string }

type TriggerSmartSyncResult =
  | { ok: true; attached: boolean }
  | { ok: false; error: string }

type TriggerMailboxBackfillResult =
  | {
      ok: true
      attached: boolean
      completed?: boolean
      backfillWindowMonths?: GmailOperatorBackfillWindowMonths | null
    }
  | { ok: false; error: string }

type PendingMailboxIndexRun = {
  run_id: string | null
  mode: 'full' | 'incremental' | null
  requested_mode: 'full' | 'incremental' | null
  effective_mode: 'full' | 'incremental' | null
  trigger:
    | 'manual_full_reindex'
    | 'smart_sync'
    | 'operator_backfill'
    | 'runtime_bootstrap'
    | 'runtime_backfill'
    | 'runtime_recovery'
    | 'analysis_refresh'
    | null
  requested_max_messages: number | null
  started_at: string | null
  started_from_checkpoint: boolean | null
  backfill_window_months: GmailOperatorBackfillWindowMonths | null
  backfill_cutoff_at: string | null
  resume_checkpoint: MailboxIndexResumeCheckpoint | null
}

type ContextValue = SnapshotStatus & {
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
  lastRefreshReason: string | null
  refreshRuntimeSnapshot: (options?: SnapshotRefreshOptions) => Promise<SnapshotRefreshResult>
  triggerManualFullMailboxReindex: () => Promise<TriggerManualReindexResult>
  triggerSmartMailboxSync: () => Promise<TriggerSmartSyncResult>
  triggerMailboxBackfill: () => Promise<TriggerMailboxBackfillResult>
  triggerMailboxBackfillExtended: () => Promise<TriggerMailboxBackfillResult>
}

type PersistedSnapshot = {
  loadedAt: number
  data: OperationsRuntimeData
  runtimeContinuity:
    | {
        phase: 'build_pending' | 'ready'
        stableSnapshotVersion: string | null
        latestVersion: string | null
        freshnessState: string | null
        buildStatus: string | null
        publishedVersion: string | null
        buildingVersion: string | null
        updatedAt: number
      }
    | null
}

type RuntimeRehydrateDiagnostics = {
  derived_cache_version?: string | null
  runtime_cleanup_plan_generated_at?: string | null
  manual_cleanup_regeneration_diagnostics?: {
    cleanupProfileStatus?: string | null
    cleanupProfileRefreshReason?: string | null
    continuityState?: 'standard' | 'build_pending_showing_stable_snapshot'
    buildPending?: boolean
    stableSnapshotServed?: boolean
    swapReady?: boolean
    publicationFreshnessState?: string | null
    publicationBuildStatus?: string | null
    publishedVersion?: string | null
    buildingVersion?: string | null
  } | null
}

type CachedMailboxIndexHealthEntry = {
  expiresAtMs: number
  data: MailboxIndexHealth
}

type MailboxIndexHealthRefreshOptions = {
  force?: boolean
}

type MailboxIndexExecutionState =
  | 'idle'
  | 'running'
  | 'stalled'
  | 'completed'
  | 'completed_no_growth'
  | 'failed'

type MailboxIndexYieldDetail = {
  inserted_rows: number
  updated_rows: number
  already_indexed_rows: number
  existing_rows_seen: number
  oldest_message_seen_at: string | null
  newest_message_seen_at: string | null
  next_page_token_present: boolean | null
}

type MailboxIndexResumeCheckpoint = {
  usable: boolean
  next_page_token_present: boolean
  page_index: number | null
  processed_messages: number | null
  processed_at: string | null
}

type MailboxIndexHistoricalBackfillSummary = {
  active_window_months: GmailOperatorBackfillWindowMonths | null
  active_cutoff_at: string | null
  completed_window_months: GmailOperatorBackfillWindowMonths | null
  completed_cutoff_at: string | null
  completed_at: string | null
}

type MailboxIndexActiveRun = {
  run_id: string | null
  mode: 'full' | 'incremental' | null
  requested_mode: 'full' | 'incremental' | null
  effective_mode: 'full' | 'incremental' | null
  trigger:
    | 'manual_full_reindex'
    | 'smart_sync'
    | 'operator_backfill'
    | 'runtime_bootstrap'
    | 'runtime_backfill'
    | 'runtime_recovery'
    | 'analysis_refresh'
    | null
  requested_max_messages: number | null
  started_at: string | null
  heartbeat_at: string | null
  started_from_checkpoint: boolean | null
  rows_before: number | null
  processed_messages: number | null
  list_pages_fetched: number | null
  backfill_window_months: GmailOperatorBackfillWindowMonths | null
  backfill_cutoff_at: string | null
  resume_checkpoint: MailboxIndexResumeCheckpoint | null
  yield_detail: MailboxIndexYieldDetail | null
}

type MailboxIndexLastResult = {
  status: string | null
  mode: 'full' | 'incremental' | null
  run_id: string | null
  trigger:
    | 'manual_full_reindex'
    | 'smart_sync'
    | 'operator_backfill'
    | 'runtime_bootstrap'
    | 'runtime_backfill'
    | 'runtime_recovery'
    | 'analysis_refresh'
    | null
  requested_mode: 'full' | 'incremental' | null
  effective_mode: 'full' | 'incremental' | null
  completed_at: string | null
  started_from_checkpoint: boolean | null
  rows_before: number | null
  rows_after: number | null
  growth_delta: number | null
  processed_messages: number | null
  upserted_messages: number | null
  deleted_messages: number | null
  failure_reason: string | null
  terminal_reason: string | null
  gmail_result_size_estimate: number | null
  list_pages_fetched: number | null
  backfill_window_months: GmailOperatorBackfillWindowMonths | null
  backfill_cutoff_at: string | null
  resume_checkpoint: MailboxIndexResumeCheckpoint | null
  yield_detail: MailboxIndexYieldDetail | null
}

type MailboxIndexHealth = {
  indexed_message_count: number
  indexed_inbox_count: number
  indexed_total_rows?: number
  indexed_inbox_rows?: number
  mailbox_estimated_total: number | null
  index_completion_pct: number | null
  indexed_oldest_message_at: string | null
  indexed_newest_message_at: string | null
  indexed_date_span_start?: string | null
  indexed_date_span_end?: string | null
  last_full_scan_at: string | null
  last_incremental_sync_at: string | null
  last_index_duration_ms: number | null
  last_sync_status: string | null
  last_sync_error: string | null
  execution_state: MailboxIndexExecutionState | null
  active_run: MailboxIndexActiveRun | null
  last_result: MailboxIndexLastResult | null
  historical_backfill: MailboxIndexHistoricalBackfillSummary | null
  requires_reconnect: boolean
  has_gmail_connection: boolean | null
  coverage_increased: boolean | null
  sync_health: 'healthy' | 'degraded_usable' | 'unavailable' | 'uninitialized' | null
  usable_with_cached_index: boolean
}

function parseMailboxIndexYieldDetail(value: unknown): MailboxIndexYieldDetail | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  return {
    inserted_rows: typeof payload.inserted_rows === 'number' ? payload.inserted_rows : 0,
    updated_rows: typeof payload.updated_rows === 'number' ? payload.updated_rows : 0,
    already_indexed_rows:
      typeof payload.already_indexed_rows === 'number' ? payload.already_indexed_rows : 0,
    existing_rows_seen: typeof payload.existing_rows_seen === 'number' ? payload.existing_rows_seen : 0,
    oldest_message_seen_at:
      typeof payload.oldest_message_seen_at === 'string' ? payload.oldest_message_seen_at : null,
    newest_message_seen_at:
      typeof payload.newest_message_seen_at === 'string' ? payload.newest_message_seen_at : null,
    next_page_token_present:
      typeof payload.next_page_token_present === 'boolean' ? payload.next_page_token_present : null,
  }
}

function parseMailboxIndexResumeCheckpoint(value: unknown): MailboxIndexResumeCheckpoint | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  return {
    usable: payload.usable === true,
    next_page_token_present: payload.next_page_token_present === true,
    page_index: typeof payload.page_index === 'number' ? payload.page_index : null,
    processed_messages:
      typeof payload.processed_messages === 'number' ? payload.processed_messages : null,
    processed_at: typeof payload.processed_at === 'string' ? payload.processed_at : null,
  }
}

function parseMailboxIndexHistoricalBackfillSummary(
  value: unknown
): MailboxIndexHistoricalBackfillSummary | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  return {
    active_window_months:
      payload.active_window_months === 24 || payload.active_window_months === 36
        ? payload.active_window_months
        : null,
    active_cutoff_at:
      typeof payload.active_cutoff_at === 'string' ? payload.active_cutoff_at : null,
    completed_window_months:
      payload.completed_window_months === 24 || payload.completed_window_months === 36
        ? payload.completed_window_months
        : null,
    completed_cutoff_at:
      typeof payload.completed_cutoff_at === 'string' ? payload.completed_cutoff_at : null,
    completed_at: typeof payload.completed_at === 'string' ? payload.completed_at : null,
  }
}

function parsePendingMailboxIndexRun(value: unknown): PendingMailboxIndexRun | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  return {
    run_id: typeof payload.run_id === 'string' ? payload.run_id : null,
    mode:
      payload.mode === 'full' || payload.mode === 'incremental' ? payload.mode : null,
    requested_mode:
      payload.requested_mode === 'full' || payload.requested_mode === 'incremental'
        ? payload.requested_mode
        : null,
    effective_mode:
      payload.effective_mode === 'full' || payload.effective_mode === 'incremental'
        ? payload.effective_mode
        : null,
    trigger:
      payload.trigger === 'manual_full_reindex' ||
      payload.trigger === 'smart_sync' ||
      payload.trigger === 'operator_backfill' ||
      payload.trigger === 'runtime_bootstrap' ||
      payload.trigger === 'runtime_backfill' ||
      payload.trigger === 'runtime_recovery' ||
      payload.trigger === 'analysis_refresh'
        ? payload.trigger
        : null,
    requested_max_messages:
      typeof payload.requested_max_messages === 'number'
        ? payload.requested_max_messages
        : typeof payload.max_messages === 'number'
          ? payload.max_messages
          : null,
    started_at: typeof payload.started_at === 'string' ? payload.started_at : new Date().toISOString(),
    started_from_checkpoint:
      typeof payload.started_from_checkpoint === 'boolean' ? payload.started_from_checkpoint : null,
    backfill_window_months:
      payload.backfill_window_months === 24 || payload.backfill_window_months === 36
        ? payload.backfill_window_months
        : null,
    backfill_cutoff_at:
      typeof payload.backfill_cutoff_at === 'string' ? payload.backfill_cutoff_at : null,
    resume_checkpoint: parseMailboxIndexResumeCheckpoint(payload.resume_checkpoint),
  }
}

function reconcileMailboxIndexHealthState(
  prev: SnapshotStatus,
  nextHealth: MailboxIndexHealth
): SnapshotStatus {
  const mailboxIndexIdle = nextHealth.execution_state !== 'running' && nextHealth.active_run == null
  const smartSyncObserved =
    nextHealth.active_run?.trigger === 'smart_sync' || nextHealth.last_result?.trigger === 'smart_sync'
  const operatorBackfillObserved =
    nextHealth.active_run?.trigger === 'operator_backfill' ||
    nextHealth.last_result?.trigger === 'operator_backfill'

  return {
    ...prev,
    mailboxIndexHealth: nextHealth,
    manualMailboxReindexStarting: mailboxIndexIdle ? false : prev.manualMailboxReindexStarting,
    smartMailboxSyncStarting: mailboxIndexIdle ? false : prev.smartMailboxSyncStarting,
    operatorMailboxBackfillStarting: mailboxIndexIdle ? false : prev.operatorMailboxBackfillStarting,
    pendingSmartMailboxSyncRun: mailboxIndexIdle
      ? null
      : smartSyncObserved
        ? null
        : prev.pendingSmartMailboxSyncRun,
    pendingOperatorMailboxBackfillRun: mailboxIndexIdle
      ? null
      : operatorBackfillObserved
        ? null
        : prev.pendingOperatorMailboxBackfillRun,
  }
}

async function fetchMailboxIndexHealth(
  options?: MailboxIndexHealthRefreshOptions
): Promise<MailboxIndexHealth | null> {
  const nowMs = Date.now()
  if (options?.force === true) {
    clearCachedMailboxIndexHealth()
  } else {
    const cachedHealth = readCachedMailboxIndexHealth(nowMs)
    if (cachedHealth) return cachedHealth
  }
  if (mailboxIndexHealthInflight) {
    return mailboxIndexHealthInflight
  }

  try {
    const request = (async (): Promise<MailboxIndexHealth | null> => {
      const res = await fetch('/api/integrations/gmail/mailbox-index', {
        method: 'GET',
        cache: 'no-store',
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            data?: Partial<MailboxIndexHealth>
          }
        | null
      if (!res.ok || !payload?.ok || !payload.data) return null
      const activeRunPayload =
        payload.data.active_run && typeof payload.data.active_run === 'object'
          ? payload.data.active_run
          : null
      const lastResultPayload =
        payload.data.last_result && typeof payload.data.last_result === 'object'
          ? payload.data.last_result
          : null
      const data: MailboxIndexHealth = {
      indexed_message_count:
        typeof payload.data.indexed_total_rows === 'number'
          ? payload.data.indexed_total_rows
          : typeof payload.data.indexed_message_count === 'number'
            ? payload.data.indexed_message_count
            : 0,
      indexed_inbox_count:
        typeof payload.data.indexed_inbox_rows === 'number'
          ? payload.data.indexed_inbox_rows
          : typeof payload.data.indexed_inbox_count === 'number'
            ? payload.data.indexed_inbox_count
            : 0,
      indexed_total_rows:
        typeof payload.data.indexed_total_rows === 'number' ? payload.data.indexed_total_rows : undefined,
      indexed_inbox_rows:
        typeof payload.data.indexed_inbox_rows === 'number' ? payload.data.indexed_inbox_rows : undefined,
      mailbox_estimated_total:
        typeof payload.data.mailbox_estimated_total === 'number'
          ? payload.data.mailbox_estimated_total
          : null,
      index_completion_pct:
        typeof payload.data.index_completion_pct === 'number' ? payload.data.index_completion_pct : null,
      indexed_oldest_message_at:
        typeof payload.data.indexed_date_span_start === 'string'
          ? payload.data.indexed_date_span_start
          : typeof payload.data.indexed_oldest_message_at === 'string'
            ? payload.data.indexed_oldest_message_at
          : null,
      indexed_newest_message_at:
        typeof payload.data.indexed_date_span_end === 'string'
          ? payload.data.indexed_date_span_end
          : typeof payload.data.indexed_newest_message_at === 'string'
            ? payload.data.indexed_newest_message_at
          : null,
      last_full_scan_at:
        typeof payload.data.last_full_scan_at === 'string' ? payload.data.last_full_scan_at : null,
      last_incremental_sync_at:
        typeof payload.data.last_incremental_sync_at === 'string'
          ? payload.data.last_incremental_sync_at
          : null,
      last_index_duration_ms:
        typeof payload.data.last_index_duration_ms === 'number' ? payload.data.last_index_duration_ms : null,
      last_sync_status: typeof payload.data.last_sync_status === 'string' ? payload.data.last_sync_status : null,
      last_sync_error: typeof payload.data.last_sync_error === 'string' ? payload.data.last_sync_error : null,
      execution_state:
        payload.data.execution_state === 'idle' ||
        payload.data.execution_state === 'running' ||
        payload.data.execution_state === 'stalled' ||
        payload.data.execution_state === 'completed' ||
        payload.data.execution_state === 'completed_no_growth' ||
        payload.data.execution_state === 'failed'
          ? payload.data.execution_state
          : null,
      active_run: activeRunPayload
        ? {
            run_id: typeof activeRunPayload.run_id === 'string' ? activeRunPayload.run_id : null,
            mode:
              activeRunPayload.mode === 'full' || activeRunPayload.mode === 'incremental'
                ? activeRunPayload.mode
                : null,
            requested_mode:
              activeRunPayload.requested_mode === 'full' ||
              activeRunPayload.requested_mode === 'incremental'
                ? activeRunPayload.requested_mode
                : null,
            effective_mode:
              activeRunPayload.effective_mode === 'full' ||
              activeRunPayload.effective_mode === 'incremental'
                ? activeRunPayload.effective_mode
                : null,
            trigger:
              activeRunPayload.trigger === 'manual_full_reindex' ||
              activeRunPayload.trigger === 'smart_sync' ||
              activeRunPayload.trigger === 'operator_backfill' ||
              activeRunPayload.trigger === 'runtime_bootstrap' ||
              activeRunPayload.trigger === 'runtime_backfill' ||
              activeRunPayload.trigger === 'runtime_recovery' ||
              activeRunPayload.trigger === 'analysis_refresh'
                ? activeRunPayload.trigger
                : null,
            requested_max_messages:
              typeof activeRunPayload.requested_max_messages === 'number'
                ? activeRunPayload.requested_max_messages
                : null,
            started_at: typeof activeRunPayload.started_at === 'string' ? activeRunPayload.started_at : null,
            heartbeat_at:
              typeof activeRunPayload.heartbeat_at === 'string' ? activeRunPayload.heartbeat_at : null,
            started_from_checkpoint:
              typeof activeRunPayload.started_from_checkpoint === 'boolean'
                ? activeRunPayload.started_from_checkpoint
                : null,
            rows_before:
              typeof activeRunPayload.rows_before === 'number' ? activeRunPayload.rows_before : null,
            processed_messages:
              typeof activeRunPayload.processed_messages === 'number'
                ? activeRunPayload.processed_messages
                : null,
            list_pages_fetched:
              typeof activeRunPayload.list_pages_fetched === 'number'
                ? activeRunPayload.list_pages_fetched
                : null,
            backfill_window_months:
              activeRunPayload.backfill_window_months === 24 ||
              activeRunPayload.backfill_window_months === 36
                ? activeRunPayload.backfill_window_months
                : null,
            backfill_cutoff_at:
              typeof activeRunPayload.backfill_cutoff_at === 'string'
                ? activeRunPayload.backfill_cutoff_at
                : null,
            resume_checkpoint: parseMailboxIndexResumeCheckpoint(
              'resume_checkpoint' in activeRunPayload ? activeRunPayload.resume_checkpoint : null
            ),
            yield_detail: parseMailboxIndexYieldDetail(
              'yield_detail' in activeRunPayload ? activeRunPayload.yield_detail : null
            ),
          }
        : null,
      last_result: lastResultPayload
        ? {
            status: typeof lastResultPayload.status === 'string' ? lastResultPayload.status : null,
            mode:
              lastResultPayload.mode === 'full' || lastResultPayload.mode === 'incremental'
                ? lastResultPayload.mode
                : null,
            run_id: typeof lastResultPayload.run_id === 'string' ? lastResultPayload.run_id : null,
            trigger:
              lastResultPayload.trigger === 'manual_full_reindex' ||
              lastResultPayload.trigger === 'smart_sync' ||
              lastResultPayload.trigger === 'operator_backfill' ||
              lastResultPayload.trigger === 'runtime_bootstrap' ||
              lastResultPayload.trigger === 'runtime_backfill' ||
              lastResultPayload.trigger === 'runtime_recovery' ||
              lastResultPayload.trigger === 'analysis_refresh'
                ? lastResultPayload.trigger
                : null,
            requested_mode:
              lastResultPayload.requested_mode === 'full' ||
              lastResultPayload.requested_mode === 'incremental'
                ? lastResultPayload.requested_mode
                : null,
            effective_mode:
              lastResultPayload.effective_mode === 'full' ||
              lastResultPayload.effective_mode === 'incremental'
                ? lastResultPayload.effective_mode
                : null,
            completed_at:
              typeof lastResultPayload.completed_at === 'string' ? lastResultPayload.completed_at : null,
            started_from_checkpoint:
              typeof lastResultPayload.started_from_checkpoint === 'boolean'
                ? lastResultPayload.started_from_checkpoint
                : null,
            rows_before:
              typeof lastResultPayload.rows_before === 'number' ? lastResultPayload.rows_before : null,
            rows_after:
              typeof lastResultPayload.rows_after === 'number' ? lastResultPayload.rows_after : null,
            growth_delta:
              typeof lastResultPayload.growth_delta === 'number' ? lastResultPayload.growth_delta : null,
            processed_messages:
              typeof lastResultPayload.processed_messages === 'number'
                ? lastResultPayload.processed_messages
                : null,
            upserted_messages:
              typeof lastResultPayload.upserted_messages === 'number'
                ? lastResultPayload.upserted_messages
                : null,
            deleted_messages:
              typeof lastResultPayload.deleted_messages === 'number'
                ? lastResultPayload.deleted_messages
                : null,
            failure_reason:
              typeof lastResultPayload.failure_reason === 'string' ? lastResultPayload.failure_reason : null,
            terminal_reason:
              typeof lastResultPayload.terminal_reason === 'string'
                ? lastResultPayload.terminal_reason
                : null,
            gmail_result_size_estimate:
              typeof lastResultPayload.gmail_result_size_estimate === 'number'
                ? lastResultPayload.gmail_result_size_estimate
                : null,
            list_pages_fetched:
              typeof lastResultPayload.list_pages_fetched === 'number'
                ? lastResultPayload.list_pages_fetched
                : null,
            backfill_window_months:
              lastResultPayload.backfill_window_months === 24 ||
              lastResultPayload.backfill_window_months === 36
                ? lastResultPayload.backfill_window_months
                : null,
            backfill_cutoff_at:
              typeof lastResultPayload.backfill_cutoff_at === 'string'
                ? lastResultPayload.backfill_cutoff_at
                : null,
            resume_checkpoint: parseMailboxIndexResumeCheckpoint(
              'resume_checkpoint' in lastResultPayload ? lastResultPayload.resume_checkpoint : null
            ),
            yield_detail: parseMailboxIndexYieldDetail(
              'yield_detail' in lastResultPayload ? lastResultPayload.yield_detail : null
            ),
          }
        : null,
      historical_backfill: parseMailboxIndexHistoricalBackfillSummary(payload.data.historical_backfill),
      requires_reconnect: payload.data.requires_reconnect === true,
      has_gmail_connection:
        payload.data.has_gmail_connection === true
          ? true
          : payload.data.has_gmail_connection === false
            ? false
            : null,
      coverage_increased:
        typeof payload.data.coverage_increased === 'boolean' ? payload.data.coverage_increased : null,
      sync_health:
        payload.data.sync_health === 'healthy' ||
        payload.data.sync_health === 'degraded_usable' ||
        payload.data.sync_health === 'unavailable' ||
        payload.data.sync_health === 'uninitialized'
          ? payload.data.sync_health
          : null,
      usable_with_cached_index: payload.data.usable_with_cached_index === true,
      }

      mailboxIndexHealthCache = {
        expiresAtMs: Date.now() + MAILBOX_INDEX_HEALTH_CACHE_TTL_MS,
        data,
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            MAILBOX_INDEX_HEALTH_STORAGE_KEY,
            JSON.stringify(mailboxIndexHealthCache)
          )
        } catch {
          // Ignore cache write failures; the in-memory cache remains the primary fast path.
        }
      }
      return data
    })()

    mailboxIndexHealthInflight = request
    return await request
  } catch {
    return null
  } finally {
    mailboxIndexHealthInflight = null
  }
}

function readCachedMailboxIndexHealth(nowMs = Date.now()): MailboxIndexHealth | null {
  if (mailboxIndexHealthCache && mailboxIndexHealthCache.expiresAtMs > nowMs) {
    return mailboxIndexHealthCache.data
  }
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(MAILBOX_INDEX_HEALTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedMailboxIndexHealthEntry | null
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.expiresAtMs === 'number' &&
      parsed.expiresAtMs > nowMs &&
      parsed.data &&
      typeof parsed.data === 'object'
    ) {
      mailboxIndexHealthCache = parsed
      return parsed.data
    }
  } catch {
    return null
  }
  return null
}

function clearCachedMailboxIndexHealth() {
  mailboxIndexHealthCache = null
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(MAILBOX_INDEX_HEALTH_STORAGE_KEY)
  } catch {
    // Ignore storage failures; the next network fetch remains authoritative.
  }
}

const OperationsRuntimeContext = createContext<ContextValue | null>(null)

const STORAGE_PREFIX = 'operations.runtime.snapshot.v2'
const MAILBOX_INDEX_HEALTH_STORAGE_KEY = 'operations.mailbox-index.health.v1'
const MAILBOX_INDEX_HEALTH_CACHE_TTL_MS = 15 * 1000
const BUILD_PENDING_READY_POLL_INTERVAL_MS = 15000

const MEMORY_CACHE = new Map<string, PersistedSnapshot>()
let mailboxIndexHealthCache: CachedMailboxIndexHealthEntry | null = null
let mailboxIndexHealthInflight: Promise<MailboxIndexHealth | null> | null = null

function buildStorageKey(
  agentId: string,
  sessionId: string | null,
  analysisScope: OperationsAnalysisScope,
  preferredClusterId?: string | null
): string {
  return `${STORAGE_PREFIX}:${agentId}:${sessionId || 'none'}:${analysisScope}:${
    preferredClusterId || 'none'
  }`
}

function parsePersisted(value: string | null): PersistedSnapshot | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<PersistedSnapshot>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.loadedAt !== 'number' ||
      !parsed.data ||
      typeof parsed.data !== 'object'
    ) {
      return null
    }
    return {
      loadedAt: parsed.loadedAt,
      data: parsed.data as OperationsRuntimeData,
      runtimeContinuity:
        parsed.runtimeContinuity &&
        typeof parsed.runtimeContinuity === 'object' &&
        (parsed.runtimeContinuity.phase === 'build_pending' ||
          parsed.runtimeContinuity.phase === 'ready')
          ? {
              phase: parsed.runtimeContinuity.phase,
              stableSnapshotVersion:
                typeof parsed.runtimeContinuity.stableSnapshotVersion === 'string'
                  ? parsed.runtimeContinuity.stableSnapshotVersion
                  : null,
              latestVersion:
                typeof parsed.runtimeContinuity.latestVersion === 'string'
                  ? parsed.runtimeContinuity.latestVersion
                  : null,
              freshnessState:
                typeof parsed.runtimeContinuity.freshnessState === 'string'
                  ? parsed.runtimeContinuity.freshnessState
                  : null,
              buildStatus:
                typeof parsed.runtimeContinuity.buildStatus === 'string'
                  ? parsed.runtimeContinuity.buildStatus
                  : null,
              publishedVersion:
                typeof parsed.runtimeContinuity.publishedVersion === 'string'
                  ? parsed.runtimeContinuity.publishedVersion
                  : null,
              buildingVersion:
                typeof parsed.runtimeContinuity.buildingVersion === 'string'
                  ? parsed.runtimeContinuity.buildingVersion
                  : null,
              updatedAt:
                typeof parsed.runtimeContinuity.updatedAt === 'number'
                  ? parsed.runtimeContinuity.updatedAt
                  : parsed.loadedAt,
            }
          : null,
    }
  } catch {
    return null
  }
}

function readRuntimeRehydrateDiagnostics(
  runtimeData: OperationsRuntimeData | null | undefined
): RuntimeRehydrateDiagnostics | null {
  if (!runtimeData || typeof runtimeData !== 'object') return null
  const diagnostics = (
    runtimeData as OperationsRuntimeData & {
      runtime_rehydrate_diagnostics?: RuntimeRehydrateDiagnostics
    }
  ).runtime_rehydrate_diagnostics
  return diagnostics && typeof diagnostics === 'object' ? diagnostics : null
}

function isFailedArtifactStandardRehydrateState(
  runtimeData: OperationsRuntimeData | null | undefined
): boolean {
  const diagnostics = readRuntimeRehydrateDiagnostics(runtimeData)
  const regenerationDiagnostics = diagnostics?.manual_cleanup_regeneration_diagnostics
  if (!regenerationDiagnostics) return false

  const continuityState = regenerationDiagnostics.continuityState || 'standard'
  const freshnessState = regenerationDiagnostics.publicationFreshnessState || null
  const buildStatus = regenerationDiagnostics.publicationBuildStatus || null
  const cleanupProfileStatus = regenerationDiagnostics.cleanupProfileStatus || null
  const cleanupProfileRefreshReason = regenerationDiagnostics.cleanupProfileRefreshReason || null

  return (
    continuityState === 'standard' &&
    freshnessState === 'refresh_failed' &&
    buildStatus === 'failed' &&
    cleanupProfileStatus === 'cached' &&
    cleanupProfileRefreshReason === 'artifact_fresh'
  )
}

function mailboxIndexSnapshotChanged(
  runtimeData: OperationsRuntimeData | null,
  health: MailboxIndexHealth | null
): boolean {
  if (!runtimeData || !health) return false
  const sourceCounts = runtimeData.runtime_mailbox_profile?.cluster_diagnostics?.source_counts
  if (!sourceCounts) return false

  const indexedTotalRows =
    typeof sourceCounts.indexed_total_rows === 'number' ? sourceCounts.indexed_total_rows : null
  const indexedInboxRows =
    typeof sourceCounts.indexed_inbox_rows === 'number' ? sourceCounts.indexed_inbox_rows : null
  const indexedDateSpanStart =
    typeof sourceCounts.indexed_date_span_start === 'string' ? sourceCounts.indexed_date_span_start : null
  const indexedDateSpanEnd =
    typeof sourceCounts.indexed_date_span_end === 'string' ? sourceCounts.indexed_date_span_end : null

  if (indexedTotalRows != null && indexedTotalRows !== health.indexed_message_count) return true
  if (indexedInboxRows != null && indexedInboxRows !== health.indexed_inbox_count) return true
  if ((indexedDateSpanStart || null) !== (health.indexed_oldest_message_at || null)) return true
  if ((indexedDateSpanEnd || null) !== (health.indexed_newest_message_at || null)) return true
  return false
}

function mergeBuildPendingRuntimeData(
  previousData: OperationsRuntimeData,
  incomingData: OperationsRuntimeData
): OperationsRuntimeData {
  return {
    session_id: incomingData.session_id ?? previousData.session_id,
    runtime_evidence: incomingData.runtime_evidence ?? previousData.runtime_evidence,
    runtime_cleanup_plan: incomingData.runtime_cleanup_plan ?? previousData.runtime_cleanup_plan,
    runtime_review_results: incomingData.runtime_review_results ?? previousData.runtime_review_results,
    runtime_suggestion_sets:
      incomingData.runtime_suggestion_sets ?? previousData.runtime_suggestion_sets,
    runtime_approval_queue_summary:
      incomingData.runtime_approval_queue_summary ?? previousData.runtime_approval_queue_summary,
    runtime_approval_queue_items:
      incomingData.runtime_approval_queue_items ?? previousData.runtime_approval_queue_items,
    runtime_mailbox_profile:
      incomingData.runtime_mailbox_profile ?? previousData.runtime_mailbox_profile,
    runtime_mailbox_intelligence:
      incomingData.runtime_mailbox_intelligence ?? previousData.runtime_mailbox_intelligence,
    runtime_sender_overview:
      incomingData.runtime_sender_overview ?? previousData.runtime_sender_overview,
    runtime_selected_cluster_rail_family:
      incomingData.runtime_selected_cluster_rail_family ??
      previousData.runtime_selected_cluster_rail_family,
    runtime_cleanup_strategy:
      incomingData.runtime_cleanup_strategy ?? previousData.runtime_cleanup_strategy,
  }
}

export function OperationsRuntimeProvider(props: {
  agentId: string
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
  preferredClusterId?: string | null
  children: ReactNode
}) {
  const sessionId = props.sessionId?.trim() ? props.sessionId.trim() : null
  const analysisScope = normalizeOperationsAnalysisScope(props.analysisScope)
  const [status, setStatus] = useState<SnapshotStatus>({
    loading: true,
    refreshing: false,
    error: null,
    data: null,
    loadedAt: null,
    runtimeContinuity: null,
    mailboxIndexHealth: null,
    manualMailboxReindexStarting: false,
    smartMailboxSyncStarting: false,
    operatorMailboxBackfillStarting: false,
    pendingSmartMailboxSyncRun: null,
    pendingOperatorMailboxBackfillRun: null,
  })
  const requestInFlightRef = useRef<{
    key: string
    forceMailboxProfileRefresh: boolean
    promise: Promise<SnapshotRefreshResult>
  } | null>(null)
  const latestRequestKeyRef = useRef<string | null>(null)
  const lastRefreshReasonRef = useRef<string | null>(null)
  const latestSnapshotVersionRef = useRef<string | null>(null)
  const latestRuntimeContinuityRef = useRef<SnapshotStatus['runtimeContinuity']>(null)
  const runtimeProviderUnmountedRef = useRef(false)
  const hydratedStorageKeyRef = useRef<string | null>(null)
  const smartSyncWasRunningRef = useRef(false)
  const smartSyncObservedCycleRef = useRef<{
    awaitingCompletion: boolean
    runKey: string | null
    runId: string | null
    baselineCompletionKey: string | null
  } | null>(null)
  const handledSmartSyncCompletionKeyRef = useRef<string | null>(null)
  const smartSyncContinuityRefreshRef = useRef<{
    completionKey: string
    cancelled: boolean
  } | null>(null)
  const storageKey = useMemo(
    () => buildStorageKey(props.agentId, sessionId, analysisScope, props.preferredClusterId),
    [analysisScope, props.agentId, props.preferredClusterId, sessionId]
  )

  const refreshMailboxIndexHealth = useCallback(
    async (options?: MailboxIndexHealthRefreshOptions): Promise<MailboxIndexHealth | null> => {
      const nextHealth = await fetchMailboxIndexHealth(options)
      if (!nextHealth) return null
      setStatus((prev) => reconcileMailboxIndexHealthState(prev, nextHealth))
      return nextHealth
    },
    []
  )

  const runtimeSnapshotVersion = useMemo(
    () => deriveOperationsIntelligenceCacheVersion(status.data, status.loadedAt),
    [status.data, status.loadedAt]
  )
  const failedArtifactRehydrateHoldActive = useMemo(
    () => isFailedArtifactStandardRehydrateState(status.data),
    [status.data]
  )

  useEffect(() => {
    latestSnapshotVersionRef.current = runtimeSnapshotVersion
  }, [runtimeSnapshotVersion])

  useEffect(() => {
    latestRuntimeContinuityRef.current = status.runtimeContinuity
  }, [status.runtimeContinuity])

  useEffect(() => {
    runtimeProviderUnmountedRef.current = false
    return () => {
      runtimeProviderUnmountedRef.current = true
      if (smartSyncContinuityRefreshRef.current) {
        smartSyncContinuityRefreshRef.current.cancelled = true
        smartSyncContinuityRefreshRef.current = null
      }
    }
  }, [])

  const maybeBootstrapMailboxIndex = useCallback(
    async (health: MailboxIndexHealth | null) => {
      void health
      // Emergency stabilization: passive runtime loads must not auto-start mailbox indexing.
    },
    []
  )

  const maybeRecoverDegradedIndexSync = useCallback(
    async (health: MailboxIndexHealth | null, refreshReason?: string | null) => {
      void health
      void refreshReason
      // Emergency stabilization: passive runtime loads must not auto-start mailbox recovery.
    },
    []
  )

  const triggerManualFullMailboxReindex = useCallback(async (): Promise<TriggerManualReindexResult> => {
    setStatus((prev) => ({ ...prev, manualMailboxReindexStarting: true }))
    void refreshMailboxIndexHealth({ force: true })
    try {
      const res = await fetch('/api/integrations/gmail/mailbox-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'full',
          background: false,
          max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
          trigger: 'manual_full_reindex',
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            reason?: string
          }
        | null

      await refreshMailboxIndexHealth({ force: true })

      if (res.status === 409 && payload?.reason === 'already_running') {
        return { ok: true, attached: true }
      }
      if (!res.ok || !payload?.ok) {
        return {
          ok: false,
          error: payload?.error || 'Failed to start full mailbox reindex.',
        }
      }
      return { ok: true, attached: false }
    } catch {
      return { ok: false, error: 'Failed to start full mailbox reindex.' }
    } finally {
      setStatus((prev) => ({ ...prev, manualMailboxReindexStarting: false }))
      await refreshMailboxIndexHealth({ force: true })
    }
  }, [refreshMailboxIndexHealth])

  const triggerSmartMailboxSync = useCallback(async (): Promise<TriggerSmartSyncResult> => {
    setStatus((prev) => ({
      ...prev,
      runtimeContinuity: null,
      smartMailboxSyncStarting: true,
      pendingSmartMailboxSyncRun: null,
    }))
    void refreshMailboxIndexHealth({ force: true })
    try {
      const res = await fetch('/api/integrations/gmail/mailbox-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'incremental',
          background: true,
          max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
          trigger: 'smart_sync',
        }),
      })
      const payload = (await res.json().catch(() => null)) as
        | {
            ok?: boolean
            error?: string
            reason?: string
            deferred?: boolean
            data?: unknown
          }
        | null

      await refreshMailboxIndexHealth({ force: true })

      if (res.status === 409 && payload?.reason === 'already_running') {
        return { ok: true, attached: true }
      }
      if (res.ok && payload?.ok && payload?.deferred === true) {
        return { ok: true, attached: true }
      }
      if (res.ok && payload?.ok) {
        const pendingRun = parsePendingMailboxIndexRun(payload?.data)
        setStatus((prev) => ({
          ...prev,
          pendingSmartMailboxSyncRun: pendingRun?.trigger === 'smart_sync' ? pendingRun : prev.pendingSmartMailboxSyncRun,
        }))
        return { ok: true, attached: false }
      }
      return {
        ok: false,
        error: payload?.error || 'Failed to start Smart Sync.',
      }
    } catch {
      return { ok: false, error: 'Failed to start Smart Sync.' }
    } finally {
      setStatus((prev) => ({ ...prev, smartMailboxSyncStarting: false }))
      await refreshMailboxIndexHealth({ force: true })
    }
  }, [refreshMailboxIndexHealth])

  const triggerMailboxBackfillForWindow = useCallback(
    async (
      backfillWindowMonths: GmailOperatorBackfillWindowMonths
    ): Promise<TriggerMailboxBackfillResult> => {
      setStatus((prev) => ({
        ...prev,
        operatorMailboxBackfillStarting: true,
        pendingOperatorMailboxBackfillRun: null,
      }))
      void refreshMailboxIndexHealth({ force: true })
      try {
        const res = await fetch('/api/integrations/gmail/mailbox-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'full',
            background: true,
            max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            trigger: 'operator_backfill',
            operator_intent: GMAIL_OPERATOR_BACKFILL_INTENT,
            backfill_window_months: backfillWindowMonths,
          }),
        })
        const payload = (await res.json().catch(() => null)) as
          | {
              ok?: boolean
              error?: string
              reason?: string
              deferred?: boolean
              complete?: boolean
              data?: unknown
            }
          | null

        await refreshMailboxIndexHealth({ force: true })

        if (res.status === 409 && payload?.reason === 'already_running') {
          return { ok: true, attached: true, backfillWindowMonths }
        }
        if (res.ok && payload?.ok && payload?.deferred === true) {
          return { ok: true, attached: true, backfillWindowMonths }
        }
        if (res.ok && payload?.ok && payload?.reason === 'historical_window_complete') {
          return {
            ok: true,
            attached: false,
            completed: true,
            backfillWindowMonths,
          }
        }
        if (res.ok && payload?.ok) {
          const pendingRun = parsePendingMailboxIndexRun(payload?.data)
          setStatus((prev) => ({
            ...prev,
            pendingOperatorMailboxBackfillRun:
              pendingRun?.trigger === 'operator_backfill'
                ? pendingRun
                : prev.pendingOperatorMailboxBackfillRun,
          }))
          return { ok: true, attached: false, backfillWindowMonths }
        }
        return {
          ok: false,
          error: payload?.error || 'Failed to start Continue Backfill.',
        }
      } catch {
        return { ok: false, error: 'Failed to start Continue Backfill.' }
      } finally {
        setStatus((prev) => ({ ...prev, operatorMailboxBackfillStarting: false }))
        await refreshMailboxIndexHealth({ force: true })
      }
    },
    [refreshMailboxIndexHealth]
  )

  const triggerMailboxBackfill = useCallback(
    () => triggerMailboxBackfillForWindow(GMAIL_OPERATOR_BACKFILL_DEFAULT_WINDOW_MONTHS),
    [triggerMailboxBackfillForWindow]
  )

  const triggerMailboxBackfillExtended = useCallback(
    () => triggerMailboxBackfillForWindow(GMAIL_OPERATOR_BACKFILL_EXTENDED_WINDOW_MONTHS),
    [triggerMailboxBackfillForWindow]
  )

  const persistSnapshot = useCallback(
    (
      loadedAt: number,
      data: OperationsRuntimeData,
      runtimeContinuity: SnapshotStatus['runtimeContinuity']
    ) => {
      MEMORY_CACHE.set(storageKey, { loadedAt, data, runtimeContinuity })
      if (typeof window === 'undefined') return
      try {
        const payload: PersistedSnapshot = { loadedAt, data, runtimeContinuity }
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        // ignore storage failure
      }
    },
    [storageKey]
  )

  const refreshRuntimeSnapshot = useCallback(
    async (options?: SnapshotRefreshOptions): Promise<SnapshotRefreshResult> => {
      if (!props.agentId.trim()) {
        return { ok: false, error: 'Missing agent id.', reason: 'missing_agent_id' }
      }
      const requestKey = [
        props.agentId,
        sessionId || 'none',
        analysisScope,
        props.preferredClusterId || 'none',
      ].join('::')
      latestRequestKeyRef.current = requestKey
      if (requestInFlightRef.current?.key === requestKey) {
        const inflightRequest = requestInFlightRef.current
        await requestInFlightRef.current.promise
        if (
          options?.forceMailboxProfileRefresh !== true ||
          inflightRequest.forceMailboxProfileRefresh
        ) {
          return { ok: true }
        }
      }

      const request = (async (): Promise<SnapshotRefreshResult> => {
        setStatus((prev) => ({
          ...prev,
          loading: options?.silent ? prev.loading : !prev.data,
          refreshing: true,
          error: null,
        }))

        try {
          const mailboxIndexHealthPromise =
            options?.forceMailboxProfileRefresh === true
              ? fetchMailboxIndexHealth({ force: true })
              : status.mailboxIndexHealth
                ? Promise.resolve(status.mailboxIndexHealth)
                : fetchMailboxIndexHealth()
          const [payload, mailboxIndexHealth] = await Promise.all([
            fetchOperationsRuntimeSnapshot({
              agentId: props.agentId,
              sessionId,
              analysisScope,
              forceMailboxProfileRefresh: options?.forceMailboxProfileRefresh === true,
              preferredClusterId: props.preferredClusterId,
              transitionEdge: options?.transitionEdge ?? null,
            }),
            mailboxIndexHealthPromise,
          ])
          if (latestRequestKeyRef.current !== requestKey) {
            return { ok: true }
          }
          if (!payload.ok || !payload.data) {
            setStatus((prev) => {
              const nextStatus: SnapshotStatus = {
                ...prev,
                loading: false,
                refreshing: false,
                error: payload.error || 'Failed to load runtime snapshot.',
                mailboxIndexHealth: mailboxIndexHealth ?? prev.mailboxIndexHealth,
              }
              return mailboxIndexHealth
                ? reconcileMailboxIndexHealthState(nextStatus, mailboxIndexHealth)
                : nextStatus
            })
            return {
              ok: false,
              error: payload.error || 'Failed to load runtime snapshot.',
              reason: payload.reason || null,
            }
          }
          const runtimeData = payload.data as OperationsRuntimeData
          const loadedAt = Date.now()
          const rehydrateDiagnostics = readRuntimeRehydrateDiagnostics(runtimeData)
          const regenerationDiagnostics =
            rehydrateDiagnostics?.manual_cleanup_regeneration_diagnostics || null
          const buildPending =
            regenerationDiagnostics?.continuityState === 'build_pending_showing_stable_snapshot' ||
            regenerationDiagnostics?.buildPending === true
          let persistedLoadedAt: number | null = null
          let persistedData: OperationsRuntimeData | null = null
          let persistedRuntimeContinuity: SnapshotStatus['runtimeContinuity'] = null
          setStatus((prev) => {
            const shouldKeepStableSnapshotMounted = buildPending && prev.data != null
            const nextData: OperationsRuntimeData = shouldKeepStableSnapshotMounted
              ? mergeBuildPendingRuntimeData(prev.data as OperationsRuntimeData, runtimeData)
              : runtimeData
            const nextLoadedAt =
              shouldKeepStableSnapshotMounted && prev.loadedAt != null ? prev.loadedAt : loadedAt
            const nextDerivedVersion = deriveOperationsIntelligenceCacheVersion(nextData, nextLoadedAt)
            let nextRuntimeContinuity = prev.runtimeContinuity

            if (buildPending) {
              nextRuntimeContinuity = {
                phase: 'build_pending',
                stableSnapshotVersion:
                  prev.runtimeContinuity?.stableSnapshotVersion ||
                  latestSnapshotVersionRef.current ||
                  nextDerivedVersion ||
                  rehydrateDiagnostics?.derived_cache_version ||
                  rehydrateDiagnostics?.runtime_cleanup_plan_generated_at ||
                  null,
                latestVersion: nextDerivedVersion,
                freshnessState: regenerationDiagnostics?.publicationFreshnessState || null,
                buildStatus: regenerationDiagnostics?.publicationBuildStatus || null,
                publishedVersion: regenerationDiagnostics?.publishedVersion || null,
                buildingVersion: regenerationDiagnostics?.buildingVersion || null,
                updatedAt: Date.now(),
              }
            } else if (
              prev.runtimeContinuity?.phase === 'build_pending' &&
              nextDerivedVersion &&
              nextDerivedVersion !== prev.runtimeContinuity.stableSnapshotVersion
            ) {
              nextRuntimeContinuity = {
                phase: 'ready',
                stableSnapshotVersion: prev.runtimeContinuity.stableSnapshotVersion,
                latestVersion: nextDerivedVersion,
                freshnessState: regenerationDiagnostics?.publicationFreshnessState || null,
                buildStatus: regenerationDiagnostics?.publicationBuildStatus || null,
                publishedVersion: regenerationDiagnostics?.publishedVersion || null,
                buildingVersion: regenerationDiagnostics?.buildingVersion || null,
                updatedAt: Date.now(),
              }
            } else if (prev.runtimeContinuity?.phase !== 'ready') {
              nextRuntimeContinuity = null
            }

            persistedLoadedAt = nextLoadedAt
            persistedData = nextData
            persistedRuntimeContinuity = nextRuntimeContinuity
            const nextStatus: SnapshotStatus = {
              ...prev,
              loading: false,
              refreshing: false,
              error: null,
              data: nextData,
              loadedAt: nextLoadedAt,
              runtimeContinuity: nextRuntimeContinuity,
              mailboxIndexHealth: mailboxIndexHealth ?? prev.mailboxIndexHealth,
            }
            return mailboxIndexHealth
              ? reconcileMailboxIndexHealthState(nextStatus, mailboxIndexHealth)
              : nextStatus
          })
          if (persistedData) {
            persistSnapshot(
              persistedLoadedAt ?? loadedAt,
              persistedData,
              persistedRuntimeContinuity
            )
          }
          const effectiveRefreshReason =
            options?.refreshReason?.trim() ||
            (options?.forceMailboxProfileRefresh ? 'manual_regenerate' : null)
          void maybeBootstrapMailboxIndex(mailboxIndexHealth)
          void maybeRecoverDegradedIndexSync(mailboxIndexHealth, effectiveRefreshReason)
          return { ok: true }
        } catch {
          if (latestRequestKeyRef.current !== requestKey) {
            return { ok: true }
          }
          setStatus((prev) => ({
            ...prev,
            loading: false,
            refreshing: false,
            error: 'Failed to load runtime snapshot.',
            mailboxIndexHealth: prev.mailboxIndexHealth,
          }))
          return {
            ok: false,
            error: 'Failed to load runtime snapshot.',
            reason: null,
          }
        }
      })()

      requestInFlightRef.current = {
        key: requestKey,
        forceMailboxProfileRefresh: options?.forceMailboxProfileRefresh === true,
        promise: request,
      }
      try {
        if (options?.refreshReason && options.refreshReason.trim()) {
          lastRefreshReasonRef.current = options.refreshReason.trim()
        } else if (options?.forceMailboxProfileRefresh) {
          lastRefreshReasonRef.current = 'manual_regenerate'
        }
        return await request
      } finally {
        if (requestInFlightRef.current?.key === requestKey) {
          requestInFlightRef.current = null
        }
      }
    },
    [
      analysisScope,
      maybeBootstrapMailboxIndex,
      maybeRecoverDegradedIndexSync,
      persistSnapshot,
      props.agentId,
      props.preferredClusterId,
      status.mailboxIndexHealth,
      sessionId,
    ]
  )

  useEffect(() => {
    const mailboxIndexHealth = status.mailboxIndexHealth
    const activeSmartSyncRun =
      mailboxIndexHealth?.active_run?.trigger === 'smart_sync' ? mailboxIndexHealth.active_run : null
    const pendingSmartSyncRun =
      status.pendingSmartMailboxSyncRun?.trigger === 'smart_sync'
        ? status.pendingSmartMailboxSyncRun
        : null
    const lastSmartSyncResult =
      mailboxIndexHealth?.last_result?.trigger === 'smart_sync' ? mailboxIndexHealth.last_result : null
    const smartSyncRunning =
      activeSmartSyncRun != null || status.smartMailboxSyncStarting || pendingSmartSyncRun != null
    const completionKey = lastSmartSyncResult
      ? [
          lastSmartSyncResult.run_id || 'no-run-id',
          lastSmartSyncResult.completed_at || 'no-completed-at',
          lastSmartSyncResult.status || 'no-status',
        ].join('::')
      : null

    if (smartSyncRunning) {
      const runKey = activeSmartSyncRun
        ? [
            'active',
            activeSmartSyncRun.run_id || 'no-run-id',
            activeSmartSyncRun.started_at || 'no-started-at',
          ].join('::')
        : pendingSmartSyncRun
          ? [
              'pending',
              pendingSmartSyncRun.run_id || 'no-run-id',
              pendingSmartSyncRun.started_at || 'no-started-at',
            ].join('::')
          : 'starting'

      if (
        !smartSyncObservedCycleRef.current ||
        !smartSyncObservedCycleRef.current.awaitingCompletion ||
        smartSyncObservedCycleRef.current.runKey !== runKey
      ) {
        smartSyncObservedCycleRef.current = {
          awaitingCompletion: true,
          runKey,
          runId: activeSmartSyncRun?.run_id || pendingSmartSyncRun?.run_id || null,
          baselineCompletionKey: completionKey,
        }
      } else if (
        !smartSyncObservedCycleRef.current.runId &&
        (activeSmartSyncRun?.run_id || pendingSmartSyncRun?.run_id)
      ) {
        smartSyncObservedCycleRef.current = {
          ...smartSyncObservedCycleRef.current,
          runId: activeSmartSyncRun?.run_id || pendingSmartSyncRun?.run_id || null,
        }
      }

      smartSyncWasRunningRef.current = true
      return
    }

    const settledAfterRunning = smartSyncWasRunningRef.current
    smartSyncWasRunningRef.current = false

    if (!settledAfterRunning || !lastSmartSyncResult || !completionKey) {
      return
    }

    const observedCycle = smartSyncObservedCycleRef.current
    if (!observedCycle?.awaitingCompletion) {
      return
    }

    const completionMatchesObservedRun =
      !observedCycle.runId || observedCycle.runId === lastSmartSyncResult.run_id
    const completionAdvanced =
      observedCycle.baselineCompletionKey == null ||
      observedCycle.baselineCompletionKey !== completionKey

    if (!completionMatchesObservedRun || !completionAdvanced) {
      return
    }

    if (handledSmartSyncCompletionKeyRef.current === completionKey) {
      smartSyncObservedCycleRef.current = {
        ...observedCycle,
        awaitingCompletion: false,
      }
      return
    }

    if (smartSyncContinuityRefreshRef.current?.completionKey === completionKey) {
      return
    }

    if (
      smartSyncContinuityRefreshRef.current &&
      smartSyncContinuityRefreshRef.current.completionKey !== completionKey
    ) {
      smartSyncContinuityRefreshRef.current.cancelled = true
      smartSyncContinuityRefreshRef.current = null
    }

    const run = {
      completionKey,
      cancelled: false,
    }
    smartSyncObservedCycleRef.current = {
      ...observedCycle,
      awaitingCompletion: false,
    }
    handledSmartSyncCompletionKeyRef.current = completionKey
    smartSyncContinuityRefreshRef.current = run

    void (async () => {
      await refreshRuntimeSnapshot({
        force: true,
        silent: true,
        forceMailboxProfileRefresh: true,
        refreshReason: 'smart_sync_continuity_refresh',
        transitionEdge: 'smart_sync_handoff',
      })

      if (smartSyncContinuityRefreshRef.current?.completionKey === completionKey) {
        smartSyncContinuityRefreshRef.current = null
      }
    })()
  }, [
    refreshRuntimeSnapshot,
    status.mailboxIndexHealth,
    status.pendingSmartMailboxSyncRun,
    status.smartMailboxSyncStarting,
  ])

  useEffect(() => {
    if (status.runtimeContinuity?.phase !== 'build_pending') return

    let cancelled = false
    let pollTimeoutId: number | null = null

    const scheduleNextPoll = () => {
      if (cancelled) return
      pollTimeoutId = window.setTimeout(() => {
        void (async () => {
          await refreshRuntimeSnapshot({
            silent: true,
            refreshReason: 'smart_sync_build_ready_poll',
            transitionEdge: 'build_pending_poll',
          })
          scheduleNextPoll()
        })()
      }, BUILD_PENDING_READY_POLL_INTERVAL_MS)
    }

    scheduleNextPoll()

    return () => {
      cancelled = true
      if (pollTimeoutId != null) {
        window.clearTimeout(pollTimeoutId)
      }
    }
  }, [refreshRuntimeSnapshot, status.runtimeContinuity?.phase])

  useEffect(() => {
    if (status.runtimeContinuity?.phase !== 'ready') return

    const clearId = window.setTimeout(() => {
      if (status.data) {
        persistSnapshot(status.loadedAt ?? Date.now(), status.data, null)
      }
      setStatus((prev) =>
        prev.runtimeContinuity?.phase === 'ready'
          ? {
              ...prev,
              runtimeContinuity: null,
            }
          : prev
      )
    }, 12000)

    return () => window.clearTimeout(clearId)
  }, [persistSnapshot, status.data, status.loadedAt, status.runtimeContinuity])

  useEffect(() => {
    if (!props.agentId.trim()) return
    if (hydratedStorageKeyRef.current === storageKey) return
    hydratedStorageKeyRef.current = storageKey

    let cachedSnapshot: PersistedSnapshot | null = MEMORY_CACHE.get(storageKey) || null
    if (!cachedSnapshot && typeof window !== 'undefined') {
      cachedSnapshot = parsePersisted(window.sessionStorage.getItem(storageKey))
      if (cachedSnapshot) {
        MEMORY_CACHE.set(storageKey, cachedSnapshot)
      }
    }

    if (cachedSnapshot) {
      setStatus({
        loading: false,
        refreshing: false,
        error: null,
        data: cachedSnapshot.data,
        loadedAt: cachedSnapshot.loadedAt,
        runtimeContinuity: cachedSnapshot.runtimeContinuity || null,
        mailboxIndexHealth: null,
        manualMailboxReindexStarting: false,
        smartMailboxSyncStarting: false,
        operatorMailboxBackfillStarting: false,
        pendingSmartMailboxSyncRun: null,
        pendingOperatorMailboxBackfillRun: null,
      })
    } else {
      setStatus({
        loading: true,
        refreshing: false,
        error: null,
        data: null,
        loadedAt: null,
        runtimeContinuity: null,
        mailboxIndexHealth: null,
        manualMailboxReindexStarting: false,
        smartMailboxSyncStarting: false,
        operatorMailboxBackfillStarting: false,
        pendingSmartMailboxSyncRun: null,
        pendingOperatorMailboxBackfillRun: null,
      })
    }

    if (!cachedSnapshot) {
      void refreshRuntimeSnapshot({
        silent: false,
        force: true,
      })
      return
    }

    const cachedHealth = readCachedMailboxIndexHealth()
    if (!cachedHealth) {
      void refreshMailboxIndexHealth()
      return
    }
    setStatus((prev) => reconcileMailboxIndexHealthState(prev, cachedHealth))
    void maybeBootstrapMailboxIndex(cachedHealth)
    void maybeRecoverDegradedIndexSync(cachedHealth, null)
    if (isFailedArtifactStandardRehydrateState(cachedSnapshot?.data)) {
      return
    }
    const cachedClusterCount =
      cachedSnapshot?.data?.runtime_cleanup_plan?.clusters?.length ?? 0
    if (cachedSnapshot && cachedClusterCount === 0 && cachedHealth.indexed_message_count > 0) {
      void refreshRuntimeSnapshot({
        silent: true,
        force: true,
      })
      return
    }
    if (!mailboxIndexSnapshotChanged(cachedSnapshot?.data || null, cachedHealth)) return
    void refreshRuntimeSnapshot({
      silent: true,
      force: true,
      refreshReason: 'mailbox_index_snapshot_changed',
    })
  }, [
    maybeBootstrapMailboxIndex,
    maybeRecoverDegradedIndexSync,
    props.agentId,
    refreshMailboxIndexHealth,
    refreshRuntimeSnapshot,
    storageKey,
  ])

  useEffect(() => {
    const hasActiveMailboxIndexRun = status.mailboxIndexHealth?.execution_state === 'running'
    const buildPendingContinuityActive = status.runtimeContinuity?.phase === 'build_pending'
    if (
      failedArtifactRehydrateHoldActive ||
      buildPendingContinuityActive ||
      !hasActiveMailboxIndexRun &&
      !status.manualMailboxReindexStarting &&
      !status.smartMailboxSyncStarting &&
      !status.operatorMailboxBackfillStarting &&
      !status.pendingSmartMailboxSyncRun &&
      !status.pendingOperatorMailboxBackfillRun
    ) {
      return
    }

    const pollId = window.setInterval(() => {
      void refreshMailboxIndexHealth({ force: true })
    }, 5000)

    return () => window.clearInterval(pollId)
  }, [
    refreshMailboxIndexHealth,
    status.mailboxIndexHealth,
    status.manualMailboxReindexStarting,
    status.operatorMailboxBackfillStarting,
    status.pendingOperatorMailboxBackfillRun,
    status.pendingSmartMailboxSyncRun,
    status.smartMailboxSyncStarting,
    failedArtifactRehydrateHoldActive,
    status.runtimeContinuity?.phase,
  ])

  const value: ContextValue = useMemo(
    () => ({
      ...status,
      sessionId,
      analysisScope,
      lastRefreshReason: lastRefreshReasonRef.current,
      refreshRuntimeSnapshot,
      triggerManualFullMailboxReindex,
      triggerSmartMailboxSync,
      triggerMailboxBackfill,
      triggerMailboxBackfillExtended,
    }),
    [
      analysisScope,
      refreshRuntimeSnapshot,
      sessionId,
      status,
      triggerMailboxBackfill,
      triggerMailboxBackfillExtended,
      triggerManualFullMailboxReindex,
      triggerSmartMailboxSync,
    ]
  )

  return (
    <OperationsRuntimeContext.Provider value={value}>
      {props.children}
    </OperationsRuntimeContext.Provider>
  )
}

export function useOperationsRuntime(): ContextValue {
  const context = useContext(OperationsRuntimeContext)
  if (!context) {
    throw new Error('useOperationsRuntime must be used within OperationsRuntimeProvider')
  }
  return context
}
