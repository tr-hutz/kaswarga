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
export default function MonthlyCollectionChart({ data = [] }: { data?: any[] }) {

    const t      = useTranslations('dashboard.sections')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const categories = data.map(d => d.month)

    const series = [
        { name: 'Pembayaran', data: data.map(d => d.total) },
    ]

    const options: ApexOptions = {
        chart: {
            type:       'bar',
            toolbar:    { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        colors: ['#3C50E0'],
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth:  '55%',
            },
        },
        xaxis: { categories },
        yaxis: {
            labels: {
                formatter: (val: number) => String(Math.round(val)),
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val} pembayaran`,
            },
        },
        grid:   { borderColor: isDark ? '#2E3A47' : '#E2E8F0' },
        theme:  { mode: isDark ? 'dark' : 'light' },
        dataLabels: { enabled: false },
    }

    return (
        <div className="bg-surface rounded-lg shadow-card p-5">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {t('monthlyCollectionTitle')}
                </h2>
                <p className="text-sm text-muted">
                    {t('monthlyCollectionSubtitle')}
                </p>
            </div>
            <Chart
                key={resolvedTheme}
                type="bar"
                series={series}
                options={options}
                height={350}
                width="100%"
            />
        </div>
    )
}
