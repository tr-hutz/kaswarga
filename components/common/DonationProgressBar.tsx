'use client'

import { useTranslations } from 'next-intl'
import { formatRupiah }    from '@/lib/utils'

interface Props {
    approved: number
    pending:  number
    target:   number | null
}

export default function DonationProgressBar({ approved, pending, target }: Props) {
    const t = useTranslations('income.donations.progress')

    if (target == null) {
        return (
            <div className="space-y-1 text-sm">
                <div className="flex justify-between text-foreground">
                    <span>{t('approvedLabel')}</span>
                    <span className="font-medium">{formatRupiah(approved)}</span>
                </div>
                {pending > 0 && (
                    <div className="flex justify-between text-muted text-xs">
                        <span>{t('pendingLabel')}</span>
                        <span>{formatRupiah(pending)}</span>
                    </div>
                )}
            </div>
        )
    }

    const approvedPct = Math.min(100, target > 0 ? Math.round((approved / target) * 100) : 0)
    const pendingPct  = Math.min(100 - approvedPct, target > 0 ? Math.round((pending  / target) * 100) : 0)
    const remaining   = Math.max(0, target - approved)
    const isComplete  = approved >= target

    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between text-foreground">
                <span>{t('approvedLabel')}</span>
                <span className="font-medium">
                    {formatRupiah(approved)}
                    <span className="text-muted ml-1 text-xs">({approvedPct}%)</span>
                </span>
            </div>

            {/* Stacked progress bar */}
            <div className="h-2 rounded-full bg-canvas overflow-hidden flex">
                <div
                    className={`h-full transition-all ${isComplete ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${approvedPct}%` }}
                />
                <div
                    className="h-full bg-primary/30 transition-all"
                    style={{ width: `${pendingPct}%` }}
                />
            </div>

            {pending > 0 && (
                <div className="flex justify-between text-muted text-xs">
                    <span>{t('pendingLabel')}</span>
                    <span>{formatRupiah(pending)}</span>
                </div>
            )}

            {!isComplete && (
                <div className="flex justify-between text-xs text-subtle">
                    <span>Sisa</span>
                    <span>{formatRupiah(remaining)}</span>
                </div>
            )}
        </div>
    )
}
