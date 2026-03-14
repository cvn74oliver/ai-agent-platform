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

type SnapshotStatus = {
  loading: boolean
  refreshing: boolean
  error: string | null
  data: OperationsRuntimeData | null
  loadedAt: number | null
  mailboxIndexHealth: MailboxIndexHealth | null
}

type SnapshotRefreshOptions = {
  force?: boolean
  silent?: boolean
  forceMailboxProfileRefresh?: boolean
  refreshReason?: string
}

type ContextValue = SnapshotStatus & {
  sessionId: string | null
  analysisScope: OperationsAnalysisScope
  lastRefreshReason: string | null
  refreshRuntimeSnapshot: (options?: SnapshotRefreshOptions) => Promise<void>
}

type PersistedSnapshot = {
  loadedAt: number
  data: OperationsRuntimeData
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
  sync_health: 'healthy' | 'degraded_usable' | 'unavailable' | 'uninitialized' | null
  usable_with_cached_index: boolean
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
const STALE_WHILE_REVALIDATE_MS = 45_000
const INDEX_BOOTSTRAP_COOLDOWN_MS = 10 * 60 * 1000
const INDEX_BACKFILL_COOLDOWN_MS = 6 * 60 * 60 * 1000
const INDEX_RECOVERY_COOLDOWN_MS = 30 * 60 * 1000
const INDEX_BACKFILL_TARGET_ROWS = 10_000
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

function latestMailboxIndexSyncMs(health: MailboxIndexHealth | null): number | null {
  if (!health) return null
  const values = [health.last_full_scan_at, health.last_incremental_sync_at]
    .map((value) => (typeof value === 'string' && value.trim() ? Date.parse(value) : Number.NaN))
    .filter((value) => Number.isFinite(value)) as number[]
  if (values.length === 0) return null
  return Math.max(...values)
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

  const maybeBootstrapMailboxIndex = useCallback(
    async (health: MailboxIndexHealth | null) => {
      if (!props.agentId.trim() || !health) return
      if (health.indexed_message_count > 0) return
      if (
        typeof health.last_sync_status === 'string' &&
        health.last_sync_status.toLowerCase().includes('sync')
      ) {
        return
      }
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
            max_messages: 50_000,
          }),
        })
        if (!res.ok) return

        setTimeout(() => {
          void fetchMailboxIndexHealth().then((nextHealth) => {
            if (!nextHealth) return
            setStatus((prev) => ({ ...prev, mailboxIndexHealth: nextHealth }))
          })
        }, 3500)
      } catch {
        // Ignore bootstrap failures; normal refresh path remains fallback.
      } finally {
        indexBootstrapInFlightRef.current = false
      }
    },
    [indexBootstrapKey, props.agentId]
  )

  const maybeScheduleIndexBackfill = useCallback(
    async (health: MailboxIndexHealth | null) => {
      if (!props.agentId.trim() || !health) return
      if (health.indexed_message_count <= 0) return
      if (health.indexed_message_count >= INDEX_BACKFILL_TARGET_ROWS) return
      if (
        typeof health.last_sync_status === 'string' &&
        health.last_sync_status.toLowerCase().includes('sync')
      ) {
        return
      }

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
            max_messages: 50_000,
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
      if (health.sync_health !== 'degraded_usable') return
      if (!health.usable_with_cached_index) return
      if (
        typeof health.last_sync_status === 'string' &&
        health.last_sync_status.toLowerCase().includes('sync_in_progress')
      ) {
        return
      }

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
            max_messages: 50_000,
          }),
        })
        if (!res.ok) return

        setTimeout(() => {
          void fetchMailboxIndexHealth().then((nextHealth) => {
            if (!nextHealth) return
            setStatus((prev) => ({ ...prev, mailboxIndexHealth: nextHealth }))
          })
        }, 3500)
      } catch {
        // best-effort recovery path only
      }
    },
    [indexRecoveryKey, props.agentId]
  )

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
          const loadedAt = Date.now()
          persistSnapshot(loadedAt, payload.data)
          setStatus({
            loading: false,
            refreshing: false,
            error: null,
            data: payload.data,
            loadedAt,
            mailboxIndexHealth,
          })
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
      })
    } else {
      setStatus({
        loading: true,
        refreshing: false,
        error: null,
        data: null,
        loadedAt: null,
        mailboxIndexHealth: null,
      })
    }

    const cacheAgeMs = cachedSnapshot ? Date.now() - cachedSnapshot.loadedAt : Number.POSITIVE_INFINITY
    const shouldRefresh = !cachedSnapshot || cacheAgeMs > STALE_WHILE_REVALIDATE_MS

    if (shouldRefresh) {
      void refreshRuntimeSnapshot({
        silent: Boolean(cachedSnapshot),
        force: true,
      })
      return
    }

    // Cache is still warm; check mailbox index health once and refresh runtime snapshot
    // if indexing completed after this cached payload was captured.
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
      const syncMs = latestMailboxIndexSyncMs(health)
      if (!cachedSnapshot || syncMs == null) return
      if (syncMs <= cachedSnapshot.loadedAt + 1000) return
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

  const value: ContextValue = useMemo(
    () => ({
      ...status,
      sessionId,
      analysisScope,
      lastRefreshReason: lastRefreshReasonRef.current,
      refreshRuntimeSnapshot,
    }),
    [analysisScope, refreshRuntimeSnapshot, sessionId, status]
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
