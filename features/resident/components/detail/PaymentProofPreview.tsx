'use client'

import { useTranslations } from 'next-intl'

export default function PaymentProofPreview({ url }: { url?: string | null }) {

    const t = useTranslations('payments.detail')

    if (!url) {
        return (
            <div className="text-sm text-muted">
                {t('proofUnavailable')}
            </div>
        )
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3">
                {t('proofTitle')}
            </h3>
            <img
                src={url}
                alt={t('proofTitle')}
                className="w-full rounded-xl border border-divider object-cover"
            />
        </div>
    )
}
