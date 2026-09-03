import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase'

type RuntimeRequestAccessSuccess = {
  ok: true
  admin: SupabaseClient
  actorId: string
  tenantId: string
  agentId: string
}

type RuntimeRequestAccessFailure = {
  ok: false
  response: Response
}

type RuntimeRequestPrincipalSuccess = {
  ok: true
  requestSupabase: SupabaseClient
  actorId: string
}

export type RuntimeRequestPrincipalResult =
  | RuntimeRequestPrincipalSuccess
  | RuntimeRequestAccessFailure

export type RuntimeRequestAccessResult =
  | RuntimeRequestAccessSuccess
  | RuntimeRequestAccessFailure

function firstForwardedValue(value: string | null): string {
  return value?.split(',')[0]?.trim() || ''
}

export function isSameOriginRuntimeRequest(req: Request): boolean {
  const originHeader = req.headers.get('origin')?.trim()
  if (!originHeader || originHeader === 'null') return false

  try {
    const requestUrl = new URL(req.url)
    const allowedOrigins = new Set([requestUrl.origin])
    const forwardedHost = firstForwardedValue(req.headers.get('x-forwarded-host'))
    const host = forwardedHost || firstForwardedValue(req.headers.get('host'))
    const forwardedProto = firstForwardedValue(req.headers.get('x-forwarded-proto'))
    const protocol = forwardedProto || requestUrl.protocol.replace(':', '')

    if (host && (protocol === 'http' || protocol === 'https')) {
      allowedOrigins.add(`${protocol}://${host}`)
    }

    return allowedOrigins.has(new URL(originHeader).origin)
  } catch {
    return false
  }
}

export async function resolveRuntimeRequestPrincipal(params: {
  req: Request
  requireSameOrigin?: boolean
}): Promise<RuntimeRequestPrincipalResult> {
  const requestSupabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await requestSupabase.auth.getUser()

  if (userError || !user) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Authentication required.' },
        { status: 401 }
      ),
    }
  }

  if (params.requireSameOrigin && !isSameOriginRuntimeRequest(params.req)) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Request origin is not allowed.' },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    requestSupabase,
    actorId: user.id,
  }
}

export async function resolveRuntimeRequestAccess(params: {
  req?: Request
  principal?: RuntimeRequestPrincipalSuccess
  agentId: string
  requireSameOrigin?: boolean
}): Promise<RuntimeRequestAccessResult> {
  if (!params.principal && !params.req) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Unable to verify runtime access.' },
        { status: 500 }
      ),
    }
  }

  const principal =
    params.principal ||
    (await resolveRuntimeRequestPrincipal({
      req: params.req as Request,
      requireSameOrigin: params.requireSameOrigin,
    }))
  if (!principal.ok) return principal

  const { requestSupabase, actorId } = principal

  const { data: agent, error: agentError } = await requestSupabase
    .from('agents')
    .select('id,user_id')
    .eq('id', params.agentId)
    .eq('user_id', actorId)
    .maybeSingle()

  if (agentError) {
    console.error('[runtime/access] owned-agent lookup failed')
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Unable to verify runtime access.' },
        { status: 500 }
      ),
    }
  }

  if (!agent) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Agent not found or access denied.' },
        { status: 404 }
      ),
    }
  }

  const { data: profile, error: profileError } = await requestSupabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', actorId)
    .maybeSingle()

  if (profileError) {
    console.error('[runtime/access] tenant lookup failed')
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Unable to verify workspace access.' },
        { status: 500 }
      ),
    }
  }

  const tenantId = typeof profile?.tenant_id === 'string' ? profile.tenant_id.trim() : ''
  if (!tenantId) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: 'Workspace access is unavailable.' },
        { status: 403 }
      ),
    }
  }

  const admin = await getSupabaseAdmin()
  return {
    ok: true,
    admin,
    actorId,
    tenantId,
    agentId: params.agentId,
  }
}
