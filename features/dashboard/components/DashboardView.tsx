'use client'

import { useTranslations } from 'next-intl'
import InsightCard
  from '../cards/InsightCard'

import CashflowChart
  from '../charts/CashflowChart'

import MonthlyCollectionChart
  from '../charts/MonthlyCollectionChart'

import ResidentArrearsSummary
  from '@/features/resident/components/analytics/ResidentArrearsSummary'

import {
  formatRupiah
} from '../../../lib/utils'

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-xs text-subtle mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

interface DashboardViewProps {
  loading:          boolean
  year:             number
  setYear:          (y: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics:        any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentHealth:    any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financialInsight: any
  role?:            string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  residentAnalytics?: any[]
  monthlyFee?:        number
  refresh?:           () => void
}

export default function DashboardView({

  loading,

  year,
  setYear,

  analytics,

  paymentHealth,

  financialInsight,

  role,
  residentAnalytics = [],
  monthlyFee        = 0,
  refresh,

}: DashboardViewProps) {

  const t = useTranslations('dashboard')

  if (
    loading ||
    !analytics ||
    !paymentHealth ||
    !financialInsight
  ) {

    return (
      <div className="text-sm text-subtle p-6">
        {t('loading')}
      </div>
    )
  }

  return (

    <div className="space-y-8">

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
            text-foreground
          "
        >
          {t('title')}
        </h1>

        <select
          value={year}
          onChange={e =>
            setYear(
              Number(
                e.target.value
              )
            )
          }
          className="
            border border-divider
            rounded-lg
            px-3
            py-2
            text-sm text-foreground
            bg-input
            focus:outline-none focus:border-primary
          "
        >

          {[
            year - 1,
            year,
            year + 1
          ].map(item => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>

      </div>

      {/* STATUS IURAN WARGA */}

      <div className="space-y-3">

        <SectionLabel
          title={t('sections.paymentStatus')}
          subtitle={t('sections.paymentStatusSubtitle')}
        />

        <div
          className="
            grid
            grid-cols-2
            xl:grid-cols-5
            gap-4
          "
        >

          <InsightCard
            title={t('cards.totalResidents')}
            value={paymentHealth.totalResidents}
          />

          <InsightCard
            title={t('cards.paid')}
            value={paymentHealth.paid}
            valueColor="text-success"
          />

          <InsightCard
            title={t('cards.almostPaid')}
            value={paymentHealth.almostPaid}
            valueColor="text-warning"
          />

          <InsightCard
            title={t('cards.delinquent')}
            value={paymentHealth.delinquent}
            valueColor="text-warning"
          />

          <InsightCard
            title={t('cards.neverPaid')}
            value={paymentHealth.neverPaid}
            valueColor="text-danger"
          />

        </div>

      </div>

      {/* ARREARS TABLE — TREASURER ONLY */}

      {role === 'TREASURER' && (
        <ResidentArrearsSummary
          residentAnalytics={residentAnalytics}
          monthlyFee={monthlyFee}
          year={year}
          role={role}
          onRefresh={refresh}
        />
      )}

      {/* KEUANGAN RT */}

      <div className="space-y-3">

        <SectionLabel
          title={t('sections.finance')}
          subtitle={t('sections.financeSubtitle', { year })}
        />

        <div
          className="
            grid
            grid-cols-2
            xl:grid-cols-4
            gap-4
          "
        >

          <InsightCard
            title={t('cards.balance')}
            value={formatRupiah(financialInsight.balance)}
            subtitle={t('cards.balanceSubtitle')}
            valueColor="text-primary"
          />

          <InsightCard
            title={t('cards.income')}
            value={formatRupiah(financialInsight.income)}
            subtitle={t('cards.incomeSubtitle')}
            valueColor="text-success"
          />

          <InsightCard
            title={t('cards.expense')}
            value={formatRupiah(financialInsight.expense)}
            subtitle={t('cards.expenseSubtitle')}
            valueColor="text-warning"
          />

          <InsightCard
            title={t('cards.arrears')}
            value={formatRupiah(financialInsight.arrears)}
            subtitle={t('cards.arrearsSubtitle')}
            valueColor="text-danger"
          />

        </div>

      </div>

      {/* CHARTS */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-6
        "
      >

        <CashflowChart
          data={analytics.cashflow}
        />

        <MonthlyCollectionChart
          data={analytics.collection}
          totalResidents={paymentHealth.totalResidents}
        />

      </div>


    </div>
  )
}