// @ts-nocheck
'use client'

import LedgerRow
    from './LedgerRow'
import { useTranslations } from 'next-intl'

export default function LedgerTable({

                                        rows = [],
                                        loading,

                                        onSelect

                                    }) {

    const t = useTranslations('ledger')

    if (loading) {

        return (

            <div
                className="
                    bg-white
                    rounded-2xl
                    border
                    p-8
                    text-center
                "
            >
                {t('table.loading')}
            </div>
        )
    }

    return (

        <div
            className="
                bg-white
                rounded-2xl
                border
                overflow-hidden
            "
        >

            <table
                className="
                    w-full
                    text-sm
                "
            >

                <thead
                    className="
                        bg-slate-50
                    "
                >

                <tr>

                    <th className="p-4 text-left">
                        {t('table.date')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.type')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.description')}
                    </th>

                    <th className="p-4 text-right">
                        {t('table.amount')}
                    </th>

                    <th className="p-4 text-right">
                        {t('table.balance')}
                    </th>

                </tr>

                </thead>

                <tbody>

                {rows.map(row => (

                    <LedgerRow

                        key={row.id}

                        row={row}

                        onSelect={
                            onSelect
                        }

                    />

                ))}

                </tbody>

            </table>

        </div>
    )
}