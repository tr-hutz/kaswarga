// @ts-nocheck
'use client'

import Badge from '@/components/ui/Badge'
import { getStatusLabel, getStatusClass } from '../../services/expense-status'

export default function ExpenseStatusBadge({ status }) {
    return (
        <Badge className={getStatusClass(status)}>
            {getStatusLabel(status)}
        </Badge>
    )
}
