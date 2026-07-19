'use client'

import type { Column } from '@/lib/types/query'
import type { Database } from '@/types/database'
import ResidentStatusBadge from './tables/ResidentStatusBadge'

export type ResidentRow = Database['public']['Tables']['residents']['Row']

interface Options {
    tResidents: (key: string) => string
    tCommon:    (key: string) => string
    canManage:  boolean
    onEdit:     (row: ResidentRow) => void
    onDelete:   (row: ResidentRow) => void
}

export function buildResidentColumns(opts: Options): Column<ResidentRow>[] {
    const { tResidents: t, tCommon: tc, canManage, onEdit, onDelete } = opts
    return [
        {
            key:      'name',
            title:    t('table.name'),
            sortable: true,
        },
        {
            key:      'block',
            title:    t('table.block'),
            sortable: true,
        },
        {
            key:      'house_number',
            title:    t('table.houseNumber'),
            sortable: true,
        },
        {
            key:    'phone',
            title:  t('table.phone'),
            render: (row) => row.phone ?? '-',
        },
        {
            key:    'active',
            title:  t('table.status'),
            render: (row) => (
                <ResidentStatusBadge status={row.active ? 'active' : 'inactive'} />
            ),
        },
        ...(canManage ? [{
            key:    '_actions',
            title:  t('table.actions'),
            width:  '128px',
            render: (row: ResidentRow) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                        className="text-sm border px-3 py-1 rounded-lg"
                    >
                        {tc('actions.edit')}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                        className="text-sm border px-3 py-1 rounded-lg text-danger"
                    >
                        {tc('actions.delete')}
                    </button>
                </div>
            ),
        }] as Column<ResidentRow>[] : []),
    ]
}
