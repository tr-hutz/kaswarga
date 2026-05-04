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

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>Masuk: {masuk}</p>
      <p>Keluar: {keluar}</p>
      <h3>Saldo: {masuk - keluar}</h3>
    </div>
  )
}