'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    ] = useState<any>(null)

    const [
        open,
        setOpen
    ] = useState(false)

    /*
     |-------------------------------------------------------------
     | OPEN
     |-------------------------------------------------------------
     */

    function openDetail(payment: any) {

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