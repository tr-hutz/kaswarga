'use client'

import { useTranslations } from 'next-intl'
import Can                 from '@/components/ui/Can'
import { PERMISSION }      from '@/lib/auth/types'
import InsightCard
  from '../cards/InsightCard'

import CashflowChart
  from '../charts/CashflowChart'

import MonthlyCollectionChart
  from '../charts/MonthlyCollectionChart'

import ExpenseCategoryDonutChart
  from '../charts/ExpenseCategoryDonutChart'

import MonthlyExpenseByCategoryChart
  from '../charts/MonthlyExpenseByCategoryChart'

import ResidentArrearsSummary
  from '@/features/resident/components/analytics/ResidentArrearsSummary'

import Icon       from '@/components/ui/Icon'
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
  error?:           boolean
  year:             number
  setYear:          (y: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics:        any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentHealth:    any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financialInsight: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  residentAnalytics?: any[]
  monthlyFee?:        number
  refresh?:           () => void
  exportLoading?:     boolean
  onExportLedger?:    () => void
}

export default function DashboardView({

  loading,
  error,

  year,
  setYear,

  analytics,

  paymentHealth,

  financialInsight,

  residentAnalytics = [],
  monthlyFee        = 0,
  refresh,
  exportLoading     = false,
  onExportLedger,

}: DashboardViewProps) {

  const t  = useTranslations('dashboard')
  const tc = useTranslations('common')

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-sm text-muted">{t('error')}</p>
        {refresh && (
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground"
          >
            <Icon name="refresh-cw" size={14} />
            {tc('actions.retry')}
          </button>
        )}
      </div>
    )
  }

  if (loading || !analytics || !paymentHealth || !financialInsight) {
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

        <div className="flex items-center justify-between gap-4">
          <SectionLabel
            title={t('sections.paymentStatus')}
            subtitle={t('sections.paymentStatusSubtitle')}
          />
          <Can permission={PERMISSION.LEDGER_EXPORT}>
            {onExportLedger && (
              <button
                onClick={onExportLedger}
                disabled={exportLoading}
                title={t('exportLedger.title')}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground disabled:opacity-60 flex-shrink-0"
              >
                <Icon name="table-2" size={15} />
                {exportLoading ? t('exportLedger.loading') : t('exportLedger.button')}
              </button>
            )}
          </Can>
        </div>

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

      {/* ARREARS TABLE — ledger.export permission required */}

      <Can permission={PERMISSION.LEDGER_EXPORT}>
        <ResidentArrearsSummary
          residentAnalytics={residentAnalytics}
          monthlyFee={monthlyFee}
          year={year}
          onRefresh={refresh}
        />
      </Can>

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

      {/* CHARTS ROW 1 — Income */}

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

      {/* CHARTS ROW 2 — Expense breakdown */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-6
        "
      >

        <div className="xl:col-span-2">
          <MonthlyExpenseByCategoryChart
            data={analytics.monthlyExpenseByCategory ?? []}
            categories={analytics.expenseCategories ?? []}
          />
        </div>

        <ExpenseCategoryDonutChart
          data={analytics.expenseByCategory ?? []}
          year={year}
        />

      </div>


    </div>
  )
}