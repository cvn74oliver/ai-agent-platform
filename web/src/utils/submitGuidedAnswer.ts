import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function submitGuidedAnswer(session_id: string, user_text: string) {
  const supabase = createClientComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch('/api/guided-setup/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`, // 🔐 Pass logged-in token
    },
    body: JSON.stringify({ session_id, user_text }),
  })

  return res.json()
}