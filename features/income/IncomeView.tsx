'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }          from 'react'
import type { RefObject }    from 'react'
import { useTranslations }   from 'next-intl'
import Can                   from '@/components/ui/Can'
import { PERMISSION }        from '@/lib/auth/types'
import Icon                  from '@/components/ui/Icon'
import ExportDropdown        from '@/components/ui/ExportDropdown'
import { DataTable }         from '@/components/common/data-table'
import ConfirmDialog         from '@/components/ui/ConfirmDialog'
import IncomeDrawer          from './components/drawer/IncomeDrawer'
import IncomeForm            from './components/forms/IncomeForm'
import IncomeImportModal     from './components/import/IncomeImportModal'
import ImportApprovalBanner     from '@/components/import/ImportApprovalBanner'
import ImportConfirmationBanner from '@/components/import/ImportConfirmationBanner'
import { IMPORT_TYPE }          from '@/lib/import/types'
import DonationListView      from './components/donations/DonationListView'
import type { QueryOptions, PageResult, Column } from '@/lib/types/query'

interface Props {
    result:          PageResult<any> | null
    columns:         Column<any>[]
    loading:         boolean
    error:           boolean
    onRetry:         () => void
    query:           QueryOptions
    setPage:         (p: number) => void
    setPageSize:     (s: number) => void
    setSearch:       (s: string) => void
    setFilter:       (key: string, value: unknown) => void
    importError:     string
    // from useIncomeActions
    selectedRow:     any
    drawerOpen:      boolean
    formOpen:        boolean
    submitting:      boolean
    deleteTarget:    any
    deleting:        boolean
    openDrawer:      (r: any) => void
    closeDrawer:     () => void
    openCreateForm:  () => void
    openEditForm:    (r: any) => void
    closeForm:       () => void
    submitForm:      (payload: any) => Promise<void>
    removeRow:       (r: any) => void
    confirmDelete:   () => void
    cancelDelete:    () => void
    approvalLoading: boolean
    approveIncome:   (id: string) => void
    rejectIncome:    (id: string, reason: string) => void
    // tabs
    activeTab:       'transactions' | 'donations'
    setActiveTab:    (tab: 'transactions' | 'donations') => void
    // export
    exportExcel:     (rows: any[]) => void
    // import
    importOpen:      boolean
    openImport:      () => void
    closeImport:     () => void
    importRows:      unknown[]
    fileName:        string | null
    fileRef:         RefObject<HTMLInputElement>
    importing:       boolean
    handleFile:      (file: File | undefined) => void
    handleImport:    () => void
    downloadTemplate: () => void
    resetImport:     () => void
}

