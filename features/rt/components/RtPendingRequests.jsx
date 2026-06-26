'use client'

import { useState }                                          from 'react'
import { ChevronDown, ChevronUp, Check, X, Building2 }      from 'lucide-react'
import { approveRtRegistration, rejectRtRegistration }       from '@/lib/services/approval.service'
import { useAuth }                                           from '@/lib/auth/useAuth'
import { useToast }                                          from '@/components/ui/ToastProvider'
import { formatTanggal as formatDate }                        from '@/lib/utils'

function RequestCard({ req, onAction }) {
    const [expanded,   setExpanded]   = useState(false)
    const [processing, setProcessing] = useState(false)
    const { membership }              = useAuth()
    const { toast }                   = useToast()

    const rtData = req.rt_data || {}

    async function handleApprove() {
        setProcessing(true)
        try {
            await approveRtRegistration(req.id, membership)
            toast({ message: `RT "${rtData.nama}" berhasil disetujui dan diaktifkan.`, type: 'success' })
            onAction()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
        }
    }

    async function handleReject() {
        if (!window.confirm('Tolak pendaftaran RT ini?')) return
        setProcessing(true)
        try {
            await rejectRtRegistration(req.id, '', membership)
            toast({ message: 'Pendaftaran RT ditolak.', type: 'success' })
            onAction()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="border rounded-xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 size={18} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium text-sm">{rtData.nama || req.nama}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {rtData.kode} &bull; {rtData.kota} &bull; {formatDate(req.created_at)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded(o => !o)}
                            className="text-gray-400 hover:text-gray-600 shrink-0"
                        >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {expanded && (
                        <div className="mt-3 space-y-1.5 text-xs text-gray-600 border-t pt-3">
                            {req.email           && <p><span className="font-medium">Ketua:</span> {req.email}</p>}
                            {req.email_admin     && <p><span className="font-medium">Admin:</span> {req.email_admin}</p>}
                            {req.email_bendahara && <p><span className="font-medium">Bendahara:</span> {req.email_bendahara}</p>}
                            {rtData.alamat && <p className="mt-1 text-gray-400">{rtData.alamat}, {rtData.kota}</p>}
                        </div>
                    )}

                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                            <Check size={12} />
                            Setujui
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                            <X size={12} />
                            Tolak
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RtPendingRequests({ requests, loading, onAction }) {
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
                <span>
                    Permintaan Pendaftaran RT
                    <span className="ml-2 bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium">
                        {requests.length}
                    </span>
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-3">
                    {requests.map(req => (
                        <RequestCard key={req.id} req={req} onAction={onAction} />
                    ))}
                </div>
            )}
        </div>
    )
}
