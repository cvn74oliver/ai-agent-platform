import { resolve as resolveTsPath } from './ts-path-loader.mjs'

const fixtureSupabaseUrl = new URL('./runtime-execute-http-fixture-supabase.mjs', import.meta.url).href

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === '@/lib/supabase') {
    return {
      shortCircuit: true,
      url: fixtureSupabaseUrl,
    }
  }

  if (specifier === 'next/server') {
    return defaultResolve('next/server.js', context, defaultResolve)
  }

  return resolveTsPath(specifier, context, defaultResolve)
}
