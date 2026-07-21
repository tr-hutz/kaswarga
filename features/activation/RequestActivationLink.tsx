'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

export default function RequestActivationLink() {

    const t = useTranslations('activation')
    const [email,   setEmail]   = useState('')
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)
    const [error,   setError]   = useState('')

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
            <div className="w-full max-w-md bg-surface rounded-lg shadow-card border border-divider p-8 space-y-5">

                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
                >
                    <Icon name="arrow-left" size={14} />
                    {t('backToLogin')}
                </Link>

                {!done ? (
                    <>
                        <div>
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-3">
                                <Icon name="mail" size={22} />
                            </div>
                            <h1 className="text-xl font-bold">{t('title')}</h1>
                            <p className="text-sm text-muted mt-1">
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
                                    className="w-full border border-divider rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 hover:bg-primary-dark transition"
                            >
                                {loading ? t('submitting') : t('submit')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center space-y-3 py-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success">
                            <Icon name="check-circle" size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('success.title')}</h1>
                        <p className="text-sm text-muted">
                            {t('success.message', { email })}
                        </p>
                        <Link
                            href="/login"
                            className="inline-block mt-2 text-sm text-primary hover:underline"
                        >
                            {t('success.backToLogin')}
                        </Link>
                    </div>
                )}

            </div>
        </div>
    )
}
