'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import type { ImportJob } from '@/lib/import/types'

export function useImportManagementActions({ onReload }: { onReload: () => void }) {
    const { toast } = useToast()

    const [selectedJob,      setSelectedJob]      = useState<ImportJob | null>(null)
    const [detailOpen,       setDetailOpen]       = useState(false)
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [acting,           setActing]           = useState<string | null>(null)

    function openDetail(job: ImportJob) {
        setSelectedJob(job)
        setDetailOpen(true)
    }

    function closeDetail() {
        setDetailOpen(false)
        setSelectedJob(null)
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
            closeDetail()
            onReload()
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
            closeDetail()
            onReload()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    async function handleApprove(jobId: string) {
        setActing('approve')
        try {
            const res = await fetch(`/api/import/${jobId}/approve`, { method: 'POST' })
            if (!res.ok) {
                let msg = `Gagal menyetujui import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON */ }
                throw new Error(msg)
            }
            const body  = await res.json().catch(() => ({}))
            const count = body.approved ?? 0
            toast({ type: 'success', message: `Import disetujui — ${count} data berhasil diproses` })
            closeDetail()
            onReload()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    async function handleReject(jobId: string, reason: string) {
        setActing('reject')
        try {
            const res = await fetch(`/api/import/${jobId}/reject`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ reason: reason.trim() || undefined }),
            })
            if (!res.ok) {
                let msg = `Gagal menolak import (${res.status})`
                try { const b = await res.json(); msg = b.error || msg } catch { /* non-JSON */ }
                throw new Error(msg)
            }
            toast({ type: 'success', message: 'Import ditolak' })
            closeDetail()
            onReload()
        } catch (err) {
            toast({ type: 'error', message: (err as Error).message })
        } finally {
            setActing(null)
        }
    }

    return {
        selectedJob,
        detailOpen,
        openDetail,
        closeDetail,
        importDialogOpen,
        openImportDialog:  () => setImportDialogOpen(true),
        closeImportDialog: () => setImportDialogOpen(false),
        acting,
        handleConfirm,
        handleCancel,
        handleApprove,
        handleReject,
    }
}
