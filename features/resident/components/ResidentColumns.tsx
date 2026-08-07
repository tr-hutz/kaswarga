'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Column } from '@/lib/types/query'
import type { Database } from '@/types/database'
import ResidentStatusBadge from './tables/ResidentStatusBadge'

export type ResidentRow = Database['public']['Tables']['residents']['Row']

interface Options {
    tResidents:   (key: string) => string
    tCommon:      (key: string) => string
    tRoles:       (key: string) => string
    canManage:    boolean
    canChangeRole: boolean
    onEdit:       (row: ResidentRow) => void
    onDelete:     (row: ResidentRow) => void
    onChangeRole: (row: ResidentRow, membershipId: string, currentRoleEnum: string) => void
}

export function buildResidentColumns(opts: Options): Column<ResidentRow>[] {
    const { tResidents: t, tCommon: tc, tRoles: tr, canManage, canChangeRole, onEdit, onDelete, onChangeRole } = opts
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
            render: (row) => (row as any).phone ?? '-',
        },
        {
            key:    'active',
            title:  t('table.status'),
            render: (row) => (
                <ResidentStatusBadge status={(row as any).active ? 'active' : 'inactive'} />
            ),
        },
        {
            key:    'role',
            title:  t('table.role'),
            render: (row) => {
                const membership = (row as any).memberships?.find((m: any) => m.status === 'active')
                if (!membership) return <span className="text-muted text-sm">—</span>
                return (
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">
                        {tr(membership.role)}
                    </span>
                )
            },
        },
        ...(canManage || canChangeRole ? [{
            key:    '_actions',
            title:  t('table.actions'),
            width:  '180px',
            render: (row: ResidentRow) => {
                const membership = (row as any).memberships?.find((m: any) => m.status === 'active')
                return (
                    <div className="flex gap-1.5 justify-end flex-wrap">
                        {canManage && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                                    className="text-sm border px-2.5 py-1 rounded-lg"
                                >
                                    {tc('actions.edit')}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                                    className="text-sm border px-2.5 py-1 rounded-lg text-danger"
                                >
                                    {tc('actions.delete')}
                                </button>
                            </>
                        )}
                        {canChangeRole && membership && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onChangeRole(row, membership.id, membership.role) }}
                                className="text-sm border px-2.5 py-1 rounded-lg text-primary"
                            >
                                {t('roleChange.button')}
                            </button>
                        )}
                    </div>
                )
            },
        }] as Column<ResidentRow>[] : []),
    ]
}
