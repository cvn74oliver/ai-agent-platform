'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type RuntimeReviewResult = {
  id: string
  kind: 'review_sender_cluster' | 'review_query_cluster'
  executed_at: string
  approval_id: string
  title: string
  objective: string
  source_label: string
  cluster_id: string | null
  cluster_type: string | null
  sender: string | null
  query: string | null
  estimated_count: number | null
  fetched_count: number
  sample_subject_lines: string[]
  snippet_previews: string[]
  messages: Array<{
    message_id: string
    subject: string | null
    from: string | null
    date: string | null
    snippet: string | null
    label_ids?: string[]
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
  risk_note: string | null
  safety_note: string | null
}

type RuntimeReviewEvidence = {
  executed_at: string
  approval_id: string
  sender_review: {
    sender: string
    fetched_count: number
    sample_subject_lines: string[]
    snippet_previews: string[]
    messages: Array<{
      message_id: string
      subject: string | null
      from: string | null
      date: string | null
      snippet: string | null
      label_ids?: string[]
      is_unread?: boolean
      is_important?: boolean
      is_starred?: boolean
    }>
  }
}

type RuntimeQueryReviewEvidence = {
  executed_at: string
  approval_id: string
  query_review: {
    cluster_id: string
    cluster_type: string
    title: string
    query: string
    estimated_count: number | null
    fetched_count: number
    sample_subject_lines: string[]
    snippet_previews: string[]
    reviewed_messages_preview: Array<{
      message_id: string
      subject: string | null
      from: string | null
      date: string | null
      snippet: string | null
      label_ids?: string[]
      is_unread?: boolean
      is_important?: boolean
      is_starred?: boolean
    }>
    risk_note: string
    safety_note: string
  }
}

type PlaygroundApiResponse = {
  ok?: boolean
  error?: string
  data?: {
    session_id?: string
    runtime_review_results?: RuntimeReviewResult[]
    runtime_review_evidence?: RuntimeReviewEvidence
    runtime_query_review_evidence?: RuntimeQueryReviewEvidence
    reply?: string
  }
}

type ClusterSummaryEntry = {
  label: string
  count: number
}

type ClusterSummary = {
  topSenders: ClusterSummaryEntry[]
  topPatterns: ClusterSummaryEntry[]
  homogeneity: string
  ambiguity: string
}

type SenderPreference = 'keep' | 'neutral' | 'deprioritize'

type EngagementSignals = {
  sampledCount: number
  unreadCount: number
  importantCount: number
  starredCount: number
  repliedHeuristicCount: number
  engagementRisk: 'low' | 'medium' | 'high'
  confidence: 'preliminary' | 'moderate'
  evidenceMode: 'engagement_based' | 'pattern_based'
}

const SENDER_PREFERENCES_STORAGE_PREFIX = 'playground.runtime.sender_preferences.v1'

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

function normalizeSenderIdentity(value: string | null | undefined): string {
  const raw = (value || '').trim().toLowerCase()
  if (!raw) return ''
  const emailMatch = raw.match(/<([^>]+)>/)
  const email = emailMatch?.[1]?.trim().toLowerCase() || raw
  if (!email) return raw
  const atIndex = email.indexOf('@')
  if (atIndex > 0 && atIndex < email.length - 1) return email
  return raw
}

function senderPreferenceStorageKey(agentId: string): string {
  return `${SENDER_PREFERENCES_STORAGE_PREFIX}:${agentId}`
}

