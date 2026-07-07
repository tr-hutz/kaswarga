// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function PaymentActions({ row, onApprove, onReject }) {

    const t = useTranslations('pembayaran')

    if (row.status !== 'pending') {
        return null
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => onApprove(row.id)}
                className="px-3 py-1 rounded-lg bg-green-600 text-white"
            >
                {t('approval.approve')}
            </button>
            <button
                onClick={() => onReject(row.id)}
                className="px-3 py-1 rounded-lg bg-red-600 text-white"
            >
                {t('approval.reject')}
            </button>
        </div>
    )
}
