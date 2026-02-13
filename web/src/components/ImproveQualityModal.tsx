'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import VoiceRecorder from '@/components/VoiceRecorder'

type ImproveQualityModalProps = {
  isOpen: boolean
  onClose: () => void
  question: string
  fieldLabel: string          // human-readable label, e.g. "Mission"
  fieldKey: string            // internal key, e.g. "mission"
  mode?: 'prompt_quality' | 'llm_finetune'
  initialAnswer?: string
  currentScore?: number | null
  evalComment?: string | null // latest evaluation summary
  targetScore?: number | null
  onSubmit: (answer: string, mode: 'next' | 'finish') => void | Promise<void>
  onClarifyField?: (fieldKey: string) => void
}

export default function ImproveQualityModal({
  isOpen,
  onClose,
  question,
  fieldLabel,
  fieldKey,
  mode = 'prompt_quality',
  initialAnswer = '',
  currentScore,
  evalComment,
  targetScore = 9,
  onSubmit,
  onClarifyField,
}: ImproveQualityModalProps) {
  const [answer, setAnswer] = useState(initialAnswer)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const runSubmit = async (mode: 'next' | 'finish') => {
    if (submitting) return
    try {
      setSubmitting(true)
      await onSubmit(answer, mode)
    } finally {
      setSubmitting(false)
    }
  }

  // Reset answer whenever we open with a different question
  useEffect(() => {
    if (isOpen) {
      setAnswer(initialAnswer || '')
    }
  }, [isOpen, initialAnswer, question])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        void requestClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, answer])

  const headerLine =
    mode === 'prompt_quality'
      ? typeof currentScore === 'number'
        ? `Current quality score: ${currentScore}/10`
        : 'Current quality score: not yet evaluated'
      : 'You are creating supervised training examples that will be used to fine-tune this agent’s LLM. Focus on clear, complete, policy-aligned answers.'

  const requestClose = async () => {
    // Prevent closing while an async submit is in-flight
    if (submitting) return

    // In LLM fine-tune mode, protect against accidentally discarding a drafted training example.
    if (mode === 'llm_finetune') {
      const draft = (answer || '').trim()
      if (draft.length > 0) {
        const ok = window.confirm(
          'You have an unsaved training example.\n\nPress OK to Save & Finish, or Cancel to discard and close.'
        )
        if (ok) {
          // Reuse the same async submit pipeline so the UI shows Processing…
          await runSubmit('finish')
          return
        }
      }
    }

    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={containerRef}
        className="bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === 'prompt_quality' ? '🧠 Improve Agent Quality' : '🧬 LLM Training Example'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {headerLine}
              {mode === 'prompt_quality' && typeof targetScore === 'number' && (
                <> &nbsp;• &nbsp;Target: {targetScore}/10</>
              )}
            </p>
            <p className="text-[11px] text-gray-500">
              Field: <span className="font-mono">{fieldLabel || fieldKey}</span>
            </p>
            {evalComment && (
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-3">
                Prompt Engineer summary: {evalComment}
              </p>
            )}

            {/* 🔍 Big Clarify button under the summary */}
            {onClarifyField && fieldKey && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => onClarifyField(fieldKey)}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-xs font-medium"
                >
                  🔍 Need clarification on this field
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => void requestClose()}
            className="text-gray-400 hover:text-white text-sm px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <p className="text-sm font-medium mb-1 text-gray-200">Prompt Engineer question</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{question}</p>
          </div>

          {/* Voice recorder */}
          <div>
            <p className="text-xs text-gray-400 mb-1">
              Answer by voice (preferred), then edit below if needed:
            </p>
            <VoiceRecorder
              onTranscribed={(text) => {
                setAnswer((prev) => (prev ? `${prev}\n${text}` : text))
              }}
            />
          </div>

          {/* Big textarea */}
          <div>
            <p className="text-xs text-gray-400 mb-1">
              Or type / refine your answer manually:
            </p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className="w-full rounded bg-gray-800 text-white text-sm p-2 border border-gray-700 resize-y"
              placeholder="Give a detailed, clear answer here. The Prompt Engineer will merge this into your agent’s prompt."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] text-gray-400 space-y-1">
            <p>
              <span className="font-semibold">Save &amp; Next</span>{' '}
              {mode === 'prompt_quality'
                ? 'updates this section and moves to the next suggested question.'
                : 'logs this as a fine-tune training example and loads the next suggested training question.'}
            </p>
            <p>
              <span className="font-semibold">Save &amp; Finish</span>{' '}
              {mode === 'prompt_quality'
                ? 'updates this section, then re-scores your agent and closes this window.'
                : 'logs this as a fine-tune training example and closes this window.'}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => runSubmit('next')}
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium ${
                submitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Processing…' : '💾 Save & Next'}
            </button>
            <button
              onClick={() => runSubmit('finish')}
              disabled={submitting}
              className={`bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium ${
                submitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Processing…' : '✅ Save & Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}