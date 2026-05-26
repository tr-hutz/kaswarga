'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  buildPaymentHealth
} from '../helpers/dashboard-analytics'

import {
  getDashboardData
} from '../../../lib/services/dashboard.service'

export function useDashboardAnalytics() {

  const currentYear =
    new Date().getFullYear()

  const currentMonth =
    new Date().getMonth() + 1

  /*
   |--------------------------------------------------------------------------
   | STATE
   |--------------------------------------------------------------------------
   */

  const [
    loading,
    setLoading
  ] = useState(false)

  const [
    year,
    setYear
  ] = useState(currentYear)

  const [
    analytics,
    setAnalytics
  ] = useState(null)

  /*
   |--------------------------------------------------------------------------
   | LOAD
   |--------------------------------------------------------------------------
   */

  async function loadData() {

    try {

      setLoading(true)

      const data =
        await getDashboardAnalytics(
          year
        )

      setAnalytics(data)

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }
  }

  /*
   |--------------------------------------------------------------------------
   | EFFECT
   |--------------------------------------------------------------------------
   */

  useEffect(() => {

    loadData()

  }, [year])

  /*
   |--------------------------------------------------------------------------
   | HEALTH
   |--------------------------------------------------------------------------
   */

  const paymentHealth =
    useMemo(() => {

      if (!analytics) {

        return null
      }

      return buildPaymentHealth({

        warga:
          analytics.warga,

        currentMonth

      })

    }, [
      analytics,
      currentMonth
    ])

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

    paymentHealth

  }
}