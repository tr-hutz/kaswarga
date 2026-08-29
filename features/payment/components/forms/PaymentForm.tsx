'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import type { FormEvent }      from 'react'
import { useTranslations }     from 'next-intl'
import { useAuth }             from '@/lib/auth/useAuth'
import { findResidents }       from '@/lib/repositories/resident.repository'
import { MONTHS }              from '@/lib/constants/months'
import Icon                    from '@/components/ui/Icon'
import { useKeyDown }          from '@/lib/hooks/useKeyDown'

const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'QRIS'] as const

interface PaymentFormProps {
    open:    boolean
    onClose: () => void
    onSubmit: (payload: {
        residentId: string
        year:       number
        months:     number[]
        method:     string | null
        notes:      string | null
        date:       string
    }) => Promise<void>
}

function emptyForm() {
    return {
        residentId: '',
        year:       new Date().getFullYear(),
        months:     [] as number[],
        method:     '',
        notes:      '',
        date:       new Date().toISOString().slice(0, 10),
    }
}

export default function PaymentForm({ open, onClose, onSubmit }: PaymentFormProps) {
    const t  = useTranslations('payments')
    const tc = useTranslations('common')

    const { membership } = useAuth()
    const rtId       = (membership as any)?.rt?.id as string | undefined
    const monthlyFee = (membership as any)?.rt?.monthly_fee as number | undefined

    const [residents, setResidents] = useState<Array<{ id: string; name: string; block?: string; house_number?: string }>>([])
    const [form,      setForm]      = useState(emptyForm)
    const [saving,    setSaving]    = useState(false)

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm(emptyForm())
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => {
        if (!rtId) return
        findResidents({ rtId, status: 'active' })
            .then(rows => setResidents(rows.map(r => ({
                id:           r.id,
                name:         r.name,
                block:        r.block ?? undefined,
                house_number: r.house_number ?? undefined,
            }))))
            .catch(() => {})
    }, [rtId])

    useKeyDown(open, { Escape: onClose })

    if (!open) return null

    function set(field: string, value: unknown) {
        setForm((prev: any) => ({ ...prev, [field]: value }))
    }

    function toggleMonth(month: number) {
        setForm((prev: any) => {
            const months: number[] = prev.months.includes(month)
                ? prev.months.filter((m: number) => m !== month)
                : [...prev.months, month].sort((a, b) => a - b)
            return { ...prev, months }
        })
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (form.months.length === 0) return
        setSaving(true)
        try {
            await onSubmit({
                residentId: form.residentId,
                year:       Number(form.year),
                months:     form.months,
                method:     form.method || null,
                notes:      form.notes  || null,
                date:       form.date,
            })
        } finally {
            setSaving(false)
        }
    }

    const inputCls    = 'w-full border border-divider rounded-lg px-3 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30'
    const readonlyCls = 'w-full border border-divider rounded-lg px-3 py-2 text-sm bg-muted/30 text-foreground cursor-not-allowed'
    const total       = form.months.length * (monthlyFee ?? 0)

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-xl shadow-default w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-divider flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-foreground">{t('form.addTitle')}</h2>
                    <button onClick={onClose} className="text-subtle hover:text-foreground">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Resident */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.resident')} <span className="text-danger">*</span>
                        </label>
                        <select
                            value={form.residentId}
                            onChange={e => set('residentId', e.target.value)}
                            required
                            className={inputCls}
                        >
                            <option value="">{t('form.selectResident')}</option>
                            {residents.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name}{r.block ? ` — Blok ${r.block}` : ''}{r.house_number ? `/${r.house_number}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.year')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="number"
                            min="2020"
                            max="2099"
                            value={form.year}
                            onChange={e => set('year', e.target.value)}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Month checkboxes */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('form.months')} <span className="text-danger">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {MONTHS.map(m => (
                                <label
                                    key={m.id}
                                    className={`flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                                        form.months.includes(m.id)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-input border-divider text-foreground hover:border-primary/50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={form.months.includes(m.id)}
                                        onChange={() => toggleMonth(m.id)}
                                    />
                                    {m.short}
                                </label>
                            ))}
                        </div>
                        {form.months.length === 0 && (
                            <p className="text-xs text-danger mt-1">{t('form.monthsRequired')}</p>
                        )}
                    </div>

                    {/* Amount per month — read-only, sourced from RT monthly_fee */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.amountPerMonth')}
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={monthlyFee ? `Rp ${monthlyFee.toLocaleString('id-ID')}` : '—'}
                            className={readonlyCls}
                        />
                        {form.months.length > 0 && monthlyFee && (
                            <p className="text-xs text-muted mt-1">
                                {t('form.totalLabel')}: Rp {total.toLocaleString('id-ID')}
                            </p>
                        )}
                    </div>

                    {/* Payment date */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.date')} <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={e => set('date', e.target.value)}
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Payment method */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.method')}
                        </label>
                        <select
                            value={form.method}
                            onChange={e => set('method', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">{t('form.selectMethod')}</option>
                            {PAYMENT_METHODS.map(m => (
                                <option key={m} value={m}>{tc(`paymentMethods.${m}` as Parameters<typeof tc>[0])}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            {t('form.notes')}
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder={t('form.notesPlaceholder')}
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-divider rounded-lg px-4 py-2.5 text-sm"
                        >
                            {tc('actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving || form.months.length === 0}
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
