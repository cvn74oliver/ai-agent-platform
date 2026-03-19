'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { appButtonClassName } from '@/components/ui/app-button'
import AutomataLogo from '@/components/ui/automata-logo'
import { createClient } from '@/lib/supabase'

interface Props {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  matches: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    matches: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/agents',
    label: 'Agents',
    matches: (pathname) => pathname.startsWith('/agents'),
  },
  {
    href: '/automations',
    label: 'Automations',
    matches: (pathname) => pathname.startsWith('/automations'),
  },
  {
    href: '/settings',
    label: 'Settings',
    matches: (pathname) => pathname.startsWith('/settings'),
  },
]

function navItemClass(active: boolean): string {
  return [
    'automata-nav-link inline-flex items-center justify-center rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap',
    active ? 'automata-nav-link-active' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function shellTitle(pathname: string): string | null {
  if (pathname.startsWith('/agents/') && pathname.includes('/operations')) return 'Operations'
  if (pathname.startsWith('/onboarding')) return 'Onboarding'
  if (pathname.startsWith('/automations')) return 'Automations'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/agents')) return 'Agents'
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  return null
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isOperationsRoute = /^\/agents\/[^/]+\/operations(?:\/|$)/.test(pathname)
  const shellMainClassName = isOperationsRoute
    ? 'app-shell-main app-shell-main-operations'
    : 'app-shell-main'
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [supabase])

  useEffect(() => {
    const section = shellTitle(pathname)
    document.title = section ? `Automata – ${section}` : 'Automata'
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] text-white">
      <header className="automata-topbar sticky top-0 z-40 border-b border-white/5">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 py-3.5 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 text-white">
              <span className="automata-brand-mark flex h-10 w-10 items-center justify-center text-white">
                <AutomataLogo className="h-6 w-6" />
              </span>
              <span className="text-base font-semibold tracking-[0.01em] text-white">Automata</span>
            </Link>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 md:hidden">
              <p className="max-w-[8rem] truncate text-sm text-gray-300 sm:max-w-xs">
                {email || 'Loading...'}
              </p>
              <button
                onClick={handleLogout}
                className={appButtonClassName({ variant: 'ghost', size: 'md' })}
              >
                Logout
              </button>
            </div>

            <nav className="flex min-w-0 basis-full items-center gap-2 overflow-x-auto pb-1 md:basis-auto md:justify-center md:overflow-visible md:pb-0">
              {NAV_ITEMS.map((item) => {
                const active = item.matches(pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={navItemClass(active)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="hidden min-w-0 items-center justify-end gap-2 sm:gap-3 md:flex">
              <p className="max-w-[10rem] truncate text-sm text-gray-300 lg:max-w-xs">
                {email || 'Loading...'}
              </p>
              <button
                onClick={handleLogout}
                className={appButtonClassName({ variant: 'ghost', size: 'md' })}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className={shellMainClassName}>{children}</div>
      </main>
    </div>
  )
}
