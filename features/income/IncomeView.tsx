'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useTranslations }  from 'next-intl'
import Can                  from '@/components/ui/Can'
import { PERMISSION }       from '@/lib/auth/types'
import Icon                 from '@/components/ui/Icon'
import { DataTable }        from '@/components/common/data-table'
import ConfirmDialog        from '@/components/ui/ConfirmDialog'
import IncomeDrawer         from './components/drawer/IncomeDrawer'
import IncomeForm           from './components/forms/IncomeForm'
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
    approveAllIncome: () => void
}

export default function IncomeView({
    result, columns, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setFilter,
    selectedRow, drawerOpen, formOpen, submitting, deleteTarget, deleting,
    openDrawer, closeDrawer,
    openCreateForm, openEditForm, closeForm, submitForm,
    removeRow, confirmDelete, cancelDelete,
    approvalLoading, approveIncome, rejectIncome, approveAllIncome,
}: Props) {
    const t  = useTranslations('income')
    const tc = useTranslations('common')

    const data         = result?.data ?? []
    const pendingCount = data.filter((r: any) => r.status === 'pending').length

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Can permission={PERMISSION.INCOME_APPROVE}>
                        {pendingCount > 0 && (
                            <button
                                onClick={approveAllIncome}
                                className="flex-shrink-0 bg-success text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-success/90 transition"
                            >
                                {t('approveAll', { count: pendingCount } as any)}
                            </button>
                        )}
                    </Can>
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
                onRowClick={openDrawer}
                searchable
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
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

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                title={t('deleteTitle')}
                message={deleteTarget ? t('deleteConfirm', { name: deleteTarget.income_name }) : ''}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                loading={deleting}
            />

        </div>
    )
}
