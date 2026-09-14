'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useState
} from 'react'

import {

    approvePayment,

    rejectPayment

} from '@/lib/services/payment.service'

import {
    useToast
} from '@/components/ui/ToastProvider'

import {
    getErrorMessage
} from '@/lib/errors/supabase-errors'

export function useApprovalActions({
                                       onSuccess
                                   }: { onSuccess?: () => void } = {}) {

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
        confirmationId: string
    ) {

        try {

            setLoading(true)

            await approvePayment(
                confirmationId
            )

            toast({
                message: 'Payment approved.',
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
        confirmationId: string,
        reason: string
    ) {

        try {

            setLoading(true)

            await rejectPayment(
                confirmationId,
                reason
            )

            toast({
                message: 'Payment rejected.',
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