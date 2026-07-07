// @ts-nocheck
'use client'

import PengeluaranRow from './PengeluaranRow'
import { useTranslations } from 'next-intl'

export default function PengeluaranTable({
    rows = [],
    loading,
    role,
    onSelect,
    onEdit,
    onDelete,
}) {

    const t = useTranslations('pengeluaran')

    if (loading) {
        return <div className="p-6 text-sm text-gray-400">{t('table.loading')}</div>
    }

    return (
        <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-4 text-left">{t('table.receiptNumber')}</th>
                        <th className="p-4 text-left">{t('table.date')}</th>
                        <th className="p-4 text-left">{t('table.category')}</th>
                        <th className="p-4 text-left">{t('table.recipient')}</th>
                        <th className="p-4 text-right">{t('table.amount')}</th>
                        <th className="p-4 text-center">{t('table.status')}</th>
                        <th className="p-4 text-right">{t('table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-sm text-gray-400">
                                {t('table.empty')}
                            </td>
                        </tr>
                    ) : (
                        rows.map(row => (
                            <PengeluaranRow
                                key={row.id}
                                row={row}
                                role={role}
                                onSelect={onSelect}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}