function deriveEngagementSignals(
  messages: Array<{
    subject: string | null
    is_unread?: boolean
    is_important?: boolean
    is_starred?: boolean
  }>
): EngagementSignals {
  const sampledCount = messages.length
  let unreadCount = 0
  let importantCount = 0
  let starredCount = 0
  let repliedHeuristicCount = 0

  for (const message of messages) {
    if (message.is_unread) unreadCount += 1
    if (message.is_important) importantCount += 1
    if (message.is_starred) starredCount += 1
    if (typeof message.subject === 'string' && /^\s*re:/i.test(message.subject)) {
      repliedHeuristicCount += 1
    }
  }

  const interactionTouches = importantCount + starredCount + repliedHeuristicCount
  const engagementRatio = sampledCount > 0 ? interactionTouches / sampledCount : 0
  const engagementRisk: EngagementSignals['engagementRisk'] =
    engagementRatio >= 0.3 || importantCount > 0 || starredCount > 0
      ? 'high'
      : engagementRatio >= 0.12 || unreadCount > Math.max(1, Math.floor(sampledCount * 0.4))
        ? 'medium'
        : 'low'

  return {
    sampledCount,
    unreadCount,
    importantCount,
    starredCount,
    repliedHeuristicCount,
    engagementRisk,
    confidence: sampledCount >= 12 ? 'moderate' : 'preliminary',
    evidenceMode: sampledCount >= 5 ? 'engagement_based' : 'pattern_based',
  }
}

function subjectPattern(subject: string): string {
  const text = subject.toLowerCase()
  if (/\b(ship|shipping|delivery|dispatch|tracking)\b/.test(text)) return 'Shipping updates'
  if (/\b(invoice|receipt|payment|bill|refund)\b/.test(text)) return 'Invoices / receipts'
  if (/\b(newsletter|digest|subscription|unsubscribe|promo|sale|offer|deal)\b/.test(text)) return 'Newsletter / promotional'
  if (/\b(alert|verify|verification|otp|security|code)\b/.test(text)) return 'Alerts / security'
  if (/\b(order|purchase|confirmation)\b/.test(text)) return 'Order confirmations'
  return 'General updates'
}

function summarizeResult(result: RuntimeReviewResult): ClusterSummary {
  const senderCounts = new Map<string, number>()
  const patternCounts = new Map<string, number>()

  for (const msg of result.messages) {
    const sender = (msg.from || '').trim() || 'Unknown sender'
    senderCounts.set(sender, (senderCounts.get(sender) || 0) + 1)
    const subject = (msg.subject || '').trim()
    if (subject) {
      const pattern = subjectPattern(subject)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    }
  }

  if (patternCounts.size === 0) {
    for (const subject of result.sample_subject_lines || []) {
      const s = (subject || '').trim()
      if (!s) continue
      const pattern = subjectPattern(s)
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
    }
  }

  const topSenders = Array.from(senderCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5)

  const topPatterns = Array.from(patternCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5)

  const total = Math.max(result.messages.length, result.sample_subject_lines.length, 1)
  const topSenderShare = topSenders.length > 0 ? topSenders[0].count / Math.max(1, result.messages.length) : 0
  const topPatternShare = topPatterns.length > 0 ? topPatterns[0].count / total : 0
  const riskHints = `${result.risk_note || ''} ${result.safety_note || ''}`.toLowerCase()
  const ambiguous = /\boverlap|estimate|ambiguous|mixed\b/.test(riskHints)

  return {
    topSenders,
    topPatterns,
    homogeneity: topSenderShare >= 0.7 || topPatternShare >= 0.7 ? 'Mostly homogeneous' : 'Mixed',
    ambiguity: ambiguous ? 'High overlap / ambiguity' : topPatternShare >= 0.55 ? 'Low ambiguity' : 'Moderate ambiguity',
  }
}

