'use client'

import { useState }                                          from 'react'
import Icon from '@/components/ui/Icon'
import { approveRtRegistration, rejectRtRegistration }       from '@/lib/services/approval.service'
import { useAuth }                                           from '@/lib/auth/useAuth'
import { useToast }                                          from '@/components/ui/ToastProvider'
import { formatDate }                                         from '@/lib/utils'
import { useTranslations }                                   from 'next-intl'

const IS_DEV = process.env.NODE_ENV === 'development'

function CopyButton({ text }: { text: string }) {
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
            className="shrink-0 flex items-center gap-1 text-xs border border-stroke rounded-lg px-2 py-1 hover:bg-body text-dark-5"
        >
            {copied ? <Icon name="check-check" size={12} className="text-success" /> : <Icon name="copy" size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DevLinksPanel({ links, onDismiss }: { links: any[]; onDismiss: () => void }) {
    return (
        <div className="mt-3 border-t border-warning/20 pt-3 space-y-3">
            <p className="text-xs font-semibold text-warning uppercase tracking-wider">
                [DEV] Activation Links
            </p>
            {links.map(({ email, role, link }) => (
                <div key={email} className="space-y-1">
                    <p className="text-xs text-dark-5">
                        <span className="font-medium capitalize">{role}</span>
                        <span className="text-dark-6"> — </span>
                        {email}
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={link || '(link tidak tersedia)'}
                            className="flex-1 text-xs border border-stroke rounded-lg px-2 py-1.5 font-mono bg-body text-dark min-w-0"
                        />
                        {link && <CopyButton text={link} />}
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-dark-5 hover:text-dark hover:underline"
            >
                Tutup
            </button>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RequestCard({ req, onAction }: { req: any; onAction: () => void }) {
    const [expanded,   setExpanded]   = useState(false)
    const [processing, setProcessing] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [devLinks,   setDevLinks]   = useState<any[] | null>(null)
    const { membership }              = useAuth()
    const { toast }                   = useToast()
    const t                           = useTranslations('rtRegistration')
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
            toast({ message: (err as Error).message, type: 'error' })
            onAction()
        } finally {
            setProcessing(false)
        }
    }

    async function handleReject() {
        if (!window.confirm(t('card.rejectConfirm'))) return
        setProcessing(true)
        try {
            await rejectRtRegistration(req.id, '', membership)
            toast({ message: 'RT registration rejected.', type: 'success' })
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        } finally {
            setProcessing(false)
            onAction()
        }
    }

    return (
        <div className="border rounded-xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="building2" size={18} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-medium text-sm">{rtData.name}</p>
                            <p className="text-xs text-dark-5 mt-0.5">
                                {rtData.code} &bull; {rtData.city} &bull; {formatDate(req.created_at)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded(o => !o)}
                            className="text-dark-6 hover:text-dark-5 shrink-0"
                        >
                            {expanded ? <Icon name="chevron-up" size={16} /> : <Icon name="chevron-down" size={16} />}
                        </button>
                    </div>

                    {expanded && (
                        <div className="mt-3 border-t border-stroke pt-3 space-y-3 text-xs text-dark-5">

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
                                {(req.chair_name || req.chair_email) && (
                                    <div>
                                        <p className="font-medium text-dark">Ketua</p>
                                        {req.chair_name  && <p>{req.chair_name}</p>}
                                        {req.chair_email && <p className="text-dark-6">{req.chair_email}</p>}
                                    </div>
                                )}
                                {(req.admin_name || req.admin_email) && (
                                    <div>
                                        <p className="font-medium text-dark">Admin</p>
                                        {req.admin_name  && <p>{req.admin_name}</p>}
                                        {req.admin_email && <p className="text-dark-6">{req.admin_email}</p>}
                                    </div>
                                )}
                                {(req.treasurer_name || req.treasurer_email) && (
                                    <div>
                                        <p className="font-medium text-dark">Bendahara</p>
                                        {req.treasurer_name  && <p>{req.treasurer_name}</p>}
                                        {req.treasurer_email && <p className="text-dark-6">{req.treasurer_email}</p>}
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
                                className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                                <Icon name="check" size={12} />
                                {tc('actions.approve')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex items-center gap-1.5 border border-danger/30 text-danger hover:bg-danger/5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                                <Icon name="x" size={12} />
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

interface RtPendingRequestsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requests: any[]
    loading:  boolean
    onAction: () => void
}

export default function RtPendingRequests({ requests, loading, onAction }: RtPendingRequestsProps) {
    const [open, setOpen] = useState(true)
    const t = useTranslations('rtRegistration')

    if (loading) return null
    if (!requests || requests.length === 0) return null

    return (
        <div className="bg-warning/5 border border-warning/20 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-warning"
            >
                <span>
                    {t('pendingSection.title')}
                    <span className="ml-2 bg-warning/20 text-warning rounded-full px-2 py-0.5 text-xs font-medium">
                        {requests.length}
                    </span>
                </span>
                {open ? <Icon name="chevron-up" size={16} /> : <Icon name="chevron-down" size={16} />}
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
