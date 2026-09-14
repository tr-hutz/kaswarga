'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase }                          from '@/lib/supabase'
import { useAuth }                           from '@/lib/auth/useAuth'
import { useToast }                          from '@/components/ui/ToastProvider'
import Icon                                  from '@/components/ui/Icon'
import { IMPORT_STATUS, type ImportJob, type ImportJobRow, type ImportType } from '@/lib/import/types'

interface Props {
    importType:  ImportType
    onConfirmed?: () => void
}

interface JobDetail {
    job:       ImportJob
    errorRows: ImportJobRow[]
}

const TYPE_LABEL: Record<string, string> = {
    RESIDENT: 'Warga',
    PAYMENT:  'Pembayaran',
    INCOME:   'Pemasukan',
    EXPENSE:  'Pengeluaran',
}

export default function ImportConfirmationBanner({ importType, onConfirmed }: Props) {
    const { rtId, user }                    = useAuth()
    const { toast }                         = useToast()
    const [jobs, setJobs]                   = useState<ImportJob[]>([])
    const [expanded, setExpanded]           = useState<string | null>(null)
    const [detail, setDetail]               = useState<JobDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [acting, setActing]               = useState<'confirm' | 'cancel' | null>(null)

    const loadStagedJobs = useCallback(async () => {
        if (!rtId || !user?.id) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from('import_jobs')
            .select('*')
            .eq('rt_id', rtId)
            .eq('import_type', importType)
            .eq('status', IMPORT_STATUS.STAGED)
            .order('created_at', { ascending: false })
            .limit(10)
        setJobs((data ?? []) as ImportJob[])
    }, [rtId, importType, user?.id])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadStagedJobs() }, [loadStagedJobs])

    // Realtime — keep list fresh
    useEffect(() => {
        if (!rtId) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(`import-confirm-banner:${importType}:${rtId}`)
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'import_jobs',
                filter: `rt_id=eq.${rtId}`,
            }, () => { loadStagedJobs() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [rtId, importType, loadStagedJobs])

    async function loadDetail(jobId: string) {
        if (expanded === jobId) { setExpanded(null); setDetail(null); return }
        setExpanded(jobId)
        setLoadingDetail(true)
        try {
            const res = await fetch(`/api/import/${jobId}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const d: JobDetail = await res.json()
            setDetail(d)
        } catch {
            toast({ type: 'error', message: 'Gagal memuat detail import' })
        } finally {
            setLoadingDetail(false)
        }
    }

    async function handleConfirm(jobId: string) {
        setActing('confirm')
        try {
            const res = await fetch(`/api/import/${jobId}/confirm`, { method: 'POST' })
            if (!res.ok) {
                let msg = `Gagal mengkonfirmasi import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON */ }
                throw new Error(msg)
            }
            toast({ type: 'success', message: 'Import dikonfirmasi — menunggu persetujuan' })
            setExpanded(null)
            setDetail(null)
            loadStagedJobs()
            onConfirmed?.()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    async function handleCancel(jobId: string) {
        setActing('cancel')
        try {
            const res = await fetch(`/api/import/${jobId}/cancel`, { method: 'POST' })
            if (!res.ok) {
                let msg = `Gagal membatalkan import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON */ }
                throw new Error(msg)
            }
            toast({ type: 'success', message: 'Import dibatalkan' })
            setExpanded(null)
            setDetail(null)
            loadStagedJobs()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    if (jobs.length === 0) return null

    const typeLabel = TYPE_LABEL[importType] ?? importType
    const job       = jobs[0]

    const allRows    = detail?.errorRows ?? []
    const validRows  = allRows.filter(r => r.status === 'VALID')
    const invalid    = allRows.filter(r => r.status === 'INVALID')
    const skipped    = allRows.filter(r => r.status === 'SKIPPED')

    const isExpanded = expanded === job.id

    return (
        <div className="rounded-xl border border-info/40 bg-info/5 mb-4">

            {/* Header row */}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Icon name="upload" size={18} className="text-info shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {jobs.length === 1
                                ? 'Data import siap dikonfirmasi'
                                : `${jobs.length} data import siap dikonfirmasi`}
                        </p>
                        <p className="text-xs text-muted">
                            {job.success_rows} baris valid
                            {job.failed_rows > 0 && `, ${job.failed_rows} tidak valid`}
                            {' — '}
                            {job.filename}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => loadDetail(job.id)}
                        className="text-xs text-info hover:underline"
                    >
                        {isExpanded ? 'Tutup' : 'Lihat detail'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCancel(job.id)}
                        disabled={!!acting}
                        className="border border-divider rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-canvas disabled:opacity-50"
                    >
                        Batalkan
                    </button>
                    <button
                        type="button"
                        onClick={() => handleConfirm(job.id)}
                        disabled={!!acting || job.success_rows === 0}
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {acting === 'confirm' && (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Simpan {typeLabel} ({job.success_rows})
                    </button>
                </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
                <div className="border-t border-info/20 px-4 py-3 space-y-2">
                    {loadingDetail ? (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-info border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted">
                                Menyimpan data akan memasukkan <span className="font-semibold text-foreground">{job.success_rows} baris valid</span> ke tabel {typeLabel.toLowerCase()}.
                                Data belum dianggap disetujui sampai PIC menyetujuinya.
                            </p>

                            {invalid.length > 0 && (
                                <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                                    <p className="text-xs font-semibold text-danger mb-1">
                                        {invalid.length} baris tidak valid (tidak akan disimpan)
                                    </p>
                                    <ul className="text-xs text-danger/80 space-y-0.5">
                                        {invalid.slice(0, 3).map(r => (
                                            <li key={r.id}>Baris {r.row_number}: {r.error_message}</li>
                                        ))}
                                        {invalid.length > 3 && <li>... dan {invalid.length - 3} baris lainnya</li>}
                                    </ul>
                                </div>
                            )}

                            {skipped.length > 0 && (
                                <p className="text-xs text-warning">
                                    {skipped.length} baris dilewati (duplikat)
                                </p>
                            )}

                            {validRows.length > 0 && (
                                <p className="text-xs text-muted">
                                    {validRows.length} baris valid siap disimpan. Setelah disimpan, PIC akan mendapat notifikasi untuk persetujuan.
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Multiple staged jobs hint */}
            {jobs.length > 1 && (
                <div className="border-t border-info/20 px-4 py-2 text-xs text-muted">
                    +{jobs.length - 1} import lain menunggu konfirmasi
                </div>
            )}
        </div>
    )
}
