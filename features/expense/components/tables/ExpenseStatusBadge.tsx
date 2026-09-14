'use client'

import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { getStatusClass } from '@/features/expense/services/expense-status'

export default function ExpenseStatusBadge({ status }: { status: string }) {
    const tc = useTranslations('common')

    const labelMap: Record<string, string> = {
        approved: tc('expenseStatus.approved'),
        pending:  tc('expenseStatus.pending'),
        rejected: tc('expenseStatus.rejected'),
    }

    return (
        <Badge className={getStatusClass(status)}>
            {labelMap[status] ?? '-'}
        </Badge>
    )
}
