// @ts-nocheck
'use client'

import { useState }   from 'react'
import { Eye, EyeOff } from 'lucide-react'

function PasswordField({ label, value, onChange, placeholder }) {

    const [show, setShow] = useState(false)

    return (
        <div>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <div className="relative">
                <input
                    required
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    )
}

export default function ChangePasswordView({ form, set, saving, error, onSubmit }) {

    return (

        <div className="space-y-6 max-w-md">

            <div>
                <h1 className="text-xl font-semibold">Ganti Password</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Perbarui password akun Anda
                </p>
            </div>

            <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
            >

                <PasswordField
                    label="Password Baru"
                    value={form.next}
                    onChange={val => set('next', val)}
                    placeholder="Minimal 8 karakter"
                />

                <PasswordField
                    label="Konfirmasi Password Baru"
                    value={form.confirm}
                    onChange={val => set('confirm', val)}
                    placeholder="Ulangi password baru"
                />

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={saving || !form.next || !form.confirm}
                        className="bg-black text-white rounded-xl px-6 py-2.5 text-sm disabled:opacity-40"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Password'}
                    </button>
                </div>

            </form>

        </div>
    )
}
