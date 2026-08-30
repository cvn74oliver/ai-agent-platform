export type OptionalEvidenceDetailOperatorAction =
  | 'connect_source'
  | 'review_source_permissions'
  | 'reauthorize_source'

export type OptionalEvidenceDetailAvailability =
  | {
      state: 'full_detail_available'
      retryability: 'not_applicable'
      operator_action: null
    }
  | {
      state: 'subject_only_available'
      retryability: 'after_operator_action'
      operator_action: OptionalEvidenceDetailOperatorAction
    }

export const FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY: OptionalEvidenceDetailAvailability = {
  state: 'full_detail_available',
  retryability: 'not_applicable',
  operator_action: null,
}

export function subjectOnlyOptionalEvidenceDetailAvailability(
  operatorAction: OptionalEvidenceDetailOperatorAction
): OptionalEvidenceDetailAvailability {
  return {
    state: 'subject_only_available',
    retryability: 'after_operator_action',
    operator_action: operatorAction,
  }
}

export function isOptionalEvidenceDetailAvailability(
  value: unknown
): value is OptionalEvidenceDetailAvailability {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>

  if (candidate.state === 'full_detail_available') {
    return candidate.retryability === 'not_applicable' && candidate.operator_action === null
  }

  return (
    candidate.state === 'subject_only_available' &&
    candidate.retryability === 'after_operator_action' &&
    (candidate.operator_action === 'connect_source' ||
      candidate.operator_action === 'review_source_permissions' ||
      candidate.operator_action === 'reauthorize_source')
  )
}

export function shouldCacheOptionalEvidenceDetail(
  availability: OptionalEvidenceDetailAvailability
): boolean {
  return availability.state === 'full_detail_available'
}

export function unresolvedOptionalEvidenceDetailIds(
  evidence: Array<{ id: string; detail: string | null | undefined }>,
  settledIds: ReadonlySet<string>
): string[] {
  return evidence
    .filter((entry) => entry.detail == null && !settledIds.has(entry.id))
    .map((entry) => entry.id)
}
