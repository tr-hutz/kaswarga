// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function PaymentStatusTabs({ status, setStatus }) {
    const t = useTranslations('common')

    const tabs = [
        { key: 'pending',   label: t('paymentStatus.pending') },
        { key: 'approved',  label: t('paymentStatus.approved') },
        { key: 'rejected',  label: t('paymentStatus.rejected') },
    ]

    return (
        <div className="flex gap-2">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setStatus(tab.key)}
                    className={`px-4 py-2 rounded-xl border ${status === tab.key ? 'bg-black text-white' : 'bg-white'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
