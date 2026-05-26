'use client'

import {
    usePembayaran
} from './hooks/usePembayaran'

import PembayaranView
    from './PembayaranView'

export default function PembayaranContainer() {

    const pembayaran =
        usePembayaran()

    return (
        <PembayaranView
            {...pembayaran}
        />
    )
}