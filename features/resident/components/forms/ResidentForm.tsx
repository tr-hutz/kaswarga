'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createResident, updateResident } from '@/lib/services/resident.service'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/ToastProvider'
import { useKeyDown } from '@/lib/hooks/useKeyDown'
import Icon from '@/components/ui/Icon'

const EMPTY = { name: '', block: '', houseNumber: '', phone: '' }

interface ResidentFormProps {
    open:      boolean
    onClose:   () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resident:  any
    onSuccess: () => void
}

export default function ResidentForm({ open, onClose, resident, onSuccess }: ResidentFormProps) {

    const isEdit = !!resident

    const [form,      setForm]      = useState(EMPTY)
    const [saving,    setSaving]    = useState(false)
    const [saveError, setSaveError] = useState('')

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!resident) { setForm(EMPTY); return }
        setForm({
            name:        resident.name        || '',
            block:       resident.block       || '',
            houseNumber: resident.houseNumber || '',
            phone:       resident.phone       || ''
        })
    }, [resident])

    function set(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val }))
    }

    const t  = useTranslations('residents')
    const tc = useTranslations('common')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { toast } = useToast()

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setSaveError('')
        try {
            if (isEdit) {
                await updateResident(resident.id, form)
            } else {
                await createResident(form)
            }
            toast({ message: t('form.saveSuccess'), type: 'success' })
            onSuccess()
        } catch (err) {
            const msg = (err as Error).message
            if (msg === 'DUPLICATE_NAME')  setSaveError(t('form.duplicateName'))
            else if (msg === 'DUPLICATE_PHONE') setSaveError(t('form.duplicatePhone'))
            else setSaveError(t('form.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    useKeyDown(open, { Escape: onClose })

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-surface rounded-lg p-6 w-full max-w-lg space-y-4"
            >
                <h2 className="text-xl font-semibold text-foreground">
                    {isEdit ? t('form.editTitle') : t('form.addTitle')}
                </h2>

                <div className="grid grid-cols-2 gap-3">

                    <div className="col-span-2">
                        <label className="text-xs text-muted mb-1 block">{t('form.fullName')}</label>
                        <input
                            required
                            placeholder={t('form.fullNamePlaceholder')}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.block')}</label>
                        <input
                            placeholder={t('form.blockPlaceholder')}
                            value={form.block}
                            onChange={e => set('block', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted mb-1 block">{t('form.houseNumber')}</label>
                        <input
                            placeholder={t('form.houseNumberPlaceholder')}
                            value={form.houseNumber}
                            onChange={e => set('houseNumber', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-muted mb-1 block">{t('form.phone')}</label>
                        <input
                            placeholder={t('form.phonePlaceholder')}
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                </div>

                {saveError && (
                    <p className="text-danger text-sm">{saveError}</p>
                )}

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
