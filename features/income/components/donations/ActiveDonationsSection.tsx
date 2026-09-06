'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useTranslations }     from 'next-intl'
import { useActiveDonations }  from '@/features/income/hooks/useActiveDonations'
import DonationCard            from './DonationCard'
import IncomeForm              from '@/features/income/components/forms/IncomeForm'
import Icon                    from '@/components/ui/Icon'
import { useToast }            from '@/components/ui/ToastProvider'

interface Props {
    storageKey?: string
}

export default function ActiveDonationsSection({ storageKey = 'active-donations-banner' }: Props) {
    const t = useTranslations('income.donations.card')
    const { toast } = (useToast() as any)

    const { donations, loading, reload } = useActiveDonations()
    const [formOpen,        setFormOpen]        = useState(false)
    const [preFillDonation, setPreFillDonation] = useState<any>(null)

    // Collapsible state — independent per storageKey
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false
        return localStorage.getItem(storageKey) === 'collapsed'
    })

    useEffect(() => {
        localStorage.setItem(storageKey, collapsed ? 'collapsed' : 'expanded')
    }, [collapsed, storageKey])

    function handleDonate(donation: any) {
        setPreFillDonation(donation)
        setFormOpen(true)
    }

    if (!loading && donations.length === 0) return null

    return (
        <div data-testid="donations-banner" className="rounded-xl border border-divider bg-surface shadow-card overflow-hidden">

            {/* Banner header */}
            <button
                type="button"
                data-testid="donations-banner-toggle"
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon name="megaphone" size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t('sectionTitle')}</span>
                    {donations.length > 0 && (
                        <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {donations.length}
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
                <div data-testid="donations-banner-content" className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1">
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-divider border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {donations.map((d: any) => (
                                    <DonationCard
                                        key={d.id}
                                        donation={d}
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
                        const res = await fetch(`/api/income/donations/${preFillDonation?.id}/donate`, {
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
                    preFillDonationId={preFillDonation?.id ?? ''}
                    preFillDonationName={preFillDonation?.name ?? ''}
                    preFillCategory="DONATION"
                />
            )}
        </div>
    )
}