export default function IncomeView({
    result, columns, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setFilter,
    importError,
    activeTab, setActiveTab,
    selectedRow, drawerOpen, formOpen, submitting, deleteTarget, deleting,
    openDrawer, closeDrawer,
    openCreateForm, openEditForm, closeForm, submitForm,
    removeRow, confirmDelete, cancelDelete,
    approvalLoading, approveIncome, rejectIncome,
    exportExcel,
    importOpen, openImport, closeImport,
    importRows, fileName: importFileName, fileRef: importFileRef,
    importing, handleFile, handleImport, downloadTemplate, resetImport,
}: Props) {
    const t  = useTranslations('income')
    const tc = useTranslations('common')

    const data = result?.data ?? []

    const [filtersOpen, setFiltersOpen] = useState(false)

    const activeFilterCount = [
        query.filters?.income_category,
        query.filters?.source_type,
        query.filters?.status,
        query.filters?.payment_method,
    ].filter((v): v is string => !!v && v !== 'all').length

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                {activeTab === 'transactions' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Can permission={PERMISSION.INCOME_CREATE}>
                            <button
                                onClick={openCreateForm}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                            >
                                <Icon name="plus" size={16} />
                                {t('addButton')}
                            </button>
                        </Can>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-divider">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === 'transactions'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted hover:text-foreground'
                    }`}
                >
                    {t('tabTransactions')}
                </button>
                <button
                    data-testid="tab-donations"
                    onClick={() => setActiveTab('donations')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === 'donations'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted hover:text-foreground'
                    }`}
                >
                    {t('donations.tabLabel')}
                </button>
            </div>

            {activeTab === 'donations' && <DonationListView />}

            {activeTab === 'transactions' && (
            <>
            <Can permission={PERMISSION.INCOME_IMPORT}>
                <ImportConfirmationBanner importType={IMPORT_TYPE.INCOME} />
            </Can>

            <Can permission={PERMISSION.INCOME_APPROVE}>
                <ImportApprovalBanner importType={IMPORT_TYPE.INCOME} />
            </Can>

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
                onRowClick={openDrawer}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                renderFilters={
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(o => !o)}
                        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground transition-colors"
                    >
                        <Icon name="funnel" size={15} />
                        {tc('filter.placeholder')}
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-medium">
                                {activeFilterCount}
                            </span>
                        )}
                        <Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={14} className="text-muted" />
                    </button>
                }
                renderBelowToolbar={
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap p-3 bg-canvas rounded-lg border border-divider">
                        <select
                            value={String(query.filters?.income_category ?? 'all')}
                            onChange={(e) => setFilter('income_category', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allCategories')}</option>
                            <option value="DONATION">{t('categories.DONATION')}</option>
                            <option value="GOVERNMENT">{t('categories.GOVERNMENT')}</option>
                            <option value="EVENT">{t('categories.EVENT')}</option>
                            <option value="BAZAAR">{t('categories.BAZAAR')}</option>
                            <option value="RENTAL">{t('categories.RENTAL')}</option>
                            <option value="SALES">{t('categories.SALES')}</option>
                            <option value="INTEREST">{t('categories.INTEREST')}</option>
                            <option value="OTHER">{t('categories.OTHER')}</option>
                        </select>
                        <select
                            value={String(query.filters?.source_type ?? 'all')}
                            onChange={(e) => setFilter('source_type', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allSourceTypes')}</option>
                            <option value="RESIDENT">{t('sourceTypes.RESIDENT')}</option>
                            <option value="NON_RESIDENT">{t('sourceTypes.NON_RESIDENT')}</option>
                            <option value="ORGANIZATION">{t('sourceTypes.ORGANIZATION')}</option>
                            <option value="GOVERNMENT">{t('sourceTypes.GOVERNMENT')}</option>
                            <option value="ANONYMOUS">{t('sourceTypes.ANONYMOUS')}</option>
                        </select>
                        <select
                            value={String(query.filters?.status ?? 'all')}
                            onChange={(e) => setFilter('status', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allStatuses')}</option>
                            <option value="pending">{t('status.pending')}</option>
                            <option value="approved">{t('status.approved')}</option>
                            <option value="rejected">{t('status.rejected')}</option>
                        </select>
                        <select
                            value={String(query.filters?.payment_method ?? 'all')}
                            onChange={(e) => setFilter('payment_method', e.target.value)}
                            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
                        >
                            <option value="all">{t('filters.allPaymentMethods')}</option>
                            <option value="CASH">{t('paymentMethods.CASH')}</option>
                            <option value="TRANSFER">{t('paymentMethods.TRANSFER')}</option>
                            <option value="QRIS">{t('paymentMethods.QRIS')}</option>
                        </select>
                    </div>
                    </div>
                    </div>
                }
                renderActions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <Can permission={PERMISSION.INCOME_EXPORT}>
                            <ExportDropdown
                                onExportExcel={() => exportExcel(data)}
                            />
                        </Can>
                        <Can permission={PERMISSION.INCOME_IMPORT}>
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

            {/* Drawer */}
            <IncomeDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                row={selectedRow}
                onApprove={approveIncome}
                onReject={rejectIncome}
                approvalLoading={approvalLoading}
            />

            {/* Form */}
            <IncomeForm
                open={formOpen}
                onClose={closeForm}
                onSubmit={submitForm}
                initialData={formOpen && selectedRow ? selectedRow : null}
            />

            {/* Import modal */}
            <IncomeImportModal
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

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                title={t('deleteTitle')}
                message={deleteTarget ? t('deleteConfirm', { name: deleteTarget.income_name }) : ''}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                loading={deleting}
            />
            </>
            )}

        </div>
    )
}
