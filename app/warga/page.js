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
    { id: 1, nama: 'Jan' },
    { id: 2, nama: 'Feb' },
    { id: 3, nama: 'Mar' },
    { id: 4, nama: 'Apr' },
    { id: 5, nama: 'Mei' },
    { id: 6, nama: 'Jun' },
    { id: 7, nama: 'Jul' },
    { id: 8, nama: 'Agu' },
    { id: 9, nama: 'Sep' },
    { id: 10, nama: 'Okt' },
    { id: 11, nama: 'Nov' },
    { id: 12, nama: 'Des' }
  ]

  const getStatusBulanan = () => {
    let paidMonths = []

    pembayaran.forEach(p => {
      if (p.bulan_dibayar) {
        paidMonths = [...paidMonths, ...p.bulan_dibayar]
      }
    })

    return bulanList.map(b => ({
      id: b.id,
      nama: b.nama,
      isPaid: paidMonths.includes(b.id)
    }))
  }

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID').format(angka)
  }

  const totalBayar = pembayaran.reduce(
    (acc, p) => acc + (p.jumlah_bayar || 0),
    0
  )

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10
      }}>
        {getStatusBulanan().map((b) => (
          <div
            key={b.id}
            style={{
              padding: 12,
              borderRadius: 10,
              background: b.isPaid ? '#d4edda' : '#f8d7da',
              border: b.isPaid ? '1px solid #28a745' : '1px solid #dc3545',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            <div>{b.nama}</div>
            <div style={{ fontSize: 20 }}>
              {b.isPaid ? '✔️' : '❌'}
            </div>
          </div>
        ))}
      </div>

      <h3>Ringkasan</h3>
      <p>Total Bayar: Rp {formatRupiah(totalBayar)}</p>
      <p>Sudah Bayar: {formatRupiah(totalBulan)} bulan</p>
      <p>Tunggakan: {12 - totalBulan} bulan</p>

      <h3>Riwayat Pembayaran</h3>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Bulan</th>
            <th>Jumlah</th>
          </tr>
        </thead>

        <tbody>
          {pembayaran.map((p, i) => (
            <tr key={i}>
              <td>{new Date(p.tanggal).toLocaleDateString()}</td>
              <td>{(p.bulan_dibayar || []).join(', ')}</td>
              <td>Rp {formatRupiah(p.jumlah_bayar)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}