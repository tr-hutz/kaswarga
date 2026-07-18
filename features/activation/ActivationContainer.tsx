'use client'

import { useEffect, useState } from 'react'
import type { FormEvent }      from 'react'
import {
    exchangeCodeForSession,
    setAuthSession,
    getAuthSession,
    changePassword,
    signInWithPassword,
} from '@/lib/services/auth.service'
import { resendInvite }        from '@/lib/services/approval.service'
import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

const STATE = {
    LOADING:      'loading',
    SET_PASSWORD: 'set_password',
    EXPIRED:      'expired',
    ALREADY:      'already',
    ERROR:        'error',
    NO_TOKEN:     'no_token'
}

export default function ActivationContainer() {

    const t = useTranslations('activation')

    const [state,         setState]         = useState(STATE.LOADING)
    const [email,         setEmail]         = useState<string | null>(null)
    const [displayName,   setDisplayName]   = useState<string | null>(null)
    const [rtName,        setRtName]        = useState<string | null>(null)
    const [resending,     setResending]     = useState(false)
    const [resendDone,    setResendDone]    = useState(false)
    const [errMsg,        setErrMsg]        = useState('')

    // Password setup state
    const [password,      setPassword]      = useState('')
    const [confirmPw,     setConfirmPw]     = useState('')
    const [showPw,        setShowPw]        = useState(false)
    const [savingPw,      setSavingPw]      = useState(false)
    const [pwError,       setPwError]       = useState('')

    useEffect(() => {

        async function bootstrap() {
            // Supabase admin-generated links use implicit flow — the session
            // arrives as a URL hash (#access_token=...&refresh_token=...).
            // PKCE flow (client-initiated sign-in) arrives as ?code=.
            // Handle both before calling activate().
            const query = new URLSearchParams(window.location.search)
            const hash  = new URLSearchParams(window.location.hash.slice(1))

            const code         = query.get('code')
            const accessToken  = hash.get('access_token')
            const refreshToken = hash.get('refresh_token')

            if (code) {
                try { await exchangeCodeForSession(code) }
                catch { setState(STATE.NO_TOKEN); return }
            } else if (accessToken && refreshToken) {
                try { await setAuthSession(accessToken, refreshToken) }
                catch { setState(STATE.NO_TOKEN); return }
            }

            // Clear the hash/code from the URL bar without reloading
            window.history.replaceState(null, '', window.location.pathname)

            await activate()
        }

        bootstrap()

    }, [])

    async function activate() {
        const session = await getAuthSession()

        if (!session?.access_token) {
            setState(STATE.NO_TOKEN)
            return
        }

        setEmail(session.user?.email || null)

        try {
            const res = await fetch('/api/activate', {
                method:  'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })

            const body = await res.json()

            if (res.ok) {
                setDisplayName(body.displayName || null)
                setRtName(body.rtName || null)
                setState(STATE.SET_PASSWORD)
                return
            }

            if (body.code === 'EXPIRED') {
                setEmail(body.email)
                setState(STATE.EXPIRED)
                return
            }

            if (body.code === 'ALREADY_ACTIVATED') {
                // Already activated — still offer password setup if they don't have one
                setState(STATE.ALREADY)
                return
            }

            setErrMsg(body.error || 'Terjadi kesalahan.')
            setState(STATE.ERROR)

        } catch (err) {
            setErrMsg((err as Error).message)
            setState(STATE.ERROR)
        }
    }

    async function handleSetPassword(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setPwError('')

        if (password.length < 8) {
            setPwError(t('setPassword.minLength'))
            return
        }
        if (password !== confirmPw) {
            setPwError(t('setPassword.mismatch'))
            return
        }

        setSavingPw(true)
        try {
            await changePassword(password)

            // Sign in fresh so AuthProvider always gets a clean email+password
            // session rather than the one-time invite session.
            if (email) {
                try { await signInWithPassword(email, password) } catch { /* intentional */ }
            }

            window.location.replace('/')
        } catch (err) {
            setPwError((err as Error).message)
            setSavingPw(false)
        }
    }

    async function handleResend() {
        if (!email) return
        setResending(true)
        try {
            await resendInvite(email)
            setResendDone(true)
        } catch (err) {
            setErrMsg((err as Error).message)
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-body px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-card border p-8 text-center space-y-4">

                {state === STATE.LOADING && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5">
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold">{t('loading.title')}</h1>
                        <p className="text-sm text-dark-5">{t('loading.description')}</p>
                    </>
                )}

                {state === STATE.SET_PASSWORD && (
                    <>
                        <div className="inline-flex items-center gap-1.5 justify-center text-success mb-1">
                            <Icon name="check-circle" size={14} />
                            <span className="text-xs font-medium">{t('setPassword.activated')}</span>
                        </div>
                        <h1 className="text-xl font-bold">{t('setPassword.title')}</h1>
                        {(displayName || rtName) && (
                            <p className="text-sm font-medium text-dark">
                                {displayName && <span>{displayName}</span>}
                                {displayName && rtName && <span className="text-dark-6"> · </span>}
                                {rtName && <span>{rtName}</span>}
                            </p>
                        )}
                        <p className="text-sm text-dark-5">
                            {t('setPassword.description')}
                        </p>

                        <form onSubmit={handleSetPassword} className="text-left space-y-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('setPassword.passwordLabel')}</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        autoFocus
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={t('setPassword.passwordPlaceholder')}
                                        className="w-full border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark-5"
                                    >
                                        {showPw ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('setPassword.confirmLabel')}</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder={t('setPassword.confirmPlaceholder')}
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                />
                            </div>
                            {pwError && (
                                <p className="text-sm text-danger">{pwError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={savingPw}
                                className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                {savingPw ? t('setPassword.submitting') : t('setPassword.submit')}
                            </button>
                        </form>
                    </>
                )}

                {state === STATE.EXPIRED && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 text-warning">
                            <Icon name="clock" size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('expired.title')}</h1>
                        <p className="text-sm text-dark-5">
                            {t('expired.description', { email: email ?? '' })}
                        </p>
                        {resendDone ? (
                            <div className="bg-success/5 border border-success/30 text-success rounded-xl px-4 py-3 text-sm">
                                {t('expired.resendDone', { email: email ?? '' })}
                            </div>
                        ) : (
                            <>
                                {errMsg && <p className="text-sm text-danger">{errMsg}</p>}
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="flex items-center gap-2 mx-auto bg-primary hover:bg-primary-dark text-white rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                                >
                                    <Icon name="refresh-cw" size={14} className={resending ? 'animate-spin' : ''} />
                                    {resending ? t('expired.resending') : t('expired.resend')}
                                </button>
                            </>
                        )}
                    </>
                )}

                {state === STATE.ALREADY && (
                    <>
                        <div className="inline-flex items-center gap-1.5 justify-center text-primary mb-1">
                            <Icon name="check-circle" size={14} />
                            <span className="text-xs font-medium">{t('already.badge')}</span>
                        </div>
                        <h1 className="text-xl font-bold">{t('already.title')}</h1>
                        {email && (
                            <p className="text-sm font-medium text-dark">{email}</p>
                        )}
                        <p className="text-sm text-dark-5">
                            {t('already.description')}
                        </p>

                        <form onSubmit={handleSetPassword} className="text-left space-y-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('setPassword.passwordLabel')}</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        autoFocus
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={t('setPassword.passwordPlaceholder')}
                                        className="w-full border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-6 hover:text-dark-5"
                                    >
                                        {showPw ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('setPassword.confirmLabel')}</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder={t('setPassword.confirmPlaceholder')}
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                                />
                            </div>
                            {pwError && (
                                <p className="text-sm text-danger">{pwError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={savingPw}
                                className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                {savingPw ? t('already.submitting') : t('already.submit')}
                            </button>
                        </form>

                        <a
                            href="/login"
                            className="block text-sm text-dark-6 hover:underline"
                        >
                            {t('already.hasPassword')}
                        </a>
                    </>
                )}

                {state === STATE.NO_TOKEN && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 text-danger">
                            <Icon name="alert-circle" size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('noToken.title')}</h1>
                        <p className="text-sm text-dark-5">
                            {t('noToken.description')}
                        </p>
                        <a
                            href="/activation/request-link"
                            className="inline-block text-sm text-primary hover:underline"
                        >
                            {t('noToken.requestLink')}
                        </a>
                    </>
                )}

                {state === STATE.ERROR && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 text-danger">
                            <Icon name="alert-circle" size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('activationError.title')}</h1>
                        <p className="text-sm text-dark-5">
                            {errMsg || t('activationError.fallback')}
                        </p>
                        <a
                            href="/activation/request-link"
                            className="inline-block text-sm text-primary hover:underline"
                        >
                            {t('activationError.requestLink')}
                        </a>
                    </>
                )}

            </div>
        </div>
    )
}
