// @ts-nocheck
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

export default function MonthlyCollectionChart({

  data = []

}) {

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
          Monthly Collection
        </h2>

        <p
          className="
            text-sm
            text-slate-500
          "
        >
          Jumlah pembayaran per bulan
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
            />

            <XAxis
              dataKey="month"
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="total"
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}