'use client'

import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'

const EMPTY = {
    nama: '', kode: '', alamat: '', kota: '', provinsi: '', kodePos: '',
    email: '', telepon: '', nominalIuran: '', namaBank: '', nomorRekening: '',
    atasNama: '', qrisUrl: '', logoUrl: ''
}

function Field({ label, children }) {
    return (
        <div>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            {children}
        </div>
    )
}

function SectionTitle({ children }) {
    return (
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">
            {children}
        </h2>
    )
}

export default function ProfilRtView({ rt, loading, saving, onSave }) {

    const [form, setForm] = useState(EMPTY)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {

        if (!rt) return

        setForm({
            nama:          rt.nama           || '',
            kode:          rt.kode           || '',
            alamat:        rt.alamat         || '',
            kota:          rt.kota           || '',
            provinsi:      rt.provinsi       || '',
            kodePos:       rt.kode_pos       || '',
            email:         rt.email          || '',
            telepon:       rt.telepon        || '',
            nominalIuran:  rt.nominal_iuran  ?? '',
            namaBank:      rt.nama_bank      || '',
            nomorRekening: rt.nomor_rekening || '',
            atasNama:      rt.atas_nama      || '',
            qrisUrl:       rt.qris_url       || '',
            logoUrl:       rt.logo_url       || ''
        })

        setDirty(false)

    }, [rt])

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setDirty(true)
    }

    function handleSubmit(e) {
        e.preventDefault()
        onSave({ ...form, nominalIuran: Number(form.nominalIuran) || 0 })
        setDirty(false)
    }

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                Memuat profil RT...
            </div>
        )
    }

    return (

        <div className="space-y-6 max-w-2xl">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">Profil RT</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Kelola informasi RT Anda
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">

                <SectionTitle>Identitas RT</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <Field label="Nama RT *">
                            <input
                                required
                                value={form.nama}
                                onChange={e => set('nama', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                    <Field label="Kode">
                        <input
                            value={form.kode}
                            onChange={e => set('kode', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Iuran per Bulan (Rp)">
                        <input
                            type="number"
                            value={form.nominalIuran}
                            onChange={e => set('nominalIuran', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <SectionTitle>Alamat</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <Field label="Alamat">
                            <input
                                value={form.alamat}
                                onChange={e => set('alamat', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                    <Field label="Kota">
                        <input
                            value={form.kota}
                            onChange={e => set('kota', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Provinsi">
                        <input
                            value={form.provinsi}
                            onChange={e => set('provinsi', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Kode Pos">
                        <input
                            value={form.kodePos}
                            onChange={e => set('kodePos', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <SectionTitle>Kontak</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Email">
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Telepon">
                        <input
                            value={form.telepon}
                            onChange={e => set('telepon', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <SectionTitle>Rekening Bank</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Nama Bank">
                        <input
                            value={form.namaBank}
                            onChange={e => set('namaBank', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Nomor Rekening">
                        <input
                            value={form.nomorRekening}
                            onChange={e => set('nomorRekening', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <div className="col-span-2">
                        <Field label="Atas Nama">
                            <input
                                value={form.atasNama}
                                onChange={e => set('atasNama', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                </div>

                <SectionTitle>Tautan</SectionTitle>

                <div className="grid grid-cols-1 gap-4">

                    <Field label="URL QRIS (gambar)">
                        <input
                            value={form.qrisUrl}
                            onChange={e => set('qrisUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="URL Logo RT">
                        <input
                            value={form.logoUrl}
                            onChange={e => set('logoUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving || !dirty}
                        className="bg-black text-white rounded-xl px-6 py-2.5 text-sm disabled:opacity-40"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>

            </form>

        </div>
    )
}
