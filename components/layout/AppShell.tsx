'use client'

import {

  useState,
  useEffect

} from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import Topbar          from './Topbar'
import Sidebar         from './Sidebar'
import MobileOverlay   from './MobileOverlay'
import UserThemeSync   from './UserThemeSync'

import { useAuth }  from '../../lib/auth/useAuth'
import { logout }   from '../../lib/services/auth.service'

const PUBLIC_PATHS = ['/login', '/register', '/activation', '/test', '/maintenance']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

const SUPER_ADMIN_HOME = '/rt/registration'

// Paths that belong to RT members — SUPER_ADMIN must not access them.
const RT_ONLY_PATHS = ['/', '/dashboard', '/residents', '/payments', '/expenses', '/ledger', '/rt-profile', '/settings/authorization']

function isRtOnlyPath(pathname: string) {
  return RT_ONLY_PATHS.some(p =>
    p === '/' ? pathname === '/' : (pathname === p || pathname.startsWith(p + '/'))
  )
}

export default function AppShell({

                                   children

                                 }: { children: ReactNode }) {

  const { membership, loading } = useAuth()
  const pathname                = usePathname()
  const router                  = useRouter()
  const t                       = useTranslations('appShell')
  const tTopbar                 = useTranslations('topbar')

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return

    // Redirect authenticated users away from /login
    if (membership && pathname === '/login') {
      router.replace(membership.role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOME : '/')
      return
    }

    // Redirect unauthenticated users to /login
    if (!membership && !isPublicPath(pathname)) {
      router.replace('/login')
    }
  }, [loading, membership, pathname, router])

  /*
   |-------------------------------------------------------------
   | LOADING — wait for auth to resolve before deciding layout
   |-------------------------------------------------------------
   */

  if (loading) {
    return (
      <div data-testid="shell-spinner" className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-6 h-6 border-2 border-divider border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  /*
   |-------------------------------------------------------------
   | NO MEMBERSHIP — invited but not yet activated
   |-------------------------------------------------------------
   */

  if (membership?.status === 'no_membership' && !isPublicPath(pathname)) {
    return (
      <div data-testid="shell-no-membership" className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-card border border-divider p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-warning/10 text-warning mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-bold">{t('noMembership.title')}</h1>
          <p className="text-sm text-muted">
            {t('noMembership.description')}
          </p>
          <a
            href="/activation"
            className="inline-block bg-primary hover:bg-primary-dark text-white rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            {t('noMembership.goToActivation')}
          </a>
          <div>
            <button
              onClick={logout}
              className="text-sm text-muted hover:underline mt-2"
            >
              {tTopbar('logout')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /*
   |-------------------------------------------------------------
   | UNAUTHENTICATED — render page content only (login page)
   |-------------------------------------------------------------
   */

  if (!membership) {
    if (isPublicPath(pathname)) return <>{children}</>
    return null
  }

  /*
   |-------------------------------------------------------------
   | AUTHENTICATED ON LOGIN — redirect is in flight, hold spinner
   | Prevents the login page flashing inside the full shell while
   | router.replace('/') is still completing after SIGNED_IN.
   |-------------------------------------------------------------
   */

  if (pathname === '/login') {
    return (
      <div data-testid="shell-spinner" className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="w-6 h-6 border-2 border-divider border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  /*
   |-------------------------------------------------------------
   | AUTHENTICATED — full shell
   |-------------------------------------------------------------
   */

  const isForbidden = membership.role === 'SUPER_ADMIN' && isRtOnlyPath(pathname)

  return (

      <>

        <UserThemeSync />

        <Topbar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
        />

        <MobileOverlay
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
        />

        <Sidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
        />

        <main
            data-testid="shell-ready"
            className="
                lg:pl-72
                pt-16
                min-h-screen
                bg-canvas
            "
        >

          <div className="p-4 md:p-6">

            {isForbidden ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-6xl font-bold text-stroke mb-4">403</p>
                <h1 className="text-xl font-semibold text-foreground mb-2">{t('forbidden.title')}</h1>
                <p className="text-sm text-muted mb-6">{t('forbidden.description')}</p>
                <Link
                  href={SUPER_ADMIN_HOME}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors"
                >
                  {t('forbidden.back')}
                </Link>
              </div>
            ) : children}

          </div>

        </main>

      </>
  )
}