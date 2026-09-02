import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DecisionWorkspaceExecutionActionStatus,
  DecisionWorkspaceExecutionReconciliationStatus,
  DecisionWorkspaceExecutionRunStatus,
  PreparedDecisionWorkspaceExecutionClaim,
} from '@/lib/runtime/decisionWorkspaceExecutionModel'

type LedgerFailure = Readonly<{
  ok: false
  kind: 'conflict' | 'storage' | 'invalid_receipt'
  error: string
}>

export type RuntimeExecutionClaimResult =
  | Readonly<{
      ok: true
      conflict: boolean
      existing: boolean
      invocationAuthorized: boolean
      executionId: string
      status: DecisionWorkspaceExecutionRunStatus
      leaseToken: string
      leaseExpiresAt: string
    }>
  | LedgerFailure

export type RuntimeExecutionTransitionResult =
  | Readonly<{
      ok: true
      executionId: string
      actionIndex: number
      status: DecisionWorkspaceExecutionActionStatus
      attemptCount: number
    }>
  | LedgerFailure

export type RuntimeExecutionFinalizationResult =
  | Readonly<{
      ok: true
      executionId: string
      status: DecisionWorkspaceExecutionRunStatus
      reconciliationStatus: DecisionWorkspaceExecutionReconciliationStatus
    }>
  | LedgerFailure

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function runStatus(value: unknown): DecisionWorkspaceExecutionRunStatus | null {
  return value === 'claimed' ||
    value === 'executing' ||
    value === 'succeeded' ||
    value === 'failed' ||
    value === 'partial' ||
    value === 'indeterminate' ||
    value === 'reverted'
    ? value
    : null
}

function actionStatus(value: unknown): DecisionWorkspaceExecutionActionStatus | null {
  return value === 'claimed' ||
    value === 'executing' ||
    value === 'succeeded' ||
    value === 'failed' ||
    value === 'partial' ||
    value === 'indeterminate' ||
    value === 'skipped' ||
    value === 'reverted'
    ? value
    : null
}

function reconciliationStatus(value: unknown): DecisionWorkspaceExecutionReconciliationStatus | null {
  return value === 'not_required' ||
    value === 'pending' ||
    value === 'manual_required' ||
    value === 'resolved'
    ? value
    : null
}

export async function claimRuntimeExecution(params: {
  supabase: SupabaseClient
  tenantId: string
  agentId: string
  actorId: string
  approvalId: string
  requestEventId: string
  decisionEventId: string
  claim: PreparedDecisionWorkspaceExecutionClaim
  leaseSeconds?: number
}): Promise<RuntimeExecutionClaimResult> {
  const { data, error } = await params.supabase.rpc('claim_decision_workspace_execution', {
    p_tenant_id: params.tenantId,
    p_agent_id: params.agentId,
    p_actor_id: params.actorId,
    p_approval_id: params.approvalId,
    p_request_event_id: params.requestEventId,
    p_decision_event_id: params.decisionEventId,
    p_execution_key: params.claim.executionKey,
    p_action_fingerprint: params.claim.actionFingerprint,
    p_workflow_context: params.claim.workflowContext,
    p_actions: params.claim.actions,
    p_lease_seconds: params.leaseSeconds || 900,
  })

  if (error) {
    return { ok: false, kind: 'storage', error: 'Failed to claim approved execution.' }
  }
  const record = asRecord(data)
  if (!record || record.ok !== true) {
    return {
      ok: false,
      kind: record?.conflict === true ? 'conflict' : 'storage',
      error:
        record?.conflict === true
          ? 'Execution request conflicts with its durable claim.'
          : 'Failed to claim approved execution.',
    }
  }

  const executionId = stringValue(record.execution_id)
  const status = runStatus(record.status)
  const leaseToken = stringValue(record.lease_token)
  const leaseExpiresAt = stringValue(record.lease_expires_at)
  if (!executionId || !status || !leaseToken || !leaseExpiresAt) {
    return {
      ok: false,
      kind: 'invalid_receipt',
      error: 'Execution claim returned an invalid receipt.',
    }
  }

  return {
    ok: true,
    conflict: record.conflict === true,
    existing: record.existing === true,
    invocationAuthorized: record.invocation_authorized === true,
    executionId,
    status,
    leaseToken,
    leaseExpiresAt,
  }
}

