'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isActive = true

    async function completeAuth() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const searchParams = new URLSearchParams(window.location.search)
      const errorDescription =
        hashParams.get('error_description') ||
        searchParams.get('error_description') ||
        hashParams.get('error') ||
        searchParams.get('error')

      if (errorDescription) {
        console.error('Supabase auth callback error:', errorDescription)
        if (isActive) router.replace('/login')
        return
      }

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!isActive) return

        if (error) {
          console.error('Supabase auth callback session set failed:', error)
          router.replace('/login')
          return
        }

        router.replace('/dashboard')
        return
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!isActive) return

      if (error) {
        console.error('Supabase auth callback session exchange failed:', error)
        router.replace('/login')
        return
      }

      if (!session) {
        router.replace('/login')
        return
      }

      router.replace('/dashboard')
    }

    void completeAuth()

    return () => {
      isActive = false
    }
  }, [router, supabase])

  return (
    <main className="p-10 text-white bg-gray-900 h-screen flex items-center justify-center">
      <p>Signing you in…</p>
    </main>
  )
}
