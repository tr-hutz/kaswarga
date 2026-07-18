'use client'

import { useMemo }           from 'react'
import { useTranslations }   from 'next-intl'
import { DataTable }         from '@/components/common/data-table'
import LedgerAnalytics       from './components/analytics/LedgerAnalytics'
import LedgerReport          from './components/LedgerReport'
import LedgerDrawer          from './components/drawer/LedgerDrawer'
import { buildLedgerColumns } from './components/LedgerColumns'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { LedgerRow, LedgerTotals } from './hooks/useLedgerData'

interface Props {
    result:      PageResult<LedgerRow> | null
    totals:      LedgerTotals
    loading:     boolean
    error:       boolean
    onRetry:     () => void
    query:       QueryOptions
    setPage:         (p: number) => void
    setPageSize:     (s: number) => void
    setSearch:       (s: string) => void
    setSort:         (by: string, dir: 'asc' | 'desc') => void
    selectedRow:     LedgerRow | null
    drawerOpen:      boolean
    openDrawer:      (r: LedgerRow) => void
    closeDrawer:     () => void
    exportCSV:       (rows: LedgerRow[]) => void
    exportExcel:     (rows: LedgerRow[]) => void
}

export default function LedgerView({
    result, totals, loading, error, onRetry,
    query, setPage, setPageSize, setSearch, setSort,
    selectedRow, drawerOpen, openDrawer, closeDrawer,
    exportCSV, exportExcel,
}: Props) {
    const t  = useTranslations('ledger')
    const tc = useTranslations('common')

    const data = result?.data ?? []

    const columns = useMemo(
        () => buildLedgerColumns({ t: (k) => t(k as Parameters<typeof t>[0]) }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <div className="space-y-5">
            <LedgerAnalytics
                income={totals.income}
                expense={totals.expense}
                balance={totals.balance}
            />

            <LedgerReport />

            <DataTable
                columns={columns}
                result={result}
                loading={loading}
                error={error}
                query={query}
                searchPlaceholder={t('searchPlaceholder')}
                onSearch={setSearch}
                onSort={setSort}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRetry={onRetry}
                onRowClick={openDrawer}
                renderActions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportExcel(data)}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportExcel')}
                        </button>
                        <button
                            onClick={() => exportCSV(data)}
                            className="px-3 py-2 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas"
                        >
                            {tc('actions.exportCsv')}
                        </button>
                    </div>
                }
            />

            <LedgerDrawer
                open={drawerOpen}
                row={selectedRow}
                onClose={closeDrawer}
            />
        </div>
    )
}
