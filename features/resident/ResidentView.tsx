'use client'

import { useMemo }          from 'react'
import { useTranslations }  from 'next-intl'
import { DataTable }        from '@/components/common/data-table'
import ResidentFilters      from './components/filters/ResidentFilters'
import ResidentPendingRequests from './components/ResidentPendingRequests'
import ResidentDetailDrawer from './components/drawer/ResidentDetailDrawer'
import ResidentForm         from './components/forms/ResidentForm'
import ChangeRoleDialog     from './components/forms/ChangeRoleDialog'
import ResidentImportModal  from './components/import/ResidentImportModal'
import { buildResidentColumns, type ResidentRow } from './components/ResidentColumns'
import ExportDropdown from '@/components/ui/ExportDropdown'
import Icon from '@/components/ui/Icon'
import Can from '@/components/ui/Can'
import { PERMISSION } from '@/lib/auth/types'
import type { QueryOptions, PageResult } from '@/lib/types/query'

interface Props {
    // data
    result:           PageResult<ResidentRow> | null
    loading:          boolean
    error:            boolean
    reload:           () => void
    pendingRequests:  unknown[]
    pendingLoading:   boolean
    // permissions
    canManage:        boolean
    role:             string
    currentResidentId?: string
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
    onChangeRole:     (row: ResidentRow, membershipId: string, currentRoleEnum: string) => void
    canChangeRole:    boolean
    refresh:          () => void
    // role change dialog
    changeRoleTarget: { membershipId: string; currentRole: string; residentName: string } | null
    closeChangeRole:  () => void
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
    progress?:        number
    processedRows?:   number
    totalRows?:       number
    handleFile:       (file: File | undefined) => void
    handleImport:     () => void
    downloadTemplate: () => void
    resetImport:      () => void
}

export default function ResidentView({
    result, loading, error, reload,
    pendingRequests, pendingLoading,
    canManage, canChangeRole, role, currentResidentId,
    query, setPage, setPageSize, setSearch, setSort, setFilter,
    onRowClick, onEdit, onDelete, onChangeRole, refresh,
    selectedResident, drawerOpen, closeDrawer,
    formOpen, openCreateForm, closeForm,
    exportCSV, exportExcel,
    importOpen, openImport, closeImport,
    rows: importRows, fileName: importFileName, fileRef: importFileRef,
    importing, importError,
    progress, processedRows, totalRows,
    handleFile, handleImport, downloadTemplate, resetImport,
    changeRoleTarget, closeChangeRole,
}: Props) {
    const t  = useTranslations('residents')
    const tc = useTranslations('common')
    const tr = useTranslations('residents.roles')

    const columns = useMemo(
        () => buildResidentColumns({
            tResidents:   (k) => t(k as Parameters<typeof t>[0]),
            tCommon:      (k) => tc(k as Parameters<typeof tc>[0]),
            tRoles:       (k) => tr(k as Parameters<typeof tr>[0]),
            canManage,
            canChangeRole,
            onEdit,
            onDelete,
            onChangeRole,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canManage, canChangeRole, onEdit, onDelete, onChangeRole],
    )

    const data = result?.data ?? []

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-1">{t('subtitle')}</p>
                </div>
                {canManage && (
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors flex-shrink-0"
                    >
                        <Icon name="plus" size={16} />
                        {t('addButton')}
                    </button>
                )}
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
                        <Can permission={PERMISSION.RESIDENT_EXPORT}>
                            <ExportDropdown
                                onExportExcel={() => exportExcel(data)}
                                onExportCSV={() => exportCSV(data)}
                            />
                        </Can>
                        <Can permission={PERMISSION.RESIDENT_IMPORT}>
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

            {/* Drawers and modals */}
            <ResidentDetailDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                resident={selectedResident}
                role={role}
                currentResidentId={currentResidentId}
            />

            <ResidentForm
                open={formOpen}
                onClose={closeForm}
                resident={selectedResident}
                onSuccess={() => { closeForm(); refresh() }}
            />

            {changeRoleTarget && (
                <ChangeRoleDialog
                    open={!!changeRoleTarget}
                    onClose={closeChangeRole}
                    membershipId={changeRoleTarget.membershipId}
                    currentRole={changeRoleTarget.currentRole}
                    residentName={changeRoleTarget.residentName}
                    onSuccess={refresh}
                />
            )}

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
                progress={progress}
                processedRows={processedRows}
                totalRows={totalRows}
            />
        </div>
    )
}
