'use client'
import { Doughnut } from 'react-chartjs-2'

export default function PiePengeluaran({ data }) {
  const kategoriMap = {}

  data.forEach(d => {
    kategoriMap[d.kategori] =
      (kategoriMap[d.kategori] || 0) + d.nominal
  })

  const chartData = {
    labels: Object.keys(kategoriMap),
    datasets: [
      {
        data: Object.values(kategoriMap),
        backgroundColor: [
          '#22c55e', // hijau
          '#3b82f6', // biru
          '#f59e0b', // kuning
          '#ef4444', // merah
          '#8b5cf6', // ungu
          '#14b8a6', // teal
        ]
      }
    ]
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-2 font-semibold">
        Pengeluaran per Kategori
      </h3>
      <Doughnut data={chartData} />
    </div>
  )
}