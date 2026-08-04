'use client'

import { useEffectivePermission } from './hooks/useEffectivePermission'
import EffectivePermissionView    from './EffectivePermissionView'

export default function EffectivePermissionContainer() {
    const v = useEffectivePermission()

    return (
        <EffectivePermissionView
            roleGroups={v.roleGroups}
            filteredMembers={v.filteredMembers}
            memberSearch={v.memberSearch}
            roleFilter={v.roleFilter}
            selectedId={v.selectedId}
            memberInfo={v.memberInfo}
            filteredRows={v.filteredRows}
            summary={v.summary}
            search={v.search}
            filter={v.filter}
            sort={v.sort}
            expanded={v.expanded}
            loading={v.loading}
            loadingMember={v.loadingMember}
            error={v.error}
            onMemberSearch={v.setMemberSearch}
            onRoleFilter={v.setRoleFilter}
            onSelectMember={v.selectMember}
            onSearch={v.setSearch}
            onFilterChange={v.setFilter}
            onSortChange={v.setSort}
            onToggleExpand={v.toggleExpanded}
            onRefresh={v.refresh}
            onExportCsv={v.exportCsv}
        />
    )
}
