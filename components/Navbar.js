'use client'

import Link from 'next/link'

import {
  useEffect,
  useState
} from 'react'

import {
  usePathname
} from 'next/navigation'

import {
  Menu,
  X,
  Home,
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  ShelvingUnit,
  LogOut,
  Vibrate,
} from 'lucide-react'

import {
  supabase
} from '../lib/supabase'

import {
  getCurrentMembership
} from '../lib/auth/getCurrentMembership'

/*
|--------------------------------------------------------------------------
| NAVBAR
|--------------------------------------------------------------------------
*/

export default function Navbar() {

  const pathname =
    usePathname()

  /*
   |--------------------------------------------------------------------------
   | STATE
   |--------------------------------------------------------------------------
   */

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    mobileOpen,
    setMobileOpen
  ] = useState(false)

  const [
    user,
    setUser
  ] = useState(null)

  const [
    membership,
    setMembership
  ] = useState(null)

  /*
   |--------------------------------------------------------------------------
   | LOAD SESSION
   |--------------------------------------------------------------------------
   */

  useEffect(() => {

    loadSession()

  }, [])

  async function loadSession() {

    try {

      setLoading(true)

      /*
       |--------------------------------------------------------------------------
       | auth
       |--------------------------------------------------------------------------
       */

      const {
        data: {
          session
        }
      } =
        await supabase
          .auth
          .getSession()

      if (!session) {

        setUser(null)
        setMembership(null)

        return
      }

      setUser(session.user)

      /*
       |--------------------------------------------------------------------------
       | membership
       |--------------------------------------------------------------------------
       */

      const result =
        await getCurrentMembership()

      setMembership(result)

    } catch (err) {

      console.log(err)

    } finally {

      setLoading(false)
    }
  }

  /*
   |--------------------------------------------------------------------------
   | LOGOUT
   |--------------------------------------------------------------------------
   */

  async function handleLogout() {

    await supabase.auth.signOut()

    window.location.href =
      '/login'
  }

  /*
   |--------------------------------------------------------------------------
   | MENU
   |--------------------------------------------------------------------------
   */

  const role =
    membership?.role

  const menus = [

    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      roles: [
        'admin',
        'bendahara',
        'warga'
      ]
    },

    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: [
        'bendahara',
        'warga',
      ]
    },

    {
      label: 'Warga',
      href: '/warga',
      icon: Users,
      roles: [
        'admin',
        'bendahara'
      ]
    },

    {
      label: 'Pembayaran',
      href: '/pembayaran',
      icon: Wallet,
      roles: [
        'admin',
        'bendahara'
      ]
    },

    {
      label: 'Pengeluaran',
      href: '/pengeluaran',
      icon: Receipt,
      roles: [
        'admin',
        'bendahara'
      ]
    },

    {
      label: 'Ledger',
      href: '/ledger',
      icon: ShelvingUnit,
      roles: [
        'admin',
        'bendahara'
      ]
    },

    {
      label: 'Notifikasi',
      href: '/notification',
      icon: Vibrate,
      roles: [
        'admin',
        'bendahara',
        'warga'
      ]
    }

  ]

  /*
   |--------------------------------------------------------------------------
   | FILTER MENU
   |--------------------------------------------------------------------------
   */

  const filteredMenus =
    menus.filter(item => {

      if (!role) {

        return false
      }

      return item.roles
        .includes(role)

    })

  /*
   |--------------------------------------------------------------------------
   | LOADING
   |--------------------------------------------------------------------------
   */

  if (loading) {

    return (

      <div
        className="
          h-16
          border-b
          flex
          items-center
          px-6
        "
      >
        Loading...
      </div>

    )
  }

  /*
   |--------------------------------------------------------------------------
   | NO SESSION
   |--------------------------------------------------------------------------
   */

  if (!user) {

    return null
  }

  /*
   |--------------------------------------------------------------------------
   | RENDER
   |--------------------------------------------------------------------------
   */

  return (

    <>
      {/* TOPBAR */}

      <header
        className="
          sticky
          top-0
          z-50
          bg-white
          border-b
        "
      >

        <div
          className="
            h-16
            px-4
            flex
            items-center
            justify-between
          "
        >

          {/* LEFT */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            {/* MOBILE BUTTON */}

            <button
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
              className="
                xl:hidden
              "
            >

              {
                mobileOpen
                  ? <X size={22} />
                  : <Menu size={22} />
              }

            </button>

            {/* BRAND */}

            <div>

              <div
                className="
                  font-bold
                "
              >
                RT Digital
              </div>

              <div
                className="
                  text-xs
                  text-gray-500
                "
              >
                {
                  membership?.rt
                    ?.nama
                }
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                hidden
                md:block
                text-right
              "
            >

              <div
                className="
                  text-sm
                  font-medium
                "
              >
                {
                  membership?.user
                    ?.nama
                }
              </div>

              <div
                className="
                  text-xs
                  text-gray-500
                  capitalize
                "
              >
                {role}
              </div>

            </div>

            <button
              onClick={handleLogout}
              className="
                p-2
                rounded-lg
                hover:bg-gray-100
              "
            >

              <LogOut size={18} />

            </button>

          </div>

        </div>

      </header>

      {/* MOBILE OVERLAY */}

      {
        mobileOpen && (

          <div
            className="
              fixed
              inset-0
              bg-black/30
              z-40
              xl:hidden
            "
            onClick={() =>
              setMobileOpen(false)
            }
          />

        )
      }

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          top-16
          left-0
          bottom-0
          w-72
          bg-white
          border-r
          z-50
          transition-transform

          ${mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          }

          xl:translate-x-0
        `}
      >

        <nav
          className="
            p-4
            space-y-2
          "
        >

          {
            filteredMenus.map(item => {

              const Icon =
                item.icon

              const active =
                pathname ===
                item.href

              return (

                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    transition

                    ${active
                      ? `
                          bg-blue-50
                          text-blue-700
                          font-medium
                        `
                      : `
                          hover:bg-gray-100
                        `
                    }
                  `}
                >

                  <Icon
                    size={18}
                  />

                  <span>
                    {item.label}
                  </span>

                </Link>

              )

            })
          }

        </nav>

      </aside>

      {/* CONTENT SPACER */}

      <div
        className="
          xl:pl-72
        "
      />
    </>
  )
}