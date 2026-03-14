'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { serializeOperationsQuery } from '@/lib/runtime/operationsWorkspace'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'

function healthLabel(value: string | null | undefined): string {
  if (value === 'healthy') return 'Healthy'
  if (value === 'degraded_usable') return 'Degraded but usable'
  if (value === 'uninitialized') return 'Not indexed yet'
  if (value === 'unavailable') return 'Unavailable'
  return 'Unknown'
}

export default function OperationsIntroPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const runtime = useOperationsRuntime()
  const agentId = typeof params?.id === 'string' ? params.id : ''
  const requestedSessionId = searchParams.get('playground_session_id')
  const query = serializeOperationsQuery(runtime.sessionId || requestedSessionId, runtime.analysisScope)

  if (runtime.loading && !runtime.data) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 text-sm text-gray-300">
        Loading Gmail cleanup intro…
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

  const pendingApprovals = runtime.data?.runtime_approval_queue_summary?.pending || 0
  const clusterCount = runtime.data?.runtime_cleanup_plan?.clusters?.length || 0

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-cyan-900/45 bg-gradient-to-b from-cyan-950/25 to-gray-950/45 p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Intro & Health</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Train Gmail cleanup around senders</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
          Gmail cleanup is one guided product. The real dashboard lives in Mailbox Intelligence, where the mailbox is reframed from tens of thousands of messages into a smaller sender universe. This page is only the lightweight handoff for health, indexing, and your safest next step.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/agents/${agentId}/operations/intelligence${query}`}
            className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            Open Mailbox Intelligence
          </Link>
          <Link
            href={`/agents/${agentId}/operations/clusters${query}`}
            className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-cyan-700/60 hover:text-white"
          >
            Jump to Cleanup Groups
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Mailbox health</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {healthLabel(runtime.mailboxIndexHealth?.sync_health)}
          </p>
          <p className="mt-2 text-sm text-gray-300">
            {runtime.mailboxIndexHealth?.indexed_message_count?.toLocaleString() || '0'} indexed messages ·{' '}
            {runtime.mailboxIndexHealth?.indexed_inbox_count?.toLocaleString() || '0'} currently in Inbox
          </p>
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Cleanup groups ready</p>
          <p className="mt-2 text-2xl font-semibold text-white">{clusterCount.toLocaleString()}</p>
          <p className="mt-2 text-sm text-gray-300">
            Cleanup Groups narrow the candidate universe into one sender set at a time.
          </p>
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Pending approvals</p>
          <p className="mt-2 text-2xl font-semibold text-white">{pendingApprovals.toLocaleString()}</p>
          <p className="mt-2 text-sm text-gray-300">
            Archive remains the only live Gmail mutation in this pass; all other policies are learned intents.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-gray-950/45 p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Guided workflow</p>
        <div className="grid gap-3 xl:grid-cols-4">
          {[
            ['Mailbox Intelligence', 'Whole mailbox + cleanup candidate + protected/safe context'],
            ['Cleanup Groups', 'Choose one sender cluster to process next'],
            ['Sender Decisions', 'Review senders; messages stay as evidence'],
            ['Monitoring', 'See what the agent learned and what it suggests next'],
          ].map(([title, subtitle]) => (
            <div key={title} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
