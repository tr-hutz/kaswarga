// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import { resendInvite }        from '@/lib/services/approval.service'
import { CheckCircle, AlertCircle, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react'
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
    const [email,         setEmail]         = useState(null)
    const [displayName,   setDisplayName]   = useState(null)
    const [rtName,        setRtName]        = useState(null)
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
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) { setState(STATE.NO_TOKEN); return }
            } else if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                if (error) { setState(STATE.NO_TOKEN); return }
            }

            // Clear the hash/code from the URL bar without reloading
            window.history.replaceState(null, '', window.location.pathname)

            await activate()
        }

        bootstrap()

    }, [])

    async function activate() {
        const { data: { session } } = await supabase.auth.getSession()

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
            setErrMsg(err.message)
            setState(STATE.ERROR)
        }
    }

    async function handleSetPassword(e) {
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
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error

            // Sign in fresh so AuthProvider always gets a clean email+password
            // session rather than the one-time invite session.
            if (email) {
                await supabase.auth.signInWithPassword({ email, password }).catch(() => {})
            }

            window.location.replace('/')
        } catch (err) {
            setPwError(err.message)
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
            setErrMsg(err.message)
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">

                {state === STATE.LOADING && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
                            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold">{t('loading.title')}</h1>
                        <p className="text-sm text-gray-500">{t('loading.description')}</p>
                    </>
                )}

                {state === STATE.SET_PASSWORD && (
                    <>
                        <div className="inline-flex items-center gap-1.5 justify-center text-green-600 mb-1">
                            <CheckCircle size={14} />
                            <span className="text-xs font-medium">{t('setPassword.activated')}</span>
                        </div>
                        <h1 className="text-xl font-bold">{t('setPassword.title')}</h1>
                        {(displayName || rtName) && (
                            <p className="text-sm font-medium text-gray-700">
                                {displayName && <span>{displayName}</span>}
                                {displayName && rtName && <span className="text-gray-300"> · </span>}
                                {rtName && <span>{rtName}</span>}
                            </p>
                        )}
                        <p className="text-sm text-gray-500">
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
                                        className="w-full border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            {pwError && (
                                <p className="text-sm text-red-600">{pwError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={savingPw}
                                className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
                            >
                                {savingPw ? t('setPassword.submitting') : t('setPassword.submit')}
                            </button>
                        </form>
                    </>
                )}

                {state === STATE.EXPIRED && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
                            <Clock size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('expired.title')}</h1>
                        <p className="text-sm text-gray-600">
                            {t('expired.description', { email })}
                        </p>
                        {resendDone ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                                {t('expired.resendDone', { email })}
                            </div>
                        ) : (
                            <>
                                {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="flex items-center gap-2 mx-auto bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                                    {resending ? t('expired.resending') : t('expired.resend')}
                                </button>
                            </>
                        )}
                    </>
                )}

                {state === STATE.ALREADY && (
                    <>
                        <div className="inline-flex items-center gap-1.5 justify-center text-blue-600 mb-1">
                            <CheckCircle size={14} />
                            <span className="text-xs font-medium">{t('already.badge')}</span>
                        </div>
                        <h1 className="text-xl font-bold">{t('already.title')}</h1>
                        {email && (
                            <p className="text-sm font-medium text-gray-700">{email}</p>
                        )}
                        <p className="text-sm text-gray-500">
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
                                        className="w-full border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            {pwError && (
                                <p className="text-sm text-red-600">{pwError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={savingPw}
                                className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
                            >
                                {savingPw ? t('already.submitting') : t('already.submit')}
                            </button>
                        </form>

                        <a
                            href="/login"
                            className="block text-sm text-gray-400 hover:underline"
                        >
                            {t('already.hasPassword')}
                        </a>
                    </>
                )}

                {state === STATE.NO_TOKEN && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
                            <AlertCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('noToken.title')}</h1>
                        <p className="text-sm text-gray-600">
                            {t('noToken.description')}
                        </p>
                    </>
                )}

                {state === STATE.ERROR && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
                            <AlertCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">{t('aktivasiError.title')}</h1>
                        <p className="text-sm text-gray-600">
                            {errMsg || t('aktivasiError.fallback')}
                        </p>
                    </>
                )}

            </div>
        </div>
    )
}
