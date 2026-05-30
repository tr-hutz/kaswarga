'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";

export default function PaymentToolbar({

                                          search,
                                          setSearch,

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

            // filterValue={kategori}
            // setFilterValue={setKategori}

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