'use client'

import Link       from 'next/link'
import Icon       from '@/components/ui/Icon'
import ProgressBar from '@/components/ui/ProgressBar'
import { useImportNotifications } from './ImportNotificationContext'
import { IMPORT_STATUS, IMPORT_TYPE, type ImportJob, type ImportStatus } from '@/lib/import/types'

const TYPE_LABEL: Record<string, string> = {
    [IMPORT_TYPE.RESIDENT]: 'Warga',
    [IMPORT_TYPE.PAYMENT]:  'Pembayaran',
    [IMPORT_TYPE.INCOME]:   'Pemasukan',
}

const APPROVAL_PATH: Record<string, string> = {
    [IMPORT_TYPE.RESIDENT]: '/residents',
    [IMPORT_TYPE.PAYMENT]:  '/payments',
    [IMPORT_TYPE.INCOME]:   '/income',
}

function statusLabel(status: string): string {
    switch (status) {
        case IMPORT_STATUS.QUEUED:           return 'Menunggu antrian...'
        case IMPORT_STATUS.PROCESSING:       return 'Memproses...'
        case IMPORT_STATUS.VALIDATING:       return 'Memvalidasi...'
        case IMPORT_STATUS.PENDING_APPROVAL: return 'Menunggu Persetujuan'
        case IMPORT_STATUS.COMPLETED:        return 'Selesai'
        case IMPORT_STATUS.FAILED:           return 'Gagal'
        case IMPORT_STATUS.REJECTED:         return 'Ditolak'
        default:                             return status
    }
}

function ImportJobCard({ job, onDismiss }: { job: ImportJob; onDismiss: () => void }) {
    const isInProgress      = ([IMPORT_STATUS.QUEUED, IMPORT_STATUS.PROCESSING, IMPORT_STATUS.VALIDATING] as ImportStatus[]).includes(job.status)
    const isPendingApproval = job.status === IMPORT_STATUS.PENDING_APPROVAL
    const isCompleted       = job.status === IMPORT_STATUS.COMPLETED
    const isFailed          = job.status === IMPORT_STATUS.FAILED || job.status === IMPORT_STATUS.REJECTED
    const isTerminal        = isCompleted || isFailed

    const typeLabel = TYPE_LABEL[job.import_type] ?? job.import_type
    const shortName = job.filename.length > 32 ? `${job.filename.slice(0, 29)}…` : job.filename

    return (
        <div className="bg-surface border border-divider rounded-xl shadow-card w-72 p-3.5 space-y-2">

            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {isInProgress && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    {isPendingApproval && (
                        <Icon name="clock"        size={16} className="text-warning  shrink-0" />
                    )}
                    {isCompleted && (
                        <Icon name="check-circle" size={16} className="text-success  shrink-0" />
                    )}
                    {isFailed && (
                        <Icon name="alert-circle" size={16} className="text-danger   shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight">
                            Impor {typeLabel}
                        </p>
                        <p className="text-xs text-muted truncate">{shortName}</p>
                    </div>
                </div>

                {isTerminal && (
                    <button
                        onClick={onDismiss}
                        aria-label="Tutup notifikasi"
                        className="p-0.5 rounded hover:bg-canvas text-subtle hover:text-foreground shrink-0"
                    >
                        <Icon name="x" size={14} />
                    </button>
                )}
            </div>

            {isInProgress && (
                <ProgressBar
                    value={job.progress_percent}
                    sublabel={
                        job.total_rows > 0
                            ? `${job.processed_rows} / ${job.total_rows} baris`
                            : statusLabel(job.status)
                    }
                />
            )}

            {isPendingApproval && (
                <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs text-warning font-medium">
                        {job.success_rows} baris menunggu
                    </span>
                    <Link
                        href={APPROVAL_PATH[job.import_type] ?? '/'}
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        Tinjau →
                    </Link>
                </div>
            )}

            {isCompleted && (
                <p className="text-xs text-success">
                    {job.success_rows} baris berhasil diimpor
                </p>
            )}

            {isFailed && (
                <p className="text-xs text-danger">
                    {job.status === IMPORT_STATUS.REJECTED
                        ? 'Import ditolak'
                        : job.failed_rows > 0
                            ? `${job.failed_rows} baris gagal`
                            : 'Import gagal'}
                </p>
            )}
        </div>
    )
}

export default function ImportNotifications() {
    const { jobs, dismissJob } = useImportNotifications()

    if (jobs.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
            {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="pointer-events-auto">
                    <ImportJobCard
                        job={job}
                        onDismiss={() => dismissJob(job.id)}
                    />
                </div>
            ))}
        </div>
    )
}
