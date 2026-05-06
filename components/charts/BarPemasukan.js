'use client'
import { Bar } from 'react-chartjs-2'
import { bulanList } from '../../lib/utils'

export default function BarPemasukan({ pemasukan, pengeluaran }) {
  const masuk = Array(12).fill(0)
  const keluar = Array(12).fill(0)

  pemasukan.forEach(p => {
    const m = new Date(p.tanggal).getMonth()
    masuk[m] += p.jumlah_bayar
  })

  pengeluaran.forEach(p => {
    const m = new Date(p.tanggal).getMonth()
    keluar[m] += p.nominal
  })

  const chartData = {
    labels: bulanList.map(b => b.nama),
    datasets: [
      {
        label: 'Pemasukan',
        data: masuk,
        backgroundColor: '#22c55e'
      },
      {
        label: 'Pengeluaran',
        data: keluar,
        backgroundColor: '#ef4444'
      }
    ]
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-2 font-semibold">
        Tren Kas Bulanan
      </h3>
      <Bar data={chartData} />
    </div>
  )
}