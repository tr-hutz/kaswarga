// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function PaymentHealthCard({ data }) {

    const t = useTranslations('dashboard')

    return (
        <div className="rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-4">{t('sections.paymentStatus')}</h2>
            <div className="space-y-3">
                <div>{t('cards.paid')}: {data.paid}</div>
                <div>{t('cards.almostPaid')}: {data.almostPaid}</div>
                <div>{t('cards.delinquent')}: {data.delinquent}</div>
                <div>{t('cards.neverPaid')}: {data.neverPaid}</div>
            </div>
        </div>
    )
}
