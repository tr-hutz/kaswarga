// @ts-nocheck
'use client'

import InsightCard
  from '../cards/InsightCard'

import CashflowChart
  from '../charts/CashflowChart'

import MonthlyCollectionChart
  from '../charts/MonthlyCollectionChart'

import {
  formatRupiah
} from '../../../lib/utils'

function SectionLabel({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

export default function DashboardView({

  loading,

  year,
  setYear,

  analytics,

  paymentHealth,

  financialInsight

}) {

  if (
    loading ||
    !analytics ||
    !paymentHealth ||
    !financialInsight
  ) {

    return (
      <div className="text-sm text-gray-400 p-6">
        Memuat data...
      </div>
    )
  }

  return (

    <div className="space-y-8">

      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <h1
          className="
            text-2xl
            font-bold
          "
        >
          Dashboard
        </h1>

        <select
          value={year}
          onChange={e =>
            setYear(
              Number(
                e.target.value
              )
            )
          }
          className="
            border
            rounded-lg
            px-3
            py-2
            text-sm
          "
        >

          {[
            year - 1,
            year,
            year + 1
          ].map(item => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>

      </div>

      {/* STATUS IURAN WARGA */}

      <div className="space-y-3">

        <SectionLabel
          title="Status Iuran Warga"
          subtitle="Rekap kepatuhan pembayaran iuran bulanan"
        />

        <div
          className="
            grid
            grid-cols-2
            xl:grid-cols-5
            gap-4
          "
        >

          <InsightCard
            title="Total Warga"
            value={paymentHealth.totalWarga}
          />

          <InsightCard
            title="Lunas"
            value={paymentHealth.paid}
            valueColor="text-green-600"
          />

          <InsightCard
            title="Hampir Lunas"
            value={paymentHealth.almostPaid}
            valueColor="text-yellow-600"
          />

          <InsightCard
            title="Menunggak"
            value={paymentHealth.delinquent}
            valueColor="text-orange-600"
          />

          <InsightCard
            title="Belum Bayar"
            value={paymentHealth.neverPaid}
            valueColor="text-red-600"
          />

        </div>

      </div>

      {/* KEUANGAN RT */}

      <div className="space-y-3">

        <SectionLabel
          title="Keuangan RT"
          subtitle={`Ringkasan arus kas tahun ${year}`}
        />

        <div
          className="
            grid
            grid-cols-2
            xl:grid-cols-4
            gap-4
          "
        >

          <InsightCard
            title="Saldo Saat Ini"
            value={formatRupiah(financialInsight.balance)}
            subtitle="saldo berjalan"
            valueColor="text-blue-700"
          />

          <InsightCard
            title="Pemasukan"
            value={formatRupiah(financialInsight.income)}
            subtitle="tahun ini"
            valueColor="text-green-600"
          />

          <InsightCard
            title="Pengeluaran"
            value={formatRupiah(financialInsight.expense)}
            subtitle="tahun ini"
            valueColor="text-orange-600"
          />

          <InsightCard
            title="Tunggakan"
            value={formatRupiah(financialInsight.arrears)}
            subtitle="perlu ditagih"
            valueColor="text-red-600"
          />

        </div>

      </div>

      {/* CHARTS */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-6
        "
      >

        <CashflowChart
          data={analytics.cashflow}
        />

        <MonthlyCollectionChart
          data={analytics.collection}
        />

      </div>

    </div>
  )
}