'use client'

import { useMemo }            from 'react'
import { useTranslations }    from 'next-intl'
import { useDataTable }       from '@/hooks/useDataTable'
import { usePaymentData }     from './hooks/usePaymentData'
import { usePaymentDetail }   from './hooks/usePaymentDetail'
import { useApprovalActions } from './hooks/useApprovalAction'
import { useDialog }          from '@/components/ui/DialogProvider'
import { exportToCSV, exportToExcel } from '@/lib/export/export-utils'
import { buildPaymentColumns } from './components/PaymentColumns'
import PaymentView            from './PaymentView'

export default function PaymentContainer() {
    const t  = useTranslations('payments')
    const tc = useTranslations('common')

    const { query, setPage, setPageSize, setSearch, setSort, setFilter } =
        useDataTable({ filters: { status: 'pending' } }, 'payments')

    const { result, loading, error, reload } = usePaymentData(query)

    const { open, selectedPayment, openDetail, closeDetail } = usePaymentDetail()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { prompt } = useDialog() as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { loading: approvalLoading, approve, reject } = useApprovalActions({
        onSuccess: () => { closeDetail(); reload() },
    }) as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleApprove(payment: any) {
        await approve(payment.id)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const data = result?.data ?? []

    const columns = useMemo(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            data={data}
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
        />
    )
}
