'use client'

import { useTranslations } from 'next-intl'
import Button              from '@/components/ui/Button'
import Icon                from '@/components/ui/Icon'
import Drawer              from '@/components/ui/Drawer'
import SingleMemberOverrideContainer from '@/features/authorization/overrides/SingleMemberOverrideContainer'
import type { MemberRow }  from '@/lib/repositories/member-override.repository'

interface Props {
    members:        MemberRow[]
    overrideCount:  number
    loading:        boolean
    error:          string | null
    canEdit:        boolean
    overrideTarget: string | null
    onConfigure:    (membershipId: string) => void
    onCloseDrawer:  () => void
}

export default function MembersTab({
    members, overrideCount, loading, error, canEdit,
    overrideTarget, onConfigure, onCloseDrawer,
}: Props) {
    const t  = useTranslations('roles')
    const tc = useTranslations('common')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-muted text-sm">
                {tc('states.loading')}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-40 text-danger text-sm">
                {error}
            </div>
        )
    }

    return (
        <>
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-canvas rounded-lg border border-divider text-sm text-muted">
                <Icon name="shield" size={14} />
                {t('members.overrideBanner', { count: overrideCount })}
            </div>

            <div className="rounded-xl border border-divider bg-surface divide-y divide-divider">
                {members.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted">
                        {tc('status.empty')}
                    </p>
                ) : members.map(m => (
                    <div key={m.membershipId} className="flex items-center justify-between px-4 py-3">
                        <div>
                            <p className="font-medium text-foreground text-sm">{m.name ?? '—'}</p>
                            <p className="text-xs text-muted">{t('members.overrideCount', { count: overrideCount })}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConfigure(m.membershipId)}
                        >
                            <Icon name="settings" size={14} />
                            {t('members.configure')}
                        </Button>
                    </div>
                ))}
            </div>

            <Drawer
                open={!!overrideTarget}
                title={t('members.drawerTitle')}
                onClose={onCloseDrawer}
            >
                {overrideTarget && (
                    <SingleMemberOverrideContainer
                        membershipId={overrideTarget}
                        canEdit={canEdit}
                    />
                )}
            </Drawer>
        </>
    )
}
