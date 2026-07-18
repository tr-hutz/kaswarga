'use client'

import {
    MONTHS
} from '../../../../constants/months'

import { useTranslations } from 'next-intl'

function getMonthName(month: number | string) {

    const found =
        MONTHS.find(
            item =>
                Number(item.id) === Number(month)
        )

    return found?.short || '-'
}

function getStatusColor(status: string) {

    switch (status) {

        case 'approved':
            return 'bg-success/10 text-success'

        case 'pending':
            return 'bg-warning/10 text-warning'

        case 'rejected':
            return 'bg-danger/10 text-danger'

        default:
            return 'bg-body text-dark-5'
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResidentPaymentHistory({ paymentHistory = [] }: { paymentHistory?: any[] }) {

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
            text-dark
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
              text-dark-5
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
                  text-dark-5
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
                  text-dark-6
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