'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  getDashboardData
} from '../../../lib/services/dashboard.service'

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

        const warga =
          data.wargaAnalytics || []

        const currentMonth =
            new Date()
                .getMonth() + 1

        const paymentHealth = {

          totalWarga:
          warga.length,

          lunas:
          warga.filter(item =>

              item.totalBayar >=
              currentMonth

          ).length,

          hampirLunas:
          warga.filter(item =>

              item.totalBayar >=
              currentMonth - 2

              &&

              item.totalBayar <
              currentMonth

          ).length,

          menunggak:
          warga.filter(item =>

              item.totalBayar > 0

              &&

              item.totalBayar <
              currentMonth - 2

          ).length,

          belumBayar:
          warga.filter(item =>

              item.totalBayar === 0

          ).length

        }

        setPaymentHealth(
          paymentHealth
        )

        setFinancialInsight({
          saldo:      data.insight.saldoTerkini,
          pemasukan:  data.insight.totalPemasukan,
          pengeluaran: data.insight.totalPengeluaran,
          tunggakan:  data.insight.totalTunggakan
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