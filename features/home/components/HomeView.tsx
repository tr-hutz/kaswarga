'use client'
import { useTranslations } from 'next-intl'
import PaymentSummary
  from './PaymentSummary'

import MonthCard
  from './MonthCard'

import PaymentForm
  from './PaymentForm'

import { MONTHS } from '../../../constants/months'

interface HomeViewProps {
  loading:        boolean
  summaryYear:    number
  setSummaryYear: (y: number) => void
  paymentYear:    number
  setPaymentYear: (y: number) => void
  monthlyFee:     number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitPayment:  (form: any) => Promise<void>
  submitting:     boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statusMap:      Record<number, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formStatusMap:  Record<number, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary:        any
}

export default function HomeView({

  loading,

  summaryYear,
  setSummaryYear,

  paymentYear,
  setPaymentYear,

  monthlyFee,

  submitPayment,

  submitting,

  statusMap,

  formStatusMap,

  summary

}: HomeViewProps) {

  const t = useTranslations('home')

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <h1
          className="
            text-2xl
            font-bold
          "
        >
          {t('title')}
        </h1>

        <select
          value={summaryYear}
          onChange={e =>
            setSummaryYear(
              Number(
                e.target.value
              )
            )
          }
          className="
            border
            rounded-lg
            px-3
            py-2
          "
        >

          {[

            summaryYear - 1,
            summaryYear,
            summaryYear + 1

          ].map(year => (

            <option
              key={year}
              value={year}
            >
              {year}
            </option>

          ))}

        </select>

      </div>

      {/* SUMMARY */}

      <PaymentSummary
        summary={summary}
      />

      {/* STATUS BULANAN */}

      <div
        className="
          grid
          grid-cols-2
          md:grid-cols-3
          xl:grid-cols-4
          gap-4
        "
      >

        {MONTHS.map(
          monthData => {

            const monthId =
              monthData.id

            return (

              <MonthCard
                key={monthId}
                month={
                  monthData.short
                }
                status={
                  statusMap[
                  monthId
                  ]
                }
              />

            )
          }
        )}

      </div>

      {/* AJUKAN PEMBAYARAN */}

      <PaymentForm
        paymentYear={paymentYear}
        setPaymentYear={setPaymentYear}
        monthlyFee={monthlyFee}
        onSubmit={submitPayment}
        loading={submitting}
        statusMap={formStatusMap}
      />

      {/* LOADING */}

      {loading && (

        <div>
          {t('loading')}
        </div>

      )}

    </div>
  )
}