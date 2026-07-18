'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

function NoBukti({ label }: { label: string }) {
    return (
        <div className="w-full rounded-lg border border-dashed border-stroke bg-body flex flex-col items-center justify-center gap-2 py-12 text-dark-6">
            <Icon name="image-off" className="w-10 h-10" />
            <span className="text-sm">{label}</span>
        </div>
    )
}

export default function PaymentProofPreview({ url }: { url?: string | null }) {
    const t = useTranslations('payments')
    const [failed, setFailed] = useState(false)

    if (!url) {
        return <NoBukti label={t('detail.proofError')} />
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3">
                {t('detail.proofTitle')}
            </h3>
            {failed ? (
                <NoBukti label={t('detail.proofError')} />
            ) : (
                <img
                    src={url}
                    alt={t('detail.proofTitle')}
                    onError={() => setFailed(true)}
                    className="w-full rounded-lg border border-stroke object-cover"
                />
            )}
        </div>
    )
}
