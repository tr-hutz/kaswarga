'use client'

import { useRef, useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { MONTHS } from '../../../constants/months'

/* -------------------------------------------------------------------------- */
/* BuktiUpload — local-preview file picker, upload happens on form submit      */
/* -------------------------------------------------------------------------- */

function BuktiUpload({ file, onChange }) {

    const inputRef   = useRef(null)
    const previewUrl = file ? URL.createObjectURL(file) : null

    function handleChange(e) {
        onChange(e.target.files?.[0] || null)
    }

    function handleRemove(e) {
        e.stopPropagation()
        onChange(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700">Bukti Pembayaran</p>

            <div
                onClick={() => inputRef.current?.click()}
                className={`
                    relative flex flex-col items-center justify-center
                    border-2 border-dashed rounded-xl overflow-hidden
                    transition cursor-pointer select-none h-36
                    ${file
                        ? 'border-blue-300 bg-blue-50/30'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 bg-gray-50'
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
                            className="absolute top-2 right-2 bg-white border rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm"
                        >
                            <X size={14} />
                        </button>
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-end justify-center opacity-0 hover:opacity-100 pb-2">
                            <span className="text-xs text-white bg-black/60 rounded-lg px-2 py-1">
                                Ganti
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400 py-4">
                        <ImageIcon size={28} strokeWidth={1.5} />
                        <p className="text-xs font-medium">Klik untuk upload bukti</p>
                        <p className="text-[11px]">JPG, PNG · maks. 5 MB</p>
                    </div>
                )}
            </div>

            {file && (
                <p className="text-xs text-gray-500 truncate">{file.name}</p>
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

export default function PaymentForm({
    paymentYear,
    setPaymentYear,
    onSubmit,
    loading,
    statusMap,
    monthlyFee
}) {

    const ALL_MONTHS    = MONTHS.map(m => m.id)
    const PAYABLE_MONTHS = ALL_MONTHS.filter(id => {
        const s = statusMap?.[id]
        return s !== 'approved' && s !== 'pending'
    })

    const [selectedMonths, setSelectedMonths] = useState([])
    const [file,           setFile]           = useState(null)

    /* ---------------------------------------------------------------------- */
    /* Helpers                                                                  */
    /* ---------------------------------------------------------------------- */

    function toggleMonth(month) {
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

    async function handleSubmit(e) {
        e.preventDefault()
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
        <form onSubmit={handleSubmit} className="border rounded-xl p-6 space-y-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Ajukan Pembayaran</h2>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={paymentYear}
                        onChange={e => setPaymentYear(Number(e.target.value))}
                        className="border rounded-xl px-3 py-2 text-sm"
                    >
                        {[paymentYear - 1, paymentYear, paymentYear + 1].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={handleToggleFullYear}
                        className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                            PAYABLE_MONTHS.length > 0 && PAYABLE_MONTHS.every(m => selectedMonths.includes(m))
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white hover:bg-slate-100'
                        }`}
                    >
                        Disetahunkan
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
                            className={`border rounded-2xl p-4 text-left transition-all ${
                                isDisabled
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white hover:bg-slate-50'
                            }`}
                        >
                            <div className="font-semibold">{month.short}</div>
                            <div className="text-sm opacity-80">
                                {isDisabled
                                    ? status === 'approved' ? 'Lunas' : 'Menunggu'
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
                <div className="rounded-2xl border p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Jumlah Bulan</span>
                        <strong>{totalMonths} bulan</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Iuran</span>
                        <strong>Rp {totalFee.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={loading || selectedMonths.length === 0}
                            className="w-full rounded-xl bg-black text-white px-6 py-2.5 text-sm font-medium disabled:opacity-40 transition"
                        >
                            {loading ? 'Mengirim...' : 'Ajukan Pembayaran'}
                        </button>
                    </div>
                </div>

            </div>

        </form>
    )
}