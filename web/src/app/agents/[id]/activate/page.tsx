'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

export default function ActivateAgentPage() {
  const [uploadOption, setUploadOption] = useState<'image' | 'description' | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const params = useParams()
  const router = useRouter()

  async function handleSubmit() {
    if (!uploadOption) return alert('Please choose image or description.')
    setLoading(true)

    const formData = new FormData()
    formData.append('agent_id', params.id as string)
    formData.append('uploadOption', uploadOption)

    if (uploadOption === 'image' && image) {
      formData.append('file', image)
    } else if (uploadOption === 'description') {
      formData.append('description', description)
    }

    const res = await fetch('/api/activate-agent', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) return alert(data.error || 'Failed to activate agent')
    alert('Agent activated successfully!')
    router.push(`/agents/${params.id}`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-4">Activate Your Agent</h2>
        <p className="text-gray-300 mb-6">
          Choose how to define your agent’s identity. You can upload an image or describe their
          appearance. This will become the agent’s profile photo.
        </p>

        {/* Choose option */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${uploadOption === 'image' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setUploadOption('image')}
          >
            📸 Upload Image
          </button>
          <button
            className={`px-4 py-2 rounded ${uploadOption === 'description' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setUploadOption('description')}
          >
            ✍️ Describe Appearance
          </button>
        </div>

        {/* Image upload */}
        {uploadOption === 'image' && (
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="block w-full text-gray-300"
            />
          </div>
        )}

        {/* Description input */}
        {uploadOption === 'description' && (
          <div className="mb-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white"
              rows={4}
              placeholder="Describe your agent’s appearance (e.g., short brown hair, blue eyes, friendly smile)..."
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white text-sm"
        >
          {loading ? 'Activating...' : 'Activate Agent'}
        </button>
      </div>
    </DashboardLayout>
  )
}