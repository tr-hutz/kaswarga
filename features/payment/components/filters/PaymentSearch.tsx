// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function PaymentSearch({ search, setSearch }) {
    const t = useTranslations('payments')
    return (
        <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full xl:w-[320px] border rounded-xl px-4 py-2"
        />
    )
}
