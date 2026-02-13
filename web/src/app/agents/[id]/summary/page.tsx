'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import ClarifyModal from '@/components/ClarifyModal'
import ImproveQualityModal from '@/components/ImproveQualityModal'

export default function AgentSummaryPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [recalcLoading, setRecalcLoading] = useState(false) // 👈 add this
  const [llmFinishSyncLoading, setLlmFinishSyncLoading] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [showClarify, setShowClarify] = useState(false)
  const [clarifyThread, setClarifyThread] = useState<
    { from: 'user' | 'ai'; text: string; timestamp: string }[]
  >([])
  const [activeClarifyKey, setActiveClarifyKey] = useState<string | null>(null)
  const [improveLoading, setImproveLoading] = useState(false)
  const [improveQueue, setImproveQueue] = useState<{ field: string; question: string }[]>([])
  const [improveIndex, setImproveIndex] = useState(0)
  const [showImproveModal, setShowImproveModal] = useState(false)
  const [improveEvalScore, setImproveEvalScore] = useState<number | null>(null)
  const [improveEvalComment, setImproveEvalComment] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [lastRagJobId, setLastRagJobId] = useState<string | null>(null)
  const [ragRunLoading, setRagRunLoading] = useState(false)
  const [ragRunMsg, setRagRunMsg] = useState<string | null>(null)
  const [ragRunErr, setRagRunErr] = useState<string | null>(null)
  const [lastRagQueuedAt, setLastRagQueuedAt] = useState<string | null>(null)
  const [lastRagMode, setLastRagMode] = useState<'delta' | 'full' | null>(null)
  const [lastRagQueuedCount, setLastRagQueuedCount] = useState<number | null>(null)
  const [ragProcessedCount, setRagProcessedCount] = useState<number | null>(null)
  const [ragJobStatus, setRagJobStatus] = useState<string | null>(null)
  const [ragJobError, setRagJobError] = useState<string | null>(null)
  const [ragJobUpdatedAt, setRagJobUpdatedAt] = useState<string | null>(null)
  const [trainingStats, setTrainingStats] = useState<{
    total_examples: number
    examples_by_type: Record<string, number>
    rag_sources: number
    latest_rag_status: string | null
  } | null>(null)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<{
  last_7_days: {
    sessions: number
    playground_sessions: number
    total_tokens: number
    approx_human_minutes: number
  }
  last_30_days: {
    sessions: number
    playground_sessions: number
    total_tokens: number
    approx_human_minutes: number
  }
} | null>(null)
const [usageLoading, setUsageLoading] = useState(false)
  const [knowledgeStats, setKnowledgeStats] = useState<{
    total_docs: number
    ok_docs: number
    error_docs: number
    sources: {
      source_url: string
      doc_count: number
      ok_count: number
      error_count: number
    }[]
  } | null>(null)
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
const [nextSuggestion, setNextSuggestion] = useState<any>(null)
const [nextSuggestionLoading, setNextSuggestionLoading] = useState(false)
const [showLlmTrainingModal, setShowLlmTrainingModal] = useState(false)
const [llmTrainingSavedCount, setLlmTrainingSavedCount] = useState(0)
const [forcedTrainingTopic, setForcedTrainingTopic] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [onboardingKey, setOnboardingKey] = useState(0)
  const [lastRecalcAt, setLastRecalcAt] = useState<string | null>(null)

function showToast(message: string, ms: number = 2400) {
  setToastMsg(message)
  window.setTimeout(() => {
    setToastMsg((cur) => (cur === message ? null : cur))
  }, ms)
}


function parseFollowupString(q: string): { field: string; question: string } | null {
  const [rawField, ...rest] = q.split(':')
  if (!rawField || rest.length === 0) return null

  const field = rawField.trim().toLowerCase()
  const question = rest.join(':').trim()
  if (!question) return null

  const allowed = [
    'agent_type',
    'company',
    'mission',
    'tone',
    'audience',
    'topics',
    'guardrails',
    'rag_links',
    'crawl_domains',
    'formats',
    'constraints',
    'product_list',
    'common_issue_categories',
    'escalation_policy',
    'custom_notes',
  ]

  if (!allowed.includes(field)) return null
  return { field, question }
}

function getFieldLabel(fieldKey: string): string {
  const map: Record<string, string> = {
    product_list: 'Products / Services Supported',
    common_issue_categories: 'Common Issue Categories',
    escalation_policy: 'Escalation Policy',
    custom_notes: 'Additional Context (Anything Else)',
  }

  if (map[fieldKey]) return map[fieldKey]

  // Default: turn "mission" or "agent_type" into "Mission" / "Agent Type"
  return fieldKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function calcRows(text: string, minRows: number, maxRows: number): number {
  const t = (text || '').trimEnd()
  if (!t) return minRows

  // Split into hard lines
  const hardLines = t.split(/\r?\n/)

  // Estimate wrapped lines (roughly 60 chars per visual line in these textareas)
  const CHARS_PER_LINE = 60
  const wrappedLines = hardLines.reduce((acc, line) => {
    const len = line.length
    return acc + Math.max(1, Math.ceil(len / CHARS_PER_LINE))
  }, 0)

  // Padding so the last line isn't cramped
  const target = wrappedLines + 1
  return Math.max(minRows, Math.min(maxRows, target))
}

  useEffect(() => {
    if (!params?.id) return
    async function loadAgent() {
      try {
const { data, error } = await supabase
  .from('agents')
  .select('*')
  .eq('id', params.id)
  .single()

console.log('[debug] 🔍 Agent Summary Query:', { id: params.id, data, error })
        if (error || !data) {
          setError('❌ Agent not found or access denied.')
        } else {
          setAgent({
          ...data,
          additional_notes: data.additional_notes || '',
          clarify_threads: data.clarify_threads || {},
        })
        }
      } catch (err: any) {
        console.error('[AgentSummaryPage] Load failed:', err)
        setError('⚠️ Error loading agent.')
      } finally {
        setLoading(false)
      }
    }
    loadAgent()
  }, [params?.id, supabase])

    useEffect(() => {
    if (!agent?.id) return

    async function fetchTrainingStats() {
      try {
        setTrainingLoading(true)
        const res = await fetch('/api/agents/training-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agent.id }),
        })

        const data = await res.json()
        console.log('[training-stats] API result:', data)

        if (!data.ok) {
          console.warn('[training-stats] error:', data.error)
          return
        }

        setTrainingStats(data.data)
      } catch (err) {
        console.error('[training-stats] fetch error:', err)
      } finally {
        setTrainingLoading(false)
      }
    }

    fetchTrainingStats()
  }, [agent?.id])

  useEffect(() => {
    if (!agent?.id) return

    async function fetchUsage() {
      try {
        setUsageLoading(true)
        const res = await fetch('/api/agents/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agent.id }),
        })

        const data = await res.json()
        console.log('[agents/usage] API result:', data)

        if (!data.ok) {
          console.warn('[agents/usage] error:', data.error)
          return
        }

        setUsageStats(data.data)
      } catch (err) {
        console.error('[agents/usage] fetch error:', err)
      } finally {
        setUsageLoading(false)
      }
    }

    fetchUsage()
  }, [agent?.id])

  useEffect(() => {
    if (!agent?.id) return

    async function fetchKnowledgeStats() {
      try {
        setKnowledgeLoading(true)
        const res = await fetch('/api/agents/knowledge-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agent.id }),
        })

        const data = await res.json()
        console.log('[knowledge-stats] API result:', data)

        if (!data.ok) {
          console.warn('[knowledge-stats] error:', data.error)
          return
        }

        setKnowledgeStats(data.data)
      } catch (err) {
        console.error('[knowledge-stats] fetch error:', err)
      } finally {
        setKnowledgeLoading(false)
      }
    }

    fetchKnowledgeStats()
  }, [agent?.id])

async function saveSummary() {
  if (!agent?.id) return

  try {
    setSaving(true)

    const res = await fetch('/api/agents/save-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        onboarding_summary: agent.onboarding_summary,
        additional_notes: agent.additional_notes,
      }),
    })

    const data = await res.json()
    console.log('[save-summary] API result:', data)

    if (!data.ok || !data.data?.agent) {
      alert(data.error || '⚠️ Failed to save agent summary.')
      return
    }

    const updated = data.data.agent
    setAgent((prev: any) => ({
      ...prev,
      ...updated,
      onboarding_summary: updated.onboarding_summary,
      additional_notes: updated.additional_notes ?? prev.additional_notes,
    }))

    alert('✅ Summary saved!')
  } catch (err) {
    console.error('Save failed:', err)
    alert('⚠️ Failed to save summary.')
  } finally {
    setSaving(false)
  }
}

