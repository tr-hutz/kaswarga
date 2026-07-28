'use client'

import dynamic             from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useTheme }        from '@/lib/hooks/useTheme'
import type { ApexOptions } from 'apexcharts'

const Chart = dynamic(() => import('react-apexcharts'), {
    ssr:     false,
    loading: () => (
        <div className="h-[300px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-divider border-t-primary rounded-full animate-spin" />
        </div>
    ),
})

const PALETTE = [
    '#3C50E0', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

interface Props {
    data: { category: string; total: number }[]
    year: number
}

export default function ExpenseCategoryDonutChart({ data = [], year }: Props) {
    const t      = useTranslations('dashboard.sections')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const total = data.reduce((s, d) => s + d.total, 0)

    const header = (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('expenseCategoryTitle')}</h2>
            <p className="text-sm text-muted">{t('expenseCategorySubtitle', { year })}</p>
        </div>
    )

    if (data.length === 0 || total === 0) {
        return (
            <div className="bg-surface rounded-lg shadow-card p-5 flex flex-col h-full">
                {header}
                <div className="flex-1 flex items-center justify-center text-sm text-muted min-h-[260px]">
                    {t('noExpenseData')}
                </div>
            </div>
        )
    }

    const series = data.map(d => d.total)
    const labels = data.map(d => d.category)
    const colors = data.map((_, i) => PALETTE[i % PALETTE.length])

    const options: ApexOptions = {
        chart: {
            type:       'donut',
            background: 'transparent',
            fontFamily: 'inherit',
        },
        colors,
        labels,
        legend: {
            position: 'bottom',
            fontSize:  '12px',
            offsetY:   4,
        },
        tooltip: {
            y: {
                formatter: (val: number) => {
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
                    return `Rp ${val.toLocaleString('id-ID')} (${pct}%)`
                },
            },
        },
        dataLabels: {
            enabled:   true,
            formatter: (val: number) => `${Number(val).toFixed(1)}%`,
            style:     { fontSize: '11px', fontWeight: '600', colors: ['#fff'] },
            dropShadow: { enabled: false },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show:  true,
                        total: {
                            show:      true,
                            label:     'Total',
                            formatter: () => {
                                if (total >= 1_000_000) return `Rp ${(total / 1_000_000).toFixed(1)}jt`
                                if (total >= 1_000)     return `Rp ${Math.round(total / 1_000)}rb`
                                return `Rp ${total}`
                            },
                            color:      isDark ? '#CBD5E1' : '#374151',
                            fontSize:   '13px',
                            fontWeight: '600',
                        },
                        value: {
                            formatter: (val: string) => {
                                const n = Number(val)
                                if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
                                if (n >= 1_000)     return `Rp ${Math.round(n / 1_000)}rb`
                                return `Rp ${n}`
                            },
                            color:    isDark ? '#CBD5E1' : '#374151',
                            fontSize: '13px',
                        },
                    },
                },
            },
        },
        stroke: {
            width:  2,
            colors: [isDark ? '#1E2A36' : '#FFFFFF'] as string[],
        },
        theme: { mode: isDark ? 'dark' : 'light' },
    }

    return (
        <div className="bg-surface rounded-lg shadow-card p-5 flex flex-col h-full">
            {header}
            <Chart
                key={`donut-${resolvedTheme}`}
                type="donut"
                series={series}
                options={options}
                height={320}
                width="100%"
            />
        </div>
    )
}
