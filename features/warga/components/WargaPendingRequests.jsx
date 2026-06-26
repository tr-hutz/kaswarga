'use client'

import { useState }                                              from 'react'
import { ChevronDown, ChevronUp, Check, X, UserPlus }            from 'lucide-react'
import { approveWargaRegistration, rejectWargaRegistration }     from '@/lib/services/approval.service'
import { useAuth }                                               from '@/lib/auth/useAuth'
import { useToast }                                              from '@/components/ui/ToastProvider'
import { formatTanggal as formatDate }                           from '@/lib/utils'

function RequestRow({ req, onAction }) {
    const [processing, setProcessing] = useState(false)
    const { membership }              = useAuth()
    const { toast }                   = useToast()

    async function handleApprove() {
        setProcessing(true)
        try {
            await approveWargaRegistration(req.id, membership)
            toast({ message: `Pendaftaran "${req.nama}" disetujui. Link aktivasi dikirim.`, type: 'success' })
            onAction()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
        }
    }

    async function handleReject() {
        if (!window.confirm(`Tolak dan hapus pendaftaran "${req.nama}"? Warga harus mendaftar ulang.`)) return
        setProcessing(true)
        try {
            await rejectWargaRegistration(req.id, membership)
            toast({ message: 'Pendaftaran ditolak dan dihapus.', type: 'success' })
            onAction()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
        }
    }

    return (
        <tr className="border-t">
            <td className="px-4 py-3 text-sm font-medium">{req.nama}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{req.email}</td>
            <td className="px-4 py-3 text-xs text-gray-500">
                {[req.blok, req.no_rumah].filter(Boolean).join(' / ') || '-'}
            </td>
            <td className="px-4 py-3 text-xs text-gray-400">{formatDate(req.created_at)}</td>
            <td className="px-4 py-3">
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
            </td>
        </tr>
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
