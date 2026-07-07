'use client'

import { useState }                                               from 'react'
import { ChevronDown, ChevronUp, Check, X, Copy, CheckCheck, Link2 } from 'lucide-react'
import { approveRtRegistration, rejectRtRegistration }             from '@/lib/services/approval.service'
import { useAuth }                                                  from '@/lib/auth/useAuth'
import { useToast }                                                 from '@/components/ui/ToastProvider'
import { formatDate }                                               from '@/lib/utils'
import { supabase }                                                 from '@/lib/supabase'

const IS_DEV = process.env.NODE_ENV === 'development'

const STATUS_BADGE = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL = {
    pending:  'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
}

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

export default function RegistrasiCard({ req, onAction }) {

    const [expanded,      setExpanded]      = useState(false)
    const [processing,    setProcessing]    = useState(false)
    const [devLinks,      setDevLinks]      = useState(null)
    const [postApproval,  setPostApproval]  = useState(false)
    const [loadingLinks,  setLoadingLinks]  = useState(false)
    const { membership }                    = useAuth()
    const { toast }                         = useToast()

    const rtData = req.rt_data || {}

    function dismissDevLinks() {
        setDevLinks(null)
        if (postApproval) {
            setPostApproval(false)
            onAction()
        }
    }

    async function handleApprove() {
        setProcessing(true)
        try {
            const { inviteLinks } = await approveRtRegistration(req.id, membership)
            toast({ message: `RT "${rtData.nama}" berhasil disetujui dan diaktifkan.`, type: 'success' })
            if (IS_DEV && inviteLinks?.length) {
                setPostApproval(true)
                setDevLinks(inviteLinks)
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

    async function handleViewLinks() {
        setLoadingLinks(true)
        try {
            const { data: invites, error } = await supabase
                .from('activation_invites')
                .select('email, role')
                .eq('registration_request_id', req.id)

            if (error) throw error
            if (!invites?.length) {
                toast({ message: 'Tidak ada invite ditemukan untuk pendaftaran ini.', type: 'info' })
                return
            }

            const links = await Promise.all(invites.map(async ({ email, role }) => {
                const res = await fetch('/api/dev/invite-link', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email, role, rtId: req.rt_id })
                })
                const body = await res.json()
                return { email, role, link: body.link || null }
            }))

            setDevLinks(links)
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setLoadingLinks(false)
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
        <div className="bg-white border rounded-xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">

                <div className="flex-1 min-w-0">

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{rtData.nama}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[req.status] || STATUS_BADGE.pending}`}>
                                    {STATUS_LABEL[req.status] || req.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {rtData.kode && <span>{rtData.kode} &bull; </span>}
                                {rtData.kota && <span>{rtData.kota} &bull; </span>}
                                <span>{formatDate(req.created_at)}</span>
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

                    {/* Expanded details */}
                    {expanded && (
                        <div className="mt-3 border-t pt-3 space-y-3 text-xs text-gray-600">

                            {/* RT info */}
                            <div className="space-y-1">
                                {rtData.alamat   && <p><span className="font-medium">Alamat:</span> {[rtData.alamat, rtData.kota, rtData.provinsi].filter(Boolean).join(', ')}</p>}
                                {rtData.kodePos  && <p><span className="font-medium">Kode Pos:</span> {rtData.kodePos}</p>}
                                {rtData.telepon  && <p><span className="font-medium">Telepon:</span> {rtData.telepon}</p>}
                            </div>

                            {/* Management */}
                            <div className="space-y-2 border-t pt-2">
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

                            {/* Status info */}
                            {req.status === 'approved' && req.approved_at && (
                                <p className="border-t pt-2 text-green-600">
                                    <span className="font-medium">Disetujui:</span> {formatDate(req.approved_at)}
                                </p>
                            )}
                            {req.status === 'rejected' && (
                                <div className="border-t pt-2 space-y-1 text-red-600">
                                    {req.rejected_at      && <p><span className="font-medium">Ditolak:</span> {formatDate(req.rejected_at)}</p>}
                                    {req.rejection_reason && <p><span className="font-medium">Alasan:</span> {req.rejection_reason}</p>}
                                </div>
                            )}

                        </div>
                    )}

                    {/* Actions — pending only */}
                    {req.status === 'pending' && !devLinks && (
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
                    )}

                    {/* Dev-only view links button for approved cards */}
                    {IS_DEV && req.status === 'approved' && !devLinks && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={handleViewLinks}
                                disabled={loadingLinks}
                                className="flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Link2 size={12} />
                                {loadingLinks ? 'Memuat...' : 'Lihat Link Aktivasi'}
                            </button>
                        </div>
                    )}

                    {/* Dev links panel */}
                    {devLinks && (
                        <DevLinksPanel links={devLinks} onDismiss={dismissDevLinks} />
                    )}

                </div>
            </div>
        </div>
    )
}