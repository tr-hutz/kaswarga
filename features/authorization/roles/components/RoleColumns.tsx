'use client'

import type { Column } from '@/lib/types/query'
import type { RoleRow } from '@/lib/repositories/role.repository'
import Ribbadge         from '@/components/ui/Ribbadge'
import Button           from '@/components/ui/Button'
import Icon             from '@/components/ui/Icon'

interface BuildColumnsOptions {
    t:              (key: string) => string
    canUpdate:      boolean
    onEdit:         (role: RoleRow) => void
    onToggleActive: (role: RoleRow) => void
}

export function buildRoleColumns({
    t,
    canUpdate,
    onEdit,
    onToggleActive,
}: BuildColumnsOptions): Column<RoleRow>[] {
    return [
        {
            key:      'name',
            title:    t('columns.name'),
            sortable: true,
            render: row => (
                <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted font-mono">{row.code}</p>
                </div>
            ),
        },
        {
            key:   'description',
            title: t('columns.description'),
            render: row => (
                <span className="text-sm text-muted">
                    {row.description ?? <span className="italic">—</span>}
                </span>
            ),
        },
        {
            key:   'member_count',
            title: t('columns.members'),
            render: row => (
                <span className="text-sm text-foreground">{row.member_count}</span>
            ),
        },
        {
            key:      'is_active',
            title:    t('columns.status'),
            sortable: true,
            render: row => (
                <Ribbadge
                    label={row.is_active ? t('status.active') : t('status.inactive')}
                    status={row.is_active ? 'active' : 'inactive'}
                    variant="rounded"
                />
            ),
        },
        ...(canUpdate
            ? [{
                key:   'actions',
                title: '',
                width: '120px',
                render: (row: RoleRow) => (
                    <div className="flex items-center gap-1 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            title={t('actions.edit')}
                            onClick={e => { e.stopPropagation(); onEdit(row) }}
                            disabled={row.is_system}
                        >
                            <Icon name="pencil" size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            title={row.is_active ? t('actions.deactivate') : t('actions.activate')}
                            onClick={e => { e.stopPropagation(); onToggleActive(row) }}
                        >
                            <Icon name={row.is_active ? 'toggle-right' : 'toggle-left'} size={14} />
                        </Button>
                    </div>
                ),
            } as Column<RoleRow>]
            : []),
    ]
}
