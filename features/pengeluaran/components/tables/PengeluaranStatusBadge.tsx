// @ts-nocheck
'use client'

import { getStatusLabel, getStatusClass } from '../../services/pengeluaran-status'

export default function PengeluaranStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
        </span>
    )
}