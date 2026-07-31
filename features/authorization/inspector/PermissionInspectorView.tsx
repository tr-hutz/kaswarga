'use client'

import { useTranslations }        from 'next-intl'
import Input                       from '@/components/ui/Input'
import Select                      from '@/components/ui/Select'
import Icon                        from '@/components/ui/Icon'
import PermissionDetailPanel       from './components/PermissionDetailPanel'
import MemberDetailPanel           from './components/MemberDetailPanel'
import type { InspectorTab, PermissionDetails } from './types'
import type {
    InspectorMemberRow,
    MemberDetailData,
} from './hooks/usePermissionInspector'

interface PermRow {
    id:          string
    code:        string
    name:        string
    description: string | null
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN:     'Administrator',
    CHAIR:     'Ketua',
    TREASURER: 'Bendahara',
    SECRETARY: 'Sekretaris',
    RESIDENT:  'Warga',
}

const MODULE_LABELS: Record<string, string> = {
    resident:   'Warga',
    membership: 'Keanggotaan',
    payment:    'Pembayaran',
    expense:    'Pengeluaran',
    ledger:     'Buku Kas',
    report:     'Laporan',
    announcement: 'Pengumuman',
    event:      'Acara',
    document:   'Dokumen',
    settings:   'Pengaturan',
    user:       'Pengguna',
    role:       'Role',
    permission: 'Izin',
    rbac:       'Otorisasi',
    audit:      'Audit',
    other:      'Lainnya',
}

interface Props {
    activeTab:           InspectorTab
    onTabChange:         (tab: InspectorTab) => void
    // Permission View
    filteredPermissions: PermRow[]
    permSearch:          string
    moduleFilter:        string
    modules:             string[]
    selectedPermId:      string | null
    selectedPermission:  PermRow | null
    permDetail:          PermissionDetails | null
    loadingDetail:       boolean
    onPermSearch:        (s: string) => void
    onModuleFilter:      (m: string) => void
    onSelectPermission:  (id: string) => void
    // Member View
    filteredMembers:     InspectorMemberRow[]
    memberSearch:        string
    roleFilter:          string
    roleGroups:          { roleEnum: string; count: number }[]
    selectedMemberId:    string | null
    memberDetail:        MemberDetailData | null
    loadingMember:       boolean
    onMemberSearch:      (s: string) => void
    onRoleFilter:        (r: string) => void
    onSelectMember:      (id: string) => void
    // Shared
    loading:             boolean
    error:               string | null
}

export default function PermissionInspectorView({
    activeTab, onTabChange,
    filteredPermissions, permSearch, moduleFilter, modules,
    selectedPermId, selectedPermission, permDetail, loadingDetail,
    onPermSearch, onModuleFilter, onSelectPermission,
    filteredMembers, memberSearch, roleFilter, roleGroups,
    selectedMemberId, memberDetail, loadingMember,
    onMemberSearch, onRoleFilter, onSelectMember,
    loading, error,
}: Props) {
    const t  = useTranslations('inspector')
    const tc = useTranslations('common')

    const moduleOptions = [
        { value: 'all', label: t('filter.allModules') },
        ...modules.map(m => ({ value: m, label: MODULE_LABELS[m] ?? m })),
    ]

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
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
                    <Icon name="alert-triangle" size={14} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left panel ── */}
                <div className="lg:col-span-1 space-y-3">

                    {/* Tab toggle */}
                    <div className="flex rounded-lg border border-divider overflow-hidden">
                        {(['permission', 'member'] as InspectorTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? 'bg-primary text-white'
                                        : 'bg-surface text-muted hover:text-foreground'
                                }`}
                            >
                                {t(`tabs.${tab}` as Parameters<typeof t>[0])}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'permission' && (
                        <>
                            <Input
                                value={permSearch}
                                onChange={e => onPermSearch(e.target.value)}
                                placeholder={t('permission.searchPlaceholder')}
                            />
                            <Select
                                value={moduleFilter}
                                onChange={e => onModuleFilter(e.target.value)}
                                options={moduleOptions}
                            />
                            <div className="rounded-xl border border-divider bg-surface divide-y divide-divider max-h-[calc(100vh-420px)] overflow-y-auto">
                                {filteredPermissions.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-sm text-muted">{tc('status.empty')}</p>
                                ) : filteredPermissions.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => onSelectPermission(p.id)}
                                        className={`w-full px-4 py-3 text-left hover:bg-canvas transition-colors ${
                                            selectedPermId === p.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                        }`}
                                    >
                                        <p className="font-medium text-foreground text-sm">{p.name}</p>
                                        <p className="text-xs text-muted font-mono">{p.code}</p>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'member' && (
                        <>
                            <Input
                                value={memberSearch}
                                onChange={e => onMemberSearch(e.target.value)}
                                placeholder={t('member.searchPlaceholder')}
                            />
                            <Select
                                value={roleFilter}
                                onChange={e => onRoleFilter(e.target.value)}
                                options={roleOptions}
                            />
                            <div className="rounded-xl border border-divider bg-surface divide-y divide-divider max-h-[calc(100vh-420px)] overflow-y-auto">
                                {filteredMembers.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-sm text-muted">{tc('status.empty')}</p>
                                ) : filteredMembers.map(m => (
                                    <button
                                        key={m.membershipId}
                                        onClick={() => onSelectMember(m.membershipId)}
                                        className={`w-full px-4 py-3 text-left hover:bg-canvas transition-colors ${
                                            selectedMemberId === m.membershipId ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                        }`}
                                    >
                                        <p className="font-medium text-foreground text-sm">{m.name ?? '—'}</p>
                                        <p className="text-xs text-muted">{ROLE_LABELS[m.roleEnum] ?? m.roleEnum}</p>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Right panel ── */}
                <div className="lg:col-span-2">
                    {activeTab === 'permission' && (
                        !selectedPermId ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
                                <Icon name="key-round" size={32} />
                                <p className="text-sm">{t('permission.selectPrompt')}</p>
                            </div>
                        ) : loadingDetail ? (
                            <div className="flex items-center justify-center h-64 text-muted text-sm">
                                {tc('states.loading')}
                            </div>
                        ) : (selectedPermission && permDetail) ? (
                            <PermissionDetailPanel permission={selectedPermission} detail={permDetail} />
                        ) : null
                    )}

                    {activeTab === 'member' && (
                        !selectedMemberId ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
                                <Icon name="users" size={32} />
                                <p className="text-sm">{t('member.selectPrompt')}</p>
                            </div>
                        ) : loadingMember ? (
                            <div className="flex items-center justify-center h-64 text-muted text-sm">
                                {tc('states.loading')}
                            </div>
                        ) : memberDetail ? (
                            <MemberDetailPanel detail={memberDetail} />
                        ) : null
                    )}
                </div>
            </div>
        </div>
    )
}
