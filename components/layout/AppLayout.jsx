'use client'

import Navbar
  from '../Navbar'

export default function AppLayout({

  children

}) {

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
      "
    >

      <Navbar />

      <main
        className="
          xl:pl-72
          pt-6
          px-4
          pb-10
        "
      >

        {children}

      </main>

    </div>
  )
}