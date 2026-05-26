'use client'

import {
    useState
} from 'react'

export function usePaymentDetail() {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [
        selectedPayment,
        setSelectedPayment
    ] = useState(null)

    const [
        open,
        setOpen
    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | OPEN
     |-------------------------------------------------------------
     */

    function openDetail(payment) {

        setSelectedPayment(
            payment
        )

        setOpen(true)
    }

    /*
     |-------------------------------------------------------------
     | CLOSE
     |-------------------------------------------------------------
     */

    function closeDetail() {

        setOpen(false)

        setSelectedPayment(
            null
        )
    }

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        open,

        selectedPayment,

        openDetail,

        closeDetail
    }
}