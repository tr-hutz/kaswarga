// @ts-nocheck
'use client'

import ExpenseToolbar    from './components/tables/ExpenseToolbar'
import ExpenseTable      from './components/tables/ExpenseTable'
import ExpenseDrawer     from './components/drawer/ExpenseDrawer'
import ExpenseForm       from './components/forms/ExpenseForm'
import ExpenseImportModal from './components/import/ExpenseImportModal'

export default function ExpenseView({

    /* filters */
    search,
    setSearch,
    category,
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
                <ExpenseToolbar
                    search={search}
                    setSearch={setSearch}
                    category={category}
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

            <ExpenseTable
                rows={rows}
                loading={loading}
                role={role}
                onSelect={openDrawer}
                onEdit={openEditForm}
                onDelete={removeRow}
            />

            <ExpenseDrawer
                open={drawerOpen}
                row={selectedRow}
                role={role}
                onClose={closeDrawer}
                onApprove={approvePengeluaran}
                onReject={rejectPengeluaran}
                approvalLoading={approvalLoading}
            />

            <ExpenseForm
                key={selectedRow?.id ?? 'create'}
                open={formOpen}
                initialData={selectedRow}
                onClose={closeForm}
                onSubmit={submitForm}
            />

            <ExpenseImportModal
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