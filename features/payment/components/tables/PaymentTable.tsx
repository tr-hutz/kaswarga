// @ts-nocheck
'use client'

import PaymentRow
    from './PaymentRow'
import { useTranslations } from 'next-intl'

export default function PaymentTable({

                                         rows = [],
                                         loading,

                                         onSelect

                                     }) {

    const t = useTranslations('payments')

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">
                {t('table.loading')}
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-2xl border p-8 text-center text-sm text-gray-400">
                {t('table.empty')}
            </div>
        )
    }

    return (

        <div
            className="
                overflow-x-auto
                bg-white
                rounded-2xl
                border
            "
        >

            <table
                className="
                    min-w-full
                    text-sm
                "
            >

                <thead
                    className="
                        bg-slate-50
                        border-b
                    "
                >

                <tr>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        {t('table.name')}
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        {t('table.house')}
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        {t('table.month')}
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        {t('table.total')}
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        {t('table.status')}
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    rows.map(row => (

                            <PaymentRow
                                key={row.id}
                                row={row}
                                onClick={onSelect}
                            />

                        ))
                }

                </tbody>

            </table>

        </div>
    )
}