function mapTrainingTopicToFieldKey(topic: string | null | undefined): string {
  const t = (topic || '').toLowerCase()
  if (!t) return 'custom_notes'

  // Canonical-ish mappings from training topics → onboarding_summary fields
  if (t.includes('mission') || t.includes('identity')) return 'mission'
  if (t.includes('tone') || t.includes('style')) return 'tone'
  if (t.includes('legal') || t.includes('compliance') || t.includes('guardrail')) return 'guardrails'
  if (t.includes('escalation') || t.includes('handoff')) return 'escalation_policy'

  // Domain knowledge / recurring issues
  if (t.includes('contamination')) return 'common_issue_categories'

  // Resources / knowledge-base pointers
  if (t.includes('resource') || t.includes('help') || t.includes('support')) return 'custom_notes'

  return 'custom_notes'
}

async function applyLlmExampleToPrompt(opts: {
  topic: string | null | undefined
  question: string
  answer: string
}) {
  if (!agent?.id) return
  setLlmFinishSyncLoading(true)
  try {
    const fieldKey = mapTrainingTopicToFieldKey(opts.topic)
    const summary = (agent.onboarding_summary || {}) as any
    const prevVal: string = summary[fieldKey] || ''

    const block = `\n\n[LLM Training Example]\nQ: ${opts.question}\nA: ${opts.answer}`
    const nextVal = prevVal ? `${prevVal}${block}` : block.trimStart()

    const updatedSummary = {
      ...summary,
      [fieldKey]: nextVal,
    }

    // Update local UI immediately
    setAgent((prev: any) => ({
      ...prev,
      onboarding_summary: updatedSummary,
    }))

    // Persist via save-summary
    const saveRes = await fetch('/api/agents/save-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        onboarding_summary: updatedSummary,
        additional_notes: agent.additional_notes,
      }),
    })

    const saveData = await saveRes.json()
    console.log('[llm-training→prompt] save-summary result:', saveData)

    // Trigger prompt rewrite / re-score
    const recalcRes = await fetch('/api/agents/recalculate-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id }),
    })

    const recalcData = await recalcRes.json()
    console.log('[llm-training→prompt] recalculate-quality result:', recalcData)

    if (recalcData.ok && recalcData.data?.agent) {
      const recalcAgent = recalcData.data.agent
      setAgent((prev: any) => ({
        ...prev,
        ...recalcAgent,
        onboarding_summary: recalcAgent.onboarding_summary,
        quality_score: recalcAgent.quality_score,
        quality_feedback: recalcAgent.quality_feedback,
      }))
    }
  } finally {
    setLlmFinishSyncLoading(false)
  }
}

async function runRecalculateOnly() {
  if (!agent?.id) return
  setLlmFinishSyncLoading(true)
  try {
    const recalcRes = await fetch('/api/agents/recalculate-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id }),
    })

    const recalcData = await recalcRes.json()
    console.log('[llm-training→prompt] recalculate-only result:', recalcData)

    if (recalcData.ok && recalcData.data?.agent) {
      const recalcAgent = recalcData.data.agent
      setAgent((prev: any) => ({
        ...prev,
        ...recalcAgent,
        onboarding_summary: recalcAgent.onboarding_summary,
        quality_score: recalcAgent.quality_score,
        quality_feedback: recalcAgent.quality_feedback,
      }))
    }
  } finally {
    setLlmFinishSyncLoading(false)
  }
}

  // --- Clarify send handler ---
  async function handleClarifySend(message: string) {
    if (!agent?.id || !activeClarifyKey) return

    const timestamp = new Date().toISOString()
    const fieldKey = activeClarifyKey

    // Start from whatever thread is currently saved for this field
    const existingThread: { from: 'user' | 'ai'; text: string; timestamp: string }[] =
      (agent.clarify_threads && agent.clarify_threads[fieldKey]) || []

    // 1️⃣ Add user message to the thread
    const userMsg = { from: 'user' as const, text: message, timestamp }
    const threadAfterUser = [...existingThread, userMsg]

    // Update local modal state
    setClarifyThread(threadAfterUser)

    // Update agent.clarify_threads in React state
    setAgent((prevAgent: any) => ({
      ...prevAgent,
      clarify_threads: {
        ...(prevAgent?.clarify_threads || {}),
        [fieldKey]: threadAfterUser,
      },
    }))

    try {
      // 2️⃣ Call Clarify API
      const res = await fetch('/api/agents/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          field_key: fieldKey,
          user_question: message,
        }),
      })

      const data = await res.json()
      console.log('[clarify] API result:', data)

      let finalThread = threadAfterUser

      // 3️⃣ If AI reply present, append to thread
      if (data?.clarification) {
        const aiTimestamp = new Date().toISOString()
        const aiMsg = {
          from: 'ai' as const,
          text: data.clarification,
          timestamp: aiTimestamp,
        }

        finalThread = [...threadAfterUser, aiMsg]

        // Update modal state with AI reply
        setClarifyThread(finalThread)

        // Update agent.clarify_threads in state with AI reply
        setAgent((prevAgent: any) => ({
          ...prevAgent,
          clarify_threads: {
            ...(prevAgent?.clarify_threads || {}),
            [fieldKey]: finalThread,
          },
        }))
      }

      // 4️⃣ Persist to Supabase immediately
      const updatedThreads = {
        ...(agent.clarify_threads || {}),
        [fieldKey]: finalThread,
      }

      const { error: updErr } = await supabase
        .from('agents')
        .update({ clarify_threads: updatedThreads })
        .eq('id', agent.id)

      if (updErr) {
        console.error('[clarify] failed to persist clarify_threads:', updErr)
      } else {
        console.log('[clarify] clarify_threads saved successfully')
      }
    } catch (err) {
      console.error('[clarify] failed:', err)
    }
  }

async function recalculateQuality(forceRefine?: unknown) {
  if (!agent?.id) return

  try {
    setRecalcLoading(true)
    const res = await fetch('/api/agents/recalculate-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        ...(forceRefine === true ? { force_refine: true } : {}),
      }),
    })

    const data = await res.json()
    console.log('[recalculate-quality] API result:', data)

    if (!data.ok || !data.data?.agent) {
      alert(data.error || '⚠️ Failed to recalculate quality.')
      return
    }

    const updated = data.data.agent

    // Update local agent state so the new score + rewritten fields show up immediately
    setAgent((prev: any) => ({
      ...prev,
      ...updated,
      onboarding_summary: updated.onboarding_summary,
      quality_score: updated.quality_score,
      quality_feedback: updated.quality_feedback,
    }))
    setOnboardingKey((k) => k + 1)
    setLastRecalcAt(new Date().toLocaleString())
    showToast(
      forceRefine === true
        ? '✅ Full rewrite complete (forced refine).'
        : '✅ Quality score recalculated (fast).',
      6000
    )
  } catch (err) {
    console.error('[recalculate-quality] error:', err)
    alert('⚠️ Recalculate quality failed. Check console for details.')
  } finally {
    setRecalcLoading(false)
  }
}

async function improveQuality() {
  if (!agent?.id) return

  try {
    setImproveLoading(true)
    const res = await fetch('/api/agents/improve-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id }),
    })

    const data = await res.json()
    console.log('[improve-quality] API result:', data)

    if (!data.ok) {
      alert(data.error || '⚠️ Failed to generate improvement questions.')
      return
    }

    const { score, comment, followups } = data.data || {}
    setImproveEvalScore(typeof score === 'number' ? score : null)
    setImproveEvalComment(typeof comment === 'string' ? comment : null)

    if (!Array.isArray(followups) || followups.length === 0) {
      alert(
        `No additional follow-up questions were suggested.\n\nCurrent eval score: ${
          score ?? 'N/A'
        }`
      )
      return
    }

    const parsed = followups
      .map((f: string) => parseFollowupString(f))
      .filter((x): x is { field: string; question: string } => x !== null)

    if (parsed.length === 0) {
      alert('Evaluator returned follow-ups, but none mapped to known fields.')
      return
    }

    // Seed queue and open modal on the first question
    setImproveQueue(parsed)
    setImproveIndex(0)
    setShowImproveModal(true)
  } catch (err) {
    console.error('[improve-quality] error:', err)
    alert('⚠️ Improve Quality call failed. Check console for details.')
  } finally {
    setImproveLoading(false)
  }
}

