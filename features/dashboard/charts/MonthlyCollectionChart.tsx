'use client'

import dynamic        from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useTheme }   from '@/lib/hooks/useTheme'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), {
    ssr:     false,
    loading: () => (
        <div className="h-[350px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-divider border-t-primary rounded-full animate-spin" />
        </div>
    ),
})

function fmtRupiah(val: number): string {
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1).replace('.0', '')}jt`
    if (val >= 1_000)     return `Rp ${Math.round(val / 1_000)}rb`
    return `Rp ${val}`
}

interface CollectionPoint {
    month:         string
    amount:        number
    residentsPaid: number
}

export default function MonthlyCollectionChart({
    data           = [],
    totalResidents = 0,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?:           any[]
    totalResidents?: number
}) {

    const t      = useTranslations('dashboard.sections')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const points = data as CollectionPoint[]

    const series = [
        { name: 'Pemasukan', data: points.map(d => d.amount) },
    ]

    const hasData = series.some(s => s.data.some(v => v > 0))

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
        xaxis: { categories: points.map(d => d.month) },
        yaxis: {
            labels: {
                formatter: (val: number) => fmtRupiah(val),
            },
        },
        tooltip: {
            custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
                const d   = points[dataPointIndex]
                const pct = totalResidents > 0
                    ? Math.round((d.residentsPaid / totalResidents) * 100)
                    : 0
                return `
                    <div style="padding:8px 12px;line-height:1.6">
                        <div style="font-weight:600">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.amount)}</div>
                        <div style="font-size:12px;opacity:0.75">${d.residentsPaid} / ${totalResidents} warga &nbsp;·&nbsp; ${pct}%</div>
                    </div>
                `
            },
        },
        grid:       { borderColor: isDark ? '#2E3A47' : '#E2E8F0' },
        theme:      { mode: isDark ? 'dark' : 'light' },
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
            {!hasData ? (
                <div className="h-[350px] flex items-center justify-center text-sm text-muted">
                    {t('noData')}
                </div>
            ) : (
                <Chart
                    key={resolvedTheme}
                    type="bar"
                    series={series}
                    options={options}
                    height={350}
                    width="100%"
                />
            )}
        </div>
    )
}
