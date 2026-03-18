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
  type OperationsRuntimeData,
} from '@/lib/runtime/operationsWorkspace'
import {
  GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
  targetGmailMailboxIndexRows,
} from '@/lib/integrations/gmail/gmailMailboxIndexConfig'

type SnapshotStatus = {
  loading: boolean
  refreshing: boolean
  error: string | null
  data: OperationsRuntimeData | null
  loadedAt: number | null
  mailboxIndexHealth: MailboxIndexHealth | null
  manualMailboxReindexStarting: boolean
}

type SnapshotRefreshOptions = {
  force?: boolean
  silent?: boolean
  forceMailboxProfileRefresh?: boolean
  refreshReason?: string
}

type TriggerManualReindexResult =
  | { ok: true; attached: boolean }
  | { ok: false; error: string }

type ContextValue = SnapshotStatus & {
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
  lastRefreshReason: string | null
  refreshRuntimeSnapshot: (options?: SnapshotRefreshOptions) => Promise<void>
  triggerManualFullMailboxReindex: () => Promise<TriggerManualReindexResult>
}

type PersistedSnapshot = {
  loadedAt: number
  data: OperationsRuntimeData
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

type MailboxIndexActiveRun = {
  run_id: string | null
  mode: 'full' | 'incremental' | null
  requested_mode: 'full' | 'incremental' | null
  effective_mode: 'full' | 'incremental' | null
  trigger:
    | 'manual_full_reindex'
    | 'runtime_bootstrap'
    | 'runtime_backfill'
    | 'runtime_recovery'
    | 'analysis_refresh'
    | null
  requested_max_messages: number | null
  started_at: string | null
  heartbeat_at: string | null
  rows_before: number | null
  processed_messages: number | null
  list_pages_fetched: number | null
  yield_detail: MailboxIndexYieldDetail | null
}

type MailboxIndexLastResult = {
  status: string | null
  mode: 'full' | 'incremental' | null
  run_id: string | null
  trigger:
    | 'manual_full_reindex'
    | 'runtime_bootstrap'
    | 'runtime_backfill'
    | 'runtime_recovery'
    | 'analysis_refresh'
    | null
  requested_mode: 'full' | 'incremental' | null
  effective_mode: 'full' | 'incremental' | null
  completed_at: string | null
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
  requires_reconnect: boolean
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

async function fetchMailboxIndexHealth(): Promise<MailboxIndexHealth | null> {
  try {
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
      payload.data.active_run && typeof payload.data.active_run === 'object' ? payload.data.active_run : null
    const lastResultPayload =
      payload.data.last_result && typeof payload.data.last_result === 'object'
        ? payload.data.last_result
        : null
    return {
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
            yield_detail: parseMailboxIndexYieldDetail(
              'yield_detail' in lastResultPayload ? lastResultPayload.yield_detail : null
            ),
          }
        : null,
      requires_reconnect: payload.data.requires_reconnect === true,
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
  } catch {
    return null
  }
}

const OperationsRuntimeContext = createContext<ContextValue | null>(null)

const STORAGE_PREFIX = 'operations.runtime.snapshot.v1'
const INDEX_BOOTSTRAP_STORAGE_PREFIX = 'operations.mailbox-index.bootstrap.v1'
const INDEX_BACKFILL_STORAGE_PREFIX = 'operations.mailbox-index.backfill.v1'
const INDEX_RECOVERY_STORAGE_PREFIX = 'operations.mailbox-index.recovery.v1'
const INDEX_BOOTSTRAP_COOLDOWN_MS = 10 * 60 * 1000
const INDEX_BACKFILL_COOLDOWN_MS = 6 * 60 * 60 * 1000
const INDEX_RECOVERY_COOLDOWN_MS = 30 * 60 * 1000
const MEMORY_CACHE = new Map<string, PersistedSnapshot>()
const INDEX_BOOTSTRAP_MEMORY = new Map<string, number>()
const INDEX_BACKFILL_MEMORY = new Map<string, number>()
const INDEX_RECOVERY_MEMORY = new Map<string, number>()

function buildStorageKey(
  agentId: string,
  sessionId: string | null,
  analysisScope: OperationsAnalysisScope
): string {
  return `${STORAGE_PREFIX}:${agentId}:${sessionId || 'none'}:${analysisScope}`
}

function buildIndexBootstrapKey(agentId: string, sessionId: string | null): string {
  return `${INDEX_BOOTSTRAP_STORAGE_PREFIX}:${agentId}:${sessionId || 'none'}`
}

function buildIndexBackfillKey(agentId: string, sessionId: string | null): string {
  return `${INDEX_BACKFILL_STORAGE_PREFIX}:${agentId}:${sessionId || 'none'}`
}

function buildIndexRecoveryKey(agentId: string, sessionId: string | null): string {
  return `${INDEX_RECOVERY_STORAGE_PREFIX}:${agentId}:${sessionId || 'none'}`
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
    }
  } catch {
    return null
  }
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

export function OperationsRuntimeProvider(props: {
  agentId: string
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
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
    mailboxIndexHealth: null,
    manualMailboxReindexStarting: false,
  })
  const requestInFlightRef = useRef<Promise<void> | null>(null)
  const lastRefreshReasonRef = useRef<string | null>(null)
  const indexBootstrapInFlightRef = useRef(false)
  const storageKey = useMemo(
    () => buildStorageKey(props.agentId, sessionId, analysisScope),
    [analysisScope, props.agentId, sessionId]
  )
  const indexBootstrapKey = useMemo(
    () => buildIndexBootstrapKey(props.agentId, sessionId),
    [props.agentId, sessionId]
  )
  const indexBackfillKey = useMemo(
    () => buildIndexBackfillKey(props.agentId, sessionId),
    [props.agentId, sessionId]
  )
  const indexRecoveryKey = useMemo(
    () => buildIndexRecoveryKey(props.agentId, sessionId),
    [props.agentId, sessionId]
  )

  const refreshMailboxIndexHealth = useCallback(async (): Promise<MailboxIndexHealth | null> => {
    const nextHealth = await fetchMailboxIndexHealth()
    if (!nextHealth) return null
    setStatus((prev) => ({ ...prev, mailboxIndexHealth: nextHealth }))
    return nextHealth
  }, [])

  const maybeBootstrapMailboxIndex = useCallback(
    async (health: MailboxIndexHealth | null) => {
      if (!props.agentId.trim() || !health) return
      if (health.requires_reconnect) return
      if (health.indexed_message_count > 0) return
      if (health.execution_state === 'running') return
      if (indexBootstrapInFlightRef.current) return

      let lastAttemptAt = INDEX_BOOTSTRAP_MEMORY.get(indexBootstrapKey) || 0
      if (!lastAttemptAt && typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem(indexBootstrapKey)
        const parsed = stored ? Number(stored) : Number.NaN
        if (Number.isFinite(parsed) && parsed > 0) {
          lastAttemptAt = parsed
          INDEX_BOOTSTRAP_MEMORY.set(indexBootstrapKey, parsed)
        }
      }
      if (Date.now() - lastAttemptAt < INDEX_BOOTSTRAP_COOLDOWN_MS) return

      indexBootstrapInFlightRef.current = true
      const attemptedAt = Date.now()
      INDEX_BOOTSTRAP_MEMORY.set(indexBootstrapKey, attemptedAt)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(indexBootstrapKey, String(attemptedAt))
      }

      try {
        const res = await fetch('/api/integrations/gmail/mailbox-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'incremental',
            background: true,
            max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            trigger: 'runtime_bootstrap',
          }),
        })
        if (!res.ok) return

        setTimeout(() => {
          void refreshMailboxIndexHealth()
        }, 3500)
      } catch {
        // Ignore bootstrap failures; normal refresh path remains fallback.
      } finally {
        indexBootstrapInFlightRef.current = false
      }
    },
    [indexBootstrapKey, props.agentId, refreshMailboxIndexHealth]
  )

  const maybeScheduleIndexBackfill = useCallback(
    async (health: MailboxIndexHealth | null) => {
      if (!props.agentId.trim() || !health) return
      if (health.requires_reconnect) return
      if (health.indexed_message_count <= 0) return
      if (
        health.indexed_message_count >=
        targetGmailMailboxIndexRows({
          mailboxEstimatedTotal: health.mailbox_estimated_total,
        })
      ) {
        return
      }
      if (health.execution_state === 'running') return

      const lastFullScanMs =
        typeof health.last_full_scan_at === 'string' && health.last_full_scan_at.trim()
          ? Date.parse(health.last_full_scan_at)
          : Number.NaN
      if (Number.isFinite(lastFullScanMs) && Date.now() - lastFullScanMs < INDEX_BACKFILL_COOLDOWN_MS) {
        return
      }

      let lastAttemptAt = INDEX_BACKFILL_MEMORY.get(indexBackfillKey) || 0
      if (!lastAttemptAt && typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem(indexBackfillKey)
        const parsed = stored ? Number(stored) : Number.NaN
        if (Number.isFinite(parsed) && parsed > 0) {
          lastAttemptAt = parsed
          INDEX_BACKFILL_MEMORY.set(indexBackfillKey, parsed)
        }
      }
      if (Date.now() - lastAttemptAt < INDEX_BACKFILL_COOLDOWN_MS) return

      const attemptedAt = Date.now()
      INDEX_BACKFILL_MEMORY.set(indexBackfillKey, attemptedAt)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(indexBackfillKey, String(attemptedAt))
      }

      try {
        const res = await fetch('/api/integrations/gmail/mailbox-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'full',
            background: true,
            max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            trigger: 'runtime_backfill',
          }),
        })
        if (!res.ok) return
      } catch {
        // best-effort background backfill
      }
    },
    [indexBackfillKey, props.agentId]
  )

  const maybeRecoverDegradedIndexSync = useCallback(
    async (health: MailboxIndexHealth | null) => {
      if (!props.agentId.trim() || !health) return
      if (health.requires_reconnect) return
      if (health.sync_health !== 'degraded_usable') return
      if (!health.usable_with_cached_index) return
      if (health.execution_state === 'running') return

      let lastAttemptAt = INDEX_RECOVERY_MEMORY.get(indexRecoveryKey) || 0
      if (!lastAttemptAt && typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem(indexRecoveryKey)
        const parsed = stored ? Number(stored) : Number.NaN
        if (Number.isFinite(parsed) && parsed > 0) {
          lastAttemptAt = parsed
          INDEX_RECOVERY_MEMORY.set(indexRecoveryKey, parsed)
        }
      }
      if (Date.now() - lastAttemptAt < INDEX_RECOVERY_COOLDOWN_MS) return

      const attemptedAt = Date.now()
      INDEX_RECOVERY_MEMORY.set(indexRecoveryKey, attemptedAt)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(indexRecoveryKey, String(attemptedAt))
      }

      try {
        const res = await fetch('/api/integrations/gmail/mailbox-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'incremental',
            background: true,
            max_messages: GMAIL_MAILBOX_INDEX_MAX_MESSAGES,
            trigger: 'runtime_recovery',
          }),
        })
        if (!res.ok) return

        setTimeout(() => {
          void refreshMailboxIndexHealth()
        }, 3500)
      } catch {
        // best-effort recovery path only
      }
    },
    [indexRecoveryKey, props.agentId, refreshMailboxIndexHealth]
  )

  const triggerManualFullMailboxReindex = useCallback(async (): Promise<TriggerManualReindexResult> => {
    setStatus((prev) => ({ ...prev, manualMailboxReindexStarting: true }))
    void refreshMailboxIndexHealth()
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

      await refreshMailboxIndexHealth()

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
      await refreshMailboxIndexHealth()
    }
  }, [refreshMailboxIndexHealth])

  const persistSnapshot = useCallback(
    (loadedAt: number, data: OperationsRuntimeData) => {
      MEMORY_CACHE.set(storageKey, { loadedAt, data })
      if (typeof window === 'undefined') return
      try {
        const payload: PersistedSnapshot = { loadedAt, data }
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        // ignore storage failure
      }
    },
    [storageKey]
  )

  const refreshRuntimeSnapshot = useCallback(
    async (options?: SnapshotRefreshOptions) => {
      if (!props.agentId.trim()) return
      if (requestInFlightRef.current) {
        await requestInFlightRef.current
        return
      }

      const request = (async () => {
        setStatus((prev) => ({
          ...prev,
          loading: options?.silent ? prev.loading : !prev.data,
          refreshing: true,
          error: null,
        }))

        try {
          const [payload, mailboxIndexHealth] = await Promise.all([
            fetchOperationsRuntimeSnapshot({
              agentId: props.agentId,
              sessionId,
              analysisScope,
              forceMailboxProfileRefresh: options?.forceMailboxProfileRefresh === true,
            }),
            fetchMailboxIndexHealth(),
          ])
          if (!payload.ok || !payload.data) {
            setStatus((prev) => ({
              ...prev,
              loading: false,
              refreshing: false,
              error: payload.error || 'Failed to load runtime snapshot.',
              mailboxIndexHealth,
            }))
            return
          }
          const runtimeData = payload.data as OperationsRuntimeData
          const loadedAt = Date.now()
          persistSnapshot(loadedAt, runtimeData)
          setStatus((prev) => ({
            ...prev,
            loading: false,
            refreshing: false,
            error: null,
            data: runtimeData,
            loadedAt,
            mailboxIndexHealth,
          }))
          void maybeBootstrapMailboxIndex(mailboxIndexHealth)
          void maybeScheduleIndexBackfill(mailboxIndexHealth)
          void maybeRecoverDegradedIndexSync(mailboxIndexHealth)
        } catch {
          setStatus((prev) => ({
            ...prev,
            loading: false,
            refreshing: false,
            error: 'Failed to load runtime snapshot.',
            mailboxIndexHealth: prev.mailboxIndexHealth,
          }))
        }
      })()

      requestInFlightRef.current = request
      try {
        if (options?.refreshReason && options.refreshReason.trim()) {
          lastRefreshReasonRef.current = options.refreshReason.trim()
        } else if (options?.forceMailboxProfileRefresh) {
          lastRefreshReasonRef.current = 'manual_regenerate'
        }
        await request
      } finally {
        requestInFlightRef.current = null
      }
    },
    [
      analysisScope,
      maybeBootstrapMailboxIndex,
      maybeRecoverDegradedIndexSync,
      maybeScheduleIndexBackfill,
      persistSnapshot,
      props.agentId,
      sessionId,
    ]
  )

  useEffect(() => {
    if (!props.agentId.trim()) return

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
        mailboxIndexHealth: null,
        manualMailboxReindexStarting: false,
      })
    } else {
      setStatus({
        loading: true,
        refreshing: false,
        error: null,
        data: null,
        loadedAt: null,
        mailboxIndexHealth: null,
        manualMailboxReindexStarting: false,
      })
    }

    if (!cachedSnapshot) {
      void refreshRuntimeSnapshot({
        silent: false,
        force: true,
      })
      return
    }

    // Serve the latest stable snapshot immediately, then consult mailbox index health to
    // decide whether a background runtime refresh is actually necessary.
    void fetchMailboxIndexHealth().then((health) => {
      if (!health) return
      setStatus((prev) => ({
        ...prev,
        mailboxIndexHealth: health,
      }))
      void maybeBootstrapMailboxIndex(health)
      void maybeScheduleIndexBackfill(health)
      void maybeRecoverDegradedIndexSync(health)
      const cachedClusterCount =
        cachedSnapshot?.data?.runtime_cleanup_plan?.clusters?.length ?? 0
      if (cachedSnapshot && cachedClusterCount === 0 && health.indexed_message_count > 0) {
        void refreshRuntimeSnapshot({
          silent: true,
          force: true,
        })
        return
      }
      if (!mailboxIndexSnapshotChanged(cachedSnapshot?.data || null, health)) return
      void refreshRuntimeSnapshot({
        silent: true,
        force: true,
      })
    })
  }, [
    maybeBootstrapMailboxIndex,
    maybeRecoverDegradedIndexSync,
    maybeScheduleIndexBackfill,
    props.agentId,
    refreshRuntimeSnapshot,
    storageKey,
  ])

  useEffect(() => {
    if (!status.manualMailboxReindexStarting && status.mailboxIndexHealth?.execution_state !== 'running') return

    const pollId = window.setInterval(() => {
      void refreshMailboxIndexHealth()
    }, 5000)

    return () => window.clearInterval(pollId)
  }, [refreshMailboxIndexHealth, status.mailboxIndexHealth?.execution_state, status.manualMailboxReindexStarting])

  const value: ContextValue = useMemo(
    () => ({
      ...status,
      sessionId,
      analysisScope,
      lastRefreshReason: lastRefreshReasonRef.current,
      refreshRuntimeSnapshot,
      triggerManualFullMailboxReindex,
    }),
    [analysisScope, refreshRuntimeSnapshot, sessionId, status, triggerManualFullMailboxReindex]
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
