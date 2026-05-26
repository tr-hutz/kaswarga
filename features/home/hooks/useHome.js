'use client'

import {
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react'

import {
  getCurrentMembership
} from '../../../lib/auth/getCurrentMembership'

import {
  getApprovedPayments
} from '../../../lib/services/payment.service'

import {
  getPendingPayments,
  getRejectedPayments
} from '../../../lib/services/confirmation.service'

import {
  buildStatusMap
} from '../../../lib/helpers/payment-status'

import {
  calculateTunggakan,
  calculateUpcoming,
  calculatePaidMonths
} from '../../../lib/helpers/payment-summary'

export function useHome() {

  const currentYear =
    new Date().getFullYear()

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
    submitting,
    setSubmitting
  ] = useState(false)

  const [
    approved,
    setApproved
  ] = useState([])

  const [
    pending,
    setPending
  ] = useState([])

  const [
    rejected,
    setRejected
  ] = useState([])

  /*
   |--------------------------------------------------------------------------
   | TAB RINGKASAN
   |--------------------------------------------------------------------------
   */

  const [
    summaryYear,
    setSummaryYear
  ] = useState(currentYear)

  /*
   |--------------------------------------------------------------------------
   | FORM AJUKAN PEMBAYARAN
   |--------------------------------------------------------------------------
   */

  const [
    paymentYear,
    setPaymentYear
  ] = useState(currentYear)

  const [
    selectedMonths,
    setSelectedMonths
  ] = useState([])

  const [
    wargaId,
    setWargaId
  ] = useState(null)

  const [
    nominalIuran,
    setNominalIuran
  ] = useState(0)

  /*
   |--------------------------------------------------------------------------
   | LOAD DATA
   |--------------------------------------------------------------------------
   */

  async function loadData() {

    setLoading(true)

    try {

      const membership =
        await getCurrentMembership()

      const wargaId =
        membership.warga?.id || null

      /*
       * optional
       */

      setWargaId(
        wargaId
      )

      const nominalIuran = membership.rt?.nominal_iuran || 0

      setNominalIuran(nominalIuran)

      const [
        approvedData,
        pendingData,
        rejectedData
      ] = await Promise.all([

        getApprovedPayments(
          wargaId,
          summaryYear
        ),

        getPendingPayments(
          wargaId,
          summaryYear
        ),

        getRejectedPayments(
          wargaId,
          summaryYear
        )

      ])

      setApproved(
        approvedData
      )

      setPending(
        pendingData
      )

      setRejected(
        rejectedData
      )

    } catch (err) {

      console.log(err)

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

  }, [summaryYear])

  /*
   |--------------------------------------------------------------------------
   | STATUS MAP
   |--------------------------------------------------------------------------
   */

  const statusMap =
    useMemo(() => {

      return buildStatusMap({

        approved,

        pending,

        rejected

      })

    }, [
      approved,
      pending,
      rejected
    ])

  /*
   |--------------------------------------------------------------------------
   | SUMMARY
   |--------------------------------------------------------------------------
   */

  const summary =
    useMemo(() => {

      return {

        paid:
          calculatePaidMonths(
            statusMap
          ),

        tunggakan:
          calculateTunggakan(
            statusMap,
            summaryYear
          ),

        upcoming:
          calculateUpcoming(
            statusMap,
            summaryYear
          )

      }

    }, [
      statusMap,
      summaryYear
    ])

  /*
   |--------------------------------------------------------------------------
   | SUBMIT PAYMENT
   |--------------------------------------------------------------------------
   */

  const submitPayment =
    useCallback(

      async ({
        months,
        year,
        file
      }) => {

        try {

          setSubmitting(true)

          /*
           |--------------------------------------------------------------------------
           | TODO:
           | upload bukti
           |--------------------------------------------------------------------------
           */

          let buktiUrl =
            null

          /*
           |--------------------------------------------------------------------------
           | TODO:
           | call RPC submit_konfirmasi
           |--------------------------------------------------------------------------
           */

          console.log({

            months,
            year,
            file,
            buktiUrl

          })

          /*
           |--------------------------------------------------------------------------
           | reset selected months
           |--------------------------------------------------------------------------
           */

          setSelectedMonths([])

          /*
           |--------------------------------------------------------------------------
           | reload data
           |--------------------------------------------------------------------------
           */

          await loadData()

        } catch (err) {

          console.error(err)

        } finally {

          setSubmitting(false)

        }

      },

      []
    )

  /*
   |--------------------------------------------------------------------------
   | RETURN
   |--------------------------------------------------------------------------
   */

  return {

    loading,

    summaryYear,
    setSummaryYear,

    paymentYear,
    setPaymentYear,

    selectedMonths,
    setSelectedMonths,

    statusMap,

    summary,

    submitting,

    submitPayment,

    refresh:
      loadData

  }
}