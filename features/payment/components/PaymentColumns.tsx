'use client'

import type { Column } from '@/lib/types/query'
import type { ConfirmationRow } from '../hooks/usePaymentData'
import PaymentStatusBadge from './tables/PaymentStatusBadge'
import { formatRupiah } from '@/lib/utils'

interface Options {
    t: (key: string) => string
}

export function buildPaymentColumns({ t }: Options): Column<ConfirmationRow>[] {
    return [
        {
            key:   'name',
            title: t('table.name'),
        },
        {
            key:   'block',
            title: t('table.house'),
            render: (row) => `${t('detail.blockPrefix')} ${row.block} / ${row.houseNumber}`,
        },
        {
            key:   'monthLabel',
            title: t('table.month'),
            render: (row) => row.monthLabel || '-',
        },
        {
            key:   'totalAmount',
            title: t('table.total'),
            render: (row) => formatRupiah(row.totalAmount || 0),
        },
        {
            key:   'status',
            title: t('table.status'),
            render: (row) => <PaymentStatusBadge status={row.status} />,
        },
    ]
}