async function syncKnowledge(mode: 'delta' | 'full' = 'delta') {
  if (!agent?.id) return

  // If wildcard domains exist, delta still needs scanning to discover new URLs.
  const crawl = agent?.onboarding_summary?.crawl_domains
  const crawlDomains: string[] = Array.isArray(crawl)
    ? crawl
    : typeof crawl === 'string'
    ? crawl.split(/[\n,]+/).map((v: string) => v.trim()).filter(Boolean)
    : []

  const hasWildcard = crawlDomains.some((d) => d.includes('*'))

  if (mode === 'delta' && hasWildcard) {
    showToast(
      'ℹ️ Sync New/Changed still scans wildcard domains (/*) to discover new pages. Use “Force Full Resync” to refresh already-known pages.',
      7000
    )
  }

  try {
    setSyncLoading(true)
    setRagRunErr(null)

    // optimistic UI stamp
    setLastRagQueuedAt(new Date().toLocaleString())
    setLastRagMode(mode)

    const res = await fetch('/api/rag/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        mode,
      }),
    })

    const data = await res.json().catch(() => null)
    console.log('[rag/schedule] API result:', data)

    if (!data?.ok) {
      const msg = data?.error || '⚠️ Failed to schedule RAG sync.'
      alert(msg)
      return
    }

    const docCount = Number(data?.data?.document_count ?? 0)
    const jobId = data?.data?.job_id ? String(data.data.job_id) : null

    setLastRagQueuedCount(Number.isFinite(docCount) ? docCount : 0)
    setLastRagJobId(jobId)
    setRagJobStatus('pending')
    setRagJobError(null)
    setRagProcessedCount(0)

    alert(
      `✅ Knowledge sync scheduled (${mode}).\n\nJob ID: ${jobId ?? 'n/a'}\nDocuments queued: ${docCount}`
    )
  } catch (err) {
    console.error('[syncKnowledge] error:', err)
    alert('⚠️ Failed to schedule knowledge sync. Check console for details.')
  } finally {
    setSyncLoading(false)
  }
}

async function runKnowledgeNow() {
  if (!agent?.id) return

  // If we don't have a job id, we can still attempt to run by agent_id
  // (server can decide latest job).
  const jobId = lastRagJobId

  try {
    setRagRunErr(null)
    setRagRunMsg(null)
    setRagRunLoading(true)

    const res = await fetch('/api/rag/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        ...(jobId ? { job_id: jobId } : {}),
      }),
    })

    const data = await res.json().catch(() => null)
    console.log('[rag/run] API result:', data)

    if (!data?.ok) {
      const msg = data?.error || '⚠️ Failed to run knowledge sync worker.'
      setRagRunErr(msg)
      alert(msg)
      return
    }

    setRagRunMsg('✅ Knowledge sync worker started (or continued). Refreshing stats…')

    // Small delay so the worker can update job status/chunks.
    await new Promise((r) => setTimeout(r, 500))

    // Refresh knowledge + training stats so UI updates.
    try {
      const ks = await fetch('/api/agents/knowledge-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })
      const ksData = await ks.json()
      if (ksData?.ok) setKnowledgeStats(ksData.data)
    } catch {}

    try {
      const ts = await fetch('/api/agents/training-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })
      const tsData = await ts.json()
      if (tsData?.ok) setTrainingStats(tsData.data)
    } catch {}

    alert('✅ Knowledge sync worker triggered. Check “Knowledge Sources Summary” for updated counts.')
  } catch (err) {
    console.error('[runKnowledgeNow] error:', err)
    const msg = '⚠️ Failed to run knowledge sync worker. Check console for details.'
    setRagRunErr(msg)
    alert(msg)
  } finally {
    setRagRunLoading(false)
  }
}

async function openFineTunePreview() {
  if (!agent?.id) return

  try {
    setPreviewLoading(true)
    setPreviewOpen(true)
    setPreviewData(null)

    const res = await fetch('/api/agents/fine-tune/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id }),
    })

    const data = await res.json()
    console.log('[fine-tune/preview] API result:', data)

    if (!data.ok) {
      alert(data.error || '⚠️ Failed to load fine-tune preview.')
      setPreviewData(null)
      return
    }

    setPreviewData(data.data)
  } catch (err) {
    console.error('[openFineTunePreview] error:', err)
    alert('⚠️ Something went wrong while loading the preview. Check console for details.')
    setPreviewData(null)
  } finally {
    setPreviewLoading(false)
  }
}

async function startLlmTrainingSession(topicOverride?: string) {
  // Reset the per-session saved counter ONLY when the user starts a new session
  setLlmTrainingSavedCount(0)

  if (topicOverride) {
    setForcedTrainingTopic(topicOverride)
    await askNextTrainingStep(topicOverride)
    return
  }

  setForcedTrainingTopic(null)
  await askNextTrainingStep()
}

async function askNextTrainingStep(topicOverride?: string) {
  if (!agent?.id) return

  try {
    setNextSuggestionLoading(true)

    const res = await fetch('/api/agents/fine-tune/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        ...(topicOverride ? { topic: topicOverride } : {}),
      }),
    })

    const data = await res.json()
    console.log('[fine-tune/orchestrate] API result:', data)

    if (!data.ok) {
      alert(data.error || '⚠️ Failed to load next training suggestion.')
      setNextSuggestion(null)
      setShowLlmTrainingModal(false)
      return
    }

    const suggestion = data.data || null
    setNextSuggestion(suggestion)

    const forcedCompleted =
      !!topicOverride && !!suggestion?.topic && suggestion.topic !== topicOverride

    // If we forced a topic but the orchestrator returned a different one, the forced topic is met (or invalid).
    // In that case, exit forced mode and stop here (don't auto-continue into the next category).
    if (forcedCompleted) {
      setForcedTrainingTopic(null)
      setShowLlmTrainingModal(false)

      showToast('✅ Topic target met. Opening updated dataset preview…')

      // Refresh + reopen the dataset preview so you see the updated Top Priority immediately.
      await openFineTunePreview()

      return
    }

    // If we received a concrete suggested question, open the LLM training modal
    if (suggestion && suggestion.suggested_question) {
      setShowLlmTrainingModal(true)
    }
  } catch (err) {
    console.error('[askNextTrainingStep] error:', err)
    alert('⚠️ Something went wrong while loading the next training step. Check console for details.')
    setNextSuggestion(null)
  } finally {
    setNextSuggestionLoading(false)
  }
}

async function handleImproveSubmit(answer: string, mode: 'next' | 'finish') {
  if (!agent?.id || !improveQueue.length) {
    setShowImproveModal(false)
    return
  }

  const current = improveQueue[improveIndex]
  const trimmed = answer.trim()

  // If nothing was provided, just move on / finish
  if (!trimmed) {
    if (mode === 'next' && improveIndex < improveQueue.length - 1) {
      setImproveIndex((idx) => idx + 1)
      return
    }

    // No answer + finish → just close
    setShowImproveModal(false)
    return
  }

  // Merge answer into onboarding_summary for that field
  const fieldKey = current.field
  const currentSummary = (agent.onboarding_summary || {}) as any
  const prevVal: string = currentSummary[fieldKey] || ''
  const updatedFieldValue = prevVal ? `${prevVal}\n${trimmed}` : trimmed

  const updatedSummary = {
    ...currentSummary,
    [fieldKey]: updatedFieldValue,
  }

  const updatedAgent = {
    ...agent,
    onboarding_summary: updatedSummary,
  }

  // Update local state so UI reflects the change immediately
  setAgent(updatedAgent)

    // Also log this improved answer as a fine-tune example
  try {
    await fetch('/api/agents/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: updatedAgent.id,
        role: 'assistant',
        message: updatedFieldValue,
        rating: 'up',              // we treat Improve Q&A edits as positive training
        source: 'improve_qna',     // so we can filter by source later
      }),
    })
  } catch (err) {
    console.error('[improve-quality] feedback log failed:', err)
    // non-fatal: we don't block the rest of the flow
  }

  // Persist via save-summary
  try {
    const saveRes = await fetch('/api/agents/save-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: updatedAgent.id,
        onboarding_summary: updatedSummary,
        additional_notes: updatedAgent.additional_notes,
      }),
    })

    const saveData = await saveRes.json()
    console.log('[improve-quality] intermediate save result:', saveData)
  } catch (err) {
    console.error('[improve-quality] intermediate save failed:', err)
  }

  // Recalculate quality so the user sees the new score
  try {
    const recalcRes = await fetch('/api/agents/recalculate-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: updatedAgent.id }),
    })

    const recalcData = await recalcRes.json()
    console.log('[improve-quality] recalc after answer:', recalcData)

    if (recalcData.ok && recalcData.data?.agent) {
      const recalcAgent = recalcData.data.agent
      setAgent((prev: any) => ({
        ...prev,
        ...recalcAgent,
        onboarding_summary: recalcAgent.onboarding_summary,
        quality_score: recalcAgent.quality_score,
        quality_feedback: recalcAgent.quality_feedback,
      }))
      setImproveEvalScore(recalcAgent.quality_score ?? null)
    }
  } catch (err) {
    console.error('[improve-quality] recalc error:', err)
  }

  // Decide whether to move to next or finish
  if (mode === 'next' && improveIndex < improveQueue.length - 1) {
    setImproveIndex((idx) => idx + 1)
  } else {
    setShowImproveModal(false)
  }
}