function deriveRecommendedAction(params: {
  result: RuntimeReviewResult
  summary: ClusterSummary
  senderPreference: SenderPreference
  engagement: EngagementSignals
}) {
  const { result, summary, senderPreference, engagement } = params
  const typeText = `${result.cluster_type || ''} ${result.title}`.toLowerCase()
  const looksLowAction = /\b(newsletter|promotional|transactional|no-reply|notification|updates|shipping|invoice)\b/.test(typeText)
  const highAmbiguity = summary.ambiguity.toLowerCase().includes('high')
  const senderProtected = senderPreference === 'keep'
  const engagementHighRisk = engagement.engagementRisk === 'high'

  if (senderProtected) {
    return {
      label: 'No action recommended yet',
      reason: 'Sender is marked Always keep. Archive recommendations are suppressed for this source.',
      executeEffect:
        'No archive action should be proposed for this sender while Keep preference is active.',
      futureRule: {
        recommend: false,
        reason: 'Keep preference indicates this sender should remain protected.',
        target: result.sender || result.source_label,
        safety: 'Protected by sender preference.',
      },
    }
  }

  if (highAmbiguity) {
    return {
      label: 'No action recommended yet',
      reason: 'This cluster appears mixed or high-overlap. Run another bounded review before proposing mutation.',
      executeEffect:
        'No mutation should run yet. Collect another review pass or narrow query scope first.',
      futureRule: {
        recommend: false,
        reason: 'Not stable enough for a reliable prevention rule.',
        target: result.source_label,
        safety: 'Needs additional review.',
      },
    }
  }

  if (looksLowAction) {
    return {
      label: 'Archive this reviewed batch',
      reason:
        engagementHighRisk
          ? 'Pattern fit is low-action-value, but engagement risk is elevated. Consider another review before archive.'
          : 'Patterns look low-action-value and consistent with reviewed evidence.',
      executeEffect:
        'If approved and executed, INBOX label is removed from the selected batch; messages remain in All Mail.',
      futureRule: {
        recommend: !engagementHighRisk,
        reason: engagementHighRisk
          ? 'Engagement risk is elevated; avoid durable rule until additional review.'
          : 'Recurring low-action-value traffic appears stable.',
        target: result.sender || result.source_label,
        safety: engagementHighRisk
          ? 'Needs careful review.'
          : 'Safe for supervised rule proposal; keep manual review before enabling durable automation.',
      },
    }
  }

  return {
    label: 'No action recommended yet',
    reason: 'Evidence does not yet indicate a conservative mutation action.',
    executeEffect: 'Continue with analysis/review-first flow before mutation approvals.',
    futureRule: {
      recommend: false,
      reason: 'Pattern confidence is limited.',
      target: result.source_label,
      safety: 'Needs careful review.',
    },
  }
}

function fallbackReviewResults(data?: PlaygroundApiResponse['data']): RuntimeReviewResult[] {
  if (!data) return []
  const fromQuery = data.runtime_query_review_evidence
    ? [
        {
          id: `${data.runtime_query_review_evidence.approval_id}|review_query_cluster|${data.runtime_query_review_evidence.executed_at}|${data.runtime_query_review_evidence.query_review.cluster_id}`,
          kind: 'review_query_cluster' as const,
          executed_at: data.runtime_query_review_evidence.executed_at,
          approval_id: data.runtime_query_review_evidence.approval_id,
          title: data.runtime_query_review_evidence.query_review.title,
          objective: 'Review this query-backed cluster before any cleanup mutation is proposed.',
          source_label: data.runtime_query_review_evidence.query_review.title,
          cluster_id: data.runtime_query_review_evidence.query_review.cluster_id,
          cluster_type: data.runtime_query_review_evidence.query_review.cluster_type,
          sender: null,
          query: data.runtime_query_review_evidence.query_review.query,
          estimated_count: data.runtime_query_review_evidence.query_review.estimated_count,
          fetched_count: data.runtime_query_review_evidence.query_review.fetched_count,
          sample_subject_lines: data.runtime_query_review_evidence.query_review.sample_subject_lines,
          snippet_previews: data.runtime_query_review_evidence.query_review.snippet_previews,
          messages: data.runtime_query_review_evidence.query_review.reviewed_messages_preview,
          risk_note: data.runtime_query_review_evidence.query_review.risk_note,
          safety_note: data.runtime_query_review_evidence.query_review.safety_note,
        },
      ]
    : []

  const fromSender = data.runtime_review_evidence
    ? [
        {
          id: `${data.runtime_review_evidence.approval_id}|review_sender_cluster|${data.runtime_review_evidence.executed_at}|${data.runtime_review_evidence.sender_review.sender}`,
          kind: 'review_sender_cluster' as const,
          executed_at: data.runtime_review_evidence.executed_at,
          approval_id: data.runtime_review_evidence.approval_id,
          title: `${data.runtime_review_evidence.sender_review.sender} sender review`,
          objective: 'Review this sender cluster before any cleanup mutation is proposed.',
          source_label: data.runtime_review_evidence.sender_review.sender,
          cluster_id: null,
          cluster_type: 'sender_cluster',
          sender: data.runtime_review_evidence.sender_review.sender,
          query: null,
          estimated_count: null,
          fetched_count: data.runtime_review_evidence.sender_review.fetched_count,
          sample_subject_lines: data.runtime_review_evidence.sender_review.sample_subject_lines,
          snippet_previews: data.runtime_review_evidence.sender_review.snippet_previews,
          messages: data.runtime_review_evidence.sender_review.messages,
          risk_note: null,
          safety_note: 'Read-only bounded sender preview. No inbox changes in this review step.',
        },
      ]
    : []

  return [...fromQuery, ...fromSender].sort(
    (a, b) => Date.parse(b.executed_at || '') - Date.parse(a.executed_at || '')
  )
}

