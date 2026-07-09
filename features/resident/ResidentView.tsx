// @ts-nocheck
'use client'

import ResidentToolbar
    from './components/tables/ResidentToolbar'

import ResidentTable
    from './components/tables/ResidentTable'

import ResidentDetailDrawer
    from './components/drawer/ResidentDetailDrawer'

import ResidentForm
    from './components/forms/ResidentForm'

import ResidentPendingRequests
    from './components/ResidentPendingRequests'

import ResidentImportModal
    from './components/import/ResidentImportModal'

export default function ResidentView({

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

                                      selectedResident,

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

            <ResidentPendingRequests
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

                <ResidentToolbar

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

            <ResidentTable

                data={data}

                loading={loading}

                onDetail={openDrawer}

                onEdit={openEditForm}

                refresh={refresh}

            />

            <ResidentDetailDrawer

                open={drawerOpen}

                onClose={closeDrawer}

                warga={selectedResident}

            />

            <ResidentForm

                open={formOpen}

                onClose={closeForm}

                warga={selectedResident}

                onSuccess={() => {

                    closeForm()

                    refresh()
                }}

            />

            <ResidentImportModal
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