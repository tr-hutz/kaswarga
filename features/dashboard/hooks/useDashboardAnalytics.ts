// @ts-nocheck
'use client'

import {
  useEffect,
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
  ] = useState(null)

  const [
    paymentHealth,
    setPaymentHealth
  ] = useState(null)

  const [
    financialInsight,
    setFinancialInsight
  ] = useState(null)

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

  }, [year])

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
    financialInsight
  }
}