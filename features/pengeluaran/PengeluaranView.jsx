'use client'

import PengeluaranToolbar
    from './components/tables/PengeluaranToolbar'

import PengeluaranTable
    from './components/tables/PengeluaranTable'

import PengeluaranDrawer
    from './components/drawer/PengeluaranDrawer'

import PengeluaranForm
    from './components/forms/PengeluaranForm'

export default function PengeluaranView({

                                            /*
                                             |-------------------------------------------------------------
                                             | FILTERS
                                             |-------------------------------------------------------------
                                             */

                                            search,
                                            setSearch,

                                            kategori,
                                            setKategori,

                                            /*
                                             |-------------------------------------------------------------
                                             | DATA
                                             |-------------------------------------------------------------
                                             */

                                            rows,
                                            loading,

                                            /*
                                             |-------------------------------------------------------------
                                             | ACTIONS
                                             |-------------------------------------------------------------
                                             */

                                            selectedRow,

                                            drawerOpen,
                                            formOpen,

                                            openDrawer,
                                            closeDrawer,

                                            openCreateForm,
                                            openEditForm,
                                            closeForm,

                                            submitForm,

                                            removeRow,

                                            exportCSV,
                                            exportExcel

                                        }) {

    return (

        <div
            className="
        space-y-6
      "
        >

            <div
                className="
          flex
          items-center
          justify-between
          gap-3
          flex-wrap
        "
            >

            <PengeluaranToolbar

                search={search}
                setSearch={setSearch}

                kategori={kategori}
                setKategori={setKategori}

                onCreate={
                    openCreateForm
                }

                onExportCSV={() =>
                    exportCSV(rows)
                }

                onExportExcel={() =>
                    exportExcel(rows)
                }

            />

            </div>

            <PengeluaranTable

                rows={rows}

                loading={loading}

                onSelect={
                    openDrawer
                }

                onEdit={
                    openEditForm
                }

                onDelete={
                    removeRow
                }

            />

            <PengeluaranDrawer

                open={
                    drawerOpen
                }

                row={
                    selectedRow
                }

                onClose={
                    closeDrawer
                }

            />

            <PengeluaranForm

                open={
                    formOpen
                }

                initialData={
                    selectedRow
                }

                onClose={
                    closeForm
                }

                onSubmit={
                    submitForm
                }

            />

        </div>
    )
}