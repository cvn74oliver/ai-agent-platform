import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase'

const STATE_COOKIE_NAME = 'gmail_oauth_state'
const STATE_COOKIE_PATH = '/api/integrations/gmail'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

type GoogleTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

function clearStateCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set({
    name: STATE_COOKIE_NAME,
    value: '',
    path: STATE_COOKIE_PATH,
    maxAge: 0,
  })
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const callbackState = requestUrl.searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'Missing OAuth code.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value
  if (!callbackState || !storedState || callbackState !== storedState) {
    clearStateCookie(cookieStore)
    return NextResponse.json({ error: 'Invalid OAuth state.' }, { status: 400 })
  }
  clearStateCookie(cookieStore)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const configuredScopes = process.env.GOOGLE_OAUTH_SCOPES

  if (!clientId || !clientSecret || !redirectUri || !configuredScopes) {
    return NextResponse.json(
      {
        error:
          'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, or GOOGLE_OAUTH_SCOPES.',
      },
      { status: 500 }
    )
  }

  const tokenBody = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
    cache: 'no-store',
  })

  const tokenData = (await tokenResponse.json().catch(() => null)) as GoogleTokenResponse | null
  if (!tokenResponse.ok || !tokenData?.access_token) {
    return NextResponse.json(
      {
        error: 'Failed to exchange OAuth code for tokens.',
        details: tokenData?.error_description || tokenData?.error || null,
      },
      { status: 400 }
    )
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json(
      { error: 'Failed to load user profile.', details: profileError.message },
      { status: 500 }
    )
  }

  const tenantId = profileRow?.tenant_id
  if (!tenantId) {
    return NextResponse.json({ error: 'User profile is missing tenant_id.' }, { status: 400 })
  }

  const { data: existingConnection, error: existingConnectionError } = await supabase
    .from('integration_connections')
    .select('refresh_token,email,scopes')
    .eq('tenant_id', tenantId)
    .eq('provider', 'gmail')
    .maybeSingle()

  if (existingConnectionError) {
    return NextResponse.json(
      { error: 'Failed to load existing Gmail connection.', details: existingConnectionError.message },
      { status: 500 }
    )
  }

  const refreshTokenToStore = tokenData.refresh_token ?? existingConnection?.refresh_token ?? null
  if (!refreshTokenToStore) {
    return NextResponse.json(
      {
        error:
          'No refresh_token received and no existing refresh_token found. Revoke app access in Google and reconnect.',
      },
      { status: 400 }
    )
  }

  let emailToStore: string | null = existingConnection?.email ?? null
  const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: 'no-store',
  }).catch(() => null)

  if (userInfoResponse?.ok) {
    const userInfo = (await userInfoResponse.json().catch(() => null)) as { email?: string } | null
    if (typeof userInfo?.email === 'string' && userInfo.email.trim()) {
      emailToStore = userInfo.email.trim()
    }
  }

  const expiresAt =
    typeof tokenData.expires_in === 'number'
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

  const scopesToStore = tokenData.scope ?? existingConnection?.scopes ?? configuredScopes

  const { error: upsertError } = await supabase.from('integration_connections').upsert(
    {
      tenant_id: tenantId,
      provider: 'gmail',
      access_token: tokenData.access_token,
      refresh_token: refreshTokenToStore,
      expires_at: expiresAt,
      scopes: scopesToStore,
      email: emailToStore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,provider' }
  )

  if (upsertError) {
    return NextResponse.json(
      { error: 'Failed to save Gmail connection.', details: upsertError.message },
      { status: 500 }
    )
  }

  return NextResponse.redirect(new URL('/settings?gmail=connected', request.url))
}
