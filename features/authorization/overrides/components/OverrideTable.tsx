'use client'

import { useTranslations }  from 'next-intl'
import Icon                  from '@/components/ui/Icon'
import type { PermissionGroup } from '../hooks/useMemberOverrides'

interface Props {
    groups:         PermissionGroup[]
    localOverrides: Map<string, boolean | null>
    canEdit:        boolean
    onSetOverride:  (permissionId: string, value: boolean | null) => void
}

function SourceBadge({
    roleAllow,
    overrideAllow,
}: {
    roleAllow:     boolean | null
    overrideAllow: boolean | null
}) {
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
                className={`${base} ${
                    currentOverride === null
                        ? 'bg-canvas border-primary text-primary font-medium'
                        : 'border-divider text-muted hover:border-foreground hover:text-foreground'
                } disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, null)}
                disabled={disabled || currentOverride === null}
                title={t('override.none')}
            >
                {t('override.none')}
            </button>
            <button
                className={`${base} ${
                    currentOverride === true
                        ? 'bg-success/10 border-success text-success font-medium'
                        : 'border-divider text-muted hover:border-success hover:text-success'
                } disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, true)}
                disabled={disabled || currentOverride === true}
                title={t('override.grant')}
            >
                {t('override.grant')}
            </button>
            <button
                className={`${base} ${
                    currentOverride === false
                        ? 'bg-danger/10 border-danger text-danger font-medium'
                        : 'border-divider text-muted hover:border-danger hover:text-danger'
                } disabled:opacity-40 disabled:cursor-default`}
                onClick={() => onSetOverride(permissionId, false)}
                disabled={disabled || currentOverride === false}
                title={t('override.revoke')}
            >
                {t('override.revoke')}
            </button>
        </div>
    )
}

export default function OverrideTable({ groups, localOverrides, canEdit, onSetOverride }: Props) {
    const t = useTranslations('overrides')

    if (groups.length === 0) return null

    const colSpan = canEdit ? 4 : 3

    return (
        <div className="overflow-x-auto rounded-xl border border-divider bg-surface">
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
                                {t(`modules.${g.module}` as Parameters<typeof t>[0])}
                            </td>
                        </tr>,
                        ...g.permissions.map(p => {
                            const localOverride = localOverrides.get(p.id) ?? null
                            const effective     = localOverride !== null ? localOverride : (p.roleAllow === true)

                            return (
                                <tr key={p.id} className="border-b border-divider hover:bg-canvas/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground">{p.name}</p>
                                        <p className="text-xs text-muted font-mono">{p.code}</p>
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
        </div>
    )
}
