'use client'

import {

  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip

} from 'recharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MonthlyCollectionChart({ data = [] }: { data?: any[] }) {

  return (

    <div className="bg-white rounded-lg shadow-card p-5">

      <div
        className="
          mb-4
        "
      >

        <h2 className="text-lg font-semibold text-dark">
          Monthly Collection
        </h2>

        <p className="text-sm text-dark-5">
          Number of payments per month
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

          <BarChart
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

            <Bar
              dataKey="total"
              fill="#3C50E0"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}