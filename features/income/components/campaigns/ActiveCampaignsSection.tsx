'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }          from 'react'
import { useTranslations }   from 'next-intl'
import { useActiveCampaigns } from '../../hooks/useActiveCampaigns'
import CampaignCard          from './CampaignCard'
import IncomeForm            from '../forms/IncomeForm'

export default function ActiveCampaignsSection() {
    const t = useTranslations('income.campaigns.card')

    const { campaigns, loading } = useActiveCampaigns()
    const [formOpen,       setFormOpen]       = useState(false)
    const [preFillCampaign, setPreFillCampaign] = useState<any>(null)

    function handleDonate(campaign: any) {
        setPreFillCampaign(campaign)
        setFormOpen(true)
    }

    if (loading || campaigns.length === 0) return null

    return (
        <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">{t('sectionTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((c: any) => (
                    <CampaignCard key={c.id} campaign={c} onDonate={handleDonate} />
                ))}
            </div>

            {formOpen && (
                <IncomeForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={async (payload) => {
                        const res = await fetch(`/api/income/campaigns/${preFillCampaign?.id}/donate`, {
                            method:  'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body:    JSON.stringify(payload),
                        })
                        if (!res.ok) {
                            const data = await res.json().catch(() => ({}))
                            throw new Error(data?.error ?? 'Failed')
                        }
                    }}
                    preFillCampaignId={preFillCampaign?.id ?? ''}
                    preFillCampaignName={preFillCampaign?.name ?? ''}
                    preFillCategory="DONATION"
                />
            )}
        </div>
    )
}
