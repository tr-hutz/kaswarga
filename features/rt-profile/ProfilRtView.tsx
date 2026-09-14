'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Icon from '@/components/ui/Icon'
import CurrencyInput from '@/components/ui/CurrencyInput'
import { generateRtCode } from '@/lib/services/registration.service'
import ImageUpload from './components/ImageUpload'
import { useTranslations } from 'next-intl'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: '',
    monthlyFee: '', bankName: '', accountNumber: '',
    accountHolder: '', qrisUrl: '', logoUrl: ''
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="text-xs text-muted mb-1 block">{label}</label>
            {children}
        </div>
    )
}

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h2 className="text-xs font-semibold text-subtle uppercase tracking-wide pt-2">
            {children}
        </h2>
    )
}

interface RtProfileViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rt:      any
    loading: boolean
    saving:  boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave:  (form: any) => void
}

export default function RtProfileView({ rt, loading, saving, onSave }: RtProfileViewProps) {

    const [form,       setForm]       = useState(EMPTY)
    const [dirty,      setDirty]      = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {

        if (!rt) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
            name:          rt.name           || '',
            code:          rt.code           || '',
            address:       rt.address        || '',
            city:          rt.city           || '',
            province:      rt.province       || '',
            postalCode:    rt.postal_code    || '',
            monthlyFee:    rt.monthly_fee    ?? '',
            bankName:      rt.bank_name      || '',
            accountNumber: rt.account_number || '',
            accountHolder: rt.account_holder || '',
            qrisUrl:       rt.qris_url       || '',
            logoUrl:       rt.logo_url       || ''
        })

        setDirty(false)

    }, [rt])

    function set(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val }))
        setDirty(true)
    }

    async function handleGenerateCode() {
        setGenerating(true)
        try {
            const code = await generateRtCode()
            set('code', code)
        } catch (err) {
            console.error('[generateCode]', err)
        } finally {
            setGenerating(false)
        }
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onSave({ ...form, monthlyFee: Number(form.monthlyFee) || 0 })
        setDirty(false)
    }

    const t = useTranslations('rtProfile')

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-subtle">
                {t('loading')}
            </div>
        )
    }

    return (

        <div className="space-y-6 max-w-2xl">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-muted mt-0.5">
                    {t('subtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-divider p-6 space-y-4">

                <SectionTitle>{t('sections.identity')}</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <Field label={t('fields.name')}>
                            <input
                                required
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </Field>
                    </div>

                    <Field label={t('fields.code')}>
                        <div className="flex gap-2">
                            <input
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateCode}
                                disabled={generating}
                                title={t('generateCode')}
                                className="flex items-center gap-1 border border-divider rounded-lg px-3 py-2 text-xs text-muted hover:bg-canvas disabled:opacity-50 whitespace-nowrap"
                            >
                                <Icon name="refresh-cw" size={13} className={generating ? 'animate-spin' : ''} />
                                Generate
                            </button>
                        </div>
                    </Field>

                    <Field label={t('fields.monthlyFee')}>
                        <CurrencyInput
                            value={form.monthlyFee}
                            onChange={raw => set('monthlyFee', raw)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                </div>

                <SectionTitle>{t('sections.address')}</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <Field label={t('fields.address')}>
                            <input
                                value={form.address}
                                onChange={e => set('address', e.target.value)}
                                className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </Field>
                    </div>

                    <Field label={t('fields.city')}>
                        <input
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label={t('fields.province')}>
                        <input
                            value={form.province}
                            onChange={e => set('province', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label={t('fields.postalCode')}>
                        <input
                            value={form.postalCode}
                            onChange={e => set('postalCode', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                </div>

                <SectionTitle>{t('sections.bank')}</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <Field label={t('fields.bankName')}>
                        <input
                            value={form.bankName}
                            onChange={e => set('bankName', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label={t('fields.accountNumber')}>
                        <input
                            value={form.accountNumber}
                            onChange={e => set('accountNumber', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <div className="col-span-2">
                        <Field label={t('fields.accountHolder')}>
                            <input
                                value={form.accountHolder}
                                onChange={e => set('accountHolder', e.target.value)}
                                className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </Field>
                    </div>

                </div>

                <SectionTitle>{t('sections.media')}</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <ImageUpload
                        label={t('fields.logo')}
                        currentUrl={form.logoUrl}
                        storagePath={`${rt?.id}/logo`}
                        onUploaded={url => set('logoUrl', url)}
                    />

                    <ImageUpload
                        label={t('fields.qris')}
                        currentUrl={form.qrisUrl}
                        storagePath={`${rt?.id}/qris`}
                        onUploaded={url => set('qrisUrl', url)}
                    />

                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving || !dirty}
                        className="bg-primary text-white rounded-lg px-6 py-2.5 text-sm disabled:opacity-40"
                    >
                        {saving ? t('saving') : t('save')}
                    </button>
                </div>

            </form>

        </div>
    )
}
