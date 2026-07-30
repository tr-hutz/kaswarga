'use client'

import { useTranslations } from 'next-intl'
import Input               from '@/components/ui/Input'
import Button              from '@/components/ui/Button'
import Icon                from '@/components/ui/Icon'
import Ribbadge            from '@/components/ui/Ribbadge'
import OverrideTable       from './components/OverrideTable'
import type { MemberRow }  from '@/lib/repositories/member-override.repository'
import type { MemberInfo, PermissionGroup } from './hooks/useMemberOverrides'

interface Props {
    members:        MemberRow[]
    memberSearch:   string
    selectedId:     string | null
    memberInfo:     MemberInfo | null
    filteredGroups: PermissionGroup[]
    localOverrides: Map<string, boolean | null>
    search:         string
    isDirty:        boolean
    canEdit:        boolean
    loading:        boolean
    loadingMember:  boolean
    saving:         boolean
    error:          string | null
    onMemberSearch: (s: string) => void
    onSelectMember: (id: string) => void
    onSearch:       (s: string) => void
    onSetOverride:  (permId: string, value: boolean | null) => void
    onSave:         () => void
    onDiscard:      () => void
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN:     'Administrator',
    CHAIR:     'Ketua',
    TREASURER: 'Bendahara',
    SECRETARY: 'Sekretaris',
    RESIDENT:  'Warga',
}

export default function MemberOverridesView({
    members, memberSearch, selectedId, memberInfo,
    filteredGroups, localOverrides, search,
    isDirty, canEdit, loading, loadingMember, saving, error,
    onMemberSearch, onSelectMember, onSearch, onSetOverride,
    onSave, onDiscard,
}: Props) {
    const t  = useTranslations('overrides')
    const tc = useTranslations('common')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
                {tc('states.loading')}
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>

                {canEdit && selectedId && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isDirty && (
                            <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving}>
                                {tc('actions.cancel')}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={onSave}
                            loading={saving}
                            disabled={!isDirty}
                        >
                            <Icon name="check" size={14} />
                            {isDirty ? tc('actions.saveChanges') : t('saved')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Dirty banner */}
            {isDirty && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
                    <Icon name="alert-triangle" size={14} />
                    {t('unsavedChanges')}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
                    <Icon name="alert-triangle" size={14} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Member list */}
                <div className="lg:col-span-1 space-y-3">
                    <Input
                        label={t('memberSearch')}
                        value={memberSearch}
                        onChange={e => onMemberSearch(e.target.value)}
                        placeholder={t('memberSearchPlaceholder')}
                    />

                    <div className="rounded-xl border border-divider bg-surface divide-y divide-divider max-h-[calc(100vh-380px)] overflow-y-auto">
                        {members.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted">
                                {tc('status.empty')}
                            </p>
                        ) : members.map(m => (
                            <button
                                key={m.membershipId}
                                className={`w-full px-4 py-3 text-left hover:bg-canvas transition-colors ${
                                    selectedId === m.membershipId
                                        ? 'bg-primary/5 border-l-2 border-l-primary'
                                        : ''
                                }`}
                                onClick={() => onSelectMember(m.membershipId)}
                            >
                                <p className="font-medium text-foreground text-sm">{m.name ?? '—'}</p>
                                <p className="text-xs text-muted">{ROLE_LABELS[m.roleEnum] ?? m.roleEnum}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Overrides */}
                <div className="lg:col-span-2 space-y-4">

                    {!selectedId ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
                            <Icon name="user-cog" size={32} />
                            <p className="text-sm">{t('selectMemberPrompt')}</p>
                        </div>
                    ) : loadingMember ? (
                        <div className="flex items-center justify-center h-64 text-muted text-sm">
                            {tc('states.loading')}
                        </div>
                    ) : memberInfo ? (
                        <>
                            {/* Member info card */}
                            <div className="rounded-xl border border-divider bg-surface p-4 flex flex-wrap gap-6">
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted uppercase tracking-wider">{t('info.name')}</p>
                                    <p className="font-semibold text-foreground">{memberInfo.name ?? '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted uppercase tracking-wider">{t('info.role')}</p>
                                    <p className="font-medium text-foreground">{memberInfo.roleName}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted uppercase tracking-wider">{t('info.status')}</p>
                                    <Ribbadge
                                        label={memberInfo.status === 'active' ? tc('status.active') : tc('status.inactive')}
                                        status={memberInfo.status === 'active' ? 'active' : 'inactive'}
                                        variant="rounded"
                                    />
                                </div>
                            </div>

                            {/* Override scope note */}
                            {canEdit && (
                                <div className="flex items-start gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground">
                                    <Icon name="alert-circle" size={14} className="mt-0.5 shrink-0 text-primary" />
                                    <span>{t('overrideNote', { roleName: memberInfo.roleName })}</span>
                                </div>
                            )}

                            {/* Permission search */}
                            <Input
                                value={search}
                                onChange={e => onSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                            />

                            {/* Override table */}
                            {filteredGroups.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-muted text-sm">
                                    {tc('status.empty')}
                                </div>
                            ) : (
                                <OverrideTable
                                    groups={filteredGroups}
                                    localOverrides={localOverrides}
                                    canEdit={canEdit}
                                    onSetOverride={onSetOverride}
                                />
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
