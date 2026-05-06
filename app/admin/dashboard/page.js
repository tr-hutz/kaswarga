'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/Card'
import { formatRupiah, bulanList } from '../../../lib/utils'
import '../../../components/ChartSetup'
import PiePengeluaran from '../../../components/charts/PiePengeluaran'
import BarPemasukan from '../../../components/charts/BarPemasukan'
import InsightBox from '../../../components/dashboard/InsightBox'

export default function DashboardPage() {
  const [totalMasuk, setTotalMasuk] = useState(0)
  const [totalKeluar, setTotalKeluar] = useState(0)
  const [pembayaran, setPembayaran] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [warga, setWarga] = useState([])

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    const { data: p } = await supabase
      .from('pembayaran')
      .select('*')

    const { data: k } = await supabase
      .from('pengeluaran')
      .select('*')

    setPembayaran(p || [])
    setPengeluaran(k || [])

    const masuk = (p || []).reduce((a, b) => a + (b.jumlah_bayar || 0), 0)
    const keluar = (k || []).reduce((a, b) => a + (b.nominal || 0), 0)

    setTotalMasuk(masuk)
    setTotalKeluar(keluar)
  }

  const getInsights = () => {
    if (!pembayaran.length && !pengeluaran.length) return {}

    // ===== TOTAL =====
    const totalMasuk = pembayaran.reduce((a, b) => a + (b.jumlah_bayar || 0), 0)
    const totalKeluar = pengeluaran.reduce((a, b) => a + (b.nominal || 0), 0)

    // ===== KATEGORI TERBESAR =====
    const kategoriMap = {}
    pengeluaran.forEach(p => {
      kategoriMap[p.kategori] =
        (kategoriMap[p.kategori] || 0) + p.nominal
    })

    const topKategori = Object.entries(kategoriMap)
      .sort((a, b) => b[1] - a[1])[0]

    // ===== BULAN TERBOROS =====
    const bulanKeluar = Array(12).fill(0)

    pengeluaran.forEach(p => {
      const m = new Date(p.tanggal).getMonth()
      bulanKeluar[m] += p.nominal
    })

    const maxKeluar = Math.max(...bulanKeluar)
    const bulanIndex = bulanKeluar.indexOf(maxKeluar)

    // ===== STATUS =====
    let status = 'Seimbang'
    let color = 'gray'

    if (totalMasuk > totalKeluar) {
      status = 'Surplus'
      color = 'green'
    } else if (totalKeluar > totalMasuk) {
      status = 'Defisit'
      color = 'red'
    }

    // ===== RATA-RATA =====
    const avgIuran = pembayaran.length
      ? totalMasuk / pembayaran.length
      : 0

    // ===== GROUP BY WARGA =====
    const wargaMap = {}

    pembayaran.forEach(p => {
      const id = p.warga_id

      if (!wargaMap[id]) {
        wargaMap[id] = {
          total: 0,
          count: 0
        }
      }

      wargaMap[id].total += p.jumlah_bayar || 0
      wargaMap[id].count += 1
    })

    // ===== PALING RAJIN =====
    const topWarga = Object.entries(wargaMap)
      .sort((a, b) => b[1].total - a[1].total)[0]

    // ===== WARGA TIDAK PERNAH BAYAR =====
    const wargaIdsBayar = new Set(pembayaran.map(p => p.warga_id))

    const wargaTidakBayar = warga
      .filter(w => !wargaIdsBayar.has(w.id))
      .map(w => `${w.nama} (${w.blok}-${w.no_rumah})`)

    return {
      topKategori,
      bulanIndex,
      maxKeluar,
      status,
      color,
      avgIuran,
      topWarga,
      wargaTidakBayar
    }
  }

  const insight = getInsights()

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <PiePengeluaran data={pengeluaran} />
        <BarPemasukan pemasukan={pembayaran} pengeluaran={pengeluaran} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

        {insight.topKategori && (
          <InsightBox
            title="Pengeluaran Terbesar"
            value={`${insight.topKategori[0]} (${formatRupiah(insight.topKategori[1])})`}
            color="yellow"
          />
        )}

        <InsightBox
          title="Bulan Paling Boros"
          value={`${bulanList[insight.bulanIndex]?.nama} (${formatRupiah(insight.maxKeluar)})`}
          color="red"
        />

        <InsightBox
          title="Status Kas"
          value={insight.status}
          color={insight.color}
        />

      </div>
    </div>
  )
}