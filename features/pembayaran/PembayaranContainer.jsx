'use client'

import {
    usePembayaran
} from './hooks/usePembayaran'

import PembayaranView
    from './PembayaranView'

import {useKonfirmasiPembayaranRealtime} from "../realtime/useKonfirmasiPembayaran";

export default function PembayaranContainer() {

    const pembayaran =
        usePembayaran()

    useKonfirmasiPembayaranRealtime({

        onReload:
        reloadPending
    })

    return (
        <PembayaranView
            {...pembayaran}
        />
    )


}