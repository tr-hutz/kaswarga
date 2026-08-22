'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import type { FormEvent }      from 'react'
import { useTranslations }     from 'next-intl'
import Icon                    from '@/components/ui/Icon'

interface Props {
    open:        boolean
    onClose:     () => void
    onSubmit:    (payload: any) => Promise<void>
    initialData?: any
}

function emptyForm() {
    return {
        name:                     '',
        contribution_code_prefix: '',
        description:              '',
        target_amount:            '',
        starts_at:                new Date().toISOString().slice(0, 10),
        ends_at:                  '',
    }
}

export default function CampaignForm({ open, onClose, onSubmit, initialData = null }: Props) {
    const t = useTranslations('income.campaigns.form')

    const [form,    setForm]    = useState(emptyForm)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        if (open) {
            setForm(initialData ? { ...emptyForm(), ...initialData, target_amount: initialData.target_amount ?? '', ends_at: initialData.ends_at ?? '' } : emptyForm())
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    if (!open) return null

    function set(field: string, value: string) {
        setForm((prev: any) => ({ ...prev, [field]: value }))
    }

    const prefix       = form.contribution_code_prefix.toUpperCase().replace(/[^A-Z]/g, '')
    const year         = new Date().getFullYear().toString().slice(-2)
    const previewCode  = prefix ? `${prefix}${year}-1` : ''
    const isEdit       = Boolean(initialData?.id)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await onSubmit({
                name:                     form.name,
                contribution_code_prefix: prefix,
                description:              form.description || null,
                target_amount:            form.target_amount ? Number(form.target_amount) : null,
                starts_at:                form.starts_at,
                ends_at:                  form.ends_at || null,
            })
        } finally {
            setSaving(false)
        }
    }

    const inputCls = 'w-full border border-divider rounded-lg px-3 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30'

    return (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-default w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-divider flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isEdit ? t('editTitle') : t('createTitle')}
                    </h2>
                    <button onClick={onClose} className="text-subtle hover:text-foreground">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('name')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder={t('namePlaceholder')}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Contribution Code Prefix */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('codePrefix')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={prefix}
                            onChange={e => set('contribution_code_prefix', e.target.value)}
                            placeholder="RBR"
                            maxLength={4}
                            required
                            className={`${inputCls} uppercase font-mono`}
                        />
                        <p className="text-xs text-muted mt-1">{t('codePrefixHint')}</p>
                        {previewCode && (
                            <p className="text-xs text-primary mt-0.5">
                                {t('codePrefixPreview', { preview: previewCode })}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('description')}</label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder={t('descriptionPlaceholder')}
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Target amount */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('targetAmount')}</label>
                        <input
                            type="number"
                            min="0"
                            value={form.target_amount}
                            onChange={e => set('target_amount', e.target.value)}
                            placeholder={t('targetAmountPlaceholder')}
                            className={inputCls}
                        />
                    </div>

                    {/* Starts at */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('startsAt')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.starts_at}
                            onChange={e => set('starts_at', e.target.value)}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Ends at */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('endsAt')}</label>
                        <input
                            type="date"
                            value={form.ends_at}
                            onChange={e => set('ends_at', e.target.value)}
                            className={inputCls}
                        />
                        <p className="text-xs text-muted mt-1">{t('endsAtOptional')}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-divider rounded-lg px-4 py-2.5 text-sm">
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Icon name="loader2" size={14} className="animate-spin" />}
                            {t('submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
