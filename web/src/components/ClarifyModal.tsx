'use client'

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import VoiceRecorder from '@/components/VoiceRecorder'

// 💡 Human-friendly labels for each field key
const FIELD_LABELS: Record<string, string> = {
  // Core fields
  company: 'Company Info',
  mission: 'Mission',
  tone: 'Tone / Voice',
  audience: 'Audience',
  topics: 'Topics / Areas of Expertise',
  guardrails: 'Legal / Brand Guardrails',
  formats: 'Output Formats',
  constraints: 'Constraints / Things to Avoid',

  // Dynamic agent-specific fields
  product_list: 'Products / Services Supported',
  common_issue_categories: 'Common Issue Categories',
  escalation_policy: 'Escalation Policy',
  custom_notes: 'Additional Context (Anything Else)',

  // RAG + crawl
  rag_links: 'RAG Sources',
  crawl_domains: 'Crawlable Domains',
}

function humanizeFieldKey(key: string | null): string {
  if (!key) return 'this section'
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]

  // Fallback: "custom_notes" -> "Custom notes"
  return key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export default function ClarifyModal({
  isOpen,
  onClose,
  thread = [],
  onSend,
  fieldKey,
}: {
  isOpen: boolean
  onClose: () => void
  thread: { from: 'user' | 'ai'; text: string; timestamp: string }[]
  onSend: (message: string) => void
  fieldKey: string | null
}) {
  const [message, setMessage] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  const messagesEndRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      node.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [])

  if (!isOpen) return null

  const label = humanizeFieldKey(fieldKey)

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-lg p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-3">
          {fieldKey
            ? `Got a question about ${label}?`
            : 'Need Clarification?'}
        </h2>

        <p className="text-xs text-gray-400 mb-2">
          Ask anything about <span className="font-semibold">{label}</span> and the Prompt
          Engineer will help you refine this part of your agent.
        </p>

        <div className="max-h-64 overflow-y-auto bg-gray-800 rounded p-3 mb-3">
          {thread.length === 0 && (
            <p className="text-gray-400 text-sm">
              Ask a question about this section…
            </p>
          )}
          {thread.map((msg, i) => {
            const isLast = i === thread.length - 1
            return (
              <div
                key={i}
                ref={isLast ? messagesEndRef : undefined}
                className={`mb-2 ${
                  msg.from === 'user'
                    ? 'text-right text-blue-300'
                    : 'text-left text-yellow-200'
                }`}
              >
                <div className="inline-block bg-gray-700 px-3 py-1 rounded-lg">
                  {msg.text}
                </div>
              </div>
            )
          })}
        </div>

        {/* Voice recorder primary input */}
        <div className="mb-3">
          <VoiceRecorder
            onTranscribed={(text) => {
              setMessage('')
              onSend(text)
            }}
          />
        </div>

        {/* Text fallback input */}
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Type your question about ${label.toLowerCase()}…`}
            className="flex-grow rounded bg-gray-800 p-2 text-white border border-gray-700"
          />
          <button
            onClick={() => {
              if (!message.trim()) return
              onSend(message)
              setMessage('')
            }}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}