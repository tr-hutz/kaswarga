'use client'

import { useTranslations } from 'next-intl'
import Icon                from '@/components/ui/Icon'
import type { PermissionGroup, OverrideFilter } from '@/features/authorization/overrides/hooks/useMemberOverrides'
import { MODULE_LABELS, PERMISSION_LABELS } from '@/features/authorization/inspector/labels'

interface Props {
    groups:         PermissionGroup[]
    localOverrides: Map<string, boolean | null>
    savedOverrides: Map<string, boolean | null>
    canEdit:        boolean
    filter:         OverrideFilter
    onSetOverride:  (permissionId: string, value: boolean | null) => void
    onFilterChange: (f: OverrideFilter) => void
}

function SourceBadge({ roleAllow, overrideAllow }: { roleAllow: boolean | null; overrideAllow: boolean | null }) {
    const t = useTranslations('overrides')

    if (overrideAllow === true) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                <Icon name="check" size={10} />
                {t('source.overrideGrant')}
            </span>
        )
    }
    if (overrideAllow === false) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                <Icon name="x" size={10} />
                {t('source.overrideRevoke')}
            </span>
        )
    }
    if (roleAllow === true) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Icon name="check" size={10} />
                {t('source.role')}
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-canvas text-muted">
            {t('source.none')}
        </span>
    )
}

function OverrideToggle({
    permissionId,
    currentOverride,
    disabled,
    onSetOverride,
}: {
    permissionId:    string
    currentOverride: boolean | null
    disabled:        boolean
    onSetOverride:   (permId: string, v: boolean | null) => void
}) {
    const t    = useTranslations('overrides')
    const base = 'px-2 py-1 text-xs rounded border transition-colors'

    return (
        <div className="flex items-center gap-1">
            <button
                className={`${base} ${currentOverride === null ? 'bg-canvas border-primary text-primary font-medium' : 'border-divider text-muted hover:border-foreground hover:text-foreground'} disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, null)}
                disabled={disabled || currentOverride === null}
            >
                {t('override.default')}
            </button>
            <button
                className={`${base} ${currentOverride === true ? 'bg-success/10 border-success text-success font-medium' : 'border-divider text-muted hover:border-success hover:text-success'} disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, true)}
                disabled={disabled || currentOverride === true}
            >
                {t('override.grant')}
            </button>
            <button
                className={`${base} ${currentOverride === false ? 'bg-danger/10 border-danger text-danger font-medium' : 'border-divider text-muted hover:border-danger hover:text-danger'} disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, false)}
                disabled={disabled || currentOverride === false}
            >
                {t('override.revoke')}
            </button>
        </div>
    )
}

const FILTERS: { value: OverrideFilter; labelKey: string }[] = [
    { value: 'all',      labelKey: 'filter.all' },
    { value: 'granted',  labelKey: 'filter.granted' },
    { value: 'denied',   labelKey: 'filter.denied' },
    { value: 'override', labelKey: 'filter.overrideOnly' },
]

export default function OverrideTable({ groups, localOverrides, savedOverrides, canEdit, filter, onSetOverride, onFilterChange }: Props) {
    const t       = useTranslations('overrides')
    const colSpan = canEdit ? 4 : 3

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => onFilterChange(f.value)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            filter === f.value
                                ? 'bg-primary text-white border-primary'
                                : 'border-divider text-muted hover:border-foreground hover:text-foreground'
                        }`}
                    >
                        {t(f.labelKey as Parameters<typeof t>[0])}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-divider bg-surface">
                {groups.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted">Tidak ada izin yang cocok</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-divider bg-canvas">
                                <th className="px-4 py-3 text-left font-semibold text-foreground min-w-[240px]">
                                    {t('table.permission')}
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground w-[160px]">
                                    {t('table.source')}
                                </th>
                                {canEdit && (
                                    <th className="px-4 py-3 text-left font-semibold text-foreground w-[210px]">
                                        {t('table.override')}
                                    </th>
                                )}
                                <th className="px-4 py-3 text-center font-semibold text-foreground w-[100px]">
                                    {t('table.effective')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.flatMap(g => [
                                <tr key={`module-${g.module}`} className="bg-canvas/60 border-y border-divider">
                                    <td
                                        colSpan={colSpan}
                                        className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider"
                                    >
                                        {MODULE_LABELS[g.module] ?? g.module}
                                    </td>
                                </tr>,
                                ...g.permissions.map(p => {
                                    const localOverride = localOverrides.get(p.id) ?? null
                                    const savedOverride = savedOverrides.get(p.id) ?? null
                                    const effective     = localOverride !== null ? localOverride : (p.roleAllow === true)
                                    const isDirtyRow    = localOverride !== savedOverride

                                    return (
                                        <tr
                                            key={p.id}
                                            className={`border-b border-divider transition-colors ${isDirtyRow ? 'bg-warning/10 hover:bg-warning/15' : 'hover:bg-canvas/40'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-start gap-2">
                                                    {isDirtyRow && (
                                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-warning shrink-0" title="Belum disimpan" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-foreground">{PERMISSION_LABELS[p.code] ?? p.name}</p>
                                                        <p className="text-xs text-muted font-mono">{p.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <SourceBadge roleAllow={p.roleAllow} overrideAllow={localOverride} />
                                            </td>
                                            {canEdit && (
                                                <td className="px-4 py-3">
                                                    <OverrideToggle
                                                        permissionId={p.id}
                                                        currentOverride={localOverride}
                                                        disabled={!canEdit}
                                                        onSetOverride={onSetOverride}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-center">
                                                {effective
                                                    ? <span className="text-success"><Icon name="check" size={16} /></span>
                                                    : <span className="text-danger"><Icon name="x" size={16} /></span>
                                                }
                                            </td>
                                        </tr>
                                    )
                                }),
                            ])}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
