import type {
  RuntimeActiveBatch,
  RuntimeActiveWorkItem,
  RuntimeBatchSuggestions,
  RuntimeCleanupPlan,
  RuntimeCleanupStrategy,
  RuntimeMailboxProfile,
  RuntimeRecommendation,
  RuntimeReviewProposal,
} from '@/lib/runtime/gmailRuntimeAssembler'
import type {
  RuntimeSuggestionPromptContext,
  RuntimeSuggestionSet,
} from '@/lib/runtime/suggestionLifecycle'
import type {
  RuntimeArchiveEvidence,
  RuntimeEvidence,
  RuntimeQueryReviewEvidence,
  RuntimeReviewEvidence,
} from '@/lib/runtime/stateLoaders'

export type RuntimeProposalForPrompt = {
  user_request: string
  proposed_actions: Array<{ tool: string; action: string }>
  approval_required: true
  reason: string
}

export type BuildPlaygroundSystemPromptParams = {
  summary: Record<string, unknown>
  agentPrimaryPrompt: string | null
  runtimeProposal: RuntimeProposalForPrompt | null
  runtimeEvidence: RuntimeEvidence | null
  runtimeRecommendation: RuntimeRecommendation | null
  runtimeReviewProposal: RuntimeReviewProposal | null
  runtimeReviewEvidence: RuntimeReviewEvidence | null
  runtimeQueryReviewEvidence: RuntimeQueryReviewEvidence | null
  runtimeArchiveEvidence: RuntimeArchiveEvidence | null
  runtimeActiveBatch: RuntimeActiveBatch | null
  runtimeBatchSuggestions: RuntimeBatchSuggestions | null
  runtimeCleanupPlan: RuntimeCleanupPlan | null
  runtimeMailboxProfile: RuntimeMailboxProfile | null
  runtimeCleanupStrategy: RuntimeCleanupStrategy | null
  runtimeActiveWorkItem: RuntimeActiveWorkItem | null
  runtimeSuggestionSets: RuntimeSuggestionSet[]
  runtimeSuggestionPromptContext: RuntimeSuggestionPromptContext
  ragSources: string[]
  crawlDomains: string[]
  ragContextBlocks: string[]
}

function normalizeRuntimeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function formatAnalysisWindowLabel(value: 7 | 30 | 60 | 90 | 180 | 365 | 'all_indexed'): string {
  return value === 'all_indexed' ? 'all indexed' : `${value}d`
}

