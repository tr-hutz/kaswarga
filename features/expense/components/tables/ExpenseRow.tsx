// @ts-nocheck
'use client'

import { formatRupiah }          from '../../../../lib/utils'
import ExpenseStatusBadge    from './ExpenseStatusBadge'
import { useTranslations } from 'next-intl'

export default function ExpenseRow({
    row,
    role,
    onSelect,
    onEdit,
    onDelete,
}) {

    const t = useTranslations('common')
    const canEdit = role === 'TREASURER' && row.status === 'pending'

    return (
        <tr
            className="border-t hover:bg-slate-50 cursor-pointer"
            onClick={() => onSelect(row)}
        >
            <td className="p-4 font-mono text-xs text-gray-500">
                {row.receiptNumber || '—'}
            </td>

            <td className="p-4">
                {row.dateLabel || row.date}
            </td>

            <td className="p-4">
                {row.category || '—'}
            </td>

            <td className="p-4 text-gray-600">
                {row.recipient || '—'}
            </td>

            <td className="p-4 text-right font-medium">
                {formatRupiah(row.amount || 0)}
            </td>

            <td className="p-4 text-center">
                <ExpenseStatusBadge status={row.status} />
            </td>

            <td className="p-4">
                {canEdit && (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); onEdit(row) }}
                            className="text-sm border px-3 py-1 rounded-lg"
                        >
                            {t('actions.edit')}
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete(row) }}
                            className="text-sm border px-3 py-1 rounded-lg text-red-600"
                        >
                            {t('actions.delete')}
                        </button>
                    </div>
                )}
            </td>
        </tr>
    )
}