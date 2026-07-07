// @ts-nocheck
'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

function NoBukti({ label }: { label: string }) {
    return (
        <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
            <ImageOff className="w-10 h-10" />
            <span className="text-sm">{label}</span>
        </div>
    )
}

export default function PaymentProofPreview({ url }) {
    const t = useTranslations('pembayaran')
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
                    className="w-full rounded-2xl border object-cover"
                />
            )}
        </div>
    )
}
