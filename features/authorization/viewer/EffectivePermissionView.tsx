'use client'

import { useTranslations }      from 'next-intl'
import Input                     from '@/components/ui/Input'
import Button                    from '@/components/ui/Button'
import Icon                      from '@/components/ui/Icon'
import Select                    from '@/components/ui/Select'
import Ribbon                  from '@/components/ui/Ribbon'
import PermissionDetailTable     from './components/PermissionDetailTable'
import type { MemberRow }        from '@/lib/repositories/member-override.repository'
import type {
    ViewerMemberInfo, ViewerSummary, PermissionViewRow,
    ViewerFilter, ViewerSort, RoleGroup,
} from './hooks/useEffectivePermission'

const ROLE_LABELS: Record<string, string> = {
    ADMIN:     'Administrator',
    CHAIR:     'Ketua',
    TREASURER: 'Bendahara',
    SECRETARY: 'Sekretaris',
    RESIDENT:  'Warga',
}

interface Props {
    roleGroups:      RoleGroup[]
    filteredMembers: MemberRow[]
    memberSearch:    string
    roleFilter:      string
    selectedId:      string | null
    memberInfo:      ViewerMemberInfo | null
    filteredRows:    PermissionViewRow[]
    summary:         ViewerSummary
    search:          string
    filter:          ViewerFilter
    sort:            ViewerSort
    expanded:        Set<string>
    loading:         boolean
    loadingMember:   boolean
    error:           string | null
    onMemberSearch:  (s: string) => void
    onRoleFilter:    (r: string) => void
    onSelectMember:  (id: string) => void
    onSearch:        (s: string) => void
    onFilterChange:  (f: ViewerFilter) => void
    onSortChange:    (s: ViewerSort) => void
    onToggleExpand:  (id: string) => void
    onRefresh:       () => void
    onExportCsv:     () => void
}

export default function EffectivePermissionView({
    roleGroups, filteredMembers, memberSearch, roleFilter,
    selectedId, memberInfo, filteredRows, summary,
    search, filter, sort, expanded,
    loading, loadingMember, error,
    onMemberSearch, onRoleFilter, onSelectMember,
    onSearch, onFilterChange, onSortChange, onToggleExpand,
    onRefresh, onExportCsv,
}: Props) {
    const t  = useTranslations('viewer')
    const tc = useTranslations('common')

    const roleOptions = [
        { value: 'all', label: t('filter.allRoles') },
        ...roleGroups.map(r => ({
            value: r.roleEnum,
            label: `${ROLE_LABELS[r.roleEnum] ?? r.roleEnum} (${r.count})`,
        })),
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
                {tc('states.loading')}
            </div>
        )
    }

    return (
        <div className="space-y-6">

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
                    <Icon name="alert-triangle" size={14} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left panel — member selector */}
                <div className="lg:col-span-1 space-y-3">
                    <Input
                        value={memberSearch}
                        onChange={e => onMemberSearch(e.target.value)}
                        placeholder={t('memberSearchPlaceholder')}
                    />
                    <Select
                        value={roleFilter}
                        onChange={e => onRoleFilter(e.target.value)}
                        options={roleOptions}
                    />
                    <div className="rounded-xl border border-divider bg-surface divide-y divide-divider max-h-[max(200px,calc(100vh-380px))] overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-muted">{tc('status.empty')}</p>
                        ) : filteredMembers.map(m => (
                            <button
                                key={m.membershipId}
                                className={`w-full px-4 py-3 text-left hover:bg-canvas transition-colors ${
                                    selectedId === m.membershipId ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                }`}
                                onClick={() => onSelectMember(m.membershipId)}
                            >
                                <p className="font-medium text-foreground text-sm">{m.name ?? '—'}</p>
                                <p className="text-xs text-muted">{ROLE_LABELS[m.roleEnum] ?? m.roleEnum}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right panel — permission viewer */}
                <div className="lg:col-span-2 space-y-4">
                    {!selectedId ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
                            <Icon name="shield" size={32} />
                            <p className="text-sm">{t('selectMemberPrompt')}</p>
                        </div>
                    ) : loadingMember ? (
                        <div className="flex items-center justify-center h-64 text-muted text-sm">
                            {tc('states.loading')}
                        </div>
                    ) : memberInfo ? (
                        <>
                            {/* Summary card */}
                            <div className="rounded-xl border border-divider bg-surface p-4 space-y-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex flex-wrap gap-6">
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted uppercase tracking-wider">{t('summary.member')}</p>
                                            <p className="font-semibold text-foreground">{memberInfo.name ?? '—'}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted uppercase tracking-wider">{t('summary.role')}</p>
                                            <p className="font-medium text-foreground">{memberInfo.roleName}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-muted uppercase tracking-wider">{t('summary.status')}</p>
                                            <Ribbon
                                                label={memberInfo.status === 'active' ? tc('status.active') : tc('status.inactive')}
                                                type={memberInfo.status === 'active' ? 'active' : 'inactive'}
                                                variant="rounded"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingMember}>
                                            <Icon name="refresh-cw" size={14} />
                                            {t('refresh')}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={onExportCsv} disabled={filteredRows.length === 0}>
                                            <Icon name="download" size={14} />
                                            {t('exportCsv')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-divider">
                                    <div className="text-center">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.total')}</p>
                                        <p className="text-xl font-bold text-foreground">{summary.total}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.granted')}</p>
                                        <p className="text-xl font-bold text-success">{summary.granted}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.denied')}</p>
                                        <p className="text-xl font-bold text-danger">{summary.denied}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted uppercase tracking-wider mb-1">{t('summary.overrides')}</p>
                                        <p className="text-xl font-bold text-warning">{summary.overrides}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <Input
                                value={search}
                                onChange={e => onSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                            />

                            {/* Permission table */}
                            <PermissionDetailTable
                                rows={filteredRows}
                                expanded={expanded}
                                filter={filter}
                                sort={sort}
                                onToggleExpand={onToggleExpand}
                                onFilterChange={onFilterChange}
                                onSortChange={onSortChange}
                            />
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
