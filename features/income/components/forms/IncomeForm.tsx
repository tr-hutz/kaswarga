'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import type { FormEvent }      from 'react'
import { useTranslations }     from 'next-intl'
import { useAuth }             from '@/lib/auth/useAuth'
import { supabase }            from '@/lib/supabase'
import { findResidents }       from '@/lib/repositories/resident.repository'
import Icon                    from '@/components/ui/Icon'

const CATEGORIES = [
    'DONATION', 'GOVERNMENT', 'EVENT', 'BAZAAR',
    'RENTAL', 'SALES', 'INTEREST', 'OTHER',
] as const

const SOURCE_TYPES = [
    'RESIDENT', 'NON_RESIDENT', 'ORGANIZATION', 'GOVERNMENT', 'ANONYMOUS',
] as const

const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'QRIS'] as const

// Normalize legacy free-text values saved before the dropdown was introduced
const PAYMENT_METHOD_LEGACY: Record<string, string> = {
    tunai:    'CASH',
    cash:     'CASH',
    transfer: 'TRANSFER',
    qris:     'QRIS',
}

function normalizePaymentMethod(value: string | null | undefined): string {
    if (!value) return ''
    if (['CASH', 'TRANSFER', 'QRIS'].includes(value)) return value
    return PAYMENT_METHOD_LEGACY[value.toLowerCase()] ?? ''
}

interface IncomeFormProps {
    open:         boolean
    onClose:      () => void
    onSubmit:     (form: any) => Promise<void>
    initialData?: any
}

function emptyForm() {
    return {
        income_name:      '',
        income_category:  '',
        source_type:      'ANONYMOUS',
        resident_id:      '',
        payer_name:       '',
        is_anonymous:     false,
        payment_method:   '',
        reference_number: '',
        amount:           '',
        received_at:      new Date().toISOString().slice(0, 10),
        notes:            '',
        attachment_url:   '',
    }
}

