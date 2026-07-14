// @ts-nocheck
'use client'

import {
    usePayment
} from './hooks/usePayment'

import PaymentView
    from './PaymentView'

export default function PaymentContainer() {

    const payment =
        usePayment()

    return (
        <PaymentView
            search={payment.search}
            setSearch={payment.setSearch}

            status={payment.status}
            setStatus={payment.setStatus}

            rows={payment.rows}
            loading={payment.loading}
            reloadData={payment.loadData}
        />
    )
}