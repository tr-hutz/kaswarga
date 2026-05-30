'use client'

import WargaToolbar
    from './components/tables/WargaToolbar'

import WargaTable
    from './components/tables/WargaTable'

import WargaDetailDrawer
    from './components/drawer/WargaDetailDrawer'

import WargaForm
    from './components/forms/WargaForm'

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
        "
            >

                <WargaToolbar

                    onAdd={openCreateForm}

                    search={search}
                    setSearch={setSearch}

                    status={status}
                    setStatus={setStatus}

                    onExportCSV={() => exportCSV(data)}
                    onExportExcel={() => exportExcel(data)}

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