'use client'

import { useTranslations } from 'next-intl'
import DataTable           from '@/components/common/data-table/DataTable'
import ConfirmDialog       from '@/components/ui/ConfirmDialog'
import EditRoleForm        from './components/EditRoleForm'
import type { Column }     from '@/lib/types/query'
import type { UserRow }    from './components/UserColumns'

interface UsersViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result:                 any
    columns:                Column<UserRow>[]
    loading:                boolean
    error:                  boolean
    onRetry:                () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editTarget:             any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditTarget:          (t: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delTarget:              any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDelTarget:           (t: any) => void
    saving:                 boolean
    handleUpdateRole:       (membershipId: string, role: string) => void
    handleRemoveMembership: () => void
}

export default function UsersView({
    result,
    columns,
    loading,
    error,
    onRetry,
    editTarget,
    setEditTarget,
    delTarget,
    setDelTarget,
    saving,
    handleUpdateRole,
    handleRemoveMembership,
}: UsersViewProps) {
    const t  = useTranslations('users')
    const tc = useTranslations('common')

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">{t('title')}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t('subtitle')}
                </p>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                onRetry={onRetry}
            />

            {/* Edit Role Modal */}
            <EditRoleForm
                target={editTarget}
                onSave={handleUpdateRole}
                onClose={() => setEditTarget(null)}
                saving={saving}
            />

            {/* Remove Membership Confirm */}
            <ConfirmDialog
                open={!!delTarget}
                title={t('removeMembership.title')}
                message={t('removeMembership.message', { rtName: delTarget?.rt?.name })}
                confirmLabel={saving ? t('removeMembership.deleting') : t('removeMembership.confirm')}
                cancelLabel={tc('actions.cancel')}
                loading={saving}
                onConfirm={handleRemoveMembership}
                onCancel={() => setDelTarget(null)}
            />

        </div>
    )
}
