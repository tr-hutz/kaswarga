'use client'

import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

import FileUpload from '@/components/ui/FileUpload'
import { useAuth } from '@/lib/auth/useAuth'
import { generateNomorBukti } from '@/lib/services/pengeluaran.service'
import { usePengeluaranKategori } from '../../hooks/usePengeluaranKategori'

export default function PengeluaranForm({
    open,
    onClose,
    onSubmit,
    initialData = null,
}) {

    const { membership } = useAuth()
    const rtId = membership?.rt?.id
    const { kategori: kategoriList } = usePengeluaranKategori()

    const [form, setForm] = useState(() => initialData ? {
        nomorBukti: initialData.nomorBukti || '',
        kategori:   initialData.kategori   || '',
        nominal:    initialData.nominal     || '',
        tanggal:    initialData.tanggal     || '',
        penerima:   initialData.penerima    || '',
        deskripsi:  initialData.deskripsi   || '',
        notaUrl:    initialData.notaUrl     || '',
    } : {
        nomorBukti: '',
        kategori:   '',
        nominal:    '',
        tanggal:    '',
        penerima:   '',
        deskripsi:  '',
        notaUrl:    '',
    })

    const [saving,     setSaving]     = useState(false)
    const [generating, setGenerating] = useState(false)

    if (!open) return null

    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleGenerate() {
        setGenerating(true)
        try {
            const nomor = await generateNomorBukti()
            set('nomorBukti', nomor)
        } catch {
            // silently fail — user can type manually
        } finally {
            setGenerating(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)
        try {
            await onSubmit(form)
        } finally {
            setSaving(false)
        }
    }

    const storagePath = rtId ? `pengeluaran/${rtId}` : 'pengeluaran/general'

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
            >

                <h2 className="text-lg font-semibold">
                    {initialData ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                </h2>

                {/* Nomor Bukti */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                        Nomor Bukti
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={form.nomorBukti}
                            onChange={e => set('nomorBukti', e.target.value)}
                            placeholder="Contoh: 03072026-RT08-00001"
                            className="flex-1 border rounded-xl px-4 py-2 text-sm font-mono"
                        />
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            title="Generate nomor otomatis"
                            className="
                                h-10 w-10 shrink-0 rounded-xl border
                                flex items-center justify-center
                                hover:bg-gray-50 transition
                                disabled:opacity-50
                            "
                        >
                            {generating
                                ? <Loader2 size={15} className="animate-spin text-gray-500" />
                                : <RefreshCw size={15} className="text-gray-500" />
                            }
                        </button>
                    </div>
                </div>

                {/* Tanggal + Kategori */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">
                            Tanggal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={form.tanggal}
                            onChange={e => set('tanggal', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">
                            Kategori
                        </label>
                        <select
                            value={form.kategori}
                            onChange={e => set('kategori', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2 text-sm"
                        >
                            <option value="">Pilih kategori</option>
                            {kategoriList.map(k => (
                                <option key={k.id} value={k.nama}>{k.nama}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Nominal */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                        Nominal (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        required
                        min={0}
                        value={form.nominal}
                        onChange={e => set('nominal', e.target.value)}
                        placeholder="0"
                        className="w-full border rounded-xl px-4 py-2 text-sm"
                    />
                </div>

                {/* Penerima */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                        Mitra / Penerima
                    </label>
                    <input
                        value={form.penerima}
                        onChange={e => set('penerima', e.target.value)}
                        placeholder="Nama vendor, toko, atau individu penerima"
                        className="w-full border rounded-xl px-4 py-2 text-sm"
                    />
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                        Deskripsi
                    </label>
                    <textarea
                        value={form.deskripsi}
                        onChange={e => set('deskripsi', e.target.value)}
                        placeholder="Keterangan pengeluaran..."
                        rows={3}
                        className="w-full border rounded-xl px-4 py-2 text-sm resize-none"
                    />
                </div>

                {/* Nota Upload */}
                <FileUpload
                    label="Nota / Bukti Pembayaran"
                    currentUrl={form.notaUrl}
                    pathPrefix={storagePath}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onUploaded={url => set('notaUrl', url)}
                />

                <div className="flex justify-end gap-3 pt-2">

                    <button
                        type="button"
                        onClick={onClose}
                        className="border rounded-xl px-4 py-2 text-sm"
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        Simpan
                    </button>

                </div>

            </form>

        </div>
    )
}