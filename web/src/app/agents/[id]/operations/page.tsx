'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'

export default function OperationsIntroPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)

  useEffect(() => {
    if (!agentId) return
    router.replace(`/agents/${agentId}/operations/intelligence${query}`)
  }, [agentId, query, router])

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Opening Mailbox Intelligence…
      </section>
    )
  }

  if (runtime.error && !runtime.data) {
    return (
      <section className="rounded-2xl border border-rose-900/45 bg-rose-950/20 p-4 text-sm text-rose-100">
        {runtime.error}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5">
      <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Mailbox Intelligence</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Opening the Gmail cleanup dashboard</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
        Health, progress, pending work, approvals, and next-step guidance now live inside Mailbox Intelligence so the Gmail workspace has one coherent sender-first dashboard.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/agents/${agentId}/operations/intelligence${query}`}
          className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Continue to Mailbox Intelligence
        </Link>
        <Link
          href={`/agents/${agentId}/operations/clusters${query}`}
          className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
        >
          Open Cleanup Groups directly
        </Link>
      </div>
    </section>
  )
}
