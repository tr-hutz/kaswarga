'use client'

import { useState }   from 'react'
import type { FormEvent } from 'react'
import Icon from '@/components/ui/Icon'
import Link           from 'next/link'
import { useTranslations } from 'next-intl'

interface ResidentRegistrationViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form:       any
    set:        (k: string, v: string) => void
    submitting: boolean
    error:      string
    success:    boolean
    onSubmit:   (e: FormEvent<HTMLFormElement>) => void
}

export default function ResidentRegistrationView({
    form, set, submitting, error, success, onSubmit
}: ResidentRegistrationViewProps) {
    const t = useTranslations('registration.resident')
    const [extraOpen, setExtraOpen] = useState(false)

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-body px-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-card border border-stroke p-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success">
                        <Icon name="check-circle" size={32} />
                    </div>
                    <h1 className="text-xl font-bold">{t('success.title')}</h1>
                    <p className="text-sm text-dark-5">
                        {t('success.message', { email: form.email })}
                    </p>
                    <Link
                        href="/login"
                        className="inline-block mt-2 bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium"
                    >
                        {t('success.backToLogin')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-body px-4 py-10">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-md space-y-5"
            >
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-sm text-dark-5 mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-stroke p-6 space-y-4">

                    <div>
                        <label className="text-xs text-dark-5 mb-1 block">{t('fields.fullName')} <span className="text-danger">*</span></label>
                        <input
                            required
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="Nama sesuai KTP"
                            className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-dark-5 mb-1 block">{t('fields.email')} <span className="text-danger">*</span></label>
                        <input
                            required
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-dark-5 mb-1 block">{t('fields.rtCode')} <span className="text-danger">*</span></label>
                        <input
                            required
                            value={form.rtCode}
                            onChange={e => set('rtCode', e.target.value.toUpperCase())}
                            placeholder="RT-0001"
                            className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <p className="text-xs text-dark-6 mt-1">{t('fields.rtCodeNote')}</p>
                    </div>

                    {/* Extra fields (collapsible) */}
                    <div className="border border-stroke rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExtraOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-dark-5"
                        >
                            {t('fields.extra')}
                            {extraOpen ? <Icon name="chevron-up" size={14} /> : <Icon name="chevron-down" size={14} />}
                        </button>

                        {extraOpen && (
                            <div className="px-4 pb-4 space-y-3 border-t border-stroke">
                                <div className="mt-3">
                                    <label className="text-xs text-dark-5 mb-1 block">{t('fields.block')}</label>
                                    <input
                                        value={form.block}
                                        onChange={e => set('block', e.target.value)}
                                        placeholder="Blok A / Jl. Kenanga"
                                        className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dark-5 mb-1 block">{t('fields.houseNumber')}</label>
                                    <input
                                        value={form.houseNumber}
                                        onChange={e => set('houseNumber', e.target.value)}
                                        placeholder="12"
                                        className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dark-5 mb-1 block">{t('fields.phone')}</label>
                                    <input
                                        value={form.phone}
                                        onChange={e => set('phone', e.target.value)}
                                        placeholder="08123456789"
                                        className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {error && (
                    <div className="bg-danger/5 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <Link href="/register" className="text-sm text-dark-5 hover:underline">
                        {t('back')}
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-primary text-white rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                        {submitting ? t('submitting') : t('submit')}
                    </button>
                </div>

            </form>
        </div>
    )
}