function buildScopedUserMessage(params: {
  result: RuntimeReviewResult
  userQuestion: string
  senderPreference: SenderPreference
  engagement: EngagementSignals
}): string {
  const { result, userQuestion, senderPreference, engagement } = params
  const summary = summarizeResult(result)
  const recommendation = deriveRecommendedAction({
    result,
    summary,
    senderPreference,
    engagement,
  })
  const topSenders = summary.topSenders
    .slice(0, 4)
    .map((entry) => `${entry.label} (${entry.count})`)
    .join(' | ')
  const topPatterns = summary.topPatterns
    .slice(0, 4)
    .map((entry) => `${entry.label} (${entry.count})`)
    .join(' | ')
  const examples = result.messages
    .slice(0, 4)
    .map(
      (message) =>
        `${message.subject || '(no subject)'} | ${message.from || 'Unknown sender'} | ${
          message.date || 'Date unavailable'
        }`
    )
    .join(' || ')

  return [
    'Result-detail scope: answer only using this reviewed batch evidence.',
    'If the question is outside this reviewed result, say so and ask whether to return to broader workflow context.',
    'Required response style: Observed evidence; Estimated/uncertain signals; Recommendation rationale; Safety/exclusions.',
    `Title: ${result.title}`,
    `Kind: ${result.kind}`,
    `Objective: ${result.objective}`,
    `Scope: ${result.estimated_count != null ? `~${result.estimated_count} estimated` : 'estimated not available'}; ${result.fetched_count} previewed`,
    `Source: ${result.source_label}`,
    `Cluster type: ${result.cluster_type || 'unknown'}`,
    `Risk: ${result.risk_note || 'not provided'}`,
    `Safety: ${result.safety_note || 'not provided'}`,
    `Makeup: ${summary.homogeneity}; ${summary.ambiguity}`,
    `Top senders: ${topSenders || 'not available'}`,
    `Top patterns: ${topPatterns || 'not available'}`,
    `Representative examples: ${examples || 'not available'}`,
    'Opened status note: opened tracking is not available in this Gmail metadata flow; engagement is inferred from unread, important, starred, and reply-like subject signals.',
    `Engagement signals: sampled=${engagement.sampledCount}, unread=${engagement.unreadCount}, important=${engagement.importantCount}, starred=${engagement.starredCount}, reply_like=${engagement.repliedHeuristicCount}, risk=${engagement.engagementRisk}, mode=${engagement.evidenceMode}, confidence=${engagement.confidence}`,
    `Sender preference: ${senderPreference}`,
    `Recommended action: ${recommendation.label}`,
    `Recommended action reason: ${recommendation.reason}`,
    `Future prevention: ${recommendation.futureRule.recommend ? 'recommend rule' : 'no rule yet'} for ${recommendation.futureRule.target}; ${recommendation.futureRule.safety}`,
    `Question: ${userQuestion}`,
  ].join('\n')
}

