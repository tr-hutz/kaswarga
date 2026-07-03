'use client'

import PengeluaranToolbar    from './components/tables/PengeluaranToolbar'
import PengeluaranTable      from './components/tables/PengeluaranTable'
import PengeluaranDrawer     from './components/drawer/PengeluaranDrawer'
import PengeluaranForm       from './components/forms/PengeluaranForm'
import PengeluaranImportModal from './components/import/PengeluaranImportModal'

export default function PengeluaranView({

    /* filters */
    search,
    setSearch,
    kategori,
    setKategori,

    /* role */
    role,

    /* data */
    rows,
    loading,

    /* actions */
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
    exportExcel,

    /* import */
    importOpen,
    openImport,
    closeImport,
    importRows,
    fileName: importFileName,
    fileRef: importFileRef,
    importing,
    error: importError,
    handleFile,
    handleImport,
    downloadTemplate,
    resetImport,

    /* approval */
    approvalLoading,
    approvePengeluaran,
    rejectPengeluaran,
    approveAllPengeluaran,

}) {

    const pendingCount = rows.filter(r => r.status === 'pending').length

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <PengeluaranToolbar
                    search={search}
                    setSearch={setSearch}
                    kategori={kategori}
                    setKategori={setKategori}
                    role={role}
                    pendingCount={pendingCount}
                    onApproveAll={approveAllPengeluaran}
                    onCreate={openCreateForm}
                    onExportCSV={() => exportCSV(rows)}
                    onExportExcel={() => exportExcel(rows)}
                    onImport={openImport}
                />
            </div>

            <PengeluaranTable
                rows={rows}
                loading={loading}
                role={role}
                onSelect={openDrawer}
                onEdit={openEditForm}
                onDelete={removeRow}
            />

            <PengeluaranDrawer
                open={drawerOpen}
                row={selectedRow}
                role={role}
                onClose={closeDrawer}
                onApprove={approvePengeluaran}
                onReject={rejectPengeluaran}
                approvalLoading={approvalLoading}
            />

            <PengeluaranForm
                key={selectedRow?.id ?? 'create'}
                open={formOpen}
                initialData={selectedRow}
                onClose={closeForm}
                onSubmit={submitForm}
            />

            <PengeluaranImportModal
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