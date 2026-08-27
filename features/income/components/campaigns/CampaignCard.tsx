'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTranslations } from 'next-intl'
import { formatRupiah }    from '@/lib/utils'
import CampaignProgressBar from '@/components/common/CampaignProgressBar'
import Icon                from '@/components/ui/Icon'

interface Props {
    campaign:   any
    onDonate:   (campaign: any) => void
    onRefresh?: () => void
}

export default function CampaignCard({ campaign, onDonate, onRefresh }: Props) {
    const t = useTranslations('income.campaigns.card')

    return (
        <div className="bg-surface border border-divider rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground leading-tight">{campaign.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                    {campaign.ends_at ? (
                        <span className="text-xs text-muted">
                            {t('deadline', { date: new Date(campaign.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) })}
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

            <CampaignProgressBar
                approved={campaign.approved_amount ?? 0}
                pending={campaign.pending_amount ?? 0}
                target={campaign.target_amount ?? null}
            />

            {campaign.target_amount && (
                <div className="flex justify-between text-xs text-muted">
                    <span>Target</span>
                    <span>{formatRupiah(campaign.target_amount)}</span>
                </div>
            )}

            <button
                onClick={() => onDonate(campaign)}
                className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg py-2 transition-colors"
            >
                {t('donateButton')}
            </button>
        </div>
    )
}