export default function PlaygroundReviewResultPage() {
  const supabase = useMemo(() => createClient(), [])
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workflowSessionId, setWorkflowSessionId] = useState<string | null>(null)
  const [resultChatSessionId, setResultChatSessionId] = useState<string | null>(null)
  const [results, setResults] = useState<RuntimeReviewResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatApiHistory, setChatApiHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [senderPreferences, setSenderPreferences] = useState<Record<string, SenderPreference>>({})

  const requestedResultId = (() => {
    const value = searchParams.get('result_id')
    return value && value.trim() ? value.trim() : null
  })()
  const requestedSessionId = (() => {
    const value = searchParams.get('playground_session_id')
    return value && value.trim() ? value.trim() : null
  })()
  const showDebugMode = process.env.NODE_ENV !== 'production' && searchParams.get('debug') === '1'

  useEffect(() => {
    async function loadData() {
      const agentId = typeof params?.id === 'string' ? params.id : null
      if (!agentId) {
        setError('Agent id is missing.')
        setLoading(false)
        return
      }

      try {
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('id')
          .eq('id', agentId)
          .single()
        if (agentError || !agentData) {
          setError('Agent not found or access denied.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/agents/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: agentId,
            messages: [],
            session_id: requestedSessionId,
            rehydrate_only: true,
            request_mode: 'playground_review_detail',
          }),
        })
        const payload = (await res.json()) as PlaygroundApiResponse
        if (!res.ok || !payload.ok) {
          setError(payload.error || 'Failed to load review results.')
          setLoading(false)
          return
        }

        const responseSessionId =
          typeof payload.data?.session_id === 'string' && payload.data.session_id.trim()
            ? payload.data.session_id.trim()
            : null
        setWorkflowSessionId(responseSessionId || requestedSessionId || null)

        const reviewResults =
          Array.isArray(payload.data?.runtime_review_results) && payload.data?.runtime_review_results.length > 0
            ? payload.data.runtime_review_results
            : fallbackReviewResults(payload.data)
        const sorted = [...reviewResults].sort(
          (a, b) => Date.parse(b.executed_at || '') - Date.parse(a.executed_at || '')
        )
        setResults(sorted)

        if (sorted.length > 0) {
          const indexFromId = requestedResultId
            ? sorted.findIndex((item) => normalize(item.id) === normalize(requestedResultId))
            : -1
          setSelectedIndex(indexFromId >= 0 ? indexFromId : 0)
        } else {
          setSelectedIndex(0)
        }
      } catch (loadErr) {
        console.error('[review-detail] load error:', loadErr)
        setError('Failed to load review detail.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [params?.id, requestedResultId, requestedSessionId, supabase])

  useEffect(() => {
    const agentId = typeof params?.id === 'string' ? params.id : null
    if (!agentId || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(senderPreferenceStorageKey(agentId))
      if (!raw) {
        setSenderPreferences({})
        return
      }
      const parsed = JSON.parse(raw) as Record<string, SenderPreference>
      if (!parsed || typeof parsed !== 'object') {
        setSenderPreferences({})
        return
      }
      const normalized: Record<string, SenderPreference> = {}
      for (const [key, value] of Object.entries(parsed)) {
        if (!key.trim()) continue
        if (value === 'keep' || value === 'neutral' || value === 'deprioritize') {
          normalized[key] = value
        }
      }
      setSenderPreferences(normalized)
    } catch {
      setSenderPreferences({})
    }
  }, [params?.id])

  useEffect(() => {
    const agentId = typeof params?.id === 'string' ? params.id : null
    if (!agentId || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        senderPreferenceStorageKey(agentId),
        JSON.stringify(senderPreferences)
      )
    } catch {
      // ignore
    }
  }, [params?.id, senderPreferences])

  useEffect(() => {
    setChatMessages([])
    setChatApiHistory([])
    setResultChatSessionId(null)
  }, [selectedIndex, results])

  const selectedResult = results[selectedIndex] || null
  const summary = selectedResult ? summarizeResult(selectedResult) : null
  const selectedResultPrimarySender = selectedResult
    ? normalizeSenderIdentity(
        selectedResult.sender || summary?.topSenders[0]?.label || selectedResult.source_label
      )
    : ''
  const selectedSenderPreference: SenderPreference = selectedResultPrimarySender
    ? senderPreferences[selectedResultPrimarySender] || 'neutral'
    : 'neutral'
  const engagementSignals = selectedResult
    ? deriveEngagementSignals(
        selectedResult.messages.map((message) => ({
          subject: message.subject,
          is_unread: message.is_unread,
          is_important: message.is_important,
          is_starred: message.is_starred,
        }))
      )
    : null
  const recommendation =
    selectedResult && summary && engagementSignals
      ? deriveRecommendedAction({
          result: selectedResult,
          summary,
          senderPreference: selectedSenderPreference,
          engagement: engagementSignals,
        })
      : null
  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < results.length - 1

  const navigateToResult = (nextIndex: number) => {
    const agentId = typeof params?.id === 'string' ? params.id : null
    const next = results[nextIndex]
    if (!agentId || !next) return
    setSelectedIndex(nextIndex)
    const query = new URLSearchParams()
    query.set('result_id', next.id)
    if (workflowSessionId) query.set('playground_session_id', workflowSessionId)
    router.replace(`/agents/${agentId}/playground/review?${query.toString()}`)
  }

  const sendScopedQuestion = async () => {
    const agentId = typeof params?.id === 'string' ? params.id : null
    if (!agentId || !selectedResult || !engagementSignals || !chatInput.trim() || chatSending) return
    const userText = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userText }])
    setChatSending(true)
    try {
      const scopedContent = buildScopedUserMessage({
        result: selectedResult,
        userQuestion: userText,
        senderPreference: selectedSenderPreference,
        engagement: engagementSignals,
      })
      const nextApiHistory: ChatMessage[] = [...chatApiHistory, { role: 'user', content: scopedContent }]
      const res = await fetch('/api/agents/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          messages: nextApiHistory,
          session_id: resultChatSessionId,
          session_origin: 'playground_review_detail',
          request_mode: 'playground_review_detail',
        }),
      })
      const payload = (await res.json()) as PlaygroundApiResponse
      const reply =
        payload.ok && payload.data?.reply && typeof payload.data.reply === 'string'
          ? payload.data.reply
          : null
      if (!res.ok || !reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: payload.error || 'Unable to answer from this review result right now.' },
        ])
        return
      }
      setChatApiHistory([...nextApiHistory, { role: 'assistant', content: reply }])
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (payload.data?.session_id && payload.data.session_id.trim()) {
        setResultChatSessionId(payload.data.session_id.trim())
      }
    } catch (err) {
      console.error('[review-detail] chat error:', err)
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to answer from this review result right now.' },
      ])
    } finally {
      setChatSending(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded text-white">
          <p className="text-sm text-gray-300">Loading review result detail…</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded text-white">
          <p className="text-red-400">{error}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!selectedResult || !summary || !recommendation) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded text-white space-y-3">
          <p className="text-sm text-gray-300">No reviewed results available yet.</p>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/agents/${params.id as string}/playground${
                  workflowSessionId ? `?playground_session_id=${workflowSessionId}` : ''
                }`
              )
            }
            className="px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
          >
            Back to Playground
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded text-white space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-cyan-300">Review result detail</p>
            <h1 className="text-xl font-semibold text-cyan-100">{selectedResult.title}</h1>
            <p className="text-xs text-gray-300">{selectedResult.objective}</p>
            <p className="text-[11px] text-gray-500">
              {selectedResult.kind === 'review_query_cluster' ? 'Query review' : 'Sender review'} ·{' '}
              {new Date(selectedResult.executed_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/agents/${params.id as string}/playground${
                    workflowSessionId
                      ? `?playground_session_id=${workflowSessionId}&runtime_refresh=1`
                      : ''
                  }`
                )
              }
              className="px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-cyan-200"
            >
              Back to Playground
            </button>
            <button
              type="button"
              onClick={() => navigateToResult(selectedIndex - 1)}
              disabled={!hasPrev}
              className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                hasPrev ? 'bg-gray-800 hover:bg-gray-700 text-cyan-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => navigateToResult(selectedIndex + 1)}
              disabled={!hasNext}
              className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                hasNext ? 'bg-gray-800 hover:bg-gray-700 text-cyan-200' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {showDebugMode ? (
          <div className="flex flex-wrap gap-1.5 rounded border border-gray-800 bg-gray-950/35 p-2">
            <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
              mode_applied: playground_review_detail
            </span>
            {selectedResult?.id ? (
              <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                result_id: {selectedResult.id.slice(0, 24)}
              </span>
            ) : null}
            {selectedResult?.approval_id ? (
              <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                approval_id: {selectedResult.approval_id.slice(0, 18)}
              </span>
            ) : null}
            {selectedResult?.cluster_id ? (
              <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                cluster_id: {selectedResult.cluster_id}
              </span>
            ) : null}
            {selectedResult?.kind ? (
              <span className="rounded border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300">
                lifecycle_state: {selectedResult.kind}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-lg border border-cyan-900/50 bg-cyan-950/15 p-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="text-[11px] text-gray-300">
              <span className="text-gray-400">What was reviewed:</span> {selectedResult.source_label}
            </p>
            <p className="text-[11px] text-gray-300">
              <span className="text-gray-400">Scope:</span>{' '}
              {selectedResult.estimated_count != null
                ? `~${selectedResult.estimated_count} estimated`
                : 'estimated total unavailable'}{' '}
              · {selectedResult.fetched_count} previewed
            </p>
          </div>
          <p className="text-[11px] text-amber-300">
            Representative sample disclaimer: preview examples summarize this batch and may not enumerate every matched email.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-cyan-900/70 bg-cyan-950/40 px-2 py-0.5 text-[11px] text-cyan-100">
              {selectedResult.estimated_count != null
                ? `~${selectedResult.estimated_count} estimated`
                : 'Estimate unavailable'}
            </span>
            <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-200">
              {selectedResult.fetched_count} previewed
            </span>
            <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[11px] text-gray-200">
              Preference:{' '}
              {selectedSenderPreference === 'keep'
                ? 'Always keep this sender'
                : selectedSenderPreference === 'deprioritize'
                  ? 'Lower priority (archive candidate)'
                  : 'No preference'}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Cluster makeup</p>
            <p className="text-[11px] text-gray-300">{summary.homogeneity} · {summary.ambiguity}</p>
            <p className="text-[11px] text-gray-300">
              Top senders:{' '}
              {summary.topSenders.length > 0
                ? summary.topSenders
                    .slice(0, 4)
                    .map((entry) => `${entry.label} (${entry.count})`)
                    .join(' · ')
                : 'No sender concentration available'}
            </p>
            <p className="text-[11px] text-gray-300">
              Message types:{' '}
              {summary.topPatterns.length > 0
                ? summary.topPatterns
                    .slice(0, 4)
                    .map((entry) => `${entry.label} (${entry.count})`)
                    .join(' · ')
                : 'Pattern signals limited in preview'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Recommended action</p>
            <p className="text-[12px] font-semibold text-cyan-100">{recommendation.label}</p>
            <p className="text-[11px] text-gray-300">{recommendation.reason}</p>
            <p className="text-[11px] text-gray-400">
              Evidence mode: {engagementSignals?.evidenceMode === 'engagement_based' ? 'engagement-based' : 'pattern-based'} ·
              confidence {engagementSignals?.confidence || 'preliminary'}
            </p>
            <p className="text-[11px] text-gray-400">
              What happens if executed: {recommendation.executeEffect}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Sender treatment preference</p>
            <p className="text-[11px] text-gray-500">Changes recommendation behavior only; does not mutate inbox now.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(['keep', 'neutral', 'deprioritize'] as SenderPreference[]).map((value) => {
              const active = selectedSenderPreference === value
              const label =
                value === 'keep'
                  ? 'Always keep newsletters from this sender'
                  : value === 'deprioritize'
                    ? 'Lower priority (more likely archive candidate)'
                    : 'No preference'
              const description =
                value === 'keep'
                  ? 'Suppress archive recommendations for this sender.'
                  : value === 'deprioritize'
                    ? 'Increase archive recommendation priority after review.'
                    : 'Use reviewed evidence without sender bias.'
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (!selectedResultPrimarySender) return
                    setSenderPreferences((prev) => ({
                      ...prev,
                      [selectedResultPrimarySender]: value,
                    }))
                  }}
                  className={`rounded border px-2.5 py-1.5 text-left ${
                    active
                      ? 'border-cyan-600 bg-cyan-700/60 text-white'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-cyan-200'
                  }`}
                >
                  <p className="text-[11px] font-medium">{label}</p>
                  <p className={`mt-0.5 text-[10px] ${active ? 'text-cyan-100' : 'text-gray-400'}`}>
                    {description}
                  </p>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            Always keep suppresses archive recommendations for this sender. Lower priority raises archive priority after bounded review.
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Evidence signals</p>
          <p className="text-[11px] text-gray-300">
            Engagement: unread {engagementSignals?.unreadCount || 0}, important {engagementSignals?.importantCount || 0},
            starred {engagementSignals?.starredCount || 0}, reply-like {engagementSignals?.repliedHeuristicCount || 0}.
          </p>
          <p className="text-[11px] text-gray-300">
            Risk: {engagementSignals?.engagementRisk || 'unknown'} · mode {engagementSignals?.evidenceMode || 'pattern-based'} · confidence {engagementSignals?.confidence || 'preliminary'}.
          </p>
          <p className="text-[11px] text-gray-300">
            Opened status is not available from Gmail metadata in this flow. Engagement is inferred from unread, important, starred, and reply-like subject cues.
          </p>
          <p className="text-[11px] text-gray-400">
            Protected signals: important/starred/reply-like patterns. Exclusions: no delete, no unsubscribe, no sender blocking in this review step.
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Future prevention</p>
          <p className="text-[11px] text-gray-200">
            Recommend rule: {recommendation.futureRule.recommend ? 'Yes' : 'No'}
          </p>
          <p className="text-[11px] text-gray-300">{recommendation.futureRule.reason}</p>
          <p className="text-[11px] text-gray-400">Example target: {recommendation.futureRule.target}</p>
          <p className="text-[11px] text-gray-400">Safety: {recommendation.futureRule.safety}</p>
        </div>

        <div className="rounded-lg border border-cyan-900/40 bg-gray-950/45 p-3">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300">Representative examples</p>
          <div className="mt-1 grid grid-cols-[minmax(0,1fr)_minmax(0,190px)_120px] gap-2 border-b border-gray-800/80 pb-1 text-[10px] uppercase tracking-wide text-gray-500">
            <p>Subject</p>
            <p>Sender</p>
            <p className="text-right">Date</p>
          </div>
          <div className="mt-1 space-y-0.5">
            {selectedResult.messages.slice(0, 12).map((message) => (
              <div
                key={message.message_id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,190px)_120px] gap-2 border-t border-gray-800/80 py-1.5 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-gray-100" title={message.subject || '(no subject)'}>
                    {message.subject || '(no subject)'}
                  </p>
                  {message.snippet ? (
                    <p className="truncate text-[11px] text-gray-500" title={message.snippet}>
                      {message.snippet}
                    </p>
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-gray-400" title={message.from || 'Unknown sender'}>
                  {message.from || 'Unknown sender'}
                </p>
                <p className="text-right text-[11px] text-gray-500">{message.date || 'Date unavailable'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-cyan-900/40 bg-gray-950/55 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-cyan-300">
            Ask about this reviewed result
          </p>
          <p className="text-[11px] text-gray-400">
            This chat is scoped to the currently viewed reviewed batch evidence.
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto rounded border border-gray-800 bg-gray-950/45 p-2">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                Ask what this cluster contains, why it was selected, recommended next action, or rule suitability.
              </p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded px-2.5 py-1.5 text-xs whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-100'}`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendScopedQuestion()
                }
              }}
              placeholder="Ask about this reviewed result…"
              className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => void sendScopedQuestion()}
              disabled={chatSending || !chatInput.trim()}
              className={`px-3 py-2 rounded text-sm font-medium ${
                chatSending || !chatInput.trim()
                  ? 'bg-gray-600 cursor-not-allowed text-gray-200'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
              }`}
            >
              {chatSending ? 'Sending…' : 'Ask'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
