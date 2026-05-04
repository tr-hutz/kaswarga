'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getUserRole } from '../../../lib/getUserRole'

export default function Dashboard() {
  const [masuk, setMasuk] = useState(0)
  const [keluar, setKeluar] = useState(0)

  useEffect(() => {
    checkAccess()
    fetchData()
  }, [])

  const checkAccess = async () => {
    const role = await getUserRole()
    if (role !== 'admin') {
      window.location.href = '/warga'
    }
  }

  const fetchData = async () => {
    const { data: pembayaran } = await supabase
      .from('pembayaran')
      .select('jumlah_bayar')

    const { data: pengeluaran } = await supabase
      .from('pengeluaran')
      .select('nominal')

    const totalMasuk =
      pembayaran?.reduce((a, b) => a + (b.jumlah_bayar || 0), 0) || 0

    const totalKeluar =
      pengeluaran?.reduce((a, b) => a + (b.nominal || 0), 0) || 0

    setMasuk(totalMasuk)
    setKeluar(totalKeluar)
  }

  const exportCSV = async () => {
    const { data: pembayaran } = await supabase
      .from('pembayaran')
      .select('*, warga(nama, blok)')

    if (!pembayaran) return

    let csv = 'Nama,Blok,Bulan Dibayar,Jumlah Bayar,Tanggal\n'

    pembayaran.forEach(p => {
      const bulan = (p.bulan_dibayar || []).join('-')

      csv += `${p.warga?.nama || ''},${p.warga?.blok || ''},${bulan},${p.jumlah_bayar},${p.tanggal}\n`
    })

    // download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'laporan_kas.csv'
    link.click()
  }

  const exportRekap = async () => {
    const { data: warga } = await supabase.from('warga').select('*')
    const { data: pembayaran } = await supabase.from('pembayaran').select('*')

    let csv = 'Nama,Blok,Total Bulan,Total Bayar\n'

    warga.forEach(w => {
      const bayar = pembayaran.filter(p => p.warga_id === w.id)

      const totalBulan = bayar.reduce((a, b) => a + (b.jumlah_bulan || 0), 0)
      const totalBayar = bayar.reduce((a, b) => a + (b.jumlah_bayar || 0), 0)

      csv += `${w.nama},${w.blok || ''},${totalBulan},${totalBayar}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'rekap_warga.csv'
    link.click()
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <button onClick={exportCSV}>
        Export CSV
      </button>
      <button onClick={exportRekap}>
        Export Rekap Warga
      </button>
      <p>Masuk: {masuk}</p>
      <p>Keluar: {keluar}</p>
      <h3>Saldo: {masuk - keluar}</h3>
    </div>
  )
}