'use client'

import { useMemo }             from 'react'
import { useTranslations }     from 'next-intl'
import { useRolesData }        from './hooks/useRolesData'
import { useRolesActions }     from './hooks/useRolesActions'
import { buildRoleColumns }    from './components/RoleColumns'
import RolesView               from './RolesView'

interface Props {
    canCreate: boolean
    canUpdate: boolean
}

export default function RolesContainer({ canCreate, canUpdate }: Props) {
    const t = useTranslations('roles')

    const data    = useRolesData()
    const actions = useRolesActions(data.refresh)

    const columns = useMemo(
        () => buildRoleColumns({
            t:              (k: string) => t(k as Parameters<typeof t>[0]),
            canUpdate,
            onEdit:         actions.openEdit,
            onToggleActive: actions.openToggleActive,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canUpdate],
    )

    return (
        <RolesView
            result={data.result}
            columns={columns}
            loading={data.loading}
            error={data.error}
            query={data.query}
            canCreate={canCreate}
            formOpen={actions.formOpen}
            formTarget={actions.formTarget}
            confirmTarget={actions.confirmTarget}
            saving={actions.saving}
            onRetry={data.refresh}
            onSearch={data.onSearch}
            onSort={data.onSort}
            onPageChange={data.onPageChange}
            onPageSizeChange={data.onPageSizeChange}
            onOpenCreate={actions.openCreate}
            onCloseForm={actions.closeForm}
            onSave={actions.handleSave}
            onCloseConfirm={actions.closeConfirm}
            onConfirmToggle={actions.handleToggleActive}
        />
    )
}
