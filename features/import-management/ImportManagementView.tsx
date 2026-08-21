'use client'

import { useTranslations }    from 'next-intl'
import Can                    from '@/components/ui/Can'
import Icon                   from '@/components/ui/Icon'
import { PERMISSION }         from '@/lib/auth/types'
import { DataTable }          from '@/components/common/data-table'
import { IMPORT_TYPE }        from '@/lib/import/types'
import type { QueryOptions, PageResult, Column } from '@/lib/types/query'
import type { ImportJob } from '@/lib/import/types'
import ImportDetailDrawer      from './components/ImportDetailDrawer'
import CentralizedImportDialog from './components/CentralizedImportDialog'

interface Props {
    result:     PageResult<ImportJob> | null
    columns:    Column<ImportJob>[]
    loading:    boolean
    error:      boolean
    onRetry:    () => void
    query:      QueryOptions
    setPage:    (p: number) => void
    setPageSize: (s: number) => void
    setSearch:  (s: string) => void
    setFilter:  (key: string, value: unknown) => void
    // detail drawer
    selectedJob:  ImportJob | null
    detailOpen:   boolean
    openDetail:   (job: ImportJob) => void
    closeDetail:  () => void
    acting:       string | null
    onConfirm:    (jobId: string) => void
    onCancel:     (jobId: string) => void
    onApprove:    (jobId: string) => void
    onReject:     (jobId: string, reason: string) => void
    // import dialog
    importDialogOpen:  boolean
    openImportDialog:  () => void
    closeImportDialog: () => void
    onJobCreated:      () => void
}

export default function ImportManagementView({
    result, columns, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setFilter,
    selectedJob, detailOpen, openDetail, closeDetail, acting,
    onConfirm, onCancel, onApprove, onReject,
    importDialogOpen, openImportDialog, closeImportDialog, onJobCreated,
}: Props) {
    const t = useTranslations('importManagement')

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Show button if user can import any module */}
                    <Can permission={PERMISSION.IMPORT_VIEW}>
                        <button
                            onClick={openImportDialog}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                        >
                            <Icon name="plus" size={16} />
                            {t('addButton')}
                        </button>
                    </Can>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={onRetry}
                onRowClick={openDetail}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                renderFilters={
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={String(query.filters?.status ?? 'all')}
                            onChange={e => setFilter('status', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allStatuses')}</option>
                            <option value="QUEUED">Antrian</option>
                            <option value="PROCESSING">Sedang diproses</option>
                            <option value="STAGED">Menunggu konfirmasi</option>
                            <option value="PENDING_APPROVAL">Menunggu persetujuan</option>
                            <option value="COMPLETED">Selesai</option>
                            <option value="FAILED">Gagal</option>
                            <option value="CANCELLED">Dibatalkan</option>
                            <option value="REJECTED">Ditolak</option>
                        </select>
                        <select
                            value={String(query.filters?.import_type ?? 'all')}
                            onChange={e => setFilter('import_type', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allModules')}</option>
                            <option value={IMPORT_TYPE.RESIDENT}>{t('modules.RESIDENT')}</option>
                            <option value={IMPORT_TYPE.PAYMENT}>{t('modules.PAYMENT')}</option>
                            <option value={IMPORT_TYPE.INCOME}>{t('modules.INCOME')}</option>
                            <option value={IMPORT_TYPE.EXPENSE}>{t('modules.EXPENSE')}</option>
                        </select>
                    </div>
                }
            />

            {/* Detail drawer — key resets internal state when job changes */}
            <ImportDetailDrawer
                key={selectedJob?.id ?? 'none'}
                open={detailOpen}
                job={selectedJob}
                onClose={closeDetail}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onApprove={onApprove}
                onReject={onReject}
                acting={acting}
            />

            {/* Centralized import dialog */}
            <CentralizedImportDialog
                open={importDialogOpen}
                onClose={closeImportDialog}
                onJobCreated={onJobCreated}
            />
        </div>
    )
}
