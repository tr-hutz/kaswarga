'use client'

import type { Column } from '@/lib/types/query'
import type { ImportJob } from '@/lib/import/types'

export const STATUS_LABEL: Record<string, string> = {
    QUEUED:           'Antrian',
    PROCESSING:       'Sedang diproses',
    VALIDATING:       'Memvalidasi',
    STAGED:           'Menunggu konfirmasi',
    PROMOTING:        'Menyimpan data',
    PROMOTED:         'Disimpan',
    CANCELLED:        'Dibatalkan',
    PENDING_APPROVAL: 'Menunggu persetujuan',
    APPROVED:         'Disetujui',
    REJECTED:         'Ditolak',
    COMPLETED:        'Selesai',
    FAILED:           'Gagal',
}

export const STATUS_COLOR: Record<string, string> = {
    QUEUED:           'bg-canvas text-subtle border border-divider',
    PROCESSING:       'bg-info/10 text-info',
    VALIDATING:       'bg-info/10 text-info',
    STAGED:           'bg-warning/10 text-warning',
    PROMOTING:        'bg-info/10 text-info',
    PROMOTED:         'bg-info/10 text-info',
    CANCELLED:        'bg-canvas text-subtle border border-divider',
    PENDING_APPROVAL: 'bg-warning/10 text-warning',
    APPROVED:         'bg-success/10 text-success',
    REJECTED:         'bg-danger/10 text-danger',
    COMPLETED:        'bg-success/10 text-success',
    FAILED:           'bg-danger/10 text-danger',
}

export const TYPE_LABEL: Record<string, string> = {
    RESIDENT: 'Warga',
    PAYMENT:  'Pembayaran',
    INCOME:   'Pemasukan',
    EXPENSE:  'Pengeluaran',
}

export function buildImportJobColumns(): Column<ImportJob>[] {
    return [
        {
            key:   'filename',
            title: 'File',
            render: (job) => (
                <span className="text-sm text-foreground font-medium truncate max-w-[180px] block" title={job.filename}>
                    {job.filename}
                </span>
            ),
        },
        {
            key:   'import_type',
            title: 'Modul',
            render: (job) => (
                <span className="text-sm text-foreground">
                    {TYPE_LABEL[job.import_type] ?? job.import_type}
                </span>
            ),
        },
        {
            key:   'total_rows',
            title: 'Total',
            render: (job) => (
                <span className="text-sm text-foreground tabular-nums">
                    {job.total_rows.toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            key:   'success_rows',
            title: 'Berhasil',
            render: (job) => (
                <span className="text-sm text-success tabular-nums">
                    {job.success_rows.toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            key:   'failed_rows',
            title: 'Gagal',
            render: (job) => (
                <span className={`text-sm tabular-nums ${job.failed_rows > 0 ? 'text-danger' : 'text-muted'}`}>
                    {job.failed_rows.toLocaleString('id-ID')}
                </span>
            ),
        },
        {
            key:   'status',
            title: 'Status',
            render: (job) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[job.status] ?? 'bg-canvas text-subtle border border-divider'}`}>
                    {STATUS_LABEL[job.status] ?? job.status}
                </span>
            ),
        },
        {
            key:   'created_at',
            title: 'Tanggal',
            render: (job) => (
                <span className="text-sm text-muted">
                    {new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            ),
        },
    ]
}
