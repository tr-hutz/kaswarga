'use client'

import { useTranslations }    from 'next-intl'
import { useToast }           from '@/components/ui/ToastProvider'
import { useMemberOverrides } from './hooks/useMemberOverrides'
import MemberOverridesView    from './MemberOverridesView'

interface Props {
    membershipId: string
    canEdit:      boolean
}

export default function SingleMemberOverrideContainer({ membershipId, canEdit }: Props) {
    const t         = useTranslations('overrides')
    const { toast } = useToast()
    const ov        = useMemberOverrides({ canEdit, singleMembershipId: membershipId })

    async function handleSave() {
        const ok = await ov.save()
        if (ok)            toast({ message: t('toast.saved'), type: 'success' })
        else if (ov.error) toast({ message: ov.error,         type: 'error' })
    }

    return (
        <MemberOverridesView
            singleMode={true}
            members={[]}
            memberSearch=""
            selectedId={membershipId}
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
            loading={false}
            loadingMember={ov.loadingMember}
            saving={ov.saving}
            error={ov.error}
            onMemberSearch={() => {}}
            onSelectMember={() => {}}
            onSearch={ov.setSearch}
            onFilterChange={ov.setFilter}
            onSetOverride={ov.setOverride}
            onSave={handleSave}
            onDiscard={ov.discardChanges}
        />
    )
}
