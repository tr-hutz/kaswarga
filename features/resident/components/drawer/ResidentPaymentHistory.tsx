'use client'

import {
    MONTHS
} from '@/lib/constants/months'

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
            return 'bg-canvas text-muted'
    }
}

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentHistory?: any[]
    loading?:        boolean
    year?:           number
    onYearChange?:   (y: number) => void
}

export default function ResidentPaymentHistory({
    paymentHistory = [],
    loading        = false,
    year,
    onYearChange,
}: Props) {

    const t  = useTranslations('residents.paymentHistory')
    const tc = useTranslations('common')

    const currentYear = new Date().getFullYear()
    const displayYear = year ?? currentYear

    return (

        <div
            className="
        space-y-3
      "
        >

            <div className="flex items-center justify-between gap-3">

                <h3
                    className="
            text-sm
            font-semibold
            text-foreground
          "
                >
                    {t('title')}
                </h3>

                {onYearChange && (
                    <select
                        value={displayYear}
                        onChange={e => onYearChange(Number(e.target.value))}
                        className="h-8 px-2 text-xs border border-divider rounded-lg bg-input text-foreground outline-none focus:border-primary"
                    >
                        {[displayYear - 1, displayYear, displayYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                )}

            </div>

            {loading && (
                <div className="text-sm text-muted border rounded-xl p-4">
                    {tc('states.loading')}
                </div>
            )}

            {
                !loading && paymentHistory.length === 0 && (

                    <div
                        className="
              text-sm
              text-muted
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
                !loading && paymentHistory.map(item => (

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
                  text-muted
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
                  text-subtle
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
                {tc(`paymentStatus.${item.status}`) ?? item.status}
              </span>

                        </div>

                    </div>
                ))
            }

        </div>
    )
}