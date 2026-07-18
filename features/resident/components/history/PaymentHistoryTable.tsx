'use client'

import PaymentHistoryRow from './PaymentHistoryRow'
import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentHistoryTable({ data = [] }: { data?: any[] }) {

    const t = useTranslations('common.table')

    return (

        <div
            className="
        bg-white
        rounded-xl
        border
        overflow-hidden
      "
        >

            <table className="w-full">

                <thead>

                <tr
                    className="
              bg-body
              border-b
            "
                >

                    <th className="p-4 text-left">
                        {t('month')}
                    </th>

                    <th className="p-4 text-left">
                        {t('year')}
                    </th>

                    <th className="p-4 text-left">
                        {t('amount')}
                    </th>

                    <th className="p-4 text-left">
                        {t('date')}
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    data.map(row => (

                        <PaymentHistoryRow
                            key={
                                `${row.paymentId}-${row.month}`
                            }
                            row={row}
                        />
                    ))
                }

                </tbody>

            </table>

        </div>
    )
}