// --- LLM Training Modal handler ---
async function handleLlmTrainingSubmit(answer: string, mode: 'next' | 'finish') {
  console.log('[llm-training] handleLlmTrainingSubmit', {
    mode,
    hasAgent: !!agent?.id,
    hasSuggestion: !!nextSuggestion?.suggested_question,
    suggestionTopic: nextSuggestion?.topic,
  })

  if (!agent?.id || !nextSuggestion?.suggested_question) {
    setShowLlmTrainingModal(false)
    return
  }

  const trimmed = answer.trim()
  if (!trimmed) {
    // If user finishes without typing an answer, still run the rewrite if they already
    // saved at least one example in this session (i.e., they are on 2nd+ question).
    if (mode === 'finish' && llmTrainingSavedCount > 0) {
      setShowLlmTrainingModal(false)
      await runRecalculateOnly()
      return
    }

    // Otherwise (first question with no input), just close.
    setShowLlmTrainingModal(false)
    return
  }

  try {
    await fetch('/api/agents/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agent.id,
        source: 'manual_finetune',
        rating: 'up',
        user_input: nextSuggestion.suggested_question,
        agent_output: trimmed,
        tags: {
          topic: nextSuggestion.topic || null,
          dimension: nextSuggestion.dimension || null,
          mode: 'manual_finetune',
        },
      }),
    })

    setLlmTrainingSavedCount((n) => n + 1)

    if (mode === 'finish') {
      // Close the modal immediately so the user can see the "Updating agent quality…" banner
      // while we run the longer prompt/RAG sync + re-score.
      setShowLlmTrainingModal(false)

      try {
        await applyLlmExampleToPrompt({
          topic: nextSuggestion.topic || null,
          question: nextSuggestion.suggested_question,
          answer: trimmed,
        })
      } catch (e) {
        console.error('[llm-training→prompt] apply failed:', e)
      }

      // We already closed the modal above.
      return
    }

    if (mode === 'next') {
      // Behave like "Save & Next": close current modal, then ask for a new suggestion.
      setShowLlmTrainingModal(false)
      const topicOverride = forcedTrainingTopic || undefined
      await askNextTrainingStep(topicOverride)
    } else {
      // Default to closing.
      setShowLlmTrainingModal(false)
    }
  } catch (err) {
    console.error('[llm-training] feedback log failed:', err)
    // On error, close the modal so the user isn't stuck.
    setShowLlmTrainingModal(false)
  }
}

  // Fine-tuning controls (same logic as Edit Agent page)
async function updateFineTune(action: string) {
  if (!agent || !agent.id) {
    console.warn('[updateFineTune] Tried to fine-tune before agent loaded.')
    alert('⚠️ Agent data not loaded yet. Please wait.')
    return
  }

  try {
    setIsTraining(true)

    // 🟢 1) START → hit the fine-tune/start API
    if (action === 'started') {
      console.log('[updateFineTune] calling /api/agents/fine-tune/start for', agent.id)

      const res = await fetch('/api/agents/fine-tune/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      })

      const data = await res.json()
      console.log('[updateFineTune] /fine-tune/start result:', data)

      if (!data.ok) {
        alert(data.error || '⚠️ Failed to start fine-tune job.')
        return
      }

      const jobId = data.data?.job_id
      const exampleCount = data.data?.example_count ?? 0

      // Refresh agent so the fine_tune_status / progress reflect "queued"
      const { data: refreshed } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent.id)
        .single()

      if (refreshed) {
        setAgent((prev: any) => ({
          ...prev,
          ...refreshed,
        }))
      }

      alert(
        `✅ Fine-tune job queued!\n\nJob ID: ${jobId}\nTraining examples: ${exampleCount}`
      )
      return
    }

    // 🟡 2) PAUSE / RESUME → keep the older direct Supabase update
    console.log(`[updateFineTune] Setting fine_tune_status → ${action} for agent`, agent.id)

    const { error } = await supabase
      .from('agents')
      .update({ fine_tune_status: action })
      .eq('id', agent.id)

    if (error) {
      console.error('[updateFineTune] Supabase error:', error)
      alert('❌ Failed to update fine-tuning status.')
      return
    }

    // Refresh local agent state so the new status shows
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent.id)
      .single()

    if (data) {
      setAgent((prev: any) => ({
        ...prev,
        ...data,
      }))
    }

    alert(`✅ Fine-tuning status updated: ${action}`)
  } catch (err) {
    console.error('[updateFineTune] Unexpected error:', err)
    alert('⚠️ Something went wrong while updating fine-tune status.')
  } finally {
    setIsTraining(false)
  }
}


// --- Poll RAG job progress (Supabase direct) ---
// We only rely on columns that exist: status/error/created_at/updated_at.
// For “progress”, we use a proxy: count of rag_documents written for this job_id.
useEffect(() => {
  if (!lastRagJobId) return
  if (!agent?.id) return

  let interval: ReturnType<typeof setInterval> | null = null
  let stopped = false

  async function poll() {
    if (stopped) return
    try {
      const { data: job, error: jobErr } = await supabase
        .from('rag_jobs')
        .select('status, error, created_at, updated_at')
        .eq('id', lastRagJobId)
        .single()

      if (!jobErr && job) {
        setRagJobStatus(job.status ?? null)
        setRagJobError(job.error ?? null)
        setRagJobUpdatedAt(job.updated_at ? new Date(job.updated_at).toLocaleString() : null)
      }

      const { count, error: cntErr } = await supabase
        .from('rag_documents')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('job_id', lastRagJobId)

      if (!cntErr && typeof count === 'number') {
        setRagProcessedCount(count)
      }

      const status = job?.status
      if (status === 'completed' || status === 'failed') {
        if (interval) clearInterval(interval)
      }

      // Refresh UI stats while running
      if (status && status !== 'completed' && status !== 'failed') {
        try {
          const ks = await fetch('/api/agents/knowledge-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agent.id }),
          })
          const ksData = await ks.json()
          if (ksData?.ok) setKnowledgeStats(ksData.data)
        } catch {}

        try {
          const ts = await fetch('/api/agents/training-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agent.id }),
          })
          const tsData = await ts.json()
          if (tsData?.ok) setTrainingStats(tsData.data)
        } catch {}
      }

      const queued = typeof lastRagQueuedCount === 'number' ? lastRagQueuedCount : null
      const processed = typeof count === 'number' ? count : null
      const pieces = [
        job?.status ? `Status: ${job.status}` : null,
        processed != null ? `Processed: ${processed}` : null,
        queued != null && queued > 0 ? `Queued: ${queued}` : null,
      ].filter(Boolean)

      if (pieces.length) setRagRunMsg(pieces.join(' • '))
    } catch (err) {
      console.warn('[RAG poll] error:', err)
    }
  }

  poll()
  interval = setInterval(poll, 4000)

  return () => {
    stopped = true
    if (interval) clearInterval(interval)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [lastRagJobId, agent?.id])

  if (loading)
    return (
      <DashboardLayout>
        <p className="text-gray-300 p-6">Loading agent summary…</p>
      </DashboardLayout>
    )

  if (error)
    return (
      <DashboardLayout>
        <p className="text-red-400 p-6">{error}</p>
      </DashboardLayout>
    )

  if (!agent)
    return (
      <DashboardLayout>
        <p className="text-gray-400 p-6">No agent data available.</p>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-950/70 px-4 py-2 shadow-lg">
            <p className="text-xs font-semibold text-emerald-100">{toastMsg}</p>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto bg-gray-900 p-6 rounded text-white">
        <h2 className="text-2xl font-bold mb-4">Agent Summary</h2>
        <p className="text-gray-400 mb-4">
          Review or edit what was learned during onboarding. You can also refine sections before
          activating your agent.
        </p>
        {llmFinishSyncLoading && (
          <div className="mb-4 border border-amber-500/40 bg-amber-950/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-200">Updating agent quality…</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Saving your LLM training example into the Prompt/RAG fields and re-scoring via the Prompt Engineer.
              This can take ~10–25 seconds.
            </p>
          </div>
        )}

        {/* 🌟 Agent Type & Quality + Recalculate */}
        <div className="mt-4 mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/60">
          {/* Agent Type */}
          {(agent.agent_type || agent.onboarding_summary?.agent_type) && (
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold text-white">Agent Type:</span>{' '}
              {agent.agent_type || agent.onboarding_summary?.agent_type}
            </p>
          )}

          {/* Quality Score */}
          {typeof agent.quality_score === 'number' && (
            <p className="text-sm text-gray-300 mb-1">
              <span className="font-semibold text-white">Quality Score:</span>{' '}
              {agent.quality_score}/10
            </p>
          )}

          {/* Quality Feedback */}
          {agent.quality_feedback && (
            <p className="text-xs text-gray-400 mt-1 italic whitespace-pre-line">
              {agent.quality_feedback}
            </p>
          )}

          {/* If no quality info yet */}
          {!agent.quality_score && !agent.quality_feedback && (
            <p className="text-xs text-gray-500 italic">
              No quality evaluation stored yet. This may be an older agent.
            </p>
          )}

          {/* Recalculate button + helper text */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-gray-400 leading-snug">
              After making manual edits below, use these tools:
              <br />
              • <span className="font-semibold">Recalculate</span> rewrites and re-scores your agent.
              <br />
              • <span className="font-semibold">Improve with Q&amp;A</span> suggests targeted questions to
                push the quality score higher.
            </p>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => recalculateQuality(false)}
                disabled={recalcLoading || llmFinishSyncLoading}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  (recalcLoading || llmFinishSyncLoading)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {llmFinishSyncLoading ? 'Updating…' : recalcLoading ? 'Recalculating…' : '🚀 Recalculate Quality Score'}
              </button>

              <button
                onClick={() => recalculateQuality(true)}
                disabled={recalcLoading || llmFinishSyncLoading}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  (recalcLoading || llmFinishSyncLoading)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title="Force the Prompt Engineer to run the full rewrite even if the agent already meets the quality target."
              >
                🧱 Force Full Rewrite
              </button>

              <button
                onClick={improveQuality}
                disabled={improveLoading || llmFinishSyncLoading}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  (improveLoading || llmFinishSyncLoading)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {llmFinishSyncLoading ? 'Updating…' : improveLoading ? 'Thinking…' : '🧠 Improve Quality with Q&A'}
              </button>
            </div>
            {lastRecalcAt && (
              <p className="mt-2 text-[11px] text-emerald-200">
                Last recalculated: <span className="font-mono">{lastRecalcAt}</span>
              </p>
            )}
          </div>
        </div>

                {/* ⚙️ Fine-Tuning */}
        <div className="mt-4 mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/60">
          <h3 className="text-sm font-semibold mb-2">⚙️ Fine-Tuning</h3>

          <p className="text-xs text-gray-300 mb-2">
            <span className="font-semibold text-white">Status:</span>{' '}
            {agent.fine_tune_status || 'not_started'}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${agent.fine_tune_progress || 0}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-400 mb-2">
            Use these controls once you’ve kicked off a fine-tuning job for this agent. Status and
            progress are synced from your training pipeline.
          </p>

<div className="flex flex-wrap gap-2">
  <button
    onClick={() => updateFineTune('started')}
    className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium"
    disabled={isTraining}
  >
    ▶ Start
  </button>
  <button
    onClick={() => updateFineTune('paused')}
    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded text-xs font-medium"
    disabled={isTraining}
  >
    ⏸ Pause
  </button>
  <button
    onClick={() => updateFineTune('resumed')}
    className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium"
    disabled={isTraining}
  >
    🔁 Resume
  </button>

  {/* Dev-only: mock worker to mark latest job completed */}
  <button
    onClick={async () => {
      if (!agent?.id) return
      try {
        const res = await fetch('/api/agents/fine-tune/mock-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agent.id }),
        })
        const data = await res.json()
        console.log('[fine-tune/mock-complete] result:', data)

        if (!data.ok || !data.data?.agent) {
          alert(data.error || '⚠️ Failed to mark fine-tune job complete.')
          return
        }

        // Update local agent state with the returned row
        const updated = data.data.agent
        setAgent((prev: any) => ({
          ...prev,
          ...updated,
        }))

        alert('✅ Fine-tune marked as completed (dev mock).')
      } catch (err) {
        console.error('[fine-tune/mock-complete] click error:', err)
        alert('⚠️ Error calling mock-complete.')
      }
    }}
    className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs font-medium"
    disabled={isTraining}
  >
    ✅ Mock Complete (dev)
  </button>
