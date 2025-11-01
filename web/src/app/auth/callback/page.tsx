'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    // Supabase may send tokens in the URL params instead of hash
    const searchParams = new URLSearchParams(window.location.search)
    const search_access = searchParams.get('access_token')
    const search_refresh = searchParams.get('refresh_token')

    const final_access = access_token || search_access
    const final_refresh = refresh_token || search_refresh

    if (final_access && final_refresh) {
      supabase.auth
        .setSession({
          access_token: final_access,
          refresh_token: final_refresh,
        })
        .then(({ data, error }) => {
          if (error) console.error(error)
          router.replace('/dashboard')
        })
    } else {
      // If tokens are missing, go back to login
      router.replace('/login')
    }
  }, [router, supabase])

  return (
    <main className="p-10 text-white bg-gray-900 h-screen flex items-center justify-center">
      <p>Signing you in…</p>
    </main>
  )
}