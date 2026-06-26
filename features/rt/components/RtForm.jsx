'use client'

import { useEffect, useState } from 'react'

const EMPTY = {
    nama: '', kode: '', alamat: '', kota: '', provinsi: '', kodePos: '',
    email: '', telepon: '', nominalIuran: ''
}

export default function RtForm({ open, onClose, rt, onSubmit }) {

    const isEdit = !!rt

    const [form,    setForm]    = useState(EMPTY)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {

        if (!rt) { setForm(EMPTY); return }

        setForm({
            nama:         rt.nama          || '',
            kode:         rt.kode          || '',
            alamat:       rt.alamat        || '',
            kota:         rt.kota          || '',
            provinsi:     rt.provinsi      || '',
            kodePos:      rt.kode_pos      || '',
            email:        rt.email         || '',
            telepon:      rt.telepon       || '',
            nominalIuran: rt.nominal_iuran ?? ''
        })

    }, [rt])

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)
        try {
            await onSubmit({ ...form, nominalIuran: Number(form.nominalIuran) || 0 })
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-lg font-semibold">
                    {isEdit ? 'Edit RT' : 'Tambah RT Baru'}
                </h2>

                <div className="grid grid-cols-2 gap-3">

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Nama RT *</label>
                        <input
                            required
                            placeholder="RT 001 Perumahan Asri"
                            value={form.nama}
                            onChange={e => set('nama', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kode</label>
                        <input
                            placeholder="RT001"
                            value={form.kode}
                            onChange={e => set('kode', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Iuran / Bulan (Rp)</label>
                        <input
                            type="number"
                            placeholder="50000"
                            value={form.nominalIuran}
                            onChange={e => set('nominalIuran', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Alamat</label>
                        <input
                            placeholder="Jl. Contoh No. 1"
                            value={form.alamat}
                            onChange={e => set('alamat', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kota</label>
                        <input
                            placeholder="Jakarta"
                            value={form.kota}
                            onChange={e => set('kota', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Provinsi</label>
                        <input
                            placeholder="DKI Jakarta"
                            value={form.provinsi}
                            onChange={e => set('provinsi', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kode Pos</label>
                        <input
                            placeholder="12345"
                            value={form.kodePos}
                            onChange={e => set('kodePos', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Email</label>
                        <input
                            type="email"
                            placeholder="rt001@example.com"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Telepon</label>
                        <input
                            placeholder="021-1234567"
                            value={form.telepon}
                            onChange={e => set('telepon', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                </div>

                <div className="flex justify-end gap-2 pt-2">
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
                        className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    )
}
