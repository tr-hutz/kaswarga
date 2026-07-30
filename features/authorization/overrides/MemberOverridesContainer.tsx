'use client'

import { useTranslations }    from 'next-intl'
import { useToast }           from '@/components/ui/ToastProvider'
import { useMemberOverrides } from './hooks/useMemberOverrides'
import MemberOverridesView    from './MemberOverridesView'

interface Props {
    canEdit: boolean
}

export default function MemberOverridesContainer({ canEdit }: Props) {
    const t         = useTranslations('overrides')
    const { toast } = useToast()
    const overrides = useMemberOverrides(canEdit)

    async function handleSave() {
        const ok = await overrides.save()
        if (ok) {
            toast({ message: t('toast.saved'), type: 'success' })
        } else if (overrides.error) {
            toast({ message: overrides.error, type: 'error' })
        }
    }

    return (
        <MemberOverridesView
            members={overrides.members}
            memberSearch={overrides.memberSearch}
            selectedId={overrides.selectedId}
            memberInfo={overrides.memberInfo}
            filteredGroups={overrides.filteredGroups}
            localOverrides={overrides.localOverrides}
            search={overrides.search}
            isDirty={overrides.isDirty}
            canEdit={canEdit}
            loading={overrides.loading}
            loadingMember={overrides.loadingMember}
            saving={overrides.saving}
            error={overrides.error}
            onMemberSearch={overrides.setMemberSearch}
            onSelectMember={overrides.selectMember}
            onSearch={overrides.setSearch}
            onSetOverride={overrides.setOverride}
            onSave={handleSave}
            onDiscard={overrides.discardChanges}
        />
    )
}
