'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Column }        from '@/lib/types/query'
import IncomeStatusBadge      from './IncomeStatusBadge'
import { formatRupiah }       from '@/lib/utils'

interface Options {
    t:        (key: string) => string
    tc:       (key: string) => string
    onView:   (row: any) => void
    onEdit:   (row: any) => void
    onDelete: (row: any) => void
}

export function buildIncomeColumns({ t, tc, onView, onEdit, onDelete }: Options): Column<any>[] {
    return [
        {
            key:   'income_name',
            title: t('table.incomeName'),
            render: (row) => (
                <span
                    className="font-medium text-foreground cursor-pointer hover:text-primary"
                    onClick={() => onView(row)}
                >
                    {row.income_name}
                </span>
            ),
        },
        {
            key:   'income_category',
            title: t('table.category'),
            render: (row) => (
                <span className="text-sm text-muted">
                    {t(`categories.${row.income_category}` as Parameters<typeof t>[0])}
                </span>
            ),
        },
        {
            key:   'source_type',
            title: t('table.sourceType'),
            render: (row) => (
                <span className="text-sm text-muted">
                    {t(`sourceTypes.${row.source_type}` as Parameters<typeof t>[0])}
                </span>
            ),
        },
        {
            key:   'payer',
            title: t('table.payer'),
            render: (row) => (
                <span className="text-sm text-muted">
                    {row.is_anonymous ? tc('anonymous') : (row.payerLabel || '—')}
                </span>
            ),
        },
        {
            key:   'amount',
            title: t('table.amount'),
            render: (row) => (
                <span className="font-medium">{formatRupiah(row.amount ?? 0)}</span>
            ),
        },
        {
            key:   'received_at',
            title: t('table.receivedAt'),
            render: (row) => row.formattedDate ?? row.received_at ?? '—',
        },
        {
            key:   'status',
            title: t('table.status'),
            render: (row) => <IncomeStatusBadge status={row.status} />,
        },
        {
            key:   '_actions',
            title: t('table.actions'),
            width: '148px',
            render: (row) => {
                if (row.status !== 'pending') return null
                return (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                            className="text-sm border border-divider px-3 py-1 rounded-lg"
                        >
                            {tc('actions.edit')}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                            className="text-sm border border-divider px-3 py-1 rounded-lg text-danger"
                        >
                            {tc('actions.delete')}
                        </button>
                    </div>
                )
            },
        },
    ]
}
