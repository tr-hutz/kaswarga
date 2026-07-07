'use client'

import { useState }                                              from 'react'
import { ChevronDown, ChevronUp, Check, X, UserPlus, Copy, CheckCheck } from 'lucide-react'
import { approveResidentRegistration, rejectResidentRegistration } from '@/lib/services/approval.service'
import { useAuth }                                               from '@/lib/auth/useAuth'
import { useToast }                                              from '@/components/ui/ToastProvider'
import { formatDate }                                            from '@/lib/utils'

const IS_DEV = process.env.NODE_ENV === 'development'

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1 text-xs border rounded-lg px-2 py-1 hover:bg-gray-50 text-gray-600"
        >
            {copied ? <CheckCheck size={12} className="text-green-600" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

function RequestRow({ req, onAction }) {
    const [processing, setProcessing] = useState(false)
    const [devLink,    setDevLink]    = useState(null)
    const { membership }              = useAuth()
    const { toast }                   = useToast()

    async function handleApprove() {
        setProcessing(true)
        try {
            const { inviteLink } = await approveResidentRegistration(req.id, membership)
            toast({ message: `Pendaftaran "${req.nama_warga}" disetujui. Link aktivasi dikirim.`, type: 'success' })
            if (IS_DEV && inviteLink) {
                setDevLink(inviteLink)
                // Don't call onAction yet — user must dismiss the dev link row
            } else {
                onAction()
            }
        } catch (err) {
            toast({ message: err.message, type: 'error' })
            onAction()
        } finally {
            setProcessing(false)
        }
    }

    async function handleReject() {
        if (!window.confirm(`Tolak dan hapus pendaftaran "${req.nama_warga}"? Warga harus mendaftar ulang.`)) return
        setProcessing(true)
        try {
            await rejectResidentRegistration(req.id, membership)
            toast({ message: 'Pendaftaran ditolak dan dihapus.', type: 'success' })
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
            onAction()
        }
    }

    return (
        <>
            <tr className="border-t">
                <td className="px-4 py-3 text-sm font-medium">{req.nama_warga}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{req.email_warga}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                    {[req.blok, req.no_rumah].filter(Boolean).join(' / ') || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(req.created_at)}</td>
                <td className="px-4 py-3">
                    {!devLink ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                            >
                                <Check size={11} />
                                Setujui
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex items-center gap-1 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                            >
                                <X size={11} />
                                Tolak
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-green-600 font-medium">Disetujui</span>
                    )}
                </td>
            </tr>

            {devLink && (
                <tr className="bg-amber-50 border-t border-amber-200">
                    <td colSpan={5} className="px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                            [DEV] Activation Link — {req.email_warga}
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={devLink}
                                className="flex-1 text-xs border rounded-lg px-2 py-1.5 font-mono bg-white text-gray-700 min-w-0"
                            />
                            <CopyButton text={devLink} />
                        </div>
                        <button
                            type="button"
                            onClick={onAction}
                            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                        >
                            Tutup
                        </button>
                    </td>
                </tr>
            )}
        </>
    )
}

export default function WargaPendingRequests({ requests, loading, onAction }) {
    const [open, setOpen] = useState(true)

    if (loading) return null
    if (!requests || requests.length === 0) return null

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-amber-800"
            >
                <span className="flex items-center gap-2">
                    <UserPlus size={16} />
                    Permintaan Bergabung
                    <span className="bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium">
                        {requests.length}
                    </span>
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-amber-100/60 text-xs text-amber-700">
                                <th className="px-4 py-2 font-medium">Nama</th>
                                <th className="px-4 py-2 font-medium">Email</th>
                                <th className="px-4 py-2 font-medium">Alamat</th>
                                <th className="px-4 py-2 font-medium">Tanggal</th>
                                <th className="px-4 py-2 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {requests.map(req => (
                                <RequestRow key={req.id} req={req} onAction={onAction} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}