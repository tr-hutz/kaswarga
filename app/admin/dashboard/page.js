'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/Card'
import { formatRupiah } from '../../../lib/utils'

export default function DashboardPage() {
  const [totalMasuk, setTotalMasuk] = useState(0)
  const [totalKeluar, setTotalKeluar] = useState(0)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    const { data: pembayaran } = await supabase
      .from('pembayaran')
      .select('jumlah_bayar')

    const { data: pengeluaran } = await supabase
      .from('pengeluaran')
      .select('nominal')

    const masuk = (pembayaran || []).reduce((a, b) => a + (b.jumlah_bayar || 0), 0)
    const keluar = (pengeluaran || []).reduce((a, b) => a + (b.jumlah || 0), 0)

    setTotalMasuk(masuk)
    setTotalKeluar(keluar)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-sm text-gray-500">Masuk</p>
          <p className="font-bold">Rp {formatRupiah(totalMasuk)}</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Keluar</p>
          <p className="font-bold">Rp {formatRupiah(totalKeluar)}</p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Saldo</p>
          <p className="font-bold text-green-600">
            Rp {formatRupiah(totalMasuk - totalKeluar)}
          </p>
        </Card>
      </div>
    </div>
  )
}