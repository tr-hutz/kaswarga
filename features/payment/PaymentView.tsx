'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { usePermission }        from '@/lib/auth/usePermission'
import { PERMISSION }           from '@/lib/auth/types'
import Can                      from '@/components/ui/Can'
import { DataTable }            from '@/components/common/data-table'
import PaymentDetailDrawer      from './components/details/PaymentDetailDrawer'
import PaymentImportModal       from './components/import/PaymentImportModal'
import PaymentForm              from './components/forms/PaymentForm'
import ImportApprovalBanner     from '@/components/import/ImportApprovalBanner'
import ImportConfirmationBanner from '@/components/import/ImportConfirmationBanner'
import { IMPORT_TYPE }          from '@/lib/import/types'
import ExportDropdown           from '@/components/ui/ExportDropdown'
import Icon                     from '@/components/ui/Icon'
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
    t:               (key: string, opts?: any) => string
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
    // import
    importOpen:      boolean
    openImport:      () => void
    closeImport:     () => void
    importRows:      unknown[]
    importFileName:  string | null
    importFileRef:   React.RefObject<HTMLInputElement | null>
    importing:       boolean
    importError:     string
    handleFile:      (file: File | undefined) => void
    handleImport:    () => void
    downloadTemplate: () => void
    resetImport:     () => void
    // create form
    createFormOpen:   boolean
    openCreateForm:   () => void
    closeCreateForm:  () => void
    onCreatePayment:  (payload: {
        residentId: string
        year:       number
        months:     number[]
        method:     string | null
        notes:      string | null
        date:       string
    }) => Promise<void>
}

export default function PaymentView({
    result, loading, error, reload,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    columns, t, tc,
    drawerOpen, selectedPayment, onRowClick, onCloseDetail,
    onApprove, onReject, approvalLoading,
    onExportCSV, onExportExcel,
    importOpen, openImport, closeImport,
    importRows, importFileName, importFileRef,
    importing, importError, handleFile, handleImport, downloadTemplate, resetImport,
    createFormOpen, openCreateForm, closeCreateForm, onCreatePayment,
}: Props) {
    const canExport = usePermission(PERMISSION.DASHBOARD_PAYMENT_EXPORT)

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Can permission={PERMISSION.PAYMENT_CREATE}>
                        <button
                            onClick={openCreateForm}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                        >
                            <Icon name="plus" size={16} />
                            {t('addButton')}
                        </button>
                    </Can>
                </div>
            </div>

            <Can permission={PERMISSION.PAYMENT_IMPORT}>
                <ImportConfirmationBanner importType={IMPORT_TYPE.PAYMENT} onConfirmed={reload} />
            </Can>

            <Can permission={PERMISSION.PAYMENT_IMPORT_APPROVE}>
                <ImportApprovalBanner importType={IMPORT_TYPE.PAYMENT} onApproved={reload} />
            </Can>

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
                        className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                    >
                        <option value="all">{tc('paymentStatus.all')}</option>
                        <option value="pending">{tc('paymentStatus.pending')}</option>
                        <option value="approved">{tc('paymentStatus.approved')}</option>
                        <option value="rejected">{tc('paymentStatus.rejected')}</option>
                    </select>
                }
                renderActions={
                    <div className="flex items-center gap-2">
                        {canExport && (
                            <ExportDropdown
                                onExportExcel={onExportExcel}
                                onExportCSV={onExportCSV}
                            />
                        )}
                        <Can permission={PERMISSION.PAYMENT_IMPORT}>
                            <button
                                onClick={openImport}
                                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground"
                            >
                                <Icon name="upload" size={15} />
                                {tc('actions.import')}
                            </button>
                        </Can>
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
            />

            <PaymentImportModal
                open={importOpen}
                onClose={closeImport}
                rows={importRows}
                fileName={importFileName}
                fileRef={importFileRef}
                importing={importing}
                error={importError}
                onFile={handleFile}
                onImport={handleImport}
                onDownloadTemplate={downloadTemplate}
                onReset={resetImport}
            />

            <PaymentForm
                open={createFormOpen}
                onClose={closeCreateForm}
                onSubmit={onCreatePayment}
            />
        </div>
    )
}
