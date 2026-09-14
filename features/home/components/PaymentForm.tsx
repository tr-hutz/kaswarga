'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import Icon from '@/components/ui/Icon'
import { MONTHS } from '@/lib/constants/months'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/ToastProvider'

/* -------------------------------------------------------------------------- */
/* BuktiUpload — local-preview file picker, upload happens on form submit      */
/* -------------------------------------------------------------------------- */

interface BuktiUploadProps {
    file:     File | null
    onChange: (file: File | null) => void
}

function BuktiUpload({ file, onChange }: BuktiUploadProps) {

    const t = useTranslations('home')
    const inputRef   = useRef<HTMLInputElement>(null)
    const previewUrl = file ? URL.createObjectURL(file) : null

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        onChange(e.target.files?.[0] || null)
    }

    function handleRemove(e: MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        onChange(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className="flex flex-col h-full">
            <div
                onClick={() => inputRef.current?.click()}
                className={`
                    relative flex flex-col items-center justify-center
                    border-2 border-dashed rounded-xl overflow-hidden
                    transition cursor-pointer select-none flex-1 min-h-[120px]
                    ${file
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-divider hover:border-primary/40 hover:bg-primary/5 bg-canvas'
                    }
                `}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="bukti"
                            className="h-full w-full object-contain p-2"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-surface border border-divider rounded-full p-0.5 text-muted hover:text-danger transition-colors"
                        >
                            <Icon name="x" size={14} />
                        </button>
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-end justify-center opacity-0 hover:opacity-100 pb-2">
                            <span className="text-xs text-white bg-black/60 rounded-lg px-2 py-1">
                                {t('receipt.change')}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1.5 text-subtle py-4 text-center px-4">
                        <p className="text-sm font-medium text-foreground">{t('receipt.label')}</p>
                        <Icon name="image" size={28} strokeWidth={1.5} />
                        <p className="text-xs font-medium">{t('receipt.clickUpload')}</p>
                        <p className="text-[11px]">{t('receipt.format')}</p>
                    </div>
                )}
            </div>

            {file && (
                <p className="text-xs text-muted truncate mt-1">{file.name}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* PaymentForm                                                                  */
/* -------------------------------------------------------------------------- */

interface PaymentFormProps {
    paymentYear:    number
    setPaymentYear: (y: number) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit:       (payload: any) => Promise<void>
    loading:        boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statusMap:      Record<number, any>
    monthlyFee:     number
}

export default function PaymentForm({
    paymentYear,
    setPaymentYear,
    onSubmit,
    loading,
    statusMap,
    monthlyFee
}: PaymentFormProps) {

    const t = useTranslations('home')
    const { toast } = useToast()

    const ALL_MONTHS    = MONTHS.map(m => m.id)
    const PAYABLE_MONTHS = ALL_MONTHS.filter(id => {
        const s = statusMap?.[id]
        return s !== 'approved' && s !== 'pending'
    })

    const [selectedMonths, setSelectedMonths] = useState<number[]>([])
    const [file,           setFile]           = useState<File | null>(null)

    /* ---------------------------------------------------------------------- */
    /* Helpers                                                                  */
    /* ---------------------------------------------------------------------- */

    function toggleMonth(month: number) {
        const status = statusMap[month]
        if (status === 'approved' || status === 'pending') return
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        )
    }

    function handleToggleFullYear() {
        const allSelected =
            PAYABLE_MONTHS.length > 0 &&
            PAYABLE_MONTHS.every(m => selectedMonths.includes(m))

        setSelectedMonths(allSelected ? [] : PAYABLE_MONTHS)
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!file) {
            toast({ message: t('payment.noProofError'), type: 'error' })
            return
        }
        await onSubmit({ months: selectedMonths, year: paymentYear, file })
        setSelectedMonths([])
        setFile(null)
    }

    /* ---------------------------------------------------------------------- */
    /* Derived                                                                  */
    /* ---------------------------------------------------------------------- */

    const totalMonths = selectedMonths.length
    const totalFee    = totalMonths * (monthlyFee || 0)

    /* ---------------------------------------------------------------------- */
    /* Render                                                                   */
    /* ---------------------------------------------------------------------- */

    return (
        <form onSubmit={handleSubmit} className="bg-surface border border-divider rounded-xl p-6 space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-foreground">{t('payment.title')}</h2>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={paymentYear}
                        onChange={e => setPaymentYear(Number(e.target.value))}
                        className="h-10 px-3 border border-divider rounded-lg text-sm bg-surface text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    >
                        {[paymentYear - 1, paymentYear, paymentYear + 1].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={handleToggleFullYear}
                        className={`h-10 px-4 rounded-lg border text-sm font-medium transition-colors ${
                            PAYABLE_MONTHS.length > 0 && PAYABLE_MONTHS.every(m => selectedMonths.includes(m))
                                ? 'bg-primary text-white border-primary'
                                : 'border-divider bg-surface text-foreground hover:bg-canvas'
                        }`}
                    >
                        {t('payment.annualized')}
                    </button>
                </div>
            </div>

            {/* MONTH GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {MONTHS.map(month => {
                    const status     = statusMap?.[month.id]
                    const isDisabled = status === 'approved' || status === 'pending'
                    const isSelected = selectedMonths.includes(month.id)

                    return (
                        <button
                            key={month.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => toggleMonth(month.id)}
                            className={`border rounded-lg p-4 text-left transition-colors ${
                                isDisabled
                                    ? 'bg-canvas text-subtle border-divider cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-surface border-divider text-foreground hover:bg-canvas'
                            }`}
                        >
                            <div className="font-semibold">{month.short}</div>
                            <div className="text-sm opacity-80">
                                {isDisabled
                                    ? status === 'approved' ? t('payment.monthPaid') : t('payment.monthPending')
                                    : `Rp ${(monthlyFee || 0).toLocaleString('id-ID')}`
                                }
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* SUMMARY + UPLOAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* File upload */}
                <BuktiUpload file={file} onChange={setFile} />

                {/* Summary */}
                <div className="rounded-xl border border-divider p-4 bg-canvas space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">{t('payment.totalMonths')}</span>
                        <strong className="text-foreground">{totalMonths} {t('payment.monthsUnit')}</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">{t('payment.totalFee')}</span>
                        <strong className="text-foreground">Rp {totalFee.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={loading || selectedMonths.length === 0}
                            className="w-full h-10 rounded-lg bg-primary hover:bg-primary-dark text-white px-6 text-sm font-medium disabled:opacity-40 transition-colors"
                        >
                            {loading ? t('payment.submitting') : t('payment.submit')}
                        </button>
                    </div>
                </div>

            </div>

        </form>
    )
}