'use client'

import { useState, useEffect }    from 'react'
import Icon                        from '@/components/ui/Icon'
import { useToast }                from '@/components/ui/ToastProvider'
import { useAuth }                 from '@/lib/auth/useAuth'
import type { ImportJob, ImportJobRow } from '@/lib/import/types'

interface Props {
    jobId:    string
    onClose:  () => void
    onDone:   () => void
}

interface JobDetail {
    job:       ImportJob
    errorRows: ImportJobRow[]
}

const STATUS_LABEL: Record<string, string> = {
    VALID:   'Valid',
    INVALID: 'Tidak Valid',
    SKIPPED: 'Dilewati',
}

const STATUS_COLOR: Record<string, string> = {
    VALID:   'text-success',
    INVALID: 'text-danger',
    SKIPPED: 'text-warning',
}

const TYPE_LABEL: Record<string, string> = {
    RESIDENT: 'Warga',
    PAYMENT:  'Pembayaran',
    INCOME:   'Pemasukan',
    EXPENSE:  'Pengeluaran',
}

export default function ImportApprovalModal({ jobId, onClose, onDone }: Props) {
    const { toast }              = useToast()
    const { user }               = useAuth()
    const userId: string | undefined = user?.id
    const [detail, setDetail]    = useState<JobDetail | null>(null)
    const [loading, setLoading]  = useState(true)
    const [acting,  setActing]   = useState<'approve' | 'reject' | null>(null)
    const [reason,  setReason]   = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)

    useEffect(() => {
        fetch(`/api/import/${jobId}`)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
            .then((d: JobDetail) => setDetail(d))
            .catch(() => toast({ type: 'error', message: 'Gagal memuat detail import' }))
            .finally(() => setLoading(false))
    }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

    async function handleApprove() {
        setActing('approve')
        try {
            const res = await fetch(`/api/import/${jobId}/approve`, { method: 'POST' })
            if (!res.ok) {
                let msg = `Gagal menyetujui import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON body */ }
                throw new Error(msg)
            }
            const body = await res.json().catch(() => ({ approved: validRows.length }))
            // New flow returns `approved`, legacy returns `persisted`
            const count = body.approved ?? body.persisted ?? validRows.length
            if (count === 0 && !body.approved) {
                const reasons = body.rejected ? Object.keys(body.rejected).join(', ') : ''
                const detail  = reasons ? ` (${reasons})` : ''
                toast({ type: 'error', message: `Tidak ada baris yang diimpor${detail}. Coba lagi atau hubungi administrator.` })
            } else {
                toast({ type: 'success', message: `Import disetujui — ${count} data berhasil diproses` })
            }
            onDone()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    async function handleReject() {
        setActing('reject')
        try {
            const res = await fetch(`/api/import/${jobId}/reject`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ reason: reason.trim() || undefined }),
            })
            if (!res.ok) {
                let msg = `Gagal menolak import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON body */ }
                throw new Error(msg)
            }
            toast({ type: 'success', message: 'Import ditolak' })
            onDone()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    const job = detail?.job
    const allRows = detail?.errorRows ?? []
    const validRows   = allRows.filter(r => r.status === 'VALID')
    const invalidRows = allRows.filter(r => r.status === 'INVALID')
    const skippedRows = allRows.filter(r => r.status === 'SKIPPED')

    const totalAmount = job?.import_type === 'PAYMENT'
        ? validRows.reduce((sum, row) => {
            const raw = row.raw_data as Record<string, string> | null
            return sum + (parseInt((raw?.amount ?? '').replace(/[^0-9]/g, ''), 10) || 0)
        }, 0)
        : null

    const isSelfApproval = !!userId && !!job?.created_by && userId === job.created_by

    function downloadErrors() {
        const rows = [...invalidRows, ...skippedRows]
        if (rows.length === 0) return
        const firstData = rows[0].raw_data as Record<string, string> | null
        const cols = firstData ? ['row_number', 'status', 'error_code', 'error_message', ...Object.keys(firstData)] : ['row_number', 'status', 'error_code', 'error_message']
        const csv = [
            cols.join(','),
            ...rows.map(r => {
                const data = r.raw_data as Record<string, string> | null
                return cols.map(c => {
                    const val = c === 'row_number' ? String(r.row_number)
                        : c === 'status' ? r.status
                        : c === 'error_code' ? (r.error_code ?? '')
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
        a.download = `import-errors-${jobId.slice(0, 8)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const columns = validRows.length > 0 && validRows[0].raw_data
        ? Object.keys(validRows[0].raw_data as Record<string, string>)
        : []

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-card w-full max-w-3xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Tinjau Import {job ? TYPE_LABEL[job.import_type] ?? job.import_type : ''}
                        </h2>
                        {job && (
                            <p className="text-xs text-muted mt-0.5">{job.filename}</p>
                        )}
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

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !job ? (
                        <p className="text-sm text-danger text-center py-8">Gagal memuat data import.</p>
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="flex flex-wrap gap-4 p-4 bg-canvas rounded-lg border border-divider text-sm">
                                <div>
                                    <p className="text-xs text-muted">Total baris</p>
                                    <p className="font-semibold text-foreground">{job.total_rows}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted">Valid</p>
                                    <p className="font-semibold text-success">{validRows.length}</p>
                                </div>
                                {invalidRows.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted">Tidak valid</p>
                                        <p className="font-semibold text-danger">{invalidRows.length}</p>
                                    </div>
                                )}
                                {skippedRows.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted">Dilewati</p>
                                        <p className="font-semibold text-warning">{skippedRows.length}</p>
                                    </div>
                                )}
                                {totalAmount !== null && (
                                    <div>
                                        <p className="text-xs text-muted">Total nominal</p>
                                        <p className="font-semibold text-foreground">
                                            Rp{totalAmount.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted">Diunggah</p>
                                    <p className="font-semibold text-foreground">
                                        {new Date(job.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                    </p>
                                </div>
                            </div>

                            {/* Row preview */}
                            {validRows.length > 0 && columns.length > 0 && (
                                <div className="rounded-lg border border-divider overflow-hidden">
                                    <div className="px-3 py-2 bg-canvas border-b border-divider flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted uppercase tracking-wide">
                                            Data yang akan diimpor ({validRows.length} baris)
                                        </p>
                                    </div>
                                    <div className="overflow-auto max-h-60">
                                        <table className="w-full text-xs">
                                            <thead className="bg-canvas text-muted uppercase tracking-wide sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 text-left w-8 font-medium">#</th>
                                                    {columns.map(col => (
                                                        <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-divider">
                                                {validRows.slice(0, 100).map((row, i) => {
                                                    const data = row.raw_data as Record<string, string> | null
                                                    return (
                                                        <tr key={row.id} className="hover:bg-canvas">
                                                            <td className="px-3 py-2 text-subtle">{i + 1}</td>
                                                            {columns.map(col => (
                                                                <td key={col} className="px-3 py-2 text-foreground whitespace-nowrap">
                                                                    {data?.[col] ?? <span className="text-subtle">-</span>}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                        {validRows.length > 100 && (
                                            <p className="text-xs text-muted text-center py-2">
                                                ... dan {validRows.length - 100} baris lainnya
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Invalid rows */}
                            {invalidRows.length > 0 && (
                                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-danger">
                                            {invalidRows.length} baris tidak valid (tidak akan diimpor)
                                        </p>
                                        <button
                                            type="button"
                                            onClick={downloadErrors}
                                            className="flex items-center gap-1 text-xs text-danger hover:underline"
                                        >
                                            <Icon name="download" size={12} />
                                            Unduh laporan error
                                        </button>
                                    </div>
                                    <ul className="text-xs text-danger/80 space-y-1">
                                        {invalidRows.slice(0, 5).map(row => (
                                            <li key={row.id}>
                                                Baris {row.row_number}: {row.error_message}
                                            </li>
                                        ))}
                                        {invalidRows.length > 5 && (
                                            <li>... dan {invalidRows.length - 5} baris lainnya</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Reject reason form */}
                            {showRejectForm && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">Alasan penolakan (opsional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Tulis alasan penolakan..."
                                        className="w-full px-3 py-2 text-sm border border-divider rounded-lg bg-canvas text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    />
                                </div>
                            )}
                        </>
                    )}

                </div>

                {/* Footer */}
                {!loading && job && (
                    <div className="flex flex-col gap-3 px-6 py-4 border-t border-divider">
                        {isSelfApproval && (
                            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
                                <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0" />
                                <span>
                                    Anda tidak dapat menyetujui import milik sendiri.
                                    Minta pengguna lain dengan akses persetujuan untuk meninjau batch ini.
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-muted">
                            {validRows.length} dari {job.total_rows} baris akan diimpor
                        </div>
                        <div className="flex items-center gap-2">
                            {showRejectForm ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => { setShowRejectForm(false); setReason('') }}
                                        disabled={!!acting}
                                        className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReject}
                                        disabled={acting === 'reject'}
                                        className="bg-danger hover:bg-danger/90 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {acting === 'reject' && (
                                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        Konfirmasi Tolak
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={!!acting}
                                        className="border border-divider rounded-lg px-4 py-2 text-sm text-muted hover:bg-canvas disabled:opacity-50"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApprove}
                                        disabled={acting === 'approve' || validRows.length === 0 || isSelfApproval}
                                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {acting === 'approve' && (
                                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        Setujui Semua ({validRows.length} baris)
                                    </button>
                                </>
                            )}
                        </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL }
