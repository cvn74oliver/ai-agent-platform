'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { appButtonClassName } from '@/components/ui/app-button'
import PageHeader from '@/components/ui/page-header'
import StatePanel from '@/components/ui/state-panel'
import SurfaceCard from '@/components/ui/surface-card'
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

  const icons = [Zap, Brain, Send]

  return (
    <DashboardLayout>
      <div className="app-page-stack">
        <PageHeader
          eyebrow="Automations"
          title="Your AI workflows"
          description="Track every automation built for this workspace and open the details without leaving the shared app system."
          tone="hero"
          actions={
            <button
              onClick={() => setIsPromptOpen(true)}
              className={appButtonClassName({ variant: 'primary', size: 'md' })}
            >
              New Workflow
            </button>
          }
        />

        {automations.length === 0 ? (
          <StatePanel
            tone="warning"
            title="No automations yet"
            description="Your automations will appear here once the AI has created them for this workspace or a specific agent."
          >
            <button
              onClick={() => setIsPromptOpen(true)}
              className={appButtonClassName({ variant: 'secondary', size: 'md' })}
            >
              Create Workflow
            </button>
          </StatePanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {automations.map((flow, index) => {
              const Icon = icons[index % icons.length]

              return (
                <SurfaceCard key={flow.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-900/45 bg-cyan-950/10 text-cyan-100">
                      <Icon size={20} />
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{flow.name}</h3>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-gray-300">
                    {flow.description || 'Automation built by AI'}
                  </p>

                  <div className="mt-6 grid gap-2">
                    <button
                      onClick={() => setSelected(flow)}
                      className={appButtonClassName({ variant: 'secondary', size: 'md', block: true })}
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => deleteAutomation(flow.id)}
                      className={appButtonClassName({ variant: 'destructive', size: 'md', block: true })}
                    >
                      Delete
                    </button>
                  </div>
                </SurfaceCard>
              )
            })}
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
          <Dialog.Panel className="app-surface-card app-surface-card-accent w-full max-w-lg rounded-3xl p-8 text-white shadow-2xl">
            <Dialog.Title className="text-2xl font-bold mb-4">
              What should this workflow do?
            </Dialog.Title>

            <textarea
              value={workflowGoal}
              onChange={(e) => setWorkflowGoal(e.target.value)}
              placeholder="e.g., Summarize new emails and post to Slack"
              className="mb-6 w-full"
              rows={4}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsPromptOpen(false)}
                className={appButtonClassName({ variant: 'secondary', size: 'md' })}
              >
                Cancel
              </button>
              <button
                onClick={createAutomation}
                disabled={!workflowGoal.trim()}
                className={appButtonClassName({ variant: 'primary', size: 'md' })}
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
          <Dialog.Panel className="app-surface-card w-full max-w-lg rounded-3xl p-8 text-white shadow-2xl">
            <Dialog.Title className="text-2xl font-bold mb-4">
              {selected?.name}
            </Dialog.Title>
            <p className="text-gray-400 mb-6">
              {selected?.description || 'No description provided.'}
            </p>

            <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950/55 p-4 mb-6">
              <h4 className="text-lg font-semibold mb-2">Steps</h4>
              {selected?.steps && Array.isArray(selected.steps) ? (
                <ul className="space-y-2 text-sm text-gray-300">
                  {selected.steps.map((s: any, i: number) => (
                    <li
                    key={i}
                    className="rounded-2xl border border-gray-800 bg-gray-950/65 p-3 text-left"
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
                className={appButtonClassName({ variant: 'secondary', size: 'md' })}
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
