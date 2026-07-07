// @ts-nocheck
'use client'

import WargaToolbar
    from './components/tables/WargaToolbar'

import WargaTable
    from './components/tables/WargaTable'

import WargaDetailDrawer
    from './components/drawer/WargaDetailDrawer'

import WargaForm
    from './components/forms/WargaForm'

import WargaPendingRequests
    from './components/WargaPendingRequests'

import WargaImportModal
    from './components/import/WargaImportModal'

export default function WargaView({

                                      /*
                                       |---------------------------------------------------------------
                                       | DATA
                                       |---------------------------------------------------------------
                                       */
                                      data,
                                      loading,
                                      refresh,

                                      pendingRequests,
                                      pendingLoading,

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
                                      exportExcel,

                                      importOpen,
                                      openImport,
                                      closeImport,
                                      rows: importRows,
                                      fileName: importFileName,
                                      fileRef: importFileRef,
                                      importing,
                                      error: importError,
                                      handleFile,
                                      handleImport,
                                      downloadTemplate,
                                      resetImport,

                                  }) {

    return (

        <div
            className="
        space-y-6
      "
        >

            <WargaPendingRequests
                requests={pendingRequests}
                loading={pendingLoading}
                onAction={refresh}
            />

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

                    onImport={openImport}

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

            <WargaImportModal
                open={importOpen}
                onClose={closeImport}
                rows={importRows}
                fileName={importFileName}
                fileRef={importFileRef}
                importing={importing}
                error={importError}
                onFile={handleFile}
                onImport={handleImport}
                onDownloadTemplate={downloadTemplate}
                onReset={resetImport}
            />

        </div>
    )
}