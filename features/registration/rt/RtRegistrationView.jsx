'use client'

import { useState }       from 'react'
import { ChevronDown, ChevronUp, RefreshCw, CheckCircle } from 'lucide-react'
import Link               from 'next/link'

function Field({ label, required, children }) {
    return (
        <div>
            <label className="text-xs text-gray-500 mb-1 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    )
}

function Input({ value, onChange, ...props }) {
    return (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...props}
        />
    )
}

export default function RtRegistrationView({
    form, set, generating, submitting, error, success,
    onGenerateCode, onSubmit
}) {

    const [bankOpen, setBankOpen] = useState(false)

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold">Pendaftaran Terkirim!</h1>
                    <p className="text-sm text-gray-600">
                        Permintaan pendaftaran RT <strong>{form.name}</strong> telah dikirim.
                        Tim kami akan memverifikasi dan mengirimkan email aktivasi
                        kepada ketua, admin, dan bendahara dalam waktu 1–2 hari kerja.
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
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-2xl mx-auto space-y-6"
            >
                <div>
                    <h1 className="text-2xl font-bold">Daftarkan RT Baru</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pendaftaran akan diverifikasi oleh super admin sebelum diaktifkan.
                    </p>
                </div>

                {/* Identitas RT */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                        Identitas RT
                    </h2>

                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <Field label="Nama RT" required>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={v => set('name', v)}
                                    placeholder="RT 001 Perumahan Asri"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label="Kode RT" required>
                                <div className="flex gap-2">
                                    <Input
                                        required
                                        value={form.code}
                                        onChange={v => set('code', v.toUpperCase())}
                                        placeholder="RT-0001"
                                        className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={onGenerateCode}
                                        disabled={generating}
                                        title="Generate kode unik"
                                        className="flex items-center gap-1 border rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                                        Generate
                                    </button>
                                </div>
                            </Field>
                        </div>

                        <div className="col-span-2">
                            <Field label="Alamat">
                                <Input
                                    value={form.address}
                                    onChange={v => set('address', v)}
                                    placeholder="Jl. Contoh No. 1"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label="Kota">
                                <Input
                                    value={form.city}
                                    onChange={v => set('city', v)}
                                    placeholder="Jakarta"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label="Provinsi">
                                <Input
                                    value={form.province}
                                    onChange={v => set('province', v)}
                                    placeholder="DKI Jakarta"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label="Kode Pos">
                                <Input
                                    value={form.postalCode}
                                    onChange={v => set('postalCode', v)}
                                    placeholder="12345"
                                />
                            </Field>
                        </div>

                        <div>
                            <Field label="Iuran / Bulan (Rp)">
                                <Input
                                    type="number"
                                    value={form.monthlyFee}
                                    onChange={v => set('monthlyFee', v)}
                                    placeholder="50000"
                                />
                            </Field>
                        </div>

                    </div>
                </div>

                {/* Rekening (collapsible) */}
                <div className="bg-white rounded-2xl border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setBankOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700"
                    >
                        Informasi Rekening (opsional)
                        {bankOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {bankOpen && (
                        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                            <div>
                                <Field label="Nama Bank">
                                    <Input
                                        value={form.bankName}
                                        onChange={v => set('bankName', v)}
                                        placeholder="BCA"
                                    />
                                </Field>
                            </div>
                            <div>
                                <Field label="Nomor Rekening">
                                    <Input
                                        value={form.accountNumber}
                                        onChange={v => set('accountNumber', v)}
                                        placeholder="1234567890"
                                    />
                                </Field>
                            </div>
                            <div className="col-span-2">
                                <Field label="Atas Nama">
                                    <Input
                                        value={form.accountHolder}
                                        onChange={v => set('accountHolder', v)}
                                        placeholder="RT 001 Perumahan Asri"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}
                </div>

                {/* Akun Pengurus */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <div>
                        <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                            Akun Pengurus
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Link aktivasi akan dikirimkan ke email masing-masing. Harus berbeda satu sama lain.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nama Ketua" required>
                            <Input
                                required
                                value={form.chairmanName}
                                onChange={v => set('chairmanName', v)}
                                placeholder="Budi Santoso"
                            />
                        </Field>
                        <Field label="Email Ketua" required>
                            <Input
                                required
                                type="email"
                                value={form.chairmanEmail}
                                onChange={v => set('chairmanEmail', v)}
                                placeholder="ketua@example.com"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nama Admin" required>
                            <Input
                                required
                                value={form.adminName}
                                onChange={v => set('adminName', v)}
                                placeholder="Siti Rahayu"
                            />
                        </Field>
                        <Field label="Email Admin" required>
                            <Input
                                required
                                type="email"
                                value={form.adminEmail}
                                onChange={v => set('adminEmail', v)}
                                placeholder="admin@example.com"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nama Bendahara">
                            <Input
                                value={form.treasurerName}
                                onChange={v => set('treasurerName', v)}
                                placeholder="Ahmad Fauzi (opsional)"
                            />
                        </Field>
                        <Field label="Email Bendahara">
                            <Input
                                type="email"
                                value={form.treasurerEmail}
                                onChange={v => set('treasurerEmail', v)}
                                placeholder="bendahara@example.com (opsional)"
                            />
                        </Field>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between pb-4">
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
