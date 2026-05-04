'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function WargaPage() {
  const [warga, setWarga] = useState(null)
  const [pembayaran, setPembayaran] = useState([])

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    fetchWarga(data.user.email)
  }

  const fetchWarga = async (email) => {
    const cleanEmail = email.trim().toLowerCase()

    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .ilike('email', cleanEmail)

    if (error) {
      console.log(error)
      return
    }

    if (!data || data.length === 0) {
      console.log('Warga tidak ditemukan:', cleanEmail)
      return
    }

    const wargaData = data[0]
    setWarga(wargaData)

    fetchPembayaran(wargaData.id)
  }

  const fetchPembayaran = async (wargaId) => {
    const { data } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('warga_id', wargaId)

    setPembayaran(data || [])
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const totalBulan = pembayaran.reduce(
    (acc, p) => acc + (p.jumlah_bulan || 0),
    0
  )

  const bulanList = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ]

  const getStatusBulanan = () => {
    let hasil = []
    let total = 0

    for (let i = 0; i < 12; i++) {
      if (total < totalBulan) {
        hasil.push(true)
        total++
      } else {
        hasil.push(false)
      }
    }

    return hasil
  }

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID').format(angka)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <a href="/admin/dashboard">Dashboard</a> |
        <a href="/admin/pembayaran">Pembayaran</a> |
        <a href="/admin/pengeluaran">Pengeluaran</a>
      </div>

      <h2>Halaman Warga</h2>

      <button onClick={logout}>Logout</button>

      {warga && (
        <>
          <p>{warga.nama}</p>
          <p>{warga.blok}</p>

          <h3>Status</h3>
          <p>Total Bayar: Rp {formatRupiah(totalBulan * 50000)}</p>
          <p>Sisa: {12 - totalBulan} bulan</p>
        </>
      )}

      <h3>Status Bulanan</h3>

      <ul>
        {getStatusBulanan().map((status, i) => (
          <li key={i}>
            {bulanList[i]} - {status ? '✅' : '❌'}
          </li>
        ))}
      </ul>
    </div>
  )
}