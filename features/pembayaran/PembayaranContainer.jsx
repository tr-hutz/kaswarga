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
            search={pembayaran.search}
            setSearch={pembayaran.setSearch}

            kategori={pembayaran.status}
            setKategori={pembayaran.setStatus}

            rows={pembayaran.rows}
            reloadData={pembayaran.loadData}
        />
    )
}