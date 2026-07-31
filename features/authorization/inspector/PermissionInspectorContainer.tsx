'use client'

import { usePermissionInspector }  from './hooks/usePermissionInspector'
import PermissionInspectorView     from './PermissionInspectorView'

export default function PermissionInspectorContainer() {
    const v = usePermissionInspector()

    return (
        <PermissionInspectorView
            activeTab={v.activeTab}
            onTabChange={v.setActiveTab}
            filteredPermissions={v.filteredPermissions}
            permSearch={v.permSearch}
            moduleFilter={v.moduleFilter}
            modules={v.modules}
            selectedPermId={v.selectedPermId}
            selectedPermission={v.selectedPermission}
            permDetail={v.permDetail}
            loadingDetail={v.loadingDetail}
            onPermSearch={v.setPermSearch}
            onModuleFilter={v.setModuleFilter}
            onSelectPermission={v.selectPermission}
            filteredMembers={v.filteredMembers}
            memberSearch={v.memberSearch}
            roleFilter={v.roleFilter}
            roleGroups={v.roleGroups}
            selectedMemberId={v.selectedMemberId}
            memberDetail={v.memberDetail}
            loadingMember={v.loadingMember}
            onMemberSearch={v.setMemberSearch}
            onRoleFilter={v.setRoleFilter}
            onSelectMember={v.selectMember}
            loading={v.loading}
            error={v.error}
        />
    )
}
