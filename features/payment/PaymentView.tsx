'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable }         from '@/components/common/data-table'
import PaymentDetailDrawer   from './components/details/PaymentDetailDrawer'
import type { Column, QueryOptions, PageResult } from '@/lib/types/query'
import type { ConfirmationRow } from './hooks/usePaymentData'

interface Props {
    result:          PageResult<ConfirmationRow> | null
    loading:         boolean
    error:           boolean
    reload:          () => void
    query:           QueryOptions
    setPage:         (p: number) => void
    setPageSize:     (s: number) => void
    setSearch:       (s: string) => void
    setSort:         (by: string, dir: 'asc' | 'desc') => void
    setFilter:       (key: string, value: unknown) => void
    columns:         Column<ConfirmationRow>[]
    data:            ConfirmationRow[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t:               (key: string, opts?: any) => string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc:              (key: string) => string
    drawerOpen:      boolean
    selectedPayment: ConfirmationRow | null
    onRowClick:      (row: ConfirmationRow) => void
    onCloseDetail:   () => void
    onApprove:       (payment: ConfirmationRow) => void
    onReject:        (payment: ConfirmationRow) => void
    approvalLoading: boolean
    onExportCSV:     () => void
    onExportExcel:   () => void
    role:            string | null | undefined
}

export default function PaymentView({
    result, loading, error, reload,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    columns, data, t, tc,
    drawerOpen, selectedPayment, onRowClick, onCloseDetail,
    onApprove, onReject, approvalLoading,
    onExportCSV, onExportExcel, role,
}: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
            </div>

            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                onSort={setSort}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={reload}
                onRowClick={onRowClick}
                renderFilters={
                    <select
                        value={String(query.filters?.status ?? 'pending')}
                        onChange={(e) => setFilter('status', e.target.value)}
                        className="h-9 rounded-lg border bg-input px-3 text-sm"
                    >
                        <option value="all">{tc('paymentStatus.all')}</option>
                        <option value="pending">{tc('paymentStatus.pending')}</option>
                        <option value="approved">{tc('paymentStatus.approved')}</option>
                        <option value="rejected">{tc('paymentStatus.rejected')}</option>
                    </select>
                }
                renderActions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onExportExcel}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportExcel')}
                        </button>
                        <button
                            onClick={onExportCSV}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportCsv')}
                        </button>
                    </div>
                }
            />

            <PaymentDetailDrawer
                open={drawerOpen}
                payment={selectedPayment}
                onClose={onCloseDetail}
                onApprove={onApprove}
                onReject={onReject}
                loading={approvalLoading}
                role={role}
            />
        </div>
    )
}