export async function recordRuntimeExecutionActionReceipt(params: {
  supabase: SupabaseClient
  tenantId: string
  executionId: string
  leaseToken: string
  actionIndex: number
  expectedStatus: DecisionWorkspaceExecutionActionStatus
  nextStatus: DecisionWorkspaceExecutionActionStatus
  actorId: string
  providerReceipt?: Readonly<Record<string, unknown>> | null
  errorCode?: string | null
  rollbackReference?: string | null
  reconciliationStatus?: DecisionWorkspaceExecutionReconciliationStatus
}): Promise<RuntimeExecutionTransitionResult> {
  const { data, error } = await params.supabase.rpc('record_decision_workspace_action_receipt', {
    p_tenant_id: params.tenantId,
    p_execution_id: params.executionId,
    p_lease_token: params.leaseToken,
    p_action_index: params.actionIndex,
    p_expected_status: params.expectedStatus,
    p_next_status: params.nextStatus,
    p_actor_id: params.actorId,
    p_provider_receipt: params.providerReceipt || null,
    p_error_code: params.errorCode || null,
    p_rollback_reference: params.rollbackReference || null,
    p_reconciliation_status: params.reconciliationStatus || 'not_required',
  })

  if (error) {
    return { ok: false, kind: 'storage', error: 'Failed to record execution action state.' }
  }
  const record = asRecord(data)
  const executionId = stringValue(record?.execution_id)
  const status = actionStatus(record?.status)
  const actionIndex = typeof record?.action_index === 'number' ? record.action_index : null
  const attemptCount = typeof record?.attempt_count === 'number' ? record.attempt_count : null
  if (record?.ok !== true || !executionId || !status || actionIndex == null || attemptCount == null) {
    return {
      ok: false,
      kind: 'invalid_receipt',
      error: 'Execution action transition returned an invalid receipt.',
    }
  }

  return { ok: true, executionId, actionIndex, status, attemptCount }
}

export async function finalizeRuntimeExecution(params: {
  supabase: SupabaseClient
  tenantId: string
  executionId: string
  leaseToken: string
  actorId: string
  compatibilityPayload?: Readonly<Record<string, unknown>> | null
}): Promise<RuntimeExecutionFinalizationResult> {
  const { data, error } = await params.supabase.rpc('finalize_decision_workspace_execution', {
    p_tenant_id: params.tenantId,
    p_execution_id: params.executionId,
    p_lease_token: params.leaseToken,
    p_actor_id: params.actorId,
    p_compatibility_payload: params.compatibilityPayload || null,
  })

  if (error) {
    return { ok: false, kind: 'storage', error: 'Failed to finalize approved execution.' }
  }
  const record = asRecord(data)
  const executionId = stringValue(record?.execution_id)
  const status = runStatus(record?.status)
  const reconciliation = reconciliationStatus(record?.reconciliation_status)
  if (record?.ok !== true || !executionId || !status || !reconciliation) {
    return {
      ok: false,
      kind: 'invalid_receipt',
      error: 'Execution finalization returned an invalid receipt.',
    }
  }
  return { ok: true, executionId, status, reconciliationStatus: reconciliation }
}

export async function resolveStaleRuntimeExecution(params: {
  supabase: SupabaseClient
  tenantId: string
  executionId: string
  actorId: string
}): Promise<RuntimeExecutionFinalizationResult> {
  const { data, error } = await params.supabase.rpc('resolve_stale_decision_workspace_execution', {
    p_tenant_id: params.tenantId,
    p_execution_id: params.executionId,
    p_actor_id: params.actorId,
  })

  if (error) {
    return { ok: false, kind: 'storage', error: 'Failed to inspect stale execution state.' }
  }
  const record = asRecord(data)
  const executionId = stringValue(record?.execution_id)
  const status = runStatus(record?.status)
  const reconciliation = reconciliationStatus(record?.reconciliation_status)
  if (record?.ok !== true || !executionId || !status) {
    return {
      ok: false,
      kind: 'invalid_receipt',
      error: 'Stale execution resolution returned an invalid receipt.',
    }
  }
  return {
    ok: true,
    executionId,
    status,
    reconciliationStatus:
      reconciliation ||
      (status === 'indeterminate'
        ? 'manual_required'
        : status === 'partial'
          ? 'pending'
          : 'not_required'),
  }
}
