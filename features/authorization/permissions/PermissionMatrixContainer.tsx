'use client'

import { useTranslations }      from 'next-intl'
import { useToast }             from '@/components/ui/ToastProvider'
import { usePermissionMatrix }  from './hooks/usePermissionMatrix'
import PermissionMatrixView     from './PermissionMatrixView'

interface Props {
    canEdit: boolean
}

export default function PermissionMatrixContainer({ canEdit }: Props) {
    const t             = useTranslations('permissions')
    const { toast }     = useToast()
    const matrix        = usePermissionMatrix(canEdit)

    async function handleSave() {
        const ok = await matrix.save()
        if (ok) {
            toast({ message: t('toast.saved'), type: 'success' })
        } else if (matrix.error) {
            toast({ message: matrix.error, type: 'error' })
        }
    }

    return (
        <PermissionMatrixView
            roles={matrix.roles}
            selectedRoleId={matrix.selectedRoleId}
            filteredGroups={matrix.filteredGroups}
            localSet={matrix.localSet}
            collapsed={matrix.collapsed}
            search={matrix.search}
            isDirty={matrix.isDirty}
            canEdit={canEdit}
            loading={matrix.loading}
            loadingRole={matrix.loadingRole}
            saving={matrix.saving}
            error={matrix.error}
            onRoleChange={matrix.handleRoleChange}
            onSearch={matrix.setSearch}
            onToggle={matrix.togglePermission}
            onSelectAll={matrix.selectAllInModule}
            onClearAll={matrix.clearAllInModule}
            onCollapse={matrix.toggleCollapse}
            onSave={handleSave}
            onDiscard={matrix.discardChanges}
        />
    )
}
