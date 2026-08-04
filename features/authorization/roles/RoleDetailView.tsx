'use client'

import { useTranslations } from 'next-intl'
import Link                from 'next/link'
import Icon                from '@/components/ui/Icon'
import MembersTab          from './components/MembersTab'
import type { RoleDetailData, RoleDetailTab } from './hooks/useRoleDetail'
import type { MemberRow }  from '@/lib/repositories/member-override.repository'

interface Props {
    role:           RoleDetailData
    members:        MemberRow[]
    overrideCount:  number
    activeTab:      RoleDetailTab
    overrideTarget: string | null
    loading:        boolean
    error:          string | null
    canEdit:        boolean
    onTabChange:    (tab: RoleDetailTab) => void
    onConfigure:    (membershipId: string) => void
    onCloseDrawer:  () => void
}

const TABS: { key: RoleDetailTab; labelKey: string; icon: 'users' | 'shield' | 'clock' }[] = [
    { key: 'members', labelKey: 'detail.tabs.members', icon: 'users' },
    { key: 'matrix',  labelKey: 'detail.tabs.matrix',  icon: 'shield' },
    { key: 'audit',   labelKey: 'detail.tabs.audit',   icon: 'clock' },
]

export default function RoleDetailView({
    role, members, overrideCount, activeTab, overrideTarget,
    loading, error, canEdit,
    onTabChange, onConfigure, onCloseDrawer,
}: Props) {
    const t = useTranslations('roles')

    return (
        <div className="space-y-6">

            <div>
                <Link
                    href="/settings/authorization/roles"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4"
                >
                    <Icon name="arrow-left" size={14} />
                    {t('detail.back')}
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{role.name}</h1>
                        <p className="text-sm text-muted font-mono">{role.code}</p>
                        {role.description && (
                            <p className="text-sm text-muted mt-1">{role.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.is_active ? 'bg-success/10 text-success' : 'bg-canvas text-muted'}`}>
                            {role.is_active ? t('status.active') : t('status.inactive')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-b border-divider">
                <nav className="flex gap-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-foreground'
                            }`}
                        >
                            <Icon name={tab.icon} size={14} />
                            {t(tab.labelKey as Parameters<typeof t>[0])}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'members' && (
                <MembersTab
                    members={members}
                    overrideCount={overrideCount}
                    loading={loading}
                    error={error}
                    canEdit={canEdit}
                    overrideTarget={overrideTarget}
                    onConfigure={onConfigure}
                    onCloseDrawer={onCloseDrawer}
                />
            )}

            {activeTab === 'matrix' && (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted">
                    <Icon name="properties" size={32} />
                    <p className="text-sm">{t('detail.matrixRedirect')}</p>
                    <Link
                        href="/settings/authorization/permissions"
                        className="text-sm text-primary hover:underline"
                    >
                        {t('detail.openMatrix')}
                    </Link>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted">
                    <Icon name="clock" size={32} />
                    <p className="text-sm">{t('detail.auditComingSoon')}</p>
                </div>
            )}
        </div>
    )
}
