'use client'

import { useState }                                              from 'react'
import Icon from '@/components/ui/Icon'
import { approveResidentRegistration, rejectResidentRegistration } from '@/lib/services/approval.service'
import { useAuth }                                               from '@/lib/auth/useAuth'
import { useToast }                                              from '@/components/ui/ToastProvider'
import { formatDate }                                            from '@/lib/utils'
import { useTranslations }                                       from 'next-intl'

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
            className="shrink-0 flex items-center gap-1 text-xs border rounded-lg px-2 py-1 hover:bg-gray-50 text-gray-600"
        >
            {copied ? <Icon name="check-check" size={12} className="text-green-600" /> : <Icon name="copy" size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RequestRow({ req, onAction }: { req: any; onAction: () => void }) {
    const [processing, setProcessing] = useState(false)
    const [devLink,    setDevLink]    = useState<string | null>(null)
    const { membership }              = useAuth()
    const { toast }                   = useToast()
    const t                           = useTranslations('residents.pending')

    async function handleApprove() {
        setProcessing(true)
        try {
            const { inviteLink } = await approveResidentRegistration(req.id, membership)
            toast({ message: t('approvedToast', { name: req.resident_name }), type: 'success' })
            if (IS_DEV && inviteLink) {
                setDevLink(inviteLink)
                // Don't call onAction yet — user must dismiss the dev link row
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
        if (!window.confirm(t('rejectConfirm', { name: req.resident_name }))) return
        setProcessing(true)
        try {
            await rejectResidentRegistration(req.id, membership)
            toast({ message: t('rejectedToast'), type: 'success' })
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        } finally {
            setProcessing(false)
            onAction()
        }
    }

    return (
        <>
            <tr className="border-t">
                <td className="px-4 py-3 text-sm font-medium">{req.resident_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{req.resident_email}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                    {[req.block, req.house_number].filter(Boolean).join(' / ') || '-'}
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
                                <Icon name="check" size={11} />
                                {t('approve')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex items-center gap-1 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                            >
                                <Icon name="x" size={11} />
                                {t('reject')}
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-green-600 font-medium">{t('approved')}</span>
                    )}
                </td>
            </tr>

            {devLink && (
                <tr className="bg-amber-50 border-t border-amber-200">
                    <td colSpan={5} className="px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                            [DEV] Activation Link — {req.resident_email}
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
                            {t('close')}
                        </button>
                    </td>
                </tr>
            )}
        </>
    )
}

interface ResidentPendingRequestsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requests: any[]
    loading:  boolean
    onAction: () => void
}

export default function ResidentPendingRequests({ requests, loading, onAction }: ResidentPendingRequestsProps) {
    const [open, setOpen] = useState(true)
    const t = useTranslations('residents.pending')

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
                    <Icon name="user-plus" size={16} />
                    {t('title')}
                    <span className="bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium">
                        {requests.length}
                    </span>
                </span>
                {open ? <Icon name="chevron-up" size={16} /> : <Icon name="chevron-down" size={16} />}
            </button>

            {open && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-amber-100/60 text-xs text-amber-700">
                                <th className="px-4 py-2 font-medium">{t('name')}</th>
                                <th className="px-4 py-2 font-medium">{t('email')}</th>
                                <th className="px-4 py-2 font-medium">{t('address')}</th>
                                <th className="px-4 py-2 font-medium">{t('date')}</th>
                                <th className="px-4 py-2 font-medium">{t('actions')}</th>
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