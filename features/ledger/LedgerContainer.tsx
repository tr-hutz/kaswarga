'use client'

import LedgerView           from './LedgerView'
import { useDataTable }     from '@/hooks/useDataTable'
import { useLedgerData }    from './hooks/useLedgerData'
import { useLedgerActions } from './hooks/useLedgerActions'
import { useLedgerRealtime } from './hooks/useLedgerRealtime'

export default function LedgerContainer() {
    const { query, setPage, setPageSize, setSearch, setSort } =
        useDataTable({}, 'ledger')

    const { result, totals, loading, error, reload } = useLedgerData(query)
    useLedgerRealtime({ onReload: reload })

    const { selectedRow, drawerOpen, openDrawer, closeDrawer, exportCSV, exportExcel } =
        useLedgerActions()

    return (
        <LedgerView
            result={result}
            totals={totals}
            loading={loading}
            error={error}
            onRetry={reload}
            query={query}
            setPage={setPage}
            setPageSize={setPageSize}
            setSearch={setSearch}
            setSort={setSort}
            selectedRow={selectedRow}
            drawerOpen={drawerOpen}
            openDrawer={openDrawer}
            closeDrawer={closeDrawer}
            exportCSV={exportCSV}
            exportExcel={exportExcel}
        />
    )
}
