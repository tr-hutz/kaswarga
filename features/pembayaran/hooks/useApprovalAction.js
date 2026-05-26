'use client'

import {
    useState
} from 'react'

import {

    approvePembayaran,

    rejectPembayaran

} from '../../../lib/services/payment.service'

export function useApprovalActions({
                                       onSuccess
                                   } = {}) {

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

            if (onSuccess) {

                onSuccess()
            }

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

            if (onSuccess) {

                onSuccess()
            }

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