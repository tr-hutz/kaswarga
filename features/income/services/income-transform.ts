/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatRupiah } from '@/lib/utils'

export function mapIncome(rows: any[]) {
    return rows.map(row => ({
        ...row,
        formattedAmount: formatRupiah(row.amount ?? 0),
        formattedDate:   row.received_at
            ? new Date(row.received_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
    }))
}

export type MappedIncome = ReturnType<typeof mapIncome>[number]
