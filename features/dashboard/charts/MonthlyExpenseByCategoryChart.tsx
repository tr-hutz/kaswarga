'use client'

import dynamic             from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useTheme }        from '@/lib/hooks/useTheme'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), {
    ssr:     false,
    loading: () => (
        <div className="h-[350px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-divider border-t-primary rounded-full animate-spin" />
        </div>
    ),
})

const PALETTE = [
    '#3C50E0', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

interface MonthData {
    month:  string
    values: Record<string, number>
}

interface Props {
    data:       MonthData[]
    categories: string[]
}

function fmtRupiah(val: number): string {
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1).replace('.0', '')}jt`
    if (val >= 1_000)     return `Rp ${Math.round(val / 1_000)}rb`
    return `Rp ${val}`
}

export default function MonthlyExpenseByCategoryChart({ data = [], categories = [] }: Props) {
    const t      = useTranslations('dashboard.sections')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const months = data.map(d => d.month)

    const series = categories.map((cat, i) => ({
        name:  cat,
        data:  data.map(d => d.values[cat] ?? 0),
        color: PALETTE[i % PALETTE.length],
    }))

    const hasData = series.some(s => s.data.some(v => v > 0))

    const options: ApexOptions = {
        chart: {
            type:       'bar',
            stacked:    true,
            toolbar:    { show: false },
            background: 'transparent',
            fontFamily: 'inherit',
        },
        colors: categories.map((_, i) => PALETTE[i % PALETTE.length]),
        plotOptions: {
            bar: {
                borderRadius: 0,
                columnWidth:  '55%',
            },
        },
        xaxis: {
            categories: months,
        },
        yaxis: {
            labels: {
                formatter: (val: number) => fmtRupiah(val),
            },
        },
        tooltip: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            custom: ({ series: s, seriesIndex, dataPointIndex }: any) => {
                const monthTotal = (s as number[][]).reduce(
                    (sum, row) => sum + (row[dataPointIndex] ?? 0), 0,
                )
                const val   = (s as number[][])[seriesIndex][dataPointIndex] ?? 0
                const cat   = categories[seriesIndex] ?? '-'
                const pct   = monthTotal > 0 ? ((val / monthTotal) * 100).toFixed(1) : '0'
                const color = PALETTE[seriesIndex % PALETTE.length]

                const fmt = (n: number) =>
                    new Intl.NumberFormat('id-ID', {
                        style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
                    }).format(n)

                return `
                    <div style="padding:10px 14px;line-height:1.75;min-width:180px;font-family:inherit">
                        <div style="font-weight:700;font-size:13px;margin-bottom:6px">${months[dataPointIndex]}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
                            <span style="font-weight:600;font-size:13px">${cat}</span>
                        </div>
                        <div style="font-size:13px">${fmt(val)} &nbsp;&middot;&nbsp; <strong>${pct}%</strong></div>
                        <div style="font-size:11px;opacity:0.55;margin-top:3px">Total bulan: ${fmt(monthTotal)}</div>
                    </div>
                `
            },
        },
        legend: {
            position:        'top',
            horizontalAlign: 'left',
            fontSize:        '13px',
            offsetY:         -4,
        },
        grid:       { borderColor: isDark ? '#2E3A47' : '#E2E8F0' },
        theme:      { mode: isDark ? 'dark' : 'light' },
        dataLabels: { enabled: false },
    }

    return (
        <div className="bg-surface rounded-lg shadow-card p-5">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">{t('monthlyExpenseCategoryTitle')}</h2>
                <p className="text-sm text-muted">{t('monthlyExpenseCategorySubtitle')}</p>
            </div>
            {!hasData ? (
                <div className="h-[350px] flex items-center justify-center text-sm text-muted">
                    {t('noExpenseData')}
                </div>
            ) : (
                <Chart
                    key={`stacked-${resolvedTheme}`}
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
