'use client'

import { useTranslations } from 'next-intl'
import { formatRupiah } from '@/lib/utils'

interface Props {
    income:  number
    expense: number
    balance: number
}

export default function LedgerAnalytics({ income, expense, balance }: Props) {
    const t = useTranslations('ledger')

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border p-5">
                <p className="text-sm text-slate-500">{t('analytics.income')}</p>
                <h2 className="mt-2 text-2xl font-bold">{formatRupiah(income)}</h2>
            </div>
            <div className="bg-white rounded-2xl border p-5">
                <p className="text-sm text-slate-500">{t('analytics.expense')}</p>
                <h2 className="mt-2 text-2xl font-bold">{formatRupiah(expense)}</h2>
            </div>
            <div className="bg-white rounded-2xl border p-5">
                <p className="text-sm text-slate-500">{t('analytics.balance')}</p>
                <h2 className="mt-2 text-2xl font-bold">{formatRupiah(balance)}</h2>
            </div>
        </div>
    )
}
