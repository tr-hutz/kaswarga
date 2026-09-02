'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useTranslations }     from 'next-intl'
import { useActiveCampaigns }  from '@/features/income/hooks/useActiveCampaigns'
import CampaignCard            from './CampaignCard'
import IncomeForm              from '@/features/income/components/forms/IncomeForm'
import Icon                    from '@/components/ui/Icon'
import { useToast }            from '@/components/ui/ToastProvider'

interface Props {
    storageKey?: string
}

export default function ActiveCampaignsSection({ storageKey = 'active-campaigns-banner' }: Props) {
    const t = useTranslations('income.campaigns.card')
    const { toast } = (useToast() as any)

    const { campaigns, loading, reload } = useActiveCampaigns()
    const [formOpen,        setFormOpen]        = useState(false)
    const [preFillCampaign, setPreFillCampaign] = useState<any>(null)

    // Collapsible state — independent per storageKey
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem(storageKey) === 'collapsed'
    })

    useEffect(() => {
        localStorage.setItem(storageKey, collapsed ? 'collapsed' : 'expanded')
    }, [collapsed, storageKey])

    function handleDonate(campaign: any) {
        setPreFillCampaign(campaign)
        setFormOpen(true)
    }

    if (!loading && campaigns.length === 0) return null

    return (
        <div data-testid="campaigns-banner" className="rounded-xl border border-divider bg-surface shadow-card overflow-hidden">

            {/* Banner header */}
            <button
                type="button"
                data-testid="campaigns-banner-toggle"
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon name="megaphone" size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t('sectionTitle')}</span>
                    {campaigns.length > 0 && (
                        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {campaigns.length}
                        </span>
                    )}
                </div>
                <Icon
                    name="chevron-down"
                    size={16}
                    className={`text-muted transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
                />
            </button>

            {/* Cards — animated collapse */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    <div data-testid="campaigns-banner-content" className="px-4 pb-4 pt-1">
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-divider border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {campaigns.map((c: any) => (
                                    <CampaignCard
                                        key={c.id}
                                        campaign={c}
                                        onDonate={handleDonate}
                                        onRefresh={reload}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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
                        toast({ message: 'Donasi berhasil dicatat. Terima kasih!', type: 'success' })
                        reload()
                    }}
                    preFillCampaignId={preFillCampaign?.id ?? ''}
                    preFillCampaignName={preFillCampaign?.name ?? ''}
                    preFillCategory="DONATION"
                />
            )}
        </div>
    )
}
