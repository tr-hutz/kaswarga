'use client'

import { useMemo }          from 'react'
import { useTranslations }  from 'next-intl'
import { DataTable }        from '@/components/common/data-table'
import ResidentFilters      from './components/filters/ResidentFilters'
import ResidentPendingRequests from './components/ResidentPendingRequests'
import ResidentDetailDrawer from './components/drawer/ResidentDetailDrawer'
import ResidentForm         from './components/forms/ResidentForm'
import ResidentImportModal  from './components/import/ResidentImportModal'
import { buildResidentColumns, type ResidentRow } from './components/ResidentColumns'
import type { QueryOptions, PageResult } from '@/lib/types/query'

interface Props {
    // data
    result:           PageResult<ResidentRow> | null
    loading:          boolean
    error:            boolean
    reload:           () => void
    pendingRequests:  unknown[]
    pendingLoading:   boolean
    // query
    query:            QueryOptions
    setPage:          (page: number) => void
    setPageSize:      (size: number) => void
    setSearch:        (search: string) => void
    setSort:          (by: string, dir: 'asc' | 'desc') => void
    setFilter:        (key: string, value: unknown) => void
    // row actions
    onRowClick:       (row: ResidentRow) => void
    onEdit:           (row: ResidentRow) => void
    onDelete:         (row: ResidentRow) => void
    refresh:          () => void
    // drawer
    selectedResident: unknown
    drawerOpen:       boolean
    openDrawer:       (r: unknown) => void
    closeDrawer:      () => void
    // form
    formOpen:         boolean
    openCreateForm:   () => void
    openEditForm:     (r: unknown) => void
    closeForm:        () => void
    // export
    exportCSV:        (data: unknown[]) => void
    exportExcel:      (data: unknown[]) => void
    // import
    importOpen:       boolean
    openImport:       () => void
    closeImport:      () => void
    rows:             unknown[]
    fileName:         string | null
    fileRef:          React.RefObject<HTMLInputElement>
    importing:        boolean
    importError:      string
    handleFile:       (file: File | undefined) => void
    handleImport:     () => void
    downloadTemplate: () => void
    resetImport:      () => void
}

export default function ResidentView({
    result, loading, error, reload,
    pendingRequests, pendingLoading,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    onRowClick, onEdit, onDelete, refresh,
    selectedResident, drawerOpen, closeDrawer,
    formOpen, openCreateForm, closeForm,
    exportCSV, exportExcel,
    importOpen, openImport, closeImport,
    rows: importRows, fileName: importFileName, fileRef: importFileRef,
    importing, importError,
    handleFile, handleImport, downloadTemplate, resetImport,
}: Props) {
    const t  = useTranslations('residents')
    const tc = useTranslations('common')

    const columns = useMemo(
        () => buildResidentColumns({
            tResidents: (k) => t(k as Parameters<typeof t>[0]),
            tCommon:    (k) => tc(k as Parameters<typeof tc>[0]),
            onEdit,
            onDelete,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onEdit, onDelete],
    )

    const data = result?.data ?? []

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
            </div>

            {/* Pending join requests */}
            <ResidentPendingRequests
                requests={pendingRequests}
                loading={pendingLoading}
                onAction={refresh}
            />

            {/* Main table */}
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
                    <ResidentFilters
                        active={String(query.filters?.active ?? '')}
                        onActiveChange={(v) => setFilter('active', v)}
                    />
                }
                renderActions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportExcel(data)}
                            className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
                        >
                            {tc('actions.exportExcel')}
                        </button>
                        <button
                            onClick={() => exportCSV(data)}
                            className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
                        >
                            {tc('actions.exportCsv')}
                        </button>
                        <button
                            onClick={openImport}
                            className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
                        >
                            {tc('actions.import')}
                        </button>
                        <button
                            onClick={openCreateForm}
                            className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
                        >
                            + {tc('actions.add')}
                        </button>
                    </div>
                }
            />

            {/* Drawers and modals */}
            <ResidentDetailDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                resident={selectedResident}
            />

            <ResidentForm
                open={formOpen}
                onClose={closeForm}
                resident={selectedResident}
                onSuccess={() => { closeForm(); refresh() }}
            />

            <ResidentImportModal
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
        </div>
    )
}
