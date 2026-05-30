'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";

export default function WargaToolbar({

                                         onAdd,

                                         search,
                                         setSearch,

                                         status,
                                         setStatus,

                                         onExportCSV,
                                         onExportExcel

                                     }) {

    return (

        <PageToolbar

            title="Warga"

            subtitle="Manajemen data warga"

            onCreate={onAdd}

            search={search}
            setSearch={setSearch}

            searchPlaceholder="Cari nama warga..."

            filterValue={status}
            setFilterValue={setStatus}

            filterPlaceholder="Semua Status"

            filterOptions={[

                {
                    label: 'Aktif',
                    value: 'aktif'
                },

                {
                    label: 'Nonaktif',
                    value: 'nonaktif'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

        />

    )
}