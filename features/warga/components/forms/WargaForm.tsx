// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createResident, updateResident } from '@/lib/services/warga.service'

const EMPTY = { name: '', block: '', houseNumber: '', phone: '' }

export default function WargaForm({ open, onClose, warga, onSuccess }) {

    const isEdit = !!warga

    const [form,    setForm]    = useState(EMPTY)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        if (!warga) { setForm(EMPTY); return }
        setForm({
            name:        warga.name        || '',
            block:       warga.block       || '',
            houseNumber: warga.houseNumber || '',
            phone:       warga.phone       || ''
        })
    }, [warga])

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)
        try {
            if (isEdit) {
                await updateResident(warga.id, form)
            } else {
                await createResident(form)
            }
            onSuccess()
        } catch (err) {
            console.error(err)
            alert('Gagal menyimpan warga')
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
                <h2 className="text-lg font-semibold">
                    {isEdit ? 'Edit Warga' : 'Tambah Warga'}
                </h2>

                <div className="grid grid-cols-2 gap-3">

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Nama Lengkap *</label>
                        <input
                            required
                            placeholder="Nama sesuai KTP"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Blok / Jalan</label>
                        <input
                            placeholder="Blok A / Jl. Kenanga"
                            value={form.block}
                            onChange={e => set('block', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nomor Rumah</label>
                        <input
                            placeholder="12"
                            value={form.houseNumber}
                            onChange={e => set('houseNumber', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Nomor Telepon</label>
                        <input
                            placeholder="08123456789"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </div>

                </div>

                <div className="flex justify-end gap-2 pt-1">
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
