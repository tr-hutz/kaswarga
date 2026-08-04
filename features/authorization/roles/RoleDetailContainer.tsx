'use client'

import { useRoleDetail }   from './hooks/useRoleDetail'
import RoleDetailView      from './RoleDetailView'
import type { RoleDetailData } from './hooks/useRoleDetail'

interface Props {
    role:    RoleDetailData
    canEdit: boolean
}

export default function RoleDetailContainer({ role, canEdit }: Props) {
    const detail = useRoleDetail(role.id, role.code)

    return (
        <RoleDetailView
            role={role}
            members={detail.members}
            overrideCount={detail.overrideCount}
            activeTab={detail.activeTab}
            overrideTarget={detail.overrideTarget}
            loading={detail.loading}
            error={detail.error}
            canEdit={canEdit}
            onTabChange={detail.setActiveTab}
            onConfigure={detail.setOverrideTarget}
            onCloseDrawer={() => detail.setOverrideTarget(null)}
        />
    )
}
