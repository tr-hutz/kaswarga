'use client'

import { useState, useEffect } from 'react'
import { useTranslations }     from 'next-intl'
import Icon                    from '@/components/ui/Icon'
import { usePermission }       from '@/lib/auth/usePermission'
import { useAuth }             from '@/lib/auth/useAuth'
import { PERMISSION }          from '@/lib/auth/types'
import {
    IMPORT_STATUS,
    type ImportJob,
    type ImportJobRow,
} from '@/lib/import/types'
import { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from './ImportJobColumns'

const IN_PROGRESS_STATUSES = new Set<string>([
    IMPORT_STATUS.QUEUED,
    IMPORT_STATUS.PROCESSING,
    IMPORT_STATUS.VALIDATING,
    IMPORT_STATUS.PROMOTING,
    IMPORT_STATUS.PROMOTED,
])

interface JobDetail {
    job:       ImportJob
    errorRows: ImportJobRow[]
}

interface Props {
    open:      boolean
    job:       ImportJob | null
    onClose:   () => void
    onConfirm: (jobId: string) => void
    onCancel:  (jobId: string) => void
    onApprove: (jobId: string) => void
    onReject:  (jobId: string, reason: string) => void
    acting:    string | null
}

export default function ImportDetailDrawer({
    open, job, onClose, onConfirm, onCancel, onApprove, onReject, acting,
}: Props) {
    const t   = useTranslations('importManagement.detail')
    const { user } = useAuth()
    const [detail, setDetail] = useState<JobDetail | null>(null)
    const [showReject, setShowReject] = useState(false)
    const [reason, setReason]     = useState('')

    /* Approve permission check — depends on import_type */
    const canApprovePayment = usePermission(PERMISSION.PAYMENT_IMPORT_APPROVE)
    const canApproveIncome  = usePermission(PERMISSION.INCOME_APPROVE)
    const canApproveExpense = usePermission(PERMISSION.EXPENSE_APPROVE)

    /* Import permission check — needed to show Confirm/Cancel */
    const canConfirmPayment  = usePermission(PERMISSION.PAYMENT_IMPORT)
    const canConfirmIncome   = usePermission(PERMISSION.INCOME_IMPORT)
    const canConfirmExpense  = usePermission(PERMISSION.EXPENSE_IMPORT)
    const canConfirmResident = usePermission(PERMISSION.RESIDENT_IMPORT)

    const approvePermMap: Record<string, boolean> = {
        PAYMENT: canApprovePayment,
        INCOME:  canApproveIncome,
        EXPENSE: canApproveExpense,
        RESIDENT: false,
    }

    const confirmPermMap: Record<string, boolean> = {
        PAYMENT:  canConfirmPayment,
        INCOME:   canConfirmIncome,
        EXPENSE:  canConfirmExpense,
        RESIDENT: canConfirmResident,
    }

    useEffect(() => {
        if (!open || !job) return
        const jobId = job.id
        fetch(`/api/import/${jobId}`)
            .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
            .then((d: JobDetail) => setDetail(d))
            .catch(() => setDetail(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, job?.id])

    if (!open || !job) return null

    const safeJob       = job
    const detail_job    = detail?.job ?? safeJob
    const allRows       = detail?.errorRows ?? []
    const validRows     = allRows.filter(r => r.status === 'VALID')
    const invalidRows   = allRows.filter(r => r.status === 'INVALID')
    const skippedRows   = allRows.filter(r => r.status === 'SKIPPED')

    const isInProgress  = IN_PROGRESS_STATUSES.has(detail_job.status)
    const isStaged      = detail_job.status === IMPORT_STATUS.STAGED
    const isPending     = detail_job.status === IMPORT_STATUS.PENDING_APPROVAL

    const canConfirm = isStaged && !!confirmPermMap[detail_job.import_type]
    const canApprove = isPending && !!approvePermMap[detail_job.import_type]
    const isSelfApproval = !!user?.id && !!detail_job.created_by && user.id === detail_job.created_by

    function downloadErrors() {
        const rows = [...invalidRows, ...skippedRows]
        if (rows.length === 0) return
        const firstData = rows[0].raw_data as Record<string, string> | null
        const cols = firstData
            ? ['row_number', 'status', 'error_code', 'error_message', ...Object.keys(firstData)]
            : ['row_number', 'status', 'error_code', 'error_message']
        const csv = [
            cols.join(','),
            ...rows.map(r => {
                const data = r.raw_data as Record<string, string> | null
                return cols.map(c => {
                    const val = c === 'row_number' ? String(r.row_number)
                        : c === 'status'        ? r.status
                        : c === 'error_code'    ? (r.error_code    ?? '')
                        : c === 'error_message' ? (r.error_message ?? '')
                        : (data?.[c] ?? '')
                    return `"${val.replace(/"/g, '""')}"`
                }).join(',')
            }),
        ].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `import-errors-${safeJob.id.slice(0, 8)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-surface rounded-t-2xl sm:rounded-xl shadow-card w-full sm:max-w-2xl max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            {t('title')} — {TYPE_LABEL[detail_job.import_type] ?? detail_job.import_type}
                        </h2>
                        <p className="text-xs text-muted mt-0.5">{detail_job.filename}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={!!acting}
                        className="p-1.5 rounded-lg hover:bg-canvas text-subtle hover:text-foreground disabled:opacity-40"
                    >
                        <Icon name="x" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* Summary grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-canvas rounded-lg border border-divider text-sm">
                        <div>
                            <p className="text-xs text-muted">{t('status')}</p>
                            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[detail_job.status] ?? 'bg-canvas text-subtle border border-divider'}`}>
                                {STATUS_LABEL[detail_job.status] ?? detail_job.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-muted">{t('totalRows')}</p>
                            <p className="font-semibold text-foreground mt-0.5">{detail_job.total_rows.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">{t('successRows')}</p>
                            <p className="font-semibold text-success mt-0.5">{detail_job.success_rows.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">{t('failedRows')}</p>
                            <p className={`font-semibold mt-0.5 ${detail_job.failed_rows > 0 ? 'text-danger' : 'text-muted'}`}>
                                {detail_job.failed_rows.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted">{t('date')}</p>
                            <p className="font-semibold text-foreground mt-0.5">
                                {new Date(detail_job.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </p>
                        </div>
                        {detail_job.confirmed_at && (
                            <div>
                                <p className="text-xs text-muted">Dikonfirmasi</p>
                                <p className="font-semibold text-foreground mt-0.5">
                                    {new Date(detail_job.confirmed_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* In-progress indicator */}
                    {isInProgress && (
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-info/30 bg-info/5 text-sm text-info">
                            <div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin shrink-0" />
                            <span>{STATUS_LABEL[detail_job.status] ?? 'Sedang diproses'}...</span>
                        </div>
                    )}

                    {/* Staged contextual message */}
                    {isStaged && (
                        <div className="p-4 rounded-lg border border-warning/30 bg-warning/5 text-sm text-warning">
                            <p className="font-medium mb-1">{t('staged.description')}</p>
                            <p className="text-xs text-muted">{t('staged.note')}</p>
                        </div>
                    )}

                    {/* Invalid rows — shown once detail has loaded */}
                    {invalidRows.length > 0 ? (
                        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-danger">
                                    {t('errorRows', { count: invalidRows.length })}
                                </p>
                                <button
                                    type="button"
                                    onClick={downloadErrors}
                                    className="flex items-center gap-1 text-xs text-danger hover:underline"
                                >
                                    <Icon name="download" size={12} />
                                    {t('downloadErrors')}
                                </button>
                            </div>
                            <ul className="text-xs text-danger/80 space-y-1">
                                {invalidRows.slice(0, 5).map(row => (
                                    <li key={row.id}>Baris {row.row_number}: {row.error_message}</li>
                                ))}
                                {invalidRows.length > 5 && (
                                    <li>... dan {invalidRows.length - 5} baris lainnya</li>
                                )}
                            </ul>
                        </div>
                    ) : null}

                    {/* Skipped rows summary */}
                    {skippedRows.length > 0 && (
                        <p className="text-xs text-warning">
                            {skippedRows.length} baris dilewati (duplikat)
                        </p>
                    )}

                    {/* Self-approval warning */}
                    {canApprove && isSelfApproval && (
                        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
                            <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0" />
                            <span>{t('selfApprovalWarning')}</span>
                        </div>
                    )}

                    {/* Reject reason textarea */}
                    {showReject && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">
                                {t('actions.rejectReason')}
                            </label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                                placeholder={t('actions.rejectPlaceholder')}
                                className="w-full px-3 py-2 text-sm border border-divider rounded-lg bg-canvas text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {!isInProgress && (
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-divider shrink-0">
                        <div className="text-xs text-muted">
                            {validRows.length > 0
                                ? `${validRows.length.toLocaleString('id-ID')} baris valid`
                                : detail_job.success_rows > 0
                                ? `${detail_job.success_rows.toLocaleString('id-ID')} baris berhasil`
                                : null}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* STAGED: confirm + cancel */}
                            {canConfirm && isStaged && !showReject && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onCancel(safeJob.id)}
                                        disabled={!!acting}
                                        className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas disabled:opacity-50"
                                    >
                                        {t('actions.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onConfirm(safeJob.id)}
                                        disabled={!!acting || detail_job.success_rows === 0}
                                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {acting === 'confirm' && (
                                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        {t('actions.confirm')}
                                    </button>
                                </>
                            )}

                            {/* PENDING_APPROVAL: approve + reject */}
                            {canApprove && isPending && !isSelfApproval && (
                                showReject ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setShowReject(false); setReason('') }}
                                            disabled={!!acting}
                                            className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas disabled:opacity-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onReject(safeJob.id, reason)}
                                            disabled={acting === 'reject'}
                                            className="bg-danger hover:bg-danger/90 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {acting === 'reject' && (
                                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            {t('actions.confirmReject')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowReject(true)}
                                            disabled={!!acting}
                                            className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas disabled:opacity-50"
                                        >
                                            {t('actions.rejectAll')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onApprove(safeJob.id)}
                                            disabled={acting === 'approve' || detail_job.success_rows === 0}
                                            className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {acting === 'approve' && (
                                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                            )}
                                            {t('actions.approveAll', { count: detail_job.success_rows.toLocaleString('id-ID') })}
                                        </button>
                                    </>
                                )
                            )}

                            {/* Default: just close */}
                            {!canConfirm && !canApprove && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas"
                                >
                                    Tutup
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
