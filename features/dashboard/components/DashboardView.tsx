// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import InsightCard
  from '../cards/InsightCard'

import CashflowChart
  from '../charts/CashflowChart'

import MonthlyCollectionChart
  from '../charts/MonthlyCollectionChart'

import {
  formatRupiah
} from '../../../lib/utils'

function SectionLabel({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

export default function DashboardView({

  loading,

  year,
  setYear,

  analytics,

  paymentHealth,

  financialInsight

}) {

  const t = useTranslations('dashboard')

  if (
    loading ||
    !analytics ||
    !paymentHealth ||
    !financialInsight
  ) {

    return (
      <div className="text-sm text-gray-400 p-6">
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
            border
            rounded-lg
            px-3
            py-2
            text-sm
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
            valueColor="text-green-600"
          />

          <InsightCard
            title={t('cards.almostPaid')}
            value={paymentHealth.almostPaid}
            valueColor="text-yellow-600"
          />

          <InsightCard
            title={t('cards.delinquent')}
            value={paymentHealth.delinquent}
            valueColor="text-orange-600"
          />

          <InsightCard
            title={t('cards.neverPaid')}
            value={paymentHealth.neverPaid}
            valueColor="text-red-600"
          />

        </div>

      </div>

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
            valueColor="text-blue-700"
          />

          <InsightCard
            title={t('cards.income')}
            value={formatRupiah(financialInsight.income)}
            subtitle={t('cards.incomeSubtitle')}
            valueColor="text-green-600"
          />

          <InsightCard
            title={t('cards.expense')}
            value={formatRupiah(financialInsight.expense)}
            subtitle={t('cards.expenseSubtitle')}
            valueColor="text-orange-600"
          />

          <InsightCard
            title={t('cards.arrears')}
            value={formatRupiah(financialInsight.arrears)}
            subtitle={t('cards.arrearsSubtitle')}
            valueColor="text-red-600"
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
        />

      </div>

    </div>
  )
}