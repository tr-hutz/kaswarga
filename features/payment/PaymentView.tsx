'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable }            from '@/components/common/data-table'
import PaymentDetailDrawer      from './components/details/PaymentDetailDrawer'
import PaymentImportModal       from './components/import/PaymentImportModal'
import ExportDropdown           from '@/components/ui/ExportDropdown'
import DangerDropdown           from '@/components/ui/DangerDropdown'
import ConfirmDialog            from '@/components/ui/ConfirmDialog'
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
    data:            ConfirmationRow[]
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
    role:            string | null | undefined
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
    // approve all imported
    importedPendingCount: number
    approveAllImported:   () => void
    approveAllLoading:    boolean
    // reject / delete all imported
    rejectAllImported:    () => void
    deleteAllImported:    () => void
    confirmDeleteAll:     () => void
    cancelDeleteAll:      () => void
    deleteAllConfirmOpen: boolean
    bulkActionLoading:    boolean
}

export default function PaymentView({
    result, loading, error, reload,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    columns, data, t, tc,
    drawerOpen, selectedPayment, onRowClick, onCloseDetail,
    onApprove, onReject, approvalLoading,
    onExportCSV, onExportExcel, role,
    importOpen, openImport, closeImport,
    importRows, importFileName, importFileRef,
    importing, importError, handleFile, handleImport, downloadTemplate, resetImport,
    importedPendingCount, approveAllImported, approveAllLoading,
    rejectAllImported, deleteAllImported,
    confirmDeleteAll, cancelDeleteAll, deleteAllConfirmOpen,
    bulkActionLoading,
}: Props) {
    const canManage = role === 'TREASURER' || role === 'ADMIN'

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
                </div>
                {canManage && importedPendingCount > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <DangerDropdown
                            label={t('rejectAll.button')}
                            disabled={bulkActionLoading || approveAllLoading}
                            items={[
                                { label: t('rejectAll.option'), iconName: 'x-circle', onClick: rejectAllImported },
                                { label: t('deleteAll.option'), iconName: 'trash-2',  onClick: deleteAllImported },
                            ]}
                        />
                        <button
                            onClick={approveAllImported}
                            disabled={approveAllLoading || bulkActionLoading}
                            className="flex-shrink-0 bg-success text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-success/90 transition disabled:opacity-60"
                        >
                            {t('approveAll', { count: importedPendingCount })}
                        </button>
                    </div>
                )}
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
                        className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                    >
                        <option value="all">{tc('paymentStatus.all')}</option>
                        <option value="pending">{tc('paymentStatus.pending')}</option>
                        <option value="approved">{tc('paymentStatus.approved')}</option>
                        <option value="rejected">{tc('paymentStatus.rejected')}</option>
                    </select>
                }
                renderActions={
                    role !== 'RESIDENT' ? (
                        <div className="flex items-center gap-2">
                            <ExportDropdown
                                onExportExcel={onExportExcel}
                                onExportCSV={onExportCSV}
                            />
                            {canManage && (
                                <button
                                    onClick={openImport}
                                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground"
                                >
                                    <Icon name="upload" size={15} />
                                    {tc('actions.import')}
                                </button>
                            )}
                        </div>
                    ) : undefined
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

            <ConfirmDialog
                open={deleteAllConfirmOpen}
                title={t('deleteAll.title')}
                message={t('deleteAll.confirm')}
                confirmLabel={t('deleteAll.confirmLabel')}
                cancelLabel={tc('actions.cancel')}
                onConfirm={confirmDeleteAll}
                onCancel={cancelDeleteAll}
            />
        </div>
    )
}
