'use client'

import { useTranslations } from 'next-intl'
import Input               from '@/components/ui/Input'
import Button              from '@/components/ui/Button'
import Icon                from '@/components/ui/Icon'
import Ribbadge            from '@/components/ui/Ribbadge'
import OverrideTable       from './components/OverrideTable'
import type { MemberRow }  from '@/lib/repositories/member-override.repository'
import type { MemberInfo, PermissionGroup, OverrideSummary, OverrideFilter, RoleGroup } from './hooks/useMemberOverrides'

const ROLE_LABELS: Record<string, string> = {
    ADMIN:     'Administrator',
    CHAIR:     'Ketua',
    TREASURER: 'Bendahara',
    SECRETARY: 'Sekretaris',
    RESIDENT:  'Warga',
}

interface Props {
    singleMode:     boolean
    roleGroups:     RoleGroup[]
    selectedRole:   string | null
    members:        MemberRow[]
    memberSearch:   string
    selectedId:     string | null
    memberInfo:     MemberInfo | null
    filteredGroups: PermissionGroup[]
    localOverrides: Map<string, boolean | null>
    savedOverrides: Map<string, boolean | null>
    summary:        OverrideSummary
    search:         string
    filter:         OverrideFilter
    isDirty:        boolean
    dirtyCount:     number
    canEdit:        boolean
    loading:        boolean
    loadingMember:  boolean
    saving:         boolean
    error:          string | null
    onSelectRole:   (roleEnum: string | null) => void
    onMemberSearch: (s: string) => void
    onSelectMember: (id: string) => void
    onSearch:       (s: string) => void
    onFilterChange: (f: OverrideFilter) => void
    onSetOverride:  (permId: string, value: boolean | null) => void
    onSave:         () => void
    onDiscard:      () => void
}

export default function MemberOverridesView({
    singleMode,
    roleGroups, selectedRole,
    members, memberSearch, selectedId, memberInfo,
    filteredGroups, localOverrides, savedOverrides, summary, search, filter,
    isDirty, dirtyCount, canEdit, loading, loadingMember, saving, error,
    onSelectRole, onMemberSearch, onSelectMember, onSearch, onFilterChange, onSetOverride,
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

    const saveLabel = dirtyCount > 0
        ? `${tc('actions.save')} (${dirtyCount})`
        : t('saved')

    return (
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
                {!singleMode && canEdit && selectedId && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isDirty && (
                            <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving}>
                                {tc('actions.cancel')}
                            </Button>
                        )}
                        <Button size="sm" onClick={onSave} loading={saving} disabled={!isDirty}>
                            <Icon name="check" size={14} />
                            {saveLabel}
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

            <div className={singleMode ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>

                {/* Left panel (full-page mode only) */}
                {!singleMode && (
                    <div className="lg:col-span-1">

                        {selectedRole === null ? (
                            /* Stage 1 — Role list */
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted uppercase tracking-wider px-1">
                                    {t('selectRolePrompt')}
                                </p>
                                <div className="rounded-xl border border-divider bg-surface divide-y divide-divider">
                                    {roleGroups.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-sm text-muted">
                                            {tc('status.empty')}
                                        </p>
                                    ) : roleGroups.map(r => (
                                        <button
                                            key={r.roleEnum}
                                            className="w-full px-4 py-3 text-left hover:bg-canvas transition-colors flex items-center justify-between"
                                            onClick={() => onSelectRole(r.roleEnum)}
                                        >
                                            <div>
                                                <p className="font-medium text-foreground text-sm">
                                                    {ROLE_LABELS[r.roleEnum] ?? r.roleEnum}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {t('memberCount', { count: r.count })}
                                                </p>
                                            </div>
                                            <Icon name="chevron-right" size={14} className="text-muted shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Stage 2 — Member list for selected role */
                            <div className="space-y-3">
                                <button
                                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
                                    onClick={() => onSelectRole(null)}
                                >
                                    <Icon name="arrow-left" size={14} />
                                    {ROLE_LABELS[selectedRole] ?? selectedRole}
                                </button>

                                <Input
                                    value={memberSearch}
                                    onChange={e => onMemberSearch(e.target.value)}
                                    placeholder={t('memberSearchPlaceholder')}
                                />

                                <div className="rounded-xl border border-divider bg-surface divide-y divide-divider max-h-[calc(100vh-420px)] overflow-y-auto">
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
                                            <p className="text-xs text-muted">{m.email ?? ''}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Right panel — override editor */}
                <div className={singleMode ? '' : 'lg:col-span-2'}>
                    {!selectedId && !singleMode ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
                            <Icon name="user-cog" size={32} />
                            <p className="text-sm">
                                {selectedRole === null
                                    ? t('selectRolePrompt')
                                    : t('selectMemberPrompt')
                                }
                            </p>
                        </div>
                    ) : loadingMember ? (
                        <div className="flex items-center justify-center h-64 text-muted text-sm">
                            {tc('states.loading')}
                        </div>
                    ) : memberInfo ? (
                        <div className="space-y-4">

                            {/* Member info card */}
                            <div className="rounded-xl border border-divider bg-surface p-4 flex flex-wrap gap-6 items-center justify-between">
                                <div className="flex flex-wrap gap-6">
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted uppercase tracking-wider">{t('info.name')}</p>
                                        <p className="font-semibold text-foreground">{memberInfo.name ?? '—'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted uppercase tracking-wider">{t('info.status')}</p>
                                        <Ribbadge
                                            label={memberInfo.status === 'active' ? tc('status.active') : tc('status.inactive')}
                                            status={memberInfo.status === 'active' ? 'active' : 'inactive'}
                                            variant="rounded"
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs text-muted uppercase tracking-wider">{t('info.overrideCount')}</p>
                                        <p className="font-semibold text-foreground">{summary.overrides}</p>
                                    </div>
                                </div>
                                {singleMode && canEdit && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isDirty && (
                                            <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving}>
                                                {tc('actions.cancel')}
                                            </Button>
                                        )}
                                        <Button size="sm" onClick={onSave} loading={saving} disabled={!isDirty}>
                                            <Icon name="check" size={14} />
                                            {saveLabel}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Summary card */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-divider bg-surface p-3 text-center">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.granted')}</p>
                                    <p className="text-2xl font-bold text-success">{summary.granted}</p>
                                </div>
                                <div className="rounded-xl border border-divider bg-surface p-3 text-center">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.denied')}</p>
                                    <p className="text-2xl font-bold text-danger">{summary.denied}</p>
                                </div>
                                <div className="rounded-xl border border-divider bg-surface p-3 text-center">
                                    <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.overrides')}</p>
                                    <p className="text-2xl font-bold text-warning">{summary.overrides}</p>
                                </div>
                            </div>

                            {/* Info banner */}
                            {canEdit && (
                                <div className="flex items-start gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground">
                                    <Icon name="alert-circle" size={14} className="mt-0.5 shrink-0 text-primary" />
                                    <span>{t('overrideNote', { memberName: memberInfo.name ?? '—' })}</span>
                                </div>
                            )}

                            {/* Permission search */}
                            <Input
                                value={search}
                                onChange={e => onSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                            />

                            {/* Override table */}
                            <OverrideTable
                                groups={filteredGroups}
                                localOverrides={localOverrides}
                                savedOverrides={savedOverrides}
                                canEdit={canEdit}
                                filter={filter}
                                onSetOverride={onSetOverride}
                                onFilterChange={onFilterChange}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