export default function IncomeForm({ open, onClose, onSubmit, initialData = null }: IncomeFormProps) {
    const t  = useTranslations('income')
    const tc = useTranslations('common')

    const { membership } = useAuth()
    const rtId = (membership as any)?.rt?.id as string | undefined

    const [residents,       setResidents]       = useState<Array<{ id: string; name: string }>>([])
    const [form,            setForm]            = useState(emptyForm)
    const [saving,          setSaving]          = useState(false)
    const [attachmentFile,  setAttachmentFile]  = useState<File | null>(null)

    // Reset form and attachment each time the form opens
    useEffect(() => {
        if (open) {
            const base = initialData ? { ...emptyForm(), ...initialData } : emptyForm()
            base.payment_method = normalizePaymentMethod(base.payment_method)
            setForm(base)
            setAttachmentFile(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (!rtId) return
        findResidents({ rtId, status: 'active' })
            .then(rows => setResidents(rows.map(r => ({ id: r.id, name: r.name }))))
            .catch(() => {})
    }, [rtId])

    if (!open) return null

    function set(field: string, value: unknown) {
        setForm((prev: any) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload: any = {
                income_name:      form.income_name,
                income_category:  form.income_category,
                source_type:      form.source_type,
                is_anonymous:     form.source_type === 'ANONYMOUS',
                payment_method:   form.payment_method   || null,
                reference_number: form.reference_number || null,
                amount:           Number(form.amount),
                received_at:      form.received_at,
                notes:            form.notes            || null,
                attachment_url:   form.attachment_url   || null,
            }

            if (form.source_type === 'RESIDENT') {
                payload.resident_id = form.resident_id || null
                payload.payer_name  = null
            } else if (form.source_type !== 'ANONYMOUS') {
                payload.payer_name  = form.payer_name || null
                payload.resident_id = null
            } else {
                payload.payer_name  = null
                payload.resident_id = null
            }

            if (attachmentFile && rtId) {
                const ext  = attachmentFile.name.split('.').pop()
                const path = `${rtId}/${Date.now()}.${ext}`
                const { data: upload, error: uploadErr } = await supabase.storage
                    .from('income-attachments')
                    .upload(path, attachmentFile, { upsert: false })
                if (uploadErr) throw uploadErr
                payload.attachment_url = upload.path
            }

            await onSubmit(payload)
        } finally {
            setSaving(false)
        }
    }

    const isResident  = form.source_type === 'RESIDENT'
    const isAnonymous = form.source_type === 'ANONYMOUS'

    const inputCls = 'w-full border border-divider rounded-lg px-3 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30'

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-xl shadow-default w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-divider flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">
                        {initialData ? t('form.editTitle') : t('form.addTitle')}
                    </h2>
                    <button onClick={onClose} className="text-subtle hover:text-foreground">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Income Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.incomeName')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.income_name}
                            onChange={e => set('income_name', e.target.value)}
                            placeholder={t('form.incomeNamePlaceholder')}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.category')} <span className="text-danger">*</span>
                        </label>
                        <select
                            value={form.income_category}
                            onChange={e => set('income_category', e.target.value)}
                            required
                            className={inputCls}
                        >
                            <option value="">{t('form.selectCategory')}</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>
                                    {t(`categories.${c}` as Parameters<typeof t>[0])}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source Type */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.sourceType')} <span className="text-danger">*</span>
                        </label>
                        <select
                            value={form.source_type}
                            onChange={e => set('source_type', e.target.value)}
                            required
                            className={inputCls}
                        >
                            {SOURCE_TYPES.map(s => (
                                <option key={s} value={s}>
                                    {t(`sourceTypes.${s}` as Parameters<typeof t>[0])}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Resident selector OR Payer name */}
                    {isResident ? (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t('form.resident')} <span className="text-danger">*</span>
                            </label>
                            <select
                                value={form.resident_id}
                                onChange={e => set('resident_id', e.target.value)}
                                required={isResident}
                                className={inputCls}
                            >
                                <option value="">{t('form.selectResident')}</option>
                                {residents.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : !isAnonymous ? (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t('form.payerName')}
                            </label>
                            <input
                                type="text"
                                value={form.payer_name}
                                onChange={e => set('payer_name', e.target.value)}
                                placeholder={t('form.payerNamePlaceholder')}
                                className={inputCls}
                            />
                        </div>
                    ) : null}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.amount')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={form.amount}
                            onChange={e => set('amount', e.target.value)}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Received At */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.receivedAt')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.received_at}
                            onChange={e => set('received_at', e.target.value)}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.paymentMethod')}
                        </label>
                        <select
                            value={form.payment_method}
                            onChange={e => set('payment_method', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">{t('form.selectPaymentMethod')}</option>
                            {PAYMENT_METHODS.map(m => (
                                <option key={m} value={m}>
                                    {t(`paymentMethods.${m}` as Parameters<typeof t>[0])}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reference Number */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.referenceNumber')}
                        </label>
                        <input
                            type="text"
                            value={form.reference_number}
                            onChange={e => set('reference_number', e.target.value)}
                            placeholder={t('form.referenceNumberPlaceholder')}
                            className={inputCls}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.notes')}
                        </label>
                        <textarea
                            value={form.notes ?? ''}
                            onChange={e => set('notes', e.target.value)}
                            placeholder={t('form.notesPlaceholder')}
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.attachment')}
                            <span className="text-muted text-xs ml-1">({tc('optional')})</span>
                        </label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={e => setAttachmentFile(e.target.files?.[0] ?? null)}
                            className={inputCls}
                        />
                        {form.attachment_url && !attachmentFile && (
                            <a
                                href={form.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline mt-1 inline-block"
                            >
                                {t('form.viewAttachment')}
                            </a>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-divider rounded-lg px-4 py-2.5 text-sm"
                        >
                            {t('form.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Icon name="loader2" size={14} className="animate-spin" />}
                            {t('form.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
