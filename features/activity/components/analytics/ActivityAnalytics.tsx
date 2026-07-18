'use client'

import { useTranslations } from 'next-intl'

interface Props {
    total:         number
    approvals:     number
    expenseCount:  number
    residentCount: number
}

export default function ActivityAnalytics({ total, approvals, expenseCount, residentCount }: Props) {
    const t = useTranslations('activity')
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title={t('analytics.total')}           value={total} />
            <Card title={t('analytics.approvals')}       value={approvals} />
            <Card title={t('analytics.expense')}         value={expenseCount} />
            <Card title={t('analytics.residentUpdates')} value={residentCount} />
        </div>
    )
}

function Card({ title, value }: { title: string; value: number }) {
    return (
        <div className="bg-surface rounded-lg shadow-card p-5">
            <p className="text-sm text-muted">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
        </div>
    )
}
