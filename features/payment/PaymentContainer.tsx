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
import { useAuth }            from '@/lib/auth/useAuth'
import { exportToExcel, exportFileName } from '@/lib/export/export-utils'
import { logActivity }        from '@/lib/services/activity-logger'
import { buildPaymentColumns } from './components/PaymentColumns'
import PaymentView            from './PaymentView'


export default function PaymentContainer() {
    const t  = useTranslations('payments')
    const tc = useTranslations('common')
    const { toast }      = useToast()
    const { membership } = useAuth()

    const { query, setPage, setPageSize, setSearch, setSort, setFilter } =
        useDataTable({ filters: { status: 'pending' } }, 'payments')

    const { result, loading, error, reload } = usePaymentData(query)

    const { open, selectedPayment, openDetail, closeDetail } = usePaymentDetail()
    const { prompt } = useDialog()

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
            onExportExcel={async () => {
                const rtCode = membership?.rt?.code ?? undefined
                await exportToExcel({ data, fileName: exportFileName(membership?.rt?.name ?? 'RT', 'iuran'), password: rtCode })
                logActivity({
                    rtId:        membership?.rt?.id,
                    actorId:     membership?.user?.id,
                    actorName:   membership?.user?.name,
                    action:      'EXPORT',
                    entityType:  'payment_confirmations',
                    description: `${membership?.user?.name ?? 'Pengguna'} mengekspor data pembayaran`,
                })
                if (process.env.NODE_ENV === 'production' && rtCode) {
                    toast({ message: 'File dilindungi password. Gunakan kode RT untuk membuka.', type: 'success' })
                }
            }}
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
        />
    )
}
