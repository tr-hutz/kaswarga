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
  calculateArrears,
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
    wargaId,
    setWargaId
  ] = useState(null)

  const [
    monthlyFee,
    setMonthlyFee
  ] = useState(0)

  const [
    formApproved,
    setFormApproved
  ] = useState([])

  const [
    formPending,
    setFormPending
  ] = useState([])

  const [
    formRejected,
    setFormRejected
  ] = useState([])

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

      const monthlyFee = membership.rt?.nominal_iuran || 0

      setMonthlyFee(monthlyFee)

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

  async function loadFormData() {

    if (!wargaId) return

    try {

      const [
        approvedData,
        pendingData,
        rejectedData
      ] = await Promise.all([

        getApprovedPayments(
          wargaId,
          paymentYear
        ),

        getPendingPayments(
          wargaId,
          paymentYear
        ),

        getRejectedPayments(
          wargaId,
          paymentYear
        )

      ])

      setFormApproved(approvedData)
      setFormPending(pendingData)
      setFormRejected(rejectedData)

    } catch (err) {

      console.error(err)

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

  useEffect(() => {

    loadFormData()

  }, [paymentYear, wargaId])

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

  const formStatusMap =
    useMemo(() => {

      return buildStatusMap({

        approved: formApproved,

        pending: formPending,

        rejected: formRejected

      })

    }, [
      formApproved,
      formPending,
      formRejected
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

        arrears:
          calculateArrears(
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

          let proofUrl =
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
            proofUrl

          })

          /*
           |--------------------------------------------------------------------------
           | reset selected months
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

    monthlyFee,

    statusMap,

    formStatusMap,

    summary,

    submitting,

    submitPayment,

    refresh:
      loadData

  }
}