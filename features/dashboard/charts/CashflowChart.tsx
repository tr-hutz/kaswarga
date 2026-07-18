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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CashflowChart({ data = [] }: { data?: any[] }) {

  const t = useTranslations('dashboard.sections')

  return (

    <div className="bg-white rounded-lg shadow-card p-5">

      <div
        className="
          mb-4
        "
      >

        <h2 className="text-lg font-semibold text-dark">
          Cashflow
        </h2>

        <p className="text-sm text-dark-5">
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
              stroke="#E2E8F0"
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
              stroke="#219653"
            />

            <Line
              type="monotone"
              dataKey="expense"
              strokeWidth={2}
              stroke="#D34053"
            />

            <Line
              type="monotone"
              dataKey="balance"
              strokeWidth={2}
              stroke="#3C50E0"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}