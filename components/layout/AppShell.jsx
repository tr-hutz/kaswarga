'use client'

import {

  useState

} from 'react'

import Topbar

  from './Topbar'

import Sidebar

  from './Sidebar'

import MobileOverlay

  from './MobileOverlay'

export default function AppShell({

                                   children

                                 }) {

  /*
   |-------------------------------------------------------------
   | STATE
   |-------------------------------------------------------------
   */

  const [

    mobileOpen,
    setMobileOpen

  ] = useState(false)

  return (

      <>

        <Topbar

            mobileOpen={
              mobileOpen
            }

            setMobileOpen={
              setMobileOpen
            }

        />

        <MobileOverlay

            open={
              mobileOpen
            }

            onClose={() =>

                setMobileOpen(
                    false
                )
            }

        />

        <Sidebar

            mobileOpen={
              mobileOpen
            }

            onClose={() =>

                setMobileOpen(
                    false
                )
            }

        />

        {/* PAGE */}

        <main
            className="
                    xl:pl-72
                    min-h-screen
                    bg-slate-50
                "
        >

          <div
              className="
                        p-4
                        md:p-6
                    "
          >

            {children}

          </div>

        </main>

      </>
  )
}