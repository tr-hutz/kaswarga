// @ts-nocheck
'use client'

import Icon from '@/components/ui/Icon'
import type { Column } from '@/lib/types/query'

export type UserRow = {
    _userId:      string
    name:         string
    email:        string
    rtName:       string | null   // null = system RT (SUPER_ADMIN)
    role:         string
    membershipId: string
    _user:        any
    _membership:  any | null      // null = user has no memberships
}

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-50 text-purple-700',
    CHAIR:       'bg-blue-50 text-blue-700',
    ADMIN:       'bg-indigo-50 text-indigo-700',
    TREASURER:   'bg-amber-50 text-amber-700',
    RESIDENT:    'bg-gray-100 text-gray-600',
}

interface BuildUserColumnsOpts {
    t:                  (key: string) => string
    currentUserId?:     string
    onEditRole:         (params: { user: any; membership: any }) => void
    onRemoveMembership: (membership: any) => void
}

export function buildUserColumns(opts: BuildUserColumnsOpts): Column<UserRow>[] {
    return [
        {
            key:   'name',
            title: opts.t('table.name'),
            render: row => <span className="font-medium text-gray-900">{row.name}</span>,
        },
        {
            key:   'email',
            title: opts.t('table.email'),
            render: row => <span className="text-gray-500">{row.email}</span>,
        },
        {
            key:   'rtName',
            title: opts.t('table.rt'),
            render: row => row.rtName
                ? <span className="text-gray-600">{row.rtName}</span>
                : <span className="italic text-gray-400">{opts.t('editRole.system')}</span>,
        },
        {
            key:   'role',
            title: opts.t('table.role'),
            render: row => !row._membership
                ? <span className="italic text-gray-400">-</span>
                : (
                    <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${ROLE_COLORS[row.role] ?? 'bg-gray-100 text-gray-600'}
                    `}>
                        {opts.t(`roles.${row.role}`) || row.role}
                    </span>
                ),
        },
        {
            key:   '_actions',
            title: opts.t('table.actions'),
            render: row => {
                if (!row._membership) {
                    return <div className="flex justify-center text-gray-300">—</div>
                }
                if (row._userId === opts.currentUserId) {
                    return <div className="flex justify-center text-gray-300 text-xs">—</div>
                }
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); opts.onEditRole({ user: row._user, membership: row._membership }) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            title={opts.t('editRole.title')}
                        >
                            <Icon name="pencil" size={15} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); opts.onRemoveMembership(row._membership) }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            title={opts.t('removeMembership.title')}
                        >
                            <Icon name="trash2" size={15} />
                        </button>
                    </div>
                )
            },
        },
    ]
}
