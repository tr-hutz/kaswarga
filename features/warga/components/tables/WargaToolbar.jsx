'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";

export default function WargaToolbar({

                                         onAdd,

                                         search,
                                         setSearch,

                                         status,
                                         setStatus,

                                         onExportCSV,
                                         onExportExcel,

                                         onImport

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
                    value: 'active'
                },

                {
                    label: 'Nonaktif',
                    value: 'inactive'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

            onImport={onImport}

        />

    )
}