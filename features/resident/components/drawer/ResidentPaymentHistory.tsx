// @ts-nocheck
'use client'

import {
    MONTHS
} from '../../../../constants/months'

import { useTranslations } from 'next-intl'

function getMonthName(month) {

    const found =
        MONTHS.find(
            item =>
                Number(item.id) === Number(month)
        )

    return found?.short || '-'
}

function getStatusColor(status) {

    switch (status) {

        case 'approved':
            return 'bg-emerald-100 text-emerald-700'

        case 'pending':
            return 'bg-amber-100 text-amber-700'

        case 'rejected':
            return 'bg-red-100 text-red-700'

        default:
            return 'bg-slate-100 text-slate-700'
    }
}

export default function ResidentPaymentHistory({

                                                paymentHistory = []

                                            }) {

    const t = useTranslations('residents.paymentHistory')

    return (

        <div
            className="
        space-y-3
      "
        >

            <div>

                <h3
                    className="
            text-sm
            font-semibold
            text-slate-700
          "
                >
                    {t('title')}
                </h3>

            </div>

            {
                paymentHistory.length === 0 && (

                    <div
                        className="
              text-sm
              text-slate-500
              border
              rounded-xl
              p-4
            "
                    >
                        {t('empty')}
                    </div>
                )
            }

            {
                paymentHistory.map(item => (

                    <div
                        key={item.id}
                        className="
              border
              rounded-xl
              p-4
              flex
              items-start
              justify-between
              gap-4
            "
                    >

                        <div>

                            <div
                                className="
                  font-medium
                "
                            >
                                {getMonthName(item.month)}
                                {' '}
                                {item.year}
                            </div>

                            <div
                                className="
                  text-sm
                  text-slate-500
                "
                            >
                                Rp
                                {' '}
                                {Number(
                                    item.amount || 0
                                ).toLocaleString('id-ID')}
                            </div>

                            <div
                                className="
                  text-xs
                  text-slate-400
                  mt-1
                "
                            >
                                {
                                    item.date
                                        ? new Date(
                                            item.date
                                        ).toLocaleDateString(
                                            'id-ID'
                                        )
                                        : '-'
                                }
                            </div>

                        </div>

                        <div>

              <span
                  className={`
                  text-xs
                  px-2
                  py-1
                  rounded-full
                  ${getStatusColor(item.status)}
                `}
              >
                {item.status}
              </span>

                        </div>

                    </div>
                ))
            }

        </div>
    )
}