'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState }  from 'react'
import { useTranslations }    from 'next-intl'
import { useDataTable }       from '@/lib/hooks/useDataTable'
import { usePaymentData }     from './hooks/usePaymentData'
import { usePaymentDetail }   from './hooks/usePaymentDetail'
import { useApprovalActions } from './hooks/useApprovalAction'
import { usePaymentImport }   from './hooks/usePaymentImport'
import { useDialog }          from '@/components/ui/DialogProvider'
import { useToast }           from '@/components/ui/ToastProvider'
import { exportToCSV, exportToExcel } from '@/lib/export/export-utils'
import { buildPaymentColumns } from './components/PaymentColumns'
import PaymentView            from './PaymentView'
import { usePermission }      from '@/lib/auth/usePermission'
import { PERMISSION }         from '@/lib/auth/types'

export default function PaymentContainer() {
    const t  = useTranslations('payments')
    const tc = useTranslations('common')
    const canManage = usePermission(PERMISSION.PAYMENT_UPDATE)
    const { toast } = (useToast() as any)

    const { query, setPage, setPageSize, setSearch, setSort, setFilter } =
        useDataTable({ filters: { status: 'pending' } }, 'payments')

    const { result, loading, error, reload } = usePaymentData(query)

    const { open, selectedPayment, openDetail, closeDetail } = usePaymentDetail()
    const { prompt } = (useDialog() as any)

    const { loading: approvalLoading, approve, reject } = (useApprovalActions({
        onSuccess: () => { closeDetail(); reload() },
    }) as any)

    // Import — uses shared background import framework; progress shown in global notifications
    const {
        importOpen, openImport, closeImport,
        rows: importRows, fileName: importFileName, fileRef: importFileRef,
        importing, error: importError,
        handleFile, handleImport, downloadTemplate, resetImport,
    } = usePaymentImport(() => {
        toast({ message: t('import.jobCreated'), type: 'info', duration: 4000 })
    })

    // Approve all imported
    const [approveAllLoading, setApproveAllLoading] = useState(false)

    async function handleApproveAllImported() {
        setApproveAllLoading(true)
        try {
            const res  = await fetch('/api/payments/approve-all-imported', { method: 'POST' })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed')
            toast({ message: t('approveAllSuccess', { count: body.approved }), type: 'success' })
            reload()
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        } finally {
            setApproveAllLoading(false)
        }
    }

    // Reject / delete all imported
    const [bulkActionLoading,   setBulkActionLoading]   = useState(false)
    const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)

    async function handleRejectAllImported() {
        const reason = await prompt({
            title:            t('rejectAll.title'),
            description:      t('rejectAll.description'),
            placeholder:      t('rejectAll.placeholder'),
            confirmLabel:     t('rejectAll.confirmLabel'),
            confirmClassName: 'bg-danger hover:bg-danger/80 text-white',
        })
        if (!reason) return
        setBulkActionLoading(true)
        try {
            const res  = await fetch('/api/payments/reject-all-imported', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ reason }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed')
            toast({ message: t('rejectAllSuccess', { count: body.rejected }), type: 'success' })
            reload()
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        } finally {
            setBulkActionLoading(false)
        }
    }

    function handleDeleteAllImported() {
        setDeleteAllConfirmOpen(true)
    }

    async function confirmDeleteAll() {
        setDeleteAllConfirmOpen(false)
        setBulkActionLoading(true)
        try {
            const res  = await fetch('/api/payments/delete-all-imported', { method: 'POST' })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed')
            toast({ message: t('deleteAllSuccess', { count: body.deleted }), type: 'success' })
            reload()
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        } finally {
            setBulkActionLoading(false)
        }
    }

    async function handleApprove(payment: any) {
        await approve(payment.id)
    }

    async function handleReject(payment: any) {
        const reason = await prompt({
            title:            t('reject.title'),
            description:      t('reject.description'),
            placeholder:      t('reject.placeholder'),
            confirmLabel:     t('reject.confirmLabel'),
            confirmClassName: 'bg-danger hover:bg-danger/80 text-white',
        })
        if (!reason) return
        await reject(payment.id, reason)
    }

    // Create payment form
    const [createFormOpen, setCreateFormOpen] = useState(false)

    async function handleCreatePayment(payload: {
        residentId: string
        year:       number
        months:     number[]
        method:     string | null
        notes:      string | null
        date:       string
    }) {
        try {
            const res  = await fetch('/api/payments/create', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed')
            toast({ message: t('form.createSuccess'), type: 'success' })
            setCreateFormOpen(false)
            reload()
        } catch (err) {
            toast({ message: (err as Error).message, type: 'error' })
        }
    }

    const data = result?.data ?? []

    const importedPendingCount = canManage
        ? data.filter(r => r.status === 'pending' && r.proofUrl?.includes('-import-confirm-payment.xlsx')).length
        : 0

    const columns = useMemo(
        () => buildPaymentColumns({ t: (k: string) => t(k as any) }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <PaymentView
            result={result}
            loading={loading}
            error={error}
            reload={reload}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            setSearch={setSearch}
            setSort={setSort}
            setFilter={setFilter}
            columns={columns}
            t={t}
            tc={tc}
            drawerOpen={open}
            selectedPayment={selectedPayment}
            onRowClick={openDetail}
            onCloseDetail={closeDetail}
            onApprove={handleApprove}
            onReject={handleReject}
            approvalLoading={approvalLoading}
            onExportCSV={() => exportToCSV({ data, fileName: 'payments.csv' })}
            onExportExcel={() => exportToExcel({ data, fileName: 'payments.xlsx' })}
            // import
            importOpen={importOpen}
            openImport={openImport}
            closeImport={closeImport}
            importRows={importRows}
            importFileName={importFileName}
            importFileRef={importFileRef}
            importing={importing}
            importError={importError}
            handleFile={handleFile}
            handleImport={handleImport}
            downloadTemplate={downloadTemplate}
            resetImport={resetImport}
            // create form
            createFormOpen={createFormOpen}
            openCreateForm={() => setCreateFormOpen(true)}
            closeCreateForm={() => setCreateFormOpen(false)}
            onCreatePayment={handleCreatePayment}
            // approve all imported
            importedPendingCount={importedPendingCount}
            approveAllImported={handleApproveAllImported}
            approveAllLoading={approveAllLoading}
            // reject / delete all imported
            rejectAllImported={handleRejectAllImported}
            deleteAllImported={handleDeleteAllImported}
            confirmDeleteAll={confirmDeleteAll}
            cancelDeleteAll={() => setDeleteAllConfirmOpen(false)}
            deleteAllConfirmOpen={deleteAllConfirmOpen}
            bulkActionLoading={bulkActionLoading}
        />
    )
}
