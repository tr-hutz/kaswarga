// @ts-nocheck
'use client'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import UserTable   from './components/UserTable'
import EditRoleForm from './components/EditRoleForm'
import { useTranslations } from 'next-intl'
import ErrorState from '@/components/ui/ErrorState'

export default function UsersView({
    data,
    loading,
    error,
    onRetry,
    currentUserId,
    editTarget,
    setEditTarget,
    delTarget,
    setDelTarget,
    saving,
    handleUpdateRole,
    handleRemoveMembership
}) {

    const t = useTranslations('users')
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
            {error
                ? <ErrorState onRetry={onRetry} />
                : <UserTable
                    data={data}
                    loading={loading}
                    currentUserId={currentUserId}
                    onEditRole={setEditTarget}
                    onRemoveMembership={setDelTarget}
                />
            }

            {/* Edit Role Modal */}
            <EditRoleForm
                target={editTarget}
                onSave={handleUpdateRole}
                onClose={() => setEditTarget(null)}
                saving={saving}
            />

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
