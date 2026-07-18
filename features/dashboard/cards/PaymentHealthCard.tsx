'use client'

import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentHealthCard({ data }: { data: any }) {

    const t = useTranslations('dashboard')

    return (
        <div className="rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">{t('sections.paymentStatus')}</h2>
            <div className="space-y-3">
                <div className="text-dark-5">{t('cards.paid')}: {data.paid}</div>
                <div className="text-dark-5">{t('cards.almostPaid')}: {data.almostPaid}</div>
                <div className="text-dark-5">{t('cards.delinquent')}: {data.delinquent}</div>
                <div className="text-dark-5">{t('cards.neverPaid')}: {data.neverPaid}</div>
            </div>
        </div>
    )
}
