import { createClient } from '@/lib/supabase'

// NOTE: This is a client-side helper used by the /agents/new UI.
// It fetches the current Supabase session (access token) and forwards it to the
// server route `/api/guided-setup/answer`.
export async function submitGuidedAnswer(session_id: string, user_text: string) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch('/api/guided-setup/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ session_id, user_text }),
  })

  return res.json()
}