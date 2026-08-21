'use client'

import { useMemo }            from 'react'
import { useTranslations }    from 'next-intl'
import { usePermission }      from '@/lib/auth/usePermission'
import { PERMISSION }         from '@/lib/auth/types'
import Can                    from '@/components/ui/Can'
import { DataTable }          from '@/components/common/data-table'
import ExpenseDrawer          from './components/drawer/ExpenseDrawer'
import ExpenseForm            from './components/forms/ExpenseForm'
import ExpenseImportModal     from './components/import/ExpenseImportModal'
import { buildExpenseColumns } from './components/ExpenseColumns'
import ConfirmDialog           from '@/components/ui/ConfirmDialog'
import ExportDropdown         from '@/components/ui/ExportDropdown'
import ImportApprovalBanner      from '@/components/import/ImportApprovalBanner'
import ImportConfirmationBanner  from '@/components/import/ImportConfirmationBanner'
import { IMPORT_TYPE }           from '@/lib/import/types'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { MappedExpense } from './hooks/useExpenseData'
import Icon from "@/components/ui/Icon";

interface Props {
    result:      PageResult<MappedExpense> | null
    loading:     boolean
    fetchError:  boolean
    onRetry:     () => void
    categories:  { name: string }[]
    query:       QueryOptions
    setPage:         (p: number) => void
    setPageSize:     (s: number) => void
    setSearch:       (s: string) => void
    setSort:         (by: string, dir: 'asc' | 'desc') => void
    setFilter:       (key: string, value: unknown) => void
    importError:     string
    onApproved:      () => void
    // from useExpenseActions
    selectedRow:     MappedExpense | null
    drawerOpen:      boolean
    formOpen:        boolean
    openDrawer:      (r: MappedExpense) => void
    closeDrawer:     () => void
    openCreateForm:  () => void
    openEditForm:    (r: MappedExpense) => void
    closeForm:       () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitForm:      (payload: any) => Promise<void>
    removeRow:       (r: MappedExpense) => void
    exportCSV:       (rows: MappedExpense[]) => void
    exportExcel:     (rows: MappedExpense[]) => void
    importOpen:      boolean
    openImport:      () => void
    closeImport:     () => void
    importRows:      unknown[]
    fileName:        string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileRef:         React.RefObject<any>
    importing:       boolean
    handleFile:      (file: File | undefined) => void
    handleImport:    () => void
    downloadTemplate: () => void
    resetImport:     () => void
    approvalLoading:    boolean
    approveExpense:     (r: MappedExpense) => void
    rejectExpense:      (r: MappedExpense) => void
    deleteTarget:       MappedExpense | null
    confirmDelete:      () => void
    cancelDelete:       () => void
}

export default function ExpenseView({
    result, loading, fetchError, onRetry,
    categories,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    importError, onApproved,
    selectedRow, drawerOpen, formOpen,
    openDrawer, closeDrawer,
    openCreateForm, openEditForm, closeForm, submitForm,
    removeRow, exportCSV, exportExcel,
    importOpen, openImport, closeImport,
    importRows, fileName: importFileName, fileRef: importFileRef,
    importing, handleFile, handleImport, downloadTemplate, resetImport,
    approvalLoading, approveExpense, rejectExpense,
    deleteTarget, confirmDelete, cancelDelete,
}: Props) {
    const t  = useTranslations('expenses')
    const tc = useTranslations('common')

    const canManageExpenses = usePermission(PERMISSION.EXPENSE_CREATE)

    const data = result?.data ?? []

    const columns = useMemo(
        () => buildExpenseColumns({
            t:         (k) => t(k as Parameters<typeof t>[0]),
            tc:        (k) => tc(k as Parameters<typeof tc>[0]),
            canManage: canManageExpenses,
            onEdit:    openEditForm,
            onDelete:  removeRow,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canManageExpenses, openEditForm, removeRow],
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Can permission={PERMISSION.EXPENSE_CREATE}>
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

            <Can permission={PERMISSION.EXPENSE_IMPORT}>
                <ImportConfirmationBanner importType={IMPORT_TYPE.EXPENSE} onConfirmed={onApproved} />
            </Can>

            <Can permission={PERMISSION.EXPENSE_APPROVE}>
                <ImportApprovalBanner importType={IMPORT_TYPE.EXPENSE} onApproved={onApproved} />
            </Can>

            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={fetchError}
                query={query}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                onSort={setSort}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={onRetry}
                onRowClick={openDrawer}
                renderFilters={
                    <div className="flex items-center gap-2">
                        <select
                            value={String(query.filters?.category ?? 'all')}
                            onChange={(e) => setFilter('category', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filterPlaceholder')}</option>
                            {categories.map((c) => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={String(query.filters?.status ?? 'all')}
                            onChange={(e) => setFilter('status', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{tc('expenseStatus.all')}</option>
                            <option value="pending">{tc('expenseStatus.pending')}</option>
                            <option value="approved">{tc('expenseStatus.approved')}</option>
                            <option value="rejected">{tc('expenseStatus.rejected')}</option>
                        </select>
                    </div>
                }
                renderActions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Can permission={PERMISSION.EXPENSE_EXPORT}>
                            <ExportDropdown
                                onExportExcel={() => exportExcel(data)}
                                onExportCSV={() => exportCSV(data)}
                            />
                        </Can>
                        <Can permission={PERMISSION.EXPENSE_IMPORT}>
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

            <ExpenseDrawer
                open={drawerOpen}
                row={selectedRow}
                onClose={closeDrawer}
                onApprove={approveExpense}
                onReject={rejectExpense}
                approvalLoading={approvalLoading}
            />

            <ExpenseForm
                key={selectedRow?.id ?? 'create'}
                open={formOpen}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                initialData={selectedRow as any}
                onClose={closeForm}
                onSubmit={submitForm}
            />

            <ExpenseImportModal
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
                open={!!deleteTarget}
                title={t('deleteTitle')}
                message={t('deleteConfirm', { description: deleteTarget?.description ?? '' })}
                confirmLabel={tc('actions.delete')}
                cancelLabel={tc('actions.cancel')}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    )
}
