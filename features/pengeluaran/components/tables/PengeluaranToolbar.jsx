'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";

export default function PengeluaranToolbar({

                                               search,
                                               setSearch,

                                               kategori,
                                               setKategori,

                                               onCreate,

                                               onExportCSV,
                                               onExportExcel

                                           }) {

    return (

        <PageToolbar

            title="Pengeluaran"

            subtitle="Manajemen pengeluaran RT"

            onCreate={onCreate}

            search={search}
            setSearch={setSearch}

            searchPlaceholder="Cari pengeluaran..."

            filterValue={kategori}
            setFilterValue={setKategori}

            filterPlaceholder="Semua Kategori"

            filterOptions={[

                {
                    label: 'Operasional',
                    value: 'operasional'
                },

                {
                    label: 'Kebersihan',
                    value: 'kebersihan'
                },

                {
                    label: 'Keamanan',
                    value: 'keamanan'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

        />

    )
}