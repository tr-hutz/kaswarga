'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react'

import {
  getCurrentMembership
} from '@/lib/auth/getCurrentMembership'

import {
  getApprovedPayments,
  submitPaymentConfirmation,
} from '@/lib/services/payment.service'

import {
  getPendingPayments,
  getRejectedPayments
} from '@/lib/services/confirmation.service'

import {
  buildStatusMap
} from '@/lib/helpers/payment-status'

import {
  calculateArrears,
  calculateUpcoming,
  calculatePaidMonths
} from '@/lib/helpers/payment-summary'

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
  ] = useState<any[]>([])

  const [
    pending,
    setPending
  ] = useState<any[]>([])

  const [
    rejected,
    setRejected
  ] = useState<any[]>([])

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
    residentId,
    setResidentId
  ] = useState<string | null>(null)

  const [
    rtId,
    setRtId
  ] = useState<string | null>(null)

  const [
    monthlyFee,
    setMonthlyFee
  ] = useState(0)

  const [
    formApproved,
    setFormApproved
  ] = useState<any[]>([])

  const [
    formPending,
    setFormPending
  ] = useState<any[]>([])

  const [
    formRejected,
    setFormRejected
  ] = useState<any[]>([])

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

      const residentId =
        membership.resident?.id ?? null

      setResidentId(residentId)
      setRtId(membership.rt?.id ?? null)

      const monthlyFee = membership.rt?.monthly_fee || 0

      setMonthlyFee(monthlyFee)

      if (!residentId) return

      const [
        approvedData,
        pendingData,
        rejectedData
      ] = await Promise.all([

        getApprovedPayments(
          residentId,
          summaryYear
        ),

        getPendingPayments(
          residentId,
          summaryYear
        ),

        getRejectedPayments(
          residentId,
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

      console.error(err)

    } finally {

      setLoading(false)

    }
  }

  async function loadFormData() {

    if (!residentId) return

    try {

      const [
        approvedData,
        pendingData,
        rejectedData
      ] = await Promise.all([

        getApprovedPayments(
          residentId,
          paymentYear
        ),

        getPendingPayments(
          residentId,
          paymentYear
        ),

        getRejectedPayments(
          residentId,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()

  }, [summaryYear])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFormData()

  }, [paymentYear, residentId])

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
      }: {
        months:  number[]
        year:    number
        file:    File
      }) => {

        if (!residentId || !rtId) return

        try {

          setSubmitting(true)

          await submitPaymentConfirmation({
            residentId,
            rtId,
            year,
            months,
            file,
            monthlyFee,
          })

          await loadData()

        } catch (err) {

          console.error(err)

        } finally {

          setSubmitting(false)

        }

      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [residentId, rtId, monthlyFee]
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