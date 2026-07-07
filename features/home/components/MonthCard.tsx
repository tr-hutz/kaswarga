// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

const STATUS_STYLE = {
    approved: 'bg-green-100 border-green-500',
    pending:  'bg-yellow-100 border-yellow-500',
    rejected: 'bg-red-100 border-red-500',
    unpaid:   'bg-gray-100 border-gray-300'
}

export default function MonthCard({ month, status }) {

    const t = useTranslations('common')
    const finalStatus = status || 'unpaid'

    const statusLabel = {
        approved: t('paymentStatus.paid'),
        pending:  t('paymentStatus.pending'),
        rejected: t('paymentStatus.rejected'),
        unpaid:   t('paymentStatus.unpaid')
    }

    return (
        <div className={`border-2 rounded-xl p-4 transition ${STATUS_STYLE[finalStatus]}`}>
            <div className="font-semibold text-lg">{month}</div>
            <div className="text-sm mt-2">{statusLabel[finalStatus]}</div>
        </div>
    )
}
