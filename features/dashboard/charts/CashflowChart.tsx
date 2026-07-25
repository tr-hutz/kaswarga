'use client'

import dynamic        from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useTheme }   from '@/hooks/useTheme'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), {
    ssr:     false,
    loading: () => (
        <div className="h-[350px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-divider border-t-primary rounded-full animate-spin" />
        </div>
    ),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CashflowChart({ data = [] }: { data?: any[] }) {

    const t      = useTranslations('dashboard.sections')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const categories = data.map(d => d.month)

    const series = [
        { name: 'Pemasukan',   data: data.map(d => d.income)  },
        { name: 'Pengeluaran', data: data.map(d => d.expense) },
        { name: 'Saldo',       data: data.map(d => d.balance) },
    ]

    const options: ApexOptions = {
        chart: {
            type:       'line',
            toolbar:    { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        colors: ['#219653', '#D34053', '#3C50E0'],
        stroke: { curve: 'smooth', width: 2 },
        xaxis:  { categories },
        yaxis:  {
            labels: {
                formatter: (val: number) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
                    if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K`
                    return String(val)
                },
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) =>
                    `Rp ${Number(val).toLocaleString('id-ID')}`,
            },
        },
        legend: { position: 'top' },
        grid:   { borderColor: isDark ? '#2E3A47' : '#E2E8F0' },
        theme:  { mode: isDark ? 'dark' : 'light' },
        dataLabels: { enabled: false },
    }

    return (
        <div className="bg-surface rounded-lg shadow-card p-5">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {t('cashflowTitle')}
                </h2>
                <p className="text-sm text-muted">
                    {t('cashflowSubtitle')}
                </p>
            </div>
            <Chart
                key={resolvedTheme}
                type="line"
                series={series}
                options={options}
                height={350}
                width="100%"
            />
        </div>
    )
}
