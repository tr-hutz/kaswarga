'use client'

import {

  useState,
  useEffect

} from 'react'

import { usePathname, useRouter } from 'next/navigation'

import Topbar        from './Topbar'
import Sidebar       from './Sidebar'
import MobileOverlay from './MobileOverlay'

import { useAuth } from '../../lib/auth/useAuth'

const PUBLIC_PATHS = ['/login', '/daftar', '/aktivasi']

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function AppShell({

                                   children

                                 }) {

  const { membership, loading } = useAuth()
  const pathname                = usePathname()
  const router                  = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return

    // Redirect authenticated users away from /login based on role
    if (membership && pathname === '/login') {
      router.replace(membership.role === 'super_admin' ? '/rt' : '/')
      return
    }

    // Redirect unauthenticated users to /login
    if (!membership && !isPublicPath(pathname)) {
      router.replace('/login')
    }
  }, [loading, membership, pathname])

  /*
   |-------------------------------------------------------------
   | LOADING — wait for auth to resolve before deciding layout
   |-------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-bold">Akun Belum Aktif</h1>
          <p className="text-sm text-gray-600">
            Akun Anda belum terhubung ke RT. Silakan cek email undangan Anda dan klik link aktivasi,
            atau kunjungi halaman aktivasi.
          </p>
          <a
            href="/aktivasi"
            className="inline-block bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium"
          >
            Ke Halaman Aktivasi
          </a>
          <div>
            <button
              onClick={async () => {
                const { supabase: sb } = await import('../../lib/supabase')
                await sb.auth.signOut()
              }}
              className="text-sm text-gray-500 hover:underline mt-2"
            >
              Keluar
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
   | AUTHENTICATED — full shell
   |-------------------------------------------------------------
   */

  return (

      <>

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
            className="
                lg:pl-72
                min-h-screen
                bg-slate-50
            "
        >

          <div className="p-4 md:p-6">

            {children}

          </div>

        </main>

      </>
  )
}