'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function WargaPage() {
  const [user, setUser] = useState(null)
  const [warga, setWarga] = useState(null)
  const [pembayaran, setPembayaran] = useState([])

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data } = await supabase.auth.getUser()
    const currentUser = data.user

    setUser(currentUser)

    if (currentUser) {
      fetchWarga(currentUser.email)
    }
  }

  const fetchWarga = async (email) => {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.log(error)
      return
    }

    if (!data) {
      console.log('Warga tidak ditemukan')
      return
    }

    setWarga(data)
    fetchPembayaran(data.id)
  }

  const fetchPembayaran = async (wargaId) => {
    const { data } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('warga_id', wargaId)

    setPembayaran(data)
  }

  const totalBulan = pembayaran.reduce((acc, p) => acc + (p.jumlah_bulan || 0), 0)

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Halaman Warga</h2>
      <button onClick={logout}>Logout</button>

      {warga && (
        <>
          <p>Nama: {warga.nama}</p>
          <p>Blok: {warga.blok}</p>

          <h3>Status Iuran</h3>
          <p>Sudah bayar: {totalBulan} bulan</p>
          <p>Sisa: {12 - totalBulan} bulan</p>
        </>
      )}

      <h3>Riwayat Pembayaran</h3>
      <ul>
        {pembayaran.map((p) => (
          <li key={p.id}>
            {p.tanggal} - {p.jumlah_bayar} ({p.jumlah_bulan} bulan)
          </li>
        ))}
      </ul>
    </div>
  )
}