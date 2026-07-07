'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { generateRtCode } from '@/lib/services/registration.service'
import ImageUpload from './components/ImageUpload'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: '',
    monthlyFee: '', bankName: '', accountNumber: '',
    accountHolder: '', qrisUrl: '', logoUrl: ''
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

    const [form,       setForm]       = useState(EMPTY)
    const [dirty,      setDirty]      = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {

        if (!rt) return

        setForm({
            name:          rt.nama           || '',
            code:          rt.kode           || '',
            address:       rt.alamat         || '',
            city:          rt.kota           || '',
            province:      rt.provinsi       || '',
            postalCode:    rt.kode_pos       || '',
            monthlyFee:    rt.nominal_iuran  ?? '',
            bankName:      rt.nama_bank      || '',
            accountNumber: rt.nomor_rekening || '',
            accountHolder: rt.atas_nama      || '',
            qrisUrl:       rt.qris_url       || '',
            logoUrl:       rt.logo_url       || ''
        })

        setDirty(false)

    }, [rt])

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setDirty(true)
    }

    async function handleGenerateCode() {
        setGenerating(true)
        try {
            const code = await generateRtCode()
            set('code', code)
        } catch (err) {
            console.error('[generateCode]', err)
        } finally {
            setGenerating(false)
        }
    }

    function handleSubmit(e) {
        e.preventDefault()
        onSave({ ...form, monthlyFee: Number(form.monthlyFee) || 0 })
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
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                    <Field label="Kode Unik RT">
                        <div className="flex gap-2">
                            <input
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateCode}
                                disabled={generating}
                                title="Generate kode unik"
                                className="flex items-center gap-1 border rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                            >
                                <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                                Generate
                            </button>
                        </div>
                    </Field>

                    <Field label="Iuran per Bulan (Rp)">
                        <input
                            type="number"
                            value={form.monthlyFee}
                            onChange={e => set('monthlyFee', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <SectionTitle>Alamat</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <div className="col-span-2">
                        <Field label="Alamat">
                            <input
                                value={form.address}
                                onChange={e => set('address', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                    <Field label="Kota">
                        <input
                            value={form.city}
                            onChange={e => set('city', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Provinsi">
                        <input
                            value={form.province}
                            onChange={e => set('province', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Kode Pos">
                        <input
                            value={form.postalCode}
                            onChange={e => set('postalCode', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                </div>

                <SectionTitle>Rekening Bank</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <Field label="Nama Bank">
                        <input
                            value={form.bankName}
                            onChange={e => set('bankName', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <Field label="Nomor Rekening">
                        <input
                            value={form.accountNumber}
                            onChange={e => set('accountNumber', e.target.value)}
                            className="w-full border rounded-xl px-4 py-2.5 text-sm"
                        />
                    </Field>

                    <div className="col-span-2">
                        <Field label="Atas Nama">
                            <input
                                value={form.accountHolder}
                                onChange={e => set('accountHolder', e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                            />
                        </Field>
                    </div>

                </div>

                <SectionTitle>Aset Media</SectionTitle>

                <div className="grid grid-cols-2 gap-4">

                    <ImageUpload
                        label="Logo RT"
                        currentUrl={form.logoUrl}
                        storagePath={`${rt?.id}/logo`}
                        onUploaded={url => set('logoUrl', url)}
                    />

                    <ImageUpload
                        label="QRIS"
                        currentUrl={form.qrisUrl}
                        storagePath={`${rt?.id}/qris`}
                        onUploaded={url => set('qrisUrl', url)}
                    />

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
