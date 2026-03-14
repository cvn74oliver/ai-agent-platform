export type RuntimeActionCandidate = {
  tool: string
  action: string
  args?: unknown
}

export type RuntimeSuggestedActionCandidate = {
  id: string
  label: string
  reason: string
  message_ids: string[]
  status: 'ready' | 'pending_approval' | 'approved' | 'executed'
  approval_id?: string
  proposed_action: {
    tool: string
    action: string
    args?: Record<string, unknown>
  }
}

export type RuntimeSuggestionSet = {
  id: string
  title: string
  summary: string
  candidates: RuntimeSuggestedActionCandidate[]
}

export type RuntimeSuggestionHistoryRequest = {
  approval_id: string
  created_at: string
  session_id?: string
  user_request?: string
  proposed_actions: RuntimeActionCandidate[]
}

export type RuntimeSuggestionHistory = {
  requests: RuntimeSuggestionHistoryRequest[]
  latest_decision_by_approval: Map<string, 'approved' | 'rejected'>
  executed_approvals: Set<string>
}

export type RuntimeSuggestionPromptContext = {
  ready_actions: string[]
  executed_actions: string[]
  has_ready_actions: boolean
  has_executed_archive: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeRuntimeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeMessageIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const id = entry.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    normalized.push(id)
  }
  normalized.sort()
  return normalized
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function parseRuntimeActionCandidates(value: unknown): RuntimeActionCandidate[] {
  if (!Array.isArray(value)) return []

  const actions: RuntimeActionCandidate[] = []
  for (const item of value) {
    if (!isRecord(item)) continue

    const tool = typeof item.tool === 'string' ? item.tool.trim() : ''
    const action = typeof item.action === 'string' ? item.action.trim() : ''
    if (!tool || !action) continue

    actions.push({
      tool,
      action,
      args: item.args,
    })
  }

  return actions
}

function doesProposedActionMatchCandidate(params: {
  candidate: RuntimeSuggestedActionCandidate
  action: RuntimeActionCandidate
}): boolean {
  const candidateTool = params.candidate.proposed_action.tool
  const candidateAction = params.candidate.proposed_action.action
  if (!candidateTool || !candidateAction) return false
  if (candidateTool !== params.action.tool || candidateAction !== params.action.action) return false

  const candidateMessageIds = [...params.candidate.message_ids].map((id) => id.trim()).filter(Boolean).sort()
  const requiresStrictMessageMatch =
    params.action.tool === 'gmail' &&
    !['review_query_cluster', 'review_sender_cluster', 'analyze_inbox'].includes(params.action.action)
  if (candidateMessageIds.length > 0 && requiresStrictMessageMatch) {
    const actionArgs = isRecord(params.action.args) ? params.action.args : null
    const actionMessageIds = normalizeMessageIds(actionArgs?.message_ids)
    if (!arraysEqual(candidateMessageIds, actionMessageIds)) return false
  }

  const candidateArgs = params.candidate.proposed_action.args
  const actionArgs = isRecord(params.action.args) ? params.action.args : null
  if (candidateArgs && actionArgs) {
    const candidateSender = normalizeRuntimeString(candidateArgs.sender)
    const actionSender = normalizeRuntimeString(actionArgs.sender)
    if (candidateSender && actionSender && candidateSender !== actionSender) return false

    const candidateBatchTitle = normalizeRuntimeString(candidateArgs.batch_title)
    const actionBatchTitle = normalizeRuntimeString(actionArgs.batch_title)
    if (candidateBatchTitle && actionBatchTitle && candidateBatchTitle !== actionBatchTitle) return false

    const candidateClusterId = normalizeRuntimeString(candidateArgs.cluster_id)
    const actionClusterId = normalizeRuntimeString(actionArgs.cluster_id)
    if (candidateClusterId && actionClusterId && candidateClusterId !== actionClusterId) return false

    const candidateQuery = normalizeRuntimeString(candidateArgs.query)
    const actionQuery = normalizeRuntimeString(actionArgs.query)
    if (candidateQuery && actionQuery && candidateQuery !== actionQuery) return false
  }

  return true
}

function resolveRuntimeSuggestionCandidateStatus(params: {
  candidate: RuntimeSuggestedActionCandidate
  history: RuntimeSuggestionHistory
}): { status: RuntimeSuggestedActionCandidate['status']; approval_id?: string } {
  for (const request of params.history.requests) {
    const matches = request.proposed_actions.some((action) =>
      doesProposedActionMatchCandidate({
        candidate: params.candidate,
        action,
      })
    )
    if (!matches) continue

    const approvalId = request.approval_id
    if (params.history.executed_approvals.has(approvalId)) {
      return { status: 'executed', approval_id: approvalId }
    }

    const decision = params.history.latest_decision_by_approval.get(approvalId)
    if (decision === 'approved') {
      return { status: 'approved', approval_id: approvalId }
    }

    if (decision === 'rejected') {
      return { status: 'ready' }
    }

    return { status: 'pending_approval', approval_id: approvalId }
  }

  return { status: 'ready' }
}

export function applyRuntimeSuggestionStatuses(params: {
  suggestionSet: RuntimeSuggestionSet
  history: RuntimeSuggestionHistory
}): RuntimeSuggestionSet {
  return {
    ...params.suggestionSet,
    candidates: params.suggestionSet.candidates.map((candidate) => {
      const resolved = resolveRuntimeSuggestionCandidateStatus({
        candidate,
        history: params.history,
      })

      return {
        ...candidate,
        status: resolved.status,
        ...(resolved.approval_id ? { approval_id: resolved.approval_id } : {}),
      }
    }),
  }
}

function summarizeRuntimeSuggestionCandidate(candidate: RuntimeSuggestedActionCandidate): string {
  return `${candidate.label} -> ${candidate.proposed_action.tool}.${candidate.proposed_action.action} (${candidate.message_ids.length} messages)`
}

export function deriveRuntimeSuggestionPromptContext(
  runtimeSuggestionSets: RuntimeSuggestionSet[]
): RuntimeSuggestionPromptContext {
  const readyActions: string[] = []
  const executedActions: string[] = []
  let hasExecutedArchive = false

  for (const set of runtimeSuggestionSets) {
    for (const candidate of set.candidates) {
      if (candidate.status === 'ready') {
        readyActions.push(summarizeRuntimeSuggestionCandidate(candidate))
      }

      if (candidate.status === 'executed') {
        executedActions.push(summarizeRuntimeSuggestionCandidate(candidate))
        if (
          candidate.proposed_action.tool === 'gmail' &&
          candidate.proposed_action.action === 'archive_messages'
        ) {
          hasExecutedArchive = true
        }
      }
    }
  }

  return {
    ready_actions: readyActions,
    executed_actions: executedActions,
    has_ready_actions: readyActions.length > 0,
    has_executed_archive: hasExecutedArchive,
  }
}
