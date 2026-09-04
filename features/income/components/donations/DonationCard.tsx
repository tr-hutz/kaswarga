'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTranslations } from 'next-intl'
import { formatRupiah }    from '@/lib/utils'
import DonationProgressBar from '@/components/common/DonationProgressBar'
import Icon                from '@/components/ui/Icon'

interface Props {
    donation:   any
    onDonate:   (donation: any) => void
    onRefresh?: () => void
}

export default function DonationCard({ donation, onDonate, onRefresh }: Props) {
    const t = useTranslations('income.donations.card')

    return (
        <div data-testid="donation-card" className="bg-surface border border-divider rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground leading-tight">{donation.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                    {donation.ends_at ? (
                        <span className="text-xs text-muted">
                            {t('deadline', { date: new Date(donation.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) })}
                        </span>
                    ) : (
                        <span className="text-xs text-muted">{t('noDeadline')}</span>
                    )}
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="text-subtle hover:text-primary transition-colors"
                            aria-label="Muat ulang"
                        >
                            <Icon name="refresh-cw" size={13} />
                        </button>
                    )}
                </div>
            </div>

            <DonationProgressBar
                approved={donation.approved_amount ?? 0}
                pending={donation.pending_amount ?? 0}
                target={donation.target_amount ?? null}
            />

            {donation.target_amount && (
                <div className="flex justify-between text-xs text-muted">
                    <span>Target</span>
                    <span>{formatRupiah(donation.target_amount)}</span>
                </div>
            )}

            <button
                data-testid="donation-donate-btn"
                onClick={() => onDonate(donation)}
                className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg py-2 transition-colors"
            >
                {t('donateButton')}
            </button>
        </div>
    )
}
