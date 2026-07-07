'use client'

import {
    usePayment
} from './hooks/usePembayaran'

import PembayaranView
    from './PembayaranView'

export default function PembayaranContainer() {

    const payment =
        usePayment()

    return (
        <PembayaranView
            search={payment.search}
            setSearch={payment.setSearch}

            status={payment.status}
            setStatus={payment.setStatus}

            rows={payment.rows}
            reloadData={payment.loadData}
        />
    )
}