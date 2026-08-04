'use client'

import { useTranslations } from 'next-intl'
import type { PermissionGroup } from '../hooks/usePermissionMatrix'

// Actions rendered left-to-right in this fixed order; any extras are appended alphabetically
const CANONICAL_ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'reject', 'export', 'override']

interface Props {
    groups:      PermissionGroup[]
    localSet:    Set<string>
    canEdit:     boolean
    onToggle:    (permId: string) => void
    onSelectAll: (module: string) => void
    onClearAll:  (module: string) => void
}

export default function PermissionGrid({ groups, localSet, canEdit, onToggle, onSelectAll, onClearAll }: Props) {
    const t = useTranslations('permissions')

    if (groups.length === 0) return null

    const allActions = new Set(
        groups.flatMap(g => g.permissions.map(p => p.code.split('.')[1] ?? ''))
    )
    const columns = [
        ...CANONICAL_ACTIONS.filter(a => allActions.has(a)),
        ...Array.from(allActions).filter(a => !CANONICAL_ACTIONS.includes(a)).sort(),
    ]

    return (
        <div className="overflow-x-auto rounded-xl border border-divider bg-surface">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-divider bg-canvas">
                        <th className="sticky left-0 z-10 bg-canvas px-4 py-3 text-left font-semibold text-foreground min-w-[180px] border-r border-divider">
                            {t('grid.module')}
                        </th>
                        {columns.map(action => (
                            <th
                                key={action}
                                className="px-3 py-3 text-center font-semibold text-foreground whitespace-nowrap"
                            >
                                {t(`grid.actions.${action}` as Parameters<typeof t>[0])}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                    {groups.map(g => {
                        const checkedCount = g.permissions.filter(p => localSet.has(p.id)).length
                        const allChecked   = checkedCount === g.permissions.length
                        const noneChecked  = checkedCount === 0

                        return (
                            <tr key={g.module} className="group">
                                <td className="sticky left-0 z-10 bg-surface group-hover:bg-canvas px-4 py-3 border-r border-divider transition-colors">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-foreground">
                                            {t(`modules.${g.module}` as Parameters<typeof t>[0])}
                                        </span>
                                        {canEdit && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                                                    onClick={() => onSelectAll(g.module)}
                                                    disabled={allChecked}
                                                >
                                                    {t('bulkSelectAll')}
                                                </button>
                                                <span className="text-divider">|</span>
                                                <button
                                                    className="text-xs text-muted hover:text-danger hover:underline disabled:opacity-40 disabled:no-underline"
                                                    onClick={() => onClearAll(g.module)}
                                                    disabled={noneChecked}
                                                >
                                                    {t('bulkClearAll')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                {columns.map(action => {
                                    const perm = g.permissions.find(p => p.code === `${g.module}.${action}`)
                                    return (
                                        <td
                                            key={action}
                                            className={`px-3 py-3 text-center group-hover:bg-canvas transition-colors ${!perm ? 'bg-canvas/30' : ''}`}
                                        >
                                            {perm ? (
                                                <input
                                                    type="checkbox"
                                                    checked={localSet.has(perm.id)}
                                                    onChange={() => onToggle(perm.id)}
                                                    disabled={!canEdit}
                                                    className="h-4 w-4 rounded border-divider accent-primary cursor-pointer disabled:cursor-default"
                                                    aria-label={perm.name}
                                                    title={perm.name}
                                                />
                                            ) : (
                                                <span className="text-divider select-none text-xs">—</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
