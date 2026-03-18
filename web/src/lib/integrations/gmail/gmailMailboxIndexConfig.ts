export const GMAIL_MAILBOX_INDEX_MAX_MESSAGES = 100_000
export const GMAIL_MAILBOX_INDEX_HEARTBEAT_INTERVAL_MS = 15_000
export const GMAIL_MAILBOX_INDEX_STALL_THRESHOLD_MS = 5 * 60 * 1000

export const GMAIL_MAILBOX_INDEX_TRIGGER_OPTIONS = [
  'manual_full_reindex',
  'runtime_bootstrap',
  'runtime_backfill',
  'runtime_recovery',
  'analysis_refresh',
] as const

export type GmailMailboxIndexTrigger = (typeof GMAIL_MAILBOX_INDEX_TRIGGER_OPTIONS)[number]

export function clampGmailMailboxIndexMaxMessages(value: number | null | undefined): number {
  const fallback = GMAIL_MAILBOX_INDEX_MAX_MESSAGES
  const parsed =
    typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(Math.max(parsed, 1), GMAIL_MAILBOX_INDEX_MAX_MESSAGES)
}

export function targetGmailMailboxIndexRows(params: {
  mailboxEstimatedTotal: number | null | undefined
}): number {
  const estimated =
    typeof params.mailboxEstimatedTotal === 'number' && Number.isFinite(params.mailboxEstimatedTotal)
      ? Math.max(0, Math.round(params.mailboxEstimatedTotal))
      : null

  if (estimated == null || estimated <= 0) {
    return GMAIL_MAILBOX_INDEX_MAX_MESSAGES
  }

  return Math.min(estimated, GMAIL_MAILBOX_INDEX_MAX_MESSAGES)
}

export function normalizeGmailMailboxIndexTrigger(
  value: unknown,
  mode: 'full' | 'incremental'
): GmailMailboxIndexTrigger {
  if (
    value === 'manual_full_reindex' ||
    value === 'runtime_bootstrap' ||
    value === 'runtime_backfill' ||
    value === 'runtime_recovery' ||
    value === 'analysis_refresh'
  ) {
    return value
  }

  return mode === 'full' ? 'manual_full_reindex' : 'analysis_refresh'
}
