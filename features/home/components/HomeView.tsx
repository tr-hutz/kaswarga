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

      <h1 className="text-2xl font-bold text-foreground">
        {t('title')}
      </h1>

      {/* RANGKUMAN STATUS PEMBAYARAN */}

      <div className="bg-surface rounded-xl border border-divider shadow-card p-6 space-y-6">

        {/* Card header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {t('summary.sectionTitle')}
          </h2>
          <select
            value={summaryYear}
            onChange={e => setSummaryYear(Number(e.target.value))}
            className="
              h-9 px-3
              border border-divider rounded-lg
              bg-canvas text-foreground text-sm
              outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              transition-colors
            "
          >
            {[summaryYear - 1, summaryYear, summaryYear + 1].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Stat boxes */}
        <PaymentSummary summary={summary} />

        {/* Monthly status grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map(monthData => (
            <MonthCard
              key={monthData.id}
              month={monthData.short}
              status={statusMap[monthData.id]}
            />
          ))}
        </div>

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