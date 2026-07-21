'use client'

import { useMemo }            from 'react'
import { useTranslations }    from 'next-intl'
import { DataTable }          from '@/components/common/data-table'
import ExpenseDrawer          from './components/drawer/ExpenseDrawer'
import ExpenseForm            from './components/forms/ExpenseForm'
import ExpenseImportModal     from './components/import/ExpenseImportModal'
import { buildExpenseColumns } from './components/ExpenseColumns'
import ConfirmDialog           from '@/components/ui/ConfirmDialog'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { MappedExpense } from './hooks/useExpenseData'

interface Props {
    result:      PageResult<MappedExpense> | null
    loading:     boolean
    fetchError:  boolean
    onRetry:     () => void
    role:        string
    categories:  { name: string }[]
    query:       QueryOptions
    setPage:         (p: number) => void
    setPageSize:     (s: number) => void
    setSearch:       (s: string) => void
    setSort:         (by: string, dir: 'asc' | 'desc') => void
    setFilter:       (key: string, value: unknown) => void
    importError:     string
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
    approveAllExpenses: () => void
    deleteTarget:       MappedExpense | null
    confirmDelete:      () => void
    cancelDelete:       () => void
}

export default function ExpenseView({
    result, loading, fetchError, onRetry,
    role, categories,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    importError,
    selectedRow, drawerOpen, formOpen,
    openDrawer, closeDrawer,
    openCreateForm, openEditForm, closeForm, submitForm,
    removeRow, exportCSV, exportExcel,
    importOpen, openImport, closeImport,
    importRows, fileName: importFileName, fileRef: importFileRef,
    importing, handleFile, handleImport, downloadTemplate, resetImport,
    approvalLoading, approveExpense, rejectExpense, approveAllExpenses,
    deleteTarget, confirmDelete, cancelDelete,
}: Props) {
    const t  = useTranslations('expenses')
    const tc = useTranslations('common')

    const data = result?.data ?? []
    const pendingCount = data.filter((r) => r.status === 'pending').length

    const columns = useMemo(
        () => buildExpenseColumns({
            t:        (k) => t(k as Parameters<typeof t>[0]),
            tc:       (k) => tc(k as Parameters<typeof tc>[0]),
            role,
            onEdit:   openEditForm,
            onDelete: removeRow,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [role, openEditForm, removeRow],
    )

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
                    <select
                        value={String(query.filters?.category ?? 'all')}
                        onChange={(e) => setFilter('category', e.target.value)}
                        className="h-9 rounded-lg border bg-input px-3 text-sm"
                    >
                        <option value="all">{t('filterPlaceholder')}</option>
                        {categories.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                }
                renderActions={
                    <div className="flex items-center gap-2 flex-wrap">
                        {role === 'CHAIR' && pendingCount > 0 && (
                            <button
                                onClick={approveAllExpenses}
                                className="bg-success text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-success/90 transition"
                            >
                                {t('approveAll', { count: pendingCount })}
                            </button>
                        )}
                        <button
                            onClick={() => exportExcel(data)}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportExcel')}
                        </button>
                        <button
                            onClick={() => exportCSV(data)}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportCsv')}
                        </button>
                        {role === 'TREASURER' && (
                            <button
                                onClick={openImport}
                                className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                            >
                                {tc('actions.import')}
                            </button>
                        )}
                        {role === 'TREASURER' && (
                            <button
                                onClick={openCreateForm}
                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark"
                            >
                                + {tc('actions.add')}
                            </button>
                        )}
                    </div>
                }
            />

            <ExpenseDrawer
                open={drawerOpen}
                row={selectedRow}
                role={role}
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
