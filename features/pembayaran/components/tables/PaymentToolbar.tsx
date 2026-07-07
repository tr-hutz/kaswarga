// @ts-nocheck
'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";

export default function PaymentToolbar({

                                          search,
                                          setSearch,

                                          status,
                                          setStatus,

                                          onExportCSV,
                                          onExportExcel

                                      }) {

    return (

        <PageToolbar

            title="Pembayaran"

            subtitle="Riwayat pembayaran warga"

            search={search}
            setSearch={setSearch}

            searchPlaceholder="Cari pembayaran..."

            filterValue={status}
            setFilterValue={setStatus}

            filterPlaceholder="Semua Kategori"

            filterOptions={[
                {
                    label: 'Menunggu',
                    value: 'pending'
                },

                {
                    label: 'Disetujui',
                    value: 'approved'
                },

                {
                    label: 'Ditolak',
                    value: 'rejected'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

        />

    )
}