export function buildPlaygroundSystemPrompt(params: BuildPlaygroundSystemPromptParams): string {
  const sysLines: string[] = []
  const summary = params.summary

  if (summary.agent_type) {
    sysLines.push(`You are a ${String(summary.agent_type)}.`)
  } else {
    sysLines.push('You are an AI assistant acting as a company agent.')
  }

  if (summary.company) {
    sysLines.push(`Company: ${String(summary.company)}`)
  }

  if (summary.mission) {
    sysLines.push(`Mission: ${String(summary.mission)}`)
  }

  if (summary.audience) {
    sysLines.push(`Primary audience: ${String(summary.audience)}`)
  }

  if (summary.tone) {
    sysLines.push(`Speak in this tone: ${String(summary.tone)}`)
  }

  if (summary.topics) {
    sysLines.push(`Key topics / expertise: ${String(summary.topics)}`)
  }

  if (summary.guardrails) {
    sysLines.push(
      `Guardrails (legal / brand / compliance): ${String(summary.guardrails)}. Always obey these.`
    )
  }

  if (summary.constraints) {
    sysLines.push(`Additional constraints / things to avoid: ${String(summary.constraints)}`)
  }

  if (params.runtimeProposal) {
    sysLines.push(
      'Runtime guidance: The user is asking for inbox analysis or cleanup support. Inbox metadata analysis via runtime approval is the correct first step before recommending cleanup actions.'
    )
    sysLines.push(
      'When runtime_proposal exists, do not say "I cannot create runtime approval requests". Instead say: "I\'ve prepared a runtime action proposal above. Click the action button on the proposal card to continue."'
    )
    sysLines.push(
      'Consequence clarity: For analyze-inbox proposals, explicitly state that this step only previews inbox metadata and does not archive/delete anything yet.'
    )
  }

  if (params.runtimeEvidence) {
    sysLines.push(
      `Runtime evidence (trusted; do not fabricate additional inbox facts): ${JSON.stringify(params.runtimeEvidence.inbox_analysis)}`
    )
  }

  if (params.runtimeRecommendation) {
    const reviewedSender = params.runtimeReviewEvidence
      ? normalizeRuntimeString(params.runtimeReviewEvidence.sender_review.sender)
      : ''
    const recommendedSender = normalizeRuntimeString(params.runtimeRecommendation.sender)
    const recommendationIsNewBatch =
      !reviewedSender || !recommendedSender || reviewedSender !== recommendedSender

    if (recommendationIsNewBatch) {
      sysLines.push(
        `Runtime recommendation: Next sender cluster is "${params.runtimeRecommendation.batch_title}" for sender ${params.runtimeRecommendation.sender} (${params.runtimeRecommendation.count} messages in sample). Use this as the next concrete review batch instead of repeating completed work.`
      )
    }
  }

  if (params.runtimeReviewEvidence) {
    sysLines.push(
      `Runtime reviewed-batch evidence (trusted; do not fabricate additional sender-review facts): ${JSON.stringify(params.runtimeReviewEvidence.sender_review)}`
    )
    sysLines.push(
      'Archive recommendation rule: only recommend archive when reviewed evidence indicates low action value for this user; reference engagement signals and protected/excluded signals explicitly.'
    )
  }

  if (params.runtimeReviewProposal) {
    sysLines.push(
      'Consequence clarity: For sender-cluster review proposals, explicitly state this step only reviews a bounded sender sample, causes no inbox changes now, and is followed by approval-gated action recommendations.'
    )
  }

  if (params.runtimeQueryReviewEvidence) {
    sysLines.push(
      `Runtime query-cluster review evidence (trusted; exact query already reviewed): ${JSON.stringify(params.runtimeQueryReviewEvidence.query_review)}`
    )
    sysLines.push(
      'Use the reviewed query evidence to recommend conservative next steps. Keep actions approval-gated and bounded; do not assume bulk execution.'
    )
    sysLines.push(
      'Recommendation trust rule: when suggesting archive, explain why this looks low-value for this user using reviewed evidence signals (important/starred/reply-like/unread), what was protected/excluded, confidence, and whether the recommendation is engagement-based or pattern-based.'
    )
  }

  if (params.runtimeArchiveEvidence) {
    sysLines.push(
      `Runtime archive evidence (trusted; do not fabricate additional archive facts): ${JSON.stringify(params.runtimeArchiveEvidence.archive_result)}`
    )
    sysLines.push(
      'Runtime archive rule: Treat archived message_ids as completed work. Do not recommend archiving the same completed batch again.'
    )
  }

  if (params.runtimeActiveBatch) {
    sysLines.push(
      `Runtime active batch context: Treat "${params.runtimeActiveBatch.batch_title}" (sender: ${params.runtimeActiveBatch.sender}, fetched_count: ${params.runtimeActiveBatch.fetched_count}, executed_at: ${params.runtimeActiveBatch.executed_at}) as the current working inbox batch. Prioritize follow-up guidance for this batch and keep recommendations read-only.`
    )
    if (params.runtimeSuggestionPromptContext.has_executed_archive) {
      sysLines.push(
        'Runtime active batch progress: Archive action has already executed for this batch. Do not recommend archiving this same batch again.'
      )
    }
  }

  if (params.runtimeBatchSuggestions && params.runtimeSuggestionSets.length === 0) {
    sysLines.push(
      `Runtime batch suggestions (heuristic, approval-gated only; do not claim execution): ${JSON.stringify(params.runtimeBatchSuggestions)}`
    )
  }

  if (params.runtimeCleanupPlan) {
    const preview = params.runtimeCleanupPlan.clusters
      .slice(0, 5)
      .map((cluster) => `${cluster.title} [${cluster.status}] (~${cluster.estimated_count})`)
      .join(' | ')
    sysLines.push(
      `Runtime query-backed cleanup plan (read-only): safety_defaults=${JSON.stringify(
        params.runtimeCleanupPlan.safety_defaults
      )}; clusters=${preview || 'none'}.`
    )
    sysLines.push(
      'When recommending cleanup, prefer these query-backed clusters and always include the exact Gmail query, estimated count, sample preview caveat, and risk note before any approval.'
    )
    sysLines.push(
      'Consequence clarity: For query-cluster review steps, clearly state this is preview-only, no inbox mutation happens in this step, and archive/mutation requires a later separate approval.'
    )
  }

  if (params.runtimeMailboxProfile) {
    const categoryPreview = params.runtimeMailboxProfile.recurring_categories
      .slice(0, 3)
      .map((entry) => `${entry.category}:${entry.estimated_count}`)
      .join(', ')
    const senderPreview = params.runtimeMailboxProfile.sender_frequency
      .slice(0, 3)
      .map((entry) => `${entry.sender} (${entry.count}, ${entry.signal})`)
      .join(', ')

    sysLines.push(
      `Mailbox profile (${formatAnalysisWindowLabel(params.runtimeMailboxProfile.analysis_window_days)} window; high-level estimates): categories=${categoryPreview || 'none'}; top_senders=${senderPreview || 'none'}.`
    )
    sysLines.push(
      'Use mailbox profile signals to prioritize strategy, but describe them as estimates and require bounded review before mutation proposals.'
    )
    if (
      params.runtimeMailboxProfile.notes.some((note) =>
        normalizeRuntimeString(note).includes('estimate') &&
        normalizeRuntimeString(note).includes('overlap')
      )
    ) {
      sysLines.push(
        'Estimate uncertainty: Gmail resultSizeEstimate can overlap across related queries. Present cluster counts as directional, not precise.'
      )
    }
  } else {
    sysLines.push(
      'Cleanup promotion guard: If no 30-day mailbox profile is available, keep guidance in analysis/review mode and do not push approval-for-cleanup tone.'
    )
  }

  if (
    params.runtimeEvidence &&
    params.runtimeEvidence.inbox_analysis.sample_size <= 25 &&
    !params.runtimeMailboxProfile
  ) {
    sysLines.push(
      'Sample-size guard: A 25-message sample is not enough for broad cleanup strategy. Recommend mailbox profiling and bounded reviews before cleanup approvals.'
    )
  }

  if (params.runtimeCleanupStrategy) {
    const protectPreview = params.runtimeCleanupStrategy.protect_first
      .slice(0, 2)
      .map((entry) => `${entry.title}${entry.estimated_count != null ? ` (~${entry.estimated_count})` : ''}`)
      .join(' | ')
    const wavesPreview = params.runtimeCleanupStrategy.best_first_cleanup_waves
      .slice(0, 3)
      .map((entry) => `${entry.title}${entry.estimated_count != null ? ` (~${entry.estimated_count})` : ''}`)
      .join(' | ')
    const rulesPreview = params.runtimeCleanupStrategy.rule_opportunities
      .slice(0, 2)
      .map((entry) => entry.title)
      .join(' | ')
    const avoidPreview = params.runtimeCleanupStrategy.avoid_or_review_carefully
      .slice(0, 2)
      .map((entry) => entry.title)
      .join(' | ')

    sysLines.push(
      `Runtime cleanup strategy (${formatAnalysisWindowLabel(params.runtimeCleanupStrategy.analysis_window_days)}, ${params.runtimeCleanupStrategy.freshness_status}): protect_first=${protectPreview || 'none'}; cleanup_waves=${wavesPreview || 'none'}; rules=${rulesPreview || 'none'}; avoid_or_review=${avoidPreview || 'none'}.`
    )
    sysLines.push(
      `Runtime cleanup strategy confidence: ${params.runtimeCleanupStrategy.recommendation_confidence}.`
    )
    sysLines.push(
      'When asked for strategy or next steps, present recommendations in this order: Protect first → Best first cleanup waves → Rule opportunities → Avoid/review carefully. Keep estimates labeled as estimates.'
    )
  }

  if (params.runtimeActiveWorkItem) {
    sysLines.push(`Runtime active work item: ${JSON.stringify(params.runtimeActiveWorkItem)}`)
  }

  if (params.runtimeSuggestionSets.length > 0) {
    sysLines.push(
      `Runtime suggestion sets (approval-gated proposals only): ${JSON.stringify(params.runtimeSuggestionSets)}`
    )
    sysLines.push(
      'Next-step rule: Recommend only candidates with status "ready". Never present "pending_approval", "approved", or "executed" candidates as the next task.'
    )
    sysLines.push(
      `Runtime ready actions: ${
        params.runtimeSuggestionPromptContext.ready_actions.length > 0
          ? params.runtimeSuggestionPromptContext.ready_actions.join(' | ')
          : 'none'
      }`
    )
    sysLines.push(
      `Runtime completed actions: ${
        params.runtimeSuggestionPromptContext.executed_actions.length > 0
          ? params.runtimeSuggestionPromptContext.executed_actions.join(' | ')
          : 'none'
      }`
    )
    if (!params.runtimeSuggestionPromptContext.has_ready_actions) {
      sysLines.push(
        'If asked for the next task and no ready actions remain in this batch, explicitly say this batch has no remaining ready actions and move to the next sensible step (for example, review another sender cluster or refresh inbox analysis evidence).'
      )
    }
  }

  if (params.ragContextBlocks.length > 0) {
    sysLines.push(
      '\nWhen answering, you MUST rely primarily on the following context blocks. ' +
        'If the user asks something that is not supported by these blocks or clearly outside ' +
        'your documented knowledge, say that you do not have that information instead of guessing.'
    )
  }

  if (params.ragSources.length) {
    sysLines.push(
      `Reference documents have been synced from these sources: ${params.ragSources.join(
        ', '
      )}. Your answers should be consistent with those documents.`
    )
  }

  if (params.crawlDomains.length) {
    sysLines.push(
      `The company website / help center lives at: ${params.crawlDomains.join(
        ', '
      )}. Use this only as high-level background context.`
    )
  }

  if (params.agentPrimaryPrompt) {
    sysLines.push('\nBase agent prompt:\n' + params.agentPrimaryPrompt)
  }

  sysLines.push(`
URL & LINK RULES (CRITICAL):

1. Only mention a URL or link if it appears explicitly in:
   • The RAG context blocks below, or
   • The static configuration in this system prompt (e.g., crawl_domains, rag_sources, or base site URL).

2. NEVER guess or invent a URL path, article slug, or product URL.
   • If the user asks for a specific article or product link and you do not see that exact URL in the context, say you do not know the exact link and instead:
     – Point them to the main site or relevant top-level page you DO see, or
     – Suggest they use the site’s navigation or search.

3. When listing blog posts or products:
   • Use the titles, headings, or descriptions that appear in the RAG context.
   • If titles are unclear or missing, summarize what the context says instead of making up catchy names.

4. When unsure:
   • Be honest. Say something like: "I don’t have the exact URL or title for that page in my current training data."
   • Do NOT fabricate URLs that “look right” (e.g., /the-science-behind-psilocybin).
`)

  if (params.ragContextBlocks.length > 0) {
    sysLines.push('\n=== RAG CONTEXT BLOCKS ===')
    sysLines.push(params.ragContextBlocks.join('\n\n---\n\n'))
  }

  return sysLines.join('\n')
}

