'use client'

import { useState }   from 'react'
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import Link           from 'next/link'

export default function WargaRegistrationView({
    form, set, submitting, error, success, onSubmit
}) {
    const [extraOpen, setExtraOpen] = useState(false)

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold">Pendaftaran Terkirim!</h1>
                    <p className="text-sm text-gray-600">
                        Permintaan pendaftaran Anda telah dikirim kepada pengurus RT.
                        Setelah disetujui, link aktivasi akan dikirimkan ke email <strong>{form.email}</strong>.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block mt-2 bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium"
                    >
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-md space-y-5"
            >
                <div>
                    <h1 className="text-2xl font-bold">Daftar sebagai Warga</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Butuh kode RT dari pengurus RT Anda.
                    </p>
                </div>

                <div className="bg-white rounded-2xl border p-6 space-y-4">

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input
                            required
                            value={form.nama}
                            onChange={e => set('nama', e.target.value)}
                            placeholder="Nama sesuai KTP"
                            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Email <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Kode RT <span className="text-red-500">*</span></label>
                        <input
                            required
                            value={form.rtKode}
                            onChange={e => set('rtKode', e.target.value.toUpperCase())}
                            placeholder="RT-0001"
                            className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Tanyakan kode ini kepada pengurus RT Anda</p>
                    </div>

                    {/* Extra fields (collapsible) */}
                    <div className="border rounded-xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExtraOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600"
                        >
                            Informasi Tambahan (opsional)
                            {extraOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {extraOpen && (
                            <div className="px-4 pb-4 space-y-3 border-t">
                                <div className="mt-3">
                                    <label className="text-xs text-gray-500 mb-1 block">Blok / Jalan</label>
                                    <input
                                        value={form.blok}
                                        onChange={e => set('blok', e.target.value)}
                                        placeholder="Blok A / Jl. Kenanga"
                                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Nomor Rumah</label>
                                    <input
                                        value={form.noRumah}
                                        onChange={e => set('noRumah', e.target.value)}
                                        placeholder="12"
                                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Nomor Telepon</label>
                                    <input
                                        value={form.noHp}
                                        onChange={e => set('noHp', e.target.value)}
                                        placeholder="08123456789"
                                        className="w-full border rounded-xl px-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <Link href="/daftar" className="text-sm text-gray-500 hover:underline">
                        Kembali
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                        {submitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                    </button>
                </div>

            </form>
        </div>
    )
}
