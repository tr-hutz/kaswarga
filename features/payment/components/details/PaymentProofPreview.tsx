'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

function NoBukti({ label }: { label: string }) {
    return (
        <div className="w-full rounded-lg border border-dashed border-divider bg-canvas flex flex-col items-center justify-center gap-2 py-12 text-subtle">
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

    // Synthetic marker written by the import engine — not a real storage URL.
    const isImportMarker = url.includes('-import-confirm-payment.xlsx')
    const isStorageUrl   = url.startsWith('http://') || url.startsWith('https://')
    const isImportFile   = !isStorageUrl && /\.(xlsx|csv)$/i.test(url)

    return (
        <div>
            <h3 className="text-sm font-semibold mb-3">
                {t('detail.proofTitle')}
            </h3>
            {isImportMarker || isImportFile ? (
                <div className="rounded-lg border border-divider bg-canvas p-4 text-sm text-muted flex items-center gap-2">
                    <Icon name="file-text" size={16} />
                    <span>{t('detail.proofImportFile')}</span>
                </div>
            ) : failed ? (
                <NoBukti label={t('detail.proofError')} />
            ) : (
                <img
                    src={url}
                    alt={t('detail.proofTitle')}
                    onError={() => setFailed(true)}
                    className="w-full rounded-lg border border-divider object-cover"
                />
            )}
        </div>
    )
}
