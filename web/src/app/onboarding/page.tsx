'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    role: '',
    expertise: '',
    tone: '',
    audience: '',
    goal: '',
  })
  const [loading, setLoading] = useState(false)

  const questions = [
    { key: 'name', label: "What's your full name?", placeholder: 'e.g. Oliver Carlin' },
    { key: 'role', label: 'What is your main role or title?', placeholder: 'e.g. CEO, Founder, Manager' },
    { key: 'expertise', label: 'What are your areas of expertise?', placeholder: 'e.g. Marketing, Automation, Growth' },
    { key: 'tone', label: 'Describe your communication tone or style.', placeholder: 'e.g. Friendly, direct, analytical' },
    { key: 'audience', label: 'Who do you typically communicate with?', placeholder: 'e.g. Customers, team members, partners' },
    { key: 'goal', label: 'If your digital twin could help you with one thing right now, what would it be?', placeholder: 'e.g. Handling customer messages automatically' },
  ]

  const current = questions[step - 1]

  function handleChange(key: string, value: string) {
    setForm({ ...form, [key]: value })
  }

  async function handleNext() {
    if (step < questions.length) return setStep(step + 1)
    setLoading(true)

    // Create Digital Twin agent via API
    const res = await fetch('/api/generate-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const { agent } = await res.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return alert('User not logged in.')

    // Save first agent to Supabase
    const { error } = await supabase.from('agents').insert([
      {
        user_id: user.id,
        name: agent.name,
        description: agent.subtitle,
        personality: agent.personality,
      },
    ])

    if (error) console.error('Error saving agent:', error)

    setLoading(false)
    router.push('/agents')
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto mt-20 bg-gray-800 p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Create Your Digital Twin</h2>
        <p className="text-gray-300 mb-4">{current.label}</p>

        <input
          value={(form as any)[current.key]}
          onChange={(e) => handleChange(current.key, e.target.value)}
          placeholder={current.placeholder}
          className="w-full p-3 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
        />

        <button
          onClick={handleNext}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white w-full"
        >
          {loading ? 'Creating Agent...' : step < questions.length ? 'Next' : 'Finish'}
        </button>
      </div>
    </DashboardLayout>
  )
}