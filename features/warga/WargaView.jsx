'use client'

import WargaToolbar
    from './components/tables/WargaToolbar'

import WargaTable
    from './components/tables/WargaTable'

import WargaDetailDrawer
    from './components/drawer/WargaDetailDrawer'

import WargaForm
    from './components/forms/WargaForm'

import ExportButtons
    from './components/exports/ExportButtons'

export default function WargaView({

                                      /*
                                       |---------------------------------------------------------------
                                       | DATA
                                       |---------------------------------------------------------------
                                       */
                                      data,
                                      loading,
                                      refresh,

                                      /*
                                       |---------------------------------------------------------------
                                       | FILTERS
                                       |---------------------------------------------------------------
                                       */

                                      search,
                                      setSearch,

                                      status,
                                      setStatus,

                                      /*
                                       |---------------------------------------------------------------
                                       | ACTIONS
                                       |---------------------------------------------------------------
                                       */

                                      selectedWarga,

                                      drawerOpen,
                                      openDrawer,
                                      closeDrawer,

                                      formOpen,
                                      openCreateForm,
                                      openEditForm,
                                      closeForm,

                                      exportExcel,
                                      exportCSV

                                  }) {

    return (

        <div
            className="
        space-y-5
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

                <WargaToolbar

                    onAdd={openCreateForm}

                    search={search}
                    setSearch={setSearch}

                    status={status}
                    setStatus={setStatus}

                />

                <ExportButtons
                    data={data}
                    onExportExcel={exportExcel}
                    onExportCSV={exportCSV}
                />

            </div>

            <WargaTable

                data={data}

                loading={loading}

                onDetail={openDrawer}

                onEdit={openEditForm}

                refresh={refresh}

            />

            <WargaDetailDrawer

                open={drawerOpen}

                onClose={closeDrawer}

                warga={selectedWarga}

            />

            <WargaForm

                open={formOpen}

                onClose={closeForm}

                warga={selectedWarga}

                onSuccess={() => {

                    closeForm()

                    refresh()
                }}

            />

        </div>
    )
}