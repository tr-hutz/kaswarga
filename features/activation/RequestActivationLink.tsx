// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RequestActivationLink() {

    const t = useTranslations('aktivasi')
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
                    setError(t('errors.notFound'))
                } else {
                    setError(body.error || t('errors.generic'))
                }
                return
            }

            setDone(true)
        } catch {
            setError(t('errors.network'))
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
                    {t('backToLogin')}
                </Link>

                {!done ? (
                    <>
                        <div>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mb-3">
                                <Mail size={22} />
                            </div>
                            <h1 className="text-xl font-bold">{t('title')}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('subtitle')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('emailLabel')}</label>
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
                                {loading ? t('submitting') : t('submit')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center space-y-3 py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('success.title')}</h1>
                        <p className="text-sm text-gray-600">
                            {t('success.message', { email })}
                        </p>
                        <Link
                            href="/login"
                            className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                        >
                            {t('success.backToLogin')}
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
