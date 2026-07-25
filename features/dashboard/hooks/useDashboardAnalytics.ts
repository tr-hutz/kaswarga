'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import {
  getDashboardData
} from '../../../lib/services/dashboard.service'

import {
  buildPaymentHealth
} from '../helpers/dashboard-analytics'

export function useDashboardAnalytics() {

  /*
   |--------------------------------------------------------------------------
   | STATE
   |--------------------------------------------------------------------------
   */

  const currentYear =
    new Date()
      .getFullYear()

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    year,
    setYear
  ] = useState(
    currentYear
  )

  const [
    analytics,
    setAnalytics
  ] = useState<any>(null)

  const [
    paymentHealth,
    setPaymentHealth
  ] = useState<any>(null)

  const [
    financialInsight,
    setFinancialInsight
  ] = useState<any>(null)

  const [role,              setRole             ] = useState<string | null>(null)
  const [residentAnalytics, setResidentAnalytics] = useState<any[]>([])
  const [monthlyFee,        setMonthlyFee       ] = useState(0)

  // incrementing key used to force a reload without changing year
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  /*
   |--------------------------------------------------------------------------
   | LOAD
   |--------------------------------------------------------------------------
   */

  useEffect(() => {

    async function loadData() {

      setLoading(true)

      try {

        const data =
          await getDashboardData(
            year
          )

        setAnalytics({

          cashflow:
            data.cashflow,

          collection:
            data.collection

        })

        /*
         * payment health
         */

        const currentMonth =
            new Date()
                .getMonth() + 1

        setPaymentHealth(
          buildPaymentHealth({
            residents: data.residentAnalytics || [],
            currentMonth
          })
        )

        setFinancialInsight({
          balance: data.insight.currentBalance,
          income:  data.insight.totalIncome,
          expense: data.insight.totalExpense,
          arrears: data.insight.totalArrears
        })

        setRole(data.role ?? null)
        setResidentAnalytics(data.residentAnalytics || [])
        setMonthlyFee(data.rt?.monthly_fee || 0)

      } catch (err) {

        console.error(
          '[Dashboard Analytics]',
          err
        )

      } finally {

        setLoading(false)

      }

    }

    loadData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, refreshKey])

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  return {
    loading,
    year,
    setYear,
    analytics,
    paymentHealth,
    financialInsight,
    role,
    residentAnalytics,
    monthlyFee,
    refresh,
  }
}
