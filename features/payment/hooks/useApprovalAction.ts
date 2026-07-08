// @ts-nocheck
'use client'

import {
    useState
} from 'react'

import {

    approvePayment,

    rejectPayment

} from '../../../lib/services/payment.service'

import {
    useToast
} from '../../../components/ui/ToastProvider'

import {
    getErrorMessage
} from '../../../lib/errors/supabase-errors'

export function useApprovalActions({
                                       onSuccess
                                   } = {}) {

    const { toast } = useToast()

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [
        loading,
        setLoading
    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | APPROVE
     |-------------------------------------------------------------
     */

    async function approve(
        confirmationId
    ) {

        try {

            setLoading(true)

            await approvePayment(
                confirmationId
            )

            toast({
                message: 'Konfirmasi pembayaran berhasil disetujui.',
                type: 'success'
            })

            if (onSuccess) {

                onSuccess()
            }

        } catch (err) {

            console.error(err)

            toast({
                message: getErrorMessage(err),
                type: 'error'
            })

        } finally {

            setLoading(false)
        }
    }

    /*
     |-------------------------------------------------------------
     | REJECT
     |-------------------------------------------------------------
     */

    async function reject(
        confirmationId,
        reason
    ) {

        try {

            setLoading(true)

            await rejectPayment(
                confirmationId,
                reason
            )

            toast({
                message: 'Konfirmasi pembayaran berhasil ditolak.',
                type: 'success'
            })

            if (onSuccess) {

                onSuccess()
            }

        } catch (err) {

            console.error(err)

            toast({
                message: getErrorMessage(err),
                type: 'error'
            })

        } finally {

            setLoading(false)
        }
    }

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        loading,

        approve,

        reject
    }
}