'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode, InputHTMLAttributes } from 'react'
import Icon from '@/components/ui/Icon'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
    return (
        <div>
            <label className="text-xs text-dark-5 mb-1 block">
                {label} {required && <span className="text-danger">*</span>}
            </label>
            {children}
        </div>
    )
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value:    string
    onChange: (v: string) => void
}

function Input({ value, onChange, type = 'text', ...props }: InputProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...props}
        />
    )
}

interface RtRegistrationViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form:           any
    set:            (k: string, v: string) => void
    generating:     boolean
    submitting:     boolean
    error:          string
    success:        boolean
    onGenerateCode: () => void
    onSubmit:       (e: FormEvent<HTMLFormElement>) => void
}

export default function RtRegistrationView({
    form, set, generating, submitting, error, success,
    onGenerateCode, onSubmit
}: RtRegistrationViewProps) {

    const t = useTranslations('registration.rt')
    const [bankOpen, setBankOpen] = useState(false)

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-body px-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-card border border-stroke p-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success">
                        <Icon name="check-circle" size={32} />
                    </div>
                    <h1 className="text-xl font-bold">{t('success.title')}</h1>
                    <p className="text-sm text-dark-5">
                        {t('success.message', { name: form.name })}
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
        <div className="min-h-screen bg-body py-10 px-4">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-2xl mx-auto space-y-6"
            >
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-sm text-dark-5 mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Identitas RT */}
                <div className="bg-white rounded-xl border border-stroke p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-dark uppercase tracking-wide">
                        {t('sections.identity')}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <Field label={t('fields.name')} required>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={v => set('name', v)}
                                    placeholder="RT 001 Perumahan Asri"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label={t('fields.code')} required>
                                <div className="flex gap-2">
                                    <Input
                                        required
                                        value={form.code}
                                        onChange={v => set('code', v.toUpperCase())}
                                        placeholder="RT-0001"
                                        className="w-full border border-stroke rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={onGenerateCode}
                                        disabled={generating}
                                        title={t('generate')}
                                        className="flex items-center gap-1 border border-stroke rounded-lg px-3 py-2 text-xs text-dark-5 hover:bg-body disabled:opacity-50 whitespace-nowrap"
                                    >
                                        <Icon name="refresh-cw" size={13} className={generating ? 'animate-spin' : ''} />
                                        Generate
                                    </button>
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-2">
                            <Field label={t('fields.address')}>
                                <Input
                                    value={form.address}
                                    onChange={v => set('address', v)}
                                    placeholder="Jl. Contoh No. 1"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label={t('fields.city')}>
                                <Input
                                    value={form.city}
                                    onChange={v => set('city', v)}
                                    placeholder="Jakarta"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label={t('fields.province')}>
                                <Input
                                    value={form.province}
                                    onChange={v => set('province', v)}
                                    placeholder="DKI Jakarta"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label={t('fields.postalCode')}>
                                <Input
                                    value={form.postalCode}
                                    onChange={v => set('postalCode', v)}
                                    placeholder="12345"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label={t('fields.monthlyFee')}>
                                <Input
                                    type="number"
                                    value={form.monthlyFee}
                                    onChange={v => set('monthlyFee', v)}
                                    placeholder="50000"
                                />
                            </Field>
                        </div>

                    </div>
                </div>

                {/* Rekening (collapsible) */}
                <div className="bg-white rounded-xl border border-stroke overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setBankOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-dark"
                    >
                        {t('sections.bank')}
                        {bankOpen ? <Icon name="chevron-up" size={16} /> : <Icon name="chevron-down" size={16} />}
                    </button>

                    {bankOpen && (
                        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                            <div>
                                <Field label={t('fields.bankName')}>
                                    <Input
                                        value={form.bankName}
                                        onChange={v => set('bankName', v)}
                                        placeholder="BCA"
                                    />
                                </Field>
                            </div>
                            <div>
                                <Field label={t('fields.accountNumber')}>
                                    <Input
                                        value={form.accountNumber}
                                        onChange={v => set('accountNumber', v)}
                                        placeholder="1234567890"
                                    />
                                </Field>
                            </div>
                            <div className="col-span-2">
                                <Field label={t('fields.accountHolder')}>
                                    <Input
                                        value={form.accountHolder}
                                        onChange={v => set('accountHolder', v)}
                                        placeholder="RT 001 Perumahan Asri"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}
                </div>

                {/* Akun Pengurus */}
                <div className="bg-white rounded-xl border border-stroke p-6 space-y-4">
                    <div>
                        <h2 className="font-semibold text-sm text-dark uppercase tracking-wide">
                            {t('sections.officers')}
                        </h2>
                        <p className="text-xs text-dark-5 mt-1">
                            {t('sections.officersNote')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t('fields.chairmanName')} required>
                            <Input
                                required
                                value={form.chairmanName}
                                onChange={v => set('chairmanName', v)}
                                placeholder="Budi Santoso"
                            />
                        </Field>
                        <Field label={t('fields.chairmanEmail')} required>
                            <Input
                                required
                                type="email"
                                value={form.chairmanEmail}
                                onChange={v => set('chairmanEmail', v)}
                                placeholder="ketua@example.com"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t('fields.adminName')} required>
                            <Input
                                required
                                value={form.adminName}
                                onChange={v => set('adminName', v)}
                                placeholder="Siti Rahayu"
                            />
                        </Field>
                        <Field label={t('fields.adminEmail')} required>
                            <Input
                                required
                                type="email"
                                value={form.adminEmail}
                                onChange={v => set('adminEmail', v)}
                                placeholder="admin@example.com"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label={t('fields.treasurerName')}>
                            <Input
                                value={form.treasurerName}
                                onChange={v => set('treasurerName', v)}
                                placeholder="Ahmad Fauzi (opsional)"
                            />
                        </Field>
                        <Field label={t('fields.treasurerEmail')}>
                            <Input
                                type="email"
                                value={form.treasurerEmail}
                                onChange={v => set('treasurerEmail', v)}
                                placeholder="bendahara@example.com (opsional)"
                            />
                        </Field>
                    </div>
                </div>

                {error && (
                    <div className="bg-danger/5 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between pb-4">
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
