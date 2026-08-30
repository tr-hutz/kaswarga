'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useKeyDown } from '@/lib/hooks/useKeyDown'
import Icon from '@/components/ui/Icon'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: ''
}

interface RtFormProps {
    open:     boolean
    onClose:  () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rt:       any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (form: typeof EMPTY) => Promise<any>
}

export default function RtForm({ open, onClose, rt, onSubmit }: RtFormProps) {

    const isEdit = !!rt

    const [form,    setForm]    = useState(EMPTY)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!rt) { setForm(EMPTY); return }

        setForm({
            name:      rt.name      || '',
            code:      rt.code      || '',
            address:   rt.address   || '',
            city:      rt.city      || '',
            province:  rt.province  || '',
            postalCode: rt.postal_code || ''
        })

    }, [rt])

    function set(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val }))
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            await onSubmit(form)
        } finally {
            setSaving(false)
        }
    }

    const t = useTranslations('rt')
    const tc = useTranslations('common')

    useKeyDown(open, { Escape: onClose })

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-surface rounded-xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-xl font-semibold text-foreground">
                    {isEdit ? t('form.editTitle') : t('form.addTitle')}
                </h2>

                <div className="grid grid-cols-2 gap-3">

                    <div className="col-span-2">
                        <label className="text-xs text-muted mb-1 block">{t('form.name')}</label>
                        <input
                            required
                            placeholder={t('form.namePlaceholder')}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.code')}</label>
                        <input
                            placeholder={t('form.codePlaceholder')}
                            value={form.code}
                            onChange={e => set('code', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.postalCode')}</label>
                        <input
                            placeholder={t('form.postalCodePlaceholder')}
                            value={form.postalCode}
                            onChange={e => set('postalCode', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-muted mb-1 block">{t('form.address')}</label>
                        <input
                            placeholder={t('form.addressPlaceholder')}
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.city')}</label>
                        <input
                            placeholder={t('form.cityPlaceholder')}
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.province')}</label>
                        <input
                            placeholder={t('form.provincePlaceholder')}
                            value={form.province}
                            onChange={e => set('province', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 border border-divider rounded-lg px-4 py-2.5 text-sm hover:bg-canvas transition-colors"
                    >
                        {tc('actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving && <Icon name="loader2" size={14} className="animate-spin" />}
                        {tc('actions.save')}
                    </button>
                </div>
            </form>
        </div>
    )
}