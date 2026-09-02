'use client'

import type { Column } from '@/lib/types/query'
import type { LedgerRow } from '@/features/ledger/hooks/useLedgerData'

interface Options {
    t: (key: string) => string
}

export function buildLedgerColumns({ t }: Options): Column<LedgerRow>[] {
    return [
        {
            key:   'date',
            title: t('table.date'),
            render: (row) => row.date ? new Date(row.date).toLocaleString('id-ID') : '-',
        },
        {
            key:   'type',
            title: t('table.type'),
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.type === 'pemasukan'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                }`}>
                    {row.type}
                </span>
            ),
        },
        {
            key:   'description',
            title: t('table.description'),
        },
        {
            key:   'amountLabel',
            title: t('table.amount'),
            render: (row) => <span className="block text-right">{row.amountLabel}</span>,
        },
        {
            key:   'balanceLabel',
            title: t('table.balance'),
            render: (row) => <span className="block text-right font-bold">{row.balanceLabel}</span>,
        },
    ]
}
