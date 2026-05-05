'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUserRole } from '../lib/getUserRole'

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const data = await getUserRole()
    setUser(data)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <div className="bg-white shadow p-3 mb-4 flex justify-between">

      {/* LEFT */}
      <div className="flex gap-4 text-sm">

        {/* Semua user */}
        <a href="/admin/dashboard">Dashboard</a>

        {/* Admin only */}
        {isAdmin && (
          <>
            <a href="/admin/pembayaran">Pembayaran</a>
            <a href="/admin/konfirmasi-pembayaran">Konfirmasi Pembayaran</a>
            <a href="/admin/pengeluaran">Pengeluaran</a>
          </>
        )}

      </div>

      {/* RIGHT */}
      <div className="flex gap-3 items-center text-sm">
        <span className="text-gray-600">
          {user.nama}
        </span>

        <button onClick={logout} className="text-red-500">
          Logout
        </button>
      </div>

    </div>
  )
}