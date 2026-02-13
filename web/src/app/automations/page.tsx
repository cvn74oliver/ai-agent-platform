'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'
import { Zap, Brain, Send } from 'lucide-react'
import { Dialog } from '@headlessui/react'

function AutomationsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agent_id')

  const [automations, setAutomations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [workflowGoal, setWorkflowGoal] = useState('')

  // Load automations
  useEffect(() => {
    async function loadAutomations() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (agentId) query = query.eq('agent_id', agentId)

      const { data, error } = await query
      if (error) console.error('Error loading automations:', error)
      else setAutomations(data)
    }

    loadAutomations()
  }, [supabase, agentId])

  // Create new automation (AI-assisted)
async function createAutomation() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // get onboarding info
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_data')
    .eq('id', user.id)
    .single()

  // call API to generate steps, title, and subtitle
  const res = await fetch('/api/generate-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      onboarding: profile?.onboarding_data,
      goal: workflowGoal,
    }),
  })

  // prepare variables
  let steps: any[] = []
  let title = 'AI Workflow'
  let subtitle = 'Automation built by AI'

  try {
    const payload = await res.json()
    steps = Array.isArray(payload?.steps) ? payload.steps : []
    title = payload?.title || 'AI Workflow'
    subtitle = payload?.subtitle || 'Automation built by AI'

    if (steps.length === 0) {
      steps = [
        { step: 'Trigger', description: 'Start when new input is received.' },
        { step: 'Action', description: 'Send to Slack and save to DB.' },
      ]
    }
  } catch (e) {
    console.error('parse error:', e)
    alert('Failed to parse AI response.')
    steps = [
      { step: 'Trigger', description: 'Start when new input is received.' },
      { step: 'Action', description: 'Send to Slack and save to DB.' },
    ]
  }

  // insert into Supabase
  const { data, error } = await supabase
    .from('automations')
    .insert([
      {
        user_id: user.id,
        agent_id: agentId,
        name: title,
        description: subtitle, // ✅ now uses AI-generated subtitle
        steps,
      },
    ])
    .select()

  if (error) console.error('Error creating automation:', error)
  else setAutomations([data[0], ...automations])

  setIsPromptOpen(false)
  setWorkflowGoal('')
}

  // Delete automation
  async function deleteAutomation(id: string) {
    const confirmed = confirm('Are you sure you want to delete this workflow?')
    if (!confirmed) return

    const { error } = await supabase.from('automations').delete().eq('id', id)
    if (error) console.error('Error deleting automation:', error)
    else setAutomations(automations.filter((a) => a.id !== id))
  }

  const icons = [<Zap size={28} />, <Brain size={28} />, <Send size={28} />]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header with New Workflow button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your AI Workflows</h2>
          <button
            onClick={() => setIsPromptOpen(true)}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white text-sm"
          >
            + New Workflow
          </button>
        </div>

        {/* Card list */}
        {automations.length === 0 ? (
          <p className="text-gray-400">
            You don’t have any automations yet. They’ll appear here once your AI
            creates them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center">
            {automations.map((flow, index) => (
              <div
                key={flow.id}
                className="bg-gray-800 p-6 rounded-xl shadow-xl w-80 text-center relative"
              >
                <div className="flex justify-center mb-4 text-blue-400">
                  {icons[index % icons.length]}
                </div>
                <h3 className="text-xl font-semibold mb-2">{flow.name}</h3>
                <p className="text-gray-300 mb-4">{flow.description}</p>

                <button
                  onClick={() => setSelected(flow)}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white text-sm"
                >
                  View Details
                </button>

                <button
                  onClick={() => deleteAutomation(flow.id)}
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded text-white text-sm mt-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Modal for New Workflow */}
      <Dialog
        open={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gray-900 text-white rounded-xl max-w-lg w-full p-8 shadow-2xl">
            <Dialog.Title className="text-2xl font-bold mb-4">
              What should this workflow do?
            </Dialog.Title>

            <textarea
              value={workflowGoal}
              onChange={(e) => setWorkflowGoal(e.target.value)}
              placeholder="e.g., Summarize new emails and post to Slack"
              className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsPromptOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={createAutomation}
                disabled={!workflowGoal.trim()}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white disabled:opacity-50"
              >
                Generate with AI
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Details Modal */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gray-900 text-white rounded-xl max-w-lg w-full p-8 shadow-2xl">
            <Dialog.Title className="text-2xl font-bold mb-4">
              {selected?.name}
            </Dialog.Title>
            <p className="text-gray-400 mb-6">
              {selected?.description || 'No description provided.'}
            </p>

            <div className="bg-gray-800 p-4 rounded-lg max-h-80 overflow-y-auto mb-6">
              <h4 className="text-lg font-semibold mb-2">Steps</h4>
              {selected?.steps && Array.isArray(selected.steps) ? (
                <ul className="space-y-2 text-sm text-gray-300">
                  {selected.steps.map((s: any, i: number) => (
                    <li
                    key={i}
                    className="bg-gray-700 p-2 rounded-lg border border-gray-600 text-left"
                    >
                    <p className="font-semibold">
                        Step {i + 1}: {s.step}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">{s.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No steps available.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </DashboardLayout>
  )
}

export default function AutomationsPage() {
  return (
    <Suspense fallback={<div>Loading automations…</div>}>
      <AutomationsContent />
    </Suspense>
  )
}