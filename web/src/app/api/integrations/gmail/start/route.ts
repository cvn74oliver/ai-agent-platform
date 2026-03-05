import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase'

const STATE_COOKIE_NAME = 'gmail_oauth_state'
const STATE_COOKIE_PATH = '/api/integrations/gmail'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const scopes = process.env.GOOGLE_OAUTH_SCOPES

  if (!clientId || !redirectUri || !scopes) {
    return NextResponse.json(
      { error: 'Missing GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, or GOOGLE_OAUTH_SCOPES.' },
      { status: 500 }
    )
  }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set({
    name: STATE_COOKIE_NAME,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: STATE_COOKIE_PATH,
    maxAge: 10 * 60,
  })

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('include_granted_scopes', 'true')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl)
}
