// @ts-nocheck
'use client'

import {

  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend

} from 'recharts'

import { useTranslations } from 'next-intl'

export default function CashflowChart({

  data = []

}) {

  const t = useTranslations('dashboard.sections')

  return (

    <div
      className="
        bg-white
        rounded-2xl
        p-5
        shadow-sm
        border
      "
    >

      <div
        className="
          mb-4
        "
      >

        <h2
          className="
            text-lg
            font-semibold
          "
        >
          Cashflow
        </h2>

        <p
          className="
            text-sm
            text-slate-500
          "
        >
          {t('cashflowSubtitle')}
        </p>

      </div>

      <div
        className="
          h-[350px]
        "
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={data}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
            />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="income"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="expense"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="balance"
              strokeWidth={2}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}