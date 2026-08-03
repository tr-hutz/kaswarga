'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import Icon from '@/components/ui/Icon'
import type { Column } from '@/lib/types/query'

interface BuildRtColumnsOpts {
    t:        (key: string) => string
    tc:       (key: string) => string
    onEdit:   (rt: any) => void
    onDelete: (rt: any) => void
}

export function buildRtColumns({ t, tc, onEdit, onDelete }: BuildRtColumnsOpts): Column<any>[] {
    return [
        {
            key:   'name',
            title: t('table.name'),
            render: row => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key:   'code',
            title: t('table.code'),
            render: row => <span className="text-muted">{row.code || '-'}</span>,
        },
        {
            key:   'city',
            title: t('table.city'),
            render: row => <span className="text-muted">{row.city || '-'}</span>,
        },
        {
            key:   'active',
            title: t('table.status'),
            render: row => (
                <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${row.active ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'}
                `}>
                    {row.active ? tc('status.active') : tc('status.inactive')}
                </span>
            ),
        },
        {
            key:   '_actions',
            title: t('table.actions'),
            render: row => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={e => { e.stopPropagation(); onEdit(row) }}
                        className="p-1.5 rounded-lg hover:bg-canvas text-muted hover:text-primary transition-colors"
                        title="Edit"
                    >
                        <Icon name="pencil" size={15} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(row) }}
                        className="p-1.5 rounded-lg hover:bg-danger/5 text-muted hover:text-danger transition-colors"
                        title="Hapus"
                    >
                        <Icon name="trash2" size={15} />
                    </button>
                </div>
            ),
        },
    ]
}
