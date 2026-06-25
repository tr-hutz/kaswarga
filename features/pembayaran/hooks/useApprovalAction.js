'use client'

import {
    useState
} from 'react'

import {

    approvePembayaran,

    rejectPembayaran

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
        konfirmasiId
    ) {

        try {

            setLoading(true)

            await approvePembayaran(
                konfirmasiId
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
        konfirmasiId,
        alasan
    ) {

        try {

            setLoading(true)

            await rejectPembayaran(
                konfirmasiId,
                alasan
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