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

import { useTheme } from '@/hooks/useTheme'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MonthlyCollectionChart({ data = [] }: { data?: any[] }) {

  const { resolvedTheme } = useTheme()

  const isDark       = resolvedTheme === 'dark'
  const gridStroke   = isDark ? '#2E3A47' : '#E2E8F0'
  const tickFill     = isDark ? '#8A99AF' : '#637381'
  const tooltipStyle = {
    backgroundColor: isDark ? '#24303F' : '#ffffff',
    borderColor:     isDark ? '#2E3A47' : '#E2E8F0',
    color:           isDark ? '#DEE4EE' : '#1C2434',
  }

  return (

    <div className="bg-surface rounded-lg shadow-card p-5">

      <div
        className="
          mb-4
        "
      >

        <h2 className="text-lg font-semibold text-foreground">
          Monthly Collection
        </h2>

        <p className="text-sm text-muted">
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
              stroke={gridStroke}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: tickFill, fontSize: 12 }}
            />

            <YAxis
              tick={{ fill: tickFill, fontSize: 12 }}
            />

            <Tooltip
              contentStyle={tooltipStyle}
            />

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