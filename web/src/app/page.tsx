import { redirect } from 'next/navigation'

type SearchParamValue = string | string[] | undefined
type SearchParams = Record<string, SearchParamValue>

function appendSearchParam(query: URLSearchParams, key: string, value: SearchParamValue) {
  if (typeof value === 'string') {
    query.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => query.append(key, entry))
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const authParamKeys = new Set([
    'access_token',
    'code',
    'error',
    'error_code',
    'error_description',
    'expires_at',
    'expires_in',
    'provider_refresh_token',
    'provider_token',
    'refresh_token',
    'token_type',
    'type',
  ])

  const hasAuthParams = Object.keys(resolvedSearchParams).some((key) => authParamKeys.has(key))

  if (hasAuthParams) {
    const callbackParams = new URLSearchParams()

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      appendSearchParam(callbackParams, key, value)
    })

    const callbackQuery = callbackParams.toString()
    redirect(callbackQuery ? `/auth/callback?${callbackQuery}` : '/auth/callback')
  }

  redirect('/dashboard')
}
