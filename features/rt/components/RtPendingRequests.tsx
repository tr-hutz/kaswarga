// @ts-nocheck
'use client'

import { useState }                                          from 'react'
import { ChevronDown, ChevronUp, Check, X, Building2, Copy, CheckCheck } from 'lucide-react'
import { approveRtRegistration, rejectRtRegistration }       from '@/lib/services/approval.service'
import { useAuth }                                           from '@/lib/auth/useAuth'
import { useToast }                                          from '@/components/ui/ToastProvider'
import { formatDate }                                         from '@/lib/utils'
import { useTranslations }                                   from 'next-intl'

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

function DevLinksPanel({ links, onDismiss }) {
    return (
        <div className="mt-3 border-t border-amber-200 pt-3 space-y-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                [DEV] Activation Links
            </p>
            {links.map(({ email, role, link }) => (
                <div key={email} className="space-y-1">
                    <p className="text-xs text-gray-600">
                        <span className="font-medium capitalize">{role}</span>
                        <span className="text-gray-400"> — </span>
                        {email}
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={link || '(link tidak tersedia)'}
                            className="flex-1 text-xs border rounded-lg px-2 py-1.5 font-mono bg-gray-50 text-gray-700 min-w-0"
                        />
                        {link && <CopyButton text={link} />}
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
                Tutup
            </button>
        </div>
    )
}

function RequestCard({ req, onAction }) {
    const [expanded,   setExpanded]   = useState(false)
    const [processing, setProcessing] = useState(false)
    const [devLinks,   setDevLinks]   = useState(null)
    const { membership }              = useAuth()
    const { toast }                   = useToast()
    const tc                          = useTranslations('common')

    const rtData = req.rt_data || {}

    async function handleApprove() {
        setProcessing(true)
        try {
            const { inviteLinks } = await approveRtRegistration(req.id, membership)
            toast({ message: `RT "${rtData.name}" berhasil disetujui dan diaktifkan.`, type: 'success' })
            if (IS_DEV && inviteLinks?.length) {
                setDevLinks(inviteLinks)
                // Don't call onAction yet — user must dismiss the dev links panel
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
        if (!window.confirm('Tolak pendaftaran RT ini?')) return
        setProcessing(true)
        try {
            await rejectRtRegistration(req.id, '', membership)
            toast({ message: 'Pendaftaran RT ditolak.', type: 'success' })
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setProcessing(false)
            onAction()
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
                            <p className="font-medium text-sm">{rtData.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {rtData.code} &bull; {rtData.city} &bull; {formatDate(req.created_at)}
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
                        <div className="mt-3 border-t pt-3 space-y-3 text-xs text-gray-600">

                            {/* RT details */}
                            <div className="space-y-1">
                                {(rtData.address || rtData.city) && (
                                    <p>{[rtData.address, rtData.city, rtData.province].filter(Boolean).join(', ')}</p>
                                )}
                                {rtData.postalCode  && <p><span className="font-medium">Kode Pos:</span> {rtData.postalCode}</p>}
                                {rtData.phone  && <p><span className="font-medium">Telepon:</span> {rtData.phone}</p>}
                            </div>

                            {/* Management */}
                            <div className="space-y-1.5 border-t pt-2">
                                {(req.nama_ketua || req.email_ketua) && (
                                    <div>
                                        <p className="font-medium text-gray-700">Ketua</p>
                                        {req.nama_ketua  && <p>{req.nama_ketua}</p>}
                                        {req.email_ketua && <p className="text-gray-400">{req.email_ketua}</p>}
                                    </div>
                                )}
                                {(req.nama_admin || req.email_admin) && (
                                    <div>
                                        <p className="font-medium text-gray-700">Admin</p>
                                        {req.nama_admin  && <p>{req.nama_admin}</p>}
                                        {req.email_admin && <p className="text-gray-400">{req.email_admin}</p>}
                                    </div>
                                )}
                                {(req.nama_bendahara || req.email_bendahara) && (
                                    <div>
                                        <p className="font-medium text-gray-700">Bendahara</p>
                                        {req.nama_bendahara  && <p>{req.nama_bendahara}</p>}
                                        {req.email_bendahara && <p className="text-gray-400">{req.email_bendahara}</p>}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {!devLinks && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                                <Check size={12} />
                                {tc('actions.approve')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                                <X size={12} />
                                {tc('actions.reject')}
                            </button>
                        </div>
                    )}

                    {devLinks && (
                        <DevLinksPanel links={devLinks} onDismiss={onAction} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function RtPendingRequests({ requests, loading, onAction }) {
    const [open, setOpen] = useState(true)
    const t = useTranslations('rtRegistrasi')

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
                    {t('pendingSection.title')}
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
