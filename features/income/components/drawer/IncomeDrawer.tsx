'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }        from 'react'
import { useTranslations } from 'next-intl'
import Can                 from '@/components/ui/Can'
import { PERMISSION }      from '@/lib/auth/types'
import Icon                from '@/components/ui/Icon'
import Ribbadge            from '@/components/ui/Ribbadge'
import { formatRupiah }    from '@/lib/utils'
import IncomeStatusBadge   from '../IncomeStatusBadge'

interface IncomeDrawerProps {
    open:            boolean
    onClose:         () => void
    row:             any
    onApprove:       (id: string) => void
    onReject:        (id: string, reason: string) => void
    approvalLoading: boolean
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs text-muted mb-0.5">{label}</p>
            <p className="text-sm text-foreground">{value || '—'}</p>
        </div>
    )
}

function ApprovalBar({
    row, onApprove, onReject, loading, t, tc,
}: {
    row: any; onApprove: (id: string) => void; onReject: (id: string, reason: string) => void
    loading: boolean; t: any; tc: any
}) {
    const [rejectMode, setRejectMode] = useState(false)
    const [reason,     setReason]     = useState('')

    if (!row || row.status !== 'pending') return null

    if (rejectMode) {
        return (
            <div className="space-y-3 pt-4 border-t border-divider">
                <p className="text-sm font-medium text-foreground">{t('approvalBar.rejectReason')}</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={t('approvalBar.rejectReasonPlaceholder')}
                    rows={3}
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm resize-none bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                    <button type="button" onClick={() => setRejectMode(false)} className="flex-1 border border-divider rounded-lg px-4 py-2 text-sm">
                        {tc('actions.cancel')}
                    </button>
                    <button type="button" onClick={() => onReject(row.id, reason)} disabled={loading} className="flex-1 bg-danger text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading && <Icon name="loader2" size={14} className="animate-spin" />}
                        {t('approvalBar.confirmReject')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3 pt-4 border-t border-divider">
            <button type="button" onClick={() => onApprove(row.id)} disabled={loading} className="flex-1 bg-success text-white rounded-lg px-4 py-3 font-medium hover:bg-success/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Icon name="loader2" size={14} className="animate-spin" />}
                {tc('actions.approve')}
            </button>
            <button type="button" onClick={() => setRejectMode(true)} disabled={loading} className="flex-1 bg-danger text-white rounded-lg px-4 py-3 font-medium hover:bg-danger/90 transition disabled:opacity-50">
                {tc('actions.reject')}
            </button>
        </div>
    )
}

export default function IncomeDrawer({
    open, onClose, row, onApprove, onReject, approvalLoading,
}: IncomeDrawerProps) {
    const t  = useTranslations('income')
    const tc = useTranslations('common')

    if (!open || !row) return null

    const statusLabel = t(`status.${row.status}` as Parameters<typeof t>[0])

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                data-testid="income-drawer"
                className="bg-surface w-full max-w-lg h-full overflow-y-auto shadow-default"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-divider flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{t('drawer.title')}</h2>
                        <p className="text-sm text-muted mt-0.5">{t('drawer.subtitle')}</p>
                    </div>
                    <button data-testid="close-drawer" onClick={onClose} className="text-subtle hover:text-foreground mt-0.5" aria-label="Tutup">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Card */}
                    <div className="relative overflow-hidden rounded-xl border border-divider bg-canvas pt-8">
                        <Ribbadge label={statusLabel} status={row.status} variant="filled" />
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Field label={t('drawer.incomeName')} value={row.income_name} />
                                </div>
                                <Field label={t('drawer.category')}
                                    value={t(`categories.${row.income_category}` as Parameters<typeof t>[0])} />
                                <Field label={t('drawer.sourceType')}
                                    value={t(`sourceTypes.${row.source_type}` as Parameters<typeof t>[0])} />
                                <div className="col-span-2">
                                    <Field label={t('drawer.payer')}
                                        value={row.is_anonymous ? tc('anonymous') : (row.payerLabel || '—')} />
                                </div>
                                <Field label={t('drawer.amount')}
                                    value={<span className="font-semibold text-primary">{formatRupiah(row.amount)}</span>} />
                                <Field label={t('drawer.receivedAt')}    value={row.formattedDate} />
                                <Field label={t('drawer.paymentMethod')}
                                    value={row.payment_method
                                        ? t(`paymentMethods.${row.payment_method}` as Parameters<typeof t>[0])
                                        : '—'} />
                                <Field label={t('drawer.referenceNumber')} value={row.reference_number} />
                                {row.notes && (
                                    <div className="col-span-2">
                                        <Field label={t('drawer.notes')} value={row.notes} />
                                    </div>
                                )}
                                {row.status === 'approved' && row.approved_at && (
                                    <div className="col-span-2 text-xs text-muted">
                                        {t('drawer.approvedAt', {
                                            date: new Date(row.approved_at).toLocaleString('id-ID'),
                                        })}
                                    </div>
                                )}
                                {row.status === 'rejected' && row.rejection_note && (
                                    <div className="col-span-2">
                                        <Field label={t('drawer.rejectionNote')} value={row.rejection_note} />
                                    </div>
                                )}
                                {row.attachment_url && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted mb-1">{t('drawer.attachment')}</p>
                                        <a
                                            href={row.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-primary underline"
                                        >
                                            Buka Lampiran
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Approval bar — visible only to users with approve/reject permission */}
                    <Can permission={PERMISSION.INCOME_APPROVE}>
                        <ApprovalBar
                            row={row}
                            onApprove={onApprove}
                            onReject={onReject}
                            loading={approvalLoading}
                            t={t}
                            tc={tc}
                        />
                    </Can>
                </div>
            </div>
        </div>
    )
}
