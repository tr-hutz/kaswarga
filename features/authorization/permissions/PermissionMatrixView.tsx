'use client'

import { useTranslations } from 'next-intl'
import Input               from '@/components/ui/Input'
import Button              from '@/components/ui/Button'
import Icon                from '@/components/ui/Icon'
import Select              from '@/components/ui/Select'
import PermissionGrid      from './components/PermissionGrid'
import type { RoleRow }    from '@/lib/repositories/role.repository'
import type { PermissionGroup } from './hooks/usePermissionMatrix'

interface Props {
    roles:          RoleRow[]
    selectedRoleId: string
    filteredGroups: PermissionGroup[]
    localSet:       Set<string>
    search:         string
    isDirty:        boolean
    canEdit:        boolean
    loading:        boolean
    loadingRole:    boolean
    saving:         boolean
    error:          string | null
    onRoleChange:   (id: string) => void
    onSearch:       (s: string) => void
    onToggle:       (permId: string) => void
    onSelectAll:    (module: string) => void
    onClearAll:     (module: string) => void
    onSave:         () => void
    onDiscard:      () => void
}

export default function PermissionMatrixView({
    roles,
    selectedRoleId,
    filteredGroups,
    localSet,
    search,
    isDirty,
    canEdit,
    loading,
    loadingRole,
    saving,
    error,
    onRoleChange,
    onSearch,
    onToggle,
    onSelectAll,
    onClearAll,
    onSave,
    onDiscard,
}: Props) {
    const t  = useTranslations('permissions')
    const tc = useTranslations('common')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
                {tc('states.loading')}
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-danger">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    {tc('actions.retry')}
                </Button>
            </div>
        )
    }

    const roleOptions = roles.map(r => ({ value: r.id, label: r.name }))

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
                </div>

                {canEdit && (
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
                            {isDirty ? t('saveChanges') : t('saved')}
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

            {/* Role selector + Search */}
            <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-48 max-w-xs">
                    <Select
                        label={t('roleLabel')}
                        value={selectedRoleId}
                        onChange={e => onRoleChange(e.target.value)}
                        disabled={loadingRole}
                        options={roleOptions}
                    />
                </div>
                <div className="flex-1 min-w-48 max-w-xs">
                    <Input
                        label={t('searchLabel')}
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                    />
                </div>
            </div>

            {/* Grid */}
            {loadingRole ? (
                <div className="flex items-center justify-center h-40 text-muted text-sm">
                    {tc('states.loading')}
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted text-sm">
                    {tc('status.empty')}
                </div>
            ) : (
                <PermissionGrid
                    groups={filteredGroups}
                    localSet={localSet}
                    canEdit={canEdit}
                    onToggle={onToggle}
                    onSelectAll={onSelectAll}
                    onClearAll={onClearAll}
                />
            )}
        </div>
    )
}
