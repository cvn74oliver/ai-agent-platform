import { createClient } from '@/lib/supabase'

// Client-side helper used by the Guided Setup UI.
// IMPORTANT: Do NOT use deprecated @supabase/auth-helpers-nextjs here.

export async function submitGuidedAnswer(session_id: string, user_text: string) {
  const supabase = createClient()

  // Best-effort: include the current user's access token if available.
  // If no session exists (e.g., dev mode), the API route should still work under anon policies.
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  const res = await fetch('/api/guided-setup/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ session_id, user_text }),
  })

  return res.json()
}