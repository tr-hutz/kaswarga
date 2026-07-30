'use client'

import { useTranslations }    from 'next-intl'
import { useToast }           from '@/components/ui/ToastProvider'
import { useMemberOverrides } from './hooks/useMemberOverrides'
import MemberOverridesView    from './MemberOverridesView'

interface Props {
    canEdit:      boolean
    initialRole?: string
}

export default function MemberOverridesContainer({ canEdit, initialRole }: Props) {
    const t         = useTranslations('overrides')
    const { toast } = useToast()
    const ov        = useMemberOverrides({ canEdit, initialRole })

    async function handleSave() {
        const ok = await ov.save()
        if (ok)            toast({ message: t('toast.saved'), type: 'success' })
        else if (ov.error) toast({ message: ov.error,         type: 'error' })
    }

    return (
        <MemberOverridesView
            singleMode={false}
            roleGroups={ov.roleGroups}
            selectedRole={ov.selectedRole}
            members={ov.members}
            memberSearch={ov.memberSearch}
            selectedId={ov.selectedId}
            memberInfo={ov.memberInfo}
            filteredGroups={ov.filteredGroups}
            localOverrides={ov.localOverrides}
            savedOverrides={ov.savedOverrides}
            summary={ov.summary}
            search={ov.search}
            filter={ov.filter}
            isDirty={ov.isDirty}
            dirtyCount={ov.dirtyCount}
            canEdit={canEdit}
            loading={ov.loading}
            loadingMember={ov.loadingMember}
            saving={ov.saving}
            error={ov.error}
            onSelectRole={ov.selectRole}
            onMemberSearch={ov.setMemberSearch}
            onSelectMember={ov.selectMember}
            onSearch={ov.setSearch}
            onFilterChange={ov.setFilter}
            onSetOverride={ov.setOverride}
            onSave={handleSave}
            onDiscard={ov.discardChanges}
        />
    )
}
