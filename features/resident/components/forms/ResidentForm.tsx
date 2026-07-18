'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createResident, updateResident } from '@/lib/services/resident.service'
import { useTranslations } from 'next-intl'

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

    const t = useTranslations('residents')
    const tc = useTranslations('common')

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
            onSuccess()
        } catch (err) {
            console.error(err)
            setSaveError(t('form.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4"
            >
                <h2 className="text-lg font-semibold">
                    {isEdit ? t('form.editTitle') : t('form.addTitle')}
                </h2>

                <div className="grid grid-cols-2 gap-3">

                    <div className="col-span-2">
                        <label className="text-xs text-dark-5 mb-1 block">{t('form.fullName')}</label>
                        <input
                            required
                            placeholder={t('form.fullNamePlaceholder')}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-dark-5 mb-1 block">{t('form.block')}</label>
                        <input
                            placeholder={t('form.blockPlaceholder')}
                            value={form.block}
                            onChange={e => set('block', e.target.value)}
                            className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-dark-5 mb-1 block">{t('form.houseNumber')}</label>
                        <input
                            placeholder={t('form.houseNumberPlaceholder')}
                            value={form.houseNumber}
                            onChange={e => set('houseNumber', e.target.value)}
                            className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-dark-5 mb-1 block">{t('form.phone')}</label>
                        <input
                            placeholder={t('form.phonePlaceholder')}
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="w-full border rounded-lg px-4 py-2.5 text-sm"
                        />
                    </div>

                </div>

                {saveError && (
                    <p className="text-danger text-sm">{saveError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border rounded-lg px-4 py-2 text-sm hover:bg-body transition-colors"
                    >
                        {tc('actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 transition-colors"
                    >
                        {saving ? tc('states.saving') : tc('actions.save')}
                    </button>
                </div>
            </form>
        </div>
    )
}
