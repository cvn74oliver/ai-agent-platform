'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'
import { createClient } from '@/lib/supabase'

export default function WowRevealPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Load agent details
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('agents').select('*').eq('id', params.id).single()
      setAgent(data)
      setLoading(false)
    }
    load()
  }, [params, supabase])

  if (loading)
    return (
      <DashboardLayout>
        <p className="text-gray-300 p-6">Loading agent...</p>
      </DashboardLayout>
    )

  if (!agent)
    return (
      <DashboardLayout>
        <p className="text-gray-300 p-6">Agent not found.</p>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-6">
        <h2 className="text-3xl font-bold mb-6">🎉 Meet {agent.name || 'Your Agent'}</h2>

        {agent.wow_video_url ? (
          <video
            src={agent.wow_video_url}
            autoPlay
            controls
            loop
            className="rounded-lg shadow-xl max-w-md mb-6"
          />
        ) : agent.avatar_image_url ? (
          <div className="flex flex-col items-center">
            <img
              src={agent.avatar_image_url}
              alt="Agent avatar"
              className="rounded-full w-48 h-48 object-cover mb-4 border-4 border-blue-500"
            />
            <p className="text-lg text-gray-300 mb-6">
              Hi, I’m {agent.name}! I’m ready to start working for you.
            </p>
          </div>
        ) : (
          <p className="text-gray-400 mb-6">
            Your agent doesn’t have an avatar yet — you can add one later on the profile page.
          </p>
        )}

        <button
          onClick={() => router.push(`/agents/${agent.id}/chat`)}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white text-lg font-semibold"
        >
          🚀 Continue to Dashboard
        </button>
      </div>
    </DashboardLayout>
  )
}