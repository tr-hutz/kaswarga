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
    SUPER_ADMIN: 'bg-primary/5 text-primary',
    CHAIR:       'bg-primary/5 text-primary',
    ADMIN:       'bg-primary/5 text-primary',
    TREASURER:   'bg-warning/10 text-warning',
    RESIDENT:    'bg-body text-dark-5',
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
            render: row => <span className="font-medium text-dark">{row.name}</span>,
        },
        {
            key:   'email',
            title: opts.t('table.email'),
            render: row => <span className="text-dark-5">{row.email}</span>,
        },
        {
            key:   'rtName',
            title: opts.t('table.rt'),
            render: row => row.rtName
                ? <span className="text-dark-5">{row.rtName}</span>
                : <span className="italic text-dark-6">{opts.t('editRole.system')}</span>,
        },
        {
            key:   'role',
            title: opts.t('table.role'),
            render: row => !row._membership
                ? <span className="italic text-dark-6">-</span>
                : (
                    <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${ROLE_COLORS[row.role] ?? 'bg-body text-dark-5'}
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
                    return <div className="flex justify-center text-dark-6">—</div>
                }
                if (row._userId === opts.currentUserId) {
                    return <div className="flex justify-center text-dark-6 text-xs">—</div>
                }
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); opts.onEditRole({ user: row._user, membership: row._membership }) }}
                            className="p-1.5 rounded-lg hover:bg-body text-dark-5 hover:text-primary transition-colors"
                            title={opts.t('editRole.title')}
                        >
                            <Icon name="pencil" size={15} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); opts.onRemoveMembership(row._membership) }}
                            className="p-1.5 rounded-lg hover:bg-danger/5 text-dark-5 hover:text-danger transition-colors"
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
