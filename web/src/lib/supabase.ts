import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// 🧭 Browser client (safe for use in "use client" components)
export const createClient = (): SupabaseClient =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// 🛡️ Server client that uses the current authenticated user's cookies (RLS-safe)
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  // NOTE: Server-only. Keep `next/headers` usage inside this function.
  // Using a standard dynamic import avoids bundler issues and resolves via Next package exports.
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Cookie writes are not always available in server-rendered components.
          }
        },
      },
    }
  )
}

// ⚙️ Lazy-load the server admin client only when needed (in API routes)
export async function getSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
