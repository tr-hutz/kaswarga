'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '@/components/ui/Icon'
import CurrencyInput from '@/components/ui/CurrencyInput'

import FileUpload from '@/components/ui/FileUpload'
import { useAuth } from '@/lib/auth/useAuth'
import { generateNomorBukti } from '@/lib/services/expense.service'
import { useExpenseCategories } from '../../hooks/useExpenseCategory'
import { useTranslations } from 'next-intl'
import { useKeyDown } from '@/lib/hooks/useKeyDown'

interface ExpenseFormProps {
    open:         boolean
    onClose:      () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit:     (form: any) => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any
}

export default function ExpenseForm({
    open,
    onClose,
    onSubmit,
    initialData = null,
}: ExpenseFormProps) {

    const { membership } = useAuth()
    const rtId = membership?.rt?.id
    const { categories } = useExpenseCategories()

    const [form, setForm] = useState(() => initialData ? {
        receiptNumber: initialData.receiptNumber || '',
        category:      initialData.category      || '',
        amount:        initialData.amount        || '',
        date:          initialData.date          || '',
        recipient:     initialData.recipient     || '',
        description:   initialData.description   || '',
        receiptUrl:    initialData.receiptUrl    || '',
    } : {
        receiptNumber: '',
        category:      '',
        amount:        '',
        date:          '',
        recipient:     '',
        description:   '',
        receiptUrl:    '',
    })

    const [saving,     setSaving]     = useState(false)
    const [generating, setGenerating] = useState(false)

    const t = useTranslations('expenses')
    const tc = useTranslations('common')

    useKeyDown(open, { Escape: onClose })

    if (!open) return null

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleGenerate() {
        setGenerating(true)
        try {
            const nomor = await generateNomorBukti()
            set('receiptNumber', nomor)
        } catch {
            // silently fail — user can type manually
        } finally {
            setGenerating(false)
        }
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

    const storagePath = rtId ? `expenses/${rtId}` : 'expenses/general'

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

            <form
                onSubmit={handleSubmit}
                className="bg-surface rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-default"
            >

                <h2 className="text-xl font-semibold text-foreground">
                    {initialData ? t('form.editTitle') : t('form.addTitle')}
                </h2>

                {/* Nomor Bukti */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block">
                        {t('form.receiptNumber')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={form.receiptNumber}
                            onChange={e => set('receiptNumber', e.target.value)}
                            placeholder={t('form.receiptNumberPlaceholder')}
                            className="flex-1 border border-divider rounded-lg px-4 py-2 text-sm font-mono bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            title={t('form.receiptNumberGenerate')}
                            className="
                                h-10 w-10 shrink-0 rounded-lg border border-divider
                                flex items-center justify-center
                                hover:bg-canvas transition
                                disabled:opacity-50
                            "
                        >
                            {generating
                                ? <Icon name="loader2" size={15} className="animate-spin text-muted" />
                                : <Icon name="refresh-cw" size={15} className="text-muted" />
                            }
                        </button>
                    </div>
                </div>

                {/* Tanggal + Kategori */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block">
                            {t('form.date')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={form.date}
                            onChange={e => set('date', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block">
                            {t('form.category')}
                        </label>
                        <select
                            value={form.category}
                            onChange={e => set('category', e.target.value)}
                            className="w-full border border-divider rounded-lg px-4 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">{t('form.selectCategory')}</option>
                            {categories.map(k => (
                                <option key={k.id} value={k.name}>{k.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Nominal */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block">
                        {t('form.amount')} <span className="text-danger">*</span>
                    </label>
                    <CurrencyInput
                        required
                        value={form.amount}
                        onChange={raw => set('amount', raw)}
                        placeholder="0"
                        className="w-full border border-divider rounded-lg px-4 py-2 text-sm"
                    />
                </div>

                {/* Penerima */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block">
                        {t('form.recipient')}
                    </label>
                    <input
                        value={form.recipient}
                        onChange={e => set('recipient', e.target.value)}
                        placeholder={t('form.recipientPlaceholder')}
                        className="w-full border border-divider rounded-lg px-4 py-2 text-sm"
                    />
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block">
                        {t('form.description')}
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder={t('form.descriptionPlaceholder')}
                        rows={3}
                        className="w-full border border-divider rounded-lg px-4 py-2 text-sm resize-none bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                {/* Nota Upload */}
                <FileUpload
                    label={t('form.receipt')}
                    currentUrl={form.receiptUrl}
                    pathPrefix={storagePath}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onUploaded={url => set('receiptUrl', url)}
                />

                <div className="flex justify-end gap-3 pt-2">

                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-divider rounded-lg px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                        {tc('actions.cancel')}
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {saving && <Icon name="loader2" size={14} className="animate-spin" />}
                        {tc('actions.save')}
                    </button>

                </div>

            </form>

        </div>
    )
}