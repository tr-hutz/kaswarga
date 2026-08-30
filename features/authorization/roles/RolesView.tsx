'use client'

import { useTranslations } from 'next-intl'
import DataTable           from '@/components/common/data-table/DataTable'
import ConfirmDialog       from '@/components/ui/ConfirmDialog'
import Button              from '@/components/ui/Button'
import Icon                from '@/components/ui/Icon'
import RoleForm            from './components/RoleForm'
import type { Column, PageResult, QueryOptions } from '@/lib/types/query'
import type { RoleRow }    from '@/lib/repositories/role.repository'

interface RolesViewProps {
    result:           PageResult<RoleRow> | null
    columns:          Column<RoleRow>[]
    loading:          boolean
    error:            boolean
    query:            QueryOptions
    canCreate:        boolean
    formOpen:         boolean
    formTarget:       RoleRow | null
    confirmTarget:    RoleRow | null
    saving:           boolean
    onRetry:          () => void
    onSearch:         (s: string) => void
    onSort:           (col: string, dir: 'asc' | 'desc') => void
    onPageChange:     (p: number) => void
    onPageSizeChange: (s: number) => void
    onOpenCreate:     () => void
    onCloseForm:      () => void
    onSave:           (payload: { name: string; code: string; description: string | null }) => void
    onCloseConfirm:   () => void
    onConfirmToggle:  () => void
}

export default function RolesView({
    result,
    columns,
    loading,
    error,
    query,
    canCreate,
    formOpen,
    formTarget,
    confirmTarget,
    saving,
    onRetry,
    onSearch,
    onSort,
    onPageChange,
    onPageSizeChange,
    onOpenCreate,
    onCloseForm,
    onSave,
    onCloseConfirm,
    onConfirmToggle,
}: RolesViewProps) {
    const t  = useTranslations('roles')
    const tc = useTranslations('common')

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                {canCreate && (
                    <Button onClick={onOpenCreate} size="md">
                        <Icon name="plus" size={16} />
                        {t('actions.create')}
                    </Button>
                )}
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={onSearch}
                onSort={onSort}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                onRetry={onRetry}
            />

            {/* Create / Edit Form */}
            <RoleForm
                open={formOpen}
                target={formTarget}
                saving={saving}
                onSave={onSave}
                onClose={onCloseForm}
            />

            {/* Activate / Deactivate Confirm */}
            {confirmTarget && (
                <ConfirmDialog
                    open
                    title={confirmTarget.is_active ? t('confirm.deactivateTitle') : t('confirm.activateTitle')}
                    message={
                        confirmTarget.is_system
                            ? (confirmTarget.is_active
                                ? t('confirm.deactivateSystemMessage', { name: confirmTarget.name })
                                : t('confirm.activateMessage', { name: confirmTarget.name }))
                            : (confirmTarget.is_active
                                ? t('confirm.deactivateMessage', { name: confirmTarget.name })
                                : t('confirm.activateMessage', { name: confirmTarget.name }))
                    }
                    confirmLabel={saving
                        ? tc('states.saving')
                        : (confirmTarget.is_active ? t('actions.deactivate') : t('actions.activate'))
                    }
                    cancelLabel={tc('actions.cancel')}
                    loading={saving}
                    onConfirm={onConfirmToggle}
                    onCancel={onCloseConfirm}
                />
            )}
        </div>
    )
}
