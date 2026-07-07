'use client'

import { useEffect, useState } from 'react'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: ''
}

export default function RtForm({ open, onClose, rt, onSubmit }) {

    const isEdit = !!rt

    const [form,    setForm]    = useState(EMPTY)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {

        if (!rt) { setForm(EMPTY); return }

        setForm({
            name:      rt.nama      || '',
            code:      rt.kode      || '',
            address:   rt.alamat    || '',
            city:      rt.kota      || '',
            province:  rt.provinsi  || '',
            postalCode: rt.kode_pos || ''
        })

    }, [rt])

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
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
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kode</label>
                        <input
                            placeholder="RT001"
                            value={form.code}
                            onChange={e => set('code', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kode Pos</label>
                        <input
                            placeholder="12345"
                            value={form.postalCode}
                            onChange={e => set('postalCode', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Alamat</label>
                        <input
                            placeholder="Jl. Contoh No. 1"
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kota</label>
                        <input
                            placeholder="Jakarta"
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Provinsi</label>
                        <input
                            placeholder="DKI Jakarta"
                            value={form.province}
                            onChange={e => set('province', e.target.value)}
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