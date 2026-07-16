'use client'

import Badge from '@/components/ui/Badge'
import { getStatusLabel, getStatusClass } from '../../services/expense-status'

export default function ExpenseStatusBadge({ status }: { status: string }) {
    return (
        <Badge className={getStatusClass(status)}>
            {getStatusLabel(status)}
        </Badge>
    )
}
