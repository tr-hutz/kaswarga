'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  getDashboardData
} from '@/lib/services/dashboard.service'

import {
  buildPaymentHealth
} from '@/features/dashboard/helpers/dashboard-analytics'

import { useAuth } from '@/lib/auth/useAuth'

export function useDashboardAnalytics() {

  /*
   |--------------------------------------------------------------------------
   | AUTH — wait for auth to settle before fetching so we don't race against
   | Supabase restoring its session from storage on client-side navigation.
   |--------------------------------------------------------------------------
   */

  const { loading: authLoading, rtId } = (useAuth() as any) ?? {}

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
    error,
    setError
  ] = useState(false)

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

  const [residentAnalytics, setResidentAnalytics] = useState<any[]>([])
  const [monthlyFee,        setMonthlyFee       ] = useState(0)
  const [incomeInsight,     setIncomeInsight    ] = useState<any>(null)

  // incrementing key used to force a reload without changing year
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  /*
   |--------------------------------------------------------------------------
   | LOAD
   |--------------------------------------------------------------------------
   */

  useEffect(() => {

    // Don't fetch until AuthProvider has finished loading the session.
    // On client-side navigation the Supabase client may not yet have restored
    // its in-memory session, causing getCurrentMembership() to throw
    // 'Unauthorized' and leaving all data states null (infinite loading).
    if (authLoading || !rtId) return

    async function loadData() {

      setLoading(true)
      setError(false)

      try {

        const data =
          await getDashboardData(
            year
          )

        setAnalytics({

          cashflow:                 data.cashflow,

          collection:               data.collection,

          expenseByCategory:        data.expenseByCategory        || [],

          expenseCategories:        data.expenseCategories        || [],

          monthlyExpenseByCategory: data.monthlyExpenseByCategory || [],

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

        setResidentAnalytics(data.residentAnalytics || [])
        setMonthlyFee(data.rt?.monthly_fee || 0)
        setIncomeInsight(data.incomeInsight ?? null)

      } catch (err) {

        console.error(
          '[Dashboard Analytics]',
          err
        )

        setError(true)

      } finally {

        setLoading(false)

      }

    }

    loadData()

  }, [year, refreshKey, authLoading, rtId])

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  return {
    loading,
    error,
    year,
    setYear,
    analytics,
    paymentHealth,
    financialInsight,
    residentAnalytics,
    monthlyFee,
    incomeInsight,
    refresh,
  }
}
