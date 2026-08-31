'use client'

import { formatRupiah }    from '../../../../lib/utils'
import ExpenseApprovalBar  from '../approval/ExpenseApprovalBar'
import { useTranslations } from 'next-intl'
import Can                 from '@/components/ui/Can'
import { PERMISSION }      from '@/lib/auth/types'
import Icon                from '@/components/ui/Icon'
import Ribbon            from '@/components/ui/Ribbon'
import { useKeyDown }      from '@/lib/hooks/useKeyDown'

interface ExpenseDrawerProps {
    open:            boolean
    onClose:         () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row:             any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onApprove:       (r: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReject:        (r: any, reason?: string) => void
    approvalLoading: boolean
}

export default function ExpenseDrawer({
    open,
    onClose,
    row,
    onApprove,
    onReject,
    approvalLoading,
}: ExpenseDrawerProps) {

    const t  = useTranslations('expenses')
    const tc = useTranslations('common')

    useKeyDown(open, { Escape: onClose })

    if (!open || !row) return null

    const approvedAtLabel = row.approvedAt
        ? new Date(row.approvedAt).toLocaleString('id-ID')
        : null

    const statusLabel = tc(`expenseStatus.${row.status}` as Parameters<typeof tc>[0])

    return (
        <div
            data-testid="expense-drawer"
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                className="bg-surface w-full max-w-lg h-full overflow-y-auto shadow-default"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-divider flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{t('drawer.title')}</h2>
                        <p className="text-sm text-muted mt-0.5">{t('drawer.subtitle')}</p>
                    </div>
                    <button
                        data-testid="close-drawer"
                        onClick={onClose}
                        className="text-subtle hover:text-foreground mt-0.5"
                        aria-label="Tutup"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Card */}
                    <div className="relative overflow-hidden rounded-xl border border-divider bg-canvas pt-8">
                        <Ribbon label={statusLabel} status={row.status} variant="filled" />

                        <div className="p-5 space-y-5">
                            {/* 2-col grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Field label={t('drawer.receiptNumber')} value={row.receiptNumber || '—'} />
                                </div>
                                <Field label={t('drawer.date')}     value={row.dateLabel || row.date} />
                                <Field label={t('drawer.category')} value={row.category || '—'} />
                                <Field label={t('drawer.amount')}   value={`Rp ${formatRupiah(row.amount)}`} />
                                {row.recipient
                                    ? <Field label={t('drawer.recipient')} value={row.recipient} />
                                    : <div />
                                }
                                {row.description && (
                                    <div className="col-span-2">
                                        <Field label={t('drawer.description')} value={row.description} />
                                    </div>
                                )}
                            </div>

                            {/* Status info */}
                            {row.status === 'approved' && approvedAtLabel && (
                                <div className="p-4 bg-success/5 rounded-lg border border-success/20 text-sm text-success">
                                    {t('drawer.approvedAt', { date: approvedAtLabel })}
                                </div>
                            )}

                            {row.status === 'rejected' && (
                                <div className="p-4 bg-danger/5 rounded-lg border border-danger/20 text-sm text-danger space-y-1">
                                    <p className="font-medium">{t('drawer.alasanDitolak')}</p>
                                    {row.rejectionNote && (
                                        <p className="text-danger/80">{row.rejectionNote}</p>
                                    )}
                                </div>
                            )}

                            {/* Nota */}
                            {row.receiptUrl && (
                                <div>
                                    <p className="text-sm text-muted mb-2">{t('drawer.receipt')}</p>
                                    {row.receiptUrl.endsWith('.pdf') ? (
                                        <a
                                            href={row.receiptUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary text-sm underline"
                                        >
                                            {t('drawer.receiptPdf')}
                                        </a>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={row.receiptUrl}
                                            alt="Nota"
                                            className="rounded-lg border border-divider w-full object-contain"
                                        />
                                    )}
                                </div>
                            )}

                            <Can permission={PERMISSION.EXPENSE_APPROVE}>
                                <ExpenseApprovalBar
                                    row={row}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    loading={approvalLoading}
                                />
                            </Can>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-sm text-muted">{label}</p>
            <p className="font-medium text-foreground">{value}</p>
        </div>
    )
}
