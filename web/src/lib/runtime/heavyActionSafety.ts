export type HeavyActionBlockedReason = 'already_running' | 'cooldown_active'

type ActiveHeavyActionEntry = {
  startedAtMs: number
}

const activeHeavyActions = new Map<string, ActiveHeavyActionEntry>()
const heavyActionCooldowns = new Map<string, number>()

export function tryStartHeavyAction(params: {
  key: string
  cooldownMs: number
  nowMs?: number
}):
  | {
      ok: true
      startedAtMs: number
    }
  | {
      ok: false
      reason: HeavyActionBlockedReason
      retryAfterMs: number
      startedAtMs?: number | null
      cooldownUntilMs?: number | null
    } {
  const nowMs = params.nowMs ?? Date.now()
  const active = activeHeavyActions.get(params.key)
  if (active) {
    return {
      ok: false,
      reason: 'already_running',
      retryAfterMs: 0,
      startedAtMs: active.startedAtMs,
      cooldownUntilMs: null,
    }
  }

  const cooldownUntilMs = heavyActionCooldowns.get(params.key)
  if (typeof cooldownUntilMs === 'number' && cooldownUntilMs > nowMs) {
    return {
      ok: false,
      reason: 'cooldown_active',
      retryAfterMs: Math.max(0, cooldownUntilMs - nowMs),
      startedAtMs: null,
      cooldownUntilMs,
    }
  }

  activeHeavyActions.set(params.key, { startedAtMs: nowMs })
  return {
    ok: true,
    startedAtMs: nowMs,
  }
}

export function finishHeavyAction(params: {
  key: string
  cooldownMs: number
  applyCooldown?: boolean
}): void {
  activeHeavyActions.delete(params.key)
  if (params.applyCooldown === false || params.cooldownMs <= 0) return
  heavyActionCooldowns.set(params.key, Date.now() + params.cooldownMs)
}

export function logHeavyActionEvent(params: {
  category: 'runtime_refresh' | 'mailbox_index' | 'inbox_analysis'
  route: string
  action: string
  triggerSource: string | null
  requestMode: string | null
  tenantId: string | null
  agentId: string | null
  blockedBy: HeavyActionBlockedReason | null
  durationMs: number
  outcome: string
  extra?: Record<string, unknown>
}): void {
  console.info(
    `[safety][heavy-action] ${JSON.stringify({
      category: params.category,
      route: params.route,
      action: params.action,
      trigger_source: params.triggerSource,
      request_mode: params.requestMode,
      tenant_id: params.tenantId,
      agent_id: params.agentId,
      blocked_by: params.blockedBy,
      duration_ms: Math.max(0, params.durationMs),
      outcome: params.outcome,
      ...(params.extra || {}),
    })}`
  )
}