export function buildPlaygroundReviewDetailSystemPrompt(params: {
  summary: Record<string, unknown>
  agentPrimaryPrompt: string | null
}): string {
  const sysLines: string[] = []

  sysLines.push(
    'You are a result-detail assistant for a reviewed inbox batch. This chat is scoped to one reviewed result.'
  )
  sysLines.push(
    'Scope rule: prioritize only the reviewed-result evidence included in the user message context for this turn.'
  )
  sysLines.push(
    'Treat the user message as the canonical result-context block. Use only those provided fields when explaining recommendations.'
  )
  sysLines.push(
    'Do not switch to broad inbox workflow planning unless the user explicitly asks to return to overall workflow context.'
  )
  sysLines.push(
    'If evidence is ambiguous, say so clearly and explain what is estimate vs observed sample.'
  )
  sysLines.push(
    'Focus areas: cluster makeup, sender/pattern interpretation, recommendation rationale, risk/ambiguity, future prevention suitability, and what execution would do.'
  )
  sysLines.push(
    'When asked "why archive" or similar, explicitly reference the provided evidence signals (engagement indicators, sample makeup, and safety exclusions) before giving a recommendation.'
  )
  sysLines.push(
    'Always clarify action consequences: preview/review steps do not mutate inbox state; archive/delete/subscription effects only happen in later approved execution steps.'
  )
  sysLines.push(
    'Response style requirement: clearly separate observed evidence from estimated signals. Be explicit about ambiguity and confidence.'
  )
  sysLines.push(
    'Signal caveat: opened/open-tracking status is not available here; when discussing engagement, frame it as inferred from unread/important/starred/reply-like cues.'
  )
  sysLines.push(
    'Do not provide broad inbox next-step advice unless the user explicitly asks to leave result-detail scope.'
  )
  sysLines.push(
    'Do not claim inbox mutations are happening in this review step.'
  )

  if (params.summary.company) {
    sysLines.push(`Company context: ${String(params.summary.company)}`)
  }

  if (params.summary.tone) {
    sysLines.push(`Response tone: ${String(params.summary.tone)}`)
  }

  if (params.summary.guardrails) {
    sysLines.push(
      `Guardrails (always obey): ${String(params.summary.guardrails)}`
    )
  }

  if (params.agentPrimaryPrompt) {
    sysLines.push('\nBase agent prompt context:\n' + params.agentPrimaryPrompt)
  }

  return sysLines.join('\n')
}
