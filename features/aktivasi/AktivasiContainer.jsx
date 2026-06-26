'use client'

import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import { resendInvite }        from '@/lib/services/approval.service'
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

const STATE = {
    LOADING:  'loading',
    SUCCESS:  'success',
    EXPIRED:  'expired',
    ALREADY:  'already',
    ERROR:    'error',
    NO_TOKEN: 'no_token'
}

export default function AktivasiContainer() {

    const [state,      setState]      = useState(STATE.LOADING)
    const [role,       setRole]       = useState(null)
    const [rtNama,     setRtNama]     = useState(null)
    const [email,      setEmail]      = useState(null)
    const [resending,  setResending]  = useState(false)
    const [resendDone, setResendDone] = useState(false)
    const [errMsg,     setErrMsg]     = useState('')

    useEffect(() => {

        // Wait briefly for Supabase to process the URL hash
        const timer = setTimeout(() => activate(), 800)
        return () => clearTimeout(timer)

    }, [])

    async function activate() {
        // Get current session (Supabase sets it from the URL hash automatically)
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
                setRole(body.role)
                setRtNama(body.rtNama)
                setState(STATE.SUCCESS)
                return
            }

            if (body.code === 'EXPIRED') {
                setEmail(body.email)
                setState(STATE.EXPIRED)
                return
            }

            if (body.code === 'ALREADY_ACTIVATED') {
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
                        <h1 className="text-xl font-bold">Mengaktifkan Akun...</h1>
                        <p className="text-sm text-gray-500">Mohon tunggu sebentar.</p>
                    </>
                )}

                {state === STATE.SUCCESS && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Akun Berhasil Diaktifkan!</h1>
                        <p className="text-sm text-gray-600">
                            Selamat datang di Kaswarga.
                            {rtNama && <> Anda terdaftar sebagai <strong>{role}</strong> di <strong>{rtNama}</strong>.</>}
                            {!rtNama && <> Anda terdaftar sebagai <strong>{role}</strong>.</>}
                        </p>
                        <a
                            href="/"
                            className="inline-block mt-2 bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium"
                        >
                            Masuk ke Aplikasi
                        </a>
                    </>
                )}

                {state === STATE.EXPIRED && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
                            <Clock size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Link Aktivasi Kedaluwarsa</h1>
                        <p className="text-sm text-gray-600">
                            Link aktivasi untuk <strong>{email}</strong> sudah tidak berlaku (berlaku 1 hari).
                        </p>
                        {resendDone ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                                Link aktivasi baru telah dikirim ke {email}. Cek inbox Anda.
                            </div>
                        ) : (
                            <>
                                {errMsg && (
                                    <p className="text-sm text-red-600">{errMsg}</p>
                                )}
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="flex items-center gap-2 mx-auto bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                                    {resending ? 'Mengirim...' : 'Kirim Ulang Link Aktivasi'}
                                </button>
                            </>
                        )}
                    </>
                )}

                {state === STATE.ALREADY && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                            <CheckCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Akun Sudah Aktif</h1>
                        <p className="text-sm text-gray-600">
                            Akun Anda sudah pernah diaktifkan sebelumnya.
                        </p>
                        <a
                            href="/"
                            className="inline-block mt-2 bg-black text-white rounded-xl px-6 py-2.5 text-sm font-medium"
                        >
                            Masuk ke Aplikasi
                        </a>
                    </>
                )}

                {state === STATE.NO_TOKEN && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
                            <AlertCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Link Tidak Valid</h1>
                        <p className="text-sm text-gray-600">
                            Link aktivasi tidak ditemukan atau sudah digunakan.
                            Pastikan Anda membuka link langsung dari email.
                        </p>
                    </>
                )}

                {state === STATE.ERROR && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
                            <AlertCircle size={32} />
                        </div>
                        <h1 className="text-xl font-bold">Terjadi Kesalahan</h1>
                        <p className="text-sm text-gray-600">
                            {errMsg || 'Aktivasi gagal. Silakan coba lagi atau hubungi pengurus RT.'}
                        </p>
                    </>
                )}

            </div>
        </div>
    )
}
