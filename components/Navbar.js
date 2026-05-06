'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUserRole } from '../lib/getUserRole'

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    init()
    fetchPending
  }, [])

  const init = async () => {
    const data = await getUserRole()
    setUser(data)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const [pendingCount, setPendingCount] = useState(0)
  const fetchPending = async () => {
    const { count } = await supabase
      .from('konfirmasi_pembayaran')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    setPendingCount(count || 0)
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
            <a href="/admin/konfirmasi-pembayaran" className="relative">
              Konfirmasi Pembayaran {pendingCount > 0 && (<span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-1 rounded">
                {pendingCount}
              </span>
              )}
            </a>
            <a href="/admin/pengeluaran">Pengeluaran</a>
            <a href="/admin/profil">Profil</a>

            <button
              onClick={() => {
                window.open(`/api/laporan?tahun=2026`, '_blank')
              }}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Download Laporan PDF
            </button>
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