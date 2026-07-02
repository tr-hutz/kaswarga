'use client'

import { useState }       from 'react'
import Link               from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function MintaLinkAktivasi() {

    const [email,   setEmail]   = useState('')
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)
    const [error,   setError]   = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res  = await fetch('/api/resend-invite', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email.trim().toLowerCase() })
            })
            const body = await res.json()

            if (!res.ok) {
                if (res.status === 404) {
                    setError('Email ini tidak memiliki undangan yang aktif. Pastikan email sudah didaftarkan oleh pengurus RT.')
                } else {
                    setError(body.error || 'Terjadi kesalahan. Coba lagi.')
                }
                return
            }

            setDone(true)
        } catch {
            setError('Tidak dapat terhubung ke server. Coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-5">

                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft size={14} />
                    Kembali ke Login
                </Link>

                {!done ? (
                    <>
                        <div>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mb-3">
                                <Mail size={22} />
                            </div>
                            <h1 className="text-xl font-bold">Minta Link Aktivasi</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Masukkan email yang didaftarkan oleh pengurus RT.
                                Kami akan mengirimkan link aktivasi baru ke email tersebut.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? 'Mengirim...' : 'Kirim Link Aktivasi'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center space-y-3 py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Link Dikirim!</h1>
                        <p className="text-sm text-gray-600">
                            Link aktivasi baru telah dikirim ke <strong>{email}</strong>.
                            Cek inbox (dan folder spam) Anda.
                            Link berlaku selama 24 jam.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                        >
                            Kembali ke Login
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
