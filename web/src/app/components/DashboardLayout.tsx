'use client'
import { useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen text-white bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700">
          AI Agent
        </div>
        <nav className="flex-1 p-4 space-y-3">
          <a
            href="/dashboard"
            className={`block ${
              pathname === '/dashboard'
                ? 'text-blue-400'
                : 'hover:text-blue-400'
            }`}
          >
            Dashboard
          </a>
          <a
            href="/agents"
            className={`block ${
              pathname === '/agents'
                ? 'text-blue-400'
                : 'hover:text-blue-400'
            }`}
          >
            Agents
          </a>
          <a
            href="/automations"
            className={`block ${
              pathname === '/automations'
                ? 'text-blue-400'
                : 'hover:text-blue-400'
            }`}
          >
            Automations
          </a>
          <a
            href="/settings"
            className={`block ${
              pathname === '/settings'
                ? 'text-blue-400'
                : 'hover:text-blue-400'
            }`}
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-700">
          <h1 className="text-lg font-semibold">AI Agent Platform</h1>

          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-300">{email}</p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}