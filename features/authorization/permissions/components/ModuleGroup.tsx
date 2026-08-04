'use client'

import { useTranslations }  from 'next-intl'
import Icon                 from '@/components/ui/Icon'
import Tooltip              from '@/components/ui/Tooltip'
import type { PermissionRow } from '@/lib/repositories/permission.repository'

interface Props {
    module:      string
    permissions: PermissionRow[]
    localSet:    Set<string>
    collapsed:   boolean
    canEdit:     boolean
    onToggle:    (permId: string) => void
    onSelectAll: () => void
    onClearAll:  () => void
    onCollapse:  () => void
}

export default function ModuleGroup({
    module,
    permissions,
    localSet,
    collapsed,
    canEdit,
    onToggle,
    onSelectAll,
    onClearAll,
    onCollapse,
}: Props) {
    const t = useTranslations('permissions')

    const checkedCount = permissions.filter(p => localSet.has(p.id)).length
    const allChecked   = checkedCount === permissions.length
    const noneChecked  = checkedCount === 0
    const moduleLabel  = t(`modules.${module}` as Parameters<typeof t>[0])

    return (
        <div className="rounded-xl border border-divider bg-surface overflow-hidden">
            {/* Module header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-canvas cursor-pointer select-none"
                onClick={onCollapse}
            >
                <div className="flex items-center gap-2">
                    <Icon
                        name={collapsed ? 'chevron-right' : 'chevron-down'}
                        size={16}
                        className="text-muted shrink-0"
                    />
                    <span className="text-sm font-semibold text-foreground capitalize">{moduleLabel}</span>
                    <span className="text-xs text-muted">({checkedCount}/{permissions.length})</span>
                </div>
                {canEdit && !collapsed && (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                            className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline px-2 py-1"
                            onClick={onSelectAll}
                            disabled={allChecked}
                        >
                            {t('bulkSelectAll')}
                        </button>
                        <span className="text-divider">|</span>
                        <button
                            className="text-xs text-muted hover:text-danger hover:underline disabled:opacity-40 disabled:no-underline px-2 py-1"
                            onClick={onClearAll}
                            disabled={noneChecked}
                        >
                            {t('bulkClearAll')}
                        </button>
                    </div>
                )}
            </div>

            {/* Permission rows */}
            {!collapsed && (
                <div className="divide-y divide-divider">
                    {permissions.map(p => (
                        <label
                            key={p.id}
                            className={`
                                flex items-start gap-3 px-4 py-3 transition-colors
                                ${canEdit ? 'cursor-pointer hover:bg-canvas/50' : 'cursor-default'}
                            `}
                        >
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-divider text-primary focus:ring-primary/30 accent-primary shrink-0"
                                checked={localSet.has(p.id)}
                                onChange={() => onToggle(p.id)}
                                disabled={!canEdit}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-foreground">{p.name}</span>
                                    <code className="text-xs text-muted bg-canvas px-1.5 py-0.5 rounded font-mono">
                                        {p.code}
                                    </code>
                                    {p.description && (
                                        <Tooltip content={p.description}>
                                            <Icon name="alert-circle" size={14} className="text-muted cursor-help" />
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}
