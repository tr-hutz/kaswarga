'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Column } from '@/lib/types/query'
import type { Database } from '@/types/database'
import ResidentStatusBadge from './tables/ResidentStatusBadge'

export type ResidentRow = Database['public']['Tables']['residents']['Row']

const ROLE_BADGE_CLASS: Record<string, string> = {
    ADMIN:     'bg-warning/10 text-warning',
    CHAIR:     'bg-primary/10 text-primary',
    TREASURER: 'bg-success/10 text-success',
    SECRETARY: 'bg-info/10 text-info',
}

interface Options {
    tResidents:              (key: string) => string
    tCommon:                 (key: string) => string
    tRoles:                  (key: string) => string
    canManage:               boolean
    canChangeRole:           boolean
    activeAdminMembershipIds: string[]
    onEdit:                  (row: ResidentRow) => void
    onDelete:                (row: ResidentRow) => void
    onChangeRole:            (row: ResidentRow, membershipId: string, currentRoleEnum: string) => void
}

export function buildResidentColumns(opts: Options): Column<ResidentRow>[] {
    const {
        tResidents: t, tCommon: tc, tRoles: tr,
        canManage, canChangeRole, activeAdminMembershipIds,
        onEdit, onDelete, onChangeRole,
    } = opts

    const isLastAdmin = (membershipId: string) =>
        activeAdminMembershipIds.length === 1 && activeAdminMembershipIds[0] === membershipId

    return [
        {
            key:      'name',
            title:    t('table.name'),
            sortable: true,
            render:   (row) => {
                const membership = (row as any).memberships?.find((m: any) => m.status === 'active')
                const roleEnum   = membership?.role as string | undefined
                const badgeClass = roleEnum ? ROLE_BADGE_CLASS[roleEnum] : undefined
                return (
                    <span className="flex items-center gap-2 flex-wrap">
                        <span>{(row as any).name ?? '—'}</span>
                        {badgeClass && (
                            <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${badgeClass}`}>
                                {tr(roleEnum!)}
                            </span>
                        )}
                    </span>
                )
            },
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
        ...(canManage || canChangeRole ? [{
            key:    '_actions',
            title:  t('table.actions'),
            width:  '200px',
            render: (row: ResidentRow) => {
                const membership = (row as any).memberships?.find((m: any) => m.status === 'active')
                const blocked    = membership && isLastAdmin(membership.id)
                return (
                    <div className="flex gap-1.5 justify-end flex-nowrap">
                        {canManage && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                                    className="text-sm border px-2.5 py-1 rounded-lg whitespace-nowrap"
                                >
                                    {tc('actions.edit')}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                                    className="text-sm border px-2.5 py-1 rounded-lg text-danger whitespace-nowrap"
                                >
                                    {tc('actions.delete')}
                                </button>
                            </>
                        )}
                        {canChangeRole && membership && (
                            <button
                                disabled={blocked}
                                onClick={(e) => { e.stopPropagation(); onChangeRole(row, membership.id, membership.role) }}
                                className="text-sm border px-2.5 py-1 rounded-lg text-primary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
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
