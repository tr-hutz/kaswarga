'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import Icon            from '@/components/ui/Icon'
import { DataTable }   from '@/components/common/data-table'
import RtForm          from './components/RtForm'
import RtDeleteConfirm from './components/RtDeleteConfirm'
import { useTranslations } from 'next-intl'
import type { Column, QueryOptions, PageResult } from '@/lib/types/query'

interface RtViewProps {
    result:       PageResult<any> | null
    columns:      Column<any>[]
    loading:      boolean
    error:        boolean
    onRetry:      () => void
    query:        QueryOptions
    setPage:      (p: number) => void
    setPageSize:  (s: number) => void
    openCreate:   () => void
    formOpen:     boolean
    selected:     any
    closeForm:    () => void
    handleSubmit: (form: any) => Promise<any>
    delTarget:    any
    setDelTarget: (t: any) => void
    deleting:     boolean
    handleDelete: () => void
}

export default function RtView({
    result,
    columns,
    loading,
    error,
    onRetry,
    query,
    setPage,
    setPageSize,
    openCreate,
    formOpen,
    selected,
    closeForm,
    handleSubmit,
    delTarget,
    setDelTarget,
    deleting,
    handleDelete,
}: RtViewProps) {

    const t = useTranslations('rt')

    return (

        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">
                        {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg px-4 py-2.5 transition-colors"
                >
                    <Icon name="plus" size={16} />
                    {t('addButton')}
                </button>
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
            />

            {/* Form Modal */}
            <RtForm
                open={formOpen}
                onClose={closeForm}
                rt={selected}
                onSubmit={handleSubmit}
            />

            {/* Delete Confirm */}
            <RtDeleteConfirm
                rt={delTarget}
                onConfirm={handleDelete}
                onCancel={() => setDelTarget(null)}
                loading={deleting}
            />

        </div>
    )
}
