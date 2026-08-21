'use client'

import { useMemo }         from 'react'
import { useDataTable }    from '@/lib/hooks/useDataTable'
import { buildImportJobColumns } from './components/ImportJobColumns'
import { useImportManagementData }    from './hooks/useImportManagementData'
import { useImportManagementActions } from './hooks/useImportManagementActions'
import ImportManagementView from './ImportManagementView'

export default function ImportManagementContainer() {
    const { query, setPage, setPageSize, setSearch, setFilter } =
        useDataTable({}, 'importManagement')

    const { result, loading, error, reload } = useImportManagementData(query)

    const actions = useImportManagementActions({ onReload: reload })

    const columns = useMemo(() => buildImportJobColumns(), [])

    return (
        <ImportManagementView
            result={result}
            columns={columns}
            loading={loading}
            error={error}
            onRetry={reload}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            setSearch={setSearch}
            setFilter={setFilter}
            selectedJob={actions.selectedJob}
            detailOpen={actions.detailOpen}
            openDetail={actions.openDetail}
            closeDetail={actions.closeDetail}
            acting={actions.acting}
            onConfirm={actions.handleConfirm}
            onCancel={actions.handleCancel}
            onApprove={actions.handleApprove}
            onReject={actions.handleReject}
            importDialogOpen={actions.importDialogOpen}
            openImportDialog={actions.openImportDialog}
            closeImportDialog={actions.closeImportDialog}
            onJobCreated={reload}
        />
    )
}
