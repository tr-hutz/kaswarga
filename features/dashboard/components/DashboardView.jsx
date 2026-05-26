'use client'

import InsightCard
  from '../cards/InsightCard'

import PaymentHealthCard
  from '../cards/PaymentHealthCard'

import CashflowChart
  from '../charts/CashflowChart'

import MonthlyCollectionChart
  from '../charts/MonthlyCollectionChart'

export default function DashboardView({

  loading,

  year,
  setYear,

  analytics,

  paymentHealth

}) {

  if (
    loading ||
    !analytics ||
    !paymentHealth
  ) {

    return (
      <div>
        Loading...
      </div>
    )
  }

  return (

    <div className="space-y-6">

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
          Dashboard Analytics
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

      {/* INSIGHT */}

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
          value={
            paymentHealth.totalWarga
          }
        />

        <InsightCard
          title="Lunas"
          value={
            paymentHealth.lunas
          }
        />

        <InsightCard
          title="Hampir Lunas"
          value={
            paymentHealth.hampirLunas
          }
        />

        <InsightCard
          title="Menunggak"
          value={
            paymentHealth.menunggak
          }
        />

        <InsightCard
          title="Belum Bayar"
          value={
            paymentHealth.belumBayar
          }
        />

      </div>

      {/* CHART */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-6
        "
      >

        <CashflowChart
          data={
            analytics.cashflow
          }
        />

        <MonthlyCollectionChart
          data={
            analytics.collection
          }
        />

      </div>

      {/* HEALTH */}

      <PaymentHealthCard
        data={paymentHealth}
      />

    </div>
  )
}