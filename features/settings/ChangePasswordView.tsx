'use client'

import { useState }   from 'react'
import type { FormEvent } from 'react'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

interface PasswordFieldProps {
    label:       string
    value:       string
    onChange:    (v: string) => void
    placeholder: string
}

function PasswordField({ label, value, onChange, placeholder }: PasswordFieldProps) {

    const [show, setShow] = useState(false)

    return (
        <div>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <div className="relative">
                <input
                    required
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                >
                    {show ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
                </button>
            </div>
        </div>
    )
}

interface ChangePasswordViewProps {
    form:     { next: string; confirm: string }
    set:      (k: string, v: string) => void
    saving:   boolean
    error:    string
    onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export default function ChangePasswordView({ form, set, saving, error, onSubmit }: ChangePasswordViewProps) {

    const t = useTranslations('settings')

    return (

        <div className="space-y-6 max-w-md">

            <div>
                <h1 className="text-xl font-semibold">{t('title')}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t('subtitle')}
                </p>
            </div>

            <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
            >

                <PasswordField
                    label={t('newPassword')}
                    value={form.next}
                    onChange={val => set('next', val)}
                    placeholder={t('newPasswordPlaceholder')}
                />

                <PasswordField
                    label={t('confirmPassword')}
                    value={form.confirm}
                    onChange={val => set('confirm', val)}
                    placeholder={t('confirmPasswordPlaceholder')}
                />

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={saving || !form.next || !form.confirm}
                        className="bg-black text-white rounded-xl px-6 py-2.5 text-sm disabled:opacity-40"
                    >
                        {saving ? t('saving') : t('save')}
                    </button>
                </div>

            </form>

        </div>
    )
}
