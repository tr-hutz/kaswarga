// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import ActivityRow from './ActivityRow'

export default function ActivityTable({ rows = [], onSelect }) {
    const t = useTranslations('activity')

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-400">
                {t('table.empty')}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-4 text-left">{t('table.actor')}</th>
                        <th className="p-4 text-left">{t('table.action')}</th>
                        <th className="p-4 text-left">{t('table.entity')}</th>
                        <th className="p-4 text-left">{t('table.description')}</th>
                        <th className="p-4 text-left">{t('table.time')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <ActivityRow key={row.id} row={row} onClick={() => onSelect(row)} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
