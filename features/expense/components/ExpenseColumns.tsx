'use client'

import type { Column } from '@/lib/types/query'
import type { MappedExpense } from '@/features/expense/hooks/useExpenseData'
import ExpenseStatusBadge from './tables/ExpenseStatusBadge'
import { formatRupiah } from '@/lib/utils'

interface Options {
    t:         (key: string) => string
    tc:        (key: string) => string
    canManage: boolean
    onEdit:    (row: MappedExpense) => void
    onDelete:  (row: MappedExpense) => void
}

export function buildExpenseColumns({ t, tc, canManage, onEdit, onDelete }: Options): Column<MappedExpense>[] {
    const cols: Column<MappedExpense>[] = [
        {
            key:   'receiptNumber',
            title: t('table.receiptNumber'),
            render: (row) => (
                <span className="font-mono text-xs text-muted">{row.receiptNumber || '—'}</span>
            ),
        },
        {
            key:   'dateLabel',
            title: t('table.date'),
            render: (row) => row.dateLabel || row.date,
        },
        {
            key:   'category',
            title: t('table.category'),
            render: (row) => row.category || '—',
        },
        {
            key:   'recipient',
            title: t('table.recipient'),
            render: (row) => row.recipient || '—',
        },
        {
            key:   'amount',
            title: t('table.amount'),
            render: (row) => <span className="font-medium">{formatRupiah(row.amount || 0)}</span>,
        },
        {
            key:   'status',
            title: t('table.status'),
            render: (row) => <ExpenseStatusBadge status={row.status} />,
        },
    ]

    if (canManage) {
        cols.push({
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
        })
    }

    return cols
}