</div>
        </div>

                {/* 📊 Agent Usage (Playground) */}
        <div className="mt-4 mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/60">
          <h3 className="text-sm font-semibold mb-2">📊 Agent Usage (Playground)</h3>

          {usageLoading && (
            <p className="text-xs text-gray-400">Loading usage stats…</p>
          )}

          {!usageLoading && usageStats && (
            <div className="space-y-2 text-xs text-gray-300">
              <div>
                <p className="font-semibold text-gray-200 mb-1">
                  Last 7 days
                </p>
                <p>
                  Sessions:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_7_days.sessions}
                  </span>{' '}
                  (Playground:{' '}
                  <span className="font-mono">
                    {usageStats.last_7_days.playground_sessions}
                  </span>
                  )
                </p>
                <p>
                  Tokens used:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_7_days.total_tokens}
                  </span>
                </p>
                {(() => {
                  const tok = usageStats.last_7_days.total_tokens || 0
                  const cost = (tok / 1000) * 0.00015
                  return (
                    <p>
                      Estimated cost:&nbsp;
                      <span className="font-mono">
                        ${cost.toFixed(5)}
                      </span>
                    </p>
                  )
                })()}
                <p>
                  Approx. human time:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_7_days.approx_human_minutes}
                  </span>{' '}
                  minutes
                </p>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <p className="font-semibold text-gray-200 mb-1">
                  Last 30 days
                </p>
                <p>
                  Sessions:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_30_days.sessions}
                  </span>{' '}
                  (Playground:{' '}
                  <span className="font-mono">
                    {usageStats.last_30_days.playground_sessions}
                  </span>
                  )
                </p>
                <p>
                  Tokens used:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_30_days.total_tokens}
                  </span>
                </p>

                {(() => {
                  const tok = usageStats.last_30_days.total_tokens || 0
                  const cost = (tok / 1000) * 0.00015  // gpt-4o-mini estimate
                  return (
                    <p>
                      Estimated cost:&nbsp;
                      <span className="font-mono">
                        ${cost.toFixed(5)}
                      </span>
                    </p>
                  )
                })()}
                <p>
                  Approx. human time:&nbsp;
                  <span className="font-mono">
                    {usageStats.last_30_days.approx_human_minutes}
                  </span>{' '}
                  minutes
                </p>
              </div>

              <p className="text-[11px] text-gray-500 mt-1">
                Approx. human minutes are based on ~250 tokens per minute of
                focused writing. This helps you compare agent effort to a
                human employee.
              </p>
            </div>
          )}

          {!usageLoading && !usageStats && (
            <p className="text-xs text-gray-400">
              No recent usage recorded yet. Try chatting with this agent in the
              Playground and refresh.
            </p>
          )}
        </div>

        {/* 📈 Training Readiness */}
        <div className="mt-4 mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/60">
          <h3 className="text-sm font-semibold mb-2">📈 Training Readiness</h3>

          {trainingLoading && (
            <p className="text-xs text-gray-400">Loading training stats…</p>
          )}

          {!trainingLoading && trainingStats && (
            <>
              {/* Fine-tune dataset preview CTA + Next training suggestion */}
              <div className="mb-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-[11px] text-gray-400">
                    Review a sample of training examples before kicking off a new fine-tune job, or let the
                    Prompt Engineer suggest the next best area to train.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={openFineTunePreview}
                      disabled={previewLoading || llmFinishSyncLoading}
                      className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                        (previewLoading || llmFinishSyncLoading)
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                    >
                      {llmFinishSyncLoading ? 'Updating…' : previewLoading ? 'Loading…' : '🔍 Preview fine-tune data'}
                    </button>
                    <button
                      onClick={startLlmTrainingSession}
                      disabled={nextSuggestionLoading || llmFinishSyncLoading}
                      className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                        (nextSuggestionLoading || llmFinishSyncLoading)
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-violet-600 hover:bg-violet-700'
                      }`}
                    >
                      {llmFinishSyncLoading ? 'Updating…' : nextSuggestionLoading ? 'Thinking…' : '🧬 Next training suggestion'}
                    </button>
                  </div>
                </div>

                {nextSuggestion && (
                  <div className="border border-dashed border-violet-500/60 bg-violet-950/20 rounded-md px-3 py-2 text-[11px] text-gray-200">
                    <p className="font-semibold text-violet-200 mb-1">
                      Suggested focus:{' '}
                      <span className="font-mono">
                        {nextSuggestion.topic || 'unknown_topic'}
                      </span>
                      {nextSuggestion.dimension && (
                        <span className="text-[10px] text-gray-400">
                          {' '}
                          • Dimension: {nextSuggestion.dimension}
                        </span>
                      )}
                    </p>
                    <p className="mb-1 text-gray-300">
                      Coverage:&nbsp;
                      <span className="font-mono">
                        {nextSuggestion.coverage_pct != null
                          ? `${Math.round(nextSuggestion.coverage_pct)}%`
                          : 'n/a'}
                      </span>
                      {typeof nextSuggestion.required_examples === 'number' &&
                        typeof nextSuggestion.current_examples === 'number' && (
                          <>
                            {' '}
                            • Examples:&nbsp;
                            <span className="font-mono">
                              {nextSuggestion.current_examples} / {nextSuggestion.required_examples}
                            </span>
                          </>
                        )}
                    </p>
                    {nextSuggestion.reason && (
                      <p className="mb-1 text-gray-300 whitespace-pre-wrap">
                        {nextSuggestion.reason}
                      </p>
                    )}
                    {nextSuggestion.suggested_question && (
                      <p className="text-gray-300">
                        <span className="font-semibold">Example question:&nbsp;</span>
                        <span className="italic">
                          {nextSuggestion.suggested_question}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Progress toward a target example count */}
              {(() => {
                const target = 1000 // you can tweak this later
                const total = trainingStats.total_examples || 0
                const pct = Math.max(
                  0,
                  Math.min(100, Math.round((total / target) * 100))
                )

                return (
                  <div className="mb-3">
                    <p className="text-xs text-gray-300 mb-1">
                      Training examples logged:{' '}
                      <span className="font-semibold">
                        {total} / {target}
                      </span>{' '}
                      ({pct}%)
                    </p>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Breakdown by type */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-300 mb-1">
                  Examples by source
                </p>
                <ul className="text-[11px] text-gray-400 space-y-1">
                  {Object.entries(trainingStats.examples_by_type || {}).map(
                    ([type, count]) => (
                      <li key={type}>
                        <span className="font-mono">{type}</span>: {count}
                      </li>
                    )
                  )}
                  {Object.keys(trainingStats.examples_by_type || {}).length === 0 && (
                    <li>No training examples logged yet.</li>
                  )}
                </ul>
              </div>

              {/* Knowledge sources */}
              <div>
                <p className="text-xs font-semibold text-gray-300 mb-1">
                  Knowledge sources synced
                </p>
                <p className="text-[11px] text-gray-400">
                  Document chunks from last sync:{' '}
                  <span className="font-semibold">
                    {trainingStats.rag_sources ?? 0}
                  </span>
                  {trainingStats.latest_rag_status && (
                    <> &nbsp;•&nbsp; Last job status: {trainingStats.latest_rag_status}</>
                  )}
                </p>
              </div>
            </>
          )}

          {!trainingLoading && !trainingStats && (
            <p className="text-xs text-gray-400">
              No training stats available yet. Interact with this agent via guided setup or the
              Playground, then refresh.
            </p>
          )}
                    {/* Knowledge sources summary */}
          <div className="mt-4 border-t border-gray-700 pt-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-1">
              Knowledge Sources Summary
            </h4>
            {knowledgeLoading && (
              <p className="text-[11px] text-gray-400">Loading knowledge stats…</p>
            )}
            {!knowledgeLoading && knowledgeStats && (
              <>
                <p className="text-[11px] text-gray-400 mb-1">
                  Documents ingested:{' '}
                  <span className="font-semibold">
                    {knowledgeStats.total_docs}
                  </span>{' '}
                  • OK:{' '}
                  <span className="text-green-400 font-semibold">
                    {knowledgeStats.ok_docs}
                  </span>{' '}
                  • Errors:{' '}
                  <span className="text-red-400 font-semibold">
                    {knowledgeStats.error_docs}
                  </span>
                </p>
                {knowledgeStats.sources.length > 0 && (
                  <ul className="text-[11px] text-gray-500 space-y-1 max-h-24 overflow-y-auto">
                    {knowledgeStats.sources.slice(0, 5).map((s) => (
                      <li key={s.source_url}>
                        <span className="block truncate font-mono">
                          {s.source_url}
                        </span>
                        <span>
                          docs: {s.doc_count} •{' '}
                          <span className="text-green-400">
                            ok: {s.ok_count}
                          </span>{' '}
                          •{' '}
                          <span className="text-red-400">
                            errors: {s.error_count}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {knowledgeStats.sources.length === 0 && (
                  <p className="text-[11px] text-gray-500">
                    No crawled documents yet for this agent.
                  </p>
                )}
              </>
            )}
            {!knowledgeLoading && !knowledgeStats && (
              <p className="text-[11px] text-gray-500">
                No knowledge stats available yet. Try syncing knowledge sources first.
              </p>
            )}
          </div>
        </div>

        {/* 🧪 Playground CTA */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            onClick={() => router.push(`/agents/${agent.id}/playground`)}
            className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-sm font-medium"
          >
            🧪 Open Agent Playground
          </button>
          <p className="text-[11px] text-gray-400 leading-snug">
            Use the Playground to chat with this agent using its current prompt and settings. Great
            for sanity checks before you wire it into real workflows.
          </p>
        </div>

{/* 🧠 Onboarding Summary — restored fields */}
<div key={onboardingKey} className="mt-6">

      {/* Section: Company Info */}
      <div>
        <h4 className="text-lg font-medium text-blue-400 mb-2">🏢 Company Info</h4>
        {['company', 'mission', 'tone', 'audience'].map((field) => (
          <div key={field} className="mb-4">
            <label className="block text-sm text-gray-400 mb-1 capitalize flex items-center gap-2">
              <span>{field}</span>
              {/* Clarify badge */}
              {agent?.clarify_threads?.[field]?.length > 0 && (
                <span className="text-yellow-400 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                  💬 {agent.clarify_threads[field].length}
                </span>
              )}
            </label>

            <textarea
              value={agent.onboarding_summary?.[field] || ''}
              onChange={(e) =>
                setAgent({
                  ...agent,
                  onboarding_summary: {
                    ...agent.onboarding_summary,
                    [field]: e.target.value,
                  },
                })
              }
             rows={calcRows(agent.onboarding_summary?.[field] || '', field === 'mission' ? 6 : 4, 24)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />

            {/* Latest Clarification Preview */}
            {agent?.clarify_threads?.[field]?.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 italic">
                Latest clarification: “
                {agent.clarify_threads[field][agent.clarify_threads[field].length - 1]?.text}
                ”
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveClarifyKey(field)
                  const existingThread =
                    (agent.clarify_threads && agent.clarify_threads[field]) || []
                  setClarifyThread(existingThread)
                  setShowClarify(true)
                }}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                🗣 Get Clarification
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Section: Content Knowledge */}
      <div>
        <h4 className="text-lg font-medium text-blue-400 mb-2">📚 Content Knowledge</h4>
        {['topics', 'guardrails', 'formats', 'constraints'].map((field) => (
          <div key={field} className="mb-4">
            <label className="block text-sm text-gray-400 mb-1 capitalize flex items-center gap-2">
              <span>{field}</span>
              {agent?.clarify_threads?.[field]?.length > 0 && (
                <span className="text-yellow-400 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                  💬 {agent.clarify_threads[field].length}
                </span>
              )}
            </label>

            <textarea
              value={agent.onboarding_summary?.[field] || ''}
              onChange={(e) =>
                setAgent({
                  ...agent,
                  onboarding_summary: {
                    ...agent.onboarding_summary,
                    [field]: e.target.value,
                  },
                })
              }
              rows={calcRows(
                agent.onboarding_summary?.[field] || '',
                field === 'topics' || field === 'guardrails' ? 6 : 4,
                field === 'guardrails' ? 60 : 34
              )}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />

            {agent?.clarify_threads?.[field]?.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 italic">
                Latest clarification: “
                {agent.clarify_threads[field][agent.clarify_threads[field].length - 1]?.text}
                ”
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveClarifyKey(field)
                  const existingThread =
                    (agent.clarify_threads && agent.clarify_threads[field]) || []
                  setClarifyThread(existingThread)
                  setShowClarify(true)
                }}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                🗣 Get Clarification
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Section: Agent-Specific Details */}
      {(agent.onboarding_summary?.product_list ||
        agent.onboarding_summary?.common_issue_categories ||
        agent.onboarding_summary?.escalation_policy ||
        agent.onboarding_summary?.custom_notes) && (
        <div>
          <h4 className="text-lg font-medium text-blue-400 mb-2">🧩 Agent-Specific Details</h4>

          {[
            ['product_list', 'Products / Services Supported'],
            ['common_issue_categories', 'Common Issue Categories'],
            ['escalation_policy', 'Escalation Policy'],
            ['custom_notes', 'Additional Context (Anything Else)'],
          ].map(([fieldKey, label]) => (
            <div key={fieldKey} className="mb-4">
              <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
                <span>{label}</span>

                {/* Clarify badge */}
                {agent?.clarify_threads?.[fieldKey]?.length > 0 && (
                  <span className="text-yellow-400 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                    💬 {agent.clarify_threads[fieldKey].length}
                  </span>
                )}
              </label>

              <textarea
                value={
                  fieldKey === 'product_list'
                    ? (agent.onboarding_summary?.product_list || agent.onboarding_summary?.products_services_supported || '')
                    : (agent.onboarding_summary?.[fieldKey] || '')
                }
                onChange={(e) =>
                  setAgent((prev: any) => ({
                    ...prev,
                    onboarding_summary: {
                      ...prev.onboarding_summary,
                      [fieldKey]: e.target.value,
                    },
                  }))
                }
                rows={calcRows(
                  fieldKey === 'product_list'
                    ? (agent.onboarding_summary?.product_list ||
                        agent.onboarding_summary?.products_services_supported ||
                        '')
                    : (agent.onboarding_summary?.[fieldKey] || ''),
                  fieldKey === 'product_list' ? 6 : fieldKey === 'custom_notes' ? 10 : 3,
                  fieldKey === 'custom_notes' ? 48 : 24
                )}
                className="w-full p-2 rounded bg-gray-800 text-white"
              />

              {/* Latest Clarification Preview */}
              {agent?.clarify_threads?.[fieldKey]?.length > 0 && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  Latest clarification: “
                  {
                    agent.clarify_threads[fieldKey][
                      agent.clarify_threads[fieldKey].length - 1
                    ]?.text
                  }
                  ”
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveClarifyKey(fieldKey)
                    const existingThread =
                      (agent.clarify_threads && agent.clarify_threads[fieldKey]) || []
                    setClarifyThread(existingThread)
                    setShowClarify(true)
                  }}
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
                  🗣 Get Clarification
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section: Data & Links */}
      <div>
        <h4 className="text-lg font-medium text-blue-400 mb-2">🌐 Data & Links</h4>

        {/* RAG Sources */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            RAG Sources (one per line)
          </label>
          <textarea
            value={
              Array.isArray(agent.onboarding_summary?.rag_links)
                ? agent.onboarding_summary.rag_links.join('\n')
                : agent.onboarding_summary?.rag_links || ''
            }
            onChange={(e) =>
              setAgent({
                ...agent,
                onboarding_summary: {
                  ...agent.onboarding_summary,
                  rag_links: e.target.value
                    .split(/\r?\n/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
            rows={calcRows(
              Array.isArray(agent.onboarding_summary?.rag_links)
                ? agent.onboarding_summary.rag_links.join('\n')
                : agent.onboarding_summary?.rag_links || '',
              3,
              16
            )}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>

        {/* Crawl Domains */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            Crawl Domains (one per line)
          </label>
          <textarea
            value={(() => {
              const raw = agent.onboarding_summary?.crawl_domains
              if (Array.isArray(raw)) return raw.join('\n')
              if (typeof raw === 'string') {
                // If the model returned a comma-separated string, normalize to one per line
                return raw.replace(/,\s*/g, '\n')
              }
              return ''
            })()}
            onChange={(e) =>
              setAgent({
                ...agent,
                onboarding_summary: {
                  ...agent.onboarding_summary,
                  crawl_domains: e.target.value
                    .split(/\r?\n/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
            rows={calcRows(
              (() => {
                const raw = agent.onboarding_summary?.crawl_domains
                if (Array.isArray(raw)) return raw.join('\n')
                if (typeof raw === 'string') return raw.replace(/,\s*/g, '\n')
                return ''
              })(),
              4,
              18
            )}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>
                {/* Sync Knowledge Sources */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] text-gray-400 leading-snug">
            <p className="font-semibold">Sync Knowledge Sources</p>
            <p>
              “Sync New/Changed” is optimized for incremental updates. Wildcards (like <span className="font-mono">/*</span>) still need scanning to discover new pages.
              Use “Force Full Resync” to refresh already-known pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => syncKnowledge('delta')}
              disabled={syncLoading}
              className={`px-4 py-2 rounded text-xs font-medium whitespace-nowrap ${
                syncLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {syncLoading ? 'Scheduling…' : '🟢 Sync New/Changed'}
            </button>

            <button
              onClick={() => syncKnowledge('full')}
              disabled={syncLoading}
              className={`px-4 py-2 rounded text-xs font-medium whitespace-nowrap ${
                syncLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-rose-700 hover:bg-rose-600'
              }`}
            >
              {syncLoading ? 'Scheduling…' : '🔴 Force Full Resync'}
            </button>

            <button
              onClick={runKnowledgeNow}
              disabled={ragRunLoading || syncLoading || !lastRagJobId}
              className={`px-4 py-2 rounded text-xs font-medium whitespace-nowrap ${
                (ragRunLoading || syncLoading || !lastRagJobId)
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title="Dev/manual trigger. In production this becomes unnecessary once a real worker runs automatically."
            >
              {ragRunLoading ? 'Running…' : '⚙️ Run Sync Worker'}
            </button>
          </div>
        </div>

        {(lastRagJobId || lastRagQueuedAt || ragRunMsg || ragRunErr) && (
          <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/50 p-3 text-[11px] text-gray-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                {lastRagQueuedAt && (
                  <div>
                    <span className="text-gray-400">Last scheduled:</span>{' '}
                    <span className="font-mono">{lastRagQueuedAt}</span>
                    {lastRagMode && (
                      <>
                        {' '}
                        <span className="text-gray-500">•</span>{' '}
                        <span className="font-mono">{lastRagMode}</span>
                      </>
                    )}
                  </div>
                )}
                {lastRagJobId && (
                  <div>
                    <span className="text-gray-400">Job ID:</span>{' '}
                    <span className="font-mono">{lastRagJobId}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Status:</span>{' '}
                  <span className="font-mono">{ragJobStatus || 'unknown'}</span>
                  {typeof ragProcessedCount === 'number' && (
                    <>
                      {' '}
                      <span className="text-gray-500">•</span>{' '}
                      <span className="font-mono">Processed {ragProcessedCount}</span>
                    </>
                  )}
                </div>
                {ragJobUpdatedAt && (
                  <div>
                    <span className="text-gray-400">Last update:</span>{' '}
                    <span className="font-mono">{ragJobUpdatedAt}</span>
                  </div>
                )}
                {ragJobError && (
                  <div className="text-red-300">
                    <span className="font-semibold">Job error:</span> {ragJobError}
                  </div>
                )}
                {ragRunErr && (
                  <div className="text-red-300">
                    <span className="font-semibold">Run error:</span> {ragRunErr}
                  </div>
                )}
                {ragRunMsg && <div className="text-gray-400">{ragRunMsg}</div>}
              </div>

              <div className="text-gray-500">
                You can leave this page — the job continues server-side. Come back to see updated counts.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>


        {/* Owner-only Notes (meta, not prompt) */}
        <div className="mt-6">
          <label className="block text-sm text-gray-400 mb-1">
            Owner Notes (not used in prompt)
          </label>
          <textarea
            value={agent.additional_notes || ''}
            onChange={(e) =>
              setAgent({ ...agent, additional_notes: e.target.value })
            }
            rows={calcRows(agent.additional_notes || '', 4, 16)}
            className="w-full p-2 rounded bg-gray-800 text-white"
            placeholder="Internal notes for you or your team. These are NOT part of the agent’s prompt."
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          <button
            onClick={saveSummary}
            disabled={saving || llmFinishSyncLoading}
            className={`px-4 py-2 rounded transition-colors ${
              (saving || llmFinishSyncLoading) ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {llmFinishSyncLoading ? 'Updating…' : saving ? '💾 Saving…' : '💾 Save'}
          </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <button
            disabled
            className="bg-gray-700 cursor-not-allowed px-4 py-2 rounded text-sm text-gray-400"
          >
            🎤 Voice Editing Coming Soon
          </button>

          <p className="text-[11px] text-gray-400">
            Voice edits will run through the Prompt Engineer to refine and re-score your agent automatically.
          </p>
        </div>
        </div>
      </div>

      <ImproveQualityModal
        isOpen={showLlmTrainingModal && !!nextSuggestion?.suggested_question}
        onClose={() => {
          setShowLlmTrainingModal(false)
          setForcedTrainingTopic(null)
        }}
        mode="llm_finetune"
        question={
          nextSuggestion?.suggested_question ||
          'The training orchestrator did not provide a question.'
        }
        fieldLabel={
          nextSuggestion?.topic
            ? getFieldLabel(nextSuggestion.topic)
            : 'LLM Training Question'
        }
        fieldKey={nextSuggestion?.topic || 'llm_training'}
        initialAnswer=""
        currentScore={null}
        evalComment={null}
        targetScore={null}
        onSubmit={handleLlmTrainingSubmit}
        onClarifyField={(fieldKey) => {
          setActiveClarifyKey(fieldKey)
          const existingThread =
            (agent.clarify_threads && agent.clarify_threads[fieldKey]) || []
          setClarifyThread(existingThread)
          setShowClarify(true)
        }}
      />

      <ImproveQualityModal
        isOpen={showImproveModal && improveQueue.length > 0}
        onClose={() => setShowImproveModal(false)}
        question={
          improveQueue[improveIndex]?.question ||
          'The Prompt Engineer does not have any more questions right now.'
        }
        fieldLabel={getFieldLabel(improveQueue[improveIndex]?.field || '')}
        fieldKey={improveQueue[improveIndex]?.field || ''}
        initialAnswer=""
        currentScore={improveEvalScore ?? agent.quality_score ?? null}
        evalComment={improveEvalComment ?? agent.quality_feedback ?? null}
        targetScore={9}
        onSubmit={handleImproveSubmit}
        onClarifyField={(fieldKey) => {
          // ✅ DO NOT close the Improve modal here
          setActiveClarifyKey(fieldKey)
          const existingThread =
            (agent.clarify_threads && agent.clarify_threads[fieldKey]) || []
          setClarifyThread(existingThread)
          setShowClarify(true)
        }}
      />

      {previewOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-semibold">🧬 Fine-Tune Dataset Preview</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Total examples:{' '}
                  <span className="font-semibold">
                    {previewData?.total_examples ?? 0}
                  </span>
                  {typeof (improveEvalScore ?? agent.quality_score) === 'number' && (
                    <>
                      {' '}
                      • Current quality score:{' '}
                      <span className="font-semibold">
                        {(improveEvalScore ?? agent.quality_score)}/10
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-400 hover:text-white text-sm px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
              {/* By source */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-1">By Source</h3>
                {previewData?.by_source && Object.keys(previewData.by_source).length > 0 ? (
                  <ul className="space-y-1">
                    {Object.entries(previewData.by_source).map(([src, count]) => (
                      <li key={src}>
                        <span className="font-mono text-gray-300">{src}</span>: {count as number}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No source breakdown available yet.</p>
                )}
              </div>

              {/* By label */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-1">By Quality Label</h3>
                {previewData?.by_label && Object.keys(previewData.by_label).length > 0 ? (
                  <ul className="space-y-1">
                    {Object.entries(previewData.by_label).map(([lbl, count]) => (
                      <li key={lbl}>
                        <span className="font-mono text-gray-300">{lbl}</span>: {count as number}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No labeled examples yet.</p>
                )}
              </div>

              {/* Topic coverage */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-1">Topic Coverage</h3>
                {previewData?.coverage_by_topic && previewData.coverage_by_topic.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
                      <thead className="bg-gray-800 text-gray-200">
                        <tr>
                          <th className="px-2 py-1">Category</th>
                          <th className="px-2 py-1">Dimension</th>
                          <th className="px-2 py-1">Count</th>
                          <th className="px-2 py-1">Target</th>
                          <th className="px-2 py-1">Coverage</th>
                          <th className="px-2 py-1">Variants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const dimPriority: Record<string, number> = {
                            policy: 0,
                            escalation: 1,
                            identity: 2,
                            domain: 3,
                          }

                          const sorted = [...previewData.coverage_by_topic].sort((a: any, b: any) => {
                            const aCount = Number(a?.count ?? 0)
                            const bCount = Number(b?.count ?? 0)
                            const aTarget = Number(a?.min_examples ?? 0)
                            const bTarget = Number(b?.min_examples ?? 0)
                            const aRemaining = Math.max(0, aTarget - aCount)
                            const bRemaining = Math.max(0, bTarget - bCount)

                            const aNeeds = aTarget > 0 && aRemaining > 0
                            const bNeeds = bTarget > 0 && bRemaining > 0

                            // 1) Needs first
                            if (aNeeds !== bNeeds) return aNeeds ? -1 : 1

                            // 2) Dimension priority
                            const aDim = String(a?.dimension || 'other')
                            const bDim = String(b?.dimension || 'other')
                            const aDimRank = dimPriority[aDim] ?? 9
                            const bDimRank = dimPriority[bDim] ?? 9
                            if (aDimRank !== bDimRank) return aDimRank - bDimRank

                            // 3) Higher remaining first
                            if (aRemaining !== bRemaining) return bRemaining - aRemaining

                            // 4) Lower coverage first
                            const aCov = Number(a?.coverage_pct ?? 0)
                            const bCov = Number(b?.coverage_pct ?? 0)
                            if (aCov !== bCov) return aCov - bCov

                            // 5) Stable tie-breaker
                            const aTopic = String(a?.topic || '')
                            const bTopic = String(b?.topic || '')
                            return aTopic.localeCompare(bTopic)
                          })

                          return sorted.map((row: any, idx: number) => {
                            const count = Number(row.count ?? 0)
                            const target = Number(row.min_examples ?? 0)
                            const remaining = Math.max(0, target - count)
                            const needsAttention = target > 0 && remaining > 0
                            const isTopPriority = idx === 0 && needsAttention

                            return (
                              <tr
                                key={row.dimension + '-' + row.topic + '-' + idx}
                                className={
                                  isTopPriority
                                    ? 'bg-indigo-900/40 ring-1 ring-indigo-500/30'
                                    : idx % 2 === 0
                                    ? 'bg-gray-900'
                                    : 'bg-gray-900/70'
                                }
                              >
                                <td className="px-2 py-1 align-top">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-gray-200">{row.topic}</span>
                                    {isTopPriority && (
                                      <span className="inline-flex items-center rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 border border-indigo-400/30">
                                        ⭐ Top Priority
                                      </span>
                                    )}
                                    {needsAttention ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Close preview so the training modal isn't visually stacked under it.
                                          setPreviewOpen(false)
                                          // Start a forced-topic training session.
                                          setTimeout(() => {
                                            startLlmTrainingSession(row.topic)
                                          }, 0)
                                        }}
                                        className="inline-flex items-center rounded bg-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-100 border border-amber-400/30 hover:bg-amber-500/35 hover:border-amber-300/50"
                                        title="Train this topic"
                                      >
                                        Needs {remaining}
                                      </button>
                                    ) : target > 0 ? (
                                      <span className="inline-flex items-center rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100 border border-emerald-400/30">
                                        Met
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-400 border border-gray-700">
                                        No target
                                      </span>
                                    )}
                                  </div>
                                  {needsAttention ? (
                                    <div className="mt-0.5 text-[10px] text-gray-400">
                                      Add <span className="font-mono text-gray-300">{remaining}</span> more to reach target.
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <span className="text-[10px] text-gray-300">{row.dimension || 'n/a'}</span>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <span className="font-mono">{count}</span>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <span className="font-mono">{target || '—'}</span>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-1.5 rounded-full bg-indigo-500"
                                        style={{
                                          width: `${Math.max(0, Math.min(100, Math.round(row.coverage_pct || 0)))}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="font-mono text-[10px] text-gray-300">
                                      {Math.round(row.coverage_pct || 0)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  {Array.isArray(row.variants) && row.variants.length > 0 ? (
                                    <details className="text-[10px]">
                                      <summary className="cursor-pointer text-gray-300 hover:text-white">
                                        Show ({row.variants.length})
                                      </summary>
                                      <div className="mt-1 space-y-1">
                                        {row.variants
                                          .filter((v: any) => v && typeof v.raw_topic === 'string')
                                          .slice(0, 12)
                                          .map((v: any) => (
                                            <div key={v.raw_topic} className="flex items-center justify-between gap-2">
                                              <span className="font-mono text-gray-300 truncate">{v.raw_topic}</span>
                                              <span className="font-mono text-gray-500">{v.count ?? 0}</span>
                                            </div>
                                          ))}
                                        {row.variants.length > 12 && (
                                          <div className="text-gray-500">…and {row.variants.length - 12} more</div>
                                        )}
                                      </div>
                                    </details>
                                  ) : (
                                    <span className="text-[10px] text-gray-500">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-[11px]">
                    No topic coverage metrics yet. As you label and edit more examples, this will show
                    which areas are well-covered and which still need attention.
                  </p>
                )}
              </div>

              {/* Samples */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-1">Sample Examples</h3>
                {previewData?.samples && previewData.samples.length > 0 ? (
                  <div className="space-y-3">
                    {previewData.samples.map((ex: any, idx: number) => {
                      const topics: string[] = Array.isArray(ex?.topics) ? ex.topics : []
                      const canonicalTopics: string[] = Array.isArray(ex?.canonical_topics)
                        ? ex.canonical_topics
                        : []

                      return (
                        <div
                          key={ex.id || idx}
                          className="border border-gray-700 rounded-lg p-3 bg-gray-800/60"
                        >
                          <p className="text-[11px] text-gray-400 mb-1">
                            Source:{' '}
                            <span className="font-mono text-gray-300">
                              {ex.source || 'unknown'}
                            </span>{' '}
                            • Label:{' '}
                            <span className="font-mono text-gray-300">
                              {ex.quality_label || 'unlabeled'}
                            </span>
                            {canonicalTopics.length > 0 && (
                              <>
                                {' '}
                                • Categories:{' '}
                                <span className="font-mono text-gray-300">{canonicalTopics.join(', ')}</span>
                              </>
                            )}
                            {topics.length > 0 && (
                              <>
                                {' '}
                                • Variants:{' '}
                                <span className="font-mono text-gray-500">{topics.join(', ')}</span>
                              </>
                            )}{' '}
                            • Created:{' '}
                            <span className="font-mono text-gray-400">
                              {ex.created_at
                                ? new Date(ex.created_at).toLocaleString()
                                : 'n/a'}
                            </span>
                          </p>
                          <p className="font-semibold text-gray-200 mb-1">User input</p>
                          <p className="whitespace-pre-wrap text-gray-100 mb-2">
                            {ex.user_input || '(empty)'}
                          </p>
                          <p className="font-semibold text-gray-200 mb-1">Agent output</p>
                          <p className="whitespace-pre-wrap text-gray-100">
                            {ex.agent_output || '(empty)'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No sample examples available yet. Interact with this agent in the Playground and
                    mark responses as 👍 or edit &amp; save to build a dataset.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ClarifyModal
        isOpen={showClarify}
        onClose={() => setShowClarify(false)}
        thread={clarifyThread}
        onSend={handleClarifySend}
        fieldKey={activeClarifyKey}
      />
    </DashboardLayout>
  )
}